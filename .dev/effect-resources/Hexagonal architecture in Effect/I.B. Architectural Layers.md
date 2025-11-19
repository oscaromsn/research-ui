---
modified: 2025-11-04T00:54:40-03:00
---
# I.B. Architectural Layers

## 1. Domain Layer (Pure Business Logic)

### 1.1 Characteristics

The Domain Layer sits at the core of the application and contains **zero dependencies** on Effect, infrastructure, or external systems. It represents pure business knowledge expressed in code.

**Fundamental Properties**:

1. **Pure Business Logic**:
   - Expresses business concepts and rules
   - Free from technical concerns
   - No framework dependencies
   - No I/O operations

2. **Immutable Data Structures**:
   - Value objects and entities
   - State changes produce new instances
   - Thread-safe by design

3. **Self-Contained**:
   - Can be tested without any infrastructure
   - Can be understood in isolation
   - Portable across technology stacks

4. **Framework Agnostic**:
   - No import from Effect (or minimal for types)
   - No database libraries
   - No HTTP frameworks
   - No external service SDKs

**What Belongs in the Domain Layer**:

```typescript
// ✅ Pure domain logic
export const calculateDiscount = (order: Order): Discount => {
  if (order.items.length > 10) {
    return Discount.percentage(15);
  }
  if (order.totalAmount > 1000) {
    return Discount.percentage(10);
  }
  return Discount.none();
}

// ✅ Domain rules
export const canCompleteTask = (task: Task): boolean =>
  task.status === "pending"

export const calculatePriority = (task: Task): number => {
  const daysSinceCreation = 
    (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceCreation * 1.5
}
```

**What Does NOT Belong in the Domain Layer**:

```typescript
// ❌ I/O operations
export const saveOrder = (order: Order) => {
  database.insert(order)  // NO - this is infrastructure
}

// ❌ Framework dependencies
export const validateOrder = (req: Request) => {
  // NO - Request is from Express/Fastify
}

// ❌ External service calls
export const notifyUser = (order: Order) => {
  emailService.send(...)  // NO - this is infrastructure
}
```

### 1.2 Components

#### 1.2.1 Models: Schema.Class Entities

Domain models represent business entities with behavior:

```typescript
// domain/models/Order.ts
import { Schema } from "@effect/schema"

export class Order extends Schema.Class<Order>("Order")({
  id: Schema.String,
  items: Schema.Array(OrderItem),
  totalAmount: Schema.Number,
  status: Schema.Literal("pending", "confirmed", "shipped")
}) {
  // Pure business logic - no I/O
  canBeConfirmed(): boolean {
    return this.items.length > 0 && this.status === "pending";
  }
  
  confirm(): Order {
    if (!this.canBeConfirmed()) {
      throw new Error("Order cannot be confirmed");
    }
    return new Order({ ...this, status: "confirmed" });
  }
  
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

```typescript
// domain/models/Task.ts
export class Task extends Schema.Class<Task>("Task")({
  id: Schema.String.pipe(Schema.brand("TaskId")),
  title: Schema.String.pipe(Schema.minLength(3)),
  status: Schema.Literal("pending", "completed"),
  createdAt: Schema.DateTimeUtc
}) {
  // Pure domain behavior
  complete(): Task {
    return new Task({ ...this, status: "completed" });
  }
  
  isPending(): boolean {
    return this.status === "pending";
  }
}
```

**Key Characteristics**:
- Use `Schema.Class` for validation and encoding/decoding
- Contain business methods (behavior)
- Return new instances (immutability)
- No side effects

#### 1.2.2 Errors: Data.TaggedError Types

Domain errors represent business failures:

```typescript
// domain/errors/OrderErrors.ts
import { Data } from "effect"

export class OrderNotFoundError extends Data.TaggedError("OrderNotFoundError")<{
  orderId: OrderId
}> {}

export class InvalidOrderStateError extends Data.TaggedError("InvalidOrderStateError")<{
  orderId: OrderId
  currentState: OrderState
  attemptedTransition: OrderState
}> {}

export class CheckoutValidationError extends Data.TaggedError("CheckoutValidationError")<{
  failures: ReadonlyArray<ValidationFailure>
}> {}
```

```typescript
// domain/errors/TaskErrors.ts
export class TaskNotFoundError extends Data.TaggedError("TaskNotFoundError")<{
  taskId: TaskId
}> {}

export class InvalidTaskTransitionError extends Data.TaggedError("InvalidTaskTransition")<{
  from: Task["status"]
  to: Task["status"]
}> {}
```

**Grouped Domain Errors**:

```typescript
// domain/errors/CheckoutErrors.ts
namespace CheckoutErrors {
  export class EmptyCartError extends Data.TaggedError("Checkout.EmptyCartError")<{}> {}
  
  export class PaymentDeclinedError extends Data.TaggedError("Checkout.PaymentDeclinedError")<{
    reason: string
  }> {}
  
  export class InsufficientInventoryError extends Data.TaggedError("Checkout.InsufficientInventoryError")<{
    items: ReadonlyArray<ItemId>
  }> {}
  
  export type All = 
    | EmptyCartError 
    | PaymentDeclinedError 
    | InsufficientInventoryError
}
```

**Benefits**:
- Type-safe error handling
- Rich error context
- Pattern matching support
- Better stack traces

#### 1.2.3 Value Objects: Branded Types and Immutable Values

Value objects represent domain concepts with identity based on value:

```typescript
// domain/value-objects/OrderId.ts
import { Brand } from "effect"

export type OrderId = string & Brand.Brand<"OrderId">
export const OrderId = Brand.nominal<OrderId>()

// domain/value-objects/Money.ts
export type Money = number & Brand.Brand<"Money">
export const Money = Brand.refined<Money>(
  (n) => n >= 0,
  (n) => Brand.error(`Money cannot be negative: ${n}`)
)

// Money operations (pure functions)
export namespace Money {
  export const zero: Money = Money(0)
  
  export const add = (a: Money, b: Money): Money =>
    Money(a + b)
  
  export const multiply = (m: Money, factor: number): Money =>
    Money(m * factor)
}
```

```typescript
// domain/value-objects/Email.ts
export type EmailAddress = string & Brand.Brand<"EmailAddress">
export const EmailAddress = Brand.refined<EmailAddress>(
  (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),
  (s) => Brand.error(`Invalid email: ${s}`)
)
```

```typescript
// domain/value-objects/TaskId.ts
export type TaskId = string & Brand.Brand<"TaskId">
export const TaskId = Brand.nominal<TaskId>()
```

**Benefits**:
- Type safety (can't mix UserId with OrderId)
- Domain validation at type level
- Self-documenting code
- Compile-time guarantees

#### 1.2.4 Business Rules: Pure Domain Logic Functions

Business rules are pure functions that express domain knowledge:

```typescript
// domain/rules/OrderRules.ts

