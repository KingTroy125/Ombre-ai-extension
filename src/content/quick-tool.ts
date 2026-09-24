import { NOTES_KEY, createNote, notePreview, searchNotes, type Note } from "../lib/notes";
import { onContextLost, safeStorageGet, safeStorageSet } from "./extension-context";
import { copyToClipboard, escapeHtml, insertTextIntoActiveElement, showQuickToast } from "./dom-utils";

let dock: HTMLDivElement | null = null;
let quickBarOpen = false;

const QUICK_TOOL_HOST_ID = "ombre-ai-quick-tool-host";

export const QUICK_PEN_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
const QUICK_FILE_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
const QUICK_SEARCH_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
const QUICK_CHECK_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const QUICK_CLOSE_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
const QUICK_CORNER_SVG = `<svg class="result-corner" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>`;
const QUICK_COPY_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const QUICK_TRASH_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`;
const QUICK_PLUS_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;

const QUICK_CHEVRON_UP_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>`;

export function initQuickTool() {
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

export function isQuickBarOpen(): boolean {
  return quickBarOpen;
}

export function focusQuickBarInput(): void {
  const input = dock?.querySelector<HTMLInputElement>("input");
  if (!input) return;
  input.focus();
  input.value = "-";
}
