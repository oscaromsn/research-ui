---
modified: 2025-11-04T04:47:35-03:00
---
# VI. DIRECTORY STRUCTURE PATTERNS

The directory structure encodes architectural decisions and makes them visible. Effect-TS hexagonal architecture can be organized in several ways, each with distinct benefits and trade-offs.

## A. Recommended Project Structure

The numbered layer structure makes dependency flow explicit and enforces architectural constraints through physical organization.

### 1. Overview

```
src/
├── 01-domain/                    # Layer 1: Pure business logic (zero dependencies)
├── 02-ports/                     # Layer 2: Contracts (interfaces only)
├── 03-application/               # Layer 3: Business logic implementations
├── 04-adapters/                  # Layer 4: Infrastructure adapters
├── 05-composition/               # Layer 5: Dependency injection
└── main.ts                       # Application entry point
```

**Key Principles**:
- **Numbers enforce dependency flow**: Higher numbers can depend on lower numbers, never reverse
- **Physical structure mirrors logical architecture**: The folder layout reflects the hexagonal layers
- **Progressive refinement**: Each layer adds detail and concrete implementations
- **Clear separation**: No ambiguity about where code belongs

---

### 2. Layer 1: Domain (01-domain/)

**Purpose**: Pure business logic with zero external dependencies.

**Structure**:

```
01-domain/
├── models/
│   ├── Order.model.ts
│   ├── Order.model.unit.test.ts
│   ├── User.model.ts
│   ├── User.model.unit.test.ts
│   ├── Task.model.ts
│   ├── Task.model.unit.test.ts
│   └── index.ts
│
├── errors/
│   ├── OrderErrors.error.ts
│   ├── UserErrors.error.ts
│   ├── TaskErrors.error.ts
│   └── index.ts
│
├── value-objects/
│   ├── OrderId.value.ts
│   ├── Money.value.ts
│   ├── Email.value.ts
│   ├── Money.value.unit.test.ts
│   └── index.ts
│
├── rules/
│   ├── OrderRules.ts
│   ├── OrderRules.unit.test.ts
│   ├── PricingRules.ts
│   ├── PricingRules.unit.test.ts
│   └── index.ts
│
└── events/
    ├── OrderEvents.ts
    ├── UserEvents.ts
    └── index.ts
```

**Example - Order Model**:

```typescript
// 01-domain/models/Order.model.ts
import { Schema } from "@effect/schema"

export class Order extends Schema.Class<Order>("Order")({
  id: Schema.String.pipe(Schema.brand("OrderId")),
  items: Schema.Array(OrderItem).pipe(Schema.minItems(1)),
  totalAmount: Schema.Number.pipe(Schema.nonNegative),
  status: Schema.Literal("pending", "confirmed", "shipped"),
  createdAt: Schema.DateTimeUtc
}) {
  // Pure business logic - no I/O, no Effect
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }
  
  canBeConfirmed(): boolean {
    return this.status === "pending" && this.items.length > 0
  }
  
  confirm(): Order {
    if (!this.canBeConfirmed()) {
      throw new Error("Cannot confirm order")
    }
    return new Order({ ...this, status: "confirmed" })
  }
}
```

**Example - Domain Errors**:

```typescript
// 01-domain/errors/OrderErrors.error.ts
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

**Example - Business Rules**:

```typescript
// 01-domain/rules/OrderRules.ts

// Pure functions - no Effect, no I/O
export const requiresExpressShipping = (order: Order): boolean =>
  order.totalAmount > 500 || order.items.some(i => i.isFragile)

export const calculateShippingCost = (order: Order, distance: number): Money => {
  const baseRate = requiresExpressShipping(order) ? Money(50) : Money(10)
  return Money.multiply(baseRate, distance / 100)
}

export const canShipToAddress = (address: Address): boolean =>
  supportedCountries.includes(address.country) &&
  address.zip.length >= 5
