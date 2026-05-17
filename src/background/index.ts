import {
  CATEGORY_LABELS,
  DEFAULT_RUNTIME_STATE,
  DISTRACTION_CATEGORIES,
  MESSAGE_TYPES
} from "../lib/constants.js";
import {
  APP_SETTINGS,
  NUDGE_SENSITIVITY_THRESHOLDS_MINUTES
} from "../lib/app-settings.js";
import {
  appendActivityEvent,
  appendToQueue,
  appendTrackingTransition,
  ensureActivityEventsMigration,
  getActivityEvents,
  getActivityEventDayMeta,
  getActivityEventsForDays,
  getDashboardCache,
  getDeviceState,
  getFocusSessions,
  getQueue,
  getRecentActivityEvents,
  getRuntimeState,
  getSettings,
  getSiteRules,
  getTodayViewActivityDateKeys,
  getTrackingTransitions,
  replaceQueue,
  resetDeviceRegistration,
  saveDashboardCache,
  saveDeviceState,
  saveFocusSessions,
  saveSiteRule as saveLocalSiteRule,
  saveRuntimeState
} from "../lib/state.js";
import {
  pushEvents,
  registerDevice,
  updateSiteRule
} from "../lib/api-client.js";
import {
  buildAnalyticsSettingsFingerprint,
  buildDayAnalytics,
  buildSitesView,
  buildTodayViewFromDayAnalytics,
  type DayAnalytics,
  resolveCategory
} from "../lib/local-analytics.js";
import {
  getDailyAnalyticsCache,
  isDailyAnalyticsCacheValid,
  saveDailyAnalyticsCache
} from "../lib/daily-analytics-cache.js";
import {
  buildFocusSessionsView,
  startFocusSession,
  transitionFocusSession
} from "../lib/local-focus-sessions.js";
import {
  generateId,
  hostMatchesRule,
  isTrackableUrl,
  normalizeHost,
  normalizePathHash
} from "../lib/utils.js";
import {
  isActiveTrackedEvent,
  splitTrackedIntervalForGap
} from "../lib/tracking-diagnostics.js";
import type {
  ActivityEvent,
  BootstrapResponse,
  Category,
  DashboardCache,
  DeviceState,
  FocusSession,
  PopupModel,
  RuntimeState,
  Settings,
  TrackingStatus,
  TrackingTransitionType
} from "../lib/types.js";

let runtimeState: RuntimeState = {
  ...DEFAULT_RUNTIME_STATE,
  focusNudgeNotifications: {
    ...DEFAULT_RUNTIME_STATE.focusNudgeNotifications,
    hosts: {}
  }
};
let flushQueue: Promise<void> = Promise.resolve();

async function applyTrackingSettings(settings = null) {
  const resolvedSettings = settings || await getSettings();
  const idleDetectionSeconds = Number(resolvedSettings.idleDetectionSeconds) > 0
    ? Number(resolvedSettings.idleDetectionSeconds)
    : APP_SETTINGS.idleDetectionSeconds;
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

function safeTabUrl(tab) {
  return typeof tab?.url === "string" ? tab.url : null;
}

function classifyUrl(url): { status: TrackingStatus; host: string | null; safeUrl: string | null } {
  if (isTrackableUrl(url)) {
    return {
      status: "active_tracked",
      host: normalizeHost(url),
      safeUrl: url
    };
  }

  if (typeof url !== "string" || !url) {
    return { status: "unknown_url", host: "unknown_url", safeUrl: null };
  }

  if (url.startsWith("chrome-extension://")) {
    return { status: "restricted_page", host: "extension_page", safeUrl: null };
  }

  if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
    return { status: "restricted_page", host: "browser_internal", safeUrl: null };
  }

  if (url.startsWith("file://")) {
    return { status: "restricted_page", host: "file_page", safeUrl: null };
  }

  return { status: "unknown_url", host: "unknown_url", safeUrl: null };
}

function transitionUrlClass(): "trackable" | TrackingStatus {
  if (runtimeState.currentHost && isTrackableUrl(runtimeState.currentUrl)) {
    return "trackable";
  }
  if (["browser_internal", "extension_page", "file_page"].includes(runtimeState.currentHost || "")) {
    return "restricted_page";
  }
  if (runtimeState.currentHost === "unknown_url") {
    return "unknown_url";
  }
  return classifyUrl(runtimeState.currentUrl).status;
}

