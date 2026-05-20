import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AdminApp } from "./admin/AdminApp";

function isAdminRoute(): boolean {
  return window.location.hash === "#admin";
}

const root = createRoot(document.getElementById("root")!);

function render() {
  root.render(
    <StrictMode>
      {isAdminRoute() ? <AdminApp /> : <App />}
    </StrictMode>
  );
}

render();
window.addEventListener("hashchange", render);
