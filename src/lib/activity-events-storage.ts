import { STORAGE_KEYS } from "./constants.js";
import { DAY_MS, localDateKey } from "./local-date.js";
import type { ActivityEvent, Settings } from "./types.js";
import {
  getFromStorage,
  getManyFromStorage,
  removeFromStorage,
  setInStorage,
  setManyInStorage
} from "./storage/client.js";

const ACTIVITY_EVENT_RETENTION_DAYS = 30;

export interface ActivityEventsDayMeta {
  eventCount: number;
  fingerprint: string;
  updatedAt: string;
}

interface ActivityEventsIndex {
  schemaVersion: 2;
  days: string[];
  migratedFromV1: boolean;
  migratedAt: string | null;
  updatedAt: string | null;
  timezone: string | null;
  dayMeta: Record<string, ActivityEventsDayMeta>;
}

let activityEventsMigration: Promise<void> | null = null;
let activityEventsMigrationReady = false;

function emptyIndex(): ActivityEventsIndex {
  return {
    schemaVersion: 2,
    days: [],
    migratedFromV1: false,
    migratedAt: null,
    updatedAt: null,
    timezone: null,
    dayMeta: {}
  };
}

function normalizeIndex(index?: Partial<ActivityEventsIndex> | null): ActivityEventsIndex {
  const days = Array.from(new Set(index?.days || [])).sort();
  const dayMeta = Object.fromEntries(
    Object.entries(index?.dayMeta || {})
      .filter(([dateKey]) => days.includes(dateKey))
  );
  return {
    ...emptyIndex(),
    ...(index || {}),
    schemaVersion: 2,
    days,
    timezone: index?.timezone || null,
    dayMeta
  };
}

export function activityDateKey(date: Date, timezone: string): string {
  return localDateKey(date, timezone);
}

export function activityEventDateKey(event: ActivityEvent, timezone: string): string | null {
  const occurredAt = new Date(event.occurred_at || "");
  if (Number.isNaN(occurredAt.getTime())) {
    return null;
  }
  return activityDateKey(occurredAt, timezone);
}

function activityDayBucketKey(dateKey: string): string {
  return `${STORAGE_KEYS.activityEventsDayPrefix}${dateKey}`;
}

function retentionCutoff(now: number): number {
  return now - ACTIVITY_EVENT_RETENTION_DAYS * DAY_MS;
}

function retainedEvents(events: ActivityEvent[] = [], now = Date.now()): ActivityEvent[] {
  const cutoff = retentionCutoff(now);
  return events.filter((event) => {
    const occurredAt = Date.parse(event.occurred_at || "");
    return !Number.isNaN(occurredAt) && occurredAt >= cutoff;
  });
}

function sortEvents(events: ActivityEvent[]): ActivityEvent[] {
  return [...events].sort((a, b) => Date.parse(a.occurred_at || "") - Date.parse(b.occurred_at || ""));
}

function dedupeEvents(events: ActivityEvent[]): ActivityEvent[] {
  const byId = new Map<string, ActivityEvent>();
  for (const event of events) {
    byId.set(event.event_id || `${event.occurred_at}:${event.host}:${event.duration_ms}`, event);
  }
  return sortEvents(Array.from(byId.values()));
}

export function activityEventsFingerprint(events: ActivityEvent[] = []): string {
  let hash = 2166136261;
  const sorted = sortEvents(events);
  for (const event of sorted) {
    const value = [
      event.event_id || "",
      event.occurred_at || "",
      event.ended_at || "",
      event.duration_ms || 0,
      event.host || "",
      event.tracking_status || "",
      event.category || ""
    ].join("\u0001");
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
  }
  return `${sorted.length}:${(hash >>> 0).toString(16)}`;
}

function dayMetaFor(events: ActivityEvent[], now = Date.now()): ActivityEventsDayMeta {
  return {
    eventCount: events.length,
    fingerprint: activityEventsFingerprint(events),
    updatedAt: new Date(now).toISOString()
  };
}

function groupEventsByDay(events: ActivityEvent[], timezone: string): Map<string, ActivityEvent[]> {
  const grouped = new Map<string, ActivityEvent[]>();
  for (const event of events) {
    const dateKey = activityEventDateKey(event, timezone);
    if (!dateKey) {
      continue;
    }
    grouped.set(dateKey, [...(grouped.get(dateKey) || []), event]);
  }
  return grouped;
}

