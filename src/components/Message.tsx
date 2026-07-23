import { useState } from "react";
import { AlertTriangle, Check, Copy, ThumbsDown, ThumbsUp, User } from "lucide-react";
import type { ChatMessage } from "../lib/types";
import { Markdown } from "./Markdown";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { cn, formatTime, stripMarkdown } from "../lib/utils";
import ombreAvatar from "../assets/ombre-avatar.png";

function AssistantAvatar() {
  return (
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card">
      <img src={ombreAvatar} alt="Ombre AI" className="h-full w-full object-cover" />
    </div>
  );
}

interface MessageProps {
  message: ChatMessage;
  onRate?: (messageId: string, rating: "up" | "down") => void;
}

export function Message({ message, onRate }: MessageProps) {
  const isUser = message.role === "user";
  const isError = !!message.error;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const clean = stripMarkdown(message.content);
    try {
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write can fail if the document doesn't have focus at the
      // instant this runs — silently no-op rather than throwing, since
      // there's nothing more useful to do from here.
    }
  };

  const handleRate = (rating: "up" | "down") => {
    onRate?.(message.id, rating);
  };

  return (
    <div
      className={cn(
        "flex gap-2.5 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {isUser ? (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
          <User size={14} className="feather" />
        </div>
      ) : (
        <AssistantAvatar />
      )}

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

        <div className="flex items-center gap-2 px-1">
          <span className="text-[10.5px] text-muted-foreground">{formatTime(message.createdAt)}</span>

          {!isUser && !isError && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleCopy}
                title={copied ? "Copied" : "Copy"}
                className="focus-ring flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {copied ? <Check size={11} className="feather" /> : <Copy size={11} className="feather" />}
              </button>
              <button
                onClick={() => handleRate("up")}
                title="Good response"
                className={cn(
                  "focus-ring flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-secondary",
                  message.rating === "up" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ThumbsUp size={11} className="feather" fill={message.rating === "up" ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => handleRate("down")}
                title="Bad response"
                className={cn(
                  "focus-ring flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-secondary",
                  message.rating === "down" ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ThumbsDown size={11} className="feather" fill={message.rating === "down" ? "currentColor" : "none"} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ThinkingBubble({ note }: { note?: string | null }) {
  const words = note ? [note] : ["Thinking", "Reasoning", "Considering"];
  return (
    <div className="flex animate-fade-in gap-2.5">
      <AssistantAvatar />
      <div className="flex flex-col gap-1">
        <div className="flex items-center rounded-2xl rounded-tl-sm bg-card px-3.5 py-3">
          <ThinkingIndicator words={words} />
        </div>
      </div>
    </div>
  );
}
