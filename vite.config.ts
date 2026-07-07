import react from "@vitejs/plugin-react";
import { build as buildWithEsbuild } from "esbuild";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const CONTENT_SCRIPT_INPUTS = {
    "focus-blocker": "src/content/focus-blocker/index.ts",
    "focus-nudge": "src/content/focus-nudge/index.ts",
} as const;

function copyExtensionStatic(): Plugin {
    return {
        name: "copy-extension-static",
        closeBundle() {
            const root = process.cwd();
            const outDir = resolve(root, "dist");
            mkdirSync(outDir, { recursive: true });
            cpSync(
                resolve(root, "manifest.json"),
                resolve(outDir, "manifest.json"),
            );
            if (existsSync(resolve(root, "icons"))) {
                cpSync(resolve(root, "icons"), resolve(outDir, "icons"), {
                    recursive: true,
                });
            }
            cpSync(resolve(root, "images"), resolve(outDir, "images"), {
                recursive: true,
            });
        },
    };
}

function bundleContentScripts(): Plugin {
    return {
        name: "bundle-content-scripts",
        async closeBundle() {
            const root = process.cwd();
            const outDir = resolve(root, "dist");
            await Promise.all(
                Object.entries(CONTENT_SCRIPT_INPUTS).map(([name, entry]) =>
                    buildWithEsbuild({
                        entryPoints: [resolve(root, entry)],
                        outfile: resolve(outDir, `assets/${name}.js`),
                        bundle: true,
                        format: "iife",
                        platform: "browser",
                        target: "chrome114",
                        sourcemap: true,
                        define: {
                            "import.meta.env.VITE_TIMEWISE_DEV_DEBUG":
                                JSON.stringify(
                                    process.env.VITE_TIMEWISE_DEV_DEBUG || "",
                                ),
                        },
                        legalComments: "none",
                    }),
                ),
            );
        },
    };
}

export default defineConfig(() => {
    const input = {
        iconPreview: resolve(__dirname, "icon-preview.html"),
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "src/background/index.ts"),
    };

    return {
        plugins: [react(), copyExtensionStatic(), bundleContentScripts()],
        build: {
            outDir: "dist",
            emptyOutDir: true,
            sourcemap: true,
            rollupOptions: {
                input,
                output: {
                    entryFileNames: "assets/[name].js",
                    chunkFileNames: "assets/[name].js",
                    assetFileNames: "assets/[name][extname]",
                },
            },
        },
    };
});
