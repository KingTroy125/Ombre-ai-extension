import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Chat } from "../components/Chat";
import { Settings } from "../components/Settings";
import { Notes } from "../components/Notes";
import { useConversations } from "../hooks/useConversations";

type PanelView = "chat" | "notes" | "settings";

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

  const ensureConversation = () => activeConversation ?? createConversation();

  const openNote = (id: string) => {
    setFocusNoteId(id);
    setView("notes");
  };

  if (!loaded) {
    return <div className="flex h-screen w-screen items-center justify-center bg-background" />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
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
        <div className="flex-1 overflow-y-auto">
          <Settings />
        </div>
      ) : view === "notes" ? (
        <div className="flex-1 overflow-y-auto">
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
