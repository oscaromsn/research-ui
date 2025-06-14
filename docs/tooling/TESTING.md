# Testing Guide for JurisConsulta

This document provides a comprehensive guide to the testing ecosystem in
JurisConsulta. Our testing strategy is designed to ensure code quality,
reliability, and maintainability across the entire application.

## Quick Start

### For New Developers

```bash
# Run fast unit tests (recommended for development)
bun run test

# Watch mode for active development
bun run test:watch

# Run all tests (includes slow integration tests)
bun run test:all
```

### For CI/CD

```bash
# Complete validation suite
bun ci
```

## Test Architecture Overview

Our testing ecosystem is organized into multiple layers, each serving a specific
purpose:

```
📁 __tests__/
├── 📁 actions/                 # Server Action tests
├── 📁 app/                     # App Router and API tests
├── 📁 components/              # React Component tests
│   ├── 📁 domain/             # Feature-specific components
│   ├── 📁 layout/             # Layout components
│   └── 📁 ui/                 # Generic UI primitives
├── 📁 integration/             # Real API integration tests (SLOW)
│   ├── 📁 fast/               # Mocked APIs (~1s)
│   ├── 📁 medium/             # Some real APIs (~30s)
│   └── 📁 slow/               # Full API pipeline (~5min)
├── 📁 lib/                     # Utility and hook tests
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 state/              # Jotai atom tests
│   └── 📁 utils/              # Utility functions
└── 📁 utils/                   # Test helper utilities

📁 e2e/                         # End-to-end Playwright tests
📁 baml_src/                    # AI/LLM function tests (.test.baml files)

## Key Configuration Files
📄 vitest.config.ts             # Vitest configuration
📄 setupTests.ts                # Global test setup
📄 __tests__/test-utils.tsx     # Custom test utilities
📄 playwright.config.ts         # E2E test configuration
📄 .env.test                    # Test environment variables
📄 package.json                # Test scripts and dependencies
```

## Test Types & Commands

### 🚀 Unit Tests (Fast - Recommended for Development)

**What**: Tests individual components, hooks, and utilities in isolation
**Speed**: ~30-60 seconds
**Dependencies**: None (mocked)

```bash
# Run all unit tests (excludes integration)
bun run test

# With verbose output
bun run test:verbose

# Watch mode for development
bun run test:watch

# With coverage report
bun run test:coverage

# Specific unit tests only
bun run test:unit
```

**When to use**:

- Daily development
- Before committing code
- Testing individual components/functions

### 🔗 Integration Tests (Tiered by Speed)

#### Fast Integration Tests (~1s)

**What**: Tests complete flows with mocked external APIs
**Speed**: Under 1 second per test
**Dependencies**: None (all APIs mocked)

```bash
# Run fast integration tests
bun run test:integration:fast

# With watch mode
bun run test:integration:fast:watch
```

#### Medium Integration Tests (~30s)

**What**: Tests with some real API calls (Exa Search only)
**Speed**: ~30 seconds per test
**Dependencies**: `EXA_API_KEY`

```bash
# Run medium integration tests
bun run test:integration:medium

# With debug output
bun run test:integration:medium:debug

# Watch mode (not recommended - uses real APIs)
bun run test:integration:medium:watch
```

#### Slow Integration Tests (~5min)

**What**: Tests the complete research pipeline with real AI APIs
**Speed**: ~5-10 minutes per test
**Dependencies**: `GOOGLE_API_KEY`, `EXA_API_KEY`

```bash
# Run slow integration tests
bun run test:integration:slow

# With debug output
bun run test:integration:slow:debug

# All integration tests
bun run test:integration
```

**Setup Requirements**:

```bash
# Required environment variables
export GOOGLE_API_KEY="your-google-ai-key"
export EXA_API_KEY="your-exa-search-key"
```

### 🤖 BAML/AI Tests (Requires AI API Keys)

**What**: Tests AI function definitions and prompts using BAML framework
**Speed**: ~2-5 minutes
**Dependencies**: AI provider API keys

```bash
# Run BAML tests
bun run baml:test

# Run specific tests (interactive mode)
bun run baml:test:this

# Generate BAML client after changes
bun run baml:generate

# BAML configuration files:
# baml_src/generators.baml     # Client generation config
# baml_src/clients.baml        # AI provider clients
```

