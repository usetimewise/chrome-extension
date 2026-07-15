import {
    createFocusCompanionOverlayVariant,
    type FocusCompanionOverlayVariant,
    type FocusCompanionTheme,
} from "../../lib/focus-companions";
import {
    createTranslator,
    resolveLanguage,
    type AppLanguage,
    type Translator,
} from "../../lib/i18n";
import { createContentIcon } from "../icon-elements.js";
import {
    IS_SPEECH_BUBBLE_ENABLED,
    OVERLAY_ID,
} from "./constants.js";
import {
    FULLSCREEN_OVERLAY_STYLES,
    TOAST_OVERLAY_STYLES,
} from "./overlay-styles.js";
import { getStoredPreferences } from "./runtime.js";
import type {
    FocusOverlayBlockMessage,
    FocusOverlayMessage,
    FocusOverlayOfferMessage,
} from "./types.js";

export type OverlayViewCallbacks = {
    closeCurrentTab: (shadow: ShadowRoot, t: Translator) => void;
    closeSoftBlock: () => void;
    dismissFocusOffer: (
        shadow: ShadowRoot,
        message: FocusOverlayOfferMessage,
        action: "close" | "defer",
        t: Translator,
    ) => void;
    endCurrentFocusSession: (
        shadow: ShadowRoot,
        message: FocusOverlayBlockMessage,
        t: Translator,
    ) => void;
    startFocusFromOffer: (
        shadow: ShadowRoot,
        message: FocusOverlayOfferMessage,
        t: Translator,
    ) => void;
};

export type BuiltOverlay = {
    host: HTMLDivElement;
    shadow: ShadowRoot;
    t: Translator;
};

function createStyle(styles: string): HTMLStyleElement {
    const style = document.createElement("style");
    style.textContent = styles;
    return style;
}

function applyCompanionTheme(
    host: HTMLElement,
    theme: FocusCompanionTheme,
    panelBackgroundImageUrl: string,
): void {
    host.style.setProperty(
        "--companion-panel-background-image",
        `url("${panelBackgroundImageUrl}")`,
    );
    host.style.setProperty("--overlay-text", theme.overlayColors.text);
    host.style.setProperty(
        "--overlay-muted-text",
        theme.overlayColors.mutedText,
    );
    host.style.setProperty("--overlay-primary", theme.overlayColors.primary);
    host.style.setProperty(
        "--overlay-primary-hover",
        theme.overlayColors.primaryHover,
    );
    host.style.setProperty(
        "--overlay-primary-text",
        theme.overlayColors.primaryText,
    );
    host.style.setProperty(
        "--overlay-secondary-text",
        theme.overlayColors.secondaryText,
    );
    host.style.setProperty(
        "--overlay-secondary-border",
        theme.overlayColors.secondaryBorder,
    );
    host.style.setProperty(
        "--overlay-control-hover",
        theme.overlayColors.controlHover,
    );
    host.style.setProperty(
        "--overlay-danger-text",
        theme.overlayColors.dangerText,
    );
}

function appendVisual(
    container: HTMLElement,
    visual: FocusCompanionOverlayVariant["visual"],
    imageClassName: string,
    textClassName: string,
): void {
    if (visual.kind === "image") {
        const image = document.createElement("img");
        image.className = imageClassName;
        image.src = visual.src;
        image.alt = visual.alt;
        image.loading = "eager";
        image.decoding = "async";
        container.append(image);
        return;
    }

    const textVisual = document.createElement("div");
    textVisual.className =
        textClassName === "avatar"
            ? `avatar avatar-${visual.colorClass}`
            : textClassName;
    textVisual.setAttribute("aria-label", visual.label);
    textVisual.textContent = visual.text;
    container.append(textVisual);
}

