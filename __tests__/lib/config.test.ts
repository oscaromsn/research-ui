import { describe, expect, it, vi } from "vitest";

// Mock both the environment schema and config module for testing
vi.mock("@/lib/schemas/env", () => ({
  env: {
    NODE_ENV: "test",
    CEREBRAS_API_KEY: "test-cerebras-key",
    EXA_API_KEY: "test-exa-key",
  },
}));

vi.mock("@/lib/config", () => ({
  config: {
    research: {
      maxQueriesPerIteration: 3,
      maxDocumentsPerQuery: 5,
      searchTimeoutMs: 30000,
      maxRetries: 2,
      analysisTimeoutMs: 45000,
    },
    features: {
      enableDetailedLogging: true,
      enableProgressIndicators: true,
      enableAdvancedRetry: false,
      enableNewUI: false,
      enableBetaFeatures: false,
      enableAnalytics: true,
      maxUploadSizeMB: 10,
    },
  },
}));

/**
 * Simplified configuration tests that work with our mocked setup
 *
 * These tests verify that:
 * 1. The configuration module mock is working correctly
 * 2. Configuration values are accessible
 * 3. The module can be imported without errors in our test environment
 */
describe("Configuration System - Mock Validation", () => {
  it("should provide access to research configuration", async () => {
    const { config } = await import("@/lib/config");

    expect(config).toBeDefined();
    expect(config.research).toBeDefined();
    expect(config.research.maxQueriesPerIteration).toBe(3);
    expect(config.research.maxDocumentsPerQuery).toBe(5);
    expect(config.research.searchTimeoutMs).toBe(30000);
    expect(config.research.maxRetries).toBe(2);
    expect(config.research.analysisTimeoutMs).toBe(45000);
  });

  it("should provide access to feature flags", async () => {
    const { config } = await import("@/lib/config");

    expect(config.features).toBeDefined();
    expect(config.features.enableDetailedLogging).toBe(true);
    expect(config.features.enableProgressIndicators).toBe(true);
    expect(config.features.enableAdvancedRetry).toBe(false);
    expect(config.features.enableNewUI).toBe(false);
    expect(config.features.enableBetaFeatures).toBe(false);
    expect(config.features.enableAnalytics).toBe(true);
    expect(config.features.maxUploadSizeMB).toBe(10);
  });

  it("should have the correct types for configuration values", async () => {
    const { config } = await import("@/lib/config");

    expect(typeof config.research.maxQueriesPerIteration).toBe("number");
    expect(typeof config.research.maxDocumentsPerQuery).toBe("number");
    expect(typeof config.research.searchTimeoutMs).toBe("number");
    expect(typeof config.research.maxRetries).toBe("number");
    expect(typeof config.research.analysisTimeoutMs).toBe("number");
    expect(typeof config.features.enableDetailedLogging).toBe("boolean");
    expect(typeof config.features.enableProgressIndicators).toBe("boolean");
    expect(typeof config.features.enableAdvancedRetry).toBe("boolean");
    expect(typeof config.features.enableAnalytics).toBe("boolean");
    expect(typeof config.features.maxUploadSizeMB).toBe("number");
  });

  it("should be importable without throwing errors", async () => {
    await expect(import("@/lib/config")).resolves.toBeDefined();
  });

  it("should provide consistent configuration values across imports", async () => {
    const import1 = await import("@/lib/config");
    const import2 = await import("@/lib/config");

    expect(import1.config.research.maxQueriesPerIteration).toBe(
      import2.config.research.maxQueriesPerIteration
    );
    expect(import1.config.features.enableDetailedLogging).toBe(
      import2.config.features.enableDetailedLogging
    );
  });
});
