import type { TodayView } from "../../../lib/types.js";
import { formatDuration } from "../../../lib/utils.js";

export function Diagnostics({
  view,
  onOpenDebug
}: {
  view: TodayView;
  onOpenDebug: () => void;
}) {
  const summary = view.summary;
  const rows = [
    ["Observed", summary.observed_browser_time_ms || 0],
    ["Tracked", summary.active_tracked_ms || summary.total_duration_ms || 0],
    ["Diagnostic", summary.diagnostic_untracked_ms || 0],
    ["Idle", summary.idle_ms || 0],
    ["Unfocused", summary.unfocused_ms || 0],
    ["Restricted", summary.restricted_ms || 0],
    ["Suspicious", summary.suspicious_gap_ms || 0]
  ] as const;

  return (
    <section className="dashboard-section diagnostics-section" aria-labelledby="diagnosticsHeading">
      <div className="section-heading-line">
        <h2 id="diagnosticsHeading">Diagnostics</h2>
        <button className="debug-link" type="button" onClick={onOpenDebug}>
          Debug <span className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
        </button>
      </div>
      <article className="dashboard-card diagnostic-card">
        {rows.map(([label, value]) => (
          <div className="diagnostic-stat" key={label}>
            <strong>{formatDuration(value)}</strong>
            <span>{label}</span>
          </div>
        ))}
        <div className="diagnostic-stat">
          <strong>{summary.suspicious_gap_count || 0}</strong>
          <span>Gap count</span>
        </div>
      </article>
    </section>
  );
}
