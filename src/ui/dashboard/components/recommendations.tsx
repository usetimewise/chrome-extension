import type { Recommendation, TodayView } from "../../../lib/types.js";
import { EmptyState } from "./empty-state.js";
import { recommendationIcon } from "../lib/presentation.js";

export function Recommendations({
  view,
  onAction
}: {
  view: TodayView;
  onAction: (recommendation: Recommendation) => void;
}) {
  const recommendations = (view.recommendations || []).slice(0, 3);

  if (!recommendations.length) {
    return <EmptyState>Recommendations will appear when there is enough signal.</EmptyState>;
  }

  return recommendations.map((item) => {
    const icon = recommendationIcon(item.type || item.id || "");
    const actionLabel = item.action?.label || "Review";

    return (
      <article className="recommendation-card" key={item.id || item.title}>
        <span className={`recommendation-icon fa-solid fa-${icon} is-${icon}`} aria-hidden="true" />
        <div>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          <button
            className="recommendation-action"
            type="button"
            onClick={() => onAction(item)}
          >
            {actionLabel} <span className="fa-solid fa-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </article>
    );
  });
}
