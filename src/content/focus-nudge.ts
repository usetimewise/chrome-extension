type FocusOverlayMessage = {
  sessionId: string;
  message: string;
  host: string;
  category: string;
  remainingMs: number;
};

{
type OverlayCopyVariant = {
  imageFileName: string;
  text: string;
};

type FocusNudgeState = {
  activeOverlayKey: string | null;
  contextInvalidated: boolean;
  countdownTimerId: number | null;
  listenerInstalled: boolean;
  suppressedHosts: Set<string>;
};

const FOCUS_MESSAGE_TYPES = {
  showFocusNudge: "SHOW_FOCUS_NUDGE",
  saveSiteRule: "SAVE_SITE_RULE",
  closeCurrentTab: "CLOSE_CURRENT_TAB",
  endFocusSession: "END_FOCUS_SESSION"
} as const;
const OVERLAY_ID = "time-wise-focus-overlay";
const FOCUS_BLOCKER_ENGAGE_EVENT = "time-wise-focus-blocker-engage";
const FOCUS_BLOCKER_RELEASE_EVENT = "time-wise-focus-blocker-release";
const OVERLAY_COPY_VARIANTS: readonly OverlayCopyVariant[] = [
  {
    imageFileName: "ceo-s02p01-kpi-frown.png",
    text: "Distraction detected. ROI on YouTube: negative. Reallocate."
  },
  {
    imageFileName: "ceo-s02p02-phone-no.png",
    text: "Twelve minutes of TikTok. That's a $40 mistake. Course-correct."
  },
  {
    imageFileName: "ceo-s02p03-watch-tap.png",
    text: "Entertainment is not on the roadmap. Close the tab."
  },
  {
    imageFileName: "ceo-s02p04-clipboard-flip.png",
    text: "You're optimizing for dopamine, not impact. Switch."
  },
  {
    imageFileName: "ceo-s02p05-pinch-bridge.png",
    text: "Top performers don't scroll during sprint hours."
  },
  {
    imageFileName: "ceo-s02p06-meeting-call.png",
    text: "Quick audit: is this tab on your OKRs? No? Close it."
  },
  {
    imageFileName: "ceo-s02p07-folded-arms.png",
    text: "Reels won't appear in your performance review. Refocus."
  },
  {
    imageFileName: "ceo-s02p08-redline-pen.png",
    text: "Your competitors are shipping. You're watching. Adjust."
  },
  {
    imageFileName: "ceo-s02p09-firm-stare.png",
    text: "Calendar this for after-hours. Now back to the task."
  },
  {
    imageFileName: "ceo-s02p10-tap-table.png",
    text: "Execution gap detected. Close it now."
  }
] as const;
const stateHost = globalThis as typeof globalThis & {
  __timeWiseFocusNudgeState?: FocusNudgeState;
};
const focusNudgeState = stateHost.__timeWiseFocusNudgeState || {
  activeOverlayKey: null,
  contextInvalidated: false,
  countdownTimerId: null,
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
    typeof candidate.category === "string" &&
    typeof candidate.remainingMs === "number" &&
    Number.isFinite(candidate.remainingMs);
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

function getRandomCopyVariant(): OverlayCopyVariant {
  return OVERLAY_COPY_VARIANTS[Math.floor(Math.random() * OVERLAY_COPY_VARIANTS.length)];
}

function getCeoImageUrl(imageFileName: string): string {
  return chrome.runtime.getURL(`images/ceo/${imageFileName}`);
}

function removeExistingOverlay(): void {
  if (focusNudgeState.countdownTimerId !== null) {
    window.clearInterval(focusNudgeState.countdownTimerId);
    focusNudgeState.countdownTimerId = null;
  }

  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing.remove();
  }
  focusNudgeState.activeOverlayKey = null;
}

function releaseFocusBlocker(): void {
  window.dispatchEvent(new CustomEvent(FOCUS_BLOCKER_RELEASE_EVENT));
}

function engageFocusBlocker(): void {
  window.dispatchEvent(new CustomEvent(FOCUS_BLOCKER_ENGAGE_EVENT));
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

function formatRemainingTime(value: number): string {
  const totalSeconds = Math.max(0, Math.ceil(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function setCountdownText(shadow: ShadowRoot, remainingMs: number): void {
  const value = shadow.querySelector<HTMLElement>(".countdown-value");
  if (value) {
    value.textContent = formatRemainingTime(remainingMs);
  }
}

function startOverlayCountdown(shadow: ShadowRoot, message: FocusOverlayMessage): void {
  const endsAt = Date.now() + Math.max(0, message.remainingMs);
  let hasSentEnd = false;

  const tick = (): void => {
    const remainingMs = Math.max(0, endsAt - Date.now());
    setCountdownText(shadow, remainingMs);

    if (remainingMs > 0 || hasSentEnd) {
      return;
    }

    hasSentEnd = true;
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage({
      type: FOCUS_MESSAGE_TYPES.endFocusSession,
      sessionId: message.sessionId
    })
      .then(() => {
        releaseFocusBlocker();
        removeExistingOverlay();
      })
      .catch((error: unknown) => {
        setButtonsDisabled(shadow, false);
        setStatus(shadow, error instanceof Error ? error.message : "Не удалось завершить фокусировку");
      });
  };

  tick();
  focusNudgeState.countdownTimerId = window.setInterval(tick, 1000);
}

function buildOverlay(message: FocusOverlayMessage): HTMLDivElement {
  const copyVariant = getRandomCopyVariant();
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
      padding: 24px;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(6px);
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      pointer-events: auto;
      animation: overlay-fade-in 300ms ease-out both;
    }

    .panel {
      box-sizing: border-box;
      position: relative;
      width: min(100%, 448px);
      padding: 40px 32px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 16px;
      background: #ffffff;
      color: #030213;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.28);
      text-align: center;
      animation: panel-zoom-in 300ms ease-out both;
    }

    .close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: #717182;
      cursor: pointer;
      font: inherit;
      font-size: 24px;
      font-weight: 500;
      line-height: 1;
      padding: 0;
      transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease;
    }

    .close:hover:not(:disabled) {
      background: #e9ebef;
      color: #030213;
    }

    .image-wrap {
      display: flex;
      justify-content: center;
      margin: 0 0 24px;
    }

    .image {
      display: block;
      width: 160px;
      height: 160px;
      object-fit: contain;
    }

    .title {
      margin: 0 0 4px;
      color: #030213;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: 0;
      line-height: 1.15;
    }

    .site {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
      max-width: 100%;
      margin: 4px 0 32px;
      padding: 6px 12px;
      border-radius: 8px;
      background: #ececf0;
      color: #717182;
      font-size: 12px;
      font-weight: 400;
      line-height: 1.35;
    }

    .site-icon {
      position: relative;
      width: 14px;
      height: 14px;
      flex: 0 0 auto;
    }

    .site-icon::before {
      content: "";
      position: absolute;
      inset: 1px 2px;
      border: 1.5px solid #d97706;
      border-radius: 7px 7px 5px 5px;
      clip-path: polygon(50% 0, 100% 18%, 100% 62%, 50% 100%, 0 62%, 0 18%);
    }

    .site-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: grid;
      gap: 12px;
      width: 100%;
    }

    .button {
      box-sizing: border-box;
      width: 100%;
      min-height: 48px;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
      font: inherit;
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 0;
      line-height: 1.5;
      padding: 12px 16px;
      text-align: center;
      transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease;
    }

    .button:disabled,
    .close:disabled {
      cursor: default;
      opacity: 0.62;
    }

    .primary {
      background: #030213;
      color: #ffffff;
    }

    .primary:hover:not(:disabled) {
      background: rgba(3, 2, 19, 0.9);
    }

    .secondary {
      background: #ececf0;
      color: #030213;
    }

    .secondary:hover:not(:disabled) {
      background: rgba(236, 236, 240, 0.8);
    }

    .tertiary {
      min-height: 44px;
      background: transparent;
      color: #717182;
      font-size: 14px;
    }

    .tertiary:hover:not(:disabled) {
      background: #e9ebef;
      color: #030213;
    }

    .countdown {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      margin: 18px 0 0;
      color: #717182;
      font-size: 13px;
      line-height: 1.35;
    }

    .countdown-value {
      color: #030213;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0;
      line-height: 1;
    }

    .status {
      min-height: 18px;
      margin: 14px 0 0;
      color: #b42318;
      font-size: 13px;
      line-height: 1.45;
    }

    @keyframes overlay-fade-in {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @keyframes panel-zoom-in {
      from {
        opacity: 0;
        transform: scale(0.95);
      }

      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @media (max-width: 480px) {
      .panel {
        padding: 36px 24px 28px;
      }

      .title {
        font-size: 22px;
      }

    }
  `;

  const panel = document.createElement("section");
  panel.className = "panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "time-wise-focus-overlay-title");

  const closeButton = document.createElement("button");
  closeButton.className = "close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Закрыть вкладку");
  closeButton.addEventListener("click", () => {
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage({ type: FOCUS_MESSAGE_TYPES.closeCurrentTab })
      .catch((error: unknown) => {
        setButtonsDisabled(shadow, false);
        setStatus(shadow, error instanceof Error ? error.message : "Не удалось закрыть вкладку");
      });
  });

  const imageWrap = document.createElement("div");
  imageWrap.className = "image-wrap";

  const image = document.createElement("img");
  image.className = "image";
  image.src = getCeoImageUrl(copyVariant.imageFileName);
  image.alt = "Focus reminder";
  image.loading = "eager";
  image.decoding = "async";
  imageWrap.append(image);

  const title = document.createElement("h1");
  title.className = "title";
  title.id = "time-wise-focus-overlay-title";
  title.textContent = copyVariant.text;

  const site = document.createElement("div");
  site.className = "site";

  const siteIcon = document.createElement("span");
  siteIcon.className = "site-icon";
  siteIcon.setAttribute("aria-hidden", "true");

  const siteText = document.createElement("span");
  siteText.className = "site-text";
  siteText.textContent = message.host;
  site.append(siteIcon, siteText);

  const actions = document.createElement("div");
  actions.className = "actions";

  const leaveButton = document.createElement("button");
  leaveButton.className = "button primary";
  leaveButton.type = "button";
  leaveButton.textContent = "Уже ухожу";
  leaveButton.addEventListener("click", () => {
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage({ type: FOCUS_MESSAGE_TYPES.closeCurrentTab })
      .catch((error: unknown) => {
        setButtonsDisabled(shadow, false);
        setStatus(shadow, error instanceof Error ? error.message : "Не удалось закрыть вкладку");
      });
  });

  const workButton = document.createElement("button");
  workButton.className = "button secondary";
  workButton.type = "button";
  workButton.textContent = "Мне нужен этот сайт";
  workButton.addEventListener("click", () => {
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage({
      type: FOCUS_MESSAGE_TYPES.saveSiteRule,
      host: message.host,
      category: "work",
      excluded: false
    })
      .then(() => {
        releaseFocusBlocker();
        removeExistingOverlay();
      })
      .catch((error: unknown) => {
        setButtonsDisabled(shadow, false);
        setStatus(shadow, error instanceof Error ? error.message : "Не удалось сохранить правило для сайта");
      });
  });

  const disableFocusButton = document.createElement("button");
  disableFocusButton.className = "button tertiary";
  disableFocusButton.type = "button";
  disableFocusButton.textContent = "Отключить фокусировку";
  disableFocusButton.addEventListener("click", () => {
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage({
      type: FOCUS_MESSAGE_TYPES.endFocusSession,
      sessionId: message.sessionId
    })
      .then(() => {
        focusNudgeState.suppressedHosts.add(overlayKey(message));
        releaseFocusBlocker();
        removeExistingOverlay();
      })
      .catch((error: unknown) => {
        setButtonsDisabled(shadow, false);
        setStatus(shadow, error instanceof Error ? error.message : "Не удалось отключить фокусировку");
      });
  });

  const status = document.createElement("p");
  status.className = "status";
  status.setAttribute("role", "status");

  const countdown = document.createElement("div");
  countdown.className = "countdown";
  countdown.setAttribute("aria-live", "polite");

  const countdownLabel = document.createElement("span");
  countdownLabel.textContent = "Осталось";

  const countdownValue = document.createElement("strong");
  countdownValue.className = "countdown-value";
  countdownValue.textContent = formatRemainingTime(message.remainingMs);
  countdown.append(countdownLabel, countdownValue);

  actions.append(leaveButton, workButton, disableFocusButton);
  panel.append(closeButton, imageWrap, title, site, actions, countdown, status);
  shadow.append(style, panel);
  startOverlayCountdown(shadow, message);

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
  engageFocusBlocker();
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
