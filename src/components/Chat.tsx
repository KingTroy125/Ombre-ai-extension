import { useEffect, useRef, useState } from "react";
import { ArrowDown, FileText } from "lucide-react";
import type { Conversation } from "../lib/types";
import { useChat } from "../hooks/useChat";
import { useStickyScroll } from "../hooks/useStickyScroll";
import { Message, ThinkingBubble } from "./Message";
import { Input } from "./Input";
import { useSettings } from "../hooks/useSettings";
import avatarUrl from "../assets/avatar.svg";

interface ChatProps {
  conversation: Conversation | null;
  onUpdateConversation: (id: string, patch: Partial<Conversation>) => void;
  onEnsureConversation: () => Conversation;
  /** Opens a saved note (by id) in the sidepanel's Notes page. */
  onOpenNote?: (id: string) => void;
  /** Text to add to chat from an external source (e.g. "Add to chat" from selection toolbar). */
  pendingAddText?: string | null;
  /** Called after pendingAddText has been consumed. */
  onAddTextSent?: () => void;
}

export function Chat({ conversation, onUpdateConversation, onEnsureConversation, onOpenNote: _onOpenNote, pendingAddText, onAddTextSent }: ChatProps) {
  const { sendMessage, stopGeneration, isThinking, statusNote } = useChat({
    conversation,
    onUpdateConversation,
    onEnsureConversation,
  });
  const { hasApiKey, loaded } = useSettings();
  const [page, setPage] = useState(0);

  const { containerRef, isPinned, hasUnseenContent, scrollToBottom, anchorToElement, onContentChanged } =
    useStickyScroll();

  const messages = conversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  // Tracks whether the next render was caused by *this tab* sending a
  // message (turn-anchor it near the top) vs. loading history, switching
  // conversations, or an incoming reply (just follow sticky-scroll as normal).
  const pendingAnchorId = useRef<string | null>(null);
  const lastMessageId = useRef<string | null>(null);
  const lastConversationId = useRef<string | null>(null);

  const handleSend = (text: string, usePageContext?: boolean) => {
    sendMessage(text, usePageContext);
  };

  // Send pending text from "Add to chat" (selection toolbar)
  useEffect(() => {
    if (pendingAddText) {
      sendMessage(pendingAddText);
      onAddTextSent?.();
    }
  }, [pendingAddText, sendMessage, onAddTextSent]);

  const handleRate = (messageId: string, rating: "up" | "down") => {
    if (!conversation) return;
    const updatedMessages = conversation.messages.map((m) =>
      m.id === messageId ? { ...m, rating: m.rating === rating ? undefined : rating } : m
    );
    onUpdateConversation(conversation.id, { messages: updatedMessages });
  };

  useEffect(() => {
    const conversationChanged = conversation?.id !== lastConversationId.current;
    lastConversationId.current = conversation?.id ?? null;

    const latest = messages[messages.length - 1];
    if (!latest || latest.id === lastMessageId.current) return;
    lastMessageId.current = latest.id;

    if (conversationChanged) {
      // Switched to a different (possibly pre-existing) conversation — just
      // land at the bottom of it, no turn-anchoring illusion to maintain.
      requestAnimationFrame(() => scrollToBottom("auto"));
      return;
    }

    const isFreshUserTurn = latest.role === "user";
    if (isFreshUserTurn) {
      pendingAnchorId.current = latest.id;
      // Wait a frame for the new bubble to actually be in the DOM before anchoring it.
      requestAnimationFrame(() => {
        const el = containerRef.current?.querySelector<HTMLElement>(`[data-msg-id="${latest.id}"]`);
        if (el) anchorToElement(el);
        pendingAnchorId.current = null;
      });
    } else {
      onContentChanged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, conversation?.id]);

  // The thinking indicator appearing/disappearing is content too — follow
  // the same sticky rule (only auto-scroll if already pinned).
  useEffect(() => {
    onContentChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThinking]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-background">
      {hasMessages ? (
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <div ref={containerRef} className="h-full min-h-0 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
            <div
              role="log"
              aria-relevant="additions"
              aria-busy={isThinking}
              className="mx-auto flex max-w-2xl flex-col gap-4"
            >
              {messages.map((m) => (
                <div key={m.id} data-msg-id={m.id}>
                  <Message message={m} onRate={handleRate} />
                </div>
              ))}
              {isThinking && <ThinkingBubble note={statusNote} />}
            </div>
          </div>

          {!isPinned && (
            <button
              onClick={() => scrollToBottom()}
              className="focus-ring absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground shadow-md transition-transform hover:-translate-y-0.5"
            >
              <ArrowDown size={13} className="feather" />
              {hasUnseenContent ? "New message" : "Jump to latest"}
              <span className="sr-only">— scroll to bottom of conversation</span>
            </button>
          )}
        </div>
      ) : (
        <LandingView
          onAskPage={() => handleSend("Help me understand this page and its key points", true)}
          page={page}
          setPage={setPage}
          hasApiKey={hasApiKey}
          settingsLoaded={loaded}
        />
      )}

      <Input
        onSend={handleSend}
        disabled={isThinking}
        isThinking={isThinking}
        onStop={stopGeneration}
      />
    </div>
  );
}

function LandingView({
  onAskPage,
  page,
  setPage,
  hasApiKey,
  settingsLoaded,
}: {
  onAskPage: () => void;
  page: number;
  setPage: (n: number) => void;
  hasApiKey: boolean;
  settingsLoaded: boolean;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-5 sm:px-6 sm:py-8">
      {/* Agent activation block */}
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl">
          <img src={avatarUrl} alt="Ombre AI" className="h-11 w-11" draggable={false} />
        </div>
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">Ombre AI</h1>
          <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
            {settingsLoaded && !hasApiKey
              ? "Add your Toqan API key in Settings to start chatting."
              : "Ask a question or start with the current page."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onAskPage}
        disabled={!hasApiKey}
        className="focus-ring group/page mb-6 inline-flex max-w-full items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
          <FileText size={15} className="feather" />
        </span>
        <span className="truncate">Summarize this page</span>
      </button>

      {/* Page-indicator dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`h-1.5 rounded-full transition-all ${page === i ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/40"
              }`}
          />
        ))}
      </div>
    </div>
  );
}
