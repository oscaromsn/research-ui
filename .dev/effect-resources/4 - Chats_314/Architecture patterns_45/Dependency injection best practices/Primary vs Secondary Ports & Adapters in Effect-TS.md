---
modified: 2025-10-26T14:20:30-03:00
---
# Primary vs Secondary Ports & Adapters in Effect-TS

## The Core Distinction

Hexagonal architecture divides the world into **two sides** based on the direction of dependency:

```
                    APPLICATION CORE
                  (Business Logic/Domain)
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   PRIMARY SIDE       (Hexagon)        SECONDARY SIDE
   (Driving)                             (Driven)
        │                                     │
  "Who uses us"                        "What we need"
```

### Primary (Driving) Side

**Primary Ports**: Interfaces the application **exposes** to the outside world
**Primary Adapters**: Concrete entry points that **drive** the application

**Direction**: Outside → Application
**Question**: "Who wants to use our application?"

**Examples**:
- HTTP API endpoints
- GraphQL resolvers
- CLI commands
- WebSocket handlers
- gRPC servers
- Message queue consumers
- Scheduled jobs/cron

### Secondary (Driven) Side

**Secondary Ports**: Interfaces the application **requires** from the outside world
**Secondary Adapters**: Concrete implementations that the application **drives/calls**

**Direction**: Application → Outside
**Question**: "What external capabilities does our application need?"

**Examples**:
- Database repositories
- External APIs (REST, GraphQL)
- Email/SMS services
- File systems
- Cache stores
- Message queue producers
- Payment gateways

---

## Visual Architecture

```typescript
┌─────────────────── PRIMARY ADAPTERS (Driving) ───────────────────┐
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   HTTP   │  │   CLI    │  │GraphQL   │  │WebSocket │        │
│  │ Server   │  │ Command  │  │ Resolver │  │ Handler  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │              │             │               │
│       └─────────────┴──────────────┴─────────────┘               │
│                          ▼                                        │
└───────────────────────────────────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │   PRIMARY PORTS       │
              │  (Use Case Methods)   │
              │                       │
              │  - CompleteTask       │
              │  - CreateOrder        │
              │  - GetUserProfile     │
              └───────────┬───────────┘
                          │
              ┌───────────▼──────────────────────┐
              │   APPLICATION CORE               │
              │   (Business Logic)               │
              │                                  │
              │   Uses secondary ports ─────►   │
              └───────────┬──────────────────────┘
                          │
              ┌───────────▼───────────┐
              │   SECONDARY PORTS     │
              │    (Dependencies)     │
              │                       │
              │  - TaskRepository     │
              │  - EmailService       │
              │  - PaymentGateway     │
              └───────────┬───────────┘
                          │
                          ▼
┌─────────────────── SECONDARY ADAPTERS (Driven) ──────────────────┐
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Postgres  │  │  SMTP    │  │  Stripe  │  │  Redis   │        │
│  │Repository│  │  Email   │  │ Payment  │  │  Cache   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Effect-TS Implementation Patterns

### Directory Structure with Both Sides

```typescript
project/
├── src/
│   ├── domain/                        # Core (no dependencies)
│   │   ├── models.ts
│   │   ├── errors.ts
│   │   └── rules.ts                   # Pure business logic
│   │
│   ├── application/                   # Application Core
│   │   │
│   │   ├── ports/                     # SECONDARY PORTS (what we need)
│   │   │   ├── TaskRepository.ts      # Interface we depend on
│   │   │   ├── EmailService.ts        # Interface we depend on
│   │   │   └── PaymentGateway.ts      # Interface we depend on
│   │   │
│   │   └── use-cases/                 # PRIMARY PORTS (what we offer)
│   │       ├── CompleteTask.ts        # Use case = Primary Port
│   │       ├── CreateOrder.ts         # Use case = Primary Port
│   │       └── GetUserProfile.ts      # Use case = Primary Port
│   │
│   ├── infrastructure/                # SECONDARY ADAPTERS (driven)
│   │   ├── persistence/
│   │   │   ├── TaskRepository.postgres.ts
│   │   │   └── TaskRepository.memory.ts
│   │   ├── messaging/
│   │   │   └── EmailService.smtp.ts
│   │   └── payment/
│   │       └── PaymentGateway.stripe.ts
│   │
│   └── entrypoints/                   # PRIMARY ADAPTERS (driving)
│       ├── http/
│       │   ├── TaskController.ts      # HTTP → Use Cases
│       │   └── server.ts
│       ├── cli/
│       │   └── commands.ts            # CLI → Use Cases
│       └── graphql/
│           └── resolvers.ts           # GraphQL → Use Cases
```

---

## Pattern 1: Secondary Ports & Adapters (Driven Side)

### Secondary Port (Interface the application needs)

```typescript
// application/ports/TaskRepository.ts
import { Effect, Context } from "effect"
import { Task, TaskId } from "../../domain/models"
import { TaskNotFoundError } from "../../domain/errors"

