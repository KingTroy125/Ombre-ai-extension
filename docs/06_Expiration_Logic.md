# 06 · Expiration & Lifecycle Logic

## Retry / backoff on model overload

Toqan occasionally returns a 200 response whose body is an overload message rather than an answer. `callToqanAPI()` retries up to 3 times with linear backoff (5s, 10s, 15s) before surfacing a `TOQAN_OVERLOADED` event to the UI, which keeps the "thinking" indicator visible — with its status word switched to "Retrying" — rather than showing an error, treating overload as a transient condition, not a failure.

## Long-poll timeout

`pollForResult()` polls `get_answer` every 2 seconds for up to 90 attempts (3 minutes total) before giving up and returning `null`, which surfaces as a generic error asking the person to try again.

## Service-worker keep-alive

MV3 service workers can be suspended by Chrome after ~30 seconds of inactivity. During any in-flight request, `startKeepAlive()` calls `chrome.runtime.getPlatformInfo()` every 15 seconds purely as a heartbeat to keep the worker alive until the request resolves; `stopKeepAlive()` clears it immediately after.

## Conversation history trimming

Both conversation stores trim on every persist: the 30 most recently updated conversations are kept, each capped to its 200 most recent messages, so `chrome.storage.local` usage stays bounded regardless of how long the extension has been in use.

## Extension-context health check

A 20-second interval in the content script proactively checks `chrome.runtime.id`; the first time it comes back `undefined` (the extension was reloaded/updated while this tab stayed open), every panel disables its send/mic/history controls and shows a "please refresh this page" notice — rather than waiting for the person to click something and hit a hard, uncaught error.

## Result-card dismissal (deliberately NOT time- or focus-based)

The text-selection result card (Ask / Improve / Rephrase / Add more) does **not** auto-dismiss on outside clicks, page scroll, or a timeout — only its own close (X) button, the Escape key when appropriate, or an explicit follow-up action (e.g. Replace) closes it. This was a deliberate correction: the floating *toolbar* (before an answer exists) still hides on outside click/deselect, since it's a lightweight, disposable prompt — but once an answer has actually been produced, closing it costs the person their result, so it stays until they explicitly dismiss it.

---
◀ [Collision Prevention](./05_Collision_Prevention.md) · [Index](../README.md#documentation) · Next: [Project Structure](./07_Project_Structure.md) ▶
