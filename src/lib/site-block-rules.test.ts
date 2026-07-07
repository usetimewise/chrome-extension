import assert from "node:assert/strict";
import test from "node:test";

import { decideDistractionSite, isLocalSiteBlocked } from "./site-block-rules.js";

test("local block helper treats preference blocked hosts as blocked", () => {
    assert.equal(
        isLocalSiteBlocked("https://example.com/feed", {
            blockedHosts: ["example.com"],
            siteRules: { excludedHosts: [], categoryOverrides: {} },
        }),
        true,
    );
});

test("forced example urls are blocked without user rules", async () => {
    const hardDecision = await decideDistractionSite("https://example.com/hard", {
        siteRules: { excludedHosts: [], categoryOverrides: {} },
        allowNetworkLookup: false,
    });
    assert.equal(hardDecision.action, "distracting");
    assert.equal(
        hardDecision.action === "distracting" && hardDecision.reason,
        "forced_rule",
    );
    assert.equal(
        hardDecision.action === "distracting" && hardDecision.matchedRule?.id,
        "forced:example-hard",
    );

    const softDecision = await decideDistractionSite(
        "https://example.com/soft?from=test",
        {
            siteRules: { excludedHosts: [], categoryOverrides: {} },
            allowNetworkLookup: false,
        },
    );
    assert.equal(softDecision.action, "distracting");
    assert.equal(
        softDecision.action === "distracting" && softDecision.reason,
        "forced_rule",
    );
    assert.equal(
        softDecision.action === "distracting" && softDecision.matchedRule?.id,
        "forced:example-soft",
    );
});

test("forced example urls do not match subdomains or child paths", async () => {
    const subdomainDecision = await decideDistractionSite(
        "https://docs.example.com/hard",
        {
            siteRules: { excludedHosts: [], categoryOverrides: {} },
            allowNetworkLookup: false,
        },
    );
    assert.deepEqual(subdomainDecision, {
        action: "allow",
        reason: "no_local_block_decision",
    });

    const childPathDecision = await decideDistractionSite(
        "https://example.com/soft/next",
        {
            siteRules: { excludedHosts: [], categoryOverrides: {} },
            allowNetworkLookup: false,
        },
    );
    assert.deepEqual(childPathDecision, {
        action: "allow",
        reason: "no_local_block_decision",
    });
});

test("local block helper treats distraction category overrides as blocked", () => {
    assert.equal(
        isLocalSiteBlocked("https://www.example.com/feed", {
            siteRules: {
                excludedHosts: [],
                categoryOverrides: { "example.com": "social" },
            },
        }),
        true,
    );
});

test("local block helper allows focus category overrides", () => {
    assert.equal(
        isLocalSiteBlocked("https://example.com/feed", {
            siteRules: {
                excludedHosts: [],
                categoryOverrides: { "example.com": "work" },
            },
        }),
        false,
    );
});

test("local block helper matches enabled default rules", () => {
    assert.equal(
        isLocalSiteBlocked("https://www.reddit.com/r/typescript", {
            siteRules: { excludedHosts: [], categoryOverrides: {} },
        }),
        true,
    );

    assert.equal(
        isLocalSiteBlocked("https://www.youtube.com/shorts/abc", {
            siteRules: { excludedHosts: [], categoryOverrides: {} },
        }),
        true,
    );
});

test("local block helper ignores disabled default rules", () => {
    assert.equal(
        isLocalSiteBlocked("https://www.youtube.com/shorts/abc", {
            siteRules: { excludedHosts: [], categoryOverrides: {} },
            disabledDefaultBlockRuleIds: ["default:youtube-shorts"],
        }),
        false,
    );
});
