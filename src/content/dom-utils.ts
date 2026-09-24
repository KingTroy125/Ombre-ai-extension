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

export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Lightweight markdown → HTML for the vanilla-DOM panels (popup/sidepanel use
// full react-markdown; these shadow-DOM panels can't, so this covers what the
// Toqan API actually sends back: bold/italic/inline-code, bullet and numbered
// lists, and paragraph breaks. Input is escaped first, so this stays safe.
export function renderMarkdownLite(raw: string): string {
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
export function stripMarkdownForCopy(raw: string): string {
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
export async function copyToClipboard(value: string): Promise<boolean> {
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
export function guaranteeSpaceKeyWorks(el: HTMLTextAreaElement) {
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

export function thinkingIndicatorHtml(words: string[]): string {
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
export function startThinkingWordCycle(root: ParentNode, words: string[], intervalMs = 2600): () => void {
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

export function showQuickToast(msg: string) {
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

export function isWithinOwnUI(node: Node | null): boolean {
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

export function insertTextIntoActiveElement(text: string): boolean {
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
