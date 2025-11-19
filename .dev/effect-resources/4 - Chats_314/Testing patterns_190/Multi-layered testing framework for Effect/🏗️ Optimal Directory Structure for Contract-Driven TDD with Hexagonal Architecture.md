---
modified: 2025-10-27T20:23:25-03:00
---
# 🏗️ Optimal Directory Structure for Contract-Driven TDD with Hexagonal Architecture

## Core Philosophy

1. **Hexagonal Architecture** - Domain at center, application layer (ports), infrastructure layer (adapters)
2. **Test Co-Location** - Tests live next to the code they test
3. **Progressive Naming** - Underscore prefixes enforce correct implementation order
4. **Phase Visibility** - File naming makes the testing phase explicit

---

## Complete Directory Structure

```
project-root/
│
├── src/
│   ├── domain/                              # 🔵 CORE - Business logic, zero dependencies
│   │   ├── models/                          # Domain entities and value objects
│   │   │   ├── _User.ts                     # ⚠️ PHASE 1: Define first (Schema.Class)
│   │   │   ├── _User.test.ts               # Unit tests for User model
│   │   │   ├── _User.property.test.ts      # Property-based tests for User invariants
│   │   │   ├── _Order.ts
│   │   │   ├── _Order.test.ts
│   │   │   ├── _Order.property.test.ts
│   │   │   └── index.ts                     # Public API exports
│   │   │
│   │   ├── values/                          # Branded types and value objects
│   │   │   ├── _UserId.ts                   # Brand definition + predicate
│   │   │   ├── _UserId.test.ts              # Test brand validation
│   │   │   ├── _EmailAddress.ts
│   │   │   ├── _EmailAddress.test.ts
│   │   │   ├── _OrderId.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── errors/                          # Domain errors (Data.TaggedError)
│   │   │   ├── _UserErrors.ts               # ⚠️ DEFINE FIRST - all user-related errors
│   │   │   ├── _UserErrors.test.ts          # Test error construction
│   │   │   ├── _OrderErrors.ts
│   │   │   ├── _OrderErrors.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── rules/                           # Pure business rules (no Effect)
│   │   │   ├── pricing.ts                   # Pure functions for price calculations
│   │   │   ├── pricing.test.ts
│   │   │   ├── pricing.property.test.ts     # Laws: associativity, monotonicity
│   │   │   ├── validation.ts
│   │   │   ├── validation.test.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                         # Domain public API
│   │
│   ├── application/                         # 🟢 PORTS - Use cases and service interfaces
│   │   ├── ports/                           # Service interfaces (the "ports")
│   │   │   ├── repositories/                # Repository port definitions
│   │   │   │   ├── UserRepository.ts        # Interface + tag definition
│   │   │   │   ├── UserRepository.contract.test.ts  # ⭐ CONTRACT TESTS (reusable)
│   │   │   │   ├── UserRepository.fake.ts   # In-memory fake implementation
│   │   │   │   ├── UserRepository.fake.test.ts  # Test the fake itself
│   │   │   │   ├── OrderRepository.ts
│   │   │   │   ├── OrderRepository.contract.test.ts
│   │   │   │   ├── OrderRepository.fake.ts
│   │   │   │   ├── OrderRepository.fake.test.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── services/                    # External service port definitions
│   │   │   │   ├── EmailService.ts          # Interface + tag
│   │   │   │   ├── EmailService.contract.test.ts
│   │   │   │   ├── EmailService.fake.ts
│   │   │   │   ├── EmailService.fake.test.ts
│   │   │   │   ├── PaymentGateway.ts
│   │   │   │   ├── PaymentGateway.contract.test.ts
│   │   │   │   ├── PaymentGateway.fake.ts   # With failure injection
│   │   │   │   ├── PaymentGateway.fake.test.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   ├── use-cases/                       # Application services (orchestration)
│   │   │   ├── users/
│   │   │   │   ├── RegisterUser.ts          # Use case implementation
│   │   │   │   ├── RegisterUser.test.ts     # Test with fakes
│   │   │   │   ├── RegisterUser.integration.test.ts  # Test with real layers
│   │   │   │   ├── GetUserProfile.ts
│   │   │   │   ├── GetUserProfile.test.ts
│   │   │   │   ├── UpdateUserProfile.ts
│   │   │   │   ├── UpdateUserProfile.test.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── CreateOrder.ts
│   │   │   │   ├── CreateOrder.test.ts
│   │   │   │   ├── CreateOrder.integration.test.ts
│   │   │   │   ├── ProcessPayment.ts
│   │   │   │   ├── ProcessPayment.test.ts
│   │   │   │   ├── FulfillOrder.ts
│   │   │   │   ├── FulfillOrder.test.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   ├── workflows/                       # Complex multi-step workflows
│   │   │   ├── UserOnboarding.ts            # Saga/workflow orchestration
│   │   │   ├── UserOnboarding.test.ts       # Test with all fakes
│   │   │   ├── UserOnboarding.integration.test.ts
│   │   │   ├── OrderFulfillment.ts
│   │   │   ├── OrderFulfillment.test.ts
│   │   │   ├── OrderFulfillment.integration.test.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── infrastructure/                      # 🟡 ADAPTERS - External implementations
│   │   ├── persistence/                     # Database adapters
│   │   │   ├── postgres/
│   │   │   │   ├── UserRepositoryPostgres.ts      # Production implementation
│   │   │   │   ├── UserRepositoryPostgres.integration.test.ts  # ⭐ Runs contract tests
│   │   │   │   ├── OrderRepositoryPostgres.ts
│   │   │   │   ├── OrderRepositoryPostgres.integration.test.ts
│   │   │   │   ├── migrations/
│   │   │   │   │   ├── 001_create_users.sql
│   │   │   │   │   └── 002_create_orders.sql
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── redis/
│   │   │   │   ├── SessionStore.ts
│   │   │   │   ├── SessionStore.integration.test.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   ├── messaging/                       # Email, SMS, push notifications
│   │   │   ├── smtp/
│   │   │   │   ├── EmailServiceSmtp.ts      # SMTP implementation
│   │   │   │   ├── EmailServiceSmtp.integration.test.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── sendgrid/
│   │   │   │   ├── EmailServiceSendgrid.ts
│   │   │   │   ├── EmailServiceSendgrid.integration.test.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   ├── payment/                         # Payment gateway adapters
│   │   │   ├── stripe/
│   │   │   │   ├── PaymentGatewayStripe.ts
│   │   │   │   ├── PaymentGatewayStripe.integration.test.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   ├── http/                            # HTTP clients for external APIs
│   │   │   ├── clients/
│   │   │   │   ├── WeatherApiClient.ts
│   │   │   │   ├── WeatherApiClient.integration.test.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── interfaces/                          # 🔴 PRIMARY ADAPTERS - Entry points
│   │   ├── http/                            # HTTP API (REST/GraphQL)
│   │   │   ├── api/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── users/
│   │   │   │   │   │   ├── UsersApi.ts      # HttpApiGroup definition
│   │   │   │   │   │   ├── UsersApi.test.ts # Test with fakes
│   │   │   │   │   │   ├── UsersHandler.ts  # HttpApiBuilder implementation
│   │   │   │   │   │   ├── UsersHandler.test.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   ├── orders/
│   │   │   │   │   │   ├── OrdersApi.ts
│   │   │   │   │   │   ├── OrdersApi.test.ts
│   │   │   │   │   │   ├── OrdersHandler.ts
│   │   │   │   │   │   ├── OrdersHandler.test.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── middleware/                  # HTTP middleware
│   │   │   │   ├── auth.ts
│   │   │   │   ├── auth.test.ts
│   │   │   │   ├── logging.ts
│   │   │   │   ├── ratelimit.ts
│   │   │   │   ├── ratelimit.test.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── server.ts                    # HTTP server setup
│   │   │   └── index.ts
│   │   │
│   │   ├── cli/                             # CLI interface
│   │   │   ├── commands/
│   │   │   │   ├── users.ts                 # User management commands
│   │   │   │   ├── users.test.ts
│   │   │   │   ├── migrate.ts
│   │   │   │   ├── migrate.test.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── cli.ts                       # CLI app definition
│   │   │   └── index.ts
│   │   │
│   │   ├── graphql/                         # GraphQL API (if needed)
│   │   │   ├── schema/
│   │   │   ├── resolvers/
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── shared/                              # Shared utilities (use sparingly)
│   │   ├── config/                          # Configuration schemas
│   │   │   ├── AppConfig.ts
│   │   │   ├── AppConfig.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── observability/                   # Logging, tracing, metrics
│   │   │   ├── Logger.ts
│   │   │   ├── Logger.test.ts
│   │   │   ├── Tracer.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── layers/                              # 🎯 LAYER COMPOSITION (Critical!)
│   │   ├── development.ts                   # All fakes - instant startup
│   │   ├── development.test.ts              # Test layer composition
│   │   ├── test.ts                          # Fakes + TestContext
│   │   ├── test.test.ts
│   │   ├── production.ts                    # All production implementations
│   │   ├── production.test.ts               # Validate production layer
│   │   └── index.ts
│   │
│   └── main.ts                              # Application entry point
│
├── test/                                    # 🧪 GLOBAL TEST INFRASTRUCTURE
│   ├── helpers/                             # Shared test utilities
│   │   ├── fixtures/                        # Test data utilities
│   │   │   ├── builders.ts                  # Builder pattern for all entities
│   │   │   ├── builders.test.ts
│   │   │   ├── factories.ts                 # Factory pattern for complex graphs
│   │   │   ├── factories.test.ts
│   │   │   ├── arbitraries.ts               # Custom Arbitrary generators
│   │   │   ├── arbitraries.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── assertions/                      # Custom assertions
│   │   │   ├── effect.ts                    # Effect-specific assertions
│   │   │   ├── schema.ts                    # Schema assertions
│   │   │   ├── snapshot.ts                  # Snapshot testing helpers
│   │   │   └── index.ts
│   │   │
│   │   ├── shadows/                         # Shadow services (interaction testing)
│   │   │   ├── ShadowEmailService.ts
│   │   │   ├── ShadowEmailService.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── chaos/                           # Chaos engineering utilities
│   │   │   ├── ChaosConfig.ts
│   │   │   ├── makeChaosService.ts          # Chaos wrapper factory
│   │   │   ├── makeChaosService.test.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── contracts/                           # 📋 REUSABLE CONTRACT SUITES
│   │   ├── repository.suite.ts              # Generic repository contract tests
│   │   ├── service.suite.ts                 # Generic service contract tests
│   │   ├── cache.suite.ts                   # Generic cache contract tests
│   │   └── index.ts
│   │
│   ├── integration/                         # 🔗 CROSS-LAYER INTEGRATION TESTS
│   │   ├── user-registration.integration.test.ts
│   │   ├── order-fulfillment.integration.test.ts
│   │   ├── payment-processing.integration.test.ts
│   │   └── index.ts
│   │
│   ├── e2e/                                 # 🌍 END-TO-END TESTS
│   │   ├── api/
│   │   │   ├── users.e2e.test.ts            # Full API journey tests
│   │   │   ├── orders.e2e.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── cli/
│   │   │   ├── commands.e2e.test.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── chaos/                               # 🌪️ CHAOS ENGINEERING TESTS
│   │   ├── service-failures.chaos.test.ts
│   │   ├── network-issues.chaos.test.ts
│   │   ├── database-failures.chaos.test.ts
│   │   └── index.ts
│   │
│   ├── load/                                # 📊 LOAD/PERFORMANCE TESTS
│   │   ├── concurrent-users.load.test.ts
│   │   ├── order-processing.load.test.ts
│   │   ├── api-throughput.load.test.ts
│   │   └── index.ts
│   │
│   ├── property/                            # 🎲 GLOBAL PROPERTY-BASED TESTS
│   │   ├── invariants.property.test.ts      # Cross-domain invariants
│   │   ├── laws.property.test.ts            # Mathematical laws
│   │   └── index.ts
│   │
│   └── setup.ts                             # Global test setup
│
├── scripts/                                 # 🔧 DEVELOPMENT SCRIPTS
│   ├── dev.ts                               # Start dev server (with fakes)
│   ├── verify.ts                            # Pre-commit validation
│   ├── validate-phase.ts                    # Phase-specific validation
│   ├── migrate.ts                           # Database migrations
│   ├── seed.ts                              # Seed test data
│   └── benchmark.ts                         # Performance benchmarking
│
├── docs/                                    # 📚 DOCUMENTATION
│   ├── architecture/
│   │   ├── decisions/                       # ADRs (Architecture Decision Records)
│   │   │   ├── 001-hexagonal-architecture.md
│   │   │   ├── 002-contract-driven-tdd.md
│   │   │   └── 003-layer-composition.md
│   │   │
│   │   ├── diagrams/
│   │   │   ├── hexagonal-overview.mmd
│   │   │   └── layer-dependencies.mmd
│   │   │
│   │   └── README.md
│   │
│   ├── testing/
│   │   ├── testing-strategy.md              # Overall testing approach
│   │   ├── contract-testing.md
│   │   ├── property-based-testing.md
│   │   └── chaos-engineering.md
│   │
│   └── README.md
│
├── .vscode/                                 # 🛠️ EDITOR CONFIGURATION
│   ├── settings.json                        # TypeScript, formatting settings
│   ├── tasks.json                           # Quick tasks for testing phases
│   ├── launch.json                          # Debug configurations
│   └── extensions.json                      # Recommended extensions
│
├── .github/                                 # 🤖 CI/CD
│   ├── workflows/
│   │   ├── ci.yml                           # Main CI pipeline
│   │   ├── phase-validation.yml             # Phase-by-phase validation
│   │   └── deploy.yml
│   │
│   └── CODEOWNERS
│
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── vitest.config.ts
├── eslint.config.js
├── prettier.config.js
├── .gitignore
└── README.md
```

