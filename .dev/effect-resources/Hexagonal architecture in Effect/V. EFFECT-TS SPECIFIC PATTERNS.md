---
modified: 2025-11-04T04:41:01-03:00
---
# V. EFFECT-TS SPECIFIC PATTERNS

## A. Modern Effect.Service Pattern

The modern `Effect.Service` pattern represents a significant evolution in how services are defined in Effect-TS, providing a unified approach to declaring services with automatic layer generation and explicit dependency management.

### 1. Unified Declaration

#### 1.1 Structure

The `Effect.Service` pattern combines service definition, dependency declaration, and layer construction in a single coherent declaration:

**Core Structure**:

```typescript
export class ServiceName extends Effect.Service<ServiceName>()(
  "UniqueServiceIdentifier",  // 1. Service identifier
  {
    dependencies: [            // 2. Explicit dependencies
      Dependency1.Default,
      Dependency2.Default
    ],
    
    effect: Effect.gen(function* () {  // 3. Construction logic
      // Acquire dependencies
      const dep1 = yield* Dependency1
      const dep2 = yield* Dependency2
      
      // Return service interface
      return {
        method1: (args) => Effect.gen(function* () {
          // Implementation
        }),
        method2: (args) => Effect.gen(function* () {
          // Implementation
        })
      }
    })
  }
) {}

// Automatic .Default layer available
// Usage: ServiceName.Default
```

**Complete Example**:

```typescript
// application/services/OrderService/OrderService.service.ts
import { Effect } from "effect"
import { OrderRepository } from "../../ports/secondary/OrderRepository/OrderRepository.port"
import { PaymentGateway } from "../../ports/secondary/PaymentGateway/PaymentGateway.port"
import { EmailService } from "../../ports/secondary/EmailService/EmailService.port"
import { EventBus } from "../../ports/secondary/EventBus/EventBus.port"
import { Order, OrderId } from "../../../domain/models/Order.model"

/**
 * ORDER SERVICE
 * 
 * Primary service for order operations.
 * Uses modern Effect.Service pattern.
 */
export class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    // Explicit dependency declaration
    dependencies: [
      OrderRepository.Default,
      PaymentGateway.Default,
      EmailService.Default,
      EventBus.Default
    ],
    
    // Construction with Effect
    effect: Effect.gen(function* () {
      // Acquire all dependencies during construction
      const orders = yield* OrderRepository
      const payment = yield* PaymentGateway
      const email = yield* EmailService
      const events = yield* EventBus
      
      // Return service interface
      return {
        createOrder: (items: OrderItem[]) =>
          Effect.gen(function* () {
            // Validate items
            if (items.length === 0) {
              return yield* Effect.fail(
                new OrderValidationError({ reason: "Empty items" })
              )
            }
            
            // Create domain entity
            const order = new Order({
              id: OrderId.make(crypto.randomUUID()),
              items,
              totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
              status: "pending",
              createdAt: new Date()
            })
            
            // Process payment
            const receipt = yield* payment.charge(order.totalAmount, "token")
            
            // Confirm order
            const confirmed = order.confirm()
            
            // Persist
            yield* orders.save(confirmed)
            
            // Send confirmation email
            yield* email.sendOrderConfirmation(confirmed)
            
            // Publish event
            yield* events.publish({
              _tag: "OrderCreated",
              orderId: confirmed.id,
              userId: confirmed.userId,
              timestamp: new Date()
            })
            
            return confirmed
          }),
        
        getOrder: (id: OrderId) =>
          orders.findById(id),
        
        listOrders: (userId: UserId) =>
          orders.findByUser(userId),
        
        cancelOrder: (id: OrderId, reason: string) =>
          Effect.gen(function* () {
            const order = yield* orders.findById(id)
            
            if (order.status !== "pending") {
              return yield* Effect.fail(
                new InvalidOrderStateError({
                  orderId: id,
                  currentState: order.status,
                  attemptedTransition: "cancelled"
                })
              )
            }
            
            // Refund payment if processed
            if (order.paymentId) {
              yield* payment.refund(order.paymentId)
            }
            
            // Update order
            const cancelled = order.cancel(reason)
            yield* orders.save(cancelled)
            
            // Publish event
            yield* events.publish({
              _tag: "OrderCancelled",
              orderId: id,
              reason,
              timestamp: new Date()
            })
          })
      }
    })
  }
) {}

// OrderService.Default is automatically available as a Layer
// Type: Layer<OrderService, never, never>
```

---

#### 1.2 Benefits

The modern `Effect.Service` pattern provides significant advantages over manual layer construction:

**1. Single Declaration Point**

Instead of separating tag, interface, and layer:

```typescript
// ❌ OLD WAY - Scattered declarations

// 1. Define interface
export interface OrderService {
  readonly createOrder: (items: OrderItem[]) => Effect.Effect<Order, OrderError>
  readonly getOrder: (id: OrderId) => Effect.Effect<Order, OrderNotFoundError>
}

// 2. Create tag
export class OrderService extends Context.Tag("OrderService")<
  OrderService,
  OrderService
>() {}

// 3. Create layer separately
export const OrderServiceLive = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    const orders = yield* OrderRepository
    const payment = yield* PaymentGateway
    
    return {
      createOrder: (items) => Effect.gen(function* () {
        // Implementation
      }),
      getOrder: (id) => Effect.gen(function* () {
        // Implementation
      })
    }
  })
)

// 4. Manual dependency management
export const OrderServiceWithDeps = OrderServiceLive.pipe(
  Layer.provide(OrderRepositoryLive),
  Layer.provide(PaymentGatewayLive)
)
```

```typescript
// ✅ NEW WAY - Unified declaration

export class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    dependencies: [OrderRepository.Default, PaymentGateway.Default],
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      const payment = yield* PaymentGateway
      
      return {
        createOrder: (items) => Effect.gen(function* () {
          // Implementation
        }),
        getOrder: (id) => Effect.gen(function* () {
          // Implementation
        })
      }
    })
  }
) {}

// Everything in one place, .Default automatically available
```

**2. Explicit Dependencies**

Dependencies are declared upfront and visible:

```typescript
export class CheckoutService extends Effect.Service<CheckoutService>()(
  "CheckoutService",
  {
    // Dependencies are explicit and visible at a glance
    dependencies: [
      CartRepository.Default,
      OrderService.Default,
      InventoryService.Default,
      PaymentService.Default,
      ShippingService.Default,
      EmailService.Default
    ],
    
    effect: Effect.gen(function* () {
      // All dependencies acquired here
      const cart = yield* CartRepository
      const orders = yield* OrderService
      const inventory = yield* InventoryService
      const payment = yield* PaymentService
      const shipping = yield* ShippingService
      const email = yield* EmailService
      
      return {
        processCheckout: (userId: UserId) =>
          Effect.gen(function* () {
            // Use all dependencies to complete checkout
            const cartItems = yield* cart.getCart(userId)
            yield* inventory.reserve(cartItems)
            const order = yield* orders.createOrder(cartItems)
            yield* payment.charge(order.totalAmount, "token")
            yield* shipping.scheduleShipment(order)
            yield* email.sendOrderConfirmation(order)
            yield* cart.clear(userId)
            return order
          })
      }
    })
  }
) {}
```

**3. Type Inference**

Better type inference from implementation:

```typescript
export class UserService extends Effect.Service<UserService>()(
  "UserService",
  {
    dependencies: [UserRepository.Default],
    effect: Effect.gen(function* () {
      const users = yield* UserRepository
      
      return {
        // Type automatically inferred from implementation
        createUser: (data: CreateUserData) =>
          Effect.gen(function* () {
            const user = new User({
              id: UserId.make(crypto.randomUUID()),
              ...data,
              createdAt: new Date()
            })
            yield* users.save(user)
            return user
          }),
        
        // Return type inferred: Effect<User, UserNotFoundError, never>
        getUser: (id: UserId) =>
          users.findById(id)
      }
    })
  }
) {}

// TypeScript knows all method signatures without explicit typing
const program = Effect.gen(function* () {
  const userService = yield* UserService
  const user = yield* userService.getUser(userId)
  // user: User (type inferred)
})
```

**4. Cleaner Than Manual Layer.effect**

Compare the manual approach with Effect.Service:

```typescript
// ❌ Manual approach - verbose and error-prone

// Step 1: Interface
export interface TaskService {
  readonly complete: (id: TaskId) => Effect.Effect<void, TaskError>
}

// Step 2: Tag
export class TaskService extends Context.Tag("TaskService")<
  TaskService,
  TaskService
>() {}

// Step 3: Implementation with dependencies
const TaskServiceLive_Internal = Layer.effect(
  TaskService,
  Effect.gen(function* () {
    const tasks = yield* TaskRepository
    const email = yield* EmailService
    const events = yield* EventBus
    
    return TaskService.of({
      complete: (id) =>
        Effect.gen(function* () {
          // Implementation
        })
    })
  })
)

// Step 4: Provide dependencies
export const TaskServiceLive = TaskServiceLive_Internal.pipe(
  Layer.provide(TaskRepositoryLive),
  Layer.provide(EmailServiceLive),
  Layer.provide(EventBusLive)
)

// Step 5: Remember to use TaskServiceLive, not TaskServiceLive_Internal
```

```typescript
// ✅ Effect.Service - concise and clear

export class TaskService extends Effect.Service<TaskService>()(
  "TaskService",
  {
    dependencies: [
      TaskRepository.Default,
      EmailService.Default,
      EventBus.Default
    ],
    effect: Effect.gen(function* () {
      const tasks = yield* TaskRepository
      const email = yield* EmailService
      const events = yield* EventBus
      
      return {
        complete: (id) =>
          Effect.gen(function* () {
            // Implementation
          })
      }
    })
  }
) {}

// That's it! Use TaskService.Default
```

---

### 2. Resource Management

Resource management is critical for services that acquire connections, file handles, or other resources that need cleanup. Effect provides two patterns: `effect` for simple services and `scoped` for resource-managing services.

#### 2.1 The Scoped Pattern

Use `scoped` when your service needs to acquire resources that must be cleaned up:

**When to Use Scoped**:
- Database connections
- File handles
- Network connections
- External client connections
- Resource pools
- Subscriptions
- Timers

**Pattern Structure**:

```typescript
export class ServiceName extends Effect.Service<ServiceName>()(
  "ServiceName",
  {
    dependencies: [/* ... */],
    
    scoped: Effect.gen(function* () {  // Use 'scoped' instead of 'effect'
      // 1. Acquire resources
      const resource = yield* acquireResource()
      
      // 2. Register cleanup (guaranteed to run)
      yield* Effect.addFinalizer(() =>
        Effect.promise(() => resource.close())
      )
      
      // 3. Return service interface
      return {
        method: (args) => useResource(resource, args)
      }
    })
  }
) {}
```

**Complete Example - Database Service**:

```typescript
// infrastructure/persistence/Database.live.ts
import { Effect, Scope } from "effect"
import { Pool } from "pg"

/**
 * DATABASE SERVICE
 * 
 * Manages PostgreSQL connection pool with automatic cleanup.
 * Uses scoped pattern for resource management.
 */
export class Database extends Effect.Service<Database>()(
  "Database",
  {
    dependencies: [DatabaseConfig.Default],
    
    scoped: Effect.gen(function* () {
      // 1. Acquire configuration
      const config = yield* DatabaseConfig
      
      // 2. Acquire connection pool (resource)
      yield* Effect.logInfo("Acquiring database connection pool")
      
      const pool = yield* Effect.tryPromise({
        try: () => new Pool({
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.user,
          password: config.password,
          max: config.poolSize,
          idleTimeoutMillis: config.idleTimeout
        }),
        catch: (error) => new DatabaseConnectionError({ cause: error })
      })
      
      // 3. Register cleanup (guaranteed to run when scope closes)
      yield* Effect.addFinalizer(() =>
        Effect.gen(function* () {
          yield* Effect.logInfo("Closing database connection pool")
          yield* Effect.promise(() => pool.end())
          yield* Effect.logInfo("Database connection pool closed")
        })
      )
      
      // 4. Verify connection
      yield* Effect.tryPromise({
        try: () => pool.query("SELECT 1"),
        catch: (error) => new DatabaseConnectionError({ cause: error })
      })
      
      yield* Effect.logInfo("Database connection pool ready")
      
      // 5. Return service interface
      return {
        query: <T>(sql: string, params?: unknown[]) =>
          Effect.tryPromise({
            try: () => pool.query<T>(sql, params).then(r => r.rows),
            catch: (error) => new DatabaseQueryError({ sql, cause: error })
          }),
        
        transaction: <A, E, R>(
          effect: Effect.Effect<A, E, R>
        ): Effect.Effect<A, E | DatabaseError, R> =>
          Effect.gen(function* () {
            const client = yield* Effect.tryPromise({
              try: () => pool.connect(),
              catch: (error) => new DatabaseConnectionError({ cause: error })
            })
            
            try {
              yield* Effect.promise(() => client.query("BEGIN"))
              const result = yield* effect
              yield* Effect.promise(() => client.query("COMMIT"))
              return result
            } catch (error) {
              yield* Effect.promise(() => client.query("ROLLBACK"))
              throw error
            } finally {
              client.release()
            }
          }),
        
        withConnection: <A, E>(
          fn: (client: PoolClient) => Effect.Effect<A, E>
        ): Effect.Effect<A, E | DatabaseError> =>
          Effect.gen(function* () {
            const client = yield* Effect.tryPromise({
              try: () => pool.connect(),
              catch: (error) => new DatabaseConnectionError({ cause: error })
            })
            
            try {
              return yield* fn(client)
            } finally {
              client.release()
            }
          })
      }
    })
  }
) {}

// Database.Default is a scoped layer
// Cleanup happens automatically when scope closes
```

**Example - Message Queue Service**:

```typescript
// infrastructure/messaging/MessageQueue.live.ts
import { Effect } from "effect"
import * as amqp from "amqplib"

export class MessageQueue extends Effect.Service<MessageQueue>()(
  "MessageQueue",
  {
    dependencies: [MessageQueueConfig.Default],
    
    scoped: Effect.gen(function* () {
      const config = yield* MessageQueueConfig
      
      // Acquire connection
      yield* Effect.logInfo("Connecting to RabbitMQ")
      const connection = yield* Effect.tryPromise({
        try: () => amqp.connect(config.url),
        catch: (error) => new MessageQueueConnectionError({ cause: error })
      })
      
      // Acquire channel
      const channel = yield* Effect.tryPromise({
        try: () => connection.createChannel(),
        catch: (error) => new MessageQueueChannelError({ cause: error })
      })
      
      // Register cleanup (in reverse order)
      yield* Effect.addFinalizer(() =>
        Effect.gen(function* () {
          yield* Effect.logInfo("Closing RabbitMQ channel")
          yield* Effect.promise(() => channel.close())
        })
      )
      
      yield* Effect.addFinalizer(() =>
        Effect.gen(function* () {
          yield* Effect.logInfo("Closing RabbitMQ connection")
          yield* Effect.promise(() => connection.close())
        })
      )
      
      yield* Effect.logInfo("RabbitMQ connected")
      
      return {
        publish: (queue: string, message: unknown) =>
          Effect.tryPromise({
            try: () =>
              channel.assertQueue(queue, { durable: true }).then(() =>
                channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
                  persistent: true
                })
              ),
            catch: (error) => new MessageQueuePublishError({ queue, cause: error })
          }),
        
        subscribe: <T>(queue: string, handler: (msg: T) => Effect.Effect<void>) =>
          Effect.tryPromise({
            try: async () => {
              await channel.assertQueue(queue, { durable: true })
              await channel.consume(queue, async (msg) => {
                if (msg) {
                  const content = JSON.parse(msg.content.toString()) as T
                  await Effect.runPromise(handler(content))
                  channel.ack(msg)
                }
              })
            },
            catch: (error) => new MessageQueueSubscribeError({ queue, cause: error })
          })
      }
    })
  }
) {}
```

**Example - Redis Cache Service**:

```typescript
// infrastructure/cache/Cache.redis.ts
import { Effect } from "effect"
import { createClient, RedisClientType } from "redis"

export class Cache extends Effect.Service<Cache>()(
  "Cache",
  {
    dependencies: [CacheConfig.Default],
    
    scoped: Effect.gen(function* () {
      const config = yield* CacheConfig
      
      // Create client
      const client: RedisClientType = createClient({
        url: config.url,
        socket: {
          connectTimeout: config.connectTimeout,
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      })
      
      // Connect
      yield* Effect.logInfo("Connecting to Redis")
      yield* Effect.tryPromise({
        try: () => client.connect(),
        catch: (error) => new CacheConnectionError({ cause: error })
      })
      
      // Register cleanup
      yield* Effect.addFinalizer(() =>
        Effect.gen(function* () {
          yield* Effect.logInfo("Disconnecting from Redis")
          yield* Effect.promise(() => client.quit())
          yield* Effect.logInfo("Redis disconnected")
        })
      )
      
      yield* Effect.logInfo("Redis connected")
      
      return {
        get: <T>(key: string) =>
          Effect.gen(function* () {
            const value = yield* Effect.tryPromise({
              try: () => client.get(key),
              catch: (error) => new CacheGetError({ key, cause: error })
            })
            
            if (value === null) {
              return Option.none()
            }
            
            return Option.some(JSON.parse(value) as T)
          }),
        
        set: <T>(key: string, value: T, ttl?: number) =>
          Effect.tryPromise({
            try: () => {
              const serialized = JSON.stringify(value)
              return ttl
                ? client.setEx(key, ttl, serialized)
                : client.set(key, serialized)
            },
            catch: (error) => new CacheSetError({ key, cause: error })
          }).pipe(Effect.asVoid),
        
        delete: (key: string) =>
          Effect.tryPromise({
            try: () => client.del(key),
            catch: (error) => new CacheDeleteError({ key, cause: error })
          }).pipe(Effect.asVoid),
        
        clear: () =>
          Effect.tryPromise({
            try: () => client.flushDb(),
            catch: (error) => new CacheClearError({ cause: error })
          }).pipe(Effect.asVoid)
      }
    })
  }
) {}
```

---

#### 2.2 The Effect Pattern

Use `effect` when your service doesn't manage resources:

**When to Use Effect**:
- Stateless services
- Pure computation services
- Services that only depend on other services
- Configuration services

**Example - Stateless Service**:

```typescript
// application/services/PricingService/PricingService.service.ts

/**
 * PRICING SERVICE
 * 
 * Stateless calculation service.
 * No resources to manage - uses 'effect' pattern.
 */
export class PricingService extends Effect.Service<PricingService>()(
  "PricingService",
  {
    dependencies: [PricingRules.Default, TaxService.Default],
    
    effect: Effect.gen(function* () {
      // No resources to acquire/release
      const rules = yield* PricingRules
      const tax = yield* TaxService
      
      return {
        calculatePrice: (product: Product, quantity: number) =>
          Effect.gen(function* () {
            // Pure calculation
            const basePrice = product.price * quantity
            const discount = rules.calculateDiscount(product, quantity)
            const subtotal = basePrice - discount
            const taxAmount = yield* tax.calculate(subtotal)
            
            return {
              basePrice: Money(basePrice),
              discount: Money(discount),
              subtotal: Money(subtotal),
              tax: Money(taxAmount),
              total: Money(subtotal + taxAmount)
            }
          }),
        
        applyPromotion: (price: Money, code: PromoCode) =>
          Effect.gen(function* () {
            const promotion = yield* rules.validatePromotion(code)
            return rules.applyDiscount(price, promotion)
          })
      }
    })
  }
) {}
```

**Example - Configuration Service**:

```typescript
// infrastructure/config/Config.live.ts

/**
 * CONFIG SERVICE
 * 
 * Loads and provides configuration.
 * No cleanup needed - uses 'effect' pattern.
 */
export class AppConfig extends Effect.Service<AppConfig>()(
  "AppConfig",
  {
    dependencies: [],
    
    effect: Effect.gen(function* () {
      // Load configuration once during construction
      yield* Effect.logInfo("Loading application configuration")
      
      const config = yield* Effect.tryPromise({
        try: async () => {
          const env = process.env.NODE_ENV || "development"
          const configPath = `./config/${env}.json`
          const content = await fs.promises.readFile(configPath, "utf-8")
          return JSON.parse(content)
        },
        catch: (error) => new ConfigLoadError({ cause: error })
      })
      
      yield* Effect.logInfo("Configuration loaded successfully")
      
      // Return configuration accessor
      return {
        get: <K extends keyof typeof config>(key: K) =>
          Effect.succeed(config[key]),
        
        database: () =>
          Effect.succeed({
            host: config.database.host,
            port: config.database.port,
            name: config.database.name
          }),
        
        api: () =>
          Effect.succeed({
            port: config.api.port,
            corsOrigins: config.api.corsOrigins
          })
      }
    })
  }
) {}
```

---

#### 2.3 Automatic Cleanup via Scope

When using `scoped`, Effect guarantees cleanup runs:

**Cleanup Guarantees**:

```typescript
const program = Effect.gen(function* () {
  // Scope begins
  const db = yield* Database
  
  // Use database
  yield* db.query("SELECT * FROM users")
  
  // Even if this fails...
  yield* Effect.fail(new Error("Something went wrong"))
  
  // ...cleanup still runs!
  // Scope ends, finalizers execute
})

// Cleanup order: Last registered finalizer runs first (LIFO)
```

**Example - Multiple Resources**:

```typescript
export class ApplicationService extends Effect.Service<ApplicationService>()(
  "ApplicationService",
  {
    scoped: Effect.gen(function* () {
      // Resource 1: Database
      const db = yield* acquireDatabase()
      yield* Effect.addFinalizer(() =>
        Effect.logInfo("Closing database").pipe(
          Effect.flatMap(() => db.close())
        )
      )
      
      // Resource 2: Cache
      const cache = yield* acquireCache()
      yield* Effect.addFinalizer(() =>
        Effect.logInfo("Closing cache").pipe(
          Effect.flatMap(() => cache.close())
        )
      )
      
      // Resource 3: Message Queue
      const mq = yield* acquireMessageQueue()
      yield* Effect.addFinalizer(() =>
        Effect.logInfo("Closing message queue").pipe(
          Effect.flatMap(() => mq.close())
        )
      )
      
      // Cleanup happens in reverse order:
      // 3. Message Queue closes
      // 2. Cache closes
      // 1. Database closes (first acquired, last released)
      
      return {
        doSomething: () =>
          Effect.gen(function* () {
            yield* db.query("...")
            yield* cache.set("key", "value")
            yield* mq.publish("queue", { data: "..." })
          })
      }
    })
  }
) {}
```

**Error Handling with Cleanup**:

```typescript
const program = Effect.gen(function* () {
  const service = yield* MyService  // Acquires resources
  
  try {
    yield* service.doWork()
  } catch (error) {
    yield* Effect.logError(`Work failed: ${error}`)
    // Resources still cleaned up
  }
  
  // Scope ends here, cleanup guaranteed
})

// If doWork() fails, cleanup still runs
// If cleanup fails, error is logged but doesn't prevent other cleanup
```

---

#### 2.4 Comparison: Effect vs Scoped

**Decision Matrix**:

| Service Type | Pattern | Reason |
|--------------|---------|---------|
| Database connections | `scoped` | Must release connections |
| HTTP clients | `scoped` | Must close connections |
| File handles | `scoped` | Must close files |
| Message queues | `scoped` | Must disconnect |
| Cache connections | `scoped` | Must close clients |
| Calculators | `effect` | No resources |
| Validators | `effect` | No resources |
| Transformers | `effect` | No resources |
| Configuration | `effect` | Load once, no cleanup |
| Utilities | `effect` | Pure functions |

**Rule of Thumb**: If your service acquires something that needs `.close()`, `.disconnect()`, `.end()`, or `.release()`, use `scoped`. Otherwise, use `effect`.

---

## B. Type-Level Architecture

Effect-TS uses types to encode architectural constraints and make invalid states unrepresentable. The type system becomes a tool for enforcing clean architecture.

### 1. Effect<A, E, R> as Architecture

The `Effect<A, E, R>` type signature is not just a return type—it's an architectural contract that encodes three critical pieces of information.

#### 1.1 Success Channel (A) - Domain Outcomes

The success channel represents what the operation produces—the domain result:

**What It Represents**:
- Domain entities
- Calculated values
- Operation results
- Business outcomes

**Example - Domain Outcomes**:

```typescript
// Order creation returns an Order
const createOrder: (items: OrderItem[]) => Effect.Effect<
  Order,              // A: Success outcome - Order entity
  OrderError,
  OrderRepository
>

// Price calculation returns Money
const calculatePrice: (product: Product) => Effect.Effect<
  Money,              // A: Success outcome - Money value
  never,
  PricingService
>

// Validation returns validated data
const validateUser: (data: unknown) => Effect.Effect<
  ValidatedUser,      // A: Success outcome - Validated entity
  ValidationError,
  never
>

// Statistics query returns aggregate data
const getOrderStats: (range: DateRange) => Effect.Effect<
  OrderStatistics,    // A: Success outcome - Statistics
  DatabaseError,
  OrderRepository
>
```

**Void for Side Effects**:

```typescript
// Side-effect operations return void
const sendEmail: (email: Email) => Effect.Effect<
  void,               // A: void - side effect, no return value
  EmailError,
  EmailService
>

const logEvent: (event: Event) => Effect.Effect<
  void,               // A: void - logging side effect
  never,
  Logger
>
```

**Multiple Outcomes**:

```typescript
// Operations with multiple possible successful outcomes
type ProcessResult = 
  | { _tag: "Success"; order: Order }
  | { _tag: "PartialSuccess"; order: Order; warnings: Warning[] }

const processOrder: (items: OrderItem[]) => Effect.Effect<
  ProcessResult,      // A: Multiple success variants
  OrderError,
  OrderRepository
>
```

---

#### 1.2 Error Channel (E) - Domain and System Failures

The error channel makes all possible failures explicit and type-safe:

**What It Represents**:
- Domain errors (business rule violations)
- System failures (infrastructure issues)
- Validation errors
- Not found errors
- Authorization errors

**Example - Explicit Errors**:

```typescript
// Single error type
const getUser: (id: UserId) => Effect.Effect<
  User,
  UserNotFoundError,  // E: Explicit error
  UserRepository
>

// Multiple error types (union)
const createOrder: (items: OrderItem[]) => Effect.Effect<
  Order,
  | OrderValidationError    // Domain error
  | PaymentDeclinedError    // External service error
  | InsufficientInventoryError,  // Business rule violation
  OrderRepository | PaymentGateway | InventoryService
>

// Never - cannot fail
const calculateTotal: (items: OrderItem[]) => Effect.Effect<
  Money,
  never,              // E: never - pure calculation, cannot fail
  never
>
```

**Error Handling Based on Types**:

```typescript
const program = Effect.gen(function* () {
  const createOrder = yield* CreateOrderService
  
  // Attempt to create order
  const result = yield* createOrder.execute(items).pipe(
    Effect.catchTags({
      // Handle specific errors by type
      OrderValidationError: (error) =>
        Effect.logError(`Validation failed: ${error.reason}`).pipe(
          Effect.as(null)
        ),
      
      PaymentDeclinedError: (error) =>
        Effect.logError(`Payment declined: ${error.reason}`).pipe(
          Effect.flatMap(() => notifyUser(error))
        ),
      
      InsufficientInventoryError: (error) =>
        Effect.logError(`Out of stock: ${error.items}`).pipe(
          Effect.flatMap(() => suggestAlternatives(error.items))
        )
    })
  )
})
```

**Error Channel Documents Failure Modes**:

```typescript
// The type signature tells you everything that can go wrong
const processCheckout: (
  userId: UserId,
  paymentToken: string
) => Effect.Effect<
  Order,
  // All possible failures explicitly listed
  | CartEmptyError           // User has empty cart
  | CartNotFoundError        // Cart doesn't exist
  | PaymentDeclinedError     // Payment failed
  | InvalidAddressError      // Shipping address invalid
  | OutOfStockError          // Items unavailable
  | DatabaseError,           // System failure
  CartRepository | OrderService | PaymentGateway | ShippingService
>

// Consumers know exactly what to handle
// Compiler ensures all errors are handled
```

---

#### 1.3 Requirements Channel (R) - Type-Level Port Dependencies

The requirements channel makes all dependencies explicit at the type level:

**What It Represents**:
- Port dependencies (services needed)
- Compile-time dependency tracking
- Dependency graph
- Architectural constraints

**Example - Explicit Dependencies**:

```typescript
// Single dependency
const getUser: (id: UserId) => Effect.Effect<
  User,
  UserNotFoundError,
  UserRepository        // R: Requires UserRepository port
>

// Multiple dependencies (union)
const createOrder: (items: OrderItem[]) => Effect.Effect<
  Order,
  OrderError,
  | OrderRepository     // R: Multiple port dependencies
  | PaymentGateway
  | InventoryService
  | EmailService
>

// No dependencies (never)
const validateEmail: (email: string) => Effect.Effect<
  boolean,
  never,
  never                 // R: never - pure function, no dependencies
>
```

**Compiler-Enforced Dependency Satisfaction**:

```typescript
// Define a service with dependencies
const createOrder = (items: OrderItem[]): Effect.Effect<
  Order,
  OrderError,
  OrderRepository | PaymentGateway  // Requires these two services
> =>
  Effect.gen(function* () {
    const orders = yield* OrderRepository
    const payment = yield* PaymentGateway
    
    // Use dependencies
    const order = yield* orders.save(new Order(items))
    yield* payment.charge(order.total, "token")
    
    return order
  })

// ❌ Cannot run without providing dependencies
Effect.runPromise(createOrder(items))  // TYPE ERROR!
// Error: Argument of type 'Effect<Order, OrderError, OrderRepository | PaymentGateway>' 
// is not assignable to parameter of type 'Effect<Order, OrderError, never>'

// ✅ Must satisfy dependencies
const runnable = createOrder(items).pipe(
  Effect.provide(Layer.mergeAll(
    OrderRepositoryLive,
    PaymentGatewayLive
  ))
)
// Type: Effect<Order, OrderError, never>
// ✓ All dependencies satisfied

Effect.runPromise(runnable)  // ✓ Now it compiles
```

**Dependencies Flow Through Composition**:

```typescript
// Dependencies accumulate through composition
const step1: Effect.Effect<A, E, ServiceA> = ...
const step2: (a: A) => Effect.Effect<B, E, ServiceB> = ...
const step3: (b: B) => Effect.Effect<C, E, ServiceC> = ...

const composed = step1.pipe(
  Effect.flatMap(step2),
  Effect.flatMap(step3)
)

// Type: Effect<C, E, ServiceA | ServiceB | ServiceC>
// All dependencies are combined in the requirements channel
```

---

#### 1.4 Compiler-Enforced Dependency Satisfaction

The type system prevents running programs with unsatisfied dependencies:

**Example - Dependency Tracking**:

```typescript
// Complex workflow with many dependencies
const checkoutWorkflow = (userId: UserId): Effect.Effect<
  Order,
  CheckoutError,
  CartRepository | OrderService | PaymentGateway | ShippingService | EmailService
> =>
  Effect.gen(function* () {
    const cart = yield* CartRepository
    const orders = yield* OrderService
    const payment = yield* PaymentGateway
    const shipping = yield* ShippingService
    const email = yield* EmailService
    
    const items = yield* cart.getCart(userId)
    const order = yield* orders.createOrder(items)
    yield* payment.charge(order.total, "token")
    yield* shipping.scheduleShipment(order)
    yield* email.sendConfirmation(order)
    
    return order
  })

// Compiler tracks all dependencies
// Type signature shows exactly what's needed:
// CartRepository | OrderService | PaymentGateway | ShippingService | EmailService

// Must provide all before running
const runnable = checkoutWorkflow(userId).pipe(
  Effect.provide(Layer.mergeAll(
    CartRepositoryLive,
    OrderServiceLive,
    PaymentGatewayLive,
    ShippingServiceLive,
    EmailServiceLive
  ))
)

// Type: Effect<Order, CheckoutError, never>
// All dependencies satisfied, can run safely
```

**Partial Dependency Satisfaction**:

```typescript
// Provide some dependencies, leave others for later
const partiallyProvided = checkoutWorkflow(userId).pipe(
  Effect.provide(Layer.mergeAll(
    CartRepositoryLive,
    OrderServiceLive
  ))
)

// Type: Effect<Order, CheckoutError, PaymentGateway | ShippingService | EmailService>
// Still needs PaymentGateway, ShippingService, EmailService

// Can provide remaining dependencies elsewhere
const fullyProvided = partiallyProvided.pipe(
  Effect.provide(Layer.mergeAll(
    PaymentGatewayLive,
    ShippingServiceLive,
    EmailServiceLive
  ))
)

// Type: Effect<Order, CheckoutError, never>
// Now all dependencies satisfied
```

