import type { SearchResultItem } from "@/baml_client/types";
import { config } from "@/lib/config";
import type { RecoveryStrategy, SearchContext } from "./errorRecovery";
import {
  ExaAuthError,
  ExaClientError,
  ExaNetworkError,
  ExaRateLimitError,
  ExaServerError,
} from "./exaSearchErrors";

/**
 * Type guards for different error types
 */
export function isExaRateLimitError(
  error: unknown
): error is ExaRateLimitError {
  return error instanceof ExaRateLimitError;
}

export function isExaNetworkError(error: unknown): error is ExaNetworkError {
  return error instanceof ExaNetworkError;
}

export function isExaServerError(error: unknown): error is ExaServerError {
  return error instanceof ExaServerError;
}

export function isExaAuthError(error: unknown): error is ExaAuthError {
  return error instanceof ExaAuthError;
}

export function isExaClientError(error: unknown): error is ExaClientError {
  return error instanceof ExaClientError;
}

/**
 * Helper functions for cached results (placeholder implementations)
 * In a real implementation, these would integrate with a caching layer
 */
function hasCachedResults(_queries: SearchContext["queries"]): boolean {
  // Placeholder: In real implementation, this would check a cache store
  // For now, return false to disable caching strategy
  return false;
}

function getCachedSearchResults(
  _queries: SearchContext["queries"]
): Promise<SearchResultItem[]> {
  // Placeholder: In real implementation, this would retrieve from cache
  return Promise.resolve([]);
}

/**
 * Direct search execution without recovery (for retry strategy)
 * This function is implemented in exaSearchUtil.ts and re-exported here to avoid circular imports
 */
async function executeExaSearchDirect(
  queries: SearchContext["queries"]
): Promise<SearchResultItem[]> {
  // Dynamic import to avoid circular dependency
  // The direct function is implemented in exaSearchUtil.ts
  const exaModule = await import("./exaSearchUtil");

  // Execute search for each query and flatten results
  const results: SearchResultItem[] = [];
  for (const query of queries) {
    // Use the main function - it will use circuit breaker but that's ok for recovery
    const queryResults = await exaModule.executeExaSearch(query);
    results.push(...queryResults);
  }

  return results;
}

/**
 * Recovery Strategy 1: Retry with Exponential Backoff
 * Handles rate limits and temporary network issues
 */
export const retryWithBackoffStrategy: RecoveryStrategy = {
  name: "RetryWithBackoff",
  priority: 1, // Highest priority

  canRecover: (error: unknown, context: SearchContext): boolean => {
    // Can recover from rate limits and temporary network/server errors
    if (
      isExaRateLimitError(error) ||
      isExaNetworkError(error) ||
      isExaServerError(error)
    ) {
      // Only retry if we haven't exceeded max retries
      return context.attempt < config.research.maxRetries + 1;
    }
    return false;
  },

  recover: async (
    error: unknown,
    context: SearchContext
  ): Promise<SearchResultItem[]> => {
    // Calculate exponential backoff delay
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds max
    const delay = Math.min(baseDelay * 2 ** (context.attempt - 1), maxDelay);

    console.log(
      `⏳ Waiting ${delay}ms before retry (attempt ${context.attempt + 1})`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));

    // For rate limit errors, reduce the number of queries to avoid hitting limits again
    let queriesToRetry = context.queries;
    if (isExaRateLimitError(error)) {
      // Reduce query count by half, minimum 1
      const reducedCount = Math.max(1, Math.floor(context.queries.length / 2));
      queriesToRetry = context.queries.slice(0, reducedCount);
      console.log(
        `🔄 Reducing query count from ${context.queries.length} to ${reducedCount} due to rate limit`
      );
    }

    // Execute search with reduced queries
    return await executeExaSearchDirect(queriesToRetry);
  },
};

/**
 * Recovery Strategy 2: Fallback to Cache
 * Returns cached results when network/API is unavailable
 */