// SECONDARY PORT - Application declares what it needs
export interface TaskRepository {
  readonly findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>
  readonly save: (task: Task) => Effect.Effect<void, DatabaseError>
  readonly findByStatus: (
    status: TaskStatus
  ) => Effect.Effect<Task[], DatabaseError>
}

export class TaskRepository extends Context.Tag("TaskRepository")
  TaskRepository,
  TaskRepository
>() {}
```

### Secondary Adapters (Implementations)

```typescript
// infrastructure/persistence/TaskRepository.postgres.ts
import { Effect, Layer } from "effect"
import { TaskRepository } from "../../application/ports/TaskRepository"
import { SqlClient } from "@effect/sql"

// SECONDARY ADAPTER - Concrete implementation of what app needs
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
      sql`
        INSERT INTO tasks (id, title, status)
        VALUES (${task.id}, ${task.title}, ${task.status})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          status = EXCLUDED.status
      `.pipe(Effect.asVoid),
      
    findByStatus: (status) =>
      sql<Task[]>`
        SELECT * FROM tasks WHERE status = ${status}
      `.pipe(Effect.map((rows) => rows.map(Task.make)))
  })
})

export const TaskRepositoryPostgresLive = Layer.effect(
  TaskRepository,
  makePostgresRepository
).pipe(
  Layer.provide(SqlClient.layer({ /* config */ }))
)
```

```typescript
// infrastructure/persistence/TaskRepository.memory.ts
// SECONDARY ADAPTER - Alternative implementation (for testing)
export const TaskRepositoryMemoryLive = Layer.effect(
  TaskRepository,
  Effect.gen(function* () {
    const tasks = yield* Ref.make<Map<TaskId, Task>>(new Map())
    
    return TaskRepository.of({
      findById: (id) =>
        Ref.get(tasks).pipe(
          Effect.flatMap((map) =>
            map.has(id)
              ? Effect.succeed(map.get(id)!)
              : Effect.fail(new TaskNotFoundError({ taskId: id }))
          )
        ),
        
      save: (task) =>
        Ref.update(tasks, (map) => new Map(map).set(task.id, task)),
        
      findByStatus: (status) =>
        Ref.get(tasks).pipe(
          Effect.map((map) =>
            Array.from(map.values()).filter((t) => t.status === status)
          )
        )
    })
  })
)
```

---

## Pattern 2: Primary Ports & Adapters (Driving Side)

### Primary Port (Use case that exposes functionality)

```typescript
// application/use-cases/CompleteTask.ts
import { Effect } from "effect"
import { TaskRepository } from "../ports/TaskRepository"
import { EmailService } from "../ports/EmailService"
import { canCompleteTask } from "../../domain/rules"

