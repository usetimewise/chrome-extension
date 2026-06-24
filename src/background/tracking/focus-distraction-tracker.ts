import {
    activeFocusSession,
    addFocusDistractionDuration,
    ensureFocusDistractionCounterSession,
} from "../../lib/focus-distraction-counters.js";
import { getFocusSessions } from "../../lib/storage/focus-sessions.js";
import {
    getFocusDistractionCounters,
    saveFocusDistractionCounters,
} from "../../lib/storage/focus-distraction-counters.js";
import { saveRuntimeState } from "../../lib/storage/runtime-state.js";
import { getSettings } from "../../lib/storage/site-rules.js";
import { decideDistractionSite } from "../../lib/site-block-rules.js";
import { isTrackableUrl } from "../../lib/utils.js";
import type { FocusDistractionCountersState } from "../../lib/types.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";

type BrowserActivityState = {
    isWindowFocused: boolean;
    idleState: chrome.idle.IdleState;
};

const browserActivityState: BrowserActivityState = {
    isWindowFocused: true,
    idleState: "active",
};

function isBrowserActivityTrackable(): boolean {
    return (
        browserActivityState.isWindowFocused &&
        browserActivityState.idleState === "active"
    );
}

export function setFocusDistractionWindowFocused(
    isWindowFocused: boolean,
): void {
    browserActivityState.isWindowFocused = isWindowFocused;
}

export function setFocusDistractionIdleState(
    idleState: chrome.idle.IdleState,
): void {
    browserActivityState.idleState = idleState;
}

export async function syncFocusDistractionCounterSession(
    now = Date.now(),
): Promise<FocusDistractionCountersState> {
    const [sessions, state] = await Promise.all([
        getFocusSessions(),
        getFocusDistractionCounters(),
    ]);
    const nextState = ensureFocusDistractionCounterSession(
        state,
        activeFocusSession(sessions),
        now,
    );
    if (nextState !== state) {
        return saveFocusDistractionCounters(nextState);
    }

    return state;
}

export async function flushFocusDistractionTracking(
    context: BackgroundRuntimeContext,
    now = Date.now(),
): Promise<FocusDistractionCountersState> {
    const [sessions, settings, storedState] = await Promise.all([
        getFocusSessions(),
        getSettings(),
        getFocusDistractionCounters(),
    ]);
    const activeSession = activeFocusSession(sessions);
    const sessionState = ensureFocusDistractionCounterSession(
        storedState,
        activeSession,
        now,
    );
    const startedAt = context.runtimeState.currentHostStartedAt;
    if (startedAt) {
        context.runtimeState.currentHostStartedAt = now;
        await saveRuntimeState(context.runtimeState);
    }

    if (
        !activeSession ||
        !startedAt ||
        !isBrowserActivityTrackable() ||
        !isTrackableUrl(context.runtimeState.currentUrl)
    ) {
        return sessionState === storedState
            ? storedState
            : saveFocusDistractionCounters(sessionState);
    }

    const durationMs = now - startedAt;
    if (durationMs <= 0) {
        return sessionState === storedState
            ? storedState
            : saveFocusDistractionCounters(sessionState);
    }

    const decision = await decideDistractionSite(
        context.runtimeState.currentUrl,
        {
            siteRules: {
                excludedHosts: settings.excludedHosts,
                categoryOverrides: settings.categoryOverrides,
            },
            disabledDefaultBlockRuleIds: settings.disabledDefaultBlockRuleIds,
            apiBaseUrl: settings.apiBaseUrl,
            allowNetworkLookup: false,
        },
    );

    if (decision.action !== "distracting" || !decision.matchedRule) {
        return sessionState === storedState
            ? storedState
            : saveFocusDistractionCounters(sessionState);
    }

    return saveFocusDistractionCounters(
        addFocusDistractionDuration(sessionState, {
            rule: decision.matchedRule,
            url: context.runtimeState.currentUrl,
            host: decision.host,
            durationMs,
            now,
        }),
    );
}

export async function getDebugFocusDistractionCounters(
    context: BackgroundRuntimeContext,
): Promise<FocusDistractionCountersState> {
    await flushFocusDistractionTracking(context);
    return syncFocusDistractionCounterSession();
}
