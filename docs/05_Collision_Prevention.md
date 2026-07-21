# 05 · Collision Prevention

Three distinct kinds of collision were identified and designed against during development.

## 1. Build-time chunk-naming collision (real incident)

`src/background/index.ts` and `src/content/index.ts` shared the literal filename `index.ts`. The CRXJS/Rollup output naming collided, and the compiled `service-worker-loader.js` ended up importing the content script's compiled chunk instead of the background's — the service worker then crashed with `Uncaught ReferenceError: document is not defined` the moment it ran (a service worker has no `document`).

**Fix:** every entry file was renamed to something globally unique — `service-worker.ts`, `content-script.ts`, `popup-main.tsx`, `sidepanel-main.tsx`, `options-main.tsx`. General rule adopted going forward: no two entry points in `manifest.json`/vite config may share a basename, regardless of directory.

## 2. Conversation / request ID collisions

Every chat request carries a `conversationId` so a reply can be routed back to the exact panel and conversation that asked. IDs are generated as timestamp + random suffix (e.g. `edge-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, `sel-${Date.now()}-${...}`) rather than a plain counter, so two panels opened in the same millisecond in different tabs/frames never collide. Replies are matched strictly by `conversationId`, not by "whichever panel is currently open" — this also means a reply for a conversation the person has since navigated away from is safely dropped rather than misdelivered to the wrong thread.

## 3. Multi-frame UI collisions

Covered in detail in [02 · System Architecture](./02_System_Architecture.md), but summarized here as a collision-prevention concern: `all_frames: true` means the content script runs once per frame. Without guards, this produces (a) one edge-panel pill per iframe on a page, and (b) one "Ask Ombre AI" answer panel per frame when the background broadcasts. Both are prevented — (a) via a top-frame-only guard, (b) via explicit `frameId` targeting using the context-menu event's own `info.frameId`.

---
◀ [Storage & Data Design](./04_Storage_Design.md) · [Index](../README.md#documentation) · Next: [Expiration & Lifecycle Logic](./06_Expiration_Logic.md) ▶
