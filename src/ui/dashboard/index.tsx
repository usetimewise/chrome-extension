import { createRoot } from "react-dom/client";
import { TodayView } from "./components/today-view.js";
import { useDashboardBootstrap } from "./hooks/use-dashboard-bootstrap.js";
import { localDate } from "./lib/presentation.js";

function DashboardApp() {
  const { bootstrap, handleRecommendationAction } = useDashboardBootstrap();

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
        <TodayView
          view={cache?.todayView ?? null}
          onAction={(item) => void handleRecommendationAction(item)}
          onOpenDebug={openDebug}
        />
      </section>
    </main>
  );
}

export function mountDashboardApp(root: HTMLElement): void {
  createRoot(root).render(<DashboardApp />);
}
