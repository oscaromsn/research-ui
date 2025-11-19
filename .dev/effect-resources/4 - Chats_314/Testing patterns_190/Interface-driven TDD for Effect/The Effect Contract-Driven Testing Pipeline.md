---
modified: 2025-10-20T17:47:08-03:00
---
# The Effect Contract-Driven Testing Pipeline

A systematic, phase-gated approach that extends Red-Green-Refactor for Effect applications. Each phase has clear entry/exit criteria and automated validation.

## The 7-Phase Diamond Pipeline

```
DESIGN     CONTRACT      RED        GREEN      REFACTOR   INTEGRATE   HARDEN
  🔷   →     🔵     →    🔴    →     🟢    →     🟡    →     🟣     →    ⚪
 Gray        Blue        Red       Green      Gold      Purple    Platinum
```

Each phase must be completed before moving to the next. **Never skip ahead.**

---

## Phase 1: DESIGN 🔷 (Gray Phase)

**Goal:** Model the domain and define all possible outcomes before writing any code.

### Entry Criteria
- [ ] Clear understanding of the feature requirements
- [ ] No code written yet

### Activities

#### 1.1: Design Error Domain
Think through **every way this can fail**. Errors are outcomes, not exceptions.

```typescript
// domain/errors/UserErrors.ts
import { Data } from "effect";

/**
 * User not found in the repository
 * Recovery: Return 404 or default value
 */
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: UserId;
  attemptedOperation: string;
}> {}

/**
 * User with this email already exists
 * Recovery: Return 409 or merge accounts
 */
export class UserAlreadyExistsError extends Data.TaggedError("UserAlreadyExistsError")<{
  email: EmailAddress;
  existingUserId: UserId;
}> {}

/**
 * Database operation failed
 * Recovery: Retry with exponential backoff
 */
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  cause: unknown;
  retryable: boolean;
}> {}
```

**Design Questions to Answer:**
- What can go wrong? (Define all error types)
- Is this error recoverable? (Tagged vs Die)
- What context is needed for debugging? (Error payload)
- What should the caller do? (Document recovery strategies)

#### 1.2: Design Data Models
Model the domain with **self-validating structures**.

```typescript
// domain/models/User.ts
import { Schema, Brand } from "effect";

// Step 1: Define branded primitives
export type UserId = string & Brand.Brand<"UserId">;
export const UserId = Brand.nominal<UserId>();

export type EmailAddress = string & Brand.Brand<"EmailAddress">;
export const EmailAddress = Brand.refined<EmailAddress>(
  (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),
  (s) => Brand.error(`Invalid email: ${s}`)
);

// Step 2: Define domain model
export class User extends Schema.Class<User>("User")({
  id: UserId,
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  name: Schema.NonEmptyString,
  age: Schema.Number.pipe(Schema.between(0, 150)),
  role: Schema.Literal("admin", "user", "guest"),
  status: Schema.Literal("active", "suspended", "deleted"),
  metadata: Schema.Record({
    key: Schema.String,
    value: Schema.Unknown,
  }),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.optional(Schema.DateTimeUtc),
}) {
  // Domain methods
  get isAdmin(): boolean {
    return this.role === "admin";
  }

  get canPerformAction(): boolean {
    return this.status === "active";
  }
}

export const parseUser = Schema.decodeUnknown(User);
```

**Design Questions to Answer:**
- What are the invariants? (Encoded in Schema)
- What are valid states? (Use Literal and enums)
- What operations are needed? (Domain methods)
- What's the cardinality? (Optional vs required)

#### 1.3: Design Service Contract
Define **what** the service does, not **how**.

```typescript
// services/UserRepository/UserRepository.ts
import { Effect } from "effect";

/**
 * UserRepository: Atomic persistence operations for User entities
 * 
 * Contract guarantees:
 * - findById returns UserNotFoundError if user doesn't exist
 * - save enforces unique email constraint
 * - All operations are atomic
 * - All operations are safe for concurrent use
 */
export class UserRepository extends Effect.Service<UserRepository>()(
  "app/UserRepository",
  {
    effect: Effect.gen(function* () {
      return {
        /**
         * Find user by ID
         * @returns User if found
         * @fails UserNotFoundError if not found
         * @fails DatabaseError if database operation fails
         */
        findById: (
          id: UserId
        ): Effect.Effect<User, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),

        /**
         * Find user by email address
         * @returns User if found
         * @fails UserNotFoundError if not found
         * @fails DatabaseError if database operation fails
         */
        findByEmail: (
          email: EmailAddress
        ): Effect.Effect<User, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),

        /**
         * Save a new user
         * @fails UserAlreadyExistsError if email already exists
         * @fails DatabaseError if database operation fails
         */
        save: (
          user: User
        ): Effect.Effect<void, UserAlreadyExistsError | DatabaseError> =>
          Effect.die("Not implemented"),

        /**
         * Update existing user
         * @fails UserNotFoundError if user doesn't exist
         * @fails DatabaseError if database operation fails
         */
        update: (
          user: User
        ): Effect.Effect<void, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),

        /**
         * Delete user by ID
         * @fails UserNotFoundError if user doesn't exist
         * @fails DatabaseError if database operation fails
         */
        delete: (
          id: UserId
        ): Effect.Effect<void, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),

        /**
         * List users with pagination
         * @fails DatabaseError if database operation fails
         */
        list: (
          limit: PositiveInt,
          offset: number
        ): Effect.Effect<Array<User>, DatabaseError> =>
          Effect.die("Not implemented"),
      };
    }),
  }
) {}
```

**Design Questions to Answer:**
- What are the atomic operations? (No business logic here)
- What can each operation return? (Success type)
- What can each operation fail with? (Error channel)
- What dependencies are needed? (Requirements channel)
- What are the contracts/guarantees? (JSDoc)

### Validation Steps

```bash
# Run validation script
bun run validate:design

# What it checks:
# ✓ All files compile
# ✓ No implementation code exists yet
# ✓ All error types are Data.TaggedError
# ✓ All models are Schema.Class
# ✓ All service methods use Effect.die("Not implemented")
```

**Validation Script:**

```typescript
// scripts/validate-design.ts
#!/usr/bin/env tsx
import { Effect } from "effect";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const validateDesign = Effect.gen(function* () {
  console.log("🔷 Validating Design Phase...\n");

  // Check 1: TypeScript compiles
  console.log("1. Checking TypeScript compilation...");
  execSync("tsc --noEmit", { stdio: "inherit" });
  console.log("   ✓ TypeScript compiles\n");

  // Check 2: No implementation files exist yet
  console.log("2. Checking for premature implementation...");
  const serviceDir = path.join(process.cwd(), "src/services");
  const services = fs.readdirSync(serviceDir);
  
  for (const service of services) {
    const implFile = path.join(serviceDir, service, `${service}.impl.ts`);
    if (fs.existsSync(implFile)) {
      throw new Error(
        `❌ Implementation file exists: ${implFile}\n` +
        `   Design phase should not have implementation files.`
      );
    }
  }
  console.log("   ✓ No premature implementations\n");

  // Check 3: All service methods use Effect.die
  console.log("3. Checking service contracts...");
  for (const service of services) {
    const contractFile = path.join(serviceDir, service, `${service}.ts`);
    if (fs.existsSync(contractFile)) {
      const content = fs.readFileSync(contractFile, "utf-8");
      const methodMatches = content.match(/Effect\.die\("Not implemented"\)/g);
      if (!methodMatches || methodMatches.length === 0) {
        throw new Error(
          `❌ Service ${service} must use Effect.die("Not implemented") for all methods`
        );
      }
    }
  }
  console.log("   ✓ All services properly stubbed\n");

  console.log("✅ Design Phase Complete!\n");
  console.log("Next: Run 'bun run start:contract' to begin Contract Phase");
});

Effect.runPromise(validateDesign).catch(() => process.exit(1));
```

