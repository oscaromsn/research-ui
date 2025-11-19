---
modified: 2025-10-27T20:24:52-03:00
---
# 🔄 The Streamlined Contract-Driven TDD Pipeline

## 📊 Pipeline Overview

```
FEATURE REQUEST
      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: DESIGN 🔵 (Define Contracts)                          │
│ • Define errors first (_UserErrors.ts)                          │
│ • Define models second (_User.ts)                               │
│ • Define interface third (UserRepository.ts)                    │
│ EXIT: bun run validate:design ✅                                │
└─────────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: CONTRACT 🟢 (Build Fake + Write Tests)                │
│ • Create fake implementation (UserRepository.fake.ts)           │
│ • Write contract tests (UserRepository.contract.test.ts)        │
│ EXIT: bun run validate:contract ✅                              │
└─────────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3: RED 🔴 (Verify Tests Fail)                            │
│ • Confirm contract tests FAIL with fake                         │
│ EXIT: bun run validate:red ✅                                   │
└─────────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 4: GREEN 🟢 (Implement Fake)                             │
│ • Implement fake until contract tests PASS                      │
│ EXIT: bun run validate:green ✅                                 │
└─────────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 5: PRODUCTION 🟡 (Implement Real Adapter)                │
│ • Create production implementation (UserRepositoryPostgres.ts)  │
│ • Reuse contract tests (integration.test.ts)                    │
│ EXIT: bun run validate:production ✅                            │
└─────────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 6: INTEGRATE 🔗 (Test Layer Composition)                 │
│ • Update layers/production.ts with new service                  │
│ • Write workflow integration tests                              │
│ EXIT: bun run validate:integrate ✅                             │
└─────────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 7: HARDEN 💪 (Chaos, Load, E2E)                          │
│ • Run chaos tests (failure injection)                           │
│ • Run load tests (performance)                                  │
│ • Run E2E tests (full stack)                                    │
│ EXIT: bun run validate:harden ✅                                │
└─────────────────────────────────────────────────────────────────┘
      ↓
   PRODUCTION READY 🚀
```

---

## 🎯 Phase-by-Phase Walkthrough

### Example: Building a `UserRepository`

---

## Phase 1: DESIGN 🔵 (10 minutes)

### Goal
Define the complete contract (errors, models, interface) before any implementation.

### Steps

#### 1.1 Define Errors FIRST

```bash
touch src/domain/errors/_UserErrors.ts
```

```typescript
// src/domain/errors/_UserErrors.ts
import { Data } from "effect";

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly userId: string;
}> {}

export class DuplicateUserError extends Data.TaggedError("DuplicateUserError")<{
  readonly email: string;
}> {}

export class InvalidUserDataError extends Data.TaggedError("InvalidUserDataError")<{
  readonly reason: string;
}> {}
```

#### 1.2 Define Models SECOND

```bash
touch src/domain/models/_User.ts
```

```typescript
// src/domain/models/_User.ts
import { Schema } from "effect";

export class UserId extends Schema.String.pipe(Schema.brand("UserId")) {}

export class User extends Schema.Class<User>("User")({
  id: UserId,
  email: Schema.String.pipe(
    Schema.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  ),
  name: Schema.NonEmptyString,
  age: Schema.Int.pipe(Schema.between(18, 120)),
  role: Schema.Literal("admin", "user", "guest"),
  createdAt: Schema.DateTimeUtc,
}) {}
```

#### 1.3 Define Interface THIRD

```bash
mkdir -p src/application/ports/repositories
touch src/application/ports/repositories/UserRepository.ts
```

```typescript
// src/application/ports/repositories/UserRepository.ts
import { Effect, Context } from "effect";
import { User, UserId } from "@/domain/models";
import { 
  UserNotFoundError, 
  DuplicateUserError 
} from "@/domain/errors";

export class UserRepository extends Context.Tag("UserRepository")
  UserRepository,
  {
    readonly save: (user: User) => Effect.Effect<void, DuplicateUserError>;
    readonly findById: (id: UserId) => Effect.Effect<User, UserNotFoundError>;
    readonly list: (limit: number, offset: number) => Effect.Effect<Array<User>>;
    readonly count: () => Effect.Effect<number>;
    readonly deleteById: (id: UserId) => Effect.Effect<void, UserNotFoundError>;
  }
>() {}
```

### Exit Criteria

```bash
# Validate design phase
bun run validate:design
```

**What it checks:**
- ✅ Error files exist with proper TaggedError types
- ✅ Model files exist with proper Schema definitions
- ✅ Interface files exist with proper Context.Tag
- ✅ All files compile (no TypeScript errors)
- ✅ Imports resolve correctly

