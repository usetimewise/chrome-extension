import { MESSAGE_TYPES } from "../../lib/constants.js";
import { devDebugLog, devDebugWarn } from "../../lib/dev-debug.js";
import { getFocusOfferEligibility } from "../../lib/focus-offer-eligibility.js";
import { createTranslator } from "../../lib/i18n/index.js";
import { sendContentMessage } from "../../lib/messaging/client.js";
import { saveRuntimeState } from "../../lib/storage/runtime-state.js";
import { decideDistractionSite } from "../../lib/site-block-rules.js";
import type { FocusOfferPromptEvent, FocusOfferPromptEventType, FocusSession, Settings } from "../../lib/types.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";

const MAX_PROMPT_EVENTS = 50;

export async function recordFocusOfferPromptEvent(
  context: BackgroundRuntimeContext,
  type: FocusOfferPromptEventType,
  host: string,
  at = Date.now()
): Promise<void> {
  const nextEvents = [
    ...(context.runtimeState.focusOfferPromptEvents || []),
    { type, host, at }
  ].slice(-MAX_PROMPT_EVENTS);

  context.runtimeState.focusOfferPromptEvents = nextEvents;
  await saveRuntimeState({ focusOfferPromptEvents: nextEvents });
}

async function showFocusOfferInTab(
  tabId: number,
  details: { host: string; category: string; message: string }
): Promise<void> {
  const payload = {
    type: MESSAGE_TYPES.showFocusNudge,
    mode: "offer",
    message: details.message,
    host: details.host,
    category: details.category
  } as const;

  try {
    await sendContentMessage(tabId, payload);
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["assets/focus-nudge.js"]
    });
    await sendContentMessage(tabId, payload);
  }
}

export async function evaluateFocusOffer(
  context: BackgroundRuntimeContext,
  sessions: FocusSession[],
  settings: Settings
): Promise<void> {
  const currentUrl = context.runtimeState.currentUrl;
  const currentTabId = context.runtimeState.currentTabId;
  if (!currentUrl || !currentTabId) {
    return;
  }

  const eligibility = getFocusOfferEligibility(
    sessions,
    context.runtimeState.focusOfferPromptEvents || []
  );
  if (eligibility.eligible === false) {
    devDebugLog("focusOffer.skip", { reason: eligibility.reason });
    return;
  }

  const decision = await decideDistractionSite(currentUrl, {
    siteRules: {
      excludedHosts: settings.excludedHosts,
      categoryOverrides: settings.categoryOverrides
    },
    disabledDefaultBlockRuleIds: settings.disabledDefaultBlockRuleIds,
    apiBaseUrl: settings.apiBaseUrl,
    allowNetworkLookup: true
  });
  if (decision.action !== "distracting") {
    devDebugLog("focusOffer.allow", { reason: decision.reason });
    return;
  }

  const t = createTranslator(settings.language);
  try {
    await recordFocusOfferPromptEvent(context, "shown", decision.host);
    await showFocusOfferInTab(currentTabId, {
      host: decision.host,
      category: decision.category,
      message: t("nudge.offerMessage")
    });
  } catch {
    devDebugWarn("focusOffer.showFailed");
  }
}
