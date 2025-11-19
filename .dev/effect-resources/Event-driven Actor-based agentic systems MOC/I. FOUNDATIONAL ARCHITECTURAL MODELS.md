---
modified: 2025-11-04T07:04:17-03:00
---
# I. FOUNDATIONAL ARCHITECTURAL MODELS

## A. Execution Paradigms

### 1. Workflow Model

#### 1.1 Core Characteristics

Workflows represent **pre-defined execution paths** where the coordination logic is explicit and centralized. The fundamental characteristic is that you declare upfront what happens when, creating a deterministic execution graph.

**Defining Features:**
- **Pre-defined execution graphs**: DAGs (Directed Acyclic Graphs) or state machines that specify the complete flow
- **Declarative specification**: You describe "what happens when" rather than imperatively handling each case
- **Centralized coordination**: A single orchestrator manages the flow between steps
- **Deterministic execution**: Given the same inputs and branch conditions, execution follows the same path
- **Explicit control flow**: Think: "first do A, then B, if B succeeds do C, else do D"

**Execution Model:**

Workflows embody a **task-oriented perspective** where software performs a sequence of operations to completion. Each workflow instance has:
- A single entry point (trigger)
- A defined termination state
- Linear or branching causality (step dependencies)
- State that exists only for the workflow's duration

```typescript
// Workflow thinking: Linear, single-input/single-output
const researchWorkflow = pipe(
  Effect.gen(function* (_) {
    const query = yield* _(QueryParser.parse(input))
    const sources = yield* _(SourceDiscovery.find(query))
    const results = yield* _(
      Effect.all(
        sources.map(s => DataFetcher.fetch(s)),
        { concurrency: 5 }
      )
    )
    const synthesized = yield* _(Synthesizer.combine(results))
    return synthesized
  }),
  Effect.retry(retryPolicy),
  Effect.withTimeout(Duration.minutes(5))
)
```

**Philosophical Foundation:**

Workflows assume:
- **Single entry point**: One trigger initiates the workflow
- **Defined termination**: The workflow completes and discards state
- **Linear causality**: Step A → step B → step C
- **Batch mentality**: Process a discrete unit of work to completion

#### 1.2 State Management

**Centralized Workflow Context:**

In workflows, state is the **workflow's execution position plus accumulated data**. This state is:

- **Centralized**: Passed between steps as context
- **Explicit**: State transitions are visible in the graph
- **Transient**: Exists only during workflow execution
- **Checkpoint-able**: Easy to snapshot and resume from any point
- **Transformation-based**: Each step transforms immutable state

```typescript
// Workflow state: centralized, passed through steps
type WorkflowState = {
  executionPosition: Step
  accumulatedData: Data
  intermediateResults: Map<StepId, Result>
}

// State flows through the pipeline
const workflow = (initialState: WorkflowState) =>
  pipe(
    stepA(initialState),
    Effect.map(stepB),
    Effect.map(stepC),
    Effect.map(stepD)
  )
```

**State Characteristics:**

- **Position tracking**: State includes "where we are" in the execution graph
- **Immutable transformations**: Each step returns new state rather than mutating
- **Serializable**: Can be persisted to storage for long-running workflows
- **Recoverable**: Failed workflows can resume from last checkpoint

**Comparison with Actor State:**

| Workflow State | Actor State |
|----------------|-------------|
| Workflow's execution position + data | Actor's internal, persistent state |
| Centralized, passed between steps | Encapsulated, private to actor |
| Exists during workflow lifetime | Exists across multiple interactions |
| Explicit transitions in graph | Transitions in response to messages |
| Easy to checkpoint entire state | Each actor manages own checkpointing |

#### 1.3 Communication Patterns

**Synchronous Step Chaining:**

Workflows communicate through **typed inputs and outputs** with strong contracts between steps. Even when underlying operations are asynchronous, the workflow expresses them as sequential dependencies.

**Core Patterns:**

1. **Data Flow Through Pipes**

```typescript
// Steps consume outputs of previous steps
const workflow = pipe(
  parseInput(rawData),
  Effect.flatMap(validateData),
  Effect.flatMap(transformData),
  Effect.flatMap(storeData)
)
```

2. **Return Values and Exceptions**

```typescript
// Explicit success/failure handling
const step = (input: Input): Effect<Output, StepError> =>
  Effect.gen(function* (_) {
    const result = yield* _(processInput(input))
    if (result.valid) {
      return result.data
    } else {
      return yield* _(Effect.fail(new ValidationError()))
    }
  })
```

3. **Tool Calls as Function Invocations**

```typescript
// Tools are called synchronously (even if async underneath)
const workflow = Effect.gen(function* (_) {
  const data = yield* _(fetchData())      // Wait for result
  const analysis = yield* _(analyzeData(data))  // Then analyze
  const report = yield* _(generateReport(analysis))  // Then report
  return report
})
```

4. **Strong Contracts**

```typescript
// Type-safe interfaces between steps
interface StepA {
  input: InputA
  output: OutputA | ErrorA
}

interface StepB {
  input: OutputA  // Must match StepA output
  output: OutputB | ErrorB
}
```

**Communication Characteristics:**

- **Blocking semantics**: Each step waits for previous completion
- **Request-response**: Every call returns a value or throws
- **Type safety**: Compiler enforces input/output contracts
- **Traceability**: Execution flow visible in code structure
- **Deterministic ordering**: Steps execute in specified sequence

#### 1.4 Composability & Reuse

**Vertical Composition:**

Workflows compose by **nesting** - larger workflows contain smaller workflows as sub-processes.

