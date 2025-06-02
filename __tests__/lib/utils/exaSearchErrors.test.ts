/**
 * Tests for Exa Search custom error classes
 */

import { describe, expect, it } from "vitest"

import {
  ExaAuthError,
  ExaClientError,
  ExaConfigError,
  ExaError,
  ExaNetworkError,
  ExaParsingError,
  ExaRateLimitError,
  ExaServerError,
  getRetryDelay,
  isExaAuthError,
  isExaClientError,
  isExaConfigError,
  isExaError,
  isExaNetworkError,
  isExaParsingError,
  isExaRateLimitError,
  isExaServerError,
  isRetryableExaError,
} from "@/lib/utils/exaSearchErrors"

describe("ExaError Base Class", () => {
  it("should create an error with basic properties", () => {
    const error = new ExaRateLimitError("Test rate limit error", {
      status: 429,
      query: "test query",
    })

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ExaError)
    expect(error.name).toBe("ExaRateLimitError")
    expect(error.message).toBe("Test rate limit error")
    expect(error.status).toBe(429)
    expect(error.query).toBe("test query")
  })

  it("should handle cause property", () => {
    const originalError = new Error("Original error")
    const error = new ExaServerError("Wrapped error", {
      cause: originalError,
    })

    expect(error.cause).toBe(originalError)
  })

  it("should create JSON representation", () => {
    const error = new ExaClientError("Client error", {
      status: 400,
      response: { error: "Bad request" },
      requestId: "req-123",
      query: "test query",
    })

    const json = error.toJSON()

    expect(json).toEqual({
      name: "ExaClientError",
      message: "Client error",
      status: 400,
      response: { error: "Bad request" },
      requestId: "req-123",
      query: "test query",
      stack: expect.any(String),
    })
  })
})

describe("ExaRateLimitError", () => {
  it("should handle rate limit specific properties", () => {
    const error = new ExaRateLimitError("Rate limit exceeded", {
      status: 429,
      retryAfter: 60,
      rateLimitType: "quota",
    })

    expect(error.retryAfter).toBe(60)
    expect(error.rateLimitType).toBe("quota")
  })

  it("should suggest retry delay based on retry-after header", () => {
    const error = new ExaRateLimitError("Rate limit exceeded", {
      retryAfter: 30,
    })

    expect(error.getSuggestedRetryDelay()).toBe(30000) // 30 seconds
  })

  it("should suggest exponential backoff when no retry-after", () => {
    const error = new ExaRateLimitError("Rate limit exceeded")

    expect(error.getSuggestedRetryDelay(1)).toBe(1000) // 1 second
    expect(error.getSuggestedRetryDelay(2)).toBe(2000) // 2 seconds
    expect(error.getSuggestedRetryDelay(3)).toBe(4000) // 4 seconds
    expect(error.getSuggestedRetryDelay(10)).toBe(30000) // Max 30 seconds
  })

  it("should default to requests rate limit type", () => {
    const error = new ExaRateLimitError("Rate limit exceeded")

    expect(error.rateLimitType).toBe("requests")
  })
})

describe("ExaAuthError", () => {
  it("should handle auth error types", () => {
    const error = new ExaAuthError("Authentication failed", {
      status: 401,
      authType: "invalid_key",
    })

    expect(error.authType).toBe("invalid_key")
    expect(error.isRecoverable()).toBe(false)
  })

  it("should determine if error is recoverable", () => {
    const invalidKeyError = new ExaAuthError("Invalid key", {
      authType: "invalid_key",
    })
    const permissionError = new ExaAuthError("Insufficient permissions", {
      authType: "insufficient_permissions",
    })

    expect(invalidKeyError.isRecoverable()).toBe(false)
    expect(permissionError.isRecoverable()).toBe(true)
  })

  it("should default to unknown auth type", () => {
    const error = new ExaAuthError("Authentication failed")

    expect(error.authType).toBe("unknown")
  })
})

describe("ExaServerError", () => {
  it("should handle server error properties", () => {
    const error = new ExaServerError("Server error", {
      status: 500,
      isTemporary: true,
    })

    expect(error.isTemporary).toBe(true)
  })

  it("should default to temporary for most 5xx errors", () => {
    const error500 = new ExaServerError("Internal server error", {
      status: 500,
    })
    const error502 = new ExaServerError("Bad gateway", { status: 502 })
    const error501 = new ExaServerError("Not implemented", { status: 501 })

    expect(error500.isTemporary).toBe(true)
    expect(error502.isTemporary).toBe(true)
    expect(error501.isTemporary).toBe(false) // 501 is permanent
  })

  it("should suggest appropriate retry delays", () => {
    const error = new ExaServerError("Server error")

    expect(error.getSuggestedRetryDelay(1)).toBe(500) // 500ms
    expect(error.getSuggestedRetryDelay(2)).toBe(1000) // 1 second
    expect(error.getSuggestedRetryDelay(3)).toBe(2000) // 2 seconds
    expect(error.getSuggestedRetryDelay(10)).toBe(10000) // Max 10 seconds
  })
})

describe("ExaClientError", () => {
  it("should handle client error properties", () => {
    const validationErrors = [
      { field: "query", message: "Query is required", value: "" },
      { field: "num_results", message: "Must be between 1 and 100", value: 0 },
    ]

    const error = new ExaClientError("Validation failed", {
      status: 400,
      errorCode: "VALIDATION_ERROR",
      validationErrors,
    })

    expect(error.errorCode).toBe("VALIDATION_ERROR")
    expect(error.validationErrors).toEqual(validationErrors)
  })

  it("should determine if error is retryable", () => {
    const validationError = new ExaClientError("Bad request", { status: 400 })
    const timeoutError = new ExaClientError("Request timeout", { status: 408 })

    expect(validationError.isRetryable()).toBe(false)
    expect(timeoutError.isRetryable()).toBe(true)
  })
})

