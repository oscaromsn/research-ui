---
modified: 2025-10-26T14:33:20-03:00
---
# Hexagonal Architecture Directory Structure for Effect-TS

Let me design a structure that **enforces the contract-driven TDD workflow** and makes correctness, testability, and debuggability the path of least resistance.

## Core Principles

1. **Contracts are sacred** - They live in dedicated files and are defined before any implementation
2. **Tests travel with their targets** - Co-located for discoverability
3. **Dependency direction is enforced** - Structure prevents backwards dependencies
4. **Multiple implementations are explicit** - Easy to see all adapters for a port
5. **The workflow is visible** - File naming reflects the development phases

## Proposed Structure

```
src/
├── domain/                              # Phase 1a: Pure business logic (no I/O)
│   ├── models/
│   │   ├── Order.ts                    # Schema.Class with business methods
│   │   ├── Order.test.ts               # Pure domain logic tests
│   │   └── index.ts                    # Barrel export
│   │
│   ├── errors/
│   │   ├── OrderErrors.ts              # Data.TaggedError definitions
│   │   └── index.ts
│   │
│   └── types/
│       ├── OrderTypes.ts               # Branded types, value objects
│       └── index.ts
│
├── contracts/                           # Phase 1b: Service interfaces (ports)
│   ├── services/                        # Primary ports (inbound)
│   │   └── OrderService/
│   │       ├── contract.ts             # Effect.Service interface ONLY
│   │       ├── contract.test.ts        # Contract tests (with test double)
│   │       └── index.ts                # Export contract only
│   │
│   └── infrastructure/                  # Secondary ports (outbound)
│       ├── OrderRepository/
│       │   ├── contract.ts             # Repository interface
│       │   ├── contract.test.ts        # Contract tests
│       │   └── index.ts
│       │
│       └── PaymentGateway/
│           ├── contract.ts
│           ├── contract.test.ts
│           └── index.ts
│
├── application/                         # Phase 3a: Business logic implementations
│   └── services/
│       └── OrderService/
│           ├── live.ts                 # OrderServiceLive implementation
│           ├── live.test.ts            # Implementation-specific tests
│           └── index.ts
│
├── infrastructure/                      # Phase 3b: Infrastructure adapters
│   ├── repositories/
│   │   └── OrderRepository/
│   │       ├── memory.ts               # In-memory adapter (for testing)
│   │       ├── memory.test.ts          # Adapter behavior tests
│   │       ├── postgres.ts             # Production PostgreSQL adapter
│   │       ├── postgres.test.ts        # Adapter-specific tests
│   │       └── index.ts
│   │
│   └── external/
│       └── PaymentGateway/
│           ├── mock.ts                 # Mock for testing
│           ├── stripe.ts               # Stripe adapter
│           ├── stripe.test.ts
│           └── index.ts
│
├── interfaces/                          # Phase 4: Primary adapters (entry points)
│   ├── http/
│   │   ├── OrderApi.ts                 # HTTP API adapter
│   │   ├── OrderApi.test.ts            # End-to-end API tests
│   │   └── index.ts
│   │
│   └── cli/
│       ├── OrderCommands.ts
│       ├── OrderCommands.test.ts
│       └── index.ts
│
├── composition/                         # Application assembly
│   ├── layers.ts                       # Layer composition
│   ├── layers.test.ts                  # Integration tests
│   └── index.ts
│
└── main.ts                             # Entry point (Effect.provide once)
```

## File Naming Conventions

| File Type | Naming Pattern | Purpose |
|-----------|---------------|---------|
| **Contract** | `contract.ts` | Service interface definition (Effect.Service) |
| **Contract Tests** | `contract.test.ts` | Tests against the interface using test doubles |
| **Primary Implementation** | `live.ts` | Main business logic implementation |
| **Implementation Tests** | `live.test.ts` | Tests for the specific implementation |
| **Test Adapters** | `memory.ts`, `mock.ts` | In-memory/mock implementations for testing |
| **Production Adapters** | `postgres.ts`, `stripe.ts`, `http.ts` | Technology-specific implementations |
| **Adapter Tests** | `<adapter>.test.ts` | Tests for adapter-specific behavior |

## Dependency Flow

