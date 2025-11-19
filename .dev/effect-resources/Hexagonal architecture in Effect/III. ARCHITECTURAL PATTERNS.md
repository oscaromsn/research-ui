---
modified: 2025-11-04T01:13:31-03:00
---
# III. ARCHITECTURAL PATTERNS

## A. Layer Composition Patterns

Layer composition is fundamental to Effect architecture. Understanding the three core operators and how to use them correctly is essential for building maintainable applications.

### 1. Core Composition Operators

Effect provides three primary operators for composing layers, each with distinct semantics and use cases.

#### 1.1 Layer.provide - Function Composition (Dependency Erasure)

**Pattern**: `A → B` provided to `B → C` = `A → C`

`Layer.provide` is like function composition - it satisfies a dependency and **erases** the intermediate type from the requirements.

```typescript
// LayerAB requires A, produces B
type LayerAB = Layer.Layer<B, never, A>

// LayerBC requires B, produces C
type LayerBC = Layer.Layer<C, never, B>

// Composed: requires A, produces C (B is erased)
const result: Layer.Layer<C, never, A> = layerBC.pipe(
  Layer.provide(layerAB)
)
```

**Use When**: You want to satisfy a dependency without exposing it to consumers.

**Mental Model**: Like mathematical function composition: `g(f(x))` where the intermediate result is hidden.

**Practical Example - Database with Hidden Config**:

```typescript
// Database layer needs Config, but consumers don't care about Config
export const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config  // Requires Config
    const pool = yield* acquirePool(config)
    return createDatabase(pool)
  })
).pipe(
  Layer.provide(ConfigLive)  // Config requirement erased
)

// Type: Layer<Database, never, never>
//                              ↑ Config dependency is gone!

// Consumers only see Database
const program = Effect.gen(function* () {
  const db = yield* Database  // No Config needed
  return yield* db.query("SELECT * FROM users")
})
```

**Another Example - Email Service with Hidden SMTP Client**:

```typescript
// Internal layer with SMTP dependency
const EmailServiceInternal = Layer.effect(
  EmailService,
  Effect.gen(function* () {
    const smtp = yield* SmtpClient  // Requires SmtpClient
    const config = yield* EmailConfig
    
    return EmailService.of({
      send: (email) => smtp.send({ ...email, from: config.defaultFrom })
    })
  })
)

// Public layer with dependency erased
export const EmailServiceLive = EmailServiceInternal.pipe(
  Layer.provide(SmtpClientLive),    // SmtpClient erased
  Layer.provide(EmailConfigLive)    // EmailConfig erased
)

// Type: Layer<EmailService, never, never>
// Consumers don't know about SMTP or config
```

**Key Benefits**:
- Clean public API
- Implementation details hidden
- Easy to change internal dependencies
- Simplified testing at service boundary

---

#### 1.2 Layer.provideMerge - Provide and Expose

**Pattern**: `A → B` provided to `B → C` = `A → (B | C)`

`Layer.provideMerge` satisfies a dependency AND makes it available to other services.

```typescript
// LayerAB requires A, produces B
type LayerAB = Layer.Layer<B, never, A>

// LayerBC requires B, produces C
type LayerBC = Layer.Layer<C, never, B>

// Composed: requires A, produces BOTH B and C
const result: Layer.Layer<B | C, never, A> = layerBC.pipe(
  Layer.provideMerge(layerAB)
)
```

**Use When**: Multiple services need access to the same dependency.

**Practical Example - Shared Database**:

```typescript
// UserService needs Database
const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database
    return UserService.of({
      create: (user) => db.insert("users", user)
    })
  })
)

// Provide Database AND expose it
export const AppLayer = UserServiceLive.pipe(
  Layer.provideMerge(DatabaseLive)  // Database is exposed
)

// Type: Layer<UserService | Database, never, never>
//             ↑ Both services available

// Now OrderService can also access Database
const program = Effect.gen(function* () {
  const users = yield* UserService
  const db = yield* Database  // Database still available
  
  yield* users.create(newUser)
  const orders = yield* db.query("SELECT * FROM orders")
})
```

**Another Example - Shared Logger**:

```typescript
const EmailServiceLive = Layer.effect(
  EmailService,
  Effect.gen(function* () {
    const logger = yield* Logger
    return EmailService.of({
      send: (email) =>
        Effect.gen(function* () {
          yield* logger.info(`Sending email to ${email.to}`)
          // ... send logic
        })
    })
  })
)

// Merge logger so other services can use it
const ServicesLayer = EmailServiceLive.pipe(
  Layer.provideMerge(LoggerLive)  // Logger exposed
)

// Other services can access Logger
const NotificationServiceLive = Layer.effect(
  NotificationService,
  Effect.gen(function* () {
    const logger = yield* Logger  // Logger available from ServicesLayer
    const email = yield* EmailService
    // ... use both
  })
)
```

**When to Use `provideMerge` vs `provide`**:
- **Use `provide`**: When dependency is internal implementation detail
- **Use `provideMerge`**: When dependency is shared infrastructure (database, logger, cache)

---

#### 1.3 Layer.merge - Combine Independent Layers

**Pattern**: `(A → B)` merged with `(C → D)` = `(A | C) → (B | D)`

`Layer.merge` combines independent services at the application root.

```typescript
// Two independent layers
type Layer1 = Layer.Layer<B, never, A>
type Layer2 = Layer.Layer<D, never, C>

// Merged: combines inputs and outputs
const result: Layer.Layer<B | D, never, A | C> = Layer.merge(layer1, layer2)
```

**Use When**: Combining independent services that don't depend on each other.

**Practical Example - Application Services**:

```typescript
// Independent service layers
const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const repo = yield* UserRepository
    return UserService.of({ /* ... */ })
  })
).pipe(
  Layer.provide(UserRepositoryLive)
)

const EmailServiceLive = Layer.effect(
  EmailService,
  Effect.gen(function* () {
    const smtp = yield* SmtpClient
    return EmailService.of({ /* ... */ })
  })
).pipe(
  Layer.provide(SmtpClientLive)
)

const PaymentServiceLive = Layer.effect(
  PaymentService,
  Effect.gen(function* () {
    const gateway = yield* PaymentGateway
    return PaymentService.of({ /* ... */ })
  })
).pipe(
  Layer.provide(PaymentGatewayLive)
)

// Combine all independent services
const MainLayer = Layer.mergeAll(
  UserServiceLive,
  EmailServiceLive,
  PaymentServiceLive
)

// Type: Layer<UserService | EmailService | PaymentService, never, never>
```

**Another Example - Infrastructure Layer**:

```typescript
// All self-contained infrastructure
const InfrastructureLayer = Layer.mergeAll(
  DatabaseLive,          // Already provided with Config
  CacheLive,             // Already provided with RedisClient
  FileStorageLive,       // Already provided with S3Client
  MessageQueueLive       // Already provided with RabbitMQClient
)

// Application layer can use all infrastructure
const ApplicationLayer = Layer.mergeAll(
  OrderServiceLive,
  InventoryServiceLive,
  CheckoutServiceLive
).pipe(
  Layer.provide(InfrastructureLayer)
)
```

