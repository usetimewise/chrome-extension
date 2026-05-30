import { APP_SETTINGS, NUDGE_SENSITIVITY_THRESHOLDS_MINUTES } from "../../lib/app-settings.js";
import { DISTRACTION_CATEGORIES, MESSAGE_TYPES } from "../../lib/constants.js";
import { decideSite } from "../../lib/api/site-decision.js";
import { sendContentMessage } from "../../lib/messaging/client.js";
import { getDashboardCache, saveDashboardCache } from "../../lib/storage/dashboard-cache.js";
import { saveRuntimeState } from "../../lib/storage/runtime-state.js";
import { cacheSiteDecision, findCachedSiteDecision } from "../../lib/storage/site-decision-cache.js";
import { getErrorMessage } from "../../lib/utils.js";
import type {
  BootstrapResponse,
  DashboardCache,
  FocusSession,
  PopupModel,
  RuntimeState,
  Settings
} from "../../lib/types.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";
import { withRegisteredDevice } from "../sync/sync-queue.js";
import { isTrackingEligible } from "../tracking/transitions.js";

const FOCUS_DECISION_MODE = "normal" as const;

function driftThresholdMinutes(sensitivity: Settings["nudgeSensitivity"] = APP_SETTINGS.nudgeSensitivity): number {
  return NUDGE_SENSITIVITY_THRESHOLDS_MINUTES[sensitivity] ||
    NUDGE_SENSITIVITY_THRESHOLDS_MINUTES[APP_SETTINGS.nudgeSensitivity];
}

function getFocusNotificationState(
  context: BackgroundRuntimeContext,
  activeSession: FocusSession | null | undefined
): RuntimeState["focusNudgeNotifications"] {
  const sessionId = activeSession?.id || null;
  const current = context.runtimeState.focusNudgeNotifications;

  if (current.sessionId === sessionId && current.hosts && typeof current.hosts === "object") {
    return current;
  }

  return {
    sessionId,
    hosts: {}
  };
}

export async function showFocusNudge(
  context: BackgroundRuntimeContext,
  message: string,
  details: { sessionId: string; host: string; category: string }
): Promise<{ ok: boolean; response: unknown }> {
  const tabId = context.runtimeState.currentTabId;
  if (!tabId) {
    const error = new Error("No active tab available for focus nudge");
    await saveDashboardCache({ lastError: getErrorMessage(error) });
    throw error;
  }

  const payload = {
    type: MESSAGE_TYPES.showFocusNudge,
    sessionId: details.sessionId,
    message,
    host: details.host,
    category: details.category
  } as const;

  try {
    const response = await sendContentMessage(tabId, payload);

    await saveDashboardCache({ lastError: null });
    return { ok: true, response };
  } catch (initialError) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["assets/focus-nudge.js"]
      });
      const response = await sendContentMessage(tabId, payload);
      await saveDashboardCache({ lastError: null });
      return { ok: true, response };
    } catch (retryError) {
      await saveDashboardCache({
        lastError: `Unable to show focus nudge on this page: ${getErrorMessage(retryError, getErrorMessage(initialError))}`
      });
      throw retryError;
    }
  }
}

