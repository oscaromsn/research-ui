import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CaseModal } from "@/components/domain/legal-research/modals/case-modal";

// Mock the Modal component
vi.mock("@/components/ui/modal", () => ({
    Modal: ({
        isOpen,
        onClose,
        title,
        children,
    }: {
        isOpen: boolean;
        onClose: () => void;
        title: string;
        children: React.ReactNode;
    }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="modal-container">
                <div data-testid="modal-title">{title}</div>
                <button onClick={onClose} data-testid="modal-close-button">
                    Close
                </button>
                <div data-testid="modal-content">{children}</div>
            </div>
        );
    },
}));

describe("CaseModal Component", () => {
    const mockCaseData = {
        title: "Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)",
        source: "Westlaw",
        court: "N.D. Cal. 2023",
        date: "Nov 15, 2023",
    };

    it("renders when isOpen is true", () => {
        render(
            <CaseModal
                isOpen={true}
                onClose={() => {}}
                caseData={mockCaseData}
            />,
        );

        // Check title is passed to Modal
        expect(screen.getByTestId("modal-title")).toHaveTextContent(
            mockCaseData.title,
        );

        // Check content is rendered
        const content = screen.getByTestId("modal-content");
        expect(content).toBeInTheDocument();

        // Check if case metadata is rendered
        expect(content).toHaveTextContent(mockCaseData.source);
        expect(content).toHaveTextContent(mockCaseData.court);
        expect(content).toHaveTextContent(mockCaseData.date);
    });

    it("does not render when isOpen is false", () => {
        render(
            <CaseModal
                isOpen={false}
                onClose={() => {}}
                caseData={mockCaseData}
            />,
        );

        // Modal shouldn't render anything when closed
        expect(screen.queryByTestId("modal-container")).not.toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", async () => {
        const onCloseMock = vi.fn();

        render(
            <CaseModal
                isOpen={true}
                onClose={onCloseMock}
                caseData={mockCaseData}
            />,
        );

        // Click the close button
        await userEvent.click(screen.getByTestId("modal-close-button"));

        // Check that onClose was called
        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it("renders all case content sections", () => {
        render(
            <CaseModal
                isOpen={true}
                onClose={() => {}}
                caseData={mockCaseData}
            />,
        );

        // Check main sections
        expect(screen.getByText("Key Holdings")).toBeInTheDocument();
        expect(screen.getByText("Full Text")).toBeInTheDocument();

        // Check key holdings
        expect(
            screen.getByText(
                "Force majeure clauses must explicitly mention pandemic-related events",
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Government mandates may constitute qualifying events",
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Mere economic hardship insufficient for impossibility defense",
            ),
        ).toBeInTheDocument();

        // Check full text
        expect(
            screen.getByText(
                /The court, in considering the application of force majeure provisions/,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /Furthermore, the mere existence of economic hardship/,
            ),
        ).toBeInTheDocument();

        // Check action buttons
        expect(screen.getByText("View AI Analysis")).toBeInTheDocument();
        expect(screen.getByText("Cite This Case")).toBeInTheDocument();
    });

    it("handles incomplete caseData gracefully", () => {
        // Render with minimal caseData
        render(
            <CaseModal
                isOpen={true}
                onClose={() => {}}
                caseData={{ title: "Minimal Case" }}
            />,
        );

        // Title should be displayed
        expect(screen.getByTestId("modal-title")).toHaveTextContent(
            "Minimal Case",
        );

        // Other case data should not cause errors even if missing
        const content = screen.getByTestId("modal-content");
        expect(content).toBeInTheDocument();
    });
});
