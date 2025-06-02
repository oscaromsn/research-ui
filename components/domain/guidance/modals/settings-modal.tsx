import { Bell, Globe, LogOut, Moon, Settings, Shield, User } from 'lucide-react'

import { Modal } from '@ui/modal'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
      <div className="space-y-6">
        <div className="flex items-center space-x-4 bg-[#f8fafc] dark:bg-[#1e2436] p-4 rounded-lg">
          <div className="flex justify-center items-center bg-[#4a90e2] rounded-full w-16 h-16">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h4 className="font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
              Sarah Chen
            </h4>
            <p className="text-[#64748b] dark:text-[#94a3b8] text-xs">
              sarah.chen@example.com
            </p>
            <span className="inline-block bg-[#dbeafe] dark:bg-[#1e3a8a] mt-1 px-2 py-0.5 rounded text-[#2563eb] text-[10px] dark:text-[#93c5fd]">
              Premium Plan
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {[
            {
              icon: Settings,
              label: 'General Preferences',
              badge: null,
            },
            {
              icon: Bell,
              label: 'Notifications',
              badge: '3',
            },
            {
              icon: Globe,
              label: 'Language & Region',
              badge: null,
            },
            {
              icon: Shield,
              label: 'Privacy & Security',
              badge: null,
            },
          ].map(item => (
            <button
              type="button"
              key={`preference-${item.label}`}
              className="flex justify-between items-center hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d] p-3 rounded-lg w-full text-[#4a5568] dark:text-[#a0aec0] text-sm transition-colors"
            >
              <div className="flex items-center">
                <item.icon size={16} className="mr-3" />
                {item.label}
              </div>
              {item.badge && (
                <span className="bg-[#ef4444] px-2 py-0.5 rounded-full text-white text-xs">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center p-3 text-[#4a5568] dark:text-[#a0aec0] text-sm">
          <div className="flex items-center">
            <Moon size={16} className="mr-3" />
            Dark Mode
          </div>
          <button
            type="button"
            className="relative bg-[#e2e8f0] dark:bg-[#2a3148] rounded-full w-12 h-6"
          >
            <div className="top-1 right-1 absolute bg-[#3a7bb7] rounded-full w-4 h-4 transition-transform" />
          </button>
        </div>
        <div className="pt-4 border-[#e1e5eb] dark:border-[#2a3148] border-t">
          <button
            type="button"
            className="flex justify-center items-center hover:bg-[#fef2f2] dark:hover:bg-[#451a1a] p-2 rounded-lg w-full text-[#ef4444] text-sm transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </Modal>
  )
}
