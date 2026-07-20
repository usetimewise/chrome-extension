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

export type FocusCompanionScenePalette = {
    backdropBase: string;
    backdropDeep: string;
    backdropHighlight: string;
    light: string;
    shadow: string;
};

export type FocusCompanionSceneTuning = {
    characterWidth: number;
    characterOffsetX: number;
    characterOffsetY: number;
    footAnchorX: number;
    footAnchorY: number;
    glowX: number;
    glowY: number;
    floorShadowWidth: number;
    floorShadowHeight: number;
    floorShadowOffsetX: number;
    floorShadowOffsetY: number;
    floorShadowBlur: number;
    floorShadowSkew: number;
    floorShadowOpacity: number;
    contactShadowWidth: number;
    contactShadowHeight: number;
    contactShadowOffsetX: number;
    contactShadowOffsetY: number;
    contactShadowBlur: number;
    contactShadowOpacity: number;
    surfaceShadowWidth: number;
    surfaceShadowHeight: number;
    surfaceShadowX: number;
    surfaceShadowY: number;
    surfaceShadowBlur: number;
    surfaceShadowOpacity: number;
};

export type FocusCompanionScene = {
    palette: FocusCompanionScenePalette;
    tuning: FocusCompanionSceneTuning;
    speechBubbleImagePath: string;
};

export type FocusCompanionOverlayVisual = {
    kind: "scene";
    characterSrc: string;
    speechBubbleSrc: string;
    alt: string;
    scene: FocusCompanionScene;
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
    text: string;
    visual: FocusCompanionOverlayVisual;
};

export type FocusCompanionAssetUrlResolver = (path: string) => string;
