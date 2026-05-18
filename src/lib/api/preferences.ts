import { buildHeaders, requestJSON } from "./client.js";
import type { PreferencesResponse, UpdatePreferencesRequest } from "../types.js";

export async function pushPreferences(
  baseUrl: string,
  deviceId: string,
  payload: UpdatePreferencesRequest
): Promise<PreferencesResponse> {
  return requestJSON<PreferencesResponse>(baseUrl, "/v1/preferences", {
    method: "PUT",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}