```

**Rules**:
- ✅ Pure functions and classes only
- ✅ Schema.Class for entities
- ✅ Data.TaggedError for errors
- ❌ No Effect imports (except Schema, Data)
- ❌ No infrastructure dependencies
- ❌ No I/O operations

---

### 3. Layer 2: Ports (02-ports/)

**Purpose**: Contract definitions - interfaces with no implementations.

**Structure**:

```
02-ports/
├── primary/                      # Inbound ports (what we offer)
│   ├── OrderService/
│   │   ├── OrderService.port.ts
│   │   ├── OrderService.port.contract.test.ts
│   │   ├── OrderService.port.fake.ts
│   │   └── index.ts
│   │
│   └── CheckoutService/
│       ├── CheckoutService.port.ts
│       ├── CheckoutService.port.contract.test.ts
│       ├── CheckoutService.port.fake.ts
│       └── index.ts
│
└── secondary/                    # Outbound ports (what we need)
    ├── OrderRepository/
    │   ├── OrderRepository.port.ts
    │   ├── OrderRepository.port.contract.test.ts
    │   ├── OrderRepository.port.fake.ts
    │   └── index.ts
    │
    ├── PaymentGateway/
    │   ├── PaymentGateway.port.ts
    │   ├── PaymentGateway.port.contract.test.ts
    │   ├── PaymentGateway.port.fake.ts
    │   └── index.ts
    │
    └── EmailService/
        ├── EmailService.port.ts
        ├── EmailService.port.contract.test.ts
        ├── EmailService.port.fake.ts
        └── index.ts
```

**Example - Secondary Port (Outbound)**:

```typescript
// 02-ports/secondary/OrderRepository/OrderRepository.port.ts
import { Effect, Context } from "effect"
import { Order, OrderId } from "../../../01-domain/models/Order.model"
import { OrderNotFoundError } from "../../../01-domain/errors/OrderErrors.error"

/**
 * SECONDARY PORT: OrderRepository
 * 
 * Contract for order persistence.
 * This is INTERFACE ONLY - no implementation.
 */
export interface OrderRepository {
  readonly save: (order: Order) => Effect.Effect<void, DatabaseError>
  readonly findById: (id: OrderId) => Effect.Effect<Order, OrderNotFoundError>
  readonly findByUser: (userId: UserId) => Effect.Effect<Order[]>
}

export class OrderRepository extends Context.Tag("OrderRepository")<
  OrderRepository,
  OrderRepository
>() {}
```

**Example - Primary Port (Inbound)**:

```typescript
// 02-ports/primary/OrderService/OrderService.port.ts
import { Effect } from "effect"

/**
 * PRIMARY PORT: OrderService
 * 
 * What the application offers to external actors.
 * CONTRACT ONLY - implementation in 03-application/
 */
export class OrderService extends Effect.Service<OrderService>()(
  "OrderService",
  {
    effect: Effect.gen(function* () {
      return {
        createOrder: (items: OrderItem[]): Effect.Effect<Order, OrderError> =>
          Effect.die("CONTRACT ONLY"),
        
        getOrder: (id: OrderId): Effect.Effect<Order, OrderNotFoundError> =>
          Effect.die("CONTRACT ONLY")
      }
    })
  }
) {}
```

**Example - Port Fake**:

```typescript
// 02-ports/secondary/OrderRepository/OrderRepository.port.fake.ts
import { Effect, Layer, Ref } from "effect"

/**
 * FAKE: OrderRepository
 * 
 * Fully-functional in-memory implementation.
 * MUST pass all contract tests.
 */
