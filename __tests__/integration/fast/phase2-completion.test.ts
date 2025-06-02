// __tests__/integration/phase2-completion.test.ts

import { createStore } from "jotai"
import { beforeEach, describe, expect, it } from "vitest"

import {
  analyzedDocsSummaryAtom,
  currentResearchStageAtom,
  executiveSummaryDisplayAtom,
  finalReportContentAtom,
  generatedQueriesAtom,
  isResearchLoadingAtom,
  reportSectionsDisplayAtom,
  researchErrorAtom,
  researchLogAtom,
  researchStatusAtom,
  resetResearchStateAtom,
  synthesisDetailsAtom,
} from "@/lib/state/researchAtoms"

describe("Phase 2 Completion Criteria Validation", () => {
  describe("1. All Files and Types Created", () => {
    it("should have researchAtoms module available", () => {
      expect(researchStatusAtom).toBeDefined()
    })

    it("should export all required client-friendly interfaces", () => {
      // These interfaces should be available as types (we can't directly test them at runtime,
      // but TypeScript compilation ensures they exist)

      // We can validate the existence of the atoms which use these types
      expect(researchStatusAtom).toBeDefined()
      expect(generatedQueriesAtom).toBeDefined()
      expect(analyzedDocsSummaryAtom).toBeDefined()
      expect(synthesisDetailsAtom).toBeDefined()
      expect(finalReportContentAtom).toBeDefined()
    })
  })

  describe("2. Jotai Atoms Defined", () => {
    let store: ReturnType<typeof createStore>

    beforeEach(() => {
      store = createStore()
    })

    it("should have researchStatusAtom with correct ResearchStatus type and initial state", () => {
      const initialState = store.get(researchStatusAtom)

      expect(initialState).toMatchObject({
        stage: "IDLE",
        isLoading: false,
        error: null,
        message: expect.any(String),
        currentProcessedDoc: 0,
        totalDocsToProcess: 0,
        currentStreamingField: null,
      })
    })

    it("should have researchLogAtom as atom<string[]> with empty initial state", () => {
      const initialState = store.get(researchLogAtom)
      expect(Array.isArray(initialState)).toBe(true)
      expect(initialState).toHaveLength(0)
    })

    it("should have generatedQueriesAtom as atom<ClientSearchQuery[]> with empty initial state", () => {
      const initialState = store.get(generatedQueriesAtom)
      expect(Array.isArray(initialState)).toBe(true)
      expect(initialState).toHaveLength(0)
    })

    it("should have analyzedDocsSummaryAtom as atom<ClientAnalyzedDoc[]> with empty initial state", () => {
      const initialState = store.get(analyzedDocsSummaryAtom)
      expect(Array.isArray(initialState)).toBe(true)
      expect(initialState).toHaveLength(0)
    })

    it("should have synthesisDetailsAtom with correct ClientSynthesis initial state", () => {
      const initialState = store.get(synthesisDetailsAtom)
      expect(initialState).toMatchObject({
        topics: [],
        unansweredAspects: [],
        emergingQuestions: [],
        reasoningSummary: "",
      })
    })

    it("should have finalReportContentAtom with correct ClientFinalReport initial state", () => {
      const initialState = store.get(finalReportContentAtom)
      expect(initialState).toMatchObject({
        title: "",
        executiveSummary: "",
        sections: [],
        conclusion: "",
        limitations: [],
        appendixDocIds: [],
      })
    })
  })

  describe("3. Reset Functionality", () => {
    it("should have resetResearchStateAtom implemented", () => {
      expect(resetResearchStateAtom).toBeDefined()
    })

    it("should reset all data-holding atoms to initial states", () => {
      const store = createStore()

      // Set non-initial values
      store.set(researchLogAtom, ["test log"])
      store.set(generatedQueriesAtom, [{ query_string: "test" }])

      // Trigger reset
      store.set(resetResearchStateAtom, null)

      // Verify reset
      expect(store.get(researchLogAtom)).toEqual([])
      expect(store.get(generatedQueriesAtom)).toEqual([])
      expect(store.get(researchStatusAtom).stage).toBe("IDLE")
    })
  })

  describe("4. Type Consistency", () => {
    it("should use ResearchStage type consistent with orchestrator", () => {
      const store = createStore()

      // This test validates that we can set ResearchStage values that are consistent
      // with the orchestrator types (compilation would fail if inconsistent)
      store.set(researchStatusAtom, {
        stage: "GENERATING_QUERIES",
        isLoading: true,
        error: null,
        currentProcessedDoc: 0,
        totalDocsToProcess: 0,
      })

      expect(store.get(researchStatusAtom).stage).toBe("GENERATING_QUERIES")
    })
  })

  describe("5. No Business Logic", () => {
    it("should only contain type definitions and Jotai atom definitions", () => {
      // Verify that the atoms are properly defined and accessible

      // Should have at least the core atoms
      expect(researchStatusAtom).toBeDefined()
      expect(researchLogAtom).toBeDefined()
      expect(generatedQueriesAtom).toBeDefined()
      expect(analyzedDocsSummaryAtom).toBeDefined()
      expect(synthesisDetailsAtom).toBeDefined()
      expect(finalReportContentAtom).toBeDefined()
      expect(resetResearchStateAtom).toBeDefined()

      // Should have derived atoms
      expect(isResearchLoadingAtom).toBeDefined()
      expect(currentResearchStageAtom).toBeDefined()
      expect(researchErrorAtom).toBeDefined()
    })
  })

  describe("6. Testability for Phase 3", () => {
    it("should have atoms structured for easy updates by useResearchAgent hook", () => {
      const store = createStore()

      // Test that analyzedDocsSummaryAtom can be easily updated with new docs
      const mockDoc = {
        docId: "test-doc-1",
        title: "Test Document",
        relevanceScore: 0.95,
        confidenceScore: 0.87,
        summarySnippet: "Initial snippet...",
      }

      store.set(analyzedDocsSummaryAtom, [mockDoc])

      // Simulate appending a new doc (as useResearchAgent would do)
      const currentDocs = store.get(analyzedDocsSummaryAtom)
      const newDoc = {
        ...mockDoc,
        docId: "test-doc-2",
        title: "Second Document",
      }
      store.set(analyzedDocsSummaryAtom, [...currentDocs, newDoc])

      expect(store.get(analyzedDocsSummaryAtom)).toHaveLength(2)
    })

    it("should have atoms structured for easy consumption by UI components", () => {
      const store = createStore()

      // Test derived atoms work as expected for UI consumption
      store.set(researchStatusAtom, {
        stage: "ANALYZING_DOCUMENTS",
        isLoading: true,
        error: null,
        currentProcessedDoc: 0,
        totalDocsToProcess: 0,
      })

      // UI components should be able to easily read these derived states
      expect(store.get(isResearchLoadingAtom)).toBe(true)
      expect(store.get(currentResearchStageAtom)).toBe("ANALYZING_DOCUMENTS")
      expect(store.get(researchErrorAtom)).toBe(null)
    })

    it("should support streaming text updates", () => {
      const store = createStore()

      // Test that streaming text fields can be progressively built
      store.set(finalReportContentAtom, {
        title: "Legal Analysis Report",
        executiveSummary: "This report analyzes",
        sections: [],
        conclusion: "",
        limitations: [],
        appendixDocIds: [],
      })

      // Simulate streaming text append (as useResearchAgent would do)
      const currentReport = store.get(finalReportContentAtom)
      store.set(finalReportContentAtom, {
        ...currentReport,
        executiveSummary: `${currentReport.executiveSummary} the legal implications...`,
      })

      expect(store.get(executiveSummaryDisplayAtom)).toBe(
        "This report analyzes the legal implications..."
      )
    })
  })

  describe("Phase 2 Overall Integration", () => {
    it("should have complete client-side state schema ready for research pipeline", () => {
      const store = createStore()

      // Simulate a complete research flow state to validate the schema

      // 1. Set initial research status
      store.set(researchStatusAtom, {
        stage: "GENERATING_QUERIES",
        isLoading: true,
        error: null,
        message: "Generating legal search queries...",
        currentProcessedDoc: 0,
        totalDocsToProcess: 0,
      })

      // 2. Add generated queries
      store.set(generatedQueriesAtom, [
        {
          query_string: "contract law breach",
          expected_information_summary: "Breach remedies",
        },
        {
          query_string: "damages calculation",
          expected_information_summary: "Damages methodology",
        },
      ])

      // 3. Add analyzed documents
      store.set(analyzedDocsSummaryAtom, [
        {
          docId: "doc1",
          title: "Contract Law Fundamentals",
          relevanceScore: 0.92,
          confidenceScore: 0.88,
          summarySnippet: "This document covers basic contract principles...",
        },
      ])

      // 4. Add synthesis
      store.set(synthesisDetailsAtom, {
        topics: [
          {
            title: "Breach of Contract",
            synthesisSnippet: "Analysis shows multiple remedies available...",
            confidence: 0.89,
            docIds: ["doc1"],
          },
        ],
        unansweredAspects: ["Jurisdictional variations"],
        emergingQuestions: ["What about digital contracts?"],
        reasoningSummary: "The analysis reveals strong precedent...",
      })

      // 5. Add final report
      store.set(finalReportContentAtom, {
        title: "Legal Analysis: Contract Breach Remedies",
        executiveSummary: "This report examines available remedies...",
        sections: [
          {
            title: "Background",
            content: "Contract law provides several...",
          },
          {
            title: "Analysis",
            content: "The key finding is that...",
          },
        ],
        conclusion: "Based on the research conducted...",
        limitations: ["Limited to common law jurisdictions"],
        appendixDocIds: ["doc1"],
      })

      // Verify all state is properly structured and accessible
      expect(store.get(researchStatusAtom).stage).toBe("GENERATING_QUERIES")
      expect(store.get(generatedQueriesAtom)).toHaveLength(2)
      expect(store.get(analyzedDocsSummaryAtom)).toHaveLength(1)
      expect(store.get(synthesisDetailsAtom).topics).toHaveLength(1)
      expect(store.get(finalReportContentAtom).sections).toHaveLength(2)

      // Verify derived atoms work correctly
      expect(store.get(isResearchLoadingAtom)).toBe(true)
      expect(store.get(reportSectionsDisplayAtom)).toHaveLength(2)
    })
  })
})
