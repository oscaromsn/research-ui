---
modified: 2025-10-26T14:32:35-03:00
---
# Hexagonal Architecture (Ports and Adapters)

Hexagonal Architecture, created by Alistair Cockburn, is a pattern that promotes separation of concerns by organizing code into distinct layers with clear boundaries. The name comes from visualizing the application as a hexagon, though the number of sides isn't significant—what matters is the architectural principle.

## Core Concepts

### 1. **The Hexagon (Application Core)**

The center of the architecture contains your **domain logic**—pure business rules independent of any external concerns:

```typescript
// Domain model - no dependencies on frameworks or external systems
export class Order extends Schema.Class<Order>("Order")({
  id: Schema.String,
  items: Schema.Array(OrderItem),
  total: Schema.Number,
  status: Schema.Literal("pending", "confirmed", "shipped")
}) {
  // Business logic methods
  confirm(): Effect.Effect<Order, OrderError> {
    if (this.items.length === 0) {
      return Effect.fail(new OrderError({ reason: "empty" }));
    }
    return Effect.succeed(new Order({ ...this, status: "confirmed" }));
  }
}
```

### 2. **Ports (Interfaces)**

Ports are **abstract interfaces** that define how the application core communicates with the outside world. They come in two flavors:

#### **Primary Ports (Driving/Inbound)**
What your application **offers** to the outside world. These are the use cases or services that external actors (users, systems) invoke.

```typescript
// Primary port - defines what the application can do
export class OrderService extends Effect.Service<OrderService>()("app/OrderService", {
  effect: Effect.gen(function* () {
    return {
      // Use cases exposed to the outside
      placeOrder: (items: OrderItem[]): Effect.Effect<Order, OrderError> =>
        Effect.gen(function* () {
          // Business logic here
          const order = yield* Order.create(items);
          yield* order.confirm();
          return order;
        }),
      
      getOrder: (id: string): Effect.Effect<Order, OrderNotFoundError> =>
        Effect.fail(new OrderNotFoundError({ id }))
    };
  })
}) {}
```

#### **Secondary Ports (Driven/Outbound)**
What your application **needs** from the outside world. These define dependencies on external systems.

```typescript
// Secondary port - defines what the application needs
export class OrderRepository extends Effect.Service<OrderRepository>()("app/OrderRepository", {
  effect: Effect.gen(function* () {
    return {
      save: (order: Order): Effect.Effect<void, DatabaseError> =>
        Effect.die("not implemented"),
      
      findById: (id: string): Effect.Effect<Order, OrderNotFoundError | DatabaseError> =>
        Effect.die("not implemented")
    };
  })
}) {}

// Another secondary port
export class PaymentGateway extends Effect.Service<PaymentGateway>()("app/PaymentGateway", {
  effect: Effect.gen(function* () {
    return {
      charge: (amount: number, token: string): Effect.Effect<PaymentReceipt, PaymentError> =>
        Effect.die("not implemented")
    };
  })
}) {}
```

### 3. **Adapters (Implementations)**

Adapters are **concrete implementations** that connect ports to real-world technologies. They translate between your domain and external systems.

#### **Primary Adapters (Driving)**
Convert external requests into calls to your primary ports.

```typescript
// HTTP Adapter - translates HTTP requests to domain operations
const OrderApi = HttpApiGroup.make("orders")
  .add(
    HttpApiEndpoint.post("createOrder", "/orders")
      .setPayload(Schema.Struct({
        items: Schema.Array(OrderItemSchema)
      }))
      .addSuccess(OrderSchema)
      .addError(OrderErrorSchema)
  );

const OrderApiLive = HttpApiBuilder.group(OrderApi, "orders", (handlers) =>
  handlers.handle("createOrder", ({ payload }) =>
    Effect.gen(function* () {
      const orderService = yield* OrderService;
      // Adapter translates HTTP payload to domain operation
      return yield* orderService.placeOrder(payload.items);
    })
  )
);
```

```typescript
// CLI Adapter - translates CLI commands to domain operations
const createOrderCommand = Command.make("create-order")
  .pipe(
    Command.withHandler(({ args }) =>
      Effect.gen(function* () {
        const orderService = yield* OrderService;
        // Adapter translates CLI args to domain operation
        const order = yield* orderService.placeOrder(args.items);
        yield* Console.log(`Order created: ${order.id}`);
      })
    )
  );
```

#### **Secondary Adapters (Driven)**
Implement secondary ports using specific technologies.

```typescript
// PostgreSQL Adapter for OrderRepository
export const OrderRepositoryPostgres = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    
    return OrderRepository.of({
      save: (order: Order) =>
        sql`INSERT INTO orders ${sql.insert(order)}`.pipe(
          Effect.mapError((e) => new DatabaseError({ cause: e }))
        ),
      
      findById: (id: string) =>
        sql<Order>`SELECT * FROM orders WHERE id = ${id}`.pipe(
          Effect.flatMap(Schema.decodeUnknown(OrderSchema)),
          Effect.mapError((e) => 
            e instanceof ParseError 
              ? new DatabaseError({ cause: e })
              : new OrderNotFoundError({ id })
          )
        )
    });
  })
);

// In-Memory Adapter for OrderRepository (testing)
export const OrderRepositoryMemory = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const storage = yield* Ref.make(new Map<string, Order>());
    
    return OrderRepository.of({
      save: (order) =>
        Ref.update(storage, (map) => map.set(order.id, order)),
      
      findById: (id) =>
        Effect.gen(function* () {
          const map = yield* Ref.get(storage);
          const order = map.get(id);
          if (!order) {
            return yield* Effect.fail(new OrderNotFoundError({ id }));
          }
          return order;
        })
    });
  })
);
```

