---
modified: 2025-10-20T17:51:11-03:00
---
# The Optimal Contract-Driven TDD Approach in Effect

After exploring patterns for building complex applications through validated abstractions, here's the **definitive approach** to Contract-Driven TDD in Effect, optimized for correctness and early bug detection.

## Core Philosophy: The Contract IS the Specification

In Effect, **the type signature is the contract, the test is the validation, and the fake is the reference implementation.**

```
Effect<Success, Error, Requirements> = Complete Contract Specification
         ↓                ↓              ↓
    What you get    What can fail   What you need
```

This gives us three validation checkpoints:
1. **Compile-time:** TypeScript ensures structural correctness
2. **Test-time:** Contract tests ensure behavioral correctness
3. **Runtime:** Schema validation ensures data correctness

## The Diamond Development Cycle

Traditional TDD is Red → Green → Refactor. Contract-Driven TDD in Effect is:

```
1. DESIGN (Gray)
   Define types, errors, and interface signatures
   ↓
2. CONTRACT (Blue)  
   Write tests against the interface with a fake
   ↓
3. RED
   Tests fail (no implementation yet)
   ↓
4. GREEN
   Implement until tests pass
   ↓
5. GOLD (Refactor + Harden)
   Optimize with confidence, add production layer
```

Let me show you the complete pattern.

## The 7-Step Optimal Workflow

### Step 1: Design the Error Domain (Errors First!)

**Rationale:** Errors are outcomes, not exceptions. They're part of your business logic and must be designed upfront.

```typescript
// domain/errors.ts - Define ALL failure modes
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: UserId;
}> {}

export class UserAlreadyExistsError extends Data.TaggedError("UserAlreadyExistsError")<{
  email: EmailAddress;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  cause: unknown;
}> {}
```

**Validation:** None needed - these are design artifacts.

### Step 2: Design the Data Model (Schema-First)

**Rationale:** Self-validating data structures eliminate a whole class of bugs.

```typescript
// domain/models.ts
import { Schema, Brand } from "effect";

// Branded primitives enforce invariants at the type level
export type UserId = string & Brand.Brand<"UserId">;
export const UserId = Brand.nominal<UserId>();

export type EmailAddress = string & Brand.Brand<"EmailAddress">;
export const EmailAddress = Brand.refined<EmailAddress>(
  (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),
  (s) => Brand.error(`Invalid email: ${s}`)
);

// Schema.Class gives you validation + type + methods
export class User extends Schema.Class<User>("User")({
  id: UserId,
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  name: Schema.NonEmptyString,
  age: Schema.Number.pipe(Schema.between(0, 150)),
  role: Schema.Literal("admin", "user", "guest"),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.optional(Schema.DateTimeUtc),
}) {
  get isAdmin(): boolean {
    return this.role === "admin";
  }
}

export const parseUser = Schema.decodeUnknown(User);
```

**Validation:** Write schema validation tests immediately.

```typescript
// domain/models.test.ts
describe("User Schema", () => {
  it("should accept valid user data", async () => {
    const valid = {
      id: UserId.make("user-1"),
      email: "valid@example.com",
      name: "Test User",
      age: 30,
      role: "user",
      createdAt: new Date().toISOString(),
    };
    
    const user = await Effect.runPromise(parseUser(valid));
    expect(user).toBeInstanceOf(User);
  });

  it("should reject invalid email", async () => {
    const invalid = { /* invalid email */ };
    await expect(Effect.runPromise(parseUser(invalid))).rejects.toThrow();
  });

  it("should reject age out of range", async () => {
    const invalid = { /* age: 200 */ };
    await expect(Effect.runPromise(parseUser(invalid))).rejects.toThrow();
  });
});
```

### Step 3: Design the Service Contract (Interface + Error Channel)

**Rationale:** The interface defines WHAT the service does. The error channel defines what can go wrong. This is your contract.

```typescript
// services/UserRepository.ts
export class UserRepository extends Effect.Service<UserRepository>()(
  "app/UserRepository",
  {
    effect: Effect.gen(function* () {
      return {
        // Each method's type signature IS the contract
        findById: (
          id: UserId
        ): Effect.Effect<User, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),

        findByEmail: (
          email: EmailAddress
        ): Effect.Effect<User, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),

        save: (
          user: User
        ): Effect.Effect<void, UserAlreadyExistsError | DatabaseError> =>
          Effect.die("Not implemented"),

        update: (
          user: User
        ): Effect.Effect<void, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),

        delete: (
          id: UserId
        ): Effect.Effect<void, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),
      };
    }),
  }
) {}
```

