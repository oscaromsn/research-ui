---
modified: 2025-10-26T22:47:37-03:00
---
# Naming Conventions to Enforce Good Services Architecture in Effect

## Service Naming: Intent Over Entity

Names should reveal the service's capability and scope, preventing scope creep:

```typescript
// ❌ BAD: Entity-based names invite feature creep
class UserService {}      // Will grow to 50+ methods
class OrderService {}     // Becomes a dumping ground
class EmailService {}     // Used everywhere

// ✅ GOOD: Capability-based names with clear boundaries
class UserAuthenticator {}           // Only authentication
class UserRegistration {}            // Only registration flow
class OrderCheckout {}               // Only checkout process
class OrderFulfillment {}            // Only fulfillment
class EmailDelivery {}               // Only sending
class EmailTemplateRenderer {}       // Only template rendering
```

## Command/Query/Event Naming Pattern

Use suffixes to make intent crystal clear:

```typescript
// Commands - Imperative mood with "Command" suffix
class CreateOrderCommand {}
class ShipOrderCommand {}
class CancelSubscriptionCommand {}
class UpdateInventoryCommand {}

// Queries - Question form or "Query" suffix
class GetOrderByIdQuery {}
class FindActiveUsersQuery {}
class CalculateTotalRevenueQuery {}
class OrderStatusQuery {}

// Events - Past tense with context
class OrderCreatedEvent {}
class PaymentProcessedEvent {}
class InventoryUpdatedEvent {}
class UserOnboardedEvent {}

// Handlers follow the same pattern
class CreateOrderCommandHandler {}
class OrderCreatedEventHandler {}
class GetOrderByIdQueryHandler {}
```

## Layer Naming: Explicit Dependencies

Layer names should indicate their level and dependencies:

```typescript
// Core layers - prefix with "Core"
const CoreDomainLayer = Layer.empty  // No dependencies
const CoreValidationLayer = Layer.succeed(...)

// Feature layers - prefix with feature name
const CheckoutServiceLayer = Layer.effect(...)
const CheckoutRepositoryLayer = Layer.effect(...)
const CheckoutLayer = Layer.mergeAll(
  CheckoutServiceLayer,
  CheckoutRepositoryLayer
)

// Infrastructure layers - prefix with "Live" or implementation
const LiveDatabaseLayer = Layer.scoped(...)
const PostgresOrderRepositoryLayer = Layer.effect(...)
const RedisSessionStoreLayer = Layer.effect(...)

// Test layers - prefix with "Test" or "Mock"
const TestDatabaseLayer = Layer.succeed(...)
const MockPaymentGatewayLayer = Layer.succeed(...)
const InMemoryRepositoryLayer = Layer.succeed(...)

// Composed layers - descriptive names
const PersistenceLayer = Layer.mergeAll(
  LiveDatabaseLayer,
  PostgresOrderRepositoryLayer,
  RedisSessionStoreLayer
)

const ApplicationLayer = Layer.mergeAll(
  CheckoutLayer,
  PersistenceLayer
)
```

## Effect Type Naming: Reveal Complexity

Include key information in type aliases:

```typescript
// ❌ BAD: Hides important details
type CreateUser = Effect.Effect<User>

// ✅ GOOD: Makes dependencies and errors explicit
type CreateUser = Effect.Effect
  User,
  ValidationError | DatabaseError,
  UserRepository & EmailService & EventBus
>

// Even better: Use descriptive type aliases for complex effects
namespace UserOperations {
  // Shows it's a pure validation
  export type ValidateUserData = (
    data: unknown
  ) => Effect.Effect<ValidUserData, ValidationError>
  
  // Shows it needs infrastructure
  export type PersistUser = (
    user: ValidUserData
  ) => Effect.Effect<User, DatabaseError, UserRepository>
  
  // Shows it's an orchestration
  export type RegisterUser = (
    data: unknown
  ) => Effect.Effect
    User,
    RegistrationError,
    UserRepository & EmailService & EventBus
  >
}
```

## Error Naming: Domain-Specific Context

Errors should indicate their domain and be specific:

```typescript
// ❌ BAD: Generic errors used everywhere
class NotFoundError {}
class ValidationError {}
class DatabaseError {}

// ✅ GOOD: Domain-specific errors
class OrderNotFoundError {
  readonly _tag = "OrderNotFoundError"
  constructor(readonly orderId: OrderId) {}
}

class InvalidOrderStateError {
  readonly _tag = "InvalidOrderStateError"
  constructor(
    readonly orderId: OrderId,
    readonly currentState: OrderState,
    readonly attemptedTransition: OrderState
  ) {}
}

class CheckoutValidationError {
  readonly _tag = "CheckoutValidationError"
  constructor(readonly failures: ReadonlyArray<ValidationFailure>) {}
}

// Group related errors
namespace CheckoutErrors {
  export class EmptyCartError {
    readonly _tag = "Checkout.EmptyCartError"
  }
  
  export class PaymentDeclinedError {
    readonly _tag = "Checkout.PaymentDeclinedError"
    constructor(readonly reason: string) {}
  }
  
  export class InsufficientInventoryError {
    readonly _tag = "Checkout.InsufficientInventoryError"
    constructor(readonly items: ReadonlyArray<ItemId>) {}
  }
  
  export type All = 
    | EmptyCartError 
    | PaymentDeclinedError 
    | InsufficientInventoryError
}
```

## Module and Namespace Organization

Use nested namespaces to enforce boundaries:

```typescript
// Features grouped by capability
namespace Checkout {
  export namespace Domain {
    export interface Cart {}
    export interface CheckoutSession {}
    export const validateCart = (cart: Cart): Either<ValidationError, ValidCart> => ...
  }
  
  export namespace Application {
    export class ProcessCheckoutCommand {}
    export class GetCartQuery {}
  }
  
  export namespace Infrastructure {
    export class PostgresCheckoutRepository {}
    export class StripePaymentGateway {}
  }
  
  export namespace Api {
    export class CheckoutController {}
    export const checkoutRoutes = ...
  }
}

// Shared concerns in their own namespace
namespace SharedKernel {
  export type Money = Branded<number, "Money">
  export type Email = Branded<string, "Email">
  export type UserId = Branded<string, "UserId">
}

// Cross-cutting concerns clearly marked
namespace Platform {
  export namespace Logging {}
  export namespace Monitoring {}
  export namespace Security {}
}
```

## Function Naming: Reveal Intent and Side Effects

Use naming to indicate purity and effects:

```typescript
// Pure functions - simple names
const calculateTotal = (items: Item[]): Money => ...
const isValidEmail = (email: string): boolean => ...
const toDomain = (dto: UserDTO): User => ...

// Effectful functions - prefixes indicate effects
const loadUserById = (id: UserId): Effect.Effect<User> => ...
const persistOrder = (order: Order): Effect.Effect<void> => ...
const fetchFromCache = (key: string): Effect.Effect<Option<Value>> => ...
const queryDatabase = (sql: string): Effect.Effect<Row[]> => ...

// Commands - imperative mood
const createOrder = (data: CreateOrderData): Effect.Effect<Order> => ...
const shipOrder = (orderId: OrderId): Effect.Effect<void> => ...
const cancelSubscription = (subId: SubscriptionId): Effect.Effect<void> => ...

// Queries - descriptive names
const findOrdersByUser = (userId: UserId): Effect.Effect<Order[]> => ...
const getActiveSubscriptions = (): Effect.Effect<Subscription[]> => ...
const calculateMonthlyRevenue = (month: Month): Effect.Effect<Money> => ...

// Event handlers - "on" or "handle" prefix
const onOrderCreated = (event: OrderCreatedEvent): Effect.Effect<void> => ...
const handlePaymentProcessed = (event: PaymentProcessedEvent): Effect.Effect<void> => ...

// Workflow orchestrations - descriptive process names
const processCheckout = (cart: Cart): Effect.Effect<Order> => ...
const fulfillOrder = (orderId: OrderId): Effect.Effect<void> => ...
const reconcileInventory = (): Effect.Effect<ReconciliationReport> => ...
```

## Repository Method Naming

Consistent patterns for data access:

```typescript
interface OrderRepository {
  // Existence checks
  exists(id: OrderId): Effect.Effect<boolean>
  existsByUser(userId: UserId): Effect.Effect<boolean>
  
  // Single entity retrieval
  findById(id: OrderId): Effect.Effect<Option<Order>>
  getById(id: OrderId): Effect.Effect<Order, OrderNotFoundError>
  
  // Multiple entity retrieval
  findAll(): Effect.Effect<Order[]>
  findByUser(userId: UserId): Effect.Effect<Order[]>
  findWhere(predicate: OrderPredicate): Effect.Effect<Order[]>
  
  // Persistence
  save(order: Order): Effect.Effect<Order>
  saveAll(orders: Order[]): Effect.Effect<void>
  
  // Updates
  update(order: Order): Effect.Effect<Order>
  updateStatus(id: OrderId, status: OrderStatus): Effect.Effect<void>
  
  // Deletion
  delete(id: OrderId): Effect.Effect<void>
  deleteWhere(predicate: OrderPredicate): Effect.Effect<number>
}
```