**Decision Tree for Composition Operators**:

```
Is the intermediate service needed by other services?
│
├─ NO → Use Layer.provide
│        (Erase the dependency)
│        Example: Config for Database
│
└─ YES → Use Layer.provideMerge
         (Expose the dependency)
         Example: Shared Database, Logger

Are the services independent (no dependencies on each other)?
│
└─ YES → Use Layer.merge / Layer.mergeAll
         (Combine at application root)
         Example: Multiple feature services
```

---

### 2. Local Dependency Elimination

**The Golden Rule**: Always provide dependencies locally within each service file, then merge at the root.

This is the most important pattern for maintainable Effect architecture.

#### 2.1 The Anti-Pattern: Exposing Internal Dependencies

**❌ BAD - Dependencies Leak to Consumers**:

```typescript
// services/UserService.ts
export const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database          // Dependency leaks!
    const email = yield* EmailService   // Dependency leaks!
    const cache = yield* Cache          // Dependency leaks!
    
    return UserService.of({
      create: (user) =>
        Effect.gen(function* () {
          yield* db.insert("users", user)
          yield* email.sendWelcome(user)
          yield* cache.invalidate(`user:${user.id}`)
        })
    })
  })
)

// Type: Layer<UserService, never, Database | EmailService | Cache>
//                                  ↑ All internal dependencies exposed!

// main.ts - Consumers must know about internal dependencies
const app = program.pipe(
  Effect.provide(
    Layer.merge(
      UserServiceLive,
      DatabaseLive,       // ❌ Consumer must provide
      EmailServiceLive,   // ❌ Consumer must provide
      CacheLive          // ❌ Consumer must provide
    )
  )
)
```

**Problems**:
- Consumers must know about internal wiring
- Changes to UserService dependencies break all consumers
- Testing requires mocking all internal dependencies
- High coupling
- Merge conflicts in main.ts

---

#### 2.2 The Best Practice: Local Elimination

**✅ GOOD - Clean Interface**:

```typescript
// services/UserService.ts

// Internal layer with dependencies
const UserServiceLive_Internal = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database
    const email = yield* EmailService
    const cache = yield* Cache
    
    return UserService.of({
      create: (user) =>
        Effect.gen(function* () {
          yield* db.insert("users", user)
          yield* email.sendWelcome(user)
          yield* cache.invalidate(`user:${user.id}`)
        })
    })
  })
)

// Provide dependencies HERE, not at application root
export const UserServiceLive = UserServiceLive_Internal.pipe(
  Layer.provide(DatabaseLive),
  Layer.provide(EmailServiceLive),
  Layer.provide(CacheLive)
)

// Type: Layer<UserService, never, never>
//                          ↑ Clean! No dependencies exposed

// main.ts - Simple, clean composition
const MainLayer = Layer.mergeAll(
  UserServiceLive,      // Already self-contained
  PaymentServiceLive,   // Already self-contained
  OrderServiceLive      // Already self-contained
)

const app = program.pipe(
  Effect.provide(MainLayer)  // Single provide, clean dependencies
)
```

**Benefits**:
1. **Clean Public API**: Consumers don't see internal wiring
2. **Easy Refactoring**: Change dependencies without touching consumers
3. **Simplified Testing**: Mock at service boundary, not dependency graph
4. **Reduced Conflicts**: Changes localized to service files
5. **Better Encapsulation**: Implementation details hidden

---

#### 2.3 Real-World Example: Payment Service

**❌ Before - Leaking Dependencies**:

```typescript
// services/PaymentService.ts
export const PaymentServiceLive = Layer.effect(
  PaymentService,
  Effect.gen(function* () {
    const stripe = yield* StripeClient        // Leaked
    const logger = yield* Logger              // Leaked
    const metrics = yield* Metrics            // Leaked
    const eventBus = yield* EventBus          // Leaked
    
    return PaymentService.of({
      charge: (amount, token) =>
        Effect.gen(function* () {
          yield* logger.info(`Charging ${amount}`)
          const start = Date.now()
          
          const result = yield* stripe.charge(amount, token)
          
          yield* metrics.recordLatency("charge", Date.now() - start)
          yield* eventBus.publish(PaymentChargedEvent(result))
          
          return result
        })
    })
  })
)

// Type: Layer<PaymentService, never, StripeClient | Logger | Metrics | EventBus>
```

**✅ After - Local Elimination**:

```typescript
// services/PaymentService.ts

// Step 1: Create internal layer with dependencies
const PaymentServiceLive_Internal = Layer.effect(
  PaymentService,
  Effect.gen(function* () {
    const stripe = yield* StripeClient
    const logger = yield* Logger
    const metrics = yield* Metrics
    const eventBus = yield* EventBus
    
    return PaymentService.of({
      charge: (amount, token) =>
        Effect.gen(function* () {
          yield* logger.info(`Charging ${amount}`)
          const start = Date.now()
          
          const result = yield* stripe.charge(amount, token)
          
          yield* metrics.recordLatency("charge", Date.now() - start)
          yield* eventBus.publish(PaymentChargedEvent(result))
          
          return result
        })
    })
  })
)

// Step 2: Provide all dependencies locally
export const PaymentServiceLive = PaymentServiceLive_Internal.pipe(
  Layer.provide(StripeClientLive),
  Layer.provide(LoggerLive),
  Layer.provide(MetricsLive),
  Layer.provide(EventBusLive)
)

// Type: Layer<PaymentService, never, never>
// ✅ Perfect! Clean interface, no leaked dependencies

// main.ts - Just merge the service
const MainLayer = Layer.mergeAll(
  PaymentServiceLive,  // Self-contained, no wiring needed
  OrderServiceLive,
  UserServiceLive
)
```

---

#### 2.4 Pattern: Composing Multiple Layers Locally

When a service depends on multiple other services, provide them all locally:

```typescript
// services/OrderService.ts

const OrderServiceLive_Internal = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    // Multiple dependencies
    const orders = yield* OrderRepository
    const inventory = yield* InventoryService
    const payment = yield* PaymentService
    const email = yield* EmailService
    const events = yield* EventBus
    
    return OrderService.of({
      create: (items) =>
        Effect.gen(function* () {
          // Check inventory
          yield* inventory.reserve(items)
          
          // Process payment
          const receipt = yield* payment.charge(calculateTotal(items), "token")
          
          // Create order
          const order = new Order({ items, receipt })
          yield* orders.save(order)
          
          // Send confirmation
          yield* email.sendOrderConfirmation(order)
          
          // Publish event
          yield* events.publish(OrderCreatedEvent(order))
          
          return order
        })
    })
  })
)

// Compose all dependencies into layers
const OrderServiceDependencies = Layer.mergeAll(
  OrderRepositoryPostgresLive,
  InventoryServiceLive,
  PaymentServiceLive,
  EmailServiceLive,
  EventBusLive
)

// Provide dependencies locally
export const OrderServiceLive = OrderServiceLive_Internal.pipe(
  Layer.provide(OrderServiceDependencies)
)

// Type: Layer<OrderService, never, never>
```

---

### 3. Single Effect.provide Rule

