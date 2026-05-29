import { createRoot } from "react-dom/client";
import { IntervalTable } from "./components/interval-table.js";
import { JsonBlock } from "./components/json-block.js";
import { SummaryCards } from "./components/summary-cards.js";
import { TransitionTable } from "./components/transition-table.js";
import { useDebugState } from "./hooks/use-debug-state.js";

function DebugApp() {
  const {
    debugState,
    error,
    isExporting,
    isRetryingClassifications,
    pendingClassificationCount,
    loadDebugState,
    exportDebugState,
    retrySiteClassifications
  } = useDebugState();
  const events = debugState?.activityEvents || [];
  const transitions = debugState?.transitions || [];
  const siteClassifications = Object.entries(debugState?.siteClassifications?.byHost || {});

  return (
    <main className="debug-shell">
      <header className="debug-header">
        <div>
          <h1>Tracking Debug</h1>
          <p>{error || `${debugState?.pendingSyncCount ?? 0} pending sync events, ${events.length} intervals, ${transitions.length} transitions`}</p>
        </div>
        <div className="debug-actions">
          <button
            className="debug-button"
            type="button"
            onClick={() => void retrySiteClassifications()}
            disabled={isRetryingClassifications || pendingClassificationCount === 0}
          >
            <span className="fa-solid fa-arrows-rotate" aria-hidden="true" />
            {isRetryingClassifications ? "Retrying" : `Retry classifications (${pendingClassificationCount})`}
          </button>
          <button className="debug-button" type="button" onClick={() => void exportDebugState()} disabled={isExporting}>
            <span className="fa-solid fa-download" aria-hidden="true" />
            {isExporting ? "Exporting" : "Export JSON"}
          </button>
          <button className="debug-button" type="button" onClick={() => void loadDebugState()}>
            <span className="fa-solid fa-rotate" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      <SummaryCards debugState={debugState} events={events} />

      <section className="debug-panel" aria-labelledby="runtimeHeading">
        <h2 id="runtimeHeading">Runtime State</h2>
        <JsonBlock value={debugState?.runtimeState || {}} />
      </section>

      <section className="debug-panel" aria-labelledby="syncHeading">
        <h2 id="syncHeading">Sync State</h2>
        <JsonBlock value={{
          pendingSyncCount: debugState?.pendingSyncCount || 0,
          pendingSyncEvents: debugState?.pendingSyncEvents || [],
          lastSyncAt: debugState?.dashboardCache?.lastSyncAt || null,
          lastError: debugState?.lastError ?? debugState?.dashboardCache?.lastError ?? null
        }} />
      </section>

      <section className="debug-panel" aria-labelledby="siteClassificationsHeading">
        <h2 id="siteClassificationsHeading">Site Classifications</h2>
        <div className="debug-table">
          <div className="debug-row debug-head debug-site-row">
            <span>Host</span>
            <span>Status</span>
            <span>Category</span>
            <span>Attempts</span>
            <span>Next Retry</span>
            <span>Last Error</span>
            <span>Updated</span>
          </div>
          {siteClassifications.length ? siteClassifications.map(([host, record]) => (
            <div key={host} className="debug-row debug-site-row">
              <span>{host}</span>
              <span>{record.status}</span>
              <span>{record.category}</span>
              <span>{record.attempts}</span>
              <span>{record.nextRetryAt || "-"}</span>
              <span>{record.lastError || "-"}</span>
              <span>{record.updatedAt}</span>
            </div>
          )) : (
            <div className="debug-empty-state">No site classifications yet.</div>
          )}
        </div>
        <JsonBlock value={debugState?.siteClassifications || { byHost: {} }} />
      </section>

      <section className="debug-panel" aria-labelledby="intervalHeading">
        <h2 id="intervalHeading">Latest Diagnostic Intervals</h2>
        <IntervalTable events={events} />
      </section>

      <section className="debug-panel" aria-labelledby="transitionHeading">
        <h2 id="transitionHeading">Latest Transitions</h2>
        <TransitionTable transitions={transitions} />
      </section>
    </main>
  );
}

export function mountDebugApp(root: HTMLElement): void {
  createRoot(root).render(<DebugApp />);
}
