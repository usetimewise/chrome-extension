import assert from "node:assert/strict";
import test from "node:test";

import {
  getDailyAnalyticsCache,
  isDailyAnalyticsCacheValid,
  saveDailyAnalyticsCache
} from "./daily-analytics-cache.js";

let storage: Record<string, unknown> = {};

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function installChromeStorageMock() {
  globalThis.chrome = {
    storage: {
      local: {
        async get(keys) {
          if (typeof keys === "string") {
            return { [keys]: clone(storage[keys]) };
          }
          return clone(storage);
        },
        async set(values) {
          for (const [key, value] of Object.entries(values)) {
            storage[key] = clone(value);
          }
        },
        async remove(keys) {
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            delete storage[key];
          }
        }
      }
    }
  } as typeof chrome;
}

const analytics = {
  schemaVersion: 1 as const,
  dateKey: "2026-04-20",
  summary: {
    total_duration_ms: 0,
    focus_duration_ms: 0,
    distraction_duration_ms: 0,
    focus_alignment: 0
  },
  top_sites: [],
  top_categories: [],
  timeline: [],
  main_insight: {
    title: "Empty",
    body: "No events yet."
  },
  supporting_insights: []
};

test.beforeEach(() => {
  storage = {};
  installChromeStorageMock();
});

test("daily analytics cache validates matching settings and event fingerprints", async () => {
  const record = await saveDailyAnalyticsCache({
    schemaVersion: 1,
    dateKey: "2026-04-20",
    timezone: "UTC",
    settingsFingerprint: "settings-a",
    eventFingerprint: "events-a",
    analytics,
    updatedAt: "2026-04-20T12:00:00.000Z"
  });

  assert.deepEqual(await getDailyAnalyticsCache("2026-04-20"), record);
  assert.equal(isDailyAnalyticsCacheValid(record, {
    dateKey: "2026-04-20",
    timezone: "UTC",
    settingsFingerprint: "settings-a",
    eventFingerprint: "events-a"
  }), true);
});

test("daily analytics cache invalidates settings and event fingerprint changes", async () => {
  const record = {
    schemaVersion: 1 as const,
    dateKey: "2026-04-20",
    timezone: "UTC",
    settingsFingerprint: "settings-a",
    eventFingerprint: "events-a",
    analytics,
    updatedAt: "2026-04-20T12:00:00.000Z"
  };

  assert.equal(isDailyAnalyticsCacheValid(record, {
    dateKey: "2026-04-20",
    timezone: "UTC",
    settingsFingerprint: "settings-b",
    eventFingerprint: "events-a"
  }), false);
  assert.equal(isDailyAnalyticsCacheValid(record, {
    dateKey: "2026-04-20",
    timezone: "UTC",
    settingsFingerprint: "settings-a",
    eventFingerprint: "events-b"
  }), false);
});
