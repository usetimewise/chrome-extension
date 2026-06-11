import assert from "node:assert/strict";
import test from "node:test";

import {
  createFocusCompanionOverlayVariant,
  createFocusCompanionPreview,
  getFocusCompanion,
  isFocusCompanionId,
  listFocusCompanions
} from "./focus-companions/index.js";

test("validates companion ids from the catalog", () => {
  assert.equal(isFocusCompanionId("ceo"), true);
  assert.equal(isFocusCompanionId("mentor"), true);
  assert.equal(isFocusCompanionId("unknown"), false);
  assert.equal(isFocusCompanionId(null), false);
});

test("falls back to ceo for unknown companion ids", () => {
  assert.equal(getFocusCompanion("unknown").id, "ceo");
  assert.equal(getFocusCompanion(null).id, "ceo");
});

test("lists companions with availability metadata and preview data", () => {
  const companions = listFocusCompanions();
  const ceo = companions.find((companion) => companion.id === "ceo");
  const mentor = companions.find((companion) => companion.id === "mentor");

  assert.ok(ceo);
  assert.equal(ceo.availability, "free");
  assert.ok(mentor);
  assert.equal(mentor.availability, "paid");

  const preview = createFocusCompanionPreview("ceo", {
    resolveAssetUrl: (path) => `chrome-extension://${path}`
  });

  assert.equal(preview.id, "ceo");
  assert.equal(preview.visual.kind, "image");
  if (preview.visual.kind === "image") {
    assert.equal(preview.visual.src, "chrome-extension://images/ceo/ceo-s02p03-watch-tap.png");
  }
});

test("creates deterministic overlay variant with image visual for ceo", () => {
  const variant = createFocusCompanionOverlayVariant("ceo", {
    randomInt: () => 1,
    resolveAssetUrl: (path) => `chrome-extension://${path}`
  });

  assert.equal(variant.companionId, "ceo");
  assert.equal(variant.text, "Entertainment is not on the roadmap. Close the tab.");
  assert.equal(variant.visual.kind, "image");
  if (variant.visual.kind === "image") {
    assert.equal(variant.visual.src, "chrome-extension://images/ceo/ceo-s02p02-phone-no.png");
  }
});

test("creates overlay variant with avatar visual for companions without image assets", () => {
  const variant = createFocusCompanionOverlayVariant("mentor", {
    randomInt: () => 0
  });

  assert.equal(variant.companionId, "mentor");
  assert.equal(variant.text, "You chose focus for a reason. Come back to the task.");
  assert.equal(variant.visual.kind, "avatar");
  if (variant.visual.kind === "avatar") {
    assert.equal(variant.visual.text, "Н");
    assert.equal(variant.visual.colorClass, "emerald");
  }
});
