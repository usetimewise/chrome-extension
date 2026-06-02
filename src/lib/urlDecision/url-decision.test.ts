import assert from "node:assert/strict";
import test from "node:test";

import type { LookupBucketEntry } from "./api.js";
import { getCachedBucket, saveBuckets } from "./bucketCache.js";
import { sha256Hex, splitHashPrefixSuffix } from "./hash.js";
import { buildLookupKeyCandidates, buildLookupKeys, parentDomainCandidates } from "./lookupKeys.js";
import { lookupUrlDecision } from "./match.js";
import { normalizeUrl } from "./normalizeUrl.js";

let storage: Record<string, unknown> = {};

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function installChromeMock() {
  globalThis.chrome = {
    storage: {
      local: {
        async get(keys: string | string[] | null) {
          if (keys === null) {
            return clone(storage);
          }
          if (Array.isArray(keys)) {
            return Object.fromEntries(keys.map((key) => [key, clone(storage[key])]));
          }
          return { [keys]: clone(storage[keys]) };
        },
        async set(values: Record<string, unknown>) {
          for (const [key, value] of Object.entries(values)) {
            storage[key] = clone(value);
          }
        },
        async remove(keys: string | string[]) {
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            delete storage[key];
          }
        }
      }
    }
  } as typeof chrome;
}

async function hashedKey(key: string) {
  return splitHashPrefixSuffix(await sha256Hex(key), 20);
}

function entry(overrides: Partial<LookupBucketEntry> = {}): LookupBucketEntry {
  return {
    suffix: "",
    decision: "block",
    category: "short_video",
    confidence: 0.95,
    rank: 10,
    pattern_type: "url_prefix",
    specificity: 2,
    ...overrides
  };
}

test.beforeEach(() => {
  storage = {};
  installChromeMock();
});

test("normalizes URLs without query params, fragments, or private segments", () => {
  assert.deepEqual(normalizeUrl("https://www.youtube.com/watch?v=abc#comments"), {
    domain: "youtube.com",
    pathSegments: ["watch"]
  });
  assert.deepEqual(normalizeUrl("https://youtube.com/shorts/abc123?feature=share"), {
    domain: "youtube.com",
    pathSegments: ["shorts", "abc123"]
  });
  assert.deepEqual(normalizeUrl("https://example.com/reset-password/abcdefghijklmnopqrstuvwxyzabcdef123456"), {
    domain: "example.com",
    pathSegments: ["reset-password"]
  });
});

test("builds lookup keys and parent-domain candidates", () => {
  assert.deepEqual(buildLookupKeys({ domain: "youtube.com", pathSegments: [] }), ["d:youtube.com"]);
  assert.deepEqual(buildLookupKeys({ domain: "youtube.com", pathSegments: ["shorts"] }), [
    "d:youtube.com",
    "p1:youtube.com/shorts"
  ]);
  assert.deepEqual(buildLookupKeys({ domain: "reddit.com", pathSegments: ["r", "programming"] }), [
    "d:reddit.com",
    "p1:reddit.com/r",
    "p2:reddit.com/r/programming"
  ]);
  assert.deepEqual(parentDomainCandidates("mail.google.com"), ["mail.google.com", "google.com"]);
  assert.deepEqual(parentDomainCandidates("news.bbc.co.uk"), ["news.bbc.co.uk", "bbc.co.uk", "co.uk"]);
});

test("splits SHA-256 hashes for 20-bit prefixes", async () => {
  const hash = await sha256Hex("d:youtube.com");
  const { prefix, suffix } = splitHashPrefixSuffix(hash, 20);
  assert.equal(prefix.length, 5);
  assert.equal(suffix.length, 59);
});

test("bucket cache returns fresh buckets and drops expired buckets", async () => {
  await saveBuckets([{ prefix: "abcde", entries: [] }], new Date(Date.now() + 60_000).toISOString());
  assert.deepEqual(await getCachedBucket("abcde"), { prefix: "abcde", entries: [] });

  await saveBuckets([{ prefix: "fffff", entries: [] }], new Date(Date.now() - 60_000).toISOString());
  assert.equal(await getCachedBucket("fffff"), null);
});

test("lookupUrlDecision matches suffixes locally and chooses higher specificity", async () => {
  const domainHash = await hashedKey("d:youtube.com");
  const p1Hash = await hashedKey("p1:youtube.com/shorts");
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body || "{}")) as { prefixes: string[] };
    return {
      ok: true,
      async json() {
        return {
          schema_version: 1,
          prefix_bits: 20,
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          buckets: body.prefixes.map((prefix) => ({
            prefix,
            entries: [
              ...(prefix === domainHash.prefix ? [entry({
                suffix: domainHash.suffix,
                category: "video",
                confidence: 1,
                pattern_type: "domain",
                specificity: 1
              })] : []),
              ...(prefix === p1Hash.prefix ? [entry({
                suffix: p1Hash.suffix,
                category: "short_video",
                confidence: 0.95,
                pattern_type: "url_prefix",
                specificity: 2
              })] : [])
            ]
          }))
        };
      }
    } as Response;
  }) as typeof fetch;

  const result = await lookupUrlDecision("https://youtube.com/shorts/abc?feature=share", {
    apiBaseUrl: "https://api.example.com",
    focusMode: "normal"
  });

  assert.equal(result.action, "block");
  assert.equal(result.category, "short_video");
  assert.equal(result.matchedKey, "p1:youtube.com/shorts");
});

test("lookupUrlDecision returns unknown for no matches and errors", async () => {
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body || "{}")) as { prefixes: string[] };
    return {
      ok: true,
      async json() {
        return {
          schema_version: 1,
          prefix_bits: 20,
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          buckets: body.prefixes.map((prefix) => ({ prefix, entries: null as unknown as LookupBucketEntry[] }))
        };
      }
    } as Response;
  }) as typeof fetch;

  assert.equal((await lookupUrlDecision("https://example.com/path", { apiBaseUrl: "https://api.example.com" })).action, "unknown");

  globalThis.fetch = (async () => {
    throw new Error("network");
  }) as typeof fetch;

  assert.deepEqual(
    await lookupUrlDecision("https://uncached.example.com/path", { apiBaseUrl: "https://api.example.com" }),
    { action: "unknown", confidence: 0, reason: "lookup_error", source: "error" }
  );
});

test("lookup candidates include specific keys for parent domains", () => {
  const normalized = normalizeUrl("https://m.youtube.com/shorts/abc");
  assert.ok(normalized);
  assert.ok(buildLookupKeyCandidates(normalized).includes("p1:youtube.com/shorts"));
});
