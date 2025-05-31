import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Button, buttonVariants } from "@/components/ui/button";

describe("Button Component", () => {
  it("renders correctly with default props", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();

    // Check default variant classes
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("text-primary-foreground");
  });

  it("renders the correct variant classes", () => {
    const { rerender } = render(
      <Button variant="destructive">Destructive</Button>
    );
    let button = screen.getByRole("button", { name: /destructive/i });
    expect(button).toHaveClass("bg-destructive");

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole("button", { name: /outline/i });
    expect(button).toHaveClass("border");
    expect(button).toHaveClass("bg-background");

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole("button", { name: /secondary/i });
    expect(button).toHaveClass("bg-secondary");

    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole("button", { name: /ghost/i });
    expect(button).toHaveClass("hover:bg-accent");

    rerender(<Button variant="link">Link</Button>);
    button = screen.getByRole("button", { name: /link/i });
    expect(button).toHaveClass("text-primary");
    expect(button).toHaveClass("hover:underline");
  });

  it("renders different sizes correctly", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole("button", { name: /small/i });
    expect(button).toHaveClass("h-8");

    rerender(<Button size="default">Default</Button>);
    button = screen.getByRole("button", { name: /default/i });
    expect(button).toHaveClass("h-9");

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole("button", { name: /large/i });
    expect(button).toHaveClass("h-10");

    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole("button", { name: /icon/i });
    expect(button).toHaveClass("size-9");
  });

  it("applies additional className correctly", () => {
    render(<Button className="test-class">With Class</Button>);
    const button = screen.getByRole("button", { name: /with class/i });
    expect(button).toHaveClass("test-class");
  });

  it("supports asChild prop", () => {
    render(
      <Button asChild>
        <a href="https://example.com">Link Button</a>
      </Button>
    );

    const linkButton = screen.getByRole("link", { name: /link button/i });
    expect(linkButton).toBeInTheDocument();
    expect(linkButton.tagName).toBe("A");
    expect(linkButton).toHaveAttribute("href", "https://example.com");
    expect(linkButton).toHaveClass("bg-primary");
  });

  it("passes through HTML attributes", () => {
    render(
      <Button
        type="submit"
        aria-label="Submit Form"
        data-testid="submit-button"
        disabled
      >
        Submit
      </Button>
    );

    const button = screen.getByTestId("submit-button");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("aria-label", "Submit Form");
    expect(button).toBeDisabled();
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not trigger click when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );

    const button = screen.getByRole("button", { name: /click me/i });
    await userEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });
});

// Test the buttonVariants function directly
describe("buttonVariants", () => {
  it("returns the correct classes for default variants", () => {
    const classes = buttonVariants({});
    expect(classes).toContain("bg-primary");
    expect(classes).toContain("h-9");
  });

  it("returns correct classes for custom variants and sizes", () => {
    const classes = buttonVariants({ variant: "destructive", size: "lg" });
    expect(classes).toContain("bg-destructive");
    expect(classes).toContain("h-10");
  });

  it("merges additional className correctly", () => {
    const classes = buttonVariants({ className: "custom-class" });
    expect(classes).toContain("custom-class");
    expect(classes).toContain("bg-primary"); // Still includes variant classes
  });
});
