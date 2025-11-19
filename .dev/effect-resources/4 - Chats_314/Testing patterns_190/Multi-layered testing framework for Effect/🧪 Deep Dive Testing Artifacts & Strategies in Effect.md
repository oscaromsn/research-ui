---
modified: 2025-10-27T20:22:10-03:00
---
# 🧪 Deep Dive: Testing Artifacts & Strategies in Effect

## Part 1: Test Data Generation Strategies

### 1.1 Schema-Based Arbitrary Generation (The Foundation)

**Use `Arbitrary.make(Schema)` for automatic test data generation from your domain models.**

```typescript
// domain/models/User.ts
import { Schema } from "effect";

export class User extends Schema.Class<User>("User")({
  id: Schema.UUID,
  email: Schema.String.pipe(
    Schema.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
    Schema.annotations({ arbitrary: () => FastCheck.emailAddress() })
  ),
  name: Schema.NonEmptyString,
  age: Schema.Int.pipe(Schema.between(18, 120)),
  role: Schema.Literal("admin", "user", "guest"),
  createdAt: Schema.DateTimeUtc,
  metadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown }))
}) {}
```

**Generate realistic test data:**

```typescript
import { Arbitrary, FastCheck } from "effect";

// Automatic generation from schema
const userArbitrary = Arbitrary.make(User);

// Generate 10 random valid users
const users = FastCheck.sample(userArbitrary, 10);

// Use in property-based tests
fc.assert(
  fc.asyncProperty(fc.effect(userArbitrary), (user) =>
    Effect.gen(function* () {
      // Every generated user is guaranteed valid per schema
      assert.isTrue(user.age >= 18 && user.age <= 120);
    })
  )
);
```

### 1.2 Custom Arbitrary Generators (For Realistic Data)

**Override default generators with domain-specific realistic data:**

```typescript
// test/fixtures/arbitraries.ts
import { Arbitrary, FastCheck, Schema } from "effect";

// Custom email generator for realistic test data
const RealisticEmail = Schema.String.pipe(
  Schema.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  Schema.annotations({
    arbitrary: () => FastCheck.emailAddress({ 
      invalidFormat: false,
      size: "medium"
    })
  })
);

// Custom name generator
const RealisticName = Schema.NonEmptyString.pipe(
  Schema.annotations({
    arbitrary: () => FastCheck.oneof(
      FastCheck.constant("Alice Johnson"),
      FastCheck.constant("Bob Smith"),
      FastCheck.constant("Carol Williams"),
      FastCheck.constant("David Brown")
    )
  })
);

// User with realistic data
export class RealisticUser extends Schema.Class<RealisticUser>("RealisticUser")({
  id: Schema.UUID,
  email: RealisticEmail,
  name: RealisticName,
  age: Schema.Int.pipe(
    Schema.between(18, 80),
    Schema.annotations({
      arbitrary: () => FastCheck.integer({ min: 25, max: 45 }) // Most users 25-45
    })
  ),
  role: Schema.Literal("admin", "user", "guest").pipe(
    Schema.annotations({
      arbitrary: () => FastCheck.frequency(
        { arbitrary: FastCheck.constant("admin"), weight: 1 },
        { arbitrary: FastCheck.constant("user"), weight: 8 },
        { arbitrary: FastCheck.constant("guest"), weight: 1 }
      )
    })
  )
}) {}
```

### 1.3 Builder Pattern (For Controlled Test Data)

**Create fluent builders for explicit test scenarios:**

```typescript
// test/fixtures/builders.ts
import { Effect, pipe } from "effect";

export class UserBuilder {
  private props: Partial<User> = {};

  static create(): UserBuilder {
    return new UserBuilder();
  }

  withId(id: UserId): this {
    this.props.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.props.email = email;
    return this;
  }

  asAdmin(): this {
    this.props.role = "admin";
    return this;
  }

  withSubscription(): this {
    this.props.subscription = {
      tier: "premium",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    };
    return this;
  }

  build(): User {
    return new User({
      id: this.props.id ?? UserId.make(crypto.randomUUID()),
      email: this.props.email ?? "test@example.com",
      name: this.props.name ?? "Test User",
      age: this.props.age ?? 25,
      role: this.props.role ?? "user",
      createdAt: this.props.createdAt ?? new Date(),
      ...this.props
    });
  }
  
  // Effect-based builder for async operations
  buildEffect(): Effect.Effect<User> {
    return Effect.succeed(this.build());
  }
}

// Usage in tests
it.effect("should handle premium users differently", () =>
  Effect.gen(function* () {
    const user = UserBuilder.create()
      .asAdmin()
      .withSubscription()
      .build();
    
    const service = yield* UserService;
    const result = yield* service.processUser(user);
    
    assert.strictEqual(result.priority, "high");
  })
);
```

