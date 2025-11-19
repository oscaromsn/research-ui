---
modified: 2025-10-26T20:50:03-03:00
---
# A Mental Model for Effect-TS Architecture

## The Core Problem: Service Ubiquity

Service ubiquity occurs when dependencies spread unchecked across your codebase, creating "god services" that everything depends on. Here's how to prevent it:

## The Three-Layer Mental Model

Think of your application as three distinct zones with strict communication rules:

```typescript
// 1. CORE DOMAIN - Zero dependencies, pure business logic
namespace Domain {
  export interface Order {
    id: OrderId
    items: OrderItem[]
    status: OrderStatus
  }
  
  export const calculateTotal = (order: Order): Money =>
    order.items.reduce((sum, item) => 
      Money.add(sum, Money.multiply(item.price, item.quantity)),
      Money.zero
    )
  
  // Pure domain rules - no Effect, no services
  export const canShip = (order: Order): boolean =>
    order.status === "paid" && order.items.every(i => i.inStock)
}

// 2. APPLICATION LAYER - Orchestration with minimal logic
namespace Application {
  // Use-case specific service
  export class ProcessOrder extends Context.Tag("ProcessOrder")
    ProcessOrder,
    {
      readonly execute: (orderId: OrderId) => Effect.Effect
        void,
        PaymentError | ShippingError | NotificationError
      >
    }
  >() {}
}

// 3. INFRASTRUCTURE - All external concerns
namespace Infrastructure {
  export class PaymentGateway extends Context.Tag("PaymentGateway")
    PaymentGateway,
    { readonly charge: (amount: Money, card: Card) => Effect.Effect<ChargeId> }
  >() {}
}
```

## Pattern 1: Vertical Slice Architecture

Instead of horizontal layers that encourage ubiquitous services, organize by feature:

```typescript
// ❌ BAD: Horizontal organization leads to ubiquitous dependencies
src/
  services/
    UserService.ts      // Everything user-related
    OrderService.ts     // Everything order-related
    EmailService.ts     // Used everywhere
  
// ✅ GOOD: Vertical slices with clear boundaries
src/
  features/
    checkout/
      CheckoutService.ts
      CheckoutRepository.ts
      CheckoutErrors.ts
      CheckoutLayer.ts
    
    inventory/
      InventoryService.ts
      InventoryRepository.ts
      InventoryErrors.ts
      InventoryLayer.ts
```

Each feature slice exports only what others need:

```typescript
// checkout/index.ts - Public API
export { CheckoutCommand } from "./CheckoutService"
export { CheckoutCompletedEvent } from "./CheckoutEvents"
export { CheckoutLayer } from "./CheckoutLayer"

// Hide internal implementation
// NOT exported: CheckoutRepository, internal helpers, etc.
```

## Pattern 2: Command/Query Segregation

Prevent service bloat by separating read and write concerns:

```typescript
// Commands - Change state, return minimal data
class CreateOrderCommand extends Context.Tag("CreateOrderCommand")
  CreateOrderCommand,
  {
    readonly execute: (items: Item[]) => Effect.Effect<OrderId, CreateOrderError>
  }
>() {}

// Queries - Read state, never modify
class OrderQueries extends Context.Tag("OrderQueries")
  OrderQueries,
  {
    readonly findById: (id: OrderId) => Effect.Effect<OrderView>
    readonly listByUser: (userId: UserId) => Effect.Effect<OrderView[]>
    readonly getStatistics: (range: DateRange) => Effect.Effect<OrderStats>
  }
>() {}

// Separate layers for different concerns
const CommandLayer = Layer.effect(
  CreateOrderCommand,
  Effect.gen(function* () {
    const repo = yield* OrderWriteRepository
    const events = yield* EventBus
    
    return {
      execute: (items) => pipe(
        createOrder(items),
        Effect.flatMap(repo.save),
        Effect.tap(order => events.publish(OrderCreatedEvent(order)))
      )
    }
  })
)

const QueryLayer = Layer.effect(
  OrderQueries,
  Effect.gen(function* () {
    const readModel = yield* OrderReadModel
    return {
      findById: readModel.findById,
      listByUser: readModel.listByUser,
      getStatistics: readModel.calculateStats
    }
  })
)
```

