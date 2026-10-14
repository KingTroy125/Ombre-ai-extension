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
  /\b(this|current)\s+(page|site|website|web\s*?site|webpage|web\s*?page|tab|article|url|link|document)\b|\bsummariz(?:e|ing)?\s+(this|it|that|the\s+page)\b|\babout\s+this\b|\bthis\s+(?:is\s+)?about\b|\bon\s+this\s+page\b|\bread\s+this\b|\bwhat(?:'s|\s+is)?\s+(?:on|in)\s+this\b|\banalyze\s+this\b|\bthis\s+article\b|\bkey\s+takeaways?\b|\bexplain\s+simply\b/i;

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
  const [thinkingConvoId, setThinkingConvoId] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const activeConvoIdRef = useRef<string | null>(conversation?.id ?? null);
  const activeRequestIdRef = useRef<string | null>(null);
  const stoppedRequestIdsRef = useRef<Set<string>>(new Set());
  const stoppedConvosRef = useRef<Set<string>>(new Set());
  const conversationsRef = useRef<Map<string, ChatMessage[]>>(new Map());
  const pageContextByConversationRef = useRef<Map<string, PageContent>>(new Map());

  const isThinking = !!thinkingConvoId && (!conversation || thinkingConvoId === conversation.id);

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
    const isStoppedOrStale = (requestId: string | undefined, targetConvoId: string) => {
      if (requestId) {
        if (stoppedRequestIdsRef.current.delete(requestId)) return true;
        if (activeRequestIdRef.current && requestId !== activeRequestIdRef.current) return true;
      } else if (stoppedConvosRef.current.delete(targetConvoId)) {
        return true;
      }
      return false;
    };

    const unsubscribe = onRuntimeEvent((event) => {
      if (event.type === "TOQAN_REPLY") {
        if (isStoppedOrStale(event.requestId, event.conversationId)) return;
        if (!event.requestId || activeRequestIdRef.current === event.requestId) {
          activeRequestIdRef.current = null;
        }
        setThinkingConvoId((prev) => (prev === event.conversationId ? null : prev));
        setStatusNote(null);
        appendMessage(event.conversationId, {
          id: newId(),
          role: "assistant",
          content: event.reply,
          createdAt: Date.now(),
        });
      } else if (event.type === "TOQAN_OVERLOADED") {
        if (isStoppedOrStale(event.requestId, event.conversationId)) return;
        setStatusNote("Ombre AI is busy — retrying…");
      } else if (event.type === "TOQAN_ERROR") {
        const targetId = event.conversationId ?? activeConvoIdRef.current ?? "";
        if (isStoppedOrStale(event.requestId, targetId)) return;
        if (!event.requestId || activeRequestIdRef.current === event.requestId) {
          activeRequestIdRef.current = null;
        }
        setThinkingConvoId((prev) => (prev === targetId ? null : prev));
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
    async (text: string, forcePageContext?: boolean) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const convo = conversation ?? onEnsureConversation();
      const requestId = newId();
      activeRequestIdRef.current = requestId;
      activeConvoIdRef.current = convo.id;

      // Crucial: Clear any previous stopped state for this conversation so new messages proceed
      stoppedConvosRef.current.delete(convo.id);

      const userMessage: ChatMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };
      const current = conversationsRef.current.get(convo.id) ?? convo.messages;
      const nextMessages = [...current, userMessage];
      conversationsRef.current.set(convo.id, nextMessages);

      const patch: Partial<Conversation> = { messages: nextMessages };
      if (convo.messages.length === 0) patch.title = titleFromMessage(trimmed);
      onUpdateConversation(convo.id, patch);

      setThinkingConvoId(convo.id);
      setStatusNote(null);

      try {
        // The composer toggle controls whether page content is attached.
        // Explicit page questions still work for callers without a toggle.
        const pageIntent = PAGE_INTENT_RE.test(trimmed);
        const shouldUsePageContext = forcePageContext ?? pageIntent;
        const shouldLoadPage = shouldUsePageContext;
        if (shouldLoadPage) {
          setStatusNote("Reading this page…");
          const pageResult = await getPageContent();
          setStatusNote(null);

          // If cancelled or superseded while reading page, exit early
          if (activeRequestIdRef.current !== requestId) return;

          if (pageResult.success) {
            pageContextByConversationRef.current.set(convo.id, pageResult.data);
          } else {
            pageContextByConversationRef.current.delete(convo.id);
            if (pageIntent) {
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
              setThinkingConvoId(null);
              activeRequestIdRef.current = null;
              return;
            }
          }
        }

        if (activeRequestIdRef.current !== requestId) return;

        const pageContext = pageContextByConversationRef.current.get(convo.id);
        const messagesToSend = shouldUsePageContext && pageContext
          ? [...current, { ...userMessage, content: buildContextualMessage(trimmed, pageContext) }]
          : nextMessages;
        await sendChat(messagesToSend, convo.id, requestId);
      } catch (err) {
        if (activeRequestIdRef.current !== requestId) return;
        setThinkingConvoId(null);
        activeRequestIdRef.current = null;
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
    const reqId = activeRequestIdRef.current;
    if (reqId) stoppedRequestIdsRef.current.add(reqId);
    if (convoId) stoppedConvosRef.current.add(convoId);
    activeRequestIdRef.current = null;
    setThinkingConvoId(null);
    setStatusNote(null);
    stopChat(convoId ?? undefined, reqId ?? undefined);
  }, []);

  return { sendMessage, stopGeneration, isThinking, statusNote };
}
