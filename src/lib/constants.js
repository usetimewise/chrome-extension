export const STORAGE_KEYS = {
  settings: "twt_settings",
  device: "twt_device",
  queue: "twt_queue",
  dashboardCache: "twt_dashboard_cache",
  runtimeState: "twt_runtime_state"
};

export const MESSAGE_TYPES = {
  getBootstrap: "GET_BOOTSTRAP",
  refreshDashboard: "REFRESH_DASHBOARD",
  saveSettings: "SAVE_SETTINGS",
  pushPreferences: "PUSH_PREFERENCES",
  syncNow: "SYNC_NOW",
  getMediaState: "GET_MEDIA_STATE",
  mediaStateUpdate: "MEDIA_STATE_UPDATE"
};

export const IDLE_DETECTION_OPTIONS = [
  30, 60, 90, 120, 180, 240, 300, 600, 900, 1200,
  1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600, 7200
];

export const DEFAULT_SETTINGS = {
  apiBaseUrl: "http://80.74.24.127:8081",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  trackingPaused: false,
  idleDetectionSeconds: 60,
  trackMediaWhenIdle: true,
  syncIntervalMinutes: 5,
  limits: {
    social: 90,
    entertainment: 60
  },
  allowList: [],
  blockList: [],
  categoryOverrides: {}
};

export const DEFAULT_DASHBOARD_CACHE = {
  summary: null,
  timeseries: [],
  recommendations: [],
  lastSyncAt: null,
  lastError: null,
  range: "today"
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
  other: "Other"
};

export const FOCUS_CATEGORIES = new Set(["work", "learning", "tools"]);
