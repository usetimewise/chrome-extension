import type { ActivityEvent, Category } from "./activity.js";
import type { FocusSession, FocusSessionRequest } from "./focus.js";
import type { FocusSessionsView, SitesView, TodayView } from "./dashboard.js";
import type { Settings } from "./runtime.js";

export interface ApiErrorPayload {
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface RegisterDeviceRequest {
  installation_id: string;
  timezone: string;
  locale: string;
  platform: string;
  app_version: string;
}

export interface RegisterDeviceResponse {
  device_id: string;
}

export interface PushEventsRequest {
  events: ActivityEvent[];
}

export interface PushEventsResponse {
  accepted_event_ids?: string[];
}

export interface TrendsViewResponse {
  summary?: {
    total_duration_ms?: number;
    focus_duration_ms?: number;
    distraction_duration_ms?: number;
  };
  points?: Array<{
    date?: string;
    focus_duration_ms?: number;
    distraction_duration_ms?: number;
    total_duration_ms?: number;
  }>;
  recommendations?: Array<{
    id?: string;
    title?: string;
    body?: string;
  }>;
  range?: string;
}

export interface InsightsViewResponse {
  generated_at?: string;
  tone?: string;
  items?: Array<{
    id?: string;
    type?: string;
    title?: string;
    body?: string;
    priority?: string;
  }>;
  recommendations?: Array<{
    id?: string;
    title?: string;
    body?: string;
  }>;
}

export interface SiteClassificationResult {
  domain: string;
  category?: Category;
  reason?: string;
  error?: string;
}

export interface ClassifySitesRequest {
  domains: string[];
}

export interface ClassifySitesResponse {
  results?: SiteClassificationResult[];
}

export interface UpdateSiteRuleRequest {
  host: string;
  category?: Category;
  excluded: boolean;
}

export interface SiteRuleResponse {
  host?: string;
  category?: Category;
  excluded?: boolean;
  updated_at?: string;
}

export type SiteDecisionValue = "allow" | "block";
export type SiteDecisionFocusMode = "normal";
export type SiteDecisionMatchedRulePatternType = "domain" | "url_prefix";

export interface SiteDecisionMatchedRule {
  pattern: string;
  patternType: SiteDecisionMatchedRulePatternType;
}

export interface SiteDecisionRequest {
  url: string;
  focus_mode: SiteDecisionFocusMode;
  tab_title?: string;
}

export interface SiteDecisionResponse {
  decision: SiteDecisionValue;
  category: string;
  confidence: number;
  matchedRule?: SiteDecisionMatchedRule;
}

export interface UpdatePreferencesRequest extends Partial<Settings> {}

export interface PreferencesResponse {
  updated_at?: string;
  preferences?: Partial<Settings>;
}

export type FocusSessionAction = "pause" | "resume" | "end";

export interface FocusSessionResponse {
  session?: FocusSession;
  sessions?: FocusSession[];
  updated_at?: string;
}

export type {
  FocusSessionRequest,
  FocusSessionsView,
  SitesView,
  TodayView
};
