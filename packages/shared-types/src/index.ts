// Re-export all SSE event types and schemas
export * from "./sse-events.js";

// Additional utility types that might be useful across frontend and backend
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Health check response type
export interface HealthCheckResponse {
  status: "ok" | "error";
  timestamp: string;
  version: string;
  uptime?: number;
}

// Research request types
export interface ResearchRequest {
  legalQuestion: string;
  options?: {
    maxIterations?: number;
    autoMode?: boolean;
  };
}

export interface ResearchResponse {
  sessionId: string;
  status: "started" | "error";
  message?: string;
}
