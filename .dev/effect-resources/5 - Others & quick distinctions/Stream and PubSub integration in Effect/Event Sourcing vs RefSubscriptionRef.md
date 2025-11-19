---
modified: 2025-10-26T22:37:54-03:00
---
# Event Sourcing vs Ref/SubscriptionRef

## The Fundamental Distinction

**Event Sourcing**: Durable, append-only event log (source of truth)
**Ref/SubscriptionRef**: Ephemeral, in-memory current state (derived view)

They're **complementary**, not competing patterns!

## Effect's Event Sourcing Capabilities

### Effect Cluster Workflows (Durable State)

From the knowledge base, Effect Cluster provides **durable workflows** with persistent execution logs:

```typescript
import { Workflow, Activity, WorkflowEngine } from "@effect/cluster-workflow";
import { Schema } from "@effect/schema";

// Event sourcing: Durable execution log
const processOrderWorkflow = Workflow.make(
  ProcessOrderRequest,
  (_) => `order-${_.orderId}`, // Persistence key
  ({ orderId, userId, items }) =>
    Effect.gen(function* () {
      // Each activity call is logged durably
      const inventory = yield* checkInventory(items);
      const payment = yield* processPayment(userId, inventory.total);
      const shipment = yield* createShipment(orderId, items);
      
      // State is reconstructed from execution log
      return { orderId, shipment, payment };
    })
);

// Persistence layer stores the execution log
const engine = yield* WorkflowEngine.makeScoped(processOrderWorkflow).pipe(
  Effect.provide(DurableExecutionJournalPostgres.layer)
);

// Even after server restart, workflow resumes from log
yield* engine.send(new ProcessOrderRequest({ orderId: "123", ... }));
```

**Key Point**: The execution log is **event-sourced**. Each activity execution is an event stored durably.

### CQRS/Event Sourcing Pattern (Manual Implementation)

```typescript
// Domain events (the source of truth)
class OrderCreated extends Schema.TaggedClass<OrderCreated>()("OrderCreated", {
  orderId: Schema.String,
  userId: Schema.String,
  timestamp: Schema.DateTimeUtc
}) {}

class PaymentProcessed extends Schema.TaggedClass<PaymentProcessed>()(
  "PaymentProcessed",
  {
    orderId: Schema.String,
    amount: Schema.Number,
    timestamp: Schema.DateTimeUtc
  }
) {}

type OrderEvent = OrderCreated | PaymentProcessed;

// Event store interface
class EventStore extends Effect.Service<EventStore>()("app/EventStore", {
  effect: Effect.gen(function* () {
    // Persistent event log
    const sql = yield* SqlClient.SqlClient;
    
    return {
      // Append-only writes
      append: (streamId: string, events: OrderEvent[]) =>
        sql.withTransaction(
          Effect.gen(function* () {
            for (const event of events) {
              yield* sql`
                INSERT INTO events (stream_id, event_type, data, timestamp)
                VALUES (${streamId}, ${event._tag}, ${JSON.stringify(event)}, NOW())
              `;
            }
          })
        ),
      
      // Read event stream
      readStream: (streamId: string) =>
        sql<OrderEvent>`
          SELECT data FROM events 
          WHERE stream_id = ${streamId} 
          ORDER BY sequence ASC
        `.pipe(
          Effect.map(rows => rows.map(r => r.data))
        )
    };
  })
}) {}
```

## Architecture Pattern: Event Sourcing + In-Memory Projections

The **idiomatic pattern** combines both:

```typescript
// 1. Events are persisted (event sourcing)
// 2. Current state is projected into Ref/SubscriptionRef (for fast queries)

class OrderAggregate extends Effect.Service<OrderAggregate>()(
  "app/OrderAggregate",
  {
    dependencies: [EventStore.Default],
    
    scoped: Effect.gen(function* () {
      const eventStore = yield* EventStore;
      
      // ✅ In-memory projection (ephemeral)
      const currentStateRef = yield* Ref.make<Map<OrderId, Order>>(
        new Map()
      );
      
      return {
        // Command: Appends events to durable store
        createOrder: (cmd: CreateOrderCommand) =>
          Effect.gen(function* () {
            const events = [
              new OrderCreated({
                orderId: cmd.orderId,
                userId: cmd.userId,
                timestamp: new Date().toISOString()
              })
            ];
            
            // 1. Persist events (durable)
            yield* eventStore.append(cmd.orderId, events);
            
            // 2. Update in-memory projection (ephemeral)
            yield* Ref.update(currentStateRef, map =>
              map.set(cmd.orderId, { status: "pending", ...cmd })
            );
            
            return cmd.orderId;
          }),
        
        // Query: Read from fast in-memory projection
        getOrder: (orderId: OrderId) =>
          Effect.gen(function* () {
            const map = yield* Ref.get(currentStateRef);
            return Option.fromNullable(map.get(orderId));
          }),
        
        // Rebuild projection from events (on startup)
        hydrate: (orderId: OrderId) =>
          Effect.gen(function* () {
            const events = yield* eventStore.readStream(orderId);
            const order = events.reduce(applyEvent, initialOrder);
            
            yield* Ref.update(currentStateRef, map =>
              map.set(orderId, order)
            );
          })
      };
    })
  }
) {}

// Fold events to reconstruct state
function applyEvent(state: Order, event: OrderEvent): Order {
  switch (event._tag) {
    case "OrderCreated":
      return { orderId: event.orderId, status: "pending", ... };
    case "PaymentProcessed":
      return { ...state, status: "paid" };
  }
}
```

