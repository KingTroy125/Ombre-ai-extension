# Tech Stack Selection

Two different frontend stacks are used deliberately, not by accident.

## Extension pages (popup, side panel, options)

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18 + TypeScript | Stateful, componentized UI; conversation list, message stream, settings form. |
| Bundler | Vite + `@crxjs/vite-plugin` | crxjs understands MV3 manifests natively — generates the service-worker loader, content-script loaders, and `web_accessible_resources` automatically. |
| Styling | Tailwind CSS v4 | Utility-first, matches the supplied oklch design-token system; v4's `@config` directive kept the existing JS config working. |
| Icons | lucide-react | Feather-style stroke icons matching the design language. |
| Markdown | react-markdown + remark-gfm | Full CommonMark + GFM (tables, task lists) for AI responses. |

## Content script (edge panel, selection toolbar, context-menu panel)

Deliberately **not** React. Three reasons:

1. **Footprint** — this script runs on every single page the person visits (`all_frames: true`). Shipping React + ReactDOM into every tab, every iframe, every ad frame is real, unnecessary memory/CPU cost multiplied by however many frames a page has.
2. **Isolation** — each UI (edge panel, selection popup, context panel) is mounted in its own closed shadow root (`attachShadow({ mode: "open" })`) so the host page's CSS can never leak in, and our CSS can never leak out onto the host page. React's rendering model adds no value inside an already-isolated shadow tree.
3. **Simplicity of the actual UI** — these are small, mostly template-string DOM trees with a handful of event listeners; hand-rolled vanilla TypeScript is less code than wiring a React root, portal, and shadow-DOM-aware style injection would be.

Trade-off accepted: no react-markdown in the content script, so a small hand-written markdown-lite renderer (bold, italic, inline code, bulleted/numbered lists, paragraph breaks) covers what the Toqan API actually returns, without the dependency.

## AI provider & voice

- **Toqan API** (`create_conversation` + `get_answer` polling) — the actual language model backend.
- **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) — native browser speech-to-text for the mic button; no extra service, no audio leaves the browser except via the browser's own built-in recognizer.

## Persistence

- `chrome.storage.sync` — API key and settings (small, needs to follow the signed-in user).
- `chrome.storage.local` — conversation history (larger, per-device is fine, avoids sync quota pressure).

---
◀ [Project Overview](./01_Project_Overview.md) · [Index](../README.md#documentation) · Next: [System Architecture](./02_System_Architecture.md) ▶
