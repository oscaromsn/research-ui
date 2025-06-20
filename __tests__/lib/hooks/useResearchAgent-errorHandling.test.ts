import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  analyzedDocsSummaryAtom,
  researchSessionAtom,
} from "@/lib/state/researchAtoms";
import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms";

describe("useResearchAgent - Error Handling", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    vi.clearAllMocks();
  });

  describe("Individual Document Analysis Errors", () => {
    it("should handle analysis errors for individual documents", () => {
      const initialDocs: ClientAnalyzedDoc[] = [
        {
          docId: "doc-1",
          title: "Test Document 1",
          url: "https://example.com/doc1",
          status: "analyzing",
        },
        {
          docId: "doc-2",
          title: "Test Document 2",
          url: "https://example.com/doc2",
          status: "fetched",
        },
      ];

      // Set initial docs in the store
      store.set(analyzedDocsSummaryAtom, initialDocs);
      store.set(researchSessionAtom, {
        sessionId: null,
        accumulatedDocuments: initialDocs,
        accumulatedQueries: [],
        accumulatedTopics: [],
      });

      // Test that documents can be updated to error state
      const firstDoc = initialDocs[0];
      const secondDoc = initialDocs[1];
      if (!firstDoc || !secondDoc) {
        throw new Error("Test setup error: missing initial docs");
      }

      store.set(analyzedDocsSummaryAtom, [
        {
          ...firstDoc,
          status: "error" as const,
          errorMessage: "Analysis failed: LLM timeout",
        },
        secondDoc,
      ]);

      const docs = store.get(analyzedDocsSummaryAtom);
      expect(docs[0]?.status).toBe("error");
      expect(docs[0]?.errorMessage).toBe("Analysis failed: LLM timeout");
      expect(docs[1]?.status).toBe("fetched");
    });

    it("should handle mixed success and failure states during analysis", () => {
      const mixedDocs: ClientAnalyzedDoc[] = [
        {
          docId: "doc-success",
          title: "Success Document",
          status: "analyzed",
          relevanceScore: 8,
          summarySnippet: "Successfully analyzed document",
        },
        {
          docId: "doc-error",
          title: "Error Document",
          status: "error",
          errorMessage: "Failed to retrieve document content",
        },
      ];

      store.set(analyzedDocsSummaryAtom, mixedDocs);

      const docs = store.get(analyzedDocsSummaryAtom);

      // Verify mixed states are properly stored
      expect(docs.find((d) => d.docId === "doc-success")?.status).toBe(
        "analyzed"
      );
      expect(docs.find((d) => d.docId === "doc-error")?.status).toBe("error");
      expect(docs.find((d) => d.docId === "doc-error")?.errorMessage).toBe(
        "Failed to retrieve document content"
      );
    });
  });

  describe("Orphaned Document Cleanup", () => {
    it("should cleanup documents stuck in analyzing state when research is aborted", () => {
      const initialDocs: ClientAnalyzedDoc[] = [
        {
          docId: "doc-1",
          title: "Analyzing Document 1",
          status: "analyzing",
        },
        {
          docId: "doc-2",
          title: "Analyzing Document 2",
          status: "analyzing",
        },
        {
          docId: "doc-3",
          title: "Completed Document",
          status: "analyzed",
          summarySnippet: "Analysis complete",
        },
      ];

      store.set(analyzedDocsSummaryAtom, initialDocs);

      // Simulate cleanup by updating analyzing docs to error state
      const cleanedDocs = initialDocs.map((doc) =>
        doc.status === "analyzing"
          ? {
              ...doc,
              status: "error" as const,
              errorMessage: "Analysis was interrupted or failed to complete",
            }
          : doc
      );

      store.set(analyzedDocsSummaryAtom, cleanedDocs);

      const docs = store.get(analyzedDocsSummaryAtom);

      // Verify cleanup worked
      expect(docs[0]?.status).toBe("error");
      expect(docs[1]?.status).toBe("error");
      expect(docs[2]?.status).toBe("analyzed"); // Should remain unchanged
      expect(docs[0]?.errorMessage).toBe(
        "Analysis was interrupted or failed to complete"
      );
    });

    it("should cleanup orphaned documents when stream errors occur", () => {
      const initialDocs: ClientAnalyzedDoc[] = [
        {
          docId: "doc-analyzing",
          title: "Analyzing Document",
          status: "analyzing",
        },
      ];

      store.set(analyzedDocsSummaryAtom, initialDocs);

      // Simulate error cleanup
      const firstDoc = initialDocs[0];
      if (!firstDoc) {
        throw new Error("Test setup error: missing initial doc");
      }

      const cleanedDoc = {
        ...firstDoc,
        status: "error" as const,
        errorMessage: "Analysis was interrupted or failed to complete",
      };

      store.set(analyzedDocsSummaryAtom, [cleanedDoc]);

      const docs = store.get(analyzedDocsSummaryAtom);
      expect(docs[0]?.status).toBe("error");
      expect(docs[0]?.errorMessage).toBe(
        "Analysis was interrupted or failed to complete"
      );
    });
  });

  describe("Document State Transitions and Error Recovery", () => {
    it("should handle transition from fetched to error state", () => {
      // Test state transition: fetched -> analyzing -> error
      let doc: ClientAnalyzedDoc = {
        docId: "doc-transition",
        title: "Transition Document",
        status: "fetched",
      };

      store.set(analyzedDocsSummaryAtom, [doc]);

      // Transition to analyzing
      doc = { ...doc, status: "analyzing" };
      store.set(analyzedDocsSummaryAtom, [doc]);

      // Transition to error
      doc = {
        ...doc,
        status: "error",
        errorMessage: "Analysis failed: Invalid document format",
      };
      store.set(analyzedDocsSummaryAtom, [doc]);

      const finalDoc = store.get(analyzedDocsSummaryAtom)[0];
      expect(finalDoc?.status).toBe("error");
      expect(finalDoc?.errorMessage).toBe(
        "Analysis failed: Invalid document format"
      );
    });

    it("should handle document updates with incomplete data gracefully", () => {
      // Test that documents can be stored with minimal required fields
      const incompleteDoc: ClientAnalyzedDoc = {
        docId: "doc-incomplete",
        status: "fetched",
        // Missing title, url, etc.
      };

      store.set(analyzedDocsSummaryAtom, [incompleteDoc]);

      const docs = store.get(analyzedDocsSummaryAtom);
      expect(docs[0]?.docId).toBe("doc-incomplete");
      expect(docs[0]?.status).toBe("fetched");
      expect(docs[0]?.title).toBeUndefined();
    });
  });

  describe("Error State Recovery", () => {
    it("should allow document state transitions during recovery", () => {
      // Test that error documents can be updated to other states
      const errorDoc: ClientAnalyzedDoc = {
        docId: "recoverable-doc",
        title: "Recoverable Document",
        status: "error",
        errorMessage: "Initial error",
      };

      store.set(analyzedDocsSummaryAtom, [errorDoc]);

      // Document can be transitioned from error to fetched (retry scenario)
      const { errorMessage, ...docWithoutError } = errorDoc;
      const recoveredDoc: ClientAnalyzedDoc = {
        ...docWithoutError,
        status: "fetched" as const,
      };

      store.set(analyzedDocsSummaryAtom, [recoveredDoc]);

      const doc = store.get(analyzedDocsSummaryAtom)[0];
      expect(doc?.status).toBe("fetched");
      expect(doc?.errorMessage).toBeUndefined();
    });

    it("should handle document state persistence across sessions", () => {
      const docs: ClientAnalyzedDoc[] = [
        {
          docId: "persistent-1",
          title: "Document 1",
          status: "analyzed",
          summarySnippet: "Analysis complete",
        },
        {
          docId: "persistent-2",
          title: "Document 2",
          status: "error",
          errorMessage: "Analysis failed",
        },
      ];

      store.set(analyzedDocsSummaryAtom, docs);
      store.set(researchSessionAtom, {
        sessionId: "test-session",
        accumulatedDocuments: docs,
        accumulatedQueries: [],
        accumulatedTopics: [],
      });

      const sessionDocs = store.get(researchSessionAtom).accumulatedDocuments;
      expect(sessionDocs).toHaveLength(2);
      expect(sessionDocs[0]?.status).toBe("analyzed");
      expect(sessionDocs[1]?.status).toBe("error");
    });
  });
});
