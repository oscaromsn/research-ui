import { render, screen, within } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import type React from "react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { ReportDrafter } from "@/components/domain/report-generation/report-drafter";
import { SynthesisReporting } from "@/components/domain/report-generation/synthesis-reporting";
import {
  finalReportContentAtom,
  synthesisDetailsAtom,
} from "@/lib/state/researchAtoms";
import type {
  ClientFinalReport,
  ClientSynthesis,
} from "@/lib/state/researchAtoms";

describe("Phase 4 Completion Validation", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  const JotaiProvider = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<JotaiProvider>{component}</JotaiProvider>);
  };

  describe("SynthesisReporting Component Integration", () => {
    it("successfully integrates with synthesisDetailsAtom for data display", () => {
      const mockSynthesis: ClientSynthesis = {
        topics: [
          {
            title: "Force Majeure Clauses",
            synthesisSnippet:
              "Courts require specific language for pandemic coverage. Government regulations may trigger clauses.",
            confidence: 85,
            docIds: ["DOC-001", "DOC-002"],
          },
          {
            title: "Contract Interpretation",
            synthesisSnippet:
              "Strict interpretation of force majeure language. Burden of proof on party claiming excuse.",
            confidence: 92,
            docIds: ["DOC-003", "DOC-004"],
          },
        ],
        unansweredAspects: [
          "State-specific variations in interpretation",
          "International commercial law applications",
        ],
        emergingQuestions: [],
        reasoningSummary:
          "The analysis reveals significant judicial precedent for strict interpretation of force majeure clauses.",
      };

      store.set(synthesisDetailsAtom, mockSynthesis);

      renderWithProvider(<SynthesisReporting />);

      // Verify atom integration - should display topics from atom
      expect(screen.getByText("Force Majeure Clauses")).toBeInTheDocument();
      expect(screen.getByText("Contract Interpretation")).toBeInTheDocument();

      // Verify confidence levels are properly mapped
      expect(screen.getByText("High (85%)")).toBeInTheDocument();
      expect(screen.getByText("High (92%)")).toBeInTheDocument();

      // Verify synthesis snippets are displayed
      expect(
        screen.getByText(
          /Courts require specific language for pandemic coverage/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Strict interpretation of force majeure language/)
      ).toBeInTheDocument();

      // Note: reasoningSummary might be displayed in a modal or different section
      // For now, just verify that the basic topic data integration is working

      // Verify unanswered aspects are shown
      expect(
        screen.getByText(/State-specific variations in interpretation/)
      ).toBeInTheDocument();
    });

    it("handles empty synthesis data gracefully", () => {
      const emptySynthesis: ClientSynthesis = {
        topics: [],
        unansweredAspects: [],
        emergingQuestions: [],
        reasoningSummary: "",
      };

      store.set(synthesisDetailsAtom, emptySynthesis);

      renderWithProvider(<SynthesisReporting />);

      // Should still render the component structure
      expect(screen.getByText("Synthesis & Reporting")).toBeInTheDocument();
      expect(screen.getByText("Synthesized Topics")).toBeInTheDocument();
      expect(screen.getByText("Unanswered Aspects:")).toBeInTheDocument();
    });
  });

  describe("ReportDrafter Component Integration", () => {
    it("successfully integrates with finalReportContentAtom for report display", () => {
      const mockReport: ClientFinalReport = {
        title: "COVID-19 Force Majeure Analysis",
        executiveSummary:
          "This comprehensive analysis examines the application of force majeure clauses during the COVID-19 pandemic.",
        sections: [
          {
            title: "Background",
            content:
              "Force majeure clauses have gained prominence as contractual parties seek relief from pandemic-related disruptions.",
          },
          {
            title: "Legal Analysis",
            content:
              "Courts have applied a strict interpretation standard, requiring specific language addressing pandemic-type events.",
          },
          {
            title: "Recommendations",
            content:
              "Parties should include explicit pandemic language in future force majeure provisions.",
          },
        ],
        conclusion:
          "The legal landscape continues to evolve as courts balance contractual certainty with equitable relief.",
        limitations: [
          "Analysis limited to federal court decisions",
          "State law variations not fully covered",
        ],
        appendixDocIds: ["DOC-001", "DOC-002", "DOC-003"],
      };

      store.set(finalReportContentAtom, mockReport);

      renderWithProvider(<ReportDrafter />);

      // Verify title integration
      expect(
        screen.getByDisplayValue("COVID-19 Force Majeure Analysis")
      ).toBeInTheDocument();

      // Verify document structure shows all sections with proper completion status
      const docStructure = screen
        .getByText("Document Structure")
        .closest("div");
      expect(docStructure).not.toBeNull();
      if (!docStructure) {
        throw new Error(
          "Test setup failed: 'Document Structure' div not found."
        );
      }
      expect(
        within(docStructure).getByText("Executive Summary")
      ).toBeInTheDocument();
      expect(within(docStructure).getByText("Background")).toBeInTheDocument();
      expect(
        within(docStructure).getByText("Legal Analysis")
      ).toBeInTheDocument();
      expect(
        within(docStructure).getByText("Recommendations")
      ).toBeInTheDocument();
      expect(within(docStructure).getByText("Conclusion")).toBeInTheDocument();

      // Verify content display
      expect(
        screen.getByText(/This comprehensive analysis examines the application/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Force majeure clauses have gained prominence/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Courts have applied a strict interpretation standard/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Parties should include explicit pandemic language/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/The legal landscape continues to evolve/)
      ).toBeInTheDocument();
    });

    it("properly tracks section completion status based on content", () => {
      const partialReport: ClientFinalReport = {
        title: "Test Report",
        executiveSummary: "Complete executive summary",
        sections: [
          {
            title: "Background",
            content: "Complete background content",
          },
          {
            title: "Legal Analysis",
            content: "", // Incomplete
          },
          {
            title: "Recommendations",
            content: "Complete recommendations",
          },
        ],
        conclusion: "", // Incomplete
        limitations: [],
        appendixDocIds: [],
      };

      store.set(finalReportContentAtom, partialReport);

      renderWithProvider(<ReportDrafter />);

      const docStructure = screen
        .getByText("Document Structure")
        .closest("div");
      expect(docStructure).not.toBeNull();
      if (!docStructure) {
        throw new Error(
          "Test setup failed: 'Document Structure' div not found."
        );
      }

      // Complete sections should have completion styling
      const executiveSummarySection = within(docStructure)
        .getByText("Executive Summary")
        .closest('div[class*="p-2"]');
      const backgroundSection = within(docStructure)
        .getByText("Background")
        .closest('div[class*="p-2"]');
      const recommendationsSection = within(docStructure)
        .getByText("Recommendations")
        .closest('div[class*="p-2"]');

      // Incomplete sections should not have completion styling
      const legalAnalysisSection = within(docStructure)
        .getByText("Legal Analysis")
        .closest('div[class*="p-2"]');
      const conclusionSection = within(docStructure)
        .getByText("Conclusion")
        .closest('div[class*="p-2"]');

      expect(executiveSummarySection).toHaveClass("bg-[#f1f5f9]");
      expect(backgroundSection).toHaveClass("bg-[#f1f5f9]");
      expect(recommendationsSection).toHaveClass("bg-[#f1f5f9]");
      expect(legalAnalysisSection).not.toHaveClass("bg-[#f1f5f9]");
      expect(conclusionSection).not.toHaveClass("bg-[#f1f5f9]");
    });
  });

  describe("Phase 4 Integration Completeness", () => {
    it("validates all required atom integrations are functional", () => {
      // Test data for both components
      const synthesisData: ClientSynthesis = {
        topics: [
          {
            title: "Test Topic",
            synthesisSnippet: "Test finding summary",
            confidence: 75,
            docIds: ["DOC-001"],
          },
        ],
        unansweredAspects: ["Test aspect"],
        emergingQuestions: [],
        reasoningSummary: "Test assessment",
      };

      const reportData: ClientFinalReport = {
        title: "Integration Test Report",
        executiveSummary: "Test summary",
        sections: [
          {
            title: "Background",
            content: "Test content",
          },
        ],
        conclusion: "Test conclusion",
        limitations: [],
        appendixDocIds: [],
      };

      // Set both atoms
      store.set(synthesisDetailsAtom, synthesisData);
      store.set(finalReportContentAtom, reportData);

      // Render both components
      const { unmount: unmountSynthesis } = renderWithProvider(
        <SynthesisReporting />
      );
      expect(screen.getByText("Test Topic")).toBeInTheDocument();
      expect(screen.getByText("Test finding summary")).toBeInTheDocument();
      unmountSynthesis();

      const { unmount: unmountReport } = renderWithProvider(<ReportDrafter />);
      expect(
        screen.getByDisplayValue("Integration Test Report")
      ).toBeInTheDocument();
      expect(screen.getByText(/Test summary/)).toBeInTheDocument();
      unmountReport();

      // Verify atoms maintain their state
      expect(store.get(synthesisDetailsAtom)).toEqual(synthesisData);
      expect(store.get(finalReportContentAtom)).toEqual(reportData);
    });

    it("confirms components respond to atom state changes", () => {
      // Initial state
      const initialSynthesis: ClientSynthesis = {
        topics: [
          {
            title: "Initial Topic",
            synthesisSnippet: "Initial finding summary",
            confidence: 50,
            docIds: ["DOC-001"],
          },
        ],
        unansweredAspects: [],
        emergingQuestions: [],
        reasoningSummary: "Initial assessment",
      };

      store.set(synthesisDetailsAtom, initialSynthesis);

      const { rerender } = renderWithProvider(<SynthesisReporting />);
      expect(screen.getByText("Initial Topic")).toBeInTheDocument();
      expect(screen.getByText("Low (50%)")).toBeInTheDocument();

      // Update state
      const updatedSynthesis: ClientSynthesis = {
        topics: [
          {
            title: "Updated Topic",
            synthesisSnippet: "Updated finding summary",
            confidence: 90,
            docIds: ["DOC-002"],
          },
        ],
        unansweredAspects: ["New aspect"],
        emergingQuestions: [],
        reasoningSummary: "Updated assessment",
      };

      store.set(synthesisDetailsAtom, updatedSynthesis);
      rerender(
        <JotaiProvider>
          <SynthesisReporting />
        </JotaiProvider>
      );

      // Verify component reflects changes
      expect(screen.getByText("Updated Topic")).toBeInTheDocument();
      expect(screen.getByText("High (90%)")).toBeInTheDocument();
      expect(screen.getByText("Updated finding summary")).toBeInTheDocument();
      expect(screen.getByText("New aspect")).toBeInTheDocument();
    });
  });
});
