---
modified: 2025-10-27T20:26:01-03:00
---
# 🎲 Property-Based Testing Integration into the Pipeline

You're absolutely right - property-based tests are a critical part of the pipeline and deserve explicit integration. Here's how they fit into each phase:

---

## 📊 Property-Based Testing Strategy by Phase

```
Phase 1: DESIGN 🔵
  └─ Define invariants that will be tested

Phase 2: CONTRACT 🟢
  └─ Write property tests for interface contracts

Phase 3-4: RED/GREEN 🔴🟢
  └─ Property tests guide fake implementation

Phase 5: PRODUCTION 🟡
  └─ Property tests verify production equivalence

Phase 6: INTEGRATE 🔗
  └─ Property tests for cross-service invariants

Phase 7: HARDEN 💪
  └─ Property tests under chaos/load conditions
```

---

## Phase 1: DESIGN 🔵 (Enhanced with Invariants)

### Goal
Define contracts **AND** the invariants/laws that must hold.

### Updated Structure

```
domain/
├── models/
│   ├── _User.ts                          # Schema definition
│   ├── _User.test.ts                     # Basic unit tests
│   ├── _User.property.test.ts            # ⭐ Property-based tests
│   └── _User.invariants.md               # Document invariants
```

### Example: User Model with Invariants

#### _User.ts (Schema with Custom Arbitraries)

```typescript
// src/domain/models/_User.ts
import { Schema, Arbitrary, FastCheck } from "effect";

export class UserId extends Schema.String.pipe(
  Schema.brand("UserId"),
  Schema.annotations({
    // Custom arbitrary for realistic UUIDs
    arbitrary: () => FastCheck.uuid()
  })
) {}

export class EmailAddress extends Schema.String.pipe(
  Schema.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  Schema.brand("EmailAddress"),
  Schema.annotations({
    // Custom arbitrary for realistic emails
    arbitrary: () => FastCheck.emailAddress()
  })
) {}

export class User extends Schema.Class<User>("User")({
  id: UserId,
  email: EmailAddress,
  name: Schema.NonEmptyString.pipe(
    Schema.annotations({
      arbitrary: () => FastCheck.oneof(
        FastCheck.constant("Alice Johnson"),
        FastCheck.constant("Bob Smith"),
        FastCheck.constant("Carol Williams")
      )
    })
  ),
  age: Schema.Int.pipe(
    Schema.between(18, 120),
    Schema.annotations({
      // Most users are 25-45
      arbitrary: () => FastCheck.integer({ min: 18, max: 120 })
    })
  ),
  role: Schema.Literal("admin", "user", "guest").pipe(
    Schema.annotations({
      // 80% users, 10% admin, 10% guest
      arbitrary: () => FastCheck.frequency(
        { arbitrary: FastCheck.constant("user"), weight: 8 },
        { arbitrary: FastCheck.constant("admin"), weight: 1 },
        { arbitrary: FastCheck.constant("guest"), weight: 1 }
      )
    })
  ),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.optional(Schema.DateTimeUtc),
  metadata: Schema.optional(Schema.Record({ 
    key: Schema.String, 
    value: Schema.Unknown 
  }))
}) {}

// Helper for tests
export const UserArbitrary = Arbitrary.make(User);
```

#### _User.invariants.md (Document Invariants)

```markdown
# User Model Invariants

## Type-Level Invariants (Enforced by Schema)
1. `id` must be a valid UUID
2. `email` must match email pattern
3. `name` must be non-empty
4. `age` must be between 18 and 120
5. `role` must be one of: admin, user, guest
6. `createdAt` must be a valid UTC datetime

## Semantic Invariants (Must be tested)
1. **Immutability of ID**: `user.id` cannot change after creation
2. **Email uniqueness**: Two users cannot have the same email
3. **Creation ordering**: `createdAt <= updatedAt` (if updatedAt exists)
4. **Age consistency**: `age` should match calculated age from birthdate (if stored)
5. **Role privileges**: Admin users have superset of user privileges

## Round-Trip Properties
1. **Serialization**: `decode(encode(user)) = user`
2. **Persistence**: `load(save(user)) = user`
3. **Normalization**: Email stored as lowercase, name trimmed

## Laws (Algebraic Properties)
1. **Equality**: `user1.equals(user2)` is reflexive, symmetric, transitive
2. **Hash consistency**: `user1.equals(user2) => hash(user1) = hash(user2)`
```

