const MEDIA_MESSAGE_TYPES = {
  getMediaState: "GET_MEDIA_STATE",
  mediaStateUpdate: "MEDIA_STATE_UPDATE"
} as const;
const HEARTBEAT_MS = 15_000;
const trackedMedia = new WeakSet();
let observer: MutationObserver | null = null;
let heartbeatId: number | null = null;
let lastKnownState: boolean | null = null;

function isGetMediaStateMessage(message: unknown): message is { type: typeof MEDIA_MESSAGE_TYPES.getMediaState } {
  return Boolean(message && typeof message === "object" && (message as Record<string, unknown>).type === MEDIA_MESSAGE_TYPES.getMediaState);
}

function isMediaPlaying(element: Element): boolean {
  if (!(element instanceof HTMLMediaElement)) {
    return false;
  }

  return !element.paused &&
    !element.ended &&
    element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    element.playbackRate !== 0;
}

function collectMediaElements(): HTMLMediaElement[] {
  return Array.from(document.querySelectorAll("video, audio"));
}

function computeMediaState(): boolean {
  return collectMediaElements().some(isMediaPlaying);
}

function scheduleHeartbeat(): void {
  if (heartbeatId !== null) {
    clearInterval(heartbeatId);
    heartbeatId = null;
  }

  if (!lastKnownState) {
    return;
  }

  heartbeatId = window.setInterval(() => {
    void chrome.runtime.sendMessage({
      type: MEDIA_MESSAGE_TYPES.mediaStateUpdate,
      isPlayingMedia: true
    }).catch(() => {});
  }, HEARTBEAT_MS);
}

function notifyState(force = false): void {
  const nextState = computeMediaState();
  if (!force && nextState === lastKnownState) {
    return;
  }

  lastKnownState = nextState;
  scheduleHeartbeat();
  void chrome.runtime.sendMessage({
    type: MEDIA_MESSAGE_TYPES.mediaStateUpdate,
    isPlayingMedia: nextState
  }).catch(() => {});
}

function handleMediaSignal() {
  notifyState(false);
}

function attachListeners(element: Element): void {
  if (!(element instanceof HTMLMediaElement) || trackedMedia.has(element)) {
    return;
  }

  trackedMedia.add(element);
  for (const eventName of [
    "play",
    "playing",
    "pause",
    "ended",
    "emptied",
    "waiting",
    "stalled",
    "ratechange",
    "volumechange"
  ]) {
    element.addEventListener(eventName, handleMediaSignal, { passive: true });
  }
}

function scanMediaTree(root: ParentNode | Element | Document | DocumentFragment | Node = document): void {
  if (!root) {
    return;
  }

  if (root instanceof HTMLMediaElement) {
    attachListeners(root);
  }

  const queryRoot = root instanceof Element || root instanceof Document || root instanceof DocumentFragment
    ? root
    : null;

  if (!queryRoot) {
    return;
  }

  for (const element of queryRoot.querySelectorAll("video, audio")) {
    attachListeners(element);
  }
}

function ensureObserver() {
  if (observer) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        scanMediaTree(node);
      }
    }
    notifyState(false);
  });

  observer.observe(document.documentElement || document, {
    childList: true,
    subtree: true
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isGetMediaStateMessage(message)) {
    return false;
  }

  const isPlayingMedia = computeMediaState();
  if (isPlayingMedia !== lastKnownState) {
    lastKnownState = isPlayingMedia;
    scheduleHeartbeat();
  }
  sendResponse({ isPlayingMedia });
  return true;
});

scanMediaTree();
ensureObserver();
notifyState(true);
