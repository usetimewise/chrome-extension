import { MESSAGE_TYPES } from "../../lib/constants.js";
import { createTranslator } from "../../lib/i18n/index.js";
import { resolveFocusBlockSeverity } from "../../lib/focus-distraction-counters.js";
import { getDeviceState } from "../../lib/storage/device-state.js";
import {
    getFocusSessions,
    saveFocusSessions,
} from "../../lib/storage/focus-sessions.js";
import { saveUserPreferences } from "../../lib/storage/preferences.js";
import {
    getResolvedClassificationCategory,
    getSiteClassifications,
} from "../../lib/storage/site-classifications.js";
import {
    getSettings,
    getSiteRules,
    saveSiteRule as saveLocalSiteRule,
} from "../../lib/storage/site-rules.js";
import { isBackgroundRequest } from "../../lib/messaging/contracts.js";
import { updateSiteRule } from "../../lib/api/site-rules.js";
import {
    buildFocusSessionsView,
    startFocusSession,
    transitionFocusSession,
} from "../../lib/local-focus-sessions.js";
import { getErrorMessage } from "../../lib/utils.js";
import type { BootstrapResponse, Category } from "../../lib/types.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";
import {
    buildPopupModel,
    evaluateFocusNudgeNotification,
    forceFocusNudge,
    showFocusNudgeWithSoftUrlLimit,
} from "../focus/focus-session-flow.js";
import { recordFocusOfferPromptEvent } from "../focus/focus-offer-flow.js";
import {
    ensureClassificationForHost,
    processSiteClassificationQueue,
    retrySiteClassificationsNow,
} from "../tracking/site-classification-worker.js";
import { refreshActiveTab } from "../tracking/refresh-active-tab.js";
import { withRegisteredDevice } from "../device/registration.js";
import { syncFocusSessionTimer } from "../focus/focus-session-timer.js";
import {
    flushFocusDistractionTracking,
    getDebugFocusDistractionCounters,
    syncFocusDistractionCounterSession,
} from "../tracking/focus-distraction-tracker.js";

async function buildBootstrap(
    context: BackgroundRuntimeContext,
): Promise<BootstrapResponse> {
    await refreshActiveTab(context, {
        evaluateFocusNudge: false,
        evaluateFocusOffer: false,
    });
    const currentFocusSessions = await syncFocusSessionTimer();
    const [settings, device, focusSessions, siteRules, siteClassifications] =
        await Promise.all([
            getSettings(),
            getDeviceState(),
            Promise.resolve(currentFocusSessions),
            getSiteRules(),
            getSiteClassifications(),
        ]);
    const focusSessionsView = buildFocusSessionsView(focusSessions);
    const activeSession = focusSessionsView.active_session;
    const currentHostCategory: Category | null = context.runtimeState
        .currentHost
        ? getResolvedClassificationCategory(
              context.runtimeState.currentHost,
              siteClassifications,
          )
        : null;

    await evaluateFocusNudgeNotification(context, activeSession, settings);
    return {
        settings,
        device,
        runtimeState: context.runtimeState,
        focusSessions,
        siteRules,
        siteClassifications,
        popupModel: buildPopupModel(
            context,
            activeSession,
            currentHostCategory,
            settings,
        ),
    };
}

