"use client";

import { useResearchAgent } from "@/lib/hooks/useResearchAgent";
import { SystemStatusPanel } from "./system-status-panel";
import { ConnectionStatusIndicator } from "./connection-status-indicator";

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
    startResearch("What are the legal requirements for maritime salvage rights in international waters?");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Enhanced Legal Research Interface
        </h1>
        <div className="flex items-center gap-4">
          <ConnectionStatusIndicator showLabel={true} size="md" />
        </div>
      </header>

      {/* System Status Panel - Shows when there are issues */}
      <SystemStatusPanel />

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Research Controls
        </h2>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleStartResearch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Research in Progress...' : 'Start Demo Research'}
          </button>
          
          <button
            onClick={retryConnection}
            disabled={connectionState.isConnected || connectionState.isConnecting}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Retry Connection
          </button>
          
          <button
            onClick={checkSystemHealth}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Check System Health
          </button>
        </div>

        {/* Current Status Display */}
        <div className="bg-gray-50 rounded-md p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Current Status</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div>Stage: <span className="font-mono">{currentStage || 'IDLE'}</span></div>
            <div>Message: <span className="italic">{currentMessage || 'Ready to start research'}</span></div>
            {error && (
              <div className="text-red-600">Error: <span className="font-mono">{error}</span></div>
            )}
          </div>
        </div>

        {/* Connection Details */}
        <div className="bg-gray-50 rounded-md p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Connection Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <div>Status: <span className="font-mono">
                {connectionState.isConnecting ? 'CONNECTING' : 
                 connectionState.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span></div>
              <div>Retry Attempt: {connectionState.retryAttempt}/{connectionState.maxRetryAttempts}</div>
            </div>
            <div>
              <div>Total Attempts: {connectionState.connectionStats.totalAttempts}</div>
              <div>Success Rate: {
                connectionState.connectionStats.totalAttempts > 0 
                  ? Math.round((connectionState.connectionStats.successfulConnections / connectionState.connectionStats.totalAttempts) * 100)
                  : 0
              }%</div>
            </div>
          </div>
        </div>

        {/* System Health Summary */}
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">System Health Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <div>Overall Health: <span className={`font-mono ${systemHealth.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                {systemHealth.isHealthy ? 'HEALTHY' : 'ISSUES_DETECTED'}
              </span></div>
              <div>Active Warnings: {systemHealth.warnings.length}</div>
            </div>
            <div>
              <div>Circuit Breaker: <span className="font-mono">{systemHealth.circuitBreakerStatus.state}</span></div>
              <div>Rate Limited: <span className={`font-mono ${systemHealth.rateLimitingStatus.isRateLimited ? 'text-yellow-600' : 'text-green-600'}`}>
                {systemHealth.rateLimitingStatus.isRateLimited ? 'YES' : 'NO'}
              </span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Warnings List */}
      {systemHealth.warnings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active System Warnings ({systemHealth.warnings.length})
          </h2>
          <div className="space-y-3">
            {systemHealth.warnings.map((warning) => (
              <div key={warning.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      warning.severity === 'high' ? 'bg-red-500' : 
                      warning.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></span>
                    {warning.type.replace('_', ' ')} Warning
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{warning.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(warning.timestamp).toLocaleTimeString()}
                    {warning.canRetry && <span className="ml-2 text-blue-600">• Retryable</span>}
                  </div>
                </div>
                <button
                  onClick={() => dismissWarning(warning.id)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center py-4 border-t border-gray-200">
        Enhanced Legal Research Interface - Phase 4 Complete
        <br />
        Features: Connection Resilience • Rate Limit Protection • System Health Monitoring • Manual Controls
      </div>
    </div>
  );
}