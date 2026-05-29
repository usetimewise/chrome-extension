import { classifySites } from "../../lib/api/site-rules.js";
import { recategorizeActivityEventsForHost } from "../../lib/storage/activity-events.js";
import {
  clearSiteClassification,
  ensureSiteClassificationPending,
  getHostsReadyForClassification,
  getNextClassificationRetryAt,
  getResolvedClassificationCategory,
  getSiteClassifications,
  saveResolvedSiteClassification,
  selectHostsForForcedClassification,
  scheduleSiteClassificationRetry
} from "../../lib/storage/site-classifications.js";
import { saveDashboardCache } from "../../lib/storage/dashboard-cache.js";
import { getSettings } from "../../lib/storage/site-rules.js";
import { getErrorMessage, hostMatchesRule } from "../../lib/utils.js";
import type { ActivityEvent, Category, Settings } from "../../lib/types.js";
import type { BackgroundRuntimeContext } from "../runtime/runtime-state.js";
import { withRegisteredDevice } from "../sync/sync-queue.js";

export const SITE_CLASSIFICATION_RETRY_ALARM = "site-classification-retry";
const SITE_CLASSIFICATION_BATCH_SIZE = 100;

let activeClassificationRun: Promise<number> | null = null;

function shouldSkipClassification(host: string, settings: Settings): boolean {
  if (settings.excludedHosts.some((rule) => hostMatchesRule(host, rule))) {
    return true;
  }

  return Object.keys(settings.categoryOverrides).some((rule) => hostMatchesRule(host, rule));
}

async function backfillResolvedCategory(host: string, category: Category, settings: Settings): Promise<void> {
  await recategorizeActivityEventsForHost(host, "other", category, settings);
}

export async function scheduleSiteClassificationAlarm(): Promise<void> {
  const nextRetryAt = await getNextClassificationRetryAt();
  await chrome.alarms.clear(SITE_CLASSIFICATION_RETRY_ALARM);
  if (nextRetryAt === null) {
    return;
  }
  chrome.alarms.create(SITE_CLASSIFICATION_RETRY_ALARM, {
    when: Math.max(Date.now() + 1_000, nextRetryAt)
  });
}

export async function ensureClassificationForHost(
  context: BackgroundRuntimeContext,
  host: string | null | undefined,
  refreshViews: (context: BackgroundRuntimeContext, options?: { includeSitesView?: boolean }) => Promise<unknown>
): Promise<void> {
  if (!host) {
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
  void processSiteClassificationQueue(context, refreshViews);
}

export function processSiteClassificationQueue(
  context: BackgroundRuntimeContext,
  refreshViews: (context: BackgroundRuntimeContext, options?: { includeSitesView?: boolean }) => Promise<unknown>
): Promise<void> {
  if (!activeClassificationRun) {
    activeClassificationRun = processSiteClassificationQueueNow(context, refreshViews, false)
      .finally(() => {
        activeClassificationRun = null;
      });
  }
  return activeClassificationRun.then((): void => undefined);
}

export async function retrySiteClassificationsNow(
  context: BackgroundRuntimeContext,
  refreshViews: (context: BackgroundRuntimeContext, options?: { includeSitesView?: boolean }) => Promise<unknown>
): Promise<number> {
  if (!activeClassificationRun) {
    activeClassificationRun = processSiteClassificationQueueNow(context, refreshViews, true)
      .finally(() => {
        activeClassificationRun = null;
      });
  }
  return activeClassificationRun;
}

async function processSiteClassificationQueueNow(
  context: BackgroundRuntimeContext,
  refreshViews: (context: BackgroundRuntimeContext, options?: { includeSitesView?: boolean }) => Promise<unknown>,
  forceRetry: boolean
): Promise<number> {
  const settings = await getSettings();
  let refreshed = false;
  let retriedCount = 0;
  const forcedQueue = forceRetry
    ? selectHostsForForcedClassification(await getSiteClassifications(), Number.MAX_SAFE_INTEGER)
    : null;

  while (true) {
    const readyHosts = forceRetry
      ? forcedQueue?.splice(0, SITE_CLASSIFICATION_BATCH_SIZE) || []
      : await getHostsReadyForClassification(SITE_CLASSIFICATION_BATCH_SIZE);
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
      const response = await withRegisteredDevice(async (resolvedSettings, deviceState) => (
        classifySites(resolvedSettings.apiBaseUrl, deviceState.deviceId, hosts)
      ));
      const resultsByHost = new Map(
        (response.results || []).map((item) => [String(item.domain || "").trim().toLowerCase(), item])
      );

      for (const host of hosts) {
        const result = resultsByHost.get(host);
        if (result?.category) {
          await saveResolvedSiteClassification(host, result.category);
          await backfillResolvedCategory(host, result.category, settings);
          refreshed = true;
          continue;
        }

        await scheduleSiteClassificationRetry(
          host,
          result?.error || result?.reason || "Missing classification result"
        );
      }

      await saveDashboardCache({ lastError: null });
    } catch (error) {
      const message = getErrorMessage(error, "Unable to classify sites");
      for (const host of hosts) {
        await scheduleSiteClassificationRetry(host, message);
      }
      await saveDashboardCache({ lastError: message });
      break;
    }
  }

  await scheduleSiteClassificationAlarm();
  if (refreshed) {
    await refreshViews(context, { includeSitesView: true });
  }

  return retriedCount;
}

export function applyCategoryToCurrentHost(host: string | null | undefined, category: Category | null): ActivityEvent["category"] {
  if (!host) {
    return undefined;
  }
  return category || "other";
}
