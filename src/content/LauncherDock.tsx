import { Settings } from "lucide-react";
import { BlobIcon } from "../components/BlobIcon";
import { Dock, DockItem, DockSeparator } from "../components/Dock";

interface LauncherDockProps {
  onOpenChat: () => void;
  onOpenSettings: () => void;
}

/**
 * Vertical dock pinned to the page edge. Opens the Chrome side panel chat
 * or the extension settings page.
 */
export function LauncherDock({ onOpenChat, onOpenSettings }: LauncherDockProps) {
  return (
    <Dock
      size={46}
      className="flex-col items-center gap-2 border border-white/10 bg-[#121215]/90 px-1.5 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl"
    >
      <DockItem
        onClick={onOpenChat}
        aria-label="Open Ombre AI chat"
        className="rounded-xl hover:bg-white/5"
      >
        <BlobIcon size={24} />
      </DockItem>
      <DockSeparator className="mx-0 my-1 h-px w-6" />
      <DockItem
        onClick={onOpenSettings}
        aria-label="Open settings"
        className="rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
      >
        <Settings size={18} />
      </DockItem>
    </Dock>
  );
}
