export const isDevDebugEnabled = import.meta.env?.VITE_TIMEWISE_DEV_DEBUG === "true";

type DebugPayload = Record<string, unknown>;

export function devDebugLog(event: string, payload: DebugPayload = {}): void {
  if (!isDevDebugEnabled) {
    return;
  }

  console.log(`[TimeWise][dev] ${event}`, payload);
}

export function devDebugWarn(event: string, payload: DebugPayload = {}): void {
  if (!isDevDebugEnabled) {
    return;
  }

  console.warn(`[TimeWise][dev] ${event}`, payload);
}
