// __tests__/lib/state/documentStates.test.ts

import { describe, expect, it } from "vitest"

import type {
  ClientAnalyzedDoc,
  DocumentStatus,
} from "@/lib/state/researchAtoms"

describe("Document States and Transitions", () => {
  describe("DocumentStatus Type", () => {
    it("should have correct status values", () => {
      const fetchedStatus: DocumentStatus = "fetched"
      const analyzingStatus: DocumentStatus = "analyzing"
      const analyzedStatus: DocumentStatus = "analyzed"
      const errorStatus: DocumentStatus = "error"

      expect(fetchedStatus).toBe("fetched")
      expect(analyzingStatus).toBe("analyzing")
      expect(analyzedStatus).toBe("analyzed")
      expect(errorStatus).toBe("error")
    })
  })

  describe("ClientAnalyzedDoc with Status", () => {
    it("should create a fetched document with minimal data", () => {
      const fetchedDoc: ClientAnalyzedDoc = {
        docId: "test-doc-1",
        title: "Test Document Title",
        url: "https://example.com/doc1",
        status: "fetched",
        timestamp: "2024-01-01T00:00:00Z",
      }

      expect(fetchedDoc.status).toBe("fetched")
      expect(fetchedDoc.docId).toBe("test-doc-1")
      expect(fetchedDoc.title).toBe("Test Document Title")
      expect(fetchedDoc.url).toBe("https://example.com/doc1")

      // Analysis fields should be undefined for fetched documents
      expect(fetchedDoc.relevanceScore).toBeUndefined()
      expect(fetchedDoc.summarySnippet).toBeUndefined()
      expect(fetchedDoc.keyArguments).toBeUndefined()
      expect(fetchedDoc.extractedEntities).toBeUndefined()
      expect(fetchedDoc.analysisReasoning).toBeUndefined()
    })

    it("should create an analyzing document with partial data", () => {
      const analyzingDoc: ClientAnalyzedDoc = {
        docId: "test-doc-2",
        title: "Test Document Title",
        url: "https://example.com/doc2",
        status: "analyzing",
        timestamp: "2024-01-01T00:00:00Z",
        fullText: "Document content from Exa API...",
      }

      expect(analyzingDoc.status).toBe("analyzing")
      expect(analyzingDoc.fullText).toBeDefined()

      // Analysis fields should still be undefined during analysis
      expect(analyzingDoc.relevanceScore).toBeUndefined()
      expect(analyzingDoc.summarySnippet).toBeUndefined()
      expect(analyzingDoc.keyArguments).toBeUndefined()
    })

    it("should create a fully analyzed document with complete data", () => {
      const analyzedDoc: ClientAnalyzedDoc = {
        docId: "test-doc-3",
        title: "Test Document Title",
        url: "https://example.com/doc3",
        status: "analyzed",
        timestamp: "2024-01-01T00:00:00Z",
        fullText: "Document content from Exa API...",
        relevanceScore: 8,
        confidenceScore: 9,
        summarySnippet: "This document discusses important legal concepts...",
        keyArguments: ["Argument 1", "Argument 2"],
        extractedEntities: [
          {
            name: "Supreme Court",
            type: "Organization",
            details: "The highest court in the United States",
          },
        ],
        extractedQuotes: ["Important legal quote here"],
        counterArguments: ["Counter argument 1"],
        analysisReasoning: {
          analyzeLegalQuestionSummary: "Analysis summary",
          considerRelevantPrinciplesSummary: "Principles summary",
        },
      }

      expect(analyzedDoc.status).toBe("analyzed")
      expect(analyzedDoc.relevanceScore).toBe(8)
      expect(analyzedDoc.summarySnippet).toBeDefined()
      expect(analyzedDoc.keyArguments).toHaveLength(2)
      expect(analyzedDoc.extractedEntities).toHaveLength(1)
      expect(analyzedDoc.analysisReasoning).toBeDefined()
    })

    it("should create an error document when analysis fails", () => {
      const errorDoc: ClientAnalyzedDoc = {
        docId: "test-doc-4",
        title: "Test Document Title",
        url: "https://example.com/doc4",
        status: "error",
        timestamp: "2024-01-01T00:00:00Z",
        errorMessage: "Failed to analyze document due to API timeout",
      }

      expect(errorDoc.status).toBe("error")
      expect(errorDoc.errorMessage).toBe(
        "Failed to analyze document due to API timeout"
      )

      // Analysis fields should be undefined for error documents
      expect(errorDoc.relevanceScore).toBeUndefined()
      expect(errorDoc.summarySnippet).toBeUndefined()
    })
  })

  describe("Document State Transitions", () => {
    it("should transition from fetched to analyzing", () => {
      const fetchedDoc: ClientAnalyzedDoc = {
        docId: "test-doc-5",
        title: "Test Document",
        url: "https://example.com/doc5",
        status: "fetched",
        timestamp: "2024-01-01T00:00:00Z",
      }

      const analyzingDoc: ClientAnalyzedDoc = {
        ...fetchedDoc,
        status: "analyzing",
        fullText: "Document content loaded...",
      }

      expect(fetchedDoc.status).toBe("fetched")
      expect(analyzingDoc.status).toBe("analyzing")
      expect(analyzingDoc.docId).toBe(fetchedDoc.docId)
      expect(analyzingDoc.fullText).toBeDefined()
    })

    it("should transition from analyzing to analyzed", () => {
      const analyzingDoc: ClientAnalyzedDoc = {
        docId: "test-doc-6",
        title: "Test Document",
        url: "https://example.com/doc6",
        status: "analyzing",
        timestamp: "2024-01-01T00:00:00Z",
        fullText: "Document content...",
      }

      const analyzedDoc: ClientAnalyzedDoc = {
        ...analyzingDoc,
        status: "analyzed",
        relevanceScore: 7,
        summarySnippet: "Analysis complete",
        keyArguments: ["Key argument"],
      }

      expect(analyzingDoc.status).toBe("analyzing")
      expect(analyzedDoc.status).toBe("analyzed")
      expect(analyzedDoc.docId).toBe(analyzingDoc.docId)
      expect(analyzedDoc.relevanceScore).toBe(7)
      expect(analyzedDoc.summarySnippet).toBe("Analysis complete")
    })

    it("should transition from analyzing to error", () => {
      const analyzingDoc: ClientAnalyzedDoc = {
        docId: "test-doc-7",
        title: "Test Document",
        url: "https://example.com/doc7",
        status: "analyzing",
        timestamp: "2024-01-01T00:00:00Z",
        fullText: "Document content...",
      }

      const errorDoc: ClientAnalyzedDoc = {
        ...analyzingDoc,
        status: "error",
        errorMessage: "Analysis failed",
      }

      expect(analyzingDoc.status).toBe("analyzing")
      expect(errorDoc.status).toBe("error")
      expect(errorDoc.docId).toBe(analyzingDoc.docId)
      expect(errorDoc.errorMessage).toBe("Analysis failed")
    })
  })

  describe("Status Helper Functions", () => {
    it("should identify fetched documents", () => {
      const doc: ClientAnalyzedDoc = {
        docId: "test",
        status: "fetched",
        timestamp: "2024-01-01T00:00:00Z",
      }

      const isFetched = (doc: ClientAnalyzedDoc) => doc.status === "fetched"
      expect(isFetched(doc)).toBe(true)
    })

    it("should identify if document has analysis data", () => {
      const fetchedDoc: ClientAnalyzedDoc = {
        docId: "test-fetched",
        status: "fetched",
        timestamp: "2024-01-01T00:00:00Z",
      }

      const analyzedDoc: ClientAnalyzedDoc = {
        docId: "test-analyzed",
        status: "analyzed",
        timestamp: "2024-01-01T00:00:00Z",
        relevanceScore: 8,
        summarySnippet: "Analysis complete",
      }

      const hasAnalysisData = (doc: ClientAnalyzedDoc) =>
        doc.status === "analyzed" &&
        (doc.relevanceScore !== undefined || doc.summarySnippet !== undefined)

      expect(hasAnalysisData(fetchedDoc)).toBe(false)
      expect(hasAnalysisData(analyzedDoc)).toBe(true)
    })

    it("should identify documents that can be analyzed", () => {
      const fetchedDoc: ClientAnalyzedDoc = {
        docId: "test-1",
        status: "fetched",
        timestamp: "2024-01-01T00:00:00Z",
      }

      const analyzingDoc: ClientAnalyzedDoc = {
        docId: "test-2",
        status: "analyzing",
        timestamp: "2024-01-01T00:00:00Z",
      }

      const analyzedDoc: ClientAnalyzedDoc = {
        docId: "test-3",
        status: "analyzed",
        timestamp: "2024-01-01T00:00:00Z",
      }

      const errorDoc: ClientAnalyzedDoc = {
        docId: "test-4",
        status: "error",
        timestamp: "2024-01-01T00:00:00Z",
      }

      const canBeAnalyzed = (doc: ClientAnalyzedDoc) =>
        doc.status === "fetched" || doc.status === "error"

      expect(canBeAnalyzed(fetchedDoc)).toBe(true)
      expect(canBeAnalyzed(analyzingDoc)).toBe(false)
      expect(canBeAnalyzed(analyzedDoc)).toBe(false)
      expect(canBeAnalyzed(errorDoc)).toBe(true) // Can retry failed analysis
    })
  })
})
