import { STORAGE_KEYS } from "./constants.js";
import type { DayAnalytics } from "./local-analytics.js";
import type { DailyAnalyticsCache } from "./types.js";
import { getFromStorage, setInStorage } from "./storage.js";

export type DayAnalyticsCacheRecord = DailyAnalyticsCache<DayAnalytics>;

export function dailyAnalyticsCacheKey(dateKey: string): string {
  return `${STORAGE_KEYS.activityDailyAnalyticsPrefix}${dateKey}`;
}

export async function getDailyAnalyticsCache(dateKey: string): Promise<DayAnalyticsCacheRecord | null> {
  return getFromStorage<DayAnalyticsCacheRecord | null>(dailyAnalyticsCacheKey(dateKey), null);
}

export async function saveDailyAnalyticsCache(record: DayAnalyticsCacheRecord): Promise<DayAnalyticsCacheRecord> {
  return setInStorage(dailyAnalyticsCacheKey(record.dateKey), record);
}

export function isDailyAnalyticsCacheValid(
  record: DayAnalyticsCacheRecord | null,
  expected: {
    dateKey: string;
    timezone: string;
    settingsFingerprint: string;
    eventFingerprint: string;
  }
): record is DayAnalyticsCacheRecord {
  return Boolean(
    record &&
    record.schemaVersion === 1 &&
    record.dateKey === expected.dateKey &&
    record.timezone === expected.timezone &&
    record.settingsFingerprint === expected.settingsFingerprint &&
    record.eventFingerprint === expected.eventFingerprint &&
    record.analytics?.schemaVersion === 1
  );
}
