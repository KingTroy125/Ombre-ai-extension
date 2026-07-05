import { MessageSquarePlus, Settings as SettingsIcon, Trash2 } from "lucide-react";
import type { Conversation } from "../lib/types";
import { cn } from "../lib/utils";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
}

export function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, onOpenSettings }: SidebarProps) {
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
            O
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">Ombre AI</span>
        </div>
      </div>

      <div className="px-2.5 pb-2">
        <button
          onClick={onNew}
          className="focus-ring flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <MessageSquarePlus size={15} className="feather" />
          New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {conversations.length === 0 && (
          <p className="px-2 py-6 text-center text-[12px] text-muted-foreground">
            No conversations yet. Start one above.
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors",
                  c.id === activeId
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <span className="truncate">{c.title}</span>
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  className="ml-1 shrink-0 rounded-md p-1 opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive-foreground group-hover:opacity-100"
                >
                  <Trash2 size={12} className="feather" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-sidebar-border px-2.5 py-2">
        <button
          onClick={onOpenSettings}
          className="focus-ring flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <SettingsIcon size={14} className="feather" />
          Settings
        </button>
      </div>
    </aside>
  );
}
