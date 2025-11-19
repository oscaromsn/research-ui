---
modified: 2025-10-20T17:55:39-03:00
---
# Reconciling TDD and Contract-Driven Development in Effect

This is an excellent question that gets to the heart of building robust Effect applications. The good news is that **TDD and CDD are naturally complementary in Effect** when you understand their relationship. Let me explain a comprehensive approach.

## The Philosophical Alignment

In Effect, these methodologies merge beautifully:

- **CDD defines the "contract" (the type signature)** - what errors can occur, what dependencies are needed, what value is produced
- **TDD validates the "behavior" (the implementation)** - that the contract is fulfilled correctly under all conditions
- **The Effect type system bridges them** - `Effect<Success, Error, Requirements>` IS the contract

The key insight: **Your contract IS your test specification.**

## The Integrated Workflow: "Contract-Driven TDD"

Here's the optimal development cycle for Effect applications:

### Phase 0: Design the Domain Model (Outside-In)

Before any code, think through:

```typescript
// What can go wrong? (Errors first - they're part of the design)
// What data structures do we need? (Models)
// What operations do we need? (Service methods)
```

### Phase 1: Define Contracts (The "Type-Level Tests")

```typescript
// domain/errors.ts
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: UserId;
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  cause: unknown;
}> {}

// domain/models.ts
export class User extends Schema.Class<User>("User")({
  id: UserId,
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  name: Schema.NonEmptyString,
  createdAt: Schema.DateTimeUtc,
}) {}

// services/UserRepository.ts
export class UserRepository extends Effect.Service<UserRepository>()("app/UserRepository", {
  effect: Effect.gen(function* () {
    return {
      // The contract: What can succeed, what can fail, what's needed
      findById: (
        id: UserId
      ): Effect.Effect<User, UserNotFoundError | DatabaseError> =>
        Effect.die("Not implemented"),
      
      save: (
        user: User
      ): Effect.Effect<void, DatabaseError> =>
        Effect.die("Not implemented"),
    };
  }),
}) {}
```

**At this point, the TypeScript compiler is already testing:**
- Return types are correct
- Error channels are explicit
- Dependencies are declared

### Phase 2: Write Contract Tests (The "Behavioral Tests")

The critical insight: **Test against the interface, not the implementation.**

```typescript
// services/UserRepository.test.ts
import { it, assert } from "@effect/vitest";
import { Effect, Exit, Cause, Option, Layer, Ref } from "effect";

// Test doubles are ALSO layers that implement the contract
const makeTestUserRepository = Effect.gen(function* () {
  const users = yield* Ref.make(new Map<UserId, User>());
  
  return UserRepository.of({
    findById: (id) =>
      Effect.gen(function* () {
        const map = yield* Ref.get(users);
        const user = map.get(id);
        if (!user) {
          return yield* Effect.fail(new UserNotFoundError({ userId: id }));
        }
        return user;
      }),
    
    save: (user) =>
      Effect.gen(function* () {
        yield* Ref.update(users, (map) => new Map(map).set(user.id, user));
      }),
  });
});

const UserRepositoryTest = Layer.effect(UserRepository, makeTestUserRepository);

// Now test the CONTRACT (not any specific implementation)
describe("UserRepository Contract", () => {
  it.effect("findById should return user when exists", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository;
      const testUser = new User({
        id: UserId.make("123"),
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
      });
      
      yield* repo.save(testUser);
      const found = yield* repo.findById(UserId.make("123"));
      
      assert.deepStrictEqual(found, testUser);
    }).pipe(Effect.provide(UserRepositoryTest))
  );

  it.effect("findById should fail with UserNotFoundError when missing", () =>
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
          assert.strictEqual(error.value.userId, UserId.make("nonexistent"));
        }
      }
    }).pipe(Effect.provide(UserRepositoryTest))
  );

  it.effect("save and findById should round-trip correctly", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository;
      const user = new User({
        id: UserId.make("456"),
        email: "roundtrip@example.com",
        name: "Roundtrip User",
        createdAt: new Date(),
      });
      
      yield* repo.save(user);
      const retrieved = yield* repo.findById(user.id);
      
      assert.deepStrictEqual(retrieved, user);
    }).pipe(Effect.provide(UserRepositoryTest))
  );
});
```