export const OrderRepositoryFake = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const storage = yield* Ref.make(new Map<OrderId, Order>())
    
    return OrderRepository.of({
      save: (order) =>
        Ref.update(storage, (map) => map.set(order.id, order)),
      
      findById: (id) =>
        Effect.gen(function* () {
          const map = yield* Ref.get(storage)
          const order = map.get(id)
          if (!order) {
            return yield* Effect.fail(new OrderNotFoundError({ orderId: id }))
          }
          return order
        }),
      
      findByUser: (userId) =>
        Effect.gen(function* () {
          const map = yield* Ref.get(storage)
          return Array.from(map.values()).filter(o => o.userId === userId)
        })
    })
  })
)
```

**Rules**:
- ✅ Interface + Context.Tag only
- ✅ Import from 01-domain only
- ✅ Co-locate .port.fake.ts for testing
- ✅ Co-locate .port.contract.test.ts
- ❌ No implementations in .port.ts files
- ❌ Cannot import from 03-application, 04-adapters, 05-composition

---

### 4. Layer 3: Application (03-application/)

**Purpose**: Business logic implementations and use case orchestration.

**Structure**:

```
03-application/
└── services/
    ├── OrderService/
    │   ├── OrderService.service.ts
    │   ├── OrderService.service.integration.test.ts
    │   └── index.ts
    │
    ├── CheckoutService/
    │   ├── CheckoutService.service.ts
    │   ├── CheckoutService.service.integration.test.ts
    │   └── index.ts
    │
    └── UserService/
        ├── UserService.service.ts
        ├── UserService.service.integration.test.ts
        └── index.ts
```

**Example - Service Implementation**:

```typescript
// 03-application/services/OrderService/OrderService.service.ts
import { Effect, Layer } from "effect"
import { OrderService } from "../../../02-ports/primary/OrderService/OrderService.port"
import { OrderRepository } from "../../../02-ports/secondary/OrderRepository/OrderRepository.port"
import { PaymentGateway } from "../../../02-ports/secondary/PaymentGateway/PaymentGateway.port"
import { EmailService } from "../../../02-ports/secondary/EmailService/EmailService.port"
import { Order } from "../../../01-domain/models/Order.model"

/**
 * ORDER SERVICE IMPLEMENTATION
 * 
 * Implements primary port using secondary ports.
 * Contains business logic and orchestration.
 */
export class OrderServiceLive extends Effect.Service<OrderService>()(
  "OrderService",
  {
    dependencies: [
      OrderRepository.Default,
      PaymentGateway.Default,
      EmailService.Default
    ],
    
    effect: Effect.gen(function* () {
      const orders = yield* OrderRepository
      const payment = yield* PaymentGateway
      const email = yield* EmailService
      
      return {
        createOrder: (items: OrderItem[]) =>
          Effect.gen(function* () {
            // Validate
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
            
            // Process payment (secondary port)
            yield* payment.charge(order.totalAmount, "token")
            
            // Confirm and persist (secondary port)
            const confirmed = order.confirm()
            yield* orders.save(confirmed)
            
            // Send confirmation (secondary port)
            yield* email.sendOrderConfirmation(confirmed)
            
            return confirmed
          }),
        
        getOrder: (id: OrderId) =>
          orders.findById(id)
      }
    })
  }
) {}
```

**Rules**:
- ✅ Implement primary ports
- ✅ Orchestrate secondary ports
- ✅ Use Effect.Service pattern
- ✅ Import from 01-domain and 02-ports
- ❌ No direct adapter dependencies
- ❌ Cannot import from 04-adapters

---

### 5. Layer 4: Adapters (04-adapters/)

**Purpose**: Concrete implementations of ports for specific technologies.

**Structure**:

```
04-adapters/
├── primary/                      # Driving adapters (entry points)
│   ├── http/
│   │   ├── OrderApi.http-adapter.ts
│   │   ├── OrderApi.http-adapter.system.test.ts
│   │   ├── UserApi.http-adapter.ts
│   │   └── index.ts
│   │
│   ├── cli/
│   │   ├── OrderCommands.cli-adapter.ts
│   │   ├── OrderCommands.cli-adapter.system.test.ts
│   │   └── index.ts
│   │
│   └── graphql/
│       ├── OrderResolvers.graphql-adapter.ts
│       └── index.ts
│
└── secondary/                    # Driven adapters (infrastructure)
    ├── persistence/
    │   ├── OrderRepository.postgres-adapter.ts
    │   ├── OrderRepository.postgres-adapter.integration.test.ts
    │   ├── OrderRepository.memory-adapter.ts
    │   ├── OrderRepository.memory-adapter.unit.test.ts
    │   └── index.ts
    │
    ├── messaging/
    │   ├── EmailService.smtp-adapter.ts
    │   ├── EmailService.smtp-adapter.integration.test.ts
    │   ├── EmailService.fake-adapter.ts
    │   └── index.ts
    │
    └── external/
        ├── PaymentGateway.stripe-adapter.ts
        ├── PaymentGateway.stripe-adapter.integration.test.ts
        ├── PaymentGateway.mock-adapter.ts
        └── index.ts
