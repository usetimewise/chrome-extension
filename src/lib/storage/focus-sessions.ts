import { STORAGE_KEYS } from "../constants.js";
import type { FocusSession } from "../types.js";
import { getFromStorage, setInStorage } from "./client.js";

export async function getFocusSessions(): Promise<FocusSession[]> {
    return getFromStorage<FocusSession[]>(STORAGE_KEYS.focusSessions, []);
}

export async function saveFocusSessions(
    sessions: FocusSession[],
): Promise<FocusSession[]> {
    return setInStorage(STORAGE_KEYS.focusSessions, sessions);
}
