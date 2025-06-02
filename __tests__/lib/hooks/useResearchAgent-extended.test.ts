import { act, renderHook, waitFor } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { createElement } from "react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { conductResearch } from "@/app/actions/researchAgentOrchestrator"
import type { ResearchUpdate } from "@/app/actions/researchAgentOrchestrator"
import { useResearchAgent } from "@/lib/hooks/useResearchAgent"
import {
  analyzedDocsSummaryAtom,
  researchStatusAtom,
} from "@/lib/state/researchAtoms"
import type {
  ClientAnalysisReasoning,
  ClientAnalyzedDoc,
  ClientLegalEntity,
} from "@/lib/state/researchAtoms"

// Mock the server action
vi.mock("@/app/actions/researchAgentOrchestrator", () => ({
  conductResearch: vi.fn(),
}))

const mockedConductResearch = vi.mocked(conductResearch)

describe("useResearchAgent Hook - Extended Data Handling", () => {
  let store: ReturnType<typeof createStore>

  const JotaiProvider = ({ children }: { children: ReactNode }) =>
    createElement(Provider, { store }, children)

  beforeEach(() => {
    store = createStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  const createMockStream = (updates: ResearchUpdate[]) => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        for (const update of updates) {
          const data = encoder.encode(`${JSON.stringify(update)}\n`)
          controller.enqueue(data)
        }
        controller.close()
      },
    })
    return stream
  }

  const mockExtendedAnalysisData: ClientAnalyzedDoc = {
    docId: "doc-extended-1",
    title: "Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)",
    url: "https://example.com/smith-v-jones",
    relevanceScore: 9,
    confidenceScore: 8,
    summarySnippet:
      "The court found that COVID-19 related restrictions constituted force majeure events when explicitly mentioned in the contract.",
    keyArguments: [
      "Government-mandated closures during COVID-19 constitute unforeseeable circumstances",
      "Force majeure clauses must be interpreted strictly against the party invoking them",
      "Performance must be truly impossible, not merely more difficult or expensive",
    ],
    extractedEntities: [
      {
        name: "Smith v. Jones",
        type: "Case",
        details: "345 F.Supp. 2d 123 (N.D. Cal. 2023)",
      },
      {
        name: "Force Majeure",
        type: "LegalConcept",
        details: "Contractual excuse doctrine",
      },
    ],
    extractedQuotes: [
      '"The pandemic represents an unprecedented disruption to commercial activities"',
      '"Force majeure relief is available only when performance is truly impossible"',
    ],
    fullText: "SMITH v. JONES\n\nFull text of the court decision...",
    counterArguments: [
      "The pandemic was foreseeable by early 2020",
      "Alternative performance methods were available",
    ],
    analysisReasoning: {
      analyzeLegalQuestionSummary:
        "The legal question involves determining whether COVID-19 restrictions constitute force majeure events under contract law.",
      considerRelevantPrinciplesSummary:
        "Relevant principles include the doctrine of impossibility, force majeure clauses, and government intervention defenses.",
    },
  }

  describe("Extended Document Analysis Processing", () => {
    it("should handle extended document analysis data correctly", async () => {
      const updates: ResearchUpdate[] = [
        {
          type: "STATUS_CHANGE",
          stage: "ANALYZING_DOCUMENTS",
          message: "Starting document analysis...",
        },
        {
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: mockExtendedAnalysisData,
          message: "Analysis complete for Smith v. Jones",
        },
      ]

      const mockStream = createMockStream(updates)
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test legal question")
      })

      await waitFor(() => {
        const analyzedDocs = store.get(analyzedDocsSummaryAtom)
        expect(analyzedDocs).toHaveLength(1)

        const doc = analyzedDocs[0]
        expect(doc?.docId).toBe("doc-extended-1")
        expect(doc?.title).toBe(
          "Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)"
        )
        expect(doc?.url).toBe("https://example.com/smith-v-jones")
        expect(doc?.keyArguments).toHaveLength(3)
        expect(doc?.extractedEntities).toHaveLength(2)
        expect(doc?.extractedQuotes).toHaveLength(2)
        expect(doc?.counterArguments).toHaveLength(2)
        expect(doc?.analysisReasoning?.analyzeLegalQuestionSummary).toContain(
          "COVID-19 restrictions"
        )
      })
    })

    it("should update existing documents with progressive data", async () => {
      // First update with basic data
      const initialUpdate: ResearchUpdate = {
        type: "DATA",
        stage: "ANALYZING_DOCUMENTS",
        data: {
          docId: "doc-progressive",
          title: "Progressive Document",
          relevanceScore: 7,
          summarySnippet: "Initial summary...",
        },
        message: "Initial analysis",
      }

      // Second update with extended data
      const extendedUpdate: ResearchUpdate = {
        type: "DATA",
        stage: "ANALYZING_DOCUMENTS",
        data: {
          docId: "doc-progressive",
          title: "Progressive Document",
          relevanceScore: 7,
          summarySnippet: "Updated summary with more content...",
          keyArguments: ["New argument 1", "New argument 2"],
          extractedEntities: [
            {
              name: "Test Entity",
              type: "LegalConcept",
              details: "Test details",
            },
          ],
        },
        message: "Extended analysis complete",
      }

      const updates = [initialUpdate, extendedUpdate]
      const mockStream = createMockStream(updates)
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test legal question")
      })

      await waitFor(() => {
        const analyzedDocs = store.get(analyzedDocsSummaryAtom)
        expect(analyzedDocs).toHaveLength(1)

        const doc = analyzedDocs[0]
        expect(doc?.docId).toBe("doc-progressive")
        expect(doc?.summarySnippet).toBe("Updated summary with more content...")
        expect(doc?.keyArguments).toEqual(["New argument 1", "New argument 2"])
        expect(doc?.extractedEntities).toHaveLength(1)
        expect(doc?.extractedEntities?.[0]?.name).toBe("Test Entity")
      })
    })

    it("should handle multiple documents with different data completeness", async () => {
      const updates: ResearchUpdate[] = [
        {
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: {
            docId: "doc-minimal",
            title: "Minimal Document",
            relevanceScore: 5,
            summarySnippet: "Basic summary",
          },
          message: "Basic analysis complete",
        },
        {
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: mockExtendedAnalysisData,
          message: "Extended analysis complete",
        },
      ]

      const mockStream = createMockStream(updates)
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test legal question")
      })

      await waitFor(() => {
        const analyzedDocs = store.get(analyzedDocsSummaryAtom)
        expect(analyzedDocs).toHaveLength(2)

        // Check minimal document
        const minimalDoc = analyzedDocs.find(doc => doc.docId === "doc-minimal")
        expect(minimalDoc).toBeDefined()
        expect(minimalDoc?.keyArguments).toBeUndefined()
        expect(minimalDoc?.extractedEntities).toBeUndefined()

        // Check extended document
        const extendedDoc = analyzedDocs.find(
          doc => doc.docId === "doc-extended-1"
        )
        expect(extendedDoc).toBeDefined()
        expect(extendedDoc?.keyArguments).toHaveLength(3)
        expect(extendedDoc?.extractedEntities).toHaveLength(2)
      })
    })

    it("should handle streaming text updates for extended fields", async () => {
      const streamingUpdates: ResearchUpdate[] = [
        {
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: {
            docId: "doc-streaming",
            title: "Streaming Document",
            relevanceScore: 8,
            summarySnippet: "The court found that...",
            keyArguments: ["Initial argument"],
          },
          message: "Partial analysis",
        },
        {
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: {
            docId: "doc-streaming",
            title: "Streaming Document",
            relevanceScore: 8,
            summarySnippet: "The court found that COVID-19 restrictions...",
            keyArguments: [
              "Initial argument",
              "Additional argument from further analysis",
            ],
          },
          message: "Updated analysis",
        },
      ]

      const mockStream = createMockStream(streamingUpdates)
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test legal question")
      })

      await waitFor(() => {
        const analyzedDocs = store.get(analyzedDocsSummaryAtom)
        const doc = analyzedDocs[0]
        expect(doc?.summarySnippet).toBe(
          "The court found that COVID-19 restrictions..."
        )
        expect(doc?.keyArguments).toHaveLength(2)
        expect(doc?.keyArguments?.[1]).toBe(
          "Additional argument from further analysis"
        )
      })
    })

    it("should preserve entity type information correctly", async () => {
      const diverseEntities: ClientLegalEntity[] = [
        { name: "Test Case", type: "Case", details: "Citation" },
        {
          name: "Test Statute",
          type: "Statute",
          details: "Code section",
        },
        { name: "John Doe", type: "Person", details: "Role" },
        { name: "Corp Inc.", type: "Organization", details: "Company" },
        {
          name: "Legal Concept",
          type: "LegalConcept",
          details: "Description",
        },
        { name: "California", type: "Jurisdiction", details: "State" },
      ]

      const updates: ResearchUpdate[] = [
        {
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: {
            docId: "doc-entities",
            title: "Entity Test Document",
            relevanceScore: 7,
            extractedEntities: diverseEntities,
          },
          message: "Entity extraction complete",
        },
      ]

      const mockStream = createMockStream(updates)
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test legal question")
      })

      await waitFor(() => {
        const analyzedDocs = store.get(analyzedDocsSummaryAtom)
        const doc = analyzedDocs[0]
        expect(doc?.extractedEntities).toHaveLength(6)

        const entityTypes = doc?.extractedEntities?.map(e => e.type)
        expect(entityTypes).toContain("Case")
        expect(entityTypes).toContain("Statute")
        expect(entityTypes).toContain("Person")
        expect(entityTypes).toContain("Organization")
        expect(entityTypes).toContain("LegalConcept")
        expect(entityTypes).toContain("Jurisdiction")

        // Verify entity details are preserved
        const caseEntity = doc?.extractedEntities?.find(e => e.type === "Case")
        expect(caseEntity?.details).toBe("Citation")
      })
    })

    it("should handle analysis reasoning data correctly", async () => {
      const reasoningData: ClientAnalysisReasoning = {
        analyzeLegalQuestionSummary:
          "Comprehensive analysis of the legal question involving contract law and force majeure provisions.",
        considerRelevantPrinciplesSummary:
          "Relevant principles include impossibility doctrine, government intervention, and contractual interpretation.",
        formulateSearchQueriesSummary:
          "Search strategy focused on recent precedents and statutory provisions.",
        specifyExpectedInfoSummary:
          "Expected case law, regulatory guidance, and scholarly commentary.",
        ensureComprehensiveCoverageSummary:
          "Multi-jurisdictional approach ensuring comprehensive legal analysis.",
      }

      const updates: ResearchUpdate[] = [
        {
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: {
            docId: "doc-reasoning",
            title: "Reasoning Test Document",
            relevanceScore: 9,
            analysisReasoning: reasoningData,
          },
          message: "Reasoning analysis complete",
        },
      ]

      const mockStream = createMockStream(updates)
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test legal question")
      })

      await waitFor(() => {
        const analyzedDocs = store.get(analyzedDocsSummaryAtom)
        const doc = analyzedDocs[0]

        expect(doc?.analysisReasoning).toBeDefined()
        expect(doc?.analysisReasoning?.analyzeLegalQuestionSummary).toContain(
          "Comprehensive analysis"
        )
        expect(
          doc?.analysisReasoning?.considerRelevantPrinciplesSummary
        ).toContain("impossibility doctrine")
        expect(doc?.analysisReasoning?.formulateSearchQueriesSummary).toContain(
          "Search strategy"
        )
      })
    })
  })

  describe("Error Handling with Extended Data", () => {
    it("should handle malformed extended data gracefully", async () => {
      const malformedUpdates: ResearchUpdate[] = [
        {
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: {
            docId: "doc-malformed",
            title: "Malformed Document",
            relevanceScore: 7,
            extractedEntities: "not an array" as unknown as string[],
            keyArguments: { invalid: "structure" } as unknown as string[],
          },
          message: "Malformed data test",
        },
      ]

      const mockStream = createMockStream(malformedUpdates)
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test legal question")
      })

      // Should not crash and should still store basic document info
      await waitFor(() => {
        const analyzedDocs = store.get(analyzedDocsSummaryAtom)
        expect(analyzedDocs).toHaveLength(1)
        expect(analyzedDocs[0]?.docId).toBe("doc-malformed")
        expect(analyzedDocs[0]?.title).toBe("Malformed Document")
      })
    })

    it("should handle error updates correctly", async () => {
      const failingUpdates: ResearchUpdate[] = [
        {
          type: "STATUS_CHANGE",
          stage: "ANALYZING_DOCUMENTS",
          message: "Starting analysis...",
        },
        {
          type: "ERROR",
          stage: "ANALYZING_DOCUMENTS",
          message: "Analysis failed for some documents",
        },
      ]

      const mockStream = createMockStream(failingUpdates)
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      await act(async () => {
        await result.current.startResearch("Test legal question")
      })

      await waitFor(() => {
        // Error should be reflected in status
        const status = store.get(researchStatusAtom)
        expect(status.error).toContain("Analysis failed")
        expect(status.stage).toBe("ERROR")
      })

      // Analyzed docs should be empty since no successful data updates occurred
      const analyzedDocs = store.get(analyzedDocsSummaryAtom)
      expect(analyzedDocs).toEqual([])
    })
  })

  describe("Performance and Memory", () => {
    it("should handle large datasets efficiently", async () => {
      const largeEntityList: ClientLegalEntity[] = Array.from(
        { length: 100 },
        (_, i) => ({
          name: `Entity ${i}`,
          type: "LegalConcept",
          details: `Details for entity ${i}`,
        })
      )

      const largeKeyArguments = Array.from(
        { length: 50 },
        (_, i) =>
          `This is a very detailed legal argument number ${i} that contains substantial legal reasoning and analysis.`
      )

      const updates: ResearchUpdate[] = [
        {
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: {
            docId: "large-doc",
            title: "Large Document",
            relevanceScore: 8,
            extractedEntities: largeEntityList,
            keyArguments: largeKeyArguments,
            fullText: "A".repeat(10000), // Large text content
          },
          message: "Large document processed",
        },
      ]

      const mockStream = createMockStream(updates)
      mockedConductResearch.mockResolvedValue(mockStream)

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      })

      const startTime = performance.now()

      await act(async () => {
        await result.current.startResearch("Test legal question")
      })

      await waitFor(() => {
        const analyzedDocs = store.get(analyzedDocsSummaryAtom)
        const doc = analyzedDocs[0]
        expect(doc?.extractedEntities).toHaveLength(100)
        expect(doc?.keyArguments).toHaveLength(50)
        expect(doc?.fullText).toHaveLength(10000)
      })

      const endTime = performance.now()

      // Processing should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })
})