async function logTransition(type: TrackingTransitionType, reason: string = type, overrides = {}) {
  await appendTrackingTransition({
    id: generateId(),
    type,
    occurred_at: new Date().toISOString(),
    tab_id: runtimeState.currentTabId,
    window_id: runtimeState.currentWindowId ?? null,
    url_class: transitionUrlClass(),
    host: runtimeState.currentHost,
    window_focused: runtimeState.isWindowFocused,
    idle_state: runtimeState.idleState,
    is_playing_media: runtimeState.isPlayingMedia,
    reason,
    ...overrides
  });
}

function trackingStatusForCurrentState(settings: Settings): TrackingStatus {
  if (settings.trackingPaused) {
    return "tracking_paused";
  }

  if (!runtimeState.isWindowFocused) {
    return "browser_unfocused";
  }

  if (runtimeState.idleState === "locked") {
    return "locked";
  }

  if (runtimeState.idleState === "idle" && !(settings.trackMediaWhenIdle && runtimeState.isPlayingMedia)) {
    return "idle";
  }

  if (!runtimeState.currentHost || !isTrackableUrl(runtimeState.currentUrl)) {
    if (["browser_internal", "extension_page", "file_page"].includes(runtimeState.currentHost || "")) {
      return "restricted_page";
    }
    if (runtimeState.currentHost === "unknown_url") {
      return "unknown_url";
    }
    return classifyUrl(runtimeState.currentUrl).status;
  }

  if (settings.excludedHosts.some((rule) => hostMatchesRule(runtimeState.currentHost, rule))) {
    return "excluded";
  }

  return "active_tracked";
}

function eventHostForStatus(status: TrackingStatus): string | null {
  if (runtimeState.currentHost) {
    return runtimeState.currentHost;
  }

  if (status === "restricted_page" || status === "unknown_url") {
    return classifyUrl(runtimeState.currentUrl).host;
  }

  return null;
}

