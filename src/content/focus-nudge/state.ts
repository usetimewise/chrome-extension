export type FocusNudgeState = {
    activeOverlayKey: string | null;
    contextInvalidated: boolean;
    listenerInstalled: boolean;
    overlayRequestId: number;
    softDismissTimerId: number | null;
    suppressedHosts: Set<string>;
};

const stateHost = globalThis as typeof globalThis & {
    __timeWiseFocusNudgeState?: FocusNudgeState;
};

export const focusNudgeState: FocusNudgeState =
    stateHost.__timeWiseFocusNudgeState || {
        activeOverlayKey: null,
        contextInvalidated: false,
        listenerInstalled: false,
        overlayRequestId: 0,
        softDismissTimerId: null,
        suppressedHosts: new Set<string>(),
    };

stateHost.__timeWiseFocusNudgeState = focusNudgeState;