**Critical:** Notice we use `Effect.die("Not implemented")` as the stub. This ensures:
1. The interface compiles
2. Calling it before implementation crashes immediately (fail-fast)
3. The error channel is explicit in the type

### Step 4: Build a Rich, Inspectable Fake (The Reference Implementation)

**Rationale:** The fake is not a shortcut - it's a **production-quality in-memory implementation** that serves as:
- Your development environment
- The reference implementation for the contract
- A debugging tool with full observability

```typescript
// services/UserRepository.fake.ts
export class UserRepositoryFake extends Effect.Service<UserRepositoryFake>()(
  "app/UserRepositoryFake",
  {
    effect: Effect.gen(function* () {
      // State
      const users = yield* Ref.make<Map<UserId, User>>(new Map());
      const emailIndex = yield* Ref.make<Map<EmailAddress, UserId>>(new Map());
      
      // Observability
      const operations = yield* Ref.make
        Array<{ type: string; timestamp: number; args: unknown }>
      >([]);

      const logOp = (type: string, args: unknown) =>
        Effect.gen(function* () {
          const now = yield* Clock.currentTimeMillis;
          yield* Ref.update(operations, (ops) => [...ops, { type, timestamp: now, args }]);
        });

      // Production Interface Implementation
      const repository = {
        findById: (id) =>
          Effect.gen(function* () {
            yield* logOp("findById", { id });
            const map = yield* Ref.get(users);
            const user = map.get(id);
            
            if (!user) {
              return yield* Effect.fail(new UserNotFoundError({ userId: id }));
            }
            
            return user;
          }),

        findByEmail: (email) =>
          Effect.gen(function* () {
            yield* logOp("findByEmail", { email });
            const index = yield* Ref.get(emailIndex);
            const userId = index.get(email);
            
            if (!userId) {
              return yield* Effect.fail(
                new UserNotFoundError({ userId: UserId.make("unknown") })
              );
            }
            
            return yield* repository.findById(userId);
          }),

        save: (user) =>
          Effect.gen(function* () {
            yield* logOp("save", { userId: user.id, email: user.email });
            
            // Business rule: unique email constraint
            const index = yield* Ref.get(emailIndex);
            const existing = index.get(user.email);
            
            if (existing && existing !== user.id) {
              return yield* Effect.fail(
                new UserAlreadyExistsError({ email: user.email })
              );
            }
            
            // Atomic update of both stores
            yield* Ref.update(users, (m) => new Map(m).set(user.id, user));
            yield* Ref.update(emailIndex, (m) => new Map(m).set(user.email, user.id));
          }),

        update: (user) =>
          Effect.gen(function* () {
            yield* logOp("update", { userId: user.id });
            const map = yield* Ref.get(users);
            
            if (!map.has(user.id)) {
              return yield* Effect.fail(new UserNotFoundError({ userId: user.id }));
            }
            
            yield* Ref.update(users, (m) => new Map(m).set(user.id, user));
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* logOp("delete", { id });
            const map = yield* Ref.get(users);
            const user = map.get(id);
            
            if (!user) {
              return yield* Effect.fail(new UserNotFoundError({ userId: id }));
            }
            
            yield* Ref.update(users, (m) => {
              const newMap = new Map(m);
              newMap.delete(id);
              return newMap;
            });
            yield* Ref.update(emailIndex, (m) => {
              const newMap = new Map(m);
              newMap.delete(user.email);
              return newMap;
            });
          }),
      };

      // Inspection API (test-only, not part of production contract)
      const inspectionAPI = {
        // Queries
        getUserCount: () => Effect.map(Ref.get(users), (m) => m.size),
        getAllUsers: () => Effect.map(Ref.get(users), (m) => Array.from(m.values())),
        getOperationLog: () => Ref.get(operations),
        
        // State management
        clear: () =>
          Effect.gen(function* () {
            yield* Ref.set(users, new Map());
            yield* Ref.set(emailIndex, new Map());
            yield* Ref.set(operations, []);
          }),
        
        // Debugging
        exportState: () =>
          Effect.gen(function* () {
            return {
              users: yield* Ref.get(users),
              emailIndex: yield* Ref.get(emailIndex),
              operations: yield* Ref.get(operations),
            };
          }),
      };

      return {
        ...repository,
        ...inspectionAPI,
      };
    }),
  }
) {}

// Layer that provides the fake as the real service
export const UserRepositoryFakeLayer = Layer.effect(
  UserRepository,
  Effect.map(UserRepositoryFake, (fake) => ({
    findById: fake.findById,
    findByEmail: fake.findByEmail,
    save: fake.save,
    update: fake.update,
    delete: fake.delete,
  }))
).pipe(
  Layer.provideMerge(Layer.effect(UserRepositoryFake, UserRepositoryFake.make))
);
```

