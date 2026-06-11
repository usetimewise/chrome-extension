import { MESSAGE_TYPES, STORAGE_KEYS } from "../lib/constants.js";
import { determineEarlyFocusBlock } from "../lib/early-focus-block.js";
import { buildEffectiveSiteRules } from "../lib/storage/preferences.js";
import type { FocusSession, SiteRuleState, UserPreferences } from "../lib/types.js";

const BLOCKER_ID = "time-wise-focus-blocker";
const BLOCKER_STYLE_ID = "time-wise-focus-blocker-style";
const ENGAGE_EVENT = "time-wise-focus-blocker-engage";
const RELEASE_EVENT = "time-wise-focus-blocker-release";

type FocusBlockerState = {
  contextInvalidated: boolean;
  evaluateTimerId: number | null;
  gateState: "pending" | "blocked" | "released";
  listenerInstalled: boolean;
  mediaObserver: MutationObserver | null;
  originalPlay: typeof HTMLMediaElement.prototype.play | null;
  routeListenerInstalled: boolean;
};

type FocusBlockerBlockedMessage = {
  type: typeof MESSAGE_TYPES.focusBlockerBlocked;
  sessionId: string;
  host: string;
  category: string;
};

const stateHost = globalThis as typeof globalThis & {
  __timeWiseFocusBlockerState?: FocusBlockerState;
};
const focusBlockerState = stateHost.__timeWiseFocusBlockerState || {
  contextInvalidated: false,
  evaluateTimerId: null,
  gateState: "pending",
  listenerInstalled: false,
  mediaObserver: null,
  originalPlay: null,
  routeListenerInstalled: false
};
stateHost.__timeWiseFocusBlockerState = focusBlockerState;

function engageGate(): void {
  focusBlockerState.gateState = "pending";
  installGate();
  installMediaBlocker();
}

function installGate(): void {
  if (document.getElementById(BLOCKER_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = BLOCKER_STYLE_ID;
  style.textContent = `
    html.time-wise-focus-blocked,
    html.time-wise-focus-blocked body {
      overflow: hidden !important;
    }
  `;

  const blocker = document.createElement("div");
  blocker.id = BLOCKER_ID;
  blocker.setAttribute("role", "presentation");
  blocker.style.cssText = [
    "position: fixed",
    "inset: 0",
    "z-index: 2147483646",
    "background: rgba(0, 0, 0, 0.35)",
    "backdrop-filter: blur(4px)",
    "pointer-events: auto"
  ].join(";");

  document.documentElement.classList.add("time-wise-focus-blocked");
  document.documentElement.append(style, blocker);
}

function releaseGate(): void {
  focusBlockerState.gateState = "released";
  document.documentElement.classList.remove("time-wise-focus-blocked");
  document.getElementById(BLOCKER_ID)?.remove();
  document.getElementById(BLOCKER_STYLE_ID)?.remove();
  focusBlockerState.mediaObserver?.disconnect();
  focusBlockerState.mediaObserver = null;

  if (focusBlockerState.originalPlay) {
    HTMLMediaElement.prototype.play = focusBlockerState.originalPlay;
    focusBlockerState.originalPlay = null;
  }
}

function blockMediaElement(element: Element): void {
  if (!(element instanceof HTMLMediaElement) || focusBlockerState.gateState === "released") {
    return;
  }

  element.muted = true;
  element.defaultMuted = true;
  element.autoplay = false;
  try {
    element.pause();
  } catch {
    // Some pages detach media elements while observers are running.
  }
}

function scanMedia(root: ParentNode | Element | Document | DocumentFragment | Node = document): void {
  if (root instanceof HTMLMediaElement) {
    blockMediaElement(root);
  }

  const queryRoot = root instanceof Element || root instanceof Document || root instanceof DocumentFragment
    ? root
    : null;
  if (!queryRoot) {
    return;
  }

  queryRoot.querySelectorAll("video, audio").forEach(blockMediaElement);
}

function installMediaBlocker(): void {
  if (!focusBlockerState.originalPlay) {
    focusBlockerState.originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function blockedPlay(this: HTMLMediaElement): Promise<void> {
      const originalPlay = focusBlockerState.originalPlay;
      if (focusBlockerState.gateState === "released" || !originalPlay) {
        return originalPlay ? originalPlay.call(this) : Promise.resolve();
      }

      blockMediaElement(this);
      return Promise.reject(new DOMException("Blocked during active Time Wise focus mode.", "NotAllowedError"));
    };
  }

  scanMedia();
  if (!focusBlockerState.mediaObserver) {
    focusBlockerState.mediaObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(scanMedia);
      }
      scanMedia();
    });
    focusBlockerState.mediaObserver.observe(document.documentElement || document, {
      childList: true,
      subtree: true
    });
  }
}

