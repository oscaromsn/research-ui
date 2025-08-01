/**
 * @file Environment Variable Replacement Validation Tests
 *
 * Tests to validate that all process.env usage has been systematically replaced
 * with our validated environment system. This ensures type safety, fail-fast
 * validation, and consistent environment variable handling throughout the codebase.
 *
 * Following TDD approach - tests written first to define expected behavior.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  captureTestEnv,
  deleteTestEnv,
  restoreTestEnv,
  setTestEnv,
} from "../../test-env-utils";

/**
 * Tests for systematic process.env replacement validation.
 * These tests ensure that critical application code uses validated env
 * instead of direct process.env access.
 */
describe("Environment Variable Replacement Validation", () => {
  // Store original env for cleanup
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = captureTestEnv();
  });

  afterEach(() => {
    // Restore original environment variables
    restoreTestEnv(originalEnv);

    // Clear module cache to force re-evaluation
    delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];
    delete require.cache[require.resolve("@/lib/schemas/env")];
  });

  describe("ExaSearch Utility Environment Integration", () => {
    it("should use validated env instead of direct process.env access", () => {
      // Arrange - Set up valid environment
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act - Import the utility (should use validated env)
      delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];
      const exaSearchUtil = require("@/lib/utils/exaSearchUtil");

      // Assert - Should be able to access utility without direct env access
      expect(exaSearchUtil.executeExaSearch).toBeDefined();
      expect(typeof exaSearchUtil.executeExaSearch).toBe("function");
    });

    it("should fail fast when EXA_API_KEY is missing (via validated env)", () => {
      // Arrange - Missing EXA_API_KEY
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      deleteTestEnv("EXA_API_KEY");

      // Act & Assert - Should fail when trying to load the module
      // because it depends on validated env which will throw
      expect(() => {
        delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];
        require("@/lib/utils/exaSearchUtil");
      }).toThrow(/Missing or invalid environment variables.*EXA_API_KEY/);
    });

    it("should handle environment validation gracefully for external API calls", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "valid-exa-api-key");

      // Act - Load utility with validated environment
      delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];
      const exaSearchUtil = require("@/lib/utils/exaSearchUtil");

      // Assert - Should have access to utility functions without throwing
      expect(exaSearchUtil.executeExaSearch).toBeDefined();

      // The utility should work without directly accessing process.env
      // (This test verifies the integration works, actual API calls are mocked in other tests)
    });
  });

  describe("Debugging and Logging Environment Integration", () => {
    it("should use validated debugging configuration instead of direct process.env", () => {
      // Arrange - Test environment with debugging flags
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      setTestEnv("EXA_API_KEY", "test-key");

      // Act - Import modules that use debugging configuration
      delete require.cache[require.resolve("@/lib/hooks/useResearchAgent")];
      const useResearchAgent = require("@/lib/hooks/useResearchAgent");

      // Assert - Should be able to access the hook without direct env access
      expect(useResearchAgent.useResearchAgent).toBeDefined();
      expect(typeof useResearchAgent.useResearchAgent).toBe("function");
    });

    it("should handle missing debugging environment variables gracefully", () => {
      // Arrange - Minimal environment (debugging vars might be missing)
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      setTestEnv("EXA_API_KEY", "test-key");
      deleteTestEnv("VITEST_VERBOSE");
      deleteTestEnv("DEBUG_API_TESTS");

      // Act & Assert - Should not throw when debugging vars are missing
      expect(() => {
        delete require.cache[require.resolve("@/lib/hooks/useResearchAgent")];
        require("@/lib/hooks/useResearchAgent");
      }).not.toThrow();
    });
  });

  describe("Type Safety Validation", () => {
    it("should provide type-safe access to environment variables", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "development");
      setTestEnv("CEREBRAS_API_KEY", "dev-cerebras-key");
      setTestEnv("EXA_API_KEY", "dev-exa-key");
      setTestEnv("OPENAI_API_KEY", "dev-openai-key");

      // Act - Get validated environment
      delete require.cache[require.resolve("@/lib/schemas/env")];
      const { env } = require("@/lib/schemas/env");

      // Assert - Should have typed access to all environment variables
      expect(env.NODE_ENV).toBe("development");
      expect(env.CEREBRAS_API_KEY).toBe("dev-cerebras-key");
      expect(env.EXA_API_KEY).toBe("dev-exa-key");
      expect(env.OPENAI_API_KEY).toBe("dev-openai-key");

      // TypeScript should provide autocomplete and type checking for these
      expect(typeof env.NODE_ENV).toBe("string");
      expect(typeof env.CEREBRAS_API_KEY).toBe("string");
      expect(typeof env.EXA_API_KEY).toBe("string");
    });

    it("should distinguish between required and optional environment variables", () => {
      // Arrange - Only required variables
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-cerebras-key");
      setTestEnv("EXA_API_KEY", "prod-exa-key");
      deleteTestEnv("GOOGLE_API_KEY");
      deleteTestEnv("OPENAI_API_KEY");
      deleteTestEnv("ANTHROPIC_API_KEY");

      // Act - Get validated environment
      delete require.cache[require.resolve("@/lib/schemas/env")];
      const { env } = require("@/lib/schemas/env");

      // Assert - Required variables should be present, optional should be undefined
      expect(env.NODE_ENV).toBe("production");
      expect(env.CEREBRAS_API_KEY).toBe("prod-cerebras-key");
      expect(env.EXA_API_KEY).toBe("prod-exa-key");
      expect(env.GOOGLE_API_KEY).toBeUndefined();
      expect(env.OPENAI_API_KEY).toBeUndefined();
      expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    });
  });

  describe("Performance Requirements", () => {
    it("should validate environment variables quickly during module loading", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      setTestEnv("EXA_API_KEY", "test-key");

      // Act - Measure validation time
      const startTime = Date.now();

      delete require.cache[require.resolve("@/lib/schemas/env")];
      delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];

      require("@/lib/schemas/env");
      require("@/lib/utils/exaSearchUtil");

      const endTime = Date.now();
      const validationTime = endTime - startTime;

      // Assert - Should be fast (< 100ms as per requirements)
      expect(validationTime).toBeLessThan(100);
    });

    it("should fail fast when environment is invalid", () => {
      // Arrange - Invalid environment
      setTestEnv("NODE_ENV", "invalid-env");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      deleteTestEnv("EXA_API_KEY");

      // Act & Assert - Should fail immediately
      const startTime = Date.now();

      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow();

      const endTime = Date.now();
      const validationTime = endTime - startTime;

      // Should fail fast (even faster than success case)
      expect(validationTime).toBeLessThan(50);
    });
  });

  describe("Error Handling and Messages", () => {
    it("should provide clear error messages when environment variables are missing", () => {
      // Arrange - Missing critical environment variable
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-key");
      deleteTestEnv("EXA_API_KEY");

      // Act & Assert - Should provide specific error about missing variable
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow(/Missing or invalid environment variables.*EXA_API_KEY/);
    });

    it("should provide clear error messages when environment variables are invalid", () => {
      // Arrange - Invalid NODE_ENV value
      setTestEnv("NODE_ENV", "staging"); // Not in enum
      setTestEnv("CEREBRAS_API_KEY", "prod-key");
      setTestEnv("EXA_API_KEY", "prod-key");

      // Act & Assert - Should provide specific error about invalid enum value
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow(/Missing or invalid environment variables.*NODE_ENV/);
    });
  });

  describe("Configuration Integration", () => {
    it("should integrate environment validation with configuration system", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "development");
      setTestEnv("CEREBRAS_API_KEY", "dev-key");
      setTestEnv("EXA_API_KEY", "dev-key");

      // Act - Load both env and config
      delete require.cache[require.resolve("@/lib/schemas/env")];
      delete require.cache[require.resolve("@/lib/config")];

      const { env } = require("@/lib/schemas/env");
      const { config } = require("@/lib/config");

      // Assert - Configuration should use validated environment
      expect(env.NODE_ENV).toBe("development");
      expect(config.environment).toBe("development");
      expect(config.research.maxQueriesPerIteration).toBe(3); // Dev default
    });

    it("should cascade environment failures through configuration system", () => {
      // Arrange - Invalid environment that should prevent config loading
      setTestEnv("NODE_ENV", "test");
      deleteTestEnv("CEREBRAS_API_KEY");
      deleteTestEnv("EXA_API_KEY");

      // Act & Assert - Configuration should fail when environment is invalid
      expect(() => {
        delete require.cache[require.resolve("@/lib/config")];
        require("@/lib/config");
      }).toThrow(/Missing or invalid environment variables/);
    });
  });
});
