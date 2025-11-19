---
modified: 2025-11-02T16:57:24-03:00
---
# Contrasting Workflow vs Actor model for AI agents

## **Control Flow & Execution Model**

**Workflows:**
- Pre-defined execution graphs (DAGs or state machines)
- Declarative specification of what happens when
- Coordination is explicit and centralized
- Think: "first do A, then B, if B succeeds do C, else do D"
- Execution is deterministic given the same inputs and branches

**Actors:**
- Emergent behavior from message exchanges
- Imperative handling of messages as they arrive
- Coordination is implicit and distributed
- Think: "I receive messages and decide what to do, possibly sending messages to others"
- Execution is non-deterministic - race conditions are features, not bugs

For Research Squad, this distinction matters: is Juris agent following a predetermined research plan (workflow), or dynamically deciding next steps based on what other agents tell it (actor)?

## **State Management**

**Workflows:**
- State is workflow context - centralized, passed between steps
- State transitions are explicit in the graph
- Easy to snapshot and resume ("checkpointing")
- State is the workflow's execution position + accumulated data
- Immutable state transformations fit naturally

**Actors:**
- State is encapsulated within each actor
- State transitions happen in response to messages
- Each actor manages its own state independently
- State is private - only observable through behavior
- Mutable state is typical (though not required)

With Effect-TS, you could model workflow state as effect context (ZIO environment pattern) or actor state as Ref/FiberRef inside long-running Fibers.

## **Communication Patterns**

**Workflows:**
- Data flow through typed inputs/outputs
- Synchronous step chaining (even if async underneath)
- Return values and exceptions
- Tool calls = function invocations
- Strong contracts between steps

**Actors:**
- Message passing (asynchronous by default)
- Location transparency - don't care where actor lives
- Fire-and-forget or request-reply patterns
- Tool calls = messages to specialized actors
- Weak coupling - only need to agree on message schema

For your multi-agent system, the actor model naturally handles scenarios like:
- Juris sends research request to Web Search agent
- While waiting, processes intermediate findings from Document agent
- Dynamically spawns new research agents for parallel investigation

## **Composability & Reuse**

**Workflows:**
- Compose by nesting workflows (sub-workflows)
- Reuse through workflow templates
- Vertical composition - larger workflows contain smaller ones
- Library of workflow patterns (map-reduce, scatter-gather, saga)
- Combinator-based composition (sequential, parallel, conditional)

**Actors:**
- Compose by actor hierarchies (supervision trees)
- Reuse through actor behaviors
- Horizontal composition - actors collaborate as peers
- Protocol-based composition - actors implement protocols
- Dynamic topology - actors can spawn/discover other actors at runtime

Effect-TS's structured concurrency gives you workflow composition primitives. But you could build actor supervision on top (Erlang/OTP style).

## **Failure Handling**

**Workflows:**
- Retries, timeouts, compensation (saga pattern)
- Failure modes defined in workflow specification
- Rollback through compensating actions
- Circuit breakers between steps
- Dead letter queues for failed steps

**Actors:**
- Supervision strategies (restart, resume, stop, escalate)
- "Let it crash" philosophy
- Supervisor actors monitor child actors
- Failure is localized and isolated
- Self-healing through actor restart with clean state

This is huge for reliability. Workflow approach: "plan for every failure mode upfront." Actor approach: "isolate failures, restart, and let supervisors handle recovery strategy."

For Research Squad handling flaky APIs or bad LLM outputs, the actor model's supervision trees could be elegant: if a research agent crashes parsing malformed DataJud JSON, its supervisor just restarts it with a clean slate.

## **Observability & Debugging**

**Workflows:**
- Clear execution trace through steps
- Visual workflow graphs
- Easy to see "where" execution is
- Replay debugging - re-execute with same inputs
- Metrics per step
- Distributed tracing maps naturally

**Actors:**
- Message traces show communication patterns
- Harder to visualize emergent behavior
- Distributed debugging is challenging
- Need message history to understand actor decisions
- Metrics per actor and message type
- Observability requires instrumentation of message flows

Workflow observability is inherently better - you drew the map upfront. Actor systems require more sophisticated tooling to understand what's happening.

## **Temporal Characteristics**

**Workflows:**
- Bounded execution time (usually)
- Clear start and end
- Workflow instance has lifecycle
- Useful for batch/transactional work
- "This research task takes these steps"

**Actors:**
- Potentially infinite lifetime
- Always "on" and ready to receive messages
- Actor lifecycle independent of task lifecycle
- Useful for stateful services
- "This agent is always available to help with research"

## **Implementation Patterns**

**Workflows (in Effect-TS context):**

```typescript
// Pseudo-code
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

**Actors (Effect-based pseudocode):**

```typescript
// Pseudo-code
const jurisActor = (inbox: Queue<Message>) => 
  Effect.gen(function* (_) {
    const state = yield* _(Ref.make(initialState))
    
    yield* _(Effect.forever(
      pipe(
        Queue.take(inbox),
        Effect.flatMap(msg => handleMessage(msg, state)),
        Effect.fork
      )
    ))
  })

const handleMessage = (msg: Message, state: Ref<State>) =>
  Effect.gen(function* (_) {
    if (msg.type === "RESEARCH_REQUEST") {
      // spawn child actors, send messages, update state
      const webSearchActor = yield* _(spawnActor(webSearchBehavior))
      yield* _(sendMessage(webSearchActor, { query: msg.query }))
    }
  })
```

## **Hybrid Approaches**

The most interesting space is the middle:

**Actors that execute workflows internally:**
- Actor receives high-level message
- Internally executes a workflow to handle it
- Workflow might send messages to other actors via tool calls
- Best of both: actor communication + workflow reliability

**Workflows that spawn actors dynamically:**
- Workflow step creates an actor
- Actor does long-running work
- Workflow monitors actor via message passing
- Workflow continues after actor completes

**Sagas as actor choreography:**
- Each saga participant is an actor
- Workflow is emergent from message exchanges
- No central coordinator - distributed transaction
- Natural fit for long-running business processes

## **For Research Squad Specifically**

Your multi-agent research system seems to want:
- **Reliability** → workflows
- **Dynamic parallelism** → actors
- **Complex coordination** → workflows
- **Autonomous agents** → actors
- **Type safety** → workflows (easier to type)
- **Flexible discovery** → actors

**A potential architecture:**

1. **Top level: Workflow orchestration**
   - Research request → workflow
   - Clear steps: parse → discover sources → fetch → synthesize
   - Retry and timeout guarantees

2. **Middle level: Actor pool**
   - Pool of specialized agents (Juris, DataJud, BNP, etc.)
   - Each agent = long-running actor
   - Workflow dispatches work to actors via messages

3. **Bottom level: Tool workflows**
   - Each tool call = mini-workflow
   - HTTP request with retries, parsing, validation
   - Effect-TS layers naturally

This gives you:
- Predictable top-level flow (clients want this)
- Dynamic agent coordination (agents want this)
- Reliable primitives (infrastructure needs this)

**The philosophical question:**

Are your agents *doing research* (workflow - research has phases) or *being researchers* (actor - researchers are people who collaborate)?

Probably both. Juris the agent *is* an entity (actor) that *conducts research* (workflow).

What resonates with your mental model? When you think about Juris interacting with the DataJud agent, does it feel more like function calls or message passing?
