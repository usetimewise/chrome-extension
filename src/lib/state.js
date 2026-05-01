import {
  DEFAULT_DASHBOARD_CACHE,
  DEFAULT_RUNTIME_STATE,
  STORAGE_KEYS
} from "./constants.js";
import { getAppSettings } from "./app-settings.js";
import { generateId } from "./utils.js";
import { getFromStorage, setInStorage } from "./storage.js";

export async function getSettings() {
  return getAppSettings();
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
