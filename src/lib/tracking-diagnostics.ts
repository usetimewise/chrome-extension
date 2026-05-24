import type { ActivityEvent, TrackingTransition } from "./types.js";

export const MAX_CONTINUOUS_ACTIVE_INTERVAL_MS = 30 * 60 * 1000;
export const TRACKING_TRANSITION_RETENTION_DAYS = 14;
export const MAX_TRACKING_TRANSITIONS = 5_000;

export function isActiveTrackedEvent(event: Pick<ActivityEvent, "tracking_status">): boolean {
  return !event.tracking_status || event.tracking_status === "active_tracked";
}

export function eventsEligibleForSync(events: ActivityEvent[] = []): ActivityEvent[] {
  return events.filter(isActiveTrackedEvent);
}

export function retainTrackingTransitions(
  transitions: TrackingTransition[] = [],
  now = Date.now()
): TrackingTransition[] {
  const cutoff = now - TRACKING_TRANSITION_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const retained = transitions.filter((transition) => {
    const occurredAt = Date.parse(transition.occurred_at || "");
    return !Number.isNaN(occurredAt) && occurredAt >= cutoff;
  });
  return retained.slice(-MAX_TRACKING_TRANSITIONS);
}

export function splitTrackedIntervalForGap(
  startedAt: number,
  endedAt: number,
  status: ActivityEvent["tracking_status"],
  lastObservedAt?: number | null
): Array<{
  startedAt: number;
  endedAt: number;
  durationMs: number;
  status: ActivityEvent["tracking_status"];
  gapMs?: number;
}> {
  const durationMs = endedAt - startedAt;
  if (durationMs <= 0) {
    return [];
  }

  if (status !== "active_tracked" || durationMs <= MAX_CONTINUOUS_ACTIVE_INTERVAL_MS) {
    return [{ startedAt, endedAt, durationMs, status }];
  }

  const activeEndedAt = startedAt + MAX_CONTINUOUS_ACTIVE_INTERVAL_MS;
  const gapMs = endedAt - activeEndedAt;
  const diagnosticStatus = lastObservedAt && endedAt - lastObservedAt > MAX_CONTINUOUS_ACTIVE_INTERVAL_MS
    ? "extension_inactive"
    : "suspicious_gap";

  return [
    {
      startedAt,
      endedAt: activeEndedAt,
      durationMs: MAX_CONTINUOUS_ACTIVE_INTERVAL_MS,
      status
    },
    {
      startedAt: activeEndedAt,
      endedAt,
      durationMs: gapMs,
      status: diagnosticStatus,
      gapMs
    }
  ];
}