async function getActivityEventsIndex(): Promise<ActivityEventsIndex> {
  const index = await getFromStorage<Partial<ActivityEventsIndex> | null>(STORAGE_KEYS.activityEventsIndex, null);
  return normalizeIndex(index);
}

async function saveActivityEventsIndex(index: ActivityEventsIndex): Promise<ActivityEventsIndex> {
  return setInStorage(STORAGE_KEYS.activityEventsIndex, normalizeIndex(index));
}

async function readBuckets(dateKeys: string[]): Promise<Record<string, ActivityEvent[]>> {
  return getManyFromStorage<ActivityEvent[]>(dateKeys.map(activityDayBucketKey));
}

async function rebuildIndexMeta(index: ActivityEventsIndex, now = Date.now()): Promise<ActivityEventsIndex> {
  const buckets = await readBuckets(index.days);
  const dayMeta: Record<string, ActivityEventsDayMeta> = {};
  const daysWithEvents: string[] = [];

  for (const dateKey of index.days) {
    const events = dedupeEvents(retainedEvents(buckets[activityDayBucketKey(dateKey)] || [], now));
    if (!events.length) {
      await removeFromStorage(activityDayBucketKey(dateKey));
      continue;
    }
    dayMeta[dateKey] = dayMetaFor(events, now);
    daysWithEvents.push(dateKey);
  }

  return saveActivityEventsIndex({
    ...index,
    days: daysWithEvents,
    dayMeta,
    updatedAt: new Date(now).toISOString()
  });
}

async function rebucketForTimezone(index: ActivityEventsIndex, timezone: string, now = Date.now()): Promise<ActivityEventsIndex> {
  const buckets = await readBuckets(index.days);
  const retained = retainedEvents(
    index.days.flatMap((dateKey) => buckets[activityDayBucketKey(dateKey)] || []),
    now
  );
  const grouped = groupEventsByDay(retained, timezone);
  const dateKeys = Array.from(grouped.keys()).sort();
  const writes: Record<string, ActivityEvent[] | ActivityEventsIndex> = {};
  const dayMeta: Record<string, ActivityEventsDayMeta> = {};

  for (const dateKey of dateKeys) {
    const events = dedupeEvents(grouped.get(dateKey) || []);
    writes[activityDayBucketKey(dateKey)] = events;
    dayMeta[dateKey] = dayMetaFor(events, now);
  }

  const staleDays = index.days.filter((dateKey) => !dateKeys.includes(dateKey));
  await Promise.all(staleDays.map((dateKey) => removeFromStorage(activityDayBucketKey(dateKey))));

  const nextIndex = normalizeIndex({
    ...index,
    days: dateKeys,
    timezone,
    dayMeta,
    updatedAt: new Date(now).toISOString()
  });
  writes[STORAGE_KEYS.activityEventsIndex] = nextIndex;
  await setManyInStorage(writes);
  return nextIndex;
}

async function ensureActivityEventsIndexForSettings(
  settings: Partial<Settings> = {},
  now = Date.now()
): Promise<ActivityEventsIndex> {
  const timezone = settings.timezone || "UTC";
  const index = await getActivityEventsIndex();

  if (index.timezone && index.timezone !== timezone) {
    return rebucketForTimezone(index, timezone, now);
  }

  if (!index.timezone || index.days.some((dateKey) => !index.dayMeta[dateKey])) {
    return rebuildIndexMeta({
      ...index,
      timezone
    }, now);
  }

  return index;
}

