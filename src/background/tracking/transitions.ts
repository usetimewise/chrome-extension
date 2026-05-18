import { appendActivityEvent, appendToQueue } from "../../lib/storage/activity-events.js";
import { saveRuntimeState } from "../../lib/storage/runtime-state.js";
import { getSettings } from "../../lib/storage/site-rules.js";
import { resolveCategory } from "../../lib/local-analytics.js";
import { generateId, hostMatchesRule, isTrackableUrl, normalizePathHash } from "../../lib/utils.js";
import { isActiveTrackedEvent, splitTrackedIntervalForGap } from "../../lib/tracking-diagnostics.js";
import type {
  ActivityEvent,
  Settings,
  TrackingStatus,
  TrackingTransition,
  TrackingTransitionType
} from "../../lib/types.js";
import { appendTrackingTransition } from "../../lib/storage/tracking-transitions.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";
import { classifyUrl } from "./classify-url.js";

function transitionUrlClass(context: BackgroundRuntimeContext): "trackable" | TrackingStatus {
  if (context.runtimeState.currentHost && isTrackableUrl(context.runtimeState.currentUrl)) {
    return "trackable";
  }

  if (["browser_internal", "extension_page", "file_page"].includes(context.runtimeState.currentHost || "")) {
    return "restricted_page";
  }

  if (context.runtimeState.currentHost === "unknown_url") {
    return "unknown_url";
  }

  return classifyUrl(context.runtimeState.currentUrl).status;
}

export async function logTransition(
  context: BackgroundRuntimeContext,
  type: TrackingTransitionType,
  reason: string = type,
  overrides: Partial<Omit<TrackingTransition, "id" | "type" | "occurred_at">> = {}
): Promise<void> {
  await appendTrackingTransition({
    id: generateId(),
    type,
    occurred_at: new Date().toISOString(),
    tab_id: context.runtimeState.currentTabId,
    window_id: context.runtimeState.currentWindowId ?? null,
    url_class: transitionUrlClass(context),
    host: context.runtimeState.currentHost,
    window_focused: context.runtimeState.isWindowFocused,
    idle_state: context.runtimeState.idleState,
    is_playing_media: context.runtimeState.isPlayingMedia,
    reason,
    ...overrides
  });
}

export function trackingStatusForCurrentState(
  context: BackgroundRuntimeContext,
  settings: Settings
): TrackingStatus {
  if (settings.trackingPaused) {
    return "tracking_paused";
  }

  if (!context.runtimeState.isWindowFocused) {
    return "browser_unfocused";
  }

  if (context.runtimeState.idleState === "locked") {
    return "locked";
  }

  if (
    context.runtimeState.idleState === "idle" &&
    !(settings.trackMediaWhenIdle && context.runtimeState.isPlayingMedia)
  ) {
    return "idle";
  }

  if (!context.runtimeState.currentHost || !isTrackableUrl(context.runtimeState.currentUrl)) {
    if (["browser_internal", "extension_page", "file_page"].includes(context.runtimeState.currentHost || "")) {
      return "restricted_page";
    }

    if (context.runtimeState.currentHost === "unknown_url") {
      return "unknown_url";
    }

    return classifyUrl(context.runtimeState.currentUrl).status;
  }

  if (settings.excludedHosts.some((rule) => hostMatchesRule(context.runtimeState.currentHost as string, rule))) {
    return "excluded";
  }

  return "active_tracked";
}

function eventHostForStatus(context: BackgroundRuntimeContext, status: TrackingStatus): string | null {
  if (context.runtimeState.currentHost) {
    return context.runtimeState.currentHost;
  }

  if (status === "restricted_page" || status === "unknown_url") {
    return classifyUrl(context.runtimeState.currentUrl).host;
  }

  return null;
}

export function isTrackingEligible(
  context: BackgroundRuntimeContext,
  host: string | null,
  settings: Settings
): boolean {
  if (!host || settings.trackingPaused) {
    return false;
  }

  if (settings.excludedHosts.some((rule) => hostMatchesRule(host, rule))) {
    return false;
  }

  if (!context.runtimeState.isWindowFocused) {
    return false;
  }

  if (context.runtimeState.idleState === "active") {
    return true;
  }

  return settings.trackMediaWhenIdle && context.runtimeState.isPlayingMedia;
}

export async function flushCurrentSession(
  context: BackgroundRuntimeContext,
  reason: string = "transition",
  settingsOverride: Settings | null = null
): Promise<void> {
  const nextFlush = context.flushQueue.then(() => flushCurrentSessionNow(context, reason, settingsOverride));
  context.flushQueue = nextFlush.catch((): void => undefined);
  return nextFlush;
}

async function flushCurrentSessionNow(
  context: BackgroundRuntimeContext,
  reason: string = "transition",
  settingsOverride: Settings | null = null
): Promise<void> {
  const settings = settingsOverride || await getSettings();
  const startedAt = context.runtimeState.sessionStartedAt;
  const now = Date.now();
  context.runtimeState.lastObservedAt = now;

  if (!startedAt) {
    context.runtimeState.sessionStartedAt = now;
    await saveRuntimeState(context.runtimeState);
    return;
  }

  const status = trackingStatusForCurrentState(context, settings);
  const category = context.runtimeState.currentHost
    ? resolveCategory(context.runtimeState.currentHost, settings)
    : undefined;
  const effectiveStatus = status === "active_tracked" && category === "excluded"
    ? "excluded"
    : status;
  const host = eventHostForStatus(context, effectiveStatus);
  const safeUrl = isTrackableUrl(context.runtimeState.currentUrl) && effectiveStatus === "active_tracked"
    ? context.runtimeState.currentUrl
    : null;
  const pathHash = safeUrl ? normalizePathHash(safeUrl) : "";

  for (const interval of splitTrackedIntervalForGap(
    startedAt,
    now,
    effectiveStatus,
    context.runtimeState.lastHeartbeatAt
  )) {
    const event: ActivityEvent = {
      event_id: generateId(),
      occurred_at: new Date(interval.startedAt).toISOString(),
      ended_at: new Date(interval.endedAt).toISOString(),
      duration_ms: interval.durationMs,
      url: interval.status === "active_tracked" ? safeUrl : null,
      host,
      path_hash: interval.status === "active_tracked" ? pathHash : "",
      window_focused: context.runtimeState.isWindowFocused,
      idle_state: context.runtimeState.idleState,
      is_playing_media: context.runtimeState.isPlayingMedia,
      gap_ms: interval.gapMs,
      window_id: context.runtimeState.currentWindowId ?? null,
      tab_id: context.runtimeState.currentTabId,
      tracking_status: interval.status,
      client_version: chrome.runtime.getManifest().version,
      category: interval.status === "active_tracked" ? category : undefined,
      reason
    };
    await appendActivityEvent(event, settings);
    if (isActiveTrackedEvent(event)) {
      await appendToQueue(event);
    }
  }

  context.runtimeState.sessionStartedAt = now;
  await saveRuntimeState(context.runtimeState);
}
