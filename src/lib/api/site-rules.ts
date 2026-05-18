import { buildHeaders, requestJSON } from "./client.js";
import type { ResolveCategoriesResponse, SiteRuleResponse, UpdateSiteRuleRequest } from "../types.js";

export async function resolveCategories(
  baseUrl: string,
  deviceId: string,
  hosts: string[]
): Promise<ResolveCategoriesResponse> {
  const query = encodeURIComponent(hosts.join(","));

  return requestJSON<ResolveCategoriesResponse>(baseUrl, `/v1/sites/categories?hosts=${query}`, {
    headers: buildHeaders(deviceId)
  });
}

export async function updateSiteRule(
  baseUrl: string,
  deviceId: string,
  payload: UpdateSiteRuleRequest
): Promise<SiteRuleResponse> {
  return requestJSON<SiteRuleResponse>(baseUrl, "/v1/sites/rules", {
    method: "PUT",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}
