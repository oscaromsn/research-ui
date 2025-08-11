/**
 * Server-Sent Events (SSE) utilities for streaming research pipeline updates
 * Provides functions to create, manage, and format SSE responses
 */

import type {
  ResearchPipelineStage,
  ResearchSession,
  ResearchUpdate,
  ResearchUpdateData,
  ResearchUpdateType,
  SSEEvent,
  SSEStreamConfig,
} from "../types/streaming";

import type {
  EnhancedErrorInfo,
  ErrorClassification,
} from "../../../packages/shared-types/src/sse-events";

// Re-export for use by other modules
export type { ErrorClassification };

/**
 * Default SSE stream configuration
 */
export const DEFAULT_SSE_CONFIG: Required<SSEStreamConfig> = {
  keepAliveInterval: 30000, // 30 seconds
  maxConnectionTime: 600000, // 10 minutes
  enableProgressUpdates: true,
  enableStreamChunks: true,
  customHeaders: {},
};

/**
 * Formats a ResearchUpdate as a proper SSE event string
 */
export function formatSSEEvent(update: ResearchUpdate): string {
  const sseEvent: SSEEvent = {
    id: update.id || generateEventId(),
    event: "research-update",
    data: JSON.stringify(update),
  };

  let eventString = "";

  if (sseEvent.id) {
    eventString += `id: ${sseEvent.id}\n`;
  }

  if (sseEvent.event) {
    eventString += `event: ${sseEvent.event}\n`;
  }

  eventString += `data: ${sseEvent.data}\n\n`;

  return eventString;
}

/**
 * Creates a keep-alive SSE event to maintain connection
 */
export function createKeepAliveEvent(): string {
  return `event: keep-alive\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`;
}

/**
 * Creates user-friendly error messages based on error classification
 */
function getErrorDisplayMessage(error: Error, classification: ErrorClassification): string {
  switch (classification) {
    case 'RATE_LIMIT':
      return 'API rate limit exceeded. Please wait a few minutes before trying again.';
    case 'AUTHENTICATION':
      return 'Authentication failed. Please check your API credentials.';
    case 'CONFIGURATION':
      return 'Configuration error detected. Please check your settings.';
    case 'NETWORK':
      return 'Network connection error. Retrying automatically...';
    default:
      return `Error occurred: ${error.message}`;
  }
}

/**
 * Gets recommended user action based on error classification
 */
function getErrorAction(classification: ErrorClassification): string {
  switch (classification) {
    case 'RATE_LIMIT':
      return 'WAIT_AND_RETRY_LATER';
    case 'AUTHENTICATION':
      return 'CHECK_CREDENTIALS';
    case 'CONFIGURATION':
      return 'CHECK_SETTINGS';
    case 'NETWORK':
      return 'AUTOMATIC_RETRY';
    default:
      return 'MANUAL_RETRY';
  }
}

/**
 * Creates an SSE error event with enhanced error classification
 */
export function createErrorEvent(
  error: Error,
  stage?: ResearchPipelineStage
): string {
  const classification = classifyError(error);
  const isRecoverable = !isNonRecoverableError(error);
  const displayMessage = getErrorDisplayMessage(error, classification);
  
  // Create enhanced message that includes error classification info
  const enhancedMessage = `${displayMessage} [Classification: ${classification}, Recoverable: ${isRecoverable ? 'yes' : 'no'}, Action: ${getErrorAction(classification)}]`;
  
  const errorUpdate: ResearchUpdate = {
    stage: stage || "ERROR",
    type: "ERROR",
    message: enhancedMessage,
    data: {
      error: {
        message: error.message,
        code: classification, // Use classification as the error code
        ...(stage !== undefined && { stage }),
        recoverable: isRecoverable,
      },
    },
    timestamp: new Date().toISOString(),
  };

  return formatSSEEvent(errorUpdate);
}

/**
 * Creates an SSE completion event
 */
export function createCompletionEvent(): string {
  const completionUpdate: ResearchUpdate = {
    stage: "COMPLETED",
    type: "STATUS_CHANGE",
    message: "Research pipeline completed successfully",
    timestamp: new Date().toISOString(),
  };

  return formatSSEEvent(completionUpdate);
}

