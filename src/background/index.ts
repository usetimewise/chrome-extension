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
import { getFocusSessions } from "../lib/storage/focus-sessions.js";
import { buildFocusSessionsView } from "../lib/local-focus-sessions.js";
import { updateProductivityActionIcon } from "./action/productivity-icon.js";

const runtimeContext = createBackgroundRuntimeContext();

async function boot(): Promise<void> {
  setRuntimeState(runtimeContext, await getRuntimeState());
  void ensureDeviceRegistration();
  await refreshActiveTab(runtimeContext);
  await scheduleSiteClassificationAlarm();
  void processSiteClassificationQueue(runtimeContext);
  const focusSessionsView = buildFocusSessionsView(await getFocusSessions());
  await updateProductivityActionIcon(focusSessionsView.active_session?.status === "active");
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
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await setActiveFromTab(runtimeContext, tab);
  void processSiteClassificationQueue(runtimeContext);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId !== runtimeContext.runtimeState.currentTabId) {
    return;
  }

  if (changeInfo.url || changeInfo.status === "complete") {
    await setActiveFromTab(runtimeContext, tab);
    void processSiteClassificationQueue(runtimeContext);
  }
});

chrome.runtime.onMessage.addListener(createBackgroundMessageListener(runtimeContext));

void boot();
