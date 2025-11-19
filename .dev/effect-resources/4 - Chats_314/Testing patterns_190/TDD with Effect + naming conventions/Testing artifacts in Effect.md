---
modified: 2025-10-26T20:21:31-03:00
---
# Testing artifacts in Effect

### 1. **Fixtures in Effect-TS**

Effect-TS fixtures should be created as **Layer compositions** that provide complete test environments:

```typescript
// Base fixture layer for common test dependencies
const createTestFixture = () => Layer.mergeAll(
  TestContext.TestContext,  // Provides TestClock, TestRandom, etc.
  DatabaseTestLayer,         // In-memory database
  LoggerTestLayer,           // Test logger
)

// Domain-specific fixtures using closures for state
const createRepositoryFixture = () => Layer.effect(
  UserRepository,
  Effect.sync(() => {
    const users: User[] = []  // Fixture state
    const defaultUsers = [     // Fixture data
      new User({ id: "1", name: "Alice" }),
      new User({ id: "2", name: "Bob" })
    ]
    users.push(...defaultUsers)
    
    return UserRepository.of({
      list: Effect.sync(() => users),
      create: (user) => /* implementation */
    })
  })
)
```

**Key principles:**
- Fixtures are **Layers**, not raw data
- Use **closure-based state** for isolation
- Compose fixtures with `Layer.mergeAll`
- Reset state between tests via new Layer instances

### 2. **Test Doubles Hierarchy**

#### **Stubs (Simple Returns)**
For services that just need to return values:

```typescript
const StubEmailService = Layer.succeed(
  EmailService,
  EmailService.of({
    send: () => Effect.succeed({ id: "stub-123", status: "sent" })
  })
)
```

#### **Mocks (Behavior Verification)**
Use the **Shadow Service pattern** for sophisticated mocks:

```typescript
// Define test service with tracking capabilities
class TestMailer extends Effect.Tag("TestMailer")
  TestMailer,
  {
    sentEmailTo: (email: EmailAddress) => Effect.Effect<boolean>
    callCount: () => Effect.Effect<number>
    reset: () => Effect.Effect<void>
  } & Context.Tag.Service<Mailer>  // Extends production interface
>() {}

// Implementation with state tracking
const makeTestMailer = Effect.sync(() => {
  const sentMails: Email[] = []
  
  return TestMailer.of({
    // Production interface
    sendEmail: (email) => Effect.sync(() => {
      sentMails.push(email)
    }),
    // Test-specific operations
    sentEmailTo: (email) => 
      Effect.sync(() => sentMails.some(m => m.recipient === email)),
    callCount: () => Effect.sync(() => sentMails.length),
    reset: () => Effect.sync(() => { sentMails.length = 0 })
  })
})

// Create shared instance layer
const MockMailerLayer = Layer.unwrapEffect(
  pipe(
    makeTestMailer,
    Effect.map(instance =>
      Layer.mergeAll(
        Layer.succeed(Mailer, instance),     // Production service
        Layer.succeed(TestMailer, instance),  // Test service
      )
    )
  )
)
```

#### **Fakes (Working Implementations)**
Full in-memory implementations that follow business rules:

```typescript
const FakeUserRepository = Layer.effect(
  UserRepository,
  Effect.sync(() => {
    const users = new Map<UserId, User>()
    
    return UserRepository.of({
      create: (user) => Effect.gen(function* () {
        if (users.has(user.id)) {
          return yield* Effect.fail(new DuplicateUserError({ userId: user.id }))
        }
        users.set(user.id, user)
        return user
      }),
      
      update: (id, data) => Effect.gen(function* () {
        const existing = users.get(id)
        if (!existing) {
          return yield* Effect.fail(new UserNotFoundError({ userId: id }))
        }
        // Implement optimistic concurrency
        if (existing.version !== data.version) {
          return yield* Effect.fail(new ConcurrentModificationError({
            userId: id,
            expectedVersion: data.version,
            actualVersion: existing.version
          }))
        }
        const updated = { ...existing, ...data, version: existing.version + 1 }
        users.set(id, updated)
        return updated
      })
    })
  })
)
```

### 3. **Contract Testing Pattern**

Define reusable test suites that ANY implementation must pass:

```typescript
const testRepositoryContract = (
  makeLayer: () => Layer.Layer<UserRepository>,
  description: string
) => {
  describe(description, () => {
    test("enforces optimistic concurrency", async () => {
      await Effect.gen(function* () {
        const repo = yield* UserRepository
        const user = yield* repo.create(testUser)
        
        // First update succeeds
        yield* repo.update(user.id, { name: "Updated", version: 1 })
        
        // Stale version fails
        const exit = yield* Effect.exit(
          repo.update(user.id, { name: "Again", version: 1 })
        )
        
        expect(Exit.isFailure(exit)).toBe(true)
        if (Exit.isFailure(exit)) {
          const error = Cause.failureOption(exit.cause)
          expect(error).toBeInstanceOf(ConcurrentModificationError)
        }
      }).pipe(
        Effect.provide(makeLayer()),
        Effect.runPromise
      )
    })
  })
}

// Test all implementations against same contract
testRepositoryContract(FakeUserRepository, "In-Memory Implementation")
testRepositoryContract(PostgresUserRepository, "Postgres Implementation")
testRepositoryContract(DynamoDBUserRepository, "DynamoDB Implementation")
```