```
┌─────────────────────────────────────────────────────┐
│  interfaces/ (Primary Adapters)                     │
│  └─ Translate external requests → contracts         │
└──────────────────┬──────────────────────────────────┘
                   │ depends on
                   ↓
┌─────────────────────────────────────────────────────┐
│  application/ (Business Logic)                      │
│  └─ Implements primary contracts                    │
└──────────────────┬──────────────────────────────────┘
                   │ depends on
                   ↓
┌─────────────────────────────────────────────────────┐
│  contracts/ (Ports - Pure Interfaces)               │
│  ├─ services/ (Primary Ports)                       │
│  └─ infrastructure/ (Secondary Ports)               │
└──────────────────┬──────────────────────────────────┘
                   │ depends on
                   ↓
┌─────────────────────────────────────────────────────┐
│  domain/ (Pure Business Logic)                      │
│  └─ Models, Errors, Types (no Effect)               │
└─────────────────────────────────────────────────────┘
                   ↑
                   │ implemented by
┌──────────────────┴──────────────────────────────────┐
│  infrastructure/ (Secondary Adapters)                │
│  └─ Implement secondary contracts                    │
└─────────────────────────────────────────────────────┘
```

## Example Implementation

### Phase 1a: Domain Model

```typescript
// src/domain/models/Order.ts
import { Schema } from "@effect/schema";
import { Effect, Data } from "effect";

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
}
```

### Phase 1b: Define Contracts (Ports)

```typescript
// src/contracts/services/OrderService/contract.ts
import { Effect } from "effect";
import { Order } from "../../../domain/models";
import { OrderError } from "../../../domain/errors";

export class OrderService extends Effect.Service<OrderService>()("app/OrderService", {
  effect: Effect.gen(function* () {
    return {
      placeOrder: (items: OrderItem[]): Effect.Effect<Order, OrderError> =>
        Effect.die("contract only - no implementation"),
      
      getOrder: (id: string): Effect.Effect<Order, OrderNotFoundError> =>
        Effect.die("contract only - no implementation")
    };
  })
}) {}
```

```typescript
// src/contracts/infrastructure/OrderRepository/contract.ts
import { Effect } from "effect";
import { Order } from "../../../domain/models";
import { DatabaseError, OrderNotFoundError } from "../../../domain/errors";

export class OrderRepository extends Effect.Service<OrderRepository>()("app/OrderRepository", {
  effect: Effect.gen(function* () {
    return {
      save: (order: Order): Effect.Effect<void, DatabaseError> =>
        Effect.die("contract only"),
      
      findById: (id: string): Effect.Effect<Order, OrderNotFoundError | DatabaseError> =>
        Effect.die("contract only")
    };
  })
}) {}
```

### Phase 2: Test the Contract

```typescript
// src/contracts/services/OrderService/contract.test.ts
import { Effect, Layer, Ref, Exit, Cause, Option } from "effect";
import { describe, it } from "@effect/vitest";
import { assert } from "@effect/vitest";
import { OrderService } from "./contract";
import { Order } from "../../../domain/models";

// Test double: In-memory implementation for contract testing
const OrderServiceTest = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    const orders = yield* Ref.make(new Map<string, Order>());
    
    return OrderService.of({
      placeOrder: (items) =>
        Effect.gen(function* () {
          const order = new Order({
            id: crypto.randomUUID(),
            items,
            totalAmount: items.reduce((sum, i) => sum + i.price, 0),
            status: "pending"
          });
          yield* Ref.update(orders, (m) => m.set(order.id, order));
          return order;
        }),
      
      getOrder: (id) =>
        Effect.gen(function* () {
          const map = yield* Ref.get(orders);
          const order = map.get(id);
          if (!order) {
            return yield* Effect.fail(new OrderNotFoundError({ id }));
          }
          return order;
        })
    });
  })
);

describe("OrderService Contract", () => {
  it.effect("should place an order successfully", () =>
    Effect.gen(function* () {
      const service = yield* OrderService;
      const order = yield* service.placeOrder([
        { sku: "ABC", price: 100, quantity: 1 }
      ]);
      
      assert.strictEqual(order.status, "pending");
      assert.strictEqual(order.totalAmount, 100);
    }).pipe(Effect.provide(OrderServiceTest))
  );
  
  it.effect("should fail when order not found", () =>
    Effect.gen(function* () {
      const service = yield* OrderService;
      const exit = yield* Effect.exit(service.getOrder("non-existent"));
      
      assert.isTrue(Exit.isFailure(exit));
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause);
        assert.isTrue(Option.isSome(error));
        assert.instanceOf(Option.getOrThrow(error), OrderNotFoundError);
      }
    }).pipe(Effect.provide(OrderServiceTest))
  );
});
```

