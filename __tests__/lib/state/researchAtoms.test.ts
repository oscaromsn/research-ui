// __tests__/lib/state/researchAtoms.test.ts

import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";

import {
  type ClientAnalyzedDoc,
  type ClientFinalReport,
  // Types
  type ClientSearchQuery,
  type ClientSynthesis,
  type ResearchStatus,
  analyzedDocsSummaryAtom,
  currentResearchStageAtom,
  executiveSummaryDisplayAtom,
  finalReportContentAtom,
  generatedQueriesAtom,
  // Derived atoms
  isResearchLoadingAtom,
  reportSectionsDisplayAtom,
  researchErrorAtom,
  researchLogAtom,
  // Core atoms
  researchStatusAtom,
  // Reset atom
  resetResearchStateAtom,
  synthesisDetailsAtom,
} from "@/lib/state/researchAtoms";

describe("ResearchAtoms - Type Definitions and Initial States", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe("researchStatusAtom", () => {
    it("should have correct initial state", () => {
      const initialState = store.get(researchStatusAtom);

      expect(initialState).toEqual({
        stage: "IDLE",
        isLoading: false,
        error: null,
        message: "Ready to start research.",
        currentProcessedDoc: 0,
        totalDocsToProcess: 0,
        currentStreamingField: null,
      });
    });

    it("should accept ResearchStatus type updates", () => {
      const newStatus: ResearchStatus = {
        stage: "GENERATING_QUERIES",
        isLoading: true,
        error: null,
        message: "Generating search queries...",
        currentProcessedDoc: 0,
        totalDocsToProcess: 5,
        currentStreamingField: "queries",
      };

      store.set(researchStatusAtom, newStatus);
      expect(store.get(researchStatusAtom)).toEqual(newStatus);
    });
  });

  describe("researchLogAtom", () => {
    it("should have empty array as initial state", () => {
      const initialState = store.get(researchLogAtom);
      expect(initialState).toEqual([]);
    });

    it("should accept string array updates", () => {
      const newLog = [
        "Started research",
        "Generated 3 queries",
        "Fetching documents",
      ];
      store.set(researchLogAtom, newLog);
      expect(store.get(researchLogAtom)).toEqual(newLog);
    });
  });

  describe("generatedQueriesAtom", () => {
    it("should have empty array as initial state", () => {
      const initialState = store.get(generatedQueriesAtom);
      expect(initialState).toEqual([]);
    });

    it("should accept ClientSearchQuery array updates", () => {
      const queries: ClientSearchQuery[] = [
        {
          query_string: "contract law",
          expected_information_summary: "Legal precedents",
        },
        {
          query_string: "intellectual property",
          expected_information_summary: "Patent cases",
        },
      ];

      store.set(generatedQueriesAtom, queries);
      expect(store.get(generatedQueriesAtom)).toEqual(queries);
    });
  });

  describe("analyzedDocsSummaryAtom", () => {
    it("should have empty array as initial state", () => {
      const initialState = store.get(analyzedDocsSummaryAtom);
      expect(initialState).toEqual([]);
    });

    it("should accept ClientAnalyzedDoc array updates", () => {
      const docs: ClientAnalyzedDoc[] = [
        {
          docId: "doc1",
          title: "Contract Law Fundamentals",
          relevanceScore: 8.5,
          confidenceScore: 9.2,
          summarySnippet:
            "This document covers fundamental contract principles...",
          status: "analyzed",
        },
        {
          docId: "doc2",
          title: "Intellectual Property Rights",
          relevanceScore: 7.8,
          confidenceScore: 8.6,
          summarySnippet: "IP protection mechanisms and legal frameworks...",
          status: "analyzed",
        },
      ];

      store.set(analyzedDocsSummaryAtom, docs);
      expect(store.get(analyzedDocsSummaryAtom)).toEqual(docs);
    });
  });

  describe("synthesisDetailsAtom", () => {
    it("should have correct initial state", () => {
      const initialState = store.get(synthesisDetailsAtom);
      expect(initialState).toEqual({
        topics: [],
        unansweredAspects: [],
        emergingQuestions: [],
        reasoningSummary: "",
      });
    });

    it("should accept ClientSynthesis type updates", () => {
      const synthesis: ClientSynthesis = {
        topics: [
          {
            title: "Contract Formation",
            synthesisSnippet: "Key elements of valid contracts...",
            confidence: 0.92,
            docIds: ["doc1", "doc2"],
          },
        ],
        unansweredAspects: ["International jurisdiction"],
        emergingQuestions: ["How does digital signature affect validity?"],
        reasoningSummary: "Analysis shows strong precedent for...",
      };

      store.set(synthesisDetailsAtom, synthesis);
      expect(store.get(synthesisDetailsAtom)).toEqual(synthesis);
    });
  });

  describe("finalReportContentAtom", () => {
    it("should have correct initial state", () => {
      const initialState = store.get(finalReportContentAtom);
      expect(initialState).toEqual({
        title: "",
        executiveSummary: "",
        sections: [],
        conclusion: "",
        limitations: [],
        appendixDocIds: [],
      });
    });

    it("should accept ClientFinalReport type updates", () => {
      const report: ClientFinalReport = {
        title: "Legal Analysis Report",
        executiveSummary: "This report analyzes...",
        sections: [
          {
            title: "Background",
            content: "Legal context includes...",
          },
          { title: "Analysis", content: "Key findings show..." },
        ],
        conclusion: "Based on the analysis...",
        limitations: ["Limited case law in jurisdiction"],
        appendixDocIds: ["doc1", "doc2", "doc3"],
      };

      store.set(finalReportContentAtom, report);
      expect(store.get(finalReportContentAtom)).toEqual(report);
    });
  });
});

