# 10 · Environment Variables & Configuration

There are no build-time environment variables / `.env` files — and deliberately so. This is a client distributed to many separate installs, each needing its own Toqan credential; a secret baked in at build time would ship identically to, and be extractable from, every single install.

## Runtime configuration (per-install, via Settings UI)

| Key | Required | Storage | Notes |
|---|---|---|---|
| `apiKey` | Yes | `chrome.storage.sync` | Entered once via Options; sent as the `X-Api-Key` header on every Toqan call. |
| `agentId` | No | `chrome.storage.sync` | Optional Toqan agent override; omitted from the simplified Settings UI but still respected if present. |
| `apiEndpoint` | No | `chrome.storage.sync` | Defaults to Toqan's `create_conversation` URL; `get_answer` is derived by string-replacing the path segment. |

## Build-time constants

A small number of hardcoded values live directly in source rather than as configuration, since they're implementation details, not per-install settings: retry counts/backoff timings and poll interval/attempts (`background/service-worker.ts`), and conversation-history caps (`content-script.ts`, `useConversations.ts`).

---
◀ [Deployment](./09_Deployment.md) · [Index](../README.md#documentation) · Next: [Error Handling](./11_Error_Handling.md) ▶
