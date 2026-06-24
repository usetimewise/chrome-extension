import { STORAGE_KEYS } from "../constants.js";
import { getAppSettings } from "../app-settings.js";
import type { Category, Settings, SiteRuleState } from "../types.js";
import { hostMatchesRule } from "../utils.js";
import { getFromStorage, setInStorage } from "./client.js";
import { buildEffectiveSettings, getUserPreferences } from "./preferences.js";

export async function getSiteRules(): Promise<SiteRuleState> {
    const rules = await getFromStorage<SiteRuleState | null>(
        STORAGE_KEYS.siteRules,
        null,
    );
    return {
        excludedHosts: [...(rules?.excludedHosts || [])],
        categoryOverrides: { ...(rules?.categoryOverrides || {}) },
    };
}

export async function saveSiteRule(
    host: string,
    category?: Category,
    excluded = false,
): Promise<SiteRuleState> {
    const normalizedHost = String(host || "")
        .trim()
        .toLowerCase();
    if (!normalizedHost) {
        throw new Error("host is required");
    }

    const rules = await getSiteRules();
    const excludedHosts = rules.excludedHosts.filter(
        (rule) =>
            !hostMatchesRule(normalizedHost, rule) && rule !== normalizedHost,
    );
    const categoryOverrides = { ...rules.categoryOverrides };
    delete categoryOverrides[normalizedHost];

    if (excluded) {
        excludedHosts.push(normalizedHost);
    } else if (category) {
        categoryOverrides[normalizedHost] = category;
    }

    const next: SiteRuleState = {
        excludedHosts: Array.from(new Set(excludedHosts)).sort(),
        categoryOverrides,
    };
    await setInStorage(STORAGE_KEYS.siteRules, next);
    return next;
}

export async function getSettings(): Promise<Settings> {
    const settings = getAppSettings();
    const [siteRules, preferences] = await Promise.all([
        getSiteRules(),
        getUserPreferences(),
    ]);
    return buildEffectiveSettings(settings, preferences, siteRules);
}