---

## 🎯 Key Design Decisions

### 1. Hexagonal Architecture Enforcement

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERFACES (Primary Adapters)            │
│                    (HTTP, CLI, GraphQL)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    APPLICATION (Ports & Use Cases)           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              DOMAIN (Core Business Logic)           │   │
│  │              (Models, Rules, Errors)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│             INFRASTRUCTURE (Secondary Adapters)              │
│          (Postgres, Redis, SMTP, Stripe, etc.)              │
└──────────────────────────────────────────────────────────────┘
```

**Dependency Rule:** Dependencies only point inward
- `interfaces/` depends on `application/`
- `application/` depends on `domain/`
- `infrastructure/` depends on `application/` (implements ports)
- `domain/` depends on **nothing** (pure business logic)

### 2. Test Co-Location Strategy

**Every implementation file has tests next to it:**

```
UserRepository.ts                     # Interface definition
UserRepository.contract.test.ts       # ⭐ Tests the contract (reusable)
UserRepository.fake.ts                # In-memory implementation
UserRepository.fake.test.ts           # Tests the fake itself
```

**Benefits:**
- ✅ Easy to find tests for any file
- ✅ Refactoring moves tests with code
- ✅ Clear what is tested vs untested (gap analysis)
- ✅ Enforces test-first thinking

### 3. Progressive Naming (Underscore Prefix)

**Force correct implementation order:**

```
_UserErrors.ts        # ⚠️ Step 1: Define errors FIRST
_User.ts              # ⚠️ Step 2: Define models SECOND
UserRepository.ts     # Step 3: Define interface THIRD
```

**Why:**
- Editor sorts underscore files first
- Visual reminder of implementation order
- Prevents implementing before defining contracts

### 4. Test Naming Convention

| Test Type | Pattern | Purpose |
|-----------|---------|---------|
| Unit | `.test.ts` | Test pure functions, models, rules |
| Contract | `.contract.test.ts` | Test interface contracts (reusable) |
| Integration | `.integration.test.ts` | Test production implementations |
| Property | `.property.test.ts` | Test invariants with fast-check |
| E2E | `.e2e.test.ts` | Test full application stack |
| Chaos | `.chaos.test.ts` | Test resilience under failures |
| Load | `.load.test.ts` | Test performance under load |

### 5. Layer Composition (Single Source of Truth)

**Three layer configurations:**

```typescript
// layers/development.ts - All fakes
export const DevelopmentLayer = Layer.mergeAll(
  UserRepositoryFake.Default,
  OrderRepositoryFake.Default,
  EmailServiceFake.Default,
  PaymentGatewayFake.Default
);

