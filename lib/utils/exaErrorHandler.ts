/**
 * Error handling utilities for the research orchestrator to handle specific Exa API errors
 * This module provides retry logic and error categorization for better orchestrator response
 */

import {
  ExaRateLimitError,
  ExaAuthError,
  ExaServerError,
  ExaClientError,
  ExaNetworkError,
  ExaConfigError,
  ExaParsingError,
  isExaRateLimitError,
  isExaAuthError,
  isExaServerError,
  isExaClientError,
  isExaNetworkError,
  isExaConfigError,
  isExaParsingError,
  isRetryableExaError,
  getRetryDelay,
} from "./exaSearchErrors";

/**
 * Result of error handling analysis
 */
export interface ExaErrorHandlingResult {
  shouldRetry: boolean;
  retryDelay?: number | undefined;
  maxRetries?: number | undefined;
  errorCategory:
    | "config"
    | "auth"
    | "rate_limit"
    | "server"
    | "client"
    | "network"
    | "parsing"
    | "unknown";
  userMessage: string;
  technicalDetails?: string | undefined;
  isRecoverable: boolean;
  suggestedAction?: string | undefined;
}

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxRetries: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

/**
 * Analyzes an Exa API error and provides handling recommendations for the orchestrator
 */
export function analyzeExaError(
  error: unknown,
  attempt = 1,
  config: Partial<RetryConfig> = {}
): ExaErrorHandlingResult {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  // Handle Exa configuration errors
  if (isExaConfigError(error)) {
    return {
      shouldRetry: false,
      errorCategory: "config",
      userMessage:
        "Search service configuration error. Please contact support.",
      technicalDetails: error.message,
      isRecoverable: false,
      suggestedAction: "Check API key configuration and retry the research.",
    };
  }

  // Handle authentication/authorization errors
  if (isExaAuthError(error)) {
    return {
      shouldRetry: !error.isRecoverable() && attempt <= 1, // Only retry once for recoverable auth errors
      retryDelay: error.isRecoverable() ? 1000 : undefined,
      maxRetries: 1,
      errorCategory: "auth",
      userMessage: error.isRecoverable()
        ? "Search service permissions temporarily unavailable. Retrying..."
        : "Search service authentication failed. Please contact support.",
      technicalDetails: error.message,
      isRecoverable: error.isRecoverable(),
      suggestedAction: error.isRecoverable()
        ? "The system will retry automatically."
        : "Check API key validity and permissions.",
    };
  }

  // Handle rate limiting errors
  if (isExaRateLimitError(error)) {
    const delay = Math.min(
      error.getSuggestedRetryDelay(attempt),
      retryConfig.maxDelay
    );
    const shouldRetry = attempt <= retryConfig.maxRetries;

    return {
      shouldRetry,
      retryDelay: delay,
      maxRetries: retryConfig.maxRetries,
      errorCategory: "rate_limit",
      userMessage: shouldRetry
        ? `Search rate limit exceeded. Retrying in ${Math.ceil(delay / 1000)} seconds...`
        : "Search rate limit exceeded. Please try again later.",
      technicalDetails: error.message,
      isRecoverable: true,
      suggestedAction: shouldRetry
        ? `Automatic retry in ${Math.ceil(delay / 1000)} seconds.`
        : "Wait a few minutes before retrying the search.",
    };
  }

  // Handle server errors
  if (isExaServerError(error)) {
    const delay = Math.min(
      error.getSuggestedRetryDelay(attempt),
      retryConfig.maxDelay
    );
    const shouldRetry = error.isTemporary && attempt <= retryConfig.maxRetries;

    return {
      shouldRetry,
      retryDelay: delay,
      maxRetries: retryConfig.maxRetries,
      errorCategory: "server",
      userMessage: shouldRetry
        ? "Search service temporarily unavailable. Retrying..."
        : "Search service is currently unavailable. Please try again later.",
      technicalDetails: error.message,
      isRecoverable: error.isTemporary,
      suggestedAction: shouldRetry
        ? "The system will retry automatically."
        : "Please try your search again in a few minutes.",
    };
  }

  // Handle client errors
  if (isExaClientError(error)) {
    const shouldRetry = error.isRetryable() && attempt <= 1; // Only retry once for client errors

    return {
      shouldRetry,
      retryDelay: shouldRetry ? 1000 : undefined,
      maxRetries: 1,
      errorCategory: "client",
      userMessage: shouldRetry
        ? "Search request timeout. Retrying..."
        : "Invalid search request. Please modify your query and try again.",
      technicalDetails: error.message,
      isRecoverable: error.isRetryable(),
      suggestedAction: shouldRetry
        ? "The system will retry automatically."
        : "Please check your search parameters and try again.",
    };
  }

  // Handle network errors
  if (isExaNetworkError(error)) {
    const delay = Math.min(
      error.getSuggestedRetryDelay(attempt),
      retryConfig.maxDelay
    );
    const shouldRetry = attempt <= retryConfig.maxRetries;

    return {
      shouldRetry,
      retryDelay: delay,
      maxRetries: retryConfig.maxRetries,
      errorCategory: "network",
      userMessage: shouldRetry
        ? "Network connection issue. Retrying..."
        : "Unable to connect to search service. Please check your connection.",
      technicalDetails: error.message,
      isRecoverable: true,
      suggestedAction: shouldRetry
        ? "The system will retry automatically."
        : "Please check your internet connection and try again.",
    };
  }

  // Handle parsing errors
  if (isExaParsingError(error)) {
    const shouldRetry = attempt <= 1; // Only retry once for parsing errors

    return {
      shouldRetry,
      retryDelay: 1000,
      maxRetries: 1,
      errorCategory: "parsing",
      userMessage: shouldRetry
        ? "Search response parsing error. Retrying..."
        : "Search service returned invalid data. Please try again later.",
      technicalDetails: error.message,
      isRecoverable: true,
      suggestedAction: shouldRetry
        ? "The system will retry automatically."
        : "Please try your search again later.",
    };
  }

  // Handle unknown errors
  return {
    shouldRetry: attempt <= 1, // Only retry once for unknown errors
    retryDelay: 2000,
    maxRetries: 1,
    errorCategory: "unknown",
    userMessage:
      "An unexpected error occurred during search. Please try again.",
    technicalDetails: error instanceof Error ? error.message : String(error),
    isRecoverable: true,
    suggestedAction: "Please try your search again.",
  };
}

