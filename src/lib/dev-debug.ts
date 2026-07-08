export const isDevDebugEnabled =
    import.meta.env?.VITE_ZALIPOFF_DEV_DEBUG === "true";

type DebugPayload = Record<string, unknown>;

export function devDebugLog(event: string, payload: DebugPayload = {}): void {
    if (!isDevDebugEnabled) {
        return;
    }

    console.log(`[ZalipOff][dev] ${event}`, payload);
}

export function devDebugWarn(event: string, payload: DebugPayload = {}): void {
    if (!isDevDebugEnabled) {
        return;
    }

    console.warn(`[ZalipOff][dev] ${event}`, payload);
}
