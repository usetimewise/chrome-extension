import { STORAGE_KEYS } from "../../lib/constants.js";
import type { UserPreferences } from "../../lib/types.js";
import { OVERLAY_ID } from "./constants.js";
import { focusNudgeState } from "./state.js";

function cleanupInvalidatedOverlay(): void {
    if (focusNudgeState.softDismissTimerId !== null) {
        window.clearTimeout(focusNudgeState.softDismissTimerId);
        focusNudgeState.softDismissTimerId = null;
    }

    document.getElementById(OVERLAY_ID)?.remove();
    focusNudgeState.activeOverlayKey = null;
}

export function sendBackgroundMessage<TResponse = unknown>(
    message: unknown,
): Promise<TResponse> {
    if (focusNudgeState.contextInvalidated) {
        return Promise.reject(new Error("Extension context invalidated."));
    }

    try {
        return chrome.runtime.sendMessage(message) as Promise<TResponse>;
    } catch (error) {
        if (
            error instanceof Error &&
            error.message.includes("Extension context invalidated")
        ) {
            focusNudgeState.contextInvalidated = true;
            cleanupInvalidatedOverlay();
        }
        return Promise.reject(error);
    }
}

export async function getStoredPreferences(): Promise<
    Partial<UserPreferences> | undefined
> {
    try {
        const values = await chrome.storage.local.get(STORAGE_KEYS.preferences);
        return values[STORAGE_KEYS.preferences] as
            | Partial<UserPreferences>
            | undefined;
    } catch {
        return undefined;
    }
}
