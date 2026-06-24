import type {
    FocusDistractionCounter,
    FocusDistractionCountersState,
    FocusSession,
    RuntimeState,
} from "./types.js";
import type { SiteBlockRule } from "./site-block-rules.js";

export const FOCUS_DISTRACTION_COUNTER_RESET_AFTER_MS = 8 * 60 * 60 * 1000;
export const FOCUS_STRICT_BLOCK_AFTER_MS = 2 * 60 * 1000;

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
): "soft" | "strict" {
    const totalMs = Object.values(counters).reduce((sum, counter) => {
        const counterTotalMs = Number(counter.totalMs);
        return Number.isFinite(counterTotalMs) && counterTotalMs > 0
            ? sum + counterTotalMs
            : sum;
    }, 0);

    return totalMs >= FOCUS_STRICT_BLOCK_AFTER_MS ? "strict" : "soft";
}

export function shouldSuppressSoftFocusNudge(params: {
    notifications: RuntimeState["focusNudgeNotifications"];
    sessionId: string;
    currentUrl: string;
    presentation: "soft" | "strict";
}): boolean {
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
    presentation: "soft" | "strict";
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
