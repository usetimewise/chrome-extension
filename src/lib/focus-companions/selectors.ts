import {
  DEFAULT_FOCUS_COMPANION_ID,
  FOCUS_COMPANION_CATALOG
} from "./catalog.js";
import {
  getDefaultCompanionImagePath,
  getRandomCompanionImagePath
} from "./assets.js";
import type {
  FocusCompanion,
  FocusCompanionAssetUrlResolver,
  FocusCompanionId,
  FocusCompanionOverlayVariant,
  FocusCompanionPreview,
  FocusCompanionVisual
} from "./types.js";

type OverlayVariantOptions = {
  resolveAssetUrl?: FocusCompanionAssetUrlResolver;
  randomInt?: (maxExclusive: number) => number;
};

type PreviewOptions = {
  resolveAssetUrl?: FocusCompanionAssetUrlResolver;
};

const FOCUS_COMPANION_IDS = Object.keys(FOCUS_COMPANION_CATALOG) as FocusCompanionId[];

function defaultRandomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

function toFocusCompanion(id: FocusCompanionId): FocusCompanion {
  return {
    id,
    ...FOCUS_COMPANION_CATALOG[id]
  };
}

function resolvePath(path: string, resolveAssetUrl?: FocusCompanionAssetUrlResolver): string {
  return resolveAssetUrl ? resolveAssetUrl(path) : path;
}

function createAvatarVisual(companion: FocusCompanion): FocusCompanionVisual {
  return {
    kind: "avatar",
    text: companion.avatarText,
    colorClass: companion.colorClass,
    label: companion.name
  };
}

function createDefaultVisual(
  companion: FocusCompanion,
  resolveAssetUrl?: FocusCompanionAssetUrlResolver
): FocusCompanionVisual {
  if (!companion.imageSetId) {
    return createAvatarVisual(companion);
  }

  return {
    kind: "image",
    src: resolvePath(getDefaultCompanionImagePath(companion.imageSetId), resolveAssetUrl),
    alt: companion.name
  };
}

export function listFocusCompanions(): readonly FocusCompanion[] {
  return FOCUS_COMPANION_IDS.map(toFocusCompanion);
}

export function getFocusCompanion(id: string | null | undefined): FocusCompanion {
  return isFocusCompanionId(id)
    ? toFocusCompanion(id)
    : toFocusCompanion(DEFAULT_FOCUS_COMPANION_ID);
}

export function isFocusCompanionId(value: unknown): value is FocusCompanionId {
  return typeof value === "string" && value in FOCUS_COMPANION_CATALOG;
}

export function createFocusCompanionPreview(
  id: string | null | undefined,
  options: PreviewOptions = {}
): FocusCompanionPreview {
  const companion = getFocusCompanion(id);
  return {
    id: companion.id,
    name: companion.name,
    role: companion.role,
    description: companion.description,
    availability: companion.availability,
    visual: createDefaultVisual(companion, options.resolveAssetUrl)
  };
}

export function createFocusCompanionOverlayVariant(
  id: string | null | undefined,
  options: OverlayVariantOptions = {}
): FocusCompanionOverlayVariant {
  const randomInt = options.randomInt || defaultRandomInt;
  const companion = getFocusCompanion(id);
  const text = companion.copy[randomInt(companion.copy.length)] || companion.copy[0];

  if (!companion.imageSetId) {
    return {
      companionId: companion.id,
      text,
      visual: createAvatarVisual(companion)
    };
  }

  return {
    companionId: companion.id,
    text,
    visual: {
      kind: "image",
      src: resolvePath(getRandomCompanionImagePath(companion.imageSetId, randomInt), options.resolveAssetUrl),
      alt: companion.name
    }
  };
}
