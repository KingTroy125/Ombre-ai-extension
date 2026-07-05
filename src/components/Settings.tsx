import { useState } from "react";
import { Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { useSettings } from "../hooks/useSettings";

export function Settings() {
  const { settings, update, loaded } = useSettings();
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  if (!loaded) {
    return <div className="p-6 text-[13px] text-muted-foreground">Loading settings…</div>;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        <h1 className="text-[16px] font-semibold text-foreground">Ombre AI settings</h1>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Add your Toqan API key to start chatting from the popup, side panel, and page context menu.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
          <KeyRound size={13} className="feather" /> API key
        </span>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={settings.apiKey}
            onChange={(e) => update({ apiKey: e.target.value })}
            onBlur={flashSaved}
            placeholder="sk-…"
            autoFocus
            className="focus-ring w-full rounded-lg border border-input bg-card px-3 py-2 pr-9 text-[13px] text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKey ? <EyeOff size={14} className="feather" /> : <Eye size={14} className="feather" />}
          </button>
        </div>
      </label>

      <div
        className={`flex items-center gap-1.5 text-[12px] text-primary transition-opacity duration-300 ${
          saved ? "opacity-100" : "opacity-0"
        }`}
      >
        <Check size={13} className="feather" /> Saved
      </div>
    </div>
  );
}
