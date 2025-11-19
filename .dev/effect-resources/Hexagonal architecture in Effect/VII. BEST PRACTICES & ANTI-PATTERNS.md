---
modified: 2025-11-04T04:56:13-03:00
---
# VII. BEST PRACTICES & ANTI-PATTERNS

## A. DO: Best Practices

### 1. Layer Composition

#### Provide Dependencies Locally Within Service Files

**✅ BEST PRACTICE**: Each service file should provide its own dependencies locally before exporting, creating a clean, self-contained module.

```typescript
// ✅ CORRECT: Local dependency elimination
// application/services/OrderService/OrderService.service.ts

// Internal layer with dependencies
const OrderServiceLive_Internal = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    const orders = yield* OrderRepository
    const payment = yield* PaymentGateway
    const email = yield* EmailService
    const events = yield* EventBus
    
    return OrderService.of({
      createOrder: (items) => Effect.gen(function* () {
        // Implementation using all dependencies
      })
    })
  })
)

// Export with dependencies provided locally
export const OrderServiceLive = OrderServiceLive_Internal.pipe(
  Layer.provide(OrderRepositoryLive),
  Layer.provide(PaymentGatewayLive),
  Layer.provide(EmailServiceLive),
  Layer.provide(EventBusLive)
)

// Type: Layer<OrderService, never, never>
// ✓ Clean interface, no leaked dependencies
```

**Why This Works**:
- Consumers don't need to know about internal wiring
- Changes to dependencies don't affect consumers
- Testing is simplified (mock at service boundary)
- No merge conflicts in main composition file
- Self-documenting: all dependencies visible in one place

**Real-World Impact**:

```typescript
// main.ts stays clean and simple
const ApplicationLayer = Layer.mergeAll(
  OrderServiceLive,      // Already self-contained
  UserServiceLive,       // Already self-contained
  PaymentServiceLive     // Already self-contained
)

// No dependency management needed here!
const program = myApp.pipe(
  Effect.provide(ApplicationLayer)
)
```

---

#### Compose All Layers into MainLayer, Then Effect.provide Once

**✅ BEST PRACTICE**: Build the complete dependency graph first, then provide it in a single operation.

```typescript
// ✅ CORRECT: Single provide with complete layer graph

// Step 1: Define infrastructure layer
const InfrastructureLayer = Layer.mergeAll(
  DatabaseLive,
  CacheLive,
  MessageQueueLive,
  FileStorageLive
)

// Step 2: Define application layer
const ApplicationLayer = Layer.mergeAll(
  OrderServiceLive,
  UserServiceLive,
  InventoryServiceLive
).pipe(
  Layer.provide(InfrastructureLayer)
)

// Step 3: Define API layer
const ApiLayer = Layer.mergeAll(
  HttpServerLive,
  GraphQLServerLive
).pipe(
  Layer.provide(ApplicationLayer)
)

// Step 4: Single provide call
const program = myApp.pipe(
  Effect.provide(ApiLayer)  // ✓ ONE provide, complete graph
)

Effect.runPromise(program)
```

**What This Achieves**:
- **Single Scope**: All services share one scope and MemoMap
- **Memoization Works**: Each service constructed exactly once
- **Resource Safety**: All cleanup happens in correct order
- **Type Safety**: Compiler verifies complete dependency graph

**Performance Comparison**:

```typescript
// ❌ Multiple provides - Database built 3 times
const bad = program
  .pipe(Effect.provide(OrderServiceLive))
  .pipe(Effect.provide(UserServiceLive))
  .pipe(Effect.provide(DatabaseLive))
// Result: Database constructed 3 times! 🔥

// ✅ Single provide - Database built once
const good = program.pipe(
  Effect.provide(Layer.mergeAll(
    OrderServiceLive,
    UserServiceLive,
    DatabaseLive
  ))
)
// Result: Database constructed once, shared ✅
```

---

#### Use Layer.merge for Independent Services

**✅ BEST PRACTICE**: Use `Layer.merge` or `Layer.mergeAll` to combine services that don't depend on each other.

```typescript
// ✅ CORRECT: Merge independent services

// These services don't depend on each other
const FeatureALayer = Layer.effect(
  FeatureAService,
  Effect.gen(function* () {
    const repoA = yield* FeatureARepository
    return { /* service A implementation */ }
  })
).pipe(Layer.provide(FeatureARepositoryLive))

const FeatureBLayer = Layer.effect(
  FeatureBService,
  Effect.gen(function* () {
    const repoB = yield* FeatureBRepository
    return { /* service B implementation */ }
  })
).pipe(Layer.provide(FeatureBRepositoryLive))

// Merge independent features
const FeaturesLayer = Layer.mergeAll(
  FeatureALayer,
  FeatureBLayer
)

// Type: Layer<FeatureAService | FeatureBService, never, never>
```

**When to Use Merge**:
- Services at the same architectural level
- No dependencies between services
- Want to build services in parallel
- Combining feature modules

**Example - Feature Modules**:

```typescript
const ApplicationLayer = Layer.mergeAll(
  CheckoutFeatureLayer,     // Independent feature
  InventoryFeatureLayer,    // Independent feature
  UserManagementLayer,      // Independent feature
  ReportingLayer            // Independent feature
)

// All features build in parallel, no sequential dependencies
```

---

#### Use Layer.provide to Erase Dependencies

**✅ BEST PRACTICE**: Use `Layer.provide` when you want to satisfy a dependency without exposing it.

```typescript
// ✅ CORRECT: Erase internal dependency

// Service needs Database, but consumers shouldn't know
const OrderRepositoryLive = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const db = yield* Database  // Internal dependency
    return {
      findById: (id) => db.query(`SELECT * FROM orders WHERE id = ${id}`)
    }
  })
).pipe(
  Layer.provide(DatabaseLive)  // Erase Database dependency
)

// Type: Layer<OrderRepository, never, never>
//                              ↑ Database dependency erased

// Consumers only see OrderRepository
const program = Effect.gen(function* () {
  const repo = yield* OrderRepository  // No Database needed
  return yield* repo.findById(orderId)
})
```

**Use Cases**:
- Internal implementation details (database, cache)
- Configuration dependencies
- Helper services consumers don't need
- Technology-specific dependencies

**Example - Configuration Erasure**:

```typescript
const EmailServiceLive = Layer.effect(
  EmailService,
  Effect.gen(function* () {
    const config = yield* EmailConfig     // Internal
    const smtp = yield* SmtpClient        // Internal
    
    return {
      send: (email) => smtp.send({ ...email, from: config.defaultFrom })
    }
  })
).pipe(
  Layer.provide(EmailConfigLive),  // Erase config
  Layer.provide(SmtpClientLive)    // Erase SMTP
)

// Type: Layer<EmailService, never, never>
// Consumers don't know about config or SMTP client
```

---

#### Use Layer.provideMerge to Expose Shared Dependencies

**✅ BEST PRACTICE**: Use `Layer.provideMerge` when multiple services need access to the same dependency.

```typescript
// ✅ CORRECT: Expose shared infrastructure

// Multiple services need Database
const OrderServiceLive = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    const db = yield* Database
    return { /* uses database */ }
  })
)

const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database
    return { /* uses database */ }
  })
)

// Provide Database and keep it exposed
const ServicesWithDatabase = OrderServiceLive.pipe(
  Layer.provideMerge(DatabaseLive)  // Database exposed
)

// Type: Layer<OrderService | Database, never, never>
//             ↑ Both available

// Now UserService can access the same Database
const AllServices = UserServiceLive.pipe(
  Layer.provide(ServicesWithDatabase)
)

// Database is shared, built once
```

**When to Use provideMerge**:
- Shared infrastructure (database, cache, logger)
- Multiple services need same dependency
- Want to expose infrastructure for other services
- Avoiding redundant construction

**Example - Shared Logger**:

```typescript
const ServicesLayer = Layer.mergeAll(
  OrderServiceLive,
  UserServiceLive,
  PaymentServiceLive
).pipe(
  Layer.provideMerge(LoggerLive)  // All services share logger
)

// Type: Layer<OrderService | UserService | PaymentService | Logger, never, never>
// Logger available to all services and exposed for other use
```

---

#### Store Layer References (Avoid Function-Generated Layers)

**✅ BEST PRACTICE**: Create layer instances once and reuse them by reference.

