import { useEffect, useRef, useState } from "react";
import { MESSAGE_TYPES } from "../../../lib/constants.js";
import { sendBackgroundMessage } from "../../../lib/messaging/client.js";
import type { BootstrapResponse } from "../../../lib/types.js";

export function usePopupBootstrap() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const bootstrapInFlightRef = useRef(false);

  async function loadBootstrap() {
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

    void loadBootstrap();

    refreshTimer = window.setInterval(() => {
      void loadBootstrap();
    }, 1000);

    return () => {
      if (refreshTimer !== null) {
        window.clearInterval(refreshTimer);
      }
    };
  }, []);

  return {
    bootstrap,
    refreshBootstrap: loadBootstrap
  };
}