```typescript
// Stripe Adapter for PaymentGateway
export const PaymentGatewayStripe = Layer.effect(
  PaymentGateway,
  Effect.gen(function* () {
    const config = yield* StripeConfig;
    const client = createStripeClient(config);
    
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
    });
  })
);
```

## Key Benefits

### 1. **Technology Independence**
Your domain logic doesn't know about HTTP, databases, or external APIs. You can swap PostgreSQL for MongoDB, REST for GraphQL, or Stripe for PayPal by just swapping adapters.

```typescript
// Development: use in-memory adapters
const DevLayer = Layer.mergeAll(
  OrderRepositoryMemory,
  PaymentGatewayMock
);

// Production: use real implementations
const ProdLayer = Layer.mergeAll(
  OrderRepositoryPostgres,
  PaymentGatewayStripe
);

// Same application logic works with either!
const app = myBusinessLogic.pipe(Effect.provide(DevLayer)); // or ProdLayer
```

### 2. **Testability**
Test your business logic in isolation using fast, in-memory test doubles:

```typescript
it.effect("should place order successfully", () =>
  Effect.gen(function* () {
    const orderService = yield* OrderService;
    const order = yield* orderService.placeOrder([
      { sku: "ABC", quantity: 1 }
    ]);
    
    assert.strictEqual(order.status, "confirmed");
  }).pipe(
    // Provide test adapters instead of real ones
    Effect.provide(OrderRepositoryMemory),
    Effect.provide(PaymentGatewayMock)
  )
);
```

### 3. **Parallel Development**
Teams can work on different adapters simultaneously once ports are defined:
- Frontend team builds HTTP adapter
- Backend team builds persistence adapter
- Domain team builds business logic
- All work in parallel against the same interfaces

### 4. **Evolutionary Architecture**
Start with simple adapters and evolve them:
- Begin with in-memory storage
- Move to SQLite for MVP
- Scale to PostgreSQL with read replicas
- Add Redis caching layer
- **Domain logic never changes**

## Effect-TS Implementation Pattern

In Effect, the pattern maps beautifully to its service system:

```typescript
// 1. Define domain (pure business logic)
// domain/Order.ts
export class Order extends Schema.Class<Order>("Order")({ /* ... */ }) {
  // Business methods
}

// 2. Define ports (Effect Services)
// services/OrderService.ts - Primary Port
export class OrderService extends Effect.Service<OrderService>()(/* ... */) {}

// services/OrderRepository.ts - Secondary Port
export class OrderRepository extends Effect.Service<OrderRepository>()(/* ... */) {}

// 3. Implement primary port using secondary ports
// services/OrderService.impl.ts
export const OrderServiceLive = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    // Depend on secondary ports
    const repo = yield* OrderRepository;
    const payment = yield* PaymentGateway;
    
    return OrderService.of({
      placeOrder: (items) =>
        Effect.gen(function* () {
          // Business logic using dependencies
          const order = yield* Order.create(items);
          yield* payment.charge(order.total, "token");
          yield* repo.save(order);
          return order;
        })
    });
  })
);

// 4. Implement adapters (multiple implementations)
// adapters/OrderRepository.postgres.ts
export const OrderRepositoryPostgres = Layer.effect(/* ... */);

// adapters/OrderRepository.memory.ts
export const OrderRepositoryMemory = Layer.effect(/* ... */);

// 5. Compose everything
// main.ts
const ProdLayer = Layer.mergeAll(
  OrderServiceLive,           // Primary port implementation
  OrderRepositoryPostgres,    // Secondary adapter
  PaymentGatewayStripe,       // Secondary adapter
  HttpServer.Default          // Primary adapter
);

const program = OrderApiLive.pipe(Effect.provide(ProdLayer));
```

## Directory Structure

```
src/
├── domain/              # The hexagon center (pure business logic)
│   ├── models.ts
│   └── errors.ts
├── services/            # Ports (interfaces)
│   ├── OrderService.ts          # Primary port definition
│   ├── OrderService.impl.ts     # Primary port implementation
│   ├── OrderRepository.ts       # Secondary port definition
│   └── PaymentGateway.ts        # Secondary port definition
└── adapters/            # Adapter implementations
    ├── http/            # Primary adapters (driving)
    │   └── OrderApi.ts
    ├── cli/
    │   └── OrderCommands.ts
    └── infrastructure/  # Secondary adapters (driven)
        ├── OrderRepository.postgres.ts
        ├── OrderRepository.memory.ts
        ├── PaymentGateway.stripe.ts
        └── PaymentGateway.mock.ts
```

---

The beauty of Hexagonal Architecture with Effect is that **ports are Effect Services** and **adapters are Layers**. The type system ensures all connections are valid, and the layer system handles dependency injection automatically. You get a clean architecture that's also completely type-safe and composable.
