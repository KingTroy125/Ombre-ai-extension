import { AlertTriangle, Bot, User } from "lucide-react";
import type { ChatMessage } from "../lib/types";
import { Markdown } from "./Markdown";
import { cn, formatTime } from "../lib/utils";

export function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isError = !!message.error;

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
        <span className="px-1 text-[10.5px] text-muted-foreground">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}

export function ThinkingBubble({ note }: { note?: string | null }) {
  return (
    <div className="flex animate-fade-in gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Bot size={14} className="feather" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-card px-3.5 py-3">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </div>
        {note && <span className="px-1 text-[11px] text-muted-foreground">{note}</span>}
      </div>
    </div>
  );
}
