import { useMemo } from "react";
import { createRoot } from "react-dom/client";
import { MESSAGE_TYPES } from "../../lib/constants.js";
import { sendBackgroundMessage } from "../../lib/messaging/client.js";
import { formatDuration, formatPercent } from "../../lib/utils.js";
import { CategoryRows } from "./components/category-rows.js";
import { usePopupBootstrap } from "./hooks/use-popup-bootstrap.js";
import { getAlignmentPercent, getFooterInsight, getProgressLabel } from "./lib/presentation.js";

function PopupLoadingShell({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  return (
    <main className="popup-shell is-loading" aria-label="Focus summary">
      <header className="popup-status">
        <button className="focus-mode-button is-idle" type="button" aria-label="Start focus mode" disabled>
          <span className="focus-mode-icon fa-solid fa-play" aria-hidden="true" />
          <span>Start</span>
        </button>
        <div className="popup-icon-actions">
          <button className="dashboard-button" type="button" aria-label="Open dashboard" onClick={onOpenDashboard}>
            <span className="dashboard-icon fa-solid fa-chart-column" aria-hidden="true" />
          </button>
        </div>
      </header>
      <section className="today-summary" aria-label="Tracked today">
        <div className="tracked-line">
          <strong>--</strong>
          <span>tracked today</span>
        </div>
        <div className="alignment-line">
          <div className="progress-track" aria-label="Loading focus alignment">
            <span style={{ width: "0%" }} />
          </div>
          <strong>0%</strong>
        </div>
      </section>
    </main>
  );
}

function PopupApp() {
  const { bootstrap, refreshBootstrap } = usePopupBootstrap();
  const model = bootstrap?.popupModel ?? null;
  const alignment = getAlignmentPercent(model);
  const focusSession = model?.focusSession || null;
  const isFocusActive = model?.state === "focus_active" && focusSession?.status === "active";
  const focusButtonLabel = isFocusActive ? "Stop" : "Start";
  const focusButtonIcon = isFocusActive ? "fa-stop" : "fa-play";

  const progressLabel = useMemo(() => getProgressLabel(model), [model]);

  async function toggleFocusMode() {
    const sessionId = focusSession?.id;
    if (sessionId) {
      await sendBackgroundMessage({ type: MESSAGE_TYPES.endFocusSession, sessionId });
    } else {
      await sendBackgroundMessage({ type: MESSAGE_TYPES.startFocusSession });
    }

    await refreshBootstrap();
  }

  function openDashboard() {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  }

  function openDebug() {
    chrome.tabs.create({ url: chrome.runtime.getURL("debug.html") });
  }

  if (!model) {
    return <PopupLoadingShell onOpenDashboard={openDashboard} />;
  }

  return (
    <main className="popup-shell" aria-label="Focus summary">
      <header className="popup-status">
        <button
          className={`focus-mode-button ${isFocusActive ? "is-active" : "is-idle"}`}
          type="button"
          aria-label={isFocusActive ? "Stop focus mode" : "Start focus mode"}
          onClick={() => void toggleFocusMode()}
        >
          <span className={`focus-mode-icon fa-solid ${focusButtonIcon}`} aria-hidden="true" />
          <span>{focusButtonLabel}</span>
        </button>
        <div className="popup-icon-actions">
          <button className="dashboard-button" type="button" aria-label="Open dashboard" onClick={openDashboard}>
            <span className="dashboard-icon fa-solid fa-chart-column" aria-hidden="true" />
          </button>
          {import.meta.env.VITE_TIMEWISE_DEV_DEBUG === "true" ? (
            <button className="dashboard-button" type="button" aria-label="Open debug" onClick={openDebug}>
              <span className="dashboard-icon fa-solid fa-bug" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </header>

      <section className="today-summary" aria-label="Tracked today">
        <div className="tracked-line">
          <strong>{formatDuration(model.trackedTimeMs)}</strong>
          <span>tracked today</span>
        </div>
        <div className="alignment-line">
          <div className="progress-track" aria-label={progressLabel}>
            <span style={{ width: `${alignment}%` }} />
          </div>
          <strong>{formatPercent(model.focusAlignment)}</strong>
        </div>
      </section>

      <section className="category-list" aria-label="Top categories">
        <CategoryRows categories={model.topCategories} sites={model.topSites} />
      </section>

      <footer className="popup-insight">
        <span className="trend-icon fa-solid fa-arrow-trend-up" aria-hidden="true" />
        <p>{getFooterInsight(model)}</p>
      </footer>
    </main>
  );
}

export function mountPopupApp(root: HTMLElement): void {
  createRoot(root).render(<PopupApp />);
}
