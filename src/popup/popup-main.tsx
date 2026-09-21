import React from "react";
import ReactDOM from "react-dom/client";
import { Popup } from "./Popup";
import "../styles/globals.css";

// Visible error overlay: if anything fails at load/render time, show the
// message inside the popup instead of a blank/mystery square.
function showFatalError(message: string) {
  try {
    const el = document.createElement("div");
    el.style.cssText =
      "padding:16px;font:13px/1.5 system-ui,sans-serif;color:#f2f2f5;background:#111;word-break:break-word;";
    el.textContent = `Ombre AI popup failed to load: ${message}`;
    document.getElementById("root")?.replaceChildren(el);
  } catch {
    // last resort — nothing more we can do
  }
}

window.addEventListener("error", (event) => {
  showFatalError(event.message || "unknown error");
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason as unknown;
  showFatalError(reason instanceof Error ? reason.message : String(reason));
});

try {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
} catch (err) {
  showFatalError(err instanceof Error ? err.message : String(err));
}
