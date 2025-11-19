---
modified: 2025-09-18T02:11:58-03:00
---
## Multi-Layered Test Suite Architecture for Effect-TS

Here's a comprehensive structure for a robust, multi-layered test suite that catches issues at the right level:

### 1. **Test Pyramid Structure**

```
         ╱─────────────╲
        ╱   E2E Tests   ╲      (5%)  - Full system, real dependencies
       ╱─────────────────╲
      ╱ Integration Tests ╲     (15%) - Service interactions
     ╱───────────────────────╲
    ╱  Component Tests       ╲  (25%) - Module boundaries  
   ╱─────────────────────────────╲
  ╱   Contract Tests            ╲ (25%) - Interface compliance
 ╱───────────────────────────────────╲
╱      Unit Tests                     ╲ (30%) - Pure functions & schemas
─────────────────────────────────────────
```

### 2. **Layer 1: Unit Tests (Foundation)**

Tests for pure functions, schemas, and business logic without dependencies:

```typescript
// src/domain/__tests__/validation.test.ts
describe("Domain Validation", () => {
  describe("Email Schema", () => {
    test("accepts valid emails", () => {
      const result = S.decodeEither(EmailSchema)("user@example.com")
      expect(Either.isRight(result)).toBe(true)
    })

    test("rejects invalid formats", () => {
      const result = S.decodeEither(EmailSchema)("not-an-email")
      expect(Either.isLeft(result)).toBe(true)
    })
  })

  describe("Business Rules", () => {
    test("calculates order total correctly", () => {
      const items = [
        { price: 10, quantity: 2 },
        { price: 15, quantity: 1 }
      ]
      expect(calculateTotal(items)).toBe(35)
    })

    test("applies discounts based on rules", () => {
      const discount = calculateDiscount({
        total: 100,
        customerTier: "gold",
        items: 5
      })
      expect(discount).toBe(15) // 15% for gold tier
    })
  })
})
```

### 3. **Layer 2: Contract Tests (Interface Compliance)**

Ensures all implementations satisfy the same contract:

```typescript
// src/repositories/__tests__/repository.contract.ts
export const repositoryContract = <T extends Repository<any>>(
  name: string,
  makeLayer: () => Layer.Layer<T>
) => {
  describe(`${name} Repository Contract`, () => {
    describe("CRUD Operations", () => {
      test("create returns created entity", async () => {
        await Effect.gen(function* () {
          const repo = yield* Repository
          const entity = yield* repo.create(testEntity)
          
          expect(entity.id).toBeDefined()
          expect(entity.version).toBe(1)
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.runPromise
        )
      })

      test("enforces optimistic concurrency", async () => {
        await Effect.gen(function* () {
          const repo = yield* Repository
          const entity = yield* repo.create(testEntity)
          
          yield* repo.update(entity.id, { 
            data: "v2", 
            version: entity.version 
          })
          
          const exit = yield* Effect.exit(
            repo.update(entity.id, { 
              data: "v3", 
              version: entity.version // Stale!
            })
          )
          
          expect(Exit.isFailure(exit)).toBe(true)
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.runPromise
        )
      })
    })

    describe("Query Operations", () => {
      test("pagination works correctly", async () => {
        await Effect.gen(function* () {
          const repo = yield* Repository
          
          // Create 25 entities
          yield* Effect.all(
            Array.range(1, 25).map(i => 
              repo.create({ name: `Item ${i}` })
            )
          )
          
          const page1 = yield* repo.list({ limit: 10, offset: 0 })
          const page2 = yield* repo.list({ limit: 10, offset: 10 })
          
          expect(page1.items.length).toBe(10)
          expect(page2.items.length).toBe(10)
          expect(page1.total).toBe(25)
        }).pipe(
          Effect.provide(makeLayer()),
          Effect.runPromise
        )
      })
    })
  })
}

// Apply contract to all implementations
repositoryContract("InMemory", InMemoryRepository)
repositoryContract("PostgreSQL", PostgreSQLRepository)
repositoryContract("DynamoDB", DynamoDBRepository)
```

### 4. **Layer 3: Component Tests (Module Boundaries)**

Tests complete features with controlled dependencies:

