import type {
    FocusCompanionId,
    FocusCompanionScenarioId,
    FocusCompanionScene,
    FocusCompanionScenePalette,
    FocusCompanionSceneTuning,
} from "./types.js";

type FocusCompanionSceneDefinition = {
    palette: FocusCompanionScenePalette;
    tuning?: Partial<FocusCompanionSceneTuning>;
    speechBubbleImagePath?: string;
};

const DEFAULT_SCENE_TUNING: FocusCompanionSceneTuning = {
    characterWidth: 1.18,
    characterOffsetX: 0,
    characterOffsetY: 0,
    footAnchorX: 0.5,
    footAnchorY: 0.895,
    glowX: 0.5,
    glowY: 0.38,
    floorShadowWidth: 0.68,
    floorShadowHeight: 0.07,
    floorShadowOffsetX: -0.08,
    floorShadowOffsetY: 0.012,
    floorShadowBlur: 10,
    floorShadowSkew: -10,
    floorShadowOpacity: 0.34,
    contactShadowWidth: 0.25,
    contactShadowHeight: 0.028,
    contactShadowOffsetX: 0,
    contactShadowOffsetY: 0.004,
    contactShadowBlur: 4,
    contactShadowOpacity: 0.58,
    surfaceShadowWidth: 0.46,
    surfaceShadowHeight: 0.28,
    surfaceShadowX: 0.2,
    surfaceShadowY: 0.9,
    surfaceShadowBlur: 18,
    surfaceShadowOpacity: 0.26,
};

const FOCUS_COMPANION_SCENES: Partial<
    Record<
        FocusCompanionId,
        Partial<Record<FocusCompanionScenarioId, FocusCompanionSceneDefinition>>
    >
> = {
    butler: {
        "1": {
            speechBubbleImagePath: "images/speech-bubble.svg",
            palette: {
                backdropBase: "#713244",
                backdropDeep: "#2b1720",
                backdropHighlight: "#a95d6d",
                light: "rgba(255, 210, 183, 0.38)",
                shadow: "rgba(21, 8, 13, 0.78)",
            },
        },
    },
};

export function getFocusCompanionScene(
    companionId: FocusCompanionId,
    scenarioId: FocusCompanionScenarioId,
): FocusCompanionScene | null {
    const companionScenes = FOCUS_COMPANION_SCENES[companionId];
    const definition = companionScenes?.[scenarioId];

    if (!definition) {
        return null;
    }

    return {
        palette: definition.palette,
        speechBubbleImagePath: definition.speechBubbleImagePath,
        tuning: {
            ...DEFAULT_SCENE_TUNING,
            ...definition.tuning,
        },
    };
}
