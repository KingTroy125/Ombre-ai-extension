// Content-script entry point. Feature modules own their UI and event handlers.
import "./extension-context";
import "./dom-utils";
import { initSelectionPopup } from "./selection-popup";
import { initQuickTool } from "./quick-tool";
import { initSidePanelLauncher } from "./sidepanel-launcher";

function initializeContentFeatures() {
  initSelectionPopup();
  initSidePanelLauncher();
  initQuickTool();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeContentFeatures, { once: true });
} else {
  initializeContentFeatures();
}