```typescript
// src/features/orders/__tests__/order-processing.test.ts
describe("Order Processing Component", () => {
  const componentLayer = Layer.mergeAll(
    OrderServiceLive,
    FakeInventoryRepository,
    MockPaymentGateway,
    StubNotificationService,
    TestContext.TestContext
  )

  test("complete order workflow", async () => {
    await Effect.gen(function* () {
      const orders = yield* OrderService
      const inventory = yield* TestInventoryRepository
      const payments = yield* TestPaymentGateway
      
      // Setup inventory
      yield* inventory.setStock("product-1", 10)
      
      // Create order
      const order = yield* orders.create({
        customerId: "customer-1",
        items: [{ productId: "product-1", quantity: 2 }]
      })
      
      // Process payment
      yield* orders.processPayment(order.id, {
        method: "credit_card",
        token: "test-token"
      })
      
      // Verify inventory decreased
      expect(yield* inventory.getStock("product-1")).toBe(8)
      
      // Verify payment captured
      expect(yield* payments.wasCharged("test-token")).toBe(true)
      
      // Simulate time passing for fulfillment
      yield* TestClock.adjust(Duration.hours(2))
      
      // Check order status
      const status = yield* orders.getStatus(order.id)
      expect(status).toBe("ready_for_shipping")
    }).pipe(
      Effect.provide(componentLayer),
      Effect.runPromise
    )
  })

  test("handles payment failures gracefully", async () => {
    await Effect.gen(function* () {
      const orders = yield* OrderService
      const payments = yield* TestPaymentGateway
      
      // Configure payment to fail
      yield* payments.willFail("insufficient_funds")
      
      const order = yield* orders.create(testOrder)
      
      const exit = yield* Effect.exit(
        orders.processPayment(order.id, paymentDetails)
      )
      
      expect(Exit.isFailure(exit)).toBe(true)
      
      // Verify order remains in pending state
      const status = yield* orders.getStatus(order.id)
      expect(status).toBe("payment_pending")
    }).pipe(
      Effect.provide(componentLayer),
      Effect.runPromise
    )
  })
})
```

### 5. **Layer 4: Integration Tests (Service Interactions)**

Tests interactions between real services:

```typescript
// src/__tests__/integration/workflow.integration.test.ts
describe("Multi-Service Integration", () => {
  const integrationLayer = Layer.mergeAll(
    // Real service implementations
    UserServiceLive,
    OrderServiceLive,
    InventoryServiceLive,
    NotificationServiceLive,
    
    // Test infrastructure
    PostgreSQLTestContainer,
    RedisTestContainer,
    LocalStackS3,
    
    // Test utilities
    TestContext.TestContext
  )

  beforeAll(async () => {
    // Start test containers
    await TestContainers.start()
  })

  afterAll(async () => {
    await TestContainers.stop()
  })

  test("user registration through order placement", async () => {
    await Effect.gen(function* () {
      const users = yield* UserService
      const orders = yield* OrderService
      const notifications = yield* TestNotificationTracker
      
      // Register user
      const user = yield* users.register({
        email: "integration@test.com",
        name: "Test User"
      })
      
      // Create their first order
      const order = yield* orders.create({
        userId: user.id,
        items: testItems
      })
      
      // Process through workflow
      yield* orders.processPayment(order.id, paymentInfo)
      yield* orders.confirmOrder(order.id)
      
      // Verify cross-service state
      const userOrders = yield* users.getOrders(user.id)
      expect(userOrders).toHaveLength(1)
      
      // Verify notifications sent
      const sentNotifications = yield* notifications.getSent()
      expect(sentNotifications).toContainEqual(
        expect.objectContaining({
          type: "order_confirmed",
          recipient: "integration@test.com"
        })
      )
    }).pipe(
      Effect.provide(integrationLayer),
      Effect.runPromise
    )
  })
})
```

### 6. **Layer 5: E2E Tests (Full System)**

Tests the complete system as users would experience it:

```typescript
// src/__tests__/e2e/customer-journey.e2e.test.ts
describe("Customer Journey E2E", () => {
  let apiClient: HttpClient.HttpClient
  let testUser: { email: string; password: string }
  
  beforeAll(async () => {
    // Start real services
    await startApplication()
    
    apiClient = HttpClient.create({
      baseUrl: "http://localhost:3000"
    })
    
    // Create test user
    testUser = await createTestUser()
  })

  test("complete purchase flow", async () => {
    await Effect.gen(function* () {
      // Login
      const authToken = yield* pipe(
        HttpClientRequest.post("/auth/login"),
        HttpClientRequest.setBody(HttpBody.json(testUser)),
        apiClient,
        Effect.flatMap(HttpClientResponse.json),
        Effect.map(r => r.token)
      )
      
      // Browse products
      const products = yield* pipe(
        HttpClientRequest.get("/products"),
        HttpClientRequest.setHeader("Authorization", `Bearer ${authToken}`),
        apiClient,
        Effect.flatMap(HttpClientResponse.json)
      )
      
      // Add to cart
      yield* pipe(
        HttpClientRequest.post("/cart/items"),
        HttpClientRequest.setBody(HttpBody.json({
          productId: products[0].id,
          quantity: 2
        })),
        HttpClientRequest.setHeader("Authorization", `Bearer ${authToken}`),
        apiClient
      )
      
      // Checkout
      const order = yield* pipe(
        HttpClientRequest.post("/checkout"),
        HttpClientRequest.setBody(HttpBody.json({
          paymentMethod: "test_card"
        })),
        HttpClientRequest.setHeader("Authorization", `Bearer ${authToken}`),
        apiClient,
        Effect.flatMap(HttpClientResponse.json)
      )
      
      expect(order.status).toBe("confirmed")
      expect(order.total).toBeGreaterThan(0)
      
      // Poll for email confirmation (async process)
      yield* Effect.retry(
        checkEmailReceived(testUser.email, "order_confirmation"),
        Schedule.exponential(Duration.seconds(1))
      )
    }).pipe(
      Effect.timeout(Duration.seconds(30)),
      Effect.runPromise
    )
  })
})
```

