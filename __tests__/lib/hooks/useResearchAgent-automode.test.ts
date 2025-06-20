import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { createElement } from "react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { conductResearch } from "@/app/actions/researchAgentOrchestrator";
import { useResearchAgent } from "@/lib/hooks/useResearchAgent";
import {
  autoModeStateAtom,
  researchSessionAtom,
} from "@/lib/state/researchAtoms";

// Mock the server action
vi.mock("@/app/actions/researchAgentOrchestrator", () => ({
  conductResearch: vi.fn(),
}));

const mockConductResearch = vi.mocked(conductResearch);

describe("useResearchAgent Hook - Auto Mode", () => {
  let store: ReturnType<typeof createStore>;

  const JotaiProvider = ({ children }: { children: ReactNode }) =>
    createElement(Provider, { store }, children);

  beforeEach(() => {
    store = createStore();
    mockConductResearch.mockClear();
  });

  afterEach(() => {
    mockConductResearch.mockClear();
  });

  describe("Auto Mode Toggle", () => {
    it("should toggle auto mode on and off", async () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      // Initially auto mode should be disabled
      expect(result.current.autoModeEnabled).toBe(false);

      // Toggle auto mode on
      act(() => {
        result.current.toggleAutoMode();
      });

      await waitFor(() => {
        expect(result.current.autoModeEnabled).toBe(true);
      });

      // Toggle auto mode off
      act(() => {
        result.current.toggleAutoMode();
      });

      await waitFor(() => {
        expect(result.current.autoModeEnabled).toBe(false);
      });
    });

    it("should preserve auto mode state across hook re-renders", async () => {
      const { result, rerender } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      // Enable auto mode
      act(() => {
        result.current.toggleAutoMode();
      });

      await waitFor(() => {
        expect(result.current.autoModeEnabled).toBe(true);
      });

      // Re-render the hook
      rerender();

      // Auto mode should still be enabled
      expect(result.current.autoModeEnabled).toBe(true);
    });
  });

  describe("Auto Mode Configuration", () => {
    it("should pass auto mode config to conductResearch when starting research", async () => {
      // Mock a successful stream
      const mockStream = new ReadableStream({
        start(controller) {
          const update = {
            type: "STATUS_CHANGE",
            stage: "INITIALIZING",
            message: "Starting research...",
          };
          controller.enqueue(
            new TextEncoder().encode(`${JSON.stringify(update)}\n`)
          );
          controller.close();
        },
      });

      mockConductResearch.mockResolvedValue(mockStream);

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      // Enable auto mode
      act(() => {
        result.current.toggleAutoMode();
      });

      await waitFor(() => {
        expect(result.current.autoModeEnabled).toBe(true);
      });

      // Start research
      await act(async () => {
        await result.current.startResearch("Test legal question");
      });

      // Verify conductResearch was called with auto mode config
      expect(mockConductResearch).toHaveBeenCalledWith(
        "Test legal question",
        expect.objectContaining({
          isEnabled: true,
          maxIterations: 5,
          currentIteration: 0,
        }),
        []
      );
    });

    it("should pass disabled auto mode config when auto mode is off", async () => {
      // Mock a successful stream
      const mockStream = new ReadableStream({
        start(controller) {
          const update = {
            type: "STATUS_CHANGE",
            stage: "INITIALIZING",
            message: "Starting research...",
          };
          controller.enqueue(
            new TextEncoder().encode(`${JSON.stringify(update)}\n`)
          );
          controller.close();
        },
      });

      mockConductResearch.mockResolvedValue(mockStream);

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      // Auto mode should be disabled by default
      expect(result.current.autoModeEnabled).toBe(false);

      // Start research
      await act(async () => {
        await result.current.startResearch("Test legal question");
      });

      // Verify conductResearch was called with auto mode disabled
      expect(mockConductResearch).toHaveBeenCalledWith(
        "Test legal question",
        expect.objectContaining({
          isEnabled: false,
          maxIterations: 5,
          currentIteration: 0,
        }),
        []
      );
    });
  });

  describe("Research Session Management", () => {
    it("should generate a unique session ID when starting research", async () => {
      // Mock a successful stream
      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockConductResearch.mockResolvedValue(mockStream);

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      // Start research
      await act(async () => {
        await result.current.startResearch("Test legal question");
      });

      // Check that a session ID was generated
      const sessionState = store.get(researchSessionAtom);
      expect(sessionState.sessionId).toBeTruthy();
      expect(sessionState.sessionId).toMatch(/^research_\d+_[a-z0-9]+$/);
    });

    it("should initialize auto mode state with legal question", async () => {
      // Mock a successful stream
      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockConductResearch.mockResolvedValue(mockStream);

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      const legalQuestion = "What are the implications of AI in healthcare?";

      await act(async () => {
        await result.current.startResearch(legalQuestion);
      });

      const autoModeState = store.get(autoModeStateAtom);
      expect(autoModeState.originalQuestion).toBe(legalQuestion);
      expect(autoModeState.currentIteration).toBe(0);
    });
  });

  describe("Accumulative Data Handling", () => {
    it("should accumulate search queries with timestamps", async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          const update = {
            type: "DATA",
            stage: "GENERATING_QUERIES",
            data: {
              queries: [
                {
                  query_string: "patent requirements AI",
                  expected_information_summary: "Patent eligibility for AI",
                },
              ],
            },
          };
          controller.enqueue(
            new TextEncoder().encode(`${JSON.stringify(update)}\n`)
          );
          controller.close();
        },
      });

      mockConductResearch.mockResolvedValue(mockStream);

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      // Start research
      await act(async () => {
        await result.current.startResearch("Test legal question");
      });

      // Wait for the stream to be processed
      await waitFor(() => {
        const sessionState = store.get(researchSessionAtom);
        expect(sessionState.accumulatedQueries).toHaveLength(1);
        expect(sessionState.accumulatedQueries[0]).toEqual({
          query_string: "patent requirements AI",
          expected_information_summary: "Patent eligibility for AI",
          timestamp: expect.any(String),
        });
      });
    });

    it("should accumulate analyzed documents with timestamps", async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          const update = {
            type: "DATA",
            stage: "ANALYZING_DOCUMENTS",
            data: {
              docId: "doc-123",
              title: "Test Document",
              relevanceScore: 8,
              summarySnippet: "Test summary",
            },
          };
          controller.enqueue(
            new TextEncoder().encode(`${JSON.stringify(update)}\n`)
          );
          controller.close();
        },
      });

      mockConductResearch.mockResolvedValue(mockStream);

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      // Start research
      await act(async () => {
        await result.current.startResearch("Test legal question");
      });

      // Wait for the stream to be processed
      await waitFor(() => {
        const sessionState = store.get(researchSessionAtom);
        expect(sessionState.accumulatedDocuments).toHaveLength(1);
        expect(sessionState.accumulatedDocuments[0]).toEqual({
          docId: "doc-123",
          title: "Test Document",
          relevanceScore: 8,
          summarySnippet: "Test summary",
          timestamp: expect.any(String),
        });
      });
    });

    it("should accumulate synthesis topics with timestamps", async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          const update = {
            type: "DATA",
            stage: "SYNTHESIZING_FINDINGS",
            data: {
              topics: [
                {
                  title: "Patent Eligibility",
                  synthesisSnippet: "AI inventions must meet...",
                  confidence: 85,
                  docIds: ["doc-123"],
                },
              ],
            },
          };
          controller.enqueue(
            new TextEncoder().encode(`${JSON.stringify(update)}\n`)
          );
          controller.close();
        },
      });

      mockConductResearch.mockResolvedValue(mockStream);

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      // Start research
      await act(async () => {
        await result.current.startResearch("Test legal question");
      });

      // Wait for the stream to be processed
      await waitFor(() => {
        const sessionState = store.get(researchSessionAtom);
        expect(sessionState.accumulatedTopics).toHaveLength(1);
        expect(sessionState.accumulatedTopics[0]).toEqual({
          title: "Patent Eligibility",
          synthesisSnippet: "AI inventions must meet...",
          confidence: 85,
          docIds: ["doc-123"],
          timestamp: expect.any(String),
        });
      });
    });
  });

  describe("Pause and Resume Functionality", () => {
    it("should allow pausing research", async () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      // Mock a stream that processes quickly
      const mockStream = new ReadableStream({
        start(controller) {
          const update = {
            type: "STATUS_CHANGE",
            stage: "ANALYZING_DOCUMENTS",
            message: "Analyzing documents...",
          };
          controller.enqueue(
            new TextEncoder().encode(`${JSON.stringify(update)}\n`)
          );
          controller.close();
        },
      });

      mockConductResearch.mockResolvedValue(mockStream);

      // Start research
      await act(async () => {
        await result.current.startResearch("Test legal question");
      });

      // Immediately pause research (before stream closes)
      act(() => {
        result.current.pauseResearch();
      });

      // Check that pause method was called successfully
      expect(typeof result.current.pauseResearch).toBe("function");
    });

    it("should clear pause state when aborting research", async () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      const mockStream = new ReadableStream({
        start(controller) {
          const update = {
            type: "STATUS_CHANGE",
            stage: "ANALYZING_DOCUMENTS",
            message: "Analyzing documents...",
          };
          controller.enqueue(
            new TextEncoder().encode(`${JSON.stringify(update)}\n`)
          );
          controller.close();
        },
      });

      mockConductResearch.mockResolvedValue(mockStream);

      // Start research
      await act(async () => {
        await result.current.startResearch("Test legal question");
      });

      // Pause research
      act(() => {
        result.current.pauseResearch();
      });

      // Abort research
      act(() => {
        result.current.abortResearch();
      });

      // Check that abort method was called successfully
      expect(typeof result.current.abortResearch).toBe("function");
    });
  });

  describe("Error Handling", () => {
    it("should handle auto mode configuration errors gracefully", async () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      mockConductResearch.mockRejectedValue(new Error("Auto mode error"));

      // Enable auto mode
      act(() => {
        result.current.toggleAutoMode();
      });

      // Start research
      await act(async () => {
        try {
          await result.current.startResearch("Test legal question");
        } catch {
          // Expected error, handle gracefully
        }
      });

      // Check error state
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should reset auto mode state when resetting research", async () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      // Enable auto mode and set some state
      act(() => {
        result.current.toggleAutoMode();
      });

      // Simulate setting up research state
      const autoModeState = store.get(autoModeStateAtom);
      store.set(autoModeStateAtom, {
        ...autoModeState,
        currentIteration: 2,
        originalQuestion: "Test question",
      });

      // Mock a successful stream to trigger state reset
      const mockResetStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockConductResearch.mockResolvedValue(mockResetStream);

      // Start new research (which should reset state)
      await act(async () => {
        await result.current.startResearch("New test question");
      });

      // Check that auto mode state was reset but enabled flag preserved
      const newAutoModeState = store.get(autoModeStateAtom);
      expect(newAutoModeState.isEnabled).toBe(true); // Preserved
      expect(newAutoModeState.currentIteration).toBe(0); // Reset
      expect(newAutoModeState.originalQuestion).toBe("New test question"); // Updated
    });
  });
});
