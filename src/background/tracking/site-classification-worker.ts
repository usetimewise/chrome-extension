import { classifySites } from "../../lib/api/site-rules.js";
import { IS_BACKEND_INTEGRATION_ENABLED } from "../../lib/app-settings.js";
import {
    clearSiteClassification,
    ensureSiteClassificationPending,
    getHostsReadyForClassification,
    getNextClassificationRetryAt,
    getResolvedClassificationCategory,
    getSiteClassifications,
    saveResolvedSiteClassification,
    selectHostsForForcedClassification,
    scheduleSiteClassificationRetry,
} from "../../lib/storage/site-classifications.js";
import { getSettings } from "../../lib/storage/site-rules.js";
import { getErrorMessage, hostMatchesRule } from "../../lib/utils.js";
import type { Settings } from "../../lib/types.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";
import { withRegisteredDevice } from "../device/registration.js";

export const SITE_CLASSIFICATION_RETRY_ALARM = "site-classification-retry";
const SITE_CLASSIFICATION_BATCH_SIZE = 100;

let activeClassificationRun: Promise<number> | null = null;

function shouldSkipClassification(host: string, settings: Settings): boolean {
    if (settings.excludedHosts.some((rule) => hostMatchesRule(host, rule))) {
        return true;
    }

    return Object.keys(settings.categoryOverrides).some((rule) =>
        hostMatchesRule(host, rule),
    );
}

export async function scheduleSiteClassificationAlarm(): Promise<void> {
    await chrome.alarms.clear(SITE_CLASSIFICATION_RETRY_ALARM);
    if (!IS_BACKEND_INTEGRATION_ENABLED) {
        return;
    }

    const nextRetryAt = await getNextClassificationRetryAt();
    if (nextRetryAt === null) {
        return;
    }
    chrome.alarms.create(SITE_CLASSIFICATION_RETRY_ALARM, {
        when: Math.max(Date.now() + 1_000, nextRetryAt),
    });
}

export async function ensureClassificationForHost(
    context: BackgroundRuntimeContext,
    host: string | null | undefined,
): Promise<void> {
    if (!IS_BACKEND_INTEGRATION_ENABLED || !host) {
        return;
    }

    const settings = await getSettings();
    if (shouldSkipClassification(host, settings)) {
        await clearSiteClassification(host);
        await scheduleSiteClassificationAlarm();
        return;
    }

    const currentState = await getSiteClassifications();
    if (getResolvedClassificationCategory(host, currentState)) {
        await scheduleSiteClassificationAlarm();
        return;
    }

    await ensureSiteClassificationPending(host);
    await scheduleSiteClassificationAlarm();
    void processSiteClassificationQueue(context);
}

export function processSiteClassificationQueue(
    context: BackgroundRuntimeContext,
): Promise<void> {
    if (!IS_BACKEND_INTEGRATION_ENABLED) {
        return Promise.resolve();
    }

    if (!activeClassificationRun) {
        activeClassificationRun = processSiteClassificationQueueNow(
            context,
            false,
        ).finally(() => {
            activeClassificationRun = null;
        });
    }
    return activeClassificationRun.then((): void => undefined);
}

export async function retrySiteClassificationsNow(
    context: BackgroundRuntimeContext,
): Promise<number> {
    if (!IS_BACKEND_INTEGRATION_ENABLED) {
        return 0;
    }

    if (!activeClassificationRun) {
        activeClassificationRun = processSiteClassificationQueueNow(
            context,
            true,
        ).finally(() => {
            activeClassificationRun = null;
        });
    }
    return activeClassificationRun;
}

async function processSiteClassificationQueueNow(
    _context: BackgroundRuntimeContext,
    forceRetry: boolean,
): Promise<number> {
    const settings = await getSettings();
    let retriedCount = 0;
    const forcedQueue = forceRetry
        ? selectHostsForForcedClassification(
              await getSiteClassifications(),
              Number.MAX_SAFE_INTEGER,
          )
        : null;

    while (true) {
        const readyHosts = forceRetry
            ? forcedQueue?.splice(0, SITE_CLASSIFICATION_BATCH_SIZE) || []
            : await getHostsReadyForClassification(
                  SITE_CLASSIFICATION_BATCH_SIZE,
              );
        const hosts: string[] = [];
        for (const host of readyHosts) {
            if (shouldSkipClassification(host, settings)) {
                await clearSiteClassification(host);
                continue;
            }
            hosts.push(host);
        }

        if (!hosts.length) {
            break;
        }

        retriedCount += hosts.length;

        try {
            const response = await withRegisteredDevice(
                async (resolvedSettings, deviceState) =>
                    classifySites(
                        resolvedSettings.apiBaseUrl,
                        deviceState.deviceId,
                        hosts,
                    ),
            );
            const resultsByHost = new Map(
                (response.results || []).map((item) => [
                    String(item.domain || "")
                        .trim()
                        .toLowerCase(),
                    item,
                ]),
            );

            for (const host of hosts) {
                const result = resultsByHost.get(host);
                if (result?.category) {
                    await saveResolvedSiteClassification(host, result.category);
                    continue;
                }

                await scheduleSiteClassificationRetry(
                    host,
                    result?.error ||
                        result?.reason ||
                        "Missing classification result",
                );
            }
        } catch (error) {
            const message = getErrorMessage(error, "Unable to classify sites");
            for (const host of hosts) {
                await scheduleSiteClassificationRetry(host, message);
            }
            break;
        }
    }

    await scheduleSiteClassificationAlarm();
    return retriedCount;
}
