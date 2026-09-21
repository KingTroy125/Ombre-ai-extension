import { useCallback, useEffect, useRef, useState } from "react";
import { getPageContent, onRuntimeEvent, sendChat, stopChat } from "../api/toqan";
import type { ChatMessage, Conversation, PageContent } from "../lib/types";
import { newId, titleFromMessage } from "../lib/utils";

const MAX_PAGE_CHARS = 12000;

/**
 * Detects when the user is asking about the current tab, e.g.
 * "summarize this page", "what is this article about", "tell me about this site".
 */
const PAGE_INTENT_RE =
  /\b(this|current)\s+(page|site|website|web\s*?site|webpage|web\s*?page|tab|article|url|link|document)\b|\bsummariz(?:e|ing)?\s+(this|it|that|the\s+page)\b|\babout\s+this\b|\bthis\s+(?:is\s+)?about\b|\bon\s+this\s+page\b/i;

/**
 * Prepends the active tab's content as context to the first message of a
 * conversation, so the user can ask about the page straight from the
 * normal chat — no separate Page view needed.
 */
function buildContextualMessage(userText: string, page: PageContent): string {
  const domain = (() => {
    try {
      return new URL(page.url).hostname;
    } catch {
      return page.url;
    }
  })();

  const truncated = page.text.slice(0, MAX_PAGE_CHARS);
  const overflow = page.text.length > MAX_PAGE_CHARS ? "\n\n[… content truncated …]" : "";

  return (
    `[Page context — "${page.title}" (${domain})]\n` +
    `URL: ${page.url}\n\n` +
    `--- BEGIN PAGE CONTENT ---\n${truncated}${overflow}\n--- END PAGE CONTENT ---\n\n` +
    `User question: ${userText}`
  );
}

interface UseChatOptions {
  conversation: Conversation | null;
  onUpdateConversation: (id: string, patch: Partial<Conversation>) => void;
  onEnsureConversation: () => Conversation;
}

export function useChat({ conversation, onUpdateConversation, onEnsureConversation }: UseChatOptions) {
  const [isThinking, setIsThinking] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const activeConvoIdRef = useRef<string | null>(conversation?.id ?? null);
  const conversationsRef = useRef<Map<string, ChatMessage[]>>(new Map());
  // Conversations whose generation the user explicitly stopped — late
  // replies/errors from those runs are dropped instead of appended.
  const stoppedConvosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    activeConvoIdRef.current = conversation?.id ?? null;
    if (conversation) {
      conversationsRef.current.set(conversation.id, conversation.messages);
    }
  }, [conversation]);

  const appendMessage = useCallback(
    (conversationId: string, message: ChatMessage) => {
      if (!conversationId) return;
      const current = conversationsRef.current.get(conversationId) ?? [];
      const next = [...current, message];
      conversationsRef.current.set(conversationId, next);
      onUpdateConversation(conversationId, { messages: next });
    },
    [onUpdateConversation]
  );

  useEffect(() => {
    const unsubscribe = onRuntimeEvent((event) => {
      if (event.type === "TOQAN_REPLY") {
        if (stoppedConvosRef.current.delete(event.conversationId)) return;
        setIsThinking(false);
        setStatusNote(null);
        appendMessage(event.conversationId, {
          id: newId(),
          role: "assistant",
          content: event.reply,
          createdAt: Date.now(),
        });
      } else if (event.type === "TOQAN_OVERLOADED") {
        if (stoppedConvosRef.current.delete(event.conversationId)) return;
        setStatusNote("Ombre AI is busy — retrying…");
      } else if (event.type === "TOQAN_ERROR") {
        const targetId = event.conversationId ?? activeConvoIdRef.current ?? "";
        if (stoppedConvosRef.current.delete(targetId)) return;
        setIsThinking(false);
        setStatusNote(null);
        appendMessage(targetId, {
          id: newId(),
          role: "assistant",
          content: event.error,
          createdAt: Date.now(),
          error: event.error,
        });
      }
    });
    return unsubscribe;
  }, [appendMessage]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const convo = conversation ?? onEnsureConversation();
      const userMessage: ChatMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };
      const current = conversationsRef.current.get(convo.id) ?? convo.messages;
      const isFirstMessage = current.length === 0;
      const nextMessages = [...current, userMessage];
      conversationsRef.current.set(convo.id, nextMessages);

      const patch: Partial<Conversation> = { messages: nextMessages };
      if (convo.messages.length === 0) patch.title = titleFromMessage(trimmed);
      onUpdateConversation(convo.id, patch);

      setIsThinking(true);
      setStatusNote(null);
      activeConvoIdRef.current = convo.id;

      try {
        // Automatically attach the active tab's content as context when the
        // user asks about the page (or on the first message, so follow-ups
        // keep working). The bubble keeps the raw text; only the payload
        // sent to the AI carries the page context.
        const pageIntent = PAGE_INTENT_RE.test(trimmed);
        let messagesToSend = nextMessages;
        if (isFirstMessage || pageIntent) {
          setStatusNote("Reading this page…");
          const pageResult = await getPageContent();
          setStatusNote(null);
          if (pageResult.success) {
            const contextualContent = buildContextualMessage(trimmed, pageResult.data);
            messagesToSend = [...current, { ...userMessage, content: contextualContent }];
          } else if (pageIntent) {
            // The user explicitly asked about the page but the tab can't be
            // read (e.g. chrome:// pages, the web store, blank tabs). Say so
            // locally instead of letting the AI guess blindly.
            const helpMessage: ChatMessage = {
              id: newId(),
              role: "assistant",
              content:
                "I couldn't read the current tab — extensions can't access browser pages (like settings pages), the web store, or blank tabs. Open a normal webpage and ask again.",
              createdAt: Date.now(),
            };
            const withHelp = [...nextMessages, helpMessage];
            conversationsRef.current.set(convo.id, withHelp);
            onUpdateConversation(convo.id, { messages: withHelp });
            setIsThinking(false);
            return;
          }
        }
        await sendChat(messagesToSend, convo.id);
      } catch (err) {
        setIsThinking(false);
        appendMessage(convo.id, {
          id: newId(),
          role: "assistant",
          content: err instanceof Error ? err.message : "Something went wrong sending your message.",
          createdAt: Date.now(),
          error: "send-failed",
        });
      }
    },
    [conversation, onEnsureConversation, onUpdateConversation, appendMessage]
  );

  const stopGeneration = useCallback(() => {
    const convoId = activeConvoIdRef.current;
    if (convoId) stoppedConvosRef.current.add(convoId);
    stopChat(convoId ?? undefined);
    setIsThinking(false);
    setStatusNote(null);
  }, []);

  return { sendMessage, stopGeneration, isThinking, statusNote };
}