### 1.4 Factory Pattern (For Complex Graph Construction)

**Build related entities with proper relationships:**

```typescript
// test/fixtures/factories.ts
export class TestDataFactory extends Effect.Service<TestDataFactory>()(
  "TestDataFactory",
  {
    effect: Effect.gen(function* () {
      const userRepo = yield* UserRepository;
      const orderRepo = yield* OrderRepository;
      
      return {
        // Create complete user with orders
        createUserWithOrders: (orderCount: number) =>
          Effect.gen(function* () {
            const user = UserBuilder.create().build();
            yield* userRepo.save(user);
            
            const orders = yield* Effect.all(
              Array.from({ length: orderCount }, (_, i) =>
                Effect.gen(function* () {
                  const order = new Order({
                    id: OrderId.make(crypto.randomUUID()),
                    userId: user.id,
                    items: [
                      { productId: `prod-${i}`, quantity: 1, price: 10.00 }
                    ],
                    status: "completed",
                    createdAt: new Date()
                  });
                  yield* orderRepo.save(order);
                  return order;
                })
              )
            );
            
            return { user, orders };
          }),
        
        // Create complete order graph
        createOrderScenario: () =>
          Effect.gen(function* () {
            const customer = UserBuilder.create().build();
            yield* userRepo.save(customer);
            
            const pendingOrder = new Order({
              id: OrderId.make(crypto.randomUUID()),
              userId: customer.id,
              items: [{ productId: "prod-1", quantity: 2, price: 20.00 }],
              status: "pending",
              createdAt: new Date()
            });
            
            const shippedOrder = new Order({
              id: OrderId.make(crypto.randomUUID()),
              userId: customer.id,
              items: [{ productId: "prod-2", quantity: 1, price: 50.00 }],
              status: "shipped",
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
            });
            
            yield* orderRepo.save(pendingOrder);
            yield* orderRepo.save(shippedOrder);
            
            return { customer, pendingOrder, shippedOrder };
          })
      };
    })
  }
) {}

// Usage
it.effect("should calculate correct order statistics", () =>
  Effect.gen(function* () {
    const factory = yield* TestDataFactory;
    const { customer, pendingOrder, shippedOrder } = 
      yield* factory.createOrderScenario();
    
    const service = yield* OrderService;
    const stats = yield* service.getUserOrderStats(customer.id);
    
    assert.strictEqual(stats.totalOrders, 2);
    assert.strictEqual(stats.pendingCount, 1);
  }).pipe(Effect.provide(TestLayerWithFactory))
);
```

---

## Part 2: Property-Based Testing for Invariants

### 2.1 Testing Mathematical Laws (Algebraic Properties)

```typescript
describe("Effect Laws", () => {
  // Law: Associativity of flatMap
  it.effect("flatMap should be associative", () =>
    Effect.gen(function* () {
      yield* Effect.promise(() =>
        fc.assert(
          fc.asyncProperty(
            fc.integer(),
            async (a) => {
              const f = (x: number) => Effect.succeed(x + 1);
              const g = (x: number) => Effect.succeed(x * 2);
              const h = (x: number) => Effect.succeed(x - 3);
              
              // (f >=> g) >=> h
              const left = yield* Effect.succeed(a).pipe(
                Effect.flatMap(f),
                Effect.flatMap(g),
                Effect.flatMap(h)
              );
              
              // f >=> (g >=> h)
              const right = yield* Effect.succeed(a).pipe(
                Effect.flatMap(f),
                Effect.flatMap((x) => g(x).pipe(Effect.flatMap(h)))
              );
              
              assert.strictEqual(left, right);
            }
          )
        )
      );
    })
  );
  
  // Law: Left identity
  it.effect("Effect.succeed should be left identity", () =>
    Effect.gen(function* () {
      yield* Effect.promise(() =>
        fc.assert(
          fc.asyncProperty(
            fc.integer(),
            async (a) => {
              const f = (x: number) => Effect.succeed(x * 2);
              
              const left = yield* Effect.succeed(a).pipe(Effect.flatMap(f));
              const right = yield* f(a);
              
              assert.strictEqual(left, right);
            }
          )
        )
      );
    })
  );
});
```

