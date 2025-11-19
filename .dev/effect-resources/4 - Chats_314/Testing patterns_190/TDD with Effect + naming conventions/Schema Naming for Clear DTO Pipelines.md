---
modified: 2025-10-26T20:32:08-03:00
---
## Schema Naming for Clear DTO Pipelines

### The Pipeline Pattern: Input → Domain → Output

#### Input Layer (External → Internal)
- **`*Input`** - All external data entering the system (e.g., `CreateTaskInput`, `UpdateUserInput`, `LoginInput`)
- **`*Command`** - Complex operations with multiple steps (e.g., `ProcessOrderCommand`, `MigrateDataCommand`)
- **`*Query`** - Read operations with filters/params (e.g., `SearchTasksQuery`, `GetUserQuery`)

#### Domain Layer (Internal Processing)
- **Plain names** - Core domain models (e.g., `User`, `Task`, `Order`)
- **`*Id`** - Branded identifiers (e.g., `UserId`, `TaskId`)
- **Business types** - Domain primitives (e.g., `Email`, `Money`, `Percentage`)

#### Output Layer (Internal → External)
- **`*Output`** - Data leaving the system (e.g., `UserOutput`, `TaskListOutput`)
- **`*Event`** - Domain events for streaming/messaging (e.g., `TaskCreatedEvent`, `UserRegisteredEvent`)
- **`*Result`** - Operation results with metadata (e.g., `SearchResult`, `ValidationResult`)

### Why This Works for Pipelines

```typescript
// Clear flow: Input → Domain → Output
CreateTaskInput → Task → TaskOutput
UpdateUserInput → User → UserOutput
SearchTasksQuery → Task[] → TaskListOutput

// You can grep the entire pipeline:
rg "CreateTaskInput"  // Find where data enters
rg "Task[^a-zA-Z]"    // Find domain processing  
rg "TaskOutput"       // Find where data exits
```

### Service Method Signatures Become Self-Documenting

```typescript
interface TaskService {
  // Input → Domain
  create: (input: CreateTaskInput) => Effect.Effect<Task, CreateTaskError>
  
  // Query → Domain[]
  search: (query: SearchTasksQuery) => Effect.Effect<Task[], SearchError>
  
  // Command → Result
  process: (command: ProcessTaskCommand) => Effect.Effect<ProcessResult, ProcessError>
}

interface TaskAPI {
  // HTTP layer transforms Domain → Output
  POST: (input: CreateTaskInput) => Effect.Effect<TaskOutput, HttpError>
  GET: (query: SearchTasksQuery) => Effect.Effect<TaskListOutput, HttpError>
}
```

### Complete Pipeline Example

```typescript
// 1. External request arrives
const request: CreateTaskInput = await parseBody(req)

// 2. Validate and transform to domain
const task: Task = yield* taskService.create(request)

// 3. Transform for response
const response: TaskOutput = toOutput(task)

// 4. Emit event
yield* eventBus.publish(new TaskCreatedEvent(task))
```

This naming makes the data flow explicit and greppable at every stage of the pipeline.
