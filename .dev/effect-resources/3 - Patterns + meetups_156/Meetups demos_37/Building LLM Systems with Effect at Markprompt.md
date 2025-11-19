---
modified: 2025-10-26T21:27:18-03:00
---
# Building LLM Systems with Effect at Markprompt
## By Elliot Dauber - Effect Days 2025

### Executive Summary
Elliot Dauber, a founding engineer at Markprompt, presents their type-safe, composable agent framework built entirely with Effect. The presentation demonstrates how to manage the inherent complexity and non-determinism of LLM systems while maintaining developer velocity through a carefully designed architecture of agents, actions, sub-agents, and deterministic workflows. By leveraging Effect's type safety and composability, Markprompt has created a system that allows customers to build sophisticated, customizable LLM-powered customer support experiences that balance autonomous AI decision-making with predictable, controlled workflows.

---

## Part 1: Context and Foundation

### Markprompt Overview

#### Company Focus
- **Domain**: Customer support and customer experience
- **Target Market**: Developer platforms with high complexity support cases
- **Location**: San Francisco-based startup

#### Core Products
1. **Large-scale LLM Processing Systems**
   - Analysis and insights generation
   - Support case processing at scale
   
2. **Customizable User-Facing LLMs**
   - Direct communication with end users
   - Highly customizable by customers
   - Developer platform focus

#### Engineering Priorities
1. **User Experience**
   - Reliability as paramount concern
   - Latency optimization
   
2. **Developer Speed**
   - Lean team requirement
   - Tools that enable rapid iteration
   - Move fast without breaking things

> "We're a lean team, and we need tools that are going to allow us to move fast."

#### Technology Choice
- **Codebase**: Written almost entirely in Effect
- **Rationale**: Type safety, composability, developer velocity

### The Speaker's Journey

#### Elliot Dauber's Background
- Recent graduate (June, prior to presentation)
- First major career step
- Limited TypeScript/Effect experience before joining
- Fresh perspective on learning Effect

> "I did not have much TypeScript or Effect experience before this, but it's been really fun to jump in, and I'm really glad that I'm using the tooling."

This perspective is valuable - showing Effect's approachability for newcomers to the ecosystem.

---

## Part 2: The Agent Architecture

### Understanding Agents

#### Basic Agent Loop

```
User Input → Plan/Reason → Choose Action → Execute → Feedback → Loop
```

The simplest agent model:
1. **Planning and Reasoning**: Analyze the task at hand
2. **Action Selection**: Choose appropriate action
3. **Execution**: Perform the selected action
4. **Feedback Loop**: Use results to inform next action
5. **Termination**: Eventually provide output to user

#### Typical Actions in Customer Support
- **Log Analysis**: Searching and analyzing system logs
- **Payment Operations**: Retrieving invoices, payment information
- **RAG Operations**:
  - Querying vector embeddings
  - Using metadata filters
  - Traditional retrieval-augmented generation
- **User Communication**:
  - Providing information
  - Asking clarification questions

### The Action Primitive

#### Core Structure
Every action in the system has:
1. **Name**: Identifier for the action
2. **Description**: How the LLM understands what the action does
3. **Parameters**: Schema-encoded inputs
4. **Handler**: Effect-based execution logic

#### Code Example: Basic Action

**Structure:**

```typescript
interface Action<E, R> {
  readonly name: string;
  readonly description: string;
  readonly Params: S.Schema<Record<string, string>>;
  readonly handle: (
    args: string,
  ) => Effect.Effect<ActionReturn, ParseError | E, R>;
}
```

**Implementation Example:**

```typescript
// Search logs action
const searchLogsAction = createAction({
  name: "SearchLogs",
  description: "Searches the user's logs for a given log query",
  Params: S.Struct({
    query: S.String,
  }),
  execute: (request) => SearchLogs(request.query),
});

// Types get propaggated - we get error and log service
const searchLogsAction: Action<LogRetrievalError, LogsService>

```