**Key insight:** These tests define the behavioral contract. ANY implementation (SQL, in-memory, mock) MUST pass these tests.

### Phase 3: Implement Production Layer (Make Tests Pass)

```typescript
// services/UserRepository.impl.ts
export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    return UserRepository.of({
      findById: (id) =>
        sql.singleOption(
          SqlSchema.findOne({
            Request: Schema.Struct({ id: UserId }),
            Result: User,
            execute: (req) => sql`
              SELECT id, email, name, created_at
              FROM users
              WHERE id = ${req.id}
            `,
          })
        ).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.fail(new UserNotFoundError({ userId: id })),
              onSome: Effect.succeed,
            })
          ),
          Effect.catchAll((error) =>
            Effect.fail(new DatabaseError({ cause: error }))
          )
        ),

      save: (user) =>
        sql.void(sql`
          INSERT INTO users (id, email, name, created_at)
          VALUES (${user.id}, ${user.email}, ${user.name}, ${user.createdAt})
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name
        `).pipe(
          Effect.catchAll((error) =>
            Effect.fail(new DatabaseError({ cause: error }))
          )
        ),
    });
  })
);
```

Run the contract tests with the production layer:

```typescript
// services/UserRepository.integration.test.ts
import { UserRepositoryLive } from "./UserRepository.impl.ts";

describe("UserRepository Production Implementation", () => {
  const TestLayer = UserRepositoryLive.pipe(
    Layer.provide(SqlClient.layer),
    Layer.provide(Config.layer)
  );

  // Run the SAME contract tests, but with the production layer
  it.effect("findById should return user when exists", () =>
    Effect.gen(function* () {
      // ... same test code ...
    }).pipe(Effect.provide(TestLayer))
  );

  // ... all other contract tests ...
});
```

## Multi-Layer Validation Strategy

For complex applications, test at multiple levels:

### Level 1: Pure Logic (Unit Tests)

```typescript
// Pure business logic without Effect
export const calculateDiscount = (
  user: User,
  orderTotal: number
): number => {
  if (user.isPremium) return orderTotal * 0.2;
  if (orderTotal > 100) return orderTotal * 0.1;
  return 0;
};

// Standard Jest/Vitest tests
describe("calculateDiscount", () => {
  it("should give 20% discount for premium users", () => {
    expect(calculateDiscount(premiumUser, 100)).toBe(20);
  });
});
```

### Level 2: Service Contract (Integration Tests)

```typescript
// Test the service contract with a test double
describe("OrderService Contract", () => {
  it.effect("should apply discount correctly", () =>
    Effect.gen(function* () {
      const service = yield* OrderService;
      const order = yield* service.createOrder(user, items);
      assert.strictEqual(order.discount, expectedDiscount);
    }).pipe(Effect.provide(OrderServiceTest))
  );
});
```

### Level 3: Layer Composition (System Tests)

Test that layers compose correctly:

```typescript
// test/layers.test.ts
describe("Application Layer Composition", () => {
  it.effect("MainLayer should provide all required services", () =>
    Effect.gen(function* () {
      // If this compiles and runs, all dependencies are satisfied
      const userRepo = yield* UserRepository;
      const orderService = yield* OrderService;
      const emailService = yield* EmailService;
      
      // Verify services are properly initialized
      assert.isDefined(userRepo);
      assert.isDefined(orderService);
      assert.isDefined(emailService);
    }).pipe(Effect.provide(MainLayer))
  );

  it.effect("MainLayer should handle concurrent requests", () =>
    Effect.gen(function* () {
      const results = yield* Effect.all(
        Array.from({ length: 100 }, (_, i) =>
          Effect.gen(function* () {
            const repo = yield* UserRepository;
            return yield* repo.findById(UserId.make(`user-${i}`));
          })
        ),
        { concurrency: "unbounded" }
      );
      
      assert.strictEqual(results.length, 100);
    }).pipe(
      Effect.provide(MainLayer),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

### Level 4: End-to-End (E2E Tests)

Test the full application stack:

```typescript
// e2e/api.test.ts
describe("API End-to-End", () => {
  it.effect("should create user and retrieve it via API", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      
      // Create user
      const createResponse = yield* HttpClientRequest.post("/users").pipe(
        HttpClientRequest.jsonBody({ email: "test@example.com", name: "Test" }),
        client.execute,
        Effect.flatMap((res) => res.json),
        Effect.scoped
      );
      
      const userId = createResponse.id;
      
      // Retrieve user
      const user = yield* HttpClientRequest.get(`/users/${userId}`).pipe(
        client.execute,
        Effect.flatMap((res) => res.json),
        Effect.scoped
      );
      
      assert.strictEqual(user.email, "test@example.com");
    }).pipe(Effect.provide(E2ETestLayer))
  );
});
```

## The "Shadow Service" Pattern for Interaction Testing

When you need to verify that a service method was called (traditional "mocking"), use the Shadow Service pattern:

```typescript
// test/helpers/ShadowEmailService.ts
export class ShadowEmailService extends Effect.Service<ShadowEmailService>()(
  "test/ShadowEmailService",
  {
    effect: Effect.gen(function* () {
      const sentEmails = yield* Ref.make<Array<{ to: string; body: string }>>([]);
      
      return {
        // Implement the actual service interface
        send: (to: string, body: string) =>
          Effect.gen(function* () {
            yield* Ref.update(sentEmails, (emails) => [...emails, { to, body }]);
          }),
        
        // Add test-specific assertion methods
        getSentEmails: () => Ref.get(sentEmails),
        
        wasEmailSentTo: (email: string) =>
          Effect.gen(function* () {
            const emails = yield* Ref.get(sentEmails);
            return emails.some((e) => e.to === email);
          }),
      };
    }),
  }
) {}

// Provide shadow service for BOTH tags
const ShadowEmailLayer = Layer.effect(
  ShadowEmailService,
  Effect.gen(function* () {
    const shadow = yield* ShadowEmailService.make;
    return shadow;
  })
).pipe(
  Layer.provide(
    // The shadow implements the real service interface
    Layer.succeed(EmailService, EmailService.of({
      send: (to, body) => Effect.flatMap(
        ShadowEmailService,
        (shadow) => shadow.send(to, body)
      ),
    }))
  )
);

// In your test
it.effect("should send welcome email when user registers", () =>
  Effect.gen(function* () {
    const userService = yield* UserService;
    const shadow = yield* ShadowEmailService;
    
    yield* userService.register({ email: "new@example.com", name: "New User" });
    
    const wasSent = yield* shadow.wasEmailSentTo("new@example.com");
    assert.isTrue(wasSent);
  }).pipe(Effect.provide(ShadowEmailLayer))
);
```

## Catching Bugs Early: The Type-Driven Approach

The type system is your first line of defense:

### 1. Make Invalid States Unrepresentable

```typescript
// ❌ BAD: Runtime validation
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered";

interface Order {
  status: OrderStatus;
  shippingAddress?: string; // Can be missing even when shipped!
}

// ✅ GOOD: Type-level validation
export class PendingOrder extends Schema.Class<PendingOrder>("PendingOrder")({
  id: OrderId,
  items: Schema.Array(OrderItem),
  customerId: UserId,
}) {}

export class ConfirmedOrder extends Schema.Class<ConfirmedOrder>("ConfirmedOrder")({
  id: OrderId,
  items: Schema.Array(OrderItem),
  customerId: UserId,
  paymentId: PaymentId,
}) {}

export class ShippedOrder extends Schema.Class<ShippedOrder>("ShippedOrder")({
  id: OrderId,
  items: Schema.Array(OrderItem),
  customerId: UserId,
  paymentId: PaymentId,
  shippingAddress: Address, // MUST exist
  trackingNumber: TrackingNumber,
}) {}

