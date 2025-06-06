import { X } from "lucide-react"
import type React from "react"
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "md" | "lg" | "xl"
}
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  if (!isOpen) {
    return null
  }
  const sizeClasses = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }
  return (
    <div className="fade-in-0 fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/50">
      <div
        className={`mx-4 flex max-h-[90vh] w-full flex-col rounded-lg bg-white shadow-lg dark:bg-[#1a1f2e] ${sizeClasses[size]}`}
      >
        <div className="flex items-center justify-between border-[#e1e5eb] border-b p-4 dark:border-[#2a3148]">
          <h3 className="break-words font-semibold text-[#1a1f2e] text-lg dark:text-white">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d]"
          >
            <X size={18} className="text-[#64748b] dark:text-[#94a3b8]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
