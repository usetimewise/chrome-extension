import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react";
import { createRoot } from "react-dom/client";
import { MESSAGE_TYPES } from "../../lib/constants.js";
import {
    createFocusCompanionAvatar,
    createFocusCompanionPreview,
    getFocusCompanionTheme,
    listFocusCompanions,
    type FocusCompanionTheme,
} from "../../lib/focus-companions/index.js";
import {
    createTranslator,
    detectSystemLanguage,
    type AppLanguage,
    type Translator,
} from "../../lib/i18n/index.js";
import { sendBackgroundMessage } from "../../lib/messaging/client.js";
import {
    normalizeDefaultFocusMinutes,
    normalizePreferenceHost,
} from "../../lib/storage/preferences.js";
import {
    DEFAULT_SITE_BLOCK_RULES,
    buildLocalBlockRules,
    isLocalSiteBlocked,
    type SiteBlockRule,
} from "../../lib/site-block-rules.js";
import type { BootstrapResponse, UserPreferences } from "../../lib/types.js";
import { getErrorMessage } from "../../lib/utils.js";
import { AppIcon } from "../icons/index.js";
import { usePopupBootstrap } from "./hooks/use-popup-bootstrap.js";

type FocusActionState =
    | { status: "idle" }
    | { status: "loading"; label: string }
    | { status: "error"; message: string };

type PopupView = "focus" | "settings" | "companion";
type PreferencesPage = Exclude<PopupView, "focus">;

type SettingsSaveState =
    | { status: "idle" }
    | { status: "saving" }
    | { status: "saved" }
    | { status: "error"; message: string };

type QuickBlockState =
    | { status: "idle" }
    | { status: "saving" }
    | { status: "saved" }
    | { status: "error"; message: string };

type CompanionThemeStyle = CSSProperties & {
    "--companion-primary": string;
    "--companion-primary-hover": string;
    "--companion-soft": string;
    "--companion-soft-hover": string;
    "--companion-accent-text": string;
    "--companion-contrast-text": string;
};

type CompanionAvatarStyle = CSSProperties & {
    "--avatar-backdrop-base": string;
    "--avatar-backdrop-deep": string;
    "--avatar-backdrop-highlight": string;
    "--avatar-image-scale": string;
    "--avatar-image-offset-x": string;
    "--avatar-image-offset-y": string;
};

const LANGUAGE_OPTIONS: Array<{
    language: AppLanguage;
    labelKey: "language.english" | "language.russian";
    shortLabel: string;
}> = [
    { language: "en", labelKey: "language.english", shortLabel: "EN" },
    { language: "ru", labelKey: "language.russian", shortLabel: "RU" },
];

function getDefaultFocusMinutes(bootstrap: BootstrapResponse | null): number {
    return normalizeDefaultFocusMinutes(
        bootstrap?.settings?.defaultFocusMinutes ?? 20,
    );
}

function getBootstrapLanguage(
    bootstrap: BootstrapResponse | null,
): AppLanguage {
    return bootstrap?.settings?.language || detectSystemLanguage();
}

function buildPreferencesDraft(
    bootstrap: BootstrapResponse | null,
): UserPreferences {
    return {
        selectedCompanionId: bootstrap?.settings?.selectedCompanionId || "ceo",
        defaultFocusMinutes: getDefaultFocusMinutes(bootstrap),
        blockedHosts: [...(bootstrap?.settings?.blockedHosts || [])],
        disabledDefaultBlockRuleIds: [
            ...(bootstrap?.settings?.disabledDefaultBlockRuleIds || []),
        ],
        language: getBootstrapLanguage(bootstrap),
    };
}

function createCompanionThemeStyle(
    theme: FocusCompanionTheme,
): CompanionThemeStyle {
    return {
        "--companion-primary": theme.primary,
        "--companion-primary-hover": theme.primaryHover,
        "--companion-soft": theme.soft,
        "--companion-soft-hover": theme.softHover,
        "--companion-accent-text": theme.accentText,
        "--companion-contrast-text": theme.contrastText,
    };
}