#### _User.property.test.ts (Property-Based Tests)

```typescript
// src/domain/models/_User.property.test.ts
import { describe, it } from "@effect/vitest";
import { Effect, Equal, Hash } from "effect";
import { assert } from "@effect/vitest";
import { fc } from "@effect/vitest";
import { User, UserArbitrary, EmailAddress } from "./User";
import { Schema } from "effect";

describe("User - Property-Based Tests", () => {
  
  // Property 1: Round-trip serialization
  describe("Serialization Properties", () => {
    it.effect("encode/decode should be identity", () =>
      Effect.gen(function* () {
        yield* fc.assert(
          fc.asyncProperty(
            fc.effect(UserArbitrary),
            async (user) => {
              // Encode to JSON
              const encoded = yield* Schema.encode(User)(user);
              
              // Decode back
              const decoded = yield* Schema.decodeUnknown(User)(encoded);
              
              // Should be deeply equal
              assert.isTrue(Equal.equals(decoded, user));
            }
          ),
          { numRuns: 100 }
        );
      })
    );
    
    it.effect("multiple encode/decode cycles should be stable", () =>
      Effect.gen(function* () {
        yield* fc.assert(
          fc.asyncProperty(
            fc.effect(UserArbitrary),
            async (user) => {
              let current = user;
              
              // 10 encode/decode cycles
              for (let i = 0; i < 10; i++) {
                const encoded = yield* Schema.encode(User)(current);
                current = yield* Schema.decodeUnknown(User)(encoded);
              }
              
              assert.isTrue(Equal.equals(current, user));
            }
          ),
          { numRuns: 50 }
        );
      })
    );
  });
  
  // Property 2: Equality laws
  describe("Equality Laws", () => {
    it.effect("equality should be reflexive", () =>
      Effect.gen(function* () {
        yield* fc.assert(
          fc.asyncProperty(
            fc.effect(UserArbitrary),
            async (user) => {
              assert.isTrue(Equal.equals(user, user));
            }
          )
        );
      })
    );
    
    it.effect("equality should be symmetric", () =>
      Effect.gen(function* () {
        yield* fc.assert(
          fc.asyncProperty(
            fc.effect(UserArbitrary),
            fc.effect(UserArbitrary),
            async (user1, user2) => {
              const eq1 = Equal.equals(user1, user2);
              const eq2 = Equal.equals(user2, user1);
              assert.strictEqual(eq1, eq2);
            }
          )
        );
      })
    );
    
    it.effect("equality should be transitive", () =>
      Effect.gen(function* () {
        yield* fc.assert(
          fc.asyncProperty(
            fc.effect(UserArbitrary),
            fc.effect(UserArbitrary),
            fc.effect(UserArbitrary),
            async (a, b, c) => {
              if (Equal.equals(a, b) && Equal.equals(b, c)) {
                assert.isTrue(Equal.equals(a, c));
              }
            }
          )
        );
      })
    );
  });
  
  // Property 3: Hash consistency
  describe("Hash Consistency", () => {
    it.effect("equal objects should have equal hashes", () =>
      Effect.gen(function* () {
        yield* fc.assert(
          fc.asyncProperty(
            fc.effect(UserArbitrary),
            async (user) => {
              // Clone user
              const clone = new User({ ...user });
              
              if (Equal.equals(user, clone)) {
                assert.strictEqual(
                  Hash.hash(user),
                  Hash.hash(clone)
                );
              }
            }
          )
        );
      })
    );
  });
  
  // Property 4: Schema constraints
  describe("Schema Constraint Properties", () => {
    it.effect("age should always be in valid range", () =>
      Effect.gen(function* () {
        yield* fc.assert(
          fc.asyncProperty(
            fc.effect(UserArbitrary),
            async (user) => {
              assert.isTrue(user.age >= 18);
              assert.isTrue(user.age <= 120);
            }
          )
        );
      })
    );
    
    it.effect("email should always match pattern", () =>
      Effect.gen(function* () {
        yield* fc.assert(
          fc.asyncProperty(
            fc.effect(UserArbitrary),
            async (user) => {
              const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
              assert.isTrue(emailRegex.test(user.email));
            }
          )
        );
      })
    );
    
    it.effect("role should always be valid", () =>
      Effect.gen(function* () {
        yield* fc.assert(
          fc.asyncProperty(
            fc.effect(UserArbitrary),
            async (user) => {
              assert.isTrue(
                ["admin", "user", "guest"].includes(user.role)
              );
            }
          )
        );
      })
    );
  });
  
  // Property 5: Timestamp ordering
  describe("Timestamp Properties", () => {
    it.effect("updatedAt should be after createdAt if present", () =>
      Effect.gen(function* () {
        yield* fc.assert(
          fc.asyncProperty(
            fc.effect(UserArbitrary),
            async (user) => {
              if (user.updatedAt) {
                assert.isTrue(
                  user.updatedAt.getTime() >= user.createdAt.getTime()
                );
              }
            }
          )
        );
      })
    );
  });
});
```

