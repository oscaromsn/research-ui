import { AlertCircle, Brain, Loader2, Scroll } from "lucide-react";

export interface StatusIndicatorData {
  icon: React.ReactNode;
  text: string;
  bgColor: string;
  borderColor: string;
}

export function getStatusIndicator(status: string): StatusIndicatorData {
  switch (status) {
    case "fetched":
      return {
        icon: <Scroll size={12} className="text-blue-500" />,
        text: "Retrieved",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
      };
    case "analyzing":
      return {
        icon: <Loader2 size={12} className="animate-spin text-yellow-500" />,
        text: "Analyzing",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
      };
    case "analyzed":
      return {
        icon: <Brain size={12} className="text-green-500" />,
        text: "Analyzed",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800",
      };
    case "error":
      return {
        icon: <AlertCircle size={12} className="text-red-500" />,
        text: "Error",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
      };
    default:
      return {
        icon: <Scroll size={12} className="text-gray-500" />,
        text: "Unknown",
        bgColor: "bg-gray-50 dark:bg-gray-900/20",
        borderColor: "border-gray-200 dark:border-gray-800",
      };
  }
}

interface DocumentStatusIndicatorProps {
  status: string;
  className?: string;
}

export function DocumentStatusIndicator({
  status,
  className = "",
}: DocumentStatusIndicatorProps) {
  const statusIndicator = getStatusIndicator(status);

  return (
    <div
      className={`flex items-center gap-1 rounded-full bg-white/50 px-2 py-0.5 dark:bg-black/20 ${className}`}
    >
      {statusIndicator.icon}
      <span className="font-medium text-[10px]">{statusIndicator.text}</span>
    </div>
  );
}
