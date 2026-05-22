import { ensureActivityEventsMigration } from "../lib/storage/activity-events.js";
import { getRuntimeState, saveRuntimeState } from "../lib/storage/runtime-state.js";
import { MESSAGE_TYPES } from "../lib/constants.js";
import { createBackgroundMessageListener, refreshViews } from "./messaging/handlers.js";
import { createBackgroundRuntimeContext, setRuntimeState } from "./runtime/runtime-state.js";
import { refreshActiveTab, setActiveFromTab } from "./tracking/refresh-active-tab.js";
import {
  processSiteClassificationQueue,
  scheduleSiteClassificationAlarm,
  SITE_CLASSIFICATION_RETRY_ALARM
} from "./tracking/site-classification-worker.js";
import { flushCurrentSession, logTransition } from "./tracking/transitions.js";
import { applyTrackingSettings, ensureDeviceRegistration, syncQueue } from "./sync/sync-queue.js";

const runtimeContext = createBackgroundRuntimeContext();

async function boot(): Promise<void> {
  setRuntimeState(runtimeContext, await getRuntimeState());
  const now = Date.now();
  runtimeContext.runtimeState.lastObservedAt = now;
  runtimeContext.runtimeState.sessionStartedAt = runtimeContext.runtimeState.sessionStartedAt || now;
  const settings = await applyTrackingSettings();
  await ensureActivityEventsMigration(settings);
  void ensureDeviceRegistration();
  await refreshActiveTab(runtimeContext);
  ensureAlarms();
  await scheduleSiteClassificationAlarm();
  void processSiteClassificationQueue(runtimeContext, refreshViews);
  await logTransition(runtimeContext, "startup");
  await refreshViews(runtimeContext);
}

function ensureAlarms(): void {
  chrome.alarms.create("heartbeat", { periodInMinutes: 1 });
  chrome.alarms.create("sync", { periodInMinutes: 5 });
}

chrome.runtime.onInstalled.addListener(() => {
  void boot();
});

chrome.runtime.onStartup.addListener(() => {
  void boot();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "heartbeat") {
    await flushCurrentSession(runtimeContext, "heartbeat");
    runtimeContext.runtimeState.lastHeartbeatAt = Date.now();
    await logTransition(runtimeContext, "heartbeat");
    await saveRuntimeState(runtimeContext.runtimeState);
    await refreshViews(runtimeContext);
    return;
  }

  if (alarm.name === "sync") {
    await syncQueue();
    await refreshViews(runtimeContext, { includeSitesView: true });
    return;
  }

  if (alarm.name === SITE_CLASSIFICATION_RETRY_ALARM) {
    await processSiteClassificationQueue(runtimeContext, refreshViews);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await setActiveFromTab(runtimeContext, tab);
  await logTransition(runtimeContext, "tab-activated", "tab-activated", {
    tab_id: tabId,
    window_id: tab.windowId ?? null
  });
  void processSiteClassificationQueue(runtimeContext, refreshViews);
  await refreshViews(runtimeContext);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId !== runtimeContext.runtimeState.currentTabId) {
    return;
  }

  if (changeInfo.url || changeInfo.status === "complete") {
    await setActiveFromTab(runtimeContext, tab);
    await logTransition(runtimeContext, "tab-updated", changeInfo.url ? "url-change" : "tab-complete", {
      tab_id: tabId,
      window_id: tab.windowId ?? null
    });
    void processSiteClassificationQueue(runtimeContext, refreshViews);
    await refreshViews(runtimeContext);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await flushCurrentSession(runtimeContext, "window-focus");
  runtimeContext.runtimeState.isWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
  runtimeContext.runtimeState.currentWindowId = runtimeContext.runtimeState.isWindowFocused ? windowId : null;
  runtimeContext.runtimeState.sessionStartedAt = Date.now();
  await saveRuntimeState(runtimeContext.runtimeState);
  await logTransition(runtimeContext, "window-focus", runtimeContext.runtimeState.isWindowFocused ? "focused" : "unfocused", {
    window_id: runtimeContext.runtimeState.currentWindowId
  });

  if (runtimeContext.runtimeState.isWindowFocused) {
    await refreshActiveTab(runtimeContext);
  }

  void processSiteClassificationQueue(runtimeContext, refreshViews);
  await refreshViews(runtimeContext);
});

chrome.idle.onStateChanged.addListener(async (newState) => {
  await flushCurrentSession(runtimeContext, "idle-change");
  runtimeContext.runtimeState.idleState = newState;
  runtimeContext.runtimeState.sessionStartedAt = Date.now();
  await saveRuntimeState(runtimeContext.runtimeState);
  await logTransition(runtimeContext, "idle-change", newState);
  await refreshViews(runtimeContext);
});

chrome.runtime.onMessage.addListener(createBackgroundMessageListener(runtimeContext));

chrome.runtime.onSuspend.addListener(() => {
  void flushCurrentSession(runtimeContext, "suspend").then(() => logTransition(runtimeContext, "suspend"));
});

void boot();
