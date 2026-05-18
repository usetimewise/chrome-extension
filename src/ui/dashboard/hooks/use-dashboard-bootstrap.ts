import { useEffect, useState } from "react";
import { MESSAGE_TYPES } from "../../../lib/constants.js";
import { sendBackgroundMessage } from "../../../lib/messaging/client.js";
import type { BootstrapResponse, Recommendation } from "../../../lib/types.js";
import { isStartFocusRecommendation } from "../lib/presentation.js";

export function useDashboardBootstrap() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);

  async function reloadBootstrap() {
    const next = await sendBackgroundMessage({ type: MESSAGE_TYPES.getBootstrap });
    setBootstrap(next);
  }

  async function handleRecommendationAction(recommendation: Recommendation) {
    if (!isStartFocusRecommendation(recommendation)) {
      return;
    }

    await sendBackgroundMessage({
      type: MESSAGE_TYPES.startFocusSession,
      minutes: Number(recommendation.action?.payload?.minutes || 45)
    });
    await reloadBootstrap();
  }

  useEffect(() => {
    void reloadBootstrap();
  }, []);

  return {
    bootstrap,
    reloadBootstrap,
    handleRecommendationAction
  };
}
