import assert from "node:assert/strict";
import test from "node:test";

import { classifyUrl, safeTabUrl } from "../background/tracking/classify-url.js";
import { MESSAGE_TYPES } from "./constants.js";
import {
  isBackgroundErrorResponse,
  isBackgroundRequest,
  isContentRequest
} from "./messaging/contracts.js";
import type { ActivityEvent, PopupModel, TodayView, TrackingTransition } from "./types.js";
import {
  donutBackground,
  getAlignmentPercent,
  getComparisonText,
  getFooterInsight,
  getProgressLabel,
  getScoreLabel,
  topCategoryShare
} from "../ui/popup/lib/presentation.js";
import {
  clampPercent,
  distractingCategories,
  distractingSites,
  isStartFocusRecommendation,
  recommendationIcon
} from "../ui/dashboard/lib/presentation.js";
import { categoryTone } from "../ui/shared/lib/presentation.js";
import {
  latestEvents,
  latestTransitions,
  totalByStatus
} from "../ui/debug/lib/presentation.js";

test("background messaging contracts validate payload shape and error envelopes", () => {
  assert.equal(isBackgroundRequest({ type: MESSAGE_TYPES.getBootstrap }), true);
  assert.equal(
    isBackgroundRequest({ type: MESSAGE_TYPES.saveSiteRule, host: "github.com", category: "work", excluded: false }),
    true
  );
  assert.equal(
    isBackgroundRequest({ type: MESSAGE_TYPES.saveSiteRule, host: "", category: "made-up", excluded: false }),
    false
  );
  assert.equal(
    isContentRequest({ type: MESSAGE_TYPES.showFocusNudge, title: "Refocus", message: "Back to work", host: "x.com", category: "social", duration: "10m" }),
    true
  );
  assert.equal(isBackgroundErrorResponse({ ok: false, error: "sync failed" }), true);
  assert.equal(isBackgroundErrorResponse({ ok: true, error: "sync failed" }), false);
});

test("URL classification keeps safe tab URLs and marks restricted pages explicitly", () => {
  assert.deepEqual(classifyUrl("https://github.com/openai"), {
    status: "active_tracked",
    host: "github.com",
    safeUrl: "https://github.com/openai"
  });
  assert.deepEqual(classifyUrl("chrome://extensions"), {
    status: "restricted_page",
    host: "browser_internal",
    safeUrl: null
  });
  assert.deepEqual(classifyUrl("chrome-extension://abc123/popup.html"), {
    status: "restricted_page",
    host: "extension_page",
    safeUrl: null
  });
  assert.deepEqual(classifyUrl("notaurl"), {
    status: "unknown_url",
    host: "unknown_url",
    safeUrl: null
  });
  assert.equal(safeTabUrl({ url: "https://example.com" } as chrome.tabs.Tab), "https://example.com");
  assert.equal(safeTabUrl({ url: undefined } as chrome.tabs.Tab), null);
});

test("popup presentation helpers normalize empty and active states", () => {
  const driftingModel: PopupModel = {
    state: "drifting",
    statusLabel: "Drifting",
    statusMessage: "Needs a reset",
    trackedTimeMs: 3_600_000,
    focusedTimeMs: 1_800_000,
    distractedTimeMs: 1_800_000,
    focusAlignment: 0.426,
    comparisonLabel: "vs yesterday",
    comparisonValue: -0.1,
    topCategories: [],
    topSites: [],
    insight: { title: "Reset", body: "Take a break" },
    currentSite: null,
    focusSession: null,
    primaryAction: { type: "open_dashboard", label: "Open" },
    secondaryActions: [],
    canReclassify: false
  };

  assert.equal(getAlignmentPercent(driftingModel), 43);
  assert.equal(getProgressLabel(driftingModel), "43% focus alignment");
  assert.equal(getFooterInsight(driftingModel), "A gentle reset can bring the day back on track.");
  assert.equal(getScoreLabel(43), "Fair");
  assert.equal(getComparisonText(driftingModel), "vs yesterday -10%");
  assert.equal(
    topCategoryShare([
      { category: "work", duration_ms: 4_000, share: 0.5 },
      { category: "social", duration_ms: 2_000, share: 0.25 }
    ]),
    50
  );
  assert.match(
    donutBackground([
      { category: "work", duration_ms: 4_000, share: 0.5 },
      { category: "social", duration_ms: 2_000, share: 0.25 }
    ]),
    /^conic-gradient\(/
  );
  assert.equal(getProgressLabel(null), "0% focus alignment");
});

test("dashboard presentation helpers sort distracting items and detect focus actions", () => {
  const view: TodayView = {
    summary: {
      total_duration_ms: 1,
      focus_duration_ms: 1,
      distraction_duration_ms: 0,
      focus_alignment: 1
    },
    top_sites: [
      { host: "github.com", category: "work", duration_ms: 1_000 },
      { host: "youtube.com", category: "entertainment", duration_ms: 4_000 },
      { host: "x.com", category: "social", duration_ms: 2_000 }
    ],
    top_categories: [
      { category: "work", duration_ms: 1_000, share: 0.1 },
      { category: "entertainment", duration_ms: 4_000, share: 0.5 },
      { category: "social", duration_ms: 2_000, share: 0.25 }
    ]
  };

  assert.equal(clampPercent(1.4), 100);
  assert.equal(categoryTone("social"), "danger");
  assert.equal(categoryTone("communication"), "communication");
  assert.deepEqual(distractingSites(view).map((item) => item.host), ["youtube.com", "x.com"]);
  assert.deepEqual(distractingCategories(view).map((item) => item.category), ["entertainment", "social"]);
  assert.equal(recommendationIcon("focus_reset"), "bolt");
  assert.equal(recommendationIcon("classification"), "triangle-exclamation");
  assert.equal(
    isStartFocusRecommendation({
      title: "Start focus",
      body: "Reset now",
      action: { type: "start_focus_session", label: "Start" }
    }),
    true
  );
});

test("debug presentation helpers aggregate statuses and return newest entries first", () => {
  const events: ActivityEvent[] = [
    {
      event_id: "older",
      occurred_at: "2026-05-17T09:00:00.000Z",
      duration_ms: 2_000,
      host: "github.com",
      tracking_status: "active_tracked"
    },
    {
      event_id: "newer",
      occurred_at: "2026-05-17T10:00:00.000Z",
      duration_ms: 3_000,
      host: "github.com",
      tracking_status: "idle"
    }
  ];
  const transitions: TrackingTransition[] = [
    { id: "old", type: "heartbeat", occurred_at: "2026-05-17T09:00:00.000Z" },
    { id: "new", type: "tab-activated", occurred_at: "2026-05-17T11:00:00.000Z" }
  ];

  assert.deepEqual(totalByStatus(events), {
    active_tracked: 2_000,
    idle: 3_000
  });
  assert.deepEqual(latestEvents(events).map((event) => event.event_id), ["newer", "older"]);
  assert.deepEqual(latestTransitions(transitions).map((transition) => transition.id), ["new", "old"]);
});