```typescript
// Response action with done flag in action response
export const respondAction = createAction({
  name: "Respond",
  description: "Responds to the user once the necessary information has been gathered",
  Params: S.Struct({
    response: S.String,
  }),
  execute: (request) =>
    Effect.sync(() => ({
      done: true,
      result: request.response,
    })),
});
```

**Common Action examples:**

- **Data Retrieval**: Searching and analyzing logs, fetching payment information
- **RAG Operations**: Vector embedding queries, metadata filtering
- **User Communication**: Responding with information, asking clarification questions
- **System Integration**: API calls, database queries

#### Type Propagation
- **Error Channel**: Automatically propagated through Effect
- **Requirements**: Services like LogService tracked in type system
- **Success Channel**: Currently strings (simplified for presentation)

> "You can see the types get propagated here, just like we're used to in Effect."

#### Special Action: Response

```typescript
// Response action with termination signal
const respondAction = {
  name: "respond",
  description: "Send response to user",
  handler: (message) => ({
    content: message,
    done: true  // Signal to terminate agent loop
  })
}
```

The `done: true` flag indicates the agent should terminate and send the response to the user.

---

## Part 3: Managing Complexity with Sub-Agents

### The Scaling Problem

#### Challenge
- Actions can become increasingly complex
- Customers may require numerous capabilities
- Single agent becomes unwieldy with too many actions
- No control over customer requirements

> "We don't necessarily have control over the number of things that our customers want to be able to give their agents the capabilities to do."

### Sub-Agent Solution

#### Conceptual Model

> "You can think of as a team of people that might have different specialties."
**Design Rationale:**

- Manages complexity as action sets grow
- Enables specialization (e.g., logging specialist, payment specialist)
- Maintains type safety across delegation boundaries
- Recursive architecture allows arbitrary nesting

**Execution Flow:**

```
Main Agent → Plans Task → Invokes Subagent
    ↓
Subagent → Executes Specialized Actions → Returns Result
    ↓
Main Agent → Processes Result → Continues or Responds
```

**Benefits:**

- **Modularity**: Each subagent is self-contained
- **Reusability**: Subagents can be shared across different main agents
- **Maintainability**: Changes to specialized logic are isolated
- **Scalability**: Can handle growing complexity without main agent bloat

**Benefits:**
- **Logging Agent**: Specialized in log searching and analysis
- **Payment Agent**: Handles all payment-related operations
- **Support Ticket Agent**: Manages ticket operations

---

## Part 4: Deterministic Workflows

### The Problem with Pure Autonomy

> "Should we really leave all this up to chance?"

#### Challenges with Fully Autonomous Agents
- LLMs make mistakes in action selection
- Some workflows require specific sequences
- Customers need predictable behavior
- Critical operations need guarantees

> "Most likely, these systems aren't perfect. It's going to choose things wrong some of the time, and we want our customers to be able to control that."

### Introducing Workflows

#### Real-World Example: Subscription Cancellation

```
1. User requests cancellation, workflow is triggered 
2. Ask for cancellation reason (non-deterministic response)
3. Fetch subscription details from API (deterministic)
4. Conditional logic based on subscription duration
5. Attempt retention or process cancellation 
6. Confirm outcome to user
```

#### The Insight

> "This sounds a lot like code execution... if this was not a conversation with a user where the user's input is non-deterministic, it would basically just be code execution, right?"

The challenge: Combining deterministic execution with non-deterministic user input.

### Workflow Implementation

#### Workflow Structure

```typescript
interface Workflow<FlowE, FlowR> {
  readonly name: string;
  readonly description: string;
  readonly execute: () => Effect.Effect<
    ActionReturn,
    | ParseError
    | ChatCompletionsError
    | StructuredOutputParseError
    | FlowE,
    AgentStateService | ChatCompletionsService | FlowR
  >;
}
```

Cancel subscription example:

```typescript
export const cancelSubscriptionWorkflow = createWorkflow({
  name: "Cancel a subscription",
  description: "Cancels the user's subscription",
  flow: cancelSubscriptionFlow,
});
```

#### Unified Interface
- Returns same `ActionReturn` as regular actions
- Integrates seamlessly with agent decision-making
- Propagates all errors and requirements through Effect

---

