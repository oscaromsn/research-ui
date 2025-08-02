# Claude Code Devtools Blueprint: Conflict-Free Development Architecture

## Executive Summary

This blueprint provides Claude Code instances with JurisConsulta's **battle-tested conflict-free development architecture**. The methodology eliminates the "test-TypeScript conflict cycle" through unified configuration, type-preserving mocks, and harmonious tool integration.

## Core Philosophy

**"Harmony First, Validate Continuously, Progress Measurably"**

Every code change must work harmoniously with both TypeScript compilation and test execution. This approach eliminates conflicts, maintains type safety, and ensures continuous progress without system conflicts.

## 🎯 Unified Testing Architecture Principles

### Conflict-Free Development Foundation

1. **Single Source of Truth Configuration**: Unified `tsconfig.json` prevents competing setups
2. **Type-Preserving Mock Architecture**: Mocks maintain TypeScript type information
3. **Unified DOM Environment**: Centralized Vitest-managed DOM setup
4. **Path Resolution Consistency**: Synchronized mappings across all tools

### Quality Gates (Harmonious Execution)

```bash
# Both systems must pass together - no conflicts
bun run typecheck  # TypeScript compilation ✅
bun run test       # Test execution ✅
# If one breaks, fix incrementally without breaking the other
```

## 🏗️ Type-Preserving Mock Architecture Patterns

### ✅ Established Mock Patterns (Battle-Tested)

#### Type-Safe Mock Interface Pattern

```typescript
// File: __tests__/lib/utils/exaSearchUtil.test.ts
// Define typed mock interfaces to preserve TypeScript information
type MockAxiosInstance = {
  post: ReturnType<typeof vi.fn> & {
    mockResolvedValueOnce: ReturnType<typeof vi.fn>['mockResolvedValueOnce'];
    mockRejectedValueOnce: ReturnType<typeof vi.fn>['mockRejectedValueOnce'];
  };
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  isAxiosError: ReturnType<typeof vi.fn>;
};

vi.mock("axios", () => {
  const mockPost = vi.fn() as MockAxiosInstance['post'];
  mockPost.mockResolvedValueOnce = vi.fn().mockReturnThis();
  mockPost.mockRejectedValueOnce = vi.fn().mockReturnThis();
  
  const mockAxios: MockAxiosInstance = {
    post: mockPost,
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    isAxiosError: vi.fn(),
  };
  
  return {
    __esModule: true,
    default: mockAxios,
    isAxiosError: mockAxios.isAxiosError,
  };
});

// Usage in tests with full type support
const mockedAxios = axios as unknown as MockAxiosInstance;
const mockPost = mockedAxios.post as MockAxiosInstance['post'];
```

#### Schema-Aligned Mock Pattern

```typescript
// Mock must match actual config structure exactly
vi.mock("@/lib/config", () => ({
  config: {
    research: {
      maxQueriesPerIteration: 3, // Matches actual schema
      maxDocumentsPerQuery: 5,   // Not defaultMaxResults
      searchTimeoutMs: 30000,
      maxRetries: 2,
    },
    features: {
      enableDetailedLogging: true,
      enableProgressIndicators: true,
    },
  },
}));
```

### ❌ Anti-Patterns That Break TypeScript Harmony

```typescript
// DON'T: Type-Erasing Mocks
vi.mock("axios", () => ({ 
  default: vi.fn() // Lost all type info
}));

// DON'T: Schema Assumptions
vi.mock("@/lib/config", () => ({
  config: {
    research: {
      defaultMaxResults: 5, // Assumed structure - causes runtime errors
    },
  },
}));

// DON'T: Competing DOM Setup
import "../../dom-setup"; // Competes with setupTests.ts
```

## 🔧 Configuration Unification Patterns

### Unified TypeScript Configuration

**Key Pattern**: Single `tsconfig.json` with aligned type imports order:

```json
// tsconfig.json - Single source of truth
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom", "node"],
    "paths": {
      "@/*": ["./*"],
      "@atoms/*": ["lib/state/atoms/*"],
      "@tests/*": ["__tests__/*"],
      "@mocks/*": ["__tests__/__mocks__/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx", 
    "__tests__/**/*.ts",
    "__tests__/**/*.tsx"
  ]
}
```

### DOM Environment Unification

**Pattern**: Centralized DOM setup via `setupTests.ts`:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./setupTests.ts"], // Single setup point
  },
});

// Component tests rely on centralized setup
// __tests__/components/MyComponent.test.tsx
// DOM setup handled by setupTests.ts via vitest.config.ts
import { render } from "@testing-library/react";
// No manual DOM imports needed
```

## 🛡️ Conflict Prevention Guidelines

### Development Workflow

1. **Configuration Changes**: Always update the single `tsconfig.json`
2. **Mock Implementation**: Use type-preserving patterns with proper interfaces
3. **DOM Testing**: Rely on centralized `setupTests.ts` configuration
4. **Path Updates**: Keep `vitest.config.ts` and `tsconfig.json` paths synchronized
5. **Schema Changes**: Update both implementation and test mocks together

### Quality Gates Validation

```bash
# Before any commit - both must pass harmoniously
bun run typecheck  # TypeScript compilation ✅
bun run test       # Test execution ✅

# Both systems should work together seamlessly
# If one breaks, fix incrementally without breaking the other
```

### Architecture Benefits

#### Immediate Benefits
- **No More Conflict Cycles**: Changes in tests don't break TypeScript and vice versa
- **Type Safety Preserved**: Full TypeScript support throughout test execution
- **Consistent Development**: Same patterns work across all test scenarios
- **Fast Feedback**: Both compilation and testing provide immediate feedback

#### Long-term Stability
- **Scalable Patterns**: New features follow established architectural patterns
- **Prevention Measures**: Built-in safeguards against configuration drift
- **Maintainable Mocks**: Type-safe mock factories encourage best practices
- **Clear Separation**: Distinct responsibilities between runtime and compile-time systems

**This architecture has eliminated 63 TypeScript errors and testing conflicts** that previously plagued development. Follow these patterns for conflict-free testing.

## Devtools Ecosystem Overview

### Quality Gates Hierarchy

```
Level 1: Format & Syntax     → bun run format
Level 2: Type Safety         → bun run typecheck
Level 3: Code Quality        → bun run lint
Level 4: Test Coverage       → bun run test
Level 5: Strict Validation   → bun run typecheck:strict
Level 6: Bundle Analysis     → bun run size
Level 7: Dependency Health   → bun run deps:check
```

### Validation Workflows

#### Quick Validation (Every Change)
```bash
bun run validate:quick  # typecheck + lint + format
```

#### Full Validation (Before Completion)
```bash
bun run validate:full   # All quality gates + tests + E2E + bundle analysis
```

#### CI Pipeline Simulation
```bash
bun run ci             # Complete validation suite for production readiness
```

## TDD Development Workflow

### Phase 1: Test-First Development

#### 1.1 Pre-Development Setup
```bash
# Verify clean starting state
bun run validate:quick
bun run test
bun run typecov
```

**Validation Rule**: All tools must pass before beginning new work.

#### 1.2 Write Failing Test
```bash
# Create test file or extend existing test
# Example: __tests__/components/new-feature.test.tsx

# Immediate validation
bun run typecheck      # Ensure test compiles
bun run test           # Verify test fails as expected
bun run lint           # Check test code quality
```

**Validation Checkpoint**: Test must fail for the right reason, with clean TypeScript compilation.

#### 1.3 Minimal Implementation
```bash
# Implement minimal code to make test pass
# Focus on single responsibility

