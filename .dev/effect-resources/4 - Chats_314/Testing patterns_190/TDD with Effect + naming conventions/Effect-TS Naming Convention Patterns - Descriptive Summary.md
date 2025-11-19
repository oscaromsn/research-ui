---
modified: 2025-10-26T20:24:39-03:00
---
## Effect-TS Naming Convention Patterns - Descriptive Summary

### Core Naming Philosophy
- **Plain names for interfaces** - The service tag or interface uses the simplest, most direct name (like `UserRepository`) without any suffix, establishing it as the canonical contract that all implementations must satisfy
- **Descriptive suffixes for implementations** - Every implementation adds a suffix that immediately tells you its purpose and characteristics, making it impossible to accidentally use the wrong implementation
- **Matching names between layers and implementations** - When a layer provides a service, it uses the exact same name as the implementation it provides, creating a direct mental mapping between what you import and what you get

### Implementation Suffix Patterns
- **Live suffix for production** - Any service ending in `Live` is the real, production-ready implementation that connects to actual databases, sends real emails, and performs actual side effects
- **Test suffix for test doubles** - Services ending in `Test` are simplified implementations that return predictable results, useful for unit testing without complex setup
- **InMemory suffix for stateful fakes** - These implementations maintain state in memory during test execution, perfect for testing complex workflows without database overhead
- **Technology-specific suffixes** - Implementations that use specific technologies include that technology in the name (like `PostgreSQL`, `DynamoDB`, `Redis`), making it immediately clear what infrastructure dependencies exist

### Schema and Validation Naming
- **Shape suffix for all schemas** - Any Effect Schema definition ends with `Shape`, creating a clear distinction between runtime types and validation schemas
- **Operation-prefixed shapes** - Input validation schemas start with the operation name (like `CreateUserShape`, `UpdateOrderShape`), making it obvious what operation they validate
- **Branded type shapes** - Shapes that create branded types include the brand name, creating a clear connection between the schema and the resulting type

### Error Naming Conventions
- **Error suffix universally** - Every error class ends with `Error`, making them instantly recognizable in type signatures and catch blocks
- **Domain-prefixed errors** - Errors start with the domain or entity they relate to, creating natural groupings when viewing error types
- **Operation-specific error names** - Errors that occur during specific operations include that operation in the name, making error handling more intuitive

### Layer Composition Patterns
- **Stack suffix for composed layers** - Complete application layer compositions end with `Stack`, indicating they provide multiple services together
- **Environment-specific prefixes** - Layer compositions start with their intended environment (like `DevelopmentStack`, `ProductionStack`, `TestStack`)
- **Behavior-describing test stacks** - Test layer compositions that simulate specific conditions include that behavior in the name (like `SlowNetworkTestStack`, `FailingPaymentTestStack`)

### Advanced Testing Patterns
- **Spy suffix for monitoring wrappers** - Services that wrap other services to monitor their usage end with `Spy`, indicating they track method calls while delegating to real implementations
- **Audited suffix for logging wrappers** - Services that add audit logging to existing services use the `Audited` suffix, making it clear they add observability without changing behavior
- **Scenario-specific test doubles** - Test implementations that simulate specific conditions use descriptive names (like `UserRepositoryEmpty`, `PaymentGatewayFlaky`) rather than generic test names

### Discoverability Benefits
- **Ripgrep-friendly patterns** - The consistent suffix system means you can find all implementations of a service with a simple pattern search, all test doubles with another pattern, and all production code with yet another
- **No ambiguity in imports** - When you see an import, the suffix immediately tells you whether you're looking at test code, production code, or a specific implementation variant
- **Self-documenting codebase** - New developers can understand what any service does just from its name, without needing to examine its implementation
- **Clear dependency boundaries** - The naming makes it obvious when test code is being used in production or when the wrong implementation is being imported

### File Organization Alignment
- **Implementation files match their export names** - A file exporting `UserRepositoryLive` is named `repository.live.ts`, creating a direct mapping between file system and code
- **Test files follow the same pattern** - Files containing test implementations use `.test.ts`, making it easy to exclude them from production builds
- **Schema files are clearly marked** - Files containing shapes use either `.shape.ts` suffix or live in a `shapes.ts` file, making validation logic easy to locate

### IDE and Tooling Integration
- **Search patterns become project knowledge** - Teams develop muscle memory for search patterns that instantly find what they need
- **Linting rules can enforce conventions** - The consistent patterns allow automated enforcement through ESLint rules
- **Build tools can leverage patterns** - Build scripts can automatically exclude test implementations or include only production layers based on naming

### Contract Testing Facilitation
- **Contract functions follow a pattern** - Contract test suites are named with the entity and `Contract` suffix, making them reusable across all implementations
- **Implementation tests import contracts** - Test files for implementations import and execute the contract tests, ensuring all implementations satisfy the same interface
- **Parallel implementation development** - Multiple teams can develop different implementations simultaneously, knowing they must all pass the same contract tests

This naming system transforms the codebase into a self-organizing, self-documenting system where finding code, understanding its purpose, and ensuring correct usage becomes mechanical rather than requiring deep knowledge of the project structure.
