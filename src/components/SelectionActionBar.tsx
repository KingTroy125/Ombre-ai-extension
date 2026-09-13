import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowUp,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Languages,
  Loader2,
  Pencil,
  Scissors,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────── */

export type SelectionAction = {
  id: string;
  icon: ReactNode;
  label: string;
  prompt?: string;
  busyLabel?: string;
};

export type SelectionActionBarProps = {
  /** The selected text being acted on. */
  selectedText: string;
  /** Actions shown inline. */
  primaryActions?: SelectionAction[];
  /** Actions revealed on expand. */
  moreActions?: SelectionAction[];
  /** Called when an action fires. Receives the prompt string. */
  onAction: (prompt: string) => void;
  /** Called when the user dismisses the bar. */
  onDismiss: () => void;
  /** Current mode driven by the parent. */
  mode?: "idle" | "thinking" | "result";
  /** The AI-generated result text (shown in result mode). */
  resultText?: string;
  /** Called when the user clicks Keep. */
  onKeep?: () => void;
  /** Called when the user clicks Discard. */
  onDiscard?: () => void;
  /** Called when the user clicks Retry. */
  onRetry?: () => void;
  /** Called when the user clicks Copy. */
  onCopy?: (text: string) => void;
  /** Called when the user clicks Save Note. */
  onSaveNote?: (text: string) => void;
  /** Position anchor: top-left corner relative to viewport. */
  anchor: { x: number; y: number };
};

/* ── Defaults ─────────────────────────────────────────── */

const DEFAULT_PRIMARY: SelectionAction[] = [
  { id: "improve", icon: <Wand2 size={13} />, label: "Improve", prompt: "Improve", busyLabel: "Improving" },
  { id: "shorten", icon: <Scissors size={13} />, label: "Shorten", prompt: "Make shorter", busyLabel: "Shortening" },
];

const DEFAULT_MORE: SelectionAction[] = [
  { id: "explain", icon: <Sparkles size={13} />, label: "Explain", prompt: "Explain this", busyLabel: "Explaining" },
  { id: "grammar", icon: <Languages size={13} />, label: "Grammar", prompt: "Fix grammar", busyLabel: "Fixing grammar" },
  { id: "rephrase", icon: <Pencil size={13} />, label: "Rephrase", prompt: "Rephrase", busyLabel: "Rephrasing" },
];

/* ── Helpers ──────────────────────────────────────────── */

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

function buildPrompt(action: SelectionAction, text: string): string {
  if (action.prompt) {
    return `${action.prompt} the following text. Return ONLY the rewritten text with no preamble, quotes, or explanation:\n\n${text}`;
  }
  return text;
}

/* ── Component ────────────────────────────────────────── */