### Exit Criteria (Enhanced)

```bash
# Validate design phase (includes property tests)
bun run validate:design
```

**What it checks:**
- ✅ Error definitions exist
- ✅ Model definitions exist with custom arbitraries
- ✅ Invariants documented
- ✅ **Property-based tests exist and pass**
- ✅ All files compile

---

## Phase 2: CONTRACT 🟢 (Enhanced with Property Tests)

### Goal
Write contract tests that include property-based tests for universal laws.

### Updated Structure

```
application/ports/repositories/
├── UserRepository.ts                        # Interface
├── UserRepository.contract.test.ts          # Example-based tests
├── UserRepository.property.test.ts          # ⭐ Property-based tests
├── UserRepository.fake.ts                   # Fake implementation
└── UserRepository.fake.test.ts              # Test the fake
```

### Example: UserRepository Property Tests

```typescript
// src/application/ports/repositories/UserRepository.property.test.ts
import { describe, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { assert } from "@effect/vitest";
import { fc } from "@effect/vitest";
import { UserRepository } from "./UserRepository";
import { User, UserArbitrary } from "@/domain/models";

/**
 * Property-based contract tests that MUST hold for ALL implementations
 */
export const runUserRepositoryPropertyTests = (
  name: string,
  makeLayer: () => Layer.Layer<UserRepository>
) => {
  describe(`UserRepository Properties - ${name}`, () => {
    
    // Property 1: Save/Load Round-Trip
    describe("Persistence Properties", () => {
      it.effect("save then findById should return identical user", () =>
        Effect.gen(function* () {
          yield* fc.assert(
            fc.asyncProperty(
              fc.effect(UserArbitrary),
              async (user) => {
                const repo = yield* UserRepository;
                
                yield* repo.save(user);
                const loaded = yield* repo.findById(user.id);
                
                assert.deepStrictEqual(loaded, user);
              }
            ),
            { numRuns: 100 }
          );
        }).pipe(Effect.provide(makeLayer()))
      );
      
      it.effect("multiple saves of same user should be idempotent", () =>
        Effect.gen(function* () {
          yield* fc.assert(
            fc.asyncProperty(
              fc.effect(UserArbitrary),
              async (user) => {
                const repo = yield* UserRepository;
                
                // First save
                yield* repo.save(user);
                const after1 = yield* repo.findById(user.id);
                
                // Delete and save again
                yield* repo.deleteById(user.id);
                yield* repo.save(user);
                const after2 = yield* repo.findById(user.id);
                
                // Should be identical
                assert.deepStrictEqual(after1, after2);
              }
            ),
            { numRuns: 50 }
          );
        }).pipe(Effect.provide(makeLayer()))
      );
    });
    
    // Property 2: Count Consistency
    describe("Count Properties", () => {
      it.effect("count should equal number of saved users", () =>
        Effect.gen(function* () {
          yield* fc.assert(
            fc.asyncProperty(
              fc.array(fc.effect(UserArbitrary), { minLength: 1, maxLength: 20 }),
              async (users) => {
                const repo = yield* UserRepository;
                
                // Save all users
                for (const user of users) {
                  yield* repo.save(user);
                }
                
                const count = yield* repo.count();
                assert.strictEqual(count, users.length);
              }
            ),
            { numRuns: 50 }
          );
        }).pipe(Effect.provide(makeLayer()))
      );
      
      it.effect("count should decrease after delete", () =>
        Effect.gen(function* () {
          yield* fc.assert(
            fc.asyncProperty(
              fc.array(fc.effect(UserArbitrary), { minLength: 2, maxLength: 10 }),
              async (users) => {
                const repo = yield* UserRepository;
                
                // Save all
                for (const user of users) {
                  yield* repo.save(user);
                }
                
                const countBefore = yield* repo.count();
                
                // Delete first user
                yield* repo.deleteById(users[0].id);
                
                const countAfter = yield* repo.count();
                assert.strictEqual(countAfter, countBefore - 1);
              }
            ),
            { numRuns: 50 }
          );
        }).pipe(Effect.provide(makeLayer()))
      );
    });
    
    // Property 3: List Pagination
    describe("Pagination Properties", () => {
      it.effect("list with limit should never exceed limit", () =>
        Effect.gen(function* () {
          yield* fc.assert(
            fc.asyncProperty(
              fc.array(fc.effect(UserArbitrary), { minLength: 1, maxLength: 50 }),
              fc.integer({ min: 1, max: 20 }),
              fc.integer({ min: 0, max: 10 }),
              async (users, limit, offset) => {
                const repo = yield* UserRepository;
                
                for (const user of users) {
                  yield* repo.save(user);
                }
                
                const result = yield* repo.list(limit, offset);
                assert.isTrue(result.length <= limit);
              }
            ),
            { numRuns: 50 }
          );
        }).pipe(Effect.provide(makeLayer()))
      );
      
      it.effect("concatenating pages should equal full list", () =>
        Effect.gen(function* () {
          yield* fc.assert(
            fc.asyncProperty(
              fc.array(fc.effect(UserArbitrary), { minLength: 10, maxLength: 20 }),
              async (users) => {
                const repo = yield* UserRepository;
                
                for (const user of users) {
                  yield* repo.save(user);
                }
                
                // Get full list
                const fullList = yield* repo.list(users.length, 0);
                
                // Get in pages of 5
                const page1 = yield* repo.list(5, 0);
                const page2 = yield* repo.list(5, 5);
                const page3 = yield* repo.list(5, 10);
                
                const concatenated = [...page1, ...page2, ...page3];
                
                // Should have same length (or more if users.length > 15)
                assert.isTrue(concatenated.length <= fullList.length);
              }
            ),
            { numRuns: 30 }
          );
        }).pipe(Effect.provide(makeLayer()))
      );
    });
    
    // Property 4: Delete Semantics
    describe("Delete Properties", () => {
      it.effect("deleting then finding should fail", () =>
        Effect.gen(function* () {
          yield* fc.assert(
            fc.asyncProperty(
              fc.effect(UserArbitrary),
              async (user) => {
                const repo = yield* UserRepository;
                
                yield* repo.save(user);
                yield* repo.deleteById(user.id);
                
                const exit = yield* Effect.exit(repo.findById(user.id));
                assert.isTrue(Exit.isFailure(exit));
              }
            ),
            { numRuns: 50 }
          );
        }).pipe(Effect.provide(makeLayer()))
      );
    });
    
    // Property 5: Concurrency Safety
    describe("Concurrency Properties", () => {
      it.effect("concurrent saves should not lose data", () =>
        Effect.gen(function* () {
          yield* fc.assert(
            fc.asyncProperty(
              fc.array(fc.effect(UserArbitrary), { minLength: 10, maxLength: 50 }),
              async (users) => {
                const repo = yield* UserRepository;
                
                // Save all concurrently
                yield* Effect.all(
                  users.map((u) => repo.save(u)),
                  { concurrency: "unbounded" }
                );
                
                const count = yield* repo.count();
                assert.strictEqual(count, users.length);
              }
            ),
            { numRuns: 30 }
          );
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.provide(TestContext.TestContext)
        )
      );
      
      it.effect("concurrent reads should be consistent", () =>
        Effect.gen(function* () {
          yield* fc.assert(
            fc.asyncProperty(
              fc.effect(UserArbitrary),
              async (user) => {
                const repo = yield* UserRepository;
                yield* repo.save(user);
                
                // Read 100 times concurrently
                const results = yield* Effect.all(
                  Array.from({ length: 100 }, () => repo.findById(user.id)),
                  { concurrency: "unbounded" }
                );
                
                // All should be identical
                results.forEach((result) => {
                  assert.deepStrictEqual(result, user);
                });
              }
            ),
            { numRuns: 20 }
          );
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.provide(TestContext.TestContext)
        )
      );
    });
  });
};
```