// layers/test.ts - Fakes + TestContext
export const TestLayer = Layer.mergeAll(
  UserRepositoryFake.Default,
  OrderRepositoryFake.Default,
  EmailServiceFake.Default,
  PaymentGatewayFake.Default
).pipe(Layer.provide(TestContext.TestContext));

// layers/production.ts - Real implementations
export const ProductionLayer = Layer.mergeAll(
  UserRepositoryPostgres.Default,
  OrderRepositoryPostgres.Default,
  EmailServiceSmtp.Default,
  PaymentGatewayStripe.Default,
  DatabaseClient.layer,
  Config.layer
);
```

---

## 📋 File Organization Patterns

### Pattern 1: Repository Port (Application Layer)

```
application/ports/repositories/UserRepository/
├── UserRepository.ts                    # Interface + Context.Tag
├── UserRepository.contract.test.ts      # Reusable contract tests
├── UserRepository.fake.ts               # In-memory implementation
├── UserRepository.fake.test.ts          # Test the fake
└── index.ts                             # Public exports
```

**UserRepository.ts:**

```typescript
// application/ports/repositories/UserRepository.ts
import { Effect, Context } from "effect";
import { User, UserId } from "@/domain/models";
import { UserNotFoundError, DuplicateUserError } from "@/domain/errors";

