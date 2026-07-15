import type {
    FOCUS_COMPANION_CATALOG,
    FocusCompanionOverlayColors,
    FocusCompanionTheme,
    FocusCompanionScenarioId,
} from "./catalog.js";

export type {
    FocusCompanionOverlayColors,
    FocusCompanionScenarioId,
    FocusCompanionTheme,
};

export type FocusCompanionId = keyof typeof FOCUS_COMPANION_CATALOG;
export type FocusCompanionAvailability = "free" | "paid";

export type FocusCompanionCatalogEntry =
    (typeof FOCUS_COMPANION_CATALOG)[keyof typeof FOCUS_COMPANION_CATALOG];

export type FocusCompanionReplica =
    FocusCompanionCatalogEntry["scenarios"][FocusCompanionScenarioId][number];

export type FocusCompanion = {
    id: FocusCompanionId;
    name: string;
    role: string;
    description: string;
    tone: string;
    availability: FocusCompanionAvailability;
    avatarText: string;
    colorClass: string;
    theme: FocusCompanionTheme;
    defaultScenarioId: FocusCompanionScenarioId;
    defaultReplicaIndex: number;
    scenarios: FocusCompanionCatalogEntry["scenarios"];
};

export type FocusCompanionVisual =
    | {
          kind: "image";
          src: string;
          alt: string;
      }
    | {
          kind: "avatar";
          text: string;
          colorClass: string;
          label: string;
      };

export type FocusCompanionPreview = {
    id: FocusCompanionId;
    name: string;
    role: string;
    description: string;
    availability: FocusCompanionAvailability;
    visual: FocusCompanionVisual;
};

export type FocusCompanionOverlayVariant = {
    companionId: FocusCompanionId;
    scenarioId: FocusCompanionScenarioId;
    theme: FocusCompanionTheme;
    panelBackgroundImageUrl: string;
    text: string;
    visual: FocusCompanionVisual;
};

export type FocusCompanionAssetUrlResolver = (path: string) => string;
