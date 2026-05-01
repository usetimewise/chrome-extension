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

function buildToast(message) {
  const host = document.createElement("div");
  host.id = TOAST_ID;

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      display: block;
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      max-width: 360px;
      width: calc(100vw - 40px);
      pointer-events: auto;
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .toast {
      box-sizing: border-box;
      width: 100%;
      border: 1px solid rgba(15, 23, 42, 0.14);
      border-left: 4px solid #2563eb;
      border-radius: 8px;
      background: #ffffff;
      color: #111827;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.22);
      padding: 14px 14px 13px;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .title {
      margin: 0;
      font-size: 14px;
      line-height: 1.3;
      font-weight: 700;
      color: #0f172a;
    }

    .message {
      margin: 0;
      font-size: 13px;
      line-height: 1.45;
      font-weight: 400;
      color: #334155;
    }

    .close {
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      font-size: 20px;
      line-height: 24px;
      padding: 0;
    }

    .close:hover {
      background: #f1f5f9;
      color: #0f172a;
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

  const title = document.createElement("p");
  title.className = "title";
  title.textContent = message.title || "Focus mode: distraction detected";

  const close = document.createElement("button");
  close.className = "close";
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss focus nudge");
  close.textContent = "x";
  close.addEventListener("click", removeExistingToast);

  const body = document.createElement("p");
  body.className = "message";
  body.textContent = message.message || "";

  header.append(title, close);
  toast.append(header, body);
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
