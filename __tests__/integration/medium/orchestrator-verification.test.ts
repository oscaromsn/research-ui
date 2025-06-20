/// <reference types="../../types/test-globals" />

/**
 * Verification test for Phase 1 completion criteria
 * Tests that all required components are properly implemented
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { conductResearch } from "@/app/actions/researchAgentOrchestrator";
import type {
  ResearchStage,
  ResearchUpdate,
} from "@/app/actions/researchAgentOrchestrator";

// Unmock axios for integration tests that need real HTTP requests
vi.unmock("axios");

// Mock the BAML client to avoid real API calls
vi.mock("@/baml_client", () => import("@/__mocks__/baml_client"));

describe("Research Orchestrator - Phase 1 Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have all required types defined", () => {
    // Verify ResearchStage enum covers all required stages
    const requiredStages: ResearchStage[] = [
      "IDLE",
      "INITIALIZING",
      "GENERATING_QUERIES",
      "FETCHING_DOCUMENTS",
      "ANALYZING_DOCUMENTS",
      "SYNTHESIZING_FINDINGS",
      "ASSESSING_RESEARCH",
      "GENERATING_REPORT",
      "ITERATION_PAUSED",
      "HUMAN_REVIEW_REQUESTED",
      "COMPLETED",
      "ERROR",
    ];

    // TypeScript compilation will fail if these types don't exist
    expect(requiredStages.length).toBe(12);
  });

  it("should export conductResearch Server Action", () => {
    expect(typeof conductResearch).toBe("function");
  });

  it("should have proper function signature", async () => {
    const legalQuestion = "Test question";
    const result = conductResearch(legalQuestion);

    // Should return a Promise<ReadableStream<Uint8Array>>
    expect(result).toBeInstanceOf(Promise);

    const stream = await result;
    expect(stream).toBeInstanceOf(ReadableStream);

    // Clean up the stream
    const reader = stream.getReader();
    reader.releaseLock();
  });

  it("should implement proper ResearchUpdate structure", () => {
    // This test ensures TypeScript validates the ResearchUpdate interface
    const validUpdate: ResearchUpdate = {
      type: "STATUS_CHANGE",
      stage: "INITIALIZING",
      message: "Test message",
    };

    expect(validUpdate.type).toBe("STATUS_CHANGE");
    expect(validUpdate.stage).toBe("INITIALIZING");
  });

  it("should handle basic stream lifecycle (with timeout)", async () => {
    const legalQuestion = "What are the legal implications of contract breach?";
    const stream = await conductResearch(legalQuestion);

    const updates: ResearchUpdate[] = [];
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    // Set a timeout to prevent hanging
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Test timeout")), 30000)
    );

    try {
      await Promise.race([
        (async () => {
          let chunks = 0;
          while (chunks < 10) {
            // Read up to 10 chunks to avoid infinite loop
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
              } catch {
                console.warn("Failed to parse JSON line:", line);
              }
            }
            chunks++;
          }
        })(),
        timeout,
      ]);
    } catch (error) {
      if (error instanceof Error && error.message !== "Test timeout") {
        console.warn(
          "Stream processing error (expected for BAML without API keys):",
          error.message
        );
      }
    } finally {
      reader.releaseLock();
    }

    // Verify we got at least the initial updates
    expect(updates.length).toBeGreaterThan(0);

    // Should start with INITIALIZING
    if (updates.length > 0) {
      expect(updates[0]?.stage).toBe("INITIALIZING");
      expect(updates[0]?.type).toBe("STATUS_CHANGE");
    }
  }, 35000);
});