async function pruneActivityEventBuckets(settings: Partial<Settings> = {}, now = Date.now()): Promise<ActivityEventsIndex> {
  const timezone = settings.timezone || "UTC";
  const index = await ensureActivityEventsIndexForSettings(settings, now);
  const cutoff = retentionCutoff(now);
  const retainedDays = index.days.filter((dateKey) => {
    const dayEnd = Date.parse(`${dateKey}T23:59:59.999Z`);
    return !Number.isNaN(dayEnd) && dayEnd >= cutoff - DAY_MS;
  });
  const staleDays = index.days.filter((dateKey) => !retainedDays.includes(dateKey));

  await Promise.all(staleDays.map((dateKey) => removeFromStorage(activityDayBucketKey(dateKey))));

  const existing = await readBuckets(retainedDays);
  const writes: Record<string, ActivityEvent[]> = {};
  const dayMeta: Record<string, ActivityEventsDayMeta> = {};
  const daysWithEvents: string[] = [];

  for (const dateKey of retainedDays) {
    const key = activityDayBucketKey(dateKey);
    const retained = retainedEvents(existing[key] || [], now);
    if (retained.length) {
      writes[key] = dedupeEvents(retained);
      dayMeta[dateKey] = dayMetaFor(writes[key], now);
      daysWithEvents.push(dateKey);
    } else {
      await removeFromStorage(key);
    }
  }

  if (Object.keys(writes).length) {
    await setManyInStorage(writes);
  }

  return saveActivityEventsIndex({
    ...index,
    days: daysWithEvents,
    timezone,
    dayMeta,
    updatedAt: new Date(now).toISOString()
  });
}

async function pruneActivityEventIndex(now = Date.now()): Promise<ActivityEventsIndex> {
  const index = await getActivityEventsIndex();
  const cutoff = retentionCutoff(now);
  const retainedDays = index.days.filter((dateKey) => {
    const dayEnd = Date.parse(`${dateKey}T23:59:59.999Z`);
    return !Number.isNaN(dayEnd) && dayEnd >= cutoff - DAY_MS;
  });
  const staleDays = index.days.filter((dateKey) => !retainedDays.includes(dateKey));

  await Promise.all(staleDays.map((dateKey) => removeFromStorage(activityDayBucketKey(dateKey))));
  const dayMeta = { ...index.dayMeta };
  for (const dateKey of staleDays) {
    delete dayMeta[dateKey];
  }

  return saveActivityEventsIndex({
    ...index,
    days: retainedDays,
    dayMeta,
    updatedAt: new Date(now).toISOString()
  });
}

async function migrateActivityEventsNow(settings: Partial<Settings> = {}, now = Date.now()): Promise<void> {
  const timezone = settings.timezone || "UTC";
  const index = await getActivityEventsIndex();

  if (index.migratedFromV1) {
    await removeFromStorage(STORAGE_KEYS.activityEvents);
    await pruneActivityEventBuckets(settings, now);
    return;
  }

  const legacyEvents = await getFromStorage<ActivityEvent[] | null>(STORAGE_KEYS.activityEvents, null);
  if (!Array.isArray(legacyEvents)) {
    await saveActivityEventsIndex({
      ...index,
      migratedFromV1: true,
      migratedAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      timezone
    });
    await pruneActivityEventBuckets(settings, now);
    return;
  }

  const grouped = groupEventsByDay(retainedEvents(legacyEvents, now), timezone);
  const dateKeys = Array.from(grouped.keys()).sort();
  const bucketKeys = dateKeys.map(activityDayBucketKey);
  const existingBuckets = await getManyFromStorage<ActivityEvent[]>(bucketKeys);
  const writes: Record<string, ActivityEvent[]> = {};
  const dayMeta: Record<string, ActivityEventsDayMeta> = {};

  for (const dateKey of dateKeys) {
    const key = activityDayBucketKey(dateKey);
    writes[key] = dedupeEvents([
      ...(existingBuckets[key] || []),
      ...(grouped.get(dateKey) || [])
    ]);
    dayMeta[dateKey] = dayMetaFor(writes[key], now);
  }

  const nextIndex = normalizeIndex({
    ...index,
    days: [...index.days, ...dateKeys],
    migratedFromV1: true,
    migratedAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    timezone,
    dayMeta: {
      ...index.dayMeta,
      ...dayMeta
    }
  });

  await setManyInStorage({
    ...writes,
    [STORAGE_KEYS.activityEventsIndex]: nextIndex
  });
  await removeFromStorage(STORAGE_KEYS.activityEvents);
  await pruneActivityEventBuckets(settings, now);
}

