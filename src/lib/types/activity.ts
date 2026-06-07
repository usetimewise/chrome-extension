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
