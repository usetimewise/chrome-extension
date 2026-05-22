import assert from "node:assert/strict";
import test from "node:test";

import {
  buildActionVisualState,
  bucketProductivityScore,
  colorForProductivityScore,
  extractProductivityActionScore,
  normalizeProductivityScore
} from "../background/action/productivity-icon.js";
import type { DashboardCache } from "./types.js";

test("productivity action icon clamps scores and falls back to neutral state", () => {
  assert.equal(normalizeProductivityScore(-12), 0);
  assert.equal(normalizeProductivityScore(101), 100);
  assert.equal(normalizeProductivityScore(Number.NaN), null);

  const neutral = buildActionVisualState(null);
  assert.equal(neutral.badgeText, "");
  assert.equal(neutral.stateKey, "idle");
  assert.equal(neutral.title, "Focus Snapshot: collecting data");
});

test("productivity action icon buckets score colors in five point steps", () => {
  assert.equal(bucketProductivityScore(0), 0);
  assert.equal(bucketProductivityScore(24), 25);
  assert.equal(bucketProductivityScore(52), 50);
  assert.equal(bucketProductivityScore(100), 100);
});

test("productivity action icon color moves from red to green across the score range", () => {
  assert.equal(colorForProductivityScore(0), "#d45151");
  assert.equal(colorForProductivityScore(50), "#827856");
  assert.equal(colorForProductivityScore(100), "#2f9e5a");
  assert.equal(colorForProductivityScore(null), "#7b8794");
});

test("productivity action icon exposes stable visual state keys and reads dashboard score", () => {
  const cache = {
    overview: {
      today: {
        summary: {
          productivity_score: {
            value: 72,
            label: "Good",
            grade: "Grade B",
            message: "Productive browsing is clearly ahead of distractions."
          }
        }
      }
    }
  } as DashboardCache;

  assert.equal(extractProductivityActionScore(cache), 72);

  const first = buildActionVisualState(72);
  const second = buildActionVisualState(72);
  const changed = buildActionVisualState(73);

  assert.equal(first.badgeText, "72");
  assert.equal(first.iconBucket, 70);
  assert.equal(first.stateKey, second.stateKey);
  assert.notEqual(first.stateKey, changed.stateKey);
});
