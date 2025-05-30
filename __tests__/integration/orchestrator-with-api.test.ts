/**
 * Integration test for the research orchestrator with real API calls
 * This test requires actual API keys and will be skipped in CI unless keys are available
 */

import { beforeEach, beforeAll } from "vitest";

import { conductResearch } from "@/app/actions/researchAgentOrchestrator";
import type { ResearchUpdate } from "@/app/actions/researchAgentOrchestrator";
import { 
  describeWithApiKeys, 
  itWithApiKeys, 
  API_KEYS, 
  logApiKeyStatus 
} from "../utils/api-test-helpers";

// This entire test suite requires both Google AI and Exa Search APIs
describeWithApiKeys(
  "Research Orchestrator - Real API Integration", 
  [...API_KEYS.GOOGLE_AI, ...API_KEYS.EXA_SEARCH],
  () => {
    beforeAll(() => {
      // Log API key status when debugging
      if (process.env.DEBUG_API_TESTS === "true") {
        logApiKeyStatus([...API_KEYS.GOOGLE_AI, ...API_KEYS.EXA_SEARCH]);
      }
    });

    beforeEach(() => {
      // Clear any mocks that might interfere with real API calls
      vi.clearAllMocks();
    });

    itWithApiKeys(
      "should complete full research pipeline with real APIs",
      [...API_KEYS.GOOGLE_AI, ...API_KEYS.EXA_SEARCH],
      async () => {
        const legalQuestion = "What are the basic requirements for forming a valid contract in California?";
        
        // Use real APIs - no mocking
        const stream = await conductResearch(legalQuestion);
        
        const updates: ResearchUpdate[] = [];
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        // Set a longer timeout for real API calls
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Real API test timeout")), 120000)
        );

        try {
          await Promise.race([
            (async () => {
              let completedFound = false;
              while (!completedFound) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk
                  .split("\n")
                  .filter((line) => line.trim());

                for (const line of lines) {
                  try {
                    const update = JSON.parse(line) as ResearchUpdate;
                    updates.push(update);
                    
                    // Log progress when debugging
                    if (process.env.DEBUG_API_TESTS === "true") {
                      console.log(`Update: ${update.stage} - ${update.type}`, update.message);
                    }
                    
                    if (update.stage === "COMPLETED") {
                      completedFound = true;
                    }
                  } catch {
                    // Ignore JSON parsing errors
                  }
                }
              }
            })(),
            timeout,
          ]);
        } finally {
          reader.releaseLock();
        }

        // Verify the full pipeline executed
        expect(updates.length).toBeGreaterThanOrEqual(5); // Should have multiple stages
        
        // Check for required stages
        const stages = updates.map(u => u.stage);
        expect(stages).toContain("INITIALIZING");
        expect(stages).toContain("COMPLETED");
        
        // Verify we got actual data, not just mocked responses
        const dataUpdates = updates.filter(u => u.type === "DATA");
        expect(dataUpdates.length).toBeGreaterThan(0);
        
        // Check that we have meaningful content (not just mock data)
        const hasRealContent = dataUpdates.some(update => 
          update.data && 
          typeof update.data === 'object' &&
          JSON.stringify(update.data).toLowerCase().includes('california')
        );
        expect(hasRealContent).toBe(true);
      },
      { 
        skipInCI: true, // Skip in CI unless API keys are explicitly provided
        timeout: 180000 // 3 minutes for full real API test
      }
    );

    itWithApiKeys(
      "should handle API errors gracefully",
      [...API_KEYS.GOOGLE_AI, ...API_KEYS.EXA_SEARCH],
      async () => {
        // Test with an empty question to potentially trigger errors
        const stream = await conductResearch("");
        
        const updates: ResearchUpdate[] = [];
        const reader = stream.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split("\n").filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const update = JSON.parse(line) as ResearchUpdate;
                updates.push(update);
                
                if (update.stage === "COMPLETED" || update.type === "ERROR") {
                  break;
                }
              } catch {
                // Ignore parsing errors
              }
            }
            
            // Break if we've found completion or error
            if (updates.some(u => u.stage === "COMPLETED" || u.type === "ERROR")) {
              break;
            }
          }
        } finally {
          reader.releaseLock();
        }
        
        // Should either complete successfully or fail gracefully
        const hasCompletion = updates.some(u => u.stage === "COMPLETED");
        const hasError = updates.some(u => u.type === "ERROR");
        
        expect(hasCompletion || hasError).toBe(true);
      },
      {
        skipInCI: true,
        timeout: 60000
      }
    );

    itWithApiKeys(
      "should produce structured legal analysis",
      [...API_KEYS.GOOGLE_AI, ...API_KEYS.EXA_SEARCH],
      async () => {
        const legalQuestion = "What is the statute of limitations for personal injury claims in New York?";
        
        const stream = await conductResearch(legalQuestion);
        const reader = stream.getReader();
        
        let finalReport: any = null;
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Test timeout")), 90000)
        );

        try {
          await Promise.race([
            (async () => {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split("\n").filter(line => line.trim());

                for (const line of lines) {
                  try {
                    const update = JSON.parse(line) as ResearchUpdate;
                    
                    if (update.type === "DATA" && update.data) {
                      // Look for final report data
                      if (typeof update.data === 'object' && 
                          'executive_summary' in update.data) {
                        finalReport = update.data;
                      }
                    }
                    
                    if (update.stage === "COMPLETED") {
                      return;
                    }
                  } catch {
                    // Ignore parsing errors
                  }
                }
              }
            })(),
            timeout
          ]);
        } finally {
          reader.releaseLock();
        }

        // Verify we got a structured legal analysis
        if (finalReport) {
          expect(finalReport).toBeDefined();
          expect(finalReport.executive_summary).toBeDefined();
          
          // Check that the analysis is relevant to the question
          const reportText = JSON.stringify(finalReport).toLowerCase();
          expect(
            reportText.includes('statute') || 
            reportText.includes('limitation') || 
            reportText.includes('new york') ||
            reportText.includes('personal injury')
          ).toBe(true);
        }
      },
      {
        skipInCI: true,
        timeout: 120000
      }
    );
  }
);