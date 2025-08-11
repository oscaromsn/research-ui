/**
 * API type definitions for Eden Treaty type-safe client
 * Re-exports the Elysia app type from the backend
 */

// Re-export the App type from the backend for Eden Treaty
export type { App } from "../../../api/src/app.js";

// Additional API-related types that might be useful
export interface APIError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface APIOptions {
  timeout?: number;
  signal?: AbortSignal;
}
