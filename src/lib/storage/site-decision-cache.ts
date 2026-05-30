import { STORAGE_KEYS } from "../constants.js";
import type {
  SiteDecisionFocusMode,
  SiteDecisionMatchedRule,
  SiteDecisionResponse,
  SiteDecisionValue
} from "../types.js";
import { getFromStorage, setInStorage } from "./client.js";

export type SiteDecisionCacheType = "domain" | "url_prefix" | "url";

export interface SiteDecisionCacheEntry {
  decision: SiteDecisionValue;
  category: string;
  confidence: number;
  focusMode: SiteDecisionFocusMode;
  cacheType: SiteDecisionCacheType;
  cacheKey: string;
  matchedRule?: SiteDecisionMatchedRule;
  expiresAt: number;
  updatedAt: number;
}

export interface SiteDecisionCacheState {
  entries: SiteDecisionCacheEntry[];
}

const DECISION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const SITE_DECISION_CACHE_MAX_ENTRIES = 500;

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

function parseURLParts(rawUrl: string): { host: string; pathname: string } | null {
  try {
    const parsed = new URL(rawUrl);
    const host = normalizeHost(parsed.hostname);
    if (!host) {
      return null;
    }
    return {
      host,
      pathname: parsed.pathname || "/"
    };
  } catch {
    return null;
  }
}

function normalizedCurrentURLKey(rawUrl: string): string | null {
  const parts = parseURLParts(rawUrl);
  return parts ? `${parts.host}${parts.pathname}` : null;
}

function splitURLPrefixPattern(pattern: string): { host: string; pathname: string } | null {
  const trimmed = pattern.trim();
  if (!trimmed) {
    return null;
  }

  const withScheme = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  const parsed = parseURLParts(withScheme);
  if (!parsed) {
    return null;
  }

  return parsed;
}

function isPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix.replace(/\/$/, "")}/`);
}

function entryMatchesURL(entry: SiteDecisionCacheEntry, rawUrl: string, focusMode: SiteDecisionFocusMode): boolean {
  if (entry.focusMode !== focusMode) {
    return false;
  }

  const parts = parseURLParts(rawUrl);
  if (!parts) {
    return false;
  }

  if (entry.cacheType === "domain") {
    const domain = normalizeHost(entry.cacheKey);
    return parts.host === domain || parts.host.endsWith(`.${domain}`);
  }

  if (entry.cacheType === "url_prefix") {
    const prefix = splitURLPrefixPattern(entry.cacheKey);
    return Boolean(prefix && parts.host === prefix.host && isPathPrefix(parts.pathname, prefix.pathname));
  }

  return normalizedCurrentURLKey(rawUrl) === entry.cacheKey;
}

function pruneEntries(entries: SiteDecisionCacheEntry[], now = Date.now()): SiteDecisionCacheEntry[] {
  return entries
    .filter((entry) => entry.expiresAt > now)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, SITE_DECISION_CACHE_MAX_ENTRIES);
}

export async function getSiteDecisionCache(): Promise<SiteDecisionCacheState> {
  const cache = await getFromStorage<Partial<SiteDecisionCacheState> | null>(STORAGE_KEYS.siteDecisionCache, null);
  return {
    entries: Array.isArray(cache?.entries) ? cache.entries : []
  };
}

export async function saveSiteDecisionCache(cache: SiteDecisionCacheState, now = Date.now()): Promise<SiteDecisionCacheState> {
  return setInStorage(STORAGE_KEYS.siteDecisionCache, {
    entries: pruneEntries(cache.entries, now)
  });
}

export async function findCachedSiteDecision(
  rawUrl: string,
  focusMode: SiteDecisionFocusMode,
  now = Date.now()
): Promise<SiteDecisionCacheEntry | null> {
  const cache = await getSiteDecisionCache();
  const entries = pruneEntries(cache.entries, now);
  if (entries.length !== cache.entries.length) {
    await saveSiteDecisionCache({ entries }, now);
  }

  return entries.find((entry) => entryMatchesURL(entry, rawUrl, focusMode)) || null;
}

export async function cacheSiteDecision(
  rawUrl: string,
  focusMode: SiteDecisionFocusMode,
  response: SiteDecisionResponse,
  now = Date.now()
): Promise<SiteDecisionCacheEntry | null> {
  const cache = await getSiteDecisionCache();
  const matchedRule = response.matchedRule;
  let cacheType: SiteDecisionCacheType = "url";
  let cacheKey = normalizedCurrentURLKey(rawUrl);

  if (matchedRule?.patternType === "domain") {
    cacheType = "domain";
    cacheKey = normalizeHost(matchedRule.pattern);
  } else if (matchedRule?.patternType === "url_prefix") {
    const prefix = splitURLPrefixPattern(matchedRule.pattern);
    cacheType = "url_prefix";
    cacheKey = prefix ? `${prefix.host}${prefix.pathname}` : null;
  }

  if (!cacheKey) {
    return null;
  }

  const entry: SiteDecisionCacheEntry = {
    decision: response.decision,
    category: response.category || "other",
    confidence: Number(response.confidence) || 0,
    focusMode,
    cacheType,
    cacheKey,
    matchedRule,
    expiresAt: now + DECISION_CACHE_TTL_MS,
    updatedAt: now
  };

  const nextEntries = pruneEntries([
    entry,
    ...cache.entries.filter((existing) => (
      existing.focusMode !== entry.focusMode ||
      existing.cacheType !== entry.cacheType ||
      existing.cacheKey !== entry.cacheKey
    ))
  ], now);

  await saveSiteDecisionCache({ entries: nextEntries }, now);
  return entry;
}
