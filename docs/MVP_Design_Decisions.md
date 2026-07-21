# MVP Design Decisions (Milestone 1)

Recorded as lightweight decision records — context, decision, consequence — for the choices future contributors are most likely to question.

## 1. Vanilla TypeScript + Shadow DOM for the content script, not React

Context: the content script runs in every frame of every page the person visits. Decision: hand-rolled DOM manipulation inside closed shadow roots, no framework. Consequence: smaller per-frame footprint and guaranteed style isolation, at the cost of more verbose UI code and a second, simpler markdown renderer instead of reusing react-markdown.

## 2. Two separate conversation stores, not one unified history

Context: popup/side panel and the edge panel both needed persisted, multi-conversation history. Decision: kept as two independent `chrome.storage.local` keys (`conversations` vs `toqan_edge_conversations`) with duplicated-but-simple logic, rather than one shared store with surface-tagging. Consequence: no risk of an edge-panel chat cluttering the side panel's history or vice versa, at the cost of near-duplicate list/new-chat/delete code in two places.

## 3. Polling, not streaming, for Toqan responses

Context: Toqan's API is `create_conversation` + poll `get_answer`, not a streaming endpoint. Decision: accept the polling model as given, invest instead in making the wait feel responsive — a genuine morphing-sparkle thinking indicator with cycling status words, service-worker keep-alive so the wait doesn't get silently dropped, and overload-aware retry so transient failures self-heal without the person noticing. Consequence: no incremental token-by-token rendering, but a materially more reliable end-to-end delivery than a naive single-attempt call.

## 4. `all_frames: true`, with manual duplicate-UI guards, rather than top-frame-only

Context: selection-based features (toolbar, right-click answer) need to work inside iframes like Gmail's compose box; `window.getSelection()` does not cross frame boundaries. Decision: inject into every frame, then explicitly guard the parts that must be singleton (edge panel pill) and explicitly target `frameId` for anything that must not broadcast (context-menu answers, Add-to-chat relay). Consequence: correctness inside iframe-heavy sites, at the cost of needing to reason carefully about "which frame is this code running in" throughout the content script.

## 5. Reactive, not proactive, extension-context-invalidation handling

Context: this failure mode was discovered from a real bug report — an uncaught crash while using the extension in an already-open Gmail tab after a reload — rather than anticipated up front. Decision: rather than patching only the one reported call site, every `chrome.runtime`/`chrome.storage` call in the content script was audited and routed through shared safe wrappers, plus a proactive health check added so the same class of bug can't resurface at a new call site later. Consequence: a small amount of wrapper boilerplate at every call site, in exchange for this entire failure class being closed rather than whack-a-mole'd one crash report at a time.

## 6. Native input event dispatch for the Replace action on form fields

Context: the text-selection "Replace" action needs to work not just in contenteditable regions (where `document.execCommand` applies) but in plain `<input>`/`<textarea>` elements — including ones controlled by frameworks like React on the host page, which patch the `value` property's setter to track changes. Decision: `replaceInField()` calls the native `HTMLInputElement`/`HTMLTextAreaElement` prototype's `value` setter directly (bypassing any framework override) before dispatching a real `input` event, rather than assigning `el.value = ...` directly. Consequence: the replacement is recognized by React-controlled fields on arbitrary host pages, not just plain uncontrolled ones.

## 7. The result card only closes via its own close button, not on outside click

Context: early behavior closed the Ask/Improve/Rephrase/Add more result card the instant the person clicked anywhere else on the page — including clicking elsewhere just to re-read surrounding context, which lost the answer entirely and felt like the feature was broken. Decision: removed the card specifically from the generic outside-click dismiss handler; the floating *toolbar* (shown before an answer exists) still hides on outside click or deselection, since it's a lightweight, disposable prompt, but once a card has an actual answer in it, only its own X button (or an explicit follow-up action like Replace) closes it. Consequence: the person can freely click around the page to reference other content while an answer stays available, at the cost of needing to explicitly close a card before a new selection will bring up a fresh toolbar.

---
◀ [Error Handling](./11_Error_Handling.md) · [Index](../README.md#documentation)
