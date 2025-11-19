---
modified: 2025-10-26T14:34:05-03:00
---
# AI-Agent-Friendly Naming Conventions for Hexagonal Architecture

## Core Principle: **Names Should Encode Architectural Intent**

Every file and directory name should answer:
1. **What layer?** (domain, port, implementation, adapter, interface)
2. **What type?** (model, error, service, repository, gateway, api)
3. **What variant?** (contract, live, fake, real-world-adapter)
4. **What test layer?** (unit, contract, integration, system)

## Directory Structure with Explicit Naming

```
src/
├── 01-domain/                                   # Layer 1: Pure business logic
│   ├── models/
│   │   ├── Order.model.ts                      # .model.ts = Domain entity
│   │   ├── Order.model.unit.test.ts            # .unit.test.ts = Pure logic tests
│   │   ├── OrderItem.model.ts
│   │   └── index.ts
│   │
│   ├── errors/
│   │   ├── OrderErrors.error.ts                # .error.ts = Error definitions
│   │   ├── PaymentErrors.error.ts
│   │   └── index.ts
│   │
│   └── value-objects/
│       ├── OrderId.value.ts                    # .value.ts = Value object/branded type
│       ├── Money.value.ts
│       └── index.ts
│
├── 02-ports/                                    # Layer 2: Contracts (interfaces only)
│   ├── primary/                                 # Inbound ports (what app offers)
│   │   └── OrderService/
│   │       ├── OrderService.port.ts            # .port.ts = Service contract
│   │       ├── OrderService.port.contract.test.ts  # .contract.test.ts = Contract verification
│   │       ├── OrderService.port.fake.ts       # .fake.ts = In-memory test double
│   │       └── index.ts
│   │
│   └── secondary/                               # Outbound ports (what app needs)
│       ├── OrderRepository/
│       │   ├── OrderRepository.port.ts         # .port.ts = Repository contract
│       │   ├── OrderRepository.port.contract.test.ts
│       │   ├── OrderRepository.port.fake.ts    # Rich in-memory fake
│       │   └── index.ts
│       │
│       └── PaymentGateway/
│           ├── PaymentGateway.port.ts
│           ├── PaymentGateway.port.contract.test.ts
│           ├── PaymentGateway.port.fake.ts
│           └── index.ts
│
├── 03-application/                              # Layer 3: Business logic implementations
│   └── services/
│       └── OrderService/
│           ├── OrderService.service.ts         # .service.ts = Primary port implementation
│           ├── OrderService.service.integration.test.ts  # .integration.test.ts
│           └── index.ts
│
├── 04-adapters/                                 # Layer 4: Infrastructure adapters
│   ├── primary/                                 # Driving adapters (entry points)
│   │   ├── http/
│   │   │   ├── OrderApi.http-adapter.ts        # .http-adapter.ts = HTTP entry point
│   │   │   ├── OrderApi.http-adapter.system.test.ts  # .system.test.ts = E2E tests
│   │   │   └── index.ts
│   │   │
│   │   └── cli/
│   │       ├── OrderCli.cli-adapter.ts         # .cli-adapter.ts = CLI entry point
│   │       ├── OrderCli.cli-adapter.system.test.ts
│   │       └── index.ts
│   │
│   └── secondary/                               # Driven adapters (infrastructure)
│       ├── persistence/
│       │   └── OrderRepository/
│       │       ├── OrderRepository.memory-adapter.ts      # .memory-adapter.ts = In-memory
│       │       ├── OrderRepository.memory-adapter.unit.test.ts
│       │       ├── OrderRepository.postgres-adapter.ts    # .postgres-adapter.ts = Real DB
│       │       ├── OrderRepository.postgres-adapter.integration.test.ts
│       │       └── index.ts
│       │
│       └── external-services/
│           └── PaymentGateway/
│               ├── PaymentGateway.mock-adapter.ts        # .mock-adapter.ts = Stub responses
│               ├── PaymentGateway.stripe-adapter.ts      # .stripe-adapter.ts = Real API
│               ├── PaymentGateway.stripe-adapter.integration.test.ts
│               └── index.ts
│
├── 05-composition/                              # Layer 5: Dependency injection
│   ├── layers.development.ts                   # .development.ts = Dev layer composition
│   ├── layers.testing.ts                       # .testing.ts = Test layer composition
│   ├── layers.production.ts                    # .production.ts = Prod layer composition
│   ├── layers.integration.test.ts              # Full stack integration tests
│   └── index.ts
│
└── main.ts                                      # Application entry point
```

## File Suffix Taxonomy

### Domain Layer (01-domain/)

