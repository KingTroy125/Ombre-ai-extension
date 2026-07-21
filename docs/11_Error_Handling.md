# 11 · Error Handling

## Toqan API failures

- HTTP errors from `create_conversation` are thrown with status + body text and surfaced as a chat-bubble error.
- Overload (200 response, overload phrase in body) is retried automatically ([06 · Expiration & Lifecycle Logic](./06_Expiration_Logic.md)) before being surfaced, distinctly, as `TOQAN_OVERLOADED`.
- Polling timeout (3 minutes) surfaces a generic "still processing" error rather than hanging indefinitely.

## Extension-context invalidation

When the extension is reloaded/updated while a tab is still open, that tab's content script becomes orphaned; calling `chrome.runtime.sendMessage` or `chrome.storage.*` from it throws synchronously ("Extension context invalidated") rather than rejecting normally. Every such call in the content script is routed through `safeSendMessage` / `safeStorageGet` / `safeStorageSet` wrappers that catch this and convert it into an ordinary handleable rejection, backed by a proactive 20-second health check that disables affected UI and shows a refresh notice the moment it's detected.

## Cross-frame relay failures

`chrome.tabs.sendMessage` calls targeting a specific frame (context-menu answers, the Add-to-chat relay) are always wrapped in `.catch(() => {})` — a frame can legitimately be gone (navigation, tab closed) by the time the reply arrives, and that is not an error worth surfacing to the person.

## Speech-recognition errors

The Web Speech API is feature-detected before the mic button is even rendered; `recognition.onerror` simply stops the "listening" state rather than throwing, since transient recognition errors (no speech detected, network blip) shouldn't interrupt the rest of the chat experience.

## Client-side replace/copy failures (text-selection actions)

Replacing text in a contenteditable region uses `document.execCommand` wrapped in try/catch, falling back to copying the clean text to the clipboard if the DOM range restore fails; replacing text in a plain `<input>`/`<textarea>` goes through the framework-safe native-setter trick ([MVP Design Decisions](./MVP_Design_Decisions.md)) rather than `execCommand`, since `execCommand` does not reliably affect form-control values. Both Copy and Replace operate on a markdown-stripped plain-text version of the answer, and Copy falls back from `navigator.clipboard.writeText` to a hidden-textarea `execCommand('copy')` trick if the modern clipboard API throws (some sites block it via Permissions-Policy for embedded contexts).

---
◀ [Environment Variables & Configuration](./10_Environment_Variables.md) · [Index](../README.md#documentation) · Next: [MVP Design Decisions](./MVP_Design_Decisions.md) ▶
