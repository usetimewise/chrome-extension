import { DISTRACTION_CATEGORIES, FOCUS_CATEGORIES } from "./constants.js";
import type { Category, FocusSession, SiteRuleState } from "./types.js";
import { hostMatchesRule } from "./utils.js";
import { lookupCachedUrlDecision, lookupUrlDecision } from "./urlDecision/match.js";
import { parentDomainCandidates } from "./urlDecision/lookupKeys.js";
import { normalizeUrl } from "./urlDecision/normalizeUrl.js";

export type SiteBlockRulePatternType = "domain" | "url_prefix";
export type SiteBlockRuleSource = "default" | "user" | "cache";

export type SiteBlockRule = {
  id: string;
  pattern: string;
  patternType: SiteBlockRulePatternType;
  category: string;
  source: SiteBlockRuleSource;
};

export type FocusBlockDecision =
  | {
      action: "block";
      sessionId: string;
      host: string;
      category: string;
      reason: "user_block_rule" | "default_rule" | "cached_decision" | "lookup_decision";
      matchedRule?: SiteBlockRule;
    }
  | {
      action: "allow";
      reason:
        | "no_active_focus_session"
        | "url_not_normalized"
        | "user_override"
        | "no_local_block_decision"
        | "no_block_decision";
    };

export type DistractionDecision =
  | {
      action: "distracting";
      host: string;
      category: string;
      reason: "user_block_rule" | "default_rule" | "cached_decision" | "lookup_decision";
      matchedRule?: SiteBlockRule;
    }
  | {
      action: "allow";
      reason:
        | "url_not_normalized"
        | "user_override"
        | "no_local_block_decision"
        | "no_block_decision";
    };

export type FocusBlockDecisionContext = {
  sessions?: FocusSession[];
  siteRules?: SiteRuleState | null;
  disabledDefaultBlockRuleIds?: readonly string[];
  apiBaseUrl?: string;
  allowNetworkLookup?: boolean;
};

export type LocalSiteBlockRuleContext = {
  blockedHosts?: readonly string[];
  siteRules?: SiteRuleState | null;
  disabledDefaultBlockRuleIds?: readonly string[];
};

export const DEFAULT_SITE_BLOCK_RULES: SiteBlockRule[] = [
  {
    id: "default:youtube-shorts",
    pattern: "youtube.com/shorts",
    patternType: "url_prefix",
    category: "short_video",
    source: "default"
  },
  {
    id: "default:instagram-reels",
    pattern: "instagram.com/reels",
    patternType: "url_prefix",
    category: "short_video",
    source: "default"
  },
  {
    id: "default:tiktok",
    pattern: "tiktok.com",
    patternType: "domain",
    category: "short_video",
    source: "default"
  },
  {
    id: "default:facebook-reel",
    pattern: "facebook.com/reel",
    patternType: "url_prefix",
    category: "short_video",
    source: "default"
  },
  {
    id: "default:reddit",
    pattern: "reddit.com",
    patternType: "domain",
    category: "social",
    source: "default"
  },
  {
    id: "default:x",
    pattern: "x.com",
    patternType: "domain",
    category: "social",
    source: "default"
  },
  {
    id: "default:twitter",
    pattern: "twitter.com",
    patternType: "domain",
    category: "social",
    source: "default"
  }
];

const DEFAULT_SITE_BLOCK_RULE_IDS = new Set(DEFAULT_SITE_BLOCK_RULES.map((rule) => rule.id));

export function normalizeDisabledDefaultBlockRuleIds(value: readonly string[] | null | undefined): string[] {
  return Array.from(new Set((value || []).filter((id) => DEFAULT_SITE_BLOCK_RULE_IDS.has(id)))).sort();
}

function buildUserBlockRules(siteRules: SiteRuleState | null | undefined): SiteBlockRule[] {
  return Object.entries(siteRules?.categoryOverrides || {})
    .filter(([, category]) => DISTRACTION_CATEGORIES.has(category as Category))
    .map(([pattern, category]) => ({
      id: `user:${pattern}`,
      pattern,
      patternType: "domain" as const,
      category,
      source: "user" as const
    }))
    .sort((left, right) => left.pattern.localeCompare(right.pattern));
}

export function buildEnabledDefaultBlockRules(disabledRuleIds: readonly string[] = []): SiteBlockRule[] {
  const disabledIds = new Set(normalizeDisabledDefaultBlockRuleIds(disabledRuleIds));
  return DEFAULT_SITE_BLOCK_RULES.filter((rule) => !disabledIds.has(rule.id));
}

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

function findUserBlockedRule(host: string, siteRules: SiteRuleState | null | undefined): SiteBlockRule | null {
  return buildUserBlockRules(siteRules).find((rule) => hostMatchesRule(host, rule.pattern)) || null;
}

