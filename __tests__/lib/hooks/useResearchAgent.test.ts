import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { createElement } from "react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { conductResearch } from "@/app/actions/researchAgentOrchestrator";
import type {
    ResearchStage,
} from "@/app/actions/researchAgentOrchestrator";
import { useResearchAgent } from "@/lib/hooks/useResearchAgent";
import {
    analyzedDocsSummaryAtom,
    generatedQueriesAtom,
    researchLogAtom,
    researchStatusAtom,
    synthesisDetailsAtom,
} from "@/lib/state/researchAtoms";

// Mock the server action
vi.mock("@/app/actions/researchAgentOrchestrator", () => ({
    conductResearch: vi.fn(),
}));

const mockedConductResearch = vi.mocked(conductResearch);

describe("useResearchAgent Hook", () => {
    let store: ReturnType<typeof createStore>;

    const JotaiProvider = ({ children }: { children: ReactNode }) =>
        createElement(Provider, { store }, children);

    beforeEach(() => {
        store = createStore();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe("Hook Skeleton and Basic Structure", () => {
        it("should initialize with correct default state", () => {
            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            expect(result.current).toEqual({
                startResearch: expect.any(Function),
                resumeResearch: expect.any(Function),
                pauseResearch: expect.any(Function),
                abortResearch: expect.any(Function),
                isLoading: false,
                currentStage: "IDLE",
                currentMessage: "Ready to start research.",
                error: null,
                isPaused: false,
                canResume: false,
                autoModeEnabled: false,
                toggleAutoMode: expect.any(Function),
            });
        });

        it("should provide startResearch function that accepts a legal question", () => {
            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            expect(typeof result.current.startResearch).toBe("function");
            expect(result.current.startResearch.length).toBe(1); // should accept one parameter
        });

        it("should provide abortResearch function", () => {
            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            expect(typeof result.current.abortResearch).toBe("function");
            expect(result.current.abortResearch.length).toBe(0); // should accept no parameters
        });

        it("should read research status from Jotai atoms correctly", () => {
            // Set initial state in the store
            store.set(researchStatusAtom, {
                stage: "GENERATING_QUERIES" as ResearchStage,
                isLoading: true,
                error: null,
                message: "Generating search queries...",
                currentProcessedDoc: 0,
                totalDocsToProcess: 5,
            });

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            expect(result.current.isLoading).toBe(true);
            expect(result.current.currentStage).toBe("GENERATING_QUERIES");
            expect(result.current.currentMessage).toBe(
                "Generating search queries...",
            );
            expect(result.current.error).toBe(null);
        });

        it("should expose error state when research status has error", () => {
            store.set(researchStatusAtom, {
                stage: "ERROR" as ResearchStage,
                isLoading: false,
                error: "Failed to generate queries",
                message: "An error occurred",
            });

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.currentStage).toBe("ERROR");
            expect(result.current.error).toBe("Failed to generate queries");
        });
    });

    describe("startResearch Basic Functionality", () => {
        it("should reset all research state when starting new research", async () => {
            // Set some initial state that should be cleared
            store.set(researchStatusAtom, {
                stage: "COMPLETED" as ResearchStage,
                isLoading: false,
                error: null,
                message: "Previous research completed",
            });
            store.set(researchLogAtom, ["Previous log entry"]);
            store.set(generatedQueriesAtom, [{ query_string: "old query" }]);

            // Mock a simple stream response
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.close();
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            await act(async () => {
                await result.current.startResearch(
                    "What are the implications of AI in healthcare?",
                );
            });

            // Check that state was reset
            expect(store.get(generatedQueriesAtom)).toEqual([]);
            expect(store.get(analyzedDocsSummaryAtom)).toEqual([]);
            expect(store.get(synthesisDetailsAtom)).toEqual({
                topics: [],
                unansweredAspects: [],
                emergingQuestions: [],
                reasoningSummary: "",
            });
        });

        it("should set initializing state when starting research", async () => {
            let streamController: ReadableStreamDefaultController<Uint8Array>;
            const mockStream = new ReadableStream({
                start(controller) {
                    streamController = controller;
                    // Don't close immediately, keep stream open for testing
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            // Start research but don't await completion
            act(() => {
                result.current.startResearch("Test legal question");
            });

            // Check status immediately after calling startResearch
            await waitFor(() => {
                const status = store.get(researchStatusAtom);
                expect(status.stage).toBe("INITIALIZING");
            });
            
            const status = store.get(researchStatusAtom);
            expect(status.isLoading).toBe(true);
            expect(status.error).toBe(null);
            expect(status.message).toBe("Initializing research...");

            // Clean up by closing the stream
            streamController!.close();
        });

        it("should call conductResearch server action with legal question", async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.close();
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            const legalQuestion =
                "What are the patent implications of AI-generated code?";

            await act(async () => {
                await result.current.startResearch(legalQuestion);
            });

            expect(mockedConductResearch).toHaveBeenCalledWith(legalQuestion, {
                currentIteration: 0,
                isEnabled: false,
                maxIterations: 3,
            });
            expect(mockedConductResearch).toHaveBeenCalledTimes(1);
        });

        it("should handle errors from conductResearch server action", async () => {
            const errorMessage = "Network error";
            mockedConductResearch.mockRejectedValue(new Error(errorMessage));

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            await act(async () => {
                await result.current.startResearch("Test question");
            });

            const status = store.get(researchStatusAtom);
            expect(status.stage).toBe("ERROR");
            expect(status.isLoading).toBe(false);
            expect(status.error).toBe(errorMessage);
        });

        it("should add log entries when starting research", async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.close();
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            const legalQuestion = "Test legal question";

            await act(async () => {
                await result.current.startResearch(legalQuestion);
            });

            const logs = store.get(researchLogAtom);
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0]).toContain(
                "[INITIALIZING] Research process initiated",
            );
            expect(logs[0]).toContain(legalQuestion);
        });
    });

    describe("abortResearch Basic Functionality", () => {
        it("should be callable without throwing", () => {
            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            expect(() => {
                result.current.abortResearch();
            }).not.toThrow();
        });

        it("should log when no active research to abort", () => {
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            act(() => {
                result.current.abortResearch();
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                "useResearchAgent: No active research to abort.",
            );

            consoleSpy.mockRestore();
        });
    });

    describe("Stream Processing and Update Handling", () => {
        it("should process STATUS_CHANGE updates correctly", async () => {
            const updates = [
                JSON.stringify({
                    type: "STATUS_CHANGE",
                    stage: "GENERATING_QUERIES",
                    message: "Starting query generation",
                }),
                JSON.stringify({
                    type: "STATUS_CHANGE",
                    stage: "FETCHING_DOCUMENTS",
                    message: "Searching for documents",
                    currentProcessedDoc: 1,
                    totalDocsToProcess: 5,
                }),
            ].join("\n");

            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(updates));
                    controller.close();
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            await act(async () => {
                await result.current.startResearch("Test legal question");
            });

            await waitFor(() => {
                const status = store.get(researchStatusAtom);
                expect(status.stage).toBe("FETCHING_DOCUMENTS");
                expect(status.message).toBe("Searching for documents");
                expect(status.currentProcessedDoc).toBe(1);
                expect(status.totalDocsToProcess).toBe(5);
                expect(status.isLoading).toBe(false); // Stream ended
            });
        });

        it("should process DATA updates for generated queries", async () => {
            const queryData = {
                queries: [
                    {
                        query_string: "AI liability healthcare",
                        expected_information_summary: "Cases on AI liability",
                    },
                    {
                        query_string: "medical malpractice automation",
                        expected_information_summary: "Malpractice precedents",
                    },
                ],
            };

            const updates = [
                JSON.stringify({
                    type: "DATA",
                    stage: "GENERATING_QUERIES",
                    message: "Generated search queries",
                    data: queryData,
                }),
            ].join("\n");

            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(updates));
                    controller.close();
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            await act(async () => {
                await result.current.startResearch("Test legal question");
            });

            await waitFor(() => {
                const queries = store.get(generatedQueriesAtom);
                expect(queries).toHaveLength(2);
                expect(queries[0]).toEqual({
                    query_string: "AI liability healthcare",
                    expected_information_summary: "Cases on AI liability",
                    timestamp: expect.any(String),
                });
                expect(queries[1]).toEqual({
                    query_string: "medical malpractice automation",
                    expected_information_summary: "Malpractice precedents",
                    timestamp: expect.any(String),
                });
            });
        });

        it("should process DATA updates for analyzed documents", async () => {
            const docData = {
                docId: "doc-123",
                title: "Test Case Title",
                relevanceScore: 0.85,
                confidenceScore: 0.92,
                summarySnippet: "This case discusses AI liability...",
            };

            const updates = [
                JSON.stringify({
                    type: "DATA",
                    stage: "ANALYZING_DOCUMENTS",
                    message: "Analyzed document",
                    data: docData,
                }),
            ].join("\n");

            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(updates));
                    controller.close();
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            await act(async () => {
                await result.current.startResearch("Test legal question");
            });

            await waitFor(() => {
                const docs = store.get(analyzedDocsSummaryAtom);
                expect(docs).toHaveLength(1);
                expect(docs[0]).toEqual({
                    ...docData,
                    timestamp: expect.any(String),
                });
            });
        });

        it("should update existing documents when processing additional data", async () => {
            // First, add a document
            const initialDoc = {
                docId: "doc-456",
                title: "Initial Title",
                relevanceScore: 0.7,
            };

            // Then update it with more data
            const updatedDoc = {
                docId: "doc-456",
                summarySnippet: "Updated summary snippet",
                confidenceScore: 0.88,
            };

            const updates = [
                JSON.stringify({
                    type: "DATA",
                    stage: "ANALYZING_DOCUMENTS",
                    data: initialDoc,
                }),
                JSON.stringify({
                    type: "DATA",
                    stage: "ANALYZING_DOCUMENTS",
                    data: updatedDoc,
                }),
            ].join("\n");

            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(updates));
                    controller.close();
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            await act(async () => {
                await result.current.startResearch("Test legal question");
            });

            await waitFor(() => {
                const docs = store.get(analyzedDocsSummaryAtom);
                expect(docs).toHaveLength(1);
                expect(docs[0]).toEqual({
                    docId: "doc-456",
                    title: "Initial Title",
                    relevanceScore: 0.7,
                    summarySnippet: "Updated summary snippet",
                    confidenceScore: 0.88,
                    timestamp: expect.any(String),
                });
            });
        });

        it("should process synthesis findings updates", async () => {
            const synthesisData = {
                topics: [
                    {
                        title: "AI Liability",
                        synthesisSnippet: "Key findings on liability",
                        confidence: 0.9,
                    },
                    {
                        title: "Medical Standards",
                        synthesisSnippet: "Standards analysis",
                        confidence: 0.8,
                    },
                ],
                unansweredAspects: ["Jurisdiction variations"],
                emergingQuestions: ["What about future AI capabilities?"],
                reasoningSummary: "Comprehensive analysis shows...",
            };

            const updates = [
                JSON.stringify({
                    type: "DATA",
                    stage: "SYNTHESIZING_FINDINGS",
                    message: "Synthesis complete",
                    data: synthesisData,
                }),
            ].join("\n");

            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(updates));
                    controller.close();
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            await act(async () => {
                await result.current.startResearch("Test legal question");
            });

            await waitFor(() => {
                const synthesis = store.get(synthesisDetailsAtom);
                expect(synthesis).toEqual({
                    ...synthesisData,
                    topics: synthesisData.topics.map(topic => ({
                        ...topic,
                        timestamp: expect.any(String),
                    })),
                });
            });
        });

        it("should handle ERROR type updates correctly", async () => {
            const updates = [
                JSON.stringify({
                    type: "ERROR",
                    stage: "GENERATING_QUERIES",
                    message: "Failed to generate queries",
                }),
            ].join("\n");

            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(updates));
                    controller.close();
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            await act(async () => {
                await result.current.startResearch("Test legal question");
            });

            await waitFor(() => {
                const status = store.get(researchStatusAtom);
                expect(status.stage).toBe("ERROR");
                expect(status.isLoading).toBe(false);
                expect(status.error).toBe("Failed to generate queries");
            });
        });

        it("should handle malformed JSON gracefully", async () => {
            const updates = [
                JSON.stringify({
                    type: "STATUS_CHANGE",
                    stage: "GENERATING_QUERIES",
                    message: "Valid update",
                }),
                '{"invalid": json malformed',
                JSON.stringify({
                    type: "STATUS_CHANGE",
                    stage: "FETCHING_DOCUMENTS",
                    message: "Another valid update",
                }),
            ].join("\n");

            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(updates));
                    controller.close();
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            await act(async () => {
                await result.current.startResearch("Test legal question");
            });

            await waitFor(() => {
                const status = store.get(researchStatusAtom);
                // Should process the valid updates despite the malformed one
                expect(status.stage).toBe("FETCHING_DOCUMENTS");
                expect(status.message).toBe("Another valid update");

                // Should log the malformed JSON error
                const logs = store.get(researchLogAtom);
                const systemErrorLog = logs.find((log) =>
                    log.includes("[SYSTEM_ERROR]"),
                );
                expect(systemErrorLog).toBeDefined();
            });
        });

        it("should update research log for all update types", async () => {
            const updates = [
                JSON.stringify({
                    type: "STATUS_CHANGE",
                    stage: "GENERATING_QUERIES",
                    message: "Status change message",
                }),
                JSON.stringify({
                    type: "PROGRESS",
                    stage: "ANALYZING_DOCUMENTS",
                    message: "Progress update",
                }),
                JSON.stringify({
                    type: "LOG",
                    stage: "SYNTHESIZING_FINDINGS",
                    message: "Log entry",
                }),
            ].join("\n");

            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(updates));
                    controller.close();
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            await act(async () => {
                await result.current.startResearch("Test legal question");
            });

            await waitFor(() => {
                const logs = store.get(researchLogAtom);
                // Should have initial log plus the three updates
                expect(logs.length).toBeGreaterThanOrEqual(4);

                // Check that all update types were logged
                const statusLog = logs.find((log) =>
                    log.includes("[GENERATING_QUERIES] (STATUS_CHANGE)"),
                );
                const progressLog = logs.find((log) =>
                    log.includes("[ANALYZING_DOCUMENTS] (PROGRESS)"),
                );
                const logEntry = logs.find((log) =>
                    log.includes("[SYNTHESIZING_FINDINGS] (LOG)"),
                );

                expect(statusLog).toBeDefined();
                expect(progressLog).toBeDefined();
                expect(logEntry).toBeDefined();
            });
        });
    });

    describe("AbortController Management", () => {
        it("should create AbortController when starting research", async () => {
            let streamController: ReadableStreamDefaultController<Uint8Array>;
            const mockStream = new ReadableStream({
                start(controller) {
                    streamController = controller;
                    // Keep stream open to test abort functionality
                },
            });
            mockedConductResearch.mockResolvedValue(mockStream);

            const { result } = renderHook(() => useResearchAgent(), {
                wrapper: JotaiProvider,
            });

            // Start research but don't await completion to keep controller active
            act(() => {
                result.current.startResearch("Test question");
            });

            // Give it a moment to start
            await waitFor(() => {
                const status = store.get(researchStatusAtom);
                expect(status.stage).toBe("INITIALIZING");
            });

            // Now test abort while controller is still active
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            act(() => {
                result.current.abortResearch();
            });

            // Should log "Abort signal sent" since controller exists
            expect(consoleSpy).toHaveBeenCalledWith(
                "useResearchAgent: Abort signal sent.",
            );

            consoleSpy.mockRestore();

            // Clean up
            streamController!.close();
        });
    });
});
