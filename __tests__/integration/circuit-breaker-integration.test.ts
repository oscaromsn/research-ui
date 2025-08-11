import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RecoveryStrategy } from "@/lib/utils/errorRecovery";
import {
  createSearchContext,
  SearchCircuitBreaker,
} from "@/lib/utils/errorRecovery";
import {
  ExaAuthError,
  ExaNetworkError,
  ExaRateLimitError,
  ExaServerError,
} from "@/lib/utils/exaSearchErrors";
import type {
  SearchQueryItem,
  SearchResultItem,
} from "@/packages/shared-types/src";

describe("Circuit Breaker Integration Tests", () => {
  let mockSearchQuery: SearchQueryItem;
  let mockSearchResult: SearchResultItem;
  let circuitBreaker: SearchCircuitBreaker;

  beforeEach(() => {
    mockSearchQuery = {
      query_string: "legal precedent contract dispute",
      expected_information: ["case law", "court decisions", "legal principles"],
    };

    mockSearchResult = {
      id: "test-doc-1",
      url: "https://example.com/legal-doc",
      title: "Contract Dispute Legal Precedent",
      source_name: "Legal Database",
      snippet: "This case establishes important precedent...",
      full_text: "Full legal document text here...",
      published_date: "2023-06-15",
      retrieval_date: new Date().toISOString(),
      author: "Judge Smith",
      score: 0.92,
      original_query: mockSearchQuery,
      metadata: {
        court: "Supreme Court",
        jurisdiction: "Federal",
      },
    };

    // Create custom test strategies to avoid external dependencies
    const testStrategies: RecoveryStrategy[] = [
      {
        name: "TestRetry",
        priority: 1,
        canRecover: (error) =>
          error instanceof ExaRateLimitError ||
          error instanceof ExaNetworkError,
        recover: vi.fn().mockResolvedValue([mockSearchResult]),
      },
      {
        name: "TestPartial",
        priority: 2,
        canRecover: (_error, context) =>
          !!(context.previousResults && context.previousResults.length > 0),
        recover: vi.fn().mockImplementation(async (error, context) => {
          if (!context.previousResults) {
            throw new Error("No previous results");
          }
          return context.previousResults.map((result: SearchResultItem) => ({
            ...result,
            metadata: {
              ...result.metadata,
              recovery_strategy: "partial_results",
              original_error:
                error instanceof Error ? error.message : String(error),
            },
          }));
        }),
      },
      {
        name: "TestGraceful",
        priority: 3,
        canRecover: () => true,
        recover: vi.fn().mockImplementation(async (error, context) => [
          {
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
            original_query: context.queries[0] || mockSearchQuery,
            metadata: {
              error_recovery: "graceful_degradation",
              error_type: error?.constructor?.name || "Unknown",
              error_message:
                error instanceof Error ? error.message : String(error),
            },
          },
        ]),
      },
    ];

    circuitBreaker = new SearchCircuitBreaker(testStrategies);

    // Mock console methods to reduce test noise
    vi.spyOn(console, "log").mockImplementation(() => {
      /* Suppress console output in tests */
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      /* Suppress console output in tests */
    });
    vi.spyOn(console, "error").mockImplementation(() => {
      /* Suppress console output in tests */
    });
    vi.spyOn(console, "debug").mockImplementation(() => {
      /* Suppress console output in tests */
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("Successful Operations", () => {
    it("should execute search operation successfully without recovery", async () => {
      const mockOperation = vi.fn().mockResolvedValue([mockSearchResult]);
      const context = createSearchContext([mockSearchQuery]);

      const result = await circuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      expect(result).toEqual([mockSearchResult]);
      expect(mockOperation).toHaveBeenCalledOnce();
    });

    it("should handle multiple queries successfully", async () => {
      const multipleResults = [
        mockSearchResult,
        { ...mockSearchResult, id: "test-doc-2" },
      ];
      const mockOperation = vi.fn().mockResolvedValue(multipleResults);
      const multipleQueries = [
        mockSearchQuery,
        { ...mockSearchQuery, query_string: "contract law basics" },
      ];
      const context = createSearchContext(multipleQueries);

      const result = await circuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      expect(result).toEqual(multipleResults);
      expect(result).toHaveLength(2);
    });
  });

  describe("Error Recovery Integration", () => {
    it("should recover from rate limit error using retry strategy", async () => {
      const rateLimitError = new ExaRateLimitError("Rate limit exceeded", {
        rateLimitType: "requests",
        retryAfter: 60,
      });

      const mockOperation = vi.fn().mockRejectedValueOnce(rateLimitError);
      const context = createSearchContext([mockSearchQuery], 1);

      const result = await circuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      expect(result).toEqual([mockSearchResult]);
      expect(mockOperation).toHaveBeenCalledOnce();

      // Check that the retry strategy was called
      const retryStrategy = circuitBreaker
        .getStrategies()
        .find((s) => s.name === "TestRetry");
      expect(retryStrategy?.recover).toHaveBeenCalledWith(
        rateLimitError,
        context
      );
    });

    it("should recover from network error using retry strategy", async () => {
      const networkError = new ExaNetworkError("Connection timeout", {
        isTimeout: true,
        isConnectionError: false,
      });

      const mockOperation = vi.fn().mockRejectedValueOnce(networkError);
      const context = createSearchContext([mockSearchQuery], 1);

      const result = await circuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      expect(result).toEqual([mockSearchResult]);

      // Check that the retry strategy was called
      const retryStrategy = circuitBreaker
        .getStrategies()
        .find((s) => s.name === "TestRetry");
      expect(retryStrategy?.recover).toHaveBeenCalledWith(
        networkError,
        context
      );
    });

    it("should use partial results when retry fails", async () => {
      const networkError = new ExaNetworkError("Network failure", {
        isTimeout: true,
        isConnectionError: false,
      });

      const previousResults = [mockSearchResult];
      const mockOperation = vi.fn().mockRejectedValueOnce(networkError);
      const context = createSearchContext(
        [mockSearchQuery],
        2,
        previousResults
      );

      // Create a fresh circuit breaker with failing retry strategy
      const failingRetryStrategy: RecoveryStrategy = {
        name: "FailingTestRetry",
        priority: 1,
        canRecover: (error) => error instanceof ExaNetworkError,
        recover: vi.fn().mockRejectedValue(new Error("Retry failed")),
      };

      const partialStrategy: RecoveryStrategy = {
        name: "TestPartial",
        priority: 2,
        canRecover: (_error, ctx) =>
          !!(ctx.previousResults && ctx.previousResults.length > 0),
        recover: vi.fn().mockImplementation(async (error, ctx) => {
          return ctx.previousResults!.map((result: SearchResultItem) => ({
            ...result,
            metadata: {
              ...result.metadata,
              recovery_strategy: "partial_results",
              original_error:
                error instanceof Error ? error.message : String(error),
            },
          }));
        }),
      };

      const failingCircuitBreaker = new SearchCircuitBreaker([
        failingRetryStrategy,
        partialStrategy,
      ]);

      const result = await failingCircuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockSearchResult,
        metadata: {
          ...mockSearchResult.metadata,
          recovery_strategy: "partial_results",
          original_error: "Network failure",
        },
      });
    });

    it("should gracefully degrade when no other strategies work", async () => {
      const authError = new ExaAuthError("Invalid API key", {
        status: 401,
      });

      const mockOperation = vi.fn().mockRejectedValueOnce(authError);
      const context = createSearchContext([mockSearchQuery], 1);

      const result = await circuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
      if (result[0]) {
        expect(result[0].title).toBe("Search Error");
        expect(result[0].metadata).toBeDefined();
        if (result[0].metadata) {
          expect(result[0].metadata.error_recovery).toBe(
            "graceful_degradation"
          );
          expect(result[0].metadata.error_type).toBe("ExaAuthError");
          expect(result[0].metadata.error_message).toBe("Invalid API key");
        }
      }
    });
  });

  describe("Strategy Priority and Flow", () => {
    it("should execute recovery strategies in correct priority order", async () => {
      const networkError = new ExaNetworkError("Network error", {
        isTimeout: false,
        isConnectionError: true,
      });

      const mockOperation = vi.fn().mockRejectedValueOnce(networkError);
      const context = createSearchContext([mockSearchQuery], 1);

      // Create a fresh circuit breaker with failing retry strategy to test priority order
      const failingRetryStrategy: RecoveryStrategy = {
        name: "FailingTestRetry",
        priority: 1,
        canRecover: (error) => error instanceof ExaNetworkError,
        recover: vi.fn().mockRejectedValue(new Error("Retry failed")),
      };

      const gracefulStrategy: RecoveryStrategy = {
        name: "TestGraceful",
        priority: 3,
        canRecover: () => true,
        recover: vi.fn().mockImplementation(async (error, ctx) => [
          {
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
            original_query: ctx.queries[0] || mockSearchQuery,
            metadata: {
              error_recovery: "graceful_degradation",
              error_type: error?.constructor?.name || "Unknown",
              error_message:
                error instanceof Error ? error.message : String(error),
            },
          },
        ]),
      };

      const priorityTestCircuitBreaker = new SearchCircuitBreaker([
        failingRetryStrategy,
        gracefulStrategy,
      ]);

      const result = await priorityTestCircuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      // Should eventually fall back to graceful degradation (priority 3)
      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
      if (result[0]?.metadata) {
        expect(result[0].title).toBe("Search Error");
        expect(result[0].metadata.error_recovery).toBe("graceful_degradation");
      }

      // Verify strategies were called in order
      expect(failingRetryStrategy.recover).toHaveBeenCalled(); // Priority 1
      expect(gracefulStrategy.recover).toHaveBeenCalled(); // Priority 3
    });

    it("should skip strategies that cannot recover from specific error types", async () => {
      const serverError = new ExaServerError("Server error", { status: 500 });
      const mockOperation = vi.fn().mockRejectedValueOnce(serverError);
      const context = createSearchContext([mockSearchQuery], 1);

      const result = await circuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      // ServerError should skip retry strategy (it only handles rate limit and network)
      // and go straight to graceful degradation
      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
      if (result[0]) {
        expect(result[0].title).toBe("Search Error");
      }

      const retryStrategy = circuitBreaker
        .getStrategies()
        .find((s) => s.name === "TestRetry");
      const gracefulStrategy = circuitBreaker
        .getStrategies()
        .find((s) => s.name === "TestGraceful");

      expect(retryStrategy?.recover).not.toHaveBeenCalled(); // Should be skipped
      expect(gracefulStrategy?.recover).toHaveBeenCalled(); // Should be called
    });
  });
});
