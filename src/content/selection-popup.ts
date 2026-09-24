import { NOTES_KEY, createNote, type Note } from "../lib/notes";
import { contextLostFired, onContextLost, safeSendMessage, safeStorageGet, safeStorageSet } from "./extension-context";
import { copyToClipboard, escapeHtml, renderMarkdownLite, stripMarkdownForCopy, guaranteeSpaceKeyWorks, thinkingIndicatorHtml, startThinkingWordCycle } from "./dom-utils";
import { focusQuickBarInput, isQuickBarOpen, QUICK_PEN_SVG } from "./quick-tool";

interface RuntimeChatEvent {
  type: string;
  conversationId?: string;
  reply?: string;
  error?: string;
  message?: string;
}

// ── Text-selection popup ──────────────────────────────────────────────────
// Highlight any text on a page and a compact toolbar appears above the
// selection: Ask Ombre + More. More opens a menu of writing actions.
// Each sends the selected text through the same TOQAN_CHAT pipeline the
// rest of the extension uses, then shows the result inline with Copy / Replace.

const SELECTION_HOST_ID = "ombre-ai-selection-host";

type SelectionAction = "ask" | "improve" | "rephrase" | "addmore" | "explain" | "shorter";

const SELECTION_PROMPTS: Record<SelectionAction, (text: string) => string> = {
  ask: (text) => text,
  improve: (text) =>
    `Improve the writing quality, clarity, and flow of the following text. Return ONLY the improved text with no preamble, quotes, or explanation:\n\n${text}`,
  rephrase: (text) =>
    `Rephrase the following text in a different way while keeping the same meaning. Return ONLY the rephrased text with no preamble, quotes, or explanation:\n\n${text}`,
  addmore: (text) =>
    `Expand on the following text with more relevant detail, keeping the same tone and style. Return ONLY the expanded text with no preamble, quotes, or explanation:\n\n${text}`,
  explain: (text) =>
    `Explain the following text clearly and concisely. Return ONLY the explanation with no preamble:\n\n${text}`,
  shorter: (text) =>
    `Make the following text shorter and more concise while keeping the meaning. Return ONLY the shortened text with no preamble, quotes, or explanation:\n\n${text}`,
};

