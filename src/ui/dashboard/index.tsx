import { useState } from "react";
import { createRoot } from "react-dom/client";
import type { DashboardOverviewRange } from "../../lib/types.js";
import { EmptyState } from "./components/empty-state.js";
import { OverviewDashboard } from "./components/overview-dashboard.js";
import { useDashboardBootstrap } from "./hooks/use-dashboard-bootstrap.js";

const RANGE_OPTIONS: Array<{ value: DashboardOverviewRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" }
];

function DashboardApp() {
  const { bootstrap } = useDashboardBootstrap();
  const [selectedRange, setSelectedRange] = useState<DashboardOverviewRange>("7d");

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      window.close();
    }
  }

  function openDebug() {
    chrome.tabs.create({ url: chrome.runtime.getURL("debug.html") });
  }

  const cache = bootstrap?.dashboardCache;
  const overview = cache?.overview ?? null;
  const activeOverview = overview?.[selectedRange] ?? null;

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div className="dashboard-header-main">
          <button className="back-button" type="button" aria-label="Go back" onClick={goBack}>
            <span className="fa-solid fa-arrow-left" aria-hidden="true" />
          </button>
          <div>
            <h1>Dashboard</h1>
            <p className="dashboard-date">{activeOverview?.summary.subtitle || "Loading analytics overview"}</p>
          </div>
        </div>
        {overview ? (
          <div className="range-switcher" role="tablist" aria-label="Dashboard range">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`range-chip${option.value === selectedRange ? " is-active" : ""}`}
                type="button"
                role="tab"
                aria-selected={option.value === selectedRange}
                onClick={() => setSelectedRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <section className="dashboard-content">
        {activeOverview ? (
          <OverviewDashboard overview={activeOverview} onOpenDebug={openDebug} />
        ) : overview ? (
          <EmptyState>No analytics available for this range yet.</EmptyState>
        ) : (
          <EmptyState>Dashboard analytics will appear after the first refresh.</EmptyState>
        )}
        {cache?.lastError ? <p className="dashboard-status">Sync needs attention: {cache.lastError}</p> : null}
      </section>
    </main>
  );
}

export function mountDashboardApp(root: HTMLElement): void {
  createRoot(root).render(<DashboardApp />);
}
