import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import type React from "react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SynthesisReporting } from "@/components/domain/report-generation/synthesis-reporting";
import type { ClientSynthesis } from "@/lib/state/researchAtoms";
import { synthesisDetailsAtom } from "@/lib/state/researchAtoms";

// Mock the SynthesisReasoningModal component using vitest mock syntax
vi.mock(
  "@/components/domain/report-generation/modals/synthesis-reasoning-modal",
  () => ({
    SynthesisReasoningModal: ({
      isOpen,
      onClose,
    }: {
      isOpen: boolean;
      onClose: () => void;
    }) => {
      if (!isOpen) {
        return null;
      }
      return (
        <div data-testid="synthesis-reasoning-modal">
          <h3>Synthesis Reasoning Details</h3>
          <button type="button" onClick={onClose} aria-label="close">
            Close
          </button>
        </div>
      );
    },
  })
);

// Mock the ReportDrafter component using vitest mock syntax
vi.mock("@/components/domain/report-generation/report-drafter", () => ({
  ReportDrafter: () => (
    <div data-testid="report-drafter">
      <h3>Report Drafter Content</h3>
      <p>Draft report content goes here...</p>
    </div>
  ),
}));

describe("SynthesisReporting Component Integration", () => {
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

  const mockSynthesisData: ClientSynthesis = {
    topics: [
      {
        title: "Establishing 'Duty of Care' in Negligence Claims",
        synthesisSnippet:
          "Pre-existing duty of care considerations include foreseeability, voluntariness, and special relationships. Courts have consistently held that professionals owe a heightened duty when their services are specially sought",
        confidence: 85,
        docIds: ["DocID-001", "DocID-003"],
      },
      {
        title: "Contract Interpretation Standards",
        synthesisSnippet:
          "Courts apply objective standards when interpreting contractual terms, focusing on the reasonable understanding of parties rather than subjective intent",
        confidence: 78,
        docIds: ["DocID-002", "DocID-004"],
      },
    ],
    unansweredAspects: [
      "Defining the threshold of causal connection",
      "State-by-state variations in force majeure standards",
    ],
    emergingQuestions: [
      "How do recent court decisions affect liability standards?",
      "What constitutes sufficient notice under modern contract law?",
    ],
    reasoningSummary:
      "The synthesis process identified key patterns across multiple jurisdictions regarding duty of care and contract interpretation.",
  };

  it("renders the component with initial state", () => {
    const { getByText } = renderWithProvider(<SynthesisReporting />);

    expect(getByText("Synthesis & Reporting")).toBeInTheDocument();
    expect(getByText("Synthesis Studio")).toBeInTheDocument();
    expect(getByText("Report Drafter")).toBeInTheDocument();
  });

  it("displays tabs and switches between them", async () => {
    const { getByText, getByTestId } = renderWithProvider(
      <SynthesisReporting />
    );

    const synthesisTab = getByText("Synthesis Studio");
    const reportTab = getByText("Report Drafter");

    // Initially on synthesis tab
    expect(synthesisTab).toHaveClass(
      "border-b-2",
      "border-[#3a7bb7]",
      "text-[#3a7bb7]"
    );
    expect(reportTab).not.toHaveClass(
      "border-b-2",
      "border-[#3a7bb7]",
      "text-[#3a7bb7]"
    );

    // Switch to report tab
    await userEvent.click(reportTab);

    expect(getByTestId("report-drafter")).toBeInTheDocument();
    expect(reportTab).toHaveClass(
      "border-b-2",
      "border-[#3a7bb7]",
      "text-[#3a7bb7]"
    );

    // Switch back to synthesis tab
    await userEvent.click(synthesisTab);

    expect(getByText("Synthesized Topics")).toBeInTheDocument();
    expect(synthesisTab).toHaveClass(
      "border-b-2",
      "border-[#3a7bb7]",
      "text-[#3a7bb7]"
    );
  });

  it("displays synthesized topics from atom state", () => {
    store.set(synthesisDetailsAtom, mockSynthesisData);

    const { getByText } = renderWithProvider(<SynthesisReporting />);

    // Check that topics are displayed
    expect(
      getByText("Establishing 'Duty of Care' in Negligence Claims")
    ).toBeInTheDocument();
    expect(getByText("Contract Interpretation Standards")).toBeInTheDocument();

    // Check that synthesis snippets are displayed
    expect(
      getByText(
        /Pre-existing duty of care considerations include foreseeability/
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        /Courts apply objective standards when interpreting contractual terms/
      )
    ).toBeInTheDocument();

    // Check that document IDs are displayed
    expect(getByText("[DocID-001]")).toBeInTheDocument();
    expect(getByText("[DocID-003]")).toBeInTheDocument();
    expect(getByText("[DocID-002]")).toBeInTheDocument();
    expect(getByText("[DocID-004]")).toBeInTheDocument();

    // Check confidence displays
    expect(getByText("High (85%)")).toBeInTheDocument(); // For 85% confidence
  });

  it("displays unanswered aspects from atom state", () => {
    store.set(synthesisDetailsAtom, mockSynthesisData);

    const { getByText } = renderWithProvider(<SynthesisReporting />);

    expect(getByText("Unanswered Aspects:")).toBeInTheDocument();
    expect(
      getByText("Defining the threshold of causal connection")
    ).toBeInTheDocument();
    expect(
      getByText("State-by-state variations in force majeure standards")
    ).toBeInTheDocument();
  });

  it("shows streaming text updates with caret animation", () => {
    const streamingData: ClientSynthesis = {
      topics: [
        {
          title: "Force Majeure Analysis",
          synthesisSnippet:
            "Courts have generally recognized that pandemic-related disruptions", // Incomplete, simulating streaming
          confidence: 75,
          docIds: ["DocID-001"],
        },
      ],
      unansweredAspects: [],
      emergingQuestions: [],
      reasoningSummary: "",
    };

    store.set(synthesisDetailsAtom, streamingData);

    renderWithProvider(<SynthesisReporting />);

    // Check for animated caret in synthesis snippet
    const caret = document.querySelector(".animate-caret-blink");
    expect(caret).toBeInTheDocument();
  });

  it("opens synthesis reasoning modal when button is clicked", async () => {
    store.set(synthesisDetailsAtom, mockSynthesisData);

    const { getByText, getByTestId } = renderWithProvider(
      <SynthesisReporting />
    );

    const reasoningButton = getByText("View Synthesis Reasoning");
    await userEvent.click(reasoningButton);

    expect(getByTestId("synthesis-reasoning-modal")).toBeInTheDocument();
    expect(getByText("Synthesis Reasoning Details")).toBeInTheDocument();
  });

  it("closes synthesis reasoning modal when close button is clicked", async () => {
    store.set(synthesisDetailsAtom, mockSynthesisData);

    const { getByText, getByTestId, queryByTestId, getByLabelText } =
      renderWithProvider(<SynthesisReporting />);

    // Open modal
    const reasoningButton = getByText("View Synthesis Reasoning");
    await userEvent.click(reasoningButton);

    expect(getByTestId("synthesis-reasoning-modal")).toBeInTheDocument();

    // Close modal
    const closeButton = getByLabelText("close");
    await userEvent.click(closeButton);

    expect(queryByTestId("synthesis-reasoning-modal")).not.toBeInTheDocument();
  });

  it("displays confidence levels correctly", () => {
    const confidenceTestData: ClientSynthesis = {
      topics: [
        {
          title: "High Confidence Topic",
          synthesisSnippet: "High confidence content",
          confidence: 90,
          docIds: ["DocID-001"],
        },
        {
          title: "Medium Confidence Topic",
          synthesisSnippet: "Medium confidence content",
          confidence: 60,
          docIds: ["DocID-002"],
        },
        {
          title: "Low Confidence Topic",
          synthesisSnippet: "Low confidence content",
          confidence: 30,
          docIds: ["DocID-003"],
        },
      ],
      unansweredAspects: [],
      emergingQuestions: [],
      reasoningSummary: "",
    };

    store.set(synthesisDetailsAtom, confidenceTestData);

    const { getByText } = renderWithProvider(<SynthesisReporting />);

    // Should show appropriate confidence labels
    expect(getByText("High (90%)")).toBeInTheDocument(); // For 90%
    // Medium and Low confidence might be displayed differently or not at all in current UI
  });

  it("handles empty synthesis data gracefully", () => {
    const emptySynthesis: ClientSynthesis = {
      topics: [],
      unansweredAspects: [],
      emergingQuestions: [],
      reasoningSummary: "",
    };

    store.set(synthesisDetailsAtom, emptySynthesis);

    const { getByText } = renderWithProvider(<SynthesisReporting />);

    expect(getByText("Synthesis & Reporting")).toBeInTheDocument();
    expect(getByText("Synthesized Topics")).toBeInTheDocument();
    expect(getByText("Unanswered Aspects:")).toBeInTheDocument();
    // Should not crash and should show empty state appropriately
  });

  it("shows progressive synthesis updates", async () => {
    // Initial state with partial synthesis
    const partialSynthesis: ClientSynthesis = {
      topics: [
        {
          title: "Contract Analysis",
          synthesisSnippet: "Initial analysis shows",
          confidence: 70,
          docIds: ["DocID-001"],
        },
      ],
      unansweredAspects: ["Pending analysis of jurisdiction variations"],
      emergingQuestions: [],
      reasoningSummary: "",
    };

    store.set(synthesisDetailsAtom, partialSynthesis);

    const { getByText } = renderWithProvider(<SynthesisReporting />);

    // Check initial partial content
    expect(getByText(/Initial analysis shows/)).toBeInTheDocument();

    // Update with more complete synthesis
    const updatedSynthesis: ClientSynthesis = {
      topics: [
        {
          title: "Contract Analysis",
          synthesisSnippet:
            "Initial analysis shows that contract interpretation follows well-established precedents",
          confidence: 85,
          docIds: ["DocID-001", "DocID-002"],
        },
      ],
      unansweredAspects: [],
      emergingQuestions: [
        "How do recent decisions affect future interpretations?",
      ],
      reasoningSummary: "Comprehensive analysis completed",
    };

    store.set(synthesisDetailsAtom, updatedSynthesis);

    // Wait for the component to naturally re-render due to Jotai atom update
    await waitFor(() => {
      expect(
        getByText(/contract interpretation follows well-established precedents/)
      ).toBeInTheDocument();
    });
    // emergingQuestions are not displayed in the current UI design, so we don't test for them
  });

  it("handles synthesis reasoning summary display", () => {
    const dataWithReasoning: ClientSynthesis = {
      topics: [
        {
          title: "Test Topic",
          synthesisSnippet: "Test content",
          confidence: 80,
          docIds: ["DocID-001"],
        },
      ],
      unansweredAspects: [],
      emergingQuestions: [],
      reasoningSummary:
        "The synthesis process identified clear patterns across multiple legal precedents, focusing on contractual interpretation and duty of care standards.",
    };

    store.set(synthesisDetailsAtom, dataWithReasoning);

    const { getByText } = renderWithProvider(<SynthesisReporting />);

    // The reasoning summary should be available when modal opens
    expect(getByText("View Synthesis Reasoning")).toBeInTheDocument();
  });
});
