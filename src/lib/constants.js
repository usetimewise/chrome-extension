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
  syncNow: "SYNC_NOW"
};

export const DEFAULT_SETTINGS = {
  apiBaseUrl: "http://80.74.24.127:8081",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  trackingPaused: false,
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
  idleState: "active"
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
