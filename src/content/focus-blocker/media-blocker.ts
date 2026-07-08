import { focusBlockerState } from "./state.js";

function blockMediaElement(element: Element): void {
    if (
        !(element instanceof HTMLMediaElement) ||
        focusBlockerState.gateState === "released"
    ) {
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

function scanMedia(
    root: ParentNode | Element | Document | DocumentFragment | Node = document,
): void {
    if (root instanceof HTMLMediaElement) {
        blockMediaElement(root);
    }

    const queryRoot =
        root instanceof Element ||
        root instanceof Document ||
        root instanceof DocumentFragment
            ? root
            : null;
    if (!queryRoot) {
        return;
    }

    queryRoot.querySelectorAll("video, audio").forEach(blockMediaElement);
}

export function installMediaBlocker(): void {
    if (!focusBlockerState.originalPlay) {
        focusBlockerState.originalPlay = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function blockedPlay(
            this: HTMLMediaElement,
        ): Promise<void> {
            const originalPlay = focusBlockerState.originalPlay;
            if (focusBlockerState.gateState === "released" || !originalPlay) {
                return originalPlay
                    ? originalPlay.call(this)
                    : Promise.resolve();
            }

            blockMediaElement(this);
            return Promise.reject(
                new DOMException(
                    "Blocked during active ZalipOff focus mode.",
                    "NotAllowedError",
                ),
            );
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
        focusBlockerState.mediaObserver.observe(
            document.documentElement || document,
            {
                childList: true,
                subtree: true,
            },
        );
    }
}

export function releaseMediaBlocker(): void {
    focusBlockerState.mediaObserver?.disconnect();
    focusBlockerState.mediaObserver = null;

    if (focusBlockerState.originalPlay) {
        HTMLMediaElement.prototype.play = focusBlockerState.originalPlay;
        focusBlockerState.originalPlay = null;
    }
}
