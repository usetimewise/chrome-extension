import {
  DEFAULT_DASHBOARD_CACHE,
  DEFAULT_RUNTIME_STATE,
  STORAGE_KEYS
} from "./constants.js";
import {
  appendActivityEvent as appendBucketedActivityEvent,
  getActivityEventDayMeta as getBucketedActivityEventDayMeta,
  getActivityEventsForDays as getBucketedActivityEventsForDays,
  getActivityEvents as getBucketedActivityEvents,
  getRecentActivityEvents as getRecentBucketedActivityEvents,
  getTodayViewActivityEvents as getBucketedTodayViewActivityEvents,
  migrateActivityEventsIfNeeded,
  todayViewActivityDateKeys,
  type ActivityEventsDayMeta
} from "./activity-events-storage.js";
import { getAppSettings } from "./app-settings.js";
import type {
  ActivityEvent,
  Category,
  DashboardCache,
  DeviceState,
  FocusSession,
  RuntimeState,
  Settings,
  SiteRuleState,
  TrackingTransition
} from "./types.js";
import { generateId, hostMatchesRule } from "./utils.js";
import { getFromStorage, setInStorage } from "./storage.js";
import { eventsEligibleForSync, retainTrackingTransitions } from "./tracking-diagnostics.js";

export async function getSettings(): Promise<Settings> {
  const settings = getAppSettings();
  const siteRules = await getSiteRules();
  return {
    ...settings,
    excludedHosts: Array.from(new Set([
      ...settings.excludedHosts,
      ...siteRules.excludedHosts
    ])),
    categoryOverrides: {
      ...settings.categoryOverrides,
      ...siteRules.categoryOverrides
    }
  };
}

export async function getDeviceState(): Promise<DeviceState> {
  const device = await getFromStorage(STORAGE_KEYS.device, null);
  if (device) {
    return device;
  }

  const next = {
    installationId: generateId(),
    deviceId: null,
    registeredAt: null
  };
  await setInStorage(STORAGE_KEYS.device, next);
  return next;
}

export async function saveDeviceState(deviceState: DeviceState): Promise<DeviceState> {
  return setInStorage(STORAGE_KEYS.device, deviceState);
}

export async function resetDeviceRegistration(): Promise<DeviceState> {
  const deviceState = await getDeviceState();
  const next = {
    ...deviceState,
    deviceId: null,
    registeredAt: null
  };
  await setInStorage(STORAGE_KEYS.device, next);
  return next;
}

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

export async function getTodayViewActivityEvents(settings?: Settings): Promise<ActivityEvent[]> {
  return getBucketedTodayViewActivityEvents(settings || await getSettings());
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

export async function getTrackingTransitions(): Promise<TrackingTransition[]> {
  return getFromStorage<TrackingTransition[]>(STORAGE_KEYS.trackingTransitions, []);
}

export async function appendTrackingTransition(transition: TrackingTransition): Promise<TrackingTransition[]> {
  const transitions = await getTrackingTransitions();
  const retained = retainTrackingTransitions(transitions);
  retained.push(transition);
  await setInStorage(STORAGE_KEYS.trackingTransitions, retained);
  return retained;
}

export async function getFocusSessions(): Promise<FocusSession[]> {
  return getFromStorage<FocusSession[]>(STORAGE_KEYS.focusSessions, []);
}

export async function saveFocusSessions(sessions: FocusSession[]): Promise<FocusSession[]> {
  return setInStorage(STORAGE_KEYS.focusSessions, sessions);
}

export async function getSiteRules(): Promise<SiteRuleState> {
  const rules = await getFromStorage<SiteRuleState | null>(STORAGE_KEYS.siteRules, null);
  return {
    excludedHosts: [...(rules?.excludedHosts || [])],
    categoryOverrides: { ...(rules?.categoryOverrides || {}) }
  };
}

export async function saveSiteRule(host: string, category?: Category, excluded = false): Promise<SiteRuleState> {
  const normalizedHost = String(host || "").trim().toLowerCase();
  if (!normalizedHost) {
    throw new Error("host is required");
  }

  const rules = await getSiteRules();
  const excludedHosts = rules.excludedHosts.filter((rule) => !hostMatchesRule(normalizedHost, rule) && rule !== normalizedHost);
  const categoryOverrides = { ...rules.categoryOverrides };
  delete categoryOverrides[normalizedHost];

  if (excluded) {
    excludedHosts.push(normalizedHost);
  } else if (category) {
    categoryOverrides[normalizedHost] = category;
  }

  const next = {
    excludedHosts: Array.from(new Set(excludedHosts)).sort(),
    categoryOverrides
  };
  await setInStorage(STORAGE_KEYS.siteRules, next);
  return next;
}

export async function getDashboardCache(): Promise<DashboardCache> {
  const cached = await getFromStorage<Partial<DashboardCache> | null>(STORAGE_KEYS.dashboardCache, null);
  return {
    ...DEFAULT_DASHBOARD_CACHE,
    ...(cached || {})
  };
}

export async function saveDashboardCache(cachePatch: Partial<DashboardCache>): Promise<DashboardCache> {
  const current = await getDashboardCache();
  const next = {
    ...current,
    ...cachePatch
  };
  return setInStorage(STORAGE_KEYS.dashboardCache, next);
}

export async function getRuntimeState(): Promise<RuntimeState> {
  const runtime = await getFromStorage<Partial<RuntimeState> | null>(STORAGE_KEYS.runtimeState, null);
  return {
    ...DEFAULT_RUNTIME_STATE,
    ...(runtime || {}),
    focusNudgeNotifications: {
      ...DEFAULT_RUNTIME_STATE.focusNudgeNotifications,
      ...(runtime?.focusNudgeNotifications || {}),
      hosts: {
        ...(runtime?.focusNudgeNotifications?.hosts || {})
      }
    }
  };
}

export async function saveRuntimeState(runtimePatch: Partial<RuntimeState>): Promise<RuntimeState> {
  const current = await getRuntimeState();
  const next = {
    ...current,
    ...runtimePatch
  };
  return setInStorage(STORAGE_KEYS.runtimeState, next);
}