---

### 2. Branded Types for Boundaries

Branded types create type-safe boundaries between different layers and contexts, preventing mixing of incompatible types.

#### 2.1 Domain Branding

Domain branded types ensure type safety within the business logic layer:

**Purpose**:
- Type-safe domain identifiers
- Prevent mixing different ID types
- Self-documenting domain concepts
- Compile-time validation

**Example - Domain IDs**:

```typescript
// domain/value-objects/ids.ts
import { Brand } from "effect"

// Each domain entity has its own ID type
export type UserId = string & Brand.Brand<"UserId">
export const UserId = Brand.nominal<UserId>()

export type OrderId = string & Brand.Brand<"OrderId">
export const OrderId = Brand.nominal<OrderId>()

export type ProductId = string & Brand.Brand<"ProductId">
export const ProductId = Brand.nominal<ProductId>()

export type TaskId = string & Brand.Brand<"TaskId">
export const TaskId = Brand.nominal<TaskId>()

// Cannot mix different ID types
const userId: UserId = UserId.make("user-123")
const orderId: OrderId = OrderId.make("order-456")

// ❌ Type error - cannot assign UserId to OrderId
const invalid: OrderId = userId  // TYPE ERROR!

// ✅ Must explicitly convert (if desired)
const converted: OrderId = OrderId.make(userId)  // Explicit conversion
```

**Benefits**:

```typescript
// Without branded types - unsafe
function getOrder(id: string): Order {
  // Could pass any string by mistake
  return database.query(id)
}

const userId = "user-123"
const order = getOrder(userId)  // ❌ Bug! Passed wrong ID type

// With branded types - safe
function getOrder(id: OrderId): Effect.Effect<Order, OrderNotFoundError> {
  // Only OrderId accepted
  return database.query(id)
}

const userId = UserId.make("user-123")
const order = getOrder(userId)  // ✅ TYPE ERROR - caught at compile time!

const orderId = OrderId.make("order-456")
const order = getOrder(orderId)  // ✅ Correct type
```

**Domain Value Objects**:

```typescript
// domain/value-objects/Money.value.ts
export type Money = number & Brand.Brand<"Money">

export const Money = Brand.refined<Money>(
  (n) => n >= 0,  // Validation rule
  (n) => Brand.error(`Money cannot be negative: ${n}`)
)

// Money operations
export namespace Money {
  export const zero: Money = Money(0)
  
  export const add = (a: Money, b: Money): Money =>
    Money(a + b)
  
  export const multiply = (m: Money, factor: number): Money =>
    Money(m * factor)
  
  export const fromCents = (cents: number): Money =>
    Money(cents / 100)
  
  export const toCents = (m: Money): number =>
    Math.round(m * 100)
}

// Usage
const price = Money(100)
const doubled = Money.multiply(price, 2)

// ❌ Cannot create negative money
const invalid = Money(-50)  // Throws: "Money cannot be negative: -50"

// ❌ Cannot accidentally use raw numbers
const subtotal: Money = 100  // TYPE ERROR
const subtotal: Money = Money(100)  // ✅ Correct
```

---

#### 2.2 API Branding

API branded types represent external representations at the API boundary:

**Purpose**:
- Type-safe API contracts
- Prevent internal types from leaking
- Clear API boundaries
- Version-specific types

**Example - API Types**:

```typescript
// adapters/primary/http/types/ApiTypes.ts

// API-specific branded types
export type ApiUserId = string & Brand.Brand<"ApiUserId">
export const ApiUserId = Brand.nominal<ApiUserId>()

export type ApiOrderId = string & Brand.Brand<"ApiOrderId">
export const ApiOrderId = Brand.nominal<ApiOrderId>()

// API request/response types
export interface ApiCreateOrderRequest {
  readonly items: ReadonlyArray<{
    readonly sku: string
    readonly quantity: number
  }>
  readonly userId: ApiUserId
}

export interface ApiOrderResponse {
  readonly id: ApiOrderId
  readonly userId: ApiUserId
  readonly items: ReadonlyArray<ApiOrderItem>
  readonly status: "pending" | "confirmed" | "shipped"
  readonly totalAmount: number
  readonly createdAt: string  // ISO 8601 string
}

// Cannot mix API types with domain types
const apiUserId: ApiUserId = ApiUserId.make("user-123")
const domainUserId: UserId = apiUserId  // ❌ TYPE ERROR - different types
```

---

#### 2.3 Database Branding

Database branded types represent persistence layer types:

**Purpose**:
- Type-safe database operations
- Prevent database types from leaking into domain
- Database-specific formats
- Schema versioning

**Example - Database Types**:

```typescript
// infrastructure/persistence/types/DbTypes.ts

// Database-specific branded types
export type DbOrderId = number & Brand.Brand<"DbOrderId">
export const DbOrderId = Brand.nominal<DbOrderId>()

export type DbUserId = number & Brand.Brand<"DbUserId">
export const DbUserId = Brand.nominal<DbUserId>()

// Database row types
export interface DbOrderRow {
  readonly id: DbOrderId
  readonly user_id: DbUserId  // snake_case from database
  readonly total_amount: number
  readonly status: string
  readonly created_at: Date
  readonly updated_at: Date
}

// Cannot mix database types with domain types
const dbOrderId: DbOrderId = DbOrderId.make(123)
const domainOrderId: OrderId = dbOrderId  // ❌ TYPE ERROR - different types
```

---

#### 2.4 Conversion Functions - Explicit Boundary Crossing

Conversion functions make boundary crossings explicit and type-safe:

**Purpose**:
- Explicit type transformations
- Clear boundary markers
- Validation at boundaries
- Format conversions

**Example - Domain ↔ API Conversions**:

```typescript
// adapters/primary/http/converters/OrderConverters.ts
import { Order, OrderId, UserId } from "../../../../domain/models"
import { ApiOrderResponse, ApiOrderId, ApiUserId } from "../types/ApiTypes"

/**
 * Convert domain Order to API response
 */
export const orderToApiResponse = (order: Order): ApiOrderResponse => ({
  id: ApiOrderId.make(order.id),
  userId: ApiUserId.make(order.userId),
  items: order.items.map(item => ({
    sku: item.sku,
    quantity: item.quantity,
    price: item.price
  })),
  status: order.status,
  totalAmount: order.totalAmount,
  createdAt: order.createdAt.toISOString()  // Date → ISO string
})

/**
 * Convert API request to domain types
 */
export const apiRequestToDomain = (
  req: ApiCreateOrderRequest
): Effect.Effect<
  { userId: UserId; items: OrderItem[] },
  ValidationError
> =>
  Effect.gen(function* () {
    // Convert API UserId to domain UserId
    const userId = UserId.make(req.userId)
    
    // Validate and convert items
    const items = yield* Effect.forEach(req.items, (item) =>
      Effect.gen(function* () {
        if (item.quantity <= 0) {
          return yield* Effect.fail(
            new ValidationError({ field: "quantity", reason: "Must be positive" })
          )
        }
        
        return new OrderItem({
          sku: item.sku,
          quantity: item.quantity,
          price: 0  // Will be looked up
        })
      })
    )
    
    return { userId, items }
  })
```

**Example - Domain ↔ Database Conversions**:

```typescript
// infrastructure/persistence/converters/OrderConverters.ts
import { Order, OrderId, UserId } from "../../../domain/models"
import { DbOrderRow, DbOrderId, DbUserId } from "../types/DbTypes"

/**
 * Convert database row to domain Order
 */
export const dbRowToDomain = (row: DbOrderRow): Order =>
  new Order({
    id: OrderId.make(String(row.id)),  // DbOrderId (number) → OrderId (string)
    userId: UserId.make(String(row.user_id)),
    items: JSON.parse(row.items_json),  // JSON → Array
    totalAmount: row.total_amount,
    status: row.status as OrderStatus,
    createdAt: row.created_at
  })

/**
 * Convert domain Order to database row
 */
export const domainToDbRow = (order: Order): Omit<DbOrderRow, "id" | "created_at" | "updated_at"> => ({
  user_id: DbUserId.make(Number(order.userId)),  // UserId (string) → DbUserId (number)
  items_json: JSON.stringify(order.items),  // Array → JSON
  total_amount: order.totalAmount,
  status: order.status
})
```

