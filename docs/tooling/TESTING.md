# Testing Guide for LexiSynth

This document provides a comprehensive guide to the testing ecosystem in LexiSynth. Our testing strategy is designed to ensure code quality, reliability, and maintainability across the entire application.

## Quick Start

### For New Developers
```bash
# Run fast unit tests (recommended for development)
bun run test

# Watch mode for active development
bun test:watch

# Run all tests (includes slow integration tests)
bun test:all
```

### For CI/CD
```bash
# Complete validation suite
bun ci
```

## Test Architecture Overview

Our testing ecosystem is organized into multiple layers, each serving a specific purpose:

```
📁 __tests__/
├── 📁 actions/                 # Server Action tests
├── 📁 components/              # React Component tests
├── 📁 integration/             # Real API integration tests (SLOW)
├── 📁 lib/                     # Utility and hook tests
└── 📁 utils/                   # Test helper utilities

📁 e2e/                         # End-to-end Playwright tests
📁 baml_src/                    # AI/LLM function tests
```

## Test Types & Commands

### 🚀 Unit Tests (Fast - Recommended for Development)
**What**: Tests individual components, hooks, and utilities in isolation
**Speed**: ~30-60 seconds
**Dependencies**: None (mocked)

```bash
# Run all unit tests
bun test:unit

# Watch mode for development
bun test:unit:watch

# With coverage report
bun test:coverage
```

**When to use**: 
- Daily development
- Before committing code
- Testing individual components/functions

### 🔗 Integration Tests (Slow - Requires API Keys)
**What**: Tests the complete research pipeline with real AI APIs (Google AI, Exa Search)
**Speed**: ~5-10 minutes per test
**Dependencies**: `GOOGLE_API_KEY`, `EXA_API_KEY`

```bash
# Run integration tests (requires API keys)
bun test:integration

# With debug output
bun test:integration:debug

# Watch mode (not recommended - very slow)
bun test:integration:watch
```

**When to use**:
- Before major releases
- When testing API integrations
- Manual testing of full pipeline

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
bun test:baml

# Safe mode (won't fail if API keys missing)
bun test:baml:safe
```

### 🌐 End-to-End Tests (Browser Automation)
**What**: Tests complete user workflows in a real browser
**Speed**: ~3-10 minutes
**Dependencies**: Browser automation setup

```bash
# Run E2E tests
bun test:e2e

# Interactive mode
bun test:e2e:ui

# Debug mode
bun test:e2e:debug
```

## Environment Setup

### Development Environment
```bash
# Copy environment template
cp .env.example .env.local

# Add your API keys (optional for unit tests)
GOOGLE_API_KEY=your-key-here
EXA_API_KEY=your-key-here
```

### CI/CD Environment
The CI system automatically:
- Runs unit tests always
- Skips integration tests unless API keys are provided
- Runs E2E tests in headless mode

## Test File Organization

### Naming Conventions
```
ComponentName.test.tsx          # React component tests
hookName.test.ts               # Custom hook tests
utilityName.test.ts            # Utility function tests
feature-integration.test.ts    # Integration tests
feature.e2e.test.ts           # End-to-end tests
```

### File Structure Example
```typescript
// Standard test file structure
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

## Key Testing Libraries

### Core Testing Stack
- **Vitest**: Fast unit test runner (Jest alternative)
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end browser testing
- **BAML**: AI function testing framework

### Testing Utilities
- **@testing-library/jest-dom**: DOM matchers
- **@testing-library/user-event**: User interaction simulation
- **Happy DOM**: Lightweight DOM implementation

## Common Testing Patterns

### React Component Testing
```typescript
import { renderWithProviders } from '../test-utils'

describe('MyComponent', () => {
  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MyComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })
})
```

### Custom Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '@/lib/hooks/useMyHook'

describe('useMyHook', () => {
  it('should update state correctly', () => {
    const { result } = renderHook(() => useMyHook())
    
    act(() => {
      result.current.updateValue('new value')
    })
    
    expect(result.current.value).toBe('new value')
  })
})
```

### Server Action Testing
```typescript
import { conductResearch } from '@/app/actions/researchAgentOrchestrator'

// Mock external dependencies
vi.mock('@/lib/utils/exaSearchUtil')
vi.mock('@/baml_client')

describe('conductResearch', () => {
  it('should handle legal questions correctly', async () => {
    const stream = await conductResearch('legal question')
    // Test stream processing...
  })
})
```

## Debugging Tests

### Common Issues & Solutions

**Tests timing out**:
```bash
# Increase timeout for specific tests
bun run test --timeout=60000
```

**Mock issues**:
```typescript
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
bun test:integration:debug
```

### Debug Mode
```bash
# Run tests with debug output
DEBUG_API_TESTS=true bun test:integration

# Use Vitest UI for interactive debugging
bun test:ui
```

## Performance Considerations

### Test Execution Times
| Test Type | Duration | Frequency |
|-----------|----------|-----------|
| Unit Tests | 30-60s | Every commit |
| Integration Tests | 5-10min | Before releases |
| E2E Tests | 3-10min | Nightly/releases |
| BAML Tests | 2-5min | AI changes |

### Optimization Tips
1. **Use unit tests for logic validation**
2. **Reserve integration tests for critical paths**
3. **Run integration tests in parallel when possible**
4. **Use test.concurrent for independent tests**

## Continuous Integration

### GitHub Actions Workflow
```yaml
# Automated test execution
- Unit tests: Always run
- Integration tests: Only with API keys
- E2E tests: On main branch
- Coverage reports: Generated automatically
```

### Pre-commit Hooks
```bash
# Automatically runs before commits
- Linting
- Type checking
- Unit tests
- Formatting
```

## Best Practices

### Writing Good Tests
1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests independent**
4. **Mock external dependencies**
5. **Test edge cases and error conditions**

### Test Organization
1. **Group related tests with describe blocks**
2. **Use setup/teardown appropriately**
3. **Keep test files close to source code**
4. **Use consistent naming conventions**

### Performance
1. **Prefer unit tests over integration tests**
2. **Use mocks to isolate units under test**
3. **Run expensive tests less frequently**
4. **Use test.concurrent for parallel execution**

## Troubleshooting

### Common Error Messages

**"axios is not defined"**
- Cause: Missing axios mock in integration tests
- Solution: Add `vi.unmock("axios")` to integration test files

**"API key not found"**
- Cause: Missing environment variables
- Solution: Check `.env.local` file and API key setup

**"Test timeout"**
- Cause: Integration tests taking too long
- Solution: Check network connectivity and API status

### Getting Help
1. Check test logs for specific error messages
2. Verify environment setup (API keys, dependencies)
3. Run tests in isolation to identify issues
4. Check if external APIs are accessible

## Contributing

When adding new features:
1. **Write unit tests first** (TDD approach)
2. **Add integration tests for API interactions**
3. **Update E2E tests for user-facing features**
4. **Ensure all tests pass before PR submission**

For questions or issues with testing, please refer to the team documentation or reach out to the development team.
