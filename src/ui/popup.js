import { MESSAGE_TYPES } from "../lib/constants.js";
import { escapeHTML, formatDuration, formatPercent, humanizeCategory } from "../lib/utils.js";

let bootstrap = null;
let refreshTimer = null;
let bootstrapInFlight = false;

async function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function sitesForCategory(category, sites = []) {
  return sites
    .filter((site) => site.category === category && site.host)
    .slice(0, 2);
}

function renderCategoryRows(categories = [], sites = []) {
  if (!categories.length) {
    return `
      <div class="category-empty">
        <span>No category signal yet.</span>
      </div>
    `;
  }

  return categories.map((item) => {
    const categorySites = sitesForCategory(item.category, sites);
    const chips = categorySites.map((site) => `
      <span class="site-chip">${escapeHTML(site.host)}</span>
    `).join("");

    return `
      <section class="category-row">
        <div class="category-line">
          <h2>${escapeHTML(humanizeCategory(item.category))}</h2>
          <strong>${escapeHTML(formatDuration(item.duration_ms))}</strong>
        </div>
        ${chips ? `<div class="site-chips">${chips}</div>` : ""}
      </section>
    `;
  }).join("");
}

function renderFooterInsight(model) {
  if (model.state === "empty") {
    return "Focus data will appear soon.";
  }

  if (model.state === "drifting") {
    return "A gentle reset can bring the day back on track.";
  }

  return model.insight?.title || "Strong focus today. Keep the momentum.";
}

function renderPopup() {
  const model = bootstrap?.popupModel;
  if (!model) {
    return;
  }

  const root = document.getElementById("popupRoot");
  const alignment = Math.max(0, Math.min(100, Math.round((model.focusAlignment || 0) * 100)));
  const progressWidth = Math.max(0, Math.min(100, alignment));

  root.innerHTML = `
    <main class="popup-shell" aria-label="Focus summary">
      <header class="popup-status">
        <div class="status-copy">
          <span class="status-dot" aria-hidden="true"></span>
          <span>Focused</span>
        </div>
        <button class="dashboard-button" data-action="open-dashboard" type="button" aria-label="Open dashboard">
          <span class="dashboard-icon" aria-hidden="true"></span>
        </button>
      </header>

      <section class="today-summary" aria-label="Tracked today">
        <div class="tracked-line">
          <strong>${escapeHTML(formatDuration(model.trackedTimeMs))}</strong>
          <span>tracked today</span>
        </div>
        <div class="alignment-line">
          <div class="progress-track" aria-label="${escapeHTML(formatPercent(model.focusAlignment))} focus alignment">
            <span style="width: ${progressWidth}%"></span>
          </div>
          <strong>${escapeHTML(formatPercent(model.focusAlignment))}</strong>
        </div>
      </section>

      <section class="category-list" aria-label="Top categories">
        ${renderCategoryRows(model.topCategories, model.topSites)}
      </section>

      <footer class="popup-insight">
        <span class="trend-icon" aria-hidden="true"></span>
        <p>${escapeHTML(renderFooterInsight(model))}</p>
      </footer>
    </main>
  `;
}

async function loadBootstrap(messageType = MESSAGE_TYPES.getBootstrap) {
  if (bootstrapInFlight) {
    return;
  }

  bootstrapInFlight = true;
  try {
    bootstrap = await sendMessage({ type: messageType });
    renderPopup();
  } finally {
    bootstrapInFlight = false;
  }
}

function openDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
}

document.addEventListener("click", (event) => {
  if (event.target.closest('[data-action="open-dashboard"]')) {
    openDashboard();
  }
});

window.addEventListener("pagehide", () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});

async function init() {
  await loadBootstrap(MESSAGE_TYPES.refreshViews);
  refreshTimer = window.setInterval(() => {
    void loadBootstrap(MESSAGE_TYPES.getBootstrap);
  }, 1000);
}

async function loadInitialBootstrap() {
  bootstrap = await sendMessage({ type: MESSAGE_TYPES.getBootstrap });
  renderPopup();
}

void init().catch(() => {
  void loadInitialBootstrap();
});
