import { buildHeaders, requestJSON } from "./client.js";
import type { RegisterDeviceRequest, RegisterDeviceResponse } from "../types.js";

export async function registerDevice(
  baseUrl: string,
  payload: RegisterDeviceRequest
): Promise<RegisterDeviceResponse> {
  return requestJSON<RegisterDeviceResponse>(baseUrl, "/v1/devices/register", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });
}
