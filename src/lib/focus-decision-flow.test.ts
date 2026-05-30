import assert from "node:assert/strict";
import test from "node:test";

import { evaluateFocusNudgeNotification } from "../background/focus/focus-session-flow.js";
import type { BackgroundRuntimeContext } from "../background/runtime/runtime-state.js";
import { DEFAULT_RUNTIME_STATE, STORAGE_KEYS } from "./constants.js";
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
  storage[STORAGE_KEYS.siteDecisionCache] = {
    entries: [{
      decision: "block",
      category: "short_video",
      confidence: 1,
      focusMode: "normal",
      cacheType: "url_prefix",
      cacheKey: "youtube.com/shorts",
      expiresAt: Date.now() + 60_000,
      updatedAt: Date.now()
    }]
  };
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
  storage[STORAGE_KEYS.siteDecisionCache] = {
    entries: [{
      decision: "block",
      category: "short_video",
      confidence: 1,
      focusMode: "normal",
      cacheType: "url_prefix",
      cacheKey: "youtube.com/shorts",
      expiresAt: Date.now() + 60_000,
      updatedAt: Date.now()
    }]
  };
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
  storage[STORAGE_KEYS.siteDecisionCache] = {
    entries: [{
      decision: "allow",
      category: "other",
      confidence: 0,
      focusMode: "normal",
      cacheType: "url",
      cacheKey: "youtube.com/shorts/abc",
      expiresAt: Date.now() + 60_000,
      updatedAt: Date.now()
    }]
  };
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("unexpected fetch");
  }) as typeof fetch;

  await evaluateFocusNudgeNotification(baseContext(), activeCache());

  assert.equal(fetchCalls, 0);
  assert.equal(sentMessages.length, 0);
});

test("focus decision cache miss block saves cache and shows overlay", async () => {
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls += 1;
    const body = JSON.parse(String(init?.body || "{}")) as { focus_mode?: string; tab_title?: string };
    assert.equal(body.focus_mode, "normal");
    assert.equal(body.tab_title, "Shorts");
    return {
      ok: true,
      async json() {
        return {
          decision: "block",
          category: "short_video",
          confidence: 1,
          matchedRule: { pattern: "youtube.com/shorts", patternType: "url_prefix" }
        };
      }
    } as Response;
  }) as typeof fetch;

  await evaluateFocusNudgeNotification(baseContext(), activeCache());

  const cache = storage[STORAGE_KEYS.siteDecisionCache] as { entries: Array<{ cacheKey: string; decision: string }> };
  assert.equal(fetchCalls, 1);
  assert.equal(cache.entries[0]?.cacheKey, "youtube.com/shorts");
  assert.equal(cache.entries[0]?.decision, "block");
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
