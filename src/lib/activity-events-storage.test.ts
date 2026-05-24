import assert from "node:assert/strict";
import test from "node:test";

import {
  appendActivityEvent,
  getActivityEventDayMeta,
  getActivityEvents,
  getActivityEventsForDays,
  getPendingSyncCount,
  getPendingSyncEvents,
  getRecentActivityEvents,
  getTodayViewActivityEvents,
  markActivityEventsSynced,
  migrateActivityEventsIfNeeded,
  resetActivityEventsStorageStateForTests
} from "./activity-events-storage.js";
import { STORAGE_KEYS } from "./constants.js";
import type { ActivityEvent } from "./types.js";

const settings = { timezone: "UTC" };
let storage: Record<string, unknown> = {};

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function readStorageValue<T>(key: string): T | undefined {
  return storage[key] as T | undefined;
}

function installChromeStorageMock() {
  globalThis.chrome = {
    storage: {
      local: {
        async get(keys: string | string[]) {
          if (Array.isArray(keys)) {
            return Object.fromEntries(keys.map((key) => [key, clone(readStorageValue(key))]));
          }
          if (typeof keys === "string") {
            return { [keys]: clone(readStorageValue(keys)) };
          }
          return clone(storage);
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

function event(id: string, occurredAt: string): ActivityEvent {
  return {
    event_id: id,
    occurred_at: occurredAt,
    is_synced: false,
    duration_ms: 60_000,
    host: "github.com",
    category: "work",
    tracking_status: "active_tracked"
  };
}

test.beforeEach(() => {
  storage = {};
  resetActivityEventsStorageStateForTests();
  installChromeStorageMock();
});

test("migrates retained legacy activity events into day buckets and removes v1 key", async () => {
  storage[STORAGE_KEYS.activityEvents] = [
    event("today", "2026-04-20T10:00:00.000Z"),
    event("yesterday", "2026-04-19T10:00:00.000Z"),
    event("expired", "2026-03-01T10:00:00.000Z"),
    { ...event("invalid", "not-a-date") }
  ];

  await migrateActivityEventsIfNeeded(settings, Date.parse("2026-04-20T12:00:00.000Z"));

  assert.equal(storage[STORAGE_KEYS.activityEvents], undefined);
  assert.equal((storage[STORAGE_KEYS.activityEventsIndex] as { timezone?: string }).timezone, "UTC");
  assert.equal(
    (storage[STORAGE_KEYS.activityEventsIndex] as { dayMeta?: Record<string, { eventCount: number }> })
      .dayMeta?.["2026-04-20"]?.eventCount,
    1
  );
  assert.deepEqual(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-20`], [
    event("today", "2026-04-20T10:00:00.000Z")
  ]);
  assert.deepEqual(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-19`], [
    event("yesterday", "2026-04-19T10:00:00.000Z")
  ]);
  assert.equal(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-03-01`], undefined);
  assert.deepEqual(
    await getActivityEvents(settings, Date.parse("2026-04-20T12:00:00.000Z")),
    [
      event("yesterday", "2026-04-19T10:00:00.000Z"),
      event("today", "2026-04-20T10:00:00.000Z")
    ]
  );
});

test("existing v2 index without meta gets timezone and dayMeta without losing buckets", async () => {
  storage[STORAGE_KEYS.activityEventsIndex] = {
    schemaVersion: 2,
    days: ["2026-04-20"],
    migratedFromV1: true,
    migratedAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z"
  };
  storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-20`] = [
    event("today", "2026-04-20T10:00:00.000Z")
  ];

  await migrateActivityEventsIfNeeded(settings, Date.parse("2026-04-20T12:00:00.000Z"));

  assert.deepEqual(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-20`], [
    event("today", "2026-04-20T10:00:00.000Z")
  ]);
  assert.equal((storage[STORAGE_KEYS.activityEventsIndex] as { timezone?: string }).timezone, "UTC");
  assert.equal(
    (storage[STORAGE_KEYS.activityEventsIndex] as { dayMeta?: Record<string, { eventCount: number }> })
      .dayMeta?.["2026-04-20"]?.eventCount,
    1
  );
});

test("migration merges queued events into day buckets and removes queue key", async () => {
  storage[STORAGE_KEYS.queue] = [
    { ...event("bucketed", "2026-04-20T10:00:00.000Z"), is_synced: true },
    event("missing", "2026-04-19T08:00:00.000Z")
  ];
  storage[STORAGE_KEYS.activityEventsIndex] = {
    schemaVersion: 2,
    days: ["2026-04-20"],
    migratedFromV1: true,
    migratedAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    timezone: "UTC",
    dayMeta: {
      "2026-04-20": { eventCount: 1, fingerprint: "old", updatedAt: "2026-04-20T00:00:00.000Z" }
    }
  };
  storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-20`] = [
    { ...event("bucketed", "2026-04-20T10:00:00.000Z"), is_synced: true }
  ];

  await migrateActivityEventsIfNeeded(settings, Date.parse("2026-04-20T12:00:00.000Z"));

  assert.equal(storage[STORAGE_KEYS.queue], undefined);
  assert.deepEqual(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-20`], [
    { ...event("bucketed", "2026-04-20T10:00:00.000Z"), is_synced: false }
  ]);
  assert.deepEqual(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-19`], [
    { ...event("missing", "2026-04-19T08:00:00.000Z"), is_synced: false }
  ]);
});

test("timezone change rebuckets retained events and removes stale day keys", async () => {
  storage[STORAGE_KEYS.activityEventsIndex] = {
    schemaVersion: 2,
    days: ["2026-04-20"],
    migratedFromV1: true,
    migratedAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    timezone: "UTC",
    dayMeta: {
      "2026-04-20": { eventCount: 1, fingerprint: "old", updatedAt: "2026-04-20T00:00:00.000Z" }
    }
  };
  storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-20`] = [
    event("late", "2026-04-20T20:00:00.000Z")
  ];

  await migrateActivityEventsIfNeeded(
    { timezone: "Asia/Almaty" },
    Date.parse("2026-04-20T21:00:00.000Z")
  );

  assert.equal(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-20`], undefined);
  assert.deepEqual(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-21`], [
    event("late", "2026-04-20T20:00:00.000Z")
  ]);
  assert.deepEqual((storage[STORAGE_KEYS.activityEventsIndex] as { days?: string[] }).days, ["2026-04-21"]);
  assert.equal((storage[STORAGE_KEYS.activityEventsIndex] as { timezone?: string }).timezone, "Asia/Almaty");
});

test("day reads trust buckets when index timezone matches", async () => {
  storage[STORAGE_KEYS.activityEventsIndex] = {
    schemaVersion: 2,
    days: ["2026-04-20"],
    migratedFromV1: true,
    migratedAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    timezone: "UTC",
    dayMeta: {
      "2026-04-20": { eventCount: 1, fingerprint: "old", updatedAt: "2026-04-20T00:00:00.000Z" }
    }
  };
  storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-20`] = [
    event("trusted", "2026-04-19T23:30:00.000Z")
  ];

  assert.deepEqual(
    await getActivityEventsForDays(["2026-04-20"], settings, Date.parse("2026-04-20T12:00:00.000Z")),
    [event("trusted", "2026-04-19T23:30:00.000Z")]
  );
});

test("appendActivityEvent writes only the event day bucket and updates the index", async () => {
  await appendActivityEvent(
    event("today", "2026-04-20T10:00:00.000Z"),
    settings,
    Date.parse("2026-04-20T12:00:00.000Z")
  );

  assert.deepEqual(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-20`], [
    event("today", "2026-04-20T10:00:00.000Z")
  ]);
  assert.equal(storage[STORAGE_KEYS.activityEvents], undefined);
  assert.equal(
    (await getActivityEventDayMeta(["2026-04-20"], settings, Date.parse("2026-04-20T12:00:00.000Z")))
      ["2026-04-20"]?.eventCount,
    1
  );
  assert.deepEqual(
    await getActivityEventsForDays(["2026-04-20"], settings, Date.parse("2026-04-20T12:00:00.000Z")),
    [event("today", "2026-04-20T10:00:00.000Z")]
  );
});

test("appendActivityEvent defaults sync state to unsynced", async () => {
  await appendActivityEvent(
    event("today", "2026-04-20T10:00:00.000Z"),
    settings,
    Date.parse("2026-04-20T12:00:00.000Z")
  );

  assert.deepEqual(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-20`], [
    { ...event("today", "2026-04-20T10:00:00.000Z"), is_synced: false }
  ]);
});