```typescript
// Sub-workflow
const fetchAndValidate = pipe(
  fetchData(source),
  Effect.flatMap(validate)
)

// Parent workflow uses sub-workflow
const mainWorkflow = pipe(
  parseInput(input),
  Effect.flatMap(fetchAndValidate),  // Nested workflow
  Effect.flatMap(processResults)
)
```

**Reuse Through Templates:**

```typescript
// Workflow template (parameterized)
const retryableWorkflow = <A, E>(
  operation: Effect<A, E>,
  retries: number
): Effect<A, E> =>
  pipe(
    operation,
    Effect.retry(Schedule.recurs(retries)),
    Effect.withTimeout(Duration.seconds(30))
  )

// Reuse with different operations
const fetchWorkflow = retryableWorkflow(fetchData(), 3)
const saveWorkflow = retryableWorkflow(saveData(), 5)
```

**Standard Patterns Library:**

Workflows benefit from well-established compositional patterns:

1. **Sequential Composition**

```typescript
const sequential = pipe(
  stepA,
  Effect.flatMap(stepB),
  Effect.flatMap(stepC)
)
```

2. **Parallel Composition**

```typescript
const parallel = Effect.all([
  taskA,
  taskB,
  taskC
], { concurrency: "unbounded" })
```

3. **Conditional Composition**

```typescript
const conditional = pipe(
  checkCondition,
  Effect.flatMap(condition =>
    condition ? workflowA : workflowB
  )
)
```

4. **Map-Reduce Pattern**

```typescript
const mapReduce = pipe(
  items,
  Effect.forEach(processItem, { concurrency: 10 }),  // Map
  Effect.map(aggregate)  // Reduce
)
```

5. **Saga Pattern**

```typescript
// Compensating transactions for rollback
const saga = pipe(
  stepA,
  Effect.tap(compensation => saveCompensation(compensation)),
  Effect.flatMap(stepB),
  Effect.catchAll(error =>
    pipe(
      loadCompensations(),
      Effect.flatMap(compensations =>
        Effect.all(compensations.map(c => c.undo()))
      ),
      Effect.flatMap(() => Effect.fail(error))
    )
  )
)
```

**Effect-TS Workflow Composition:**

Effect provides rich combinators for workflow composition, naturally fitting the workflow paradigm through structured concurrency primitives.

#### 1.5 Failure Handling

**Planned Failure Management:**

Workflows handle failures by **planning for failure modes upfront** and specifying recovery strategies in the workflow definition.

**Core Strategies:**

1. **Retries with Policies**

```typescript
const withRetry = pipe(
  unreliableOperation,
  Effect.retry(Schedule.exponential("1 second", 2.0)),
  Effect.retry(Schedule.recurs(5))
)
```

2. **Timeouts**

```typescript
const withTimeout = pipe(
  longRunningOperation,
  Effect.timeout(Duration.minutes(5)),
  Effect.catchTag("TimeoutException", () =>
    Effect.succeed(defaultValue)
  )
)
```

3. **Compensation (Saga Pattern)**

```typescript
const withCompensation = pipe(
  performAction,
  Effect.tap(result => recordCompensation(result)),
  Effect.catchAll(error =>
    pipe(
      executeCompensation(),
      Effect.flatMap(() => Effect.fail(error))
    )
  )
)
```

4. **Circuit Breakers**

```typescript
// Between steps to prevent cascading failures
const withCircuitBreaker = pipe(
  externalCall,
  Effect.tap(CircuitBreaker.recordSuccess),
  Effect.catchAll(error =>
    pipe(
      CircuitBreaker.recordFailure(),
      Effect.flatMap(() => Effect.fail(error))
    )
  )
)
```

5. **Dead Letter Queues**

```typescript
// Failed steps routed to DLQ for later analysis
const withDLQ = pipe(
  riskyOperation,
  Effect.catchAll(error =>
    pipe(
      sendToDeadLetterQueue({ operation: "riskyOp", error }),
      Effect.flatMap(() => Effect.fail(error))
    )
  )
)
```

**Failure Mode Philosophy:**

> "Plan for every failure mode upfront"

Workflows require explicit specification of:
- What can go wrong at each step
- How to handle each error type
- Recovery strategies for failures
- Rollback procedures through compensation

#### 1.6 Observability & Debugging

**Inherent Visibility:**

Workflows provide **superior observability by design** because the execution map is drawn upfront.

**Observability Advantages:**

1. **Clear Execution Trace**

```typescript
// Every step is a traced span
const tracedWorkflow = pipe(
  step1,
  Effect.withSpan("Step1: Parse Input"),
  Effect.flatMap(step2),
  Effect.withSpan("Step2: Fetch Data"),
  Effect.flatMap(step3),
  Effect.withSpan("Step3: Process Results")
)
```

2. **Visual Workflow Graphs**
- DAG visualization shows all possible paths
- Current execution position visible
- Completed vs. pending steps clear
- Branch decisions logged

3. **Replay Debugging**

```typescript
// Re-execute workflow with same inputs
const debugWorkflow = (capturedInput: Input) =>
  workflow(capturedInput)  // Deterministic replay
```

4. **Metrics Per Step**

```typescript
const withMetrics = pipe(
  step,
  Effect.tap(result =>
    recordMetric("step_duration", result.duration)
  ),
  Effect.tapError(error =>
    recordMetric("step_errors", 1)
  )
)
```

5. **Natural Distributed Tracing**
- Parent-child span relationships match workflow structure
- Trace context flows through pipeline
- Easy to visualize in tools like Jaeger, Zipkin

**Debugging Characteristics:**

