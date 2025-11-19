---
modified: 2025-10-20T17:52:38-03:00
---
# Building Complex Effect Applications Through Validated Abstractions

Let me show you how to build complex Effect applications through **incremental, validated layers of abstraction** where each layer is proven correct before the next is built. This creates a **pyramid of confidence**.

## The Validation Pyramid: Bottom-Up Confidence

```
                    ┌─────────────────────┐
                    │   Application       │ ← Business Workflows
                    │   Workflows         │   (Orchestration Tests)
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Domain Services   │ ← Business Logic
                    │   (High-Level)      │   (Contract Tests)
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Domain Services   │ ← Core Operations
                    │   (Low-Level)       │   (Contract + Property Tests)
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Data Structures   │ ← Validated Models
                    │   & Primitives      │   (Schema + Unit Tests)
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Type-Level        │ ← Branded Types
                    │   Guarantees        │   (Compile-Time Only)
                    └─────────────────────┘
```

**Rule: Never build layer N+1 until layer N is fully validated.**

## Phase 1: Foundation - Type-Level Guarantees

Start with the strongest guarantees: **make invalid states unrepresentable**.

### Pattern 1.1: Branded Primitives with Invariants

```typescript
// domain/primitives/Email.ts
import { Brand, Schema } from "effect";

// Type-level guarantee: EmailAddress is always valid
export type EmailAddress = string & Brand.Brand<"EmailAddress">;

export const EmailAddress = Brand.refined<EmailAddress>(
  (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),
  (s) => Brand.error(`Invalid email: ${s}`)
);

// Alternative: Schema-based with more validation
export const EmailAddressSchema = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("EmailAddress")
);

// domain/primitives/UserId.ts
export type UserId = string & Brand.Brand<"UserId">;
export const UserId = Brand.nominal<UserId>();

// domain/primitives/PositiveInt.ts
export type PositiveInt = number & Brand.Brand<"PositiveInt">;
export const PositiveInt = Brand.refined<PositiveInt>(
  (n) => Number.isInteger(n) && n > 0,
  (n) => Brand.error(`Expected positive integer, got ${n}`)
);

// domain/primitives/Money.ts
export type Money = number & Brand.Brand<"Money">;
export const Money = Brand.refined<Money>(
  (n) => Number.isFinite(n) && n >= 0 && Number.isInteger(n * 100), // Cents precision
  (n) => Brand.error(`Invalid money amount: ${n}`)
);
```

**Validation:** These are validated by the TypeScript compiler. Write unit tests to verify the refinement predicates:

```typescript
// domain/primitives/Email.test.ts
import { describe, it, expect } from "vitest";

describe("EmailAddress Brand", () => {
  it("should accept valid emails", () => {
    const result = EmailAddress("user@example.com");
    expect(Brand.is(EmailAddress, result)).toBe(true);
  });

  it("should reject invalid emails", () => {
    expect(() => EmailAddress("not-an-email")).toThrow();
    expect(() => EmailAddress("@example.com")).toThrow();
    expect(() => EmailAddress("user@")).toThrow();
  });
});

describe("Money Brand", () => {
  it("should accept valid monetary amounts", () => {
    expect(Brand.is(Money, Money(10.50))).toBe(true);
    expect(Brand.is(Money, Money(0))).toBe(true);
    expect(Brand.is(Money, Money(999.99))).toBe(true);
  });

  it("should reject invalid amounts", () => {
    expect(() => Money(-5)).toThrow(); // Negative
    expect(() => Money(10.555)).toThrow(); // Too many decimals
    expect(() => Money(Infinity)).toThrow();
    expect(() => Money(NaN)).toThrow();
  });
});
```

### Pattern 1.2: State Machine Types

Encode valid state transitions in the type system:

```typescript
// domain/models/Order.ts
import { Schema, Data } from "effect";

// Each state is a separate type with only valid fields
export class DraftOrder extends Schema.Class<DraftOrder>("DraftOrder")({
  id: OrderId,
  customerId: UserId,
  items: Schema.Array(OrderItem),
  createdAt: Schema.DateTimeUtc,
}) {}

export class PendingPaymentOrder extends Schema.Class<PendingPaymentOrder>(
  "PendingPaymentOrder"
)({
  id: OrderId,
  customerId: UserId,
  items: Schema.Array(OrderItem),
  createdAt: Schema.DateTimeUtc,
  subtotal: Money, // Now calculated
  tax: Money,
  total: Money,
}) {}

export class PaidOrder extends Schema.Class<PaidOrder>("PaidOrder")({
  id: OrderId,
  customerId: UserId,
  items: Schema.Array(OrderItem),
  createdAt: Schema.DateTimeUtc,
  subtotal: Money,
  tax: Money,
  total: Money,
  paymentId: PaymentId, // Now required
  paidAt: Schema.DateTimeUtc,
}) {}

export class ShippedOrder extends Schema.Class<ShippedOrder>("ShippedOrder")({
  id: OrderId,
  customerId: UserId,
  items: Schema.Array(OrderItem),
  createdAt: Schema.DateTimeUtc,
  subtotal: Money,
  tax: Money,
  total: Money,
  paymentId: PaymentId,
  paidAt: Schema.DateTimeUtc,
  shippingAddress: Address, // Now required
  trackingNumber: TrackingNumber, // Now required
  shippedAt: Schema.DateTimeUtc,
}) {}

// Type-safe state transitions
export class OrderTransitions {
  static submitForPayment(
    order: DraftOrder
  ): Effect.Effect<PendingPaymentOrder, ValidationError> {
    return Effect.gen(function* () {
      if (order.items.length === 0) {
        return yield* Effect.fail(
          new ValidationError({ message: "Order must have items" })
        );
      }

      const subtotal = Money(
        order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      );
      const tax = Money(subtotal * 0.1); // 10% tax
      const total = Money(subtotal + tax);

      return new PendingPaymentOrder({
        ...order,
        subtotal,
        tax,
        total,
      });
    });
  }

  static markAsPaid(
    order: PendingPaymentOrder,
    paymentId: PaymentId
  ): PaidOrder {
    // Type system guarantees we have all required fields
    return new PaidOrder({
      ...order,
      paymentId,
      paidAt: new Date(),
    });
  }

  static ship(
    order: PaidOrder,
    address: Address,
    trackingNumber: TrackingNumber
  ): ShippedOrder {
    // Impossible to ship an unpaid order - compiler prevents it
    return new ShippedOrder({
      ...order,
      shippingAddress: address,
      trackingNumber,
      shippedAt: new Date(),
    });
  }
}
```

