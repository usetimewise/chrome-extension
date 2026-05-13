import react from "@vitejs/plugin-react";
import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

function copyExtensionStatic(): Plugin {
  return {
    name: "copy-extension-static",
    closeBundle() {
      const root = process.cwd();
      const outDir = resolve(root, "dist");
      mkdirSync(outDir, { recursive: true });
      cpSync(resolve(root, "manifest.json"), resolve(outDir, "manifest.json"));
      cpSync(resolve(root, "icons"), resolve(outDir, "icons"), { recursive: true });
      cpSync(resolve(root, "vendor"), resolve(outDir, "vendor"), { recursive: true });
    }
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionStatic()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        "media-monitor": resolve(__dirname, "src/content/media-monitor.ts"),
        "focus-nudge": resolve(__dirname, "src/content/focus-nudge.ts")
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});