**Key principles for fakes:**
1. **Implement full semantics:** Handle all error cases like production would
2. **Make observable:** Add inspection APIs for verification
3. **Keep deterministic:** Use `Ref`, not external state
4. **Add instrumentation:** Log operations for debugging

### Step 5: Write Comprehensive Contract Tests

**Rationale:** Contract tests define the behavioral specification. ANY implementation must pass these tests.

```typescript
// services/UserRepository.contract.test.ts
import { it, assert, describe } from "@effect/vitest";

/**
 * Shared contract test suite that runs against ANY implementation
 */
export const runUserRepositoryContractTests = (
  description: string,
  makeLayer: () => Layer.Layer<UserRepository>
) => {
  describe(`UserRepository Contract: ${description}`, () => {
    const createTestUser = (overrides = {}) =>
      new User({
        id: UserId.make(`user-${crypto.randomUUID()}`),
        email: EmailAddress("test@example.com"),
        name: "Test User",
        age: 30,
        role: "user",
        createdAt: new Date(),
        ...overrides,
      });

    describe("Happy Path", () => {
      it.effect("should save and retrieve user by ID", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();

          yield* repo.save(user);
          const retrieved = yield* repo.findById(user.id);

          assert.deepStrictEqual(retrieved, user);
        }).pipe(Effect.provide(makeLayer()))
      );

      it.effect("should save and retrieve user by email", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();

          yield* repo.save(user);
          const retrieved = yield* repo.findByEmail(user.email);

          assert.deepStrictEqual(retrieved, user);
        }).pipe(Effect.provide(makeLayer()))
      );

      it.effect("should update existing user", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();

          yield* repo.save(user);

          const updated = new User({
            ...user,
            name: "Updated Name",
            updatedAt: new Date(),
          });
          yield* repo.update(updated);

          const retrieved = yield* repo.findById(user.id);
          assert.strictEqual(retrieved.name, "Updated Name");
          assert.isDefined(retrieved.updatedAt);
        }).pipe(Effect.provide(makeLayer()))
      );

      it.effect("should delete user", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();

          yield* repo.save(user);
          yield* repo.delete(user.id);

          const exit = yield* Effect.exit(repo.findById(user.id));
          assert.isTrue(Exit.isFailure(exit));
        }).pipe(Effect.provide(makeLayer()))
      );
    });

    describe("Error Cases", () => {
      it.effect("should fail with UserNotFoundError when user doesn't exist", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const exit = yield* Effect.exit(
            repo.findById(UserId.make("nonexistent"))
          );

          assert.isTrue(Exit.isFailure(exit));
          if (Exit.isFailure(exit)) {
            const error = Cause.failureOption(exit.cause);
            assert.isTrue(Option.isSome(error));
            if (Option.isSome(error)) {
              assert.instanceOf(error.value, UserNotFoundError);
              assert.strictEqual(
                error.value.userId,
                UserId.make("nonexistent")
              );
            }
          }
        }).pipe(Effect.provide(makeLayer()))
      );

      it.effect("should fail with UserAlreadyExistsError for duplicate email", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user1 = createTestUser({
            email: EmailAddress("duplicate@example.com"),
          });
          const user2 = createTestUser({
            id: UserId.make("different-id"),
            email: EmailAddress("duplicate@example.com"),
          });

          yield* repo.save(user1);
          const exit = yield* Effect.exit(repo.save(user2));

          assert.isTrue(Exit.isFailure(exit));
          if (Exit.isFailure(exit)) {
            const error = Cause.failureOption(exit.cause);
            assert.isTrue(Option.isSome(error));
            if (Option.isSome(error)) {
              assert.instanceOf(error.value, UserAlreadyExistsError);
            }
          }
        }).pipe(Effect.provide(makeLayer()))
      );

      it.effect("should fail update for nonexistent user", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();

          const exit = yield* Effect.exit(repo.update(user));

          assert.isTrue(Exit.isFailure(exit));
          if (Exit.isFailure(exit)) {
            const error = Cause.failureOption(exit.cause);
            assert.isTrue(Option.isSome(error));
            if (Option.isSome(error)) {
              assert.instanceOf(error.value, UserNotFoundError);
            }
          }
        }).pipe(Effect.provide(makeLayer()))
      );
    });

    describe("Concurrency & Invariants", () => {
      it.effect("should handle concurrent saves correctly", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;

          const users = Array.from({ length: 100 }, (_, i) =>
            createTestUser({
              id: UserId.make(`user-${i}`),
              email: EmailAddress(`user${i}@example.com`),
            })
          );

          // Save all concurrently
          yield* Effect.all(
            users.map((u) => repo.save(u)),
            { concurrency: "unbounded" }
          );

          // Verify all were saved
          const retrieved = yield* Effect.all(
            users.map((u) => repo.findById(u.id)),
            { concurrency: "unbounded" }
          );

          assert.strictEqual(retrieved.length, 100);
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.provide(TestContext.TestContext)
        )
      );

      it.effect("should maintain email uniqueness under concurrent operations", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;

          // Try to save 10 users with the same email concurrently
          const users = Array.from({ length: 10 }, (_, i) =>
            createTestUser({
              id: UserId.make(`user-${i}`),
              email: EmailAddress("same@example.com"),
            })
          );

          const results = yield* Effect.all(
            users.map((u) => Effect.either(repo.save(u))),
            { concurrency: "unbounded" }
          );

          // Exactly one should succeed
          const successes = results.filter(Either.isRight);
          const failures = results.filter(Either.isLeft);

          assert.strictEqual(successes.length, 1);
          assert.strictEqual(failures.length, 9);

          // All failures should be UserAlreadyExistsError
          failures.forEach((failure) => {
            assert.instanceOf(failure.left, UserAlreadyExistsError);
          });
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.provide(TestContext.TestContext)
        )
      );
    });

    describe("Property-Based Tests", () => {
      it.effect("should round-trip any valid user", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;

          yield* Effect.promise(() =>
            fc.assert(
              fc.asyncProperty(
                fc.record({
                  id: fc.uuid(),
                  email: fc.emailAddress(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  age: fc.integer({ min: 0, max: 150 }),
                  role: fc.constantFrom("admin", "user", "guest"),
                }),
                async (userData) => {
                  const user = new User({
                    id: UserId.make(userData.id),
                    email: EmailAddress(userData.email),
                    name: userData.name,
                    age: userData.age,
                    role: userData.role,
                    createdAt: new Date(),
                  });

                  yield* repo.save(user).pipe(
                    Effect.catchTag("UserAlreadyExistsError", () =>
                      Effect.void
                    )
                  );

                  const retrieved = yield* repo.findById(user.id).pipe(
                    Effect.option
                  );

                  if (Option.isSome(retrieved)) {
                    assert.deepStrictEqual(retrieved.value, user);
                  }
                }
              )
            )
          );
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.provide(TestContext.TestContext)
        )
      );
    });
  });
};

// Run contract tests against the fake
runUserRepositoryContractTests("Fake", () => UserRepositoryFakeLayer);
```

