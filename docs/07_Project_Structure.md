# 07 · Project Structure

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
│   │                           (all vanilla TS + shadow DOM, one file)
│   ├── popup/                  Popup.tsx + popup-main.tsx + index.html
│   ├── sidepanel/               SidePanel.tsx + sidepanel-main.tsx + sidepanel.html
│   ├── options/                 Options.tsx + options-main.tsx + options.html
│   ├── components/
│   │   ├── Chat.tsx  Sidebar.tsx  Message.tsx  Markdown.tsx
│   │   ├── ThinkingIndicator.tsx (morphing sparkle + cycling status word)
│   │   ├── Input.tsx (send box + mic)   Settings.tsx (API key form)
│   ├── hooks/
│   │   ├── useConversations.ts   useSettings.ts   useSpeechToText.ts
│   │   └── useStickyScroll.ts   (pin-to-bottom + turn anchoring)
│   ├── lib/
│   │   ├── types.ts     (RuntimeMessage, Conversation, ChatMessage, Settings)
│   │   ├── storage.ts   (typed chrome.storage.sync/local wrappers)
│   │   └── utils.ts     (cn() class merge helper)
│   ├── api/
│   │   └── toqan.ts     (thin UI ↔ background messaging layer)
│   └── styles/
│       └── globals.css  (design tokens, Tailwind v4 entry, thinking-indicator CSS)
└── public/icons/         16 / 48 / 128px extension icons
```

---
◀ [Expiration & Lifecycle Logic](./06_Expiration_Logic.md) · [Index](../README.md#documentation) · Next: [Testing Strategy](./08_Testing_Strategy.md) ▶
