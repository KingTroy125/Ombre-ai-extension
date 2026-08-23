# Fix: spacebar not typing a space (edge panel chat + Add more)

## Root cause

Many sites have a global spacebar shortcut — video play/pause, "page down"
scrolling, slide navigation, etc. To avoid firing while someone is typing,
these handlers typically check `document.activeElement` and skip if a form
field is focused.

But our edge panel and "Add more" textareas live inside a **Shadow DOM**
(needed for style isolation from the host page). Shadow DOM encapsulation
means `document.activeElement`, seen from the host page's own script, only
ever exposes our shadow *host* element (a plain `<div>`) — never the actual
`<textarea>` focused inside it. So the host page's "skip if a field is
focused" check fails, and it calls `preventDefault()` on the spacebar before
our textarea ever gets to type it.

**Verified this diagnosis directly** with a Playwright test simulating a
real host page with exactly that kind of capture-phase spacebar handler:

- `document.activeElement.tagName` → `"DIV"` even while the shadow-DOM
  textarea is genuinely focused (confirms the root cause).
- Without a fix: typing "hello", Space, "world" produced `"helloworld"` —
  the space silently disappears.
- With the fix applied: the same input produced `"hello world"` correctly.

## The fix

Added a shared helper, `guaranteeSpaceKeyWorks()`, attached to both
textareas. On a spacebar keydown, it inserts the space character directly
into the field itself and calls `preventDefault()`/`stopPropagation()` —
so the fix doesn't depend on winning a race against the host page's
listener; it works regardless of what an earlier handler already did to
the event.

Only **1 file** changed.

| Path | What changed |
|---|---|
| `src/content/content-script.ts` | Added `insertTextAtCursor()` and `guaranteeSpaceKeyWorks()` helpers; wired onto the edge panel's chat textarea and the "Add more" input's textarea. |

## How to apply

1. Copy this file into your project at `src/content/content-script.ts`, replacing the existing one.
2. From your project root:
   ```bash
   npm run build
   ```
3. Reload the unpacked extension in `chrome://extensions` and refresh any tabs that already had it injected.

## Scope note

The popup and side panel's chat input were **not** affected by this bug and
weren't changed — they run in the extension's own isolated page (not
injected into a host page's DOM), so there's no host-page spacebar handler
for them to conflict with in the first place.