```

**Example - Secondary Adapter (Database)**:

```typescript
// 04-adapters/secondary/persistence/OrderRepository.postgres-adapter.ts
import { Effect, Layer } from "effect"
import { SqlClient } from "@effect/sql"
import { OrderRepository } from "../../../02-ports/secondary/OrderRepository/OrderRepository.port"

/**
 * SECONDARY ADAPTER: OrderRepository (PostgreSQL)
 * 
 * Concrete implementation using PostgreSQL.
 */
const makePostgresRepository = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  return OrderRepository.of({
    save: (order) =>
      sql`
        INSERT INTO orders (id, user_id, items, total_amount, status, created_at)
        VALUES (${order.id}, ${order.userId}, ${JSON.stringify(order.items)}, 
                ${order.totalAmount}, ${order.status}, ${order.createdAt})
        ON CONFLICT (id) DO UPDATE SET
          total_amount = EXCLUDED.total_amount,
          status = EXCLUDED.status
      `.pipe(Effect.asVoid),
    
    findById: (id) =>
      sql<Order>`SELECT * FROM orders WHERE id = ${id}`.pipe(
        Effect.flatMap((rows) =>
          rows.length === 0
            ? Effect.fail(new OrderNotFoundError({ orderId: id }))
            : Effect.succeed(Order.make(rows[0]))
        )
      ),
    
    findByUser: (userId) =>
      sql<Order[]>`SELECT * FROM orders WHERE user_id = ${userId}`.pipe(
        Effect.map((rows) => rows.map(Order.make))
      )
  })
})

// Export with local dependencies provided
export const OrderRepositoryPostgresLive = Layer.effect(
  OrderRepository,
  makePostgresRepository
).pipe(
  Layer.provide(SqlClient.layer({ /* config */ }))
)
// Type: Layer<OrderRepository, never, never>
```

**Example - Primary Adapter (HTTP)**:

```typescript
// 04-adapters/primary/http/OrderApi.http-adapter.ts
import { HttpApiEndpoint, HttpApiGroup, HttpApiBuilder } from "@effect/platform"
import { Schema } from "@effect/schema"
import { OrderService } from "../../../03-application/services/OrderService/OrderService.service"

/**
 * PRIMARY ADAPTER: Order HTTP API
 * 
 * Translates HTTP requests to use case calls.
 */
export class OrderApi extends HttpApiGroup.make("orders")
  .add(
    HttpApiEndpoint.post("createOrder", "/orders")
      .setPayload(CreateOrderRequestSchema)
      .addSuccess(OrderResponseSchema)
  )
{} {
  static Live = HttpApiBuilder.group(OrderApi, "orders", (handlers) =>
    handlers.handle("createOrder", ({ payload }) =>
      Effect.gen(function* () {
        const orderService = yield* OrderService
        
        // Translate HTTP to domain
        const order = yield* orderService.createOrder(payload.items)
        
        // Translate domain to HTTP
        return orderToApiResponse(order)
      })
    )
  )
}
```

**Rules**:
- ✅ Implement port interfaces
- ✅ Technology-specific code here
- ✅ Local dependency elimination
- ✅ Import from all layers (01, 02, 03)
- ❌ No business logic

---

### 6. Layer 5: Composition (05-composition/)

**Purpose**: Assemble layers for different environments.

**Structure**:

```
05-composition/
├── layers.development.ts         # Development environment
├── layers.testing.ts             # Test environment
├── layers.production.ts          # Production environment
└── index.ts
```

**Example - Development Layer**:

```typescript
// 05-composition/layers.development.ts
import { Layer } from "effect"
import { OrderServiceLive } from "../03-application/services/OrderService/OrderService.service"
import { OrderRepositoryMemoryLive } from "../04-adapters/secondary/persistence/OrderRepository.memory-adapter"
import { PaymentGatewayMockLive } from "../04-adapters/secondary/external/PaymentGateway.mock-adapter"
import { EmailServiceFakeLive } from "../04-adapters/secondary/messaging/EmailService.fake-adapter"