export class UserRepository extends Context.Tag("UserRepository")
  UserRepository,
  {
    readonly save: (user: User) => Effect.Effect<void, DuplicateUserError>;
    readonly findById: (id: UserId) => Effect.Effect<User, UserNotFoundError>;
    readonly list: (limit: number, offset: number) => Effect.Effect<Array<User>>;
    readonly count: () => Effect.Effect<number>;
  }
>() {}
```

**UserRepository.contract.test.ts:**

```typescript
// application/ports/repositories/UserRepository.contract.test.ts
import { describe, it } from "@effect/vitest";
import { Effect, Layer, Exit } from "effect";
import { assert } from "@effect/vitest";
import { UserRepository } from "./UserRepository";

export const runUserRepositoryContractTests = (
  name: string,
  makeLayer: () => Layer.Layer<UserRepository>
) => {
  describe(`UserRepository Contract - ${name}`, () => {
    describe("save", () => {
      it.effect("should save and retrieve user", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();
          
          yield* repo.save(user);
          const retrieved = yield* repo.findById(user.id);
          
          assert.deepStrictEqual(retrieved, user);
        }).pipe(Effect.provide(makeLayer()))
      );

      it.effect("should fail with DuplicateUserError on duplicate save", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();
          
          yield* repo.save(user);
          const exit = yield* Effect.exit(repo.save(user));
          
          assert.isTrue(Exit.isFailure(exit));
          // ... verify error type
        }).pipe(Effect.provide(makeLayer()))
      );
    });

    describe("concurrency", () => {
      it.effect("should handle concurrent writes", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const users = Array.from({ length: 100 }, (_, i) =>
            createTestUser({ id: UserId.make(`user-${i}`) })
          );
          
          yield* Effect.all(
            users.map((u) => repo.save(u)),
            { concurrency: "unbounded" }
          );
          
          const count = yield* repo.count();
          assert.strictEqual(count, 100);
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.provide(TestContext.TestContext)
        )
      );
    });
  });
};

