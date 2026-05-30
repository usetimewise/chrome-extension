import assert from "node:assert/strict";
import test from "node:test";

import {
  buildActionVisualState,
  extractFocusActionState
} from "../background/action/productivity-icon.js";
import type { DashboardCache } from "./types.js";

test("focus action icon exposes stable inactive and active states", () => {
  const inactive = buildActionVisualState(false);
  const active = buildActionVisualState(true);

  assert.equal(inactive.badgeText, "");
  assert.equal(inactive.focusActive, false);
  assert.equal(inactive.stateKey, "focus-inactive");
  assert.equal(inactive.title, "Time Wise: фокусировка выключена");

  assert.equal(active.badgeText, "ON");
  assert.equal(active.focusActive, true);
  assert.equal(active.stateKey, "focus-active");
  assert.equal(active.title, "Time Wise: фокусировка включена");
  assert.notEqual(inactive.iconColor, active.iconColor);
});

test("focus action icon reads active session from dashboard cache", () => {
  const inactiveCache = {
    focusSessionsView: {
      summary: {
        sessions_completed: 0,
        average_duration_ms: 0,
        longest_duration_ms: 0
      },
      active_session: null,
      items: [],
      recommendations: []
    }
  } as DashboardCache;

  const activeCache = {
    focusSessionsView: {
      ...inactiveCache.focusSessionsView,
      active_session: {
        id: "session-1",
        intent: "Focus block",
        status: "active",
        planned_minutes: 45,
        started_at: "2026-05-29T00:00:00.000Z",
        last_resumed_at: "2026-05-29T00:00:00.000Z",
        active_duration_ms: 0,
        pause_count: 0,
        distraction_count: 0
      }
    }
  } as DashboardCache;

  assert.equal(extractFocusActionState(null), false);
  assert.equal(extractFocusActionState(inactiveCache), false);
  assert.equal(extractFocusActionState(activeCache), true);
});
