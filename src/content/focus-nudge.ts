import { STORAGE_KEYS } from "../lib/constants.js";
import { createFocusCompanionOverlayVariant } from "../lib/focus-companions/index.js";
import {
  createTranslator,
  resolveLanguage,
  type AppLanguage,
  type Translator
} from "../lib/i18n/index.js";
import type { UserPreferences } from "../lib/types.js";
import { createContentIcon } from "./icon-elements.js";

type FocusOverlayMessage = {
  mode: "offer";
  message: string;
  host: string;
  category: string;
} | {
  mode: "block";
  sessionId: string;
  message: string;
  host: string;
  category: string;
  presentation: "soft" | "strict";
};

{
type FocusNudgeState = {
  activeOverlayKey: string | null;
  contextInvalidated: boolean;
  listenerInstalled: boolean;
  softDismissTimerId: number | null;
  suppressedHosts: Set<string>;
};

const FOCUS_MESSAGE_TYPES = {
  showFocusNudge: "SHOW_FOCUS_NUDGE",
  saveSiteRule: "SAVE_SITE_RULE",
  closeCurrentTab: "CLOSE_CURRENT_TAB",
  endFocusSession: "END_FOCUS_SESSION",
  startFocusSession: "START_FOCUS_SESSION",
  dismissFocusOffer: "DISMISS_FOCUS_OFFER"
} as const;
const OVERLAY_ID = "time-wise-focus-overlay";
const FOCUS_BLOCKER_ENGAGE_EVENT = "time-wise-focus-blocker-engage";
const FOCUS_BLOCKER_RELEASE_EVENT = "time-wise-focus-blocker-release";
const stateHost = globalThis as typeof globalThis & {
  __timeWiseFocusNudgeState?: FocusNudgeState;
};
const focusNudgeState = stateHost.__timeWiseFocusNudgeState || {
  activeOverlayKey: null,
  contextInvalidated: false,
  listenerInstalled: false,
  softDismissTimerId: null,
  suppressedHosts: new Set<string>()
};
stateHost.__timeWiseFocusNudgeState = focusNudgeState;

function isShowFocusNudgeMessage(message: unknown): message is FocusOverlayMessage & { type: typeof FOCUS_MESSAGE_TYPES.showFocusNudge } {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Record<string, unknown>;
  const hasBaseFields = candidate.type === FOCUS_MESSAGE_TYPES.showFocusNudge &&
    typeof candidate.message === "string" &&
    typeof candidate.host === "string" &&
    typeof candidate.category === "string";

  if (!hasBaseFields) {
    return false;
  }

  if (candidate.mode === "offer") {
    return true;
  }

  return candidate.mode === "block" &&
    typeof candidate.sessionId === "string" &&
    (candidate.presentation === "soft" || candidate.presentation === "strict");
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
  return message.mode === "block"
    ? `${message.mode}:${message.presentation}:${message.sessionId}:${message.host}`
    : `${message.mode}:offer:${message.host}`;
}

async function getStoredPreferences(): Promise<Partial<UserPreferences> | undefined> {
  try {
    const values = await chrome.storage.local.get(STORAGE_KEYS.preferences);
    return values[STORAGE_KEYS.preferences] as Partial<UserPreferences> | undefined;
  } catch {
    return undefined;
  }
}

function removeExistingOverlay(): void {
  if (focusNudgeState.softDismissTimerId !== null) {
    window.clearTimeout(focusNudgeState.softDismissTimerId);
    focusNudgeState.softDismissTimerId = null;
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

function closeCurrentTab(shadow: ShadowRoot, t: Translator): void {
  setButtonsDisabled(shadow, true);
  void sendBackgroundMessage({ type: FOCUS_MESSAGE_TYPES.closeCurrentTab })
    .catch((error: unknown) => {
      setButtonsDisabled(shadow, false);
      setStatus(shadow, error instanceof Error ? error.message : t("nudge.closeTabError"));
    });
}

function saveCurrentSiteAsWork(shadow: ShadowRoot, message: Extract<FocusOverlayMessage, { mode: "block" }>, t: Translator): void {
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
      setStatus(shadow, error instanceof Error ? error.message : t("nudge.saveRuleError"));
    });
}

function endCurrentFocusSession(shadow: ShadowRoot, message: Extract<FocusOverlayMessage, { mode: "block" }>, t: Translator): void {
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
      setStatus(shadow, error instanceof Error ? error.message : t("nudge.endFocusError"));
    });
}

