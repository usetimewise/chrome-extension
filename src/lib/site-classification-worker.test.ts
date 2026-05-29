import assert from "node:assert/strict";
import test from "node:test";

import { STORAGE_KEYS } from "./constants.js";
import { DEFAULT_RUNTIME_STATE } from "./constants.js";
import {
  processSiteClassificationQueue,
  retrySiteClassificationsNow
} from "../background/tracking/site-classification-worker.js";
import type { BackgroundRuntimeContext } from "../background/runtime/runtime-state.js";

let storage: Record<string, unknown> = {};
let createdAlarms: Array<{ name: string; info: chrome.alarms.AlarmCreateInfo }> = [];

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function installChromeMock() {
  globalThis.chrome = {
    alarms: {
      async clear() {
        return true;
      },
      create(name: string, info: chrome.alarms.AlarmCreateInfo) {
        createdAlarms.push({ name, info });
      }
    },
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

function baseContext(): BackgroundRuntimeContext {
  return {
    runtimeState: {
      ...DEFAULT_RUNTIME_STATE,
      focusNudgeNotifications: {
        sessionId: null,
        hosts: {}
      }
    },
    flushQueue: Promise.resolve()
  };
}

test.beforeEach(() => {
  storage = {};
  createdAlarms = [];
  installChromeMock();
});

test("successful backend classification backfills persisted events", async () => {
  storage[STORAGE_KEYS.device] = {
    installationId: "installation-1",
    deviceId: "device-1",
    registeredAt: "2026-05-20T00:00:00.000Z"
  };
  storage[STORAGE_KEYS.siteClassifications] = {
    byHost: {
      "github.com": {
        category: "other",
        status: "pending",
        attempts: 0,
        nextRetryAt: null,
        lastError: null,
        updatedAt: "2026-05-20T00:00:00.000Z"
      }
    }
  };
  storage[STORAGE_KEYS.activityEventsIndex] = {
    schemaVersion: 2,
    days: ["2026-05-20"],
    migratedFromV1: true,
    migratedAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z",
    timezone: "UTC",
    dayMeta: {
      "2026-05-20": { eventCount: 1, fingerprint: "old", updatedAt: "2026-05-20T00:00:00.000Z" }
    }
  };
  storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-05-20`] = [{
    event_id: "stored-1",
    occurred_at: "2026-05-20T09:00:00.000Z",
    duration_ms: 60_000,
    host: "github.com",
    category: "other",
    tracking_status: "active_tracked"
  }];

  globalThis.fetch = (async () => ({
    ok: true,
    async json() {
      return {
        results: [{ domain: "github.com", category: "work" }]
      };
    }
  })) as unknown as typeof fetch;

  let refreshCount = 0;
  await processSiteClassificationQueue(baseContext(), async () => {
    refreshCount += 1;
    return null;
  });

  assert.equal(
    (storage[STORAGE_KEYS.siteClassifications] as { byHost: Record<string, { status: string; category: string }> })
      .byHost["github.com"]?.status,
    "resolved"
  );
  assert.equal(
    (storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-05-20`] as Array<{ category: string }>)[0]?.category,
    "work"
  );
  assert.equal(refreshCount, 1);
});

test("item-level classification error keeps other category and schedules retry", async () => {
  storage[STORAGE_KEYS.device] = {
    installationId: "installation-1",
    deviceId: "device-1",
    registeredAt: "2026-05-20T00:00:00.000Z"
  };
  storage[STORAGE_KEYS.siteClassifications] = {
    byHost: {
      "broken.example": {
        category: "other",
        status: "pending",
        attempts: 0,
        nextRetryAt: null,
        lastError: null,
        updatedAt: "2026-05-20T00:00:00.000Z"
      }
    }
  };

  globalThis.fetch = (async () => ({
    ok: true,
    async json() {
      return {
        results: [{ domain: "broken.example", error: "no match" }]
      };
    }
  })) as unknown as typeof fetch;

  await processSiteClassificationQueue(baseContext(), async () => null);

  const record = (storage[STORAGE_KEYS.siteClassifications] as {
    byHost: Record<string, { category: string; status: string; attempts: number; nextRetryAt: string | null }>
  }).byHost["broken.example"];

  assert.equal(record.category, "other");
  assert.equal(record.status, "retry_scheduled");
  assert.equal(record.attempts, 1);
  assert.ok(record.nextRetryAt);
  assert.equal(createdAlarms.length > 0, true);
});

