---
modified: 2025-09-21T23:57:42-03:00
---
# Effect Cluster: Distributed Systems for TypeScript
## By Tim Smart - Effect Days 2025

### Executive Summary
Tim Smart, founding engineer at Effectful, presents Effect Cluster - a framework that brings Actor model and distributed systems capabilities to TypeScript. Drawing inspiration from Elixir's OTP and Scala's Shardcake, Effect Cluster enables developers to build distributed systems using simple entity-based building blocks while abstracting away the complexities of networking, message serialization, and work distribution. The framework introduces persistent messaging with deduplication, scheduled message delivery, and automatic shard distribution across clusters, demonstrated through a live 100-node distributed battleships game.

---

## Part 1: The Evolution of TypeScript

### TypeScript Growing Up

Tim opens with a profound observation about the TypeScript ecosystem's maturation:

> "TypeScript growing up... over the past few years, we've seen an evolution in the TypeScript ecosystem."

#### The Historical Context
Tim's personal journey mirrors TypeScript's evolution:
- Started with Node.js v0.1 with Ryan Dahl
- Left JavaScript ecosystem due to lack of type safety
- Moved to Ruby and Elixir for better distributed systems support
- Returned with TypeScript's maturation

#### The Paradigm Shift
From TypeScript as an afterthought to TypeScript-first development:

**Old Approach:**
- JavaScript with TypeScript "sprinkled on top"
- Constant struggles with types
- Limited framework support

**New Era:**
- TypeScript-first software design
- Frameworks leveraging the type system
- Enterprise-grade production capabilities

### The Elixir Inspiration

> "I really fell in love with Elixir, because of how it models concurrency and distributed systems."

Key concepts borrowed from Elixir/Erlang:
1. **Actor Model**: Isolated units of computation
2. **Gen Server**: Building blocks for business logic
3. **BEAM Cluster**: Treating multiple machines as one
4. **Location Transparency**: Reference by ID, not location

### Effect as TypeScript's Answer

Effect differentiates itself by being truly TypeScript-first:
- Errors as values in the type system
- Dependency injection tracked in types
- Full leverage of TypeScript's capabilities
- Production-ready abstractions

> "Effect fully leverages TypeScript to make your development easier and more production ready."

---

## Part 2: Core Concepts of Effect Cluster

### The Single Writer Principle

The foundational principle underlying Effect Cluster:

> "Write should go to one place. Otherwise, you introduce lots of issues like contention."

This principle ensures:
- No race conditions
- No data conflicts
- Simplified reasoning about state
- Predictable system behavior

### Entities: The Building Blocks

Entities in Effect Cluster are:
- Simple units of business logic
- Analogous to Elixir's Gen Servers
- Isolated and message-driven
- Location-agnostic

### Why Use Effect Cluster?

#### The Problems It Solves

Make it easier to write distributed system

**Traditional Distributed Systems Challenges:**

```
- What node is this pod on?
- What is its IP address?
- What is its port?
- How do I serialize messages?
- How do I handle network failures?
```

**With Effect Cluster:**

```
Just think about:
- Your business logic
- Your entities
- Your domain model
```

#### Key Benefits

1. **Schema-Driven Development**: Heavy reliance on Effect Schema for domain modeling
2. **Automatic Serialization**: Messages automatically serialized based on schema
3. **Location Transparency**: Local or remote delivery handled automatically
4. **Automatic Distribution**: Work evenly distributed across cluster

---

## Part 3: Architecture Deep Dive

### System Components

#### Runners
- Individual machines in the cluster
- Can scale up or down dynamically
- Each assigned multiple shards

#### Shards
- Fixed units of distribution (e.g., 300 shards)
- Evenly distributed across all runners
- Example: 300 shards, 100 runners = 3 shards per runner

#### Entities
- Allocated to shards
- Live on specific runners via shard assignment
- Addressable by ID regardless of location

#### Shard Manager
- Single component (currently)
- Assigns shards to runners
- Can operate with downtime without affecting cluster

> "If your shard manager goes down, the cluster will continue to operate."

### The Shardcake Heritage

Effect Cluster is heavily inspired by Shardcake (Scala/ZIO library) but extends it with new capabilities.

---

## Part 4: The Rewrite and New Features

### Persistence in the Messaging Layer

#### The Problem with Traditional Messaging
In systems like Shardcake:
- Messages sent over network only
- Server down = message lost
- No retry mechanism built-in

#### Effect Cluster's Solution

```typescript
// Annotate entity for persistence
@annotate(ClusterSchema.persisted)
class BattleshipEntity {
  // All messages persisted
}

// Or selective persistence
shoot: ClusterSchema.notPersisted
shootWithDelay: ClusterSchema.persisted
```

Benefits:
1. **Resilience**: Messages delivered even after crashes
2. **Deduplication**: Automatic detection of duplicate messages
3. **Resumption**: Clients can resume where they left off

