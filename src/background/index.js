import {
  DEFAULT_RUNTIME_STATE,
  DISTRACTION_CATEGORIES,
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
  fetchFocusSessionsView,
  fetchInsightsView,
  fetchSitesView,
  fetchTodayView,
  fetchTrendsView,
  pushEvents,
  pushPreferences,
  registerDevice,
  resolveCategories,
  startFocusSession,
  updateFocusSessionState,
  updateSiteRule
} from "../lib/api-client.js";
import {
  generateId,
  hostMatchesRule,
  isTrackableUrl,
  normalizeHost,
  normalizePathHash
} from "../lib/utils.js";

let runtimeState = { ...DEFAULT_RUNTIME_STATE };

async function applyTrackingSettings(settings = null) {
  const resolvedSettings = settings || await getSettings();
  const idleDetectionSeconds = Number(resolvedSettings.idleDetectionSeconds) > 0
    ? Number(resolvedSettings.idleDetectionSeconds)
    : 60;
  await chrome.idle.setDetectionInterval(idleDetectionSeconds);
  return resolvedSettings;
}

async function queryMediaState(tabId) {
  if (!tabId) {
    return false;
  }

  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: MESSAGE_TYPES.getMediaState });
    return response?.isPlayingMedia === true;
  } catch {
    return false;
  }
}

async function boot() {
  runtimeState = await getRuntimeState();
  await applyTrackingSettings();
  await ensureDeviceRegistration();
  await refreshActiveTab();
  ensureAlarms();
  await refreshViews();
}

function ensureAlarms() {
  chrome.alarms.create("heartbeat", { periodInMinutes: 1 });
  chrome.alarms.create("sync", { periodInMinutes: 5 });
}

function isDeviceRegistrationMismatch(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("device is not registered") ||
    message.includes("activity_events_device_id_fkey") ||
    message.includes("preferences_device_id_fkey") ||
    message.includes("focus_sessions_device_id_fkey");
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

  if (settings.excludedHosts.some((rule) => hostMatchesRule(host, rule))) {
    return false;
  }

  if (!runtimeState.isWindowFocused) {
    return false;
  }

  if (runtimeState.idleState === "active") {
    return true;
  }

  return settings.trackMediaWhenIdle && runtimeState.isPlayingMedia;
}

async function flushCurrentSession(reason = "transition", settingsOverride = null) {
  const settings = settingsOverride || await getSettings();
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
    runtimeState.isPlayingMedia = false;
    runtimeState.mediaStateUpdatedAt = new Date().toISOString();
    runtimeState.sessionStartedAt = Date.now();
    await saveRuntimeState(runtimeState);
    return;
  }

  runtimeState.currentHost = normalizeHost(tab.url);
  runtimeState.currentUrl = tab.url;
  runtimeState.currentTabId = tab.id ?? null;
  runtimeState.isPlayingMedia = await queryMediaState(runtimeState.currentTabId);
  runtimeState.mediaStateUpdatedAt = new Date().toISOString();
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

async function refreshViews() {
  try {
    return await withRegisteredDevice(async (settings, deviceState) => {
      const [
        todayView,
        trendsView,
        sitesView,
        insightsView,
        focusSessionsView
      ] = await Promise.all([
        fetchTodayView(settings.apiBaseUrl, deviceState.deviceId),
        fetchTrendsView(settings.apiBaseUrl, deviceState.deviceId),
        fetchSitesView(settings.apiBaseUrl, deviceState.deviceId),
        fetchInsightsView(settings.apiBaseUrl, deviceState.deviceId),
        fetchFocusSessionsView(settings.apiBaseUrl, deviceState.deviceId)
      ]);

      let currentHostCategory = null;
      if (runtimeState.currentHost) {
        const resolved = await resolveCategories(settings.apiBaseUrl, deviceState.deviceId, [runtimeState.currentHost]);
        currentHostCategory = resolved?.categories?.[runtimeState.currentHost] || null;
      }

      return saveDashboardCache({
        todayView,
        trendsView,
        sitesView,
        insightsView,
        focusSessionsView,
        currentHostCategory,
        lastSyncAt: new Date().toISOString(),
        lastError: null
      });
    });
  } catch (error) {
    return saveDashboardCache({
      lastError: error.message
    });
  }
}

