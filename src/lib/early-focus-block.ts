import { DISTRACTION_CATEGORIES, FOCUS_CATEGORIES } from "./constants.js";
import type { Category, FocusSession, SiteRuleState } from "./types.js";
import { lookupCachedUrlDecision } from "./urlDecision/match.js";
import { normalizeUrl } from "./urlDecision/normalizeUrl.js";
import { parentDomainCandidates } from "./urlDecision/lookupKeys.js";
import { hostMatchesRule } from "./utils.js";

export type EarlyFocusBlockDecision =
  | {
      action: "block";
      sessionId: string;
      host: string;
      category: string;
      reason: "user_block_rule" | "seed_rule" | "cached_decision";
    }
  | {
      action: "allow";
      reason: "no_active_focus_session" | "url_not_normalized" | "user_override" | "no_local_block_decision";
    };

type EarlyBlockRule = {
  pattern: string;
  patternType: "domain" | "url_prefix";
  category: string;
};

const SEEDED_EARLY_BLOCK_RULES: EarlyBlockRule[] = [
  { pattern: "youtube.com/shorts", patternType: "url_prefix", category: "short_video" },
  { pattern: "instagram.com/reels", patternType: "url_prefix", category: "short_video" },
  { pattern: "tiktok.com", patternType: "domain", category: "short_video" },
  { pattern: "facebook.com/reel", patternType: "url_prefix", category: "short_video" },
  { pattern: "reddit.com", patternType: "domain", category: "social" },
  { pattern: "x.com", patternType: "domain", category: "social" },
  { pattern: "twitter.com", patternType: "domain", category: "social" }
];

function activeFocusSession(sessions: FocusSession[] = []): FocusSession | null {
  return sessions.find((session) => session.status === "active") || null;
}

function normalizedHost(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return null;
  }
}

function splitPattern(pattern: string): { host: string; pathSegments: string[] } | null {
  const normalized = normalizeUrl(`https://${pattern}`);
  return normalized ? { host: normalized.domain, pathSegments: normalized.pathSegments } : null;
}

function isUserAllowedHost(host: string, siteRules: SiteRuleState | null | undefined): boolean {
  if (!siteRules) {
    return false;
  }

  if ((siteRules.excludedHosts || []).some((rule) => hostMatchesRule(host, rule))) {
    return true;
  }

  return Object.entries(siteRules.categoryOverrides || {}).some(([ruleHost, category]) => (
    hostMatchesRule(host, ruleHost) && FOCUS_CATEGORIES.has(category as Category)
  ));
}

function findUserBlockedCategory(host: string, siteRules: SiteRuleState | null | undefined): Category | null {
  if (!siteRules) {
    return null;
  }

  for (const [ruleHost, category] of Object.entries(siteRules.categoryOverrides || {})) {
    if (hostMatchesRule(host, ruleHost) && DISTRACTION_CATEGORIES.has(category as Category)) {
      return category as Category;
    }
  }

  return null;
}

function matchSeedRule(rawUrl: string): EarlyBlockRule | null {
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) {
    return null;
  }

  const domains = parentDomainCandidates(normalized.domain);
  for (const rule of SEEDED_EARLY_BLOCK_RULES) {
    const parsedRule = splitPattern(rule.pattern);
    if (!parsedRule || !domains.includes(parsedRule.host)) {
      continue;
    }

    if (rule.patternType === "domain") {
      return rule;
    }

    const [firstSegment] = parsedRule.pathSegments;
    if (firstSegment && normalized.pathSegments[0] === firstSegment) {
      return rule;
    }
  }

  return null;
}

export async function determineEarlyFocusBlock(
  rawUrl: string,
  sessions: FocusSession[] = [],
  siteRules: SiteRuleState | null = null
): Promise<EarlyFocusBlockDecision> {
  const session = activeFocusSession(sessions);
  if (!session) {
    return { action: "allow", reason: "no_active_focus_session" };
  }

  const host = normalizedHost(rawUrl);
  if (!host) {
    return { action: "allow", reason: "url_not_normalized" };
  }

  if (isUserAllowedHost(host, siteRules)) {
    return { action: "allow", reason: "user_override" };
  }

  const userBlockedCategory = findUserBlockedCategory(host, siteRules);
  if (userBlockedCategory) {
    return {
      action: "block",
      sessionId: session.id,
      host,
      category: userBlockedCategory,
      reason: "user_block_rule"
    };
  }

  const seedRule = matchSeedRule(rawUrl);
  if (seedRule) {
    return {
      action: "block",
      sessionId: session.id,
      host,
      category: seedRule.category,
      reason: "seed_rule"
    };
  }

  const cachedDecision = await lookupCachedUrlDecision(rawUrl, { focusMode: "normal" });
  if (cachedDecision.action === "block") {
    return {
      action: "block",
      sessionId: session.id,
      host,
      category: cachedDecision.category || "other",
      reason: "cached_decision"
    };
  }

  return { action: "allow", reason: "no_local_block_decision" };
}