export function SelectionActionBar({
  selectedText,
  primaryActions = DEFAULT_PRIMARY,
  moreActions = DEFAULT_MORE,
  onAction,
  onDismiss,
  mode: controlledMode,
  resultText,
  onKeep,
  onDiscard,
  onRetry,
  onCopy,
  onSaveNote,
  anchor,
}: SelectionActionBarProps) {
  const [internalMode, setInternalMode] = useState<"idle" | "thinking" | "result">("idle");
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [visible, setVisible] = useState(false);

  const barRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastWidthRef = useRef(0);
  const widthAnimRef = useRef<Animation | null>(null);

  const mode = controlledMode ?? internalMode;
  const busy = mode === "thinking";
  const hasPrompt = prompt.trim().length > 0;

  // Entrance animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (expanded && inputRef.current) inputRef.current.focus();
  }, [expanded]);

  // Animate width on mode change
  useLayoutEffect(() => {
    const bar = barRef.current;
    const content = contentRef.current;
    if (!bar || !content) return;

    const nextWidth = Math.ceil(content.getBoundingClientRect().width) + 8;
    const prevWidth = lastWidthRef.current || Math.ceil(bar.getBoundingClientRect().width);

    if (Math.abs(nextWidth - prevWidth) > 1) {
      widthAnimRef.current?.cancel();
      const anim = bar.animate(
        [{ width: `${prevWidth}px` }, { width: `${nextWidth}px` }],
        { duration: 280, easing: EASING }
      );
      widthAnimRef.current = anim;
      anim.onfinish = () => {
        lastWidthRef.current = nextWidth;
        widthAnimRef.current = null;
      };
    } else {
      lastWidthRef.current = nextWidth;
    }
  }, [mode, expanded, hasPrompt]);

  const run = useCallback(
    (action: SelectionAction) => {
      setInternalMode("thinking");
      onAction(buildPrompt(action, selectedText));
    },
    [onAction, selectedText]
  );

  const runCustom = useCallback(() => {
    const text = prompt.trim();
    if (!text) return;
    setInternalMode("thinking");
    setPrompt("");
    setExpanded(false);
    onAction(`${text} the following text. Return ONLY the rewritten text with no preamble, quotes, or explanation:\n\n${selectedText}`);
  }, [prompt, onAction, selectedText]);

  const reset = useCallback(() => {
    setInternalMode("idle");
    setExpanded(false);
    setPrompt("");
  }, []);

  const busyLabel = useCallback(() => {
    const all = [...primaryActions, ...moreActions];
    for (const a of all) {
      if (a.busyLabel) return a.busyLabel;
    }
    return "Editing";
  }, [primaryActions, moreActions]);

  return (
    <div
      className="pointer-events-auto"
      style={{
        position: "fixed",
        left: anchor.x,
        top: anchor.y,
        zIndex: 2147483647,
        transform: `translateX(-50%) translateY(${visible ? 0 : 6}px)`,
        opacity: visible ? 1 : 0,
        transition: `transform 280ms ${EASING}, opacity 200ms ease-out`,
        willChange: "transform",
      }}
    >
      <div
        ref={barRef}
        className="flex h-9 w-fit min-w-0 items-center gap-0.5 overflow-hidden rounded-full bg-[#18181b] p-1 font-sans text-[12.5px] text-[#e0e0e5] shadow-[0_4px_14px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.08)]"
      >
        <div ref={contentRef} className="flex w-fit shrink-0 items-center gap-0.5">
          {/* ── Thinking ─────────────────────────────────── */}
          {busy && (
            <span className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap px-2.5 text-[12.5px] text-[#8b8b95]">
              <Loader2 size={12} className="animate-spin text-[#6c63ff]" />
              <span className="animate-pulse">{busyLabel()}…</span>
            </span>
          )}

          {/* ── Result ───────────────────────────────────── */}
          {mode === "result" && (
            <>
              <button
                type="button"
                onClick={() => {
                  onKeep?.();
                  reset();
                }}
                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#e0e0e5] px-2.5 text-[12.5px] font-medium text-[#18181b] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.96]"
              >
                <Check size={13} />
                Keep
              </button>
              <button
                type="button"
                onClick={() => {
                  onDiscard?.();
                  reset();
                }}
                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-transparent px-2.5 text-[12.5px] text-[#8b8b95] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#e0e0e5]"
              >
                <X size={13} />
                Discard
              </button>
              <span className="mx-0.5 h-4 w-px shrink-0 bg-[rgba(255,255,255,0.1)]" />
              <button
                type="button"
                onClick={onRetry}
                title="Try again"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8b8b95] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#e0e0e5]"
              >
                <Loader2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => onCopy?.(resultText ?? "")}
                title="Copy result"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8b8b95] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#e0e0e5]"
              >
                <Copy size={13} />
              </button>
              <button
                type="button"
                onClick={() => onSaveNote?.(resultText ?? "")}
                title="Save to Notes"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8b8b95] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#e0e0e5]"
              >
                <FileText size={13} />
              </button>
            </>
          )}

          {/* ── Idle: custom prompt input ────────────────── */}
          {mode === "idle" && (
            <>
              <div
                className="flex min-w-0 items-center overflow-hidden transition-[max-width,opacity] duration-300"
                style={{
                  maxWidth: expanded ? 0 : hasPrompt ? 220 : 150,
                  opacity: expanded ? 0 : 1,
                  transitionTimingFunction: EASING,
                }}
              >
                <form
                  className="flex h-7 shrink-0 items-center"
                  onSubmit={(e) => {
                    e.preventDefault();
                    runCustom();
                  }}
                >
                  <input
                    ref={inputRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setPrompt("");
                        setExpanded(false);
                      }
                    }}
                    placeholder="Describe edits"
                    aria-label="Describe edits"
                    className="h-7 w-full bg-transparent pr-2 pl-3 text-[12.5px] text-[#e0e0e5] placeholder:text-[#8b8b95] focus:outline-none"
                  />
                </form>
              </div>

              <div
                className="flex min-w-0 items-center gap-0.5 overflow-hidden transition-[max-width,opacity] duration-300"
                style={{
                  maxWidth: hasPrompt ? 0 : expanded ? 500 : 220,
                  opacity: hasPrompt ? 0 : 1,
                  transitionTimingFunction: EASING,
                }}
              >
                {!expanded && <span className="mx-1 h-4 w-px shrink-0 bg-[rgba(255,255,255,0.12)]" />}

                {primaryActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => run(action)}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-transparent px-2.5 text-[12.5px] text-[#e0e0e5] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}

                <div
                  className="flex min-w-0 items-center gap-0.5 overflow-hidden transition-[max-width,opacity] duration-300"
                  style={{
                    maxWidth: expanded ? 300 : 0,
                    opacity: expanded ? 1 : 0,
                    transitionTimingFunction: EASING,
                  }}
                >
                  {moreActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => run(action)}
                      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-transparent px-2.5 text-[12.5px] text-[#e0e0e5] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>

                <span className="mx-0.5 h-4 w-px shrink-0 bg-[rgba(255,255,255,0.1)]" />

                <button
                  type="button"
                  aria-label={expanded ? "Show fewer actions" : "Show more actions"}
                  aria-expanded={expanded}
                  onClick={() => setExpanded((v) => !v)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8b8b95] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#e0e0e5]"
                >
                  <span
                    className="flex transition-transform duration-300"
                    style={{
                      transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                      transitionTimingFunction: EASING,
                    }}
                  >
                    <ChevronRight size={13} />
                  </span>
                </button>
              </div>

              {/* Send button (visible when typing) */}
              <div
                className="flex min-w-0 items-center overflow-hidden transition-[max-width,opacity] duration-300"
                style={{
                  maxWidth: hasPrompt ? 32 : 0,
                  opacity: hasPrompt ? 1 : 0,
                  transitionTimingFunction: EASING,
                }}
              >
                <button
                  type="button"
                  aria-label="Send"
                  onClick={runCustom}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6c63ff] text-white transition-transform active:scale-[0.94]"
                >
                  <ArrowUp size={14} strokeWidth={2.5} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dismiss on outside click */}
      {mode === "idle" && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#27272a] text-[#8b8b95] shadow-md transition-colors hover:bg-[#3f3f46] hover:text-[#e4e4e7]"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}
