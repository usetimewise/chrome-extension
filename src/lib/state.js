import {
  DEFAULT_DASHBOARD_CACHE,
  DEFAULT_RUNTIME_STATE,
  DEFAULT_SETTINGS,
  STORAGE_KEYS
} from "./constants.js";
import { generateId } from "./utils.js";
import { getFromStorage, setInStorage } from "./storage.js";

export async function getSettings() {
  const settings = await getFromStorage(STORAGE_KEYS.settings, null);
  return {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
    limits: {
      ...DEFAULT_SETTINGS.limits,
      ...(settings?.limits || {})
    },
    allowList: settings?.allowList || DEFAULT_SETTINGS.allowList,
    blockList: settings?.blockList || DEFAULT_SETTINGS.blockList,
    categoryOverrides: settings?.categoryOverrides || DEFAULT_SETTINGS.categoryOverrides
  };
}

export async function saveSettings(settingsPatch) {
  const settings = await getSettings();
  const next = {
    ...settings,
    ...settingsPatch,
    limits: {
      ...settings.limits,
      ...(settingsPatch.limits || {})
    },
    allowList: settingsPatch.allowList ?? settings.allowList,
    blockList: settingsPatch.blockList ?? settings.blockList,
    categoryOverrides: settingsPatch.categoryOverrides ?? settings.categoryOverrides
  };
  return setInStorage(STORAGE_KEYS.settings, next);
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
    ...(runtime || {})
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
