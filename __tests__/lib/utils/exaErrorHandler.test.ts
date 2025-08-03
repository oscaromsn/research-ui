import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  analyzeExaError,
  createUserErrorMessage,
  executeWithRetry,
  getErrorCategory,
  isQuotaRelatedError,
  type RetryConfig,
  shouldAbortResearch,
} from "@/lib/utils/exaErrorHandler";
import {
  ExaAuthError,
  ExaClientError,
  ExaConfigError,
  ExaNetworkError,
  ExaParsingError,
  ExaRateLimitError,
  ExaServerError,
} from "@/lib/utils/exaSearchErrors";

describe("Exa Error Handler", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // Intentionally empty - suppressing console warnings in tests
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("analyzeExaError function", () => {
    describe("Config Error Handling", () => {
      it("should handle config errors as non-retryable", () => {
        const configError = new ExaConfigError("Missing API key");
        const result = analyzeExaError(configError);

        expect(result.shouldRetry).toBe(false);
        expect(result.errorCategory).toBe("config");
        expect(result.isRecoverable).toBe(false);
        expect(result.userMessage).toContain("configuration error");
        expect(result.suggestedAction).toContain("Check API key");
      });
    });

    describe("Auth Error Handling", () => {
      it("should handle recoverable auth errors with retry", () => {
        const authError = new ExaAuthError("Temporary auth issue");
        vi.spyOn(authError, "isRecoverable").mockReturnValue(true);

        const result = analyzeExaError(authError, 1);

        expect(result.shouldRetry).toBe(false); // First attempt for recoverable
        expect(result.errorCategory).toBe("auth");
        expect(result.isRecoverable).toBe(true);
        expect(result.retryDelay).toBe(1000);
        expect(result.userMessage).toContain("temporarily unavailable");
      });

      it("should handle non-recoverable auth errors", () => {
        const authError = new ExaAuthError("Invalid API key");
        vi.spyOn(authError, "isRecoverable").mockReturnValue(false);

        const result = analyzeExaError(authError, 1);

        expect(result.shouldRetry).toBe(true); // One retry attempt
        expect(result.errorCategory).toBe("auth");
        expect(result.isRecoverable).toBe(false);
        expect(result.userMessage).toContain("authentication failed");
      });
    });

    describe("Rate Limit Error Handling", () => {
      it("should handle rate limit errors with exponential backoff", () => {
        const rateLimitError = new ExaRateLimitError("Rate limit exceeded", {
          rateLimitType: "requests",
        });
        vi.spyOn(rateLimitError, "getSuggestedRetryDelay").mockReturnValue(
          5000
        );

        const result = analyzeExaError(rateLimitError, 2);

        expect(result.shouldRetry).toBe(true);
        expect(result.errorCategory).toBe("rate_limit");
        expect(result.retryDelay).toBe(5000);
        expect(result.isRecoverable).toBe(true);
        expect(result.userMessage).toContain("Search rate limit exceeded");
        expect(result.userMessage).toContain("5 seconds");
      });

      it("should stop retrying after max attempts", () => {
        const rateLimitError = new ExaRateLimitError("Rate limit exceeded", {
          rateLimitType: "requests",
        });
        vi.spyOn(rateLimitError, "getSuggestedRetryDelay").mockReturnValue(
          5000
        );

        const result = analyzeExaError(rateLimitError, 4, { maxRetries: 3 });

        expect(result.shouldRetry).toBe(false);
        expect(result.userMessage).toContain("try again later");
      });
    });

    describe("Server Error Handling", () => {
      it("should handle temporary server errors with retry", () => {
        const serverError = new ExaServerError("Service unavailable", {
          status: 503,
          isTemporary: true,
        });
        vi.spyOn(serverError, "getSuggestedRetryDelay").mockReturnValue(10000);

        const result = analyzeExaError(serverError, 1);

        expect(result.shouldRetry).toBe(true);
        expect(result.errorCategory).toBe("server");
        expect(result.retryDelay).toBe(10000);
        expect(result.isRecoverable).toBe(true);
        expect(result.userMessage).toContain("temporarily unavailable");
      });

      it("should not retry permanent server errors", () => {
        const serverError = new ExaServerError("Internal error", {
          status: 500,
          isTemporary: false,
        });

        const result = analyzeExaError(serverError, 1);

        expect(result.shouldRetry).toBe(false);
        expect(result.isRecoverable).toBe(false);
        expect(result.userMessage).toContain("currently unavailable");
      });
    });

    describe("Client Error Handling", () => {
      it("should handle retryable client errors", () => {
        const clientError = new ExaClientError("Request timeout", {
          status: 408,
        });
        vi.spyOn(clientError, "isRetryable").mockReturnValue(true);

        const result = analyzeExaError(clientError, 1);

        expect(result.shouldRetry).toBe(true);
        expect(result.errorCategory).toBe("client");
        expect(result.retryDelay).toBe(1000);
        expect(result.userMessage).toContain("timeout");
      });

      it("should not retry non-retryable client errors", () => {
        const clientError = new ExaClientError("Bad request", {
          status: 400,
        });
        vi.spyOn(clientError, "isRetryable").mockReturnValue(false);

        const result = analyzeExaError(clientError, 1);

        expect(result.shouldRetry).toBe(false);
        expect(result.userMessage).toContain("Invalid search request");
      });
    });

    describe("Network Error Handling", () => {
      it("should handle network errors with exponential backoff", () => {
        const networkError = new ExaNetworkError("Connection failed");
        vi.spyOn(networkError, "getSuggestedRetryDelay").mockReturnValue(2000);

        const result = analyzeExaError(networkError, 2);

        expect(result.shouldRetry).toBe(true);
        expect(result.errorCategory).toBe("network");
        expect(result.retryDelay).toBe(2000);
        expect(result.isRecoverable).toBe(true);
        expect(result.userMessage).toContain("Network connection issue");
      });
    });

    describe("Parsing Error Handling", () => {
      it("should handle parsing errors with limited retry", () => {
        const parsingError = new ExaParsingError("Invalid JSON response");

        const result = analyzeExaError(parsingError, 1);

        expect(result.shouldRetry).toBe(true);
        expect(result.errorCategory).toBe("parsing");
        expect(result.retryDelay).toBe(1000);
        expect(result.maxRetries).toBe(1);
        expect(result.userMessage).toContain("parsing error");
      });
    });

    describe("Unknown Error Handling", () => {
      it("should handle unknown errors gracefully", () => {
        const unknownError = new Error("Something went wrong");

        const result = analyzeExaError(unknownError);

        expect(result.shouldRetry).toBe(true);
        expect(result.errorCategory).toBe("unknown");
        expect(result.retryDelay).toBe(2000);
        expect(result.maxRetries).toBe(1);
        expect(result.userMessage).toContain("unexpected error");
      });

      it("should handle non-Error objects", () => {
        const unknownError = "String error";

        const result = analyzeExaError(unknownError);

        expect(result.shouldRetry).toBe(true);
        expect(result.errorCategory).toBe("unknown");
        expect(result.technicalDetails).toBe("String error");
      });
    });

    describe("Custom Retry Configuration", () => {
      it("should respect custom max retries", () => {
        const networkError = new ExaNetworkError("Connection failed");
        vi.spyOn(networkError, "getSuggestedRetryDelay").mockReturnValue(1000);

        const customConfig: RetryConfig = {
          maxRetries: 5,
          maxDelay: 20000,
          backoffMultiplier: 1.5,
        };

        const result = analyzeExaError(networkError, 6, customConfig);

        expect(result.shouldRetry).toBe(false); // Exceeds maxRetries
      });

      it("should respect max delay limits", () => {
        const rateLimitError = new ExaRateLimitError("Rate limit exceeded", {
          rateLimitType: "requests",
        });
        vi.spyOn(rateLimitError, "getSuggestedRetryDelay").mockReturnValue(
          50000
        );

        const customConfig: RetryConfig = {
          maxRetries: 3,
          maxDelay: 10000,
          backoffMultiplier: 2,
        };

        const result = analyzeExaError(rateLimitError, 1, customConfig);

        expect(result.retryDelay).toBe(10000); // Capped at maxDelay
      });
    });
  });

  describe("executeWithRetry function", () => {
    it("should succeed on first attempt when operation succeeds", async () => {
      const mockOperation = vi.fn().mockResolvedValue("success");

      const result = await executeWithRetry(mockOperation);

      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it("should retry on recoverable errors", async () => {
      const rateLimitError = new ExaRateLimitError("Rate limit", {
        rateLimitType: "requests",
      });
      vi.spyOn(rateLimitError, "getSuggestedRetryDelay").mockReturnValue(100);

      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue("success after retry");

      const result = await executeWithRetry(mockOperation, { maxRetries: 2 });

      expect(result).toBe("success after retry");
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it("should not retry on non-recoverable errors", async () => {
      const configError = new ExaConfigError("Missing API key");
      const mockOperation = vi.fn().mockRejectedValue(configError);

      await expect(executeWithRetry(mockOperation)).rejects.toThrow(
        configError
      );
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it("should respect max retry limits", async () => {
      const networkError = new ExaNetworkError("Connection failed");
      vi.spyOn(networkError, "getSuggestedRetryDelay").mockReturnValue(10);

      const mockOperation = vi.fn().mockRejectedValue(networkError);

      await expect(
        executeWithRetry(mockOperation, { maxRetries: 2 })
      ).rejects.toThrow(networkError);

      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it("should wait for retry delay", async () => {
      const rateLimitError = new ExaRateLimitError("Rate limit", {
        rateLimitType: "requests",
      });
      vi.spyOn(rateLimitError, "getSuggestedRetryDelay").mockReturnValue(50);

      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue("success");

      const startTime = Date.now();
      const result = await executeWithRetry(mockOperation);
      const endTime = Date.now();

      expect(result).toBe("success");
      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
    });

    it("should log retry attempts", async () => {
      const networkError = new ExaNetworkError("Connection failed");
      vi.spyOn(networkError, "getSuggestedRetryDelay").mockReturnValue(10);

      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue("success");

      await executeWithRetry(mockOperation);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Search attempt 1 failed:"),
        expect.objectContaining({
          errorCategory: "network",
          shouldRetry: true,
        })
      );
    });
  });

  describe("createUserErrorMessage function", () => {
    it("should create user-friendly messages for different error types", () => {
      const rateLimitError = new ExaRateLimitError("Rate limit", {
        rateLimitType: "requests",
      });
      vi.spyOn(rateLimitError, "getSuggestedRetryDelay").mockReturnValue(5000);

      const result = createUserErrorMessage(rateLimitError);

      expect(result.message).toContain("Search rate limit exceeded");
      expect(result.shouldContinue).toBe(false); // Recoverable but retrying
      expect(result.retryAfter).toBe(5000);
    });

    it("should indicate when research should continue", () => {
      const clientError = new ExaClientError("Bad request", {
        status: 400,
      });
      vi.spyOn(clientError, "isRetryable").mockReturnValue(false);

      const result = createUserErrorMessage(clientError);

      expect(result.shouldContinue).toBe(false); // Non-retryable and not recoverable
    });
  });

  describe("shouldAbortResearch function", () => {
    it("should abort for non-recoverable config errors", () => {
      const configError = new ExaConfigError("Missing API key");

      expect(shouldAbortResearch(configError)).toBe(true);
    });

    it("should abort for non-recoverable auth errors", () => {
      const authError = new ExaAuthError("Invalid API key");
      vi.spyOn(authError, "isRecoverable").mockReturnValue(false);

      expect(shouldAbortResearch(authError)).toBe(true);
    });

    it("should not abort for recoverable errors", () => {
      const networkError = new ExaNetworkError("Connection failed");

      expect(shouldAbortResearch(networkError)).toBe(false);
    });

    it("should not abort for rate limit errors", () => {
      const rateLimitError = new ExaRateLimitError("Rate limit", {
        rateLimitType: "requests",
      });

      expect(shouldAbortResearch(rateLimitError)).toBe(false);
    });
  });

  describe("getErrorCategory function", () => {
    it("should return correct categories for different error types", () => {
      expect(getErrorCategory(new ExaConfigError("test"))).toBe("config");
      expect(getErrorCategory(new ExaAuthError("test"))).toBe("auth");
      expect(
        getErrorCategory(
          new ExaRateLimitError("test", { rateLimitType: "requests" })
        )
      ).toBe("rate_limit");
      expect(
        getErrorCategory(new ExaServerError("test", { status: 500 }))
      ).toBe("server");
      expect(
        getErrorCategory(new ExaClientError("test", { status: 400 }))
      ).toBe("client");
      expect(getErrorCategory(new ExaNetworkError("test"))).toBe("network");
      expect(getErrorCategory(new ExaParsingError("test"))).toBe("parsing");
      expect(getErrorCategory(new Error("test"))).toBe("unknown");
    });
  });

  describe("isQuotaRelatedError function", () => {
    it("should identify quota-related rate limit errors", () => {
      const quotaError = new ExaRateLimitError("Quota exceeded", {
        rateLimitType: "quota",
      });
      expect(isQuotaRelatedError(quotaError)).toBe(true);
    });

    it("should not identify non-quota rate limit errors", () => {
      const requestsError = new ExaRateLimitError("Too many requests", {
        rateLimitType: "requests",
      });
      expect(isQuotaRelatedError(requestsError)).toBe(false);
    });

    it("should not identify non-rate-limit errors as quota-related", () => {
      const networkError = new ExaNetworkError("Connection failed");
      expect(isQuotaRelatedError(networkError)).toBe(false);
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complex retry scenarios with multiple error types", async () => {
      const rateLimitError = new ExaRateLimitError("Rate limit", {
        rateLimitType: "requests",
      });
      vi.spyOn(rateLimitError, "getSuggestedRetryDelay").mockReturnValue(50);

      const networkError = new ExaNetworkError("Network issue");
      vi.spyOn(networkError, "getSuggestedRetryDelay").mockReturnValue(100);

      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue("final success");

      const result = await executeWithRetry(mockOperation, { maxRetries: 3 });

      expect(result).toBe("final success");
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it("should provide consistent error categorization", () => {
      const errors = [
        new ExaConfigError("config"),
        new ExaAuthError("auth"),
        new ExaRateLimitError("rate", { rateLimitType: "requests" }),
        new ExaNetworkError("network"),
        new Error("unknown"),
      ];

      errors.forEach((error) => {
        const analysis = analyzeExaError(error);
        const category = getErrorCategory(error);
        expect(analysis.errorCategory).toBe(category);
      });
    });

    it("should handle edge cases gracefully", () => {
      const nullError = null;
      const undefinedError = undefined;
      const numberError = 42;

      expect(() => analyzeExaError(nullError)).not.toThrow();
      expect(() => analyzeExaError(undefinedError)).not.toThrow();
      expect(() => analyzeExaError(numberError)).not.toThrow();

      expect(analyzeExaError(nullError).errorCategory).toBe("unknown");
      expect(analyzeExaError(undefinedError).errorCategory).toBe("unknown");
      expect(analyzeExaError(numberError).errorCategory).toBe("unknown");
    });
  });

  describe("Performance Considerations", () => {
    it("should not introduce significant overhead", () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        analyzeExaError(new ExaNetworkError("test"));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 1000 analyses in reasonable time (adjusted for Bun)
      expect(duration).toBeLessThan(300);
    });

    it("should handle high-frequency error analysis", () => {
      const errors = Array.from(
        { length: 100 },
        (_, i) =>
          new ExaRateLimitError(`Error ${i}`, { rateLimitType: "requests" })
      );

      const startTime = performance.now();

      errors.forEach((error) => analyzeExaError(error));

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle 100 error analyses efficiently
      expect(duration).toBeLessThan(50);
    });
  });
});
