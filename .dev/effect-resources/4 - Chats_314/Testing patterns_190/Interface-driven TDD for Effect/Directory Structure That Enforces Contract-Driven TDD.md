---
modified: 2025-10-20T17:50:25-03:00
---
# Directory Structure That Enforces Contract-Driven TDD

Here's a directory structure that **physically enforces** the development workflow and makes it **hard to do the wrong thing**.

## The Complete Structure

```
project-root/
├── src/
│   ├── domain/                          # Layer 0: Foundation (No Dependencies)
│   │   ├── primitives/                  # Branded types & basic building blocks
│   │   │   ├── UserId.ts
│   │   │   ├── UserId.test.ts          # Unit tests for brand predicates
│   │   │   ├── EmailAddress.ts
│   │   │   ├── EmailAddress.test.ts
│   │   │   ├── Money.ts
│   │   │   ├── Money.test.ts
│   │   │   └── index.ts                # Re-exports
│   │   │
│   │   ├── models/                      # Domain models (Schema.Class)
│   │   │   ├── User.ts
│   │   │   ├── User.test.ts            # Schema validation tests
│   │   │   ├── Order.ts
│   │   │   ├── Order.test.ts
│   │   │   ├── Product.ts
│   │   │   ├── Product.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── errors/                      # All domain errors
│   │   │   ├── UserErrors.ts           # UserNotFoundError, UserAlreadyExistsError
│   │   │   ├── OrderErrors.ts          # OrderErrors...
│   │   │   ├── PaymentErrors.ts
│   │   │   ├── ValidationErrors.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                     # Re-export everything
│   │
│   ├── services/                        # Layer 1: Service Contracts & Implementations
│   │   ├── UserRepository/              # One directory per service
│   │   │   ├── UserRepository.ts        # Interface (Effect.Service)
│   │   │   ├── UserRepository.fake.ts   # Rich fake implementation
│   │   │   ├── UserRepository.contract.test.ts  # Contract test suite
│   │   │   ├── UserRepository.impl.ts   # Production implementation
│   │   │   ├── UserRepository.integration.test.ts  # Production integration tests
│   │   │   └── index.ts                 # Export interface + layers
│   │   │
│   │   ├── EmailService/
│   │   │   ├── EmailService.ts
│   │   │   ├── EmailService.fake.ts
│   │   │   ├── EmailService.contract.test.ts
│   │   │   ├── EmailService.impl.ts
│   │   │   ├── EmailService.integration.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── PaymentService/
│   │   │   ├── PaymentService.ts
│   │   │   ├── PaymentService.fake.ts
│   │   │   ├── PaymentService.contract.test.ts
│   │   │   ├── PaymentService.impl.ts
│   │   │   ├── PaymentService.integration.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── UserService/                 # High-level service (composes repositories)
│   │   │   ├── UserService.ts
│   │   │   ├── UserService.test.ts      # Business logic tests (with fakes)
│   │   │   ├── UserService.integration.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── OrderService/
│   │   │   ├── OrderService.ts
│   │   │   ├── OrderService.test.ts
│   │   │   ├── OrderService.integration.test.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── workflows/                       # Layer 2: Cross-service workflows
│   │   ├── UserOnboarding.ts
│   │   ├── UserOnboarding.test.ts
│   │   ├── OrderFulfillment.ts
│   │   ├── OrderFulfillment.test.ts
│   │   └── index.ts
│   │
│   ├── api/                             # Layer 3: HTTP API (if applicable)
│   │   ├── routes/
│   │   │   ├── users.ts                 # User endpoints
│   │   │   ├── users.test.ts            # API contract tests
│   │   │   ├── orders.ts
│   │   │   ├── orders.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── auth.test.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── schema/                      # API-specific schemas
│   │   │   ├── requests.ts              # Request DTOs
│   │   │   ├── responses.ts             # Response DTOs
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── layers/                          # Layer composition (critical!)
│   │   ├── development.ts               # All fakes
│   │   ├── development.test.ts          # Test layer composition
│   │   ├── test.ts                      # Test layer for unit tests
│   │   ├── production.ts                # All production implementations
│   │   ├── production.test.ts           # Smoke test production layer
│   │   └── index.ts
│   │
│   ├── infrastructure/                  # Infrastructure adapters
│   │   ├── database/
│   │   │   ├── migrations/              # SQL migrations
│   │   │   │   ├── 001_create_users.sql
│   │   │   │   └── 002_create_orders.sql
│   │   │   ├── client.ts                # Database client setup
│   │   │   └── index.ts
│   │   │
│   │   ├── messaging/
│   │   │   ├── queue.ts
│   │   │   └── index.ts
│   │   │
│   │   └── cache/
│   │       ├── redis.ts
│   │       └── index.ts
│   │
│   ├── config/                          # Configuration
│   │   ├── schema.ts                    # Config schema
│   │   ├── development.ts               # Dev config
│   │   ├── production.ts                # Prod config
│   │   ├── test.ts                      # Test config
│   │   └── index.ts
│   │
│   └── main.ts                          # Application entry point
│
├── test/                                # Global test utilities & E2E tests
│   ├── helpers/                         # Shared test utilities
│   │   ├── factories.ts                 # Test data factories
│   │   ├── assertions.ts                # Custom assertions
│   │   ├── fixtures.ts                  # Test fixtures
│   │   └── index.ts
│   │
│   ├── e2e/                             # End-to-end tests
│   │   ├── user-journey.test.ts
│   │   ├── order-flow.test.ts
│   │   └── api-integration.test.ts
│   │
│   ├── load/                            # Load tests
│   │   ├── concurrent-users.test.ts
│   │   ├── order-processing.test.ts
│   │   └── index.ts
│   │
│   ├── chaos/                           # Chaos engineering tests
│   │   ├── service-failures.test.ts
│   │   ├── network-issues.test.ts
│   │   └── index.ts
│   │
│   └── contract/                        # Shared contract test utilities
│       ├── repository-suite.ts          # Generic repository contract tests
│       ├── service-suite.ts             # Generic service contract tests
│       └── index.ts
│
├── scripts/                             # Development & deployment scripts
│   ├── dev.ts                           # Start dev server with fakes
│   ├── test.ts                          # Run test suite
│   ├── verify.ts                        # Run all validations
│   ├── migrate.ts                       # Run migrations
│   └── seed.ts                          # Seed test data
│
├── docs/                                # Documentation
│   ├── architecture.md                  # Architecture decisions
│   ├── services/                        # Service documentation
│   │   ├── UserRepository.md
│   │   └── PaymentService.md
│   └── workflows/
│       └── UserOnboarding.md
│
├── .vscode/                             # Editor configuration
│   ├── settings.json
│   └── tasks.json                       # Tasks for running tests
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Key Design Decisions

### 1. Service Directory Structure (The Core Pattern)

```
services/UserRepository/
├── UserRepository.ts                    # Contract (interface)
├── UserRepository.fake.ts               # Reference implementation
├── UserRepository.contract.test.ts      # Contract validation
├── UserRepository.impl.ts               # Production implementation
├── UserRepository.integration.test.ts   # Production validation
└── index.ts                             # Public API
```

**Why this works:**
- **Co-location:** Everything about UserRepository in one place
- **Clear workflow:** Contract → Fake → Tests → Implementation
- **Easy navigation:** Find all related files instantly
- **Enforces separation:** Interface vs implementation is explicit

**index.ts pattern:**

```typescript
// services/UserRepository/index.ts
export { UserRepository } from "./UserRepository";
export { UserRepositoryFake, UserRepositoryFakeLayer } from "./UserRepository.fake";
export { UserRepositoryLive } from "./UserRepository.impl";
export { runUserRepositoryContractTests } from "./UserRepository.contract.test";
```

### 2. Domain as Foundation (No Dependencies)

```
domain/
├── primitives/     # Branded types (deepest level)
├── models/         # Domain models (depends on primitives)
└── errors/         # Domain errors (independent)
```

**Rules:**
- ✅ Domain can import from domain
- ❌ Domain CANNOT import from services, workflows, or api
- ✅ Everything else can import from domain

**Enforced by ESLint:**

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/services/**", "**/workflows/**", "**/api/**"],
            message: "Domain layer cannot import from upper layers"
          }
        ]
      }
    ]
  },
  overrides: [
    {
      files: ["src/domain/**/*.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["**/services/**", "**/workflows/**", "**/api/**"],
                message: "Domain cannot import from services, workflows, or api"
              }
            ]
          }
        ]
      }
    }
  ]
};
```

