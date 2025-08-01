import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  captureTestEnv,
  deleteTestEnv,
  restoreTestEnv,
  setTestEnv,
} from "../test-env-utils";

/**
 * Tests for startup validation integration
 *
 * This test suite validates that environment validation is properly
 * integrated into the application startup process and fails fast
 * with clear error messages if required variables are missing.
 *
 * Note: We test the integration by importing the env module directly
 * rather than rendering components to avoid Next.js font import issues in tests.
 */
describe("Application Startup Validation Integration", () => {
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

  // Helper functions are now imported from test-env-utils

  describe("Environment Integration via Layout", () => {
    it("should validate environment when env module is imported (startup integration)", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act & Assert - Should not throw when importing env module
      expect(() => {
        // This simulates what happens in app/layout.tsx when env is imported
        delete require.cache[require.resolve("@/lib/schemas/env")];
        const { env } = require("@/lib/schemas/env");

        // Verify the env object is accessible (simulates accessing env in layout)
        expect(env).toBeDefined();
        expect(env.NODE_ENV).toBe("test");
        expect(env.CEREBRAS_API_KEY).toBe("test-cerebras-key");
        expect(env.EXA_API_KEY).toBe("test-exa-key");
      }).not.toThrow();
    });

    it("should fail fast when layout imports env with missing CEREBRAS_API_KEY", () => {
      // Arrange - Missing CEREBRAS_API_KEY (simulates startup failure)
      deleteTestEnv("CEREBRAS_API_KEY");
      setTestEnv("NODE_ENV", "test");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Act & Assert - Should throw when importing env module (simulates layout startup failure)
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow(/Missing or invalid environment variables.*CEREBRAS_API_KEY/);
    });

    it("should fail fast when layout imports env with missing EXA_API_KEY", () => {
      // Arrange - Missing EXA_API_KEY (simulates startup failure)
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("NODE_ENV", "test");
      deleteTestEnv("EXA_API_KEY");

      // Act & Assert - Should throw when importing env module (simulates layout startup failure)
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow(/Missing or invalid environment variables.*EXA_API_KEY/);
    });

    it("should fail fast when layout imports env with invalid NODE_ENV", () => {
      // Arrange - Invalid NODE_ENV (simulates startup failure)
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");
      setTestEnv("NODE_ENV", "invalid-env");

      // Act & Assert - Should throw when importing env module (simulates layout startup failure)
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
      }).toThrow(/Missing or invalid environment variables.*NODE_ENV/);
    });
  });

  describe("Performance Requirements", () => {
    it("should validate environment quickly during startup (performance requirement)", () => {
      // Arrange - Valid environment
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", "prod-cerebras-key");
      setTestEnv("EXA_API_KEY", "prod-exa-key");

      // Act - Measure validation time (simulates layout import time)
      const startTime = Date.now();

      delete require.cache[require.resolve("@/lib/schemas/env")];
      const { env } = require("@/lib/schemas/env");

      const endTime = Date.now();
      const validationTime = endTime - startTime;

      // Assert - Should be fast (< 100ms as per requirements)
      expect(validationTime).toBeLessThan(100);

      // Verify env is accessible
      expect(env.NODE_ENV).toBe("production");
    });

    it("should fail fast during startup with missing keys (performance requirement)", () => {
      // Arrange - Missing critical key (simulates production startup failure)
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

      // Should fail fast (even faster than success case)
      expect(validationTime).toBeLessThan(50);
    });
  });

  describe("Integration with BAML", () => {
    it("should provide validated env vars that BAML clients can use", () => {
      // Arrange - Valid environment including BAML-required keys
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");
      setTestEnv("OPENAI_API_KEY", "test-openai-key");
      setTestEnv("ANTHROPIC_API_KEY", "test-anthropic-key");

      // Act
      delete require.cache[require.resolve("@/lib/schemas/env")];
      const { env } = require("@/lib/schemas/env");

      // Assert - Validated env provides all keys that BAML clients need
      expect(env.CEREBRAS_API_KEY).toBe("test-cerebras-key");
      expect(env.EXA_API_KEY).toBe("test-exa-key");
      expect(env.OPENAI_API_KEY).toBe("test-openai-key");
      expect(env.ANTHROPIC_API_KEY).toBe("test-anthropic-key");

      // Verify these are strings (not undefined) for BAML client usage
      expect(typeof env.CEREBRAS_API_KEY).toBe("string");
      expect(typeof env.EXA_API_KEY).toBe("string");
      expect(typeof env.OPENAI_API_KEY).toBe("string");
      expect(typeof env.ANTHROPIC_API_KEY).toBe("string");
    });

    it("should handle optional BAML API keys gracefully", () => {
      // Arrange - Only required keys, optional keys missing
      setTestEnv("NODE_ENV", "test");
      setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
      setTestEnv("EXA_API_KEY", "test-exa-key");

      // Remove optional keys (should not cause startup failure)
      deleteTestEnv("GOOGLE_API_KEY");
      deleteTestEnv("OPENAI_API_KEY");
      deleteTestEnv("ANTHROPIC_API_KEY");

      // Act & Assert - Should not throw
      expect(() => {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        const { env } = require("@/lib/schemas/env");

        // Required keys should be present
        expect(env.CEREBRAS_API_KEY).toBe("test-cerebras-key");
        expect(env.EXA_API_KEY).toBe("test-exa-key");

        // Optional keys should be undefined (but access should not throw)
        expect(env.GOOGLE_API_KEY).toBeUndefined();
        expect(env.OPENAI_API_KEY).toBeUndefined();
        expect(env.ANTHROPIC_API_KEY).toBeUndefined();
      }).not.toThrow();
    });
  });
});
