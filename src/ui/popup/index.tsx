import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MESSAGE_TYPES } from "../../lib/constants.js";
import {
  createFocusCompanionPreview,
  listFocusCompanions
} from "../../lib/focus-companions/index.js";
import {
  createTranslator,
  detectSystemLanguage,
  type AppLanguage,
  type Translator
} from "../../lib/i18n/index.js";
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
import { DEFAULT_SITE_BLOCK_RULES, type SiteBlockRule } from "../../lib/site-block-rules.js";
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

const SETTINGS_TABS: Array<{ id: SettingsTab; labelKey: "popup.tabCompanion" | "popup.tabFocus" | "popup.tabBlocking"; icon: string }> = [
  { id: "companion", labelKey: "popup.tabCompanion", icon: "●" },
  { id: "focus", labelKey: "popup.tabFocus", icon: "◷" },
  { id: "blocking", labelKey: "popup.tabBlocking", icon: "◆" }
];

const FOCUS_PRESETS = [15, 25, 30, 45, 60, 90];
const LANGUAGE_OPTIONS: Array<{ language: AppLanguage; labelKey: "language.english" | "language.russian"; shortLabel: string }> = [
  { language: "en", labelKey: "language.english", shortLabel: "EN" },
  { language: "ru", labelKey: "language.russian", shortLabel: "RU" }
];

function clampFocusMinutes(value: number): number {
  return normalizeDefaultFocusMinutes(value);
}

function getDefaultFocusMinutes(bootstrap: BootstrapResponse | null): number {
  return clampFocusMinutes(bootstrap?.settings?.defaultFocusMinutes ?? DEFAULT_FOCUS_SESSION_MINUTES);
}

function getBootstrapLanguage(bootstrap: BootstrapResponse | null): AppLanguage {
  return bootstrap?.settings?.language || detectSystemLanguage();
}

function buildPreferencesDraft(bootstrap: BootstrapResponse | null): UserPreferences {
  return {
    selectedCompanionId: bootstrap?.settings?.selectedCompanionId || "ceo",
    defaultFocusMinutes: getDefaultFocusMinutes(bootstrap),
    blockedHosts: [...(bootstrap?.settings?.blockedHosts || [])],
    disabledDefaultBlockRuleIds: [...(bootstrap?.settings?.disabledDefaultBlockRuleIds || [])],
    language: getBootstrapLanguage(bootstrap)
  };
}

