// Shared notes model — used by the sidepanel Notes page and the quick-action
// tool (sidepanel + content script). Storage lives in chrome.storage.local so
// notes saved from any page show up everywhere.

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export const NOTES_KEY = "ombre_notes";

const hasChromeStorage = typeof chrome !== "undefined" && !!chrome.storage?.local;

export async function loadNotes(): Promise<Note[]> {
  if (hasChromeStorage) {
    try {
      const res = await chrome.storage.local.get([NOTES_KEY]);
      return (res[NOTES_KEY] as Note[]) || [];
    } catch {
      return [];
    }
  }
  // Dev fallback outside the extension shell.
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]") as Note[];
  } catch {
    return [];
  }
}

export async function saveNotes(notes: Note[]): Promise<void> {
  if (hasChromeStorage) {
    try {
      await chrome.storage.local.set({ [NOTES_KEY]: notes });
    } catch {
      // context died — nothing more we can do
    }
    return;
  }
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function newNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Title = first line of the content, trimmed and clamped. */
export function noteTitleFrom(content: string): string {
  const firstLine = content.trim().split("\n")[0].trim();
  if (!firstLine) return "Untitled note";
  return firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine;
}

export function createNote(content: string, customTitle?: string): Note {
  const now = Date.now();
  const trimmedContent = content.trim();
  const title = customTitle && customTitle.trim() ? customTitle.trim() : noteTitleFrom(trimmedContent);
  return { id: newNoteId(), title, content: trimmedContent, createdAt: now, updatedAt: now };
}

export interface NoteSearchResult {
  note: Note;
  /** true = the query matched the title; false = it matched the body text. */
  matchedInTitle: boolean;
}

/** Title matches first, then body-text matches — mirroring the palette UI's
 *  "Notes" / "Search results" sections. Empty query → most recent notes. */
export function searchNotes(notes: Note[], query: string, limit = 20): NoteSearchResult[] {
  const q = query.trim().toLowerCase();
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  if (!q) return sorted.slice(0, limit).map((note) => ({ note, matchedInTitle: true }));

  const exactTitleMatches: NoteSearchResult[] = [];
  const partialTitleMatches: NoteSearchResult[] = [];
  const contentMatches: NoteSearchResult[] = [];

  const queryWords = q.split(/\s+/).filter(Boolean);

  for (const note of sorted) {
    const titleLower = note.title.toLowerCase();
    const contentLower = note.content.toLowerCase();

    if (titleLower.includes(q)) {
      exactTitleMatches.push({ note, matchedInTitle: true });
    } else if (queryWords.length > 0 && queryWords.every((w) => titleLower.includes(w))) {
      partialTitleMatches.push({ note, matchedInTitle: true });
    } else if (contentLower.includes(q) || (queryWords.length > 0 && queryWords.every((w) => contentLower.includes(w)))) {
      contentMatches.push({ note, matchedInTitle: false });
    }
  }
  return [...exactTitleMatches, ...partialTitleMatches, ...contentMatches].slice(0, limit);
}

/** First line containing the query (for result previews), else the opening lines. */
export function notePreview(note: Note, query: string, maxChars = 90): string {
  const q = query.trim().toLowerCase();
  if (q) {
    const line = note.content.split("\n").find((l) => l.toLowerCase().includes(q));
    if (line) {
      const idx = line.toLowerCase().indexOf(q);
      const start = Math.max(0, idx - 30);
      return (start > 0 ? "…" : "") + line.slice(start, start + maxChars);
    }
  }
  const flat = note.content.replace(/\s+/g, " ").trim();
  return flat.length > maxChars ? `${flat.slice(0, maxChars)}…` : flat;
}