function matchRule(rawUrl: string, rule: SiteBlockRule): boolean {
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) {
    return false;
  }

  const parsedRule = splitPattern(rule.pattern);
  if (!parsedRule || !parentDomainCandidates(normalized.domain).includes(parsedRule.host)) {
    return false;
  }

  if (rule.patternType === "domain") {
    return true;
  }

  return parsedRule.pathSegments.every((segment, index) => normalized.pathSegments[index] === segment);
}

function findDefaultBlockedRule(rawUrl: string, disabledRuleIds: readonly string[] = []): SiteBlockRule | null {
  return buildEnabledDefaultBlockRules(disabledRuleIds).find((rule) => matchRule(rawUrl, rule)) || null;
}

function buildEffectiveLocalSiteRules(context: LocalSiteBlockRuleContext): SiteRuleState {
  return {
    excludedHosts: [...(context.siteRules?.excludedHosts || [])],
    categoryOverrides: {
      ...Object.fromEntries((context.blockedHosts || []).map((host) => [host, "social" as const])),
      ...(context.siteRules?.categoryOverrides || {})
    }
  };
}

export function buildLocalBlockRules(context: LocalSiteBlockRuleContext = {}): SiteBlockRule[] {
  const effectiveSiteRules = buildEffectiveLocalSiteRules(context);
  return [
    ...buildUserBlockRules(effectiveSiteRules),
    ...buildEnabledDefaultBlockRules(context.disabledDefaultBlockRuleIds)
  ].sort((left, right) => left.pattern.localeCompare(right.pattern));
}

export function isLocalSiteBlocked(rawUrl: string, context: LocalSiteBlockRuleContext = {}): boolean {
  const host = normalizedHost(rawUrl);
  if (!host) {
    return false;
  }

  const effectiveSiteRules = buildEffectiveLocalSiteRules(context);
  if (isUserAllowedHost(host, effectiveSiteRules)) {
    return false;
  }

  return Boolean(findUserBlockedRule(host, effectiveSiteRules) ||
    findDefaultBlockedRule(rawUrl, context.disabledDefaultBlockRuleIds));
}

export async function decideFocusBlock(
  rawUrl: string,
  context: FocusBlockDecisionContext = {}
): Promise<FocusBlockDecision> {
  const session = activeFocusSession(context.sessions);
  if (!session) {
    return { action: "allow", reason: "no_active_focus_session" };
  }

  const decision = await decideDistractionSite(rawUrl, context);
  if (decision.action === "allow") {
    return decision;
  }

  return {
    action: "block",
    sessionId: session.id,
    host: decision.host,
    category: decision.category,
    reason: decision.reason,
    matchedRule: decision.matchedRule
  };
}

export async function decideDistractionSite(
  rawUrl: string,
  context: Omit<FocusBlockDecisionContext, "sessions"> = {}
): Promise<DistractionDecision> {
  const host = normalizedHost(rawUrl);
  if (!host) {
    return { action: "allow", reason: "url_not_normalized" };
  }

  if (isUserAllowedHost(host, context.siteRules)) {
    return { action: "allow", reason: "user_override" };
  }

  const userRule = findUserBlockedRule(host, context.siteRules);
  if (userRule) {
    return {
      action: "distracting",
      host,
      category: userRule.category,
      reason: "user_block_rule",
      matchedRule: userRule
    };
  }

  const defaultRule = findDefaultBlockedRule(rawUrl, context.disabledDefaultBlockRuleIds);
  if (defaultRule) {
    return {
      action: "distracting",
      host,
      category: defaultRule.category,
      reason: "default_rule",
      matchedRule: defaultRule
    };
  }

  const lookupDecision = context.allowNetworkLookup
    ? await lookupUrlDecision(rawUrl, { apiBaseUrl: context.apiBaseUrl, focusMode: "normal" })
    : await lookupCachedUrlDecision(rawUrl, { focusMode: "normal" });
  if (lookupDecision.action === "block") {
    return {
      action: "distracting",
      host,
      category: lookupDecision.category || "other",
      reason: context.allowNetworkLookup ? "lookup_decision" : "cached_decision",
      matchedRule: lookupDecision.matchedKey
        ? {
            id: `${context.allowNetworkLookup ? "lookup" : "cache"}:${lookupDecision.matchedKey}`,
            pattern: lookupDecision.matchedKey,
            patternType: lookupDecision.matchedKey.startsWith("d:") ? "domain" : "url_prefix",
            category: lookupDecision.category || "other",
            source: "cache"
          }
        : undefined
    };
  }

  return { action: "allow", reason: context.allowNetworkLookup ? "no_block_decision" : "no_local_block_decision" };
}
