import { saveRuntimeState } from "../../lib/storage/runtime-state.js";
import { isTrackableUrl, normalizeHost } from "../../lib/utils.js";
import { MESSAGE_TYPES } from "../../lib/constants.js";
import { sendContentMessage } from "../../lib/messaging/client.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";
import { classifyUrl, safeTabUrl } from "./classify-url.js";
import { ensureClassificationForHost } from "./site-classification-worker.js";
import { flushCurrentSession } from "./transitions.js";
import { refreshViews } from "../messaging/handlers.js";

export async function queryMediaState(tabId: number | null): Promise<boolean> {
  if (!tabId) {
    return false;
  }

  try {
    const response = await sendContentMessage(tabId, { type: MESSAGE_TYPES.getMediaState });
    return response?.isPlayingMedia === true;
  } catch {
    return false;
  }
}

export async function setActiveFromTab(
  context: BackgroundRuntimeContext,
  tab: chrome.tabs.Tab | null | undefined
): Promise<void> {
  await flushCurrentSession(context, "active-tab-change");
  const tabUrl = safeTabUrl(tab);
  const urlClass = classifyUrl(tabUrl);

  if (!tab || !isTrackableUrl(tabUrl)) {
    context.runtimeState.currentHost = urlClass.host;
    context.runtimeState.currentUrl = urlClass.safeUrl;
    context.runtimeState.currentTabId = tab?.id ?? null;
    context.runtimeState.currentWindowId = tab?.windowId ?? null;
    context.runtimeState.currentHostStartedAt = null;
    context.runtimeState.isPlayingMedia = false;
    context.runtimeState.mediaStateUpdatedAt = new Date().toISOString();
    context.runtimeState.sessionStartedAt = Date.now();
    await saveRuntimeState(context.runtimeState);
    return;
  }

  const nextHost = normalizeHost(tabUrl);
  const now = Date.now();
  if (context.runtimeState.currentHost !== nextHost || !context.runtimeState.currentHostStartedAt) {
    context.runtimeState.currentHostStartedAt = now;
  }

  context.runtimeState.currentHost = nextHost;
  context.runtimeState.currentUrl = tabUrl;
  context.runtimeState.currentTabId = tab.id ?? null;
  context.runtimeState.currentWindowId = tab.windowId ?? null;
  context.runtimeState.isPlayingMedia = await queryMediaState(context.runtimeState.currentTabId);
  context.runtimeState.mediaStateUpdatedAt = new Date().toISOString();
  context.runtimeState.sessionStartedAt = now;
  await saveRuntimeState(context.runtimeState);
  void ensureClassificationForHost(context, nextHost, refreshViews);
}

export async function refreshActiveTab(context: BackgroundRuntimeContext): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  await setActiveFromTab(context, tab);
}
