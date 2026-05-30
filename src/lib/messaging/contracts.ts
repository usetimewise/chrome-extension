import { MESSAGE_TYPES } from "../constants.js";
import { isPlainObject } from "../utils.js";
import type {
  BootstrapResponse,
  Category,
  DashboardCache,
  FocusSession,
  MediaStateResponse,
  PopupModel,
  RetrySiteClassificationsResponse,
  SiteRuleState
} from "../types.js";

export type BackgroundBootstrapRequest = {
  type: typeof MESSAGE_TYPES.getBootstrap;
};

export type BackgroundDebugStateRequest = {
  type: typeof MESSAGE_TYPES.getDebugState;
};

export type BackgroundRefreshViewsRequest = {
  type: typeof MESSAGE_TYPES.refreshViews;
};

export type BackgroundSyncNowRequest = {
  type: typeof MESSAGE_TYPES.syncNow;
};

export type BackgroundRetrySiteClassificationsRequest = {
  type: typeof MESSAGE_TYPES.retrySiteClassifications;
};

export type BackgroundStartFocusSessionRequest = {
  type: typeof MESSAGE_TYPES.startFocusSession;
  intent?: string;
  minutes?: number;
};

export type BackgroundPauseFocusSessionRequest = {
  type: typeof MESSAGE_TYPES.pauseFocusSession;
  sessionId: string;
};

export type BackgroundResumeFocusSessionRequest = {
  type: typeof MESSAGE_TYPES.resumeFocusSession;
  sessionId: string;
};