async function boot() {
  runtimeState = await getRuntimeState();
  const now = Date.now();
  runtimeState.lastObservedAt = now;
  runtimeState.sessionStartedAt = runtimeState.sessionStartedAt || now;
  const settings = await applyTrackingSettings();
  await ensureActivityEventsMigration(settings);
  void ensureDeviceRegistration();
  await refreshActiveTab();
  ensureAlarms();
  await logTransition("startup");
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

async function withRegisteredDevice<T>(action: (settings: Settings, deviceState: DeviceState) => Promise<T>): Promise<T> {
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
  const nextFlush = flushQueue.then(() => flushCurrentSessionNow(reason, settingsOverride));
  flushQueue = nextFlush.catch(() => undefined);
  return nextFlush;
}

async function flushCurrentSessionNow(reason = "transition", settingsOverride = null) {
  const settings = settingsOverride || await getSettings();
  const startedAt = runtimeState.sessionStartedAt;
  const now = Date.now();
  runtimeState.lastObservedAt = now;

  if (!startedAt) {
    runtimeState.sessionStartedAt = now;
    await saveRuntimeState(runtimeState);
    return;
  }

  const durationMs = now - startedAt;
  const status = trackingStatusForCurrentState(settings);
  const category = runtimeState.currentHost
    ? resolveCategory(runtimeState.currentHost, settings)
    : undefined;
  const effectiveStatus = status === "active_tracked" && category === "excluded"
    ? "excluded"
    : status;
  const host = eventHostForStatus(effectiveStatus);
  const safeUrl = isTrackableUrl(runtimeState.currentUrl) && effectiveStatus === "active_tracked"
    ? runtimeState.currentUrl
    : null;
  const pathHash = safeUrl ? normalizePathHash(safeUrl) : "";

  for (const interval of splitTrackedIntervalForGap(
    startedAt,
    now,
    effectiveStatus,
    runtimeState.lastHeartbeatAt
  )) {
    const event: ActivityEvent = {
      event_id: generateId(),
      occurred_at: new Date(interval.startedAt).toISOString(),
      ended_at: new Date(interval.endedAt).toISOString(),
      duration_ms: interval.durationMs,
      url: interval.status === "active_tracked" ? safeUrl : null,
      host,
      path_hash: interval.status === "active_tracked" ? pathHash : "",
      window_focused: runtimeState.isWindowFocused,
      idle_state: runtimeState.idleState,
      is_playing_media: runtimeState.isPlayingMedia,
      gap_ms: interval.gapMs,
      window_id: runtimeState.currentWindowId ?? null,
      tab_id: runtimeState.currentTabId,
      tracking_status: interval.status,
      client_version: chrome.runtime.getManifest().version,
      category: interval.status === "active_tracked" ? category : undefined,
      reason
    };
    await appendActivityEvent(event, settings);
    if (isActiveTrackedEvent(event)) {
      await appendToQueue(event);
    }
  }

  runtimeState.sessionStartedAt = now;
  await saveRuntimeState(runtimeState);
}

async function setActiveFromTab(tab) {
  await flushCurrentSession("active-tab-change");
  const tabUrl = safeTabUrl(tab);
  const urlClass = classifyUrl(tabUrl);

  if (!tab || !isTrackableUrl(tabUrl)) {
    runtimeState.currentHost = urlClass.host;
    runtimeState.currentUrl = urlClass.safeUrl;
    runtimeState.currentTabId = tab?.id ?? null;
    runtimeState.currentWindowId = tab?.windowId ?? null;
    runtimeState.currentHostStartedAt = null;
    runtimeState.isPlayingMedia = false;
    runtimeState.mediaStateUpdatedAt = new Date().toISOString();
    runtimeState.sessionStartedAt = Date.now();
    await saveRuntimeState(runtimeState);
    return;
  }

  const nextHost = normalizeHost(tabUrl);
  const now = Date.now();
  if (runtimeState.currentHost !== nextHost || !runtimeState.currentHostStartedAt) {
    runtimeState.currentHostStartedAt = now;
  }

  runtimeState.currentHost = nextHost;
  runtimeState.currentUrl = tabUrl;
  runtimeState.currentTabId = tab.id ?? null;
  runtimeState.currentWindowId = tab.windowId ?? null;
  runtimeState.isPlayingMedia = await queryMediaState(runtimeState.currentTabId);
  runtimeState.mediaStateUpdatedAt = new Date().toISOString();
  runtimeState.sessionStartedAt = now;
  await saveRuntimeState(runtimeState);
}

async function refreshActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  await setActiveFromTab(tab);
}

async function syncQueue() {
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
      lastError: error.message
    });
    return { synced: 0, queueSize: queue.length };
  }
}

async function getCachedDayAnalytics(
  dateKey: string,
  settings: Settings,
  settingsFingerprint: string,
  eventFingerprint: string,
  now: Date
): Promise<DayAnalytics> {
  const timezone = settings.timezone || "UTC";
  const cached = await getDailyAnalyticsCache(dateKey);
  if (isDailyAnalyticsCacheValid(cached, {
    dateKey,
    timezone,
    settingsFingerprint,
    eventFingerprint
  })) {
    return cached.analytics;
  }

  const events = await getActivityEventsForDays([dateKey], settings);
  const analytics = buildDayAnalytics(events, settings, dateKey, now);
  await saveDailyAnalyticsCache({
    schemaVersion: 1,
    dateKey,
    timezone,
    settingsFingerprint,
    eventFingerprint,
    analytics,
    updatedAt: new Date().toISOString()
  });
  return analytics;
}

async function buildCachedTodayView(settings: Settings, now = new Date()) {
  const [todayKey, yesterdayKey] = await getTodayViewActivityDateKeys(settings, now);
  const settingsFingerprint = buildAnalyticsSettingsFingerprint(settings);
  const dayMeta = await getActivityEventDayMeta([todayKey, yesterdayKey], settings);
  const [todayAnalytics, yesterdayAnalytics] = await Promise.all([
    getCachedDayAnalytics(
      todayKey,
      settings,
      settingsFingerprint,
      dayMeta[todayKey]?.fingerprint || "0:empty",
      now
    ),
    getCachedDayAnalytics(
      yesterdayKey,
      settings,
      settingsFingerprint,
      dayMeta[yesterdayKey]?.fingerprint || "0:empty",
      now
    )
  ]);
  return buildTodayViewFromDayAnalytics(todayAnalytics, yesterdayAnalytics, settings, now);
}

