import {
  appendActivityEvent as appendBucketedActivityEvent,
  getActivityEventDayMeta as getBucketedActivityEventDayMeta,
  getActivityEvents as getBucketedActivityEvents,
  getActivityEventsForDays as getBucketedActivityEventsForDays,
  getRecentActivityEvents as getRecentBucketedActivityEvents,
  migrateActivityEventsIfNeeded,
  recategorizeEventsForHost as recategorizeBucketedEventsForHost,
  todayViewActivityDateKeys,
  type ActivityEventsDayMeta
} from "../activity-events-storage.js";
import { STORAGE_KEYS } from "../constants.js";
import { eventsEligibleForSync } from "../tracking-diagnostics.js";
import type { ActivityEvent, Settings } from "../types.js";
import { getFromStorage, setInStorage } from "./client.js";
import { getSettings } from "./site-rules.js";

export async function getQueue(): Promise<ActivityEvent[]> {
  return getFromStorage<ActivityEvent[]>(STORAGE_KEYS.queue, []);
}

export async function appendToQueue(event: ActivityEvent): Promise<ActivityEvent[]> {
  if (!eventsEligibleForSync([event]).length) {
    return getQueue();
  }

  const queue = await getQueue();
  queue.push(event);
  await setInStorage(STORAGE_KEYS.queue, queue);
  return queue;
}

export async function replaceQueue(queue: ActivityEvent[]): Promise<ActivityEvent[]> {
  return setInStorage(STORAGE_KEYS.queue, eventsEligibleForSync(queue));
}

export async function getActivityEvents(settings?: Settings): Promise<ActivityEvent[]> {
  return getBucketedActivityEvents(settings || await getSettings());
}

export async function getActivityEventsForDays(dateKeys: string[], settings?: Settings): Promise<ActivityEvent[]> {
  return getBucketedActivityEventsForDays(dateKeys, settings || await getSettings());
}

export async function getTodayViewActivityDateKeys(settings?: Settings, now = new Date()): Promise<string[]> {
  return todayViewActivityDateKeys(settings || await getSettings(), now);
}

export async function getActivityEventDayMeta(
  dateKeys: string[],
  settings?: Settings
): Promise<Record<string, ActivityEventsDayMeta | null>> {
  return getBucketedActivityEventDayMeta(dateKeys, settings || await getSettings());
}

export async function getRecentActivityEvents(days = 7, settings?: Settings): Promise<ActivityEvent[]> {
  return getRecentBucketedActivityEvents(settings || await getSettings(), days);
}

export async function ensureActivityEventsMigration(settings?: Settings): Promise<void> {
  await migrateActivityEventsIfNeeded(settings || await getSettings());
}

export async function appendActivityEvent(event: ActivityEvent, settings?: Settings): Promise<ActivityEvent[]> {
  return appendBucketedActivityEvent(event, settings || await getSettings());
}

export async function recategorizeActivityEventsForHost(
  host: string,
  previousCategory: ActivityEvent["category"],
  nextCategory: ActivityEvent["category"],
  settings?: Settings
): Promise<number> {
  return recategorizeBucketedEventsForHost(
    host,
    previousCategory,
    nextCategory,
    settings || await getSettings()
  );
}
