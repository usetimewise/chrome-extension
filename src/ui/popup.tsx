import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./common.css";
import "./popup.css";

import { MESSAGE_TYPES } from "../lib/constants.js";
import type { BootstrapResponse, PopupModel, TopCategory, TopSite } from "../lib/types.js";
import { formatDuration, formatPercent, humanizeCategory } from "../lib/utils.js";

let bootstrapInFlight = false;

async function sendMessage<TResponse = BootstrapResponse>(message: Record<string, unknown>): Promise<TResponse> {
  return chrome.runtime.sendMessage(message);
}

function sitesForCategory(category: string, sites: TopSite[] = []): TopSite[] {
  return sites
    .filter((site) => site.category === category && site.host)
    .slice(0, 2);
}

function footerInsight(model: PopupModel): string {
  if (model.state === "empty") {
    return "Focus data will appear soon.";
  }

  if (model.state === "drifting") {
    return "A gentle reset can bring the day back on track.";
  }

  return model.insight?.title || "Strong focus today. Keep the momentum.";
}

function CategoryRows({ categories, sites }: { categories: TopCategory[]; sites: TopSite[] }) {
  if (!categories.length) {
    return (
      <div className="category-empty">
        <span>No category signal yet.</span>
      </div>
    );
  }

  return categories.map((item) => {
    const categorySites = sitesForCategory(item.category, sites);

    return (
      <section className="category-row" key={item.category}>
        <div className="category-line">
          <h2>{humanizeCategory(item.category)}</h2>
          <strong>{formatDuration(item.duration_ms)}</strong>
        </div>
        {categorySites.length > 0 ? (
          <div className="site-chips">
            {categorySites.map((site) => (
              <span className="site-chip" key={site.host}>{site.host}</span>
            ))}
          </div>
        ) : null}
      </section>
    );
  });
}

function PopupApp() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);

  const model = bootstrap?.popupModel ?? null;
  const alignment = Math.max(0, Math.min(100, Math.round((model?.focusAlignment || 0) * 100)));
  const focusSession = model?.focusSession || null;
  const isFocusActive = model?.state === "focus_active" && focusSession?.status === "active";
  const focusButtonLabel = isFocusActive ? "Stop" : "Start";
  const focusButtonIcon = isFocusActive ? "fa-stop" : "fa-play";

  const progressLabel = useMemo(() => (
    model ? `${formatPercent(model.focusAlignment)} focus alignment` : "0% focus alignment"
  ), [model]);

  async function loadBootstrap(messageType = MESSAGE_TYPES.getBootstrap) {
    if (bootstrapInFlight) {
      return;
    }

    bootstrapInFlight = true;
    try {
      const next = await sendMessage<BootstrapResponse>({ type: messageType });
      setBootstrap(next);
    } finally {
      bootstrapInFlight = false;
    }
  }

  async function toggleFocusMode() {
    const sessionId = focusSession?.id;
    await sendMessage(
      sessionId
        ? { type: MESSAGE_TYPES.endFocusSession, sessionId }
        : { type: MESSAGE_TYPES.startFocusSession }
    );
    await loadBootstrap(MESSAGE_TYPES.refreshViews);
  }

  function openDashboard() {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  }

  function openDebug() {
    chrome.tabs.create({ url: chrome.runtime.getURL("debug.html") });
  }

  useEffect(() => {
    let refreshTimer: number | null = null;

    void loadBootstrap(MESSAGE_TYPES.refreshViews).catch(() => {
      void loadBootstrap(MESSAGE_TYPES.getBootstrap);
    });

    refreshTimer = window.setInterval(() => {
      void loadBootstrap(MESSAGE_TYPES.getBootstrap);
    }, 1000);

    return () => {
      if (refreshTimer !== null) {
        window.clearInterval(refreshTimer);
      }
    };
  }, []);

  if (!model) {
    return null;
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
        <p>{footerInsight(model)}</p>
      </footer>
    </main>
  );
}

const root = document.getElementById("popupRoot");
if (root) {
  createRoot(root).render(<PopupApp />);
}
