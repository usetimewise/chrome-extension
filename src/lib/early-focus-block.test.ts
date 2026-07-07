import assert from "node:assert/strict";
import test from "node:test";

import { determineEarlyFocusBlock } from "./early-focus-block.js";
import { decideDistractionSite } from "./site-block-rules.js";
import type { FocusSession } from "./types.js";
import { saveBuckets } from "./urlDecision/bucketCache.js";
import { sha256Hex, splitHashPrefixSuffix } from "./urlDecision/hash.js";

let storage: Record<string, unknown> = {};

function clone<T>(value: T): T {
    return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function installChromeMock() {
    globalThis.chrome = {
        storage: {
            local: {
                async get(keys: string | string[] | null) {
                    if (keys === null) {
                        return clone(storage);
                    }
                    if (Array.isArray(keys)) {
                        return Object.fromEntries(
                            keys.map((key) => [key, clone(storage[key])]),
                        );
                    }
                    return { [keys]: clone(storage[keys]) };
                },
                async set(values: Record<string, unknown>) {
                    for (const [key, value] of Object.entries(values)) {
                        storage[key] = clone(value);
                    }
                },
                async remove(keys: string | string[]) {
                    for (const key of Array.isArray(keys) ? keys : [keys]) {
                        delete storage[key];
                    }
                },
            },
        },
    } as typeof chrome;
}

function activeSession(): FocusSession {
    return {
        id: "focus-1",
        intent: "Focus",
        status: "active",
        planned_minutes: 45,
        started_at: new Date().toISOString(),
        last_resumed_at: new Date().toISOString(),
        active_duration_ms: 0,
        pause_count: 0,
        distraction_count: 0,
    };
}

async function hashedKey(key: string) {
    return splitHashPrefixSuffix(await sha256Hex(key), 20);
}

test.beforeEach(() => {
    storage = {};
    installChromeMock();
});

test("allows when there is no active focus session", async () => {
    assert.deepEqual(
        await determineEarlyFocusBlock("https://youtube.com/shorts/abc", []),
        { action: "allow", reason: "no_active_focus_session" },
    );
});

test("blocks seeded short video rules before cached lookup", async () => {
    const decision = await determineEarlyFocusBlock(
        "https://www.youtube.com/shorts/abc",
        [activeSession()],
    );

    assert.equal(decision.action, "block");
    assert.equal(decision.action === "block" && decision.sessionId, "focus-1");
    assert.equal(decision.action === "block" && decision.host, "youtube.com");
    assert.equal(
        decision.action === "block" && decision.category,
        "short_video",
    );
    assert.equal(decision.action === "block" && decision.reason, "seed_rule");
});

test("example hard url is an early strict block", async () => {
    const decision = await determineEarlyFocusBlock(
        "https://example.com/hard",
        [activeSession()],
    );

    assert.equal(decision.action, "block");
    assert.equal(decision.action === "block" && decision.reason, "forced_rule");
    assert.equal(decision.action === "block" && decision.severity, "strict");
});

test("example soft url is an early soft block", async () => {
    const decision = await determineEarlyFocusBlock(
        "https://example.com/soft",
        [activeSession()],
        null,
        [],
        {
            "rule:strict": {
                rule: {
                    id: "rule:strict",
                    pattern: "example.com",
                    patternType: "domain",
                    category: "social",
                    source: "default",
                },
                totalMs: 2 * 60 * 1000,
                lastUrl: "https://example.com/feed",
                lastHost: "example.com",
                lastUpdatedAt: 1_000,
            },
        },
    );

    assert.equal(decision.action, "block");
    assert.equal(decision.action === "block" && decision.reason, "forced_rule");
    assert.equal(decision.action === "block" && decision.severity, "soft");
});

test("disabled seeded prefix rule does not block the whole domain", async () => {
    assert.deepEqual(
        await determineEarlyFocusBlock(
            "https://www.youtube.com/shorts/abc",
            [activeSession()],
            null,
            ["default:youtube-shorts"],
        ),
        { action: "allow", reason: "no_local_block_decision" },
    );

    assert.deepEqual(
        await determineEarlyFocusBlock(
            "https://www.youtube.com/watch?v=abc",
            [activeSession()],
            null,
            ["default:youtube-shorts"],
        ),
        { action: "allow", reason: "no_local_block_decision" },
    );
});

test("user work override wins over seeded block rules", async () => {
    assert.deepEqual(
        await determineEarlyFocusBlock(
            "https://youtube.com/shorts/abc",
            [activeSession()],
            { excludedHosts: [], categoryOverrides: { "youtube.com": "work" } },
        ),
        { action: "allow", reason: "user_override" },
    );
});

test("distraction decision works without active focus session and respects allow overrides", async () => {
    assert.deepEqual(
        await decideDistractionSite("https://youtube.com/shorts/abc", {
            siteRules: {
                excludedHosts: [],
                categoryOverrides: { "youtube.com": "work" },
            },
        }),
        { action: "allow", reason: "user_override" },
    );

    const decision = await decideDistractionSite(
        "https://www.reddit.com/r/typescript",
        { siteRules: { excludedHosts: [], categoryOverrides: {} } },
    );

    assert.equal(decision.action, "distracting");
    assert.equal(
        decision.action === "distracting" && decision.host,
        "reddit.com",
    );
    assert.equal(
        decision.action === "distracting" && decision.category,
        "social",
    );
    assert.equal(
        decision.action === "distracting" && decision.reason,
        "default_rule",
    );
});

test("user excluded host wins over forced distraction block", async () => {
    assert.deepEqual(
        await determineEarlyFocusBlock(
            "https://reddit.com/r/typescript",
            [activeSession()],
            {
                excludedHosts: ["reddit.com"],
                categoryOverrides: { "reddit.com": "social" },
            },
        ),
        { action: "allow", reason: "user_override" },
    );
});

test("user focus category override wins over forced distraction block", async () => {
    assert.deepEqual(
        await determineEarlyFocusBlock(
            "https://docs.example.com/path",
            [activeSession()],
            {
                excludedHosts: [],
                categoryOverrides: {
                    "example.com": "social",
                    "docs.example.com": "work",
                },
            },
        ),
        { action: "allow", reason: "user_override" },
    );
});

test("blocks user forced distraction rule before cached lookup", async () => {
    const decision = await determineEarlyFocusBlock(
        "https://www.example.com/feed",
        [activeSession()],
        { excludedHosts: [], categoryOverrides: { "example.com": "social" } },
    );

    assert.equal(decision.action, "block");
    assert.equal(
        decision.action === "block" && decision.reason,
        "user_block_rule",
    );
    assert.equal(decision.action === "block" && decision.category, "social");
    assert.equal(decision.action === "block" && decision.host, "example.com");
});

test("blocks user configured subdomain during active focus", async () => {
    const decision = await determineEarlyFocusBlock(
        "https://music.yandex.ru/home",
        [activeSession()],
        {
            excludedHosts: [],
            categoryOverrides: { "music.yandex.ru": "social" },
        },
    );

    assert.equal(decision.action, "block");
    assert.equal(
        decision.action === "block" && decision.reason,
        "user_block_rule",
    );
    assert.equal(decision.action === "block" && decision.category, "social");
    assert.equal(
        decision.action === "block" && decision.host,
        "music.yandex.ru",
    );
});

test("blocks from cached url decision buckets without network lookup", async () => {
    const domainHash = await hashedKey("d:example.com");
    await saveBuckets(
        [
            {
                prefix: domainHash.prefix,
                entries: [
                    {
                        suffix: domainHash.suffix,
                        decision: "block",
                        category: "social",
                        confidence: 1,
                        rank: 10,
                        pattern_type: "domain",
                        specificity: 1,
                    },
                ],
            },
        ],
        new Date(Date.now() + 60_000).toISOString(),
    );

    const decision = await determineEarlyFocusBlock(
        "https://example.com/feed",
        [activeSession()],
    );

    assert.equal(decision.action, "block");
    assert.equal(
        decision.action === "block" && decision.reason,
        "cached_decision",
    );
    assert.equal(decision.action === "block" && decision.category, "social");
});
