export const IDLE_DETECTION_OPTIONS = [30, 60, 90, 120, 180, 300, 600, 900, 1800];

export const NUDGE_SENSITIVITY_THRESHOLDS_MINUTES = {
  direct: 1,
  balanced: 10,
  gentle: 18
};

export const APP_SETTINGS = {
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
  nudgeSensitivity: "direct",
  snoozeMinutes: 20,
  workHoursOnly: false,
  aiInsightsEnabled: true,
  aiTone: "balanced",
  excludedHosts: [],
  categoryOverrides: {}
};

export function getAppSettings() {
  return {
    ...APP_SETTINGS,
    workdays: [...APP_SETTINGS.workdays],
    deepWorkBlocks: APP_SETTINGS.deepWorkBlocks.map((block) => ({ ...block })),
    excludedHosts: [...APP_SETTINGS.excludedHosts],
    categoryOverrides: { ...APP_SETTINGS.categoryOverrides }
  };
}