// Pure business rule - no Effect, no I/O
export const calculateTotal = (order: Order): Money =>
  order.items.reduce((sum, item) => 
    Money.add(sum, Money.multiply(item.price, item.quantity)),
    Money.zero
  )

export const canShip = (order: Order): boolean =>
  order.status === "paid" && order.items.every(i => i.inStock)

export const requiresExpressShipping = (order: Order): boolean =>
  order.totalAmount > 500 || order.items.some(i => i.isFragile)

export const calculateShippingCost = (order: Order, destination: Address): Money => {
  const baseRate = requiresExpressShipping(order) ? Money(50) : Money(10)
  const distanceFactor = calculateDistance(order.warehouse, destination) / 100
  return Money.multiply(baseRate, distanceFactor)
}
```

```typescript
// domain/rules/TaskRules.ts

export const canCompleteTask = (task: Task): boolean =>
  task.status === "pending"

export const calculatePriority = (task: Task): number => {
  const daysSinceCreation = 
    (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceCreation * 1.5
}

export const isOverdue = (task: Task, dueDate: Date): boolean =>
  task.status === "pending" && Date.now() > dueDate.getTime()
```

**Characteristics**:
- Pure functions (no side effects)
- Deterministic (same input → same output)
- Easy to test
- Easy to understand
- Composable

#### 1.2.5 Domain Events: Immutable Event Records

Domain events represent things that happened in the domain:

```typescript
// domain/events/OrderEvents.ts

export interface OrderCreatedEvent {
  readonly _tag: "OrderCreated"
  readonly orderId: OrderId
  readonly userId: UserId
  readonly items: ReadonlyArray<OrderItem>
  readonly totalAmount: Money
  readonly timestamp: Date
}

export interface OrderConfirmedEvent {
  readonly _tag: "OrderConfirmed"
  readonly orderId: OrderId
  readonly confirmedAt: Date
}

export interface OrderShippedEvent {
  readonly _tag: "OrderShipped"
  readonly orderId: OrderId
  readonly trackingNumber: string
  readonly shippedAt: Date
}

export type OrderEvent = 
  | OrderCreatedEvent
  | OrderConfirmedEvent
  | OrderShippedEvent
```

```typescript
// domain/events/TaskEvents.ts

export interface TaskCreatedEvent {
  readonly _tag: "TaskCreated"
  readonly taskId: TaskId
  readonly title: string
  readonly createdAt: Date
}

export interface TaskCompletedEvent {
  readonly _tag: "TaskCompleted"
  readonly taskId: TaskId
  readonly completedAt: Date
}

export type TaskEvent = 
  | TaskCreatedEvent
  | TaskCompletedEvent
```

**Benefits**:
- Immutable records of what happened
- Enable event sourcing
- Decouple domain from side effects
- Support event-driven architecture

---

## 2. Application Layer (Orchestration)

### 2.1 Ports (Contract Definitions)

Ports are **abstract interfaces** that define contracts for communication with the outside world. They are pure interface definitions with no implementation.

#### 2.1.1 Primary Ports: Use Case Interfaces (What We Offer)

Primary ports define the capabilities the application offers to external actors:

```typescript
// application/ports/CompleteTaskUseCase.ts (as primary port)

// PRIMARY PORT - This is what the application OFFERS
export class CompleteTaskUseCase extends Effect.Service<CompleteTaskUseCase>()(
  "CompleteTaskUseCase",
  {
    dependencies: [TaskRepository.Default, EmailService.Default],
    
    effect: Effect.gen(function* () {
      const taskRepo = yield* TaskRepository
      const emailService = yield* EmailService
      
      // The PRIMARY PORT interface
      return {
        // This method is what external adapters will call
        execute: (taskId: TaskId) =>
          Effect.gen(function* () {
            // Orchestration logic using secondary ports
            const task = yield* taskRepo.findById(taskId)
            
            if (!canCompleteTask(task)) {
              return yield* Effect.fail(
                new InvalidTransitionError({
                  from: task.status,
                  to: "completed"
                })
              )
            }
            
            const completedTask = new Task({
              ...task,
              status: "completed"
            })
            
            yield* taskRepo.save(completedTask)
            yield* emailService.sendTaskCompletedEmail(completedTask)
          })
      }
    })
  }
) {}
```

**Characteristics**:
- Define what the application can do (use cases)
- Exposed to external actors (HTTP, CLI, etc.)
- Orchestrate multiple secondary ports
- Contain business workflow logic

#### 2.1.2 Secondary Ports: Dependency Interfaces (What We Need)

Secondary ports define what the application needs from external systems:

```typescript
// application/ports/TaskRepository.ts

// SECONDARY PORT - Application declares what it needs
export interface TaskRepository {
  readonly findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>
  readonly save: (task: Task) => Effect.Effect<void, DatabaseError>
  readonly findByStatus: (
    status: TaskStatus
  ) => Effect.Effect<Task[], DatabaseError>
}

// Tag for dependency injection
export class TaskRepository extends Context.Tag("TaskRepository")<
  TaskRepository,
  TaskRepository
>() {}
```

```typescript
// application/ports/EmailService.ts

export interface EmailService {
  readonly sendTaskCompletedEmail: (
    task: Task
  ) => Effect.Effect<void, EmailError>
  readonly sendTaskAssignedEmail: (
    task: Task,
    assignee: User
  ) => Effect.Effect<void, EmailError>
}

export class EmailService extends Context.Tag("EmailService")<
  EmailService,
  EmailService
>() {}
```

```typescript
// application/ports/PaymentGateway.ts

export interface PaymentGateway {
  readonly charge: (
    amount: Money,
    token: string
  ) => Effect.Effect<PaymentReceipt, PaymentError>
  readonly refund: (
    receiptId: string
  ) => Effect.Effect<void, PaymentError>
}

export class PaymentGateway extends Context.Tag("PaymentGateway")<
  PaymentGateway,
  PaymentGateway
>() {}
```

**Characteristics**:
- Define dependencies (what we need)
- Abstract interfaces (no implementation)
- Technology-agnostic
- Contract for adapters to implement

#### 2.1.3 Port Characteristics: Interface + Context.Tag

Every port follows a consistent pattern:

```typescript
// 1. Define the interface
export interface PortName {
  readonly method1: (args) => Effect.Effect<Success, Error>
  readonly method2: (args) => Effect.Effect<Success, Error>
}

// 2. Create the Context.Tag
export class PortName extends Context.Tag("PortName")<
  PortName,
  PortName
>() {}
```

**Why This Pattern**:
- **Interface**: Defines the contract (types)
- **Context.Tag**: Enables dependency injection (runtime)
- **Type Safety**: Compiler ensures implementations match
- **Flexibility**: Multiple implementations of same interface

#### 2.1.4 Contract-Only Definitions (No Implementation)

Ports must contain **zero implementation**:

```typescript
// ✅ CORRECT: Contract only
export class OrderService extends Effect.Service<OrderService>()("OrderService", {
  effect: Effect.gen(function* () {
    return {
      placeOrder: (items: OrderItem[]): Effect.Effect<Order, OrderError> =>
        Effect.die("CONTRACT ONLY - Use OrderService.service.ts for implementation"),
      
      getOrder: (id: string): Effect.Effect<Order, OrderNotFoundError> =>
        Effect.die("CONTRACT ONLY - Use OrderService.service.ts for implementation")
    }
  })
}) {}
```

```typescript
// ❌ WRONG: Implementation in port definition
export class OrderService extends Effect.Service<OrderService>()("OrderService", {
  effect: Effect.gen(function* () {
    const repo = yield* OrderRepository  // ❌ NO! Port shouldn't know about other ports
    
    return {
      placeOrder: (items) => Effect.gen(function* () {
        const order = new Order(...)
        yield* repo.save(order)  // ❌ NO! This is implementation
        return order
      })
    }
  })
}) {}
```

**Rules**:
- Ports define **what**, not **how**
- No business logic in ports
- No dependencies in port definitions
- Use `Effect.die()` as placeholder for contract-only ports

### 2.2 Use Cases (Application Services)

Use cases are the application services that implement primary ports and orchestrate business workflows.

#### 2.2.1 Business Process Orchestration

Use cases coordinate multiple domain objects and secondary ports to accomplish business goals:

```typescript
// application/services/CreateOrder.ts

export class CreateOrderUseCase extends Effect.Service<CreateOrderUseCase>()(
  "CreateOrderUseCase",
  {
    dependencies: [
      OrderRepository.Default,
      InventoryService.Default,
      PaymentGateway.Default,
      EventBus.Default
    ],
    
    effect: Effect.gen(function* () {
      const orderRepo = yield* OrderRepository
      const inventory = yield* InventoryService
      const payment = yield* PaymentGateway
      const events = yield* EventBus
      
      return {
        execute: (userId: UserId, items: OrderItem[]) =>
          Effect.gen(function* () {
            // 1. Validate items exist and are in stock
            yield* inventory.checkAvailability(items)
            
            // 2. Create domain entity
            const order = new Order({
              id: OrderId.make(crypto.randomUUID()),
              userId,
              items,
              totalAmount: calculateTotal(items),
              status: "pending"
            })
            
            // 3. Reserve inventory
            yield* inventory.reserve(items, order.id)
            
            // 4. Process payment
            const receipt = yield* payment.charge(order.totalAmount, "token")
            
            // 5. Confirm order (domain logic)
            const confirmedOrder = order.confirm()
            
            // 6. Persist
            yield* orderRepo.save(confirmedOrder)
            
            // 7. Publish event
            yield* events.publish({
              _tag: "OrderCreated",
              orderId: order.id,
              userId,
              totalAmount: order.totalAmount,
              timestamp: new Date()
            })
            
            return confirmedOrder
          })
      }
    })
  }
) {}
```

**Orchestration Characteristics**:
- Coordinate multiple services
- Define workflow steps
- Handle cross-cutting concerns
- Maintain transaction boundaries

#### 2.2.2 Coordination of Multiple Ports

Use cases depend on and coordinate multiple secondary ports:

```typescript
// application/services/ProcessCheckout.ts

export class ProcessCheckoutUseCase extends Effect.Service<ProcessCheckoutUseCase>()(
  "ProcessCheckoutUseCase",
  {
    // Multiple secondary port dependencies
    dependencies: [
      CartRepository.Default,
      OrderRepository.Default,
      PaymentGateway.Default,
      ShippingService.Default,
      EmailService.Default,
      EventBus.Default
    ],
    
    effect: Effect.gen(function* () {
      const cartRepo = yield* CartRepository
      const orderRepo = yield* OrderRepository
      const payment = yield* PaymentGateway
      const shipping = yield* ShippingService
      const email = yield* EmailService
      const events = yield* EventBus
      
      return {
        execute: (userId: UserId, paymentToken: string) =>
          Effect.gen(function* () {
            // Coordinate all ports to complete checkout
            const cart = yield* cartRepo.findByUser(userId)
            const shippingCost = yield* shipping.calculateCost(cart)
            const total = Money.add(cart.total, shippingCost)
            
            yield* payment.charge(total, paymentToken)
            
            const order = yield* createOrderFromCart(cart)
            yield* orderRepo.save(order)
            
            yield* cartRepo.clear(userId)
            yield* email.sendOrderConfirmation(order)
            yield* events.publish(OrderCreatedEvent(order))
            
            return order
          })
      }
    })
  }
) {}
```

#### 2.2.3 Transaction Boundaries

Use cases define transaction boundaries for consistency:

```typescript
// application/services/TransferFunds.ts

export class TransferFundsUseCase extends Effect.Service<TransferFundsUseCase>()(
  "TransferFundsUseCase",
  {
    dependencies: [AccountRepository.Default, Database.Default],
    
    effect: Effect.gen(function* () {
      const accountRepo = yield* AccountRepository
      const db = yield* Database
      
      return {
        execute: (from: AccountId, to: AccountId, amount: Money) =>
          // Transaction boundary
          db.transaction(
            Effect.gen(function* () {
              // All operations succeed or fail together
              const fromAccount = yield* accountRepo.findById(from)
              const toAccount = yield* accountRepo.findById(to)
              
              // Domain logic
              const updatedFrom = fromAccount.debit(amount)
              const updatedTo = toAccount.credit(amount)
              
              // Persist within transaction
              yield* accountRepo.save(updatedFrom)
              yield* accountRepo.save(updatedTo)
            })
          )
      }
    })
  }
) {}
```

#### 2.2.4 Error Handling and Recovery

Use cases handle errors and implement recovery strategies:

```typescript
// application/services/CompleteTask.ts

export class CompleteTaskUseCase extends Effect.Service<CompleteTaskUseCase>()(
  "CompleteTaskUseCase",
  {
    dependencies: [TaskRepository.Default, EmailService.Default],
    
    effect: Effect.gen(function* () {
      const taskRepo = yield* TaskRepository
      const emailService = yield* EmailService
      
      return {
        execute: (taskId: TaskId) =>
          Effect.gen(function* () {
            const task = yield* taskRepo.findById(taskId)
            
            // Domain validation
            if (!canCompleteTask(task)) {
              return yield* Effect.fail(
                new InvalidTransitionError({
                  from: task.status,
                  to: "completed"
                })
              )
            }
            
            const completedTask = task.complete()
            yield* taskRepo.save(completedTask)
            
            // Email notification with retry on failure
            yield* emailService.sendTaskCompletedEmail(completedTask).pipe(
              Effect.retry(Schedule.exponential("100 millis")),
              Effect.catchAll((error) =>
                // Log but don't fail the whole operation
                Effect.logError(`Failed to send email: ${error}`).pipe(
                  Effect.as(void 0)
                )
              )
            )
            
            return completedTask
          })
      }
    })
  }
) {}
```

#### 2.2.5 Effect.Service Implementation Pattern

Modern use cases use the `Effect.Service` pattern for clean, declarative service definitions:

```typescript
// Modern pattern: Everything in one place
export class MyUseCase extends Effect.Service<MyUseCase>()(
  "MyUseCase",
  {
    // 1. Declare dependencies explicitly
    dependencies: [Dep1.Default, Dep2.Default],
    
    // 2. Use 'effect' or 'scoped' for construction
    effect: Effect.gen(function* () {
      // 3. Acquire dependencies during construction
      const dep1 = yield* Dep1
      const dep2 = yield* Dep2
      
      // 4. Return the service interface
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

// Usage: MyUseCase.Default is automatically available as a Layer
```

**Benefits**:
- Single declaration for tag + interface + layer
- Explicit dependency declaration
- Automatic `.Default` layer export
- Cleaner than manual `Layer.effect` + `Context.Tag`
- Type inference works better

---

## 3. Infrastructure Layer (Concrete Implementations)

### 3.1 Secondary Adapters (Driven)

Secondary adapters are concrete implementations of secondary ports that connect the application to external systems.

#### 3.1.1 Persistence Adapters (Databases)

Database adapters implement repository ports:

```typescript
// infrastructure/persistence/TaskRepository.postgres.ts

import { Effect, Layer } from "effect"
import { SqlClient } from "@effect/sql"
import { TaskRepository } from "../../application/ports/TaskRepository"
import { Task, TaskId } from "../../domain/models"

// Internal implementation
const makeTaskRepositoryPostgres = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  return TaskRepository.of({
    findById: (id: TaskId) =>
      Effect.gen(function* () {
        const rows = yield* sql<Task>`SELECT * FROM tasks WHERE id = ${id}`
        if (rows.length === 0) {
          return yield* Effect.fail(new TaskNotFoundError({ taskId: id }))
        }
        return Task.make(rows[0])
      }),
      
    save: (task: Task) =>
      sql`
        INSERT INTO tasks (id, title, status, created_at)
        VALUES (${task.id}, ${task.title}, ${task.status}, ${task.createdAt})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          status = EXCLUDED.status
      `.pipe(Effect.asVoid),
      
    findByStatus: (status: TaskStatus) =>
      sql<Task[]>`
        SELECT * FROM tasks WHERE status = ${status}
      `.pipe(Effect.map((rows) => rows.map(Task.make)))
  })
})

// PUBLIC: Layer with local dependencies
export const TaskRepositoryPostgresLive = Layer.effect(
  TaskRepository,
  makeTaskRepositoryPostgres
).pipe(
  // Local dependency elimination
  Layer.provide(SqlClient.layer({
    host: "localhost",
    port: 5432,
    database: "myapp"
  }))
)
// Type: Layer<TaskRepository, never, never>
```

```typescript
// infrastructure/persistence/OrderRepository.postgres.ts

const makeOrderRepositoryPostgres = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  return OrderRepository.of({
    save: (order: Order) =>
      sql`INSERT INTO orders ${sql.insert(order)}`.pipe(
        Effect.mapError((e) => new DatabaseError({ cause: e }))
      ),
      
    findById: (id: OrderId) =>
      sql<Order>`SELECT * FROM orders WHERE id = ${id}`.pipe(
        Effect.flatMap(Schema.decodeUnknown(Order)),
        Effect.mapError((e) =>
          e instanceof ParseError
            ? new DatabaseError({ cause: e })
            : new OrderNotFoundError({ id })
        )
      ),
      
    findByUser: (userId: UserId) =>
      sql<Order[]>`SELECT * FROM orders WHERE user_id = ${userId}`.pipe(
        Effect.flatMap((rows) => Effect.forEach(rows, Schema.decodeUnknown(Order)))
      )
  })
})

export const OrderRepositoryPostgresLive = Layer.effect(
  OrderRepository,
  makeOrderRepositoryPostgres
).pipe(
  Layer.provide(SqlClient.layer({ /* config */ }))
)
```

#### 3.1.2 External Service Clients (APIs, Messaging)

External service adapters implement gateway ports:

```typescript
// infrastructure/external/PaymentGateway.stripe.ts

import { Effect, Layer } from "effect"
import { PaymentGateway } from "../../application/ports/PaymentGateway"

const makeStripePaymentGateway = Effect.gen(function* () {
  const config = yield* StripeConfig
  const client = createStripeClient(config)
  
  return PaymentGateway.of({
    charge: (amount: Money, token: string) =>
      Effect.tryPromise({
        try: () => client.charges.create({ 
          amount: Money.toCents(amount), 
          source: token,
          currency: "usd"
        }),
        catch: (e) => new PaymentError({ 
          reason: "stripe_error",
          cause: e 
        })
      }).pipe(
        Effect.map((charge) => new PaymentReceipt({
          id: charge.id,
          amount: Money.fromCents(charge.amount),
          status: charge.status
        }))
      ),
      
    refund: (receiptId: string) =>
      Effect.tryPromise({
        try: () => client.refunds.create({ charge: receiptId }),
        catch: (e) => new PaymentError({ 
          reason: "refund_failed",
          cause: e 
        })
      }).pipe(Effect.asVoid)
  })
})

export const PaymentGatewayStripeLive = Layer.effect(
  PaymentGateway,
  makeStripePaymentGateway
).pipe(
  Layer.provide(StripeConfigLive)
)
```

```typescript
// infrastructure/messaging/EmailService.smtp.ts

const makeEmailServiceSmtp = Effect.gen(function* () {
  const mailer = yield* NodeMailer
  const config = yield* EmailConfig
  
  return EmailService.of({
    sendTaskCompletedEmail: (task: Task) =>
      Effect.gen(function* () {
        yield* mailer.send({
          from: config.fromAddress,
          to: config.adminEmail,
          subject: `Task Completed: ${task.title}`,
          html: `
            <h1>Task Completed</h1>
            <p>Task ${task.id} "${task.title}" has been completed.</p>
          `
        })
      }),
      
    sendTaskAssignedEmail: (task: Task, assignee: User) =>
      Effect.gen(function* () {
        yield* mailer.send({
          from: config.fromAddress,
          to: assignee.email,
          subject: `New Task Assigned: ${task.title}`,
          html: `
            <h1>New Task Assignment</h1>
            <p>You have been assigned task: ${task.title}</p>
          `
        })
      })
  })
})

export const EmailServiceSmtpLive = Layer.effect(
  EmailService,
  makeEmailServiceSmtp
).pipe(
  Layer.provide(NodeMailerLive),
  Layer.provide(EmailConfigLive)
)
```

#### 3.1.3 File System Adapters

File system adapters implement storage ports:

```typescript
// infrastructure/storage/FileSystem.node.ts

import { Effect, Layer } from "effect"
import * as fs from "node:fs/promises"

const makeNodeFileSystem = Effect.gen(function* () {
  return FileSystemPort.of({
    readFile: (path: string) =>
      Effect.tryPromise({
        try: () => fs.readFile(path, "utf-8"),
        catch: (e) => new FileSystemError({ 
          operation: "read",
          path,
          cause: e 
        })
      }),
      
    writeFile: (path: string, content: string) =>
      Effect.tryPromise({
        try: () => fs.writeFile(path, content, "utf-8"),
        catch: (e) => new FileSystemError({ 
          operation: "write",
          path,
          cause: e 
        })
      }).pipe(Effect.asVoid),
      
    deleteFile: (path: string) =>
      Effect.tryPromise({
        try: () => fs.unlink(path),
        catch: (e) => new FileSystemError({ 
          operation: "delete",
          path,
          cause: e 
        })
      }).pipe(Effect.asVoid),
      
    exists: (path: string) =>
      Effect.tryPromise({
        try: async () => {
          try {
            await fs.access(path)
            return true
          } catch {
            return false
          }
        },
        catch: () => false
      })
  })
})

export const FileSystemPortNodeLive = Layer.succeed(
  FileSystemPort,
  makeNodeFileSystem
)
```

#### 3.1.4 Cache Implementations

Cache adapters implement caching ports:

```typescript
// infrastructure/cache/Cache.redis.ts

const makeRedisCache = Effect.gen(function* () {
  const redis = yield* RedisClient
  
  return CachePort.of({
    get: <T>(key: string) =>
      Effect.gen(function* () {
        const value = yield* Effect.tryPromise({
          try: () => redis.get(key),
          catch: (e) => new CacheError({ operation: "get", key, cause: e })
        })
        
        if (value === null) {
          return Option.none()
        }
        
        return Option.some(JSON.parse(value) as T)
      }),
      
    set: <T>(key: string, value: T, ttl?: number) =>
      Effect.tryPromise({
        try: () => ttl 
          ? redis.setex(key, ttl, JSON.stringify(value))
          : redis.set(key, JSON.stringify(value)),
        catch: (e) => new CacheError({ operation: "set", key, cause: e })
      }).pipe(Effect.asVoid),
      
    delete: (key: string) =>
      Effect.tryPromise({
        try: () => redis.del(key),
        catch: (e) => new CacheError({ operation: "delete", key, cause: e })
      }).pipe(Effect.asVoid),
      
    clear: () =>
      Effect.tryPromise({
        try: () => redis.flushdb(),
        catch: (e) => new CacheError({ operation: "clear", cause: e })
      }).pipe(Effect.asVoid)
  })
})

export const CachePortRedisLive = Layer.scoped(
  CachePort,
  Effect.gen(function* () {
    const cache = yield* makeRedisCache
    yield* Effect.addFinalizer(() => 
      Effect.promise(() => redis.quit())
    )
    return cache
  })
).pipe(
  Layer.provide(RedisClientLive)
)
```

#### 3.1.5 Test Doubles (Fakes, Mocks, Stubs)

Test implementations provide fast, deterministic alternatives:

```typescript
// infrastructure/testing/TaskRepository.memory.ts

// FAKE: Fully functional in-memory implementation
export const TaskRepositoryMemoryLive = Layer.effect(
  TaskRepository,
  Effect.gen(function* () {
    // State managed with Ref
    const tasks = yield* Ref.make<Map<TaskId, Task>>(new Map())
    
    return TaskRepository.of({
      findById: (id: TaskId) =>
        Ref.get(tasks).pipe(
          Effect.flatMap((map) =>
            map.has(id)
              ? Effect.succeed(map.get(id)!)
              : Effect.fail(new TaskNotFoundError({ taskId: id }))
          )
        ),
        
      save: (task: Task) =>
        Ref.update(tasks, (map) => new Map(map).set(task.id, task)),
        
      findByStatus: (status: TaskStatus) =>
        Ref.get(tasks).pipe(
          Effect.map((map) =>
            Array.from(map.values()).filter((t) => t.status === status)
          )
        )
    })
  })
)
// Type: Layer<TaskRepository, never, never>
```

```typescript
// infrastructure/testing/EmailService.fake.ts

// MOCK: Simple canned responses
export const EmailServiceFakeLive = Layer.succeed(
  EmailService,
  EmailService.of({
    sendTaskCompletedEmail: (task: Task) =>
      Effect.logInfo(`[FAKE] Would send completion email for task ${task.id}`).pipe(
        Effect.as(void 0)
      ),
      
    sendTaskAssignedEmail: (task: Task, assignee: User) =>
      Effect.logInfo(
        `[FAKE] Would send assignment email for task ${task.id} to ${assignee.email}`
      ).pipe(Effect.as(void 0))
  })
)
```

```typescript
// infrastructure/testing/PaymentGateway.mock.ts

// MOCK: Stub implementation for testing
export const PaymentGatewayMockLive = Layer.succeed(
  PaymentGateway,
  PaymentGateway.of({
    charge: (amount: Money, token: string) =>
      Effect.succeed(new PaymentReceipt({
        id: `mock-receipt-${crypto.randomUUID()}`,
        amount,
        status: "succeeded"
      })),
      
    refund: (receiptId: string) =>
      Effect.logInfo(`[MOCK] Would refund ${receiptId}`).pipe(
        Effect.as(void 0)
      )
  })
)
```

### 3.2 Adapter Characteristics

#### 3.2.1 Implement Port Interfaces Exactly

Adapters must implement port interfaces with exact type matching:

```typescript
// ✅ CORRECT: Matches port interface exactly
const adapter = TaskRepository.of({
  findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>,
  save: (task: Task) => Effect.Effect<void, DatabaseError>,
  findByStatus: (status: TaskStatus) => Effect.Effect<Task[], DatabaseError>
})

// ❌ WRONG: Type mismatch
const badAdapter = TaskRepository.of({
  findById: (id: string) => Effect.succeed({ wrong: "shape" }),
  //                                            ↑ TYPE ERROR!
  // Must return Task, not { wrong: string }
})
```

#### 3.2.2 Local Dependency Elimination

**Critical Pattern**: Each adapter should provide its own dependencies locally:

```typescript
// ❌ BAD: Exposes internal dependency
export const TaskRepositoryPostgresLive = Layer.effect(
  TaskRepository,
  makeTaskRepositoryPostgres
)
// Type: Layer<TaskRepository, never, SqlClient>
// Consumers must provide SqlClient!

// ✅ GOOD: Self-contained
export const TaskRepositoryPostgresLive = Layer.effect(
  TaskRepository,
  makeTaskRepositoryPostgres
).pipe(
  Layer.provide(SqlClientLive)  // Provided HERE, locally
)
// Type: Layer<TaskRepository, never, never>
// Consumers just get TaskRepository - clean interface!
```

**Benefits**:
- Clean public API
- Easy refactoring (change dependencies without affecting consumers)
- Simplified testing
- Reduced merge conflicts

#### 3.2.3 Resource Acquisition and Cleanup

Adapters manage resources using Effect's Scope system:

```typescript
// infrastructure/persistence/Database.postgres.ts

export const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const config = yield* Config
    
    // Acquire resource
    const pool = yield* acquireConnectionPool(config)
    
    // Register cleanup
    yield* Effect.addFinalizer(() =>
      Effect.promise(() => pool.close()).pipe(
        Effect.tap(() => Effect.logInfo("Database pool closed"))
      )
    )
    
    // Return service
    return createDatabaseService(pool)
  })
).pipe(
  Layer.provide(ConfigLive)
)
```

```typescript
// infrastructure/messaging/MessageQueue.rabbitmq.ts

