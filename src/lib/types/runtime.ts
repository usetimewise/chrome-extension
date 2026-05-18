import type { ActivityEvent, Category, IdleState, SiteRuleState, TrackingTransition } from "./activity.js";
import type { DashboardCache, PopupModel } from "./dashboard.js";
import type { FocusSession } from "./focus.js";

export type NudgeSensitivity = "direct" | "balanced" | "gentle";

export interface Settings {
  apiBaseUrl: string;
  timezone: string;
  trackingPaused: boolean;
  idleDetectionSeconds: number;
  trackMediaWhenIdle: boolean;
  workHoursStart: string;
  workHoursEnd: string;
  workdays: number[];
  deepWorkBlocks: Array<{ start: string; end: string }>;
  nudgesEnabled: boolean;
  nudgeSensitivity: NudgeSensitivity;
  snoozeMinutes: number;
  workHoursOnly: boolean;
  aiInsightsEnabled: boolean;
  aiTone: string;
  excludedHosts: string[];
  categoryOverrides: Record<string, Category>;
}

export interface DeviceState {
  installationId: string;
  deviceId: string | null;
  registeredAt: string | null;
}

export interface RuntimeState {
  currentHost: string | null;
  currentUrl: string | null;
  currentTabId: number | null;
  currentWindowId?: number | null;
  currentHostStartedAt: number | null;
  sessionStartedAt: number | null;
  lastObservedAt?: number | null;
  lastHeartbeatAt?: number | null;
  isWindowFocused: boolean;
  idleState: IdleState;
  isPlayingMedia: boolean;
  mediaStateUpdatedAt: string | null;
  focusNudgeNotifications: {
    sessionId: string | null;
    hosts: Record<string, number>;
  };
}

export interface BootstrapResponse {
  settings?: Settings;
  device?: DeviceState;
  queue?: ActivityEvent[];
  queueSize?: number;
  runtimeState?: RuntimeState;
  transitions?: TrackingTransition[];
  activityEvents?: ActivityEvent[];
  focusSessions?: FocusSession[];
  siteRules?: SiteRuleState;
  dashboardCache?: DashboardCache;
  popupModel?: PopupModel;
}

export interface MediaStateResponse {
  isPlayingMedia?: boolean;
}
