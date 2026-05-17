import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDayAnalytics,
  buildTodayView,
  buildTodayViewFromDayAnalytics,
  resolveCategory
} from "./local-analytics.js";
import type { ActivityEvent } from "./types.js";

const settings = {
  timezone: "UTC",
  workHoursStart: "09:00",
  workHoursEnd: "18:00",
  workdays: [1, 2, 3, 4, 5],
  excludedHosts: [],
  categoryOverrides: {}
};

test("resolveCategory honors overrides, subdomains, and exclusions", () => {
  assert.equal(resolveCategory("github.com", settings), "work");
  assert.equal(resolveCategory("app.youtube.com", settings), "entertainment");
  assert.equal(resolveCategory("youtube.com", {
    ...settings,
    categoryOverrides: { "youtube.com": "learning" }
  }), "learning");
  assert.equal(resolveCategory("news.ycombinator.com", {
    ...settings,
    excludedHosts: ["ycombinator.com"]
  }), "excluded");
});

test("buildTodayView derives local counters and yesterday comparison", () => {
  const view = buildTodayView([
    {
      event_id: "today-work",
      occurred_at: "2026-04-20T10:00:00.000Z",
      duration_ms: 30 * 60 * 1000,
      host: "github.com",
      category: "work"
    },
    {
      event_id: "today-distraction",
      occurred_at: "2026-04-20T11:00:00.000Z",
      duration_ms: 15 * 60 * 1000,
      host: "youtube.com",
      category: "entertainment"
    },
    {
      event_id: "yesterday-work",
      occurred_at: "2026-04-19T10:00:00.000Z",
      duration_ms: 10 * 60 * 1000,
      host: "github.com",
      category: "work"
    }
  ], settings, new Date("2026-04-20T12:00:00.000Z"));

  assert.equal(view.summary.total_duration_ms, 45 * 60 * 1000);
  assert.equal(view.summary.focus_duration_ms, 30 * 60 * 1000);
  assert.equal(view.summary.distraction_duration_ms, 15 * 60 * 1000);
  assert.equal(view.comparison.focus_delta_ms, 20 * 60 * 1000);
  assert.equal(view.top_sites[0].host, "github.com");
  assert.equal(view.top_categories[0].category, "work");
});

test("buildDayAnalytics composes the same today view as the compatibility wrapper", () => {
  const events: ActivityEvent[] = [
    {
      event_id: "today-work",
      occurred_at: "2026-04-20T10:00:00.000Z",
      duration_ms: 30 * 60 * 1000,
      host: "github.com",
      category: "work"
    },
    {
      event_id: "today-distraction",
      occurred_at: "2026-04-20T11:00:00.000Z",
      duration_ms: 15 * 60 * 1000,
      host: "youtube.com",
      category: "entertainment"
    },
    {
      event_id: "yesterday-work",
      occurred_at: "2026-04-19T10:00:00.000Z",
      duration_ms: 10 * 60 * 1000,
      host: "github.com",
      category: "work"
    }
  ];
  const now = new Date("2026-04-20T12:00:00.000Z");

  assert.deepEqual(
    buildTodayViewFromDayAnalytics(
      buildDayAnalytics(events.slice(0, 2), settings, "2026-04-20", now),
      buildDayAnalytics(events.slice(2), settings, "2026-04-19", now),
      settings,
      now
    ),
    buildTodayView(events, settings, now)
  );
});

