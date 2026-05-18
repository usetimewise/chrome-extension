import type { ActivityEvent } from "../../../lib/types.js";
import { formatDuration } from "../../../lib/utils.js";
import { formatDate, latestEvents, statusLabel } from "../lib/presentation.js";

export function IntervalTable({ events }: { events: ActivityEvent[] }) {
  const latest = latestEvents(events);

  return (
    <div className="debug-table" role="table" aria-label="Latest intervals">
      <div className="debug-row debug-head" role="row">
        <span>Status</span>
        <span>Start</span>
        <span>Duration</span>
        <span>Host</span>
        <span>Reason</span>
      </div>
      {latest.map((event) => (
        <div className="debug-row" role="row" key={event.event_id}>
          <span>{statusLabel(event)}</span>
          <span>{formatDate(event.occurred_at)}</span>
          <span>{formatDuration(event.duration_ms)}</span>
          <span>{event.host || "none"}</span>
          <span>{event.reason || "n/a"}</span>
        </div>
      ))}
    </div>
  );
}