### 🌐 End-to-End Tests (Browser Automation)

**What**: Tests complete user workflows in a real browser
**Speed**: ~3-10 minutes
**Dependencies**: Browser automation setup

```bash
# Run E2E tests
bun run test:e2e

# Interactive mode
bun run test:e2e:ui

# Debug mode
bun run test:e2e:debug
```

### Environment Setup

### Development Environment

```bash
# Copy environment template
cp .env.example .env.local

# Add your API keys (optional for unit tests)
# File: .env.local
GOOGLE_API_KEY=your-key-here
EXA_API_KEY=your-key-here
```

**Key Files:**

- `.env.example` - Environment template
- `.env.local` - Local development environment
- `.env.test` - Test-specific environment variables

### Testing Environment Variables

```bash
# Create test-specific environment file
cp .env.example .env.test

# Add test API keys
# File: .env.test
GOOGLE_API_KEY=your-test-key
EXA_API_KEY=your-test-key
```

**Configuration Files:**

- `vitest.config.ts` - Loads `.env.test` automatically
- `setupTests.ts` - Global test configuration and mocks

### CI/CD Environment

The CI system automatically:

- Runs unit tests always
- Skips integration tests unless API keys are provided
- Runs E2E tests in headless mode

## Test File Organization

### Naming Conventions

```
ComponentName.test.tsx              # React component tests
hookName.test.ts                   # Custom hook tests
utilityName.test.ts                # Utility function tests
feature-integration.test.ts        # Integration tests
feature.e2e.test.ts               # End-to-end tests
FunctionName.test.baml            # BAML AI function tests
```

**Example File Paths:**

- `__tests__/components/ui/button.test.tsx`
- `__tests__/lib/hooks/useResearchAgent.test.ts`
- `__tests__/lib/utils/exaSearchUtil.test.ts`
- `__tests__/integration/fast/orchestrator-basic.test.ts`
- `e2e/app.spec.ts`
- `baml_src/functions/GenerateLegalSearchQueries.test.baml`

### File Structure Example

