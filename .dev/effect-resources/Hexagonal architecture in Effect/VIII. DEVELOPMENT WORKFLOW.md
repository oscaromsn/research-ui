---
modified: 2025-11-04T05:18:29-03:00
---
# VIII. DEVELOPMENT WORKFLOW

## A. Contract-Driven TDD Workflow

Contract-Driven TDD is a development workflow that starts with defining contracts (ports) before any implementation. This ensures all components are testable from the start and maintain clean architectural boundaries.

### 1. Phase 1a: Define Domain

#### 1.1 Create Domain Models (Schema.Class)

Start by defining the core business entities using Effect's Schema system:

**Workflow**:
1. Identify core domain concepts
2. Define entities with Schema.Class
3. Add business methods
4. Create branded types for IDs

**Example - Order Domain**:

```typescript
// domain/models/Order.model.ts
import { Schema } from "@effect/schema"
import { Brand } from "effect"

// Step 1: Define branded ID types
export type OrderId = string & Brand.Brand<"OrderId">
export const OrderId = Brand.nominal<OrderId>()

export type UserId = string & Brand.Brand<"UserId">
export const UserId = Brand.nominal<UserId>()

// Step 2: Define value objects
export type Money = number & Brand.Brand<"Money">
export const Money = Brand.refined<Money>(
  (n) => n >= 0,
  (n) => Brand.error(`Money cannot be negative: ${n}`)
)

export namespace Money {
  export const zero: Money = Money(0)
  export const add = (a: Money, b: Money): Money => Money(a + b)
  export const multiply = (m: Money, factor: number): Money => Money(m * factor)
}

// Step 3: Define order status
export const OrderStatus = Schema.Literal(
  "pending",
  "confirmed",
  "paid",
  "shipped",
  "delivered",
  "cancelled"
)
export type OrderStatus = Schema.Schema.Type<typeof OrderStatus>

// Step 4: Define order item
export class OrderItem extends Schema.Class<OrderItem>("OrderItem")({
  sku: Schema.String.pipe(Schema.minLength(1)),
  name: Schema.String,
  quantity: Schema.Number.pipe(Schema.int, Schema.positive),
  price: Schema.Number.pipe(Schema.nonNegative),
  subtotal: Schema.Number.pipe(Schema.nonNegative)
}) {
  // Domain method: Validate item
  isValid(): boolean {
    return this.subtotal === this.price * this.quantity
  }
}

// Step 5: Define main entity with business methods
export class Order extends Schema.Class<Order>("Order")({
  id: Schema.String.pipe(Schema.brand("OrderId")),
  userId: Schema.String.pipe(Schema.brand("UserId")),
  items: Schema.Array(OrderItem).pipe(Schema.minItems(1)),
  totalAmount: Schema.Number.pipe(Schema.nonNegative),
  status: OrderStatus,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.optional(Schema.DateTimeUtc)
}) {
  // Business method: Calculate total
  calculateTotal(): Money {
    return this.items.reduce(
      (sum, item) => Money.add(sum, Money(item.subtotal)),
      Money.zero
    )
  }
  
  // Business rule: Can order be confirmed?
  canBeConfirmed(): boolean {
    return this.status === "pending" && this.items.length > 0
  }
  
  // State transition: Confirm order
  confirm(): Order {
    if (!this.canBeConfirmed()) {
      throw new Error("Cannot confirm order in current state")
    }
    
    return new Order({
      ...this,
      status: "confirmed",
      updatedAt: new Date()
    })
  }
  
  // Business rule: Can order be cancelled?
  canBeCancelled(): boolean {
    return this.status === "pending" || this.status === "confirmed"
  }
  
  // State transition: Cancel order
  cancel(): Order {
    if (!this.canBeCancelled()) {
      throw new Error(`Cannot cancel order in ${this.status} status`)
    }
    
    return new Order({
      ...this,
      status: "cancelled",
      updatedAt: new Date()
    })
  }
}
```

---

#### 1.2 Define Domain Errors (Data.TaggedError)

Create domain-specific errors with rich context:

```typescript
// domain/errors/OrderErrors.ts
import { Data } from "effect"

// Validation error
export class OrderValidationError extends Data.TaggedError("OrderValidationError")<{
  readonly reason: string
  readonly field?: string
}> {}

// Not found error
export class OrderNotFoundError extends Data.TaggedError("OrderNotFoundError")<{
  readonly orderId: OrderId
}> {}

// Invalid state transition error
export class InvalidOrderTransitionError extends Data.TaggedError("InvalidOrderTransition")<{
  readonly orderId: OrderId
  readonly from: OrderStatus
  readonly to: OrderStatus
}> {}

// Business rule violation
export class InsufficientInventoryError extends Data.TaggedError("InsufficientInventory")<{
  readonly items: ReadonlyArray<{
    readonly sku: string
    readonly requested: number
    readonly available: number
  }>
}> {}

// Grouped errors
export type OrderError = 
  | OrderValidationError
  | OrderNotFoundError
  | InvalidOrderTransitionError
  | InsufficientInventoryError
```

---

#### 1.3 Write Pure Business Rules

Extract pure business logic into separate functions:

```typescript
// domain/rules/OrderRules.ts

/**
 * Pure business rules - no Effect, no I/O
 */

// Calculate shipping cost based on order value and destination
export const calculateShippingCost = (
  order: Order,
  destination: Address
): Money => {
  const baseRate = order.totalAmount > 500 ? Money(0) : Money(10)
  const distanceFactor = calculateDistance(destination) / 100
  return Money.multiply(baseRate, distanceFactor)
}

// Check if order qualifies for express shipping
export const qualifiesForExpressShipping = (order: Order): boolean =>
  order.totalAmount > 500 || order.items.some(item => item.isFragile)

// Calculate discount based on order value
export const calculateDiscount = (order: Order): Money => {
  if (order.totalAmount > 1000) return Money.multiply(Money(order.totalAmount), 0.15)
  if (order.totalAmount > 500) return Money.multiply(Money(order.totalAmount), 0.10)
  if (order.items.length > 10) return Money.multiply(Money(order.totalAmount), 0.05)
  return Money.zero
}

// Validate order state transition
export const isValidTransition = (
  from: OrderStatus,
  to: OrderStatus
): boolean => {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["paid", "cancelled"],
    paid: ["shipped"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: []
  }
  
  return validTransitions[from]?.includes(to) ?? false
}

// Helper: Calculate distance (simplified)
const calculateDistance = (destination: Address): number => {
  // Simplified distance calculation
  return destination.isInternational ? 1000 : 100
}
```

---

#### 1.4 Unit Test Domain Logic

