# I.A. Hexagonal Architecture Principles

## 1.1 Architectural Intent

### 1.1.1 Separation of Concerns Through Distinct Layers

Hexagonal Architecture promotes separation of concerns by organizing code into distinct layers with clear boundaries. The name comes from visualizing the application as a hexagon, though the number of sides isn't significant—what matters is the architectural principle.

**Core Principle**: Each layer has a single, well-defined responsibility and communicates with other layers only through explicit interfaces. This separation ensures that:

- Business logic remains isolated from technical concerns
- Changes in one layer don't cascade to others
- Each layer can be developed, tested, and maintained independently
- The system maintains flexibility to adapt to changing requirements

### 1.1.2 Clear Boundaries Between Business Logic and External Systems

The architecture establishes explicit boundaries that separate:

**Business Logic (Application Core)**:
- Contains pure domain knowledge
- Expresses business rules and workflows
- Independent of frameworks, databases, and UI
- Focuses on solving business problems

**External Systems**:
- Infrastructure concerns (databases, file systems)
- User interfaces (HTTP, CLI, GraphQL)
- External services (payment gateways, email services)
- Technical implementation details

These boundaries are enforced through **ports** (abstract interfaces) that define contracts for communication across boundaries. The core never directly depends on external systems; instead, it depends on abstractions that external systems must satisfy.

### 1.1.3 Dependency Inversion at Architectural Boundaries

Hexagonal Architecture applies the Dependency Inversion Principle at the architectural level:

**Traditional Approach (❌ High-level depends on low-level)**:

```
Business Logic → Database Implementation
Business Logic → Email Service Implementation
Business Logic → Payment Gateway Implementation
```

**Hexagonal Approach (✅ Both depend on abstractions)**:

```
Business Logic → Repository Interface ← Database Adapter
Business Logic → Email Interface ← SMTP Adapter
Business Logic → Payment Interface ← Stripe Adapter
```

**Key Insight**: High-level business logic defines what it needs through interfaces (ports), and low-level implementations (adapters) satisfy those interfaces. This inverts the traditional dependency direction, making business logic independent of technical details.

**Benefits**:
- Business logic doesn't know about concrete implementations
- Infrastructure can change without affecting business rules
- Different implementations can be swapped transparently
- Testing becomes trivial (swap real implementations with test doubles)

### 1.1.4 Technology Independence of Core Domain

The core domain achieves complete technology independence through strict layering:

**Zero External Dependencies**:

```typescript
// ✅ Domain Layer - Pure business logic
export class Order extends Schema.Class<Order>("Order")({
  id: Schema.String,
  items: Schema.Array(OrderItem),
  total: Schema.Number,
  status: Schema.Literal("pending", "confirmed", "shipped")
}) {
  // Pure business logic - no I/O, no frameworks
  confirm(): Order {
    if (this.items.length === 0) {
      throw new Error("Cannot confirm empty order");
    }
    return new Order({ ...this, status: "confirmed" });
  }
  
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}
```

**What This Means in Practice**:

1. **No Framework Lock-in**: The domain doesn't import Express, Fastify, or any web framework
2. **No Database Knowledge**: The domain doesn't know if you use PostgreSQL, MongoDB, or in-memory storage
3. **No UI Coupling**: The domain doesn't depend on React, Vue, or CLI libraries
4. **No External Service Dependencies**: The domain doesn't import Stripe, SendGrid, or AWS SDKs

**The Result**: You can:
- Test domain logic without any infrastructure
- Migrate from one database to another without touching business rules
- Support multiple UIs (web, mobile, CLI) with the same core
- Swap external services (Stripe to PayPal) without domain changes
- Port the entire application to a different technology stack while preserving business logic

---

## 1.2 The Hexagon Model

### 1.2.1 Application Core (Center): Pure Business Logic

The **Application Core** sits at the center of the hexagon and contains everything related to solving business problems:

**Components of the Core**:

1. **Domain Models**:
   - Entities that represent business concepts
   - Value objects with business meaning
   - Aggregates that maintain consistency boundaries

2. **Business Rules**:
   - Pure functions that encode domain logic
   - Validation rules
   - Calculation and transformation logic

3. **Use Cases**:
   - Application services that orchestrate business workflows
   - Coordinate multiple domain objects
   - Define transaction boundaries

**Characteristics**:

```typescript
// The core ONLY contains business logic
namespace Domain {
  // Domain entity
  export interface Order {
    id: OrderId
    items: OrderItem[]
    status: OrderStatus
  }
  
  // Pure business rule - no Effect, no I/O
  export const calculateTotal = (order: Order): Money =>
    order.items.reduce((sum, item) => 
      Money.add(sum, Money.multiply(item.price, item.quantity)),
      Money.zero
    )
  
  // Domain rule about state transitions
  export const canShip = (order: Order): boolean =>
    order.status === "paid" && order.items.every(i => i.inStock)
}
```