### Running Property Tests

```typescript
// At the end of UserRepository.property.test.ts

// Import the fake
import { UserRepositoryFakeLayer } from "./UserRepository.fake";

// Run property tests against fake
runUserRepositoryPropertyTests("Fake", () => UserRepositoryFakeLayer);
```

### Exit Criteria (Enhanced)

```bash
# Run all contract tests (example + property)
bun run test:contract

# Validate contract phase
bun run validate:contract
```

**What it checks:**
- ✅ Contract tests exist (example-based)
- ✅ **Property tests exist**
- ✅ **All property tests pass with fake**
- ✅ 100+ property runs per test
- ✅ No flaky tests

---

## Phase 5: PRODUCTION 🟡 (Verify with Property Tests)

### Goal
Prove production implementation is behaviorally equivalent to fake.

### Integration Test Structure

```
infrastructure/persistence/postgres/
├── UserRepositoryPostgres.ts
├── UserRepositoryPostgres.integration.test.ts   # Reuse ALL tests
└── UserRepositoryPostgres.property.test.ts      # ⭐ Or combined
```

### Example: Reusing Property Tests

```typescript
// src/infrastructure/persistence/postgres/UserRepositoryPostgres.integration.test.ts
import { 
  runUserRepositoryContractTests 
} from "@/application/ports/repositories/UserRepository.contract.test";
import { 
  runUserRepositoryPropertyTests 
} from "@/application/ports/repositories/UserRepository.property.test";
import { UserRepositoryPostgres } from "./UserRepositoryPostgres";
import { TestDatabaseLayer } from "@test/helpers/database";

// ⭐ Reuse example-based contract tests
runUserRepositoryContractTests(
  "Postgres",
  () => UserRepositoryPostgres.pipe(Layer.provide(TestDatabaseLayer))
);

// ⭐ Reuse property-based tests
runUserRepositoryPropertyTests(
  "Postgres",
  () => UserRepositoryPostgres.pipe(Layer.provide(TestDatabaseLayer))
);

// Add implementation-specific property tests
describe("UserRepositoryPostgres - Database Properties", () => {
  it.effect("should handle SQL injection attempts safely", () =>
    Effect.gen(function* () {
      yield* fc.assert(
        fc.asyncProperty(
          fc.effect(UserArbitrary),
          fc.string(), // Potentially malicious string
          async (user, maliciousString) => {
            const repo = yield* UserRepository;
            
            // Try to save user with SQL injection in name
            const userWithMalicious = new User({
              ...user,
              name: maliciousString || "fallback"
            });
            
            // Should either succeed or fail gracefully
            const exit = yield* Effect.exit(repo.save(userWithMalicious));
            
            if (Exit.isSuccess(exit)) {
              // If saved, should be retrievable
              const loaded = yield* repo.findById(userWithMalicious.id);
              assert.isDefined(loaded);
            }
          }
        ),
        { numRuns: 100 }
      );
    }).pipe(
      Effect.provide(UserRepositoryPostgres),
      Effect.provide(TestDatabaseLayer)
    )
  );
});
```