### Message Deduplication

Using the `PrimaryKey` interface:

```typescript
import { ClusterSchema, DeliverAt, Entity } from "@effect/cluster"
import { DateTime, PrimaryKey, Schema } from "@effect"
import { Rpc } from "@effect/rpc"

export class DelayedBullet
extends Schema.Class<DelayedBullet>("DelayedBullet")({
  delay: Schema.Number,
  target: Schema.Int,
})
implements PrimaryKey.PrimaryKey {
  [PrimaryKey.symbol]() {
    return String(this.target)
  }
}

export class DeliverAtBullet
extends Schema.Class<DeliverAtBullet>("DeliverAtBullet")({
  delay: Schema.Number,
  target: Schema.Int,
})
implements PrimaryKey.PrimaryKey, DeliverAt.DeliverAt {
  [PrimaryKey.symbol]() {
    return String(this.target)
  }
  [DeliverAt.symbol]() {
    return DateTime.unsafeNow().pipe(DateTime.add({ millis: this.delay }))
  }
}
```

### Scheduled Message Delivery

Using the `DeliverAt` interface:

```typescript
class FutureShot implements DeliverAt {
  deliverAt: Date // Message delivered at this time
  
  // Can schedule months in advance
}
```

> "You could say, send this message six months to the future."

### The New Effect RPC

Complete rewrite with:
- **Modular Design**: Swap transport (HTTP/WebSockets/TCP)
- **Pluggable Serialization**: JSON, MessagePack, etc.
- **Powers All Communication**: Entire cluster uses RPC

---

## Part 5: API Design and Implementation

### Entity Definition

```typescript
// Define procedures for an entity
export const Battleship = Entity.make("Battleship", {
  Rpc.make("Shoot", {
    payload: { target: Schema.Int },
  }),
  
  Rpc.make("ShootWithDelay", {
    payload: DelayedBullet,
  }),
  
  Rpc.make("ShootAt", {
    payload: DeliverAtBullet,
  }),
}).annotateRpcs(ClusterSchedule.Persisted, true)
```

### Implementing Procedures

```typescript
import { SqlLayer } from "../Sql"
import { Battleship } from "./schema"

const BattleshipLive = Battleship.toLayer({
  Effect.gen(function* () {
    const address = yield* Entity.CurrentAddress
    
    return {
      Shoot: Effect.fnUntraced((
        { functions (_) {
          yield* Effect.log("Boom!")
        },
        [effect, { payload }] =>
          Effect.annotateLogs(effect, {
            address,
            target: payload.target,
          }),
      }),
      
      ShootWithDelay: Effect.fnUntraced((
        { functions (envelope) {
          yield* Effect.log("ShootWithDelay received")
          yield* Effect.sleep(envelope.payload.delay)
          yield* Effect.log("ShootWithDelay done")
        },
        [effect, { payload }] =>
          Effect.annotateLogs(effect, {
            address,
            target: payload.target,
          }),
      }),
```

### Singletons: Cluster-Wide Unique Services

```typescript
// The CronShip - celebrates Sebastian's Cron module
const CronShip = Singleton.make({
  "CronShip",
  Effect.gen(function* () {
    yield* Effect.log("The CronShip is sailing!")
    yield* Effect.addFinalizer(() => Effect.log("The CronShip is sinking!"))
    
    yield* Effect.log("The CronShip is cronning!").pipe(
      Effect.repeat(Schedule.cron("* * * * *")),
    )
  })
})

const Entities = Layer.mergeAll(BattleshipLive, CronShip)

const RunnerLive = NodeClusterRunnerSocket.layer({ storage: "sql" }).pipe(
  Layer.provide(SqlLayer),
)

Entities.pipe(Layer.provide(RunnerLive), Layer.launch, NodeRuntime.runMain)
```

> "I was paid to say that by Sebastian."

Key singleton characteristics:
- Only runs in one place cluster-wide
- Automatically migrates on node failure
- Perfect for scheduled tasks, cleanup, monitoring

---

## Part 6: Live Demo - Distributed Battleships

### Demo Setup

Tim demonstrates with:
- **100-node cluster** on Kubernetes
- PostgreSQL for message persistence
- Multiple client types
- Real-time shard redistribution

### Demo Components

1. **Infrastructure**:
   - PostgreSQL database
   - Shard Manager
   - 100 Runner pods

2. **Client Types**:
   - **Shooter**: Basic network-only messages
   - **Slow Shooter**: Persisted messages
   - **Speed Shooter**: High-volume testing

### Key Demonstrations

#### Even Distribution
When firing thousands of messages:

> "All of those messages will be evenly distributed over the cluster... we can see the messages evenly being distributed over all of your runners."

#### Persistence and Recovery
- Messages persisted to database
- Clients can reconnect and resume
- Deduplication prevents duplicate processing

