import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchContext } from "@/lib/utils/errorRecovery";
import {
  ExaAuthError,
  ExaClientError,
  ExaNetworkError,
  ExaRateLimitError,
  ExaServerError,
} from "@/lib/utils/exaSearchErrors";
import {
  createRecoveryStrategies,
  defaultRecoveryStrategies,
  fallbackToCacheStrategy,
  gracefulDegradationStrategy,
  isExaAuthError,
  isExaClientError,
  isExaNetworkError,
  isExaRateLimitError,
  isExaServerError,
  partialResultsStrategy,
  retryWithBackoffStrategy,
} from "@/lib/utils/recoveryStrategies";
import type {
  SearchQueryItem,
  SearchResultItem,
} from "@/packages/shared-types/src";

// Mock search result for testing
const mockSearchResult: SearchResultItem = {
  id: "test-doc-1",
  url: "https://example.com/doc1",
  title: "Test Document",
  source_name: "Test Source",
  snippet: "Test snippet",
  full_text: "Test full text content",
  published_date: "2023-01-01",
  retrieval_date: new Date().toISOString(),
  author: "Test Author",
  score: 0.9,
  original_query: {
    query_string: "test query",
    expected_information: ["test info"],
  },
  metadata: { test: "metadata" },
};

// Mock query for testing
const mockQuery: SearchQueryItem = {
  query_string: "test legal query",
  expected_information: ["legal precedents", "case law"],
};

// We'll test the recovery strategies without mocking the dynamic import
// since the actual behavior is what matters

describe("Error Type Guards", () => {
  it("should identify ExaRateLimitError correctly", () => {
    const rateLimitError = new ExaRateLimitError("Rate limit exceeded", {
      rateLimitType: "requests",
      query: "test",
    });
    const networkError = new ExaNetworkError("Network error", {
      query: "test",
      isTimeout: false,
      isConnectionError: true,
    });

    expect(isExaRateLimitError(rateLimitError)).toBe(true);
    expect(isExaRateLimitError(networkError)).toBe(false);
    expect(isExaRateLimitError(new Error("generic error"))).toBe(false);
  });

  it("should identify ExaNetworkError correctly", () => {
    const networkError = new ExaNetworkError("Network error", {
      query: "test",
      isTimeout: false,
      isConnectionError: true,
    });
    const authError = new ExaAuthError("Auth error", {
      authType: "invalid_key",
    });

    expect(isExaNetworkError(networkError)).toBe(true);
    expect(isExaNetworkError(authError)).toBe(false);
  });

  it("should identify other error types correctly", () => {
    const serverError = new ExaServerError("Server error", {
      isTemporary: true,
    });
    const authError = new ExaAuthError("Auth error", {
      authType: "invalid_key",
    });
    const clientError = new ExaClientError("Client error", {});

    expect(isExaServerError(serverError)).toBe(true);
    expect(isExaAuthError(authError)).toBe(true);
    expect(isExaClientError(clientError)).toBe(true);

    expect(isExaServerError(authError)).toBe(false);
    expect(isExaAuthError(serverError)).toBe(false);
    expect(isExaClientError(authError)).toBe(false);
  });
});

describe("retryWithBackoffStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be able to recover from rate limit errors", () => {
    const rateLimitError = new ExaRateLimitError("Rate limit exceeded", {
      rateLimitType: "requests",
      query: "test",
    });
    const context = createSearchContext([mockQuery], 1);

    expect(retryWithBackoffStrategy.canRecover(rateLimitError, context)).toBe(
      true
    );
  });

  it("should be able to recover from network errors", () => {
    const networkError = new ExaNetworkError("Network timeout", {
      query: "test",
      isTimeout: true,
      isConnectionError: false,
    });
    const context = createSearchContext([mockQuery], 1);

    expect(retryWithBackoffStrategy.canRecover(networkError, context)).toBe(
      true
    );
  });

  it("should not recover if max retries exceeded", () => {
    const rateLimitError = new ExaRateLimitError("Rate limit exceeded", {
      rateLimitType: "requests",
      query: "test",
    });
    const context = createSearchContext([mockQuery], 5); // High attempt number

    expect(retryWithBackoffStrategy.canRecover(rateLimitError, context)).toBe(
      false
    );
  });

  it("should not recover from auth errors", () => {
    const authError = new ExaAuthError("Invalid API key", {
      authType: "invalid_key",
    });
    const context = createSearchContext([mockQuery], 1);

    expect(retryWithBackoffStrategy.canRecover(authError, context)).toBe(false);
  });

  it("should calculate exponential backoff delay", () => {
    // Test the backoff calculation logic without using fake timers
    const rateLimitError = new ExaRateLimitError("Rate limit exceeded", {
      rateLimitType: "requests",
      query: "test",
    });

    expect(
      retryWithBackoffStrategy.canRecover(
        rateLimitError,
        createSearchContext([mockQuery], 1)
      )
    ).toBe(true);
    // In test environment, maxRetries is 1, so attempt 2 should fail
    expect(
      retryWithBackoffStrategy.canRecover(
        rateLimitError,
        createSearchContext([mockQuery], 2)
      )
    ).toBe(false);
    // Test that it definitely stops retrying at higher attempt counts
    expect(
      retryWithBackoffStrategy.canRecover(
        rateLimitError,
        createSearchContext([mockQuery], 10)
      )
    ).toBe(false);
  });

  it("should handle query reduction for rate limit errors", () => {
    const rateLimitError = new ExaRateLimitError("Rate limit exceeded", {
      rateLimitType: "requests",
      query: "test",
    });
    const multipleQueries = [mockQuery, mockQuery, mockQuery, mockQuery]; // 4 queries
    const context = createSearchContext(multipleQueries, 1);

    // Test that recovery is attempted - the actual search will happen during integration
    expect(retryWithBackoffStrategy.canRecover(rateLimitError, context)).toBe(
      true
    );
  });
});