---

## Phase 6: INTEGRATE 🔗 (Cross-Service Properties)

### Goal
Test invariants that hold across multiple services.

### Example: Workflow Property Tests

```typescript
// test/integration/user-registration.property.test.ts
import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { assert } from "@effect/vitest";
import { fc } from "@effect/vitest";
import { RegisterUser } from "@/application/use-cases/users/RegisterUser";
import { UserRepository } from "@/application/ports/repositories/UserRepository";
import { EmailServiceFake } from "@/application/ports/services/EmailService.fake";
import { TestLayer } from "@/layers/test";
import { UserArbitrary } from "@/domain/models";

describe("User Registration - Property Tests", () => {
  it.effect("every registration should send exactly one email", () =>
    Effect.gen(function* () {
      yield* fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1 }),
            age: fc.integer({ min: 18, max: 120 })
          }),
          async (userData) => {
            const registerUser = yield* RegisterUser;
            const emailFake = yield* EmailServiceFake;
            
            // Clear state
            yield* emailFake.clear();
            
            // Register user
            const user = yield* registerUser(userData);
            
            // Verify exactly one email sent
            const emails = yield* emailFake.getSentEmails();
            assert.strictEqual(emails.length, 1);
            assert.strictEqual(emails[0].recipient, user.email);
          }
        ),
        { numRuns: 50 }
      );
    }).pipe(Effect.provide(TestLayer))
  );
  
  it.effect("failed registration should not send email", () =>
    Effect.gen(function* () {
      yield* fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.string(), // Invalid email
            name: fc.string(),
            age: fc.integer()
          }),
          async (userData) => {
            const registerUser = yield* RegisterUser;
            const emailFake = yield* EmailServiceFake;
            
            yield* emailFake.clear();
            
            const exit = yield* Effect.exit(registerUser(userData));
            
            if (Exit.isFailure(exit)) {
              // No email should be sent on failure
              const emails = yield* emailFake.getSentEmails();
              assert.strictEqual(emails.length, 0);
            }
          }
        ),
        { numRuns: 50 }
      );
    }).pipe(Effect.provide(TestLayer))
  );
  
  it.effect("registration should maintain user count consistency", () =>
    Effect.gen(function* () {
      yield* fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              name: fc.string({ minLength: 1 }),
              age: fc.integer({ min: 18, max: 120 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (usersData) => {
            const registerUser = yield* RegisterUser;
            const userRepo = yield* UserRepository;
            
            const initialCount = yield* userRepo.count();
            
            // Register all users
            for (const data of usersData) {
              yield* registerUser(data);
            }
            
            const finalCount = yield* userRepo.count();
            assert.strictEqual(finalCount, initialCount + usersData.length);
          }
        ),
        { numRuns: 30 }
      );
    }).pipe(Effect.provide(TestLayer))
  );
});
```

