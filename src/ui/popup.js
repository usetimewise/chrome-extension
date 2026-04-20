import { MESSAGE_TYPES } from "../lib/constants.js";
import { formatDuration } from "../lib/utils.js";
import { renderRecommendations, renderSites } from "./render.js";

async function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function setStatus(bootstrap) {
  const status = document.getElementById("statusText");
  const dashboardCache = bootstrap.dashboardCache;

  if (dashboardCache.lastError) {
    status.textContent = `Backend error: ${dashboardCache.lastError}`;
    return;
  }

  if (dashboardCache.lastSyncAt) {
    status.textContent = `Last synced at ${new Date(dashboardCache.lastSyncAt).toLocaleTimeString()}`;
    return;
  }

  status.textContent = bootstrap.device.deviceId ? "Connected, waiting for first sync" : "Device registration pending";
}

function renderBootstrap(bootstrap) {
  const summary = bootstrap.dashboardCache.summary;
  document.getElementById("totalTime").textContent = formatDuration(summary?.total_duration_ms || 0);
  document.getElementById("focusTime").textContent = formatDuration(summary?.focus_duration_ms || 0);

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
