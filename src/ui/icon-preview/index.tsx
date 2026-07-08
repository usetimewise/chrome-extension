import { createRoot } from "react-dom/client";
import { AppIcon, appIcons, type AppIconName } from "../icons/index.js";

const ICON_LABELS: Record<AppIconName, string> = {
    add: "Add host",
    back: "Back",
    blocking: "Blocking tab",
    check: "Selected",
    close: "Close / remove",
    companion: "Companion tab",
    loading: "Loading",
    restore: "Restore default",
    settings: "Settings",
    site: "Site / domain",
};

const ICON_SIZES = [16, 20, 24, 32] as const;

function IconPreviewApp() {
    const iconNames = Object.keys(appIcons) as AppIconName[];

    return (
        <main className="icon-preview-shell">
            <header className="icon-preview-header">
                <p>ZalipOff</p>
                <h1>Icon Preview</h1>
            </header>

            <section
                className="icon-preview-grid"
                aria-label="Production icon set"
            >
                {iconNames.map((name) => (
                    <article className="icon-preview-card" key={name}>
                        <div className="icon-preview-samples">
                            {ICON_SIZES.map((size) => (
                                <span
                                    className="icon-preview-sample"
                                    key={size}
                                >
                                    <AppIcon
                                        name={name}
                                        size={size}
                                        className={
                                            name === "loading"
                                                ? "is-spinning"
                                                : undefined
                                        }
                                    />
                                </span>
                            ))}
                        </div>
                        <div>
                            <h2>{ICON_LABELS[name]}</h2>
                            <p>{name}</p>
                        </div>
                    </article>
                ))}
            </section>

            <section
                className="icon-preview-contexts"
                aria-label="Icon contexts"
            >
                <button
                    className="settings-icon-button"
                    type="button"
                    aria-label="Settings"
                >
                    <AppIcon name="settings" />
                </button>
                <button
                    className="blocked-host-add"
                    type="button"
                    aria-label="Add host"
                >
                    <AppIcon name="add" />
                </button>
                <button
                    className="blocked-host-action"
                    type="button"
                    aria-label="Remove host"
                >
                    <AppIcon name="close" size={16} />
                </button>
                <span className="companion-check" aria-label="Selected">
                    <AppIcon name="check" size={13} strokeWidth={2.4} />
                </span>
            </section>
        </main>
    );
}

export function mountIconPreviewApp(root: HTMLElement): void {
    createRoot(root).render(<IconPreviewApp />);
}
