export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  pending?: boolean;
  error?: string;
  /** Thumbs up/down feedback the person gave on an assistant message. */
  rating?: "up" | "down";
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ToqanSettings {
  apiKey: string;
  agentId: string;
  apiEndpoint: string;
}

export const DEFAULT_SETTINGS: ToqanSettings = {
  apiKey: "",
  agentId: "",
  apiEndpoint: "https://api.toqan.ai/api/create_conversation",
};

/** Messages exchanged between UI (popup/sidepanel/content) and the background service worker. */
export type RuntimeMessage =
  | { type: "TOQAN_CHAT"; messages: ChatMessage[]; conversationId: string; tabId?: number }
  | { type: "TOQAN_PING" }
  | { type: "OPEN_SETTINGS" }
  | { type: "OMBRE_ADD_TO_CHAT"; text: string };

export type RuntimeEvent =
  | { type: "TOQAN_REPLY"; reply: string; conversationId: string }
  | { type: "TOQAN_ERROR"; error: string; conversationId?: string; conversationIdForContext?: string }
  | { type: "TOQAN_OVERLOADED"; message: string; conversationId: string }
  | { type: "TOQAN_CONTEXT_RESPONSE"; query: string; response: string }
  | { type: "TOQAN_CONTEXT_ERROR"; error: string };