/**
 * Creates a Research Update for streaming
 */
export function createResearchUpdate(
  stage: ResearchPipelineStage,
  type: ResearchUpdateType,
  message: string,
  data?: ResearchUpdateData
): ResearchUpdate {
  const update: ResearchUpdate = {
    stage,
    type,
    message,
    id: generateEventId(),
    timestamp: new Date().toISOString(),
  };
  
  // Only add data if it's defined to avoid undefined assignment with exactOptionalPropertyTypes
  if (data !== undefined) {
    update.data = data;
  }
  
  return update;
}

/**
 * Creates a progress update for streaming
 */
export function createProgressUpdate(
  stage: ResearchPipelineStage,
  current: number,
  total: number,
  operation?: string
): ResearchUpdate {
  const percentage = Math.round((current / total) * 100);

  return createResearchUpdate(
    stage,
    "PROGRESS",
    `${operation || "Processing"}: ${current}/${total} (${percentage}%)`,
    {
      progress: {
        current,
        total,
        percentage,
        ...(operation !== undefined && { operation }),
      },
    }
  );
}

/**
 * Creates SSE headers for the response
 */
export function createSSEHeaders(
  customHeaders: Record<string, string> = {}
): Record<string, string> {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    // CORS headers are handled by Elysia middleware - do not set them here
    ...customHeaders,
  };
}

/**
 * Creates a streaming ResearchUpdate sender function
 */
export function createResearchUpdateSender(
  writer: WritableStreamDefaultWriter<Uint8Array>
) {
  const encoder = new TextEncoder();

  return {
    /**
     * Send a research update via SSE
     */
    async sendUpdate(update: ResearchUpdate): Promise<void> {
      const eventData = formatSSEEvent(update);
      await writer.write(encoder.encode(eventData));
    },

    /**
     * Send a progress update
     */
    async sendProgress(
      stage: ResearchPipelineStage,
      current: number,
      total: number,
      operation?: string
    ): Promise<void> {
      const update = createProgressUpdate(stage, current, total, operation);
      await this.sendUpdate(update);
    },

    /**
     * Send a status change update
     */
    async sendStatusChange(
      stage: ResearchPipelineStage,
      message: string,
      data?: ResearchUpdateData
    ): Promise<void> {
      const update = createResearchUpdate(
        stage,
        "STATUS_CHANGE",
        message,
        data
      );
      await this.sendUpdate(update);
    },

    /**
     * Send a data update
     */
    async sendData(
      stage: ResearchPipelineStage,
      message: string,
      data: ResearchUpdateData
    ): Promise<void> {
      const update = createResearchUpdate(stage, "DATA", message, data);
      await this.sendUpdate(update);
    },

    /**
     * Send a log message
     */
    async sendLog(
      stage: ResearchPipelineStage,
      message: string
    ): Promise<void> {
      const update = createResearchUpdate(stage, "LOG", message);
      await this.sendUpdate(update);
    },

    /**
     * Send an error
     */
    async sendError(
      error: Error,
      stage?: ResearchPipelineStage
    ): Promise<void> {
      const errorEvent = createErrorEvent(error, stage);
      await writer.write(encoder.encode(errorEvent));
    },

    /**
     * Send keep-alive ping
     */
    async sendKeepAlive(): Promise<void> {
      const keepAlive = createKeepAliveEvent();
      await writer.write(encoder.encode(keepAlive));
    },

    /**
     * Send completion event and close stream
     */
    async sendCompletion(): Promise<void> {
      const completion = createCompletionEvent();
      await writer.write(encoder.encode(completion));
    },
  };
}

/**
 * Creates a streaming response for SSE
 */
