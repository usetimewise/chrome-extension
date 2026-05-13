import { type ReactNode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./common.css";
import "./dashboard.css";

import {
  DISTRACTION_CATEGORIES,
  FOCUS_CATEGORIES,
  MESSAGE_TYPES
} from "../lib/constants.js";
import type {
  BootstrapResponse,
  Category,
  Recommendation,
  TodayView,
  TopCategory,
  TopSite
} from "../lib/types.js";
import {
  formatDuration,
  humanizeCategory
} from "../lib/utils.js";

async function sendMessage<TResponse = BootstrapResponse>(message: Record<string, unknown>): Promise<TResponse> {
  return chrome.runtime.sendMessage(message);
}

function localDate(): string {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function clampPercent(value?: number): number {
  return Math.max(0, Math.min(100, Math.round((value || 0) * 100)));
}

function percentLabel(value?: number): string {
  return `${clampPercent(value)}%`;
}

function categoryTone(category: Category): "danger" | "focus" | "communication" | "neutral" {
  if (DISTRACTION_CATEGORIES.has(category)) {
    return "danger";
  }
  if (FOCUS_CATEGORIES.has(category)) {
    return "focus";
  }
  if (category === "communication") {
    return "communication";
  }
  return "neutral";
}

function sortedByDuration<T extends { duration_ms?: number; category?: Category; host?: string }>(items: T[] = []): T[] {
  return [...items].sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0));
}

function distractingSites(view: TodayView): TopSite[] {
  return sortedByDuration(view.top_sites || [])
    .filter((item) => DISTRACTION_CATEGORIES.has(item.category))
    .slice(0, 3);
}

function distractingCategories(view: TodayView): TopCategory[] {
  return sortedByDuration(view.top_categories || [])
    .filter((item) => DISTRACTION_CATEGORIES.has(item.category))
    .slice(0, 2);
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="dashboard-empty">{children}</div>;
}

function CategoryRows({ view }: { view: TodayView }) {
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

function FocusBreaks({ view }: { view: TodayView }) {
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

function Diagnostics({ view }: { view: TodayView }) {
  const summary = view.summary;
  const rows = [
    ["Observed", summary.observed_browser_time_ms || 0],
    ["Tracked", summary.active_tracked_ms || summary.total_duration_ms || 0],
    ["Diagnostic", summary.diagnostic_untracked_ms || 0],
    ["Idle", summary.idle_ms || 0],
    ["Unfocused", summary.unfocused_ms || 0],
    ["Restricted", summary.restricted_ms || 0],
    ["Suspicious", summary.suspicious_gap_ms || 0]
  ];

  return (
    <section className="dashboard-section diagnostics-section" aria-labelledby="diagnosticsHeading">
      <div className="section-heading-line">
        <h2 id="diagnosticsHeading">Diagnostics</h2>
        <button
          className="debug-link"
          type="button"
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("debug.html") })}
        >
          Debug <span className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
        </button>
      </div>
      <article className="dashboard-card diagnostic-card">
        {rows.map(([label, value]) => (
          <div className="diagnostic-stat" key={label}>
            <strong>{formatDuration(Number(value))}</strong>
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

function recommendationIcon(type = ""): string {
  if (type.includes("focus")) {
    return "bolt";
  }
  if (type.includes("classification") || type.includes("trend")) {
    return "triangle-exclamation";
  }
  return "clock";
}

function Recommendations({
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

function Today({ view, onAction }: { view: TodayView | null; onAction: (recommendation: Recommendation) => void }) {
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

      {import.meta.env.VITE_TIMEWISE_DEV_DEBUG === "true" ? <Diagnostics view={view} /> : null}
    </>
  );
}

function DashboardApp() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);

  async function reloadBootstrap(messageType = MESSAGE_TYPES.getBootstrap) {
    const next = await sendMessage<BootstrapResponse>({ type: messageType });
    setBootstrap(next);
  }

  async function handleRecommendationAction(recommendation: Recommendation) {
    if (recommendation.action?.type !== "start_focus_session") {
      return;
    }

    await sendMessage({
      type: MESSAGE_TYPES.startFocusSession,
      minutes: Number(recommendation.action.payload?.minutes || 45)
    });
    await reloadBootstrap();
  }

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      window.close();
    }
  }

  useEffect(() => {
    void reloadBootstrap();
  }, []);

  const cache = bootstrap?.dashboardCache;

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <button className="back-button" type="button" aria-label="Go back" onClick={goBack}>
          <span className="fa-solid fa-arrow-left" aria-hidden="true" />
        </button>
        <div>
          <h1>Today's Focus</h1>
          <p className="dashboard-date">{localDate()}</p>
          <p className="micro-copy">
            {cache?.lastError ? `Sync needs attention: ${cache.lastError}` : ""}
          </p>
        </div>
      </header>

      <section className="dashboard-content">
        <Today view={cache?.todayView ?? null} onAction={(item) => void handleRecommendationAction(item)} />
      </section>
    </main>
  );
}

const root = document.getElementById("dashboardRoot");
if (root) {
  createRoot(root).render(<DashboardApp />);
}