### 2.2 Testing Business Invariants

```typescript
describe("Shopping Cart Invariants", () => {
  it.effect("cart total should always equal sum of item prices", () =>
    Effect.gen(function* () {
      const cart = yield* ShoppingCart;
      
      yield* Effect.promise(() =>
        fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                productId: fc.string(),
                quantity: fc.integer({ min: 1, max: 10 }),
                price: fc.float({ min: 0.01, max: 1000, noNaN: true })
              }),
              { maxLength: 20 }
            ),
            async (items) => {
              yield* cart.clear();
              
              // Add all items
              for (const item of items) {
                yield* cart.addItem(item.productId, item.quantity, item.price);
              }
              
              // Get calculated total
              const total = yield* cart.getTotal();
              
              // Calculate expected total
              const expected = items.reduce(
                (sum, item) => sum + item.quantity * item.price,
                0
              );
              
              // Allow for floating-point precision
              assert.isTrue(Math.abs(total - expected) < 0.01);
            }
          )
        )
      );
    }).pipe(Effect.provide(ShoppingCartFakeLayer))
  );
  
  it.effect("removing items should decrease quantity", () =>
    Effect.gen(function* () {
      const cart = yield* ShoppingCart;
      
      yield* Effect.promise(() =>
        fc.assert(
          fc.asyncProperty(
            fc.record({
              productId: fc.string(),
              initialQty: fc.integer({ min: 5, max: 100 }),
              removeQty: fc.integer({ min: 1, max: 4 })
            }),
            async ({ productId, initialQty, removeQty }) => {
              yield* cart.clear();
              yield* cart.addItem(productId, initialQty, 10.00);
              yield* cart.removeItem(productId, removeQty);
              
              const item = yield* cart.getItem(productId);
              assert.strictEqual(item.quantity, initialQty - removeQty);
            }
          )
        )
      );
    }).pipe(Effect.provide(ShoppingCartFakeLayer))
  );
});
```

### 2.3 Testing Round-Trip Properties (Isomorphisms)

```typescript
describe("Serialization Round-Trip", () => {
  it.effect("encode/decode should be identity", () =>
    Effect.gen(function* () {
      const arb = Arbitrary.make(User);
      
      yield* Effect.promise(() =>
        fc.assert(
          fc.asyncProperty(
            fc.effect(arb),
            async (original) => {
              // Encode to JSON
              const encoded = yield* Schema.encode(User)(original);
              
              // Decode back
              const decoded = yield* Schema.decodeUnknown(User)(encoded);
              
              // Should be identical
              assert.deepStrictEqual(decoded, original);
            }
          )
        )
      );
    })
  );
  
  it.effect("save/load should preserve data", () =>
    Effect.gen(function* () {
      const repo = yield* UserRepository;
      const arb = Arbitrary.make(User);
      
      yield* Effect.promise(() =>
        fc.assert(
          fc.asyncProperty(
            fc.effect(arb),
            async (user) => {
              yield* repo.save(user);
              const loaded = yield* repo.findById(user.id);
              
              // Should be identical
              assert.deepStrictEqual(loaded, user);
            }
          )
        )
      );
    }).pipe(Effect.provide(UserRepositoryFakeLayer))
  );
});
```

### 2.4 Testing Idempotency

```typescript
describe("Idempotency Properties", () => {
  it.effect("operations should be idempotent", () =>
    Effect.gen(function* () {
      const service = yield* UserService;
      const arb = Arbitrary.make(User);
      
      yield* Effect.promise(() =>
        fc.assert(
          fc.asyncProperty(
            fc.effect(arb),
            async (user) => {
              // First operation
              const result1 = yield* service.updateUser(user);
              
              // Second operation (same input)
              const result2 = yield* service.updateUser(user);
              
              // Results should be identical
              assert.deepStrictEqual(result1, result2);
            }
          )
        )
      );
    }).pipe(Effect.provide(TestLayer))
  );
});
```

### 2.5 Testing Monotonicity

