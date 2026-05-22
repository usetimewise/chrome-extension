import type { DashboardCache } from "../../lib/types.js";

const ACTION_ICON_SIZES = [16, 32] as const;
const ACTION_BADGE_BACKGROUND = "#1f2937";
const NEUTRAL_ICON_COLOR = "#7b8794";
const LOW_SCORE_ICON_COLOR = "#d45151";
const HIGH_SCORE_ICON_COLOR = "#2f9e5a";
const ICON_BUCKET_STEP = 5;

export interface ActionVisualState {
  badgeText: string;
  iconBucket: number | null;
  iconColor: string;
  normalizedScore: number | null;
  stateKey: string;
  title: string;
}

let lastActionStateKey: string | null = null;
const iconImageCache = new Map<string, Record<number, ImageData>>();

export function extractProductivityActionScore(cache: DashboardCache | null | undefined): number | null {
  const value = cache?.overview?.today?.summary?.productivity_score?.value;
  return normalizeProductivityScore(value);
}

export function normalizeProductivityScore(score: number | null | undefined): number | null {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function bucketProductivityScore(score: number | null): number | null {
  if (score === null) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(score / ICON_BUCKET_STEP) * ICON_BUCKET_STEP));
}

export function colorForProductivityScore(score: number | null): string {
  if (score === null) {
    return NEUTRAL_ICON_COLOR;
  }

  return interpolateHexColor(LOW_SCORE_ICON_COLOR, HIGH_SCORE_ICON_COLOR, score / 100);
}

export function buildActionVisualState(score: number | null | undefined): ActionVisualState {
  const normalizedScore = normalizeProductivityScore(score);
  const iconBucket = bucketProductivityScore(normalizedScore);
  const iconColor = colorForProductivityScore(iconBucket);

  if (normalizedScore === null) {
    return {
      badgeText: "",
      iconBucket,
      iconColor,
      normalizedScore,
      stateKey: "idle",
      title: "Focus Snapshot: collecting data"
    };
  }

  return {
    badgeText: String(normalizedScore),
    iconBucket,
    iconColor,
    normalizedScore,
    stateKey: `${normalizedScore}:${iconBucket}`,
    title: `Focus Snapshot: productivity ${normalizedScore}/100`
  };
}

export async function updateProductivityActionIcon(
  cache: DashboardCache | null | undefined
): Promise<void> {
  const visualState = buildActionVisualState(extractProductivityActionScore(cache));
  if (visualState.stateKey === lastActionStateKey) {
    return;
  }

  const operations: Array<Promise<unknown>> = [
    chrome.action.setBadgeBackgroundColor({ color: ACTION_BADGE_BACKGROUND }),
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
  const inset = size * 0.125;
  const width = size - inset * 2;
  const height = size - inset * 2;
  const radius = size * 0.22;

  context.fillStyle = color;
  drawRoundedRect(context, inset, inset, width, height, radius);
  context.fill();

  context.fillStyle = "#ffffff";
  const barWidth = size * 0.12;
  const gap = size * 0.08;
  const baseline = size * 0.75;
  const startX = size * 0.22;
  const heights = [0.18, 0.34, 0.52].map((value) => value * size);

  heights.forEach((barHeight, index) => {
    const x = startX + index * (barWidth + gap);
    context.fillRect(x, baseline - barHeight, barWidth, barHeight);
  });

  context.beginPath();
  context.arc(size * 0.76, size * 0.3, size * 0.08, 0, Math.PI * 2);
  context.fill();

  return context.getImageData(0, 0, size, size);
}

function drawRoundedRect(
  context: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const clampedRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + clampedRadius, y);
  context.lineTo(x + width - clampedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + clampedRadius);
  context.lineTo(x + width, y + height - clampedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - clampedRadius, y + height);
  context.lineTo(x + clampedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - clampedRadius);
  context.lineTo(x, y + clampedRadius);
  context.quadraticCurveTo(x, y, x + clampedRadius, y);
  context.closePath();
}

function interpolateHexColor(start: string, end: string, ratio: number): string {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const startRgb = hexToRgb(start);
  const endRgb = hexToRgb(end);

  return rgbToHex({
    red: interpolateChannel(startRgb.red, endRgb.red, clampedRatio),
    green: interpolateChannel(startRgb.green, endRgb.green, clampedRatio),
    blue: interpolateChannel(startRgb.blue, endRgb.blue, clampedRatio)
  });
}

function interpolateChannel(start: number, end: number, ratio: number): number {
  return Math.round(start + (end - start) * ratio);
}

function hexToRgb(hexColor: string): { red: number; green: number; blue: number } {
  const normalized = hexColor.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255
  };
}

function rgbToHex(color: { red: number; green: number; blue: number }): string {
  return `#${[color.red, color.green, color.blue]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}
