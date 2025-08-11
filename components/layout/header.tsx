"use client";

import { SettingsModal } from "@domain/guidance/modals/settings-modal";
import { ResearchLifecycle } from "@domain/guidance/research-lifecycle";
import { ConnectionStatusIndicator } from "@domain/legal-research/connection-status-indicator";
import { Play, Save, User } from "lucide-react";
import { useState } from "react";
export function Header() {
  const [showSettings, setShowSettings] = useState(false);
  return (
    <header className="flex items-center justify-between border-[#2a3148] border-b bg-[#1a1f2e] px-4 py-3 text-white">
      <div className="flex items-center">
        <div className="mr-4 flex items-center">
          <span className="mr-1 font-bold text-2xl">LS</span>
          <span className="font-medium text-lg">LexiSynth</span>
        </div>
        <div className="relative ml-4">
          <input
            type="text"
            defaultValue="Research: Maritime Salvage Rights - The 'Oceanic' Case"
            className="w-[340px] rounded border border-[#3a4055] bg-[#242a3d] px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#4a90e2]"
          />
        </div>
      </div>
      <ResearchLifecycle />
      <div className="flex items-center space-x-3">
        <ConnectionStatusIndicator showLabel={true} size="sm" />
        <button type="button" className="rounded-full p-1.5 hover:bg-[#242a3d]">
          <Play size={18} />
        </button>
        <button type="button" className="rounded-full p-1.5 hover:bg-[#242a3d]">
          <Save size={18} />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4a90e2] transition-colors hover:bg-[#3a7bb7]"
          onClick={() => setShowSettings(true)}
        >
          <User size={16} className="text-white" />
        </button>
      </div>
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </header>
  );
}
