import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MESSAGE_TYPES } from "../../lib/constants.js";
import {
  createFocusCompanionPreview,
  listFocusCompanions
} from "../../lib/focus-companions/index.js";
import {
  DEFAULT_FOCUS_SESSION_MINUTES,
  MAX_FOCUS_SESSION_MINUTES,
  MIN_FOCUS_SESSION_MINUTES
} from "../../lib/local-focus-sessions.js";
import { sendBackgroundMessage } from "../../lib/messaging/client.js";
import {
  normalizeDefaultFocusMinutes,
  normalizePreferenceHost
} from "../../lib/storage/preferences.js";
import type { BootstrapResponse, UserPreferences } from "../../lib/types.js";
import { getErrorMessage } from "../../lib/utils.js";
import { usePopupBootstrap } from "./hooks/use-popup-bootstrap.js";

type FocusActionState =
  | { status: "idle" }
  | { status: "loading"; label: string }
  | { status: "error"; message: string };

type PopupView = "focus" | "settings";
type SettingsTab = "companion" | "focus" | "blocking";

type SettingsSaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string };

const SETTINGS_TABS: Array<{ id: SettingsTab; label: string; icon: string }> = [
  { id: "companion", label: "Персонаж", icon: "●" },
  { id: "focus", label: "Фокус", icon: "◷" },
  { id: "blocking", label: "Блокировка", icon: "◆" }
];

const FOCUS_PRESETS = [15, 25, 30, 45, 60, 90];

function clampFocusMinutes(value: number): number {
  return normalizeDefaultFocusMinutes(value);
}

function getDefaultFocusMinutes(bootstrap: BootstrapResponse | null): number {
  return clampFocusMinutes(bootstrap?.settings?.defaultFocusMinutes ?? DEFAULT_FOCUS_SESSION_MINUTES);
}

function buildPreferencesDraft(bootstrap: BootstrapResponse | null): UserPreferences {
  return {
    selectedCompanionId: bootstrap?.settings?.selectedCompanionId || "ceo",
    defaultFocusMinutes: getDefaultFocusMinutes(bootstrap),
    blockedHosts: [...(bootstrap?.settings?.blockedHosts || [])]
  };
}

