import { buildHeaders, requestJSON } from "./client.js";
import type { ActivityEvent, PushEventsRequest, PushEventsResponse } from "../types.js";

function toPushEvent(event: ActivityEvent): ActivityEvent {
  const { is_synced: _isSynced, ...payload } = event;
  return payload;
}

export async function pushEvents(
  baseUrl: string,
  deviceId: string,
  events: ActivityEvent[]
): Promise<PushEventsResponse> {
  const payload: PushEventsRequest = { events: events.map(toPushEvent) };

  return requestJSON<PushEventsResponse>(baseUrl, "/v1/events/batch", {
    method: "POST",
    headers: buildHeaders(deviceId),
    body: JSON.stringify(payload)
  });
}