| Suffix | Purpose | Contains | Example |
|--------|---------|----------|---------|
| `.model.ts` | Domain entity with business logic | `Schema.Class` with methods | `Order.model.ts` |
| `.model.unit.test.ts` | Pure domain logic tests | Tests with no I/O | `Order.model.unit.test.ts` |
| `.error.ts` | Error type definitions | `Data.TaggedError` classes | `OrderErrors.error.ts` |
| `.value.ts` | Value objects | Branded types, immutable values | `OrderId.value.ts` |

### Port Layer (02-ports/)

| Suffix | Purpose | Contains | Example |
|--------|---------|----------|---------|
| `.port.ts` | Service/Repository contract | `Effect.Service` with interface only | `OrderService.port.ts` |
| `.port.contract.test.ts` | Contract verification tests | Tests using `.port.fake.ts` | `OrderService.port.contract.test.ts` |
| `.port.fake.ts` | Rich in-memory test double | Full-featured fake using `Ref`/`Map` | `OrderRepository.port.fake.ts` |

### Application Layer (03-application/)

| Suffix | Purpose | Contains | Example |
|--------|---------|----------|---------|
| `.service.ts` | Business logic implementation | Primary port implementation using secondary ports | `OrderService.service.ts` |
| `.service.integration.test.ts` | Cross-service integration tests | Tests with multiple real services | `OrderService.service.integration.test.ts` |

### Adapter Layer (04-adapters/)

| Suffix | Purpose | Contains | Example |
|--------|---------|----------|---------|
| `.http-adapter.ts` | HTTP API adapter | `HttpApi` definitions | `OrderApi.http-adapter.ts` |
| `.cli-adapter.ts` | CLI adapter | `@effect/cli` commands | `OrderCli.cli-adapter.ts` |
| `.grpc-adapter.ts` | gRPC adapter | gRPC service definitions | `OrderGrpc.grpc-adapter.ts` |
| `.memory-adapter.ts` | In-memory adapter | Fast, ephemeral storage | `OrderRepository.memory-adapter.ts` |
| `.postgres-adapter.ts` | PostgreSQL adapter | Real database implementation | `OrderRepository.postgres-adapter.ts` |
| `.stripe-adapter.ts` | External service adapter | Third-party API integration | `PaymentGateway.stripe-adapter.ts` |
| `.mock-adapter.ts` | Stub/Mock adapter | Canned responses for testing | `PaymentGateway.mock-adapter.ts` |
| `.*.unit.test.ts` | Adapter unit tests | Tests adapter logic in isolation | `OrderRepository.memory-adapter.unit.test.ts` |
| `.*.integration.test.ts` | Adapter integration tests | Tests adapter with real infrastructure | `OrderRepository.postgres-adapter.integration.test.ts` |
| `.*.system.test.ts` | End-to-end system tests | Full stack tests | `OrderApi.http-adapter.system.test.ts` |

### Composition Layer (05-composition/)

| Suffix | Purpose | Contains | Example |
|--------|---------|----------|---------|
| `.development.ts` | Development environment layer | Fast fakes and mocks | `layers.development.ts` |
| `.testing.ts` | Test environment layer | Fakes for automated tests | `layers.testing.ts` |
| `.production.ts` | Production environment layer | Real adapters | `layers.production.ts` |

## Test Layer Taxonomy

```
.unit.test.ts           → Tests pure logic (no Effect, or only Effect.succeed/fail)
.contract.test.ts       → Tests against interface using .port.fake.ts
.integration.test.ts    → Tests multiple components together with real dependencies
.system.test.ts         → End-to-end tests through primary adapters (HTTP/CLI)
```

### Test Layer Rules

| Test Type | Dependencies | What It Tests | Speed |
|-----------|--------------|---------------|-------|
| **unit** | None or fake only | Single function/class logic | Instant (<10ms) |
| **contract** | Port fake | Interface compliance | Very fast (<50ms) |
| **integration** | Real services, fake I/O | Service interactions | Fast (<500ms) |
| **system** | Full stack with fakes | Complete user flows | Moderate (<2s) |
| **e2e** (not shown) | Real everything | Production-like scenarios | Slow (>2s) |

## Implementation Type Taxonomy

### For Secondary Ports (Repositories, Gateways, etc.)

```
.port.fake.ts          → Rich, fully-functional in-memory implementation
                         (Used in contract tests and as TestLayer default)
                         
.mock-adapter.ts       → Canned responses, minimal logic
                         (Used when you don't care about state/behavior)
                         
.memory-adapter.ts     → Ephemeral in-memory storage
                         (Used for fast integration tests)
                         
.<technology>-adapter.ts → Real-world implementation
                         Examples: .postgres-adapter.ts, .redis-adapter.ts
```

### Distinction Between Fake and Mock

