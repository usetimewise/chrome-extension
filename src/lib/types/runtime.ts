import type {
    Category,
    SiteClassificationState,
    SiteRuleState,
} from "./activity.js";
import type { FocusSession } from "./focus.js";
import type { FocusCompanionId } from "../focus-companions/index.js";
import type { AppLanguage } from "../i18n/index.js";

export type NudgeSensitivity = "direct" | "balanced" | "gentle";

export interface Settings {
    apiBaseUrl: string;
    timezone: string;
    workHoursStart: string;
    workHoursEnd: string;
    workdays: number[];
    deepWorkBlocks: Array<{ start: string; end: string }>;
    nudgesEnabled: boolean;
    nudgeSensitivity: NudgeSensitivity;
    snoozeMinutes: number;
    workHoursOnly: boolean;
    aiInsightsEnabled: boolean;
    aiTone: string;
    excludedHosts: string[];
    categoryOverrides: Record<string, Category>;
    selectedCompanionId: FocusCompanionId;
    defaultFocusMinutes: number;
    blockedHosts: string[];
    disabledDefaultBlockRuleIds: string[];
    language: AppLanguage;
}

export interface UserPreferences {
    selectedCompanionId: FocusCompanionId;
    defaultFocusMinutes: number;
    blockedHosts: string[];
    disabledDefaultBlockRuleIds: string[];
    language: AppLanguage;
}

export interface DeviceState {
    installationId: string;
    deviceId: string | null;
    registeredAt: string | null;
}

export interface RuntimeState {
    currentHost: string | null;
    currentUrl: string | null;
    currentTabId: number | null;
    currentTabTitle?: string | null;
    currentWindowId?: number | null;
    currentHostStartedAt: number | null;
    focusNudgeNotifications: {
        sessionId: string | null;
        hosts: Record<string, number>;
    };
    focusOfferPromptEvents: FocusOfferPromptEvent[];
}

export type FocusOfferPromptEventType =
    | "shown"
    | "deferred"
    | "closed"
    | "started";

export interface FocusOfferPromptEvent {
    type: FocusOfferPromptEventType;
    at: number;
    host: string;
}

export interface BootstrapResponse {
    settings?: Settings;
    device?: DeviceState;
    lastError?: string | null;
    runtimeState?: RuntimeState;
    focusSessions?: FocusSession[];
    siteRules?: SiteRuleState;
    siteClassifications?: SiteClassificationState;
    popupModel?: PopupModel;
}

export interface RetrySiteClassificationsResponse {
    retriedCount: number;
    siteClassifications: SiteClassificationState;
    lastError: string | null;
}

export interface PopupModel {
    state: "empty" | "focus_active";
    statusLabel: string;
    statusMessage: string;
    currentSite: {
        host: string;
        category: Category;
    } | null;
    focusSession: FocusSession | null;
    primaryAction: {
        type: string;
        label: string;
    };
    secondaryActions: Array<{
        type: string;
        label: string;
    }>;
    canReclassify: boolean;
}
