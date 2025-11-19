---
modified: 2025-10-27T00:04:45-03:00
---
# Event sourcing, Ref and SubscriptionRef in Effect Cluster

## Quick Answer Matrix

| Abstraction           | Inside Entity           | Across Cluster       | Survives Restarts       |
| --------------------- | ----------------------- | -------------------- | ----------------------- |
| **`Ref`**             | ✅ Yes (local state)     | ❌ No                 | ❌ No (unless persisted) |
| **`SubscriptionRef`** | ✅ Yes (local)           | ❌ No                 | ❌ No                    |
| **Event Sourcing**    | ✅ Yes (via persistence) | ✅ Yes (via messages) | ✅ Yes                   |
| **Workflow Logs**     | ✅ Yes                   | ✅ Yes                | ✅ Yes                   |

## 1. Ref Inside Entities (Actor-Local State)

**✅ Perfect Use Case**: `Ref` is **ideal** for entity-local state in Effect Cluster.

```typescript
import { Entity, Sharding, RecipientType } from "@effect/cluster";
import { Ref, Effect, Schema } from "effect";

// Agent state (in-memory, per entity instance)
type AgentState = {
  conversationHistory: string[];
  currentTask: Option.Option<Task>;
  tokenCount: number;
};

// Entity message protocol
type AgentMessage =
  | { _tag: "Query"; query: string }
  | { _tag: "GetState" }
  | { _tag: "Reset" };

const AgentEntity = Entity.make(
  "Agent",
  Schema.String, // Entity ID
  RecipientType.EntityType,
  
  (entityId: string, msg: AgentMessage) => Effect.gen(function* () {
    // ✅ Ref provides actor-local state (single-writer principle)
    const stateRef = yield* Entity.state<AgentState>();
    
    switch (msg._tag) {
      case "Query":
        // Read current state
        const state = yield* Ref.get(stateRef);
        
        // Process with LLM
        const response = yield* processLLM(state, msg.query);
        
        // Update state atomically (no concurrency issues!)
        yield* Ref.update(stateRef, s => ({
          ...s,
          conversationHistory: [...s.conversationHistory, msg.query, response],
          tokenCount: s.tokenCount + response.tokens
        }));
        
        return response;
        
      case "GetState":
        return yield* Ref.get(stateRef);
        
      case "Reset":
        yield* Ref.set(stateRef, initialState);
        return;
    }
  })
);
```

**Why Ref Works Here**:
- Each entity instance has its **own isolated `Ref`**
- Effect Cluster guarantees **single-writer** (only one instance per entity ID)
- No distributed state coordination needed
- Fast, in-memory updates

**⚠️ Limitation**: State lost on entity migration or restart (unless persisted).

## 2. Durable State with Persistence Layer

**✅ Pattern**: Combine `Ref` (fast reads/writes) with persistence (durability).

```typescript
import { SqlClient } from "@effect/sql";

const AgentEntityWithPersistence = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  
  (entityId: string, msg: AgentMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<AgentState>();
    const sql = yield* SqlClient.SqlClient;
    
    switch (msg._tag) {
      case "Query":
        // 1. Update in-memory state (fast)
        const response = yield* processQuery(msg.query);
        yield* Ref.update(stateRef, s => ({
          ...s,
          conversationHistory: [...s.conversationHistory, msg.query, response]
        }));
        
        // 2. Persist to database (durable)
        yield* sql`
          INSERT INTO agent_events (entity_id, event_type, data, timestamp)
          VALUES (${entityId}, 'QueryProcessed', ${JSON.stringify({
            query: msg.query,
            response
          })}, NOW())
        `;
        
        return response;
    }
  })
);

// On entity startup: Rebuild state from events
const rebuildState = (entityId: string) => Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const events = yield* sql`
    SELECT data FROM agent_events 
    WHERE entity_id = ${entityId} 
    ORDER BY timestamp ASC
  `;
  
  const stateRef = yield* Entity.state<AgentState>();
  const rebuiltState = events.reduce(applyEvent, initialState);
  yield* Ref.set(stateRef, rebuiltState);
});
```

**Pattern**: Event Sourcing within Entity
- Events persisted to DB (durable)
- State held in `Ref` (fast)
- Rebuild on entity activation

## 3. Effect Cluster's Native Event Sourcing (Persistent Messages)

**✅ Built-In**: Effect Cluster has **first-class persistent messaging**.

```typescript
import { ClusterSchema } from "@effect/cluster";

// Mark entity for message persistence
const PersistentAgentEntity = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  messageHandler
).annotate(ClusterSchema.persisted); // ✅ All messages persisted!

// Or selective persistence
const SelectivePersistence = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  {
    // Critical operations are persisted
    executeTask: Rpc.make("ExecuteTask", {
      payload: TaskSchema
    }).annotate(ClusterSchema.persisted),
    
    // Real-time updates are volatile
    reportProgress: Rpc.make("ReportProgress", {
      payload: ProgressSchema
    }).annotate(ClusterSchema.notPersisted)
  }
);
```