- **"Where am I?"** is always answerable (execution position)
- **State inspection** at any checkpoint
- **Deterministic replay** with captured inputs
- **Visual debugging** through workflow graphs

#### 1.7 Temporal Characteristics

**Bounded Execution:**

Workflows are designed for **finite, task-oriented work**:

- **Bounded execution time**: Usually complete within defined duration
- **Clear start and end**: Explicit lifecycle boundaries
- **Workflow instance lifecycle**: Created, executed, terminated
- **Batch/transactional work**: Process discrete units to completion
- **"This research task takes these steps"**: Task-centric perspective

```typescript
// Workflow completes and terminates
const workflow = pipe(
  startTask(input),
  Effect.flatMap(processTask),
  Effect.flatMap(completeTask),
  Effect.withTimeout(Duration.hours(1))
)
// After execution: workflow instance is gone, state discarded
```

**Lifecycle:**
1. **Creation**: Workflow instantiated with input
2. **Execution**: Steps execute according to graph
3. **Termination**: Success or failure, state released

#### 1.8 Use Cases

**Ideal for Workflows:**

1. **Deterministic Orchestration**
   - Tool execution chains (call API → parse → validate → store)
   - Data pipelines (fetch → transform → load)
   - Multi-step integrations

2. **Compliance-Critical Processes**
   - Audit trail requirements
   - Regulatory workflows
   - Approval chains

3. **Transactional Operations**
   - Financial transactions with rollback
   - Order processing with compensation
   - Idempotent operations (payments, emails)

4. **Known, Stable Processes**
   - Checklist completion
   - State machine transitions
   - Calculation sequences
   - Validation procedures

**Example: Research Tool Workflow**

```typescript
// Deterministic tool execution
const executeToolWorkflow = (
  tool: Tool, 
  input: ToolInput
): Effect<ToolResult, ToolError> => Effect.gen(function* () {
  // Step 1: Prepare input (deterministic)
  const preparedInput = yield* prepareInput(tool, input)
  
  // Step 2: Call external API with retries
  const rawResult = yield* callExternalAPI(preparedInput).pipe(
    Effect.retry(Schedule.exponential("1 second", 2.0)),
    Effect.timeout("30 seconds")
  )
  
  // Step 3: Validate response (deterministic)
  const validated = yield* Schema.decodeUnknown(ToolResultSchema)(rawResult)
  
  // Step 4: Store result (idempotent)
  yield* storeResult(validated)
  
  return validated
})
```

---

### 2. Actor Model

#### 2.1 Core Characteristics

Actors represent **autonomous, stateful entities** where behavior emerges from message exchanges. The fundamental characteristic is that you create persistent entities that react to stimuli, rather than orchestrating their behavior centrally.

**Defining Features:**
- **Emergent behavior from message exchanges**: Coordination arises from actor interactions, not central control
- **Imperative message handling**: Actors decide what to do with each message as it arrives
- **Distributed coordination**: No central orchestrator; actors coordinate through communication
- **Non-deterministic execution**: Race conditions and message ordering variations are features, not bugs
- **Autonomous decision-making**: Think: "I receive messages and decide what to do, possibly sending messages to others"

**Execution Model:**

Actors embody a **cognitive, entity-oriented perspective** where software maintains persistent identity and responds to environment. Each actor:
- Is always "on" and ready to receive messages
- Has potentially infinite lifetime
- Reacts to asynchronous, unpredictable inputs
- Makes autonomous decisions based on accumulated state
- Coordinates with peers through message-passing

```typescript
// Actor thinking: Stateful, multi-input/output, persistent
class AgentActor extends Data.TaggedClass("AgentActor")<{
  state: AgentState;
  inbox: Queue.Queue<AgentMessage>;
}> {
  // The actor maintains state and processes messages continuously
  run(): Effect<never, never, Scope.Scope> {
    return Effect.gen(function* () {
      while (true) {
        const msg = yield* Queue.take(this.inbox)
        // Update state based on message type
        this.state = yield* this.handleMessage(msg, this.state)
        // Actor continues to exist, state persists
      }
    })
  }
}
```

**Philosophical Foundation:**

> "Agency requires persistent, evolving state with multi-directional communication, not just sequential task execution."

Actors model **cognition**, not execution:
- **Persistent identity**: Actors exist over time, like people or organizations
- **Reactive behavior**: Respond to events in environment
- **Accumulated wisdom**: State and experience grow over time
- **Autonomous agency**: Make decisions independently

#### 2.2 State Management

**Encapsulated Actor State:**

In actors, state is **private and encapsulated within each actor**, only observable through the actor's behavior.

```typescript
// Actor state: private, encapsulated
type ActorState = {
  // Current context
  currentStatus: Status
  
  // Recent history (continuity)
  recentEvents: Event[]
  
  // Accumulated beliefs
  workingTheories: Map<Domain, Theory>
  
  // Learned patterns (in model, but state references them)
  learnedStrategies: StrategyId[]
}

// State managed internally by actor
class SpecialistActor extends Entity {
  private state: Ref<ActorState>
  
  handleMessage(msg: Message) {
    return Effect.gen(function* () {
      const currentState = yield* Ref.get(this.state)
      
      // State transitions based on message
      const nextState = this.computeNextState(currentState, msg)
      
      yield* Ref.set(this.state, nextState)
    })
  }
}
```

**State Characteristics:**

- **Private**: Only the actor can directly access or modify its state
- **Independent**: Each actor manages state without coordination
- **Mutable**: Typically uses mutable references (Ref, SubscriptionRef)
- **Message-driven transitions**: State changes in response to messages
- **Observable through behavior**: External world sees state effects, not state itself

