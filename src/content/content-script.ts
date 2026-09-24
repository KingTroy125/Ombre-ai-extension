// content/index.ts — floating response panel for "Ask Ombre AI" context menu action.
// Runs in an isolated shadow root so host-page CSS can't leak in or out.
import { NOTES_KEY, createNote, notePreview, searchNotes, type Note } from "../lib/notes";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { LauncherDock } from "./LauncherDock";
import tailwindCss from "../styles/globals.css?inline";

// ── Extension-context safety ──────────────────────────────────────────────
// When the extension is reloaded/updated (dev iteration, or a normal
// background auto-update), tabs that were already open keep running this
// *old* content script — but its `chrome.runtime`/`chrome.storage` handles
// are now dead. Calling them then throws synchronously ("Extension context
// invalidated"), not a rejected promise, which crashes as an uncaught error
// if unguarded. Every chrome.* call in this file goes through these wrappers
// so that failure degrades to a friendly on-page message instead.

const CONTEXT_INVALIDATED_MESSAGE =
  "Ombre AI was updated. Please refresh this page to keep chatting.";

function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

function safeSendMessage(message: unknown): Promise<unknown> {
  if (!isExtensionContextValid()) {
    return Promise.reject(new Error(CONTEXT_INVALIDATED_MESSAGE));
  }
  try {
    return chrome.runtime.sendMessage(message);
  } catch {
    return Promise.reject(new Error(CONTEXT_INVALIDATED_MESSAGE));
  }
}

// ── Quick‑bar references (for /‑key global handler) ───────────────────────
let dock: HTMLDivElement | null = null;
let quickBarOpen = false;

function safeStorageGet(keys: string[]): Promise<Record<string, unknown>> {
  if (!isExtensionContextValid()) return Promise.resolve({});
  try {
    return chrome.storage.local.get(keys);
  } catch {
    return Promise.resolve({});
  }
}

function safeStorageSet(items: Record<string, unknown>): void {
  if (!isExtensionContextValid()) return;
  try {
    chrome.storage.local.set(items).catch(() => { });
  } catch {
    // context died mid-call — nothing more we can do, next save attempt will just no-op too
  }
}

// Once the context is confirmed dead, stop pretending the UI works: disable
// send/mic controls across every panel and show a one-line "please refresh"
// notice instead of silently failing (or worse, crashing) on the next click.
const onContextLost: Array<() => void> = [];
let contextLostFired = false;

function reportContextLost() {
  if (contextLostFired) return;
  contextLostFired = true;
  onContextLost.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore — best effort UI cleanup
    }
  });
}

// Proactive check every 20s catches the case where the tab just sits open
// with nothing clicked — so the "please refresh" notice appears even before
// the user tries to send anything.
window.setInterval(() => {
  if (!isExtensionContextValid()) reportContextLost();
}, 20000);

interface ContextEvent {
  type: "TOQAN_CONTEXT_RESPONSE" | "TOQAN_CONTEXT_ERROR";
  query?: string;
  response?: string;
  error?: string;
}

const HOST_ID = "ombre-ai-context-panel-host";

function ensureHost(): { host: HTMLElement; root: ShadowRoot } {
  let host = document.getElementById(HOST_ID);
  if (host && host.shadowRoot) {
    return { host, root: host.shadowRoot };
  }
  host = document.createElement("div");
  host.id = HOST_ID;
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  host.style.bottom = "20px";
  host.style.right = "20px";
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });
  return { host, root };
}

