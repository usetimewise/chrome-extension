import { IDLE_DETECTION_OPTIONS, MESSAGE_TYPES } from "../lib/constants.js";
import { getSettings, saveSettings } from "../lib/state.js";
import {
  blocksToText,
  escapeHTML,
  formatClock,
  formatDuration,
  formatPercent,
  humanizeCategory,
  overridesToText,
  parseWorkdaysFromForm,
  textToBlocks,
  textToLines,
  textToOverrides,
  workdaysToText
} from "../lib/utils.js";

let bootstrap = null;
let activeTab = "today";
let modalState = { open: false, host: "", category: "work", excluded: false };

async function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function renderTopNav() {
  const items = [
    ["today", "Today"],
    ["trends", "Trends"],
    ["sites", "Sites & Categories"],
    ["insights", "Insights"],
    ["sessions", "Focus Sessions"],
    ["settings", "Settings"]
  ];

  return items.map(([key, label]) => `
    <button class="tab-pill ${activeTab === key ? "is-active" : ""}" data-tab="${key}" type="button">${label}</button>
  `).join("");
}

function renderToday(view) {
  if (!view) {
    return `<div class="empty-page">Today view will appear after the first sync.</div>`;
  }

  return `
    <section class="hero-band">
      <article class="hero-card">
        <p class="eyebrow">Your focus today</p>
        <h2>${escapeHTML(view.status.label)}</h2>
        <p class="hero-copy">${escapeHTML(view.status.message)}</p>
        <div class="hero-metrics">
          <div><span>Focused time</span><strong>${escapeHTML(formatDuration(view.summary.focus_duration_ms))}</strong></div>
          <div><span>Distracted time</span><strong>${escapeHTML(formatDuration(view.summary.distraction_duration_ms))}</strong></div>
          <div><span>Focus alignment</span><strong>${escapeHTML(formatPercent(view.summary.focus_alignment))}</strong></div>
        </div>
      </article>
      <article class="side-card">
        <p class="eyebrow">Main insight</p>
        <h3>${escapeHTML(view.main_insight.title)}</h3>
        <p>${escapeHTML(view.main_insight.body)}</p>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-head"><div><p class="eyebrow">Timeline</p><h3>How the day unfolded</h3></div></div>
        <div class="chart-list">
          ${(view.timeline || []).map((point) => `
            <div class="timeline-row">
              <div class="timeline-copy">
                <strong>${escapeHTML(point.label)}</strong>
                <span>${escapeHTML(formatDuration(point.total_duration_ms))}</span>
              </div>
              <div class="timeline-track">
                <span class="timeline-total" style="width:${Math.max(8, Math.round((point.total_duration_ms / Math.max(view.summary.total_duration_ms || 1, 1)) * 100))}%"></span>
                <span class="timeline-focus" style="width:${Math.max(0, Math.round((point.focus_duration_ms / Math.max(view.summary.total_duration_ms || 1, 1)) * 100))}%"></span>
              </div>
            </div>
          `).join("")}
        </div>
      </article>

      <article class="panel">
        <div class="panel-head"><div><p class="eyebrow">Top sites</p><h3>Where attention went</h3></div></div>
        <div class="stack-list">
          ${(view.top_sites || []).map((item) => `
            <div class="list-row">
              <div><strong>${escapeHTML(item.host)}</strong><span>${escapeHTML(humanizeCategory(item.category))}</span></div>
              <strong>${escapeHTML(formatDuration(item.duration_ms))}</strong>
            </div>
          `).join("")}
        </div>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-head"><div><p class="eyebrow">Recommendations</p><h3>What to do next</h3></div></div>
        <div class="card-list">
          ${(view.recommendations || []).map((item) => `
            <article class="insight-card">
              <div class="card-kicker">${escapeHTML(item.priority)}</div>
              <h4>${escapeHTML(item.title)}</h4>
              <p>${escapeHTML(item.body)}</p>
            </article>
          `).join("")}
        </div>
      </article>

      <article class="panel">
        <div class="panel-head"><div><p class="eyebrow">Signals</p><h3>Supporting insights</h3></div></div>
        <div class="card-list">
          ${(view.supporting_insights || []).map((item) => `
            <article class="insight-card">
              <h4>${escapeHTML(item.title)}</h4>
              <p>${escapeHTML(item.body)}</p>
            </article>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderTrends(view) {
  if (!view) {
    return `<div class="empty-page">Weekly trends will appear after the first sync.</div>`;
  }
  return `
    <section class="summary-strip">
      ${Object.entries(view.summary_cards || {}).map(([key, value]) => `
        <article class="summary-card">
          <span>${escapeHTML(key.replaceAll("_", " "))}</span>
          <strong>${escapeHTML(value)}</strong>
        </article>
      `).join("")}
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-head"><div><p class="eyebrow">Trend chart</p><h3>Focused vs distracted time</h3></div></div>
        <div class="trend-bars">
          ${(view.days || []).map((day) => `
            <div class="trend-day">
              <span>${escapeHTML(day.date)}</span>
              <div class="trend-columns">
                <span class="trend-focus" style="height:${Math.max(10, Math.round((day.focused_time_ms / 3600000) * 24))}px"></span>
                <span class="trend-drift" style="height:${Math.max(10, Math.round((day.distracted_time_ms / 3600000) * 24))}px"></span>
              </div>
              <strong>${escapeHTML(formatPercent(day.focus_alignment))}</strong>
            </div>
          `).join("")}
        </div>
      </article>
      <article class="panel">
        <div class="panel-head"><div><p class="eyebrow">Patterns</p><h3>Recurring signals</h3></div></div>
        <div class="stack-list">
          ${(view.patterns || []).map((item) => `
            <div class="list-row">
              <div><strong>${escapeHTML(item.label)}</strong></div>
              <strong>${escapeHTML(item.value)}</strong>
            </div>
          `).join("")}
        </div>
        <p class="panel-copy">${escapeHTML(view.coach_summary || "")}</p>
      </article>
    </section>
  `;
}

function renderSites(view) {
  if (!view) {
    return `<div class="empty-page">Sites & categories will appear after the first sync.</div>`;
  }
  return `
    <section class="content-grid">
      <article class="panel wide-panel">
        <div class="panel-head">
          <div><p class="eyebrow">Transparency</p><h3>Sites & categories</h3></div>
          <div class="micro-copy">${escapeHTML((view.items || []).length)} tracked hosts</div>
        </div>
        <div class="table-shell">
          <table class="data-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Category</th>
                <th>Today</th>
                <th>Week</th>
                <th>Impact</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${(view.items || []).map((item) => `
                <tr>
                  <td>
                    <strong>${escapeHTML(item.host)}</strong>
                    <div class="table-meta">${item.manual ? "Manual rule" : item.excluded ? "Excluded" : "Auto"}</div>
                  </td>
                  <td>${escapeHTML(humanizeCategory(item.category))}</td>
                  <td>${escapeHTML(formatDuration(item.time_today_ms))}</td>
                  <td>${escapeHTML(formatDuration(item.time_week_ms))}</td>
                  <td>${escapeHTML(item.focus_impact)}</td>
                  <td><button class="button quiet small" data-edit-site="${escapeHTML(item.host)}" data-category="${escapeHTML(item.category)}" type="button">Edit</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </article>
      <article class="panel">
        <div class="panel-head"><div><p class="eyebrow">Rules</p><h3>Current overrides</h3></div></div>
        <div class="stack-list">
          ${(view.rules || []).map((rule) => `
            <div class="list-row">
              <div><strong>${escapeHTML(rule.host)}</strong><span>${rule.excluded ? "Excluded" : escapeHTML(humanizeCategory(rule.category))}</span></div>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderInsights(view) {
  if (!view) {
    return `<div class="empty-page">Insights will appear after the first sync.</div>`;
  }
  return `
    <section class="hero-band">
      <article class="hero-card">
        <p class="eyebrow">Main insight</p>
        <h2>${escapeHTML(view.main_insight.title)}</h2>
        <p class="hero-copy">${escapeHTML(view.main_insight.body)}</p>
      </article>
      <article class="side-card">
        <p class="eyebrow">Reflection prompt</p>
        <h3>${escapeHTML(view.reflection_prompt.question)}</h3>
        <p>${escapeHTML(view.reflection_prompt.host || "")}</p>
      </article>
    </section>
    <section class="content-grid">
      <article class="panel">
        <div class="panel-head"><div><p class="eyebrow">Supporting insights</p><h3>Patterns worth keeping in view</h3></div></div>
        <div class="card-list">
          ${(view.supporting || []).map((item) => `
            <article class="insight-card">
              <h4>${escapeHTML(item.title)}</h4>
              <p>${escapeHTML(item.body)}</p>
            </article>
          `).join("")}
        </div>
      </article>
      <article class="panel">
        <div class="panel-head"><div><p class="eyebrow">AI coach</p><h3>Next adjustments</h3></div></div>
        <div class="card-list">
          ${(view.coach_suggestions || []).map((item) => `
            <article class="insight-card">
              <div class="card-kicker">${escapeHTML(item.priority)}</div>
              <h4>${escapeHTML(item.title)}</h4>
              <p>${escapeHTML(item.body)}</p>
            </article>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderSessions(view) {
  if (!view) {
    return `<div class="empty-page">Focus session history will appear after the first session.</div>`;
  }
  return `
    <section class="summary-strip">
      <article class="summary-card"><span>Sessions completed</span><strong>${escapeHTML(String(view.summary.sessions_completed || 0))}</strong></article>
      <article class="summary-card"><span>Average length</span><strong>${escapeHTML(formatDuration(view.summary.average_duration_ms || 0))}</strong></article>
      <article class="summary-card"><span>Longest session</span><strong>${escapeHTML(formatDuration(view.summary.longest_duration_ms || 0))}</strong></article>
    </section>
    ${view.active_session ? `
      <section class="panel">
        <div class="panel-head"><div><p class="eyebrow">Active session</p><h3>${escapeHTML(view.active_session.intent || "Focus block")}</h3></div></div>
        <div class="hero-metrics">
          <div><span>Duration</span><strong>${escapeHTML(formatDuration(view.active_session.active_duration_ms || 0))}</strong></div>
          <div><span>Status</span><strong>${escapeHTML(view.active_session.status)}</strong></div>
          <div><span>Planned</span><strong>${escapeHTML(`${view.active_session.planned_minutes}m`)}</strong></div>
        </div>
        <div class="button-row">
          <button class="button quiet" data-focus-action="pause" data-session-id="${escapeHTML(view.active_session.id)}" type="button">Pause</button>
          <button class="button primary" data-focus-action="end" data-session-id="${escapeHTML(view.active_session.id)}" type="button">End session</button>
        </div>
      </section>
    ` : `
      <section class="panel">
        <div class="panel-head"><div><p class="eyebrow">Start now</p><h3>No active focus session</h3></div></div>
        <p class="panel-copy">Use focus mode when you want the popup to go quiet and the session history to stay honest.</p>
        <button class="button primary" data-start-focus="45" type="button">Start 45-minute session</button>
      </section>
    `}
    <section class="panel">
      <div class="panel-head"><div><p class="eyebrow">History</p><h3>Recent sessions</h3></div></div>
      <div class="stack-list">
        ${(view.items || []).map((item) => `
          <div class="list-row">
            <div>
              <strong>${escapeHTML(item.intent || "Focus block")}</strong>
              <span>${escapeHTML(new Date(item.started_at).toLocaleString())}</span>
            </div>
            <strong>${escapeHTML(formatDuration(item.active_duration_ms || 0))}</strong>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function idleOptions() {
  return IDLE_DETECTION_OPTIONS.map((seconds) => `
    <option value="${seconds}">${seconds >= 60 ? `${Math.floor(seconds / 60)} min` : `${seconds}s`}</option>
  `).join("");
}

function renderSettingsTab(settings) {
  return `
    <form id="dashboardSettingsForm" class="settings-grid">
      <section class="panel wide-panel">
        <div class="panel-head"><div><p class="eyebrow">Work hours</p><h3>Define what focus means for you</h3></div></div>
        <div class="form-grid">
          <label class="field"><span>API base URL</span><input name="apiBaseUrl" type="url" value="${escapeHTML(settings.apiBaseUrl)}" required /></label>
          <label class="field"><span>Timezone</span><input name="timezone" type="text" value="${escapeHTML(settings.timezone)}" required /></label>
          <label class="field"><span>Work hours start</span><input name="workHoursStart" type="time" value="${escapeHTML(formatClock(settings.workHoursStart))}" /></label>
          <label class="field"><span>Work hours end</span><input name="workHoursEnd" type="time" value="${escapeHTML(formatClock(settings.workHoursEnd))}" /></label>
          <label class="field"><span>Idle timeout</span><select name="idleDetectionSeconds">${idleOptions()}</select></label>
          <label class="field"><span>Snooze duration</span><input name="snoozeMinutes" type="number" min="5" step="5" value="${escapeHTML(String(settings.snoozeMinutes))}" /></label>
          <label class="toggle-row"><span>Pause tracking</span><input name="trackingPaused" type="checkbox" ${settings.trackingPaused ? "checked" : ""} /></label>
          <label class="toggle-row"><span>Track media while idle</span><input name="trackMediaWhenIdle" type="checkbox" ${settings.trackMediaWhenIdle ? "checked" : ""} /></label>
          <label class="toggle-row"><span>Nudges enabled</span><input name="nudgesEnabled" type="checkbox" ${settings.nudgesEnabled ? "checked" : ""} /></label>
          <label class="toggle-row"><span>Only within work hours</span><input name="workHoursOnly" type="checkbox" ${settings.workHoursOnly ? "checked" : ""} /></label>
          <label class="toggle-row"><span>AI insights enabled</span><input name="aiInsightsEnabled" type="checkbox" ${settings.aiInsightsEnabled ? "checked" : ""} /></label>
          <label class="field">
            <span>Nudge sensitivity</span>
            <select name="nudgeSensitivity">
              <option value="direct" ${settings.nudgeSensitivity === "direct" ? "selected" : ""}>Direct</option>
              <option value="balanced" ${settings.nudgeSensitivity === "balanced" ? "selected" : ""}>Balanced</option>
              <option value="gentle" ${settings.nudgeSensitivity === "gentle" ? "selected" : ""}>Gentle</option>
            </select>
          </label>
          <label class="field">
            <span>AI tone</span>
            <select name="aiTone">
              <option value="direct" ${settings.aiTone === "direct" ? "selected" : ""}>Direct</option>
              <option value="balanced" ${settings.aiTone === "balanced" ? "selected" : ""}>Balanced</option>
              <option value="gentle" ${settings.aiTone === "gentle" ? "selected" : ""}>Gentle</option>
            </select>
          </label>
        </div>

        <div class="field-group">
          <span class="field-title">Workdays</span>
          <div class="checkbox-row">
            ${[
              [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [7, "Sun"]
            ].map(([value, label]) => `
              <label><input name="workdays" type="checkbox" value="${value}" ${settings.workdays.includes(value) ? "checked" : ""} /> ${label}</label>
            `).join("")}
          </div>
        </div>

        <label class="field wide"><span>Deep work blocks</span><textarea name="deepWorkBlocks" rows="3">${escapeHTML(blocksToText(settings.deepWorkBlocks))}</textarea></label>
        <label class="field wide"><span>Excluded hosts</span><textarea name="excludedHosts" rows="4">${escapeHTML((settings.excludedHosts || []).join("\n"))}</textarea></label>
        <label class="field wide"><span>Category overrides</span><textarea name="categoryOverrides" rows="6">${escapeHTML(overridesToText(settings.categoryOverrides))}</textarea></label>

        <div class="button-row">
          <button class="button primary" type="submit">Save locally</button>
          <button class="button quiet" data-settings-sync="true" type="button">Push to backend</button>
        </div>
      </section>
    </form>
  `;
}

function renderSiteModal() {
  if (!modalState.open) {
    return "";
  }
  return `
    <div class="modal-backdrop">
      <form class="modal-card" id="dashboardSiteRuleForm">
        <div class="modal-head">
          <div><p class="eyebrow">Edit rule</p><h3>${escapeHTML(modalState.host)}</h3></div>
          <button class="icon-button" data-close-site-modal="true" type="button">Close</button>
        </div>
        <label class="field">
          <span>Category</span>
          <select name="category">
            ${["work", "communication", "learning", "tools", "other", "social", "entertainment", "shopping", "news"].map((value) => `
              <option value="${value}" ${modalState.category === value ? "selected" : ""}>${humanizeCategory(value)}</option>
            `).join("")}
          </select>
        </label>
        <label class="toggle-row"><span>Exclude from tracking</span><input name="excluded" type="checkbox" ${modalState.excluded ? "checked" : ""} /></label>
        <div class="button-row">
          <button class="button quiet" data-close-site-modal="true" type="button">Cancel</button>
          <button class="button primary" type="submit">Save</button>
        </div>
      </form>
    </div>
  `;
}

function renderDashboard() {
  const content = document.getElementById("dashboardContent");
  const settings = bootstrap?.settings;
  document.getElementById("dashboardTabs").innerHTML = renderTopNav();
  document.getElementById("dashboardStatus").textContent = bootstrap?.dashboardCache?.lastError
    ? `Sync needs attention: ${bootstrap.dashboardCache.lastError}`
    : bootstrap?.dashboardCache?.lastSyncAt
      ? `Updated ${new Date(bootstrap.dashboardCache.lastSyncAt).toLocaleString()}`
      : "Loading focus data...";

  let html = "";
  switch (activeTab) {
    case "trends":
      html = renderTrends(bootstrap?.dashboardCache?.trendsView);
      break;
    case "sites":
      html = renderSites(bootstrap?.dashboardCache?.sitesView);
      break;
    case "insights":
      html = renderInsights(bootstrap?.dashboardCache?.insightsView);
      break;
    case "sessions":
      html = renderSessions(bootstrap?.dashboardCache?.focusSessionsView);
      break;
    case "settings":
      html = renderSettingsTab(settings);
      break;
    default:
      html = renderToday(bootstrap?.dashboardCache?.todayView);
      break;
  }

  content.innerHTML = `${html}${renderSiteModal()}`;

  const idleSelect = content.querySelector('select[name="idleDetectionSeconds"]');
  if (idleSelect && settings) {
    idleSelect.value = String(settings.idleDetectionSeconds);
  }
}

async function reloadBootstrap() {
  bootstrap = await sendMessage({ type: MESSAGE_TYPES.getBootstrap });
  renderDashboard();
}

function collectSettings(form) {
  const formData = new FormData(form);
  return {
    apiBaseUrl: String(formData.get("apiBaseUrl") || "").trim(),
    timezone: String(formData.get("timezone") || "").trim(),
    trackingPaused: formData.get("trackingPaused") === "on",
    idleDetectionSeconds: Number(formData.get("idleDetectionSeconds") || 60),
    trackMediaWhenIdle: formData.get("trackMediaWhenIdle") === "on",
    workHoursStart: String(formData.get("workHoursStart") || "09:00"),
    workHoursEnd: String(formData.get("workHoursEnd") || "18:00"),
    workdays: parseWorkdaysFromForm(formData),
    deepWorkBlocks: textToBlocks(String(formData.get("deepWorkBlocks") || "")),
    nudgesEnabled: formData.get("nudgesEnabled") === "on",
    nudgeSensitivity: String(formData.get("nudgeSensitivity") || "balanced"),
    snoozeMinutes: Number(formData.get("snoozeMinutes") || 20),
    workHoursOnly: formData.get("workHoursOnly") === "on",
    aiInsightsEnabled: formData.get("aiInsightsEnabled") === "on",
    aiTone: String(formData.get("aiTone") || "balanced"),
    excludedHosts: textToLines(String(formData.get("excludedHosts") || "")),
    categoryOverrides: textToOverrides(String(formData.get("categoryOverrides") || ""))
  };
}

document.addEventListener("click", async (event) => {
  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    activeTab = tabButton.dataset.tab;
    renderDashboard();
    return;
  }

  const refreshButton = event.target.closest("[data-refresh-dashboard]");
  if (refreshButton) {
    await sendMessage({ type: MESSAGE_TYPES.refreshViews });
    await reloadBootstrap();
    return;
  }

  const openSettings = event.target.closest("[data-open-options]");
  if (openSettings) {
    chrome.runtime.openOptionsPage();
    return;
  }

  const startFocus = event.target.closest("[data-start-focus]");
  if (startFocus) {
    await sendMessage({ type: MESSAGE_TYPES.startFocusSession, minutes: Number(startFocus.dataset.startFocus || 45) });
    await reloadBootstrap();
    return;
  }

  const focusAction = event.target.closest("[data-focus-action]");
  if (focusAction) {
    const action = focusAction.dataset.focusAction;
    const typeMap = {
      pause: MESSAGE_TYPES.pauseFocusSession,
      resume: MESSAGE_TYPES.resumeFocusSession,
      end: MESSAGE_TYPES.endFocusSession
    };
    await sendMessage({ type: typeMap[action], sessionId: focusAction.dataset.sessionId });
    await reloadBootstrap();
    return;
  }

  const editSite = event.target.closest("[data-edit-site]");
  if (editSite) {
    modalState = {
      open: true,
      host: editSite.dataset.editSite,
      category: editSite.dataset.category || "work",
      excluded: false
    };
    renderDashboard();
    return;
  }

  if (event.target.closest("[data-close-site-modal]")) {
    modalState = { open: false, host: "", category: "work", excluded: false };
    renderDashboard();
    return;
  }

  const syncButton = event.target.closest("[data-settings-sync]");
  if (syncButton) {
    await sendMessage({ type: MESSAGE_TYPES.pushPreferences });
    await reloadBootstrap();
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "dashboardSettingsForm") {
    event.preventDefault();
    const previousSettings = await getSettings();
    await saveSettings(collectSettings(event.target));
    await sendMessage({
      type: MESSAGE_TYPES.saveSettings,
      previousSettings
    });
    bootstrap = await sendMessage({ type: MESSAGE_TYPES.getBootstrap });
    renderDashboard();
    return;
  }

  if (event.target.id === "dashboardSiteRuleForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    await sendMessage({
      type: MESSAGE_TYPES.saveSiteRule,
      host: modalState.host,
      category: String(formData.get("category") || "work"),
      excluded: formData.get("excluded") === "on"
    });
    modalState = { open: false, host: "", category: "work", excluded: false };
    await reloadBootstrap();
  }
});

async function init() {
  bootstrap = await sendMessage({ type: MESSAGE_TYPES.getBootstrap });
  renderDashboard();
}

void init();
