import type { MESSAGE_TYPES } from "../../lib/constants.js";
import { releaseGate } from "./gate.js";
import { focusBlockerState } from "./state.js";

export type FocusBlockerBlockedMessage = {
    type: typeof MESSAGE_TYPES.focusBlockerBlocked;
    sessionId: string;
    host: string;
    category: string;
    presentation: "soft" | "strict";
};

export async function sendBlockedMessage(
    message: FocusBlockerBlockedMessage,
): Promise<void> {
    if (focusBlockerState.contextInvalidated) {
        return;
    }

    try {
        await chrome.runtime.sendMessage(message);
    } catch (error) {
        if (
            error instanceof Error &&
            error.message.includes("Extension context invalidated")
        ) {
            focusBlockerState.contextInvalidated = true;
            releaseGate();
        }
    }
}