### Exit Criteria
- [ ] ✅ All domain models compile
- [ ] ✅ All errors are defined as TaggedError
- [ ] ✅ All service interfaces are defined
- [ ] ✅ All service methods use `Effect.die("Not implemented")`
- [ ] ✅ JSDoc comments explain all contracts
- [ ] ✅ `bun run validate:design` passes

**Git Checkpoint:**

```bash
git add src/domain src/services/*/[ServiceName].ts
git commit -m "feat: Design [FeatureName] - domain models and contracts"
```

---

## Phase 2: CONTRACT 🔵 (Blue Phase)

**Goal:** Build a production-quality fake implementation and write comprehensive contract tests.

### Entry Criteria
- [ ] Design phase complete (`validate:design` passes)
- [ ] All contracts defined

### Activities

#### 2.1: Create Service Directory Structure

```bash
# Auto-generate service structure
bun run scaffold:service UserRepository

# Creates:
# services/UserRepository/
# ├── UserRepository.ts           (exists from design phase)
# ├── UserRepository.fake.ts      (created now)
# ├── UserRepository.contract.test.ts  (created now)
# ├── UserRepository.impl.ts      (stub only)
# └── index.ts                    (exports)
```

**Scaffold Script:**

```typescript
// scripts/scaffold-service.ts
#!/usr/bin/env tsx
import { Effect, Console } from "effect";
import * as fs from "fs";
import * as path from "path";

const scaffoldService = (serviceName: string) =>
  Effect.gen(function* () {
    const serviceDir = path.join(process.cwd(), "src/services", serviceName);

    // Create fake template
    const fakeTemplate = `// services/${serviceName}/${serviceName}.fake.ts
import { Effect, Layer, Ref, Clock, Data } from "effect";
import { ${serviceName} } from "./${serviceName}";

export class ${serviceName}Fake extends Effect.Service<${serviceName}Fake>()(
  "app/${serviceName}Fake",
  {
    effect: Effect.gen(function* () {
      // TODO: Add state management with Ref
      // TODO: Add operation logging
      // TODO: Implement service interface
      // TODO: Add inspection APIs

      const service = {
        // Implement interface methods here
      };

      const inspection = {
        // Add inspection methods here
        clear: () => Effect.void,
        exportState: () => Effect.succeed({}),
      };

      return {
        ...service,
        ...inspection,
      };
    }),
  }
) {}

export const ${serviceName}FakeLayer = Layer.effect(
  ${serviceName},
  Effect.map(${serviceName}Fake, (fake) => ({
    // Map to interface
  }))
).pipe(
  Layer.provideMerge(Layer.effect(${serviceName}Fake, ${serviceName}Fake.make))
);
`;

    yield* Effect.sync(() =>
      fs.writeFileSync(
        path.join(serviceDir, `${serviceName}.fake.ts`),
        fakeTemplate
      )
    );

    yield* Console.log(`✓ Created ${serviceName}.fake.ts`);

    // Create contract test template
    const contractTemplate = `// services/${serviceName}/${serviceName}.contract.test.ts
import { it, assert, describe } from "@effect/vitest";
import { Effect, Exit, Cause, Option, Layer } from "effect";
import { ${serviceName} } from "./${serviceName}";
import { ${serviceName}FakeLayer } from "./${serviceName}.fake";

export const run${serviceName}ContractTests = (
  description: string,
  makeLayer: () => Layer.Layer<${serviceName}>
) => {
  describe(\`${serviceName} Contract: \${description}\`, () => {
    describe("Happy Path", () => {
      // TODO: Add happy path tests
    });

    describe("Error Cases", () => {
      // TODO: Add error case tests
    });

    describe("Concurrency & Invariants", () => {
      // TODO: Add concurrency tests
    });
  });
};

// Run against fake
run${serviceName}ContractTests("Fake", () => ${serviceName}FakeLayer);
`;

    yield* Effect.sync(() =>
      fs.writeFileSync(
        path.join(serviceDir, `${serviceName}.contract.test.ts`),
        contractTemplate
      )
    );

    yield* Console.log(`✓ Created ${serviceName}.contract.test.ts`);
    yield* Console.log(`\n📝 Next steps:`);
    yield* Console.log(`   1. Implement fake in ${serviceName}.fake.ts`);
    yield* Console.log(`   2. Write contract tests in ${serviceName}.contract.test.ts`);
    yield* Console.log(`   3. Run: bun run test:watch services/${serviceName}`);
  });

const serviceName = process.argv[2];
if (!serviceName) {
  console.error("Usage: bun run scaffold:service <ServiceName>");
  process.exit(1);
}

Effect.runPromise(scaffoldService(serviceName));
```

#### 2.2: Build Rich Fake Implementation

Follow the **Fake Implementation Checklist**:

```typescript
// services/UserRepository/UserRepository.fake.ts
import { Effect, Layer, Ref, Clock } from "effect";
import { UserRepository } from "./UserRepository";

export class UserRepositoryFake extends Effect.Service<UserRepositoryFake>()(
  "app/UserRepositoryFake",
  {
    effect: Effect.gen(function* () {
      // ✅ 1. State Management
      const users = yield* Ref.make<Map<UserId, User>>(new Map());
      const emailIndex = yield* Ref.make<Map<EmailAddress, UserId>>(new Map());

      // ✅ 2. Observability
      const operations = yield* Ref.make
        Array<{
          type: string;
          timestamp: number;
          args: unknown;
          result: "success" | "failure";
        }>
      >([]);

      const logOp = (type: string, args: unknown, result: "success" | "failure") =>
        Effect.gen(function* () {
          const now = yield* Clock.currentTimeMillis;
          yield* Ref.update(operations, (ops) => [
            ...ops,
            { type, timestamp: now, args, result },
          ]);
        });

      // ✅ 3. Service Implementation (with full semantics)
      const repository = {
        findById: (id) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(users);
            const user = map.get(id);

            if (!user) {
              yield* logOp("findById", { id }, "failure");
              return yield* Effect.fail(
                new UserNotFoundError({
                  userId: id,
                  attemptedOperation: "findById",
                })
              );
            }

            yield* logOp("findById", { id }, "success");
            return user;
          }),

        save: (user) =>
          Effect.gen(function* () {
            // ✅ 4. Business Rules (unique email)
            const index = yield* Ref.get(emailIndex);
            const existing = index.get(user.email);

            if (existing && existing !== user.id) {
              yield* logOp("save", { userId: user.id }, "failure");
              return yield* Effect.fail(
                new UserAlreadyExistsError({
                  email: user.email,
                  existingUserId: existing,
                })
              );
            }

            // ✅ 5. Atomic Updates
            yield* Ref.update(users, (m) => new Map(m).set(user.id, user));
            yield* Ref.update(
              emailIndex,
              (m) => new Map(m).set(user.email, user.id)
            );

            yield* logOp("save", { userId: user.id }, "success");
          }),

        // ... other methods
      };

      // ✅ 6. Inspection API (test-only)
      const inspection = {
        getUserCount: () => Effect.map(Ref.get(users), (m) => m.size),

        getAllUsers: () =>
          Effect.map(Ref.get(users), (m) => Array.from(m.values())),

        getOperationLog: () => Ref.get(operations),

        getOperationStats: () =>
          Effect.map(Ref.get(operations), (ops) => ({
            total: ops.length,
            successful: ops.filter((o) => o.result === "success").length,
            failed: ops.filter((o) => o.result === "failure").length,
          })),

        clear: () =>
          Effect.gen(function* () {
            yield* Ref.set(users, new Map());
            yield* Ref.set(emailIndex, new Map());
            yield* Ref.set(operations, []);
          }),

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
        ...inspection,
      };
    }),
  }
) {}

