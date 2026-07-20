import assert from "node:assert/strict";
import test from "node:test";

import {
    createTranslator,
    detectSystemLanguage,
    normalizeLanguage,
    resolveLanguage,
    translate,
} from "./i18n/index.js";

test("normalizes supported language codes", () => {
    assert.equal(normalizeLanguage("ru-RU"), "ru");
    assert.equal(normalizeLanguage("en-US"), "en");
    assert.equal(normalizeLanguage("de-DE"), null);
    assert.equal(normalizeLanguage(null), null);
});

test("detects system language from locale preference order", () => {
    assert.equal(detectSystemLanguage(["fr-FR", "ru-RU"]), "ru");
    assert.equal(detectSystemLanguage(["de-DE"]), "en");
});

test("resolves saved language before system language", () => {
    assert.equal(resolveLanguage("ru", ["en-US"]), "ru");
    assert.equal(resolveLanguage(undefined, ["ru-RU"]), "ru");
    assert.equal(resolveLanguage("de", ["en-US"]), "en");
});

test("translates messages with interpolation", () => {
    const t = createTranslator("ru");
    assert.equal(
        t("popup.removeHost", { host: "example.com" }),
        "Удалить example.com",
    );
    assert.equal(
        translate("en", "popup.blockedHostsCount", { count: 2 }),
        "2 sites in the list",
    );
});

test("translates the already blocked site hint", () => {
    assert.equal(
        translate("en", "popup.quickBlockAlreadyBlockedHint"),
        "You can unblock this site in Settings.",
    );
    assert.equal(
        translate("ru", "popup.quickBlockAlreadyBlockedHint"),
        "Разблокировать сайт можно в настройках.",
    );
});
