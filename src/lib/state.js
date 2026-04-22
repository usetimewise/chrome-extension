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
    workdays: settings?.workdays || DEFAULT_SETTINGS.workdays,
    deepWorkBlocks: settings?.deepWorkBlocks || DEFAULT_SETTINGS.deepWorkBlocks,
    excludedHosts: settings?.excludedHosts || DEFAULT_SETTINGS.excludedHosts,
    categoryOverrides: settings?.categoryOverrides || DEFAULT_SETTINGS.categoryOverrides
  };
}

export async function saveSettings(settingsPatch) {
  const settings = await getSettings();
  const next = {
    ...settings,
    ...settingsPatch,
    workdays: settingsPatch.workdays ?? settings.workdays,
    deepWorkBlocks: settingsPatch.deepWorkBlocks ?? settings.deepWorkBlocks,
    excludedHosts: settingsPatch.excludedHosts ?? settings.excludedHosts,
    categoryOverrides: settingsPatch.categoryOverrides ?? settings.categoryOverrides
  };
  await setInStorage(STORAGE_KEYS.settings, next);

  if (settings.apiBaseUrl !== next.apiBaseUrl) {
    await resetDeviceRegistration();
  }

  return next;
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
