import assert from "node:assert/strict";
import test from "node:test";

import {
    createFocusCompanionOverlayVariant,
    createFocusCompanionPreview,
    getFocusCompanion,
    getFocusCompanionTheme,
    isFocusCompanionId,
    listFocusCompanions,
} from "./focus-companions/index.js";
import { getFocusCompanionReplicaTexts } from "./i18n/focus-companions.js";

test("validates companion ids from the catalog", () => {
    assert.equal(isFocusCompanionId("ceo"), true);
    assert.equal(isFocusCompanionId("sgt"), true);
    assert.equal(isFocusCompanionId("cowboy"), true);
    assert.equal(isFocusCompanionId("unknown"), false);
    assert.equal(isFocusCompanionId(null), false);
});

test("falls back to ceo for unknown companion ids", () => {
    assert.equal(getFocusCompanion("unknown").id, "ceo");
    assert.equal(getFocusCompanion(null).id, "ceo");
});

test("provides theme metadata for every companion", () => {
    const companions = listFocusCompanions();

    for (const companion of companions) {
        assert.match(companion.theme.primary, /^#[0-9a-f]{6}$/i);
        assert.match(companion.theme.primaryHover, /^#[0-9a-f]{6}$/i);
        assert.match(companion.theme.soft, /^#[0-9a-f]{6}$/i);
        assert.match(companion.theme.softHover, /^#[0-9a-f]{6}$/i);
        assert.equal(companion.theme.accentText, companion.theme.primary);
        assert.equal(companion.theme.contrastText, "#ffffff");
    }
});

test("falls back to ceo theme for unknown companion ids", () => {
    const ceoTheme = getFocusCompanion("ceo").theme;

    assert.deepEqual(getFocusCompanionTheme("unknown"), ceoTheme);
    assert.deepEqual(getFocusCompanionTheme(null), ceoTheme);
});

test("lists companions with availability metadata and preview data", () => {
    const companions = listFocusCompanions();
    const ceo = companions.find((companion) => companion.id === "ceo");
    const sgt = companions.find((companion) => companion.id === "sgt");

    assert.ok(ceo);
    assert.equal(ceo.availability, "free");
    assert.ok(sgt);
    assert.equal(sgt.availability, "paid");

    const preview = createFocusCompanionPreview("ceo", {
        resolveAssetUrl: (path) => `chrome-extension://${path}`,
    });

    assert.equal(preview.id, "ceo");
    assert.equal(preview.name, "Corporate CEO");
    assert.equal(preview.role, "Corporate CEO");
    assert.equal(preview.visual.kind, "image");
    if (preview.visual.kind === "image") {
        assert.equal(
            preview.visual.src,
            "chrome-extension://images/ceo/ceo-s02-03.avif",
        );
    }
});

test("creates localized companion preview", () => {
    const preview = createFocusCompanionPreview("th", {
        language: "ru",
    });

    assert.equal(preview.name, "Терапевт");
    assert.equal(preview.role, "Терапевт");
    assert.equal(
        preview.description,
        "Поддерживающий и устойчивый. Называет паттерн и мягко перенаправляет.",
    );
});

test("creates deterministic overlay variant with image visual for ceo", () => {
    const variant = createFocusCompanionOverlayVariant("ceo", {
        randomInt: () => 1,
        resolveAssetUrl: (path) => `chrome-extension://${path}`,
    });

    assert.equal(variant.companionId, "ceo");
    assert.equal(variant.scenarioId, "2");
    assert.deepEqual(variant.theme, getFocusCompanion("ceo").theme);
    assert.equal(
        variant.text,
        "Twelve minutes of TikTok. That's a $40 mistake. Course-correct.",
    );
    assert.equal(variant.visual.kind, "image");
    if (variant.visual.kind === "image") {
        assert.equal(
            variant.visual.src,
            "chrome-extension://images/ceo/ceo-s02-02.avif",
        );
    }
});

test("selects one replica per overlay variant", () => {
    let calls = 0;
    const variant = createFocusCompanionOverlayVariant("ceo", {
        randomInt: () => {
            calls += 1;
            return 3;
        },
        resolveAssetUrl: (path) => `chrome-extension://${path}`,
    });

    assert.equal(calls, 1);
    assert.equal(
        variant.text,
        "You're optimizing for dopamine, not impact. Switch.",
    );
    assert.equal(variant.visual.kind, "image");
    if (variant.visual.kind === "image") {
        assert.equal(
            variant.visual.src,
            "chrome-extension://images/ceo/ceo-s02-04.avif",
        );
    }
});

test("creates overlay variant for an explicit replica index", () => {
    const variant = createFocusCompanionOverlayVariant("ceo", {
        scenarioId: "2",
        replicaIndex: 4,
        randomInt: () => {
            throw new Error("randomInt should not be called");
        },
        resolveAssetUrl: (path) => `chrome-extension://${path}`,
    });

    assert.equal(
        variant.text,
        "Top performers don't scroll during sprint hours.",
    );
    assert.equal(variant.visual.kind, "image");
    if (variant.visual.kind === "image") {
        assert.equal(
            variant.visual.src,
            "chrome-extension://images/ceo/ceo-s02-05.avif",
        );
    }
});

test("creates overlay variant for selected scenario", () => {
    const variant = createFocusCompanionOverlayVariant("sgt", {
        scenarioId: "3",
        randomInt: () => 0,
        resolveAssetUrl: (path) => `chrome-extension://${path}`,
    });

    assert.equal(variant.companionId, "sgt");
    assert.equal(variant.scenarioId, "3");
    assert.equal(
        variant.text,
        "Ten minutes wasted, soldier! Eyes back on the mission. NOW.",
    );
    assert.equal(variant.visual.kind, "image");
    if (variant.visual.kind === "image") {
        assert.equal(
            variant.visual.src,
            "chrome-extension://images/sgt/sgt-s03-01.avif",
        );
    }
});

test("creates localized overlay variant", () => {
    const variant = createFocusCompanionOverlayVariant("sgt", {
        language: "ru",
        scenarioId: "3",
        randomInt: () => 0,
    });

    assert.equal(
        variant.text,
        "Десять минут коту под хвост, боец! Глаза на задачу. БЫСТРО.",
    );
    assert.equal(variant.visual.kind, "image");
});

test("returns replica texts for every supported language", () => {
    assert.deepEqual(getFocusCompanionReplicaTexts("sgt", "3", 0), {
        en: "Ten minutes wasted, soldier! Eyes back on the mission. NOW.",
        ru: "Десять минут коту под хвост, боец! Глаза на задачу. БЫСТРО.",
    });
});