**State Isolation Benefits:**

1. **Temporal Consistency**: Each message processed serially within actor
2. **No Race Conditions**: Within-actor operations are sequential
3. **Concurrent Actors**: Multiple actors run in parallel safely
4. **Location Transparency**: State can be local or distributed

**Effect-TS State Primitives:**

```typescript
// Inside an actor entity
const stateRef = yield* Entity.state<AgentState>()

// Atomic state updates
yield* Ref.update(stateRef, state => ({
  ...state,
  conversationHistory: [...state.conversationHistory, newMessage]
}))

// Or reactive state with subscriptions
const reactiveState = yield* SubscriptionRef.make(initialState)
yield* SubscriptionRef.update(reactiveState, updateFn)

// Other services can subscribe to state changes
const changes = yield* SubscriptionRef.changes(reactiveState)
yield* Stream.runForEach(changes, change => 
  Effect.log("Agent state updated", change)
)
```

**Comparison with Workflow State:**

| Actor State | Workflow State |
|-------------|----------------|
| Private, encapsulated | Centralized, passed between steps |
| Persists across interactions | Exists only during workflow |
| Transitions via messages | Explicit transitions in graph |
| Mutable (typically) | Immutable transformations |
| Each actor independent | Single workflow context |

#### 2.3 Communication Patterns

**Asynchronous Message Passing:**

Actors communicate through **messages sent asynchronously**, with no assumption about when (or if) responses arrive.

**Core Patterns:**

1. **Fire-and-Forget (Event Notification)**

```typescript
// Send message without waiting for response
yield* messenger.send(actorId, {
  _tag: "EventNotification",
  event: "DataUpdated",
  data: newData
})
// Sender continues immediately
```

2. **Request-Reply (with Deferred)**

```typescript
// Send message and wait for reply
const deferred = yield* Deferred.make<Response, Error>()
yield* messenger.send(actorId, {
  _tag: "Request",
  query: "GetData",
  replyTo: deferred
})
const response = yield* Deferred.await(deferred)
```

3. **Location Transparency**

```typescript
// Don't care if actor is local or remote
yield* messenger.send("actor-123", message)
// Could be in-process, another node, or across network
```

4. **Tool Calls as Messages**

```typescript
// Tools are specialized actors
yield* messenger.send("WebSearchActor", {
  _tag: "SearchRequest",
  query: searchQuery
})
```

5. **Weak Coupling**

```typescript
// Only need to agree on message schema, not implementation
type ResearchRequest = {
  _tag: "ResearchRequest"
  topic: string
  deadline: DateTime
}
// Sender and receiver completely decoupled
```

**Communication Characteristics:**

- **Asynchronous by default**: Sender doesn't block
- **Message-oriented**: Discrete units of communication
- **Peer-to-peer**: Actors communicate as equals
- **Flexible topology**: Dynamic discovery and routing
- **Weak coupling**: Actors don't know each other's internals

**Multi-Agent Coordination Example:**

```typescript
// For multi-agent research system:

// Juris sends research request to Web Search agent
yield* messenger.send("WebSearchAgent", {
  _tag: "SearchRequest",
  query: "CISG Article 25 interpretation"
})

// While waiting, processes intermediate findings from Document agent
yield* Queue.take(inbox).pipe(
  Effect.flatMap(msg => {
    if (msg._tag === "IntermediateFindings") {
      return processFindings(msg.findings)
    }
  })
)

// Dynamically spawns new research agents for parallel investigation
const subAgent = yield* spawnActor("SubResearchAgent")
yield* messenger.send(subAgent.id, {
  _tag: "InvestigateAspect",
  aspect: "Force Majeure"
})
```

#### 2.4 Composability & Reuse

**Horizontal Composition:**

Actors compose through **peer relationships and hierarchies**, not nesting like workflows.

1. **Actor Hierarchies (Supervision Trees)**

```typescript
// Parent actor supervises children
class SupervisorActor extends Entity {
  children: Map<ActorId, ChildActor>
  
  handleMessage(msg: Message) {
    return Effect.gen(function* () {
      if (msg._tag === "SpawnChild") {
        const child = yield* spawnChildActor(msg.config)
        this.children.set(child.id, child)
        
        // Supervise child with restart policy
        yield* supervise(child, {
          restart: "always",
          backoff: Schedule.exponential("1 second")
        })
      }
    })
  }
}
```

2. **Protocol-Based Composition**

```typescript
// Actors implement protocols (message schemas)
interface ResearchProtocol {
  research(topic: string): Effect<Results, Error>
  refine(results: Results, feedback: string): Effect<Results, Error>
}

// Different actors implement same protocol
class CaseLawResearcher implements ResearchProtocol { }
class StatutoryAnalyst implements ResearchProtocol { }
```

3. **Dynamic Topology**

```typescript
// Actors discover and spawn others at runtime
class CoordinatorActor {
  handleMessage(msg: ComplexResearchTask) {
    return Effect.gen(function* () {
      // Spawn specialists dynamically based on task
      const specialists = yield* Effect.all(
        msg.requiredExpertise.map(domain =>
          spawnSpecialist(domain)
        )
      )
      
      // Coordinate them
      const results = yield* Effect.all(
        specialists.map(s => s.research(msg))
      )
    })
  }
}
```

4. **Reuse Through Actor Behaviors**

```typescript
// Reusable behavior functions
const retryBehavior = <S, M>(
  baseBehavior: (state: S, msg: M) => Effect<S, Error>
) => (state: S, msg: M) =>
  baseBehavior(state, msg).pipe(
    Effect.retry(Schedule.exponential("1 second"))
  )

// Apply to different actors
const resilientActor = Entity.make(
  "ResilientActor",
  Schema.String,
  RecipientType.EntityType,
  retryBehavior(baseHandler)
)
```

