---
modified: 2025-11-04T04:33:58-03:00
---
# IV. TESTING TAXONOMY

## A. Test Layer Hierarchy

Effect-TS with hexagonal architecture enables a clear testing pyramid where each layer has a specific purpose, speed characteristics, and testing strategy.

### 1. Unit Tests

#### 1.1 Characteristics

Unit tests focus on pure logic with zero I/O dependencies:

**Core Properties**:
- **Pure Logic Only**: Test functions with no side effects
- **No Effect or Minimal Effect**: Use `Effect.succeed`/`Effect.fail` for simple cases
- **No I/O Operations**: No database, file system, network, or external services
- **Speed**: Instant (<10ms per test)
- **Isolation**: Each test is completely independent
- **Deterministic**: Same input always produces same output

**When to Write Unit Tests**:

```typescript
// ✅ Unit test this - Pure domain logic
const calculateDiscount = (order: Order): Discount => {
  if (order.items.length > 10) return Discount.percentage(15)
  if (order.totalAmount > 1000) return Discount.percentage(10)
  return Discount.none()
}

// ✅ Unit test this - Pure validation
const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// ❌ Don't unit test this - Has I/O
const saveOrder = (order: Order): Effect.Effect<void, DatabaseError, Database> =>
  Effect.gen(function* () {
    const db = yield* Database
    yield* db.insert("orders", order)
  })
```

---

#### 1.2 Scope

Unit tests cover the domain layer exclusively:

**Domain Models and Rules**:

```typescript
// domain/models/Order.model.unit.test.ts
import { describe, it, expect } from "@effect/vitest"
import { Order } from "./Order.model"
import { OrderItem } from "./OrderItem.model"

describe("Order - Unit Tests", () => {
  describe("calculateTotal", () => {
    it("should calculate total for single item", () => {
      const order = new Order({
        id: "order-1",
        items: [
          new OrderItem({ sku: "ABC", price: 100, quantity: 2 })
        ],
        totalAmount: 0,
        status: "pending"
      })
      
      expect(order.calculateTotal()).toBe(200)
    })
    
    it("should calculate total for multiple items", () => {
      const order = new Order({
        id: "order-1",
        items: [
          new OrderItem({ sku: "ABC", price: 100, quantity: 2 }),
          new OrderItem({ sku: "DEF", price: 50, quantity: 3 }),
          new OrderItem({ sku: "GHI", price: 25, quantity: 4 })
        ],
        totalAmount: 0,
        status: "pending"
      })
      
      expect(order.calculateTotal()).toBe(450) // (100*2) + (50*3) + (25*4)
    })
    
    it("should handle empty order", () => {
      const order = new Order({
        id: "order-1",
        items: [],
        totalAmount: 0,
        status: "pending"
      })
      
      expect(order.calculateTotal()).toBe(0)
    })
  })
  
  describe("confirm", () => {
    it("should confirm valid order", () => {
      const order = new Order({
        id: "order-1",
        items: [new OrderItem({ sku: "ABC", price: 100, quantity: 1 })],
        totalAmount: 100,
        status: "pending"
      })
      
      const confirmed = order.confirm()
      
      expect(confirmed.status).toBe("confirmed")
      expect(confirmed.id).toBe(order.id)
    })
    
    it("should not confirm empty order", () => {
      const order = new Order({
        id: "order-1",
        items: [],
        totalAmount: 0,
        status: "pending"
      })
      
      expect(() => order.confirm()).toThrow("Cannot confirm empty order")
    })
    
    it("should not confirm already confirmed order", () => {
      const order = new Order({
        id: "order-1",
        items: [new OrderItem({ sku: "ABC", price: 100, quantity: 1 })],
        totalAmount: 100,
        status: "confirmed"
      })
      
      expect(() => order.confirm()).toThrow("Order already confirmed")
    })
  })
})
```

**Pure Functions**:

```typescript
// domain/rules/OrderRules.unit.test.ts
import { describe, it, expect } from "@effect/vitest"
import { calculateShippingCost, requiresExpressShipping } from "./OrderRules"

describe("OrderRules - Unit Tests", () => {
  describe("requiresExpressShipping", () => {
    it("should require express for high-value orders", () => {
      const order = createOrder({ totalAmount: 600 })
      expect(requiresExpressShipping(order)).toBe(true)
    })
    
    it("should require express for fragile items", () => {
      const order = createOrder({
        items: [{ sku: "GLASS", isFragile: true }]
      })
      expect(requiresExpressShipping(order)).toBe(true)
    })
    
    it("should not require express for standard orders", () => {
      const order = createOrder({ totalAmount: 100 })
      expect(requiresExpressShipping(order)).toBe(false)
    })
  })
  
  describe("calculateShippingCost", () => {
    it("should calculate standard shipping cost", () => {
      const order = createOrder({ totalAmount: 100 })
      const address = createAddress({ distance: 100 })
      
      const cost = calculateShippingCost(order, address)
      
      expect(cost).toBe(10) // Base rate for standard
    })
    
    it("should calculate express shipping cost", () => {
      const order = createOrder({ totalAmount: 600 })
      const address = createAddress({ distance: 100 })
      
      const cost = calculateShippingCost(order, address)
      
      expect(cost).toBe(50) // Base rate for express
    })
    
    it("should apply distance multiplier", () => {
      const order = createOrder({ totalAmount: 100 })
      const address = createAddress({ distance: 200 })
      
      const cost = calculateShippingCost(order, address)
      
      expect(cost).toBe(20) // Base * (distance/100)
    })
  })
})
```

**Business Calculations**:

```typescript
// domain/calculations/PricingCalculator.unit.test.ts
import { describe, it, expect } from "@effect/vitest"
import { calculateFinalPrice, applyDiscounts } from "./PricingCalculator"

describe("PricingCalculator - Unit Tests", () => {
  it("should apply percentage discount", () => {
    const price = Money(100)
    const discount = Discount.percentage(10)
    
    const final = applyDiscounts(price, [discount])
    
    expect(Money.toNumber(final)).toBe(90)
  })
  
  it("should apply fixed discount", () => {
    const price = Money(100)
    const discount = Discount.fixed(Money(15))
    
    const final = applyDiscounts(price, [discount])
    
    expect(Money.toNumber(final)).toBe(85)
  })
  
  it("should apply multiple discounts in order", () => {
    const price = Money(100)
    const discounts = [
      Discount.percentage(10),  // 100 -> 90
      Discount.fixed(Money(5))  // 90 -> 85
    ]
    
    const final = applyDiscounts(price, discounts)
    
    expect(Money.toNumber(final)).toBe(85)
  })
  
  it("should not allow negative prices", () => {
    const price = Money(10)
    const discount = Discount.fixed(Money(50))
    
    const final = applyDiscounts(price, [discount])
    
    expect(Money.toNumber(final)).toBe(0) // Floor at zero
  })
})
```

**Validation Logic**:

```typescript
// domain/validation/EmailValidator.unit.test.ts
import { describe, it, expect } from "@effect/vitest"
import { isValidEmail, validateEmailDomain } from "./EmailValidator"

describe("EmailValidator - Unit Tests", () => {
  describe("isValidEmail", () => {
    it("should validate correct emails", () => {
      expect(isValidEmail("user@example.com")).toBe(true)
      expect(isValidEmail("test.user@sub.example.com")).toBe(true)
      expect(isValidEmail("user+tag@example.com")).toBe(true)
    })
    
    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid")).toBe(false)
      expect(isValidEmail("@example.com")).toBe(false)
      expect(isValidEmail("user@")).toBe(false)
      expect(isValidEmail("user @example.com")).toBe(false)
    })
  })
  
  describe("validateEmailDomain", () => {
    it("should allow whitelisted domains", () => {
      const whitelist = ["example.com", "test.com"]
      
      expect(validateEmailDomain("user@example.com", whitelist)).toBe(true)
      expect(validateEmailDomain("user@test.com", whitelist)).toBe(true)
    })
    
    it("should reject non-whitelisted domains", () => {
      const whitelist = ["example.com"]
      
      expect(validateEmailDomain("user@other.com", whitelist)).toBe(false)
    })
  })
})
```

---

#### 1.3 Naming

**Naming Convention**: `.model.unit.test.ts` or `.unit.test.ts`

```typescript
// Domain models
Order.model.unit.test.ts
User.model.unit.test.ts
Task.model.unit.test.ts

// Domain rules
OrderRules.unit.test.ts
PricingRules.unit.test.ts
ValidationRules.unit.test.ts

// Value objects
Money.value.unit.test.ts
Email.value.unit.test.ts
OrderId.value.unit.test.ts
```

**File Organization**:

```
domain/
├── models/
│   ├── Order.model.ts
│   ├── Order.model.unit.test.ts       # Co-located with model
│   ├── User.model.ts
│   └── User.model.unit.test.ts
├── rules/
│   ├── OrderRules.ts
│   ├── OrderRules.unit.test.ts        # Co-located with rules
│   ├── PricingRules.ts
│   └── PricingRules.unit.test.ts
└── value-objects/
    ├── Money.value.ts
    ├── Money.value.unit.test.ts       # Co-located with value object
    ├── Email.value.ts
    └── Email.value.unit.test.ts
```

---

### 2. Contract Tests

#### 2.1 Characteristics

Contract tests verify that implementations correctly satisfy port interfaces:

**Core Properties**:
- **Test Against Interface**: Test the contract, not implementation details
- **Use Fakes**: Use full-featured in-memory implementations
- **Verify Port Compliance**: Ensure all methods behave according to contract
- **Speed**: Very fast (<50ms per test)
- **No Real I/O**: All dependencies are fakes/mocks
- **Reusable**: Same tests run against all implementations

**Contract Test Pattern**:

```typescript
// The contract test suite tests the INTERFACE
// It runs against the FAKE to verify the contract is testable
// Real implementations must also pass these same tests

describe("OrderRepository - Contract Tests", () => {
  // Tests define the contract behavior
  it.effect("MUST save and retrieve order", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      
      const order = new Order({ id: "1", items: [], status: "pending" })
      yield* repo.save(order)
      
      const retrieved = yield* repo.findById("1")
      assert.deepEqual(retrieved, order)
    }).pipe(Effect.provide(OrderRepositoryFake))  // Test against FAKE
  )
  
  it.effect("MUST fail when order not found", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      const exit = yield* Effect.exit(repo.findById("non-existent"))
      
      assert.isTrue(Exit.isFailure(exit))
      // Verify correct error type
    }).pipe(Effect.provide(OrderRepositoryFake))
  )
})
```

---

#### 2.2 Scope

Contract tests cover port interfaces and use case behavior:

**Port Interface Contracts**:

```typescript
// ports/secondary/TaskRepository/TaskRepository.port.contract.test.ts
import { Effect, Exit, Cause, Option } from "effect"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { TaskRepository } from "./TaskRepository.port"
import { TaskRepositoryFake } from "./TaskRepository.port.fake"
import { Task, TaskId } from "../../../domain/models/Task.model"

describe("TaskRepository - Contract Tests", () => {
  it.effect("MUST save and retrieve task by ID", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      const task = new Task({
        id: TaskId.make("task-1"),
        title: "Test Task",
        status: "pending",
        createdAt: new Date()
      })
      
      yield* repo.save(task)
      const retrieved = yield* repo.findById(task.id)
      
      assert.deepEqual(retrieved, task)
    }).pipe(Effect.provide(TaskRepositoryFake))
  )
  
  it.effect("MUST fail with TaskNotFoundError when task doesn't exist", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      const exit = yield* Effect.exit(repo.findById(TaskId.make("non-existent")))
      
      assert.isTrue(Exit.isFailure(exit))
      
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause)
        assert.isTrue(Option.isSome(error))
        const err = Option.getOrThrow(error)
        assert.instanceOf(err, TaskNotFoundError)
        assert.strictEqual(err.taskId, "non-existent")
      }
    }).pipe(Effect.provide(TaskRepositoryFake))
  )
  
  it.effect("MUST find tasks by status", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      const task1 = new Task({
        id: TaskId.make("1"),
        title: "Task 1",
        status: "pending",
        createdAt: new Date()
      })
      const task2 = new Task({
        id: TaskId.make("2"),
        title: "Task 2",
        status: "completed",
        createdAt: new Date()
      })
      const task3 = new Task({
        id: TaskId.make("3"),
        title: "Task 3",
        status: "pending",
        createdAt: new Date()
      })
      
      yield* repo.save(task1)
      yield* repo.save(task2)
      yield* repo.save(task3)
      
      const pending = yield* repo.findByStatus("pending")
      
      assert.strictEqual(pending.length, 2)
      assert.isTrue(pending.some(t => t.id === "1"))
      assert.isTrue(pending.some(t => t.id === "3"))
    }).pipe(Effect.provide(TaskRepositoryFake))
  )
  
  it.effect("MUST update existing task", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      const task = new Task({
        id: TaskId.make("1"),
        title: "Original",
        status: "pending",
        createdAt: new Date()
      })
      
      yield* repo.save(task)
      
      const updated = new Task({
        ...task,
        title: "Updated",
        status: "completed"
      })
      
      yield* repo.save(updated)
      
      const retrieved = yield* repo.findById(task.id)
      assert.strictEqual(retrieved.title, "Updated")
      assert.strictEqual(retrieved.status, "completed")
    }).pipe(Effect.provide(TaskRepositoryFake))
  )
  
  it.effect("MUST delete task", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      const task = new Task({
        id: TaskId.make("1"),
        title: "To Delete",
        status: "pending",
        createdAt: new Date()
      })
      
      yield* repo.save(task)
      yield* repo.delete(task.id)
      
      const exit = yield* Effect.exit(repo.findById(task.id))
      assert.isTrue(Exit.isFailure(exit))
    }).pipe(Effect.provide(TaskRepositoryFake))
  )
})
```

**Use Case Behavior**:

```typescript
// application/services/CompleteTask/CompleteTask.service.contract.test.ts
import { Effect, Layer } from "effect"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { CompleteTaskService } from "./CompleteTask.service"
import { TaskRepositoryFake } from "../../../ports/secondary/TaskRepository/TaskRepository.port.fake"
import { EmailServiceFake } from "../../../ports/secondary/EmailService/EmailService.port.fake"

// Test layer with all fakes
const TestLayer = Layer.mergeAll(
  CompleteTaskService.Default,
  TaskRepositoryFake,
  EmailServiceFake
)

describe("CompleteTaskService - Contract Tests", () => {
  it.effect("MUST complete pending task", () =>
    Effect.gen(function* () {
      const taskRepo = yield* TaskRepository
      const completeTask = yield* CompleteTaskService
      
      // Setup: Create pending task
      const task = new Task({
        id: TaskId.make("1"),
        title: "Test",
        status: "pending",
        createdAt: new Date()
      })
      yield* taskRepo.save(task)
      
      // Execute
      yield* completeTask.execute(task.id)
      
      // Verify
      const completed = yield* taskRepo.findById(task.id)
      assert.strictEqual(completed.status, "completed")
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("MUST fail when task not found", () =>
    Effect.gen(function* () {
      const completeTask = yield* CompleteTaskService
      const exit = yield* Effect.exit(
        completeTask.execute(TaskId.make("non-existent"))
      )
      
      assert.isTrue(Exit.isFailure(exit))
      // Verify correct error
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("MUST fail when task already completed", () =>
    Effect.gen(function* () {
      const taskRepo = yield* TaskRepository
      const completeTask = yield* CompleteTaskService
      
      const task = new Task({
        id: TaskId.make("1"),
        title: "Test",
        status: "completed",  // Already completed
        createdAt: new Date()
      })
      yield* taskRepo.save(task)
      
      const exit = yield* Effect.exit(completeTask.execute(task.id))
      
      assert.isTrue(Exit.isFailure(exit))
      // Verify InvalidTransitionError
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("MUST send completion email", () =>
    Effect.gen(function* () {
      const taskRepo = yield* TaskRepository
      const emailService = yield* EmailService
      const completeTask = yield* CompleteTaskService
      
      const task = new Task({
        id: TaskId.make("1"),
        title: "Test",
        status: "pending",
        createdAt: new Date()
      })
      yield* taskRepo.save(task)
      
      yield* completeTask.execute(task.id)
      
      // Verify email was sent (fake tracks calls)
      const calls = yield* emailService.getCallLog()
      assert.isTrue(
        calls.some(call => 
          call.method === "sendTaskCompletedEmail" &&
          call.args[0].id === task.id
        )
      )
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Service Contracts**:

```typescript
// ports/primary/OrderService/OrderService.port.contract.test.ts
import { Effect, Exit } from "effect"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { OrderService } from "./OrderService.port"
import { OrderServiceFake } from "./OrderService.port.fake"

describe("OrderService - Contract Tests", () => {
  it.effect("MUST create order with valid items", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      const order = yield* service.createOrder([
        { sku: "ABC", price: 100, quantity: 2 }
      ])
      
      assert.isDefined(order.id)
      assert.strictEqual(order.status, "pending")
      assert.strictEqual(order.totalAmount, 200)
    }).pipe(Effect.provide(OrderServiceFake))
  )
  
  it.effect("MUST fail with empty items", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      const exit = yield* Effect.exit(service.createOrder([]))
      
      assert.isTrue(Exit.isFailure(exit))
    }).pipe(Effect.provide(OrderServiceFake))
  )
  
  it.effect("MUST retrieve order by ID", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      const created = yield* service.createOrder([
        { sku: "ABC", price: 100, quantity: 1 }
      ])
      
      const retrieved = yield* service.getOrder(created.id)
      
      assert.deepEqual(retrieved, created)
    }).pipe(Effect.provide(OrderServiceFake))
  )
})
```

---

#### 2.3 Naming

**Naming Convention**: `.port.contract.test.ts` or `.contract.test.ts`

```typescript
// Secondary ports
TaskRepository.port.contract.test.ts
OrderRepository.port.contract.test.ts
EmailService.port.contract.test.ts
PaymentGateway.port.contract.test.ts

// Primary ports  
OrderService.port.contract.test.ts
CheckoutService.port.contract.test.ts

// Use case services
CompleteTask.service.contract.test.ts
ProcessCheckout.service.contract.test.ts
```

**File Organization**:

```
ports/
├── primary/
│   └── OrderService/
│       ├── OrderService.port.ts
│       ├── OrderService.port.contract.test.ts    # Contract tests
│       ├── OrderService.port.fake.ts              # Test double
│       └── index.ts
└── secondary/
    └── TaskRepository/
        ├── TaskRepository.port.ts
        ├── TaskRepository.port.contract.test.ts  # Contract tests
        ├── TaskRepository.port.fake.ts            # Test double
        └── index.ts
```

---

### 3. Integration Tests

#### 3.1 Characteristics

Integration tests verify that multiple components work together correctly:

**Core Properties**:
- **Multiple Components Together**: Test service interactions
- **Real Services, Fake I/O**: Use real business logic with fake infrastructure
- **Cross-Service Interactions**: Test workflows across services
- **Speed**: Fast (<500ms per test)
- **Transaction Behavior**: Test transaction boundaries
- **Error Propagation**: Verify errors flow correctly

**Integration Test Pattern**:

```typescript
// Test real services together, but with fake infrastructure
const TestLayer = Layer.mergeAll(
  OrderServiceLive,           // Real service
  InventoryServiceLive,       // Real service
  PaymentServiceLive,         // Real service
  OrderRepositoryMemory,      // Fake infrastructure
  InventoryRepositoryMemory,  // Fake infrastructure
  PaymentGatewayMock          // Fake infrastructure
)

