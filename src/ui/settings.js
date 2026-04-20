import { MESSAGE_TYPES } from "../lib/constants.js";
import { overridesToText, textToLines, textToOverrides } from "../lib/utils.js";
import { getSettings, saveSettings } from "../lib/state.js";

function setStatus(message, isError = false) {
  const status = document.getElementById("settingsStatus");
  status.textContent = message;
  status.style.color = isError ? "#9a3412" : "";
}

function populateForm(settings) {
  document.getElementById("apiBaseUrl").value = settings.apiBaseUrl;
  document.getElementById("timezone").value = settings.timezone;
  document.getElementById("trackingPaused").checked = settings.trackingPaused;
  document.getElementById("socialLimit").value = settings.limits.social ?? "";
  document.getElementById("entertainmentLimit").value = settings.limits.entertainment ?? "";
  document.getElementById("allowList").value = (settings.allowList || []).join("\n");
  document.getElementById("blockList").value = (settings.blockList || []).join("\n");
  document.getElementById("categoryOverrides").value = overridesToText(settings.categoryOverrides);
}

async function loadSettingsPage() {
  const settings = await getSettings();
  populateForm(settings);
}

document.getElementById("settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    apiBaseUrl: document.getElementById("apiBaseUrl").value.trim(),
    timezone: document.getElementById("timezone").value.trim(),
    trackingPaused: document.getElementById("trackingPaused").checked,
    limits: {
      social: Number(document.getElementById("socialLimit").value || 0),
      entertainment: Number(document.getElementById("entertainmentLimit").value || 0)
    },
    allowList: textToLines(document.getElementById("allowList").value),
    blockList: textToLines(document.getElementById("blockList").value),
    categoryOverrides: textToOverrides(document.getElementById("categoryOverrides").value)
  };

  await saveSettings(payload);
  setStatus("Settings saved locally.");
});

document.getElementById("syncSettingsBtn").addEventListener("click", async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.pushPreferences });
    if (!response.ok) {
      throw new Error(response.error || "Failed to sync settings");
    }
    setStatus("Settings pushed to the backend.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById("openDashboardFromSettingsBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});

void loadSettingsPage();