### 7. **Test Organization Structure**

```
project/
├── src/
│   ├── domain/
│   │   ├── __tests__/
│   │   │   ├── user.schema.test.ts         # Unit: Schema validation
│   │   │   └── pricing.rules.test.ts       # Unit: Business logic
│   │   
│   ├── repositories/
│   │   ├── __tests__/
│   │   │   ├── repository.contract.ts      # Contract: Shared tests
│   │   │   ├── user.repository.test.ts     # Contract: Implementation
│   │   │   └── __fixtures__/
│   │   │       └── users.ts                # Test data
│   │   
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── order.service.test.ts       # Component: Service logic
│   │   │   └── __doubles__/
│   │   │       ├── payment.shadow.ts       # Shadow service
│   │   │       └── inventory.fake.ts       # Fake implementation
│   │   
│   └── features/
│       └── checkout/
│           └── __tests__/
│               └── checkout.component.test.ts # Component: Feature
│
├── tests/
│   ├── integration/
│   │   ├── workflows/                      # Integration: Multi-service
│   │   └── fixtures/
│   │       └── docker-compose.test.yml     # Test containers
│   │   
│   ├── e2e/
│   │   ├── journeys/                       # E2E: User journeys
│   │   └── performance/                    # E2E: Load tests
│   │   
│   └── shared/
│       ├── layers/                         # Reusable test layers
│       ├── builders/                       # Test data builders
│       └── assertions/                     # Custom assertions
```

### 8. **Test Utilities and Helpers**

```typescript
// tests/shared/layers/database.ts
export const DatabaseTestLayer = Layer.unwrapEffect(
  Effect.gen(function* () {
    const container = yield* PostgreSQLContainer.start()
    const pool = yield* createPool(container.connectionString)
    
    yield* Effect.addFinalizer(() => 
      Effect.all([
        pool.end(),
        container.stop()
      ])
    )
    
    return Layer.succeed(DatabasePool, pool)
  })
)

// tests/shared/builders/user.builder.ts
export class UserBuilder {
  private user = {
    id: crypto.randomUUID(),
    email: "test@example.com",
    name: "Test User"
  }
  
  withEmail(email: string) {
    this.user.email = email
    return this
  }
  
  withSubscription() {
    return { ...this.user, subscription: "active" }
  }
  
  build() {
    return new User(this.user)
  }
}

// tests/shared/assertions/effect.ts
export const expectFailure = async <E>(
  effect: Effect.Effect<any, E>,
  errorClass: new (...args: any[]) => E
) => {
  const exit = await Effect.runPromiseExit(effect)
  expect(Exit.isFailure(exit)).toBe(true)
  
  if (Exit.isFailure(exit)) {
    const error = Cause.failureOption(exit.cause)
    expect(Option.isSome(error)).toBe(true)
    if (Option.isSome(error)) {
      expect(error.value).toBeInstanceOf(errorClass)
    }
  }
}
```

### 9. **CI/CD Pipeline Configuration**

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:contracts
      
  component-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:components
      
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: docker-compose up -d
      - run: npm ci
      - run: npm run test:e2e
```

### 10. **Test Configuration**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules', 'tests'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },
    testTimeout: 10000,
    hookTimeout: 20000
  }
})

// package.json scripts
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run src/**/*.test.ts",
    "test:contracts": "vitest run src/**/*.contract.ts",
    "test:components": "vitest run src/**/*.component.test.ts",
    "test:integration": "vitest run tests/integration/**/*.test.ts",
    "test:e2e": "vitest run tests/e2e/**/*.test.ts",
    "test:coverage": "vitest run --coverage"
  }
}
```

This multi-layered approach ensures:

- **Fast feedback** from unit tests during development
- **Contract compliance** across implementations
- **Component isolation** for feature testing
- **Integration confidence** for service interactions
- **E2E validation** of critical user journeys
- **Maintainability** through organized structure
- **Efficiency** by testing at the right level

Each layer has a specific purpose and catches different categories of issues, creating a safety net that enables confident refactoring and deployment.