**The Critical Rule**: Never call `Effect.provide` multiple times. Always compose layers first, then provide once.

This is one of the most important rules in Effect architecture.

#### 3.1 The Forbidden Pattern: Multiple Effect.provide Calls

**❌ FORBIDDEN - Breaks Memoization**:

```typescript
// ❌ BAD: Multiple Effect.provide calls
const result = program
  .pipe(Effect.provide(DatabaseLive))
  .pipe(Effect.provide(EmailServiceLive))
  .pipe(Effect.provide(LoggerLive))
  .pipe(Effect.provide(CacheLive))

// Problems:
// 1. Creates FOUR separate scopes
// 2. Each scope has its own MemoMap
// 3. DatabaseLive might be built 4 times if other services depend on it
// 4. Services aren't shared across scopes
// 5. Resource cleanup may not work correctly
```

**Why This Breaks**:

Each `Effect.provide` creates a new `Scope` with its own `MemoMap`. The MemoMap is what tracks which services have been built to avoid rebuilding them. When you create multiple scopes, services in different scopes can't see each other, breaking memoization.

```typescript
// What actually happens with multiple provides:

Scope 1 (DatabaseLive)
  MemoMap 1: { Database: instance1 }

Scope 2 (EmailServiceLive) 
  MemoMap 2: { EmailService: instance2 }
  // EmailService needs Database, but can't see MemoMap 1
  // Builds Database AGAIN -> instance2

Scope 3 (LoggerLive)
  MemoMap 3: { Logger: instance3 }
  // Logger needs Database, builds it AGAIN -> instance3

Scope 4 (CacheLive)
  MemoMap 4: { Cache: instance4 }
  // Cache needs Database, builds it AGAIN -> instance4

// Result: Database built 4 times! 🔥
```

---

#### 3.2 The Mandatory Pattern: Single Provide with Composed Layer

**✅ MANDATORY - Correct Approach**:

```typescript
// Step 1: Compose all layers into dependency graph
const MainLayer = Layer.mergeAll(
  DatabaseLive,
  EmailServiceLive,
  LoggerLive,
  CacheLive,
  UserServiceLive,
  OrderServiceLive
)

// Step 2: Single Effect.provide call
const result = program.pipe(
  Effect.provide(MainLayer)  // ✅ Only ONE provide
)

Effect.runPromise(result)
```

**What Happens with Single Provide**:

```typescript
// Single scope, single MemoMap

Scope (MainLayer)
  MemoMap: {
    Database: instance1,           // Built once
    EmailService: instance2,       // Uses instance1
    Logger: instance3,             // Uses instance1
    Cache: instance4,              // Uses instance1
    UserService: instance5,        // Uses instance1, instance2, instance3
    OrderService: instance6        // Uses all above instances
  }

// Result: Each service built exactly once and shared! ✅
```

---

#### 3.3 Real-World Example: Application Startup

**❌ Wrong Way**:

```typescript
// main.ts

const program = Effect.gen(function* () {
  const users = yield* UserService
  const orders = yield* OrderService
  const payments = yield* PaymentService
  
  // ... application logic
})

// ❌ Multiple provides - WRONG!
Effect.runPromise(
  program
    .pipe(Effect.provide(UserServiceLive))
    .pipe(Effect.provide(OrderServiceLive))
    .pipe(Effect.provide(PaymentServiceLive))
    .pipe(Effect.provide(DatabaseLive))
    .pipe(Effect.provide(EmailServiceLive))
)
```

**✅ Correct Way**:

```typescript
// main.ts

const program = Effect.gen(function* () {
  const users = yield* UserService
  const orders = yield* OrderService
  const payments = yield* PaymentService
  
  // ... application logic
})

// Compose layers hierarchically
const InfrastructureLayer = Layer.mergeAll(
  DatabaseLive,
  CacheLive,
  EmailServiceLive,
  MessageQueueLive
)

const ApplicationLayer = Layer.mergeAll(
  UserServiceLive,
  OrderServiceLive,
  PaymentServiceLive
).pipe(
  Layer.provide(InfrastructureLayer)
)

const ApiLayer = Layer.mergeAll(
  HttpServerLive,
  GraphQLServerLive
).pipe(
  Layer.provide(ApplicationLayer)
)

// ✅ Single provide - CORRECT!
Effect.runPromise(
  program.pipe(Effect.provide(ApiLayer))
)
```

---

#### 3.4 Testing with Single Provide

Even in tests, use single provide:

```typescript
// ❌ Wrong - Multiple provides in test
it.effect("should create user", () =>
  Effect.gen(function* () {
    const users = yield* UserService
    const user = yield* users.create({ email: "test@example.com" })
    assert.isDefined(user.id)
  })
    .pipe(Effect.provide(UserServiceLive))        // ❌
    .pipe(Effect.provide(UserRepositoryTestLive)) // ❌
    .pipe(Effect.provide(EmailServiceFakeLive))   // ❌
)

// ✅ Correct - Single provide with composed layer
it.effect("should create user", () =>
  Effect.gen(function* () {
    const users = yield* UserService
    const user = yield* users.create({ email: "test@example.com" })
    assert.isDefined(user.id)
  }).pipe(
    Effect.provide(
      Layer.mergeAll(
        UserServiceLive,
        UserRepositoryTestLive,
        EmailServiceFakeLive
      )
    )
  )
)

// Even better - compose test layer once
const TestLayer = Layer.mergeAll(
  UserServiceLive,
  UserRepositoryTestLive,
  EmailServiceFakeLive
)

it.effect("should create user", () =>
  Effect.gen(function* () {
    const users = yield* UserService
    const user = yield* users.create({ email: "test@example.com" })
    assert.isDefined(user.id)
  }).pipe(Effect.provide(TestLayer))  // ✅ Single provide
)
```

---

### 4. Memoization Strategy

Understanding how Effect memoizes layers is crucial for performance and correctness.

#### 4.1 Memoization by Reference Identity

**Critical Insight**: Layers are memoized by **reference identity**, not by value.

This means two layers with identical content but different references are considered different:

```typescript
// Function that creates a layer
const makeDbLayer = (config: DbConfig) => 
  Layer.succeed(Database, createDb(config))

const config = { url: "localhost", port: 5432 }

const layer1 = makeDbLayer(config)  // Reference A
const layer2 = makeDbLayer(config)  // Reference B (different!)

// These are TWO DIFFERENT layers
// Even though they have identical config
layer1 === layer2  // false

// Result: Database will be constructed TWICE
const app = Layer.merge(
  userServiceLive.pipe(Layer.provide(layer1)),
  postServiceLive.pipe(Layer.provide(layer2))
)
// Database constructed twice! ❌
```

---

#### 4.2 The Anti-Pattern: Function-Generated Layers

**❌ BAD - Generates New References**:

```typescript
// Anti-pattern: Function returns new layer each time
const makeDbLayer = (config: DbConfig) => 
  Layer.effect(
    Database,
    Effect.gen(function* () {
      const pool = yield* acquirePool(config)
      return createDatabase(pool)
    })
  )

// Usage in application
const config = loadConfig()

// Problem: Each call creates NEW layer reference
const UserRepositoryLive = Layer.effect(/*...*/).pipe(
  Layer.provide(makeDbLayer(config))  // Reference 1
)

const OrderRepositoryLive = Layer.effect(/*...*/).pipe(
  Layer.provide(makeDbLayer(config))  // Reference 2 (different!)
)

const ProductRepositoryLive = Layer.effect(/*...*/).pipe(
  Layer.provide(makeDbLayer(config))  // Reference 3 (different!)
)

// Result: Database built 3 times!
const app = Layer.mergeAll(
  UserRepositoryLive,
  OrderRepositoryLive,
  ProductRepositoryLive
)
```

---

#### 4.3 The Best Practice: Single Layer Instance

**✅ GOOD - Store Reference**:

```typescript
// Create layer once, store the reference
const config = loadConfig()

const DbLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const pool = yield* acquirePool(config)
    return createDatabase(pool)
  })
)

// Use the SAME reference everywhere
const UserRepositoryLive = Layer.effect(/*...*/).pipe(
  Layer.provide(DbLive)  // Same reference
)

const OrderRepositoryLive = Layer.effect(/*...*/).pipe(
  Layer.provide(DbLive)  // Same reference
)

const ProductRepositoryLive = Layer.effect(/*...*/).pipe(
  Layer.provide(DbLive)  // Same reference
)

// Result: Database built once, memoized, shared ✅
const app = Layer.mergeAll(
  UserRepositoryLive,
  OrderRepositoryLive,
  ProductRepositoryLive
)
```

---

#### 4.4 Parameterized Layers - The Right Way

If you need parameterized layers, create the layer once with the parameters:

**❌ Wrong - Creates new references in loop**:

```typescript
// Anti-pattern
const services = configs.map(config => 
  makeServiceLayer(config)  // Each call creates new reference
)

const app = Layer.mergeAll(...services)
// Each service built separately, no sharing
```

**✅ Right - Store references**:

```typescript
// Create all layer references once
const serviceLayers = configs.map(config => 
  Layer.effect(
    Service,
    Effect.gen(function* () {
      // Use config here
      return createService(config)
    })
  )
)

// Store the references
const [ServiceLayer1, ServiceLayer2, ServiceLayer3] = serviceLayers

// Use stored references
const app = Layer.mergeAll(
  ServiceLayer1,
  ServiceLayer2,
  ServiceLayer3
)
```

**Better - Use configuration layer**:

```typescript
// Configuration as a service
const ConfigLive = Layer.succeed(Config, loadConfig())

// Layer depends on Config service
const DbLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config  // Get config from service
    const pool = yield* acquirePool(config.database)
    return createDatabase(pool)
  })
).pipe(
  Layer.provide(ConfigLive)
)

// Can be used multiple times with same reference
const app = Layer.mergeAll(
  UserRepositoryLive.pipe(Layer.provide(DbLive)),
  OrderRepositoryLive.pipe(Layer.provide(DbLive)),
  ProductRepositoryLive.pipe(Layer.provide(DbLive))
)
// Database built once ✅
```

---

#### 4.5 Verifying Memoization

You can verify memoization is working by adding construction logging:

```typescript
const DbLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    // Log construction
    yield* Effect.logInfo("🏗️ Constructing Database")
    
    const config = yield* Config
    const pool = yield* acquirePool(config)
    
    yield* Effect.logInfo("✅ Database constructed")
    
    return createDatabase(pool)
  })
)

// If you see "🏗️ Constructing Database" only ONCE, memoization works
// If you see it multiple times, you have a memoization problem
```

---

#### 4.6 Summary: Memoization Rules

1. **Store layer references**: Create layers once and reuse the same reference
2. **Don't generate layers in functions**: Unless you store the result
3. **Use single Effect.provide**: Multiple provides create separate scopes
4. **Same reference = Same instance**: Effect uses reference equality for memoization
5. **Different reference = Different instance**: Even with identical content

**Golden Rule**: If two pieces of code need the same service, they must use the same layer reference.

---

## B. Service Architecture Patterns

Service architecture patterns define how to organize and structure services to maintain clarity, reduce coupling, and enable scalability.

### 1. Vertical Slice Architecture

Vertical Slice Architecture organizes code by feature rather than by technical layer, preventing services from becoming ubiquitous dependencies.

#### 1.1 The Problem with Horizontal Organization

**❌ Horizontal Layers Lead to Ubiquitous Dependencies**:

```
src/
  services/
    UserService.ts      // Everything user-related (30+ methods)
    OrderService.ts     // Everything order-related (40+ methods)
    EmailService.ts     // Used everywhere (becomes god service)
    DatabaseService.ts  // Used everywhere
```

**Problems**:
- Services grow unbounded
- Everything depends on everything
- Hard to understand scope
- Difficult to test in isolation
- Merge conflicts in service files
- Unclear ownership

---

#### 1.2 Vertical Slices Solution

**✅ Organize by Feature (Vertical Slice)**:

```
src/
  features/
    checkout/
      domain/
        CheckoutCart.model.ts
        CheckoutErrors.error.ts
      ports/
        CheckoutRepository.port.ts
        PaymentProcessor.port.ts
      services/
        ProcessCheckout.service.ts
        ValidateCheckout.service.ts
      adapters/
        CheckoutRepository.postgres.ts
        PaymentProcessor.stripe.ts
      CheckoutLayer.ts          # Feature composition
      index.ts                  # Public API
    
    inventory/
      domain/
        InventoryItem.model.ts
        StockLevel.value.ts
      ports/
        InventoryRepository.port.ts
        WarehouseApi.port.ts
      services/
        ReserveInventory.service.ts
        CheckStockLevel.service.ts
      adapters/
        InventoryRepository.postgres.ts
        WarehouseApi.http.ts
      InventoryLayer.ts
      index.ts
    
    user-management/
      domain/
        User.model.ts
        UserRole.value.ts
      ports/
        UserRepository.port.ts
        AuthProvider.port.ts
      services/
        RegisterUser.service.ts
        AuthenticateUser.service.ts
      adapters/
        UserRepository.postgres.ts
        AuthProvider.jwt.ts
      UserManagementLayer.ts
      index.ts
```

---

#### 1.3 Feature Slice Example: Checkout

**Complete Checkout Feature Slice**:

```typescript
// features/checkout/domain/CheckoutCart.model.ts
export class CheckoutCart extends Schema.Class<CheckoutCart>("CheckoutCart")({
  userId: Schema.String,
  items: Schema.Array(CartItem),
  totalAmount: Schema.Number
}) {
  calculateTotal(): Money {
    return this.items.reduce(
      (sum, item) => Money.add(sum, Money.multiply(item.price, item.quantity)),
      Money.zero
    )
  }
}

// features/checkout/ports/CheckoutRepository.port.ts
export interface CheckoutRepository {
  saveCart(cart: CheckoutCart): Effect.Effect<void>
  getCart(userId: UserId): Effect.Effect<CheckoutCart, CartNotFoundError>
  clearCart(userId: UserId): Effect.Effect<void>
}

export class CheckoutRepository extends Context.Tag("CheckoutRepository")<
  CheckoutRepository,
  CheckoutRepository
>() {}

// features/checkout/ports/PaymentProcessor.port.ts
export interface PaymentProcessor {
  charge(amount: Money, token: string): Effect.Effect<PaymentReceipt, PaymentError>
}

export class PaymentProcessor extends Context.Tag("PaymentProcessor")<
  PaymentProcessor,
  PaymentProcessor
>() {}

// features/checkout/services/ProcessCheckout.service.ts
export class ProcessCheckoutService extends Effect.Service<ProcessCheckoutService>()(
  "ProcessCheckoutService",
  {
    dependencies: [
      CheckoutRepository.Default,
      PaymentProcessor.Default,
      InventoryService.Default  // Cross-feature dependency (explicit)
    ],
    
    effect: Effect.gen(function* () {
      const checkoutRepo = yield* CheckoutRepository
      const payment = yield* PaymentProcessor
      const inventory = yield* InventoryService
      
      return {
        execute: (userId: UserId) =>
          Effect.gen(function* () {
            // Get cart
            const cart = yield* checkoutRepo.getCart(userId)
            
            // Reserve inventory (cross-feature)
            yield* inventory.reserve(cart.items)
            
            // Process payment
            const receipt = yield* payment.charge(cart.totalAmount, "token")
            
            // Clear cart
            yield* checkoutRepo.clearCart(userId)
            
            return receipt
          })
      }
    })
  }
) {}

// features/checkout/CheckoutLayer.ts
export const CheckoutLayer = Layer.mergeAll(
  ProcessCheckoutService.Default,
  CheckoutRepositoryPostgresLive,
  PaymentProcessorStripeLive
)

// features/checkout/index.ts - Public API
export { ProcessCheckoutService } from "./services/ProcessCheckout.service"
export { CheckoutLayer } from "./CheckoutLayer"
export type { CheckoutCart } from "./domain/CheckoutCart.model"

// Hide internal details:
// - CheckoutRepository (internal port)
// - PaymentProcessor (internal port)
// - Adapters (internal implementations)
```

---

#### 1.4 Cross-Feature Dependencies

Features can depend on other features, but dependencies must be explicit:

```typescript
// features/checkout/services/ProcessCheckout.service.ts

export class ProcessCheckoutService extends Effect.Service<ProcessCheckoutService>()(
  "ProcessCheckoutService",
  {
    dependencies: [
      CheckoutRepository.Default,
      PaymentProcessor.Default,
      InventoryService.Default,  // ✅ Explicit cross-feature dependency
      EmailService.Default        // ✅ Explicit cross-feature dependency
    ],
    
    effect: Effect.gen(function* () {
      const checkoutRepo = yield* CheckoutRepository
      const payment = yield* PaymentProcessor
      const inventory = yield* InventoryService     // From inventory feature
      const email = yield* EmailService             // From notification feature
      
      return {
        execute: (userId: UserId) =>
          Effect.gen(function* () {
            const cart = yield* checkoutRepo.getCart(userId)
            
            // Cross-feature: Check inventory
            yield* inventory.reserve(cart.items)
            
            // Internal: Process payment
            const receipt = yield* payment.charge(cart.totalAmount, "token")
            
            // Cross-feature: Send confirmation
            yield* email.sendOrderConfirmation(userId, receipt)
            
            yield* checkoutRepo.clearCart(userId)
            
            return receipt
          })
      }
    })
  }
) {}
```

---

#### 1.5 Benefits of Vertical Slices

1. **Clear Boundaries**: Each feature is self-contained
2. **Easy to Understand**: All related code in one place
3. **Team Ownership**: Teams can own entire features
4. **Reduced Conflicts**: Changes isolated to feature directories
5. **Easier Testing**: Test entire feature in isolation
6. **Explicit Dependencies**: Cross-feature dependencies are visible
7. **Scalable**: Easy to extract features into separate packages/services

---

### 2. Command/Query Segregation (CQS)

Command/Query Segregation separates operations that change state (commands) from operations that read state (queries).

#### 2.1 The Problem: Mixed Responsibilities

**❌ Service Mixes Commands and Queries**:

```typescript
// Anti-pattern: Service does everything
class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* OrderRepository
      
      return {
        // Commands (change state)
        createOrder: (items) => /* ... */,
        updateOrderStatus: (id, status) => /* ... */,
        cancelOrder: (id) => /* ... */,
        
        // Queries (read state)
        getOrder: (id) => /* ... */,
        listOrders: (userId) => /* ... */,
        getOrderStats: () => /* ... */,
        
        // More commands
        shipOrder: (id) => /* ... */,
        refundOrder: (id) => /* ... */,
        
        // More queries
        findPendingOrders: () => /* ... */,
        calculateRevenue: (range) => /* ... */
        
        // Service grows to 20+ methods...
      }
    })
  }
) {}
```

**Problems**:
- Unclear which methods have side effects
- Difficult to optimize (commands vs queries need different strategies)
- Hard to test
- Scales poorly (CQRS becomes difficult)

---

#### 2.2 Separate Commands and Queries

**✅ Commands - Change State**:

```typescript
// Commands - Imperative, change state, return minimal data
class CreateOrderCommand extends Effect.Service<CreateOrderCommand>()(
  "CreateOrderCommand",
  {
    dependencies: [OrderRepository.Default, InventoryService.Default],
    
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      const inventory = yield* InventoryService
      
      return {
        execute: (items: OrderItem[]) =>
          Effect.gen(function* () {
            // Reserve inventory
            yield* inventory.reserve(items)
            
            // Create order
            const order = new Order({
              id: OrderId.make(crypto.randomUUID()),
              items,
              status: "pending",
              totalAmount: calculateTotal(items)
            })
            
            // Persist
            yield* orders.save(order)
            
            // Return only ID
            return order.id
          })
      }
    })
  }
) {}

class ShipOrderCommand extends Effect.Service<ShipOrderCommand>()(
  "ShipOrderCommand",
  {
    dependencies: [OrderRepository.Default, ShippingService.Default],
    
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      const shipping = yield* ShippingService
      
      return {
        execute: (orderId: OrderId) =>
          Effect.gen(function* () {
            const order = yield* orders.findById(orderId)
            
            // Create shipment
            const tracking = yield* shipping.createShipment(order)
            
            // Update order
            const shipped = order.markAsShipped(tracking)
            yield* orders.save(shipped)
            
            return tracking.number
          })
      }
    })
  }
) {}

class CancelOrderCommand extends Effect.Service<CancelOrderCommand>()(
  "CancelOrderCommand",
  {
    dependencies: [OrderRepository.Default, PaymentService.Default],
    
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      const payments = yield* PaymentService
      
      return {
        execute: (orderId: OrderId, reason: string) =>
          Effect.gen(function* () {
            const order = yield* orders.findById(orderId)
            
            // Refund payment
            if (order.paymentId) {
              yield* payments.refund(order.paymentId)
            }
            
            // Cancel order
            const cancelled = order.cancel(reason)
            yield* orders.save(cancelled)
          })
      }
    })
  }
) {}
```

