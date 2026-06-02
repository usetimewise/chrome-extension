import assert from "node:assert/strict";
import test from "node:test";

import { evaluateFocusNudgeNotification } from "../background/focus/focus-session-flow.js";
import type { BackgroundRuntimeContext } from "../background/runtime/runtime-state.js";
import { DEFAULT_RUNTIME_STATE, STORAGE_KEYS } from "./constants.js";
import type { LookupBucketEntry } from "./urlDecision/api.js";
import { sha256Hex, splitHashPrefixSuffix } from "./urlDecision/hash.js";
import { buildLookupKeyCandidates } from "./urlDecision/lookupKeys.js";
import { normalizeUrl } from "./urlDecision/normalizeUrl.js";
import type { DashboardCache } from "./types.js";

let storage: Record<string, unknown> = {};
let sentMessages: Array<{ tabId: number; message: unknown }> = [];
let injectedScripts: Array<{ tabId: number; files: string[] }> = [];
let fetchCalls = 0;

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function installChromeMock(options: { failFirstMessage?: boolean } = {}) {
  let sendAttempts = 0;

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
    },
    tabs: {
      async sendMessage(tabId: number, message: unknown) {
        sendAttempts += 1;
        if (options.failFirstMessage && sendAttempts === 1) {
          throw new Error("Receiving end does not exist.");
        }
        sentMessages.push({ tabId, message });
        return { ok: true };
      }
    },
    scripting: {
      async executeScript({ target, files }: { target: { tabId?: number }; files?: string[] }) {
        if (typeof target.tabId === "number" && Array.isArray(files)) {
          injectedScripts.push({ tabId: target.tabId, files });
        }
        return [];
      }
    }
  } as typeof chrome;
}

function baseContext(url = "https://youtube.com/shorts/abc"): BackgroundRuntimeContext {
  return {
    runtimeState: {
      ...DEFAULT_RUNTIME_STATE,
      currentHost: "youtube.com",
      currentUrl: url,
      currentTabId: 7,
      currentTabTitle: "Shorts",
      focusNudgeNotifications: {
        sessionId: null,
        hosts: {}
      }
    },
    flushQueue: Promise.resolve()
  };
}

function activeCache(): DashboardCache {
  return {
    overview: null,
    todayView: null,
    trendsView: null,
    sitesView: null,
    insightsView: null,
    focusSessionsView: {
      summary: {
        sessions_completed: 0,
        average_duration_ms: 0,
        longest_duration_ms: 0
      },
      active_session: {
        id: "session-1",
        intent: "focus",
        status: "active",
        planned_minutes: 45,
        active_duration_ms: 0,
        started_at: "2026-05-30T00:00:00.000Z",
        last_resumed_at: "2026-05-30T00:00:00.000Z",
        pause_count: 0,
        distraction_count: 0
      },
      items: [],
      recommendations: []
    },
    currentHostCategory: "other",
    lastSyncAt: null,
    lastError: null
  };
}

async function hashCandidateKeys(rawUrl: string) {
  const normalized = normalizeUrl(rawUrl);
  assert.ok(normalized);
  return Promise.all(buildLookupKeyCandidates(normalized).map(async (key) => ({
    key,
    ...splitHashPrefixSuffix(await sha256Hex(key), 20)
  })));
}

async function cacheBucketsForUrl(rawUrl: string, entriesByKey: Record<string, LookupBucketEntry> = {}) {
  for (const candidate of await hashCandidateKeys(rawUrl)) {
    const entry = entriesByKey[candidate.key];
    storage[`urlDecisionBucket:v1:${candidate.prefix}`] = {
      bucket: {
        prefix: candidate.prefix,
        entries: entry ? [{ ...entry, suffix: candidate.suffix }] : []
      },
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    };
  }
}

test.beforeEach(() => {
  storage = {
    [STORAGE_KEYS.device]: {
      installationId: "installation-1",
      deviceId: "device-1",
      registeredAt: "2026-05-30T00:00:00.000Z"
    }
  };
  sentMessages = [];
  injectedScripts = [];
  fetchCalls = 0;
  installChromeMock();
});

