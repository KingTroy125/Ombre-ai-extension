import { useEffect, useRef, useState } from "react";
import { Code2, FileText, Lightbulb, Sparkles } from "lucide-react";
import type { Conversation } from "../lib/types";
import { useChat } from "../hooks/useChat";
import { Message, ThinkingBubble } from "./Message";
import { Input } from "./Input";
import { useSettings } from "../hooks/useSettings";

const SUGGESTIONS = [
  { icon: Lightbulb, label: "Explain a concept", prompt: "Explain how async/await works in JavaScript" },
  { icon: Code2, label: "Debug my code", prompt: "Help me debug this function: " },
  { icon: FileText, label: "Summarize this page", prompt: "Summarize the key points of this page" },
];

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const messages = conversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isThinking]);

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {hasMessages ? (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {isThinking && <ThinkingBubble note={statusNote} />}
          </div>
        </div>
      ) : (
        <LandingView
          onPromptSelect={(prompt) => sendMessage(prompt)}
          page={page}
          setPage={setPage}
          hasApiKey={hasApiKey}
          settingsLoaded={loaded}
        />
      )}

      <Input onSend={sendMessage} disabled={isThinking} isThinking={isThinking} />
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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
          <Sparkles size={26} className="feather text-primary" />
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
            className="focus-ring flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left text-[13px] text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <Icon size={15} className="feather text-primary" />
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
              page === i ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
