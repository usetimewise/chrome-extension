type FocusOverlayMessage = {
  sessionId: string;
  message: string;
  host: string;
  category: string;
};

{
type FocusNudgeState = {
  activeOverlayKey: string | null;
  contextInvalidated: boolean;
  listenerInstalled: boolean;
  suppressedHosts: Set<string>;
};

const FOCUS_MESSAGE_TYPES = {
  showFocusNudge: "SHOW_FOCUS_NUDGE",
  saveSiteRule: "SAVE_SITE_RULE",
  closeCurrentTab: "CLOSE_CURRENT_TAB"
} as const;
const OVERLAY_ID = "time-wise-focus-overlay";
const stateHost = globalThis as typeof globalThis & {
  __timeWiseFocusNudgeState?: FocusNudgeState;
};
const focusNudgeState = stateHost.__timeWiseFocusNudgeState || {
  activeOverlayKey: null,
  contextInvalidated: false,
  listenerInstalled: false,
  suppressedHosts: new Set<string>()
};
stateHost.__timeWiseFocusNudgeState = focusNudgeState;

function isShowFocusNudgeMessage(message: unknown): message is FocusOverlayMessage & { type: typeof FOCUS_MESSAGE_TYPES.showFocusNudge } {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Record<string, unknown>;
  return candidate.type === FOCUS_MESSAGE_TYPES.showFocusNudge &&
    typeof candidate.sessionId === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.host === "string" &&
    typeof candidate.category === "string";
}

function sendBackgroundMessage<TResponse = unknown>(message: unknown): Promise<TResponse> {
  if (focusNudgeState.contextInvalidated) {
    return Promise.reject(new Error("Extension context invalidated."));
  }

  try {
    return chrome.runtime.sendMessage(message) as Promise<TResponse>;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Extension context invalidated")) {
      focusNudgeState.contextInvalidated = true;
      removeExistingOverlay();
    }
    return Promise.reject(error);
  }
}

function overlayKey(message: FocusOverlayMessage): string {
  return `${message.sessionId}:${message.host}`;
}

function removeExistingOverlay() {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing.remove();
  }
  focusNudgeState.activeOverlayKey = null;
}

function setStatus(shadow: ShadowRoot, message: string): void {
  const status = shadow.querySelector<HTMLElement>(".status");
  if (status) {
    status.textContent = message;
  }
}

function setButtonsDisabled(shadow: ShadowRoot, disabled: boolean): void {
  shadow.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    button.disabled = disabled;
  });
}

function buildOverlay(message: FocusOverlayMessage): HTMLDivElement {
  const host = document.createElement("div");
  host.id = OVERLAY_ID;

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 100px;
      background: rgba(255, 255, 255, 0.96);
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      pointer-events: auto;
    }

    .panel {
      box-sizing: border-box;
      width: min(100%, 560px);
      padding: 32px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      background: #ffffff;
      color: #030213;
      box-shadow: 0 18px 44px rgba(15, 23, 42, 0.14);
    }

    .kicker {
      margin: 0 0 12px;
      color: #717182;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.12em;
      line-height: 1.2;
      text-transform: uppercase;
    }

    .title {
      margin: 0;
      color: #030213;
      font-size: 28px;
      font-weight: 500;
      letter-spacing: 0;
      line-height: 1.18;
    }

    .message {
      margin: 14px 0 0;
      color: #4b5563;
      font-size: 16px;
      line-height: 1.6;
    }

    .meta {
      margin: 10px 0 0;
      color: #717182;
      font-size: 13px;
      line-height: 1.45;
    }

    .actions {
      display: grid;
      gap: 10px;
      margin-top: 28px;
    }

    button {
      min-height: 44px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: #ffffff;
      color: #030213;
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.2;
      padding: 12px 16px;
      text-align: center;
      transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, opacity 140ms ease;
    }

    button:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #b8bec7;
    }

    button:disabled {
      cursor: default;
      opacity: 0.62;
    }

    .primary {
      border-color: #030213;
      background: #030213;
      color: #ffffff;
    }

    .primary:hover:not(:disabled) {
      border-color: #1f2937;
      background: #1f2937;
    }

    .status {
      min-height: 19px;
      margin: 14px 0 0;
      color: #b42318;
      font-size: 13px;
      line-height: 1.45;
    }

    @media (max-width: 720px) {
      :host {
        align-items: stretch;
        padding: 24px;
      }

      .panel {
        align-self: center;
        padding: 24px;
      }
    }
  `;

  const panel = document.createElement("section");
  panel.className = "panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "time-wise-focus-overlay-title");

  const kicker = document.createElement("p");
  kicker.className = "kicker";
  kicker.textContent = "Time Wise";

  const title = document.createElement("h1");
  title.className = "title";
  title.id = "time-wise-focus-overlay-title";
  title.textContent = "Ты отвлекся";

  const copy = document.createElement("p");
  copy.className = "message";
  copy.textContent = message.message;

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = `${message.host} · ${message.category}`;

  const actions = document.createElement("div");
  actions.className = "actions";

  const leaveButton = document.createElement("button");
  leaveButton.className = "primary";
  leaveButton.type = "button";
  leaveButton.textContent = "Виноват, ухожу";
  leaveButton.addEventListener("click", () => {
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage({ type: FOCUS_MESSAGE_TYPES.closeCurrentTab })
      .catch((error: unknown) => {
        setButtonsDisabled(shadow, false);
        setStatus(shadow, error instanceof Error ? error.message : "Не удалось закрыть вкладку");
      });
  });

  const workButton = document.createElement("button");
  workButton.type = "button";
  workButton.textContent = "Это не отвлечение";
  workButton.addEventListener("click", () => {
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage({
      type: FOCUS_MESSAGE_TYPES.saveSiteRule,
      host: message.host,
      category: "work",
      excluded: false
    })
      .then(removeExistingOverlay)
      .catch((error: unknown) => {
        setButtonsDisabled(shadow, false);
        setStatus(shadow, error instanceof Error ? error.message : "Не удалось сохранить правило для сайта");
      });
  });

  const urgentButton = document.createElement("button");
  urgentButton.type = "button";
  urgentButton.textContent = "Мне сейчас срочно нужен сайт";
  urgentButton.addEventListener("click", () => {
    focusNudgeState.suppressedHosts.add(overlayKey(message));
    removeExistingOverlay();
  });

  const status = document.createElement("p");
  status.className = "status";
  status.setAttribute("role", "status");

  actions.append(leaveButton, workButton, urgentButton);
  panel.append(kicker, title, copy, meta, actions, status);
  shadow.append(style, panel);

  return host;
}

function showFocusOverlay(message: FocusOverlayMessage): void {
  const key = overlayKey(message);
  if (focusNudgeState.suppressedHosts.has(key)) {
    removeExistingOverlay();
    return;
  }

  if (focusNudgeState.activeOverlayKey === key && document.getElementById(OVERLAY_ID)) {
    return;
  }

  removeExistingOverlay();
  focusNudgeState.activeOverlayKey = key;
  document.documentElement.append(buildOverlay(message));
}

if (!focusNudgeState.listenerInstalled && !focusNudgeState.contextInvalidated) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isShowFocusNudgeMessage(message)) {
      return false;
    }

    showFocusOverlay(message);
    sendResponse({ ok: true });
    return true;
  });
  focusNudgeState.listenerInstalled = true;
}
}
