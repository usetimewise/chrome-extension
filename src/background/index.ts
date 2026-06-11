import { getRuntimeState } from "../lib/storage/runtime-state.js";
import { createBackgroundMessageListener } from "./messaging/handlers.js";
import { createBackgroundRuntimeContext, setRuntimeState } from "./runtime/runtime-state.js";
import { refreshActiveTab, setActiveFromTab } from "./tracking/refresh-active-tab.js";
import {
  processSiteClassificationQueue,
  scheduleSiteClassificationAlarm,
  SITE_CLASSIFICATION_RETRY_ALARM
} from "./tracking/site-classification-worker.js";
import { ensureDeviceRegistration } from "./device/registration.js";
import { FOCUS_SESSION_TIMER_ALARM, syncFocusSessionTimer } from "./focus/focus-session-timer.js";

const runtimeContext = createBackgroundRuntimeContext();

async function boot(): Promise<void> {
  setRuntimeState(runtimeContext, await getRuntimeState());
  void ensureDeviceRegistration();
  await refreshActiveTab(runtimeContext);
  await scheduleSiteClassificationAlarm();
  void processSiteClassificationQueue(runtimeContext);
  await syncFocusSessionTimer();
}

chrome.runtime.onInstalled.addListener(() => {
  void boot();
});

chrome.runtime.onStartup.addListener(() => {
  void boot();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SITE_CLASSIFICATION_RETRY_ALARM) {
    await processSiteClassificationQueue(runtimeContext);
  }

  if (alarm.name === FOCUS_SESSION_TIMER_ALARM) {
    await syncFocusSessionTimer();
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await setActiveFromTab(runtimeContext, tab);
  void processSiteClassificationQueue(runtimeContext);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const isKnownCurrentTab = tabId === runtimeContext.runtimeState.currentTabId;
  if (!isKnownCurrentTab && (runtimeContext.runtimeState.currentTabId !== null || !tab.active)) {
    return;
  }

  if (changeInfo.url || changeInfo.status === "complete") {
    await setActiveFromTab(runtimeContext, tab);
    void processSiteClassificationQueue(runtimeContext);
  }
});

chrome.runtime.onMessage.addListener(createBackgroundMessageListener(runtimeContext));

void boot();