#### Singleton Migration
- CronShip runs on exactly one node
- Automatically migrates when pods scale

### Demo Insights

The demo revealed both the power and current limitations:
- Successfully demonstrated even distribution
- Showed singleton operation
- Some deduplication issues during live demo
- Highlighted the alpha nature of the framework

---

## Part 7: Future Roadmap

### Durable Workflows

Building on Mattia's work from the previous year:

> "Using these building blocks, this persistence we've added to messaging, we wanted to then do durable workflows, which you can think of as durable effects."

Features:
- Optional Effect Cluster backend
- Swappable workflow backends
- Integration with existing Effect ecosystem

### Browser Support

Ambitious goal for client-side clustering:
- Distribute work using Web Workers
- Single-page applications with clustering
- Local-first distributed computing

### Runner Parallelism

Addressing Node.js limitations:

> "Node.js is single-threaded. So we need to look at a way to make sure if your machine has 4 CPU cores, that each one of those cores is being used."

### Enhanced Shard Manager Resilience

Moving from single point to distributed:
- Multiple shard managers with leader election
- Automatic failover
- Increased system resilience

### API Gateway Proxy

External access pattern:
- Gateway proxy for external clients
- Similar API to internal clients
- No direct cluster connection required

---

## Part 8: Current Status and Adoption

### Release Status

> "When can you use it? Now? I just need to merge a PR."

Current state:
- **Availability**: Immediate (pending PR)
- **Status**: Very alpha
- **Production**: Not recommended yet
- **Purpose**: Feedback and experimentation

### Important Caveats

Tim's honest assessment:

> "There will likely be bugs, as you probably just saw... please don't run your production workloads on it yet."

### Call for Feedback

The team is actively seeking:
- Bug reports
- API feedback
- Use case validation
- Performance testing

---

## Part 9: Architectural Patterns and Best Practices

### Entity Design Patterns

#### Stateful Entities
Maintain state across messages:

```typescript
class CounterEntity {
  state = 0
  
  increment = () => Effect.sync(() => this.state++)
  decrement = () => Effect.sync(() => this.state--)
  get = () => Effect.succeed(this.state)
}
```

#### Persistent vs Volatile Messages
Choose based on requirements:
- **Persistent**: Critical business operations
- **Volatile**: Real-time updates, metrics

#### Primary Keys for Idempotency
Prevent duplicate processing:
- Payment transactions
- Order processing
- State mutations

### Cluster Design Patterns

#### Shard Count Selection
Fixed number of shards considerations:
- Too few: Limited parallelism
- Too many: Overhead
- Recommendation: 10-100x expected max nodes

#### Client Types
- **Full Runners**: Process entities
- **Client-Only**: Send messages without processing
- **Gateway**: External API access

---

## Part 10: Comparison with Other Systems

### vs. Traditional Microservices
**Traditional**:
- Service discovery complexity
- Manual load balancing
- Network configuration

**Effect Cluster**:
- Automatic discovery
- Built-in load balancing
- Zero network configuration

### vs. Message Queues (RabbitMQ, Kafka)
**Message Queues**:
- Separate infrastructure
- Manual consumer management
- Complex deployment

**Effect Cluster**:
- Integrated with application
- Automatic consumer distribution
- Simplified deployment

### vs. Actor Systems (Akka, Orleans)
**Similar**:
- Actor/Entity model
- Location transparency
- Automatic distribution

**Different**:
- TypeScript-native
- Effect integration
- Simpler mental model

---

## Conclusion

Effect Cluster represents a significant milestone in TypeScript's evolution, bringing enterprise-grade distributed systems capabilities to the JavaScript ecosystem. By combining:

1. **Actor Model Simplicity**: Entities as building blocks
2. **Persistent Messaging**: Resilience by default
3. **Type Safety**: Effect Schema throughout
4. **Location Transparency**: Focus on logic, not infrastructure
5. **Automatic Distribution**: Even work distribution

The framework enables TypeScript developers to build distributed systems with the same confidence and capabilities previously reserved for languages like Elixir, Scala, and Java.

### Key Takeaways

1. **TypeScript Has Arrived**: No longer just for simple scripts, now capable of complex distributed systems
2. **Simplicity Through Abstraction**: Complex networking hidden behind simple APIs
3. **Resilience Built-In**: Persistence and deduplication prevent common failures
4. **Developer Experience First**: Focus on business logic, not infrastructure
5. **Community-Driven**: Open to feedback, actively evolving

### The Vision

Tim's presentation reveals a vision where TypeScript applications can:
- Scale horizontally without complexity
- Survive chaos and failures
- Maintain consistency automatically
- Focus on business value

As Tim concludes:

> "Hopefully you got an idea what cluster is about and what we've been working on for the past little while. And hopefully you guys use it and love it."

The framework, while alpha, represents the future of distributed TypeScript applications, bringing the power of proven distributed systems patterns to the modern web ecosystem.
