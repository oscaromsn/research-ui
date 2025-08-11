"use client";

import { useAtomValue } from "jotai";
import { Activity, AlertCircle, Clock, Wifi, WifiOff, X } from "lucide-react";
import { useResearchAgent } from "@/lib/hooks/useResearchAgent";
import {
  connectionStateAtom,
  systemHealthAtom,
} from "@/lib/state/researchAtoms";

/**
 * System Status Panel Component
 *
 * Displays real-time system health information including:
 * - Connection status with retry information
 * - Rate limiting warnings
 * - Circuit breaker status
 * - Manual retry controls
 */
export function SystemStatusPanel() {
  const connectionState = useAtomValue(connectionStateAtom);
  const systemHealth = useAtomValue(systemHealthAtom);
  const { retryConnection, dismissWarning, checkSystemHealth } =
    useResearchAgent();

  // Don't show panel if everything is healthy and connected
  const shouldShowPanel =
    !connectionState.isConnected ||
    connectionState.isConnecting ||
    connectionState.lastError ||
    systemHealth.warnings.length > 0 ||
    !systemHealth.isHealthy;

  if (!shouldShowPanel) {
    return null;
  }

  const getConnectionStatusIcon = () => {
    if (connectionState.isConnecting) {
      return <Activity className="h-4 w-4 animate-spin text-yellow-500" />;
    }
    if (connectionState.isConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    }
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };

  const getConnectionStatusText = () => {
    if (connectionState.isConnecting) {
      return `Connecting... (attempt ${connectionState.retryAttempt}/${connectionState.maxRetryAttempts})`;
    }
    if (connectionState.isConnected) {
      return "Connected";
    }
    if (connectionState.lastError) {
      return `Disconnected: ${connectionState.lastError}`;
    }
    return "Disconnected";
  };

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) {
      return "Never";
    }
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  };

  const getWarningIcon = (severity: string) => {
    const colorClass =
      severity === "high"
        ? "text-red-500"
        : severity === "medium"
          ? "text-yellow-500"
          : "text-blue-500";
    return <AlertCircle className={`h-4 w-4 ${colorClass}`} />;
  };

  const getWarningBgColor = (severity: string) => {
    return severity === "high"
      ? "bg-red-50 border-red-200"
      : severity === "medium"
        ? "bg-yellow-50 border-yellow-200"
        : "bg-blue-50 border-blue-200";
  };

  return (
    <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-medium text-gray-900 text-sm">
          {getConnectionStatusIcon()}
          System Status
        </h3>
        <button
          onClick={checkSystemHealth}
          className="flex items-center gap-1 text-gray-500 text-xs hover:text-gray-700"
        >
          <Activity className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {/* Connection Status */}
      <div className="rounded-md bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium text-gray-700 text-sm">Connection</span>
          <span className="text-gray-500 text-xs">
            {getConnectionStatusText()}
          </span>
        </div>

        {connectionState.lastErrorTime && (
          <div className="mb-2 text-gray-600 text-xs">
            Last error: {formatTimestamp(connectionState.lastErrorTime)}
          </div>
        )}

        <div className="flex justify-between text-gray-500 text-xs">
          <span>
            Success: {connectionState.connectionStats.successfulConnections} |
            Failed: {connectionState.connectionStats.failedConnections}
          </span>
          {connectionState.lastError &&
            connectionState.retryAttempt < connectionState.maxRetryAttempts && (
              <button
                onClick={retryConnection}
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                Retry Now
              </button>
            )}
        </div>

        {connectionState.nextRetryDelay && (
          <div className="mt-2 flex items-center gap-1 text-gray-600 text-xs">
            <Clock className="h-3 w-3" />
            Next retry in {Math.round(connectionState.nextRetryDelay / 1000)}s
          </div>
        )}
      </div>

      {/* Rate Limiting Status */}
      {systemHealth.rateLimitingStatus.queuedRequests > 0 && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
          <div className="mb-1 flex items-center gap-2 font-medium text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            Rate Limiting Active
          </div>
          <div className="text-xs text-yellow-700">
            {systemHealth.rateLimitingStatus.queuedRequests} requests queued.
            Active: {systemHealth.rateLimitingStatus.activeRequests}/
            {systemHealth.rateLimitingStatus.maxConcurrent}
          </div>
        </div>
      )}

      {/* Circuit Breaker Status */}
      {systemHealth.circuitBreakerStatus.state !== "CLOSED" && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <div className="mb-1 flex items-center gap-2 font-medium text-red-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            Circuit Breaker {systemHealth.circuitBreakerStatus.state}
          </div>
          <div className="text-red-700 text-xs">
            Failures: {systemHealth.circuitBreakerStatus.failures}
            {systemHealth.circuitBreakerStatus.lastFailureTime && (
              <span>
                {" "}
                | Last failure:{" "}
                {formatTimestamp(
                  systemHealth.circuitBreakerStatus.lastFailureTime
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* System Warnings */}
      {systemHealth.warnings.map((warning) => (
        <div
          key={warning.id}
          className={`rounded-md border p-3 ${getWarningBgColor(warning.severity)}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2 font-medium text-sm">
                {getWarningIcon(warning.severity)}
                {warning.type.replace("_", " ")} Warning
              </div>
              <div className="mb-2 text-gray-700 text-xs">
                {warning.message}
              </div>
              <div className="text-gray-500 text-xs">
                {formatTimestamp(warning.timestamp)}
                {warning.canRetry && (
                  <span className="ml-2 text-blue-600">• Can retry</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {warning.canRetry && warning.type === "CONNECTION" && (
                <button
                  onClick={retryConnection}
                  className="rounded bg-blue-100 px-2 py-1 text-blue-700 text-xs hover:bg-blue-200"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => dismissWarning(warning.id)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Health Check Info */}
      {systemHealth.lastHealthCheck && (
        <div className="border-gray-200 border-t pt-2 text-gray-500 text-xs">
          Last health check: {formatTimestamp(systemHealth.lastHealthCheck)}
        </div>
      )}
    </div>
  );
}
