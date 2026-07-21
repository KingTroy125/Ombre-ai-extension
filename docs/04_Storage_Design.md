# 04 · Storage & Data Design

There is no relational database — `chrome.storage` is the persistence layer, split by scope and access pattern.

## `chrome.storage.sync` — settings

```json
{ "apiKey": "string", "agentId": "string", "apiEndpoint": "string" }
```

Small and needs to follow the person's signed-in Chrome profile across devices, so `sync` is the right scope even though it has tighter quota limits than `local`.

## `chrome.storage.local` — popup / side panel conversation history

```ts
interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[]; // { id, role: "user" | "assistant", content, createdAt }
}
```

## `chrome.storage.local` — edge-panel conversation history (separate key)

```ts
toqan_edge_conversations: EdgeConversation[]
// same shape as Conversation, capped independently:
// 30 most-recently-updated conversations, 200 messages each
```

Kept as a second, independent store rather than unifying with the popup/side panel history — see [MVP Design Decisions](./MVP_Design_Decisions.md) for the reasoning.

## Ephemeral, not persisted

- Text-selection toolbar/result-card state (selected text, source element, whether it's editable) — lives only in local JS variables in the content script, cleared on selection change or the card's explicit close action.
- In-flight `conversationId` ↔ UI mapping — used only to route a reply to the right panel while a request is outstanding.

---
◀ [API Endpoints](./03_API_Endpoints.md) · [Index](../README.md#documentation) · Next: [Collision Prevention](./05_Collision_Prevention.md) ▶