export const MessageQueueLive = Layer.scoped(
  MessageQueue,
  Effect.gen(function* () {
    // Acquire connection
    const connection = yield* Effect.tryPromise({
      try: () => amqp.connect(config.url),
      catch: (e) => new ConnectionError({ cause: e })
    })
    
    // Acquire channel
    const channel = yield* Effect.tryPromise({
      try: () => connection.createChannel(),
      catch: (e) => new ChannelError({ cause: e })
    })
    
    // Register cleanup (in reverse order)
    yield* Effect.addFinalizer(() =>
      Effect.promise(() => channel.close())
    )
    yield* Effect.addFinalizer(() =>
      Effect.promise(() => connection.close())
    )
    
    return createMessageQueueService(channel)
  })
)
```

#### 3.2.4 Technology-Specific Logic Encapsulation

Adapters encapsulate all technology-specific details:

```typescript
// infrastructure/persistence/TaskRepository.postgres.ts

const makeTaskRepositoryPostgres = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  return TaskRepository.of({
    save: (task: Task) =>
      // PostgreSQL-specific: UPSERT syntax
      sql`
        INSERT INTO tasks (id, title, status, created_at)
        VALUES (${task.id}, ${task.title}, ${task.status}, ${task.createdAt})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          status = EXCLUDED.status,
          updated_at = NOW()
      `.pipe(
        Effect.asVoid,
        Effect.mapError((e) => new DatabaseError({ 
          operation: "save",
          entity: "task",
          cause: e 
        }))
      )
  })
})
```

```typescript
// infrastructure/cache/Cache.redis.ts