**Effect-TS Supervision:**

Effect's structured concurrency provides actor supervision primitives inspired by Erlang/OTP:

```typescript
const SupervisedActor = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg) => Effect.gen(function* () {
    // Actor behavior
  }).pipe(
    // Automatically restart on failure with exponential backoff
    Effect.retry(Schedule.exponential("100 millis")),
    // Log defects for observability
    Effect.tapErrorCause(cause => 
      Effect.logError(`Agent ${entityId} failed`, cause)
    )
  )
)
```

#### 2.5 Failure Handling

**Supervision Strategies:**

Actors handle failures through **"let it crash" philosophy** with supervisors managing recovery.

**Core Strategies:**

1. **Restart**

```typescript
// Supervisor restarts failed actor with clean state
const supervise = (actor: Actor) =>
  actor.run().pipe(
    Effect.catchAll(error =>
      pipe(
        Effect.log("Actor failed, restarting", error),
        Effect.flatMap(() => actor.restart()),
        Effect.flatMap(() => supervise(actor))  // Recursive supervision
      )
    )
  )
```

2. **Resume**

```typescript
// Continue with error logged but state preserved
Effect.catchAll(error =>
  pipe(
    Effect.log("Non-fatal error, resuming", error),
    Effect.flatMap(() => actor.continue())
  )
)
```

3. **Stop**

```typescript
// Terminate actor permanently
Effect.catchAll(error => {
  if (isFatal(error)) {
    return pipe(
      Effect.log("Fatal error, stopping actor", error),
      Effect.flatMap(() => actor.terminate())
    )
  }
})
```

4. **Escalate**

```typescript
// Pass error to parent supervisor
Effect.catchAll(error => {
  if (cannotHandle(error)) {
    return Effect.fail({
      _tag: "Escalation",
      childId: actor.id,
      error
    })
  }
})
```

**Failure Isolation:**

> "Isolate failures, restart, and let supervisors handle recovery strategy."

For a multi-agent research system handling flaky APIs:

```typescript
// If research agent crashes parsing malformed DataJud JSON,
// supervisor just restarts it with clean slate
class ResearchAgentSupervisor {
  superviseAgent(agentId: string) {
    return pipe(
      runResearchAgent(agentId),
      Effect.catchAll(error => {
        if (error._tag === "ParseError") {
          // Restart with fresh state
          return pipe(
            Effect.log(`Agent ${agentId} failed parsing, restarting`),
            Effect.flatMap(() => spawnFreshAgent(agentId)),
            Effect.flatMap(() => this.superviseAgent(agentId))
          )
        }
      })
    )
  }
}
```

**Self-Healing:**

Actors can heal through:
- **State reset**: Restart with clean or checkpointed state
- **Incremental recovery**: Retry with partial results
- **Degraded mode**: Continue with reduced functionality
- **Circuit breaking**: Stop trying and signal unavailability

**Philosophy Comparison:**

| Workflow Approach | Actor Approach |
|-------------------|----------------|
| Plan for every failure mode | Let it crash and recover |
| Explicit compensation | Supervisor handles strategy |
| Rollback through sagas | Restart with clean state |
| Circuit breakers between steps | Isolation boundaries at actors |
| Dead letter queues | Supervision escalation |

#### 2.6 Observability & Debugging

**Challenge:**

Actor systems are **harder to observe** because behavior is emergent from distributed message exchanges.

**Observability Strategies:**

1. **Message Traces**

```typescript
// Log every message
const messenger = {
  send: (actorId: string, msg: Message) =>
    pipe(
      Effect.log("Message sent", { 
        to: actorId, 
        type: msg._tag,
        correlationId: msg.correlationId 
      }),
      Effect.flatMap(() => actualSend(actorId, msg))
    )
}
```

2. **Distributed Tracing**

```typescript
// Every message processing is a traced span
const AgentEntity = Entity.make(
  "Agent",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg) => Effect.gen(function* () {
    yield* Effect.logInfo(`Processing message`, { entityId, msg })
    
    const result = yield* processMessage(msg).pipe(
      Effect.withSpan("processMessage", { 
        attributes: { entityId, msgType: msg._tag } 
      })
    )
    
    yield* Effect.logInfo(`Message processed`, { result })
  }).pipe(
    Effect.withSpan("AgentEntity.handleMessage")
  )
)
```

3. **State Snapshots**

```typescript
// Expose state through queries (read-only)
class Agent {
  getState(actorId: string) {
    return Effect.gen(function* () {
      const deferred = yield* Deferred.make<AgentState, Error>()
      yield* messenger.send(actorId, { 
        _tag: "GetState", 
        replyTo: deferred 
      })
      return yield* Deferred.await(deferred)
    })
  }
}
```

4. **Metrics Per Actor**

```typescript
// Track actor-specific metrics
class ActorMetrics {
  recordMessage(actorId: string, msgType: string) {
    metrics.counter("actor.messages.received", {
      actor: actorId,
      type: msgType
    })
  }
  
  recordDecisionLatency(actorId: string, latencyMs: number) {
    metrics.histogram("actor.decision.latency", latencyMs, {
      actor: actorId
    })
  }
}
```

5. **Message History**

```typescript
// Maintain message history for debugging
class Actor {
  messageHistory: CircularBuffer<Message>
  
  handleMessage(msg: Message) {
    this.messageHistory.append(msg)
    // Process message
  }
}
```

**Debugging Characteristics:**

