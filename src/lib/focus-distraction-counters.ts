import type {
    FocusDistractionCounter,
    FocusDistractionCountersState,
    FocusSession,
    RuntimeState,
} from "./types.js";
import type { FocusCompanionScenarioId } from "./focus-companions/index.js";
import type { SiteBlockRule } from "./site-block-rules.js";
import { normalizeUrl } from "./urlDecision/normalizeUrl.js";

export type FocusBlockPresentation = "soft" | "strict";

export const FOCUS_DISTRACTION_COUNTER_RESET_AFTER_MS = 8 * 60 * 60 * 1000;
export const FOCUS_STRICT_BLOCK_AFTER_MS = 2 * 60 * 1000;
export const FOCUS_COMPANION_SCENARIO_THREE_AFTER_MS = 10 * 60 * 1000;
export const FOCUS_COMPANION_SCENARIO_FOUR_AFTER_MS = 30 * 60 * 1000;

export const EMPTY_FOCUS_DISTRACTION_COUNTERS: FocusDistractionCountersState = {
    sessionId: null,
    startedAt: null,
    lastDistractedAt: null,
    updatedAt: null,
    counters: {},
};

export function createEmptyFocusDistractionCounters(
    sessionId: string | null = null,
    now = Date.now(),
): FocusDistractionCountersState {
    return {
        sessionId,
        startedAt: sessionId ? now : null,
        lastDistractedAt: null,
        updatedAt: now,
        counters: {},
    };
}

export function activeFocusSession(
    sessions: FocusSession[] = [],
): FocusSession | null {
    return sessions.find((session) => session.status === "active") || null;
}

export function shouldResetFocusDistractionCounters(
    state: FocusDistractionCountersState,
    activeSession: FocusSession | null,
    now = Date.now(),
): boolean {
    if (!activeSession) {
        return (
            state.sessionId !== null || Object.keys(state.counters).length > 0
        );
    }

    if (state.sessionId !== activeSession.id) {
        return true;
    }

    return (
        typeof state.lastDistractedAt === "number" &&
        Number.isFinite(state.lastDistractedAt) &&
        now - state.lastDistractedAt >= FOCUS_DISTRACTION_COUNTER_RESET_AFTER_MS
    );
}

export function ensureFocusDistractionCounterSession(
    state: FocusDistractionCountersState,
    activeSession: FocusSession | null,
    now = Date.now(),
): FocusDistractionCountersState {
    if (shouldResetFocusDistractionCounters(state, activeSession, now)) {
        return createEmptyFocusDistractionCounters(
            activeSession?.id ?? null,
            now,
        );
    }

    if (!activeSession) {
        return state;
    }

    if (!state.startedAt || !state.updatedAt) {
        return {
            ...state,
            sessionId: activeSession.id,
            startedAt: state.startedAt ?? now,
            updatedAt: state.updatedAt ?? now,
        };
    }

    return state;
}

export function addFocusDistractionDuration(
    state: FocusDistractionCountersState,
    params: {
        rule: SiteBlockRule;
        url: string;
        host: string;
        durationMs: number;
        now?: number;
    },
): FocusDistractionCountersState {
    const durationMs = Math.max(0, Math.floor(params.durationMs));
    const now = params.now ?? Date.now();
    if (durationMs <= 0) {
        return state;
    }

    const previousCounter = state.counters[params.rule.id];
    const nextCounter: FocusDistractionCounter = {
        rule: {
            id: params.rule.id,
            pattern: params.rule.pattern,
            patternType: params.rule.patternType,
            category: params.rule.category,
            source: params.rule.source,
        },
        totalMs: Number(previousCounter?.totalMs || 0) + durationMs,
        lastUrl: params.url,
        lastHost: params.host,
        lastUpdatedAt: now,
    };

    return {
        ...state,
        lastDistractedAt: now,
        updatedAt: now,
        counters: {
            ...state.counters,
            [params.rule.id]: nextCounter,
        },
    };
}

export function resolveFocusBlockSeverity(
    counters: FocusDistractionCountersState["counters"],
): FocusBlockPresentation {
    const totalMs = getTotalFocusDistractionMs(counters);

    return totalMs >= FOCUS_STRICT_BLOCK_AFTER_MS ? "strict" : "soft";
}

export function resolveFocusBlockPresentation(params: {
    counters: FocusDistractionCountersState["counters"];
    currentUrl: string;
}): FocusBlockPresentation {
    const normalized = normalizeUrl(params.currentUrl);
    if (
        normalized?.domain === "example.com" &&
        normalized.pathSegments.length === 1
    ) {
        if (normalized.pathSegments[0] === "hard") {
            return "strict";
        }

        if (normalized.pathSegments[0] === "soft") {
            return "soft";
        }
    }

    return resolveFocusBlockSeverity(params.counters);
}

function isForcedExampleSoftUrl(rawUrl: string): boolean {
    const normalized = normalizeUrl(rawUrl);
    return (
        normalized?.domain === "example.com" &&
        normalized.pathSegments.length === 1 &&
        normalized.pathSegments[0] === "soft"
    );
}

export function resolveFocusCompanionScenario(
    counters: FocusDistractionCountersState["counters"],
): FocusCompanionScenarioId {
    const totalMs = getTotalFocusDistractionMs(counters);

    if (totalMs >= FOCUS_COMPANION_SCENARIO_FOUR_AFTER_MS) {
        return "4";
    }

    if (totalMs >= FOCUS_COMPANION_SCENARIO_THREE_AFTER_MS) {
        return "3";
    }

    return "2";
}

function getTotalFocusDistractionMs(
    counters: FocusDistractionCountersState["counters"],
): number {
    return Object.values(counters).reduce((sum, counter) => {
        const counterTotalMs = Number(counter.totalMs);
        return Number.isFinite(counterTotalMs) && counterTotalMs > 0
            ? sum + counterTotalMs
            : sum;
    }, 0);
}

export function shouldSuppressSoftFocusNudge(params: {
    notifications: RuntimeState["focusNudgeNotifications"];
    sessionId: string;
    currentUrl: string;
    presentation: FocusBlockPresentation;
}): boolean {
    if (isForcedExampleSoftUrl(params.currentUrl)) {
        return false;
    }

    return (
        params.presentation === "soft" &&
        params.notifications.sessionId === params.sessionId &&
        params.notifications.lastSoftUrl === params.currentUrl
    );
}

export function markFocusNudgeNotificationShown(params: {
    notifications: RuntimeState["focusNudgeNotifications"];
    sessionId: string;
    currentUrl: string;
    presentation: FocusBlockPresentation;
}): RuntimeState["focusNudgeNotifications"] {
    if (params.presentation !== "soft") {
        return params.notifications;
    }

    return {
        ...params.notifications,
        sessionId: params.sessionId,
        lastSoftUrl: params.currentUrl,
    };
}