### 3. Layers Directory (Single Source of Truth)

```
layers/
├── development.ts     # Fakes only (fast, deterministic)
├── test.ts           # Test doubles for specific scenarios
├── production.ts     # Real implementations
└── *.test.ts         # Validate layer composition
```

**development.ts (The Default Development Environment):**

```typescript
// layers/development.ts
import { Layer } from "effect";
import { UserRepositoryFakeLayer } from "../services/UserRepository";
import { EmailServiceFakeLayer } from "../services/EmailService";
import { PaymentServiceFakeLayer } from "../services/PaymentService";
import { UserService } from "../services/UserService";
import { OrderService } from "../services/OrderService";

/**
 * Development layer: All fakes, instant startup, fully deterministic
 * Use this for local development and fast iteration
 */
export const DevelopmentLayer = Layer.mergeAll(
  // Low-level services (fakes)
  UserRepositoryFakeLayer,
  EmailServiceFakeLayer,
  PaymentServiceFakeLayer,
  
  // High-level services (real implementations)
  UserService.Default,
  OrderService.Default,
);
```

**test.ts (For Unit Tests):**

```typescript
// layers/test.ts
import { Layer } from "effect";
import { UserRepositoryFakeLayer } from "../services/UserRepository";
import { EmailServiceFakeLayer } from "../services/EmailService";
import { PaymentServiceFakeLayer } from "../services/PaymentService";
import { TestContext } from "effect";

/**
 * Test layer: Fakes + TestContext for deterministic testing
 */
export const TestLayer = Layer.mergeAll(
  UserRepositoryFakeLayer,
  EmailServiceFakeLayer,
  PaymentServiceFakeLayer,
).pipe(
  Layer.provide(TestContext.TestContext)
);
```

