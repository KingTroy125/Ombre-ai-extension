import { useState } from "react";
import { Settings } from "../components/Settings";

export function Popup() {
  const [activeTab, setActiveTab] = useState<"home" | "settings">("home");

  return (
    <div className="h-[520px] w-[380px] overflow-y-auto bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 shadow-lg">
        <h1 className="text-xl font-bold text-white">Ombre AI</h1>
        <p className="text-xs text-purple-100">Your intelligent web companion</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "home"
            ? "border-b-2 border-purple-500 text-purple-500"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          About
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "settings"
            ? "border-b-2 border-purple-500 text-purple-500"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "home" ? (
          <div className="space-y-4">
            {/* Welcome Section */}
            <div className="rounded-lg bg-purple-500/10 p-4 border border-purple-500/20">
              <h2 className="text-lg font-semibold mb-2">Welcome!</h2>
              <p className="text-sm text-muted-foreground">
                Ombre AI puts an intelligent assistant everywhere you read or write on the web.
              </p>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-md font-semibold mb-3">Features</h3>
              <div className="space-y-3">
                <FeatureCard
                  icon=""
                  title="Chat Anywhere"
                  description="Full conversation history with markdown support for tables, lists, and code."
                />
                <FeatureCard
                  icon=""
                  title="Edge Panel"
                  description="Hover over the edge of any page to open a chat panel without leaving your current tab."
                />
                <FeatureCard
                  icon=""
                  title="Selection Toolbar"
                  description="Select text to get instant options: Ask, Improve, Rephrase, or Add more context."
                />
                <FeatureCard
                  icon=""
                  title="Voice Input"
                  description="Use your voice in any chat surface with built-in speech recognition."
                />
                <FeatureCard
                  icon=""
                  title="Right-Click Actions"
                  description="Select text, right-click, and choose 'Ask Ombre AI' for instant answers."
                />
                <FeatureCard
                  icon=""
                  title="Smart Retry"
                  description="Automatic retry with backoff ensures your requests go through even when the service is busy."
                />
              </div>
            </div>

            {/* Quick Start */}
            <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
              <h3 className="text-md font-semibold mb-2">Quick Start</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to Settings tab and add your Toqan API key</li>
                <li>Try selecting text on any webpage</li>
                <li>Use the floating toolbar or right-click menu</li>
                <li>Open the side panel or edge panel for full chats</li>
              </ol>
            </div>

            {/* Stats/Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-card p-3 text-center border border-border">
                <div className="text-2xl font-bold text-purple-500">6+</div>
                <div className="text-xs text-muted-foreground">Features</div>
              </div>
              <div className="rounded-lg bg-card p-3 text-center border border-border">
                <div className="text-2xl font-bold text-blue-500">∞</div>
                <div className="text-xs text-muted-foreground">Possibilities</div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Powered by{" "}
                <a
                  href=""
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-500 hover:underline"
                >
                  Ombre AI
                </a>
              </p>
            </div>
          </div>
        ) : (
          <Settings />
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg bg-card p-3 border border-border hover:border-purple-500/50 transition-colors">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div>
        <h4 className="text-sm font-medium mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}