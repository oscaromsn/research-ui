/**
 * Enhanced EventSource Manager with Connection Resilience
 * Provides connection limits, progressive backoff, and retry logic for EventSource connections
 */

export interface EventSourceConfig {
  maxRetryAttempts: number; // Maximum connection retry attempts
  initialBackoffMs: number; // Initial retry delay
  maxBackoffMs: number; // Maximum retry delay
  backoffMultiplier: number; // Backoff multiplier for exponential backoff
  connectionTimeoutMs: number; // Timeout for connection establishment
}

export interface EventSourceStats {
  totalAttempts: number;
  successfulConnections: number;
  failedConnections: number;
  lastConnectionTime: number;
  lastErrorTime: number;
  currentBackoffMs: number;
}

export interface ResilientEventSourceCallbacks {
  onOpen?: (event: Event) => void;
  onError?: (error: Error, willRetry: boolean, attempt: number) => void;
  onRetryAttempt?: (attempt: number, delayMs: number) => void;
  onConnectionEstablished?: () => void;
  onConnectionFailed?: (finalError: Error) => void;
  onMaxRetriesReached?: () => void;
}

export class ResilientEventSource {
  private config: EventSourceConfig;
  private stats: EventSourceStats;
  private callbacks: ResilientEventSourceCallbacks;
  private eventSource: EventSource | null = null;
  private isConnecting = false;
  private shouldReconnect = true;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private connectionTimeoutId: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, EventListener[]> = new Map();
  private url: string;
  private eventSourceOptions: EventSourceInit | undefined;

  constructor(
    url: string,
    callbacks: ResilientEventSourceCallbacks = {},
    config: Partial<EventSourceConfig> = {},
    eventSourceOptions?: EventSourceInit
  ) {
    this.url = url;
    this.callbacks = callbacks;
    this.eventSourceOptions = eventSourceOptions;

    this.config = {
      maxRetryAttempts: 3,
      initialBackoffMs: 1000, // 1 second
      maxBackoffMs: 30000, // 30 seconds
      backoffMultiplier: 2,
      connectionTimeoutMs: 15000, // 15 seconds
      ...config,
    };

    this.stats = {
      totalAttempts: 0,
      successfulConnections: 0,
      failedConnections: 0,
      lastConnectionTime: 0,
      lastErrorTime: 0,
      currentBackoffMs: this.config.initialBackoffMs,
    };
  }

  /**
   * Add event listener for a specific event type
   */
  addEventListener(type: string, listener: EventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)?.push(listener);

