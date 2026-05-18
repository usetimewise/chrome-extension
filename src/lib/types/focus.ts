export type FocusSessionStatus = "active" | "paused" | "completed";

export interface FocusSession {
  id: string;
  intent: string;
  status: FocusSessionStatus;
  planned_minutes: number;
  started_at: string;
  last_resumed_at: string | null;
  active_duration_ms: number;
  pause_count: number;
  distraction_count: number;
  ended_at?: string;
  remaining_ms?: number;
}

export interface FocusSessionRequest {
  intent?: string;
  duration_minutes?: number;
  minutes?: number;
}
