function buildHeaders(deviceId) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (deviceId) {
    headers["X-Device-Id"] = deviceId;
  }

  return headers;
}

async function requestJSON(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  return payload;
}

export async function registerDevice(baseUrl, payload) {
  return requestJSON(baseUrl, "/v1/devices/register", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });
}

export async function pushEvents(baseUrl, deviceId, events) {
  return requestJSON(baseUrl, "/v1/events/batch", {
    method: "POST",
    headers: buildHeaders(deviceId),
    body: JSON.stringify({ events })
  });
}

export async function fetchTodayView(baseUrl, deviceId) {
  return requestJSON(baseUrl, "/v1/dashboard/today", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchTrendsView(baseUrl, deviceId) {
  return requestJSON(baseUrl, "/v1/dashboard/trends", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchSitesView(baseUrl, deviceId) {
  return requestJSON(baseUrl, "/v1/dashboard/sites", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchInsightsView(baseUrl, deviceId) {
  return requestJSON(baseUrl, "/v1/dashboard/insights", {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchFocusSessionsView(baseUrl, deviceId) {
  return requestJSON(baseUrl, "/v1/focus-sessions", {
    headers: buildHeaders(deviceId)
  });
}

export async function resolveCategories(baseUrl, deviceId, hosts) {
  const query = encodeURIComponent((hosts || []).join(","));
  return requestJSON(baseUrl, `/v1/sites/categories?hosts=${query}`, {
    headers: buildHeaders(deviceId)
  });
}

export async function updateSiteRule(baseUrl, deviceId, payload) {
  return requestJSON(baseUrl, "/v1/sites/rules", {
    method: "PUT",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}

export async function pushPreferences(baseUrl, deviceId, payload) {
  return requestJSON(baseUrl, "/v1/preferences", {
    method: "PUT",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}

export async function startFocusSession(baseUrl, deviceId, payload) {
  return requestJSON(baseUrl, "/v1/focus-sessions", {
    method: "POST",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}

export async function updateFocusSessionState(baseUrl, deviceId, sessionId, action) {
  return requestJSON(baseUrl, `/v1/focus-sessions/${encodeURIComponent(sessionId)}/${encodeURIComponent(action)}`, {
    method: "POST",
    headers: buildHeaders(deviceId)
  });
}
