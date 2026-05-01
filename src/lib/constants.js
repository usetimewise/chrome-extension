export const STORAGE_KEYS = {
  device: "twt_device_v2",
  queue: "twt_queue_v2",
  dashboardCache: "twt_dashboard_cache_v2",
  runtimeState: "twt_runtime_state_v2"
};

export const MESSAGE_TYPES = {
  getBootstrap: "GET_BOOTSTRAP",
  refreshViews: "REFRESH_VIEWS",
  syncNow: "SYNC_NOW",
  getMediaState: "GET_MEDIA_STATE",
  mediaStateUpdate: "MEDIA_STATE_UPDATE",
  startFocusSession: "START_FOCUS_SESSION",
  pauseFocusSession: "PAUSE_FOCUS_SESSION",
  resumeFocusSession: "RESUME_FOCUS_SESSION",
  endFocusSession: "END_FOCUS_SESSION",
  saveSiteRule: "SAVE_SITE_RULE",
  forceFocusNudge: "FORCE_FOCUS_NUDGE",
  showFocusNudge: "SHOW_FOCUS_NUDGE"
};

export const DEFAULT_DASHBOARD_CACHE = {
  todayView: null,
  trendsView: null,
  sitesView: null,
  insightsView: null,
  focusSessionsView: null,
  currentHostCategory: null,
  lastSyncAt: null,
  lastError: null
};

export const DEFAULT_RUNTIME_STATE = {
  currentHost: null,
  currentUrl: null,
  currentTabId: null,
  currentHostStartedAt: null,
  sessionStartedAt: null,
  isWindowFocused: true,
  idleState: "active",
  isPlayingMedia: false,
  mediaStateUpdatedAt: null,
  focusNudgeNotifications: {
    sessionId: null,
    hosts: {}
  }
};

export const CATEGORY_LABELS = {
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

export const FOCUS_CATEGORIES = new Set(["work", "learning", "tools"]);
export const DISTRACTION_CATEGORIES = new Set(["social", "entertainment", "shopping", "news"]);
