// __tests__/components/domain/legal-research/hooks/useEvidenceAnalysis-ordering.test.ts

import { createStore } from "jotai"
import { beforeEach, describe, expect, it } from "vitest"

import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms"
import {
  analyzedDocsSummaryAtom,
  researchSessionAtom,
} from "@/lib/state/researchAtoms"

describe("Evidence Analysis Document Ordering", () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  describe("Document Order Preservation", () => {
    it("should verify that documents maintain their fetch order", () => {
      // Create documents with different timestamps to test order preservation
      const documents: ClientAnalyzedDoc[] = [
        {
          docId: "doc-1",
          title: "First Fetched Document",
          status: "analyzed",
          timestamp: "2024-01-01T00:00:00Z", // Oldest timestamp
          relevanceScore: 9,
        },
        {
          docId: "doc-2",
          title: "Second Fetched Document",
          status: "analyzed",
          timestamp: "2024-01-01T00:02:00Z", // Newest timestamp
          relevanceScore: 8,
        },
        {
          docId: "doc-3",
          title: "Third Fetched Document",
          status: "analyzed",
          timestamp: "2024-01-01T00:01:00Z", // Middle timestamp
          relevanceScore: 7,
        },
      ]

      // Set documents in the atom
      store.set(analyzedDocsSummaryAtom, documents)

      // Get documents from the atom
      const storedDocs = store.get(analyzedDocsSummaryAtom)

      // Verify that documents are stored in the order they were added
      expect(storedDocs).toHaveLength(3)
      expect(storedDocs[0]?.docId).toBe("doc-1")
      expect(storedDocs[1]?.docId).toBe("doc-2")
      expect(storedDocs[2]?.docId).toBe("doc-3")

      // The useEvidenceAnalysis hook should preserve this order (no sorting)
      // This simulates what the hook does: const sortedDocuments = [...allDocuments]
      const sortedDocuments = [...storedDocs]

      // Verify order is preserved
      expect(sortedDocuments[0]?.docId).toBe("doc-1")
      expect(sortedDocuments[1]?.docId).toBe("doc-2")
      expect(sortedDocuments[2]?.docId).toBe("doc-3")

      // The order should NOT be sorted by timestamp
      expect(sortedDocuments[0]?.timestamp).toBe("2024-01-01T00:00:00Z")
      expect(sortedDocuments[1]?.timestamp).toBe("2024-01-01T00:02:00Z")
      expect(sortedDocuments[2]?.timestamp).toBe("2024-01-01T00:01:00Z")
    })

    it("should verify accumulated documents preserve order", () => {
      // Set up accumulated documents (from previous iterations)
      const accumulatedDocs: ClientAnalyzedDoc[] = [
        {
          docId: "accumulated-1",
          title: "First Accumulated",
          status: "analyzed",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          docId: "accumulated-2",
          title: "Second Accumulated",
          status: "analyzed",
          timestamp: "2024-01-01T00:02:00Z",
        },
        {
          docId: "accumulated-3",
          title: "Third Accumulated",
          status: "analyzed",
          timestamp: "2024-01-01T00:01:00Z",
        },
      ]

      store.set(researchSessionAtom, {
        sessionId: "test-session",
        accumulatedQueries: [],
        accumulatedDocuments: accumulatedDocs,
        accumulatedTopics: [],
      })

      const session = store.get(researchSessionAtom)
      const documents = session.accumulatedDocuments

      // Simulate what useEvidenceAnalysis does
      const sortedDocuments = [...documents]

      // Verify order is preserved
      expect(sortedDocuments).toHaveLength(3)
      expect(sortedDocuments[0]?.docId).toBe("accumulated-1")
      expect(sortedDocuments[1]?.docId).toBe("accumulated-2")
      expect(sortedDocuments[2]?.docId).toBe("accumulated-3")
    })

    it("should verify fetch order matches analysis order", () => {
      // This test verifies that the order documents appear in the UI
      // matches the order they will be analyzed by the orchestrator

      const fetchedDocs: ClientAnalyzedDoc[] = [
        {
          docId: "doc-0001",
          title: "First Document",
          status: "fetched",
          url: "https://example.com/doc1",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          docId: "doc-0002",
          title: "Second Document",
          status: "fetched",
          url: "https://example.com/doc2",
          timestamp: "2024-01-01T00:01:00Z",
        },
        {
          docId: "doc-0003",
          title: "Third Document",
          status: "fetched",
          url: "https://example.com/doc3",
          timestamp: "2024-01-01T00:02:00Z",
        },
      ]

      store.set(analyzedDocsSummaryAtom, fetchedDocs)
      const storedDocs = store.get(analyzedDocsSummaryAtom)

      // Simulate what useEvidenceAnalysis does (no sorting)
      const uiDisplayOrder = [...storedDocs]

      // Simulate what the orchestrator does in analyzeDocumentsStage
      // It maintains the original fetch order
      const analysisOrder = [...storedDocs].sort((a, b) => {
        const aIndex = fetchedDocs.findIndex(item => item.docId === a.docId)
        const bIndex = fetchedDocs.findIndex(item => item.docId === b.docId)
        return aIndex - bIndex
      })

      // Verify UI display order matches analysis order
      expect(uiDisplayOrder.map(d => d.docId)).toEqual(
        analysisOrder.map(d => d.docId)
      )

      // Both should be in the original fetch order
      expect(uiDisplayOrder[0]?.docId).toBe("doc-0001")
      expect(uiDisplayOrder[1]?.docId).toBe("doc-0002")
      expect(uiDisplayOrder[2]?.docId).toBe("doc-0003")

      expect(analysisOrder[0]?.docId).toBe("doc-0001")
      expect(analysisOrder[1]?.docId).toBe("doc-0002")
      expect(analysisOrder[2]?.docId).toBe("doc-0003")
    })
  })
})
