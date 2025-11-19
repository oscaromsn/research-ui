---
modified: 2025-11-04T07:44:44-03:00
---
# IV. IMPLEMENTATION ARCHITECTURE

## A. Effect-TS Actor System Components

### 1. Core Abstractions

Effect-TS provides first-class actor support through `@effect/cluster`, implementing a **virtual actor model** inspired by Orleans and Erlang. This section details the concrete implementation patterns for building production actor systems.

#### 1.1 Entity Definition

**Core Concept**: Entities are the fundamental building blocks of the Effect-TS actor system. Each entity represents a persistent actor with its own state and behavior.

**Entity Structure**:

```typescript
import { Entity, RecipientType, Sharding } from "@effect/cluster"
import * as Schema from "@effect/schema/Schema"
import * as Effect from "effect/Effect"
import * as Ref from "effect/Ref"

// 1. Define entity's message protocol
type AgentMessage = 
  | { _tag: "Query"; query: string; replyTo: Deferred.Deferred<string, AgentError> }
  | { _tag: "UpdateContext"; context: Context }
  | { _tag: "Interrupt"; reason: string }

// 2. Define entity with persistent state
const AgentEntity = Entity.make(
  "Agent",                    // Entity type name
  Schema.String,              // Entity ID type (how to identify instances)
  RecipientType.EntityType,   // Recipient type for messaging
  
  // 3. Behavior function: (entityId, message) => Effect
  (entityId: string, msg: AgentMessage) => Effect.gen(function* () {
    // Access the actor's persistent state
    const stateRef = yield* Entity.state<AgentState>()
    const currentState = yield* Ref.get(stateRef)
    
    // Handle message and update state
    switch (msg._tag) {
      case "Query":
        const response = yield* processQuery(currentState, msg.query)
        yield* Deferred.succeed(msg.replyTo, response)
        
        // Update state after processing
        yield* Ref.update(stateRef, state => ({ 
          ...state, 
          history: [...state.history, msg.query] 
        }))
        return
        
      case "UpdateContext":
        yield* Ref.set(stateRef, { 
          ...currentState, 
          context: msg.context 
        })
        return
        
      case "Interrupt":
        // Actors can handle interruptions as just another message
        yield* Ref.update(stateRef, state => ({ 
          ...state, 
          interrupted: true,
          interrupt_reason: msg.reason
        }))
        return
    }
  })
)
```

**Entity Lifecycle**:

```typescript
// Entities are created on-demand and persist until explicitly terminated
const sharding = yield* Sharding.Sharding

// Send message to entity (creates if doesn't exist)
const messenger = yield* sharding.messenger("Agent")
yield* messenger.send("agent-123", {
  _tag: "Query",
  query: "What is CISG Article 25?",
  replyTo: deferred
})

// Entity "agent-123" now exists and maintains state
// Subsequent messages to "agent-123" go to same instance
```

**State Schema Definition**:

```typescript
// Define state type for type safety
type AgentState = {
  // Current context
  agent_id: string
  created_at: DateTime
  
  // Accumulated state
  history: string[]
  context: Context
  
  // Working state
  current_task: Option.Option<Task>
  interrupted: boolean
  interrupt_reason: Option.Option<string>
  
  // Learned patterns (references to model)
  learned_strategy_ids: string[]
}

// Initial state factory
const makeInitialState = (entityId: string): AgentState => ({
  agent_id: entityId,
  created_at: DateTime.now(),
  history: [],
  context: emptyContext(),
  current_task: Option.none(),
  interrupted: false,
  interrupt_reason: Option.none(),
  learned_strategy_ids: []
})
```

#### 1.2 Message Protocol

**Message Types**: Effect-TS uses typed messages for type-safe actor communication.

**Standard Message Structure**:

```typescript
// Base message type
type BaseMessage = {
  message_id: string
  timestamp: DateTime
  correlation_id: Option.Option<string>
}

// Message categories
type MessageType = 
  | "REQUEST"    // Requires response
  | "RESPONSE"   // Reply to request
  | "EVENT"      // Notification
  | "COMMAND"    // Directive

// Complete message protocol
type ActorMessage<Payload> = BaseMessage & {
  from_actor: string
  to_actor: string
  message_type: MessageType
  priority: Priority
  payload: Payload
  requires_response: boolean
  timeout_ms: Option.Option<number>
  retry_policy: Option.Option<RetryPolicy>
}
```

**Implementing Message Protocols**:

```typescript
// Domain-specific message types
type ResearchMessage =
  | ResearchRequest
  | ResearchResponse
  | ResearchEvent
  | ResearchCommand

type ResearchRequest = {
  _tag: "ResearchRequest"
  query: string
  jurisdiction: Jurisdiction
  deadline: DateTime
  replyTo: Deferred.Deferred<ResearchResult, ResearchError>
}

type ResearchResponse = {
  _tag: "ResearchResponse"
  correlation_id: string
  result: ResearchResult
}

type ResearchEvent = {
  _tag: "IntermediateFinding"
  finding: Finding
} | {
  _tag: "ResearchComplete"
  final_result: ResearchResult
}

type ResearchCommand = {
  _tag: "CancelResearch"
  task_id: string
} | {
  _tag: "RefineQuery"
  refinement: QueryRefinement
}
```

**Message Handling Pattern**:

```typescript
const ResearcherEntity = Entity.make(
  "Researcher",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: ResearchMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<ResearcherState>()
    
    // Pattern match on message type
    return yield* match(msg)
      .with({ _tag: "ResearchRequest" }, msg =>
        handleResearchRequest(stateRef, msg)
      )
      .with({ _tag: "IntermediateFinding" }, msg =>
        handleIntermediateFinding(stateRef, msg)
      )
      .with({ _tag: "CancelResearch" }, msg =>
        handleCancellation(stateRef, msg)
      )
      .with({ _tag: "RefineQuery" }, msg =>
        handleRefinement(stateRef, msg)
      )
      .exhaustive()
  })
)
```

#### 1.3 Sharding System

**Purpose**: Sharding provides location transparency and distribution across cluster nodes.

**Sharding Configuration**:

```typescript
import { ShardingConfig, Sharding, ManagerConfig } from "@effect/cluster"

// 1. Configure sharding
const shardingConfig = ShardingConfig.fromConfig({
  numberOfShards: 100,           // Total shards in cluster
  selfHost: "localhost:8080",    // This node's address
  shardingPort: 8080,
  serverVersion: "1.0.0"
})

// 2. Register entities
const makeSharding = Effect.gen(function* () {
  return yield* Sharding.make({
    entities: [
      AgentEntity,
      ResearcherEntity,
      CoordinatorEntity
    ],
    config: shardingConfig,
    managerConfig: ManagerConfig.defaults
  })
})

// 3. Create layer
const ShardingLive = Layer.scoped(
  Sharding.Sharding,
  makeSharding
)
```

**Location Transparency**:

```typescript
// Access actors without knowing their location
class ResearchService extends Effect.Service<ResearchService>()("ResearchService", {
  scoped: Effect.gen(function* () {
    const sharding = yield* Sharding.Sharding
    const messenger = yield* sharding.messenger("Researcher")
    
    return {
      // Send to any actor, sharding routes to correct node
      research: (researcherId: string, query: Query) =>
        Effect.gen(function* () {
          const deferred = yield* Deferred.make<Result, Error>()
          
          yield* messenger.send(researcherId, {
            _tag: "ResearchRequest",
            query,
            replyTo: deferred
          })
          
          return yield* Deferred.await(deferred)
        }),
      
      // Actor could be local or remote - same API
      updateContext: (researcherId: string, context: Context) =>
        messenger.send(researcherId, {
          _tag: "UpdateContext",
          context
        })
    }
  })
}) {}
```

