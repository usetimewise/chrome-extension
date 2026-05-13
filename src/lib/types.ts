export type Category =
  | "work"
  | "communication"
  | "learning"
  | "social"
  | "entertainment"
  | "shopping"
  | "news"
  | "tools"
  | "other"
  | "excluded";

export type FocusSessionStatus = "active" | "paused" | "completed";
export type IdleState = "active" | "idle" | "locked";
export type NudgeSensitivity = "direct" | "balanced" | "gentle";
export type TrackingStatus =
  | "active_tracked"
  | "idle"
  | "locked"
  | "browser_unfocused"
  | "restricted_page"
  | "unknown_url"
  | "excluded"
  | "tracking_paused"
  | "suspicious_gap"
  | "extension_inactive";

export type TrackingTransitionType =
  | "startup"
  | "heartbeat"
  | "manual-refresh"
  | "manual-sync"
  | "tab-activated"
  | "tab-updated"
  | "window-focus"
  | "idle-change"
  | "media-state-change"
  | "suspend";

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

export interface ActivityEvent {
  event_id: string;
  occurred_at: string;
  ended_at?: string;
  duration_ms: number;
  url?: string | null;
  host: string | null;
  path_hash?: string;
  window_focused?: boolean;
  idle_state?: IdleState;
  is_playing_media?: boolean;
  gap_ms?: number;
  window_id?: number | null;
  tab_id?: number | null;
  tracking_status?: TrackingStatus;
  client_version?: string;
  category?: Category;
  reason?: string;
}

export interface TrackingTransition {
  id: string;
  type: TrackingTransitionType;
  occurred_at: string;
  tab_id?: number | null;
  window_id?: number | null;
  url_class?: TrackingStatus | "trackable";
  host?: string | null;
  window_focused?: boolean;
  idle_state?: IdleState;
  is_playing_media?: boolean;
  reason?: string;
}

export interface SiteRuleState {
  excludedHosts: string[];
  categoryOverrides: Record<string, Category>;
}

export interface FocusSession {
  id: string;
  intent: string;
  status: FocusSessionStatus;
  planned_minutes: number;
  started_at: string;
  last_resumed_at: string | null;
  active_duration_ms: number;
  pause_count: number;
  distraction_count: number;
  ended_at?: string;
  remaining_ms?: number;
}

export interface FocusSessionRequest {
  intent?: string;
  duration_minutes?: number;
  minutes?: number;
}

export interface SummaryView {
  total_duration_ms: number;
  focus_duration_ms: number;
  distraction_duration_ms: number;
  focus_score?: number;
  focus_alignment: number;
  observed_browser_time_ms?: number;
  active_tracked_ms?: number;
  diagnostic_untracked_ms?: number;
  idle_ms?: number;
  locked_ms?: number;
  unfocused_ms?: number;
  restricted_ms?: number;
  unknown_ms?: number;
  suspicious_gap_ms?: number;
  suspicious_gap_count?: number;
  max_interval_ms?: number;
}

export interface TopSite {
  host: string;
  category: Category;
  duration_ms: number;
}

export interface TopCategory {
  category: Category;
  duration_ms: number;
  share?: number;
}

export interface Recommendation {
  id?: string;
  type?: string;
  priority?: string;
  title: string;
  body: string;
  action?: {
    type?: string;
    label?: string;
    payload?: {
      minutes?: number;
    };
  };
}

export interface TodayView {
  summary: SummaryView;
  status?: {
    label: string;
    tone: string;
    message: string;
  };
  comparison?: {
    label: string;
    focus_delta_ms?: number;
    focus_alignment_delta?: number;
  };
  top_sites: TopSite[];
  top_categories: TopCategory[];
  main_insight?: {
    title: string;
    body: string;
  };
  recommendations?: Recommendation[];
  timeline?: Array<{
    label: string;
    bucket_start: string;
    total_duration_ms: number;
    focus_duration_ms: number;
    distraction_duration_ms: number;
  }>;
  supporting_insights?: Array<{
    id: string;
    title: string;
    body: string;
    emphasis: string;
    action?: Recommendation["action"];
  }>;
}

export interface SitesView {
  items?: TopSite[];
  top_sites?: TopSite[];
  top_categories?: TopCategory[];
  rules?: Array<{
    host: string;
    category?: Category;
    excluded?: boolean;
  }>;
  suggestions?: unknown[];
  available_filters?: string[];
}

export interface FocusSessionsView {
  summary: {
    sessions_completed: number;
    average_duration_ms: number;
    longest_duration_ms: number;
  };
  active_session: FocusSession | null;
  items: FocusSession[];
  recommendations: Recommendation[];
}

export interface DashboardCache {
  todayView: TodayView | null;
  trendsView: unknown;
  sitesView: SitesView | null;
  insightsView: unknown;
  focusSessionsView: FocusSessionsView | null;
  currentHostCategory: Category | null;
  lastSyncAt: string | null;
  lastError: string | null;
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

export interface PopupModel {
  state: "empty" | "default" | "focus_active" | "drifting";
  statusLabel: string;
  statusMessage: string;
  trackedTimeMs: number;
  focusedTimeMs: number;
  distractedTimeMs: number;
  focusAlignment: number;
  comparisonLabel: string;
  comparisonValue: number;
  topCategories: TopCategory[];
  topSites: TopSite[];
  insight: {
    title: string;
    body: string;
  };
  currentSite: {
    host: string;
    category: Category;
    dwellMs: number;
  } | null;
  focusSession: FocusSession | null;
  primaryAction: {
    type: string;
    label: string;
  };
  secondaryActions: Array<{
    type: string;
    label: string;
  }>;
  canReclassify: boolean;
}

export interface BootstrapResponse {
  settings?: Settings;
  device?: DeviceState;
  queueSize?: number;
  runtimeState?: RuntimeState;
  transitions?: TrackingTransition[];
  activityEvents?: ActivityEvent[];
  dashboardCache?: DashboardCache;
  popupModel?: PopupModel;
}

export interface MediaStateResponse {
  isPlayingMedia?: boolean;
}

export interface ApiErrorPayload {
  error?: string;
}

export interface RegisterDeviceResponse {
  device_id: string;
}

export interface PushEventsResponse {
  accepted_event_ids?: string[];
}
