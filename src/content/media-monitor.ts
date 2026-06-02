const MEDIA_MESSAGE_TYPES = {
  getMediaState: "GET_MEDIA_STATE",
  mediaStateUpdate: "MEDIA_STATE_UPDATE"
} as const;
const HEARTBEAT_MS = 15_000;

{
type MediaMonitorState = {
  contextInvalidated: boolean;
  heartbeatId: number | null;
  lastKnownState: boolean | null;
  listenerInstalled: boolean;
  observer: MutationObserver | null;
  trackedMedia: WeakSet<Element>;
};

const stateHost = globalThis as typeof globalThis & {
  __timeWiseMediaMonitorState?: MediaMonitorState;
};
const mediaMonitorState = stateHost.__timeWiseMediaMonitorState || {
  contextInvalidated: false,
  heartbeatId: null,
  lastKnownState: null,
  listenerInstalled: false,
  observer: null,
  trackedMedia: new WeakSet<Element>()
};
stateHost.__timeWiseMediaMonitorState = mediaMonitorState;

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
  if (mediaMonitorState.heartbeatId !== null) {
    clearInterval(mediaMonitorState.heartbeatId);
    mediaMonitorState.heartbeatId = null;
  }

  if (!mediaMonitorState.lastKnownState || mediaMonitorState.contextInvalidated) {
    return;
  }

  mediaMonitorState.heartbeatId = window.setInterval(() => {
    void safeSendRuntimeMessage({
      type: MEDIA_MESSAGE_TYPES.mediaStateUpdate,
      isPlayingMedia: true
    });
  }, HEARTBEAT_MS);
}

function notifyState(force = false): void {
  if (mediaMonitorState.contextInvalidated) {
    return;
  }

  const nextState = computeMediaState();
  if (!force && nextState === mediaMonitorState.lastKnownState) {
    return;
  }

  mediaMonitorState.lastKnownState = nextState;
  scheduleHeartbeat();
  void safeSendRuntimeMessage({
    type: MEDIA_MESSAGE_TYPES.mediaStateUpdate,
    isPlayingMedia: nextState
  });
}

function handleMediaSignal() {
  notifyState(false);
}

function attachListeners(element: Element): void {
  if (!(element instanceof HTMLMediaElement) || mediaMonitorState.trackedMedia.has(element)) {
    return;
  }

  mediaMonitorState.trackedMedia.add(element);
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
  if (mediaMonitorState.observer || mediaMonitorState.contextInvalidated) {
    return;
  }

  mediaMonitorState.observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        scanMediaTree(node);
      }
    }
    notifyState(false);
  });

  mediaMonitorState.observer.observe(document.documentElement || document, {
    childList: true,
    subtree: true
  });
}

function shutdownInvalidatedContext(): void {
  mediaMonitorState.contextInvalidated = true;
  if (mediaMonitorState.heartbeatId !== null) {
    clearInterval(mediaMonitorState.heartbeatId);
    mediaMonitorState.heartbeatId = null;
  }
  mediaMonitorState.observer?.disconnect();
  mediaMonitorState.observer = null;
}

async function safeSendRuntimeMessage(message: unknown): Promise<void> {
  if (mediaMonitorState.contextInvalidated) {
    return;
  }

  try {
    await chrome.runtime.sendMessage(message);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Extension context invalidated")) {
      shutdownInvalidatedContext();
    }
  }
}

if (!mediaMonitorState.listenerInstalled && !mediaMonitorState.contextInvalidated) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isGetMediaStateMessage(message)) {
      return false;
    }

    const isPlayingMedia = computeMediaState();
    if (isPlayingMedia !== mediaMonitorState.lastKnownState) {
      mediaMonitorState.lastKnownState = isPlayingMedia;
      scheduleHeartbeat();
    }
    sendResponse({ isPlayingMedia });
    return true;
  });
  mediaMonitorState.listenerInstalled = true;
}

scanMediaTree();
ensureObserver();
notifyState(true);
}