const makeRedisCache = Effect.gen(function* () {
  const redis = yield* RedisClient
  
  return CachePort.of({
    set: <T>(key: string, value: T, ttl?: number) =>
      // Redis-specific: SETEX command
      Effect.tryPromise({
        try: () => ttl 
          ? redis.setex(key, ttl, JSON.stringify(value))  // Redis-specific
          : redis.set(key, JSON.stringify(value)),
        catch: (e) => new CacheError({ cause: e })
      })
  })
})
```

---

## 4. Entrypoints Layer (Driving Adapters)

### 4.1 Primary Adapters

Primary adapters are the entry points that drive the application from the outside.

#### 4.1.1 HTTP/REST APIs

HTTP adapters translate HTTP requests into use case calls:

```typescript
// entrypoints/http/TaskApi.ts

import { HttpApiEndpoint, HttpApiGroup, HttpApiBuilder } from "@effect/platform"
import { Schema } from "@effect/schema"
import { CompleteTaskUseCase } from "../../application/use-cases/CompleteTask"

// Define API structure
export class TaskApi extends HttpApiGroup.make("tasks")
  .add(
    HttpApiEndpoint.post("completeTask", "/tasks/:id/complete")
      .addSuccess(Schema.Void)
      .addError(TaskNotFoundError)
      .addError(InvalidTransitionError)
  )
  .add(
    HttpApiEndpoint.get("getTask", "/tasks/:id")
      .addSuccess(TaskSchema)
      .addError(TaskNotFoundError)
  )
{} {
  // Implement handlers
  static Live = HttpApiBuilder.group(TaskApi, "tasks", (handlers) =>
    Effect.gen(function* () {
      const completeTask = yield* CompleteTaskUseCase
      const getTask = yield* GetTaskQuery
      
      return handlers
        .handle("completeTask", ({ path }) =>
          // Drive the use case
          completeTask.execute(path.id as TaskId)
        )
        .handle("getTask", ({ path }) =>
          getTask.execute(path.id as TaskId)
        )
    })
  )
}
```

#### 4.1.2 GraphQL Resolvers

GraphQL adapters translate GraphQL operations into use case calls:

```typescript
// entrypoints/graphql/TaskResolvers.ts

