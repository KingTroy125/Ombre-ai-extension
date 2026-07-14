import { useEffect, useRef, useState } from "react";
import { ArrowDown, Code2, FileText, Lightbulb, Sparkles } from "lucide-react";
import type { Conversation } from "../lib/types";
import { useChat } from "../hooks/useChat";
import { useStickyScroll } from "../hooks/useStickyScroll";
import { Message, ThinkingBubble } from "./Message";
import { Input } from "./Input";
import { useSettings } from "../hooks/useSettings";

const SUGGESTIONS = [
  { icon: Lightbulb, label: "Explain a concept", prompt: "Explain how async/await works in JavaScript" },
  { icon: Code2, label: "Debug my code", prompt: "Help me debug this function: " },
  { icon: FileText, label: "Summarize this page", prompt: "Summarize the key points of this page" },
];

/** Decorative gradient blob — sits behind the content layer */
function GradientBlob({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full blur-3xl opacity-20 ${className ?? ""}`}
    />
  );
}

interface ChatProps {
  conversation: Conversation | null;
  onUpdateConversation: (id: string, patch: Partial<Conversation>) => void;
  onEnsureConversation: () => Conversation;
}

export function Chat({ conversation, onUpdateConversation, onEnsureConversation }: ChatProps) {
  const { sendMessage, isThinking, statusNote } = useChat({
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

  const handleSend = (text: string) => {
    sendMessage(text);
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
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
      {/* ── Purple ambient gradient backdrop ────────────────────────── */}
      <GradientBlob className="h-72 w-72 bg-purple-600 -top-20 -left-20" />
      <GradientBlob className="h-64 w-64 bg-violet-500 bottom-20 -right-16" />
      <GradientBlob className="h-48 w-48 bg-fuchsia-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* ── Chat content ────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {hasMessages ? (
          <div className="relative flex-1 overflow-hidden">
            <div ref={containerRef} className="h-full overflow-y-auto px-4 py-4">
              <div
                role="log"
                aria-relevant="additions"
                aria-busy={isThinking}
                className="mx-auto flex max-w-2xl flex-col gap-4"
              >
                {messages.map((m) => (
                  <div key={m.id} data-msg-id={m.id}>
                    <Message message={m} />
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
            onPromptSelect={(prompt) => handleSend(prompt)}
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
          creditsRemaining={490}
          onUpgrade={() => {}}
        />
      </div>
    </div>
  );
}

function LandingView({
  onPromptSelect,
  page,
  setPage,
  hasApiKey,
  settingsLoaded,
}: {
  onPromptSelect: (prompt: string) => void;
  page: number;
  setPage: (n: number) => void;
  hasApiKey: boolean;
  settingsLoaded: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
      {/* Agent activation block */}
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-violet-600/20 border border-purple-500/20 shadow-lg shadow-purple-500/10">
          <Sparkles size={26} className="feather text-purple-400" />
        </div>
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">Ombre AI</h1>
          <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
            {settingsLoaded && !hasApiKey
              ? "Add your Toqan API key in Settings to start chatting."
              : "Ask a question, paste some text, or pick a starting point below."}
          </p>
        </div>
      </div>

      {/* Suggestion pills */}
      <div className="mb-6 flex w-full max-w-sm flex-col gap-2">
        {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            onClick={() => onPromptSelect(prompt)}
            disabled={!hasApiKey}
            className="focus-ring group flex items-center gap-2.5 rounded-xl border border-purple-500/15 bg-purple-500/5 px-3.5 py-2.5 text-left text-[13px] text-foreground transition-all hover:-translate-y-0.5 hover:border-purple-500/40 hover:bg-purple-500/10 hover:shadow-sm hover:shadow-purple-500/10 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <Icon size={15} className="feather text-purple-400 group-hover:text-purple-300 transition-colors" />
            {label}
          </button>
        ))}
      </div>

      {/* Page-indicator dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`h-1.5 rounded-full transition-all ${
              page === i ? "w-4 bg-purple-500" : "w-1.5 bg-purple-500/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
