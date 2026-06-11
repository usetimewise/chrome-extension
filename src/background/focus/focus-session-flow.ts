import { MESSAGE_TYPES } from "../../lib/constants.js";
import { devDebugLog, devDebugWarn } from "../../lib/dev-debug.js";
import { createTranslator } from "../../lib/i18n/index.js";
import { sendContentMessage } from "../../lib/messaging/client.js";
import { getSettings } from "../../lib/storage/site-rules.js";
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

  const t = createTranslator(settings.language);
  try {
    await showFocusNudge(
      context,
      t("nudge.message"),
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
  currentHostCategory: Category | null,
  settings: Settings
): BootstrapResponse["popupModel"] {
  const t = createTranslator(settings.language);
  const focusSession = activeSession
    ? {
        ...activeSession,
        remaining_ms: activeSession.remaining_ms ?? sessionRemainingMs(activeSession)
      }
    : null;

  return {
    state: activeSession?.status === "active" ? "focus_active" : "empty",
    statusLabel: activeSession?.status === "active" ? t("popup.focusActiveTitle") : t("popup.focusInactiveTitle"),
    statusMessage: activeSession?.status === "active"
      ? t("popup.focusActiveCopy")
      : t("popup.focusInactiveCopy"),
    currentSite: context.runtimeState.currentHost
      ? {
          host: context.runtimeState.currentHost,
          category: currentHostCategory || "other"
        }
      : null,
    focusSession,
    primaryAction: activeSession?.status === "active"
      ? { type: MESSAGE_TYPES.pauseFocusSession, label: t("popup.buttonStop") }
      : { type: MESSAGE_TYPES.startFocusSession, label: t("popup.buttonStart") },
    secondaryActions: activeSession?.status === "active"
      ? [{ type: MESSAGE_TYPES.endFocusSession, label: t("popup.buttonStop") }]
      : [],
    canReclassify: Boolean(context.runtimeState.currentHost)
  };
}

export async function forceFocusNudge(context: BackgroundRuntimeContext): Promise<{ ok: boolean; response: unknown }> {
  const settings = await getSettings();
  const t = createTranslator(settings.language);
  const host = context.runtimeState.currentHost || t("nudge.currentSite");
  return showFocusNudge(
    context,
    t("nudge.message"),
    { sessionId: "manual", host, category: "other" }
  );
}