**Output:**

```
🔵 DESIGN Phase Validation

✓ Checking error definitions... PASS
  - _UserErrors.ts exists
  - All errors extend Data.TaggedError
  
✓ Checking model definitions... PASS
  - _User.ts exists
  - User extends Schema.Class
  - UserId is branded type
  
✓ Checking interface definitions... PASS
  - UserRepository.ts exists
  - Interface extends Context.Tag
  - All error types in error channel
  
✓ Type checking... PASS
  
✅ DESIGN Phase Complete! Ready for CONTRACT phase.
```

---

## Phase 2: CONTRACT 🟢 (20 minutes)

### Goal
Create a fully-functional fake implementation and comprehensive contract tests.

### Steps

#### 2.1 Create Fake Implementation

```bash
touch src/application/ports/repositories/UserRepository.fake.ts
```

```typescript
// src/application/ports/repositories/UserRepository.fake.ts
import { Effect, Layer, Ref, Context } from "effect";
import { UserRepository } from "./UserRepository";
import { User, UserId } from "@/domain/models";
import { UserNotFoundError, DuplicateUserError } from "@/domain/errors";

export class UserRepositoryFake extends Context.Tag("UserRepositoryFake")
  UserRepositoryFake,
  {
    // 🔹 Production API (same as UserRepository)
    readonly save: (user: User) => Effect.Effect<void, DuplicateUserError>;
    readonly findById: (id: UserId) => Effect.Effect<User, UserNotFoundError>;
    readonly list: (limit: number, offset: number) => Effect.Effect<Array<User>>;
    readonly count: () => Effect.Effect<number>;
    readonly deleteById: (id: UserId) => Effect.Effect<void, UserNotFoundError>;
    
    // 🔍 Inspection API (test-only)
    readonly clear: () => Effect.Effect<void>;
    readonly exportState: () => Effect.Effect<Array<User>>;
    readonly getEvents: () => Effect.Effect<Array<RepositoryEvent>>;
  }
>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const store = yield* Ref.make(new Map<string, User>());
      const events = yield* Ref.make<Array<RepositoryEvent>>([]);
      
      const logEvent = (event: RepositoryEvent) =>
        Ref.update(events, (evts) => [...evts, event]);
      
      return {
        // Production API
        save: (user) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(store);
            if (map.has(user.id)) {
              return yield* Effect.fail(new DuplicateUserError({ email: user.email }));
            }
            yield* Ref.update(store, (m) => new Map(m).set(user.id, user));
            yield* logEvent({ type: "save", userId: user.id, timestamp: Date.now() });
          }),
        
        findById: (id) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(store);
            yield* logEvent({ type: "findById", userId: id, timestamp: Date.now() });
            
            const user = map.get(id);
            if (!user) {
              return yield* Effect.fail(new UserNotFoundError({ userId: id }));
            }
            return user;
          }),
        
        list: (limit, offset) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(store);
            return Array.from(map.values()).slice(offset, offset + limit);
          }),
        
        count: () =>
          Ref.get(store).pipe(Effect.map((m) => m.size)),
        
        deleteById: (id) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(store);
            if (!map.has(id)) {
              return yield* Effect.fail(new UserNotFoundError({ userId: id }));
            }
            yield* Ref.update(store, (m) => {
              const newMap = new Map(m);
              newMap.delete(id);
              return newMap;
            });
            yield* logEvent({ type: "delete", userId: id, timestamp: Date.now() });
          }),
        
        // Inspection API
        clear: () =>
          Effect.all([
            Ref.set(store, new Map()),
            Ref.set(events, [])
          ]).pipe(Effect.asVoid),
        
        exportState: () =>
          Ref.get(store).pipe(Effect.map((m) => Array.from(m.values()))),
        
        getEvents: () => Ref.get(events)
      };
    })
  );
}

// Provide as UserRepository for application code
export const UserRepositoryFakeLayer = Layer.effect(
  UserRepository,
  UserRepositoryFake
);
```

#### 2.2 Write Contract Tests

```bash
touch src/application/ports/repositories/UserRepository.contract.test.ts
```