**✅ Queries - Read State**:

```typescript
// Queries - Descriptive, read-only, return full data
class OrderQueries extends Effect.Service<OrderQueries>()(
  "OrderQueries",
  {
    dependencies: [OrderRepository.Default],
    
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      
      return {
        // Single order
        findById: (id: OrderId): Effect.Effect<Order, OrderNotFoundError> =>
          orders.findById(id),
        
        // List operations
        listByUser: (userId: UserId): Effect.Effect<Order[]> =>
          orders.findByUser(userId),
        
        listPending: (): Effect.Effect<Order[]> =>
          orders.findByStatus("pending"),
        
        listInDateRange: (start: Date, end: Date): Effect.Effect<Order[]> =>
          orders.findInRange(start, end),
        
        // Statistics and calculations
        getStatistics: (range: DateRange): Effect.Effect<OrderStats> =>
          Effect.gen(function* () {
            const orderList = yield* orders.findInRange(range.start, range.end)
            
            return {
              totalOrders: orderList.length,
              totalRevenue: orderList.reduce(
                (sum, o) => Money.add(sum, o.totalAmount),
                Money.zero
              ),
              averageOrderValue: Money.divide(
                totalRevenue,
                orderList.length
              )
            }
          }),
        
        calculateMonthlyRevenue: (month: Month): Effect.Effect<Money> =>
          Effect.gen(function* () {
            const orderList = yield* orders.findInMonth(month)
            return orderList.reduce(
              (sum, o) => Money.add(sum, o.totalAmount),
              Money.zero
            )
          })
      }
    })
  }
) {}
```

---

#### 2.3 Complete CQS Example

**Application Structure**:

```typescript
// commands/CreateOrderCommand.ts
export class CreateOrderCommand { /* ... */ }

// commands/ShipOrderCommand.ts
export class ShipOrderCommand { /* ... */ }

// commands/CancelOrderCommand.ts
export class CancelOrderCommand { /* ... */ }

// queries/OrderQueries.ts
export class OrderQueries { /* ... */ }

// Separate layers
export const OrderCommandsLayer = Layer.mergeAll(
  CreateOrderCommand.Default,
  ShipOrderCommand.Default,
  CancelOrderCommand.Default
)

export const OrderQueriesLayer = Layer.succeed(
  OrderQueries.Default
)

export const OrderLayer = Layer.mergeAll(
  OrderCommandsLayer,
  OrderQueriesLayer
)
```

**Usage in API**:

```typescript
// HTTP API clearly shows command vs query
export class OrderApi extends HttpApiGroup.make("orders")
  .add(
    // Command - POST (changes state)
    HttpApiEndpoint.post("createOrder", "/orders")
      .setPayload(CreateOrderSchema)
      .addSuccess(Schema.Struct({ orderId: Schema.String }))
  )
  .add(
    // Command - PUT (changes state)
    HttpApiEndpoint.put("shipOrder", "/orders/:id/ship")
      .addSuccess(Schema.Struct({ trackingNumber: Schema.String }))
  )
  .add(
    // Query - GET (reads state)
    HttpApiEndpoint.get("getOrder", "/orders/:id")
      .addSuccess(OrderSchema)
  )
  .add(
    // Query - GET (reads state)
    HttpApiEndpoint.get("listOrders", "/orders")
      .addSuccess(Schema.Array(OrderSchema))
  )
{} {
  static Live = HttpApiBuilder.group(OrderApi, "orders", (handlers) =>
    Effect.gen(function* () {
      // Commands
      const createOrder = yield* CreateOrderCommand
      const shipOrder = yield* ShipOrderCommand
      
      // Queries
      const queries = yield* OrderQueries
      
      return handlers
        .handle("createOrder", ({ payload }) =>
          createOrder.execute(payload.items).pipe(
            Effect.map(orderId => ({ orderId }))
          )
        )
        .handle("shipOrder", ({ path }) =>
          shipOrder.execute(path.id as OrderId).pipe(
            Effect.map(trackingNumber => ({ trackingNumber }))
          )
        )
        .handle("getOrder", ({ path }) =>
          queries.findById(path.id as OrderId)
        )
        .handle("listOrders", () =>
          queries.listByUser(currentUserId)
        )
    })
  )
}
```

---

#### 2.4 Benefits of CQS

1. **Clear Intent**: Obvious which operations have side effects
2. **Different Optimization**: Commands need consistency, queries need performance
3. **Easier Testing**: Commands test state changes, queries test data retrieval
4. **CQRS Ready**: Natural path to full CQRS (different databases for reads/writes)
5. **Better Caching**: Only cache queries, never commands
6. **Simpler API**: HTTP methods match semantics (POST/PUT for commands, GET for queries)

---

### 3. Capability-Based Services

Capability-based services are defined by what they do, not what entity they operate on.

#### 3.1 Entity-Based vs Capability-Based

**❌ Entity-Based (Anti-Pattern)**:

```typescript
// UserService becomes a dumping ground
class UserService {
  // Authentication
  authenticate(credentials)
  refreshToken(token)
  validateToken(token)
  
  // Registration
  register(data)
  verifyEmail(code)
  resendVerification()
  
  // Profile
  updateProfile(data)
  uploadAvatar(file)
  getProfile(id)
  
  // Preferences
  updatePreferences(prefs)
  getPreferences(id)
  
  // Password
  changePassword(old, new)
  resetPassword(email)
  validatePasswordReset(token)
  
  // Notifications
  sendWelcomeEmail()
  sendPasswordResetEmail()
  sendVerificationEmail()
  
  // Admin
  deactivateUser(id)
  promoteToAdmin(id)
  
  // ... grows to 30+ methods
}
```

**✅ Capability-Based (Best Practice)**:

```typescript
// Split by capability

// Authentication capability
class UserAuthenticator extends Effect.Service<UserAuthenticator>()(
  "UserAuthenticator",
  {
    dependencies: [UserRepository.Default, TokenGenerator.Default],
    effect: Effect.gen(function* () {
      const users = yield* UserRepository
      const tokens = yield* TokenGenerator
      
      return {
        authenticate: (credentials: Credentials) =>
          Effect.gen(function* () {
            const user = yield* users.findByEmail(credentials.email)
            yield* validatePassword(credentials.password, user.passwordHash)
            const token = yield* tokens.generate(user.id)
            return { user, token }
          }),
        
        refreshToken: (token: Token) =>
          Effect.gen(function* () {
            const userId = yield* tokens.verify(token)
            return yield* tokens.generate(userId)
          })
      }
    })
  }
) {}

// Registration capability
class UserRegistration extends Effect.Service<UserRegistration>()(
  "UserRegistration",
  {
    dependencies: [UserRepository.Default, EmailService.Default, EventBus.Default],
    effect: Effect.gen(function* () {
      const users = yield* UserRepository
      const email = yield* EmailService
      const events = yield* EventBus
      
      return {
        register: (data: RegistrationData) =>
          Effect.gen(function* () {
            // Validate unique email
            const existing = yield* users.findByEmail(data.email).pipe(
              Effect.map(Option.some),
              Effect.catchTag("UserNotFoundError", () => Effect.succeed(Option.none()))
            )
            
            if (Option.isSome(existing)) {
              return yield* Effect.fail(new EmailAlreadyExistsError())
            }
            
            // Create user
            const user = new User({
              id: UserId.make(crypto.randomUUID()),
              email: data.email,
              passwordHash: yield* hashPassword(data.password),
              emailVerified: false
            })
            
            yield* users.save(user)
            
            // Send verification
            const code = yield* generateVerificationCode(user.id)
            yield* email.sendVerificationEmail(user.email, code)
            
            // Publish event
            yield* events.publish(UserRegisteredEvent(user))
            
            return user
          }),
        
        verifyEmail: (code: VerificationCode) =>
          Effect.gen(function* () {
            const userId = yield* validateVerificationCode(code)
            const user = yield* users.findById(userId)
            const verified = user.markEmailAsVerified()
            yield* users.save(verified)
          })
      }
    })
  }
) {}

// Notification capability
class UserNotifications extends Effect.Service<UserNotifications>()(
  "UserNotifications",
  {
    dependencies: [EmailService.Default, UserRepository.Default],
    effect: Effect.gen(function* () {
      const email = yield* EmailService
      const users = yield* UserRepository
      
      return {
        notifyPasswordReset: (userId: UserId) =>
          Effect.gen(function* () {
            const user = yield* users.findById(userId)
            const resetToken = yield* generateResetToken(userId)
            yield* email.sendPasswordResetEmail(user.email, resetToken)
          }),
        
        notifyAccountCreated: (userId: UserId) =>
          Effect.gen(function* () {
            const user = yield* users.findById(userId)
            yield* email.sendWelcomeEmail(user.email, user.name)
          })
      }
    })
  }
) {}

// Lifecycle capability
class UserLifecycle extends Effect.Service<UserLifecycle>()(
  "UserLifecycle",
  {
    dependencies: [UserRepository.Default, EventBus.Default],
    effect: Effect.gen(function* () {
      const users = yield* UserRepository
      const events = yield* EventBus
      
      return {
        deactivate: (userId: UserId) =>
          Effect.gen(function* () {
            const user = yield* users.findById(userId)
            const deactivated = user.deactivate()
            yield* users.save(deactivated)
            yield* events.publish(UserDeactivatedEvent(userId))
          }),
        
        reactivate: (userId: UserId) =>
          Effect.gen(function* () {
            const user = yield* users.findById(userId)
            const reactivated = user.reactivate()
            yield* users.save(reactivated)
            yield* events.publish(UserReactivatedEvent(userId))
          })
      }
    })
  }
) {}
```

---

#### 3.2 Benefits of Capability-Based Services

1. **Clear Purpose**: Each service has one well-defined capability
2. **Easy to Test**: Focused scope, fewer dependencies
3. **Easy to Understand**: Name tells you exactly what it does
4. **Prevents Bloat**: Can't add unrelated methods
5. **Better Composition**: Combine capabilities as needed
6. **Team Ownership**: Teams can own specific capabilities

---

### 4. Bounded Context Layers

Bounded contexts define clear boundaries between different parts of the domain, each with its own models and services.

#### 4.1 Define Context Boundaries

Each bounded context has its own models and language:

```typescript
// Billing Context
namespace Billing {
  export interface Customer {
    id: CustomerId
    paymentMethods: PaymentMethod[]
    billingAddress: Address
    creditLimit: Money
    outstandingBalance: Money
  }
  
  export interface Invoice {
    id: InvoiceId
    customerId: CustomerId
    lineItems: LineItem[]
    totalAmount: Money
    dueDate: Date
    status: "draft" | "sent" | "paid" | "overdue"
  }
}

// Shipping Context
namespace Shipping {
  export interface Recipient {
    id: RecipientId
    shippingAddress: Address
    preferences: ShippingPreferences
    deliveryInstructions: string
  }
  
  export interface Shipment {
    id: ShipmentId
    recipientId: RecipientId
    packages: Package[]
    carrier: Carrier
    trackingNumber: string
    estimatedDelivery: Date
  }
}

// Inventory Context
namespace Inventory {
  export interface StockItem {
    id: StockItemId
    sku: SKU
    warehouseLocation: Location
    quantityOnHand: number
    quantityReserved: number
    quantityAvailable: number
    reorderPoint: number
  }
}
```

---

#### 4.2 Anti-Corruption Layers

Anti-corruption layers translate between contexts:

```typescript
// Anti-Corruption Layer - Translates between contexts
class CustomerToRecipientAdapter extends Effect.Service<CustomerToRecipientAdapter>()(
  "CustomerToRecipientAdapter",
  {
    effect: Effect.gen(function* () {
      return {
        // Translate Billing.Customer to Shipping.Recipient
        adapt: (customer: Billing.Customer): Shipping.Recipient => ({
          id: RecipientId(customer.id),  // Transform ID
          shippingAddress: customer.billingAddress,  // Use billing address as default
          preferences: {
            carrier: "fedex",
            speed: "standard"
          },
          deliveryInstructions: ""
        }),
        
        // Reverse translation
        adaptBack: (recipient: Shipping.Recipient): Partial<Billing.Customer> => ({
          id: CustomerId(recipient.id),
          billingAddress: recipient.shippingAddress
        })
      }
    })
  }
) {}
```

---

#### 4.3 Context-Specific Layers

Each context has its own layer stack:

```typescript
// Billing Context Layer
const BillingLayer = Layer.mergeAll(
  // Billing-specific services
  PaymentProcessorLive,
  InvoiceGeneratorLive,
  TaxCalculatorLive,
  
  // Billing-specific infrastructure
  BillingDatabaseLive,
  StripeClientLive
)

// Shipping Context Layer
const ShippingLayer = Layer.mergeAll(
  // Shipping-specific services
  CarrierIntegrationLive,
  WarehouseManagementLive,
  TrackingServiceLive,
  
  // Shipping-specific infrastructure
  ShippingDatabaseLive,
  FedExClientLive,
  UPSClientLive
)

// Inventory Context Layer
const InventoryLayer = Layer.mergeAll(
  // Inventory-specific services
  StockTrackerLive,
  ReorderServiceLive,
  LocationManagerLive,
  
  // Inventory-specific infrastructure
  InventoryDatabaseLive,
  WarehouseAPIClientLive
)
```

---

#### 4.4 Compose Contexts with Adapters

Compose contexts at the application root with explicit adapters:

```typescript
// Application Layer - Composes all contexts
const ApplicationLayer = Layer.mergeAll(
  BillingLayer,
  ShippingLayer,
  InventoryLayer,
  
  // Anti-corruption layers for translation
  CustomerToRecipientAdapterLive,
  OrderToShipmentAdapterLive,
  ProductToStockItemAdapterLive
)

// Use case that crosses contexts
class ProcessOrderUseCase extends Effect.Service<ProcessOrderUseCase>()(
  "ProcessOrderUseCase",
  {
    dependencies: [
      BillingService.Default,              // From Billing context
      ShippingService.Default,             // From Shipping context
      InventoryService.Default,            // From Inventory context
      CustomerToRecipientAdapter.Default   // Anti-corruption layer
    ],
    
    effect: Effect.gen(function* () {
      const billing = yield* BillingService
      const shipping = yield* ShippingService
      const inventory = yield* InventoryService
      const adapter = yield* CustomerToRecipientAdapter
      
      return {
        execute: (orderId: OrderId) =>
          Effect.gen(function* () {
            // 1. Get order details
            const order = yield* getOrder(orderId)
            
            // 2. Billing context - Create invoice
            const customer = yield* billing.getCustomer(order.customerId)
            const invoice = yield* billing.createInvoice(customer, order.items)
            
            // 3. Translate between contexts
            const recipient = adapter.adapt(customer)
            
            // 4. Shipping context - Create shipment
            const shipment = yield* shipping.createShipment(recipient, order.items)
            
            // 5. Inventory context - Reduce stock
            yield* inventory.reduceStock(order.items)
            
            return { invoice, shipment }
          })
      }
    })
  }
) {}
```

---

#### 4.5 Benefits of Bounded Contexts

1. **Clear Boundaries**: Each context has its own domain model
2. **Independent Evolution**: Contexts can evolve separately
3. **Team Autonomy**: Different teams can own different contexts
4. **Reduced Coupling**: Contexts only interact through adapters
5. **Clearer Models**: Each context uses language appropriate to its domain

---

### 5. Event-Driven Boundaries

Event-driven architecture decouples services by having them communicate through events rather than direct calls.

#### 5.1 Define Domain Events

```typescript
// Domain Events - Past tense, immutable
interface OrderCreatedEvent {
  readonly _tag: "OrderCreated"
  readonly orderId: OrderId
  readonly userId: UserId
  readonly items: ReadonlyArray<OrderItem>
  readonly totalAmount: Money
  readonly timestamp: Date
}

interface OrderConfirmedEvent {
  readonly _tag: "OrderConfirmed"
  readonly orderId: OrderId
  readonly confirmedAt: Date
}

interface OrderShippedEvent {
  readonly _tag: "OrderShipped"
  readonly orderId: OrderId
  readonly trackingNumber: string
  readonly carrier: string
  readonly shippedAt: Date
}

interface OrderCancelledEvent {
  readonly _tag: "OrderCancelled"
  readonly orderId: OrderId
  readonly reason: string
  readonly cancelledAt: Date
}

type OrderEvent = 
  | OrderCreatedEvent
  | OrderConfirmedEvent
  | OrderShippedEvent
  | OrderCancelledEvent
```

---

#### 4.2 Event Bus Service

```typescript
// Event bus for publish/subscribe
export class EventBus extends Effect.Service<EventBus>()(
  "EventBus",
  {
    scoped: Effect.gen(function* () {
      const subscribers = yield* Ref.make<Map<string, Array<(event: any) => Effect.Effect<void>>>>(
        new Map()
      )
      
      return {
        publish: <E extends { _tag: string }>(event: E) =>
          Effect.gen(function* () {
            const subs = yield* Ref.get(subscribers)
            const handlers = subs.get(event._tag) || []
            
            // Execute all handlers in parallel
            yield* Effect.all(
              handlers.map(handler => handler(event)),
              { concurrency: "unbounded" }
            )
          }),
        
        subscribe: <E extends { _tag: string }>(
          eventTag: E["_tag"],
          handler: (event: E) => Effect.Effect<void>
        ) =>
          Ref.update(subscribers, (subs) => {
            const current = subs.get(eventTag) || []
            return subs.set(eventTag, [...current, handler as any])
          })
      }
    })
  }
) {}
```

---

#### 5.3 Services Publish Events

```typescript
// Order service publishes events, doesn't call other services directly
class OrderProcessingService extends Effect.Service<OrderProcessingService>()(
  "OrderProcessingService",
  {
    dependencies: [OrderRepository.Default, EventBus.Default],
    
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      const events = yield* EventBus
      
      return {
        processOrder: (orderId: OrderId) =>
          Effect.gen(function* () {
            const order = yield* orders.findById(orderId)
            
            // Process the order
            const confirmed = order.confirm()
            yield* orders.save(confirmed)
            
            // Publish event (don't call other services directly)
            yield* events.publish<OrderConfirmedEvent>({
              _tag: "OrderConfirmed",
              orderId: order.id,
              confirmedAt: new Date()
            })
          })
      }
    })
  }
) {}
```

---

#### 5.4 Services Subscribe to Events

```typescript
// Inventory service reacts to order events independently
class InventoryEventHandler extends Effect.Service<InventoryEventHandler>()(
  "InventoryEventHandler",
  {
    dependencies: [EventBus.Default, InventoryService.Default],
    
    effect: Effect.gen(function* () {
      const events = yield* EventBus
      const inventory = yield* InventoryService
      
      // Subscribe to OrderCreated events
      yield* events.subscribe("OrderCreated", (event: OrderCreatedEvent) =>
        Effect.gen(function* () {
          yield* Effect.logInfo(`Reserving inventory for order ${event.orderId}`)
          yield* inventory.reserve(event.items)
        }).pipe(
          // Retry on failure
          Effect.retry(Schedule.exponential("1 second")),
          // Log errors but don't fail
          Effect.catchAll(error =>
            Effect.logError(`Failed to reserve inventory: ${error}`)
          )
        )
      )
      
      // Subscribe to OrderCancelled events
      yield* events.subscribe("OrderCancelled", (event: OrderCancelledEvent) =>
        Effect.gen(function* () {
          yield* Effect.logInfo(`Releasing inventory for order ${event.orderId}`)
          yield* inventory.release(event.orderId)
        })
      )
      
      return {}
    })
  }
) {}

// Email service reacts to order events independently
class EmailEventHandler extends Effect.Service<EmailEventHandler>()(
  "EmailEventHandler",
  {
    dependencies: [EventBus.Default, EmailService.Default],
    
    effect: Effect.gen(function* () {
      const events = yield* EventBus
      const email = yield* EmailService
      
      yield* events.subscribe("OrderCreated", (event: OrderCreatedEvent) =>
        email.sendOrderConfirmation(event.userId, event.orderId).pipe(
          Effect.retry(Schedule.exponential("100 millis")),
          Effect.catchAll(error =>
            Effect.logError(`Failed to send email: ${error}`)
          )
        )
      )
      
      yield* events.subscribe("OrderShipped", (event: OrderShippedEvent) =>
        email.sendShippingNotification(event.orderId, event.trackingNumber)
      )
      
      return {}
    })
  }
) {}
```

---

#### 5.5 Benefits of Event-Driven Boundaries

1. **Loose Coupling**: Services don't know about each other
2. **Independent Scaling**: Event handlers can scale independently
3. **Easy to Add Features**: Subscribe new handlers without changing publishers
4. **Temporal Decoupling**: Publishers don't wait for subscribers
5. **Audit Trail**: Events provide natural audit log
6. **Event Sourcing Ready**: Events can be persisted for event sourcing

---

This completes Section III.B (Service Architecture Patterns). Would you like me to continue with Section III.C (Port and Adapter Patterns)?
