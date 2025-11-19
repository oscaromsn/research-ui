---
modified: 2025-10-26T14:19:20-03:00
---
# Optimal Hexagonal Architecture with Effect: Layer Composition Strategy

Based on the project knowledge, here's the comprehensive approach to structuring an Effect application with hexagonal architecture:

## Directory Structure: Physical Separation of Concerns

```typescript
project/
├── src/
│   ├── domain/                    # Core - Zero dependencies
│   │   ├── models.ts              # Pure domain entities (Schema.Class)
│   │   ├── errors.ts              # Domain errors (Data.TaggedError)
│   │   └── rules.ts               # Pure business logic functions
│   │
│   ├── application/               # Use Cases & Ports
│   │   ├── ports/                 # Interfaces (contracts)
│   │   │   ├── TaskRepository.ts  # Interface + Context.Tag
│   │   │   ├── EmailService.ts    # Interface + Context.Tag
│   │   │   └── PaymentGateway.ts  # Interface + Context.Tag
│   │   │
│   │   └── services/              # Application services (orchestration)
│   │       ├── CreateTask.ts      # Use case as service
│   │       ├── CreateTask.test.ts # Contract tests with test doubles
│   │       └── index.ts           # Public API
│   │
│   ├── infrastructure/            # Adapters (implementations)
│   │   ├── persistence/
│   │   │   ├── TaskRepository.postgres.ts
│   │   │   └── TaskRepository.postgres.layer.ts
│   │   │
│   │   ├── messaging/
│   │   │   ├── EmailService.smtp.ts
│   │   │   └── EmailService.smtp.layer.ts
│   │   │
│   │   ├── payment/
│   │   │   ├── PaymentGateway.stripe.ts
│   │   │   └── PaymentGateway.stripe.layer.ts
│   │   │
│   │   └── testing/               # Test implementations (fakes)
│   │       ├── TaskRepository.memory.ts
│   │       ├── EmailService.fake.ts
│   │       └── PaymentGateway.fake.ts
│   │
│   └── entrypoints/               # Application wiring
│       ├── http/
│       │   ├── server.ts          # Layer composition happens HERE
│       │   ├── routes.ts          # Depends on application services
│       │   └── server.e2e.test.ts
│       │
│       └── cli/
│           └── main.ts
│
└── tests/
    └── integration/               # Cross-boundary tests
```

---

## Layer Composition Strategy: The Four-Tier Approach

### Tier 1: Domain Layer (No Dependencies)

**Pure business logic with zero Effect dependencies:**

```typescript
// domain/models.ts
import { Schema } from "@effect/schema"
import { Brand } from "effect"

export type TaskId = string & Brand.Brand<"TaskId">
export const TaskId = Brand.nominal<TaskId>()

export class Task extends Schema.Class<Task>("Task")({
  id: Schema.String.pipe(Schema.brand("TaskId")),
  title: Schema.String.pipe(Schema.minLength(3)),
  status: Schema.Literal("pending", "completed"),
  createdAt: Schema.DateTimeUtc
}) {}

// domain/rules.ts - Pure functions, no Effect
export const canCompleteTask = (task: Task): boolean =>
  task.status === "pending"

export const calculatePriority = (task: Task): number => {
  // Pure domain logic
  const daysSinceCreation = 
    (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceCreation * 1.5
}

// domain/errors.ts
import { Data } from "effect"

export class TaskNotFoundError extends Data.TaggedError("TaskNotFoundError")<{
  taskId: TaskId
}> {}

export class InvalidTaskTransitionError extends Data.TaggedError("InvalidTaskTransition")<{
  from: Task["status"]
  to: Task["status"]
}> {}
```

### Tier 2: Application Layer (Ports + Use Cases)

**Define interfaces (ports) and orchestration logic:**

