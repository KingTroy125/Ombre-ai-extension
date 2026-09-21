"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { createPortal } from "react-dom";

import {
  Check as IconCheckmark1Small,
  ChevronDown as IconChevronDownSmall,
  Home as IconHome,
  LogOut as IconSignOut,
  Notebook as IconNotebook,
  PanelLeftClose as IconSidebarClose,
  PanelLeftOpen as IconSidebarOpen,
  Pencil as IconEditBig,
  Plus as IconPlusMedium,
  Popsicle as IconPopsicle2,
  Search as IconMagnifyingGlass,
  Settings as IconSettingsGear1,
  UserPlus as IconUserAdd,
  X as IconCrossSmall,
} from "lucide-react";

import GlideMenu from "./primitives/GlideMenu";

import type { Conversation } from "../lib/types";

import { cn } from "../lib/utils";

/* ─────────────────────────────────────────────────────────
 * Motion + sizing
 * ───────────────────────────────────────────────────────── */

const SIDEBAR_MOTION = {
  width: 224,
  duration: 280,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

const CHAT_SEARCH_MOTION = {
  duration: 180,
  // Matches the size-8 search button so the field grows out of it cleanly
  closedWidth: 32,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

const MENU_WIDTH = 256;
const MENU_GUTTER = 8;
const ICON_STROKE = 1.75;

/* ─────────────────────────────────────────────────────────
 * Workspace
 * ───────────────────────────────────────────────────────── */

const WORKSPACE = {
  key: "ombre",
  name: "Ombre AI",
  monogram: "O",
};

/* ─────────────────────────────────────────────────────────
 * Props
 * ───────────────────────────────────────────────────────── */

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

  activeView?: "chat" | "notes" | "settings";
}

/* ─────────────────────────────────────────────────────────
 * Glide wrapper
 * ───────────────────────────────────────────────────────── */

function GlideGroup({ children }: { children: ReactNode }) {
  return (
    <GlideMenu
      rowSelector="[data-row]"
      highlightClassName="sidebar-glide-highlight rounded-[7px] bg-hover-2"
      className="group/glide flex flex-col gap-px"
    >
      {children}
    </GlideMenu>
  );
}

/* ─────────────────────────────────────────────────────────
 * Rail Button
 * ───────────────────────────────────────────────────────── */

function RailButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      data-row
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring relative z-10 mx-2 flex h-8 items-center rounded-[8px] px-2 text-left",
        "transition-[background-color,color,transform] duration-150",
        "active:scale-[0.98]",
        active && "bg-hover-2 group-hover/glide:bg-transparent",
      )}
    >
      <span
        className={cn(
          "sidebar-icon flex size-5 shrink-0 items-center justify-center",
          active ? "text-ink" : "text-ink-2",
        )}
      >
        {icon}
      </span>

      <span
        className={cn(
          "ml-1.5 min-w-0 flex-1 truncate text-[14px] font-medium",
          active ? "text-ink" : "text-ink-2",
        )}
      >
        {label}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
 * Workspace Menu
 * ───────────────────────────────────────────────────────── */

function WorkspaceMenu({
  position,
  onClose,
}: {
  position: {
    top: number;
    left: number;
  };
  onClose: () => void;
}) {
  return createPortal(
    <div
      data-workspace-menu
      className="fixed z-50 rounded-[14px] border border-border bg-surface p-1.5 shadow-overlay"
      style={{
        top: position.top,
        left: position.left,
        width: MENU_WIDTH,
        animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both",
        transformOrigin: "top left",
      }}
    >
      <GlideMenu
        className="flex flex-col gap-px"
        highlightClassName="inset-x-0 rounded-[8px] bg-hover-2"
      >
        {/* Current workspace */}
        <button
          data-menu-row
          type="button"
          onClick={onClose}
          className="relative z-10 flex h-10 w-full items-center gap-1.5 rounded-[8px] px-2 text-left"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-ink text-[11px] font-semibold text-surface">
            {WORKSPACE.monogram}
          </span>

          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
            {WORKSPACE.name}
          </span>

          <span className="shrink-0 text-ink">
            <IconCheckmark1Small size={18} strokeWidth={ICON_STROKE} />
          </span>
        </button>

        <div className="my-1 h-px bg-line" />

        {/* Workspace actions */}
        {[
          {
            label: "New workspace",
            icon: <IconPlusMedium size={16} strokeWidth={ICON_STROKE} />,
          },
          {
            label: "Workspace settings",
            icon: <IconSettingsGear1 size={16} strokeWidth={ICON_STROKE} />,
          },
          {
            label: "Invite team members",
            icon: <IconUserAdd size={16} strokeWidth={ICON_STROKE} />,
          },
        ].map((item) => (
          <button
            key={item.label}
            data-menu-row
            type="button"
            onClick={onClose}
            className="relative z-10 flex h-9 w-full items-center gap-1.5 rounded-[8px] px-2 text-left"
          >
            <span className="flex size-5 shrink-0 items-center justify-center text-ink-2">
              {item.icon}
            </span>

            <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
              {item.label}
            </span>
          </button>
        ))}

        <div className="my-1 h-px bg-line" />

        {/* Sign out */}
        <button
          data-menu-row
          type="button"
          onClick={onClose}
          className="relative z-10 flex h-9 w-full items-center gap-1.5 rounded-[8px] px-2 text-left"
        >
          <span className="flex size-5 shrink-0 items-center justify-center text-ink-2">
            <IconSignOut size={16} strokeWidth={ICON_STROKE} />
          </span>

          <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
            Sign out
          </span>
        </button>
      </GlideMenu>
    </div>,
    document.body,
  );
}

