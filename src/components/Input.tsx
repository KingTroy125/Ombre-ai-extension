import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Mic, Square } from "lucide-react";
import { cn } from "../lib/utils";
import { useSpeechToText } from "../hooks/useSpeechToText";

interface InputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isThinking?: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export function Input({ onSend, disabled, isThinking, onStop, placeholder }: InputProps) {
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

  return (
    <div className="border-t border-border bg-background/95 px-3 pb-3 pt-2 backdrop-blur">
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border border-input bg-card px-2.5 py-2 shadow-sm transition-shadow",
          "focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autoresize();
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={isListening ? "Listening…" : (placeholder ?? "Ask Ombre AI anything…")}
          className="max-h-40 flex-1 resize-none bg-transparent px-1.5 py-1 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {isSupported && (
          <button
            onClick={handleMicClick}
            disabled={disabled}
            title={isListening ? "Stop listening" : "Voice input"}
            className={cn(
              "focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100",
              isListening
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <Mic size={14} className="feather" />
          </button>
        )}
        {isThinking ? (
          <button
            onClick={onStop}
            className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-transform hover:scale-105 active:scale-95"
            title="Stop"
          >
            <Square size={13} className="feather" fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
            title="Send"
          >
            <ArrowUp size={16} className="feather" />
          </button>
        )}
      </div>
      <p className="mt-1.5 px-1 text-center text-[10.5px] text-muted-foreground">
        Ombre AI can make mistakes. Check important info.
      </p>
    </div>
  );
}