describe("ResearchAtoms - Derived Atoms", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe("isResearchLoadingAtom", () => {
    it("should reflect loading state from researchStatusAtom", () => {
      expect(store.get(isResearchLoadingAtom)).toBe(false);

      store.set(researchStatusAtom, {
        stage: "GENERATING_QUERIES",
        isLoading: true,
        error: null,
        message: "Loading...",
        currentProcessedDoc: 0,
        totalDocsToProcess: 0,
      });

      expect(store.get(isResearchLoadingAtom)).toBe(true);
    });
  });

  describe("currentResearchStageAtom", () => {
    it("should reflect stage from researchStatusAtom", () => {
      expect(store.get(currentResearchStageAtom)).toBe("IDLE");

      store.set(researchStatusAtom, {
        stage: "ANALYZING_DOCUMENTS",
        isLoading: true,
        error: null,
        message: "Analyzing...",
        currentProcessedDoc: 0,
        totalDocsToProcess: 0,
      });

      expect(store.get(currentResearchStageAtom)).toBe("ANALYZING_DOCUMENTS");
    });
  });

  describe("researchErrorAtom", () => {
    it("should reflect error from researchStatusAtom", () => {
      expect(store.get(researchErrorAtom)).toBe(null);

      store.set(researchStatusAtom, {
        stage: "ERROR",
        isLoading: false,
        error: "Failed to connect to API",
        message: "Error occurred",
        currentProcessedDoc: 0,
        totalDocsToProcess: 0,
      });

      expect(store.get(researchErrorAtom)).toBe("Failed to connect to API");
    });
  });

  describe("executiveSummaryDisplayAtom", () => {
    it("should reflect executiveSummary from finalReportContentAtom", () => {
      expect(store.get(executiveSummaryDisplayAtom)).toBe("");

      store.set(finalReportContentAtom, {
        title: "",
        executiveSummary: "This is an executive summary...",
        sections: [],
        conclusion: "",
        limitations: [],
        appendixDocIds: [],
      });

      expect(store.get(executiveSummaryDisplayAtom)).toBe(
        "This is an executive summary..."
      );
    });
  });

  describe("reportSectionsDisplayAtom", () => {
    it("should reflect sections from finalReportContentAtom", () => {
      expect(store.get(reportSectionsDisplayAtom)).toEqual([]);

      const sections = [
        { title: "Introduction", content: "This report..." },
        { title: "Analysis", content: "The key findings..." },
      ];

      store.set(finalReportContentAtom, {
        title: "",
        executiveSummary: "",
        sections,
        conclusion: "",
        limitations: [],
        appendixDocIds: [],
      });

      expect(store.get(reportSectionsDisplayAtom)).toEqual(sections);
    });
  });
});

