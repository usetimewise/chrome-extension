import { MESSAGE_TYPES } from "../lib/constants.js";
import { escapeHTML, formatDuration, formatPercent, humanizeCategory } from "../lib/utils.js";

let bootstrap = null;
let modalState = { open: false, host: "", category: "work", excluded: false };

async function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function signedPercent(value) {
  const numeric = Math.round((value || 0) * 100);
  if (numeric > 0) {
    return `+${numeric}%`;
  }
  return `${numeric}%`;
}

function renderCategorySnapshot(categories = []) {
  if (!categories.length) {
    return `<div class="empty-copy">No category signal yet.</div>`;
  }

  return categories.map((item) => `
    <div class="category-row">
      <div class="category-copy">
        <strong>${escapeHTML(humanizeCategory(item.category))}</strong>
        <span>${escapeHTML(formatDuration(item.duration_ms))}</span>
      </div>
      <div class="bar-track"><span style="width: ${Math.max(8, Math.round((item.share || 0) * 100))}%"></span></div>
    </div>
  `).join("");
}

function renderCurrentState(model) {
  if (model.state === "focus_active" && model.focusSession) {
    return `
      <section class="state-panel is-focus">
        <div class="state-header">
          <span class="status-pill is-positive">Focus mode</span>
          <span class="micro-copy">${escapeHTML(formatDuration(model.focusSession.remaining_ms))} left</span>
        </div>
        <h2>${escapeHTML(model.focusSession.intent || "Focused session")}</h2>
        <p class="lede">Stay with the current task. The popup is intentionally quieter while focus mode is active.</p>
        <div class="metric-grid">
          <article class="metric-card">
            <span>In session</span>
            <strong>${escapeHTML(formatDuration(model.focusSession.active_duration_ms || 0))}</strong>
          </article>
          <article class="metric-card">
            <span>Current site</span>
            <strong>${escapeHTML(model.currentSite?.host || "No active site")}</strong>
          </article>
        </div>
      </section>
    `;
  }

  if (model.state === "drifting") {
    return `
      <section class="state-panel is-drift">
        <div class="state-header">
          <span class="status-pill is-warning">Drifting</span>
          <span class="micro-copy">${escapeHTML(formatDuration(model.currentSite?.dwellMs || 0))} on current site</span>
        </div>
        <h2>${escapeHTML(model.currentSite?.host || "This site")} is pulling attention away.</h2>
        <p class="lede">${escapeHTML(model.statusMessage)}</p>
        <div class="context-box">
          <span>Category</span>
          <strong>${escapeHTML(humanizeCategory(model.currentSite?.category))}</strong>
        </div>
      </section>
    `;
  }

  if (model.state === "empty") {
    return `
      <section class="state-panel">
        <div class="state-header">
          <span class="status-pill">Welcome</span>
        </div>
        <h2>Your focus data will appear here soon.</h2>
        <p class="lede">Keep browsing normally. The extension will start building your focus picture today.</p>
      </section>
    `;
  }

  return `
    <section class="state-panel">
      <div class="state-header">
        <span class="status-pill">${escapeHTML(model.statusLabel)}</span>
        <span class="micro-copy">${escapeHTML(signedPercent(model.comparisonValue))} ${escapeHTML(model.comparisonLabel)}</span>
      </div>
      <h2>${escapeHTML(model.statusMessage)}</h2>
      <p class="lede">${escapeHTML(model.insight?.body || "One useful pattern will appear here.")}</p>
      <div class="metric-grid">
        <article class="metric-card">
          <span>Focused today</span>
          <strong>${escapeHTML(formatDuration(model.focusedTimeMs))}</strong>
        </article>
        <article class="metric-card">
          <span>Distracted today</span>
          <strong>${escapeHTML(formatDuration(model.distractedTimeMs))}</strong>
        </article>
      </div>
    </section>
  `;
}

function renderModal() {
  if (!modalState.open) {
    return "";
  }

  return `
    <div class="modal-backdrop">
      <form class="modal-card" id="reclassifyForm">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Reclassify site</p>
            <h3>${escapeHTML(modalState.host)}</h3>
          </div>
          <button class="icon-button" data-action="close-modal" type="button">Close</button>
        </div>

        <label class="field">
          <span>Category</span>
          <select name="category">
            <option value="work" ${modalState.category === "work" ? "selected" : ""}>Work</option>
            <option value="communication" ${modalState.category === "communication" ? "selected" : ""}>Communication</option>
            <option value="learning" ${modalState.category === "learning" ? "selected" : ""}>Learning</option>
            <option value="tools" ${modalState.category === "tools" ? "selected" : ""}>Tools</option>
            <option value="other" ${modalState.category === "other" ? "selected" : ""}>Neutral</option>
            <option value="social" ${modalState.category === "social" ? "selected" : ""}>Social</option>
            <option value="entertainment" ${modalState.category === "entertainment" ? "selected" : ""}>Entertainment</option>
            <option value="shopping" ${modalState.category === "shopping" ? "selected" : ""}>Shopping</option>
            <option value="news" ${modalState.category === "news" ? "selected" : ""}>News</option>
          </select>
        </label>

        <label class="toggle-row">
          <span>Exclude from tracking entirely</span>
          <input name="excluded" type="checkbox" ${modalState.excluded ? "checked" : ""} />
        </label>

        <div class="modal-actions">
          <button class="button quiet" data-action="close-modal" type="button">Cancel</button>
          <button class="button primary" type="submit">Save rule</button>
        </div>
      </form>
    </div>
  `;
}