# Atomic validation cycle
bun run typecheck      # Type safety first
bun run format         # Code formatting
bun run test           # Verify test passes
bun run lint           # Code quality
```

**Validation Rule**: Each atomic change must pass all Level 1-4 quality gates.

### Phase 2: Incremental Enhancement

#### 2.1 Feature Expansion
```typescript
// For each new capability:
// 1. Write test for new behavior
// 2. Run validation cycle
// 3. Implement minimal code
// 4. Run validation cycle
// 5. Refactor if needed
// 6. Run validation cycle
```

#### 2.2 Validation Pattern
```bash
# After every meaningful change (5-10 lines of code)
bun run typecheck && bun run test && bun run lint

# After every component/function completion
bun run validate:quick

# After every feature completion
bun run validate:full
```

### Phase 3: Quality Assurance

#### 3.1 Strict Validation
```bash
# Before marking work complete
bun run typecheck:strict    # Strictest TypeScript validation
bun run lint:strict         # Zero-warning linting
bun run test:coverage       # Verify test coverage
bun run typecov            # Type coverage analysis
```

#### 3.2 Production Readiness
```bash
# Final validation before completion
bun run size               # Bundle size analysis
bun run deps:check         # Dependency architecture
bun run audit              # Security vulnerabilities
bun run ci                 # Full CI simulation
```

## Tool-Specific Usage Guidelines

### TypeScript Validation

#### Immediate Type Checking
```bash
# After every file save/change
bun run typecheck
```

**When to Use**:
- After adding new types/interfaces
- After changing function signatures
- After importing new dependencies
- Before committing any change

#### Strict Mode Validation
```bash
# Before feature completion
bun run typecheck:strict
```

**When to Use**:
- Before marking tasks complete
- When aiming for maximum type safety
- Before production deployment

**Common Fixes**:
- Explicit type annotations for callback parameters
- Proper optional property handling
- `null` vs `undefined` alignment with external APIs

### Code Quality (Biome)

#### Continuous Linting
```bash
# After implementing logic
bun run lint
```

**Auto-Fix Pattern**:
```bash
bun run lint:fix           # Auto-fix simple issues
bun run lint               # Verify remaining issues
# Fix remaining issues manually
bun run lint:strict        # Zero-warning validation
```

**Common Issues & Solutions**:
- React Testing Library best practices
- Accessibility requirements
- Performance anti-patterns
- Security vulnerabilities

### Code Formatting

#### Format-First Approach
```bash
# Before reviewing code
bun run format             # Format code directly
```

**Integration Pattern**:
- Format after implementing each function
- Check formatting before validation cycles
- Auto-format before committing

### Testing Strategy

#### Test-Driven Cycle
```bash
# Red: Write failing test
bun run test

# Green: Make test pass
bun run test

# Refactor: Improve code
bun run test
bun run test:coverage      # Verify coverage
```

#### Test Categories
```bash
bun run test               # Unit & integration tests
bun run test:e2e          # End-to-end tests
bun run test:coverage     # Coverage analysis
```

## React Component Testing with Bun

### DOM Environment Setup

**Critical**: Bun's test runner requires manual DOM initialization for React component tests.

#### Standard Component Test Pattern

```typescript
// STEP 1: Import DOM setup FIRST (before Testing Library)
import "../../../dom-setup"; // Adjust path based on test location