function buildSiteBadge(host: string, iconSize: number): HTMLDivElement {
    const site = document.createElement("div");
    site.className = "site";

    const siteIcon = createContentIcon("shieldOff", {
        className: "site-icon",
        size: iconSize,
    });

    const siteText = document.createElement("span");
    siteText.className = "site-text";
    siteText.textContent = host;
    site.append(siteIcon, siteText);
    return site;
}

function buildTitleContent(title: HTMLElement): HTMLElement {
    if (!IS_SPEECH_BUBBLE_ENABLED) {
        return title;
    }

    const speech = document.createElement("div");
    speech.className = "speech";
    speech.append(title);
    return speech;
}

function buildToastOverlay(
    host: HTMLDivElement,
    shadow: ShadowRoot,
    message: FocusOverlayMessage,
    copyVariant: FocusCompanionOverlayVariant,
    t: Translator,
    callbacks: OverlayViewCallbacks,
): BuiltOverlay {
    const style = createStyle(TOAST_OVERLAY_STYLES);

    const toast = document.createElement("section");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    const progress = document.createElement("div");
    progress.className = "progress";
    progress.setAttribute("aria-hidden", "true");
    const progressValue = document.createElement("div");
    progressValue.className = "progress-value";
    progress.append(progressValue);

    const header = document.createElement("div");
    header.className = "header";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    if (copyVariant.visual.kind === "image") {
        const image = document.createElement("img");
        image.className = "thumb-image";
        image.src = copyVariant.visual.src;
        image.alt = "";
        image.loading = "eager";
        image.decoding = "async";
        thumb.append(image);
    } else {
        thumb.textContent = copyVariant.visual.text;
        thumb.setAttribute("aria-label", copyVariant.visual.label);
    }

    const content = document.createElement("div");
    content.className = "content";

    const topRow = document.createElement("div");
    topRow.className = "top-row";

    const copy = document.createElement("div");
    copy.className = "copy";

    const title = document.createElement("p");
    title.className = "title";
    title.textContent =
        message.mode === "offer" ? message.message : copyVariant.text;

    copy.append(buildTitleContent(title), buildSiteBadge(message.host, 12));

    const closeButton = document.createElement("button");
    closeButton.className = "close";
    closeButton.type = "button";
    closeButton.append(createContentIcon("close", { size: 16 }));
    closeButton.setAttribute("aria-label", t("nudge.closeOffer"));
    closeButton.addEventListener("click", () => {
        if (message.mode === "offer") {
            callbacks.dismissFocusOffer(shadow, message, "close", t);
            return;
        }

        callbacks.closeSoftBlock();
    });

    const actions = document.createElement("div");
    actions.className = "actions";

    if (message.mode === "offer") {
        const startButton = document.createElement("button");
        startButton.className = "button primary";
        startButton.type = "button";
        startButton.textContent = t("nudge.startFocus");
        startButton.addEventListener("click", () =>
            callbacks.startFocusFromOffer(shadow, message, t),
        );

        const laterButton = document.createElement("button");
        laterButton.className = "button secondary";
        laterButton.type = "button";
        laterButton.textContent = t("nudge.maybeLater");
        laterButton.addEventListener("click", () =>
            callbacks.dismissFocusOffer(shadow, message, "defer", t),
        );

        const status = document.createElement("p");
        status.className = "status";
        status.setAttribute("role", "status");

        actions.append(startButton, laterButton, status);
    } else {
        const leaveButton = document.createElement("button");
        leaveButton.className = "button primary";
        leaveButton.type = "button";
        leaveButton.textContent = t("nudge.leave");
        leaveButton.addEventListener("click", () =>
            callbacks.closeCurrentTab(shadow, t),
        );

        const disableFocusButton = document.createElement("button");
        disableFocusButton.className = "button tertiary";
        disableFocusButton.type = "button";
        disableFocusButton.textContent = t("nudge.disableFocus");
        disableFocusButton.addEventListener("click", () =>
            callbacks.endCurrentFocusSession(shadow, message, t),
        );

        const status = document.createElement("p");
        status.className = "status";
        status.setAttribute("role", "status");

        actions.append(leaveButton, disableFocusButton, status);
    }

    topRow.append(copy, closeButton);
    content.append(topRow, actions);
    header.append(thumb, content);
    toast.append(progress, header);
    shadow.append(style, toast);
    return { host, shadow, t };
}