import { CompleteTaskUseCase, GetTaskQuery } from "../../application/use-cases"

export const taskResolvers = {
  Query: {
    task: (_parent: unknown, args: { id: string }, context: GraphQLContext) =>
      Effect.gen(function* () {
        const getTask = yield* GetTaskQuery
        const task = yield* getTask.execute(args.id as TaskId)
        return task
      }).pipe(
        Effect.provide(context.layer),
        Effect.runPromise
      )
  },
  
  Mutation: {
    completeTask: (_parent: unknown, args: { id: string }, context: GraphQLContext) =>
      Effect.gen(function* () {
        const completeTask = yield* CompleteTaskUseCase
        yield* completeTask.execute(args.id as TaskId)
        return { success: true }
      }).pipe(
        Effect.provide(context.layer),
        Effect.runPromise
      )
  }
}
```

#### 4.1.3 CLI Commands

CLI adapters translate command-line input into use case calls:

```typescript
// entrypoints/cli/TaskCommands.ts

import { Command, Options } from "@effect/cli"
import { CompleteTaskUseCase } from "../../application/use-cases/CompleteTask"

export const completeTaskCommand = Command.make(
  "complete",
  {
    taskId: Options.text("task-id").pipe(Options.withAlias("t")),
    notify: Options.boolean("notify").pipe(
      Options.withDefault(true),
      Options.withAlias("n")
    )
  },
  ({ taskId, notify }) =>
    Effect.gen(function* () {
      // Drive the use case
      const completeTask = yield* CompleteTaskUseCase
      yield* completeTask.execute(taskId as TaskId)
      
      if (notify) {
        yield* Console.log(`✓ Task ${taskId} completed successfully`)
      }
    })
)

