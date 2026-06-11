import { getFocusSessions } from "../../lib/storage/focus-sessions.js";
import { getSettings } from "../../lib/storage/site-rules.js";
import type { FocusSession } from "../../lib/types.js";
import { updateProductivityActionIcon } from "../action/productivity-icon.js";

export const FOCUS_SESSION_TIMER_ALARM = "TWT_FOCUS_SESSION_TIMER";

async function clearFocusSessionTimer(): Promise<void> {
  await chrome.alarms.clear(FOCUS_SESSION_TIMER_ALARM);
}

async function scheduleFocusSessionTimer(): Promise<void> {
  await clearFocusSessionTimer();
}

export async function syncFocusSessionTimer(): Promise<FocusSession[]> {
  const sessions = await getFocusSessions();
  const settings = await getSettings();
  const activeSession = sessions.find((session) => session.status === "active") || null;

  if (!activeSession) {
    await clearFocusSessionTimer();
    await updateProductivityActionIcon(false, settings.language);
    return sessions;
  }

  await scheduleFocusSessionTimer();
  await updateProductivityActionIcon(true, settings.language);
  return sessions;
}
