import type { DashboardOverview } from "../../../lib/types.js";
import { formatDuration, humanizeCategory } from "../../../lib/utils.js";
import { EmptyState } from "./empty-state.js";
import { categoryTone, clampPercent } from "../lib/presentation.js";

const CATEGORY_COLORS: Record<string, string> = {
  communication: "#3b82f6",
  entertainment: "#f59e0b",
  learning: "#10b981",
  other: "#9ca3af",
  social: "#ef4444",
  tools: "#8b5cf6",
  work: "#06b6d4"
};

function chartColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#9ca3af";
}

function donutBackground(overview: DashboardOverview): string {
  if (!overview.category_breakdown.length) {
    return "conic-gradient(#e5e7eb 0 100%)";
  }

  let offset = 0;
  const segments = overview.category_breakdown.map((item) => {
    const start = offset;
    const end = Math.min(100, start + clampPercent(item.share));
    offset = end;
    return `${chartColor(item.category)} ${start}% ${end}%`;
  });

  if (offset < 100) {
    segments.push(`#e5e7eb ${offset}% 100%`);
  }

  return `conic-gradient(${segments.join(", ")})`;
}

export function OverviewDashboard({
  overview,
  onOpenDebug
}: {
  overview: DashboardOverview;
  onOpenDebug: () => void;
}) {
  const maxTrendMs = Math.max(...overview.trend.map((point) => point.total_duration_ms), 0);
  const score = overview.summary.productivity_score;

  return (
    <div className="overview-dashboard">
      <section className="overview-metrics" aria-label="Summary metrics">
        <article className="overview-card metric-card">
          <span className="metric-icon fa-regular fa-clock" aria-hidden="true" />
          <strong>{formatDuration(overview.summary.total_duration_ms)}</strong>
          <span>Total time</span>
        </article>
        <article className="overview-card metric-card">
          <span className="metric-icon fa-solid fa-globe" aria-hidden="true" />
          <strong>{overview.summary.sites_visited_count}</strong>
          <span>Sites visited</span>
        </article>
        <article className="overview-card metric-card">
          <span className="metric-icon fa-solid fa-bolt" aria-hidden="true" />
          <strong className="metric-value is-positive">{formatDuration(overview.summary.productive_duration_ms)}</strong>
          <span>Productive</span>
        </article>
        <article className="overview-card metric-card">
          <span className="metric-icon fa-solid fa-mobile-screen-button" aria-hidden="true" />
          <strong className="metric-value is-danger">{formatDuration(overview.summary.social_duration_ms)}</strong>
          <span>Social media</span>
        </article>
      </section>

      <section className="overview-grid overview-grid-top">
        <article className="overview-card">
          <h2>Productivity score</h2>
          <div className="score-layout">
            <div
              className="score-ring"
              style={{ ["--score-value" as string]: `${score.value}` }}
              aria-label={`Productivity score ${score.value}`}
            >
              <strong>{score.value}</strong>
            </div>
            <div className="score-copy">
              <p className="score-badge">
                <span>Grade {score.grade}</span>
                <span aria-hidden="true">-</span>
                <span>{score.label}</span>
              </p>
              <span>{score.message}</span>
            </div>
          </div>
          <p className="score-caption">Based on productive vs unproductive browsing ratio</p>
        </article>

        <article className="overview-card">
          <h2>Category breakdown</h2>
          {overview.category_breakdown.length ? (
            <div className="category-layout">
              <div className="category-donut-wrap">
                <div
                  className="category-donut"
                  style={{ background: donutBackground(overview) }}
                  aria-hidden="true"
                />
              </div>
              <div className="donut-legend">
                {overview.category_breakdown.map((item) => (
                  <div className="category-row" key={item.category}>
                    <span className="category-meta">
                      <span className="category-dot" style={{ backgroundColor: chartColor(item.category) }} aria-hidden="true" />
                      <span>{humanizeCategory(item.category)}</span>
                    </span>
                    <strong>{formatDuration(item.duration_ms)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState>No category data available for this range.</EmptyState>
          )}
        </article>
      </section>

      <section className="overview-grid overview-grid-bottom">
        <article className="overview-card trend-card">
          <h2>Daily trend</h2>
          {overview.trend.length ? (
            <div className="trend-chart" role="img" aria-label="Tracked time trend by day">
              {overview.trend.map((point) => {
                const height = maxTrendMs > 0 ? Math.max(24, Math.round((point.total_duration_ms / maxTrendMs) * 184)) : 24;
                return (
                  <div className="trend-column" key={point.key}>
                    <div className="trend-rail">
                      <span className="trend-bar" style={{ height: `${height}px` }} />
                    </div>
                    <span className="trend-label">{point.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState>No trend data available yet.</EmptyState>
          )}
        </article>

        <article className="overview-card sites-card">
          <div className="section-heading-line">
            <h2>Top sites</h2>
            {import.meta.env.VITE_TIMEWISE_DEV_DEBUG === "true" ? (
              <button className="debug-link" type="button" onClick={onOpenDebug}>
                <span className="fa-solid fa-bug" aria-hidden="true" />
                Debug
              </button>
            ) : null}
          </div>
          {overview.top_sites.length ? (
            <div className="sites-list">
              {overview.top_sites.map((site, index) => (
                <div className="site-row" key={`${site.host || "unknown"}:${index}`}>
                  <span className="site-rank">{index + 1}</span>
                  <span className="site-host-line">
                    <span className="site-favicon fa-solid fa-globe" aria-hidden="true" />
                    <span className="site-host">{site.host || "Unknown site"}</span>
                  </span>
                  <span className={`site-category-pill is-${categoryTone(site.category)}`}>{humanizeCategory(site.category)}</span>
                  <strong className="site-duration">{formatDuration(site.duration_ms)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No top sites for this range yet.</EmptyState>
          )}
        </article>
      </section>
    </div>
  );
}
