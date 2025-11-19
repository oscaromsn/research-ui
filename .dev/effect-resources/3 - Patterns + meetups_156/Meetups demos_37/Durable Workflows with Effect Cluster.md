---
modified: 2025-09-21T23:19:40-03:00
---
# Durable Workflows with Effect Cluster
## By Mattia Manzati - Effect Days 2024

### Executive Summary
Mattia Manzati presents Effect Cluster Workflows, a TypeScript-based solution for building resilient distributed systems that can survive server crashes, network failures, and other common distributed computing challenges. Drawing from the 1987 Sagas paper and modern distributed systems principles, the framework enables developers to write seemingly normal Effect code that automatically handles retries, compensation, and state persistence across process restarts. The presentation demonstrates how to decompose complex workflows into idempotent activities, maintain deterministic execution, and distribute work across multiple processes using sharding patterns.

---

## Part 1: The Problem Space

### The Deceptively Simple Workflow

Consider a typical e-commerce order processing workflow:
1. Get total amount from API
2. Charge credit card
3. Create shipping tracking code
4. Send confirmation email

```typescript
// The happy path looks simple
const processOrder = Effect.gen(function* () {
  const amount = yield* getTotalAmount(orderId)
  yield* chargeCreditCard(amount)
  const trackingId = yield* createShippingCode()
  yield* sendConfirmationEmail(trackingId)
})
```

This code works perfectly... until it doesn't.

### The Cascade of Failures

#### Scenario 1: Mid-Process Failure
- Get amount: ✅
- Charge card: ✅
- Create tracking: ❌ (API quota exceeded)
- Result: Customer charged but no shipment initiated

Key questions arise:
- Is the transaction complete?
- Will the customer understand what happened?
- How do we recover from this state?

#### Scenario 2: The Naive Retry Problem
Adding a simple retry seems logical:

```typescript
processOrder.pipe(
  Effect.retry({ 
    when: isTemporaryError 
  })
)
```

But this creates a worse problem:
1. First attempt: Amount retrieved → Card charged → Tracking fails
2. Retry: Amount retrieved → Card charged AGAIN → ...
3. Customer pays multiple times for one order

> "The customer surely will be more than happy to pay however you want in order to receive just one good, right?"

### Beyond Application-Level Failures

#### The Server Restart Problem
What happens when:
- Server crashes mid-workflow?
- Deployment requires restart?
- Process runs out of memory?

Result: Complete loss of workflow state, leaving the system in an inconsistent state.

#### The Transaction Boundary Problem
Traditional solution: "Just wrap it in a transaction!"

Reality: **We don't have magic begin/commit transaction functions for distributed operations**

Why? We're interacting with:
- External REST APIs
- Email services
- Payment gateways
- File systems
- Multiple databases

These systems:
- Receive writes independently
- Don't participate in ACID transactions
- Can't be rolled back traditionally

### Distributed Systems Are Everywhere

The problem isn't limited to microservices:

#### Example 1: Contact Form
- Save contact to database
- Send notification email
- How to ensure both happen atomically?

#### Example 2: Local-First Product Catalog
- Store product data in SQLite
- Save product image to filesystem
- How to ensure consistent deletion?

> "Distributed systems are everywhere, and that means that we need distributed workflows in order to orchestrate distributed systems."

---

## Part 2: The Theoretical Foundation - Sagas

### Historical Context (1987)

The Sagas paper addressed a different but related problem:
- Long-running database transactions locked resources for minutes
- Smaller transactions couldn't proceed
- System throughput suffered

### The Saga Pattern

Core insight: Split long transactions into smaller, independent transactions connected by messaging.

```
Traditional Transaction:
[-------------- Single Long Transaction --------------]

Saga Pattern:
[Txn1] → [Txn2] → [Txn3] → [Txn4] → [Txn5]
   ↓        ↓        ↓        ↓        ↓
  Log     Log      Log      Log      Log
```

Key requirements:
1. **Durable Log**: Track execution state across failures
2. **Compensation**: Ability to undo completed steps
3. **Determinism**: Predictable replay from logs

---

## Part 3: Effect Cluster Workflows Architecture

### Building Block 1: Activities

Activities are the atomic units of work in a workflow:

```typescript
const getTotalAmount = (id: string) =>
  Activity.make(
    `get-amount-due-${id}`, // identifier
    Schema.number, // success schema
    Schema.struct({ code: Schema.number,
                    message: Schema.string }) // error schema
  )(
    pipe(
      Http.request.get(`/get-total-amount/${id}`),
      Http.client.fetchOk(),
      Effect.andThen((response) => response.json),
      Effect.mapError(() => ({
        code: 500,
        message: `API Fetch error`
      }))
    )
  )
```

Key characteristics:
- Unique identifier within workflow
- Schema-defined success/error types (for persistence)
- Can perform any side effect
- Must be **idempotent**

### Building Block 2: Workflow Request

Defines how to start a workflow (the request):

```typescript
class ProcessPaymentRequest extends
  Schema.TaggedRequest<ProcessPaymentRequest>()(
    "ProcessPaymentRequest", // tag
    Schema.never, // failure
    Schema.boolean, // success
    {
      orderId: Schema.string,
      cardNumber: Schema.string,
      email: Schema.string,
      deliveryAddress: Schema.string
    }
  ) {
}
```

- Is started by a Request
- Requires schemas for success and failure
- Has a payload of information

### Building Block 3: Workflow Definition

```typescript
const processPaymentWorkflow = Workflow.make(
  ProcessPaymentRequest,
  (_) => `ProcessPayment@${_.orderId}`,
  ({ cardNumber, deliveryAddress, email, orderId }) =>
    Effect.gen(function*($) {
      const totalAmount = yield* $(getTotalAmount(orderId))
      yield* $(chargeCreditCard(cardNumber, totalAmount))
      const trackingId = yield* $(createShippingTrackingCode(deliveryAddress))
      yield* $(sendOrderToShipping(orderId, trackingId))
      yield* $(sendConfirmationEmail(email, orderId, trackingId))
    })
)
```

- Coordinator of activities
- Durable execution
- Requires deterministic code

### Critical Constraints

#### Workflow Determinism
Workflows MUST be deterministic:
- Same input → Same output, always
- No direct time access
- No direct filesystem/database reads
- No random number generation

Why? On restart, activity calls are replaced with logged results.

```typescript
const processPaymentWorkflow = Workflow.make(
  ProcessPaymentRequest,
  (_) => "ProcessPayment@" + _.orderId,
  ({ cardNumber, deliveryAddress, email, orderId }) =>
    Effect.gen(function*($) {
      const totalAmount = yield* $(Effect.succeed(42.1) /* getTotalAmount(orderId) */)
      yield* $(Effect.unit /* chargeCreditCard(cardNumber, totalAmount) */)
      const trackingId = yield* $(createShippingTrackingCode(deliveryAddress))
      yield* $(sendOrderToShipping(orderId, trackingId))
      yield* $(sendConfirmationEmail(email, orderId, trackingId))
    })
)
```

#### Activity Idempotency
Activities MUST be idempotent:
- First execution: Changes state
- Subsequent executions: Return same result, no state change

### The Persistence Layer: Workflow engine

```typescript
const main = Effect.gen(function*($) {
  const workflows = Workflow.union(processPaymentWorkflow, requestRefundWorkflow)
  const engine = yield* $(WorkflowEngine.makeScoped(workflows))
  yield* $(
    engine.sendDiscard(
      new ProcessPaymentRequest({
        orderId: "order-1",
        cardNumber: "my-card",
        deliveryAddress: "My address, 5, Italy",
        email: "my@email.com"
      })
    )
  )
})

runMain(
  pipe(
    main,
    Effect.provide(DurableExecutionJournalPostgres.DurableExecutionJournalPostgres)
  )
)
```

Persistence is pluggable:
- Postgres for servers
- SQLite for local-first apps
- IndexedDB for browsers

---

## Part 4: Handling the Hard Problems

### The Idempotency Challenge

#### The Payment Double-Charge Scenario

```
1. Workflow calls payment API
2. Payment processes successfully
3. Network drops before response
4. Workflow sees failure, retries
5. Customer charged twice
```

#### Solution: Idempotency Keys
Effect Cluster provides deterministic persistence IDs:

