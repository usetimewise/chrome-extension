import {
  appendActivityEvent as appendBucketedActivityEvent,
  getActivityEventDayMeta as getBucketedActivityEventDayMeta,
  getActivityEvents as getBucketedActivityEvents,
  getActivityEventsForDays as getBucketedActivityEventsForDays,
  getPendingSyncCount as getBucketedPendingSyncCount,
  getPendingSyncEvents as getBucketedPendingSyncEvents,
  getRecentActivityEvents as getRecentBucketedActivityEvents,
  markActivityEventsSynced as markBucketedActivityEventsSynced,
  migrateActivityEventsIfNeeded,
  recategorizeEventsForHost as recategorizeBucketedEventsForHost,
  todayViewActivityDateKeys,
  type ActivityEventsDayMeta
} from "../activity-events-storage.js";
import type { ActivityEvent, Settings } from "../types.js";
import { getSettings } from "./site-rules.js";

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

export async function getPendingSyncEvents(limit?: number, settings?: Settings): Promise<ActivityEvent[]> {
  return getBucketedPendingSyncEvents(settings || await getSettings(), limit);
}

export async function getPendingSyncCount(settings?: Settings): Promise<number> {
  return getBucketedPendingSyncCount(settings || await getSettings());
}

export async function markActivityEventsSynced(eventIds: string[], settings?: Settings): Promise<number> {
  return markBucketedActivityEventsSynced(eventIds, settings || await getSettings());
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