/**
 * DEVELOPMENT LAYER
 * 
 * Fast, in-memory implementations for local development.
 */
export const DevelopmentLayer = Layer.mergeAll(
  OrderServiceLive,              // Real business logic
  OrderRepositoryMemoryLive,     // In-memory storage
  PaymentGatewayMockLive,        // Mock payment
  EmailServiceFakeLive           // Fake email (logs to console)
)
```

**Example - Production Layer**:

```typescript
// 05-composition/layers.production.ts
import { Layer } from "effect"
import { OrderServiceLive } from "../03-application/services/OrderService/OrderService.service"
import { OrderRepositoryPostgresLive } from "../04-adapters/secondary/persistence/OrderRepository.postgres-adapter"
import { PaymentGatewayStripeLive } from "../04-adapters/secondary/external/PaymentGateway.stripe-adapter"
import { EmailServiceSmtpLive } from "../04-adapters/secondary/messaging/EmailService.smtp-adapter"

/**
 * PRODUCTION LAYER
 * 
 * Real implementations for production.
 */
export const ProductionLayer = Layer.mergeAll(
  OrderServiceLive,              // Real business logic
  OrderRepositoryPostgresLive,   // Real database
  PaymentGatewayStripeLive,      // Real payment
  EmailServiceSmtpLive           // Real email
)
```

**Example - Main Entry Point**:

```typescript
// main.ts
import { Effect } from "effect"
import { HttpServer } from "@effect/platform"
import { DevelopmentLayer } from "./05-composition/layers.development"
import { ProductionLayer } from "./05-composition/layers.production"

const env = process.env.NODE_ENV || "development"

const ApplicationLayer = env === "production" 
  ? ProductionLayer 
  : DevelopmentLayer

const program = HttpServer.serve.pipe(
  Effect.provide(ApplicationLayer)  // Single provide
)

Effect.runPromise(program)
```

**Rules**:
- ✅ Compose layers from all other layers
- ✅ Single Effect.provide call
- ✅ Environment-specific configurations
- ✅ Import from all layers (01-04)

---

### 7. Benefits of Numbered Structure

**1. Enforces Dependency Flow**:

```
01 ← 02 ← 03 ← 04 ← 05
```

- Layer 01 depends on nothing
- Layer 02 depends only on 01
- Layer 03 depends on 01, 02
- Layer 04 depends on 01, 02, 03
- Layer 05 depends on 01, 02, 03, 04

**2. Clear Mental Model**:
- New developers immediately understand the architecture
- Numbers indicate order of dependency
- Physical structure matches logical architecture

**3. Prevents Circular Dependencies**:
- ESLint rules can enforce numbered imports
- TypeScript path mappings can restrict access
- Build tools can validate dependency graph

**4. Easy to Navigate**:
- Know exactly where to find code
- No ambiguity about layer boundaries
- Consistent across projects

---

## B. Flat Infrastructure Structure

An alternative to numbered layers that emphasizes technology grouping.

### 1. Overview

```
src/
├── domain/                       # Pure business logic
│   ├── models/
│   ├── errors/
│   └── rules/
│
├── ports/                        # All port definitions
│   ├── OrderService.ts
│   ├── OrderRepository.ts
│   └── PaymentGateway.ts
│
├── services/                     # Application services
│   ├── OrderService.live.ts
│   └── CheckoutService.live.ts
│
├── infrastructure/               # Flat adapter structure
│   ├── persistence/
│   │   ├── OrderRepository.postgres.ts
│   │   └── OrderRepository.memory.ts
│   ├── messaging/
│   │   └── EmailService.smtp.ts
│   └── external/
│       └── PaymentGateway.stripe.ts
│
├── interfaces/                   # Primary adapters
│   ├── http/
│   └── cli/
│
└── main.ts
```

### 2. Characteristics

**Flat Infrastructure Organization**:

```
infrastructure/
├── persistence/
│   ├── OrderRepository.postgres.ts
│   ├── OrderRepository.memory.ts
│   ├── UserRepository.postgres.ts
│   └── UserRepository.memory.ts
│
├── messaging/
│   ├── EmailService.smtp.ts
│   └── EmailService.fake.ts
│
├── external/
│   ├── PaymentGateway.stripe.ts
│   ├── PaymentGateway.mock.ts
│   └── ShippingService.fedex.ts
│
└── cache/
    ├── Cache.redis.ts
    └── Cache.memory.ts