export const fallbackToCacheStrategy: RecoveryStrategy = {
  name: "FallbackToCache",
  priority: 2, // Second priority

  canRecover: (error: unknown, context: SearchContext): boolean => {
    // Can recover from network errors and server errors if we have cached results
    const isRecoverableError =
      isExaNetworkError(error) ||
      isExaServerError(error) ||
      isExaAuthError(error);
    return isRecoverableError && hasCachedResults(context.queries);
  },

  recover: async (
    _error: unknown,
    context: SearchContext
  ): Promise<SearchResultItem[]> => {
    console.log(
      `💾 Falling back to cached results for ${context.queries.length} queries`
    );
    const cachedResults = await getCachedSearchResults(context.queries);

    if (cachedResults.length === 0) {
      throw new Error("No cached results available despite cache check");
    }

    console.log(`✅ Retrieved ${cachedResults.length} results from cache`);
    return cachedResults;
  },
};

/**
 * Recovery Strategy 3: Continue with Partial Results
 * Uses any successful results from previous attempts
 */
export const partialResultsStrategy: RecoveryStrategy = {
  name: "ContinueWithPartial",
  priority: 3, // Third priority

  canRecover: (_error: unknown, context: SearchContext): boolean => {
    // Can recover if we have partial results from previous attempts
    return !!(context.previousResults && context.previousResults.length > 0);
  },

  recover: async (
    error: unknown,
    context: SearchContext
  ): Promise<SearchResultItem[]> => {
    if (!context.previousResults) {
      throw new Error(
        "No previous results available for partial results strategy"
      );
    }
    const partialResults = context.previousResults;
    console.log(
      `📊 Continuing with ${partialResults.length} partial results from previous attempts`
    );

    // Add metadata to indicate these are partial results
    const enrichedResults = partialResults.map((result) => ({
      ...result,
      metadata: {
        ...result.metadata,
        recovery_strategy: "partial_results",
        original_error: error instanceof Error ? error.message : String(error),
        recovery_timestamp: new Date().toISOString(),
      },
    }));

    return enrichedResults;
  },
};

/**
 * Recovery Strategy 4: Graceful Degradation
 * Returns empty results with metadata about the failure
 */
export const gracefulDegradationStrategy: RecoveryStrategy = {
  name: "GracefulDegradation",
  priority: 4, // Lowest priority (last resort)

  canRecover: (_error: unknown, _context: SearchContext): boolean => {
    // Always can "recover" by returning empty results
    // This ensures the application continues to function
    return true;
  },

  recover: async (
    error: unknown,
    context: SearchContext
  ): Promise<SearchResultItem[]> => {
    console.log(
      "🚨 Graceful degradation: returning empty results due to unrecoverable error"
    );

    // Return an empty result with error information in metadata
    // This allows the UI to show appropriate messaging
    const errorMetadata: SearchResultItem = {
      id: `error_${Date.now()}`,
      url: "",
      title: "Search Error",
      source_name: "Error Recovery",
      snippet: null,
      full_text: null,
      published_date: null,
      retrieval_date: new Date().toISOString(),
      author: null,
      score: null,
      original_query: context.queries[0] || {
        query_string: "unknown",
        expected_information: [],
      },
      metadata: {
        error_recovery: "graceful_degradation",
        error_type: error?.constructor?.name || "Unknown",
        error_message: error instanceof Error ? error.message : String(error),
        queries_attempted: context.queries.length.toString(),
        attempt_count: context.attempt.toString(),
        elapsed_ms: (Date.now() - context.startTime).toString(),
      },
    };

    return [errorMetadata];
  },
};

/**
 * Default recovery strategies in priority order
 * These can be customized based on application needs
 */
export const defaultRecoveryStrategies: RecoveryStrategy[] = [
  retryWithBackoffStrategy,
  fallbackToCacheStrategy,
  partialResultsStrategy,
  gracefulDegradationStrategy,
];

/**
 * Factory function to create a custom set of recovery strategies
 */
export function createRecoveryStrategies(options: {
  enableRetry?: boolean;
  enableCache?: boolean;
  enablePartialResults?: boolean;
  enableGracefulDegradation?: boolean;
  customStrategies?: RecoveryStrategy[];
}): RecoveryStrategy[] {
  const strategies: RecoveryStrategy[] = [];

  if (options.enableRetry !== false) {
    strategies.push(retryWithBackoffStrategy);
  }

  if (options.enableCache !== false) {
    strategies.push(fallbackToCacheStrategy);
  }

  if (options.enablePartialResults !== false) {
    strategies.push(partialResultsStrategy);
  }

  if (options.enableGracefulDegradation !== false) {
    strategies.push(gracefulDegradationStrategy);
  }

  if (options.customStrategies) {
    strategies.push(...options.customStrategies);
  }

  return strategies;
}