async function readStorage(): Promise<{
  sessions: FocusSession[];
  siteRules: SiteRuleState | null;
  disabledDefaultBlockRuleIds: string[];
}> {
  const values = await chrome.storage.local.get([
    STORAGE_KEYS.focusSessions,
    STORAGE_KEYS.preferences,
    STORAGE_KEYS.siteRules
  ]);
  const storedSiteRules = values[STORAGE_KEYS.siteRules] as SiteRuleState | null || null;
  const preferences = values[STORAGE_KEYS.preferences] as UserPreferences | null || null;

  return {
    sessions: Array.isArray(values[STORAGE_KEYS.focusSessions])
      ? values[STORAGE_KEYS.focusSessions] as FocusSession[]
      : [],
    siteRules: buildEffectiveSiteRules(storedSiteRules, preferences),
    disabledDefaultBlockRuleIds: Array.isArray(preferences?.disabledDefaultBlockRuleIds)
      ? preferences.disabledDefaultBlockRuleIds
      : []
  };
}

async function sendBlockedMessage(message: FocusBlockerBlockedMessage): Promise<void> {
  if (focusBlockerState.contextInvalidated) {
    return;
  }

  try {
    await chrome.runtime.sendMessage(message);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Extension context invalidated")) {
      focusBlockerState.contextInvalidated = true;
      releaseGate();
    }
  }
}

async function evaluateCurrentPage(): Promise<void> {
  try {
    const { sessions, siteRules, disabledDefaultBlockRuleIds } = await readStorage();
    const decision = await determineEarlyFocusBlock(
      window.location.href,
      sessions,
      siteRules,
      disabledDefaultBlockRuleIds
    );
    if (decision.action !== "block") {
      releaseGate();
      return;
    }

    focusBlockerState.gateState = "blocked";
    installGate();
    installMediaBlocker();
    await sendBlockedMessage({
      type: MESSAGE_TYPES.focusBlockerBlocked,
      sessionId: decision.sessionId,
      host: decision.host,
      category: decision.category
    });
  } catch {
    releaseGate();
  }
}

function scheduleEvaluation(): void {
  if (focusBlockerState.evaluateTimerId !== null) {
    window.clearTimeout(focusBlockerState.evaluateTimerId);
  }
  engageGate();
  focusBlockerState.evaluateTimerId = window.setTimeout(() => {
    focusBlockerState.evaluateTimerId = null;
    void evaluateCurrentPage();
  }, 0);
}

function installRouteListeners(): void {
  if (focusBlockerState.routeListenerInstalled) {
    return;
  }

  const originalPushState = history.pushState;
  history.pushState = function timeWisePushState(...args): void {
    originalPushState.apply(this, args);
    scheduleEvaluation();
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function timeWiseReplaceState(...args): void {
    originalReplaceState.apply(this, args);
    scheduleEvaluation();
  };

  window.addEventListener("popstate", scheduleEvaluation);
  window.addEventListener("hashchange", scheduleEvaluation);
  focusBlockerState.routeListenerInstalled = true;
}

if (!focusBlockerState.listenerInstalled) {
  window.addEventListener(ENGAGE_EVENT, engageGate);
  window.addEventListener(RELEASE_EVENT, releaseGate);
  focusBlockerState.listenerInstalled = true;
}

installRouteListeners();
engageGate();
void evaluateCurrentPage();
