import { useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
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

export function Chat({
  conversation,
  onUpdateConversation,
  onEnsureConversation,
  onOpenNote: _onOpenNote,
  pendingAddText,
  onAddTextSent,
}: ChatProps) {
  const { sendMessage, stopGeneration, isThinking, statusNote } = useChat({
    conversation,
    onUpdateConversation,
    onEnsureConversation,
  });
  const { hasApiKey, loaded } = useSettings();

  const { containerRef, isPinned, hasUnseenContent, scrollToBottom, anchorToElement, onContentChanged } =
    useStickyScroll();

  const messages = conversation?.messages ?? [];
  const hasMessages = messages.length > 0;
  const lastContent = messages[messages.length - 1]?.content;

  // Tracks the last seen message/conversation so we can tell whether the
  // next render was caused by *this tab* sending a message (turn-anchor it
  // near the top) vs. loading history or switching conversations.
  const lastMessageId = useRef<string | null>(null);
  const lastConversationId = useRef<string | null>(null);

  // Keep latest callbacks in refs so the "Add to chat" effect only fires
  // once per pending text, even if these functions change identity.
  const sendRef = useRef(sendMessage);
  const consumedRef = useRef(onAddTextSent);
  sendRef.current = sendMessage;
  consumedRef.current = onAddTextSent;

  const handleSend = (text: string, usePageContext?: boolean) => {
    sendMessage(text, usePageContext);
  };

  // Send pending text from "Add to chat" (selection toolbar)
  useEffect(() => {
    if (!pendingAddText) return;
    sendRef.current(pendingAddText);
    consumedRef.current?.();
  }, [pendingAddText]);

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

    if (latest.role === "user") {
      // Wait a frame for the new bubble to be in the DOM before anchoring it.
      requestAnimationFrame(() => {
        const el = containerRef.current?.querySelector<HTMLElement>(`[data-msg-id="${latest.id}"]`);
        if (el) anchorToElement(el);
      });
    } else {
      onContentChanged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, conversation?.id]);

  // Follow streaming updates to the last message (length stays the same
  // while its content grows). Only scrolls if already pinned.
  useEffect(() => {
    if (lastContent !== undefined) onContentChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastContent]);

  // The thinking indicator appearing/disappearing is content too.
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
        <LandingView hasApiKey={hasApiKey} settingsLoaded={loaded} />
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
  hasApiKey,
  settingsLoaded,
}: {
  hasApiKey: boolean;
  settingsLoaded: boolean;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-5 sm:px-6 sm:py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl">
          <img src={avatarUrl} alt="Ombre AI" className="h-11 w-11" draggable={false} />
        </div>
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">Ombre AI</h1>
          <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
            {settingsLoaded && !hasApiKey
              ? "Add your Toqan API key in Settings to start chatting."
              : "Ask a question to get started."}
          </p>
        </div>
      </div>
    </div>
  );
}