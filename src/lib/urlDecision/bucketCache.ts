import type { LookupBucket } from "./api.js";
import { devDebugLog } from "../dev-debug.js";

type CachedBucket = {
    bucket: LookupBucket;
    expiresAt: string;
};

const CACHE_KEY_PREFIX = "urlDecisionBucket:v1:";

function cacheKey(prefix: string): string {
    return `${CACHE_KEY_PREFIX}${prefix}`;
}

async function storageGet(key: string): Promise<unknown> {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
        const result = await chrome.storage.local.get(key);
        return result[key];
    }

    if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : undefined;
    }

    return undefined;
}

async function storageSet(values: Record<string, unknown>): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
        await chrome.storage.local.set(values);
        return;
    }

    if (typeof localStorage !== "undefined") {
        for (const [key, value] of Object.entries(values)) {
            localStorage.setItem(key, JSON.stringify(value));
        }
    }
}

async function storageRemove(keys: string[]): Promise<void> {
    if (keys.length === 0) {
        return;
    }

    if (typeof chrome !== "undefined" && chrome.storage?.local) {
        await chrome.storage.local.remove(keys);
        return;
    }

    if (typeof localStorage !== "undefined") {
        for (const key of keys) {
            localStorage.removeItem(key);
        }
    }
}

export async function getCachedBucket(
    prefix: string,
    now = Date.now(),
): Promise<LookupBucket | null> {
    const cached = (await storageGet(cacheKey(prefix))) as
        | Partial<CachedBucket>
        | null
        | undefined;
    if (!cached?.bucket || !cached.expiresAt) {
        devDebugLog("urlDecision.bucketCache.miss");
        return null;
    }

    if (Date.parse(cached.expiresAt) <= now) {
        await storageRemove([cacheKey(prefix)]);
        devDebugLog("urlDecision.bucketCache.expired", {
            entryCount: cached.bucket.entries?.length || 0,
        });
        return null;
    }

    devDebugLog("urlDecision.bucketCache.hit", {
        entryCount: cached.bucket.entries.length,
    });
    return cached.bucket;
}

export async function saveBuckets(
    buckets: LookupBucket[],
    expiresAt: string,
): Promise<void> {
    const values: Record<string, CachedBucket> = {};
    for (const bucket of buckets) {
        values[cacheKey(bucket.prefix)] = { bucket, expiresAt };
    }
    await storageSet(values);
    devDebugLog("urlDecision.bucketCache.save", {
        bucketCount: buckets.length,
        entryCount: buckets.reduce(
            (total, bucket) => total + bucket.entries.length,
            0,
        ),
    });
}

export async function clearExpiredBuckets(now = Date.now()): Promise<void> {
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
        return;
    }

    const all = await chrome.storage.local.get(null);
    const expiredKeys = Object.entries(all)
        .filter(([key, value]) => {
            if (!key.startsWith(CACHE_KEY_PREFIX)) {
                return false;
            }
            const cached = value as Partial<CachedBucket>;
            return !cached.expiresAt || Date.parse(cached.expiresAt) <= now;
        })
        .map(([key]) => key);

    await storageRemove(expiredKeys);
    devDebugLog("urlDecision.bucketCache.clearExpired", {
        expiredCount: expiredKeys.length,
    });
}
