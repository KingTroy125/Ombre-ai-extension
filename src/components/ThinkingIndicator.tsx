import { useEffect, useId, useState } from "react";
import { cn } from "../lib/utils";

const SPARKLE =
  "M 12 3 C 12.9 7.4 16.6 11.1 21 12 C 16.6 12.9 12.9 16.6 12 21 C 11.1 16.6 7.4 12.9 3 12 C 7.4 11.1 11.1 7.4 12 3 Z";
const TWINKLE =
  "M 19 2.5 C 19.18 4.32 19.68 4.82 21.5 5 C 19.68 5.18 19.18 5.68 19 7.5 C 18.82 5.68 18.32 5.18 16.5 5 C 18.32 4.82 18.82 4.32 19 2.5 Z";

interface ThinkingIndicatorProps {
  /** Status words cycled through while visible, e.g. ["Thinking", "Reasoning"].
   *  Pass a single word (or a single-item array) to pin the label without cycling. */
  words: string[];
  /** Milliseconds each word stays on screen before cycling. */
  interval?: number;
  className?: string;
}

/**
 * A small morphing sparkle glyph + a status word that cycles and cross-fades
 * as it changes. Pure CSS animation (see .thinking-* rules in globals.css) —
 * no animation library needed since this only ever runs in Chrome.
 */
export function ThinkingIndicator({ words, interval = 2600, className }: ThinkingIndicatorProps) {
  const [index, setIndex] = useState(0);
  const gradientId = useId();

  useEffect(() => {
    setIndex(0);
    if (words.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [words, interval]);

  const word = words.length > 0 ? words[index % words.length] : "";
  const longestWord = words.reduce((a, b) => (a.length >= b.length ? a : b), "");

  return (
    <div role="status" className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      {words.length > 0 && <span className="sr-only">{words[0]}…</span>}
      <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="5" y1="4" x2="20" y2="20">
            <stop offset="0" stopColor="currentColor" stopOpacity="1" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path className="thinking-glyph-main" d={SPARKLE} fill={`url(#${gradientId})`} />
        <path className="thinking-glyph-twinkle" d={TWINKLE} fill="currentColor" />
      </svg>
      {words.length > 0 && (
        <span aria-hidden="true" className="thinking-word-grid text-[13px]">
          <span className="invisible">{longestWord}</span>
          <span key={word} className="thinking-word">
            {word}
          </span>
        </span>
      )}
    </div>
  );
}