## 5. The Flow DSL: Composable Deterministic Logic

### Design Philosophy

> "It's kind of a DSL for building these deterministic workflows with being able to handle non-deterministic input from users."

#### Core Concept
- Looks and feels like Effect pipes
- Uses Effect's piping mechanism
- Handles non-deterministic user input within deterministic flow

### Flow Interface

#### Basic Definition

```typescript
export interface Flow<E, R> {
  execute: (
    executionState: unknown
  ) => Effect.Effect<
    FlowIntermediateResult,
    E | ParseError,
    R | AgentStateService
  >;
}
```

#### Type Aliases for Clarity during this presentation:

```typescript
// an Effect that returns a flow
export type Flowrap<E, R> = Effect.Effect<Flow<E, R>>;
```

### Flow Primitives - How we compose flows?

#### 1. Lifting Actions into Flows

```typescript
// Converts an action into the flow ecosystem (takes action, return flow)
const first = <E, R>(
  step: Action<E, R>,
): FlowWrap<E, R>
```

#### 2. Sequential Composition

```typescript
// Takes an action and enables piping
const andThen =
  <E, R>(step: Action<E, R>) =>
  <EPrev, RPrev>(
    previousFlow: FlowWrap<EPrev, RPrev>,
  ): FlowWrap<E | EPrev, R | RPrev>
```

Now Flow becomes a DSL, which enable many other things, like:

#### 3. Conditional Execution

```typescript
const doIf =
  <ETrue, RTrue, EFalse, RFalse, EPrev, RPrev>(
    condition: string,
    {
      onTrue,
      onFalse,
    }: {
      onTrue: (
        flow: FlowWrap<EPrev, RPrev>,
      ) => FlowWrap<ETrue | EPrev, RTrue | RPrev>;
      onFalse: (
        flow: FlowWrap<EPrev, RPrev>,
      ) => FlowWrap<EFalse | EPrev, RFalse | RPrev>;
    },
  ) =>
  (
    previousFlow: FlowWrap<EPrev, RPrev>,
  ): FlowWrap
    ETrue | EFalse | EPrev,
    RTrue | RFalse | RPrev>
// Similar to Effect.if but for flows
```

#### 4. No-Op Utility

```typescript
const noOp = (flow: Flow) => flow
// Utility function for flow composition
```

### Cancel Subscription Flow Example

```typescript
const cancelSubscriptionFlow = pipe(
  Flow.first(askUserForCancellationReason),
  Flow.andThen(getSubscriptionDetails),

  Flow.doIf("The user has only been subscribed for one month", {
    onTrue: (flow) =>
      flow.pipe(
        Flow.andThen(offerOneMonthFree),
        Flow.doIf("The user says yes to a free month", {
          onTrue: Flow.andThen(addOneMonthFree),
          onFalse: Flow.noOp,
        }),
      ),
    onFalse: Flow.noOp,
  }),

  Flow.doIf("The user still wants to cancel", {
    onTrue: (flow) =>
      flow.pipe(
        Flow.andThen(cancelSubscription),
        Flow.andThen(emailUserAboutCancellation),
      ),
    onFalse: Flow.noOp,
  }),
);
```

#### Implementation details

> "There's a lot of kind of stuff happening behind the scenes in this flow module that allows it to eject and retry steps."

**Type Propagation:** The Flow DSL maintains complete type safety by propagating:

- Error types from all composed actions
- Requirement types (dependencies) through the pipeline
- Return types maintaining the unified ActionReturn interface

**State Management:**

- Flows can eject and retry steps
- State is maintained internally between flow steps
- LLM integration points for handling non-deterministic input

### Benefits and Design Achievements

#### 1. Modularity

> "We can create new flow utilities... Flow.all or something, very similar to Effect, where we're able to just execute a bunch of steps in parallel."

- Self-contained logic in each function
- No central executor managing all flow types
- No graph management complexity
- Each utility manages its own behavior

#### 2. Type Safety

> "It's also type safe, just like the rest of Effect."

- Full type propagation through flows
- Errors tracked at compile time
- Requirements visible in types
- Combines with Effect's type system seamlessly

