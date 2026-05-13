import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./common.css";
import "./debug.css";

import { MESSAGE_TYPES } from "../lib/constants.js";
import type { ActivityEvent, BootstrapResponse, TrackingTransition } from "../lib/types.js";
import { formatDuration } from "../lib/utils.js";

async function sendMessage<TResponse = BootstrapResponse>(message: Record<string, unknown>): Promise<TResponse> {
  return chrome.runtime.sendMessage(message);
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "n/a";
  }

  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return "n/a";
  }

  return new Date(time).toLocaleString();
}

function statusLabel(event: ActivityEvent): string {
  return event.tracking_status || "active_tracked";
}

function totalByStatus(events: ActivityEvent[]) {
  return events.reduce<Record<string, number>>((totals, event) => {
    const status = statusLabel(event);
    totals[status] = (totals[status] || 0) + Number(event.duration_ms || 0);
    return totals;
  }, {});
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>;
}

function IntervalTable({ events }: { events: ActivityEvent[] }) {
  const latest = [...events]
    .sort((a, b) => Date.parse(b.occurred_at || "") - Date.parse(a.occurred_at || ""))
    .slice(0, 20);

  return (
    <div className="debug-table" role="table" aria-label="Latest intervals">
      <div className="debug-row debug-head" role="row">
        <span>Status</span>
        <span>Start</span>
        <span>Duration</span>
        <span>Host</span>
        <span>Reason</span>
      </div>
      {latest.map((event) => (
        <div className="debug-row" role="row" key={event.event_id}>
          <span>{statusLabel(event)}</span>
          <span>{formatDate(event.occurred_at)}</span>
          <span>{formatDuration(event.duration_ms)}</span>
          <span>{event.host || "none"}</span>
          <span>{event.reason || "n/a"}</span>
        </div>
      ))}
    </div>
  );
}

function TransitionTable({ transitions }: { transitions: TrackingTransition[] }) {
  const latest = [...transitions]
    .sort((a, b) => Date.parse(b.occurred_at || "") - Date.parse(a.occurred_at || ""))
    .slice(0, 30);

  return (
    <div className="debug-table" role="table" aria-label="Latest transitions">
      <div className="debug-row debug-head" role="row">
        <span>Type</span>
        <span>Time</span>
        <span>URL class</span>
        <span>Tab</span>
        <span>Reason</span>
      </div>
      {latest.map((transition) => (
        <div className="debug-row" role="row" key={transition.id}>
          <span>{transition.type}</span>
          <span>{formatDate(transition.occurred_at)}</span>
          <span>{transition.url_class || "n/a"}</span>
          <span>{transition.tab_id ?? "none"}</span>
          <span>{transition.reason || "n/a"}</span>
        </div>
      ))}
    </div>
  );
}

function DebugApp() {
  const [debugState, setDebugState] = useState<BootstrapResponse | null>(null);
  const [error, setError] = useState("");

  async function loadDebugState() {
    try {
      const next = await sendMessage<BootstrapResponse>({ type: MESSAGE_TYPES.getDebugState });
      setDebugState(next);
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Unable to load debug state");
    }
  }

  useEffect(() => {
    void loadDebugState();
    const timer = window.setInterval(() => void loadDebugState(), 2000);
    return () => window.clearInterval(timer);
  }, []);

  const events = debugState?.activityEvents || [];
  const transitions = debugState?.transitions || [];
  const totals = useMemo(() => totalByStatus(events), [events]);
  const summary = debugState?.dashboardCache?.todayView?.summary;
  const suspiciousEvents = events.filter((event) => (
    event.tracking_status === "suspicious_gap" ||
    event.tracking_status === "extension_inactive"
  ));

  return (
    <main className="debug-shell">
      <header className="debug-header">
        <div>
          <h1>Tracking Debug</h1>
          <p>{error || `Queue ${debugState?.queueSize ?? 0} events, ${events.length} intervals, ${transitions.length} transitions`}</p>
        </div>
        <button className="debug-refresh" type="button" onClick={() => void loadDebugState()}>
          <span className="fa-solid fa-rotate" aria-hidden="true" />
          Refresh
        </button>
      </header>

      <section className="debug-grid" aria-label="Diagnostic totals">
        {Object.entries(totals).map(([status, duration]) => (
          <article className="debug-card" key={status}>
            <strong>{formatDuration(duration)}</strong>
            <span>{status}</span>
          </article>
        ))}
        <article className="debug-card">
          <strong>{summary?.suspicious_gap_count || suspiciousEvents.length}</strong>
          <span>suspicious gaps</span>
        </article>
        <article className="debug-card">
          <strong>{formatDuration(summary?.max_interval_ms || 0)}</strong>
          <span>max interval</span>
        </article>
      </section>

      <section className="debug-panel" aria-labelledby="runtimeHeading">
        <h2 id="runtimeHeading">Runtime State</h2>
        <JsonBlock value={debugState?.runtimeState || {}} />
      </section>

      <section className="debug-panel" aria-labelledby="syncHeading">
        <h2 id="syncHeading">Sync State</h2>
        <JsonBlock value={{
          queueSize: debugState?.queueSize || 0,
          lastSyncAt: debugState?.dashboardCache?.lastSyncAt || null,
          lastError: debugState?.dashboardCache?.lastError || null
        }} />
      </section>

      <section className="debug-panel" aria-labelledby="intervalHeading">
        <h2 id="intervalHeading">Latest Diagnostic Intervals</h2>
        <IntervalTable events={events} />
      </section>

      <section className="debug-panel" aria-labelledby="transitionHeading">
        <h2 id="transitionHeading">Latest Transitions</h2>
        <TransitionTable transitions={transitions} />
      </section>
    </main>
  );
}

const root = document.getElementById("debugRoot");
if (root) {
  createRoot(root).render(<DebugApp />);
}
