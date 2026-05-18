import type { ActivityEvent, BootstrapResponse } from "../../../lib/types.js";
import { formatDuration } from "../../../lib/utils.js";
import { totalByStatus } from "../lib/presentation.js";

export function SummaryCards({
  debugState,
  events
}: {
  debugState: BootstrapResponse | null;
  events: ActivityEvent[];
}) {
  const totals = totalByStatus(events);
  const summary = debugState?.dashboardCache?.todayView?.summary;
  const suspiciousEvents = events.filter((event) => (
    event.tracking_status === "suspicious_gap" ||
    event.tracking_status === "extension_inactive"
  ));

  return (
    <section className="debug-grid" aria-label="Diagnostic totals">
      {Object.entries(totals).map(([status, duration]) => (
        <article className="debug-card" key={status}>
          <strong>{formatDuration(duration)}</strong>
          <span>{status}</span>
        </article>
      ))}
      <article className="debug-card">
        <strong>{summary?.suspicious_gap_count || suspiciousEvents.length}</strong>
        <span>suspicious gaps</span>
      </article>
      <article className="debug-card">
        <strong>{formatDuration(summary?.max_interval_ms || 0)}</strong>
        <span>max interval</span>
      </article>
    </section>
  );
}
