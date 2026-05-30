import assert from "node:assert/strict";
import test from "node:test";

import { decideSite } from "./api/site-decision.js";

test("decideSite posts focus decision request and parses matched rule", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      async json() {
        return {
          decision: "block",
          category: "short_video",
          confidence: 1,
          matchedRule: {
            pattern: "youtube.com/shorts",
            patternType: "url_prefix"
          }
        };
      }
    } as Response;
  }) as typeof fetch;

  const response = await decideSite("https://api.example.com", "device-1", {
    url: "https://youtube.com/shorts/abc",
    focus_mode: "normal",
    tab_title: "Shorts"
  });

  assert.equal(response.matchedRule?.patternType, "url_prefix");
  assert.equal(calls[0]?.url, "https://api.example.com/v1/sites/decision");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.headers && (calls[0].init.headers as Record<string, string>)["X-Device-Id"], "device-1");
  assert.equal(calls[0]?.init?.body, JSON.stringify({
    url: "https://youtube.com/shorts/abc",
    focus_mode: "normal",
    tab_title: "Shorts"
  }));
});
