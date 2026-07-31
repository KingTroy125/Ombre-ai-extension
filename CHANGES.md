# Change: new avatar image

Swapped the AI avatar to the new gradient image you provided. Only these 3
files changed — drop them into your project at the same paths, overwriting
what's there, then rebuild.

| Path | What changed |
|---|---|
| `src/assets/ombre-avatar.png` | Replaced — 256×256, used by the popup/side panel (React). |
| `src/assets/ombre-avatar-small.png` | Replaced — 96×96 source used to generate the embedded version below (kept in the repo for reference/regeneration; not directly imported anywhere). |
| `src/content/content-script.ts` | The embedded base64 avatar constant (`OMBRE_AVATAR_DATA_URL`) updated to the new small image — this is what the edge panel actually renders, inlined so the content script doesn't need a separate asset request. |

## How to apply

1. Copy these 3 files into your project, replacing the existing ones at the same paths.
2. From your project root:
   ```bash
   npm run build
   ```
3. Reload the unpacked extension in `chrome://extensions` and refresh any tabs that already had it injected.

No other files were touched.
