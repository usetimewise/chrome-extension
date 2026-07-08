import "./replicas.css";
import { mountReplicasApp } from "./replicas/index.js";

const root = document.getElementById("replicasRoot");

if (root) {
    mountReplicasApp(root);
}
