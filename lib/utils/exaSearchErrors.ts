/**
 * Custom error classes for Exa Search API
 * These provide specific error types that can be handled differently by the orchestrator
 */

/**
 * Base class for all Exa API errors
 */
export abstract class ExaError extends Error {
  public readonly status?: number
  public readonly response?: unknown
  public readonly requestId?: string
  public readonly query?: string

  constructor(
    message: string,
    options: {
      status?: number
      response?: unknown
      requestId?: string
      query?: string
      cause?: Error
    } = {}
  ) {
    super(message)
    this.name = this.constructor.name
    if (options.status !== undefined) {
      this.status = options.status
    }
    if (options.response !== undefined) {
      this.response = options.response
    }
    if (options.requestId !== undefined) {
      this.requestId = options.requestId
    }
    if (options.query !== undefined) {
      this.query = options.query
    }

    if (options.cause) {
      this.cause = options.cause
    }

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Returns a JSON representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      response: this.response,
      requestId: this.requestId,
      query: this.query,
      stack: this.stack,
    }
  }
}

/**
 * Rate limit exceeded error (429)
 * Orchestrator can implement exponential backoff retry logic
 */
export class ExaRateLimitError extends ExaError {
  public readonly retryAfter?: number
  public readonly rateLimitType?: "requests" | "quota" | "concurrent"

  constructor(
    message: string,
    options: {
      status?: number
      response?: unknown
      requestId?: string
      query?: string
      retryAfter?: number
      rateLimitType?: "requests" | "quota" | "concurrent"
      cause?: Error
    } = {}
  ) {
    super(message, options)
    if (options.retryAfter !== undefined) {
      this.retryAfter = options.retryAfter
    }
    this.rateLimitType = options.rateLimitType || "requests"
  }

  /**
   * Suggests a retry delay in milliseconds based on Retry-After header or exponential backoff
   */
  getSuggestedRetryDelay(attempt = 1): number {
    if (this.retryAfter) {
      return this.retryAfter * 1000 // Convert seconds to milliseconds
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * 2 ** (attempt - 1), 30000)
  }
}

/**
 * Authentication/authorization errors (401/403)
 * Usually indicates invalid API key or insufficient permissions
 */
export class ExaAuthError extends ExaError {
  public readonly authType:
    | "invalid_key"
    | "insufficient_permissions"
    | "expired_key"
    | "unknown"

  constructor(
    message: string,
    options: {
      status?: number
      response?: unknown
      requestId?: string
      query?: string
      authType?:
        | "invalid_key"
        | "insufficient_permissions"
        | "expired_key"
        | "unknown"
      cause?: Error
    } = {}
  ) {
    super(message, options)
    this.authType = options.authType || "unknown"
  }

  /**
   * Indicates if this error is potentially recoverable
   */
  isRecoverable(): boolean {
    // Invalid or expired keys are not recoverable, insufficient permissions might be
    return this.authType === "insufficient_permissions"
  }
}

/**
 * Server errors from Exa API (5xx)
 * These are typically temporary and can be retried
 */
export class ExaServerError extends ExaError {
  public readonly isTemporary: boolean

  constructor(
    message: string,
    options: {
      status?: number
      response?: unknown
      requestId?: string
      query?: string
      isTemporary?: boolean
      cause?: Error
    } = {}
  ) {
    super(message, options)
    // Most 5xx errors are temporary, except for 501 (Not Implemented)
    this.isTemporary = options.isTemporary ?? this.status !== 501
  }

  /**
   * Suggests a retry delay for server errors (typically shorter than rate limits)
   */
  getSuggestedRetryDelay(attempt = 1): number {
    // Faster retry for server errors: 500ms, 1s, 2s, 4s, max 10s
    return Math.min(500 * 2 ** (attempt - 1), 10000)
  }
}

/**
 * Client errors from Exa API (4xx, excluding auth and rate limit)
 * These typically indicate problems with the request format/content
 */
export class ExaClientError extends ExaError {
  public readonly errorCode?: string
  public readonly validationErrors?: Array<{
    field: string
    message: string
    value?: unknown
  }>

  constructor(
    message: string,
    options: {
      status?: number
      response?: unknown
      requestId?: string
      query?: string
      errorCode?: string
      validationErrors?: Array<{
        field: string
        message: string
        value?: unknown
      }>
      cause?: Error
    } = {}
  ) {
    super(message, options)
    if (options.errorCode !== undefined) {
      this.errorCode = options.errorCode
    }
    if (options.validationErrors !== undefined) {
      this.validationErrors = options.validationErrors
    }
  }

