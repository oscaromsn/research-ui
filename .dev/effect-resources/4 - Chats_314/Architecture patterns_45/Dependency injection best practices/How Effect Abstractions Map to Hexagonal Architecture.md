---
modified: 2025-10-26T14:22:00-03:00
---
# How Effect Abstractions Map to Hexagonal Architecture

## The Perfect Alignment

Effect's type system and abstractions were **designed** to enforce dependency inversion and clean architecture. Here's the deep mapping:

---

## 1. The `Effect<A, E, R>` Signature Embodies Hexagonal Principles

```typescript
Effect<Success, Error, Requirements>
        ↓         ↓          ↓
     Output   Failures    Dependencies (Ports!)
```

### The `R` Channel = Hexagonal Ports

**The `R` (Requirements) channel is the type-level representation of ports:**

```typescript
// This type signature tells you EVERYTHING about the boundaries:
type CompleteTask = Effect
  void,                    // A: What we produce (domain outcome)
  InvalidTransitionError,  // E: What can go wrong (domain errors)
  TaskRepository | EmailService  // R: What PORTS we need (dependencies)
>

// This is effectively declaring:
// "I need access to these ports (interfaces) to execute"
```

**Key insight**: The `R` channel makes **all port dependencies explicit at the type level**. The compiler **enforces** that you provide implementations before running the effect.

---

## 2. `Context.Tag` = Port Declaration

`Context.Tag` is Effect's type-safe way of declaring a **port interface**:

```typescript
// ============ OUTBOUND PORT (Secondary/Driven) ============
// application/ports/TaskRepository.ts

import { Effect, Context } from "effect"

// Port interface definition
interface TaskRepository {
  readonly findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>
  readonly save: (task: Task) => Effect.Effect<void, DatabaseError>
}

// Tag = Port identifier at type AND runtime level
export class TaskRepository extends Context.Tag("TaskRepository")
  TaskRepository,
  TaskRepository
>() {}

// The tag serves two purposes:
// 1. Type-level: Uniquely identifies this port in the type system
// 2. Runtime: Key for dependency injection lookup
```

**Mapping**:
- **Port (Hexagonal)** = `Context.Tag<Interface>` (Effect)
- **Port Interface** = TypeScript interface with Effect-returning methods
- **Port Identity** = Unique string identifier in `Context.Tag`

---

## 3. `Layer` = Adapter Constructor

`Layer<ROut, E, RIn>` is Effect's abstraction for **building adapters**:

```typescript
Layer<ServicesProduced, ConstructionErrors, ServicesDependedOn>
      ↓                  ↓                   ↓
  What ports this     Errors during       Other ports needed
  adapter implements  adapter creation    by this adapter
```

### Outbound Adapter (Secondary/Driven)

```typescript
// ============ OUTBOUND ADAPTER ============
// infrastructure/persistence/TaskRepository.postgres.ts

import { Effect, Layer } from "effect"
import { SqlClient } from "@effect/sql"

// Adapter implementation
const makePostgresAdapter = Effect.gen(function* () {
  // Acquire dependencies (other ports)
  const sql = yield* SqlClient.SqlClient
  
  // Return implementation of the port interface
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

// Layer = Blueprint for constructing this adapter
export const TaskRepositoryPostgresLive = Layer.effect(
  TaskRepository,           // Port this adapter implements
  makePostgresAdapter       // How to build the adapter
).pipe(
  // LOCAL DEPENDENCY ELIMINATION - hide internal dependencies
  Layer.provide(SqlClient.layer({ /* config */ }))
)

// Type: Layer<TaskRepository, never, never>
//             ↑ Implements this port
//                          ↑ No construction errors
//                                   ↑ No external dependencies (hidden)
```

**Mapping**:
- **Adapter (Hexagonal)** = `Layer` (Effect)
- **Adapter Implementation** = Effect that builds and returns the port interface
- **Adapter Dependencies** = Other `Layer`s provided via `Layer.provide`

---

## 4. `Effect.Service` = Modern Port + Adapter Pattern

The modern `Effect.Service` pattern combines port definition and default adapter in one:

```typescript
// ============ COMPLETE PORT + DEFAULT ADAPTER ============
// application/ports/EmailService.ts

export class EmailService extends Effect.Service<EmailService>()(
  "EmailService",  // Port identifier
  {
    // Dependencies this service needs (other ports)
    dependencies: [SmtpClient.Default, Config.Default],
    
    // How to construct the default adapter (the "Live" implementation)
    scoped: Effect.gen(function* () {
      // Acquire dependencies during construction
      const smtp = yield* SmtpClient
      const config = yield* Config
      
      // Return the port interface
      return {
        sendTaskCompletedEmail: (task: Task) =>
          Effect.gen(function* () {
            yield* smtp.send({
              to: config.adminEmail,
              subject: `Task Completed: ${task.title}`,
              body: `Task ${task.id} has been completed.`
            })
          })
      }
    })
  }
) {}

// Usage:
// - EmailService = The Context.Tag (port identifier)
// - EmailService.Default = The Layer (default adapter constructor)
```

**What Effect.Service gives you**:
1. **Port declaration**: The class is a `Context.Tag`
2. **Default adapter**: `.Default` property is a `Layer`
3. **Type safety**: Interface inferred from implementation
4. **Resource safety**: `scoped` ensures cleanup

**Mapping**:
- **Port + Default Adapter** = `Effect.Service` (Effect)
- **Alternative Adapters** = Create additional `Layer`s implementing the same tag

---

## 5. Use Cases = Effects Requiring Ports

```typescript
// ============ INBOUND PORT (Primary/Driving) ============
// application/use-cases/CompleteTask.ts

import { Effect } from "effect"
import { TaskRepository } from "../ports/TaskRepository"
import { EmailService } from "../ports/EmailService"

// Use case = Effect that requires ports
export class CompleteTaskUseCase extends Effect.Service<CompleteTaskUseCase>()(
  "CompleteTaskUseCase",
  {
    // Declare OUTBOUND port dependencies
    dependencies: [TaskRepository.Default, EmailService.Default],
    
    effect: Effect.gen(function* () {
      // Acquire outbound ports
      const taskRepo = yield* TaskRepository
      const emailService = yield* EmailService
      
      // Return INBOUND port interface (what external actors can call)
      return {
        execute: (taskId: TaskId) =>
          Effect.gen(function* () {
            // Use outbound ports to accomplish use case
            const task = yield* taskRepo.findById(taskId)
            
            if (!canCompleteTask(task)) {
              return yield* Effect.fail(new InvalidTransitionError())
            }
            
            const completed = new Task({ ...task, status: "completed" })
            yield* taskRepo.save(completed)
            yield* emailService.sendTaskCompletedEmail(completed)
          })
      }
    })
  }
) {}
```

**Type signature breakdown**:

```typescript
CompleteTaskUseCase.execute: (taskId: TaskId) => Effect
  void,                                    // Success outcome
  TaskNotFoundError | InvalidTransitionError,  // Domain errors
  never  // ← No requirements! Dependencies satisfied by Layer
>
```

**Mapping**:
- **Use Case (Application Layer)** = `Effect.Service` that depends on other ports
- **Inbound Port** = The public methods the use case exposes
- **Outbound Ports** = Dependencies declared in `dependencies` array

---

## 6. Type System Enforces Port Contracts

Effect's type system **prevents** violations of hexagonal architecture:

### ❌ Cannot Run Without Satisfying Dependencies

```typescript
const useCase = CompleteTaskUseCase.execute("task-123")
// Type: Effect<void, Error, CompleteTaskUseCase>
//                            ↑ Still requires this service!

Effect.runPromise(useCase)  // ❌ TYPE ERROR!
// Cannot run - CompleteTaskUseCase dependency not provided
```

### ✅ Must Provide Implementations

```typescript
const runnable = useCase.pipe(
  Effect.provide(CompleteTaskUseCase.Default)  // Must provide the layer
)
// Type: Effect<void, Error, never>  ← All dependencies satisfied

Effect.runPromise(runnable)  // ✅ Now it compiles and runs
```

### Port Interface Violations Caught at Compile Time

```typescript
// Adapter must match port interface exactly
const BadAdapter = Layer.succeed(
  TaskRepository,
  {
    findById: (id: string) => Effect.succeed({ wrong: "shape" })
    //                                          ↑ TYPE ERROR!
    //                        Must return Task, not { wrong: string }
  }
)
```

---

## 7. Complete Hexagonal Architecture with Effect

### Directory Structure Aligned with Effect Abstractions

