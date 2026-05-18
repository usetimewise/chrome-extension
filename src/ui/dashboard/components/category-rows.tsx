import type { TodayView } from "../../../lib/types.js";
import { formatDuration, humanizeCategory } from "../../../lib/utils.js";
import { EmptyState } from "./empty-state.js";
import {
  categoryTone,
  clampPercent,
  percentLabel,
  sortedByDuration
} from "../lib/presentation.js";

export function CategoryRows({ view }: { view: TodayView }) {
  const categories = sortedByDuration(view.top_categories || []);
  const totalMs = view.summary?.total_duration_ms || 0;

  if (!categories.length) {
    return <EmptyState>No category signal yet.</EmptyState>;
  }

  return categories.map((item) => {
    const share = item.share || (totalMs ? item.duration_ms / totalMs : 0);
    const width = clampPercent(share);
    const tone = categoryTone(item.category);

    return (
      <div className="time-row" key={item.category}>
        <div className="time-row-head">
          <strong>{humanizeCategory(item.category)}</strong>
          <span>{formatDuration(item.duration_ms)}</span>
        </div>
        <div className="time-row-body">
          <div className="dashboard-bar" aria-hidden="true">
            <span className={`bar-fill is-${tone}`} style={{ width: `${width}%` }} />
          </div>
          <span>{percentLabel(share)}</span>
        </div>
      </div>
    );
  });
}
