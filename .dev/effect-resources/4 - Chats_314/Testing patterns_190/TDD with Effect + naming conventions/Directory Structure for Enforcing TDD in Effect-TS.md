---
modified: 2025-09-18T03:38:33-03:00
---
## Directory Structure for Enforcing TDD in Effect-TS

### Core Structure: Domain-Driven Layers

```
src/
├── _shared/                    # Shared kernel (minimal, stable)
│   ├── errors/
│   │   └── base.ts            # Base error classes only
│   ├── types/
│   │   └── branded.ts         # Common branded types
│   └── utils/
│       └── test-contract.ts   # Contract test utilities
│
├── domains/                    # Business domains (vertical slices)
│   ├── users/
│   │   ├── _errors.ts         # Domain errors (ALWAYS first)
│   │   ├── _models.ts         # Domain models & schemas
│   │   ├── repository.ts      # Interface & contract tests
│   │   ├── repository.impl.ts # Implementations
│   │   ├── repository.test.ts # Contract test execution
│   │   ├── service.ts         # Business logic interface
│   │   ├── service.impl.ts    # Business logic implementation
│   │   ├── service.test.ts    # Service tests
│   │   └── index.ts           # Public API (exports only interfaces)
│   │
│   └── orders/
│       └── ... (same structure)
│
├── infrastructure/             # Technical capabilities
│   ├── database/
│   │   ├── client.ts          # Interface
│   │   ├── client.impl.ts     # Implementation
│   │   └── client.test.ts     # Tests
│   ├── http/
│   └── messaging/
│
├── applications/               # Application compositions
│   ├── api/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── server.ts
│   └── workers/
│       └── order-processor.ts
│
└── tests/                      # Cross-cutting test concerns
    ├── fixtures/               # Shared test data
    ├── layers/                 # Reusable test layers
    └── integration/            # Multi-domain tests
```

### Key Principles

#### 1. **Underscore Convention for Order**

Files prefixed with `_` must be created first:

```typescript
// domains/users/_errors.ts (MUST exist before other files)
export class UserNotFoundError extends Data.TaggedError('UserNotFoundError')<{
  readonly userId: UserId
}> {}

// domains/users/_models.ts (MUST exist before services)
export const User = S.Struct({
  id: UserId,
  email: Email,
  name: NonEmptyString
})
```

This enforces error-first and schema-first design.

#### 2. **Interface and Implementation Separation**

```typescript
// domains/users/repository.ts (Interface ONLY)
export interface UserRepositoryInterface {
  findById: (id: UserId) => Effect.Effect<User, UserNotFoundError>
}

export class UserRepository extends Context.Tag('UserRepository')
  UserRepository,
  UserRepositoryInterface
>() {}

// Contract tests in the SAME file
export const userRepositoryContract = (
  makeLayer: () => Layer.Layer<UserRepository>
) => {
  describe('UserRepository Contract', () => {
    test('findById returns error for non-existent', async () => {
      // Contract test implementation
    })
  })
}

// domains/users/repository.impl.ts (Implementations)
export const UserRepositoryInMemory = Layer.effect(
  UserRepository,
  // Implementation
)

export const UserRepositoryPostgres = Layer.effect(
  UserRepository,
  // Implementation
)

// domains/users/repository.test.ts (Execute contracts)
import { userRepositoryContract } from './repository'
import { UserRepositoryInMemory, UserRepositoryPostgres } from './repository.impl'

userRepositoryContract(UserRepositoryInMemory)
userRepositoryContract(UserRepositoryPostgres)
```

#### 3. **Index Files as Public API Guards**

```typescript
// domains/users/index.ts
// ONLY export interfaces and types, never implementations
export type { User, UserId } from './_models'
export { UserNotFoundError, DuplicateUserError } from './_errors'
export { UserRepository, type UserRepositoryInterface } from './repository'
export { UserService, type UserServiceInterface } from './service'

// Implementations are explicitly NOT exported here
// They must be imported from specific paths when needed
```

### Enforcing Practices Through Structure

#### 1. **Test-First Development Flow**

The file creation order naturally enforces TDD:

```bash
# Step 1: Create error (forced by underscore)
touch src/domains/feature/_errors.ts

# Step 2: Create model (forced by underscore)
touch src/domains/feature/_models.ts

# Step 3: Create interface with contract tests
touch src/domains/feature/service.ts

# Step 4: Create failing tests
touch src/domains/feature/service.test.ts

# Step 5: Create implementation
touch src/domains/feature/service.impl.ts
```

#### 2. **Preventing Implementation Leakage**

```typescript
// applications/api/routes/users.ts
import { UserService } from '@/domains/users'  // ✅ Interface only
import { UserServiceLive } from '@/domains/users/service.impl'  // ✅ Explicit implementation import

// This forces conscious decisions about implementations
```

#### 3. **Layer Composition Points**

```typescript
// applications/api/layers.ts
import { UserRepositoryPostgres } from '@/domains/users/repository.impl'
import { OrderRepositoryPostgres } from '@/domains/orders/repository.impl'
import { UserServiceLive } from '@/domains/users/service.impl'
import { OrderServiceLive } from '@/domains/orders/service.impl'

// Single place for production layer composition
export const ProductionLayers = Layer.mergeAll(
  UserRepositoryPostgres,
  OrderRepositoryPostgres,
  UserServiceLive,
  OrderServiceLive
)

// Test layers in test directory
// tests/layers/test-app.ts
export const TestLayers = Layer.mergeAll(
  UserRepositoryInMemory,
  OrderRepositoryInMemory,
  UserServiceLive,
  OrderServiceLive
)
```