function buildFullscreenOverlay(
    host: HTMLDivElement,
    shadow: ShadowRoot,
    message: FocusOverlayBlockMessage,
    copyVariant: FocusCompanionOverlayVariant,
    t: Translator,
    callbacks: OverlayViewCallbacks,
): BuiltOverlay {
    const style = createStyle(FULLSCREEN_OVERLAY_STYLES);

    const panel = document.createElement("section");
    panel.className = "panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "zalipoff-focus-overlay-title");

    const closeButton = document.createElement("button");
    closeButton.className = "close";
    closeButton.type = "button";
    closeButton.append(createContentIcon("close", { size: 18 }));
    closeButton.setAttribute("aria-label", t("nudge.closeTab"));
    closeButton.addEventListener("click", () =>
        callbacks.closeCurrentTab(shadow, t),
    );

    const imageWrap = document.createElement("div");
    imageWrap.className = "image-wrap";
    appendVisual(imageWrap, copyVariant.visual, "image", "avatar");

    const title = document.createElement("h1");
    title.className = "title";
    title.id = "zalipoff-focus-overlay-title";
    title.textContent = copyVariant.text;

    const actions = document.createElement("div");
    actions.className = "actions";

    const status = document.createElement("p");
    status.className = "status";
    status.setAttribute("role", "status");

    const leaveButton = document.createElement("button");
    leaveButton.className = "button primary";
    leaveButton.type = "button";
    leaveButton.textContent = t("nudge.leave");
    leaveButton.addEventListener("click", () =>
        callbacks.closeCurrentTab(shadow, t),
    );

    const disableFocusButton = document.createElement("button");
    disableFocusButton.className = "button tertiary";
    disableFocusButton.type = "button";
    disableFocusButton.textContent = t("nudge.disableFocus");
    disableFocusButton.addEventListener("click", () =>
        callbacks.endCurrentFocusSession(shadow, message, t),
    );

    actions.append(leaveButton, disableFocusButton);

    const panelContent = document.createElement("div");
    panelContent.className = "panel-content";
    panelContent.append(
        buildTitleContent(title),
        buildSiteBadge(message.host, 14),
        actions,
        status,
    );

    panel.append(closeButton, imageWrap, panelContent);
    shadow.append(style, panel);

    return { host, shadow, t };
}

export function buildOverlayFromVariant(
    message: FocusOverlayMessage,
    copyVariant: FocusCompanionOverlayVariant,
    language: AppLanguage,
    callbacks: OverlayViewCallbacks,
): BuiltOverlay {
    const t = createTranslator(language);
    const host = document.createElement("div");
    host.id = OVERLAY_ID;
    applyCompanionTheme(
        host,
        copyVariant.theme,
        copyVariant.panelBackgroundImageUrl,
    );

    const shadow = host.attachShadow({ mode: "open" });
    if (message.mode === "offer" || message.presentation === "soft") {
        return buildToastOverlay(host, shadow, message, copyVariant, t, callbacks);
    }

    return buildFullscreenOverlay(host, shadow, message, copyVariant, t, callbacks);
}

export async function buildOverlay(
    message: FocusOverlayMessage,
    callbacks: OverlayViewCallbacks,
): Promise<BuiltOverlay> {
    const preferences = await getStoredPreferences();
    const language: AppLanguage = resolveLanguage(preferences?.language);
    const copyVariant = createFocusCompanionOverlayVariant(
        preferences?.selectedCompanionId,
        {
            language,
            scenarioId: message.scenarioId,
            resolveAssetUrl: (path) => chrome.runtime.getURL(path),
        },
    );

    return buildOverlayFromVariant(message, copyVariant, language, callbacks);
}
