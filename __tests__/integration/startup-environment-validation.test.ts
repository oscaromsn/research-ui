/**
 * @file Startup Environment Validation Integration Tests
 *
 * Tests that verify environment validation happens at server startup (via next.config.ts)
 * rather than at runtime. This ensures fail-fast behavior for missing or invalid
 * environment variables.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  captureTestEnv,
  deleteTestEnv,
  restoreTestEnv,
  setTestEnv,
} from "../test-env-utils";

describe("Startup Environment Validation Integration", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = captureTestEnv();
  });

  afterEach(() => {
    // Restore original environment
    restoreTestEnv(originalEnv);

    // Clear module cache to force re-evaluation
    const modulesToClear = [
      "@/lib/schemas/env",
      require.resolve("@/lib/schemas/env"),
    ];

    // Use for...of instead of forEach for better performance
    for (const modulePath of modulesToClear) {
      try {
        delete require.cache[modulePath];
      } catch (_e) {
        // Module might not exist, ignore
      }
    }
  });

  it("should validate environment at module import time (as used in next.config.ts)", () => {
    // Arrange - Set up invalid environment (missing EXA_API_KEY)
    setTestEnv("NODE_ENV", "development");
    setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
    deleteTestEnv("EXA_API_KEY");

    // Act & Assert - Should throw when importing the env module
    expect(() => {
      delete require.cache[require.resolve("@/lib/schemas/env")];
      require("@/lib/schemas/env");
    }).toThrow(/Missing or invalid environment variables.*EXA_API_KEY/);
  });

  it("should validate environment at module import time for CEREBRAS_API_KEY", () => {
    // Arrange - Set up invalid environment (missing CEREBRAS_API_KEY)
    setTestEnv("NODE_ENV", "production");
    setTestEnv("EXA_API_KEY", "test-exa-key");
    deleteTestEnv("CEREBRAS_API_KEY");

    // Act & Assert - Should throw when importing the env module
    expect(() => {
      delete require.cache[require.resolve("@/lib/schemas/env")];
      require("@/lib/schemas/env");
    }).toThrow(/Missing or invalid environment variables.*CEREBRAS_API_KEY/);
  });

  it("should successfully validate when all required environment variables are present", () => {
    // Arrange - Set up valid environment
    setTestEnv("NODE_ENV", "development");
    setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
    setTestEnv("EXA_API_KEY", "test-exa-key");

    // Act & Assert - Should not throw when importing the env module
    expect(() => {
      delete require.cache[require.resolve("@/lib/schemas/env")];
      const { env } = require("@/lib/schemas/env");

      // Verify the environment is properly validated and accessible
      expect(env.NODE_ENV).toBe("development");
      expect(env.CEREBRAS_API_KEY).toBe("test-cerebras-key");
      expect(env.EXA_API_KEY).toBe("test-exa-key");
    }).not.toThrow();
  });

  it("should fail fast for invalid NODE_ENV values", () => {
    // Arrange - Set up invalid NODE_ENV
    setTestEnv("NODE_ENV", "invalid-environment");
    setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
    setTestEnv("EXA_API_KEY", "test-exa-key");

    // Act & Assert - Should throw for invalid enum value
    expect(() => {
      delete require.cache[require.resolve("@/lib/schemas/env")];
      require("@/lib/schemas/env");
    }).toThrow(/Missing or invalid environment variables.*NODE_ENV/);
  });

  it("should provide type-safe access to validated environment variables", () => {
    // Arrange - Set up valid environment
    setTestEnv("NODE_ENV", "test");
    setTestEnv("CEREBRAS_API_KEY", "test-cerebras-key");
    setTestEnv("EXA_API_KEY", "test-exa-key");
    setTestEnv("OPENAI_API_KEY", "test-openai-key"); // Optional

    // Act
    delete require.cache[require.resolve("@/lib/schemas/env")];
    const { env } = require("@/lib/schemas/env");

    // Assert - Should provide type-safe access to all validated environment variables
    expect(env.NODE_ENV).toBe("test");
    expect(env.CEREBRAS_API_KEY).toBe("test-cerebras-key");
    expect(env.EXA_API_KEY).toBe("test-exa-key");
    expect(env.OPENAI_API_KEY).toBe("test-openai-key");
    // Optional environment variables may or may not be set
    expect(
      env.GOOGLE_API_KEY === undefined || typeof env.GOOGLE_API_KEY === "string"
    ).toBe(true);
    expect(
      env.ANTHROPIC_API_KEY === undefined ||
        typeof env.ANTHROPIC_API_KEY === "string"
    ).toBe(true);
  });
});
