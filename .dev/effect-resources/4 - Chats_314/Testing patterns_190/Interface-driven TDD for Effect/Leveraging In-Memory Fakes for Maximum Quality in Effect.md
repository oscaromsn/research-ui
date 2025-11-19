---
modified: 2025-10-20T17:54:59-03:00
---
# Leveraging In-Memory Fakes for Maximum Quality in Effect

Excellent question! In-memory fakes are actually **the secret weapon** for building bulletproof Effect applications. Let me show you how to use them as first-class implementations, not just test doubles.

## The Core Philosophy: Fakes as Production-Quality Implementations

**Key insight:** Your in-memory fake should be indistinguishable from production except for persistence. It should:
- Handle all the same error cases
- Support the same concurrency semantics
- Implement the same business rules
- Be fast enough to use in development

This gives you a **local-first, deterministic development environment** that's perfect for debugging.

## Pattern 1: Rich, Inspectable Fakes with Assertion APIs

Create fakes that expose their internal state for verification, but only through a separate testing interface:

```typescript
// services/EmailService.ts
export class EmailService extends Effect.Service<EmailService>()("app/EmailService", {
  effect: Effect.gen(function* () {
    return {
      send: (to: string, subject: string, body: string): Effect.Effect<void, SendError> =>
        Effect.die("Not implemented"),
    };
  }),
}) {}

// services/EmailService.fake.ts
export class EmailServiceFake extends Effect.Service<EmailServiceFake>()(
  "app/EmailServiceFake",
  {
    effect: Effect.gen(function* () {
      // Internal state for tracking
      const sentEmails = yield* Ref.make
        Array<{
          to: string;
          subject: string;
          body: string;
          sentAt: Date;
        }>
      >([]);
      
      const failNextSend = yield* Ref.make(false);

      // Implement the production interface
      const emailService: Effect.Service.Success<typeof EmailService> = {
        send: (to, subject, body) =>
          Effect.gen(function* () {
            // Check if we should simulate failure
            const shouldFail = yield* Ref.get(failNextSend);
            if (shouldFail) {
              yield* Ref.set(failNextSend, false);
              return yield* Effect.fail(new SendError({ reason: "Simulated failure" }));
            }

            // Record the email
            yield* Ref.update(sentEmails, (emails) => [
              ...emails,
              { to, subject, body, sentAt: new Date() },
            ]);
            
            yield* Effect.log(`📧 Fake email sent to ${to}: ${subject}`);
          }),
      };

      // Testing/inspection interface (separate from production contract)
      const inspectionAPI = {
        // Query methods
        getAllSentEmails: () => Ref.get(sentEmails),
        
        getEmailsSentTo: (email: string) =>
          Effect.map(
            Ref.get(sentEmails),
            (emails) => emails.filter((e) => e.to === email)
          ),
        
        wasEmailSent: (predicate: (email: typeof sentEmails extends Ref.Ref<Array<infer T>> ? T : never) => boolean) =>
          Effect.map(
            Ref.get(sentEmails),
            (emails) => emails.some(predicate)
          ),
        
        getEmailCount: () =>
          Effect.map(Ref.get(sentEmails), (emails) => emails.length),

        // Control methods for testing edge cases
        simulateNextSendFailure: () => Ref.set(failNextSend, true),
        
        clear: () => Ref.set(sentEmails, []),
      };

      return {
        ...emailService,
        ...inspectionAPI,
      };
    }),
  }
) {}

// Provide the fake as the real service
export const EmailServiceFakeLayer = Layer.effect(
  EmailService,
  Effect.map(EmailServiceFake, (fake) => ({
    send: fake.send,
  }))
).pipe(Layer.provideMerge(Layer.effect(EmailServiceFake, EmailServiceFake.make)));

// Usage in tests
it.effect("should send welcome email with correct subject", () =>
  Effect.gen(function* () {
    const userService = yield* UserService;
    const emailFake = yield* EmailServiceFake;
    
    yield* userService.register({
      email: "newuser@example.com",
      name: "New User",
    });
    
    // Rich assertions on the fake
    const emails = yield* emailFake.getEmailsSentTo("newuser@example.com");
    assert.strictEqual(emails.length, 1);
    assert.strictEqual(emails[0].subject, "Welcome to Our Platform!");
    assert.include(emails[0].body, "New User");
    
    // Verify no other emails were sent
    const totalEmails = yield* emailFake.getEmailCount();
    assert.strictEqual(totalEmails, 1);
  }).pipe(Effect.provide(TestLayer))
);
```

