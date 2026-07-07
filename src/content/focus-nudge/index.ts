import { MESSAGE_TYPES } from "../../lib/constants.js";
import { isContentRequest } from "../../lib/messaging";
import { showFocusOverlay } from "./overlay-controller.js";
import { focusNudgeState } from "./state.js";
import type { FocusOverlayMessage } from "./types.js";

if (!focusNudgeState.listenerInstalled && !focusNudgeState.contextInvalidated) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (
            !isContentRequest(message) ||
            message.type !== MESSAGE_TYPES.showFocusNudge
        ) {
            return false;
        }

        const overlayMessage: FocusOverlayMessage =
            message.mode === "block"
                ? {
                      mode: "block",
                      sessionId: message.sessionId,
                      message: message.message,
                      host: message.host,
                      category: message.category,
                      presentation: message.presentation,
                      scenarioId: message.scenarioId,
                  }
                : {
                      mode: "offer",
                      message: message.message,
                      host: message.host,
                      category: message.category,
                      scenarioId: message.scenarioId,
                  };

        void showFocusOverlay(overlayMessage)
            .then(() => sendResponse({ ok: true }))
            .catch(() => sendResponse({ ok: false }));
        return true;
    });
    focusNudgeState.listenerInstalled = true;
}
