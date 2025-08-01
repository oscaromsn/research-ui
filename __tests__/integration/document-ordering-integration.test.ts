/**
 * @file Document Ordering Integration Tests
 *
 * Integration tests to verify that the document ordering system works end-to-end:
 * 1. Orchestrator assigns correct globalSequenceNumber values
 * 2. Documents are enriched with ordering metadata
 * 3. UI components receive documents in the correct order via orderedDocumentsAtom
 * 4. Multiple research iterations maintain ordering consistency
 *
 * This validates the complete pipeline from orchestrator → state management → UI display.
 */

import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";
import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms";
import {
  analyzedDocsSummaryAtom,
  orderedDocumentsAtom,
  researchSessionAtom,
} from "@/lib/state/researchAtoms";

describe("Document Ordering Integration", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe("Orchestrator Integration", () => {
    it("should maintain sequence order when documents arrive out of order from orchestrator", () => {
      // Simulate documents arriving from orchestrator in the order they might be processed
      // (not necessarily in sequence order due to async processing)
      const documentsFromOrchestrator: ClientAnalyzedDoc[] = [
        {
          docId: "doc-3",
          status: "analyzed",
          title: "Third Document",
          globalSequenceNumber: 2,
          iterationIndex: 0,
          fetchBatchIndex: 1,
          fetchOrderIndex: 0,
          searchQueryId: "legal cases",
          fetchTimestamp: "2023-01-01T10:02:00Z",
        },
        {
          docId: "doc-1",
          status: "analyzed",
          title: "First Document",
          globalSequenceNumber: 0,
          iterationIndex: 0,
          fetchBatchIndex: 0,
          fetchOrderIndex: 0,
          searchQueryId: "statutes",
          fetchTimestamp: "2023-01-01T10:00:00Z",
        },
        {
          docId: "doc-2",
          status: "analyzed",
          title: "Second Document",
          globalSequenceNumber: 1,
          iterationIndex: 0,
          fetchBatchIndex: 0,
          fetchOrderIndex: 1,
          searchQueryId: "statutes",
          fetchTimestamp: "2023-01-01T10:01:00Z",
        },
      ];

      // Simulate useResearchAgent updating the atom as documents are processed
      store.set(analyzedDocsSummaryAtom, documentsFromOrchestrator);

      // UI should receive documents in correct order regardless of processing order
      const orderedDocs = store.get(orderedDocumentsAtom);

      expect(orderedDocs).toHaveLength(3);
      expect(orderedDocs[0]?.docId).toBe("doc-1");
      expect(orderedDocs[0]?.globalSequenceNumber).toBe(0);
      expect(orderedDocs[1]?.docId).toBe("doc-2");
      expect(orderedDocs[1]?.globalSequenceNumber).toBe(1);
      expect(orderedDocs[2]?.docId).toBe("doc-3");
      expect(orderedDocs[2]?.globalSequenceNumber).toBe(2);
    });

    it("should handle multi-iteration research sessions with continuous sequence numbering", () => {
      // Simulate first iteration documents
      const iteration0Docs: ClientAnalyzedDoc[] = [
        {
          docId: "iter0-doc1",
          status: "analyzed",
          globalSequenceNumber: 0,
          iterationIndex: 0,
          fetchTimestamp: "2023-01-01T10:00:00Z",
        },
        {
          docId: "iter0-doc2",
          status: "analyzed",
          globalSequenceNumber: 1,
          iterationIndex: 0,
          fetchTimestamp: "2023-01-01T10:01:00Z",
        },
      ];

      // Simulate second iteration documents (sequence continues from first iteration)
      const iteration1Docs: ClientAnalyzedDoc[] = [
        {
          docId: "iter1-doc1",
          status: "analyzed",
          globalSequenceNumber: 2,
          iterationIndex: 1,
          fetchTimestamp: "2023-01-01T10:05:00Z",
        },
        {
          docId: "iter1-doc2",
          status: "analyzed",
          globalSequenceNumber: 3,
          iterationIndex: 1,
          fetchTimestamp: "2023-01-01T10:06:00Z",
        },
      ];

      // Set accumulated documents to simulate pause/resume functionality
      store.set(researchSessionAtom, {
        sessionId: "multi-iteration-session",
        accumulatedQueries: [],
        accumulatedDocuments: [...iteration0Docs, ...iteration1Docs],
        accumulatedTopics: [],
      });

      const orderedDocs = store.get(orderedDocumentsAtom);

      expect(orderedDocs).toHaveLength(4);
      // Should be ordered by global sequence, not iteration
      expect(orderedDocs[0]?.docId).toBe("iter0-doc1");
      expect(orderedDocs[0]?.iterationIndex).toBe(0);
      expect(orderedDocs[1]?.docId).toBe("iter0-doc2");
      expect(orderedDocs[1]?.iterationIndex).toBe(0);
      expect(orderedDocs[2]?.docId).toBe("iter1-doc1");
      expect(orderedDocs[2]?.iterationIndex).toBe(1);
      expect(orderedDocs[3]?.docId).toBe("iter1-doc2");
      expect(orderedDocs[3]?.iterationIndex).toBe(1);

      // Verify continuous sequence numbering across iterations
      expect(orderedDocs.map((d) => d.globalSequenceNumber)).toEqual([
        0, 1, 2, 3,
      ]);
    });

    it("should preserve ordering metadata from orchestrator enrichment", () => {
      // Simulate orchestrator-enriched documents with full metadata
      const enrichedDocs: ClientAnalyzedDoc[] = [
        {
          docId: "enriched-doc",
          status: "analyzed",
          title: "Legal Case Study",
          url: "https://example.com/case1",
          source: "Legal Database",
          relevanceScore: 8.5,
          confidenceScore: 9.2,
          summarySnippet: "This case discusses...",

          // Orchestrator-added ordering metadata
          globalSequenceNumber: 0,
          iterationIndex: 0,
          fetchBatchIndex: 0,
          fetchOrderIndex: 0,
          searchQueryId: "constitutional law precedents",
          fetchTimestamp: "2023-01-01T10:00:00Z",
        },
      ];

      store.set(analyzedDocsSummaryAtom, enrichedDocs);
      const orderedDocs = store.get(orderedDocumentsAtom);

      expect(orderedDocs).toHaveLength(1);
      const doc = orderedDocs[0];

      // Verify all orchestrator metadata is preserved
      expect(doc?.globalSequenceNumber).toBe(0);
      expect(doc?.iterationIndex).toBe(0);
      expect(doc?.fetchBatchIndex).toBe(0);
      expect(doc?.fetchOrderIndex).toBe(0);
      expect(doc?.searchQueryId).toBe("constitutional law precedents");
      expect(doc?.fetchTimestamp).toBe("2023-01-01T10:00:00Z");

      // Verify content metadata is also preserved
      expect(doc?.title).toBe("Legal Case Study");
      expect(doc?.relevanceScore).toBe(8.5);
      expect(doc?.confidenceScore).toBe(9.2);
    });

    it("should handle real-world orchestrator fetch patterns correctly", () => {
      // Simulate realistic orchestrator behavior:
      // - Query 1 fetches 2 docs, Query 2 fetches 1 doc, Query 3 fetches 2 docs
      // - Documents may be analyzed in different order than fetched
      const realisticFetchPattern: ClientAnalyzedDoc[] = [
        // Query 1, Batch 0 - First two documents
        {
          docId: "q1-doc1",
          status: "analyzed",
          globalSequenceNumber: 0,
          iterationIndex: 0,
          fetchBatchIndex: 0, // First query batch
          fetchOrderIndex: 0, // First doc in batch
          searchQueryId: "employment law cases",
          fetchTimestamp: "2023-01-01T10:00:00Z",
        },
        {
          docId: "q1-doc2",
          status: "analyzed",
          globalSequenceNumber: 1,
          iterationIndex: 0,
          fetchBatchIndex: 0, // First query batch
          fetchOrderIndex: 1, // Second doc in batch
          searchQueryId: "employment law cases",
          fetchTimestamp: "2023-01-01T10:00:01Z",
        },

        // Query 2, Batch 1 - Single document
        {
          docId: "q2-doc1",
          status: "analyzed",
          globalSequenceNumber: 2,
          iterationIndex: 0,
          fetchBatchIndex: 1, // Second query batch
          fetchOrderIndex: 0, // Only doc in batch
          searchQueryId: "employment statutes",
          fetchTimestamp: "2023-01-01T10:01:00Z",
        },

        // Query 3, Batch 2 - Two more documents
        {
          docId: "q3-doc1",
          status: "analyzed",
          globalSequenceNumber: 3,
          iterationIndex: 0,
          fetchBatchIndex: 2, // Third query batch
          fetchOrderIndex: 0, // First doc in batch
          searchQueryId: "employment regulations",
          fetchTimestamp: "2023-01-01T10:02:00Z",
        },
        {
          docId: "q3-doc2",
          status: "analyzed",
          globalSequenceNumber: 4,
          iterationIndex: 0,
          fetchBatchIndex: 2, // Third query batch
          fetchOrderIndex: 1, // Second doc in batch
          searchQueryId: "employment regulations",
          fetchTimestamp: "2023-01-01T10:02:01Z",
        },
      ];

      store.set(analyzedDocsSummaryAtom, realisticFetchPattern);
      const orderedDocs = store.get(orderedDocumentsAtom);

      expect(orderedDocs).toHaveLength(5);

      // Should maintain global sequence order regardless of batch structure
      const expectedOrder = [
        "q1-doc1",
        "q1-doc2",
        "q2-doc1",
        "q3-doc1",
        "q3-doc2",
      ];
      const actualOrder = orderedDocs.map((d) => d.docId);
      expect(actualOrder).toEqual(expectedOrder);

      // Verify batch groupings are preserved but don't affect ordering
      expect(orderedDocs[0]?.fetchBatchIndex).toBe(0);
      expect(orderedDocs[1]?.fetchBatchIndex).toBe(0);
      expect(orderedDocs[2]?.fetchBatchIndex).toBe(1);
      expect(orderedDocs[3]?.fetchBatchIndex).toBe(2);
      expect(orderedDocs[4]?.fetchBatchIndex).toBe(2);
    });

    it("should handle edge case of missing sequence numbers gracefully in integration", () => {
      // Simulate mixed scenario: some docs from new orchestrator (with sequence),
      // some from legacy data (without sequence)
      const mixedIntegrationDocs: ClientAnalyzedDoc[] = [
        {
          docId: "new-doc",
          status: "analyzed",
          title: "New Document",
          globalSequenceNumber: 0,
          iterationIndex: 0,
          fetchTimestamp: "2023-01-01T10:00:00Z",
        },
        {
          docId: "legacy-doc1",
          status: "analyzed",
          title: "Legacy Document 1",
          // No sequence number - legacy behavior
          timestamp: "2023-01-01T09:00:00Z",
        },
        {
          docId: "new-doc2",
          status: "analyzed",
          title: "Another New Document",
          globalSequenceNumber: 1,
          iterationIndex: 0,
          fetchTimestamp: "2023-01-01T10:01:00Z",
        },
        {
          docId: "legacy-doc2",
          status: "analyzed",
          title: "Legacy Document 2",
          // No sequence number - legacy behavior
          timestamp: "2023-01-01T09:30:00Z",
        },
      ];

      store.set(analyzedDocsSummaryAtom, mixedIntegrationDocs);
      const orderedDocs = store.get(orderedDocumentsAtom);

      expect(orderedDocs).toHaveLength(4);

      // New docs with sequence numbers should come first, in sequence order
      expect(orderedDocs[0]?.docId).toBe("new-doc");
      expect(orderedDocs[0]?.globalSequenceNumber).toBe(0);
      expect(orderedDocs[1]?.docId).toBe("new-doc2");
      expect(orderedDocs[1]?.globalSequenceNumber).toBe(1);

      // Legacy docs should come after, ordered by timestamp
      expect(orderedDocs[2]?.docId).toBe("legacy-doc1");
      expect(orderedDocs[3]?.docId).toBe("legacy-doc2");
    });
  });

  describe("Performance Validation", () => {
    it("should handle large document sets efficiently", () => {
      // Create a large set of documents to test performance
      const largeDocSet: ClientAnalyzedDoc[] = Array.from(
        { length: 100 },
        (_, index) => ({
          docId: `large-doc-${index}`,
          status: "analyzed" as const,
          title: `Document ${index}`,
          globalSequenceNumber: 99 - index, // Reverse order to test sorting
          iterationIndex: Math.floor(index / 20), // 5 iterations, 20 docs each
          fetchTimestamp: new Date(2023, 0, 1, 10, index).toISOString(),
        })
      );

      const startTime = performance.now();
      store.set(analyzedDocsSummaryAtom, largeDocSet);
      const orderedDocs = store.get(orderedDocumentsAtom);
      const endTime = performance.now();

      // Should complete quickly (< 10ms for 100 docs)
      expect(endTime - startTime).toBeLessThan(10);

      // Should be correctly ordered
      expect(orderedDocs).toHaveLength(100);
      expect(orderedDocs[0]?.docId).toBe("large-doc-99");
      expect(orderedDocs[0]?.globalSequenceNumber).toBe(0);
      expect(orderedDocs[99]?.docId).toBe("large-doc-0");
      expect(orderedDocs[99]?.globalSequenceNumber).toBe(99);
    });
  });

  describe("UI Integration Validation", () => {
    it("should provide consistent ordering for UI components across updates", () => {
      // Initial document set
      const initialDocs: ClientAnalyzedDoc[] = [
        {
          docId: "ui-doc-1",
          status: "fetched",
          globalSequenceNumber: 0,
          iterationIndex: 0,
        },
        {
          docId: "ui-doc-2",
          status: "analyzing",
          globalSequenceNumber: 1,
          iterationIndex: 0,
        },
      ];

      store.set(analyzedDocsSummaryAtom, initialDocs);
      const firstOrder = store.get(orderedDocumentsAtom).map((d) => d.docId);

      // Update documents (simulating analysis completion)
      const updatedDocs: ClientAnalyzedDoc[] = [
        {
          docId: "ui-doc-1",
          status: "analyzed",
          globalSequenceNumber: 0,
          iterationIndex: 0,
          relevanceScore: 7.5,
        },
        {
          docId: "ui-doc-2",
          status: "analyzed",
          globalSequenceNumber: 1,
          iterationIndex: 0,
          relevanceScore: 8.2,
        },
      ];

      store.set(analyzedDocsSummaryAtom, updatedDocs);
      const secondOrder = store.get(orderedDocumentsAtom).map((d) => d.docId);

      // Order should remain consistent across updates
      expect(firstOrder).toEqual(secondOrder);
      expect(firstOrder).toEqual(["ui-doc-1", "ui-doc-2"]);
    });
  });
});
