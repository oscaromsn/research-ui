# API Key Testing Guide

This guide explains how to handle tests that require external API keys (like
OpenAI, Google AI, Exa Search, etc.) in the JurisConsulta project.

## Overview

Tests in this project are designed to gracefully handle missing API keys by:

- **Skipping tests** when required API keys are not available
- **Providing clear warnings** about why tests are being skipped
- **Differentiating between CI and local environments**
- **Maintaining test coverage** for non-API-dependent code

## Test Categories

### 1. Unit Tests (Always Run)

- Mock all external API calls
- Test business logic and component behavior
- No API keys required
- High coverage expectations

### 2. Integration Tests with Mocks

- Test component integration
- Mock BAML client and search APIs
- No API keys required
- Verify data flow and error handling

### 3. Integration Tests with Real APIs

- Require actual API keys
- Test against real external services
- Skipped in CI unless keys are provided
- Useful for development and manual testing

### 4. E2E Tests

- May require API keys for full functionality
- Conditionally skip based on key availability
- Focus on user workflows

## Available Test Utilities

### Basic API Key Checking

```typescript
import { hasRequiredApiKeys, skipIfMissingApiKeys } from '@/__tests__/test-utils';

// Check if keys are available
const hasKeys = hasRequiredApiKeys(['GOOGLE_API_KEY', 'EXA_API_KEY']);

// Skip test if keys are missing
if (!skipIfMissingApiKeys(['GOOGLE_API_KEY'], 'My Test')) {
  return; // Test will be skipped
}
```

### Advanced Test Helpers

```typescript
import { 
  itWithApiKeys, 
  describeWithApiKeys, 
  itBamlFunction,
  API_KEYS 
} from '@/__tests__/utils/api-test-helpers';

// Conditional test execution
itWithApiKeys('should work with real API', API_KEYS.GOOGLE_AI, async () => {
  // Test only runs if GOOGLE_API_KEY is available
});

// Conditional test suite
describeWithApiKeys('Real API Tests', API_KEYS.GOOGLE_AI, () => {
  // All tests in this suite require Google AI API key
});

// BAML function testing (skips in CI by default)
itBamlFunction('GenerateLegalSearchQueries', API_KEYS.GOOGLE_AI, async () => {
  // Test BAML function with real API
});
```

## Configuration Constants

### Available API Key Groups

```typescript
const API_KEYS = {
  GOOGLE_AI: ["GOOGLE_API_KEY"],
  OPENAI: ["OPENAI_API_KEY"],
  ANTHROPIC: ["ANTHROPIC_API_KEY"],
  XAI: ["XAI_API_KEY"],
  GROQ: ["GROQ_API_KEY"],
  EXA_SEARCH: ["EXA_API_KEY"],
  TAVILY_SEARCH: ["TAVILY_API_KEY"],
  LINKUP_SEARCH: ["LINKUP_API_KEY"],
  ALL_LLM: ["GOOGLE_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
  ALL_SEARCH: ["EXA_API_KEY", "TAVILY_API_KEY", "LINKUP_API_KEY"],
};
```

## Running Tests

### Standard Test Execution

```bash
# Run all tests (skips API-dependent tests if keys missing)
bun run test

# Run tests with API key debugging
bun run test:api

# Run only non-API tests (forces API keys to be unavailable)
bun run test:no-api

# Run tests with coverage
bun run test:coverage
```

### BAML Tests

```bash
# Run BAML tests (requires API keys)
bun run baml:test

# Run BAML tests safely (doesn't fail on missing keys)
bun run baml:test:safe
```

### Environment-Specific Testing

```bash
# Local development (may include API tests)
NODE_ENV=development bun run test

# CI simulation (skips most API tests)
CI=true bun run test

# Debug API test behavior
DEBUG_API_TESTS=true bun run test
```

## Best Practices

### 1. Structure Tests Appropriately

```typescript
// ✅ Good: Mock by default, real API as separate test
describe('Document Analysis', () => {
  it('should handle mock document analysis', () => {
    // Uses mocked BAML client
  });
});

describeWithApiKeys('Document Analysis - Real API', API_KEYS.GOOGLE_AI, () => {
  it('should analyze real documents', async () => {
    // Uses real BAML client
  });
});
```

```typescript
// ❌ Bad: Mixed real and mock tests in same suite
describe('Document Analysis', () => {
  it('should handle mock analysis', () => {
    // Mock test
  });
  
  it('should analyze real documents', async () => {
    // Real API test - may fail if keys missing
  });
});
```

### 2. Use Appropriate Timeouts

