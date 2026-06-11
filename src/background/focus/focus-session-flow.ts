import { MESSAGE_TYPES } from "../../lib/constants.js";
import { devDebugLog, devDebugWarn } from "../../lib/dev-debug.js";
import { createTranslator } from "../../lib/i18n/index.js";
import { sendContentMessage } from "../../lib/messaging/client.js";
import { getSettings } from "../../lib/storage/site-rules.js";
import { decideFocusBlock } from "../../lib/site-block-rules.js";
import type { BootstrapResponse, Category, FocusSession, Settings } from "../../lib/types.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";

export async function showFocusNudgeInTab(
  tabId: number,
  message: string,
  details: { sessionId: string; host: string; category: string }
): Promise<{ ok: boolean; response: unknown }> {
  const payload = {
    type: MESSAGE_TYPES.showFocusNudge,
    mode: "block",
    sessionId: details.sessionId,
    message,
    host: details.host,
    category: details.category
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
  details: { sessionId: string; host: string; category: string }
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

  const decision = await decideFocusBlock(currentUrl, {
    sessions: [activeSession],
    siteRules: {
      excludedHosts: settings.excludedHosts,
      categoryOverrides: settings.categoryOverrides
    },
    disabledDefaultBlockRuleIds: settings.disabledDefaultBlockRuleIds,
    apiBaseUrl: settings.apiBaseUrl,
    allowNetworkLookup: true
  });
  devDebugLog("focusNudge.decision", {
    action: decision.action,
    reason: decision.reason,
    category: decision.action === "block" ? decision.category : null,
    source: decision.action === "block" ? decision.matchedRule?.source || null : null
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
        category: decision.category
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
    focusSession: activeSession,
    primaryAction: activeSession?.status === "active"
      ? { type: MESSAGE_TYPES.endFocusSession, label: t("popup.buttonStop") }
      : { type: MESSAGE_TYPES.startFocusSession, label: t("popup.buttonStart") },
    secondaryActions: [],
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