---

## Phase 7: HARDEN 💪 (Properties Under Stress)

### Goal
Verify properties hold under chaos, load, and adversarial conditions.

### Example: Chaos Property Tests

```typescript
// test/chaos/user-repository.chaos.property.test.ts
import { describe, it } from "@effect/vitest";
import { Effect, Schedule, Duration } from "effect";
import { assert } from "@effect/vitest";
import { fc } from "@effect/vitest";
import { UserRepository } from "@/application/ports/repositories/UserRepository";
import { makeChaosLayer } from "@test/helpers/chaos";
import { UserArbitrary } from "@/domain/models";

describe("UserRepository - Chaos Property Tests", () => {
  const ChaosLayer = makeChaosLayer({
    failureRate: 0.3,
    latencyMs: [100, 2000],
    enabled: true
  });
  
  it.effect("save/load should eventually succeed with retry", () =>
    Effect.gen(function* () {
      yield* fc.assert(
        fc.asyncProperty(
          fc.effect(UserArbitrary),
          async (user) => {
            const repo = yield* UserRepository;
            
            // Should eventually succeed despite chaos
            yield* repo.save(user).pipe(
              Effect.retry({
                times: 10,
                schedule: Schedule.exponential(Duration.millis(100))
              })
            );
            
            const loaded = yield* repo.findById(user.id).pipe(
              Effect.retry({
                times: 10,
                schedule: Schedule.exponential(Duration.millis(100))
              })
            );
            
            assert.deepStrictEqual(loaded, user);
          }
        ),
        { numRuns: 20 }
      );
    }).pipe(
      Effect.provide(ChaosLayer),
      Effect.provide(TestContext.TestContext)
    )
  );
  
  it.effect("count should remain consistent under chaos", () =>
    Effect.gen(function* () {
      yield* fc.assert(
        fc.asyncProperty(
          fc.array(fc.effect(UserArbitrary), { minLength: 5, maxLength: 15 }),
          async (users) => {
            const repo = yield* UserRepository;
            
            // Save all with retries
            for (const user of users) {
              yield* repo.save(user).pipe(
                Effect.retry({ times: 5 }),
                Effect.ignore // Ignore final failures
              );
            }
            
            // Count should be consistent (with retries)
            const count = yield* repo.count().pipe(
              Effect.retry({ times: 5 })
            );
            
            // Count should be <= users.length (some may have failed)
            assert.isTrue(count <= users.length);
          }
        ),
        { numRuns: 10 }
      );
    }).pipe(
      Effect.provide(ChaosLayer),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

---

## 📋 Updated Validation Scripts

### scripts/validate-phase.ts (Enhanced)

```typescript
const validateContract = Effect.gen(function* () {
  yield* Console.log("🟢 CONTRACT Phase Validation\n");
  
  yield* Console.log("✓ Checking contract tests...");
  run("vitest run --testPathPattern='\\.contract\\.test\\.ts$'");
  
  yield* Console.log("✓ Running property-based tests...");
  run("vitest run --testPathPattern='\\.property\\.test\\.ts$'");
  
  yield* Console.log("\n✅ CONTRACT Phase Complete! Ready for RED phase.\n");
});

