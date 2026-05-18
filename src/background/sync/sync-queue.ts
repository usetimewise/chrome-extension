import { APP_SETTINGS } from "../../lib/app-settings.js";
import { MESSAGE_TYPES } from "../../lib/constants.js";
import { pushEvents } from "../../lib/api/events.js";
import { registerDevice } from "../../lib/api/devices.js";
import { getQueue, replaceQueue } from "../../lib/storage/activity-events.js";
import { saveDashboardCache } from "../../lib/storage/dashboard-cache.js";
import { getDeviceState, resetDeviceRegistration, saveDeviceState } from "../../lib/storage/device-state.js";
import { getSettings } from "../../lib/storage/site-rules.js";
import { isActiveTrackedEvent } from "../../lib/tracking-diagnostics.js";
import { getErrorMessage } from "../../lib/utils.js";
import type { DeviceState, Settings } from "../../lib/types.js";

export async function applyTrackingSettings(settings: Settings | null = null): Promise<Settings> {
  const resolvedSettings = settings || await getSettings();
  const idleDetectionSeconds = Number(resolvedSettings.idleDetectionSeconds) > 0
    ? Number(resolvedSettings.idleDetectionSeconds)
    : APP_SETTINGS.idleDetectionSeconds;

  await chrome.idle.setDetectionInterval(idleDetectionSeconds);
  return resolvedSettings;
}

function isDeviceRegistrationMismatch(error: unknown): boolean {
  const message = String((error as { message?: string } | null)?.message || "").toLowerCase();
  return message.includes("device is not registered") ||
    message.includes("activity_events_device_id_fkey") ||
    message.includes("preferences_device_id_fkey") ||
    message.includes("focus_sessions_device_id_fkey");
}

export async function ensureDeviceRegistration(force = false): Promise<DeviceState> {
  const settings = await getSettings();
  const deviceState = await getDeviceState();
  if (deviceState.deviceId && !force) {
    return deviceState;
  }

  try {
    const response = await registerDevice(settings.apiBaseUrl, {
      installation_id: deviceState.installationId,
      timezone: settings.timezone,
      locale: chrome.i18n.getUILanguage(),
      platform: navigator.userAgent,
      app_version: chrome.runtime.getManifest().version
    });

    const next: DeviceState = {
      ...deviceState,
      deviceId: response.device_id,
      registeredAt: new Date().toISOString()
    };
    await saveDeviceState(next);
    return next;
  } catch (error) {
    await saveDashboardCache({
      lastError: getErrorMessage(error, "Unable to register device")
    });
    return deviceState;
  }
}

export async function withRegisteredDevice<T>(
  action: (settings: Settings, deviceState: DeviceState) => Promise<T>
): Promise<T> {
  let settings = await getSettings();
  let deviceState = await ensureDeviceRegistration();

  if (!deviceState.deviceId) {
    throw new Error("Device is not registered yet");
  }

  try {
    return await action(settings, deviceState);
  } catch (error) {
    if (!isDeviceRegistrationMismatch(error)) {
      throw error;
    }

    await resetDeviceRegistration();
    settings = await getSettings();
    deviceState = await ensureDeviceRegistration(true);
    if (!deviceState.deviceId) {
      throw error;
    }

    return action(settings, deviceState);
  }
}

export async function syncQueue(): Promise<{ synced: number; queueSize: number }> {
  const storedQueue = await getQueue();
  const queue = storedQueue.filter(isActiveTrackedEvent);
  if (queue.length !== storedQueue.length) {
    await replaceQueue(queue);
  }

  if (queue.length === 0) {
    return { synced: 0, queueSize: queue.length };
  }

  try {
    return await withRegisteredDevice(async (settings, deviceState) => {
      const batch = queue.slice(0, 100);
      const response = await pushEvents(settings.apiBaseUrl, deviceState.deviceId, batch);
      const acceptedIds = new Set(response.accepted_event_ids || []);
      const remaining = queue.filter((item) => !acceptedIds.has(item.event_id));
      await replaceQueue(remaining);
      await saveDashboardCache({
        lastSyncAt: new Date().toISOString(),
        lastError: null
      });

      return {
        synced: acceptedIds.size,
        queueSize: remaining.length
      };
    });
  } catch (error) {
    await saveDashboardCache({
      lastError: getErrorMessage(error, "Unable to sync activity queue")
    });
    return { synced: 0, queueSize: queue.length };
  }
}