```typescript
describe("Monotonicity Properties", () => {
  it.effect("priority queue should maintain ordering", () =>
    Effect.gen(function* () {
      const queue = yield* PriorityQueue;
      
      yield* Effect.promise(() =>
        fc.assert(
          fc.asyncProperty(
            fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 10 }),
            async (priorities) => {
              yield* queue.clear();
              
              // Add items with random priorities
              for (const priority of priorities) {
                yield* queue.enqueue(`item-${priority}`, priority);
              }
              
              // Dequeue all items
              const dequeued: number[] = [];
              while (true) {
                const item = yield* queue.dequeue();
                if (!item) break;
                dequeued.push(item.priority);
              }
              
              // Should be in descending order (highest priority first)
              for (let i = 1; i < dequeued.length; i++) {
                assert.isTrue(dequeued[i - 1] >= dequeued[i]);
              }
            }
          )
        )
      );
    }).pipe(Effect.provide(PriorityQueueFakeLayer))
  );
});
```

---

## Part 3: Advanced Testing Artifacts

### 3.1 Inspection APIs (Observing Internal State)

**Build rich inspection capabilities into your fakes:**

```typescript
// services/UserRepository.fake.ts
export class UserRepositoryFake extends Effect.Service<UserRepositoryFake>()(
  "app/UserRepositoryFake",
  {
    effect: Effect.gen(function* () {
      const store = yield* Ref.make(new Map<UserId, User>());
      const events = yield* Ref.make<Array<RepositoryEvent>>([]);
      
      const logEvent = (event: RepositoryEvent) =>
        Ref.update(events, (evts) => [...evts, event]);
      
      return {
        // 🔹 Production API
        save: (user: User) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(store);
            if (map.has(user.id)) {
              return yield* Effect.fail(new DuplicateUserError({ id: user.id }));
            }
            yield* Ref.update(store, (m) => new Map(m).set(user.id, user));
            yield* logEvent({ type: "save", userId: user.id, timestamp: new Date() });
          }),
        
        findById: (id: UserId) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(store);
            yield* logEvent({ type: "findById", userId: id, timestamp: new Date() });
            
            if (!map.has(id)) {
              return yield* Effect.fail(new UserNotFoundError({ id }));
            }
            return map.get(id)!;
          }),
        
        // 🔍 Inspection API (test-only)
        getUserCount: () =>
          Ref.get(store).pipe(Effect.map((map) => map.size)),
        
        exportState: () =>
          Ref.get(store).pipe(Effect.map((map) => Array.from(map.values()))),
        
        getEvents: () => Ref.get(events),
        
        getEventsByType: (type: string) =>
          Ref.get(events).pipe(
            Effect.map((evts) => evts.filter((e) => e.type === type))
          ),
        
        wasUserSaved: (id: UserId) =>
          Ref.get(events).pipe(
            Effect.map((evts) =>
              evts.some((e) => e.type === "save" && e.userId === id)
            )
          ),
        
        clear: () =>
          Effect.all([
            Ref.set(store, new Map()),
            Ref.set(events, [])
          ]).pipe(Effect.asVoid),
        
        // Snapshot for testing
        createSnapshot: () =>
          Effect.all({
            users: Ref.get(store),
            events: Ref.get(events)
          })
      };
    })
  }
) {}

// Usage in tests
it.effect("should track all repository operations", () =>
  Effect.gen(function* () {
    const fake = yield* UserRepositoryFake;
    const repo = yield* UserRepository;
    
    const user1 = UserBuilder.create().build();
    const user2 = UserBuilder.create().withEmail("another@example.com").build();
    
    yield* repo.save(user1);
    yield* repo.save(user2);
    yield* repo.findById(user1.id);
    
    // Inspect events
    const events = yield* fake.getEvents();
    assert.strictEqual(events.length, 3);
    assert.strictEqual(events.filter((e) => e.type === "save").length, 2);
    
    // Verify specific operation occurred
    const wasSaved = yield* fake.wasUserSaved(user1.id);
    assert.isTrue(wasSaved);
  }).pipe(Effect.provide(UserRepositoryFakeLayer))
);
```

### 3.2 Failure Injection (Controlled Error Simulation)

**Programmatically inject failures to test error handling:**

