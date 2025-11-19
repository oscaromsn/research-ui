---
modified: 2025-10-27T20:20:06-03:00
---
## 🎯 The Multi-Layered Testing Pyramid for Effect

Effect applications use a **4-tier inverted testing pyramid** that prioritizes fast, deterministic tests at the base:

```
         ╱─────────────╲
        ╱   E2E Tests   ╲      (5%)  - Full system, hours to write
       ╱─────────────────╲     
      ╱ Integration Tests ╲     (15%) - Service composition, 30min
     ╱───────────────────────╲  
    ╱  Implementation Tests  ╲  (25%) - Production layers, 15min
   ╱─────────────────────────────╲
  ╱   Contract Tests (FOUNDATION) ╲ (55%) - Interfaces w/ fakes, 5min
 ╱───────────────────────────────────╲
```

---

## 📝 Layer 1: Contract Tests (The Foundation - 55%)

**What:** Test the *interface contract*, not the implementation
**When to write:** FIRST - Before any production code exists
**When to run:** Every file save (watch mode), every commit (pre-commit hook)

### Purpose
- Define expected behavior as executable specifications
- Test ALL success paths and ALL error types in the error channel
- Validate business invariants and edge cases
- Serve as living documentation

### Key Characteristics
- ⚡ **Extremely fast** (milliseconds per test) - all in-memory
- 🔄 **Reusable** - Same tests run against fake AND production
- 🎯 **Deterministic** - No flaky tests, ever
- 📦 **Isolated** - Each test is independent

### Implementation Pattern

```typescript
// services/UserRepository/UserRepository.contract.test.ts
import { describe, it } from "@effect/vitest";
import { Effect, Exit, Cause, Option, TestContext } from "effect";
import { assert } from "@effect/vitest";

// Generic contract suite - accepts ANY layer
export const runUserRepositoryContractTests = (
  name: string,
  makeLayer: () => Layer.Layer<UserRepository>
) => {
  describe(`UserRepository Contract - ${name}`, () => {
    
    // ✅ Happy Path Tests
    describe("save and findById", () => {
      it.effect("should save and retrieve user", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();
          
          yield* repo.save(user);
          const retrieved = yield* repo.findById(user.id);
          
          assert.deepStrictEqual(retrieved, user);
        }).pipe(Effect.provide(makeLayer()))
      );
    });

    // ✅ Error Path Tests - ALWAYS use Effect.exit
    describe("error handling", () => {
      it.effect("should fail with UserNotFoundError", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const exit = yield* Effect.exit(
            repo.findById(UserId.make("nonexistent"))
          );
          
          assert.isTrue(Exit.isFailure(exit));
          if (Exit.isFailure(exit)) {
            const error = Cause.failureOption(exit.cause);
            assert.isTrue(Option.isSome(error));
            assert.instanceOf(Option.getOrThrow(error), UserNotFoundError);
          }
        }).pipe(Effect.provide(makeLayer()))
      );

      it.effect("should fail with DuplicateUserError on duplicate save", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();
          
          yield* repo.save(user);
          const exit = yield* Effect.exit(repo.save(user));
          
          assert.isTrue(Exit.isFailure(exit));
        }).pipe(Effect.provide(makeLayer()))
      );
    });

    // ✅ Concurrency Tests
    describe("concurrency safety", () => {
      it.effect("should handle concurrent writes correctly", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const users = Array.from({ length: 100 }, (_, i) =>
            createTestUser({ id: UserId.make(`user-${i}`) })
          );
          
          // Unbounded concurrency - stress test
          yield* Effect.all(
            users.map((u) => repo.save(u)),
            { concurrency: "unbounded" }
          );
          
          const count = yield* repo.count();
          assert.strictEqual(count, 100);
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.provide(TestContext.TestContext) // For deterministic concurrency
        )
      );
    });

    // ✅ Edge Cases
    describe("edge cases", () => {
      it.effect("should handle empty list", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const users = yield* repo.list({ limit: 10, offset: 0 });
          assert.strictEqual(users.length, 0);
        }).pipe(Effect.provide(makeLayer()))
      );
    });
  });
};

// Run against fake implementation
runUserRepositoryContractTests("Fake", () => UserRepositoryFakeLayer);
```

### Validation Command

