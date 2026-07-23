# Changed files only — avatar + copy/rate feature

These 6 files are everything that changed to add the new avatar image and the
per-message Copy / thumbs-up / thumbs-down actions. Drop each one into your
existing project at the same relative path, overwriting what's there, then
rebuild.

## Files included

| Path | What changed |
|---|---|
| `src/assets/ombre-avatar.png` | New — the gradient blob avatar image (256×256), used by the popup/side panel. |
| `src/lib/types.ts` | Added `rating?: "up" \| "down"` to `ChatMessage`. |
| `src/lib/utils.ts` | Added `stripMarkdown()` — strips markdown syntax so Copy pastes clean plain text. |
| `src/components/Message.tsx` | Assistant messages now show the image avatar instead of a bot icon, plus a Copy / 👍 / 👎 action row under each AI reply. |
| `src/components/Chat.tsx` | Wires a `handleRate()` callback that persists the thumbs up/down choice to the conversation. |
| `src/content/content-script.ts` | Same treatment for the edge panel (the panel injected into web pages): image avatar embedded as a base64 data URI (kept small/inline since this script runs on every page), plus matching Copy/rate buttons on its messages. |

## How to apply

1. Copy these 6 files into your project, replacing the existing ones at the same paths.
2. From your project root:
   ```bash
   npm run build
   ```
3. Reload the unpacked extension in `chrome://extensions` from the fresh `dist/` folder, and refresh any tabs that already had it injected.

## Notes

- Thumbs up/down toggles off if you click the same one again, and persists across reopening the popup/side panel (stored on the message itself in `chrome.storage`).
- Copy strips markdown formatting first, so it pastes clean text rather than literal `**asterisks**`.
- No other files were touched — everything else in your project is unaffected.
