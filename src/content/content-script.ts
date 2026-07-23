// content/index.ts — floating response panel for "Ask Ombre AI" context menu action.
// Runs in an isolated shadow root so host-page CSS can't leak in or out.

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
    chrome.storage.local.set(items).catch(() => {});
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

// Bridge so the text-selection popup (a separate shadow host) can open the
// edge panel with quoted text pre-filled, letting the user ask more there.
let edgePanelOpenWithText: ((text: string) => void) | null = null;

interface ContextEvent {
  type: "TOQAN_CONTEXT_RESPONSE" | "TOQAN_CONTEXT_ERROR";
  query?: string;
  response?: string;
  error?: string;
}

// Small (96x96) embedded avatar — kept inline as a data URI rather than a
// separate asset request, since this file runs on every page/frame and its
// footprint is a deliberate design constraint (see docs/Tech_Stack_Selection.md).
const OMBRE_AVATAR_DATA_URL = "data:image/png;base64,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";

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
      <div class="${error ? "answer error" : "answer"}">${
        error ? escapeHtml(error) : renderMarkdownLite(response || "")
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

// ── Shared thinking-indicator markup (morphing sparkle + cycling word) ────
// Used by both the edge panel's chat view and the selection-toolbar result
// card's loading state, so the two vanilla-DOM surfaces match the popup/side
// panel's React ThinkingIndicator exactly.
const THINKING_SPARKLE_SVG = `
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="thinking-grad" gradientUnits="userSpaceOnUse" x1="5" y1="4" x2="20" y2="20">
        <stop offset="0" stop-color="currentColor" stop-opacity="1" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0.4" />
      </linearGradient>
    </defs>
    <path class="thinking-glyph-main" d="M 12 3 C 12.9 7.4 16.6 11.1 21 12 C 16.6 12.9 12.9 16.6 12 21 C 11.1 16.6 7.4 12.9 3 12 C 7.4 11.1 11.1 7.4 12 3 Z" fill="url(#thinking-grad)" />
    <path class="thinking-glyph-twinkle" d="M 19 2.5 C 19.18 4.32 19.68 4.82 21.5 5 C 19.68 5.18 19.18 5.68 19 7.5 C 18.82 5.68 18.32 5.18 16.5 5 C 18.32 4.82 18.82 4.32 19 2.5 Z" fill="currentColor" />
  </svg>
`;

function thinkingIndicatorHtml(words: string[]): string {
  const word = words[0] ?? "";
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b), "");
  return `
    ${THINKING_SPARKLE_SVG}
    <span class="thinking-word-grid">
      <span class="invisible-word">${escapeHtml(longest)}</span>
      <span class="thinking-word" data-thinking-word>${escapeHtml(word)}</span>
    </span>
  `;
}

/** One-shot update of a rendered thinking-indicator's word (e.g. switching to
 *  "Retrying" mid-flight on overload), independent of any running cycle. */
function setThinkingWord(root: ParentNode, word: string) {
  const el = root.querySelector<HTMLElement>("[data-thinking-word]");
  if (!el) return;
  const fresh = el.cloneNode(false) as HTMLElement;
  fresh.textContent = word;
  el.replaceWith(fresh);
}

/** Starts (or restarts) cycling the word inside a rendered thinking-indicator.
 *  Returns a stop function; call it once the indicator is removed/replaced. */
function startThinkingWordCycle(root: ParentNode, words: string[], intervalMs = 2600): () => void {
  if (words.length <= 1) return () => {};
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

chrome.runtime.onMessage.addListener((message: ContextEvent | { type: string; text?: string }) => {
  if (message.type === "TOQAN_CONTEXT_RESPONSE") {
    const m = message as ContextEvent;
    renderPanel({ type: m.type as "TOQAN_CONTEXT_RESPONSE", query: m.query, response: m.response });
  } else if (message.type === "TOQAN_CONTEXT_ERROR") {
    const m = message as ContextEvent;
    renderPanel({ type: m.type as "TOQAN_CONTEXT_ERROR", error: m.error });
  } else if (message.type === "OMBRE_ADD_TO_CHAT" && "text" in message && message.text) {
    // Relayed from an iframe (e.g. Gmail's compose box) where the edge panel
    // doesn't live — only does anything in the top frame, where it does.
    edgePanelOpenWithText?.(message.text);
  }
});

// ── Edge-hover chat trigger + slide-in panel ─────────────────────────────
// A slim tab lives against the right edge of every page. Hovering (or
// tapping, on touch) reveals it fully; clicking slides the full chat panel
// in from the right. Reuses the same TOQAN_CHAT contract the popup/sidepanel
// use, so replies stream back through the background worker's `deliver()`.

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
  /** Thumbs up/down feedback the person gave on an assistant message. */
  rating?: "up" | "down";
}

interface EdgeConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMsg[];
}

const EDGE_HOST_ID = "ombre-ai-edge-panel-host";
const STORAGE_KEY = "toqan_edge_conversations";

