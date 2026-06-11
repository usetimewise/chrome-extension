import type { FOCUS_COMPANION_CATALOG } from "./catalog.js";

export type FocusCompanionId = keyof typeof FOCUS_COMPANION_CATALOG;
export type FocusCompanionAvailability = "free" | "paid";
export type FocusCompanionImageSetId = NonNullable<FocusCompanionCatalogEntry["imageSetId"]>;

export type FocusCompanionCatalogEntry =
  typeof FOCUS_COMPANION_CATALOG[keyof typeof FOCUS_COMPANION_CATALOG];

export type FocusCompanion = {
  id: FocusCompanionId;
  name: string;
  role: string;
  description: string;
  tone: string;
  availability: FocusCompanionAvailability;
  avatarText: string;
  colorClass: string;
  imageSetId: FocusCompanionImageSetId | null;
  copy: readonly string[];
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
  text: string;
  visual: FocusCompanionVisual;
};

export type FocusCompanionAssetUrlResolver = (path: string) => string;
