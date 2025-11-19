---
modified: 2025-11-04T01:06:30-03:00
---
# II. NAMING CONVENTIONS & TAXONOMY

## A. File Naming Conventions

File naming conventions encode architectural intent and make the structure self-documenting. Every file suffix should answer: What layer? What type? What variant? What test layer?

### 1. Domain Layer Files

#### 1.1 Suffixes

**`.model.ts` - Domain Entities with Business Logic**

Domain models represent business entities with behavior:

```typescript
// domain/models/Order.model.ts
import { Schema } from "@effect/schema"

export class Order extends Schema.Class<Order>("Order")({
  id: Schema.String,
  items: Schema.Array(OrderItem),
  totalAmount: Schema.Number,
  status: Schema.Literal("pending", "confirmed", "shipped")
}) {
  // Business methods
  confirm(): Order {
    if (this.items.length === 0) {
      throw new Error("Cannot confirm empty order");
    }
    return new Order({ ...this, status: "confirmed" });
  }
  
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

```typescript
// domain/models/Task.model.ts
export class Task extends Schema.Class<Task>("Task")({
  id: Schema.String.pipe(Schema.brand("TaskId")),
  title: Schema.String,
  status: Schema.Literal("pending", "completed"),
  createdAt: Schema.DateTimeUtc
}) {
  complete(): Task {
    return new Task({ ...this, status: "completed" });
  }
}
```

**Purpose**: Contains `Schema.Class` with business methods
**Location**: `domain/models/`
**Pattern**: `[EntityName].model.ts`

---

**`.error.ts` - Error Type Definitions**

Domain errors represent business failures:

```typescript
// domain/errors/OrderErrors.error.ts
import { Data } from "effect"

export class OrderNotFoundError extends Data.TaggedError("OrderNotFoundError")<{
  orderId: string
}> {}

export class InvalidOrderStateError extends Data.TaggedError("InvalidOrderStateError")<{
  orderId: string
  currentState: string
  attemptedTransition: string
}> {}
```

```typescript
// domain/errors/TaskErrors.error.ts
export class TaskNotFoundError extends Data.TaggedError("TaskNotFoundError")<{
  taskId: string
}> {}

export class InvalidTaskTransitionError extends Data.TaggedError("InvalidTaskTransition")<{
  from: string
  to: string
}> {}
```

**Purpose**: Contains `Data.TaggedError` classes
**Location**: `domain/errors/`
**Pattern**: `[Feature]Errors.error.ts`

---

**`.value.ts` - Value Objects and Branded Types**

Value objects represent domain concepts with identity based on value:

```typescript
// domain/value-objects/OrderId.value.ts
import { Brand } from "effect"

export type OrderId = string & Brand.Brand<"OrderId">
export const OrderId = Brand.nominal<OrderId>()
```

```typescript
// domain/value-objects/Money.value.ts
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
```

**Purpose**: Branded types, immutable values
**Location**: `domain/value-objects/`
**Pattern**: `[ValueObjectName].value.ts`

---

**`.model.unit.test.ts` - Pure Domain Logic Tests**

Tests for pure domain logic with no I/O:

```typescript
// domain/models/Order.model.unit.test.ts
import { describe, it, expect } from "@effect/vitest"
import { Order } from "./Order.model"