**Example - Complete HTTP Handler with Conversions**:

```typescript
// adapters/primary/http/OrderApi.http-adapter.ts
import { HttpApiEndpoint, HttpApiGroup, HttpApiBuilder } from "@effect/platform"
import { CreateOrderService } from "../../../application/services/CreateOrder.service"
import { apiRequestToDomain, orderToApiResponse } from "./converters/OrderConverters"

export class OrderApi extends HttpApiGroup.make("orders")
  .add(
    HttpApiEndpoint.post("createOrder", "/orders")
      .setPayload(ApiCreateOrderRequestSchema)
      .addSuccess(ApiOrderResponseSchema)
  )
{} {
  static Live = HttpApiBuilder.group(OrderApi, "orders", (handlers) =>
    handlers.handle("createOrder", ({ payload }) =>
      Effect.gen(function* () {
        // 1. API → Domain conversion (with validation)
        const { userId, items } = yield* apiRequestToDomain(payload)
        
        // 2. Execute domain operation
        const createOrder = yield* CreateOrderService
        const order = yield* createOrder.execute(userId, items)
        
        // 3. Domain → API conversion
        return orderToApiResponse(order)
      })
    )
  )
}

// Type safety at every boundary:
// HTTP Request (JSON) → ApiCreateOrderRequest → Domain Types → Order → ApiOrderResponse → HTTP Response (JSON)
```

**Benefits of Explicit Conversions**:

1. **Type Safety**: Cannot accidentally mix types from different contexts
2. **Clear Boundaries**: Conversion functions mark architectural boundaries
3. **Validation**: Convert and validate at the same time
4. **Documentation**: Conversion functions document the transformation
5. **Easy Testing**: Test conversions in isolation
6. **Refactoring**: Easy to change internal types without affecting boundaries

---

## C. Error Handling Patterns

Effect-TS provides powerful patterns for modeling and handling errors in a type-safe, composable way.

### 1. Tagged Errors

Tagged errors use Effect's `Data.TaggedError` for errors with rich context and type safety.

#### 1.1 Data.TaggedError

`Data.TaggedError` creates discriminated union errors with payload:

**Pattern**:

```typescript
import { Data } from "effect"

export class ErrorName extends Data.TaggedError("ErrorName")<{
  field1: Type1
  field2: Type2
}> {}

// Usage
const error = new ErrorName({ field1: value1, field2: value2 })
```

**Complete Example - Domain Errors**:

```typescript
// domain/errors/OrderErrors.ts
import { Data } from "effect"
import { OrderId, UserId } from "../models/Order.model"

/**
 * Order not found error
 */
export class OrderNotFoundError extends Data.TaggedError("OrderNotFoundError")<{
  readonly orderId: OrderId
  readonly timestamp?: Date
}> {
  // Optional: Add custom methods
  get message(): string {
    return `Order ${this.orderId} not found`
  }
}

/**
 * Invalid order state transition error
 */
export class InvalidOrderStateError extends Data.TaggedError("InvalidOrderStateError")<{
  readonly orderId: OrderId
  readonly currentState: OrderStatus
  readonly attemptedTransition: OrderStatus
  readonly reason?: string
}> {
  get message(): string {
    return `Cannot transition order ${this.orderId} from ${this.currentState} to ${this.attemptedTransition}${
      this.reason ? `: ${this.reason}` : ""
    }`
  }
}

/**
 * Order validation error
 */
export class OrderValidationError extends Data.TaggedError("OrderValidationError")<{
  readonly failures: ReadonlyArray<{
    readonly field: string
    readonly message: string
  }>
}> {
  get message(): string {
    return `Order validation failed: ${this.failures.map(f => `${f.field}: ${f.message}`).join(", ")}`
  }
}

/**
 * Insufficient inventory error
 */
export class InsufficientInventoryError extends Data.TaggedError("InsufficientInventoryError")<{
  readonly items: ReadonlyArray<{
    readonly sku: string
    readonly requested: number
    readonly available: number
  }>
}> {
  get message(): string {
    return `Insufficient inventory for: ${this.items.map(i => `${i.sku} (need ${i.requested}, have ${i.available})`).join(", ")}`
  }
}
```

**Usage with Pattern Matching**:

```typescript
const handleOrderError = (error: OrderError) =>
  Effect.gen(function* () {
    // Pattern match on error tag
    switch (error._tag) {
      case "OrderNotFoundError":
        yield* Effect.logWarning(`Order ${error.orderId} not found`)
        return { status: 404, message: error.message }
      
      case "InvalidOrderStateError":
        yield* Effect.logWarning(
          `Invalid transition for order ${error.orderId}: ${error.currentState} → ${error.attemptedTransition}`
        )
        return { status: 400, message: error.message }
      
      case "OrderValidationError":
        yield* Effect.logWarning(`Validation failed: ${JSON.stringify(error.failures)}`)
        return { status: 400, message: error.message, details: error.failures }
      
      case "InsufficientInventoryError":
        yield* Effect.logWarning(`Inventory shortage: ${JSON.stringify(error.items)}`)
        return { status: 409, message: error.message, items: error.items }
    }
  })
```

---

#### 1.2 Data.TaggedClass

`Data.TaggedClass` creates simple errors without payload:

**When to Use**:
- Simple errors with no context
- Status-like errors
- Marker errors

**Example - Simple Errors**:

```typescript
// domain/errors/CommonErrors.ts
import { Data } from "effect"

// Simple error - no payload
export class NotFoundError extends Data.TaggedClass("NotFoundError")() {
  readonly message = "Resource not found"
}

export class UnauthorizedError extends Data.TaggedClass("UnauthorizedError")() {
  readonly message = "Unauthorized access"
}

export class ForbiddenError extends Data.TaggedClass("ForbiddenError")() {
  readonly message = "Forbidden"
}

// Usage
const error = new NotFoundError()
// No need to pass any data
```

---

### 2. Error Grouping

Group related errors into namespaces for better organization and type unions.

#### 2.1 Error Namespaces

**Pattern**:

```typescript
namespace FeatureErrors {
  export class Error1 extends Data.TaggedError("Feature.Error1")<{}> {}
  export class Error2 extends Data.TaggedError("Feature.Error2")<{}> {}
  export class Error3 extends Data.TaggedError("Feature.Error3")<{}> {}
  
  // Union type for all feature errors
  export type All = Error1 | Error2 | Error3
}
```

**Complete Example - Checkout Errors**:

```typescript
// application/services/Checkout/CheckoutErrors.ts
import { Data } from "effect"

/**
 * All errors related to checkout process
 */
export namespace CheckoutErrors {
  export class EmptyCartError extends Data.TaggedError("Checkout.EmptyCart")<{
    readonly userId: UserId
  }> {
    get message() {
      return `Cart is empty for user ${this.userId}`
    }
  }
  
  export class PaymentDeclinedError extends Data.TaggedError("Checkout.PaymentDeclined")<{
    readonly reason: string
    readonly amount: Money
    readonly attemptedAt: Date
  }> {
    get message() {
      return `Payment declined: ${this.reason} (amount: ${this.amount})`
    }
  }
  
  export class InsufficientInventoryError extends Data.TaggedError("Checkout.InsufficientInventory")<{
    readonly items: ReadonlyArray<{
      readonly sku: string
      readonly requested: number
      readonly available: number
    }>
  }> {
    get message() {
      return `Insufficient inventory: ${this.items.map(i => i.sku).join(", ")}`
    }
  }
  
  export class InvalidShippingAddressError extends Data.TaggedError("Checkout.InvalidShippingAddress")<{
    readonly address: Address
    readonly reason: string
  }> {
    get message() {
      return `Invalid shipping address: ${this.reason}`
    }
  }
  
  export class CheckoutTimeoutError extends Data.TaggedError("Checkout.Timeout")<{
    readonly userId: UserId
    readonly startedAt: Date
  }> {
    get message() {
      return `Checkout timed out for user ${this.userId}`
    }
  }
  
  // Union type for all checkout errors
  export type All = 
    | EmptyCartError
    | PaymentDeclinedError
    | InsufficientInventoryError
    | InvalidShippingAddressError
    | CheckoutTimeoutError
}

// Usage in service
export class CheckoutService extends Effect.Service<CheckoutService>()(
  "CheckoutService",
  {
    dependencies: [/* ... */],
    effect: Effect.gen(function* () {
      // ... acquire dependencies
      
      return {
        processCheckout: (userId: UserId): Effect.Effect<
          Order,
          CheckoutErrors.All,  // All checkout errors
          never
        > =>
          Effect.gen(function* () {
            // Can fail with any CheckoutErrors.All variant
            const cart = yield* getCart(userId)
            
            if (cart.items.length === 0) {
              return yield* Effect.fail(
                new CheckoutErrors.EmptyCartError({ userId })
              )
            }
            
            // ... rest of checkout logic
          })
      }
    })
  }
) {}
```