export type BackgroundEndFocusSessionRequest = {
  type: typeof MESSAGE_TYPES.endFocusSession;
  sessionId: string;
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

export type BackgroundMediaStateUpdateRequest = {
  type: typeof MESSAGE_TYPES.mediaStateUpdate;
  isPlayingMedia: boolean;
};

export type BackgroundRequest =
  | BackgroundBootstrapRequest
  | BackgroundDebugStateRequest
  | BackgroundRefreshViewsRequest
  | BackgroundSyncNowRequest
  | BackgroundRetrySiteClassificationsRequest
  | BackgroundStartFocusSessionRequest
  | BackgroundPauseFocusSessionRequest
  | BackgroundResumeFocusSessionRequest
  | BackgroundEndFocusSessionRequest
  | BackgroundSaveSiteRuleRequest
  | BackgroundCloseCurrentTabRequest
  | BackgroundForceFocusNudgeRequest
  | BackgroundMediaStateUpdateRequest;

export type BackgroundRequestType = BackgroundRequest["type"];

export type BackgroundRequestOf<TType extends BackgroundRequestType> = Extract<BackgroundRequest, { type: TType }>;

export interface BackgroundErrorResponse {
  ok: false;
  error: string;
}

export interface BackgroundRefreshViewsResponse {
  dashboardCache: DashboardCache;
  popupModel: PopupModel;
}

export interface BackgroundSyncNowResponse extends BackgroundRefreshViewsResponse {
  sync: {
    synced: number;
    pendingSyncCount: number;
  };
}

export type BackgroundRetrySiteClassificationsResponse = RetrySiteClassificationsResponse;

export interface BackgroundFocusSessionResponse {
  ok: true;
  session: FocusSession;
  dashboardCache: DashboardCache;
}

export interface BackgroundSaveSiteRuleResponse {
  ok: true;
  payload: SiteRuleState;
  dashboardCache: DashboardCache;
}

export interface BackgroundCloseCurrentTabResponse {
  ok: true;
}

export interface BackgroundForceFocusNudgeResponse {
  ok: true;
  response: unknown;
}

export interface BackgroundMediaStateUpdateResponse {
  ok: true;
  ignored?: true;
}

export type BackgroundSuccessResponseMap = {
  [MESSAGE_TYPES.getBootstrap]: BootstrapResponse;
  [MESSAGE_TYPES.getDebugState]: BootstrapResponse;
  [MESSAGE_TYPES.refreshViews]: BackgroundRefreshViewsResponse;
  [MESSAGE_TYPES.syncNow]: BackgroundSyncNowResponse;
  [MESSAGE_TYPES.retrySiteClassifications]: BackgroundRetrySiteClassificationsResponse;
  [MESSAGE_TYPES.startFocusSession]: BackgroundFocusSessionResponse;
  [MESSAGE_TYPES.pauseFocusSession]: BackgroundFocusSessionResponse;
  [MESSAGE_TYPES.resumeFocusSession]: BackgroundFocusSessionResponse;
  [MESSAGE_TYPES.endFocusSession]: BackgroundFocusSessionResponse;
  [MESSAGE_TYPES.saveSiteRule]: BackgroundSaveSiteRuleResponse;
  [MESSAGE_TYPES.closeCurrentTab]: BackgroundCloseCurrentTabResponse;
  [MESSAGE_TYPES.forceFocusNudge]: BackgroundForceFocusNudgeResponse;
  [MESSAGE_TYPES.mediaStateUpdate]: BackgroundMediaStateUpdateResponse;
};

export type BackgroundSuccessResponse<TType extends BackgroundRequestType> = BackgroundSuccessResponseMap[TType];

export type BackgroundResponse<TType extends BackgroundRequestType> =
  | BackgroundSuccessResponse<TType>
  | BackgroundErrorResponse;

export type ContentGetMediaStateRequest = {
  type: typeof MESSAGE_TYPES.getMediaState;
};

export type ContentShowFocusNudgeRequest = {
  type: typeof MESSAGE_TYPES.showFocusNudge;
  sessionId: string;
  message: string;
  host: string;
  category: string;
};

export type ContentRequest = ContentGetMediaStateRequest | ContentShowFocusNudgeRequest;

export type ContentRequestType = ContentRequest["type"];

export type ContentRequestOf<TType extends ContentRequestType> = Extract<ContentRequest, { type: TType }>;

export interface ContentShowFocusNudgeResponse {
  ok: true;
}

export type ContentResponseMap = {
  [MESSAGE_TYPES.getMediaState]: MediaStateResponse;
  [MESSAGE_TYPES.showFocusNudge]: ContentShowFocusNudgeResponse;
};

export type ContentResponse<TType extends ContentRequestType> = ContentResponseMap[TType];

function isValidMessageType(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || typeof value === "number";
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

export function isBackgroundRequest(value: unknown): value is BackgroundRequest {
  if (!isPlainObject(value) || !isValidMessageType(value.type)) {
    return false;
  }

  switch (value.type) {
    case MESSAGE_TYPES.getBootstrap:
    case MESSAGE_TYPES.getDebugState:
    case MESSAGE_TYPES.refreshViews:
    case MESSAGE_TYPES.syncNow:
    case MESSAGE_TYPES.retrySiteClassifications:
    case MESSAGE_TYPES.forceFocusNudge:
    case MESSAGE_TYPES.closeCurrentTab:
      return true;
    case MESSAGE_TYPES.startFocusSession:
      return isOptionalString(value.intent) && isOptionalNumber(value.minutes);
    case MESSAGE_TYPES.pauseFocusSession:
    case MESSAGE_TYPES.resumeFocusSession:
    case MESSAGE_TYPES.endFocusSession:
      return isRequiredString(value.sessionId);
    case MESSAGE_TYPES.saveSiteRule:
      return isRequiredString(value.host) && isCategory(value.category) && typeof value.excluded === "boolean";
    case MESSAGE_TYPES.mediaStateUpdate:
      return typeof value.isPlayingMedia === "boolean";
    default:
      return false;
  }
}

export function isContentRequest(value: unknown): value is ContentRequest {
  if (!isPlainObject(value) || !isValidMessageType(value.type)) {
    return false;
  }

  switch (value.type) {
    case MESSAGE_TYPES.getMediaState:
      return true;
    case MESSAGE_TYPES.showFocusNudge:
      return isRequiredString(value.sessionId) &&
        isRequiredString(value.message) &&
        isRequiredString(value.host) &&
        isRequiredString(value.category);
    default:
      return false;
  }
}

export function isContentRequestType<TType extends ContentRequestType>(
  value: unknown,
  type: TType
): value is ContentRequestOf<TType> {
  return isContentRequest(value) && value.type === type;
}

export function isBackgroundErrorResponse(value: unknown): value is BackgroundErrorResponse {
  return isPlainObject(value) && value.ok === false && typeof value.error === "string";
}