// Run against fake immediately
import { UserRepositoryFake } from "./UserRepository.fake";
runUserRepositoryContractTests("Fake", () => UserRepositoryFake.Default);
```

**UserRepository.fake.ts:**

```typescript
// application/ports/repositories/UserRepository.fake.ts
import { Effect, Layer, Ref } from "effect";
import { UserRepository } from "./UserRepository";

// Export inspection interface
export class UserRepositoryFake extends Effect.Service<UserRepositoryFake>()(
  "UserRepositoryFake",
  {
    effect: Effect.gen(function* () {
      const store = yield* Ref.make(new Map<UserId, User>());
      const events = yield* Ref.make<Array<RepositoryEvent>>([]);
      
      const implementation = {
        // Production API
        save: (user: User) => /* ... */,
        findById: (id: UserId) => /* ... */,
        list: (limit: number, offset: number) => /* ... */,
        count: () => /* ... */,
        
        // 🔍 Inspection API
        clear: () => /* ... */,
        exportState: () => /* ... */,
        getEvents: () => /* ... */,
        getUserCount: () => /* ... */
      };
      
      return implementation;
    })
  }
) {}

// Provide as UserRepository
export const UserRepositoryFakeLayer = Layer.effect(
  UserRepository,
  UserRepositoryFake
);
```

### Pattern 2: Infrastructure Adapter (Infrastructure Layer)

```
infrastructure/persistence/postgres/
├── UserRepositoryPostgres.ts
├── UserRepositoryPostgres.integration.test.ts   # Runs contract tests!
└── index.ts
```

**UserRepositoryPostgres.integration.test.ts:**

```typescript
// infrastructure/persistence/postgres/UserRepositoryPostgres.integration.test.ts
import { runUserRepositoryContractTests } from "@/application/ports/repositories/UserRepository.contract.test";
import { UserRepositoryPostgres } from "./UserRepositoryPostgres";
import { TestDatabaseLayer } from "@test/helpers";

