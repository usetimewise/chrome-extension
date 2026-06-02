import { APP_SETTINGS } from "../app-settings.js";
import { devDebugLog, devDebugWarn } from "../dev-debug.js";
import type { SiteDecisionFocusMode } from "../types.js";
import type { LookupBucketEntry } from "./api.js";
import { fetchLookupBuckets } from "./api.js";
import { getCachedBucket, saveBuckets } from "./bucketCache.js";
import { sha256Hex, splitHashPrefixSuffix } from "./hash.js";
import { buildLookupKeyCandidates } from "./lookupKeys.js";
import { normalizeUrl } from "./normalizeUrl.js";

const LOOKUP_PREFIX_BITS = 20;

export type UrlDecisionAction = "allow" | "block" | "unknown";

export type UrlDecisionResult = {
  action: UrlDecisionAction;
  category?: string;
  confidence: number;
  reason: string;
  matchedKey?: string;
  source: "local_hash_prefix_lookup" | "cache" | "unknown" | "error";
};

export type UserContext = {
  apiBaseUrl?: string;
  focusMode?: SiteDecisionFocusMode;
};

type HashCandidate = {
  key: string;
  prefix: string;
  suffix: string;
};

type MatchedEntry = {
  entry: LookupBucketEntry;
  key: string;
  fromCache: boolean;
};

export async function lookupUrlDecision(rawUrl: string, userContext: UserContext = {}): Promise<UrlDecisionResult> {
  const startedAt = performance.now();
  try {
    devDebugLog("urlDecision.lookup.start", {
      focusMode: userContext.focusMode || null
    });

    const normalized = normalizeUrl(rawUrl);
    if (!normalized) {
      devDebugWarn("urlDecision.lookup.normalizeFailed");
      return { action: "unknown", confidence: 0, reason: "url_not_normalized", source: "unknown" };
    }

    const lookupKeys = buildLookupKeyCandidates(normalized);
    devDebugLog("urlDecision.lookup.normalized", {
      pathSegmentCount: normalized.pathSegments.length,
      lookupKeyCount: lookupKeys.length
    });

    const candidates = await buildHashCandidates(lookupKeys);
    const prefixes = Array.from(new Set(candidates.map((candidate) => candidate.prefix)));
    devDebugLog("urlDecision.lookup.hashed", {
      hashCandidateCount: candidates.length,
      uniquePrefixCount: prefixes.length
    });

    const { buckets, allFromCache } = await loadBuckets(userContext.apiBaseUrl || APP_SETTINGS.apiBaseUrl, prefixes);
    const matches = matchCandidates(candidates, buckets, allFromCache);
    devDebugLog("urlDecision.lookup.matched", {
      bucketCount: buckets.length,
      bucketEntryCount: buckets.reduce((total, bucket) => total + bucket.entries.length, 0),
      matchCount: matches.length,
      allFromCache
    });
    if (matches.length === 0) {
      devDebugLog("urlDecision.lookup.result", {
        action: "unknown",
        reason: "no_matching_hash_suffix",
        source: "unknown",
        durationMs: Math.round(performance.now() - startedAt)
      });
      return { action: "unknown", confidence: 0, reason: "no_matching_hash_suffix", source: "unknown" };
    }

    matches.sort(compareMatches);
    const best = matches[0];
    const threshold = focusModeThreshold(userContext.focusMode);
    const action = best.entry.decision === "block" && best.entry.confidence < threshold ? "allow" : best.entry.decision;

    const result: UrlDecisionResult = {
      action,
      category: best.entry.category,
      confidence: Number(best.entry.confidence) || 0,
      reason: action === best.entry.decision ? "matched_hash_suffix" : "matched_below_focus_threshold",
      matchedKey: best.key,
      source: best.fromCache ? "cache" : "local_hash_prefix_lookup"
    };
    devDebugLog("urlDecision.lookup.result", {
      action: result.action,
      category: result.category,
      confidence: result.confidence,
      reason: result.reason,
      source: result.source,
      matchedSpecificity: best.entry.specificity,
      matchedPatternType: best.entry.pattern_type,
      durationMs: Math.round(performance.now() - startedAt)
    });
    return result;
  } catch {
    devDebugWarn("urlDecision.lookup.error", {
      durationMs: Math.round(performance.now() - startedAt)
    });
    return { action: "unknown", confidence: 0, reason: "lookup_error", source: "error" };
  }
}

