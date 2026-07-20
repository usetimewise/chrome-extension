import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const SPEECH_BUBBLE_PATH = "images/speech-bubble.svg";

test("exposes the speech bubble to content-script overlays", async () => {
    const manifestContent = await readFile(
        new URL("../../manifest.json", import.meta.url),
        "utf8",
    );
    const manifest: unknown = JSON.parse(manifestContent);

    assert.ok(manifest && typeof manifest === "object");
    const webAccessibleResources = Reflect.get(
        manifest,
        "web_accessible_resources",
    );
    assert.ok(Array.isArray(webAccessibleResources));

    const resourcePaths = webAccessibleResources.flatMap((entry: unknown) => {
        if (!entry || typeof entry !== "object") {
            return [];
        }

        const resources = Reflect.get(entry, "resources");
        return Array.isArray(resources)
            ? resources.filter(
                  (resource): resource is string =>
                      typeof resource === "string",
              )
            : [];
    });

    assert.ok(resourcePaths.includes(SPEECH_BUBBLE_PATH));
});