// ⭐ Reuse exact same contract tests
runUserRepositoryContractTests(
  "Postgres",
  () => UserRepositoryPostgres.Default.pipe(
    Layer.provide(TestDatabaseLayer)
  )
);

// Add implementation-specific tests if needed
describe("UserRepositoryPostgres - Implementation Details", () => {
  it.effect("should use correct SQL query", () => {
    // Test SQL generation, connection pooling, etc.
  });
});
```

### Pattern 3: Use Case (Application Layer)

```
application/use-cases/users/
├── RegisterUser.ts                      # Use case implementation
├── RegisterUser.test.ts                 # Test with fakes
├── RegisterUser.integration.test.ts     # Test with real layers
└── index.ts
```

**RegisterUser.test.ts:**

```typescript
// application/use-cases/users/RegisterUser.test.ts
import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { assert } from "@effect/vitest";
import { RegisterUser } from "./RegisterUser";
import { TestLayer } from "@/layers/test";

describe("RegisterUser", () => {
  it.effect("should register user and send welcome email", () =>
    Effect.gen(function* () {
      const registerUser = yield* RegisterUser;
      const emailFake = yield* EmailServiceFake;
      
      const user = yield* registerUser({
        email: "test@example.com",
        name: "Test User",
        age: 25
      });
      
      assert.isDefined(user.id);
      
      // Verify email was sent
      const wasSent = yield* emailFake.wasEmailSentTo(user.email);
      assert.isTrue(wasSent);
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should fail with ValidationError for invalid email", () =>
    Effect.gen(function* () {
      const registerUser = yield* RegisterUser;
      
      const exit = yield* Effect.exit(
        registerUser({
          email: "invalid",
          name: "Test",
          age: 25
        })
      );
      
      assert.isTrue(Exit.isFailure(exit));
    }).pipe(Effect.provide(TestLayer))
  );
});
```

---

## 🔧 Development Scripts

### scripts/validate-phase.ts

```typescript
#!/usr/bin/env tsx
// scripts/validate-phase.ts
import { Effect, Console } from "effect";
import { execSync } from "child_process";

type Phase = "design" | "contract" | "red" | "green" | "refactor" | "integrate" | "harden";

const validatePhase = (phase: Phase) =>
  Effect.gen(function* () {
    yield* Console.log(`🔵 Validating ${phase.toUpperCase()} Phase...\n`);

    switch (phase) {
      case "design":
        yield* Console.log("1. Checking error definitions exist...");
        // Check _errors.ts files exist
        yield* Console.log("2. Checking model definitions exist...");
        // Check _models.ts files exist
        yield* Console.log("3. Validating schemas...");
        execSync("vitest run --testPathPattern='domain/.*\\.test\\.ts$'", {
          stdio: "inherit"
        });
        break;

      case "contract":
        yield* Console.log("1. Checking interface definitions...");
        yield* Console.log("2. Checking fake implementations...");
        yield* Console.log("3. Running contract tests...");
        execSync("vitest run --testPathPattern='\\.contract\\.test\\.ts$'", {
          stdio: "inherit"
        });
        break;

      case "red":
        yield* Console.log("1. Verifying tests exist...");
        yield* Console.log("2. Verifying tests FAIL...");
        // Run tests and expect failures
        break;

      case "green":
        yield* Console.log("1. Running contract tests with fake...");
        execSync("vitest run --testPathPattern='\\.contract\\.test\\.ts$'", {
          stdio: "inherit"
        });
        yield* Console.log("2. Running contract tests with production...");
        execSync("vitest run --testPathPattern='\\.integration\\.test\\.ts$'", {
          stdio: "inherit"
        });
        break;

      case "refactor":
        yield* Console.log("1. Running all tests...");
        execSync("vitest run", { stdio: "inherit" });
        yield* Console.log("2. Type checking...");
        execSync("tsc --noEmit", { stdio: "inherit" });
        yield* Console.log("3. Linting...");
        execSync("eslint src --max-warnings 0", { stdio: "inherit" });
        break;

      case "integrate":
        yield* Console.log("1. Running integration tests...");
        execSync("vitest run test/integration", { stdio: "inherit" });
        yield* Console.log("2. Validating layer composition...");
        execSync("vitest run --testPathPattern='layers/.*\\.test\\.ts$'", {
          stdio: "inherit"
        });
        break;

      case "harden":
        yield* Console.log("1. Running chaos tests...");
        execSync("vitest run test/chaos", { stdio: "inherit" });
        yield* Console.log("2. Running load tests...");
        execSync("vitest run test/load", { stdio: "inherit" });
        yield* Console.log("3. Running E2E tests...");
        execSync("vitest run test/e2e", { stdio: "inherit" });
        break;
    }

    yield* Console.log(`\n✅ ${phase.toUpperCase()} Phase Complete!\n`);
  });

const phase = process.argv[2] as Phase;
Effect.runPromise(validatePhase(phase));
```

### package.json Scripts

```json
{
  "scripts": {
    "// Development": "",
    "dev": "tsx scripts/dev.ts",
    "dev:debug": "NODE_OPTIONS='--inspect' tsx scripts/dev.ts",

    "// Testing": "",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:unit": "vitest run --testPathPattern='\\.(test)\\.ts$'",
    "test:contract": "vitest run --testPathPattern='\\.contract\\.test\\.ts$'",
    "test:integration": "vitest run --testPathPattern='\\.integration\\.test\\.ts$'",
    "test:property": "vitest run --testPathPattern='\\.property\\.test\\.ts$'",
    "test:e2e": "vitest run test/e2e",
    "test:chaos": "vitest run test/chaos",
    "test:load": "vitest run test/load",
    "test:coverage": "vitest run --coverage",

    "// Phase Validation": "",
    "validate:design": "tsx scripts/validate-phase.ts design",
    "validate:contract": "tsx scripts/validate-phase.ts contract",
    "validate:red": "tsx scripts/validate-phase.ts red",
    "validate:green": "tsx scripts/validate-phase.ts green",
    "validate:refactor": "tsx scripts/validate-phase.ts refactor",
    "validate:integrate": "tsx scripts/validate-phase.ts integrate",
    "validate:harden": "tsx scripts/validate-phase.ts harden",

    "// Quality Gates": "",
    "verify": "tsx scripts/verify.ts",
    "typecheck": "tsc --noEmit",
    "check": "eslint src --max-warnings 0",
    "format": "prettier --write src",
    "format:check": "prettier --check src",

    "// Build & Deploy": "",
    "build": "tsc --project tsconfig.build.json",
    "start": "node dist/main.js",
    "migrate": "tsx scripts/migrate.ts",
    "seed": "tsx scripts/seed.ts"
  }
}
```

---

## 🎯 VSCode Tasks for Quick Testing

### .vscode/tasks.json

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "⭐ Validate Current Phase",
      "type": "shell",
      "command": "tsx scripts/validate-phase.ts ${input:phase}",
      "group": "test",
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "🧪 Test: Current File",
      "type": "shell",
      "command": "vitest run ${relativeFile}",
      "group": "test",
      "presentation": {
        "reveal": "always"
      }
    },
    {
      "label": "👁️ Test: Watch Current File",
      "type": "shell",
      "command": "vitest watch ${relativeFile}",
      "group": "test",
      "isBackground": true
    },
    {
      "label": "📋 Test: All Contract Tests",
      "type": "shell",
      "command": "vitest run --testPathPattern='\\.contract\\.test\\.ts$'",
      "group": "test"
    },
    {
      "label": "🔗 Test: All Integration Tests",
      "type": "shell",
      "command": "vitest run --testPathPattern='\\.integration\\.test\\.ts$'",
      "group": "test"
    },
    {
      "label": "✅ Verify (Pre-commit)",
      "type": "shell",
      "command": "tsx scripts/verify.ts",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    }
  ],
  "inputs": [
    {
      "id": "phase",
      "type": "pickString",
      "description": "Select phase to validate",
      "options": [
        "design",
        "contract",
        "red",
        "green",
        "refactor",
        "integrate",
        "harden"
      ],
      "default": "contract"
    }
  ]
}
```

---

## 📚 Benefits of This Structure

### 1. **Enforces Hexagonal Architecture**
- Clear separation: domain → application → infrastructure → interfaces
- Dependency rule enforced by imports
- Easy to replace adapters (swap Postgres for MongoDB)

### 2. **Makes Testing Phases Explicit**
- File naming shows phase: `.contract.test.ts`, `.integration.test.ts`
- Scripts for each phase: `validate:design`, `validate:contract`, etc.
- Visual cues: underscore prefixes force correct order

### 3. **Maximizes Test Co-Location**
- Tests next to code they test
- Easy gap analysis (untested code obvious)
- Refactoring moves tests with code

### 4. **Promotes Reusability**
- Contract tests reused for all implementations
- Shared test infrastructure in `test/helpers/`
- Generic test suites in `test/contracts/`

### 5. **Scalable to Large Teams**
- Clear ownership boundaries (CODEOWNERS)
- Parallel development (independent ports)
- No merge conflicts (co-located tests)

### 6. **Developer Experience**
- Fast feedback: `test:watch` on current file
- Quick phase validation: VSCode tasks
- Instant startup: `dev` script with all fakes

### 7. **CI/CD Friendly**
- Progressive validation (fail fast)
- Cacheable test layers
- Parallel test execution

---

## 🚀 Typical Development Workflow

```bash
# 1. Start new feature - Design phase
mkdir -p src/domain/models
touch src/domain/errors/_OrderErrors.ts
touch src/domain/models/_Order.ts

# Validate design
bun run validate:design

# 2. Define port (interface) - Contract phase
mkdir -p src/application/ports/repositories
touch src/application/ports/repositories/OrderRepository.ts
touch src/application/ports/repositories/OrderRepository.contract.test.ts
touch src/application/ports/repositories/OrderRepository.fake.ts

# Start watch mode for contract tests
bun run test:watch --testPathPattern="OrderRepository.contract"

# 3. Write failing tests - Red phase
# (edit OrderRepository.contract.test.ts)
bun run validate:red

# 4. Implement fake - Green phase
# (edit OrderRepository.fake.ts)
bun run validate:green

# 5. Implement production adapter
mkdir -p src/infrastructure/persistence/postgres
touch src/infrastructure/persistence/postgres/OrderRepositoryPostgres.ts
touch src/infrastructure/persistence/postgres/OrderRepositoryPostgres.integration.test.ts

# Run integration tests
bun run test:integration

# 6. Before commit
bun run verify

# 7. Commit
git add .
git commit -m "feat: Add OrderRepository with full test coverage"
```

---

## 🎯 Summary

This directory structure systematically enforces:

1. **Hexagonal Architecture** through clear layer separation
2. **Contract-Driven TDD** through progressive file naming and test co-location
3. **7-Phase Testing Pipeline** through explicit phase validation scripts
4. **Rich Testing Infrastructure** through shared helpers and reusable contracts
5. **Developer Productivity** through VSCode integration and fast feedback loops

**The key insight:** Structure shapes behavior. By making the right thing easy and the wrong thing hard, this structure guides developers into producing high-quality, well-tested Effect applications naturally.
