// TDD Tests for ResilientEventSource-based useResearchAgent Hook
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the API client
vi.mock("@/lib/apiClient", () => ({
  createStreamingURL: vi.fn(),
  apiConfig: {
    baseURL: "http://localhost:3001",
    endpoints: {
      research: {
        stream: "/api/research/stream",
      },
    },
  },
}));

// Mock ResilientEventSource - define the mock inline to avoid hoisting issues
vi.mock("@/lib/utils/eventSourceManager", () => {
  const mockInstance = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  const MockResilientEventSource = vi.fn(() => mockInstance);
  MockResilientEventSource.mockInstance = mockInstance;

  return {
    ResilientEventSource: MockResilientEventSource,
  };
});

// Mock shared types for SSE event validation
vi.mock("../../../packages/shared-types/src/sse-events", () => ({
  StageChangeEventSchema: {
    safeParse: vi.fn(),
  },
  QueryGeneratedEventSchema: {
    safeParse: vi.fn(),
  },
  DocumentFetchedEventSchema: {
    safeParse: vi.fn(),
  },
  DocumentAnalyzedEventSchema: {
    safeParse: vi.fn(),
  },
  SynthesisCompleteEventSchema: {
    safeParse: vi.fn(),
  },
  AssessmentCompleteEventSchema: {
    safeParse: vi.fn(),
  },
  ReportChunkEventSchema: {
    safeParse: vi.fn(),
  },
  ErrorEventSchema: {
    safeParse: vi.fn(),
  },
  CompletionEventSchema: {
    safeParse: vi.fn(),
  },
}));

import { act, renderHook, waitFor } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import type { ReactNode } from "react";
import { createElement } from "react";

import { createStreamingURL } from "@/lib/apiClient";
import { useResearchAgent } from "@/lib/hooks/useResearchAgent";
import {
  analyzedDocsSummaryAtom,
  finalReportContentAtom,
  generatedQueriesAtom,
  researchLogAtom,
  researchStatusAtom,
} from "@/lib/state/researchAtoms";
// Import the mocked module to get access to the mock
import { ResilientEventSource } from "@/lib/utils/eventSourceManager";
// Import after mocking
import {
  DocumentAnalyzedEventSchema,
  QueryGeneratedEventSchema,
  ReportChunkEventSchema,
  StageChangeEventSchema,
} from "../../../packages/shared-types/src/sse-events";

// Type mocks for better TypeScript support
const mockStageChangeEventSchema = StageChangeEventSchema as any;
const mockQueryGeneratedEventSchema = QueryGeneratedEventSchema as any;
const mockDocumentAnalyzedEventSchema = DocumentAnalyzedEventSchema as any;
const mockReportChunkEventSchema = ReportChunkEventSchema as any;
const mockCreateStreamingURL = createStreamingURL as ReturnType<typeof vi.fn>;
const mockResilientEventSource = ResilientEventSource as any;
const mockResilientEventSourceInstance = (ResilientEventSource as any)
  .mockInstance;