## Pattern: SubscriptionRef for Real-Time Event Projections

```typescript
class OrderProjection extends Effect.Service<OrderProjection>()(
  "app/OrderProjection",
  {
    dependencies: [EventStore.Default],
    
    scoped: Effect.gen(function* () {
      const eventStore = yield* EventStore;
      
      // ✅ Use SubscriptionRef for observable projections
      const ordersRef = yield* SubscriptionRef.make<Map<OrderId, Order>>(
        new Map()
      );
      
      // Background process: Stream events and update projection
      yield* eventStore.streamAllEvents().pipe(
        Stream.tap(event =>
          SubscriptionRef.update(ordersRef, map => {
            const order = map.get(event.orderId) ?? initialOrder;
            return map.set(event.orderId, applyEvent(order, event));
          })
        ),
        Stream.runDrain,
        Effect.forkScoped  // Runs in background
      );
      
      return {
        // Fast queries from projection
        getOrder: (orderId: OrderId) =>
          Effect.gen(function* () {
            const map = yield* SubscriptionRef.get(ordersRef);
            return Option.fromNullable(map.get(orderId));
          }),
        
        // Real-time updates via stream
        watchOrder: (orderId: OrderId) =>
          ordersRef.changes.pipe(
            Stream.map(map => Option.fromNullable(map.get(orderId))),
            Stream.changes  // Only emit when this order changes
          )
      };
    })
  }
) {}

// Frontend can subscribe to order updates
const orderUpdates = yield* OrderProjection.pipe(
  Effect.map(proj => proj.watchOrder("order-123")),
  Effect.flatMap(stream =>
    stream.pipe(
      Stream.tap(order => updateUI(order)),
      Stream.runDrain
    )
  )
);
```

## Critical Pattern: Write to Events, Read from Projections

```typescript
// CQRS architecture with Effect

// ===== WRITE SIDE (Event Sourcing) =====
class OrderCommandHandler extends Effect.Service<OrderCommandHandler>()(
  "app/OrderCommandHandler",
  {
    dependencies: [EventStore.Default],
    
    effect: Effect.gen(function* () {
      const eventStore = yield* EventStore;
      
      return {
        // Commands produce events
        createOrder: (cmd: CreateOrderCommand) =>
          Effect.gen(function* () {
            // 1. Validate command
            const validation = yield* validateOrder(cmd);
            
            // 2. Generate events
            const events = [
              new OrderCreated({ orderId: cmd.orderId, ... })
            ];
            
            // 3. Persist to event store (durable)
            yield* eventStore.append(cmd.orderId, events);
            
            // 4. Publish to event bus for projections
            yield* EventBus.publish(events);
            
            return cmd.orderId;
          })
      };
    })
  }
) {}

// ===== READ SIDE (In-Memory Projections) =====
class OrderQueryHandler extends Effect.Service<OrderQueryHandler>()(
  "app/OrderQueryHandler",
  {
    dependencies: [EventBus.Default],
    
    scoped: Effect.gen(function* () {
      const eventBus = yield* EventBus;
      
      // ✅ Fast read model in SubscriptionRef
      const ordersRef = yield* SubscriptionRef.make<Map<OrderId, OrderView>>(
        new Map()
      );
      
      // Listen to events and update projection
      yield* eventBus.subscribe().pipe(
        Stream.tap(event => 
          SubscriptionRef.update(ordersRef, map =>
            map.set(event.orderId, projectEvent(event))
          )
        ),
        Stream.runDrain,
        Effect.forkScoped
      );
      
      return {
        // Fast queries (no DB roundtrip!)
        getOrder: (orderId: OrderId) =>
          Effect.gen(function* () {
            const map = yield* SubscriptionRef.get(ordersRef);
            return Option.fromNullable(map.get(orderId));
          }),
        
        // Real-time subscriptions
        subscribeToOrder: (orderId: OrderId) =>
          ordersRef.changes.pipe(
            Stream.filterMap(map => Option.fromNullable(map.get(orderId)))
          )
      };
    })
  }
) {}
```