// Blob avatar (same character as src/assets/avatar.svg), inlined so it renders
// inside shadow DOM without needing web_accessible_resources.
const BLOB_AVATAR_SVG = `<svg class="blob-avatar" viewBox="-125 -125 250 250" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><mask id="ombre-blob-mask" maskUnits="userSpaceOnUse" x="-158" y="-158" width="316" height="316"><path d="M100.26 0.3C100.26 3.58 100.1 6.88 99.78 10.15C99.46 13.42 98.98 16.68 98.34 19.9C97.7 23.12 96.91 26.32 95.96 29.46C95.01 32.6 93.9 35.71 92.65 38.75C91.4 41.78 89.99 44.76 88.45 47.66C86.91 50.55 85.22 53.38 83.41 56.11C81.59 58.84 79.64 61.49 77.56 64.03C75.49 66.57 73.28 69.01 70.97 71.34C68.66 73.66 66.23 75.87 63.7 77.96C61.18 80.04 58.54 82 55.82 83.83C53.1 85.65 50.28 87.35 47.4 88.9C44.52 90.44 41.55 91.86 38.53 93.11C35.51 94.37 32.42 95.48 29.29 96.43C26.16 97.39 22.98 98.19 19.77 98.83C16.57 99.47 13.32 99.95 10.06 100.27C6.81 100.6 3.53 100.76 0.26 100.76C-3 100.76 -6.29 100.6 -9.54 100.27C-12.79 99.95 -16.04 99.47 -19.25 98.83C-22.45 98.19 -25.64 97.39 -28.77 96.43C-31.89 95.48 -34.99 94.37 -38.01 93.11C-41.02 91.86 -44 90.44 -46.88 88.9C-49.76 87.35 -52.58 85.65 -55.29 83.83C-58.01 82 -60.65 80.04 -63.18 77.96C-65.7 75.87 -68.14 73.66 -70.45 71.34C-72.76 69.01 -74.97 66.57 -77.04 64.03C-79.11 61.49 -81.07 58.84 -82.88 56.11C-84.7 53.38 -86.39 50.55 -87.93 47.66C-89.47 44.76 -90.88 41.78 -92.13 38.75C-93.38 35.71 -94.48 32.6 -95.43 29.46C-96.38 26.32 -97.18 23.12 -97.82 19.9C-98.45 16.68 -98.94 13.42 -99.26 10.15C-99.58 6.88 -99.74 3.58 -99.74 0.3C-99.74 -2.98 -99.58 -6.28 -99.26 -9.54C-98.94 -12.81 -98.45 -16.08 -97.82 -19.3C-97.18 -22.51 -96.38 -25.72 -95.43 -28.86C-94.48 -32 -93.38 -35.11 -92.13 -38.14C-90.88 -41.17 -89.47 -44.16 -87.93 -47.05C-86.39 -49.95 -84.7 -52.78 -82.88 -55.51C-81.07 -58.24 -79.11 -60.89 -77.04 -63.43C-74.97 -65.96 -72.76 -68.41 -70.45 -70.73C-68.14 -73.05 -65.7 -75.27 -63.18 -77.35C-60.65 -79.43 -58.01 -81.4 -55.29 -83.22C-52.58 -85.05 -49.76 -86.74 -46.88 -88.29C-44 -89.84 -41.02 -91.25 -38.01 -92.51C-34.99 -93.76 -31.89 -94.87 -28.77 -95.83C-25.64 -96.78 -22.45 -97.58 -19.25 -98.22C-16.04 -98.86 -12.79 -99.35 -9.54 -99.67C-6.29 -99.99 -3 -100.15 0.26 -100.15C3.53 -100.15 6.81 -99.99 10.06 -99.67C13.32 -99.35 16.57 -98.86 19.77 -98.22C22.98 -97.58 26.16 -96.78 29.29 -95.83C32.42 -94.87 35.51 -93.76 38.53 -92.51C41.55 -91.25 44.52 -89.84 47.4 -88.29C50.28 -86.74 53.1 -85.05 55.82 -83.22C58.54 -81.4 61.18 -79.43 63.7 -77.35C66.23 -75.27 68.66 -73.05 70.97 -70.73C73.28 -68.41 75.49 -65.96 77.56 -63.43C79.64 -60.89 81.59 -58.24 83.41 -55.51C85.22 -52.78 86.91 -49.95 88.45 -47.05C89.99 -44.16 91.4 -41.17 92.65 -38.14C93.9 -35.11 95.01 -32 95.96 -28.86C96.91 -25.72 97.7 -22.51 98.34 -19.3C98.98 -16.08 99.46 -12.81 99.78 -9.54C100.1 -6.28 100.26 -2.98 100.26 0.3Z" fill="#fff"/><path d="M-10.5 -11.5A10.5 10.5 0 0 1 0 -22L0 -22A10.5 10.5 0 0 1 10.5 -11.5L10.5 11.5A10.5 10.5 0 0 1 0 22L0 22A10.5 10.5 0 0 1 -10.5 11.5Z" transform="matrix(0.98,-0.07,0.05,0.99,-17.2,-8.03)" opacity="1" fill="#000"/><path d="M-10.5 -11.5A10.5 10.5 0 0 1 0 -22L0 -22A10.5 10.5 0 0 1 10.5 -11.5L10.5 11.5A10.5 10.5 0 0 1 0 22L0 22A10.5 10.5 0 0 1 -10.5 11.5Z" transform="matrix(0.93,-0.01,0.05,0.99,37.56,-10.43)" opacity="1" fill="#000"/></mask></defs><path d="M100.26 0.3C100.26 3.58 100.1 6.88 99.78 10.15C99.46 13.42 98.98 16.68 98.34 19.9C97.7 23.12 96.91 26.32 95.96 29.46C95.01 32.6 93.9 35.71 92.65 38.75C91.4 41.78 89.99 44.76 88.45 47.66C86.91 50.55 85.22 53.38 83.41 56.11C81.59 58.84 79.64 61.49 77.56 64.03C75.49 66.57 73.28 69.01 70.97 71.34C68.66 73.66 66.23 75.87 63.7 77.96C61.18 80.04 58.54 82 55.82 83.83C53.1 85.65 50.28 87.35 47.4 88.9C44.52 90.44 41.55 91.86 38.53 93.11C35.51 94.37 32.42 95.48 29.29 96.43C26.16 97.39 22.98 98.19 19.77 98.83C16.57 99.47 13.32 99.95 10.06 100.27C6.81 100.6 3.53 100.76 0.26 100.76C-3 100.76 -6.29 100.6 -9.54 100.27C-12.79 99.95 -16.04 99.47 -19.25 98.83C-22.45 98.19 -25.64 97.39 -28.77 96.43C-31.89 95.48 -34.99 94.37 -38.01 93.11C-41.02 91.86 -44 90.44 -46.88 88.9C-49.76 87.35 -52.58 85.65 -55.29 83.83C-58.01 82 -60.65 80.04 -63.18 77.96C-65.7 75.87 -68.14 73.66 -70.45 71.34C-72.76 69.01 -74.97 66.57 -77.04 64.03C-79.11 61.49 -81.07 58.84 -82.88 56.11C-84.7 53.38 -86.39 50.55 -87.93 47.66C-89.47 44.76 -90.88 41.78 -92.13 38.75C-93.38 35.71 -94.48 32.6 -95.43 29.46C-96.38 26.32 -97.18 23.12 -97.82 19.9C-98.45 16.68 -98.94 13.42 -99.26 10.15C-99.58 6.88 -99.74 3.58 -99.74 0.3C-99.74 -2.98 -99.58 -6.28 -99.26 -9.54C-98.94 -12.81 -98.45 -16.08 -97.82 -19.3C-97.18 -22.51 -96.38 -25.72 -95.43 -28.86C-94.48 -32 -93.38 -35.11 -92.13 -38.14C-90.88 -41.17 -89.47 -44.16 -87.93 -47.05C-86.39 -49.95 -84.7 -52.78 -82.88 -55.51C-81.07 -58.24 -79.11 -60.89 -77.04 -63.43C-74.97 -65.96 -72.76 -68.41 -70.45 -70.73C-68.14 -73.05 -65.7 -75.27 -63.18 -77.35C-60.65 -79.43 -58.01 -81.4 -55.29 -83.22C-52.58 -85.05 -49.76 -86.74 -46.88 -88.29C-44 -89.84 -41.02 -91.25 -38.01 -92.51C-34.99 -93.76 -31.89 -94.87 -28.77 -95.83C-25.64 -96.78 -22.45 -97.58 -19.25 -98.22C-16.04 -98.86 -12.79 -99.35 -9.54 -99.67C-6.29 -99.99 -3 -100.15 0.26 -100.15C3.53 -100.15 6.81 -99.99 10.06 -99.67C13.32 -99.35 16.57 -98.86 19.77 -98.22C22.98 -97.58 26.16 -96.78 29.29 -95.83C32.42 -94.87 35.51 -93.76 38.53 -92.51C41.55 -91.25 44.52 -89.84 47.4 -88.29C50.28 -86.74 53.1 -85.05 55.82 -83.22C58.54 -81.4 61.18 -79.43 63.7 -77.35C66.23 -75.27 68.66 -73.05 70.97 -70.73C73.28 -68.41 75.49 -65.96 77.56 -63.43C79.64 -60.89 81.59 -58.24 83.41 -55.51C85.22 -52.78 86.91 -49.95 88.45 -47.05C89.99 -44.16 91.4 -41.17 92.65 -38.14C93.9 -35.11 95.01 -32 95.96 -28.86C96.91 -25.72 97.7 -22.51 98.34 -19.3C98.98 -16.08 99.46 -12.81 99.78 -9.54C100.1 -6.28 100.26 -2.98 100.26 0.3Z" fill="#f9f9f9"/><g mask="url(#ombre-blob-mask)"><rect x="-158" y="-158" width="316" height="316" fill="#6c63ff"/></g></svg>`;
export function initSelectionPopup() {
  if (document.getElementById(SELECTION_HOST_ID)) return;

  const host = document.createElement("div");
  host.id = SELECTION_HOST_ID;
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: "Inter", system-ui, -apple-system, sans-serif; }

    .toolbar {
      position: fixed;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 2px;
      height: 36px;
      padding: 0 6px;
      border-radius: 999px;
      background: #18181b;
      box-shadow: 0 4px 18px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08);
      opacity: 0;
      transform: translateY(6px) scale(0.96);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
    }
    .toolbar.visible { opacity: 1; transform: none; pointer-events: auto; }
    .toolbar.menu-open { display: none; }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 2px;
      min-width: 0;
    }

    .toolbar-more-actions {
      display: flex;
      align-items: center;
      gap: 2px;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
      transition: max-width 0.35s cubic-bezier(0.23,1,0.32,1), opacity 0.25s cubic-bezier(0.23,1,0.32,1);
    }
    .toolbar.expanded .toolbar-more-actions {
      max-width: 400px;
      opacity: 1;
    }

    .toolbar-input-wrap {
      display: flex;
      align-items: center;
      gap: 2px;
      max-width: 180px;
      overflow: hidden;
      transition: max-width 0.35s cubic-bezier(0.23,1,0.32,1);
    }
    .toolbar.expanded .toolbar-input-wrap {
      max-width: 0;
    }

    .tbtn {
      display: flex;
      align-items: center;
      gap: 5px;
      border: none;
      background: transparent;
      color: #e0e0e5;
      font-size: 12px;
      font-weight: 500;
      padding: 0 10px;
      height: 28px;
      border-radius: 999px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.12s, color 0.12s, transform 0.12s;
    }
    .tbtn:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .tbtn:active { transform: scale(0.96); }
    .tbtn svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }

    .tbtn.primary {
      background: #6c63ff;
      color: #fff;
      font-weight: 600;
      padding: 0 12px;
      gap: 6px;
    }
    .tbtn.primary:hover { background: #7d75ff; }
    .tbtn.primary svg { fill: #fff; stroke: none; width: 14px; height: 14px; }

    .tbtn.send {
      width: 28px;
      height: 28px;
      padding: 0;
      justify-content: center;
      background: #6c63ff;
      color: #fff;
      flex-shrink: 0;
    }
    .tbtn.send:hover { background: #7d75ff; }
    .tbtn.send svg { stroke: #fff; stroke-width: 2.5; }

    .tbtn.addchat { color: #60a5fa; }
    .tbtn.addchat:hover { background: rgba(96,165,250,0.15); color: #93c5fd; }
    .tbtn.addchat svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; width: 13px; height: 13px; }

    .tbtn.expand-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      justify-content: center;
    }

    .expand-chevron {
      display: flex;
      transition: transform 0.35s cubic-bezier(0.23,1,0.32,1);
    }
    .toolbar.expanded .expand-chevron {
      transform: rotate(180deg);
    }

    .tbtn.more {
      width: 28px;
      padding: 0;
      justify-content: center;
    }
    .tbtn.more[aria-expanded="true"] { background: rgba(255,255,255,0.08); }

    .toolbar-divider {
      width: 1px;
      height: 16px;
      background: rgba(255,255,255,0.1);
      flex-shrink: 0;
      margin: 0 2px;
    }

    .toolbar-input {
      width: 140px;
      height: 28px;
      border: none;
      background: transparent;
      color: #e0e0e5;
      font-size: 12px;
      font-family: inherit;
      padding: 0 8px;
      outline: none;
    }
    .toolbar-input::placeholder { color: #8b8b95; }

    .more-menu {
      position: fixed;
      z-index: 2147483647;
      width: 200px;
      display: none;
      flex-direction: column;
      gap: 1px;
      padding: 6px;
      border-radius: 12px;
      background: #18181b;
      box-shadow: 0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08);
      overflow: hidden;
    }
    .more-menu.visible { display: flex; }

    .more-menu-title {
      height: 28px;
      padding: 0 8px;
      display: flex;
      align-items: center;
      font-size: 11px;
      font-weight: 600;
      color: #8b8b95;
      letter-spacing: 0.01em;
    }

    .more-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      height: 32px;
      padding: 0 8px;
      border: none;
      background: transparent;
      color: #e0e0e5;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s;
    }
    .more-item:hover { background: rgba(255,255,255,0.07); }
    .more-item svg {
      width: 14px;
      height: 14px;
      stroke: #8b8b95;
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      flex-shrink: 0;
    }
    .more-item:hover svg { stroke: #e0e0e5; }

    .card {
      position: fixed;
      z-index: 2147483647;
      width: 340px;
      max-height: 380px;
      display: flex;
      flex-direction: column;
      background: #111111;
      color: #f2f2f5;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.5);
      opacity: 0;
      transform: translateY(6px) scale(0.97);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
      overflow: hidden;
    }
    .card.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
    .card-brand { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; }
    .card-brand svg.blob-avatar { width: 20px; height: 20px; border-radius: 7px; flex-shrink: 0; }
    .card-close { cursor: pointer; background: none; border: none; color: #8b8b95; padding: 4px; border-radius: 6px; display: flex; transition: background 0.12s, color 0.12s; }
    .card-close:hover { background: rgba(255,255,255,0.08); color: #f2f2f5; }
    .card-close svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }

    .card-body { flex: 1; overflow-y: auto; padding: 12px; font-size: 12.5px; line-height: 1.65; }
    .card-body p { margin: 0 0 8px; }
    .card-body p:last-child { margin-bottom: 0; }
    .card-body ul, .card-body ol { margin: 4px 0 8px; padding-left: 18px; }
    .card-body li { margin-bottom: 3px; }
    .card-body strong { font-weight: 600; color: #fff; }
    .card-body code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 4px; font-size: 11.5px; color: #c9c4ff; }
    .card-body .error-text { color: #ff8a8f; }

    .addmore-preview { font-size: 12px; font-style: italic; color: #8b8b95; padding: 8px 10px; background: #17171a; border-radius: 8px; margin-bottom: 10px; max-height: 60px; overflow-y: auto; }
    .addmore-label { font-size: 11.5px; color: #8b8b95; margin: 0 0 6px; }
    .addmore-input { width: 100%; resize: none; background: #17171a; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #f2f2f5; font-size: 12.5px; font-family: inherit; padding: 8px 10px; outline: none; margin-bottom: 8px; }
    .addmore-input:focus { border-color: rgba(108,99,255,0.6); box-shadow: 0 0 0 3px rgba(108,99,255,0.15); }
    .addmore-submit { display: flex; align-items: center; justify-content: center; gap: 5px; width: 100%; border: none; background: #6c63ff; color: #fff; font-size: 12.5px; font-weight: 600; padding: 8px; border-radius: 8px; cursor: pointer; transition: background 0.12s; }
    .addmore-submit:hover { background: #7d75ff; }
    .addmore-submit svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    .card-loading { display: flex; align-items: center; gap: 8px; padding: 2px 0; color: #8b8b95; }
    .card-loading .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #6c63ff; border-radius: 999px; animation: spin 700ms linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Pixel-grid thinking indicator */
    .card-loading { display: flex; align-items: center; gap: 8px; padding: 8px 0; color: #8b8b95; }
    .thinking-grid { display: grid; grid-template-columns: repeat(3, 4px); gap: 1.5px; flex-shrink: 0; }
    .thinking-pixel { width: 4px; height: 4px; background: #a1a1aa; border-radius: 1px; opacity: 0.15; animation: pixel-on 650ms ease-in-out infinite; }
    .thinking-pixel.center { border-radius: 50%; }
    .thinking-label { font-size: 13px; font-weight: 500; color: transparent; background-clip: text; -webkit-background-clip: text; animation: shimmer-text 1.4s linear infinite; }
    .thinking-elapsed { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; font-variant-numeric: tabular-nums; color: #8b8b95; margin-left: 4px; }

    @keyframes pixel-on {
      0%, 100% { opacity: 0.07; }
      50% { opacity: 1; }
    }
    @keyframes shimmer-text {
      0% { background-position: 200% center; }
      100% { background-position: -200% center; }
    }

    @media (prefers-reduced-motion: reduce) {
      .thinking-pixel, .thinking-label { animation: none !important; }
    }

    .card-footer { display: flex; gap: 6px; padding: 10px 12px; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
    .card-action { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; border: none; background: #1c1c20; color: #e6e6ea; font-size: 12px; font-weight: 500; padding: 7px 8px; border-radius: 8px; cursor: pointer; transition: background 0.12s, transform 0.12s; }
    .card-action:disabled { cursor: default; opacity: 0.85; }
    .card-action:hover { background: #26262b; }
    .card-action:active { transform: scale(0.97); }
    .card-action.primary { background: #6c63ff; color: #fff; }
    .card-action.primary:hover { background: #7d75ff; }
    .card-action svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
  `;

  const TOAST_HOST_ID = "ombre-ai-toast-host";

  function showQuickToast(msg: string) {
    let host = document.getElementById(TOAST_HOST_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = TOAST_HOST_ID;
      document.documentElement.appendChild(host);
      const root = host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `
        .toast-box {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          z-index: 2147483647;
          background: rgba(23, 23, 26, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(108, 99, 255, 0.4);
          color: #f2f2f5;
          font-family: "Inter", system-ui, -apple-system, sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 999px;
          box-shadow: 0 10px 28px rgba(0,0,0,0.5);
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .toast-box.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `;
      const container = document.createElement("div");
      container.className = "toast-container";
      root.append(style, container);
    }

    const root = host.shadowRoot;
    if (!root) return;
    const container = root.querySelector(".toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast-box";
    toast.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> ${escapeHtml(msg)}`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("visible");
    });

    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  }

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";
  toolbar.innerHTML = `
    <div class="toolbar-actions">
      <button class="tbtn primary" data-action="ask" type="button">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5c.4 2.7 1 4.4 2.3 5.7 1.3 1.3 3 1.9 5.7 2.3-2.7.4-4.4 1-5.7 2.3-1.3 1.3-1.9 3-2.3 5.7-.4-2.7-1-4.4-2.3-5.7-1.3-1.3-3-1.9-5.7-2.3 2.7-.4 4.4-1 5.7-2.3 1.3-1.3 1.9-3 2.3-5.7z"/></svg>
        Ask Ombre
      </button>
      <button class="tbtn" data-action="improve" type="button">
        <svg viewBox="0 0 24 24"><path d="M15 4V2m0 4V4m-4.5 3.5L9 6m1.5 1.5L9 9M4 15l11-11 3 3L7 18l-4 1 1-4z"/></svg>
        Improve
      </button>
      <span class="toolbar-divider"></span>
      <button class="tbtn addchat" type="button" title="Add selected text to side panel chat">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Add to Chat
      </button>
      <span class="toolbar-divider"></span>
      <div class="toolbar-more-actions">
        <button class="tbtn" data-action="shorter" type="button">
          <svg viewBox="0 0 24 24"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          Shorten
        </button>
        <button class="tbtn" data-action="explain" type="button">
          <svg viewBox="0 0 24 24"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
          Explain
        </button>
        <button class="tbtn" data-action="rephrase" type="button">
          <svg viewBox="0 0 24 24"><path d="M17 2.1 21 6l-4 3.9M3 12v-2a4 4 0 0 1 4-4h14M7 21.9 3 18l4-3.9M21 12v2a4 4 0 0 1-4 4H3"/></svg>
          Rephrase
        </button>
        <button class="tbtn savenote" type="button" title="Save selected text to Notes">
          ${QUICK_PEN_SVG}
          Save Note
        </button>
      </div>
      <button class="tbtn expand-btn" type="button" aria-label="Show more actions" aria-expanded="false">
        <span class="expand-chevron"><svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
      </button>
    </div>
    <div class="toolbar-input-wrap">
      <input class="toolbar-input" type="text" placeholder="Describe edits…" aria-label="Describe edits" />
      <button class="tbtn send" type="button" title="Send" style="display:none;">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </div>
    <button class="tbtn more" type="button" aria-expanded="false" aria-haspopup="menu">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>
    </button>
  `;

  const moreMenu = document.createElement("div");
  moreMenu.className = "more-menu";
  moreMenu.setAttribute("role", "menu");
  moreMenu.setAttribute("aria-label", "More options");
  moreMenu.innerHTML = `
    <div class="more-menu-title">More options</div>
    <button class="more-item savenote" role="menuitem" title="Save selected text directly to your notes">
      ${QUICK_PEN_SVG}
      Save to notes
    </button>
    <button class="more-item" data-action="improve" role="menuitem">
      <svg viewBox="0 0 24 24"><path d="M15 4V2m0 4V4m-4.5 3.5L9 6m1.5 1.5L9 9M4 15l11-11 3 3L7 18l-4 1 1-4z"/></svg>
      Improve
    </button>
    <button class="more-item" data-action="explain" role="menuitem">
      <svg viewBox="0 0 24 24"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
      Explain this
    </button>
    <button class="more-item" data-action="shorter" role="menuitem">
      <svg viewBox="0 0 24 24"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
      Make shorter
    </button>
    <button class="more-item" data-action="addmore" role="menuitem">
      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
      Add more
    </button>
    <button class="more-item" data-action="rephrase" role="menuitem">
      <svg viewBox="0 0 24 24"><path d="M17 2.1 21 6l-4 3.9M3 12v-2a4 4 0 0 1 4-4h14M7 21.9 3 18l4-3.9M21 12v2a4 4 0 0 1-4 4H3"/></svg>
      Rephrase
    </button>
    `;

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-header">
      <div class="card-brand">${BLOB_AVATAR_SVG} Ombre AI</div>
      <button class="card-close" aria-label="Close" title="Close">
        <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="card-body"></div>
    <div class="card-footer" style="display:none;"></div>
  `;

  root.append(style, toolbar, moreMenu, card);

  const cardBody = card.querySelector(".card-body") as HTMLDivElement;
  const cardFooter = card.querySelector(".card-footer") as HTMLDivElement;
  const cardCloseBtn = card.querySelector(".card-close") as HTMLButtonElement;

  let lastSelectedText = "";
  let lastRange: Range | null = null;
  let lastIsEditable = false;
  let lastFieldEl: HTMLTextAreaElement | HTMLInputElement | null = null;
  let lastFieldStart = 0;
  let lastFieldEnd = 0;
  let activeConversationId: string | null = null;

  const moreBtn = toolbar.querySelector(".tbtn.more") as HTMLButtonElement;

  function saveSelectionAsNote() {
    if (!lastSelectedText) return;
    const text = lastSelectedText.trim();
    if (!text) return;
    safeStorageGet([NOTES_KEY]).then((res) => {
      const existing = (res[NOTES_KEY] as Note[]) || [];
      const note = createNote(text);
      safeStorageSet({ [NOTES_KEY]: [note, ...existing] });
      showQuickToast("Saved to Notes! 📝");
      hideToolbar();
    });
  }

  function hideMoreMenu() {
    moreMenu.classList.remove("visible");
    toolbar.classList.remove("menu-open");
    moreBtn.setAttribute("aria-expanded", "false");
  }
  function hideToolbar() {
    toolbar.classList.remove("visible", "expanded");
    extrasExpanded = false;
    expandBtn?.setAttribute("aria-expanded", "false");
    hideMoreMenu();
  }
  function hideCard() {
    card.classList.remove("visible");
    activeConversationId = null;
    stopCardThinkingCycle?.();
  }

  function isWithinOwnUI(node: Node | null, event?: Event): boolean {
    // Check composedPath first (crosses shadow DOM boundaries)
    if (event?.composedPath) {
      for (const n of event.composedPath()) {
        if (n instanceof Element && (n.id === "ombre-ai-context-panel-host" || n.id === SELECTION_HOST_ID)) {
          return true;
        }
      }
    }

    // Fallback: walk parentElement (for non-event contexts)
    let el = node instanceof Element ? node : node?.parentElement ?? null;
    while (el) {
      if (el.id === "ombre-ai-context-panel-host" || el.id === SELECTION_HOST_ID) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  function isEditableContext(node: Node | null): boolean {
    let el = node instanceof Element ? node : node?.parentElement ?? null;
    while (el) {
      if (el instanceof HTMLElement && (el.isContentEditable || el.tagName === "TEXTAREA" || el.tagName === "INPUT")) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  const TEXT_INPUT_TYPES = new Set(["text", "search", "url", "tel", "email", "password", ""]);

  function getFieldSelection(): { el: HTMLTextAreaElement | HTMLInputElement; text: string; start: number; end: number } | null {
    const active = document.activeElement;
    if (isWithinOwnUI(active)) return null;

    const isTextarea = active instanceof HTMLTextAreaElement;
    const isTextInput = active instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(active.type);
    if (!isTextarea && !isTextInput) return null;

    const el = active as HTMLTextAreaElement | HTMLInputElement;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start == null || end == null || end <= start) return null;

    return { el, text: el.value.slice(start, end), start, end };
  }

  function positionAbove(el: HTMLElement, rect: DOMRect, width: number, height: number) {
    const margin = 8;
    let top = rect.top - height - margin;
    let left = rect.left + rect.width / 2 - width / 2;

    if (top < margin) top = rect.bottom + margin;
    if (left < margin) left = margin;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
    if (top + height > window.innerHeight - margin) top = Math.max(margin, window.innerHeight - height - margin);

    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  }

  function showToolbarFor(rect: DOMRect) {
    if (rect.width === 0 && rect.height === 0) {
      hideToolbar();
      return;
    }
    hideMoreMenu();
    toolbar.classList.add("visible");
    requestAnimationFrame(() => {
      positionAbove(toolbar, rect, toolbar.offsetWidth, toolbar.offsetHeight);
    });
  }

  function checkSelection() {
    if (contextLostFired || card.classList.contains("visible") || moreMenu.classList.contains("visible")) return;

    // Don't interfere when the toolbar's own input is focused
    if (document.activeElement && isWithinOwnUI(document.activeElement)) return;

    const fieldSel = getFieldSelection();
    if (fieldSel) {
      lastSelectedText = fieldSel.text.trim();
      lastRange = null;
      lastIsEditable = true;
      lastFieldEl = fieldSel.el;
      lastFieldStart = fieldSel.start;
      lastFieldEnd = fieldSel.end;
      showToolbarFor(fieldSel.el.getBoundingClientRect());
      return;
    }

    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (!text || !sel || sel.rangeCount === 0) {
      hideToolbar();
      return;
    }
    const range = sel.getRangeAt(0);
    if (isWithinOwnUI(range.commonAncestorContainer)) {
      hideToolbar();
      return;
    }

    lastSelectedText = text;
    lastRange = range.cloneRange();
    lastIsEditable = isEditableContext(range.commonAncestorContainer);
    lastFieldEl = null;
    showToolbarFor(range.getBoundingClientRect());
  }

  let selTimer: number | undefined;
  function scheduleCheckSelection() {
    window.clearTimeout(selTimer);
    selTimer = window.setTimeout(checkSelection, 120);
  }

  document.addEventListener("selectionchange", scheduleCheckSelection);
  document.addEventListener("mouseup", (e) => {
    if (isWithinOwnUI(e.target as Node)) return;
    scheduleCheckSelection();
  });
  document.addEventListener("keyup", (e) => {
    if (e.shiftKey || e.key === "Shift") scheduleCheckSelection();
  });

  document.addEventListener("mousedown", (e) => {
    if (isWithinOwnUI(e.target as Node, e)) return;
    hideToolbar();
  });
  window.addEventListener("scroll", hideToolbar, true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideToolbar();
      hideCard();
    }
    if (e.key === "-" && isQuickBarOpen()) {
      e.preventDefault();
      focusQuickBarInput();
    }
  });

  cardCloseBtn.addEventListener("click", hideCard);

  let stopCardThinkingCycle: (() => void) | null = null;

  function renderCardLoading(words: string[] = ["Thinking", "Reasoning", "Considering"]) {
    stopCardThinkingCycle?.();
    cardBody.innerHTML = `<div class="card-loading">${thinkingIndicatorHtml(words)}</div>`;
    cardFooter.style.display = "none";
    stopCardThinkingCycle = startThinkingWordCycle(cardBody, words);
  }

  function renderCardResult(text: string, isError: boolean) {
    stopCardThinkingCycle?.();
    cardBody.innerHTML = isError
      ? `<div class="error-text">${escapeHtml(text)}</div>`
      : renderMarkdownLite(text);

    if (isError) {
      cardFooter.style.display = "none";
      return;
    }
    cardFooter.style.display = "flex";
    cardFooter.innerHTML = `
      <button class="card-action" data-act="copy">
        <svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        Copy
      </button>
      <button class="card-action" data-act="savenote">
        ${QUICK_PEN_SVG}
        Save Note
      </button>
      ${lastIsEditable
        ? `<button class="card-action primary" data-act="replace">
              <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
              Replace
            </button>`
        : ""
      }
    `;
    cardFooter.querySelector('[data-act="copy"]')?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const originalLabel = btn.innerHTML;
      const ok = await copyToClipboard(stripMarkdownForCopy(text));
      btn.innerHTML = ok
        ? `<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Copied`
        : `<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg> Couldn't copy`;
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = originalLabel;
        btn.disabled = false;
      }, 1600);
    });
    cardFooter.querySelector('[data-act="savenote"]')?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const originalLabel = btn.innerHTML;
      const clean = stripMarkdownForCopy(text);
      if (clean) {
        const res = await safeStorageGet([NOTES_KEY]);
        const existing = (res[NOTES_KEY] as Note[]) || [];
        const note = createNote(clean);
        await safeStorageSet({ [NOTES_KEY]: [note, ...existing] });
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Saved!`;
        btn.disabled = true;
        showQuickToast("Response saved to Notes! 📝");
        setTimeout(() => {
          btn.innerHTML = originalLabel;
          btn.disabled = false;
        }, 1600);
      }
    });
    cardFooter.querySelector('[data-act="replace"]')?.addEventListener("click", () => {
      const clean = stripMarkdownForCopy(text);
      if (lastFieldEl) {
        replaceInField(lastFieldEl, lastFieldStart, lastFieldEnd, clean);
      } else if (lastRange) {
        try {
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(lastRange);
          document.execCommand("insertText", false, clean);
        } catch {
          copyToClipboard(clean);
        }
      }
      hideCard();
    });
  }

  // Directly setting `.value` on an <input>/<textarea> doesn't notify
  // frameworks like React, which patch the *prototype's* value setter to
  // track changes — going through that prototype setter first, then firing
  // a real "input" event, makes the edit show up correctly everywhere.
  function replaceInField(el: HTMLTextAreaElement | HTMLInputElement, start: number, end: number, newText: string) {
    const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    const newValue = el.value.slice(0, start) + newText + el.value.slice(end);

    if (nativeSetter) nativeSetter.call(el, newValue);
    else el.value = newValue;

    el.dispatchEvent(new Event("input", { bubbles: true }));
    const caret = start + newText.length;
    el.focus();
    try {
      el.setSelectionRange(caret, caret);
    } catch {
      // some input types (e.g. email/number) don't support selectionRange
    }
  }

  function sendSelectionPrompt(prompt: string) {
    renderCardLoading();
    const conversationId = `sel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeConversationId = conversationId;

    safeSendMessage({
      type: "TOQAN_CHAT",
      messages: [{ id: "1", role: "user", content: prompt, createdAt: Date.now() }],
      conversationId,
    }).catch((err) => {
      if (activeConversationId !== conversationId) return;
      renderCardResult((err as Error).message || "Something went wrong.", true);
    });
  }

  function renderCardAddMoreInput() {
    cardFooter.style.display = "none";
    const preview = lastSelectedText.length > 140 ? `${lastSelectedText.slice(0, 140)}…` : lastSelectedText;
    cardBody.innerHTML = `
      <div class="addmore-preview">"${escapeHtml(preview)}"</div>
      <p class="addmore-label">What do you want to know more about? (optional — leave blank to just expand it)</p>
      <textarea class="addmore-input" rows="2" placeholder="e.g. its history, how it works, real-world examples…"></textarea>
      <button class="addmore-submit">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        Ask
      </button>
    `;
    const input = cardBody.querySelector(".addmore-input") as HTMLTextAreaElement;
    const submitBtn = cardBody.querySelector(".addmore-submit") as HTMLButtonElement;
    input.focus();

    const submit = () => {
      const question = input.value.trim();
      const prompt = question
        ? `Here is a piece of text:\n\n"""${lastSelectedText}"""\n\nRegarding this text, the reader wants to know more about the following, so answer it clearly using the text as context: ${question}`
        : SELECTION_PROMPTS.addmore(lastSelectedText);
      sendSelectionPrompt(prompt);
    };
    submitBtn.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    });
    guaranteeSpaceKeyWorks(input);
  }

  function runAction(action: SelectionAction, customPrompt?: string) {
    if (!lastSelectedText || contextLostFired) return;
    const rect = lastFieldEl ? lastFieldEl.getBoundingClientRect() : lastRange?.getBoundingClientRect();
    hideToolbar();

    card.classList.add("visible");
    requestAnimationFrame(() => {
      if (rect) positionAbove(card, rect, 340, action === "addmore" ? 210 : 200);
    });

    if (action === "addmore") {
      renderCardAddMoreInput();
      return;
    }
    if (customPrompt) {
      sendSelectionPrompt(customPrompt);
    } else {
      sendSelectionPrompt(SELECTION_PROMPTS[action](lastSelectedText));
    }
  }

  onContextLost.push(() => {
    hideToolbar();
    hideCard();
  });

  chrome.runtime.onMessage.addListener((event: RuntimeChatEvent) => {
    if (!event.conversationId || event.conversationId !== activeConversationId) return;
    if (event.type === "TOQAN_REPLY") {
      renderCardResult(event.reply ?? "", false);
    } else if (event.type === "TOQAN_ERROR") {
      renderCardResult(event.error ?? "Unknown error", true);
    } else if (event.type === "TOQAN_OVERLOADED") {
      renderCardLoading(["Retrying"]);
    }
  });

  toolbar.querySelectorAll<HTMLButtonElement>(".tbtn[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => runAction(btn.dataset.action as SelectionAction));
  });

  moreMenu.querySelectorAll<HTMLButtonElement>(".more-item[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => runAction(btn.dataset.action as SelectionAction));
  });

  toolbar.querySelector(".tbtn.savenote")?.addEventListener("click", saveSelectionAsNote);
  moreMenu.querySelector(".more-item.savenote")?.addEventListener("click", saveSelectionAsNote);

  // Add to chat — send selected text to side panel chat
  toolbar.querySelector(".tbtn.addchat")?.addEventListener("click", () => {
    if (!lastSelectedText) return;
    const text = lastSelectedText;
    hideToolbar();
    safeSendMessage({ type: "OMBRE_ADD_TO_CHAT", text }).then((result) => {
      const response = result as { ok?: boolean; error?: string } | undefined;
      if (response?.ok === false) showQuickToast(response.error || "Could not add text to chat.");
    }).catch((error: Error) => {
      showQuickToast(error.message || "Could not add text to chat.");
    });
  });

  // Custom prompt input + send button
  const toolbarInput = toolbar.querySelector(".toolbar-input") as HTMLInputElement;
  const toolbarSendBtn = toolbar.querySelector(".tbtn.send") as HTMLButtonElement;

  toolbarInput?.addEventListener("input", () => {
    const hasText = toolbarInput.value.trim().length > 0;
    toolbarSendBtn.style.display = hasText ? "flex" : "none";
  });

  toolbarInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = toolbarInput.value.trim();
      if (text) {
        runAction("custom" as SelectionAction, `${text} the following text. Return ONLY the rewritten text with no preamble, quotes, or explanation:\n\n${lastSelectedText}`);
        toolbarInput.value = "";
        toolbarSendBtn.style.display = "none";
      }
    }
    if (e.key === "Escape") {
      toolbarInput.value = "";
      toolbarSendBtn.style.display = "none";
      toolbarInput.blur();
    }
  });

  toolbarSendBtn?.addEventListener("click", () => {
    const text = toolbarInput.value.trim();
    if (text) {
      runAction("custom" as SelectionAction, `${text} the following text. Return ONLY the rewritten text with no preamble, quotes, or explanation:\n\n${lastSelectedText}`);
      toolbarInput.value = "";
      toolbarSendBtn.style.display = "none";
    }
  });

  // Expand/collapse extra actions
  const expandBtn = toolbar.querySelector(".expand-btn") as HTMLButtonElement;
  let extrasExpanded = false;

  function repositionToolbar() {
    const rect = lastFieldEl ? lastFieldEl.getBoundingClientRect() : lastRange?.getBoundingClientRect();
    if (rect) {
      requestAnimationFrame(() => {
        positionAbove(toolbar, rect, toolbar.offsetWidth, toolbar.offsetHeight);
      });
    }
  }

  expandBtn?.addEventListener("click", () => {
    extrasExpanded = !extrasExpanded;
    expandBtn.setAttribute("aria-expanded", String(extrasExpanded));
    toolbar.classList.toggle("expanded", extrasExpanded);
    // Reposition after expansion animation starts
    requestAnimationFrame(() => repositionToolbar());
  });

  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = !moreMenu.classList.contains("visible");
    if (!open) {
      hideMoreMenu();
      return;
    }
    toolbar.classList.add("menu-open");
    moreMenu.classList.add("visible");
    moreBtn.setAttribute("aria-expanded", "true");
    const rect = lastFieldEl ? lastFieldEl.getBoundingClientRect() : lastRange?.getBoundingClientRect();
    if (rect) {
      requestAnimationFrame(() => {
        positionAbove(moreMenu, rect, moreMenu.offsetWidth || 230, moreMenu.offsetHeight);
      });
    }
  });
}

// ── Quick-action tool (bottom-center of every page) ───────────────────────
// A standalone floating control docked at the bottom center. Plain text +
// Enter saves a quick note; typing "-" opens a search palette over the saved
// notes (Keep-style) with highlighted matches and keyboard navigation, and a
// selected note opens in a preview card. Fully independent of the chat.
