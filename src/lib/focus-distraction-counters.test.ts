import assert from "node:assert/strict";
import test from "node:test";

import {
    addFocusDistractionDuration,
    createEmptyFocusDistractionCounters,
    ensureFocusDistractionCounterSession,
    FOCUS_DISTRACTION_COUNTER_RESET_AFTER_MS,
    FOCUS_STRICT_BLOCK_AFTER_MS,
    markFocusNudgeNotificationShown,
    resolveFocusBlockSeverity,
    resolveFocusCompanionScenario,
    shouldSuppressSoftFocusNudge,
} from "./focus-distraction-counters.js";
import { decideDistractionSite } from "./site-block-rules.js";
import type { FocusSession } from "./types.js";

function activeSession(id = "focus-1"): FocusSession {
    return {
        id,
        intent: "Focus",
        status: "active",
        planned_minutes: 0,
        started_at: new Date(1_000).toISOString(),
        last_resumed_at: new Date(1_000).toISOString(),
        active_duration_ms: 0,
        pause_count: 0,
        distraction_count: 0,
    };
}

function counterStateWithDurations(durations: number[]) {
    return durations.reduce(
        (state, durationMs, index) =>
            addFocusDistractionDuration(state, {
                rule: {
                    id: `rule:${index}`,
                    pattern: `example-${index}.com`,
                    patternType: "domain",
                    category: "social",
                    source: "default",
                },
                url: `https://example-${index}.com/feed`,
                host: `example-${index}.com`,
                durationMs,
                now: 2_000 + index,
            }),
        createEmptyFocusDistractionCounters("focus-1", 1_000),
    );
}

test("default url prefix rule counts shorts without counting the whole youtube domain", async () => {
    const shortsDecision = await decideDistractionSite(
        "https://www.youtube.com/shorts/abc",
        {
            siteRules: { excludedHosts: [], categoryOverrides: {} },
            allowNetworkLookup: false,
        },
    );
    assert.equal(shortsDecision.action, "distracting");
    assert.equal(
        shortsDecision.action === "distracting" &&
            shortsDecision.matchedRule?.id,
        "default:youtube-shorts",
    );

    const watchDecision = await decideDistractionSite(
        "https://www.youtube.com/watch?v=abc",
        {
            siteRules: { excludedHosts: [], categoryOverrides: {} },
            allowNetworkLookup: false,
        },
    );
    assert.deepEqual(watchDecision, {
        action: "allow",
        reason: "no_local_block_decision",
    });
});

test("user domain rule aggregates subdomain time by rule id", async () => {
    const decision = await decideDistractionSite(
        "https://feed.example.com/post/1",
        {
            siteRules: {
                excludedHosts: [],
                categoryOverrides: { "example.com": "social" },
            },
            allowNetworkLookup: false,
        },
    );
    assert.equal(decision.action, "distracting");
    assert.equal(
        decision.action === "distracting" && decision.matchedRule?.id,
        "user:example.com",
    );

    if (decision.action !== "distracting" || !decision.matchedRule) {
        throw new Error("Expected a user distraction rule");
    }

    const state = addFocusDistractionDuration(
        createEmptyFocusDistractionCounters("focus-1", 1_000),
        {
            rule: decision.matchedRule,
            url: "https://feed.example.com/post/1",
            host: decision.host,
            durationMs: 2_500,
            now: 3_500,
        },
    );

    assert.equal(state.counters["user:example.com"].totalMs, 2_500);
    assert.equal(
        state.counters["user:example.com"].lastHost,
        "feed.example.com",
    );
});

test("new focus session resets counters", () => {
    const state = addFocusDistractionDuration(
        createEmptyFocusDistractionCounters("focus-1", 1_000),
        {
            rule: {
                id: "default:reddit",
                pattern: "reddit.com",
                patternType: "domain",
                category: "social",
                source: "default",
            },
            url: "https://reddit.com/r/typescript",
            host: "reddit.com",
            durationMs: 1_000,
            now: 2_000,
        },
    );

    const next = ensureFocusDistractionCounterSession(
        state,
        activeSession("focus-2"),
        3_000,
    );

    assert.equal(next.sessionId, "focus-2");
    assert.deepEqual(next.counters, {});
});

