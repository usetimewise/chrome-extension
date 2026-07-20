import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
    buildOverlay,
    type OverlayViewCallbacks,
} from "../../content/focus-nudge/overlay-view.js";
import { OVERLAY_ID } from "../../content/focus-nudge/constants.js";
import {
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

type ReplicaGroup = {
    companionId: FocusCompanionId;
    companionName: string;
    description: string;
    imagePath: string;
    rows: ReplicaRow[];
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

function buildReplicaGroups(
    companions: readonly FocusCompanion[],
): ReplicaGroup[] {
    return companions.map((companion) => {
        const scenarioEntries = Object.entries(companion.scenarios) as Array<
            [FocusCompanionScenarioId, readonly FocusCompanionReplica[]]
        >;

        return {
            companionId: companion.id,
            companionName: companion.name,
            description: companion.description,
            imagePath: companion.avatar.imagePath,
            rows: scenarioEntries.flatMap(([scenarioId, replicas]) =>
                replicas.map((replica, replicaIndex) => ({
                    key: `${companion.id}-${scenarioId}-${replicaIndex}`,
                    companionId: companion.id,
                    companionName: companion.name,
                    scenarioId,
                    replicaNumber: replicaIndex + 1,
                    replicaIndex,
                    imagePath:
                        "imagePath" in replica ? replica.imagePath : null,
                    theme: companion.theme,
                    texts: getFocusCompanionReplicaTexts(
                        companion.id,
                        scenarioId,
                        replicaIndex,
                    ),
                })),
            ),
        };
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
    const overlay = buildOverlay(
        {
            mode: "block",
            sessionId: DEBUG_SESSION_ID,
            message: row.texts[DEFAULT_LANGUAGE],
            host: DEBUG_HOST,
            category: "debug",
            presentation,
            scenarioId: row.scenarioId,
        },
        buildPreviewCallbacks(),
        {
            companionId: row.companionId,
            language: DEFAULT_LANGUAGE,
            replicaIndex: row.replicaIndex,
            resolveAssetUrl: resolveImagePath,
        },
    );

    document.documentElement.append(overlay.host);
}

function ReplicasApp() {
    const groups = buildReplicaGroups(listFocusCompanions());
    const rowsCount = groups.reduce(
        (total, group) => total + group.rows.length,
        0,
    );
    const [collapsedCompanionIds, setCollapsedCompanionIds] = useState<
        ReadonlySet<FocusCompanionId>
    >(() => new Set(groups.map((group) => group.companionId)));

    function handleGroupToggle(companionId: FocusCompanionId): void {
        setCollapsedCompanionIds((currentIds) => {
            const nextIds = new Set(currentIds);

            if (nextIds.has(companionId)) {
                nextIds.delete(companionId);
            } else {
                nextIds.add(companionId);
            }

            return nextIds;
        });
    }

    return (
        <main className="replicas-shell">
            <header className="replicas-header">
                <div>
                    <p>ZalipOff Debug</p>
                    <h1>Replicas</h1>
                </div>
                <strong>
                    {groups.length} characters · {rowsCount} rows
                </strong>
            </header>

            <div className="replicas-table-wrap">
                <table className="replicas-table">
                    <thead>
                        <tr>
                            <th scope="col">Image</th>
                            <th scope="col">Preview</th>
                            {SUPPORTED_LANGUAGES.map((language) => (
                                <th scope="col" key={language}>
                                    {language.toUpperCase()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    {groups.map((group) => {
                        const isCollapsed = collapsedCompanionIds.has(
                            group.companionId,
                        );

                        return (
                            <tbody key={group.companionId}>
                                <tr className="replicas-group-row">
                                    <th
                                        scope="rowgroup"
                                        colSpan={
                                            2 + SUPPORTED_LANGUAGES.length
                                        }
                                    >
                                        <button
                                            type="button"
                                            aria-expanded={!isCollapsed}
                                            onClick={() =>
                                                handleGroupToggle(
                                                    group.companionId,
                                                )
                                            }
                                        >
                                            <span
                                                className="replicas-group-chevron"
                                                aria-hidden="true"
                                            />
                                            <img
                                                className="replicas-group-image"
                                                src={resolveImagePath(
                                                    group.imagePath,
                                                )}
                                                alt=""
                                                loading="lazy"
                                            />
                                            <span className="replicas-group-title">
                                                {group.companionName}
                                                <small>
                                                    {group.companionId}
                                                </small>
                                            </span>
                                            <span className="replicas-group-description">
                                                {group.description}
                                            </span>
                                            <span className="replicas-group-count">
                                                {group.rows.length} replicas
                                            </span>
                                        </button>
                                    </th>
                                </tr>
                                {!isCollapsed &&
                                    group.rows.map((row) => (
                                        <tr key={row.key}>
                                            <td>
                                                {row.imagePath ? (
                                                    <img
                                                        src={resolveImagePath(
                                                            row.imagePath,
                                                        )}
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
                                                        {THEME_SWATCHES.map(
                                                            (swatch) => {
                                                                const color =
                                                                    row.theme[
                                                                        swatch.key
                                                                    ];

                                                                return (
                                                                    <span
                                                                        className="replicas-swatch"
                                                                        key={
                                                                            swatch.key
                                                                        }
                                                                        title={`${swatch.label}: ${color}`}
                                                                        aria-label={`${swatch.label}: ${color}`}
                                                                        style={{
                                                                            backgroundColor:
                                                                                color,
                                                                        }}
                                                                    />
                                                                );
                                                            },
                                                        )}
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
                                            {SUPPORTED_LANGUAGES.map(
                                                (language) => (
                                                    <td
                                                        key={language}
                                                        lang={language}
                                                        className={
                                                            language ===
                                                            DEFAULT_LANGUAGE
                                                                ? undefined
                                                                : "replicas-translated"
                                                        }
                                                    >
                                                        {row.texts[language]}
                                                    </td>
                                                ),
                                            )}
                                        </tr>
                                    ))}
                            </tbody>
                        );
                    })}
                </table>
            </div>
        </main>
    );
}

export function mountReplicasApp(root: HTMLElement): void {
    createRoot(root).render(<ReplicasApp />);
}
