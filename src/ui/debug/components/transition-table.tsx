import type { TrackingTransition } from "../../../lib/types.js";
import { formatDate, latestTransitions } from "../lib/presentation.js";

export function TransitionTable({ transitions }: { transitions: TrackingTransition[] }) {
  const latest = latestTransitions(transitions);

  return (
    <div className="debug-table" role="table" aria-label="Latest transitions">
      <div className="debug-row debug-head" role="row">
        <span>Type</span>
        <span>Time</span>
        <span>URL class</span>
        <span>Tab</span>
        <span>Reason</span>
      </div>
      {latest.map((transition) => (
        <div className="debug-row" role="row" key={transition.id}>
          <span>{transition.type}</span>
          <span>{formatDate(transition.occurred_at)}</span>
          <span>{transition.url_class || "n/a"}</span>
          <span>{transition.tab_id ?? "none"}</span>
          <span>{transition.reason || "n/a"}</span>
        </div>
      ))}
    </div>
  );
}