// ✅ 7. Layer Construction
export const UserRepositoryFakeLayer = Layer.effect(
  UserRepository,
  Effect.map(UserRepositoryFake, (fake) => ({
    findById: fake.findById,
    findByEmail: fake.findByEmail,
    save: fake.save,
    update: fake.update,
    delete: fake.delete,
    list: fake.list,
  }))
).pipe(
  Layer.provideMerge(
    Layer.effect(UserRepositoryFake, UserRepositoryFake.make)
  )
);
```

**Fake Quality Checklist:**
- [ ] ✅ State management with `Ref`
- [ ] ✅ Operation logging for debugging
- [ ] ✅ Full semantic implementation (all error cases)
- [ ] ✅ Business rules enforced (e.g., unique constraints)
- [ ] ✅ Atomic operations
- [ ] ✅ Inspection APIs for testing
- [ ] ✅ Proper layer construction

#### 2.3: Write Comprehensive Contract Tests

Follow the **Contract Test Template**:

```typescript
// services/UserRepository/UserRepository.contract.test.ts
import { it, assert, describe } from "@effect/vitest";
import { Effect, Exit, Cause, Option, Either, TestContext } from "effect";
import * as fc from "fast-check";

export const runUserRepositoryContractTests = (
  description: string,
  makeLayer: () => Layer.Layer<UserRepository>
) => {
  describe(`UserRepository Contract: ${description}`, () => {
    // ✅ Test Category 1: Happy Path
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

      it.effect("should paginate users correctly", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const users = Array.from({ length: 25 }, (_, i) =>
            createTestUser({
              id: UserId.make(`user-${i}`),
              email: EmailAddress(`user${i}@example.com`),
            })
          );

          yield* Effect.all(users.map((u) => repo.save(u)));

          const page1 = yield* repo.list(PositiveInt(10), 0);
          const page2 = yield* repo.list(PositiveInt(10), 10);
          const page3 = yield* repo.list(PositiveInt(10), 20);

          assert.strictEqual(page1.length, 10);
          assert.strictEqual(page2.length, 10);
          assert.strictEqual(page3.length, 5);
        }).pipe(Effect.provide(makeLayer()))
      );
    });

    // ✅ Test Category 2: Error Cases (CRITICAL!)
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
              assert.strictEqual(error.value.email, user2.email);
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

      it.effect("should fail delete for nonexistent user", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const exit = yield* Effect.exit(
            repo.delete(UserId.make("nonexistent"))
          );

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

    // ✅ Test Category 3: Concurrency & Race Conditions
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

          yield* Effect.all(
            users.map((u) => repo.save(u)),
            { concurrency: "unbounded" }
          );

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

          const successes = results.filter(Either.isRight);
          const failures = results.filter(Either.isLeft);

          assert.strictEqual(successes.length, 1);
          assert.strictEqual(failures.length, 9);

          failures.forEach((failure) => {
            assert.instanceOf(failure.left, UserAlreadyExistsError);
          });
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.provide(TestContext.TestContext)
        )
      );

      it.effect("should handle concurrent updates to same user", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();

          yield* repo.save(user);

          // 50 concurrent updates
          const updates = Array.from({ length: 50 }, (_, i) =>
            new User({
              ...user,
              name: `Update ${i}`,
              updatedAt: new Date(),
            })
          );

          yield* Effect.all(
            updates.map((u) => repo.update(u)),
            { concurrency: "unbounded" }
          );

          // Final state should be consistent
          const final = yield* repo.findById(user.id);
          assert.isDefined(final);
          assert.isDefined(final.updatedAt);
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.provide(TestContext.TestContext)
        )
      );
    });

    // ✅ Test Category 4: Property-Based Tests
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
                    status: "active",
                    metadata: {},
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
              ),
              { numRuns: 100 }
            )
          );
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.provide(TestContext.TestContext)
        )
      );
    });

    // ✅ Test Category 5: Edge Cases
    describe("Edge Cases", () => {
      it.effect("should handle empty list", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const users = yield* repo.list(PositiveInt(10), 0);
          assert.strictEqual(users.length, 0);
        }).pipe(Effect.provide(makeLayer()))
      );

      it.effect("should handle pagination beyond available data", () =>
        Effect.gen(function* () {
          const repo = yield* UserRepository;
          const user = createTestUser();
          yield* repo.save(user);

          const users = yield* repo.list(PositiveInt(10), 100);
          assert.strictEqual(users.length, 0);
        }).pipe(Effect.provide(makeLayer()))
      );
    });
  });
};

// ✅ Run contract tests against fake
runUserRepositoryContractTests("Fake", () => UserRepositoryFakeLayer);
```

**Contract Test Checklist:**
- [ ] ✅ Happy path tests for all operations
- [ ] ✅ Error case tests for EVERY error in the error channel
- [ ] ✅ Concurrency tests with unbounded parallelism
- [ ] ✅ Property-based tests for invariants
- [ ] ✅ Edge case tests (empty, boundary conditions)
- [ ] ✅ Always use `Effect.exit` for failure testing
- [ ] ✅ Always provide `TestContext.TestContext` for time-based tests

### Validation Steps

```bash
# Run contract tests in watch mode
bun run test:watch services/UserRepository

# Run validation
bun run validate:contract

# What it checks:
# ✓ Fake implementation exists
# ✓ Contract tests exist
# ✓ All contract tests pass
# ✓ Test coverage > 90%
# ✓ Fake has inspection APIs
```

**Validation Script:**

```typescript
// scripts/validate-contract.ts
#!/usr/bin/env tsx
import { Effect, Console } from "effect";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const validateContract = Effect.gen(function* () {
  console.log("🔵 Validating Contract Phase...\n");

  // Check 1: All fakes exist
  console.log("1. Checking fake implementations...");
  const serviceDir = path.join(process.cwd(), "src/services");
  const services = fs.readdirSync(serviceDir).filter((f) =>
    fs.statSync(path.join(serviceDir, f)).isDirectory()
  );

  for (const service of services) {
    const fakeFile = path.join(serviceDir, service, `${service}.fake.ts`);
    if (!fs.existsSync(fakeFile)) {
      throw new Error(`❌ Missing fake: ${fakeFile}`);
    }

    // Check for inspection APIs
    const content = fs.readFileSync(fakeFile, "utf-8");
    if (!content.includes("clear:") || !content.includes("exportState:")) {
      throw new Error(
        `❌ ${service}.fake.ts missing inspection APIs (clear, exportState)`
      );
    }
  }
  console.log("   ✓ All fakes exist with inspection APIs\n");

  // Check 2: All contract tests exist
  console.log("2. Checking contract tests...");
  for (const service of services) {
    const testFile = path.join(
      serviceDir,
      service,
      `${service}.contract.test.ts`
    );
    if (!fs.existsSync(testFile)) {
      throw new Error(`❌ Missing contract test: ${testFile}`);
    }
  }
  console.log("   ✓ All contract tests exist\n");

  // Check 3: Run tests
  console.log("3. Running contract tests...");
  execSync("vitest run --testPathPattern=contract", { stdio: "inherit" });
  console.log("   ✓ All contract tests pass\n");

  // Check 4: Coverage
  console.log("4. Checking test coverage...");
  execSync("vitest run --coverage --testPathPattern=contract", {
    stdio: "inherit",
  });
  console.log("   ✓ Coverage meets threshold\n");

  console.log("✅ Contract Phase Complete!\n");
  console.log("Next: Contract tests are RED - begin Implementation Phase");
});

