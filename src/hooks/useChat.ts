import { useCallback, useEffect, useRef, useState } from "react";
import { onRuntimeEvent, sendChat, stopChat } from "../api/toqan";
import type { ChatMessage, Conversation } from "../lib/types";
import { newId, titleFromMessage } from "../lib/utils";

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
      const nextMessages = [...current, userMessage];
      conversationsRef.current.set(convo.id, nextMessages);

      const patch: Partial<Conversation> = { messages: nextMessages };
      if (convo.messages.length === 0) patch.title = titleFromMessage(trimmed);
      onUpdateConversation(convo.id, patch);

      setIsThinking(true);
      setStatusNote(null);
      activeConvoIdRef.current = convo.id;

      try {
        await sendChat(nextMessages, convo.id);
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
