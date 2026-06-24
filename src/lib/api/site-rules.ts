import { buildHeaders, requestJSON } from "./client.js";
import type {
    ClassifySitesRequest,
    ClassifySitesResponse,
    SiteRuleResponse,
    UpdateSiteRuleRequest,
} from "../types.js";

export async function classifySites(
    baseUrl: string,
    deviceId: string,
    domains: string[],
): Promise<ClassifySitesResponse> {
    return requestJSON<ClassifySitesResponse>(baseUrl, "/v1/sites/classify", {
        method: "POST",
        headers: buildHeaders(deviceId),
        body: JSON.stringify({
            domains,
        } satisfies ClassifySitesRequest),
    });
}

export async function updateSiteRule(
    baseUrl: string,
    deviceId: string,
    payload: UpdateSiteRuleRequest,
): Promise<SiteRuleResponse> {
    return requestJSON<SiteRuleResponse>(baseUrl, "/v1/sites/rules", {
        method: "PUT",
        headers: buildHeaders(deviceId),
        body: JSON.stringify(payload),
    });
}
