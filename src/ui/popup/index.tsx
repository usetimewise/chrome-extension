import { createRoot } from "react-dom/client";
import { formatDuration, formatPercent, humanizeCategory } from "../../lib/utils.js";
import { TopSitesList } from "../shared/components/top-sites-list.js";
import { usePopupBootstrap } from "./hooks/use-popup-bootstrap.js";
import { logRecentBrowserHistory } from "./lib/history.js";
import {
  categoryAccent,
  donutBackground,
  getComparisonText,
  getProgressLabel,
  getProductivityScoreValue,
  topCategoryShare
} from "./lib/presentation.js";

function PopupLoadingShell({ onOpenDashboard, onOpenDebug }: { onOpenDashboard: () => void; onOpenDebug: () => void }) {
  return (
    <main className="popup-shell is-loading" aria-label="Today overview">
      <header className="popup-header">
        <h1 className="popup-page-title">Today&apos;s Overview</h1>
        <div className="popup-header-actions">
          {import.meta.env.VITE_TIMEWISE_DEV_DEBUG === "true" ? (
            <>
              <button
                className="popup-icon-button"
                type="button"
                aria-label="Log browser history"
                title="Log browser history"
                onClick={() => void logRecentBrowserHistory()}
              >
                <span className="fa-solid fa-clock-rotate-left" aria-hidden="true" />
              </button>
              <button className="popup-icon-button" type="button" aria-label="Open debug" onClick={onOpenDebug}>
                <span className="fa-solid fa-bug" aria-hidden="true" />
              </button>
            </>
          ) : null}
          <button className="popup-icon-button" type="button" aria-label="Open dashboard" onClick={onOpenDashboard}>
            <span className="fa-solid fa-chart-column" aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="popup-overview-section popup-skeleton-card" aria-hidden="true">
        <div className="popup-overview-grid">
          <div className="popup-score-skeleton" />
          <div className="popup-summary-skeleton-grid">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
      <section className="popup-list-section" aria-hidden="true">
        <div className="popup-section-title-row">
          <h2 className="popup-section-title">Top Sites Today</h2>
        </div>
        <div className="popup-summary-skeleton-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}

function PopupApp() {
  const { bootstrap } = usePopupBootstrap();
  const model = bootstrap?.popupModel ?? null;
  const score = getProductivityScoreValue(model);
  const scoreLabel = model?.productivityScore?.label || "No score yet";
  const isDevDebugEnabled = import.meta.env.VITE_TIMEWISE_DEV_DEBUG === "true";

  function openDashboard() {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  }

  function openDebug() {
    chrome.tabs.create({ url: chrome.runtime.getURL("debug.html") });
  }

  async function handleLogBrowserHistory() {
    try {
      await logRecentBrowserHistory();
    } catch (error) {
      console.error("[TimeWise][dev] Failed to log browser history", error);
    }
  }

  if (!model) {
    return <PopupLoadingShell onOpenDashboard={openDashboard} onOpenDebug={openDebug} />;
  }

  const comparisonText = getComparisonText(model);
  const sitesVisitedCount = model.topSites.length;
  const topShare = topCategoryShare(model.topCategories);

  return (
    <main className="popup-shell" aria-label="Today overview">
      <header className="popup-header">
        <h1 className="popup-page-title">Today&apos;s Overview</h1>
        <div className="popup-header-actions">
          {isDevDebugEnabled ? (
            <>
              <button
                className="popup-icon-button"
                type="button"
                aria-label="Log browser history"
                title="Log browser history"
                onClick={() => void handleLogBrowserHistory()}
              >
                <span className="fa-solid fa-clock-rotate-left" aria-hidden="true" />
              </button>
              <button className="popup-icon-button" type="button" aria-label="Open debug" onClick={openDebug}>
                <span className="fa-solid fa-bug" aria-hidden="true" />
              </button>
            </>
          ) : null}
          <button className="popup-icon-button" type="button" aria-label="Open dashboard" onClick={openDashboard}>
            <span className="fa-solid fa-chart-column" aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="popup-overview-section">
        <div className="popup-overview-grid">
          <div className="popup-score-column">
            <div
              className="popup-score-ring"
              style={{ ["--score-value" as string]: `${score}` }}
              role="img"
              aria-label={getProgressLabel(model)}
            >
              <div className="popup-score-core">
                <strong>{score}</strong>
                <span>{scoreLabel}</span>
              </div>
            </div>
            <p className="popup-score-label">{comparisonText}</p>
          </div>

          <div className="popup-stats-column">
            <article className="popup-stat-card">
              <strong>{formatDuration(model.trackedTimeMs)}</strong>
              <span>Total</span>
            </article>
            <article className="popup-stat-card">
              <strong className="is-sites">{sitesVisitedCount}</strong>
              <span>Sites</span>
            </article>
            <article className="popup-stat-card">
              <strong className="is-productive">{formatDuration(model.focusedTimeMs)}</strong>
              <span>Productive</span>
            </article>
            <article className="popup-stat-card">
              <strong className="is-distracting">{formatDuration(model.distractedTimeMs)}</strong>
              <span>Distracting</span>
            </article>
          </div>
        </div>
      </section>

      <section className="popup-list-section" aria-labelledby="popup-top-sites-title">
        <div className="popup-section-title-row">
          <h2 className="popup-section-title" id="popup-top-sites-title">Top Sites Today</h2>
        </div>

        {model.topSites.length ? (
          <TopSitesList sites={model.topSites} />
        ) : (
          <div className="popup-empty-state">
            <span>No tracked sites yet.</span>
          </div>
        )}
      </section>

      <section className="popup-categories-section" aria-labelledby="popup-categories-title">
        <div className="popup-section-title-row">
          <h2 className="popup-section-title" id="popup-categories-title">Categories</h2>
        </div>

        {model.topCategories.length ? (
          <div className="popup-categories-layout">
            <div className="popup-donut-wrap">
              <div
                className="popup-category-donut"
                style={{ background: donutBackground(model.topCategories) }}
                aria-hidden="true"
              />
            </div>
            <div className="popup-category-list">
              {model.topCategories.map((category) => (
                <article className="popup-category-row" key={category.category}>
                  <div className="popup-category-meta">
                    <span
                      className="popup-category-dot"
                      style={{ backgroundColor: categoryAccent(category.category) }}
                      aria-hidden="true"
                    />
                    <span>{humanizeCategory(category.category)}</span>
                  </div>
                  <div className="popup-category-values">
                    <strong>{typeof category.share === "number" ? formatPercent(category.share) : `${topShare}%`}</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="popup-empty-state">
            <span>No category data yet.</span>
          </div>
        )}
      </section>
    </main>
  );
}

export function mountPopupApp(root: HTMLElement): void {
  createRoot(root).render(<PopupApp />);
}