export function createBackgroundMessageListener(
    context: BackgroundRuntimeContext,
): Parameters<typeof chrome.runtime.onMessage.addListener>[0] {
    return (
        message: unknown,
        sender: chrome.runtime.MessageSender,
        sendResponse,
    ) => {
        if (!isBackgroundRequest(message)) {
            sendResponse({ ok: false, error: "Unknown message type" });
            return false;
        }

        const handler = async (): Promise<unknown> => {
            switch (message.type) {
                case MESSAGE_TYPES.getBootstrap:
                    return buildBootstrap(context);
                case MESSAGE_TYPES.getFocusDistractionCounters:
                    return getDebugFocusDistractionCounters(context);
                case MESSAGE_TYPES.retrySiteClassifications: {
                    const retriedCount =
                        await retrySiteClassificationsNow(context);
                    const siteClassifications = await getSiteClassifications();
                    return {
                        retriedCount,
                        siteClassifications,
                        lastError: null,
                    };
                }
                case MESSAGE_TYPES.startFocusSession: {
                    const sessions = await getFocusSessions();
                    const result = startFocusSession(sessions, {
                        intent: message.intent || "Focus block",
                    });
                    await saveFocusSessions(result.sessions);
                    await syncFocusSessionTimer();
                    await syncFocusDistractionCounterSession();
                    if (context.runtimeState.currentHost) {
                        await recordFocusOfferPromptEvent(
                            context,
                            "started",
                            context.runtimeState.currentHost,
                        );
                    }
                    return {
                        ok: true,
                        session: result.session,
                        bootstrap: await buildBootstrap(context),
                    };
                }
                case MESSAGE_TYPES.endFocusSession: {
                    const sessions = await getFocusSessions();
                    const result = transitionFocusSession(
                        sessions,
                        message.sessionId,
                        "end",
                    );
                    await saveFocusSessions(result.sessions);
                    await syncFocusSessionTimer();
                    await syncFocusDistractionCounterSession();
                    return {
                        ok: true,
                        session: result.session,
                        bootstrap: await buildBootstrap(context),
                    };
                }
                case MESSAGE_TYPES.saveSiteRule: {
                    const payload = await saveLocalSiteRule(
                        message.host,
                        message.category,
                        message.excluded,
                    );
                    void withRegisteredDevice(async (settings, deviceState) =>
                        updateSiteRule(
                            settings.apiBaseUrl,
                            deviceState.deviceId,
                            {
                                host: message.host,
                                category: message.category,
                                excluded: message.excluded,
                            },
                        ),
                    );
                    if (message.host) {
                        void ensureClassificationForHost(context, message.host);
                        void processSiteClassificationQueue(context);
                    }
                    return {
                        ok: true,
                        payload,
                        bootstrap: await buildBootstrap(context),
                    };
                }
                case MESSAGE_TYPES.savePreferences: {
                    const payload = await saveUserPreferences(
                        message.preferences,
                    );
                    return {
                        ok: true,
                        payload,
                        bootstrap: await buildBootstrap(context),
                    };
                }
                case MESSAGE_TYPES.closeCurrentTab: {
                    const tabId = sender.tab?.id;
                    if (typeof tabId !== "number") {
                        return {
                            ok: false,
                            error: "No sender tab available to close",
                        };
                    }

                    await chrome.tabs.remove(tabId);
                    return { ok: true };
                }
                case MESSAGE_TYPES.forceFocusNudge:
                    return forceFocusNudge(context);
                case MESSAGE_TYPES.focusBlockerBlocked: {
                    const tabId = sender.tab?.id;
                    if (typeof tabId !== "number") {
                        return {
                            ok: false,
                            error: "No sender tab available for focus blocker",
                        };
                    }

                    await syncFocusSessionTimer();
                    const settings = await getSettings();
                    const counters =
                        await flushFocusDistractionTracking(context);
                    const presentation = resolveFocusBlockSeverity(
                        counters.counters,
                    );
                    const t = createTranslator(settings.language);
                    return showFocusNudgeWithSoftUrlLimit(
                        context,
                        tabId,
                        t("nudge.message"),
                        {
                            sessionId: message.sessionId,
                            host: message.host,
                            category: message.category,
                            presentation,
                        },
                        sender.tab?.url || context.runtimeState.currentUrl,
                    );
                }
                case MESSAGE_TYPES.dismissFocusOffer:
                    await recordFocusOfferPromptEvent(
                        context,
                        message.action === "defer" ? "deferred" : "closed",
                        message.host,
                    );
                    return { ok: true };
                default:
                    return { ok: false, error: "Unknown message type" };
            }
        };

        handler()
            .then(sendResponse)
            .catch((error) =>
                sendResponse({ ok: false, error: getErrorMessage(error) }),
            );

        return true;
    };
}
