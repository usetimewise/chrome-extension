import { DEFAULT_RUNTIME_STATE } from "../../lib/constants.js";
import type { RuntimeState } from "../../lib/types.js";

export interface BackgroundRuntimeContext {
    runtimeState: RuntimeState;
    flushQueue: Promise<void>;
}

export function createBackgroundRuntimeContext(): BackgroundRuntimeContext {
    return {
        runtimeState: {
            ...DEFAULT_RUNTIME_STATE,
            focusNudgeNotifications: {
                ...DEFAULT_RUNTIME_STATE.focusNudgeNotifications,
                hosts: {},
            },
        },
        flushQueue: Promise.resolve(),
    };
}

export function setRuntimeState(
    context: BackgroundRuntimeContext,
    nextRuntimeState: RuntimeState,
): void {
    context.runtimeState = nextRuntimeState;
}
