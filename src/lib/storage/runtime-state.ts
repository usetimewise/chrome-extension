import { DEFAULT_RUNTIME_STATE, STORAGE_KEYS } from "../constants.js";
import type { RuntimeState } from "../types.js";
import { getFromStorage, setInStorage } from "./client.js";

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
    }
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