export const taskCommands = Command.make("task")
  .pipe(
    Command.withSubcommand(completeTaskCommand),
    Command.withSubcommand(createTaskCommand),
    Command.withSubcommand(listTasksCommand)
  )
```

#### 4.1.4 WebSocket Handlers

WebSocket adapters handle real-time bidirectional communication:

```typescript
// entrypoints/websocket/TaskSocketHandler.ts

import { WebSocket } from "@effect/platform"
import { CompleteTaskUseCase } from "../../application/use-cases/CompleteTask"

export const taskSocketHandler = WebSocket.handler((socket) =>
  Effect.gen(function* () {
    const completeTask = yield* CompleteTaskUseCase
    
    // Handle incoming messages
    yield* socket.on("completeTask", (data: { taskId: string }) =>
      Effect.gen(function* () {
        yield* completeTask.execute(data.taskId as TaskId)
        
        // Send response back
        yield* socket.send({
          type: "taskCompleted",
          taskId: data.taskId
        })
      })
    )
  })
)
```

#### 4.1.5 gRPC Servers

gRPC adapters translate gRPC calls into use case calls:

```typescript
// entrypoints/grpc/TaskService.ts

import * as grpc from "@grpc/grpc-js"
import { CompleteTaskUseCase } from "../../application/use-cases/CompleteTask"