function formatRemainingTime(value: number | undefined): string {
  const totalSeconds = Math.max(0, Math.ceil(Number(value || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function LanguagePicker({
  language,
  disabled,
  saveState,
  t,
  onChange
}: {
  language: AppLanguage;
  disabled: boolean;
  saveState: "idle" | "saving";
  t: Translator;
  onChange: (language: AppLanguage) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentOption = LANGUAGE_OPTIONS.find((option) => option.language === language) || LANGUAGE_OPTIONS[0];

  return (
    <div className="language-picker">
      <button
        className="settings-icon-button language-picker-button"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled}
        aria-label={t("popup.openLanguageMenu")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {saveState === "saving" ? "..." : currentOption.shortLabel}
      </button>
      {isOpen ? (
        <div className="language-menu" role="menu" aria-label={t("popup.languageMenu")}>
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.language}
              className={option.language === language ? "language-menu-item is-active" : "language-menu-item"}
              type="button"
              role="menuitemradio"
              aria-checked={option.language === language}
              onClick={() => {
                setIsOpen(false);
                onChange(option.language);
              }}
            >
              <span>{option.shortLabel}</span>
              <span>{t(option.labelKey)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SettingsView({
  bootstrap,
  language,
  t,
  onBack,
  onSaved
}: {
  bootstrap: BootstrapResponse | null;
  language: AppLanguage;
  t: Translator;
  onBack: () => void;
  onSaved: (bootstrap: BootstrapResponse) => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("companion");
  const [draft, setDraft] = useState<UserPreferences>(() => buildPreferencesDraft(bootstrap));
  const [newBlockedHost, setNewBlockedHost] = useState("");
  const [blockedHostError, setBlockedHostError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SettingsSaveState>({ status: "idle" });
  const initializedFromBootstrapRef = useRef(false);
  const draftRef = useRef(draft);
  const pendingPreferencesRef = useRef<UserPreferences | null>(null);
  const isSavingPreferencesRef = useRef(false);
  const savedStatusTimerRef = useRef<number | null>(null);
  const blockRules = useMemo(() => {
    const disabledDefaultIds = new Set(draft.disabledDefaultBlockRuleIds);
    const userRules: SiteBlockRule[] = draft.blockedHosts.map((host) => ({
      id: `user:${host}`,
      pattern: host,
      patternType: "domain",
      category: "social",
      source: "user"
    }));
    return [...userRules, ...DEFAULT_SITE_BLOCK_RULES.filter((rule) => !disabledDefaultIds.has(rule.id))]
      .sort((left, right) => left.pattern.localeCompare(right.pattern));
  }, [draft.blockedHosts, draft.disabledDefaultBlockRuleIds]);
  const disabledDefaultRules = useMemo(() => {
    const disabledDefaultIds = new Set(draft.disabledDefaultBlockRuleIds);
    return DEFAULT_SITE_BLOCK_RULES
      .filter((rule) => disabledDefaultIds.has(rule.id))
      .sort((left, right) => left.pattern.localeCompare(right.pattern));
  }, [draft.disabledDefaultBlockRuleIds]);
  const companionPreviews = useMemo(() => listFocusCompanions().map((companion) => (
    createFocusCompanionPreview(companion.id, {
      language,
      resolveAssetUrl: (path) => chrome.runtime.getURL(path)
    })
  )), [language]);

  useEffect(() => {
    if (!bootstrap || initializedFromBootstrapRef.current) {
      return;
    }

    const bootstrapPreferences = buildPreferencesDraft(bootstrap);
    draftRef.current = bootstrapPreferences;
    setDraft(bootstrapPreferences);
    initializedFromBootstrapRef.current = true;
  }, [bootstrap]);

  useEffect(() => () => {
    if (savedStatusTimerRef.current !== null) {
      window.clearTimeout(savedStatusTimerRef.current);
    }
  }, []);

  function showSavedStatus() {
    if (savedStatusTimerRef.current !== null) {
      window.clearTimeout(savedStatusTimerRef.current);
    }

    setSaveState({ status: "saved" });
    savedStatusTimerRef.current = window.setTimeout(() => {
      setSaveState((current) => current.status === "saved" ? { status: "idle" } : current);
      savedStatusTimerRef.current = null;
    }, 1400);
  }

  async function flushPreferencesQueue() {
    if (isSavingPreferencesRef.current) {
      return;
    }

    isSavingPreferencesRef.current = true;
    setSaveState({ status: "saving" });

    try {
      while (pendingPreferencesRef.current) {
        const nextPreferences = pendingPreferencesRef.current;
        pendingPreferencesRef.current = null;

        const response = await sendBackgroundMessage({
          type: MESSAGE_TYPES.savePreferences,
          preferences: nextPreferences
        });

        if (!pendingPreferencesRef.current) {
          onSaved(response.bootstrap);
          draftRef.current = response.payload;
          setDraft(response.payload);
        }
      }

      showSavedStatus();
    } catch (error) {
      setSaveState({
        status: "error",
        message: getErrorMessage(error, t("popup.saveSettingsError"))
      });
    } finally {
      isSavingPreferencesRef.current = false;
    }
  }

  function applyPreferencesChange(updater: (current: UserPreferences) => UserPreferences) {
    if (!bootstrap) {
      setSaveState({
        status: "error",
        message: t("popup.saveSettingsError")
      });
      return;
    }

    const nextPreferences = updater(draftRef.current);
    draftRef.current = nextPreferences;
    pendingPreferencesRef.current = nextPreferences;
    setDraft(nextPreferences);
    void flushPreferencesQueue();
  }

  function handleAddBlockedHost() {
    const host = normalizePreferenceHost(newBlockedHost);
    if (!host) {
      setBlockedHostError(t("popup.blockedHostInvalid"));
      return;
    }

    if (draft.blockedHosts.includes(host) || DEFAULT_SITE_BLOCK_RULES.some((rule) => (
      !draft.disabledDefaultBlockRuleIds.includes(rule.id) && rule.pattern === host
    ))) {
      setBlockedHostError(t("popup.blockedHostDuplicate"));
      return;
    }

    applyPreferencesChange((current) => ({
      ...current,
      blockedHosts: [...current.blockedHosts, host].sort()
    }));
    setNewBlockedHost("");
    setBlockedHostError(null);
  }

  function handleRemoveBlockedHost(host: string) {
    applyPreferencesChange((current) => ({
      ...current,
      blockedHosts: current.blockedHosts.filter((blockedHost) => blockedHost !== host)
    }));
  }

  function handleDisableDefaultRule(ruleId: string) {
    applyPreferencesChange((current) => ({
      ...current,
      disabledDefaultBlockRuleIds: Array.from(new Set([...current.disabledDefaultBlockRuleIds, ruleId])).sort()
    }));
  }

  function handleRestoreDefaultRule(ruleId: string) {
    applyPreferencesChange((current) => ({
      ...current,
      disabledDefaultBlockRuleIds: current.disabledDefaultBlockRuleIds.filter((id) => id !== ruleId)
    }));
  }

  return (
    <main className="popup-shell popup-shell-settings" aria-label="Settings">
      <section className="settings-panel">
        <header className="settings-header">
          <button className="settings-icon-button" type="button" onClick={onBack} aria-label={t("popup.backToFocus")}>
            ←
          </button>
          <div>
            <p className="popup-kicker">Time Wise</p>
            <h1 className="settings-title">{t("popup.settingsTitle")}</h1>
          </div>
        </header>

        <nav className="settings-tabs" aria-label={t("popup.settingsSections")}>
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "settings-tab is-active" : "settings-tab"}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {activeTab === "companion" ? (
            <div className="settings-section">
              <p className="settings-copy">{t("popup.companionCopy")}</p>
              <div className="companion-grid">
                {companionPreviews.map((companion) => (
                  <button
                    key={companion.id}
                    className={draft.selectedCompanionId === companion.id
                      ? "companion-card is-selected"
                      : "companion-card"}
                    type="button"
                    onClick={() => {
                      applyPreferencesChange((current) => ({ ...current, selectedCompanionId: companion.id }));
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
                      <span className="companion-check" aria-label={t("popup.selected")}>✓</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "focus" ? (
            <div className="settings-section">
              <p className="settings-copy">{t("popup.focusDurationCopy")}</p>
              <div className="focus-duration-readout">
                <strong>{draft.defaultFocusMinutes}</strong>
                <span>{t("common.minutesShort")}</span>
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
                  applyPreferencesChange((current) => ({
                    ...current,
                    defaultFocusMinutes: nextDefaultFocusMinutes
                  }));
                }}
              />
              <div className="settings-range-labels">
                <span>{MIN_FOCUS_SESSION_MINUTES} {t("common.minutesShort")}</span>
                <span>{MAX_FOCUS_SESSION_MINUTES} {t("common.minutesShort")}</span>
              </div>
              <div className="focus-presets" aria-label={t("popup.quickTime")}>
                {FOCUS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    className={draft.defaultFocusMinutes === preset ? "focus-preset is-active" : "focus-preset"}
                    type="button"
                    onClick={() => {
                      applyPreferencesChange((current) => ({ ...current, defaultFocusMinutes: preset }));
                    }}
                  >
                    {preset} {t("common.minutesShort")}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "blocking" ? (
            <div className="settings-section">
              <p className="settings-copy">{t("popup.blockingCopy")}</p>
              <div className="blocked-host-form">
                <input
                  className="blocked-host-input"
                  type="text"
                  value={newBlockedHost}
                  placeholder={t("popup.blockedHostPlaceholder")}
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
                  aria-label={t("popup.addSite")}
                >
                  +
                </button>
              </div>
              {blockedHostError ? (
                <p className="popup-error-text" role="alert">{blockedHostError}</p>
              ) : null}
              <div className="blocked-host-list">
                {blockRules.length === 0 ? (
                  <p className="settings-empty">{t("popup.emptyList")}</p>
                ) : blockRules.map((rule) => (
                  <div className="blocked-host-row" key={rule.id}>
                    <span className="blocked-host-text">
                      <span>{rule.pattern}</span>
                      <span className="blocked-host-source">
                        {rule.source === "default" ? t("popup.defaultRule") : t("popup.userRule")}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (rule.source === "default") {
                          handleDisableDefaultRule(rule.id);
                        } else {
                          handleRemoveBlockedHost(rule.pattern);
                        }
                      }}
                      aria-label={t("popup.removeHost", { host: rule.pattern })}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {disabledDefaultRules.length > 0 ? (
                <div className="blocked-host-list" aria-label={t("popup.disabledDefaults")}>
                  {disabledDefaultRules.map((rule) => (
                    <div className="blocked-host-row is-disabled" key={rule.id}>
                      <span className="blocked-host-text">
                        <span>{rule.pattern}</span>
                        <span className="blocked-host-source">{t("popup.defaultRuleDisabled")}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRestoreDefaultRule(rule.id)}
                        aria-label={t("popup.restoreDefaultRule", { host: rule.pattern })}
                      >
                        ↻
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              {blockRules.length > 0 ? (
                <p className="settings-muted">{t("popup.blockedHostsCount", { count: blockRules.length })}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        {saveState.status !== "idle" ? (
          <footer className="settings-footer">
            {saveState.status === "error" ? (
              <p className="popup-error-text" role="alert">{saveState.message}</p>
            ) : null}
            {saveState.status === "saved" ? (
              <p className="popup-status-text" role="status">{t("popup.settingsSaved")}</p>
            ) : null}
            {saveState.status === "saving" ? (
              <p className="popup-status-text" role="status">{t("popup.savingSettings")}</p>
            ) : null}
          </footer>
        ) : null}
      </section>
    </main>
  );
}

function PopupApp() {
  const { bootstrap, applyBootstrap, refreshBootstrap } = usePopupBootstrap();
  const [view, setView] = useState<PopupView>("focus");
  const [actionState, setActionState] = useState<FocusActionState>({ status: "idle" });
  const [languageSaveState, setLanguageSaveState] = useState<"idle" | "saving">("idle");
  const [selectedMinutes, setSelectedMinutes] = useState(() => getDefaultFocusMinutes(null));
  const didInitializeMinutesRef = useRef(false);
  const language = getBootstrapLanguage(bootstrap);
  const t = useMemo(() => createTranslator(language), [language]);
  const activeSession = bootstrap?.popupModel?.focusSession?.status === "active"
    ? bootstrap.popupModel.focusSession
    : null;
  const isFocusActive = Boolean(activeSession);
  const isLoading = !bootstrap || actionState.status === "loading";
  const buttonLabel = isFocusActive ? t("popup.buttonStop") : t("popup.buttonStart");

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
        message: getErrorMessage(error, t("popup.focusChangeError"))
      });
    }
  }

  async function handleLanguageChange(nextLanguage: AppLanguage) {
    if (languageSaveState === "saving" || nextLanguage === language || !bootstrap) {
      return;
    }

    setLanguageSaveState("saving");
    setActionState({ status: "idle" });
    try {
      const response = await sendBackgroundMessage({
        type: MESSAGE_TYPES.savePreferences,
        preferences: {
          ...buildPreferencesDraft(bootstrap),
          language: nextLanguage
        }
      });
      applyBootstrap(response.bootstrap);
    } catch (error) {
      setActionState({
        status: "error",
        message: getErrorMessage(error, t("popup.languageSaveError"))
      });
    } finally {
      setLanguageSaveState("idle");
    }
  }

  if (view === "settings") {
    return (
      <SettingsView
        bootstrap={bootstrap}
        language={language}
        t={t}
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
          <div className="popup-header-actions">
            <LanguagePicker
              language={language}
              disabled={!bootstrap || languageSaveState === "saving"}
              saveState={languageSaveState}
              t={t}
              onChange={(nextLanguage) => void handleLanguageChange(nextLanguage)}
            />
            <button
              className="settings-icon-button"
              type="button"
              onClick={() => setView("settings")}
              aria-label={t("popup.openSettings")}
            >
              ⚙
            </button>
          </div>
        </header>
        <h1 className="popup-focus-title">
          {isFocusActive ? t("popup.focusActiveTitle") : t("popup.focusInactiveTitle")}
        </h1>
        <p className="popup-focus-copy">
          {isFocusActive
            ? t("popup.focusActiveCopy")
            : t("popup.focusInactiveCopy")}
        </p>

        {activeSession ? (
          <div className="popup-countdown" aria-live="polite">
            <span className="popup-countdown-label">{t("popup.countdownLabel")}</span>
            <strong className="popup-countdown-value">{formatRemainingTime(activeSession.remaining_ms)}</strong>
          </div>
        ) : (
          <label className="popup-timepicker">
            <span className="popup-timepicker-label">{t("popup.focusMinutesLabel")}</span>
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
          <p className="popup-status-text" role="status">{t("popup.loadingState")}</p>
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