function newEdgeId(): string {
  return `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleFrom(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || "New chat";
}

function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initEdgePanel() {
  // With all_frames enabled (needed so text selection works inside iframes
  // like Gmail's compose box), this file runs once per frame on the page.
  // The floating pill/chat panel should only ever exist once — in the
  // top-level page — not once per ad/tracker/embed iframe too.
  if (window.self !== window.top) return;
  if (document.getElementById(EDGE_HOST_ID)) return;

  const host = document.createElement("div");
  host.id = EDGE_HOST_ID;
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: "Inter", system-ui, -apple-system, sans-serif; }

    .pill {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translate(34px, -50%);
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      padding: 14px 9px;
      background: #17171a;
      border-radius: 26px 0 0 26px;
      box-shadow: -3px 0 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06);
      cursor: default;
      transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    .pill:hover, .pill.pinned { transform: translate(0, -50%); }

    .pill-open {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      background: #ffffff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .pill-open:hover { transform: scale(1.06); }
    .pill-open svg { width: 15px; height: 15px; fill: #111111; stroke: none; }

    .pill-settings {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: #f2f2f5;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #6b6b76;
      margin-top: 10px;
      transform: translate(6px, 2px);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: background 0.15s, color 0.15s;
    }
    .pill-settings:hover { background: #ffffff; color: #18181b; }
    .pill-settings svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2.25; stroke-linecap: round; stroke-linejoin: round; }

    .panel {
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      width: 380px;
      max-width: 92vw;
      background: #111111;
      color: #f2f2f5;
      border-left: 1px solid rgba(255,255,255,0.08);
      box-shadow: -12px 0 40px rgba(0,0,0,0.45);
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.32s cubic-bezier(0.16,1,0.3,1);
    }
    .panel.open { transform: translateX(0); }

    .header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .brand { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
    .brand .dot { width: 22px; height: 22px; border-radius: 7px; background: #6c63ff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
    .headerbtns { display: flex; align-items: center; gap: 2px; }
    .iconbtn { cursor: pointer; background: none; border: none; color: #8b8b95; padding: 6px; border-radius: 8px; display: flex; }
    .iconbtn:hover { background: rgba(255,255,255,0.08); color: #f2f2f5; }
    .iconbtn.active { background: rgba(108,99,255,0.15); color: #a9a3ff; }
    .iconbtn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }

    .body-wrap { position: relative; flex: 1; min-height: 0; display: flex; }
    .body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; }

    .jump-btn {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(255,255,255,0.1);
      background: #1c1c20;
      color: #f2f2f5;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      padding: 7px 12px;
      border-radius: 999px;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(0,0,0,0.35);
      transition: transform 0.15s;
    }
    .jump-btn:hover { transform: translateX(-50%) translateY(-1px); }
    .jump-btn svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .empty { margin: auto; text-align: center; color: #8b8b95; font-size: 13px; padding: 0 20px; }
    .empty .title { color: #f2f2f5; font-size: 15px; font-weight: 600; margin-bottom: 6px; }

    .row { display: flex; gap: 8px; }
    .row.user { flex-direction: row-reverse; }
    .avatar { width: 24px; height: 24px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
    .avatar.assistant { background: #17171a; }
    .avatar.user { background: #1e1e22; }
    .avatar svg { width: 12px; height: 12px; stroke: #fff; fill: none; stroke-width: 2; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .col { display: flex; flex-direction: column; gap: 4px; max-width: 78%; }
    .row.assistant .col { align-items: flex-start; }
    .row.user .col { align-items: flex-end; }
    .bubble { padding: 9px 12px; border-radius: 14px; font-size: 13.5px; line-height: 1.55; white-space: pre-wrap; }
    .bubble.assistant { background: #17171a; border-top-left-radius: 4px; white-space: normal; }
    .bubble.user { background: #6c63ff; color: #fff; border-top-right-radius: 4px; }
    .bubble.error { background: rgba(242,85,90,0.1); border: 1px solid rgba(242,85,90,0.4); color: #ff8a8f; white-space: pre-wrap; }
    .bubble p { margin: 0 0 6px; }
    .bubble p:last-child { margin-bottom: 0; }
    .bubble .md-gap { height: 2px; }
    .bubble ul, .bubble ol { margin: 2px 0 8px; padding-left: 18px; }
    .bubble li { margin-bottom: 3px; }
    .bubble strong { font-weight: 600; color: #fff; }
    .bubble code { background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 4px; font-size: 12px; color: #c9c4ff; }

    .msg-actions { display: flex; align-items: center; gap: 1px; padding-left: 2px; }
    .msg-copy, .msg-rate { width: 20px; height: 20px; border-radius: 5px; border: none; background: none; color: #75757e; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.12s, color 0.12s; }
    .msg-copy svg, .msg-rate svg { width: 11px; height: 11px; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
    .msg-copy:hover, .msg-rate:hover { background: rgba(255,255,255,0.08); color: #f2f2f5; }
    .msg-rate.active-up { color: #6c63ff; }
    .msg-rate.active-down { color: #ff8a8f; }

    .thinking { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #17171a; border-radius: 14px; border-top-left-radius: 4px; width: fit-content; color: #8b8b95; }

    .thinking-glyph-main {
      animation: thinking-morph 4s ease-in-out infinite, thinking-spin-scale 4s ease-in-out infinite;
      transform-box: view-box;
      transform-origin: center;
    }
    .thinking-glyph-twinkle {
      animation: thinking-twinkle 4s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    @keyframes thinking-morph {
      0%, 100% { d: path("M 12 3 C 12.9 7.4 16.6 11.1 21 12 C 16.6 12.9 12.9 16.6 12 21 C 11.1 16.6 7.4 12.9 3 12 C 7.4 11.1 11.1 7.4 12 3 Z"); }
      30%  { d: path("M 12 4.2 C 16.8 3.4 20.6 7.2 19.8 12 C 20.6 16.4 16.4 20.6 12 19.8 C 7.8 20.6 3.4 16.8 4.2 12 C 3.4 7.6 7.2 3.4 12 4.2 Z"); }
      50%  { d: path("M 12 5 C 15.87 5 19 8.13 19 12 C 19 15.87 15.87 19 12 19 C 8.13 19 5 15.87 5 12 C 5 8.13 8.13 5 12 5 Z"); }
      70%  { d: path("M 12 3.6 C 16.4 4.6 18.6 8 19.2 12 C 18.6 16.2 16.2 19.4 12 20.4 C 8 19.4 5.2 16.4 4.8 12 C 5.4 7.8 7.6 4.4 12 3.6 Z"); }
    }
    @keyframes thinking-spin-scale {
      0%, 100% { transform: rotate(0deg) scale(1); }
      30% { transform: rotate(108deg) scale(0.9); }
      50% { transform: rotate(180deg) scale(0.78); }
      70% { transform: rotate(252deg) scale(0.9); }
    }
    @keyframes thinking-twinkle {
      0%, 100% { opacity: 0; transform: rotate(0deg) scale(0.2); }
      30% { opacity: 0; transform: rotate(45deg) scale(0.5); }
      50% { opacity: 1; transform: rotate(90deg) scale(1); }
      70% { opacity: 0; transform: rotate(135deg) scale(0.5); }
    }
    .thinking-word-grid { display: inline-grid; overflow: hidden; font-size: 12.5px; }
    .thinking-word-grid > * { grid-column: 1; grid-row: 1; }
    .invisible-word { visibility: hidden; }
    .thinking-word {
      animation: thinking-word-in 0.32s cubic-bezier(0.4, 0, 0.2, 1), thinking-sheen 2s linear infinite;
      background-image: linear-gradient(90deg, transparent calc(50% - 16px), #f2f2f5, transparent calc(50% + 16px)), linear-gradient(#8b8b95, #8b8b95);
      background-repeat: no-repeat, padding-box;
      background-size: 250% 100%, auto;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
    }
    @keyframes thinking-word-in {
      from { opacity: 0; transform: translateY(70%); filter: blur(3px); background-position: 100% center, 0 0; }
      to   { opacity: 1; transform: translateY(0); filter: blur(0); background-position: 0% center, 0 0; }
    }
    @keyframes thinking-sheen {
      from { background-position: 0% center, 0 0; }
      to   { background-position: -200% center, 0 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .thinking-glyph-main, .thinking-glyph-twinkle, .thinking-word { animation: none !important; }
    }

    .history-list { display: flex; flex-direction: column; gap: 3px; }
    .history-empty { margin: auto; text-align: center; color: #8b8b95; font-size: 13px; padding: 0 20px; }
    .history-item { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 9px 10px; border-radius: 10px; cursor: pointer; }
    .history-item:hover { background: #1c1c20; }
    .history-item.active { background: #1c1c20; }
    .history-item-main { min-width: 0; flex: 1; }
    .history-item-title { font-size: 13px; color: #f2f2f5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .history-item-time { font-size: 11px; color: #8b8b95; margin-top: 1px; }
    .history-item-del { flex-shrink: 0; padding: 5px; border-radius: 7px; color: #6b6b76; background: none; border: none; cursor: pointer; opacity: 0; }
    .history-item:hover .history-item-del { opacity: 1; }
    .history-item-del:hover { background: rgba(242,85,90,0.15); color: #ff8a8f; }
    .history-item-del svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }

    .reload-banner { display: flex; align-items: center; gap: 7px; padding: 8px 12px; background: rgba(242,85,90,0.1); border-top: 1px solid rgba(242,85,90,0.25); color: #ff9da1; font-size: 11.5px; line-height: 1.4; }
    .reload-banner svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }

    .inputrow { border-top: 1px solid rgba(255,255,255,0.08); padding: 10px; }
    .input-gradient-ring { border-radius: 15px; padding: 1.5px; background: linear-gradient(90deg, #6c63ff, #d946ef, #6c63ff); box-shadow: 0 1px 2px rgba(0,0,0,0.2); transition: box-shadow 0.15s; }
    .input-gradient-ring:focus-within { box-shadow: 0 0 0 3px rgba(108,99,255,0.18); }
    .input-tip { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 10px; background: linear-gradient(90deg, rgba(108,99,255,0.16), rgba(217,70,239,0.09), rgba(108,99,255,0.16)); border-radius: 13.5px 13.5px 0 0; }
    .input-tip span { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; color: #b7b2ff; }
    .input-tip svg.tip-star { width: 12px; height: 12px; fill: #b7b2ff; stroke: none; flex-shrink: 0; }
    .input-tip-close { background: none; border: none; padding: 2px; border-radius: 999px; color: #9a94e0; cursor: pointer; display: flex; }
    .input-tip-close svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .input-tip-close:hover { color: #d4d1ff; }
    .inputbox { display: flex; align-items: flex-end; gap: 8px; background: #17171a; border-radius: 13.5px; padding: 6px 6px 6px 10px; }
    .input-gradient-ring:has(.input-tip) .inputbox { border-radius: 0 0 13.5px 13.5px; }
    textarea { flex: 1; resize: none; max-height: 120px; background: transparent; border: none; outline: none; color: #f2f2f5; font-size: 13.5px; line-height: 1.5; font-family: inherit; padding: 4px 0; }
    textarea::placeholder { color: #8b8b95; }
    .send { width: 30px; height: 30px; border-radius: 999px; background: linear-gradient(135deg, #6c63ff, #d946ef); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: transform 0.15s; box-shadow: 0 2px 6px rgba(108,99,255,0.35); }
    .send:hover { transform: scale(1.05); }
    .send:disabled { opacity: 0.3; cursor: default; transform: none; }
    .send svg { width: 15px; height: 15px; stroke: #fff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    .mic { width: 30px; height: 30px; border-radius: 999px; background: #26262b; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; color: #c8c8ce; transition: transform 0.15s, background 0.15s, color 0.15s; }
    .mic:hover { transform: scale(1.05); color: #fff; }
    .mic.listening { background: #f2555a; color: #fff; animation: mic-pulse 1.4s ease-in-out infinite; }
    .mic svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    @keyframes mic-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(242,85,90,0.45); } 50% { box-shadow: 0 0 0 6px rgba(242,85,90,0); } }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
  `;

  const pill = document.createElement("div");
  pill.className = "pill";
  pill.innerHTML = `
    <button class="pill-open" aria-label="Open Ombre AI chat" title="Open Ombre AI chat">
      <svg viewBox="0 0 24 24"><path d="M12 5.5 4 15h5v3.5h6V15h5L12 5.5z"/></svg>
    </button>
    <button class="pill-settings" aria-label="Settings" title="Settings">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
  `;

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="header">
      <div class="brand"><span class="dot">O</span> Ombre AI</div>
      <div class="headerbtns">
        <button class="iconbtn history" aria-label="Chat history" title="Chat history">
          <svg viewBox="0 0 24 24"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
        </button>
        <button class="iconbtn newchat" aria-label="New chat" title="New chat">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button class="iconbtn close" aria-label="Close" title="Close">
          <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
    <div class="body-wrap">
      <div class="body"></div>
      <button class="jump-btn" style="display:none;">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        <span class="jump-btn-label">Jump to latest</span>
      </button>
    </div>
    <div class="reload-banner" style="display:none;">
      <svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
      <span>${CONTEXT_INVALIDATED_MESSAGE}</span>
    </div>
    <div class="inputrow">
      <div class="input-gradient-ring">
        <div class="input-tip">
          <span>
            <svg class="tip-star" viewBox="0 0 24 24"><path d="M12 2.5c.4 2.7 1 4.4 2.3 5.7 1.3 1.3 3 1.9 5.7 2.3-2.7.4-4.4 1-5.7 2.3-1.3 1.3-1.9 3-2.3 5.7-.4-2.7-1-4.4-2.3-5.7-1.3-1.3-3-1.9-5.7-2.3 2.7-.4 4.4-1 5.7-2.3 1.3-1.3 1.9-3 2.3-5.7z"/></svg>
            Select text on any page to ask, improve, or rephrase it
          </span>
          <button class="input-tip-close" aria-label="Dismiss tip">
            <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="inputbox">
          <textarea rows="1" placeholder="Ask Ombre AI anything…"></textarea>
          <button class="mic" aria-label="Voice input" title="Voice input">
            <svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
          </button>
          <button class="send" aria-label="Send" title="Send">
            <svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  root.append(style, pill, panel);

  const bodyEl = panel.querySelector(".body") as HTMLDivElement;
  bodyEl.setAttribute("role", "log");
  bodyEl.setAttribute("aria-relevant", "additions");
  const jumpBtn = panel.querySelector(".jump-btn") as HTMLButtonElement;
  const jumpBtnLabel = panel.querySelector(".jump-btn-label") as HTMLSpanElement;
  const textarea = panel.querySelector("textarea") as HTMLTextAreaElement;
  const sendBtn = panel.querySelector(".send") as HTMLButtonElement;
  const micBtn = panel.querySelector(".mic") as HTMLButtonElement;
  const closeBtn = panel.querySelector(".close") as HTMLButtonElement;
  const historyBtn = panel.querySelector(".history") as HTMLButtonElement;
  const newChatBtn = panel.querySelector(".newchat") as HTMLButtonElement;
  const inputTip = panel.querySelector(".input-tip") as HTMLDivElement;
  const inputTipClose = panel.querySelector(".input-tip-close") as HTMLButtonElement;
  const inputBoxEl = panel.querySelector(".inputbox") as HTMLDivElement;

  inputTipClose.addEventListener("click", () => {
    inputTip.remove();
    inputBoxEl.style.borderRadius = "13.5px";
  });

  let conversations: EdgeConversation[] = [];
  let activeId: string | null = null;
  let isThinking = false;
  let showHistory = false;
  let isMicListening = false;
  let micStop: (() => void) | null = null;
  let stopEdgeThinkingCycle: (() => void) | null = null;

  // ── Sticky-to-bottom scrolling ────────────────────────────────────────
  // Mirrors the popup/side panel's behavior: auto-scroll new content only
  // while already at the bottom; the moment the person scrolls up, that's
  // a deliberate opt-out and a "Jump to latest" button appears instead of
  // yanking their place in the thread back down.
  const BOTTOM_THRESHOLD = 56;
  let isPinnedToBottom = true;

  function isAtBottom(): boolean {
    return bodyEl.scrollHeight - bodyEl.scrollTop - bodyEl.clientHeight < BOTTOM_THRESHOLD;
  }

  function setPinned(pinned: boolean) {
    isPinnedToBottom = pinned;
    jumpBtn.style.display = pinned ? "none" : "flex";
    if (pinned) jumpBtnLabel.textContent = "Jump to latest";
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    bodyEl.scrollTo({ top: bodyEl.scrollHeight, behavior });
    setPinned(true);
  }

  bodyEl.addEventListener("scroll", () => {
    const atBottom = isAtBottom();
    if (atBottom !== isPinnedToBottom) setPinned(atBottom);
  });

  jumpBtn.addEventListener("click", () => scrollToBottom());

  function activeConversation(): EdgeConversation | null {
    return conversations.find((c) => c.id === activeId) ?? null;
  }

  safeStorageGet([STORAGE_KEY]).then((res) => {
    conversations = (res[STORAGE_KEY] as EdgeConversation[]) || [];
    activeId = conversations[0]?.id ?? null;
    render();
  });

  function persist() {
    // Keep at most the 30 most recently updated conversations, 200 messages each.
    conversations.sort((a, b) => b.updatedAt - a.updatedAt);
    const trimmed = conversations.slice(0, 30).map((c) => ({ ...c, messages: c.messages.slice(-200) }));
    safeStorageSet({ [STORAGE_KEY]: trimmed });
  }

  // Starts a brand-new chat. The current one (if it has any messages) is left
  // exactly as-is in `conversations` — i.e. saved to history — never deleted.
  function startNewChat() {
    const current = activeConversation();
    if (current && current.messages.length === 0) {
      // Already sitting on an empty chat — nothing to save, just reuse it.
      showHistory = false;
      render();
      return;
    }
    const convo: EdgeConversation = {
      id: newEdgeId(),
      title: "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    conversations.unshift(convo);
    activeId = convo.id;
    showHistory = false;
    persist();
    render();
  }

  function ensureConversation(): EdgeConversation {
    const existing = activeConversation();
    if (existing) return existing;
    const convo: EdgeConversation = {
      id: newEdgeId(),
      title: "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    conversations.unshift(convo);
    activeId = convo.id;
    return convo;
  }

  function selectConversation(id: string) {
    activeId = id;
    showHistory = false;
    isThinking = false;
    render();
  }

  function deleteConversationById(id: string) {
    conversations = conversations.filter((c) => c.id !== id);
    if (activeId === id) activeId = conversations[0]?.id ?? null;
    persist();
    render();
  }

  function render() {
    if (showHistory) {
      historyBtn.classList.add("active");
      renderHistory();
    } else {
      historyBtn.classList.remove("active");
      renderChat();
    }
  }

  function renderHistory() {
    if (conversations.length === 0) {
      bodyEl.innerHTML = `<div class="history-empty">No past chats yet. Start one and it'll show up here.</div>`;
      return;
    }
    bodyEl.innerHTML = `<div class="history-list">${conversations
      .map(
        (c) => `
      <div class="history-item${c.id === activeId ? " active" : ""}" data-id="${c.id}">
        <div class="history-item-main">
          <div class="history-item-title">${escapeHtml(c.title)}</div>
          <div class="history-item-time">${relativeTime(c.updatedAt)} · ${c.messages.length} message${c.messages.length === 1 ? "" : "s"}</div>
        </div>
        <button class="history-item-del" data-id="${c.id}" aria-label="Delete chat" title="Delete chat">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
        </button>
      </div>`
      )
      .join("")}</div>`;

    bodyEl.querySelectorAll(".history-item").forEach((el) => {
      el.addEventListener("click", () => selectConversation((el as HTMLElement).dataset.id!));
    });
    bodyEl.querySelectorAll(".history-item-del").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteConversationById((el as HTMLElement).dataset.id!);
      });
    });
  }

  let lastRenderedConvoId: string | null = null;
  let lastRenderedMsgCount = 0;
  let lastRenderedLastId: string | null = null;

  function anchorRowNearTop(id: string) {
    const row = bodyEl.querySelector<HTMLElement>(`[data-msg-id="${id}"]`);
    if (!row) return;
    const delta = row.getBoundingClientRect().top - bodyEl.getBoundingClientRect().top - 12;
    bodyEl.scrollTo({ top: bodyEl.scrollTop + delta, behavior: "smooth" });
  }

  function renderChat() {
    const convo = activeConversation();
    const messages = convo?.messages ?? [];
    const convoId = convo?.id ?? null;

    bodyEl.setAttribute("aria-busy", String(isThinking));

    const wasPinned = isPinnedToBottom;
    const prevScrollTop = bodyEl.scrollTop;
    const conversationChanged = convoId !== lastRenderedConvoId;
    const newLast = messages[messages.length - 1];
    const lastChanged = !!newLast && newLast.id !== lastRenderedLastId;
    const isFreshUserTurn = lastChanged && !conversationChanged && newLast.role === "user";
    const contentGrew = !conversationChanged && messages.length > lastRenderedMsgCount;

    if (messages.length === 0 && !isThinking) {
      bodyEl.innerHTML = `<div class="empty"><div class="title">Ombre AI</div>Ask a question about this page, or anything else — right from here.</div>`;
      lastRenderedConvoId = convoId;
      lastRenderedMsgCount = 0;
      lastRenderedLastId = null;
      setPinned(true);
      return;
    }

    bodyEl.innerHTML = messages
      .map(
        (m) => `
      <div class="row ${m.role}" data-msg-id="${m.id}">
        <div class="avatar ${m.role}">
          ${
            m.role === "user"
              ? `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>`
              : `<img src="${OMBRE_AVATAR_DATA_URL}" alt="Ombre AI" />`
          }
        </div>
        <div class="col">
          <div class="bubble ${m.role}${m.error ? " error" : ""}">${
            m.role === "assistant" && !m.error ? renderMarkdownLite(m.content) : escapeHtml(m.content)
          }</div>
          ${
            m.role === "assistant" && !m.error
              ? `<div class="msg-actions">
                  <button class="msg-copy" data-copy-id="${m.id}" title="Copy">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                  <button class="msg-rate${m.rating === "up" ? " active-up" : ""}" data-rate-id="${m.id}" data-rate-value="up" title="Good response">
                    <svg viewBox="0 0 24 24" fill="${m.rating === "up" ? "currentColor" : "none"}"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                  </button>
                  <button class="msg-rate${m.rating === "down" ? " active-down" : ""}" data-rate-id="${m.id}" data-rate-value="down" title="Bad response">
                    <svg viewBox="0 0 24 24" fill="${m.rating === "down" ? "currentColor" : "none"}"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                  </button>
                </div>`
              : ""
          }
        </div>
      </div>`
      )
      .join("");

    bodyEl.querySelectorAll<HTMLButtonElement>("[data-copy-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.copyId!;
        const msg = activeConversation()?.messages.find((mm) => mm.id === id);
        if (!msg) return;
        copyToClipboard(stripMarkdownForCopy(msg.content)).then((ok) => {
          if (!ok) return;
          const original = btn.innerHTML;
          btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>`;
          setTimeout(() => {
            btn.innerHTML = original;
          }, 1300);
        });
      });
    });
    bodyEl.querySelectorAll<HTMLButtonElement>("[data-rate-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.rateId!;
        const value = btn.dataset.rateValue as "up" | "down";
        const convo = activeConversation();
        const msg = convo?.messages.find((mm) => mm.id === id);
        if (!convo || !msg) return;
        msg.rating = msg.rating === value ? undefined : value;
        persist();
        renderChat();
      });
    });

    if (isThinking) {
      bodyEl.innerHTML += `<div class="row assistant"><div class="avatar assistant"><img src="${OMBRE_AVATAR_DATA_URL}" alt="Ombre AI" /></div><div class="thinking">${thinkingIndicatorHtml(["Thinking", "Reasoning", "Considering"])}</div></div>`;
      stopEdgeThinkingCycle?.();
      stopEdgeThinkingCycle = startThinkingWordCycle(bodyEl, ["Thinking", "Reasoning", "Considering"]);
    } else {
      stopEdgeThinkingCycle?.();
      stopEdgeThinkingCycle = null;
    }

    lastRenderedConvoId = convoId;
    lastRenderedMsgCount = messages.length;
    lastRenderedLastId = newLast?.id ?? null;

    if (isFreshUserTurn) {
      // Turn-anchoring: settle the message the person just sent near the
      // top instead of snapping the whole thread to the bottom, so the
      // reply arrives already in view below it with context preserved above.
      requestAnimationFrame(() => anchorRowNearTop(newLast.id));
      setPinned(false);
    } else if (conversationChanged) {
      scrollToBottom("auto");
    } else if (wasPinned) {
      scrollToBottom("smooth");
    } else {
      // Not pinned — the person scrolled up on purpose. Restore exactly
      // where they were (innerHTML replacement resets scrollTop to 0) and
      // surface a "new message" affordance instead of yanking them down.
      bodyEl.scrollTop = prevScrollTop;
      if (contentGrew) {
        jumpBtnLabel.textContent = "New message";
        jumpBtn.style.display = "flex";
      }
    }
  }

  function autosize() {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }

  function send() {
    const text = textarea.value.trim();
    if (!text || isThinking) return;
    if (isMicListening) micStop?.();

    const convo = ensureConversation();
    const isFirstMessage = convo.messages.length === 0;
    convo.messages.push({ id: newEdgeId(), role: "user", content: text });
    convo.updatedAt = Date.now();
    if (isFirstMessage) convo.title = titleFrom(text);
    persist();

    showHistory = false;
    textarea.value = "";
    autosize();
    isThinking = true;
    render();

    const conversationId = convo.id;
    safeSendMessage({
      type: "TOQAN_CHAT",
      messages: convo.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: Date.now() })),
      conversationId,
    }).catch((err) => {
      const target = conversations.find((c) => c.id === conversationId);
      if (!target) return;
      if (target.id === activeId) isThinking = false;
      target.messages.push({ id: newEdgeId(), role: "assistant", content: (err as Error).message, error: true });
      target.updatedAt = Date.now();
      persist();
      render();
    });
  }

  chrome.runtime.onMessage.addListener((event: RuntimeChatEvent) => {
    if (!("conversationId" in event) || !event.conversationId) return;
    const target = conversations.find((c) => c.id === event.conversationId);
    if (!target) return;

    if (event.type === "TOQAN_REPLY") {
      if (target.id === activeId) isThinking = false;
      target.messages.push({ id: newEdgeId(), role: "assistant", content: event.reply ?? "" });
      target.updatedAt = Date.now();
      persist();
      if (target.id === activeId && !showHistory) render();
    } else if (event.type === "TOQAN_ERROR") {
      if (target.id === activeId) isThinking = false;
      target.messages.push({ id: newEdgeId(), role: "assistant", content: event.error ?? "Unknown error", error: true });
      target.updatedAt = Date.now();
      persist();
      if (target.id === activeId && !showHistory) render();
    } else if (event.type === "TOQAN_OVERLOADED" && target.id === activeId && !showHistory) {
      // Background is silently retrying — swap the word to "Retrying"
      // in place rather than a full re-render, so scroll position and
      // the rest of the thread are left completely undisturbed.
      stopEdgeThinkingCycle?.();
      stopEdgeThinkingCycle = null;
      setThinkingWord(bodyEl, "Retrying");
    }
  });

  textarea.addEventListener("input", autosize);
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  sendBtn.addEventListener("click", send);

  // ── Voice input (Web Speech API) ────────────────────────────────────────
  interface SpeechRecognitionLike {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start: () => void;
    stop: () => void;
  }
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const SpeechCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechCtor) {
    micBtn.style.display = "none";
  } else {
    const recognition = new SpeechCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    let baseValue = "";

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      const text = (final || interim).trim();
      if (!text) return;
      textarea.value = baseValue ? `${baseValue} ${text}` : text;
      if (final) baseValue = textarea.value;
      autosize();
    };
    recognition.onend = () => {
      isMicListening = false;
      micBtn.classList.remove("listening");
    };
    recognition.onerror = () => {
      isMicListening = false;
      micBtn.classList.remove("listening");
    };

    micStop = () => {
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
      isMicListening = false;
      micBtn.classList.remove("listening");
      baseValue = "";
    };

    micBtn.addEventListener("click", () => {
      if (isMicListening) {
        micStop?.();
      } else {
        baseValue = textarea.value;
        try {
          recognition.start();
          isMicListening = true;
          micBtn.classList.add("listening");
        } catch {
          // already started
        }
      }
    });
  }

  const openBtn = pill.querySelector(".pill-open") as HTMLButtonElement;
  const settingsBtn = pill.querySelector(".pill-settings") as HTMLButtonElement;

  openBtn.addEventListener("click", () => {
    panel.classList.add("open");
    pill.classList.add("pinned");
    setTimeout(() => textarea.focus(), 320);
  });
  settingsBtn.addEventListener("click", () => {
    safeSendMessage({ type: "OPEN_SETTINGS" });
  });
  newChatBtn.addEventListener("click", startNewChat);
  historyBtn.addEventListener("click", () => {
    showHistory = !showHistory;
    render();
  });
  closeBtn.addEventListener("click", () => {
    panel.classList.remove("open");
    pill.classList.remove("pinned");
  });

  // Lets the text-selection popup drop quoted text in here and hand off —
  // the user types their own question around it and sends when ready.
  edgePanelOpenWithText = (text: string) => {
    if (showHistory) {
      showHistory = false;
      render();
    }
    const quoted = `"${text}"\n\n`;
    textarea.value = textarea.value.trim() ? `${textarea.value}\n\n${quoted}` : quoted;
    autosize();
    panel.classList.add("open");
    pill.classList.add("pinned");
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }, 320);
  };

  const reloadBanner = panel.querySelector(".reload-banner") as HTMLDivElement;
  onContextLost.push(() => {
    reloadBanner.style.display = "flex";
    textarea.disabled = true;
    textarea.placeholder = "Refresh this page to keep chatting…";
    sendBtn.disabled = true;
    micBtn.style.display = "none";
    newChatBtn.disabled = true;
    historyBtn.disabled = true;
  });
}

interface RuntimeChatEvent {
  type: string;
  conversationId?: string;
  reply?: string;
  error?: string;
  message?: string;
}

// ── Text-selection popup ──────────────────────────────────────────────────
// Highlight any text on a page and a small toolbar appears above the
// selection: Ask Ombre AI, Improve, Rephrase, Add More. Each sends the
// selected text through the same TOQAN_CHAT pipeline the rest of the
// extension uses, then shows the result inline with Copy / Replace actions.

const SELECTION_HOST_ID = "ombre-ai-selection-host";

type SelectionAction = "ask" | "improve" | "rephrase" | "addmore";

const SELECTION_PROMPTS: Record<SelectionAction, (text: string) => string> = {
  ask: (text) => text,
  improve: (text) =>
    `Improve the writing quality, clarity, and flow of the following text. Return ONLY the improved text with no preamble, quotes, or explanation:\n\n${text}`,
  rephrase: (text) =>
    `Rephrase the following text in a different way while keeping the same meaning. Return ONLY the rephrased text with no preamble, quotes, or explanation:\n\n${text}`,
  addmore: (text) =>
    `Expand on the following text with more relevant detail, keeping the same tone and style. Return ONLY the expanded text with no preamble, quotes, or explanation:\n\n${text}`,
};

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
      padding: 5px;
      border-radius: 13px;
      background: #18181b;
      box-shadow: 0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07);
      opacity: 0;
      transform: translateY(6px) scale(0.97);
      transition: opacity 0.16s ease, transform 0.16s ease;
      pointer-events: none;
      overflow: visible;
    }
    .toolbar.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    .toolbar-badge {
      position: absolute;
      top: -12px;
      left: 12px;
      width: 25px;
      height: 25px;
      border-radius: 8px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      pointer-events: none;
    }
    .toolbar-badge svg { width: 13px; height: 13px; fill: #6c63ff; stroke: none; }

    .tbtn {
      display: flex;
      align-items: center;
      gap: 6px;
      border: none;
      background: transparent;
      color: #d4d4d8;
      font-size: 12.5px;
      font-weight: 500;
      padding: 7px 11px;
      border-radius: 9px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.12s, color 0.12s;
    }
    .tbtn:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .tbtn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }

    .tbtn.primary { background: #6c63ff; color: #fff; font-weight: 600; }
    .tbtn.primary:hover { background: #7d75ff; }
    .tbtn.primary svg { fill: #fff; stroke: none; }

    .card {
      position: fixed;
      z-index: 2147483647;
      width: 320px;
      max-height: 340px;
      display: flex;
      flex-direction: column;
      background: #111111;
      color: #f2f2f5;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.45);
      opacity: 0;
      transform: translateY(6px) scale(0.98);
      transition: opacity 0.18s ease, transform 0.18s ease;
      pointer-events: none;
      overflow: hidden;
    }
    .card.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 9px 11px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
    .card-brand { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; }
    .card-dot { width: 18px; height: 18px; border-radius: 6px; background: #6c63ff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
    .card-close { cursor: pointer; background: none; border: none; color: #8b8b95; padding: 4px; border-radius: 6px; display: flex; }
    .card-close:hover { background: rgba(255,255,255,0.08); color: #f2f2f5; }
    .card-close svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }

    .card-body { flex: 1; overflow-y: auto; padding: 11px; font-size: 12.5px; line-height: 1.6; }
    .card-body p { margin: 0 0 7px; }
    .card-body p:last-child { margin-bottom: 0; }
    .card-body ul, .card-body ol { margin: 3px 0 8px; padding-left: 17px; }
    .card-body li { margin-bottom: 3px; }
    .card-body strong { font-weight: 600; color: #fff; }
    .card-body code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 4px; font-size: 11.5px; color: #c9c4ff; }
    .card-body .error-text { color: #ff8a8f; }

    .addmore-preview { font-size: 12px; font-style: italic; color: #8b8b95; padding: 8px 9px; background: #17171a; border-radius: 8px; margin-bottom: 9px; max-height: 60px; overflow-y: auto; }
    .addmore-label { font-size: 11.5px; color: #8b8b95; margin: 0 0 6px; }
    .addmore-input { width: 100%; resize: none; background: #17171a; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #f2f2f5; font-size: 12.5px; font-family: inherit; padding: 7px 9px; outline: none; margin-bottom: 8px; }
    .addmore-input:focus { border-color: rgba(108,99,255,0.6); box-shadow: 0 0 0 3px rgba(108,99,255,0.15); }
    .addmore-submit { display: flex; align-items: center; justify-content: center; gap: 5px; width: 100%; border: none; background: #6c63ff; color: #fff; font-size: 12.5px; font-weight: 600; padding: 7px 8px; border-radius: 8px; cursor: pointer; transition: background 0.12s; }
    .addmore-submit:hover { background: #7d75ff; }
    .addmore-submit svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    .card-loading { display: flex; align-items: center; gap: 8px; padding: 2px 0; color: #8b8b95; }

    .thinking-glyph-main {
      animation: thinking-morph 4s ease-in-out infinite, thinking-spin-scale 4s ease-in-out infinite;
      transform-box: view-box;
      transform-origin: center;
    }
    .thinking-glyph-twinkle {
      animation: thinking-twinkle 4s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    @keyframes thinking-morph {
      0%, 100% { d: path("M 12 3 C 12.9 7.4 16.6 11.1 21 12 C 16.6 12.9 12.9 16.6 12 21 C 11.1 16.6 7.4 12.9 3 12 C 7.4 11.1 11.1 7.4 12 3 Z"); }
      30%  { d: path("M 12 4.2 C 16.8 3.4 20.6 7.2 19.8 12 C 20.6 16.4 16.4 20.6 12 19.8 C 7.8 20.6 3.4 16.8 4.2 12 C 3.4 7.6 7.2 3.4 12 4.2 Z"); }
      50%  { d: path("M 12 5 C 15.87 5 19 8.13 19 12 C 19 15.87 15.87 19 12 19 C 8.13 19 5 15.87 5 12 C 5 8.13 8.13 5 12 5 Z"); }
      70%  { d: path("M 12 3.6 C 16.4 4.6 18.6 8 19.2 12 C 18.6 16.2 16.2 19.4 12 20.4 C 8 19.4 5.2 16.4 4.8 12 C 5.4 7.8 7.6 4.4 12 3.6 Z"); }
    }
    @keyframes thinking-spin-scale {
      0%, 100% { transform: rotate(0deg) scale(1); }
      30% { transform: rotate(108deg) scale(0.9); }
      50% { transform: rotate(180deg) scale(0.78); }
      70% { transform: rotate(252deg) scale(0.9); }
    }
    @keyframes thinking-twinkle {
      0%, 100% { opacity: 0; transform: rotate(0deg) scale(0.2); }
      30% { opacity: 0; transform: rotate(45deg) scale(0.5); }
      50% { opacity: 1; transform: rotate(90deg) scale(1); }
      70% { opacity: 0; transform: rotate(135deg) scale(0.5); }
    }
    .thinking-word-grid { display: inline-grid; overflow: hidden; font-size: 12.5px; }
    .thinking-word-grid > * { grid-column: 1; grid-row: 1; }
    .invisible-word { visibility: hidden; }
    .thinking-word {
      animation: thinking-word-in 0.32s cubic-bezier(0.4, 0, 0.2, 1), thinking-sheen 2s linear infinite;
      background-image: linear-gradient(90deg, transparent calc(50% - 16px), #f2f2f5, transparent calc(50% + 16px)), linear-gradient(#8b8b95, #8b8b95);
      background-repeat: no-repeat, padding-box;
      background-size: 250% 100%, auto;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
    }
    @keyframes thinking-word-in {
      from { opacity: 0; transform: translateY(70%); filter: blur(3px); background-position: 100% center, 0 0; }
      to   { opacity: 1; transform: translateY(0); filter: blur(0); background-position: 0% center, 0 0; }
    }
    @keyframes thinking-sheen {
      from { background-position: 0% center, 0 0; }
      to   { background-position: -200% center, 0 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .thinking-glyph-main, .thinking-glyph-twinkle, .thinking-word { animation: none !important; }
    }

    .card-footer { display: flex; gap: 6px; padding: 9px 11px; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
    .card-action { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; border: none; background: #1c1c20; color: #e6e6ea; font-size: 12px; font-weight: 500; padding: 7px 8px; border-radius: 8px; cursor: pointer; transition: background 0.12s; }
    .card-action:disabled { cursor: default; opacity: 0.85; }
    .card-action:hover { background: #26262b; }
    .card-action.primary { background: #6c63ff; color: #fff; }
    .card-action.primary:hover { background: #7d75ff; }
    .card-action svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
  `;

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";
  toolbar.innerHTML = `
    <span class="toolbar-badge">
      <svg viewBox="0 0 24 24"><path d="M12 2.5c.4 2.7 1 4.4 2.3 5.7 1.3 1.3 3 1.9 5.7 2.3-2.7.4-4.4 1-5.7 2.3-1.3 1.3-1.9 3-2.3 5.7-.4-2.7-1-4.4-2.3-5.7-1.3-1.3-3-1.9-5.7-2.3 2.7-.4 4.4-1 5.7-2.3 1.3-1.3 1.9-3 2.3-5.7z"/></svg>
    </span>
    <button class="tbtn primary" data-action="ask">
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5c.4 2.7 1 4.4 2.3 5.7 1.3 1.3 3 1.9 5.7 2.3-2.7.4-4.4 1-5.7 2.3-1.3 1.3-1.9 3-2.3 5.7-.4-2.7-1-4.4-2.3-5.7-1.3-1.3-3-1.9-5.7-2.3 2.7-.4 4.4-1 5.7-2.3 1.3-1.3 1.9-3 2.3-5.7z"/></svg>
      Ask Ombre
    </button>
    <button class="tbtn" data-action="improve">
      <svg viewBox="0 0 24 24"><path d="M15 4V2m0 4V4m-4.5 3.5L9 6m1.5 1.5L9 9M4 15l11-11 3 3L7 18l-4 1 1-4z"/></svg>
      Improve
    </button>
    <button class="tbtn" data-action="rephrase">
      <svg viewBox="0 0 24 24"><path d="M17 2.1 21 6l-4 3.9M3 12v-2a4 4 0 0 1 4-4h14M7 21.9 3 18l4-3.9M21 12v2a4 4 0 0 1-4 4H3"/></svg>
      Rephrase
    </button>
    <button class="tbtn" data-action="addmore">
      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
      Add more
    </button>
    <button class="tbtn addchat" title="Send to chat panel to ask more there">
      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      Add to chat
    </button>
  `;

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-header">
      <div class="card-brand"><span class="card-dot">O</span> Ombre AI</div>
      <button class="card-close" aria-label="Close" title="Close">
        <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="card-body"></div>
    <div class="card-footer" style="display:none;"></div>
  `;

  root.append(style, toolbar, card);

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

  function hideToolbar() {
    toolbar.classList.remove("visible");
  }
  function hideCard() {
    card.classList.remove("visible");
    activeConversationId = null;
    stopCardThinkingCycle?.();
  }

  function isWithinOwnUI(node: Node | null): boolean {
    // Ignore selections that happen to land inside our own injected panels.
    let el = node instanceof Element ? node : node?.parentElement ?? null;
    while (el) {
      if (el.id === "ombre-ai-edge-panel-host" || el.id === "ombre-ai-context-panel-host" || el.id === SELECTION_HOST_ID) {
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

  // window.getSelection() never sees text selected *inside* a plain
  // <input>/<textarea> — that's a completely separate selection model based
  // on selectionStart/selectionEnd on the focused element itself. This is
  // why "select text you just typed" looked broken almost everywhere, not
  // just in Gmail's iframe.
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

    if (top < margin) top = rect.bottom + margin; // flip below if no room above
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
    toolbar.classList.add("visible");
    requestAnimationFrame(() => {
      positionAbove(toolbar, rect, toolbar.offsetWidth, toolbar.offsetHeight);
    });
  }

  function checkSelection() {
    if (contextLostFired || card.classList.contains("visible")) return; // don't reposition while viewing a result

    // 1) Plain <input>/<textarea> selection — checked first since a focused
    // field always wins over any stale page-text selection.
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

    // 2) Regular page text / contenteditable selection via the Selection API.
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
    // Small defer so getSelection()/selectionStart reflect the just-finished
    // selection gesture (mouse-drag, double-click, shift+arrow, etc).
    selTimer = window.setTimeout(checkSelection, 120);
  }

  // selectionchange covers most cases (including modern Chrome firing it for
  // input/textarea selections too), but mouseup/keyup make drag-to-select
  // and keyboard selection inside form fields reliable across the board.
  document.addEventListener("selectionchange", scheduleCheckSelection);
  document.addEventListener("mouseup", scheduleCheckSelection);
  document.addEventListener("keyup", (e) => {
    if (e.shiftKey || e.key === "Shift") scheduleCheckSelection();
  });

  document.addEventListener("mousedown", (e) => {
    if (isWithinOwnUI(e.target as Node)) return;
    hideToolbar();
    // Note: the result card is deliberately NOT closed here. Once Ask/
    // Improve/Rephrase/Add more has produced an answer, only the card's own
    // close (X) button dismisses it — clicking elsewhere on the page (to
    // read context, copy something else, etc.) no longer loses the answer.
  });
  window.addEventListener("scroll", hideToolbar, true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideToolbar();
      hideCard();
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
      ${
        lastIsEditable
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
  }

  function runAction(action: SelectionAction) {
    if (!lastSelectedText || contextLostFired) return;
    const rect = lastFieldEl ? lastFieldEl.getBoundingClientRect() : lastRange?.getBoundingClientRect();
    hideToolbar();

    card.classList.add("visible");
    requestAnimationFrame(() => {
      if (rect) positionAbove(card, rect, 320, action === "addmore" ? 210 : 200);
    });

    if (action === "addmore") {
      renderCardAddMoreInput();
      return;
    }
    sendSelectionPrompt(SELECTION_PROMPTS[action](lastSelectedText));
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

  const addChatBtn = toolbar.querySelector(".addchat") as HTMLButtonElement;
  addChatBtn.addEventListener("click", () => {
    if (contextLostFired || !lastSelectedText) return;
    hideToolbar();
    if (window.self === window.top && edgePanelOpenWithText) {
      // We're in the top frame and the edge panel lives right here — call it directly.
      edgePanelOpenWithText(lastSelectedText);
    } else {
      // We're inside an iframe (e.g. Gmail's compose box) where the edge
      // panel doesn't exist — ask the background worker to relay this to
      // the top frame, which does have it.
      safeSendMessage({ type: "OMBRE_ADD_TO_CHAT", text: lastSelectedText }).catch(() => {});
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initEdgePanel();
    initSelectionPopup();
  });
} else {
  initEdgePanel();
  initSelectionPopup();
}
