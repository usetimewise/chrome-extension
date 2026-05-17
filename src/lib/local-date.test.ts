import assert from "node:assert/strict";
import test from "node:test";

import {
  localDateKey,
  localHour,
  resetLocalDateFormatterCacheForTests,
  utcInstantForLocalTime
} from "./local-date.js";

test.beforeEach(() => {
  resetLocalDateFormatterCacheForTests();
});

test("localDateKey handles UTC and Asia/Almaty day boundaries", () => {
  const instant = new Date("2026-05-13T19:30:00.000Z");

  assert.equal(localDateKey(instant, "UTC"), "2026-05-13");
  assert.equal(localDateKey(instant, "Asia/Almaty"), "2026-05-14");
});

test("localHour uses the cached timezone formatter consistently across repeated calls", () => {
  const instant = new Date("2026-05-14T04:15:00.000Z");

  assert.equal(localHour(instant, "Asia/Almaty"), 9);
  assert.equal(localHour(instant, "Asia/Almaty"), 9);
  assert.equal(localDateKey(instant, "Asia/Almaty"), "2026-05-14");
});

test("utcInstantForLocalTime resolves real UTC instants for local bucket starts", () => {
  assert.equal(
    utcInstantForLocalTime("2026-05-14", 0, "Asia/Almaty"),
    "2026-05-13T19:00:00.000Z"
  );
  assert.equal(
    utcInstantForLocalTime("2026-05-14", 0, "UTC"),
    "2026-05-14T00:00:00.000Z"
  );
});
