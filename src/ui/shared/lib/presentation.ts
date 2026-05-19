import {
  DISTRACTION_CATEGORIES,
  FOCUS_CATEGORIES
} from "../../../lib/constants.js";
import type { Category } from "../../../lib/types.js";

export type CategoryTone = "danger" | "focus" | "communication" | "neutral";

export function categoryTone(category: Category): CategoryTone {
  if (DISTRACTION_CATEGORIES.has(category)) {
    return "danger";
  }
  if (FOCUS_CATEGORIES.has(category)) {
    return "focus";
  }
  if (category === "communication") {
    return "communication";
  }
  return "neutral";
}