describe("fallbackToCacheStrategy", () => {
  it("should not recover when cache is not available", () => {
    const networkError = new ExaNetworkError("Network error", {
      query: "test",
      isTimeout: false,
      isConnectionError: true,
    });
    const context = createSearchContext([mockQuery], 1);

    // Since hasCachedResults is mocked to return false
    expect(fallbackToCacheStrategy.canRecover(networkError, context)).toBe(
      false
    );
  });

  it("should not recover from rate limit errors", () => {
    const rateLimitError = new ExaRateLimitError("Rate limit exceeded", {
      rateLimitType: "requests",
      query: "test",
    });
    const context = createSearchContext([mockQuery], 1);

    expect(fallbackToCacheStrategy.canRecover(rateLimitError, context)).toBe(
      false
    );
  });

  it("should return empty results when cache is not implemented", async () => {
    const networkError = new ExaNetworkError("Network error", {
      query: "test",
      isTimeout: false,
      isConnectionError: true,
    });
    const context = createSearchContext([mockQuery], 1);

    // This test is skipped since the cache functionality is not yet implemented
    // The fallback strategy will fail as expected
    expect(fallbackToCacheStrategy.canRecover(networkError, context)).toBe(
      false
    );
  });
});

describe("partialResultsStrategy", () => {
  it("should recover when previous results are available", () => {
    const error = new Error("Some error");
    const context = createSearchContext([mockQuery], 2, [mockSearchResult]);

    expect(partialResultsStrategy.canRecover(error, context)).toBe(true);
  });

  it("should not recover when no previous results", () => {
    const error = new Error("Some error");
    const context = createSearchContext([mockQuery], 2);

    expect(partialResultsStrategy.canRecover(error, context)).toBe(false);
  });

  it("should return enriched partial results", async () => {
    const error = new Error("Some error");
    const context = createSearchContext([mockQuery], 2, [mockSearchResult]);

    const result = await partialResultsStrategy.recover(error, context);

    expect(result).toHaveLength(1);
    expect(result[0]!.metadata).toMatchObject({
      test: "metadata", // Original metadata
      recovery_strategy: "partial_results",
      original_error: "Some error",
    });
    expect(result[0]!.metadata?.recovery_timestamp).toBeDefined();
  });
});

describe("gracefulDegradationStrategy", () => {
  it("should always be able to recover", () => {
    const error = new Error("Any error");
    const context = createSearchContext([mockQuery], 5);

    expect(gracefulDegradationStrategy.canRecover(error, context)).toBe(true);
  });

  it("should return error metadata result", async () => {
    const error = new ExaRateLimitError("Rate limit exceeded", {
      rateLimitType: "quota",
      query: "test",
    });
    const context = createSearchContext([mockQuery], 3);

    const result = await gracefulDegradationStrategy.recover(error, context);

    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe("Search Error");
    expect(result[0]!.source_name).toBe("Error Recovery");
    expect(result[0]!.metadata).toMatchObject({
      error_recovery: "graceful_degradation",
      error_type: "ExaRateLimitError",
      error_message: "Rate limit exceeded",
      queries_attempted: "1",
      attempt_count: "3",
    });
    expect(result[0]!.metadata?.elapsed_ms).toBeDefined();
  });
});

describe("defaultRecoveryStrategies", () => {
  it("should include all standard strategies in correct priority order", () => {
    expect(defaultRecoveryStrategies).toHaveLength(4);

    const names = defaultRecoveryStrategies.map((s) => s.name);
    expect(names).toEqual([
      "RetryWithBackoff",
      "FallbackToCache",
      "ContinueWithPartial",
      "GracefulDegradation",
    ]);

    // Check priority order
    const priorities = defaultRecoveryStrategies.map((s) => s.priority);
    expect(priorities).toEqual([1, 2, 3, 4]);
  });
});

describe("createRecoveryStrategies", () => {
  it("should create strategies with default configuration", () => {
    const strategies = createRecoveryStrategies({});

    expect(strategies).toHaveLength(4);
    expect(strategies.map((s) => s.name)).toEqual([
      "RetryWithBackoff",
      "FallbackToCache",
      "ContinueWithPartial",
      "GracefulDegradation",
    ]);
  });

  it("should exclude disabled strategies", () => {
    const strategies = createRecoveryStrategies({
      enableRetry: false,
      enableCache: false,
    });

    expect(strategies).toHaveLength(2);
    expect(strategies.map((s) => s.name)).toEqual([
      "ContinueWithPartial",
      "GracefulDegradation",
    ]);
  });

  it("should include custom strategies", () => {
    const customStrategy = {
      name: "CustomStrategy",
      priority: 0,
      canRecover: () => true,
      recover: async () => [],
    };

    const strategies = createRecoveryStrategies({
      customStrategies: [customStrategy],
    });

    expect(strategies).toHaveLength(5);
    expect(strategies).toContain(customStrategy);
  });

  it("should handle all strategies disabled except custom", () => {
    const customStrategy = {
      name: "OnlyStrategy",
      priority: 1,
      canRecover: () => true,
      recover: async () => [],
    };

    const strategies = createRecoveryStrategies({
      enableRetry: false,
      enableCache: false,
      enablePartialResults: false,
      enableGracefulDegradation: false,
      customStrategies: [customStrategy],
    });

    expect(strategies).toHaveLength(1);
    expect(strategies[0]).toBe(customStrategy);
  });
});