test("pending sync helpers return only unsynced active tracked events and mark accepted ids", async () => {
  storage[STORAGE_KEYS.activityEventsIndex] = {
    schemaVersion: 2,
    days: ["2026-04-19", "2026-04-20"],
    migratedFromV1: true,
    migratedAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    timezone: "UTC",
    dayMeta: {
      "2026-04-19": { eventCount: 2, fingerprint: "old-1", updatedAt: "2026-04-20T00:00:00.000Z" },
      "2026-04-20": { eventCount: 2, fingerprint: "old-2", updatedAt: "2026-04-20T00:00:00.000Z" }
    }
  };
  storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-19`] = [
    { ...event("older-unsynced", "2026-04-19T08:00:00.000Z"), is_synced: false },
    { ...event("older-synced", "2026-04-19T09:00:00.000Z"), is_synced: true }
  ];
  storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-20`] = [
    { ...event("newer-unsynced", "2026-04-20T08:00:00.000Z"), is_synced: false },
    { ...event("diagnostic", "2026-04-20T09:00:00.000Z"), tracking_status: "idle", is_synced: false }
  ];

  assert.deepEqual(
    await getPendingSyncEvents(settings, undefined, Date.parse("2026-04-20T12:00:00.000Z")),
    [
      { ...event("older-unsynced", "2026-04-19T08:00:00.000Z"), is_synced: false },
      { ...event("newer-unsynced", "2026-04-20T08:00:00.000Z"), is_synced: false }
    ]
  );
  assert.equal(await getPendingSyncCount(settings, Date.parse("2026-04-20T12:00:00.000Z")), 2);

  assert.equal(
    await markActivityEventsSynced(["older-unsynced"], settings, Date.parse("2026-04-20T12:00:00.000Z")),
    1
  );
  assert.deepEqual(storage[`${STORAGE_KEYS.activityEventsDayPrefix}2026-04-19`], [
    { ...event("older-unsynced", "2026-04-19T08:00:00.000Z"), is_synced: true },
    { ...event("older-synced", "2026-04-19T09:00:00.000Z"), is_synced: true }
  ]);
  assert.deepEqual(
    await getPendingSyncEvents(settings, undefined, Date.parse("2026-04-20T12:00:00.000Z")),
    [
      { ...event("newer-unsynced", "2026-04-20T08:00:00.000Z"), is_synced: false }
    ]
  );
});

