import type { Category, PopupModel, TopCategory } from "../../../lib/types.js";
import { DISTRACTION_CATEGORIES, FOCUS_CATEGORIES } from "../../../lib/constants.js";
import { formatPercent } from "../../../lib/utils.js";

export function getAlignmentPercent(model: PopupModel | null): number {
  return Math.max(0, Math.min(100, Math.round((model?.focusAlignment || 0) * 100)));
}

export function getProgressLabel(model: PopupModel | null): string {
  return model ? `${formatPercent(model.focusAlignment)} focus alignment` : "0% focus alignment";
}

export function getFooterInsight(model: PopupModel): string {
  if (model.state === "empty") {
    return "Focus data will appear soon.";
  }

  if (model.state === "drifting") {
    return "A gentle reset can bring the day back on track.";
  }

  return model.insight?.title || "Strong focus today. Keep the momentum.";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) {
    return "Excellent";
  }
  if (score >= 60) {
    return "Good";
  }
  if (score >= 40) {
    return "Fair";
  }
  return "Low";
}

export function getComparisonText(model: PopupModel): string {
  const delta = Math.round(model.comparisonValue * 100);
  if (delta === 0) {
    return `${model.comparisonLabel} unchanged`;
  }
  const direction = delta > 0 ? "+" : "";
  return `${model.comparisonLabel} ${direction}${delta}%`;
}

function categoryColor(category: Category): string {
  if (DISTRACTION_CATEGORIES.has(category)) {
    return "#cf6f47";
  }
  if (FOCUS_CATEGORIES.has(category)) {
    return "#2f7a67";
  }
  if (category === "communication") {
    return "#4f6df5";
  }
  return "#9aa19b";
}

export function topCategoryShare(categories: TopCategory[]): number {
  const [topCategory] = categories;
  if (!topCategory) {
    return 0;
  }
  if (typeof topCategory.share === "number" && Number.isFinite(topCategory.share)) {
    return Math.max(0, Math.min(100, Math.round(topCategory.share * 100)));
  }
  const totalDuration = categories.reduce((sum, item) => sum + item.duration_ms, 0);
  if (totalDuration <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((topCategory.duration_ms / totalDuration) * 100)));
}

export function donutBackground(categories: TopCategory[]): string {
  if (!categories.length) {
    return "conic-gradient(#d8ddd7 0 100%)";
  }

  let offset = 0;
  const segments = categories.map((item) => {
    const start = offset;
    const nextValue = typeof item.share === "number" && Number.isFinite(item.share)
      ? item.share * 100
      : 0;
    const end = Math.min(100, start + Math.max(0, nextValue));
    offset = end;
    return `${categoryColor(item.category)} ${start}% ${end}%`;
  });

  if (offset < 100) {
    segments.push(`#d8ddd7 ${offset}% 100%`);
  }

  return `conic-gradient(${segments.join(", ")})`;
}

export function categoryAccent(category: Category): string {
  return categoryColor(category);
}
