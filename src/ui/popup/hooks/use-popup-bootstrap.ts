import { useEffect, useRef, useState } from "react";
import { MESSAGE_TYPES } from "../../../lib/constants.js";
import { sendBackgroundMessage } from "../../../lib/messaging/client.js";
import type { BootstrapResponse } from "../../../lib/types.js";

export function usePopupBootstrap() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const bootstrapInFlightRef = useRef(false);
  const refreshInFlightRef = useRef(false);

  async function loadBootstrap(messageType: typeof MESSAGE_TYPES.getBootstrap | typeof MESSAGE_TYPES.refreshViews) {
    if (messageType === MESSAGE_TYPES.refreshViews) {
      if (refreshInFlightRef.current) {
        return;
      }

      refreshInFlightRef.current = true;
      try {
        const next = await sendBackgroundMessage({ type: MESSAGE_TYPES.refreshViews });
        setBootstrap((current) => (current ? { ...current, ...next } : next));
      } finally {
        refreshInFlightRef.current = false;
      }
      return;
    }

    if (bootstrapInFlightRef.current) {
      return;
    }

    bootstrapInFlightRef.current = true;
    try {
      const next = await sendBackgroundMessage({ type: MESSAGE_TYPES.getBootstrap });
      setBootstrap(next);
    } finally {
      bootstrapInFlightRef.current = false;
    }
  }

  useEffect(() => {
    let refreshTimer: number | null = null;

    void loadBootstrap(MESSAGE_TYPES.getBootstrap)
      .finally(() => loadBootstrap(MESSAGE_TYPES.refreshViews));

    refreshTimer = window.setInterval(() => {
      void loadBootstrap(MESSAGE_TYPES.getBootstrap);
    }, 1000);

    return () => {
      if (refreshTimer !== null) {
        window.clearInterval(refreshTimer);
      }
    };
  }, []);

  return {
    bootstrap,
    refreshBootstrap: () => loadBootstrap(MESSAGE_TYPES.refreshViews)
  };
}