/**
 * Executes a search operation with automatic retry logic based on error analysis
 */
export async function executeWithRetry<T>(
  searchOperation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let attempt = 1;
  let lastError: unknown;

  while (attempt <= retryConfig.maxRetries + 1) {
    // +1 for initial attempt
    try {
      return await searchOperation();
    } catch (error) {
      lastError = error;

      const analysis = analyzeExaError(error, attempt, retryConfig);

      // Log the error analysis for debugging
      console.warn(`Search attempt ${attempt} failed:`, {
        errorCategory: analysis.errorCategory,
        shouldRetry: analysis.shouldRetry,
        retryDelay: analysis.retryDelay,
        userMessage: analysis.userMessage,
      });

      if (!analysis.shouldRetry || attempt > retryConfig.maxRetries) {
        // Don't retry or max retries reached
        break;
      }

      // Wait before retrying
      if (analysis.retryDelay) {
        await new Promise((resolve) =>
          setTimeout(resolve, analysis.retryDelay)
        );
      }

      attempt++;
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
}

/**
 * Creates a user-friendly error message for the research orchestrator to send to the client
 */
export function createUserErrorMessage(
  error: unknown,
  attempt = 1
): {
  message: string;
  shouldContinue: boolean;
  retryAfter?: number | undefined;
} {
  const analysis = analyzeExaError(error, attempt);

  return {
    message: analysis.userMessage,
    shouldContinue: analysis.isRecoverable && !analysis.shouldRetry,
    retryAfter: analysis.retryDelay,
  };
}

/**
 * Determines if a search error should abort the entire research process
 */
export function shouldAbortResearch(error: unknown): boolean {
  const analysis = analyzeExaError(error, 1);

  // Abort research for non-recoverable configuration and auth errors
  if (analysis.errorCategory === "config" && !analysis.isRecoverable) {
    return true;
  }

  if (analysis.errorCategory === "auth" && !analysis.isRecoverable) {
    return true;
  }

  // Continue research for other error types (they can be retried or worked around)
  return false;
}

/**
 * Get a simplified error category for logging and metrics
 */
export function getErrorCategory(error: unknown): string {
  const analysis = analyzeExaError(error, 1);
  return analysis.errorCategory;
}

/**
 * Check if an error indicates a quota/limit issue that might affect future requests
 */
export function isQuotaRelatedError(error: unknown): boolean {
  if (isExaRateLimitError(error)) {
    return error.rateLimitType === "quota";
  }
  return false;
}
