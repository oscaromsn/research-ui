---
modified: 2025-10-26T23:57:10-03:00
---
# Ref & SubscriptionRef in Effect Cluster

Yes, you **can and should** use `Ref`/`SubscriptionRef` within Effect Cluster entities, but with **critical understanding** of distributed vs local state. Let me break this down:

## The Answer: YES, with Distinctions

### ✅ Refs Within Entities (Local State)

Each entity instance can use `Ref` for **local, ephemeral state**:

```typescript
import { Entity, RecipientType, Sharding } from "@effect/cluster";
import { Ref, Effect, Schema } from "effect";

// Entity message protocol
class AgentQuery extends Schema.TaggedClass<AgentQuery>()("AgentQuery", {
  query: Schema.String
}) {}

// ✅ CORRECT: Ref for entity-local state
const AgentEntity = Entity.make(
  "Agent",
  Schema.String, // Entity ID type
  RecipientType.EntityType,
  
  (entityId: string, msg: AgentQuery) => Effect.gen(function* () {
    // Each entity instance has its OWN Ref
    const iterationCountRef = yield* Ref.make(0);
    const thoughtHistoryRef = yield* Ref.make<string[]>([]);
    
    // Process message with local state
    yield* Ref.update(iterationCountRef, n => n + 1);
    yield* Ref.update(thoughtHistoryRef, thoughts => 
      [...thoughts, `Processing: ${msg.query}`]
    );
    
    const iterations = yield* Ref.get(iterationCountRef);
    const history = yield* Ref.get(thoughtHistoryRef);
    
    yield* Effect.log(`Entity ${entityId} iteration ${iterations}`);
    
    return { iterations, history };
  })
);
```

**Key Point**: This `Ref` is **scoped to the entity's lifetime** on that particular node.

### ✅ Entity.state<T>() - The Cluster-Aware Ref

Effect Cluster provides `Entity.state<T>()` which returns a `Ref` that's **managed by the cluster**:

```typescript
const AgentEntity = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  
  (entityId: string, msg: AgentMessage) => Effect.gen(function* () {
    // ✅ BEST: Cluster-managed Ref
    const stateRef = yield* Entity.state<AgentState>();
    
    // This Ref persists across messages to the same entity
    const currentState = yield* Ref.get(stateRef);
    
    // Update state
    yield* Ref.update(stateRef, state => ({
      ...state,
      messageCount: state.messageCount + 1,
      lastQuery: msg.query
    }));
    
    return currentState;
  })
);
```

**What's Special About `Entity.state`**:
- **Single-writer guarantee**: Only ONE instance of this entity exists across the entire cluster
- **Automatic lifecycle**: State lives as long as the entity is active
- **Shard-local**: If entity moves to another node, state follows (with caveats)

## Critical Distinctions

### 1. Local Ref vs Distributed State

```typescript
// ❌ WRONG: Trying to share Ref across cluster
const globalCounterRef = yield* Ref.make(0); // This is process-local!

const Entity1 = Entity.make("Counter", /*...*/, () => 
  Ref.update(globalCounterRef, n => n + 1) // Only updates local node!
);

// ✅ CORRECT: Entity-scoped state
const CounterEntity = Entity.make(
  "Counter",
  Schema.String,
  RecipientType.EntityType,
  
  (entityId: string, msg: IncrementMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<number>();
    yield* Ref.update(stateRef, n => n + 1);
    
    const value = yield* Ref.get(stateRef);
    return value;
  })
);
```

### 2. Ephemeral vs Persistent State

```typescript
// Option A: Ephemeral state (lost on rebalance)
const EphemeralAgentEntity = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  
  (entityId, msg) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<AgentState>();
    // ⚠️ If this entity moves to another node, state is lost
    
    yield* Ref.update(stateRef, state => ({ 
      ...state, 
      lastMessage: msg 
    }));
  })
);

// Option B: Persistent state (survives rebalance)
@annotate(ClusterSchema.persisted) // ✅ Messages are persisted
const PersistentAgentEntity = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  
  (entityId, msg) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<AgentState>();
    
    // State can be reconstructed from message log
    yield* Ref.update(stateRef, state => 
      applyMessage(state, msg)
    );
  })
);
```

