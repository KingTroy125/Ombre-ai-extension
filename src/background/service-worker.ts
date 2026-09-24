// background/index.ts — Ombre AI Assistant service worker (MV3)
import type { ChatMessage, RuntimeMessage } from "../lib/types";
import { migrateSyncToLocal } from "../lib/storage";

const TOQAN_GET_ANSWER_URL = "https://api.toqan.ai/api/get_answer";
const DEFAULT_CREATE_URL = "https://api.toqan.ai/api/create_conversation";
const CONTEXT_MENU_ID = "toqan-ask-selected";
const ADD_TO_CHAT_QUEUE_KEY = "ombrePendingAddToChat";

interface PendingAddToChat {
  id: string;
  text: string;
}

let addToChatQueueOperations: Promise<void> = Promise.resolve();
let drainingAddToChatQueue = false;

function updateAddToChatQueue(update: (queue: PendingAddToChat[]) => PendingAddToChat[]): Promise<void> {
  const operation = addToChatQueueOperations.then(async () => {
    const stored = await chrome.storage.session.get(ADD_TO_CHAT_QUEUE_KEY);
    const queue = Array.isArray(stored[ADD_TO_CHAT_QUEUE_KEY])
      ? stored[ADD_TO_CHAT_QUEUE_KEY] as PendingAddToChat[]
      : [];
    await chrome.storage.session.set({ [ADD_TO_CHAT_QUEUE_KEY]: update(queue) });
  });
  addToChatQueueOperations = operation.catch(() => undefined);
  return operation;
}

async function drainAddToChatQueue(): Promise<void> {
  if (drainingAddToChatQueue) return;
  drainingAddToChatQueue = true;
  try {
    while (true) {
      await addToChatQueueOperations;
      const stored = await chrome.storage.session.get(ADD_TO_CHAT_QUEUE_KEY);
      const queue = Array.isArray(stored[ADD_TO_CHAT_QUEUE_KEY])
        ? stored[ADD_TO_CHAT_QUEUE_KEY] as PendingAddToChat[]
        : [];
      const pending = queue[0];
      if (!pending) return;

      try {
        const response = await chrome.runtime.sendMessage({
          type: "OMBRE_ADD_TO_CHAT",
          text: pending.text,
          requestId: pending.id,
        });
        if (response?.received !== pending.id) return;
      } catch {
        // The panel may still be mounting. Its ready message retries delivery.
        return;
      }

      await updateAddToChatQueue((items) => items.filter((item) => item.id !== pending.id));
    }
  } finally {
    drainingAddToChatQueue = false;
  }
}

void migrateSyncToLocal().catch(() => undefined);

// ── Overload detection ────────────────────────────────────────────────────

const OVERLOAD_PHRASES = [
  "temporarily overloaded",
  "try again later",
  "model is overloaded",
  "please try again",
  "start a new conversation",
];

function isOverloadMessage(text?: string | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return OVERLOAD_PHRASES.some((phrase) => lower.includes(phrase));
}

function stripThinkingBlocks(text?: string | null): string {
  if (!text) return text ?? "";
  return text
    .replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();
}

// ── Keep MV3 service worker alive during long API polling ────────────────

let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

function keepAlive() {
  try {
    chrome.runtime.getPlatformInfo(() => {});
  } catch (_) {
    /* noop */
  }
}