Test pure domain logic with no dependencies:

```typescript
// domain/models/Order.model.unit.test.ts
import { describe, it, expect } from "@effect/vitest"
import { Order, OrderItem, OrderId, UserId, Money } from "./Order.model"

describe("Order - Domain Unit Tests", () => {
  describe("calculateTotal", () => {
    it("should calculate total for single item", () => {
      const order = new Order({
        id: OrderId.make("order-1"),
        userId: UserId.make("user-1"),
        items: [
          new OrderItem({
            sku: "ABC",
            name: "Product A",
            quantity: 2,
            price: 100,
            subtotal: 200
          })
        ],
        totalAmount: 200,
        status: "pending",
        createdAt: new Date()
      })
      
      const total = order.calculateTotal()
      expect(Money.toNumber(total)).toBe(200)
    })
    
    it("should calculate total for multiple items", () => {
      const order = new Order({
        id: OrderId.make("order-1"),
        userId: UserId.make("user-1"),
        items: [
          new OrderItem({ sku: "ABC", name: "A", quantity: 2, price: 100, subtotal: 200 }),
          new OrderItem({ sku: "DEF", name: "B", quantity: 3, price: 50, subtotal: 150 })
        ],
        totalAmount: 350,
        status: "pending",
        createdAt: new Date()
      })
      
      const total = order.calculateTotal()
      expect(Money.toNumber(total)).toBe(350)
    })
  })
  
  describe("confirm", () => {
    it("should confirm pending order", () => {
      const order = new Order({
        id: OrderId.make("order-1"),
        userId: UserId.make("user-1"),
        items: [createTestItem()],
        totalAmount: 100,
        status: "pending",
        createdAt: new Date()
      })
      
      const confirmed = order.confirm()
      
      expect(confirmed.status).toBe("confirmed")
      expect(confirmed.id).toBe(order.id)
    })
    
    it("should not confirm empty order", () => {
      const order = new Order({
        id: OrderId.make("order-1"),
        userId: UserId.make("user-1"),
        items: [],
        totalAmount: 0,
        status: "pending",
        createdAt: new Date()
      })
      
      expect(() => order.confirm()).toThrow("Cannot confirm order")
    })
    
    it("should not confirm already confirmed order", () => {
      const order = new Order({
        id: OrderId.make("order-1"),
        userId: UserId.make("user-1"),
        items: [createTestItem()],
        totalAmount: 100,
        status: "confirmed",
        createdAt: new Date()
      })
      
      expect(() => order.confirm()).toThrow("Cannot confirm order")
    })
  })
  
  describe("cancel", () => {
    it("should cancel pending order", () => {
      const order = new Order({
        id: OrderId.make("order-1"),
        userId: UserId.make("user-1"),
        items: [createTestItem()],
        totalAmount: 100,
        status: "pending",
        createdAt: new Date()
      })
      
      const cancelled = order.cancel()
      expect(cancelled.status).toBe("cancelled")
    })
    
    it("should not cancel shipped order", () => {
      const order = new Order({
        id: OrderId.make("order-1"),
        userId: UserId.make("user-1"),
        items: [createTestItem()],
        totalAmount: 100,
        status: "shipped",
        createdAt: new Date()
      })
      
      expect(() => order.cancel()).toThrow("Cannot cancel order")
    })
  })
})
```

```typescript
// domain/rules/OrderRules.unit.test.ts
import { describe, it, expect } from "@effect/vitest"
import { calculateDiscount, calculateShippingCost, isValidTransition } from "./OrderRules"

describe("OrderRules - Unit Tests", () => {
  describe("calculateDiscount", () => {
    it("should apply 15% discount for orders over $1000", () => {
      const order = createOrder({ totalAmount: 1500 })
      const discount = calculateDiscount(order)
      expect(Money.toNumber(discount)).toBe(225) // 15% of 1500
    })
    
    it("should apply 10% discount for orders over $500", () => {
      const order = createOrder({ totalAmount: 750 })
      const discount = calculateDiscount(order)
      expect(Money.toNumber(discount)).toBe(75) // 10% of 750
    })
    
    it("should apply no discount for small orders", () => {
      const order = createOrder({ totalAmount: 100 })
      const discount = calculateDiscount(order)
      expect(Money.toNumber(discount)).toBe(0)
    })
  })
  
  describe("isValidTransition", () => {
    it("should allow pending → confirmed", () => {
      expect(isValidTransition("pending", "confirmed")).toBe(true)
    })
    
    it("should allow confirmed → paid", () => {
      expect(isValidTransition("confirmed", "paid")).toBe(true)
    })
    
    it("should not allow pending → shipped", () => {
      expect(isValidTransition("pending", "shipped")).toBe(false)
    })
    
    it("should not allow delivered → any state", () => {
      expect(isValidTransition("delivered", "pending")).toBe(false)
      expect(isValidTransition("delivered", "shipped")).toBe(false)
    })
  })
})
```

---

### 2. Phase 1b: Define Contracts (Ports)

#### 2.1 Define Primary Ports (Use Case Interfaces)

Primary ports define what the application offers:

```typescript
// application/ports/primary/OrderService/OrderService.port.ts
import { Effect, Context } from "effect"
import { Order, OrderId, UserId } from "../../../../domain/models/Order.model"
import { OrderError } from "../../../../domain/errors/OrderErrors"

/**
 * PRIMARY PORT: OrderService
 * 
 * Defines what the application offers for order management.
 * This is a CONTRACT ONLY - no implementation.
 * 
 * @layer Port (02-ports/primary)
 * @type Primary Port (Inbound)
 */
export interface OrderService {
  readonly createOrder: (
    userId: UserId,
    items: OrderItem[]
  ) => Effect.Effect<Order, OrderError>
  
  readonly getOrder: (
    id: OrderId
  ) => Effect.Effect<Order, OrderNotFoundError>
  
  readonly confirmOrder: (
    id: OrderId
  ) => Effect.Effect<Order, OrderError>
  
  readonly cancelOrder: (
    id: OrderId
  ) => Effect.Effect<Order, OrderError>
  
  readonly listOrders: (
    userId: UserId
  ) => Effect.Effect<Order[]>
}

export class OrderService extends Context.Tag("OrderService")<
  OrderService,
  OrderService
>() {}
```

---

#### 2.2 Define Secondary Ports (Dependency Interfaces)

Secondary ports define what the application needs:

```typescript
// application/ports/secondary/OrderRepository/OrderRepository.port.ts
import { Effect, Context } from "effect"
import { Order, OrderId, UserId } from "../../../../domain/models/Order.model"

/**
 * SECONDARY PORT: OrderRepository
 * 
 * Defines persistence contract for orders.
 * This is a CONTRACT ONLY - no implementation.
 * 
 * @layer Port (02-ports/secondary)
 * @type Secondary Port (Outbound)
 */
export interface OrderRepository {
  readonly save: (
    order: Order
  ) => Effect.Effect<void, DatabaseError>
  
  readonly findById: (
    id: OrderId
  ) => Effect.Effect<Order, OrderNotFoundError | DatabaseError>
  
  readonly findByUser: (
    userId: UserId
  ) => Effect.Effect<Order[], DatabaseError>
  
  readonly delete: (
    id: OrderId
  ) => Effect.Effect<void, DatabaseError>
}

export class OrderRepository extends Context.Tag("OrderRepository")<
  OrderRepository,
  OrderRepository
>() {}
```

```typescript
// application/ports/secondary/PaymentGateway/PaymentGateway.port.ts

/**
 * SECONDARY PORT: PaymentGateway
 * 
 * Defines payment processing contract.
 */
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

---

#### 2.3 Create Context.Tags for Ports

Tags are created alongside port interfaces (shown above). The pattern is:

```typescript
// Port interface
export interface PortName {
  // Methods
}

// Context.Tag for dependency injection
export class PortName extends Context.Tag("PortName")<
  PortName,
  PortName
>() {}
```

---

#### 2.4 Write Contract Tests with Fakes

Write tests that verify the contract, not implementation:

```typescript
// application/ports/primary/OrderService/OrderService.port.contract.test.ts
import { Effect, Exit, Cause, Option } from "effect"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { OrderService } from "./OrderService.port"
import { OrderServiceFake } from "./OrderService.port.fake"

/**
 * CONTRACT TESTS: OrderService
 * 
 * These tests define the contract that ALL implementations must satisfy.
 * They run against the FAKE to ensure the contract is testable.
 * 
 * @layer Port (02-ports/primary)
 * @test-type Contract
 * @test-double OrderServiceFake
 */
describe("OrderService - Contract Tests", () => {
  it.effect("MUST create order with valid items", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      const order = yield* service.createOrder(
        UserId.make("user-1"),
        [createTestItem({ sku: "ABC", quantity: 2 })]
      )
      
      assert.isDefined(order.id)
      assert.strictEqual(order.status, "pending")
      assert.strictEqual(order.items.length, 1)
    }).pipe(Effect.provide(OrderServiceFake))
  )
  
  it.effect("MUST fail when creating order with empty items", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      const exit = yield* Effect.exit(
        service.createOrder(UserId.make("user-1"), [])
      )
      
      assert.isTrue(Exit.isFailure(exit))
      
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause)
        assert.isTrue(Option.isSome(error))
        assert.instanceOf(Option.getOrThrow(error), OrderValidationError)
      }
    }).pipe(Effect.provide(OrderServiceFake))
  )
  
  it.effect("MUST retrieve order by ID", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      // Create order first
      const created = yield* service.createOrder(
        UserId.make("user-1"),
        [createTestItem()]
      )
      
      // Retrieve it
      const retrieved = yield* service.getOrder(created.id)
      
      assert.deepEqual(retrieved, created)
    }).pipe(Effect.provide(OrderServiceFake))
  )
  
  it.effect("MUST fail when order not found", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      const exit = yield* Effect.exit(
        service.getOrder(OrderId.make("non-existent"))
      )
      
      assert.isTrue(Exit.isFailure(exit))
      
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause)
        assert.instanceOf(Option.getOrThrow(error), OrderNotFoundError)
      }
    }).pipe(Effect.provide(OrderServiceFake))
  )
  
  it.effect("MUST confirm pending order", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      const order = yield* service.createOrder(
        UserId.make("user-1"),
        [createTestItem()]
      )
      
      const confirmed = yield* service.confirmOrder(order.id)
      
      assert.strictEqual(confirmed.status, "confirmed")
      assert.strictEqual(confirmed.id, order.id)
    }).pipe(Effect.provide(OrderServiceFake))
  )
  
  it.effect("MUST NOT confirm already confirmed order", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      const order = yield* service.createOrder(
        UserId.make("user-1"),
        [createTestItem()]
      )
      
      yield* service.confirmOrder(order.id)
      
      // Try to confirm again
      const exit = yield* Effect.exit(service.confirmOrder(order.id))
      
      assert.isTrue(Exit.isFailure(exit))
    }).pipe(Effect.provide(OrderServiceFake))
  )
})
```

---

### 3. Phase 2: Test Contracts

#### 3.1 Implement Port Fakes (In-Memory)

Create fully-functional in-memory implementations:

```typescript
// application/ports/primary/OrderService/OrderService.port.fake.ts
import { Effect, Layer, Ref } from "effect"
import { OrderService } from "./OrderService.port"
import { Order, OrderId, UserId } from "../../../../domain/models/Order.model"

/**
 * FAKE: OrderService
 * 
 * Fully-functional in-memory implementation for testing.
 * MUST pass all contract tests.
 * 
 * @layer Port (02-ports/primary)
 * @type Fake (Test Double)
 * @purpose Contract testing, fast integration tests
 */
