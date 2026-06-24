import { getErrorMessage, isPlainObject } from "../utils.js";
import type { ApiErrorPayload } from "../types/api.js";

export class ApiClientError extends Error {
    status: number;
    payload: ApiErrorPayload | null;

    constructor(
        message: string,
        status: number,
        payload: ApiErrorPayload | null = null,
    ) {
        super(message);
        this.name = "ApiClientError";
        this.status = status;
        this.payload = payload;
    }
}

export function buildHeaders(deviceId?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (deviceId) {
        headers["X-Device-Id"] = deviceId;
    }

    return headers;
}

function toApiErrorPayload(payload: unknown): ApiErrorPayload | null {
    if (!isPlainObject(payload)) {
        return null;
    }

    return {
        error: typeof payload.error === "string" ? payload.error : undefined,
        code: typeof payload.code === "string" ? payload.code : undefined,
        details: isPlainObject(payload.details) ? payload.details : undefined,
    };
}

export async function requestJSON<T>(
    baseUrl: string,
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, options);
    const payload = (await response.json().catch((): null => null)) as unknown;

    if (!response.ok) {
        const errorPayload = toApiErrorPayload(payload);
        throw new ApiClientError(
            errorPayload?.error ||
                `Request failed with status ${response.status}`,
            response.status,
            errorPayload,
        );
    }

    return payload as T;
}

export function normalizeApiError(
    error: unknown,
    fallback = "Request failed",
): ApiClientError {
    if (error instanceof ApiClientError) {
        return error;
    }

    return new ApiClientError(getErrorMessage(error, fallback), 0, null);
}