#### 3. Developer Experience

> "This allows us to basically just create these things very easily as developers and allow our users to create them."

- Familiar pipe syntax
- Composable building blocks
- Clear mental model
- Easy to extend

---

## Part 6: Unified System Architecture

### Bringing It All Together

#### Complete Agent Definition

```typescript
export interface Agent
  AgentE, AgentR
> {
  readonly name: string;
  readonly description: string;
  readonly execute: (options: {
    maxLoops?: number;
  }) => Effect.Effect
    // success:
    ActionReturn,
    // failure, parsed from
    // Actions, Workflows, Subagents
    | ParseError
    | AgentE
    // requirements, parsed from
    // Actions, Workflows, Subagents
    | AgentStateService
    | AgentR
  >;
}
```

```typescript
const agent = createAgent({
  name: 'Support Agent',
  description:
    'An agent that can help customers with their support issues',
  actions: [askQuestionAction, getPaymentsAction],
  workflows: [cancelSubscriptionWorkflow],
  agents: [logsAgent],
});

const { result } = yield* agent.execute({
  maxLoops: 10,
});
```

```typescript
const agent: Agent
  LogRetrievalError | FreeTrialError |
  SubscriptionApiError,
  FLogsService | FreeTrialApi | SubscriptionApi
>
```

```typescript
const logsAgent = createAgent({
  name: 'Logs Agent',
  description:
    'An agent that can search through customer logs to debug issues',
  actions: [searchLogsAction, respondToUserAction],
  workflows: [],
  agents: [],
});

```

```typescript
const logsAgent: Agent<LogRetrievalError, LogsService>
```

#### Type Propagation Throughout

> "All of these types get propagated through. And so in this naturally recursive ecosystem, we can actually get all of these types propagated."

Benefits:
- Know exactly what errors can occur
- See all service requirements
- Understand possible outcomes
- No "jumbled mess" of unknown possibilities

#### Unified Decision Interface
- Agents, sub-agents, workflows all present same interface
- LLM chooses between actions, sub-agents, and workflows uniformly
- State handled internally and consistently

### The Recursive Nature

> "These are all the same, and this is an inherently recursive system."

- Agents can invoke sub-agents
- Sub-agents can have their own sub-agents
- Workflows can be triggered at any level
- Uniform interface throughout entire tree

---

## Part 7: Key Insights and Lessons Learned

### On LLM System Complexity

> "These LLM systems are very inherently complex and non-deterministic."

#### The Prototype Trap

> "It can be easy to build these simple cases. It's pretty fast to get a prototype of these agents up and running."

The challenge emerges at scale:
- 10-20 customer requirements
- Complex interaction patterns
- Need for reliability guarantees

#### The Effect Solution

> "It's really nice with Effect to be able to break these things down and provide ways for your customers to be sure that what they want is going to happen, is actually going to happen."

### Development Philosophy

#### Confidence in Tools

> "We're very confident that we're building the right tools."

Reasons for confidence:
1. **DSL Creation**: Easy to build domain-specific languages
2. **Primitive Reuse**: Leverage Effect's existing primitives
3. **System Integration**: Code fits naturally within larger system
4. **Type Safety**: Catch errors at compile time

#### The Power of Effect Primitives

> "Use the primitives that Effect has already created, to write code that really just fits very well within the rest of our system."

### Future Work

> "We still have a lot to do."

Areas for expansion:
- More flow utilities (parallel execution, etc.)
- Enhanced error handling
- Customer-facing workflow builders
- Performance optimizations

---

## Technical Deep Dive: Implementation Details

### State Management

#### Agent State Dependency
- Flows depend on `AgentState` service
- Tracks conversation history
- Maintains execution context
- Enables step retry and ejection

### Error Handling Strategy

#### Type-Safe Error Propagation
- All errors tracked in type system
- Composite errors from sub-agents
- Workflow-specific error types
- Unified error handling at top level

### Service Architecture

#### Example Services

```typescript
class LogService extends Effect.Service<LogService>()("LogService", {
  // Service implementation
})

class PaymentService extends Effect.Service<PaymentService>()("PaymentService", {
  // Service implementation
})
```