**Service-Based Access**:

```typescript
// Actors accessed like services - clean abstraction
const program = Effect.gen(function* () {
  const research = yield* ResearchService
  
  // Location-transparent actor invocation
  const result = yield* research.research("researcher-123", {
    query: "CISG Article 25",
    jurisdiction: "Brazil",
    deadline: tomorrow()
  })
  
  return result
})

// Provide sharding layer
const main = program.pipe(
  Effect.provide(ShardingLive),
  Effect.provide(/* other layers */)
)
```

---

### 2. State Management Primitives

#### 2.1 Ref (Mutable State)

**Purpose**: `Ref` provides atomic, mutable state within actors with serial message processing guarantees.

**Basic Usage**:

```typescript
import * as Ref from "effect/Ref"

// Inside entity behavior
const stateRef = yield* Entity.state<ActorState>()

// Read state
const currentState = yield* Ref.get(stateRef)

// Update state atomically
yield* Ref.update(stateRef, state => ({
  ...state,
  counter: state.counter + 1
}))

// Set state
yield* Ref.set(stateRef, newState)

// Modify with effect
yield* Ref.modify(stateRef, state =>
  Effect.gen(function* () {
    const validated = yield* validateState(state)
    return [validated.result, validated.newState]
  })
)
```

**Actor State Pattern**:

```typescript
type ResearcherState = {
  // Identity
  researcher_id: string
  specialty: Specialty
  
  // Current work
  active_research: Map<TaskId, ResearchContext>
  
  // Accumulated expertise
  successful_strategies: Strategy[]
  learned_patterns: Pattern[]
  
  // Performance
  quality_scores: number[]
  average_duration: Duration
}

const ResearcherEntity = Entity.make(
  "Researcher",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: ResearchMessage) => Effect.gen(function* () {
    // Get state ref
    const stateRef = yield* Entity.state<ResearcherState>()
    const state = yield* Ref.get(stateRef)
    
    if (msg._tag === "ResearchRequest") {
      // Add to active research
      yield* Ref.update(stateRef, s => ({
        ...s,
        active_research: s.active_research.set(msg.task_id, {
          query: msg.query,
          started: DateTime.now(),
          status: "in_progress"
        })
      }))
      
      // Execute research
      const result = yield* executeResearch(state, msg)
      
      // Update state with results and learning
      yield* Ref.update(stateRef, s => ({
        ...s,
        active_research: s.active_research.delete(msg.task_id),
        successful_strategies: result.strategy_worked
          ? [...s.successful_strategies, result.strategy]
          : s.successful_strategies,
        quality_scores: [...s.quality_scores, result.quality]
      }))
      
      return result
    }
  })
)
```

**State Isolation Benefits**:

```typescript
// Each actor instance has isolated state
// No race conditions between actors
// Messages processed serially within actor

const Actor1 = ResearcherEntity("researcher-1", msg1)  // State A
const Actor2 = ResearcherEntity("researcher-2", msg2)  // State B

// Actor1 and Actor2 run concurrently
// But within each actor, messages are serial
// State updates are atomic within each actor
```

#### 2.2 SubscriptionRef (Reactive State)

**Purpose**: `SubscriptionRef` enables reactive programming - other services can subscribe to state changes.

**Basic Usage**:

```typescript
import * as SubscriptionRef from "effect/SubscriptionRef"
import * as Stream from "effect/Stream"

// Create subscribable state
const reactiveState = yield* SubscriptionRef.make<ActorState>(initialState)

// Update like normal Ref
yield* SubscriptionRef.update(reactiveState, state => ({
  ...state,
  status: "processing"
}))

// Subscribe to changes
const changes = SubscriptionRef.changes(reactiveState)
yield* Stream.runForEach(changes, change =>
  Effect.log("State changed:", change)
)
```

**Monitoring Pattern**:

```typescript
// Monitor actor state externally
class MonitoringService extends Effect.Service<MonitoringService>()("Monitoring", {
  scoped: Effect.gen(function* () {
    return {
      monitorActor: (actorId: string) =>
        Effect.gen(function* () {
          // Get actor's reactive state
          const state = yield* getActorState(actorId)
          
          // Subscribe to changes
          const subscription = yield* SubscriptionRef.changes(state)
          
          // React to state changes
          yield* Stream.runForEach(subscription, change =>
            Effect.gen(function* () {
              // Check for concerning patterns
              if (change.error_rate > 0.1) {
                yield* alertOperations({
                  actor: actorId,
                  concern: "High error rate",
                  value: change.error_rate
                })
              }
              
              // Update metrics
              yield* recordMetric("actor.state.change", {
                actor: actorId,
                field: "error_rate",
                value: change.error_rate
              })
            })
          )
        })
    }
  })
}) {}
```

**Coordination Pattern**:

```typescript
// Coordinator reacts to specialist state changes
const CoordinatorEntity = Entity.make(
  "Coordinator",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<CoordinatorState>()
    
    if (msg._tag === "MonitorSpecialist") {
      // Subscribe to specialist's state
      const specialistState = yield* getSpecialistState(msg.specialist_id)
      const changes = SubscriptionRef.changes(specialistState)
      
      // React to specialist discoveries
      yield* Stream.runForEach(changes, specialistState =>
        Effect.gen(function* () {
          if (specialistState.new_finding) {
            // Update coordinator strategy based on specialist finding
            yield* Ref.update(stateRef, state =>
              incorporateFinding(state, specialistState.new_finding)
            )
            
            // Potentially adjust other specialists
            if (specialistState.new_finding.changes_strategy) {
              yield* redistributeWork(state)
            }
          }
        })
      )
    }
  })
)
```

**Reactive Coordination**:

```typescript
// Multiple services react to same state changes
const setupReactiveSystem = Effect.gen(function* () {
  const actorState = yield* SubscriptionRef.make(initialState)
  
  // Service 1: Metrics collection
  yield* Stream.runForEach(
    SubscriptionRef.changes(actorState),
    state => recordMetrics(state)
  ).pipe(Effect.fork)
  
  // Service 2: Alerting
  yield* Stream.runForEach(
    SubscriptionRef.changes(actorState),
    state => checkAlerts(state)
  ).pipe(Effect.fork)
  
  // Service 3: State persistence
  yield* Stream.runForEach(
    SubscriptionRef.changes(actorState),
    state => persistState(state)
  ).pipe(Effect.fork)
})
```

---

### 3. Supervision and Fault Tolerance

#### 3.1 Retry Mechanisms

**Exponential Backoff**:

```typescript
import * as Schedule from "effect/Schedule"

// Basic retry with exponential backoff
const withRetry = (operation: Effect.Effect<Result, Error>) =>
  operation.pipe(
    Effect.retry(Schedule.exponential("1 second", 2.0)),
    Effect.retry(Schedule.recurs(5))  // Max 5 attempts
  )

// Retry with jitter (prevents thundering herd)
const withJitteredRetry = (operation: Effect.Effect<Result, Error>) =>
  operation.pipe(
    Effect.retry(
      Schedule.exponential("1 second").pipe(
        Schedule.jittered,  // Add randomness
        Schedule.intersect(Schedule.recurs(5))
      )
    )
  )
```

**Conditional Retry**:

```typescript
// Retry only for specific errors
const retryTransientErrors = <A, E>(
  operation: Effect.Effect<A, E>
) =>
  operation.pipe(
    Effect.retry(
      Schedule.whileInput((error: E) =>
        isTransientError(error)  // Only retry transient errors
      ).pipe(
        Schedule.intersect(Schedule.exponential("1 second")),
        Schedule.intersect(Schedule.recurs(3))
      )
    )
  )

// Example usage
const robustToolCall = retryTransientErrors(
  callExternalAPI(params)
)
```

