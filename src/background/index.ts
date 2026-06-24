import { getRuntimeState } from "../lib/storage/runtime-state.js";
import {
    getFocusSessions,
    saveFocusSessions,
} from "../lib/storage/focus-sessions.js";
import { startFocusSession } from "../lib/local-focus-sessions.js";
import { createBackgroundMessageListener } from "./messaging/handlers.js";
import {
    createBackgroundRuntimeContext,
    setRuntimeState,
} from "./runtime/runtime-state.js";
import {
    refreshActiveTab,
    setActiveFromTab,
} from "./tracking/refresh-active-tab.js";
import {
    flushFocusDistractionTracking,
    getDebugFocusDistractionCounters,
    setFocusDistractionIdleState,
    setFocusDistractionWindowFocused,
    syncFocusDistractionCounterSession,
} from "./tracking/focus-distraction-tracker.js";
import {
    processSiteClassificationQueue,
    scheduleSiteClassificationAlarm,
    SITE_CLASSIFICATION_RETRY_ALARM,
} from "./tracking/site-classification-worker.js";
import { ensureDeviceRegistration } from "./device/registration.js";
import {
    FOCUS_SESSION_TIMER_ALARM,
    syncFocusSessionTimer,
} from "./focus/focus-session-timer.js";

const runtimeContext = createBackgroundRuntimeContext();
const FOCUS_DISTRACTION_HEARTBEAT_ALARM = "focus_distraction_heartbeat";

declare global {
    // Debug helper for the extension service worker console.
    var getTimeWiseFocusDistractionCounters:
        | (() => Promise<unknown>)
        | undefined;
}

function ensureFocusDistractionHeartbeat(): void {
    chrome.alarms.create(FOCUS_DISTRACTION_HEARTBEAT_ALARM, {
        periodInMinutes: 1,
    });
}

async function syncBrowserActivityState(): Promise<void> {
    try {
        const focusedWindow = await chrome.windows.getLastFocused();
        setFocusDistractionWindowFocused(Boolean(focusedWindow.focused));
    } catch {
        setFocusDistractionWindowFocused(true);
    }

    try {
        setFocusDistractionIdleState(await chrome.idle.queryState(60));
    } catch {
        setFocusDistractionIdleState("active");
    }
}

async function boot(): Promise<void> {
    setRuntimeState(runtimeContext, await getRuntimeState());
    ensureFocusDistractionHeartbeat();
    await syncBrowserActivityState();
    void ensureDeviceRegistration();
    await refreshActiveTab(runtimeContext);
    await scheduleSiteClassificationAlarm();
    void processSiteClassificationQueue(runtimeContext);
    await syncFocusSessionTimer();
    await syncFocusDistractionCounterSession();
}

async function enableFocusModeAfterInstall(): Promise<void> {
    const sessions = await getFocusSessions();
    const result = startFocusSession(sessions, {
        intent: "Extension installed",
    });

    if (result.sessions !== sessions) {
        await saveFocusSessions(result.sessions);
    }

    await syncFocusSessionTimer();
    await syncFocusDistractionCounterSession();
}

chrome.runtime.onInstalled.addListener((details) => {
    void (async () => {
        if (details.reason === "install") {
            await enableFocusModeAfterInstall();
        }

        await boot();
    })();
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
        await syncFocusDistractionCounterSession();
    }

    if (alarm.name === FOCUS_DISTRACTION_HEARTBEAT_ALARM) {
        await flushFocusDistractionTracking(runtimeContext);
    }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    await flushFocusDistractionTracking(runtimeContext);
    const tab = await chrome.tabs.get(tabId);
    await setActiveFromTab(runtimeContext, tab);
    void processSiteClassificationQueue(runtimeContext);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const isKnownCurrentTab =
        tabId === runtimeContext.runtimeState.currentTabId;
    if (
        !isKnownCurrentTab &&
        (runtimeContext.runtimeState.currentTabId !== null || !tab.active)
    ) {
        return;
    }

    if (changeInfo.url || changeInfo.status === "complete") {
        await flushFocusDistractionTracking(runtimeContext);
        await setActiveFromTab(runtimeContext, tab);
        void processSiteClassificationQueue(runtimeContext);
    }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
    await flushFocusDistractionTracking(runtimeContext);
    const isWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
    setFocusDistractionWindowFocused(isWindowFocused);
    runtimeContext.runtimeState.currentWindowId = isWindowFocused
        ? windowId
        : null;
    if (isWindowFocused) {
        await refreshActiveTab(runtimeContext);
    }
});

chrome.idle.onStateChanged.addListener(async (idleState) => {
    await flushFocusDistractionTracking(runtimeContext);
    setFocusDistractionIdleState(idleState);
});

chrome.runtime.onMessage.addListener(
    createBackgroundMessageListener(runtimeContext),
);

chrome.runtime.onSuspend.addListener(() => {
    void flushFocusDistractionTracking(runtimeContext);
});

globalThis.getTimeWiseFocusDistractionCounters = () =>
    getDebugFocusDistractionCounters(runtimeContext);

void boot();
