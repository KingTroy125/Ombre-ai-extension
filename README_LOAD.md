# Ombre AI — Toqan Chrome Extension

## Load the built extension (fastest way to try it)
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder in this project
5. Click the extension icon → gear icon (or right-click icon → Options) → paste your Toqan API key

## Develop / rebuild from source
```bash
npm install
npm run dev     # HMR dev build, load the generated dist/ folder as unpacked
npm run build   # production build → dist/
```

## Structure
- `src/background` — MV3 service worker: create_conversation/get_answer polling, retry-on-overload backoff, broadcasts replies to whichever view (popup/sidepanel) is open
- `src/content` — shadow-DOM floating panel for the right-click "Ask Ombre AI" context menu action
- `src/popup`, `src/sidepanel`, `src/options` — the three extension surfaces, all sharing the same `Chat` component
- `src/components` — Chat, Sidebar, Message, Markdown, Input, Settings
- `src/hooks` — useChat (message send/receive + retry status), useConversations (persisted history), useSettings
- `src/api/toqan.ts` — thin messaging layer between UI and the background worker
- `src/lib` — types, chrome.storage wrappers, utils
