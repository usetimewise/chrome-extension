import {
  DISTRACTION_CATEGORIES,
  FOCUS_CATEGORIES,
  MESSAGE_TYPES
} from "../lib/constants.js";
import {
  escapeHTML,
  formatDuration,
  humanizeCategory
} from "../lib/utils.js";

let bootstrap = null;

async function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function localDate() {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round((value || 0) * 100)));
}

function percentLabel(value) {
  return `${clampPercent(value)}%`;
}

function categoryTone(category) {
  if (DISTRACTION_CATEGORIES.has(category)) {
    return "danger";
  }
  if (FOCUS_CATEGORIES.has(category)) {
    return "focus";
  }
  if (category === "communication") {
    return "communication";
  }
  return "neutral";
}

function sortedByDuration(items = []) {
  return [...items].sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0));
}

function distractingSites(view) {
  return sortedByDuration(view?.top_sites || [])
    .filter((item) => DISTRACTION_CATEGORIES.has(item.category))
    .slice(0, 3);
}

function distractingCategories(view) {
  return sortedByDuration(view?.top_categories || [])
    .filter((item) => DISTRACTION_CATEGORIES.has(item.category))
    .slice(0, 2);
}

function renderEmpty(message) {
  return `<div class="dashboard-empty">${escapeHTML(message)}</div>`;
}

function renderHeaderStatus() {
  const status = document.getElementById("dashboardStatus");
  if (!status) {
    return;
  }

  status.textContent = bootstrap?.dashboardCache?.lastError
    ? `Sync needs attention: ${bootstrap.dashboardCache.lastError}`
    : "";
}

