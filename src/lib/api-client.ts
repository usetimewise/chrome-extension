import type {
  ActivityEvent,
  ApiErrorPayload,
  Category,
  PushEventsResponse,
  RegisterDeviceResponse
} from "./types.js";

function buildHeaders(deviceId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (deviceId) {
    headers["X-Device-Id"] = deviceId;
  }

  return headers;
}

async function requestJSON<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json().catch(() => ({})) as ApiErrorPayload;

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  return payload as T;
}

export async function registerDevice(baseUrl: string, payload: Record<string, unknown>): Promise<RegisterDeviceResponse> {
  return requestJSON<RegisterDeviceResponse>(baseUrl, "/v1/devices/register", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });
}

export async function pushEvents(baseUrl: string, deviceId: string, events: ActivityEvent[]): Promise<PushEventsResponse> {
  return requestJSON<PushEventsResponse>(baseUrl, "/v1/events/batch", {
    method: "POST",
    headers: buildHeaders(deviceId),
    body: JSON.stringify({ events })
  });
}

export async function fetchTodayView(baseUrl: string, deviceId: string): Promise<unknown> {
  return requestJSON<unknown>(baseUrl, "/v1/dashboard/today", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchTrendsView(baseUrl: string, deviceId: string): Promise<unknown> {
  return requestJSON<unknown>(baseUrl, "/v1/dashboard/trends", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchSitesView(baseUrl: string, deviceId: string): Promise<unknown> {
  return requestJSON<unknown>(baseUrl, "/v1/dashboard/sites", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchInsightsView(baseUrl: string, deviceId: string): Promise<unknown> {
  return requestJSON<unknown>(baseUrl, "/v1/dashboard/insights", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchFocusSessionsView(baseUrl: string, deviceId: string): Promise<unknown> {
  return requestJSON<unknown>(baseUrl, "/v1/focus-sessions", {
    headers: buildHeaders(deviceId)
  });
}

export async function resolveCategories(baseUrl: string, deviceId: string, hosts: string[]): Promise<unknown> {
  const query = encodeURIComponent((hosts || []).join(","));
  return requestJSON<unknown>(baseUrl, `/v1/sites/categories?hosts=${query}`, {
    headers: buildHeaders(deviceId)
  });
}

export async function updateSiteRule(
  baseUrl: string,
  deviceId: string,
  payload: { host: string; category?: Category; excluded: boolean }
): Promise<unknown> {
  return requestJSON<unknown>(baseUrl, "/v1/sites/rules", {
    method: "PUT",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}

export async function pushPreferences(baseUrl: string, deviceId: string, payload: Record<string, unknown>): Promise<unknown> {
  return requestJSON<unknown>(baseUrl, "/v1/preferences", {
    method: "PUT",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}

export async function startFocusSession(baseUrl: string, deviceId: string, payload: Record<string, unknown>): Promise<unknown> {
  return requestJSON<unknown>(baseUrl, "/v1/focus-sessions", {
    method: "POST",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}

export async function updateFocusSessionState(baseUrl: string, deviceId: string, sessionId: string, action: string): Promise<unknown> {
  return requestJSON<unknown>(baseUrl, `/v1/focus-sessions/${encodeURIComponent(sessionId)}/${encodeURIComponent(action)}`, {
    method: "POST",
    headers: buildHeaders(deviceId)
  });
}