export const createTaskService = (layer: Layer.Layer<CompleteTaskUseCase>) => ({
  completeTask: (call, callback) => {
    const program = Effect.gen(function* () {
      const completeTask = yield* CompleteTaskUseCase
      yield* completeTask.execute(call.request.taskId as TaskId)
      return { success: true }
    })
    
    Effect.runPromise(program.pipe(Effect.provide(layer)))
      .then((result) => callback(null, result))
      .catch((error) => callback(error, null))
  }
})
```

#### 4.1.6 Message Queue Consumers

Message consumers drive use cases from queued messages:

```typescript
// entrypoints/messaging/TaskConsumer.ts

import { CompleteTaskUseCase } from "../../application/use-cases/CompleteTask"

export const taskMessageConsumer = Effect.gen(function* () {
  const queue = yield* MessageQueue
  const completeTask = yield* CompleteTaskUseCase
  
  // Subscribe to queue
  yield* queue.subscribe("task.complete", (message: TaskCompleteMessage) =>
    Effect.gen(function* () {
      yield* Effect.logInfo(`Processing task completion: ${message.taskId}`)
      
      // Drive use case from message
      yield* completeTask.execute(message.taskId)
      
      // Acknowledge message
      yield* queue.ack(message)
    }).pipe(
      // Retry on failure
      Effect.retry(Schedule.exponential("1 second")),
      // Log errors
      Effect.catchAll((error) =>
        Effect.logError(`Failed to process message: ${error}`)
      )
    )
  )
})
```

#### 4.1.7 Scheduled Jobs

Scheduled jobs drive use cases on a schedule:

```typescript
// entrypoints/jobs/TaskCleanupJob.ts

import { Schedule } from "effect"
import { CleanupCompletedTasksUseCase } from "../../application/use-cases"

export const taskCleanupJob = Effect.gen(function* () {
  const cleanup = yield* CleanupCompletedTasksUseCase
  
  // Run every day at midnight
  yield* cleanup.execute().pipe(
    Effect.schedule(Schedule.cron("0 0 * * *")),
    Effect.catchAll((error) =>
      Effect.logError(`Task cleanup job failed: ${error}`)
    )
  )
})
```

### 4.2 Composition Root

The entrypoints layer is where all layers are composed together.

#### 4.2.1 Single Point of Layer Assembly

All dependency injection happens at the composition root:

```typescript
// entrypoints/http/server.ts

import { Layer } from "effect"
import { HttpServer } from "@effect/platform"

// ========== SECONDARY SIDE (What we depend on) ==========
const SecondaryAdaptersLive = Layer.mergeAll(
  TaskRepositoryPostgresLive,    // Database
  EmailServiceSmtpLive,           // External API
  PaymentGatewayStripeLive,       // External API
  CacheRedisLive                  // Cache
)

// ========== APPLICATION CORE (Business logic) ==========
const ApplicationCoreLive = Layer.mergeAll(
  CompleteTaskUseCase.Default,
  CreateOrderUseCase.Default,
  GetUserProfileUseCase.Default
).pipe(
  // Provide secondary adapters to use cases
  Layer.provide(SecondaryAdaptersLive)
)

// ========== PRIMARY SIDE (Entry points) ==========
const PrimaryAdaptersLive = Layer.mergeAll(
  TaskApi.Live,          // HTTP endpoints
  OrderApi.Live,         // HTTP endpoints
  UserApi.Live           // HTTP endpoints
).pipe(
  // Provide application core to adapters
  Layer.provide(ApplicationCoreLive)
)

// Final server with all layers composed
const ServerLive = HttpServer.layer(PrimaryAdaptersLive)

// Single provide at the edge
const runnable = HttpServer.serve.pipe(
  Effect.provide(ServerLive)
)

// Run
Effect.runPromise(runnable)
```

#### 4.2.2 Environment-Specific Wiring

Different environments use different adapter implementations:

```typescript
// entrypoints/http/server.ts

// Production configuration
const ProductionLayer = Layer.mergeAll(
  TaskRepositoryPostgresLive,    // Real database
  EmailServiceSmtpLive,           // Real email
  PaymentGatewayStripeLive        // Real payment
)

// Development configuration
const DevelopmentLayer = Layer.mergeAll(
  TaskRepositoryMemoryLive,       // In-memory
  EmailServiceFakeLive,            // Fake email (logs)
  PaymentGatewayMockLive          // Mock payment
)

// Test configuration
const TestLayer = Layer.mergeAll(
  TaskRepositoryMemoryLive,       // In-memory
  EmailServiceFakeLive,            // Fake email
  PaymentGatewayMockLive          // Mock payment
)