**Benefits**:

```typescript
// Handle all errors from a namespace
const handleCheckoutError = (error: CheckoutErrors.All) =>
  Effect.gen(function* () {
    switch (error._tag) {
      case "Checkout.EmptyCart":
        return { status: 400, message: "Your cart is empty" }
      
      case "Checkout.PaymentDeclined":
        return { status: 402, message: "Payment declined", reason: error.reason }
      
      case "Checkout.InsufficientInventory":
        return { status: 409, message: "Items out of stock", items: error.items }
      
      case "Checkout.InvalidShippingAddress":
        return { status: 400, message: "Invalid address", reason: error.reason }
      
      case "Checkout.Timeout":
        return { status: 408, message: "Checkout timed out" }
    }
  })
```

---

### 3. Error Mapping

Map errors at architectural boundaries to maintain separation of concerns.

#### 3.1 Boundary Error Mapping

**Purpose**:
- Keep infrastructure errors from leaking into domain
- Convert between error types at boundaries
- Provide context-appropriate error messages

**Example - Infrastructure → Domain**:

```typescript
// infrastructure/persistence/OrderRepository.postgres.ts
import { Effect } from "effect"
import { OrderRepository } from "../../application/ports/OrderRepository"
import { Order, OrderId } from "../../../domain/models"
import { OrderNotFoundError, DatabaseError } from "../../../domain/errors"

export const OrderRepositoryPostgresLive = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    
    return OrderRepository.of({
      findById: (id: OrderId) =>
        sql<Order>`SELECT * FROM orders WHERE id = ${id}`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.fail(new OrderNotFoundError({ orderId: id }))  // Map to domain error
              : Effect.succeed(Order.make(rows[0]))
          ),
          // Map infrastructure errors to domain errors
          Effect.mapError((error) => {
            // If it's already a domain error, pass through
            if (error instanceof OrderNotFoundError) {
              return error
            }
            
            // Otherwise, map to DatabaseError
            return new DatabaseError({
              operation: "findById",
              table: "orders",
              cause: error
            })
          })
        )
    })
  })
)
```

**Example - Domain → API**:

```typescript
// adapters/primary/http/OrderApi.http-adapter.ts
import { HttpApiBuilder } from "@effect/platform"

export class OrderApi extends HttpApiGroup.make("orders") {
  static Live = HttpApiBuilder.group(OrderApi, "orders", (handlers) =>
    handlers.handle("getOrder", ({ path }) =>
      Effect.gen(function* () {
        const orderService = yield* OrderService
        const order = yield* orderService.getOrder(path.id as OrderId)
        
        return orderToApiResponse(order)
      }).pipe(
        // Map domain errors to HTTP errors
        Effect.mapError((error) => {
          switch (error._tag) {
            case "OrderNotFoundError":
              return HttpApiError.notFound("Order", path.id, {
                message: `Order ${path.id} not found`
              })
            
            case "InvalidOrderStateError":
              return HttpApiError.badRequest("InvalidState", {
                message: `Cannot transition from ${error.currentState} to ${error.attemptedTransition}`
              })
            
            case "DatabaseError":
              return HttpApiError.internalServerError("DatabaseError", {
                message: "A database error occurred"
                // Don't expose internal details
              })
            
            default:
              return HttpApiError.internalServerError("UnknownError", {
                message: "An unexpected error occurred"
              })
          }
        })
      )
    )
  )
}
```

---

## D. Schema and Validation Patterns

Effect's Schema system provides powerful patterns for defining, validating, and transforming data.

### 1. Schema-Based Models

#### 1.1 Schema.Class for Domain Entities

`Schema.Class` creates domain entities with automatic validation:

**Pattern**:

```typescript
import { Schema } from "@effect/schema"

export class EntityName extends Schema.Class<EntityName>("EntityName")({
  field1: Schema.Type1,
  field2: Schema.Type2,
  // ... more fields
}) {
  // Business methods
  method1() {
    // ...
  }
}
```

**Complete Example - Order Entity**:

```typescript
// domain/models/Order.model.ts
import { Schema } from "@effect/schema"
import { Brand } from "effect"

// Branded ID type
export type OrderId = string & Brand.Brand<"OrderId">
export const OrderId = Brand.nominal<OrderId>()

// Order status enum
export const OrderStatus = Schema.Literal("pending", "confirmed", "shipped", "delivered", "cancelled")
export type OrderStatus = Schema.Schema.Type<typeof OrderStatus>

// Order item schema
export class OrderItem extends Schema.Class<OrderItem>("OrderItem")({
  sku: Schema.String.pipe(Schema.minLength(1)),
  name: Schema.String,
  quantity: Schema.Number.pipe(Schema.positive),
  price: Schema.Number.pipe(Schema.nonNegative),
  subtotal: Schema.Number.pipe(Schema.nonNegative)
}) {
  // Computed property
  get isValid(): boolean {
    return this.subtotal === this.price * this.quantity
  }
}

// Main Order entity
export class Order extends Schema.Class<Order>("Order")({
  id: Schema.String.pipe(Schema.brand("OrderId")),
  userId: Schema.String.pipe(Schema.brand("UserId")),
  items: Schema.Array(OrderItem).pipe(Schema.minItems(1)),
  totalAmount: Schema.Number.pipe(Schema.nonNegative),
  status: OrderStatus,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.optional(Schema.DateTimeUtc),
  shippingAddress: Schema.optional(Schema.Struct({
    street: Schema.String,
    city: Schema.String,
    state: Schema.String,
    zip: Schema.String,
    country: Schema.String
  }))
}) {
  // Business methods
  
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0)
  }
  
  canBeConfirmed(): boolean {
    return this.status === "pending" && this.items.length > 0
  }
  
  confirm(): Order {
    if (!this.canBeConfirmed()) {
      throw new Error("Cannot confirm order")
    }
    
    return new Order({
      ...this,
      status: "confirmed",
      updatedAt: new Date()
    })
  }
  
  canBeCancelled(): boolean {
    return this.status === "pending" || this.status === "confirmed"
  }
  
  cancel(reason: string): Order {
    if (!this.canBeCancelled()) {
      throw new Error(`Cannot cancel order in ${this.status} status`)
    }
    
    return new Order({
      ...this,
      status: "cancelled",
      updatedAt: new Date()
    })
  }
  
  markAsShipped(): Order {
    if (this.status !== "confirmed") {
      throw new Error("Can only ship confirmed orders")
    }
    
    return new Order({
      ...this,
      status: "shipped",
      updatedAt: new Date()
    })
  }
}
```

**Automatic Validation**:

```typescript
// Valid order - passes validation
const validOrder = new Order({
  id: OrderId.make("order-123"),
  userId: UserId.make("user-456"),
  items: [
    new OrderItem({
      sku: "ABC",
      name: "Product",
      quantity: 2,
      price: 100,
      subtotal: 200
    })
  ],
  totalAmount: 200,
  status: "pending",
  createdAt: new Date()
})

// Invalid order - throws validation error
try {
  const invalidOrder = new Order({
    id: OrderId.make("order-123"),
    userId: UserId.make("user-456"),
    items: [],  // ❌ Violates minItems(1)
    totalAmount: -50,  // ❌ Violates nonNegative
    status: "invalid",  // ❌ Not in Literal union
    createdAt: new Date()
  })
} catch (error) {
  // ParseError with detailed validation failures
  console.error(error)
}
```

---

#### 1.2 Schema.Struct for DTOs