```bash
# Run in watch mode during development
vitest watch --testPathPattern=contract

# Validation gate
bun run validate:contract  # Must pass before RED phase
```

---

## 🔴 Layer 2: Implementation Tests (Production Layer - 25%)

**What:** Test that YOUR production implementation satisfies the contract
**When to write:** During GREEN phase (after contract tests fail)
**When to run:** Before commit, in CI/CD

### Purpose
- Verify production code matches the contract
- **Reuse exact same contract tests** from Layer 1
- Mock only immediate dependencies (not the service under test)

### Implementation Pattern

```typescript
// services/UserRepository/UserRepository.integration.test.ts
import { runUserRepositoryContractTests } from "./UserRepository.contract.test";
import { UserRepositoryLive } from "./UserRepository.impl";
import { DatabaseClient } from "@/infrastructure/database";

// ✅ Reuse ALL contract tests, but with production layer
runUserRepositoryContractTests("Production", () => {
  // Mock only direct dependencies
  const mockDbLayer = Layer.succeed(DatabaseClient, {
    query: () => Effect.succeed([]),
    execute: () => Effect.succeed({ rowsAffected: 1 }),
  });
  
  return UserRepositoryLive.pipe(
    Layer.provide(mockDbLayer)
  );
});

// ✅ Add implementation-specific tests if needed
describe("UserRepositoryPostgres - Implementation Details", () => {
  it.effect("should use correct SQL query", () =>
    Effect.gen(function* () {
      const queries: string[] = [];
      const spyDbLayer = Layer.succeed(DatabaseClient, {
        query: (sql) => Effect.sync(() => {
          queries.push(sql);
          return [];
        }),
        execute: () => Effect.succeed({ rowsAffected: 1 }),
      });
      
      const repo = yield* UserRepository;
      yield* repo.findById(UserId.make("123"));
      
      assert.isTrue(queries[0].includes("SELECT * FROM users WHERE id = $1"));
    }).pipe(Effect.provide(UserRepositoryLive), Effect.provide(spyDbLayer))
  );
});
```

### Validation Command

```bash
# Run implementation tests
vitest run --testPathPattern=integration

# Validation gate
bun run validate:green  # Must pass before REFACTOR phase
```

---

## 🔗 Layer 3: Integration Tests (Service Composition - 15%)

**What:** Test multiple real services working together
**When to write:** After individual services are validated
**When to run:** Before commit, in CI (longer running)

### Purpose
- Verify layer composition (`Layer.provide`, `Layer.merge`)
- Test cross-service workflows
- Use real implementations with in-memory fakes for boundaries

### Implementation Pattern

```typescript
// layers/test.integration.test.ts
describe("Layer Composition", () => {
  const TestLayer = Layer.mergeAll(
    UserRepositoryFakeLayer,
    EmailServiceFakeLayer
  ).pipe(
    Layer.provide(UserService.Default),
    Layer.provide(OrderService.Default)
  );

  it.effect("should register user and send welcome email", () =>
    Effect.gen(function* () {
      const userService = yield* UserService;
      const emailFake = yield* EmailServiceFake;
      
      const user = yield* userService.register({
        email: "test@example.com",
        name: "Test User"
      });
      
      // Verify email was sent using fake's inspection API
      const wasSent = yield* emailFake.wasEmailSentTo(user.email);
      assert.isTrue(wasSent);
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should maintain service isolation", () =>
    Effect.gen(function* () {
      const userFake = yield* UserRepositoryFake;
      
      yield* userFake.clear(); // Each test isolated
      const count = yield* userFake.count();
      assert.strictEqual(count, 0);
    }).pipe(Effect.provide(TestLayer))
  );
});
```

---

## 🌍 Layer 4: E2E Tests (Full Stack - 5%)

**What:** Test entire application from HTTP/CLI to database
**When to write:** For critical user journeys only
**When to run:** Before deploy (slowest, most expensive)

### Implementation Pattern

```typescript
// e2e/api.test.ts
describe("API End-to-End", () => {
  const E2ELayer = Layer.mergeAll(
    HttpServer.layer,
    PostgresDatabase.layer, // Real test DB
    AllServiceLayers
  );

  it.effect("should create and retrieve user via API", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      
      const response = yield* HttpClientRequest.post("/users").pipe(
        HttpClientRequest.jsonBody({ email: "test@example.com" }),
        client.execute,
        Effect.flatMap((res) => res.json),
        Effect.scoped
      );
      
      const userId = response.id;
      
      const user = yield* HttpClientRequest.get(`/users/${userId}`).pipe(
        client.execute,
        Effect.flatMap((res) => res.json),
        Effect.scoped
      );
      
      assert.strictEqual(user.email, "test@example.com");
    }).pipe(Effect.provide(E2ELayer))
  );
});
```