## Pattern 3: Capability-Based Services

Define services by capabilities, not entities:

```typescript
// ❌ BAD: Entity-based service becomes ubiquitous
class UserService extends Context.Tag("UserService")
  UserService,
  {
    readonly create: (data: CreateUserData) => Effect.Effect<User>
    readonly update: (id: UserId, data: UpdateUserData) => Effect.Effect<User>
    readonly delete: (id: UserId) => Effect.Effect<void>
    readonly authenticate: (credentials: Credentials) => Effect.Effect<Token>
    readonly sendEmail: (id: UserId, email: Email) => Effect.Effect<void>
    readonly calculateAge: (user: User) => number
    readonly validatePassword: (password: string) => boolean
    // ... keeps growing
  }
>() {}

// ✅ GOOD: Capability-based services
class Authentication extends Context.Tag("Authentication")
  Authentication,
  {
    readonly authenticate: (credentials: Credentials) => Effect.Effect<Token>
    readonly refresh: (token: Token) => Effect.Effect<Token>
  }
>() {}

class UserNotifications extends Context.Tag("UserNotifications")
  UserNotifications,
  {
    readonly notifyPasswordReset: (userId: UserId) => Effect.Effect<void>
    readonly notifyAccountCreated: (userId: UserId) => Effect.Effect<void>
  }
>() {}

class UserLifecycle extends Context.Tag("UserLifecycle")
  UserLifecycle,
  {
    readonly onboard: (data: OnboardingData) => Effect.Effect<User>
    readonly deactivate: (userId: UserId) => Effect.Effect<void>
  }
>() {}
```

## Pattern 4: Bounded Context Layers

Create explicit boundaries between different domains:

```typescript
// Each bounded context has its own models
namespace Billing {
  export interface Customer {
    id: CustomerId
    paymentMethods: PaymentMethod[]
    billingAddress: Address
  }
}

namespace Shipping {
  export interface Recipient {
    id: RecipientId
    shippingAddress: Address
    preferences: ShippingPreferences
  }
}

// Anti-Corruption Layer - Translates between contexts
class CustomerToRecipientAdapter extends Context.Tag("CustomerToRecipientAdapter")
  CustomerToRecipientAdapter,
  {
    readonly adapt: (customer: Billing.Customer) => Shipping.Recipient
  }
>() {}

// Each context has its own layer stack
const BillingLayer = Layer.mergeAll(
  PaymentProcessorLayer,
  InvoiceGeneratorLayer,
  TaxCalculatorLayer
)

const ShippingLayer = Layer.mergeAll(
  CarrierIntegrationLayer,
  WarehouseManagementLayer,
  TrackingLayer
)

// Composed at application root with explicit adapters
const ApplicationLayer = Layer.mergeAll(
  BillingLayer,
  ShippingLayer,
  CustomerToRecipientAdapterLayer
)
```

## Pattern 5: Service Granularity Rules

Follow these rules to determine service boundaries:

```typescript
// Rule 1: One reason to change
// ❌ BAD: Multiple reasons to change
class OrderService {
  calculateTax() {}     // Changes with tax law
  validateCoupon() {}   // Changes with marketing rules
  checkInventory() {}   // Changes with warehouse system
}

// ✅ GOOD: Single responsibility
class TaxCalculator {
  calculate(order: Order, location: Location): Effect.Effect<Tax>
}

// Rule 2: Stable dependencies only
// ❌ BAD: Depends on volatile implementation
class ReportGenerator extends Context.Tag("ReportGenerator")
  ReportGenerator,
  {
    readonly generate: () => Effect.Effect<Report, never, 
      Database & EmailService & S3Client & PdfGenerator>
  }
>() {}

// ✅ GOOD: Depends on stable abstractions
class ReportGenerator extends Context.Tag("ReportGenerator")
  ReportGenerator,
  {
    readonly generate: () => Effect.Effect<Report, never, 
      ReportData & ReportStorage>
  }
>() {}

// Rule 3: Compose, don't couple
// ❌ BAD: Direct coupling
const processOrder = Effect.gen(function* () {
  const user = yield* UserService
  const order = yield* OrderService
  const payment = yield* PaymentService
  
  // Services know about each other
  return yield* order.processWithUserAndPayment(user, payment)
})

// ✅ GOOD: Orchestration through composition
const processOrder = Effect.gen(function* () {
  const validateUser = yield* UserValidator
  const createOrder = yield* CreateOrderCommand
  const chargePayment = yield* PaymentProcessor
  
  // Pure orchestration
  return yield* pipe(
    validateUser.validate(userId),
    Effect.flatMap(() => createOrder.execute(items)),
    Effect.flatMap(order => chargePayment.charge(order.total)),
    Effect.map(payment => ({ orderId, paymentId: payment.id }))
  )
})
```