async function pushPreferencesToBackend() {
  return withRegisteredDevice(async (settings, deviceState) => {
    const resolvedSettings = await applyTrackingSettings(settings);
    return pushPreferences(settings.apiBaseUrl, deviceState.deviceId, {
      timezone: resolvedSettings.timezone,
      paused: resolvedSettings.trackingPaused,
      idle_detection_seconds: resolvedSettings.idleDetectionSeconds,
      track_media_when_idle: resolvedSettings.trackMediaWhenIdle,
      work_hours_start: resolvedSettings.workHoursStart,
      work_hours_end: resolvedSettings.workHoursEnd,
      workdays: resolvedSettings.workdays,
      deep_work_blocks: resolvedSettings.deepWorkBlocks,
      nudges_enabled: resolvedSettings.nudgesEnabled,
      nudge_sensitivity: resolvedSettings.nudgeSensitivity,
      snooze_minutes: resolvedSettings.snoozeMinutes,
      work_hours_only: resolvedSettings.workHoursOnly,
      ai_insights_enabled: resolvedSettings.aiInsightsEnabled,
      ai_tone: resolvedSettings.aiTone,
      excluded_hosts: resolvedSettings.excludedHosts,
      category_overrides: resolvedSettings.categoryOverrides
    });
  });
}

function driftThresholdMinutes(sensitivity = "balanced") {
  switch (sensitivity) {
    case "gentle":
      return 18;
    case "direct":
      return 6;
    default:
      return 10;
  }
}

function buildPopupModel(cache, settings) {
  const today = cache.todayView;
  const activeSession = cache.focusSessionsView?.active_session || null;
  const currentDwellMs = runtimeState.sessionStartedAt ? Date.now() - runtimeState.sessionStartedAt : 0;
  const currentCategory = cache.currentHostCategory;
  const thresholdMs = driftThresholdMinutes(settings.nudgeSensitivity) * 60 * 1000;
  const isDistractingCurrent = DISTRACTION_CATEGORIES.has(currentCategory);
  const isDrifting = isDistractingCurrent && currentDwellMs >= thresholdMs;

  let state = "empty";
  if (today?.summary?.total_duration_ms > 0) {
    state = "default";
  }
  if (activeSession?.status === "active") {
    state = "focus_active";
  } else if (isDrifting) {
    state = "drifting";
  }

  const focusSession = activeSession
    ? {
        ...activeSession,
        remaining_ms: Math.max(0, (activeSession.planned_minutes * 60 * 1000) - (activeSession.active_duration_ms || 0))
      }
    : null;

  return {
    state,
    statusLabel: today?.status?.label || "Welcome",
    statusMessage: today?.status?.message || "Your focus data will appear here soon.",
    focusedTimeMs: today?.summary?.focus_duration_ms || 0,
    distractedTimeMs: today?.summary?.distraction_duration_ms || 0,
    focusAlignment: today?.summary?.focus_alignment || 0,
    comparisonLabel: today?.comparison?.label || "vs yesterday",
    comparisonValue: today?.comparison?.focus_alignment_delta || 0,
    topCategories: (today?.top_categories || []).slice(0, 3),
    insight: today?.main_insight || {
      title: "Your focus picture is still forming",
      body: "Keep browsing normally. The first useful pattern appears after enough tracked time accumulates."
    },
    currentSite: runtimeState.currentHost
      ? {
          host: runtimeState.currentHost,
          category: currentCategory || "other",
          dwellMs: currentDwellMs
        }
      : null,
    focusSession,
    primaryAction: state === "focus_active"
      ? { type: MESSAGE_TYPES.pauseFocusSession, label: "Pause focus" }
      : { type: MESSAGE_TYPES.startFocusSession, label: state === "drifting" ? "Return to focus" : "Start focus mode" },
    secondaryActions: state === "focus_active"
      ? [{ type: MESSAGE_TYPES.endFocusSession, label: "End session" }]
      : [{ type: "OPEN_DASHBOARD", label: "Open dashboard" }],
    canReclassify: Boolean(runtimeState.currentHost)
  };
}

