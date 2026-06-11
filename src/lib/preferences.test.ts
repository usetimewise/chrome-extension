import assert from "node:assert/strict";
import test from "node:test";

import { APP_SETTINGS } from "./app-settings.js";
import { STORAGE_KEYS } from "./constants.js";
import {
  buildEffectiveSettings,
  getUserPreferences,
  normalizeBlockedHosts,
  normalizePreferenceHost,
  saveUserPreferences
} from "./storage/preferences.js";

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
  installChromeMock();
});

test("normalizes blocked host input to hostname", () => {
  assert.equal(normalizePreferenceHost("example.com"), "example.com");
  assert.equal(normalizePreferenceHost("https://www.example.com/path?q=1"), "example.com");
  assert.equal(normalizePreferenceHost("WWW.Example.COM/abc"), "example.com");
  assert.equal(normalizePreferenceHost(""), null);
});

test("saves normalized preferences and removes duplicate blocked hosts", async () => {
  const preferences = await saveUserPreferences({
    selectedCompanionId: "mentor",
    defaultFocusMinutes: 26.4,
    blockedHosts: ["https://www.example.com/path", "example.com", "reddit.com/"],
    language: "ru"
  });

  assert.deepEqual(preferences, {
    selectedCompanionId: "mentor",
    defaultFocusMinutes: 26,
    blockedHosts: ["example.com", "reddit.com"],
    language: "ru"
  });
  assert.deepEqual(await getUserPreferences(), preferences);
  assert.deepEqual(storage[STORAGE_KEYS.preferences], preferences);
});

test("normalizes invalid companion id to default companion", async () => {
  storage[STORAGE_KEYS.preferences] = {
    selectedCompanionId: "unknown",
    defaultFocusMinutes: 20,
    blockedHosts: []
  };

  const preferences = await getUserPreferences();
  assert.equal(preferences.selectedCompanionId, "ceo");
});

test("normalizes missing and invalid language to default language", async () => {
  storage[STORAGE_KEYS.preferences] = {
    selectedCompanionId: "ceo",
    defaultFocusMinutes: 20,
    blockedHosts: [],
    language: "de"
  };

  assert.equal((await getUserPreferences()).language, "en");

  storage[STORAGE_KEYS.preferences] = {
    selectedCompanionId: "ceo",
    defaultFocusMinutes: 20,
    blockedHosts: []
  };

  assert.equal((await getUserPreferences()).language, "en");
});

test("builds effective settings from app settings, preferences, and site rules", () => {
  const effective = buildEffectiveSettings(
    APP_SETTINGS,
    {
      selectedCompanionId: "coach",
      defaultFocusMinutes: 45,
      blockedHosts: normalizeBlockedHosts(["reddit.com", "https://www.youtube.com/watch"]),
      language: "ru"
    },
    {
      excludedHosts: ["docs.example.com"],
      categoryOverrides: { "youtube.com": "work" }
    }
  );

  assert.equal(effective.selectedCompanionId, "coach");
  assert.equal(effective.defaultFocusMinutes, 45);
  assert.equal(effective.language, "ru");
  assert.deepEqual(effective.blockedHosts, ["reddit.com", "youtube.com"]);
  assert.deepEqual(effective.excludedHosts, ["docs.example.com"]);
  assert.equal(effective.categoryOverrides["reddit.com"], "social");
  assert.equal(effective.categoryOverrides["youtube.com"], "work");
});
