import type {
    FocusCompanionId,
    FocusCompanionScenarioId,
    FocusCompanionScene,
    FocusCompanionScenePalette,
    FocusCompanionSceneTuning,
} from "./types.js";

type FocusCompanionSceneOverride = {
    palette?: FocusCompanionScenePalette;
    tuning?: Partial<FocusCompanionSceneTuning>;
};

type FocusCompanionScenePreset = {
    palette: FocusCompanionScenePalette;
    tuning?: Partial<FocusCompanionSceneTuning>;
    scenarios?: Partial<
        Record<FocusCompanionScenarioId, FocusCompanionSceneOverride>
    >;
};

const SPEECH_BUBBLE_IMAGE_PATH = "images/speech-bubble.svg";
const SPEECH_BUBBLE_FILL_IMAGE_PATH = "images/speech-bubble-fill.svg";

const DEFAULT_SCENE_TUNING: FocusCompanionSceneTuning = {
    characterWidth: 1.18,
    characterOffsetX: 0,
    characterOffsetY: 0,
    footAnchorX: 0.5,
    footAnchorY: 0.92,
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

const FOCUS_COMPANION_SCENE_PRESETS: Record<
    FocusCompanionId,
    FocusCompanionScenePreset
> = {
    sgt: {
        palette: {
            backdropBase: "#6d2830",
            backdropDeep: "#241317",
            backdropHighlight: "#a54b55",
            light: "rgba(255, 211, 183, 0.32)",
            shadow: "rgba(24, 8, 11, 0.78)",
        },
        tuning: { characterWidth: 1.12, footAnchorY: 0.94 },
    },
    hbest: {
        palette: {
            backdropBase: "#e8bd55",
            backdropDeep: "#8a5e13",
            backdropHighlight: "#ffe69a",
            light: "rgba(255, 250, 214, 0.54)",
            shadow: "rgba(80, 49, 5, 0.68)",
        },
        tuning: { characterWidth: 1.24, footAnchorY: 0.94 },
    },
    sarc: {
        palette: {
            backdropBase: "#356f73",
            backdropDeep: "#17363a",
            backdropHighlight: "#73afb1",
            light: "rgba(202, 246, 240, 0.38)",
            shadow: "rgba(8, 38, 42, 0.72)",
        },
        tuning: { characterWidth: 1.18, footAnchorY: 0.945 },
    },
    zen: {
        palette: {
            backdropBase: "#9fb68c",
            backdropDeep: "#536947",
            backdropHighlight: "#d9e7c8",
            light: "rgba(247, 255, 225, 0.48)",
            shadow: "rgba(42, 64, 32, 0.66)",
        },
        tuning: { characterWidth: 1.18, footAnchorY: 0.925 },
    },
    pirate: {
        palette: {
            backdropBase: "#4fa0a2",
            backdropDeep: "#185457",
            backdropHighlight: "#8dd7d4",
            light: "rgba(218, 255, 244, 0.44)",
            shadow: "rgba(5, 48, 53, 0.7)",
        },
        tuning: { characterWidth: 1.14, footAnchorY: 0.925 },
    },
    butler: {
        palette: {
            backdropBase: "#713244",
            backdropDeep: "#2b1720",
            backdropHighlight: "#a95d6d",
            light: "rgba(255, 210, 183, 0.38)",
            shadow: "rgba(21, 8, 13, 0.78)",
        },
        tuning: { footAnchorY: 0.895 },
    },
    surfer: {
        palette: {
            backdropBase: "#74c2d8",
            backdropDeep: "#26758d",
            backdropHighlight: "#b9eafa",
            light: "rgba(239, 255, 248, 0.48)",
            shadow: "rgba(15, 79, 98, 0.66)",
        },
        tuning: { characterWidth: 1.16, footAnchorY: 0.92 },
    },
    ceo: {
        palette: {
            backdropBase: "#a7b0bd",
            backdropDeep: "#545f6d",
            backdropHighlight: "#dce2e9",
            light: "rgba(255, 246, 226, 0.44)",
            shadow: "rgba(37, 47, 59, 0.64)",
        },
        tuning: { characterWidth: 1.16, footAnchorY: 0.91 },
    },
    coach: {
        palette: {
            backdropBase: "#91b987",
            backdropDeep: "#416b3c",
            backdropHighlight: "#cbe2c5",
            light: "rgba(255, 248, 210, 0.42)",
            shadow: "rgba(31, 66, 29, 0.66)",
        },
        tuning: { characterWidth: 1.18, footAnchorY: 0.915 },
    },
    th: {
        palette: {
            backdropBase: "#a8b9a2",
            backdropDeep: "#586d54",
            backdropHighlight: "#dce7d6",
            light: "rgba(255, 242, 213, 0.42)",
            shadow: "rgba(43, 65, 41, 0.62)",
        },
        tuning: { characterWidth: 1.17, footAnchorY: 0.92 },
    },
    stoic: {
        palette: {
            backdropBase: "#675b53",
            backdropDeep: "#29231f",
            backdropHighlight: "#97867a",
            light: "rgba(239, 216, 189, 0.34)",
            shadow: "rgba(25, 20, 17, 0.76)",
        },
        tuning: { characterWidth: 1.16, footAnchorY: 0.93 },
    },
    cowboy: {
        palette: {
            backdropBase: "#d88b50",
            backdropDeep: "#753b1d",
            backdropHighlight: "#f4bd82",
            light: "rgba(255, 238, 194, 0.46)",
            shadow: "rgba(75, 34, 14, 0.68)",
        },
        tuning: { characterWidth: 1.13, footAnchorY: 0.93 },
    },
};

export function getFocusCompanionScene(
    companionId: FocusCompanionId,
    scenarioId: FocusCompanionScenarioId,
): FocusCompanionScene {
    const preset = FOCUS_COMPANION_SCENE_PRESETS[companionId];
    const scenario = preset.scenarios?.[scenarioId];

    return {
        palette: scenario?.palette ?? preset.palette,
        speechBubbleFillImagePath: SPEECH_BUBBLE_FILL_IMAGE_PATH,
        speechBubbleImagePath: SPEECH_BUBBLE_IMAGE_PATH,
        tuning: {
            ...DEFAULT_SCENE_TUNING,
            ...preset.tuning,
            ...scenario?.tuning,
        },
    };
}