function renderPanel({ query, response, error }: ContextEvent) {
  const { root } = ensureHost();
  root.innerHTML = "";

  const style = document.createElement("style");
  style.textContent = `
    .panel {
      width: 340px;
      max-height: 420px;
      display: flex;
      flex-direction: column;
      background: #111111;
      color: #f2f2f5;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.45);
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      overflow: hidden;
      animation: slide-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .brand { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
    .dot { width: 20px; height: 20px; border-radius: 6px; background: #6c63ff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; }
    .close { cursor: pointer; background: none; border: none; color: #8b8b95; line-height: 1; padding: 4px; border-radius: 6px; display: flex; }
    .close svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .close:hover { background: rgba(255,255,255,0.08); color: #f2f2f5; }
    .body { padding: 12px; overflow-y: auto; font-size: 13px; line-height: 1.6; }
    .query { color: #8b8b95; font-size: 11.5px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .answer { line-height: 1.6; }
    .answer p { margin: 0 0 8px; }
    .answer p:last-child { margin-bottom: 0; }
    .answer .md-gap { height: 4px; }
    .answer ul, .answer ol { margin: 4px 0 10px; padding-left: 20px; }
    .answer li { margin-bottom: 4px; }
    .answer strong { font-weight: 600; color: #fff; }
    .answer code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 4px; font-size: 12px; color: #c9c4ff; }
    .error { color: #ff8a8f; }
  `;

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="header">
      <div class="brand"><span class="dot">O</span> Ombre AI</div>
      <button class="close" aria-label="Close">
        <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="body">
      ${query ? `<div class="query">${escapeHtml(query)}</div>` : ""}
      <div class="${error ? "answer error" : "answer"}">${error ? escapeHtml(error) : renderMarkdownLite(response || "")
    }</div>
    </div>
  `;

  panel.querySelector(".close")?.addEventListener("click", () => {
    document.getElementById(HOST_ID)?.remove();
  });

  root.appendChild(style);
  root.appendChild(panel);
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Lightweight markdown → HTML for the vanilla-DOM panels (popup/sidepanel use
// full react-markdown; these shadow-DOM panels can't, so this covers what the
// Toqan API actually sends back: bold/italic/inline-code, bullet and numbered
// lists, and paragraph breaks. Input is escaped first, so this stays safe.
function renderMarkdownLite(raw: string): string {
  const escaped = escapeHtml(raw).replace(/\r\n/g, "\n");
  const lines = escaped.split("\n");

  let html = "";
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      html += listType === "ul" ? "</ul>" : "</ol>";
      listType = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const bulletMatch = /^[-*•]\s+(.*)$/.exec(trimmed);
    const numberedMatch = /^\d+[.)]\s+(.*)$/.exec(trimmed);

    if (bulletMatch) {
      if (listType !== "ul") {
        closeList();
        html += "<ul>";
        listType = "ul";
      }
      html += `<li>${inlineMarkdown(bulletMatch[1])}</li>`;
    } else if (numberedMatch) {
      if (listType !== "ol") {
        closeList();
        html += "<ol>";
        listType = "ol";
      }
      html += `<li>${inlineMarkdown(numberedMatch[1])}</li>`;
    } else {
      closeList();
      if (trimmed === "") {
        html += "<div class=\"md-gap\"></div>";
      } else {
        html += `<p>${inlineMarkdown(trimmed)}</p>`;
      }
    }
  }
  closeList();
  return html;
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/`([^`]+?)`/g, "<code>$1</code>")
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "<em>$1</em>")
    .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, "<em>$1</em>");
}