test("today view reads only today and yesterday buckets", async () => {
  await appendActivityEvent(event("today", "2026-04-20T10:00:00.000Z"), settings, Date.parse("2026-04-20T12:00:00.000Z"));
  await appendActivityEvent(event("yesterday", "2026-04-19T10:00:00.000Z"), settings, Date.parse("2026-04-20T12:00:00.000Z"));
  await appendActivityEvent(event("older", "2026-04-18T10:00:00.000Z"), settings, Date.parse("2026-04-20T12:00:00.000Z"));

  assert.deepEqual(
    await getTodayViewActivityEvents(settings, new Date("2026-04-20T12:00:00.000Z")),
    [
      event("yesterday", "2026-04-19T10:00:00.000Z"),
      event("today", "2026-04-20T10:00:00.000Z")
    ]
  );
});

test("recent activity reads the requested rolling day window", async () => {
  await appendActivityEvent(event("today", "2026-04-20T10:00:00.000Z"), settings, Date.parse("2026-04-20T12:00:00.000Z"));
  await appendActivityEvent(event("week", "2026-04-14T10:00:00.000Z"), settings, Date.parse("2026-04-20T12:00:00.000Z"));
  await appendActivityEvent(event("outside", "2026-04-13T10:00:00.000Z"), settings, Date.parse("2026-04-20T12:00:00.000Z"));

  assert.deepEqual(
    await getRecentActivityEvents(settings, 7, new Date("2026-04-20T12:00:00.000Z")),
    [
      event("week", "2026-04-14T10:00:00.000Z"),
      event("today", "2026-04-20T10:00:00.000Z")
    ]
  );
});
