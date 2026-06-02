import type { Category, DashboardCache, RuntimeState } from "./types.js";

export const STORAGE_KEYS = {
  device: "twt_device_v2",
  queue: "twt_queue_v2",
  dashboardCache: "twt_dashboard_cache_v2",
  runtimeState: "twt_runtime_state_v2",
  activityEvents: "twt_activity_events_v1",
  activityEventsIndex: "twt_activity_events_index_v2",
  activityEventsDayPrefix: "twt_activity_events_day_v2:",
  activityDailyAnalyticsPrefix: "twt_activity_daily_analytics_v1:",
  trackingTransitions: "twt_tracking_transitions_v1",
  focusSessions: "twt_focus_sessions_v1",
  siteRules: "twt_site_rules_v1",
  siteClassifications: "twt_site_classifications_v1",
  siteDecisionCache: "twt_site_decision_cache_v1"
} as const;

export const MESSAGE_TYPES = {
  getBootstrap: "GET_BOOTSTRAP",
  refreshViews: "REFRESH_VIEWS",
  syncNow: "SYNC_NOW",
  retrySiteClassifications: "RETRY_SITE_CLASSIFICATIONS",
  getMediaState: "GET_MEDIA_STATE",
  mediaStateUpdate: "MEDIA_STATE_UPDATE",
  startFocusSession: "START_FOCUS_SESSION",
  pauseFocusSession: "PAUSE_FOCUS_SESSION",
  resumeFocusSession: "RESUME_FOCUS_SESSION",
  endFocusSession: "END_FOCUS_SESSION",
  saveSiteRule: "SAVE_SITE_RULE",
  closeCurrentTab: "CLOSE_CURRENT_TAB",
  forceFocusNudge: "FORCE_FOCUS_NUDGE",
  showFocusNudge: "SHOW_FOCUS_NUDGE",
  focusBlockerBlocked: "FOCUS_BLOCKER_BLOCKED",
  getDebugState: "GET_DEBUG_STATE"
} as const;

export const DEFAULT_DASHBOARD_CACHE: DashboardCache = {
  overview: null,
  todayView: null,
  trendsView: null,
  sitesView: null,
  insightsView: null,
  focusSessionsView: null,
  currentHostCategory: null,
  lastSyncAt: null,
  lastError: null
};

export const DEFAULT_RUNTIME_STATE: RuntimeState = {
  currentHost: null,
  currentUrl: null,
  currentTabId: null,
  currentTabTitle: null,
  currentWindowId: null,
  currentHostStartedAt: null,
  sessionStartedAt: null,
  lastObservedAt: null,
  lastHeartbeatAt: null,
  isWindowFocused: true,
  idleState: "active",
  isPlayingMedia: false,
  mediaStateUpdatedAt: null,
  focusNudgeNotifications: {
    sessionId: null,
    hosts: {}
  }
};

export const CATEGORY_LABELS: Record<Category, string> = {
  work: "Work",
  communication: "Communication",
  learning: "Learning",
  social: "Social",
  entertainment: "Entertainment",
  shopping: "Shopping",
  news: "News",
  tools: "Tools",
  other: "Other",
  excluded: "Excluded"
};

export const FOCUS_CATEGORIES = new Set<Category>(["work", "learning", "tools"]);
export const DISTRACTION_CATEGORIES = new Set<Category>(["social", "entertainment", "shopping", "news"]);
