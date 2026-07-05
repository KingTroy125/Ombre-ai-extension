import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Chat } from "../components/Chat";
import { Settings } from "../components/Settings";
import { useConversations } from "../hooks/useConversations";

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
  const [showSettings, setShowSettings] = useState(false);

  const ensureConversation = () => activeConversation ?? createConversation();

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
          setShowSettings(false);
        }}
        onNew={() => {
          createConversation();
          setShowSettings(false);
        }}
        onDelete={deleteConversation}
        onOpenSettings={() => setShowSettings((v) => !v)}
      />
      {showSettings ? (
        <div className="flex-1 overflow-y-auto">
          <Settings />
        </div>
      ) : (
        <Chat
          conversation={activeConversation}
          onUpdateConversation={updateConversation}
          onEnsureConversation={ensureConversation}
        />
      )}
    </div>
  );
}