describe("Order Processing - Integration Tests", () => {
  it.effect("should process order end-to-end", () =>
    Effect.gen(function* () {
      // Test real services interacting
      const orderService = yield* OrderService
      const inventoryService = yield* InventoryService
      
      // ... test workflow
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

#### 3.2 Scope

Integration tests cover service implementations and multi-service workflows:

**Service Implementations**:

```typescript
// application/services/OrderService/OrderService.service.integration.test.ts
import { Effect, Layer } from "effect"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { OrderServiceLive } from "./OrderService.service"
import { OrderRepositoryMemoryLive } from "../../../infrastructure/persistence/OrderRepository.memory"
import { PaymentGatewayMockLive } from "../../../infrastructure/external/PaymentGateway.mock"
import { EmailServiceFakeLive } from "../../../infrastructure/messaging/EmailService.fake"

const TestLayer = Layer.mergeAll(
  OrderServiceLive,
  OrderRepositoryMemoryLive,
  PaymentGatewayMockLive,
  EmailServiceFakeLive
)

describe("OrderService - Integration Tests", () => {
  it.effect("should create and persist order", () =>
    Effect.gen(function* () {
      const orderService = yield* OrderService
      const orderRepo = yield* OrderRepository
      
      const order = yield* orderService.createOrder([
        { sku: "ABC", price: 100, quantity: 2 }
      ])
      
      // Verify persisted
      const saved = yield* orderRepo.findById(order.id)
      assert.deepEqual(saved, order)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should process payment during order creation", () =>
    Effect.gen(function* () {
      const orderService = yield* OrderService
      const paymentGateway = yield* PaymentGateway
      
      yield* orderService.createOrder([
        { sku: "ABC", price: 100, quantity: 2 }
      ])
      
      // Verify payment was charged
      const calls = yield* paymentGateway.getChargeHistory()
      assert.strictEqual(calls.length, 1)
      assert.strictEqual(calls[0].amount, 200)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should send confirmation email", () =>
    Effect.gen(function* () {
      const orderService = yield* OrderService
      const emailService = yield* EmailService
      
      const order = yield* orderService.createOrder([
        { sku: "ABC", price: 100, quantity: 1 }
      ])
      
      const emails = yield* emailService.getSentEmails()
      assert.isTrue(
        emails.some(e => e.subject.includes(`Order ${order.id}`))
      )
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should rollback on payment failure", () =>
    Effect.gen(function* () {
      const orderService = yield* OrderService
      const orderRepo = yield* OrderRepository
      const paymentGateway = yield* PaymentGateway
      
      // Configure gateway to fail
      yield* paymentGateway.setFailureMode(true)
      
      const exit = yield* Effect.exit(
        orderService.createOrder([
          { sku: "ABC", price: 100, quantity: 1 }
        ])
      )
      
      assert.isTrue(Exit.isFailure(exit))
      
      // Verify order was not persisted
      const orders = yield* orderRepo.findAll()
      assert.strictEqual(orders.length, 0)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Multi-Service Workflows**:

```typescript
// application/workflows/CheckoutWorkflow.integration.test.ts
import { Effect, Layer } from "effect"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"

const TestLayer = Layer.mergeAll(
  CheckoutServiceLive,
  InventoryServiceLive,
  PaymentServiceLive,
  OrderServiceLive,
  // All with fake infrastructure
  OrderRepositoryMemoryLive,
  InventoryRepositoryMemoryLive,
  PaymentGatewayMockLive,
  EmailServiceFakeLive
)

describe("Checkout Workflow - Integration Tests", () => {
  it.effect("should complete full checkout workflow", () =>
    Effect.gen(function* () {
      const checkout = yield* CheckoutService
      const inventory = yield* InventoryService
      const orders = yield* OrderRepository
      
      // Setup: Stock inventory
      yield* inventory.addStock("ABC", 10)
      
      // Execute: Complete checkout
      const result = yield* checkout.processCheckout({
        items: [{ sku: "ABC", quantity: 2 }],
        paymentToken: "tok_123"
      })
      
      // Verify: Order created
      const order = yield* orders.findById(result.orderId)
      assert.strictEqual(order.status, "confirmed")
      
      // Verify: Inventory reserved
      const stock = yield* inventory.getStock("ABC")
      assert.strictEqual(stock.available, 8)
      assert.strictEqual(stock.reserved, 2)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should handle inventory shortage", () =>
    Effect.gen(function* () {
      const checkout = yield* CheckoutService
      const inventory = yield* InventoryService
      
      // Setup: Limited stock
      yield* inventory.addStock("ABC", 1)
      
      // Execute: Try to order more than available
      const exit = yield* Effect.exit(
        checkout.processCheckout({
          items: [{ sku: "ABC", quantity: 5 }],
          paymentToken: "tok_123"
        })
      )
      
      assert.isTrue(Exit.isFailure(exit))
      // Verify correct error type
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should release inventory on payment failure", () =>
    Effect.gen(function* () {
      const checkout = yield* CheckoutService
      const inventory = yield* InventoryService
      const payment = yield* PaymentGateway
      
      yield* inventory.addStock("ABC", 10)
      yield* payment.setFailureMode(true)
      
      const exit = yield* Effect.exit(
        checkout.processCheckout({
          items: [{ sku: "ABC", quantity: 2 }],
          paymentToken: "tok_123"
        })
      )
      
      assert.isTrue(Exit.isFailure(exit))
      
      // Verify inventory was released
      const stock = yield* inventory.getStock("ABC")
      assert.strictEqual(stock.available, 10)
      assert.strictEqual(stock.reserved, 0)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Transaction Behavior**:

```typescript
// application/services/TransferFunds.integration.test.ts
describe("TransferFunds - Integration Tests", () => {
  it.effect("should transfer funds atomically", () =>
    Effect.gen(function* () {
      const transfer = yield* TransferFundsService
      const accounts = yield* AccountRepository
      
      // Setup: Create accounts
      const account1 = yield* accounts.create({ balance: 1000 })
      const account2 = yield* accounts.create({ balance: 500 })
      
      // Execute: Transfer
      yield* transfer.execute({
        from: account1.id,
        to: account2.id,
        amount: 200
      })
      
      // Verify: Both accounts updated
      const updated1 = yield* accounts.findById(account1.id)
      const updated2 = yield* accounts.findById(account2.id)
      
      assert.strictEqual(updated1.balance, 800)
      assert.strictEqual(updated2.balance, 700)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should rollback on insufficient funds", () =>
    Effect.gen(function* () {
      const transfer = yield* TransferFundsService
      const accounts = yield* AccountRepository
      
      const account1 = yield* accounts.create({ balance: 100 })
      const account2 = yield* accounts.create({ balance: 500 })
      
      // Execute: Try to transfer more than balance
      const exit = yield* Effect.exit(
        transfer.execute({
          from: account1.id,
          to: account2.id,
          amount: 200
        })
      )
      
      assert.isTrue(Exit.isFailure(exit))
      
      // Verify: Balances unchanged
      const unchanged1 = yield* accounts.findById(account1.id)
      const unchanged2 = yield* accounts.findById(account2.id)
      
      assert.strictEqual(unchanged1.balance, 100)
      assert.strictEqual(unchanged2.balance, 500)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

#### 3.3 Naming

**Naming Convention**: `.service.integration.test.ts` or `.integration.test.ts`

```typescript
// Service integration tests
OrderService.service.integration.test.ts
CheckoutService.service.integration.test.ts
UserService.service.integration.test.ts

// Workflow integration tests
CheckoutWorkflow.integration.test.ts
OrderFulfillment.integration.test.ts

// Cross-feature integration tests
OrderInventory.integration.test.ts
BillingShipping.integration.test.ts
```

**File Organization**:

```
application/
├── services/
│   └── OrderService/
│       ├── OrderService.service.ts
│       ├── OrderService.service.integration.test.ts
│       └── index.ts
└── workflows/
    ├── CheckoutWorkflow.ts
    ├── CheckoutWorkflow.integration.test.ts
    └── index.ts
```

---

### 4. System/E2E Tests

#### 4.1 Characteristics

System tests verify complete user flows through primary adapters:

**Core Properties**:
- **Full Stack with Fakes**: Complete application with fake infrastructure
- **Through Primary Adapters**: Test via HTTP, CLI, GraphQL, etc.
- **Complete User Flows**: End-to-end scenarios
- **Speed**: Moderate (<2s per test)
- **Protocol Translation**: Test request/response handling
- **Authentication/Authorization**: Test security concerns

**System Test Pattern**:

```typescript
// Test through HTTP adapter with full application stack
const TestLayer = Layer.mergeAll(
  HttpApiLive,              // Real HTTP adapter
  OrderServiceLive,         // Real services
  InventoryServiceLive,
  OrderRepositoryMemory,    // Fake infrastructure
  InventoryRepositoryMemory
)

describe("Order API - System Tests", () => {
  it.effect("POST /orders should create order", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      const response = yield* client.post("/orders", {
        body: { items: [{ sku: "ABC", quantity: 1 }] }
      })
      
      assert.strictEqual(response.status, 201)
      assert.isDefined(response.body.orderId)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

#### 4.2 Scope

System tests cover HTTP APIs, CLI commands, GraphQL resolvers, and full request/response cycles:

**HTTP API Endpoints**:

```typescript
// adapters/primary/http/OrderApi.http-adapter.system.test.ts
import { Effect, Layer } from "effect"
import { HttpClient } from "@effect/platform"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"

const TestLayer = Layer.mergeAll(
  OrderApiLive,
  OrderServiceLive,
  OrderRepositoryMemoryLive,
  PaymentGatewayMockLive,
  EmailServiceFakeLive
)

describe("Order API - System Tests", () => {
  it.effect("POST /orders should create order with valid data", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      const response = yield* client.post("/orders", {
        body: {
          items: [
            { sku: "ABC", price: 100, quantity: 2 }
          ]
        }
      })
      
      assert.strictEqual(response.status, 201)
      assert.isDefined(response.body.orderId)
      assert.strictEqual(response.body.totalAmount, 200)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("POST /orders should return 400 with empty items", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      const response = yield* client.post("/orders", {
        body: { items: [] }
      })
      
      assert.strictEqual(response.status, 400)
      assert.isDefined(response.body.error)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("GET /orders/:id should return order", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      // Create order first
      const createResponse = yield* client.post("/orders", {
        body: { items: [{ sku: "ABC", price: 100, quantity: 1 }] }
      })
      
      const orderId = createResponse.body.orderId
      
      // Get order
      const getResponse = yield* client.get(`/orders/${orderId}`)
      
      assert.strictEqual(getResponse.status, 200)
      assert.strictEqual(getResponse.body.id, orderId)
      assert.strictEqual(getResponse.body.totalAmount, 100)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("GET /orders/:id should return 404 for non-existent order", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      const response = yield* client.get("/orders/non-existent")
      
      assert.strictEqual(response.status, 404)
      assert.isDefined(response.body.error)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("PUT /orders/:id/ship should ship order", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      // Create order
      const createResponse = yield* client.post("/orders", {
        body: { items: [{ sku: "ABC", price: 100, quantity: 1 }] }
      })
      
      const orderId = createResponse.body.orderId
      
      // Ship order
      const shipResponse = yield* client.put(`/orders/${orderId}/ship`, {
        body: { carrier: "FedEx", trackingNumber: "123456" }
      })
      
      assert.strictEqual(shipResponse.status, 200)
      
      // Verify order status
      const getResponse = yield* client.get(`/orders/${orderId}`)
      assert.strictEqual(getResponse.body.status, "shipped")
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**CLI Commands**:

```typescript
// adapters/primary/cli/OrderCommands.cli-adapter.system.test.ts
import { Effect, Layer } from "effect"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"

describe("Order CLI - System Tests", () => {
  it.effect("order create should create order", () =>
    Effect.gen(function* () {
      const cli = yield* OrderCLI
      
      const result = yield* cli.executeCommand([
        "order",
        "create",
        "--items", "ABC:2,DEF:1"
      ])
      
      assert.isTrue(result.success)
      assert.isDefined(result.orderId)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("order list should display orders", () =>
    Effect.gen(function* () {
      const cli = yield* OrderCLI
      
      // Create some orders first
      yield* cli.executeCommand(["order", "create", "--items", "ABC:1"])
      yield* cli.executeCommand(["order", "create", "--items", "DEF:2"])
      
      const result = yield* cli.executeCommand(["order", "list"])
      
      assert.strictEqual(result.orders.length, 2)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**GraphQL Resolvers**:

```typescript
// adapters/primary/graphql/OrderResolvers.graphql-adapter.system.test.ts
describe("Order GraphQL - System Tests", () => {
  it.effect("createOrder mutation should create order", () =>
    Effect.gen(function* () {
      const graphql = yield* GraphQLClient
      
      const result = yield* graphql.execute(`
        mutation {
          createOrder(input: {
            items: [{ sku: "ABC", quantity: 2 }]
          }) {
            id
            totalAmount
            status
          }
        }
      `)
      
      assert.isDefined(result.data.createOrder.id)
      assert.strictEqual(result.data.createOrder.status, "pending")
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("order query should return order", () =>
    Effect.gen(function* () {
      const graphql = yield* GraphQLClient
      
      // Create order
      const createResult = yield* graphql.execute(`
        mutation { createOrder(input: { items: [{ sku: "ABC", quantity: 1 }] }) { id } }
      `)
      
      const orderId = createResult.data.createOrder.id
      
      // Query order
      const queryResult = yield* graphql.execute(`
        query { order(id: "${orderId}") { id, totalAmount, status } }
      `)
      
      assert.strictEqual(queryResult.data.order.id, orderId)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Full Request/Response Cycles**:

```typescript
// Complete user flows
describe("Complete Checkout Flow - System Tests", () => {
  it.effect("should complete full checkout workflow via HTTP", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      // 1. Add items to cart
      const cartResponse = yield* client.post("/cart/items", {
        body: { sku: "ABC", quantity: 2 }
      })
      assert.strictEqual(cartResponse.status, 200)
      
      // 2. Get cart summary
      const summaryResponse = yield* client.get("/cart")
      assert.strictEqual(summaryResponse.body.itemCount, 2)
      
      // 3. Proceed to checkout
      const checkoutResponse = yield* client.post("/checkout", {
        body: {
          paymentToken: "tok_123",
          shippingAddress: { /* ... */ }
        }
      })
      assert.strictEqual(checkoutResponse.status, 200)
      
      // 4. Verify order created
      const orderId = checkoutResponse.body.orderId
      const orderResponse = yield* client.get(`/orders/${orderId}`)
      assert.strictEqual(orderResponse.body.status, "confirmed")
      
      // 5. Verify cart cleared
      const finalCartResponse = yield* client.get("/cart")
      assert.strictEqual(finalCartResponse.body.itemCount, 0)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

#### 4.3 Naming

**Naming Convention**: `.http-adapter.system.test.ts`, `.system.test.ts`, or `.e2e.test.ts`

```typescript
// HTTP adapters
OrderApi.http-adapter.system.test.ts
UserApi.http-adapter.system.test.ts
CheckoutApi.http-adapter.system.test.ts

// CLI adapters
OrderCommands.cli-adapter.system.test.ts
AdminCommands.cli-adapter.system.test.ts

// GraphQL adapters
OrderResolvers.graphql-adapter.system.test.ts

// Full flows
CheckoutFlow.e2e.test.ts
UserRegistrationFlow.e2e.test.ts
```

**File Organization**:

```
adapters/
├── primary/
│   ├── http/
│   │   ├── OrderApi.http-adapter.ts
│   │   ├── OrderApi.http-adapter.system.test.ts
│   │   └── index.ts
│   ├── cli/
│   │   ├── OrderCommands.cli-adapter.ts
│   │   ├── OrderCommands.cli-adapter.system.test.ts
│   │   └── index.ts
│   └── graphql/
│       ├── OrderResolvers.graphql-adapter.ts
│       ├── OrderResolvers.graphql-adapter.system.test.ts
│       └── index.ts
└── flows/
    ├── CheckoutFlow.e2e.test.ts
    └── UserRegistrationFlow.e2e.test.ts
```

---

## B. Testing Strategies by Layer

Each architectural layer requires a specific testing approach based on its responsibilities and dependencies.

### 1. Domain Layer Testing

#### 1.1 Approach

The domain layer contains pure business logic and requires the simplest testing approach:

**Testing Strategy**:
- **Pure Unit Tests**: No Effect, no I/O, no dependencies
- **No Test Doubles Needed**: Domain is self-contained
- **Direct Function Calls**: Test functions directly
- **Property-Based Testing**: Use `fast-check` for comprehensive coverage

**Example - Pure Unit Tests**:

```typescript
// domain/models/Money.value.unit.test.ts
import { describe, it, expect } from "@effect/vitest"
import { Money } from "./Money.value"

describe("Money - Unit Tests", () => {
  describe("addition", () => {
    it("should add two money values", () => {
      const a = Money(100)
      const b = Money(50)
      const result = Money.add(a, b)
      
      expect(Money.toNumber(result)).toBe(150)
    })
    
    it("should be commutative", () => {
      const a = Money(100)
      const b = Money(50)
      
      expect(Money.add(a, b)).toEqual(Money.add(b, a))
    })
    
    it("should have zero identity", () => {
      const a = Money(100)
      
      expect(Money.add(a, Money.zero)).toEqual(a)
    })
  })
  
  describe("multiplication", () => {
    it("should multiply money by factor", () => {
      const money = Money(100)
      const result = Money.multiply(money, 2.5)
      
      expect(Money.toNumber(result)).toBe(250)
    })
    
    it("should handle zero multiplication", () => {
      const money = Money(100)
      const result = Money.multiply(money, 0)
      
      expect(Money.toNumber(result)).toBe(0)
    })
  })
  
  describe("validation", () => {
    it("should reject negative amounts", () => {
      expect(() => Money(-100)).toThrow("Money cannot be negative")
    })
    
    it("should reject NaN", () => {
      expect(() => Money(NaN)).toThrow("Money must be a valid number")
    })
  })
})
```

**Property-Based Testing**:

```typescript
// domain/rules/OrderRules.unit.test.ts
import { describe, it } from "@effect/vitest"
import * as fc from "fast-check"
import { calculateShippingCost } from "./OrderRules"

describe("OrderRules - Property-Based Tests", () => {
  it("shipping cost should never be negative", () => {
    fc.assert(
      fc.property(
        fc.record({
          totalAmount: fc.nat(10000),
          itemCount: fc.nat(100),
          weight: fc.nat(1000)
        }),
        fc.record({
          distance: fc.nat(5000),
          zone: fc.constantFrom("domestic", "international")
        }),
        (order, address) => {
          const cost = calculateShippingCost(order, address)
          return cost >= 0
        }
      )
    )
  })
  
  it("shipping cost should increase with distance", () => {
    fc.assert(
      fc.property(
        fc.record({
          totalAmount: fc.constant(100),
          itemCount: fc.constant(1),
          weight: fc.constant(10)
        }),
        fc.nat({ max: 1000 }),
        fc.nat({ max: 1000 }),
        (order, distance1, distance2) => {
          const cost1 = calculateShippingCost(order, { distance: distance1 })
          const cost2 = calculateShippingCost(order, { distance: distance2 })
          
          if (distance1 < distance2) {
            return cost1 <= cost2
          }
          return true
        }
      )
    )
  })
})
```

---

#### 1.2 Focus

Domain layer tests focus on business rule correctness:

**Business Rule Correctness**:

```typescript
describe("Order.confirm - Business Rules", () => {
  it("should only confirm pending orders", () => {
    const pending = new Order({ status: "pending", items: [item1] })
    expect(() => pending.confirm()).not.toThrow()
    
    const confirmed = new Order({ status: "confirmed", items: [item1] })
    expect(() => confirmed.confirm()).toThrow("Order already confirmed")
    
    const shipped = new Order({ status: "shipped", items: [item1] })
    expect(() => shipped.confirm()).toThrow("Cannot confirm shipped order")
  })
  
  it("should not confirm orders without items", () => {
    const emptyOrder = new Order({ status: "pending", items: [] })
    expect(() => emptyOrder.confirm()).toThrow("Cannot confirm empty order")
  })
  
  it("should not confirm orders with invalid items", () => {
    const invalidOrder = new Order({
      status: "pending",
      items: [{ sku: "", price: -10, quantity: 0 }]
    })
    expect(() => invalidOrder.confirm()).toThrow("Invalid order items")
  })
})
```

**Edge Cases and Boundaries**:

```typescript
describe("calculateDiscount - Edge Cases", () => {
  it("should handle zero-priced items", () => {
    const order = new Order({
      items: [{ sku: "FREE", price: 0, quantity: 100 }]
    })
    
    const discount = calculateDiscount(order)
    expect(discount).toEqual(Discount.none())
  })
  
  it("should handle exactly at threshold", () => {
    const order = new Order({
      items: [{ sku: "ABC", price: 1000, quantity: 1 }]
    })
    
    const discount = calculateDiscount(order)
    expect(discount).toEqual(Discount.percentage(10))
  })
  
  it("should handle one below threshold", () => {
    const order = new Order({
      items: [{ sku: "ABC", price: 999, quantity: 1 }]
    })
    
    const discount = calculateDiscount(order)
    expect(discount).toEqual(Discount.none())
  })
})
```

**Invalid State Prevention**:

```typescript
describe("Order Invariants", () => {
  it("should not allow invalid status transitions", () => {
    const order = new Order({ status: "pending" })
    
    // Valid transitions
    expect(() => order.transitionTo("confirmed")).not.toThrow()
    expect(() => order.transitionTo("cancelled")).not.toThrow()
    
    // Invalid transitions
    expect(() => order.transitionTo("shipped")).toThrow(
      "Cannot transition from pending to shipped"
    )
  })
  
  it("should maintain positive total amount", () => {
    expect(() => new Order({ totalAmount: -100 })).toThrow(
      "Total amount cannot be negative"
    )
  })
  
  it("should not allow null or undefined required fields", () => {
    expect(() => new Order({ id: null })).toThrow()
    expect(() => new Order({ id: undefined })).toThrow()
  })
})
```

**Calculation Accuracy**:

```typescript
describe("Tax Calculation Accuracy", () => {
  it("should calculate tax correctly with standard rate", () => {
    const amount = Money(100)
    const rate = 0.08 // 8%
    
    const tax = calculateTax(amount, rate)
    
    expect(Money.toNumber(tax)).toBe(8)
  })
  
  it("should round tax correctly", () => {
    const amount = Money(100)
    const rate = 0.083 // 8.3%
    
    const tax = calculateTax(amount, rate)
    
    // Should round to 2 decimal places
    expect(Money.toNumber(tax)).toBe(8.30)
  })
  
  it("should handle zero tax rate", () => {
    const amount = Money(100)
    const rate = 0
    
    const tax = calculateTax(amount, rate)
    
    expect(Money.toNumber(tax)).toBe(0)
  })
})
```

---

### 2. Application Layer Testing

#### 2.1 Approach

The application layer orchestrates business logic and requires testing with fakes:

**Testing Strategy**:
- **Contract Tests with Fakes**: Use full-featured in-memory implementations
- **Verify Orchestration Logic**: Test service coordination
- **Error Handling Paths**: Test error propagation
- **Full In-Memory Implementations**: Use Ref/Map for state

**Example - Contract Tests with Fakes**:

```typescript
// application/services/CompleteTask/CompleteTask.service.contract.test.ts
import { Effect, Layer } from "effect"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { CompleteTaskService } from "./CompleteTask.service"
import { TaskRepositoryFake } from "../../../ports/secondary/TaskRepository/TaskRepository.port.fake"
import { EmailServiceFake } from "../../../ports/secondary/EmailService/EmailService.port.fake"
import { EventBusFake } from "../../../ports/secondary/EventBus/EventBus.port.fake"

const TestLayer = Layer.mergeAll(
  CompleteTaskService.Default,
  TaskRepositoryFake,
  EmailServiceFake,
  EventBusFake
)

describe("CompleteTaskService - Application Layer Tests", () => {
  it.effect("should orchestrate task completion workflow", () =>
    Effect.gen(function* () {
      const taskRepo = yield* TaskRepository
      const emailService = yield* EmailService
      const eventBus = yield* EventBus
      const completeTask = yield* CompleteTaskService
      
      // Setup
      const task = new Task({
        id: TaskId.make("1"),
        title: "Test Task",
        status: "pending",
        createdAt: new Date()
      })
      yield* taskRepo.save(task)
      
      // Execute
      yield* completeTask.execute(task.id)
      
      // Verify orchestration:
      
      // 1. Task status updated
      const updated = yield* taskRepo.findById(task.id)
      assert.strictEqual(updated.status, "completed")
      
      // 2. Email sent
      const emails = yield* emailService.getSentEmails()
      assert.strictEqual(emails.length, 1)
      assert.strictEqual(emails[0].taskId, task.id)
      
      // 3. Event published
      const events = yield* eventBus.getPublishedEvents()
      assert.strictEqual(events.length, 1)
      assert.strictEqual(events[0]._tag, "TaskCompleted")
      assert.strictEqual(events[0].taskId, task.id)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

#### 2.2 Focus

Application layer tests focus on use case completeness and coordination:

**Use Case Completeness**:

```typescript
describe("CreateOrder Use Case - Completeness", () => {
  it.effect("should complete full order creation workflow", () =>
    Effect.gen(function* () {
      const createOrder = yield* CreateOrderCommand
      const orders = yield* OrderRepository
      const inventory = yield* InventoryService
      const payment = yield* PaymentService
      const email = yield* EmailService
      
      // Execute complete workflow
      const orderId = yield* createOrder.execute([
        { sku: "ABC", quantity: 2 }
      ])
      
      // Verify all steps completed:
      
      // 1. Inventory reserved
      const stock = yield* inventory.getStock("ABC")
      assert.strictEqual(stock.reserved, 2)
      
      // 2. Payment processed
      const payments = yield* payment.getChargeHistory()
      assert.strictEqual(payments.length, 1)
      
      // 3. Order persisted
      const order = yield* orders.findById(orderId)
      assert.strictEqual(order.status, "confirmed")
      
      // 4. Confirmation email sent
      const emails = yield* email.getSentEmails()
      assert.isTrue(emails.some(e => e.orderId === orderId))
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Port Interactions**:

```typescript
describe("ProcessCheckout - Port Interactions", () => {
  it.effect("should interact with all required ports", () =>
    Effect.gen(function* () {
      const checkout = yield* ProcessCheckoutService
      const cart = yield* CartRepository
      const inventory = yield* InventoryService
      const payment = yield* PaymentService
      const orders = yield* OrderRepository
      const email = yield* EmailService
      
      // Setup cart
      yield* cart.addItem(userId, { sku: "ABC", quantity: 1 })
      
      // Execute
      yield* checkout.execute(userId, "tok_123")
      
      // Verify each port was called correctly:
      
      // CartRepository: Cart retrieved and cleared
      const finalCart = yield* cart.getCart(userId)
      assert.strictEqual(finalCart.items.length, 0)
      
      // InventoryService: Items reserved
      const reservations = yield* inventory.getReservations()
      assert.strictEqual(reservations.length, 1)
      
      // PaymentService: Payment charged
      const charges = yield* payment.getCharges()
      assert.strictEqual(charges.length, 1)
      
      // OrderRepository: Order saved
      const orders = yield* orders.findByUser(userId)
      assert.strictEqual(orders.length, 1)
      
      // EmailService: Confirmation sent
      const emails = yield* email.getSentEmails()
      assert.strictEqual(emails.length, 1)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Transaction Boundaries**:

```typescript
describe("TransferFunds - Transaction Boundaries", () => {
  it.effect("should commit transaction on success", () =>
    Effect.gen(function* () {
      const transfer = yield* TransferFundsService
      const accounts = yield* AccountRepository
      
      const account1 = yield* accounts.create({ balance: 1000 })
      const account2 = yield* accounts.create({ balance: 500 })
      
      yield* transfer.execute({
        from: account1.id,
        to: account2.id,
        amount: 200
      })
      
      // Both accounts updated atomically
      const updated1 = yield* accounts.findById(account1.id)
      const updated2 = yield* accounts.findById(account2.id)
      
      assert.strictEqual(updated1.balance, 800)
      assert.strictEqual(updated2.balance, 700)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should rollback transaction on failure", () =>
    Effect.gen(function* () {
      const transfer = yield* TransferFundsService
      const accounts = yield* AccountRepository
      
      const account1 = yield* accounts.create({ balance: 100 })
      const account2 = yield* accounts.create({ balance: 500 })
      
      // Insufficient funds - should fail
      const exit = yield* Effect.exit(
        transfer.execute({
          from: account1.id,
          to: account2.id,
          amount: 200
        })
      )
      
      assert.isTrue(Exit.isFailure(exit))
      
      // Neither account changed
      const unchanged1 = yield* accounts.findById(account1.id)
      const unchanged2 = yield* accounts.findById(account2.id)
      
      assert.strictEqual(unchanged1.balance, 100)
      assert.strictEqual(unchanged2.balance, 500)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Error Propagation**:

```typescript
describe("OrderService - Error Propagation", () => {
  it.effect("should propagate inventory errors", () =>
    Effect.gen(function* () {
      const createOrder = yield* CreateOrderCommand
      const inventory = yield* InventoryService
      
      // Setup: Out of stock
      yield* inventory.setStock("ABC", 0)
      
      const exit = yield* Effect.exit(
        createOrder.execute([{ sku: "ABC", quantity: 1 }])
      )
      
      assert.isTrue(Exit.isFailure(exit))
      
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause)
        assert.isTrue(Option.isSome(error))
        assert.instanceOf(Option.getOrThrow(error), OutOfStockError)
      }
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should propagate payment errors", () =>
    Effect.gen(function* () {
      const createOrder = yield* CreateOrderCommand
      const payment = yield* PaymentService
      
      // Setup: Payment will fail
      yield* payment.setFailureMode(true)
      
      const exit = yield* Effect.exit(
        createOrder.execute([{ sku: "ABC", quantity: 1 }])
      )
      
      assert.isTrue(Exit.isFailure(exit))
      
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause)
        assert.instanceOf(Option.getOrThrow(error), PaymentDeclinedError)
      }
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

### 3. Infrastructure Layer Testing

#### 3.1 Approach

The infrastructure layer implements ports and requires testing against real systems:

**Testing Strategy**:
- **Integration Tests with Real Systems**: Use test databases, test APIs
- **Contract Compliance**: Ensure adapters satisfy port contracts
- **Adapter-Specific Behavior**: Test technology-specific logic
- **Resource Management**: Verify proper cleanup

**Example - Integration Tests with Real Systems**:

```typescript
// infrastructure/persistence/TaskRepository.postgres.integration.test.ts
import { Effect, Layer } from "effect"
import { describe, it, beforeEach, afterEach } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { TaskRepositoryPostgresLive } from "./TaskRepository.postgres"
import { TestDatabaseLayer } from "../../../test/fixtures/TestDatabase"

const TestLayer = Layer.mergeAll(
  TaskRepositoryPostgresLive,
  TestDatabaseLayer  // Real PostgreSQL test database
)

describe("TaskRepository PostgreSQL - Integration Tests", () => {
  beforeEach.effect(() =>
    Effect.gen(function* () {
      const db = yield* TestDatabase
      yield* db.truncate("tasks")  // Clean slate
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should persist task to PostgreSQL", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      const task = new Task({
        id: TaskId.make("1"),
        title: "Test Task",
        status: "pending",
        createdAt: new Date()
      })
      
      yield* repo.save(task)
      
      // Verify in database
      const saved = yield* repo.findById(task.id)
      assert.deepEqual(saved, task)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should handle PostgreSQL-specific types", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      const task = new Task({
        id: TaskId.make("1"),
        title: "Test",
        status: "pending",
        createdAt: new Date("2025-01-01T00:00:00Z"),
        metadata: { tags: ["important", "urgent"] }  // JSONB in Postgres
      })
      
      yield* repo.save(task)
      const retrieved = yield* repo.findById(task.id)
      
      // Verify JSON serialization/deserialization
      assert.deepEqual(retrieved.metadata, task.metadata)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should handle concurrent updates correctly", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      const task = new Task({
        id: TaskId.make("1"),
        title: "Test",
        status: "pending",
        createdAt: new Date()
      })
      
      yield* repo.save(task)
      
      // Concurrent updates
      yield* Effect.all([
        repo.save(new Task({ ...task, title: "Update 1" })),
        repo.save(new Task({ ...task, title: "Update 2" }))
      ], { concurrency: "unbounded" })
      
      // Last write wins (or use optimistic locking)
      const final = yield* repo.findById(task.id)
      assert.isTrue(["Update 1", "Update 2"].includes(final.title))
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

#### 3.2 Focus

Infrastructure layer tests focus on adapter correctness:

**Port Implementation Correctness**:

```typescript
describe("TaskRepository Postgres - Port Contract Compliance", () => {
  it.effect("should satisfy TaskRepository.findById contract", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      // Save task
      const task = createTestTask()
      yield* repo.save(task)
      
      // findById should return exact task
      const found = yield* repo.findById(task.id)
      assert.deepEqual(found, task)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should satisfy TaskRepository error contract", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      // findById should fail with TaskNotFoundError
      const exit = yield* Effect.exit(
        repo.findById(TaskId.make("non-existent"))
      )
      
      assert.isTrue(Exit.isFailure(exit))
      
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause)
        assert.instanceOf(Option.getOrThrow(error), TaskNotFoundError)
      }
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Technology-Specific Logic**:

```typescript
describe("TaskRepository Postgres - Technology-Specific Features", () => {
  it.effect("should use PostgreSQL RETURNING clause", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      const db = yield* TestDatabase
      
      const task = createTestTask()
      
      // PostgreSQL adapter uses RETURNING *
      yield* repo.save(task)
      
      // Verify query used RETURNING
      const queryLog = yield* db.getQueryLog()
      assert.isTrue(
        queryLog.some(q => q.includes("RETURNING *"))
      )
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should use PostgreSQL JSONB operators", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      yield* repo.save(createTestTask({
        metadata: { priority: "high", tags: ["urgent"] }
      }))
      
      // Use JSONB query
      const urgent = yield* repo.findByMetadata({ tags: ["urgent"] })
      
      assert.strictEqual(urgent.length, 1)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should handle PostgreSQL connection pooling", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      // Multiple concurrent operations
      yield* Effect.all(
        Array.from({ length: 20 }, (_, i) =>
          repo.save(createTestTask({ id: TaskId.make(`task-${i}`) }))
        ),
        { concurrency: "unbounded" }
      )
      
      // All should succeed without exhausting pool
      const all = yield* repo.findAll()
      assert.strictEqual(all.length, 20)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Resource Management**:

```typescript
describe("TaskRepository Postgres - Resource Management", () => {
  it.effect("should clean up connections on scope close", () =>
    Effect.gen(function* () {
      const connectionsBefore = yield* TestDatabase.getActiveConnections()
      
      // Create scoped repository
      yield* Effect.scoped(
        Effect.gen(function* () {
          const repo = yield* TaskRepository
          yield* repo.save(createTestTask())
        })
      )
      
      // Connections should be released
      const connectionsAfter = yield* TestDatabase.getActiveConnections()
      assert.strictEqual(connectionsBefore, connectionsAfter)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should handle connection failures gracefully", () =>
    Effect.gen(function* () {
      const db = yield* TestDatabase
      
      // Simulate connection failure
      yield* db.simulateNetworkFailure()
      
      const repo = yield* TaskRepository
      const exit = yield* Effect.exit(repo.findAll())
      
      assert.isTrue(Exit.isFailure(exit))
      
      // Restore connection
      yield* db.restoreNetwork()
      
      // Should work again
      const working = yield* repo.findAll()
      assert.isDefined(working)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Error Mapping**:

```typescript
describe("TaskRepository Postgres - Error Mapping", () => {
  it.effect("should map constraint violations to domain errors", () =>
    Effect.gen(function* () {
      const repo = yield* TaskRepository
      
      const task = createTestTask()
      yield* repo.save(task)
      
      // Try to save duplicate ID
      const exit = yield* Effect.exit(repo.save(task))
      
      assert.isTrue(Exit.isFailure(exit))
      
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause)
        // PostgreSQL unique constraint mapped to domain error
        assert.instanceOf(Option.getOrThrow(error), DuplicateTaskError)
      }
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should map connection errors to infrastructure errors", () =>
    Effect.gen(function* () {
      const db = yield* TestDatabase
      yield* db.disconnect()
      
      const repo = yield* TaskRepository
      const exit = yield* Effect.exit(repo.findAll())
      
      assert.isTrue(Exit.isFailure(exit))
      
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause)
        assert.instanceOf(Option.getOrThrow(error), DatabaseConnectionError)
      }
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

### 4. Entrypoints Layer Testing

#### 4.1 Approach

The entrypoints layer translates external protocols and requires E2E testing:

**Testing Strategy**:
- **E2E Tests with Test Infrastructure**: Full stack with fake infrastructure
- **Full Request/Response Cycles**: Test complete flows
- **Swap Infrastructure Layer**: Use test doubles for speed
- **Real Protocol Handling**: Test HTTP, GraphQL, CLI, etc.

**Example - E2E Tests with Test Infrastructure**:

```typescript
// adapters/primary/http/OrderApi.http-adapter.system.test.ts
import { Effect, Layer } from "effect"
import { HttpClient, HttpServer } from "@effect/platform"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"

const TestLayer = Layer.mergeAll(
  // Real HTTP adapter
  OrderApiLive,
  HttpServerTestLayer,
  
  // Real application services
  OrderServiceLive,
  InventoryServiceLive,
  PaymentServiceLive,
  
  // Fake infrastructure
  OrderRepositoryMemoryLive,
  InventoryRepositoryMemoryLive,
  PaymentGatewayMockLive,
  EmailServiceFakeLive
)

describe("Order HTTP API - System Tests", () => {
  it.effect("should complete full order creation via HTTP", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      // POST /orders
      const response = yield* client.post("http://localhost:3000/orders", {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            { sku: "ABC", price: 100, quantity: 2 }
          ]
        })
      })
      
      assert.strictEqual(response.status, 201)
      
      const body = yield* response.json
      assert.isDefined(body.orderId)
      assert.strictEqual(body.totalAmount, 200)
      assert.strictEqual(body.status, "confirmed")
      
      // Verify order is retrievable
      const getResponse = yield* client.get(
        `http://localhost:3000/orders/${body.orderId}`
      )
      
      assert.strictEqual(getResponse.status, 200)
      
      const getBody = yield* getResponse.json
      assert.strictEqual(getBody.id, body.orderId)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

#### 4.2 Focus

Entrypoints layer tests focus on protocol translation and complete user flows:

**Protocol Translation Accuracy**:

```typescript
describe("Order HTTP API - Protocol Translation", () => {
  it.effect("should translate HTTP request to domain command", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      const response = yield* client.post("/orders", {
        body: JSON.stringify({
          items: [{ sku: "ABC", quantity: 2 }]
        })
      })
      
      // HTTP → Domain translation verified
      const body = yield* response.json
      assert.isDefined(body.orderId)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should translate domain response to HTTP", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      const response = yield* client.get("/orders/order-123")
      
      assert.strictEqual(response.status, 200)
      assert.strictEqual(response.headers["content-type"], "application/json")
      
      // Domain → HTTP translation verified
      const body = yield* response.json
      assert.strictEqual(body.id, "order-123")
      assert.strictEqual(body.status, "pending")
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Error Response Formatting**:

```typescript
describe("Order HTTP API - Error Responses", () => {
  it.effect("should return 404 for not found errors", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      const response = yield* client.get("/orders/non-existent")
      
      assert.strictEqual(response.status, 404)
      
      const body = yield* response.json
      assert.strictEqual(body.error, "Order not found")
      assert.strictEqual(body.orderId, "non-existent")
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should return 400 for validation errors", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      const response = yield* client.post("/orders", {
        body: JSON.stringify({ items: [] })  // Invalid: empty
      })
      
      assert.strictEqual(response.status, 400)
      
      const body = yield* response.json
      assert.strictEqual(body.error, "Validation failed")
      assert.isDefined(body.details)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should return 500 for unexpected errors", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const db = yield* TestDatabase
      
      // Simulate system failure
      yield* db.simulateFailure()
      
      const response = yield* client.post("/orders", {
        body: JSON.stringify({
          items: [{ sku: "ABC", quantity: 1 }]
        })
      })
      
      assert.strictEqual(response.status, 500)
      
      const body = yield* response.json
      assert.strictEqual(body.error, "Internal server error")
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Authentication/Authorization**:

```typescript
describe("Order HTTP API - Authentication", () => {
  it.effect("should require authentication", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      // No auth header
      const response = yield* client.get("/orders")
      
      assert.strictEqual(response.status, 401)
      
      const body = yield* response.json
      assert.strictEqual(body.error, "Authentication required")
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should accept valid JWT token", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const auth = yield* AuthService
      
      const token = yield* auth.generateToken(userId)
      
      const response = yield* client.get("/orders", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      assert.strictEqual(response.status, 200)
    }).pipe(Effect.provide(TestLayer))
  )
  
  it.effect("should check authorization for protected resources", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const auth = yield* AuthService
      
      const token = yield* auth.generateToken(regularUserId)
      
      // Try to access admin endpoint
      const response = yield* client.get("/admin/orders", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      assert.strictEqual(response.status, 403)
      
      const body = yield* response.json
      assert.strictEqual(body.error, "Insufficient permissions")
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Complete User Flows**:

```typescript
describe("Complete E2E User Flows", () => {
  it.effect("should complete full checkout flow", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const auth = yield* AuthService
      
      // 1. Authenticate
      const loginResponse = yield* client.post("/auth/login", {
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123"
        })
      })
      
      const { token } = yield* loginResponse.json
      const headers = { "Authorization": `Bearer ${token}` }
      
      // 2. Add items to cart
      yield* client.post("/cart/items", {
        headers,
        body: JSON.stringify({ sku: "ABC", quantity: 2 })
      })
      
      yield* client.post("/cart/items", {
        headers,
        body: JSON.stringify({ sku: "DEF", quantity: 1 })
      })
      
      // 3. Get cart
      const cartResponse = yield* client.get("/cart", { headers })
      const cart = yield* cartResponse.json
      
      assert.strictEqual(cart.items.length, 2)
      assert.strictEqual(cart.totalAmount, 250)
      
      // 4. Checkout
      const checkoutResponse = yield* client.post("/checkout", {
        headers,
        body: JSON.stringify({
          paymentToken: "tok_123",
          shippingAddress: {
            street: "123 Main St",
            city: "City",
            zip: "12345"
          }
        })
      })
      
      assert.strictEqual(checkoutResponse.status, 200)
      
      const { orderId } = yield* checkoutResponse.json
      
      // 5. Verify order
      const orderResponse = yield* client.get(`/orders/${orderId}`, { headers })
      const order = yield* orderResponse.json
      
      assert.strictEqual(order.status, "confirmed")
      assert.strictEqual(order.totalAmount, 250)
      
      // 6. Verify cart cleared
      const finalCartResponse = yield* client.get("/cart", { headers })
      const finalCart = yield* finalCartResponse.json
      
      assert.strictEqual(finalCart.items.length, 0)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

## C. Test Double Taxonomy

Test doubles come in different forms, each with specific characteristics and use cases.

### 1. Fake Implementations

#### 1.1 Characteristics

Fakes are fully-functional implementations that work but use shortcuts:

**Core Properties**:
- **Fully Functional**: Complete working implementation
- **Production-Quality Alternative**: Can be used as default
- **Must Pass All Contract Tests**: Implements full contract
- **Rich State Management**: Uses Ref/Map for state
- **Complex Logic**: Includes business logic matching real adapter

**Example - Fully Functional Fake**:

```typescript
// ports/secondary/OrderRepository/OrderRepository.port.fake.ts
import { Effect, Layer, Ref } from "effect"
import { OrderRepository } from "./OrderRepository.port"
import { Order, OrderId } from "../../../domain/models/Order.model"

/**
 * FAKE: OrderRepository
 * 
 * Fully-functional in-memory implementation.
 * MUST pass all contract tests.
 * Production-quality alternative to real database.
 */
export const OrderRepositoryFake = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    // Rich state management
    const orders = yield* Ref.make(new Map<OrderId, Order>())
    const deletedIds = yield* Ref.make(new Set<OrderId>())
    const callLog = yield* Ref.make<Array<{ method: string; args: unknown[] }>>([])
    
    const logCall = (method: string, ...args: unknown[]) =>
      Ref.update(callLog, (log) => [...log, { method, args }])
    
    return OrderRepository.of({
      save: (order: Order) =>
        Effect.gen(function* () {
          yield* logCall("save", order)
          
          // Check not deleted
          const deleted = yield* Ref.get(deletedIds)
          if (deleted.has(order.id)) {
            return yield* Effect.fail(
              new InvalidOperationError({ reason: "Order was deleted" })
            )
          }
          
          // Save with validation
          if (!order.id || !order.items.length) {
            return yield* Effect.fail(new ValidationError())
          }
          
          yield* Ref.update(orders, (map) => new Map(map).set(order.id, order))
        }),
      
      findById: (id: OrderId) =>
        Effect.gen(function* () {
          yield* logCall("findById", id)
          
          const map = yield* Ref.get(orders)
          const deleted = yield* Ref.get(deletedIds)
          
          if (deleted.has(id)) {
            return yield* Effect.fail(new OrderNotFoundError({ orderId: id }))
          }
          
          const order = map.get(id)
          if (!order) {
            return yield* Effect.fail(new OrderNotFoundError({ orderId: id }))
          }
          
          return order
        }),
      
      findByUser: (userId: UserId) =>
        Effect.gen(function* () {
          yield* logCall("findByUser", userId)
          
          const map = yield* Ref.get(orders)
          const deleted = yield* Ref.get(deletedIds)
          
          return Array.from(map.values())
            .filter(o => !deleted.has(o.id) && o.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        }),
      
      findByStatus: (status: OrderStatus) =>
        Effect.gen(function* () {
          yield* logCall("findByStatus", status)
          
          const map = yield* Ref.get(orders)
          const deleted = yield* Ref.get(deletedIds)
          
          return Array.from(map.values())
            .filter(o => !deleted.has(o.id) && o.status === status)
        }),
      
      update: (order: Order) =>
        Effect.gen(function* () {
          yield* logCall("update", order)
          
          const map = yield* Ref.get(orders)
          if (!map.has(order.id)) {
            return yield* Effect.fail(new OrderNotFoundError({ orderId: order.id }))
          }
          
          yield* Ref.update(orders, (m) => new Map(m).set(order.id, order))
        }),
      
      delete: (id: OrderId) =>
        Effect.gen(function* () {
          yield* logCall("delete", id)
          
          const map = yield* Ref.get(orders)
          if (!map.has(id)) {
            return yield* Effect.fail(new OrderNotFoundError({ orderId: id }))
          }
          
          yield* Ref.update(deletedIds, (set) => new Set(set).add(id))
          yield* Ref.update(orders, (map) => {
            const newMap = new Map(map)
            newMap.delete(id)
            return newMap
          })
        }),
      
      findAll: () =>
        Effect.gen(function* () {
          yield* logCall("findAll")
          
          const map = yield* Ref.get(orders)
          const deleted = yield* Ref.get(deletedIds)
          
          return Array.from(map.values())
            .filter(o => !deleted.has(o.id))
        })
    })
  })
)

// Test helpers (not part of port interface)
export const OrderRepositoryFakeHelpers = {
  getCallLog: () => Effect.flatMap(callLog, Ref.get),
  getOrders: () => Effect.flatMap(orders, Ref.get),
  getDeletedIds: () => Effect.flatMap(deletedIds, Ref.get),
  clear: () => Effect.all([
    Ref.set(orders, new Map()),
    Ref.set(deletedIds, new Set()),
    Ref.set(callLog, [])
  ])
}
```

---

#### 1.2 Usage

Fakes are used when you need production-quality alternatives:

**Contract Tests**:

```typescript
// All contract tests run against the fake
describe("OrderRepository - Contract Tests", () => {
  it.effect("MUST save and retrieve order", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      
      const order = createTestOrder()
      yield* repo.save(order)
      
      const retrieved = yield* repo.findById(order.id)
      assert.deepEqual(retrieved, order)
    }).pipe(Effect.provide(OrderRepositoryFake))  // Use fake
  )
})
```

**Fast Integration Tests**:

```typescript
// Integration tests use fakes for speed
const TestLayer = Layer.mergeAll(
  OrderServiceLive,              // Real service
  OrderRepositoryFake,           // Fake repository
  PaymentGatewayMock,            // Mock gateway
  EmailServiceFake               // Fake email
)

describe("OrderService - Integration Tests", () => {
  it.effect("should create order", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      const order = yield* service.createOrder([item1, item2])
      assert.isDefined(order.id)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Default Test Layer**:

```typescript
// Fakes as default for testing
export const TestingLayer = Layer.mergeAll(
  OrderServiceLive,
  UserServiceLive,
  OrderRepositoryFake,          // Default: Fake
  UserRepositoryFake,           // Default: Fake
  EmailServiceFake              // Default: Fake
)
```

**Development Environments**:

```typescript
// Use fakes in development for fast feedback
export const DevelopmentLayer = Layer.mergeAll(
  OrderServiceLive,
  OrderRepositoryMemory,        // Fast in-memory
  PaymentGatewayMock,           // No real charges
  EmailServiceConsole           // Log to console
)
```

---

### 2. Mock Implementations

#### 2.1 Characteristics

Mocks are simplified implementations with canned responses:

**Core Properties**:
- **Canned Responses**: Predefined return values
- **Minimal Behavior**: Just enough to make tests pass
- **No State Management**: Usually stateless
- **Simple Layer.succeed**: Often just `Layer.succeed`

**Example - Mock with Canned Responses**:

```typescript
// infrastructure/external/PaymentGateway.mock.ts

/**
 * MOCK: PaymentGateway
 * 
 * Simple canned responses for testing.
 * Used when payment behavior doesn't matter.
 */
export const PaymentGatewayMock = Layer.succeed(
  PaymentGateway,
  PaymentGateway.of({
    charge: (amount: Money, token: string) =>
      Effect.succeed(new PaymentReceipt({
        id: `mock-receipt-${crypto.randomUUID()}`,
        amount,
        status: "succeeded",
        chargedAt: new Date()
      })),
    
    refund: (receiptId: string) =>
      Effect.logInfo(`[MOCK] Would refund ${receiptId}`).pipe(
        Effect.as(void 0)
      ),
    
    getCharge: (receiptId: string) =>
      Effect.succeed(new Charge({
        id: receiptId,
        amount: Money(100),
        status: "succeeded"
      }))
  })
)
```

**Configurable Mock**:

```typescript
// Mock with configurable behavior
export const makePaymentGatewayMock = (options: {
  shouldFail?: boolean
  delay?: Duration
} = {}) =>
  Layer.succeed(
    PaymentGateway,
    PaymentGateway.of({
      charge: (amount, token) =>
        Effect.gen(function* () {
          // Optional delay
          if (options.delay) {
            yield* Effect.sleep(options.delay)
          }
          
          // Optional failure
          if (options.shouldFail) {
            return yield* Effect.fail(
              new PaymentDeclinedError({ reason: "Mock configured to fail" })
            )
          }
          
          return new PaymentReceipt({
            id: `mock-${crypto.randomUUID()}`,
            amount,
            status: "succeeded",
            chargedAt: new Date()
          })
        })
    })
  )

// Usage
const TestLayer = Layer.mergeAll(
  OrderServiceLive,
  makePaymentGatewayMock({ shouldFail: true })  // Test failure case
)
```

---

#### 2.2 Usage

Mocks are used when behavior doesn't matter:

**When Behavior Doesn't Matter**:

```typescript
// Testing order creation, payment behavior irrelevant
describe("OrderService", () => {
  it.effect("should create order structure correctly", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      const order = yield* service.createOrder([
        { sku: "ABC", quantity: 1 }
      ])
      
      // We only care about order structure, not payment
      assert.strictEqual(order.items.length, 1)
      assert.strictEqual(order.status, "confirmed")
    }).pipe(
      Effect.provide(Layer.mergeAll(
        OrderServiceLive,
        OrderRepositoryFake,
        PaymentGatewayMock      // Mock is fine - we don't test payment
      ))
    )
  )
})
```

**Stub External Services**:

```typescript
// Stub external service that's not being tested
const TestLayer = Layer.mergeAll(
  OrderServiceLive,              // Test target
  OrderRepositoryFake,           // Real behavior needed
  PaymentGatewayMock,            // Just stub
  EmailServiceMock,              // Just stub
  ShippingServiceMock            // Just stub
)
```

**Verification Not Needed**:

```typescript
// When you don't need to verify service was called
describe("OrderService", () => {
  it.effect("should process order", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      yield* service.processOrder(orderId)
      
      // We don't care if email was sent, just that order processed
      const order = yield* OrderRepository.findById(orderId)
      assert.strictEqual(order.status, "processed")
    }).pipe(Effect.provide(TestLayer))  // EmailServiceMock doesn't track calls
  )
})
```

**Quick Test Setup**:

```typescript
// Quick test without complex setup
it.effect("should fail on invalid order", () =>
  Effect.gen(function* () {
    const service = yield* OrderService
    
    const exit = yield* Effect.exit(
      service.createOrder([])  // Invalid: empty
    )
    
    assert.isTrue(Exit.isFailure(exit))
  }).pipe(
    Effect.provide(Layer.mergeAll(
      OrderServiceLive,
      OrderRepositoryMock,    // Quick mock, don't need state
      PaymentGatewayMock      // Quick mock
    ))
  )
)
```

---

### 3. Memory Adapters

#### 3.1 Characteristics

Memory adapters are in-memory implementations with real behavior:

**Core Properties**:
- **In-Memory Storage**: Uses Map, Set, Array
- **Real Behavior**: Implements full port logic
- **Ephemeral State**: Lost on restart
- **Fast Performance**: No I/O overhead

**Example - Memory Adapter**:

```typescript
// infrastructure/persistence/OrderRepository.memory.ts

/**
 * MEMORY ADAPTER: OrderRepository
 * 
 * Fast in-memory storage with real behavior.
 * Ephemeral state for testing.
 */
export const OrderRepositoryMemoryLive = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    // In-memory storage using Ref
    const orders = yield* Ref.make(new Map<OrderId, Order>())
    const indices = yield* Ref.make({
      byUser: new Map<UserId, Set<OrderId>>(),
      byStatus: new Map<OrderStatus, Set<OrderId>>()
    })
    
    // Helper to update indices
    const updateIndices = (order: Order) =>
      Ref.update(indices, (idx) => {
        // Update user index
        const userOrders = idx.byUser.get(order.userId) || new Set()
        userOrders.add(order.id)
        idx.byUser.set(order.userId, userOrders)
        
        // Update status index
        const statusOrders = idx.byStatus.get(order.status) || new Set()
        statusOrders.add(order.id)
        idx.byStatus.set(order.status, statusOrders)
        
        return idx
      })
    
    return OrderRepository.of({
      save: (order: Order) =>
        Effect.gen(function* () {
          yield* Ref.update(orders, (map) => new Map(map).set(order.id, order))
          yield* updateIndices(order)
        }),
      
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
          const idx = yield* Ref.get(indices)
          const orderIds = idx.byUser.get(userId) || new Set()
          const map = yield* Ref.get(orders)
          
          return Array.from(orderIds)
            .map(id => map.get(id))
            .filter((order): order is Order => order !== undefined)
        }),
      
      findByStatus: (status: OrderStatus) =>
        Effect.gen(function* () {
          const idx = yield* Ref.get(indices)
          const orderIds = idx.byStatus.get(status) || new Set()
          const map = yield* Ref.get(orders)
          
          return Array.from(orderIds)
            .map(id => map.get(id))
            .filter((order): order is Order => order !== undefined)
        })
    })
  })
)
```

---

#### 3.2 Usage

Memory adapters are used when you need real behavior with speed:

**Integration Tests**:

```typescript
// Integration tests with memory adapters
const TestLayer = Layer.mergeAll(
  OrderServiceLive,
  InventoryServiceLive,
  OrderRepositoryMemoryLive,      // Memory for speed
  InventoryRepositoryMemoryLive,  // Memory for speed
  PaymentGatewayMock
)

describe("Order Processing - Integration Tests", () => {
  it.effect("should reserve inventory when creating order", () =>
    Effect.gen(function* () {
      const orders = yield* OrderService
      const inventory = yield* InventoryService
      
      yield* inventory.addStock("ABC", 10)
      
      yield* orders.createOrder([{ sku: "ABC", quantity: 2 }])
      
      const stock = yield* inventory.getStock("ABC")
      assert.strictEqual(stock.available, 8)
      assert.strictEqual(stock.reserved, 2)
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Local Development**:

```typescript
// Fast local development with memory storage
export const DevelopmentLayer = Layer.mergeAll(
  OrderServiceLive,
  OrderRepositoryMemoryLive,      // Fast startup
  UserRepositoryMemoryLive,       // No database needed
  EmailServiceConsoleLive         // Log to console
)
```

**CI/CD Pipelines**:

```typescript
// Fast CI tests with memory adapters
export const CILayer = Layer.mergeAll(
  OrderServiceLive,
  UserServiceLive,
  OrderRepositoryMemoryLive,      // No Docker needed
  UserRepositoryMemoryLive,       // No setup required
  EmailServiceFakeLive            // No external services
)
```

**Rapid Iteration**:

```typescript
// Quick iteration during development
const TestLayer = Layer.mergeAll(
  MyNewServiceLive,               // New service being developed
  OrderRepositoryMemoryLive,      // Fast, no setup
  UserRepositoryMemoryLive        // Fast, no setup
)

describe("MyNewService - Quick Tests", () => {
  it.effect("should work", () =>
    Effect.gen(function* () {
      // Rapid test iteration
      const service = yield* MyNewService
      yield* service.doSomething()
      // Test assertions
    }).pipe(Effect.provide(TestLayer))
  )
})
```

---

This completes Section IV (Testing Taxonomy). The content provides comprehensive coverage of testing strategies in Effect-TS hexagonal architecture, with practical examples for each test type, layer-specific approaches, and test double patterns.
