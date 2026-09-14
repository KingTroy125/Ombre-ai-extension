"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { createPortal } from "react-dom";

import {
  Check as IconCheckmark1Small,
  ChevronDown as IconChevronDownSmall,
  Home as IconHome,
  Notebook as IconNotebook,
  PanelLeftClose as IconSidebarLeftArrow,
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
 * Motion
 * ───────────────────────────────────────────────────────── */

const SIDEBAR_MOTION = {
  expandedWidth: 224,
  collapsedWidth: 52,
  duration: 280,
  copyDuration: 180,
  copyOffset: 8,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

const CHAT_SEARCH_MOTION = {
  duration: 180,
  closedWidth: 28,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

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
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      data-row
      type="button"
      onClick={onClick}
      className={cn(
        "sidebar-row relative z-10 mx-2 flex h-8 items-center rounded-[8px] px-2 text-left",
        "transition-[width,background-color,color,transform] duration-150",
        "active:scale-[0.98]",
        active
          ? "bg-hover-2 group-hover/glide:bg-transparent"
          : highlight
            ? "hover:bg-hover-2"
            : "",
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
          "sidebar-copy ml-1.5 min-w-0 flex-1 truncate text-[14px] font-medium",
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
      className="fixed z-50 w-64 rounded-[14px] bg-surface p-1.5 shadow-overlay"
      style={{
        top: position.top,
        left: position.left,
        animation:
          "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both",
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
            <IconCheckmark1Small size={18} />
          </span>
        </button>

        <div className="my-1 h-px bg-line" />

        {/* Workspace actions */}
        {[
          {
            label: "New workspace",
            icon: <IconPlusMedium size={16} />,
          },
          {
            label: "Workspace settings",
            icon: <IconSettingsGear1 size={16} />,
          },
          {
            label: "Invite team members",
            icon: <IconUserAdd size={16} />,
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
            <IconSidebarLeftArrow size={16} />
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
        data-row
        type="button"
        onClick={onSelect}
        title={conversation.title}
        className={cn(
          "sidebar-row relative z-10 mx-2 flex h-8 items-center rounded-[8px] px-2 text-left",
          "transition-[width,background-color,color,transform] duration-150",
          "active:scale-[0.98]",
          active
            ? "bg-hover-2 group-hover/glide:bg-transparent"
            : "",
        )}
      >
        {!collapsed && (
          <span
            className={cn(
              "sidebar-copy min-w-0 flex-1 truncate text-[14px] font-medium",
              active ? "text-ink" : "text-ink-2",
            )}
          >
            {conversation.title}
          </span>
        )}
      </button>

      {/* Delete */}
      {!collapsed && (
        <button
          type="button"
          aria-label={`Delete ${conversation.title}`}
          title="Delete conversation"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="
            absolute right-1.5 top-1 z-20
            flex h-6 w-6 items-center justify-center
            rounded-md
            text-ink-3
            opacity-0
            transition-all duration-150
            hover:bg-red-500/10
            hover:text-red-500
            group-hover:opacity-100
          "
        >
          <IconCrossSmall size={13} />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Footer Row
 * ───────────────────────────────────────────────────────── */

function FooterRow({
  icon,
  label,
  collapsed,
  onClick,
}: {
  icon: ReactNode;
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
        "flex h-8 w-full items-center rounded-[8px]",
        "text-[12.5px] font-medium text-ink-3",
        "transition-[background-color,color,transform] duration-150",
        "hover:bg-hover-2 hover:text-ink",
        "active:scale-[0.98]",
        collapsed
          ? "justify-center px-0"
          : "justify-start gap-2 px-2",
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>

      {!collapsed && (
        <span className="truncate">
          {label}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
 * Sidebar
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
}: SidebarProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const [workspacePosition, setWorkspacePosition] = useState({
    top: 0,
    left: 0,
  });

  const [searchOpen, setSearchOpen] = useState(false);

  const [query, setQuery] = useState("");

  const workspaceButtonRef =
    useRef<HTMLButtonElement>(null);

  const searchRef =
    useRef<HTMLInputElement>(null);

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
      document.removeEventListener(
        "pointerdown",
        close,
      );
    };
  }, [workspaceOpen]);

  /* ───────────────────────────────────────────────────────
   * Collapse
   * ─────────────────────────────────────────────────────── */

  const collapse = () => {
    onToggleCollapse();

    setWorkspaceOpen(false);
    setSearchOpen(false);
    setQuery("");
  };

  /* ───────────────────────────────────────────────────────
   * Expand
   * ─────────────────────────────────────────────────────── */

  const expand = () => {
    onToggleCollapse();
  };

  return (
    <aside
      data-sidebar-collapsed={collapsed}
      aria-label="Workspace navigation"
      className="
        relative
        flex
        h-full
        shrink-0
        overflow-hidden
        transition-[width]
      "
      style={{
        width: collapsed
          ? SIDEBAR_MOTION.collapsedWidth
          : SIDEBAR_MOTION.expandedWidth,

        transitionDuration:
          `${SIDEBAR_MOTION.duration}ms`,

        transitionTimingFunction:
          SIDEBAR_MOTION.easing,

        "--sidebar-copy-duration":
          `${SIDEBAR_MOTION.copyDuration}ms`,

        "--sidebar-copy-offset":
          `${SIDEBAR_MOTION.copyOffset}px`,

        "--sidebar-easing":
          SIDEBAR_MOTION.easing,
      } as CSSProperties}
    >
      <div className="flex min-h-0 w-[224px] shrink-0 flex-col">

        {/* ────────────────────────────────────────────────
         * Header
         * ──────────────────────────────────────────────── */}

        <div className="relative mb-2.5 h-10 shrink-0">

          {/* Workspace */}
          {!collapsed && (
            <button
              ref={workspaceButtonRef}
              data-workspace-trigger
              type="button"
              aria-expanded={workspaceOpen}
              onClick={() => {
                if (
                  !workspaceOpen &&
                  workspaceButtonRef.current
                ) {
                  const rect =
                    workspaceButtonRef.current.getBoundingClientRect();

                  setWorkspacePosition({
                    top: rect.bottom + 6,
                    left: rect.left,
                  });
                }

                setWorkspaceOpen(
                  (open) => !open,
                );
              }}
              className="
                sidebar-workspace-control
                absolute
                left-2
                top-1
                flex
                h-8
                w-[164px]
                items-center
                rounded-[8px]
                px-2
                text-left
                transition-[background-color,transform]
                duration-100
                hover:bg-hover-2
                active:scale-[0.99]
              "
            >
              <span className="sidebar-logo flex size-5 shrink-0 items-center justify-center text-ink">
                        <IconPopsicle2 size={17} strokeWidth={1.75} />
              </span>

              <span className="sidebar-copy ml-1.5 min-w-0 flex-1 truncate text-[14px] font-medium text-ink-2">
                {WORKSPACE.name}
              </span>

              <span className="sidebar-copy ml-1 flex shrink-0 text-ink-3">
                <IconChevronDownSmall size={16} />
              </span>
            </button>
          )}

          {/* Workspace dropdown */}
          {!collapsed && workspaceOpen && (
            <WorkspaceMenu
              position={workspacePosition}
              onClose={() =>
                setWorkspaceOpen(false)
              }
            />
          )}

          {/* Collapse */}
          {!collapsed && (
            <button
              type="button"
              aria-label="Collapse sidebar"
              onClick={collapse}
              className="
                sidebar-collapse-control
                absolute
                right-2
                top-1
                flex
                size-8
                items-center
                justify-center
                rounded-[8px]
                text-ink-3
                transition-[background-color,color]
                duration-150
                hover:bg-hover-2
                hover:text-ink
              "
            >
              <IconSidebarLeftArrow size={18} />
            </button>
          )}

          {/* Expand */}
          {collapsed && (
            <button
              type="button"
              aria-label="Expand sidebar"
              onClick={expand}
              className="
                sidebar-expand-control
                absolute
                left-2
                top-0.5
                flex
                size-9
                items-center
                justify-center
                rounded-[8px]
                text-ink-3
                transition-[background-color,color]
                duration-150
                hover:bg-hover-2
                hover:text-ink
              "
            >
              <IconSidebarLeftArrow
                size={18}
                className="rotate-180"
              />
            </button>
          )}
        </div>

        {/* ────────────────────────────────────────────────
         * Primary navigation
         * ──────────────────────────────────────────────── */}

        <GlideGroup>
          <RailButton
            icon={<IconEditBig size={18} />}
            label="New chat"
            onClick={onNew}
            highlight
          />

          <RailButton
            icon={<IconHome size={18} />}
            label="Home"
            active={false}
          />
        </GlideGroup>

        {/* ────────────────────────────────────────────────
         * Chat list
         * ──────────────────────────────────────────────── */}

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">

          {!collapsed && (
            <div className="sidebar-copy relative mx-2 mb-1 h-8">

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
                  transitionDuration:
                    `${CHAT_SEARCH_MOTION.duration}ms`,

                  transitionTimingFunction:
                    CHAT_SEARCH_MOTION.easing,
                }}
              >
                <IconChevronDownSmall size={16} />

                <span>
                  Chats
                </span>
              </div>

              {/* Search button */}
              <button
                type="button"
                aria-label="Search chats"
                aria-expanded={searchOpen}
                onClick={() =>
                  setSearchOpen(true)
                }
                className={cn(
                  "absolute right-0 top-0 z-10",
                  "flex size-8 items-center justify-center",
                  "rounded-[8px] text-ink-3",
                  "transition-[opacity,background-color,color,transform]",
                  "hover:bg-hover-2 hover:text-ink",
                  "active:scale-[0.96]",
                  searchOpen
                    ? "pointer-events-none opacity-0"
                    : "opacity-100",
                )}
                style={{
                  transitionDuration:
                    `${CHAT_SEARCH_MOTION.duration}ms`,
                }}
              >
                <IconMagnifyingGlass size={16} />
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
                  width: searchOpen
                    ? "100%"
                    : CHAT_SEARCH_MOTION.closedWidth,

                  transitionDuration:
                    `${CHAT_SEARCH_MOTION.duration}ms`,

                  transitionTimingFunction:
                    CHAT_SEARCH_MOTION.easing,
                }}
              >
                <span className="ml-2 flex shrink-0 items-center justify-center">
                  <IconMagnifyingGlass size={15} />
                </span>

                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setSearchOpen(false);
                      setQuery("");
                    }
                  }}
                  placeholder="Search chats"
                  aria-label="Search chat history"
                  className="
                    ml-1.5
                    min-w-0
                    flex-1
                    bg-transparent
                    text-[13px]
                    font-medium
                    text-ink
                    outline-none
                    placeholder:text-ink-3
                  "
                />

                <button
                  type="button"
                  aria-label="Close chat search"
                  onClick={() => {
                    setSearchOpen(false);
                    setQuery("");
                  }}
                  className="
                    flex
                    size-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-[8px]
                    text-ink-3
                    transition-[background-color,color,transform]
                    duration-150
                    hover:bg-hover-2
                    hover:text-ink
                    active:scale-[0.96]
                  "
                >
                  <IconCrossSmall size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Conversations */}
          <GlideGroup>
            {filtered.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={
                  conversation.id === activeId
                }
                collapsed={collapsed}
                onSelect={() =>
                  onSelect(conversation.id)
                }
                onDelete={() =>
                  onDelete(conversation.id)
                }
              />
            ))}

            {!collapsed &&
              filtered.length === 0 && (
                <div className="sidebar-copy mx-2 px-2 py-2 text-[12.5px] text-ink-3">
                  {query
                    ? "No chats found"
                    : "No conversations yet."}
                </div>
              )}
          </GlideGroup>
        </div>

        {/* ────────────────────────────────────────────────
         * Footer
         * ──────────────────────────────────────────────── */}

        <div className="sidebar-footer sidebar-copy mx-2 mt-3 w-[208px] border-t border-line pt-3">

          <FooterRow
            icon={<IconNotebook size={14} />}
            label="Notes"
            collapsed={collapsed}
            onClick={onOpenNotes}
          />

          <FooterRow
            icon={
              <IconSettingsGear1 size={14} />
            }
            label="Settings"
            collapsed={collapsed}
            onClick={onOpenSettings}
          />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;