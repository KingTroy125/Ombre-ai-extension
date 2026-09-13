import { useEffect, useRef, useState } from "react";
import {
  MessageSquarePlus,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings as SettingsIcon,
  Trash2,
  X,
} from "lucide-react";
import type { Conversation } from "../lib/types";
import { cn } from "../lib/utils";

/* ── Motion constants ─────────────────────────────────── */
const MOTION = {
  expandedWidth: 220,
  collapsedWidth: 52,
  duration: 260,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

const SEARCH_MOTION = {
  duration: 180,
  closedWidth: 32,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

/* ── Props ────────────────────────────────────────────── */
interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onOpenNotes: () => void;
  onOpenSettings: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/* ── Sidebar ──────────────────────────────────────────── */
export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onOpenNotes,
  onOpenSettings,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const collapse = () => {
    onToggleCollapse();
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <aside
      className="flex h-full shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar"
      style={{
        width: collapsed ? MOTION.collapsedWidth : MOTION.expandedWidth,
        transition: `width ${MOTION.duration}ms ${MOTION.easing}`,
      }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div className="relative mb-2 h-10 shrink-0">
        {/* Expanded: brand + collapse button */}
        {!collapsed && (
          <>
            <div className="absolute left-2.5 top-1 flex h-8 items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
                O
              </div>
              <span
                className="truncate text-[13px] font-semibold tracking-tight text-sidebar-foreground"
                style={{
                  transition: `opacity ${MOTION.duration}ms ${MOTION.easing}`,
                }}
              >
                Ombre AI
              </span>
            </div>
            <button
              type="button"
              onClick={collapse}
              aria-label="Collapse sidebar"
              className="absolute right-2 top-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <PanelLeftClose size={16} className="feather" />
            </button>
          </>
        )}

        {/* Collapsed: expand button */}
        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="absolute left-2 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <PanelLeftOpen size={16} className="feather" />
          </button>
        )}
      </div>

      {/* ── Rail buttons (always visible) ──────────────── */}
      <div className="flex flex-col gap-px px-2">
        <RailRow
          icon={<MessageSquarePlus size={16} className="feather" />}
          label="New chat"
          collapsed={collapsed}
          onClick={onNew}
          highlight
        />
      </div>

      {/* ── Conversation list + search ─────────────────── */}
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {/* Chats header / search */}
        {!collapsed && (
          <div className="relative mx-2 mb-1 h-8">
            {/* Label + search trigger */}
            <div
              className={cn(
                "absolute inset-0 flex items-center gap-1.5 px-2 text-[12px] font-medium text-muted-foreground",
                searchOpen ? "pointer-events-none opacity-0" : "opacity-100"
              )}
              style={{
                transition: `opacity ${SEARCH_MOTION.duration}ms ${SEARCH_MOTION.easing}`,
              }}
            >
              <span>Chats</span>
            </div>

            <button
              type="button"
              aria-label="Search chats"
              onClick={() => setSearchOpen(true)}
              className={cn(
                "absolute right-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                searchOpen ? "pointer-events-none opacity-0" : "opacity-100"
              )}
              style={{
                transition: `opacity ${SEARCH_MOTION.duration}ms ${SEARCH_MOTION.easing}`,
              }}
            >
              <Search size={14} className="feather" />
            </button>

            {/* Animated search field */}
            <div
              className={cn(
                "absolute right-0 top-0 z-20 flex h-8 items-center overflow-hidden rounded-lg bg-sidebar-accent shadow-sm",
                searchOpen ? "pointer-events-auto" : "pointer-events-none"
              )}
              style={{
                width: searchOpen ? "100%" : SEARCH_MOTION.closedWidth,
                opacity: searchOpen ? 1 : 0,
                transition: `width ${SEARCH_MOTION.duration}ms ${SEARCH_MOTION.easing}, opacity ${SEARCH_MOTION.duration}ms ${SEARCH_MOTION.easing}`,
              }}
            >
              <span className="ml-2 flex shrink-0 items-center justify-center text-muted-foreground">
                <Search size={13} className="feather" />
              </span>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchOpen(false);
                    setQuery("");
                  }
                }}
                placeholder="Search chats"
                aria-label="Search chat history"
                className="ml-1.5 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-sidebar-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <X size={13} className="feather" />
              </button>
            </div>
          </div>
        )}

        {/* Conversation rows */}
        <div className="flex flex-col gap-px px-2">
          {filtered.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              active={c.id === activeId}
              collapsed={collapsed}
              onSelect={() => onSelect(c.id)}
              onDelete={() => onDelete(c.id)}
            />
          ))}
          {!collapsed && filtered.length === 0 && (
            <div className="px-2 py-5 text-center text-[12px] text-muted-foreground">
              {query ? "No matches" : "No conversations yet."}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer actions ─────────────────────────────── */}
      <div className="border-t border-sidebar-border px-2 py-2">
        <FooterRow
          icon={<NotebookPen size={14} className="feather" />}
          label="Notes"
          collapsed={collapsed}
          onClick={onOpenNotes}
        />
        <FooterRow
          icon={<SettingsIcon size={14} className="feather" />}
          label="Settings"
          collapsed={collapsed}
          onClick={onOpenSettings}
        />
      </div>
    </aside>
  );
}

/* ── Sub-components ───────────────────────────────────── */

function RailRow({
  icon,
  label,
  collapsed,
  onClick,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "relative z-10 flex h-8 items-center rounded-lg px-2 text-left transition-colors duration-150 active:scale-[0.98]",
        collapsed ? "justify-center" : "",
        highlight
          ? "text-sidebar-foreground hover:bg-sidebar-accent"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      {!collapsed && (
        <span className="ml-2 min-w-0 flex-1 truncate text-[13px] font-medium text-sidebar-foreground">
          {label}
        </span>
      )}
    </button>
  );
}

function ConversationRow({
  conversation,
  active,
  collapsed,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  active: boolean;
  collapsed: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        title={collapsed ? conversation.title : undefined}
        className={cn(
          "relative z-10 flex h-8 w-full items-center rounded-lg px-2 text-left transition-colors duration-150 active:scale-[0.98]",
          collapsed ? "justify-center" : "",
          active
            ? "bg-sidebar-accent text-sidebar-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        )}
      >
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
            {conversation.title}
          </span>
        )}
      </button>

      {/* Delete on hover (expanded only) */}
      {!collapsed && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete conversation"
          className="absolute right-1.5 top-1 z-20 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all duration-150 hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 size={12} className="feather" />
        </button>
      )}
    </div>
  );
}

function FooterRow({
  icon,
  label,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex h-8 w-full items-center rounded-lg text-[12.5px] text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        collapsed ? "justify-center px-0" : "gap-2 px-2"
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