```typescript
// BAML function tests
itBamlFunction('GenerateQueries', API_KEYS.GOOGLE_AI, testFn, {
  timeout: 30000 // 30 seconds
});

// E2E tests with APIs
itE2eWithApi('Full research workflow', API_KEYS.ALL_LLM, testFn, {
  timeout: 120000 // 2 minutes
});
```

### 3. Provide Clear Test Names

```typescript
// ✅ Good: Clear about API dependency
itWithApiKeys(
  'should generate legal queries using Google AI',
  API_KEYS.GOOGLE_AI,
  testFn
);

// ❌ Bad: Unclear about requirements
it('should generate queries', testFn);
```

### 4. Handle Errors Gracefully

```typescript
itWithApiKeys('should handle API errors', API_KEYS.GOOGLE_AI, async () => {
  try {
    await someApiCall();
  } catch (error) {
    // Verify error is handled appropriately
    expect(error).toBeInstanceOf(Error);
  }
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: bun install
      - name: Run unit tests (no API)
        run: bun run test:no-api

  test-with-api:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: bun install
      - name: Run tests with API keys
        env:
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
          EXA_API_KEY: ${{ secrets.EXA_API_KEY }}
        run: bun run test
```

### Environment Variables in CI

Set these as repository secrets for API-dependent tests:

- `GOOGLE_API_KEY` - For Google AI/Gemini API tests
- `OPENAI_API_KEY` - For OpenAI API tests
- `EXA_API_KEY` - For Exa Search API tests
- `TAVILY_API_KEY` - For Tavily Search API tests

## Debugging

### Check API Key Status

```typescript
import { logApiKeyStatus } from '@/__tests__/utils/api-test-helpers';

// In test setup
beforeAll(() => {
  if (process.env.DEBUG_API_TESTS === 'true') {
    logApiKeyStatus();
  }
});
```

### Common Issues

1. **Test always skipped**: Check that API key is properly set in `.env.test`
2. **Test fails in CI**: Ensure API key is set as repository secret
3. **Test times out**: Increase timeout for real API calls
4. **Coverage drops**: Use `test:no-api` for coverage measurement

### Debug Commands

```bash
# Check which tests would be skipped
DEBUG_API_TESTS=true bun run test --dry-run

# See API key status
DEBUG_API_TESTS=true bun run test | grep "API Key Status"

# Run specific test with debugging
DEBUG_API_TESTS=true bun run test -- --run orchestrator-with-api
```

## File Organization

```
__tests__/
├── utils/
│   └── api-test-helpers.ts          # API testing utilities
├── examples/
│   └── api-dependent-test.example.ts # Example usage
├── integration/
│   ├── orchestrator-basic.test.ts    # Mock-based integration
│   └── orchestrator-with-api.test.ts # Real API integration
└── test-utils.tsx                    # General test utilities
```

## Migration Guide

### Updating Existing Tests

1. **Identify API-dependent tests**: Look for tests that import from
   `@/baml_client` or make external API calls

2. **Separate concerns**: Create separate test suites for mocked and real API
   tests

3. **Add conditional execution**: Use `itWithApiKeys` or `describeWithApiKeys`
   for real API tests

4. **Update timeouts**: Increase timeouts for real API calls

### Example Migration

```typescript
// Before: Mixed test that may fail
describe('Research Pipeline', () => {
  it('should generate queries', async () => {
    const { b } = await import('@/baml_client');
    const result = await b.GenerateQueries('test question');
    expect(result).toBeDefined();
  });
});

// After: Separated concerns
describe('Research Pipeline (Mocked)', () => {
  beforeEach(() => {
    vi.mock('@/baml_client', () => import('@/__mocks__/baml_client'));
  });
  
  it('should generate queries with mock client', async () => {
    const { b } = await import('@/baml_client');
    const result = await b.GenerateQueries('test question');
    expect(result).toBeDefined();
  });
});

describeWithApiKeys('Research Pipeline (Real API)', API_KEYS.GOOGLE_AI, () => {
  itBamlFunction('GenerateQueries', API_KEYS.GOOGLE_AI, async () => {
    const { b } = await import('@/baml_client');
    const result = await b.GenerateQueries('test question');
    expect(result).toBeDefined();
    expect(result.search_queries.length).toBeGreaterThan(0);
  });
});
```

## Conclusion

This testing approach ensures that:

- **All developers** can run the test suite regardless of API key availability
- **CI/CD pipelines** remain stable and fast
- **API functionality** can still be tested when keys are available
- **Test coverage** remains high for business logic
- **Development workflow** is not disrupted by missing external dependencies

For questions or issues with API key testing, refer to the test utilities
documentation or create an issue in the repository.
