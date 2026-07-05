import { useCallback, useEffect, useState } from "react";
import { getConversations, saveConversations } from "../lib/storage";
import type { Conversation } from "../lib/types";
import { newId } from "../lib/utils";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getConversations().then((list) => {
      setConversations(list);
      setActiveId(list[0]?.id ?? null);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((list: Conversation[]) => {
    setConversations(list);
    saveConversations(list);
  }, []);

  const createConversation = useCallback(() => {
    const convo: Conversation = {
      id: newId(),
      title: "New conversation",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => {
      const list = [convo, ...prev];
      saveConversations(list);
      return list;
    });
    setActiveId(convo.id);
    return convo;
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const list = prev.filter((c) => c.id !== id);
        saveConversations(list);
        if (activeId === id) setActiveId(list[0]?.id ?? null);
        return list;
      });
    },
    [activeId]
  );

  const updateConversation = useCallback((id: string, patch: Partial<Conversation>) => {
    setConversations((prev) => {
      const list = prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c));
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      saveConversations(list);
      return list;
    });
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  return {
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    createConversation,
    deleteConversation,
    updateConversation,
    persist,
    loaded,
  };
}