**How It Works**:
1. Messages stored before delivery
2. Even if entity/node crashes, message persists
3. On restart, unprocessed messages redelivered
4. Automatic deduplication via `PrimaryKey`

```typescript
// Message deduplication with PrimaryKey
class ProcessPayment extends Schema.Class<ProcessPayment>()({
  orderId: Schema.String,
  amount: Schema.Number
}) {
  // Implement PrimaryKey for idempotency
  [PrimaryKey.symbol]() {
    return `payment-${this.orderId}`;
  }
}

// Now if client retries, Cluster detects duplicate
yield* messenger.send(entityId, new ProcessPayment({
  orderId: "order-123",
  amount: 100
}));

// Retry (network failure) - same message
yield* messenger.send(entityId, new ProcessPayment({
  orderId: "order-123", // Same primary key!
  amount: 100
}));
// ✅ Cluster deduplicates - entity processes once
```

## 4. SubscriptionRef Across Cluster (❌ Doesn't Work)

**⚠️ Problem**: `SubscriptionRef` is **memory-only** and **local to one process**.

```typescript
// ❌ ANTI-PATTERN: SubscriptionRef in distributed cluster
const AgentEntity = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  
  (entityId, msg) => Effect.gen(function* () {
    // This Ref is LOCAL to this entity instance
    const stateRef = yield* SubscriptionRef.make<AgentState>(initialState);
    
    // ❌ Problem: .changes stream only works within same process
    // Other nodes/entities CANNOT subscribe!
    const stream = stateRef.changes;
  })
);
```

**Why It Fails**:
- `SubscriptionRef` uses in-memory `Hub` for broadcasting
- No serialization mechanism for cross-node streams
- Cluster entities are location-transparent (could move nodes)

**✅ Solution**: Use message passing instead.

```typescript
// ✅ CORRECT: Publish state changes as messages
const AgentEntity = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  
  (entityId, msg) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<AgentState>();
    const sharding = yield* Sharding.Sharding;
    
    switch (msg._tag) {
      case "Query":
        const newState = yield* processQuery(msg.query);
        yield* Ref.set(stateRef, newState);
        
        // ✅ Broadcast state change via cluster messages
        const messenger = yield* sharding.broadcaster("StateUpdate");
        yield* messenger.broadcast(new StateChangedEvent({
          entityId,
          state: newState
        }));
        
        return;
    }
  })
);

// Other entities subscribe to broadcasts
const ObserverEntity = Entity.make(
  "Observer",
  Schema.String,
  RecipientType.EntityType,
  
  (observerId, msg) => Effect.gen(function* () {
    if (msg._tag === "StateChangedEvent") {
      yield* Effect.log(`Agent ${msg.entityId} state updated`);
    }
  })
);
```

## 5. Hybrid Pattern: Local Ref + Persistent Events

**✅ Production Pattern**: Best of both worlds.

```typescript
const MultiAgentCoordinator = Entity.make(
  "Coordinator",
  Schema.String,
  RecipientType.EntityType,
  
  (coordinatorId, msg) => Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const sharding = yield* Sharding.Sharding;
    
    // ✅ Fast in-memory state (Ref)
    const agentStatesRef = yield* Entity.state<Map<AgentId, AgentState>>();
    
    switch (msg._tag) {
      case "AgentCompleted":
        // 1. Update local state (fast)
        yield* Ref.update(agentStatesRef, map =>
          map.set(msg.agentId, { status: "completed", result: msg.result })
        );
        
        // 2. Persist event (durable)
        yield* sql`
          INSERT INTO coordinator_events (
            coordinator_id, event_type, agent_id, data
          ) VALUES (
            ${coordinatorId}, 'AgentCompleted', ${msg.agentId}, ${msg.result}
          )
        `;
        
        // 3. Check if all agents done
        const states = yield* Ref.get(agentStatesRef);
        const allComplete = Array.from(states.values()).every(
          s => s.status === "completed"
        );
        
        if (allComplete) {
          // 4. Notify other entities via messages
          const messenger = yield* sharding.messenger("ResultAggregator");
          yield* messenger.send("aggregator-1", new AggregateResults({
            results: Array.from(states.values())
          }));
        }
        
        return;
    }
  })
);
```

## 6. Durable Workflows (Built-In Event Sourcing)

**✅ Effect Cluster Workflows**: Native event-sourced execution.

