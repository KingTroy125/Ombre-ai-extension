// background/index.ts — Ombre AI Assistant service worker (MV3)
import type { ChatMessage, RuntimeMessage } from "../lib/types";

const TOQAN_GET_ANSWER_URL = "https://api.toqan.ai/api/get_answer";
const DEFAULT_CREATE_URL = "https://api.toqan.ai/api/create_conversation";
const CONTEXT_MENU_ID = "toqan-ask-selected";

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

function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// ── Context menu setup ─────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Ask Ombre AI: "%s"',
    contexts: ["selection"],
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

  if (message.type === "OPEN_SETTINGS") {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
    }
    sendResponse({ status: "ok" });
    return false;
  }

  if (message.type === "OMBRE_ADD_TO_CHAT") {
    // Selections inside an iframe (e.g. Gmail's compose box) have their own
    // isolated content-script instance with no edge panel of its own — relay
    // this up to the top frame, which does have one.
    const tabId = sender.tab?.id;
    if (tabId != null) {
      chrome.tabs
        .sendMessage(tabId, { type: "OMBRE_ADD_TO_CHAT", text: message.text }, { frameId: 0 })
        .catch(() => {
          // Top frame's content script isn't ready/present — nothing more to do.
        });
    }
    sendResponse({ status: "ok" });
    return false;
  }
});

// Extension action opens the side panel directly.
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && tab.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  }
});

// ── Async handler broadcasting replies to all extension views ────────────

async function handleChatMessageAsync(messages: ChatMessage[], conversationId: string, tabId?: number) {
  startKeepAlive();
  try {
    const lastUserMessage =
      messages.filter((m) => m.role === "user").map((m) => m.content).pop() || "";

    const result = await callToqanAPI(lastUserMessage);

    if (result.overloaded) {
      deliver({ type: "TOQAN_OVERLOADED", message: result.error!, conversationId }, tabId);
    } else if (result.reply) {
      deliver({ type: "TOQAN_REPLY", reply: result.reply, conversationId }, tabId);
    } else {
      deliver({ type: "TOQAN_ERROR", error: result.error || "Unknown error", conversationId }, tabId);
    }
  } catch (err) {
    deliver({ type: "TOQAN_ERROR", error: (err as Error).message, conversationId }, tabId);
  } finally {
    stopKeepAlive();
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

async function callToqanAPI(userMessage: string): Promise<ToqanCallResult> {
  const settings = await chrome.storage.sync.get(["toqan_settings"]);
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
    if (attempt > 0) {
      console.log(`[Toqan] Retrying (attempt ${attempt}/${MAX_RETRIES}) after overload...`);
      await new Promise((r) => setTimeout(r, 5000 * attempt));
    }

    const singleResult = await callToqanAPIOnce(apiKey, agentId, userMessage, createUrl);

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
  createUrl: string
): Promise<ToqanCallResult> {
  const getAnswerUrlResolved = getAnswerUrl(createUrl);

  const requestBody: Record<string, string> = { user_message: userMessage };
  if (agentId) requestBody.agent_id = agentId;

  const createResp = await fetchWithTimeout(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
    body: JSON.stringify(requestBody),
  });

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
  const result = await pollForResult(conversationId, requestId, apiKey, getAnswerUrlResolved);

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
  getAnswerUrlResolved: string
): Promise<{ reply?: string; error?: string } | null> {
  const pollUrl = `${getAnswerUrlResolved}?conversation_id=${encodeURIComponent(conversationId)}&request_id=${encodeURIComponent(requestId)}`;

  const MAX_ATTEMPTS = 90;
  const POLL_INTERVAL_MS = 2000;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    keepAlive();

    try {
      const resp = await fetchWithTimeout(pollUrl, { headers: { "X-Api-Key": apiKey } });

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
