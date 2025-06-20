/// <reference types="../../../../types/test-globals" />

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import type React from "react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EvidenceAnalysis } from "@/components/domain/legal-research/evidence-analysis";
import type {
  ClientAnalysisReasoning,
  ClientAnalyzedDoc,
  ClientLegalEntity,
} from "@/lib/state/researchAtoms";
import {
  analyzedDocsSummaryAtom,
  selectedAnalyzedDocIdAtom,
} from "@/lib/state/researchAtoms";

// Mock the CaseModal component
vi.mock("@/components/domain/legal-research/modals/case-modal", () => ({
  CaseModal: ({
    isOpen,
    onClose,
    caseData,
  }: {
    isOpen: boolean;
    onClose: () => void;
    caseData?: {
      title?: string;
      source?: string;
      court?: string;
      date?: string;
    };
  }) => {
    if (!isOpen) {
      return null;
    }
    return (
      <div data-testid="case-modal">
        <h3>Case Details</h3>
        <p>Title: {caseData?.title || "No title"}</p>
        <p>Source: {caseData?.source || "No source"}</p>
        <button type="button" onClick={onClose} aria-label="close">
          Close
        </button>
      </div>
    );
  },
}));

// Mock the AnalysisReasoningModal component
vi.mock(
  "@/components/domain/legal-research/modals/analysis-reasoning-modal",
  () => ({
    AnalysisReasoningModal: ({
      isOpen,
      onCloseAction,
      reasoning,
      documentTitle,
    }: {
      isOpen: boolean;
      onCloseAction: () => void;
      reasoning?: ClientAnalysisReasoning;
      documentTitle?: string;
    }) => {
      if (!isOpen) {
        return null;
      }
      return (
        <div data-testid="analysis-reasoning-modal">
          <h3>Analysis Reasoning: {documentTitle}</h3>
          <p data-testid="legal-question-summary">
            {reasoning?.analyzeLegalQuestionSummary}
          </p>
          <p data-testid="relevant-principles-summary">
            {reasoning?.considerRelevantPrinciplesSummary}
          </p>
          <button
            type="button"
            onClick={onCloseAction}
            aria-label="close-reasoning"
          >
            Close
          </button>
        </div>
      );
    },
  })
);

