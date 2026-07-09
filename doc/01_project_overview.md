# 01 · Project Overview

Ombre AI is a Manifest V3 Chrome extension that puts a general-purpose AI assistant, backed by the [Toqan API](https://toqan.ai), everywhere a person reads or writes on the web. It ships six distinct surfaces sharing one messaging backbone and one API integration layer:

- **Popup** — a compact 380×520 chat window opened from the toolbar icon.
- **Side panel** — the full-height version of the same chat, with conversation history.
- **Options page** — API key configuration.
- **Edge panel** — a pill docked to the right edge of every page, expanding into a slide-in chat, injected by the content script.
- **Right-click context menu** — "Ask Ombre AI" on any text selection, answered inline.
- **Text-selection toolbar** — a floating action bar (Ask / Improve / Rephrase / Add more / Add to chat) that appears above any text selection, including inside iframes such as Gmail's compose box.

There is no server component owned by this project — "the backend" here means the extension's background service worker, which mediates every AI call, plus the Toqan API it talks to. "The frontend" spans five different rendering contexts (three React-based extension pages and two vanilla-DOM shadow-root UIs), which is the central architectural fact the rest of these documents explain.

## Goals

- Give the person an AI assistant reachable in ≤2 actions from anywhere on the web, not just on a dedicated page.
- Keep a single, consistent dark/purple visual identity across every surface despite three different rendering technologies underneath.
- Survive the realities of running inside arbitrary third-party pages: iframes, SPA re-renders, extension reloads, hostile CSS, and CSP.

## Non-goals (MVP)

- No user accounts or multi-device sync beyond what `chrome.storage.sync` already provides.
- No self-hosted backend, database, or auth server — Toqan is the AI provider of record.
- No automated test suite yet (see [08 · Testing Strategy](./08_Testing_Strategy.md) for the plan to close this gap).

---
◀ [Documentation index](../README.md#documentation) · Next: [Tech Stack Selection](./Tech_Stack_Selection.md) ▶
