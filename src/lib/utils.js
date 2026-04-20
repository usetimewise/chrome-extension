import { CATEGORY_LABELS } from "./constants.js";

export function generateId() {
  return crypto.randomUUID();
}

export function normalizeHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function normalizePathHash(url) {
  try {
    const pathname = new URL(url).pathname || "/";
    return btoa(pathname).slice(0, 64);
  } catch {
    return "";
  }
}

export function isTrackableUrl(url) {
  return typeof url === "string" && /^(http|https):\/\//.test(url);
}

export function formatDuration(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatPercent(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

export function humanizeCategory(category) {
  return CATEGORY_LABELS[category] || category || "Unknown";
}

export function textToLines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function overridesToText(overrides) {
  return Object.entries(overrides || {})
    .map(([host, category]) => `${host}=${category}`)
    .join("\n");
}

export function textToOverrides(value) {
  const result = {};
  for (const line of textToLines(value)) {
    const [host, category] = line.split("=").map((part) => part.trim());
    if (host && category) {
      result[host] = category;
    }
  }
  return result;
}

export function hostMatchesRule(host, rule) {
  if (!host || !rule) {
    return false;
  }

  return host === rule || host.endsWith(`.${rule}`);
}