- **Message traces** show communication patterns
- **Harder to visualize** emergent behavior
- **Distributed debugging** is challenging
- **Need message history** to understand decisions
- **Requires instrumentation** of message flows

**Effect-TS Tracing Advantage:**

```typescript
// Export traces to OpenTelemetry
const MainLayer = Layer.mergeAll(
  AgentSharding,
  OpenTelemetryLayer  // Traces all actor interactions
)

// This gives full visibility into:
// - Which actors processed which messages
// - Message processing latency
// - Error propagation across actors
// - Causal relationships (parent-child spans)
```

#### 2.7 Temporal Characteristics

**Unbounded Lifetime:**

Actors are designed for **persistent, always-available services**:

- **Potentially infinite lifetime**: No assumed termination
- **Always "on"**: Ready to receive messages
- **Lifecycle independent of tasks**: Actor continues after task completion
- **Useful for stateful services**: Maintain context across interactions
- **"This agent is always available"**: Service-centric perspective

```typescript
// Actor continues indefinitely
class PersistentAgent extends Entity {
  run() {
    return Effect.gen(function* () {
      while (true) {  // Infinite loop
        const msg = yield* Queue.take(this.inbox)
        yield* this.handleMessage(msg)
        // Actor never terminates, continues processing
      }
    })
  }
}
```

**Lifecycle:**
1. **Creation**: Actor spawned and initialized
2. **Operation**: Continuously processes messages
3. **Persistence**: State maintained across messages
4. **Termination**: Only when explicitly stopped or supervised crash limit reached

**Comparison:**

| Workflow | Actor |
|----------|-------|
| Bounded execution time | Potentially infinite lifetime |
| Clear start and end | Always "on" |
| Instance has lifecycle | Entity has lifecycle |
| Batch/transactional work | Stateful service |
| "Task takes these steps" | "Agent is always available" |

#### 2.8 Use Cases

**Ideal for Actors:**

1. **Autonomous Agent Behavior**
   - Multi-turn conversations with memory
   - Strategic planning agents
   - Self-directed research agents
   - Adaptive decision-making

2. **Dynamic Parallelism**
   - Spawning sub-agents on demand
   - Parallel specialist coordination
   - Flexible task distribution

3. **Long-Lived Stateful Services**
   - Customer account managers
   - Case coordinators
   - Session handlers
   - Cache managers

4. **Multi-Agent Systems**
   - Specialist collaboration
   - Emergent coordination
   - Peer-to-peer communication
   - Dynamic team formation

5. **Reactive Systems**
   - Event-driven responses
   - Monitoring and alerting
   - Real-time adaptation
   - Continuous learning

**Example: Conversational Agent**

```typescript
// Actor maintains conversation across multiple turns
const ConversationalAgentEntity = Entity.make(
  "ConversationalAgent",
  Schema.String,
  RecipientType.EntityType,
  (agentId, msg: ConversationalMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<ConversationState>()
    const state = yield* Ref.get(stateRef)
    
    if (msg._tag === "UserMessage") {
      // Add to history (persistent across turns)
      const updatedHistory = [...state.history, msg.message]
      
      // Generate response using full history as context
      const llm = yield* LLMService
      const response = yield* llm.generateWithHistory(updatedHistory)
      
      // Update state with response (persists for next turn)
      yield* Ref.set(stateRef, {
        ...state,
        history: [...updatedHistory, response]
      })
      
      yield* Deferred.succeed(msg.replyTo, response)
    }
  })
)
```

---

### 3. Hybrid Approaches

The most powerful architectures combine workflows and actors, leveraging the strengths of each.

#### 3.1 Actors Executing Workflows Internally

**Pattern**: Actor receives high-level messages and internally executes workflows to handle them.

**Architecture:**

```
Actor (Stateful, Persistent)
  ├─ State (accumulated context)
  ├─ Message Handler
  │   └─ Spawns Workflow (ephemeral, retriable)
  │       ├─ Step 1: Fetch data
  │       ├─ Step 2: Validate
  │       └─ Step 3: Process
  └─ Updates State with Results
```

**Implementation:**

```typescript
class ResearchActor extends Entity {
  private state: Ref<ResearchState>
  
  handleMessage(msg: ResearchMessage) {
    return Effect.gen(function* () {
      if (msg._tag === "ExecuteResearch") {
        // Actor delegates to workflow for reliable execution
        const workflow = this.createResearchWorkflow(msg.query)
        
        // Run workflow (ephemeral, retriable)
        const result = yield* workflow.pipe(
          Effect.retry(Schedule.recurs(3)),
          Effect.timeout("30 seconds"),
          // On failure, actor handles it
          Effect.catchAll(error => 
            Effect.succeed({ _tag: "ResearchFailed", error } as const)
          )
        )
        
        // Actor updates its state with result (persistent)
        yield* Ref.update(this.state, state => ({
          ...state,
          researchHistory: [...state.researchHistory, result],
          learnedPatterns: this.extractPatterns(result)
        }))
        
        return result
      }
    })
  }
  
  private createResearchWorkflow(query: string) {
    // This is a workflow: linear, idempotent, retriable
    return Effect.gen(function* () {
      const sources = yield* discoverSources(query)
      const rawData = yield* fetchData(sources)
      const validated = yield* validate(rawData)
      const analyzed = yield* analyze(validated)
      return analyzed
    })
  }
}
```

**Benefits:**
- **Actor communication**: Flexible, asynchronous coordination
- **Workflow reliability**: Retries, timeouts, deterministic execution
- **State persistence**: Actor maintains context across workflows
- **Clear separation**: Long-term state (actor) vs. transient execution (workflow)

