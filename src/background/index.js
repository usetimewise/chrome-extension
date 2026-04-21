import {
  DEFAULT_RUNTIME_STATE,
  MESSAGE_TYPES
} from "../lib/constants.js";
import {
  appendToQueue,
  getDashboardCache,
  getDeviceState,
  getQueue,
  getRuntimeState,
  getSettings,
  replaceQueue,
  resetDeviceRegistration,
  saveDashboardCache,
  saveDeviceState,
  saveRuntimeState
} from "../lib/state.js";
import {
  fetchRecommendations,
  fetchSummary,
  fetchTimeseries,
  pushEvents,
  pushPreferences,
  registerDevice
} from "../lib/api-client.js";
import {
  generateId,
  hostMatchesRule,
  isTrackableUrl,
  normalizeHost,
  normalizePathHash
} from "../lib/utils.js";

let runtimeState = { ...DEFAULT_RUNTIME_STATE };

async function boot() {
  runtimeState = await getRuntimeState();
  await getSettings();
  await chrome.idle.setDetectionInterval(60);
  await ensureDeviceRegistration();
  await refreshActiveTab();
  ensureAlarms();
}

function ensureAlarms() {
  chrome.alarms.create("heartbeat", { periodInMinutes: 1 });
  chrome.alarms.create("sync", { periodInMinutes: 5 });
}

function isDeviceRegistrationMismatch(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("device is not registered") ||
    message.includes("activity_events_device_id_fkey") ||
    message.includes("preferences_device_id_fkey");
}

async function ensureDeviceRegistration(force = false) {
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

    const next = {
      ...deviceState,
      deviceId: response.device_id,
      registeredAt: new Date().toISOString()
    };
    await saveDeviceState(next);
    return next;
  } catch (error) {
    await saveDashboardCache({
      lastError: error.message
    });
    return deviceState;
  }
}

async function withRegisteredDevice(action) {
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

function isTrackingEligible(host, settings) {
  if (!host || settings.trackingPaused) {
    return false;
  }

  if (!runtimeState.isWindowFocused || runtimeState.idleState !== "active") {
    return false;
  }

  if (settings.blockList.some((rule) => hostMatchesRule(host, rule))) {
    return false;
  }

  if (settings.allowList.length > 0 && !settings.allowList.some((rule) => hostMatchesRule(host, rule))) {
    return false;
  }

  return true;
}

async function flushCurrentSession(reason = "transition") {
  const settings = await getSettings();
  const startedAt = runtimeState.sessionStartedAt;

  if (!startedAt) {
    runtimeState.sessionStartedAt = Date.now();
    await saveRuntimeState(runtimeState);
    return;
  }

  const now = Date.now();
  const durationMs = now - startedAt;

  if (durationMs > 0 && isTrackingEligible(runtimeState.currentHost, settings)) {
    await appendToQueue({
      event_id: generateId(),
      occurred_at: new Date(startedAt).toISOString(),
      duration_ms: durationMs,
      url: runtimeState.currentUrl,
      host: runtimeState.currentHost,
      path_hash: normalizePathHash(runtimeState.currentUrl),
      window_focused: runtimeState.isWindowFocused,
      idle_state: runtimeState.idleState,
      client_version: chrome.runtime.getManifest().version,
      reason
    });
  }

  runtimeState.sessionStartedAt = now;
  await saveRuntimeState(runtimeState);
}

async function setActiveFromTab(tab) {
  await flushCurrentSession("active-tab-change");

  if (!tab || !isTrackableUrl(tab.url)) {
    runtimeState.currentHost = null;
    runtimeState.currentUrl = null;
    runtimeState.currentTabId = tab?.id ?? null;
    runtimeState.sessionStartedAt = Date.now();
    await saveRuntimeState(runtimeState);
    return;
  }

  runtimeState.currentHost = normalizeHost(tab.url);
  runtimeState.currentUrl = tab.url;
  runtimeState.currentTabId = tab.id ?? null;
  runtimeState.sessionStartedAt = Date.now();
  await saveRuntimeState(runtimeState);
}

async function refreshActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  await setActiveFromTab(tab);
}

async function syncQueue() {
  const queue = await getQueue();

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
      lastError: error.message
    });
    return { synced: 0, queueSize: queue.length };
  }
}

async function refreshDashboard(range = "today") {
  try {
    return await withRegisteredDevice(async (settings, deviceState) => {
      const [summary, timeseries, recommendations] = await Promise.all([
        fetchSummary(settings.apiBaseUrl, deviceState.deviceId, range),
        fetchTimeseries(settings.apiBaseUrl, deviceState.deviceId, range),
        fetchRecommendations(settings.apiBaseUrl, deviceState.deviceId, range)
      ]);

      return saveDashboardCache({
        summary,
        timeseries: timeseries.points || [],
        recommendations: recommendations.items || [],
        lastSyncAt: new Date().toISOString(),
        lastError: null,
        range
      });
    });
  } catch (error) {
    return saveDashboardCache({
      lastError: error.message,
      range
    });
  }
}

async function pushPreferencesToBackend() {
  return withRegisteredDevice((settings, deviceState) => {
    return pushPreferences(settings.apiBaseUrl, deviceState.deviceId, {
      timezone: settings.timezone,
      paused: settings.trackingPaused,
      limits: settings.limits,
      allow_list: settings.allowList,
      block_list: settings.blockList,
      category_overrides: settings.categoryOverrides
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  boot();
});

chrome.runtime.onStartup.addListener(() => {
  boot();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "heartbeat") {
    await flushCurrentSession("heartbeat");
    return;
  }

  if (alarm.name === "sync") {
    await syncQueue();
    await refreshDashboard();
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await setActiveFromTab(tab);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId !== runtimeState.currentTabId) {
    return;
  }

  if (changeInfo.url || changeInfo.status === "complete") {
    await setActiveFromTab(tab);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await flushCurrentSession("window-focus");
  runtimeState.isWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
  runtimeState.sessionStartedAt = Date.now();
  await saveRuntimeState(runtimeState);

  if (runtimeState.isWindowFocused) {
    await refreshActiveTab();
  }
});

chrome.idle.onStateChanged.addListener(async (newState) => {
  await flushCurrentSession("idle-change");
  runtimeState.idleState = newState;
  runtimeState.sessionStartedAt = Date.now();
  await saveRuntimeState(runtimeState);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = async () => {
    switch (message?.type) {
      case MESSAGE_TYPES.getBootstrap: {
        const [settings, device, dashboardCache, queue] = await Promise.all([
          getSettings(),
          getDeviceState(),
          getDashboardCache(),
          getQueue()
        ]);

        return {
          settings,
          device,
          queueSize: queue.length,
          runtimeState,
          dashboardCache
        };
      }
      case MESSAGE_TYPES.refreshDashboard: {
        await flushCurrentSession("manual-refresh");
        await syncQueue();
        return refreshDashboard(message.range || "today");
      }
      case MESSAGE_TYPES.syncNow: {
        await flushCurrentSession("manual-sync");
        const sync = await syncQueue();
        const dashboard = await refreshDashboard(message.range || "today");
        return {
          sync,
          dashboard
        };
      }
      case MESSAGE_TYPES.saveSettings: {
        const saved = await saveRuntimeState(runtimeState);
        void saved;
        return { ok: true };
      }
      case MESSAGE_TYPES.pushPreferences: {
        const payload = await pushPreferencesToBackend();
        return { ok: true, payload };
      }
      default:
        return { ok: false, error: "Unknown message type" };
    }
  };

  handler()
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

chrome.runtime.onSuspend.addListener(() => {
  void flushCurrentSession("suspend");
});

void boot();
