/**
 * Example test file demonstrating proper handling of API-dependent tests
 * This file shows how to structure tests that require external API keys
 * and how they should be conditionally skipped in CI environments
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import { 
  itWithApiKeys, 
  describeWithApiKeys, 
  itBamlFunction, 
  itE2eWithApi,
  API_KEYS,
  logApiKeyStatus,
  createApiTestSuite 
} from "../utils/api-test-helpers";
import { skipIfMissingApiKeys, hasRequiredApiKeys } from "../test-utils";

// Example: Basic BAML function test that requires Google AI API
describeWithApiKeys("BAML Function Tests", API_KEYS.GOOGLE_AI, () => {
  beforeAll(() => {
    // Optional: Log API key status for debugging
    if (process.env.DEBUG_API_TESTS === "true") {
      logApiKeyStatus(API_KEYS.GOOGLE_AI);
    }
  });

  itBamlFunction("GenerateLegalSearchQueries", API_KEYS.GOOGLE_AI, async () => {
    // This test will only run if GOOGLE_API_KEY is available
    // In CI, it will be skipped unless the key is present
    
    const { b } = await import("@/baml_client");
    
    const result = await b.GenerateLegalSearchQueries(
      "What is the statute of limitations for breach of contract in California?"
    );
    
    expect(result.search_queries).toBeDefined();
    expect(result.search_queries.length).toBeGreaterThan(0);
    expect(result.reasoning).toBeDefined();
  }, { timeout: 30000 });

  itBamlFunction("AnalyzeSingleDocument", API_KEYS.GOOGLE_AI, async () => {
    const { b } = await import("@/baml_client");
    
    const mockDocument = {
      id: "test-doc",
      url: "https://example.com/test",
      title: "Test Document",
      source_name: "Test Source",
      snippet: "Test snippet",
      full_text: "This is a test document about contract law...",
      published_date: "2023-01-01",
      retrieval_date: new Date().toISOString(),
      author: "Test Author",
      score: 0.9,
      metadata: {},
      original_query: {
        query_string: "contract law",
        expected_information: ["contract definition"],
      },
    };

    const result = await b.AnalyzeSingleDocument(
      mockDocument,
      "What is the statute of limitations for breach of contract?"
    );

    expect(result.relevance_score).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.key_arguments_and_reasoning).toBeDefined();
  }, { timeout: 30000 });
});

// Example: Search API tests
describeWithApiKeys("External Search API Tests", API_KEYS.EXA_SEARCH, () => {
  itWithApiKeys("executeExaSearch", API_KEYS.EXA_SEARCH, async () => {
    const { executeExaSearch } = await import("@/lib/utils/exaSearchUtil");
    
    const query = {
      query_string: "California contract law statute of limitations",
      expected_information: ["time limits", "contract types"],
    };

    const results = await executeExaSearch(query);
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    // Add more specific assertions based on expected response structure
  }, { 
    skipInCI: true, // Skip in CI unless explicitly enabled
    timeout: 20000 
  });
});

// Example: E2E test requiring multiple APIs
describeWithApiKeys("End-to-End Research Pipeline", 
  [...API_KEYS.GOOGLE_AI, ...API_KEYS.EXA_SEARCH], 
  () => {
    itE2eWithApi("Complete research workflow", 
      [...API_KEYS.GOOGLE_AI, ...API_KEYS.EXA_SEARCH], 
      async () => {
        // This test requires both Google AI and Exa Search APIs
        const { conductResearch } = await import("@/app/actions/researchAgentOrchestrator");
        
        const stream = await conductResearch(
          "What are the requirements for adverse possession in Texas?"
        );
        
        // Process stream and verify complete workflow
        const reader = stream.getReader();
        const updates = [];
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split("\n").filter(line => line.trim());
            
            for (const line of lines) {
              try {
                updates.push(JSON.parse(line));
              } catch {
                // Ignore parsing errors in test
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        
        expect(updates.length).toBeGreaterThan(0);
        expect(updates.some(u => u.stage === "COMPLETED")).toBe(true);
      }, 
      { 
        skipInCI: false, // Run in CI if keys are available
        timeout: 120000 // 2 minutes for full E2E test
      }
    );
  }
);

// Example: Using the createApiTestSuite helper
createApiTestSuite({
  suiteName: "Legal Document Analysis",
  requiredKeys: API_KEYS.GOOGLE_AI,
  mockTests: [
    {
      name: "should handle mock document analysis",
      fn: async () => {
        // Mock test that always runs
        const mockAnalysis = {
          relevance_score: 8,
          summary: "Mock analysis",
          key_arguments_and_reasoning: ["Mock argument"],
        };
        
        expect(mockAnalysis.relevance_score).toBeGreaterThan(0);
        expect(mockAnalysis.summary).toBeDefined();
      },
    },
    {
      name: "should validate input parameters",
      fn: () => {
        // Mock validation test
        const invalidInput = "";
        expect(invalidInput.length).toBe(0);
      },
    },
  ],
  realApiTests: [
    {
      name: "should analyze real legal document",
      fn: async () => {
        // Real API test that only runs if keys are available
        const { b } = await import("@/baml_client");
        
        const mockDoc = {
          id: "real-test",
          full_text: "Real legal document content for testing...",
          // ... other required fields
        };
        
        const result = await b.AnalyzeSingleDocument(
          mockDoc as any,
          "Test legal question"
        );
        
        expect(result).toBeDefined();
      },
      timeout: 45000,
    },
  ],
});

// Example: Manual test skipping with custom logic
describe("Custom API Key Handling", () => {
  it("should skip when API keys are missing", () => {
    const testName = "Custom test requiring API keys";
    const requiredKeys = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"];
    
    // Skip condition that checks the actual test environment
    if (!skipIfMissingApiKeys(requiredKeys, testName)) {
      // This will be skipped if keys are missing
      return;
    }
    
    // Test logic that only runs when keys are available
    expect(hasRequiredApiKeys(requiredKeys)).toBe(true);
  });

  it("should validate API key checking utility", () => {
    // Test the utility functions themselves (always runs)
    expect(hasRequiredApiKeys(["DEFINITELY_MISSING_KEY"])).toBe(false);
    expect(hasRequiredApiKeys([])).toBe(true); // Empty array should return true
  });
});

// Example: Conditional test setup based on environment
describe("Environment-Specific Tests", () => {
  const isLocalDevelopment = !process.env.CI && process.env.NODE_ENV !== "production";
  
  it.skipIf(!isLocalDevelopment)("should run additional checks in local development", () => {
    // This test only runs in local development environment
    expect(process.env.NODE_ENV).not.toBe("production");
  });

  it.skipIf(isLocalDevelopment)("should have minimal logging in CI", () => {
    // This test only runs in CI environment
    expect(process.env.CI).toBeTruthy();
  });
});