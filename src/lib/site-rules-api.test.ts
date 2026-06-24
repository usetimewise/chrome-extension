import assert from "node:assert/strict";
import test from "node:test";

import { classifySites } from "./api/site-rules.js";

test("classifySites posts domains and returns partial failures", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = (async (
        url: string | URL | Request,
        init?: RequestInit,
    ) => {
        calls.push({ url: String(url), init });
        return {
            ok: true,
            async json() {
                return {
                    results: [
                        { domain: "github.com", category: "work" },
                        { domain: "broken.example", error: "timeout" },
                    ],
                };
            },
        } as Response;
    }) as typeof fetch;

    const response = await classifySites(
        "https://api.example.com",
        "device-1",
        ["github.com", "broken.example"],
    );

    assert.deepEqual(response.results, [
        { domain: "github.com", category: "work" },
        { domain: "broken.example", error: "timeout" },
    ]);
    assert.equal(calls[0]?.url, "https://api.example.com/v1/sites/classify");
    assert.equal(calls[0]?.init?.method, "POST");
    assert.equal(
        calls[0]?.init?.headers &&
            (calls[0].init.headers as Record<string, string>)["X-Device-Id"],
        "device-1",
    );
    assert.equal(
        calls[0]?.init?.body,
        JSON.stringify({ domains: ["github.com", "broken.example"] }),
    );
});