```typescript
// application/ports/TaskRepository.ts
import { Effect, Context } from "effect"
import type { Task, TaskId } from "../../domain/models"
import type { TaskNotFoundError } from "../../domain/errors"

// The PORT (interface)
export interface TaskRepository {
  readonly findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>
  readonly save: (task: Task) => Effect.Effect<void>
  readonly findAll: () => Effect.Effect<Task[]>
}

// The TAG (dependency identifier)
export class TaskRepository extends Context.Tag("TaskRepository")
  TaskRepository,
  TaskRepository
>() {}

// application/ports/EmailService.ts
export interface EmailService {
  readonly sendTaskCompletedEmail: (
    task: Task
  ) => Effect.Effect<void, EmailError>
}

export class EmailService extends Context.Tag("EmailService")
  EmailService,
  EmailService
>() {}

// application/services/CompleteTask.ts
import { Effect } from "effect"
import { TaskRepository } from "../ports/TaskRepository"
import { EmailService } from "../ports/EmailService"
import { canCompleteTask } from "../../domain/rules"

// Use case as Effect.Service (modern pattern)
export class CompleteTaskService extends Effect.Service<CompleteTaskService>()(
  "CompleteTaskService",
  {
    // Declare dependencies
    dependencies: [TaskRepository.Default, EmailService.Default],
    
    effect: Effect.gen(function* () {
      // Acquire dependencies during layer construction
      const taskRepo = yield* TaskRepository
      const emailService = yield* EmailService
      
      // Return the service interface
      return {
        execute: (taskId: TaskId) =>
          Effect.gen(function* () {
            // 1. Load domain entity
            const task = yield* taskRepo.findById(taskId)
            
            // 2. Apply pure domain rule
            if (!canCompleteTask(task)) {
              return yield* Effect.fail(
                new InvalidTaskTransitionError({
                  from: task.status,
                  to: "completed"
                })
              )
            }
            
            // 3. Update entity (pure)
            const completedTask = new Task({
              ...task,
              status: "completed"
            })
            
            // 4. Persist
            yield* taskRepo.save(completedTask)
            
            // 5. Side effect via port
            yield* emailService.sendTaskCompletedEmail(completedTask)
          })
      }
    })
  }
) {}

// application/services/index.ts - Public API
export { CompleteTaskService } from "./CompleteTask"
export { CreateTaskService } from "./CreateTask"
```

### Tier 3: Infrastructure Layer (Adapters)

**Concrete implementations with local dependency resolution:**

```typescript
// infrastructure/persistence/TaskRepository.postgres.ts
import { Effect, Layer } from "effect"
import { TaskRepository } from "../../application/ports/TaskRepository"
import { SqlClient } from "@effect/sql"

// Internal implementation (not exported)
const makeTaskRepositoryPostgres = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  
  return TaskRepository.of({
    findById: (id) =>
      Effect.gen(function* () {
        const rows = yield* sql`SELECT * FROM tasks WHERE id = ${id}`
        if (rows.length === 0) {
          return yield* Effect.fail(new TaskNotFoundError({ taskId: id }))
        }
        return Task.make(rows[0]) // Use Schema decoder
      }),
      
    save: (task) =>
      sql`
        INSERT INTO tasks (id, title, status, created_at)
        VALUES (${task.id}, ${task.title}, ${task.status}, ${task.createdAt})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          status = EXCLUDED.status
      `.pipe(Effect.asVoid),
      
    findAll: () =>
      sql<Task[]>`SELECT * FROM tasks`.pipe(
        Effect.map((rows) => rows.map(Task.make))
      )
  })
})

// PUBLIC: Layer with dependencies resolved locally
export const TaskRepositoryPostgresLive = Layer.effect(
  TaskRepository,
  makeTaskRepositoryPostgres
).pipe(
  // LOCAL DEPENDENCY ELIMINATION
  Layer.provide(SqlClient.layer(/* config */))
)

// Type: Layer<TaskRepository, never, never>
// ✅ SqlClient dependency is hidden from consumers!
```

```typescript
// infrastructure/messaging/EmailService.smtp.ts
import { Effect, Layer } from "effect"
import { EmailService } from "../../application/ports/EmailService"
import { NodeMailer } from "./nodemailer-client"

const makeEmailServiceSmtp = Effect.gen(function* () {
  const mailer = yield* NodeMailer
  const config = yield* EmailConfig
  
  return EmailService.of({
    sendTaskCompletedEmail: (task) =>
      Effect.gen(function* () {
        yield* mailer.send({
          to: config.defaultRecipient,
          subject: `Task Completed: ${task.title}`,
          body: `Task ${task.id} has been completed.`
        })
      })
  })
})

export const EmailServiceSmtpLive = Layer.effect(
  EmailService,
  makeEmailServiceSmtp
).pipe(
  // Provide dependencies locally
  Layer.provide(NodeMailerLive),
  Layer.provide(EmailConfigLive)
)
// Type: Layer<EmailService, never, never>
```

