import { MESSAGE_TYPES } from "../constants.js";
import { normalizeLanguage } from "../i18n/index.js";
import { isPlainObject } from "../utils.js";
import type {
  BootstrapResponse,
  Category,
  FocusSession,
  RetrySiteClassificationsResponse,
  SiteRuleState,
  UserPreferences
} from "../types.js";

export type BackgroundBootstrapRequest = {
  type: typeof MESSAGE_TYPES.getBootstrap;
};

export type BackgroundRetrySiteClassificationsRequest = {
  type: typeof MESSAGE_TYPES.retrySiteClassifications;
};

export type BackgroundStartFocusSessionRequest = {
  type: typeof MESSAGE_TYPES.startFocusSession;
  intent?: string;
};

export type BackgroundEndFocusSessionRequest = {
  type: typeof MESSAGE_TYPES.endFocusSession;
  sessionId: string;
};

export type BackgroundSavePreferencesRequest = {
  type: typeof MESSAGE_TYPES.savePreferences;
  preferences: UserPreferences;
};

export type BackgroundSaveSiteRuleRequest = {
  type: typeof MESSAGE_TYPES.saveSiteRule;
  host: string;
  category: Category;
  excluded: boolean;
};

export type BackgroundCloseCurrentTabRequest = {
  type: typeof MESSAGE_TYPES.closeCurrentTab;
};

export type BackgroundForceFocusNudgeRequest = {
  type: typeof MESSAGE_TYPES.forceFocusNudge;
};

export type BackgroundFocusBlockerBlockedRequest = {
  type: typeof MESSAGE_TYPES.focusBlockerBlocked;
  sessionId: string;
  host: string;
  category: string;
};

export type BackgroundDismissFocusOfferRequest = {
  type: typeof MESSAGE_TYPES.dismissFocusOffer;
  action: "defer" | "close";
  host: string;
};

export type BackgroundRequest =
  | BackgroundBootstrapRequest
  | BackgroundRetrySiteClassificationsRequest
  | BackgroundStartFocusSessionRequest
  | BackgroundEndFocusSessionRequest
  | BackgroundSavePreferencesRequest
  | BackgroundSaveSiteRuleRequest
  | BackgroundCloseCurrentTabRequest
  | BackgroundForceFocusNudgeRequest
  | BackgroundFocusBlockerBlockedRequest
  | BackgroundDismissFocusOfferRequest;

export type BackgroundRequestType = BackgroundRequest["type"];

export type BackgroundRequestOf<TType extends BackgroundRequestType> = Extract<BackgroundRequest, { type: TType }>;

export interface BackgroundErrorResponse {
  ok: false;
  error: string;
}

export function isBackgroundErrorResponse(value: unknown): value is BackgroundErrorResponse {
  return isPlainObject(value) && value.ok === false && typeof value.error === "string";
}

export interface BackgroundFocusSessionResponse {
  ok: true;
  session: FocusSession;
  bootstrap: BootstrapResponse;
}

export interface BackgroundSaveSiteRuleResponse {
  ok: true;
  payload: SiteRuleState;
  bootstrap: BootstrapResponse;
}

export interface BackgroundSavePreferencesResponse {
  ok: true;
  payload: UserPreferences;
  bootstrap: BootstrapResponse;
}

export interface BackgroundCloseCurrentTabResponse {
  ok: true;
}

export interface BackgroundForceFocusNudgeResponse {
  ok: true;
  response: unknown;
}

export interface BackgroundFocusBlockerBlockedResponse {
  ok: true;
  response: unknown;
}

export type BackgroundSuccessResponseMap = {
  [MESSAGE_TYPES.getBootstrap]: BootstrapResponse;
  [MESSAGE_TYPES.retrySiteClassifications]: RetrySiteClassificationsResponse;
  [MESSAGE_TYPES.startFocusSession]: BackgroundFocusSessionResponse;
  [MESSAGE_TYPES.endFocusSession]: BackgroundFocusSessionResponse;
  [MESSAGE_TYPES.savePreferences]: BackgroundSavePreferencesResponse;
  [MESSAGE_TYPES.saveSiteRule]: BackgroundSaveSiteRuleResponse;
  [MESSAGE_TYPES.closeCurrentTab]: BackgroundCloseCurrentTabResponse;
  [MESSAGE_TYPES.forceFocusNudge]: BackgroundForceFocusNudgeResponse;
  [MESSAGE_TYPES.focusBlockerBlocked]: BackgroundFocusBlockerBlockedResponse;
  [MESSAGE_TYPES.dismissFocusOffer]: BackgroundCloseCurrentTabResponse;
};

