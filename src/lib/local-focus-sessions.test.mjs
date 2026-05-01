import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFocusSessionsView,
  startFocusSession,
  transitionFocusSession
} from "./local-focus-sessions.js";

test("local focus session lifecycle tracks active duration", () => {
  const started = startFocusSession([], {
    intent: "Ship local source",
    duration_minutes: 45
  }, new Date("2026-04-20T10:00:00.000Z"));

  assert.equal(started.session.status, "active");
  assert.equal(started.session.planned_minutes, 45);

  const paused = transitionFocusSession(
    started.sessions,
    started.session.id,
    "pause",
    new Date("2026-04-20T10:25:00.000Z")
  );
  assert.equal(paused.session.status, "paused");
  assert.equal(paused.session.active_duration_ms, 25 * 60 * 1000);

  const resumed = transitionFocusSession(
    paused.sessions,
    started.session.id,
    "resume",
    new Date("2026-04-20T10:30:00.000Z")
  );
  const ended = transitionFocusSession(
    resumed.sessions,
    started.session.id,
    "end",
    new Date("2026-04-20T10:45:00.000Z")
  );

  const view = buildFocusSessionsView(ended.sessions, new Date("2026-04-20T10:45:00.000Z"));
  assert.equal(ended.session.status, "completed");
  assert.equal(ended.session.active_duration_ms, 40 * 60 * 1000);
  assert.equal(view.summary.sessions_completed, 1);
  assert.equal(view.active_session, null);
});
