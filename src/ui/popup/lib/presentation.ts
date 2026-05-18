import type { PopupModel } from "../../../lib/types.js";
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