describe("Order", () => {
  it("should calculate total correctly", () => {
    const order = new Order({
      id: "order-1",
      items: [
        { price: 10, quantity: 2 },
        { price: 5, quantity: 3 }
      ],
      totalAmount: 0,
      status: "pending"
    })
    
    expect(order.calculateTotal()).toBe(35)
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
})
```

**Purpose**: Tests with no I/O
**Location**: Co-located with models
**Pattern**: `[EntityName].model.unit.test.ts`
**Speed**: Instant (<10ms)

---

### 2. Port Layer Files

#### 2.1 Suffixes

**`.port.ts` - Service/Repository Contract Interface**

Port definitions are pure interfaces with no implementation:

```typescript
// ports/secondary/OrderRepository/OrderRepository.port.ts
import { Effect, Context } from "effect"
import { Order } from "../../../domain/models/Order.model"
import { OrderNotFoundError } from "../../../domain/errors/OrderErrors.error"

/**
 * SECONDARY PORT: OrderRepository
 * 
 * Defines what the application needs for order persistence.
 * This is a CONTRACT ONLY - no implementation.
 * 
 * @layer Port (02-ports/secondary)
 * @type Secondary Port (Outbound)
 * @dependencies None (pure interface)
 */
export interface OrderRepository {
  readonly save: (order: Order) => Effect.Effect<void, DatabaseError>
  readonly findById: (id: string) => Effect.Effect<Order, OrderNotFoundError>
  readonly findByUser: (userId: string) => Effect.Effect<Order[]>
}

export class OrderRepository extends Context.Tag("OrderRepository")<
  OrderRepository,
  OrderRepository
>() {}
```

```typescript
// ports/primary/OrderService/OrderService.port.ts
export class OrderService extends Effect.Service<OrderService>()("app/ports/OrderService", {
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

**Purpose**: Effect.Service interface ONLY, no implementation
**Location**: `ports/primary/` or `ports/secondary/`
**Pattern**: `[ServiceName].port.ts`
**Rules**: Must use `Effect.die()` as placeholder, cannot import from layers 03-05

---

**`.port.contract.test.ts` - Contract Verification Tests**

Tests that verify port contracts using fakes:

```typescript
// ports/primary/OrderService/OrderService.port.contract.test.ts
import { Effect, Exit, Cause, Option } from "effect"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { OrderService } from "./OrderService.port"
import { OrderServiceFake } from "./OrderService.port.fake"

/**
 * CONTRACT TESTS: OrderService
 * 
 * These tests verify the contract, not the implementation.
 * They run against the FAKE to ensure the interface is testable.
 * 
 * @layer Port (02-ports/primary)
 * @test-type Contract
 * @test-double OrderServiceFake
 */
describe("OrderService.port - Contract Tests", () => {
  it.effect("MUST place an order with valid items", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      
      const order = yield* service.placeOrder([
        { sku: "ABC", price: 100, quantity: 1 }
      ])
      
      assert.strictEqual(order.status, "pending")
      assert.strictEqual(order.totalAmount, 100)
    }).pipe(Effect.provide(OrderServiceFake))
  )
  
  it.effect("MUST fail when placing order with empty items", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      const exit = yield* Effect.exit(service.placeOrder([]))
      
      assert.isTrue(Exit.isFailure(exit))
      
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause)
        assert.isTrue(Option.isSome(error))
        assert.instanceOf(Option.getOrThrow(error), OrderValidationError)
      }
    }).pipe(Effect.provide(OrderServiceFake))
  )
})
```

**Purpose**: Contract verification using test doubles
**Location**: Co-located with port definition
**Pattern**: `[ServiceName].port.contract.test.ts`
**Speed**: Very fast (<50ms)

---

**`.port.fake.ts` - Rich In-Memory Test Double**

Fakes are fully-functional in-memory implementations for testing:

```typescript
// ports/primary/OrderService/OrderService.port.fake.ts
import { Effect, Layer, Ref } from "effect"
import { OrderService } from "./OrderService.port"
import { Order } from "../../../domain/models/Order.model"

/**
 * FAKE: OrderService
 * 
 * Fully-functional in-memory implementation for testing.
 * This MUST pass all contract tests.
 * 
 * @layer Port (02-ports/primary)
 * @type Fake (Test Double)
 * @purpose Contract testing, fast integration tests
 */
export const OrderServiceFake = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    const orders = yield* Ref.make(new Map<string, Order>())
    const callLog = yield* Ref.make<Array<{ method: string; args: unknown[] }>>([])
    
    const logCall = (method: string, args: unknown[]) =>
      Ref.update(callLog, (log) => [...log, { method, args }])
    
    return OrderService.of({
      placeOrder: (items) =>
        Effect.gen(function* () {
          yield* logCall("placeOrder", [items])
          
          if (items.length === 0) {
            return yield* Effect.fail(
              new OrderValidationError({ reason: "empty items" })
            )
          }
          
          const order = new Order({
            id: crypto.randomUUID(),
            items,
            totalAmount: items.reduce((sum, item) => sum + item.price, 0),
            status: "pending"
          })
          
          yield* Ref.update(orders, (map) => map.set(order.id, order))
          return order
        }),
      
      getOrder: (id) =>
        Effect.gen(function* () {
          yield* logCall("getOrder", [id])
          
          const map = yield* Ref.get(orders)
          const order = map.get(id)
          
          if (!order) {
            return yield* Effect.fail(new OrderNotFoundError({ id }))
          }
          
          return order
        })
    })
  })
)

/**
 * TEST HELPERS
 * Expose internal state for assertions
 */
export const OrderServiceFakeHelpers = {
  getCallLog: Ref.get(callLog),
  getOrders: Ref.get(orders),
  clear: Effect.all([
    Ref.set(orders, new Map()),
    Ref.set(callLog, [])
  ])
}
```

**Purpose**: Full-featured fake using `Ref`/`Map`
**Location**: Co-located with port definition
**Pattern**: `[ServiceName].port.fake.ts`
**Characteristics**: Must pass all contract tests, production-quality alternative

---

### 3. Application Layer Files

#### 3.1 Suffixes

**`.service.ts` - Primary Port Implementation**

Service implementations contain business logic using secondary ports:

```typescript
// application/services/OrderService/OrderService.service.ts
import { Effect, Layer } from "effect"
import { OrderService } from "../../../ports/primary/OrderService/OrderService.port"
import { OrderRepository } from "../../../ports/secondary/OrderRepository/OrderRepository.port"
import { PaymentGateway } from "../../../ports/secondary/PaymentGateway/PaymentGateway.port"
import { Order } from "../../../domain/models/Order.model"

/**
 * SERVICE IMPLEMENTATION: OrderService
 * 
 * Implements the primary port using secondary ports.
 * Contains business logic and orchestration.
 * 
 * @layer Application (03-application)
 * @implements OrderService.port
 * @depends OrderRepository.port, PaymentGateway.port
 */
export const OrderServiceLive = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    // Acquire dependencies during layer construction
    const repository = yield* OrderRepository
    const payment = yield* PaymentGateway
    
    return OrderService.of({
      placeOrder: (items) =>
        Effect.gen(function* () {
          // Validate
          if (items.length === 0) {
            return yield* Effect.fail(
              new OrderValidationError({ reason: "empty items" })
            )
          }
          
          // Create domain entity
          const order = new Order({
            id: crypto.randomUUID(),
            items,
            totalAmount: items.reduce((sum, item) => sum + item.price, 0),
            status: "pending"
          })
          
          // Process payment
          yield* payment.charge(order.totalAmount, "token")
          
          // Confirm and persist
          const confirmed = order.confirm()
          yield* repository.save(confirmed)
          
          return confirmed
        }),
      
      getOrder: (id) => repository.findById(id)
    })
  })
)
```

**Purpose**: Primary port implementation using secondary ports
**Location**: `application/services/`
**Pattern**: `[ServiceName].service.ts`
**Characteristics**: Orchestration logic, depends on ports

---

**`.service.integration.test.ts` - Cross-Service Integration Tests**

Tests for service implementations with real dependencies:

```typescript
// application/services/OrderService/OrderService.service.integration.test.ts
import { Effect, Layer } from "effect"
import { describe, it } from "@effect/vitest"
import { assert } from "@effect/vitest"
import { OrderServiceLive } from "./OrderService.service"
import { OrderRepositoryMemoryLive } from "../../../infrastructure/persistence/OrderRepository.memory"
import { PaymentGatewayMockLive } from "../../../infrastructure/external/PaymentGateway.mock"

const TestLayer = Layer.mergeAll(
  OrderServiceLive,
  OrderRepositoryMemoryLive,
  PaymentGatewayMockLive
)

describe("OrderService - Integration Tests", () => {
  it.effect("should place order with valid items", () =>
    Effect.gen(function* () {
      const service = yield* OrderService
      const repo = yield* OrderRepository
      
      const order = yield* service.placeOrder([
        { sku: "ABC", price: 100, quantity: 1 }
      ])
      
      // Verify order was persisted
      const saved = yield* repo.findById(order.id)
      assert.deepEqual(saved, order)
      assert.strictEqual(saved.status, "confirmed")
    }).pipe(Effect.provide(TestLayer))
  )
})
```

**Purpose**: Tests with multiple real services
**Location**: Co-located with service implementation
**Pattern**: `[ServiceName].service.integration.test.ts`
**Speed**: Fast (<500ms)

---

### 4. Adapter Layer Files

#### 4.1 Primary Adapter Suffixes

**`.http-adapter.ts` - HTTP API Adapter**

HTTP adapters translate HTTP requests to domain operations:

```typescript
// adapters/primary/http/OrderApi.http-adapter.ts
import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "@effect/schema"

/**
 * PRIMARY ADAPTER: Order HTTP API
 * 
 * Translates HTTP requests to domain operations.
 * 
 * @layer Adapter (04-adapters/primary)
 * @type HTTP Adapter
 * @drives OrderService
 */
export class OrderApi extends HttpApiGroup.make("orders")
  .add(
    HttpApiEndpoint.post("createOrder", "/orders")
      .setPayload(Schema.Struct({
        items: Schema.Array(OrderItemSchema)
      }))
      .addSuccess(OrderSchema)
      .addError(OrderErrorSchema)
  )
{} {
  static Live = HttpApiBuilder.group(OrderApi, "orders", (handlers) =>
    handlers.handle("createOrder", ({ payload }) =>
      Effect.gen(function* () {
        const orderService = yield* OrderService
        return yield* orderService.placeOrder(payload.items)
      })
    )
  )
}
```

**Purpose**: HTTP entry point
**Location**: `adapters/primary/http/`
**Pattern**: `[ApiName].http-adapter.ts`

---

**`.cli-adapter.ts` - CLI Adapter**

CLI adapters translate command-line input to domain operations:

```typescript
// adapters/primary/cli/OrderCli.cli-adapter.ts
import { Command } from "@effect/cli"

/**
 * PRIMARY ADAPTER: Order CLI
 * 
 * Translates CLI commands to domain operations.
 * 
 * @layer Adapter (04-adapters/primary)
 * @type CLI Adapter
 * @drives OrderService
 */
export const createOrderCommand = Command.make("create-order")
  .pipe(
    Command.withHandler(({ args }) =>
      Effect.gen(function* () {
        const orderService = yield* OrderService
        const order = yield* orderService.placeOrder(args.items)
        yield* Console.log(`Order created: ${order.id}`)
      })
    )
  )
```

**Purpose**: CLI entry point
**Location**: `adapters/primary/cli/`
**Pattern**: `[CliName].cli-adapter.ts`

---

**`.grpc-adapter.ts` - gRPC Adapter**

gRPC adapters handle gRPC service definitions:

```typescript
// adapters/primary/grpc/OrderGrpc.grpc-adapter.ts

/**
 * PRIMARY ADAPTER: Order gRPC Service
 * 
 * @layer Adapter (04-adapters/primary)
 * @type gRPC Adapter
 */
export const OrderGrpcService = {
  createOrder: (call, callback) => {
    const program = Effect.gen(function* () {
      const orderService = yield* OrderService
      const order = yield* orderService.placeOrder(call.request.items)
      return { orderId: order.id }
    })
    
    Effect.runPromise(program.pipe(Effect.provide(layer)))
      .then((result) => callback(null, result))
      .catch((error) => callback(error, null))
  }
}
```

**Purpose**: gRPC service definitions
**Location**: `adapters/primary/grpc/`
**Pattern**: `[ServiceName].grpc-adapter.ts`

---

**`.http-adapter.system.test.ts` - End-to-End System Tests**

E2E tests through primary adapters:

```typescript
// adapters/primary/http/OrderApi.http-adapter.system.test.ts
import { test } from "@effect/vitest"
import { HttpClient } from "@effect/platform"

/**
 * SYSTEM TESTS: Order HTTP API
 * 
 * End-to-end tests through HTTP adapter.
 * 
 * @test-type System (E2E)
 */
describe("OrderApi - System Tests", () => {
  it.effect("POST /orders should create order", () =>
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      
      const response = yield* client.post("/orders", {
        body: { items: [{ sku: "ABC", price: 100, quantity: 1 }] }
      })
      
      assert.strictEqual(response.status, 201)
      assert.isDefined(response.body.id)
    }).pipe(Effect.provide(TestLayerWithHttp))
  )
})
```

**Purpose**: Full stack tests
**Location**: Co-located with adapter
**Pattern**: `[AdapterName].http-adapter.system.test.ts`
**Speed**: Moderate (<2s)

---

#### 4.2 Secondary Adapter Suffixes

**`.memory-adapter.ts` - In-Memory Adapter**

In-memory adapters provide fast, ephemeral storage:

```typescript
// adapters/secondary/persistence/OrderRepository/OrderRepository.memory-adapter.ts
import { Effect, Layer, Ref } from "effect"

/**
 * SECONDARY ADAPTER: Order Repository (In-Memory)
 * 
 * Fast, ephemeral in-memory storage for testing.
 * 
 * @layer Adapter (04-adapters/secondary)
 * @type Memory Adapter
 * @implements OrderRepository.port
 */
export const OrderRepositoryMemoryLive = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const storage = yield* Ref.make(new Map<string, Order>())
    
    return OrderRepository.of({
      save: (order) =>
        Ref.update(storage, (map) => map.set(order.id, order)),
      
      findById: (id) =>
        Effect.gen(function* () {
          const map = yield* Ref.get(storage)
          const order = map.get(id)
          if (!order) {
            return yield* Effect.fail(new OrderNotFoundError({ id }))
          }
          return order
        })
    })
  })
)
```

**Purpose**: Fast, ephemeral storage
**Location**: `adapters/secondary/persistence/`
**Pattern**: `[RepositoryName].memory-adapter.ts`

---

**`.postgres-adapter.ts` - PostgreSQL Adapter**

Database adapters implement repository ports with real databases:

```typescript
// adapters/secondary/persistence/OrderRepository/OrderRepository.postgres-adapter.ts
import { Effect, Layer } from "effect"
import { SqlClient } from "@effect/sql"

/**
 * SECONDARY ADAPTER: Order Repository (PostgreSQL)
 * 
 * Real database implementation using PostgreSQL.
 * 
 * @layer Adapter (04-adapters/secondary)
 * @type PostgreSQL Adapter
 * @implements OrderRepository.port
 */
const makePostgresAdapter = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  return OrderRepository.of({
    save: (order) =>
      sql`INSERT INTO orders ${sql.insert(order)}`.pipe(
        Effect.mapError((e) => new DatabaseError({ cause: e }))
      ),
    
    findById: (id) =>
      sql<Order>`SELECT * FROM orders WHERE id = ${id}`.pipe(
        Effect.flatMap(Schema.decodeUnknown(Order)),
        Effect.mapError((e) =>
          e instanceof ParseError
            ? new DatabaseError({ cause: e })
            : new OrderNotFoundError({ id })
        )
      )
  })
})

export const OrderRepositoryPostgresLive = Layer.effect(
  OrderRepository,
  makePostgresAdapter
).pipe(
  Layer.provide(SqlClient.layer({ /* config */ }))
)
```

**Purpose**: Real database implementation
**Location**: `adapters/secondary/persistence/`
**Pattern**: `[RepositoryName].postgres-adapter.ts`

---

**`.stripe-adapter.ts` - External Service Adapter**

External service adapters integrate third-party APIs:

```typescript
// adapters/secondary/external-services/PaymentGateway/PaymentGateway.stripe-adapter.ts

/**
 * SECONDARY ADAPTER: Payment Gateway (Stripe)
 * 
 * Real Stripe API integration.
 * 
 * @layer Adapter (04-adapters/secondary)
 * @type Stripe Adapter
 * @implements PaymentGateway.port
 */
const makeStripeAdapter = Effect.gen(function* () {
  const config = yield* StripeConfig
  const client = createStripeClient(config)
  
  return PaymentGateway.of({
    charge: (amount, token) =>
      Effect.tryPromise({
        try: () => client.charges.create({ amount, source: token }),
        catch: (e) => new PaymentError({ cause: e })
      }).pipe(
        Effect.map((charge) => new PaymentReceipt({
          id: charge.id,
          amount: charge.amount
        }))
      )
  })
})

export const PaymentGatewayStripeLive = Layer.effect(
  PaymentGateway,
  makeStripeAdapter
).pipe(
  Layer.provide(StripeConfigLive)
)
```

**Purpose**: Real API integration
**Location**: `adapters/secondary/external-services/`
**Pattern**: `[GatewayName].stripe-adapter.ts`

---

**`.mock-adapter.ts` - Stub/Mock Adapter**

Mock adapters provide canned responses for testing:

```typescript
// adapters/secondary/external-services/PaymentGateway/PaymentGateway.mock-adapter.ts

/**
 * SECONDARY ADAPTER: Payment Gateway (Mock)
 * 
 * Canned responses for testing.
 * 
 * @layer Adapter (04-adapters/secondary)
 * @type Mock Adapter
 * @purpose Testing with minimal behavior
 */
export const PaymentGatewayMockLive = Layer.succeed(
  PaymentGateway,
  PaymentGateway.of({
    charge: (amount, token) =>
      Effect.succeed(new PaymentReceipt({
        id: "mock-receipt-123",
        amount
      })),
    
    refund: (receiptId) =>
      Effect.succeed(void 0)
  })
)
```

**Purpose**: Canned responses for testing
**Location**: `adapters/secondary/external-services/`
**Pattern**: `[GatewayName].mock-adapter.ts`

---

**`.*.unit.test.ts` - Adapter Unit Tests**

Tests for adapter logic in isolation:

```typescript
// adapters/secondary/persistence/OrderRepository/OrderRepository.memory-adapter.unit.test.ts

describe("OrderRepositoryMemory - Unit Tests", () => {
  it.effect("should save and retrieve order", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      
      const order = new Order({ id: "1", items: [], status: "pending" })
      yield* repo.save(order)
      
      const retrieved = yield* repo.findById("1")
      assert.deepEqual(retrieved, order)
    }).pipe(Effect.provide(OrderRepositoryMemoryLive))
  )
})
```

**Purpose**: Test adapter logic in isolation
**Pattern**: `[AdapterName].memory-adapter.unit.test.ts`

---

**`.*.integration.test.ts` - Adapter Integration Tests**

Tests for adapters with real infrastructure:

```typescript
// adapters/secondary/persistence/OrderRepository/OrderRepository.postgres-adapter.integration.test.ts

describe("OrderRepositoryPostgres - Integration Tests", () => {
  it.effect("should save and retrieve from real database", () =>
    Effect.gen(function* () {
      const repo = yield* OrderRepository
      
      const order = new Order({ id: "1", items: [], status: "pending" })
      yield* repo.save(order)
      
      const retrieved = yield* repo.findById("1")
      assert.deepEqual(retrieved, order)
    }).pipe(
      Effect.provide(OrderRepositoryPostgresLive),
      Effect.provide(TestDatabaseLayer)
    )
  )
})
```

**Purpose**: Test adapter with real infrastructure
**Pattern**: `[AdapterName].postgres-adapter.integration.test.ts`

---

### 5. Composition Layer Files

#### 5.1 Suffixes

**`.development.ts` - Development Environment Layer**

Development layers use fast fakes and mocks:

```typescript
// composition/layers.development.ts

/**
 * DEVELOPMENT LAYER COMPOSITION
 * 
 * Fast, deterministic dependencies for local development.
 * Uses fakes and mocks instead of real infrastructure.
 * 
 * @layer Composition (05-composition)
 * @environment Development
 * @speed Very Fast (all in-memory)
 */
export const DevelopmentLayer = Layer.mergeAll(
  OrderServiceLive,           // Real business logic
  OrderRepositoryMemoryLive,  // In-memory fake
  PaymentGatewayMockLive      // Stub responses
)
```

**Purpose**: Fast fakes and mocks for development
**Location**: `composition/`
**Pattern**: `layers.development.ts`

---

**`.testing.ts` - Test Environment Layer**

Testing layers use fakes for automated tests:

```typescript
// composition/layers.testing.ts

/**
 * TESTING LAYER COMPOSITION
 * 
 * Fast, deterministic dependencies for automated tests.
 * Uses fakes and mocks instead of real infrastructure.
 * 
 * @layer Composition (05-composition)
 * @environment Testing
 * @speed Very Fast (all in-memory)
 */
export const TestingLayer = Layer.mergeAll(
  OrderServiceLive,           // Real business logic
  OrderRepositoryFake,         // In-memory fake
  PaymentGatewayMock          // Stub responses
)
```

**Purpose**: Fakes for automated tests
**Location**: `composition/`
**Pattern**: `layers.testing.ts`

---

**`.production.ts` - Production Environment Layer**

Production layers use real adapters:

```typescript
// composition/layers.production.ts

/**
 * PRODUCTION LAYER COMPOSITION
 * 
 * Real implementations for production environment.
 * 
 * @layer Composition (05-composition)
 * @environment Production
 * @speed Normal (real infrastructure)
 */
export const ProductionLayer = Layer.mergeAll(
  OrderServiceLive,           // Real business logic
  OrderRepositoryPostgresLive, // Real database
  PaymentGatewayStripeLive    // Real payment API
)
```

**Purpose**: Real adapters for production
**Location**: `composition/`
**Pattern**: `layers.production.ts`

---

## B. Service and Component Naming

Service and component names should reveal intent, capability, and boundaries to prevent scope creep and maintain clarity.

### 1. Intent-Based Naming

#### 1.1 Capability-Based Services

Define services by capabilities, not entities. This prevents "god services" that grow to hundreds of methods.

**❌ Entity-Based Names (Anti-Pattern)**

These names invite feature creep and become dumping grounds:

```typescript
// ❌ BAD: Entity-based names
class UserService {}      // Will grow to 50+ methods
class OrderService {}     // Becomes a dumping ground  
class EmailService {}     // Used everywhere
class ProductService {}   // Unclear scope
```

**Problems with entity-based naming:**
- Unclear boundaries
- Encourages adding unrelated methods
- Difficult to test
- High coupling
- Violates Single Responsibility Principle

**✅ Capability-Based Names (Best Practice)**

Names that reveal the specific capability and prevent scope creep:

```typescript
// ✅ GOOD: Capability-based names with clear boundaries
class UserAuthenticator {}           // Only authentication
class UserRegistration {}            // Only registration flow
class UserProfileUpdater {}          // Only profile updates
class UserPasswordResetter {}        // Only password reset

class OrderCheckout {}               // Only checkout process
class OrderFulfillment {}            // Only fulfillment
class OrderCancellation {}           // Only cancellation logic
class OrderStatusTracker {}          // Only status tracking

class EmailDelivery {}               // Only sending
class EmailTemplateRenderer {}       // Only template rendering
class EmailBounceHandler {}          // Only bounce handling

class ProductCatalogSearch {}        // Only search
class ProductPriceCalculator {}      // Only pricing
class ProductInventoryManager {}     // Only inventory
```

**Benefits:**
- Crystal clear purpose
- Easy to understand scope
- Prevents method bloat
- High cohesion
- Easy to test
- Easy to replace

**Real-World Examples:**

```typescript
// Instead of UserService with 30 methods:

class UserAuthenticator extends Effect.Service<UserAuthenticator>()(
  "UserAuthenticator",
  {
    dependencies: [TokenGenerator.Default, UserRepository.Default],
    effect: Effect.gen(function* () {
      const tokens = yield* TokenGenerator
      const users = yield* UserRepository
      
      return {
        authenticate: (credentials: Credentials) =>
          Effect.gen(function* () {
            const user = yield* users.findByEmail(credentials.email)
            yield* validatePassword(credentials.password, user.passwordHash)
            const token = yield* tokens.generate(user.id)
            return { user, token }
          })
      }
    })
  }
) {}

class UserNotifications extends Effect.Service<UserNotifications>()(
  "UserNotifications",
  {
    dependencies: [EmailService.Default],
    effect: Effect.gen(function* () {
      const email = yield* EmailService
      
      return {
        notifyPasswordReset: (userId: UserId) =>
          Effect.gen(function* () {
            const user = yield* users.findById(userId)
            yield* email.send({
              to: user.email,
              subject: "Password Reset",
              body: "Click here to reset..."
            })
          })
      }
    })
  }
) {}

class UserLifecycle extends Effect.Service<UserLifecycle>()(
  "UserLifecycle",
  {
    dependencies: [UserRepository.Default, EventBus.Default],
    effect: Effect.gen(function* () {
      const users = yield* UserRepository
      const events = yield* EventBus
      
      return {
        onboard: (data: OnboardingData) =>
          Effect.gen(function* () {
            const user = yield* users.create(data)
            yield* events.publish(UserCreatedEvent(user))
            return user
          }),
        
        deactivate: (userId: UserId) =>
          Effect.gen(function* () {
            yield* users.markAsDeactivated(userId)
            yield* events.publish(UserDeactivatedEvent(userId))
          })
      }
    })
  }
) {}
```

---

#### 1.2 Command/Query/Event Pattern

Use suffixes to make intent crystal clear and separate concerns.

**Commands - Imperative Mood with "Command" Suffix**

Commands change state and should use imperative verbs:

```typescript
// Commands - State-changing operations
class CreateOrderCommand {}
class ShipOrderCommand {}
class CancelSubscriptionCommand {}
class UpdateInventoryCommand {}
class ApprovePaymentCommand {}
class ArchiveTaskCommand {}
class AssignUserRoleCommand {}

// Command handlers follow the same pattern
class CreateOrderCommandHandler {}
class ShipOrderCommandHandler {}
```

**Implementation Example:**

```typescript
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
            // Command logic - changes state
            yield* inventory.reserve(items)
            const order = new Order({ items, status: "pending" })
            yield* orders.save(order)
            return order
          })
      }
    })
  }
) {}
```

**Queries - Question Form or "Query" Suffix**

Queries read state without modification:

```typescript
// Queries - Read-only operations
class GetOrderByIdQuery {}
class FindActiveUsersQuery {}
class CalculateTotalRevenueQuery {}
class OrderStatusQuery {}
class ListUserTasksQuery {}
class SearchProductsQuery {}
class GetUserProfileQuery {}

// Query handlers
class GetOrderByIdQueryHandler {}
class FindActiveUsersQueryHandler {}
```

**Implementation Example:**

```typescript
class OrderQueries extends Effect.Service<OrderQueries>()(
  "OrderQueries",
  {
    dependencies: [OrderRepository.Default],
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      
      return {
        // All methods are read-only
        findById: (id: OrderId) => orders.findById(id),
        
        listByUser: (userId: UserId) => orders.findByUser(userId),
        
        getStatistics: (range: DateRange) =>
          Effect.gen(function* () {
            const orders = yield* orders.findInRange(range)
            return calculateStats(orders)
          })
      }
    })
  }
) {}
```

**Events - Past Tense with Context**

Events represent things that already happened:

```typescript
// Domain Events - Past tense
class OrderCreatedEvent {}
class PaymentProcessedEvent {}
class InventoryUpdatedEvent {}
class UserOnboardedEvent {}
class TaskCompletedEvent {}
class SubscriptionRenewedEvent {}
class EmailSentEvent {}

// Event handlers
class OrderCreatedEventHandler {}
class PaymentProcessedEventHandler {}
```

**Implementation Example:**

```typescript
// Event definitions
interface OrderCreatedEvent {
  readonly _tag: "OrderCreated"
  readonly orderId: OrderId
  readonly userId: UserId
  readonly totalAmount: Money
  readonly timestamp: Date
}

// Event handler
class OrderCreatedEventHandler extends Effect.Service<OrderCreatedEventHandler>()(
  "OrderCreatedEventHandler",
  {
    dependencies: [EmailService.Default, AnalyticsService.Default],
    effect: Effect.gen(function* () {
      const email = yield* EmailService
      const analytics = yield* AnalyticsService
      
      return {
        handle: (event: OrderCreatedEvent) =>
          Effect.gen(function* () {
            // React to event
            yield* email.sendOrderConfirmation(event.orderId)
            yield* analytics.trackOrderCreated(event)
          })
      }
    })
  }
) {}
```

**Benefits of CQS Pattern:**
- Clear separation of reads and writes
- Different optimization strategies
- Easier to reason about side effects
- Better scalability (CQRS)
- Simplified testing

---

### 2. Tag Naming Convention

#### 2.1 Structure

Tags are identifiers for services in the dependency injection system. They must follow a strict pattern for consistency and type safety.

**Pattern: Always Suffix with `Tag`**

```typescript
// ✅ CORRECT: Tag suffix pattern
class DatabaseTag extends Context.Tag("Database")<DatabaseTag, Database>() {}
class EmailServiceTag extends Context.Tag("EmailService")<EmailServiceTag, EmailService>() {}
class UserRepositoryTag extends Context.Tag("UserRepository")<UserRepositoryTag, UserRepository>() {}
class PaymentGatewayTag extends Context.Tag("PaymentGateway")<PaymentGatewayTag, PaymentGateway>() {}
```

**Rules:**

1. **Always use `Tag` suffix**: Makes it clear this is a service identifier
2. **Class-based tags**: Extend `Context.Tag` for better type inference
3. **String identifier matches interface name exactly**: Consistency for debugging
4. **Export from same file as interface**: Keep related code together

**Complete Example:**

```typescript
// domain/database-port.ts

// 1. Define the interface
export interface Database {
  query<T>(sql: string): Effect.Effect<T[], DatabaseError>
  transaction<R, E, A>(
    effect: Effect.Effect<A, E, R>
  ): Effect.Effect<A, E | DatabaseError, R>
}

// 2. Create the tag (exported from same file)
export class DatabaseTag extends Context.Tag("Database")<
  DatabaseTag,
  Database
>() {}

// Usage elsewhere:
const program = Effect.gen(function* () {
  const db = yield* DatabaseTag  // Access via tag
  return yield* db.query("SELECT * FROM users")
})
```

**More Examples:**

```typescript
// domain/user-repository-port.ts
export interface UserRepository {
  findById(id: UserId): Effect.Effect<User, NotFoundError>
  save(user: User): Effect.Effect<void, DatabaseError>
}

export class UserRepositoryTag extends Context.Tag("UserRepository")<
  UserRepositoryTag,
  UserRepository
>() {}
```

```typescript
// domain/email-service-port.ts
export interface EmailService {
  send(email: Email): Effect.Effect<void, EmailError>
}

export class EmailServiceTag extends Context.Tag("EmailService")<
  EmailServiceTag,
  EmailService
>() {}
```

**Why This Pattern:**
- **Type Safety**: TypeScript ensures correct usage
- **Discoverability**: Easy to find service identifiers
- **Consistency**: Same pattern everywhere
- **Runtime Safety**: Unique string identifiers prevent collisions
- **Better Errors**: Clear error messages when services missing

---

### 3. Layer Naming Convention

#### 3.1 Patterns

Layers are constructors for services. Their names should indicate:
1. What they provide
2. What level they're at (core, feature, infrastructure)
3. What environment they're for (live, test, dev)

**Core Layers - Prefix with "Core"**

Core layers have no dependencies on other application services:

```typescript
const CoreDomainLayer = Layer.empty  // No dependencies
const CoreValidationLayer = Layer.succeed(
  Validator,
  createValidator()
)
const CoreConfigLayer = Layer.effect(
  Config,
  loadConfig()
)
```

**Feature Layers - Prefix with Feature Name**

Feature layers group related services:

```typescript
// Checkout feature
const CheckoutServiceLayer = Layer.effect(
  CheckoutService,
  makeCheckoutService
)

const CheckoutRepositoryLayer = Layer.effect(
  CheckoutRepository,
  makeCheckoutRepository
)

// Composed feature layer
const CheckoutLayer = Layer.mergeAll(
  CheckoutServiceLayer,
  CheckoutRepositoryLayer
)
```

```typescript
// Inventory feature
const InventoryServiceLayer = Layer.effect(
  InventoryService,
  makeInventoryService
)

const InventoryRepositoryLayer = Layer.effect(
  InventoryRepository,
  makeInventoryRepository
)

const InventoryLayer = Layer.mergeAll(
  InventoryServiceLayer,
  InventoryRepositoryLayer
)
```

**Infrastructure Layers - Prefix with "Live" or Implementation Name**

Infrastructure layers provide real implementations:

```typescript
// Generic "Live" prefix for primary implementation
const LiveDatabaseLayer = Layer.scoped(
  Database,
  acquireDatabase()
)

const LiveHttpClientLayer = Layer.succeed(
  HttpClient,
  createHttpClient()
)

// Specific technology name for alternatives
const PostgresOrderRepositoryLayer = Layer.effect(
  OrderRepository,
  makePostgresRepository
)

const RedisSessionStoreLayer = Layer.effect(
  SessionStore,
  makeRedisStore
)

const StripePaymentGatewayLayer = Layer.effect(
  PaymentGateway,
  makeStripeGateway
)
```

**Test Layers - Prefix with "Test" or "Mock"**

Test layers provide test doubles:

```typescript
const TestDatabaseLayer = Layer.succeed(
  Database,
  createInMemoryDatabase()
)

const MockPaymentGatewayLayer = Layer.succeed(
  PaymentGateway,
  createMockGateway()
)

const FakeEmailServiceLayer = Layer.succeed(
  EmailService,
  createFakeEmailService()
)

// Composed test layer
const TestInfrastructureLayer = Layer.mergeAll(
  TestDatabaseLayer,
  MockPaymentGatewayLayer,
  FakeEmailServiceLayer
)
```

**Composed Layers - Descriptive Names**

Composed layers combine multiple services:

```typescript
// Persistence layer groups all data access
const PersistenceLayer = Layer.mergeAll(
  LiveDatabaseLayer,
  PostgresOrderRepositoryLayer,
  RedisSessionStoreLayer
)

// Application layer groups business logic
const ApplicationLayer = Layer.mergeAll(
  CheckoutLayer,
  InventoryLayer,
  UserManagementLayer
)

// Infrastructure layer groups all external dependencies
const InfrastructureLayer = Layer.mergeAll(
  PersistenceLayer,
  EmailServiceLayer,
  PaymentGatewayLayer
)

// Main application layer
const MainLayer = Layer.mergeAll(
  InfrastructureLayer,
  ApplicationLayer,
  ApiLayer
)
```

**Complete Example:**

```typescript
// Layer hierarchy example

// Level 1: Core infrastructure (no app dependencies)
const CoreInfrastructure = Layer.mergeAll(
  CoreConfigLayer,
  CoreLoggerLayer,
  CoreMetricsLayer
)

// Level 2: Data layer (depends on core)
const DataLayer = Layer.mergeAll(
  LiveDatabaseLayer,
  PostgresUserRepositoryLayer,
  PostgresOrderRepositoryLayer,
  RedisCache Layer
).pipe(
  Layer.provide(CoreInfrastructure)
)

// Level 3: Feature services (depend on data)
const FeatureLayer = Layer.mergeAll(
  CheckoutLayer,
  InventoryLayer,
  PaymentLayer
).pipe(
  Layer.provide(DataLayer)
)

// Level 4: API layer (depends on features)
const ApiLayer = Layer.mergeAll(
  HttpApiLayer,
  GraphQLApiLayer
).pipe(
  Layer.provide(FeatureLayer)
)

// Final composition
export const ApplicationLayer = ApiLayer
```

---

### 4. Implementation Naming

#### 4.1 Live Implementations

**Pattern: Suffix with `Live`, Export Layer with `LiveLayer`**

```typescript
// ✅ CORRECT: Live implementation pattern

// Implementation class/service
export class SmtpEmail implements EmailService {
  constructor(private config: SmtpConfig) {}
  
  send(email: Email): Effect.Effect<void, EmailError> {
    // Implementation
  }
}

// Layer export
export const EmailLiveLayer = Layer.effect(
  EmailServiceTag,
  Effect.gen(function* () {
    const config = yield* SmtpConfig
    return new SmtpEmail(config)
  })
)
```

**More Examples:**

```typescript
// infrastructure/auth-live.ts
export class JwtAuth implements Auth {
  authenticate(credentials: Credentials): Effect.Effect<User, AuthError> {
    // JWT implementation
  }
}

export const AuthLiveLayer = Layer.effect(
  AuthTag,
  Effect.gen(function* () {
    const config = yield* JwtConfig
    return new JwtAuth(config)
  })
)
```

```typescript
// infrastructure/database-live.ts
export class PostgresDatabase implements Database {
  query<T>(sql: string): Effect.Effect<T[], DatabaseError> {
    // PostgreSQL implementation
  }
}

export const DatabaseLiveLayer = Layer.scoped(
  DatabaseTag,
  Effect.gen(function* () {
    const pool = yield* acquireConnectionPool()
    yield* Effect.addFinalizer(() => pool.close())
    return new PostgresDatabase(pool)
  })
)
```

**File Naming:**
- Location: `infrastructure/` or `infra/`
- Pattern: `[interface-name]-live.ts`
- Examples: `email-live.ts`, `auth-live.ts`, `database-live.ts`

---

#### 4.2 Test Implementations

**Pattern: Suffix with `Mock`, `Test`, or `Fake`**

```typescript
// Test doubles

// MOCK - Simple stub responses
export const EmailMockLayer = Layer.succeed(
  EmailServiceTag,
  {
    send: () => Effect.succeed(undefined)
  }
)

// TEST - Test-specific implementation
export const DatabaseTestLayer = Layer.succeed(
  DatabaseTag,
  {
    query: () => Effect.succeed([]),
    executeTransaction: () => Effect.succeed(undefined)
  }
)

// FAKE - Full-featured in-memory implementation
export class InMemoryUserRepository implements UserRepository {
  private users = new Map<UserId, User>()

  findById(id: UserId): Effect.Effect<User, NotFoundError> {
    const user = this.users.get(id)
    return user 
      ? Effect.succeed(user) 
      : Effect.fail(new NotFoundError())
  }
  
  save(user: User): Effect.Effect<void> {
    this.users.set(user.id, user)
    return Effect.succeed(undefined)
  }
}

export const UserRepositoryFakeLayer = Layer.succeed(
  UserRepositoryTag,
  new InMemoryUserRepository()
)
```

**When to Use Each:**

| Type | Purpose | Complexity | State Management |
|------|---------|------------|------------------|
| **Mock** | Stub responses, no behavior | Minimal | None |
| **Test** | Simple test-specific logic | Low | Optional |
| **Fake** | Full working alternative | High | Yes (Ref/Map) |

**File Naming:**
- Location: `test/mocks/` or `infrastructure/testing/`
- Patterns: `[service]-mock.ts`, `[service]-fake.ts`, `[service]-test.ts`

---

### 5. Error Type Naming

#### 5.1 Structure

Error names should include:
1. Domain context
2. Specific error condition
3. `Error` suffix

**Pattern: `[Domain][Condition]Error`**

```typescript
// ✅ GOOD: Domain-specific errors
class OrderNotFoundError extends Data.TaggedError("OrderNotFoundError")<{
  orderId: OrderId
}> {}

class InvalidOrderStateError extends Data.TaggedError("InvalidOrderStateError")<{
  orderId: OrderId
  currentState: OrderState
  attemptedTransition: OrderState
}> {}

class CheckoutValidationError extends Data.TaggedError("CheckoutValidationError")<{
  failures: ReadonlyArray<ValidationFailure>
}> {}

class PaymentDeclinedError extends Data.TaggedError("PaymentDeclinedError")<{
  reason: string
  amount: Money
}> {}
```

```typescript
// ❌ BAD: Generic errors used everywhere
class NotFoundError {}        // Too generic - what wasn't found?
class ValidationError {}      // What failed validation?
class DatabaseError {}        // What database operation failed?
```

**Grouped Error Patterns:**

Use namespaces to group related errors:

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
  
  export class InvalidShippingAddressError extends Data.TaggedError("Checkout.InvalidShippingAddressError")<{
    address: Address
    reason: string
  }> {}
  
  // Union type for all checkout errors
  export type All = 
    | EmptyCartError 
    | PaymentDeclinedError 
    | InsufficientInventoryError
    | InvalidShippingAddressError
}

// Usage:
const checkout = (cart: Cart): Effect.Effect<Order, CheckoutErrors.All> =>
  Effect.gen(function* () {
    if (cart.items.length === 0) {
      return yield* Effect.fail(new CheckoutErrors.EmptyCartError())
    }
    // ...
  })
```

**More Examples:**

```typescript
// User domain errors
namespace UserErrors {
  export class UserNotFoundError extends Data.TaggedError("User.NotFound")<{
    userId: UserId
  }> {}
  
  export class InvalidCredentialsError extends Data.TaggedError("User.InvalidCredentials")<{}> {}
  
  export class EmailAlreadyExistsError extends Data.TaggedError("User.EmailAlreadyExists")<{
    email: EmailAddress
  }> {}
  
  export class AccountLocked Error extends Data.TaggedError("User.AccountLocked")<{
    userId: UserId
    reason: string
  }> {}
  
  export type All = 
    | UserNotFoundError
    | InvalidCredentialsError
    | EmailAlreadyExistsError
    | AccountLockedError
}
```

```typescript
// Task domain errors
namespace TaskErrors {
  export class TaskNotFoundError extends Data.TaggedError("Task.NotFound")<{
    taskId: TaskId
  }> {}
  
  export class InvalidTransitionError extends Data.TaggedError("Task.InvalidTransition")<{
    from: TaskStatus
    to: TaskStatus
  }> {}
  
  export class TaskAlreadyCompletedError extends Data.TaggedError("Task.AlreadyCompleted")<{
    taskId: TaskId
  }> {}
  
  export type All = 
    | TaskNotFoundError
    | InvalidTransitionError
    | TaskAlreadyCompletedError
}
```

**Benefits:**
- Self-documenting
- Easy to pattern match
- Clear error handling
- Better error messages
- Domain-specific context

---

### 6. Configuration Naming

#### 6.1 Patterns

Configuration follows a consistent pattern: Interface, Tag, and Layer.

**Pattern: `[Feature]Config` Interface and `[Feature]ConfigTag` Tag**

```typescript
// config/db-config.ts

// 1. Interface definition
export interface DbConfig {
  url: string
  poolSize: number
  timeout: number
}

// 2. Tag definition
export class DbConfigTag extends Context.Tag("DbConfig")<
  DbConfigTag,
  DbConfig
>() {}

// 3. Layer (optional - can be provided at app root)
export const DbConfigLive = Layer.succeed(DbConfigTag, {
  url: process.env.DB_URL!,
  poolSize: 10,
  timeout: 5000
})
```

**More Examples:**

```typescript
// config/smtp-config.ts
export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
}

export class SmtpConfigTag extends Context.Tag("SmtpConfig")<
  SmtpConfigTag,
  SmtpConfig
>() {}

export const SmtpConfigLive = Layer.succeed(SmtpConfigTag, {
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT!),
  secure: true,
  user: process.env.SMTP_USER!,
  password: process.env.SMTP_PASSWORD!
})
```

**Grouped Configuration:**

```typescript
// config/bootstrap.ts
export const ConfigLayer = Layer.mergeAll(
  DbConfigLive,
  SmtpConfigLive,
  StripeConfigLive,
  JwtConfigLive
)
```

**Schema-Based Configuration:**

Using Schema for validation:

```typescript
// config/schema.ts
import { Schema } from "@effect/schema"

export const AppConfigSchema = Schema.Struct({
  database: Schema.Struct({
    url: Schema.String,
    poolSize: Schema.Number
  }),
  smtp: Schema.Struct({
    host: Schema.String,
    port: Schema.Number
  }),
  features: Schema.Record(Schema.String, Schema.Boolean)
})

export type AppConfig = Schema.Schema.Type<typeof AppConfigSchema>

// Load and validate
export const AppConfigLive = Layer.effect(
  AppConfigTag,
  Effect.gen(function* () {
    const rawConfig = yield* Effect.sync(() => loadFromEnv())
    return yield* Schema.decodeUnknown(AppConfigSchema)(rawConfig)
  })
)
```

**File Naming:**
- Location: `config/`
- Patterns: `[feature]-config.ts` or `schema.ts` for schema-based configs

---

## C. Function and Method Naming

Function and method names should reveal whether they're pure or effectful, what they do, and what side effects they may have.

### 1. Pure Functions

#### 1.1 Simple Names

Pure functions use simple, descriptive names with no prefix:

```typescript
// Pure domain logic - no Effect, no I/O
const calculateTotal = (items: Item[]): Money =>
  items.reduce((sum, item) => 
    Money.add(sum, Money.multiply(item.price, item.quantity)),
    Money.zero
  )

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const toDomain = (dto: UserDTO): User =>
  new User({
    id: UserId(dto.id),
    email: EmailAddress(dto.email),
    name: dto.name
  })

const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0]

