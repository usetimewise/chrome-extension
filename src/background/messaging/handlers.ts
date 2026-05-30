import {
  getActivityEventDayMeta,
  getActivityEvents,
  getActivityEventsForDays,
  getPendingSyncCount,
  getPendingSyncEvents,
  getRecentActivityEvents,
  getTodayViewActivityDateKeys
} from "../../lib/storage/activity-events.js";
import { getDashboardCache, saveDashboardCache } from "../../lib/storage/dashboard-cache.js";
import { getDeviceState } from "../../lib/storage/device-state.js";
import { getFocusSessions, saveFocusSessions } from "../../lib/storage/focus-sessions.js";
import { isBackgroundRequest } from "../../lib/messaging/contracts.js";
import { saveRuntimeState } from "../../lib/storage/runtime-state.js";
import { getResolvedClassificationCategory, getSiteClassifications } from "../../lib/storage/site-classifications.js";
import { getSettings, getSiteRules, saveSiteRule as saveLocalSiteRule } from "../../lib/storage/site-rules.js";
import { getTrackingTransitions } from "../../lib/storage/tracking-transitions.js";
import {
  buildAnalyticsSettingsFingerprint,
  buildDashboardOverviewRanges,
  buildDayAnalytics,
  buildSitesView,
  buildTodayViewFromDayAnalytics,
  type DayAnalytics,
  resolveCategory
} from "../../lib/local-analytics.js";
import {
  getDailyAnalyticsCache,
  isDailyAnalyticsCacheValid,
  saveDailyAnalyticsCache
} from "../../lib/daily-analytics-cache.js";
import {
  buildFocusSessionsView,
  startFocusSession,
  transitionFocusSession
} from "../../lib/local-focus-sessions.js";
import { MESSAGE_TYPES } from "../../lib/constants.js";
import { updateSiteRule } from "../../lib/api/site-rules.js";
import { getErrorMessage } from "../../lib/utils.js";
import type { BootstrapResponse, Category, DashboardCache, Settings } from "../../lib/types.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";
import { buildPopupModel, evaluateFocusNudgeNotification, forceFocusNudge } from "../focus/focus-session-flow.js";
import {
  ensureClassificationForHost,
  processSiteClassificationQueue,
  retrySiteClassificationsNow
} from "../tracking/site-classification-worker.js";
import { flushCurrentSession, logTransition } from "../tracking/transitions.js";
import { syncQueue, withRegisteredDevice } from "../sync/sync-queue.js";
import { updateProductivityActionIcon } from "../action/productivity-icon.js";

async function getCachedDayAnalytics(
  dateKey: string,
  settings: Settings,
  settingsFingerprint: string,
  eventFingerprint: string,
  now: Date
): Promise<DayAnalytics> {
  const timezone = settings.timezone || "UTC";
  const cached = await getDailyAnalyticsCache(dateKey);
  if (isDailyAnalyticsCacheValid(cached, {
    dateKey,
    timezone,
    settingsFingerprint,
    eventFingerprint
  })) {
    return cached.analytics;
  }

  const events = await getActivityEventsForDays([dateKey], settings);
  const analytics = buildDayAnalytics(events, settings, dateKey, now);
  await saveDailyAnalyticsCache({
    schemaVersion: 1,
    dateKey,
    timezone,
    settingsFingerprint,
    eventFingerprint,
    analytics,
    updatedAt: new Date().toISOString()
  });
  return analytics;
}

async function buildCachedTodayView(settings: Settings, now = new Date()) {
  const [todayKey, yesterdayKey] = await getTodayViewActivityDateKeys(settings, now);
  const settingsFingerprint = buildAnalyticsSettingsFingerprint(settings);
  const dayMeta = await getActivityEventDayMeta([todayKey, yesterdayKey], settings);
  const [todayAnalytics, yesterdayAnalytics] = await Promise.all([
    getCachedDayAnalytics(
      todayKey,
      settings,
      settingsFingerprint,
      dayMeta[todayKey]?.fingerprint || "0:empty",
      now
    ),
    getCachedDayAnalytics(
      yesterdayKey,
      settings,
      settingsFingerprint,
      dayMeta[yesterdayKey]?.fingerprint || "0:empty",
      now
    )
  ]);
  return buildTodayViewFromDayAnalytics(todayAnalytics, yesterdayAnalytics, settings, now);
}