// Copy/Replace need the CLEAN text the person actually asked for — not the
// raw markdown source. Without this, "Improve"/"Rephrase"/"Add more" would
// paste literal **asterisks** and bullet dashes into whatever field the
// person pasted or replaced into, since the AI's answer is markdown, not
// plain text.
function stripMarkdownForCopy(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, "").trim())
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+?)`/g, "$1")
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, "$1")
    .replace(/^[ \t]*[-*•][ \t]+/gm, "\u2022 ")
    .trim();
}

// navigator.clipboard.writeText can throw in a content script — some sites
// set a Permissions-Policy that blocks clipboard-write for embedded/third-
// party contexts, and it always requires the document to currently have
// focus. Fall back to the classic hidden-textarea + execCommand trick so
// Copy still works on pages that block the modern API.
async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// Some host pages attach a global (often capture-phase) keydown listener
// for the spacebar — video play/pause, "page down" scrolling, slide
// navigation, etc. — that's meant to skip firing while a form field is
// focused, by checking document.activeElement. But our inputs live inside
// a shadow root, and Shadow DOM encapsulation means document.activeElement
// only ever exposes the shadow *host* element (a plain <div>), never the
// actual <textarea> focused inside it — so that "skip if a field is
// focused" check silently fails, and the host page ends up calling
// preventDefault() on the space before our textarea ever gets to type it.
// Fix: insert the character ourselves, directly, regardless of whatever an
// earlier (host-page) listener already did to the event.
function insertTextAtCursor(el: HTMLTextAreaElement, text: string) {
  const proto = window.HTMLTextAreaElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const newValue = el.value.slice(0, start) + text + el.value.slice(end);

  if (nativeSetter) nativeSetter.call(el, newValue);
  else el.value = newValue;

  const caret = start + text.length;
  try {
    el.setSelectionRange(caret, caret);
  } catch {
    // ignore — some input types don't support selectionRange
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Attach to any of our own textareas to guarantee the spacebar always
 *  types a space, even on host pages that try to hijack it (see above). */
function guaranteeSpaceKeyWorks(el: HTMLTextAreaElement) {
  el.addEventListener("keydown", (e) => {
    if (e.key !== " " && e.code !== "Space") return;
    e.preventDefault();
    e.stopPropagation();
    insertTextAtCursor(el, " ");
  });
}


// ── Shared thinking-indicator markup (morphing sparkle + cycling word) ────
// Used by both the edge panel's chat view and the selection-toolbar result
// card's loading state, so the two vanilla-DOM surfaces match the popup/side
// panel's React ThinkingIndicator exactly.

function thinkingIndicatorHtml(words: string[]): string {
  const word = words[0] ?? "Thinking";
  const elapsed = "0.0s";
  const delays = [0, 90, 180, 90, 180, 270, 180, 270, 360];
  const cells = delays.map((delay, i) => `
    <span class="thinking-pixel ${i === 4 ? "center" : ""}" style="animation-delay: ${delay}ms;"></span>
  `).join("");
  return `
    <span class="thinking-grid" aria-hidden="true">${cells}</span>
    <span class="thinking-label" style="background-image: linear-gradient(90deg, #8b8b95 35%, #f2f2f5 50%, #8b8b95 65%); background-size: 200% 100%; animation: shimmer-text 1.4s linear infinite;">${escapeHtml(word)}</span>
    <span class="thinking-elapsed font-mono tabular-nums">${elapsed}</span>
  `;
}

/** Starts (or restarts) cycling the word inside a rendered thinking-indicator.
 *  Returns a stop function; call it once the indicator is removed/replaced. */
function startThinkingWordCycle(root: ParentNode, words: string[], intervalMs = 2600): () => void {
  if (words.length <= 1) return () => { };
  let index = 0;
  const timer = window.setInterval(() => {
    index = (index + 1) % words.length;
    const el = root.querySelector<HTMLElement>("[data-thinking-word]");
    if (!el) return;
    // Re-trigger the CSS enter animation on each word change by cloning the
    // node — simplest reliable way to restart a CSS animation from vanilla JS.
    const fresh = el.cloneNode(false) as HTMLElement;
    fresh.textContent = words[index];
    el.replaceWith(fresh);
  }, intervalMs);
  return () => window.clearInterval(timer);
}

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

function isWithinOwnUI(node: Node | null): boolean {
  let el = node instanceof Element ? node : node?.parentElement ?? null;
  while (el) {
    if (
      el.id === "ombre-ai-context-panel-host" ||
      el.id === "ombre-ai-selection-host" ||
      el.id === "ombre-ai-quick-tool-host"
    ) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

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
    // ignore
  }
}

let lastFocusedEditableEl: HTMLElement | null = null;

document.addEventListener("focusin", (e) => {
  const target = e.target as HTMLElement;
  if (!target) return;
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLInputElement ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  ) {
    if (!isWithinOwnUI(target)) {
      lastFocusedEditableEl = target;
    }
  }
});

function insertTextIntoActiveElement(text: string): boolean {
  let active: HTMLElement | null = document.activeElement as HTMLElement | null;
  if (!active || active === document.body || isWithinOwnUI(active)) {
    active = lastFocusedEditableEl;
  }
  if (!active) return false;

  if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) {
    const el = active;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    replaceInField(el, start, end, text);
    return true;
  }

  if (active.isContentEditable || active.getAttribute("role") === "textbox" || active.closest("[contenteditable='true']")) {
    const editable = active.isContentEditable ? active : (active.closest("[contenteditable='true']") as HTMLElement || active);
    editable.focus();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(range);
      editable.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }

    try {
      if (document.execCommand("insertText", false, text)) {
        editable.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      }
    } catch { }

    editable.textContent += text;
    editable.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  return false;
}

chrome.runtime.onMessage.addListener((message: ContextEvent | { type: string; text?: string }) => {
  if (message.type === "TOQAN_CONTEXT_RESPONSE") {
    const m = message as ContextEvent;
    renderPanel({ type: m.type as "TOQAN_CONTEXT_RESPONSE", query: m.query, response: m.response });
  } else if (message.type === "TOQAN_CONTEXT_ERROR") {
    const m = message as ContextEvent;
    renderPanel({ type: m.type as "TOQAN_CONTEXT_ERROR", error: m.error });
  } else if (message.type === "OMBRE_INSERT_NOTE" && "text" in message && message.text) {
    const ok = insertTextIntoActiveElement(message.text);
    if (ok) {
      showQuickToast("Note inserted into text field! ⚡");
    } else {
      showQuickToast("Copied note to clipboard!");
      void copyToClipboard(message.text);
    }
  }
});

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
function initSelectionPopup() {
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
    if (e.key === "-" && quickBarOpen) {
      e.preventDefault();
      if (dock) {
        const input = dock.querySelector("input") as HTMLInputElement;
if (input) {
        input.focus();
        input.value = "-";
      }
      }
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

const QUICK_TOOL_HOST_ID = "ombre-ai-quick-tool-host";

const QUICK_PEN_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
const QUICK_FILE_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
const QUICK_SEARCH_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
const QUICK_CHECK_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const QUICK_CLOSE_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
const QUICK_CORNER_SVG = `<svg class="result-corner" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>`;
const QUICK_COPY_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const QUICK_TRASH_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`;
const QUICK_PLUS_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;

