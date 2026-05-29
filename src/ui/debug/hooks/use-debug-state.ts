import { useEffect, useState } from "react";
import { MESSAGE_TYPES } from "../../../lib/constants.js";
import { sendBackgroundMessage } from "../../../lib/messaging/client.js";
import type { BootstrapResponse } from "../../../lib/types.js";
import { getErrorMessage } from "../../../lib/utils.js";
import { buildDebugExport, downloadJsonFile, exportFileName } from "../lib/export.js";

function countPendingSiteClassifications(debugState: BootstrapResponse | null): number {
  return Object.values(debugState?.siteClassifications?.byHost || {})
    .filter((record) => (
      record.status === "pending" ||
      record.status === "retry_scheduled" ||
      record.status === "failed"
    ))
    .length;
}

export function useDebugState() {
  const [debugState, setDebugState] = useState<BootstrapResponse | null>(null);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isRetryingClassifications, setIsRetryingClassifications] = useState(false);

  async function loadDebugState(): Promise<BootstrapResponse | null> {
    try {
      const next = await sendBackgroundMessage({ type: MESSAGE_TYPES.getDebugState });
      setDebugState(next);
      setError("");
      return next;
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load debug state"));
      return null;
    }
  }

  async function exportDebugState(): Promise<void> {
    setIsExporting(true);
    try {
      const next = await loadDebugState();
      if (!next) {
        return;
      }

      const debugExport = buildDebugExport(next);
      downloadJsonFile(exportFileName(debugExport.exportedAt), debugExport);
    } catch (exportError) {
      setError(getErrorMessage(exportError, "Unable to export debug state"));
    } finally {
      setIsExporting(false);
    }
  }

  async function retrySiteClassifications(): Promise<void> {
    setIsRetryingClassifications(true);
    try {
      const response = await sendBackgroundMessage({ type: MESSAGE_TYPES.retrySiteClassifications });
      setDebugState((current) => current ? {
        ...current,
        dashboardCache: response.dashboardCache,
        siteClassifications: response.siteClassifications,
        lastError: response.lastError
      } : current);
      setError("");
      await loadDebugState();
    } catch (retryError) {
      setError(getErrorMessage(retryError, "Unable to retry site classifications"));
    } finally {
      setIsRetryingClassifications(false);
    }
  }

  useEffect(() => {
    void loadDebugState();

    const pollDebugState = (): void => {
      void loadDebugState();
    };

    const timer = window.setInterval(pollDebugState, 2000);
    return () => window.clearInterval(timer);
  }, []);

  return {
    debugState,
    error,
    isExporting,
    isRetryingClassifications,
    pendingClassificationCount: countPendingSiteClassifications(debugState),
    loadDebugState,
    exportDebugState,
    retrySiteClassifications
  };
}
