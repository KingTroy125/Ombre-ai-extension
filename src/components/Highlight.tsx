import type { ReactNode } from "react";

/** Wraps every case-insensitive occurrence of `query` in `text` with a
 *  <mark> highlight — the palette-style match highlighting. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const parts: ReactNode[] = [];
  let i = 0;
  let idx;
  let key = 0;

  while ((idx = lower.indexOf(ql, i)) !== -1) {
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={key++} className="rounded-[3px] bg-primary/30 px-0.5 text-foreground">
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  if (i < text.length) parts.push(text.slice(i));
  return <>{parts}</>;
}
