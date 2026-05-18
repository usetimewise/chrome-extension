import type { Category } from "./activity.js";
import type { FocusSession } from "./focus.js";

export interface SummaryView {
  range?: string;
  range_start?: string;
  range_end?: string;
  range_timezone?: string;
  range_local_date?: string;
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
  event_count?: number;
}

export interface TodayMainInsight {
  id?: string;
  title: string;
  body: string;
  emphasis?: string;
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

export interface RecommendationActionPayload {
  minutes?: number;
  host?: string;
  tab?: string;
}

export interface Recommendation {
  id?: string;
  type?: string;
  priority?: string;
  title: string;
  body: string;
  reason_codes?: string[];
  action?: {
    type?: string;
    label?: string;
    payload?: RecommendationActionPayload;
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
    distraction_delta_ms?: number;
    focus_alignment_delta?: number;
    focused_time_yesterday_ms?: number;
  };
  top_sites: TopSite[];
  top_categories: TopCategory[];
  main_insight?: TodayMainInsight;
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

export interface DailyAnalyticsCache<TAnalytics = unknown> {
  schemaVersion: 1;
  dateKey: string;
  timezone: string;
  settingsFingerprint: string;
  eventFingerprint: string;
  analytics: TAnalytics;
  updatedAt: string;
}

export interface SitesView {
  items?: Array<{
    host: string | null;
    category: Category;
    time_today_ms: number;
    time_week_ms: number;
    last_active_at: string;
    focus_impact: "neutral" | "supportive" | "disruptive";
    manual: boolean;
    excluded: boolean;
  }>;
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
