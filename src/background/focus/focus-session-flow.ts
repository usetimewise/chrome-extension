import {
  APP_SETTINGS,
  NUDGE_SENSITIVITY_THRESHOLDS_MINUTES
} from "../../lib/app-settings.js";
import {
  CATEGORY_LABELS,
  DISTRACTION_CATEGORIES,
  MESSAGE_TYPES
} from "../../lib/constants.js";
import { sendContentMessage } from "../../lib/messaging/client.js";
import { getDashboardCache, saveDashboardCache } from "../../lib/storage/dashboard-cache.js";
import { saveRuntimeState } from "../../lib/storage/runtime-state.js";
import { getSettings } from "../../lib/storage/site-rules.js";
import { getErrorMessage } from "../../lib/utils.js";
import type {
  BootstrapResponse,
  Category,
  DashboardCache,
  FocusSession,
  PopupModel,
  RuntimeState,
  Settings
} from "../../lib/types.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";
import { isTrackingEligible } from "../tracking/transitions.js";

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

function formatNudgeDuration(durationMs: number): string {
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

function activeSessionStartedAt(activeSession: FocusSession | null | undefined): number | null {
  const activeSince = Date.parse(activeSession?.last_resumed_at || activeSession?.started_at || "");
  return Number.isNaN(activeSince) ? null : activeSince;
}

export async function showFocusNudge(
  context: BackgroundRuntimeContext,
  message: string,
  details: { host?: string; category?: string; duration?: string } = {}
): Promise<{ ok: boolean; response: unknown }> {
  if (!context.runtimeState.currentTabId) {
    const error = new Error("No active tab available for focus nudge");
    await saveDashboardCache({ lastError: getErrorMessage(error) });
    throw error;
  }

  try {
    const response = await sendContentMessage(context.runtimeState.currentTabId, {
      type: MESSAGE_TYPES.showFocusNudge,
      title: "Focus mode: distraction detected",
      message,
      host: details.host || context.runtimeState.currentHost || "",
      category: details.category || "",
      duration: details.duration || ""
    });

    await saveDashboardCache({ lastError: null });
    return { ok: true, response };
  } catch (error) {
    await saveDashboardCache({
      lastError: `Unable to show focus nudge on this page: ${getErrorMessage(error)}`
    });
    throw error;
  }
}

export async function evaluateFocusNudgeNotification(
  context: BackgroundRuntimeContext,
  cache: DashboardCache | null = null,
  settings: Settings | null = null
): Promise<void> {
  const resolvedSettings = settings || await getSettings();
  if (
    !resolvedSettings.nudgesEnabled ||
    !context.runtimeState.currentHost ||
    !context.runtimeState.currentHostStartedAt
  ) {
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
  const dwellStartedAt = Math.max(context.runtimeState.currentHostStartedAt, sessionStartedAt || 0);
  const dwellMs = now - dwellStartedAt;
  const thresholdMs = driftThresholdMinutes(resolvedSettings.nudgeSensitivity) * 60 * 1000;
  if (dwellMs < thresholdMs) {
    return;
  }

  const snoozeMinutes = Number(resolvedSettings.snoozeMinutes) > 0
    ? Number(resolvedSettings.snoozeMinutes)
    : APP_SETTINGS.snoozeMinutes;
  const snoozeMs = snoozeMinutes * 60 * 1000;
  const notificationState = getFocusNotificationState(context, activeSession);
  const lastShownAt = Number(notificationState.hosts[context.runtimeState.currentHost] || 0);
  if (lastShownAt && now - lastShownAt < snoozeMs) {
    if (context.runtimeState.focusNudgeNotifications !== notificationState) {
      context.runtimeState.focusNudgeNotifications = notificationState;
      await saveRuntimeState(context.runtimeState);
    }
    return;
  }

  const categoryLabel = CATEGORY_LABELS[category as Category] || category;
  const duration = formatNudgeDuration(dwellMs);
  try {
    await showFocusNudge(
      context,
      "Just a gentle reminder - you're browsing outside your focus areas.",
      {
        host: context.runtimeState.currentHost,
        category: categoryLabel || "",
        duration
      }
    );
  } catch {
    return;
  }

  notificationState.hosts[context.runtimeState.currentHost] = now;
  context.runtimeState.focusNudgeNotifications = notificationState;
  await saveRuntimeState(context.runtimeState);
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
    "Just a gentle reminder - you're browsing outside your focus areas.",
    { host }
  );
}
