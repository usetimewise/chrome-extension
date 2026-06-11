import type { FocusCompanionImageSetId } from "./types.js";

const FOCUS_COMPANION_IMAGE_SETS: Record<FocusCompanionImageSetId, readonly string[]> = {
  ceo: [
    "ceo-s02p01-kpi-frown.png",
    "ceo-s02p02-phone-no.png",
    "ceo-s02p03-watch-tap.png",
    "ceo-s02p04-clipboard-flip.png",
    "ceo-s02p05-pinch-bridge.png",
    "ceo-s02p06-meeting-call.png",
    "ceo-s02p07-folded-arms.png",
    "ceo-s02p08-redline-pen.png",
    "ceo-s02p09-firm-stare.png",
    "ceo-s02p10-tap-table.png"
  ]
};

const DEFAULT_IMAGE_BY_SET: Record<FocusCompanionImageSetId, string> = {
  ceo: "ceo-s02p03-watch-tap.png"
};

export function getDefaultCompanionImagePath(imageSetId: FocusCompanionImageSetId): string {
  return `images/${imageSetId}/${DEFAULT_IMAGE_BY_SET[imageSetId]}`;
}

export function getRandomCompanionImagePath(
  imageSetId: FocusCompanionImageSetId,
  randomInt: (maxExclusive: number) => number
): string {
  const imageNames = FOCUS_COMPANION_IMAGE_SETS[imageSetId];
  const imageName = imageNames[randomInt(imageNames.length)] || DEFAULT_IMAGE_BY_SET[imageSetId];
  return `images/${imageSetId}/${imageName}`;
}