```typescript
// ✅ CORRECT: Store layer reference

// Create layer once
export const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config
    const pool = yield* acquireConnectionPool(config)
    yield* Effect.addFinalizer(() => pool.close())
    return createDatabaseService(pool)
  })
).pipe(Layer.provide(ConfigLive))

// Use same reference everywhere
const OrderRepositoryLive = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const db = yield* Database
    return { /* implementation */ }
  })
).pipe(Layer.provide(DatabaseLive))  // Same reference

const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const db = yield* Database
    return { /* implementation */ }
  })
).pipe(Layer.provide(DatabaseLive))  // Same reference

// Database built once, memoized, shared ✓
```

**Why References Matter**:

```typescript
// ❌ BAD: Function generates new references
const makeDbLayer = (config: Config) =>
  Layer.effect(Database, createDatabase(config))

const repo1 = makeRepo().pipe(
  Layer.provide(makeDbLayer(config))  // Reference A
)

const repo2 = makeRepo().pipe(
  Layer.provide(makeDbLayer(config))  // Reference B (different!)
)

// Database built twice, not shared ❌

// ✅ GOOD: Store and reuse reference
const DbLive = makeDbLayer(config)  // Create once

const repo1 = makeRepo().pipe(Layer.provide(DbLive))
const repo2 = makeRepo().pipe(Layer.provide(DbLive))

// Database built once, shared ✓
```

**Parameterized Layers Pattern**:

```typescript
// If you need parameters, create once with them
const config = loadConfig()

export const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const pool = yield* acquireConnectionPool(config)
    // Use config here
    yield* Effect.addFinalizer(() => pool.close())
    return createDatabaseService(pool)
  })
)

// Or use configuration as a service
const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* DatabaseConfig  // Get from service
    const pool = yield* acquireConnectionPool(config)
    yield* Effect.addFinalizer(() => pool.close())
    return createDatabaseService(pool)
  })
).pipe(Layer.provide(DatabaseConfigLive))

// Reusable, memoizable, clean
```

---

### 2. Service Design

#### One Service Per Capability/Use Case

**✅ BEST PRACTICE**: Each service should have a single, well-defined capability.

```typescript
// ✅ CORRECT: Focused, capability-based services

// Authentication capability
export class UserAuthenticator extends Effect.Service<UserAuthenticator>()(
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
export class UserRegistration extends Effect.Service<UserRegistration>()(
  "UserRegistration",
  {
    dependencies: [UserRepository.Default, EmailService.Default],
    effect: Effect.gen(function* () {
      const users = yield* UserRepository
      const email = yield* EmailService
      
      return {
        register: (data: RegistrationData) =>
          Effect.gen(function* () {
            // Check uniqueness
            const existing = yield* users.findByEmail(data.email).pipe(
              Effect.match({
                onFailure: () => Option.none(),
                onSuccess: (user) => Option.some(user)
              })
            )
            
            if (Option.isSome(existing)) {
              return yield* Effect.fail(new EmailAlreadyExistsError())
            }
            
            // Create user
            const user = yield* createUser(data)
            yield* users.save(user)
            
            // Send verification
            yield* email.sendVerificationEmail(user.email)
            
            return user
          })
      }
    })
  }
) {}

// Password management capability
export class PasswordManager extends Effect.Service<PasswordManager>()(
  "PasswordManager",
  {
    dependencies: [UserRepository.Default, EmailService.Default],
    effect: Effect.gen(function* () {
      const users = yield* UserRepository
      const email = yield* EmailService
      
      return {
        changePassword: (userId: UserId, oldPassword: string, newPassword: string) =>
          Effect.gen(function* () {
            const user = yield* users.findById(userId)
            yield* validatePassword(oldPassword, user.passwordHash)
            
            const updated = yield* updatePassword(user, newPassword)
            yield* users.save(updated)
            
            yield* email.sendPasswordChangedNotification(user.email)
          }),
        
        resetPassword: (email: Email) =>
          Effect.gen(function* () {
            const user = yield* users.findByEmail(email)
            const token = yield* generateResetToken(user.id)
            yield* email.sendPasswordResetEmail(user.email, token)
          })
      }
    })
  }
) {}
```