describe("ExaNetworkError", () => {
  it("should handle network error properties", () => {
    const error = new ExaNetworkError("Connection refused", {
      isTimeout: false,
      isConnectionError: true,
    })

    expect(error.isTimeout).toBe(false)
    expect(error.isConnectionError).toBe(true)
  })

  it("should suggest different retry delays for timeout vs connection errors", () => {
    const timeoutError = new ExaNetworkError("Timeout", { isTimeout: true })
    const connectionError = new ExaNetworkError("Connection refused", {
      isConnectionError: true,
    })

    expect(timeoutError.getSuggestedRetryDelay(1)).toBe(2000) // Longer for timeouts
    expect(connectionError.getSuggestedRetryDelay(1)).toBe(1000) // Shorter for connection errors
  })

  it("should respect max delays", () => {
    const timeoutError = new ExaNetworkError("Timeout", { isTimeout: true })
    const connectionError = new ExaNetworkError("Connection refused", {
      isConnectionError: true,
    })

    expect(timeoutError.getSuggestedRetryDelay(10)).toBe(60000) // Max 60s for timeouts
    expect(connectionError.getSuggestedRetryDelay(10)).toBe(30000) // Max 30s for connections
  })
})

describe("ExaConfigError", () => {
  it("should handle config error types", () => {
    const error = new ExaConfigError("Missing API key", {
      configType: "missing_api_key",
    })

    expect(error.configType).toBe("missing_api_key")
    expect(error.isRetryable()).toBe(false)
  })

  it("should default to unknown config type", () => {
    const error = new ExaConfigError("Config error")

    expect(error.configType).toBe("unknown")
  })
})

describe("ExaParsingError", () => {
  it("should handle parsing error properties", () => {
    const error = new ExaParsingError("Invalid JSON", {
      expectedFormat: "JSON object",
      actualFormat: "string",
      response: "invalid json",
    })

    expect(error.expectedFormat).toBe("JSON object")
    expect(error.actualFormat).toBe("string")
    expect(error.response).toBe("invalid json")
  })
})

describe("Type Guards", () => {
  it("should correctly identify error types", () => {
    const rateLimitError = new ExaRateLimitError("Rate limit")
    const authError = new ExaAuthError("Auth failed")
    const serverError = new ExaServerError("Server error")
    const clientError = new ExaClientError("Client error")
    const networkError = new ExaNetworkError("Network error")
    const configError = new ExaConfigError("Config error")
    const parsingError = new ExaParsingError("Parsing error")
    const genericError = new Error("Generic error")

    expect(isExaError(rateLimitError)).toBe(true)
    expect(isExaError(genericError)).toBe(false)

    expect(isExaRateLimitError(rateLimitError)).toBe(true)
    expect(isExaRateLimitError(authError)).toBe(false)

    expect(isExaAuthError(authError)).toBe(true)
    expect(isExaAuthError(serverError)).toBe(false)

    expect(isExaServerError(serverError)).toBe(true)
    expect(isExaServerError(clientError)).toBe(false)

    expect(isExaClientError(clientError)).toBe(true)
    expect(isExaClientError(networkError)).toBe(false)

    expect(isExaNetworkError(networkError)).toBe(true)
    expect(isExaNetworkError(configError)).toBe(false)

    expect(isExaConfigError(configError)).toBe(true)
    expect(isExaConfigError(parsingError)).toBe(false)

    expect(isExaParsingError(parsingError)).toBe(true)
    expect(isExaParsingError(genericError)).toBe(false)
  })
})

describe("Retry Logic Helpers", () => {
  it("should correctly identify retryable errors", () => {
    const rateLimitError = new ExaRateLimitError("Rate limit")
    const serverError = new ExaServerError("Server error")
    const networkError = new ExaNetworkError("Network error")
    const authError = new ExaAuthError("Auth failed")
    const configError = new ExaConfigError("Config error")
    const timeoutClientError = new ExaClientError("Timeout", { status: 408 })
    const validationClientError = new ExaClientError("Validation failed", {
      status: 400,
    })

    expect(isRetryableExaError(rateLimitError)).toBe(true)
    expect(isRetryableExaError(serverError)).toBe(true)
    expect(isRetryableExaError(networkError)).toBe(true)
    expect(isRetryableExaError(authError)).toBe(false)
    expect(isRetryableExaError(configError)).toBe(false)
    expect(isRetryableExaError(timeoutClientError)).toBe(true)
    expect(isRetryableExaError(validationClientError)).toBe(false)
  })

  it("should provide appropriate retry delays", () => {
    const rateLimitError = new ExaRateLimitError("Rate limit", {
      retryAfter: 10,
    })
    const serverError = new ExaServerError("Server error")
    const networkError = new ExaNetworkError("Network error")
    const unknownError = new Error("Unknown error")

    expect(getRetryDelay(rateLimitError)).toBe(10000) // Uses retryAfter
    expect(getRetryDelay(serverError, 2)).toBe(1000) // Server error delay
    expect(getRetryDelay(networkError, 3)).toBe(4000) // Network error delay
    expect(getRetryDelay(unknownError, 2)).toBe(2000) // Default fallback
  })

  it("should respect maximum retry delays", () => {
    const rateLimitError = new ExaRateLimitError("Rate limit")
    const serverError = new ExaServerError("Server error")
    const networkError = new ExaNetworkError("Network error")

    expect(getRetryDelay(rateLimitError, 10)).toBe(30000) // Max 30s for rate limit
    expect(getRetryDelay(serverError, 10)).toBe(10000) // Max 10s for server
    expect(getRetryDelay(networkError, 10)).toBe(30000) // Max 30s for network
  })
})