// PRIMARY PORT - This is what the application OFFERS to the world
// This is the "API" of your business logic
export class CompleteTaskUseCase extends Effect.Service<CompleteTaskUseCase>()(
  "CompleteTaskUseCase",
  {
    dependencies: [TaskRepository.Default, EmailService.Default],
    
    effect: Effect.gen(function* () {
      const taskRepo = yield* TaskRepository
      const emailService = yield* EmailService
      
      // The PRIMARY PORT interface
      return {
        // This method is what external adapters will call
        execute: (taskId: TaskId) =>
          Effect.gen(function* () {
            // 1. Fetch via secondary port
            const task = yield* taskRepo.findById(taskId)
            
            // 2. Apply domain rule
            if (!canCompleteTask(task)) {
              return yield* Effect.fail(
                new InvalidTransitionError({
                  from: task.status,
                  to: "completed"
                })
              )
            }
            
            // 3. Update state
            const completedTask = new Task({
              ...task,
              status: "completed"
            })
            
            // 4. Persist via secondary port
            yield* taskRepo.save(completedTask)
            
            // 5. Notify via secondary port
            yield* emailService.sendTaskCompletedEmail(completedTask)
          })
      }
    })
  }
) {}
```

### Primary Adapters (Entry points that use the application)

```typescript
// entrypoints/http/TaskController.ts
import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "@effect/schema"
import { CompleteTaskUseCase } from "../../application/use-cases/CompleteTask"

// PRIMARY ADAPTER - HTTP interface driving the use case
export class TaskApi extends HttpApiGroup.make("tasks")
  .add(
    HttpApiEndpoint.post("completeTask", "/tasks/:id/complete")
      .addSuccess(Schema.Void)
      .addError(TaskNotFoundError)
      .addError(InvalidTransitionError)
  )
{} {
  static Live = HttpApiBuilder.group(TaskApi, "tasks", (handlers) =>
    Effect.gen(function* () {
      // Access the PRIMARY PORT
      const completeTask = yield* CompleteTaskUseCase
      
      return handlers.handle("completeTask", ({ path }) =>
        Effect.gen(function* () {
          // Call the use case (primary port)
          yield* completeTask.execute(path.id as TaskId)
          return undefined
        })
      )
    })
  )
}
```

```typescript
// entrypoints/cli/commands.ts
import { Command } from "@effect/cli"
import { CompleteTaskUseCase } from "../../application/use-cases/CompleteTask"

// PRIMARY ADAPTER - CLI interface driving the use case
export const completeTaskCommand = Command.make(
  "complete",
  {
    taskId: Options.text("task-id").pipe(Options.withAlias("t"))
  },
  ({ taskId }) =>
    Effect.gen(function* () {
      // Access the PRIMARY PORT
      const completeTask = yield* CompleteTaskUseCase
      
      // Call the use case (primary port)
      yield* completeTask.execute(taskId as TaskId)
      
      yield* Console.log(`Task ${taskId} completed successfully`)
    })
)
```

```typescript
// entrypoints/graphql/resolvers.ts
import { CompleteTaskUseCase } from "../../application/use-cases/CompleteTask"

// PRIMARY ADAPTER - GraphQL interface driving the use case
export const resolvers = {
  Mutation: {
    completeTask: (_parent: unknown, args: { id: string }, context: Context) =>
      Effect.gen(function* () {
        // Access the PRIMARY PORT
        const completeTask = yield* CompleteTaskUseCase
        
        // Call the use case (primary port)
        yield* completeTask.execute(args.id as TaskId)
        
        return { success: true }
      }).pipe(
        Effect.provide(context.layer),
        Effect.runPromise
      )
  }
}
```

---

## Layer Composition: Separating Primary and Secondary

```typescript
// entrypoints/http/server.ts
import { Layer } from "effect"

// ========== SECONDARY SIDE (What we depend on) ==========
const SecondaryAdaptersLive = Layer.mergeAll(
  TaskRepositoryPostgresLive,    // Database
  EmailServiceSmtpLive,           // External API
  PaymentGatewayStripeLive,       // External API
  CacheRedisLive                  // External service
)

// ========== APPLICATION CORE (Business logic) ==========
const ApplicationCoreLive = Layer.mergeAll(
  CompleteTaskUseCase.Default,
  CreateOrderUseCase.Default,
  GetUserProfileUseCase.Default
).pipe(
  // Provide secondary adapters to use cases
  Layer.provide(SecondaryAdaptersLive)
)

// ========== PRIMARY SIDE (Entry points) ==========
const PrimaryAdaptersLive = Layer.mergeAll(
  TaskApi.Live,          // HTTP endpoints
  OrderApi.Live,         // HTTP endpoints
  UserApi.Live           // HTTP endpoints
).pipe(
  // Provide application core to adapters
  Layer.provide(ApplicationCoreLive)
)

