import { buildHeaders, requestJSON } from "./client.js";
import type {
  FocusSessionsView,
  InsightsViewResponse,
  SitesView,
  TodayView,
  TrendsViewResponse
} from "../types.js";

export async function fetchTodayView(baseUrl: string, deviceId: string): Promise<TodayView> {
  return requestJSON<TodayView>(baseUrl, "/v1/dashboard/today", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchTrendsView(baseUrl: string, deviceId: string): Promise<TrendsViewResponse> {
  return requestJSON<TrendsViewResponse>(baseUrl, "/v1/dashboard/trends", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchSitesView(baseUrl: string, deviceId: string): Promise<SitesView> {
  return requestJSON<SitesView>(baseUrl, "/v1/dashboard/sites", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchInsightsView(baseUrl: string, deviceId: string): Promise<InsightsViewResponse> {
  return requestJSON<InsightsViewResponse>(baseUrl, "/v1/dashboard/insights", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchFocusSessionsView(baseUrl: string, deviceId: string): Promise<FocusSessionsView> {
  return requestJSON<FocusSessionsView>(baseUrl, "/v1/focus-sessions", {
    headers: buildHeaders(deviceId)
  });
}