**Key Principle**: The core has **zero knowledge** of:
- How data is stored
- How users interact with the system
- What external services exist
- What technology stack is used

### 1.2.2 Ports: Abstract Interface Definitions

**Ports** are the hexagon's connection points to the outside world. They are **abstract interfaces** that define communication contracts without any implementation.

**Port Characteristics**:
- Pure interfaces (no concrete implementation)
- Define method signatures only
- Specify inputs and outputs
- Declare possible errors
- Express what the application needs or offers

**Two Types of Ports**:

**Secondary Ports (Outbound)** - What the application needs:

```typescript
// Port interface - defines what the application needs
interface TaskRepository {
  readonly findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>
  readonly save: (task: Task) => Effect.Effect<void, DatabaseError>
}

// Port tag - identifies the dependency
export class TaskRepository extends Context.Tag("TaskRepository")<
  TaskRepository,
  TaskRepository
>() {}
```

**Primary Ports (Inbound)** - What the application offers:

```typescript
// Use case as a primary port - what external actors can call
export class CompleteTaskUseCase extends Effect.Service<CompleteTaskUseCase>()(
  "CompleteTaskUseCase",
  {
    dependencies: [TaskRepository.Default, EmailService.Default],
    
    effect: Effect.gen(function* () {
      const taskRepo = yield* TaskRepository
      const emailService = yield* EmailService
      
      return {
        // This is the primary port interface
        execute: (taskId: TaskId) =>
          Effect.gen(function* () {
            // Business logic using secondary ports
            const task = yield* taskRepo.findById(taskId)
            // ... orchestration logic
          })
      }
    })
  }
) {}
```

**Why Ports Matter**:
- **Testability**: Swap implementations with test doubles
- **Flexibility**: Multiple implementations of the same contract
- **Clarity**: Explicit about dependencies and capabilities
- **Decoupling**: Core doesn't know about concrete implementations

### 1.2.3 Adapters: Concrete Implementations

**Adapters** are concrete implementations that connect ports to real-world technologies. They translate between the domain's abstract contracts and specific technical implementations.

**Adapter Characteristics**:
- Implement port interfaces exactly
- Handle technology-specific details
- Translate between domain and external formats
- Manage resources and connections
- Encapsulate infrastructure concerns

**Secondary Adapters (Outbound)** - Implement what the application needs:

```typescript
// PostgreSQL Adapter - implements TaskRepository port
const makePostgresAdapter = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  return TaskRepository.of({
    findById: (id) =>
      sql<Task>`SELECT * FROM tasks WHERE id = ${id}`.pipe(
        Effect.flatMap((rows) =>
          rows.length === 0
            ? Effect.fail(new TaskNotFoundError({ taskId: id }))
            : Effect.succeed(Task.make(rows[0]))
        )
      ),
      
    save: (task) =>
      sql`INSERT INTO tasks (...) VALUES (...)`.pipe(Effect.asVoid)
  })
})

export const TaskRepositoryPostgresLive = Layer.effect(
  TaskRepository,
  makePostgresAdapter
).pipe(
  Layer.provide(SqlClient.layer({ /* config */ }))
)
```

```typescript
// In-Memory Adapter - alternative implementation for testing
export const TaskRepositoryMemoryLive = Layer.effect(
  TaskRepository,
  Effect.gen(function* () {
    const storage = yield* Ref.make(new Map<TaskId, Task>())
    
    return TaskRepository.of({
      findById: (id) =>
        Ref.get(storage).pipe(
          Effect.flatMap((map) =>
            map.has(id)
              ? Effect.succeed(map.get(id)!)
              : Effect.fail(new TaskNotFoundError({ taskId: id }))
          )
        ),
        
      save: (task) =>
        Ref.update(storage, (map) => new Map(map).set(task.id, task))
    })
  })
)
```

**Primary Adapters (Inbound)** - Drive the application:

```typescript
// HTTP Adapter - translates HTTP requests to use case calls
export class TaskApi extends HttpApiGroup.make("tasks")
  .add(
    HttpApiEndpoint.post("completeTask", "/tasks/:id/complete")
  )
{} {
  static Live = HttpApiBuilder.group(TaskApi, "tasks", (handlers) =>
    Effect.gen(function* () {
      const completeTask = yield* CompleteTaskUseCase
      
      return handlers.handle("completeTask", ({ path }) =>
        completeTask.execute(path.id as TaskId)
      )
    })
  )
}
```

