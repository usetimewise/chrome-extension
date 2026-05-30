import { buildHeaders, requestJSON } from "./client.js";
import type { SiteDecisionRequest, SiteDecisionResponse } from "../types.js";

export async function decideSite(
  baseUrl: string,
  deviceId: string,
  payload: SiteDecisionRequest
): Promise<SiteDecisionResponse> {
  return requestJSON<SiteDecisionResponse>(baseUrl, "/v1/sites/decision", {
    method: "POST",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}
