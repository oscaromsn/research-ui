import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  captureTestEnv,
  deleteTestEnv,
  restoreTestEnv,
  setTestEnv,
} from "../../test-env-utils";

/**
 * Tests for environment variable validation system
 *
 * This test suite validates the type-safe environment variable system
 * that replaces ad-hoc process.env usage throughout the application.
 * Following TDD approach - tests written first to define expected behavior.
 */
describe("Environment Validation", () => {
  // Store original env for cleanup
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = captureTestEnv();
  });

  afterEach(() => {
    // Restore original environment
    restoreTestEnv(originalEnv);

    // Clear module cache to force re-evaluation of env schema
    const envModulePath = require.resolve("@/lib/schemas/env");
    delete require.cache[envModulePath];
  });

  describe("Required API Keys Validation", () => {
    it("should fail with clear message when CEREBRAS_API_KEY is missing", async () => {
      // Arrange - Remove CEREBRAS_API_KEY
      deleteTestEnv("CEREBRAS_API_KEY");
      setTestEnv("NODE_ENV", "test");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act & Assert
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow(/Missing or invalid.*environment variables.*CEREBRAS_API_KEY/);
    });

    it("should fail with clear message when EXA_API_KEY is missing", async () => {
      // Arrange - Remove EXA_API_KEY
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("NODE_ENV", "test");
      deleteTestEnv("EXA_API_KEY");

      // Act & Assert
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow(/Missing or invalid.*environment variables.*EXA_API_KEY/);
    });

    it("should fail with clear message when NODE_ENV is invalid", async () => {
      // Arrange - Invalid NODE_ENV
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");
      setTestEnv("NODE_ENV", "invalid-env");

      // Act & Assert
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow(/NODE_ENV/);
    });

    it("should list all missing required environment variables", async () => {
      // Arrange - Remove all required keys
      deleteTestEnv("CEREBRAS_API_KEY");
      deleteTestEnv("EXA_API_KEY");
      deleteTestEnv("NODE_ENV");

      // Act & Assert
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow(/Missing or invalid.*environment variables/);
    });
  });

  describe("Valid Environment Configuration", () => {
    it("should pass with all required environment variables", async () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act & Assert - Should not throw
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        const envModule = require("@/lib/schemas/env");
        expect(envModule.env).toBeDefined();
      }).not.toThrow();
    });

    it("should pass with required and optional environment variables", async () => {
      // Arrange - Valid environment with optional keys
      setTestEnv("NODE_ENV", "development");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");
      setTestEnv("GOOGLE_API_KEY", "test-google-key");
      setTestEnv("OPENAI_API_KEY", "test-openai-key");
      setTestEnv("ANTHROPIC_API_KEY", "test-anthropic-key");

      // Act & Assert - Should not throw
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        const envModule = require("@/lib/schemas/env");
        expect(envModule.env).toBeDefined();
      }).not.toThrow();
    });

    it("should work with different NODE_ENV values", async () => {
      const validEnvs = ["development", "test", "production"];

      for (const nodeEnv of validEnvs) {
        // Arrange
        setTestEnv("NODE_ENV", nodeEnv);
        setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
        setTestEnv("EXA_API_KEY", "test-exa-key");

        // Act & Assert
        expect(() => {
          delete require.cache[require.resolve("@/lib/schemas/env")];
          const envModule = require("@/lib/schemas/env");
          expect(envModule.env.NODE_ENV).toBe(nodeEnv);
        }).not.toThrow();
      }
    });
  });

  describe("Optional Keys Handling", () => {
    it("should handle missing optional keys gracefully", async () => {
      // Arrange - Only required keys
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Remove optional keys
      deleteTestEnv("GOOGLE_API_KEY");
      deleteTestEnv("OPENAI_API_KEY");
      deleteTestEnv("ANTHROPIC_API_KEY");

      // Act & Assert - Should not throw
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        const envModule = require("@/lib/schemas/env");
        expect(envModule.env).toBeDefined();
      }).not.toThrow();
    });

    it("should include optional keys when present", async () => {
      // Arrange - All keys present
      setTestEnv("NODE_ENV", "development");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");
      setTestEnv("GOOGLE_API_KEY", "test-google-key");

      // Act
      delete require.cache[require.resolve("@/lib/schemas/env")];
      const envModule = require("@/lib/schemas/env");

      // Assert
      expect(envModule.env.GOOGLE_API_KEY).toBe("test-google-key");
    });
  });

  describe("Type Safety", () => {
    it("should provide typed access to environment variables", async () => {
      // Arrange
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act
      delete require.cache[require.resolve("@/lib/schemas/env")];
      const envModule = require("@/lib/schemas/env");

      // Assert - TypeScript should infer correct types
      expect(typeof envModule.env.NODE_ENV).toBe("string");
      expect(typeof envModule.env.CEREBRAS_API_KEY).toBe("string");
      expect(typeof envModule.env.EXA_API_KEY).toBe("string");

      // NODE_ENV should be one of the enum values
      expect(["development", "test", "production"]).toContain(
        envModule.env.NODE_ENV
      );
    });
  });

  describe("Error Message Quality", () => {
    it("should provide actionable error messages for developers", async () => {
      // Arrange - Missing API key
      deleteTestEnv("CEREBRAS_API_KEY");
      setTestEnv("NODE_ENV", "test");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act & Assert
      let thrownError: Error | null = null;
      try {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      } catch (error) {
        thrownError = error instanceof Error ? error : new Error(String(error));
      }

      expect(thrownError).not.toBeNull();
      if (thrownError) {
        // Error message should be clear and actionable
        expect(thrownError.message).toMatch(
          /Missing or invalid.*environment variables/
        );
        expect(thrownError.message).toMatch(/CEREBRAS_API_KEY/);
      }
    });

    it("should have consistent error message format", async () => {
      // Arrange - Multiple missing keys
      deleteTestEnv("CEREBRAS_API_KEY");
      deleteTestEnv("EXA_API_KEY");
      setTestEnv("NODE_ENV", "test");

      // Act & Assert
      let thrownError: Error | null = null;
      try {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      } catch (error) {
        thrownError = error instanceof Error ? error : new Error(String(error));
      }

      expect(thrownError).not.toBeNull();
      if (thrownError) {
        // Should list both missing keys
        expect(thrownError.message).toMatch(/CEREBRAS_API_KEY/);
        expect(thrownError.message).toMatch(/EXA_API_KEY/);
      }
    });
  });

  describe("Production Readiness", () => {
    it("should validate startup quickly (performance requirement)", async () => {
      // Arrange
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-cerebras-key");
      setTestEnv("EXA_API_KEY", "prod-exa-key");

      // Act - Measure validation time
      const startTime = Date.now();

      delete require.cache[require.resolve("@/lib/schemas/env")];
      require("@/lib/schemas/env");

      const endTime = Date.now();
      const validationTime = endTime - startTime;

      // Assert - Should be fast (< 100ms as per requirements)
      expect(validationTime).toBeLessThan(100);
    });

    it("should fail fast on startup with missing keys", async () => {
      // Arrange - Missing critical key
      deleteTestEnv("CEREBRAS_API_KEY");
      setTestEnv("NODE_ENV", "production");
      setTestEnv("EXA_API_KEY", "prod-exa-key");

      // Act & Assert - Should fail immediately
      const startTime = Date.now();

      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow();

      const endTime = Date.now();
      const validationTime = endTime - startTime;

      // Should fail fast
      expect(validationTime).toBeLessThan(50);
    });
  });
});
