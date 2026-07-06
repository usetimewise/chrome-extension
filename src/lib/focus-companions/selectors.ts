import {
    DEFAULT_FOCUS_COMPANION_SCENARIO_ID,
    DEFAULT_FOCUS_COMPANION_ID,
    FOCUS_COMPANION_CATALOG,
} from "./catalog.js";
import { DEFAULT_LANGUAGE, type AppLanguage } from "../i18n/index.js";
import {
    getFocusCompanionReplicaText,
    getFocusCompanionText,
} from "../i18n/focus-companions.js";
import type {
    FocusCompanion,
    FocusCompanionAssetUrlResolver,
    FocusCompanionId,
    FocusCompanionOverlayVariant,
    FocusCompanionPreview,
    FocusCompanionReplica,
    FocusCompanionScenarioId,
    FocusCompanionVisual,
} from "./types.js";

type OverlayVariantOptions = {
    language?: AppLanguage;
    scenarioId?: FocusCompanionScenarioId;
    resolveAssetUrl?: FocusCompanionAssetUrlResolver;
    randomInt?: (maxExclusive: number) => number;
};

type PreviewOptions = {
    language?: AppLanguage;
    resolveAssetUrl?: FocusCompanionAssetUrlResolver;
};

const FOCUS_COMPANION_IDS = Object.keys(
    FOCUS_COMPANION_CATALOG,
) as FocusCompanionId[];

function defaultRandomInt(maxExclusive: number): number {
    return Math.floor(Math.random() * maxExclusive);
}

function toFocusCompanion(id: FocusCompanionId): FocusCompanion {
    return {
        id,
        ...FOCUS_COMPANION_CATALOG[id],
    };
}

function resolvePath(
    path: string,
    resolveAssetUrl?: FocusCompanionAssetUrlResolver,
): string {
    return resolveAssetUrl ? resolveAssetUrl(path) : path;
}

function createAvatarVisual(
    companion: FocusCompanion,
    language: AppLanguage,
): FocusCompanionVisual {
    return {
        kind: "avatar",
        text: getFocusCompanionText(companion.id, "avatarText", language),
        colorClass: companion.colorClass,
        label: getFocusCompanionText(companion.id, "name", language),
    };
}

function createReplicaVisual(
    companion: FocusCompanion,
    replica: FocusCompanionReplica,
    language: AppLanguage,
    resolveAssetUrl?: FocusCompanionAssetUrlResolver,
): FocusCompanionVisual {
    if (!("imagePath" in replica)) {
        return createAvatarVisual(companion, language);
    }

    return {
        kind: "image",
        src: resolvePath(replica.imagePath, resolveAssetUrl),
        alt: getFocusCompanionText(companion.id, "name", language),
    };
}

function getScenarioReplicas(
    companion: FocusCompanion,
    scenarioId: FocusCompanionScenarioId,
): readonly [FocusCompanionReplica, ...FocusCompanionReplica[]] {
    return (
        companion.scenarios[scenarioId] ||
        companion.scenarios[companion.defaultScenarioId] ||
        companion.scenarios[DEFAULT_FOCUS_COMPANION_SCENARIO_ID]
    );
}

function getDefaultReplica(companion: FocusCompanion): FocusCompanionReplica {
    const replicas = getScenarioReplicas(companion, companion.defaultScenarioId);
    return replicas[companion.defaultReplicaIndex] || replicas[0];
}

function createDefaultVisual(
    companion: FocusCompanion,
    language: AppLanguage,
    resolveAssetUrl?: FocusCompanionAssetUrlResolver,
): FocusCompanionVisual {
    return createReplicaVisual(
        companion,
        getDefaultReplica(companion),
        language,
        resolveAssetUrl,
    );
}

export function listFocusCompanions(): readonly FocusCompanion[] {
    return FOCUS_COMPANION_IDS.map(toFocusCompanion);
}

export function getFocusCompanion(
    id: string | null | undefined,
): FocusCompanion {
    return isFocusCompanionId(id)
        ? toFocusCompanion(id)
        : toFocusCompanion(DEFAULT_FOCUS_COMPANION_ID);
}

export function isFocusCompanionId(value: unknown): value is FocusCompanionId {
    return typeof value === "string" && value in FOCUS_COMPANION_CATALOG;
}

export function createFocusCompanionPreview(
    id: string | null | undefined,
    options: PreviewOptions = {},
): FocusCompanionPreview {
    const companion = getFocusCompanion(id);
    const language = options.language || DEFAULT_LANGUAGE;
    return {
        id: companion.id,
        name: getFocusCompanionText(companion.id, "name", language),
        role: getFocusCompanionText(companion.id, "role", language),
        description: getFocusCompanionText(
            companion.id,
            "description",
            language,
        ),
        availability: companion.availability,
        visual: createDefaultVisual(
            companion,
            language,
            options.resolveAssetUrl,
        ),
    };
}

export function createFocusCompanionOverlayVariant(
    id: string | null | undefined,
    options: OverlayVariantOptions = {},
): FocusCompanionOverlayVariant {
    const randomInt = options.randomInt || defaultRandomInt;
    const companion = getFocusCompanion(id);
    const scenarioId =
        options.scenarioId ||
        companion.defaultScenarioId ||
        DEFAULT_FOCUS_COMPANION_SCENARIO_ID;
    const replicas = getScenarioReplicas(companion, scenarioId);
    const replicaIndex = randomInt(replicas.length);
    const replica = replicas[replicaIndex] || getDefaultReplica(companion);
    const language = options.language || DEFAULT_LANGUAGE;

    return {
        companionId: companion.id,
        scenarioId,
        text: getFocusCompanionReplicaText(
            companion.id,
            scenarioId,
            replicaIndex,
            language,
        ),
        visual: createReplicaVisual(
            companion,
            replica,
            language,
            options.resolveAssetUrl,
        ),
    };
}