export const OrderServiceFake = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    // State management with Ref
    const orders = yield* Ref.make(new Map<OrderId, Order>())
    const callLog = yield* Ref.make<Array<{ method: string; args: unknown[] }>>([])
    
    const logCall = (method: string, ...args: unknown[]) =>
      Ref.update(callLog, (log) => [...log, { method, args }])
    
    return OrderService.of({
      createOrder: (userId, items) =>
        Effect.gen(function* () {
          yield* logCall("createOrder", userId, items)
          
          // Validation
          if (items.length === 0) {
            return yield* Effect.fail(
              new OrderValidationError({ reason: "Empty items" })
            )
          }
          
          // Create order
          const order = new Order({
            id: OrderId.make(crypto.randomUUID()),
            userId,
            items,
            totalAmount: items.reduce((sum, i) => sum + i.subtotal, 0),
            status: "pending",
            createdAt: new Date()
          })
          
          // Save
          yield* Ref.update(orders, (map) => new Map(map).set(order.id, order))
          
          return order
        }),
      
      getOrder: (id) =>
        Effect.gen(function* () {
          yield* logCall("getOrder", id)
          
          const map = yield* Ref.get(orders)
          const order = map.get(id)
          
          if (!order) {
            return yield* Effect.fail(new OrderNotFoundError({ orderId: id }))
          }
          
          return order
        }),
      
      confirmOrder: (id) =>
        Effect.gen(function* () {
          yield* logCall("confirmOrder", id)
          
          const map = yield* Ref.get(orders)
          const order = map.get(id)
          
          if (!order) {
            return yield* Effect.fail(new OrderNotFoundError({ orderId: id }))
          }
          
          if (!order.canBeConfirmed()) {
            return yield* Effect.fail(
              new InvalidOrderTransitionError({
                orderId: id,
                from: order.status,
                to: "confirmed"
              })
            )
          }
          
          const confirmed = order.confirm()
          yield* Ref.update(orders, (m) => new Map(m).set(id, confirmed))
          
          return confirmed
        }),
      
      cancelOrder: (id) =>
        Effect.gen(function* () {
          yield* logCall("cancelOrder", id)
          
          const map = yield* Ref.get(orders)
          const order = map.get(id)
          
          if (!order) {
            return yield* Effect.fail(new OrderNotFoundError({ orderId: id }))
          }
          
          if (!order.canBeCancelled()) {
            return yield* Effect.fail(
              new InvalidOrderTransitionError({
                orderId: id,
                from: order.status,
                to: "cancelled"
              })
            )
          }
          
          const cancelled = order.cancel()
          yield* Ref.update(orders, (m) => new Map(m).set(id, cancelled))
          
          return cancelled
        }),
      
      listOrders: (userId) =>
        Effect.gen(function* () {
          yield* logCall("listOrders", userId)
          
          const map = yield* Ref.get(orders)
          return Array.from(map.values()).filter(o => o.userId === userId)
        })
    })
  })
)

// Test helpers
export const OrderServiceFakeHelpers = {
  getCallLog: () => Effect.flatMap(callLog, Ref.get),
  getOrders: () => Effect.flatMap(orders, Ref.get),
  clear: () => Effect.all([
    Ref.set(orders, new Map()),
    Ref.set(callLog, [])
  ])
}
```

---

#### 3.2 Write Contract Tests

Run contract tests against fakes (shown in Phase 1b, step 2.4).

---

#### 3.3 Verify Interface Completeness

Ensure the contract covers all requirements:

```typescript
// Checklist for contract tests:

// ✅ Happy path scenarios
it.effect("MUST create order with valid data", ...)
it.effect("MUST retrieve existing order", ...)
it.effect("MUST update order status", ...)

// ✅ Error scenarios
it.effect("MUST fail with appropriate error when not found", ...)
it.effect("MUST fail with validation error for invalid data", ...)
it.effect("MUST fail for invalid state transitions", ...)

// ✅ Edge cases
it.effect("MUST handle empty results", ...)
it.effect("MUST handle boundary values", ...)

// ✅ Business rules
it.effect("MUST enforce business constraints", ...)
it.effect("MUST validate state transitions", ...)
```

---

#### 3.4 Ensure Fakes Pass All Tests

**Verification Steps**:

1. Run contract tests against fake
2. All tests must pass
3. If test fails, fix fake or clarify contract
4. Iterate until all pass

```bash
# Run contract tests
npm test -- OrderService.port.contract.test.ts

# All tests should pass:
# ✓ OrderService - Contract Tests (10 tests)
#   ✓ MUST create order with valid items
#   ✓ MUST fail when creating order with empty items
#   ✓ MUST retrieve order by ID
#   ✓ MUST fail when order not found
#   ✓ MUST confirm pending order
#   ✓ MUST NOT confirm already confirmed order
#   ✓ MUST cancel pending order
#   ✓ MUST NOT cancel shipped order
#   ✓ MUST list orders for user
#   ✓ MUST return empty list for user with no orders
```

---

### 4. Phase 3a: Implement Application Logic

#### 4.1 Implement Primary Ports (Use Cases)

Create the real service implementation:

```typescript
// application/services/OrderService/OrderService.service.ts
import { Effect } from "effect"
import { OrderService } from "../../ports/primary/OrderService/OrderService.port"
import { OrderRepository } from "../../ports/secondary/OrderRepository/OrderRepository.port"
import { PaymentGateway } from "../../ports/secondary/PaymentGateway/PaymentGateway.port"
import { EmailService } from "../../ports/secondary/EmailService/EmailService.port"
import { EventBus } from "../../ports/secondary/EventBus/EventBus.port"

/**
 * ORDER SERVICE - Live Implementation
 * 
 * Implements the primary port using secondary ports.
 * 
 * @layer Application (03-application)
 * @implements OrderService.port
 */