**Actor-Specific Retry**:

```typescript
const ResearcherEntity = Entity.make(
  "Researcher",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg) => Effect.gen(function* () {
    // Actor behavior with built-in retry
  }).pipe(
    // Retry actor behavior on failure
    Effect.retry(
      Schedule.exponential("100 millis").pipe(
        Schedule.intersect(Schedule.recurs(3))
      )
    ),
    // Log failures
    Effect.tapErrorCause(cause =>
      Effect.logError(`Actor ${entityId} failed`, cause)
    )
  )
)
```

#### 3.2 Error Handling

**Supervision Strategies**:

```typescript
// Supervisor actor manages child actors
class SupervisorActor {
  private children = new Map<string, ActorRef>()
  
  handleMessage(msg: SupervisorMessage) {
    return Effect.gen(function* () {
      if (msg._tag === "SpawnChild") {
        const child = yield* spawnChild(msg.config)
        this.children.set(child.id, child)
        
        // Supervise with restart policy
        yield* supervise(child, {
          onFailure: (error) => Effect.gen(function* () {
            yield* Effect.logError("Child failed", error)
            
            // Decide restart strategy
            if (isRecoverableError(error)) {
              // Restart with clean state
              yield* restartChild(child.id)
            } else {
              // Escalate to parent
              yield* escalateError(error)
            }
          })
        })
      }
    })
  }
}
```

**Error Categorization**:

```typescript
// Categorize errors for appropriate handling
type ActorError =
  | TransientError    // Retry automatically
  | PermanentError    // Don't retry, log and escalate
  | StateError        // Reset state and retry
  | CriticalError     // Stop actor, alert ops

const handleActorError = (error: ActorError) =>
  match(error)
    .with({ _tag: "TransientError" }, () =>
      // Retry with backoff
      Effect.retry(operation, Schedule.exponential("1 second"))
    )
    .with({ _tag: "PermanentError" }, () =>
      // Log and fail gracefully
      Effect.logError("Permanent failure", error).pipe(
        Effect.flatMap(() => Effect.fail(error))
      )
    )
    .with({ _tag: "StateError" }, () =>
      // Reset state and retry
      Effect.gen(function* () {
        yield* resetActorState()
        return yield* Effect.retry(operation, Schedule.recurs(1))
      })
    )
    .with({ _tag: "CriticalError" }, () =>
      // Stop and alert
      Effect.gen(function* () {
        yield* alertOperations(error)
        yield* terminateActor()
        return yield* Effect.fail(error)
      })
    )
    .exhaustive()
```

**Compensating Actions**:

```typescript
// Saga pattern with compensation
const researchWithCompensation = (query: Query) =>
  Effect.gen(function* () {
    // Step 1: Allocate resources
    const resources = yield* allocateResources()
    
    // Register compensation
    const compensation1 = () => releaseResources(resources)
    
    // Step 2: Execute research
    const result = yield* executeResearch(query, resources).pipe(
      Effect.tapError(() => compensation1())  // Compensate on error
    )
    
    // Step 3: Store results
    yield* storeResults(result).pipe(
      Effect.tapError(() =>
        // Compensate both steps on failure
        Effect.gen(function* () {
          yield* deleteResults(result)
          yield* compensation1()
        })
      )
    )
    
    return result
  })
```

**Circuit Breaker Pattern**:

```typescript
// Prevent cascading failures
class CircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED"
  private failureCount = 0
  private lastFailure: Option.Option<DateTime> = Option.none()
  
  execute<A, E>(operation: Effect.Effect<A, E>): Effect.Effect<A, E | CircuitOpenError> {
    return Effect.gen(function* () {
      // Check circuit state
      if (this.state === "OPEN") {
        // Check if should try again
        if (Option.isSome(this.lastFailure)) {
          const timeSinceFailure = DateTime.now() - this.lastFailure.value
          
          if (timeSinceFailure > Duration.seconds(30)) {
            this.state = "HALF_OPEN"
          } else {
            return yield* Effect.fail(new CircuitOpenError())
          }
        }
      }
      
      // Execute operation
      const result = yield* operation.pipe(
        Effect.tapError(() =>
          Effect.sync(() => {
            this.failureCount++
            this.lastFailure = Option.some(DateTime.now())
            
            // Open circuit after 5 failures
            if (this.failureCount >= 5) {
              this.state = "OPEN"
            }
          })
        ),
        Effect.tap(() =>
          Effect.sync(() => {
            // Success - reset or close circuit
            if (this.state === "HALF_OPEN") {
              this.state = "CLOSED"
              this.failureCount = 0
            }
          })
        )
      )
      
      return result
    })
  }
}

// Use in actor
const ResearcherEntity = Entity.make(
  "Researcher",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg) => Effect.gen(function* () {
    const circuitBreaker = yield* CircuitBreaker
    
    // External calls protected by circuit breaker
    const externalData = yield* circuitBreaker.execute(
      callExternalAPI(params)
    )
  })
)
```

---

## B. Communication Infrastructure

### 1. Message Types

The communication infrastructure defines four fundamental message types, each serving a distinct purpose in actor coordination.

#### 1.1 REQUEST

**Purpose**: Actor needs information or action from another actor and expects a response.

**Characteristics**:
- Requires response
- Includes `replyTo` deferred
- Has timeout expectations
- Correlation ID for tracking

**Implementation**:

```typescript
type REQUEST<Payload, Response> = {
  _tag: "REQUEST"
  message_id: string
  from_actor: string
  to_actor: string
  payload: Payload
  replyTo: Deferred.Deferred<Response, Error>
  correlation_id: Option.Option<string>
  timeout_ms: number
  timestamp: DateTime
}

// Example: Research request
type ResearchRequest = REQUEST<{
  query: string
  jurisdiction: Jurisdiction
  urgency: Priority
}, ResearchResult>

// Sending REQUEST
const sendResearchRequest = (
  researcherId: string,
  query: string
) =>
  Effect.gen(function* () {
    const messenger = yield* sharding.messenger("Researcher")
    const deferred = yield* Deferred.make<ResearchResult, Error>()
    
    yield* messenger.send(researcherId, {
      _tag: "REQUEST",
      message_id: generateId(),
      from_actor: "coordinator-1",
      to_actor: researcherId,
      payload: {
        query,
        jurisdiction: "Brazil",
        urgency: "high"
      },
      replyTo: deferred,
      correlation_id: Option.none(),
      timeout_ms: 30000,
      timestamp: DateTime.now()
    })
    
    // Wait for response with timeout
    return yield* Deferred.await(deferred).pipe(
      Effect.timeout(Duration.seconds(30))
    )
  })
```

#### 1.2 RESPONSE

**Purpose**: Reply to a REQUEST message.

**Characteristics**:
- References original request via correlation_id
- No response expected
- Contains result or error

**Implementation**:

```typescript
type RESPONSE<Result> = {
  _tag: "RESPONSE"
  message_id: string
  correlation_id: string  // Required - links to REQUEST
  from_actor: string
  to_actor: string
  result: Either.Either<Result, Error>
  timestamp: DateTime
}

// Handling REQUEST and sending RESPONSE
const ResearcherEntity = Entity.make(
  "Researcher",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg) => Effect.gen(function* () {
    if (msg._tag === "REQUEST") {
      // Process request
      const result = yield* processResearch(msg.payload)
      
      // Send response via deferred
      yield* Deferred.succeed(msg.replyTo, result)
      
      // Alternatively, send explicit RESPONSE message
      const messenger = yield* sharding.messenger("Researcher")
      yield* messenger.send(msg.from_actor, {
        _tag: "RESPONSE",
        message_id: generateId(),
        correlation_id: msg.message_id,
        from_actor: entityId,
        to_actor: msg.from_actor,
        result: Either.right(result),
        timestamp: DateTime.now()
      })
    }
  })
)
```

