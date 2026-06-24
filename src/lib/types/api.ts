import type { Category } from "./activity.js";
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

export type UpdatePreferencesRequest = Partial<Settings>;
