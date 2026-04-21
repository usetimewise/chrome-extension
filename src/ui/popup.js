import { MESSAGE_TYPES } from "../lib/constants.js";
import { formatDuration, formatPercent, humanizeCategory } from "../lib/utils.js";
import { renderRecommendations, renderSites } from "./render.js";

async function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function setStatus(bootstrap) {
  const status = document.getElementById("statusText");
  const dashboardCache = bootstrap.dashboardCache;
  status.classList.remove("is-error");

  if (dashboardCache.lastError) {
    status.textContent = `Sync needs attention: ${dashboardCache.lastError}`;
    status.classList.add("is-error");
    return;
  }

  if (dashboardCache.lastSyncAt) {
    status.textContent = `Updated at ${new Date(dashboardCache.lastSyncAt).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })}`;
    return;
  }

  status.textContent = bootstrap.device.deviceId
    ? "Connected. Your first reflection appears after sync."
    : "Preparing a private connection...";
}

function buildPopupInsight(summary = {}) {
  const totalDuration = summary.total_duration_ms || 0;
  const focusDuration = summary.focus_duration_ms || 0;
  const topSite = summary.top_sites?.[0];
  const topCategory = summary.top_categories?.[0];
  const focusShare = totalDuration > 0 ? focusDuration / totalDuration : 0;

  if (!totalDuration) {
    return {
      title: "A calm view of the day.",
      body: "Your latest reflection will appear after the first sync."
    };
  }

  if (focusShare >= 0.6) {
    return {
      title: `${formatPercent(focusShare)} of today stayed with focused work.`,
      body: topSite
        ? `${topSite.host} held the longest share of attention so far.`
        : "The day is leaning toward work, learning, and tools."
    };
  }

  if (focusShare >= 0.35) {
    return {
      title: "Today feels mixed rather than scattered.",
      body: topCategory
        ? `${humanizeCategory(topCategory.category)} is the strongest current in the day so far.`
        : "The pattern is balanced enough to read without rushing to conclusions."
    };
  }

  return {
    title: "Focused work has been a smaller share of the day.",
    body: topCategory
      ? `${humanizeCategory(topCategory.category)} is currently the clearest context.`
      : "That is simply a pattern to notice, not a verdict."
  };
}

function renderBootstrap(bootstrap) {
  const summary = bootstrap.dashboardCache.summary;
  const insight = buildPopupInsight(summary || {});
  document.getElementById("totalTime").textContent = formatDuration(summary?.total_duration_ms || 0);
  document.getElementById("focusTime").textContent = formatDuration(summary?.focus_duration_ms || 0);
  document.getElementById("popupInsightTitle").textContent = insight.title;
  document.getElementById("popupInsightBody").textContent = insight.body;

  renderSites(document.getElementById("sitesList"), summary?.top_sites || []);
  renderRecommendations(document.getElementById("recommendations"), bootstrap.dashboardCache.recommendations || []);
  setStatus(bootstrap);
}

async function loadBootstrap() {
  const bootstrap = await sendMessage({ type: MESSAGE_TYPES.getBootstrap });
  renderBootstrap(bootstrap);
}

document.getElementById("refreshBtn").addEventListener("click", async () => {
  await sendMessage({ type: MESSAGE_TYPES.refreshDashboard, range: "today" });
  await loadBootstrap();
});

document.getElementById("openDashboardBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});

document.getElementById("openSettingsBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

void loadBootstrap();