## File Structure Naming

File names that enforce architecture:

```
src/
  core/                          # Pure domain logic
    order/
      Order.ts                   # Domain entity
      OrderRules.ts              # Business rules
      OrderCalculations.ts       # Pure calculations
  
  application/                   # Use cases
    order/
      CreateOrderCommand.ts
      CreateOrderCommandHandler.ts
      GetOrderQuery.ts
      GetOrderQueryHandler.ts
  
  infrastructure/               # External concerns
    persistence/
      PostgresOrderRepository.ts
      RedisCache.ts
    
    messaging/
      KafkaEventBus.ts
      SqsMessageQueue.ts
    
    http/
      OrderController.ts
      OrderRoutes.ts
  
  shared/                       # Cross-cutting
    kernel/
      Money.ts
      Email.ts
    
    errors/
      DomainError.ts
      ApplicationError.ts
  
  test/                        # Test organization
    unit/
      core/
        OrderRules.test.ts
    
    integration/
      CreateOrderCommand.test.ts
    
    fixtures/
      OrderFixtures.ts
      UserFixtures.ts
```

## Type Branding for Boundaries

Use branded types with clear naming:

```typescript
// Domain types - prefixed with domain
type DomainOrderId = string & Brand<"Domain.OrderId">
type DomainUserId = string & Brand<"Domain.UserId">
type DomainMoney = number & Brand<"Domain.Money">

// API types - prefixed with API
type ApiOrderId = string & Brand<"Api.OrderId">
type ApiUserId = string & Brand<"Api.UserId">

// Database types - prefixed with DB
type DbOrderId = number & Brand<"Db.OrderId">
type DbUserId = number & Brand<"Db.UserId">

// Conversion functions make boundaries explicit
const toDomainOrderId = (dbId: DbOrderId): DomainOrderId => ...
const toApiOrderId = (domainId: DomainOrderId): ApiOrderId => ...
const toDbOrderId = (domainId: DomainOrderId): DbOrderId => ...
```

## Config and Environment Naming

Clear configuration boundaries:

```typescript
// Environment-specific configs
interface DatabaseConfig {
  readonly host: string
  readonly port: number
  readonly database: string
}

interface ApiConfig {
  readonly baseUrl: string
  readonly timeout: Duration
  readonly retryPolicy: RetryPolicy
}

// Layer names indicate configuration source
const LiveDatabaseConfig = Layer.effect(
  DatabaseConfig,
  Config.all({
    host: Config.string("DB_HOST"),
    port: Config.integer("DB_PORT"),
    database: Config.string("DB_NAME")
  })
)

const TestDatabaseConfig = Layer.succeed(
  DatabaseConfig,
  {
    host: "localhost",
    port: 5432,
    database: "test_db"
  }
)
```

## Workflow and Pipeline Naming

Names that describe the entire process:

```typescript
// Pipelines describe transformations
const userRegistrationPipeline = pipe(
  validateUserInput,
  Effect.flatMap(checkEmailUniqueness),
  Effect.flatMap(hashPassword),
  Effect.flatMap(createUser),
  Effect.flatMap(sendWelcomeEmail),
  Effect.tap(publishUserCreatedEvent)
)

// Workflows describe business processes
const orderFulfillmentWorkflow = {
  validateInventory,
  reserveStock,
  processPayment,
  createShipment,
  notifyCustomer,
  updateOrderStatus
}

// Sagas describe long-running transactions
const orderSaga = {
  start: startOrderTransaction,
  compensate: rollbackOrder,
  complete: commitOrder
}
```

## Key Naming Rules to Enforce

1. **Never use generic names** (`Service`, `Manager`, `Handler` alone)
2. **Suffixes indicate patterns** (`Command`, `Query`, `Event`, `Repository`, `Gateway`)
3. **Prefixes indicate scope** (`Live`, `Test`, `Mock`, `Core`, `Domain`)
4. **Namespaces enforce boundaries** (nest related concepts)
5. **Branded types at boundaries** (make invalid states unrepresentable)
6. **Descriptive over concise** (`ProcessCheckoutCommand` > `Checkout`)
7. **Consistency within bounded contexts** (same patterns throughout a feature)

## Testing Your Naming Conventions

Good naming should make these questions trivial to answer:
- What layer does this belong to?
- What are its dependencies?
- Is this pure or effectful?
- What errors can occur?
- What's the testing strategy?
- Who can call this?
- What boundary does this cross?

If you can't answer these from the name alone, refactor the name to be more explicit.
