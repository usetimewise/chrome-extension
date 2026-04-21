import { formatDuration, formatPercent, humanizeCategory } from "../lib/utils.js";

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setEmptyState(container, message) {
  container.classList.add("muted");
  container.innerHTML = `<div class="empty-state">${escapeHTML(message)}</div>`;
}

export function renderSites(container, items = []) {
  if (!items.length) {
    setEmptyState(container, "No time has been synced yet.");
    return;
  }

  container.classList.remove("muted");
  container.innerHTML = items
    .map((item) => `
      <article class="reflection-item">
        <div class="reflection-copy">
          <p class="item-title">${escapeHTML(item.host)}</p>
          <p class="item-meta">${escapeHTML(humanizeCategory(item.category))}</p>
        </div>
        <div class="item-measure">
          <strong>${escapeHTML(formatDuration(item.duration_ms))}</strong>
        </div>
      </article>
    `)
    .join("");
}

export function renderRecommendations(container, items = []) {
  if (!items.length) {
    setEmptyState(container, "Suggestions will appear once a clear pattern is available.");
    return;
  }

  container.classList.remove("muted");
  container.innerHTML = items
    .map((item, index) => `
      <article class="recommendation-card ${index === 0 ? "recommendation-card-featured" : "recommendation-card-secondary"}" data-priority="${item.priority}">
        <div class="recommendation-meta">
          <strong>${escapeHTML(item.title)}</strong>
          <span class="recommendation-priority">${escapeHTML(item.priority || "note")}</span>
        </div>
        <p class="muted">${escapeHTML(item.body)}</p>
      </article>
    `)
    .join("");
}

export function renderCategories(container, items = []) {
  if (!items.length) {
    setEmptyState(container, "Categories will appear after the first synced range.");
    return;
  }

  container.classList.remove("muted");
  container.innerHTML = items
    .map((item) => `
      <article class="reflection-item">
        <div class="reflection-copy">
          <p class="item-title">${escapeHTML(humanizeCategory(item.category))}</p>
          <p class="item-meta">${escapeHTML(formatPercent(item.share))} of tracked time</p>
        </div>
        <div class="item-measure">
          <strong>${escapeHTML(formatDuration(item.duration_ms))}</strong>
        </div>
      </article>
    `)
    .join("");
}

export function renderTimeseries(container, points = []) {
  if (!points.length) {
    setEmptyState(container, "A time pattern will appear when activity is available for this range.");
    return;
  }

  const maxValue = Math.max(...points.map((point) => point.total_duration_ms), 1);
  container.classList.remove("muted");
  container.innerHTML = points
    .map((point) => {
      const totalWidth = Math.max(8, Math.round((point.total_duration_ms / maxValue) * 100));
      const focusWidth = point.focus_duration_ms
        ? Math.max(0, Math.round((point.focus_duration_ms / maxValue) * 100))
        : 0;
      return `
        <div class="timeline-row">
          <div class="timeline-meta">
            <span class="timeline-label">${escapeHTML(point.label)}</span>
            <strong class="timeline-value">${escapeHTML(formatDuration(point.total_duration_ms))}</strong>
          </div>
          <div class="timeline-track">
            <span class="timeline-total" style="width: ${totalWidth}%"></span>
            <span class="timeline-focus" style="width: ${focusWidth}%"></span>
          </div>
        </div>
      `;
    })
    .join("");
}
