import "./common.css";
import "./shared.css";
import "./popup.css";
import { mountPopupApp } from "./popup/index.js";

const root = document.getElementById("popupRoot");
if (root) {
  mountPopupApp(root);
}