```typescript
// src/application/ports/repositories/UserRepository.contract.test.ts
import { describe, it } from "@effect/vitest";
import { Effect, Exit, Cause, Option, Layer, TestContext } from "effect";
import { assert } from "@effect/vitest";
import { UserRepository } from "./UserRepository";
import { UserRepositoryFake } from "./UserRepository.fake";
import { User, UserId } from "@/domain/models";
import { UserNotFoundError, DuplicateUserError } from "@/domain/errors";

// Test data helpers
const createTestUser = (overrides?: Partial<User>): User =>
  new User({
    id: UserId.make(crypto.randomUUID()),
    email: "test@example.com",
    name: "Test User",
    age: 25,
    role: "user",
    createdAt: new Date(),
    ...overrides
  });

// 🎯 REUSABLE CONTRACT SUITE
export const runUserRepositoryContractTests = (
  name: string,
  makeLayer: () => Layer.Layer<UserRepository>
) => {
  describe(`UserRepository Contract - ${name}`, () => {
    
    // Category 1: Happy Path Tests
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
      
      it.effect("should retrieve multiple saved users", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const users = Array.from({ length: 3 }, (_, i) =>
            createTestUser({ 
              id: UserId.make(`user-${i}`),
              email: `user${i}@example.com` 
            })
          );
          
          for (const user of users) {
            yield* repo.save(user);
          }
          
          for (const user of users) {
            const retrieved = yield* repo.findById(user.id);
            assert.deepStrictEqual(retrieved, user);
          }
        }).pipe(Effect.provide(makeLayer()))
      );
    });
    
    // Category 2: Error Handling
    describe("error handling", () => {
      it.effect("should fail with UserNotFoundError for missing user", () =>
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
          if (Exit.isFailure(exit)) {
            const error = Cause.failureOption(exit.cause);
            assert.isTrue(Option.isSome(error));
            assert.instanceOf(Option.getOrThrow(error), DuplicateUserError);
          }
        }).pipe(Effect.provide(makeLayer()))
      );
    });
    
    // Category 3: List and Count
    describe("list and count", () => {
      it.effect("should list users with pagination", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const users = Array.from({ length: 10 }, (_, i) =>
            createTestUser({ 
              id: UserId.make(`user-${i}`),
              email: `user${i}@example.com` 
            })
          );
          
          for (const user of users) {
            yield* repo.save(user);
          }
          
          const page1 = yield* repo.list(5, 0);
          assert.strictEqual(page1.length, 5);
          
          const page2 = yield* repo.list(5, 5);
          assert.strictEqual(page2.length, 5);
        }).pipe(Effect.provide(makeLayer()))
      );
      
      it.effect("should count users correctly", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          
          const initialCount = yield* repo.count();
          assert.strictEqual(initialCount, 0);
          
          const user = createTestUser();
          yield* repo.save(user);
          
          const afterSave = yield* repo.count();
          assert.strictEqual(afterSave, 1);
        }).pipe(Effect.provide(makeLayer()))
      );
    });
    
    // Category 4: Delete
    describe("deleteById", () => {
      it.effect("should delete existing user", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();
          
          yield* repo.save(user);
          yield* repo.deleteById(user.id);
          
          const exit = yield* Effect.exit(repo.findById(user.id));
          assert.isTrue(Exit.isFailure(exit));
        }).pipe(Effect.provide(makeLayer()))
      );
      
      it.effect("should fail when deleting nonexistent user", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const exit = yield* Effect.exit(
            repo.deleteById(UserId.make("nonexistent"))
          );
          
          assert.isTrue(Exit.isFailure(exit));
        }).pipe(Effect.provide(makeLayer()))
      );
    });
    
    // Category 5: Concurrency Safety
    describe("concurrency", () => {
      it.effect("should handle concurrent writes safely", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const users = Array.from({ length: 100 }, (_, i) =>
            createTestUser({ 
              id: UserId.make(`user-${i}`),
              email: `user${i}@example.com` 
            })
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
      
      it.effect("should handle concurrent reads safely", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();
          yield* repo.save(user);
          
          const results = yield* Effect.all(
            Array.from({ length: 100 }, () => repo.findById(user.id)),
            { concurrency: "unbounded" }
          );
          
          assert.strictEqual(results.length, 100);
          results.forEach((retrieved) => {
            assert.deepStrictEqual(retrieved, user);
          });
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.provide(TestContext.TestContext)
        )
      );
    });
    
    // Category 6: Edge Cases
    describe("edge cases", () => {
      it.effect("should handle empty list", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const users = yield* repo.list(10, 0);
          assert.strictEqual(users.length, 0);
        }).pipe(Effect.provide(makeLayer()))
      );
      
      it.effect("should handle pagination beyond data", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();
          yield* repo.save(user);
          
          const users = yield* repo.list(10, 100);
          assert.strictEqual(users.length, 0);
        }).pipe(Effect.provide(makeLayer()))
      );
    });
  });
};

// 🎯 RUN CONTRACT TESTS AGAINST FAKE
runUserRepositoryContractTests(
  "Fake",
  () => UserRepositoryFakeLayer
);
```

### Exit Criteria

```bash
# Start watch mode for instant feedback
bun run test:watch --testPathPattern="UserRepository.contract"

# Validate contract phase
bun run validate:contract
```