```

**Benefits**:
- Simpler folder structure
- All adapters for a port co-located
- Easy to see all implementations
- Less nesting

**Trade-offs**:
- Less explicit dependency flow
- Requires discipline to maintain boundaries
- May need ESLint rules to enforce separation

---

## C. Feature-Based Structure (Vertical Slices)

Organize by business feature rather than technical layer.

### 1. Overview

```
src/
├── features/
│   ├── checkout/
│   │   ├── domain/
│   │   │   ├── CheckoutCart.model.ts
│   │   │   └── CheckoutErrors.error.ts
│   │   ├── ports/
│   │   │   ├── CheckoutRepository.port.ts
│   │   │   └── PaymentProcessor.port.ts
│   │   ├── services/
│   │   │   └── ProcessCheckout.service.ts
│   │   ├── adapters/
│   │   │   ├── CheckoutRepository.postgres.ts
│   │   │   └── PaymentProcessor.stripe.ts
│   │   ├── CheckoutLayer.ts
│   │   └── index.ts              # Public API
│   │
│   ├── inventory/
│   │   ├── domain/
│   │   ├── ports/
│   │   ├── services/
│   │   ├── adapters/
│   │   ├── InventoryLayer.ts
│   │   └── index.ts
│   │
│   └── user-management/
│       ├── domain/
│       ├── ports/
│       ├── services/
│       ├── adapters/
│       ├── UserManagementLayer.ts
│       └── index.ts
│
├── shared/                       # Cross-cutting concerns
│   ├── kernel/
│   │   ├── Money.value.ts
│   │   └── Email.value.ts
│   └── infrastructure/
│       └── Database.live.ts
│
└── main.ts
```

### 2. Feature Slice Structure

Each feature contains all layers within it:

```
features/checkout/
├── domain/                       # Checkout-specific domain
│   ├── CheckoutCart.model.ts
│   ├── CheckoutErrors.error.ts
│   └── CheckoutRules.ts
│
├── ports/                        # Checkout-specific ports
│   ├── CheckoutRepository.port.ts
│   ├── CheckoutRepository.port.fake.ts
│   └── PaymentProcessor.port.ts
│
├── services/                     # Checkout use cases
│   ├── ProcessCheckout.service.ts
│   ├── ValidateCheckout.service.ts
│   └── ProcessCheckout.service.integration.test.ts
│
├── adapters/                     # Checkout adapters
│   ├── CheckoutRepository.postgres.ts
│   ├── PaymentProcessor.stripe.ts
│   └── CheckoutApi.http-adapter.ts
│
├── CheckoutLayer.ts              # Feature composition
└── index.ts                      # Public exports
```

**Example - Feature Layer**:

```typescript
// features/checkout/CheckoutLayer.ts
import { Layer } from "effect"
import { ProcessCheckoutService } from "./services/ProcessCheckout.service"
import { CheckoutRepositoryPostgresLive } from "./adapters/CheckoutRepository.postgres"
import { PaymentProcessorStripeLive } from "./adapters/PaymentProcessor.stripe"