export type BackgroundSuccessResponse<TType extends BackgroundRequestType> = BackgroundSuccessResponseMap[TType];

export type BackgroundResponse<TType extends BackgroundRequestType> =
  | BackgroundSuccessResponse<TType>
  | BackgroundErrorResponse;

export type ContentShowFocusNudgeRequest = {
  type: typeof MESSAGE_TYPES.showFocusNudge;
  mode: "block";
  sessionId: string;
  message: string;
  host: string;
  category: string;
} | {
  type: typeof MESSAGE_TYPES.showFocusNudge;
  mode: "offer";
  message: string;
  host: string;
  category: string;
};

export type ContentRequest = ContentShowFocusNudgeRequest;

export type ContentRequestType = ContentRequest["type"];

export type ContentRequestOf<TType extends ContentRequestType> = Extract<ContentRequest, { type: TType }>;

export interface ContentShowFocusNudgeResponse {
  ok: true;
}

export type ContentResponseMap = {
  [MESSAGE_TYPES.showFocusNudge]: ContentShowFocusNudgeResponse;
};

export type ContentResponse<TType extends ContentRequestType> = ContentResponseMap[TType];

function isValidMessageType(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isRequiredString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && [
    "work",
    "communication",
    "learning",
    "social",
    "entertainment",
    "shopping",
    "news",
    "tools",
    "other",
    "excluded"
  ].includes(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isUserPreferences(value: unknown): value is UserPreferences {
  return isPlainObject(value) &&
    typeof value.selectedCompanionId === "string" &&
    typeof value.defaultFocusMinutes === "number" &&
    Number.isFinite(value.defaultFocusMinutes) &&
    isStringArray(value.blockedHosts) &&
    (value.disabledDefaultBlockRuleIds === undefined || isStringArray(value.disabledDefaultBlockRuleIds)) &&
    normalizeLanguage(value.language) !== null;
}

export function isBackgroundRequest(value: unknown): value is BackgroundRequest {
  if (!isPlainObject(value) || !isValidMessageType(value.type)) {
    return false;
  }

  switch (value.type) {
    case MESSAGE_TYPES.getBootstrap:
    case MESSAGE_TYPES.retrySiteClassifications:
    case MESSAGE_TYPES.forceFocusNudge:
    case MESSAGE_TYPES.closeCurrentTab:
      return true;
    case MESSAGE_TYPES.startFocusSession:
      return isOptionalString(value.intent);
    case MESSAGE_TYPES.endFocusSession:
      return isRequiredString(value.sessionId);
    case MESSAGE_TYPES.savePreferences:
      return isUserPreferences(value.preferences);
    case MESSAGE_TYPES.saveSiteRule:
      return isRequiredString(value.host) && isCategory(value.category) && typeof value.excluded === "boolean";
    case MESSAGE_TYPES.focusBlockerBlocked:
      return isRequiredString(value.sessionId) &&
        isRequiredString(value.host) &&
        isRequiredString(value.category);
    case MESSAGE_TYPES.dismissFocusOffer:
      return (value.action === "defer" || value.action === "close") &&
        isRequiredString(value.host);
    default:
      return false;
  }
}

export function isContentRequest(value: unknown): value is ContentRequest {
  if (!isPlainObject(value) || !isValidMessageType(value.type)) {
    return false;
  }

  switch (value.type) {
    case MESSAGE_TYPES.showFocusNudge:
      if (!isRequiredString(value.message) ||
        !isRequiredString(value.host) ||
        !isRequiredString(value.category)) {
        return false;
      }

      if (value.mode === "offer") {
        return true;
      }

      return value.mode === "block" && isRequiredString(value.sessionId);
    default:
      return false;
  }
}
