# DOM Testing Pattern for Bun Test Runner

## Overview

This document describes the successful pattern established for React component testing with Bun's test runner, addressing DOM environment initialization issues and screen utility incompatibilities.

## Problem Statement

Bun's test runner has several incompatibilities with standard React testing patterns:

1. **DOM Environment**: Bun doesn't properly initialize jsdom despite vitest configuration
2. **Screen Utility**: Testing Library's `screen` utility fails with DOM availability errors
3. **Jest-DOM Matchers**: Some matchers like `toHaveAttribute()` are incompatible with Bun
4. **Module Mocks**: `vi.mock()` at module level is not supported

## Solution Architecture

### Core Components

1. **DOM Setup Utility** (`__tests__/dom-setup.ts`)
2. **Import Order Protocol**
3. **Query Pattern Standard**
4. **Cleanup Strategy**

## Implementation Details

### 1. DOM Setup Utility

**File**: `__tests__/dom-setup.ts`

```typescript
import { JSDOM } from "jsdom";

// Only initialize once
let isInitialized = false;

export function setupDOMEnvironment() {
  if (isInitialized || typeof document !== "undefined") {
    return;
  }

  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost:3000",
    pretendToBeVisual: true,
    resources: "usable",
  });

  // Set up all necessary globals
  global.window = dom.window as unknown as Window & typeof globalThis;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.location = dom.window.location;
  
  // HTML element constructors
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLDivElement = dom.window.HTMLDivElement;
  global.HTMLButtonElement = dom.window.HTMLButtonElement;
  // ... (full implementation in actual file)
  
  isInitialized = true;
}

// Auto-initialize when imported
setupDOMEnvironment();
```

### 2. Standard Test Pattern

**Template Structure**:

```typescript
// STEP 1: Import DOM setup FIRST
import "../../../dom-setup"; // Adjust path based on location

// STEP 2: Import Testing Library WITHOUT screen
import { render, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// STEP 3: Import vitest with afterEach
import { describe, expect, it, vi, afterEach } from "vitest";

// STEP 4: Import component
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  // STEP 5: Cleanup after each test
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("should render correctly", () => {
    // STEP 6: Destructure queries from render
    const { getByText, getByRole, container } = render(
      <MyComponent prop="value" />
    );

    // STEP 7: Use destructured queries
    expect(getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### 3. Path Resolution

**DOM Setup Import Paths**:

| Test Location | Import Path |
|---------------|-------------|
| `__tests__/components/ui/` | `import "../../dom-setup";` |
| `__tests__/components/layout/` | `import "../../dom-setup";` |
| `__tests__/components/domain/*/` | `import "../../../dom-setup";` |
| `__tests__/components/domain/*/*/` | `import "../../../../dom-setup";` |

### 4. Query Patterns

**Replace Screen Usage**:

```typescript
// ❌ BROKEN (Screen pattern):
import { render, screen } from "@testing-library/react";

it("test", () => {
  render(<Component />);
  const button = screen.getByText("Click me");
  const input = screen.getByRole("textbox");
});

// ✅ WORKING (Destructured pattern):
import { render } from "@testing-library/react";

it("test", () => {
  const { getByText, getByRole } = render(<Component />);
  const button = getByText("Click me");
  const input = getByRole("textbox");
});
```

### 5. Assertion Patterns

**Bun-Compatible Assertions**:

```typescript
// ❌ Jest-DOM matchers (incompatible):
expect(element).toHaveAttribute("title", "value");
expect(element).toBeDisabled();

// ✅ Basic DOM assertions (compatible):
expect(element.getAttribute("title")).toBe("value");
expect(element.hasAttribute("disabled")).toBe(true);
```

## Validation Results

### Proven Success Cases

| Component | Tests | Status | Coverage |
|-----------|-------|--------|----------|
| Button | 11/11 | ✅ Pass | Click events, variants, sizes, props |
| Modal | 5/5 | ✅ Pass | Open/close, sizes, overlay, events |
| EntityBadge | 17/17 | ✅ Pass | Interactivity, confidence, sizes, types |

### Performance Metrics

- **Test Execution**: ~2-3 seconds for 33 component tests
- **DOM Initialization**: ~50ms overhead per test file
- **Memory Usage**: Minimal impact with proper cleanup

## Common Issues & Solutions

### Issue 1: DOM Not Available

**Symptom**: `ReferenceError: document is not defined`

**Solution**: 
```typescript
// Ensure dom-setup is imported FIRST
import "../dom-setup"; // Must be first import
import { render } from "@testing-library/react";
```

### Issue 2: Screen Utility Errors

**Symptom**: `TypeError: For queries bound to document.body a global document has to be available`

**Solution**:
```typescript
// Don't import screen
import { render } from "@testing-library/react"; // No screen

