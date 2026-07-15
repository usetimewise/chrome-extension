import { registerDevice } from "../../lib/api/devices.js";
import { IS_BACKEND_INTEGRATION_ENABLED } from "../../lib/app-settings.js";
import {
    getDeviceState,
    resetDeviceRegistration,
    saveDeviceState,
} from "../../lib/storage/device-state.js";
import { getSettings } from "../../lib/storage/site-rules.js";
import type { DeviceState, Settings } from "../../lib/types.js";

function isDeviceRegistrationMismatch(error: unknown): boolean {
    const message = String(
        (error as { message?: string } | null)?.message || "",
    ).toLowerCase();
    return (
        message.includes("device is not registered") ||
        message.includes("preferences_device_id_fkey")
    );
}

export async function ensureDeviceRegistration(
    force = false,
): Promise<DeviceState> {
    const deviceState = await getDeviceState();
    if (!IS_BACKEND_INTEGRATION_ENABLED) {
        return deviceState;
    }

    const settings = await getSettings();
    if (deviceState.deviceId && !force) {
        return deviceState;
    }

    try {
        const response = await registerDevice(settings.apiBaseUrl, {
            installation_id: deviceState.installationId,
            timezone: settings.timezone,
            locale: chrome.i18n.getUILanguage(),
            platform: navigator.userAgent,
            app_version: chrome.runtime.getManifest().version,
        });

        const next: DeviceState = {
            ...deviceState,
            deviceId: response.device_id,
            registeredAt: new Date().toISOString(),
        };
        await saveDeviceState(next);
        return next;
    } catch {
        return deviceState;
    }
}

export async function withRegisteredDevice<T>(
    action: (settings: Settings, deviceState: DeviceState) => Promise<T>,
): Promise<T> {
    if (!IS_BACKEND_INTEGRATION_ENABLED) {
        throw new Error("Backend integration is disabled");
    }

    let settings = await getSettings();
    let deviceState = await ensureDeviceRegistration();

    if (!deviceState.deviceId) {
        throw new Error("Device is not registered yet");
    }

    try {
        return await action(settings, deviceState);
    } catch (error) {
        if (!isDeviceRegistrationMismatch(error)) {
            throw error;
        }

        await resetDeviceRegistration();
        settings = await getSettings();
        deviceState = await ensureDeviceRegistration(true);
        if (!deviceState.deviceId) {
            throw error;
        }

        return action(settings, deviceState);
    }
}
