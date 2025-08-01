import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  captureTestEnv,
  deleteTestEnv,
  restoreTestEnv,
  setTestEnv,
} from "../test-env-utils";

/**
 * Tests for configuration system
 *
 * This test suite validates the type-safe configuration system that replaces
 * magic numbers with environment-aware, configurable values throughout the application.
 * Following TDD approach - tests written first to define expected behavior.
 */
describe("Configuration System", () => {
  // Store original env for cleanup
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = captureTestEnv();
  });

  afterEach(() => {
    // Restore original environment
    restoreTestEnv(originalEnv);

    // Clear module cache to force re-evaluation of config
    const configModulePath = require.resolve("@/lib/config");
    delete require.cache[configModulePath];

    // Also clear env schema cache since config depends on it
    const envModulePath = require.resolve("@/lib/schemas/env");
    delete require.cache[envModulePath];
  });

  // Helper functions are now imported from test-env-utils

  describe("Research Parameters Configuration", () => {
    it("should provide default research parameters for development", () => {
      // Arrange - Development environment
      setTestEnv("NODE_ENV", "development");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert - Should have research parameters replacing magic numbers
      expect(config.research).toBeDefined();
      expect(config.research.maxQueriesPerIteration).toBe(3); // Replaces hardcoded value in orchestrator
      expect(config.research.maxDocumentsPerQuery).toBe(5); // More generous in dev
      expect(config.research.searchTimeoutMs).toBe(10000); // Faster feedback in dev
      expect(config.research.maxRetries).toBe(2);
      expect(config.research.analysisTimeoutMs).toBe(45000);
    });

    it("should provide optimized research parameters for test environment", () => {
      // Arrange - Test environment
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert - Should have test-optimized parameters
      expect(config.research.maxQueriesPerIteration).toBe(2); // Reduced for tests
      expect(config.research.maxDocumentsPerQuery).toBe(2); // Smaller test data
      expect(config.research.searchTimeoutMs).toBe(5000); // Faster tests
      expect(config.research.maxRetries).toBe(1); // Fewer retries in tests
      expect(config.research.analysisTimeoutMs).toBe(30000); // Shorter timeouts
    });

    it("should provide production-ready research parameters", () => {
      // Arrange - Production environment
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-cerebras-key");
      setTestEnv("EXA_API_KEY", "prod-exa-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert - Should have production defaults
      expect(config.research.maxQueriesPerIteration).toBe(3); // Standard production value
      expect(config.research.maxDocumentsPerQuery).toBe(5); // Standard production value
      expect(config.research.searchTimeoutMs).toBe(30000); // Standard timeout
      expect(config.research.maxRetries).toBe(2); // Production retries
      expect(config.research.analysisTimeoutMs).toBe(45000); // Production timeout
    });
  });

  describe("Feature Flags Configuration", () => {
    it("should provide environment-specific feature flags", () => {
      // Arrange - Development environment
      setTestEnv("NODE_ENV", "development");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert - Should have feature flags
      expect(config.features).toBeDefined();
      expect(config.features.enableDetailedLogging).toBe(true); // Enabled in dev
      expect(config.features.enableProgressIndicators).toBe(true);
      expect(typeof config.features.enableAdvancedRetry).toBe("boolean");
    });

    it("should disable verbose features in production", () => {
      // Arrange - Production environment
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-cerebras-key");
      setTestEnv("EXA_API_KEY", "prod-exa-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert - Should have production-appropriate flags
      expect(config.features.enableDetailedLogging).toBe(false); // Disabled in prod
      expect(config.features.enableProgressIndicators).toBe(true); // Still useful in prod
    });
  });

  describe("Configuration Schema Validation", () => {
    it("should validate research parameter types and constraints", () => {
      // Arrange - Development environment
      setTestEnv("NODE_ENV", "development");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert - All research parameters should be positive integers
      expect(Number.isInteger(config.research.maxQueriesPerIteration)).toBe(
        true
      );
      expect(config.research.maxQueriesPerIteration).toBeGreaterThan(0);

      expect(Number.isInteger(config.research.maxDocumentsPerQuery)).toBe(true);
      expect(config.research.maxDocumentsPerQuery).toBeGreaterThan(0);

      expect(Number.isInteger(config.research.searchTimeoutMs)).toBe(true);
      expect(config.research.searchTimeoutMs).toBeGreaterThan(0);

      expect(Number.isInteger(config.research.maxRetries)).toBe(true);
      expect(config.research.maxRetries).toBeGreaterThanOrEqual(0); // Can be 0
    });

    it("should provide type-safe configuration access", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert - Configuration should be fully typed
      expect(typeof config.research.maxQueriesPerIteration).toBe("number");
      expect(typeof config.research.maxDocumentsPerQuery).toBe("number");
      expect(typeof config.research.searchTimeoutMs).toBe("number");
      expect(typeof config.research.maxRetries).toBe("number");
      expect(typeof config.research.analysisTimeoutMs).toBe("number");

      expect(typeof config.features.enableDetailedLogging).toBe("boolean");
      expect(typeof config.features.enableProgressIndicators).toBe("boolean");

      expect(typeof config.environment).toBe("string");
      expect(["development", "test", "production"]).toContain(
        config.environment
      );
    });
  });

  describe("Magic Number Replacement", () => {
    it("should replace orchestrator magic numbers with configuration", () => {
      // Arrange - Test environment to verify specific values
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert - These values should replace the hardcoded values in orchestrator
      // Original: const MAX_QUERIES_TO_EXECUTE = 3; (line 111)
      expect(config.research.maxQueriesPerIteration).toBeDefined();

      // Original: const RESULTS_PER_QUERY = 2; (line 112)
      expect(config.research.maxDocumentsPerQuery).toBeDefined();

      // Should be different from production for testing
      expect(config.research.maxQueriesPerIteration).toBe(2); // Reduced for tests
      expect(config.research.maxDocumentsPerQuery).toBe(2); // Reduced for tests
    });

    it("should provide configuration that matches current orchestrator behavior in production", () => {
      // Arrange - Production environment
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-cerebras-key");
      setTestEnv("EXA_API_KEY", "prod-exa-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert - Should match current hardcoded values for backward compatibility
      expect(config.research.maxQueriesPerIteration).toBe(3); // Matches MAX_QUERIES_TO_EXECUTE
      expect(config.research.maxDocumentsPerQuery).toBe(5); // Slightly higher than current RESULTS_PER_QUERY
    });
  });

  describe("Environment-Specific Behavior", () => {
    it("should provide development timeout configuration", () => {
      // Arrange
      setTestEnv("NODE_ENV", "development");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      setTestEnv("EXA_API_KEY", "test-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert
      expect(config.research.searchTimeoutMs).toBe(10000);
      expect(config.environment).toBe("development");
    });

    it("should provide test timeout configuration", () => {
      // Arrange
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      setTestEnv("EXA_API_KEY", "test-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert
      expect(config.research.searchTimeoutMs).toBe(5000);
      expect(config.environment).toBe("test");
    });

    it("should provide production timeout configuration", () => {
      // Arrange
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      setTestEnv("EXA_API_KEY", "test-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert
      expect(config.research.searchTimeoutMs).toBe(30000);
      expect(config.environment).toBe("production");
    });

    it("should provide development retry configuration", () => {
      // Arrange
      setTestEnv("NODE_ENV", "development");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      setTestEnv("EXA_API_KEY", "test-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert
      expect(config.research.maxRetries).toBe(2);
    });

    it("should provide test retry configuration", () => {
      // Arrange
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      setTestEnv("EXA_API_KEY", "test-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert
      expect(config.research.maxRetries).toBe(1);
    });

    it("should provide production retry configuration", () => {
      // Arrange
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      setTestEnv("EXA_API_KEY", "test-key");

      // Act
      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      // Assert
      expect(config.research.maxRetries).toBe(2);
    });
  });

  describe("Performance Requirements", () => {
    it("should load configuration quickly (performance requirement)", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-key");
      setTestEnv("EXA_API_KEY", "prod-key");

      // Act - Measure config loading time
      const startTime = Date.now();

      delete require.cache[require.resolve("@/lib/config")];
      const { config } = require("@/lib/config");

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Assert - Should load quickly (< 50ms)
      expect(loadTime).toBeLessThan(50);
      expect(config).toBeDefined();
    });

    it("should have no impact on environment validation performance", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-key");
      setTestEnv("EXA_API_KEY", "test-key");

      // Act - Measure combined env + config loading time
      const startTime = Date.now();

      delete require.cache[require.resolve("@/lib/schemas/env")];
      delete require.cache[require.resolve("@/lib/config")];

      const { env } = require("@/lib/schemas/env");
      const { config } = require("@/lib/config");

      const endTime = Date.now();
      const totalLoadTime = endTime - startTime;

      // Assert - Combined loading should still be fast (< 100ms per requirements)
      expect(totalLoadTime).toBeLessThan(100);
      expect(env).toBeDefined();
      expect(config).toBeDefined();
    });
  });

  describe("Integration with Environment Validation", () => {
    it("should depend on validated environment variables", () => {
      // Arrange - Missing required env var should affect config
      setTestEnv("NODE_ENV", "test");
      deleteTestEnv("CEREBRAS_API_KEY"); // Ensure required key is missing
      deleteTestEnv("EXA_API_KEY"); // Ensure required key is missing

      // Act & Assert - Config should fail when env validation fails
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        delete require.cache[require.resolve("@/lib/config")];
        require("@/lib/config");
      }).toThrow(/Missing or invalid environment variables/);
    });

    it("should load successfully when environment is valid", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "development");
      setTestEnv("CEREBRAS_API_KEY", "dev-key");
      setTestEnv("EXA_API_KEY", "dev-key");

      // Act & Assert - Should load without errors
      expect(() => {
        delete require.cache[require.resolve("@/lib/config")];
        const { config } = require("@/lib/config");
        expect(config.environment).toBe("development");
      }).not.toThrow();
    });
  });
});
