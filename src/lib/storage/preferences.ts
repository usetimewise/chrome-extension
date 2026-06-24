import { DISTRACTION_CATEGORIES, STORAGE_KEYS } from "../constants.js";
import { getAppSettings } from "../app-settings.js";
import { isFocusCompanionId } from "../focus-companions/index.js";
import { resolveLanguage } from "../i18n/index.js";
import { normalizeDisabledDefaultBlockRuleIds } from "../site-block-rules.js";
import {
    DEFAULT_FOCUS_SESSION_MINUTES,
    MAX_FOCUS_SESSION_MINUTES,
    MIN_FOCUS_SESSION_MINUTES,
} from "../local-focus-sessions.js";
import type {
    Category,
    Settings,
    SiteRuleState,
    UserPreferences,
} from "../types.js";
import { getFromStorage, setInStorage } from "./client.js";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
    selectedCompanionId: "ceo",
    defaultFocusMinutes: DEFAULT_FOCUS_SESSION_MINUTES,
    blockedHosts: [],
    disabledDefaultBlockRuleIds: [],
    language: resolveLanguage(null),
};

export function normalizePreferenceHost(value: string): string | null {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
        return null;
    }

    try {
        const parsed = new URL(
            trimmed.includes("://") ? trimmed : `https://${trimmed}`,
        );
        const host = parsed.hostname
            .trim()
            .toLowerCase()
            .replace(/^www\./, "")
            .replace(/\.$/, "");
        return host || null;
    } catch {
        return null;
    }
}

export function normalizeBlockedHosts(hosts: readonly string[]): string[] {
    return Array.from(
        new Set(
            hosts
                .map(normalizePreferenceHost)
                .filter((host): host is string => Boolean(host)),
        ),
    ).sort();
}

export function normalizeDefaultFocusMinutes(value: number): number {
    if (!Number.isFinite(value)) {
        return DEFAULT_FOCUS_SESSION_MINUTES;
    }

    return Math.min(
        MAX_FOCUS_SESSION_MINUTES,
        Math.max(MIN_FOCUS_SESSION_MINUTES, Math.round(value)),
    );
}

export function normalizeUserPreferences(
    value: Partial<UserPreferences> | null | undefined,
): UserPreferences {
    return {
        selectedCompanionId: isFocusCompanionId(value?.selectedCompanionId)
            ? value.selectedCompanionId
            : DEFAULT_USER_PREFERENCES.selectedCompanionId,
        defaultFocusMinutes: normalizeDefaultFocusMinutes(
            typeof value?.defaultFocusMinutes === "number"
                ? value.defaultFocusMinutes
                : DEFAULT_USER_PREFERENCES.defaultFocusMinutes,
        ),
        blockedHosts: normalizeBlockedHosts(
            Array.isArray(value?.blockedHosts) ? value.blockedHosts : [],
        ),
        disabledDefaultBlockRuleIds: normalizeDisabledDefaultBlockRuleIds(
            Array.isArray(value?.disabledDefaultBlockRuleIds)
                ? value.disabledDefaultBlockRuleIds
                : [],
        ),
        language: resolveLanguage(value?.language),
    };
}

export async function getUserPreferences(): Promise<UserPreferences> {
    const preferences = await getFromStorage<Partial<UserPreferences> | null>(
        STORAGE_KEYS.preferences,
        null,
    );
    return normalizeUserPreferences(preferences);
}

export async function saveUserPreferences(
    preferences: UserPreferences,
): Promise<UserPreferences> {
    const next = normalizeUserPreferences(preferences);
    await setInStorage(STORAGE_KEYS.preferences, next);
    return next;
}

export function buildEffectiveSettings(
    baseSettings: Settings,
    preferences: UserPreferences,
    siteRules: SiteRuleState,
): Settings {
    const blockedHosts = normalizeBlockedHosts(preferences.blockedHosts);
    const blockedCategoryOverrides: Record<string, Category> =
        Object.fromEntries(
            blockedHosts.map((host) => [host, "social" as const]),
        );

    return {
        ...baseSettings,
        selectedCompanionId: preferences.selectedCompanionId,
        defaultFocusMinutes: preferences.defaultFocusMinutes,
        language: preferences.language,
        blockedHosts,
        disabledDefaultBlockRuleIds: normalizeDisabledDefaultBlockRuleIds(
            preferences.disabledDefaultBlockRuleIds,
        ),
        excludedHosts: Array.from(
            new Set([
                ...baseSettings.excludedHosts,
                ...siteRules.excludedHosts,
            ]),
        ).sort(),
        categoryOverrides: {
            ...baseSettings.categoryOverrides,
            ...blockedCategoryOverrides,
            ...siteRules.categoryOverrides,
        },
    };
}

export function buildEffectiveSiteRules(
    siteRules: SiteRuleState | null | undefined,
    preferences: UserPreferences | null | undefined,
): SiteRuleState {
    const normalizedPreferences = normalizeUserPreferences(preferences);
    const settings = buildEffectiveSettings(
        getAppSettings(),
        normalizedPreferences,
        {
            excludedHosts: [...(siteRules?.excludedHosts || [])],
            categoryOverrides: { ...(siteRules?.categoryOverrides || {}) },
        },
    );

    return {
        excludedHosts: settings.excludedHosts,
        categoryOverrides: settings.categoryOverrides,
    };
}

export function isDistractionCategoryOverride(category: string): boolean {
    return DISTRACTION_CATEGORIES.has(category as Category);
}