**Key Insight**: You can have multiple adapters for the same port:
- `TaskRepositoryPostgresLive` for production
- `TaskRepositoryMemoryLive` for testing
- `TaskRepositorySQLiteLive` for local development
- All implement the same `TaskRepository` interface

### 1.2.4 Dependency Flow: Outside → Ports → Core

The dependency flow in hexagonal architecture follows a strict direction:

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SYSTEMS                         │
│  (Databases, APIs, File Systems, User Interfaces)          │
└────────────────┬────────────────────────────────────────────┘
                 │ implements
                 ↓
┌────────────────────────────────────────────────────────────┐
│                       ADAPTERS                             │
│        (Concrete technology implementations)               │
└────────────────┬───────────────────────────────────────────┘
                 │ satisfies
                 ↓
┌────────────────────────────────────────────────────────────┐
│                        PORTS                               │
│              (Abstract interfaces)                         │
└────────────────┬───────────────────────────────────────────┘
                 │ defines needs/offers
                 ↓
┌────────────────────────────────────────────────────────────┐
│                  APPLICATION CORE                          │
│              (Pure business logic)                         │
└────────────────────────────────────────────────────────────┘
```

**Dependency Rules**:

1. **Core → Ports (Outward)**:
   - Core defines what it needs through port interfaces
   - Core depends on abstractions, never concrete adapters
   
2. **Ports ← Adapters (Inward)**:
   - Adapters implement port contracts
   - Adapters depend on ports, not vice versa
   
3. **External Systems → Adapters**:
   - External systems are accessed through adapters
   - External systems never directly interact with core

**Enforced in Effect-TS**:

```typescript
// ✅ CORRECT: Core depends on port abstraction
const useCase = Effect.gen(function* () {
  const repo = yield* TaskRepository  // Port (abstraction)
  return yield* repo.findById(id)
})

// ❌ WRONG: Core cannot depend on concrete adapter
const useCase = Effect.gen(function* () {
  const repo = yield* TaskRepositoryPostgresLive  // ❌ Concrete adapter!
  return yield* repo.findById(id)
})
```

**The Type System Enforces This**:

```typescript
// Application layer effect signature
type CompleteTask = Effect.Effect<
  void,                    // Success
  TaskNotFoundError,       // Errors
  TaskRepository           // Depends on PORT (interface)
>

// The R channel contains TaskRepository (the port), not any specific adapter
// The adapter is provided at the composition root, not in the business logic
```

---

## 1.3 Directional Architecture

### 1.3.1 Primary (Driving/Inbound) Side

The **Primary Side** represents how external actors interact with and **drive** the application.

**Direction**: Outside World → Application

**Key Question**: *"Who wants to use our application?"*

**Components**:

1. **Primary Ports** - Interfaces the application exposes:

   ```typescript
   // What the application OFFERS to the outside world
   export class CompleteTaskUseCase extends Effect.Service<CompleteTaskUseCase>()(
     "CompleteTaskUseCase",
     {
       effect: Effect.gen(function* () {
         return {
           // Public methods external actors can call
           execute: (taskId: TaskId) => Effect.Effect<void, TaskError>
         }
       })
     }
   ) {}
   ```

2. **Primary Adapters** - Concrete entry points that drive use cases:
   - HTTP/REST API endpoints
   - GraphQL resolvers
   - CLI commands
   - WebSocket handlers
   - gRPC servers
   - Message queue consumers (receiving messages)
   - Scheduled jobs/cron tasks
   - GUI event handlers

**Example - HTTP Adapter**:

```typescript
// Primary adapter translates HTTP to domain operations
export class TaskHttpAdapter extends HttpApiGroup.make("tasks")
  .add(
    HttpApiEndpoint.post("completeTask", "/tasks/:id/complete")
  )
{} {
  static Live = HttpApiBuilder.group(TaskHttpAdapter, "tasks", (handlers) =>
    Effect.gen(function* () {
      const completeTask = yield* CompleteTaskUseCase
      
      return handlers.handle("completeTask", ({ path }) =>
        // Adapter drives the use case
        completeTask.execute(path.id as TaskId)
      )
    })
  )
}
```

**Example - CLI Adapter**:

```typescript
// Primary adapter translates CLI commands to domain operations
export const completeTaskCommand = Command.make(
  "complete",
  { taskId: Options.text("task-id") },
  ({ taskId }) =>
    Effect.gen(function* () {
      const completeTask = yield* CompleteTaskUseCase
      
      // Adapter drives the use case
      yield* completeTask.execute(taskId as TaskId)
      yield* Console.log(`Task ${taskId} completed`)
    })
)
```

**Characteristics**:
- **User-facing**: Direct interaction points for users or systems
- **Protocol-specific**: Handle HTTP, GraphQL, CLI, etc. details
- **Translation layer**: Convert external formats to domain calls
- **Thin**: Minimal logic, mostly translation and validation

### 1.3.2 Secondary (Driven/Outbound) Side

The **Secondary Side** represents what the application needs from external systems. The application **drives** these systems.

**Direction**: Application → Outside World

**Key Question**: *"What external capabilities does our application need?"*

**Components**:

1. **Secondary Ports** - Interfaces the application requires:

   ```typescript
   // What the application NEEDS from the outside world
   export interface TaskRepository {
     readonly findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>
     readonly save: (task: Task) => Effect.Effect<void, DatabaseError>
   }
   
   export class TaskRepository extends Context.Tag("TaskRepository")<
     TaskRepository,
     TaskRepository
   >() {}
   ```

2. **Secondary Adapters** - Concrete implementations the application drives:
   - Database repositories (PostgreSQL, MongoDB, Redis)
   - External API clients (REST, GraphQL, gRPC)
   - Email/SMS services (SMTP, SendGrid, Twilio)
   - File systems (local, S3, Azure Blob)
   - Cache stores (Redis, Memcached)
   - Message queue producers (Kafka, RabbitMQ, SQS)
   - Payment gateways (Stripe, PayPal)
   - Authentication providers (Auth0, Okta)

**Example - Database Adapter**:

```typescript
// Secondary adapter implements what the application needs
const makePostgresRepository = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  return TaskRepository.of({
    findById: (id) =>
      sql<Task>`SELECT * FROM tasks WHERE id = ${id}`.pipe(
        Effect.flatMap((rows) =>
          rows.length === 0
            ? Effect.fail(new TaskNotFoundError({ taskId: id }))
            : Effect.succeed(Task.make(rows[0]))
        )
      ),
      
    save: (task) =>
      sql`INSERT INTO tasks (...) VALUES (...)`.pipe(Effect.asVoid)
  })
})

