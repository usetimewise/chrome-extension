import assert from "node:assert/strict";
import test from "node:test";

import { STORAGE_KEYS } from "./constants.js";
import { DEFAULT_RUNTIME_STATE } from "./constants.js";
import { processSiteClassificationQueue } from "../background/tracking/site-classification-worker.js";
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

test("successful backend classification backfills queue and persisted events", async () => {
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
  storage[STORAGE_KEYS.queue] = [{
    event_id: "queue-1",
    occurred_at: "2026-05-20T09:00:00.000Z",
    duration_ms: 60_000,
    host: "github.com",
    category: "other",
    tracking_status: "active_tracked"
  }];
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
    (storage[STORAGE_KEYS.queue] as Array<{ category: string }>)[0]?.category,
    "work"
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
