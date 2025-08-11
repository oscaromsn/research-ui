"use client";

import { useResearchAgent } from "@/lib/hooks/useResearchAgent";
import { ConnectionStatusIndicator } from "./connection-status-indicator";
import { SystemStatusPanel } from "./system-status-panel";

/**
 * Enhanced Research Interface Demo
 *
 * Demonstrates the integration of new Phase 4 frontend improvements:
 * - System status panel with warnings and manual controls
 * - Connection status indicators
 * - Manual retry functionality
 * - Real-time health monitoring
 */
export function EnhancedResearchInterface() {
  const {
    startResearch,
    retryConnection,
    checkSystemHealth,
    isLoading,
    currentStage,
    currentMessage,
    error,
    connectionState,
    systemHealth,
    dismissWarning,
  } = useResearchAgent();

  const handleStartResearch = () => {
    startResearch(
      "What are the legal requirements for maritime salvage rights in international waters?"
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between border-gray-200 border-b pb-4">
        <h1 className="font-bold text-2xl text-gray-900">
          Enhanced Legal Research Interface
        </h1>
        <div className="flex items-center gap-4">
          <ConnectionStatusIndicator showLabel={true} size="md" />
        </div>
      </header>

      {/* System Status Panel - Shows when there are issues */}
      <SystemStatusPanel />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-900 text-lg">
          Research Controls
        </h2>

        <div className="mb-6 flex gap-4">
          <button
            onClick={handleStartResearch}
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Research in Progress..." : "Start Demo Research"}
          </button>

          <button
            onClick={retryConnection}
            disabled={
              connectionState.isConnected || connectionState.isConnecting
            }
            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Retry Connection
          </button>

          <button
            onClick={checkSystemHealth}
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Check System Health
          </button>
        </div>

        {/* Current Status Display */}
        <div className="mb-4 rounded-md bg-gray-50 p-4">
          <h3 className="mb-2 font-medium text-gray-700 text-sm">
            Current Status
          </h3>
          <div className="space-y-2 text-gray-600 text-sm">
            <div>
              Stage: <span className="font-mono">{currentStage || "IDLE"}</span>
            </div>
            <div>
              Message:{" "}
              <span className="italic">
                {currentMessage || "Ready to start research"}
              </span>
            </div>
            {error && (
              <div className="text-red-600">
                Error: <span className="font-mono">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Connection Details */}
        <div className="mb-4 rounded-md bg-gray-50 p-4">
          <h3 className="mb-2 font-medium text-gray-700 text-sm">
            Connection Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-gray-600 text-sm">
            <div>
              <div>
                Status:{" "}
                <span className="font-mono">
                  {connectionState.isConnecting
                    ? "CONNECTING"
                    : connectionState.isConnected
                      ? "CONNECTED"
                      : "DISCONNECTED"}
                </span>
              </div>
              <div>
                Retry Attempt: {connectionState.retryAttempt}/
                {connectionState.maxRetryAttempts}
              </div>
            </div>
            <div>
              <div>
                Total Attempts: {connectionState.connectionStats.totalAttempts}
              </div>
              <div>
                Success Rate:{" "}
                {connectionState.connectionStats.totalAttempts > 0
                  ? Math.round(
                      (connectionState.connectionStats.successfulConnections /
                        connectionState.connectionStats.totalAttempts) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>

        {/* System Health Summary */}
        <div className="rounded-md bg-gray-50 p-4">
          <h3 className="mb-2 font-medium text-gray-700 text-sm">
            System Health Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 text-gray-600 text-sm">
            <div>
              <div>
                Overall Health:{" "}
                <span
                  className={`font-mono ${systemHealth.isHealthy ? "text-green-600" : "text-red-600"}`}
                >
                  {systemHealth.isHealthy ? "HEALTHY" : "ISSUES_DETECTED"}
                </span>
              </div>
              <div>Active Warnings: {systemHealth.warnings.length}</div>
            </div>
            <div>
              <div>
                Circuit Breaker:{" "}
                <span className="font-mono">
                  {systemHealth.circuitBreakerStatus.state}
                </span>
              </div>
              <div>
                Rate Limited:{" "}
                <span
                  className={`font-mono ${systemHealth.rateLimitingStatus.isRateLimited ? "text-yellow-600" : "text-green-600"}`}
                >
                  {systemHealth.rateLimitingStatus.isRateLimited ? "YES" : "NO"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Warnings List */}
      {systemHealth.warnings.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900 text-lg">
            Active System Warnings ({systemHealth.warnings.length})
          </h2>
          <div className="space-y-3">
            {systemHealth.warnings.map((warning) => (
              <div
                key={warning.id}
                className="flex items-start justify-between rounded-md bg-gray-50 p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900 text-sm">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        warning.severity === "high"
                          ? "bg-red-500"
                          : warning.severity === "medium"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      }`}
                    />
                    {warning.type.replace("_", " ")} Warning
                  </div>
                  <div className="mt-1 text-gray-600 text-sm">
                    {warning.message}
                  </div>
                  <div className="mt-1 text-gray-500 text-xs">
                    {new Date(warning.timestamp).toLocaleTimeString()}
                    {warning.canRetry && (
                      <span className="ml-2 text-blue-600">• Retryable</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismissWarning(warning.id)}
                  className="px-2 py-1 text-gray-500 text-xs hover:text-gray-700"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-gray-200 border-t py-4 text-center text-gray-500 text-xs">
        Enhanced Legal Research Interface - Phase 4 Complete
        <br />
        Features: Connection Resilience • Rate Limit Protection • System Health
        Monitoring • Manual Controls
      </div>
    </div>
  );
}