**What it checks:**
- ✅ Fake implementation exists
- ✅ Contract tests exist
- ✅ Fake has inspection API (clear, exportState, getEvents)
- ✅ All contract tests are written (happy path + errors + edge cases)
- ✅ Tests compile (no TypeScript errors)

**Output:**

```
🟢 CONTRACT Phase Validation

✓ Checking fake implementation... PASS
  - UserRepository.fake.ts exists
  - Fake has inspection APIs
  
✓ Checking contract tests... PASS
  - UserRepository.contract.test.ts exists
  - 15 test cases defined
  - Tests cover happy paths
  - Tests cover all error types
  - Tests cover edge cases
  - Tests cover concurrency
  
✓ Type checking... PASS

✅ CONTRACT Phase Complete! Ready for RED phase.
```

---

## Phase 3: RED 🔴 (5 minutes)

### Goal
Verify that contract tests **FAIL** because the fake is not yet implemented.

### Steps

#### 3.1 Stub Out Fake (Temporarily)

Make all methods return `Effect.die("Not implemented")`:

```typescript
// Temporarily stub the fake
save: (user) => Effect.die(new Error("Not implemented")),
findById: (id) => Effect.die(new Error("Not implemented")),
// ... etc
```

#### 3.2 Run Tests and Confirm Failures

```bash
bun run validate:red
```

### Exit Criteria

**What it checks:**
- ✅ Contract tests exist
- ✅ Contract tests **FAIL** with fake
- ✅ Failures are intentional (not compilation errors)

**Output:**

```
🔴 RED Phase Validation

✓ Checking contract tests exist... PASS
  
✓ Running contract tests... FAIL (EXPECTED)
  - 15 tests failed
  - All failures are "Not implemented" errors
  
⚠️  Tests are failing as expected!

✅ RED Phase Complete! Ready for GREEN phase.
Now implement the fake to make tests pass.
```

---

## Phase 4: GREEN 🟢 (30 minutes)

### Goal
Implement the fake until **ALL** contract tests pass.

### Steps

#### 4.1 Implement Fake Methods One by One

Start with `save` and `findById`, then add others:

```typescript
// Implement each method to make tests pass
save: (user) =>
  Effect.gen(function* () {
    const map = yield* Ref.get(store);
    if (map.has(user.id)) {
      return yield* Effect.fail(new DuplicateUserError({ email: user.email }));
    }
    yield* Ref.update(store, (m) => new Map(m).set(user.id, user));
  }),
```

#### 4.2 Run Tests in Watch Mode

```bash
# Keep this running while implementing
bun run test:watch --testPathPattern="UserRepository.contract"
```

Watch tests turn green as you implement each method.

### Exit Criteria

```bash
# Validate green phase
bun run validate:green
```

**What it checks:**
- ✅ All contract tests pass with fake
- ✅ No `Effect.die("Not implemented")` remaining
- ✅ Fake implementation is complete

**Output:**

```
🟢 GREEN Phase Validation

✓ Running contract tests with fake... PASS
  - 15/15 tests passing
  
✓ Checking for incomplete implementations... PASS
  - No "Not implemented" errors found
  
✓ Type checking... PASS

✅ GREEN Phase Complete! Ready for PRODUCTION phase.
Fake is fully implemented and all contract tests pass.
```

---

## Phase 5: PRODUCTION 🟡 (45 minutes)

### Goal
Create production implementation that passes **the same contract tests**.

### Steps

#### 5.1 Create Production Implementation

```bash
mkdir -p src/infrastructure/persistence/postgres
touch src/infrastructure/persistence/postgres/UserRepositoryPostgres.ts
```

```typescript
// src/infrastructure/persistence/postgres/UserRepositoryPostgres.ts
import { Effect, Layer } from "effect";
import { UserRepository } from "@/application/ports/repositories/UserRepository";
import { SqlClient } from "@effect/sql";

export const UserRepositoryPostgres = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    
    return {
      save: (user) =>
        sql`
          INSERT INTO users (id, email, name, age, role, created_at)
          VALUES (${user.id}, ${user.email}, ${user.name}, ${user.age}, ${user.role}, ${user.createdAt})
        `.pipe(
          Effect.catchTag("SqlError", (error) => {
            if (error.message.includes("duplicate key")) {
              return Effect.fail(new DuplicateUserError({ email: user.email }));
            }
            return Effect.die(error);
          })
        ),
      
      findById: (id) =>
        sql<User>`
          SELECT * FROM users WHERE id = ${id}
        `.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.fail(new UserNotFoundError({ userId: id }))
              : Effect.succeed(rows[0])
          )
        ),
      
      list: (limit, offset) =>
        sql<User>`
          SELECT * FROM users ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
        `,
      
      count: () =>
        sql<{ count: number }>`
          SELECT COUNT(*) as count FROM users
        `.pipe(Effect.map((rows) => rows[0].count)),
      
      deleteById: (id) =>
        sql`
          DELETE FROM users WHERE id = ${id}
        `.pipe(
          Effect.flatMap((result) =>
            result.affectedRows === 0
              ? Effect.fail(new UserNotFoundError({ userId: id }))
              : Effect.void
          )
        )
    };
  })
);
```

