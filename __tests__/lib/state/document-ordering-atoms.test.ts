/**
 * @file Document Ordering Atoms Tests
 *
 * Tests for the orderedDocumentsAtom and related state management
 * functionality to ensure consistent document ordering in the UI.
 */

import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms"
import {
  analyzedDocsSummaryAtom,
  orderedDocumentsAtom,
  researchSessionAtom,
} from "@/lib/state/researchAtoms"
import { createStore } from "jotai"
import { beforeEach, describe, expect, it } from "vitest"

describe("Document Ordering Atoms", () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  describe("orderedDocumentsAtom", () => {
    it("should sort documents by globalSequenceNumber in ascending order", () => {
      // Setup test documents with out-of-order sequence numbers
      const unorderedDocs: ClientAnalyzedDoc[] = [
        {
          docId: "doc3",
          status: "analyzed",
          globalSequenceNumber: 2,
          title: "Third Document",
        },
        {
          docId: "doc1",
          status: "analyzed",
          globalSequenceNumber: 0,
          title: "First Document",
        },
        {
          docId: "doc2",
          status: "analyzed",
          globalSequenceNumber: 1,
          title: "Second Document",
        },
      ]

      store.set(analyzedDocsSummaryAtom, unorderedDocs)

      const orderedDocs = store.get(orderedDocumentsAtom)

      expect(orderedDocs).toHaveLength(3)
      expect(orderedDocs[0]?.docId).toBe("doc1")
      expect(orderedDocs[1]?.docId).toBe("doc2")
      expect(orderedDocs[2]?.docId).toBe("doc3")
      expect(orderedDocs.map(d => d.globalSequenceNumber)).toEqual([0, 1, 2])
    })

    it("should prioritize accumulated documents over current session documents", () => {
      const currentSessionDocs: ClientAnalyzedDoc[] = [
        {
          docId: "session-doc1",
          status: "analyzed",
          globalSequenceNumber: 10,
        },
      ]

      const accumulatedDocs: ClientAnalyzedDoc[] = [
        {
          docId: "acc-doc1",
          status: "analyzed",
          globalSequenceNumber: 0,
        },
        {
          docId: "acc-doc2",
          status: "analyzed",
          globalSequenceNumber: 1,
        },
      ]

      store.set(analyzedDocsSummaryAtom, currentSessionDocs)
      store.set(researchSessionAtom, {
        sessionId: "test-session",
        accumulatedQueries: [],
        accumulatedDocuments: accumulatedDocs,
        accumulatedTopics: [],
      })

      const orderedDocs = store.get(orderedDocumentsAtom)

      expect(orderedDocs).toHaveLength(2)
      expect(orderedDocs[0]?.docId).toBe("acc-doc1")
      expect(orderedDocs[1]?.docId).toBe("acc-doc2")
      // Should not include session docs when accumulated docs exist
      expect(orderedDocs.find(d => d.docId === "session-doc1")).toBeUndefined()
    })

    it("should handle documents without globalSequenceNumber (backward compatibility)", () => {
      const mixedDocs: ClientAnalyzedDoc[] = [
        {
          docId: "new-doc",
          status: "analyzed",
          globalSequenceNumber: 0,
          timestamp: "2023-01-02T00:00:00Z",
        },
        {
          docId: "legacy-doc1",
          status: "analyzed",
          // No globalSequenceNumber (legacy)
          timestamp: "2023-01-01T00:00:00Z",
        },
        {
          docId: "legacy-doc2",
          status: "analyzed",
          // No globalSequenceNumber (legacy)
          timestamp: "2023-01-03T00:00:00Z",
        },
      ]

      store.set(analyzedDocsSummaryAtom, mixedDocs)

      const orderedDocs = store.get(orderedDocumentsAtom)

      expect(orderedDocs).toHaveLength(3)
      // Document with sequence number should come first
      expect(orderedDocs[0]?.docId).toBe("new-doc")
      // Legacy documents should be sorted by timestamp
      expect(orderedDocs[1]?.docId).toBe("legacy-doc1")
      expect(orderedDocs[2]?.docId).toBe("legacy-doc2")
    })

    it("should handle documents with all undefined sequence numbers and timestamps", () => {
      const docsWithoutMetadata: ClientAnalyzedDoc[] = [
        {
          docId: "doc-a",
          status: "analyzed",
        },
        {
          docId: "doc-b",
          status: "analyzed",
        },
      ]

      store.set(analyzedDocsSummaryAtom, docsWithoutMetadata)

      const orderedDocs = store.get(orderedDocumentsAtom)

      expect(orderedDocs).toHaveLength(2)
      // Should preserve original order when no ordering metadata is available
      expect(orderedDocs[0]?.docId).toBe("doc-a")
      expect(orderedDocs[1]?.docId).toBe("doc-b")
    })

    it("should handle empty document arrays", () => {
      store.set(analyzedDocsSummaryAtom, [])
      store.set(researchSessionAtom, {
        sessionId: null,
        accumulatedQueries: [],
        accumulatedDocuments: [],
        accumulatedTopics: [],
      })

      const orderedDocs = store.get(orderedDocumentsAtom)

      expect(orderedDocs).toHaveLength(0)
      expect(orderedDocs).toEqual([])
    })

    it("should handle mixed iteration indexes correctly", () => {
      const multiIterationDocs: ClientAnalyzedDoc[] = [
        {
          docId: "iter1-doc1",
          status: "analyzed",
          globalSequenceNumber: 2,
          iterationIndex: 1,
        },
        {
          docId: "iter0-doc1",
          status: "analyzed",
          globalSequenceNumber: 0,
          iterationIndex: 0,
        },
        {
          docId: "iter0-doc2",
          status: "analyzed",
          globalSequenceNumber: 1,
          iterationIndex: 0,
        },
        {
          docId: "iter1-doc2",
          status: "analyzed",
          globalSequenceNumber: 3,
          iterationIndex: 1,
        },
      ]

      store.set(analyzedDocsSummaryAtom, multiIterationDocs)

      const orderedDocs = store.get(orderedDocumentsAtom)

      expect(orderedDocs).toHaveLength(4)
      // Should be ordered by global sequence, not iteration
      expect(orderedDocs[0]?.docId).toBe("iter0-doc1")
      expect(orderedDocs[1]?.docId).toBe("iter0-doc2")
      expect(orderedDocs[2]?.docId).toBe("iter1-doc1")
      expect(orderedDocs[3]?.docId).toBe("iter1-doc2")
      expect(orderedDocs.map(d => d.globalSequenceNumber)).toEqual([0, 1, 2, 3])
    })

    it("should maintain stable ordering for documents with same sequence number", () => {
      // This edge case shouldn't happen in practice, but we should handle it gracefully
      const docsWithDuplicateSequence: ClientAnalyzedDoc[] = [
        {
          docId: "doc-first",
          status: "analyzed",
          globalSequenceNumber: 1,
          timestamp: "2023-01-01T00:00:00Z",
        },
        {
          docId: "doc-second",
          status: "analyzed",
          globalSequenceNumber: 1, // Same sequence number
          timestamp: "2023-01-02T00:00:00Z",
        },
      ]

      store.set(analyzedDocsSummaryAtom, docsWithDuplicateSequence)

      const orderedDocs = store.get(orderedDocumentsAtom)

      expect(orderedDocs).toHaveLength(2)
      // Should maintain array order when sequence numbers are identical
      expect(orderedDocs[0]?.docId).toBe("doc-first")
      expect(orderedDocs[1]?.docId).toBe("doc-second")
    })
  })
})
