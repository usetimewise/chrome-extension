import assert from "node:assert/strict";
import test from "node:test";

import {
  eventsEligibleForSync,
  MAX_CONTINUOUS_ACTIVE_INTERVAL_MS,
  retainTrackingTransitions,
  splitTrackedIntervalForGap
} from "./tracking-diagnostics.js";

test("splitTrackedIntervalForGap bounds active time and records suspicious gap", () => {
  const intervals = splitTrackedIntervalForGap(
    1_000,
    1_000 + MAX_CONTINUOUS_ACTIVE_INTERVAL_MS + 10 * 60 * 1000,
    "active_tracked",
    1_000 + MAX_CONTINUOUS_ACTIVE_INTERVAL_MS
  );

  assert.equal(intervals.length, 2);
  assert.equal(intervals[0].durationMs, MAX_CONTINUOUS_ACTIVE_INTERVAL_MS);
  assert.equal(intervals[0].status, "active_tracked");
  assert.equal(intervals[1].durationMs, 10 * 60 * 1000);
  assert.equal(intervals[1].status, "suspicious_gap");
  assert.equal(intervals[1].gapMs, 10 * 60 * 1000);
});

test("splitTrackedIntervalForGap marks stale heartbeat gaps as extension inactive", () => {
  const intervals = splitTrackedIntervalForGap(
    1_000,
    1_000 + MAX_CONTINUOUS_ACTIVE_INTERVAL_MS + 10 * 60 * 1000,
    "active_tracked",
    1_000
  );

  assert.equal(intervals[1].status, "extension_inactive");
});

test("retainTrackingTransitions drops entries older than fourteen days", () => {
  const now = Date.parse("2026-05-13T12:00:00.000Z");
  const retained = retainTrackingTransitions([
    {
      id: "old",
      type: "heartbeat",
      occurred_at: "2026-04-20T12:00:00.000Z"
    },
    {
      id: "fresh",
      type: "heartbeat",
      occurred_at: "2026-05-01T12:00:00.000Z"
    }
  ], now);

  assert.deepEqual(retained.map((item) => item.id), ["fresh"]);
});

test("eventsEligibleForSync excludes diagnostic intervals", () => {
  const eligible = eventsEligibleForSync([
    {
      event_id: "legacy",
      occurred_at: "2026-05-13T10:00:00.000Z",
      duration_ms: 1_000,
      host: "github.com"
    },
    {
      event_id: "active",
      occurred_at: "2026-05-13T10:01:00.000Z",
      duration_ms: 1_000,
      host: "github.com",
      tracking_status: "active_tracked"
    },
    {
      event_id: "idle",
      occurred_at: "2026-05-13T10:02:00.000Z",
      duration_ms: 1_000,
      host: "github.com",
      tracking_status: "idle"
    }
  ]);

  assert.deepEqual(eligible.map((event) => event.event_id), ["legacy", "active"]);
});
