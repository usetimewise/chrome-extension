import { createRoot } from "react-dom/client";

import {
    buildOverlayFromVariant,
    type OverlayViewCallbacks,
} from "../../content/focus-nudge/overlay-view.js";
import { OVERLAY_ID } from "../../content/focus-nudge/constants.js";
import {
    createFocusCompanionOverlayVariant,
    listFocusCompanions,
    type FocusCompanion,
    type FocusCompanionId,
    type FocusCompanionReplica,
    type FocusCompanionScenarioId,
    type FocusCompanionTheme,
} from "../../lib/focus-companions/index.js";
import {
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    type AppLanguage,
} from "../../lib/i18n/index.js";
import { getFocusCompanionReplicaTexts } from "../../lib/i18n/focus-companions.js";

type ReplicaRow = {
    key: string;
    companionId: FocusCompanionId;
    companionName: string;
    scenarioId: FocusCompanionScenarioId;
    replicaNumber: number;
    replicaIndex: number;
    imagePath: string | null;
    theme: FocusCompanionTheme;
    texts: Record<AppLanguage, string>;
};

const DEBUG_HOST = "debug.zalipoff.local";
const DEBUG_SESSION_ID = "replicas-debug-session";
type ThemeSwatchKey = keyof Pick<
    FocusCompanionTheme,
    | "primary"
    | "primaryHover"
    | "soft"
    | "softHover"
    | "accentText"
    | "contrastText"
>;

const THEME_SWATCHES: readonly {
    key: ThemeSwatchKey;
    label: string;
}[] = [
    { key: "primary", label: "Primary" },
    { key: "primaryHover", label: "Primary hover" },
    { key: "soft", label: "Soft" },
    { key: "softHover", label: "Soft hover" },
    { key: "accentText", label: "Accent text" },
    { key: "contrastText", label: "Contrast text" },
];

function buildReplicaRows(companions: readonly FocusCompanion[]): ReplicaRow[] {
    return companions.flatMap((companion) => {
        const scenarioEntries = Object.entries(companion.scenarios) as Array<
            [FocusCompanionScenarioId, readonly FocusCompanionReplica[]]
        >;

        return scenarioEntries.flatMap(([scenarioId, replicas]) =>
            replicas.map((replica, replicaIndex) => ({
                key: `${companion.id}-${scenarioId}-${replicaIndex}`,
                companionId: companion.id,
                companionName: companion.name,
                scenarioId,
                replicaNumber: replicaIndex + 1,
                replicaIndex,
                imagePath: "imagePath" in replica ? replica.imagePath : null,
                theme: companion.theme,
                texts: getFocusCompanionReplicaTexts(
                    companion.id,
                    scenarioId,
                    replicaIndex,
                ),
            })),
        );
    });
}

function resolveImagePath(path: string): string {
    return `${import.meta.env.BASE_URL}${path}`;
}

function removePreviewOverlay(): void {
    document.getElementById(OVERLAY_ID)?.remove();
}

function buildPreviewCallbacks(): OverlayViewCallbacks {
    return {
        closeCurrentTab: removePreviewOverlay,
        closeSoftBlock: removePreviewOverlay,
        dismissFocusOffer: removePreviewOverlay,
        endCurrentFocusSession: removePreviewOverlay,
        startFocusFromOffer: removePreviewOverlay,
    };
}

function showReplicaPreview(
    row: ReplicaRow,
    presentation: "soft" | "strict",
): void {
    removePreviewOverlay();
    const copyVariant = createFocusCompanionOverlayVariant(row.companionId, {
        language: DEFAULT_LANGUAGE,
        scenarioId: row.scenarioId,
        replicaIndex: row.replicaIndex,
        resolveAssetUrl: resolveImagePath,
    });
    const overlay = buildOverlayFromVariant(
        {
            mode: "block",
            sessionId: DEBUG_SESSION_ID,
            message: row.texts[DEFAULT_LANGUAGE],
            host: DEBUG_HOST,
            category: "debug",
            presentation,
            scenarioId: row.scenarioId,
        },
        copyVariant,
        DEFAULT_LANGUAGE,
        buildPreviewCallbacks(),
    );

    document.documentElement.append(overlay.host);
}

function ReplicasApp() {
    const rows = buildReplicaRows(listFocusCompanions());

    return (
        <main className="replicas-shell">
            <header className="replicas-header">
                <div>
                    <p>ZalipOff Debug</p>
                    <h1>Replicas</h1>
                </div>
                <strong>{rows.length} rows</strong>
            </header>

            <div className="replicas-table-wrap">
                <table className="replicas-table">
                    <thead>
                        <tr>
                            <th scope="col">Character</th>
                            <th scope="col">Scenario</th>
                            <th scope="col">Index</th>
                            <th scope="col">Image</th>
                            <th scope="col">Preview</th>
                            {SUPPORTED_LANGUAGES.map((language) => (
                                <th scope="col" key={language}>
                                    {language.toUpperCase()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.key}>
                                <th scope="row">
                                    <span>{row.companionName}</span>
                                    <small>{row.companionId}</small>
                                </th>
                                <td>{row.scenarioId}</td>
                                <td>{row.replicaNumber}</td>
                                <td>
                                    {row.imagePath ? (
                                        <img
                                            src={resolveImagePath(row.imagePath)}
                                            alt={`${row.companionName}, scenario ${row.scenarioId}, replica ${row.replicaNumber}`}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <span className="replicas-empty">
                                            No image
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <div className="replicas-preview-cell">
                                        <div
                                            className="replicas-swatches"
                                            aria-label={`${row.companionName} theme colors`}
                                        >
                                            {THEME_SWATCHES.map((swatch) => {
                                                const color =
                                                    row.theme[swatch.key];

                                                return (
                                                    <span
                                                        className="replicas-swatch"
                                                        key={swatch.key}
                                                        title={`${swatch.label}: ${color}`}
                                                        aria-label={`${swatch.label}: ${color}`}
                                                        style={{
                                                            backgroundColor:
                                                                color,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <div className="replicas-preview-actions">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    showReplicaPreview(
                                                        row,
                                                        "soft",
                                                    )
                                                }
                                            >
                                                Soft
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    showReplicaPreview(
                                                        row,
                                                        "strict",
                                                    )
                                                }
                                            >
                                                Hard
                                            </button>
                                        </div>
                                    </div>
                                </td>
                                {SUPPORTED_LANGUAGES.map((language) => (
                                    <td
                                        key={language}
                                        lang={language}
                                        className={
                                            language === DEFAULT_LANGUAGE
                                                ? undefined
                                                : "replicas-translated"
                                        }
                                    >
                                        {row.texts[language]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}

export function mountReplicasApp(root: HTMLElement): void {
    createRoot(root).render(<ReplicasApp />);
}
