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
    .close { cursor: pointer; background: none; border: none; color: #8b8b95; font-size: 16px; line-height: 1; padding: 4px; border-radius: 6px; }
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
      <button class="close" aria-label="Close">✕</button>
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
      background: #6c63ff;
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
      background: #6c63ff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #000000;
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

    .body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
    .empty { margin: auto; text-align: center; color: #8b8b95; font-size: 13px; padding: 0 20px; }
    .empty .title { color: #f2f2f5; font-size: 15px; font-weight: 600; margin-bottom: 6px; }

    .row { display: flex; gap: 8px; }
    .row.user { flex-direction: row-reverse; }
    .avatar { width: 24px; height: 24px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .avatar.assistant { background: #6c63ff; }
    .avatar.user { background: #1e1e22; }
    .avatar svg { width: 12px; height: 12px; stroke: #fff; fill: none; stroke-width: 2; }
    .bubble { max-width: 78%; padding: 9px 12px; border-radius: 14px; font-size: 13.5px; line-height: 1.55; white-space: pre-wrap; }
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

    .thinking { display: flex; gap: 4px; padding: 10px 12px; background: #17171a; border-radius: 14px; border-top-left-radius: 4px; width: fit-content; }
    .thinking span { width: 5px; height: 5px; border-radius: 999px; background: #8b8b95; animation: pulse 1.4s ease-in-out infinite; }
    .thinking span:nth-child(2) { animation-delay: 0.15s; }
    .thinking span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes pulse { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

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
    .inputbox { display: flex; align-items: flex-end; gap: 8px; background: #17171a; border: 1px solid rgba(255,255,255,0.09); border-radius: 14px; padding: 6px 6px 6px 10px; }
    .inputbox:focus-within { border-color: rgba(108,99,255,0.6); box-shadow: 0 0 0 3px rgba(108,99,255,0.15); }
    textarea { flex: 1; resize: none; max-height: 120px; background: transparent; border: none; outline: none; color: #f2f2f5; font-size: 13.5px; line-height: 1.5; font-family: inherit; padding: 4px 0; }
    textarea::placeholder { color: #8b8b95; }
    .send { width: 30px; height: 30px; border-radius: 999px; background: #6c63ff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: transform 0.15s; }
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
    <div class="body"></div>
    <div class="reload-banner" style="display:none;">
      <svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
      <span>${CONTEXT_INVALIDATED_MESSAGE}</span>
    </div>
    <div class="inputrow">
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
  `;

  root.append(style, pill, panel);

  const bodyEl = panel.querySelector(".body") as HTMLDivElement;
  const textarea = panel.querySelector("textarea") as HTMLTextAreaElement;
  const sendBtn = panel.querySelector(".send") as HTMLButtonElement;
  const micBtn = panel.querySelector(".mic") as HTMLButtonElement;
  const closeBtn = panel.querySelector(".close") as HTMLButtonElement;
  const historyBtn = panel.querySelector(".history") as HTMLButtonElement;
  const newChatBtn = panel.querySelector(".newchat") as HTMLButtonElement;

  let conversations: EdgeConversation[] = [];
  let activeId: string | null = null;
  let isThinking = false;
  let showHistory = false;
  let isMicListening = false;
  let micStop: (() => void) | null = null;

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

  function renderChat() {
    const convo = activeConversation();
    const messages = convo?.messages ?? [];

    if (messages.length === 0 && !isThinking) {
      bodyEl.innerHTML = `<div class="empty"><div class="title">Ombre AI</div>Ask a question about this page, or anything else — right from here.</div>`;
      return;
    }
    bodyEl.innerHTML = messages
      .map(
        (m) => `
      <div class="row ${m.role}">
        <div class="avatar ${m.role}">
          ${
            m.role === "user"
              ? `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>`
              : `<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg>`
          }
        </div>
        <div class="bubble ${m.role}${m.error ? " error" : ""}">${
          m.role === "assistant" && !m.error ? renderMarkdownLite(m.content) : escapeHtml(m.content)
        }</div>
      </div>`
      )
      .join("");
    if (isThinking) {
      bodyEl.innerHTML += `<div class="row assistant"><div class="avatar assistant"><svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg></div><div class="thinking"><span></span><span></span><span></span></div></div>`;
    }
    bodyEl.scrollTo({ top: bodyEl.scrollHeight, behavior: "smooth" });
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
    }
    // TOQAN_OVERLOADED: background is silently retrying — keep the thinking indicator up.
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
      align-items: stretch;
      padding: 4px;
      border-radius: 13px;
      background: #1c1c1f;
      box-shadow: 0 10px 28px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
      opacity: 0;
      transform: translateY(6px) scale(0.97);
      transition: opacity 0.16s ease, transform 0.16s ease;
      pointer-events: none;
    }
    .toolbar.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    .tbtn {
      display: flex;
      align-items: center;
      gap: 6px;
      border: none;
      background: transparent;
      color: #e4e4e7;
      font-size: 12.5px;
      font-weight: 500;
      padding: 6px 10px 6px 6px;
      border-radius: 9px;
      cursor: pointer;
      white-space: nowrap;
      position: relative;
      transition: background 0.12s;
    }
    .tbtn:hover { background: rgba(255,255,255,0.08); }
    .tbtn + .tbtn::before {
      content: "";
      position: absolute;
      left: -2px;
      top: 20%;
      height: 60%;
      width: 1px;
      background: rgba(255,255,255,0.1);
    }
    .tbtn:hover + .tbtn::before, .tbtn:hover::before { background: transparent; }

    .ticon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 6px;
      flex-shrink: 0;
    }
    .ticon.c-ask { background: linear-gradient(135deg, #6c63ff, #8b5cf6); }
    .ticon.c-improve { background: #f5a524; }
    .ticon.c-rephrase { background: #3b82f6; }
    .ticon.c-addmore { background: #22c55e; }
    .ticon.c-chat { background: #ec4899; }
    .ticon svg { width: 11px; height: 11px; stroke: #fff; fill: none; stroke-width: 2.25; stroke-linecap: round; stroke-linejoin: round; }

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

    .card-loading { display: flex; gap: 4px; align-items: center; padding: 2px 0; }
    .card-loading span { width: 5px; height: 5px; border-radius: 999px; background: #8b8b95; animation: sel-pulse 1.4s ease-in-out infinite; }
    .card-loading span:nth-child(2) { animation-delay: 0.15s; }
    .card-loading span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes sel-pulse { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

    .card-footer { display: flex; gap: 6px; padding: 9px 11px; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
    .card-action { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; border: none; background: #1c1c20; color: #e6e6ea; font-size: 12px; font-weight: 500; padding: 7px 8px; border-radius: 8px; cursor: pointer; transition: background 0.12s; }
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
    <button class="tbtn" data-action="ask">
      <span class="ticon c-ask"><svg viewBox="0 0 24 24"><path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.5-6.5-2.1 2.1M8.6 15.4l-2.1 2.1m11-2.1 2.1 2.1M8.6 8.6 6.5 6.5"/></svg></span>
      Ask Ombre
    </button>
    <button class="tbtn" data-action="improve">
      Improve
    </button>
    <button class="tbtn" data-action="rephrase">
      Rephrase
    </button>
    <button class="tbtn" data-action="addmore">
      Add more
    </button>
    <button class="tbtn addchat" title="Send to chat panel to ask more there">
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
    hideCard();
  });
  window.addEventListener("scroll", hideToolbar, true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideToolbar();
      hideCard();
    }
  });

  cardCloseBtn.addEventListener("click", hideCard);

  function renderCardLoading() {
    cardBody.innerHTML = `<div class="card-loading"><span></span><span></span><span></span></div>`;
    cardFooter.style.display = "none";
  }

  function renderCardResult(text: string, isError: boolean) {
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
    cardFooter.querySelector('[data-act="copy"]')?.addEventListener("click", () => {
      navigator.clipboard.writeText(text).catch(() => {});
    });
    cardFooter.querySelector('[data-act="replace"]')?.addEventListener("click", () => {
      if (lastFieldEl) {
        replaceInField(lastFieldEl, lastFieldStart, lastFieldEnd, text);
      } else if (lastRange) {
        try {
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(lastRange);
          document.execCommand("insertText", false, text);
        } catch {
          navigator.clipboard.writeText(text).catch(() => {});
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
    }
    // TOQAN_OVERLOADED: keep the loading state up while the background retries.
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
