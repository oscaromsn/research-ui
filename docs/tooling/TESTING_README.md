# Testing Setup for Next.js + BAML Project

This document provides an overview of the testing setup for our Next.js application with BAML integration.

## Testing Technology Stack

- **Vitest**: Fast and simple testing framework compatible with Next.js
- **Happy DOM**: Lightweight and fast DOM implementation for testing components
- **Testing Library**: For testing React components in a user-centric way
- **Vitest Coverage**: For generating test coverage reports

## Directory Structure

```
project_root/
├── __mocks__/               # Mock implementations of modules
│   ├── baml_client_types.ts # Mock types for BAML generated code
│   └── dotenv.ts            # Mock for dotenv to control environment variables
├── __tests__/               # Test files, mirroring the source directory structure
│   └── lib/
│       └── utils/
│           └── exaSearchUtil.test.ts
├── setupTests.ts            # Global test setup and configuration
└── vitest.config.ts         # Vitest configuration
```

## Running Tests

The following npm scripts are available for testing:

```bash
# Run tests once
bun run test

# Run tests in watch mode
bun test:watch

# Run tests with UI visualization
bun test:ui

# Run tests and generate coverage report
bun test:coverage
```

## Test Examples

### Utility Functions (e.g., exaSearchUtil.test.ts)

The test for `executeExaSearch` demonstrates:

1. Mocking external dependencies (axios)
2. Managing environment variables
3. Testing different scenarios (success case, error handling)
4. Verifying the correct transformation of data
5. Structure for testing HTTP requests

### Best Practices Demonstrated

1. **Arrange, Act, Assert** Pattern:
   ```typescript
   // Arrange (Setup)
   mockedAxios.post.mockResolvedValueOnce(mockExaResponse);
   
   // Act (Execute)
   const results = await executeExaSearch(mockSearchQuery);
   
   // Assert (Verify)
   expect(results).toHaveLength(2);
   expect(results[0].url).toBe('https://example.com/article1');
   ```

2. **Mock Reset Between Tests**:
   ```typescript
   afterEach(() => {
     vi.clearAllMocks();
   });
   ```

3. **Environment Control**:
   ```typescript
   const originalEnv = process.env;
   beforeEach(() => {
     vi.resetModules();
     process.env = { ...originalEnv };
     process.env.EXA_API_KEY = 'test-exa-api-key';
   });
   
   afterEach(() => {
     process.env = originalEnv;
   });
   ```

4. **Multiple Test Cases**: Testing various scenarios including:
   - Error handling
   - Parameter validation
   - Data transformation
   - Edge cases (missing data, etc.)

## Writing New Tests

When adding new tests:

1. Place them in the `__tests__` directory, mirroring your source directory structure
2. Name test files with the `.test.ts` or `.test.tsx` extension
3. Use the describe/it pattern for organizing tests
4. Mock external dependencies using Vitest's mocking capabilities
5. Test both success and error cases
6. Follow the Arrange-Act-Assert pattern

## Adding Component Tests

When testing React components:

1. Use `@testing-library/react` for rendering and interacting with components
2. Focus on testing behavior, not implementation details
3. Write tests from the user's perspective
4. Test accessibility where possible

## Test Coverage

Run `bun test:coverage` to generate a coverage report, which will help identify areas of code that need more testing.

---

This testing setup provides a solid foundation for maintaining code quality as the project grows, ensuring that new features and changes don't break existing functionality.