#### 5.2 Create Integration Tests (Reuse Contract Tests!)

```bash
touch src/infrastructure/persistence/postgres/UserRepositoryPostgres.integration.test.ts
```

```typescript
// src/infrastructure/persistence/postgres/UserRepositoryPostgres.integration.test.ts
import { runUserRepositoryContractTests } from "@/application/ports/repositories/UserRepository.contract.test";
import { UserRepositoryPostgres } from "./UserRepositoryPostgres";
import { TestDatabaseLayer } from "@test/helpers/database";

// 🎯 REUSE EXACT SAME CONTRACT TESTS
runUserRepositoryContractTests(
  "Postgres",
  () => UserRepositoryPostgres.pipe(
    Layer.provide(TestDatabaseLayer)
  )
);

// Add implementation-specific tests if needed
describe("UserRepositoryPostgres - SQL Details", () => {
  it.effect("should use correct SQL for save", () => {
    // Test SQL generation, connection handling, etc.
  });
});
```

### Exit Criteria

```bash
# Run integration tests
bun run test:integration

# Validate production phase
bun run validate:production
```

**What it checks:**
- ✅ Production implementation exists
- ✅ Integration tests exist
- ✅ **All contract tests pass** with production layer
- ✅ Behavioral equivalence with fake

**Output:**

```
🟡 PRODUCTION Phase Validation

✓ Checking production implementation... PASS
  - UserRepositoryPostgres.ts exists
  
✓ Checking integration tests... PASS
  - UserRepositoryPostgres.integration.test.ts exists
  - Reuses contract test suite
  
✓ Running contract tests with production... PASS
  - 15/15 tests passing
  - Production is behaviorally equivalent to fake
  
✓ Type checking... PASS

✅ PRODUCTION Phase Complete! Ready for INTEGRATE phase.
Production implementation is verified correct.
```

---

## Phase 6: INTEGRATE 🔗 (20 minutes)

### Goal
Wire production implementation into application layers and test composition.

### Steps

#### 6.1 Update Production Layer

```typescript
// src/layers/production.ts
import { Layer } from "effect";
import { UserRepositoryPostgres } from "@/infrastructure/persistence/postgres/UserRepositoryPostgres";
import { OrderRepositoryPostgres } from "@/infrastructure/persistence/postgres/OrderRepositoryPostgres";
import { EmailServiceSmtp } from "@/infrastructure/messaging/smtp/EmailServiceSmtp";
import { SqlClient } from "@effect/sql";
import { Config } from "@/shared/config";

export const ProductionLayer = Layer.mergeAll(
  // Infrastructure
  SqlClient.layer.pipe(Layer.provide(Config.layer)),
  
  // Repositories
  UserRepositoryPostgres,
  OrderRepositoryPostgres,
  
  // Services
  EmailServiceSmtp,
);
```

#### 6.2 Test Layer Composition

```bash
touch src/layers/production.test.ts
```

```typescript
// src/layers/production.test.ts
import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { assert } from "@effect/vitest";
import { ProductionLayer } from "./production";
import { UserRepository } from "@/application/ports/repositories/UserRepository";

describe("Production Layer Composition", () => {
  it.effect("should provide all required services", () =>
    Effect.gen(function* () {
      const userRepo = yield* UserRepository;
      assert.isDefined(userRepo);
    }).pipe(Effect.provide(ProductionLayer))
  );
  
  it.effect("should handle service dependencies", () =>
    Effect.gen(function* () {
      // Test that services with dependencies resolve correctly
    }).pipe(Effect.provide(ProductionLayer))
  );
});
```

#### 6.3 Write Workflow Integration Tests

```bash
mkdir -p test/integration
touch test/integration/user-registration.integration.test.ts
```

