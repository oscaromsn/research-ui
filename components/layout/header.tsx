'use client'

import { Play, Save, User } from 'lucide-react'
import { useState } from 'react'

import { SettingsModal } from '@domain/guidance/modals/settings-modal'
import { ResearchLifecycle } from '@domain/guidance/research-lifecycle'
export function Header() {
  const [showSettings, setShowSettings] = useState(false)
  return (
    <header className="flex justify-between items-center bg-[#1a1f2e] px-4 py-3 border-[#2a3148] border-b text-white">
      <div className="flex items-center">
        <div className="flex items-center mr-4">
          <span className="mr-1 font-bold text-2xl">LS</span>
          <span className="font-medium text-lg">LexiSynth</span>
        </div>
        <div className="relative ml-4">
          <input
            type="text"
            defaultValue="Research: Maritime Salvage Rights - The 'Oceanic' Case"
            className="bg-[#242a3d] px-3 py-1 border border-[#3a4055] rounded focus:outline-none focus:ring-1 focus:ring-[#4a90e2] w-[340px] text-sm"
          />
        </div>
      </div>
      <ResearchLifecycle />
      <div className="flex items-center space-x-3">
        <button type="button" className="hover:bg-[#242a3d] p-1.5 rounded-full">
          <Play size={18} />
        </button>
        <button type="button" className="hover:bg-[#242a3d] p-1.5 rounded-full">
          <Save size={18} />
        </button>
        <button
          type="button"
          className="flex justify-center items-center bg-[#4a90e2] hover:bg-[#3a7bb7] rounded-full w-8 h-8 transition-colors"
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
  )
}