// Final server with all layers composed
const ServerLive = HttpServer.layer(PrimaryAdaptersLive)

// Single provide at the edge
const runnable = HttpServer.serve.pipe(
  Effect.provide(ServerLive)
)
```

---

## Testing Strategies by Adapter Type

### Testing Secondary Adapters (Driven Side)

**Goal**: Verify adapters correctly implement the port contract

```typescript
// infrastructure/persistence/TaskRepository.postgres.test.ts
import { test } from "@effect/vitest"
import { Effect } from "effect"

// Test that Postgres adapter fulfills the contract
test.effect("should implement TaskRepository contract", () =>
  Effect.gen(function* () {
    // Use REAL postgres adapter
    const repo = yield* TaskRepository
    
    // Test contract compliance
    const task = new Task({ id: TaskId.make("1"), ... })
    yield* repo.save(task)
    
    const found = yield* repo.findById(task.id)
    assert.deepStrictEqual(found, task)
  }).pipe(
    Effect.provide(TaskRepositoryPostgresLive),
    Effect.provide(TestDatabase.layer) // Test DB
  )
)
```

### Testing Primary Adapters (Driving Side)

**Goal**: Verify adapters correctly translate external protocols to use cases

```typescript
// entrypoints/http/TaskController.test.ts
import { test } from "@effect/vitest"

// Test that HTTP adapter correctly drives the use case
test.effect("POST /tasks/:id/complete should call use case", () =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient
    
    // Make HTTP request (primary adapter)
    const response = yield* client.post("/tasks/123/complete")
    
    assert.strictEqual(response.status, 200)
    
    // Verify use case was executed
    const repo = yield* TaskRepository
    const task = yield* repo.findById("123" as TaskId)
    assert.strictEqual(task.status, "completed")
  }).pipe(
    // Use in-memory secondary adapters for fast tests
    Effect.provide(Layer.mergeAll(
      TaskApi.Live,              // Real primary adapter
      TaskRepositoryMemoryLive,  // Fake secondary adapter
      EmailServiceFakeLive       // Fake secondary adapter
    ))
  )
)
```

### Testing Use Cases (Primary Ports)

**Goal**: Test business logic in isolation

```typescript
// application/use-cases/CompleteTask.test.ts
import { test } from "@effect/vitest"

// Test the use case with fake secondary adapters
test.effect("should complete task and send email", () =>
  Effect.gen(function* () {
    const completeTask = yield* CompleteTaskUseCase
    const repo = yield* TaskRepository
    
    // Setup
    const task = new Task({ id: TaskId.make("1"), status: "pending", ... })
    yield* repo.save(task)
    
    // Execute use case
    yield* completeTask.execute(task.id)
    
    // Verify
    const updated = yield* repo.findById(task.id)
    assert.strictEqual(updated.status, "completed")
  }).pipe(
    Effect.provide(Layer.mergeAll(
      CompleteTaskUseCase.Default,
      TaskRepositoryMemoryLive,  // Fake
      EmailServiceFakeLive        // Fake
    ))
  )
)
```

---

## Summary: The Key Differences

| Aspect | Primary (Driving) | Secondary (Driven) |
|--------|------------------|-------------------|
| **Direction** | Outside → Application | Application → Outside |
| **Purpose** | Use the application | Satisfy application needs |
| **Location** | `entrypoints/` | `infrastructure/` |
| **Examples** | HTTP, CLI, GraphQL | Database, Email, Payment |
| **Defined By** | Use cases (what we offer) | Ports (what we need) |
| **Testing** | Verify protocol translation | Verify contract compliance |
| **Swapping** | Different UIs for same logic | Different DBs for same logic |

**Mental Model**:
- **Primary**: "How users/systems interact with us"
- **Secondary**: "How we interact with external systems"

**Effect Pattern**:
- **Primary**: Entry points call use case services
- **Secondary**: Use case services depend on port interfaces

Both sides are **adapters** connecting external systems to the core hexagon (application logic), but they face opposite directions.
