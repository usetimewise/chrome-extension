import assert from "node:assert/strict";
import test from "node:test";

import { syncQueue } from "../background/sync/sync-queue.js";
import { STORAGE_KEYS } from "./constants.js";
import { resetActivityEventsStorageStateForTests } from "./activity-events-storage.js";

let storage: Record<string, unknown> = {};

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function installChromeStorageMock() {
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
  resetActivityEventsStorageStateForTests();
  installChromeStorageMock();
});

test("syncQueue uploads only unsynced active-tracked events, strips local sync metadata, and marks accepted ids", async () => {
  storage[STORAGE_KEYS.device] = {
    installationId: "installation-1",
    deviceId: "device-1",
    registeredAt: "2026-05-20T00:00:00.000Z"
  };
  storage[STORAGE_KEYS.activityEventsIndex] = {
    schemaVersion: 2,
    days: ["2026-05-20"],
    migratedFromV1: true,
    migratedAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z",
    timezone: "UTC",
    dayMeta: {
      "2026-05-20": { eventCount: 3, fingerprint: "old", updatedAt: "2026-05-20T00:00:00.000Z" }
    }
  };
  storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-05-20`] = [
    {
      event_id: "accepted",
      occurred_at: "2026-05-20T09:00:00.000Z",
      duration_ms: 60_000,
      host: "github.com",
      category: "work",
      tracking_status: "active_tracked",
      is_synced: false
    },
    {
      event_id: "pending",
      occurred_at: "2026-05-20T09:01:00.000Z",
      duration_ms: 60_000,
      host: "linear.app",
      category: "work",
      tracking_status: "active_tracked",
      is_synced: false
    },
    {
      event_id: "diagnostic",
      occurred_at: "2026-05-20T09:02:00.000Z",
      duration_ms: 60_000,
      host: "github.com",
      category: "work",
      tracking_status: "idle",
      is_synced: false
    }
  ];

  const requests: unknown[] = [];
  globalThis.fetch = (async (_input, init) => {
    requests.push(JSON.parse(String(init?.body || "{}")));
    return {
      ok: true,
      async json() {
        return { accepted_event_ids: ["accepted"] };
      }
    };
  }) as typeof fetch;

  const result = await syncQueue();

  assert.deepEqual(result, { synced: 1, pendingSyncCount: 1 });
  assert.deepEqual(requests, [{
    events: [
      {
        event_id: "accepted",
        occurred_at: "2026-05-20T09:00:00.000Z",
        duration_ms: 60_000,
        host: "github.com",
        category: "work",
        tracking_status: "active_tracked"
      },
      {
        event_id: "pending",
        occurred_at: "2026-05-20T09:01:00.000Z",
        duration_ms: 60_000,
        host: "linear.app",
        category: "work",
        tracking_status: "active_tracked"
      }
    ]
  }]);
  assert.deepEqual(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-05-20`], [
    {
      event_id: "accepted",
      occurred_at: "2026-05-20T09:00:00.000Z",
      duration_ms: 60_000,
      host: "github.com",
      category: "work",
      tracking_status: "active_tracked",
      is_synced: true
    },
    {
      event_id: "pending",
      occurred_at: "2026-05-20T09:01:00.000Z",
      duration_ms: 60_000,
      host: "linear.app",
      category: "work",
      tracking_status: "active_tracked",
      is_synced: false
    },
    {
      event_id: "diagnostic",
      occurred_at: "2026-05-20T09:02:00.000Z",
      duration_ms: 60_000,
      host: "github.com",
      category: "work",
      tracking_status: "idle",
      is_synced: false
    }
  ]);
});
