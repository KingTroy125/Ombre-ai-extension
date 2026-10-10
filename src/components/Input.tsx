import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, FileText, Globe2, Mic, Square, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { getPageContent } from "../api/toqan";

export interface SuggestionItem {
  label: string;
  prompt: string;
}

export type SuggestionProp = string | SuggestionItem;

interface InputProps {
  onSend: (text: string, usePageContext?: boolean) => void;
  disabled?: boolean;
  isThinking?: boolean;
  onStop?: () => void;
  placeholder?: string;
  suggestions?: SuggestionProp[];
  onSelectSuggestion?: (suggestionPrompt: string) => void;
  showSuggestions?: boolean;
}

const DEFAULT_PAGE_SUGGESTIONS: SuggestionItem[] = [
  {
    label: "Summarize this page",
    prompt: "Help me understand this page and its key points",
  },
  {
    label: "Explain simply",
    prompt: "Explain this page in simple terms",
  },
];

export function Input({
  onSend,
  disabled,
  isThinking,
  onStop,
  placeholder,
  suggestions = DEFAULT_PAGE_SUGGESTIONS,
  onSelectSuggestion,
  showSuggestions = true,
}: InputProps) {
  const [value, setValue] = useState("");
  const [pageContextOn, setPageContextOn] = useState(true);
  const [pageInfo, setPageInfo] = useState<{ title: string; url: string; domain: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const baseValueRef = useRef("");

  // Retrieve current active tab context (title, URL, domain)
  useEffect(() => {
    let active = true;
    void getPageContent().then((res) => {
      if (!active || !res.success || !res.data) return;
      try {
        const domain = new URL(res.data.url).hostname.replace(/^www\./, "");
        setPageInfo({ title: res.data.title, url: res.data.url, domain });
      } catch {
        setPageInfo({ title: res.data.title, url: res.data.url, domain: res.data.url });
      }
    });
    return () => {
      active = false;
    };
  }, []);

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

  const normalizedSuggestions: SuggestionItem[] = (suggestions ?? DEFAULT_PAGE_SUGGESTIONS).map((s) => {
    if (typeof s === "string") {
      if (s === "Summarize this page") {
        return { label: s, prompt: "Summarize this page and its key points" };
      }
      if (s === "Key takeaways") {
        return { label: s, prompt: "What are the key takeaways from this page?" };
      }
      if (s === "Explain simply") {
        return { label: s, prompt: "Explain this page in simple terms" };
      }
      return { label: s, prompt: s };
    }
    return s;
  });

  const handleSuggestionClick = (item: SuggestionItem) => {
    if (disabled || isThinking) return;
    // Ensure page context is enabled when clicking page-specific actions
    setPageContextOn(true);
    if (onSelectSuggestion) {
      onSelectSuggestion(item.prompt);
    } else {
      onSend(item.prompt, true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto w-full shrink-0 px-3 pb-3 pt-2">
      {/* Suggestions Row */}
      {showSuggestions && normalizedSuggestions.length > 0 && !value.trim() && (
        <div className="mb-2.5 flex w-full items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {normalizedSuggestions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleSuggestionClick(item)}
              disabled={disabled || isThinking}
              title={item.prompt}
              className="focus-ring group inline-flex shrink-0 items-center justify-center rounded-[16px] border border-white/12 bg-transparent px-3 py-1.5 text-[12px] font-medium text-[#C9C9D1] transition-all duration-150 hover:border-white/25 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Composer container with gradient border and glow shadow */}
      <div className="relative w-full rounded-[22px] bg-gradient-to-b from-[#6D5CFF] via-[#CF4DFF]/35 to-[#2A2A33] p-[1.5px] shadow-[0px_10px_44px_rgba(109,92,255,0.18)] transition-all duration-200 focus-within:from-[#7B6CFF] focus-within:via-[#CF4DFF]/45 focus-within:to-[#383844] focus-within:shadow-[0px_12px_44px_rgba(109,92,255,0.28)]">
        <div className="flex w-full flex-col overflow-hidden rounded-[20.5px] bg-[#111115]">
          {/* Context Row inside Composer */}
          {pageContextOn && (
            <div className="flex w-full items-center px-3.5 pt-3.5 pb-0">
              <div
                role="status"
                aria-label={`Current page context included: ${pageInfo?.title ?? "Current page"}`}
                title={pageInfo?.url ? `${pageInfo.title}\n${pageInfo.url}` : "Current page"}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#6D5CFF]/35 bg-[#6D5CFF]/12 py-1 pl-2.5 pr-1.5 transition-colors"
              >
                <Globe2 size={13} className="shrink-0 text-[#B9B1FF]" />
                <span className="max-w-[150px] truncate text-[12px] font-medium text-[#DAD6FF] sm:max-w-[220px]">
                  {pageInfo?.domain ? pageInfo.domain : "Current page"}
                </span>
                <span className="rounded-full bg-[#6D5CFF]/25 px-2 py-0.5 text-[11px] font-semibold text-[#E9E6FF]">
                  Included
                </span>
                <button
                  type="button"
                  onClick={() => setPageContextOn(false)}
                  aria-label="Remove page context"
                  title="Remove page context"
                  className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-white/10 text-[#C9C3FF] transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className={cn("flex w-full items-start px-4 pb-1", pageContextOn ? "pt-2.5" : "pt-3.5")}>
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
              className="max-h-40 min-h-[36px] w-full resize-none bg-transparent text-[15px] sm:text-[16px] leading-[1.45] text-foreground placeholder:text-[#8E8E98] caret-[#8B7BFF] focus:outline-none"
            />
          </div>

          {/* Toolbar */}
          <div className="flex w-full items-center justify-between px-3 pb-3 pt-1.5">
            {/* Tools */}
            <div className="flex items-center gap-1.5">
              {/* Voice button */}
              <button
                type="button"
                onClick={handleMicClick}
                disabled={disabled || !isSupported}
                title={
                  isListening
                    ? "Stop listening"
                    : isSupported
                      ? "Voice input"
                      : "Voice input is not supported"
                }
                aria-label={isListening ? "Stop listening" : "Voice input"}
                className={cn(
                  "focus-ring flex size-8 items-center justify-center rounded-full transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40",
                  isListening
                    ? "animate-pulse bg-destructive text-destructive-foreground shadow-[0_0_12px_rgba(242,85,90,0.4)]"
                    : "border border-white/5 bg-[#16161A] text-[#A1A1AA] hover:bg-white/10 hover:text-foreground active:scale-95",
                )}
              >
                <Mic size={15} className="feather" />
              </button>

              {/* Page Context toggle */}
              <button
                type="button"
                onClick={() => setPageContextOn((v) => !v)}
                disabled={disabled}
                title={pageContextOn ? "Remove page context" : "Ask about this page"}
                aria-label={pageContextOn ? "Remove page context" : "Add page context"}
                aria-pressed={pageContextOn}
                className={cn(
                  "focus-ring flex size-8 items-center justify-center rounded-full transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40",
                  pageContextOn
                    ? "border border-[#6D5CFF]/70 bg-[#4F48B0] text-[#E0DCFF] shadow-[0_0_12px_rgba(109,92,255,0.3)] hover:bg-[#5A52C2] active:scale-95"
                    : "border border-white/5 bg-[#16161A] text-muted-foreground hover:bg-white/10 hover:text-foreground active:scale-95",
                )}
              >
                <FileText size={15} className="feather" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isThinking ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="focus-ring flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5CFF] to-[#EC86FF] text-white shadow-hairline transition-all duration-150 hover:brightness-110 active:scale-95"
                  title="Stop"
                  aria-label="Stop generation"
                >
                  <Square size={13} className="feather" fill="currentColor" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={disabled || !value.trim()}
                  className={cn(
                    "focus-ring flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-150",
                    value.trim() && !disabled
                      ? "bg-gradient-to-br from-[#6D5CFF] to-[#CF4DFF] text-white shadow-[0_2px_12px_rgba(109,92,255,0.4)] hover:brightness-110 active:scale-95"
                      : "border border-[#6D5CFF]/20 bg-[#6D5CFF]/15 text-[#7E75C9] disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                  title="Send"
                  aria-label="Send message"
                >
                  <ArrowUp size={16} className="feather" />
                </button>
              )}
            </div>
          </div>

          {speechError && (
            <p className="px-4 pb-2.5 text-[11px] leading-snug text-destructive" role="alert">
              {speechError}
            </p>
          )}
        </div>
      </div>

      {/* Under Composer Disclaimer */}
      <div className="mt-2.5 flex w-full flex-col items-center justify-center">
        <p className="text-[11.5px] leading-normal text-[#6B6B76] select-none">
          Ombre AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}