describe("ResearchAtoms - Reset Functionality", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("should reset all atoms to initial state when resetResearchStateAtom is triggered", () => {
    // Set some non-initial values
    store.set(researchStatusAtom, {
      stage: "ANALYZING_DOCUMENTS",
      isLoading: true,
      error: "Some error",
      message: "Processing...",
      currentProcessedDoc: 3,
      totalDocsToProcess: 10,
      currentStreamingField: "analysis",
    });

    store.set(researchLogAtom, [
      "Started",
      "Generated queries",
      "Fetching docs",
    ]);

    store.set(generatedQueriesAtom, [
      {
        query_string: "test query",
        expected_information_summary: "test info",
      },
    ]);

    store.set(analyzedDocsSummaryAtom, [
      {
        docId: "test-doc",
        title: "Test Document",
        relevanceScore: 0.8,
        status: "analyzed",
      },
    ]);

    store.set(synthesisDetailsAtom, {
      topics: [{ title: "Test Topic", synthesisSnippet: "Test snippet" }],
      unansweredAspects: ["aspect1"],
      emergingQuestions: ["question1"],
      reasoningSummary: "Test reasoning",
    });

    store.set(finalReportContentAtom, {
      title: "Test Report",
      executiveSummary: "Test summary",
      sections: [{ title: "Test Section", content: "Test content" }],
      conclusion: "Test conclusion",
      limitations: ["limitation1"],
      appendixDocIds: ["doc1"],
    });

    // Trigger reset
    store.set(resetResearchStateAtom, null);

    // Verify all atoms are reset to initial states
    expect(store.get(researchStatusAtom)).toEqual({
      stage: "IDLE",
      isLoading: false,
      error: null,
      message: "Ready.",
      currentProcessedDoc: 0,
      totalDocsToProcess: 0,
      currentStreamingField: null,
      isPaused: false,
      canResume: false,
    });

    expect(store.get(researchLogAtom)).toEqual([]);
    expect(store.get(generatedQueriesAtom)).toEqual([]);
    expect(store.get(analyzedDocsSummaryAtom)).toEqual([]);

    expect(store.get(synthesisDetailsAtom)).toEqual({
      topics: [],
      unansweredAspects: [],
      emergingQuestions: [],
      reasoningSummary: "",
    });

    expect(store.get(finalReportContentAtom)).toEqual({
      title: "",
      executiveSummary: "",
      sections: [],
      conclusion: "",
      limitations: [],
      appendixDocIds: [],
    });

    // Verify derived atoms also reflect reset state
    expect(store.get(isResearchLoadingAtom)).toBe(false);
    expect(store.get(currentResearchStageAtom)).toBe("IDLE");
    expect(store.get(researchErrorAtom)).toBe(null);
    expect(store.get(executiveSummaryDisplayAtom)).toBe("");
    expect(store.get(reportSectionsDisplayAtom)).toEqual([]);
  });

  it("should work when called multiple times", () => {
    // Set some values
    store.set(researchLogAtom, ["test message"]);

    // Reset first time
    store.set(resetResearchStateAtom, null);
    expect(store.get(researchLogAtom)).toEqual([]);

    // Set values again
    store.set(researchLogAtom, ["another message"]);

    // Reset second time
    store.set(resetResearchStateAtom, null);
    expect(store.get(researchLogAtom)).toEqual([]);
  });
});