const calculateDiscount = (order: Order): Discount => {
  if (order.items.length > 10) return Discount.percentage(15)
  if (order.totalAmount > 1000) return Discount.percentage(10)
  return Discount.none()
}
```

**Characteristics:**
- No prefix (indicates purity)
- Descriptive verbs
- Return values, no side effects
- Deterministic
- Easy to test

---

### 2. Effectful Functions

#### 2.1 Prefixes

Effectful functions use prefixes to indicate they perform I/O or have side effects:

**`load` - Fetch from external source**

```typescript
const loadUserById = (id: UserId): Effect.Effect<User, UserNotFoundError> =>
  Effect.gen(function* () {
    const repo = yield* UserRepository
    return yield* repo.findById(id)
  })

const loadConfiguration = (): Effect.Effect<Config, ConfigError> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem
    const content = yield* fs.readFile("config.json")
    return yield* parseConfig(content)
  })
```

**`persist` - Save to external storage**

```typescript
const persistOrder = (order: Order): Effect.Effect<void, DatabaseError> =>
  Effect.gen(function* () {
    const repo = yield* OrderRepository
    yield* repo.save(order)
  })

const persistSettings = (settings: Settings): Effect.Effect<void> =>
  Effect.gen(function* () {
    const storage = yield* LocalStorage
    yield* storage.set("settings", settings)
  })