/**
 * CHECKOUT FEATURE LAYER
 * 
 * All checkout-related services and adapters.
 */
export const CheckoutLayer = Layer.mergeAll(
  ProcessCheckoutService.Default,
  CheckoutRepositoryPostgresLive,
  PaymentProcessorStripeLive
)
```

**Example - Public API**:

```typescript
// features/checkout/index.ts

// Export only what other features need
export { ProcessCheckoutService } from "./services/ProcessCheckout.service"
export { CheckoutLayer } from "./CheckoutLayer"
export type { CheckoutCart } from "./domain/CheckoutCart.model"
export type { CheckoutErrors } from "./domain/CheckoutErrors.error"

// Internal details not exported:
// - CheckoutRepository (internal port)
// - PaymentProcessor (internal port)  
// - Adapters (internal implementations)
```

### 3. Benefits of Vertical Slices

**1. Feature Autonomy**:
- Each feature is self-contained
- Teams can own entire features
- Easy to understand feature scope

**2. Easy to Extract**:

```typescript
// Move feature to separate package/service
@company/checkout-feature
@company/inventory-feature
@company/user-management-feature
```

**3. Reduced Coupling**:
- Features only expose public API
- Internal details hidden
- Clear inter-feature dependencies

**4. Parallel Development**:
- Teams work independently on features
- Reduced merge conflicts
- Clear ownership boundaries

### 4. Cross-Feature Dependencies

Features can depend on other features through public APIs:

```typescript
// features/order-fulfillment/services/FulfillOrder.service.ts
import { ProcessCheckoutService } from "../../checkout"  // Public API
import { InventoryService } from "../../inventory"       // Public API

export class FulfillOrderService extends Effect.Service<FulfillOrderService>()(
  "FulfillOrderService",
  {
    dependencies: [
      ProcessCheckoutService.Default,  // Cross-feature dependency
      InventoryService.Default         // Cross-feature dependency
    ],
    
    effect: Effect.gen(function* () {
      const checkout = yield* ProcessCheckoutService
      const inventory = yield* InventoryService
      
      return {
        fulfill: (orderId: OrderId) =>
          Effect.gen(function* () {
            // Use public APIs from other features
            // ...
          })
      }
    })
  }
) {}
```

---

## D. When to Use Each Structure

### 1. Numbered Layers (Recommended)

**Use When**:
- New to hexagonal architecture
- Team needs clear guidance
- Want explicit dependency flow
- Building traditional monolith
- Need strict architectural enforcement

**Best For**:
- Learning Effect-TS patterns
- Teams with mixed experience
- Projects that need stability
- Clear architectural boundaries

### 2. Flat Infrastructure

**Use When**:
- Small to medium projects
- Fewer layers of abstraction
- Want simpler structure
- Team has strong architectural discipline

**Best For**:
- Rapid prototyping
- Smaller teams
- Projects with few adapters
- Experienced teams

### 3. Feature-Based (Vertical Slices)

**Use When**:
- Large, complex domains
- Multiple teams working in parallel
- Features may become microservices
- Need feature autonomy
- Clear business capabilities

**Best For**:
- Microservice architectures
- Domain-driven design
- Large teams
- Feature-based ownership
- Evolutionary architecture

---

## E. Hybrid Approaches

You can combine structures as needed:

```
src/
├── features/                     # Vertical slices for main features
│   ├── checkout/
│   ├── inventory/
│   └── orders/
│
├── shared/                       # Shared with numbered layers
│   ├── 01-domain/
│   │   └── kernel/               # Shared domain concepts
│   ├── 02-ports/
│   │   └── common/               # Shared ports
│   └── 04-adapters/
│       └── infrastructure/       # Shared infrastructure
│
└── main.ts
```

**When to Use Hybrid**:
- Large applications with distinct features
- Some shared infrastructure needed
- Want benefits of both approaches
- Different parts have different needs

---

This directory structure taxonomy provides three clear patterns for organizing Effect-TS hexagonal architecture projects, with guidance on when to use each approach and how to combine them when beneficial.