## Pattern 2: Deterministic Fakes with `TestContext`

Use Effect's `TestContext` to make time-dependent behavior fully deterministic:

```typescript
// services/RateLimiter.fake.ts
export class RateLimiterFake extends Effect.Service<RateLimiterFake>()(
  "app/RateLimiterFake",
  {
    effect: Effect.gen(function* () {
      // Track requests with timestamps from TestClock
      const requests = yield* Ref.make<Map<string, Array<number>>>(new Map());
      const testClock = yield* TestClock.TestClock;

      const rateLimiter = {
        checkLimit: (userId: string, limit: number, windowMs: number): Effect.Effect<void, RateLimitError> =>
          Effect.gen(function* () {
            const now = yield* Clock.currentTimeMillis;
            const userRequests = yield* Ref.get(requests).pipe(
              Effect.map((map) => map.get(userId) ?? [])
            );

            // Filter requests within the window
            const windowStart = now - windowMs;
            const recentRequests = userRequests.filter((time) => time >= windowStart);

            if (recentRequests.length >= limit) {
              return yield* Effect.fail(
                new RateLimitError({
                  userId,
                  retryAfter: windowMs - (now - recentRequests[0]),
                })
              );
            }

            // Record this request
            yield* Ref.update(requests, (map) =>
              new Map(map).set(userId, [...recentRequests, now])
            );
          }),
      };

      const inspectionAPI = {
        getRequestCount: (userId: string) =>
          Effect.map(
            Ref.get(requests),
            (map) => map.get(userId)?.length ?? 0
          ),
        
        clear: () => Ref.set(requests, new Map()),
      };

      return {
        ...rateLimiter,
        ...inspectionAPI,
      };
    }),
  }
) {}

// Test with deterministic time control
it.effect("should allow requests after time window expires", () =>
  Effect.gen(function* () {
    const limiter = yield* RateLimiterFake;
    const testClock = yield* TestClock.TestClock;
    
    const userId = "user-123";
    
    // Make 3 requests (limit is 3 per minute)
    yield* limiter.checkLimit(userId, 3, 60_000);
    yield* limiter.checkLimit(userId, 3, 60_000);
    yield* limiter.checkLimit(userId, 3, 60_000);
    
    // 4th request should fail
    const exit = yield* Effect.exit(
      limiter.checkLimit(userId, 3, 60_000)
    );
    assert.isTrue(Exit.isFailure(exit));
    
    // Advance time by 61 seconds
    yield* TestClock.adjust(Duration.seconds(61));
    
    // Now the request should succeed
    yield* limiter.checkLimit(userId, 3, 60_000);
    
    const count = yield* limiter.getRequestCount(userId);
    assert.strictEqual(count, 1); // Old requests expired
  }).pipe(
    Effect.provide(RateLimiterFakeLayer),
    Effect.provide(TestContext.TestContext)
  )
);
```

## Pattern 3: Fakes with Realistic Semantics (Eventual Consistency, Delays)

Make your fakes behave like real systems to catch integration issues:

```typescript
// services/SearchIndex.fake.ts
export class SearchIndexFake extends Effect.Service<SearchIndexFake>()(
  "app/SearchIndexFake",
  {
    effect: Effect.gen(function* () {
      const documents = yield* Ref.make<Map<string, Document>>(new Map());
      
      // Simulate indexing delay
      const indexingQueue = yield* Queue.bounded<Document>(100);
      
      // Background fiber to process indexing (simulates eventual consistency)
      yield* Effect.gen(function* () {
        while (true) {
          const doc = yield* Queue.take(indexingQueue);
          
          // Simulate indexing delay (configurable for tests)
          yield* Effect.sleep(Duration.millis(100));
          
          yield* Ref.update(documents, (map) => new Map(map).set(doc.id, doc));
          yield* Effect.log(`Indexed document: ${doc.id}`);
        }
      }).pipe(
        Effect.fork // Run in background
      );

      const searchIndex = {
        index: (doc: Document): Effect.Effect<void> =>
          Effect.gen(function* () {
            // Add to queue (returns immediately, like real search engines)
            const offered = yield* Queue.offer(indexingQueue, doc);
            if (!offered) {
              return yield* Effect.fail(new IndexError({ reason: "Queue full" }));
            }
          }),
        
        search: (query: string): Effect.Effect<Array<Document>, SearchError> =>
          Effect.gen(function* () {
            const docs = yield* Ref.get(documents);
            
            // Simple text matching
            const results = Array.from(docs.values()).filter((doc) =>
              doc.content.toLowerCase().includes(query.toLowerCase())
            );
            
            return results;
          }),
      };

      const inspectionAPI = {
        // Wait for all pending indexing to complete (for tests)
        waitForIndexing: () =>
          Effect.gen(function* () {
            const size = yield* Queue.size(indexingQueue);
            if (size === 0) return;
            
            // Wait for queue to drain
            yield* Effect.sleep(Duration.millis(size * 150));
          }),
        
        getDocumentCount: () =>
          Effect.map(Ref.get(documents), (map) => map.size),
        
        clear: () =>
          Effect.gen(function* () {
            yield* Queue.takeAll(indexingQueue); // Clear queue
            yield* Ref.set(documents, new Map());
          }),
      };

      return {
        ...searchIndex,
        ...inspectionAPI,
      };
    }),
  }
) {}

// Test eventual consistency
it.effect("should handle eventual consistency in search", () =>
  Effect.gen(function* () {
    const searchIndex = yield* SearchIndexFake;
    
    const doc = new Document({
      id: "doc-1",
      title: "Effect Tutorial",
      content: "Learn Effect-TS framework",
    });
    
    yield* searchIndex.index(doc);
    
    // Immediately searching should return empty (not yet indexed)
    const immediateResults = yield* searchIndex.search("Effect");
    assert.strictEqual(immediateResults.length, 0);
    
    // Wait for indexing to complete
    yield* searchIndex.waitForIndexing();
    
    // Now it should be found
    const finalResults = yield* searchIndex.search("Effect");
    assert.strictEqual(finalResults.length, 1);
    assert.strictEqual(finalResults[0].id, "doc-1");
  }).pipe(
    Effect.provide(SearchIndexFakeLayer),
    Effect.provide(TestContext.TestContext)
  )
);
```

## Pattern 4: Property-Based Testing with Fakes

Use `fast-check` with Effect to test invariants:

```typescript
import * as fc from "fast-check";
import { Effect } from "effect";

// Test that the fake maintains invariants
it.effect("cart total should always equal sum of item prices", () =>
  Effect.gen(function* () {
    const cart = yield* ShoppingCartFake;
    
    // Generate random operations
    yield* Effect.promise(() =>
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              action: fc.constantFrom("add", "remove", "updateQuantity"),
              productId: fc.string(),
              quantity: fc.integer({ min: 1, max: 10 }),
              price: fc.float({ min: 0.01, max: 1000, noNaN: true }),
            }),
            { maxLength: 50 }
          ),
          async (operations) => {
            yield* cart.clear();
            
            // Apply all operations
            for (const op of operations) {
              if (op.action === "add") {
                yield* cart.addItem(op.productId, op.quantity, op.price).pipe(
                  Effect.catchAll(() => Effect.void) // Ignore errors
                );
              } else if (op.action === "remove") {
                yield* cart.removeItem(op.productId).pipe(
                  Effect.catchAll(() => Effect.void)
                );
              } else {
                yield* cart.updateQuantity(op.productId, op.quantity).pipe(
                  Effect.catchAll(() => Effect.void)
                );
              }
            }
            
            // Verify invariant: total = sum of (quantity * price)
            const items = yield* cart.getItems();
            const expectedTotal = items.reduce(
              (sum, item) => sum + item.quantity * item.price,
              0
            );
            const actualTotal = yield* cart.getTotal();
            
            assert.approximately(actualTotal, expectedTotal, 0.01);
          }
        )
      )
    );
  }).pipe(Effect.provide(ShoppingCartFakeLayer))
);
```

## Pattern 5: Fake-First Development Workflow

Use fakes as your **primary development environment**:

```typescript
// src/layers/development.ts
import { Layer } from "effect";

// Compose ALL services using fakes
export const DevelopmentLayer = Layer.mergeAll(
  UserRepositoryFake.Default,
  EmailServiceFake.Default,
  PaymentServiceFake.Default,
  SearchIndexFake.Default,
  CacheFake.Default
).pipe(
  Layer.provide(ConfigFake.Default)
);

// src/layers/production.ts
export const ProductionLayer = Layer.mergeAll(
  UserRepositoryLive.Default,
  EmailServiceLive.Default,
  PaymentServiceLive.Default,
  SearchIndexLive.Default,
  CacheLive.Default
).pipe(
  Layer.provide(ConfigLive.Default)
);

// src/main.ts
const layer = process.env.NODE_ENV === "production" 
  ? ProductionLayer 
  : DevelopmentLayer;

const program = myApplication.pipe(Effect.provide(layer));
```

**Benefits:**
- Start app instantly (no database, no external services)
- Deterministic behavior for debugging
- Fast iteration cycle
- Can work offline

## Pattern 6: Snapshot Testing with Fakes

Capture and replay entire system states:

```typescript
// services/Database.fake.ts
export class DatabaseFake extends Effect.Service<DatabaseFake>()(
  "app/DatabaseFake",
  {
    effect: Effect.gen(function* () {
      const tables = yield* Ref.make<Map<string, Map<string, unknown>>>(new Map());

      const db = {
        insert: (table: string, id: string, record: unknown) =>
          Ref.update(tables, (map) => {
            const tableData = map.get(table) ?? new Map();
            tableData.set(id, record);
            return new Map(map).set(table, tableData);
          }),
        
        query: (table: string, id: string) =>
          Effect.flatMap(
            Ref.get(tables),
            (map) => {
              const record = map.get(table)?.get(id);
              return record 
                ? Effect.succeed(record)
                : Effect.fail(new NotFoundError({ table, id }));
            }
          ),
      };

      const inspectionAPI = {
        // Snapshot the entire database state
        snapshot: () =>
          Effect.map(
            Ref.get(tables),
            (map) => JSON.stringify(Array.from(map.entries()))
          ),
        
        // Restore from snapshot
        restore: (snapshot: string) =>
          Ref.set(
            tables,
            new Map(JSON.parse(snapshot))
          ),
        
        // Export for debugging
        exportState: () =>
          Effect.map(
            Ref.get(tables),
            (map) => {
              const result: Record<string, Record<string, unknown>> = {};
              for (const [tableName, tableData] of map.entries()) {
                result[tableName] = Object.fromEntries(tableData.entries());
              }
              return result;
            }
          ),
      };

      return {
        ...db,
        ...inspectionAPI,
      };
    }),
  }
) {}

// Snapshot testing
it.effect("should produce expected database state after workflow", () =>
  Effect.gen(function* () {
    const db = yield* DatabaseFake;
    const workflow = yield* OrderWorkflow;
    
    yield* workflow.processOrder(sampleOrder);
    
    const state = yield* db.exportState();
    
    // Compare with saved snapshot
    const expectedSnapshot = yield* readSnapshot("order-workflow");
    assert.deepStrictEqual(state, expectedSnapshot);
    
    // Or update snapshot
    // yield* saveSnapshot("order-workflow", state);
  }).pipe(Effect.provide(TestLayer))
);
```

## Pattern 7: Debuggable Fakes with Event Logs

Add comprehensive logging to fakes for debugging:

```typescript
// services/Cache.fake.ts
export class CacheFake extends Effect.Service<CacheFake>()(
  "app/CacheFake",
  {
    effect: Effect.gen(function* () {
      const cache = yield* Ref.make<Map<string, { value: unknown; expiresAt: number }>>(
        new Map()
      );
      
      // Event log for debugging
      const eventLog = yield* Ref.make
        Array<{
          type: "get" | "set" | "delete" | "expire";
          key: string;
          timestamp: number;
          details?: unknown;
        }>
      >([]);

      const logEvent = (type: typeof eventLog extends Ref.Ref<Array<infer T>> ? T["type"] : never, key: string, details?: unknown) =>
        Effect.gen(function* () {
          const now = yield* Clock.currentTimeMillis;
          yield* Ref.update(eventLog, (log) => [
            ...log,
            { type, key, timestamp: now, details },
          ]);
        });

      const cacheService = {
        get: (key: string) =>
          Effect.gen(function* () {
            yield* logEvent("get", key);
            
            const now = yield* Clock.currentTimeMillis;
            const entry = yield* Ref.get(cache).pipe(
              Effect.map((map) => map.get(key))
            );

            if (!entry) {
              yield* logEvent("get", key, { result: "miss" });
              return Option.none();
            }

            if (entry.expiresAt < now) {
              yield* logEvent("expire", key);
              yield* Ref.update(cache, (map) => {
                const newMap = new Map(map);
                newMap.delete(key);
                return newMap;
              });
              return Option.none();
            }

            yield* logEvent("get", key, { result: "hit" });
            return Option.some(entry.value);
          }),

        set: (key: string, value: unknown, ttlMs: number) =>
          Effect.gen(function* () {
            const now = yield* Clock.currentTimeMillis;
            yield* logEvent("set", key, { ttlMs });
            
            yield* Ref.update(cache, (map) =>
              new Map(map).set(key, {
                value,
                expiresAt: now + ttlMs,
              })
            );
          }),
      };

      const inspectionAPI = {
        getEventLog: () => Ref.get(eventLog),
        
        getStats: () =>
          Effect.map(Ref.get(eventLog), (log) => {
            const gets = log.filter((e) => e.type === "get");
            const hits = log.filter(
              (e) => e.type === "get" && e.details?.result === "hit"
            );
            
            return {
              totalRequests: gets.length,
              hits: hits.length,
              misses: gets.length - hits.length,
              hitRate: gets.length > 0 ? hits.length / gets.length : 0,
              expirations: log.filter((e) => e.type === "expire").length,
            };
          }),
        
        printEventLog: () =>
          Effect.gen(function* () {
            const log = yield* Ref.get(eventLog);
            console.table(log);
          }),
      };

      return {
        ...cacheService,
        ...inspectionAPI,
      };
    }),
  }
) {}

// Debug test with event inspection
it.effect("should have high cache hit rate", () =>
  Effect.gen(function* () {
    const cache = yield* CacheFake;
    const service = yield* UserService;
    
    // Make several requests
    yield* service.getUser(userId);
    yield* service.getUser(userId);
    yield* service.getUser(userId);
    
    // Inspect cache behavior
    const stats = yield* cache.getStats();
    yield* cache.printEventLog(); // Console output for debugging
    
    assert.isAtLeast(stats.hitRate, 0.66); // At least 2/3 cache hits
  }).pipe(Effect.provide(TestLayer))
);
```

## Pattern 8: Fakes with Failure Injection

Test error handling by injecting failures:

```typescript
// services/PaymentService.fake.ts
export class PaymentServiceFake extends Effect.Service<PaymentServiceFake>()(
  "app/PaymentServiceFake",
  {
    effect: Effect.gen(function* () {
      const processedPayments = yield* Ref.make<Map<string, Payment>>(new Map());
      
      // Failure injection controls
      const failureConfig = yield* Ref.make<{
        mode: "succeed" | "timeout" | "insufficient-funds" | "network-error";
        probability: number; // 0-1
      }>({ mode: "succeed", probability: 0 });

      const paymentService = {
        charge: (amount: number, cardToken: string): Effect.Effect<Payment, PaymentError> =>
          Effect.gen(function* () {
            // Check if we should inject a failure
            const config = yield* Ref.get(failureConfig);
            const shouldFail = Math.random() < config.probability;
            
            if (shouldFail && config.mode === "timeout") {
              yield* Effect.sleep(Duration.seconds(30)); // Simulate timeout
              return yield* Effect.fail(new PaymentError({ reason: "Timeout" }));
            }
            
            if (shouldFail && config.mode === "insufficient-funds") {
              return yield* Effect.fail(
                new PaymentError({ reason: "Insufficient funds" })
              );
            }
            
            if (shouldFail && config.mode === "network-error") {
              return yield* Effect.fail(
                new PaymentError({ reason: "Network error" })
              );
            }

            // Process payment normally
            const payment = new Payment({
              id: `payment-${Math.random()}`,
              amount,
              status: "completed",
              createdAt: new Date(),
            });
            
            yield* Ref.update(processedPayments, (map) =>
              new Map(map).set(payment.id, payment)
            );
            
            return payment;
          }),
      };

      const inspectionAPI = {
        // Configure failure injection
        simulateFailures: (
          mode: typeof failureConfig extends Ref.Ref<infer T> ? T["mode"] : never,
          probability: number
        ) => Ref.set(failureConfig, { mode, probability }),
        
        reset: () =>
          Effect.gen(function* () {
            yield* Ref.set(failureConfig, { mode: "succeed", probability: 0 });
            yield* Ref.set(processedPayments, new Map());
          }),
        
        getProcessedPayments: () => Ref.get(processedPayments),
      };

      return {
        ...paymentService,
        ...inspectionAPI,
      };
    }),
  }
) {}

// Test retry logic with injected failures
it.effect("should retry on transient failures", () =>
  Effect.gen(function* () {
    const payment = yield* PaymentServiceFake;
    
    // Inject 80% failure rate
    yield* payment.simulateFailures("network-error", 0.8);
    
    // Service should retry and eventually succeed
    const result = yield* Effect.retry(
      payment.charge(100, "tok_123"),
      Schedule.recurs(5)
    );
    
    assert.strictEqual(result.status, "completed");
  }).pipe(
    Effect.provide(PaymentServiceFakeLayer),
    Effect.provide(TestContext.TestContext)
  )
);
```