```typescript
// ✅ OrderRepository.port.fake.ts
// A "FAKE" is a fully-functional, production-quality implementation
// It should pass ALL contract tests
export const OrderRepositoryFake = Layer.effect(
  OrderRepository,
  Effect.gen(function* () {
    const storage = yield* Ref.make(new Map<string, Order>());
    const eventLog = yield* Ref.make<OrderEvent[]>([]);
    
    return OrderRepository.of({
      save: (order) =>
        Effect.gen(function* () {
          yield* Ref.update(storage, (map) => map.set(order.id, order));
          yield* Ref.update(eventLog, (log) => [...log, { type: "saved", order }]);
        }),
      
      findById: (id) =>
        Effect.gen(function* () {
          const map = yield* Ref.get(storage);
          const order = map.get(id);
          if (!order) {
            return yield* Effect.fail(new OrderNotFoundError({ id }));
          }
          return order;
        }),
      
      // Fake-specific helpers for testing
      _test: {
        getEventLog: () => Ref.get(eventLog),
        clear: () => Effect.all([
          Ref.set(storage, new Map()),
          Ref.set(eventLog, [])
        ])
      }
    });
  })
);

// ✅ PaymentGateway.mock-adapter.ts
// A "MOCK" returns canned responses with minimal behavior
// Used when you don't care about the gateway's behavior
export const PaymentGatewayMock = Layer.succeed(
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
);
```

## Example File Contents

### 1. Port Definition

```typescript
// 02-ports/primary/OrderService/OrderService.port.ts
import { Effect, Context } from "effect";
import { Order } from "../../../01-domain/models/Order.model";
import { OrderNotFoundError, OrderValidationError } from "../../../01-domain/errors/OrderErrors.error";

/**
 * PRIMARY PORT: OrderService
 * 
 * Defines what the application offers to external actors.
 * This is a CONTRACT ONLY - no implementation.
 * 
 * @layer Port (02-ports/primary)
 * @type Primary Port (Inbound)
 * @dependencies None (pure interface)
 */
export class OrderService extends Effect.Service<OrderService>()("app/ports/OrderService", {
  effect: Effect.gen(function* () {
    return {
      /**
       * Place a new order
       * @errors OrderValidationError - Invalid order data
       */
      placeOrder: (
        items: OrderItem[]
      ): Effect.Effect<Order, OrderValidationError> =>
        Effect.die("CONTRACT ONLY - Use OrderService.service.ts for implementation"),
      
      /**
       * Retrieve an order by ID
       * @errors OrderNotFoundError - Order does not exist
       */
      getOrder: (
        id: string
      ): Effect.Effect<Order, OrderNotFoundError> =>
        Effect.die("CONTRACT ONLY - Use OrderService.service.ts for implementation")
    };
  })
}) {}
```

### 2. Port Fake (Rich Test Double)

```typescript
// 02-ports/primary/OrderService/OrderService.port.fake.ts
import { Effect, Layer, Ref } from "effect";
import { OrderService } from "./OrderService.port";
import { Order } from "../../../01-domain/models/Order.model";

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
    const orders = yield* Ref.make(new Map<string, Order>());
    const callLog = yield* Ref.make<Array<{ method: string; args: unknown[] }>>([]);
    
    const logCall = (method: string, args: unknown[]) =>
      Ref.update(callLog, (log) => [...log, { method, args }]);
    
    return OrderService.of({
      placeOrder: (items) =>
        Effect.gen(function* () {
          yield* logCall("placeOrder", [items]);
          
          if (items.length === 0) {
            return yield* Effect.fail(
              new OrderValidationError({ reason: "empty items" })
            );
          }
          
          const order = new Order({
            id: crypto.randomUUID(),
            items,
            totalAmount: items.reduce((sum, item) => sum + item.price, 0),
            status: "pending"
          });
          
          yield* Ref.update(orders, (map) => map.set(order.id, order));
          return order;
        }),
      
      getOrder: (id) =>
        Effect.gen(function* () {
          yield* logCall("getOrder", [id]);
          
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
};
```

### 3. Contract Test

```typescript
// 02-ports/primary/OrderService/OrderService.port.contract.test.ts
import { Effect, Exit, Cause, Option } from "effect";
import { describe, it } from "@effect/vitest";
import { assert } from "@effect/vitest";
import { OrderService } from "./OrderService.port";
import { OrderServiceFake } from "./OrderService.port.fake";

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
      const service = yield* OrderService;
      
      const order = yield* service.placeOrder([
        { sku: "ABC", price: 100, quantity: 1 }
      ]);
      
      assert.strictEqual(order.status, "pending");
      assert.strictEqual(order.totalAmount, 100);
    }).pipe(Effect.provide(OrderServiceFake))
  );
  
  it.effect("MUST fail when placing order with empty items", () =>
    Effect.gen(function* () {
      const service = yield* OrderService;
      const exit = yield* Effect.exit(service.placeOrder([]));
      
      assert.isTrue(Exit.isFailure(exit));
      
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause);
        assert.isTrue(Option.isSome(error));
        assert.instanceOf(Option.getOrThrow(error), OrderValidationError);
      }
    }).pipe(Effect.provide(OrderServiceFake))
  );
  
  it.effect("MUST fail when getting non-existent order", () =>
    Effect.gen(function* () {
      const service = yield* OrderService;
      const exit = yield* Effect.exit(service.getOrder("non-existent"));
      
      assert.isTrue(Exit.isFailure(exit));
      
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause);
        assert.isTrue(Option.isSome(error));
        const err = Option.getOrThrow(error);
        assert.instanceOf(err, OrderNotFoundError);
        assert.strictEqual(err.id, "non-existent");
      }
    }).pipe(Effect.provide(OrderServiceFake))
  );
});
```

