# 02 · System Architecture

## Surfaces and the message bus

Every surface talks to the Toqan API only through the background service worker — no surface calls `fetch()` against `api.toqan.ai` directly. This keeps the API key and retry/backoff logic in one place.

```
┌───────────┐  ┌────────────┐  ┌─────────┐
│  Popup    │  │ Side Panel │  │ Options │   (extension pages, React)
└─────┬─────┘  └─────┬──────┘  └────┬────┘
      │  chrome.runtime.sendMessage │
      └──────────────┬──────────────┘
                     ▼
        ┌─────────────────────────┐
        │  background/service-    │  ← the only piece that calls
        │  worker.ts (MV3 worker) │     the Toqan API
        └────────────┬────────────┘
                     │ fetch()
                     ▼
            Toqan API (external)

                     ▲
     chrome.tabs.sendMessage(tabId, ..., {frameId})
                     │
        ┌────────────┴────────────┐
        │   content-script.ts     │  (vanilla TS, one instance
        │   (edge panel / toolbar │   per frame — all_frames: true)
        │   / context-menu panel) │
        └─────────────────────────┘
```

## Why the content script runs in every frame

`manifest.json` sets `"all_frames": true` on the content script. This was added specifically so text selection works inside iframes — e.g. Gmail's compose box is a same-origin iframe, and the Selection API (`window.getSelection()`) does not cross frame boundaries. Two consequences had to be designed around:

- The edge-panel pill/chat only ever initializes once, guarded by `if (window.self !== window.top) return;` — otherwise every iframe on a page (including invisible ad/tracker iframes) would spawn its own floating pill.
- The right-click "Ask Ombre AI" answer and the "Add to chat" relay both target a specific `frameId` (`info.frameId` from the context-menu event, or `frameId: 0` for "send to top frame") instead of `chrome.tabs.sendMessage`'s default of broadcasting to all frames.

## Cross-context bridges

Two bridges exist because the edge panel (top-frame only) sometimes needs to be reached from code running in a different frame:

- `edgePanelOpenWithText` — an in-memory function reference set by the top frame's own content-script instance; called directly when already in the top frame.
- `OMBRE_ADD_TO_CHAT` message — used when "Add to chat" is clicked from inside an iframe; the background worker relays it to `frameId: 0` of the same tab, where the real edge panel lives.

---
◀ [Tech Stack Selection](./Tech_Stack_Selection.md) · [Index](../README.md#documentation) · Next: [API Endpoints](./03_API_Endpoints.md) ▶