function startKeepAlive() {
  if (keepAliveInterval) return;
  keepAlive();
  keepAliveInterval = setInterval(keepAlive, 15000);
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

const PROCESSING_STATUSES = new Set([
  "in_progress", "processing", "pending", "generating",
  "running", "queued", "started", "waiting",
]);

const FINISHED_STATUSES = new Set([
  "finished", "completed", "complete", "done", "success", "succeeded",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAnswer(data: any): string | null {
  if (!data || typeof data !== "object") return null;

  const candidates = [
    data.answer,
    data.response,
    data.content,
    data.text,
    data.result,
    data.output,
    data.reply,
    data.ai_response,
    data.message,
    data.generated_text,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.messages && data.messages.filter((m: any) => m.role === "assistant").pop()?.content,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      const cleaned = stripThinkingBlocks(value);
      if (cleaned && cleaned.trim()) return cleaned.trim();
    }
  }
  return null;
}

function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 20000,
  externalSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Combine the per-call timeout with the caller's cancel signal so a
  // "stop generating" tap tears down in-flight network work immediately.
  const signal = externalSignal
    ? typeof AbortSignal.any === "function"
      ? AbortSignal.any([controller.signal, externalSignal])
      : controller.signal
    : controller.signal;
  return fetch(url, { ...options, signal }).finally(() => clearTimeout(timer));
}

// ── Cancellation registry ─────────────────────────────────────────────────
// One AbortController per conversationId so the UI can stop an in-flight
// generation ("stop generating"). Stopped requests tear down their pending
// fetches immediately and deliver no reply/error events afterwards.

interface ActiveRequest {
  controller: AbortController;
  cancelled: boolean;
}

const activeRequests = new Map<string, ActiveRequest>();

function cancelActiveRequests(conversationId?: string) {
  const targets = conversationId
    ? [activeRequests.get(conversationId)].filter((r): r is ActiveRequest => !!r)
    : [...activeRequests.values()];
  for (const request of targets) {
    request.cancelled = true;
    request.controller.abort();
  }
}

function settleActiveRequest(conversationId: string) {
  activeRequests.delete(conversationId);
  if (activeRequests.size === 0) stopKeepAlive();
}

// ── Context menu setup ─────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  // onInstalled fires for updates as well as first install; the old menu can
  // still exist, so remove it before recreating it to avoid duplicate IDs.
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.warn("[Toqan] Could not reset context menus:", chrome.runtime.lastError.message);
      return;
    }
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Ask Ombre AI: "%s"',
      contexts: ["selection"],
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn("[Toqan] Could not create context menu:", chrome.runtime.lastError.message);
      }
    });
  });
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) return;

  const selectedText = info.selectionText;
  if (!selectedText) return;

  // With the content script now injected into every frame (needed so text
  // selection works inside iframes like Gmail's compose box), the response
  // must go back to the exact frame the selection happened in — otherwise
  // it'd broadcast to every frame on the page, popping up duplicate panels
  // in ad/tracker iframes too.
  const frameId = info.frameId ?? 0;

  startKeepAlive();
  try {
    const result = await callToqanAPI(selectedText);
    if (result.reply) {
      await chrome.tabs
        .sendMessage(
          tab.id,
          { type: "TOQAN_CONTEXT_RESPONSE", query: selectedText, response: result.reply },
          { frameId }
        )
        .catch((err) => console.warn("[Toqan] tab not ready:", err.message));
    } else {
      await chrome.tabs
        .sendMessage(
          tab.id,
          { type: "TOQAN_CONTEXT_ERROR", error: result.error || "No response received from Ombre AI." },
          { frameId }
        )
        .catch((err) => console.warn("[Toqan] tab not ready:", err.message));
    }
  } catch (err) {
    await chrome.tabs
      .sendMessage(tab.id, { type: "TOQAN_CONTEXT_ERROR", error: (err as Error).message }, { frameId })
      .catch((e) => console.warn("[Toqan] tab not ready:", e.message));
  } finally {
    stopKeepAlive();
  }
});

