export type FocusBlockerState = {
    contextInvalidated: boolean;
    evaluateTimerId: number | null;
    gateState: "pending" | "blocked" | "released";
    listenerInstalled: boolean;
    mediaObserver: MutationObserver | null;
    originalPlay: typeof HTMLMediaElement.prototype.play | null;
    routeListenerInstalled: boolean;
};

const stateHost = globalThis as typeof globalThis & {
    __timeWiseFocusBlockerState?: FocusBlockerState;
};

export const focusBlockerState: FocusBlockerState =
    stateHost.__timeWiseFocusBlockerState || {
        contextInvalidated: false,
        evaluateTimerId: null,
        gateState: "pending",
        listenerInstalled: false,
        mediaObserver: null,
        originalPlay: null,
        routeListenerInstalled: false,
    };

stateHost.__timeWiseFocusBlockerState = focusBlockerState;