### 4. **Time-Based Testing with TestClock**

For testing time-dependent behavior:

```typescript
const testWithTime = async () => {
  await Effect.gen(function* () {
    const cache = yield* CacheService
    
    yield* cache.set("key", "value", Duration.minutes(10))
    
    // Time starts at 0, frozen
    expect(yield* cache.get("key")).toBe("value")
    
    // Advance time
    yield* TestClock.adjust(Duration.minutes(11))
    
    // Value expired
    const result = yield* Effect.exit(cache.get("key"))
    expect(Exit.isFailure(result)).toBe(true)
  }).pipe(
    Effect.provide(Layer.mergeAll(
      CacheServiceLive,
      TestContext.TestContext  // Provides TestClock
    )),
    Effect.runPromise
  )
}
```

### 5. **Complex System Testing Workflow**

For complex systems, layer your test doubles strategically:

```typescript
// Level 1: Core domain with fakes
const DomainTestLayer = Layer.mergeAll(
  FakeUserRepository,
  FakeProductRepository,
  FakeOrderRepository
)

// Level 2: External services with mocks
const ExternalServicesLayer = Layer.mergeAll(
  MockMailerLayer,
  StubPaymentGateway,
  MockAnalyticsService
)

// Level 3: Infrastructure with test implementations
const InfrastructureLayer = Layer.mergeAll(
  TestContext.TestContext,
  InMemoryEventStore,
  TestMessageQueue
)

// Compose for integration tests
const IntegrationTestLayer = Layer.mergeAll(
  DomainTestLayer,
  ExternalServicesLayer,
  InfrastructureLayer
)

// Test complex workflows
test("order processing workflow", async () => {
  await Effect.gen(function* () {
    const orderService = yield* OrderService
    const testMailer = yield* TestMailer
    const analytics = yield* TestAnalytics
    
    // Create order
    const order = yield* orderService.create({
      userId: "user-1",
      items: [{ productId: "prod-1", quantity: 2 }]
    })
    
    // Process payment
    yield* orderService.processPayment(order.id)
    
    // Verify side effects
    expect(yield* testMailer.sentEmailTo("user@example.com")).toBe(true)
    expect(yield* analytics.eventRecorded("order.completed")).toBe(true)
    
    // Verify time-based behavior
    yield* TestClock.adjust(Duration.hours(2))
    expect(yield* orderService.isReadyForShipping(order.id)).toBe(true)
  }).pipe(
    Effect.provide(IntegrationTestLayer),
    Effect.runPromise
  )
})
```

### 6. **Best Practices Summary**

1. **Start with interfaces, not implementations** - Define service contracts first
2. **Use Shadow Services for mocking** - Extend production interfaces with test capabilities
3. **Layer composition for fixtures** - Build test environments through Layer merging
4. **Contract tests for all implementations** - Same tests for in-memory, database, etc.
5. **Closure-based state management** - Isolate test state within service implementations
6. **Effect.exit for failure testing** - Capture failures without crashing tests
7. **TestClock for time manipulation** - Control time precisely in tests
8. **Type-safe assertions** - Use `toStrictEqual<typeof result>` for compile-time safety

### 7. **Red-Green-Refactor with Effect-TS**

```typescript
// 1. RED: Write failing contract test
describe("UserService", () => {
  test("prevents duplicate emails", async () => {
    // This MUST fail initially
    await Effect.gen(function* () {
      const service = yield* UserService
      yield* service.register({ email: "test@example.com" })
      
      const exit = yield* Effect.exit(
        service.register({ email: "test@example.com" })
      )
      
      expect(Exit.isFailure(exit)).toBe(true)
    }).pipe(
      Effect.provide(UserServiceLive),  // Doesn't exist yet
      Effect.runPromise
    )
  })
})

// 2. GREEN: Implement to pass
const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const repo = yield* UserRepository
    
    return UserService.of({
      register: (data) => Effect.gen(function* () {
        const existing = yield* repo.findByEmail(data.email)
        if (Option.isSome(existing)) {
          return yield* Effect.fail(new DuplicateEmailError())
        }
        return yield* repo.create(data)
      })
    })
  })
)

// 3. REFACTOR: Improve with confidence
// Tests ensure behavior remains correct
```

This approach creates a powerful workflow where:
- **Issues are caught early** through contract tests
- **Refactoring is safe** because contracts remain stable
- **Code is maintainable** through clear service boundaries
- **Testing is efficient** through reusable test doubles

The key insight is that Effect's type system and service pattern naturally guide you toward testable, modular code where test doubles are just alternative Layer implementations of your service interfaces.