// Select based on environment
const InfrastructureLayer = 
  process.env.NODE_ENV === "production" ? ProductionLayer :
  process.env.NODE_ENV === "test" ? TestLayer :
  DevelopmentLayer

// Compose with application layer
const AppLayer = Layer.mergeAll(
  CompleteTaskUseCase.Default,
  CreateOrderUseCase.Default
).pipe(
  Layer.provide(InfrastructureLayer)
)
```

#### 4.2.3 Single Effect.provide Call

**Critical Rule**: Only call `Effect.provide` once at the application edge:

```typescript
// ✅ CORRECT: Single provide
const MainLayer = Layer.mergeAll(
  DatabaseLive,
  EmailServiceLive,
  LoggerLive,
  UserServiceLive
)

const program = myBusinessLogic.pipe(
  Effect.provide(MainLayer)  // Single provide
)

Effect.runPromise(program)
```

```typescript
// ❌ WRONG: Multiple provides
const program = myBusinessLogic
  .pipe(Effect.provide(DatabaseLive))      // ❌ Creates scope 1
  .pipe(Effect.provide(EmailServiceLive))  // ❌ Creates scope 2
  .pipe(Effect.provide(LoggerLive))        // ❌ Creates scope 3

// Each provide creates a NEW scope with its own MemoMap
// Services aren't shared - defeats memoization!
```

#### 4.2.4 Top-Level Error Handling

Handle uncaught errors at the composition root:

```typescript
// entrypoints/http/server.ts

const runnable = HttpServer.serve.pipe(
  Effect.provide(ServerLive),
  // Top-level error handling
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      yield* Effect.logError(`Unhandled error: ${error}`)
      
      // Graceful shutdown
      yield* shutdownGracefully()
      
      // Exit with error code
      return yield* Effect.fail(new FatalError({ cause: error }))
    })
  ),
  // Final cleanup
  Effect.ensuring(
    Effect.logInfo("Application shutdown complete")
  )
)

Effect.runPromise(runnable)
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })
```

---

## 5. Composition Layer

### 5.1 Layer Composition Strategies

The composition layer is responsible for assembling different configurations of layers for different environments.

#### 5.1.1 Development Configurations

Development layers prioritize fast feedback and easy debugging:

```typescript
// composition/layers.development.ts

import { Layer } from "effect"

export const DevelopmentInfrastructure = Layer.mergeAll(
  // Fast in-memory implementations
  TaskRepositoryMemoryLive,
  OrderRepositoryMemoryLive,
  
  // Console logging instead of external services
  EmailServiceConsoleLive,
  PaymentGatewayMockLive,
  
  // Local file storage
  FileStorageLocalLive,
  
  // Simple in-memory cache
  CacheMemoryLive,
  
  // Verbose logging
  LoggerConsoleLive.pipe(
    Layer.provide(Layer.succeed(LogLevel, LogLevel.Debug))
  )
)

export const DevelopmentApplication = Layer.mergeAll(
  CompleteTaskUseCase.Default,
  CreateOrderUseCase.Default,
  ProcessCheckoutUseCase.Default
).pipe(
  Layer.provide(DevelopmentInfrastructure)
)

export const DevelopmentLayer = Layer.mergeAll(
  TaskApi.Live,
  OrderApi.Live
).pipe(
  Layer.provide(DevelopmentApplication)
)
```

#### 5.1.2 Testing Configurations

Testing layers use fast, deterministic implementations:

```typescript
// composition/layers.testing.ts

export const TestInfrastructure = Layer.mergeAll(
  // All in-memory for speed and isolation
  TaskRepositoryMemoryLive,
  OrderRepositoryMemoryLive,
  UserRepositoryMemoryLive,
  
  // Fakes that can be inspected
  EmailServiceFakeLive,
  PaymentGatewayFakeLive,
  
  // No-op implementations
  LoggerSilentLive,
  
  // Deterministic time for testing
  ClockTestLive
)

export const TestApplication = Layer.mergeAll(
  CompleteTaskUseCase.Default,
  CreateOrderUseCase.Default,
  ProcessCheckoutUseCase.Default
).pipe(
  Layer.provide(TestInfrastructure)
)

// For integration tests
export const TestLayer = TestApplication

// For E2E tests with HTTP
export const TestLayerWithHttp = Layer.mergeAll(
  TaskApi.Live,
  OrderApi.Live
).pipe(
  Layer.provide(TestApplication)
)
```

#### 5.1.3 Production Configurations

Production layers use real implementations with proper resource management:

```typescript
// composition/layers.production.ts

export const ProductionInfrastructure = Layer.mergeAll(
  // Real database with connection pooling
  TaskRepositoryPostgresLive,
  OrderRepositoryPostgresLive,
  UserRepositoryPostgresLive,
  
  // Real external services
  EmailServiceSmtpLive,
  PaymentGatewayStripeLive,
  
  // Cloud storage
  FileStorageS3Live,
  
  // Distributed cache
  CacheRedisLive,
  
  // Structured logging
  LoggerProductionLive.pipe(
    Layer.provide(Layer.succeed(LogLevel, LogLevel.Info))
  ),
  
  // Metrics and monitoring
  MetricsPrometheusLive,
  TracingDatadogLive
)

export const ProductionApplication = Layer.mergeAll(
  CompleteTaskUseCase.Default,
  CreateOrderUseCase.Default,
  ProcessCheckoutUseCase.Default
).pipe(
  Layer.provide(ProductionInfrastructure)
)

export const ProductionLayer = Layer.mergeAll(
  TaskApi.Live,
  OrderApi.Live,
  UserApi.Live
).pipe(
  Layer.provide(ProductionApplication)
)
```

#### 5.1.4 Environment-Specific Layer Selection

Select the appropriate layer based on environment:

```typescript
// composition/index.ts

import { Layer } from "effect"
import { DevelopmentLayer } from "./layers.development"
import { TestLayer } from "./layers.testing"
import { ProductionLayer } from "./layers.production"

export const getApplicationLayer = (): Layer.Layer<
  TaskApi | OrderApi | UserApi,
  never,
  never
> => {
  const env = process.env.NODE_ENV || "development"
  
  switch (env) {
    case "production":
      return ProductionLayer
    case "test":
      return TestLayer
    case "development":
    default:
      return DevelopmentLayer
  }
}

// Usage in main.ts
const ApplicationLayer = getApplicationLayer()

const program = HttpServer.serve.pipe(
  Effect.provide(ApplicationLayer)
)
```

**Benefits of This Approach**:
- Single line to swap entire infrastructure
- Same business logic, different implementations
- Easy to add new environments (staging, preview, etc.)
- Type-safe configuration management
- No environment-specific code in business logic
