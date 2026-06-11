import { buildFocusSessionsView } from "./local-focus-sessions.js";
import type { FocusOfferPromptEvent, FocusOfferPromptEventType, FocusSession } from "./types.js";

export const FOCUS_OFFER_SESSION_COOLDOWN_MS = 8 * 60 * 60 * 1000;
export const FOCUS_OFFER_DEFER_COOLDOWN_MS = 60 * 60 * 1000;
export const FOCUS_OFFER_CLOSE_COOLDOWN_MS = 16 * 60 * 60 * 1000;

export type FocusOfferEligibility =
  | { eligible: true }
  | {
      eligible: false;
      reason: "active_session" | "recent_completed_session" | "deferred" | "closed";
    };

function latestCompletedSessionEndedAt(sessions: FocusSession[]): number | null {
  const endedAtValues = sessions
    .filter((session) => session.status === "completed" && session.ended_at)
    .map((session) => Date.parse(String(session.ended_at)))
    .filter((value) => Number.isFinite(value));

  return endedAtValues.length > 0 ? Math.max(...endedAtValues) : null;
}

function latestPromptEvent(
  events: readonly FocusOfferPromptEvent[],
  type: FocusOfferPromptEventType
): FocusOfferPromptEvent | null {
  return events
    .filter((event) => event.type === type)
    .sort((left, right) => right.at - left.at)[0] || null;
}

export function getFocusOfferEligibility(
  sessions: FocusSession[],
  events: readonly FocusOfferPromptEvent[],
  now = Date.now()
): FocusOfferEligibility {
  if (buildFocusSessionsView(sessions, new Date(now)).active_session) {
    return { eligible: false, reason: "active_session" };
  }

  const latestEndedAt = latestCompletedSessionEndedAt(sessions);
  if (latestEndedAt !== null && now - latestEndedAt < FOCUS_OFFER_SESSION_COOLDOWN_MS) {
    return { eligible: false, reason: "recent_completed_session" };
  }

  const latestDeferred = latestPromptEvent(events, "deferred");
  if (latestDeferred && now - latestDeferred.at < FOCUS_OFFER_DEFER_COOLDOWN_MS) {
    return { eligible: false, reason: "deferred" };
  }

  const latestClosed = latestPromptEvent(events, "closed");
  if (latestClosed && now - latestClosed.at < FOCUS_OFFER_CLOSE_COOLDOWN_MS) {
    return { eligible: false, reason: "closed" };
  }

  return { eligible: true };
}