```typescript
// infrastructure/testing/TaskRepository.memory.ts
import { Effect, Layer, Ref } from "effect"
import { TaskRepository } from "../../application/ports/TaskRepository"

// In-memory fake for testing
export const TaskRepositoryMemoryLive = Layer.effect(
  TaskRepository,
  Effect.gen(function* () {
    // State lives in Ref
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
        
      findAll: () =>
        Ref.get(tasks).pipe(Effect.map((map) => Array.from(map.values())))
    })
  })
)
// Type: Layer<TaskRepository, never, never>
// Same interface, different implementation!
```

### Tier 4: Entrypoint Layer (Composition Root)

**Single point where all layers are composed:**

```typescript
// entrypoints/http/server.ts
import { Effect, Layer } from "effect"
import { HttpServer } from "@effect/platform"

// Import ONLY the public layers
import { TaskRepositoryPostgresLive } from "../../infrastructure/persistence/TaskRepository.postgres.layer"
import { EmailServiceSmtpLive } from "../../infrastructure/messaging/EmailService.smtp.layer"
import { CompleteTaskService } from "../../application/services"

// ===== COMPOSITION ROOT =====
// This is the ONLY place where we choose implementations

// 1. Infrastructure Layer (adapters)
const InfrastructureLive = Layer.mergeAll(
  TaskRepositoryPostgresLive,  // Already self-contained
  EmailServiceSmtpLive          // Already self-contained
)

// 2. Application Layer (use cases)
const ApplicationLive = Layer.mergeAll(
  CompleteTaskService.Default
  // CompleteTaskService already declares dependencies on
  // TaskRepository and EmailService - they'll be satisfied
  // from InfrastructureLive
).pipe(
  Layer.provide(InfrastructureLive)
)

// 3. HTTP Layer (routes)
const HttpLive = Layer.effect(
  HttpServer.HttpServer,
  Effect.gen(function* () {
    const completeTask = yield* CompleteTaskService
    
    return HttpServer.router.empty.pipe(
      HttpServer.router.post(
        "/tasks/:id/complete",
        Effect.gen(function* () {
          const { id } = yield* HttpServer.params
          yield* completeTask.execute(id as TaskId)
          return HttpServer.response.empty()
        })
      )
    )
  })
).pipe(
  Layer.provide(ApplicationLive)
)

// 4. SINGLE provide call at application edge
const runnable = HttpServer.serve.pipe(
  Effect.provide(HttpLive)
)

// 5. Run the effect
Effect.runPromise(runnable)
```

```typescript
// entrypoints/http/server.test.ts - E2E with test layers
import { test } from "@effect/vitest"
import { Layer } from "effect"

// Import test implementations
import { TaskRepositoryMemoryLive } from "../../infrastructure/testing/TaskRepository.memory"
import { EmailServiceFakeLive } from "../../infrastructure/testing/EmailService.fake"

// Same structure, different adapters
const TestInfrastructure = Layer.mergeAll(
  TaskRepositoryMemoryLive,   // In-memory
  EmailServiceFakeLive         // Fake email
)

const TestApplication = Layer.mergeAll(
  CompleteTaskService.Default
).pipe(
  Layer.provide(TestInfrastructure)  // Swap infrastructure!
)

test.effect("should complete task", () =>
  Effect.gen(function* () {
    const completeTask = yield* CompleteTaskService
    
    // Test uses the same application logic
    // but with in-memory implementations
    yield* completeTask.execute(TaskId.make("task-1"))
    
    // Assertions...
  }).pipe(
    Effect.provide(TestApplication)  // Provide test stack
  )
)
```

---

## Key Principles for Hexagonal + Effect

### 1. **Dependency Flow Rules (Enforced by Types)**

```
domain        ← application    ← infrastructure    ← entrypoints
(no deps)       (ports only)      (implements)       (composes)
   ↑                ↑                  ↑                  ↑
   └────────────────┴──────────────────┴──────────────────┘
                All depend on domain
```