async function refreshViews(options: { includeSitesView?: boolean } = {}): Promise<DashboardCache> {
  try {
    const settings = await getSettings();
    const now = new Date();
    const [todayView, siteEvents, focusSessions, currentCache] = await Promise.all([
      buildCachedTodayView(settings, now),
      options.includeSitesView ? getRecentActivityEvents(7, settings) : Promise.resolve(null),
      getFocusSessions(),
      getDashboardCache()
    ]);
    const focusSessionsView = buildFocusSessionsView(focusSessions);
    const currentHostCategory: Category | null = runtimeState.currentHost
      ? resolveCategory(runtimeState.currentHost, settings)
      : null;

    const cachePatch: Partial<DashboardCache> = {
      todayView,
      trendsView: currentCache.trendsView,
      insightsView: currentCache.insightsView,
      focusSessionsView,
      currentHostCategory
    };
    if (siteEvents) {
      cachePatch.sitesView = buildSitesView(siteEvents, settings);
    }

    const cache = await saveDashboardCache(cachePatch);
    await evaluateFocusNudgeNotification(cache, settings);
    return cache;
  } catch (error) {
    return saveDashboardCache({
      lastError: error.message
    });
  }
}

function driftThresholdMinutes(sensitivity = APP_SETTINGS.nudgeSensitivity) {
  return NUDGE_SENSITIVITY_THRESHOLDS_MINUTES[sensitivity] ||
    NUDGE_SENSITIVITY_THRESHOLDS_MINUTES[APP_SETTINGS.nudgeSensitivity];
}

function getFocusNotificationState(activeSession: FocusSession | null | undefined): RuntimeState["focusNudgeNotifications"] {
  const sessionId = activeSession?.id || null;
  const current = runtimeState.focusNudgeNotifications;

  if (current.sessionId === sessionId && current.hosts && typeof current.hosts === "object") {
    return current;
  }

  return {
    sessionId,
    hosts: {}
  };
}

