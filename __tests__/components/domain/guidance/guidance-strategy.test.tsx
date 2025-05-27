import { GuidanceStrategy } from "@/components/domain/guidance/guidance-strategy";
import * as useResearchAgentModule from "@/lib/hooks/useResearchAgent";
import {
    generatedQueriesAtom,
    researchLogAtom,
    researchStatusAtom,
    resetResearchStateAtom,
} from "@/lib/state/researchAtoms";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { type ReactNode, createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the useResearchAgent hook
vi.mock("@/lib/hooks/useResearchAgent", () => ({
    useResearchAgent: vi.fn(),
}));

describe("GuidanceStrategy Component Integration", () => {
    let store: ReturnType<typeof createStore>;
    let mockStartResearch: ReturnType<typeof vi.fn>;
    let mockAbortResearch: ReturnType<typeof vi.fn>;
    let mockUseResearchAgent: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        store = createStore();
        mockStartResearch = vi.fn();
        mockAbortResearch = vi.fn();
        mockUseResearchAgent = vi.mocked(
            useResearchAgentModule.useResearchAgent,
        );

        vi.clearAllMocks();

        // Set default mock return value
        mockUseResearchAgent.mockReturnValue({
            startResearch: mockStartResearch,
            abortResearch: mockAbortResearch,
            isLoading: false,
            currentStage: "IDLE",
            currentMessage: "Ready to start research.",
            error: null,
        });
    });

    const JotaiProvider = ({ children }: { children: ReactNode }) =>
        createElement(Provider, { store }, children);

    const renderWithProvider = (component: React.ReactElement) => {
        return render(createElement(JotaiProvider, { children: component }));
    };

    it("renders the component with initial state", () => {
        renderWithProvider(createElement(GuidanceStrategy));

        expect(screen.getByText("Guidance & Strategy")).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(
                "Enter Legal Question or Research Topic",
            ),
        ).toBeInTheDocument();
        expect(screen.getByText("Start Research")).toBeInTheDocument();
    });

    it("captures and submits legal question through useResearchAgent", async () => {
        renderWithProvider(createElement(GuidanceStrategy));

        const input = screen.getByPlaceholderText(
            "Enter Legal Question or Research Topic",
        );
        const startButton = screen.getByText("Start Research");

        // Type legal question
        await userEvent.clear(input);
        await userEvent.type(
            input,
            "What are the implications of force majeure during COVID-19?",
        );

        // Click start research
        await userEvent.click(startButton);

        // Verify the hook was called with the question
        expect(mockStartResearch).toHaveBeenCalledWith(
            "What are the implications of force majeure during COVID-19?",
        );
    });

    it("displays generated queries from atom state", () => {
        // Pre-populate the store with generated queries
        store.set(generatedQueriesAtom, [
            {
                query_string:
                    '"force majeure" AND "COVID-19" AND "contract breach"',
                expected_information_summary:
                    "Cases and precedents related to force majeure during pandemic",
            },
            {
                query_string:
                    '"impossibility" AND "performance excuse" AND "pandemic"',
                expected_information_summary:
                    "Legal doctrine of impossibility in pandemic context",
            },
        ]);

        renderWithProvider(createElement(GuidanceStrategy));

        // Check that the first query is displayed
        expect(
            screen.getByText(
                '"force majeure" AND "COVID-19" AND "contract breach"',
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Cases and precedents related to force majeure during pandemic",
            ),
        ).toBeInTheDocument();
    });

    it("disables input and button during loading state", () => {
        // Mock loading state
        mockUseResearchAgent.mockReturnValue({
            startResearch: mockStartResearch,
            abortResearch: mockAbortResearch,
            isLoading: true,
            currentStage: "GENERATING_QUERIES",
            currentMessage: "Generating search queries...",
            error: null,
        });

        renderWithProvider(createElement(GuidanceStrategy));

        const input = screen.getByPlaceholderText(
            "Enter Legal Question or Research Topic",
        );
        const startButton = screen.getByText(/Processing:/);

        expect(input).toBeDisabled();
        expect(startButton).toBeDisabled();
        expect(
            screen.getByText(
                "Processing: GENERATING_QUERIES - Generating search queries...",
            ),
        ).toBeInTheDocument();
    });

    it("shows abort button during loading and calls abortResearch", async () => {
        // Mock loading state
        mockUseResearchAgent.mockReturnValue({
            startResearch: mockStartResearch,
            abortResearch: mockAbortResearch,
            isLoading: true,
            currentStage: "ANALYZING_DOCUMENTS",
            currentMessage: "Analyzing retrieved documents...",
            error: null,
        });

        renderWithProvider(createElement(GuidanceStrategy));

        const abortButton = screen.getByText("Abort");
        await userEvent.click(abortButton);

        expect(mockAbortResearch).toHaveBeenCalled();
    });

    it("displays error state from useResearchAgent", () => {
        // Mock error state
        mockUseResearchAgent.mockReturnValue({
            startResearch: mockStartResearch,
            abortResearch: mockAbortResearch,
            isLoading: false,
            currentStage: "ERROR",
            currentMessage: null,
            error: "Failed to connect to document search service",
        });

        renderWithProvider(createElement(GuidanceStrategy));

        expect(
            screen.getByText(
                "Error: Failed to connect to document search service",
            ),
        ).toBeInTheDocument();
    });

    it("displays research logs from atom state", () => {
        // Pre-populate the store with logs
        store.set(researchLogAtom, [
            "Starting research for legal question",
            "Generated 3 search queries",
            "Retrieved 15 documents",
            "Analyzing document relevance...",
        ]);

        renderWithProvider(createElement(GuidanceStrategy));

        expect(screen.getByText("Research Logs:")).toBeInTheDocument();
        expect(
            screen.getByText(/Starting research for legal question/),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Generated 3 search queries/),
        ).toBeInTheDocument();
        expect(screen.getByText(/Retrieved 15 documents/)).toBeInTheDocument();
        expect(
            screen.getByText(/Analyzing document relevance.../),
        ).toBeInTheDocument();
    });

    it("prevents submission with empty legal question", async () => {
        renderWithProvider(createElement(GuidanceStrategy));

        const input = screen.getByPlaceholderText(
            "Enter Legal Question or Research Topic",
        );
        const startButton = screen.getByText("Start Research");

        // Ensure input is empty
        await userEvent.clear(input);

        // Click start research
        await userEvent.click(startButton);

        // Verify the hook was not called
        expect(mockStartResearch).not.toHaveBeenCalled();
    });

    it("toggles assessment section visibility", async () => {
        renderWithProvider(createElement(GuidanceStrategy));

        // Assessment details should not be visible initially
        expect(
            screen.queryByText("Suggested Actions:"),
        ).not.toBeInTheDocument();

        // Click to expand
        const assessmentButton = screen.getByRole("button", {
            name: /Agent Assessment/,
        });
        await userEvent.click(assessmentButton);

        // Now the expanded content should be visible
        expect(screen.getByText("Suggested Actions:")).toBeInTheDocument();
        expect(screen.getByText("Impact on Analysis:")).toBeInTheDocument();

        // Click again to collapse
        await userEvent.click(assessmentButton);

        // Expanded content should be hidden again
        expect(
            screen.queryByText("Suggested Actions:"),
        ).not.toBeInTheDocument();
    });
});