### 3. SubscriptionRef in Entities

```typescript
// ✅ SubscriptionRef works within a single entity
const ReactiveAgentEntity = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  
  (entityId: string, msg: AgentMessage) => Effect.gen(function* () {
    // Create SubscriptionRef for this entity instance
    const stateRef = yield* SubscriptionRef.make<AgentState>(initialState);
    
    // Other parts of THIS entity can subscribe
    yield* stateRef.changes.pipe(
      Stream.tap(state => Effect.log(`Agent ${entityId} state:`, state)),
      Stream.runDrain,
      Effect.fork // Subscribe in background
    );
    
    // Update state
    yield* SubscriptionRef.update(stateRef, state => ({
      ...state,
      lastMessage: msg
    }));
  })
);

// ⚠️ LIMITATION: .changes stream doesn't cross cluster boundaries
// Other entities or nodes can't subscribe to this SubscriptionRef directly
```

## Production Patterns

### Pattern 1: Entity State + Event Sourcing

```typescript
// Combine Entity.state with event sourcing for durability
const OrderEntity = Entity.make(
  "Order",
  Schema.String,
  RecipientType.EntityType,
  
  (orderId: string, msg: OrderMessage) => Effect.gen(function* () {
    const eventStore = yield* EventStore;
    const stateRef = yield* Entity.state<OrderState>();
    
    // 1. Current state in entity Ref (fast reads)
    const currentState = yield* Ref.get(stateRef);
    
    // 2. Process message and generate events
    const events = processCommand(currentState, msg);
    
    // 3. Persist events (durable)
    yield* eventStore.append(orderId, events);
    
    // 4. Update entity state (ephemeral cache)
    const newState = events.reduce(applyEvent, currentState);
    yield* Ref.set(stateRef, newState);
    
    return newState;
  })
);

// On entity activation, rebuild state from events
const activateOrderEntity = (orderId: string) =>
  Effect.gen(function* () {
    const eventStore = yield* EventStore;
    const stateRef = yield* Entity.state<OrderState>();
    
    // Rebuild state from event log
    const events = yield* eventStore.readStream(orderId);
    const rebuiltState = events.reduce(applyEvent, initialState);
    
    yield* Ref.set(stateRef, rebuiltState);
  });
```

### Pattern 2: Cross-Entity Communication via Messaging

```typescript
// ❌ WRONG: Can't share Ref between entities
const sharedRef = yield* Ref.make(0); // Doesn't work across entities!

// ✅ CORRECT: Entities communicate via messages
const CoordinatorEntity = Entity.make(
  "Coordinator",
  Schema.String,
  RecipientType.EntityType,
  
  (coordinatorId, msg: StatusUpdate) => Effect.gen(function* () {
    const sharding = yield* Sharding.Sharding;
    const messenger = yield* sharding.messenger("Agent");
    
    // Send message to another entity
    yield* messenger.send("agent-1", new QueryMessage({ query: "status" }));
    
    // Entity state is isolated
    const stateRef = yield* Entity.state<CoordinatorState>();
    yield* Ref.update(stateRef, state => ({
      ...state,
      lastUpdate: msg
    }));
  })
);
```

### Pattern 3: Observable Entity State (Within Node)

```typescript
// For UI updates from entity state (same process)
class AgentStateService extends Effect.Service<AgentStateService>()(
  "app/AgentStateService",
  {
    scoped: Effect.gen(function* () {
      const sharding = yield* Sharding.Sharding;
      
      // SubscriptionRef for aggregated view (process-local)
      const aggregatedStateRef = yield* SubscriptionRef.make
        Map<AgentId, AgentState>
      >(new Map());
      
      return {
        // Polling approach: Query entities and update local projection
        syncEntityState: (agentId: AgentId) =>
          Effect.gen(function* () {
            const messenger = yield* sharding.messenger("Agent");
            
            // Send GetState message to entity
            const state = yield* messenger.sendDiscard(
              agentId,
              new GetStateMessage()
            );
            
            // Update local SubscriptionRef
            yield* SubscriptionRef.update(aggregatedStateRef, map =>
              map.set(agentId, state)
            );
          }),
        
        // UI can subscribe to changes
        watchState: aggregatedStateRef.changes
      };
    })
  }
) {}
```

