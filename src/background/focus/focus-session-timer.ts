import { getFocusSessions, saveFocusSessions } from "../../lib/storage/focus-sessions.js";
import { isFocusSessionExpired, sessionRemainingMs, transitionFocusSession } from "../../lib/local-focus-sessions.js";
import type { FocusSession } from "../../lib/types.js";
import { updateProductivityActionIcon } from "../action/productivity-icon.js";

export const FOCUS_SESSION_TIMER_ALARM = "TWT_FOCUS_SESSION_TIMER";

async function clearFocusSessionTimer(): Promise<void> {
  await chrome.alarms.clear(FOCUS_SESSION_TIMER_ALARM);
}

async function scheduleFocusSessionTimer(activeSession: FocusSession | null, now = new Date()): Promise<void> {
  if (!activeSession || activeSession.status !== "active") {
    await clearFocusSessionTimer();
    return;
  }

  const remainingMs = sessionRemainingMs(activeSession, now);
  if (remainingMs <= 0) {
    await clearFocusSessionTimer();
    return;
  }

  chrome.alarms.create(FOCUS_SESSION_TIMER_ALARM, {
    when: now.getTime() + remainingMs
  });
}

export async function syncFocusSessionTimer(now = new Date()): Promise<FocusSession[]> {
  const sessions = await getFocusSessions();
  const activeSession = sessions.find((session) => session.status === "active") || null;

  if (!activeSession) {
    await clearFocusSessionTimer();
    await updateProductivityActionIcon(false);
    return sessions;
  }

  if (isFocusSessionExpired(activeSession, now)) {
    const result = transitionFocusSession(sessions, activeSession.id, "end", now);
    await saveFocusSessions(result.sessions);
    await clearFocusSessionTimer();
    await updateProductivityActionIcon(false);
    return result.sessions;
  }

  await scheduleFocusSessionTimer(activeSession, now);
  await updateProductivityActionIcon(true);
  return sessions;
}
