import type { ActivityEvent, TrackingTransition } from "../../../lib/types.js";

export function formatDate(value?: string | null): string {
  if (!value) {
    return "n/a";
  }

  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return "n/a";
  }

  return new Date(time).toLocaleString();
}

export function statusLabel(event: ActivityEvent): string {
  return event.tracking_status || "active_tracked";
}

export function totalByStatus(events: ActivityEvent[]): Record<string, number> {
  return events.reduce<Record<string, number>>((totals, event) => {
    const status = statusLabel(event);
    totals[status] = (totals[status] || 0) + Number(event.duration_ms || 0);
    return totals;
  }, {});
}

export function latestEvents(events: ActivityEvent[]): ActivityEvent[] {
  return [...events]
    .sort((a, b) => Date.parse(b.occurred_at || "") - Date.parse(a.occurred_at || ""))
    .slice(0, 20);
}

export function latestTransitions(transitions: TrackingTransition[]): TrackingTransition[] {
  return [...transitions]
    .sort((a, b) => Date.parse(b.occurred_at || "") - Date.parse(a.occurred_at || ""))
    .slice(0, 30);
}
