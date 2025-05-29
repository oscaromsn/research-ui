import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Header } from "@/components/layout/header";

// Mock the components used by Header
vi.mock("@/components/domain/guidance/research-lifecycle", () => ({
    ResearchLifecycle: () => (
        <div data-testid="research-lifecycle">Research Lifecycle Component</div>
    ),
}));

vi.mock("@/components/domain/guidance/modals/settings-modal", () => ({
    SettingsModal: ({
        isOpen,
        onClose,
    }: {
        isOpen: boolean;
        onClose: () => void;
    }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="settings-modal">
                Settings Modal
                <button onClick={onClose} data-testid="close-settings">
                    Close
                </button>
            </div>
        );
    },
}));

describe("Header Component", () => {
    it("renders the component with all elements", () => {
        render(<Header />);

        // Check logo and brand
        expect(screen.getByText("LS")).toBeInTheDocument();
        expect(screen.getByText("LexiSynth")).toBeInTheDocument();

        // Check research title input
        expect(
            screen.getByDisplayValue(
                "Research: Maritime Salvage Rights - The 'Oceanic' Case",
            ),
        ).toBeInTheDocument();

        // Check research lifecycle component
        expect(screen.getByTestId("research-lifecycle")).toBeInTheDocument();
        expect(
            screen.getByText("Research Lifecycle Component"),
        ).toBeInTheDocument();

        // Check action buttons - look for at least 3 buttons
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it("has editable research title", async () => {
        render(<Header />);

        const titleInput = screen.getByDisplayValue(
            "Research: Maritime Salvage Rights - The 'Oceanic' Case",
        );

        // Edit the title
        await userEvent.clear(titleInput);
        await userEvent.type(titleInput, "New Research Topic");

        // Check if the title was updated
        expect(titleInput).toHaveValue("New Research Topic");
    });

    it("opens and closes settings modal when user button is clicked", async () => {
        render(<Header />);

        // Settings modal should be closed initially
        expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();

        // Find and click the user/settings button (the blue circular one)
        // Since it has no text, we identify it by its class
        const userButton = screen.getByRole("button", {
            // Look for the button that contains the User icon
            // This is a bit fragile, but works for this test
            name: "",
            description: (_, element) => {
                return element.className.includes("bg-[#4a90e2]");
            },
        });

        // Click the button to open settings
        await userEvent.click(userButton);

        // Settings modal should now be open
        expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
        expect(screen.getByText("Settings Modal")).toBeInTheDocument();

        // Click the close button in the modal
        await userEvent.click(screen.getByTestId("close-settings"));

        // Settings modal should be closed again
        expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
    });
});