// STEP 2: Import Testing Library WITHOUT screen, include cleanup
import { render, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// STEP 3: Import vitest with afterEach
import { describe, expect, it, vi, afterEach } from "vitest";

// STEP 4: Import your component
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  // STEP 5: ALWAYS add cleanup after each test
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("should render correctly", () => {
    // STEP 6: Destructure needed queries from render result
    const { getByText, getByRole, container } = render(
      <MyComponent prop="value" />
    );

    // STEP 7: Use destructured queries instead of screen
    expect(getByText("Expected Text")).toBeInTheDocument();
    
    // Direct element access when needed
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass("expected-class");
  });

  it("should handle user interactions", async () => {
    const handleClick = vi.fn();
    const { getByText } = render(
      <MyComponent onClick={handleClick} />
    );

    const button = getByText("Click me");
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### DOM Setup Import Paths

**Critical**: Import path must be correct based on test file location:

```typescript
// For files in __tests__/components/ui/
import "../../dom-setup";

// For files in __tests__/components/layout/
import "../../dom-setup";

// For files in __tests__/components/domain/*/
import "../../../dom-setup";

// For files in __tests__/components/domain/*/*/
import "../../../../dom-setup";
```

### Bun-Specific Compatibility Rules

#### ❌ Avoid These Patterns (Broken with Bun)
```typescript
// DON'T: Use screen utility
import { render, screen } from "@testing-library/react";
const button = screen.getByText("Click me");

// DON'T: Use jest-dom matchers
expect(element).toHaveAttribute("title", "value");
expect(element).toBeDisabled();

// DON'T: Module-level vi.mock
vi.mock("@/components/MyComponent", () => ({ ... }));
```

#### ✅ Use These Patterns (Works with Bun)
```typescript
// DO: Destructure queries from render
import { render } from "@testing-library/react";
const { getByText } = render(<Component />);
const button = getByText("Click me");

// DO: Use basic DOM assertions
expect(element.getAttribute("title")).toBe("value");
expect(element.hasAttribute("disabled")).toBe(true);

// DO: Mock in beforeEach or test scope
beforeEach(() => {
  vi.mocked(mockFunction).mockReturnValue(mockValue);
});
```

### Common Testing Patterns

#### Testing CSS Classes and Styling
```typescript
it("should apply correct classes", () => {
  const { container } = render(<Component variant="primary" />);
  const element = container.firstChild as HTMLElement;
  
  expect(element).toHaveClass("bg-primary", "text-white");
  expect(element.classList.contains("disabled")).toBe(false);
});
```

#### Testing Conditional Rendering
```typescript
it("should handle conditional rendering", () => {
  const { queryByText, rerender } = render(<Component show={false} />);
  
  expect(queryByText("Hidden Content")).not.toBeInTheDocument();
  
  rerender(<Component show={true} />);
  expect(queryByText("Hidden Content")).toBeInTheDocument();
});
```

#### Testing Form Elements
```typescript
it("should handle form input", async () => {
  const { getByRole } = render(<Input placeholder="Enter text" />);
  const input = getByRole("textbox");
  
  await userEvent.type(input, "Hello World");
  expect(input.value).toBe("Hello World");
});
```

#### Testing Props and Variants
```typescript
it("should handle different props", () => {
  const { rerender, getByText } = render(
    <Button variant="primary">Primary</Button>
  );

  let button = getByText("Primary");
  expect(button).toHaveClass("bg-primary");

  rerender(<Button variant="secondary">Secondary</Button>);
  button = getByText("Secondary");
  expect(button).toHaveClass("bg-secondary");
});
```

### Performance Considerations

- **DOM Setup Time**: ~50ms per test file
- **Test Execution**: 2-3 seconds for 33 component tests
- **Memory Usage**: Minimal with proper cleanup
- **Scaling**: Linear with test count

### Quick Reference Template

Copy `__tests__/COMPONENT_TEST_TEMPLATE.tsx` for new component tests.

### Troubleshooting

#### "document is not defined"
- Ensure `dom-setup` is imported FIRST
- Check import path is correct

#### "Found multiple elements"
- Add proper `afterEach` cleanup
- Clear `document.body.innerHTML`

#### "toHaveAttribute is not a function"
- Use `element.getAttribute()` instead
- Use `element.hasAttribute()` for boolean checks

### Bundle Analysis

#### Performance Monitoring
```bash
# After adding dependencies
bun run size

# For detailed analysis
bun run size:debug
bun run bundle:analyze
```

**Size Thresholds**:
- Main chunks: < 50KB
- Page chunks: < 100KB
- Layout chunks: < 50KB

### Dependency Management

#### Continuous Monitoring
```bash
# After dependency changes
bun run deps:check
bun run audit

# Automated cleanup
bun run knip              # Remove unused dependencies
```

## Atomic Change Methodology

### Change Size Guidelines

#### Micro-Changes (1-3 lines)
```bash
# Validation: Type check only
bun run typecheck
```

#### Small Changes (4-20 lines)
```bash
# Validation: Quick cycle
bun run typecheck && bun run test
```

#### Medium Changes (21-100 lines)
```bash
# Validation: Standard cycle
bun run validate:quick
```

#### Large Changes (100+ lines)
```bash
# Validation: Full cycle
bun run validate:full
```

### Validation Frequency

#### Every Code Change
1. Save file
2. Run `bun run typecheck`
3. Fix any type errors immediately
4. Continue development

#### Every Function/Component
1. Complete implementation
2. Run `bun run validate:quick`
3. Fix all issues before proceeding
4. Add/update tests

#### Every Feature
1. Complete feature implementation
2. Run `bun run validate:full`
3. Address all quality issues
4. Verify E2E functionality

## Error Resolution Patterns

### TypeScript Errors

#### Approach
1. **Understand the Error**: Read TypeScript error messages carefully
2. **Fix Root Cause**: Don't use `any` as a quick fix
3. **Validate Fix**: Ensure `typecheck:strict` passes
4. **Test Impact**: Run tests to verify functionality

#### Common Patterns
```typescript
// Instead of any, use proper typing
const handler = (event: React.ChangeEvent<HTMLInputElement>) => { ... }

// Handle optional properties correctly
const props = {
  ...baseProps,
  ...(optionalValue && { optionalProp: optionalValue })
}

// Use null for external API compatibility
const result = externalApiResult ?? null; // not undefined
```

### Biome Errors

#### Systematic Resolution
1. **Auto-fix first**: `bun run lint:fix`
2. **Understand remaining**: Read rule documentation
3. **Fix properly**: Follow best practices, don't disable rules
4. **Verify**: `bun run lint:strict`

#### Priority Order
1. Security issues (high priority)
2. Accessibility violations (high priority)
3. Performance issues (medium priority)
4. Style/consistency (low priority)

### Test Failures

#### Debug Process
1. **Isolate**: Run single test file
2. **Debug**: Add console.logs or use debugger
3. **Fix**: Address root cause
4. **Verify**: Run full test suite
5. **Coverage**: Check test coverage impact

## Performance Optimization Guidelines

### Bundle Size Management

#### Monitoring
```bash
# After every dependency addition
bun run size

# Weekly review
bun run size:analyze       # Generate detailed report
```

#### Optimization Strategies
1. **Lazy Loading**: Use dynamic imports for large components
2. **Tree Shaking**: Ensure proper ESM imports
3. **Bundle Splitting**: Optimize webpack chunks
4. **Dependency Audit**: Remove unused packages with `knip`

### Type Coverage Optimization

#### Target: 100% for Source Files
```bash
# Monitor coverage
bun run typecov

# Identify gaps
bun run typecov --detail
```

#### Improvement Strategies
1. **Explicit Types**: Add type annotations for complex expressions
2. **Generic Constraints**: Use proper generic bounds
3. **External Types**: Define types for external APIs
4. **Utility Types**: Leverage TypeScript utility types

## Automation Integration

### Pre-commit Hooks

#### Recommended Setup
```bash
# Auto-run before commit
bun run validate:quick
bun run test
```

#### Commit Message Validation
```bash
# Ensure conventional commits
bun run commitlint
```

### CI/CD Integration

#### Pull Request Pipeline
```bash
bun run validate:full      # Complete validation
bun run test:e2e          # E2E testing
bun run audit             # Security check
```

#### Deployment Pipeline
```bash
bun run ci                # Full CI validation
bun run build             # Production build
bun run size              # Bundle analysis
```

## Advanced Patterns

### Complex Feature Development

#### Multi-Component Features
1. **Plan**: Break down into atomic components
2. **Test Structure**: Create test hierarchy
3. **Incremental**: Build component by component
4. **Integration**: Validate component interactions
5. **E2E**: Test complete user workflows

#### API Integration
1. **Types First**: Define API types
2. **Mock Implementation**: Create mock for testing
3. **Test Cases**: Cover all scenarios
4. **Real Integration**: Replace mocks gradually
5. **Error Handling**: Test failure scenarios

### Refactoring Workflows

#### Safe Refactoring
1. **Test Coverage**: Ensure comprehensive tests
2. **Type Safety**: Use TypeScript for confidence
3. **Incremental**: Make small, verifiable changes
4. **Validation**: Run full test suite after each step
5. **Regression**: Test original functionality

## Troubleshooting Guide

### Common Issues

#### "Tests Pass But App Breaks"
1. Check E2E tests: `bun run test:e2e`
2. Verify type safety: `bun run typecheck:strict`
3. Check bundle issues: `bun run size`
4. Review dependencies: `bun run deps:check`

#### "TypeScript Errors in CI But Not Locally"
1. Clear cache: `rm -rf .next node_modules/.cache`
2. Reinstall: `bun install`
3. Check versions: `bun run typecheck:strict`
4. Verify environment: Check Node.js and bun versions

#### "Performance Regression"
1. Bundle analysis: `bun run size:analyze`
2. Dependency audit: `bun run deps:check`
3. Test performance: Check test execution time
4. Profile build: Use Next.js analyzer

### Recovery Procedures

#### From Broken State
1. **Assess**: `bun run validate:quick`
2. **Prioritize**: Fix TypeScript errors first
3. **Incremental**: Fix one issue type at a time
4. **Validate**: Run tools after each fix
5. **Test**: Ensure functionality intact

#### From Dependency Issues
1. **Audit**: `bun run audit`
2. **Clean**: `bun run knip`
3. **Update**: `bun run audit:fix`
4. **Validate**: `bun run validate:full`

## Best Practices Summary

### Golden Rules

1. **Never Skip Validation**: Every change must pass quality gates
2. **Fix Forward**: Address issues immediately, don't accumulate debt
3. **Test First**: Write tests before implementation
4. **Type Safety**: Maintain strict TypeScript standards
5. **Incremental Progress**: Make small, verifiable changes

### Quality Metrics

#### Minimum Thresholds
- TypeScript: 100% compilation success
- Type Coverage: >98.9% for source files
- Test Coverage: >90% for new code
- Lint: Zero errors in strict mode
- Bundle Size: Within defined limits

#### Excellence Targets
- Type Coverage: 100% for source files
- Test Coverage: >95%
- Performance: <100ms build changes
- Security: Zero vulnerabilities

### Time Investment

#### Development Phases
- **Setup**: 5% (Initial validation)
- **Implementation**: 70% (Code + immediate validation)
- **Quality Assurance**: 20% (Comprehensive validation)
- **Documentation**: 5% (Update docs/tests)

#### ROI Expectations
- **Short-term**: Catch issues early (save debugging time)
- **Medium-term**: Maintain code quality (reduce technical debt)
- **Long-term**: Enable confident refactoring (increase velocity)

## Conclusion

This blueprint ensures that Claude Code instances can maintain the highest code quality standards while developing efficiently through TDD principles. The key is immediate validation of every change, comprehensive tool utilization, and systematic quality assurance.

By following this methodology, development becomes predictable, reliable, and maintains consistent quality throughout the project lifecycle. The investment in static analysis and testing pays dividends in reduced debugging time, increased confidence in changes, and long-term maintainability.

Remember: **The goal is not just working code, but provably correct, maintainable, and high-quality code that passes all static analysis checks.**