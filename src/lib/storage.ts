import type { Conversation, ToqanSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

export const SETTINGS_KEY = "toqan_settings";
export const CONVERSATIONS_KEY = "toqan_conversations";
const NOTES_KEY = "ombre_notes";
const MIGRATION_KEY = "toqan_sync_migrated_to_local";
const WRITE_DELAY_MS = 100;

/** Falls back to plain objects when not running inside the extension (e.g. local dev). */
const hasChromeStorage =
  typeof chrome !== "undefined" && !!chrome.storage?.local;

const pendingWrites = new Map<string, unknown>();
let writeTimer: ReturnType<typeof setTimeout> | undefined;
let flushPromise: Promise<void> | null = null;
const lastWritten = new Map<string, string>();

function serialize(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

async function flushWrites(): Promise<void> {
  if (!hasChromeStorage || pendingWrites.size === 0) return;
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = undefined;
  }

  const writes = Object.fromEntries(pendingWrites);
  pendingWrites.clear();
  const changed = Object.fromEntries(
    Object.entries(writes).filter(([key, value]) => {
      const serialized = serialize(value);
      if (lastWritten.get(key) === serialized) return false;
      lastWritten.set(key, serialized);
      return true;
    }),
  );
  if (Object.keys(changed).length === 0) return;

  flushPromise = chrome.storage.local.set(changed).then(() => undefined).finally(() => {
    flushPromise = null;
  });
  await flushPromise;
}

function queueWrite(key: string, value: unknown): Promise<void> {
  if (!hasChromeStorage) return Promise.resolve();
  pendingWrites.set(key, value);
  if (!writeTimer) {
    writeTimer = setTimeout(() => {
      writeTimer = undefined;
      void flushWrites();
    }, WRITE_DELAY_MS);
  }
  return Promise.resolve();
}

export function queueStorageWrite(key: string, value: unknown): Promise<void> {
  return queueWrite(key, value);
}

export async function flushStorageWrites(): Promise<void> {
  await flushWrites();
  if (flushPromise) await flushPromise;
}

/** Move legacy sync data once, without overwriting values already in local storage. */
export async function migrateSyncToLocal(): Promise<void> {
  if (!hasChromeStorage) return;
  const marker = await chrome.storage.local.get([MIGRATION_KEY]);
  if (marker[MIGRATION_KEY]) return;

  const [local, legacy] = await Promise.all([
    chrome.storage.local.get([SETTINGS_KEY, NOTES_KEY]),
    chrome.storage.sync.get([SETTINGS_KEY, NOTES_KEY]),
  ]);
  const migrated: Record<string, unknown> = { [MIGRATION_KEY]: true };
  if (local[SETTINGS_KEY] === undefined && legacy[SETTINGS_KEY] !== undefined) {
    migrated[SETTINGS_KEY] = legacy[SETTINGS_KEY];
  }
  if (local[NOTES_KEY] === undefined && legacy[NOTES_KEY] !== undefined) {
    migrated[NOTES_KEY] = legacy[NOTES_KEY];
  }
  await chrome.storage.local.set(migrated);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    void flushStorageWrites();
  });
}

export async function getSettings(): Promise<ToqanSettings> {
  if (!hasChromeStorage) return DEFAULT_SETTINGS;
  await migrateSyncToLocal();
  const result = await chrome.storage.local.get([SETTINGS_KEY]);
  return { ...DEFAULT_SETTINGS, ...((result[SETTINGS_KEY] as Partial<ToqanSettings>) || {}) };
}

export async function saveSettings(settings: ToqanSettings): Promise<void> {
  if (!hasChromeStorage) return;
  await queueWrite(SETTINGS_KEY, settings);
}

export async function getConversations(): Promise<Conversation[]> {
  if (!hasChromeStorage) return [];
  const result = await chrome.storage.local.get([CONVERSATIONS_KEY]);
  return (result[CONVERSATIONS_KEY] as Conversation[]) || [];
}

export async function saveConversations(conversations: Conversation[]): Promise<void> {
  if (!hasChromeStorage) return;
  await queueWrite(CONVERSATIONS_KEY, conversations);
}

export function onStorageChanged(
  callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void
) {
  if (!hasChromeStorage) return () => {};
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area === "local") callback(changes);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