#### 1.3 EVENT

**Purpose**: Notification of something that happened - no response expected.

**Characteristics**:
- Fire-and-forget
- No correlation required
- Multiple recipients possible
- Used for broadcasting state changes

**Implementation**:

```typescript
type EVENT<EventData> = {
  _tag: "EVENT"
  message_id: string
  event_type: string
  from_actor: string
  to_actor: string | "BROADCAST"
  payload: EventData
  timestamp: DateTime
  priority: Priority
}

// Example: Research finding event
type ResearchFindingEvent = EVENT<{
  finding: Finding
  confidence: number
  source: Source
}>

// Broadcasting event
const broadcastFinding = (finding: Finding) =>
  Effect.gen(function* () {
    const messenger = yield* sharding.messenger("Researcher")
    
    // Send to multiple interested actors
    const interested_actors = ["coordinator-1", "quality-monitor", "citation-graph"]
    
    yield* Effect.forEach(
      interested_actors,
      actor => messenger.send(actor, {
        _tag: "EVENT",
        message_id: generateId(),
        event_type: "ResearchFindingComplete",
        from_actor: "researcher-123",
        to_actor: actor,
        payload: {
          finding,
          confidence: 0.85,
          source: "DataJud"
        },
        timestamp: DateTime.now(),
        priority: "MEDIUM"
      }),
      { concurrency: "unbounded" }
    )
  })

// Handling events
const CoordinatorEntity = Entity.make(
  "Coordinator",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg) => Effect.gen(function* () {
    if (msg._tag === "EVENT" && msg.event_type === "ResearchFindingComplete") {
      // React to event - no response needed
      const stateRef = yield* Entity.state<CoordinatorState>()
      
      yield* Ref.update(stateRef, state =>
        incorporateFinding(state, msg.payload.finding)
      )
      
      // Possibly trigger further actions
      if (msg.payload.confidence > 0.9) {
        yield* escalateToLawyer(msg.payload.finding)
      }
    }
  })
)
```

#### 1.4 COMMAND

**Purpose**: Directive to perform action with acknowledgment.

**Characteristics**:
- Requires acknowledgment (not full response)
- Higher priority than requests
- Used for control flow
- May include execution parameters

**Implementation**:

```typescript
type COMMAND<CommandData> = {
  _tag: "COMMAND"
  message_id: string
  command_type: string
  from_actor: string
  to_actor: string
  payload: CommandData
  requires_acknowledgment: boolean
  ack_to: Option.Option<Deferred.Deferred<Acknowledgment, Error>>
  timeout_ms: number
  timestamp: DateTime
}

// Example: Cancel research command
type CancelResearchCommand = COMMAND<{
  task_id: string
  reason: string
}>

// Sending command
const cancelResearch = (
  researcherId: string,
  taskId: string,
  reason: string
) =>
  Effect.gen(function* () {
    const messenger = yield* sharding.messenger("Researcher")
    const ackDeferred = yield* Deferred.make<Acknowledgment, Error>()
    
    yield* messenger.send(researcherId, {
      _tag: "COMMAND",
      message_id: generateId(),
      command_type: "CancelResearch",
      from_actor: "coordinator-1",
      to_actor: researcherId,
      payload: {
        task_id: taskId,
        reason
      },
      requires_acknowledgment: true,
      ack_to: Option.some(ackDeferred),
      timeout_ms: 5000,
      timestamp: DateTime.now()
    })
    
    // Wait for acknowledgment
    return yield* Deferred.await(ackDeferred).pipe(
      Effect.timeout(Duration.seconds(5))
    )
  })

// Handling command
const ResearcherEntity = Entity.make(
  "Researcher",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg) => Effect.gen(function* () {
    if (msg._tag === "COMMAND" && msg.command_type === "CancelResearch") {
      const stateRef = yield* Entity.state<ResearcherState>()
      
      // Execute command
      yield* Ref.update(stateRef, state => ({
        ...state,
        active_research: state.active_research.delete(msg.payload.task_id),
        cancelled_tasks: [...state.cancelled_tasks, msg.payload.task_id]
      }))
      
      // Send acknowledgment
      if (msg.requires_acknowledgment && Option.isSome(msg.ack_to)) {
        yield* Deferred.succeed(msg.ack_to.value, {
          status: "acknowledged",
          command_id: msg.message_id,
          executed_at: DateTime.now()
        })
      }
    }
  })
)
```

---

### 2. Message Structure

#### 2.1 Required Fields

Every message must include these fields for proper routing and tracking.

```typescript
type RequiredMessageFields = {
  // Identity
  message_id: string              // Unique message identifier
  
  // Routing
  from_actor: string              // Sender actor ID
  to_actor: string                // Recipient actor ID (or "BROADCAST")
  
  // Classification
  message_type: MessageType       // REQUEST | RESPONSE | EVENT | COMMAND
  
  // Priority
  priority: Priority              // CRITICAL | HIGH | MEDIUM | LOW
  
  // Temporal
  timestamp: DateTime             // When message created
  
  // Content
  payload: unknown                // Message-specific data
}
```

**Implementation**:

```typescript
// Message builder with required fields
const buildMessage = <P>(
  type: MessageType,
  from: string,
  to: string,
  payload: P,
  priority: Priority = "MEDIUM"
): Message<P> => ({
  message_id: crypto.randomUUID(),
  from_actor: from,
  to_actor: to,
  message_type: type,
  priority,
  timestamp: DateTime.now(),
  payload
})

// Usage
const msg = buildMessage(
  "REQUEST",
  "coordinator-1",
  "researcher-123",
  { query: "CISG Article 25" },
  "HIGH"
)
```

#### 2.2 Optional Fields

Optional fields provide additional control and tracking capabilities.

```typescript
type OptionalMessageFields = {
  // Request-Response Tracking
  correlation_id?: string          // Links response to request
  requires_response?: boolean      // Explicit response requirement
  
  // Reply Mechanism
  replyTo?: Deferred.Deferred<Response, Error>  // For direct replies
  
  // Timeout Control
  timeout_ms?: number              // Expected response time
  
  // Retry Policy
  retry_policy?: RetryPolicy       // How to handle failures
  
  // Context
  trace_context?: TraceContext     // Distributed tracing
  
  // Metadata
  metadata?: Record<string, unknown>  // Additional context
}
```

**Complete Message Type**:

```typescript
type CompleteMessage<P, R = unknown> = RequiredMessageFields & {
  // Optional fields based on message type
  correlation_id?: string
  requires_response?: boolean
  replyTo?: Deferred.Deferred<R, Error>
  timeout_ms?: number
  retry_policy?: RetryPolicy
  trace_context?: TraceContext
  metadata?: Record<string, unknown>
  
  // Typed payload
  payload: P
}

// Builder with all options
const buildCompleteMessage = <P, R>(
  config: {
    type: MessageType
    from: string
    to: string
    payload: P
    priority?: Priority
    correlationId?: string
    requiresResponse?: boolean
    replyTo?: Deferred.Deferred<R, Error>
    timeout?: number
    retryPolicy?: RetryPolicy
    traceContext?: TraceContext
    metadata?: Record<string, unknown>
  }
): CompleteMessage<P, R> => ({
  message_id: crypto.randomUUID(),
  from_actor: config.from,
  to_actor: config.to,
  message_type: config.type,
  priority: config.priority ?? "MEDIUM",
  timestamp: DateTime.now(),
  payload: config.payload,
  correlation_id: config.correlationId,
  requires_response: config.requiresResponse,
  replyTo: config.replyTo,
  timeout_ms: config.timeout,
  retry_policy: config.retryPolicy,
  trace_context: config.traceContext,
  metadata: config.metadata
})
```