**Critical testing patterns:**
1. **Always use `Effect.exit`** to test failures - never rely on exceptions
2. **Test concurrency** with `Effect.all` and `{ concurrency: "unbounded" }`
3. **Use property-based testing** with `fast-check` for invariants
4. **Provide `TestContext.TestContext`** for deterministic time-based tests

### Step 6: Implement the Production Layer

**Rationale:** Now that the contract is validated with the fake, implement production. It MUST pass the same contract tests.

```typescript
// services/UserRepository.impl.ts
import { SqlClient } from "@effect/sql";

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    return UserRepository.of({
      findById: (id) =>
        sql
          .unsafe<User>(
            `SELECT * FROM users WHERE id = ?`,
            [id]
          )
          .pipe(
            Effect.flatMap((rows) =>
              rows.length === 0
                ? Effect.fail(new UserNotFoundError({ userId: id }))
                : Effect.succeed(rows[0])
            ),
            Effect.catchAll((error) =>
              Effect.fail(
                new DatabaseError({ operation: "findById", cause: error })
              )
            )
          ),

      findByEmail: (email) =>
        sql
          .unsafe<User>(
            `SELECT * FROM users WHERE email = ?`,
            [email]
          )
          .pipe(
            Effect.flatMap((rows) =>
              rows.length === 0
                ? Effect.fail(
                    new UserNotFoundError({ userId: UserId.make("unknown") })
                  )
                : Effect.succeed(rows[0])
            ),
            Effect.catchAll((error) =>
              Effect.fail(
                new DatabaseError({ operation: "findByEmail", cause: error })
              )
            )
          ),

      save: (user) =>
        sql
          .unsafe(
            `INSERT INTO users (id, email, name, age, role, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user.id, user.email, user.name, user.age, user.role, user.createdAt]
          )
          .pipe(
            Effect.catchAll((error: any) => {
              // PostgreSQL unique violation error code
              if (error.code === "23505") {
                return Effect.fail(
                  new UserAlreadyExistsError({ email: user.email })
                );
              }
              return Effect.fail(
                new DatabaseError({ operation: "save", cause: error })
              );
            }),
            Effect.asVoid
          ),

      update: (user) =>
        sql
          .unsafe(
            `UPDATE users 
             SET email = ?, name = ?, age = ?, role = ?, updated_at = ?
             WHERE id = ?`,
            [user.email, user.name, user.age, user.role, user.updatedAt, user.id]
          )
          .pipe(
            Effect.flatMap((result: any) =>
              result.rowsAffected === 0
                ? Effect.fail(new UserNotFoundError({ userId: user.id }))
                : Effect.void
            ),
            Effect.catchAll((error) =>
              Effect.fail(
                new DatabaseError({ operation: "update", cause: error })
              )
            )
          ),

      delete: (id) =>
        sql
          .unsafe(`DELETE FROM users WHERE id = ?`, [id])
          .pipe(
            Effect.flatMap((result: any) =>
              result.rowsAffected === 0
                ? Effect.fail(new UserNotFoundError({ userId: id }))
                : Effect.void
            ),
            Effect.catchAll((error) =>
              Effect.fail(
                new DatabaseError({ operation: "delete", cause: error })
              )
            )
          ),
    });
  })
);
```

**Now run the SAME contract tests against production:**

```typescript
// services/UserRepository.integration.test.ts

