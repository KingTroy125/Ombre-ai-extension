import { Settings } from "../components/Settings";

export function Popup() {
  return (
    <div className="h-[520px] w-[380px] overflow-y-auto bg-background">
      <Settings />
    </div>
  );
}