  /**
   * Indicates if this error might be fixed by retrying (typically not for client errors)
   */
  isRetryable(): boolean {
    // Most client errors are not retryable, except for some timeout-related ones
    return this.status === 408 || this.errorCode === "timeout"
  }
}

/**
 * Network/timeout errors
 * These can often be retried with backoff
 */
export class ExaNetworkError extends ExaError {
  public readonly isTimeout: boolean
  public readonly isConnectionError: boolean

  constructor(
    message: string,
    options: {
      query?: string
      isTimeout?: boolean
      isConnectionError?: boolean
      cause?: Error
    } = {}
  ) {
    super(message, options)
    this.isTimeout = options.isTimeout ?? false
    this.isConnectionError = options.isConnectionError ?? false
  }

  /**
   * Suggests a retry delay for network errors
   */
  getSuggestedRetryDelay(attempt = 1): number {
    if (this.isTimeout) {
      // Longer delay for timeouts: 2s, 4s, 8s, 16s, max 60s
      return Math.min(2000 * 2 ** (attempt - 1), 60000)
    }

    // Shorter delay for connection errors: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * 2 ** (attempt - 1), 30000)
  }
}

/**
 * API configuration error
 * Indicates missing or invalid configuration (API key, etc.)
 */
export class ExaConfigError extends ExaError {
  public readonly configType:
    | "missing_api_key"
    | "invalid_base_url"
    | "invalid_timeout"
    | "unknown"

  constructor(
    message: string,
    options: {
      configType?:
        | "missing_api_key"
        | "invalid_base_url"
        | "invalid_timeout"
        | "unknown"
      cause?: Error
    } = {}
  ) {
    super(message, options)
    this.configType = options.configType || "unknown"
  }

  /**
   * Configuration errors are typically not retryable without fixing the config
   */
  isRetryable(): boolean {
    return false
  }
}

/**
 * Response parsing error
 * When the API returns data that doesn't match expected format
 */
export class ExaParsingError extends ExaError {
  public readonly expectedFormat?: string
  public readonly actualFormat?: string

  constructor(
    message: string,
    options: {
      response?: unknown
      expectedFormat?: string
      actualFormat?: string
      cause?: Error
    } = {}
  ) {
    super(message, options)
    if (options.expectedFormat !== undefined) {
      this.expectedFormat = options.expectedFormat
    }
    if (options.actualFormat !== undefined) {
      this.actualFormat = options.actualFormat
    }
  }
}

/**
 * Type guard functions to check error types
 */
export function isExaError(error: unknown): error is ExaError {
  return error instanceof ExaError
}

export function isExaRateLimitError(
  error: unknown
): error is ExaRateLimitError {
  return error instanceof ExaRateLimitError
}

export function isExaAuthError(error: unknown): error is ExaAuthError {
  return error instanceof ExaAuthError
}

export function isExaServerError(error: unknown): error is ExaServerError {
  return error instanceof ExaServerError
}

export function isExaClientError(error: unknown): error is ExaClientError {
  return error instanceof ExaClientError
}

export function isExaNetworkError(error: unknown): error is ExaNetworkError {
  return error instanceof ExaNetworkError
}

export function isExaConfigError(error: unknown): error is ExaConfigError {
  return error instanceof ExaConfigError
}

export function isExaParsingError(error: unknown): error is ExaParsingError {
  return error instanceof ExaParsingError
}

/**
 * Helper function to determine if an error is retryable
 */
export function isRetryableExaError(error: unknown): boolean {
  if (isExaRateLimitError(error) || isExaServerError(error)) {
    return true
  }

  if (isExaNetworkError(error)) {
    return true
  }

  if (isExaClientError(error)) {
    return error.isRetryable()
  }

  return false
}

/**
 * Helper function to get suggested retry delay
 */
export function getRetryDelay(error: unknown, attempt = 1): number {
  if (isExaRateLimitError(error)) {
    return error.getSuggestedRetryDelay(attempt)
  }

  if (isExaServerError(error)) {
    return error.getSuggestedRetryDelay(attempt)
  }

  if (isExaNetworkError(error)) {
    return error.getSuggestedRetryDelay(attempt)
  }

  // Default fallback delay
  return Math.min(1000 * 2 ** (attempt - 1), 30000)
}