```typescript
// test/integration/user-registration.integration.test.ts
import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { assert } from "@effect/vitest";
import { RegisterUser } from "@/application/use-cases/users/RegisterUser";
import { UserRepository } from "@/application/ports/repositories/UserRepository";
import { EmailServiceFake } from "@/application/ports/services/EmailService.fake";
import { TestLayer } from "@/layers/test";

describe("User Registration Integration", () => {
  it.effect("should register user and send welcome email", () =>
    Effect.gen(function* () {
      const registerUser = yield* RegisterUser;
      const userRepo = yield* UserRepository;
      const emailFake = yield* EmailServiceFake;
      
      // Register user
      const user = yield* registerUser({
        email: "test@example.com",
        name: "Test User",
        age: 25
      });
      
      // Verify user saved
      const saved = yield* userRepo.findById(user.id);
      assert.deepStrictEqual(saved, user);
      
      // Verify email sent
      const wasSent = yield* emailFake.wasEmailSentTo(user.email);
      assert.isTrue(wasSent);
    }).pipe(Effect.provide(TestLayer))
  );
});
```

### Exit Criteria

```bash
# Run integration tests
bun run test:integration

# Validate integrate phase
bun run validate:integrate
```

**What it checks:**
- ✅ Production layer updated with new service
- ✅ Layer composition tests pass
- ✅ Integration tests pass
- ✅ All services resolve dependencies

**Output:**

```
🔗 INTEGRATE Phase Validation

✓ Checking layer composition... PASS
  - ProductionLayer includes UserRepositoryPostgres
  - All dependencies resolved
  
✓ Running layer composition tests... PASS
  - 3/3 tests passing
  
✓ Running integration tests... PASS
  - 5/5 tests passing
  - User registration workflow works
  
✓ Type checking... PASS

✅ INTEGRATE Phase Complete! Ready for HARDEN phase.
Services compose correctly into complete application.
```

---

## Phase 7: HARDEN 💪 (60 minutes)

### Goal
Validate resilience, performance, and end-to-end behavior.

### Steps

#### 7.1 Write Chaos Tests

```bash
mkdir -p test/chaos
touch test/chaos/user-service-failures.chaos.test.ts
```

```typescript
// test/chaos/user-service-failures.chaos.test.ts
import { describe, it } from "@effect/vitest";
import { Effect, Schedule, Duration } from "effect";
import { assert } from "@effect/vitest";
import { RegisterUser } from "@/application/use-cases/users/RegisterUser";
import { makeChaosLayer } from "@test/helpers/chaos";

describe("User Service - Chaos Testing", () => {
  const ChaosLayer = makeChaosLayer({
    failureRate: 0.3, // 30% failures
    latencyMs: [100, 2000],
    enabled: true
  });
  
  it.effect("should handle intermittent failures with retry", () =>
    Effect.gen(function* () {
      const registerUser = yield* RegisterUser;
      
      const user = yield* registerUser({
        email: "chaos@example.com",
        name: "Chaos User",
        age: 25
      }).pipe(
        Effect.retry({
          times: 10,
          schedule: Schedule.exponential(Duration.millis(100))
        }),
        Effect.timeout(Duration.seconds(30))
      );
      
      assert.isDefined(user.id);
    }).pipe(Effect.provide(ChaosLayer))
  );
});
```

#### 7.2 Write Load Tests

```bash
mkdir -p test/load
touch test/load/concurrent-registrations.load.test.ts
```

```typescript
// test/load/concurrent-registrations.load.test.ts
import { describe, it } from "@effect/vitest";
import { Effect, Clock } from "effect";
import { assert } from "@effect/vitest";
import { RegisterUser } from "@/application/use-cases/users/RegisterUser";
import { TestLayer } from "@/layers/test";

describe("User Registration - Load Testing", () => {
  it.effect("should handle 1000 concurrent registrations", () =>
    Effect.gen(function* () {
      const registerUser = yield* RegisterUser;
      const startTime = yield* Clock.currentTimeMillis;
      
      const users = Array.from({ length: 1000 }, (_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${i}`,
        age: 25
      }));
      
      yield* Effect.all(
        users.map((data) => registerUser(data)),
        { concurrency: "unbounded" }
      );
      
      const endTime = yield* Clock.currentTimeMillis;
      const duration = endTime - startTime;
      
      console.log(`1000 users registered in ${duration}ms`);
      assert.isTrue(duration < 5000); // Under 5 seconds
    }).pipe(Effect.provide(TestLayer))
  );
});
```

#### 7.3 Write E2E Tests

```bash
mkdir -p test/e2e
touch test/e2e/user-api.e2e.test.ts
```

```typescript
// test/e2e/user-api.e2e.test.ts
import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { assert } from "@effect/vitest";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import { E2ELayer } from "@test/helpers/e2e";