export class OrderServiceLive extends Effect.Service<OrderService>()(
  "OrderService",
  {
    // Declare dependencies explicitly
    dependencies: [
      OrderRepository.Default,
      PaymentGateway.Default,
      EmailService.Default,
      EventBus.Default
    ],
    
    // Implementation
    effect: Effect.gen(function* () {
      // Acquire dependencies during construction
      const orders = yield* OrderRepository
      const payment = yield* PaymentGateway
      const email = yield* EmailService
      const events = yield* EventBus
      
      // Return service interface
      return {
        createOrder: (userId, items) =>
          Effect.gen(function* () {
            // Validation
            if (items.length === 0) {
              return yield* Effect.fail(
                new OrderValidationError({ reason: "Empty items" })
              )
            }
            
            // Create domain entity
            const order = new Order({
              id: OrderId.make(crypto.randomUUID()),
              userId,
              items,
              totalAmount: items.reduce((sum, i) => sum + i.subtotal, 0),
              status: "pending",
              createdAt: new Date()
            })
            
            // Persist
            yield* orders.save(order)
            
            // Publish event
            yield* events.publish({
              _tag: "OrderCreated",
              orderId: order.id,
              userId,
              timestamp: new Date()
            })
            
            return order
          }),
        
        getOrder: (id) =>
          orders.findById(id),
        
        confirmOrder: (id) =>
          Effect.gen(function* () {
            // Load order
            const order = yield* orders.findById(id)
            
            // Validate state transition
            if (!order.canBeConfirmed()) {
              return yield* Effect.fail(
                new InvalidOrderTransitionError({
                  orderId: id,
                  from: order.status,
                  to: "confirmed"
                })
              )
            }
            
            // Process payment
            const receipt = yield* payment.charge(
              Money(order.totalAmount),
              "payment-token"
            )
            
            // Confirm order
            const confirmed = order.confirm()
            yield* orders.save(confirmed)
            
            // Send confirmation email
            yield* email.sendOrderConfirmation(confirmed)
            
            // Publish event
            yield* events.publish({
              _tag: "OrderConfirmed",
              orderId: id,
              timestamp: new Date()
            })
            
            return confirmed
          }),
        
        cancelOrder: (id) =>
          Effect.gen(function* () {
            const order = yield* orders.findById(id)
            
            if (!order.canBeCancelled()) {
              return yield* Effect.fail(
                new InvalidOrderTransitionError({
                  orderId: id,
                  from: order.status,
                  to: "cancelled"
                })
              )
            }
            
            // Refund if payment was processed
            if (order.status === "paid") {
              yield* payment.refund(order.id)
            }
            
            const cancelled = order.cancel()
            yield* orders.save(cancelled)
            
            yield* events.publish({
              _tag: "OrderCancelled",
              orderId: id,
              timestamp: new Date()
            })
            
            return cancelled
          }),
        
        listOrders: (userId) =>
          orders.findByUser(userId)
      }
    })
  }
) {}
```

---

#### 4.2 Orchestrate Secondary Ports

The service implementation above shows orchestration:

1. **Load data** via repository
2. **Apply business rules** from domain
3. **Call external services** via gateways
4. **Persist changes** via repository
5. **Publish events** via event bus

---

#### 4.3 Handle Errors and Transactions

Add error handling and transaction boundaries:

```typescript
export class OrderServiceLive extends Effect.Service<OrderService>()(
  "OrderService",
  {
    dependencies: [
      OrderRepository.Default,
      PaymentGateway.Default,
      Database.Default  // For transactions
    ],
    
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      const payment = yield* PaymentGateway
      const db = yield* Database
      
      return {
        confirmOrder: (id) =>
          // Wrap in transaction
          db.transaction(
            Effect.gen(function* () {
              const order = yield* orders.findById(id)
              
              // Process payment with retry
              const receipt = yield* payment.charge(
                Money(order.totalAmount),
                "token"
              ).pipe(
                Effect.retry(Schedule.exponential("100 millis")),
                Effect.timeout("30 seconds")
              )
              
              const confirmed = order.confirm()
              yield* orders.save(confirmed)
              
              // If any step fails, transaction rolls back
              return confirmed
            })
          ).pipe(
            // Handle specific errors
            Effect.catchTag("PaymentError", (error) =>
              Effect.gen(function* () {
                yield* Effect.logError(`Payment failed: ${error.message}`)
                return yield* Effect.fail(
                  new OrderValidationError({
                    reason: `Payment failed: ${error.message}`
                  })
                )
              })
            )
          )
      }
    })
  }
) {}
```

---

#### 4.4 Integration Test with Fakes

Test the service with fast in-memory dependencies:

```typescript
// application/services/OrderService/OrderService.service.integration.test.ts
import { Effect, Layer } from "effect"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { OrderServiceLive } from "./OrderService.service"
import { OrderRepositoryMemoryLive } from "../../../infrastructure/persistence/OrderRepository.memory"
import { PaymentGatewayMockLive } from "../../../infrastructure/external/PaymentGateway.mock"
import { EmailServiceFakeLive } from "../../../infrastructure/messaging/EmailService.fake"
import { EventBusFakeLive } from "../../../infrastructure/events/EventBus.fake"

// Test layer with fakes
const TestLayer = Layer.mergeAll(
  OrderServiceLive.Default,
  OrderRepositoryMemoryLive,
  PaymentGatewayMockLive,
  EmailServiceFakeLive,
  EventBusFakeLive
)