---

### 3. Routing Logic

#### 3.1 Priority Classification

Messages are classified by priority to ensure critical operations are processed first.

```typescript
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"

// Priority determines processing order
const priorityOrder: Record<Priority, number> = {
  CRITICAL: 0,  // Highest
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3        // Lowest
}

// Priority-based queue
class PriorityMessageQueue {
  private queues: Map<Priority, Queue<Message>>
  
  enqueue(msg: Message): Effect.Effect<void> {
    return Effect.gen(function* () {
      const queue = this.queues.get(msg.priority)
      yield* Queue.offer(queue, msg)
    })
  }
  
  dequeue(): Effect.Effect<Message> {
    return Effect.gen(function* () {
      // Check CRITICAL first
      const critical = this.queues.get("CRITICAL")
      const criticalMsg = yield* Queue.poll(critical)
      if (Option.isSome(criticalMsg)) return criticalMsg.value
      
      // Then HIGH
      const high = this.queues.get("HIGH")
      const highMsg = yield* Queue.poll(high)
      if (Option.isSome(highMsg)) return highMsg.value
      
      // Then MEDIUM
      const medium = this.queues.get("MEDIUM")
      const mediumMsg = yield* Queue.poll(medium)
      if (Option.isSome(mediumMsg)) return mediumMsg.value
      
      // Finally LOW
      const low = this.queues.get("LOW")
      return yield* Queue.take(low)  // Block if all empty
    })
  }
}
```

#### 3.2 Recipient Determination

Routing logic determines how messages reach their destinations.

```typescript
// Recipient types
type Recipient =
  | { _tag: "SingleActor"; actor_id: string }
  | { _tag: "ActorType"; type: string }  // Any actor of this type
  | { _tag: "Broadcast"; type: string }  // All actors of this type
  | { _tag: "Predicate"; predicate: (actor: ActorInfo) => boolean }

// Router
class MessageRouter {
  private sharding: Sharding
  
  route(msg: Message, recipient: Recipient): Effect.Effect<void> {
    return Effect.gen(function* () {
      return yield* match(recipient)
        .with({ _tag: "SingleActor" }, r =>
          this.routeToSingle(msg, r.actor_id)
        )
        .with({ _tag: "ActorType" }, r =>
          this.routeToType(msg, r.type)
        )
        .with({ _tag: "Broadcast" }, r =>
          this.broadcast(msg, r.type)
        )
        .with({ _tag: "Predicate" }, r =>
          this.routeByPredicate(msg, r.predicate)
        )
        .exhaustive()
    })
  }
  
  private routeToSingle(msg: Message, actorId: string) {
    return Effect.gen(function* () {
      const messenger = yield* this.sharding.messenger(msg.to_actor)
      yield* messenger.send(actorId, msg)
    })
  }
  
  private broadcast(msg: Message, actorType: string) {
    return Effect.gen(function* () {
      // Get all actors of this type
      const actors = yield* this.sharding.getActorsOfType(actorType)
      
      // Send to all concurrently
      yield* Effect.forEach(
        actors,
        actor => this.routeToSingle(msg, actor.id),
        { concurrency: "unbounded" }
      )
    })
  }
}
```

#### 3.3 Delivery Mode Selection

Delivery mode depends on message characteristics and system state.

```typescript
type DeliveryMode =
  | "IMMEDIATE"     // No delay
  | "BATCH"         // Collect and send in batches
  | "SCHEDULED"     // Deliver at specific time
  | "RATE_LIMITED"  // Respect rate limits

const selectDeliveryMode = (msg: Message): DeliveryMode => {
  // Critical messages always immediate
  if (msg.priority === "CRITICAL") {
    return "IMMEDIATE"
  }
  
  // Low priority can be batched
  if (msg.priority === "LOW") {
    return "BATCH"
  }
  
  // Events can be batched
  if (msg.message_type === "EVENT") {
    return "BATCH"
  }
  
  // Requests need immediate delivery
  if (msg.message_type === "REQUEST" || msg.message_type === "COMMAND") {
    return "IMMEDIATE"
  }
  
  return "IMMEDIATE"
}

// Delivery handler
class MessageDelivery {
  private batchQueue: Queue<Message>
  private batchInterval = Duration.seconds(1)
  
  deliver(msg: Message, mode: DeliveryMode): Effect.Effect<void> {
    return match(mode)
      .with("IMMEDIATE", () => this.deliverImmediate(msg))
      .with("BATCH", () => this.deliverBatched(msg))
      .with("SCHEDULED", () => this.deliverScheduled(msg))
      .with("RATE_LIMITED", () => this.deliverRateLimited(msg))
      .exhaustive()
  }
  
  private deliverImmediate(msg: Message) {
    return Effect.gen(function* () {
      const messenger = yield* sharding.messenger(msg.to_actor)
      yield* messenger.send(msg.to_actor, msg)
    })
  }
  
  private deliverBatched(msg: Message) {
    return Effect.gen(function* () {
      // Add to batch queue
      yield* Queue.offer(this.batchQueue, msg)
    })
  }
  
  // Batch processor (runs separately)
  processBatches() {
    return Effect.gen(function* () {
      while (true) {
        // Wait for batch interval
        yield* Effect.sleep(this.batchInterval)
        
        // Collect messages
        const messages: Message[] = []
        let msg = yield* Queue.poll(this.batchQueue)
        while (Option.isSome(msg)) {
          messages.push(msg.value)
          msg = yield* Queue.poll(this.batchQueue)
        }
        
        // Deliver batch
        if (messages.length > 0) {
          yield* this.deliverBatch(messages)
        }
      }
    })
  }
}
```

#### 3.4 Timeout Handling

Timeouts prevent indefinite waiting and enable graceful degradation.

```typescript
// Timeout wrapper for message sending
const sendWithTimeout = <R>(
  send: Effect.Effect<R>,
  timeout: Duration.Duration,
  onTimeout: () => Effect.Effect<R>
) =>
  send.pipe(
    Effect.timeout(timeout),
    Effect.flatMap(result =>
      Option.match(result, {
        onNone: () => onTimeout(),
        onSome: (value) => Effect.succeed(value)
      })
    )
  )

// Usage in request-response
const requestWithTimeout = (
  actorId: string,
  request: Request
) =>
  Effect.gen(function* () {
    const messenger = yield* sharding.messenger("Actor")
    const deferred = yield* Deferred.make<Response, Error>()
    
    // Send request
    yield* messenger.send(actorId, {
      ...request,
      replyTo: deferred
    })
    
    // Wait with timeout
    const result = yield* sendWithTimeout(
      Deferred.await(deferred),
      Duration.seconds(30),
      () => Effect.fail(new TimeoutError("Request timed out"))
    )
    
    return result
  })

// Automatic retry on timeout
const requestWithRetryOnTimeout = (
  actorId: string,
  request: Request
) =>
  requestWithTimeout(actorId, request).pipe(
    Effect.retry(
      Schedule.whileInput((error: Error) =>
        error instanceof TimeoutError
      ).pipe(
        Schedule.intersect(Schedule.exponential("1 second")),
        Schedule.intersect(Schedule.recurs(3))
      )
    )
  )
```

---

## C. Tool Architecture

### 1. Tool Categories

