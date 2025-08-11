/**
 * Integration test for the research orchestrator with real API calls
 * This test requires actual API keys and will be skipped in CI unless keys are available
 */

import { beforeAll, beforeEach, expect, vi } from "vitest";
// TODO: Update to test new Elysia backend endpoints
import type {
  FinalLegalReport,
  ResearchUpdate,
} from "@/packages/shared-types/src";

// import { conductResearch } from "@/api/src/routes/research";

// Mock function for backward compatibility during refactoring
const conductResearch = async (_question: string) => {
  throw new Error(
    "conductResearch has been moved to Elysia backend - update test to use HTTP endpoints"
  );
};

import {
  API_KEYS,
  describeWithApiKeys,
  itWithApiKeys,
  logApiKeyStatus,
} from "../../utils/api-test-helpers";

// Unmock axios for integration tests that need real HTTP requests
vi.unmock("axios");

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
        const legalQuestion =
          "What are the basic requirements for forming a valid contract in California?";

        // Use real APIs - no mocking
        const stream = await conductResearch(legalQuestion);

        const updates: ResearchUpdate[] = [];
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        try {
          let completedFound = false;
          const maxTimeoutMs = 300000; // 5 minutes for full real API test
          const startTime = Date.now();

          while (!completedFound) {
            // Check for overall timeout
            if (Date.now() - startTime > maxTimeoutMs) {
              throw new Error(`Real API test timeout after ${maxTimeoutMs}ms`);
            }

            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter((line) => line.trim());

            for (const line of lines) {
              try {
                const update = JSON.parse(line) as ResearchUpdate;
                updates.push(update);

                // Log progress when debugging
                if (process.env.DEBUG_API_TESTS === "true") {
                  console.log(
                    `Update: ${update.stage} - ${update.type}`,
                    update.message
                  );
                }

                // Consider multiple valid completion states
                if (
                  update.stage === "COMPLETED" ||
                  update.stage === "HUMAN_REVIEW_REQUESTED" ||
                  update.stage === "ITERATION_PAUSED" ||
                  update.type === "ERROR"
                ) {
                  completedFound = true;
                  break;
                }
              } catch {
                // Ignore JSON parsing errors
              }
            }

            // Add small delay to prevent tight loop
            if (!completedFound) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Verify we got some pipeline activity
        expect(updates.length).toBeGreaterThan(0);

        // Check for required stages or error handling
        const stages = updates.map((u) => u.stage);
        const types = updates.map((u) => u.type);

        // Either we completed successfully or handled errors gracefully
        const hasInitialization = stages.includes("INITIALIZING");
        const hasCompletion = stages.includes("COMPLETED");
        const hasHumanReview = stages.includes("HUMAN_REVIEW_REQUESTED");
        const hasIterationPaused = stages.includes("ITERATION_PAUSED");
        const hasError = types.includes("ERROR");

        expect(hasInitialization).toBe(true);

        if (hasError) {
          // If there were errors, verify they were handled gracefully
          const errorUpdates = updates.filter((u) => u.type === "ERROR");
          expect(errorUpdates.length).toBeGreaterThan(0);
          expect(errorUpdates[0]?.message).toBeDefined();
        } else {
          // If no errors, verify we reached a valid end state
          const hasValidEndState =
            hasCompletion || hasHumanReview || hasIterationPaused;
          expect(hasValidEndState).toBe(true);

          // Verify we got actual data, not just mocked responses
          const dataUpdates = updates.filter((u) => u.type === "DATA");
          if (dataUpdates.length > 0) {
            // Check that we have meaningful content (not just mock data)
            const hasRealContent = dataUpdates.some(
              (update) =>
                update.data &&
                typeof update.data === "object" &&
                JSON.stringify(update.data).toLowerCase().includes("california")
            );
            expect(hasRealContent).toBe(true);
          }
        }
      },
      {
        skipInCI: true, // Skip in CI unless API keys are explicitly provided
        timeout: 300000, // 5 minutes for full real API test
      }
    );

    // Helper functions to reduce cognitive complexity

    interface StreamProcessingResult {
      hasCompleted: boolean;
      hasError: boolean;
    }

    async function processResearchStream(
      reader: ReadableStreamDefaultReader<Uint8Array>,
      updates: ResearchUpdate[]
    ): Promise<StreamProcessingResult> {
      try {
        const startTime = Date.now();
        const maxTimeoutMs = 240000; // 4 minutes
        let hasCompleted = false;
        let hasError = false;

        while (!hasCompleted && !hasError) {
          if (Date.now() - startTime > maxTimeoutMs) {
            console.warn(`Test timeout after ${maxTimeoutMs}ms`);
            break;
          }

          const streamResult = await readStreamChunk(reader);
          if (streamResult.done) {
            break;
          }

          const parsedUpdates = parseStreamChunk(streamResult.value);
          updates.push(...parsedUpdates);

          const status = checkCompletionStatus(parsedUpdates);
          hasCompleted = status.completed;
          hasError = status.error;

          if (!hasCompleted && !hasError) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        return { hasCompleted, hasError };
      } finally {
        reader.releaseLock();
      }
    }

    async function readStreamChunk(
      reader: ReadableStreamDefaultReader<Uint8Array>
    ) {
      const { done, value } = await reader.read();
      return { done, value };
    }

    function parseStreamChunk(value: Uint8Array | undefined): ResearchUpdate[] {
      if (!value) {
        return [];
      }
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());
      const updates: ResearchUpdate[] = [];

      for (const line of lines) {
        try {
          const update = JSON.parse(line) as ResearchUpdate;
          updates.push(update);
        } catch {
          // Ignore parsing errors
        }
      }

      return updates;
    }

    function checkCompletionStatus(updates: ResearchUpdate[]): {
      completed: boolean;
      error: boolean;
    } {
      const hasCompleted = updates.some(
        (update) =>
          update.stage === "COMPLETED" ||
          update.stage === "HUMAN_REVIEW_REQUESTED" ||
          update.stage === "ITERATION_PAUSED"
      );

      const hasError = updates.some((update) => update.type === "ERROR");

      return { completed: hasCompleted, error: hasError };
    }

    function extractFinalReport(
      updates: ResearchUpdate[]
    ): FinalLegalReport | null {
      for (const update of updates) {
        if (update.type === "DATA" && update.data) {
          if (
            typeof update.data === "object" &&
            update.data !== null &&
            ("executive_summary" in update.data ||
              "executiveSummary" in update.data)
          ) {
            return update.data as FinalLegalReport;
          }
        }
      }
      return null;
    }

    function validateTestResults(
      updates: ResearchUpdate[],
      hasCompleted: boolean,
      hasError: boolean,
      finalReport: FinalLegalReport | null
    ): void {
      expect(updates.length).toBeGreaterThan(0);

      if (hasError) {
        validateErrorHandling(updates);
      } else if (hasCompleted && finalReport) {
        validateSuccessfulCompletion(finalReport);
      } else {
        validateProgressMade(updates);
      }
    }

    function validateErrorHandling(updates: ResearchUpdate[]): void {
      const errorUpdate = updates.find((u) => u.type === "ERROR");
      expect(errorUpdate?.message).toBeDefined();
      console.log("Test handled error gracefully:", errorUpdate?.message);
    }

    function validateSuccessfulCompletion(finalReport: FinalLegalReport): void {
      expect(finalReport.report_title).toBeDefined();
      expect(finalReport.executive_summary).toBeDefined();
      expect(finalReport.sections).toBeDefined();
      expect(Array.isArray(finalReport.sections)).toBe(true);
      expect(finalReport.conclusion).toBeDefined();

      const reportText = JSON.stringify(finalReport).toLowerCase();
      const isRelevant =
        reportText.includes("statute") ||
        reportText.includes("limitation") ||
        reportText.includes("new york") ||
        reportText.includes("personal injury");

      expect(isRelevant).toBe(true);

      console.log("✅ Structured legal analysis completed successfully");
      console.log(`Report title: ${finalReport.report_title}`);
      console.log(`Number of sections: ${finalReport.sections.length}`);
    }

    function validateProgressMade(updates: ResearchUpdate[]): void {
      const stages = updates.map((u) => u.stage);
      expect(stages).toContain("INITIALIZING");

      const hasDataUpdates = updates.some((u) => u.type === "DATA");
      if (hasDataUpdates) {
        console.log("Test made progress with data updates but didn't complete");
      } else {
        console.log("Test started but didn't progress to data generation");
      }
    }

    itWithApiKeys(
      "should handle API errors gracefully",
      [...API_KEYS.GOOGLE_AI, ...API_KEYS.EXA_SEARCH],
      async () => {
        // Test with an empty question - this should still complete gracefully
        const stream = await conductResearch("");

        const updates: ResearchUpdate[] = [];
        const reader = stream.getReader();

        try {
          const startTime = Date.now();
          const maxTimeoutMs = 180000; // 3 minutes for error handling test
          let completedFound = false;

          while (!completedFound) {
            // Check for timeout
            if (Date.now() - startTime > maxTimeoutMs) {
              console.warn(
                `Error handling test timeout after ${maxTimeoutMs}ms - got ${updates.length} updates`
              );
              console.warn(
                "Last few updates:",
                updates
                  .slice(-3)
                  .map((u) => `${u.stage}:${u.type}:${u.message}`)
              );
              break;
            }

            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split("\n").filter((line) => line.trim());

            for (const line of lines) {
              try {
                const update = JSON.parse(line) as ResearchUpdate;
                updates.push(update);

                // Log progress for debugging
                if (process.env.DEBUG_API_TESTS === "true") {
                  console.log(
                    `Error test update: ${update.stage} - ${update.type}: ${update.message}`
                  );
                }

                if (
                  update.stage === "COMPLETED" ||
                  update.stage === "HUMAN_REVIEW_REQUESTED" ||
                  update.stage === "ITERATION_PAUSED" ||
                  update.type === "ERROR"
                ) {
                  completedFound = true;
                  break;
                }
              } catch {
                // Ignore parsing errors
              }
            }

            // Add small delay to prevent tight loop
            if (!completedFound) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Should either complete successfully, request review, pause, or fail gracefully
        const hasCompletion = updates.some((u) => u.stage === "COMPLETED");
        const hasHumanReview = updates.some(
          (u) => u.stage === "HUMAN_REVIEW_REQUESTED"
        );
        const hasIterationPaused = updates.some(
          (u) => u.stage === "ITERATION_PAUSED"
        );
        const hasError = updates.some((u) => u.type === "ERROR");

        // Verify we got some meaningful response regardless of outcome
        expect(updates.length).toBeGreaterThan(0);
        expect(
          hasCompletion || hasHumanReview || hasIterationPaused || hasError
        ).toBe(true);

        // Log final outcome for debugging
        if (hasError) {
          const errorUpdate = updates.find((u) => u.type === "ERROR");
          console.log("Test completed with error:", errorUpdate?.message);
        } else if (hasCompletion) {
          console.log("Test completed successfully");
        } else if (hasHumanReview || hasIterationPaused) {
          console.log("Test completed with review/pause request");
        }
      },
      {
        skipInCI: true,
        timeout: 180000, // 3 minutes for error handling test - allows normal completion
      }
    );

    itWithApiKeys(
      "should produce structured legal analysis",
      [...API_KEYS.GOOGLE_AI, ...API_KEYS.EXA_SEARCH],
      async () => {
        const legalQuestion =
          "What is the statute of limitations for personal injury claims in New York?";

        const stream = await conductResearch(legalQuestion);
        const reader = stream.getReader();

        const updates: ResearchUpdate[] = [];
        let finalReport: FinalLegalReport | null = null;

        const result = await processResearchStream(reader, updates);
        const { hasCompleted, hasError } = result;

        // Extract final report from updates if available
        finalReport = extractFinalReport(updates);

        validateTestResults(updates, hasCompleted, hasError, finalReport);
      },
      {
        skipInCI: true,
        timeout: 240000, // 4 minutes for structured analysis test
      }
    );
  }
);
