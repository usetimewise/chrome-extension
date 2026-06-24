import assert from "node:assert/strict";
import test from "node:test";

import { isLocalSiteBlocked } from "./site-block-rules.js";

test("local block helper treats preference blocked hosts as blocked", () => {
    assert.equal(
        isLocalSiteBlocked("https://example.com/feed", {
            blockedHosts: ["example.com"],
            siteRules: { excludedHosts: [], categoryOverrides: {} },
        }),
        true,
    );
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
