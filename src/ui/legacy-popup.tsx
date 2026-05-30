import "./common.css";
import "./shared.css";
import "./legacy-popup.css";
import { mountPopupApp } from "./legacy-popup/index.js";

const root = document.getElementById("legacyPopupRoot");
if (root) {
  mountPopupApp(root);
}
