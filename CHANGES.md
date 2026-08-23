# Change: removed the border-beam effect

The animated border beam added to the result card rendered incorrectly in
practice — checking your screenshot's actual pixel data, the beam ring was
only partially visible right along the top edge, cutting across the header
area (title + close button) instead of sitting cleanly at the card's outer
border. Rather than iterate further on a decorative effect that isn't
working reliably, this reverts it entirely.

Only **1 file** changed.

| Path | What changed |
|---|---|
| `src/content/content-script.ts` | Removed the `.card::before` beam rule, its `@keyframes`, the `@property` declaration, and the `isolation: isolate` it needed — restoring the plain `1px solid rgba(255,255,255,0.08)` card border from before. Verified the rebuilt file is byte-for-byte identical to the pre-beam version (matching compiled-chunk hash). |

## How to apply

1. Copy this file into your project at `src/content/content-script.ts`, replacing the existing one.
2. From your project root:
   ```bash
   npm run build
   ```
3. Reload the unpacked extension in `chrome://extensions` and refresh any tabs that already had it injected.

## If "doesn't show right" meant something else

I read your screenshot as the beam cutting across the header — if instead
you meant the numbered list text getting cut off at the bottom of the card
(item 4 trails off without a clear "there's more, scroll down" cue), let me
know and I'll fix that separately — it's a different, unrelated issue in
the card's scroll/overflow behavior.
