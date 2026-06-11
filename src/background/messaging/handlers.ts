import { MESSAGE_TYPES } from "../../lib/constants.js";
import { getDeviceState } from "../../lib/storage/device-state.js";
import { getFocusSessions, saveFocusSessions } from "../../lib/storage/focus-sessions.js";
import { saveUserPreferences } from "../../lib/storage/preferences.js";
import { getResolvedClassificationCategory, getSiteClassifications } from "../../lib/storage/site-classifications.js";
import { getSettings, getSiteRules, saveSiteRule as saveLocalSiteRule } from "../../lib/storage/site-rules.js";
import { isBackgroundRequest } from "../../lib/messaging/contracts.js";
import { updateSiteRule } from "../../lib/api/site-rules.js";
import {
  buildFocusSessionsView,
  startFocusSession,
  transitionFocusSession
} from "../../lib/local-focus-sessions.js";
import { getErrorMessage } from "../../lib/utils.js";
import type { BootstrapResponse, Category } from "../../lib/types.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";
import {
  buildPopupModel,
  evaluateFocusNudgeNotification,
  forceFocusNudge,
  showFocusNudgeInTab
} from "../focus/focus-session-flow.js";
import {
  ensureClassificationForHost,
  processSiteClassificationQueue,
  retrySiteClassificationsNow
} from "../tracking/site-classification-worker.js";
import { withRegisteredDevice } from "../device/registration.js";
import { syncFocusSessionTimer } from "../focus/focus-session-timer.js";

async function buildBootstrap(context: BackgroundRuntimeContext): Promise<BootstrapResponse> {
  const currentFocusSessions = await syncFocusSessionTimer();
  const [settings, device, focusSessions, siteRules, siteClassifications] = await Promise.all([
    getSettings(),
    getDeviceState(),
    Promise.resolve(currentFocusSessions),
    getSiteRules(),
    getSiteClassifications()
  ]);
  const focusSessionsView = buildFocusSessionsView(focusSessions);
  const activeSession = focusSessionsView.active_session;
  const currentHostCategory: Category | null = context.runtimeState.currentHost
    ? getResolvedClassificationCategory(context.runtimeState.currentHost, siteClassifications)
    : null;

  await evaluateFocusNudgeNotification(context, activeSession, settings);
  return {
    settings,
    device,
    runtimeState: context.runtimeState,
    focusSessions,
    siteRules,
    siteClassifications,
    popupModel: buildPopupModel(context, activeSession, currentHostCategory)
  };
}

export function createBackgroundMessageListener(
  context: BackgroundRuntimeContext
): Parameters<typeof chrome.runtime.onMessage.addListener>[0] {
  return (message: unknown, sender: chrome.runtime.MessageSender, sendResponse) => {
    if (!isBackgroundRequest(message)) {
      sendResponse({ ok: false, error: "Unknown message type" });
      return false;
    }

    const handler = async (): Promise<unknown> => {
      switch (message.type) {
        case MESSAGE_TYPES.getBootstrap:
          return buildBootstrap(context);
        case MESSAGE_TYPES.retrySiteClassifications: {
          const retriedCount = await retrySiteClassificationsNow(context);
          const siteClassifications = await getSiteClassifications();
          return {
            retriedCount,
            siteClassifications,
            lastError: null
          };
        }
        case MESSAGE_TYPES.startFocusSession:
        {
          const sessions = await getFocusSessions();
          const result = startFocusSession(sessions, {
            intent: message.intent || "Focus block",
            duration_minutes: message.minutes
          });
          await saveFocusSessions(result.sessions);
          await syncFocusSessionTimer();
          return { ok: true, session: result.session, bootstrap: await buildBootstrap(context) };
        }
        case MESSAGE_TYPES.pauseFocusSession:
        case MESSAGE_TYPES.resumeFocusSession:
        case MESSAGE_TYPES.endFocusSession:
        {
          const actionMap = {
            [MESSAGE_TYPES.pauseFocusSession]: "pause",
            [MESSAGE_TYPES.resumeFocusSession]: "resume",
            [MESSAGE_TYPES.endFocusSession]: "end"
          } as const;
          const sessions = await getFocusSessions();
          const result = transitionFocusSession(
            sessions,
            message.sessionId,
            actionMap[String(message.type) as keyof typeof actionMap]
          );
          await saveFocusSessions(result.sessions);
          await syncFocusSessionTimer();
          return { ok: true, session: result.session, bootstrap: await buildBootstrap(context) };
        }
        case MESSAGE_TYPES.saveSiteRule: {
          const payload = await saveLocalSiteRule(message.host, message.category, message.excluded);
          void withRegisteredDevice(async (settings, deviceState) => (
            updateSiteRule(settings.apiBaseUrl, deviceState.deviceId, {
              host: message.host,
              category: message.category,
              excluded: message.excluded
            })
          ));
          if (message.host) {
            void ensureClassificationForHost(context, message.host);
            void processSiteClassificationQueue(context);
          }
          return { ok: true, payload, bootstrap: await buildBootstrap(context) };
        }
        case MESSAGE_TYPES.savePreferences: {
          const payload = await saveUserPreferences(message.preferences);
          return { ok: true, payload, bootstrap: await buildBootstrap(context) };
        }
        case MESSAGE_TYPES.closeCurrentTab: {
          const tabId = sender.tab?.id;
          if (typeof tabId !== "number") {
            return { ok: false, error: "No sender tab available to close" };
          }

          await chrome.tabs.remove(tabId);
          return { ok: true };
        }
        case MESSAGE_TYPES.forceFocusNudge:
          return forceFocusNudge(context);
        case MESSAGE_TYPES.focusBlockerBlocked: {
          const tabId = sender.tab?.id;
          if (typeof tabId !== "number") {
            return { ok: false, error: "No sender tab available for focus blocker" };
          }

          const focusSessionsView = buildFocusSessionsView(await syncFocusSessionTimer());
          const activeSession = focusSessionsView.active_session;
          return showFocusNudgeInTab(
            tabId,
            "Ты отвлекся. Этот сайт выглядит как отвлечение во время фокусировки.",
            {
              sessionId: message.sessionId,
              host: message.host,
              category: message.category,
              remainingMs: activeSession?.id === message.sessionId ? activeSession.remaining_ms : 0
            }
          );
        }
        default:
          return { ok: false, error: "Unknown message type" };
      }
    };

    handler()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: getErrorMessage(error) }));

    return true;
  };
}