**production.ts (For Production):**

```typescript
// layers/production.ts
import { Layer } from "effect";
import { UserRepositoryLive } from "../services/UserRepository";
import { EmailServiceLive } from "../services/EmailService";
import { PaymentServiceLive } from "../services/PaymentService";
import { UserService } from "../services/UserService";
import { OrderService } from "../services/OrderService";
import { DatabaseLayer } from "../infrastructure/database";

/**
 * Production layer: Real implementations
 * CRITICAL: Provide this ONCE at the application entry point
 */
export const ProductionLayer = Layer.mergeAll(
  // Infrastructure
  DatabaseLayer,
  
  // Low-level services
  UserRepositoryLive,
  EmailServiceLive,
  PaymentServiceLive,
  
  // High-level services
  UserService.Default,
  OrderService.Default,
);
```

**layer.test.ts (Validate Composition):**

```typescript
// layers/development.test.ts
import { it, assert } from "@effect/vitest";
import { Effect } from "effect";
import { DevelopmentLayer } from "./development";
import { UserRepository, UserService, OrderService } from "../services";

describe("Development Layer Composition", () => {
  it.effect("should provide all required services", () =>
    Effect.gen(function* () {
      // If this compiles and runs, all dependencies are satisfied
      const repo = yield* UserRepository;
      const userService = yield* UserService;
      const orderService = yield* OrderService;

      assert.isDefined(repo);
      assert.isDefined(userService);
      assert.isDefined(orderService);
    }).pipe(Effect.provide(DevelopmentLayer))
  );
});
```

