"use client";

import { useAtomValue } from "jotai";
import { AlertCircle, Wifi, WifiOff, Activity, Clock, X } from "lucide-react";
import { connectionStateAtom, systemHealthAtom } from "@/lib/state/researchAtoms";
import { useResearchAgent } from "@/lib/hooks/useResearchAgent";

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
  const { retryConnection, dismissWarning, checkSystemHealth } = useResearchAgent();

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
    if (!timestamp) return "Never";
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
    const colorClass = severity === 'high' ? 'text-red-500' : 
                      severity === 'medium' ? 'text-yellow-500' : 'text-blue-500';
    return <AlertCircle className={`h-4 w-4 ${colorClass}`} />;
  };

  const getWarningBgColor = (severity: string) => {
    return severity === 'high' ? 'bg-red-50 border-red-200' : 
           severity === 'medium' ? 'bg-yellow-50 border-yellow-200' : 
           'bg-blue-50 border-blue-200';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          {getConnectionStatusIcon()}
          System Status
        </h3>
        <button
          onClick={checkSystemHealth}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <Activity className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {/* Connection Status */}
      <div className="bg-gray-50 rounded-md p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Connection</span>
          <span className="text-xs text-gray-500">
            {getConnectionStatusText()}
          </span>
        </div>
        
        {connectionState.lastErrorTime && (
          <div className="text-xs text-gray-600 mb-2">
            Last error: {formatTimestamp(connectionState.lastErrorTime)}
          </div>
        )}

        <div className="flex justify-between text-xs text-gray-500">
          <span>
            Success: {connectionState.connectionStats.successfulConnections} | 
            Failed: {connectionState.connectionStats.failedConnections}
          </span>
          {connectionState.lastError && connectionState.retryAttempt < connectionState.maxRetryAttempts && (
            <button
              onClick={retryConnection}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Retry Now
            </button>
          )}
        </div>

        {connectionState.nextRetryDelay && (
          <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Next retry in {Math.round(connectionState.nextRetryDelay / 1000)}s
          </div>
        )}
      </div>

      {/* Rate Limiting Status */}
      {systemHealth.rateLimitingStatus.queuedRequests > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 mb-1">
            <AlertCircle className="h-4 w-4" />
            Rate Limiting Active
          </div>
          <div className="text-xs text-yellow-700">
            {systemHealth.rateLimitingStatus.queuedRequests} requests queued. 
            Active: {systemHealth.rateLimitingStatus.activeRequests}/{systemHealth.rateLimitingStatus.maxConcurrent}
          </div>
        </div>
      )}

      {/* Circuit Breaker Status */}
      {systemHealth.circuitBreakerStatus.state !== 'CLOSED' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-red-800 mb-1">
            <AlertCircle className="h-4 w-4" />
            Circuit Breaker {systemHealth.circuitBreakerStatus.state}
          </div>
          <div className="text-xs text-red-700">
            Failures: {systemHealth.circuitBreakerStatus.failures}
            {systemHealth.circuitBreakerStatus.lastFailureTime && (
              <span> | Last failure: {formatTimestamp(systemHealth.circuitBreakerStatus.lastFailureTime)}</span>
            )}
          </div>
        </div>
      )}

      {/* System Warnings */}
      {systemHealth.warnings.map((warning) => (
        <div
          key={warning.id}
          className={`border rounded-md p-3 ${getWarningBgColor(warning.severity)}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                {getWarningIcon(warning.severity)}
                {warning.type.replace('_', ' ')} Warning
              </div>
              <div className="text-xs text-gray-700 mb-2">
                {warning.message}
              </div>
              <div className="text-xs text-gray-500">
                {formatTimestamp(warning.timestamp)}
                {warning.canRetry && (
                  <span className="ml-2 text-blue-600">• Can retry</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {warning.canRetry && warning.type === 'CONNECTION' && (
                <button
                  onClick={retryConnection}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => dismissWarning(warning.id)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Health Check Info */}
      {systemHealth.lastHealthCheck && (
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          Last health check: {formatTimestamp(systemHealth.lastHealthCheck)}
        </div>
      )}
    </div>
  );
}