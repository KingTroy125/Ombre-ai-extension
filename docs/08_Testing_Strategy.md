# 08 · Testing Strategy

## Current state (honest assessment)

There is no automated test suite yet. Quality gating today is: TypeScript strict mode (`tsc -b`) on every build, plus manual load-unpacked verification after each change. This is adequate for the MVP's pace of iteration but is a known gap to close before wider distribution.

## Recommended test pyramid going forward

### Unit tests (Vitest)

- `lib/storage.ts`, `lib/types.ts` helpers, and the markdown-lite renderer (`renderMarkdownLite` / `inlineMarkdown` / `stripMarkdownForCopy`) in `content-script.ts` — pure functions, easy to test in isolation against fixture strings including the exact kind of markdown Toqan returns.
- Conversation-trimming logic (30 conversations / 200 messages caps) and title-generation (`titleFrom()`).

### Integration tests

- Mock the `chrome.*` namespace (e.g. with `sinon-chrome` or a hand-rolled stub) to test `background/service-worker.ts`'s message routing, retry/backoff timing, and the `deliver()` dual-broadcast (extension pages + tab) without a real browser.

### End-to-end tests (Playwright)

- Playwright supports loading unpacked MV3 extensions via a persistent browser context — drive the popup, side panel, and content-script UIs against real (or mocked-via-route-interception) Toqan API responses.
- Priority scenarios: send a message end-to-end in the popup; open/close the edge panel; select text on a plain page vs. inside an iframe (a Gmail-like fixture) and confirm the toolbar appears and each action responds; confirm the result card stays open through an outside click and only closes via its own X; simulate extension-context invalidation and confirm the "please refresh" banner appears instead of a crash.

### Manual QA checklist (until the above lands)

1. Fresh install → Settings → API key saved → popup sends and receives a reply.
2. Side panel: new chat, switch between conversations, delete a conversation.
3. Edge panel: pill appears on hover, opens/closes, new chat + history work, mic transcribes, markdown renders (bold/lists) correctly, jump-to-latest button appears after scrolling up during a reply.
4. Right-click "Ask Ombre AI" on a plain page and inside an iframe-heavy page (e.g. Gmail) — answer appears once, in the correct frame.
5. Select text you just typed in: a plain page, a `<textarea>`, an `<input>`, a contenteditable div, and Gmail's compose box — toolbar appears in all five, each action works, Replace works where editable, Copy produces clean plain text (no stray markdown).
6. Open a result card (Improve/Rephrase/etc.), click elsewhere on the page — confirm the card stays open — then click its X — confirm it closes.
7. Reload the extension with a tab already open, then interact with that tab without refreshing — confirm the graceful "please refresh" state, not a console crash.

---
◀ [Project Structure](./07_Project_Structure.md) · [Index](../README.md#documentation) · Next: [Deployment](./09_Deployment.md) ▶
