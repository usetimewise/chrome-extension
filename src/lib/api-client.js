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

export async function fetchSummary(baseUrl, deviceId, range = "today") {
  return requestJSON(baseUrl, `/v1/dashboard/summary?range=${encodeURIComponent(range)}`, {
    headers: buildHeaders(deviceId)
  });
}

export async function fetchTimeseries(baseUrl, deviceId, range = "today", granularity) {
  const granularityValue = granularity || (range === "today" ? "hour" : "day");
  return requestJSON(
    baseUrl,
    `/v1/dashboard/timeseries?range=${encodeURIComponent(range)}&granularity=${encodeURIComponent(granularityValue)}`,
    { headers: buildHeaders(deviceId) }
  );
}

export async function fetchRecommendations(baseUrl, deviceId, range = "today") {
  return requestJSON(baseUrl, `/v1/recommendations?range=${encodeURIComponent(range)}`, {
    headers: buildHeaders(deviceId)
  });
}

export async function pushPreferences(baseUrl, deviceId, payload) {
  return requestJSON(baseUrl, "/v1/preferences", {
    method: "PUT",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}