// ── Message listener (from popup/sidepanel/content) ───────────────────────

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  if (message.type === "TOQAN_CHAT") {
    sendResponse({ status: "processing" });
    // If this came from a content script, sender.tab.id is set — replies get
    // routed back to that tab in addition to any open popup/sidepanel/options page.
    const originTabId = sender.tab?.id ?? message.tabId;
    handleChatMessageAsync(message.messages, message.conversationId, originTabId);
    return false;
  }

  if (message.type === "TOQAN_PING") {
    sendResponse({ status: "ok" });
    return false;
  }

  if (message.type === "OMBRE_ADD_TO_CHAT") {
    const tabId = sender.tab?.id;
    if (!message.text.trim() || tabId == null) {
      sendResponse({ ok: false, error: "Could not read the selected text or identify its tab." });
      return false;
    }

    const requestId = `${Date.now()}-${Math.random()}`;
    // Invoke open immediately while the originating selection click is still
    // a user gesture. Queue persistence and panel delivery can finish after.
    const openPanel = chrome.sidePanel.open({ tabId });
    void updateAddToChatQueue((queue) => [...queue, { id: requestId, text: message.text }])
      .then(() => drainAddToChatQueue())
      .catch((error: Error) => console.error("[Toqan] Could not queue selected text:", error));

    openPanel.then(() => sendResponse({ ok: true })).catch((error: Error) => {
      console.error("[Toqan] Could not open chat panel for selected text:", error);
      sendResponse({ ok: false, error: error.message || "Could not open the chat panel." });
    });
    return true;
  }

  if (message.type === "OMBRE_SIDE_PANEL_READY") {
    sendResponse({ ok: true });
    void drainAddToChatQueue().catch((error: Error) => {
      console.error("[Toqan] Could not deliver selected text:", error);
    });
    return false;
  }

  if (message.type === "TOQAN_STOP") {
    cancelActiveRequests(message.conversationId);
    sendResponse({ status: "ok" });
    return false;
  }

  if (message.type === "OPEN_SETTINGS") {
    const openPage = chrome.runtime.openOptionsPage
      ? chrome.runtime.openOptionsPage()
      : chrome.tabs.create({ url: chrome.runtime.getURL("options.html") }).then(() => undefined);
    openPage.then(() => sendResponse({ ok: true })).catch((error: Error) => {
      console.error("[Toqan] Could not open settings:", error);
      sendResponse({ ok: false, error: error.message || "Could not open settings." });
    });
    return true;
  }

  if (message.type === "OMBRE_OPEN_SIDEPANEL") {
    // Content scripts can't call chrome.sidePanel.open() themselves — open
    // the side panel (the Chrome UI, i.e. the "main chat") for this window.
    const tabId = sender.tab?.id;
    const windowId = sender.tab?.windowId;
    const openPanel = tabId != null
      ? chrome.sidePanel.open({ tabId })
      : windowId != null
        ? chrome.sidePanel.open({ windowId })
        : Promise.reject(new Error("Could not identify the active browser tab."));
    openPanel.then(() => sendResponse({ ok: true })).catch((error: Error) => {
      console.error("[Toqan] Could not open chat panel:", error);
      sendResponse({ ok: false, error: error.message || "Could not open the chat panel." });
    });
    return true;
  }

  if (message.type === "OMBRE_INSERT_NOTE") {
    const tabId = sender.tab?.id;
    if (tabId != null) {
      chrome.tabs.sendMessage(tabId, { type: "OMBRE_INSERT_NOTE", text: message.text }).catch(() => {});
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeId = tabs[0]?.id;
        if (activeId != null) {
          chrome.tabs.sendMessage(activeId, { type: "OMBRE_INSERT_NOTE", text: message.text }).catch(() => {});
        }
      });
    }
    sendResponse({ status: "ok" });
    return false;
  }

  if (message.type === "OMBRE_GET_PAGE_CONTENT") {
    // Must return true so the channel stays open until the async response fires.
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        sendResponse({ success: false, error: "No active tab found." });
        return;
      }
      // chrome.scripting.executeScript is available in MV3 with the
      // "scripting" permission — it never needs the content script to be
      // pre-injected, so it works on any page.
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            title: document.title,
            url: location.href,
            // Grab innerText of the body; strip excessive whitespace and cap length.
            text: (document.body?.innerText ?? "")
              .replace(/[ \t]{2,}/g, " ")
              .replace(/\n{3,}/g, "\n\n")
              .trim()
              .slice(0, 15000),
          }),
        });
        const result = results?.[0]?.result as { title: string; url: string; text: string } | undefined;
        if (result) {
          sendResponse({ success: true, data: result });
        } else {
          sendResponse({ success: false, error: "Could not read page content." });
        }
      } catch (err) {
        sendResponse({ success: false, error: (err as Error).message || "Script execution failed." });
      }
    });
    return true; // keep channel open for async sendResponse
  }
});