function renderPopup() {
  const model = bootstrap?.popupModel;
  if (!model) {
    return;
  }

  const root = document.getElementById("popupRoot");
  root.innerHTML = `
    <main class="popup-shell">
      <header class="popup-topbar">
        <div>
          <p class="eyebrow">Focus snapshot</p>
          <h1>Today</h1>
        </div>
        <div class="header-actions">
          <button class="icon-button" data-action="refresh" type="button">Refresh</button>
          <button class="icon-button" data-action="settings" type="button">Settings</button>
        </div>
      </header>

      ${renderCurrentState(model)}

      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Category snapshot</p>
            <h3>Where the day is leaning</h3>
          </div>
          <span class="micro-copy">${escapeHTML(formatPercent(model.focusAlignment))} alignment</span>
        </div>
        ${renderCategorySnapshot(model.topCategories)}
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Key insight</p>
            <h3>${escapeHTML(model.insight?.title || "No insight yet")}</h3>
          </div>
        </div>
        <p class="panel-copy">${escapeHTML(model.insight?.body || "")}</p>
      </section>

      <footer class="popup-footer">
        <button class="button primary" data-message-type="${escapeHTML(model.primaryAction.type)}" type="button">${escapeHTML(model.primaryAction.label)}</button>
        ${model.secondaryActions.map((action) => `
          <button class="button quiet" data-action="${escapeHTML(action.type)}" type="button">${escapeHTML(action.label)}</button>
        `).join("")}
        ${model.canReclassify ? '<button class="link-button" data-action="open-reclassify" type="button">Reclassify current site</button>' : ""}
      </footer>
      ${renderModal()}
    </main>
  `;
}

async function refresh() {
  bootstrap = await sendMessage({ type: MESSAGE_TYPES.refreshViews });
  if (bootstrap.dashboardCache) {
    bootstrap = {
      ...bootstrap,
      popupModel: bootstrap.popupModel
    };
  } else {
    bootstrap = await sendMessage({ type: MESSAGE_TYPES.getBootstrap });
  }
  renderPopup();
}

async function saveRule(form) {
  const formData = new FormData(form);
  const category = String(formData.get("category") || "work");
  const excluded = formData.get("excluded") === "on";
  await sendMessage({
    type: MESSAGE_TYPES.saveSiteRule,
    host: modalState.host,
    category,
    excluded
  });
  modalState = { open: false, host: "", category: "work", excluded: false };
  bootstrap = await sendMessage({ type: MESSAGE_TYPES.getBootstrap });
  renderPopup();
}

document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]");
  const messageButton = event.target.closest("[data-message-type]");

  if (messageButton) {
    const messageType = messageButton.dataset.messageType;
    if (messageType === MESSAGE_TYPES.startFocusSession) {
      await sendMessage({ type: messageType, minutes: 45 });
    } else if (messageType === MESSAGE_TYPES.pauseFocusSession) {
      await sendMessage({ type: messageType, sessionId: bootstrap.dashboardCache?.focusSessionsView?.active_session?.id });
    }
    bootstrap = await sendMessage({ type: MESSAGE_TYPES.getBootstrap });
    renderPopup();
    return;
  }

  if (!action) {
    return;
  }

  switch (action.dataset.action) {
    case "refresh":
      await refresh();
      break;
    case "settings":
      chrome.runtime.openOptionsPage();
      break;
    case "OPEN_DASHBOARD":
      chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
      break;
    case "open-reclassify": {
      modalState = {
        open: true,
        host: bootstrap.popupModel?.currentSite?.host || "",
        category: bootstrap.popupModel?.currentSite?.category || "work",
        excluded: false
      };
      renderPopup();
      break;
    }
    case "close-modal":
      modalState = { open: false, host: "", category: "work", excluded: false };
      renderPopup();
      break;
    default:
      break;
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id !== "reclassifyForm") {
    return;
  }
  event.preventDefault();
  await saveRule(event.target);
});

async function loadBootstrap() {
  bootstrap = await sendMessage({ type: MESSAGE_TYPES.getBootstrap });
  renderPopup();
}

void loadBootstrap();