Effect.runPromise(validateContract).catch(() => process.exit(1));
```

### Exit Criteria
- [ ] ✅ Rich fake implementation complete
- [ ] ✅ Fake has inspection APIs (clear, exportState, etc.)
- [ ] ✅ Comprehensive contract tests written
- [ ] ✅ All test categories covered (happy, error, concurrency, properties, edge)
- [ ] ✅ `bun run validate:contract` passes
- [ ] ✅ Tests are RED (fake works, production not implemented)

**Git Checkpoint:**

```bash
git add src/services/*/[ServiceName].fake.ts
git add src/services/*/[ServiceName].contract.test.ts
git commit -m "feat: Contract tests for [ServiceName] with fake implementation"
```

---

## Phase 3: RED 🔴 (Red Phase)

**Goal:** Confirm that contract tests fail because production implementation doesn't exist.

### Entry Criteria
- [ ] Contract phase complete (`validate:contract` passes)
- [ ] Tests run and pass with fake

### Activities

#### 3.1: Run Tests Against Production (Should Fail)

```bash
# This should FAIL because production layer doesn't exist
bun run test:production
```

#### 3.2: Verify Test Failure is Correct

The tests should fail with `Effect.die("Not implemented")` errors, NOT:
- ❌ Compilation errors
- ❌ Missing dependencies
- ❌ Test framework errors

**Expected output:**

```
❌ UserRepository.impl.ts - findById
   Effect.die: Not implemented

❌ UserRepository.impl.ts - save  
   Effect.die: Not implemented

Tests: 0 passed, 15 failed
```

### Validation Steps

```bash
# Verify RED state
bun run validate:red

# What it checks:
# ✓ Contract tests exist
# ✓ Contract tests pass with fake
# ✗ Contract tests FAIL with production stub
# ✓ Failures are due to "Not implemented"
```

**Validation Script:**

```typescript
// scripts/validate-red.ts
#!/usr/bin/env tsx
import { Effect } from "effect";
import { execSync } from "child_process";

const validateRed = Effect.gen(function* () {
  console.log("🔴 Validating RED Phase...\n");

  // Check 1: Contract tests pass with fake
  console.log("1. Verifying contract tests pass with fake...");
  try {
    execSync("vitest run --testPathPattern=contract.test", {
      stdio: "inherit",
    });
    console.log("   ✓ Contract tests pass with fake\n");
  } catch {
    throw new Error("❌ Contract tests should pass with fake");
  }

  // Check 2: Production tests fail (expected)
  console.log("2. Verifying production tests fail (expected)...");
  try {
    execSync("vitest run --testPathPattern=integration.test", {
      stdio: "inherit",
    });
    throw new Error(
      "❌ Production tests should FAIL at this stage\n" +
        "   Production implementation should not exist yet."
    );
  } catch (error: any) {
    if (error.message.includes("should FAIL")) {
      throw error;
    }
    // Expected to fail
    console.log("   ✓ Production tests fail as expected\n");
  }

  console.log("✅ RED Phase Confirmed!\n");
  console.log("Tests are correctly failing. Ready to implement.");
  console.log("Next: Run 'bun run start:implement' to begin GREEN phase");
});

