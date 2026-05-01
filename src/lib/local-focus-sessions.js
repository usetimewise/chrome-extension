import { generateId } from "./utils.js";

function nowISO(now = new Date()) {
  return now.toISOString();
}

export function sessionDuration(session, now = new Date()) {
  let duration = Number(session?.active_duration_ms || 0);
  if (session?.status === "active" && session.last_resumed_at) {
    const resumedAt = Date.parse(session.last_resumed_at);
    if (!Number.isNaN(resumedAt)) {
      duration += Math.max(0, now.getTime() - resumedAt);
    }
  }
  return duration;
}

function sortSessions(sessions) {
  return [...sessions].sort((a, b) => Date.parse(b.started_at || "") - Date.parse(a.started_at || ""));
}

export function startFocusSession(sessions = [], request = {}, now = new Date()) {
  const active = sessions.find((session) => session.status === "active");
  if (active) {
    return { sessions, session: active };
  }

  const timestamp = nowISO(now);
  const session = {
    id: generateId(),
    intent: request.intent || "Focus block",
    status: "active",
    planned_minutes: Number(request.duration_minutes || request.minutes || 45),
    started_at: timestamp,
    last_resumed_at: timestamp,
    active_duration_ms: 0,
    pause_count: 0,
    distraction_count: 0
  };
  return {
    sessions: sortSessions([session, ...sessions]),
    session
  };
}

export function transitionFocusSession(sessions = [], sessionId, action, now = new Date()) {
  let changedSession = null;
  const timestamp = nowISO(now);
  const next = sessions.map((session) => {
    if (session.id !== sessionId) {
      return session;
    }

    const updated = { ...session };
    if (action === "pause" && updated.status === "active") {
      updated.active_duration_ms = sessionDuration(updated, now);
      updated.last_resumed_at = null;
      updated.status = "paused";
      updated.pause_count = Number(updated.pause_count || 0) + 1;
    } else if (action === "resume" && updated.status === "paused") {
      updated.status = "active";
      updated.last_resumed_at = timestamp;
    } else if (action === "end") {
      updated.active_duration_ms = sessionDuration(updated, now);
      updated.status = "completed";
      updated.last_resumed_at = null;
      updated.ended_at = timestamp;
    }
    changedSession = updated;
    return updated;
  });

  if (!changedSession) {
    throw new Error("focus session not found");
  }

  return {
    sessions: sortSessions(next),
    session: changedSession
  };
}

export function buildFocusSessionsView(sessions = [], now = new Date()) {
  const sorted = sortSessions(sessions).map((session) => ({
    ...session,
    active_duration_ms: sessionDuration(session, now)
  }));
  const activeSession = sorted.find((session) => session.status === "active") || null;
  const completed = sorted.filter((session) => session.status === "completed");
  const totalDuration = completed.reduce((sum, session) => sum + Number(session.active_duration_ms || 0), 0);
  const longest = completed.reduce((max, session) => Math.max(max, Number(session.active_duration_ms || 0)), 0);

  return {
    summary: {
      sessions_completed: completed.length,
      average_duration_ms: completed.length ? Math.round(totalDuration / completed.length) : 0,
      longest_duration_ms: longest
    },
    active_session: activeSession,
    items: sorted.slice(0, 20),
    recommendations: [{
      id: "session-duration",
      type: "session",
      priority: "low",
      title: "Keep the next block realistic",
      body: "The best session length is the one you finish. Use your recent average as the default, then stretch later.",
      action: { type: "start_focus_session", label: "Start another session", payload: { minutes: 45 } }
    }]
  };
}