### 4. Main Entry Point (Environment Selection)

```typescript
// src/main.ts
import { Effect, Layer } from "effect";
import { DevelopmentLayer } from "./layers/development";
import { ProductionLayer } from "./layers/production";
import { startHttpServer } from "./api";

const getLayer = (): Layer.Layer<never> => {
  switch (process.env.NODE_ENV) {
    case "production":
      return ProductionLayer;
    case "test":
      throw new Error("Use test layer in tests, not main");
    default:
      return DevelopmentLayer; // Default to fakes for safety
  }
};

const program = Effect.gen(function* () {
  yield* Effect.log("Starting application");
  yield* startHttpServer();
});

// CRITICAL: Provide layer ONCE
const runnable = program.pipe(
  Effect.provide(getLayer()),
  Effect.tapErrorCause(Effect.logError),
);

Effect.runPromise(runnable);
```

### 5. Test Directory Structure

```
test/
├── helpers/           # Shared across all tests
├── e2e/              # Full application tests
├── load/             # Performance tests
├── chaos/            # Resilience tests
└── contract/         # Reusable contract test suites
```

**Reusable contract test patterns:**

```typescript
// test/contract/repository-suite.ts
import { Effect, Layer } from "effect";
import { it, assert } from "@effect/vitest";

/**
 * Generic repository contract test suite
 * Validates CRUD operations and error handling
 */
export const createRepositoryContractTests = 
  Entity,
  Id,
  Repository extends {
    findById: (id: Id) => Effect.Effect<Entity, any>;
    save: (entity: Entity) => Effect.Effect<void, any>;
    update: (entity: Entity) => Effect.Effect<void, any>;
    delete: (id: Id) => Effect.Effect<void, any>;
  }
>(config: {
  name: string;
  makeLayer: () => Layer.Layer<Repository>;
  tag: Context.Tag<Repository, Repository>;
  createEntity: (overrides?: Partial<Entity>) => Entity;
  getId: (entity: Entity) => Id;
}) => {
  describe(`${config.name} Repository Contract`, () => {
    it.effect("should save and retrieve entity", () =>
      Effect.gen(function* () {
        const repo = yield* config.tag;
        const entity = config.createEntity();

        yield* repo.save(entity);
        const retrieved = yield* repo.findById(config.getId(entity));

        assert.deepStrictEqual(retrieved, entity);
      }).pipe(Effect.provide(config.makeLayer()))
    );

    // ... more generic tests
  });
};
```

**Usage:**

```typescript
// services/UserRepository/UserRepository.contract.test.ts
import { createRepositoryContractTests } from "../../test/contract/repository-suite";

createRepositoryContractTests({
  name: "UserRepository",
  makeLayer: () => UserRepositoryFakeLayer,
  tag: UserRepository,
  createEntity: createTestUser,
  getId: (user) => user.id,
});

// Add UserRepository-specific tests
describe("UserRepository Specific Contracts", () => {
  it.effect("should enforce unique email constraint", () => {
    // ...
  });
});
```

### 6. Scripts Directory (Development Workflow)

```
scripts/
├── dev.ts           # Start with fakes
├── verify.ts        # Run all checks
└── migrate.ts       # Database migrations
```

**dev.ts (Start Development Server):**

```typescript
#!/usr/bin/env tsx
// scripts/dev.ts
import { Effect } from "effect";
import { DevelopmentLayer } from "../src/layers/development";
import { startHttpServer } from "../src/api";

const program = Effect.gen(function* () {
  yield* Effect.log("🚀 Starting development server with FAKES");
  yield* Effect.log("📦 All services are in-memory");
  yield* Effect.log("⚡️ Instant startup, deterministic behavior");
  
  yield* startHttpServer();
});

Effect.runPromise(program.pipe(Effect.provide(DevelopmentLayer)));
```

**verify.ts (Pre-commit Validation):**

