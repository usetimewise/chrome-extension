import { useEffect, useState } from "react";
import { MESSAGE_TYPES } from "../../../lib/constants.js";
import { sendBackgroundMessage } from "../../../lib/messaging/client.js";
import type { BootstrapResponse } from "../../../lib/types.js";
import { getErrorMessage } from "../../../lib/utils.js";
import { buildDebugExport, downloadJsonFile, exportFileName } from "../lib/export.js";

export function useDebugState() {
  const [debugState, setDebugState] = useState<BootstrapResponse | null>(null);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

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
    loadDebugState,
    exportDebugState
  };
}