```

**`fetch` - Retrieve from cache or external API**

```typescript
const fetchFromCache = (key: string): Effect.Effect<Option<Value>> =>
  Effect.gen(function* () {
    const cache = yield* Cache
    return yield* cache.get(key)
  })

const fetchUserProfile = (userId: UserId): Effect.Effect<UserProfile> =>
  Effect.gen(function* () {
    const api = yield* UserApi
    return yield* api.getProfile(userId)
  })
```

**`query` - Database query**

```typescript
const queryDatabase = (sql: string): Effect.Effect<Row[], DatabaseError> =>
  Effect.gen(function* () {
    const db = yield* Database
    return yield* db.query(sql)
  })

const queryActiveUsers = (): Effect.Effect<User[]> =>
  Effect.gen(function* () {
    const db = yield* Database
    return yield* db.query("SELECT * FROM users WHERE active = true")
  })
```

---

### 3. Commands (Imperative)

Commands use imperative verbs and indicate state-changing operations:

```typescript
// Commands - Change state
const createOrder = (data: CreateOrderData): Effect.Effect<Order, OrderError> =>
  Effect.gen(function* () {
    const repo = yield* OrderRepository
    const order = new Order(data)
    yield* repo.save(order)
    return order
  })

const shipOrder = (orderId: OrderId): Effect.Effect<void, OrderError> =>
  Effect.gen(function* () {
    const repo = yield* OrderRepository
    const order = yield* repo.findById(orderId)
    const shipped = order.markAsShipped()
    yield* repo.save(shipped)
  })