```typescript
src/
├── domain/                           # Pure domain (no Effect)
│   ├── models.ts                     # Schema.Class entities
│   ├── errors.ts                     # Data.TaggedError types
│   └── rules.ts                      # Pure functions
│
├── application/
│   ├── ports/                        # OUTBOUND ports (Context.Tag)
│   │   ├── TaskRepository.ts         # Port interface + Tag
│   │   ├── EmailService.ts           # Port interface + Tag
│   │   └── PaymentGateway.ts         # Port interface + Tag
│   │
│   └── use-cases/                    # INBOUND ports (Effect.Service)
│       ├── CompleteTask.ts           # Use case service
│       ├── CreateOrder.ts            # Use case service
│       └── GetUserProfile.ts         # Use case service
│
├── infrastructure/                   # OUTBOUND adapters (Layer)
│   ├── persistence/
│   │   ├── TaskRepository.postgres.ts   # Postgres adapter Layer
│   │   └── TaskRepository.memory.ts     # In-memory adapter Layer
│   │
│   ├── messaging/
│   │   └── EmailService.smtp.ts         # SMTP adapter Layer
│   │
│   └── payment/
│       └── PaymentGateway.stripe.ts     # Stripe adapter Layer
│
└── entrypoints/                      # INBOUND adapters
    ├── http/
    │   ├── TaskController.ts         # HTTP → Use cases
    │   └── server.ts                 # Layer composition
    │
    └── cli/
        └── commands.ts               # CLI → Use cases
```

---

## 8. Effect Patterns = Hexagonal Patterns

| Hexagonal Concept | Effect Abstraction | TypeScript Representation |
|-------------------|-------------------|---------------------------|
| **Port Interface** | `interface` + `Context.Tag` | TypeScript interface with Effect methods |
| **Inbound Port** | `Effect.Service` with public methods | Use case as service |
| **Outbound Port** | `Context.Tag<Interface>` | Repository/Gateway interface |
| **Inbound Adapter** | Entry point code using Effect | HTTP handler, CLI command |
| **Outbound Adapter** | `Layer.effect(Tag, implementation)` | Postgres repo, SMTP email |
| **Port Contract** | Type signature `Effect<A, E, R>` | Return type of port methods |
| **Dependency Declaration** | `R` channel in `Effect<A, E, R>` | Union type of required services |
| **Dependency Injection** | `Effect.provide(Layer)` | Providing implementations |
| **Adapter Swapping** | Different `Layer` implementations | `TaskRepositoryPostgresLive` vs `TaskRepositoryMemoryLive` |
| **Local Dependencies** | `Layer.provide` composition | Hide adapter's internal deps |
| **Resource Management** | `Layer.scoped` + `Scope` | Acquire/release in adapter |
| **Application Assembly** | `Layer.merge` + single `Effect.provide` | Compose all layers at edge |

---

## 9. The Compiler as Architectural Enforcer

Effect turns architectural principles into **compiler-enforced rules**:

```typescript
// ❌ Hexagonal violation: Use case directly depends on concrete adapter
class CompleteTask {
  constructor(
    private postgresRepo: PostgresTaskRepository  // ❌ Concrete dependency!
  ) {}
}

// ✅ Effect way: Use case depends on port (interface)
export class CompleteTaskUseCase extends Effect.Service<CompleteTaskUseCase>()(
  "CompleteTaskUseCase",
  {
    dependencies: [TaskRepository.Default],  // ✅ Port dependency!
    //               ↑ This is the interface, not implementation
    
    effect: Effect.gen(function* () {
      const repo = yield* TaskRepository  // Get ANY implementation of the port
      // ...
    })
  }
) {}
```

