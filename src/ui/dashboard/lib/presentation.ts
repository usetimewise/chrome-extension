import { DISTRACTION_CATEGORIES } from "../../../lib/constants.js";
import type {
  Recommendation,
  TodayView,
  TopCategory,
  TopSite
} from "../../../lib/types.js";
export { categoryTone } from "../../shared/lib/presentation.js";

export function localDate(): string {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

export function clampPercent(value?: number): number {
  return Math.max(0, Math.min(100, Math.round((value || 0) * 100)));
}

export function percentLabel(value?: number): string {
  return `${clampPercent(value)}%`;
}

export function sortedByDuration<T extends { duration_ms?: number }>(items: T[] = []): T[] {
  return [...items].sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0));
}

export function distractingSites(view: TodayView): TopSite[] {
  return sortedByDuration(view.top_sites || [])
    .filter((item) => DISTRACTION_CATEGORIES.has(item.category))
    .slice(0, 3);
}

export function distractingCategories(view: TodayView): TopCategory[] {
  return sortedByDuration(view.top_categories || [])
    .filter((item) => DISTRACTION_CATEGORIES.has(item.category))
    .slice(0, 2);
}

export function recommendationIcon(type = ""): string {
  if (type.includes("focus")) {
    return "bolt";
  }
  if (type.includes("classification") || type.includes("trend")) {
    return "triangle-exclamation";
  }
  return "clock";
}

export function isStartFocusRecommendation(recommendation: Recommendation): boolean {
  return recommendation.action?.type === "start_focus_session";
}
