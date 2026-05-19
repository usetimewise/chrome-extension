import { useEffect, useState } from "react";
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
      <header className="popup-topbar">
        <div className="popup-state-badge">
          <span className="popup-state-dot is-idle" aria-hidden="true" />
          <span>Loading</span>
        </div>
        <div className="popup-topbar-actions">
          <button className="popup-icon-button" type="button" aria-label="Open dashboard" onClick={onOpenDashboard}>
            <span className="fa-solid fa-chart-column" aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="popup-summary-card" aria-label="Tracked today">
        <button className="popup-focus-button is-idle" type="button" aria-label="Start focus mode" disabled>
          <span className="popup-focus-icon fa-solid fa-play" aria-hidden="true" />
          <span>Start</span>
        </button>
        <div className="popup-summary-copy">
          <div className="popup-summary-line">
            <strong>--</strong>
            <span>tracked today</span>
          </div>
          <div className="popup-progress-row">
            <div className="popup-progress-track" aria-label="Loading focus alignment">
              <span style={{ width: "0%" }} />
            </div>
            <strong>0%</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

function stateTone(state: "empty" | "default" | "focus_active" | "drifting"): "active" | "warn" | "idle" {
  if (state === "focus_active") {
    return "active";
  }
  if (state === "drifting") {
    return "warn";
  }
  return "idle";
}

function PopupApp() {
  const { bootstrap, refreshBootstrap } = usePopupBootstrap();
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);
  const model = bootstrap?.popupModel ?? null;
  const alignment = getAlignmentPercent(model);
  const focusSession = model?.focusSession || null;
  const isFocusActive = model?.state === "focus_active" && focusSession?.status === "active";
  const focusButtonLabel = isFocusActive ? "Stop" : "Start";
  const focusButtonIcon = isFocusActive ? "fa-stop" : "fa-play";
  const tone = stateTone(model?.state ?? "empty");
  const progressLabel = getProgressLabel(model);
  const shouldShowDriftNotice = Boolean(model?.state === "drifting" && model.currentSite && !isNoticeDismissed);

  useEffect(() => {
    setIsNoticeDismissed(false);
  }, [model?.state, model?.currentSite?.host]);

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
      <header className="popup-topbar">
        <div className="popup-state-badge">
          <span className={`popup-state-dot is-${tone}`} aria-hidden="true" />
          <span>{model.statusLabel}</span>
        </div>
        <div className="popup-topbar-actions">
          <button className="popup-icon-button" type="button" aria-label="Open dashboard" onClick={openDashboard}>
            <span className="fa-solid fa-chart-column" aria-hidden="true" />
          </button>
          {import.meta.env.VITE_TIMEWISE_DEV_DEBUG === "true" ? (
            <button className="popup-icon-button" type="button" aria-label="Open debug" onClick={openDebug}>
              <span className="fa-solid fa-bug" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </header>

      <section className="popup-summary-card" aria-label="Tracked today">
        <button
          className={`popup-focus-button ${isFocusActive ? "is-active" : "is-idle"}`}
          type="button"
          aria-label={isFocusActive ? "Stop focus mode" : "Start focus mode"}
          onClick={() => void toggleFocusMode()}
        >
          <span className={`popup-focus-icon fa-solid ${focusButtonIcon}`} aria-hidden="true" />
          <span>{focusButtonLabel}</span>
        </button>
        <div className="popup-summary-copy">
          <div className="popup-summary-line">
            <strong>{formatDuration(model.trackedTimeMs)}</strong>
            <span>tracked today</span>
          </div>
          <div className="popup-progress-row">
            <div className="popup-progress-track" aria-label={progressLabel}>
              <span style={{ width: `${alignment}%` }} />
            </div>
            <strong>{formatPercent(model.focusAlignment)}</strong>
          </div>
        </div>
      </section>

      {shouldShowDriftNotice ? (
        <section className="popup-notice" aria-label="Focus reminder">
          <div className="popup-notice-icon">
            <span className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          </div>
          <div className="popup-notice-copy">
            <p className="popup-notice-title">
              You&apos;ve spent {formatDuration(model.currentSite?.dwellMs)} on {model.currentSite?.host}
            </p>
            <p className="popup-notice-body">{model.statusMessage}</p>
          </div>
          <button
            className="popup-notice-dismiss"
            type="button"
            aria-label="Dismiss reminder"
            onClick={() => setIsNoticeDismissed(true)}
          >
            <span className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </section>
      ) : null}

      <section className="popup-categories-panel" aria-label="Top categories">
        <div className="popup-panel-heading">
          <h2>Today&apos;s focus</h2>
          <p>Grouped from your strongest tracked categories.</p>
        </div>
        <div className="category-list">
          <CategoryRows categories={model.topCategories} sites={model.topSites} />
        </div>
      </section>

      <footer className="popup-insight-card">
        <div className="popup-insight-icon">
          <span className="fa-solid fa-arrow-trend-up" aria-hidden="true" />
        </div>
        <div className="popup-insight-copy">
          <strong>{model.insight.title}</strong>
          <p>{getFooterInsight(model)}</p>
        </div>
      </footer>

      {focusSession ? (
        <section className="popup-session-meta" aria-label="Focus session status">
          <span className="popup-session-pill">Focus session</span>
          <span>
            {formatDuration(focusSession.active_duration_ms)}
            {typeof focusSession.remaining_ms === "number" ? ` tracked • ${formatDuration(focusSession.remaining_ms)} left` : " tracked"}
          </span>
        </section>
      ) : null}
    </main>
  );
}

export function mountPopupApp(root: HTMLElement): void {
  createRoot(root).render(<PopupApp />);
}
