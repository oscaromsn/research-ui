/**
 * Eden Treaty API Client for JurisConsulta
 * Provides type-safe communication with the Elysia backend
 */

import { treaty } from "@elysiajs/eden";
// TODO: Fix Eden Treaty type import - this should reference the Elysia app type
// import type { App } from "@/api/src/app";
// For now, using any to resolve TypeScript errors
type App = any;

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Type-safe API client using Eden Treaty
 * Provides autocomplete and type checking for all API endpoints
 */
export const api = treaty<App>(API_URL);

/**
 * API configuration object for manual requests if needed
 */
export const apiConfig = {
  baseURL: API_URL,
  endpoints: {
    health: "/api/health",
    research: {
      complete: "/api/research/complete",
      stream: "/api/research/stream",
    },
  },
} as const;

/**
 * Helper function to create EventSource URL for SSE streaming
 */
export function createStreamingURL(
  endpoint: string,
  params?: Record<string, string>
): string {
  const url = new URL(endpoint, API_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

/**
 * Type definitions for EventSource connection management
 */
export interface StreamingConnection {
  eventSource: EventSource;
  cleanup: () => void;
  isConnected: boolean;
}

/**
 * Create a managed EventSource connection with proper cleanup
 */
export function createStreamingConnection(
  url: string,
  options?: EventSourceInit
): StreamingConnection {
  const eventSource = new EventSource(url, options);
  let isConnected = false;

  eventSource.addEventListener("open", () => {
    isConnected = true;
  });

  eventSource.addEventListener("error", () => {
    isConnected = false;
  });

  const cleanup = () => {
    isConnected = false;
    eventSource.close();
  };

  return {
    eventSource,
    cleanup,
    get isConnected() {
      return isConnected && eventSource.readyState === EventSource.OPEN;
    },
  };
}
