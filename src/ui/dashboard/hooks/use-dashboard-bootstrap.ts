import { useEffect, useRef, useState } from "react";
import { MESSAGE_TYPES } from "../../../lib/constants.js";
import { sendBackgroundMessage } from "../../../lib/messaging/client.js";
import type { BootstrapResponse, Recommendation } from "../../../lib/types.js";
import { isStartFocusRecommendation } from "../lib/presentation.js";

export function useDashboardBootstrap() {
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

  async function handleRecommendationAction(recommendation: Recommendation) {
    if (!isStartFocusRecommendation(recommendation)) {
      return;
    }

    await sendBackgroundMessage({
      type: MESSAGE_TYPES.startFocusSession,
      minutes: Number(recommendation.action?.payload?.minutes || 45)
    });
    await loadBootstrap(MESSAGE_TYPES.refreshViews);
  }

  useEffect(() => {
    void loadBootstrap(MESSAGE_TYPES.getBootstrap)
      .finally(() => loadBootstrap(MESSAGE_TYPES.refreshViews));
  }, []);

  return {
    bootstrap,
    reloadBootstrap: () => loadBootstrap(MESSAGE_TYPES.refreshViews),
    handleRecommendationAction
  };
}
