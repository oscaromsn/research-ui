import { AlertCircle, Brain, Scroll } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

export interface StatusIndicatorData {
  icon: React.ReactNode;
  text: string;
  color: string;
  // Enhanced fields
  progress?: number; // 0-100 for progress bars
  estimatedTime?: string; // "~2 minutes remaining"
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "destructive";
  }>;
  details?: string; // Expandable details
  // Legacy fields for backward compatibility
  bgColor?: string;
  borderColor?: string;
}

export function getStatusIndicator(
  status: string,
  metadata: {
    progress?: number;
    estimatedTime?: string;
    onRetry?: () => void;
    onSkip?: () => void;
    errorMessage?: string;
  } = {}
): StatusIndicatorData {
  switch (status) {
    case "fetched":
      return {
        icon: <Scroll size={12} className="text-blue-500" />,
        text: "Retrieved",
        color: "text-blue-600",
        details: "Document successfully retrieved from search",
        // Legacy compatibility
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
      };
    case "analyzing":
      return {
        icon: <Brain size={12} className="animate-pulse text-blue-600" />,
        text: "Analyzing document content...",
        color: "text-blue-600",
        ...(metadata.progress !== undefined && { progress: metadata.progress }),
        ...(metadata.estimatedTime !== undefined && {
          estimatedTime: metadata.estimatedTime,
        }),
        details: "Processing document analysis with AI model",
        // Legacy compatibility
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
      };
    case "analyzed":
      return {
        icon: <Brain size={12} className="text-green-500" />,
        text: "Analyzed",
        color: "text-green-600",
        details: "Document analysis completed successfully",
        // Legacy compatibility
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800",
      };
    case "failed":
      return {
        icon: <AlertCircle size={12} className="text-red-500" />,
        text: "Analysis failed",
        color: "text-red-600",
        actions: [
          {
            label: "Retry",
            onClick:
              metadata.onRetry ||
              (() => {
                /* No-op */
              }),
            variant: "primary",
          },
          {
            label: "Skip",
            onClick:
              metadata.onSkip ||
              (() => {
                /* No-op */
              }),
            variant: "secondary",
          },
        ],
        details: metadata.errorMessage || "Analysis failed due to an error",
        // Legacy compatibility
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
      };
    case "error":
      return {
        icon: <AlertCircle size={12} className="text-red-500" />,
        text: "Error",
        color: "text-red-600",
        details: metadata.errorMessage || "An error occurred",
        // Legacy compatibility
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
      };
    default:
      return {
        icon: <Scroll size={12} className="text-gray-500" />,
        text: "Unknown",
        color: "text-gray-600",
        details: "Status information not available",
        // Legacy compatibility
        bgColor: "bg-gray-50 dark:bg-gray-900/20",
        borderColor: "border-gray-200 dark:border-gray-800",
      };
  }
}

interface DocumentStatusIndicatorProps {
  status: string;
  className?: string;
  // Enhanced props
  progress?: number;
  estimatedTime?: string;
  onRetry?: () => void;
  onSkip?: () => void;
  errorMessage?: string;
  details?: string;
}

export function DocumentStatusIndicator({
  status,
  className = "",
  progress,
  estimatedTime,
  onRetry,
  onSkip,
  errorMessage,
  details,
}: DocumentStatusIndicatorProps) {
  // Local state for collapsible details
  const [showDetails, setShowDetails] = useState(false);

  const statusIndicator = getStatusIndicator(status, {
    ...(progress !== undefined && { progress }),
    ...(estimatedTime !== undefined && { estimatedTime }),
    ...(onRetry !== undefined && { onRetry }),
    ...(onSkip !== undefined && { onSkip }),
    ...(errorMessage !== undefined && { errorMessage }),
  });

  // Use provided details or fall back to status details
  const finalDetails = details || statusIndicator.details;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {statusIndicator.icon}
          <span className={statusIndicator.color}>{statusIndicator.text}</span>
          {statusIndicator.estimatedTime && (
            <span className="text-muted-foreground text-sm">
              ({statusIndicator.estimatedTime})
            </span>
          )}
        </div>

        {statusIndicator.actions && (
          <div className="flex space-x-1">
            {statusIndicator.actions.map((action, index) => (
              <Button
                key={`${action.label}-${index}`}
                variant={action.variant === "primary" ? "default" : "outline"}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {statusIndicator.progress !== undefined && (
        <Progress value={statusIndicator.progress} className="w-full" />
      )}

      {finalDetails && (
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger className="text-muted-foreground text-xs hover:text-foreground">
            {showDetails ? "Hide details" : "Show details"}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 text-muted-foreground text-xs">
            {finalDetails}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