export async function lookupCachedUrlDecision(rawUrl: string, userContext: UserContext = {}): Promise<UrlDecisionResult> {
  try {
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) {
      return { action: "unknown", confidence: 0, reason: "url_not_normalized", source: "unknown" };
    }

    const lookupKeys = buildLookupKeyCandidates(normalized);
    const candidates = await buildHashCandidates(lookupKeys);
    const prefixes = Array.from(new Set(candidates.map((candidate) => candidate.prefix)));
    const buckets = await loadCachedBuckets(prefixes);
    const matches = matchCandidates(candidates, buckets, true);
    if (matches.length === 0) {
      return { action: "unknown", confidence: 0, reason: "no_cached_matching_hash_suffix", source: "unknown" };
    }

    matches.sort(compareMatches);
    const best = matches[0];
    const threshold = focusModeThreshold(userContext.focusMode);
    const action = best.entry.decision === "block" && best.entry.confidence < threshold ? "allow" : best.entry.decision;
    return {
      action,
      category: best.entry.category,
      confidence: Number(best.entry.confidence) || 0,
      reason: action === best.entry.decision ? "matched_cached_hash_suffix" : "matched_cached_below_focus_threshold",
      matchedKey: best.key,
      source: "cache"
    };
  } catch {
    return { action: "unknown", confidence: 0, reason: "cached_lookup_error", source: "error" };
  }
}

async function buildHashCandidates(keys: string[]): Promise<HashCandidate[]> {
  return Promise.all(keys.map(async (key) => {
    const hash = await sha256Hex(key);
    return { key, ...splitHashPrefixSuffix(hash, LOOKUP_PREFIX_BITS) };
  }));
}

async function loadBuckets(
  apiBaseUrl: string,
  prefixes: string[]
): Promise<{ buckets: Array<{ prefix: string; entries: LookupBucketEntry[] }>; allFromCache: boolean }> {
  const buckets: Array<{ prefix: string; entries: LookupBucketEntry[] }> = [];
  const missingPrefixes: string[] = [];

  for (const prefix of prefixes) {
    const cached = await getCachedBucket(prefix);
    if (cached) {
      buckets.push(cached);
    } else {
      missingPrefixes.push(prefix);
    }
  }

  if (missingPrefixes.length === 0) {
    devDebugLog("urlDecision.lookup.cacheCoverage", {
      requestedPrefixCount: prefixes.length,
      cachedBucketCount: buckets.length,
      missingPrefixCount: 0
    });
    return { buckets, allFromCache: true };
  }

  devDebugLog("urlDecision.lookup.cacheCoverage", {
    requestedPrefixCount: prefixes.length,
    cachedBucketCount: buckets.length,
    missingPrefixCount: missingPrefixes.length
  });

  const response = await fetchLookupBuckets(apiBaseUrl, missingPrefixes);
  if (response.prefix_bits !== LOOKUP_PREFIX_BITS) {
    throw new Error("lookup prefix bits mismatch");
  }

  await saveBuckets(response.buckets, response.expires_at);
  return {
    buckets: [...buckets, ...response.buckets],
    allFromCache: false
  };
}

async function loadCachedBuckets(prefixes: string[]): Promise<Array<{ prefix: string; entries: LookupBucketEntry[] }>> {
  const buckets: Array<{ prefix: string; entries: LookupBucketEntry[] }> = [];
  for (const prefix of prefixes) {
    const cached = await getCachedBucket(prefix);
    if (cached) {
      buckets.push(cached);
    }
  }
  return buckets;
}

function matchCandidates(
  candidates: HashCandidate[],
  buckets: Array<{ prefix: string; entries: LookupBucketEntry[] }>,
  allFromCache: boolean
): MatchedEntry[] {
  const candidatesByPrefix = new Map<string, HashCandidate[]>();
  for (const candidate of candidates) {
    candidatesByPrefix.set(candidate.prefix, [...(candidatesByPrefix.get(candidate.prefix) || []), candidate]);
  }

  const matches: MatchedEntry[] = [];
  for (const bucket of buckets) {
    const prefixCandidates = candidatesByPrefix.get(bucket.prefix) || [];
    for (const entry of bucket.entries) {
      const candidate = prefixCandidates.find((item) => item.suffix === entry.suffix);
      if (candidate) {
        matches.push({ entry, key: candidate.key, fromCache: allFromCache });
      }
    }
  }
  return matches;
}

function compareMatches(left: MatchedEntry, right: MatchedEntry): number {
  if (left.entry.specificity !== right.entry.specificity) {
    return right.entry.specificity - left.entry.specificity;
  }
  if (left.entry.confidence !== right.entry.confidence) {
    return right.entry.confidence - left.entry.confidence;
  }
  if (left.entry.rank !== right.entry.rank) {
    return left.entry.rank - right.entry.rank;
  }
  return String(right.entry.updated_at || "").localeCompare(String(left.entry.updated_at || ""));
}

function focusModeThreshold(focusMode: SiteDecisionFocusMode | undefined): number {
  if (focusMode === "normal") {
    return 0.9;
  }
  return 0;
}
