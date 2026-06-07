import { saveRuntimeState } from "../../lib/storage/runtime-state.js";
import { isTrackableUrl, normalizeHost } from "../../lib/utils.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";
import { classifyUrl, safeTabUrl } from "./classify-url.js";
import { ensureClassificationForHost } from "./site-classification-worker.js";

export async function setActiveFromTab(
  context: BackgroundRuntimeContext,
  tab: chrome.tabs.Tab | null | undefined
): Promise<void> {
  const tabUrl = safeTabUrl(tab);
  const urlClass = classifyUrl(tabUrl);

  if (!tab || !isTrackableUrl(tabUrl)) {
    context.runtimeState.currentHost = urlClass.host;
    context.runtimeState.currentUrl = urlClass.safeUrl;
    context.runtimeState.currentTabId = tab?.id ?? null;
    context.runtimeState.currentTabTitle = tab?.title ?? null;
    context.runtimeState.currentWindowId = tab?.windowId ?? null;
    context.runtimeState.currentHostStartedAt = null;
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
  context.runtimeState.currentTabTitle = tab.title ?? null;
  context.runtimeState.currentWindowId = tab.windowId ?? null;
  await saveRuntimeState(context.runtimeState);
  void ensureClassificationForHost(context, nextHost);
}

export async function refreshActiveTab(context: BackgroundRuntimeContext): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  await setActiveFromTab(context, tab);
}