**Benefits**:
- Easy to understand (clear purpose)
- Easy to test (focused scope)
- Easy to maintain (single responsibility)
- Easy to replace (small surface area)
- Prevents bloat (can't add unrelated methods)

---

#### Capability-Based Names (Not Entity-Based)

**✅ BEST PRACTICE**: Name services after what they do, not what entity they operate on.

```typescript
// ❌ BAD: Entity-based (becomes dumping ground)
class UserService {
  authenticate() {}
  register() {}
  updateProfile() {}
  changePassword() {}
  sendEmail() {}
  calculateAge() {}
  // ... grows to 30+ methods
}

// ✅ GOOD: Capability-based (clear boundaries)
class UserAuthenticator {
  authenticate(credentials: Credentials) {}
  refreshToken(token: Token) {}
}

class UserRegistration {
  register(data: RegistrationData) {}
  verifyEmail(code: VerificationCode) {}
}

class UserProfileManager {
  updateProfile(userId: UserId, data: ProfileData) {}
  uploadAvatar(userId: UserId, file: File) {}
}

class PasswordManager {
  changePassword(userId: UserId, old: string, new: string) {}
  resetPassword(email: Email) {}
}

class UserNotifications {
  sendWelcomeEmail(userId: UserId) {}
  sendPasswordResetEmail(userId: UserId) {}
}
```

**Naming Formula**: `[Subject][Capability]`
- `OrderCheckout` (not `OrderService`)
- `PaymentProcessor` (not `PaymentService`)
- `EmailDelivery` (not `EmailService`)
- `InventoryTracker` (not `InventoryService`)

---

#### Single Responsibility Principle

**✅ BEST PRACTICE**: Each service should have one reason to change.

```typescript
// ✅ CORRECT: Single responsibility

export class OrderCheckout extends Effect.Service<OrderCheckout>()(
  "OrderCheckout",
  {
    dependencies: [
      CartRepository.Default,
      PaymentGateway.Default,
      OrderRepository.Default
    ],
    effect: Effect.gen(function* () {
      const cart = yield* CartRepository
      const payment = yield* PaymentGateway
      const orders = yield* OrderRepository
      
      return {
        // Single responsibility: checkout process
        processCheckout: (userId: UserId, paymentToken: string) =>
          Effect.gen(function* () {
            // 1. Get cart
            const cartItems = yield* cart.getCart(userId)
            
            // 2. Process payment
            const receipt = yield* payment.charge(
              calculateTotal(cartItems),
              paymentToken
            )
            
            // 3. Create order
            const order = new Order({
              userId,
              items: cartItems,
              paymentId: receipt.id
            })
            yield* orders.save(order)
            
            // 4. Clear cart
            yield* cart.clear(userId)
            
            return order
          })
      }
    })
  }
) {}

// Separate responsibility: fulfillment
export class OrderFulfillment extends Effect.Service<OrderFulfillment>()(
  "OrderFulfillment",
  {
    dependencies: [
      OrderRepository.Default,
      InventoryService.Default,
      ShippingService.Default
    ],
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      const inventory = yield* InventoryService
      const shipping = yield* ShippingService
      
      return {
        // Single responsibility: fulfillment process
        fulfillOrder: (orderId: OrderId) =>
          Effect.gen(function* () {
            const order = yield* orders.findById(orderId)
            
            yield* inventory.pickItems(order.items)
            const shipment = yield* shipping.createShipment(order)
            
            const fulfilled = order.markAsShipped(shipment.trackingNumber)
            yield* orders.save(fulfilled)
          })
      }
    })
  }
) {}
```

**Test**: If you can't describe the service in one sentence without using "and", it probably has multiple responsibilities.

---

#### Depend Only on Port Abstractions

**✅ BEST PRACTICE**: Services should depend on ports (interfaces), never concrete adapters.

```typescript
// ✅ CORRECT: Depend on port abstractions

export class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    // Depend on PORTS (abstractions)
    dependencies: [
      OrderRepository.Default,    // ✓ Port
      PaymentGateway.Default,     // ✓ Port
      EmailService.Default        // ✓ Port
    ],
    
    effect: Effect.gen(function* () {
      // Access through port interfaces
      const orders = yield* OrderRepository    // Port
      const payment = yield* PaymentGateway    // Port
      const email = yield* EmailService        // Port
      
      return {
        createOrder: (items: OrderItem[]) =>
          Effect.gen(function* () {
            // Use port methods
            const order = new Order({ items })
            yield* payment.charge(order.total, "token")
            yield* orders.save(order)
            yield* email.sendConfirmation(order)
            return order
          })
      }
    })
  }
) {}

// ❌ WRONG: Depend on concrete adapter
const OrderServiceBad = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    // ❌ Depends on concrete implementations
    const orders = yield* OrderRepositoryPostgresLive
    const payment = yield* PaymentGatewayStripeLive
    
    return {
      createOrder: (items) => {
        // Now tightly coupled to Postgres and Stripe!
      }
    }
  })
)
```

**Why This Matters**:
- Can swap implementations (Postgres → MongoDB, Stripe → PayPal)
- Can test with fakes/mocks
- Clear dependency boundaries
- Technology independence

---

#### Keep Services Focused and Cohesive

**✅ BEST PRACTICE**: All methods in a service should relate to the same capability.

```typescript
// ✅ CORRECT: Cohesive service

export class OrderCancellation extends Effect.Service<OrderCancellation>()(
  "OrderCancellation",
  {
    dependencies: [
      OrderRepository.Default,
      PaymentService.Default,
      InventoryService.Default,
      EmailService.Default
    ],
    
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      const payment = yield* PaymentService
      const inventory = yield* InventoryService
      const email = yield* EmailService
      
      return {
        // All methods related to cancellation
        cancelOrder: (orderId: OrderId, reason: string) =>
          Effect.gen(function* () {
            const order = yield* orders.findById(orderId)
            
            // Refund
            if (order.paymentId) {
              yield* payment.refund(order.paymentId)
            }
            
            // Release inventory
            yield* inventory.release(order.items)
            
            // Update order
            const cancelled = order.cancel(reason)
            yield* orders.save(cancelled)
            
            // Notify
            yield* email.sendCancellationNotification(order)
          }),
        
        canCancel: (orderId: OrderId) =>
          Effect.gen(function* () {
            const order = yield* orders.findById(orderId)
            return order.status === "pending" || order.status === "confirmed"
          }),
        
        calculateRefundAmount: (orderId: OrderId) =>
          Effect.gen(function* () {
            const order = yield* orders.findById(orderId)
            // Calculation logic for refund
            return calculateRefund(order)
          })
      }
    })
  }
) {}

// ❌ WRONG: Unfocused service with unrelated methods
class OrderServiceBad {
  createOrder() {}       // Creation
  cancelOrder() {}       // Cancellation
  shipOrder() {}         // Fulfillment
  calculateTax() {}      // Pricing
  sendEmail() {}         // Notifications
  generateReport() {}    // Reporting
  // Not cohesive!
}
```

**Cohesion Test**: Can you describe what the service does in a single, concise sentence?

---

### 3. Port Design

#### Interfaces with Effect-Returning Methods

**✅ BEST PRACTICE**: Port methods should return `Effect` for composability and type safety.

```typescript
// ✅ CORRECT: Effect-returning interface

export interface OrderRepository {
  readonly save: (order: Order) => Effect.Effect<
    void,
    DatabaseError,
    never
  >
  
  readonly findById: (id: OrderId) => Effect.Effect<
    Order,
    OrderNotFoundError | DatabaseError,
    never
  >
  
  readonly findByUser: (userId: UserId) => Effect.Effect<
    Order[],
    DatabaseError,
    never
  >
  
  readonly update: (order: Order) => Effect.Effect<
    Order,
    OrderNotFoundError | DatabaseError,
    never
  >
  
  readonly delete: (id: OrderId) => Effect.Effect<
    void,
    OrderNotFoundError | DatabaseError,
    never
  >
}

export class OrderRepository extends Context.Tag("OrderRepository")<
  OrderRepository,
  OrderRepository
>() {}
```

**Benefits**:
- **Composable**: Methods can be chained with `pipe` and `flatMap`
- **Error Handling**: Explicit error types, type-safe error handling
- **Dependencies**: Can require additional dependencies
- **Testability**: Easy to provide test implementations
- **Async**: Naturally handles asynchronous operations

**Usage**:

```typescript
const program = Effect.gen(function* () {
  const repo = yield* OrderRepository
  
  // Compose operations
  const order = yield* repo.findById(orderId).pipe(
    Effect.flatMap((order) =>
      order.status === "pending"
        ? repo.update(order.confirm())
        : Effect.fail(new InvalidStateError())
    ),
    Effect.tap((order) => repo.save(order)),
    Effect.retry(Schedule.exponential("100 millis"))
  )
  
  return order
})
```

---

#### Clear, Descriptive Method Names

**✅ BEST PRACTICE**: Method names should clearly describe what they do and what they return.

```typescript
// ✅ CORRECT: Clear, descriptive names

export interface UserRepository {
  // Existence checks
  readonly exists: (id: UserId) => Effect.Effect<boolean>
  readonly existsByEmail: (email: Email) => Effect.Effect<boolean>
  
  // Single retrieval (Option - may not exist)
  readonly findById: (id: UserId) => Effect.Effect<Option<User>>
  readonly findByEmail: (email: Email) => Effect.Effect<Option<User>>
  
  // Single retrieval (must exist or fail)
  readonly getById: (id: UserId) => Effect.Effect<User, UserNotFoundError>
  
  // Multiple retrieval
  readonly findAll: () => Effect.Effect<User[]>
  readonly findByRole: (role: UserRole) => Effect.Effect<User[]>
  readonly findActive: () => Effect.Effect<User[]>
  
  // Persistence
  readonly save: (user: User) => Effect.Effect<void>
  readonly saveAll: (users: User[]) => Effect.Effect<void>
  
  // Updates
  readonly update: (user: User) => Effect.Effect<User>
  readonly updateEmail: (id: UserId, email: Email) => Effect.Effect<void>
  
  // Deletion
  readonly delete: (id: UserId) => Effect.Effect<void>
  readonly deleteAll: (ids: UserId[]) => Effect.Effect<number>
}

// ❌ BAD: Unclear names
export interface BadUserRepository {
  get: (x: string) => Effect.Effect<any>        // What does it get? What's x?
  put: (y: any) => Effect.Effect<void>          // Put what? Where?
  remove: (z: any) => Effect.Effect<boolean>    // Remove what? Why boolean?
  fetch: () => Effect.Effect<unknown[]>         // Fetch what?
}
```

**Naming Conventions**:
- `find*`: Returns `Option` or array (may be empty)
- `get*`: Returns value or fails (must exist)
- `exists*`: Returns boolean
- `save*`: Persist entity
- `update*`: Modify existing entity
- `delete*`: Remove entity

---

#### Explicit Error Types in Signatures

**✅ BEST PRACTICE**: Declare all possible errors in the `Effect` signature.

```typescript
// ✅ CORRECT: Explicit error types

export interface OrderService {
  readonly createOrder: (items: OrderItem[]) => Effect.Effect<
    Order,
    // All possible errors explicitly listed
    | OrderValidationError
    | PaymentDeclinedError
    | InsufficientInventoryError
    | DatabaseError,
    never
  >
  
  readonly getOrder: (id: OrderId) => Effect.Effect<
    Order,
    | OrderNotFoundError
    | DatabaseError,
    never
  >
  
  readonly cancelOrder: (id: OrderId, reason: string) => Effect.Effect<
    void,
    | OrderNotFoundError
    | InvalidOrderStateError
    | RefundError
    | DatabaseError,
    never
  >
}

// Consumers know exactly what to handle
const program = Effect.gen(function* () {
  const service = yield* OrderService
  
  const order = yield* service.createOrder(items).pipe(
    Effect.catchTags({
      OrderValidationError: (e) => logAndRetry(e),
      PaymentDeclinedError: (e) => notifyUser(e),
      InsufficientInventoryError: (e) => suggestAlternatives(e),
      DatabaseError: (e) => retryWithBackoff(e)
    })
  )
})
```

**Benefits**:
- **Documentation**: Signature tells you what can go wrong
- **Type Safety**: Compiler ensures all errors handled
- **Refactoring**: Adding new error types breaks compilation
- **Testing**: Know exactly what error cases to test

---

#### Minimal, Focused Interfaces (ISP)

**✅ BEST PRACTICE**: Keep interfaces small and focused (Interface Segregation Principle).

```typescript
// ✅ CORRECT: Split into focused interfaces

// Read operations only
export interface OrderQueries {
  readonly findById: (id: OrderId) => Effect.Effect<Order, OrderNotFoundError>
  readonly findByUser: (userId: UserId) => Effect.Effect<Order[]>
  readonly findByStatus: (status: OrderStatus) => Effect.Effect<Order[]>
  readonly countOrders: (filter: OrderFilter) => Effect.Effect<number>
}

// Write operations only
export interface OrderCommands {
  readonly create: (data: CreateOrderData) => Effect.Effect<Order, OrderError>
  readonly update: (order: Order) => Effect.Effect<Order>
  readonly delete: (id: OrderId) => Effect.Effect<void>
}

// Event operations only
export interface OrderEvents {
  readonly publishCreated: (order: Order) => Effect.Effect<void>
  readonly publishUpdated: (order: Order) => Effect.Effect<void>
  readonly publishDeleted: (id: OrderId) => Effect.Effect<void>
}

// Clients depend only on what they need
const readOnlyReport = Effect.gen(function* () {
  const queries = yield* OrderQueries  // Only needs read
  return yield* queries.findByStatus("pending")
})

// ❌ BAD: Monolithic interface
export interface BadOrderRepository {
  // 50+ methods all in one interface
  findById() {}
  findByUser() {}
  findByStatus() {}
  create() {}
  update() {}
  delete() {}
  publishEvent() {}
  generateReport() {}
  exportToCsv() {}
  // ... 40 more methods
  // Clients forced to depend on everything!
}
```

**Rule of Thumb**: If an interface has more than 5-7 methods, consider splitting it.

---

### 4. Testing

#### Test Doubles at Port Boundaries

**✅ BEST PRACTICE**: Create test doubles that implement port interfaces, not internal implementations.

```typescript
// ✅ CORRECT: Test double implements port interface

// ports/secondary/OrderRepository/OrderRepository.port.fake.ts
export const OrderRepositoryFake = Layer.effect(
  OrderRepository,  // Implements the PORT interface
  Effect.gen(function* () {
    const orders = yield* Ref.make(new Map<OrderId, Order>())
    
    // Implements EXACTLY the port interface
    return OrderRepository.of({
      save: (order: Order) =>
        Ref.update(orders, (map) => map.set(order.id, order)),
      
      findById: (id: OrderId) =>
        Effect.gen(function* () {
          const map = yield* Ref.get(orders)
          const order = map.get(id)
          if (!order) {
            return yield* Effect.fail(new OrderNotFoundError({ orderId: id }))
          }
          return order
        }),
      
      findByUser: (userId: UserId) =>
        Effect.gen(function* () {
          const map = yield* Ref.get(orders)
          return Array.from(map.values()).filter(o => o.userId === userId)
        })
    })
  })
)

// Tests use the fake
describe("OrderService", () => {
  it.effect("should create order", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      const order = yield* service.createOrder(items)
      
      assert.isDefined(order.id)
    }).pipe(
      Effect.provide(Layer.mergeAll(
        OrderServiceLive,
        OrderRepositoryFake,  // Test double at port boundary
        PaymentGatewayFake
      ))
    )
  )
})
```

**Why Port Boundaries**:
- Test against interface, not implementation
- Same test double works for all tests
- Can run contract tests to verify correctness
- Easy to swap (fake → real) for integration tests

---

#### Fast Tests with In-Memory Implementations

**✅ BEST PRACTICE**: Use in-memory implementations for fast test execution.

```typescript
// ✅ CORRECT: In-memory implementations for speed

// Test layer with in-memory adapters
export const TestLayer = Layer.mergeAll(
  OrderServiceLive,              // Real service
  InventoryServiceLive,          // Real service
  OrderRepositoryMemoryLive,     // In-memory (fast)
  InventoryRepositoryMemoryLive, // In-memory (fast)
  PaymentGatewayMockLive,        // Mock (fast)
  EmailServiceFakeLive           // Fake (fast)
)

describe("Order Processing", () => {
  it.effect("should complete checkout workflow", () =>
    Effect.gen(function* () {
      const orders = yield* OrderService
      const inventory = yield* InventoryService
      
      yield* inventory.addStock("ABC", 10)
      
      const order = yield* orders.createOrder([
        { sku: "ABC", quantity: 2 }
      ])
      
      const stock = yield* inventory.getStock("ABC")
      assert.strictEqual(stock.available, 8)
    }).pipe(Effect.provide(TestLayer))
  )
  // Test runs in <50ms
})

// ❌ BAD: Real database in unit/integration tests
const SlowTestLayer = Layer.mergeAll(
  OrderServiceLive,
  OrderRepositoryPostgresLive  // Real Postgres (slow)
)

// Test takes 500ms+ due to database overhead
```

**Speed Comparison**:
- In-memory: <50ms per test
- Real database: 500-2000ms per test
- 10x-40x faster with in-memory!

---

#### Contract Tests for All Ports

**✅ BEST PRACTICE**: Write contract tests that verify port implementations satisfy the interface.

```typescript
// ✅ CORRECT: Contract tests verify port behavior

// ports/secondary/OrderRepository/OrderRepository.port.contract.test.ts
import { describe, it } from "@effect/vitest"
import { OrderRepository } from "./OrderRepository.port"
import { OrderRepositoryFake } from "./OrderRepository.port.fake"

/**
 * Contract tests for OrderRepository
 * These tests define the expected behavior of ANY implementation
 */
describe("OrderRepository - Contract Tests", () => {
  it.effect("MUST save and retrieve order", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      
      const order = new Order({ id: OrderId.make("1"), /* ... */ })
      yield* repo.save(order)
      
      const retrieved = yield* repo.findById(order.id)
      assert.deepEqual(retrieved, order)
    }).pipe(Effect.provide(OrderRepositoryFake))
  )
  
  it.effect("MUST fail with OrderNotFoundError when not found", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      const exit = yield* Effect.exit(
        repo.findById(OrderId.make("non-existent"))
      )
      
      assert.isTrue(Exit.isFailure(exit))
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause)
        assert.instanceOf(Option.getOrThrow(error), OrderNotFoundError)
      }
    }).pipe(Effect.provide(OrderRepositoryFake))
  )
  
  it.effect("MUST update existing order", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      
      const original = new Order({ /* ... */ })
      yield* repo.save(original)
      
      const updated = new Order({ ...original, status: "confirmed" })
      yield* repo.save(updated)
      
      const retrieved = yield* repo.findById(original.id)
      assert.strictEqual(retrieved.status, "confirmed")
    }).pipe(Effect.provide(OrderRepositoryFake))
  )
})

// ALL implementations must pass these tests
// Run same tests against Postgres, MongoDB, etc.
```

**Contract Test Benefits**:
- **Specification**: Tests define the contract
- **Compliance**: All implementations must pass
- **Confidence**: Know adapters behave correctly
- **Documentation**: Tests document expected behavior

---

#### Swap Layers for Different Environments

**✅ BEST PRACTICE**: Use different layer compositions for different environments.

```typescript
// ✅ CORRECT: Environment-specific layers

// Test environment - all fakes/mocks
export const TestLayer = Layer.mergeAll(
  OrderServiceLive,
  OrderRepositoryMemoryLive,
  PaymentGatewayMockLive,
  EmailServiceFakeLive
)

// Development environment - fast, local
export const DevLayer = Layer.mergeAll(
  OrderServiceLive,
  OrderRepositoryMemoryLive,    // Fast local
  PaymentGatewayMockLive,        // No real charges
  EmailServiceConsoleLive        // Log to console
)

// Production environment - real implementations
export const ProdLayer = Layer.mergeAll(
  OrderServiceLive,
  OrderRepositoryPostgresLive,
  PaymentGatewayStripeLive,
  EmailServiceSmtpLive
)

// Swap with single line
const layer = 
  process.env.NODE_ENV === "test" ? TestLayer :
  process.env.NODE_ENV === "production" ? ProdLayer :
  DevLayer

const program = myApp.pipe(Effect.provide(layer))
```

**Environment Strategy**:

```typescript
// infrastructure/layers/index.ts
export const getApplicationLayer = () => {
  const env = process.env.NODE_ENV
  
  if (env === "test") {
    return TestLayer  // Fast, isolated
  }
  
  if (env === "development") {
    return DevLayer  // Fast, convenient
  }
  
  if (env === "production") {
    return ProdLayer  // Real, monitored
  }
  
  return DevLayer  // Default to dev
}

// main.ts
import { getApplicationLayer } from "./infrastructure/layers"

const program = myApp.pipe(
  Effect.provide(getApplicationLayer())
)
```

---

### 5. Type Safety

#### Use Branded Types for Domain Identifiers

**✅ BEST PRACTICE**: Use branded types to prevent mixing incompatible identifiers.

```typescript
// ✅ CORRECT: Branded types prevent mistakes

// domain/value-objects/ids.ts
import { Brand } from "effect"

export type UserId = string & Brand.Brand<"UserId">
export const UserId = Brand.nominal<UserId>()

export type OrderId = string & Brand.Brand<"OrderId">
export const OrderId = Brand.nominal<OrderId>()

export type ProductId = string & Brand.Brand<"ProductId">
export const ProductId = Brand.nominal<ProductId>()

// Cannot mix types
const userId = UserId.make("user-123")
const orderId = OrderId.make("order-456")

function getOrder(id: OrderId): Effect.Effect<Order> {
  // ...
}

// ✓ Type safe
getOrder(orderId)

// ✗ Compile error - cannot pass UserId where OrderId expected
getOrder(userId)  // TYPE ERROR!
```

**Real Bug Prevention**:

```typescript
// Without branded types - bugs!
function processOrder(userId: string, orderId: string) {
  // Easy to mix up parameters
  database.query(`SELECT * FROM orders WHERE user_id = ${orderId}`)  // ❌ Bug!
}

processOrder("order-123", "user-456")  // Wrong order, no error!

// With branded types - compile-time safety!
function processOrder(userId: UserId, orderId: OrderId) {
  database.query(`SELECT * FROM orders WHERE user_id = ${userId}`)  // ✓ Correct
}

processOrder(orderId, userId)  // ✓ TYPE ERROR - caught immediately!
```

---

#### Make Invalid States Unrepresentable

**✅ BEST PRACTICE**: Use types to prevent invalid states at compile time.

```typescript
// ✅ CORRECT: Impossible to represent invalid state

// Status is a literal union - can only be these values
export const OrderStatus = Schema.Literal(
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled"
)
export type OrderStatus = Schema.Schema.Type<typeof OrderStatus>

export class Order extends Schema.Class<Order>("Order")({
  id: Schema.String.pipe(Schema.brand("OrderId")),
  status: OrderStatus,  // Can ONLY be one of the literal values
  items: Schema.Array(OrderItem).pipe(
    Schema.minItems(1)  // CANNOT have empty items
  ),
  totalAmount: Schema.Number.pipe(
    Schema.nonNegative  // CANNOT be negative
  )
}) {
  // State transitions enforce validity
  confirm(): Order {
    // Can only confirm pending orders
    if (this.status !== "pending") {
      throw new InvalidTransitionError({
        from: this.status,
        to: "confirmed"
      })
    }
    return new Order({ ...this, status: "confirmed" })
  }
}

// ❌ WRONG: Invalid states possible
class BadOrder {
  status: string  // Could be anything!
  items: any[]    // Could be empty!
  total: number   // Could be negative!
}

const bad = new BadOrder()
bad.status = "invalid"  // No error!
bad.items = []          // No error!
bad.total = -100        // No error!
```

**More Examples**:

```typescript
// Email must be valid format
export type Email = string & Brand.Brand<"Email">
export const Email = Brand.refined<Email>(
  (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),
  (s) => Brand.error(`Invalid email: ${s}`)
)

// Percentage must be 0-100
export type Percentage = number & Brand.Brand<"Percentage">
export const Percentage = Brand.refined<Percentage>(
  (n) => n >= 0 && n <= 100,
  (n) => Brand.error(`Percentage must be 0-100, got ${n}`)
)

// Non-empty array
export const NonEmptyArray = <A>(schema: Schema.Schema<A>) =>
  Schema.Array(schema).pipe(Schema.minItems(1))
```

---

#### Explicit Error Types in Effect Signatures

**✅ BEST PRACTICE**: Always declare error types explicitly in the `E` channel.

```typescript
// ✅ CORRECT: Explicit errors

export class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    effect: Effect.gen(function* () {
      return {
        createOrder: (items: OrderItem[]): Effect.Effect<
          Order,
          // Explicit error types
          | OrderValidationError
          | InsufficientInventoryError
          | PaymentDeclinedError
          | DatabaseError,
          never
        > =>
          Effect.gen(function* () {
            // Implementation
          })
      }
    })
  }
) {}

// Compiler ensures all errors handled
const program = Effect.gen(function* () {
  const service = yield* OrderService
  
  const order = yield* service.createOrder(items).pipe(
    Effect.catchTags({
      OrderValidationError: (e) => handleValidation(e),
      InsufficientInventoryError: (e) => handleInventory(e),
      PaymentDeclinedError: (e) => handlePayment(e),
      DatabaseError: (e) => handleDatabase(e)
      // If we forget one, compiler will error!
    })
  )
})

// ❌ BAD: Vague error types
function badCreate(): Effect.Effect<Order, Error> {
  // What errors can happen? Unknown!
}

// ❌ BAD: Unknown error type
function badCreate2(): Effect.Effect<Order, unknown> {
  // Cannot handle errors safely
}
```

---

#### Leverage Compiler for Architecture Enforcement

**✅ BEST PRACTICE**: Use types to enforce architectural rules.

```typescript
// ✅ CORRECT: Types enforce dependency direction

// Domain has no dependencies
export class Order extends Schema.Class<Order>("Order")({
  // Pure domain, no Effect types
}) {
  // Pure methods
  calculateTotal(): Money {
    return this.items.reduce((sum, i) => sum + i.price, Money.zero)
  }
}

// Application depends on domain
export class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    dependencies: [
      OrderRepository.Default  // Can depend on ports
    ],
    effect: Effect.gen(function* () {
      const repo = yield* OrderRepository
      
      return {
        create: (items: OrderItem[]) =>
          Effect.gen(function* () {
            const order = new Order({ items })  // Uses domain
            yield* repo.save(order)
            return order
          })
      }
    })
  }
) {}

// Infrastructure implements ports
export const OrderRepositoryPostgresLive = Layer.effect(
  OrderRepository,  // Implements port
  Effect.gen(function* () {
    // Can use domain types
    return {
      save: (order: Order) => // Order from domain
        Effect.tryPromise(() => db.insert(order))
    }
  })
)

// ❌ WRONG: Domain depending on infrastructure
class BadOrder {
  save() {
    database.insert(this)  // ❌ Domain shouldn't know about database!
  }
}
```

**Architecture Enforcement**:

```typescript
// Use ESLint to enforce dependency rules
// .eslintrc.js
module.exports = {
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        {
          group: ["**/infrastructure/**"],
          message: "Domain cannot import infrastructure"
        },
        {
          group: ["**/adapters/**"],
          message: "Application cannot import adapters directly"
        }
      ]
    }]
  }
}
```

---

## B. DON'T: Anti-Patterns

### 1. Layer Composition

#### Never Call Effect.provide Multiple Times

**❌ ANTI-PATTERN**: Multiple `Effect.provide` calls break memoization.

```typescript
// ❌ WRONG: Multiple provides
const program = myApp
  .pipe(Effect.provide(DatabaseLive))     // Scope 1
  .pipe(Effect.provide(CacheLive))        // Scope 2
  .pipe(Effect.provide(EmailLive))        // Scope 3

// Each provide creates a NEW scope with separate MemoMap
// Services aren't shared, built multiple times
// Resource cleanup unreliable

// ✅ CORRECT: Single provide
const program = myApp.pipe(
  Effect.provide(Layer.mergeAll(
    DatabaseLive,
    CacheLive,
    EmailLive
  ))
)
// One scope, one MemoMap, services built once and shared
```

**Why It's Wrong**:
- Creates multiple scopes
- Breaks memoization
- Services built multiple times
- Performance degradation
- Unpredictable resource cleanup

---

#### Don't Expose Internal Dependencies in Service Signatures

**❌ ANTI-PATTERN**: Leaking internal dependencies forces consumers to know about implementation details.

```typescript
// ❌ WRONG: Exposes internal dependencies
export const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const users = yield* UserRepository
    const email = yield* EmailService
    const cache = yield* CacheService
    
    return { /* implementation */ }
  })
)
// Type: Layer<UserService, never, UserRepository | EmailService | CacheService>
//                                ↑ Internal dependencies leaked!

// Consumers must provide all internal dependencies
const program = myApp.pipe(
  Effect.provide(Layer.mergeAll(
    UserServiceLive,
    UserRepositoryLive,      // ❌ Consumer must know about this
    EmailServiceLive,         // ❌ Consumer must know about this
    CacheServiceLive          // ❌ Consumer must know about this
  ))
)

// ✅ CORRECT: Hide internal dependencies
const UserServiceLive_Internal = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const users = yield* UserRepository
    const email = yield* EmailService
    const cache = yield* CacheService
    
    return { /* implementation */ }
  })
)

export const UserServiceLive = UserServiceLive_Internal.pipe(
  Layer.provide(UserRepositoryLive),
  Layer.provide(EmailServiceLive),
  Layer.provide(CacheServiceLive)
)
// Type: Layer<UserService, never, never>
// ✓ Clean interface, dependencies hidden

// Consumers only provide the service
const program = myApp.pipe(
  Effect.provide(UserServiceLive)  // ✓ Simple!
)
```

---

#### Don't Generate Layers Inside Functions Without Storing References

**❌ ANTI-PATTERN**: Function-generated layers create new references, breaking memoization.

```typescript
// ❌ WRONG: Generates new layer each call
const makeDbLayer = (config: DbConfig) =>
  Layer.effect(Database, createDatabase(config))

// Each call creates a NEW reference
const repo1 = makeRepo().pipe(
  Layer.provide(makeDbLayer(config))  // Reference A
)

const repo2 = makeRepo().pipe(
  Layer.provide(makeDbLayer(config))  // Reference B (different!)
)

// Database built twice! Memoization broken!

// ✅ CORRECT: Store layer reference
const DbLive = makeDbLayer(config)  // Create once

const repo1 = makeRepo().pipe(Layer.provide(DbLive))
const repo2 = makeRepo().pipe(Layer.provide(DbLive))

// Database built once, memoized correctly
```

---

#### Don't Manually Manage Service Construction Order

**❌ ANTI-PATTERN**: Manually ordering service construction is error-prone.

```typescript
// ❌ WRONG: Manual construction order
export const buildApplication = Effect.gen(function* () {
  // Must remember correct order
  const config = yield* ConfigService.make()
  const db = yield* DatabaseService.make(config)
  const cache = yield* CacheService.make(config)
  const repo = yield* RepositoryService.make(db, cache)
  const service = yield* BusinessService.make(repo)
  
  // Error prone, hard to maintain, no type safety
  return service
})

// ✅ CORRECT: Let Layer system manage order
export const ApplicationLayer = Layer.mergeAll(
  ConfigServiceLive,
  DatabaseServiceLive,  // Automatically gets config
  CacheServiceLive,     // Automatically gets config
  RepositoryServiceLive, // Automatically gets db and cache
  BusinessServiceLive   // Automatically gets repo
)

// Layer system resolves dependency graph automatically
```

---

#### Don't Use Global Mutable State Instead of Services

**❌ ANTI-PATTERN**: Global mutable state breaks testability and composability.

```typescript
// ❌ WRONG: Global mutable state
let database: Database | null = null

export const initDatabase = async (config: DbConfig) => {
  database = await connectDatabase(config)
}

export const getOrders = async (): Promise<Order[]> => {
  if (!database) throw new Error("Database not initialized")
  return database.query("SELECT * FROM orders")
}

// Problems:
// - Not testable (global state)
// - Race conditions (what if called before init?)
// - No type safety (nullable check everywhere)
// - Resource cleanup unclear

// ✅ CORRECT: Service with proper lifecycle
export class Database extends Effect.Service<Database>()(
  "Database",
  {
    scoped: Effect.gen(function* () {
      const config = yield* DatabaseConfig
      const pool = yield* acquirePool(config)
      
      yield* Effect.addFinalizer(() => pool.close())
      
      return {
        query: (sql: string) =>
          Effect.tryPromise(() => pool.query(sql))
      }
    })
  }
) {}

// Benefits:
// - Testable (can provide different implementations)
// - Type safe (no nullable checks)
// - Lifecycle managed (automatic cleanup)
// - Composable (works with other services)
```

---

### 2. Service Design

#### Don't Create Entity-Based God Services

**❌ ANTI-PATTERN**: Entity-based services grow unbounded and violate SRP.

```typescript
// ❌ WRONG: God service with everything
export class UserService extends Effect.Service<UserService>()(
  "UserService",
  {
    effect: Effect.gen(function* () {
      return {
        // Authentication (8 methods)
        login() {},
        logout() {},
        register() {},
        verifyEmail() {},
        refreshToken() {},
        validateToken() {},
        revokeToken() {},
        changePassword() {},
        
        // Profile (10 methods)
        getProfile() {},
        updateProfile() {},
        deleteProfile() {},
        uploadAvatar() {},
        deleteAvatar() {},
        getPreferences() {},
        updatePreferences() {},
        exportData() {},
        anonymizeData() {},
        archiveAccount() {},
        
        // Permissions (6 methods)
        grantRole() {},
        revokeRole() {},
        checkPermission() {},
        listPermissions() {},
        updatePermissions() {},
        syncPermissions() {},
        
        // Notifications (8 methods)
        sendEmail() {},
        sendSMS() {},
        sendPush() {},
        subscribeNotification() {},
        unsubscribeNotification() {},
        getNotificationSettings() {},
        updateNotificationSettings() {},
        batchSendEmails() {},
        
        // Analytics (5 methods)
        trackLogin() {},
        trackActivity() {},
        generateReport() {},
        exportAnalytics() {},
        calculateMetrics() {},
        
        // ... 50+ methods total!
      }
    })
  }
) {}

// Problems:
// - Impossible to understand
// - Many reasons to change
// - Hard to test
// - Tight coupling
// - Unclear boundaries

// ✅ CORRECT: Split by capability
export class UserAuthenticator { /* 3-4 auth methods */ }
export class UserProfileManager { /* 5-6 profile methods */ }
export class UserPermissions { /* 4-5 permission methods */ }
export class UserNotifications { /* 6-7 notification methods */ }
export class UserAnalytics { /* 3-4 analytics methods */ }

// Each service has clear purpose and boundaries
```

---

#### Don't Allow Services to Become Dumping Grounds

**❌ ANTI-PATTERN**: Adding unrelated methods because "it's convenient".

```typescript
// ❌ WRONG: Unrelated methods dumped together
export class OrderService {
  createOrder() {}      // Order management
  calculateTax() {}     // Tax calculation (should be TaxService)
  sendEmail() {}        // Email (should be EmailService)
  generatePDF() {}      // Document generation (should be DocumentService)
  logMetrics() {}       // Analytics (should be AnalyticsService)
  validateCoupon() {}   // Promotions (should be PromotionService)
  checkInventory() {}   // Inventory (should be InventoryService)
}

// ✅ CORRECT: Each capability in its own service
export class OrderManagement {
  createOrder() {}
  updateOrder() {}
  cancelOrder() {}
}

export class TaxCalculator {
  calculateTax() {}
  getTaxRate() {}
}

export class DocumentGenerator {
  generateInvoice() {}
  generateReceipt() {}
}
```

---

#### Don't Couple Services Directly (Use Ports)

**❌ ANTI-PATTERN**: Services calling each other directly creates tight coupling.

```typescript
// ❌ WRONG: Direct service coupling
export class OrderService {
  createOrder(items: OrderItem[]) {
    const order = new Order(items)
    
    // Direct calls to other services
    const user = UserService.getUser(order.userId)     // ❌ Tight coupling
    const payment = PaymentService.charge(order.total) // ❌ Tight coupling
    EmailService.send(user.email, "Order created")     // ❌ Tight coupling
    
    return order
  }
}

// Problems:
// - Can't test in isolation
// - Hard to replace implementations
// - Circular dependency risk
// - No clear boundaries

// ✅ CORRECT: Depend on port abstractions
export class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    dependencies: [
      UserRepository.Default,  // Port abstraction
      PaymentGateway.Default,  // Port abstraction
      EmailService.Default     // Port abstraction
    ],
    effect: Effect.gen(function* () {
      const users = yield* UserRepository
      const payment = yield* PaymentGateway
      const email = yield* EmailService
      
      return {
        createOrder: (items: OrderItem[]) =>
          Effect.gen(function* () {
            const order = new Order(items)
            
            const user = yield* users.findById(order.userId)
            const receipt = yield* payment.charge(order.total)
            yield* email.send(user.email, "Order created")
            
            return order
          })
      }
    })
  }
) {}

// Benefits:
// - Testable (provide fakes)
// - Flexible (swap implementations)
// - Clear dependencies
// - No circular dependencies
```

---

#### Don't Violate Dependency Direction Rules

**❌ ANTI-PATTERN**: Dependencies flowing in wrong direction breaks architecture.

```typescript
// ❌ WRONG: Dependency direction violations

// Domain depending on infrastructure
class Order {
  save() {
    database.insert(this)  // ❌ Domain → Infrastructure (WRONG!)
  }
}

// Infrastructure depending on adapters
class OrderRepository {
  constructor(private httpAdapter: OrderHttpAdapter) {}  // ❌ Wrong direction
}

// Application depending on entrypoints
class OrderService {
  constructor(private httpController: OrderController) {}  // ❌ Wrong direction
}

// ✅ CORRECT: Proper dependency direction
// Domain → Application → Infrastructure → Entrypoints
//    ←          ←              ←              ←
//  (depends on) (depends on)  (depends on)

// Domain: No dependencies
class Order {
  calculateTotal() {
    return this.items.reduce((sum, i) => sum + i.price, 0)
  }
}

// Application: Depends on domain + ports
export class OrderService {
  dependencies: [OrderRepository.Default]  // Port
}

// Infrastructure: Implements ports, uses domain
export const OrderRepositoryPostgresLive = Layer.effect(
  OrderRepository,  // Implements port
  Effect.gen(function* () {
    return {
      save: (order: Order) => // Uses domain
        Effect.tryPromise(() => db.insert(order))
    }
  })
)

// Entrypoints: Use application services
export class OrderHttpAdapter {
  dependencies: [OrderService.Default]  // Uses application
}
```

---

#### Don't Create Circular Dependencies

**❌ ANTI-PATTERN**: Services depending on each other creates cycles.

```typescript
// ❌ WRONG: Circular dependency
export class OrderService {
  dependencies: [UserService.Default]
  
  createOrder(userId: UserId) {
    const userService = yield* UserService
    const user = yield* userService.getUser(userId)  // Uses UserService
    // ...
  }
}

export class UserService {
  dependencies: [OrderService.Default]
  
  getUserOrders(userId: UserId) {
    const orderService = yield* OrderService
    return yield* orderService.getOrdersByUser(userId)  // Uses OrderService
  }
}

// Circular dependency: OrderService → UserService → OrderService
// Causes: build failures, infinite loops, unclear responsibilities

// ✅ CORRECT: Break cycle with proper boundaries

// Option 1: Introduce intermediate port
export interface OrderQueries {
  getOrdersByUser(userId: UserId): Effect.Effect<Order[]>
}

export class OrderService {
  // Only implements query port
}

export class UserService {
  dependencies: [OrderQueries.Default]  // Depends on query port only
  
  getUserOrders(userId: UserId) {
    const queries = yield* OrderQueries
    return yield* queries.getOrdersByUser(userId)
  }
}

// Option 2: Create dedicated query service
export class UserOrderQueries {
  dependencies: [UserRepository.Default, OrderRepository.Default]
  
  getUserWithOrders(userId: UserId) {
    // Coordinates both repositories directly
  }
}

// No cycles, clear dependencies
```

---

### 3. Naming

#### Don't Use Generic Names (Service, Manager, Handler Alone)

**❌ ANTI-PATTERN**: Generic names hide architectural intent.

```typescript
// ❌ WRONG: Generic, meaningless names
class Service {}           // Service for what?
class Manager {}           // Manages what?
class Handler {}           // Handles what?
class Helper {}            // Helps with what?
class Util {}              // Utility for what?
class Controller {}        // Controls what?

// ✅ CORRECT: Specific, descriptive names
class OrderCheckout {}             // Clear: handles checkout
class PaymentProcessor {}          // Clear: processes payments
class EmailDelivery {}             // Clear: delivers emails
class InventoryTracker {}          // Clear: tracks inventory
class OrderCreatedEventHandler {}  // Clear: handles OrderCreated events
```

---

#### Don't Mix Naming Patterns Inconsistently

**❌ ANTI-PATTERN**: Inconsistent naming creates confusion.

```typescript
// ❌ WRONG: Inconsistent patterns
class UserAuthenticator {}     // Capability-based
class OrderService {}          // Entity-based
class ProcessPayment {}        // Action-based
class CartManager {}           // Generic
class EmailSender {}           // Action-based
class ProductRepository {}     // Pattern-based

// No clear pattern, confusing

// ✅ CORRECT: Consistent capability-based naming
class UserAuthenticator {}
class OrderCheckout {}
class PaymentProcessor {}
class CartManagement {}
class EmailDelivery {}
class ProductCatalog {}

// OR: Consistent command/query pattern
class CreateOrderCommand {}
class ProcessPaymentCommand {}
class GetUserQuery {}
class ListProductsQuery {}
```

---

#### Don't Hide Architectural Intent in Names

**❌ ANTI-PATTERN**: Names that don't reveal their architectural role.

```typescript
// ❌ WRONG: Unclear architectural role
class OrderThing {}         // What is this?
class UserStuff {}          // What does it do?
class PaymentHandler {}     // Port? Adapter? Service?
class DataAccess {}         // Repository? Query? Both?

// ✅ CORRECT: Names reveal architectural role
class OrderService {}           // Primary service (use case)
class OrderRepository {}        // Secondary port (dependency)
class OrderHttpAdapter {}       // Primary adapter (HTTP entry)
class OrderRepositoryPostgresLive {}  // Secondary adapter (database)
class CreateOrderCommand {}     // Command (write operation)
class GetOrderQuery {}          // Query (read operation)
```

---

#### Don't Use Misleading or Ambiguous Names

**❌ ANTI-PATTERN**: Names that mislead about what they do.

```typescript
// ❌ WRONG: Misleading names
class OrderValidator {
  // Misleading: Also saves to database!
  validate(order: Order) {
    if (order.items.length === 0) throw new Error()
    return database.save(order)  // ❌ Name says validate, does save
  }
}

class UserReader {
  // Misleading: Also updates user!
  read(id: UserId) {
    const user = database.find(id)
    user.lastAccess = new Date()
    database.update(user)  // ❌ Name says read, does write
    return user
  }
}

// ✅ CORRECT: Accurate names
class OrderValidator {
  validate(order: Order): ValidationResult {
    // Only validates, doesn't save
    if (order.items.length === 0) {
      return { valid: false, errors: ["Empty items"] }
    }
    return { valid: true }
  }
}

class OrderPersistence {
  // Name accurately reflects what it does
  save(order: Order): Effect.Effect<void> {
    return database.save(order)
  }
}

class UserRepository {
  // Name indicates read AND write capability
  findById(id: UserId): Effect.Effect<User> {
    return database.find(id)
  }
  
  updateLastAccess(id: UserId): Effect.Effect<void> {
    return database.update(id, { lastAccess: new Date() })
  }
}
```

---

### 4. Testing

#### Don't Test Against Concrete Implementations

**❌ ANTI-PATTERN**: Testing concrete adapters couples tests to implementation details.

```typescript
// ❌ WRONG: Test against concrete Postgres adapter
describe("OrderService with Postgres", () => {
  it("should create order", async () => {
    const postgres = new PostgresOrderRepository(realDbConnection)
    const service = new OrderService(postgres)  // ❌ Coupled to Postgres
    
    await service.createOrder(items)
    
    // Test breaks if we switch from Postgres to MongoDB
  })
})

// ✅ CORRECT: Test against port interface
describe("OrderService - Integration Tests", () => {
  it.effect("should create order", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      const order = yield* service.createOrder(items)
      
      assert.isDefined(order.id)
    }).pipe(
      Effect.provide(Layer.mergeAll(
        OrderServiceLive,
        OrderRepositoryFake  // Test against interface, not implementation
      ))
    )
  )
})

// Can swap to any implementation
const IntegrationTestLayer = Layer.mergeAll(
  OrderServiceLive,
  OrderRepositoryMemoryLive  // Or Postgres, or MongoDB - tests still pass
)
```

---

#### Don't Couple Tests to Implementation Details

**❌ ANTI-PATTERN**: Testing internal implementation details makes tests brittle.

```typescript
// ❌ WRONG: Testing internal implementation
class OrderService {
  private validateItems(items: OrderItem[]) {
    // Private helper method
  }
  
  createOrder(items: OrderItem[]) {
    this.validateItems(items)
    // ... rest of logic
  }
}

describe("OrderService", () => {
  it("should call validateItems", () => {
    const service = new OrderService()
    const spy = vi.spyOn(service, 'validateItems')  // ❌ Testing private method
    
    service.createOrder(items)
    
    expect(spy).toHaveBeenCalled()
    // Test breaks if we refactor internal implementation
  })
})

// ✅ CORRECT: Test public behavior only
describe("OrderService", () => {
  it.effect("should reject invalid items", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      // Test public behavior, not internal implementation
      const exit = yield* Effect.exit(
        service.createOrder([])  // Empty items
      )
      
      assert.isTrue(Exit.isFailure(exit))
      // Test passes regardless of internal implementation
    }).pipe(Effect.provide(OrderServiceLive))
  )
})
```

---

#### Don't Skip Contract Tests

**❌ ANTI-PATTERN**: Skipping contract tests means adapters might not implement ports correctly.

```typescript
// ❌ WRONG: No contract tests, adapter may be incorrect
export const OrderRepositoryPostgresLive = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    return {
      save: (order) => sql`INSERT INTO orders ...`,
      findById: (id) => sql`SELECT * FROM orders WHERE id = ${id}`,
      // Oops! Forgot to implement findByUser method!
      // No error because there's no contract test
    }
  })
)

// ✅ CORRECT: Contract tests ensure compliance
// OrderRepository.port.contract.test.ts
describe("OrderRepository Contract", () => {
  it.effect("MUST implement findByUser", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      const orders = yield* repo.findByUser(userId)
      
      assert.isArray(orders)
    }).pipe(Effect.provide(OrderRepositoryFake))
  )
})

// Run same tests against all implementations
describe("OrderRepositoryPostgres - Contract Compliance", () => {
  const tests = importContractTests()
  
  tests.forEach(test => {
    it.effect(test.name, test.test.pipe(
      Effect.provide(OrderRepositoryPostgresLive)
    ))
  })
})

// If adapter doesn't implement a method, test fails
```

---

#### Don't Use Heavy Test Doubles When Fakes Suffice

**❌ ANTI-PATTERN**: Using complex mocking frameworks when simple fakes work better.

```typescript
// ❌ WRONG: Heavy mocking framework for simple case
describe("OrderService", () => {
  it("should create order", async () => {
    const mockRepo = mock<OrderRepository>()
    mockRepo.save.mockResolvedValue(undefined)
    mockRepo.findById.mockResolvedValue(order)
    
    const mockPayment = mock<PaymentGateway>()
    mockPayment.charge.mockResolvedValue(receipt)
    
    const mockEmail = mock<EmailService>()
    mockEmail.send.mockResolvedValue(undefined)
    
    // Complex setup, brittle tests, coupled to implementation
    const service = new OrderService(mockRepo, mockPayment, mockEmail)
    await service.createOrder(items)
    
    expect(mockRepo.save).toHaveBeenCalled()  // Verifying implementation detail
  })
})

// ✅ CORRECT: Simple fake with real behavior
export const OrderRepositoryFake = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const orders = yield* Ref.make(new Map<OrderId, Order>())
    
    return OrderRepository.of({
      save: (order) =>
        Ref.update(orders, (map) => map.set(order.id, order)),
      
      findById: (id) =>
        Ref.get(orders).pipe(
          Effect.flatMap((map) =>
            map.has(id)
              ? Effect.succeed(map.get(id)!)
              : Effect.fail(new OrderNotFoundError({ orderId: id }))
          )
        )
    })
  })
)

describe("OrderService", () => {
  it.effect("should create order", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      const repo = yield* OrderRepository
      
      const order = yield* service.createOrder(items)
      
      // Test actual behavior, not mocks
      const saved = yield* repo.findById(order.id)
      assert.deepEqual(saved, order)
    }).pipe(
      Effect.provide(Layer.mergeAll(
        OrderServiceLive,
        OrderRepositoryFake,  // Real behavior, simple implementation
        PaymentGatewayMock,
        EmailServiceFake
      ))
    )
  )
})

// Simpler, more maintainable, tests behavior not implementation
```

---

### 5. Architecture

#### Don't Let Domain Depend on Infrastructure

**❌ ANTI-PATTERN**: Domain knowing about databases, HTTP, or external services.

```typescript
// ❌ WRONG: Domain depends on infrastructure
class Order {
  async save() {
    await database.insert(this)  // ❌ Domain → Infrastructure
  }
  
  async sendConfirmation() {
    await emailService.send(this.user.email)  // ❌ Domain → Infrastructure
  }
}

// ✅ CORRECT: Pure domain, infrastructure separate
class Order {
  // Pure domain logic
  calculateTotal(): Money {
    return this.items.reduce((sum, i) => sum + i.price, Money.zero)
  }
  
  confirm(): Order {
    if (this.status !== "pending") {
      throw new InvalidTransitionError()
    }
    return new Order({ ...this, status: "confirmed" })
  }
  
  // No infrastructure dependencies!
}

// Infrastructure layer handles persistence
export const OrderRepositoryPostgresLive = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const db = yield* Database
    
    return {
      save: (order: Order) =>  // Uses domain Order
        Effect.tryPromise(() => db.insert(order))
    }
  })
)
```

---

#### Don't Bypass Ports with Direct Calls

**❌ ANTI-PATTERN**: Calling concrete implementations directly bypasses the port layer.

```typescript
// ❌ WRONG: Bypass port, call concrete adapter
export class OrderService {
  createOrder(items: OrderItem[]) {
    // Skip port, call adapter directly
    const repo = new PostgresOrderRepository(dbConnection)  // ❌ Direct call
    const order = new Order(items)
    repo.save(order)
    return order
  }
}

// ✅ CORRECT: Always go through port
export class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    dependencies: [OrderRepository.Default],  // Depend on port
    
    effect: Effect.gen(function* () {
      const repo = yield* OrderRepository  // Access through port
      
      return {
        createOrder: (items: OrderItem[]) =>
          Effect.gen(function* () {
            const order = new Order(items)
            yield* repo.save(order)  // Go through port
            return order
          })
      }
    })
  }
) {}
```

---

#### Don't Leak Technology Concerns into Domain

**❌ ANTI-PATTERN**: HTTP status codes, database queries, or framework specifics in domain.

```typescript
// ❌ WRONG: Technology leaks into domain
class Order {
  toJSON() {
    // HTTP concern in domain
    return {
      statusCode: this.isValid() ? 200 : 400,  // ❌ HTTP status code
      data: this.items
    }
  }
  
  saveToPostgres() {
    // Database concern in domain
    return `INSERT INTO orders (id, items) VALUES (${this.id}, ${JSON.stringify(this.items)})`  // ❌ SQL
  }
}

// ✅ CORRECT: Pure domain, technology concerns in adapters
class Order {
  // Pure domain
  isValid(): boolean {
    return this.items.length > 0
  }
  
  calculateTotal(): Money {
    return this.items.reduce((sum, i) => sum + i.price, Money.zero)
  }
}

// HTTP concerns in HTTP adapter
export class OrderHttpAdapter {
  toHttpResponse(order: Order): HttpResponse {
    return {
      status: 200,
      body: {
        id: order.id,
        items: order.items,
        total: order.calculateTotal()
      }
    }
  }
}

// Database concerns in repository adapter
export const OrderRepositoryPostgres = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient
    
    return {
      save: (order: Order) =>
        sql`INSERT INTO orders (id, items, total) VALUES (
          ${order.id}, 
          ${JSON.stringify(order.items)}, 
          ${order.calculateTotal()}
        )`
    }
  })
)
```

---

#### Don't Create Dependencies on Unstable Abstractions

**❌ ANTI-PATTERN**: Depending on abstractions that change frequently.

```typescript
// ❌ WRONG: Depend on volatile concrete types
export class OrderService {
  constructor(
    private emailClient: NodemailerClient,  // ❌ Concrete, volatile
    private paymentSDK: StripeSDK,          // ❌ Concrete, changes with SDK
    private logger: WinstonLogger           // ❌ Concrete, framework-specific
  ) {}
}

// If Nodemailer changes, OrderService must change
// If Stripe SDK updates, OrderService must change
// Tight coupling to implementations

// ✅ CORRECT: Depend on stable abstractions (ports)
export class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    dependencies: [
      EmailService.Default,      // ✓ Stable port
      PaymentGateway.Default,    // ✓ Stable port
      Logger.Default             // ✓ Stable port
    ],
    
    effect: Effect.gen(function* () {
      const email = yield* EmailService
      const payment = yield* PaymentGateway
      const logger = yield* Logger
      
      return {
        createOrder: (items: OrderItem[]) =>
          Effect.gen(function* () {
            yield* logger.info("Creating order")
            const receipt = yield* payment.charge(total, token)
            yield* email.send(confirmationEmail)
            // ...
          })
      }
    })
  }
) {}

// Service depends on stable abstractions
// Can change email provider (Nodemailer → SendGrid) without touching service
// Can change payment provider (Stripe → PayPal) without touching service
// Can change logger (Winston → Pino) without touching service
```

---

This comprehensive section on best practices and anti-patterns provides actionable guidance with real-world examples, helping developers avoid common pitfalls and follow proven patterns in Effect-TS hexagonal architecture.
