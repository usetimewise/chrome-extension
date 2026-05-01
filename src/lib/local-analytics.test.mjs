import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTodayView,
  resolveCategory
} from "./local-analytics.js";

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