const cancelSubscription = (subId: SubscriptionId): Effect.Effect<void> =>
  Effect.gen(function* () {
    const repo = yield* SubscriptionRepository
    const sub = yield* repo.findById(subId)
    const cancelled = sub.cancel()
    yield* repo.save(cancelled)
  })

const updateUserProfile = (
  userId: UserId,
  data: UpdateProfileData
): Effect.Effect<User> =>
  Effect.gen(function* () {
    const repo = yield* UserRepository
    const user = yield* repo.findById(userId)
    const updated = user.updateProfile(data)
    yield* repo.save(updated)
    return updated
  })
```

**Characteristics:**
- Imperative verb (create, update, delete, ship, cancel)
- Changes state
- Returns minimal data
- May have side effects

---

### 4. Queries (Descriptive)

Queries use descriptive names or question forms and never modify state:

```typescript
// Queries - Read state only
const findOrdersByUser = (userId: UserId): Effect.Effect<Order[]> =>
  Effect.gen(function* () {
    const repo = yield* OrderRepository
    return yield* repo.findByUser(userId)
  })

const getActiveSubscriptions = (): Effect.Effect<Subscription[]> =>
  Effect.gen(function* () {
    const repo = yield* SubscriptionRepository
    return yield* repo.findActive()
  })

