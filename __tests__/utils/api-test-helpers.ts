import { describe, it } from "vitest";

import {
  isCI,
  skipIfMissingApiKeys,
  skipInCiIfMissingApiKeys,
} from "../test-utils";

/**
 * Available API providers and their required environment variables
 */
export const API_KEYS = {
  GOOGLE_AI: ["GOOGLE_API_KEY"] as string[],
  OPENAI: ["OPENAI_API_KEY"] as string[],
  ANTHROPIC: ["ANTHROPIC_API_KEY"] as string[],
  XAI: ["XAI_API_KEY"] as string[],
  GROQ: ["GROQ_API_KEY"] as string[],
  EXA_SEARCH: ["EXA_API_KEY"] as string[],
  TAVILY_SEARCH: ["TAVILY_API_KEY"] as string[],
  LINKUP_SEARCH: ["LINKUP_API_KEY"] as string[],
  ALL_LLM: [
    "GOOGLE_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
  ] as string[],
  ALL_SEARCH: ["EXA_API_KEY", "TAVILY_API_KEY", "LINKUP_API_KEY"] as string[],
};

/**
 * Test runner that conditionally skips based on API key availability
 * @param testName - Name of the test
 * @param requiredApiKeys - Array of required API key environment variable names
 * @param testFn - Test function to run if keys are available
 * @param options - Configuration options
 */
export const itWithApiKeys = (
  testName: string,
  requiredApiKeys: string[],
  testFn: () => void | Promise<void>,
  options: {
    skipInCI?: boolean;
    timeout?: number;
    only?: boolean;
    skip?: boolean;
  } = {}
) => {
  const { skipInCI = false, timeout, only = false, skip = false } = options;

  const shouldSkip =
    skip ||
    (skipInCI
      ? !skipInCiIfMissingApiKeys(requiredApiKeys, testName)
      : !skipIfMissingApiKeys(requiredApiKeys, testName));

  const testRunner = only ? it.only : shouldSkip ? it.skip : it;

  const titleWithRequirements = `${testName} [requires: ${requiredApiKeys.join(", ")}]`;

  return testRunner(titleWithRequirements, testFn, timeout);
};

/**
 * Describe block that conditionally skips based on API key availability
 * @param suiteName - Name of the test suite
 * @param requiredApiKeys - Array of required API key environment variable names
 * @param suiteFn - Test suite function to run if keys are available
 * @param options - Configuration options
 */
export const describeWithApiKeys = (
  suiteName: string,
  requiredApiKeys: string[],
  suiteFn: () => void,
  options: {
    skipInCI?: boolean;
    only?: boolean;
    skip?: boolean;
  } = {}
) => {
  const { skipInCI = false, only = false, skip = false } = options;

  const shouldSkip =
    skip ||
    (skipInCI
      ? !skipInCiIfMissingApiKeys(requiredApiKeys, suiteName)
      : !skipIfMissingApiKeys(requiredApiKeys, suiteName));

  const describeRunner = only
    ? describe.only
    : shouldSkip
      ? describe.skip
      : describe;

  const titleWithRequirements = `${suiteName} [requires: ${requiredApiKeys.join(", ")}]`;

  return describeRunner(titleWithRequirements, suiteFn);
};

/**
 * Test runner specifically for BAML function tests
 * @param functionName - BAML function name
 * @param requiredApiKeys - Array of required API key environment variable names
 * @param testFn - Test function to run if keys are available
 * @param options - Configuration options
 */
export const itBamlFunction = (
  functionName: string,
  requiredApiKeys: string[],
  testFn: () => void | Promise<void>,
  options: {
    skipInCI?: boolean;
    timeout?: number;
  } = {}
) => {
  const testTitle = `BAML function ${functionName}`;

  return itWithApiKeys(testTitle, requiredApiKeys, testFn, {
    skipInCI: true, // Default to skipping BAML tests in CI
    timeout: 30000, // Default 30s timeout for BAML tests
    ...options,
  });
};

/**
 * Test runner specifically for E2E tests requiring API calls
 * @param testName - Name of the E2E test
 * @param requiredApiKeys - Array of required API key environment variable names
 * @param testFn - Test function to run if keys are available
 * @param options - Configuration options
 */
export const itE2eWithApi = (
  testName: string,
  requiredApiKeys: string[],
  testFn: () => void | Promise<void>,
  options: {
    skipInCI?: boolean;
    timeout?: number;
  } = {}
) => {
  const e2eTestTitle = `E2E: ${testName}`;

  return itWithApiKeys(e2eTestTitle, requiredApiKeys, testFn, {
    skipInCI: false, // E2E tests should run in CI if keys are available
    timeout: 60000, // Default 60s timeout for E2E tests
    ...options,
  });
};

/**
 * Utility to log API key availability status
 * Useful for debugging test skipping behavior
 */
export const logApiKeyStatus = (
  keys: string[] = Object.values(API_KEYS).flat()
) => {
  console.log("=== API Key Status ===");
  console.log(`CI Environment: ${isCI()}`);

  const uniqueKeys = [...new Set(keys)];
  for (const key of uniqueKeys) {
    const value = process.env[key];
    const hasKey =
      value &&
      value.trim() !== "" &&
      !value.includes("[YOUR_") &&
      !value.includes("****");
    const status = hasKey ? "✅ Available" : "❌ Missing/Invalid";
    console.log(`${key}: ${status}`);
  }
  console.log("====================");
};

/**
 * Custom matchers for API-dependent tests
 */
export const apiTestMatchers = {
  /**
   * Assert that a test was skipped due to missing API keys
   */
  toBeSkippedDueToMissingApiKeys: (
    _received: unknown,
    expectedKeys: string[]
  ) => {
    const hasKeys = expectedKeys.every((key) => {
      const value = process.env[key];
      return (
        value &&
        value.trim() !== "" &&
        !value.includes("[YOUR_") &&
        !value.includes("****")
      );
    });

    return {
      pass: !hasKeys,
      message: () =>
        hasKeys
          ? `Expected test to be skipped due to missing API keys, but all keys are available: ${expectedKeys.join(", ")}`
          : `Test correctly skipped due to missing API keys: ${expectedKeys.join(", ")}`,
    };
  },
};

/**
 * Mock environment for testing API key validation logic
 */
export const withMockApiKeys = (
  mockKeys: Record<string, string>,
  testFn: () => void
) => {
  const originalEnv = { ...process.env };

  // Set mock keys
  for (const [key, value] of Object.entries(mockKeys)) {
    process.env[key] = value;
  }

  try {
    testFn();
  } finally {
    // Restore original environment
    process.env = originalEnv;
  }
};

/**
 * Common test patterns for API-dependent functionality
 */
export const createApiTestSuite = (config: {
  suiteName: string;
  requiredKeys: string[];
  mockTests: Array<{
    name: string;
    fn: () => void | Promise<void>;
  }>;
  realApiTests: Array<{
    name: string;
    fn: () => void | Promise<void>;
    timeout?: number;
  }>;
}) => {
  const { suiteName, requiredKeys, mockTests, realApiTests } = config;

  const mockedSuiteTitle = `${suiteName} (Mocked)`;
  const realApiSuiteTitle = `${suiteName} (Real API)`;

  describe(mockedSuiteTitle, () => {
    for (const test of mockTests) {
      it(test.name, test.fn);
    }
  });

  describeWithApiKeys(realApiSuiteTitle, requiredKeys, () => {
    for (const test of realApiTests) {
      itWithApiKeys(test.name, requiredKeys, test.fn, {
        skipInCI: true,
        timeout: test.timeout || 30000,
      });
    }
  });
};
