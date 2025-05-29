/**
 * Basic integration test for the research orchestrator
 * Tests the fundamental streaming mechanics before implementing full pipeline
 */

import { vi } from "vitest";

import { conductResearch } from "@/app/actions/researchAgentOrchestrator";
import type { ResearchUpdate } from "@/app/actions/researchAgentOrchestrator";

// Mock the BAML client to avoid real API calls
vi.mock("@/baml_client", () => import("@/__mocks__/baml_client"));

describe("Research Orchestrator - Basic Streaming", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should stream INITIALIZING and COMPLETED updates", async () => {
        const legalQuestion = "Test question";
        const stream = await conductResearch(legalQuestion);

        const updates: ResearchUpdate[] = [];
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        // Set a timeout to prevent hanging
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Test timeout")), 9000),
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
                                const update = JSON.parse(
                                    line,
                                ) as ResearchUpdate;
                                updates.push(update);
                                if (update.stage === "COMPLETED") {
                                    completedFound = true;
                                }
                            } catch (e) {
                                console.warn(
                                    "Failed to parse JSON line:",
                                    line,
                                );
                            }
                        }
                    }
                })(),
                timeout,
            ]);
        } catch (error) {
            if (error instanceof Error && error.message !== "Test timeout") {
                console.warn("Stream processing error:", error.message);
            }
        } finally {
            reader.releaseLock();
        }

        // Verify basic flow
        expect(updates.length).toBeGreaterThanOrEqual(2);
        expect(updates[0].type).toBe("STATUS_CHANGE");
        expect(updates[0].stage).toBe("INITIALIZING");
        expect(updates[updates.length - 1].stage).toBe("COMPLETED");
    }, 10000); // 10 second timeout

    it("should handle empty legal question gracefully", async () => {
        const stream = await conductResearch("");
        const reader = stream.getReader();

        let hasError = false;
        let hasCompleted = false;

        // Set a timeout to prevent hanging
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Test timeout")), 9000),
        );

        try {
            await Promise.race([
                (async () => {
                    while (!hasCompleted) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = new TextDecoder().decode(value);
                        const lines = chunk
                            .split("\n")
                            .filter((line) => line.trim());

                        for (const line of lines) {
                            const update = JSON.parse(line) as ResearchUpdate;
                            if (update.type === "ERROR") hasError = true;
                            if (update.stage === "COMPLETED")
                                hasCompleted = true;
                        }
                    }
                })(),
                timeout,
            ]);
        } catch (error) {
            if (error instanceof Error && error.message !== "Test timeout") {
                console.warn("Stream processing error:", error.message);
            }
        } finally {
            reader.releaseLock();
        }

        // Should complete successfully even with empty question (for now)
        expect(hasCompleted).toBe(true);
    }, 10000); // 10 second timeout
});
