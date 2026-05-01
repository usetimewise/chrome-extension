import {
  DEFAULT_DASHBOARD_CACHE,
  DEFAULT_RUNTIME_STATE,
  STORAGE_KEYS
} from "./constants.js";
import { getAppSettings } from "./app-settings.js";
import { generateId, hostMatchesRule } from "./utils.js";
import { getFromStorage, setInStorage } from "./storage.js";

const ACTIVITY_EVENT_RETENTION_DAYS = 30;

export async function getSettings() {
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

export async function getDeviceState() {
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

export async function saveDeviceState(deviceState) {
  return setInStorage(STORAGE_KEYS.device, deviceState);
}

export async function resetDeviceRegistration() {
  const deviceState = await getDeviceState();
  const next = {
    ...deviceState,
    deviceId: null,
    registeredAt: null
  };
  await setInStorage(STORAGE_KEYS.device, next);
  return next;
}

export async function getQueue() {
  return getFromStorage(STORAGE_KEYS.queue, []);
}

export async function appendToQueue(event) {
  const queue = await getQueue();
  queue.push(event);
  await setInStorage(STORAGE_KEYS.queue, queue);
  return queue;
}

export async function replaceQueue(queue) {
  return setInStorage(STORAGE_KEYS.queue, queue);
}

export async function getActivityEvents() {
  return getFromStorage(STORAGE_KEYS.activityEvents, []);
}

export async function appendActivityEvent(event) {
  const events = await getActivityEvents();
  const cutoff = Date.now() - ACTIVITY_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const retained = events.filter((item) => {
    const occurredAt = Date.parse(item.occurred_at || "");
    return !Number.isNaN(occurredAt) && occurredAt >= cutoff;
  });
  retained.push(event);
  await setInStorage(STORAGE_KEYS.activityEvents, retained);
  return retained;
}

export async function getFocusSessions() {
  return getFromStorage(STORAGE_KEYS.focusSessions, []);
}

export async function saveFocusSessions(sessions) {
  return setInStorage(STORAGE_KEYS.focusSessions, sessions);
}

export async function getSiteRules() {
  const rules = await getFromStorage(STORAGE_KEYS.siteRules, null);
  return {
    excludedHosts: [...(rules?.excludedHosts || [])],
    categoryOverrides: { ...(rules?.categoryOverrides || {}) }
  };
}

export async function saveSiteRule(host, category, excluded = false) {
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

export async function getDashboardCache() {
  const cached = await getFromStorage(STORAGE_KEYS.dashboardCache, null);
  return {
    ...DEFAULT_DASHBOARD_CACHE,
    ...(cached || {})
  };
}

export async function saveDashboardCache(cachePatch) {
  const current = await getDashboardCache();
  const next = {
    ...current,
    ...cachePatch
  };
  return setInStorage(STORAGE_KEYS.dashboardCache, next);
}

export async function getRuntimeState() {
  const runtime = await getFromStorage(STORAGE_KEYS.runtimeState, null);
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

export async function saveRuntimeState(runtimePatch) {
  const current = await getRuntimeState();
  const next = {
    ...current,
    ...runtimePatch
  };
  return setInStorage(STORAGE_KEYS.runtimeState, next);
}