function formatRemainingTime(value: number | undefined): string {
  const totalSeconds = Math.max(0, Math.ceil(Number(value || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function SettingsView({
  bootstrap,
  onBack,
  onSaved
}: {
  bootstrap: BootstrapResponse | null;
  onBack: () => void;
  onSaved: (bootstrap: BootstrapResponse) => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("companion");
  const [draft, setDraft] = useState<UserPreferences>(() => buildPreferencesDraft(bootstrap));
  const [newBlockedHost, setNewBlockedHost] = useState("");
  const [blockedHostError, setBlockedHostError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SettingsSaveState>({ status: "idle" });
  const initializedFromBootstrapRef = useRef(false);
  const blockedHosts = useMemo(() => [...draft.blockedHosts].sort(), [draft.blockedHosts]);
  const companionPreviews = useMemo(() => listFocusCompanions().map((companion) => (
    createFocusCompanionPreview(companion.id, {
      resolveAssetUrl: (path) => chrome.runtime.getURL(path)
    })
  )), []);

  useEffect(() => {
    if (!bootstrap || initializedFromBootstrapRef.current) {
      return;
    }

    setDraft(buildPreferencesDraft(bootstrap));
    initializedFromBootstrapRef.current = true;
  }, [bootstrap]);

  function handleAddBlockedHost() {
    const host = normalizePreferenceHost(newBlockedHost);
    if (!host) {
      setBlockedHostError("Введите корректный домен, например example.com");
      return;
    }

    if (draft.blockedHosts.includes(host)) {
      setBlockedHostError("Этот сайт уже есть в списке");
      return;
    }

    setDraft((current) => ({
      ...current,
      blockedHosts: [...current.blockedHosts, host].sort()
    }));
    setNewBlockedHost("");
    setBlockedHostError(null);
    setSaveState({ status: "idle" });
  }

  function handleRemoveBlockedHost(host: string) {
    setDraft((current) => ({
      ...current,
      blockedHosts: current.blockedHosts.filter((blockedHost) => blockedHost !== host)
    }));
    setSaveState({ status: "idle" });
  }

  async function handleSaveSettings() {
    if (saveState.status === "saving") {
      return;
    }

    setSaveState({ status: "saving" });
    try {
      const response = await sendBackgroundMessage({
        type: MESSAGE_TYPES.savePreferences,
        preferences: draft
      });
      onSaved(response.bootstrap);
      setDraft(response.payload);
      setSaveState({ status: "saved" });
      window.setTimeout(() => {
        setSaveState((current) => current.status === "saved" ? { status: "idle" } : current);
      }, 1800);
    } catch (error) {
      setSaveState({
        status: "error",
        message: getErrorMessage(error, "Не удалось сохранить настройки")
      });
    }
  }

  return (
    <main className="popup-shell popup-shell-settings" aria-label="Settings">
      <section className="settings-panel">
        <header className="settings-header">
          <button className="settings-icon-button" type="button" onClick={onBack} aria-label="Вернуться к фокусировке">
            ←
          </button>
          <div>
            <p className="popup-kicker">Time Wise</p>
            <h1 className="settings-title">Настройки</h1>
          </div>
        </header>

        <nav className="settings-tabs" aria-label="Разделы настроек">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "settings-tab is-active" : "settings-tab"}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {activeTab === "companion" ? (
            <div className="settings-section">
              <p className="settings-copy">Выберите компаньона, который будет появляться в блокировщике.</p>
              <div className="companion-grid">
                {companionPreviews.map((companion) => (
                  <button
                    key={companion.id}
                    className={draft.selectedCompanionId === companion.id
                      ? "companion-card is-selected"
                      : "companion-card"}
                    type="button"
                    onClick={() => {
                      setDraft((current) => ({ ...current, selectedCompanionId: companion.id }));
                      setSaveState({ status: "idle" });
                    }}
                  >
                    <span className={companion.visual.kind === "avatar"
                      ? `companion-avatar companion-avatar-${companion.visual.colorClass}`
                      : "companion-avatar"}
                    >
                      {companion.visual.kind === "image" ? (
                        <img src={companion.visual.src} alt="" />
                      ) : (
                        companion.visual.text
                      )}
                    </span>
                    <span className="companion-name">{companion.name}</span>
                    <span className="companion-role">{companion.role}</span>
                    <span className="companion-description">{companion.description}</span>
                    {draft.selectedCompanionId === companion.id ? (
                      <span className="companion-check" aria-label="Выбран">✓</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "focus" ? (
            <div className="settings-section">
              <p className="settings-copy">Длительность фокусировки по умолчанию.</p>
              <div className="focus-duration-readout">
                <strong>{draft.defaultFocusMinutes}</strong>
                <span>мин</span>
              </div>
              <input
                className="settings-range"
                type="range"
                min={MIN_FOCUS_SESSION_MINUTES}
                max={MAX_FOCUS_SESSION_MINUTES}
                step={1}
                value={draft.defaultFocusMinutes}
                onChange={(event) => {
                  const nextDefaultFocusMinutes = clampFocusMinutes(event.currentTarget.valueAsNumber);
                  setDraft((current) => ({
                    ...current,
                    defaultFocusMinutes: nextDefaultFocusMinutes
                  }));
                  setSaveState({ status: "idle" });
                }}
              />
              <div className="settings-range-labels">
                <span>{MIN_FOCUS_SESSION_MINUTES} мин</span>
                <span>{MAX_FOCUS_SESSION_MINUTES} мин</span>
              </div>
              <div className="focus-presets" aria-label="Быстрый выбор времени">
                {FOCUS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    className={draft.defaultFocusMinutes === preset ? "focus-preset is-active" : "focus-preset"}
                    type="button"
                    onClick={() => {
                      setDraft((current) => ({ ...current, defaultFocusMinutes: preset }));
                      setSaveState({ status: "idle" });
                    }}
                  >
                    {preset} мин
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "blocking" ? (
            <div className="settings-section">
              <p className="settings-copy">Эти сайты будут блокироваться во время активной фокусировки.</p>
              <div className="blocked-host-form">
                <input
                  className="blocked-host-input"
                  type="text"
                  value={newBlockedHost}
                  placeholder="example.com или https://example.com/path"
                  onChange={(event) => {
                    setNewBlockedHost(event.currentTarget.value);
                    setBlockedHostError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddBlockedHost();
                    }
                  }}
                />
                <button
                  className="blocked-host-add"
                  type="button"
                  onClick={handleAddBlockedHost}
                  disabled={!newBlockedHost.trim()}
                  aria-label="Добавить сайт"
                >
                  +
                </button>
              </div>
              {blockedHostError ? (
                <p className="popup-error-text" role="alert">{blockedHostError}</p>
              ) : null}
              <div className="blocked-host-list">
                {blockedHosts.length === 0 ? (
                  <p className="settings-empty">Список пуст.</p>
                ) : blockedHosts.map((host) => (
                  <div className="blocked-host-row" key={host}>
                    <span>{host}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedHost(host)}
                      aria-label={`Удалить ${host}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {blockedHosts.length > 0 ? (
                <p className="settings-muted">{blockedHosts.length} сайтов в списке</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="settings-footer">
          {saveState.status === "error" ? (
            <p className="popup-error-text" role="alert">{saveState.message}</p>
          ) : null}
          {saveState.status === "saved" ? (
            <p className="popup-status-text" role="status">Настройки сохранены</p>
          ) : null}
          <button
            className="popup-primary-button"
            type="button"
            onClick={() => void handleSaveSettings()}
            disabled={saveState.status === "saving" || !bootstrap}
          >
            {saveState.status === "saving" ? "Сохраняем..." : "Сохранить настройки"}
          </button>
        </footer>
      </section>
    </main>
  );
}

function PopupApp() {
  const { bootstrap, applyBootstrap, refreshBootstrap } = usePopupBootstrap();
  const [view, setView] = useState<PopupView>("focus");
  const [actionState, setActionState] = useState<FocusActionState>({ status: "idle" });
  const [selectedMinutes, setSelectedMinutes] = useState(() => getDefaultFocusMinutes(null));
  const didInitializeMinutesRef = useRef(false);
  const activeSession = bootstrap?.popupModel?.focusSession?.status === "active"
    ? bootstrap.popupModel.focusSession
    : null;
  const isFocusActive = Boolean(activeSession);
  const isLoading = !bootstrap || actionState.status === "loading";
  const buttonLabel = isFocusActive ? "Остановить фокусировку" : "Запустить фокусировку";

  useEffect(() => {
    if (!bootstrap || didInitializeMinutesRef.current) {
      return;
    }

    setSelectedMinutes(getDefaultFocusMinutes(bootstrap));
    didInitializeMinutesRef.current = true;
  }, [bootstrap]);

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

  if (view === "settings") {
    return (
      <SettingsView
        bootstrap={bootstrap}
        onBack={() => setView("focus")}
        onSaved={(nextBootstrap) => {
          applyBootstrap(nextBootstrap);
          setSelectedMinutes(getDefaultFocusMinutes(nextBootstrap));
        }}
      />
    );
  }

  return (
    <main className="popup-shell" aria-label="Focus mode">
      <section className="popup-focus-panel" aria-busy={isLoading}>
        <header className="popup-focus-header">
          <p className="popup-kicker">Time Wise</p>
          <button
            className="settings-icon-button"
            type="button"
            onClick={() => setView("settings")}
            aria-label="Открыть настройки"
          >
            ⚙
          </button>
        </header>
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