```typescript
// Standard test file structure
// File: __tests__/components/ComponentName.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComponentName } from '@/components/ComponentName'

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

**Import Path Reference:**

- `@/components/*` - Component imports
- `@/lib/*` - Library and utility imports
- `@/app/*` - App Router imports
- `@/baml_client/*` - Generated BAML client imports
- `../test-utils` - Relative import for test utilities

## Key Testing Libraries

### Core Testing Stack

- **Vitest**: Fast unit test runner with native ESM support (`vitest.config.ts`)
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end browser testing (`playwright.config.ts`)
- **BAML**: AI function testing framework (`baml_src/*.test.baml`)
- **Happy DOM**: Lightweight DOM implementation

### Testing Utilities

- **@testing-library/jest-dom**: DOM matchers (`setupTests.ts`)
- **@testing-library/user-event**: User interaction simulation
- **Jotai**: State management testing utilities (`__tests__/test-utils.tsx`)

**Key Utility Files:**

- `__tests__/test-utils.tsx` - Custom render functions and providers
- `setupTests.ts` - Global test configuration
- `__tests__/utils/api-test-helpers.test.ts` - API testing utilities

## Common Testing Patterns

### React Component Testing

```typescript
// File: __tests__/components/domain/MyComponent.test.tsx
import { renderWithProviders } from '../../test-utils'
import userEvent from '@testing-library/user-event'

describe('MyComponent', () => {
  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MyComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })
})
```

**Related Files:**

- `__tests__/test-utils.tsx` - Contains `renderWithProviders` helper
- `components/domain/MyComponent.tsx` - Component under test

### Custom Hook Testing with Jotai

```typescript
// File: __tests__/lib/hooks/useResearchAgent.test.ts
import { renderHook, act } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import { useResearchAgent } from '@/lib/hooks/useResearchAgent'

describe('useResearchAgent', () => {
  let store: ReturnType<typeof createStore>
  
  beforeEach(() => {
    store = createStore()
  })

  const wrapper = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  )

  it('should update state correctly', () => {
    const { result } = renderHook(() => useResearchAgent(), { wrapper })
    
    act(() => {
      result.current.startResearch('legal question')
    })
    
    expect(result.current.isLoading).toBe(true)
  })
})
```

### Server Action Testing

```typescript
// File: __tests__/actions/researchAgentOrchestrator.test.ts
import { conductResearch } from '@/app/actions/researchAgentOrchestrator'

// Mock external dependencies at the test file level
vi.mock('@/lib/utils/exaSearchUtil', () => ({
  executeExaSearch: vi.fn().mockResolvedValue([])
}))

describe('conductResearch', () => {
  it('should handle legal questions correctly', async () => {
    const stream = await conductResearch('legal question', {
      isEnabled: false,
      maxIterations: 5,
      currentIteration: 0
    })
    
    // Test stream processing...
    const reader = stream.getReader()
    const { value } = await reader.read()
    expect(value).toBeDefined()
  })
})
```

**Related Files:**

- `app/actions/researchAgentOrchestrator.ts` - Server action under test
- `lib/utils/exaSearchUtil.ts` - External dependency being mocked
- `baml_client/index.ts` - Generated BAML client (often mocked)

### Proper Mock Patterns (Anti-Pattern Prevention)

#### ✅ Correct: Mock at Test File Level

```typescript
// File: __tests__/lib/utils/exaSearchUtil.test.ts
// Mock external dependencies at the top of the test file
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
  isAxiosError: vi.fn(),
}))

import axios from 'axios'
const mockedAxios = vi.mocked(axios)

describe('API tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle API calls', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} })
    // Test implementation...
  })
})
```

#### ✅ Correct: Using importOriginal for Partial Mocks

```typescript
// File: __tests__/components/domain/evidence-analysis.test.tsx
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>
  return {
    ...actual,
    AlertCircle: () => 'AlertCircle',
    Brain: () => 'Brain',
  }
})
```

#### ❌ Incorrect: Conditional Mocking in Setup Files

```typescript
// DON'T DO THIS in setupTests.ts
const testType = process.env.VITEST_TEST_TYPE || "unit"

if (testType === "unit") {
  vi.mock("axios", () => ({
    // This is an anti-pattern - mocks must be statically analyzable
  }))
}
```

**Why this fails:**

- `setupTests.ts` is loaded before test files
- Conditional mocks violate Vitest's static analysis requirements
- Can cause unpredictable mock behavior across different test runs

#### ❌ Incorrect: Complex Global Mocks

```typescript
// DON'T DO THIS in setupTests.ts - causes unpredictable behavior
global.fetch = vi.fn() // Use proper vi.mock instead
```

## Debugging Tests

### Common Issues & Solutions

**Vitest mock errors**:

```typescript
// Problem: "No export defined on mock"
// Solution: Use importOriginal for partial mocks
vi.mock('module', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, specificExport: vi.fn() }
})
```

**Tests timing out**:

```bash
# Increase timeout for specific tests
bun run test --timeout=60000

# Or set per test
it('slow test', { timeout: 30000 }, async () => {
  // test implementation
})
```

**Mock not applying**:

```typescript
// Ensure mocks are defined before imports
vi.mock('@/module')
import { functionToTest } from '@/module'

// Clear mocks between tests
afterEach(() => {
  vi.clearAllMocks()
})
```

**Integration test failures**:

```bash
# Check API key setup
echo $GOOGLE_API_KEY
echo $EXA_API_KEY

# Run with debug output
bun run test:integration:medium:debug
```

### Debug Mode

```bash
# Run tests with debug output
DEBUG_API_TESTS=true bun run test:integration

# Use Vitest UI for interactive debugging
bun run test:ui

# Run specific file with verbose output
bun run test:file path/to/test.ts
```

## Performance Considerations

### Test Execution Times

| Test Type          | Duration | Frequency        | Usage                 |
|--------------------|----------|------------------|-----------------------|
| Unit Tests         | 30-60s   | Every commit     | Daily development     |
| Fast Integration   | 1-5s     | Feature testing  | Component integration |
| Medium Integration | 30s-2min | Pre-PR           | API validation        |
| Slow Integration   | 5-10min  | Before releases  | Full pipeline         |
| E2E Tests          | 3-10min  | Nightly/releases | User workflows        |
| BAML Tests         | 2-5min   | AI changes       | Prompt validation     |

### Optimization Tips

1. **Use unit tests for logic validation**
2. **Use fast integration tests for component integration**
3. **Reserve medium/slow integration tests for critical paths**
4. **Run expensive tests less frequently**
5. **Use test.concurrent for independent tests**

## Continuous Integration

### GitHub Actions Workflow

```yaml
# Automated test execution levels
- Unit tests: Always run (required for PR)
- Fast integration: Run on PR
- Medium integration: Run with EXA_API_KEY
- Slow integration: Run on main branch with full API keys
- E2E tests: Run on main branch
- Coverage reports: Generated automatically
```

### Environment-Based Test Execution

```bash
# CI automatically skips tests based on available environment variables
if (process.env.EXA_API_KEY) {
  // Run medium integration tests
}

if (process.env.GOOGLE_API_KEY && process.env.EXA_API_KEY) {
  // Run slow integration tests
}
```

## Best Practices

### Writing Good Tests

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests independent and isolated**
4. **Mock external dependencies properly**
5. **Test edge cases and error conditions**
6. **Use the appropriate test level for what you're testing**

### Mock Management

1. **Define mocks at the test file level with vi.mock()**
2. **Use vi.mocked() for TypeScript support**
3. **Clear mocks between tests with vi.clearAllMocks()**
4. **Use importOriginal for partial mocks**
5. **Avoid conditional mocking in setup files**

### Test Organization

1. **Group related tests with describe blocks**
2. **Use beforeEach/afterEach for setup/teardown**
3. **Keep test files close to source code**
4. **Use consistent naming conventions**
5. **Organize integration tests by speed/complexity**

### Performance

1. **Start with unit tests, then add integration as needed**
2. **Use fast integration tests for component workflows**
3. **Reserve slow integration tests for critical user paths**
4. **Use test.concurrent for parallel execution when safe**

## Troubleshooting

### Common Error Messages

**"vi.mock is not a function"**

- Cause: Missing vitest import
- Solution: Add `import { vi } from 'vitest'` at top of test file

**"No export defined on mock"**

- Cause: Missing export in mock definition
- Solution: Use importOriginal or define all needed exports

**"API key not found"**

- Cause: Missing environment variables for integration tests
- Solution: Check `.env.test` file and API key setup

**"Test timeout"**

- Cause: Integration tests taking too long or hanging
- Solution: Check network connectivity, API status, and increase timeout

**"MockedFunction is not assignable"**

- Cause: TypeScript type issues with mocks
- Solution: Use `vi.mocked()` for proper type inference

**Configuration Files to Check:**

- `tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Vitest TypeScript settings
- `setupTests.ts` - Global mock configurations

### Mock Debugging

```typescript
// Debug mock calls in any test file
console.log(mockedFunction.mock.calls)
console.log(mockedFunction.mock.results)

// Check if mock was called
expect(mockedFunction).toHaveBeenCalled()
expect(mockedFunction).toHaveBeenCalledWith(expectedArgs)
```

### Getting Help

1. Check test logs for specific error messages
2. Verify environment setup (API keys, dependencies)
3. Run tests in isolation to identify issues
4. Check if external APIs are accessible
5. Use `bun run test:ui` for interactive debugging

**Helpful Files for Debugging:**

- `package.json` - Available test scripts
- `vitest.config.ts` - Test configuration and paths
- `setupTests.ts` - Global test setup and mocks
- `.env.test` - Test environment variables
- `__tests__/test-utils.tsx` - Custom testing utilities

## Contributing

When adding new features:

1. **Write unit tests first** (TDD approach)
2. **Add fast integration tests for component interactions**
3. **Add medium integration tests for API-dependent features**
4. **Add slow integration tests only for critical user paths**
5. **Update E2E tests for user-facing features**
6. **Ensure all tests pass before PR submission**

### Test Coverage Guidelines

- **Unit tests**: Aim for 80%+ coverage of business logic
- **Integration tests**: Cover critical user workflows
- **E2E tests**: Cover main user journeys
- **BAML tests**: Cover all AI function variations

For questions or issues with testing, please refer to the team documentation or
reach out to the development team.
