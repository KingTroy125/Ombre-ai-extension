import { useCallback, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Chat } from "../components/Chat";
import { Settings } from "../components/Settings";
import { Notes } from "../components/Notes";
import { useConversations } from "../hooks/useConversations";

type PanelView = "chat" | "notes" | "settings";

const SIDEBAR_COLLAPSED_KEY = "ombre_sidebar_collapsed";

function getInitialCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) return stored === "true";
  } catch {}
  return window.innerWidth < 420;
}

export function SidePanel() {
  const {
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    createConversation,
    deleteConversation,
    updateConversation,
    loaded,
  } = useConversations();
  const [view, setView] = useState<PanelView>("chat");
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialCollapsed);

  const ensureConversation = () => activeConversation ?? createConversation();

  const openNote = (id: string) => {
    setFocusNoteId(id);
    setView("notes");
  };

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  if (!loaded) {
    return <div className="flex h-screen w-screen items-center justify-center bg-background" />;
  }

  return (
    <div className="relative flex h-screen w-screen min-w-0 overflow-hidden bg-background">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        onSelect={(id) => {
          setActiveId(id);
          setView("chat");
        }}
        onNew={() => {
          createConversation();
          setView("chat");
        }}
        onDelete={deleteConversation}
        onOpenNotes={() => setView("notes")}
        onOpenSettings={() => setView("settings")}
      />
      {view === "settings" ? (
        <div className={`min-w-0 flex-1 overflow-y-auto ${sidebarCollapsed ? "pl-14" : ""}`}>
          <Settings />
        </div>
      ) : view === "notes" ? (
        <div className={`min-w-0 flex-1 overflow-y-auto ${sidebarCollapsed ? "pl-14" : ""}`}>
          <Notes focusNoteId={focusNoteId} onClearFocus={() => setFocusNoteId(null)} />
        </div>
      ) : (
        <Chat
          conversation={activeConversation}
          onUpdateConversation={updateConversation}
          onEnsureConversation={ensureConversation}
          onOpenNote={openNote}
        />
      )}
    </div>
  );
}