// Now the compiler prevents you from shipping without an address!
export const shipOrder = (
  order: ConfirmedOrder,
  address: Address
): Effect.Effect<ShippedOrder, ShippingError> => {
  // Implementation
};
```

### 2. Use Branded Types for Business Invariants

```typescript
export type UserId = string & Brand.Brand<"UserId">;
export const UserId = Brand.nominal<UserId>();

export type PositiveInt = number & Brand.Brand<"PositiveInt">;
export const PositiveInt = Brand.refined<PositiveInt>(
  (n) => Number.isInteger(n) && n > 0,
  (n) => Brand.error(`Expected positive integer, got ${n}`)
);

// Now you can't mix up IDs or pass negative quantities
export const addItem = (
  orderId: OrderId, // Not just string
  productId: ProductId, // Not just string
  quantity: PositiveInt // Not just number
): Effect.Effect<void, OrderError> => {
  // Compiler enforces correct types
};
```

### 3. Exhaustive Error Handling

```typescript
// The compiler will error if you don't handle all error types
const program = userService.getUser(id).pipe(
  Effect.catchTags({
    UserNotFoundError: (e) => Effect.logError(`User not found: ${e.userId}`),
    DatabaseError: (e) => Effect.logError(`DB error: ${e.cause}`),
    // Forget to handle NetworkError? Compiler error!
  })
);
```

## The Complete Validation Pyramid

```
                 E2E Tests (few, slow, high confidence)
                         │
                    ┌────▼────┐
                    │ HTTP API│
                    └────┬────┘
               Layer Composition Tests
                         │
                    ┌────▼────┐
                    │Services │ ◄─── Contract Tests (medium, fast)
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │Business │ ◄─── Unit Tests (many, instant)
                    │ Logic   │
                    └─────────┘
```

**Strategy:**
1. **Many unit tests** for pure logic (fast feedback)
2. **Good coverage of contract tests** for services (validates behavior)
3. **Some layer composition tests** (validates integration)
4. **Few E2E tests** for critical user journeys (validates the full stack)

## Common Pitfalls to Avoid

### ❌ Testing Implementation Details

```typescript
// ❌ DON'T test internal state
it("should add user to internal map", () => {
  const internalMap = repo.getUserMap(); // Exposing internals!
  expect(internalMap.size).toBe(1);
});

// ✅ DO test observable behavior
it.effect("should retrieve saved user", () =>
  Effect.gen(function* () {
    const repo = yield* UserRepository;
    yield* repo.save(user);
    const retrieved = yield* repo.findById(user.id);
    assert.deepStrictEqual(retrieved, user);
  })
);
```

### ❌ Not Testing Failure Cases

```typescript
// ❌ Only testing happy path
it.effect("should create user", () => /* ... */);

// ✅ Test all error scenarios
it.effect("should fail with ValidationError for invalid email", () =>
  Effect.gen(function* () {
    const exit = yield* Effect.exit(
      userService.create({ email: "invalid", name: "Test" })
    );
    assert.isTrue(Exit.isFailure(exit));
  })
);
```

### ❌ Multiple `Effect.provide` Calls in Tests

```typescript
// ❌ Creates multiple scopes, breaks memoization
const test = myEffect.pipe(
  Effect.provide(Layer1),
  Effect.provide(Layer2) // Wrong!
);

// ✅ Compose layers first
const TestLayer = Layer.mergeAll(Layer1, Layer2);
const test = myEffect.pipe(Effect.provide(TestLayer));
```

## Summary: The Contract-Driven TDD Workflow

1. **Design phase:** Think through errors, models, and operations
2. **Contract phase:** Define types and interfaces (compiler validates)
3. **Test phase:** Write contract tests with test doubles (validates behavior)
4. **Implementation phase:** Create production layers (validates correctness)
5. **Integration phase:** Test layer composition (validates system)
6. **Refinement phase:** Refactor with confidence (tests are safety net)

**The key insight:** In Effect, your contract IS your test specification. The type system catches structural errors at compile time, and your tests validate behavioral correctness at runtime. Together, they create multiple layers of validation that catch bugs as early as possible.

This approach scales to arbitrarily complex applications because each layer is independently correct and composes predictably. You build complexity from validated foundations.