async function buildOverlay(message: FocusOverlayMessage): Promise<HTMLDivElement> {
  const preferences = await getStoredPreferences();
  const language: AppLanguage = resolveLanguage(preferences?.language);
  const t = createTranslator(language);
  const copyVariant = createFocusCompanionOverlayVariant(preferences?.selectedCompanionId, {
    language,
    resolveAssetUrl: (path) => chrome.runtime.getURL(path)
  });
  const host = document.createElement("div");
  host.id = OVERLAY_ID;

  const shadow = host.attachShadow({ mode: "open" });
  if (message.mode === "block" && message.presentation === "soft") {
    focusNudgeState.softDismissTimerId = window.setTimeout(() => {
      removeExistingOverlay();
    }, 10_000);

    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 2147483647;
        width: min(288px, calc(100vw - 32px));
        box-sizing: border-box;
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        pointer-events: auto;
        animation: toast-in 220ms ease-out both;
      }

      .toast {
        position: relative;
        box-sizing: border-box;
        overflow: hidden;
        width: 100%;
        border: 1px solid rgba(3, 2, 19, 0.12);
        border-radius: 16px;
        background: #ffffff;
        color: #030213;
        box-shadow: 0 18px 42px rgba(3, 2, 19, 0.18);
      }

      .progress {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        overflow: hidden;
        background: #ececf0;
      }

      .progress-value {
        width: 100%;
        height: 100%;
        background: rgba(3, 2, 19, 0.4);
        transform-origin: left center;
        animation: progress-out 10000ms linear both;
      }

      .header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 16px 12px;
      }

      .thumb {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        overflow: hidden;
        border-radius: 12px;
        background: #ececf0;
        color: #030213;
        font-size: 18px;
        font-weight: 700;
        line-height: 1;
      }

      .thumb-image {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: top center;
      }

      .content {
        min-width: 0;
        flex: 1 1 auto;
        padding-top: 2px;
      }

      .title {
        margin: 0;
        color: #030213;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0;
        line-height: 1.35;
      }

      .site {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        margin-top: 5px;
        color: #717182;
        font-size: 12px;
        font-weight: 400;
        line-height: 1.35;
      }

      .site-icon {
        display: block;
        width: 14px;
        height: 14px;
        flex: 0 0 auto;
        color: #d97706;
      }

      .site-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .close {
        flex: 0 0 auto;
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: -3px -3px 0 0;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: #717182;
        cursor: pointer;
        padding: 0;
      }

      .close:hover:not(:disabled) {
        background: #e9ebef;
        color: #030213;
      }

      .actions {
        display: grid;
        gap: 6px;
        padding: 0 16px 16px;
      }

      .secondary-actions {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 6px;
      }

      .button {
        box-sizing: border-box;
        width: 100%;
        border: 0;
        border-radius: 8px;
        cursor: pointer;
        font: inherit;
        letter-spacing: 0;
        line-height: 1.35;
        transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease;
      }

      .button:disabled,
      .close:disabled {
        cursor: default;
        opacity: 0.62;
      }

      .primary {
        min-height: 36px;
        padding: 8px 12px;
        background: #030213;
        color: #ffffff;
        font-size: 14px;
        font-weight: 500;
      }

      .primary:hover:not(:disabled) {
        background: rgba(3, 2, 19, 0.9);
      }

      .secondary,
      .tertiary {
        min-height: 32px;
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 500;
      }

      .secondary {
        background: #ececf0;
        color: #030213;
      }

      .secondary:hover:not(:disabled),
      .tertiary:hover:not(:disabled) {
        background: #e9ebef;
        color: #030213;
      }

      .tertiary {
        background: transparent;
        color: #717182;
      }

      .status {
        min-height: 0;
        margin: 0;
        color: #b42318;
        font-size: 12px;
        line-height: 1.4;
      }

      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateX(40px) scale(0.96);
        }

        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      @keyframes progress-out {
        from {
          transform: scaleX(1);
        }

        to {
          transform: scaleX(0);
        }
      }
    `;

    const toast = document.createElement("section");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    const progress = document.createElement("div");
    progress.className = "progress";
    progress.setAttribute("aria-hidden", "true");
    const progressValue = document.createElement("div");
    progressValue.className = "progress-value";
    progress.append(progressValue);

    const header = document.createElement("div");
    header.className = "header";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    if (copyVariant.visual.kind === "image") {
      const image = document.createElement("img");
      image.className = "thumb-image";
      image.src = copyVariant.visual.src;
      image.alt = "";
      image.loading = "eager";
      image.decoding = "async";
      thumb.append(image);
    } else {
      thumb.textContent = copyVariant.visual.text;
      thumb.setAttribute("aria-label", copyVariant.visual.label);
    }

    const content = document.createElement("div");
    content.className = "content";

    const title = document.createElement("p");
    title.className = "title";
    title.textContent = copyVariant.text;

    const site = document.createElement("div");
    site.className = "site";
    const siteIcon = createContentIcon("site", { className: "site-icon", size: 14 });
    const siteText = document.createElement("span");
    siteText.className = "site-text";
    siteText.textContent = message.host;
    site.append(siteIcon, siteText);
    content.append(title, site);

    const closeButton = document.createElement("button");
    closeButton.className = "close";
    closeButton.type = "button";
    closeButton.append(createContentIcon("close", { size: 16 }));
    closeButton.setAttribute("aria-label", t("nudge.closeOffer"));
    closeButton.addEventListener("click", removeExistingOverlay);

    header.append(thumb, content, closeButton);

    const actions = document.createElement("div");
    actions.className = "actions";

    const leaveButton = document.createElement("button");
    leaveButton.className = "button primary";
    leaveButton.type = "button";
    leaveButton.textContent = t("nudge.leave");
    leaveButton.addEventListener("click", () => closeCurrentTab(shadow, t));

    const secondaryActions = document.createElement("div");
    secondaryActions.className = "secondary-actions";

    const workButton = document.createElement("button");
    workButton.className = "button secondary";
    workButton.type = "button";
    workButton.textContent = t("nudge.workSite");
    workButton.addEventListener("click", () => saveCurrentSiteAsWork(shadow, message, t));

    const disableFocusButton = document.createElement("button");
    disableFocusButton.className = "button tertiary";
    disableFocusButton.type = "button";
    disableFocusButton.textContent = t("nudge.disableFocus");
    disableFocusButton.addEventListener("click", () => endCurrentFocusSession(shadow, message, t));

    const status = document.createElement("p");
    status.className = "status";
    status.setAttribute("role", "status");

    secondaryActions.append(workButton, disableFocusButton);
    actions.append(leaveButton, secondaryActions, status);
    toast.append(progress, header, actions);
    shadow.append(style, toast);
    return host;
  }

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

    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 160px;
      height: 160px;
      border-radius: 16px;
      font-size: 64px;
      font-weight: 700;
      line-height: 1;
    }

    .avatar-violet { background: #f1edff; color: #6d28d9; }
    .avatar-blue { background: #eaf2ff; color: #1d4ed8; }
    .avatar-emerald { background: #e7f8ef; color: #047857; }
    .avatar-rose { background: #fff0f3; color: #be123c; }
    .avatar-stone { background: #f1f1ef; color: #57534e; }
    .avatar-cyan { background: #e8f8fb; color: #0e7490; }
    .avatar-amber { background: #fff7df; color: #b45309; }
    .avatar-green { background: #ebf8ed; color: #15803d; }
    .avatar-indigo { background: #eef2ff; color: #4338ca; }
    .avatar-gray { background: #f0f1f4; color: #4b5563; }

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
      display: block;
      width: 14px;
      height: 14px;
      flex: 0 0 auto;
      color: #d97706;
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
  closeButton.append(createContentIcon("close", { size: 18 }));
  closeButton.setAttribute("aria-label", message.mode === "offer" ? t("nudge.closeOffer") : t("nudge.closeTab"));
  closeButton.addEventListener("click", () => {
    setButtonsDisabled(shadow, true);
    if (message.mode === "offer") {
      void sendBackgroundMessage({
        type: FOCUS_MESSAGE_TYPES.dismissFocusOffer,
        action: "close",
        host: message.host
      })
        .then(() => {
          releaseFocusBlocker();
          removeExistingOverlay();
        })
        .catch((error: unknown) => {
          setButtonsDisabled(shadow, false);
          setStatus(shadow, error instanceof Error ? error.message : t("nudge.dismissOfferError"));
        });
      return;
    }

    void sendBackgroundMessage({ type: FOCUS_MESSAGE_TYPES.closeCurrentTab })
      .catch((error: unknown) => {
        setButtonsDisabled(shadow, false);
        setStatus(shadow, error instanceof Error ? error.message : t("nudge.closeTabError"));
      });
  });

  const imageWrap = document.createElement("div");
  imageWrap.className = "image-wrap";

  if (copyVariant.visual.kind === "image") {
    const image = document.createElement("img");
    image.className = "image";
    image.src = copyVariant.visual.src;
    image.alt = copyVariant.visual.alt;
    image.loading = "eager";
    image.decoding = "async";
    imageWrap.append(image);
  } else {
    const avatar = document.createElement("div");
    avatar.className = `avatar avatar-${copyVariant.visual.colorClass}`;
    avatar.setAttribute("aria-label", copyVariant.visual.label);
    avatar.textContent = copyVariant.visual.text;
    imageWrap.append(avatar);
  }

  const title = document.createElement("h1");
  title.className = "title";
  title.id = "time-wise-focus-overlay-title";
  title.textContent = message.mode === "offer" ? message.message : copyVariant.text;

  const site = document.createElement("div");
  site.className = "site";

  const siteIcon = createContentIcon("site", { className: "site-icon", size: 14 });

  const siteText = document.createElement("span");
  siteText.className = "site-text";
  siteText.textContent = message.host;
  site.append(siteIcon, siteText);

  const actions = document.createElement("div");
  actions.className = "actions";

  const status = document.createElement("p");
  status.className = "status";
  status.setAttribute("role", "status");

  if (message.mode === "offer") {
    const startButton = document.createElement("button");
    startButton.className = "button primary";
    startButton.type = "button";
    startButton.textContent = t("nudge.startFocus");
    startButton.addEventListener("click", () => {
      setButtonsDisabled(shadow, true);
      void sendBackgroundMessage<{ ok: true; session: { id: string } }>({ type: FOCUS_MESSAGE_TYPES.startFocusSession })
        .then((response) => showFocusOverlay({
          mode: "block",
          sessionId: response.session.id,
          message: t("nudge.message"),
          host: message.host,
          category: message.category,
          presentation: "strict"
        }))
        .catch((error: unknown) => {
          setButtonsDisabled(shadow, false);
          setStatus(shadow, error instanceof Error ? error.message : t("nudge.startFocusError"));
        });
    });

    const laterButton = document.createElement("button");
    laterButton.className = "button secondary";
    laterButton.type = "button";
    laterButton.textContent = t("nudge.maybeLater");
    laterButton.addEventListener("click", () => {
      setButtonsDisabled(shadow, true);
      void sendBackgroundMessage({
        type: FOCUS_MESSAGE_TYPES.dismissFocusOffer,
        action: "defer",
        host: message.host
      })
        .then(() => {
          releaseFocusBlocker();
          removeExistingOverlay();
        })
        .catch((error: unknown) => {
          setButtonsDisabled(shadow, false);
          setStatus(shadow, error instanceof Error ? error.message : t("nudge.dismissOfferError"));
        });
    });

    actions.append(startButton, laterButton);
    panel.append(closeButton, imageWrap, title, site, actions, status);
    shadow.append(style, panel);
    return host;
  }

  const leaveButton = document.createElement("button");
  leaveButton.className = "button primary";
  leaveButton.type = "button";
  leaveButton.textContent = t("nudge.leave");
  leaveButton.addEventListener("click", () => {
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage({ type: FOCUS_MESSAGE_TYPES.closeCurrentTab })
      .catch((error: unknown) => {
        setButtonsDisabled(shadow, false);
        setStatus(shadow, error instanceof Error ? error.message : t("nudge.closeTabError"));
      });
  });

  const workButton = document.createElement("button");
  workButton.className = "button secondary";
  workButton.type = "button";
  workButton.textContent = t("nudge.workSite");
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
        setStatus(shadow, error instanceof Error ? error.message : t("nudge.saveRuleError"));
      });
  });

  const disableFocusButton = document.createElement("button");
  disableFocusButton.className = "button tertiary";
  disableFocusButton.type = "button";
  disableFocusButton.textContent = t("nudge.disableFocus");
  disableFocusButton.addEventListener("click", () => {
    if (!message.sessionId) {
      return;
    }

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
        setStatus(shadow, error instanceof Error ? error.message : t("nudge.endFocusError"));
      });
  });

  actions.append(leaveButton, workButton, disableFocusButton);
  panel.append(closeButton, imageWrap, title, site, actions, status);
  shadow.append(style, panel);

  return host;
}

async function showFocusOverlay(message: FocusOverlayMessage): Promise<void> {
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
  if (message.mode === "block" && message.presentation === "soft") {
    releaseFocusBlocker();
  } else {
    engageFocusBlocker();
  }
  document.documentElement.append(await buildOverlay(message));
}

if (!focusNudgeState.listenerInstalled && !focusNudgeState.contextInvalidated) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isShowFocusNudgeMessage(message)) {
      return false;
    }

    void showFocusOverlay(message)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  });
  focusNudgeState.listenerInstalled = true;
}
}
