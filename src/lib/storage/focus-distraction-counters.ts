import { STORAGE_KEYS } from "../constants.js";
import {
    EMPTY_FOCUS_DISTRACTION_COUNTERS,
    createEmptyFocusDistractionCounters,
} from "../focus-distraction-counters.js";
import type { FocusDistractionCountersState } from "../types.js";
import { getFromStorage, setInStorage } from "./client.js";

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function normalizeCountersState(
    value: FocusDistractionCountersState | null,
): FocusDistractionCountersState {
    if (!value || typeof value !== "object") {
        return { ...EMPTY_FOCUS_DISTRACTION_COUNTERS, counters: {} };
    }

    return {
        sessionId: typeof value.sessionId === "string" ? value.sessionId : null,
        startedAt: isFiniteNumber(value.startedAt) ? value.startedAt : null,
        lastDistractedAt: isFiniteNumber(value.lastDistractedAt)
            ? value.lastDistractedAt
            : null,
        updatedAt: isFiniteNumber(value.updatedAt) ? value.updatedAt : null,
        counters: { ...(value.counters || {}) },
    };
}

export async function getFocusDistractionCounters(): Promise<FocusDistractionCountersState> {
    return normalizeCountersState(
        await getFromStorage<FocusDistractionCountersState | null>(
            STORAGE_KEYS.focusDistractionCounters,
            null,
        ),
    );
}

export async function saveFocusDistractionCounters(
    state: FocusDistractionCountersState,
): Promise<FocusDistractionCountersState> {
    return setInStorage(
        STORAGE_KEYS.focusDistractionCounters,
        normalizeCountersState(state),
    );
}

export async function resetFocusDistractionCounters(
    sessionId: string | null = null,
    now = Date.now(),
): Promise<FocusDistractionCountersState> {
    return saveFocusDistractionCounters(
        createEmptyFocusDistractionCounters(sessionId, now),
    );
}
