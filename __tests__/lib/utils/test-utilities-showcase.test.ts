import { afterEach, describe, expect, it } from "vitest";
import { createCleanTestEnv, setMultipleTestEnv } from "../../test-env-utils";
import {
  createMockBamlClient,
  createMockSearchApi,
  markAsApiDependent,
} from "../../test-utils";
import {
  apiTestMatchers,
  createApiTestSuite,
  itBamlFunction,
  itE2eWithApi,
  withMockApiKeys,
} from "../../utils/api-test-helpers";

describe("Test Utilities Showcase", () => {
  describe("Environment Management Utilities", () => {
    let restoreEnv: (() => void) | null = null;

    afterEach(() => {
      if (restoreEnv) {
        restoreEnv();
        restoreEnv = null;
      }
    });

    it("should set multiple environment variables using setMultipleTestEnv", () => {
      const testVars = {
        TEST_VAR_1: "value1",
        TEST_VAR_2: "value2",
        TEST_VAR_3: "value3",
      };

      setMultipleTestEnv(testVars);

      expect(process.env.TEST_VAR_1).toBe("value1");
      expect(process.env.TEST_VAR_2).toBe("value2");
      expect(process.env.TEST_VAR_3).toBe("value3");
    });

    it("should create clean test environment using createCleanTestEnv", () => {
      // Set some initial values
      process.env.INITIAL_VAR = "initial";

      const cleanEnvVars = {
        CLEAN_VAR_1: "clean1",
        CLEAN_VAR_2: "clean2",
      };

      restoreEnv = createCleanTestEnv(cleanEnvVars);

      // Check that clean vars are set
      expect(process.env.CLEAN_VAR_1).toBe("clean1");
      expect(process.env.CLEAN_VAR_2).toBe("clean2");

      // Restore should work
      restoreEnv();
      expect(process.env.INITIAL_VAR).toBe("initial");
      restoreEnv = null;
    });
  });

  describe("Mock Creation Utilities", () => {
    it("should create mock BAML client with all required functions", () => {
      const mockClient = createMockBamlClient();

      expect(mockClient.GenerateLegalSearchQueries).toBeDefined();
      expect(mockClient.AnalyzeSingleDocument).toBeDefined();
      expect(mockClient.SynthesizeResearchFindings).toBeDefined();
      expect(mockClient.GenerateFinalLegalReport).toBeDefined();
      expect(mockClient.AssessResearchAndPlanNextSteps).toBeDefined();

      // Test that they're vi.fn() instances
      expect(typeof mockClient.GenerateLegalSearchQueries).toBe("function");
    });

    it("should create mock search API with expected interface", () => {
      const mockSearchApi = createMockSearchApi();

      expect(mockSearchApi.executeExaSearch).toBeDefined();
      expect(typeof mockSearchApi.executeExaSearch).toBe("function");

      // Test that it returns a promise (mocked)
      const result = mockSearchApi.executeExaSearch();
      expect(result).toBeInstanceOf(Promise);
    });

    it("should mark tests as API dependent", () => {
      const apiMeta = markAsApiDependent(["EXA_API_KEY", "OPENAI_API_KEY"]);

      expect(apiMeta.meta.requiresApiKeys).toEqual([
        "EXA_API_KEY",
        "OPENAI_API_KEY",
      ]);
      expect(apiMeta.meta.description).toContain("EXA_API_KEY");
      expect(apiMeta.meta.description).toContain("OPENAI_API_KEY");
    });
  });

  describe("API Test Helpers Integration", () => {
    it("should provide API test matchers", () => {
      const matchers = apiTestMatchers;

      // Check that available matchers exist
      expect(matchers).toHaveProperty("toBeSkippedDueToMissingApiKeys");

      // Check that it's a function
      expect(typeof matchers.toBeSkippedDueToMissingApiKeys).toBe("function");

      // Test the matcher functionality
      const matcherResult = matchers.toBeSkippedDueToMissingApiKeys(null, [
        "NONEXISTENT_KEY",
      ]);
      expect(matcherResult).toHaveProperty("pass");
      expect(matcherResult).toHaveProperty("message");
    });

    it("should create mock API keys wrapper", () => {
      let testRan = false;

      withMockApiKeys(
        {
          EXA_API_KEY: "mock-exa-key",
          OPENAI_API_KEY: "mock-openai-key",
        },
        () => {
          testRan = true;
          expect(process.env.EXA_API_KEY).toBe("mock-exa-key");
          expect(process.env.OPENAI_API_KEY).toBe("mock-openai-key");
        }
      );

      expect(testRan).toBe(true);
    });

    it("should create API test suite (side-effect function)", () => {
      // createApiTestSuite doesn't return anything, it creates describe blocks
      // We can test that it's callable without errors
      expect(() => {
        createApiTestSuite({
          suiteName: "Mock API Integration Test Suite",
          requiredKeys: ["EXA_API_KEY"],
          mockTests: [
            {
              name: "should mock test",
              fn: () => expect(true).toBe(true),
            },
          ],
          realApiTests: [
            {
              name: "should run real API test",
              fn: () => expect(true).toBe(true),
              timeout: 5000,
            },
          ],
        });
      }).not.toThrow();
    });
  });

  describe("Conditional Test Runners", () => {
    // Note: These test runners are designed to conditionally run tests
    // based on API key availability. For testing purposes, we'll verify
    // they can be called without errors.

    it.skip("should provide itBamlFunction for BAML-specific tests", () => {
      // This would normally run a BAML function test
      const testRunner = itBamlFunction(
        "GenerateLegalSearchQueries",
        ["OPENAI_API_KEY"],
        async () => {
          // Mock BAML test logic
          expect(true).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(testRunner).toBeDefined();
    });

    it.skip("should provide itE2eWithApi for E2E API tests", () => {
      // This would normally run an E2E test with API calls
      const testRunner = itE2eWithApi(
        "End-to-End Search Integration",
        ["EXA_API_KEY"],
        async () => {
          // Mock E2E test logic
          expect(true).toBe(true);
        },
        { timeout: 15000 }
      );

      expect(testRunner).toBeDefined();
    });
  });
});