### Advanced Patterns

#### 1. **Feature Modules for Complex Domains**

```
domains/
└── orders/
    ├── _errors.ts
    ├── _models.ts
    ├── features/           # Sub-features within domain
    │   ├── pricing/
    │   │   ├── calculator.ts
    │   │   ├── calculator.impl.ts
    │   │   └── calculator.test.ts
    │   └── fulfillment/
    │       ├── scheduler.ts
    │       ├── scheduler.impl.ts
    │       └── scheduler.test.ts
    ├── repository.ts
    └── service.ts          # Orchestrates features
```

#### 2. **Shared Test Infrastructure**

```typescript
// tests/layers/database.ts
export const createTestDatabase = () => Layer.effect(
  DatabaseClient,
  Effect.gen(function* () {
    const container = yield* TestContainer.start('postgres:15')
    yield* Effect.addFinalizer(() => TestContainer.stop(container))
    return DatabaseClient.of({ connectionString: container.url })
  })
)

// tests/fixtures/builders.ts
export class UserBuilder {
  build(): User { /* ... */ }
  withEmail(email: string): this { /* ... */ }
  withSubscription(): User { /* ... */ }
}

// Usage in any test
import { UserBuilder } from '@test/fixtures/builders'
import { createTestDatabase } from '@test/layers/database'
```

#### 3. **Integration Test Organization**

```
tests/
└── integration/
    ├── workflows/          # Multi-domain workflows
    │   ├── order-fulfillment.test.ts
    │   └── user-onboarding.test.ts
    ├── contracts/          # Cross-domain contracts
    │   └── user-order-integration.test.ts
    └── performance/        # Performance tests
        └── concurrent-orders.test.ts
```

### Configuration Files

#### 1. **TypeScript Path Aliases**

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@domains/*": ["./src/domains/*"],
      "@infra/*": ["./src/infrastructure/*"],
      "@app/*": ["./src/applications/*"],
      "@test/*": ["./src/tests/*"]
    }
  }
}
```

#### 2. **ESLint Rules for Enforcement**

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['*/service.impl', '*/repository.impl'],
          message: 'Import implementations explicitly only where needed'
        }
      ]
    }],
    'import/order': ['error', {
      'groups': [
        ['builtin', 'external'],
        ['internal'],
        ['parent', 'sibling', 'index']
      ],
      'alphabetize': { order: 'asc' }
    }]
  }
}
```

#### 3. **Pre-commit Hooks**

```bash
#!/bin/sh
# .husky/pre-commit

# Ensure error files exist for new domains
for dir in src/domains/*/; do
  if [ ! -f "$dir/_errors.ts" ]; then
    echo "Error: $dir must have _errors.ts"
    exit 1
  fi
done

# Ensure tests exist for implementations
for impl in src/domains/**/*.impl.ts; do
  test_file="${impl%.impl.ts}.test.ts"
  if [ ! -f "$test_file" ]; then
    echo "Error: $impl must have corresponding test file"
    exit 1
  fi
done
```

### Developer Onboarding Checklist

Create a `DEVELOPMENT.md` at the root:

```markdown
# Development Guide

## Creating a New Feature

1. **Define Errors First** (`_errors.ts`)
   - What can go wrong?
   - Create tagged errors for each failure mode

2. **Define Models** (`_models.ts`)
   - What data structures do we need?
   - Use Effect Schema for validation

3. **Create Interface** (`service.ts`)
   - What operations do we need?
   - Include contract tests in same file

4. **Write Tests** (`service.test.ts`)
   - Import contract tests
   - Add specific test cases

5. **Implement** (`service.impl.ts`)
   - Create implementations
   - Tests should pass

## Quick Commands

```bash
# Create new domain
./scripts/new-domain.sh users

# Run tests for domain
npm test -- domains/users

# Type-check domain
npx tsc --noEmit src/domains/users/**/*.ts
```

```

### Benefits of This Structure

1. **Self-Documenting**: File naming and organization tells the story
2. **Error-Resistant**: Hard to do the wrong thing (e.g., skip tests)
3. **Discoverable**: New developers can navigate intuitively
4. **Scalable**: Grows linearly with features, not exponentially
5. **Testable**: Test files are co-located and obvious
6. **Composable**: Clear composition points for layers
7. **Refactorable**: Interfaces protect against implementation changes

### Common Patterns Quick Reference

```typescript
// Pattern 1: New Domain Setup
domains/newfeature/
├── _errors.ts         # 1st: Define what can fail
├── _models.ts         # 2nd: Define data structures
├── repository.ts      # 3rd: Define storage interface
├── service.ts         # 4th: Define business logic interface
└── index.ts          # 5th: Export public API

// Pattern 2: Test Organization
*.ts                  # Interface + contract tests
*.impl.ts             # Implementation(s)
*.test.ts             # Execute contracts against implementations

// Pattern 3: Layer Composition
applications/         # Only place where implementations are composed
tests/layers/         # Test-specific layer compositions
```

This structure naturally guides developers toward correct practices while maintaining flexibility for real-world development speed. The key is that the structure itself teaches and enforces patterns rather than relying solely on documentation or review processes.
