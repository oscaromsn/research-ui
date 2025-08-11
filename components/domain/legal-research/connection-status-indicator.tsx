"use client";

import { useAtomValue } from "jotai";
import { Activity, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useResearchAgent } from "@/lib/hooks/useResearchAgent";
import {
  connectionStateAtom,
  systemHealthAtom,
} from "@/lib/state/researchAtoms";

interface ConnectionStatusIndicatorProps {
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Connection Status Indicator Component
 *
 * A compact indicator showing real-time connection status with retry controls.
 * Can be embedded in headers, toolbars, or status bars.
 */
export function ConnectionStatusIndicator({
  showLabel = true,
  size = "md",
}: ConnectionStatusIndicatorProps) {
  const connectionState = useAtomValue(connectionStateAtom);
  const systemHealth = useAtomValue(systemHealthAtom);
  const { retryConnection } = useResearchAgent();

  const iconSizeClass = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  const textSizeClass = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  const getStatus = () => {
    if (connectionState.isConnecting) {
      return {
        icon: (
          <Activity
            className={`${iconSizeClass} animate-spin text-yellow-500`}
          />
        ),
        text: "Connecting...",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 border-yellow-200",
        showRetry: false,
      };
    }

    if (connectionState.isConnected) {
      const hasWarnings = systemHealth.warnings.length > 0;
      const isRateLimited = systemHealth.rateLimitingStatus.queuedRequests > 0;
      const circuitOpen = systemHealth.circuitBreakerStatus.state !== "CLOSED";

      if (hasWarnings || isRateLimited || circuitOpen) {
        return {
          icon: <AlertCircle className={`${iconSizeClass} text-yellow-500`} />,
          text: "Connected (Issues)",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 border-yellow-200",
          showRetry: false,
        };
      }

      return {
        icon: <Wifi className={`${iconSizeClass} text-green-500`} />,
        text: "Connected",
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
        showRetry: false,
      };
    }

    // Disconnected
    return {
      icon: <WifiOff className={`${iconSizeClass} text-red-500`} />,
      text: "Disconnected",
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
      showRetry: true,
    };
  };

  const status = getStatus();

  const handleRetry = async () => {
    if (status.showRetry) {
      await retryConnection();
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 ${status.bgColor} transition-colors duration-200`}
    >
      {status.icon}

      {showLabel && (
        <span className={`${textSizeClass} font-medium ${status.color}`}>
          {status.text}
        </span>
      )}

      {connectionState.retryAttempt > 0 && connectionState.isConnecting && (
        <span className={`${textSizeClass} text-gray-500`}>
          ({connectionState.retryAttempt}/{connectionState.maxRetryAttempts})
        </span>
      )}

      {status.showRetry && (
        <button
          onClick={handleRetry}
          className={`${iconSizeClass} text-gray-400 transition-colors hover:text-gray-600`}
          title="Retry connection"
        >
          <RefreshCw className={iconSizeClass} />
        </button>
      )}

      {/* Warning count indicator */}
      {systemHealth.warnings.length > 0 && (
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-bold text-white text-xs">
          {systemHealth.warnings.length > 9
            ? "9+"
            : systemHealth.warnings.length}
        </span>
      )}
    </div>
  );
}

/**
 * Minimal Connection Status Dot
 *
 * Just a colored dot indicator for very compact layouts
 */
export function ConnectionStatusDot() {
  const connectionState = useAtomValue(connectionStateAtom);
  const systemHealth = useAtomValue(systemHealthAtom);

  const getStatusColor = () => {
    if (connectionState.isConnecting) {
      return "bg-yellow-500";
    }
    if (connectionState.isConnected) {
      const hasIssues =
        systemHealth.warnings.length > 0 ||
        systemHealth.rateLimitingStatus.queuedRequests > 0 ||
        systemHealth.circuitBreakerStatus.state !== "CLOSED";
      return hasIssues ? "bg-yellow-500" : "bg-green-500";
    }
    return "bg-red-500";
  };

  const getTitle = () => {
    if (connectionState.isConnecting) {
      return "Connecting to research service...";
    }
    if (connectionState.isConnected) {
      const hasIssues = systemHealth.warnings.length > 0;
      return hasIssues
        ? "Connected with warnings"
        : "Connected to research service";
    }
    return "Disconnected from research service";
  };

  return (
    <div
      className={`h-2 w-2 rounded-full ${getStatusColor()} ${connectionState.isConnecting ? "animate-pulse" : ""}`}
      title={getTitle()}
    />
  );
}
