import assert from "node:assert/strict";
import test from "node:test";

import { createBackgroundMessageListener } from "../background/messaging/handlers.js";
import { buildPopupModel } from "../background/focus/focus-session-flow.js";
import { classifyUrl, safeTabUrl } from "../background/tracking/classify-url.js";
import { createBackgroundRuntimeContext } from "../background/runtime/runtime-state.js";
import { MESSAGE_TYPES } from "./constants.js";
import {
  isBackgroundErrorResponse,
  isBackgroundRequest,
  isContentRequest
} from "./messaging/contracts.js";
import type { ActivityEvent, PopupModel, Settings, TodayView, TrackingTransition } from "./types.js";
import {
  donutBackground,
  getComparisonText,
  getFooterInsight,
  getProgressLabel,
  getProductivityScoreValue,
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
  assert.equal(isBackgroundRequest({ type: MESSAGE_TYPES.retrySiteClassifications }), true);
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

test("background retry classifications message returns updated debug snapshot fields", async () => {
  const storage: Record<string, unknown> = {
    twt_device_v2: {
      installationId: "installation-1",
      deviceId: "device-1",
      registeredAt: "2026-05-20T00:00:00.000Z"
    },
    twt_dashboard_cache_v2: {
      overview: null,
      todayView: null,
      trendsView: null,
      sitesView: null,
      insightsView: null,
      focusSessionsView: null,
      currentHostCategory: null,
      lastSyncAt: null,
      lastError: null
    },
    twt_site_rules_v1: {
      excludedHosts: [],
      categoryOverrides: {}
    },
    twt_site_classifications_v1: {
      byHost: {
        "pending.example": {
          category: "other",
          status: "pending",
          attempts: 0,
          nextRetryAt: null,
          lastError: null,
          updatedAt: "2026-05-20T00:00:00.000Z"
        }
      }
    }
  };
  globalThis.chrome = {
    action: {
      async setBadgeBackgroundColor() {},
      async setBadgeText() {},
      async setTitle() {},
      async setIcon() {}
    },
    alarms: {
      async clear() {
        return true;
      },
      create() {}
    },
    storage: {
      local: {
        async get(keys: string | string[]) {
          if (Array.isArray(keys)) {
            return Object.fromEntries(keys.map((key) => [key, structuredClone(storage[key])]));
          }
          return { [keys]: structuredClone(storage[keys]) };
        },
        async set(values: Record<string, unknown>) {
          Object.assign(storage, structuredClone(values));
        },
        async remove(keys: string | string[]) {
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            delete storage[key];
          }
        }
      },
      onChanged: {
        addListener() {},
        removeListener() {}
      }
    },
    runtime: {
      getManifest() {
        return { version: "0.2.0" };
      }
    }
  } as unknown as typeof chrome;
  globalThis.fetch = (async () => ({
    ok: true,
    async json() {
      return {
        results: [{ domain: "pending.example", category: "work" }]
      };
    }
  })) as unknown as typeof fetch;

  const listener = createBackgroundMessageListener(createBackgroundRuntimeContext());
  const response = await new Promise<unknown>((resolve) => {
    listener({ type: MESSAGE_TYPES.retrySiteClassifications }, {} as chrome.runtime.MessageSender, resolve);
  }) as {
    retriedCount: number;
    lastError: string | null;
    siteClassifications: { byHost: Record<string, { status: string; category: string }> };
  };

  assert.equal(response.retriedCount, 1);
  assert.equal(response.lastError, null);
  assert.equal(response.siteClassifications.byHost["pending.example"]?.status, "resolved");
  assert.equal(response.siteClassifications.byHost["pending.example"]?.category, "work");
  assert.equal((storage.twt_dashboard_cache_v2 as { lastError: string | null }).lastError, null);
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
    productivityScore: {
      value: 43,
      label: "Fair"
    },
    scoreComparison: {
      label: "vs yesterday",
      delta: -10
    },
    topCategories: [],
    topSites: [],
    insight: { title: "Reset", body: "Take a break" },
    currentSite: null,
    focusSession: null,
    primaryAction: { type: "open_dashboard", label: "Open" },
    secondaryActions: [],
    canReclassify: false
  };

  assert.equal(getProductivityScoreValue(driftingModel), 43);
  assert.equal(getProgressLabel(driftingModel), "Productivity score 43");
  assert.equal(getFooterInsight(driftingModel), "A gentle reset can bring the day back on track.");
  assert.equal(getComparisonText(driftingModel), "vs yesterday -10 pts");
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
  assert.equal(getProgressLabel(null), "Productivity score 0");
});

test("buildPopupModel uses dashboard productivity score and safe fallbacks", () => {
  const context = createBackgroundRuntimeContext();
  const settings: Settings = {
    apiBaseUrl: "https://api.example.com",
    timezone: "UTC",
    trackingPaused: false,
    idleDetectionSeconds: 60,
    trackMediaWhenIdle: false,
    workHoursStart: "09:00",
    workHoursEnd: "18:00",
    workdays: [1, 2, 3, 4, 5],
    deepWorkBlocks: [],
    categoryOverrides: {},
    excludedHosts: [],
    nudgesEnabled: true,
    nudgeSensitivity: "balanced",
    snoozeMinutes: 15,
    workHoursOnly: false,
    aiInsightsEnabled: false,
    aiTone: "supportive"
  };

  const populatedModel = buildPopupModel(context, {
    overview: {
      today: {
        range: "today",
        days: 1,
        summary: {
          title: "Today",
          subtitle: "Summary",
          total_duration_ms: 3_600_000,
          productive_duration_ms: 2_700_000,
          social_duration_ms: 900_000,
          sites_visited_count: 2,
          productivity_score: {
            value: 72,
            label: "Good",
            grade: "B",
            message: "Solid"
          }
        },
        category_breakdown: [],
        trend: [],
        top_sites: []
      }
    },
    todayView: {
      summary: {
        total_duration_ms: 3_600_000,
        focus_duration_ms: 2_700_000,
        distraction_duration_ms: 900_000,
        focus_alignment: 0.75
      },
      comparison: {
        label: "vs yesterday",
        productivity_score_delta: 8
      },
      top_sites: [],
      top_categories: []
    },
    trendsView: null,
    sitesView: null,
    insightsView: null,
    focusSessionsView: null,
    currentHostCategory: null,
    lastSyncAt: null,
    lastError: null
  }, settings);

  assert.deepEqual(populatedModel.productivityScore, { value: 72, label: "Good" });
  assert.deepEqual(populatedModel.scoreComparison, { label: "vs yesterday", delta: 8 });

  const fallbackModel = buildPopupModel(context, {
    overview: null,
    todayView: null,
    trendsView: null,
    sitesView: null,
    insightsView: null,
    focusSessionsView: null,
    currentHostCategory: null,
    lastSyncAt: null,
    lastError: null
  }, settings);

  assert.deepEqual(fallbackModel.productivityScore, { value: 0, label: "No score yet" });
  assert.deepEqual(fallbackModel.scoreComparison, { label: "vs yesterday", delta: 0 });
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
