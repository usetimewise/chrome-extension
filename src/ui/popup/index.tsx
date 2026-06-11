import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MESSAGE_TYPES } from "../../lib/constants.js";
import {
  DEFAULT_FOCUS_SESSION_MINUTES,
  MAX_FOCUS_SESSION_MINUTES,
  MIN_FOCUS_SESSION_MINUTES
} from "../../lib/local-focus-sessions.js";
import { sendBackgroundMessage } from "../../lib/messaging/client.js";
import { getErrorMessage } from "../../lib/utils.js";
import { usePopupBootstrap } from "./hooks/use-popup-bootstrap.js";

type FocusActionState =
  | { status: "idle" }
  | { status: "loading"; label: string }
  | { status: "error"; message: string };

function clampFocusMinutes(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_FOCUS_SESSION_MINUTES;
  }

  return Math.min(MAX_FOCUS_SESSION_MINUTES, Math.max(MIN_FOCUS_SESSION_MINUTES, Math.round(value)));
}

function formatRemainingTime(value: number | undefined): string {
  const totalSeconds = Math.max(0, Math.ceil(Number(value || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function PopupApp() {
  const { bootstrap, refreshBootstrap } = usePopupBootstrap();
  const [actionState, setActionState] = useState<FocusActionState>({ status: "idle" });
  const [selectedMinutes, setSelectedMinutes] = useState(DEFAULT_FOCUS_SESSION_MINUTES);
  const activeSession = bootstrap?.popupModel?.focusSession?.status === "active"
    ? bootstrap.popupModel.focusSession
    : null;
  const isFocusActive = Boolean(activeSession);
  const isLoading = !bootstrap || actionState.status === "loading";
  const buttonLabel = isFocusActive ? "Остановить фокусировку" : "Запустить фокусировку";

  async function handleToggleFocus() {
    if (actionState.status === "loading") {
      return;
    }

    setActionState({ status: "loading", label: buttonLabel });
    try {
      if (activeSession) {
        await sendBackgroundMessage({
          type: MESSAGE_TYPES.endFocusSession,
          sessionId: activeSession.id
        });
      } else {
        await sendBackgroundMessage({
          type: MESSAGE_TYPES.startFocusSession,
          minutes: clampFocusMinutes(selectedMinutes)
        });
      }
      await refreshBootstrap();
      setActionState({ status: "idle" });
    } catch (error) {
      setActionState({
        status: "error",
        message: getErrorMessage(error, "Не удалось изменить режим фокусировки")
      });
    }
  }

  return (
    <main className="popup-shell" aria-label="Focus mode">
      <section className="popup-focus-panel" aria-busy={isLoading}>
        <p className="popup-kicker">Time Wise</p>
        <h1 className="popup-focus-title">
          {isFocusActive ? "Фокусировка включена" : "Фокусировка выключена"}
        </h1>
        <p className="popup-focus-copy">
          {isFocusActive
            ? "Режим фокусировки активен. Отвлекающие сайты будут перекрыты предупреждением."
            : "Включите режим фокусировки, когда хотите убрать отвлекающие сайты из текущей сессии."}
        </p>

        {activeSession ? (
          <div className="popup-countdown" aria-live="polite">
            <span className="popup-countdown-label">Осталось</span>
            <strong className="popup-countdown-value">{formatRemainingTime(activeSession.remaining_ms)}</strong>
          </div>
        ) : (
          <label className="popup-timepicker">
            <span className="popup-timepicker-label">Время фокусировки, минут</span>
            <input
              className="popup-timepicker-input"
              type="number"
              min={MIN_FOCUS_SESSION_MINUTES}
              max={MAX_FOCUS_SESSION_MINUTES}
              step={5}
              value={selectedMinutes}
              onChange={(event) => setSelectedMinutes(clampFocusMinutes(event.currentTarget.valueAsNumber))}
              onBlur={() => setSelectedMinutes((value) => clampFocusMinutes(value))}
              disabled={isLoading}
            />
          </label>
        )}

        <button
          className={isFocusActive ? "popup-primary-button is-danger" : "popup-primary-button"}
          type="button"
          onClick={() => void handleToggleFocus()}
          disabled={isLoading}
        >
          {actionState.status === "loading" ? actionState.label : buttonLabel}
        </button>

        {!bootstrap ? (
          <p className="popup-status-text" role="status">Загружаем состояние...</p>
        ) : null}

        {actionState.status === "error" ? (
          <p className="popup-error-text" role="alert">{actionState.message}</p>
        ) : null}
      </section>
    </main>
  );
}

export function mountPopupApp(root: HTMLElement): void {
  createRoot(root).render(<PopupApp />);
}
