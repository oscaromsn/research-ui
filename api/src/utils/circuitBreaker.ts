/**
 * Circuit Breaker pattern implementation for BAML function calls
 * Prevents cascade failures and provides exponential backoff for rate-limited requests
 * Integrated with request throttling for comprehensive protection
 */

import { bamlRequestThrottler } from './requestThrottler';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  recoveryTimeout: number; // Time to wait before trying to close circuit (ms)
  maxRetries: number; // Maximum number of retries for a single request
  initialBackoffMs: number; // Initial backoff time for exponential backoff
  maxBackoffMs: number; // Maximum backoff time
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  consecutiveSuccesses: number;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 60 seconds
      maxRetries: 3,
      initialBackoffMs: 1000, // 1 second
      maxBackoffMs: 30000, // 30 seconds
      ...config,
    };

    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
      consecutiveSuccesses: 0,
    };
  }

  /**
   * Execute a function with circuit breaker protection and request throttling
   */
  async execute<T>(
    fn: () => Promise<T>,
    context: string = 'unknown'
  ): Promise<T> {
    // Check if circuit is open and should remain open
    if (this.state.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.state.lastFailureTime;
      if (timeSinceLastFailure < this.config.recoveryTimeout) {
        throw new CircuitBreakerError(
          `Circuit breaker is OPEN for ${context}. Retry after ${Math.ceil(
            (this.config.recoveryTimeout - timeSinceLastFailure) / 1000
          )} seconds.`,
          'CIRCUIT_OPEN'
        );
      }
      // Try to transition to HALF_OPEN
      this.state.state = 'HALF_OPEN';
      this.state.consecutiveSuccesses = 0;
    }

    // Use request throttler to execute with concurrency limits
    return bamlRequestThrottler.execute(
      () => this.executeWithRetries(fn, context),
      context
    );
  }

  /**
   * Execute function with retries and exponential backoff
   */
  private async executeWithRetries<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffTime = Math.min(
            this.config.initialBackoffMs * Math.pow(2, attempt - 1),
            this.config.maxBackoffMs
          );
          console.log(
            `🔄 Circuit breaker retry ${attempt}/${this.config.maxRetries} for ${context} after ${backoffTime}ms`
          );
          await this.delay(backoffTime);
        }

        const result = await fn();
        
        // Success - update state
        this.onSuccess();
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if this is a rate limiting error
        if (this.isRateLimitError(lastError)) {
          console.warn(`⚠️  Rate limit detected for ${context}:`, lastError.message);
          
          // For rate limiting, wait longer on each retry
          if (attempt < this.config.maxRetries - 1) {
            const rateLimitBackoff = Math.min(
              this.config.initialBackoffMs * Math.pow(3, attempt + 1), // More aggressive backoff for rate limits
              this.config.maxBackoffMs * 2 // Allow longer waits for rate limits
            );
            console.log(`⏳ Rate limit backoff: ${rateLimitBackoff}ms`);
            await this.delay(rateLimitBackoff);
          }
        }
        
        // For non-rate-limit errors, don't retry as aggressively
        else if (!this.isRetryableError(lastError)) {
          break; // Don't retry non-retryable errors
        }
      }
    }

    // All retries failed
    this.onFailure(context);
    
    if (lastError) {
      throw new CircuitBreakerError(
        `Circuit breaker: All retries failed for ${context}. ${lastError.message}`,
        'MAX_RETRIES_EXCEEDED',
        lastError
      );
    }
    
    throw new CircuitBreakerError(
      `Circuit breaker: Unknown error for ${context}`,
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state.state === 'HALF_OPEN') {
      this.state.consecutiveSuccesses++;
      // If we have enough consecutive successes, close the circuit
      if (this.state.consecutiveSuccesses >= 2) {
        this.state.state = 'CLOSED';
        this.state.failures = 0;
        console.log('✅ Circuit breaker transitioned to CLOSED');
      }
    } else if (this.state.state === 'CLOSED') {
      // Reset failure count on success
      this.state.failures = Math.max(0, this.state.failures - 1);
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(context: string): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    this.state.consecutiveSuccesses = 0;

    if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'OPEN';
      console.warn(
        `🚨 Circuit breaker OPENED for ${context} after ${this.state.failures} failures`
      );
    }
  }

  /**
   * Check if error is a rate limiting error
   */
  private isRateLimitError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('429') ||
      message.includes('too many requests') ||
      message.includes('rate limit') ||
      message.includes('quota exceeded') ||
      message.includes('token_quota_exceeded')
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Don't retry validation errors, authentication errors, etc.
    const nonRetryablePatterns = [
      'invalid',
      'unauthorized',
      'forbidden',
      'not found',
      'bad request',
      'validation',
    ];
    
    return !nonRetryablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): CircuitBreakerState & { config: CircuitBreakerConfig } {
    return {
      ...this.state,
      config: this.config,
    };
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
      consecutiveSuccesses: 0,
    };
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly type: 'CIRCUIT_OPEN' | 'MAX_RETRIES_EXCEEDED' | 'UNKNOWN_ERROR',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

// Global circuit breaker instance for BAML operations
export const bamlCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3, // Open circuit after 3 failures
  recoveryTimeout: 30000, // Try recovery after 30 seconds
  maxRetries: 2, // Max 2 retries per request
  initialBackoffMs: 2000, // Start with 2 second backoff
  maxBackoffMs: 60000, // Max 60 second backoff for rate limits
});