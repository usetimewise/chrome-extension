import { STORAGE_KEYS } from "../constants.js";
import type { Category, SiteClassificationRecord, SiteClassificationState, SiteClassificationStatus } from "../types.js";
import { hostMatchesRule } from "../utils.js";
import { getFromStorage, setInStorage } from "./client.js";

const MAX_CLASSIFICATION_ATTEMPTS = 20;
const INITIAL_RETRY_DELAY_MS = 30_000;
const MAX_RETRY_DELAY_MS = 24 * 60 * 60 * 1000;

function normalizeHost(host: string | null | undefined): string {
  return String(host || "").trim().toLowerCase().replace(/^www\./, "");
}

function normalizeState(state: SiteClassificationState | null | undefined): SiteClassificationState {
  return {
    byHost: Object.fromEntries(
      Object.entries(state?.byHost || {})
        .map(([host, value]) => [normalizeHost(host), value])
        .filter(([host]) => Boolean(host))
    )
  };
}

export function effectiveCategoryForHost(
  host: string | null | undefined,
  options: {
    excludedHosts?: string[];
    categoryOverrides?: Record<string, Category>;
    classifiedCategory?: Category | null;
  } = {}
): Category {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return "other";
  }

  if ((options.excludedHosts || []).some((rule) => hostMatchesRule(normalizedHost, rule))) {
    return "excluded";
  }

  for (const [rule, category] of Object.entries(options.categoryOverrides || {})) {
    if (hostMatchesRule(normalizedHost, rule)) {
      return category;
    }
  }

  return options.classifiedCategory || "other";
}

export function classificationBackoffDelayMs(attempts: number): number {
  if (attempts <= 0) {
    return INITIAL_RETRY_DELAY_MS;
  }
  return Math.min(INITIAL_RETRY_DELAY_MS * (2 ** (attempts - 1)), MAX_RETRY_DELAY_MS);
}

export async function getSiteClassifications(): Promise<SiteClassificationState> {
  const state = await getFromStorage<SiteClassificationState | null>(STORAGE_KEYS.siteClassifications, null);
  return normalizeState(state);
}

export async function saveSiteClassifications(state: SiteClassificationState): Promise<SiteClassificationState> {
  return setInStorage(STORAGE_KEYS.siteClassifications, normalizeState(state));
}

export async function getSiteClassification(host: string | null | undefined): Promise<SiteClassificationRecord | null> {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return null;
  }

  const state = await getSiteClassifications();
  return state.byHost[normalizedHost] || null;
}

export function getResolvedClassificationCategory(
  host: string | null | undefined,
  state: SiteClassificationState | null | undefined
): Category | null {
  const normalizedHost = normalizeHost(host);
  const record = normalizedHost ? state?.byHost?.[normalizedHost] : null;
  return record?.status === "resolved" ? record.category : null;
}

export async function ensureSiteClassificationPending(host: string): Promise<SiteClassificationState> {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return getSiteClassifications();
  }

  const state = await getSiteClassifications();
  const existing = state.byHost[normalizedHost];
  if (existing?.status === "resolved" || existing?.status === "failed" || existing?.status === "pending") {
    return state;
  }

  state.byHost[normalizedHost] = {
    category: existing?.category || "other",
    status: "pending",
    attempts: existing?.attempts || 0,
    nextRetryAt: null,
    lastError: existing?.lastError || null,
    updatedAt: new Date().toISOString()
  };
  return saveSiteClassifications(state);
}

export async function saveResolvedSiteClassification(
  host: string,
  category: Category
): Promise<SiteClassificationState> {
  const normalizedHost = normalizeHost(host);
  const state = await getSiteClassifications();
  const existing = state.byHost[normalizedHost];
  state.byHost[normalizedHost] = {
    category,
    status: "resolved",
    attempts: existing?.attempts || 0,
    nextRetryAt: null,
    lastError: null,
    updatedAt: new Date().toISOString()
  };
  return saveSiteClassifications(state);
}

export async function scheduleSiteClassificationRetry(
  host: string,
  error: string
): Promise<SiteClassificationState> {
  const normalizedHost = normalizeHost(host);
  const state = await getSiteClassifications();
  const existing = state.byHost[normalizedHost];
  const attempts = Math.min((existing?.attempts || 0) + 1, MAX_CLASSIFICATION_ATTEMPTS);
  const status: SiteClassificationStatus = attempts >= MAX_CLASSIFICATION_ATTEMPTS ? "failed" : "retry_scheduled";
  const nextRetryAt = status === "failed"
    ? null
    : new Date(Date.now() + classificationBackoffDelayMs(attempts)).toISOString();

  state.byHost[normalizedHost] = {
    category: existing?.category || "other",
    status,
    attempts,
    nextRetryAt,
    lastError: error,
    updatedAt: new Date().toISOString()
  };
  return saveSiteClassifications(state);
}

export async function clearSiteClassification(host: string): Promise<SiteClassificationState> {
  const normalizedHost = normalizeHost(host);
  const state = await getSiteClassifications();
  delete state.byHost[normalizedHost];
  return saveSiteClassifications(state);
}

export async function getHostsReadyForClassification(limit = 100, now = Date.now()): Promise<string[]> {
  const state = await getSiteClassifications();
  return Object.entries(state.byHost)
    .filter(([, record]) => {
      if (record.status === "pending") {
        return true;
      }
      if (record.status !== "retry_scheduled" || !record.nextRetryAt) {
        return false;
      }
      const retryAt = Date.parse(record.nextRetryAt);
      return !Number.isNaN(retryAt) && retryAt <= now;
    })
    .sort(([, left], [, right]) => {
      const leftAt = left.nextRetryAt ? Date.parse(left.nextRetryAt) : 0;
      const rightAt = right.nextRetryAt ? Date.parse(right.nextRetryAt) : 0;
      return leftAt - rightAt;
    })
    .slice(0, limit)
    .map(([host]) => host);
}

export function selectHostsForForcedClassification(state: SiteClassificationState, limit = 100): string[] {
  return Object.entries(state.byHost)
    .filter(([, record]) => (
      record.status === "pending" ||
      record.status === "retry_scheduled" ||
      record.status === "failed"
    ))
    .sort(([leftHost], [rightHost]) => leftHost.localeCompare(rightHost))
    .slice(0, limit)
    .map(([host]) => host);
}

export async function getNextClassificationRetryAt(): Promise<number | null> {
  const state = await getSiteClassifications();
  let nextRetryAt: number | null = null;

  for (const record of Object.values(state.byHost)) {
    if (record.status !== "retry_scheduled" || !record.nextRetryAt) {
      continue;
    }
    const retryAt = Date.parse(record.nextRetryAt);
    if (Number.isNaN(retryAt)) {
      continue;
    }
    nextRetryAt = nextRetryAt === null ? retryAt : Math.min(nextRetryAt, retryAt);
  }

  return nextRetryAt;
}