## When to Use Each

| State Type | Use Case | Durability | Scope |
|------------|----------|------------|-------|
| **Plain `Ref`** | Temporary entity state | Lost on rebalance | Entity instance |
| **`Entity.state<T>()`** | Entity state with lifecycle | Survives in shard | Entity (cluster-aware) |
| **Event Store + Ref** | Durable entity state | Survives restarts | Entity + persistent |
| **`SubscriptionRef`** | Observable entity state | Lost on rebalance | Entity instance + subscribers |
| **`SubscriptionRef` (service-level)** | Aggregated views | Process-local | Service/Node |

## Complete Multi-Agent Architecture

```typescript
// ===== Distributed Agent Entities =====
const AgentEntity = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  
  (agentId: string, msg: AgentMessage) => Effect.gen(function* () {
    const eventStore = yield* EventStore;
    
    // Entity-local state (fast access)
    const stateRef = yield* Entity.state<AgentState>();
    const currentState = yield* Ref.get(stateRef);
    
    // Process message
    const events = yield* processAgentMessage(currentState, msg);
    
    // Persist events (durable)
    yield* eventStore.append(`agent-${agentId}`, events);
    
    // Update entity state
    const newState = events.reduce(applyEvent, currentState);
    yield* Ref.set(stateRef, newState);
    
    // Publish to event bus for projections
    yield* EventBus.publish(events);
    
    return newState;
  })
);

// ===== Process-Local Projection Service =====
class AgentProjectionService extends Effect.Service<AgentProjectionService>()(
  "app/AgentProjectionService",
  {
    dependencies: [EventBus.Default],
    
    scoped: Effect.gen(function* () {
      const eventBus = yield* EventBus;
      
      // ✅ SubscriptionRef for local aggregated view
      const projectionRef = yield* SubscriptionRef.make
        Map<AgentId, AgentSummary>
      >(new Map());
      
      // Subscribe to event bus (process-local)
      yield* eventBus.subscribe().pipe(
        Stream.tap(event =>
          SubscriptionRef.update(projectionRef, map =>
            map.set(event.agentId, projectToSummary(event))
          )
        ),
        Stream.runDrain,
        Effect.forkScoped
      );
      
      return {
        // Fast queries from local projection
        getSummary: (agentId: AgentId) =>
          Effect.gen(function* () {
            const map = yield* SubscriptionRef.get(projectionRef);
            return Option.fromNullable(map.get(agentId));
          }),
        
        // UI subscribes to changes
        watchSummaries: projectionRef.changes
      };
    })
  }
) {}

// ===== Bootstrap =====
const program = Effect.gen(function* () {
  // Create sharding cluster
  const sharding = yield* Sharding.Sharding;
  
  // Register entities
  yield* sharding.registerEntity(AgentEntity);
  
  // Start projection service (process-local)
  const projections = yield* AgentProjectionService;
  
  // Send message to distributed agent
  const messenger = yield* sharding.messenger("Agent");
  yield* messenger.send("agent-1", new QueryMessage({ query: "status" }));
});
```

## Summary: Ref/SubscriptionRef in Cluster Context

✅ **Use Ref/Entity.state within entities**: Each entity instance has isolated state
✅ **Use SubscriptionRef for process-local aggregations**: Projections, dashboards
✅ **Combine with event sourcing for durability**: Events are durable, Refs are fast cache
❌ **Don't try to share Refs across entities**: Use messages instead
❌ **Don't expect SubscriptionRef.changes to cross nodes**: Process-local only
✅ **Use persistent messaging for inter-entity communication**: Cluster handles delivery

**Golden Rule**: Refs are for **entity-local** state. For **cross-entity** coordination, use **messages**. For **durable** state, use **event sourcing**! 🎯
