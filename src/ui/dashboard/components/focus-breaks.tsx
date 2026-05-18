import type { TodayView } from "../../../lib/types.js";
import { formatDuration, humanizeCategory } from "../../../lib/utils.js";
import { distractingCategories, distractingSites } from "../lib/presentation.js";

export function FocusBreaks({ view }: { view: TodayView }) {
  const sites = distractingSites(view);
  const categories = distractingCategories(view);
  const totalDistractedMs = view.summary?.distraction_duration_ms || 0;
  const topTrigger = sites[0]?.host || (categories[0] ? humanizeCategory(categories[0].category) : "");

  if (!sites.length && !categories.length) {
    return (
      <article className="dashboard-card focus-break-card">
        <p className="break-count"><strong>0</strong> focus breaks today</p>
        <p className="break-trigger">No distracting sites have enough tracked time yet.</p>
      </article>
    );
  }

  return (
    <article className="dashboard-card focus-break-card">
      <p className="break-count"><strong>{sites.length || categories.length}</strong> focus breaks today</p>
      <p className="break-trigger">Most common trigger: {topTrigger}</p>
      <div className="break-list">
        {sites.length
          ? sites.map((site) => (
              <div className="break-row" key={site.host}>
                <span>{humanizeCategory(site.category)}</span>
                <strong>{site.host}</strong>
                <span>{formatDuration(site.duration_ms)}</span>
              </div>
            ))
          : categories.map((item) => (
              <div className="break-row" key={item.category}>
                <span>Category</span>
                <strong>{humanizeCategory(item.category)}</strong>
                <span>{formatDuration(item.duration_ms)}</span>
              </div>
            ))}
      </div>
      {totalDistractedMs ? (
        <p className="break-note">{formatDuration(totalDistractedMs)} total distracted time tracked today.</p>
      ) : null}
    </article>
  );
}