describe("EvidenceAnalysis Component - Extended Features", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    vi.clearAllMocks();
  });

  const JotaiProvider = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<JotaiProvider>{component}</JotaiProvider>);
  };

  const mockLegalEntities: ClientLegalEntity[] = [
    {
      name: "Smith v. Jones",
      type: "Case",
      details: "345 F.Supp. 2d 123 (N.D. Cal. 2023)",
    },
    {
      name: "John Smith",
      type: "Person",
      details: "Plaintiff",
    },
    {
      name: "Force Majeure",
      type: "LegalConcept",
      details: "Contractual excuse doctrine",
    },
  ];

  const mockAnalysisReasoning: ClientAnalysisReasoning = {
    analyzeLegalQuestionSummary:
      "The legal question involves determining whether COVID-19 restrictions constitute force majeure events under contract law.",
    considerRelevantPrinciplesSummary:
      "Relevant principles include the doctrine of impossibility, force majeure clauses, and government intervention defenses.",
  };

  const mockExtendedDoc: ClientAnalyzedDoc = {
    docId: "doc-extended",
    title: "Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)",
    url: "https://example.com/smith-v-jones",
    relevanceScore: 9,
    confidenceScore: 8,
    summarySnippet:
      "The court found that COVID-19 related restrictions constituted force majeure events when explicitly mentioned in the contract.",
    status: "analyzed",
    keyArguments: [
      "Government-mandated closures during COVID-19 constitute unforeseeable circumstances",
      "Force majeure clauses must be interpreted strictly against the party invoking them",
      "Performance must be truly impossible, not merely more difficult or expensive",
    ],
    extractedEntities: mockLegalEntities,
    extractedQuotes: [
      '"The pandemic represents an unprecedented disruption to commercial activities"',
      '"Force majeure relief is available only when performance is truly impossible"',
    ],
    fullText:
      "This is the full text of the court decision discussing force majeure in the context of COVID-19 pandemic restrictions...",
    counterArguments: [
      "The pandemic was foreseeable by early 2020",
      "Alternative performance methods were available",
    ],
    analysisReasoning: mockAnalysisReasoning,
  };

  describe("Key Arguments Display", () => {
    it("displays key arguments when available", () => {
      store.set(analyzedDocsSummaryAtom, [mockExtendedDoc]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      renderWithProvider(<EvidenceAnalysis />);

      expect(screen.getByText("Key Arguments:")).toBeInTheDocument();
      expect(
        screen.getByText(/Government-mandated closures during COVID-19/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Force majeure clauses must be interpreted strictly/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Performance must be truly impossible/)
      ).toBeInTheDocument();
    });

    it("shows placeholder when no key arguments available", () => {
      const docWithoutArguments: ClientAnalyzedDoc = {
        docId: "doc-no-args",
        title: "Case Without Arguments",
        relevanceScore: 7,
        status: "analyzed",
      };

      store.set(analyzedDocsSummaryAtom, [docWithoutArguments]);
      store.set(selectedAnalyzedDocIdAtom, "doc-no-args");

      renderWithProvider(<EvidenceAnalysis />);

      expect(screen.getByText("Key Arguments:")).toBeInTheDocument();
      expect(
        screen.getByText(/No key arguments identified/)
      ).toBeInTheDocument();
    });
  });

  describe("Extracted Entities Display", () => {
    it("displays extracted entities with proper styling", () => {
      store.set(analyzedDocsSummaryAtom, [mockExtendedDoc]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      renderWithProvider(<EvidenceAnalysis />);

      expect(screen.getByText("Extracted Entities:")).toBeInTheDocument();
      expect(screen.getByText("Smith v. Jones")).toBeInTheDocument(); // Only in entities now
      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Force Majeure")).toBeInTheDocument();
    });

    it("shows entity details on hover through title attribute", () => {
      store.set(analyzedDocsSummaryAtom, [mockExtendedDoc]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      renderWithProvider(<EvidenceAnalysis />);

      const entityElement = screen.getByText("Smith v. Jones");
      expect(entityElement).toHaveAttribute(
        "title",
        "345 F.Supp. 2d 123 (N.D. Cal. 2023)"
      );
    });

    it("applies different styling based on entity type", () => {
      store.set(analyzedDocsSummaryAtom, [mockExtendedDoc]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      renderWithProvider(<EvidenceAnalysis />);

      // Check that entities have different styling classes based on type
      const caseEntity = screen.getByText("Smith v. Jones");
      const personEntity = screen.getByText("John Smith");
      const conceptEntity = screen.getByText("Force Majeure");

      // Should have different color schemes
      expect(caseEntity).toHaveClass("bg-blue-100");
      expect(personEntity).toHaveClass("bg-yellow-100");
      expect(conceptEntity).toHaveClass("bg-gray-100");
    });

    it("shows placeholder when no entities extracted", () => {
      const docWithoutEntities: ClientAnalyzedDoc = {
        docId: "doc-no-entities",
        title: "Case Without Entities",
        relevanceScore: 6,
        extractedEntities: [],
        status: "analyzed",
      };

      store.set(analyzedDocsSummaryAtom, [docWithoutEntities]);
      store.set(selectedAnalyzedDocIdAtom, "doc-no-entities");

      renderWithProvider(<EvidenceAnalysis />);

      expect(screen.getByText("Extracted Entities:")).toBeInTheDocument();
      expect(screen.getByText(/No entities extracted/)).toBeInTheDocument();
    });
  });

  describe("Full Document Text Display", () => {
    it("displays full document text when available", () => {
      store.set(analyzedDocsSummaryAtom, [mockExtendedDoc]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      renderWithProvider(<EvidenceAnalysis />);

      // Check for document content display - look for the full text
      expect(screen.getByText("Document Content")).toBeInTheDocument();
      expect(
        screen.getByText(/This is the full text of the court decision/)
      ).toBeInTheDocument();
    });

    it("shows placeholder when no document content available", () => {
      const docWithoutFullText: ClientAnalyzedDoc = {
        docId: "doc-no-text",
        title: "Case Without Full Text",
        relevanceScore: 5,
        status: "analyzed",
      };

      store.set(analyzedDocsSummaryAtom, [docWithoutFullText]);
      store.set(selectedAnalyzedDocIdAtom, "doc-no-text");

      renderWithProvider(<EvidenceAnalysis />);

      expect(
        screen.getByText(/No document content available/)
      ).toBeInTheDocument();
    });

    it("formats paragraphs correctly for multi-line text", () => {
      const docWithMultilineText: ClientAnalyzedDoc = {
        ...mockExtendedDoc,
        fullText: "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.",
      };

      store.set(analyzedDocsSummaryAtom, [docWithMultilineText]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      renderWithProvider(<EvidenceAnalysis />);

      expect(screen.getByText("First paragraph.")).toBeInTheDocument();
      expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
      expect(screen.getByText("Third paragraph.")).toBeInTheDocument();
    });
  });

  describe("Analysis Reasoning Modal", () => {
    it("opens analysis reasoning modal when button is clicked", async () => {
      store.set(analyzedDocsSummaryAtom, [mockExtendedDoc]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      renderWithProvider(<EvidenceAnalysis />);

      const reasoningButton = screen.getByText(/View Analysis Reasoning/);
      await userEvent.click(reasoningButton);

      expect(
        screen.getByTestId("analysis-reasoning-modal")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Analysis Reasoning: Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)"
        )
      ).toBeInTheDocument();
    });

    it("displays reasoning content in modal", async () => {
      store.set(analyzedDocsSummaryAtom, [mockExtendedDoc]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      renderWithProvider(<EvidenceAnalysis />);

      const reasoningButton = screen.getByText(/View Analysis Reasoning/);
      await userEvent.click(reasoningButton);

      expect(screen.getByTestId("legal-question-summary")).toHaveTextContent(
        "The legal question involves determining whether COVID-19 restrictions constitute force majeure events"
      );
      expect(
        screen.getByTestId("relevant-principles-summary")
      ).toHaveTextContent(
        "Relevant principles include the doctrine of impossibility"
      );
    });

    it("closes reasoning modal when close button is clicked", async () => {
      store.set(analyzedDocsSummaryAtom, [mockExtendedDoc]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      renderWithProvider(<EvidenceAnalysis />);

      const reasoningButton = screen.getByText(/View Analysis Reasoning/);
      await userEvent.click(reasoningButton);

      expect(
        screen.getByTestId("analysis-reasoning-modal")
      ).toBeInTheDocument();

      const closeButton = screen.getByLabelText("close-reasoning");
      await userEvent.click(closeButton);

      expect(
        screen.queryByTestId("analysis-reasoning-modal")
      ).not.toBeInTheDocument();
    });
  });

  describe("Data Integration", () => {
    it("updates display when document data is updated through atoms", () => {
      // Initial state
      store.set(analyzedDocsSummaryAtom, [mockExtendedDoc]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      const { rerender } = renderWithProvider(<EvidenceAnalysis />);

      expect(
        screen.getByText(/Government-mandated closures during COVID-19/)
      ).toBeInTheDocument();

      // Update with new arguments
      const updatedDoc: ClientAnalyzedDoc = {
        ...mockExtendedDoc,
        keyArguments: ["Updated argument 1", "Updated argument 2"],
      };

      store.set(analyzedDocsSummaryAtom, [updatedDoc]);
      rerender(
        <JotaiProvider>
          <EvidenceAnalysis />
        </JotaiProvider>
      );

      expect(screen.getByText("Updated argument 1")).toBeInTheDocument();
      expect(screen.getByText("Updated argument 2")).toBeInTheDocument();
    });

    it("handles progressive updates to entity extraction", () => {
      // Start with empty entities
      const initialDoc: ClientAnalyzedDoc = {
        ...mockExtendedDoc,
        extractedEntities: [],
      };

      store.set(analyzedDocsSummaryAtom, [initialDoc]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      const { rerender } = renderWithProvider(<EvidenceAnalysis />);

      expect(screen.getByText(/No entities extracted/)).toBeInTheDocument();

      // Add entities progressively
      const updatedDoc: ClientAnalyzedDoc = {
        ...initialDoc,
        extractedEntities: mockLegalEntities,
      };

      store.set(analyzedDocsSummaryAtom, [updatedDoc]);
      rerender(
        <JotaiProvider>
          <EvidenceAnalysis />
        </JotaiProvider>
      );

      expect(screen.getByText("Smith v. Jones")).toBeInTheDocument();
      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Force Majeure")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles documents with very long entity names", () => {
      const docWithLongEntities: ClientAnalyzedDoc = {
        ...mockExtendedDoc,
        extractedEntities: [
          {
            name: "Very Long Legal Case Name That Might Overflow The UI Layout And Cause Display Issues",
            type: "Case",
            details: "Long citation",
          },
        ],
      };

      store.set(analyzedDocsSummaryAtom, [docWithLongEntities]);
      store.set(selectedAnalyzedDocIdAtom, "doc-extended");

      renderWithProvider(<EvidenceAnalysis />);

      // Should render without crashing
      expect(screen.getByText(/Very Long Legal Case Name/)).toBeInTheDocument();
    });

    it("handles empty arrays gracefully", () => {
      const docWithEmptyArrays: ClientAnalyzedDoc = {
        docId: "doc-empty",
        title: "Empty Document",
        relevanceScore: 0,
        status: "analyzed",
        keyArguments: [],
        extractedEntities: [],
        extractedQuotes: [],
        counterArguments: [],
      };

      store.set(analyzedDocsSummaryAtom, [docWithEmptyArrays]);
      store.set(selectedAnalyzedDocIdAtom, "doc-empty");

      renderWithProvider(<EvidenceAnalysis />);

      expect(
        screen.getByText(/No key arguments identified/)
      ).toBeInTheDocument();
      expect(screen.getByText(/No entities extracted/)).toBeInTheDocument();
    });
  });
});
