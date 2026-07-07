import { ENGAGE_EVENT, RELEASE_EVENT } from "./constants.js";
import { engageGate, evaluateCurrentPage } from "./evaluation.js";
import { releaseGate } from "./gate.js";
import { installRouteListeners } from "./route-listener.js";
import { focusBlockerState } from "./state.js";

if (!focusBlockerState.listenerInstalled) {
    window.addEventListener(ENGAGE_EVENT, engageGate);
    window.addEventListener(RELEASE_EVENT, releaseGate);
    focusBlockerState.listenerInstalled = true;
}

installRouteListeners();
void evaluateCurrentPage();