## Pattern 6: Event-Driven Boundaries

Use events to decouple services:

```typescript
// Define domain events
interface OrderPlaced {
  readonly _tag: "OrderPlaced"
  readonly orderId: OrderId
  readonly userId: UserId
  readonly total: Money
  readonly timestamp: Date
}

// Services communicate through events, not direct calls
const OrderProcessingLayer = Layer.effect(
  OrderProcessor,
  Effect.gen(function* () {
    const events = yield* EventBus
    
    return {
      process: (order) => pipe(
        validateOrder(order),
        Effect.flatMap(saveOrder),
        Effect.tap(() => 
          events.publish<OrderPlaced>({
            _tag: "OrderPlaced",
            orderId: order.id,
            userId: order.userId,
            total: order.total,
            timestamp: new Date()
          })
        )
      )
    }
  })
)

// Other services react to events independently
const InventoryLayer = Layer.effect(
  InventoryManager,
  Effect.gen(function* () {
    const events = yield* EventBus
    
    // Subscribe to relevant events
    yield* events.subscribe("OrderPlaced", (event) =>
      reserveInventory(event.orderId)
    )
    
    return {
      // ... inventory methods
    }
  })
)
```

## The Dependency Rule

Always follow this mental model for dependencies:

```
Domain Core → Application Services → Infrastructure Adapters
     ←               ←                      ←
   Never          Sometimes              Always
```

```typescript
// Domain never depends on anything
namespace Domain {
  export const calculateDiscount = (order: Order): Discount => 
    // Pure logic
}

// Application depends on domain and abstractions
namespace Application {
  const applyDiscount = Effect.gen(function* () {
    const repo = yield* OrderRepository  // abstraction
    const order = yield* repo.findById(id)
    return Domain.calculateDiscount(order)  // uses domain
  })
}

// Infrastructure depends on everything
namespace Infrastructure {
  const PostgresOrderRepository = Layer.succeed(
    OrderRepository,
    {
      findById: (id) => 
        Effect.tryPromise(() => db.query(`SELECT * FROM orders WHERE id = $1`, [id]))
          .pipe(Effect.map(toDomainOrder))  // knows about domain
    }
  )
}
```

## Testing as Architecture Validation

If your architecture is correct, testing should be trivial:

```typescript
// Good architecture = Easy testing
test("order processing", () => {
  const TestLayer = Layer.mergeAll(
    Layer.succeed(OrderRepository, { save: () => Effect.succeed(void) }),
    Layer.succeed(PaymentGateway, { charge: () => Effect.succeed("charge-id") }),
    Layer.succeed(EventBus, { publish: () => Effect.succeed(void) })
  )
  
  // If you need more than 3-4 test doubles, your service is too coupled
  const result = await Effect.runPromise(
    pipe(program, Effect.provide(TestLayer))
  )
})
```

## Key Takeaways

1. **Think in capabilities, not entities** - UserAuthentication, not UserService
2. **Vertical slices over horizontal layers** - Feature folders with their own layers
3. **Events for integration** - Services publish events, not call each other
4. **Explicit boundaries** - Anti-corruption layers between contexts
5. **Dependency direction** - Core → App → Infra, never reverse
6. **Small, focused services** - If it has "and" in the description, split it
7. **Test complexity as a metric** - Hard to test = poor boundaries

This mental model ensures your Effect-TS application remains maintainable and avoids the ubiquitous service trap that plagues many codebases.
