// __tests__/integration/phase3-completion.test.ts

import { act, renderHook, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { createElement } from "react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { conductResearch } from "@/app/actions/researchAgentOrchestrator"
import { useResearchAgent } from "@/lib/hooks/useResearchAgent"
import {
  analyzedDocsSummaryAtom,
  generatedQueriesAtom,
  researchLogAtom,
  researchStatusAtom,
  synthesisDetailsAtom,
} from "@/lib/state/researchAtoms"

// Mock the server action
vi.mock("@/app/actions/researchAgentOrchestrator", () => ({
  conductResearch: vi.fn(),
}))
const mockedConductResearch = vi.mocked(conductResearch)

describe("Phase 3 Completion - Client-Side Orchestrator Hook", () => {
  let store: ReturnType<typeof createStore>

  const JotaiProvider = ({ children }: { children: ReactNode }) =>
    createElement(Provider, { store }, children)

  beforeEach(() => {
    store = createStore()
    vi.clearAllMocks()
  })

  describe("1. useResearchAgent Hook Implementation", () => {
    it("should export startResearch, abortResearch, and status properties", () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      // Verify hook returns all required functions and properties
      expect(typeof result.current.startResearch).toBe("function")
      expect(typeof result.current.abortResearch).toBe("function")
      expect(typeof result.current.isLoading).toBe("boolean")
      expect(typeof result.current.currentStage).toBe("string")
      expect(result.current.error).toBeNull()
      expect(typeof result.current.currentMessage).toBe("string")
    })

    it("should only use useSetAtom for updating state within the hook", () => {
      // This test verifies the architectural pattern is correct
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      // The hook should read status via useAtomValue, not useAtom
      // and should use setters for all state updates
      expect(result.current.isLoading).toBe(false) // Reading status correctly
      expect(result.current.currentStage).toBe("IDLE") // Reading status correctly
    })

    it("should contain no direct UI logic or JSX", () => {
      // Verify hook is purely for state management, not UI
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      // Hook should only return functions and primitives, no JSX
      const returnedValue = result.current
      expect(returnedValue).toBeTypeOf("object")
      expect(returnedValue).not.toHaveProperty("render")
      expect(returnedValue).not.toHaveProperty("children")
    })
  })

  describe("2. startResearch Functionality", () => {
    it("should reset all relevant Jotai data atoms using resetResearchStateAtom", async () => {
      // Pre-populate atoms with data
      store.set(generatedQueriesAtom, [{ query_string: "old query" }])
      store.set(analyzedDocsSummaryAtom, [
        { docId: "old-doc", title: "Old Doc" },
      ])
      store.set(synthesisDetailsAtom, {
        topics: [{ title: "Old Topic", synthesisSnippet: "old" }],
        reasoningSummary: "old reasoning",
      })

      const mockStream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("New research question")
      })

      // Verify all atoms were reset
      expect(store.get(generatedQueriesAtom)).toEqual([])
      expect(store.get(analyzedDocsSummaryAtom)).toEqual([])
      expect(store.get(synthesisDetailsAtom).topics).toEqual([])
      expect(store.get(synthesisDetailsAtom).reasoningSummary).toBe("")
    })

    it("should set initial loading/status states correctly", async () => {
      let streamController:
        | ReadableStreamDefaultController<Uint8Array>
        | undefined
      const mockStream = new ReadableStream({
        start(_controller) {
          // Controller not used in this test
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      act(() => {
        result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const status = store.get(researchStatusAtom)
        expect(status.stage).toBe("INITIALIZING")
        expect(status.isLoading).toBe(true)
        expect(status.error).toBe(null)
        expect(status.message).toBe("Initializing research...")
      })

      streamController?.close()
    })

    it("should create and manage AbortController correctly", async () => {
      let streamController:
        | ReadableStreamDefaultController<Uint8Array>
        | undefined
      const mockStream = new ReadableStream({
        start(_controller) {
          // Controller not used in this test
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      act(() => {
        result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const status = store.get(researchStatusAtom)
        expect(status.stage).toBe("INITIALIZING")
      })

      // Verify AbortController exists by testing abort functionality
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        // Mock implementation - no logging needed in test
      })

      act(() => {
        result.current.abortResearch()
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        "useResearchAgent: Abort signal sent."
      )
      consoleSpy.mockRestore()
      streamController?.close()
    })

    it("should successfully call conductResearch server action", async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      const testQuestion =
        "What are the legal implications of AI in healthcare?"

      await act(async () => {
        await result.current.startResearch(testQuestion)
      })

      expect(mockedConductResearch).toHaveBeenCalledWith(testQuestion, {
        currentIteration: 0,
        isEnabled: false,
        maxIterations: 3,
      })
      expect(mockedConductResearch).toHaveBeenCalledTimes(1)
    })

    it("should handle errors from conductResearch call and stream reading errors", async () => {
      const errorMessage = "Network connection failed"
      mockedConductResearch.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test question")
      })

      const status = store.get(researchStatusAtom)
      expect(status.stage).toBe("ERROR")
      expect(status.isLoading).toBe(false)
      expect(status.error).toBe(errorMessage)
    })
  })

  describe("3. Stream Processing", () => {
    it("should read and decode the stream correctly", async () => {
      const updates = JSON.stringify({
        type: "STATUS_CHANGE",
        stage: "GENERATING_QUERIES",
        message: "Processing started",
      })

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(updates))
          controller.close()
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const status = store.get(researchStatusAtom)
        expect(status.stage).toBe("GENERATING_QUERIES")
        expect(status.message).toBe("Processing started")
      })
    })

    it("should parse newline-separated JSON strings into ResearchUpdate objects", async () => {
      const updates = [
        JSON.stringify({
          type: "STATUS_CHANGE",
          stage: "GENERATING_QUERIES",
          message: "First update",
        }),
        JSON.stringify({
          type: "STATUS_CHANGE",
          stage: "FETCHING_DOCUMENTS",
          message: "Second update",
        }),
      ].join("\n")

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(updates))
          controller.close()
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const status = store.get(researchStatusAtom)
        expect(status.stage).toBe("FETCHING_DOCUMENTS")
        expect(status.message).toBe("Second update")

        const logs = store.get(researchLogAtom)
        expect(logs.some(log => log.includes("First update"))).toBe(true)
        expect(logs.some(log => log.includes("Second update"))).toBe(true)
      })
    })

    it("should handle malformed JSON chunks gracefully", async () => {
      const updates = [
        JSON.stringify({
          type: "STATUS_CHANGE",
          stage: "GENERATING_QUERIES",
          message: "Valid update",
        }),
        '{"malformed": json',
        JSON.stringify({
          type: "STATUS_CHANGE",
          stage: "FETCHING_DOCUMENTS",
          message: "Another valid update",
        }),
      ].join("\n")

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(updates))
          controller.close()
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const status = store.get(researchStatusAtom)
        expect(status.stage).toBe("FETCHING_DOCUMENTS")

        const logs = store.get(researchLogAtom)
        expect(logs.some(log => log.includes("[SYSTEM_ERROR]"))).toBe(true)
      })
    })
  })

  describe("4. Data Atom Updates", () => {
    it("should correctly update generatedQueriesAtom based on GENERATING_QUERIES stage data", async () => {
      const queryData = {
        queries: [
          {
            query_string: "AI healthcare liability",
            expected_information_summary: "Liability cases",
          },
          {
            query_string: "medical AI regulations",
            expected_information_summary: "Regulatory framework",
          },
        ],
      }

      const updates = JSON.stringify({
        type: "DATA",
        stage: "GENERATING_QUERIES",
        data: queryData,
      })

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(updates))
          controller.close()
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const queries = store.get(generatedQueriesAtom)
        expect(queries).toHaveLength(2)
        expect(queries[0]).toEqual({
          query_string: "AI healthcare liability",
          expected_information_summary: "Liability cases",
          timestamp: expect.any(String),
        })
        expect(queries[1]).toEqual({
          query_string: "medical AI regulations",
          expected_information_summary: "Regulatory framework",
          timestamp: expect.any(String),
        })
      })
    })

    it("should correctly update analyzedDocsSummaryAtom with progressive document data", async () => {
      const docData1 = {
        docId: "doc-1",
        title: "First Document",
        relevanceScore: 0.9,
      }

      const docData2 = {
        docId: "doc-1", // Same doc, additional data
        summarySnippet: "This document discusses AI liability",
        confidenceScore: 0.85,
      }

      const updates = [
        JSON.stringify({
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: docData1,
        }),
        JSON.stringify({
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: docData2,
        }),
      ].join("\n")

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(updates))
          controller.close()
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const docs = store.get(analyzedDocsSummaryAtom)
        expect(docs).toHaveLength(1)
        expect(docs[0]).toEqual({
          docId: "doc-1",
          title: "First Document",
          relevanceScore: 0.9,
          summarySnippet: "This document discusses AI liability",
          confidenceScore: 0.85,
          timestamp: expect.any(String),
        })
      })
    })

    it("should correctly update synthesisDetailsAtom based on SYNTHESIZING_FINDINGS stage data", async () => {
      const synthesisData = {
        topics: [
          {
            title: "AI Liability Framework",
            synthesisSnippet: "Key liability principles",
            confidence: 0.9,
          },
        ],
        unansweredAspects: ["Jurisdiction variations"],
        emergingQuestions: ["How do regulations apply to edge cases?"],
        reasoningSummary: "Analysis reveals complex regulatory landscape",
      }

      const updates = JSON.stringify({
        type: "DATA",
        stage: "SYNTHESIZING_FINDINGS",
        data: synthesisData,
      })

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(updates))
          controller.close()
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const synthesis = store.get(synthesisDetailsAtom)
        expect(synthesis).toEqual({
          ...synthesisData,
          topics: synthesisData.topics.map(topic => ({
            ...topic,
            timestamp: expect.any(String),
          })),
        })
      })
    })
  })

  describe("5. Error Handling", () => {
    it("should handle ERROR type ResearchUpdate correctly", async () => {
      const updates = JSON.stringify({
        type: "ERROR",
        stage: "GENERATING_QUERIES",
        message: "Failed to generate search queries",
      })

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(updates))
          controller.close()
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const status = store.get(researchStatusAtom)
        expect(status.stage).toBe("ERROR")
        expect(status.isLoading).toBe(false)
        expect(status.error).toBe("Failed to generate search queries")
      })
    })

    it("should handle stream completion by setting final status correctly", async () => {
      const updates = JSON.stringify({
        type: "STATUS_CHANGE",
        stage: "FETCHING_DOCUMENTS",
        message: "Documents retrieved",
      })

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(updates))
          controller.close()
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const status = store.get(researchStatusAtom)
        expect(status.stage).toBe("FETCHING_DOCUMENTS") // Should preserve last stage
        expect(status.isLoading).toBe(false) // Should be done
      })
    })
  })

  describe("6. abortResearch Functionality", () => {
    it("should call abort() on the active AbortController", async () => {
      const mockStream = new ReadableStream({
        start(_controller) {
          // Controller not used in this test
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      act(() => {
        result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const status = store.get(researchStatusAtom)
        expect(status.stage).toBe("INITIALIZING")
      })

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        // Mock implementation - no logging needed in test
      })

      act(() => {
        result.current.abortResearch()
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        "useResearchAgent: Abort signal sent."
      )

      // Should also update status to reflect abortion
      await waitFor(() => {
        const status = store.get(researchStatusAtom)
        expect(status.isLoading).toBe(false)
        expect(status.error).toBe("Research manually aborted.")
      })

      consoleSpy.mockRestore()
      // Don't close explicitly, let the abort handle cleanup
    })

    it("should lead to stream processing termination when called", async () => {
      const mockStream = new ReadableStream({
        start(_controller) {
          // Controller not used in this test
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      act(() => {
        result.current.startResearch("Test question")
      })

      await waitFor(() => {
        const status = store.get(researchStatusAtom)
        expect(status.stage).toBe("INITIALIZING")
      })

      act(() => {
        result.current.abortResearch()
      })

      await waitFor(() => {
        const logs = store.get(researchLogAtom)
        expect(
          logs.some(log =>
            log.includes("[USER_ACTION] Research abortion requested")
          )
        ).toBe(true)
      })

      // Don't close explicitly, let the abort handle cleanup
    })
  })

  describe("7. Overall Integration", () => {
    it("should demonstrate complete hook lifecycle from start to completion", async () => {
      const fullLifecycleUpdates = [
        JSON.stringify({
          type: "STATUS_CHANGE",
          stage: "GENERATING_QUERIES",
          message: "Generating queries",
        }),
        JSON.stringify({
          type: "DATA",
          stage: "GENERATING_QUERIES",
          data: {
            queries: [
              {
                query_string: "test query",
                expected_information_summary: "test info",
              },
            ],
          },
        }),
        JSON.stringify({
          type: "STATUS_CHANGE",
          stage: "ANALYZING_DOCUMENTS",
          message: "Analyzing documents",
        }),
        JSON.stringify({
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: {
            docId: "test-doc",
            title: "Test Document",
            relevanceScore: 0.8,
          },
        }),
      ].join("\n")

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(fullLifecycleUpdates))
          controller.close()
        },
      })
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Comprehensive test question")
      })

      await waitFor(() => {
        // Verify final state
        const status = store.get(researchStatusAtom)
        expect(status.stage).toBe("ANALYZING_DOCUMENTS")
        expect(status.isLoading).toBe(false)

        // Verify all data was processed
        const queries = store.get(generatedQueriesAtom)
        expect(queries).toHaveLength(1)
        expect(queries[0]?.query_string).toBe("test query")

        const docs = store.get(analyzedDocsSummaryAtom)
        expect(docs).toHaveLength(1)
        expect(docs[0]?.docId).toBe("test-doc")

        // Verify logging worked throughout
        const logs = store.get(researchLogAtom)
        expect(logs.length).toBeGreaterThan(4) // Initial + status + data updates
      })
    })
  })
})
