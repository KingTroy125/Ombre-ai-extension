import { useEffect, useState } from "react";

type StreamingToken = { text: string; cite?: boolean };

type StreamingSource = {
  name: string;
  domain: string;
  href: string;
  image: string;
};

type StreamingLabels = {
  sources: string;
  followUps: string;
};

const DEFAULT_LABELS: StreamingLabels = {
  sources: "10 sources",
  followUps: "Follow-ups",
};

const WORD_MS = 55;
const HOLD_MS = 3400;

function SourceChip({ source }: { source?: StreamingSource }) {
  if (!source) return null;
  return (
    <a
      href={source.href}
      target="_blank"
      rel="noreferrer"
      className="ml-0 mr-1 inline-flex h-4.5 translate-y-[-1px] items-center gap-1 rounded-[5px] bg-primary/10 pr-1.5 pl-1.5 align-middle font-mono text-[10.5px] text-primary shadow-sm transition-colors duration-150 hover:bg-primary/20 hover:text-primary"
      style={{ animation: "pop-in 250ms cubic-bezier(0.23,1,0.32,1) both" }}
    >
      <img src={source.image} alt="" className="size-3 rounded-[3px]" />
      <span>{source.domain}</span>
    </a>
  );
}

interface StreamingTextProps {
  content: StreamingToken[];
  sources?: StreamingSource[];
  followUps?: string[];
  labels?: Partial<StreamingLabels>;
  loop?: boolean;
  onDone?: () => void;
  onFollowUp?: (text: string, index: number) => void;
  onCopy?: () => void;
  onRetry?: () => void;
  onRate?: (rating: "up" | "down") => void;
}

export function StreamingText({
  content,
  sources = [],
  followUps = [],
  labels,
  loop = false,
  onDone,
  onFollowUp,
  onCopy,
  onRetry,
  onRate,
}: StreamingTextProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const [count, setCount] = useState(0);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const done = count >= content.length;

  useEffect(() => {
    if (done) {
      if (!loop) {
        onDone?.();
        return;
      }
      const t = setTimeout(() => setCount(0), HOLD_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c + 1), WORD_MS);
    return () => clearTimeout(t);
  }, [count, done, loop, onDone]);

  const handleAction = (action: string) => {
    switch (action) {
      case "copy":
        onCopy?.();
        break;
      case "retry":
        onRetry?.();
        break;
      case "up":
        onRate?.("up");
        break;
      case "down":
        onRate?.("down");
        break;
    }
  };

  return (
    <div className="text-[13px] leading-relaxed text-foreground">
      <p className="text-[13px] leading-relaxed text-foreground">
        {content.slice(0, count).map((token, i) =>
          token.cite ? (
            <SourceChip key={i} source={sources[0]} />
          ) : (
            <span key={i} className="inline">
              {token.text}{" "}
            </span>
          ),
        )}
        {!done && (
          <span
            className="ml-0.5 inline-block h-3 w-0.5 translate-y-0.5 rounded-full bg-primary"
            style={{ animation: "fade-in 150ms ease-out both" }}
          />
        )}
      </p>

      {/* action icons row */}
      <div
        className="mt-2 flex items-center gap-0.5 transition-opacity duration-400"
        style={{ opacity: done ? 1 : 0, pointerEvents: done ? "auto" : "none" }}
      >
        <button
          type="button"
          aria-label="Copy"
          onClick={() => handleAction("copy")}
          className="focus-ring flex size-6 items-center justify-center rounded-[6px] text-muted-foreground transition-colors duration-100 hover:bg-primary/10 hover:text-foreground"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="12" height="12" rx="2.5" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Retry"
          onClick={() => handleAction("retry")}
          className="focus-ring flex size-6 items-center justify-center rounded-[6px] text-muted-foreground transition-colors duration-100 hover:bg-primary/10 hover:text-foreground"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Good response"
          onClick={() => handleAction("up")}
          className="focus-ring flex size-6 items-center justify-center rounded-[6px] text-muted-foreground transition-colors duration-100 hover:bg-primary/10 hover:text-foreground"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Bad response"
          onClick={() => handleAction("down")}
          className="focus-ring flex size-6 items-center justify-center rounded-[6px] text-muted-foreground transition-colors duration-100 hover:bg-primary/10 hover:text-foreground"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88z" />
          </svg>
        </button>
        <button
          type="button"
          aria-expanded={sourcesOpen}
          onClick={() => setSourcesOpen((current) => !current)}
          className="ml-1.5 flex items-center gap-1.5 rounded-[6px] px-1 py-0.5 text-left transition-colors duration-150 hover:bg-primary/10 hover:text-foreground"
        >
          <span className="flex -space-x-1">
            {sources.map((source) => (
              <img
                key={source.domain}
                src={source.image}
                alt=""
                className="size-3.5 rounded-full bg-surface shadow-[0_0_0_1.5px_var(--border)]"
              />
            ))}
          </span>
          <span className="text-[12px] text-muted-foreground">{l.sources}</span>
        </button>
      </div>

      {/* sources list */}
      <div
        className="overflow-hidden transition-[height,opacity] duration-300"
        style={{
          height: done && sourcesOpen ? "auto" : 0,
          opacity: done && sourcesOpen ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="mt-1.5 flex flex-col rounded-[10px] bg-primary/5 p-1 shadow-sm">
          {sources.map((source) => (
            <a
              key={source.domain}
              href={source.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-[6px] px-1.5 py-1 text-[12px] text-muted-foreground transition-colors duration-150 hover:bg-primary/10 hover:text-foreground"
            >
              <img src={source.image} alt="" className="size-4 rounded-[4px]" />
              <span className="animated-underline">{source.name}</span>
              <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">{source.domain}</span>
            </a>
          ))}
        </div>
      </div>

      {/* follow-ups */}
      <div
        className="mt-2.5 transition-opacity duration-400"
        style={{ opacity: done ? 1 : 0, pointerEvents: done ? "auto" : "none" }}
      >
        <p className="text-[12px] font-medium text-muted-foreground">{l.followUps}</p>
        <div className="mt-0.5 flex flex-col">
          {followUps.map((text, i) => (
            <button
              key={text}
              onClick={() => onFollowUp?.(text, i)}
              className="-mx-1.5 flex items-center gap-2 rounded-[7px] border-b border-border px-1.5 py-1.5 text-left text-[12.5px] text-foreground transition-colors duration-100 hover:bg-primary/5"
              style={{
                animation: done ? `fade-up 350ms cubic-bezier(0.23,1,0.32,1) ${i * 90}ms both` : "none",
                opacity: done ? 1 : 0,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M9 10l-5 5 5 5" />
                <path d="M20 4v7a4 4 0 0 1-4 4H4" />
              </svg>
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}