**Use Cases:**
- Agents that perform complex, multi-step operations
- Services that need both reliability (workflow) and memory (actor)
- Systems where actors coordinate but individual tasks are deterministic

#### 3.2 Workflows Spawning Actors Dynamically

**Pattern**: Workflow orchestrates high-level flow and dynamically creates actors for specialized work.

**Architecture:**

```
Workflow (Orchestration)
  ├─ Step 1: Parse input
  ├─ Step 2: Spawn specialist actors
  │   ├─ Actor A (Case Law Specialist)
  │   ├─ Actor B (Statutory Analyst)
  │   └─ Actor C (Doctrine Scholar)
  ├─ Step 3: Collect results via messages
  └─ Step 4: Synthesize and return
```

**Implementation:**

```typescript
const researchWorkflow = (query: ResearchQuery) =>
  Effect.gen(function* () {
    // Step 1: Parse and analyze query (deterministic)
    const analysis = yield* analyzeQuery(query)
    
    // Step 2: Spawn specialist actors based on analysis
    const specialists = yield* Effect.all(
      analysis.requiredExpertise.map(domain =>
        spawnSpecialistActor(domain)
      )
    )
    
    // Step 3: Send work to actors and collect results
    const deferreds = yield* Effect.all(
      specialists.map(actor => Deferred.make<Result, Error>())
    )
    
    yield* Effect.all(
      specialists.map((actor, i) =>
        messenger.send(actor.id, {
          _tag: "Research",
          query: analysis.subQueries[i],
          replyTo: deferreds[i]
        })
      )
    )
    
    const results = yield* Effect.all(
      deferreds.map(d => Deferred.await(d))
    )
    
    // Step 4: Synthesize results (deterministic)
    const synthesis = yield* synthesizeResults(results)
    
    // Step 5: Cleanup actors
    yield* Effect.all(
      specialists.map(actor => terminateActor(actor.id))
    )
    
    return synthesis
  })
```

**Benefits:**
- **Workflow clarity**: High-level flow is explicit and traceable
- **Actor specialization**: Each actor focuses on its domain
- **Dynamic parallelism**: Spawn as many actors as needed
- **Resource management**: Workflow controls actor lifecycle

**Use Cases:**
- Complex orchestrations that need specialized processing
- Systems where number/type of actors varies per task
- Scenarios requiring both predictable flow and parallel specialization

#### 3.3 Sagas as Actor Choreography

**Pattern**: Long-running transactions coordinated through actor message exchanges, without central orchestrator.

**Architecture:**

```
Distributed Saga (No Central Coordinator)
  ├─ Payment Actor → processes payment
  │   └─ On success: notifies Inventory Actor
  │   └─ On failure: compensates
  ├─ Inventory Actor → reserves items
  │   └─ On success: notifies Shipping Actor
  │   └─ On failure: notifies Payment Actor to refund
  └─ Shipping Actor → arranges delivery
      └─ On failure: notifies Inventory to release
```

**Implementation:**

```typescript
// Each saga participant is an actor
class PaymentActor extends Entity {
  handleMessage(msg: PaymentMessage) {
    return Effect.gen(function* () {
      if (msg._tag === "ProcessPayment") {
        const result = yield* chargeCard(msg.payment)
        
        if (result.success) {
          // Notify next step
          yield* messenger.send("InventoryActor", {
            _tag: "ReserveItems",
            orderId: msg.orderId,
            items: msg.items,
            compensationToken: result.paymentId
          })
        } else {
          yield* messenger.send(msg.replyTo, {
            _tag: "PaymentFailed",
            reason: result.error
          })
        }
      }
      
      if (msg._tag === "CompensatePayment") {
        // Rollback on saga failure
        yield* refundCard(msg.compensationToken)
      }
    })
  }
}

class InventoryActor extends Entity {
  handleMessage(msg: InventoryMessage) {
    return Effect.gen(function* () {
      if (msg._tag === "ReserveItems") {
        const result = yield* reserveInventory(msg.items)
        
        if (result.success) {
          yield* messenger.send("ShippingActor", {
            _tag: "ArrangeShipping",
            orderId: msg.orderId,
            compensationToken: result.reservationId
          })
        } else {
          // Trigger compensation chain
          yield* messenger.send("PaymentActor", {
            _tag: "CompensatePayment",
            compensationToken: msg.compensationToken
          })
        }
      }
      
      if (msg._tag === "CompensateReservation") {
        yield* releaseInventory(msg.compensationToken)
      }
    })
  }
}
```

**Benefits:**
- **No single point of failure**: No central orchestrator
- **Natural distributed transaction**: Each actor manages its step
- **Compensation built-in**: Actors handle their own rollback
- **Scalable**: Actors can be distributed across nodes

**Use Cases:**
- Distributed transactions across services
- Long-running business processes
- Systems requiring eventual consistency
- Multi-organization workflows

#### 3.4 Actor Pools with Workflow Coordination

**Pattern**: Pool of long-running actors coordinated by workflow logic.

**Architecture:**

```
Top Level: Workflow Orchestration
  ├─ Parse request
  ├─ Determine strategy
  └─ Dispatch to actor pool
      ↓
Middle Level: Actor Pool
  ├─ Specialist Actor 1 (always running)
  ├─ Specialist Actor 2 (always running)
  └─ Specialist Actor N (always running)
      ↓
Bottom Level: Tool Workflows (ephemeral)
  ├─ HTTP request with retries
  ├─ Parse and validate
  └─ Return result
```

**Implementation:**

