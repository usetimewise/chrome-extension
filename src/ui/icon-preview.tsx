import "./icon-preview.css";
import { mountIconPreviewApp } from "./icon-preview/index.js";

const root = document.getElementById("iconPreviewRoot");

if (root) {
    mountIconPreviewApp(root);
}
