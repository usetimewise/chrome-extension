import type { Category, RuntimeState } from "./types.js";

export const STORAGE_KEYS = {
    device: "zalipoff_device_v2",
    runtimeState: "zalipoff_runtime_state_v2",
    focusSessions: "zalipoff_focus_sessions_v1",
    focusDistractionCounters: "zalipoff_focus_distraction_counters_v1",
    preferences: "zalipoff_preferences_v1",
    siteRules: "zalipoff_site_rules_v1",
    siteClassifications: "zalipoff_site_classifications_v1",
    siteDecisionCache: "zalipoff_site_decision_cache_v1",
} as const;

export const MESSAGE_TYPES = {
    getBootstrap: "GET_BOOTSTRAP",
    getFocusDistractionCounters: "GET_FOCUS_DISTRACTION_COUNTERS",
    retrySiteClassifications: "RETRY_SITE_CLASSIFICATIONS",
    startFocusSession: "START_FOCUS_SESSION",
    endFocusSession: "END_FOCUS_SESSION",
    savePreferences: "SAVE_PREFERENCES",
    saveSiteRule: "SAVE_SITE_RULE",
    closeCurrentTab: "CLOSE_CURRENT_TAB",
    forceFocusNudge: "FORCE_FOCUS_NUDGE",
    showFocusNudge: "SHOW_FOCUS_NUDGE",
    dismissFocusOffer: "DISMISS_FOCUS_OFFER",
    focusBlockerBlocked: "FOCUS_BLOCKER_BLOCKED",
} as const;

export const DEFAULT_RUNTIME_STATE: RuntimeState = {
    currentHost: null,
    currentUrl: null,
    currentTabId: null,
    currentTabTitle: null,
    currentWindowId: null,
    currentHostStartedAt: null,
    focusNudgeNotifications: {
        sessionId: null,
        hosts: {},
        lastSoftUrl: null,
    },
    focusOfferPromptEvents: [],
};

export const CATEGORY_LABELS: Record<Category, string> = {
    work: "Work",
    communication: "Communication",
    learning: "Learning",
    social: "Social",
    entertainment: "Entertainment",
    shopping: "Shopping",
    news: "News",
    tools: "Tools",
    other: "Other",
    excluded: "Excluded",
};

export const FOCUS_CATEGORIES = new Set<Category>([
    "work",
    "learning",
    "tools",
]);
export const DISTRACTION_CATEGORIES = new Set<Category>([
    "social",
    "entertainment",
    "shopping",
    "news",
]);