Use `Schema.Struct` for data transfer objects and API types:

**Example - API Request/Response Types**:

```typescript
// adapters/primary/http/schemas/OrderSchemas.ts
import { Schema } from "@effect/schema"

// API request schema
export const CreateOrderRequestSchema = Schema.Struct({
  items: Schema.Array(
    Schema.Struct({
      sku: Schema.String.pipe(Schema.minLength(1)),
      quantity: Schema.Number.pipe(Schema.int, Schema.positive)
    })
  ).pipe(Schema.minItems(1)),
  shippingAddress: Schema.Struct({
    street: Schema.String.pipe(Schema.minLength(1)),
    city: Schema.String.pipe(Schema.minLength(1)),
    state: Schema.String.pipe(Schema.length(2)),
    zip: Schema.String.pipe(Schema.pattern(/^\d{5}$/)),
    country: Schema.String.pipe(Schema.length(2))
  }),
  paymentToken: Schema.String.pipe(Schema.minLength(1))
})

export type CreateOrderRequest = Schema.Schema.Type<typeof CreateOrderRequestSchema>

// API response schema
export const OrderResponseSchema = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  items: Schema.Array(
    Schema.Struct({
      sku: Schema.String,
      name: Schema.String,
      quantity: Schema.Number,
      price: Schema.Number,
      subtotal: Schema.Number
    })
  ),
  totalAmount: Schema.Number,
  status: Schema.Literal("pending", "confirmed", "shipped", "delivered", "cancelled"),
  createdAt: Schema.String,  // ISO string
  shippingAddress: Schema.optional(
    Schema.Struct({
      street: Schema.String,
      city: Schema.String,
      state: Schema.String,
      zip: Schema.String,
      country: Schema.String
    })
  )
})

export type OrderResponse = Schema.Schema.Type<typeof OrderResponseSchema>
```

**Configuration Schemas**:

```typescript
// infrastructure/config/ConfigSchema.ts
import { Schema } from "@effect/schema"

export const DatabaseConfigSchema = Schema.Struct({
  host: Schema.String,
  port: Schema.Number.pipe(Schema.int, Schema.between(1, 65535)),
  database: Schema.String,
  user: Schema.String,
  password: Schema.String,
  poolSize: Schema.Number.pipe(Schema.int, Schema.positive).pipe(
    Schema.withDefault(() => 10)
  ),
  idleTimeout: Schema.Number.pipe(Schema.int, Schema.positive).pipe(
    Schema.withDefault(() => 30000)
  )
})

export type DatabaseConfig = Schema.Schema.Type<typeof DatabaseConfigSchema>

export const AppConfigSchema = Schema.Struct({
  env: Schema.Literal("development", "staging", "production"),
  port: Schema.Number.pipe(Schema.int, Schema.between(1, 65535)),
  database: DatabaseConfigSchema,
  redis: Schema.Struct({
    url: Schema.String,
    connectTimeout: Schema.Number.pipe(Schema.int, Schema.positive)
  }),
  api: Schema.Struct({
    corsOrigins: Schema.Array(Schema.String),
    rateLimit: Schema.Struct({
      windowMs: Schema.Number,
      maxRequests: Schema.Number
    })
  })
})

export type AppConfig = Schema.Schema.Type<typeof AppConfigSchema>
```

---

### 2. Validation Strategies

#### 2.1 Domain Validation

Validate at domain boundaries using Schema constraints:

**Pattern**:

```typescript
// Define schema with validation rules
export const EntitySchema = Schema.Struct({
  field: Schema.String.pipe(
    Schema.minLength(3),
    Schema.maxLength(50),
    Schema.pattern(/^[a-z]+$/)
  )
})

// Use Schema.decodeUnknown for validation
const validate = (data: unknown): Effect.Effect<Entity, ParseError> =>
  Schema.decodeUnknown(EntitySchema)(data)
```

**Complete Example - User Validation**:

```typescript
// domain/models/User.model.ts
import { Schema } from "@effect/schema"
import { Brand } from "effect"

// Email validation
export const EmailSchema = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("Email")
)
export type Email = Schema.Schema.Type<typeof EmailSchema>

// Password validation
export const PasswordSchema = Schema.String.pipe(
  Schema.minLength(8),
  Schema.maxLength(100),
  Schema.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  Schema.brand("Password")
)
export type Password = Schema.Schema.Type<typeof PasswordSchema>

// User schema
export class User extends Schema.Class<User>("User")({
  id: Schema.String.pipe(Schema.brand("UserId")),
  email: EmailSchema,
  username: Schema.String.pipe(
    Schema.minLength(3),
    Schema.maxLength(20),
    Schema.pattern(/^[a-zA-Z0-9_]+$/)
  ),
  firstName: Schema.String.pipe(Schema.minLength(1)),
  lastName: Schema.String.pipe(Schema.minLength(1)),
  age: Schema.Number.pipe(
    Schema.int,
    Schema.between(18, 120)
  ),
  createdAt: Schema.DateTimeUtc,
  emailVerified: Schema.Boolean
}) {}

// Validation service
export class UserValidator extends Effect.Service<UserValidator>()(
  "UserValidator",
  {
    effect: Effect.gen(function* () {
      return {
        validateRegistration: (data: unknown) =>
          Schema.decodeUnknown(
            Schema.Struct({
              email: EmailSchema,
              password: PasswordSchema,
              username: Schema.String.pipe(
                Schema.minLength(3),
                Schema.maxLength(20)
              ),
              firstName: Schema.String,
              lastName: Schema.String,
              age: Schema.Number.pipe(Schema.between(18, 120))
            })
          )(data),
        
        validateEmail: (email: unknown) =>
          Schema.decodeUnknown(EmailSchema)(email),
        
        validatePassword: (password: unknown) =>
          Schema.decodeUnknown(PasswordSchema)(password)
      }
    })
  }
) {}
```

---

#### 2.2 Boundary Validation

Validate external data at entry points:

**Example - HTTP API Validation**:

```typescript
// adapters/primary/http/OrderApi.http-adapter.ts
import { HttpApiEndpoint, HttpApiGroup, HttpApiBuilder } from "@effect/platform"
import { Schema } from "@effect/schema"

export class OrderApi extends HttpApiGroup.make("orders")
  .add(
    HttpApiEndpoint.post("createOrder", "/orders")
      .setPayload(CreateOrderRequestSchema)  // Schema validation
      .addSuccess(OrderResponseSchema)
      .addError(ValidationErrorSchema)
  )
{} {
  static Live = HttpApiBuilder.group(OrderApi, "orders", (handlers) =>
    handlers.handle("createOrder", ({ payload }) =>
      Effect.gen(function* () {
        // payload is already validated by Schema
        // Type: CreateOrderRequest
        
        // Additional business validation
        const validator = yield* OrderValidator
        yield* validator.validateItems(payload.items)
        
        // Convert to domain types
        const orderService = yield* OrderService
        const order = yield* orderService.createOrder(payload)
        
        // Convert to API response
        return orderToApiResponse(order)
      }).pipe(
        // Map validation errors to API errors
        Effect.catchTag("ParseError", (error) =>
          Effect.fail(
            new ValidationErrorResponse({
              message: "Invalid request data",
              errors: formatParseError(error)
            })
          )
        )
      )
    )
  )
}
```

**Schema.decode for Type-Safe Parsing**:

```typescript
// Use Schema.decodeUnknown for external data
const parseOrderFromAPI = (data: unknown): Effect.Effect<Order, ParseError> =>
  Schema.decodeUnknown(Order)(data)

// Use Schema.decodeSync for data you know is valid
const parseOrderFromTrustedSource = (data: OrderData): Order =>
  Schema.decodeSync(Order)(data)

// Use in service
export class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    effect: Effect.gen(function* () {
      return {
        importOrders: (jsonData: unknown) =>
          Effect.gen(function* () {
            // Validate and parse external data
            const orders = yield* Schema.decodeUnknown(
              Schema.Array(Order)
            )(jsonData)
            
            // Now we have type-safe Order[]
            yield* Effect.forEach(orders, (order) =>
              saveOrder(order)
            )
          })
      }
    })
  }
) {}
```

This completes Section V (Effect-TS Specific Patterns), providing comprehensive coverage of modern Effect patterns, type-level architecture, error handling, and schema validation strategies with practical, real-world examples.
