import { STORAGE_KEYS } from "../constants.js";
import type { DeviceState } from "../types.js";
import { generateId } from "../utils.js";
import { getFromStorage, setInStorage } from "./client.js";

export async function getDeviceState(): Promise<DeviceState> {
    const device = await getFromStorage<DeviceState | null>(
        STORAGE_KEYS.device,
        null,
    );
    if (device) {
        return device;
    }

    const next: DeviceState = {
        installationId: generateId(),
        deviceId: null,
        registeredAt: null,
    };
    await setInStorage(STORAGE_KEYS.device, next);
    return next;
}

export async function saveDeviceState(
    deviceState: DeviceState,
): Promise<DeviceState> {
    return setInStorage(STORAGE_KEYS.device, deviceState);
}

export async function resetDeviceRegistration(): Promise<DeviceState> {
    const deviceState = await getDeviceState();
    const next: DeviceState = {
        ...deviceState,
        deviceId: null,
        registeredAt: null,
    };
    await setInStorage(STORAGE_KEYS.device, next);
    return next;
}
