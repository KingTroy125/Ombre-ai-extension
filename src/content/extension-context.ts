const CONTEXT_INVALIDATED_MESSAGE =
  "Ombre AI was updated. Please refresh this page to keep chatting.";

function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

export function safeSendMessage(message: unknown): Promise<unknown> {
  if (!isExtensionContextValid()) {
    return Promise.reject(new Error(CONTEXT_INVALIDATED_MESSAGE));
  }
  try {
    return chrome.runtime.sendMessage(message);
  } catch {
    return Promise.reject(new Error(CONTEXT_INVALIDATED_MESSAGE));
  }
}

// ── Quick‑bar references (for /‑key global handler) ───────────────────────
export function safeStorageGet(keys: string[]): Promise<Record<string, unknown>> {
  if (!isExtensionContextValid()) return Promise.resolve({});
  try {
    return chrome.storage.local.get(keys);
  } catch {
    return Promise.resolve({});
  }
}

export function safeStorageSet(items: Record<string, unknown>): void {
  if (!isExtensionContextValid()) return;
  try {
    chrome.storage.local.set(items).catch(() => { });
  } catch {
    // context died mid-call — nothing more we can do, next save attempt will just no-op too
  }
}

// Once the context is confirmed dead, stop pretending the UI works: disable
// send/mic controls across every panel and show a one-line "please refresh"
// notice instead of silently failing (or worse, crashing) on the next click.
export const onContextLost: Array<() => void> = [];
export let contextLostFired = false;

export function reportContextLost() {
  if (contextLostFired) return;
  contextLostFired = true;
  onContextLost.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore — best effort UI cleanup
    }
  });
}

// Proactive check every 20s catches the case where the tab just sits open
// with nothing clicked — so the "please refresh" notice appears even before
// the user tries to send anything.
window.setInterval(() => {
  if (!isExtensionContextValid()) reportContextLost();
}, 20000);
