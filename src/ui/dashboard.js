import { MESSAGE_TYPES } from "../lib/constants.js";
import { formatDuration, formatPercent, humanizeCategory } from "../lib/utils.js";
import { renderCategories, renderRecommendations, renderSites, renderTimeseries } from "./render.js";

let currentRange = "today";

async function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function renderStatus(cache) {
  const status = document.getElementById("dashboardStatus");
  status.classList.remove("is-error");

  if (cache.lastError) {
    status.textContent = `Sync needs attention: ${cache.lastError}`;
    status.classList.add("is-error");
    return;
  }

  if (cache.lastSyncAt) {
    status.textContent = `Updated ${new Date(cache.lastSyncAt).toLocaleString()}`;
    return;
  }

  status.textContent = "Waiting for the first synced range.";
}

function rangeLabel(range) {
  switch (range) {
    case "week":
      return "this week";
    case "month":
      return "this month";
    default:
      return "today";
  }
}

function buildDashboardInsight(summary = {}, range = currentRange) {
  const totalDuration = summary.total_duration_ms || 0;
  const focusShare = summary.focus_score || 0;
  const topCategory = summary.top_categories?.[0];
  const topSite = summary.top_sites?.[0];
  const currentRangeLabel = rangeLabel(range);

  if (!totalDuration) {
    return {
      title: `No tracked time for ${currentRangeLabel} yet.`,
      body: "Once activity is synced, this space will surface the clearest signal in the range."
    };
  }

  if (focusShare >= 0.65) {
    return {
      title: `Most of ${currentRangeLabel} stayed in focused territory.`,
      body: topSite
        ? `${formatPercent(focusShare)} of tracked time sat in work, learning, or tools, with ${topSite.host} holding the longest share.`
        : `${formatPercent(focusShare)} of tracked time sat in work, learning, or tools.`
    };
  }

  if (focusShare >= 0.4) {
    return {
      title: `${currentRangeLabel[0].toUpperCase()}${currentRangeLabel.slice(1)} feels more mixed than fixed.`,
      body: topCategory
        ? `${humanizeCategory(topCategory.category)} is the strongest context in the range, which makes this a good moment to read the pattern rather than judge it.`
        : "The range is balanced enough to invite reflection instead of urgency."
    };
  }

  return {
    title: `Focused work was a lighter share ${range === "today" ? "today" : `during ${currentRangeLabel}`}.`,
    body: topCategory
      ? `${humanizeCategory(topCategory.category)} leads the range right now. That is a signal to notice, not a score to chase.`
      : "The current range is better read as a pattern than a performance metric."
  };
}

function renderDashboard(cache) {
  const summary = cache.summary || {};
  const insight = buildDashboardInsight(summary, currentRange);
  document.getElementById("dashboardTotal").textContent = formatDuration(summary.total_duration_ms || 0);
  document.getElementById("dashboardFocusScore").textContent = formatPercent(summary.focus_score || 0);
  document.getElementById("dashboardTopCategory").textContent = summary.top_categories?.length
    ? humanizeCategory(summary.top_categories[0].category)
    : "No clear context yet";
  document.getElementById("dashboardInsightTitle").textContent = insight.title;
  document.getElementById("dashboardInsightBody").textContent = insight.body;

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