```typescript
#!/usr/bin/env tsx
// scripts/verify.ts
import { Effect, pipe } from "effect";
import { execSync } from "child_process";

const runCommand = (name: string, command: string) =>
  Effect.try({
    try: () => {
      console.log(`\n▶️  ${name}...`);
      execSync(command, { stdio: "inherit" });
      console.log(`✅ ${name} passed`);
    },
    catch: (error) => new Error(`${name} failed: ${error}`),
  });

const verify = Effect.gen(function* () {
  yield* runCommand("Type check", "tsc --noEmit");
  yield* runCommand("Lint", "eslint src --max-warnings 0");
  yield* runCommand("Format check", "prettier --check src");
  yield* runCommand("Unit tests", "vitest run --testPathPattern=src");
  yield* runCommand("Contract tests", "vitest run --testPathPattern=contract");
  
  console.log("\n✨ All checks passed! Ready to commit.\n");
});

Effect.runPromise(verify).catch(() => process.exit(1));
```

**Add to package.json:**

```json
{
  "scripts": {
    "dev": "tsx scripts/dev.ts",
    "verify": "tsx scripts/verify.ts",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:contract": "vitest run --testPathPattern=contract",
    "test:integration": "vitest run --testPathPattern=integration",
    "test:e2e": "vitest run test/e2e",
    "typecheck": "tsc --noEmit",
    "check": "eslint src --max-warnings 0",
    "format": "prettier --write src"
  }
}
```

### 7. VSCode Tasks (Enforce Workflow)

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Verify (Pre-commit)",
      "type": "shell",
      "command": "bun run verify",
      "group": "test",
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Test: Current File",
      "type": "shell",
      "command": "vitest run ${relativeFile}",
      "group": "test"
    },
    {
      "label": "Test: Watch Current File",
      "type": "shell",
      "command": "vitest watch ${relativeFile}",
      "group": "test",
      "isBackground": true
    },
    {
      "label": "Dev Server (Fakes)",
      "type": "shell",
      "command": "bun run dev",
      "group": "build",
      "isBackground": true
    }
  ]
}
```

## File Naming Conventions

| File Type | Pattern | Example |
|-----------|---------|---------|
| Interface | `ServiceName.ts` | `UserRepository.ts` |
| Fake | `ServiceName.fake.ts` | `UserRepository.fake.ts` |
| Production | `ServiceName.impl.ts` | `UserRepository.impl.ts` |
| Contract Tests | `ServiceName.contract.test.ts` | `UserRepository.contract.test.ts` |
| Integration Tests | `ServiceName.integration.test.ts` | `UserRepository.integration.test.ts` |
| Unit Tests | `FileName.test.ts` | `User.test.ts` |
| Schema | `EntityName.ts` | `User.ts` (in domain/models) |
| Errors | `DomainErrors.ts` | `UserErrors.ts` |

## Import Patterns (Enforce Dependencies)

```typescript
// ✅ GOOD: Import from index (public API)
import { UserRepository, UserRepositoryFakeLayer } from "@/services/UserRepository";
import { User, UserId } from "@/domain/models";
import { UserNotFoundError } from "@/domain/errors";

// ❌ BAD: Import implementation details
import { UserRepository } from "@/services/UserRepository/UserRepository";

// ✅ GOOD: Use path aliases
import { DevelopmentLayer } from "@/layers/development";

// ❌ BAD: Relative imports across modules
import { DevelopmentLayer } from "../../layers/development";
```

**tsconfig.json paths:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@domain/*": ["src/domain/*"],
      "@services/*": ["src/services/*"],
      "@workflows/*": ["src/workflows/*"],
      "@layers/*": ["src/layers/*"],
      "@test/*": ["test/*"]
    }
  }
}
```

## Example: Adding a New Service

**Step 1: Create directory structure**

```bash
mkdir -p src/services/ProductRepository
touch src/services/ProductRepository/{ProductRepository,ProductRepository.fake,ProductRepository.contract.test,ProductRepository.impl,index}.ts
```

