import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFocusSessionsView,
  startFocusSession,
  transitionFocusSession
} from "./local-focus-sessions.js";

test("startFocusSession creates a new active session", () => {
  const started = startFocusSession([], {
    intent: "Write proposal",
    duration_minutes: 30
  }, new Date("2026-04-20T09:00:00.000Z"));

  assert.equal(started.sessions.length, 1);
  assert.equal(started.session.status, "active");
  assert.equal(started.session.intent, "Write proposal");
  assert.equal(started.session.planned_minutes, 30);
  assert.equal(started.session.started_at, "2026-04-20T09:00:00.000Z");
  assert.equal(started.session.last_resumed_at, "2026-04-20T09:00:00.000Z");
  assert.equal(started.session.active_duration_ms, 0);
});

test("startFocusSession reuses an existing active session", () => {
  const started = startFocusSession([], {
    intent: "First block",
    duration_minutes: 45
  }, new Date("2026-04-20T09:00:00.000Z"));

  const repeated = startFocusSession(started.sessions, {
    intent: "Second block",
    duration_minutes: 20
  }, new Date("2026-04-20T09:05:00.000Z"));

  assert.equal(repeated.sessions.length, 1);
  assert.equal(repeated.session.id, started.session.id);
  assert.equal(repeated.session.intent, "First block");
  assert.equal(repeated.session.started_at, "2026-04-20T09:00:00.000Z");
});

test("transitionFocusSession end completes a session and records ended_at", () => {
  const started = startFocusSession([], {
    intent: "Deep work",
    duration_minutes: 45
  }, new Date("2026-04-20T10:00:00.000Z"));

  const ended = transitionFocusSession(
    started.sessions,
    started.session.id,
    "end",
    new Date("2026-04-20T10:15:00.000Z")
  );

  assert.equal(ended.session.status, "completed");
  assert.equal(ended.session.ended_at, "2026-04-20T10:15:00.000Z");
  assert.equal(ended.session.last_resumed_at, null);
  assert.equal(ended.session.active_duration_ms, 15 * 60 * 1000);
});

test("buildFocusSessionsView includes completed sessions in items", () => {
  const started = startFocusSession([], {
    intent: "Read docs",
    duration_minutes: 25
  }, new Date("2026-04-20T11:00:00.000Z"));
  const ended = transitionFocusSession(
    started.sessions,
    started.session.id,
    "end",
    new Date("2026-04-20T11:25:00.000Z")
  );

  const view = buildFocusSessionsView(ended.sessions, new Date("2026-04-20T11:25:00.000Z"));

  assert.equal(view.active_session, null);
  assert.equal(view.items.length, 1);
  assert.equal(view.items[0].id, started.session.id);
  assert.equal(view.items[0].status, "completed");
  assert.equal(view.summary.sessions_completed, 1);
});

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
  assert.equal(ended.session.ended_at, "2026-04-20T10:45:00.000Z");
  assert.equal(ended.session.active_duration_ms, 40 * 60 * 1000);
  assert.equal(view.summary.sessions_completed, 1);
  assert.equal(view.active_session, null);
  assert.equal(view.items[0].status, "completed");
});
