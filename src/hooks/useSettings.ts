import { useCallback, useEffect, useState } from "react";
import { getSettings, saveSettings } from "../lib/storage";
import type { ToqanSettings } from "../lib/types";
import { DEFAULT_SETTINGS } from "../lib/types";

export function useSettings() {
  const [settings, setSettings] = useState<ToqanSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const update = useCallback(async (next: Partial<ToqanSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      saveSettings(merged);
      return merged;
    });
  }, []);

  return { settings, update, loaded, hasApiKey: !!settings.apiKey };
}
