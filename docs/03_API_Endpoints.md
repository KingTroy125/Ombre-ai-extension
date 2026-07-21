# 03 · API Endpoints

## External — Toqan API

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/create_conversation` | POST | Starts a turn. Body: `{ user_message, agent_id? }`. Returns `{ conversation_id, request_id }`. |
| `/api/get_answer` | GET | Polled with `?conversation_id=&request_id=` until the answer is ready. Returns `{ status, answer\|response\|content\|... }`. |

`get_answer`'s response shape is read defensively — `extractAnswer()` checks a dozen possible field names (`answer`, `response`, `content`, `text`, `result`, `output`, `reply`, `ai_response`, `message`, `generated_text`, or the last assistant message in a `messages` array) since the exact field isn't guaranteed stable. Overload responses are detected by matching known phrases ("temporarily overloaded", "try again later", etc.) in whatever text does come back, not by status code, since Toqan returns HTTP 200 with an overload message in the body.

## Internal — extension message contract

Treat `chrome.runtime.onMessage` as this extension's real API surface; every message is a discriminated union member of `RuntimeMessage` (`src/lib/types.ts`):

| Message | Direction | Payload | Response / effect |
|---|---|---|---|
| `TOQAN_CHAT` | any surface → background | `{ messages, conversationId, tabId? }` | Background calls Toqan, then pushes `TOQAN_REPLY` / `TOQAN_ERROR` / `TOQAN_OVERLOADED` back to every open extension page and (if `tabId` set) the originating tab. |
| `TOQAN_PING` | any → background | `{}` | `{ status: "ok" }` — liveness check. |
| `OPEN_SETTINGS` | content script → background | `{}` | Opens the options page. |
| `OMBRE_ADD_TO_CHAT` | iframe content script → background | `{ text }` | Relayed to `frameId: 0` of the same tab so the top-frame edge panel can open with that text pre-filled. |

Reply routing: the background worker's `deliver()` helper both broadcasts via `chrome.runtime.sendMessage` (reaching any open popup/side panel) and, if a `tabId` was captured from the sender, calls `chrome.tabs.sendMessage(tabId, event)` — because `runtime.sendMessage` alone never reaches a content script in a tab.

---
◀ [System Architecture](./02_System_Architecture.md) · [Index](../README.md#documentation) · Next: [Storage & Data Design](./04_Storage_Design.md) ▶