**Validation:** Test each transition function:

```typescript
// domain/models/Order.test.ts
describe("Order State Transitions", () => {
  it("should transition from Draft to PendingPayment", async () => {
    const draft = new DraftOrder({
      id: OrderId.make("order-1"),
      customerId: UserId.make("user-1"),
      items: [createTestItem()],
      createdAt: new Date(),
    });

    const pending = await Effect.runPromise(
      OrderTransitions.submitForPayment(draft)
    );

    expect(pending).toBeInstanceOf(PendingPaymentOrder);
    expect(pending.total).toBeGreaterThan(0);
  });

  it("should fail to submit empty order", async () => {
    const draft = new DraftOrder({
      id: OrderId.make("order-1"),
      customerId: UserId.make("user-1"),
      items: [],
      createdAt: new Date(),
    });

    await expect(
      Effect.runPromise(OrderTransitions.submitForPayment(draft))
    ).rejects.toThrow(ValidationError);
  });

  // Compiler prevents this - won't compile!
  // it("cannot ship unpaid order", () => {
  //   const pending = createPendingOrder();
  //   OrderTransitions.ship(pending, address, tracking); // Type error!
  // });
});
```

## Phase 2: Data Structures - Validated Models

Build **self-validating data structures** using Schema.

### Pattern 2.1: Schema-First Domain Models

```typescript
// domain/models/User.ts
import { Schema, Data } from "effect";

export class User extends Schema.Class<User>("User")({
  id: UserId,
  email: EmailAddressSchema,
  name: Schema.NonEmptyString,
  age: Schema.Number.pipe(Schema.between(0, 150)),
  role: Schema.Literal("admin", "user", "guest"),
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

  withUpdatedEmail(newEmail: EmailAddress): User {
    return new User({
      ...this,
      email: newEmail,
      updatedAt: new Date(),
    });
  }
}

// Validation happens automatically via Schema
export const parseUser = Schema.decodeUnknown(User);

// domain/models/Address.ts
export class Address extends Schema.Class<Address>("Address")({
  street: Schema.NonEmptyString,
  city: Schema.NonEmptyString,
  state: Schema.String.pipe(Schema.length(2)), // US state code
  zipCode: Schema.String.pipe(Schema.pattern(/^\d{5}(-\d{4})?$/)),
  country: Schema.Literal("US"), // Extend as needed
}) {}

// domain/models/OrderItem.ts
export class OrderItem extends Schema.Class<OrderItem>("OrderItem")({
  productId: ProductId,
  quantity: PositiveInt,
  price: Money,
  name: Schema.NonEmptyString,
}) {
  get subtotal(): Money {
    return Money(this.price * this.quantity);
  }
}
```

**Validation:** Test schema validation and domain methods:

```typescript
// domain/models/User.test.ts
describe("User Schema Validation", () => {
  it("should parse valid user data", async () => {
    const validData = {
      id: UserId.make("user-1"),
      email: "user@example.com",
      name: "John Doe",
      age: 30,
      role: "user",
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    const user = await Effect.runPromise(parseUser(validData));
    expect(user).toBeInstanceOf(User);
    expect(user.email).toBe("user@example.com");
  });

  it("should reject invalid email", async () => {
    const invalidData = {
      id: UserId.make("user-1"),
      email: "not-an-email",
      name: "John Doe",
      age: 30,
      role: "user",
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    await expect(Effect.runPromise(parseUser(invalidData))).rejects.toThrow();
  });

  it("should reject invalid age", async () => {
    const invalidData = {
      id: UserId.make("user-1"),
      email: "user@example.com",
      name: "John Doe",
      age: 200, // Too old
      role: "user",
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    await expect(Effect.runPromise(parseUser(invalidData))).rejects.toThrow();
  });

  it("should update email correctly", async () => {
    const user = createTestUser();
    const newEmail = EmailAddress("newemail@example.com");
    
    const updated = user.withUpdatedEmail(newEmail);
    
    expect(updated.email).toBe(newEmail);
    expect(updated.updatedAt).toBeDefined();
    expect(updated.id).toBe(user.id); // ID unchanged
  });
});
```

### Pattern 2.2: Property-Based Testing for Complex Validations

Use `fast-check` to validate invariants hold for all inputs:

```typescript
// domain/models/Money.test.ts
import * as fc from "fast-check";

describe("Money invariants", () => {
  it("should maintain precision through operations", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000000, noNaN: true }),
        fc.float({ min: 0, max: 1000000, noNaN: true }),
        (a, b) => {
          // Round to cents
          const amount1 = Math.round(a * 100) / 100;
          const amount2 = Math.round(b * 100) / 100;
          
          const m1 = Money(amount1);
          const m2 = Money(amount2);
          const sum = Money(m1 + m2);
          
          // Sum should equal mathematical sum (within floating point tolerance)
          expect(sum).toBeCloseTo(amount1 + amount2, 2);
        }
      )
    );
  });
});

// domain/models/OrderItem.test.ts
describe("OrderItem invariants", () => {
  it("subtotal should always equal price * quantity", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 10000, noNaN: true }),
        fc.integer({ min: 1, max: 100 }),
        (price, quantity) => {
          const roundedPrice = Math.round(price * 100) / 100;
          
          const item = new OrderItem({
            productId: ProductId.make("prod-1"),
            quantity: PositiveInt(quantity),
            price: Money(roundedPrice),
            name: "Test Product",
          });
          
          const expected = Money(roundedPrice * quantity);
          expect(item.subtotal).toBeCloseTo(expected, 2);
        }
      )
    );
  });
});
```

## Phase 3: Low-Level Services - Core Operations

Build primitive operations with **exhaustive error handling**.

### Pattern 3.1: Atomic Service Operations with Rich Fakes

