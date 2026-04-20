import { MESSAGE_TYPES } from "../lib/constants.js";
import { formatDuration, formatPercent, humanizeCategory } from "../lib/utils.js";
import { renderCategories, renderRecommendations, renderSites, renderTimeseries } from "./render.js";

let currentRange = "today";

async function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function renderStatus(cache) {
  const status = document.getElementById("dashboardStatus");
  if (cache.lastError) {
    status.textContent = `Last backend error: ${cache.lastError}`;
    return;
  }

  if (cache.lastSyncAt) {
    status.textContent = `Last synced at ${new Date(cache.lastSyncAt).toLocaleString()}`;
    return;
  }

  status.textContent = "Waiting for first sync";
}

function renderDashboard(cache) {
  const summary = cache.summary || {};
  document.getElementById("dashboardTotal").textContent = formatDuration(summary.total_duration_ms || 0);
  document.getElementById("dashboardFocusScore").textContent = formatPercent(summary.focus_score || 0);
  document.getElementById("dashboardTopCategory").textContent = humanizeCategory(summary.top_categories?.[0]?.category || "other");

  renderTimeseries(document.getElementById("timeseriesChart"), cache.timeseries || []);
  renderCategories(document.getElementById("categoryBreakdown"), summary.top_categories || []);
  renderSites(document.getElementById("dashboardSites"), summary.top_sites || []);
  renderRecommendations(document.getElementById("dashboardRecommendations"), cache.recommendations || []);
  renderStatus(cache);
}

async function refresh(range = currentRange) {
  currentRange = range;
  const response = await sendMessage({ type: MESSAGE_TYPES.refreshDashboard, range });
  renderDashboard(response);
}

document.getElementById("dashboardRefreshBtn").addEventListener("click", () => {
  void refresh(currentRange);
});

document.getElementById("openSettingsFromDashboardBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("rangePicker").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-range]");
  if (!button) {
    return;
  }

  for (const item of document.querySelectorAll("#rangePicker button")) {
    item.classList.toggle("active", item === button);
  }

  void refresh(button.dataset.range);
});

void refresh();