## When to Use Each

### Use Event Sourcing (Durable) When:

```typescript
// ✅ Audit trail required
class AuditLog extends Effect.Service<AuditLog>()("app/AuditLog", {
  effect: Effect.gen(function* () {
    const eventStore = yield* EventStore;
    
    return {
      // All changes are permanently logged
      recordAction: (action: UserAction) =>
        eventStore.append(`user-${action.userId}`, [action])
    };
  })
}) {}

// ✅ Time travel / replay needed
const reconstructState = (timestamp: DateTime) =>
  Effect.gen(function* () {
    const events = yield* eventStore.readStream("order-123");
    const relevantEvents = events.filter(e => e.timestamp <= timestamp);
    return relevantEvents.reduce(applyEvent, initialState);
  });

// ✅ Distributed workflows
const workflow = Workflow.make(
  WorkflowRequest,
  (_) => `workflow-${_.id}`,
  // Execution log is event-sourced
  (input) => Effect.gen(function* () {
    yield* step1(input);
    yield* step2(input);
    yield* step3(input);
  })
);
```

### Use Ref (Ephemeral) When:

```typescript
// ✅ Fast reads for current state
const cacheRef = yield* Ref.make<Map<Key, Value>>(new Map());

// ✅ Temporary state during computation
const accumulatorRef = yield* Ref.make("");
yield* tokenStream.pipe(
  Stream.tap(token => Ref.update(accumulatorRef, acc => acc + token)),
  Stream.runDrain
);

// ✅ No audit trail needed
const sessionRef = yield* Ref.make<Option.Option<Session>>(Option.none());
```

### Use SubscriptionRef (Ephemeral + Observable) When:

```typescript
// ✅ Real-time UI updates from projections
const projectionRef = yield* SubscriptionRef.make(initialState);

// Rebuild from events on startup
yield* rebuildProjection(projectionRef);

// Subscribe for live updates
yield* eventStream.pipe(
  Stream.tap(event => SubscriptionRef.update(projectionRef, ...)),
  Stream.runDrain,
  Effect.forkScoped
);

// ✅ Dashboard / metrics
const metricsRef = yield* SubscriptionRef.make(initialMetrics);
const dashboard = metricsRef.changes.pipe(Stream.tap(renderDashboard));
```

## Complete Multi-Agent Event-Sourced Architecture

```typescript
// Combines everything for production system

// 1. Event Store (Durable)
const eventStore = EventStore.Default;

// 2. Command handlers write events
class AgentCommandHandler {
  executeTask: (cmd: ExecuteTaskCommand) =>
    Effect.gen(function* () {
      const events = [
        new TaskStarted({ agentId: cmd.agentId, ... }),
        new ThoughtRecorded({ thought: "reasoning", ... })
      ];
      
      yield* eventStore.append(`agent-${cmd.agentId}`, events);
      yield* EventBus.publish(events);
    })
}

// 3. Projections in SubscriptionRef (Fast queries)
class AgentProjection {
  private stateRef = yield* SubscriptionRef.make<Map<AgentId, AgentState>>(
    new Map()
  );
  
  // Rebuild from events on startup
  yield* rebuildAllProjections();
  
  // Subscribe to new events
  yield* EventBus.subscribe().pipe(
    Stream.tap(event => SubscriptionRef.update(stateRef, ...)),
    Stream.runDrain,
    Effect.forkScoped
  );
  
  // Fast queries
  getAgent: (id) => SubscriptionRef.get(stateRef).pipe(...);
  
  // Real-time updates
  watchAgent: (id) => stateRef.changes.pipe(...);
}

// 4. Frontends subscribe to projections
const agentStream = yield* AgentProjection.pipe(
  Effect.flatMap(proj => proj.watchAgent("agent-1"))
);

yield* agentStream.pipe(
  Stream.tap(state => sendToWebSocket(state)),
  Stream.runDrain
);
```

## Summary Table

| Concern | Event Sourcing | Ref | SubscriptionRef |
|---------|----------------|-----|-----------------|
| **Durability** | ✅ Persistent | ❌ Memory only | ❌ Memory only |
| **Audit Trail** | ✅ Complete | ❌ Current only | ❌ Current only |
| **Time Travel** | ✅ Yes | ❌ No | ❌ No |
| **Query Speed** | ⚠️ Slow (replay) | ✅ O(1) | ✅ O(1) |
| **Observable** | ⚠️ Via polling | ❌ No | ✅ Yes (`.changes`) |
| **Memory** | 💾 Disk | 🧠 RAM | 🧠 RAM |
| **Use Case** | Source of truth | Current state cache | Real-time projections |

**Golden Pattern**: Event source the writes, project into Ref/SubscriptionRef for fast reads! 🎯