**Step 2: Define errors (if needed)**

```typescript
// domain/errors/ProductErrors.ts
export class ProductNotFoundError extends Data.TaggedError("ProductNotFoundError")<{
  productId: ProductId;
}> {}
```

**Step 3: Define contract**

```typescript
// services/ProductRepository/ProductRepository.ts
export class ProductRepository extends Effect.Service<ProductRepository>()(
  "app/ProductRepository",
  {
    effect: Effect.gen(function* () {
      return {
        findById: (id: ProductId): Effect.Effect<Product, ProductNotFoundError> =>
          Effect.die("Not implemented"),
        // ...
      };
    }),
  }
) {}
```

**Step 4: Build fake**

```typescript
// services/ProductRepository/ProductRepository.fake.ts
export class ProductRepositoryFake extends Effect.Service<ProductRepositoryFake>()("app/ProductRepositoryFake", {
  effect: Effect.gen(function* () {
    const products = yield* Ref.make<Map<ProductId, Product>>(new Map());
    // ... implementation
  }),
}) {}
```

**Step 5: Write contract tests**

```typescript
// services/ProductRepository/ProductRepository.contract.test.ts
export const runProductRepositoryContractTests = (/* ... */) => {
  // ... tests
};

runProductRepositoryContractTests("Fake", () => ProductRepositoryFakeLayer);
```

**Step 6: Export from index**

```typescript
// services/ProductRepository/index.ts
export { ProductRepository } from "./ProductRepository";
export { ProductRepositoryFake, ProductRepositoryFakeLayer } from "./ProductRepository.fake";
export { runProductRepositoryContractTests } from "./ProductRepository.contract.test";
```

**Step 7: Add to layers**

```typescript
// layers/development.ts
import { ProductRepositoryFakeLayer } from "../services/ProductRepository";

export const DevelopmentLayer = Layer.mergeAll(
  UserRepositoryFakeLayer,
  ProductRepositoryFakeLayer, // ← Add here
  // ...
);
```

**Step 8: Verify**

```bash
bun run verify  # Must pass before commit
```

## Benefits of This Structure

### 1. **Enforces Workflow**
- Can't forget to write tests (contract tests are co-located)
- Can't skip the fake (it's part of the service directory)
- Can't mix implementations (clear separation)

### 2. **Easy Navigation**

```
Need UserRepository fake? → services/UserRepository/UserRepository.fake.ts
Need to test it? → services/UserRepository/UserRepository.contract.test.ts
Need production impl? → services/UserRepository/UserRepository.impl.ts
```

### 3. **Prevents Common Mistakes**
- ❌ Can't import services from domain (enforced by ESLint)
- ❌ Can't forget to compose layers (layers/ directory is explicit)
- ❌ Can't provide layers multiple times (single main.ts entry point)
- ❌ Can't deploy without tests (verify script runs all checks)

### 4. **Scales Naturally**

```
services/
├── UserRepository/      # 5 files
├── EmailService/        # 5 files
├── PaymentService/      # 5 files
├── ProductRepository/   # 5 files
├── InventoryService/    # 5 files
└── ... (scales to 50+ services)
```

Each service is independent, testable, and composable.

### 5. **Clear Development Path**

```
New feature? 
→ domain/models/NewEntity.ts (define model)
→ domain/errors/NewErrors.ts (define errors)
→ services/NewService/ (create service directory)
→ Write contract → Build fake → Write tests → Implement
→ Add to layers/development.ts
→ Run bun run verify
→ Commit ✅
```

### 6. **Fast Feedback Loop**

```bash
# Start dev server (instant startup with fakes)
bun run dev

# Run tests in watch mode for current service
bun run test:watch src/services/UserRepository

# Verify everything before commit
bun run verify
```

This structure **physically enforces** the Contract-Driven TDD workflow and makes it nearly impossible to violate best practices. It's a "pit of success" architecture.