/* ─────────────────────────────────────────────────────────
 * Conversation Row
 * ───────────────────────────────────────────────────────── */

function ConversationRow({
  conversation,
  active,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    // The margin lives on the wrapper and the button is w-full: a plain
    // <button> inside a block wrapper shrinks to its text, which made the
    // hover/active highlight only as wide as the title.
    <div className="group relative mx-2">
      <button
        data-row
        type="button"
        onClick={onSelect}
        title={conversation.title}
        className={cn(
          "focus-ring relative z-10 flex h-8 w-full items-center rounded-[8px] px-2 text-left",
          "transition-[background-color,color,transform] duration-150",
          "active:scale-[0.98]",
          // Reserve room for the delete button so long titles don't run under it
          "group-hover:pr-8 group-focus-within:pr-8",
          active && "bg-hover-2 group-hover/glide:bg-transparent",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[14px] font-medium",
            active ? "text-ink" : "text-ink-2",
          )}
        >
          {conversation.title}
        </span>
      </button>

      {/* Delete */}
      <button
        type="button"
        aria-label={`Delete ${conversation.title}`}
        title="Delete conversation"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className={cn(
          "focus-ring absolute right-1.5 top-1 z-20",
          "flex size-6 items-center justify-center rounded-md",
          "text-ink-3 opacity-0 transition-[opacity,background-color,color] duration-150",
          "hover:bg-destructive/10 hover:text-destructive",
          "focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100",
        )}
      >
        <IconCrossSmall size={13} strokeWidth={ICON_STROKE} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Footer Row
 * ───────────────────────────────────────────────────────── */

function FooterRow({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring flex h-8 w-full items-center justify-start gap-2 rounded-[8px] px-2",
        "text-[13px] font-medium transition-[background-color,color,transform] duration-150",
        "active:scale-[0.98]",
        active
          ? "bg-hover-2 font-semibold text-ink"
          : "text-ink-3 hover:bg-hover-2 hover:text-ink",
      )}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        {icon}
      </span>

      <span className="truncate">{label}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
 * Sidebar
 *
 * Renders as a drawer that overlays the chat instead of pushing it.
 * At the extension's ~380px width, an in-flow 224px sidebar would leave
 * the chat only ~156px. The parent just needs to be `position: relative`.
 * ───────────────────────────────────────────────────────── */

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
  activeView,
}: SidebarProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const [workspacePosition, setWorkspacePosition] = useState({
    top: 0,
    left: 0,
  });

  const [searchOpen, setSearchOpen] = useState(false);

  const [query, setQuery] = useState("");

  const workspaceButtonRef = useRef<HTMLButtonElement>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  /* ───────────────────────────────────────────────────────
   * Search
   * ─────────────────────────────────────────────────────── */

  const filtered = conversations.filter((conversation) =>
    conversation.title
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus();
    }
  }, [searchOpen]);

  /* ───────────────────────────────────────────────────────
   * Workspace menu outside click
   * ─────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!workspaceOpen) return;

    const close = (event: PointerEvent) => {
      const target = event.target as Element;

      if (
        !target.closest("[data-workspace-trigger]") &&
        !target.closest("[data-workspace-menu]")
      ) {
        setWorkspaceOpen(false);
      }
    };

    document.addEventListener("pointerdown", close);

    return () => {
      document.removeEventListener("pointerdown", close);
    };
  }, [workspaceOpen]);

  /* ───────────────────────────────────────────────────────
   * Escape: close the menu first, then the drawer.
   * (The search field handles its own Escape.)
   * ─────────────────────────────────────────────────────── */

  useEffect(() => {
    if (collapsed) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (workspaceOpen) {
        setWorkspaceOpen(false);
      } else if (!searchOpen) {
        onToggleCollapse();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [collapsed, workspaceOpen, searchOpen, onToggleCollapse]);

  /* ───────────────────────────────────────────────────────
   * Open / close
   * ─────────────────────────────────────────────────────── */

  const close = () => {
    if (!collapsed) onToggleCollapse();

    setWorkspaceOpen(false);
    setSearchOpen(false);
    setQuery("");
  };

  const open = () => {
    if (collapsed) onToggleCollapse();
  };

  // As a drawer, picking a destination should reveal it, so close after.
  const navigate = (action: () => void) => () => {
    action();
    close();
  };

  const toggleWorkspace = () => {
    if (!workspaceOpen && workspaceButtonRef.current) {
      const rect = workspaceButtonRef.current.getBoundingClientRect();

      // Keep the 256px menu inside narrow panels
      const maxLeft = window.innerWidth - MENU_WIDTH - MENU_GUTTER;

      setWorkspacePosition({
        top: rect.bottom + 6,
        left: Math.max(MENU_GUTTER, Math.min(rect.left, maxLeft)),
      });
    }

    setWorkspaceOpen((isOpen) => !isOpen);
  };

  return (
    <>
      {/* ──────────────────────────────────────────────────
       * Opener (only while the drawer is closed)
       * ────────────────────────────────────────────────── */}

      <button
        type="button"
        aria-label="Open sidebar"
        aria-expanded={!collapsed}
        tabIndex={collapsed ? 0 : -1}
        onClick={open}
        className={cn(
          "focus-ring absolute left-2 top-0.5 z-20 flex size-9 items-center justify-center rounded-[8px]",
          "text-ink-3 transition-[opacity,background-color,color,transform] duration-150",
          "hover:bg-hover-2 hover:text-ink active:scale-[0.96]",
          collapsed ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <IconSidebarOpen size={18} strokeWidth={ICON_STROKE} />
      </button>

      {/* ──────────────────────────────────────────────────
       * Scrim
       * ────────────────────────────────────────────────── */}

      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "absolute inset-0 z-30 bg-black/50 transition-opacity",
          collapsed ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        style={{
          transitionDuration: `${SIDEBAR_MOTION.duration}ms`,
          transitionTimingFunction: SIDEBAR_MOTION.easing,
        }}
      />

      {/* ──────────────────────────────────────────────────
       * Drawer
       * ────────────────────────────────────────────────── */}

      <aside
        data-state={collapsed ? "closed" : "open"}
        aria-label="Workspace navigation"
        className={cn(
          "absolute inset-y-0 left-0 z-40 flex max-w-[85%] flex-col overflow-hidden",
          "border-r border-sidebar-border bg-sidebar",
          // `invisible` after the slide-out also removes it from tab order
          "transition-[translate,transform,visibility,box-shadow]",
          collapsed
            ? "invisible -translate-x-full"
            : "visible translate-x-0 shadow-overlay",
        )}
        style={{
          width: SIDEBAR_MOTION.width,
          transitionDuration: `${SIDEBAR_MOTION.duration}ms`,
          transitionTimingFunction: SIDEBAR_MOTION.easing,
        }}
      >
        <div className="flex h-full min-h-0 w-full flex-col">

          {/* ────────────────────────────────────────────
           * Header
           * ──────────────────────────────────────────── */}

          <div className="mb-1.5 flex h-11 shrink-0 items-center gap-1 px-2">

            {/* Workspace */}
            <button
              ref={workspaceButtonRef}
              data-workspace-trigger
              type="button"
              aria-expanded={workspaceOpen}
              onClick={toggleWorkspace}
              className={cn(
                "focus-ring flex h-8 min-w-0 flex-1 items-center rounded-[8px] px-2 text-left",
                "transition-[background-color,transform] duration-100",
                "hover:bg-hover-2 active:scale-[0.99]",
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center text-ink">
                <IconPopsicle2 size={17} strokeWidth={ICON_STROKE} />
              </span>

              <span className="ml-1.5 min-w-0 flex-1 truncate text-[14px] font-medium text-ink-2">
                {WORKSPACE.name}
              </span>

              <span className="ml-1 flex shrink-0 text-ink-3">
                <IconChevronDownSmall size={16} strokeWidth={ICON_STROKE} />
              </span>
            </button>

            {/* Close */}
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={close}
              className={cn(
                "focus-ring flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3",
                "transition-[background-color,color,transform] duration-150",
                "hover:bg-hover-2 hover:text-ink active:scale-[0.96]",
              )}
            >
              <IconSidebarClose size={18} strokeWidth={ICON_STROKE} />
            </button>
          </div>

          {/* Workspace dropdown */}
          {workspaceOpen && (
            <WorkspaceMenu
              position={workspacePosition}
              onClose={() => setWorkspaceOpen(false)}
            />
          )}

          {/* ────────────────────────────────────────────
           * Primary navigation
           * ──────────────────────────────────────────── */}

          <GlideGroup>
            <RailButton
              icon={<IconEditBig size={18} />}
              label="New chat"
              onClick={navigate(onNew)}
            />

            {/* No handler yet: wire it to a parent callback or remove it */}
            <RailButton
              icon={<IconHome size={18} />}
              label="Home"
            />
          </GlideGroup>

          {/* ────────────────────────────────────────────
           * Chats header (pinned; stays put while the list scrolls)
           * ──────────────────────────────────────────── */}

          <div className="relative mx-2 mb-1 mt-3 h-8 shrink-0">

            {/* Chats label */}
            <div
              aria-hidden={searchOpen}
              className={cn(
                "absolute inset-0 flex items-center gap-1.5 px-2",
                "text-[12.5px] font-medium text-ink-3",
                "transition-[opacity,transform]",
                searchOpen
                  ? "pointer-events-none -translate-x-1 opacity-0"
                  : "translate-x-0 opacity-100",
              )}
              style={{
                transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`,
                transitionTimingFunction: CHAT_SEARCH_MOTION.easing,
              }}
            >
              <IconChevronDownSmall size={16} strokeWidth={ICON_STROKE} />

              <span>Chats</span>
            </div>

            {/* Search button */}
            <button
              type="button"
              aria-label="Search chats"
              aria-expanded={searchOpen}
              tabIndex={searchOpen ? -1 : 0}
              onClick={() => setSearchOpen(true)}
              className={cn(
                "focus-ring absolute right-0 top-0 z-10",
                "flex size-8 items-center justify-center",
                "rounded-[8px] text-ink-3",
                "transition-[opacity,background-color,color,transform]",
                "hover:bg-hover-2 hover:text-ink",
                "active:scale-[0.96]",
                searchOpen ? "pointer-events-none opacity-0" : "opacity-100",
              )}
              style={{
                transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`,
              }}
            >
              <IconMagnifyingGlass size={16} strokeWidth={ICON_STROKE} />
            </button>

            {/* Search field */}
            <div
              className={cn(
                "absolute right-0 top-0 z-20",
                "flex h-8 items-center overflow-hidden",
                "rounded-[8px]",
                "bg-field text-ink-3",
                "shadow-hairline",
                "transition-[width,opacity]",
                "focus-within:text-ink-2",
                searchOpen
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0",
              )}
              style={{
                width: searchOpen ? "100%" : CHAT_SEARCH_MOTION.closedWidth,
                transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`,
                transitionTimingFunction: CHAT_SEARCH_MOTION.easing,
              }}
            >
              <span className="ml-2 flex shrink-0 items-center justify-center">
                <IconMagnifyingGlass size={15} strokeWidth={ICON_STROKE} />
              </span>

              <input
                ref={searchRef}
                value={query}
                tabIndex={searchOpen ? 0 : -1}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchOpen(false);
                    setQuery("");
                  }
                }}
                placeholder="Search chats"
                aria-label="Search chat history"
                className="ml-1.5 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink outline-none placeholder:text-ink-3"
              />

              <button
                type="button"
                aria-label="Close chat search"
                tabIndex={searchOpen ? 0 : -1}
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3",
                  "transition-[background-color,color,transform] duration-150",
                  "hover:bg-hover-2 hover:text-ink active:scale-[0.96]",
                )}
              >
                <IconCrossSmall size={16} strokeWidth={ICON_STROKE} />
              </button>
            </div>
          </div>

          {/* ────────────────────────────────────────────
           * Conversations (the only part that scrolls)
           * ──────────────────────────────────────────── */}

          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-2">
            <GlideGroup>
              {filtered.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeId}
                  onSelect={navigate(() => onSelect(conversation.id))}
                  onDelete={() => onDelete(conversation.id)}
                />
              ))}

              {filtered.length === 0 && (
                <div className="mx-2 px-2 py-2 text-[12.5px] text-ink-3">
                  {query ? "No chats found" : "No conversations yet."}
                </div>
              )}
            </GlideGroup>
          </div>

          {/* ────────────────────────────────────────────
           * Footer
           * ──────────────────────────────────────────── */}

          <div className="mx-2 flex shrink-0 flex-col gap-px border-t border-line pb-2.5 pt-2.5">
            <FooterRow
              icon={<IconNotebook size={16} strokeWidth={ICON_STROKE} />}
              label="Notes"
              onClick={navigate(onOpenNotes)}
              active={activeView === "notes"}
            />

            <FooterRow
              icon={<IconSettingsGear1 size={16} strokeWidth={ICON_STROKE} />}
              label="Settings"
              onClick={navigate(onOpenSettings)}
              active={activeView === "settings"}
            />
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;