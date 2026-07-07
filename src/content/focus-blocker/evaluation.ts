import { MESSAGE_TYPES } from "../../lib/constants.js";
import { determineEarlyFocusBlock } from "../../lib/early-focus-block.js";
import { installGate, releaseGate } from "./gate.js";
import { sendBlockedMessage } from "./messaging.js";
import { installMediaBlocker } from "./media-blocker.js";
import { readFocusBlockerStorage } from "./storage.js";
import { focusBlockerState } from "./state.js";

export function engageGate(): void {
    focusBlockerState.gateState = "pending";
    installGate();
    installMediaBlocker();
}

export async function evaluateCurrentPage(): Promise<void> {
    try {
        const {
            sessions,
            siteRules,
            disabledDefaultBlockRuleIds,
            focusDistractionCounters,
        } = await readFocusBlockerStorage();
        const decision = await determineEarlyFocusBlock(
            window.location.href,
            sessions,
            siteRules,
            disabledDefaultBlockRuleIds,
            focusDistractionCounters,
        );
        if (decision.action !== "block") {
            releaseGate();
            return;
        }

        if (decision.severity === "strict") {
            focusBlockerState.gateState = "blocked";
            installGate();
            installMediaBlocker();
        } else {
            releaseGate();
        }

        await sendBlockedMessage({
            type: MESSAGE_TYPES.focusBlockerBlocked,
            sessionId: decision.sessionId,
            host: decision.host,
            category: decision.category,
            presentation: decision.severity,
        });
    } catch {
        releaseGate();
    }
}
