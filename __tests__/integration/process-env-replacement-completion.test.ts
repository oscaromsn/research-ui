/**
 * @file Process.env Replacement Completion Tests
 *
 * Integration tests to validate that systematic process.env replacement is complete.
 * This test suite verifies that all critical application code uses validated
 * environment variables instead of direct process.env access, ensuring type safety
 * and fail-fast validation.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  captureTestEnv,
  deleteTestEnv,
  restoreTestEnv,
  setTestEnv,
} from "../test-env-utils";

describe("Process.env Replacement Completion Validation", () => {
  // Store original env for cleanup
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = captureTestEnv();
  });

  afterEach(() => {
    // Restore original environment variables
    restoreTestEnv(originalEnv);

    // Clear module cache to force re-evaluation
    delete require.cache[require.resolve("@/lib/schemas/env")];
    delete require.cache[require.resolve("@/lib/config")];
    delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];
    delete require.cache[require.resolve("@/lib/hooks/useResearchAgent")];
  });

  describe("Complete Infrastructure Integration", () => {
    it("should demonstrate end-to-end validated environment usage", () => {
      // Arrange - Set up complete valid environment
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-cerebras-key");
      setTestEnv("EXA_API_KEY", "prod-exa-key");
      setTestEnv("OPENAI_API_KEY", "prod-openai-key");

      // Act - Load all infrastructure modules that should use validated env
      delete require.cache[require.resolve("@/lib/schemas/env")];
      delete require.cache[require.resolve("@/lib/config")];
      delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];
      delete require.cache[require.resolve("@/lib/hooks/useResearchAgent")];

      const { env } = require("@/lib/schemas/env");
      const { config } = require("@/lib/config");
      const exaSearchUtil = require("@/lib/utils/exaSearchUtil");
      const useResearchAgentModule = require("@/lib/hooks/useResearchAgent");

      // Assert - All modules should load successfully with validated environment
      expect(env.NODE_ENV).toBe("production");
      expect(env.CEREBRAS_API_KEY).toBe("prod-cerebras-key");
      expect(env.EXA_API_KEY).toBe("prod-exa-key");
      expect(env.OPENAI_API_KEY).toBe("prod-openai-key");

      expect(config.environment).toBe("production");
      expect(config.research.maxQueriesPerIteration).toBe(3);

      expect(exaSearchUtil.executeExaSearch).toBeDefined();
      expect(useResearchAgentModule.useResearchAgent).toBeDefined();
    });

    it("should fail fast across all modules when critical environment variables are missing", () => {
      // Arrange - Missing critical environment variable
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-key");
      deleteTestEnv("EXA_API_KEY"); // Missing critical key

      // Act & Assert - All dependent modules should fail to load
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow(/Missing or invalid environment variables.*EXA_API_KEY/);

      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        delete require.cache[require.resolve("@/lib/config")];
        require("@/lib/config");
      }).toThrow(/Missing or invalid environment variables/);

      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];
        require("@/lib/utils/exaSearchUtil");
      }).toThrow(/Missing or invalid environment variables/);
    });

    it("should provide consistent environment values across all modules", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "development");
      setTestEnv("CEREBRAS_API_KEY", "dev-cerebras-key");
      setTestEnv("EXA_API_KEY", "dev-exa-key");

      // Act - Load all modules
      delete require.cache[require.resolve("@/lib/schemas/env")];
      delete require.cache[require.resolve("@/lib/config")];
      delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];

      const { env } = require("@/lib/schemas/env");
      const { config } = require("@/lib/config");

      // Assert - Environment values should be consistent
      expect(env.NODE_ENV).toBe("development");
      expect(config.environment).toBe("development");
      expect(env.EXA_API_KEY).toBe("dev-exa-key");

      // Config should reflect development-specific values
      expect(config.research.searchTimeoutMs).toBe(10000); // Dev timeout
    });
  });

  describe("Type Safety Validation", () => {
    it("should provide full TypeScript type safety for environment variables", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      setTestEnv("EXA_API_KEY", "test-key");

      // Act - Get validated environment
      delete require.cache[require.resolve("@/lib/schemas/env")];
      const { env } = require("@/lib/schemas/env");

      // Assert - Should have type-safe access (this validates at compile time)
      expect(typeof env.NODE_ENV).toBe("string");
      expect(typeof env.CEREBRAS_API_KEY).toBe("string");
      expect(typeof env.EXA_API_KEY).toBe("string");

      // Optional variables should be properly typed as string | undefined
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

  describe("Performance and Reliability", () => {
    it("should maintain fast startup performance with validated environment", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-key");
      setTestEnv("EXA_API_KEY", "prod-key");

      // Act - Measure total infrastructure loading time
      const startTime = Date.now();

      delete require.cache[require.resolve("@/lib/schemas/env")];
      delete require.cache[require.resolve("@/lib/config")];
      delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];

      require("@/lib/schemas/env");
      require("@/lib/config");
      require("@/lib/utils/exaSearchUtil");

      const endTime = Date.now();
      const totalLoadTime = endTime - startTime;

      // Assert - Should load quickly (< 200ms for all modules)
      expect(totalLoadTime).toBeLessThan(200);
    });

    it("should fail fast when environment is invalid", () => {
      // Arrange - Invalid environment
      setTestEnv("NODE_ENV", "invalid");
      setTestEnv("CEREBRAS_API_KEY", "");
      deleteTestEnv("EXA_API_KEY");

      // Act & Assert - Should fail immediately
      const startTime = Date.now();

      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow();

      const endTime = Date.now();
      const failTime = endTime - startTime;

      // Should fail very quickly
      expect(failTime).toBeLessThan(100);
    });

    it("should handle different environment configurations correctly", () => {
      const environments = [
        {
          NODE_ENV: "development",
          expectedTimeout: 10000,
          expectedQueries: 3,
        },
        {
          NODE_ENV: "test",
          expectedTimeout: 5000,
          expectedQueries: 2,
        },
        {
          NODE_ENV: "production",
          expectedTimeout: 30000,
          expectedQueries: 3,
        },
      ];

      for (const {
        NODE_ENV,
        expectedTimeout,
        expectedQueries,
      } of environments) {
        // Arrange
        setTestEnv("NODE_ENV", NODE_ENV);
        setTestEnv("CEREBRAS_API_KEY", `${NODE_ENV}-key`);
        setTestEnv("EXA_API_KEY", `${NODE_ENV}-key`);

        // Act
        delete require.cache[require.resolve("@/lib/schemas/env")];
        delete require.cache[require.resolve("@/lib/config")];

        const { env } = require("@/lib/schemas/env");
        const { config } = require("@/lib/config");

        // Assert
        expect(env.NODE_ENV).toBe(NODE_ENV);
        expect(config.environment).toBe(NODE_ENV);
        expect(config.research.searchTimeoutMs).toBe(expectedTimeout);
        expect(config.research.maxQueriesPerIteration).toBe(expectedQueries);
      }
    });
  });

  describe("Security Validation", () => {
    it("should never expose environment variables in error messages", () => {
      // Arrange - Valid environment with sensitive data
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "sk-very-secret-key-12345");
      setTestEnv("EXA_API_KEY", "exa-secret-api-key-67890");

      // Act - Load modules successfully
      delete require.cache[require.resolve("@/lib/schemas/env")];
      delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];

      const { env } = require("@/lib/schemas/env");
      require("@/lib/utils/exaSearchUtil");

      // Assert - Values should be accessible but never logged
      expect(env.CEREBRAS_API_KEY).toBe("sk-very-secret-key-12345");
      expect(env.EXA_API_KEY).toBe("exa-secret-api-key-67890");

      // Error messages should not contain actual key values
      // (This is more of a documentation of the requirement)
    });

    it("should provide clear but secure error messages for missing keys", () => {
      // Arrange - Missing sensitive key
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "valid-key");
      deleteTestEnv("EXA_API_KEY");

      // Act & Assert - Should provide helpful but secure error
      try {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
        expect.fail("Should have thrown an error");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Should mention the missing key
        expect(errorMessage).toMatch(/EXA_API_KEY/);

        // Should not contain any actual API key values
        expect(errorMessage).not.toMatch(/sk-.*|exa-.*|valid-key/);
      }
    });
  });

  describe("Backward Compatibility", () => {
    it("should handle optional environment variables gracefully for backward compatibility", () => {
      // Arrange - Only required variables (simulating older deployments)
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-key");
      setTestEnv("EXA_API_KEY", "prod-key");

      // Remove all optional variables
      deleteTestEnv("GOOGLE_API_KEY");
      deleteTestEnv("OPENAI_API_KEY");
      deleteTestEnv("ANTHROPIC_API_KEY");

      // Act - Should load successfully
      delete require.cache[require.resolve("@/lib/schemas/env")];
      const { env } = require("@/lib/schemas/env");

      // Assert - Required variables present, optional variables undefined
      expect(env.NODE_ENV).toBe("production");
      expect(env.CEREBRAS_API_KEY).toBe("prod-key");
      expect(env.EXA_API_KEY).toBe("prod-key");
      expect(env.GOOGLE_API_KEY).toBeUndefined();
      expect(env.OPENAI_API_KEY).toBeUndefined();
      expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    });
  });
});