### Phase 3a: Implement Application Logic

```typescript
// src/application/services/OrderService/live.ts
import { Effect, Layer } from "effect";
import { OrderService } from "../../../contracts/services/OrderService";
import { OrderRepository } from "../../../contracts/infrastructure/OrderRepository";
import { PaymentGateway } from "../../../contracts/infrastructure/PaymentGateway";
import { Order } from "../../../domain/models";

export const OrderServiceLive = Layer.effect(
  OrderService,
  Effect.gen(function* () {
    // Dependencies acquired during layer construction
    const repository = yield* OrderRepository;
    const payment = yield* PaymentGateway;
    
    return OrderService.of({
      placeOrder: (items) =>
        Effect.gen(function* () {
          // Business logic using dependencies
          const order = new Order({
            id: crypto.randomUUID(),
            items,
            totalAmount: items.reduce((sum, i) => sum + i.price, 0),
            status: "pending"
          });
          
          // Charge payment
          yield* payment.charge(order.totalAmount, "token");
          
          // Persist
          yield* repository.save(order.confirm());
          
          return order;
        }),
      
      getOrder: (id) => repository.findById(id)
    });
  })
);
```

### Phase 3b: Implement Infrastructure Adapters

```typescript
// src/infrastructure/repositories/OrderRepository/memory.ts
import { Effect, Layer, Ref } from "effect";
import { OrderRepository } from "../../../contracts/infrastructure/OrderRepository";
import { Order } from "../../../domain/models";

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
// src/infrastructure/repositories/OrderRepository/postgres.ts
import { Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { OrderRepository } from "../../../contracts/infrastructure/OrderRepository";
import { Order } from "../../../domain/models";

export const OrderRepositoryPostgres = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    
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
    });
  })
);
```

### Phase 4: Application Assembly

```typescript
// src/composition/layers.ts
import { Layer } from "effect";
import { OrderServiceLive } from "../application/services/OrderService";
import { OrderRepositoryPostgres } from "../infrastructure/repositories/OrderRepository";
import { PaymentGatewayStripe } from "../infrastructure/external/PaymentGateway";

// Development layer (fast, in-memory)
export const DevLayer = Layer.mergeAll(
  OrderServiceLive,
  OrderRepositoryMemory,
  PaymentGatewayMock
);

// Production layer (real implementations)
export const ProdLayer = Layer.mergeAll(
  OrderServiceLive,
  OrderRepositoryPostgres,
  PaymentGatewayStripe
);
```

```typescript
// src/main.ts
import { Effect } from "effect";
import { ProdLayer } from "./composition/layers";
import { OrderApi } from "./interfaces/http/OrderApi";

const program = OrderApi.pipe(
  Effect.provide(ProdLayer)  // Single Effect.provide call
);

Effect.runPromise(program);
```

## Key Benefits of This Structure

### 1. **Enforces Workflow**
- Can't implement before defining contract (imports would fail)
- Contract tests must exist before implementation
- Clear progression: domain → contract → test → implement

### 2. **Prevents Bad Dependencies**
- `contracts/` can only import from `domain/`
- `application/` can only import from `contracts/` and `domain/`
- `infrastructure/` implements `contracts/` but doesn't import from `application/`
- Enforced by ESLint rules on import paths

### 3. **Maximum Testability**
- Every contract has co-located tests
- Test doubles live with their contracts
- Integration tests in `composition/`
- Clear separation of unit vs integration vs e2e

### 4. **Discoverability**
- Want to know what the app does? → `contracts/services/`
- Want to know what it depends on? → `contracts/infrastructure/`
- Want to see all implementations of a port? → Look in the port's folder

### 5. **Scalability**
- Each bounded context can follow this structure
- Easy to extract a package/microservice
- Clear boundaries for team ownership

## ESLint Rules to Enforce Architecture

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/application/**"],
            message: "Contracts cannot import from application layer"
          },
          {
            group: ["**/infrastructure/**"],
            message: "Contracts cannot import from infrastructure layer"
          },
          {
            group: ["**/interfaces/**"],
            message: "Contracts cannot import from interfaces layer"
          }
        ]
      }
    ]
  }
};
```

This structure makes **correctness the default path** by making it easier to do the right thing than the wrong thing.