### 4. Service Implementation

```typescript
// 03-application/services/OrderService/OrderService.service.ts
import { Effect, Layer } from "effect";
import { OrderService } from "../../../02-ports/primary/OrderService/OrderService.port";
import { OrderRepository } from "../../../02-ports/secondary/OrderRepository/OrderRepository.port";
import { PaymentGateway } from "../../../02-ports/secondary/PaymentGateway/PaymentGateway.port";
import { Order } from "../../../01-domain/models/Order.model";

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
    const repository = yield* OrderRepository;
    const payment = yield* PaymentGateway;
    
    return OrderService.of({
      placeOrder: (items) =>
        Effect.gen(function* () {
          // Validate
          if (items.length === 0) {
            return yield* Effect.fail(
              new OrderValidationError({ reason: "empty items" })
            );
          }
          
          // Create domain entity
          const order = new Order({
            id: crypto.randomUUID(),
            items,
            totalAmount: items.reduce((sum, item) => sum + item.price, 0),
            status: "pending"
          });
          
          // Process payment
          yield* payment.charge(order.totalAmount, "token");
          
          // Confirm and persist
          const confirmed = order.confirm();
          yield* repository.save(confirmed);
          
          return confirmed;
        }),
      
      getOrder: (id) => repository.findById(id)
    });
  })
);
```

### 5. Layer Composition

```typescript
// 05-composition/layers.testing.ts
import { Layer } from "effect";
import { OrderServiceLive } from "../03-application/services/OrderService/OrderService.service";
import { OrderRepositoryFake } from "../02-ports/secondary/OrderRepository/OrderRepository.port.fake";
import { PaymentGatewayMock } from "../04-adapters/secondary/external-services/PaymentGateway/PaymentGateway.mock-adapter";

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
);
```

## AI Agent Instructions (Embedded in Files)

Each file should include a header comment block that agents can parse:

```typescript
/**
 * @file-type port
 * @layer 02-ports/primary
 * @port-type primary
 * @pattern Effect.Service (interface only)
 * @dependencies None (contract only)
 * @test-file OrderService.port.contract.test.ts
 * @test-double OrderService.port.fake.ts
 * @implementation ../../../03-application/services/OrderService/OrderService.service.ts
 * 
 * AGENT INSTRUCTIONS:
 * - This file MUST only contain the interface (Effect.Service)
 * - Do NOT implement business logic here
 * - Methods MUST use Effect.die() as placeholder
 * - All error types MUST be imported from 01-domain/errors/
 * - This file cannot import from layers 03-05
 */
```

## Validation Script

```typescript
// scripts/validate-architecture.ts
/**
 * Validates that files follow naming conventions and architectural rules
 */

const rules = {
  "02-ports/**/*.port.ts": {
    mustNotImport: ["03-application", "04-adapters", "05-composition"],
    mustContain: ["Effect.Service", "Effect.die"],
    mustNotContain: ["Layer.effect", "yield*"]
  },
  "02-ports/**/*.port.fake.ts": {
    mustExport: ["Layer"],
    mustImport: ["Ref", "Effect"],
    testFile: "*.port.contract.test.ts"
  },
  "03-application/**/*.service.ts": {
    mustExport: ["Layer"],
    mustContain: ["Layer.effect", "yield*"],
    mustImport: ["02-ports"]
  }
};
```

## Benefits for AI Agents

1. **Unambiguous Intent**: `.port.ts` vs `.service.ts` vs `.adapter.ts` leaves no room for confusion
2. **Clear Dependencies**: File location + suffix tells the agent what it can import
3. **Test Strategy Visible**: `.contract.test.ts` vs `.integration.test.ts` vs `.system.test.ts` encodes the test layer
4. **Implementation Variants Explicit**: `.fake.ts` vs `.mock-adapter.ts` vs `.postgres-adapter.ts` clarifies purpose
5. **Workflow Enforced**: Numbered directories (01-, 02-, 03-) show development order
6. **Validation Built-in**: Agents can validate their output against architectural rules programmatically

This naming system transforms the directory structure into a **self-documenting architectural decision record** that AI agents can parse and follow mechanically.