```typescript
// services/PaymentGateway.fake.ts
export class PaymentGatewayFake extends Effect.Service<PaymentGatewayFake>()(
  "app/PaymentGatewayFake",
  {
    effect: Effect.gen(function* () {
      const failureMode = yield* Ref.make<FailureMode>("none");
      const failureCount = yield* Ref.make(0);
      const payments = yield* Ref.make<Array<Payment>>([]);
      
      return {
        // Production API
        processPayment: (amount: number, method: PaymentMethod) =>
          Effect.gen(function* () {
            const mode = yield* Ref.get(failureMode);
            
            // Inject failures based on mode
            switch (mode) {
              case "timeout":
                return yield* Effect.sleep(Duration.seconds(30)).pipe(
                  Effect.flatMap(() => Effect.die(new Error("Timeout")))
                );
              
              case "transient":
                const count = yield* Ref.get(failureCount);
                if (count < 2) {
                  yield* Ref.update(failureCount, (n) => n + 1);
                  return yield* Effect.fail(new PaymentTransientError());
                }
                break;
              
              case "permanent":
                return yield* Effect.fail(new PaymentDeclinedError({ amount }));
              
              case "random":
                if (Math.random() < 0.3) {
                  return yield* Effect.fail(new PaymentTransientError());
                }
                break;
            }
            
            // Successful payment
            const payment = new Payment({
              id: PaymentId.make(crypto.randomUUID()),
              amount,
              method,
              status: "completed",
              timestamp: new Date()
            });
            
            yield* Ref.update(payments, (ps) => [...ps, payment]);
            return payment;
          }),
        
        // Failure injection API
        setFailureMode: (mode: FailureMode) =>
          Effect.all([
            Ref.set(failureMode, mode),
            Ref.set(failureCount, 0)
          ]).pipe(Effect.asVoid),
        
        clearFailureMode: () =>
          Ref.set(failureMode, "none"),
        
        // Inspection API
        getPaymentHistory: () => Ref.get(payments),
        
        clear: () =>
          Effect.all([
            Ref.set(payments, []),
            Ref.set(failureMode, "none"),
            Ref.set(failureCount, 0)
          ]).pipe(Effect.asVoid)
      };
    })
  }
) {}

// Usage
describe("Payment Retry Logic", () => {
  it.effect("should retry on transient failures", () =>
    Effect.gen(function* () {
      const fake = yield* PaymentGatewayFake;
      const gateway = yield* PaymentGateway;
      
      // Inject transient failure (fails first 2 attempts)
      yield* fake.setFailureMode("transient");
      
      // Should succeed after retries
      const result = yield* gateway.processPayment(100.00, "credit_card").pipe(
        Effect.retry({ times: 5 }),
        Effect.timeout(Duration.seconds(10))
      );
      
      assert.strictEqual(result.status, "completed");
    }).pipe(
      Effect.provide(PaymentGatewayFakeLayer),
      Effect.provide(TestContext.TestContext)
    )
  );
  
  it.effect("should fail fast on permanent errors", () =>
    Effect.gen(function* () {
      const fake = yield* PaymentGatewayFake;
      const gateway = yield* PaymentGateway;
      
      yield* fake.setFailureMode("permanent");
      
      const exit = yield* Effect.exit(
        gateway.processPayment(100.00, "credit_card").pipe(
          Effect.retry({ times: 5 })
        )
      );
      
      assert.isTrue(Exit.isFailure(exit));
      // Verify it failed on first attempt (no retries for permanent errors)
    }).pipe(Effect.provide(PaymentGatewayFakeLayer))
  );
});
```

### 3.3 Event Logging (Audit Trail for Debugging)

**Comprehensive event logging for post-mortem analysis:**