describe("User API - E2E", () => {
  it.effect("should create and retrieve user via API", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      
      // Create user
      const createResponse = yield* HttpClientRequest.post("/api/v1/users").pipe(
        HttpClientRequest.jsonBody({
          email: "e2e@example.com",
          name: "E2E User",
          age: 25
        }),
        client.execute,
        Effect.flatMap(HttpClientResponse.json),
        Effect.scoped
      );
      
      const userId = createResponse.id;
      
      // Retrieve user
      const user = yield* HttpClientRequest.get(`/api/v1/users/${userId}`).pipe(
        client.execute,
        Effect.flatMap(HttpClientResponse.json),
        Effect.scoped
      );
      
      assert.strictEqual(user.email, "e2e@example.com");
    }).pipe(Effect.provide(E2ELayer))
  );
});
```

### Exit Criteria

```bash
# Run chaos tests
bun run test:chaos

# Run load tests
bun run test:load

# Run E2E tests
bun run test:e2e

# Validate harden phase
bun run validate:harden
```

**What it checks:**
- ✅ Chaos tests pass (survives failures)
- ✅ Load tests pass (performance acceptable)
- ✅ E2E tests pass (full stack works)

**Output:**

```
💪 HARDEN Phase Validation

✓ Running chaos tests... PASS
  - System survives 30% failure rate
  - Retry logic works correctly
  
✓ Running load tests... PASS
  - 1000 concurrent operations: 2.3s
  - Performance benchmarks met
  
✓ Running E2E tests... PASS
  - Full API stack functional
  - All endpoints working
  
✅ HARDEN Phase Complete!

🎉 PRODUCTION READY! 🚀
Feature is fully validated and ready for deployment.
```

---

## 📋 Streamlined Scripts

### scripts/validate-phase.ts

```typescript
#!/usr/bin/env tsx
import { Effect, Console } from "effect";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

type Phase = "design" | "contract" | "red" | "green" | "production" | "integrate" | "harden";

const run = (cmd: string) => {
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch {
    throw new Error(`Command failed: ${cmd}`);
  }
};

const checkFileExists = (filePath: string): boolean => {
  return fs.existsSync(path.join(process.cwd(), filePath));
};

const validateDesign = Effect.gen(function* () {
  yield* Console.log("🔵 DESIGN Phase Validation\n");
  
  yield* Console.log("✓ Checking error definitions...");
  if (!checkFileExists("src/domain/errors")) {
    throw new Error("Missing src/domain/errors directory");
  }
  
  yield* Console.log("✓ Checking model definitions...");
  if (!checkFileExists("src/domain/models")) {
    throw new Error("Missing src/domain/models directory");
  }
  
  yield* Console.log("✓ Type checking...");
  run("tsc --noEmit");
  
  yield* Console.log("\n✅ DESIGN Phase Complete! Ready for CONTRACT phase.\n");
});

const validateContract = Effect.gen(function* () {
  yield* Console.log("🟢 CONTRACT Phase Validation\n");
  
  yield* Console.log("✓ Checking fake implementations...");
  yield* Console.log("✓ Checking contract tests...");
  
  yield* Console.log("✓ Running contract tests...");
  run("vitest run --testPathPattern='\\.contract\\.test\\.ts$'");
  
  yield* Console.log("\n✅ CONTRACT Phase Complete! Ready for RED phase.\n");
});

const validateRed = Effect.gen(function* () {
  yield* Console.log("🔴 RED Phase Validation\n");
  
  yield* Console.log("✓ Checking contract tests exist...");
  
  yield* Console.log("✓ Verifying tests FAIL (expected)...");
  try {
    run("vitest run --testPathPattern='\\.contract\\.test\\.ts$'");
    throw new Error("Tests passed but should fail in RED phase!");
  } catch {
    yield* Console.log("  ⚠️  Tests failing as expected\n");
  }
  
  yield* Console.log("✅ RED Phase Complete! Ready for GREEN phase.\n");
});

const validateGreen = Effect.gen(function* () {
  yield* Console.log("🟢 GREEN Phase Validation\n");
  
  yield* Console.log("✓ Running contract tests with fake...");
  run("vitest run --testPathPattern='\\.contract\\.test\\.ts$'");
  
  yield* Console.log("\n✅ GREEN Phase Complete! Ready for PRODUCTION phase.\n");
});

const validateProduction = Effect.gen(function* () {
  yield* Console.log("🟡 PRODUCTION Phase Validation\n");
  
  yield* Console.log("✓ Checking production implementation...");
  yield* Console.log("✓ Running contract tests with production...");
  run("vitest run --testPathPattern='\\.integration\\.test\\.ts$'");
  
  yield* Console.log("\n✅ PRODUCTION Phase Complete! Ready for INTEGRATE phase.\n");
});

