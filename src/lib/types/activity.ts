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

export type FocusDistractionRuleSnapshot = {
  id: string;
  pattern: string;
  patternType: "domain" | "url_prefix";
  category: string;
  source: "default" | "user" | "cache";
};

export type FocusDistractionCounter = {
  rule: FocusDistractionRuleSnapshot;
  totalMs: number;
  lastUrl: string;
  lastHost: string;
  lastUpdatedAt: number;
};

export type FocusDistractionCountersState = {
  sessionId: string | null;
  startedAt: number | null;
  lastDistractedAt: number | null;
  updatedAt: number | null;
  counters: Record<string, FocusDistractionCounter>;
};
