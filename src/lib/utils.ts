import { CATEGORY_LABELS } from "./constants.js";
import type { Category } from "./types.js";

export function generateId(): string {
    return crypto.randomUUID();
}

export function normalizeHost(url: string | null | undefined): string | null {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}

export function normalizePathHash(url: string | null | undefined): string {
    try {
        const pathname = new URL(url).pathname || "/";
        return btoa(pathname).slice(0, 64);
    } catch {
        return "";
    }
}

export function isTrackableUrl(url: unknown): url is string {
    return typeof url === "string" && /^(http|https):\/\//.test(url);
}

export function formatDuration(ms?: number | null): string {
    const totalSeconds = Math.floor((ms || 0) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m`;
    }
    return `${seconds}s`;
}

export function formatPercent(value?: number | null): string {
    return `${Math.round((value || 0) * 100)}%`;
}

export function humanizeCategory(category?: Category | string | null): string {
    return (
        (category && CATEGORY_LABELS[category as Category]) ||
        category ||
        "Unknown"
    );
}

export function hostMatchesRule(
    host: string | null | undefined,
    rule: string | null | undefined,
): boolean {
    if (!host || !rule) {
        return false;
    }
    return host === rule || host.endsWith(`.${rule}`);
}

export function escapeHTML(value: unknown): string {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function getErrorMessage(
    error: unknown,
    fallback = "Unknown error",
): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === "string" && error) {
        return error;
    }

    return fallback;
}

export function isPlainObject(
    value: unknown,
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