// Keep the action click behavior as the browser default so the popup can open.
// If the user wants the side panel, they can open it from the UI instead of
// intercepting the extension icon action and blocking the popup.

// ── Async handler broadcasting replies to all extension views ────────────

async function handleChatMessageAsync(messages: ChatMessage[], conversationId: string, tabId?: number) {
  startKeepAlive();
  const controller = new AbortController();
  activeRequests.set(conversationId, { controller, cancelled: false });
  try {
    const lastUserMessage =
      messages.filter((m) => m.role === "user").map((m) => m.content).pop() || "";

    const result = await callToqanAPI(lastUserMessage, controller.signal);

    // The user hit "stop" while we were working — drop everything quietly
    // instead of appending a reply/error to a conversation they abandoned.
    if (controller.signal.aborted) return;

    if (result.overloaded) {
      deliver({ type: "TOQAN_OVERLOADED", message: result.error!, conversationId }, tabId);
    } else if (result.reply) {
      deliver({ type: "TOQAN_REPLY", reply: result.reply, conversationId }, tabId);
    } else {
      deliver({ type: "TOQAN_ERROR", error: result.error || "Unknown error", conversationId }, tabId);
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    deliver({ type: "TOQAN_ERROR", error: (err as Error).message, conversationId }, tabId);
  } finally {
    settleActiveRequest(conversationId);
  }
}

/** Sends to any open extension views (popup/sidepanel/options) AND, if this
 *  chat originated from a content script, to that tab as well. */
function deliver(event: Record<string, unknown>, tabId?: number) {
  broadcast(event);
  if (tabId != null) {
    chrome.tabs.sendMessage(tabId, event).catch(() => {
      // Tab navigated away or content script not present — safe to ignore.
    });
  }
}

function broadcast(event: Record<string, unknown>) {
  chrome.runtime.sendMessage(event).catch(() => {
    // No listeners currently open (popup closed) — safe to ignore.
  });
}

// ── API call logic ─────────────────────────────────────────────────────────

interface ToqanCallResult {
  reply?: string;
  error?: string;
  overloaded?: boolean;
  conversationId?: string;
  requestId?: string;
}

async function callToqanAPI(userMessage: string, signal?: AbortSignal): Promise<ToqanCallResult> {
  const settings = await chrome.storage.local.get(["toqan_settings"]);
  const stored: { apiKey?: string; agentId?: string; apiEndpoint?: string } =
    settings["toqan_settings"] || {};

  const apiKey: string = stored.apiKey || "";
  const agentId: string = stored.agentId || "";
  const createUrl: string = stored.apiEndpoint || DEFAULT_CREATE_URL;

  if (!apiKey) {
    throw new Error("API key not configured. Please open the extension settings.");
  }

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) return { error: "cancelled" };
    if (attempt > 0) {
      console.log(`[Toqan] Retrying (attempt ${attempt}/${MAX_RETRIES}) after overload...`);
      await new Promise((r) => setTimeout(r, 5000 * attempt));
      if (signal?.aborted) return { error: "cancelled" };
    }

    const singleResult = await callToqanAPIOnce(apiKey, agentId, userMessage, createUrl, signal);

    if (singleResult?.reply && !isOverloadMessage(singleResult.reply)) {
      return { reply: singleResult.reply };
    }

    if (singleResult?.reply && isOverloadMessage(singleResult.reply)) {
      if (attempt === MAX_RETRIES) {
        return { overloaded: true, error: singleResult.reply || "The Ombre AI model is temporarily overloaded." };
      }
      console.log("[Toqan] Overload detected, will retry...");
      continue;
    }

    return singleResult || { error: "Connected to Ombre AI API but could not receive response." };
  }
  return { error: "Connected to Ombre AI API but could not receive response." };
}

