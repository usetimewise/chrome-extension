import { STORAGE_KEYS } from "../constants.js";
import { retainTrackingTransitions } from "../tracking-diagnostics.js";
import type { TrackingTransition } from "../types.js";
import { getFromStorage, setInStorage } from "./client.js";

export async function getTrackingTransitions(): Promise<TrackingTransition[]> {
  return getFromStorage<TrackingTransition[]>(STORAGE_KEYS.trackingTransitions, []);
}

export async function appendTrackingTransition(transition: TrackingTransition): Promise<TrackingTransition[]> {
  const transitions = await getTrackingTransitions();
  const retained = retainTrackingTransitions([...transitions, transition]);
  await setInStorage(STORAGE_KEYS.trackingTransitions, retained);
  return retained;
}