Tools are organized into five categories based on their purpose and characteristics.

#### 1.1 Historical Query Tools

**Purpose**: Retrieve and analyze historical data to find patterns and similar situations.

**Characteristics**:
- Query past data
- Return pre-analyzed insights
- Bounded result sets
- Relevance-ranked

**Implementation Pattern**:

```typescript
// Tool interface
type HistoricalQueryTool<Query, Result> = {
  query: (params: Query) => Effect.Effect<Result, ToolError>
  cacheKey: (params: Query) => string
  resultLimit: number
}

// Example: Find similar research cases
const findSimilarResearchCases: HistoricalQueryTool<
  {
    query: string
    jurisdiction: Jurisdiction
    limit?: number
  },
  SimilarCasesResult
> = {
  query: (params) =>
    Effect.gen(function* () {
      // Query historical database
      const historical = yield* queryDatabase({
        table: "research_history",
        filters: {
          jurisdiction: params.jurisdiction,
          query_similarity: params.query
        },
        limit: params.limit ?? 5
      })
      
      // Pre-analyze results
      const analysis = yield* analyzeHistoricalCases(historical)
      
      // Return bounded, insightful results
      return {
        similar_cases: historical.slice(0, 5),
        common_patterns: analysis.patterns,
        success_rate: analysis.success_rate,
        effective_strategies: analysis.strategies,
        confidence: analysis.confidence
      }
    }),
  
  cacheKey: (params) =>
    `similar_research:${params.jurisdiction}:${hashQuery(params.query)}`,
  
  resultLimit: 5
}

// Usage in actor
const ResearcherEntity = Entity.make(
  "Researcher",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg) => Effect.gen(function* () {
    if (msg._tag === "ResearchRequest") {
      // Use historical query tool
      const similar = yield* findSimilarResearchCases.query({
        query: msg.query,
        jurisdiction: msg.jurisdiction
      })
      
      // Apply learned strategies
      const strategy = selectStrategyFrom(similar.effective_strategies)
      
      // Execute with learned approach
      const result = yield* executeResearch(strategy)
      
      return result
    }
  })
)
```

#### 1.2 Analytics Tools

**Purpose**: Perform complex calculations and statistical analysis.

**Characteristics**:
- Compute metrics
- Statistical analysis
- Pattern detection
- Performance analysis

**Implementation Pattern**:

```typescript
// Analytics tool interface
type AnalyticsTool<Input, Analysis> = {
  analyze: (data: Input) => Effect.Effect<Analysis, ToolError>
  computeMetrics: (data: Input) => Effect.Effect<Metrics, ToolError>
  detectPatterns: (data: Input) => Effect.Effect<Pattern[], ToolError>
}

// Example: Research quality analytics
const researchQualityAnalytics: AnalyticsTool<
  ResearchHistory,
  QualityAnalysis
> = {
  analyze: (history) =>
    Effect.gen(function* () {
      // Compute quality metrics
      const metrics = yield* computeQualityMetrics(history)
      
      // Detect quality patterns
      const patterns = yield* detectQualityPatterns(history)
      
      // Statistical analysis
      const stats = yield* statisticalAnalysis(history)
      
      return {
        overall_quality: metrics.average_quality,
        quality_trend: stats.trend,
        strong_areas: patterns.strong,
        weak_areas: patterns.weak,
        improvement_opportunities: identifyImprovements(patterns),
        confidence: stats.confidence
      }
    }),
  
  computeMetrics: (history) =>
    Effect.gen(function* () {
      return {
        average_quality: mean(history.map(h => h.quality)),
        success_rate: history.filter(h => h.success).length / history.length,
        average_duration: mean(history.map(h => h.duration)),
        quality_variance: variance(history.map(h => h.quality))
      }
    }),
  
  detectPatterns: (history) =>
    Effect.gen(function* () {
      // Pattern detection algorithm
      const patterns = []
      
      // Detect successful patterns
      const successfulApproaches = history
        .filter(h => h.quality > 0.8)
        .map(h => h.approach)
      
      const frequentSuccess = findFrequentItems(successfulApproaches)
      
      for (const approach of frequentSuccess) {
        patterns.push({
          pattern: approach,
          frequency: countOccurrences(successfulApproaches, approach),
          average_quality: mean(
            history
              .filter(h => h.approach === approach)
              .map(h => h.quality)
          )
        })
      }
      
      return patterns
    })
}
```

#### 1.3 Simulation Tools

**Purpose**: Project outcomes under different scenarios.

**Characteristics**:
- What-if analysis
- Scenario modeling
- Outcome projection
- Risk assessment

**Implementation Pattern**:

```typescript
// Simulation tool interface
type SimulationTool<Scenario, Projection> = {
  simulate: (scenario: Scenario) => Effect.Effect<Projection, ToolError>
  compareScenarios: (scenarios: Scenario[]) => Effect.Effect<Comparison, ToolError>
  assessRisk: (scenario: Scenario) => Effect.Effect<RiskAssessment, ToolError>
}

// Example: Treatment outcome simulation (healthcare)
const treatmentOutcomeSimulation: SimulationTool<
  {
    patient: PatientProfile
    treatment: Treatment
    duration: Duration
  },
  OutcomeProjection
> = {
  simulate: (scenario) =>
    Effect.gen(function* () {
      // Run Monte Carlo simulation
      const simulations = yield* Effect.all(
        Array.from({ length: 1000 }, () =>
          simulateSingleOutcome(scenario)
        ),
        { concurrency: 10 }
      )
      
      // Analyze simulation results
      const analysis = analyzeSimulations(simulations)
      
      return {
        expected_outcome: analysis.mean_outcome,
        confidence_interval: analysis.confidence_interval,
        success_probability: analysis.success_rate,
        potential_complications: analysis.complications,
        time_to_result: analysis.mean_duration,
        outcome_distribution: analysis.distribution
      }
    }),
  
  compareScenarios: (scenarios) =>
    Effect.gen(function* () {
      // Simulate each scenario
      const projections = yield* Effect.all(
        scenarios.map(s => treatmentOutcomeSimulation.simulate(s))
      )
      
      // Compare outcomes
      return {
        best_scenario: findBest(scenarios, projections),
        worst_scenario: findWorst(scenarios, projections),
        risk_adjusted_ranking: rankByRiskAdjusted(scenarios, projections),
        tradeoff_analysis: analyzeTradeoffs(scenarios, projections)
      }
    }),
  
  assessRisk: (scenario) =>
    Effect.gen(function* () {
      const projection = yield* treatmentOutcomeSimulation.simulate(scenario)
      
      return {
        overall_risk: calculateRisk(projection),
        risk_factors: identifyRiskFactors(scenario, projection),
        mitigation_strategies: suggestMitigations(projection),
        risk_tolerance_recommendation: assessTolerability(projection)
      }
    })
}
```

#### 1.4 External Data Tools

**Purpose**: Fetch and process data from external sources.

**Characteristics**:
- API calls
- Database queries
- Web scraping
- Data retrieval

**Implementation Pattern**:

```typescript
// External data tool interface
type ExternalDataTool<Query, Data> = {
  fetch: (query: Query) => Effect.Effect<Data, ToolError>
  cache: Cache<Query, Data>
  rateLimiter: RateLimiter
}

// Example: Legal database search
const legalDatabaseSearch: ExternalDataTool<
  {
    query: string
    database: "DataJud" | "JusBrasil" | "STF"
    filters: SearchFilters
  },
  SearchResult
> = {
  fetch: (query) =>
    Effect.gen(function* () {
      // Check cache first
      const cached = yield* legalDatabaseSearch.cache.get(query)
      if (Option.isSome(cached)) {
        return cached.value
      }
      
      // Rate limit
      yield* legalDatabaseSearch.rateLimiter.acquire()
      
      // Fetch from external API
      const response = yield* httpClient.post(
        getEndpoint(query.database),
        {
          query: query.query,
          filters: query.filters
        }
      ).pipe(
        Effect.retry(Schedule.exponential("1 second")),
        Effect.timeout(Duration.seconds(30))
      )
      
      // Parse and validate
      const data = yield* Schema.decodeUnknown(SearchResultSchema)(response)
      
      // Cache result
      yield* legalDatabaseSearch.cache.set(query, data)
      
      return data
    }),
  
  cache: makeCache<Query, SearchResult>({
    capacity: 1000,
    ttl: Duration.hours(24)
  }),
  
  rateLimiter: makeRateLimiter({
    requestsPerSecond: 10,
    burst: 20
  })
}
```

#### 1.5 Pattern Detection Tools

**Purpose**: Identify patterns and anomalies in data.

**Characteristics**:
- Anomaly detection
- Pattern recognition
- Trend identification
- Signal extraction

**Implementation Pattern**:

```typescript
// Pattern detection tool interface
type PatternDetectionTool<Data, Pattern> = {
  detectPatterns: (data: Data) => Effect.Effect<Pattern[], ToolError>
  detectAnomalies: (data: Data) => Effect.Effect<Anomaly[], ToolError>
  classifyPattern: (pattern: Pattern) => Effect.Effect<Classification, ToolError>
}

// Example: Citation pattern detection
const citationPatternDetection: PatternDetectionTool<
  CitationData[],
  CitationPattern
> = {
  detectPatterns: (data) =>
    Effect.gen(function* () {
      // Pattern detection algorithm
      const patterns = []
      
      // Detect citation chains
      const chains = yield* detectCitationChains(data)
      
      // Detect authority patterns
      const authorities = yield* detectAuthorityPatterns(data)
      
      // Detect temporal patterns
      const temporal = yield* detectTemporalPatterns(data)
      
      return [...chains, ...authorities, ...temporal]
    }),
  
  detectAnomalies: (data) =>
    Effect.gen(function* () {
      // Anomaly detection
      const anomalies = []
      
      // Statistical outliers
      const outliers = detectStatisticalOutliers(data)
      
      // Unusual citation patterns
      const unusual = detectUnusualCitations(data)
      
      return [...outliers, ...unusual]
    }),
  
  classifyPattern: (pattern) =>
    Effect.gen(function* () {
      // Classify pattern type
      if (isCitationChain(pattern)) {
        return {
          type: "citation_chain",
          significance: assessSignificance(pattern),
          reliability: assessReliability(pattern)
        }
      } else if (isAuthorityPattern(pattern)) {
        return {
          type: "authority_pattern",
          significance: assessSignificance(pattern),
          reliability: assessReliability(pattern)
        }
      }
      // ... other classifications
    })
}
```

---

### 2. Tool Design Principles

#### 2.1 Pre-computed Insights

**Principle**: Tools return analyzed insights, not raw data dumps.

**Implementation**:

```typescript
// ❌ BAD: Raw data dump
const badTool = (query: Query) =>
  Effect.gen(function* () {
    // Returns 10,000+ raw records
    return yield* database.query("SELECT * FROM cases")
  })

// ✅ GOOD: Pre-analyzed insights
const goodTool = (query: Query) =>
  Effect.gen(function* () {
    // Fetch raw data
    const rawData = yield* database.query("SELECT * FROM cases WHERE ...")
    
    // Pre-analyze
    const insights = {
      // Bounded results
      top_matches: rawData.slice(0, 5),
      
      // Pre-computed statistics
      total_found: rawData.length,
      average_relevance: mean(rawData.map(d => d.relevance)),
      
      // Pattern analysis
      common_patterns: extractPatterns(rawData),
      
      // Actionable recommendations
      recommended_approach: selectBestApproach(rawData),
      
      // Quality signals
      confidence: calculateConfidence(rawData),
      data_completeness: assessCompleteness(rawData)
    }
    
    return insights
  })
```

#### 2.2 Bounded Outputs

**Principle**: Tool outputs have maximum size limits to prevent context overflow.

**Implementation**:

```typescript
// Tool output constraints
type BoundedToolOutput<T> = {
  // Primary results (limited)
  results: T[]  // max_length enforced
  total_found: number  // for context
  
  // Summary (instead of full data)
  summary: string
  
  // Metadata (small)
  metadata: {
    confidence: number
    computation_time_ms: number
    data_source: string
  }
}

// Enforce bounds
const enforceOutputBounds = <T>(
  results: T[],
  maxResults: number = 5
): BoundedToolOutput<T> => ({
  results: results.slice(0, maxResults),
  total_found: results.length,
  summary: generateSummary(results),
  metadata: {
    confidence: calculateConfidence(results),
    computation_time_ms: measureTime(),
    data_source: "database"
  }
})

// Example tool with bounds
const boundedSearchTool = (query: Query) =>
  Effect.gen(function* () {
    const allResults = yield* searchDatabase(query)
    
    // Enforce bounds
    return enforceOutputBounds(allResults, 5)
  })
```

#### 2.3 Domain-Specific Specialization

**Principle**: Tools are specialized for specific actor domains.

**Implementation**:

```typescript
// Domain-specific tool registry
class ToolRegistry {
  private tools = new Map<string, Tool>()
  
  // Register domain-specific tools
  registerForDomain(domain: string, tools: Tool[]) {
    this.tools.set(domain, tools)
  }
  
  // Get tools for actor's domain
  getToolsForDomain(domain: string): Tool[] {
    return this.tools.get(domain) ?? []
  }
}

// Example: Healthcare tools
const healthcareTools = [
  findSimilarPatientCases,
  calculateRiskScores,
  simulateTreatmentOutcomes,
  getLatestGuidelines,
  detectVitalPatterns
]

// Example: Legal tools
const legalTools = [
  searchCaseLaw,
  analyzeCitationNetwork,
  compareJurisdictions,
  extractLegalPrinciples
]

// Actor receives domain-specific tools
const HealthcareActor = Entity.make(
  "HealthcareSpecialist",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg) => Effect.gen(function* () {
    // Access healthcare-specific tools
    const tools = yield* ToolRegistry.getToolsForDomain("healthcare")
    
    // Use domain tools
    const similar = yield* tools.findSimilarPatientCases(...)
    const risk = yield* tools.calculateRiskScores(...)
  })
)
```

#### 2.4 On-Demand Invocation

**Principle**: Tools are called only when needed, not loaded in every context.

**Implementation**:

```typescript
// Tools as Effect services
class ToolService extends Effect.Service<ToolService>()("ToolService", {
  scoped: Effect.gen(function* () {
    // Tools initialized on-demand
    return {
      historicalQuery: makeHistoricalQueryTool(),
      analytics: makeAnalyticsTool(),
      simulation: makeSimulationTool()
    }
  })
}) {}

// Actor calls tools only when needed
const ActorEntity = Entity.make(
  "Actor",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<ActorState>()
    const state = yield* Ref.get(stateRef)
    
    // Decision 1: Use only state (no tool call)
    if (canDecideFromState(state, msg)) {
      return makeDecisionFromState(state)
    }
    
    // Decision 2: Need historical context (call tool)
    if (needsHistoricalContext(state, msg)) {
      const tools = yield* ToolService
      const historical = yield* tools.historicalQuery(...)
      return makeDecisionWithHistory(state, historical)
    }
    
    // Decision 3: Need simulation (call different tool)
    if (needsSimulation(state, msg)) {
      const tools = yield* ToolService
      const simulation = yield* tools.simulation(...)
      return makeDecisionWithSimulation(state, simulation)
    }
  })
)
```

