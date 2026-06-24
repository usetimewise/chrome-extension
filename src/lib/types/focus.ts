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

export interface FocusSessionsView {
    summary: {
        sessions_completed: number;
        average_duration_ms: number;
        longest_duration_ms: number;
    };
    active_session: FocusSession | null;
    items: FocusSession[];
    recommendations: Array<{
        id?: string;
        type?: string;
        priority?: string;
        title: string;
        body: string;
        action?: {
            type?: string;
            label?: string;
            payload?: {
                minutes?: number;
            };
        };
    }>;
}