Effect.runPromise(validateRed).catch(() => process.exit(1));
```

### Exit Criteria
- [ ] ✅ Contract tests pass with fake
- [ ] ✅ Production tests FAIL (correct failures, not errors)
- [ ] ✅ Failure reason is "Not implemented"
- [ ] ✅ `bun run validate:red` confirms RED state

**No Git commit** - This is a validation checkpoint, not a deliverable.

---

## Phase 4: GREEN 🟢 (Green Phase)

**Goal:** Implement production layer to make contract tests pass. Minimum viable implementation.

### Entry Criteria
- [ ] RED phase validated
- [ ] Contract tests are failing correctly

### Activities

#### 4.1: Implement Production Layer

**Implementation Strategy: Contract-Driven Implementation**

```typescript
// services/UserRepository/UserRepository.impl.ts
import { Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { UserRepository } from "./UserRepository";

/**
 * Production implementation using PostgreSQL
 */
export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    return UserRepository.of({
      findById: (id) =>
        sql
          .unsafe<User>(`SELECT * FROM users WHERE id = $1`, [id])
          .pipe(
            Effect.flatMap((rows) =>
              rows.length === 0
                ? Effect.fail(
                    new UserNotFoundError({
                      userId: id,
                      attemptedOperation: "findById",
                    })
                  )
                : parseUser(rows[0])
            ),
            Effect.catchAll((error) => {
              // ParseError from schema = defect (our bug)
              if (error._tag === "ParseError") {
                return Effect.die(error);
              }
              // Database error = typed failure
              return Effect.fail(
                new DatabaseError({
                  operation: "findById",
                  cause: error,
                  retryable: true,
                })
              );
            })
          ),

      save: (user) =>
        sql
          .unsafe(
            `INSERT INTO users (id, email, name, age, role, status, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              user.id,
              user.email,
              user.name,
              user.age,
              user.role,
              user.status,
              JSON.stringify(user.metadata),
              user.createdAt,
            ]
          )
          .pipe(
            Effect.catchAll((error: any) => {
              // PostgreSQL unique violation
              if (error.code === "23505") {
                return Effect.fail(
                  new UserAlreadyExistsError({
                    email: user.email,
                    existingUserId: UserId.make("unknown"),
                  })
                );
              }
              return Effect.fail(
                new DatabaseError({
                  operation: "save",
                  cause: error,
                  retryable: false,
                })
              );
            }),
            Effect.asVoid
          ),

      // Implement other methods...
    });
  })
);
```

**Implementation Checklist:**
- [ ] ✅ Implement ALL interface methods
- [ ] ✅ Handle ALL errors in the error channel
- [ ] ✅ Use `Effect.die` for defects (schema parse errors)
- [ ] ✅ Use `Effect.fail` for expected failures
- [ ] ✅ Map database-specific errors to domain errors
- [ ] ✅ Add proper error context
- [ ] ✅ Keep logic minimal (make tests pass, nothing more)

#### 4.2: Run Contract Tests Against Production

```bash
# Run the SAME contract tests against production
bun run test:production:watch
```

**Create production integration test:**

```typescript
// services/UserRepository/UserRepository.integration.test.ts
import { runUserRepositoryContractTests } from "./UserRepository.contract.test";
import { UserRepositoryLive } from "./UserRepository.impl";
import { TestDatabaseLayer } from "../../infrastructure/database/test";

// Run the EXACT SAME contract tests
runUserRepositoryContractTests("Production", () =>
  UserRepositoryLive.pipe(Layer.provide(TestDatabaseLayer))
);
```

#### 4.3: Iterate Until Green

**TDD Loop:**

```
1. Run tests
2. See failure
3. Write minimal code to fix
4. Repeat until all tests pass
```

**Common failure patterns:**

```typescript
// ❌ Pattern 1: Database error not mapped to domain error
if (error.code === "23505") {
  throw error; // Wrong! Use Effect.fail
}

// ✅ Fix
if (error.code === "23505") {
  return Effect.fail(new UserAlreadyExistsError({ ... }));
}

// ❌ Pattern 2: Schema parse error not handled
const user = rows[0]; // Might not match User schema

// ✅ Fix
const user = yield* parseUser(rows[0]); // Will die on parse error (defect)

// ❌ Pattern 3: Missing error handling
return sql.unsafe(...); // Database errors not caught

// ✅ Fix
return sql.unsafe(...).pipe(
  Effect.catchAll((error) =>
    Effect.fail(new DatabaseError({ ... }))
  )
);
```

### Validation Steps

```bash
# Run validation
bun run validate:green

# What it checks:
# ✓ Production implementation exists
# ✓ All contract tests pass with fake
# ✓ All contract tests pass with production
# ✓ No test changes since RED phase
# ✓ Implementation follows patterns
```

**Validation Script:**

```typescript
// scripts/validate-green.ts
#!/usr/bin/env tsx
import { Effect } from "effect";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const validateGreen = Effect.gen(function* () {
  console.log("🟢 Validating GREEN Phase...\n");

  // Check 1: Production implementations exist
  console.log("1. Checking production implementations...");
  const serviceDir = path.join(process.cwd(), "src/services");
  const services = fs.readdirSync(serviceDir).filter((f) =>
    fs.statSync(path.join(serviceDir, f)).isDirectory()
  );

  for (const service of services) {
    const implFile = path.join(serviceDir, service, `${service}.impl.ts`);
    if (!fs.existsSync(implFile)) {
      throw new Error(`❌ Missing implementation: ${implFile}`);
    }

    // Check that Effect.die("Not implemented") is gone
    const content = fs.readFileSync(implFile, "utf-8");
    if (content.includes('Effect.die("Not implemented")')) {
      throw new Error(
        `❌ ${service}.impl.ts still has "Not implemented" stubs`
      );
    }
  }
  console.log("   ✓ All production implementations exist\n");

  // Check 2: Contract tests still pass with fake
  console.log("2. Verifying contract tests pass with fake...");
  execSync("vitest run --testPathPattern=contract.test", { stdio: "inherit" });
  console.log("   ✓ Contract tests pass with fake\n");

  // Check 3: Production tests now pass
  console.log("3. Verifying production tests pass...");
  execSync("vitest run --testPathPattern=integration.test", {
    stdio: "inherit",
  });
  console.log("   ✓ Production tests pass\n");

  // Check 4: No test changes
  console.log("4. Verifying test stability...");
  const gitDiff = execSync("git diff --name-only src/services/*/*.test.ts", {
    encoding: "utf-8",
  });
  if (gitDiff.trim().length > 0) {
    console.warn(
      "⚠️  Warning: Contract tests were modified during implementation\n" +
        "   Contract tests should remain unchanged from RED to GREEN phase."
    );
  } else {
    console.log("   ✓ Contract tests unchanged\n");
  }

  console.log("✅ GREEN Phase Complete!\n");
  console.log("All tests are passing. Ready to refactor.");
  console.log("Next: Run 'bun run start:refactor' for GOLD phase");
});

Effect.runPromise(validateGreen).catch(() => process.exit(1));
```

### Exit Criteria
- [ ] ✅ Production implementation complete
- [ ] ✅ All contract tests pass with fake
- [ ] ✅ All contract tests pass with production
- [ ] ✅ No `Effect.die("Not implemented")` remaining
- [ ] ✅ Contract tests unchanged from RED phase
- [ ] ✅ `bun run validate:green` passes

**Git Checkpoint:**

```bash
git add src/services/*/[ServiceName].impl.ts
git add src/services/*/[ServiceName].integration.test.ts
git commit -m "feat: Production implementation for [ServiceName]"
```

---

## Phase 5: REFACTOR 🟡 (Gold Phase)

**Goal:** Optimize implementation while maintaining test coverage. Polish for production.

### Entry Criteria
- [ ] GREEN phase complete
- [ ] All tests passing

### Activities

#### 5.1: Refactor for Quality

**Refactoring Checklist:**

```typescript
// ✅ Extract complex queries
const findByIdQuery = (id: UserId) => sql`
  SELECT id, email, name, age, role, status, metadata, created_at, updated_at
  FROM users
  WHERE id = ${id}
`;

// ✅ Add helper functions
const parseUserRow = (row: unknown) =>
  parseUser(row).pipe(
    Effect.catchAll((error) => Effect.die(error)) // Parse errors are defects
  );

// ✅ Add retry logic
const withRetry = <A, E>(effect: Effect.Effect<A, E>) =>
  effect.pipe(
    Effect.retry({
      schedule: Schedule.exponential(Duration.millis(100)),
      times: 3,
    })
  );

// ✅ Add observability
const withMetrics = <A, E>(
  operation: string,
  effect: Effect.Effect<A, E>
) =>
  effect.pipe(
    Effect.withSpan(`UserRepository.${operation}`),
    Effect.tap(() => Effect.log(`${operation} completed`))
  );

// Apply refactorings
export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    return UserRepository.of({
      findById: (id) =>
        findByIdQuery(id)
          .pipe(
            Effect.flatMap((rows) =>
              rows.length === 0
                ? Effect.fail(
                    new UserNotFoundError({
                      userId: id,
                      attemptedOperation: "findById",
                    })
                  )
                : parseUserRow(rows[0])
            ),
            withRetry,
            withMetrics("findById")
          ),

      // Other methods...
    });
  })
);
```

**Refactoring Patterns:**
- [ ] ✅ Extract common patterns
- [ ] ✅ Add observability (tracing, logging)
- [ ] ✅ Add retry logic where appropriate
- [ ] ✅ Optimize queries
- [ ] ✅ Add connection pooling configuration
- [ ] ✅ Improve error messages
- [ ] ✅ Add JSDoc comments
- [ ] ✅ Remove duplication

#### 5.2: Run Tests After Each Refactoring

```bash
# Run tests in watch mode
bun run test:watch services/UserRepository

# After EACH refactoring:
# 1. Save file
# 2. Wait for tests to run
# 3. Verify all tests still pass
# 4. If tests fail, undo and try again
```

**Critical Rule: Tests must remain green throughout refactoring.**

#### 5.3: Add Non-Functional Tests

Now that functional correctness is proven, add quality tests:

```typescript
// services/UserRepository/UserRepository.performance.test.ts
describe("UserRepository Performance", () => {
  it.effect("should handle 1000 concurrent reads", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository;
      const user = createTestUser();
      yield* repo.save(user);

      const start = yield* Clock.currentTimeMillis;

      yield* Effect.all(
        Array.from({ length: 1000 }, () => repo.findById(user.id)),
        { concurrency: 50 }
      );

      const duration = (yield* Clock.currentTimeMillis) - start;

      assert.isBelow(duration, 5000); // < 5 seconds
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should maintain throughput under load", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository;

      const users = Array.from({ length: 1000 }, (_, i) =>
        createTestUser({
          id: UserId.make(`user-${i}`),
          email: EmailAddress(`user${i}@example.com`),
        })
      );

      const start = yield* Clock.currentTimeMillis;

      yield* Effect.all(
        users.map((u) => repo.save(u)),
        { concurrency: 20 }
      );

      const duration = (yield* Clock.currentTimeMillis) - start;
      const throughput = (users.length / duration) * 1000;

      yield* Effect.log(`Throughput: ${throughput.toFixed(2)} ops/sec`);
      assert.isAtLeast(throughput, 100); // At least 100 ops/sec
    }).pipe(Effect.provide(TestLayer))
  );
});
```

### Validation Steps

```bash
# Run validation
bun run validate:refactor

# What it checks:
# ✓ All tests still pass
# ✓ Code quality metrics improved
# ✓ Test coverage maintained
# ✓ Performance tests pass
# ✓ No new dependencies added without justification
```

**Validation Script:**

```typescript
// scripts/validate-refactor.ts
#!/usr/bin/env tsx
import { Effect } from "effect";
import { execSync } from "child_process";

const validateRefactor = Effect.gen(function* () {
  console.log("🟡 Validating REFACTOR Phase...\n");

  // Check 1: All tests still pass
  console.log("1. Verifying all tests pass...");
  execSync("vitest run", { stdio: "inherit" });
  console.log("   ✓ All tests pass\n");

  // Check 2: Code quality
  console.log("2. Checking code quality...");
  execSync("eslint src --max-warnings 0", { stdio: "inherit" });
  console.log("   ✓ No linting issues\n");

  // Check 3: Type safety
  console.log("3. Checking type safety...");
  execSync("tsc --noEmit --strict", { stdio: "inherit" });
  console.log("   ✓ Type-safe\n");

  // Check 4: Test coverage
  console.log("4. Checking test coverage...");
  execSync("vitest run --coverage", { stdio: "inherit" });
  console.log("   ✓ Coverage maintained\n");

  // Check 5: Performance benchmarks
  console.log("5. Running performance tests...");
  execSync("vitest run --testPathPattern=performance", {
    stdio: "inherit",
  });
  console.log("   ✓ Performance acceptable\n");

  console.log("✅ REFACTOR Phase Complete!\n");
  console.log("Code is optimized and all tests pass.");
  console.log("Next: Run 'bun run start:integrate' for INTEGRATE phase");
});

Effect.runPromise(validateRefactor).catch(() => process.exit(1));
```

### Exit Criteria
- [ ] ✅ All tests still passing
- [ ] ✅ Code quality improved (linting passes)
- [ ] ✅ Test coverage maintained or improved
- [ ] ✅ Performance tests pass
- [ ] ✅ Observability added (tracing, logging)
- [ ] ✅ `bun run validate:refactor` passes

**Git Checkpoint:**

```bash
git add src/services/*/[ServiceName].impl.ts
git add src/services/*/[ServiceName].performance.test.ts
git commit -m "refactor: Optimize [ServiceName] implementation"
```

---

## Phase 6: INTEGRATE 🟣 (Purple Phase)

**Goal:** Compose service into application layers and validate integration.

### Entry Criteria
- [ ] REFACTOR phase complete
- [ ] Service fully implemented and tested

### Activities

#### 6.1: Add Service to Development Layer

```typescript
// layers/development.ts
import { Layer } from "effect";
import { UserRepositoryFakeLayer } from "../services/UserRepository";
// ... other imports

export const DevelopmentLayer = Layer.mergeAll(
  UserRepositoryFakeLayer, // ← Add new service here
  EmailServiceFakeLayer,
  PaymentServiceFakeLayer,
  // ... other services
);
```

#### 6.2: Add Service to Production Layer

```typescript
// layers/production.ts
import { Layer } from "effect";
import { UserRepositoryLive } from "../services/UserRepository";
// ... other imports

export const ProductionLayer = Layer.mergeAll(
  DatabaseLayer,           // Infrastructure first
  UserRepositoryLive,      // ← Add new service here
  EmailServiceLive,
  PaymentServiceLive,
  // ... other services
);
```

#### 6.3: Test Layer Composition

```typescript
// layers/development.test.ts
describe("Development Layer Composition", () => {
  it.effect("should provide UserRepository", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository;
      assert.isDefined(repo);

      // Verify it's the fake
      const fake = yield* UserRepositoryFake;
      assert.isDefined(fake.clear); // Inspection API only exists on fake
    }).pipe(Effect.provide(DevelopmentLayer))
  );

  it.effect("should handle service dependencies", () =>
    Effect.gen(function* () {
      // If this compiles, dependencies are satisfied
      const userService = yield* UserService;
      const orderService = yield* OrderService;

      assert.isDefined(userService);
      assert.isDefined(orderService);
    }).pipe(Effect.provide(DevelopmentLayer))
  );

  it.effect("should maintain service isolation", () =>
    Effect.gen(function* () {
      const fake1 = yield* UserRepositoryFake;
      yield* fake1.clear();

      const user = createTestUser();
      const repo = yield* UserRepository;
      yield* repo.save(user);

      // Verify same instance (memoized)
      const count1 = yield* fake1.getUserCount();
      assert.strictEqual(count1, 1);
    }).pipe(Effect.provide(DevelopmentLayer))
  );
});

// layers/production.test.ts
describe("Production Layer Composition", () => {
  it.effect("should provide all production services", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository;
      const emailService = yield* EmailService;
      const paymentService = yield* PaymentService;

      assert.isDefined(repo);
      assert.isDefined(emailService);
      assert.isDefined(paymentService);
    }).pipe(Effect.provide(ProductionLayer))
  );

  it.effect("should connect to real database", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository;
      const user = createTestUser();

      yield* repo.save(user);
      const retrieved = yield* repo.findById(user.id);

      assert.deepStrictEqual(retrieved, user);
    }).pipe(Effect.provide(ProductionLayer))
  );
});
```

#### 6.4: Test Workflows Using New Service

```typescript
// workflows/UserOnboarding.test.ts
describe("User Onboarding Workflow", () => {
  it.effect("should complete onboarding flow", () =>
    Effect.gen(function* () {
      const result = yield* userOnboardingWorkflow({
        email: "newuser@example.com",
        name: "New User",
        age: 25,
        address: createTestAddress(),
      });

      assert.strictEqual(result.user.email, "newuser@example.com");
      assert.instanceOf(result.order, ShippedOrder);
    }).pipe(Effect.provide(DevelopmentLayer))
  );
});
```

### Validation Steps

```bash
# Run validation
bun run validate:integrate

# What it checks:
# ✓ Service added to both dev and prod layers
# ✓ Layer composition tests pass
# ✓ No circular dependencies
# ✓ Service properly memoized
# ✓ Workflows using service work
```

**Validation Script:**

```typescript
// scripts/validate-integrate.ts
#!/usr/bin/env tsx
import { Effect } from "effect";
import { execSync } from "child_process";
import * as fs from "fs";

const validateIntegrate = Effect.gen(function* () {
  console.log("🟣 Validating INTEGRATE Phase...\n");

  // Check 1: Service in development layer
  console.log("1. Checking development layer...");
  const devLayer = fs.readFileSync("src/layers/development.ts", "utf-8");
  if (!devLayer.includes("FakeLayer")) {
    throw new Error("❌ New service not added to DevelopmentLayer");
  }
  console.log("   ✓ Service in development layer\n");

  // Check 2: Service in production layer
  console.log("2. Checking production layer...");
  const prodLayer = fs.readFileSync("src/layers/production.ts", "utf-8");
  if (!prodLayer.includes("Live")) {
    throw new Error("❌ New service not added to ProductionLayer");
  }
  console.log("   ✓ Service in production layer\n");

  // Check 3: Layer composition tests
  console.log("3. Running layer composition tests...");
  execSync("vitest run layers", { stdio: "inherit" });
  console.log("   ✓ Layer composition tests pass\n");

  // Check 4: Workflow tests
  console.log("4. Running workflow tests...");
  execSync("vitest run workflows", { stdio: "inherit" });
  console.log("   ✓ Workflow tests pass\n");

  // Check 5: No circular dependencies
  console.log("5. Checking for circular dependencies...");
  execSync("madge --circular src", { stdio: "inherit" });
  console.log("   ✓ No circular dependencies\n");

  console.log("✅ INTEGRATE Phase Complete!\n");
  console.log("Service integrated into application layers.");
  console.log("Next: Run 'bun run start:harden' for HARDEN phase");
});

Effect.runPromise(validateIntegrate).catch(() => process.exit(1));
```

### Exit Criteria
- [ ] ✅ Service added to DevelopmentLayer
- [ ] ✅ Service added to ProductionLayer
- [ ] ✅ Layer composition tests pass
- [ ] ✅ Workflows using service work
- [ ] ✅ No circular dependencies
- [ ] ✅ `bun run validate:integrate` passes

**Git Checkpoint:**

```bash
git add src/layers/
git commit -m "feat: Integrate [ServiceName] into application layers"
```

---

## Phase 7: HARDEN ⚪ (Platinum Phase)

**Goal:** Validate production readiness through chaos, load, and E2E testing.

### Entry Criteria
- [ ] INTEGRATE phase complete
- [ ] Service fully integrated

### Activities

#### 7.1: Chaos Engineering

Test resilience under failure conditions:

```typescript
// test/chaos/service-failures.test.ts
import { ChaosConfig, makeChaosService } from "../helpers/chaos";

describe("Chaos: UserRepository", () => {
  const ChaosLayer = Layer.effect(
    UserRepository,
    makeChaosService(UserRepository, ["findById", "save", "update"])
  ).pipe(
    Layer.provide(
      Layer.succeed(ChaosConfig, {
        failureRate: 0.2, // 20% failure rate
        latencyMs: [100, 500],
        enabled: true,
      })
    )
  );

  it.effect("should handle intermittent failures with retry", () =>
    Effect.gen(function* () {
      const userService = yield* UserService;

      // Should eventually succeed despite chaos
      const user = yield* userService
        .registerUser({
          email: "chaos@example.com",
          name: "Chaos User",
          age: 25,
        })
        .pipe(
          Effect.retry({
            schedule: Schedule.exponential(Duration.millis(100)),
            times: 10,
          }),
          Effect.timeout(Duration.seconds(30))
        );

      assert.isDefined(user.id);
    }).pipe(Effect.provide(ChaosLayer), Effect.provide(TestContext.TestContext))
  );

  it.effect("should gracefully degrade on persistent failures", () =>
    Effect.gen(function* () {
      const ChaosLayerHighFailure = Layer.effect(
        UserRepository,
        makeChaosService(UserRepository, ["findById"])
      ).pipe(
        Layer.provide(
          Layer.succeed(ChaosConfig, {
            failureRate: 0.9, // 90% failure rate
            latencyMs: [100, 500],
            enabled: true,
          })
        )
      );

      const userService = yield* UserService;

      const exit = yield* Effect.exit(
        userService.getUserProfile(UserId.make("user-1")).pipe(
          Effect.retry({ times: 3 }),
          Effect.timeout(Duration.seconds(5))
        )
      );

      // Should fail gracefully, not crash
      assert.isTrue(Exit.isFailure(exit));
    }).pipe(
      Effect.provide(ChaosLayerHighFailure),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

#### 7.2: Load Testing

Validate performance under load:

```typescript
// test/load/concurrent-operations.test.ts
describe("Load: UserRepository", () => {
  it.effect("should handle 10,000 concurrent user registrations", () =>
    Effect.gen(function* () {
      const userService = yield* UserService;
      const start = yield* Clock.currentTimeMillis;

      const users = yield* Effect.all(
        Array.from({ length: 10_000 }, (_, i) =>
          userService.registerUser({
            email: `user${i}@example.com`,
            name: `User ${i}`,
            age: 20 + (i % 50),
          })
        ),
        { concurrency: 100 } // Controlled concurrency
      );

      const duration = (yield* Clock.currentTimeMillis) - start;
      const throughput = (users.length / duration) * 1000;

      yield* Effect.log(`Completed 10,000 registrations in ${duration}ms`);
      yield* Effect.log(`Throughput: ${throughput.toFixed(2)} ops/sec`);

      assert.strictEqual(users.length, 10_000);
      assert.isBelow(duration, 60_000); // < 60 seconds
      assert.isAtLeast(throughput, 150); // At least 150 ops/sec
    }).pipe(Effect.provide(DevelopmentLayer), Effect.provide(TestContext.TestContext))
  );

  it.effect("should maintain data consistency under load", () =>
    Effect.gen(function* () {
      const userService = yield* UserService;
      const userFake = yield* UserRepositoryFake;

      // 1000 concurrent operations on same user
      const userId = UserId.make("load-test-user");
      yield* userService.registerUser({
        email: "loadtest@example.com",
        name: "Load Test",
        age: 30,
      });

      yield* Effect.all(
        Array.from({ length: 1000 }, (_, i) =>
          userService.updateUserProfile(userId, {
            name: `Update ${i}`,
            age: 30 + (i % 20),
          })
        ),
        { concurrency: "unbounded" }
      );

      // Verify final state is consistent
      const user = yield* userService.getUserProfile(userId);
      assert.isDefined(user);
      assert.isDefined(user.updatedAt);

      // Verify operation count
      const stats = yield* userFake.getOperationStats();
      assert.isAtLeast(stats.total, 1001); // 1 save + 1000 updates
    }).pipe(Effect.provide(DevelopmentLayer), Effect.provide(TestContext.TestContext))
  );
});
```

#### 7.3: End-to-End Testing

Test complete user journeys:

```typescript
// test/e2e/user-journey.test.ts
describe("E2E: Complete User Journey", () => {
  it.effect("should complete full registration to purchase flow", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;

      // 1. Register user
      const registerResponse = yield* HttpClientRequest.post("/users").pipe(
        HttpClientRequest.jsonBody({
          email: "e2e@example.com",
          name: "E2E User",
          age: 30,
        }),
        client.execute,
        Effect.flatMap(HttpClientResponse.json),
        Effect.scoped
      );

      const userId = registerResponse.id;
      assert.isDefined(userId);

      // 2. Get user profile
      const profile = yield* HttpClientRequest.get(`/users/${userId}`).pipe(
        client.execute,
        Effect.flatMap(HttpClientResponse.json),
        Effect.scoped
      );

      assert.strictEqual(profile.email, "e2e@example.com");

      // 3. Place order
      const orderResponse = yield* HttpClientRequest.post("/orders").pipe(
        HttpClientRequest.jsonBody({
          customerId: userId,
          items: [{ productId: "prod-1", quantity: 2 }],
        }),
        client.execute,
        Effect.flatMap(HttpClientResponse.json),
        Effect.scoped
      );

      assert.isDefined(orderResponse.id);
      assert.strictEqual(orderResponse.status, "shipped");

      // 4. Verify order appears in history
      const orders = yield* HttpClientRequest.get(
        `/users/${userId}/orders`
      ).pipe(
        client.execute,
        Effect.flatMap(HttpClientResponse.json),
        Effect.scoped
      );

      assert.strictEqual(orders.length, 1);
      assert.strictEqual(orders[0].id, orderResponse.id);
    }).pipe(Effect.provide(DevelopmentLayer))
  );
});
```

### Validation Steps

```bash
# Run validation
bun run validate:harden

# What it checks:
# ✓ Chaos tests pass
# ✓ Load tests pass
# ✓ E2E tests pass
# ✓ Performance benchmarks met
# ✓ Error rate within acceptable limits
# ✓ Resource usage acceptable
```

**Validation Script:**

```typescript
// scripts/validate-harden.ts
#!/usr/bin/env tsx
import { Effect } from "effect";
import { execSync } from "child_process";

const validateHarden = Effect.gen(function* () {
  console.log("⚪ Validating HARDEN Phase...\n");

  // Check 1: Chaos tests
  console.log("1. Running chaos engineering tests...");
  execSync("vitest run test/chaos", { stdio: "inherit" });
  console.log("   ✓ Chaos tests pass\n");

  // Check 2: Load tests
  console.log("2. Running load tests...");
  execSync("vitest run test/load", { stdio: "inherit" });
  console.log("   ✓ Load tests pass\n");

  // Check 3: E2E tests
  console.log("3. Running E2E tests...");
  execSync("vitest run test/e2e", { stdio: "inherit" });
  console.log("   ✓ E2E tests pass\n");

  // Check 4: All tests
  console.log("4. Running complete test suite...");
  execSync("vitest run", { stdio: "inherit" });
  console.log("   ✓ All tests pass\n");

  // Check 5: Final validation
  console.log("5. Running full verification...");
  execSync("bun run verify", { stdio: "inherit" });
  console.log("   ✓ Full verification complete\n");

  console.log("✅ HARDEN Phase Complete!\n");
  console.log("🎉 Service is production-ready!");
  console.log("\nReadiness Checklist:");
  console.log("  ✓ Contract tests pass");
  console.log("  ✓ Integration tests pass");
  console.log("  ✓ Chaos tests pass");
  console.log("  ✓ Load tests pass");
  console.log("  ✓ E2E tests pass");
  console.log("  ✓ Performance benchmarks met");
  console.log("\nReady to deploy! 🚀");
});

Effect.runPromise(validateHarden).catch(() => process.exit(1));
```

### Exit Criteria
- [ ] ✅ Chaos tests pass
- [ ] ✅ Load tests pass
- [ ] ✅ E2E tests pass
- [ ] ✅ Performance benchmarks met
- [ ] ✅ Error handling verified under failure
- [ ] ✅ Resource usage acceptable
- [ ] ✅ `bun run validate:harden` passes

**Git Checkpoint:**

```bash
git add test/chaos test/load test/e2e
git commit -m "test: Add chaos, load, and E2E tests for [ServiceName]"
git tag -a "v1.0.0-[service-name]" -m "Production-ready: [ServiceName]"
git push --tags
```

---

## Automation & CI/CD Integration

### Package.json Scripts

```json
{
  "scripts": {
    "// Phase Scripts": "",
    "start:design": "tsx scripts/validate-design.ts",
    "start:contract": "tsx scripts/scaffold-service.ts",
    "start:implement": "vitest watch --testPathPattern=integration",
    "start:refactor": "vitest watch",
    "start:integrate": "vitest watch layers",
    "start:harden": "vitest run test/chaos test/load test/e2e",

    "// Validation Scripts": "",
    "validate:design": "tsx scripts/validate-design.ts",
    "validate:contract": "tsx scripts/validate-contract.ts",
    "validate:red": "tsx scripts/validate-red.ts",
    "validate:green": "tsx scripts/validate-green.ts",
    "validate:refactor": "tsx scripts/validate-refactor.ts",
    "validate:integrate": "tsx scripts/validate-integrate.ts",
    "validate:harden": "tsx scripts/validate-harden.ts",

    "// Development": "",
    "dev": "tsx scripts/dev.ts",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:production": "vitest run --testPathPattern=integration",
    "test:production:watch": "vitest watch --testPathPattern=integration",

    "// Quality Gates": "",
    "verify": "tsx scripts/verify.ts",
    "typecheck": "tsc --noEmit",
    "check": "eslint src --max-warnings 0",
    "format": "prettier --write src"
  }
}
```

### Git Hooks (Husky)

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run verification
bun run verify

# If verification passes, allow commit
echo "✅ All checks passed!"
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  validate-design:
    name: 🔷 Validate Design
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run validate:design

  validate-contract:
    name: 🔵 Validate Contract
    runs-on: ubuntu-latest
    needs: validate-design
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run validate:contract

  validate-red:
    name: 🔴 Validate RED
    runs-on: ubuntu-latest
    needs: validate-contract
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run validate:red

  validate-green:
    name: 🟢 Validate GREEN
    runs-on: ubuntu-latest
    needs: validate-red
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:production

  validate-refactor:
    name: 🟡 Validate REFACTOR
    runs-on: ubuntu-latest
    needs: validate-green
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run validate:refactor

  validate-integrate:
    name: 🟣 Validate INTEGRATE
    runs-on: ubuntu-latest
    needs: validate-refactor
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run validate:integrate

  validate-harden:
    name: ⚪ Validate HARDEN
    runs-on: ubuntu-latest
    needs: validate-integrate
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run validate:harden

  deploy:
    name: 🚀 Deploy
    runs-on: ubuntu-latest
    needs: validate-harden
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: echo "Deploy would happen here"
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│          Effect Contract-Driven TDD Pipeline                │
├─────────────────────────────────────────────────────────────┤
│ Phase 1: DESIGN 🔷                                          │
│   ├─ Define errors (TaggedError)                           │
│   ├─ Define models (Schema.Class)                          │
│   ├─ Define contracts (Effect.Service)                     │
│   └─ Validate: bun run validate:design                     │
├─────────────────────────────────────────────────────────────┤
│ Phase 2: CONTRACT 🔵                                        │
│   ├─ Build rich fake                                        │
│   ├─ Write contract tests                                   │
│   └─ Validate: bun run validate:contract                   │
├─────────────────────────────────────────────────────────────┤
│ Phase 3: RED 🔴                                             │
│   ├─ Verify tests fail correctly                           │
│   └─ Validate: bun run validate:red                        │
├─────────────────────────────────────────────────────────────┤
│ Phase 4: GREEN 🟢                                           │
│   ├─ Implement production layer                            │
│   ├─ Make all tests pass                                    │
│   └─ Validate: bun run validate:green                      │
├─────────────────────────────────────────────────────────────┤
│ Phase 5: REFACTOR 🟡                                        │
│   ├─ Optimize implementation                               │
│   ├─ Add observability                                      │
│   └─ Validate: bun run validate:refactor                   │
├─────────────────────────────────────────────────────────────┤
│ Phase 6: INTEGRATE 🟣                                       │
│   ├─ Add to layers                                          │
│   ├─ Test composition                                        │
│   └─ Validate: bun run validate:integrate                  │
├─────────────────────────────────────────────────────────────┤
│ Phase 7: HARDEN ⚪                                          │
│   ├─ Chaos testing                                          │
│   ├─ Load testing                                           │
│   ├─ E2E testing                                             │
│   └─ Validate: bun run validate:harden                     │
└─────────────────────────────────────────────────────────────┘

GOLDEN RULES:
1. Never skip a phase
2. Each phase must pass validation before advancing
3. Tests are the specification
4. Contract tests never change after RED
5. Always run verify before committing
```

---

This systematic pipeline ensures that every service goes through the same rigorous validation process, catching bugs at the earliest possible point and building confidence incrementally through multiple layers of automated validation.
