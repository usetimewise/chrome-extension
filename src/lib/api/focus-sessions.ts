import { buildHeaders, requestJSON } from "./client.js";
import type { FocusSessionAction, FocusSessionRequest, FocusSessionResponse } from "../types.js";

export async function startFocusSession(
  baseUrl: string,
  deviceId: string,
  payload: FocusSessionRequest
): Promise<FocusSessionResponse> {
  return requestJSON<FocusSessionResponse>(baseUrl, "/v1/focus-sessions", {
    method: "POST",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}

export async function updateFocusSessionState(
  baseUrl: string,
  deviceId: string,
  sessionId: string,
  action: FocusSessionAction
): Promise<FocusSessionResponse> {
  return requestJSON<FocusSessionResponse>(
    baseUrl,
    `/v1/focus-sessions/${encodeURIComponent(sessionId)}/${encodeURIComponent(action)}`,
    {
      method: "POST",
      headers: buildHeaders(deviceId)
    }
  );
}
