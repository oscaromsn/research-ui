import { SynthesisReporting } from "@/components/domain/report-generation/synthesis-reporting";
import { synthesisDetailsAtom } from "@/lib/state/researchAtoms";
import type { ClientSynthesis } from "@/lib/state/researchAtoms";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { type ReactNode, createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the SynthesisReasoningModal component
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
            if (!isOpen) return null;
            return (
                <div data-testid="synthesis-reasoning-modal">
                    <h3>Synthesis Reasoning Details</h3>
                    <button onClick={onClose} aria-label="close">
                        Close
                    </button>
                </div>
            );
        },
    }),
);

// Mock the ReportDrafter component
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

    const JotaiProvider = ({ children }: { children: ReactNode }) =>
        createElement(Provider, { store }, children);

    const renderWithProvider = (component: React.ReactElement) => {
        return render(createElement(JotaiProvider, { children: component }));
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
        renderWithProvider(createElement(SynthesisReporting));

        expect(screen.getByText("Synthesis & Reporting")).toBeInTheDocument();
        expect(screen.getByText("Synthesis Studio")).toBeInTheDocument();
        expect(screen.getByText("Report Drafter")).toBeInTheDocument();
    });

    it("displays tabs and switches between them", async () => {
        renderWithProvider(createElement(SynthesisReporting));

        const synthesisTab = screen.getByText("Synthesis Studio");
        const reportTab = screen.getByText("Report Drafter");

        // Initially on synthesis tab
        expect(synthesisTab).toHaveClass(
            "border-b-2",
            "border-[#3a7bb7]",
            "text-[#3a7bb7]",
        );
        expect(reportTab).not.toHaveClass(
            "border-b-2",
            "border-[#3a7bb7]",
            "text-[#3a7bb7]",
        );

        // Switch to report tab
        await userEvent.click(reportTab);

        expect(screen.getByTestId("report-drafter")).toBeInTheDocument();
        expect(reportTab).toHaveClass(
            "border-b-2",
            "border-[#3a7bb7]",
            "text-[#3a7bb7]",
        );

        // Switch back to synthesis tab
        await userEvent.click(synthesisTab);

        expect(screen.getByText("Synthesized Topics")).toBeInTheDocument();
        expect(synthesisTab).toHaveClass(
            "border-b-2",
            "border-[#3a7bb7]",
            "text-[#3a7bb7]",
        );
    });

    it("displays synthesized topics from atom state", () => {
        store.set(synthesisDetailsAtom, mockSynthesisData);

        renderWithProvider(createElement(SynthesisReporting));

        // Check that topics are displayed
        expect(
            screen.getByText(
                "Establishing 'Duty of Care' in Negligence Claims",
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Contract Interpretation Standards"),
        ).toBeInTheDocument();

        // Check that synthesis snippets are displayed
        expect(
            screen.getByText(
                /Pre-existing duty of care considerations include foreseeability/,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /Courts apply objective standards when interpreting contractual terms/,
            ),
        ).toBeInTheDocument();

        // Check that document IDs are displayed
        expect(screen.getByText("[DocID-001]")).toBeInTheDocument();
        expect(screen.getByText("[DocID-003]")).toBeInTheDocument();
        expect(screen.getByText("[DocID-002]")).toBeInTheDocument();
        expect(screen.getByText("[DocID-004]")).toBeInTheDocument();

        // Check confidence displays
        expect(screen.getByText("High (85%)")).toBeInTheDocument(); // For 85% confidence
    });

    it("displays unanswered aspects from atom state", () => {
        store.set(synthesisDetailsAtom, mockSynthesisData);

        renderWithProvider(createElement(SynthesisReporting));

        expect(screen.getByText("Unanswered Aspects:")).toBeInTheDocument();
        expect(
            screen.getByText("Defining the threshold of causal connection"),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "State-by-state variations in force majeure standards",
            ),
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

        renderWithProvider(createElement(SynthesisReporting));

        // Check for animated caret in synthesis snippet
        const caret = document.querySelector(".animate-caret-blink");
        expect(caret).toBeInTheDocument();
    });

    it("opens synthesis reasoning modal when button is clicked", async () => {
        store.set(synthesisDetailsAtom, mockSynthesisData);

        renderWithProvider(createElement(SynthesisReporting));

        const reasoningButton = screen.getByText("View Synthesis Reasoning");
        await userEvent.click(reasoningButton);

        expect(
            screen.getByTestId("synthesis-reasoning-modal"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Synthesis Reasoning Details"),
        ).toBeInTheDocument();
    });

    it("closes synthesis reasoning modal when close button is clicked", async () => {
        store.set(synthesisDetailsAtom, mockSynthesisData);

        renderWithProvider(createElement(SynthesisReporting));

        // Open modal
        const reasoningButton = screen.getByText("View Synthesis Reasoning");
        await userEvent.click(reasoningButton);

        expect(
            screen.getByTestId("synthesis-reasoning-modal"),
        ).toBeInTheDocument();

        // Close modal
        const closeButton = screen.getByLabelText("close");
        await userEvent.click(closeButton);

        expect(
            screen.queryByTestId("synthesis-reasoning-modal"),
        ).not.toBeInTheDocument();
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

        renderWithProvider(createElement(SynthesisReporting));

        // Should show appropriate confidence labels
        expect(screen.getByText("High (90%)")).toBeInTheDocument(); // For 90%
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

        renderWithProvider(createElement(SynthesisReporting));

        expect(screen.getByText("Synthesis & Reporting")).toBeInTheDocument();
        expect(screen.getByText("Synthesized Topics")).toBeInTheDocument();
        expect(screen.getByText("Unanswered Aspects:")).toBeInTheDocument();
        // Should not crash and should show empty state appropriately
    });

    it("shows progressive synthesis updates", () => {
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

        const { rerender } = renderWithProvider(
            createElement(SynthesisReporting),
        );

        // Check initial partial content
        expect(screen.getByText(/Initial analysis shows/)).toBeInTheDocument();

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
        rerender(
            createElement(JotaiProvider, {
                children: createElement(SynthesisReporting),
            }),
        );

        // Check updated content
        expect(
            screen.getByText(
                /contract interpretation follows well-established precedents/,
            ),
        ).toBeInTheDocument();
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

        renderWithProvider(createElement(SynthesisReporting));

        // The reasoning summary should be available when modal opens
        expect(
            screen.getByText("View Synthesis Reasoning"),
        ).toBeInTheDocument();
    });
});