const validateProduction = Effect.gen(function* () {
  yield* Console.log("🟡 PRODUCTION Phase Validation\n");
  
  yield* Console.log("✓ Running example-based contract tests...");
  run("vitest run --testPathPattern='\\.integration\\.test\\.ts$'");
  
  yield* Console.log("✓ Running property-based tests...");
  run("vitest run --testPathPattern='infrastructure.*\\.property\\.test\\.ts$'");
  
  yield* Console.log("\n✅ PRODUCTION Phase Complete!\n");
});

const validateHarden = Effect.gen(function* () {
  yield* Console.log("💪 HARDEN Phase Validation\n");
  
  yield* Console.log("✓ Running chaos tests...");
  run("vitest run test/chaos");
  
  yield* Console.log("✓ Running chaos property tests...");
  run("vitest run --testPathPattern='chaos.*\\.property\\.test\\.ts$'");
  
  yield* Console.log("✓ Running load tests...");
  run("vitest run test/load");
  
  yield* Console.log("✓ Running E2E tests...");
  run("vitest run test/e2e");
  
  yield* Console.log("\n✅ HARDEN Phase Complete!\n");
});
```

### package.json (Enhanced)

```json
{
  "scripts": {
    "// Testing": "",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:unit": "vitest run --testPathPattern='\\.(test)\\.ts$'",
    "test:contract": "vitest run --testPathPattern='\\.contract\\.test\\.ts$'",
    "test:property": "vitest run --testPathPattern='\\.property\\.test\\.ts$'",
    "test:integration": "vitest run --testPathPattern='\\.integration\\.test\\.ts$'",
    "test:chaos": "vitest run test/chaos",
    "test:chaos:property": "vitest run --testPathPattern='chaos.*\\.property\\.test\\.ts$'",
    "test:load": "vitest run test/load",
    "test:e2e": "vitest run test/e2e",
    "test:all-property": "vitest run --testPathPattern='\\.property\\.test\\.ts$'",
    
    "// Phase Validation": "",
    "validate:design": "tsx scripts/validate-phase.ts design",
    "validate:contract": "tsx scripts/validate-phase.ts contract",
    "validate:red": "tsx scripts/validate-phase.ts red",
    "validate:green": "tsx scripts/validate-phase.ts green",
    "validate:production": "tsx scripts/validate-phase.ts production",
    "validate:integrate": "tsx scripts/validate-phase.ts integrate",
    "validate:harden": "tsx scripts/validate-phase.ts harden"
  }
}
```

---

## 🎯 Updated Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│ PROPERTY-BASED TESTING IN PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Phase 1: DESIGN 🔵                                          │
│   ├─ Define invariants in .invariants.md                   │
│   ├─ Add custom arbitraries to schemas                     │
│   ├─ Write _User.property.test.ts                          │
│   └─ Test: Equality, hash, round-trip, constraints         │
│                                                             │
│ Phase 2: CONTRACT 🟢                                        │
│   ├─ Write UserRepository.property.test.ts                 │
│   ├─ Test: Save/load, count, pagination, concurrency       │
│   └─ Run against fake (100+ runs per test)                 │
│                                                             │
│ Phase 5: PRODUCTION 🟡                                      │
│   ├─ Reuse ALL property tests                              │
│   ├─ Run against production (100+ runs per test)           │
│   └─ Add DB-specific properties (SQL injection, etc.)      │
│                                                             │
│ Phase 6: INTEGRATE 🔗                                       │
│   ├─ Write cross-service property tests                    │
│   └─ Test: Workflow invariants, consistency                │
│                                                             │
│ Phase 7: HARDEN 💪                                          │
│   ├─ Write chaos property tests                            │
│   ├─ Test properties under failure injection               │
│   └─ Test properties under load                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

KEY COMMANDS:
  bun run test:property              # All property tests
  bun run test:chaos:property        # Chaos properties
  bun run validate:contract          # Includes properties
  bun run validate:production        # Includes properties
```

