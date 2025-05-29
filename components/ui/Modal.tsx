import { X } from "lucide-react";
import type React from "react";
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
}
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  if (!isOpen) return null;
  const sizeClasses = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };
  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 animate-in fade-in-0">
      <div
        className={`bg-white dark:bg-[#1a1f2e] rounded-lg shadow-lg w-full ${sizeClasses[size]} mx-4`}
      >
        <div className="flex justify-between items-center p-4 border-[#e1e5eb] dark:border-[#2a3148] border-b">
          <h3 className="font-semibold text-[#1a1f2e] dark:text-white text-lg">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d] p-1 rounded-full transition-colors"
          >
            <X size={18} className="text-[#64748b] dark:text-[#94a3b8]" />
          </button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