describe("useResearchAgent Hook - EventSource Integration (TDD)", () => {
  let store: ReturnType<typeof createStore>;

  const JotaiProvider = ({ children }: { children: ReactNode }) =>
    createElement(Provider, { store }, children);

  beforeEach(() => {
    store = createStore();
    vi.clearAllMocks();

    // Reset ResilientEventSource mock
    mockResilientEventSourceInstance.connect.mockResolvedValue(undefined);
    mockResilientEventSourceInstance.addEventListener.mockImplementation(
      () => {}
    );
    mockResilientEventSourceInstance.disconnect.mockImplementation(() => {});

    // Reset mock implementations
    mockStageChangeEventSchema.safeParse.mockReturnValue({ success: false });
    mockQueryGeneratedEventSchema.safeParse.mockReturnValue({ success: false });
    mockDocumentAnalyzedEventSchema.safeParse.mockReturnValue({
      success: false,
    });
    mockReportChunkEventSchema.safeParse.mockReturnValue({ success: false });

    mockCreateStreamingURL.mockReturnValue(
      "http://localhost:3001/api/research/stream"
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await global.testUtils?.flushPromises?.();
  });

  describe("ResilientEventSource Connection Management", () => {
    it("should establish ResilientEventSource connection on startResearch", async () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      await act(async () => {
        await result.current.startResearch("Test legal question");
      });

      // Should create ResilientEventSource with streaming URL
      expect(mockResilientEventSource).toHaveBeenCalledWith(
        "http://localhost:3001/api/research/stream",
        expect.any(Object), // callbacks
        expect.any(Object) // config
      );

      // Should set up event listeners
      expect(
        mockResilientEventSourceInstance.addEventListener
      ).toHaveBeenCalledWith("stage.change", expect.any(Function));

      // Should attempt to connect
      expect(mockResilientEventSourceInstance.connect).toHaveBeenCalled();
    });

    it("should disconnect ResilientEventSource connection on abortResearch", async () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      await act(async () => {
        await result.current.startResearch("Test question");
      });

      act(() => {
        result.current.abortResearch();
      });

      // Should disconnect the ResilientEventSource connection
      expect(mockResilientEventSourceInstance.disconnect).toHaveBeenCalled();
    });

    it("should create streaming URL with correct parameters", async () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      const legalQuestion = "What are AI patent implications?";

      await act(async () => {
        await result.current.startResearch(legalQuestion);
      });

      // FAILING: Hook doesn't call createStreamingURL yet
      expect(mockCreateStreamingURL).toHaveBeenCalledWith(
        "/api/research/stream",
        expect.objectContaining({
          legalQuestion,
        })
      );
    });
  });

  describe("SSE Event Processing", () => {
    it("should update research status on stage.change event", async () => {
      // Setup successful Zod validation
      mockStageChangeEventSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          stage: "GENERATING_QUERIES",
          message: "Generating search queries...",
          progress: 17,
        },
      });

      let stageChangeListener: EventListener | null = null;

      // Capture the event listener when addEventListener is called
      mockResilientEventSourceInstance.addEventListener.mockImplementation(
        (eventType: string, listener: EventListener) => {
          if (eventType === "stage.change") {
            stageChangeListener = listener;
          }
        }
      );

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      await act(async () => {
        await result.current.startResearch("Test question");
      });

      expect(stageChangeListener).toBeDefined();

      // Simulate stage change event
      const mockEvent = {
        data: JSON.stringify({
          stage: "GENERATING_QUERIES",
          message: "Generating search queries...",
          progress: 17,
        }),
      } as MessageEvent;

      // Trigger the event listener
      act(() => {
        stageChangeListener?.(mockEvent);
      });

      await waitFor(() => {
        const status = store.get(researchStatusAtom);
        expect(status.stage).toBe("GENERATING_QUERIES");
        expect(status.message).toBe("Generating search queries...");
      });
    });

    it("should update generated queries on query.generated event", async () => {
      mockQueryGeneratedEventSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          queries: [
            {
              query_string: "AI patent law precedents",
              expected_information_summary: "Recent cases on AI patents",
              timestamp: "2025-01-11T10:00:00Z",
            },
          ],
          totalQueries: 3,
        },
      });

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      await act(async () => {
        await result.current.startResearch("Test question");
      });

      const mockEvent = {
        data: JSON.stringify({
          queries: [
            {
              query_string: "AI patent law precedents",
              expected_information_summary: "Recent cases on AI patents",
              timestamp: "2025-01-11T10:00:00Z",
            },
          ],
          totalQueries: 3,
        }),
      };

      const queryGeneratedListener =
        mockEventSourceInstance.addEventListener.mock.calls.find(
          ([eventType]) => eventType === "query.generated"
        )?.[1];

      act(() => {
        queryGeneratedListener?.(mockEvent);
      });

      // FAILING: Hook doesn't update queries atom yet
      await waitFor(() => {
        const queries = store.get(generatedQueriesAtom);
        expect(queries).toHaveLength(1);
        expect(queries[0]?.query_string).toBe("AI patent law precedents");
      });
    });

    it("should update document analysis on document.analyzed event", async () => {
      mockDocumentAnalyzedEventSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          docId: "doc-123",
          title: "AI Patent Case Study",
          status: "analyzed",
          relevanceScore: 8,
          summarySnippet: "Important case about AI patents",
        },
      });

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      await act(async () => {
        await result.current.startResearch("Test question");
      });

      const mockEvent = {
        data: JSON.stringify({
          docId: "doc-123",
          title: "AI Patent Case Study",
          status: "analyzed",
          relevanceScore: 8,
          summarySnippet: "Important case about AI patents",
        }),
      };

      const documentAnalyzedListener =
        mockEventSourceInstance.addEventListener.mock.calls.find(
          ([eventType]) => eventType === "document.analyzed"
        )?.[1];

      act(() => {
        documentAnalyzedListener?.(mockEvent);
      });

      // FAILING: Hook doesn't update analyzed docs atom yet
      await waitFor(() => {
        const docs = store.get(analyzedDocsSummaryAtom);
        expect(docs).toHaveLength(1);
        expect(docs[0]?.docId).toBe("doc-123");
        expect(docs[0]?.relevanceScore).toBe(8);
      });
    });

    it("should handle report streaming with report.chunk events", async () => {
      mockReportChunkEventSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          fieldName: "executiveSummary",
          content: "This is a streaming executive summary...",
          isFieldComplete: false,
        },
      });

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      await act(async () => {
        await result.current.startResearch("Test question");
      });

      const mockEvent = {
        data: JSON.stringify({
          fieldName: "executiveSummary",
          content: "This is a streaming executive summary...",
          isFieldComplete: false,
        }),
      };

      const reportChunkListener =
        mockEventSourceInstance.addEventListener.mock.calls.find(
          ([eventType]) => eventType === "report.chunk"
        )?.[1];

      act(() => {
        reportChunkListener?.(mockEvent);
      });

      // FAILING: Hook doesn't handle report streaming yet
      await waitFor(() => {
        const report = store.get(finalReportContentAtom);
        expect(report.executiveSummary).toBe(
          "This is a streaming executive summary..."
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle EventSource connection errors", async () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      await act(async () => {
        await result.current.startResearch("Test question");
      });

      // Find the error event listener
      const errorListener =
        mockEventSourceInstance.addEventListener.mock.calls.find(
          ([eventType]) => eventType === "error"
        )?.[1];

      // Simulate connection error
      act(() => {
        errorListener?.(new Event("error"));
      });

      // FAILING: Hook doesn't handle connection errors yet
      await waitFor(() => {
        const status = store.get(researchStatusAtom);
        expect(status.stage).toBe("ERROR");
        expect(status.isLoading).toBe(false);
        expect(status.error).toBeDefined();
      });
    });

    it("should handle invalid JSON in SSE events gracefully", async () => {
      mockStageChangeEventSchema.safeParse.mockReturnValue({ success: false });

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      await act(async () => {
        await result.current.startResearch("Test question");
      });

      const stageChangeListener =
        mockEventSourceInstance.addEventListener.mock.calls.find(
          ([eventType]) => eventType === "stage.change"
        )?.[1];

      // Send invalid JSON
      const invalidEvent = {
        data: '{"invalid": json}',
      };

      act(() => {
        stageChangeListener?.(invalidEvent);
      });

      // FAILING: Hook doesn't handle parse errors yet
      await waitFor(() => {
        const logs = store.get(researchLogAtom);
        expect(logs.some((log) => log.includes("Failed to parse"))).toBe(true);
      });
    });
  });

  describe("State Management", () => {
    it("should reset all research state when starting new research", async () => {
      // Set some initial state that should be cleared
      store.set(researchStatusAtom, {
        stage: "COMPLETED" as any,
        isLoading: false,
        error: null,
        message: "Previous research completed",
        isPaused: false,
        canResume: false,
      });
      store.set(researchLogAtom, ["Previous log entry"]);
      store.set(generatedQueriesAtom, [
        {
          query_string: "old query",
          expected_information_summary: "old summary",
          timestamp: "2025-01-01T00:00:00Z",
        },
      ]);
      store.set(analyzedDocsSummaryAtom, [
        {
          docId: "old-doc",
          title: "Old Document",
          status: "analyzed" as any,
          relevanceScore: 5,
          confidenceScore: 0.8,
          summarySnippet: "Old summary",
          timestamp: "2025-01-01T00:00:00Z",
        },
      ]);

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      await act(async () => {
        await result.current.startResearch(
          "What are the implications of AI in healthcare?"
        );
      });

      // Check that state was reset
      expect(store.get(generatedQueriesAtom)).toEqual([]);
      expect(store.get(analyzedDocsSummaryAtom)).toEqual([]);
      expect(store.get(finalReportContentAtom)).toEqual({
        title: "",
        executiveSummary: "",
        sections: [],
        conclusion: "",
        limitations: [],
        appendixDocIds: [],
      });

      // Should have new initializing state
      const status = store.get(researchStatusAtom);
      expect(status.stage).toBe("INITIALIZING");
      expect(status.isLoading).toBe(true);
      expect(status.message).toBe("Initializing research...");
    });

    it("should properly update existing documents vs adding new ones", async () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      await act(async () => {
        await result.current.startResearch("Test question");
      });

      // First, add a document via document.analyzed event
      mockDocumentAnalyzedEventSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          docId: "doc-456",
          title: "Initial Title",
          status: "fetched",
          relevanceScore: 0.7,
        },
      });

      const documentAnalyzedListener =
        mockEventSourceInstance.addEventListener.mock.calls.find(
          ([eventType]) => eventType === "document.analyzed"
        )?.[1];

      const initialEvent = {
        data: JSON.stringify({
          docId: "doc-456",
          title: "Initial Title",
          status: "fetched",
          relevanceScore: 0.7,
        }),
      };

      act(() => {
        documentAnalyzedListener?.(initialEvent);
      });

      // Verify initial document was added
      await waitFor(() => {
        const docs = store.get(analyzedDocsSummaryAtom);
        expect(docs).toHaveLength(1);
        expect(docs[0]?.docId).toBe("doc-456");
        expect(docs[0]?.relevanceScore).toBe(0.7);
      });

      // Get the original timestamp
      const originalDoc = store.get(analyzedDocsSummaryAtom)[0];
      const originalTimestamp = originalDoc?.timestamp;

      // Now update the same document with new analysis data
      mockDocumentAnalyzedEventSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          docId: "doc-456", // Same ID - should update existing
          title: "Initial Title",
          status: "analyzed",
          relevanceScore: 8.5,
          confidenceScore: 0.92,
          summarySnippet: "Updated analysis summary",
        },
      });

      const updateEvent = {
        data: JSON.stringify({
          docId: "doc-456",
          title: "Initial Title",
          status: "analyzed",
          relevanceScore: 8.5,
          confidenceScore: 0.92,
          summarySnippet: "Updated analysis summary",
        }),
      };

      act(() => {
        documentAnalyzedListener?.(updateEvent);
      });

      await waitFor(() => {
        const docs = store.get(analyzedDocsSummaryAtom);
        expect(docs).toHaveLength(1); // Still only one document
        expect(docs[0]?.docId).toBe("doc-456");
        expect(docs[0]?.title).toBe("Initial Title"); // Preserved
        expect(docs[0]?.relevanceScore).toBe(8.5); // Updated
        expect(docs[0]?.confidenceScore).toBe(0.92); // Added
        expect(docs[0]?.summarySnippet).toBe("Updated analysis summary"); // Added
        expect(docs[0]?.timestamp).toBe(originalTimestamp); // Preserved original timestamp
      });

      // Now test adding a completely new document
      mockDocumentAnalyzedEventSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          docId: "doc-789", // New ID - should add
          title: "New Document",
          status: "analyzed",
          relevanceScore: 9.2,
          confidenceScore: 0.95,
          summarySnippet: "New document analysis",
        },
      });

      const newDocEvent = {
        data: JSON.stringify({
          docId: "doc-789",
          title: "New Document",
          status: "analyzed",
          relevanceScore: 9.2,
          confidenceScore: 0.95,
          summarySnippet: "New document analysis",
        }),
      };

      act(() => {
        documentAnalyzedListener?.(newDocEvent);
      });

      await waitFor(() => {
        const docs = store.get(analyzedDocsSummaryAtom);
        expect(docs).toHaveLength(2); // Now two documents

        // First document unchanged
        expect(docs[0]?.docId).toBe("doc-456");
        expect(docs[0]?.relevanceScore).toBe(8.5);
        expect(docs[0]?.timestamp).toBe(originalTimestamp); // Still has original timestamp

        // Second document is new (has different timestamp)
        expect(docs[1]?.docId).toBe("doc-789");
        expect(docs[1]?.title).toBe("New Document");
        expect(docs[1]?.relevanceScore).toBe(9.2);
        expect(docs[1]?.timestamp).not.toBe(originalTimestamp); // New timestamp
      });
    });
  });

  describe("Advanced Report Streaming", () => {
    it("should handle complex report streaming with proper replacement logic", async () => {
      // Test that streaming text fields are REPLACED, not appended
      mockReportChunkEventSchema.safeParse
        .mockReturnValueOnce({
          success: true,
          data: {
            fieldName: "executiveSummary",
            content: "This report analyzes",
            isFieldComplete: false,
          },
        })
        .mockReturnValueOnce({
          success: true,
          data: {
            fieldName: "executiveSummary",
            content:
              "This report analyzes the legal implications of artificial intelligence",
            isFieldComplete: false,
          },
        })
        .mockReturnValueOnce({
          success: true,
          data: {
            fieldName: "executiveSummary",
            content:
              "This report analyzes the legal implications of artificial intelligence in healthcare settings and examines liability frameworks.",
            isFieldComplete: true,
          },
        })
        .mockReturnValueOnce({
          success: true,
          data: {
            fieldName: "section",
            sectionInfo: { title: "Legal Framework" },
            content: "The current legal framework establishes",
            isFieldComplete: false,
          },
        })
        .mockReturnValueOnce({
          success: true,
          data: {
            fieldName: "section",
            sectionInfo: { title: "Legal Framework" },
            content:
              "The current legal framework establishes clear guidelines for AI deployment in medical environments, with specific requirements for liability allocation.",
            isFieldComplete: true,
          },
        })
        .mockReturnValueOnce({
          success: true,
          data: {
            fieldName: "conclusion",
            content:
              "Based on this analysis, healthcare providers must implement comprehensive AI governance frameworks to ensure regulatory compliance and limit liability exposure.",
            isFieldComplete: true,
          },
        });

      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      await act(async () => {
        await result.current.startResearch("Test legal question");
      });

      const reportChunkListener =
        mockEventSourceInstance.addEventListener.mock.calls.find(
          ([eventType]) => eventType === "report.chunk"
        )?.[1];

      // Simulate progressive executive summary updates (should replace, not append)
      const executiveSummaryEvents = [
        {
          data: JSON.stringify({
            fieldName: "executiveSummary",
            content: "This report analyzes",
            isFieldComplete: false,
          }),
        },
        {
          data: JSON.stringify({
            fieldName: "executiveSummary",
            content:
              "This report analyzes the legal implications of artificial intelligence",
            isFieldComplete: false,
          }),
        },
        {
          data: JSON.stringify({
            fieldName: "executiveSummary",
            content:
              "This report analyzes the legal implications of artificial intelligence in healthcare settings and examines liability frameworks.",
            isFieldComplete: true,
          }),
        },
      ];

      // Send executive summary updates
      for (const event of executiveSummaryEvents) {
        act(() => {
          reportChunkListener?.(event);
        });
      }

      // Section streaming events
      const sectionEvents = [
        {
          data: JSON.stringify({
            fieldName: "section",
            sectionInfo: { title: "Legal Framework" },
            content: "The current legal framework establishes",
            isFieldComplete: false,
          }),
        },
        {
          data: JSON.stringify({
            fieldName: "section",
            sectionInfo: { title: "Legal Framework" },
            content:
              "The current legal framework establishes clear guidelines for AI deployment in medical environments, with specific requirements for liability allocation.",
            isFieldComplete: true,
          }),
        },
      ];

      // Send section updates
      for (const event of sectionEvents) {
        act(() => {
          reportChunkListener?.(event);
        });
      }

      // Conclusion event
      const conclusionEvent = {
        data: JSON.stringify({
          fieldName: "conclusion",
          content:
            "Based on this analysis, healthcare providers must implement comprehensive AI governance frameworks to ensure regulatory compliance and limit liability exposure.",
          isFieldComplete: true,
        }),
      };

      act(() => {
        reportChunkListener?.(conclusionEvent);
      });

      await waitFor(() => {
        const report = store.get(finalReportContentAtom);

        // Executive summary should show the final complete state, not concatenated chunks
        expect(report.executiveSummary).toBe(
          "This report analyzes the legal implications of artificial intelligence in healthcare settings and examines liability frameworks."
        );

        // Should have one section with complete content
        expect(report.sections).toHaveLength(1);
        expect(report.sections[0]).toEqual({
          title: "Legal Framework",
          content:
            "The current legal framework establishes clear guidelines for AI deployment in medical environments, with specific requirements for liability allocation.",
        });

        // Conclusion should show final complete state
        expect(report.conclusion).toBe(
          "Based on this analysis, healthcare providers must implement comprehensive AI governance frameworks to ensure regulatory compliance and limit liability exposure."
        );
      });
    });
  });

  describe("Backward Compatibility", () => {
    it("should maintain the expected hook interface", () => {
      const { result } = renderHook(() => useResearchAgent(), {
        wrapper: JotaiProvider,
      });

      // Hook should provide the expected functions and properties
      expect(result.current).toMatchObject({
        startResearch: expect.any(Function),
        resumeResearch: expect.any(Function),
        pauseResearch: expect.any(Function),
        abortResearch: expect.any(Function),
        retryConnection: expect.any(Function),
        isLoading: expect.any(Boolean),
        currentStage: expect.any(String),
        currentMessage: expect.any(String),
        error: null,
        isPaused: expect.any(Boolean),
        canResume: expect.any(Boolean),
        autoModeEnabled: expect.any(Boolean),
        toggleAutoMode: expect.any(Function),
        connectionState: expect.any(Object),
        systemHealth: expect.any(Object),
        dismissWarning: expect.any(Function),
        checkSystemHealth: expect.any(Function),
      });
    });

    it("should not import or call conductResearch Server Action", () => {
      // This test ensures we've fully migrated away from Server Actions
      const moduleCode = require("fs").readFileSync(
        require("path").join(
          __dirname,
          "../../../lib/hooks/useResearchAgent.ts"
        ),
        "utf-8"
      );

      // FAILING: Hook still imports conductResearch
      expect(moduleCode).not.toContain("conductResearch");
      expect(moduleCode).not.toContain(
        "@/app/actions/researchAgentOrchestrator"
      );
    });
  });
});
