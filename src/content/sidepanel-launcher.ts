import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { LauncherDock } from "./LauncherDock";
import tailwindCss from "../styles/globals.css?inline";
import { onContextLost, safeSendMessage } from "./extension-context";

const SIDEPANEL_LAUNCHER_HOST_ID = "ombre-ai-sidepanel-launcher-host";

export function initSidePanelLauncher() {
  if (window.self !== window.top) return;
  if (document.getElementById(SIDEPANEL_LAUNCHER_HOST_ID)) return;

  const host = document.createElement("div");
  host.id = SIDEPANEL_LAUNCHER_HOST_ID;
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .launcher {
      position: fixed;
      top: 50%;
      right: 10px;
      transform: translateY(-50%) translateX(calc(100% + 18px));
      z-index: 2147483646;
      opacity: 0;
      pointer-events: none;
      transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: none;
      user-select: none;
      cursor: grab;
    }
    .launcher > div {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .launcher.visible {
      transform: translateY(-50%) translateX(0);
      opacity: 1;
      pointer-events: auto;
    }
    .launcher.dragging { cursor: grabbing; transition: opacity 0.2s ease; }
  `;

  // Tailwind utilities for the React dock — the shadow root gets none of the
  // document styles, and .dark carries the theme variables.
  const tailwind = document.createElement("style");
  tailwind.textContent = tailwindCss;

  const pill = document.createElement("div");
  pill.className = "launcher dark";
  try {
    const savedTop = Number(localStorage.getItem("ombre-launcher-top"));
    if (Number.isFinite(savedTop) && savedTop > 0) {
      pill.style.top = `${Math.max(56, Math.min(window.innerHeight - 56, savedTop))}px`;
    }
  } catch { /* Storage may be disabled for this page. */ }
  const mount = document.createElement("div");
  pill.appendChild(mount);
  root.append(style, tailwind, pill);

  const runDockAction = (type: "OMBRE_OPEN_SIDEPANEL" | "OPEN_SETTINGS", label: string) => {
    safeSendMessage({ type }).then((result) => {
      const response = result as { ok?: boolean; error?: string } | undefined;
      if (response?.ok === false) {
        pill.title = `${label}: ${response.error || "The browser could not open it."}`;
        console.error(`[Toqan] ${pill.title}`);
      } else {
        pill.title = "";
      }
    }).catch((error: Error) => {
      pill.title = `${label}: ${error.message}`;
      console.error(`[Toqan] ${pill.title}`);
    });
  };

  createRoot(mount).render(
    createElement(LauncherDock, {
      onOpenChat: () => runDockAction("OMBRE_OPEN_SIDEPANEL", "Could not open chat"),
      onOpenSettings: () => runDockAction("OPEN_SETTINGS", "Could not open settings"),
    })
  );

  onContextLost.push(() => {
    pill.style.opacity = "0.55";
    pill.title = "Ombre AI was updated. Please refresh this page to keep chatting.";
  });

  // Reveal on cursor proximity to the right edge, hide when cursor moves away.
  const REVEAL_ZONE_PX = 24;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const show = () => {
    clearTimeout(hideTimer);
    pill.classList.add("visible");
  };

  const scheduleHide = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => pill.classList.remove("visible"), 600);
  };

  document.addEventListener("mousemove", (e: MouseEvent) => {
    const nearEdge = e.clientX >= window.innerWidth - REVEAL_ZONE_PX;
    if (nearEdge) show();
    else scheduleHide();
  });

  pill.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  pill.addEventListener("mouseleave", () => scheduleHide());

  let dragStartY = 0;
  let dragStartTop = 0;
  let dragged = false;
  let activePointerId: number | null = null;
  pill.addEventListener("pointerdown", (event: PointerEvent) => {
    if (event.button !== 0) return;
    activePointerId = event.pointerId;
    dragStartY = event.clientY;
    dragStartTop = pill.getBoundingClientRect().top + pill.getBoundingClientRect().height / 2;
    dragged = false;
    clearTimeout(hideTimer);
  });
  pill.addEventListener("pointermove", (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;
    const delta = event.clientY - dragStartY;
    if (!dragged && Math.abs(delta) < 4) return;
    if (!dragged) pill.setPointerCapture(event.pointerId);
    dragged = true;
    pill.classList.add("dragging", "visible");
    const half = pill.getBoundingClientRect().height / 2;
    const center = Math.max(half + 4, Math.min(window.innerHeight - half - 4, dragStartTop + delta));
    pill.style.top = `${center}px`;
    pill.style.transform = "translateY(-50%) translateX(0)";
  });
  const finishDrag = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;
    activePointerId = null;
    if (pill.hasPointerCapture(event.pointerId)) pill.releasePointerCapture(event.pointerId);
    pill.classList.remove("dragging");
    if (dragged) {
      try {
        localStorage.setItem("ombre-launcher-top", String(pill.getBoundingClientRect().top + pill.getBoundingClientRect().height / 2));
      } catch { /* Keep dragging available when storage is disabled. */ }
      event.preventDefault();
      setTimeout(() => { dragged = false; }, 0);
    } else {
      scheduleHide();
    }
  };
  pill.addEventListener("pointerup", finishDrag);
  pill.addEventListener("pointercancel", finishDrag);
  pill.addEventListener("click", (event) => {
    if (dragged) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

}