test("focus decision cache hit block shows overlay without fetch", async () => {
  await cacheBucketsForUrl("https://youtube.com/shorts/abc", {
    "p1:youtube.com/shorts": {
      suffix: "",
      decision: "block",
      category: "short_video",
      confidence: 1,
      rank: 10,
      pattern_type: "url_prefix",
      specificity: 2
    }
  });
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("unexpected fetch");
  }) as typeof fetch;

  await evaluateFocusNudgeNotification(baseContext(), activeCache());

  assert.equal(fetchCalls, 0);
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0]?.tabId, 7);
});

test("focus decision block injects overlay content script when the tab has no receiver yet", async () => {
  installChromeMock({ failFirstMessage: true });
  await cacheBucketsForUrl("https://youtube.com/shorts/abc", {
    "p1:youtube.com/shorts": {
      suffix: "",
      decision: "block",
      category: "short_video",
      confidence: 1,
      rank: 10,
      pattern_type: "url_prefix",
      specificity: 2
    }
  });
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("unexpected fetch");
  }) as typeof fetch;

  await evaluateFocusNudgeNotification(baseContext(), activeCache());

  assert.equal(fetchCalls, 0);
  assert.deepEqual(injectedScripts, [{ tabId: 7, files: ["assets/focus-nudge.js"] }]);
  assert.equal(sentMessages.length, 1);
});

test("focus decision cache hit allow does not show overlay or fetch", async () => {
  await cacheBucketsForUrl("https://youtube.com/shorts/abc", {
    "p1:youtube.com/shorts": {
      suffix: "",
      decision: "allow",
      category: "other",
      confidence: 0,
      rank: 10,
      pattern_type: "url_prefix",
      specificity: 2
    }
  });
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("unexpected fetch");
  }) as typeof fetch;

  await evaluateFocusNudgeNotification(baseContext(), activeCache());

  assert.equal(fetchCalls, 0);
  assert.equal(sentMessages.length, 0);
});

test("focus decision cache miss block saves cache and shows overlay", async () => {
  const candidates = await hashCandidateKeys("https://youtube.com/shorts/abc");
  const matchingCandidate = candidates.find((candidate) => candidate.key === "p1:youtube.com/shorts");
  assert.ok(matchingCandidate);

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls += 1;
    assert.equal(String(input), "http://80.74.24.127:8081/v1/url-decision/lookup-buckets");
    const body = JSON.parse(String(init?.body || "{}")) as { schema_version?: number; prefixes?: string[]; url?: string; tab_title?: string };
    assert.equal(body.schema_version, 1);
    assert.ok(Array.isArray(body.prefixes));
    assert.equal(body.url, undefined);
    assert.equal(body.tab_title, undefined);
    return {
      ok: true,
      async json() {
        return {
          schema_version: 1,
          prefix_bits: 20,
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          buckets: body.prefixes?.map((prefix) => ({
            prefix,
            entries: prefix === matchingCandidate.prefix
              ? [{
                  suffix: matchingCandidate.suffix,
                  decision: "block",
                  category: "short_video",
                  confidence: 1,
                  rank: 10,
                  pattern_type: "url_prefix",
                  specificity: 2
                }]
              : []
          }))
        };
      }
    } as Response;
  }) as typeof fetch;

  await evaluateFocusNudgeNotification(baseContext(), activeCache());

  assert.equal(fetchCalls, 1);
  assert.ok(storage[`urlDecisionBucket:v1:${matchingCandidate.prefix}`]);
  assert.equal(sentMessages.length, 1);
});

test("focus decision api error fails open without overlay", async () => {
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return {
      ok: false,
      status: 500,
      async json() {
        return { error: "server error" };
      }
    } as Response;
  }) as typeof fetch;

  await evaluateFocusNudgeNotification(baseContext(), activeCache());

  assert.equal(fetchCalls, 1);
  assert.equal(sentMessages.length, 0);
});
