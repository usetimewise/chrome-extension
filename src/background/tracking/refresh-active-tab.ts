import { saveRuntimeState } from "../../lib/storage/runtime-state.js";
import { getFocusSessions } from "../../lib/storage/focus-sessions.js";
import { getSettings } from "../../lib/storage/site-rules.js";
import { isTrackableUrl, normalizeHost } from "../../lib/utils.js";
import { evaluateFocusOffer } from "../focus/focus-offer-flow.js";
import { evaluateFocusNudgeNotification } from "../focus/focus-session-flow.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";
import { classifyUrl, safeTabUrl } from "./classify-url.js";
import { ensureClassificationForHost } from "./site-classification-worker.js";

type ActiveTabEvaluationOptions = {
    evaluateFocusNudge?: boolean;
    evaluateFocusOffer?: boolean;
};

export async function setActiveFromTab(
    context: BackgroundRuntimeContext,
    tab: chrome.tabs.Tab | null | undefined,
    options: ActiveTabEvaluationOptions = {},
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
    if (context.runtimeState.currentUrl !== tabUrl) {
        context.runtimeState.focusNudgeNotifications = {
            ...context.runtimeState.focusNudgeNotifications,
            lastSoftUrl: null,
        };
    }

    if (
        context.runtimeState.currentHost !== nextHost ||
        !context.runtimeState.currentHostStartedAt
    ) {
        context.runtimeState.currentHostStartedAt = now;
    }

    context.runtimeState.currentHost = nextHost;
    context.runtimeState.currentUrl = tabUrl;
    context.runtimeState.currentTabId = tab.id ?? null;
    context.runtimeState.currentTabTitle = tab.title ?? null;
    context.runtimeState.currentWindowId = tab.windowId ?? null;
    await saveRuntimeState(context.runtimeState);
    void ensureClassificationForHost(context, nextHost);
    const shouldEvaluateFocusNudge = options.evaluateFocusNudge ?? true;
    const shouldEvaluateFocusOffer = options.evaluateFocusOffer ?? true;
    if (!shouldEvaluateFocusNudge && !shouldEvaluateFocusOffer) {
        return;
    }

    const [sessions, settings] = await Promise.all([
        getFocusSessions(),
        getSettings(),
    ]);
    if (shouldEvaluateFocusNudge) {
        const activeSession =
            sessions.find((session) => session.status === "active") || null;
        await evaluateFocusNudgeNotification(context, activeSession, settings);
    }
    if (shouldEvaluateFocusOffer) {
        void evaluateFocusOffer(context, sessions, settings);
    }
}

export async function refreshActiveTab(
    context: BackgroundRuntimeContext,
    options: ActiveTabEvaluationOptions = {},
): Promise<void> {
    const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
    });
    await setActiveFromTab(context, tab, options);
}