const calculateMonthlyRevenue = (month: Month): Effect.Effect<Money> =>
  Effect.gen(function* () {
    const repo = yield* OrderRepository
    const orders = yield* repo.findInMonth(month)
    return orders.reduce(
      (sum, order) => Money.add(sum, order.totalAmount),
      Money.zero
    )
  })

const getUserDashboard = (userId: UserId): Effect.Effect<Dashboard> =>
  Effect.gen(function* () {
    const users = yield* UserRepository
    const orders = yield* OrderRepository
    const tasks = yield* TaskRepository
    
    const user = yield* users.findById(userId)
    const recentOrders = yield* orders.findRecent(userId, 5)
    const pendingTasks = yield* tasks.findPending(userId)
    
    return {
      user,
      recentOrders,
      pendingTasks
    }
  })
```

**Characteristics:**
- Descriptive names (find, get, list, calculate)
- Never modify state
- May aggregate data
- Return complete results

---

### 5. Event Handlers

Event handlers use `on` or `handle` prefixes:

```typescript
// Event handlers - React to events
const onOrderCreated = (event: OrderCreatedEvent): Effect.Effect<void> =>
  Effect.gen(function* () {
    const email = yield* EmailService
    const analytics = yield* AnalyticsService
    
    yield* email.sendOrderConfirmation(event.orderId)
    yield* analytics.trackOrderCreated(event)
  })

