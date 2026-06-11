import { DEFAULT_RUNTIME_STATE, STORAGE_KEYS } from "../constants.js";
import type { FocusOfferPromptEvent, RuntimeState } from "../types.js";
import { getFromStorage, setInStorage } from "./client.js";

function normalizeFocusOfferPromptEvents(value: unknown): FocusOfferPromptEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((event): event is FocusOfferPromptEvent => (
      Boolean(event) &&
      typeof event === "object" &&
      ["shown", "deferred", "closed", "started"].includes((event as FocusOfferPromptEvent).type) &&
      typeof (event as FocusOfferPromptEvent).at === "number" &&
      Number.isFinite((event as FocusOfferPromptEvent).at) &&
      typeof (event as FocusOfferPromptEvent).host === "string" &&
      (event as FocusOfferPromptEvent).host.length > 0
    ))
    .slice(-50);
}

export async function getRuntimeState(): Promise<RuntimeState> {
  const runtime = await getFromStorage<Partial<RuntimeState> | null>(STORAGE_KEYS.runtimeState, null);
  return {
    ...DEFAULT_RUNTIME_STATE,
    ...(runtime || {}),
    focusNudgeNotifications: {
      ...DEFAULT_RUNTIME_STATE.focusNudgeNotifications,
      ...(runtime?.focusNudgeNotifications || {}),
      hosts: {
        ...(runtime?.focusNudgeNotifications?.hosts || {})
      }
    },
    focusOfferPromptEvents: normalizeFocusOfferPromptEvents(runtime?.focusOfferPromptEvents)
  };
}

export async function saveRuntimeState(runtimePatch: Partial<RuntimeState>): Promise<RuntimeState> {
  const current = await getRuntimeState();
  const next: RuntimeState = {
    ...current,
    ...runtimePatch
  };
  return setInStorage(STORAGE_KEYS.runtimeState, next);
}
