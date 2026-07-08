import { createRoot } from "react-dom/client";

import {
    listFocusCompanions,
    type FocusCompanion,
    type FocusCompanionId,
    type FocusCompanionReplica,
    type FocusCompanionScenarioId,
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
    imagePath: string | null;
    texts: Record<AppLanguage, string>;
};

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
                imagePath: "imagePath" in replica ? replica.imagePath : null,
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
