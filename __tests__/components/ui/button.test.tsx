// DOM setup handled by setupTests.ts via vitest.config.ts
import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, buttonVariants } from "@/components/ui/button";

describe("Button Component", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders correctly with default props", () => {
    const { getByText } = render(<Button>Click me</Button>);

    const button = getByText("Click me");
    expect(button).toBeInTheDocument();

    // Check default variant classes
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("text-primary-foreground");
  });

  it("renders the correct variant classes", () => {
    const { rerender, getByText } = render(
      <Button variant="destructive">Destructive</Button>
    );
    let button = getByText("Destructive");
    expect(button).toHaveClass("bg-destructive");

    rerender(<Button variant="outline">Outline</Button>);
    button = getByText("Outline");
    expect(button).toHaveClass("border");
    expect(button).toHaveClass("bg-background");

    rerender(<Button variant="secondary">Secondary</Button>);
    button = getByText("Secondary");
    expect(button).toHaveClass("bg-secondary");

    rerender(<Button variant="ghost">Ghost</Button>);
    button = getByText("Ghost");
    expect(button).toHaveClass("hover:bg-accent");

    rerender(<Button variant="link">Link</Button>);
    button = getByText("Link");
    expect(button).toHaveClass("text-primary");
    expect(button).toHaveClass("hover:underline");
  });

  it("renders different sizes correctly", () => {
    const { rerender, getByText } = render(<Button size="sm">Small</Button>);
    let button = getByText("Small");
    expect(button).toHaveClass("h-8");

    rerender(<Button size="default">Default</Button>);
    button = getByText("Default");
    expect(button).toHaveClass("h-9");

    rerender(<Button size="lg">Large</Button>);
    button = getByText("Large");
    expect(button).toHaveClass("h-10");

    rerender(<Button size="icon">Icon</Button>);
    button = getByText("Icon");
    expect(button).toHaveClass("size-9");
  });

  it("applies additional className correctly", () => {
    const { getByText } = render(
      <Button className="test-class">With Class</Button>
    );
    const button = getByText("With Class");
    expect(button).toHaveClass("test-class");
  });

  it("supports asChild prop", () => {
    const { getByText } = render(
      <Button asChild={true}>
        <a href="https://example.com">Link Button</a>
      </Button>
    );

    const linkButton = getByText("Link Button");
    expect(linkButton).toBeInTheDocument();
    expect(linkButton.tagName).toBe("A");
    expect(linkButton.getAttribute("href")).toBe("https://example.com");
    expect(linkButton).toHaveClass("bg-primary");
  });

  it("passes through HTML attributes", () => {
    const { getByTestId } = render(
      <Button
        type="submit"
        aria-label="Submit Form"
        data-testid="submit-button"
        disabled={true}
      >
        Submit
      </Button>
    );

    const button = getByTestId("submit-button");
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.getAttribute("aria-label")).toBe("Submit Form");
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    const { getByText } = render(
      <Button onClick={handleClick}>Click me</Button>
    );

    const button = getByText("Click me");
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not trigger click when disabled", async () => {
    const handleClick = vi.fn();
    const { getByText } = render(
      <Button onClick={handleClick} disabled={true}>
        Click me
      </Button>
    );

    const button = getByText("Click me");
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