test("buildTodayView excludes diagnostic intervals from focus metrics and top sites", () => {
  const view = buildTodayView([
    {
      event_id: "tracked-work",
      occurred_at: "2026-04-20T10:00:00.000Z",
      duration_ms: 20 * 60 * 1000,
      host: "github.com",
      category: "work",
      tracking_status: "active_tracked"
    },
    {
      event_id: "idle",
      occurred_at: "2026-04-20T10:30:00.000Z",
      duration_ms: 15 * 60 * 1000,
      host: "github.com",
      tracking_status: "idle"
    },
    {
      event_id: "unfocused",
      occurred_at: "2026-04-20T11:00:00.000Z",
      duration_ms: 5 * 60 * 1000,
      host: "youtube.com",
      category: "entertainment",
      tracking_status: "browser_unfocused"
    },
    {
      event_id: "restricted",
      occurred_at: "2026-04-20T11:30:00.000Z",
      duration_ms: 3 * 60 * 1000,
      host: "browser_internal",
      tracking_status: "restricted_page"
    },
    {
      event_id: "gap",
      occurred_at: "2026-04-20T12:00:00.000Z",
      duration_ms: 7 * 60 * 1000,
      host: "github.com",
      tracking_status: "suspicious_gap"
    }
  ], settings, new Date("2026-04-20T13:00:00.000Z"));

  assert.equal(view.summary.total_duration_ms, 20 * 60 * 1000);
  assert.equal(view.summary.focus_duration_ms, 20 * 60 * 1000);
  assert.equal(view.summary.distraction_duration_ms, 0);
  assert.equal(view.summary.observed_browser_time_ms, 50 * 60 * 1000);
  assert.equal(view.summary.active_tracked_ms, 20 * 60 * 1000);
  assert.equal(view.summary.diagnostic_untracked_ms, 30 * 60 * 1000);
  assert.equal(view.summary.idle_ms, 15 * 60 * 1000);
  assert.equal(view.summary.unfocused_ms, 5 * 60 * 1000);
  assert.equal(view.summary.restricted_ms, 3 * 60 * 1000);
  assert.equal(view.summary.suspicious_gap_ms, 7 * 60 * 1000);
  assert.equal(view.summary.suspicious_gap_count, 1);
  assert.deepEqual(view.top_sites.map((site) => site.host), ["github.com"]);
  assert.deepEqual(view.top_categories.map((item) => item.category), ["work"]);
});

test("buildTodayView merges overlapping duplicate intervals", () => {
  const view = buildTodayView([
    {
      event_id: "heartbeat",
      occurred_at: "2026-04-20T10:00:00.000Z",
      ended_at: "2026-04-20T10:01:00.000Z",
      duration_ms: 60_000,
      host: "github.com",
      category: "work",
      tracking_status: "active_tracked",
      reason: "heartbeat"
    },
    {
      event_id: "tab-change",
      occurred_at: "2026-04-20T10:00:00.000Z",
      ended_at: "2026-04-20T10:01:01.000Z",
      duration_ms: 61_000,
      host: "github.com",
      category: "work",
      tracking_status: "active_tracked",
      reason: "active-tab-change"
    },
    {
      event_id: "idle-duplicate-a",
      occurred_at: "2026-04-20T10:05:00.000Z",
      ended_at: "2026-04-20T10:06:00.000Z",
      duration_ms: 60_000,
      host: "github.com",
      tracking_status: "idle"
    },
    {
      event_id: "idle-duplicate-b",
      occurred_at: "2026-04-20T10:05:30.000Z",
      ended_at: "2026-04-20T10:06:30.000Z",
      duration_ms: 60_000,
      host: "github.com",
      tracking_status: "idle"
    }
  ], settings, new Date("2026-04-20T12:00:00.000Z"));

  assert.equal(view.summary.total_duration_ms, 61_000);
  assert.equal(view.summary.focus_duration_ms, 61_000);
  assert.equal(view.summary.active_tracked_ms, 61_000);
  assert.equal(view.summary.idle_ms, 90_000);
  assert.equal(view.summary.observed_browser_time_ms, 151_000);
  assert.equal(view.summary.event_count, 1);
  assert.equal(view.top_sites[0].duration_ms, 61_000);
});

test("buildTodayView uses real UTC instants for local range boundaries", () => {
  const view = buildTodayView([], {
    ...settings,
    timezone: "Asia/Almaty"
  }, new Date("2026-05-14T13:15:33.000Z"));

  assert.equal(view.summary.range_local_date, "2026-05-14");
  assert.equal(view.summary.range_timezone, "Asia/Almaty");
  assert.equal(view.summary.range_start, "2026-05-13T19:00:00.000Z");
  assert.equal(view.timeline?.[0]?.bucket_start, "2026-05-13T19:00:00.000Z");
  assert.equal(view.timeline?.[9]?.bucket_start, "2026-05-14T04:00:00.000Z");
});
