import type { TrackingStatus } from "../../lib/types.js";
import { normalizeHost } from "../../lib/utils.js";

export interface ClassifiedUrl {
  status: TrackingStatus;
  host: string | null;
  safeUrl: string | null;
}

export function safeTabUrl(tab: chrome.tabs.Tab | null | undefined): string | null {
  return typeof tab?.url === "string" ? tab.url : null;
}

export function classifyUrl(url: string | null | undefined): ClassifiedUrl {
  if (typeof url !== "string" || !url) {
    return { status: "unknown_url", host: "unknown_url", safeUrl: null };
  }

  if (/^(http|https):\/\//.test(url)) {
    return {
      status: "active_tracked",
      host: normalizeHost(url),
      safeUrl: url
    };
  }

  if (url.startsWith("chrome-extension://")) {
    return { status: "restricted_page", host: "extension_page", safeUrl: null };
  }

  if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
    return { status: "restricted_page", host: "browser_internal", safeUrl: null };
  }

  if (url.startsWith("file://")) {
    return { status: "restricted_page", host: "file_page", safeUrl: null };
  }

  return { status: "unknown_url", host: "unknown_url", safeUrl: null };
}