function getAnswerUrl(createUrl: string): string {
  if (createUrl.includes("create_conversation")) {
    return createUrl.replace("create_conversation", "get_answer");
  }
  return TOQAN_GET_ANSWER_URL;
}

async function callToqanAPIOnce(
  apiKey: string,
  agentId: string,
  userMessage: string,
  createUrl: string,
  signal?: AbortSignal
): Promise<ToqanCallResult> {
  const getAnswerUrlResolved = getAnswerUrl(createUrl);

  const requestBody: Record<string, string> = { user_message: userMessage };
  if (agentId) requestBody.agent_id = agentId;

  const createResp = await fetchWithTimeout(
    createUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify(requestBody),
    },
    20000,
    signal
  );

  if (!createResp.ok) {
    const errText = await createResp.text();
    throw new Error(`Toqan API error ${createResp.status}: ${errText}`);
  }

  const createData = await createResp.json();
  console.log("[Toqan] create_conversation response:", createData);

  const conversationId = createData.conversation_id;
  const requestId = createData.request_id;

  if (!conversationId && !requestId) {
    return { error: "Failed to create conversation: " + JSON.stringify(createData) };
  }

  console.log("[Toqan] Polling for response...");
  const result = await pollForResult(conversationId, requestId, apiKey, getAnswerUrlResolved, signal);

  if (result?.reply) {
    return { reply: result.reply };
  }

  return {
    error:
      "Connected to Ombre AI API but could not retrieve a response. The AI may still be processing — please try again in a moment.",
    conversationId,
    requestId,
  };
}

async function pollForResult(
  conversationId: string,
  requestId: string,
  apiKey: string,
  getAnswerUrlResolved: string,
  signal?: AbortSignal
): Promise<{ reply?: string; error?: string } | null> {
  const pollUrl = `${getAnswerUrlResolved}?conversation_id=${encodeURIComponent(conversationId)}&request_id=${encodeURIComponent(requestId)}`;

  const MAX_ATTEMPTS = 90;
  const POLL_INTERVAL_MS = 2000;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (signal?.aborted) return null;
    if (i > 0) await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    if (signal?.aborted) return null;
    keepAlive();

    try {
      const resp = await fetchWithTimeout(pollUrl, { headers: { "X-Api-Key": apiKey } }, 20000, signal);

      if (resp.status === 404 || resp.status === 202) {
        console.log(`[Toqan] Poll attempt ${i + 1}: not ready (${resp.status})`);
        continue;
      }

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        console.warn(`[Toqan] Poll attempt ${i + 1} failed: ${resp.status} ${errText.slice(0, 120)}`);
        continue;
      }

      const data = await resp.json();
      console.log(`[Toqan] Poll attempt ${i + 1}:`, JSON.stringify(data).slice(0, 240));

      const status = String(data.status || "").toLowerCase();
      const answer = extractAnswer(data);

      if (answer && (FINISHED_STATUSES.has(status) || !PROCESSING_STATUSES.has(status))) {
        return { reply: answer };
      }

      if (PROCESSING_STATUSES.has(status)) {
        console.log(`[Toqan] Still processing (status: ${status})`);
        continue;
      }

      if (data.error) {
        return { error: String(data.error) };
      }
    } catch (e) {
      const err = e as Error;
      const msg = err.name === "AbortError" ? "request timed out" : err.message;
      console.warn("[Toqan] Poll error:", msg);
    }
  }

  return null;
}
