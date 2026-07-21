import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Mic, Sparkles, Square, X } from "lucide-react";
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
  const [showTip, setShowTip] = useState(true);
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
    <div className="border-t border-border bg-background/95 px-3 pb-3 pt-2.5 backdrop-blur">
      {/* Gradient-bordered card: 1.5px purple gradient ring wrapping the whole
          input, matching the reference's colored-border pill treatment. */}
      <div className="rounded-2xl bg-gradient-to-r from-primary via-fuchsia-400 to-primary p-[1.5px] shadow-sm transition-shadow focus-within:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]">
        <div className="overflow-hidden rounded-[15px] bg-card">
          {showTip && (
            <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-primary/15 via-fuchsia-400/10 to-primary/15 px-3 py-1.5">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                <Sparkles size={12} className="feather" />
                Select text on any page to ask, improve, or rephrase it
              </span>
              <button
                onClick={() => setShowTip(false)}
                title="Dismiss"
                className="focus-ring rounded-full p-0.5 text-primary/70 transition-colors hover:text-primary"
              >
                <X size={12} className="feather" />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5 px-3 py-2.5">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                autoresize();
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={isListening ? "Listening…" : (placeholder ?? "What do you want to do today?")}
              className="max-h-40 w-full resize-none bg-transparent text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {isSupported && (
                  <button
                    onClick={handleMicClick}
                    disabled={disabled}
                    title={isListening ? "Stop listening" : "Voice input"}
                    className={cn(
                      "focus-ring flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100",
                      isListening
                        ? "bg-destructive text-destructive-foreground animate-pulse"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Mic size={15} className="feather" />
                  </button>
                )}
              </div>

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
                  className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                  title="Send"
                >
                  <ArrowUp size={16} className="feather" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-1.5 px-1 text-center text-[10.5px] text-muted-foreground">
        Ombre AI can make mistakes. Check important info.
      </p>
    </div>
  );
}