function renderCategoryRows(view) {
  const categories = sortedByDuration(view?.top_categories || []);
  const totalMs = view?.summary?.total_duration_ms || 0;

  if (!categories.length) {
    return renderEmpty("No category signal yet.");
  }

  return categories.map((item) => {
    const share = item.share || (totalMs ? item.duration_ms / totalMs : 0);
    const width = clampPercent(share);
    const tone = categoryTone(item.category);

    return `
      <div class="time-row">
        <div class="time-row-head">
          <strong>${escapeHTML(humanizeCategory(item.category))}</strong>
          <span>${escapeHTML(formatDuration(item.duration_ms))}</span>
        </div>
        <div class="time-row-body">
          <div class="dashboard-bar" aria-hidden="true">
            <span class="bar-fill is-${escapeHTML(tone)}" style="width: ${width}%"></span>
          </div>
          <span>${escapeHTML(percentLabel(share))}</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderFocusBreaks(view) {
  const sites = distractingSites(view);
  const categories = distractingCategories(view);
  const totalDistractedMs = view?.summary?.distraction_duration_ms || 0;
  const topTrigger = sites[0]?.host || (categories[0] ? humanizeCategory(categories[0].category) : "");

  if (!sites.length && !categories.length) {
    return `
      <article class="dashboard-card focus-break-card">
        <p class="break-count"><strong>0</strong> focus breaks today</p>
        <p class="break-trigger">No distracting sites have enough tracked time yet.</p>
      </article>
    `;
  }

  const rows = sites.length
    ? sites.map((site) => `
      <div class="break-row">
        <span>${escapeHTML(humanizeCategory(site.category))}</span>
        <strong>${escapeHTML(site.host)}</strong>
        <span>${escapeHTML(formatDuration(site.duration_ms))}</span>
      </div>
    `).join("")
    : categories.map((item) => `
      <div class="break-row">
        <span>Category</span>
        <strong>${escapeHTML(humanizeCategory(item.category))}</strong>
        <span>${escapeHTML(formatDuration(item.duration_ms))}</span>
      </div>
    `).join("");

  return `
    <article class="dashboard-card focus-break-card">
      <p class="break-count"><strong>${escapeHTML(String(sites.length || categories.length))}</strong> focus breaks today</p>
      <p class="break-trigger">Most common trigger: ${escapeHTML(topTrigger)}</p>
      <div class="break-list">
        ${rows}
      </div>
      ${totalDistractedMs ? `<p class="break-note">${escapeHTML(formatDuration(totalDistractedMs))} total distracted time tracked today.</p>` : ""}
    </article>
  `;
}

function recommendationIcon(type = "") {
  if (type.includes("focus")) {
    return "bolt";
  }
  if (type.includes("classification") || type.includes("trend")) {
    return "warning";
  }
  return "clock";
}

function renderRecommendations(view) {
  const recommendations = (view?.recommendations || []).slice(0, 3);

  if (!recommendations.length) {
    return renderEmpty("Recommendations will appear when there is enough signal.");
  }

  return recommendations.map((item) => {
    const icon = recommendationIcon(item.type || item.id || "");
    const actionLabel = item.action?.label || "Review";

    return `
      <article class="recommendation-card">
        <span class="recommendation-icon is-${escapeHTML(icon)}" aria-hidden="true"></span>
        <div>
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.body)}</p>
          <button
            class="recommendation-action"
            data-recommendation-action="${escapeHTML(item.action?.type || "")}"
            data-recommendation-minutes="${escapeHTML(String(item.action?.payload?.minutes || 45))}"
            type="button"
          >${escapeHTML(actionLabel)} <span aria-hidden="true">&rarr;</span></button>
        </div>
      </article>
    `;
  }).join("");
}

function renderToday(view) {
  if (!view) {
    return renderEmpty("Today view will appear after the first sync.");
  }

  return `
    <section class="dashboard-section" aria-labelledby="timeHeading">
      <h2 id="timeHeading">Where did the time go?</h2>
      <article class="dashboard-card time-card">
        <div class="metric-strip">
          <div>
            <strong>${escapeHTML(formatDuration(view.summary?.total_duration_ms || 0))}</strong>
            <span>Total tracked</span>
          </div>
          <div>
            <strong class="is-focus">${escapeHTML(formatDuration(view.summary?.focus_duration_ms || 0))}</strong>
            <span>Deep focus</span>
          </div>
          <div>
            <strong class="is-danger">${escapeHTML(formatDuration(view.summary?.distraction_duration_ms || 0))}</strong>
            <span>Distracted</span>
          </div>
        </div>
        <div class="time-list">
          ${renderCategoryRows(view)}
        </div>
      </article>
    </section>

    <section class="dashboard-section" aria-labelledby="breaksHeading">
      <h2 id="breaksHeading">What broke my focus?</h2>
      ${renderFocusBreaks(view)}
    </section>

    <section class="dashboard-section" aria-labelledby="nextHeading">
      <h2 id="nextHeading">What should I do next?</h2>
      <div class="recommendation-list">
        ${renderRecommendations(view)}
      </div>
    </section>
  `;
}

function renderDashboard() {
  document.getElementById("dashboardDate").textContent = localDate();
  renderHeaderStatus();
  document.getElementById("dashboardContent").innerHTML = renderToday(bootstrap?.dashboardCache?.todayView);
}

async function reloadBootstrap(messageType = MESSAGE_TYPES.getBootstrap) {
  bootstrap = await sendMessage({ type: messageType });
  renderDashboard();
}

document.addEventListener("click", async (event) => {
  const backButton = event.target.closest("[data-dashboard-back]");
  if (backButton) {
    if (history.length > 1) {
      history.back();
    } else {
      window.close();
    }
    return;
  }

  const action = event.target.closest("[data-recommendation-action]");
  if (!action) {
    return;
  }

  if (action.dataset.recommendationAction === "start_focus_session") {
    await sendMessage({
      type: MESSAGE_TYPES.startFocusSession,
      minutes: Number(action.dataset.recommendationMinutes || 45)
    });
    await reloadBootstrap();
  }
});

async function init() {
  await reloadBootstrap();
}

void init();