    // If EventSource is already connected, add the listener immediately
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      this.eventSource.addEventListener(type, listener);
    }
  }

  /**
   * Remove event listener for a specific event type
   */
  removeEventListener(type: string, listener: EventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }

    if (this.eventSource) {
      this.eventSource.removeEventListener(type, listener);
    }
  }

  /**
   * Connect to EventSource with retry logic
   */
  async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.shouldReconnect = true;
    await this.attemptConnection();
  }

  /**
   * Attempt to establish EventSource connection
   */
  private async attemptConnection(retryAttempt = 0): Promise<void> {
    if (!this.shouldReconnect || retryAttempt >= this.config.maxRetryAttempts) {
      if (retryAttempt >= this.config.maxRetryAttempts) {
        const finalError = new Error(
          `Failed to establish EventSource connection after ${this.config.maxRetryAttempts} attempts`
        );
        this.callbacks.onConnectionFailed?.(finalError);
        this.callbacks.onMaxRetriesReached?.();
        this.isConnecting = false;
      }
      return;
    }

    this.isConnecting = true;
    this.stats.totalAttempts++;

    // Calculate backoff delay for retry attempts
    if (retryAttempt > 0) {
      const backoffMs = Math.min(
        this.config.initialBackoffMs *
          this.config.backoffMultiplier ** (retryAttempt - 1),
        this.config.maxBackoffMs
      );
      this.stats.currentBackoffMs = backoffMs;

      this.callbacks.onRetryAttempt?.(retryAttempt, backoffMs);

      await new Promise((resolve) => {
        this.reconnectTimeoutId = setTimeout(resolve, backoffMs);
      });

      if (!this.shouldReconnect) {
        this.isConnecting = false;
        return;
      }
    }

    try {
      // Create new EventSource connection
      this.eventSource = new EventSource(this.url, this.eventSourceOptions);

      // Set connection timeout
      this.connectionTimeoutId = setTimeout(() => {
        if (
          this.eventSource &&
          this.eventSource.readyState === EventSource.CONNECTING
        ) {
          this.eventSource.close();
          const timeoutError = new Error(
            `EventSource connection timeout after ${this.config.connectionTimeoutMs}ms`
          );
          this.handleConnectionError(timeoutError, retryAttempt);
        }
      }, this.config.connectionTimeoutMs);

      // Set up EventSource event handlers
      this.eventSource.onopen = (event) => {
        this.clearConnectionTimeout();
        this.stats.successfulConnections++;
        this.stats.lastConnectionTime = Date.now();
        this.stats.currentBackoffMs = this.config.initialBackoffMs; // Reset backoff
        this.isConnecting = false;

        // Add all registered event listeners
        for (const [type, listeners] of this.eventListeners) {
          for (const listener of listeners) {
            this.eventSource?.addEventListener(type, listener);
          }
        }

        this.callbacks.onOpen?.(event);
        this.callbacks.onConnectionEstablished?.();
      };

      this.eventSource.onerror = () => {
        this.clearConnectionTimeout();

        let error: Error;
        const readyState = this.eventSource?.readyState;

        switch (readyState) {
          case EventSource.CONNECTING:
            error = new Error("EventSource connection failed to establish");
            break;
          case EventSource.CLOSED:
            error = new Error("EventSource connection was closed unexpectedly");
            break;
          default:
            error = new Error(`EventSource error (readyState: ${readyState})`);
        }

        this.handleConnectionError(error, retryAttempt);
      };
    } catch (error) {
      this.clearConnectionTimeout();
      const connectionError =
        error instanceof Error ? error : new Error("Unknown EventSource error");
      this.handleConnectionError(connectionError, retryAttempt);
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  private handleConnectionError(error: Error, currentAttempt: number): void {
    this.stats.failedConnections++;
    this.stats.lastErrorTime = Date.now();
    this.isConnecting = false;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const nextAttempt = currentAttempt + 1;
    const willRetry =
      this.shouldReconnect && nextAttempt < this.config.maxRetryAttempts;

    this.callbacks.onError?.(error, willRetry, nextAttempt);

    if (willRetry) {
      // Schedule retry attempt
      setTimeout(() => {
        this.attemptConnection(nextAttempt);
      }, 100); // Small delay before retry
    } else {
      // Max retries reached
      this.callbacks.onConnectionFailed?.(error);
      if (nextAttempt >= this.config.maxRetryAttempts) {
        this.callbacks.onMaxRetriesReached?.();
      }
    }
  }

  /**
   * Clear connection timeout
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }
  }

  /**
   * Clear reconnect timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.isConnecting = false;

    this.clearConnectionTimeout();
    this.clearReconnectTimeout();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.eventListeners.clear();
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return {
      isConnected: this.eventSource?.readyState === EventSource.OPEN,
      isConnecting: this.isConnecting,
      readyState: this.eventSource?.readyState ?? -1,
      config: this.config,
      stats: this.stats,
    };
  }

  /**
   * Get current EventSource instance (if connected)
   */
  getEventSource(): EventSource | null {
    return this.eventSource;
  }

  /**
   * Reset connection statistics
   */
  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successfulConnections: 0,
      failedConnections: 0,
      lastConnectionTime: 0,
      lastErrorTime: 0,
      currentBackoffMs: this.config.initialBackoffMs,
    };
  }
}
