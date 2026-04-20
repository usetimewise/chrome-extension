import { formatDuration, formatPercent, humanizeCategory } from "../lib/utils.js";

export function renderSites(container, items = []) {
  if (!items.length) {
    container.textContent = "No data yet.";
    container.classList.add("muted");
    return;
  }

  container.classList.remove("muted");
  container.innerHTML = items
    .map((item) => `
      <div class="stack-item">
        <span>${item.host}</span>
        <strong>${formatDuration(item.duration_ms)}</strong>
      </div>
    `)
    .join("");
}

export function renderRecommendations(container, items = []) {
  if (!items.length) {
    container.textContent = "No recommendations yet.";
    container.classList.add("muted");
    return;
  }

  container.classList.remove("muted");
  container.innerHTML = items
    .map((item) => `
      <article class="recommendation-card" data-priority="${item.priority}">
        <strong>${item.title}</strong>
        <p class="muted">${item.body}</p>
      </article>
    `)
    .join("");
}

export function renderCategories(container, items = []) {
  if (!items.length) {
    container.textContent = "No category data yet.";
    container.classList.add("muted");
    return;
  }

  container.classList.remove("muted");
  container.innerHTML = items
    .map((item) => `
      <div class="stack-item">
        <span>${humanizeCategory(item.category)}</span>
        <strong>${formatPercent(item.share)} • ${formatDuration(item.duration_ms)}</strong>
      </div>
    `)
    .join("");
}

export function renderTimeseries(container, points = []) {
  if (!points.length) {
    container.textContent = "No time series data yet.";
    container.classList.add("muted");
    return;
  }

  const maxValue = Math.max(...points.map((point) => point.total_duration_ms), 1);
  container.classList.remove("muted");
  container.innerHTML = points
    .map((point) => {
      const width = Math.max(6, Math.round((point.total_duration_ms / maxValue) * 100));
      return `
        <div class="chart-row">
          <span>${point.label}</span>
          <div class="chart-bar">
            <div class="chart-bar-fill" style="width: ${width}%"></div>
          </div>
          <strong>${formatDuration(point.total_duration_ms)}</strong>
        </div>
      `;
    })
    .join("");
}