// Set up test database
const TestDatabaseLayer = Layer.effect(
  SqlClient.SqlClient,
  Effect.gen(function* () {
    // Use test database
    const client = yield* SqlClient.make({
      /* test DB config */
    });
    
    // Run migrations
    yield* runMigrations(client);
    
    return client;
  })
).pipe(Layer.scoped(Effect.acquireRelease(
  Effect.void,
  () => Effect.sync(() => {
    // Cleanup test database
  })
)));

// Run the EXACT SAME contract tests
runUserRepositoryContractTests("Production", () =>
  UserRepositoryLive.pipe(Layer.provide(TestDatabaseLayer))
);
```

**This is the magic:** The same contract tests validate both fake and production. If production passes, you know it's behaviorally equivalent to the fake.

### Step 7: Compose and Validate Layers

**Rationale:** Test that services compose correctly and maintain invariants.

```typescript
// layers/test.ts
export const TestLayer = Layer.mergeAll(
  UserRepositoryFakeLayer,
  EmailServiceFakeLayer,
  PaymentServiceFakeLayer
).pipe(
  Layer.provideMerge(UserService.Default),
  Layer.provideMerge(OrderService.Default)
);

// layers/test.test.ts
describe("Layer Composition", () => {
  it.effect("should provide all required services", () =>
    Effect.gen(function* () {
      // If this compiles and runs, dependencies are satisfied
      const userRepo = yield* UserRepository;
      const userService = yield* UserService;
      const orderService = yield* OrderService;

      assert.isDefined(userRepo);
      assert.isDefined(userService);
      assert.isDefined(orderService);
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should maintain service isolation", () =>
    Effect.gen(function* () {
      const userFake = yield* UserRepositoryFake;
      
      // Clear state
      yield* userFake.clear();
      
      // Use service
      const userService = yield* UserService;
      yield* userService.registerUser({
        email: "test@example.com",
        name: "Test",
        age: 25,
      });
      
      // Verify fake state
      const count = yield* userFake.getUserCount();
      assert.strictEqual(count, 1);
      
      // Clear again - services should be memoized (same instance)
      yield* userFake.clear();
      const countAfter = yield* userFake.getUserCount();
      assert.strictEqual(countAfter, 0);
    }).pipe(Effect.provide(TestLayer))
  );
});
```

## The Complete Validation Stack

Here's what catches bugs at each level:

```typescript
// Level 1: Compile-Time (Type System)
type UserId = string & Brand.Brand<"UserId">; // Can't mix up IDs

// Level 2: Parse-Time (Schema)
const user = Schema.decodeUnknown(User)(data); // Invalid data rejected

// Level 3: Contract-Time (Tests)
runUserRepositoryContractTests(layer); // Behavior validated

// Level 4: Integration-Time (Real I/O)
runUserRepositoryContractTests(ProductionLayer); // Production verified

// Level 5: Runtime (Observability)
Effect.provide(layer).pipe(
  Effect.withSpan("operation"),
  Effect.catchAllDefect((defect) => /* log and alert */)
);
```

## Development Workflow Summary

```
Day 1: Foundation
├─ Define errors (TaggedError)
├─ Define models (Schema.Class)
├─ Define service interface (Effect.Service)
└─ ✅ Checkpoint: Code compiles

Day 2-3: Contract + Fake
├─ Build rich fake with inspection APIs
├─ Write comprehensive contract tests
│  ├─ Happy paths
│  ├─ Error cases
│  ├─ Concurrency
│  └─ Properties
└─ ✅ Checkpoint: All contract tests pass with fake

Day 4-5: Production
├─ Implement production layer
├─ Run contract tests against production
└─ ✅ Checkpoint: Production passes all contracts

Day 6: Composition
├─ Compose all layers
├─ Test full workflows
└─ ✅ Checkpoint: Application works end-to-end

Day 7: Hardening
├─ Add chaos testing
├─ Add load testing
├─ Add observability
└─ ✅ Checkpoint: Production-ready
```

## Key Success Factors

### 1. Rich Fakes Are Essential
- **Not shortcuts** - they're production-quality reference implementations
- **Full semantics** - handle all error cases like production
- **Inspectable** - add debugging/assertion APIs
- **Deterministic** - use `Ref` and `TestContext` for reproducibility

### 2. Contract Tests Are the Specification
- **Implementation-agnostic** - test the interface, not internals
- **Exhaustive error coverage** - test every error in the error channel
- **Concurrency tests** - use `Effect.all` with unbounded concurrency
- **Property-based tests** - find edge cases automatically

### 3. The Type System Is Your Ally
- **Branded types** - make primitives meaningful
- **Schema validation** - parse, don't validate
- **Explicit error channels** - no surprises
- **Effect composition** - build complex from simple

### 4. Validate Incrementally
- **Never skip a layer** - each depends on correctness of previous
- **Run tests constantly** - `bun run typecheck && bun test`
- **Fail fast** - use `Effect.die` for contract violations
- **Build confidence** - advance only when green

## The Result: Fearless Development

With this approach, you get:

✅ **Compile-time correctness** - Type system prevents structural bugs
✅ **Contract correctness** - Tests validate behavior
✅ **Runtime correctness** - Schema validates data
✅ **Production confidence** - Same tests validate fake and production
✅ **Fast feedback** - Develop against fakes, instant startup
✅ **Full observability** - Fakes instrument everything
✅ **Fearless refactoring** - Tests are a safety net
✅ **Early bug detection** - Bugs caught at design time, not production

You're not just testing - you're **building a proof of correctness** layer by layer, and you can advance confidently because every abstraction is validated before the next is built.
