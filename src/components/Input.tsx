import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, FileText, Globe2, Mic, Square, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useSpeechToText } from "../hooks/useSpeechToText";

interface InputProps {
  onSend: (text: string, usePageContext?: boolean) => void;
  disabled?: boolean;
  isThinking?: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export function Input({ onSend, disabled, isThinking, onStop, placeholder }: InputProps) {
  const [value, setValue] = useState("");
  const [pageContextOn, setPageContextOn] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const baseValueRef = useRef("");

  const autoresize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const { isListening, isSupported, error: speechError, toggle: toggleMic } = useSpeechToText((text, isFinal) => {
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
    onSend(value, pageContextOn);
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
    <div className="mx-auto w-full shrink-0 px-3 pb-3 pt-2.5">
      {/* Page context is included by default and can be removed for this message. */}
      {pageContextOn && (
        <div className="mb-1.5 flex items-center gap-1.5 px-1">
          <button
            type="button"
            onClick={() => setPageContextOn(false)}
            aria-label="Remove page context"
            aria-pressed={pageContextOn}
            title="Remove page context from this message"
            className="focus-ring group inline-flex max-w-full items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] py-1 pl-2.5 pr-1.5 text-[11px] font-medium text-primary transition-colors hover:border-primary/45 hover:bg-primary/[0.12]"
          >
            <Globe2 size={13} className="shrink-0" />
            <span className="truncate">Current page</span>
            <span className="hidden text-[10px] text-muted-foreground min-[360px]:inline">Included</span>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-primary/70 transition-colors group-hover:bg-primary/10">
              <X size={12} />
            </span>
          </button>
        </div>
      )}

      {/* 1px gradient border: the gradient shows only through the p-px gap */}
      <div className="min-w-0 rounded-[18px] bg-gradient-to-r from-primary via-[#9b64ed] to-[#e98df1] p-px shadow-overlay transition-shadow focus-within:ring-2 focus-within:ring-ring/30">
        {/* Solid field covers the gradient; the body inherits this background */}
        <div className="overflow-hidden rounded-[17px] bg-field">

          <div className="flex flex-col gap-2 px-3 pb-2.5 pt-3">
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
              className="max-h-40 min-h-[30px] w-full resize-none bg-transparent text-[15px] leading-[1.4] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMicClick}
                  disabled={disabled || !isSupported}
                  title={
                    isListening
                      ? "Stop listening"
                      : isSupported
                        ? "Voice input"
                        : "Voice input is not supported"
                  }
                  className={cn(
                    "focus-ring flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-hover-2 active:bg-secondary disabled:cursor-not-allowed disabled:opacity-40",
                    isListening
                      ? "animate-pulse bg-destructive text-destructive-foreground"
                      : "text-muted-foreground hover:bg-hover-2 hover:text-foreground",
                  )}
                >
                  <Mic size={15} className="feather" />
                </button>

                {/* Page-context toggle */}
                <button
                  onClick={() => setPageContextOn((v) => !v)}
                  disabled={disabled}
                  title={pageContextOn ? "Remove page context" : "Ask about this page"}
                  aria-label={pageContextOn ? "Remove page context" : "Add page context"}
                  aria-pressed={pageContextOn}
                  className={cn(
                    "focus-ring flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-hover-2 active:bg-secondary disabled:cursor-not-allowed disabled:opacity-40",
                    pageContextOn
                      ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                      : "text-muted-foreground hover:bg-hover-2 hover:text-foreground",
                  )}
                >
                  <FileText size={15} className="feather" />
                </button>
              </div>

              {isThinking ? (
                <button
                  onClick={onStop}
                  className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#ec86ff] text-primary-foreground shadow-hairline transition-[filter] duration-150 hover:brightness-105 active:brightness-95"
                  title="Stop"
                >
                  <Square size={13} className="feather" fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={disabled || !value.trim()}
                  className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#ec86ff] text-primary-foreground shadow-hairline transition-[filter] duration-150 hover:brightness-105 active:brightness-95 disabled:opacity-30"
                  title="Send"
                >
                  <ArrowUp size={16} className="feather" />
                </button>
              )}
            </div>

            {speechError && (
              <p className="text-[10.5px] leading-snug text-destructive" role="alert">
                {speechError}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-1.5 px-1 text-center text-[10.5px] text-muted-foreground">
        Ombre AI can make mistakes. Check important info.
      </p>
    </div>
  );
}