/**
 * Request throttler implementation for BAML operations
 * Limits concurrent requests and implements request queuing to prevent overwhelming the service
 */

export interface ThrottlerConfig {
  maxConcurrent: number; // Maximum concurrent requests allowed
  maxQueue: number; // Maximum requests that can be queued
  requestTimeout: number; // Individual request timeout in ms
}

export interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  context: string;
  timestamp: number;
}

export class RequestThrottler {
  private config: ThrottlerConfig;
  private activeRequests: Set<Promise<any>> = new Set();
  private requestQueue: QueuedRequest<any>[] = [];
  private stats = {
    totalRequests: 0,
    completedRequests: 0,
    rejectedRequests: 0,
    queueDropped: 0,
  };

  constructor(config: Partial<ThrottlerConfig> = {}) {
    this.config = {
      maxConcurrent: 3, // Conservative limit for BAML requests
      maxQueue: 10, // Queue up to 10 requests
      requestTimeout: 120000, // 2 minutes per request
      ...config,
    };
  }

  /**
   * Execute a request with throttling protection
   */
  async execute<T>(
    requestFn: () => Promise<T>,
    context: string = 'unknown'
  ): Promise<T> {
    this.stats.totalRequests++;

    // If we're under the concurrent limit, execute immediately
    if (this.activeRequests.size < this.config.maxConcurrent) {
      return this.executeRequest(requestFn, context);
    }

    // Otherwise, queue the request
    return this.queueRequest(requestFn, context);
  }

  /**
   * Execute a request immediately (with timeout protection)
   */
  private async executeRequest<T>(
    requestFn: () => Promise<T>,
    context: string
  ): Promise<T> {
    console.log(
      `🚀 Executing BAML request: ${context} (${this.activeRequests.size}/${this.config.maxConcurrent} active)`
    );

    // Create request with timeout
    const requestPromise = Promise.race([
      requestFn(),
      this.createTimeout(this.config.requestTimeout, context),
    ]) as Promise<T>;

    // Track active request
    this.activeRequests.add(requestPromise);

    try {
      const result = await requestPromise;
      this.stats.completedRequests++;
      console.log(`✅ BAML request completed: ${context}`);
      return result;
    } catch (error) {
      this.stats.rejectedRequests++;
      console.error(`❌ BAML request failed: ${context}`, error);
      throw error;
    } finally {
      // Remove from active requests and process queue
      this.activeRequests.delete(requestPromise);
      this.processQueue();
    }
  }

  /**
   * Queue a request for later execution
   */
  private async queueRequest<T>(
    requestFn: () => Promise<T>,
    context: string
  ): Promise<T> {
    // Check if queue is full
    if (this.requestQueue.length >= this.config.maxQueue) {
      this.stats.queueDropped++;
      throw new Error(
        `Request throttler queue is full (${this.config.maxQueue}). Request for ${context} dropped.`
      );
    }

    console.log(
      `⏳ Queuing BAML request: ${context} (${this.requestQueue.length + 1}/${this.config.maxQueue} queued)`
    );

    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push({
        execute: requestFn,
        resolve,
        reject,
        context,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Process the next item in the queue if slots are available
   */
  private processQueue(): void {
    if (
      this.activeRequests.size < this.config.maxConcurrent &&
      this.requestQueue.length > 0
    ) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        const { execute, resolve, reject, context } = nextRequest;

        // Check for expired requests (optional cleanup)
        const age = Date.now() - nextRequest.timestamp;
        if (age > this.config.requestTimeout) {
          reject(new Error(`Queued request for ${context} expired after ${age}ms`));
          this.processQueue(); // Try the next one
          return;
        }

        // Execute the queued request
        this.executeRequest(execute, context)
          .then(resolve)
          .catch(reject);
      }
    }
  }

  /**
   * Create a timeout promise that rejects after the specified time
   */
  private createTimeout(timeoutMs: number, context: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`BAML request timeout after ${timeoutMs}ms for ${context}`));
      }, timeoutMs);
    });
  }

  /**
   * Get current throttler status and statistics
   */
  getStatus() {
    return {
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      config: this.config,
      stats: this.stats,
    };
  }

  /**
   * Clear the request queue (useful for cleanup)
   */
  clearQueue(): void {
    const dropped = this.requestQueue.length;
    this.requestQueue.forEach(request => {
      request.reject(new Error(`Request queue cleared for ${request.context}`));
    });
    this.requestQueue = [];
    this.stats.queueDropped += dropped;
    console.log(`🧹 Cleared ${dropped} queued BAML requests`);
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      completedRequests: 0,
      rejectedRequests: 0,
      queueDropped: 0,
    };
  }
}

// Global request throttler instance for BAML operations
export const bamlRequestThrottler = new RequestThrottler({
  maxConcurrent: 4, // Optimized for parallel document analysis (was 2)
  maxQueue: 12, // Increased queue capacity for better throughput (was 8)
  requestTimeout: 90000, // 90 seconds per BAML request
});