#### 2.5 Actionable Results

**Principle**: Tool results directly support decision-making.

**Implementation**:

```typescript
// Actionable tool output structure
type ActionableToolOutput<T> = {
  // Direct answer
  recommendation: Recommendation
  
  // Supporting evidence
  evidence: Evidence[]
  
  // Alternatives considered
  alternatives: Alternative[]
  
  // Risk assessment
  risks: Risk[]
  
  // Next steps
  suggested_actions: Action[]
  
  // Quality indicators
  confidence: number
  reliability: number
  
  // Raw data (optional, minimal)
  supporting_data?: T
}

// Example: Case law search returns actionable results
const actionableCaseLawSearch = (query: Query) =>
  Effect.gen(function* () {
    const cases = yield* searchCaseLaw(query)
    
    return {
      // Direct recommendation
      recommendation: {
        primary_argument: selectBestArgument(cases),
        reasoning: explainSelection(cases)
      },
      
      // Supporting evidence
      evidence: cases.slice(0, 3).map(c => ({
        case: c.name,
        holding: c.holding,
        relevance: c.relevance_score
      })),
      
      // Alternatives
      alternatives: identifyAlternativeArguments(cases),
      
      // Risks
      risks: identifyArgumentRisks(cases),
      
      // Next steps
      suggested_actions: [
        "Cite primary case in opening brief",
        "Distinguish opposing authority",
        "Research procedural history"
      ],
      
      // Quality
      confidence: 0.85,
      reliability: assessSourceReliability(cases)
    }
  })
```

---

### 3. Tool Output Specifications

#### 3.1 Maximum Item Limits

**Specification**:

```typescript
// Tool output limits
type ToolOutputLimits = {
  max_items: number           // Maximum array length
  max_string_length: number   // Maximum string size
  max_depth: number          // Maximum nesting depth
  max_total_tokens: number   // Maximum token count
}

// Standard limits by tool category
const TOOL_OUTPUT_LIMITS: Record<string, ToolOutputLimits> = {
  historical_query: {
    max_items: 5,
    max_string_length: 1000,
    max_depth: 3,
    max_total_tokens: 2000
  },
  analytics: {
    max_items: 10,
    max_string_length: 500,
    max_depth: 2,
    max_total_tokens: 1500
  },
  simulation: {
    max_items: 3,
    max_string_length: 2000,
    max_depth: 3,
    max_total_tokens: 3000
  }
}

// Enforce limits
const enforceToolOutputLimits = <T>(
  output: T,
  limits: ToolOutputLimits
): T => {
  // Enforce array limits
  if (Array.isArray(output)) {
    output = output.slice(0, limits.max_items) as T
  }
  
  // Enforce string limits
  if (typeof output === 'string') {
    output = output.slice(0, limits.max_string_length) as T
  }
  
  // Enforce depth limits
  output = limitDepth(output, limits.max_depth)
  
  // Enforce token limits
  output = limitTokens(output, limits.max_total_tokens)
  
  return output
}
```

#### 3.2 Pre-analyzed Statistics

**Specification**:

```typescript
// Statistics structure
type ToolStatistics = {
  // Count metrics
  total_items: number
  returned_items: number
  filtered_items: number
  
  // Quality metrics
  average_quality: number
  quality_variance: number
  confidence_score: number
  
  // Performance metrics
  computation_time_ms: number
  cache_hit: boolean
  
  // Coverage metrics
  data_completeness: number
  source_reliability: number
}

// Tool output with statistics
type ToolOutputWithStats<T> = {
  results: T[]
  statistics: ToolStatistics
  summary: string
}

// Generate statistics
const generateToolStatistics = <T>(
  allItems: T[],
  returnedItems: T[],
  startTime: DateTime
): ToolStatistics => ({
  total_items: allItems.length,
  returned_items: returnedItems.length,
  filtered_items: allItems.length - returnedItems.length,
  average_quality: mean(returnedItems.map(item => item.quality)),
  quality_variance: variance(returnedItems.map(item => item.quality)),
  confidence_score: calculateConfidence(returnedItems),
  computation_time_ms: DateTime.now() - startTime,
  cache_hit: false,  // Set by cache layer
  data_completeness: assessCompleteness(returnedItems),
  source_reliability: assessReliability(returnedItems)
})
```

#### 3.3 Confidence Scores

**Specification**:

```typescript
// Confidence score structure
type ConfidenceScore = {
  overall: number  // 0-1
  components: {
    data_quality: number
    source_reliability: number
    result_consistency: number
    coverage: number
  }
  explanation: string
}

// Calculate confidence
const calculateConfidence = (
  results: Result[]
): ConfidenceScore => {
  const data_quality = assessDataQuality(results)
  const source_reliability = assessSourceReliability(results)
  const result_consistency = assessConsistency(results)
  const coverage = assessCoverage(results)
  
  // Weighted combination
  const overall = (
    data_quality * 0.3 +
    source_reliability * 0.3 +
    result_consistency * 0.2 +
    coverage * 0.2
  )
  
  return {
    overall,
    components: {
      data_quality,
      source_reliability,
      result_consistency,
      coverage
    },
    explanation: generateConfidenceExplanation({
      data_quality,
      source_reliability,
      result_consistency,
      coverage
    })
  }
}

// Tool output with confidence
type ToolOutputWithConfidence<T> = {
  results: T[]
  confidence: ConfidenceScore
  should_verify: boolean  // True if confidence < threshold
}
```

#### 3.4 Token Size Estimates

**Specification**:

```typescript
// Token estimation
type TokenEstimate = {
  estimated_tokens: number
  actual_tokens?: number
  within_budget: boolean
  budget_used: number  // Percentage
}

// Estimate tokens
const estimateTokens = (output: unknown): TokenEstimate => {
  // Rough estimation: 1 token ≈ 4 characters
  const jsonString = JSON.stringify(output)
  const estimated = Math.ceil(jsonString.length / 4)
  
  return {
    estimated_tokens: estimated,
    within_budget: estimated < 2000,
    budget_used: (estimated / 2000) * 100
  }
}

// Tool with token budgeting
const budgetedTool = <T>(
  tool: Tool<T>,
  maxTokens: number = 2000
) => (params: ToolParams) =>
  Effect.gen(function* () {
    // Execute tool
    const result = yield* tool(params)
    
    // Estimate tokens
    const estimate = estimateTokens(result)
    
    // If over budget, truncate
    if (!estimate.within_budget) {
      return truncateToTokenBudget(result, maxTokens)
    }
    
    return result
  })

// Complete tool output
type CompleteToolOutput<T> = {
  results: T[]
  statistics: ToolStatistics
  confidence: ConfidenceScore
  token_estimate: TokenEstimate
}
```

---

This implementation architecture provides the concrete patterns and code structures needed to build production actor systems using Effect-TS. The key takeaways are:

1. **Entity Definition**: Entities are persistent actors with state managed through Ref
2. **Message Protocol**: Typed messages with four categories (REQUEST, RESPONSE, EVENT, COMMAND)
3. **Sharding System**: Location transparency through Effect's sharding capabilities
4. **State Management**: Atomic updates with Ref, reactive patterns with SubscriptionRef
5. **Supervision**: Retry policies, error handling, and circuit breakers
6. **Communication**: Priority-based routing with timeout handling
7. **Tool Architecture**: Five categories with design principles emphasizing pre-analyzed, bounded outputs

The architecture enables building scalable, fault-tolerant actor systems where each actor maintains expertise, learns over time, and coordinates with others through well-defined message protocols.