chrome.runtime.onInstalled.addListener(() => {
  void boot();
});

chrome.runtime.onStartup.addListener(() => {
  void boot();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "heartbeat") {
    await flushCurrentSession("heartbeat");
    return;
  }

  if (alarm.name === "sync") {
    await syncQueue();
    await refreshViews();
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await setActiveFromTab(tab);
  await refreshViews();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId !== runtimeState.currentTabId) {
    return;
  }

  if (changeInfo.url || changeInfo.status === "complete") {
    await setActiveFromTab(tab);
    await refreshViews();
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
          dashboardCache,
          popupModel: buildPopupModel(dashboardCache, settings)
        };
      }
      case MESSAGE_TYPES.refreshViews: {
        await flushCurrentSession("manual-refresh");
        await syncQueue();
        const dashboardCache = await refreshViews();
        const settings = await getSettings();
        return {
          dashboardCache,
          popupModel: buildPopupModel(dashboardCache, settings)
        };
      }
      case MESSAGE_TYPES.syncNow: {
        await flushCurrentSession("manual-sync");
        const sync = await syncQueue();
        const dashboardCache = await refreshViews();
        const settings = await getSettings();
        return {
          sync,
          dashboardCache,
          popupModel: buildPopupModel(dashboardCache, settings)
        };
      }
      case MESSAGE_TYPES.saveSettings: {
        await flushCurrentSession("settings-change", message.previousSettings || null);
        await applyTrackingSettings();
        runtimeState.isPlayingMedia = await queryMediaState(runtimeState.currentTabId);
        runtimeState.mediaStateUpdatedAt = new Date().toISOString();
        runtimeState.sessionStartedAt = Date.now();
        await saveRuntimeState(runtimeState);
        return { ok: true };
      }
      case MESSAGE_TYPES.pushPreferences: {
        const payload = await pushPreferencesToBackend();
        const dashboardCache = await refreshViews();
        return { ok: true, payload, dashboardCache };
      }
      case MESSAGE_TYPES.startFocusSession: {
        const session = await withRegisteredDevice(async (settings, deviceState) => {
          return startFocusSession(settings.apiBaseUrl, deviceState.deviceId, {
            intent: message.intent || "Focus block",
            duration_minutes: Number(message.minutes || 45)
          });
        });
        const dashboardCache = await refreshViews();
        return { ok: true, session, dashboardCache };
      }
      case MESSAGE_TYPES.pauseFocusSession:
      case MESSAGE_TYPES.resumeFocusSession:
      case MESSAGE_TYPES.endFocusSession: {
        const actionMap = {
          [MESSAGE_TYPES.pauseFocusSession]: "pause",
          [MESSAGE_TYPES.resumeFocusSession]: "resume",
          [MESSAGE_TYPES.endFocusSession]: "end"
        };
        const session = await withRegisteredDevice(async (settings, deviceState) => {
          return updateFocusSessionState(settings.apiBaseUrl, deviceState.deviceId, message.sessionId, actionMap[message.type]);
        });
        const dashboardCache = await refreshViews();
        return { ok: true, session, dashboardCache };
      }
      case MESSAGE_TYPES.saveSiteRule: {
        const payload = await withRegisteredDevice(async (settings, deviceState) => {
          return updateSiteRule(settings.apiBaseUrl, deviceState.deviceId, {
            host: message.host,
            category: message.category,
            excluded: Boolean(message.excluded)
          });
        });
        const dashboardCache = await refreshViews();
        return { ok: true, payload, dashboardCache };
      }
      case MESSAGE_TYPES.mediaStateUpdate: {
        if (!sender.tab?.id || sender.tab.id !== runtimeState.currentTabId) {
          return { ok: true, ignored: true };
        }

        const nextState = message.isPlayingMedia === true;
        if (nextState !== runtimeState.isPlayingMedia) {
          await flushCurrentSession("media-state-change");
          runtimeState.sessionStartedAt = Date.now();
        }
        runtimeState.isPlayingMedia = nextState;
        runtimeState.mediaStateUpdatedAt = new Date().toISOString();
        await saveRuntimeState(runtimeState);
        return { ok: true };
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
