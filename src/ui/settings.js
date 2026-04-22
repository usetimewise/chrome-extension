import { IDLE_DETECTION_OPTIONS, MESSAGE_TYPES } from "../lib/constants.js";
import { getSettings, saveSettings } from "../lib/state.js";
import { blocksToText, overridesToText, parseWorkdaysFromForm, textToBlocks, textToLines, textToOverrides } from "../lib/utils.js";

function setStatus(message, isError = false) {
  const status = document.getElementById("settingsStatus");
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function renderIdleOptions(selectedValue) {
  const select = document.getElementById("idleDetectionSeconds");
  select.innerHTML = IDLE_DETECTION_OPTIONS.map((seconds) => `
    <option value="${seconds}" ${Number(selectedValue) === seconds ? "selected" : ""}>${seconds >= 60 ? `${Math.floor(seconds / 60)} min` : `${seconds}s`}</option>
  `).join("");
}

function populateForm(settings) {
  renderIdleOptions(settings.idleDetectionSeconds);
  document.getElementById("apiBaseUrl").value = settings.apiBaseUrl;
  document.getElementById("timezone").value = settings.timezone;
  document.getElementById("trackingPaused").checked = settings.trackingPaused;
  document.getElementById("trackMediaWhenIdle").checked = settings.trackMediaWhenIdle;
  document.getElementById("workHoursStart").value = settings.workHoursStart;
  document.getElementById("workHoursEnd").value = settings.workHoursEnd;
  document.getElementById("deepWorkBlocks").value = blocksToText(settings.deepWorkBlocks);
  document.getElementById("nudgesEnabled").checked = settings.nudgesEnabled;
  document.getElementById("nudgeSensitivity").value = settings.nudgeSensitivity;
  document.getElementById("snoozeMinutes").value = String(settings.snoozeMinutes);
  document.getElementById("workHoursOnly").checked = settings.workHoursOnly;
  document.getElementById("aiInsightsEnabled").checked = settings.aiInsightsEnabled;
  document.getElementById("aiTone").value = settings.aiTone;
  document.getElementById("excludedHosts").value = (settings.excludedHosts || []).join("\n");
  document.getElementById("categoryOverrides").value = overridesToText(settings.categoryOverrides);

  for (const checkbox of document.querySelectorAll('input[name="workdays"]')) {
    checkbox.checked = settings.workdays.includes(Number(checkbox.value));
  }
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

document.getElementById("settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const previousSettings = await getSettings();
    await saveSettings(collectSettings(event.target));
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

async function init() {
  populateForm(await getSettings());
}

void init();
