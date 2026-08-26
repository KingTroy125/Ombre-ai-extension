import { useEffect, useState } from "react";
import { Check, Copy, CornerDownLeft, NotebookPen, Plus, Search, Trash2, X } from "lucide-react";
import { createNote, loadNotes, noteTitleFrom, saveNotes, searchNotes, type Note } from "../lib/notes";
import { Highlight } from "./Highlight";

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

interface NotesProps {
  /** When set, the page refreshes and opens that note in the editor. */
  focusNoteId: string | null;
  onClearFocus: () => void;
}

/** Keep-style notes page — create, edit, and delete notes. Saved notes are
 *  searchable from the quick-action tool (type "/") on any page. */
export function Notes({ focusNoteId, onClearFocus }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [quickText, setQuickText] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  useEffect(() => {
    void loadNotes().then((n) => {
      setNotes(n);
      setLoaded(true);
    });
  }, []);

  // A note was opened from the quick-action tool (or added from a page) —
  // reload and drop into its editor.
  useEffect(() => {
    if (!focusNoteId) return;
    void loadNotes().then((n) => {
      setNotes(n);
      const target = n.find((x) => x.id === focusNoteId);
      if (target) {
        setEditingId(target.id);
        setDraftTitle(target.title);
        setDraft(target.content);
      }
      onClearFocus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNoteId]);

  const persist = (next: Note[]) => {
    setNotes(next);
    void saveNotes(next);
  };

  const startNew = () => {
    const note = createNote("");
    persist([note, ...notes]);
    setEditingId(note.id);
    setDraft("");
    setDraftTitle("");
  };

  const handleQuickAdd = () => {
    const text = quickText.trim();
    if (!text) return;
    const note = createNote(text, quickTitle.trim() || undefined);
    persist([note, ...notes]);
    setQuickText("");
    setQuickTitle("");
  };

  const handleCopyNote = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(note.content);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 1400);
  };

  const handleApplyNote = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "OMBRE_INSERT_NOTE", text: note.content });
    }
    setAppliedId(note.id);
    setTimeout(() => setAppliedId(null), 1400);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setDraft(note.content);
    setDraftTitle(note.title);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const text = draft.trim();
    const customTitle = draftTitle.trim();
    if (!text) {
      persist(notes.filter((n) => n.id !== editingId));
    } else {
      const title = customTitle || noteTitleFrom(text);
      persist(notes.map((n) => (n.id === editingId ? { ...n, content: text, title, updatedAt: Date.now() } : n)));
    }
    setEditingId(null);
    setDraft("");
    setDraftTitle("");
  };

  const remove = (id: string) => persist(notes.filter((n) => n.id !== id));

  const cancelEdit = (note: Note) => {
    setEditingId(null);
    setDraft("");
    setDraftTitle("");
    // Discarding a brand-new empty note removes it.
    if (!draft.trim() && note.content === "") persist(notes.filter((n) => n.id !== note.id));
  };

  const results = searchNotes(notes, query, 100);
  const visible = query.trim() ? results.map((r) => r.note) : notes;

  if (!loaded) {
    return <div className="p-6 text-[13px] text-muted-foreground">Loading notes…</div>;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        <h1 className="text-[16px] font-semibold text-foreground">Notes</h1>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Save notes here, or apply them anytime to an email or text field on any webpage.
        </p>
      </div>

      {/* Quick Note Capture Bar */}
      <div className="rounded-xl border border-border/80 bg-gradient-to-r from-primary/10 via-fuchsia-500/5 to-primary/10 p-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Title…"
            className="w-32 shrink-0 rounded-md bg-background/60 px-2 py-1.5 text-[11.5px] font-semibold text-foreground/80 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <input
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleQuickAdd();
              }
            }}
            placeholder="Type a note and press Enter…"
            className="min-w-0 flex-1 rounded-md bg-background/60 px-2.5 py-1.5 text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={handleQuickAdd}
            disabled={!quickText.trim()}
            className="focus-ring flex h-8 shrink-0 items-center gap-1 rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 px-3 text-[11.5px] font-semibold text-primary-foreground shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          >
            <Plus size={13} className="feather" />
            Add
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="feather absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="focus-ring w-full rounded-lg border border-input bg-card py-2 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={startNew}
          className="focus-ring flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:bg-secondary/80"
        >
          <Plus size={14} className="feather" />
          Full editor
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
            <NotebookPen size={20} className="feather text-primary" />
          </div>
          <p className="text-[13px] text-muted-foreground">
            {query.trim() ? "No notes match your search." : "No notes yet — quick capture above."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visible.map((note) =>
            note.id === editingId ? (
              <div key={note.id} className="col-span-2 flex flex-col gap-3 rounded-xl border border-primary/50 bg-card p-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Title</label>
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Leave blank to use the first line…"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-[13px] font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Note</label>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        saveEdit();
                      }
                    }}
                    autoFocus
                    rows={6}
                    placeholder="Write a note…"
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-[12.5px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10.5px] text-muted-foreground">⌘/Ctrl + ↵ to save</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => cancelEdit(note)}
                      className="focus-ring flex h-7 items-center gap-1 rounded-md px-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      title="Cancel"
                    >
                      <X size={13} className="feather" />
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      className="focus-ring flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-[11.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      title="Save note"
                    >
                      <Check size={12} className="feather" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={note.id}
                onClick={() => startEdit(note)}
                className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-border bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="line-clamp-1 text-[12.5px] font-medium text-foreground">
                    <Highlight text={note.title} query={query} />
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => handleApplyNote(e, note)}
                      className="rounded-md p-0.5 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                      title={appliedId === note.id ? "Applied to page!" : "Apply note to active field on page"}
                    >
                      {appliedId === note.id ? <Check size={12} className="feather text-emerald-400" /> : <CornerDownLeft size={12} className="feather" />}
                    </button>
                    <button
                      onClick={(e) => handleCopyNote(e, note)}
                      className="rounded-md p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title={copiedId === note.id ? "Copied!" : "Copy note"}
                    >
                      {copiedId === note.id ? <Check size={12} className="feather text-emerald-400" /> : <Copy size={12} className="feather" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(note.id);
                      }}
                      className="rounded-md p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                      title="Delete note"
                    >
                      <Trash2 size={12} className="feather" />
                    </button>
                  </div>
                </div>
                <p className="line-clamp-4 whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted-foreground">
                  <Highlight text={note.content} query={query} />
                </p>
                <span className="mt-auto pt-1.5 text-[10px] text-muted-foreground/70">{relativeTime(note.updatedAt)}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