const handlePaymentProcessed = (event: PaymentProcessedEvent): Effect.Effect<void> =>
  Effect.gen(function* () {
    const orders = yield* OrderRepository
    const order = yield* orders.findById(event.orderId)
    const confirmed = order.confirm()
    yield* orders.save(confirmed)
  })

const onUserRegistered = (event: UserRegisteredEvent): Effect.Effect<void> =>
  Effect.gen(function* () {
    const email = yield* EmailService
    const analytics = yield* AnalyticsService
    
    yield* email.sendWelcomeEmail(event.userId)
    yield* analytics.trackUserRegistration(event)
  })
```

**Characteristics:**
- `on` or `handle` prefix
- React to domain events
- May trigger side effects
- Usually asynchronous

---

### 6. Workflows

Workflows describe multi-step business processes:

```typescript
// Workflows - Multi-step orchestration
const processCheckout = (cart: Cart): Effect.Effect<Order, CheckoutError> =>
  Effect.gen(function* () {
    // Step 1: Validate cart
    yield* validateCart(cart)
    
    // Step 2: Calculate totals
    const total = calculateTotal(cart)
    const tax = calculateTax(cart)
    const shipping = yield* calculateShipping(cart)
    
    // Step 3: Process payment
    const payment = yield* processPayment(total)
    
    // Step 4: Create order
    const order = yield* createOrder(cart, payment)
    
    // Step 5: Clear cart
    yield* clearCart(cart.id)
    
    // Step 6: Send notifications
    yield* sendOrderConfirmation(order)
    
    return order
  })