export function migrateActivityEventsIfNeeded(settings: Partial<Settings> = {}, now = Date.now()): Promise<void> {
  if (activityEventsMigrationReady) {
    return ensureActivityEventsIndexForSettings(settings, now).then((): void => undefined);
  }

  if (!activityEventsMigration) {
    activityEventsMigration = migrateActivityEventsNow(settings, now)
      .then(() => {
        activityEventsMigrationReady = true;
        return ensureActivityEventsIndexForSettings(settings, now);
      })
      .then((): void => undefined)
      .finally(() => {
        activityEventsMigration = null;
      });
  }
  return activityEventsMigration;
}

export function resetActivityEventsStorageStateForTests(): void {
  activityEventsMigration = null;
  activityEventsMigrationReady = false;
}

export function todayViewActivityDateKeys(settings: Partial<Settings> = {}, now = new Date()): string[] {
  const timezone = settings.timezone || "UTC";
  return [
    activityDateKey(now, timezone),
    activityDateKey(new Date(now.getTime() - DAY_MS), timezone)
  ];
}

export async function getActivityEventsForDays(
  dateKeys: string[],
  settings: Partial<Settings> = {},
  now = Date.now()
): Promise<ActivityEvent[]> {
  await migrateActivityEventsIfNeeded(settings, now);
  const timezone = settings.timezone || "UTC";
  const requestedDays = Array.from(new Set(dateKeys)).sort();
  const index = await getActivityEventsIndex();
  const values = await readBuckets(requestedDays);
  const events = requestedDays.flatMap((dateKey) => (
    retainedEvents(values[activityDayBucketKey(dateKey)] || [], now)
      .filter((event) => index.timezone === timezone || activityEventDateKey(event, timezone) === dateKey)
  ));
  return dedupeEvents(events);
}

export async function getActivityEventDayMeta(
  dateKeys: string[],
  settings: Partial<Settings> = {},
  now = Date.now()
): Promise<Record<string, ActivityEventsDayMeta | null>> {
  await migrateActivityEventsIfNeeded(settings, now);
  const index = await getActivityEventsIndex();
  return Object.fromEntries(
    dateKeys.map((dateKey) => [dateKey, index.dayMeta[dateKey] || null])
  );
}

export async function getTodayViewActivityEvents(
  settings: Partial<Settings> = {},
  now = new Date()
): Promise<ActivityEvent[]> {
  return getActivityEventsForDays(todayViewActivityDateKeys(settings, now), settings, now.getTime());
}

export async function getRecentActivityEvents(
  settings: Partial<Settings> = {},
  days = 7,
  now = new Date()
): Promise<ActivityEvent[]> {
  const timezone = settings.timezone || "UTC";
  const requestedDays = Array.from({ length: days }, (_, index) => (
    activityDateKey(new Date(now.getTime() - index * DAY_MS), timezone)
  ));
  return getActivityEventsForDays(requestedDays, settings, now.getTime());
}

export async function getActivityEvents(
  settings: Partial<Settings> = {},
  now = Date.now()
): Promise<ActivityEvent[]> {
  await migrateActivityEventsIfNeeded(settings, now);
  const index = await getActivityEventsIndex();
  return getActivityEventsForDays(index.days, settings, now);
}

export async function appendActivityEvent(
  event: ActivityEvent,
  settings: Partial<Settings> = {},
  now = Date.now()
): Promise<ActivityEvent[]> {
  await migrateActivityEventsIfNeeded(settings, now);

  const timezone = settings.timezone || "UTC";
  const dateKey = activityEventDateKey(event, timezone);
  if (!dateKey) {
    return [];
  }

  const key = activityDayBucketKey(dateKey);
  const [index, current] = await Promise.all([
    getActivityEventsIndex(),
    getFromStorage<ActivityEvent[]>(key, [])
  ]);
  const nextBucket = retainedEvents(dedupeEvents([...current, event]), now);
  const nextIndex = normalizeIndex({
    ...index,
    days: [...index.days, dateKey],
    timezone,
    dayMeta: {
      ...index.dayMeta,
      [dateKey]: dayMetaFor(nextBucket, now)
    },
    updatedAt: new Date(now).toISOString()
  });

  await setManyInStorage({
    [key]: nextBucket,
    [STORAGE_KEYS.activityEventsIndex]: nextIndex
  });
  await pruneActivityEventIndex(now);
  return nextBucket;
}