```typescript
import { Workflow, Activity, WorkflowEngine } from "@effect/cluster-workflow";

// Each activity execution is logged durably
const researchWorkflow = Workflow.make(
  ResearchRequest,
  (_) => `research-${_.sessionId}`,
  
  ({ query, maxIterations }) => Effect.gen(function* () {
    // Activity 1: Plan research (logged)
    const plan = yield* planResearch(query);
    
    // Activity 2: Execute searches (logged)
    const results = yield* executeSearches(plan);
    
    // Activity 3: Synthesize (logged)
    const report = yield* synthesizeReport(results);
    
    // State reconstructed from execution log on restart
    return report;
  })
);

// Persistence layer (PostgreSQL)
const engine = yield* WorkflowEngine.makeScoped(researchWorkflow).pipe(
  Effect.provide(DurableExecutionJournalPostgres.layer)
);

// Even if server crashes mid-execution...
yield* engine.send(new ResearchRequest({ sessionId: "123", ... }));

// ...on restart, workflow resumes from last logged activity!
```

**Key Insight**: Workflow execution log **IS** event sourcing.

## 7. Complete Multi-Agent Architecture

```typescript
// ===== Layer 1: Durable Workflows (Event Sourced) =====
const AgentWorkflow = Workflow.make(
  AgentTaskRequest,
  (_) => `agent-${_.agentId}`,
  (input) => Effect.gen(function* () {
    // Each step logged durably
    yield* step1(input);
    yield* step2(input);
    yield* step3(input);
  })
);

// ===== Layer 2: Coordinator Entity (Ref + Events) =====
const CoordinatorEntity = Entity.make(
  "Coordinator",
  Schema.String,
  RecipientType.EntityType,
  
  (coordinatorId, msg) => Effect.gen(function* () {
    // Local fast state
    const stateRef = yield* Entity.state<CoordinatorState>();
    const sql = yield* SqlClient.SqlClient;
    
    // Handle messages, persist events
    yield* Ref.update(stateRef, ...);
    yield* sql`INSERT INTO events ...`;
  })
).annotate(ClusterSchema.persisted); // ✅ Messages persisted

// ===== Layer 3: Observer Service (Cross-Cluster) =====
class ObserverService extends Effect.Service<ObserverService>()(
  "app/ObserverService",
  {
    scoped: Effect.gen(function* () {
      const sharding = yield* Sharding.Sharding;
      
      // Subscribe to cluster-wide events via messages
      const subscriber = yield* sharding.messenger("Observer");
      
      return {
        watchAgent: (agentId: string) =>
          Effect.gen(function* () {
            // Send message to request updates
            yield* subscriber.send(agentId, new SubscribeToUpdates());
            
            // Entity will send messages back
            // (not using SubscriptionRef!)
          })
      };
    })
  }
) {}

// ===== Layer 4: Frontend Connection =====
// Entities send messages to edge nodes, which use SubscriptionRef locally
class WebSocketGateway extends Effect.Service<WebSocketGateway>()(
  "app/WebSocketGateway",
  {
    scoped: Effect.gen(function* () {
      // ✅ SubscriptionRef OK here (single node)
      const clientStatesRef = yield* SubscriptionRef.make<Map<ClientId, State>>(
        new Map()
      );
      
      // Receive messages from cluster entities
      const subscriber = yield* sharding.messenger("Gateway");
      
      // Update local SubscriptionRef
      yield* subscriber.subscribe().pipe(
        Stream.tap(msg =>
          SubscriptionRef.update(clientStatesRef, map =>
            map.set(msg.clientId, msg.state)
          )
        ),
        Stream.runDrain,
        Effect.forkScoped
      );
      
      return {
        // Clients subscribe to local SubscriptionRef
        clientUpdates: (clientId: ClientId) =>
          clientStatesRef.changes.pipe(
            Stream.filterMap(map => Option.fromNullable(map.get(clientId)))
          )
      };
    })
  }
) {}
```

## Summary Decision Tree

```
Need state in Effect Cluster?
│
├─ Is it within ONE entity?
│  ├─ Fast, ephemeral → Use Ref ✅
│  └─ Need persistence → Ref + SQL events ✅
│
├─ Is it across MULTIPLE entities?
│  ├─ Command/response → Message passing ✅
│  └─ Event broadcasting → Persistent messages ✅
│
├─ Is it a long-running process?
│  └─ Use Workflow (built-in event sourcing) ✅
│
└─ Need real-time UI updates?
   ├─ Within single node → SubscriptionRef ✅
   └─ Across cluster → Messages → Edge SubscriptionRef ✅
```

## Golden Rules

| Rule | Rationale |
|------|-----------|
| **1. Ref = Actor-Local** | One entity instance = one writer = no races |
| **2. SubscriptionRef ≠ Distributed** | Memory-only, cannot cross node boundaries |
| **3. Messages = Cross-Cluster** | Only way to communicate between entities |
| **4. Workflows = Native Event Sourcing** | Execution log is durable, replay on restart |
| **5. Edge Nodes = Bridge** | Use SubscriptionRef at edges for local broadcasting |

**Bottom Line**: Effect Cluster gives you **event sourcing through persistent messages and workflow logs**. Use `Ref` for fast local state, and coordinate across the cluster via messages, not shared memory! 🎯
