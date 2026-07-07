import { MESSAGE_TYPES } from "../../lib/constants.js";
import type { Translator } from "../../lib/i18n";
import { setButtonsDisabled, setStatus } from "./dom-state.js";
import { sendBackgroundMessage } from "./runtime.js";
import type {
    FocusOverlayBlockMessage,
    FocusOverlayMessage,
    FocusOverlayOfferMessage,
} from "./types.js";

type FocusSessionStartResponse = {
    ok: true;
    session: { id: string };
};

type OverlayLifecycle = {
    releaseFocusBlocker: () => void;
    removeExistingOverlay: () => void;
    suppressOverlay: (message: FocusOverlayMessage) => void;
    showFocusOverlay: (message: FocusOverlayMessage) => Promise<void>;
};

export function closeCurrentTab(shadow: ShadowRoot, t: Translator): void {
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage({
        type: MESSAGE_TYPES.closeCurrentTab,
    }).catch((error: unknown) => {
        setButtonsDisabled(shadow, false);
        setStatus(
            shadow,
            error instanceof Error ? error.message : t("nudge.closeTabError"),
        );
    });
}

export function endCurrentFocusSession(
    shadow: ShadowRoot,
    message: FocusOverlayBlockMessage,
    t: Translator,
    lifecycle: OverlayLifecycle,
): void {
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage({
        type: MESSAGE_TYPES.endFocusSession,
        sessionId: message.sessionId,
    })
        .then(() => {
            lifecycle.suppressOverlay(message);
            lifecycle.releaseFocusBlocker();
            lifecycle.removeExistingOverlay();
        })
        .catch((error: unknown) => {
            setButtonsDisabled(shadow, false);
            setStatus(
                shadow,
                error instanceof Error
                    ? error.message
                    : t("nudge.endFocusError"),
            );
        });
}

export function dismissFocusOffer(
    shadow: ShadowRoot,
    message: FocusOverlayOfferMessage,
    action: "close" | "defer",
    t: Translator,
    lifecycle: Pick<
        OverlayLifecycle,
        "releaseFocusBlocker" | "removeExistingOverlay"
    >,
): void {
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage({
        type: MESSAGE_TYPES.dismissFocusOffer,
        action,
        host: message.host,
    })
        .then(() => {
            lifecycle.releaseFocusBlocker();
            lifecycle.removeExistingOverlay();
        })
        .catch((error: unknown) => {
            setButtonsDisabled(shadow, false);
            setStatus(
                shadow,
                error instanceof Error
                    ? error.message
                    : t("nudge.dismissOfferError"),
            );
        });
}

export function startFocusFromOffer(
    shadow: ShadowRoot,
    message: FocusOverlayOfferMessage,
    t: Translator,
    lifecycle: Pick<OverlayLifecycle, "showFocusOverlay">,
): void {
    setButtonsDisabled(shadow, true);
    void sendBackgroundMessage<FocusSessionStartResponse>({
        type: MESSAGE_TYPES.startFocusSession,
    })
        .then((response) =>
            lifecycle.showFocusOverlay({
                mode: "block",
                sessionId: response.session.id,
                message: t("nudge.message"),
                host: message.host,
                category: message.category,
                presentation: "soft",
            }),
        )
        .catch((error: unknown) => {
            setButtonsDisabled(shadow, false);
            setStatus(
                shadow,
                error instanceof Error
                    ? error.message
                    : t("nudge.startFocusError"),
            );
        });
}
