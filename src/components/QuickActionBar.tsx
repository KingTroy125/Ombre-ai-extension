import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CornerDownLeft,
  FileText,
  NotebookPen,
  Plus,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { createNote, loadNotes, notePreview, saveNotes, searchNotes, type Note } from "../lib/notes";
import { Highlight } from "./Highlight";
import { cn } from "../lib/utils";

interface QuickActionBarProps {
  /** Opens a saved note (by id) — wired to the sidepanel's Notes page. */
  onOpenNote?: (id: string) => void;
}

/**
 * Standalone quick-action tool docked at the bottom center.
 * - Plain text + Enter saves a new note (quick capture, Keep-style).
 * - Typing "/" switches into search mode: a palette opens above the bar
 *   listing saved notes ("Notes" title matches + "Search results" body
 *   matches, with highlighted hits). Enter/click opens the note.
 * Fully independent of the chat — nothing here routes into the conversation.
 */
export function QuickActionBar({ onOpenNote }: QuickActionBarProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [sel, setSel] = useState(0);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedTimer = useRef<number | undefined>(undefined);

  const searchMode = value.startsWith("/");
  const query = searchMode ? value.slice(1) : "";
  const trimmedQuery = query.trim();

  const results = useMemo(
    () => (searchMode ? searchNotes(notes, trimmedQuery, 12) : []),
    [searchMode, notes, trimmedQuery]
  );

  useEffect(() => {
    if (open) {
      void loadNotes().then(setNotes);
      inputRef.current?.focus();
    } else {
      setValue("");
      setSel(0);
    }
  }, [open]);

  // Keep the highlighted result clamped as the result list changes.
  useEffect(() => {
    setSel((s) => Math.min(s, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  const flashSaved = () => {
    setJustSaved(true);
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setJustSaved(false), 1400);
  };

  const saveNote = () => {
    const text = value.trim();
    if (!text) return;
    const note = createNote(text);
    const next = [note, ...notes];
    setNotes(next);
    void saveNotes(next);
    setValue("");
    flashSaved();
  };

  const openResult = (note: Note) => {
    onOpenNote?.(note.id);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault();
      setSel((s) => (s + 1) % results.length);
      return;
    }
    if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault();
      setSel((s) => (s - 1 + results.length) % results.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchMode) {
        const hit = results[sel];
        if (hit) openResult(hit.note);
      } else {
        saveNote();
      }
    }
  };

  return (
    <div className="pointer-events-none flex justify-center pb-2.5">
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 480, damping: 34 }}
            className="pointer-events-auto flex w-[min(460px,calc(100vw-48px))] flex-col"
          >
            {/* Search palette — opens upward, docked above the bar */}
            {searchMode && (
              <div className="mb-2 max-h-[280px] overflow-y-auto rounded-2xl border border-border/80 bg-popover/95 p-2 shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-md">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <Search size={20} className="mb-1.5 text-muted-foreground/60" />
                    <p className="text-[12.5px] font-medium">
                      {trimmedQuery ? `No notes match "${trimmedQuery}"` : "Type to search your saved notes"}
                    </p>
                  </div>
                ) : (
                  results.map((r, i) => {
                    const sectionChanged = i === 0 || r.matchedInTitle !== results[i - 1].matchedInTitle;
                    return (
                      <Fragment key={r.note.id}>
                        {sectionChanged && (
                          <div className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                            {r.matchedInTitle ? "Notes" : "Content matches"}
                          </div>
                        )}
                        <button
                          onClick={() => openResult(r.note)}
                          onMouseEnter={() => setSel(i)}
                          className={cn(
                            "focus-ring group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12.5px] text-foreground transition-all",
                            i === sel ? "bg-primary/15 text-foreground shadow-sm" : "hover:bg-secondary/70"
                          )}
                        >
                          {r.matchedInTitle ? (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                              <NotebookPen size={13} className="feather" />
                            </div>
                          ) : (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                              <FileText size={13} className="feather" />
                            </div>
                          )}
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {r.matchedInTitle ? (
                              <Highlight text={r.note.title} query={trimmedQuery} />
                            ) : (
                              <Highlight text={notePreview(r.note, trimmedQuery)} query={trimmedQuery} />
                            )}
                          </span>
                          <CornerDownLeft
                            size={12}
                            className={cn(
                              "feather shrink-0 transition-opacity",
                              i === sel ? "opacity-100 text-primary" : "opacity-0"
                            )}
                          />
                        </button>
                      </Fragment>
                    );
                  })
                )}
                {results.length > 0 && (
                  <div className="mt-2 flex items-center justify-between border-t border-border/60 px-2.5 pt-2 text-[10.5px] text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-border/70 bg-secondary/80 px-1 py-0.5 font-mono text-[9.5px] font-medium text-foreground">↵</kbd> Open
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-border/70 bg-secondary/80 px-1 py-0.5 font-mono text-[9.5px] font-medium text-foreground">↑↓</kbd> Select
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border/70 bg-secondary/80 px-1 py-0.5 font-mono text-[9.5px] font-medium text-foreground">Esc</kbd> Close
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Gradient-ringed input bar */}
            <div className="rounded-[16px] bg-gradient-to-r from-primary via-fuchsia-400 to-primary p-[1.5px] shadow-[0_12px_28px_-4px_rgba(0,0,0,0.45)] transition-shadow focus-within:shadow-[0_0_0_3px_rgba(108,99,255,0.25),0_12px_28px_-4px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-2.5 rounded-[14.5px] bg-card/95 px-3 py-2 backdrop-blur-md">
                {/* Mode Indicator Pill */}
                {justSaved ? (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-400 shadow-sm animate-in fade-in">
                    <Check size={12} strokeWidth={2.5} className="feather" /> Saved!
                  </span>
                ) : searchMode ? (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/15 px-2.5 py-1 text-[11.5px] font-semibold text-fuchsia-400 shadow-sm">
                    <Sparkles size={12} className="feather" /> Search
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-[11.5px] font-semibold text-primary shadow-sm">
                    <NotebookPen size={12} className="feather" /> Note
                  </span>
                )}

                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchMode ? "Search saved notes…" : "Save a quick note, or type / to search…"}
                  aria-label={searchMode ? "Search notes" : "Save a note"}
                  className="min-w-0 max-w-[375px] flex-1 bg-transparent text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  title="Close quick action bar"
                  className="focus-ring flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X size={13} />
                </button>

                {/* Action Submit Button */}
                <button
                  type="button"
                  onClick={() => (searchMode && results[sel] ? openResult(results[sel].note) : saveNote())}
                  disabled={searchMode ? results.length === 0 : !value.trim()}
                  title={searchMode ? "Open selected note" : "Save note"}
                  aria-label={searchMode ? "Open selected note" : "Save note"}
                  className="focus-ring flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary via-purple-500 to-fuchsia-500 text-white shadow-md shadow-primary/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                >
                  {searchMode ? <ArrowRight size={13} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="pill"
            type="button"
            onClick={() => setOpen(true)}
            title="Quick Action — Save a note or search ( / )"
            aria-label="Open quick-action tool"
            aria-expanded={false}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 520, damping: 32 }}
            className="focus-ring group pointer-events-auto block cursor-pointer rounded-full bg-gradient-to-r from-primary via-fuchsia-400 to-primary p-[1.5px] shadow-[0_4px_14px_rgba(0,0,0,0.4)] transition-shadow hover:shadow-[0_0_0_3px_rgba(108,99,255,0.2),0_8px_22px_rgba(0,0,0,0.5)]"
          >
            <span className="flex items-center gap-2 rounded-full bg-card/95 px-3.5 py-1.5 backdrop-blur-md transition-colors group-hover:bg-secondary/90">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-white shadow-sm shadow-primary/30 transition-transform group-hover:scale-110">
                <Zap size={11} className="fill-current" />
              </span>
              <span className="text-[12px] font-semibold text-foreground/90 tracking-tight">Quick Action</span>
              <kbd className="flex h-4 min-w-[16px] items-center justify-center rounded border border-white/15 bg-white/10 px-1 font-mono text-[10px] font-medium text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                /
              </kbd>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
