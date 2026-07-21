import { AlertTriangle, Bot, User, ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react";
import type { ChatMessage } from "../lib/types";
import { Markdown } from "./Markdown";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { cn, formatTime } from "../lib/utils";
import { useState } from "react";

export function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isError = !!message.error;
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<"up" | "down" | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silently
    }
  };

  // Defensive: only show actions for assistant messages that are not errors
  const showActions = !isUser && !isError;

  return (
    <div
      className={cn(
        "flex gap-2.5 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {isUser ? <User size={14} className="feather" /> : <Bot size={14} className="feather" />}
      </div>

      <div className={cn("flex max-w-[82%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-card text-card-foreground",
            isError && "border border-destructive/40 bg-destructive/10 text-destructive-foreground"
          )}
        >
          {isError && (
            <div className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-[#ff8a8f]">
              <AlertTriangle size={13} className="feather" />
              Something went wrong
            </div>
          )}
          {isUser ? (
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{message.content}</p>
          ) : (
            <Markdown content={message.content} />
          )}
        </div>

        {/* Actions row: copy + rate + timestamp */}
        <div className="flex items-center gap-2 px-1">
          {showActions && (
            <>
              {/* Copy */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Copy"
                aria-label="Copy message"
              >
                {copied ? (
                  <Check size={13} className="feather text-emerald-500" />
                ) : (
                  <Copy size={13} className="feather" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>

              <div className="h-3 w-px bg-border/60" />

              {/* Rate */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setRating(rating === "up" ? null : "up")}
                  className={cn(
                    "rounded-md p-1 transition-colors hover:bg-muted",
                    rating === "up"
                      ? "text-emerald-500 bg-emerald-500/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Helpful"
                  aria-label="Thumbs up"
                >
                  <ThumbsUp size={13} className="feather" />
                </button>
                <button
                  onClick={() => setRating(rating === "down" ? null : "down")}
                  className={cn(
                    "rounded-md p-1 transition-colors hover:bg-muted",
                    rating === "down"
                      ? "text-[#ff8a8f] bg-[#ff8a8f]/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Not helpful"
                  aria-label="Thumbs down"
                >
                  <ThumbsDown size={13} className="feather" />
                </button>
              </div>

              <div className="h-3 w-px bg-border/60" />
            </>
          )}

          <span className="text-[10.5px] text-muted-foreground">
            {message.createdAt ? formatTime(message.createdAt) : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ThinkingBubble({ note }: { note?: string | null }) {
  const words = note ? [note] : ["Thinking", "Reasoning", "Considering"];
  return (
    <div className="flex animate-fade-in gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Bot size={14} className="feather" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center rounded-2xl rounded-tl-sm bg-card px-3.5 py-3">
          <ThinkingIndicator words={words} />
        </div>
      </div>
    </div>
  );
}