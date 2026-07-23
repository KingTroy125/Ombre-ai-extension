import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function newId(): string {
  return uuidv4();
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function titleFromMessage(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New conversation";
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
}

// Copy needs the CLEAN text the person actually asked for — not the raw
// markdown source. Without this, copying an assistant reply would paste
// literal **asterisks** and bullet dashes into whatever the person pastes
// into. Mirrors the equivalent stripper in the content script.
export function stripMarkdown(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, "").trim())
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+?)`/g, "$1")
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, "$1")
    .replace(/^[ \t]*[-*•][ \t]+/gm, "\u2022 ")
    .trim();
}
