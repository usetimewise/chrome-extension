import { DEFAULT_DASHBOARD_CACHE, STORAGE_KEYS } from "../constants.js";
import type { DashboardCache } from "../types.js";
import { getFromStorage, setInStorage } from "./client.js";

export async function getDashboardCache(): Promise<DashboardCache> {
  const cached = await getFromStorage<Partial<DashboardCache> | null>(STORAGE_KEYS.dashboardCache, null);
  return {
    ...DEFAULT_DASHBOARD_CACHE,
    ...(cached || {})
  };
}

export async function saveDashboardCache(cachePatch: Partial<DashboardCache>): Promise<DashboardCache> {
  const current = await getDashboardCache();
  const next: DashboardCache = {
    ...current,
    ...cachePatch
  };
  return setInStorage(STORAGE_KEYS.dashboardCache, next);
}