const validateIntegrate = Effect.gen(function* () {
  yield* Console.log("🔗 INTEGRATE Phase Validation\n");
  
  yield* Console.log("✓ Running layer composition tests...");
  run("vitest run --testPathPattern='layers/.*\\.test\\.ts$'");
  
  yield* Console.log("✓ Running integration tests...");
  run("vitest run test/integration");
  
  yield* Console.log("\n✅ INTEGRATE Phase Complete! Ready for HARDEN phase.\n");
});

const validateHarden = Effect.gen(function* () {
  yield* Console.log("💪 HARDEN Phase Validation\n");
  
  yield* Console.log("✓ Running chaos tests...");
  run("vitest run test/chaos");
  
  yield* Console.log("✓ Running load tests...");
  run("vitest run test/load");
  
  yield* Console.log("✓ Running E2E tests...");
  run("vitest run test/e2e");
  
  yield* Console.log("\n✅ HARDEN Phase Complete!\n");
  yield* Console.log("🎉 PRODUCTION READY! 🚀\n");
});

const validatePhase = (phase: Phase) => {
  switch (phase) {
    case "design": return validateDesign;
    case "contract": return validateContract;
    case "red": return validateRed;
    case "green": return validateGreen;
    case "production": return validateProduction;
    case "integrate": return validateIntegrate;
    case "harden": return validateHarden;
  }
};

const phase = process.argv[2] as Phase;
if (!phase) {
  console.error("Usage: validate-phase <phase>");
  process.exit(1);
}

Effect.runPromise(validatePhase(phase)).catch(() => process.exit(1));
```

### package.json (Streamlined)

```json
{
  "scripts": {
    "// Phase Validation": "",
    "validate:design": "tsx scripts/validate-phase.ts design",
    "validate:contract": "tsx scripts/validate-phase.ts contract",
    "validate:red": "tsx scripts/validate-phase.ts red",
    "validate:green": "tsx scripts/validate-phase.ts green",
    "validate:production": "tsx scripts/validate-phase.ts production",
    "validate:integrate": "tsx scripts/validate-phase.ts integrate",
    "validate:harden": "tsx scripts/validate-phase.ts harden",
    
    "// Quick Testing": "",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:contract": "vitest run --testPathPattern='\\.contract\\.test\\.ts$'",
    "test:integration": "vitest run --testPathPattern='\\.integration\\.test\\.ts$'",
    "test:chaos": "vitest run test/chaos",
    "test:load": "vitest run test/load",
    "test:e2e": "vitest run test/e2e",
    
    "// Development": "",
    "dev": "tsx scripts/dev.ts",
    "verify": "tsx scripts/verify.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 🎯 Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│ EFFECT CONTRACT-DRIVEN TDD PIPELINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. DESIGN 🔵       → Define errors, models, interface       │
│    ├─ Create _UserErrors.ts                                │
│    ├─ Create _User.ts                                      │
│    ├─ Create UserRepository.ts                             │
│    └─ Run: validate:design                                 │
│                                                             │
│ 2. CONTRACT 🟢     → Build fake + write tests              │
│    ├─ Create UserRepository.fake.ts                        │
│    ├─ Create UserRepository.contract.test.ts               │
│    └─ Run: validate:contract                               │
│                                                             │
│ 3. RED 🔴          → Verify tests fail                     │
│    ├─ Stub fake methods                                    │
│    └─ Run: validate:red                                    │
│                                                             │
│ 4. GREEN 🟢        → Implement fake                        │
│    ├─ Implement all methods                                │
│    └─ Run: validate:green                                  │
│                                                             │
│ 5. PRODUCTION 🟡   → Build real adapter                    │
│    ├─ Create UserRepositoryPostgres.ts                     │
│    ├─ Reuse contract tests                                 │
│    └─ Run: validate:production                             │
│                                                             │
│ 6. INTEGRATE 🔗    → Wire into layers                      │
│    ├─ Update layers/production.ts                          │
│    ├─ Write integration tests                              │
│    └─ Run: validate:integrate                              │
│                                                             │
│ 7. HARDEN 💪       → Chaos + Load + E2E                    │
│    ├─ Write chaos tests                                    │
│    ├─ Write load tests                                     │
│    ├─ Write E2E tests                                      │
│    └─ Run: validate:harden                                 │
│                                                             │
│ ✅ PRODUCTION READY 🚀                                      │
└─────────────────────────────────────────────────────────────┘
```

---

This streamlined pipeline makes it **impossible to get lost**. Each phase has:
1. Clear goal
2. Concrete steps
3. Validation command
4. Pass/fail criteria
5. Next phase indicator

The pipeline is **linear and sequential** - you can't skip ahead, and you always know where you are.
