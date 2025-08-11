import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeExaSearch } from "@/lib/utils/exaSearchUtil";
import type { SearchQueryItem } from "@/packages/shared-types/src";

// Error types are imported for type checking and may be used in future tests

// Mock the actual Exa API calls
vi.mock("axios");

const mockQuery: SearchQueryItem = {
  query_string: "legal precedent for contract disputes",
  expected_information: ["case law", "court decisions", "legal reasoning"],
};

describe("Search Error Recovery Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should successfully execute search without errors", async () => {
    // Mock successful response
    const axios = await import("axios");
    vi.mocked(axios.default.post).mockResolvedValue({
      status: 200,
      data: {
        results: [
          {
            id: "doc1",
            url: "https://example.com/case1",
            title: "Contract Law Case",
            score: 0.95,
            text: "Full text of the legal case...",
            highlights: ["important legal principle"],
          },
        ],
        autopromptString: "Enhanced: legal precedent for contract disputes",
      },
    });

    const results = await executeExaSearch(mockQuery, 2, true, 2);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: "https://example.com/case1",
      url: "https://example.com/case1",
      title: "Contract Law Case",
      source_name: "Exa Search",
      score: 0.95,
    });
    expect(results[0]!.snippet).toContain("important legal principle");
  });

  it("should handle rate limit with retry recovery", async () => {
    const axios = await import("axios");

    // First call fails with rate limit
    vi.mocked(axios.default.post)
      .mockRejectedValueOnce({
        response: {
          status: 429,
          data: { error: "Rate limit exceeded" },
          headers: { "retry-after": "2" },
        },
      })
      // Second call succeeds
      .mockResolvedValueOnce({
        status: 200,
        data: {
          results: [
            {
              id: "doc1",
              url: "https://example.com/recovered",
              title: "Recovered Document",
              score: 0.8,
            },
          ],
        },
      });

    // Start the search
    const searchPromise = executeExaSearch(mockQuery, 2, true, 2);

    // Fast-forward through the retry delay
    vi.advanceTimersByTime(2000); // 1 second base delay for attempt 1

    const results = await searchPromise;

    expect(results).toHaveLength(1);
    expect(results[0]!.url).toBe("https://example.com/recovered");
    expect(axios.default.post).toHaveBeenCalledTimes(2); // Initial + retry
  });

  it("should handle network errors with graceful degradation", async () => {
    const axios = await import("axios");

    // Simulate network timeout
    vi.mocked(axios.default.post).mockRejectedValue({
      code: "ECONNABORTED",
      message: "timeout of 30000ms exceeded",
    });

    const results = await executeExaSearch(mockQuery, 2, true, 2);

    // Should return graceful degradation result
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe("Search Error");
    expect(results[0]!.source_name).toBe("Error Recovery");
    expect(results[0]!.metadata).toMatchObject({
      error_recovery: "graceful_degradation",
      error_type: "ExaNetworkError",
      queries_attempted: "1",
    });
  });

  it("should handle server errors with retry and fallback", async () => {
    const axios = await import("axios");

    // Simulate server error that fails retry attempts
    vi.mocked(axios.default.post).mockRejectedValue({
      response: {
        status: 503,
        data: { error: "Service temporarily unavailable" },
      },
    });

    const results = await executeExaSearch(mockQuery, 2, true, 2);

    // Should eventually fall back to graceful degradation
    expect(results).toHaveLength(1);
    expect(results[0]!.metadata).toMatchObject({
      error_recovery: "graceful_degradation",
      error_type: "ExaServerError",
    });

    // Should have attempted retries
    expect(axios.default.post).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("should handle authentication errors immediately without retries", async () => {
    const axios = await import("axios");

    // Simulate auth error
    vi.mocked(axios.default.post).mockRejectedValue({
      response: {
        status: 401,
        data: { error: "Invalid API key" },
      },
    });

    await expect(executeExaSearch(mockQuery, 2, true, 2)).rejects.toThrow(
      "Invalid or expired API key"
    );

    // Should not retry auth errors
    expect(axios.default.post).toHaveBeenCalledTimes(1);
  });

  it("should reduce query load on rate limit recovery", async () => {
    const axios = await import("axios");

    // Mock rate limit error
    vi.mocked(axios.default.post)
      .mockRejectedValueOnce({
        response: {
          status: 429,
          data: { error: "Rate limit exceeded" },
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: { results: [] },
      });

    // Use multiple queries to test reduction
    const multipleQueries = [mockQuery, mockQuery, mockQuery, mockQuery];

    const searchPromise = executeExaSearch(multipleQueries[0]!, 4, true, 2);
    vi.advanceTimersByTime(1000);

    await searchPromise;

    // The circuit breaker should handle this internally
    expect(axios.default.post).toHaveBeenCalledTimes(2);
  });

  it("should handle complex error scenarios with multiple recovery attempts", async () => {
    const axios = await import("axios");

    vi.mocked(axios.default.post)
      // First attempt: Rate limit
      .mockRejectedValueOnce({
        response: { status: 429, data: { error: "Rate limit" } },
      })
      // Second attempt: Network error
      .mockRejectedValueOnce({
        code: "ECONNREFUSED",
        message: "Connection refused",
      })
      // Third attempt: Success
      .mockResolvedValueOnce({
        status: 200,
        data: {
          results: [
            {
              id: "final-doc",
              url: "https://example.com/final",
              title: "Finally Retrieved",
            },
          ],
        },
      });

    const searchPromise = executeExaSearch(mockQuery, 2, true, 2);

    // Fast-forward through delays
    vi.advanceTimersByTime(5000);

    const results = await searchPromise;

    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe("Finally Retrieved");
    expect(axios.default.post).toHaveBeenCalledTimes(3);
  });

  it("should respect timeout configuration", async () => {
    const axios = await import("axios");

    // Mock a very slow response
    vi.mocked(axios.default.post).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 35000)) // 35 seconds
    );

    // executeExaSearch should timeout at 30 seconds (configuration)
    await expect(executeExaSearch(mockQuery, 2, true, 2)).rejects.toThrow();
  });

  describe("Circuit Breaker State Management", () => {
    it("should maintain circuit breaker state across multiple calls", async () => {
      const axios = await import("axios");

      // All calls fail to test circuit breaker behavior
      vi.mocked(axios.default.post).mockRejectedValue({
        response: {
          status: 503,
          data: { error: "Service unavailable" },
        },
      });

      // Multiple concurrent calls
      const promises = Array.from({ length: 3 }, () =>
        executeExaSearch(mockQuery, 1, true, 1)
      );

      const results = await Promise.all(promises);

      // All should return graceful degradation
      results.forEach((result) => {
        expect(result).toHaveLength(1);
        expect(result[0]!.metadata?.error_recovery).toBe(
          "graceful_degradation"
        );
      });
    });
  });
});
