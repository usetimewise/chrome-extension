import type { BootstrapResponse } from "../../../lib/types.js";

export function exportFileName(exportedAt: string): string {
  const safeTimestamp = exportedAt.replace(/[:.]/g, "-");
  return `time-wise-debug-${safeTimestamp}.json`;
}

export function buildDebugExport(debugState: BootstrapResponse) {
  const manifest = chrome.runtime.getManifest();

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    metadata: {
      extensionVersion: manifest.version,
      manifestVersion: manifest.manifest_version,
      userAgent: window.navigator.userAgent,
      language: window.navigator.language,
      languages: Array.from(window.navigator.languages || []),
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    snapshot: debugState
  };
}

export function downloadJsonFile(fileName: string, value: unknown): void {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
