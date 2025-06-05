// __tests__/components/domain/legal-research/evidence-analysis-document-states.test.ts

import { createStore } from "jotai"
import { beforeEach, describe, expect, it } from "vitest"

import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms"
import {
  analyzedDocsSummaryAtom,
  selectedAnalyzedDocIdAtom,
} from "@/lib/state/researchAtoms"

describe("Evidence Analysis Component - Document States", () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  describe("Document Status Display", () => {
    it("should show fetched documents with limited information", () => {
      const fetchedDoc: ClientAnalyzedDoc = {
        docId: "fetched-doc-1",
        title: "Contract Law Fundamentals",
        url: "https://example.com/contract-law",
        source: "Westlaw",
        status: "fetched",
        timestamp: "2024-01-01T00:00:00Z",
      }

      store.set(analyzedDocsSummaryAtom, [fetchedDoc])

      const docs = store.get(analyzedDocsSummaryAtom)
      expect(docs).toHaveLength(1)
      expect(docs[0]).toMatchObject({
        docId: "fetched-doc-1",
        title: "Contract Law Fundamentals",
        status: "fetched",
      })

      // Verify analysis fields are undefined
      expect(docs[0]?.relevanceScore).toBeUndefined()
      expect(docs[0]?.summarySnippet).toBeUndefined()
      expect(docs[0]?.keyArguments).toBeUndefined()
    })

    it("should show analyzing documents with loading indicators", () => {
      const analyzingDoc: ClientAnalyzedDoc = {
        docId: "analyzing-doc-1",
        title: "Force Majeure Case Study",
        url: "https://example.com/force-majeure",
        source: "LexisNexis",
        status: "analyzing",
        timestamp: "2024-01-01T00:01:00Z",
        fullText: "This document discusses force majeure clauses...",
      }

      store.set(analyzedDocsSummaryAtom, [analyzingDoc])

      const docs = store.get(analyzedDocsSummaryAtom)
      expect(docs).toHaveLength(1)
      expect(docs[0]).toMatchObject({
        docId: "analyzing-doc-1",
        title: "Force Majeure Case Study",
        status: "analyzing",
        fullText: expect.any(String),
      })

      // Verify analysis fields are still undefined during analysis
      expect(docs[0]?.relevanceScore).toBeUndefined()
      expect(docs[0]?.summarySnippet).toBeUndefined()
    })

    it("should show fully analyzed documents with complete information", () => {
      const analyzedDoc: ClientAnalyzedDoc = {
        docId: "analyzed-doc-1",
        title: "Supreme Court Contract Decision",
        url: "https://example.com/supreme-court",
        source: "Court Records",
        status: "analyzed",
        timestamp: "2024-01-01T00:02:00Z",
        fullText: "Complete court decision text...",
        relevanceScore: 9,
        confidenceScore: 8,
        summarySnippet:
          "This case establishes precedent for contract interpretation during emergencies.",
        keyArguments: [
          "Contract terms must be interpreted in context",
          "Emergency conditions may excuse performance",
        ],
        extractedEntities: [
          {
            name: "Supreme Court",
            type: "Organization",
            details: "Highest court in jurisdiction",
          },
        ],
        analysisReasoning: {
          analyzeLegalQuestionSummary: "Comprehensive analysis of contract law",
          considerRelevantPrinciplesSummary:
            "Applied relevant legal principles",
        },
      }

      store.set(analyzedDocsSummaryAtom, [analyzedDoc])

      const docs = store.get(analyzedDocsSummaryAtom)
      expect(docs).toHaveLength(1)
      expect(docs[0]).toMatchObject({
        docId: "analyzed-doc-1",
        title: "Supreme Court Contract Decision",
        status: "analyzed",
        relevanceScore: 9,
        summarySnippet: expect.stringContaining("establishes precedent"),
        keyArguments: expect.arrayContaining([
          "Contract terms must be interpreted in context",
        ]),
      })
    })

    it("should show error documents with error information", () => {
      const errorDoc: ClientAnalyzedDoc = {
        docId: "error-doc-1",
        title: "Failed Document",
        url: "https://example.com/failed",
        source: "Unknown",
        status: "error",
        timestamp: "2024-01-01T00:03:00Z",
        errorMessage: "Network timeout during analysis",
      }

      store.set(analyzedDocsSummaryAtom, [errorDoc])

      const docs = store.get(analyzedDocsSummaryAtom)
      expect(docs).toHaveLength(1)
      expect(docs[0]).toMatchObject({
        docId: "error-doc-1",
        title: "Failed Document",
        status: "error",
        errorMessage: "Network timeout during analysis",
      })
    })
  })

  describe("Mixed Document States", () => {
    it("should handle documents in different states simultaneously", () => {
      const mixedDocs: ClientAnalyzedDoc[] = [
        {
          docId: "doc-fetched",
          title: "Fetched Document",
          status: "fetched",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          docId: "doc-analyzing",
          title: "Analyzing Document",
          status: "analyzing",
          timestamp: "2024-01-01T00:01:00Z",
        },
        {
          docId: "doc-analyzed",
          title: "Analyzed Document",
          status: "analyzed",
          timestamp: "2024-01-01T00:02:00Z",
          relevanceScore: 8,
          summarySnippet: "Analysis complete",
        },
        {
          docId: "doc-error",
          title: "Error Document",
          status: "error",
          timestamp: "2024-01-01T00:03:00Z",
          errorMessage: "Failed to process",
        },
      ]

      store.set(analyzedDocsSummaryAtom, mixedDocs)

      const docs = store.get(analyzedDocsSummaryAtom)
      expect(docs).toHaveLength(4)

      // Verify each document has the correct status
      const statusCounts = docs.reduce(
        (acc, doc) => {
          acc[doc.status] = (acc[doc.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      expect(statusCounts).toEqual({
        fetched: 1,
        analyzing: 1,
        analyzed: 1,
        error: 1,
      })
    })

    it("should maintain document order based on timestamp", () => {
      const docs: ClientAnalyzedDoc[] = [
        {
          docId: "doc-3",
          title: "Third Document",
          status: "fetched",
          timestamp: "2024-01-01T00:02:00Z",
        },
        {
          docId: "doc-1",
          title: "First Document",
          status: "analyzed",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          docId: "doc-2",
          title: "Second Document",
          status: "analyzing",
          timestamp: "2024-01-01T00:01:00Z",
        },
      ]

      store.set(analyzedDocsSummaryAtom, docs)

      const storedDocs = store.get(analyzedDocsSummaryAtom)
      expect(storedDocs).toHaveLength(3)

      // Verify order is preserved as added (not sorted by timestamp in state)
      expect(storedDocs[0]?.docId).toBe("doc-3")
      expect(storedDocs[1]?.docId).toBe("doc-1")
      expect(storedDocs[2]?.docId).toBe("doc-2")
    })
  })

  describe("Document State Transitions", () => {
    it("should transition document from fetched to analyzing", () => {
      // Start with fetched document
      const fetchedDoc: ClientAnalyzedDoc = {
        docId: "transition-doc",
        title: "Transition Test Document",
        status: "fetched",
        timestamp: "2024-01-01T00:00:00Z",
      }

      store.set(analyzedDocsSummaryAtom, [fetchedDoc])

      // Transition to analyzing
      const currentDocs = store.get(analyzedDocsSummaryAtom)
      const updatedDocs = currentDocs.map(doc =>
        doc.docId === "transition-doc"
          ? { ...doc, status: "analyzing" as const }
          : doc
      )
      store.set(analyzedDocsSummaryAtom, updatedDocs)

      const docs = store.get(analyzedDocsSummaryAtom)
      expect(docs[0]?.status).toBe("analyzing")
      expect(docs[0]?.docId).toBe("transition-doc")
    })

    it("should transition document from analyzing to analyzed with data", () => {
      // Start with analyzing document
      const analyzingDoc: ClientAnalyzedDoc = {
        docId: "transition-doc-2",
        title: "Analysis Complete Document",
        status: "analyzing",
        timestamp: "2024-01-01T00:00:00Z",
      }

      store.set(analyzedDocsSummaryAtom, [analyzingDoc])

      // Transition to analyzed with data
      const currentDocs = store.get(analyzedDocsSummaryAtom)
      const updatedDocs = currentDocs.map(doc =>
        doc.docId === "transition-doc-2"
          ? {
              ...doc,
              status: "analyzed" as const,
              relevanceScore: 7,
              summarySnippet: "Analysis completed successfully",
              keyArguments: ["Key point 1", "Key point 2"],
            }
          : doc
      )
      store.set(analyzedDocsSummaryAtom, updatedDocs)

      const docs = store.get(analyzedDocsSummaryAtom)
      expect(docs[0]).toMatchObject({
        docId: "transition-doc-2",
        status: "analyzed",
        relevanceScore: 7,
        summarySnippet: "Analysis completed successfully",
        keyArguments: ["Key point 1", "Key point 2"],
      })
    })

    it("should handle transition from analyzing to error", () => {
      // Start with analyzing document
      const analyzingDoc: ClientAnalyzedDoc = {
        docId: "transition-error-doc",
        title: "Failed Analysis Document",
        status: "analyzing",
        timestamp: "2024-01-01T00:00:00Z",
      }

      store.set(analyzedDocsSummaryAtom, [analyzingDoc])

      // Transition to error
      const currentDocs = store.get(analyzedDocsSummaryAtom)
      const updatedDocs = currentDocs.map(doc =>
        doc.docId === "transition-error-doc"
          ? {
              ...doc,
              status: "error" as const,
              errorMessage: "Analysis failed due to timeout",
            }
          : doc
      )
      store.set(analyzedDocsSummaryAtom, updatedDocs)

      const docs = store.get(analyzedDocsSummaryAtom)
      expect(docs[0]).toMatchObject({
        docId: "transition-error-doc",
        status: "error",
        errorMessage: "Analysis failed due to timeout",
      })
    })
  })

  describe("Document Selection with Different States", () => {
    it("should allow selection of documents in any state", () => {
      const docs: ClientAnalyzedDoc[] = [
        {
          docId: "selectable-fetched",
          title: "Fetched Document",
          status: "fetched",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          docId: "selectable-analyzing",
          title: "Analyzing Document",
          status: "analyzing",
          timestamp: "2024-01-01T00:01:00Z",
        },
        {
          docId: "selectable-analyzed",
          title: "Analyzed Document",
          status: "analyzed",
          timestamp: "2024-01-01T00:02:00Z",
          relevanceScore: 9,
        },
      ]

      store.set(analyzedDocsSummaryAtom, docs)

      // Test selecting each type of document
      store.set(selectedAnalyzedDocIdAtom, "selectable-fetched")
      expect(store.get(selectedAnalyzedDocIdAtom)).toBe("selectable-fetched")

      store.set(selectedAnalyzedDocIdAtom, "selectable-analyzing")
      expect(store.get(selectedAnalyzedDocIdAtom)).toBe("selectable-analyzing")

      store.set(selectedAnalyzedDocIdAtom, "selectable-analyzed")
      expect(store.get(selectedAnalyzedDocIdAtom)).toBe("selectable-analyzed")
    })

    it("should show appropriate details based on document status", () => {
      const docs: ClientAnalyzedDoc[] = [
        {
          docId: "detail-fetched",
          title: "Fetched for Details",
          url: "https://example.com/fetched",
          source: "Test Source",
          status: "fetched",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          docId: "detail-analyzed",
          title: "Analyzed for Details",
          url: "https://example.com/analyzed",
          source: "Test Source",
          status: "analyzed",
          timestamp: "2024-01-01T00:01:00Z",
          relevanceScore: 8,
          summarySnippet: "Detailed analysis available",
          keyArguments: ["Argument 1", "Argument 2"],
        },
      ]

      store.set(analyzedDocsSummaryAtom, docs)

      // Select fetched document
      store.set(selectedAnalyzedDocIdAtom, "detail-fetched")
      const selectedFetched = docs.find(doc => doc.docId === "detail-fetched")

      expect(selectedFetched?.status).toBe("fetched")
      expect(selectedFetched?.relevanceScore).toBeUndefined()
      expect(selectedFetched?.summarySnippet).toBeUndefined()

      // Select analyzed document
      store.set(selectedAnalyzedDocIdAtom, "detail-analyzed")
      const selectedAnalyzed = docs.find(doc => doc.docId === "detail-analyzed")

      expect(selectedAnalyzed?.status).toBe("analyzed")
      expect(selectedAnalyzed?.relevanceScore).toBe(8)
      expect(selectedAnalyzed?.summarySnippet).toBe(
        "Detailed analysis available"
      )
    })
  })

  describe("UI State Helpers", () => {
    it("should identify documents that can show detailed analysis", () => {
      const docs: ClientAnalyzedDoc[] = [
        {
          docId: "no-analysis",
          status: "fetched",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          docId: "partial-analysis",
          status: "analyzing",
          timestamp: "2024-01-01T00:01:00Z",
        },
        {
          docId: "full-analysis",
          status: "analyzed",
          timestamp: "2024-01-01T00:02:00Z",
          relevanceScore: 8,
          summarySnippet: "Complete analysis",
        },
      ]

      const hasDetailedAnalysis = (doc: ClientAnalyzedDoc) =>
        doc.status === "analyzed" &&
        (doc.relevanceScore !== undefined || doc.summarySnippet !== undefined)

      expect(hasDetailedAnalysis(docs[0] as ClientAnalyzedDoc)).toBe(false)
      expect(hasDetailedAnalysis(docs[1] as ClientAnalyzedDoc)).toBe(false)
      expect(hasDetailedAnalysis(docs[2] as ClientAnalyzedDoc)).toBe(true)
    })

    it("should identify documents that are still processing", () => {
      const docs: ClientAnalyzedDoc[] = [
        {
          docId: "done-1",
          status: "fetched",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          docId: "processing-1",
          status: "analyzing",
          timestamp: "2024-01-01T00:01:00Z",
        },
        {
          docId: "done-2",
          status: "analyzed",
          timestamp: "2024-01-01T00:02:00Z",
        },
        {
          docId: "failed-1",
          status: "error",
          timestamp: "2024-01-01T00:03:00Z",
        },
      ]

      const isProcessing = (doc: ClientAnalyzedDoc) =>
        doc.status === "analyzing"

      expect(isProcessing(docs[0] as ClientAnalyzedDoc)).toBe(false)
      expect(isProcessing(docs[1] as ClientAnalyzedDoc)).toBe(true)
      expect(isProcessing(docs[2] as ClientAnalyzedDoc)).toBe(false)
      expect(isProcessing(docs[3] as ClientAnalyzedDoc)).toBe(false)
    })

    it("should identify documents that need error handling", () => {
      const docs: ClientAnalyzedDoc[] = [
        { docId: "ok-1", status: "fetched", timestamp: "2024-01-01T00:00:00Z" },
        {
          docId: "ok-2",
          status: "analyzed",
          timestamp: "2024-01-01T00:01:00Z",
        },
        {
          docId: "error-1",
          status: "error",
          timestamp: "2024-01-01T00:02:00Z",
          errorMessage: "Failed",
        },
      ]

      const hasError = (doc: ClientAnalyzedDoc) => doc.status === "error"

      expect(hasError(docs[0] as ClientAnalyzedDoc)).toBe(false)
      expect(hasError(docs[1] as ClientAnalyzedDoc)).toBe(false)
      expect(hasError(docs[2] as ClientAnalyzedDoc)).toBe(true)
    })
  })
})
