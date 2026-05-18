import "./common.css";
import "./debug.css";
import { mountDebugApp } from "./debug/index.js";

const root = document.getElementById("debugRoot");
if (root) {
  mountDebugApp(root);
}