// Use destructured queries
const { getByText } = render(<Component />);
```

### Issue 3: DOM Pollution Between Tests

**Symptom**: `Found multiple elements with the text: ...`

**Solution**:
```typescript
afterEach(() => {
  cleanup(); // Testing Library cleanup
  document.body.innerHTML = ""; // Manual DOM cleanup
});
```

### Issue 4: Jest-DOM Matcher Errors

**Symptom**: `TypeError: Expected this to be instanceof ExpectMatcherUtils`

**Solution**:
```typescript
// Use basic DOM methods
expect(element.getAttribute("class")).toContain("expected-class");
expect(element.hasAttribute("disabled")).toBe(true);
```

## Advanced Patterns

### Testing User Interactions

```typescript
it("should handle user interactions", async () => {
  const handleClick = vi.fn();
  const { getByText } = render(<Button onClick={handleClick} />);
  
  const button = getByText("Click me");
  await userEvent.click(button);
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing Conditional Rendering

```typescript
it("should handle conditional rendering", () => {
  const { queryByText, rerender } = render(<Component show={false} />);
  
  expect(queryByText("Hidden Content")).not.toBeInTheDocument();
  
  rerender(<Component show={true} />);
  expect(queryByText("Hidden Content")).toBeInTheDocument();
});
```

### Testing CSS Classes and Styles

```typescript
it("should apply correct styling", () => {
  const { container } = render(<Component variant="primary" />);
  const element = container.firstChild as HTMLElement;
  
  expect(element).toHaveClass("bg-primary", "text-white");
  expect(element.classList.contains("disabled")).toBe(false);
});
```

### Testing Form Elements

```typescript
it("should handle form input", async () => {
  const { getByRole } = render(<Input placeholder="Enter text" />);
  const input = getByRole("textbox");
  
  await userEvent.type(input, "Hello World");
  expect(input.value).toBe("Hello World");
});
```

## Integration Guidelines

### For New Components

1. Copy `__tests__/COMPONENT_TEST_TEMPLATE.tsx`
2. Adjust DOM setup import path
3. Replace component import and props
4. Adapt test cases to component functionality

### For Existing Tests

1. Add DOM setup import at the top
2. Remove `screen` from Testing Library imports
3. Add `cleanup` to Testing Library imports
4. Add `afterEach` to vitest imports
5. Replace `screen.getBy*()` with destructured queries
6. Replace jest-dom matchers with basic assertions

### For Complex Components

1. Use `container.querySelector()` for complex DOM navigation
2. Use `within()` for scoped queries within components
3. Use `waitFor()` for asynchronous behavior
4. Use `act()` wrapper for state updates

## Maintenance

### Regular Tasks

1. **Update DOM Setup**: Keep jsdom version updated
2. **Monitor Performance**: Watch for test execution time increases
3. **Review Patterns**: Ensure new tests follow established patterns
4. **Documentation**: Keep examples current with Testing Library updates

### Troubleshooting Checklist

- [ ] DOM setup imported first
- [ ] No screen imports
- [ ] Cleanup in afterEach
- [ ] Correct import paths
- [ ] Basic assertions instead of jest-dom matchers
- [ ] No module-level vi.mock usage

## Future Improvements

### Potential Enhancements

1. **Custom Render Function**: Wrapper with common providers
2. **Query Helpers**: Utility functions for common patterns
3. **Mock Factories**: Standardized mock creation patterns
4. **Performance Monitoring**: Automated test execution time tracking

### Migration Path

When Bun improves jsdom support:
1. Remove manual DOM setup
2. Restore screen utility usage
3. Restore jest-dom matchers
4. Update documentation and templates

## Conclusion

This DOM testing pattern provides a robust, scalable solution for React component testing with Bun's test runner. The pattern has been validated with 33+ passing tests across multiple component types and interaction patterns.

**Key Success Factors**:
- Manual DOM initialization works around Bun limitations
- Query destructuring eliminates screen utility issues
- Basic assertions ensure cross-compatibility
- Proper cleanup prevents test interference
- Clear documentation enables team adoption

The pattern is production-ready and provides a solid foundation for comprehensive React component testing in the Bun ecosystem.