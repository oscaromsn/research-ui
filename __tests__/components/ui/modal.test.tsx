import "../../dom-setup";
import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Modal } from "@/components/ui/modal";

describe("Modal Component", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders when isOpen is true", () => {
    const { getByText, getByRole } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    // Check title
    expect(getByText("Test Modal")).toBeInTheDocument();

    // Check content
    expect(getByText("Modal Content")).toBeInTheDocument();

    // Check close button (X icon)
    expect(getByRole("button")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    const { queryByText } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    // Modal shouldn't render anything when closed
    expect(queryByText("Test Modal")).not.toBeInTheDocument();
    expect(queryByText("Modal Content")).not.toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const onCloseMock = vi.fn();

    const { getByRole } = render(
      <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    // Click the close button
    await userEvent.click(getByRole("button"));

    // Check that onClose was called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("renders with correct size classes", () => {
    const { rerender, getByText } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" size="md">
        <div>Modal Content</div>
      </Modal>
    );

    // Check default size
    expect(getByText("Modal Content").parentElement?.parentElement).toHaveClass(
      "max-w-md"
    );

    // Rerender with large size
    rerender(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" size="lg">
        <div>Modal Content</div>
      </Modal>
    );
    expect(getByText("Modal Content").parentElement?.parentElement).toHaveClass(
      "max-w-lg"
    );

    // Rerender with extra large size
    rerender(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" size="xl">
        <div>Modal Content</div>
      </Modal>
    );
    expect(getByText("Modal Content").parentElement?.parentElement).toHaveClass(
      "max-w-xl"
    );
  });

  it("renders with modal overlay", () => {
    const { getByText } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    // Check for the modal overlay (background with appropriate classes)
    const overlay =
      getByText("Modal Content").parentElement?.parentElement?.parentElement;
    expect(overlay).toHaveClass("fixed");
    expect(overlay).toHaveClass("inset-0");
    expect(overlay).toHaveClass("bg-black/50");
  });
});
