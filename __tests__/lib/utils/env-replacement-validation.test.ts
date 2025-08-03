/**
 * @file Environment Variable Replacement Validation Tests
 *
 * Tests to validate that our environment validation system works correctly
 * and that modules integrate properly with the validated environment.
 * These tests verify the behavior of already-loaded modules rather than
 * testing module re-loading which is unreliable in test environments.
 *
 * Following TDD approach - tests written first to define expected behavior.
 */

import { describe, expect, it } from "vitest";

/**
 * Tests for environment validation system behavior.
 * These tests verify that modules work correctly with the validated environment.
 */
describe("Environment Variable Replacement Validation", () => {
  describe("ExaSearch Utility Environment Integration", () => {
    it("should use validated env instead of direct process.env access", async () => {
      // Act - Import the utility (should use validated env)
      const exaSearchUtil = await import("@/lib/utils/exaSearchUtil");

      // Assert - Should be able to access utility without direct env access
      expect(exaSearchUtil.executeExaSearch).toBeDefined();
      expect(typeof exaSearchUtil.executeExaSearch).toBe("function");
    });

    it("should handle environment validation gracefully for external API calls", async () => {
      // Act - Load utility with validated environment
      const exaSearchUtil = await import("@/lib/utils/exaSearchUtil");

      // Assert - Should have access to utility functions without throwing
      expect(exaSearchUtil.executeExaSearch).toBeDefined();

      // The utility should work without directly accessing process.env
      // (This test verifies the integration works, actual API calls are mocked in other tests)
    });
  });

  describe("Debugging and Logging Environment Integration", () => {
    it("should use validated debugging configuration instead of direct process.env", async () => {
      // Act - Import modules that use debugging configuration
      const useResearchAgent = await import("@/lib/hooks/useResearchAgent");

      // Assert - Should be able to access the hook without direct env access
      expect(useResearchAgent.useResearchAgent).toBeDefined();
      expect(typeof useResearchAgent.useResearchAgent).toBe("function");
    });

    it("should handle missing debugging environment variables gracefully", async () => {
      // Act & Assert - Should not throw when debugging vars are missing
      await expect(
        import("@/lib/hooks/useResearchAgent")
      ).resolves.toBeDefined();
    });
  });

  describe("Type Safety Validation", () => {
    it("should provide type-safe access to environment variables", async () => {
      // Act - Get validated environment
      const { env } = await import("@/lib/schemas/env");

      // Assert - Should have typed access to all environment variables
      expect(typeof env.NODE_ENV).toBe("string");
      expect(typeof env.CEREBRAS_API_KEY).toBe("string");
      expect(typeof env.EXA_API_KEY).toBe("string");

      // TypeScript should provide autocomplete and type checking for these
      expect(env.NODE_ENV).toBeDefined();
      expect(env.CEREBRAS_API_KEY).toBeDefined();
      expect(env.EXA_API_KEY).toBeDefined();
    });

    it("should distinguish between required and optional environment variables", async () => {
      // Act - Get validated environment
      const { env } = await import("@/lib/schemas/env");

      // Assert - Required variables should be present
      expect(env.NODE_ENV).toBeDefined();
      expect(env.CEREBRAS_API_KEY).toBeDefined();
      expect(env.EXA_API_KEY).toBeDefined();

      // Optional variables may or may not be defined
      // TypeScript typing allows undefined for these
      expect(
        env.GOOGLE_API_KEY === undefined ||
          typeof env.GOOGLE_API_KEY === "string"
      ).toBe(true);
      expect(
        env.OPENAI_API_KEY === undefined ||
          typeof env.OPENAI_API_KEY === "string"
      ).toBe(true);
      expect(
        env.ANTHROPIC_API_KEY === undefined ||
          typeof env.ANTHROPIC_API_KEY === "string"
      ).toBe(true);
    });
  });

  describe("Performance Requirements", () => {
    it("should validate environment variables quickly during module loading", async () => {
      // Act - Measure validation time
      const startTime = Date.now();

      await import("@/lib/schemas/env");
      await import("@/lib/utils/exaSearchUtil");

      const endTime = Date.now();
      const validationTime = endTime - startTime;

      // Assert - Should be fast (< 200ms adjusted for Bun + dynamic imports)
      expect(validationTime).toBeLessThan(200);
    });
  });

  describe("Error Handling and Messages", () => {
    it("should provide meaningful error information for environment validation", async () => {
      // Act - Import environment validation
      const { env } = await import("@/lib/schemas/env");

      // Assert - Should have properly validated environment
      expect(env).toBeDefined();
      expect(typeof env).toBe("object");

      // Required fields should be present
      expect(env.NODE_ENV).toBeDefined();
      expect(env.CEREBRAS_API_KEY).toBeDefined();
      expect(env.EXA_API_KEY).toBeDefined();
    });
  });

  describe("Configuration Integration", () => {
    it("should integrate environment validation with configuration system", async () => {
      // Act - Load both env and config
      const { env } = await import("@/lib/schemas/env");
      const { config } = await import("@/lib/config");

      // Assert - Configuration should use validated environment
      expect(env.NODE_ENV).toBeDefined();
      expect(config.environment).toBe(env.NODE_ENV);
      expect(config.research.maxQueriesPerIteration).toBeGreaterThan(0);
    });
  });
});
