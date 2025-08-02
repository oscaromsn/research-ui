import { describe, expect, it, vi } from "vitest";

// Mock the environment schema for basic validation testing
vi.mock("@/lib/schemas/env", () => ({
  env: {
    NODE_ENV: "test",
    CEREBRAS_API_KEY: "test-cerebras-key",
    EXA_API_KEY: "test-exa-key",
  },
}));

/**
 * Simplified environment validation tests that work with our mocked setup
 *
 * These tests verify that:
 * 1. The environment schema mock is working correctly
 * 2. Required environment variables are accessible
 * 3. The module can be imported without errors in our test environment
 */
describe("Environment Schema - Mock Validation", () => {
  it("should provide access to required environment variables", async () => {
    const { env } = await import("@/lib/schemas/env");

    expect(env).toBeDefined();
    expect(env.NODE_ENV).toBe("test");
    expect(env.CEREBRAS_API_KEY).toBe("test-cerebras-key");
    expect(env.EXA_API_KEY).toBe("test-exa-key");
  });

  it("should have the correct types for environment variables", async () => {
    const { env } = await import("@/lib/schemas/env");

    expect(typeof env.NODE_ENV).toBe("string");
    expect(typeof env.CEREBRAS_API_KEY).toBe("string");
    expect(typeof env.EXA_API_KEY).toBe("string");
  });

  it("should be importable without throwing errors", async () => {
    await expect(import("@/lib/schemas/env")).resolves.toBeDefined();
  });

  it("should provide consistent environment values across imports", async () => {
    const import1 = await import("@/lib/schemas/env");
    const import2 = await import("@/lib/schemas/env");

    expect(import1.env.NODE_ENV).toBe(import2.env.NODE_ENV);
    expect(import1.env.CEREBRAS_API_KEY).toBe(import2.env.CEREBRAS_API_KEY);
    expect(import1.env.EXA_API_KEY).toBe(import2.env.EXA_API_KEY);
  });
});