```typescript
// services/OrderService.fake.ts
export type OrderEvent =
  | { type: "order_created"; orderId: OrderId; timestamp: Date }
  | { type: "order_updated"; orderId: OrderId; from: OrderStatus; to: OrderStatus }
  | { type: "payment_processed"; orderId: OrderId; amount: number }
  | { type: "inventory_reserved"; orderId: OrderId; items: Array<OrderItem> }
  | { type: "shipment_scheduled"; orderId: OrderId; carrier: string };

export class OrderServiceFake extends Effect.Service<OrderServiceFake>()(
  "app/OrderServiceFake",
  {
    effect: Effect.gen(function* () {
      const orders = yield* Ref.make(new Map<OrderId, Order>());
      const events = yield* Ref.make<Array<OrderEvent>>([]);
      
      const logEvent = (event: OrderEvent) =>
        Ref.update(events, (evts) => [...evts, event]);
      
      return {
        createOrder: (input: CreateOrderInput) =>
          Effect.gen(function* () {
            const order = new Order({
              id: OrderId.make(crypto.randomUUID()),
              userId: input.userId,
              items: input.items,
              status: "pending",
              createdAt: new Date()
            });
            
            yield* Ref.update(orders, (m) => new Map(m).set(order.id, order));
            yield* logEvent({
              type: "order_created",
              orderId: order.id,
              timestamp: new Date()
            });
            
            return order;
          }),
        
        // Event query API
        getEventTimeline: () => Ref.get(events),
        
        getEventsForOrder: (orderId: OrderId) =>
          Ref.get(events).pipe(
            Effect.map((evts) =>
              evts.filter((e) => "orderId" in e && e.orderId === orderId)
            )
          ),
        
        getEventsByType: <T extends OrderEvent["type"]>(type: T) =>
          Ref.get(events).pipe(
            Effect.map((evts) =>
              evts.filter((e) => e.type === type) as Array<Extract<OrderEvent, { type: T }>>
            )
          ),
        
        exportEventLog: () =>
          Ref.get(events).pipe(
            Effect.map((evts) =>
              evts.map((e) => JSON.stringify(e)).join("\n")
            )
          )
      };
    })
  }
) {}

// Usage - Debug complex workflows
it.effect("should track complete order fulfillment flow", () =>
  Effect.gen(function* () {
    const fake = yield* OrderServiceFake;
    const service = yield* OrderService;
    
    const order = yield* service.createOrder({
      userId: UserId.make("user-1"),
      items: [{ productId: "prod-1", quantity: 2 }]
    });
    
    yield* service.processPayment(order.id);
    yield* service.reserveInventory(order.id);
    yield* service.scheduleShipment(order.id);
    
    // Get complete event timeline
    const timeline = yield* fake.getEventTimeline();
    
    // Verify event sequence
    assert.strictEqual(timeline[0].type, "order_created");
    assert.strictEqual(timeline[1].type, "payment_processed");
    assert.strictEqual(timeline[2].type, "inventory_reserved");
    assert.strictEqual(timeline[3].type, "shipment_scheduled");
    
    // Export for debugging
    const log = yield* fake.exportEventLog();
    console.log("Event Log:\n", log);
  }).pipe(Effect.provide(OrderServiceFakeLayer))
);
```

### 3.4 Snapshot Testing (State Verification)

**Capture and compare complete state snapshots:**

```typescript
// test/helpers/snapshot.ts
export const createSnapshotMatcher = <S>(
  normalizer?: (state: S) => unknown
) => ({
  assertMatchesSnapshot: (state: S, snapshotName: string) =>
    Effect.gen(function* () {
      const normalized = normalizer ? normalizer(state) : state;
      const snapshot = JSON.stringify(normalized, null, 2);
      
      // In real implementation, compare with saved snapshot file
      // For now, just log it
      console.log(`Snapshot: ${snapshotName}\n`, snapshot);
      
      // Could use libraries like jest-snapshot or custom implementation
    })
});

// Usage
describe("Order State Transitions", () => {
  const snapshots = createSnapshotMatcher<OrderState>();
  
  it.effect("should transition through all states correctly", () =>
    Effect.gen(function* () {
      const service = yield* OrderService;
      const fake = yield* OrderServiceFake;
      
      const order = yield* service.createOrder({
        userId: UserId.make("user-1"),
        items: [{ productId: "prod-1", quantity: 1 }]
      });
      
      // Snapshot 1: After creation
      let state = yield* fake.createSnapshot();
      yield* snapshots.assertMatchesSnapshot(state, "after-creation");
      
      // Process payment
      yield* service.processPayment(order.id);
      state = yield* fake.createSnapshot();
      yield* snapshots.assertMatchesSnapshot(state, "after-payment");
      
      // Ship order
      yield* service.shipOrder(order.id);
      state = yield* fake.createSnapshot();
      yield* snapshots.assertMatchesSnapshot(state, "after-shipping");
    }).pipe(Effect.provide(TestLayer))
  );
});
```

---

## Part 4: Testing Strategies by Category

### 4.1 Concurrency Correctness