export async function refreshViews(
  context: BackgroundRuntimeContext,
  options: { includeSitesView?: boolean } = {}
): Promise<DashboardCache> {
  try {
    const settings = await getSettings();
    const now = new Date();
    const [todayView, recentEvents, focusSessions, currentCache, siteClassifications] = await Promise.all([
      buildCachedTodayView(settings, now),
      getRecentActivityEvents(90, settings),
      getFocusSessions(),
      getDashboardCache(),
      getSiteClassifications()
    ]);
    const focusSessionsView = buildFocusSessionsView(focusSessions);
    const currentHostCategory: Category | null = context.runtimeState.currentHost
      ? resolveCategory(
          context.runtimeState.currentHost,
          settings,
          getResolvedClassificationCategory(context.runtimeState.currentHost, siteClassifications)
        )
      : null;

    const cachePatch: Partial<DashboardCache> = {
      overview: buildDashboardOverviewRanges(recentEvents, settings, now),
      todayView,
      trendsView: currentCache.trendsView,
      insightsView: currentCache.insightsView,
      focusSessionsView,
      currentHostCategory
    };
    if (options.includeSitesView) {
      cachePatch.sitesView = buildSitesView(recentEvents, settings, now);
    }

    const cache = await saveDashboardCache(cachePatch);
    await evaluateFocusNudgeNotification(context, cache, settings);
    await updateProductivityActionIcon(cache);
    return cache;
  } catch (error) {
    const cache = await saveDashboardCache({
      lastError: getErrorMessage(error, "Unable to refresh dashboard views")
    });
    await updateProductivityActionIcon(cache);
    return cache;
  }
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
        case MESSAGE_TYPES.getBootstrap: {
          const [settings, device, dashboardCache, pendingSyncCount] = await Promise.all([
            getSettings(),
            getDeviceState(),
            getDashboardCache(),
            getPendingSyncCount()
          ]);

          return {
            settings,
            device,
            pendingSyncCount,
            runtimeState: context.runtimeState,
            dashboardCache,
            lastError: dashboardCache.lastError,
            popupModel: buildPopupModel(context, dashboardCache, settings)
          } satisfies BootstrapResponse;
        }
        case MESSAGE_TYPES.getDebugState: {
          const settings = await getSettings();
          const [device, dashboardCache, pendingSyncCount, pendingSyncEvents, events, transitions, focusSessions, siteRules, siteClassifications] = await Promise.all([
            getDeviceState(),
            getDashboardCache(),
            getPendingSyncCount(settings),
            getPendingSyncEvents(25, settings),
            getActivityEvents(settings),
            getTrackingTransitions(),
            getFocusSessions(),
            getSiteRules(),
            getSiteClassifications()
          ]);
          return {
            settings,
            device,
            pendingSyncCount,
            pendingSyncEvents,
            runtimeState: context.runtimeState,
            dashboardCache,
            lastError: dashboardCache.lastError,
            activityEvents: events,
            transitions,
            focusSessions,
            siteRules,
            siteClassifications,
            popupModel: buildPopupModel(context, dashboardCache, settings)
          } satisfies BootstrapResponse;
        }
        case MESSAGE_TYPES.refreshViews: {
          await flushCurrentSession(context, "manual-refresh");
          void logTransition(context, "manual-refresh").catch((error) => (
            saveDashboardCache({ lastError: getErrorMessage(error, "Unable to record manual refresh transition") })
          ));
          const dashboardCache = await refreshViews(context);
          void syncQueue().then(() => refreshViews(context, { includeSitesView: true }));
          const settings = await getSettings();
          return {
            dashboardCache,
            popupModel: buildPopupModel(context, dashboardCache, settings)
          };
        }
        case MESSAGE_TYPES.syncNow: {
          await flushCurrentSession(context, "manual-sync");
          await logTransition(context, "manual-sync");
          const sync = await syncQueue();
          const dashboardCache = await refreshViews(context, { includeSitesView: true });
          const settings = await getSettings();
          return {
            sync,
            dashboardCache,
            popupModel: buildPopupModel(context, dashboardCache, settings)
          };
        }
        case MESSAGE_TYPES.retrySiteClassifications: {
          const retriedCount = await retrySiteClassificationsNow(context, refreshViews);
          const [dashboardCache, siteClassifications] = await Promise.all([
            getDashboardCache(),
            getSiteClassifications()
          ]);
          return {
            retriedCount,
            dashboardCache,
            siteClassifications,
            lastError: dashboardCache.lastError
          };
        }
        case MESSAGE_TYPES.startFocusSession:
        {
          const sessions = await getFocusSessions();
          const result = startFocusSession(sessions, {
            intent: message.intent || "Focus block",
            duration_minutes: Number(message.minutes || 45)
          });
          await saveFocusSessions(result.sessions);
          const dashboardCache = await refreshViews(context);
          return { ok: true, session: result.session, dashboardCache };
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
          const dashboardCache = await refreshViews(context);
          return { ok: true, session: result.session, dashboardCache };
        }
        case MESSAGE_TYPES.saveSiteRule: {
          const payload = await saveLocalSiteRule(message.host, message.category, message.excluded);
          void withRegisteredDevice(async (settings, deviceState) => {
            return updateSiteRule(settings.apiBaseUrl, deviceState.deviceId, {
              host: message.host,
              category: message.category,
              excluded: message.excluded
            });
          }).catch((error) => (
            saveDashboardCache({ lastError: getErrorMessage(error, "Unable to send focus nudge") })
          ));
          if (message.host) {
            void ensureClassificationForHost(context, message.host, refreshViews);
            void processSiteClassificationQueue(context, refreshViews);
          }
          const dashboardCache = await refreshViews(context);
          return { ok: true, payload, dashboardCache };
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
        case MESSAGE_TYPES.mediaStateUpdate: {
          if (!sender.tab?.id || sender.tab.id !== context.runtimeState.currentTabId) {
            return { ok: true, ignored: true };
          }

          const nextState = message.isPlayingMedia;
          if (nextState !== context.runtimeState.isPlayingMedia) {
            await flushCurrentSession(context, "media-state-change");
            context.runtimeState.sessionStartedAt = Date.now();
          }
          context.runtimeState.isPlayingMedia = nextState;
          context.runtimeState.mediaStateUpdatedAt = new Date().toISOString();
          await saveRuntimeState(context.runtimeState);
          await logTransition(context, "media-state-change", nextState ? "playing" : "stopped");
          return { ok: true };
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
