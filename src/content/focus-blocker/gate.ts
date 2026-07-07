import { BLOCKER_ID, BLOCKER_STYLE_ID } from "./constants.js";
import { releaseMediaBlocker } from "./media-blocker.js";
import { focusBlockerState } from "./state.js";

export function installGate(): void {
    if (document.getElementById(BLOCKER_ID)) {
        return;
    }

    const style = document.createElement("style");
    style.id = BLOCKER_STYLE_ID;
    style.textContent = `
    html.time-wise-focus-blocked,
    html.time-wise-focus-blocked body {
      overflow: hidden !important;
    }
  `;

    const blocker = document.createElement("div");
    blocker.id = BLOCKER_ID;
    blocker.setAttribute("role", "presentation");
    blocker.style.cssText = [
        "position: fixed",
        "inset: 0",
        "z-index: 2147483646",
        "background: rgba(0, 0, 0, 0.35)",
        "backdrop-filter: blur(4px)",
        "pointer-events: auto",
    ].join(";");

    document.documentElement.classList.add("time-wise-focus-blocked");
    document.documentElement.append(style, blocker);
}

export function releaseGate(): void {
    focusBlockerState.gateState = "released";
    document.documentElement.classList.remove("time-wise-focus-blocked");
    document.getElementById(BLOCKER_ID)?.remove();
    document.getElementById(BLOCKER_STYLE_ID)?.remove();
    releaseMediaBlocker();
}
