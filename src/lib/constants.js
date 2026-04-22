export const STORAGE_KEYS = {
  settings: "twt_settings_v2",
  device: "twt_device_v2",
  queue: "twt_queue_v2",
  dashboardCache: "twt_dashboard_cache_v2",
  runtimeState: "twt_runtime_state_v2"
};

export const MESSAGE_TYPES = {
  getBootstrap: "GET_BOOTSTRAP",
  refreshViews: "REFRESH_VIEWS",
  saveSettings: "SAVE_SETTINGS",
  pushPreferences: "PUSH_PREFERENCES",
  syncNow: "SYNC_NOW",
  getMediaState: "GET_MEDIA_STATE",
  mediaStateUpdate: "MEDIA_STATE_UPDATE",
  startFocusSession: "START_FOCUS_SESSION",
  pauseFocusSession: "PAUSE_FOCUS_SESSION",
  resumeFocusSession: "RESUME_FOCUS_SESSION",
  endFocusSession: "END_FOCUS_SESSION",
  saveSiteRule: "SAVE_SITE_RULE"
};

export const IDLE_DETECTION_OPTIONS = [30, 60, 90, 120, 180, 300, 600, 900, 1800];

export const DEFAULT_SETTINGS = {
  apiBaseUrl: "http://80.74.24.127:8081",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  trackingPaused: false,
  idleDetectionSeconds: 60,
  trackMediaWhenIdle: true,
  workHoursStart: "09:00",
  workHoursEnd: "18:00",
  workdays: [1, 2, 3, 4, 5],
  deepWorkBlocks: [{ start: "09:30", end: "11:30" }],
  nudgesEnabled: true,
  nudgeSensitivity: "balanced",
  snoozeMinutes: 20,
  workHoursOnly: true,
  aiInsightsEnabled: true,
  aiTone: "balanced",
  excludedHosts: [],
  categoryOverrides: {}
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
  sessionStartedAt: null,
  isWindowFocused: true,
  idleState: "active",
  isPlayingMedia: false,
  mediaStateUpdatedAt: null
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