```typescript
const chargeCreditCard = 
  (cardNumber: string, amountDue: number) =>
    pipe(
      Activity.persistenceId,
      Effect.flatMap(
        (persistenceId) => callPaymentGateway(
          persistenceId,
          cardNumber,
          amountDue
        )
      ),
      Activity.make(
        "charge-credit-card",
        Schema.void,
        Schema.never
      )
    )
```

### Yielding workflow execution

```typescript
const getTotalAmount = (id: string) =>
  pipe(
    Http.request.get(`/get-total-amount/${id}`),
    pipe(
      Http.client.fetchOk(),
      Effect.andThen((response) => response.json),
      Effect.retry(
        Schedule.exponential(1000).pipe(
          Schedule.compose(Schedule.recurs(32))
        )
      ),
    ),
    Effect.catchAllCause(() => pipe(
      Effect.logError("Something is wrong with the OrderAPI right now"),
      Effect.zipRight(Workflow.yieldExecution)
    )),
    Activity.make(`get-amount-due-${id}`, Schema.number, Schema.never)
  )
```

### Fixing Activities in Production

Because activities are idempotent:
1. Stop workflow engine
2. Fix activity implementation
3. Restart engine
4. Workflow continues with new implementation

```typescript
// Before fix
const getAPIKey = () => "secret_secret"  // Bug: duplicated

// After fix  
const getAPIKey = () => "secret_key"     // Fixed

// Workflow continues seamlessly
```

### Workflow Versioning

Determinism allows limited workflow updates:

#### Safe Changes
- Adding activities at the end
- Conditional logic based on version

```typescript
const processPaymentWorkflow = Workflow.make(
  ProcessPaymentRequest,
  (_) => `ProcessPayment@${_.orderId}`,
  ({ cardNumber, deliveryAddress, email, orderId }) =>
    Effect.gen(function*($) {
      const version = yield* $(getCurrentVersion(2))
      // For already running WFs, will resolve with previous value (1)
      // ...
      if(version >= 2){
        yield* $(checkTrustedCardNumber(cardNumber))
      }
      yield* $(chargeCreditCard(cardNumber, totalAmount))
      // ...
    })
)

const getCurrentVersion = (definitionVersion: number) => pipe(
  Effect.succeed(definitionVersion),
  Activity.make("get-current-version", Schema.number, Schema.void)
)
```

### Compensation and Rollback

Using standard Effect semantics for compensation:

```typescript
const processPaymentWorkflow = Workflow.make(
  ProcessPaymentRequest,
  (_) => `ProcessPayment@${_.orderId}`,
  ({ cardNumber, deliveryAddress, email, orderId }) =>
    pipe(
      getTotalAmount(orderId),
      Effect.flatMap(totalAmount => pipe(
        chargeCreditCard(cardNumber, totalAmount),
        Effect.flatMap(() => createShippingTrackingCode(deliveryAddress)),
        Effect.tap(trackingId => sendOrderToShipping(orderId, trackingId)),
        Effect.tap(trackingId => sendConfirmationEmail(email, orderId, trackingId)),
        Effect.catchTag("OutOfStockError", () => refundCreditCard(cardNumber, totalAmount))
      ))
    )
)
```

All Effect APIs work durably:
- Error handling persists across restarts
- Compensation actions are guaranteed to run

---

## Part 5: Scaling with Cluster Sharding

### The Multi-Process Problem

Running multiple workflow engines introduces coordination issues:
- How to ensure only one process handles each workflow?
- How to avoid global locks?
- How to handle process failures?

### The Restaurant Analogy

Manzati's brilliant real-world example:

**Scenario**: Restaurant with 6 tables, 1 waiter
- **Problem**: Waiter too slow, add second waiter
- **Challenge**: Avoid duplicate orders without constant coordination

**Solution**: Pre-assign responsibilities
- Waiter 1: Tables 1-3
- Waiter 2: Tables 4-6

Benefits:
- No coordination needed
- Clear ownership
- Easy reassignment on failure

### Effect Cluster Sharding

Implements the same pattern for distributed processes:

```typescript
import * as RecipientType from "@effect/cluster/RecipientType"
import * as Schema from "@effect/schema/Schema"

export class Increment extends Schema.TaggedClass<Increment>()("Increment", {
  messageId: Schema.string
}) {}

export class Decrement extends Schema.TaggedClass<Decrement>()("Decrement", {
  messageId: Schema.string
}) {}

export class GetCurrent extends 
  Schema.TaggedRequest<GetCurrent>()("GetCurrent", Schema.never, Schema.number, {
    messageId: Schema.string
}) {}

export const CounterMsg = Schema.union(Increment, Decrement, GetCurrent)
export type CounterMsg = Schema.Schema.To<typeof CounterMsg>

export const CounterEntity = RecipientType.makeEntityType("Counter", CounterMsg, (_) => _.messageId)
```

### Automatic Rebalancing

When processes join/leave:
1. Shard manager detects change
2. Reassigns entity responsibilities
3. Ensures exactly-once processing
4. No central point of failure

```typescript
Sharding.registerEntity(
  CounterEntity
)(
  RecipientBehaviour.fromFunctionEffectStateful(
    () => Effect.succeed(0),
    (_, message, stateRef) => {
      switch (message._tag) {
        case "Increment":
          return pipe(Ref.update(stateRef, (count) => count + 1), Effect.as(MessageState.Processed(Option.none())))
        case "Decrement":
          return pipe(Ref.update(stateRef, (count) => count - 1), Effect.as(MessageState.Processed(Option.none())))
        case "GetCurrent":
          return pipe(
            Ref.get(stateRef),
            Effect.exit,
            Effect.map((result) => MessageState.Processed(Option.some(result)))
          )
      }
    }
  )
)
```

---

## Part 7: Key Design Principles

### 1. Separation of Concerns
- **Workflows**: Deterministic coordination
- **Activities**: Side effects and external interactions
- **Engine**: State management and persistence

### 2. Failure Modes and Recovery
- **Temporary failures**: Infinite retry with backoff
- **Business failures**: Compensation and rollback
- **Infrastructure failures**: State recovery from logs

### 3. Observability and Debugging
- Every activity execution logged
- Workflow state inspectable
- Manual intervention possible

### 4. Platform Agnostic
Runs anywhere TypeScript runs:
- Node.js servers
- Browsers
- Electron apps
- Deno/Bun
- Edge workers

---

## Part 8: Production Considerations

### Monitoring and Operations

Key metrics to track:
- Activity retry counts
- Workflow completion times
- Compensation trigger rates
- Shard rebalancing frequency

### Testing Strategies

1. **Unit test activities**: Ensure idempotency
2. **Integration test workflows**: Verify compensation
3. **Chaos test infrastructure**: Simulate failures

### Performance Optimization

- Batch activity executions when possible
- Use appropriate persistence backend
- Monitor shard distribution
- Implement activity result caching

---

## Part 9: Current Status and Future

### Package Status (as of Effect Days 2024)
- **State**: Experimental
- **Release**: Publishing to NPM "tomorrow"
- **Components**:
  - Effect Cluster: Sharding and distribution
  - Cluster Workflows: Durable execution

### The Vision

> "I invite you to try to use them in order to build your application in a more resilient way, in a more durable way."

Effect Cluster Workflows represents a paradigm shift:
- From hoping things work to guaranteeing they work
- From complex retry logic to declarative workflows
- From centralized to distributed without complexity

---

## Conclusion

Effect Cluster Workflows solves fundamental distributed systems problems that every developer faces, whether building microservices or local-first applications. By combining:

1. **Deterministic workflows** for predictable execution
2. **Idempotent activities** for safe retries
3. **Durable logging** for crash recovery
4. **Compensation actions** for business logic rollback
5. **Cluster sharding** for horizontal scaling

The framework enables developers to write distributed systems with the same confidence as single-process applications, using familiar Effect semantics throughout.

The key insight: Distributed systems challenges are universal, from e-commerce platforms to local-first apps. Effect Cluster Workflows provides a TypeScript-native, platform-agnostic solution that runs anywhere JavaScript runs, making robust distributed systems accessible to all developers.

### Key Takeaways

1. **Every system is distributed** - Even "simple" apps coordinate multiple systems
2. **Determinism + Idempotency = Reliability** - These constraints enable recovery
3. **Effect semantics scale** - The same mental model works from simple to complex
4. **Platform independence matters** - Solutions must work everywhere TypeScript runs

The framework promises to transform how we build resilient applications, moving from hoping our error handling is sufficient to knowing our workflows will complete or compensate correctly, regardless of failures.