export const TaskRepositoryPostgresLive = Layer.effect(
  TaskRepository,
  makePostgresRepository
)
```

**Example - Email Service Adapter**:

```typescript
// Secondary adapter implements email capability
const makeEmailService = Effect.gen(function* () {
  const smtp = yield* SmtpClient
  const config = yield* Config
  
  return EmailService.of({
    sendTaskCompletedEmail: (task: Task) =>
      smtp.send({
        to: config.adminEmail,
        subject: `Task Completed: ${task.title}`,
        body: `Task ${task.id} has been completed.`
      })
  })
})

export const EmailServiceSmtpLive = Layer.effect(
  EmailService,
  makeEmailService
)
```

**Characteristics**:
- **Infrastructure-facing**: Interact with databases, APIs, file systems
- **Implementation-specific**: Handle PostgreSQL, SMTP, Stripe details
- **Resource management**: Acquire connections, manage lifecycle
- **Error translation**: Map infrastructure errors to domain errors

### 1.3.3 Visual Distinction

```typescript
                    APPLICATION CORE
                  (Business Logic/Domain)
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   PRIMARY SIDE       (Hexagon)        SECONDARY SIDE
   (Driving)                             (Driven)
        │                                     │
  "Who uses us"                        "What we need"
        │                                     │
        ↓                                     ↓
┌───────────────┐                    ┌───────────────┐
│ HTTP Endpoint │                    │   PostgreSQL  │
│ CLI Command   │                    │   SMTP Email  │
│ GraphQL API   │                    │   Stripe Pay  │
│ WebSocket     │   APPLICATION   →  │   Redis Cache │
│ gRPC Server   │   DRIVES THESE     │   S3 Storage  │
└───────────────┘                    └───────────────┘
       ↑                                     
  THESE DRIVE                              
  APPLICATION                              
```

**Key Differences**:

| Aspect | Primary (Driving) | Secondary (Driven) |
|--------|------------------|-------------------|
| **Direction** | Outside → Application | Application → Outside |
| **Purpose** | Use the application | Satisfy application needs |
| **Initiative** | External actors initiate | Application initiates |
| **Examples** | HTTP, CLI, GraphQL | Database, Email, Payment |
| **Defined By** | Use cases (what we offer) | Ports (what we need) |
| **Layer** | `entrypoints/` | `infrastructure/` |
| **Control** | External systems control timing | Application controls calls |

**Mental Model**:
- **Primary**: "How do users/systems interact with us?" (They drive us)
- **Secondary**: "How do we interact with external systems?" (We drive them)

Both sides are **adapters** connecting external systems to the core hexagon, but they face opposite directions and serve different purposes in the architectural flow.