```typescript
// services/UserRepository.ts
import { Effect, Data } from "effect";

// Errors are part of the contract
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: UserId;
}> {}

export class UserAlreadyExistsError extends Data.TaggedError("UserAlreadyExistsError")<{
  email: EmailAddress;
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  cause: unknown;
}> {}

export class UserRepository extends Effect.Service<UserRepository>()(
  "app/UserRepository",
  {
    effect: Effect.gen(function* () {
      return {
        // Atomic operations only - no business logic
        findById: (id: UserId): Effect.Effect<User, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),

        findByEmail: (
          email: EmailAddress
        ): Effect.Effect<User, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),

        save: (user: User): Effect.Effect<void, UserAlreadyExistsError | DatabaseError> =>
          Effect.die("Not implemented"),

        update: (user: User): Effect.Effect<void, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),

        delete: (id: UserId): Effect.Effect<void, UserNotFoundError | DatabaseError> =>
          Effect.die("Not implemented"),

        list: (
          limit: PositiveInt,
          offset: number
        ): Effect.Effect<Array<User>, DatabaseError> =>
          Effect.die("Not implemented"),
      };
    }),
  }
) {}

// services/UserRepository.fake.ts
export class UserRepositoryFake extends Effect.Service<UserRepositoryFake>()(
  "app/UserRepositoryFake",
  {
    effect: Effect.gen(function* () {
      // State management
      const users = yield* Ref.make<Map<UserId, User>>(new Map());
      const emailIndex = yield* Ref.make<Map<EmailAddress, UserId>>(new Map());

      // Event log for debugging
      const operations = yield* Ref.make
        Array<{
          type: string;
          timestamp: number;
          details: unknown;
        }>
      >([]);

      const logOperation = (type: string, details: unknown) =>
        Effect.gen(function* () {
          const now = yield* Clock.currentTimeMillis;
          yield* Ref.update(operations, (ops) => [
            ...ops,
            { type, timestamp: now, details },
          ]);
        });

      // Implementation with realistic semantics
      const repository = {
        findById: (id) =>
          Effect.gen(function* () {
            yield* logOperation("findById", { id });

            const map = yield* Ref.get(users);
            const user = map.get(id);

            if (!user) {
              return yield* Effect.fail(new UserNotFoundError({ userId: id }));
            }

            return user;
          }),

        findByEmail: (email) =>
          Effect.gen(function* () {
            yield* logOperation("findByEmail", { email });

            const index = yield* Ref.get(emailIndex);
            const userId = index.get(email);

            if (!userId) {
              return yield* Effect.fail(
                new UserNotFoundError({ userId: "unknown" })
              );
            }

            return yield* repository.findById(userId);
          }),

        save: (user) =>
          Effect.gen(function* () {
            yield* logOperation("save", { userId: user.id, email: user.email });

            // Check for duplicate email
            const index = yield* Ref.get(emailIndex);
            const existingUserId = index.get(user.email);

            if (existingUserId && existingUserId !== user.id) {
              return yield* Effect.fail(
                new UserAlreadyExistsError({ email: user.email })
              );
            }

            // Save user
            yield* Ref.update(users, (map) => new Map(map).set(user.id, user));
            yield* Ref.update(
              emailIndex,
              (map) => new Map(map).set(user.email, user.id)
            );
          }),

        update: (user) =>
          Effect.gen(function* () {
            yield* logOperation("update", { userId: user.id });

            // Verify user exists
            const map = yield* Ref.get(users);
            if (!map.has(user.id)) {
              return yield* Effect.fail(new UserNotFoundError({ userId: user.id }));
            }

            // Update user
            yield* Ref.update(users, (map) => new Map(map).set(user.id, user));
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* logOperation("delete", { userId: id });

            const map = yield* Ref.get(users);
            const user = map.get(id);

            if (!user) {
              return yield* Effect.fail(new UserNotFoundError({ userId: id }));
            }

            // Remove from both stores
            yield* Ref.update(users, (map) => {
              const newMap = new Map(map);
              newMap.delete(id);
              return newMap;
            });

            yield* Ref.update(emailIndex, (map) => {
              const newMap = new Map(map);
              newMap.delete(user.email);
              return newMap;
            });
          }),

        list: (limit, offset) =>
          Effect.gen(function* () {
            yield* logOperation("list", { limit, offset });

            const map = yield* Ref.get(users);
            const allUsers = Array.from(map.values());

            return allUsers.slice(offset, offset + limit);
          }),
      };

      // Inspection API
      const inspectionAPI = {
        getUserCount: () => Effect.map(Ref.get(users), (map) => map.size),

        getOperationLog: () => Ref.get(operations),

        clear: () =>
          Effect.gen(function* () {
            yield* Ref.set(users, new Map());
            yield* Ref.set(emailIndex, new Map());
            yield* Ref.set(operations, []);
          }),

        // Snapshot for debugging
        exportState: () =>
          Effect.gen(function* () {
            const userMap = yield* Ref.get(users);
            const emailMap = yield* Ref.get(emailIndex);

            return {
              users: Array.from(userMap.values()),
              emailIndex: Array.from(emailMap.entries()),
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
  Layer.provideMerge(Layer.effect(UserRepositoryFake, UserRepositoryFake.make))
);
```

**Validation:** Comprehensive contract tests:

```typescript
// services/UserRepository.contract.test.ts
export const runUserRepositoryContractTests = (
  description: string,
  layer: Layer.Layer<UserRepository>
) => {
  describe(`UserRepository Contract: ${description}`, () => {
    const testUser = new User({
      id: UserId.make("user-1"),
      email: EmailAddress("test@example.com"),
      name: "Test User",
      age: 30,
      role: "user",
      metadata: {},
      createdAt: new Date(),
    });

    it.effect("should save and retrieve user by ID", () =>
      Effect.gen(function* () {
        const repo = yield* UserRepository;

        yield* repo.save(testUser);
        const retrieved = yield* repo.findById(testUser.id);

        assert.deepStrictEqual(retrieved, testUser);
      }).pipe(Effect.provide(layer))
    );

    it.effect("should save and retrieve user by email", () =>
      Effect.gen(function* () {
        const repo = yield* UserRepository;

        yield* repo.save(testUser);
        const retrieved = yield* repo.findByEmail(testUser.email);

        assert.deepStrictEqual(retrieved, testUser);
      }).pipe(Effect.provide(layer))
    );

    it.effect("should fail with UserNotFoundError for missing user", () =>
      Effect.gen(function* () {
        const repo = yield* UserRepository;
        const exit = yield* Effect.exit(repo.findById(UserId.make("missing")));

        assert.isTrue(Exit.isFailure(exit));
        if (Exit.isFailure(exit)) {
          const error = Cause.failureOption(exit.cause);
          assert.isTrue(Option.isSome(error));
          if (Option.isSome(error)) {
            assert.instanceOf(error.value, UserNotFoundError);
          }
        }
      }).pipe(Effect.provide(layer))
    );

    it.effect("should fail with UserAlreadyExistsError for duplicate email", () =>
      Effect.gen(function* () {
        const repo = yield* UserRepository;

        yield* repo.save(testUser);

        const duplicate = new User({
          ...testUser,
          id: UserId.make("user-2"), // Different ID
        });

        const exit = yield* Effect.exit(repo.save(duplicate));

        assert.isTrue(Exit.isFailure(exit));
        if (Exit.isFailure(exit)) {
          const error = Cause.failureOption(exit.cause);
          assert.isTrue(Option.isSome(error));
          if (Option.isSome(error)) {
            assert.instanceOf(error.value, UserAlreadyExistsError);
          }
        }
      }).pipe(Effect.provide(layer))
    );

    it.effect("should update existing user", () =>
      Effect.gen(function* () {
        const repo = yield* UserRepository;

        yield* repo.save(testUser);

        const updated = testUser.withUpdatedEmail(
          EmailAddress("newemail@example.com")
        );
        yield* repo.update(updated);

        const retrieved = yield* repo.findById(testUser.id);
        assert.strictEqual(retrieved.email, updated.email);
      }).pipe(Effect.provide(layer))
    );

    it.effect("should delete user", () =>
      Effect.gen(function* () {
        const repo = yield* UserRepository;

        yield* repo.save(testUser);
        yield* repo.delete(testUser.id);

        const exit = yield* Effect.exit(repo.findById(testUser.id));
        assert.isTrue(Exit.isFailure(exit));
      }).pipe(Effect.provide(layer))
    );

    it.effect("should handle concurrent operations correctly", () =>
      Effect.gen(function* () {
        const repo = yield* UserRepository;

        const users = Array.from({ length: 100 }, (_, i) =>
          new User({
            id: UserId.make(`user-${i}`),
            email: EmailAddress(`user${i}@example.com`),
            name: `User ${i}`,
            age: 20 + (i % 50),
            role: "user",
            metadata: {},
            createdAt: new Date(),
          })
        );

        // Save all concurrently
        yield* Effect.all(
          users.map((u) => repo.save(u)),
          { concurrency: "unbounded" }
        );

        // Retrieve all concurrently
        const retrieved = yield* Effect.all(
          users.map((u) => repo.findById(u.id)),
          { concurrency: "unbounded" }
        );

        assert.strictEqual(retrieved.length, 100);
      }).pipe(Effect.provide(layer), Effect.provide(TestContext.TestContext))
    );

    it.effect("should list users with pagination", () =>
      Effect.gen(function* () {
        const repo = yield* UserRepository;

        const users = Array.from({ length: 25 }, (_, i) =>
          new User({
            id: UserId.make(`user-${i}`),
            email: EmailAddress(`user${i}@example.com`),
            name: `User ${i}`,
            age: 20 + i,
            role: "user",
            metadata: {},
            createdAt: new Date(),
          })
        );

        yield* Effect.all(users.map((u) => repo.save(u)));

        const page1 = yield* repo.list(PositiveInt(10), 0);
        const page2 = yield* repo.list(PositiveInt(10), 10);
        const page3 = yield* repo.list(PositiveInt(10), 20);

        assert.strictEqual(page1.length, 10);
        assert.strictEqual(page2.length, 10);
        assert.strictEqual(page3.length, 5);
      }).pipe(Effect.provide(layer))
    );
  });
};

// Run against fake
runUserRepositoryContractTests("Fake", UserRepositoryFakeLayer);
```

### Pattern 3.2: Property-Based Testing for Concurrency

Validate that concurrent operations maintain invariants:

```typescript
// services/UserRepository.concurrency.test.ts
import * as fc from "fast-check";

describe("UserRepository Concurrency Properties", () => {
  it.effect("should maintain uniqueness under concurrent saves", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository;
      const fake = yield* UserRepositoryFake;

      yield* Effect.promise(() =>
        fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                id: fc.string(),
                email: fc.emailAddress(),
                name: fc.string({ minLength: 1 }),
                age: fc.integer({ min: 0, max: 150 }),
              }),
              { minLength: 20, maxLength: 50 }
            ),
            async (userData) => {
              yield* fake.clear();

              const users = userData.map(
                (data) =>
                  new User({
                    id: UserId.make(data.id),
                    email: EmailAddress(data.email),
                    name: data.name,
                    age: data.age,
                    role: "user",
                    metadata: {},
                    createdAt: new Date(),
                  })
              );

              // Save all concurrently
              yield* Effect.all(
                users.map((u) =>
                  repo.save(u).pipe(
                    Effect.catchTag("UserAlreadyExistsError", () => Effect.void)
                  )
                ),
                { concurrency: "unbounded" }
              );

              // Verify: each email appears at most once
              const state = yield* fake.exportState();
              const emails = state.users.map((u) => u.email);
              const uniqueEmails = new Set(emails);

              assert.strictEqual(emails.length, uniqueEmails.size);
            }
          )
        )
      );
    }).pipe(
      Effect.provide(UserRepositoryFakeLayer),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

## Phase 4: High-Level Services - Business Logic

Compose low-level operations into **business workflows**.

### Pattern 4.1: Service Composition with Explicit Dependencies

```typescript
// services/UserService.ts
export class ValidationError extends Data.TaggedError("ValidationError")<{
  message: string;
  field?: string;
}> {}

