import { STORAGE_KEYS } from "../../lib/constants.js";
import { buildEffectiveSiteRules } from "../../lib/storage/preferences.js";
import type {
    FocusDistractionCountersState,
    FocusSession,
    SiteRuleState,
    UserPreferences,
} from "../../lib/types.js";

export type FocusBlockerStorageSnapshot = {
    sessions: FocusSession[];
    siteRules: SiteRuleState | null;
    disabledDefaultBlockRuleIds: string[];
    focusDistractionCounters: FocusDistractionCountersState["counters"];
};

export async function readFocusBlockerStorage(): Promise<FocusBlockerStorageSnapshot> {
    const values = await chrome.storage.local.get([
        STORAGE_KEYS.focusDistractionCounters,
        STORAGE_KEYS.focusSessions,
        STORAGE_KEYS.preferences,
        STORAGE_KEYS.siteRules,
    ]);
    const storedSiteRules =
        (values[STORAGE_KEYS.siteRules] as SiteRuleState | null) || null;
    const preferences =
        (values[STORAGE_KEYS.preferences] as UserPreferences | null) || null;
    const sessions = Array.isArray(values[STORAGE_KEYS.focusSessions])
        ? (values[STORAGE_KEYS.focusSessions] as FocusSession[])
        : [];
    const activeSession =
        sessions.find((session) => session.status === "active") || null;
    const storedCounters = values[STORAGE_KEYS.focusDistractionCounters] as
        | Partial<FocusDistractionCountersState>
        | null
        | undefined;

    return {
        sessions,
        siteRules: buildEffectiveSiteRules(storedSiteRules, preferences),
        disabledDefaultBlockRuleIds: Array.isArray(
            preferences?.disabledDefaultBlockRuleIds,
        )
            ? preferences.disabledDefaultBlockRuleIds
            : [],
        focusDistractionCounters:
            storedCounters?.sessionId === activeSession?.id
                ? storedCounters.counters || {}
                : {},
    };
}
