import { evaluateCurrentPage } from "./evaluation.js";
import { focusBlockerState } from "./state.js";

function scheduleEvaluation(): void {
    if (focusBlockerState.evaluateTimerId !== null) {
        window.clearTimeout(focusBlockerState.evaluateTimerId);
    }
    focusBlockerState.evaluateTimerId = window.setTimeout(() => {
        focusBlockerState.evaluateTimerId = null;
        void evaluateCurrentPage();
    }, 0);
}

export function installRouteListeners(): void {
    if (focusBlockerState.routeListenerInstalled) {
        return;
    }

    const originalPushState = history.pushState;
    history.pushState = function zalipOffPushState(...args): void {
        originalPushState.apply(this, args);
        scheduleEvaluation();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function zalipOffReplaceState(...args): void {
        originalReplaceState.apply(this, args);
        scheduleEvaluation();
    };

    window.addEventListener("popstate", scheduleEvaluation);
    window.addEventListener("hashchange", scheduleEvaluation);
    focusBlockerState.routeListenerInstalled = true;
}