test("counters reset eight hours after the latest distraction", () => {
    const state = addFocusDistractionDuration(
        createEmptyFocusDistractionCounters("focus-1", 1_000),
        {
            rule: {
                id: "default:reddit",
                pattern: "reddit.com",
                patternType: "domain",
                category: "social",
                source: "default",
            },
            url: "https://reddit.com/r/typescript",
            host: "reddit.com",
            durationMs: 1_000,
            now: 2_000,
        },
    );

    const next = ensureFocusDistractionCounterSession(
        state,
        activeSession("focus-1"),
        2_000 + FOCUS_DISTRACTION_COUNTER_RESET_AFTER_MS,
    );

    assert.equal(next.sessionId, "focus-1");
    assert.deepEqual(next.counters, {});
});

test("counters reset when focus is inactive", () => {
    const state = addFocusDistractionDuration(
        createEmptyFocusDistractionCounters("focus-1", 1_000),
        {
            rule: {
                id: "default:reddit",
                pattern: "reddit.com",
                patternType: "domain",
                category: "social",
                source: "default",
            },
            url: "https://reddit.com/r/typescript",
            host: "reddit.com",
            durationMs: 1_000,
            now: 2_000,
        },
    );

    const next = ensureFocusDistractionCounterSession(state, null, 3_000);

    assert.equal(next.sessionId, null);
    assert.deepEqual(next.counters, {});
});

test("focus block severity stays soft before the strict threshold", () => {
    const state = counterStateWithDurations([FOCUS_STRICT_BLOCK_AFTER_MS - 1]);

    assert.equal(resolveFocusBlockSeverity(state.counters), "soft");
});

test("focus block severity is strict at the threshold", () => {
    const state = counterStateWithDurations([FOCUS_STRICT_BLOCK_AFTER_MS]);

    assert.equal(resolveFocusBlockSeverity(state.counters), "strict");
});

test("focus block severity sums counters across all rules", () => {
    const state = counterStateWithDurations([
        FOCUS_STRICT_BLOCK_AFTER_MS / 2,
        FOCUS_STRICT_BLOCK_AFTER_MS / 2,
    ]);

    assert.equal(resolveFocusBlockSeverity(state.counters), "strict");
});

test("focus companion scenario follows distraction duration thresholds", () => {
    assert.equal(resolveFocusCompanionScenario(counterStateWithDurations([
        9 * 60 * 1000,
    ]).counters), "2");
    assert.equal(resolveFocusCompanionScenario(counterStateWithDurations([
        10 * 60 * 1000,
    ]).counters), "3");
    assert.equal(resolveFocusCompanionScenario(counterStateWithDurations([
        30 * 60 * 1000,
    ]).counters), "4");
});

test("soft focus nudge is suppressed while the current url has not changed", () => {
    const notifications = {
        sessionId: "focus-1",
        hosts: {},
        lastSoftUrl: "https://example.com/watch",
    };

    assert.equal(
        shouldSuppressSoftFocusNudge({
            notifications,
            sessionId: "focus-1",
            currentUrl: "https://example.com/watch",
            presentation: "soft",
        }),
        true,
    );
});

test("soft focus nudge is allowed after the current url changes", () => {
    const notifications = {
        sessionId: "focus-1",
        hosts: {},
        lastSoftUrl: "https://example.com/watch",
    };

    assert.equal(
        shouldSuppressSoftFocusNudge({
            notifications,
            sessionId: "focus-1",
            currentUrl: "https://example.com/next",
            presentation: "soft",
        }),
        false,
    );
});

test("soft focus nudge is allowed for a new focus session", () => {
    const notifications = {
        sessionId: "focus-1",
        hosts: {},
        lastSoftUrl: "https://example.com/watch",
    };

    assert.equal(
        shouldSuppressSoftFocusNudge({
            notifications,
            sessionId: "focus-2",
            currentUrl: "https://example.com/watch",
            presentation: "soft",
        }),
        false,
    );
});

test("strict focus nudge is never suppressed by the soft url limit", () => {
    const notifications = {
        sessionId: "focus-1",
        hosts: {},
        lastSoftUrl: "https://example.com/watch",
    };

    assert.equal(
        shouldSuppressSoftFocusNudge({
            notifications,
            sessionId: "focus-1",
            currentUrl: "https://example.com/watch",
            presentation: "strict",
        }),
        false,
    );
});

test("shown soft focus nudge records the current url", () => {
    const notifications = markFocusNudgeNotificationShown({
        notifications: {
            sessionId: null,
            hosts: {},
            lastSoftUrl: null,
        },
        sessionId: "focus-1",
        currentUrl: "https://example.com/watch",
        presentation: "soft",
    });

    assert.deepEqual(notifications, {
        sessionId: "focus-1",
        hosts: {},
        lastSoftUrl: "https://example.com/watch",
    });
});
