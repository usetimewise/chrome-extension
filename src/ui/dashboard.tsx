import "./common.css";
import "./dashboard.css";
import { mountDashboardApp } from "./dashboard/index.js";

const root = document.getElementById("dashboardRoot");
if (root) {
  mountDashboardApp(root);
}