export async function evaluateFocusNudgeNotification(
  context: BackgroundRuntimeContext,
  cache: DashboardCache | null = null,
  _settings: Settings | null = null
): Promise<void> {
  const currentUrl = context.runtimeState.currentUrl;
  const currentHost = context.runtimeState.currentHost;
  const currentTabId = context.runtimeState.currentTabId;
  if (!currentUrl || !currentHost || !currentTabId) {
    return;
  }

  const resolvedCache = cache || await getDashboardCache();
  const activeSession = resolvedCache.focusSessionsView?.active_session || null;
  if (activeSession?.status !== "active") {
    return;
  }

  const notificationState = getFocusNotificationState(context, activeSession);
  if (context.runtimeState.focusNudgeNotifications !== notificationState) {
    context.runtimeState.focusNudgeNotifications = notificationState;
    await saveRuntimeState(context.runtimeState);
  }

  let decision = await findCachedSiteDecision(currentUrl, FOCUS_DECISION_MODE);
  if (!decision) {
    try {
      const response = await withRegisteredDevice(async (settings, deviceState) => (
        decideSite(settings.apiBaseUrl, deviceState.deviceId, {
          url: currentUrl,
          focus_mode: FOCUS_DECISION_MODE,
          ...(context.runtimeState.currentTabTitle ? { tab_title: context.runtimeState.currentTabTitle } : {})
        })
      ));
      decision = await cacheSiteDecision(currentUrl, FOCUS_DECISION_MODE, response);
    } catch {
      return;
    }
  }

  if (decision?.decision !== "block") {
    return;
  }

  try {
    await showFocusNudge(
      context,
      "Ты отвлекся. Этот сайт выглядит как отвлечение во время фокусировки.",
      {
        sessionId: activeSession.id,
        host: currentHost,
        category: decision.category || "other"
      }
    );
  } catch {
    return;
  }
}

export function buildPopupModel(
  context: BackgroundRuntimeContext,
  cache: DashboardCache,
  settings: Settings
): BootstrapResponse["popupModel"] {
  const today = cache.todayView;
  const productivityScore = cache.overview?.today?.summary?.productivity_score;
  const activeSession = cache.focusSessionsView?.active_session || null;
  const currentDwellStartedAt = context.runtimeState.currentHostStartedAt || context.runtimeState.sessionStartedAt;
  const currentDwellMs = currentDwellStartedAt ? Date.now() - currentDwellStartedAt : 0;
  const liveSessionMs = context.runtimeState.sessionStartedAt &&
    isTrackingEligible(context, context.runtimeState.currentHost, settings)
    ? Math.max(0, Date.now() - context.runtimeState.sessionStartedAt)
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
        remaining_ms: Math.max(
          0,
          (activeSession.planned_minutes * 60 * 1000) - (activeSession.active_duration_ms || 0)
        )
      }
    : null;

  return {
    state,
    statusLabel: today?.status?.label || "Welcome",
    statusMessage: today?.status?.message || "Your focus data will appear here soon.",
    trackedTimeMs: (today?.summary?.total_duration_ms || 0) + liveSessionMs,
    focusedTimeMs: today?.summary?.focus_duration_ms || 0,
    distractedTimeMs: today?.summary?.distraction_duration_ms || 0,
    productivityScore: {
      value: productivityScore?.value || 0,
      label: productivityScore?.label || "No score yet"
    },
    scoreComparison: {
      label: today?.comparison?.label || "vs yesterday",
      delta: today?.comparison?.productivity_score_delta || 0
    },
    topCategories: (today?.top_categories || []).slice(0, 3),
    topSites: (today?.top_sites || []).slice(0, 8),
    insight: today?.main_insight || {
      title: "Your focus picture is still forming",
      body: "Keep browsing normally. The first useful pattern appears after enough tracked time accumulates."
    },
    currentSite: context.runtimeState.currentHost
      ? {
          host: context.runtimeState.currentHost,
          category: currentCategory || "other",
          dwellMs: currentDwellMs
        }
      : null,
    focusSession,
    primaryAction: state === "focus_active"
      ? { type: MESSAGE_TYPES.pauseFocusSession, label: "Pause focus" }
      : {
          type: MESSAGE_TYPES.startFocusSession,
          label: state === "drifting" ? "Return to focus" : "Start focus mode"
        },
    secondaryActions: state === "focus_active"
      ? [{ type: MESSAGE_TYPES.endFocusSession, label: "End session" }]
      : [{ type: "OPEN_DASHBOARD", label: "Open dashboard" }],
    canReclassify: Boolean(context.runtimeState.currentHost)
  };
}

export async function forceFocusNudge(context: BackgroundRuntimeContext): Promise<{ ok: boolean; response: unknown }> {
  const host = context.runtimeState.currentHost || "current site";
  return showFocusNudge(
    context,
    "Ты отвлекся. Этот сайт выглядит как отвлечение во время фокусировки.",
    { sessionId: "manual", host, category: "other" }
  );
}
