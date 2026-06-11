import { createTranslator, type AppLanguage } from "../../lib/i18n/index.js";

const ACTION_ICON_SIZES = [16, 32] as const;
const INACTIVE_ICON_COLOR = "#7b8794";
const ACTIVE_ICON_COLOR = "#2563eb";

export interface ActionVisualState {
  badgeText: string;
  focusActive: boolean;
  iconColor: string;
  stateKey: string;
  title: string;
}

let lastActionStateKey: string | null = null;
const iconImageCache = new Map<string, Record<number, ImageData>>();

export function buildActionVisualState(focusActive: boolean, language: AppLanguage = "en"): ActionVisualState {
  const t = createTranslator(language);
  return {
    badgeText: focusActive ? "ON" : "",
    focusActive,
    iconColor: focusActive ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR,
    stateKey: `${focusActive ? "focus-active" : "focus-inactive"}:${language}`,
    title: focusActive ? t("action.focusActive") : t("action.focusInactive")
  };
}

export async function updateProductivityActionIcon(focusActive: boolean, language: AppLanguage = "en"): Promise<void> {
  const visualState = buildActionVisualState(focusActive, language);
  if (visualState.stateKey === lastActionStateKey) {
    return;
  }

  const operations: Array<Promise<unknown>> = [
    chrome.action.setBadgeBackgroundColor({ color: visualState.iconColor }),
    chrome.action.setBadgeText({ text: visualState.badgeText }),
    chrome.action.setTitle({ title: visualState.title })
  ];

  const imageData = getCachedActionIconImage(visualState.iconColor);
  if (imageData) {
    operations.push(chrome.action.setIcon({ imageData }));
  }

  await Promise.all(operations);
  lastActionStateKey = visualState.stateKey;
}

function getCachedActionIconImage(color: string): Record<number, ImageData> | null {
  if (typeof OffscreenCanvas === "undefined") {
    return null;
  }

  const cached = iconImageCache.get(color);
  if (cached) {
    return cached;
  }

  const next = Object.fromEntries(
    ACTION_ICON_SIZES.map((size) => [size, renderActionIcon(size, color)])
  ) as Record<number, ImageData>;
  iconImageCache.set(color, next);
  return next;
}

function renderActionIcon(size: number, color: string): ImageData {
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create action icon context");
  }

  context.clearRect(0, 0, size, size);
  const center = size / 2;
  const radius = size * 0.38;

  context.fillStyle = color;
  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#ffffff";
  context.lineCap = "round";
  context.lineWidth = Math.max(1.5, size * 0.12);
  context.beginPath();
  context.moveTo(size * 0.32, size * 0.5);
  context.lineTo(size * 0.46, size * 0.64);
  context.lineTo(size * 0.7, size * 0.36);
  context.stroke();

  return context.getImageData(0, 0, size, size);
}