## Pattern 9: Shared Contract Test Suite

Write the contract tests once, run them against all implementations:

```typescript
// services/UserRepository.contract.test.ts
export const runUserRepositoryContractTests = (
  layerName: string,
  layer: Layer.Layer<UserRepository>
) => {
  describe(`UserRepository Contract: ${layerName}`, () => {
    it.effect("should save and retrieve user", () =>
      Effect.gen(function* () {
        const repo = yield* UserRepository;
        const user = createTestUser();
        
        yield* repo.save(user);
        const retrieved = yield* repo.findById(user.id);
        
        assert.deepStrictEqual(retrieved, user);
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

    it.effect("should handle concurrent writes correctly", () =>
      Effect.gen(function* () {
        const repo = yield* UserRepository;
        const users = Array.from({ length: 100 }, (_, i) =>
          createTestUser({ id: UserId.make(`user-${i}`) })
        );
        
        // Save all users concurrently
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
      }).pipe(Effect.provide(layer), Effect.provide(TestContext.TestContext))
    );

    // ... more contract tests ...
  });
};

// Run against fake
runUserRepositoryContractTests("Fake", UserRepositoryFake.Default);

// Run against production (integration tests)
runUserRepositoryContractTests(
  "Production",
  UserRepositoryLive.Default.pipe(
    Layer.provide(SqlClient.layer),
    Layer.provide(ConfigTest.layer)
  )
);
```

## The Complete Fake-First Workflow

```
1. Define Contract (Interface + Errors)
         ↓
2. Build Rich Fake Implementation
   - Inspection API
   - Failure injection
   - Event logging
   - Realistic semantics
         ↓
3. Write Contract Tests
   - Use fake for fast feedback
   - Property-based tests
   - Concurrency tests
         ↓
4. Develop Application Logic
   - Run locally with all fakes
   - Instant startup
   - Deterministic debugging
         ↓
5. Build Production Implementation
   - Must pass same contract tests
   - Integration tests verify real I/O
         ↓
6. Deploy with Confidence
   - Contract guarantees compatibility
   - Fakes remain for testing
```

## Benefits Summary

**Correctness:**
- Contract tests validate behavior, not implementation
- Property-based tests catch edge cases
- Shared test suite ensures all implementations are equivalent

**Verifiability:**
- Rich inspection APIs expose internal state
- Event logs provide audit trails
- Snapshot testing catches regressions

**Debuggability:**
- Deterministic time with `TestClock`
- Comprehensive event logging
- State inspection at any point
- Fast iteration (no real I/O)

**Testability:**
- Fast tests (in-memory, no I/O)
- Failure injection for error paths
- Concurrent test execution
- No test pollution (isolated state)

**The key insight:** Fakes are not shortcuts—they're **production-quality implementations optimized for development and testing**. They should be as robust as your production code, just faster and more inspectable.
