import assert from "node:assert/strict";
import test from "node:test";

import {
  FOCUS_OFFER_CLOSE_COOLDOWN_MS,
  FOCUS_OFFER_DEFER_COOLDOWN_MS,
  FOCUS_OFFER_SESSION_COOLDOWN_MS,
  getFocusOfferEligibility
} from "./focus-offer-eligibility.js";
import type { FocusOfferPromptEvent, FocusSession } from "./types.js";

function completedSession(endedAt: number): FocusSession {
  return {
    id: `session-${endedAt}`,
    intent: "Focus",
    status: "completed",
    planned_minutes: 0,
    started_at: new Date(endedAt - 10_000).toISOString(),
    last_resumed_at: null,
    active_duration_ms: 10_000,
    pause_count: 0,
    distraction_count: 0,
    ended_at: new Date(endedAt).toISOString()
  };
}

function event(type: FocusOfferPromptEvent["type"], at: number): FocusOfferPromptEvent {
  return { type, at, host: "reddit.com" };
}

test("focus offer is eligible immediately without previous sessions", () => {
  assert.deepEqual(getFocusOfferEligibility([], [], 1_000), { eligible: true });
});

test("focus offer waits eight hours after the latest completed session", () => {
  const now = Date.parse("2026-04-20T18:00:00.000Z");
  const recent = completedSession(now - FOCUS_OFFER_SESSION_COOLDOWN_MS + 1);
  const old = completedSession(now - FOCUS_OFFER_SESSION_COOLDOWN_MS);

  assert.deepEqual(
    getFocusOfferEligibility([recent], [], now),
    { eligible: false, reason: "recent_completed_session" }
  );
  assert.deepEqual(getFocusOfferEligibility([old], [], now), { eligible: true });
});

test("focus offer respects defer and close cooldown facts", () => {
  const now = Date.parse("2026-04-20T18:00:00.000Z");

  assert.deepEqual(
    getFocusOfferEligibility([], [event("deferred", now - FOCUS_OFFER_DEFER_COOLDOWN_MS + 1)], now),
    { eligible: false, reason: "deferred" }
  );
  assert.deepEqual(
    getFocusOfferEligibility([], [event("closed", now - FOCUS_OFFER_CLOSE_COOLDOWN_MS + 1)], now),
    { eligible: false, reason: "closed" }
  );
  assert.deepEqual(
    getFocusOfferEligibility([], [
      event("deferred", now - FOCUS_OFFER_DEFER_COOLDOWN_MS),
      event("closed", now - FOCUS_OFFER_CLOSE_COOLDOWN_MS)
    ], now),
    { eligible: true }
  );
});
