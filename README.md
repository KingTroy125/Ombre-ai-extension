# Ombre AI

A Manifest V3 Chrome extension that puts an AI assistant — backed by the [Toqan](https://toqan.ai) API — everywhere you read or write on the web: a popup, a side panel, a right-click "Ask Ombre AI" action, and a chat panel that slides in from the edge of any page, with a floating toolbar that appears whenever you select text.

## Features

- **Popup & side panel chat** — full conversation history, multiple chats, markdown-rendered responses (tables, lists, code), smart auto-scroll that only follows the bottom while you're already there, and turn-anchoring so sending a message doesn't jar the whole thread.
- **Edge panel** — a pill docked to the right edge of every page; hover to reveal it, click to slide in a full chat panel. Has its own history, independent from the popup/side panel.
- **Right-click → "Ask Ombre AI"** — select text anywhere, right-click, get an inline answer.
- **Text-selection toolbar** — select any text (including inside iframes like Gmail's compose box, and inside plain `<input>`/`<textarea>` fields) and a floating bar appears: **Ask Ombre**, **Improve**, **Rephrase**, **Add more** (asks what you want to know before answering), and **Add to chat** (sends the selection into the edge panel's input to ask about later). The result card stays open until you close it — clicking elsewhere on the page to reference other content won't lose your answer.
- **Voice input** — a mic button in every chat surface, using the browser's built-in Web Speech API. No extra service, nothing leaves the browser except through Chrome's own speech recognizer.
- **Resilient by design** — automatic retry with backoff when the model is overloaded, a service-worker keep-alive so long requests don't get dropped, and graceful "please refresh this page" handling if the extension is reloaded while a tab is still open (instead of a hard crash).

## Quick start

### Option A — use the prebuilt extension

1. `npm install && npm run build` (see below), or grab a prebuilt `dist/` if you have one.
2. Go to `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `dist/` folder — `manifest.json` should be directly inside it.
3. Click the extension icon → gear icon (or right-click the icon → **Options**) → paste your Toqan API key.

### Option B — develop from source

```bash
npm install
npm run dev      # Vite dev build with HMR — load the generated dist/ as unpacked
npm run build    # production build → dist/
```

After any change to `manifest.json`, `background/`, or `content/`, reload the extension in `chrome://extensions` and **refresh any tabs** that were already open — MV3 service workers and content scripts don't hot-swap into already-loaded tabs.

## Configuration

Settings live in the Options page (gear icon): just a Toqan **API key**. Everything else (agent ID override, custom API endpoint) has a sane default baked in and isn't exposed in the simplified settings UI, but is still respected if set programmatically.

There are no `.env` files or build-time secrets — the API key is a per-install, runtime credential stored in `chrome.storage.sync`, entered once through the UI.

## Project structure

```
toqan-ai/
├── manifest.json          MV3 manifest — permissions, content_scripts, background
├── vite.config.ts         @crxjs/vite-plugin wiring
├── tailwind.config.js     design tokens (oklch, dark-only)
├── src/
│   ├── background/
│   │   └── service-worker.ts   Toqan API calls, retry/backoff, message routing
│   ├── content/
│   │   └── content-script.ts   edge panel, selection toolbar, context-menu panel
│   │                           (vanilla TS + shadow DOM — see "Why no React here?" below)
│   ├── popup/                  Popup.tsx + popup-main.tsx + index.html
│   ├── sidepanel/               SidePanel.tsx + sidepanel-main.tsx + sidepanel.html
│   ├── options/                 Options.tsx + options-main.tsx + options.html
│   ├── components/
│   │   ├── Chat.tsx  Sidebar.tsx  Message.tsx  Markdown.tsx
│   │   └── Input.tsx (send box + mic)   Settings.tsx (API key form)
│   ├── hooks/
│   │   ├── useConversations.ts   useSettings.ts   useSpeechToText.ts
│   ├── lib/
│   │   ├── types.ts     (RuntimeMessage, Conversation, ChatMessage, Settings)
│   │   ├── storage.ts   (typed chrome.storage.sync/local wrappers)
│   │   └── utils.ts     (cn() class-merge helper)
│   ├── api/
│   │   └── toqan.ts     (thin UI ↔ background messaging layer)
│   └── styles/
│       └── globals.css  (design tokens, Tailwind v4 entry)
└── public/icons/         16 / 48 / 128px extension icons
```

## Architecture, in brief

Every surface (popup, side panel, options, edge panel, context-menu panel, selection toolbar) talks to the Toqan API **only** through `background/service-worker.ts` — no surface calls `fetch()` against `api.toqan.ai` directly. That keeps the API key and all retry/backoff/polling logic in one place.

The content script (`src/content/content-script.ts`) is deliberately **not React** — it's hand-rolled TypeScript rendering into closed shadow roots. It runs in every frame of every page you visit (`all_frames: true`, needed so text selection works inside iframes like Gmail's compose box), so keeping its footprint small and its styles fully isolated from the host page mattered more than component ergonomics.

### Entry-file naming — a real gotcha

Every build entry point (`service-worker.ts`, `content-script.ts`, `popup-main.tsx`, `sidepanel-main.tsx`, `options-main.tsx`) has a **globally unique filename**. Two entry files sharing a basename (this project once had both `background/index.ts` and `content/index.ts`) can cause the bundler to wire the compiled output to the wrong chunk — in this case, the service worker ended up loading the content script's code and crashed instantly with `document is not defined`. If you add a new entry point, give it a name no other entry point in the project uses, even in a different folder.

## Documentation

Full technical design documentation lives in [`docs/`](./docs), organized to be read in order:

1. [Project Overview](./docs/01_Project_Overview.md)
   [Tech Stack Selection](./docs/Tech_Stack_Selection.md)
2. [System Architecture](./docs/02_System_Architecture.md)
3. [API Endpoints](./docs/03_API_Endpoints.md)
4. [Storage & Data Design](./docs/04_Storage_Design.md)
5. [Collision Prevention](./docs/05_Collision_Prevention.md)
6. [Expiration & Lifecycle Logic](./docs/06_Expiration_Logic.md)
7. [Project Structure](./docs/07_Project_Structure.md)
8. [Testing Strategy](./docs/08_Testing_Strategy.md)
9. [Deployment](./docs/09_Deployment.md)
10. [Environment Variables & Configuration](./docs/10_Environment_Variables.md)
11. [Error Handling](./docs/11_Error_Handling.md)
    [MVP Design Decisions](./docs/MVP_Design_Decisions.md)

A generated Word-doc version of the same content (`Ombre_AI_Technical_Design_Document.docx`) may also be available alongside this README.

## Known limitations

- No automated test suite yet — quality gating today is `tsc -b` (strict TypeScript) on every build plus manual load-unpacked verification. See [08 · Testing Strategy](./docs/08_Testing_Strategy.md) for the planned Vitest/Playwright setup.
- Toqan's API is polling-based (`create_conversation` + poll `get_answer`), not streaming — responses appear all at once rather than token-by-token.
- Voice input's first-run microphone permission prompt can close the **popup** (Chrome popups lose focus and close when a permission dialog steals focus). The side panel doesn't have this problem. After the first grant, it works normally everywhere.

## License

Not yet decided / add your license here.
