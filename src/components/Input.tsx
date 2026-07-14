import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Mic, Square, Sparkles, Paperclip, Pencil, Zap, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useSpeechToText } from "../hooks/useSpeechToText";

interface InputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isThinking?: boolean;
  onStop?: () => void;
  placeholder?: string;
  /** Credits remaining count — shown in the gradient header bar */
  creditsRemaining?: number;
  /** Called when the user clicks the × in the header bar */
  onDismiss?: () => void;
  /** Called when the user clicks "Upgrade" */
  onUpgrade?: () => void;
}

export function Input({
  onSend,
  disabled,
  isThinking,
  onStop,
  placeholder,
  creditsRemaining,
  onDismiss,
  onUpgrade,
}: InputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const baseValueRef = useRef("");

  const autoresize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const { isListening, isSupported, toggle: toggleMic } = useSpeechToText((text, isFinal) => {
    const base = baseValueRef.current;
    const combined = base ? `${base} ${text}` : text;
    setValue(combined);
    requestAnimationFrame(autoresize);
    if (isFinal) baseValueRef.current = combined;
  });

  const handleMicClick = () => {
    if (!isListening) baseValueRef.current = value;
    toggleMic();
  };

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    if (isListening) toggleMic();
    onSend(value);
    setValue("");
    baseValueRef.current = "";
    requestAnimationFrame(autoresize);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showHeader = creditsRemaining !== undefined || !!onDismiss || !!onUpgrade;

  return (
    <div className="px-3 pb-3 pt-2">
      {/* ── Floating card wrapper ──────────────────────────────────────── */}
      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(139,92,246,0.35)",
          boxShadow:
            "0 0 0 1px rgba(108,99,255,0.1), 0 8px 40px rgba(108,99,255,0.25), 0 2px 8px rgba(0,0,0,0.5)",
          background: "var(--card)",
        }}
      >
        {/* ── Gradient header bar ──────────────────────────────────────── */}
        {showHeader && (
          <div
            style={{
              background:
                "linear-gradient(105deg, #2e1065 0%, #4c1d95 30%, #6d28d9 65%, #7c3aed 100%)",
              borderBottom: "1px solid rgba(167,139,250,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 14px",
            }}
          >
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 500,
                color: "rgba(221,214,254,0.9)",
                letterSpacing: "0.01em",
              }}
            >
              {creditsRemaining !== undefined
                ? `${creditsRemaining.toLocaleString()} Credits Remaining`
                : "Ombre AI"}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {onUpgrade && (
                <button
                  onClick={onUpgrade}
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 600,
                    color: "#c4b5fd",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#c4b5fd")}
                >
                  Upgrade
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  style={{
                    color: "rgba(196,181,253,0.6)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(196,181,253,0.6)")}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Textarea ──────────────────────────────────────────────────── */}
        <div style={{ padding: "12px 14px 8px" }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autoresize();
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              isListening
                ? "Listening…"
                : (placeholder ?? "What do you want to do today?")
            }
            className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none max-h-40"
          />
        </div>

        {/* ── Toolbar row ───────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px 10px",
          }}
        >
          {/* Icon buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            {isSupported && (
              <ToolbarIcon
                title={isListening ? "Stop listening" : "Voice input"}
                onClick={handleMicClick}
                active={isListening}
              >
                <Mic size={16} className="feather" />
              </ToolbarIcon>
            )}
            <ToolbarIcon title="Enhance prompt">
              <Zap size={16} className="feather" />
            </ToolbarIcon>
            <ToolbarIcon title="AI suggestions">
              <Sparkles size={16} className="feather" />
            </ToolbarIcon>
            <ToolbarIcon title="Attach file">
              <Paperclip size={16} className="feather" />
            </ToolbarIcon>
            <ToolbarIcon title="Edit draft">
              <Pencil size={16} className="feather" />
            </ToolbarIcon>
          </div>

          {/* Send / Stop */}
          {isThinking ? (
            <button
              onClick={onStop}
              title="Stop"
              className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                boxShadow: "0 2px 12px rgba(124,58,237,0.5)",
              }}
            >
              <Square size={13} className="feather" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={disabled || !value.trim()}
              title="Send"
              className={cn(
                "focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white",
                "transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
              )}
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                boxShadow: "0 2px 12px rgba(124,58,237,0.45)",
              }}
            >
              <ArrowUp size={16} className="feather" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-1.5 px-1 text-center text-[10.5px] text-muted-foreground/60">
        Ombre AI can make mistakes. Check important info.
      </p>
    </div>
  );
}

function ToolbarIcon({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "focus-ring flex h-8 w-8 items-center justify-center rounded-xl transition-all",
        active
          ? "text-violet-400 bg-violet-500/15"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}
