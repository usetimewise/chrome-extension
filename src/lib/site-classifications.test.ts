import assert from "node:assert/strict";
import test from "node:test";

import {
  classificationBackoffDelayMs,
  effectiveCategoryForHost,
  ensureSiteClassificationPending,
  getHostsReadyForClassification,
  getSiteClassifications,
  selectHostsForForcedClassification,
  scheduleSiteClassificationRetry
} from "./storage/site-classifications.js";

let storage: Record<string, unknown> = {};

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function installChromeStorageMock() {
  globalThis.chrome = {
    storage: {
      local: {
        async get(keys: string | string[]) {
          if (Array.isArray(keys)) {
            return Object.fromEntries(keys.map((key) => [key, clone(storage[key])]));
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
        }
      }
    }
  } as typeof chrome;
}

test.beforeEach(() => {
  storage = {};
  installChromeStorageMock();
});

test("effectiveCategoryForHost respects exclude then manual override then backend then other", () => {
  assert.equal(effectiveCategoryForHost("docs.example.com", {
    excludedHosts: ["example.com"],
    categoryOverrides: { "docs.example.com": "work" },
    classifiedCategory: "learning"
  }), "excluded");

  assert.equal(effectiveCategoryForHost("docs.example.com", {
    categoryOverrides: { "example.com": "work" },
    classifiedCategory: "learning"
  }), "work");

  assert.equal(effectiveCategoryForHost("docs.example.com", {
    classifiedCategory: "learning"
  }), "learning");

  assert.equal(effectiveCategoryForHost("docs.example.com"), "other");
});

test("classification retry backoff doubles and caps at twenty four hours", () => {
  assert.equal(classificationBackoffDelayMs(1), 30_000);
  assert.equal(classificationBackoffDelayMs(2), 60_000);
  assert.equal(classificationBackoffDelayMs(3), 120_000);
  assert.equal(classificationBackoffDelayMs(20), 24 * 60 * 60 * 1000);
});

test("classification retries persist in storage and stop after twenty attempts", async () => {
  await ensureSiteClassificationPending("example.com");
  for (let index = 0; index < 20; index += 1) {
    await scheduleSiteClassificationRetry("example.com", `error-${index}`);
  }

  const state = await getSiteClassifications();
  assert.equal(state.byHost["example.com"]?.attempts, 20);
  assert.equal(state.byHost["example.com"]?.status, "failed");
  assert.equal(state.byHost["example.com"]?.nextRetryAt, null);
});

test("ready hosts are restored from storage after restart", async () => {
  await ensureSiteClassificationPending("pending.example");
  await ensureSiteClassificationPending("retry.example");
  await scheduleSiteClassificationRetry("retry.example", "temporary");

  const state = await getSiteClassifications();
  state.byHost["retry.example"].nextRetryAt = new Date(Date.now() - 1_000).toISOString();
  storage["twt_site_classifications_v1"] = clone(state);

  assert.deepEqual(await getHostsReadyForClassification(10), ["pending.example", "retry.example"]);
});

test("forced classification selector includes pending retry_scheduled and failed hosts only", () => {
  assert.deepEqual(selectHostsForForcedClassification({
    byHost: {
      "pending.example": {
        category: "other",
        status: "pending",
        attempts: 0,
        nextRetryAt: null,
        lastError: null,
        updatedAt: "2026-05-20T00:00:00.000Z"
      },
      "retry.example": {
        category: "other",
        status: "retry_scheduled",
        attempts: 2,
        nextRetryAt: "2099-01-01T00:00:00.000Z",
        lastError: "temporary",
        updatedAt: "2026-05-20T00:00:00.000Z"
      },
      "failed.example": {
        category: "other",
        status: "failed",
        attempts: 20,
        nextRetryAt: null,
        lastError: "final",
        updatedAt: "2026-05-20T00:00:00.000Z"
      },
      "resolved.example": {
        category: "work",
        status: "resolved",
        attempts: 1,
        nextRetryAt: null,
        lastError: null,
        updatedAt: "2026-05-20T00:00:00.000Z"
      }
    }
  }), ["failed.example", "pending.example", "retry.example"]);
});