const QUICK_CHEVRON_UP_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>`;

function initQuickTool() {
  if (window.self !== window.top) return;
  if (document.getElementById(QUICK_TOOL_HOST_ID)) return;

  const host = document.createElement("div");
  host.id = QUICK_TOOL_HOST_ID;
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: "Inter", system-ui, -apple-system, sans-serif; }

    .dock {
      position: fixed;
      bottom: 18px;
      left: 50%;
      transform: translateX(-50%) translateY(14px);
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: min(460px, calc(100vw - 48px));
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.22s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1);
    }
    .dock.peek, .dock.expanded {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
      pointer-events: auto;
    }

    /* Collapsed pill — flat dark launcher matching the expanded bar style */
    .pill {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 7px 8px 7px 14px;
      background: #121115;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
      animation: quick-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .pill:hover {
      transform: translateY(-2px);
      border-color: rgba(108, 99, 255, 0.45);
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
    }
    .pill:active { transform: scale(0.96); }
    .pill-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; }
    .pill-icon svg { width: 15px; height: 15px; stroke: #8b8b95; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .pill-label {
      font-size: 12.5px;
      font-weight: 500;
      color: #d1d0c5;
      letter-spacing: -0.01em;
    }
    .pill-send {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: #6c63ff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(108, 99, 255, 0.35);
      transition: transform 0.15s;
    }
    .pill:hover .pill-send { transform: scale(1.08); }
    .pill-send svg { width: 13px; height: 13px; stroke: #fff; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

    /* Expanded bar — flat dark row with a small label floating above */
    .bar-label {
      display: none;
      align-self: flex-start;
      padding-left: 2px;
      margin-bottom: 5px;
      font-size: 11px;
      font-weight: 500;
      color: #8b8b95;
    }
    .dock.expanded .bar-label { display: block; }

    .bar {
      display: none;
      width: 100%;
      background: #121115;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      box-shadow: 0 8px 24px -2px rgba(0, 0, 0, 0.3);
      transition: border-color 0.15s;
      animation: quick-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .bar.open { display: block; }
    .bar:focus-within { border-color: rgba(108, 99, 255, 0.45); }
    .bar-inner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 8px 9px 13px;
    }

    .bicon { width: 18px; height: 18px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .bicon svg { width: 16px; height: 16px; stroke: #8b8b95; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    .bar input {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: none;
      outline: none;
      color: #f2f2f5;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
    }
    .bar input::placeholder { color: #d1d0c5; }

    .send {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      border: none;
      border-radius: 999px;
      background: #6c63ff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s, opacity 0.15s, background 0.15s;
    }
    .send:hover { transform: scale(1.08); background: #7d75ff; }
    .send:active { transform: scale(0.92); }
    .send:disabled { opacity: 0.35; cursor: default; transform: none; }
    .send svg { width: 15px; height: 15px; stroke: #fff; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

    /* Search palette */
    .results {
      display: none;
      flex-direction: column;
      width: 100%;
      margin-bottom: 8px;
      background: rgba(28, 28, 32, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      box-shadow: 0 16px 36px rgba(0,0,0,0.5);
      max-height: 280px;
      padding: 6px;
      overflow-y: auto;
      animation: quick-in 0.18s cubic-bezier(0.16,1,0.3,1);
    }
    .results.open { display: flex; }
    .results-label {
      padding: 8px 10px 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #8b8b95;
    }
    .result-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      border: none;
      background: none;
      color: #f2f2f5;
      font-size: 12.5px;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
      border-radius: 10px;
      transition: background 0.12s, color 0.12s;
    }
    .result-item:hover, .result-item.sel { background: rgba(108,99,255,0.15); }
    .result-icon-box {
      width: 24px;
      height: 24px;
      border-radius: 7px;
      background: rgba(108,99,255,0.2);
      color: #a9a3ff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .result-item.is-content .result-icon-box {
      background: rgba(255,255,255,0.08);
      color: #8b8b95;
    }
    .result-icon-box svg { width: 13px; height: 13px; }
    .result-text { min-width: 0; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .result-corner { width: 12px; height: 12px; stroke: #a9a3ff; fill: none; opacity: 0; flex-shrink: 0; transition: opacity 0.12s; }
    .result-item.sel .result-corner { opacity: 1; }
    .results mark { background: rgba(108,99,255,0.35); color: #ffffff; border-radius: 3px; padding: 0 2px; }
    .results-empty {
      padding: 20px 12px;
      font-size: 12.5px;
      font-weight: 500;
      color: #8b8b95;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .results-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px 4px;
      border-top: 1px solid rgba(255,255,255,0.08);
      font-size: 10.5px;
      color: #8b8b95;
      margin-top: 4px;
    }
    .results-footer kbd {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 4px;
      padding: 1px 5px;
      font-family: inherit;
      font-size: 9.5px;
      font-weight: 500;
      margin-right: 3px;
      color: #e4e4e9;
    }

    /* Note preview card */
    .note-card {
      display: none;
      flex-direction: column;
      width: 100%;
      margin-bottom: 8px;
      background: rgba(23, 23, 26, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      box-shadow: 0 16px 36px rgba(0,0,0,0.5);
      max-height: 320px;
      overflow: hidden;
      animation: quick-in 0.2s cubic-bezier(0.16,1,0.3,1);
    }
    .note-card.open { display: flex; }
    .note-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
    .note-card-title { font-size: 13px; font-weight: 600; color: #f2f2f5; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .note-card-time { font-size: 10.5px; color: #8b8b95; flex-shrink: 0; }
    .note-card-actions { display: flex; align-items: center; gap: 4px; }
    .note-card-btn { cursor: pointer; background: none; border: none; color: #8b8b95; padding: 4px; border-radius: 6px; display: flex; flex-shrink: 0; transition: background 0.15s, color 0.15s; }
    .note-card-btn:hover { background: rgba(255,255,255,0.08); color: #f2f2f5; }
    .note-card-btn.apply-btn.primary {
      background: #6c63ff;
      color: #ffffff;
      padding: 3px 8px;
      font-size: 11.5px;
      font-weight: 600;
      gap: 4px;
      border-radius: 6px;
    }
    .note-card-btn.apply-btn.primary:hover { background: #7d75ff; }
    .note-card-btn.apply-btn.primary svg { opacity: 1; stroke: #fff; }
    .note-card-btn.delete:hover { background: rgba(242,85,90,0.15); color: #f2555a; }
    .note-card-btn svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }
    .note-card-body { padding: 12px; overflow-y: auto; font-size: 12.5px; line-height: 1.6; color: #e4e4e9; white-space: pre-wrap; }

    @keyframes quick-in {
      from { opacity: 0; transform: translateY(10px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .pill, .bar, .results, .note-card { animation: none !important; }
    }
  `;

  dock = document.createElement("div");
  dock.className = "dock";
  dock.innerHTML = `
    <div class="note-card" role="dialog" aria-label="Note">
      <div class="note-card-header">
        <span class="note-card-title"></span>
        <span class="note-card-time"></span>
        <div class="note-card-actions">
          <button class="note-card-btn apply-btn primary" aria-label="Apply note to active field" title="Insert note into active email / text field">${QUICK_CORNER_SVG} Apply</button>
          <button class="note-card-btn copy-btn" aria-label="Copy note text" title="Copy text">${QUICK_COPY_SVG}</button>
          <button class="note-card-btn delete-btn delete" aria-label="Delete note" title="Delete note">${QUICK_TRASH_SVG}</button>
          <button class="note-card-btn close-btn" aria-label="Close note" title="Close">${QUICK_CLOSE_SVG}</button>
        </div>
      </div>
      <div class="note-card-body"></div>
    </div>
    <div class="results" role="listbox" aria-label="Note search results"></div>
    <span class="bar-label">Ask Ombre Quick Notes</span>
    <div class="bar" role="form" aria-label="Quick notes">
      <div class="bar-inner">
        <span class="bicon search-icon" aria-hidden="true">${QUICK_SEARCH_SVG}</span>
        <input type="text" placeholder="Describe any changes you want to make..." aria-label="Save a note or type dash to search notes" />
        <button class="send" aria-label="Save note" title="Save note" disabled>${QUICK_CHEVRON_UP_SVG}</button>
      </div>
    </div>
    <button class="pill" aria-label="Open quick action tool" aria-expanded="false" title="Save a note or search notes ( - )">
      <span class="pill-icon">${QUICK_PLUS_SVG}</span>
      <span class="pill-label">Ask Ombre Quick Notes</span>
      <span class="pill-send">${QUICK_CHEVRON_UP_SVG}</span>
    </button>
  `;

  root.appendChild(style);
  root.appendChild(dock);

  const pillEl = dock.querySelector(".pill") as HTMLButtonElement;
  const barEl = dock.querySelector(".bar") as HTMLDivElement;
  const inputEl = dock.querySelector("input") as HTMLInputElement;
  const sendEl = dock.querySelector(".send") as HTMLButtonElement;
  const resultsEl = dock.querySelector(".results") as HTMLDivElement;
  const noteCardEl = dock.querySelector(".note-card") as HTMLDivElement;
  const applyBtn = noteCardEl.querySelector(".apply-btn") as HTMLButtonElement;
  const copyBtn = noteCardEl.querySelector(".copy-btn") as HTMLButtonElement;
  const deleteBtn = noteCardEl.querySelector(".delete-btn") as HTMLButtonElement;
  const closeCardBtn = noteCardEl.querySelector(".close-btn") as HTMLButtonElement;

  let notes: Note[] = [];
  let currentResults: Note[] = [];
  let selIndex = 0;
  let activeNote: Note | null = null;
  let savedTimer: number | undefined;
  let lastMouseY = window.innerHeight;
  const BOTTOM_REVEAL_PX = 100;
  let revealHideTimer: number | undefined;
  const isNearBottom = (y: number) => y > window.innerHeight - BOTTOM_REVEAL_PX;
  let quickNotesEnabledCache = true;

  const isOpen = () => barEl.classList.contains("open");
  const isSearching = () => inputEl.value.startsWith("-");

  function refreshNotes() {
    safeStorageGet([NOTES_KEY]).then((res) => {
      notes = (res[NOTES_KEY] as Note[]) || [];
      if (isSearching()) renderResults();
    });
  }

  function highlight(text: string, query: string): string {
    const escaped = escapeHtml(text);
    const q = escapeHtml(query).trim();
    if (!q) return escaped;
    return escaped.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (m) => `<mark>${m}</mark>`);
  }

  function paintSel() {
    resultsEl.querySelectorAll<HTMLButtonElement>(".result-item").forEach((btn) => {
      btn.classList.toggle("sel", Number(btn.dataset.index) === selIndex);
    });
  }

  function renderResults() {
    const searching = isSearching();
    barEl.classList.toggle("searching", searching);
    if (!searching) {
      resultsEl.classList.remove("open");
      currentResults = [];
      return;
    }
    const query = inputEl.value.slice(1);
    const matches = searchNotes(notes, query, 12);
    currentResults = matches.map((m) => m.note);
    selIndex = Math.min(selIndex, Math.max(0, currentResults.length - 1));

    if (currentResults.length === 0) {
      const q = query.trim();
      resultsEl.innerHTML = `<div class="results-empty">${QUICK_SEARCH_SVG}<span>${q ? `No notes match &quot;${escapeHtml(q)}&quot;` : "Type to search your notes"
        }</span></div>`;
      resultsEl.classList.add("open");
      return;
    }

    let html = "";
    let lastSection: boolean | null = null;
    matches.forEach((m, i) => {
      if (lastSection === null || m.matchedInTitle !== lastSection) {
        html += `<div class="results-label">${m.matchedInTitle ? "Notes" : "Content matches"}</div>`;
        lastSection = m.matchedInTitle;
      }
      const icon = m.matchedInTitle ? QUICK_PEN_SVG : QUICK_FILE_SVG;
      const text = m.matchedInTitle
        ? highlight(m.note.title, query)
        : highlight(notePreview(m.note, query), query);
      html += `<button class="result-item${m.matchedInTitle ? "" : " is-content"}${i === selIndex ? " sel" : ""}" data-index="${i}" role="option">
        <span class="result-icon-box">${icon}</span>
        <span class="result-text">${text}</span>
        ${QUICK_CORNER_SVG}
      </button>`;
    });
    html += `<div class="results-footer"><span><kbd>↵</kbd>Open</span><span><kbd>Shift+↵</kbd>Insert</span><span><kbd>Esc</kbd>Close</span></div>`;
    resultsEl.innerHTML = html;
    resultsEl.classList.add("open");
    paintSel();

    resultsEl.querySelectorAll<HTMLButtonElement>(".result-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const note = currentResults[Number(btn.dataset.index)];
        if (note) openResult(note);
      });
      btn.addEventListener("mouseenter", () => {
        selIndex = Number(btn.dataset.index);
        paintSel();
      });
    });
  }

  function relativeTime(ts: number): string {
    const min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return "Just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function openResult(note: Note) {
    activeNote = note;
    (noteCardEl.querySelector(".note-card-title") as HTMLElement).textContent = note.title;
    (noteCardEl.querySelector(".note-card-time") as HTMLElement).textContent = relativeTime(note.updatedAt);
    (noteCardEl.querySelector(".note-card-body") as HTMLElement).textContent = note.content;
    noteCardEl.classList.add("open");
    closeBar();
  }

  function saveQuickNote() {
    const text = inputEl.value.trim();
    if (!text) return;
    const note = createNote(text);
    notes = [note, ...notes];
    safeStorageSet({ [NOTES_KEY]: notes });
    inputEl.value = "";
    sendEl.disabled = true;
    barEl.classList.remove("searching");
    barEl.classList.add("saved");
    window.clearTimeout(savedTimer);
    savedTimer = window.setTimeout(() => barEl.classList.remove("saved"), 1400);
  }

  function openBar() {
    pillEl.style.display = "none";
    pillEl.setAttribute("aria-expanded", "true");
    dock!.classList.add("peek", "expanded");
    quickBarOpen = true;
    barEl.classList.add("open");
    refreshNotes();
    inputEl.focus();
  }

  function closeBar() {
    dock!.classList.remove("expanded");
    quickBarOpen = false;
    barEl.classList.remove("open", "searching", "saved");
    resultsEl.classList.remove("open");
    inputEl.value = "";
    sendEl.disabled = true;
    currentResults = [];
    pillEl.style.display = "flex";
    pillEl.setAttribute("aria-expanded", "false");
    // keep peek briefly then re-evaluate bottom proximity
    if (!isNearBottom(lastMouseY)) {
      dock!.classList.remove("peek");
    }
  }

  function submit() {
    if (isSearching()) {
      const note = currentResults[selIndex];
      if (note) openResult(note);
    } else {
      saveQuickNote();
    }
  }

  pillEl.addEventListener("click", openBar);
  inputEl.addEventListener("input", () => {
    sendEl.disabled = isSearching() ? currentResults.length === 0 : !inputEl.value.trim();
    selIndex = 0;
    renderResults();
  });
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && currentResults.length > 0) {
      e.preventDefault();
      selIndex = (selIndex + 1) % currentResults.length;
      paintSel();
    } else if (e.key === "ArrowUp" && currentResults.length > 0) {
      e.preventDefault();
      selIndex = (selIndex - 1 + currentResults.length) % currentResults.length;
      paintSel();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey && isSearching()) {
        const note = currentResults[selIndex];
        if (note) {
          const ok = insertTextIntoActiveElement(note.content);
          if (ok) {
            showQuickToast("Note inserted into text field! ⚡");
          } else {
            showQuickToast("Copied note to clipboard!");
            void copyToClipboard(note.content);
          }
          closeBar();
        }
      } else {
        submit();
      }
    }
  });
  sendEl.addEventListener("click", submit);

  closeCardBtn.addEventListener("click", () => {
    noteCardEl.classList.remove("open");
    activeNote = null;
  });

  applyBtn.addEventListener("click", () => {
    if (!activeNote) return;
    const ok = insertTextIntoActiveElement(activeNote.content);
    if (ok) {
      showQuickToast("Note inserted into text field! ⚡");
    } else {
      showQuickToast("Copied note to clipboard!");
      void copyToClipboard(activeNote.content);
    }
    noteCardEl.classList.remove("open");
    activeNote = null;
  });

  copyBtn.addEventListener("click", () => {
    if (!activeNote) return;
    void navigator.clipboard.writeText(activeNote.content);
    copyBtn.innerHTML = QUICK_CHECK_SVG;
    setTimeout(() => {
      copyBtn.innerHTML = QUICK_COPY_SVG;
    }, 1400);
  });

  deleteBtn.addEventListener("click", () => {
    if (!activeNote) return;
    notes = notes.filter((n) => n.id !== activeNote!.id);
    safeStorageSet({ [NOTES_KEY]: notes });
    noteCardEl.classList.remove("open");
    activeNote = null;
  });

  // Click anywhere outside the tool collapses everything back to the pill.
  document.addEventListener("mousedown", (e) => {
    if (!isOpen() && !noteCardEl.classList.contains("open")) return;
    if (e.composedPath().includes(host)) return;
    closeBar();
    noteCardEl.classList.remove("open");
    activeNote = null;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (noteCardEl.classList.contains("open")) {
      noteCardEl.classList.remove("open");
      activeNote = null;
    } else if (isOpen()) {
      closeBar();
    }
  });

  // ── Enable/disable via Settings (local storage) ─────────────────────────
  const applyQuickNotesEnabled = (enabled: boolean) => {
    quickNotesEnabledCache = enabled;
    if (!dock) return;
    if (enabled) {
      dock.style.display = "";
    } else {
      dock.style.display = "none";
      dock.classList.remove("peek", "expanded");
      quickBarOpen = false;
    }
  };
  try {
    chrome.storage?.local?.get(["toqan_settings"], (res) => {
      const s = (res as Record<string, unknown>)?.["toqan_settings"] as Record<string, unknown> | undefined;
      if (s && typeof s.quickNotesEnabled === "boolean") applyQuickNotesEnabled(s.quickNotesEnabled as boolean);
    });
  } catch {}
  try {
    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (area !== "local") return;
      const c = (changes as Record<string, chrome.storage.StorageChange>)["toqan_settings"];
      const nv = c?.newValue as Record<string, unknown> | undefined;
      if (nv && typeof nv.quickNotesEnabled === "boolean") applyQuickNotesEnabled(nv.quickNotesEnabled as boolean);
    });
  } catch {}

  // ── Fade-up reveal: show Ask Ombre Quick Notes when mouse nears bottom ──
  document.addEventListener("mousemove", (e) => {
    lastMouseY = e.clientY;
    if (!quickNotesEnabledCache || quickBarOpen) return;
    if (isNearBottom(e.clientY)) {
      window.clearTimeout(revealHideTimer);
      dock!.classList.add("peek");
    } else {
      const hoveringDock = dock!.matches(":hover");
      if (!hoveringDock) {
        window.clearTimeout(revealHideTimer);
        revealHideTimer = window.setTimeout(() => {
          if (!quickBarOpen && quickNotesEnabledCache && !dock!.matches(":hover") && !isNearBottom(lastMouseY)) {
            dock!.classList.remove("peek");
          }
        }, 320);
      }
    }
  });
  dock.addEventListener("mouseleave", () => {
    if (!quickNotesEnabledCache || quickBarOpen) return;
    window.clearTimeout(revealHideTimer);
    revealHideTimer = window.setTimeout(() => {
      if (!isNearBottom(lastMouseY)) dock!.classList.remove("peek");
    }, 320);
  });
  dock.addEventListener("mouseenter", () => {
    if (!quickNotesEnabledCache) return;
    window.clearTimeout(revealHideTimer);
    dock!.classList.add("peek");
  });

  onContextLost.push(() => {
    dock!.style.display = "none";
  });
}

// ── Side-panel launcher (opens the Chrome side panel chat) ────────────────
// Stand-in for the removed edge panel: a slim pill against the right edge of
// the page. Clicking it opens the extension's *Chrome side panel* — the chat
// lives in the browser chrome, not in an in-page overlay anymore.

const SIDEPANEL_LAUNCHER_HOST_ID = "ombre-ai-sidepanel-launcher-host";

function initSidePanelLauncher() {
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initSelectionPopup();
    initSidePanelLauncher();
    initQuickTool();
  });
} else {
  initSelectionPopup();
  initSidePanelLauncher();
  initQuickTool();
}
