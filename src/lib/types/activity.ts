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

export type IdleState = "active" | "idle" | "locked";

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

export type SiteClassificationStatus =
  | "pending"
  | "resolved"
  | "retry_scheduled"
  | "failed";

export interface SiteClassificationRecord {
  category: Category;
  status: SiteClassificationStatus;
  attempts: number;
  nextRetryAt: string | null;
  lastError: string | null;
  updatedAt: string;
}

export interface SiteClassificationState {
  byHost: Record<string, SiteClassificationRecord>;
}
