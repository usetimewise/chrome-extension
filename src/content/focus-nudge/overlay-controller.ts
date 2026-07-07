import type { Translator } from "../../lib/i18n";

import {
    closeCurrentTab,
    dismissFocusOffer,
    endCurrentFocusSession,
    startFocusFromOffer,
} from "./actions.js";
import {
    FOCUS_BLOCKER_ENGAGE_EVENT,
    FOCUS_BLOCKER_RELEASE_EVENT, TOAST_AUTO_DISMISS_MS,
    OVERLAY_ID,
} from "./constants.js";
import { buildOverlay, type OverlayViewCallbacks } from "./overlay-view.js";
import { focusNudgeState } from "./state.js";
import type {
    FocusOverlayBlockMessage,
    FocusOverlayMessage,
    FocusOverlayOfferMessage,
} from "./types.js";

function overlayKey(message: FocusOverlayMessage): string {
    return message.mode === "block"
        ? `${message.mode}:${message.presentation}:${message.sessionId}:${message.host}`
        : `${message.mode}:offer:${message.host}`;
}

export function removeExistingOverlay(): void {
    if (focusNudgeState.softDismissTimerId !== null) {
        window.clearTimeout(focusNudgeState.softDismissTimerId);
        focusNudgeState.softDismissTimerId = null;
    }

    document.getElementById(OVERLAY_ID)?.remove();
    focusNudgeState.activeOverlayKey = null;
}

function releaseFocusBlocker(): void {
    window.dispatchEvent(new CustomEvent(FOCUS_BLOCKER_RELEASE_EVENT));
}

function engageFocusBlocker(): void {
    window.dispatchEvent(new CustomEvent(FOCUS_BLOCKER_ENGAGE_EVENT));
}

function suppressOverlay(message: FocusOverlayMessage): void {
    focusNudgeState.suppressedHosts.add(overlayKey(message));
}

function buildLifecycle() {
    return {
        releaseFocusBlocker,
        removeExistingOverlay,
        suppressOverlay,
        showFocusOverlay,
    };
}

function buildViewCallbacks(): OverlayViewCallbacks {
    return {
        closeCurrentTab,
        closeSoftBlock: removeExistingOverlay,
        dismissFocusOffer: (
            shadow: ShadowRoot,
            message: FocusOverlayOfferMessage,
            action: "close" | "defer",
            t: Translator,
        ) => dismissFocusOffer(shadow, message, action, t, buildLifecycle()),
        endCurrentFocusSession: (
            shadow: ShadowRoot,
            message: FocusOverlayBlockMessage,
            t: Translator,
        ) => endCurrentFocusSession(shadow, message, t, buildLifecycle()),
        startFocusFromOffer: (
            shadow: ShadowRoot,
            message: FocusOverlayOfferMessage,
            t: Translator,
        ) => startFocusFromOffer(shadow, message, t, buildLifecycle()),
    };
}

function scheduleAutoDismiss(params: {
    key: string;
    message: FocusOverlayMessage;
    requestId: number;
    shadow: ShadowRoot;
    t: Translator;
}): void {
    if (
        params.message.mode !== "offer" &&
        params.message.presentation !== "soft"
    ) {
        return;
    }

    focusNudgeState.softDismissTimerId = window.setTimeout(() => {
        focusNudgeState.softDismissTimerId = null;
        if (
            focusNudgeState.overlayRequestId !== params.requestId ||
            focusNudgeState.activeOverlayKey !== params.key
        ) {
            return;
        }

        if (params.message.mode === "offer") {
            dismissFocusOffer(
                params.shadow,
                params.message,
                "defer",
                params.t,
                buildLifecycle(),
            );
            return;
        }

        removeExistingOverlay();
    }, TOAST_AUTO_DISMISS_MS);
}

export async function showFocusOverlay(
    message: FocusOverlayMessage,
): Promise<void> {
    const key = overlayKey(message);
    if (focusNudgeState.suppressedHosts.has(key)) {
        removeExistingOverlay();
        return;
    }

    if (
        focusNudgeState.activeOverlayKey === key &&
        document.getElementById(OVERLAY_ID)
    ) {
        return;
    }

    const requestId = focusNudgeState.overlayRequestId + 1;
    focusNudgeState.overlayRequestId = requestId;
    removeExistingOverlay();
    focusNudgeState.activeOverlayKey = key;
    if (message.mode === "offer" || message.presentation === "soft") {
        releaseFocusBlocker();
    } else {
        engageFocusBlocker();
    }
    const overlay = await buildOverlay(message, buildViewCallbacks());
    if (
        focusNudgeState.overlayRequestId !== requestId ||
        focusNudgeState.activeOverlayKey !== key
    ) {
        overlay.host.remove();
        return;
    }

    document.getElementById(OVERLAY_ID)?.remove();
    document.documentElement.append(overlay.host);
    scheduleAutoDismiss({
        key,
        message,
        requestId,
        shadow: overlay.shadow,
        t: overlay.t,
    });
}
