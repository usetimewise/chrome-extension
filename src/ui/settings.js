import { IDLE_DETECTION_OPTIONS, MESSAGE_TYPES } from "../lib/constants.js";
import { overridesToText, textToLines, textToOverrides } from "../lib/utils.js";
import { getSettings, saveSettings } from "../lib/state.js";

function setStatus(message, isError = false) {
  const status = document.getElementById("settingsStatus");
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function describeIdleOption(seconds) {
  if (seconds < 120) {
    return `${seconds} seconds`;
  }

  const minutes = Math.floor(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function renderIdleOptions() {
  const select = document.getElementById("idleDetectionSeconds");
  select.textContent = "";

  for (const seconds of IDLE_DETECTION_OPTIONS) {
    const option = document.createElement("option");
    option.value = String(seconds);
    option.textContent = describeIdleOption(seconds);
    select.append(option);
  }
}

function populateForm(settings) {
  document.getElementById("apiBaseUrl").value = settings.apiBaseUrl;
  document.getElementById("timezone").value = settings.timezone;
  document.getElementById("trackingPaused").checked = settings.trackingPaused;
  document.getElementById("idleDetectionSeconds").value = String(settings.idleDetectionSeconds);
  document.getElementById("trackMediaWhenIdle").checked = settings.trackMediaWhenIdle;
  document.getElementById("socialLimit").value = settings.limits.social ?? "";
  document.getElementById("entertainmentLimit").value = settings.limits.entertainment ?? "";
  document.getElementById("allowList").value = (settings.allowList || []).join("\n");
  document.getElementById("blockList").value = (settings.blockList || []).join("\n");
  document.getElementById("categoryOverrides").value = overridesToText(settings.categoryOverrides);
}

async function loadSettingsPage() {
  renderIdleOptions();
  const settings = await getSettings();
  populateForm(settings);
}

document.getElementById("settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const previousSettings = await getSettings();
  const payload = {
    apiBaseUrl: document.getElementById("apiBaseUrl").value.trim(),
    timezone: document.getElementById("timezone").value.trim(),
    trackingPaused: document.getElementById("trackingPaused").checked,
    idleDetectionSeconds: Number(document.getElementById("idleDetectionSeconds").value || 60),
    trackMediaWhenIdle: document.getElementById("trackMediaWhenIdle").checked,
    limits: {
      social: Number(document.getElementById("socialLimit").value || 0),
      entertainment: Number(document.getElementById("entertainmentLimit").value || 0)
    },
    allowList: textToLines(document.getElementById("allowList").value),
    blockList: textToLines(document.getElementById("blockList").value),
    categoryOverrides: textToOverrides(document.getElementById("categoryOverrides").value)
  };

  try {
    await saveSettings(payload);
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.saveSettings,
      previousSettings
    });
    if (!response.ok) {
      throw new Error(response.error || "Failed to apply settings");
    }
    setStatus("Preferences saved locally.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById("syncSettingsBtn").addEventListener("click", async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.pushPreferences });
    if (!response.ok) {
      throw new Error(response.error || "Failed to sync settings");
    }
    setStatus("Preferences pushed to the backend.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById("openDashboardFromSettingsBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});

void loadSettingsPage();