describe("OrderService - Integration Tests", () => {
  it.effect("should create and persist order", () =>
    Effect.gen(function* () {
      const orderService = yield* OrderService
      const orderRepo = yield* OrderRepository
      
      // Create order
      const order = yield* orderService.createOrder(
        UserId.make("user-1"),
        [createTestItem({ sku: "ABC", quantity: 2 })]
      )
      
      // Verify persisted
      const saved = yield* orderRepo.findById(order.id)
      assert.deepEqual(saved, order)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should process payment when confirming order", () =>
    Effect.gen(function* () {
      const orderService = yield* OrderService
      const paymentGateway = yield* PaymentGateway
      
      // Create order
      const order = yield* orderService.createOrder(
        UserId.make("user-1"),
        [createTestItem({ price: 100, quantity: 2 })]
      )
      
      // Confirm (processes payment)
      yield* orderService.confirmOrder(order.id)
      
      // Verify payment was charged
      const charges = yield* paymentGateway.getCharges()
      assert.strictEqual(charges.length, 1)
      assert.strictEqual(charges[0].amount, 200)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should send confirmation email", () =>
    Effect.gen(function* () {
      const orderService = yield* OrderService
      const emailService = yield* EmailService
      
      const order = yield* orderService.createOrder(
        UserId.make("user-1"),
        [createTestItem()]
      )
      
      yield* orderService.confirmOrder(order.id)
      
      const emails = yield* emailService.getSentEmails()
      assert.isTrue(
        emails.some(e => e.type === "order_confirmation" && e.orderId === order.id)
      )
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should publish events", () =>
    Effect.gen(function* () {
      const orderService = yield* OrderService
      const eventBus = yield* EventBus
      
      const order = yield* orderService.createOrder(
        UserId.make("user-1"),
        [createTestItem()]
      )
      
      const events = yield* eventBus.getPublishedEvents()
      assert.isTrue(
        events.some(e => e._tag === "OrderCreated" && e.orderId === order.id)
      )
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

### 5. Phase 3b: Implement Adapters

#### 5.1 Implement Secondary Adapters (Infrastructure)

Create real infrastructure implementations:

```typescript
// infrastructure/persistence/OrderRepository.postgres.ts
import { Effect, Layer } from "effect"
import { SqlClient } from "@effect/sql"
import { OrderRepository } from "../../application/ports/secondary/OrderRepository/OrderRepository.port"
import { Order, OrderId, UserId } from "../../domain/models/Order.model"

/**
 * POSTGRESQL ADAPTER: OrderRepository
 * 
 * Real database implementation.
 */
const makePostgresRepository = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  return OrderRepository.of({
    save: (order: Order) =>
      sql`
        INSERT INTO orders (id, user_id, items, total_amount, status, created_at, updated_at)
        VALUES (
          ${order.id},
          ${order.userId},
          ${JSON.stringify(order.items)},
          ${order.totalAmount},
          ${order.status},
          ${order.createdAt},
          ${order.updatedAt || null}
        )
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `.pipe(
        Effect.asVoid,
        Effect.mapError((e) => new DatabaseError({
          operation: "save",
          table: "orders",
          cause: e
        }))
      ),
    
    findById: (id: OrderId) =>
      sql<Order>`SELECT * FROM orders WHERE id = ${id}`.pipe(
        Effect.flatMap((rows) =>
          rows.length === 0
            ? Effect.fail(new OrderNotFoundError({ orderId: id }))
            : Effect.succeed(dbRowToOrder(rows[0]))
        ),
        Effect.mapError((e) =>
          e instanceof OrderNotFoundError
            ? e
            : new DatabaseError({ operation: "findById", cause: e })
        )
      ),
    
    findByUser: (userId: UserId) =>
      sql<Order[]>`SELECT * FROM orders WHERE user_id = ${userId}`.pipe(
        Effect.map((rows) => rows.map(dbRowToOrder)),
        Effect.mapError((e) => new DatabaseError({
          operation: "findByUser",
          cause: e
        }))
      ),
    
    delete: (id: OrderId) =>
      sql`DELETE FROM orders WHERE id = ${id}`.pipe(
        Effect.asVoid,
        Effect.mapError((e) => new DatabaseError({
          operation: "delete",
          cause: e
        }))
      )
  })
})

// Helper: Convert DB row to domain Order
const dbRowToOrder = (row: any): Order =>
  new Order({
    id: OrderId.make(row.id),
    userId: UserId.make(row.user_id),
    items: JSON.parse(row.items),
    totalAmount: row.total_amount,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  })

// Export layer with local dependencies
export const OrderRepositoryPostgresLive = Layer.effect(
  OrderRepository,
  makePostgresRepository
).pipe(
  // LOCAL DEPENDENCY ELIMINATION
  Layer.provide(SqlClient.layer({
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!
  }))
)

// Type: Layer<OrderRepository, never, never>
// ✅ Clean interface - SqlClient dependency hidden
```

---

#### 5.2 Local Dependency Elimination

Always provide dependencies within the adapter file:

```typescript
// ❌ BAD: Exposes SqlClient dependency
export const OrderRepositoryPostgresLive = Layer.effect(
  OrderRepository,
  makePostgresRepository
)
// Type: Layer<OrderRepository, never, SqlClient>
// Consumers must provide SqlClient

// ✅ GOOD: Dependencies provided locally
export const OrderRepositoryPostgresLive = Layer.effect(
  OrderRepository,
  makePostgresRepository
).pipe(
  Layer.provide(SqlClientLive)  // Provided HERE
)
// Type: Layer<OrderRepository, never, never>
// Consumers just get OrderRepository
```

---

#### 5.3 Adapter-Specific Tests

Test adapter behavior with real infrastructure:

```typescript
// infrastructure/persistence/OrderRepository.postgres.integration.test.ts
import { Effect, Layer } from "effect"
import { describe, it, beforeEach } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { OrderRepositoryPostgresLive } from "./OrderRepository.postgres"
import { TestDatabaseLayer } from "../../../test/TestDatabase"

const TestLayer = Layer.mergeAll(
  OrderRepositoryPostgresLive,
  TestDatabaseLayer  // Real test database
)

describe("OrderRepository Postgres - Integration Tests", () => {
  beforeEach.effect(() =>
    Effect.gen(function* () {
      const db = yield* TestDatabase
      yield* db.truncate("orders")
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should persist and retrieve order", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      
      const order = createTestOrder()
      yield* repo.save(order)
      
      const retrieved = yield* repo.findById(order.id)
      assert.deepEqual(retrieved, order)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should handle PostgreSQL-specific types", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      
      const order = createTestOrder({
        items: [{ sku: "ABC", metadata: { tags: ["urgent"] } }]
      })
      
      yield* repo.save(order)
      const retrieved = yield* repo.findById(order.id)
      
      // Verify JSON serialization worked
      assert.deepEqual(retrieved.items[0].metadata, order.items[0].metadata)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

#### 5.4 Integration Tests with Real Systems

Test against real databases, APIs, etc:

```typescript
// Use TestDatabaseLayer with real PostgreSQL
const TestLayer = Layer.mergeAll(
  OrderRepositoryPostgresLive,  // Real Postgres
  TestDatabaseLayer             // Test DB instance
)

describe("OrderRepository - Real Database Tests", () => {
  it.effect("should handle concurrent updates", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      
      const order = createTestOrder()
      yield* repo.save(order)
      
      // Concurrent updates
      yield* Effect.all([
        repo.save(new Order({ ...order, status: "confirmed" })),
        repo.save(new Order({ ...order, status: "paid" }))
      ], { concurrency: "unbounded" })
      
      // Verify final state
      const final = yield* repo.findById(order.id)
      assert.isTrue(["confirmed", "paid"].includes(final.status))
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

### 6. Phase 4: Compose Application

#### 6.1 Create Layer Compositions

Compose all layers into a cohesive application:

```typescript
// composition/layers.ts
import { Layer } from "effect"

// Step 1: Infrastructure layer (all secondary adapters)
const InfrastructureLayer = Layer.mergeAll(
  OrderRepositoryPostgresLive,
  PaymentGatewayStripeLive,
  EmailServiceSmtpLive,
  EventBusKafkaLive
)

// Step 2: Application layer (all services)
const ApplicationLayer = Layer.mergeAll(
  OrderServiceLive.Default
).pipe(
  Layer.provide(InfrastructureLayer)
)

// Step 3: API layer (all adapters)
const ApiLayer = Layer.mergeAll(
  OrderApiLive,
  UserApiLive
).pipe(
  Layer.provide(ApplicationLayer)
)

// Step 4: Final application layer
export const ProductionLayer = ApiLayer
```

---

#### 6.2 Single Effect.provide at Edge

**Critical Rule**: Only one `Effect.provide` call at the application edge:

```typescript
// main.ts
import { Effect } from "effect"
import { ProductionLayer } from "./composition/layers"
import { HttpServer } from "@effect/platform"

// Compose all layers
const MainLayer = Layer.mergeAll(
  ProductionLayer,
  HttpServerLive
)

// Single provide at the edge
const program = HttpServer.serve.pipe(
  Effect.provide(MainLayer)  // ✅ ONLY ONE provide call
)

// Run
Effect.runPromise(program)
```

---

#### 6.3 Environment-Specific Configurations

Create different layer configurations:

```typescript
// composition/layers.development.ts
export const DevelopmentLayer = Layer.mergeAll(
  OrderServiceLive.Default,
  OrderRepositoryMemoryLive,    // Fast in-memory
  PaymentGatewayMockLive,        // Mock payment
  EmailServiceConsoleLive        // Log to console
)

// composition/layers.testing.ts
export const TestingLayer = Layer.mergeAll(
  OrderServiceLive.Default,
  OrderRepositoryMemoryLive,
  PaymentGatewayMockLive,
  EmailServiceFakeLive,
  EventBusFakeLive
)

// composition/layers.production.ts
export const ProductionLayer = Layer.mergeAll(
  OrderServiceLive.Default,
  OrderRepositoryPostgresLive,   // Real database
  PaymentGatewayStripeLive,      // Real payment
  EmailServiceSmtpLive,           // Real email
  EventBusKafkaLive               // Real events
)

// Select based on environment
export const getApplicationLayer = () => {
  switch (process.env.NODE_ENV) {
    case "production":
      return ProductionLayer
    case "test":
      return TestingLayer
    default:
      return DevelopmentLayer
  }
}
```

---

#### 6.4 E2E Testing

Test the complete system through HTTP:

```typescript
// adapters/primary/http/OrderApi.http-adapter.system.test.ts
import { Effect, Layer } from "effect"
import { HttpClient } from "@effect/platform"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { TestingLayer } from "../../../composition/layers.testing"

const TestLayer = Layer.mergeAll(
  OrderApiLive,
  TestingLayer,
  HttpServerTestLayer
)

describe("Order API - E2E Tests", () => {
  it.effect("should complete full order workflow via HTTP", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      // 1. Create order
      const createResponse = yield* client.post("http://localhost:3000/orders", {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          items: [{ sku: "ABC", quantity: 2 }]
        })
      })
      
      assert.strictEqual(createResponse.status, 201)
      const { orderId } = yield* createResponse.json
      
      // 2. Get order
      const getResponse = yield* client.get(`http://localhost:3000/orders/${orderId}`)
      assert.strictEqual(getResponse.status, 200)
      
      const order = yield* getResponse.json
      assert.strictEqual(order.status, "pending")
      
      // 3. Confirm order
      const confirmResponse = yield* client.post(
        `http://localhost:3000/orders/${orderId}/confirm`
      )
      assert.strictEqual(confirmResponse.status, 200)
      
      // 4. Verify confirmation
      const finalGetResponse = yield* client.get(`http://localhost:3000/orders/${orderId}`)
      const confirmedOrder = yield* finalGetResponse.json
      assert.strictEqual(confirmedOrder.status, "confirmed")
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

## B. Iterative Refinement

### 1. Start Simple

#### 1.1 In-Memory Implementations First

Begin with fast, simple implementations:

**Phase 1: Minimal Working System**

```typescript
// Start with in-memory everything
const MinimalLayer = Layer.mergeAll(
  OrderServiceLive.Default,
  OrderRepositoryMemoryLive,    // In-memory
  PaymentGatewayMockLive,        // Mock
  EmailServiceFakeLive            // Fake
)

// Get the core workflow working first
const testWorkflow = Effect.gen(function* () {
  const orderService = yield* OrderService
  
  const order = yield* orderService.createOrder(
    UserId.make("user-1"),
    [createTestItem()]
  )
  
  yield* orderService.confirmOrder(order.id)
  
  console.log("✓ Core workflow works!")
})

Effect.runPromise(testWorkflow.pipe(Effect.provide(MinimalLayer)))
```

**Benefits**:
- Fast feedback loop
- No infrastructure setup needed
- Focus on business logic first
- Easy to iterate

---

#### 1.2 Basic Functionality

Get the happy path working before edge cases:

```typescript
// Iteration 1: Happy path only
export class OrderServiceLive extends Effect.Service<OrderService>()(
  "OrderService",
  {
    dependencies: [OrderRepository.Default],
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      
      return {
        // Start with minimal implementation
        createOrder: (userId, items) =>
          Effect.gen(function* () {
            const order = new Order({
              id: OrderId.make(crypto.randomUUID()),
              userId,
              items,
              totalAmount: items.reduce((sum, i) => sum + i.subtotal, 0),
              status: "pending",
              createdAt: new Date()
            })
            
            yield* orders.save(order)
            return order
          })
        
        // Add more methods as needed
      }
    })
  }
) {}

// Iteration 2: Add validation
// Iteration 3: Add error handling
// Iteration 4: Add events
// etc.
```

---

#### 1.3 Fast Iteration Cycle

Keep the development loop fast:

```bash
# Watch mode for instant feedback
npm run test:watch

# Run specific test during development
npm test -- OrderService.service.integration.test.ts

# Quick iteration cycle:
# 1. Write test (fails)
# 2. Implement feature (test passes)
# 3. Refactor
# 4. Repeat
```

---

#### 1.4 Prove Architecture

Verify the architecture works before adding complexity:

**Checkpoint Questions**:
- ✅ Can I swap implementations easily?
- ✅ Are tests fast?
- ✅ Is business logic isolated?
- ✅ Are boundaries clear?
- ✅ Can I test without infrastructure?

**Validation**:

```typescript
// Test 1: Can swap implementations?
const TestLayer1 = Layer.mergeAll(
  OrderServiceLive.Default,
  OrderRepositoryMemoryLive  // In-memory
)

const TestLayer2 = Layer.mergeAll(
  OrderServiceLive.Default,
  OrderRepositoryPostgresLive  // PostgreSQL
)

// Same test, different implementation
const test = Effect.gen(function* () {
  const orderService = yield* OrderService
  const order = yield* orderService.createOrder(userId, items)
  assert.isDefined(order.id)
})

// Both should pass
Effect.runPromise(test.pipe(Effect.provide(TestLayer1)))
Effect.runPromise(test.pipe(Effect.provide(TestLayer2)))
```

---

### 2. Add Complexity

#### 2.1 Real Implementations When Needed

Replace mocks with real implementations incrementally:

**Progression**:

```typescript
// Week 1: All in-memory
const Week1Layer = Layer.mergeAll(
  OrderServiceLive.Default,
  OrderRepositoryMemoryLive,
  PaymentGatewayMockLive,
  EmailServiceFakeLive
)

// Week 2: Add real database
const Week2Layer = Layer.mergeAll(
  OrderServiceLive.Default,
  OrderRepositoryPostgresLive,  // Real database added
  PaymentGatewayMockLive,
  EmailServiceFakeLive
)

// Week 3: Add real payment
const Week3Layer = Layer.mergeAll(
  OrderServiceLive.Default,
  OrderRepositoryPostgresLive,
  PaymentGatewayStripeLive,     // Real payment added
  EmailServiceFakeLive
)

// Week 4: Add real email
const Week4Layer = Layer.mergeAll(
  OrderServiceLive.Default,
  OrderRepositoryPostgresLive,
  PaymentGatewayStripeLive,
  EmailServiceSmtpLive           // Real email added
)
```

---

#### 2.2 Performance Optimizations

Add optimizations when needed, not before:

**Iteration 1: Simple Implementation**

```typescript
findByUser: (userId) =>
  sql<Order[]>`SELECT * FROM orders WHERE user_id = ${userId}`
```

**Iteration 2: Add Pagination**

```typescript
findByUser: (userId, page = 1, size = 20) =>
  sql<Order[]>`
    SELECT * FROM orders 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${size} OFFSET ${(page - 1) * size}
  `
```

**Iteration 3: Add Caching**

```typescript
findByUser: (userId, page = 1, size = 20) =>
  Effect.gen(function* () {
    const cacheKey = `orders:${userId}:${page}:${size}`
    
    // Check cache first
    const cached = yield* cache.get(cacheKey)
    if (Option.isSome(cached)) {
      return cached.value
    }
    
    // Query database
    const orders = yield* sql<Order[]>`
      SELECT * FROM orders 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${size} OFFSET ${(page - 1) * size}
    `
    
    // Store in cache
    yield* cache.set(cacheKey, orders, 300)  // 5 minutes
    
    return orders
  })
```

---

#### 2.3 Production Requirements

Add production concerns incrementally:

**Monitoring**:

```typescript
export class OrderServiceLive extends Effect.Service<OrderService>()(
  "OrderService",
  {
    dependencies: [
      OrderRepository.Default,
      Metrics.Default  // Add metrics
    ],
    
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      const metrics = yield* Metrics
      
      return {
        createOrder: (userId, items) =>
          Effect.gen(function* () {
            const start = Date.now()
            
            // Create order
            const order = yield* createOrderLogic(userId, items)
            
            // Record metrics
            yield* metrics.recordLatency("order.create", Date.now() - start)
            yield* metrics.increment("order.created")
            
            return order
          })
      }
    })
  }
) {}
```

**Logging**:

```typescript
createOrder: (userId, items) =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Creating order for user ${userId}`)
    
    const order = yield* createOrderLogic(userId, items)
    
    yield* Effect.logInfo(`Order created: ${order.id}`)
    
    return order
  }).pipe(
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        yield* Effect.logError(`Failed to create order: ${error}`)
        return yield* Effect.fail(error)
      })
    )
  )
```

---

#### 2.4 Monitoring and Observability

Add observability incrementally:

**Phase 1: Basic Logging**

```typescript
yield* Effect.logInfo("Order created")
```

**Phase 2: Structured Logging**

```typescript
yield* Effect.logInfo("Order created").pipe(
  Effect.annotateLogs({
    orderId: order.id,
    userId: userId,
    totalAmount: order.totalAmount
  })
)
```

**Phase 3: Metrics**

```typescript
yield* metrics.recordLatency("order.create", duration)
yield* metrics.increment("order.created")
yield* metrics.gauge("order.value", order.totalAmount)
```

**Phase 4: Tracing**

```typescript
yield* Effect.withSpan("create-order")(
  createOrderLogic(userId, items)
)
```

---

### 3. Refactor Continuously

#### 3.1 Extract Common Patterns

Identify and extract repeated patterns:

**Before - Repeated Validation**:

```typescript
createOrder: (userId, items) =>
  Effect.gen(function* () {
    if (items.length === 0) {
      return yield* Effect.fail(new ValidationError({ reason: "Empty items" }))
    }
    // ...
  })

updateOrder: (id, items) =>
  Effect.gen(function* () {
    if (items.length === 0) {
      return yield* Effect.fail(new ValidationError({ reason: "Empty items" }))
    }
    // ...
  })
```

**After - Extracted Pattern**:

```typescript
// Extracted validation function
const validateItems = (items: OrderItem[]) =>
  items.length === 0
    ? Effect.fail(new ValidationError({ reason: "Empty items" }))
    : Effect.succeed(items)

createOrder: (userId, items) =>
  Effect.gen(function* () {
    yield* validateItems(items)
    // ...
  })

updateOrder: (id, items) =>
  Effect.gen(function* () {
    yield* validateItems(items)
    // ...
  })
```

---

#### 3.2 Improve Naming

Refine names as understanding improves:

**Iteration 1: Generic Names**

```typescript
class DataService { }
class Manager { }
```

**Iteration 2: Specific Names**

```typescript
class OrderService { }
class OrderRepository { }
```

**Iteration 3: Capability Names**

```typescript
class OrderCheckout { }
class OrderFulfillment { }
```

---

#### 3.3 Simplify Dependencies

Reduce coupling over time:

**Before - Too Many Dependencies**:

```typescript
export class OrderServiceLive extends Effect.Service<OrderService>()(
  "OrderService",
  {
    dependencies: [
      OrderRepository.Default,
      UserRepository.Default,
      ProductRepository.Default,
      PaymentGateway.Default,
      EmailService.Default,
      SmsService.Default,
      EventBus.Default,
      Cache.Default,
      Logger.Default
    ],
    // ...
  }
) {}
```

**After - Focused Dependencies**:

```typescript
// Split into smaller services
export class CreateOrderCommand extends Effect.Service<CreateOrderCommand>()(
  "CreateOrderCommand",
  {
    dependencies: [
      OrderRepository.Default,
      InventoryService.Default
    ]
  }
) {}

export class ConfirmOrderCommand extends Effect.Service<ConfirmOrderCommand>()(
  "ConfirmOrderCommand",
  {
    dependencies: [
      OrderRepository.Default,
      PaymentGateway.Default
    ]
  }
) {}
```

---

#### 3.4 Maintain Clean Boundaries

Regularly verify architectural boundaries:

**Verification Checklist**:

- [ ] Domain has no Effect dependencies
- [ ] Ports are pure interfaces
- [ ] Adapters provide dependencies locally
- [ ] Services depend only on ports
- [ ] Tests are fast
- [ ] Implementations are swappable

**Automated Checks**:

```typescript
// scripts/validate-architecture.ts

// Check 1: Domain should not import Effect
const domainFiles = glob.sync("src/domain/**/*.ts")
for (const file of domainFiles) {
  const content = fs.readFileSync(file, "utf-8")
  if (content.includes('from "effect"')) {
    console.error(`❌ Domain file imports Effect: ${file}`)
    process.exit(1)
  }
}

// Check 2: Ports should only define interfaces
const portFiles = glob.sync("src/application/ports/**/*.port.ts")
for (const file of portFiles) {
  const content = fs.readFileSync(file, "utf-8")
  if (content.includes("Layer.effect") || content.includes("Layer.succeed")) {
    console.error(`❌ Port file contains implementation: ${file}`)
    process.exit(1)
  }
}

console.log("✅ Architecture validation passed")
```

---

This comprehensive workflow provides a clear, step-by-step process for building Effect-TS applications with hexagonal architecture. Each phase builds on the previous one, ensuring a solid foundation while maintaining flexibility for iteration and refinement.