---

## 🎭 Test Doubles: The Idiomatic Effect Approach

### Fakes > Mocks (The Golden Rule)

**Never use `vi.mock` or method-level mocking libraries.** Instead, create **fully-functional in-memory `Layer` implementations**.

```typescript
// services/UserRepository/UserRepository.fake.ts
export class UserRepositoryFake extends Effect.Service<UserRepositoryFake>()(
  "app/UserRepositoryFake",
  {
    effect: Effect.gen(function* () {
      const store = yield* Ref.make(new Map<UserId, User>());
      
      return {
        // Production API
        save: (user: User) =>
          Ref.update(store, (map) => {
            if (map.has(user.id)) {
              return Effect.fail(new DuplicateUserError({ id: user.id }));
            }
            map.set(user.id, user);
            return Effect.void;
          }),
        
        findById: (id: UserId) =>
          Ref.get(store).pipe(
            Effect.flatMap((map) =>
              map.has(id)
                ? Effect.succeed(map.get(id)!)
                : Effect.fail(new UserNotFoundError({ id }))
            )
          ),
        
        // 🔍 Inspection APIs for testing
        clear: () => Ref.set(store, new Map()),
        count: () => Ref.get(store).pipe(Effect.map((map) => map.size)),
        exportState: () => Ref.get(store)
      };
    }),
  }
) {}

export const UserRepositoryFakeLayer = Layer.effect(
  UserRepository,
  UserRepositoryFake
);
```

### Benefits of Fakes
- ✅ **Behaviorally equivalent** to production
- ✅ **Reusable** across all test layers
- ✅ **Fast** (in-memory, no I/O)
- ✅ **Deterministic** (no race conditions)
- ✅ **Inspectable** (custom APIs for assertions)

---

## 👥 Shadow Service Pattern (Interaction Testing)

When you need to verify "was this method called?" (traditional mocking), use the **Shadow Service Pattern**.

```typescript
// test/helpers/ShadowEmailService.ts
class ShadowEmailService extends Effect.Service<ShadowEmailService>()(
  "test/ShadowEmailService",
  {
    effect: Effect.gen(function* () {
      const sent = yield* Ref.make<Email[]>([]);
      
      const shared = {
        // Production API
        send: (email: Email) =>
          Ref.update(sent, (emails) => [...emails, email]),
        
        // Test-only API
        wasEmailSentTo: (address: EmailAddress) =>
          Ref.get(sent).pipe(
            Effect.map((emails) =>
              emails.some((e) => e.recipient === address)
            )
          ),
        
        getSentEmails: () => Ref.get(sent),
        clear: () => Ref.set(sent, [])
      };
      
      return shared;
    }),
  }
) {}

// Layer provides BOTH tags with same instance
export const ShadowEmailServiceLayer = Layer.unwrapEffect(
  Effect.gen(function* () {
    const shadow = yield* ShadowEmailService;
    return Layer.mergeAll(
      Layer.succeed(EmailService, shadow), // Production uses this
      Layer.succeed(ShadowEmailService, shadow) // Tests use this
    );
  })
);
```

**Usage in tests:**

```typescript
it.effect("should send email to new users", () =>
  Effect.gen(function* () {
    const userService = yield* UserService;
    const shadow = yield* ShadowEmailService;
    
    const user = yield* userService.register({ email: "test@example.com" });
    
    // Assert via shadow API
    const wasSent = yield* shadow.wasEmailSentTo(user.email);
    assert.isTrue(wasSent);
  }).pipe(Effect.provide(TestLayerWithShadow))
);
```

---

## 🎲 Property-Based Testing with fast-check

For testing invariants across random inputs:

```typescript
import { Arbitrary } from "effect";
import { fc } from "@effect/vitest";

describe("User validation invariants", () => {
  it.effect("email should always be lowercase after normalization", () =>
    Effect.gen(function* () {
      const arb = Arbitrary.make(UserSchema);
      
      yield* fc.assert(
        fc.asyncProperty(fc.effect(arb), (user) =>
          Effect.gen(function* () {
            const normalized = yield* normalizeUser(user);
            assert.strictEqual(
              normalized.email,
              normalized.email.toLowerCase()
            );
          })
        )
      );
    })
  );
});
```

---

## ⏰ When to Run Tests (Validation Gates)

### 1. **Continuous (Watch Mode)** - During Development

```bash
# Terminal 1: Watch contract tests
vitest watch --testPathPattern=contract

# Terminal 2: Watch implementation tests
vitest watch --testPathPattern=integration
```

### 2. **Pre-Commit Hook** - Before Every Commit

```bash
# .husky/pre-commit
#!/usr/bin/env sh
bun run verify
```

```typescript
// scripts/verify.ts
const verify = Effect.gen(function* () {
  yield* runCommand("Type check", "tsc --noEmit");
  yield* runCommand("Lint", "eslint src --max-warnings 0");
  yield* runCommand("Contract tests", "vitest run --testPathPattern=contract");
  yield* runCommand("Implementation tests", "vitest run --testPathPattern=integration");
  
  console.log("\n✅ All checks passed! Ready to commit.\n");
});
```

### 3. **CI/CD Pipeline** - On Push

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    steps:
      - run: bun install
      - run: bun run typecheck
      - run: bun run test:unit      # Fast tests
      - run: bun run test:integration  # Slower
      - run: bun run test:e2e       # Slowest (only on main)
```

### 4. **Pre-Deploy** - Before Production

```bash
bun run validate:harden  # Includes chaos, load, and E2E tests
```

---

## 📋 Mandatory Validation Checklist

**After EVERY file edit:**
- [ ] Run `bun run lint:file <file.ts>` immediately
- [ ] Run `bun run typecheck`

**Before EVERY commit:**
- [ ] All contract tests pass
- [ ] All implementation tests pass
- [ ] No type errors (`tsc --noEmit`)
- [ ] No lint warnings (`eslint --max-warnings 0`)
- [ ] Code formatted (`prettier --check`)

**Before EVERY merge to main:**
- [ ] Integration tests pass
- [ ] Test coverage maintained (>80%)
- [ ] No `Effect.runSync` in production code
- [ ] All error types defined in error channel

**Before EVERY deploy:**
- [ ] E2E tests pass
- [ ] Load/chaos tests pass (if applicable)
- [ ] Performance benchmarks met

---

## 🚀 Complete Development Workflow

### Daily Development Loop (10-minute cycles)

```bash
# 1. Start watch mode
vitest watch --testPathPattern=contract

# 2. Define errors → interface → FAILING tests
# 3. Implement minimal production code
# 4. Watch tests turn green
# 5. Refactor with confidence

# 6. Before commit
bun run verify

# 7. Commit
git add .
git commit -m "feat: Add UserRepository with full test coverage"
```

### The 7-Phase Diamond Pipeline

1. **DESIGN** → Define errors, models, interface
2. **CONTRACT** → Write failing contract tests (RED)
3. **RED** → Verify tests fail (`bun run validate:red`)
4. **GREEN** → Implement until tests pass (`bun run validate:green`)
5. **REFACTOR** → Optimize with test safety net
6. **INTEGRATE** → Test layer composition
7. **HARDEN** → Chaos, load, E2E tests

---

## 🎯 Summary: Testing Decision Tree

```
Is it a pure function/schema?
  └─> Unit test (no Effect needed)

Does it have dependencies?
  └─> Contract test with fake layer

Is it production code?
  └─> Run contract tests against production layer

Does it involve multiple services?
  └─> Integration test with composed layers

Is it a critical user journey?
  └─> E2E test (sparingly!)

Need to verify "was X called"?
  └─> Shadow service pattern (NOT vi.mock)

Testing invariants across random inputs?
  └─> Property-based test with Arbitrary
```

**The key insight:** Effect's testing strategy ensures **correctness at every layer** through:
1. Type safety (compile time)
2. Schema validation (parse time)
3. Contract tests (behavior time)
4. Integration tests (composition time)
5. E2E tests (system time)

Each layer catches bugs **as early as possible**, with faster feedback loops at the foundation. This is how you build complex, production-grade applications with confidence.