export class UserService extends Effect.Service<UserService>()("app/UserService", {
  dependencies: [UserRepository.Default, EmailService.Default],
  effect: Effect.gen(function* () {
    const repo = yield* UserRepository;
    const email = yield* EmailService;

    return {
      // Business operation: combines multiple primitives
      registerUser: (
        data: {
          email: string;
          name: string;
          age: number;
        }
      ): Effect.Effect
        User,
        | ValidationError
        | UserAlreadyExistsError
        | DatabaseError
        | SendError
      > =>
        Effect.gen(function* () {
          // Validation
          const validatedEmail = yield* Effect.try({
            try: () => EmailAddress(data.email),
            catch: () =>
              new ValidationError({
                message: "Invalid email format",
                field: "email",
              }),
          });

          if (data.name.trim().length === 0) {
            return yield* Effect.fail(
              new ValidationError({
                message: "Name cannot be empty",
                field: "name",
              })
            );
          }

          if (data.age < 0 || data.age > 150) {
            return yield* Effect.fail(
              new ValidationError({
                message: "Age must be between 0 and 150",
                field: "age",
              })
            );
          }

          // Business logic
          const user = new User({
            id: UserId.make(`user-${crypto.randomUUID()}`),
            email: validatedEmail,
            name: data.name,
            age: data.age,
            role: "user",
            metadata: {},
            createdAt: new Date(),
          });

          // Persistence
          yield* repo.save(user);

          // Side effect (don't fail registration if email fails)
          yield* email
            .send(user.email, "Welcome!", "Welcome to our platform!")
            .pipe(
              Effect.catchAll((error) =>
                Effect.logError(`Failed to send welcome email: ${error}`)
              )
            );

          return user;
        }),

      getUserProfile: (
        userId: UserId
      ): Effect.Effect<User, UserNotFoundError | DatabaseError> =>
        repo.findById(userId),

      updateUserProfile: (
        userId: UserId,
        updates: {
          name?: string;
          age?: number;
        }
      ): Effect.Effect
        User,
        | ValidationError
        | UserNotFoundError
        | DatabaseError
      > =>
        Effect.gen(function* () {
          const user = yield* repo.findById(userId);

          // Validate updates
          if (updates.name !== undefined && updates.name.trim().length === 0) {
            return yield* Effect.fail(
              new ValidationError({
                message: "Name cannot be empty",
                field: "name",
              })
            );
          }

          if (
            updates.age !== undefined &&
            (updates.age < 0 || updates.age > 150)
          ) {
            return yield* Effect.fail(
              new ValidationError({
                message: "Age must be between 0 and 150",
                field: "age",
              })
            );
          }

          // Apply updates
          const updated = new User({
            ...user,
            name: updates.name ?? user.name,
            age: updates.age ?? user.age,
            updatedAt: new Date(),
          });

          yield* repo.update(updated);

          return updated;
        }),

      deleteUser: (
        userId: UserId
      ): Effect.Effect<void, UserNotFoundError | DatabaseError> =>
        repo.delete(userId),
    };
  }),
}) {}
```

**Validation:** Test business logic with fakes:

```typescript
// services/UserService.test.ts
describe("UserService", () => {
  const TestLayer = Layer.mergeAll(
    UserRepositoryFakeLayer,
    EmailServiceFakeLayer
  ).pipe(Layer.provideMerge(UserService.Default));

  it.effect("should register user and send welcome email", () =>
    Effect.gen(function* () {
      const userService = yield* UserService;
      const emailFake = yield* EmailServiceFake;

      const user = yield* userService.registerUser({
        email: "newuser@example.com",
        name: "New User",
        age: 25,
      });

      assert.strictEqual(user.email, "newuser@example.com");
      assert.strictEqual(user.name, "New User");
      assert.strictEqual(user.role, "user");

      // Verify email was sent
      const emails = yield* emailFake.getEmailsSentTo("newuser@example.com");
      assert.strictEqual(emails.length, 1);
      assert.strictEqual(emails[0].subject, "Welcome!");
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should fail registration with invalid email", () =>
    Effect.gen(function* () {
      const userService = yield* UserService;

      const exit = yield* Effect.exit(
        userService.registerUser({
          email: "invalid-email",
          name: "Test",
          age: 25,
        })
      );

      assert.isTrue(Exit.isFailure(exit));
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause);
        assert.isTrue(Option.isSome(error));
        if (Option.isSome(error)) {
          assert.instanceOf(error.value, ValidationError);
          assert.strictEqual(error.value.field, "email");
        }
      }
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should fail registration for duplicate email", () =>
    Effect.gen(function* () {
      const userService = yield* UserService;

      // Register first user
      yield* userService.registerUser({
        email: "duplicate@example.com",
        name: "User 1",
        age: 25,
      });

      // Try to register with same email
      const exit = yield* Effect.exit(
        userService.registerUser({
          email: "duplicate@example.com",
          name: "User 2",
          age: 30,
        })
      );

      assert.isTrue(Exit.isFailure(exit));
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause);
        assert.isTrue(Option.isSome(error));
        if (Option.isSome(error)) {
          assert.instanceOf(error.value, UserAlreadyExistsError);
        }
      }
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should continue registration even if email fails", () =>
    Effect.gen(function* () {
      const userService = yield* UserService;
      const emailFake = yield* EmailServiceFake;

      // Inject email failure
      yield* emailFake.simulateNextSendFailure();

      // Registration should still succeed
      const user = yield* userService.registerUser({
        email: "test@example.com",
        name: "Test User",
        age: 25,
      });

      assert.isDefined(user.id);
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should update user profile", () =>
    Effect.gen(function* () {
      const userService = yield* UserService;

      const user = yield* userService.registerUser({
        email: "user@example.com",
        name: "Original Name",
        age: 25,
      });

      const updated = yield* userService.updateUserProfile(user.id, {
        name: "Updated Name",
        age: 30,
      });

      assert.strictEqual(updated.name, "Updated Name");
      assert.strictEqual(updated.age, 30);
      assert.isDefined(updated.updatedAt);
    }).pipe(Effect.provide(TestLayer))
  );
});
```

### Pattern 4.2: Saga Pattern for Distributed Transactions

Handle complex multi-step workflows with rollback:

```typescript
// services/OrderService.ts
export class OrderService extends Effect.Service<OrderService>()("app/OrderService", {
  dependencies: [
    OrderRepository.Default,
    PaymentService.Default,
    InventoryService.Default,
    EmailService.Default,
  ],
  effect: Effect.gen(function* () {
    const orders = yield* OrderRepository;
    const payments = yield* PaymentService;
    const inventory = yield* InventoryService;
    const email = yield* EmailService;

    return {
      // Multi-step saga with compensations
      placeOrder: (
        customerId: UserId,
        items: Array<{ productId: ProductId; quantity: PositiveInt }>
      ): Effect.Effect
        ShippedOrder,
        | ValidationError
        | PaymentError
        | InventoryError
        | DatabaseError
      > =>
        Effect.gen(function* () {
          // Step 1: Create draft order
          const draft = new DraftOrder({
            id: OrderId.make(`order-${crypto.randomUUID()}`),
            customerId,
            items: items.map(
              (item) =>
                new OrderItem({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: Money(0), // Will be fetched
                  name: "Unknown", // Will be fetched
                })
            ),
            createdAt: new Date(),
          });

          // Step 2: Validate and price items
          const pricedOrder = yield* OrderTransitions.submitForPayment(draft);
          yield* orders.save(pricedOrder);

          // Step 3: Reserve inventory (with automatic rollback on failure)
          const reservationId = yield* inventory
            .reserve(items)
            .pipe(
              Effect.withSpan("inventory.reserve"),
              // Compensation: release inventory if subsequent steps fail
              Effect.ensuring(
                Effect.gen(function* () {
                  const currentOrder = yield* orders.findById(draft.id).pipe(
                    Effect.catchAll(() => Effect.succeed(null))
                  );
                  
                  // Only release if order wasn't completed
                  if (
                    currentOrder &&
                    !(currentOrder instanceof ShippedOrder)
                  ) {
                    yield* inventory.release(reservationId).pipe(
                      Effect.catchAll((error) =>
                        Effect.logError(
                          `Failed to release inventory: ${error}`
                        )
                      )
                    );
                  }
                })
              )
            );

          // Step 4: Process payment (with automatic refund on failure)
          const payment = yield* payments
            .charge(pricedOrder.total, customerId)
            .pipe(
              Effect.withSpan("payment.charge"),
              // Compensation: refund if subsequent steps fail
              Effect.ensuring(
                Effect.gen(function* () {
                  const currentOrder = yield* orders.findById(draft.id).pipe(
                    Effect.catchAll(() => Effect.succeed(null))
                  );

                  // Only refund if order wasn't completed
                  if (
                    currentOrder &&
                    !(currentOrder instanceof ShippedOrder)
                  ) {
                    yield* payments.refund(payment.id).pipe(
                      Effect.catchAll((error) =>
                        Effect.logError(`Failed to refund payment: ${error}`)
                      )
                    );
                  }
                })
              )
            );

          // Step 5: Mark as paid
          const paidOrder = OrderTransitions.markAsPaid(
            pricedOrder,
            payment.id
          );
          yield* orders.update(paidOrder);

          // Step 6: Confirm inventory
          yield* inventory.confirm(reservationId);

          // Step 7: Ship order (assumes immediate shipping for demo)
          const shippedOrder = OrderTransitions.ship(
            paidOrder,
            yield* getCustomerAddress(customerId),
            TrackingNumber.make(`TRACK-${crypto.randomUUID()}`)
          );
          yield* orders.update(shippedOrder);

          // Step 8: Send confirmation email (fire-and-forget)
          yield* email
            .send(
              (yield* getUserEmail(customerId)),
              "Order Confirmed",
              `Your order ${shippedOrder.id} has been shipped!`
            )
            .pipe(
              Effect.catchAll((error) =>
                Effect.logError(`Failed to send confirmation: ${error}`)
              ),
              Effect.fork
            );

          return shippedOrder;
        }).pipe(
          Effect.withSpan("OrderService.placeOrder"),
          // Overall timeout
          Effect.timeout(Duration.seconds(30))
        ),
    };
  }),
}) {}
```

**Validation:** Test saga with failure injection:

```typescript
// services/OrderService.test.ts
describe("OrderService Saga", () => {
  it.effect("should complete full order workflow", () =>
    Effect.gen(function* () {
      const orderService = yield* OrderService;
      const inventoryFake = yield* InventoryServiceFake;
      const paymentFake = yield* PaymentServiceFake;

      const order = yield* orderService.placeOrder(
        UserId.make("customer-1"),
        [{ productId: ProductId.make("prod-1"), quantity: PositiveInt(2) }]
      );

      assert.instanceOf(order, ShippedOrder);

      // Verify inventory was confirmed
      const inventory = yield* inventoryFake.getReservedQuantity(
        ProductId.make("prod-1")
      );
      assert.strictEqual(inventory, 0); // Reservation confirmed

      // Verify payment was captured
      const payments = yield* paymentFake.getProcessedPayments();
      assert.strictEqual(payments.length, 1);
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should rollback inventory on payment failure", () =>
    Effect.gen(function* () {
      const orderService = yield* OrderService;
      const inventoryFake = yield* InventoryServiceFake;
      const paymentFake = yield* PaymentServiceFake;

      // Inject payment failure
      yield* paymentFake.simulateFailures("insufficient-funds", 1.0);

      const exit = yield* Effect.exit(
        orderService.placeOrder(
          UserId.make("customer-1"),
          [{ productId: ProductId.make("prod-1"), quantity: PositiveInt(2) }]
        )
      );

      assert.isTrue(Exit.isFailure(exit));

      // Verify inventory was released
      const inventory = yield* inventoryFake.getReservedQuantity(
        ProductId.make("prod-1")
      );
      assert.strictEqual(inventory, 0); // No reservation

      // Verify no payment was processed
      const payments = yield* paymentFake.getProcessedPayments();
      assert.strictEqual(payments.length, 0);
    }).pipe(Effect.provide(TestLayer), Effect.provide(TestContext.TestContext))
  );

  it.effect("should refund payment on inventory confirmation failure", () =>
    Effect.gen(function* () {
      const orderService = yield* OrderService;
      const inventoryFake = yield* InventoryServiceFake;
      const paymentFake = yield* PaymentServiceFake;

      // Inject inventory confirmation failure
      yield* inventoryFake.simulateConfirmationFailure(true);

      const exit = yield* Effect.exit(
        orderService.placeOrder(
          UserId.make("customer-1"),
          [{ productId: ProductId.make("prod-1"), quantity: PositiveInt(2) }]
        )
      );

      assert.isTrue(Exit.isFailure(exit));

      // Verify payment was refunded
      const refunds = yield* paymentFake.getRefundCount();
      assert.strictEqual(refunds, 1);
    }).pipe(Effect.provide(TestLayer), Effect.provide(TestContext.TestContext))
  );
});
```

## Phase 5: Application Workflows - Orchestration

Compose high-level services into complete user journeys.

### Pattern 5.1: Workflow Testing with Complete Scenario

```typescript
// workflows/UserOnboarding.ts
export const userOnboardingWorkflow = (data: {
  email: string;
  name: string;
  age: number;
  address: Address;
}): Effect.Effect
  {
    user: User;
    order: ShippedOrder;
  },
  | ValidationError
  | UserAlreadyExistsError
  | PaymentError
  | DatabaseError,
  UserService | OrderService | EmailService
> =>
  Effect.gen(function* () {
    // Step 1: Register user
    const user = yield* UserService.pipe(
      Effect.flatMap((service) =>
        service.registerUser({
          email: data.email,
          name: data.name,
          age: data.age,
        })
      ),
      Effect.withSpan("onboarding.register")
    );

    // Step 2: Place welcome order (free gift)
    const order = yield* OrderService.pipe(
      Effect.flatMap((service) =>
        service.placeOrder(user.id, [
          { productId: ProductId.make("welcome-gift"), quantity: PositiveInt(1) },
        ])
      ),
      Effect.withSpan("onboarding.welcomeOrder")
    );

    // Step 3: Send onboarding email series
    yield* EmailService.pipe(
      Effect.flatMap((service) =>
        Effect.all([
          service.send(user.email, "Welcome!", "Welcome email content"),
          Effect.sleep(Duration.seconds(1)).pipe(
            Effect.flatMap(() =>
              service.send(
                user.email,
                "Getting Started",
                "Tutorial email content"
              )
            )
          ),
        ])
      ),
      Effect.withSpan("onboarding.emails"),
      // Don't fail onboarding if emails fail
      Effect.catchAll((error) =>
        Effect.logError(`Onboarding emails failed: ${error}`)
      ),
      Effect.fork // Background task
    );

    return { user, order };
  }).pipe(
    Effect.withSpan("workflow.userOnboarding"),
    Effect.timeout(Duration.seconds(60))
  );

// workflows/UserOnboarding.test.ts
describe("User Onboarding Workflow", () => {
  const TestLayer = Layer.mergeAll(
    UserServiceFakeLayer,
    OrderServiceFakeLayer,
    EmailServiceFakeLayer,
    InventoryServiceFakeLayer,
    PaymentServiceFakeLayer
  );

  it.effect("should complete full onboarding flow", () =>
    Effect.gen(function* () {
      const emailFake = yield* EmailServiceFake;

      const result = yield* userOnboardingWorkflow({
        email: "newuser@example.com",
        name: "New User",
        age: 25,
        address: createTestAddress(),
      });

      // Verify user was created
      assert.strictEqual(result.user.email, "newuser@example.com");
      assert.strictEqual(result.user.role, "user");

      // Verify welcome order was placed
      assert.instanceOf(result.order, ShippedOrder);
      assert.strictEqual(result.order.customerId, result.user.id);

      // Verify emails were sent (with delay for async processing)
      yield* TestClock.adjust(Duration.seconds(2));
      
      const emails = yield* emailFake.getEmailsSentTo("newuser@example.com");
      assert.isAtLeast(emails.length, 2); // Welcome + Getting Started
    }).pipe(Effect.provide(TestLayer), Effect.provide(TestContext.TestContext))
  );

  it.effect("should handle failures gracefully", () =>
    Effect.gen(function* () {
      const paymentFake = yield* PaymentServiceFake;

      // Inject payment failure
      yield* paymentFake.simulateFailures("insufficient-funds", 1.0);

      const exit = yield* Effect.exit(
        userOnboardingWorkflow({
          email: "newuser@example.com",
          name: "New User",
          age: 25,
          address: createTestAddress(),
        })
      );

      // Workflow should fail
      assert.isTrue(Exit.isFailure(exit));

      // But user should still be created (partial success)
      const userService = yield* UserService;
      const user = yield* userService
        .getUserByEmail(EmailAddress("newuser@example.com"))
        .pipe(Effect.option);

      assert.isTrue(Option.isSome(user));
    }).pipe(Effect.provide(TestLayer), Effect.provide(TestContext.TestContext))
  );
});
```

### Pattern 5.2: Integration Testing Full Stack

```typescript
// integration/api.test.ts
describe("Full Stack Integration", () => {
  const TestLayer = Layer.mergeAll(
    HttpServer.layer,
    UserServiceFakeLayer,
    OrderServiceFakeLayer,
    /* all other services */
  );

  it.effect("should handle complete user journey via API", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;

      // 1. Register user via POST /users
      const registerResponse = yield* HttpClientRequest.post("/users").pipe(
        HttpClientRequest.jsonBody({
          email: "apiuser@example.com",
          name: "API User",
          age: 30,
        }),
        client.execute,
        Effect.flatMap(HttpClientResponse.json),
        Effect.scoped
      );

      const userId = registerResponse.id;

      // 2. Get user profile via GET /users/:id
      const profile = yield* HttpClientRequest.get(`/users/${userId}`).pipe(
        client.execute,
        Effect.flatMap(HttpClientResponse.json),
        Effect.scoped
      );

      assert.strictEqual(profile.email, "apiuser@example.com");

      // 3. Place order via POST /orders
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

      // 4. Get order history via GET /users/:id/orders
      const orders = yield* HttpClientRequest.get(
        `/users/${userId}/orders`
      ).pipe(
        client.execute,
        Effect.flatMap(HttpClientResponse.json),
        Effect.scoped
      );

      assert.strictEqual(orders.length, 1);
      assert.strictEqual(orders[0].id, orderResponse.id);
    }).pipe(Effect.provide(TestLayer))
  );
});
```

## Phase 6: Production Hardening

### Pattern 6.1: Chaos Engineering with Fakes

Inject realistic failures to test resilience:

```typescript
// test/chaos/ChaosLayer.ts
export class ChaosConfig extends Context.Tag("ChaosConfig")
  ChaosConfig,
  {
    readonly failureRate: number; // 0-1
    readonly latencyMs: [number, number]; // [min, max]
    readonly enabled: boolean;
  }
>() {}

export const makeChaosService = <S extends Effect.Service.AnyService>(
  service: S,
  operations: ReadonlyArray<keyof Effect.Service.Success<S>>
) =>
  Effect.gen(function* () {
    const config = yield* ChaosConfig;
    const impl = yield* service;

    if (!config.enabled) {
      return impl;
    }

    // Wrap each operation with chaos injection
    const chaosImpl = {} as Effect.Service.Success<S>;

    for (const op of operations) {
      const original = impl[op];
      
      if (typeof original === "function") {
        chaosImpl[op] = ((...args: Array<unknown>) =>
          Effect.gen(function* () {
            // Random latency
            const [min, max] = config.latencyMs;
            const latency = min + Math.random() * (max - min);
            yield* Effect.sleep(Duration.millis(latency));

            // Random failure
            if (Math.random() < config.failureRate) {
              return yield* Effect.die(
                new Error(`Chaos injected failure in ${String(op)}`)
              );
            }

            // Call original
            return yield* original(...args);
          })) as typeof original;
      }
    }

    return chaosImpl;
  });

// test/chaos/chaos.test.ts
describe("Chaos Testing", () => {
  const ChaosLayer = Layer.effect(
    ChaosConfig,
    Effect.succeed({
      failureRate: 0.1, // 10% failure rate
      latencyMs: [100, 500], // 100-500ms latency
      enabled: true,
    })
  );

  const ChaosUserService = Layer.effect(
    UserService,
    makeChaosService(UserService, ["registerUser", "getUserProfile"])
  ).pipe(Layer.provide(ChaosLayer));

  it.effect("should handle intermittent failures with retry", () =>
    Effect.gen(function* () {
      const service = yield* UserService;

      // Should eventually succeed despite chaos
      const user = yield* service
        .registerUser({
          email: "chaos@example.com",
          name: "Chaos User",
          age: 25,
        })
        .pipe(
          Effect.retry({
            times: 10,
            schedule: Schedule.exponential(Duration.millis(100)),
          }),
          Effect.timeout(Duration.seconds(30))
        );

      assert.isDefined(user.id);
    }).pipe(
      Effect.provide(ChaosUserService),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

### Pattern 6.2: Load Testing with Fakes

Validate performance characteristics:

```typescript
// test/load/load.test.ts
describe("Load Testing", () => {
  it.effect("should handle 1000 concurrent user registrations", () =>
    Effect.gen(function* () {
      const service = yield* UserService;
      const startTime = yield* Clock.currentTimeMillis;

      // Create 1000 users concurrently
      const users = yield* Effect.all(
        Array.from({ length: 1000 }, (_, i) =>
          service.registerUser({
            email: `user${i}@example.com`,
            name: `User ${i}`,
            age: 20 + (i % 50),
          })
        ),
        { concurrency: 50 } // Limit concurrency
      );

      const endTime = yield* Clock.currentTimeMillis;
      const duration = endTime - startTime;

      assert.strictEqual(users.length, 1000);
      assert.isBelow(duration, 10_000); // Should complete in < 10 seconds

      yield* Effect.log(`Load test completed in ${duration}ms`);
    }).pipe(
      Effect.provide(TestLayer),
      Effect.provide(TestContext.TestContext)
    )
  );

  it.effect("should maintain data consistency under load", () =>
    Effect.gen(function* () {
      const service = yield* UserService;
      const repo = yield* UserRepositoryFake;

      // Concurrent operations on same user
      const userId = UserId.make("user-1");
      yield* service.registerUser({
        email: "concurrent@example.com",
        name: "Original",
        age: 25,
      });

      // 100 concurrent updates
      yield* Effect.all(
        Array.from({ length: 100 }, (_, i) =>
          service.updateUserProfile(userId, {
            name: `Update ${i}`,
            age: 25 + i,
          })
        ),
        { concurrency: "unbounded" }
      );

      // Final state should be consistent
      const finalUser = yield* service.getUserProfile(userId);
      assert.isDefined(finalUser);
      assert.isDefined(finalUser.updatedAt);

      // Verify operation log
      const operations = yield* repo.getOperationLog();
      yield* Effect.log(
        `Completed ${operations.length} operations under load`
      );
    }).pipe(
      Effect.provide(TestLayer),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

## Complete Development Workflow

```
Phase 1: Type-Level (Compile-Time Validation)
  ├─ Define branded types with invariants
  ├─ Test: Unit tests for brand predicates
  └─ ✅ Checkpoint: Types compile, predicates work

Phase 2: Data Structures (Runtime Validation)
  ├─ Define schemas for all domain models
  ├─ Test: Schema validation, property-based tests
  └─ ✅ Checkpoint: All models parse correctly

Phase 3: Low-Level Services (Atomic Operations)
  ├─ Define service interfaces with errors
  ├─ Build rich fakes with inspection APIs
  ├─ Write comprehensive contract tests
  ├─ Test: Contract, concurrency, property-based
  └─ ✅ Checkpoint: All contract tests pass with fake

Phase 4: High-Level Services (Business Logic)
  ├─ Compose low-level services
  ├─ Test: Business logic with fakes
  ├─ Test: Saga compensations
  └─ ✅ Checkpoint: Business rules validated

Phase 5: Workflows (Orchestration)
  ├─ Compose high-level services
  ├─ Test: Complete scenarios end-to-end
  ├─ Test: Failure modes
  └─ ✅ Checkpoint: User journeys work

Phase 6: Production (Hardening)
  ├─ Implement production layers
  ├─ Run contract tests against production
  ├─ Test: Chaos engineering
  ├─ Test: Load testing
  └─ ✅ Checkpoint: Production-ready

Phase 7: Deployment (Observability)
  ├─ Add tracing/metrics
  ├─ Deploy to staging with fakes
  ├─ Deploy to production with real services
  └─ ✅ Checkpoint: Live and monitored
```

## Key Principles

1. **Never skip a phase** - Each layer depends on the correctness of layers below
2. **Validate exhaustively** - Write tests before implementation
3. **Make fakes production-quality** - They're your development environment
4. **Test all error paths** - Failures are part of your contract
5. **Use property-based testing** - Find edge cases automatically
6. **Compose validated abstractions** - Build complexity from proven pieces
7. **Fail fast at the edges** - Validate input early, fail explicitly
8. **Keep workflows testable** - Use fakes for fast feedback
9. **Harden before production** - Chaos and load testing reveal issues
10. **Monitor in production** - Observability completes the cycle

This approach gives you **incremental confidence** - you know each layer is correct before building the next, and you can **advance fearlessly** because bugs are caught early, close to their source.
