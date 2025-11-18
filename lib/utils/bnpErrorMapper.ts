/**
 * BNP Error Mapper
 *
 * Translates BNP connector errors to Exa-compatible error classes.
 * This allows the existing error recovery system (circuit breaker, retry logic,
 * orchestrator error handling) to work seamlessly with BNP errors.
 *
 * Mapping Strategy:
 * - BnpNetworkError → ExaNetworkError
 * - BnpApiError (401/403) → ExaAuthError
 * - BnpApiError (429) → ExaRateLimitError
 * - BnpApiError (4xx) → ExaClientError
 * - BnpApiError (5xx) → ExaServerError
 * - BnpValidationError → ExaParsingError
 *
 * This maintains compatibility with:
 * - lib/utils/recoveryStrategies.ts (circuit breaker logic)
 * - lib/utils/exaErrorHandler.ts (retry logic)
 * - app/actions/researchAgentOrchestrator.ts (error handling)
 */

import {
  BnpApiError,
  BnpNetworkError,
  BnpValidationError,
} from "@/connectors/bnp";
import {
  ExaAuthError,
  ExaClientError,
  ExaNetworkError,
  ExaParsingError,
  ExaRateLimitError,
  ExaServerError,
} from "./exaSearchErrors";

/**
 * Maps a BNP error to an Exa-compatible error
 *
 * @param error - The error caught from BNP connector
 * @param query - The search query that caused the error (for context)
 * @returns An Exa-compatible error that the orchestrator can handle
 *
 * @example
 * ```typescript
 * try {
 *   const result = await bnpService.searchPrecedents(filter);
 * } catch (error) {
 *   throw mapBnpErrorToExaError(error, "contrato de trabalho");
 * }
 * ```
 */
export function mapBnpErrorToExaError(error: unknown, query: string): Error {
  // BnpNetworkError → ExaNetworkError
  if (error instanceof BnpNetworkError) {
    const options: {
      query: string;
      isTimeout: boolean;
      isConnectionError: boolean;
      cause?: Error;
    } = {
      query,
      isTimeout: error.message.toLowerCase().includes("timeout"),
      isConnectionError: true,
    };

    if (error.cause instanceof Error) {
      options.cause = error.cause;
    }

    return new ExaNetworkError(`BNP network error: ${error.message}`, options);
  }

  // BnpApiError → Specific Exa errors based on HTTP status
  if (error instanceof BnpApiError) {
    return mapBnpApiErrorToExaError(error, query);
  }

  // BnpValidationError → ExaParsingError
  if (error instanceof BnpValidationError) {
    const options: {
      response: unknown;
      expectedFormat: string;
      actualFormat: string;
      cause?: Error;
    } = {
      response: error,
      expectedFormat: "BnpSearchResponse",
      actualFormat: "invalid schema",
    };

    if (error.cause instanceof Error) {
      options.cause = error.cause;
    }

    return new ExaParsingError(
      `BNP response validation failed: ${error.message}`,
      options
    );
  }

  // Unknown error - return as-is if it's already an Error
  if (error instanceof Error) {
    return error;
  }

  // Last resort: wrap unknown errors
  return new Error(`Unknown BNP error: ${String(error)}`);
}

/**
 * Maps BnpApiError to specific Exa error types based on HTTP status code
 */
function mapBnpApiErrorToExaError(error: BnpApiError, query: string): Error {
  const { status, statusText } = error;

  // 401 Unauthorized or 403 Forbidden → ExaAuthError
  if (status === 401 || status === 403) {
    const options: {
      status: number;
      response: string;
      query: string;
      authType: "invalid_key" | "insufficient_permissions";
      cause?: Error;
    } = {
      status,
      response: error.details,
      query,
      authType: status === 401 ? "invalid_key" : "insufficient_permissions",
    };

    if (error.cause instanceof Error) {
      options.cause = error.cause;
    }

    return new ExaAuthError(
      `BNP authentication error (${status}): ${statusText}`,
      options
    );
  }

  // 429 Too Many Requests → ExaRateLimitError
  if (status === 429) {
    const options: {
      status: number;
      response: string;
      query: string;
      rateLimitType: "requests";
      retryAfter?: number;
      cause?: Error;
    } = {
      status,
      response: error.details,
      query,
      rateLimitType: "requests",
    };

    // Try to extract retry-after from error details
    if (error.details && typeof error.details === "object") {
      const details = error.details as Record<string, unknown>;
      if ("retryAfter" in details && typeof details.retryAfter === "number") {
        options.retryAfter = details.retryAfter;
      }
    }

    if (error.cause instanceof Error) {
      options.cause = error.cause;
    }

    return new ExaRateLimitError(
      `BNP rate limit exceeded (${status}): ${statusText}`,
      options
    );
  }

  // 4xx Client Errors → ExaClientError
  if (status >= 400 && status < 500) {
    const options: {
      status: number;
      response: string;
      query: string;
      errorCode: string;
      cause?: Error;
    } = {
      status,
      response: error.details,
      query,
      errorCode: String(status),
    };

    if (error.cause instanceof Error) {
      options.cause = error.cause;
    }

    return new ExaClientError(
      `BNP client error (${status}): ${statusText}`,
      options
    );
  }

  // 5xx Server Errors → ExaServerError
  if (status >= 500) {
    const options: {
      status: number;
      response: string;
      query: string;
      isTemporary: boolean;
      cause?: Error;
    } = {
      status,
      response: error.details,
      query,
      // Most 5xx errors are temporary, except 501 (Not Implemented)
      isTemporary: status !== 501,
    };

    if (error.cause instanceof Error) {
      options.cause = error.cause;
    }

    return new ExaServerError(
      `BNP server error (${status}): ${statusText}`,
      options
    );
  }

  // Fallback for unexpected status codes
  return new Error(
    `BNP API error (${status}): ${statusText} - ${JSON.stringify(error.details)}`
  );
}

/**
 * Type guard to check if an error is a BNP-originated error
 * Useful for logging/debugging to distinguish BNP errors from Exa errors
 */
export function isBnpOriginatedError(error: Error): boolean {
  return (
    error.message.startsWith("BNP ") ||
    error.cause instanceof BnpApiError ||
    error.cause instanceof BnpNetworkError ||
    error.cause instanceof BnpValidationError
  );
}
