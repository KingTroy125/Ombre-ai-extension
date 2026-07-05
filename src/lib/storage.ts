import type { Conversation, ToqanSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const SETTINGS_KEY = "toqan_settings";
const CONVERSATIONS_KEY = "toqan_conversations";

/** Falls back to plain objects when not running inside the extension (e.g. local dev). */
const hasChromeStorage =
  typeof chrome !== "undefined" && !!chrome.storage && !!chrome.storage.sync;

export async function getSettings(): Promise<ToqanSettings> {
  if (!hasChromeStorage) return DEFAULT_SETTINGS;
  const result = await chrome.storage.sync.get([SETTINGS_KEY]);
  return { ...DEFAULT_SETTINGS, ...((result[SETTINGS_KEY] as Partial<ToqanSettings>) || {}) };
}

export async function saveSettings(settings: ToqanSettings): Promise<void> {
  if (!hasChromeStorage) return;
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}

export async function getConversations(): Promise<Conversation[]> {
  if (!hasChromeStorage) return [];
  const result = await chrome.storage.local.get([CONVERSATIONS_KEY]);
  return (result[CONVERSATIONS_KEY] as Conversation[]) || [];
}

export async function saveConversations(conversations: Conversation[]): Promise<void> {
  if (!hasChromeStorage) return;
  await chrome.storage.local.set({ [CONVERSATIONS_KEY]: conversations });
}

export function onStorageChanged(
  callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void
) {
  if (!hasChromeStorage) return () => {};
  chrome.storage.onChanged.addListener(callback);
  return () => chrome.storage.onChanged.removeListener(callback);
}
