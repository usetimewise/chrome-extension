import assert from "node:assert/strict";
import test from "node:test";

import { STORAGE_KEYS } from "./constants.js";
import {
  cacheSiteDecision,
  findCachedSiteDecision,
  SITE_DECISION_CACHE_MAX_ENTRIES
} from "./storage/site-decision-cache.js";

let storage: Record<string, unknown> = {};

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function installChromeMock() {
  globalThis.chrome = {
    storage: {
      local: {
        async get(keys: string | string[]) {
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

test.beforeEach(() => {
  storage = {};
  installChromeMock();
});

test("domain rule matches subdomains", async () => {
  const now = Date.now();
  await cacheSiteDecision("https://youtube.com/watch?v=1", "normal", {
    decision: "block",
    category: "video",
    confidence: 1,
    matchedRule: { pattern: "youtube.com", patternType: "domain" }
  }, now);

  const cached = await findCachedSiteDecision("https://m.youtube.com/watch?v=2", "normal", now + 1_000);

  assert.equal(cached?.decision, "block");
  assert.equal(cached?.cacheType, "domain");
});

test("url prefix rule matches nested paths on the same host", async () => {
  const now = Date.now();
  await cacheSiteDecision("https://youtube.com/shorts/abc", "normal", {
    decision: "block",
    category: "short_video",
    confidence: 1,
    matchedRule: { pattern: "youtube.com/shorts", patternType: "url_prefix" }
  }, now);

  const nested = await findCachedSiteDecision("https://youtube.com/shorts/abc/comments", "normal", now + 1_000);
  const otherHost = await findCachedSiteDecision("https://m.youtube.com/shorts/abc", "normal", now + 1_000);

  assert.equal(nested?.decision, "block");
  assert.equal(otherHost, null);
});

test("decision without matched rule is cached only for normalized current url", async () => {
  const now = Date.now();
  await cacheSiteDecision("https://example.com/path?x=1", "normal", {
    decision: "allow",
    category: "other",
    confidence: 0
  }, now);

  const samePath = await findCachedSiteDecision("https://example.com/path?x=2", "normal", now + 1_000);
  const childPath = await findCachedSiteDecision("https://example.com/path/child", "normal", now + 1_000);

  assert.equal(samePath?.decision, "allow");
  assert.equal(childPath, null);
});

test("expired entries are ignored", async () => {
  const now = Date.now();
  await cacheSiteDecision("https://example.com/path", "normal", {
    decision: "block",
    category: "other",
    confidence: 1
  }, now);

  const cached = await findCachedSiteDecision("https://example.com/path", "normal", now + 25 * 60 * 60 * 1000);

  assert.equal(cached, null);
});

test("cache pruning keeps the newest entries within the max size", async () => {
  const now = Date.now();
  for (let index = 0; index < SITE_DECISION_CACHE_MAX_ENTRIES + 5; index += 1) {
    await cacheSiteDecision(`https://example.com/${index}`, "normal", {
      decision: "allow",
      category: "other",
      confidence: 0
    }, now + index);
  }

  const cache = storage[STORAGE_KEYS.siteDecisionCache] as { entries: Array<{ cacheKey: string }> };

  assert.equal(cache.entries.length, SITE_DECISION_CACHE_MAX_ENTRIES);
  assert.equal(cache.entries.some((entry) => entry.cacheKey === "example.com/0"), false);
  assert.equal(cache.entries.some((entry) => entry.cacheKey === `example.com/${SITE_DECISION_CACHE_MAX_ENTRIES + 4}`), true);
});
