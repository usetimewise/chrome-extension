import type { Recommendation, TodayView as TodayViewModel } from "../../../lib/types.js";
import { formatDuration } from "../../../lib/utils.js";
import { CategoryRows } from "./category-rows.js";
import { Diagnostics } from "./diagnostics.js";
import { EmptyState } from "./empty-state.js";
import { FocusBreaks } from "./focus-breaks.js";
import { Recommendations } from "./recommendations.js";

export function TodayView({
  view,
  onAction,
  onOpenDebug
}: {
  view: TodayViewModel | null;
  onAction: (recommendation: Recommendation) => void;
  onOpenDebug: () => void;
}) {
  if (!view) {
    return <EmptyState>Today view will appear after the first sync.</EmptyState>;
  }

  return (
    <>
      <section className="dashboard-section" aria-labelledby="timeHeading">
        <h2 id="timeHeading">Where did the time go?</h2>
        <article className="dashboard-card time-card">
          <div className="metric-strip">
            <div>
              <strong>{formatDuration(view.summary?.total_duration_ms || 0)}</strong>
              <span>Total tracked</span>
            </div>
            <div>
              <strong className="is-focus">{formatDuration(view.summary?.focus_duration_ms || 0)}</strong>
              <span>Deep focus</span>
            </div>
            <div>
              <strong className="is-danger">{formatDuration(view.summary?.distraction_duration_ms || 0)}</strong>
              <span>Distracted</span>
            </div>
          </div>
          <div className="time-list">
            <CategoryRows view={view} />
          </div>
        </article>
      </section>

      <section className="dashboard-section" aria-labelledby="breaksHeading">
        <h2 id="breaksHeading">What broke my focus?</h2>
        <FocusBreaks view={view} />
      </section>

      <section className="dashboard-section" aria-labelledby="nextHeading">
        <h2 id="nextHeading">What should I do next?</h2>
        <div className="recommendation-list">
          <Recommendations view={view} onAction={onAction} />
        </div>
      </section>

      {import.meta.env.VITE_TIMEWISE_DEV_DEBUG === "true" ? (
        <Diagnostics view={view} onOpenDebug={onOpenDebug} />
      ) : null}
    </>
  );
}