**The compiler ensures**:
1. **Use cases never directly depend on adapters** (only on tags/ports)
2. **All port dependencies are explicit** (in the `R` channel)
3. **Adapters must implement port contracts** (type checking on `Layer.succeed/effect`)
4. **Dependencies must be satisfied** (can't run without providing layers)
5. **No circular dependencies** (Layer composition catches cycles)

---

## 10. Practical Example: Complete Mapping

### Port Definition (Outbound)

```typescript
// application/ports/TaskRepository.ts
import { Effect, Context } from "effect"

// PORT INTERFACE
interface TaskRepository {
  readonly findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>
  readonly save: (task: Task) => Effect.Effect<void, DatabaseError>
}

// PORT TAG (unique identifier)
export class TaskRepository extends Context.Tag("TaskRepository")
  TaskRepository,
  TaskRepository
>() {}
```

### Adapter Implementation (Outbound)

```typescript
// infrastructure/persistence/TaskRepository.postgres.ts
import { Effect, Layer } from "effect"

// ADAPTER: Implements the port using Postgres
const makePostgresAdapter = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  return TaskRepository.of({
    findById: (id) => sql<Task>`SELECT * FROM tasks WHERE id = ${id}`,
    save: (task) => sql`INSERT INTO tasks (...) VALUES (...)`.pipe(Effect.asVoid)
  })
})

// LAYER: Blueprint for constructing the adapter
export const TaskRepositoryPostgresLive = Layer.effect(
  TaskRepository,
  makePostgresAdapter
).pipe(
  Layer.provide(SqlClient.layer({ host: "localhost", port: 5432 }))
)

// Alternative adapter for testing
export const TaskRepositoryMemoryLive = Layer.effect(
  TaskRepository,
  Effect.gen(function* () {
    const store = yield* Ref.make<Map<TaskId, Task>>(new Map())
    return TaskRepository.of({
      findById: (id) => Ref.get(store).pipe(/* ... */),
      save: (task) => Ref.update(store, /* ... */)
    })
  })
)
```

### Use Case (Inbound Port)

```typescript
// application/use-cases/CompleteTask.ts

// INBOUND PORT: What the application offers
export class CompleteTaskUseCase extends Effect.Service<CompleteTaskUseCase>()(
  "CompleteTaskUseCase",
  {
    // Depends on OUTBOUND ports
    dependencies: [TaskRepository.Default, EmailService.Default],
    
    effect: Effect.gen(function* () {
      const repo = yield* TaskRepository      // Outbound port
      const email = yield* EmailService       // Outbound port
      
      // Return inbound port interface
      return {
        execute: (taskId: TaskId) =>
          Effect.gen(function* () {
            const task = yield* repo.findById(taskId)
            if (!canCompleteTask(task)) {
              return yield* Effect.fail(new InvalidTransitionError())
            }
            const completed = new Task({ ...task, status: "completed" })
            yield* repo.save(completed)
            yield* email.sendTaskCompletedEmail(completed)
          })
      }
    })
  }
) {}
```

### Entry Point (Inbound Adapter)

```typescript
// entrypoints/http/server.ts

// INBOUND ADAPTER: HTTP interface driving use cases
import { HttpApiEndpoint } from "@effect/platform"

export class TaskHttpAdapter extends HttpApiGroup.make("tasks")
  .add(
    HttpApiEndpoint.post("completeTask", "/tasks/:id/complete")
  )
{} {
  static Live = HttpApiBuilder.group(TaskHttpAdapter, "tasks", (handlers) =>
    Effect.gen(function* () {
      const completeTask = yield* CompleteTaskUseCase  // Access inbound port
      
      return handlers.handle("completeTask", ({ path }) =>
        completeTask.execute(path.id as TaskId)  // Drive the use case
      )
    })
  )
}

// LAYER COMPOSITION
const OutboundAdapters = Layer.mergeAll(
  TaskRepositoryPostgresLive,  // Choose Postgres adapter
  EmailServiceSmtpLive
)

const ApplicationCore = Layer.mergeAll(
  CompleteTaskUseCase.Default
).pipe(Layer.provide(OutboundAdapters))

const InboundAdapters = Layer.mergeAll(
  TaskHttpAdapter.Live
).pipe(Layer.provide(ApplicationCore))

// Single provide at the edge
const server = HttpServer.serve.pipe(
  Effect.provide(InboundAdapters)
)
```

---

## Summary: The Natural Alignment

**Effect was designed for hexagonal architecture**:

| Effect Feature | Enables Hexagonal Principle |
|----------------|----------------------------|
| **`Effect<A, E, R>` type** | Makes dependencies (ports) explicit in types |
| **`Context.Tag`** | Type-safe port identifiers |
| **`Layer`** | Composable adapter constructors |
| **`Effect.Service`** | Modern port + default adapter pattern |
| **Type system** | Enforces port contracts at compile time |
| **`R` channel propagation** | Automatically tracks dependency graph |
| **Layer composition** | Enables clean separation and swapping |
| **`Layer.provide`** | Dependency injection with type safety |
| **Memoization** | Singleton adapters by default |
| **`Scope`** | Resource-safe adapter construction |

The key insight: **Effect's abstractions make hexagonal architecture the path of least resistance**. The type system **enforces** clean boundaries, and the composition patterns make it **easier** to follow architectural principles than to violate them.
