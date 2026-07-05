import type { ChatMessage, RuntimeEvent } from "../lib/types";

const hasRuntime = typeof chrome !== "undefined" && !!chrome.runtime?.id;

/**
 * Sends a chat turn to the background worker, which owns all Toqan API
 * calls (create_conversation / get_answer polling, retry-on-overload, etc).
 * Resolves once the background has ACKed receipt — the actual reply comes
 * back asynchronously through onReply/onError/onOverloaded below.
 */
export async function sendChat(messages: ChatMessage[], conversationId: string): Promise<void> {
  if (!hasRuntime) {
    // Local dev fallback outside the extension shell, so the UI is still testable.
    window.dispatchEvent(
      new CustomEvent("toqan:mock-reply", { detail: { conversationId } })
    );
    return;
  }
  await chrome.runtime.sendMessage({
    type: "TOQAN_CHAT",
    messages,
    conversationId,
  });
}

export function pingBackground(): Promise<boolean> {
  if (!hasRuntime) return Promise.resolve(false);
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "TOQAN_PING" }, (res) => {
      resolve(!!res && res.status === "ok");
    });
  });
}

export function openSettingsPage() {
  if (!hasRuntime) return;
  chrome.runtime.sendMessage({ type: "OPEN_SETTINGS" });
}

/** Subscribes to reply/error/overloaded events pushed from the background worker. */
export function onRuntimeEvent(handler: (event: RuntimeEvent) => void): () => void {
  if (!hasRuntime) return () => {};
  const listener = (message: RuntimeEvent) => handler(message);
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