function formatNudgeDuration(durationMs) {
  const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function activeSessionStartedAt(activeSession) {
  const activeSince = Date.parse(activeSession?.last_resumed_at || activeSession?.started_at || "");
  return Number.isNaN(activeSince) ? null : activeSince;
}

async function showFocusNudge(
  message: string,
  details: { host?: string; category?: string; duration?: string } = {}
) {
  if (!runtimeState.currentTabId) {
    const error = new Error("No active tab available for focus nudge");
    await saveDashboardCache({ lastError: error.message });
    throw error;
  }

  try {
    const response = await chrome.tabs.sendMessage(runtimeState.currentTabId, {
      type: MESSAGE_TYPES.showFocusNudge,
      title: "Focus mode: distraction detected",
      message,
      host: details.host || runtimeState.currentHost || "",
      category: details.category || "",
      duration: details.duration || ""
    });

    await saveDashboardCache({ lastError: null });
    return { ok: true, response };
  } catch (error) {
    await saveDashboardCache({
      lastError: `Unable to show focus nudge on this page: ${error.message}`
    });
    throw error;
  }
}

async function evaluateFocusNudgeNotification(cache = null, settings = null) {
  const resolvedSettings = settings || await getSettings();
  if (!resolvedSettings.nudgesEnabled || !runtimeState.currentHost || !runtimeState.currentHostStartedAt) {
    return;
  }

  const resolvedCache = cache || await getDashboardCache();
  const activeSession = resolvedCache.focusSessionsView?.active_session || null;
  if (activeSession?.status !== "active") {
    return;
  }

  const category = resolvedCache.currentHostCategory;
  if (!DISTRACTION_CATEGORIES.has(category)) {
    return;
  }

  const now = Date.now();
  const sessionStartedAt = activeSessionStartedAt(activeSession);
  const dwellStartedAt = Math.max(runtimeState.currentHostStartedAt, sessionStartedAt || 0);
  const dwellMs = now - dwellStartedAt;
  const thresholdMs = driftThresholdMinutes(resolvedSettings.nudgeSensitivity) * 60 * 1000;
  if (dwellMs < thresholdMs) {
    return;
  }

  const snoozeMinutes = Number(resolvedSettings.snoozeMinutes) > 0
    ? Number(resolvedSettings.snoozeMinutes)
    : APP_SETTINGS.snoozeMinutes;
  const snoozeMs = snoozeMinutes * 60 * 1000;
  const notificationState = getFocusNotificationState(activeSession);
  const lastShownAt = Number(notificationState.hosts[runtimeState.currentHost] || 0);
  if (lastShownAt && now - lastShownAt < snoozeMs) {
    if (runtimeState.focusNudgeNotifications !== notificationState) {
      runtimeState.focusNudgeNotifications = notificationState;
      await saveRuntimeState(runtimeState);
    }
    return;
  }

  const categoryLabel = CATEGORY_LABELS[category] || category;
  const duration = formatNudgeDuration(dwellMs);
  try {
    await showFocusNudge(
      "Just a gentle reminder - you're browsing outside your focus areas.",
      {
        host: runtimeState.currentHost,
        category: categoryLabel,
        duration
      }
    );
  } catch {
    return;
  }

  notificationState.hosts[runtimeState.currentHost] = now;
  runtimeState.focusNudgeNotifications = notificationState;
  await saveRuntimeState(runtimeState);
}

function buildPopupModel(cache: DashboardCache, settings: Settings): BootstrapResponse["popupModel"] {
  const today = cache.todayView;
  const activeSession = cache.focusSessionsView?.active_session || null;
  const currentDwellStartedAt = runtimeState.currentHostStartedAt || runtimeState.sessionStartedAt;
  const currentDwellMs = currentDwellStartedAt ? Date.now() - currentDwellStartedAt : 0;
  const liveSessionMs = runtimeState.sessionStartedAt && isTrackingEligible(runtimeState.currentHost, settings)
    ? Math.max(0, Date.now() - runtimeState.sessionStartedAt)
    : 0;
  const currentCategory = cache.currentHostCategory;
  const thresholdMs = driftThresholdMinutes(settings.nudgeSensitivity) * 60 * 1000;
  const isDistractingCurrent = DISTRACTION_CATEGORIES.has(currentCategory);
  const isDrifting = isDistractingCurrent && currentDwellMs >= thresholdMs;

  let state: PopupModel["state"] = "empty";
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
    trackedTimeMs: (today?.summary?.total_duration_ms || 0) + liveSessionMs,
    focusedTimeMs: today?.summary?.focus_duration_ms || 0,
    distractedTimeMs: today?.summary?.distraction_duration_ms || 0,
    focusAlignment: today?.summary?.focus_alignment || 0,
    comparisonLabel: today?.comparison?.label || "vs yesterday",
    comparisonValue: today?.comparison?.focus_alignment_delta || 0,
    topCategories: (today?.top_categories || []).slice(0, 3),
    topSites: (today?.top_sites || []).slice(0, 8),
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
    runtimeState.lastHeartbeatAt = Date.now();
    await logTransition("heartbeat");
    await saveRuntimeState(runtimeState);
    await evaluateFocusNudgeNotification();
    return;
  }

  if (alarm.name === "sync") {
    await syncQueue();
    await refreshViews({ includeSitesView: true });
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await setActiveFromTab(tab);
  await logTransition("tab-activated", "tab-activated", {
    tab_id: tabId,
    window_id: tab.windowId ?? null
  });
  await refreshViews();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId !== runtimeState.currentTabId) {
    return;
  }

  if (changeInfo.url || changeInfo.status === "complete") {
    await setActiveFromTab(tab);
    await logTransition("tab-updated", changeInfo.url ? "url-change" : "tab-complete", {
      tab_id: tabId,
      window_id: tab.windowId ?? null
    });
    await refreshViews();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await flushCurrentSession("window-focus");
  runtimeState.isWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
  runtimeState.currentWindowId = runtimeState.isWindowFocused ? windowId : null;
  runtimeState.sessionStartedAt = Date.now();
  await saveRuntimeState(runtimeState);
  await logTransition("window-focus", runtimeState.isWindowFocused ? "focused" : "unfocused", {
    window_id: runtimeState.currentWindowId
  });

  if (runtimeState.isWindowFocused) {
    await refreshActiveTab();
  }
});

