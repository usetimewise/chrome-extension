import { MESSAGE_TYPES } from "../../lib/constants.js";
import { devDebugLog, devDebugWarn } from "../../lib/dev-debug.js";
import { sendContentMessage } from "../../lib/messaging/client.js";
import { sessionRemainingMs } from "../../lib/local-focus-sessions.js";
import { lookupUrlDecision } from "../../lib/urlDecision/match.js";
import type { BootstrapResponse, Category, FocusSession, Settings } from "../../lib/types.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";

const FOCUS_DECISION_MODE = "normal" as const;

export async function showFocusNudgeInTab(
  tabId: number,
  message: string,
  details: { sessionId: string; host: string; category: string; remainingMs?: number }
): Promise<{ ok: boolean; response: unknown }> {
  const payload = {
    type: MESSAGE_TYPES.showFocusNudge,
    sessionId: details.sessionId,
    message,
    host: details.host,
    category: details.category,
    remainingMs: Math.max(0, Number(details.remainingMs || 0))
  } as const;

  try {
    const response = await sendContentMessage(tabId, payload);
    return { ok: true, response };
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["assets/focus-nudge.js"]
    });
    const response = await sendContentMessage(tabId, payload);
    return { ok: true, response };
  }
}

export async function showFocusNudge(
  context: BackgroundRuntimeContext,
  message: string,
  details: { sessionId: string; host: string; category: string; remainingMs?: number }
): Promise<{ ok: boolean; response: unknown }> {
  const tabId = context.runtimeState.currentTabId;
  if (!tabId) {
    throw new Error("No active tab available for focus nudge");
  }

  return showFocusNudgeInTab(tabId, message, details);
}

export async function evaluateFocusNudgeNotification(
  context: BackgroundRuntimeContext,
  activeSession: FocusSession | null,
  settings: Settings
): Promise<void> {
  const currentUrl = context.runtimeState.currentUrl;
  const currentHost = context.runtimeState.currentHost;
  const currentTabId = context.runtimeState.currentTabId;
  if (!currentUrl || !currentHost || !currentTabId || activeSession?.status !== "active") {
    devDebugLog("focusNudge.evaluate.skip", {
      hasCurrentUrl: Boolean(currentUrl),
      hasCurrentHost: Boolean(currentHost),
      hasCurrentTabId: Boolean(currentTabId),
      sessionStatus: activeSession?.status || null
    });
    return;
  }

  const decision = await lookupUrlDecision(currentUrl, {
    apiBaseUrl: settings.apiBaseUrl,
    focusMode: FOCUS_DECISION_MODE
  });
  devDebugLog("focusNudge.decision", {
    action: decision.action,
    category: decision.category || null,
    confidence: decision.confidence,
    reason: decision.reason,
    source: decision.source
  });

  if (decision.action !== "block") {
    return;
  }

  try {
    await showFocusNudge(
      context,
      "Ты отвлекся. Этот сайт выглядит как отвлечение во время фокусировки.",
      {
        sessionId: activeSession.id,
        host: currentHost,
        category: decision.category || "other",
        remainingMs: activeSession.remaining_ms ?? sessionRemainingMs(activeSession)
      }
    );
  } catch {
    devDebugWarn("focusNudge.showFailed");
  }
}

export function buildPopupModel(
  context: BackgroundRuntimeContext,
  activeSession: FocusSession | null,
  currentHostCategory: Category | null
): BootstrapResponse["popupModel"] {
  const focusSession = activeSession
    ? {
        ...activeSession,
        remaining_ms: activeSession.remaining_ms ?? sessionRemainingMs(activeSession)
      }
    : null;

  return {
    state: activeSession?.status === "active" ? "focus_active" : "empty",
    statusLabel: activeSession?.status === "active" ? "Focus mode active" : "Focus mode off",
    statusMessage: activeSession?.status === "active"
      ? "Distracting URLs are blocked for this focus session."
      : "Start focus mode to block distracting URLs.",
    currentSite: context.runtimeState.currentHost
      ? {
          host: context.runtimeState.currentHost,
          category: currentHostCategory || "other"
        }
      : null,
    focusSession,
    primaryAction: activeSession?.status === "active"
      ? { type: MESSAGE_TYPES.pauseFocusSession, label: "Pause focus" }
      : { type: MESSAGE_TYPES.startFocusSession, label: "Start focus mode" },
    secondaryActions: activeSession?.status === "active"
      ? [{ type: MESSAGE_TYPES.endFocusSession, label: "End session" }]
      : [],
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