**Enforcement via ESLint:**

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        {
          group: ["**/infrastructure/**"],
          message: "Domain/Application cannot import infrastructure"
        },
        {
          group: ["**/entrypoints/**"],
          message: "Core layers cannot import entrypoints"
        }
      ]
    }]
  }
}
```

### 2. **Local Dependency Elimination (Critical)**

Each adapter layer should hide its internal dependencies:

```typescript
// ❌ BAD: Leaks internal dependency
export const TaskRepositoryPostgresLive = Layer.effect(
  TaskRepository,
  makeTaskRepositoryPostgres
)
// Type: Layer<TaskRepository, never, SqlClient>
// Consumers must provide SqlClient!

// ✅ GOOD: Self-contained
export const TaskRepositoryPostgresLive = Layer.effect(
  TaskRepository,
  makeTaskRepositoryPostgres
).pipe(
  Layer.provide(SqlClientLive)  // Provided HERE
)
// Type: Layer<TaskRepository, never, never>
// Consumers just get TaskRepository
```

### 3. **Testing Strategy by Layer**

| Layer | Test Type | Test Double Strategy |
|-------|-----------|---------------------|
| **Domain** | Unit tests | None (pure functions) |
| **Application** | Contract tests | Full in-memory fakes implementing port interfaces |
| **Infrastructure** | Integration tests | Real external systems (test databases, etc.) |
| **Entrypoints** | E2E tests | Swap infrastructure layer with test doubles |

**Contract Test Example:**

```typescript
// application/services/CompleteTask.test.ts
import { test } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { TaskRepositoryMemoryLive } from "../../infrastructure/testing/TaskRepository.memory"
import { EmailServiceFakeLive } from "../../infrastructure/testing/EmailService.fake"

// Test layer with fakes
const TestLayer = Layer.mergeAll(
  TaskRepositoryMemoryLive,
  EmailServiceFakeLive
).pipe(
  Layer.provideMerge(CompleteTaskService.Default)
)

test.effect("should complete pending task", () =>
  Effect.gen(function* () {
    const taskRepo = yield* TaskRepository
    const completeTask = yield* CompleteTaskService
    
    // Setup
    const task = new Task({ id: TaskId.make("1"), status: "pending", ... })
    yield* taskRepo.save(task)
    
    // Execute
    yield* completeTask.execute(task.id)
    
    // Verify
    const updated = yield* taskRepo.findById(task.id)
    assert.strictEqual(updated.status, "completed")
  }).pipe(Effect.provide(TestLayer))
)
```

### 4. **Service Granularity in Hexagonal Context**

```typescript
// Application Layer Services = Use Cases
// One service per use case (vertical slice)

application/services/
├── CompleteTask.ts      // Single responsibility
├── CreateTask.ts        // Single responsibility
├── AssignTask.ts        // Single responsibility
└── ListUserTasks.ts     // Query use case

// NOT:
// ❌ TaskService.ts with 20 methods
```

### 5. **Anti-Corruption Layer Pattern**

When integrating external systems with complex models:

```typescript
// infrastructure/external/LegacySystem.adapter.ts
export const LegacySystemAdapter = Layer.effect(
  ModernPort,
  Effect.gen(function* () {
    const legacyClient = yield* LegacySystemClient
    
    return ModernPort.of({
      // Translate from legacy model to domain model
      fetchData: (id) =>
        legacyClient.getData(id).pipe(
          Effect.map(legacyToModern),  // Translation layer
          Effect.mapError(legacyErrorToDomainError)
        )
    })
  })
)
```

---

## Summary: The Optimal Pattern

1. **Domain**: Pure logic, zero dependencies
2. **Application**: Ports (interfaces) + use cases (orchestration using ports)
3. **Infrastructure**: Adapters implementing ports, with **local dependency elimination**
4. **Entrypoints**: Single composition root, swap layers for test vs prod

**The Golden Rules:**
- ✅ One `Effect.provide` call at the application edge
- ✅ Each adapter layer provides its own dependencies locally
- ✅ Application layer depends only on port interfaces
- ✅ Domain layer has zero Effect dependencies
- ✅ Test by swapping infrastructure layers, not mocking methods

This structure gives you:
- **Testability**: Swap layers at boundaries
- **Maintainability**: Changes isolated to single layer
- **Clarity**: Physical structure mirrors logical architecture
- **Type safety**: Compiler enforces dependency rules
- **Flexibility**: Swap implementations without touching business logic
