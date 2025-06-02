import { Bell, Globe, LogOut, Moon, Settings, Shield, User } from "lucide-react"

import { Modal } from "@ui/modal"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
      <div className="space-y-6">
        <div className="flex items-center space-x-4 rounded-lg bg-[#f8fafc] p-4 dark:bg-[#1e2436]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4a90e2]">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h4 className="font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
              Sarah Chen
            </h4>
            <p className="text-[#64748b] text-xs dark:text-[#94a3b8]">
              sarah.chen@example.com
            </p>
            <span className="mt-1 inline-block rounded bg-[#dbeafe] px-2 py-0.5 text-[#2563eb] text-[10px] dark:bg-[#1e3a8a] dark:text-[#93c5fd]">
              Premium Plan
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {[
            {
              icon: Settings,
              label: "General Preferences",
              badge: null,
            },
            {
              icon: Bell,
              label: "Notifications",
              badge: "3",
            },
            {
              icon: Globe,
              label: "Language & Region",
              badge: null,
            },
            {
              icon: Shield,
              label: "Privacy & Security",
              badge: null,
            },
          ].map(item => (
            <button
              type="button"
              key={`preference-${item.label}`}
              className="flex w-full items-center justify-between rounded-lg p-3 text-[#4a5568] text-sm transition-colors hover:bg-[#f1f5f9] dark:text-[#a0aec0] dark:hover:bg-[#242a3d]"
            >
              <div className="flex items-center">
                <item.icon size={16} className="mr-3" />
                {item.label}
              </div>
              {item.badge && (
                <span className="rounded-full bg-[#ef4444] px-2 py-0.5 text-white text-xs">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between p-3 text-[#4a5568] text-sm dark:text-[#a0aec0]">
          <div className="flex items-center">
            <Moon size={16} className="mr-3" />
            Dark Mode
          </div>
          <button
            type="button"
            className="relative h-6 w-12 rounded-full bg-[#e2e8f0] dark:bg-[#2a3148]"
          >
            <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#3a7bb7] transition-transform" />
          </button>
        </div>
        <div className="border-[#e1e5eb] border-t pt-4 dark:border-[#2a3148]">
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-lg p-2 text-[#ef4444] text-sm transition-colors hover:bg-[#fef2f2] dark:hover:bg-[#451a1a]"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </Modal>
  )
}