const fulfillOrder = (orderId: OrderId): Effect.Effect<void> =>
  Effect.gen(function* () {
    // Load order
    const order = yield* loadOrder(orderId)
    
    // Pick items from inventory
    yield* pickItems(order.items)
    
    // Pack order
    const package = yield* packOrder(order)
    
    // Create shipping label
    const label = yield* createShippingLabel(package)
    
    // Update order status
    yield* updateOrderStatus(orderId, "shipped")
    
    // Notify customer
    yield* notifyShipment(order, label.trackingNumber)
  })

const reconcileInventory = (): Effect.Effect<ReconciliationReport> =>
  Effect.gen(function* () {
    // Load current inventory
    const inventory = yield* loadInventory()
    
    // Count physical stock
    const physical = yield* countPhysicalStock()
    
    // Compare and find discrepancies
    const discrepancies = findDiscrepancies(inventory, physical)
    
    // Generate adjustments
    const adjustments = generateAdjustments(discrepancies)
    
    // Apply adjustments
    yield* applyAdjustments(adjustments)
    
    // Generate report
    return generateReconciliationReport(discrepancies, adjustments)
  })
```

**Characteristics:**
- Descriptive process names
- Multi-step operations
- Orchestrate multiple services
- Clear workflow steps in comments

---

### 7. Repository Methods

Repository methods follow standard patterns:

**Existence Checks**

```typescript
interface Repository {
  exists(id: EntityId): Effect.Effect<boolean>
  existsByUser(userId: UserId): Effect.Effect<boolean>
  existsByEmail(email: EmailAddress): Effect.Effect<boolean>
}
```

**Single Entity Retrieval**

```typescript
interface Repository {
  // Returns Option - may not exist
  findById(id: EntityId): Effect.Effect<Option<Entity>>
  
  // Returns Entity or fails - must exist
  getById(id: EntityId): Effect.Effect<Entity, NotFoundError>
  
  findByEmail(email: EmailAddress): Effect.Effect<Option<Entity>>
}
```

**Multiple Entity Retrieval**

```typescript
interface Repository {
  findAll(): Effect.Effect<Entity[]>
  
  findByUser(userId: UserId): Effect.Effect<Entity[]>
  
  findWhere(predicate: Predicate<Entity>): Effect.Effect<Entity[]>
  
  findInRange(start: Date, end: Date): Effect.Effect<Entity[]>
  
  findPaginated(page: number, size: number): Effect.Effect<Page<Entity>>
}
```

**Persistence**

```typescript
interface Repository {
  save(entity: Entity): Effect.Effect<Entity>
  
  saveAll(entities: Entity[]): Effect.Effect<void>
  
  insert(entity: Entity): Effect.Effect<Entity>
  
  upsert(entity: Entity): Effect.Effect<Entity>
}
```

**Updates**

```typescript
interface Repository {
  update(entity: Entity): Effect.Effect<Entity>
  
  updateStatus(id: EntityId, status: Status): Effect.Effect<void>
  
  updatePartial(id: EntityId, updates: Partial<Entity>): Effect.Effect<Entity>
}
```

**Deletion**

```typescript
interface Repository {
  delete(id: EntityId): Effect.Effect<void>
  
  deleteAll(ids: EntityId[]): Effect.Effect<void>
  
  deleteWhere(predicate: Predicate<Entity>): Effect.Effect<number>
  
  softDelete(id: EntityId): Effect.Effect<void>
}
```

**Complete Repository Example:**

```typescript
export interface OrderRepository {
  // Existence
  exists(id: OrderId): Effect.Effect<boolean>
  existsByUser(userId: UserId): Effect.Effect<boolean>
  
  // Single retrieval
  findById(id: OrderId): Effect.Effect<Option<Order>>
  getById(id: OrderId): Effect.Effect<Order, OrderNotFoundError>
  
  // Multiple retrieval
  findAll(): Effect.Effect<Order[]>
  findByUser(userId: UserId): Effect.Effect<Order[]>
  findByStatus(status: OrderStatus): Effect.Effect<Order[]>
  findInDateRange(start: Date, end: Date): Effect.Effect<Order[]>
  
  // Persistence
  save(order: Order): Effect.Effect<Order>
  saveAll(orders: Order[]): Effect.Effect<void>
  
  // Updates
  update(order: Order): Effect.Effect<Order>
  updateStatus(id: OrderId, status: OrderStatus): Effect.Effect<void>
  
  // Deletion
  delete(id: OrderId): Effect.Effect<void>
  deleteWhere(predicate: (order: Order) => boolean): Effect.Effect<number>
}
```

This comprehensive naming taxonomy ensures consistency across the entire codebase and makes architectural intent explicit through naming alone.
