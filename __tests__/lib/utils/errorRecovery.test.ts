import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchQueryItem, SearchResultItem } from "@/baml_client/types";
import {
  createRetryContext,
  createSearchContext,
  type RecoveryStrategy,
  SearchCircuitBreaker,
  type SearchContext,
} from "@/lib/utils/errorRecovery";

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

describe("SearchCircuitBreaker", () => {
  let mockStrategy1: RecoveryStrategy;
  let mockStrategy2: RecoveryStrategy;
  let mockStrategy3: RecoveryStrategy;
  let circuitBreaker: SearchCircuitBreaker;

  beforeEach(() => {
    // Mock strategy that can recover from network errors
    mockStrategy1 = {
      name: "NetworkRecovery",
      priority: 1,
      canRecover: vi.fn((error: unknown, _context: SearchContext) => {
        return error instanceof Error && error.message.includes("network");
      }),
      recover: vi.fn(async () => [mockSearchResult]),
    };

    // Mock strategy that can recover from rate limit errors
    mockStrategy2 = {
      name: "RateLimitRecovery",
      priority: 2,
      canRecover: vi.fn((error: unknown, _context: SearchContext) => {
        return error instanceof Error && error.message.includes("rate limit");
      }),
      recover: vi.fn(async () => [mockSearchResult]),
    };

    // Mock strategy that always can recover (fallback)
    mockStrategy3 = {
      name: "AlwaysRecover",
      priority: 3,
      canRecover: vi.fn(() => true),
      recover: vi.fn(async () => []),
    };

    circuitBreaker = new SearchCircuitBreaker([
      mockStrategy1,
      mockStrategy2,
      mockStrategy3,
    ]);
  });

  describe("executeWithRecovery", () => {
    it("should execute operation successfully without recovery", async () => {
      const mockOperation = vi.fn().mockResolvedValue([mockSearchResult]);
      const context = createSearchContext([mockQuery]);

      const result = await circuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      expect(mockOperation).toHaveBeenCalledOnce();
      expect(result).toEqual([mockSearchResult]);
      expect(mockStrategy1.canRecover).not.toHaveBeenCalled();
      expect(mockStrategy1.recover).not.toHaveBeenCalled();
    });

    it("should recover using first applicable strategy", async () => {
      const networkError = new Error("network timeout");
      const mockOperation = vi.fn().mockRejectedValue(networkError);
      const context = createSearchContext([mockQuery]);

      const result = await circuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      expect(mockOperation).toHaveBeenCalledOnce();
      expect(mockStrategy1.canRecover).toHaveBeenCalledWith(
        networkError,
        context
      );
      expect(mockStrategy1.recover).toHaveBeenCalledWith(networkError, context);
      expect(mockStrategy2.canRecover).not.toHaveBeenCalled();
      expect(result).toEqual([mockSearchResult]);
    });

    it("should try strategies in priority order", async () => {
      const rateLimitError = new Error("rate limit exceeded");
      const mockOperation = vi.fn().mockRejectedValue(rateLimitError);
      const context = createSearchContext([mockQuery]);

      const result = await circuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      expect(mockOperation).toHaveBeenCalledOnce();
      expect(mockStrategy1.canRecover).toHaveBeenCalledWith(
        rateLimitError,
        context
      );
      expect(mockStrategy2.canRecover).toHaveBeenCalledWith(
        rateLimitError,
        context
      );
      expect(mockStrategy2.recover).toHaveBeenCalledWith(
        rateLimitError,
        context
      );
      expect(result).toEqual([mockSearchResult]);
    });

    it("should fall back to next strategy if first one fails", async () => {
      const networkError = new Error("network timeout");
      const mockOperation = vi.fn().mockRejectedValue(networkError);

      // Make first strategy fail during recovery
      (mockStrategy1.recover as any).mockRejectedValue(
        new Error("Recovery failed")
      );

      const context = createSearchContext([mockQuery]);

      const result = await circuitBreaker.executeWithRecovery(
        mockOperation,
        context
      );

      expect(mockStrategy1.canRecover).toHaveBeenCalledWith(
        networkError,
        context
      );
      expect(mockStrategy1.recover).toHaveBeenCalledWith(networkError, context);
      expect(mockStrategy3.canRecover).toHaveBeenCalledWith(
        networkError,
        context
      );
      expect(mockStrategy3.recover).toHaveBeenCalledWith(networkError, context);
      expect(result).toEqual([]);
    });

    it("should throw original error if all recovery strategies fail", async () => {
      const originalError = new Error("network timeout"); // Use an error that the first strategy can handle
      const mockOperation = vi.fn().mockRejectedValue(originalError);

      // Make all strategies fail
      (mockStrategy1.recover as any).mockRejectedValue(
        new Error("Recovery 1 failed")
      );
      (mockStrategy2.recover as any).mockRejectedValue(
        new Error("Recovery 2 failed")
      );
      (mockStrategy3.recover as any).mockRejectedValue(
        new Error("Recovery 3 failed")
      );

      const context = createSearchContext([mockQuery]);

      await expect(
        circuitBreaker.executeWithRecovery(mockOperation, context)
      ).rejects.toThrow("network timeout");

      // All applicable strategies should have been called
      expect(mockStrategy1.recover).toHaveBeenCalled();
      expect(mockStrategy3.recover).toHaveBeenCalled();
    });

    it("should throw original error if no strategies can recover", async () => {
      const unknownError = new Error("unknown error type");
      const mockOperation = vi.fn().mockRejectedValue(unknownError);

      // Make strategies unable to recover from this error type
      (mockStrategy1.canRecover as any).mockReturnValue(false);
      (mockStrategy2.canRecover as any).mockReturnValue(false);
      (mockStrategy3.canRecover as any).mockReturnValue(false);

      const context = createSearchContext([mockQuery]);

      await expect(
        circuitBreaker.executeWithRecovery(mockOperation, context)
      ).rejects.toThrow("unknown error type");

      expect(mockStrategy1.canRecover).toHaveBeenCalled();
      expect(mockStrategy2.canRecover).toHaveBeenCalled();
      expect(mockStrategy3.canRecover).toHaveBeenCalled();
      expect(mockStrategy1.recover).not.toHaveBeenCalled();
    });
  });

  describe("strategy management", () => {
    it("should add new strategy and maintain priority order", () => {
      const newStrategy: RecoveryStrategy = {
        name: "HighPriorityStrategy",
        priority: 0, // Higher priority than existing ones
        canRecover: vi.fn(() => true),
        recover: vi.fn(async () => []),
      };

      circuitBreaker.addStrategy(newStrategy);
      const strategies = circuitBreaker.getStrategies();

      expect(strategies).toHaveLength(4);
      expect(strategies[0]).toBe(newStrategy); // Should be first due to priority 0
      expect(strategies[1]).toBe(mockStrategy1); // Priority 1
    });

    it("should remove strategy by name", () => {
      const removed = circuitBreaker.removeStrategy("NetworkRecovery");
      const strategies = circuitBreaker.getStrategies();

      expect(removed).toBe(true);
      expect(strategies).toHaveLength(2);
      expect(
        strategies.find((s) => s.name === "NetworkRecovery")
      ).toBeUndefined();
    });

    it("should return false when removing non-existent strategy", () => {
      const removed = circuitBreaker.removeStrategy("NonExistentStrategy");
      expect(removed).toBe(false);
    });
  });
});