```typescript
describe("Concurrency Safety", () => {
  it.effect("should handle race conditions correctly", () =>
    Effect.gen(function* () {
      const account = yield* BankAccount;
      
      // Initial balance
      yield* account.deposit(1000);
      
      // Simulate 100 concurrent withdrawals
      const results = yield* Effect.all(
        Array.from({ length: 100 }, () => account.withdraw(10)),
        { concurrency: "unbounded" }
      );
      
      // All should succeed (1000 / 10 = 100 operations)
      assert.strictEqual(results.filter((r) => r.success).length, 100);
      
      // Final balance should be exactly 0
      const balance = yield* account.getBalance();
      assert.strictEqual(balance, 0);
    }).pipe(
      Effect.provide(BankAccountFakeLayer),
      Effect.provide(TestContext.TestContext)
    )
  );
  
  it.effect("should prevent double-spending", () =>
    Effect.gen(function* () {
      const account = yield* BankAccount;
      yield* account.deposit(100);
      
      // Try to withdraw more than available concurrently
      const results = yield* Effect.all(
        [
          account.withdraw(80),
          account.withdraw(80)
        ],
        { concurrency: "unbounded" }
      ).pipe(Effect.either);
      
      // Only one should succeed
      if (Either.isRight(results)) {
        const successes = results.right.filter((r) => r.success);
        assert.strictEqual(successes.length, 1);
      }
    }).pipe(
      Effect.provide(BankAccountFakeLayer),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

### 4.2 Temporal Correctness (Time-Based Behavior)

```typescript
describe("Time-Based Logic", () => {
  it.effect("should expire sessions after timeout", () =>
    Effect.gen(function* () {
      const testClock = yield* TestClock.TestClock;
      const sessionManager = yield* SessionManager;
      
      // Create session
      const session = yield* sessionManager.create("user-1");
      
      // Verify it's active
      const active = yield* sessionManager.isActive(session.id);
      assert.isTrue(active);
      
      // Fast-forward 29 minutes (just before expiry)
      yield* TestClock.adjust(Duration.minutes(29));
      const stillActive = yield* sessionManager.isActive(session.id);
      assert.isTrue(stillActive);
      
      // Fast-forward 2 more minutes (past 30-minute timeout)
      yield* TestClock.adjust(Duration.minutes(2));
      const expired = yield* sessionManager.isActive(session.id);
      assert.isFalse(expired);
    }).pipe(
      Effect.provide(SessionManagerFakeLayer),
      Effect.provide(TestContext.TestContext)
    )
  );
  
  it.effect("should retry with exponential backoff", () =>
    Effect.gen(function* () {
      const testClock = yield* TestClock.TestClock;
      const fake = yield* ExternalAPIFake;
      const api = yield* ExternalAPI;
      
      // Inject transient failures
      yield* fake.setFailureMode("transient");
      
      // Track retry times
      const retryTimes: number[] = [];
      
      const operation = api.makeRequest().pipe(
        Effect.retry({
          schedule: Schedule.exponential(Duration.seconds(1))
        }),
        Effect.tap(() =>
          Effect.sync(() => {
            retryTimes.push(Date.now());
          })
        )
      );
      
      // Run operation in background
      const fiber = yield* Effect.fork(operation);
      
      // Advance time and observe retry intervals
      yield* TestClock.adjust(Duration.seconds(1)); // First retry
      yield* TestClock.adjust(Duration.seconds(2)); // Second retry
      yield* TestClock.adjust(Duration.seconds(4)); // Third retry
      
      yield* Fiber.await(fiber);
      
      // Verify exponential backoff
      assert.strictEqual(retryTimes.length, 3);
    }).pipe(
      Effect.provide(ExternalAPIFakeLayer),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

### 4.3 Chaos Engineering (Resilience Testing)

```typescript
// test/chaos/chaos.config.ts
export class ChaosConfig extends Context.Tag("ChaosConfig")
  ChaosConfig,
  {
    readonly failureRate: number; // 0-1
    readonly latencyMs: [number, number]; // [min, max]
    readonly enabled: boolean;
  }
>() {}

// test/chaos/ChaosService.ts
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

    const chaosImpl = {} as Effect.Service.Success<S>;

    for (const op of operations) {
      const original = impl[op];
      
      if (typeof original === "function") {
        chaosImpl[op] = ((...args: Array<unknown>) =>
          Effect.gen(function* () {
            // Random latency injection
            const [min, max] = config.latencyMs;
            const latency = min + Math.random() * (max - min);
            yield* Effect.sleep(Duration.millis(latency));

            // Random failure injection
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

// Usage
describe("Chaos Testing", () => {
  const ChaosLayer = Layer.succeed(ChaosConfig, {
    failureRate: 0.3, // 30% failure rate
    latencyMs: [100, 2000],
    enabled: true
  });

  const ChaosUserService = Layer.effect(
    UserService,
    makeChaosService(UserService, ["registerUser", "updateProfile"])
  ).pipe(Layer.provide(ChaosLayer));

  it.effect("should handle chaos gracefully", () =>
    Effect.gen(function* () {
      const service = yield* UserService;

      // Should eventually succeed despite chaos
      const user = yield* service.registerUser({
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

      assert.isDefined(user);
    }).pipe(
      Effect.provide(ChaosUserService),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

### 4.4 Load Testing (Performance Validation)

```typescript
describe("Load Testing", () => {
  it.effect("should handle 1000 concurrent operations", () =>
    Effect.gen(function* () {
      const service = yield* UserService;
      const startTime = yield* Clock.currentTimeMillis;
      
      // Generate 1000 unique users
      const users = Array.from({ length: 1000 }, (_, i) =>
        UserBuilder.create()
          .withEmail(`user${i}@example.com`)
          .build()
      );
      
      // Register all concurrently
      yield* Effect.all(
        users.map((u) => service.registerUser(u)),
        { concurrency: "unbounded" }
      );
      
      const endTime = yield* Clock.currentTimeMillis;
      const duration = endTime - startTime;
      
      // Verify all users created
      const count = yield* service.getUserCount();
      assert.strictEqual(count, 1000);
      
      // Performance assertion (adjust based on requirements)
      console.log(`1000 users registered in ${duration}ms`);
      assert.isTrue(duration < 5000); // Should complete in under 5 seconds
    }).pipe(
      Effect.provide(TestLayer),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

---

## Part 5: Complete Testing Workflow

### The 7-Phase Testing Strategy

```typescript
// Phase 1: Type-Level (Compile-Time)
export type UserId = string & Brand.Brand<"UserId">;
// ✅ Checkpoint: Types compile, branded types prevent mixing

// Phase 2: Schema Validation (Parse-Time)
export class User extends Schema.Class<User>("User")({
  id: UserId,
  email: EmailAddress,
  age: PositiveInt
}) {}
// ✅ Checkpoint: Schemas parse correctly, property-based tests pass

// Phase 3: Contract Tests (Behavior)
runUserRepositoryContractTests("Fake", UserRepositoryFakeLayer);
// ✅ Checkpoint: All contract tests pass with fake

// Phase 4: Implementation Tests
runUserRepositoryContractTests("Production", UserRepositoryLive);
// ✅ Checkpoint: Production passes same contract tests

// Phase 5: Integration Tests
describe("User Registration Flow", () => {
  it.effect("should register user and send email", () => { /* ... */ });
});
// ✅ Checkpoint: Services compose correctly

// Phase 6: Chaos & Load Tests
describe("Resilience", () => {
  it.effect("should survive 30% failure rate", () => { /* ... */ });
});
// ✅ Checkpoint: System handles failures gracefully

// Phase 7: E2E Tests
describe("API End-to-End", () => {
  it.effect("POST /users should create user", () => { /* ... */ });
});
// ✅ Checkpoint: Full stack works in production-like environment
```

### Test Execution Matrix

```typescript
// package.json scripts
{
  "test:unit": "vitest run --testPathPattern='\\.(test|spec)\\.ts$'",
  "test:contract": "vitest run --testPathPattern='\\.contract\\.test\\.ts$'",
  "test:integration": "vitest run --testPathPattern='\\.integration\\.test\\.ts$'",
  "test:property": "vitest run --testPathPattern='\\.property\\.test\\.ts$'",
  "test:chaos": "vitest run test/chaos",
  "test:load": "vitest run test/load",
  "test:e2e": "vitest run test/e2e",
  "test:all": "vitest run"
}
```

---

## Key Takeaways

1. **Schema-based generation** is the foundation - use `Arbitrary.make(Schema)` for automatic test data
2. **Builders** for explicit scenarios, **Factories** for complex graphs, **Arbitraries** for exhaustive testing
3. **Property-based testing** catches edge cases traditional tests miss - use for invariants, laws, and round-trips
4. **Rich fakes** with inspection APIs, failure injection, and event logging are production-quality test infrastructure
5. **Multi-layered testing** catches bugs at the right level - types, schemas, contracts, integration, E2E
6. **Chaos engineering** and **load testing** validate resilience before production
7. **TestContext** provides deterministic time, concurrency, and randomness for reliable tests

**The ultimate goal:** Build confidence through layered validation, catching bugs as early as possible in the development cycle.
