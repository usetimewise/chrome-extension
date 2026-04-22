const MESSAGE_TYPES = {
  getMediaState: "GET_MEDIA_STATE",
  mediaStateUpdate: "MEDIA_STATE_UPDATE"
};

const HEARTBEAT_MS = 15_000;
const trackedMedia = new WeakSet();
let observer = null;
let heartbeatId = null;
let lastKnownState = null;

function isMediaPlaying(element) {
  if (!(element instanceof HTMLMediaElement)) {
    return false;
  }

  return !element.paused &&
    !element.ended &&
    element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    element.playbackRate !== 0;
}

function collectMediaElements() {
  return Array.from(document.querySelectorAll("video, audio"));
}

function computeMediaState() {
  return collectMediaElements().some(isMediaPlaying);
}

function scheduleHeartbeat() {
  if (heartbeatId !== null) {
    clearInterval(heartbeatId);
    heartbeatId = null;
  }

  if (!lastKnownState) {
    return;
  }

  heartbeatId = window.setInterval(() => {
    void chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.mediaStateUpdate,
      isPlayingMedia: true
    }).catch(() => {});
  }, HEARTBEAT_MS);
}

function notifyState(force = false) {
  const nextState = computeMediaState();
  if (!force && nextState === lastKnownState) {
    return;
  }

  lastKnownState = nextState;
  scheduleHeartbeat();
  void chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.mediaStateUpdate,
    isPlayingMedia: nextState
  }).catch(() => {});
}

function handleMediaSignal() {
  notifyState(false);
}

function attachListeners(element) {
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

function scanMediaTree(root = document) {
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
  if (message?.type !== MESSAGE_TYPES.getMediaState) {
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