```typescript
// Top level: Workflow orchestration
const researchRequestWorkflow = (request: ResearchRequest) =>
  Effect.gen(function* () {
    // 1. Parse request (deterministic)
    const parsed = yield* parseRequest(request)
    
    // 2. Determine strategy based on request type (deterministic)
    const strategy = determineStrategy(parsed)
    
    // 3. Dispatch to appropriate actors from pool
    const actors = yield* ActorPool
    const results = yield* Effect.all(
      strategy.requiredSpecialists.map(specialist =>
        actors.dispatch(specialist, parsed)
      )
    )
    
    // 4. Synthesize results (deterministic)
    return yield* synthesize(results)
  })

// Middle level: Actor pool with specialists
class ActorPool extends Effect.Service<ActorPool>() {
  // Long-running actors maintained in pool
  private specialists = new Map<SpecialistType, ActorRef>()
  
  dispatch(specialist: SpecialistType, work: Work) {
    return Effect.gen(function* () {
      const actor = this.specialists.get(specialist)
      const deferred = yield* Deferred.make<Result, Error>()
      
      yield* messenger.send(actor.id, {
        _tag: "ProcessWork",
        work,
        replyTo: deferred
      })
      
      return yield* Deferred.await(deferred)
    })
  }
}

// Actor uses workflow for tool calls
class SpecialistActor extends Entity {
  handleMessage(msg: WorkMessage) {
    return Effect.gen(function* () {
      // Actor maintains state and strategy
      const strategy = this.selectStrategy(
        msg.work,
        this.state.learnedPatterns
      )
      
      // Delegate tool calls to workflow
      const result = yield* this.toolWorkflow(strategy).pipe(
        Effect.retry(Schedule.exponential("1 second")),
        Effect.timeout("30 seconds")
      )
      
      // Actor learns from result
      this.updateLearning(strategy, result)
      
      return result
    })
  }
  
  private toolWorkflow(strategy: Strategy) {
    // Ephemeral workflow for reliable tool execution
    return Effect.gen(function* () {
      const data = yield* fetchData(strategy.source)
      const validated = yield* validate(data)
      return validated
    })
  }
}
```

**Benefits:**
- **Predictable top-level flow**: Clients see clear orchestration
- **Dynamic agent coordination**: Actors collaborate flexibly
- **Reliable primitives**: Tools execute reliably
- **Learning accumulation**: Actors improve over time

**Use Cases:**
- Production systems requiring both predictability and intelligence
- Systems where external clients expect clear APIs
- Architectures needing both coordination and specialization

#### 3.5 Choosing the Right Hybrid

**Decision Framework:**

```
Question: Does the system need persistent state across interactions?
├─ NO → Use pure workflow
└─ YES
    ↓
    Question: Is coordination logic complex and branching?
    ├─ YES → Workflow spawning actors
    └─ NO
        ↓
        Question: Are individual operations deterministic?
        ├─ YES → Actors executing workflows
        └─ NO → Pure actor choreography
```

**Examples:**

| Scenario | Best Hybrid |
|----------|-------------|
| Multi-agent research with clear phases | Workflow spawning actors |
| Conversational agent calling tools | Actor executing workflows |
| Distributed order processing | Saga (actor choreography) |
| API service with stateful handlers | Actor pool with workflow coordination |
| One-time batch job | Pure workflow (no actors) |
| Real-time collaborative system | Pure actors (no workflows) |

**Philosophical Question for Research Squad:**

> Are your agents *doing research* (workflow - research has phases) or *being researchers* (actor - researchers are people who collaborate)?

**Answer**: Probably both!

- **Juris the entity** is an actor (persistent identity, accumulated expertise)
- **Conducting research** is a workflow (deterministic phases within the actor)
- **Multi-agent coordination** is actor choreography (message passing between Juris, DataJud specialist, BNP specialist)

```typescript
// Hybrid architecture for Research Squad:
// 1. Top level: Request workflow (predictable for clients)
const handleResearchRequest = (request: Request) =>
  pipe(
    parseRequest(request),
    Effect.flatMap(dispatchToMatter)  // Matter = actor
  )

// 2. Matter actor coordinates specialists (actor pool)
class MatterActor extends Entity {
  handleRequest(request: ParsedRequest) {
    return Effect.gen(function* () {
      // Use accumulated context to determine strategy
      const strategy = this.determineStrategy(
        request,
        this.state.pastResearch
      )
      
      // Coordinate specialist actors
      const results = yield* Effect.all({
        caseLaw: specialists.caseLaw.research(request),
        statutes: specialists.statutory.research(request)
      })
      
      // Accumulate in matter state
      this.state.researchHistory.push(results)
    })
  }
}

// 3. Specialist executes using internal workflows
class CaseLawSpecialistActor extends Entity {
  handleResearch(request: Request) {
    return Effect.gen(function* () {
      // Actor uses its expertise
      const strategy = this.selectStrategy(
        request,
        this.state.learnedPatterns
      )
      
      // Workflow for reliable execution
      const result = yield* this.dataJudWorkflow(strategy).pipe(
        Effect.retry(Schedule.exponential("1 second")),
        Effect.timeout("30 seconds")
      )
      
      // Actor learns
      this.updatePatterns(strategy, result)
      
      return result
    })
  }
  
  private dataJudWorkflow(strategy: Strategy) {
    // Deterministic workflow inside actor
    return pipe(
      fetchFromDataJud(strategy),
      Effect.flatMap(parse),
      Effect.flatMap(validate)
    )
  }
}
```

This gives you:
- Predictable top-level flow (clients happy)
- Dynamic agent coordination (agents happy)
- Reliable primitives (infrastructure happy)
- Learning accumulation (long-term value)