chrome.idle.onStateChanged.addListener(async (newState) => {
  await flushCurrentSession("idle-change");
  runtimeState.idleState = newState;
  runtimeState.sessionStartedAt = Date.now();
  await saveRuntimeState(runtimeState);
  await logTransition("idle-change", newState);
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
      case MESSAGE_TYPES.getDebugState: {
        const settings = await getSettings();
        const [device, dashboardCache, queue, events, transitions, focusSessions, siteRules] = await Promise.all([
          getDeviceState(),
          getDashboardCache(),
          getQueue(),
          getActivityEvents(settings),
          getTrackingTransitions(),
          getFocusSessions(),
          getSiteRules()
        ]);
        return {
          settings,
          device,
          queue,
          queueSize: queue.length,
          runtimeState,
          dashboardCache,
          activityEvents: events,
          transitions,
          focusSessions,
          siteRules,
          popupModel: buildPopupModel(dashboardCache, settings)
        };
      }
      case MESSAGE_TYPES.refreshViews: {
        await flushCurrentSession("manual-refresh");
        void logTransition("manual-refresh").catch((error) => saveDashboardCache({ lastError: error.message }));
        const dashboardCache = await refreshViews();
        void syncQueue().then(() => refreshViews({ includeSitesView: true }));
        const settings = await getSettings();
        return {
          dashboardCache,
          popupModel: buildPopupModel(dashboardCache, settings)
        };
      }
      case MESSAGE_TYPES.syncNow: {
        await flushCurrentSession("manual-sync");
        await logTransition("manual-sync");
        const sync = await syncQueue();
        const dashboardCache = await refreshViews({ includeSitesView: true });
        const settings = await getSettings();
        return {
          sync,
          dashboardCache,
          popupModel: buildPopupModel(dashboardCache, settings)
        };
      }
      case MESSAGE_TYPES.startFocusSession: {
        const sessions = await getFocusSessions();
        const result = startFocusSession(sessions, {
          intent: message.intent || "Focus block",
          duration_minutes: Number(message.minutes || 45)
        });
        await saveFocusSessions(result.sessions);
        const dashboardCache = await refreshViews();
        return { ok: true, session: result.session, dashboardCache };
      }
      case MESSAGE_TYPES.pauseFocusSession:
      case MESSAGE_TYPES.resumeFocusSession:
      case MESSAGE_TYPES.endFocusSession: {
        const actionMap = {
          [MESSAGE_TYPES.pauseFocusSession]: "pause",
          [MESSAGE_TYPES.resumeFocusSession]: "resume",
          [MESSAGE_TYPES.endFocusSession]: "end"
        } as const;
        const sessions = await getFocusSessions();
        const result = transitionFocusSession(sessions, message.sessionId, actionMap[message.type]);
        await saveFocusSessions(result.sessions);
        const dashboardCache = await refreshViews();
        return { ok: true, session: result.session, dashboardCache };
      }
      case MESSAGE_TYPES.saveSiteRule: {
        const payload = await saveLocalSiteRule(message.host, message.category, Boolean(message.excluded));
        void withRegisteredDevice(async (settings, deviceState) => {
          return updateSiteRule(settings.apiBaseUrl, deviceState.deviceId, {
            host: message.host,
            category: message.category,
            excluded: Boolean(message.excluded)
          });
        }).catch((error) => saveDashboardCache({ lastError: error.message }));
        const dashboardCache = await refreshViews();
        return { ok: true, payload, dashboardCache };
      }
      case MESSAGE_TYPES.forceFocusNudge: {
        const host = runtimeState.currentHost || "current site";
        return showFocusNudge(
          "Just a gentle reminder - you're browsing outside your focus areas.",
          { host }
        );
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
        await logTransition("media-state-change", nextState ? "playing" : "stopped");
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
  void flushCurrentSession("suspend").then(() => logTransition("suspend"));
});

void boot();