test("forced retry ignores nextRetryAt and reprocesses failed and scheduled hosts", async () => {
  storage[STORAGE_KEYS.device] = {
    installationId: "installation-1",
    deviceId: "device-1",
    registeredAt: "2026-05-20T00:00:00.000Z"
  };
  storage[STORAGE_KEYS.siteClassifications] = {
    byHost: {
      "failed.example": {
        category: "other",
        status: "failed",
        attempts: 20,
        nextRetryAt: null,
        lastError: "old failure",
        updatedAt: "2026-05-20T00:00:00.000Z"
      },
      "later.example": {
        category: "other",
        status: "retry_scheduled",
        attempts: 1,
        nextRetryAt: "2099-01-01T00:00:00.000Z",
        lastError: "scheduled",
        updatedAt: "2026-05-20T00:00:00.000Z"
      }
    }
  };

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body || "{}")) as { domains?: string[] };
    assert.deepEqual(body.domains?.sort(), ["failed.example", "later.example"]);
    return {
      ok: true,
      async json() {
        return {
          results: [
            { domain: "failed.example", category: "tools" },
            { domain: "later.example", error: "still broken" }
          ]
        };
      }
    };
  }) as typeof fetch;

  let refreshCount = 0;
  const retriedCount = await retrySiteClassificationsNow(baseContext(), async () => {
    refreshCount += 1;
    return null;
  });

  const state = storage[STORAGE_KEYS.siteClassifications] as {
    byHost: Record<string, { status: string; category: string; lastError: string | null }>
  };
  assert.equal(retriedCount, 2);
  assert.equal(state.byHost["failed.example"]?.status, "resolved");
  assert.equal(state.byHost["failed.example"]?.category, "tools");
  assert.equal(state.byHost["failed.example"]?.lastError, null);
  assert.equal(state.byHost["later.example"]?.status, "retry_scheduled");
  assert.equal(state.byHost["later.example"]?.lastError, "still broken");
  assert.equal(refreshCount, 1);
});

test("forced retry applies request-level error policy to every selected host", async () => {
  storage[STORAGE_KEYS.device] = {
    installationId: "installation-1",
    deviceId: "device-1",
    registeredAt: "2026-05-20T00:00:00.000Z"
  };
  storage[STORAGE_KEYS.siteClassifications] = {
    byHost: {
      "pending.example": {
        category: "other",
        status: "pending",
        attempts: 0,
        nextRetryAt: null,
        lastError: null,
        updatedAt: "2026-05-20T00:00:00.000Z"
      },
      "failed.example": {
        category: "other",
        status: "failed",
        attempts: 20,
        nextRetryAt: null,
        lastError: "old failure",
        updatedAt: "2026-05-20T00:00:00.000Z"
      }
    }
  };

  globalThis.fetch = (async () => {
    throw new Error("backend unavailable");
  }) as unknown as typeof fetch;

  const retriedCount = await retrySiteClassificationsNow(baseContext(), async () => null);
  const state = storage[STORAGE_KEYS.siteClassifications] as {
    byHost: Record<string, { status: string; attempts: number; nextRetryAt: string | null; lastError: string | null }>
  };
  const dashboardCache = storage[STORAGE_KEYS.dashboardCache] as { lastError: string | null };

  assert.equal(retriedCount, 2);
  assert.equal(state.byHost["pending.example"]?.status, "retry_scheduled");
  assert.equal(state.byHost["pending.example"]?.attempts, 1);
  assert.ok(state.byHost["pending.example"]?.nextRetryAt);
  assert.equal(state.byHost["failed.example"]?.status, "failed");
  assert.equal(state.byHost["failed.example"]?.attempts, 20);
  assert.equal(state.byHost["failed.example"]?.nextRetryAt, null);
  assert.equal(state.byHost["failed.example"]?.lastError, "backend unavailable");
  assert.equal(dashboardCache.lastError, "backend unavailable");
});
