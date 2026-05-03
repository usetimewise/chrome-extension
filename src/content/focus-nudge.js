const FOCUS_NUDGE_MESSAGE_TYPES = {
  showFocusNudge: "SHOW_FOCUS_NUDGE"
};

const TOAST_ID = "time-wise-focus-nudge";
let dismissTimer = null;

function removeExistingToast() {
  const existing = document.getElementById(TOAST_ID);
  if (existing) {
    existing.remove();
  }

  if (dismissTimer !== null) {
    window.clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}

function compactDuration(value) {
  return String(value || "")
    .replace(/\bhours?\b/g, "h")
    .replace(/\bminutes?\b/g, "m")
    .replace(/\s+/g, " ")
    .replace(/(\d+)\s+([hm])/g, "$1$2")
    .trim();
}

function buildToast(message) {
  const host = document.createElement("div");
  host.id = TOAST_ID;

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  const fontAwesomeSolidUrl = chrome.runtime.getURL("vendor/fontawesome/webfonts/fa-solid-900.woff2");
  style.textContent = `
    @font-face {
      font-family: "Font Awesome 7 Free";
      font-style: normal;
      font-weight: 900;
      font-display: block;
      src: url("${fontAwesomeSolidUrl}") format("woff2");
    }

    :host {
      all: initial;
      display: block;
      position: fixed;
      top: 14px;
      right: 28px;
      z-index: 2147483647;
      max-width: 363px;
      width: calc(100vw - 56px);
      pointer-events: auto;
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .fa-solid {
      -webkit-font-smoothing: antialiased;
      display: inline-block;
      font-family: "Font Awesome 7 Free";
      font-style: normal;
      font-variant: normal;
      font-weight: 900;
      line-height: 1;
      text-rendering: auto;
    }

    .fa-triangle-exclamation::before {
      content: "\\f071";
    }

    .fa-xmark::before {
      content: "\\f00d";
    }

    .toast {
      box-sizing: border-box;
      width: 100%;
      overflow: hidden;
      border: 1px solid #dbe3ee;
      border-radius: 12px;
      background: #ffffff;
      color: #172033;
      box-shadow: 0 12px 26px rgba(15, 23, 42, 0.18);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 16px 14px;
      background: #fff8eb;
    }

    .title-row {
      display: flex;
      align-items: center;
      min-width: 0;
      gap: 12px;
    }

    .title-copy {
      min-width: 0;
    }

    .warning {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 31px;
      height: 31px;
      flex: 0 0 auto;
      border-radius: 999px;
      background: #fff0c7;
      color: #f59e0b;
      font-size: 17px;
      font-weight: 800;
      line-height: 1;
    }

    .title {
      margin: 0;
      overflow: hidden;
      font-size: 14px;
      line-height: 1.3;
      font-weight: 700;
      color: #0f172a;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .meta {
      margin: 2px 0 0;
      overflow: hidden;
      color: #475569;
      font-size: 13px;
      line-height: 1.25;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .body {
      padding: 15px 16px 16px;
    }

    .message {
      margin: 0;
      color: #253047;
      font-size: 14px;
      line-height: 1.55;
      font-weight: 500;
    }

    .close {
      flex: 0 0 auto;
      width: 22px;
      height: 22px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      padding: 0;
    }

    .close:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .return {
      display: block;
      width: 100%;
      margin-top: 13px;
      border: 0;
      border-radius: 8px;
      background: #111827;
      color: #ffffff;
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.2;
      padding: 12px 16px;
      text-align: center;
    }

    .return:hover {
      background: #0b1220;
    }

    @media (max-width: 480px) {
      :host {
        top: 12px;
        right: 12px;
        width: calc(100vw - 24px);
      }
    }
  `;

  const toast = document.createElement("section");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  const header = document.createElement("div");
  header.className = "header";

  const titleRow = document.createElement("div");
  titleRow.className = "title-row";

  const warning = document.createElement("span");
  warning.className = "warning fa-solid fa-triangle-exclamation";
  warning.setAttribute("aria-hidden", "true");

  const titleCopy = document.createElement("div");
  titleCopy.className = "title-copy";

  const title = document.createElement("p");
  title.className = "title";
  title.textContent = "Attention shifted";

  const meta = document.createElement("p");
  meta.className = "meta";
  const duration = compactDuration(message.duration);
  const currentHost = message.host || "this site";
  meta.textContent = duration ? `${duration} on ${currentHost} today` : currentHost;

  const close = document.createElement("button");
  close.className = "close fa-solid fa-xmark";
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss focus nudge");
  close.addEventListener("click", removeExistingToast);

  const body = document.createElement("p");
  body.className = "message";
  body.textContent = message.message || "Just a gentle reminder - you're browsing outside your focus areas.";

  const bodyWrap = document.createElement("div");
  bodyWrap.className = "body";

  const returnButton = document.createElement("button");
  returnButton.className = "return";
  returnButton.type = "button";
  returnButton.textContent = "Return to focus";
  returnButton.addEventListener("click", removeExistingToast);

  titleCopy.append(title, meta);
  titleRow.append(warning, titleCopy);
  header.append(titleRow, close);
  bodyWrap.append(body, returnButton);
  toast.append(header, bodyWrap);
  shadow.append(style, toast);

  return host;
}

function showFocusNudge(message) {
  removeExistingToast();
  const toast = buildToast(message);
  document.documentElement.append(toast);
  dismissTimer = window.setTimeout(removeExistingToast, 15000);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== FOCUS_NUDGE_MESSAGE_TYPES.showFocusNudge) {
    return false;
  }

  showFocusNudge(message);
  sendResponse({ ok: true });
  return true;
});