describe("createSearchContext", () => {
  it("should create context with required fields", () => {
    const queries = [mockQuery];
    const context = createSearchContext(queries);

    expect(context.queries).toBe(queries);
    expect(context.attempt).toBe(1);
    expect(context.startTime).toBeTypeOf("number");
    expect(context.startTime).toBeLessThanOrEqual(Date.now());
    expect(context.previousResults).toBeUndefined();
    expect(context.requestId).toBeUndefined();
  });

  it("should create context with optional fields", () => {
    const queries = [mockQuery];
    const previousResults = [mockSearchResult];
    const requestId = "test-request-123";

    const context = createSearchContext(queries, 2, previousResults, requestId);

    expect(context.queries).toBe(queries);
    expect(context.attempt).toBe(2);
    expect(context.previousResults).toBe(previousResults);
    expect(context.requestId).toBe(requestId);
  });
});

describe("createRetryContext", () => {
  it("should create retry context with incremented attempt", () => {
    const originalContext = createSearchContext([mockQuery], 1);
    const retryContext = createRetryContext(originalContext, 2);

    expect(retryContext.queries).toBe(originalContext.queries);
    expect(retryContext.attempt).toBe(2);
    expect(retryContext.startTime).toBe(originalContext.startTime);
    expect(retryContext.previousResults).toBe(originalContext.previousResults);
    expect(retryContext.requestId).toBe(originalContext.requestId);
  });
});
