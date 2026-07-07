import type { ContentShowFocusNudgeRequest } from "../../lib/messaging";

type ContentShowFocusNudgePayload<T> = T extends unknown
    ? Omit<T, "type">
    : never;

export type FocusOverlayMessage =
    ContentShowFocusNudgePayload<ContentShowFocusNudgeRequest>;

export type FocusOverlayBlockMessage = Extract<
    FocusOverlayMessage,
    { mode: "block" }
>;

export type FocusOverlayOfferMessage = Extract<
    FocusOverlayMessage,
    { mode: "offer" }
>;