---

## 📊 Property Test Coverage Matrix

| Layer | What to Test | Test Type | File Pattern |
|-------|-------------|-----------|--------------|
| **Domain Models** | Equality laws, serialization, constraints | Property | `_User.property.test.ts` |
| **Port Contracts** | Save/load, idempotency, consistency | Property | `UserRepository.property.test.ts` |
| **Production Adapters** | Same as contracts + DB specifics | Property | `UserRepositoryPostgres.integration.test.ts` |
| **Use Cases** | Workflow invariants, state consistency | Property | `RegisterUser.property.test.ts` |
| **Integration** | Cross-service invariants | Property | `user-registration.property.test.ts` |
| **Chaos** | Eventual consistency, retry success | Property | `*.chaos.property.test.ts` |
| **Load** | Performance under random load | Property | `*.load.property.test.ts` |

---

## 🎲 Common Property Patterns

### 1. Round-Trip Properties

```typescript
// For any serialization
encode(decode(x)) === x
decode(encode(x)) === x

// For any persistence
load(save(x)) === x
```

### 2. Idempotency Properties

```typescript
// Operation once vs twice
f(x) === f(f(x))

// Save example
save(user); save(user) // Should succeed
```

### 3. Commutativity Properties

```typescript
// Order doesn't matter
f(x, y) === f(y, x)

// Count example
save(u1); save(u2); count() === save(u2); save(u1); count()
```

### 4. Monotonicity Properties

```typescript
// Value always increases/decreases
count_after >= count_before

// After save
count() === old_count + 1
```

### 5. Invariant Properties

```typescript
// Always true
user.age >= 18 && user.age <= 120
count() >= 0
list(limit).length <= limit
```

---

This integration makes property-based testing a **first-class citizen** in the pipeline, not an afterthought. Every phase has clear property tests, and validation gates ensure they pass before moving forward.