### Schema Integration

#### Parameter Validation
- All action parameters defined with Schema
- Automatic validation before handler execution
- Type inference from schemas
- Error messages for invalid inputs

---

## Practical Applications

### Customer Support Scenarios

#### Log Investigation
1. User reports issue
2. Agent searches relevant logs
3. Sub-agent analyzes patterns
4. Main agent synthesizes findings
5. Provides resolution or escalates

#### Payment Disputes
1. Workflow triggered by dispute keyword
2. Fetch payment records deterministically
3. Analyze dispute validity
4. Follow predetermined resolution path
5. Ensure compliance with policies

#### Technical Troubleshooting
1. Main agent identifies technical issue
2. Delegates to specialized sub-agent
3. Sub-agent runs diagnostic workflows
4. Returns findings to main agent
5. Main agent communicates solution

### Customization Capabilities

#### For Markprompt's Customers
- Define custom actions
- Create specialized sub-agents
- Build deterministic workflows
- Maintain control over critical paths

---

## Key Takeaways

### 1. Balance Determinism and Non-Determinism
The framework successfully combines:
- **Deterministic workflows** for critical paths
- **Autonomous agents** for flexible problem-solving
- **Type safety** throughout entire system

### 2. Composition Over Configuration
Rather than complex configuration:
- Build complex behaviors from simple primitives
- Use familiar patterns (pipes, effects)
- Maintain type safety while composing

### 3. Developer Experience Matters
For a lean team, the framework provides:
- **Fast iteration**: Quick to build new capabilities
- **Confidence**: Type system catches errors early
- **Maintainability**: Clear structure and patterns

### 4. Effect as Foundation
Effect provides crucial capabilities:
- **Type propagation**: Know what can happen
- **Service pattern**: Clean dependency injection
- **Composability**: Build DSLs naturally
- **Error handling**: Robust error management

### 5. Recursive Architecture Works
The recursive nature provides:
- **Simplicity**: Same patterns at every level
- **Scalability**: Add depth without complexity
- **Flexibility**: Mix and match components

---

### The Effect Advantage

> "I'm really glad that I'm using the tooling."

Effect enabled Markprompt to:
- Build complex systems with confidence
- Move fast without sacrificing safety
- Create intuitive DSLs for their domain
- Maintain a clean, composable architecture

### Looking Forward
The framework demonstrates that LLM systems don't have to be:
- Unpredictable black boxes
- Difficult to test and debug
- Impossible to guarantee behavior
- Complex to extend and maintain

Instead, with Effect, they can be:
- **Type-safe** and predictable
- **Composable** and modular
- **Testable** and debuggable
- **Powerful** yet manageable

### Final Thought
The presentation showcases how Effect's primitives and patterns naturally extend to new domains like LLM systems, providing the same benefits of type safety, composability, and developer experience that Effect users have come to expect in more traditional domains.

## Future Directions and Considerations

### Potential Enhancements

1. **Flow Primitives:**
	- `Flow.all` for parallel execution
	- `Flow.race` for timeout handling
	- `Flow.retry` with backoff strategies
	- `Flow.cache` for expensive operations

2. **Observability:**
	- Detailed execution traces
	- Performance metrics per action/workflow
	- Decision reasoning capture
	- Cost tracking for LLM operations

3. **Testing Framework:**
	- Mock LLM responses
	- Workflow simulation
	- Property-based testing for flows
	- Integration test harnesses

### Scaling Considerations

As the system grows:

- Action discovery and organization
- Workflow versioning and migration
- Performance optimization for deep agent hierarchies
- Customer-specific customization patterns

---

## Resources and Contact

- **Speaker**: Elliot Dauber
- **Company**: Markprompt (San Francisco)
- **Previous Talk**: San Francisco Effect Meetup (continuation of topics)
- **Contact**: Available for discussions on LLM systems and Effect

The framework represents a significant advancement in making LLM systems production-ready, customer-configurable, and developer-friendly, all while maintaining the type safety and composability that Effect provides.