function createCompanionAvatarStyle(
    avatar: ReturnType<typeof createFocusCompanionAvatar>,
): CompanionAvatarStyle {
    return {
        "--avatar-backdrop-base": avatar.palette.backdropBase,
        "--avatar-backdrop-deep": avatar.palette.backdropDeep,
        "--avatar-backdrop-highlight": avatar.palette.backdropHighlight,
        "--avatar-image-scale": `${(avatar.crop.scale * 100).toString()}%`,
        "--avatar-image-offset-x": `${(avatar.crop.offsetX * 100).toString()}%`,
        "--avatar-image-offset-y": `${(avatar.crop.offsetY * 100).toString()}%`,
    };
}

function LanguagePicker({
    language,
    disabled,
    saveState,
    t,
    onChange,
}: {
    language: AppLanguage;
    disabled: boolean;
    saveState: "idle" | "saving";
    t: Translator;
    onChange: (language: AppLanguage) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const currentOption =
        LANGUAGE_OPTIONS.find((option) => option.language === language) ||
        LANGUAGE_OPTIONS[0];

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
                <div
                    className="language-menu"
                    role="menu"
                    aria-label={t("popup.languageMenu")}
                >
                    {LANGUAGE_OPTIONS.map((option) => (
                        <button
                            key={option.language}
                            className={
                                option.language === language
                                    ? "language-menu-item is-active"
                                    : "language-menu-item"
                            }
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

function PreferencesView({
    page,
    bootstrap,
    language,
    t,
    onBack,
    onCompanionSelected,
    onSaved,
}: {
    page: PreferencesPage;
    bootstrap: BootstrapResponse | null;
    language: AppLanguage;
    t: Translator;
    onBack: () => void;
    onCompanionSelected: () => void;
    onSaved: (bootstrap: BootstrapResponse) => void;
}) {
    const [draft, setDraft] = useState<UserPreferences>(() =>
        buildPreferencesDraft(bootstrap),
    );
    const [newBlockedHost, setNewBlockedHost] = useState("");
    const [blockedHostError, setBlockedHostError] = useState<string | null>(
        null,
    );
    const [saveState, setSaveState] = useState<SettingsSaveState>({
        status: "idle",
    });
    const initializedFromBootstrapRef = useRef(false);
    const draftRef = useRef(draft);
    const pendingPreferencesRef = useRef<UserPreferences | null>(null);
    const isSavingPreferencesRef = useRef(false);
    const shouldReturnAfterSaveRef = useRef(false);
    const selectedCompanionCardRef = useRef<HTMLButtonElement | null>(null);
    const savedStatusTimerRef = useRef<number | null>(null);
    const blockRules = useMemo(() => {
        return buildLocalBlockRules({
            blockedHosts: draft.blockedHosts,
            siteRules: bootstrap?.siteRules,
            disabledDefaultBlockRuleIds: draft.disabledDefaultBlockRuleIds,
        });
    }, [
        bootstrap?.siteRules,
        draft.blockedHosts,
        draft.disabledDefaultBlockRuleIds,
    ]);
    const disabledDefaultRules = useMemo(() => {
        const disabledDefaultIds = new Set(draft.disabledDefaultBlockRuleIds);
        return DEFAULT_SITE_BLOCK_RULES.filter((rule) =>
            disabledDefaultIds.has(rule.id),
        ).sort((left, right) => left.pattern.localeCompare(right.pattern));
    }, [draft.disabledDefaultBlockRuleIds]);
    const companionPreviews = useMemo(
        () =>
            listFocusCompanions().map((companion) =>
                createFocusCompanionPreview(companion.id, {
                    language,
                    resolveAssetUrl: (path) => chrome.runtime.getURL(path),
                }),
            ),
        [language],
    );
    const companionThemeStyle = useMemo(
        () =>
            createCompanionThemeStyle(
                getFocusCompanionTheme(draft.selectedCompanionId),
            ),
        [draft.selectedCompanionId],
    );

    useEffect(() => {
        if (!bootstrap || initializedFromBootstrapRef.current) {
            return;
        }

        const bootstrapPreferences = buildPreferencesDraft(bootstrap);
        draftRef.current = bootstrapPreferences;
        setDraft(bootstrapPreferences);
        initializedFromBootstrapRef.current = true;
    }, [bootstrap]);

    useEffect(() => {
        if (page !== "companion") {
            return;
        }

        selectedCompanionCardRef.current?.scrollIntoView({
            behavior: "auto",
            block: "center",
            inline: "nearest",
        });
    }, [page, draft.selectedCompanionId]);

    useEffect(
        () => () => {
            if (savedStatusTimerRef.current !== null) {
                window.clearTimeout(savedStatusTimerRef.current);
            }
        },
        [],
    );

    function showSavedStatus() {
        if (savedStatusTimerRef.current !== null) {
            window.clearTimeout(savedStatusTimerRef.current);
        }

        setSaveState({ status: "saved" });
        savedStatusTimerRef.current = window.setTimeout(() => {
            setSaveState((current) =>
                current.status === "saved" ? { status: "idle" } : current,
            );
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
                    preferences: nextPreferences,
                });

                if (!pendingPreferencesRef.current) {
                    onSaved(response.bootstrap);
                    draftRef.current = response.payload;
                    setDraft(response.payload);
                }
            }

            if (shouldReturnAfterSaveRef.current) {
                shouldReturnAfterSaveRef.current = false;
                onCompanionSelected();
            } else {
                showSavedStatus();
            }
        } catch (error) {
            shouldReturnAfterSaveRef.current = false;
            setSaveState({
                status: "error",
                message: getErrorMessage(error, t("popup.saveSettingsError")),
            });
        } finally {
            isSavingPreferencesRef.current = false;
        }
    }

    function applyPreferencesChange(
        updater: (current: UserPreferences) => UserPreferences,
    ): boolean {
        if (!bootstrap) {
            setSaveState({
                status: "error",
                message: t("popup.saveSettingsError"),
            });
            return false;
        }

        const nextPreferences = updater(draftRef.current);
        draftRef.current = nextPreferences;
        pendingPreferencesRef.current = nextPreferences;
        setDraft(nextPreferences);
        void flushPreferencesQueue();
        return true;
    }

    function handleAddBlockedHost() {
        const host = normalizePreferenceHost(newBlockedHost);
        if (!host) {
            setBlockedHostError(t("popup.blockedHostInvalid"));
            return;
        }

        if (
            isLocalSiteBlocked(`https://${host}`, {
                blockedHosts: draft.blockedHosts,
                siteRules: bootstrap?.siteRules,
                disabledDefaultBlockRuleIds: draft.disabledDefaultBlockRuleIds,
            })
        ) {
            setBlockedHostError(t("popup.blockedHostDuplicate"));
            return;
        }

        applyPreferencesChange((current) => ({
            ...current,
            blockedHosts: [...current.blockedHosts, host].sort(),
        }));
        setNewBlockedHost("");
        setBlockedHostError(null);
    }

    function handleRemoveBlockedHost(host: string) {
        applyPreferencesChange((current) => ({
            ...current,
            blockedHosts: current.blockedHosts.filter(
                (blockedHost) => blockedHost !== host,
            ),
        }));
    }

    async function handleRemoveSiteRule(host: string) {
        setSaveState({ status: "saving" });

        try {
            const response = await sendBackgroundMessage({
                type: MESSAGE_TYPES.saveSiteRule,
                host,
                category: "social",
                excluded: true,
            });
            onSaved(response.bootstrap);
            showSavedStatus();
        } catch (error) {
            setSaveState({
                status: "error",
                message: getErrorMessage(error, t("popup.saveSettingsError")),
            });
        }
    }

    function handleRemoveBlockRule(rule: SiteBlockRule) {
        if (draft.blockedHosts.includes(rule.pattern)) {
            handleRemoveBlockedHost(rule.pattern);
            return;
        }

        void handleRemoveSiteRule(rule.pattern);
    }

    function handleDisableDefaultRule(ruleId: string) {
        applyPreferencesChange((current) => ({
            ...current,
            disabledDefaultBlockRuleIds: Array.from(
                new Set([...current.disabledDefaultBlockRuleIds, ruleId]),
            ).sort(),
        }));
    }

    function handleRestoreDefaultRule(ruleId: string) {
        applyPreferencesChange((current) => ({
            ...current,
            disabledDefaultBlockRuleIds:
                current.disabledDefaultBlockRuleIds.filter(
                    (id) => id !== ruleId,
                ),
        }));
    }

    return (
        <main
            className="popup-shell popup-shell-settings"
            aria-label={
                page === "companion"
                    ? t("popup.tabCompanion")
                    : t("popup.settingsTitle")
            }
            style={companionThemeStyle}
        >
            <section className="settings-panel">
                <header className="settings-header">
                    <button
                        className="settings-icon-button"
                        type="button"
                        onClick={onBack}
                        aria-label={t("popup.backToFocus")}
                    >
                        <AppIcon name="back" />
                    </button>
                    <div>
                        <img
                            className="popup-brand-logo"
                            src="/logo.svg"
                            alt="ZalipOff"
                        />
                        <h1 className="settings-title">
                            {page === "companion"
                                ? t("popup.tabCompanion")
                                : t("popup.settingsTitle")}
                        </h1>
                    </div>
                </header>

                <div className="settings-content">
                    {page === "companion" ? (
                        <div className="settings-section">
                            <p className="settings-copy">
                                {t("popup.companionCopy")}
                            </p>
                            <div className="companion-grid">
                                {companionPreviews.map((companion) => (
                                    <button
                                        key={companion.id}
                                        ref={
                                            draft.selectedCompanionId ===
                                            companion.id
                                                ? selectedCompanionCardRef
                                                : undefined
                                        }
                                        className={
                                            draft.selectedCompanionId ===
                                            companion.id
                                                ? "companion-card is-selected"
                                                : "companion-card"
                                        }
                                        type="button"
                                        onClick={() => {
                                            const isSelectionQueued =
                                                applyPreferencesChange(
                                                    (current) => ({
                                                        ...current,
                                                        selectedCompanionId:
                                                            companion.id,
                                                    }),
                                            );
                                            if (isSelectionQueued) {
                                                shouldReturnAfterSaveRef.current =
                                                    true;
                                            }
                                        }}
                                    >
                                        <span
                                            className={
                                                companion.visual.kind ===
                                                "avatar"
                                                    ? `companion-avatar companion-avatar-${companion.visual.colorClass}`
                                                    : "companion-avatar"
                                            }
                                        >
                                            {companion.visual.kind ===
                                            "image" ? (
                                                <img
                                                    src={companion.visual.src}
                                                    alt=""
                                                />
                                            ) : (
                                                companion.visual.text
                                            )}
                                        </span>
                                        <span className="companion-name">
                                            {companion.name}
                                        </span>
                                        <span className="companion-description">
                                            {companion.description}
                                        </span>
                                        {draft.selectedCompanionId ===
                                        companion.id ? (
                                            <span
                                                className="companion-check"
                                                aria-label={t("popup.selected")}
                                            >
                                                <AppIcon
                                                    name="check"
                                                    size={13}
                                                    strokeWidth={2.4}
                                                />
                                            </span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {page === "settings" ? (
                        <div className="settings-section">
                            <p className="settings-copy">
                                {t("popup.blockingCopy")}
                            </p>
                            <div className="blocked-host-form">
                                <input
                                    className="blocked-host-input"
                                    type="text"
                                    value={newBlockedHost}
                                    placeholder={t(
                                        "popup.blockedHostPlaceholder",
                                    )}
                                    onChange={(event) => {
                                        setNewBlockedHost(
                                            event.currentTarget.value,
                                        );
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
                                    <AppIcon name="add" />
                                </button>
                            </div>
                            {blockedHostError ? (
                                <p className="popup-error-text" role="alert">
                                    {blockedHostError}
                                </p>
                            ) : null}
                            <div className="blocked-host-list">
                                {blockRules.length === 0 ? (
                                    <p className="settings-empty">
                                        {t("popup.emptyList")}
                                    </p>
                                ) : (
                                    blockRules.map((rule) => (
                                        <div
                                            className="blocked-host-row"
                                            key={rule.id}
                                        >
                                            <span className="blocked-host-text">
                                                <span>{rule.pattern}</span>
                                                <span className="blocked-host-source">
                                                    {rule.source === "default"
                                                        ? t("popup.defaultRule")
                                                        : t("popup.userRule")}
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (
                                                        rule.source ===
                                                        "default"
                                                    ) {
                                                        handleDisableDefaultRule(
                                                            rule.id,
                                                        );
                                                    } else {
                                                        handleRemoveBlockRule(
                                                            rule,
                                                        );
                                                    }
                                                }}
                                                aria-label={t(
                                                    "popup.removeHost",
                                                    { host: rule.pattern },
                                                )}
                                            >
                                                <AppIcon
                                                    name="close"
                                                    size={16}
                                                />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            {disabledDefaultRules.length > 0 ? (
                                <div
                                    className="blocked-host-list"
                                    aria-label={t("popup.disabledDefaults")}
                                >
                                    {disabledDefaultRules.map((rule) => (
                                        <div
                                            className="blocked-host-row is-disabled"
                                            key={rule.id}
                                        >
                                            <span className="blocked-host-text">
                                                <span>{rule.pattern}</span>
                                                <span className="blocked-host-source">
                                                    {t(
                                                        "popup.defaultRuleDisabled",
                                                    )}
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRestoreDefaultRule(
                                                        rule.id,
                                                    )
                                                }
                                                aria-label={t(
                                                    "popup.restoreDefaultRule",
                                                    { host: rule.pattern },
                                                )}
                                            >
                                                <AppIcon
                                                    name="restore"
                                                    size={16}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                            {blockRules.length > 0 ? (
                                <p className="settings-muted">
                                    {t("popup.blockedHostsCount", {
                                        count: blockRules.length,
                                    })}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                {saveState.status !== "idle" ? (
                    <footer className="settings-footer">
                        {saveState.status === "error" ? (
                            <p className="popup-error-text" role="alert">
                                {saveState.message}
                            </p>
                        ) : null}
                        {saveState.status === "saved" ? (
                            <p className="popup-status-text" role="status">
                                {t("popup.settingsSaved")}
                            </p>
                        ) : null}
                        {saveState.status === "saving" ? (
                            <p className="popup-status-text" role="status">
                                {t("popup.savingSettings")}
                            </p>
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
    const [actionState, setActionState] = useState<FocusActionState>({
        status: "idle",
    });
    const [quickBlockState, setQuickBlockState] = useState<QuickBlockState>({
        status: "idle",
    });
    const [languageSaveState, setLanguageSaveState] = useState<
        "idle" | "saving"
    >("idle");
    const quickBlockStatusTimerRef = useRef<number | null>(null);
    const language = getBootstrapLanguage(bootstrap);
    const t = useMemo(() => createTranslator(language), [language]);
    const activeSession =
        bootstrap?.popupModel?.focusSession?.status === "active"
            ? bootstrap.popupModel.focusSession
            : null;
    const isFocusActive = Boolean(activeSession);
    const isLoading = !bootstrap || actionState.status === "loading";
    const buttonLabel = isFocusActive
        ? t("popup.buttonStop")
        : t("popup.buttonStart");
    const currentUrl = bootstrap?.runtimeState?.currentUrl || null;
    const currentHost =
        currentUrl && /^https?:\/\//.test(currentUrl)
            ? bootstrap?.runtimeState?.currentHost || null
            : null;
    const currentSiteUrl = currentHost ? currentUrl : null;
    const isCurrentSiteBlocked = Boolean(
        currentSiteUrl &&
        isLocalSiteBlocked(currentSiteUrl, {
            blockedHosts: bootstrap?.settings?.blockedHosts,
            siteRules: bootstrap?.siteRules,
            disabledDefaultBlockRuleIds:
                bootstrap?.settings?.disabledDefaultBlockRuleIds,
        }),
    );
    const isQuickBlockDisabled =
        !currentHost ||
        isCurrentSiteBlocked ||
        quickBlockState.status === "saving";
    const companionThemeStyle = useMemo(
        () =>
            createCompanionThemeStyle(
                getFocusCompanionTheme(bootstrap?.settings?.selectedCompanionId),
            ),
        [bootstrap?.settings?.selectedCompanionId],
    );
    const companionAvatar = useMemo(
        () =>
            createFocusCompanionAvatar(
                bootstrap?.settings?.selectedCompanionId,
                {
                    language,
                    resolveAssetUrl: (path) => chrome.runtime.getURL(path),
                },
            ),
        [bootstrap?.settings?.selectedCompanionId, language],
    );
    const companionAvatarStyle = useMemo(
        () => createCompanionAvatarStyle(companionAvatar),
        [companionAvatar],
    );

    useEffect(
        () => () => {
            if (quickBlockStatusTimerRef.current !== null) {
                window.clearTimeout(quickBlockStatusTimerRef.current);
            }
        },
        [],
    );

    useEffect(() => {
        setQuickBlockState((current) =>
            current.status === "saving" ? current : { status: "idle" },
        );
    }, [currentHost]);

    async function handleToggleFocus() {
        if (actionState.status === "loading") {
            return;
        }

        setActionState({ status: "loading", label: buttonLabel });
        try {
            if (activeSession) {
                await sendBackgroundMessage({
                    type: MESSAGE_TYPES.endFocusSession,
                    sessionId: activeSession.id,
                });
            } else {
                await sendBackgroundMessage({
                    type: MESSAGE_TYPES.startFocusSession,
                });
            }
            await refreshBootstrap();
            setActionState({ status: "idle" });
        } catch (error) {
            setActionState({
                status: "error",
                message: getErrorMessage(error, t("popup.focusChangeError")),
            });
        }
    }

    async function handleLanguageChange(nextLanguage: AppLanguage) {
        if (
            languageSaveState === "saving" ||
            nextLanguage === language ||
            !bootstrap
        ) {
            return;
        }

        setLanguageSaveState("saving");
        setActionState({ status: "idle" });
        try {
            const response = await sendBackgroundMessage({
                type: MESSAGE_TYPES.savePreferences,
                preferences: {
                    ...buildPreferencesDraft(bootstrap),
                    language: nextLanguage,
                },
            });
            applyBootstrap(response.bootstrap);
        } catch (error) {
            setActionState({
                status: "error",
                message: getErrorMessage(error, t("popup.languageSaveError")),
            });
        } finally {
            setLanguageSaveState("idle");
        }
    }

    function showQuickBlockSavedStatus() {
        if (quickBlockStatusTimerRef.current !== null) {
            window.clearTimeout(quickBlockStatusTimerRef.current);
        }

        setQuickBlockState({ status: "saved" });
        quickBlockStatusTimerRef.current = window.setTimeout(() => {
            setQuickBlockState((current) =>
                current.status === "saved" ? { status: "idle" } : current,
            );
            quickBlockStatusTimerRef.current = null;
        }, 1600);
    }

    async function handleQuickBlockSite() {
        if (!currentHost || isQuickBlockDisabled) {
            return;
        }

        setQuickBlockState({ status: "saving" });
        setActionState({ status: "idle" });

        try {
            const response = await sendBackgroundMessage({
                type: MESSAGE_TYPES.saveSiteRule,
                host: currentHost,
                category: "social",
                excluded: false,
            });
            applyBootstrap(response.bootstrap);
            showQuickBlockSavedStatus();
        } catch (error) {
            setQuickBlockState({
                status: "error",
                message: getErrorMessage(error, t("popup.quickBlockError")),
            });
        }
    }

    if (view !== "focus") {
        return (
            <PreferencesView
                page={view}
                bootstrap={bootstrap}
                language={language}
                t={t}
                onBack={() => setView("focus")}
                onCompanionSelected={() => setView("focus")}
                onSaved={(nextBootstrap) => {
                    applyBootstrap(nextBootstrap);
                }}
            />
        );
    }

    return (
        <main
            className="popup-shell"
            aria-label="Focus mode"
            style={companionThemeStyle}
        >
            <section className="popup-focus-panel" aria-busy={isLoading}>
                <header className="popup-focus-header">
                    <img
                        className="popup-brand-logo"
                        src="/logo.svg"
                        alt="ZalipOff"
                    />
                    <div className="popup-header-actions">
                        <LanguagePicker
                            language={language}
                            disabled={
                                !bootstrap || languageSaveState === "saving"
                            }
                            saveState={languageSaveState}
                            t={t}
                            onChange={(nextLanguage) =>
                                void handleLanguageChange(nextLanguage)
                            }
                        />
                        <button
                            className="settings-icon-button"
                            type="button"
                            onClick={() => setView("settings")}
                            aria-label={t("popup.openSettings")}
                        >
                            <AppIcon name="settings" />
                        </button>
                        <button
                            className="companion-avatar-button"
                            type="button"
                            onClick={() => setView("companion")}
                            aria-label={t("popup.openCompanionPicker", {
                                name: companionAvatar.alt,
                            })}
                            style={companionAvatarStyle}
                        >
                            <img src={companionAvatar.src} alt="" />
                        </button>
                    </div>
                </header>
                <h1 className="popup-focus-title">
                    {isFocusActive
                        ? t("popup.focusActiveTitle")
                        : t("popup.focusInactiveTitle")}
                </h1>
                <p className="popup-focus-copy">
                    {isFocusActive
                        ? t("popup.focusActiveCopy")
                        : t("popup.focusInactiveCopy")}
                </p>

                <button
                    className={
                        isFocusActive
                            ? "popup-primary-button is-danger"
                            : "popup-primary-button"
                    }
                    type="button"
                    onClick={() => void handleToggleFocus()}
                    disabled={isLoading}
                >
                    {actionState.status === "loading"
                        ? actionState.label
                        : buttonLabel}
                </button>

                {currentHost ? (
                    <div className="quick-block-row">
                        <span className="quick-block-host" title={currentHost}>
                            {currentHost}
                        </span>
                        <div className="quick-block-action">
                            <button
                                className="quick-block-button"
                                type="button"
                                onClick={() => void handleQuickBlockSite()}
                                disabled={isQuickBlockDisabled}
                            >
                                {quickBlockState.status === "saving"
                                    ? t("popup.quickBlockSaving")
                                    : isCurrentSiteBlocked
                                      ? t("popup.quickBlockAlreadyBlocked")
                                      : t("popup.quickBlockButton")}
                            </button>
                            {isCurrentSiteBlocked ? (
                                <p className="quick-block-hint">
                                    {t("popup.quickBlockAlreadyBlockedHint")}
                                </p>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {!bootstrap ? (
                    <p className="popup-status-text" role="status">
                        {t("popup.loadingState")}
                    </p>
                ) : null}

                {quickBlockState.status === "saved" ? (
                    <p className="popup-status-text" role="status">
                        {t("popup.quickBlockSaved")}
                    </p>
                ) : null}

                {quickBlockState.status === "error" ? (
                    <p className="popup-error-text" role="alert">
                        {quickBlockState.message}
                    </p>
                ) : null}

                {actionState.status === "error" ? (
                    <p className="popup-error-text" role="alert">
                        {actionState.message}
                    </p>
                ) : null}
            </section>
        </main>
    );
}

export function mountPopupApp(root: HTMLElement): void {
    createRoot(root).render(<PopupApp />);
}