export function createSSEStream(config: SSEStreamConfig = {}): {
  response: Response;
  sender: ReturnType<typeof createResearchUpdateSender>;
  cleanup: () => void;
} {
  const streamConfig = { ...DEFAULT_SSE_CONFIG, ...config };

  let keepAliveInterval: Timer | null = null;
  let connectionTimeout: Timer | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Create a mock writer that uses the controller to enqueue data
      const mockWriter = {
        write: async (chunk: Uint8Array) => {
          controller.enqueue(chunk);
        },
        close: async () => {
          controller.close();
        },
        abort: async (reason?: any) => {
          controller.error(reason);
        },
        get closed() {
          return Promise.resolve();
        },
        get ready() {
          return Promise.resolve();
        }
      } as WritableStreamDefaultWriter<Uint8Array>;

      const sender = createResearchUpdateSender(mockWriter);

      // Set up keep-alive interval
      if (streamConfig.keepAliveInterval > 0) {
        keepAliveInterval = setInterval(async () => {
          try {
            await sender.sendKeepAlive();
          } catch (error) {
            console.warn("Keep-alive failed:", error);
          }
        }, streamConfig.keepAliveInterval);
      }

      // Set up connection timeout
      if (streamConfig.maxConnectionTime > 0) {
        connectionTimeout = setTimeout(() => {
          try {
            controller.close();
          } catch (error) {
            console.warn("Connection timeout cleanup failed:", error);
          }
        }, streamConfig.maxConnectionTime);
      }

      return sender;
    },

    cancel() {
      cleanup();
    },
  });

  const cleanup = () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
  };

  const response = new Response(stream, {
    headers: createSSEHeaders(streamConfig.customHeaders),
  });

  // Note: We need to create the sender properly, this is a simplified version
  const mockWriter = {
    write: async (data: Uint8Array) => {
      // In real implementation, this would write to the stream
      console.log("SSE Write:", new TextDecoder().decode(data));
    },
  } as WritableStreamDefaultWriter<Uint8Array>;

  const sender = createResearchUpdateSender(mockWriter);

  return { response, sender, cleanup };
}

/**
 * Utility functions
 */

/**
 * Generates a unique event ID for SSE events
 */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}


/**
 * Classifies errors into specific categories for targeted handling
 */
export function classifyError(error: Error): ErrorClassification {
  const errorMessage = error.message.toLowerCase();

  // Rate limiting and quota errors
  const rateLimitPatterns = [
    "tokens per day limit exceeded",
    "token_quota_exceeded",
    "too many requests", 
    "rate limit",
    "quota exceeded",
    "limit exceeded",
    "quota limit",
    "daily limit",
    "monthly limit", 
    "usage limit",
    "429",
  ];

  // Authentication and authorization errors
  const authPatterns = [
    "authentication",
    "authorization",
    "api key",
    "permission denied", 
    "unauthorized",
    "forbidden",
    "401",
    "403",
  ];

  // Configuration errors
  const configPatterns = [
    "invalid configuration",
    "misconfigured",
    "invalid api key",
    "missing configuration",
  ];

  // Network connectivity errors
  const networkPatterns = [
    "network error",
    "connection failed",
    "timeout",
    "unreachable",
    "dns",
    "connect econnrefused",
    "socket hang up",
  ];

  if (rateLimitPatterns.some(pattern => errorMessage.includes(pattern))) {
    return 'RATE_LIMIT';
  }
  
  if (authPatterns.some(pattern => errorMessage.includes(pattern))) {
    return 'AUTHENTICATION';
  }
  
  if (configPatterns.some(pattern => errorMessage.includes(pattern))) {
    return 'CONFIGURATION';
  }
  
  if (networkPatterns.some(pattern => errorMessage.includes(pattern))) {
    return 'NETWORK';
  }

  return 'UNKNOWN';
}

/**
 * Determines if an error is non-recoverable (should abort the research)
 */
function isNonRecoverableError(error: Error): boolean {
  const classification = classifyError(error);
  
  // Rate limits, auth issues, and config errors are non-recoverable
  // Network errors are recoverable (should retry)
  return ['RATE_LIMIT', 'AUTHENTICATION', 'CONFIGURATION'].includes(classification);
}

/**
 * Creates a research session for tracking SSE connections
 */
export function createResearchSession(
  legalQuestion: string,
  config: SSEStreamConfig = {}
): ResearchSession {
  const sessionId = `session-${generateEventId()}`;

  return {
    sessionId,
    legalQuestion,
    startTime: new Date(),
    currentStage: "INITIALIZING",
    config: { ...DEFAULT_SSE_CONFIG, ...config },
    connectionState: {
      isConnected: true,
      clientId: sessionId,
      startTime: new Date(),
      stage: "INITIALIZING",
      lastUpdateTime: new Date(),
    },
  };
}
