import type { Settings } from "./types.js";

export const APP_SETTINGS: Settings = {
  apiBaseUrl: "http://80.74.24.127:8081",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
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
  categoryOverrides: {},
  selectedCompanionId: "ceo",
  defaultFocusMinutes: 20,
  blockedHosts: []
};

export function getAppSettings(): Settings {
  return {
    ...APP_SETTINGS,
    workdays: [...APP_SETTINGS.workdays],
    deepWorkBlocks: APP_SETTINGS.deepWorkBlocks.map((block) => ({ ...block })),
    excludedHosts: [...APP_SETTINGS.excludedHosts],
    categoryOverrides: { ...APP_SETTINGS.categoryOverrides },
    blockedHosts: [...APP_SETTINGS.blockedHosts]
  };
}
