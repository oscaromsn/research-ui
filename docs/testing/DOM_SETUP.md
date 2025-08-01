# DOM Setup for Component Tests

## Issue

Bun's test runner doesn't properly initialize the jsdom environment despite having it configured in `vitest.config.ts`. This causes React component tests to fail with errors like:

```
ReferenceError: document is not defined
TypeError: For queries bound to document.body a global document has to be available
```

## Solution

A manual DOM setup utility (`dom-setup.ts`) that initializes jsdom before Testing Library is imported.

## Usage

For any component test that needs DOM environment:

```typescript
// IMPORTANT: Import dom-setup FIRST, before Testing Library
import "../../../dom-setup"; // Adjust path as needed
import { render, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";

describe("My Component", () => {
  // Clean up DOM after each test to prevent pollution
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("should render correctly", () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText("Hello")).toBeInTheDocument();
  });
});
```

## Important Notes

1. **Import Order**: `dom-setup` must be imported BEFORE any Testing Library imports
2. **Cleanup**: Always clean up between tests using `cleanup()` and `document.body.innerHTML = ""`
3. **Screen Usage**: Avoid using `screen` from Testing Library - use render results instead
4. **Jest-DOM Matchers**: Some matchers like `toHaveAttribute` don't work with bun - use basic assertions:
   - ❌ `expect(element).toHaveAttribute("title", "value")`
   - ✅ `expect(element.getAttribute("title")).toBe("value")`

## Path Examples

- From `__tests__/components/domain/legal-research/`: Use `../../../dom-setup`
- From `__tests__/components/ui/`: Use `../../dom-setup`
- From `__tests__/components/layout/`: Use `../../dom-setup`

## What's Included

The DOM setup provides:

- Full jsdom environment with document, window, navigator
- HTML element constructors (HTMLElement, HTMLDivElement, etc.)
- Event classes (Event, MouseEvent, KeyboardEvent)
- Browser APIs (getComputedStyle, requestAnimationFrame)
- Jest-DOM matchers (partial compatibility)

## Example Test Structure

```typescript
import "../../../dom-setup";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("should handle clicks", () => {
    const handleClick = vi.fn();
    const { container } = render(<MyComponent onClick={handleClick} />);
    
    const button = container.querySelector("button");
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Troubleshooting

- **"document is not defined"**: Make sure `dom-setup` is imported first
- **"Multiple elements found"**: Clean up between tests with `afterEach`
- **"toHaveAttribute is not a function"**: Use `element.getAttribute()` instead
- **Tests hang**: Make sure to use `cleanup()` and clear `document.body.innerHTML`