---
modified: 2025-09-18T03:49:27-03:00
---
The ideal structure is a blend of **Hexagonal Architecture (Ports and Adapters)** and **Domain-Driven Design (DDD)** principles, organized by feature or module. This creates a codebase that is self-explanatory, scalable, and naturally encourages good testing practices.

---

### The Guiding Philosophy: Separate "What" from "How"

The directory structure should physically separate the *contracts* (interfaces, or "ports") from their *implementations* (concrete logic, or "adapters").

- **Core Business Logic (`src/modules`):** Contains the application's features and domain logic. It should be pure and have no knowledge of external technologies like databases or HTTP frameworks.
- **Infrastructure (`src/infrastructure`):** Contains the concrete implementations of external-facing concerns (e.g., PostgreSQL repository, an S3 file storage client). It *implements* the interfaces defined in the core logic.
- **Entrypoints (`src/entrypoints`):** Contains the code that initializes and runs the application (e.g., the HTTP server or CLI command runner). This is where the application's dependency graph is composed and provided.

---

### Recommended Directory Structure

Here is a scalable and intuitive structure that enforces the TDD workflow.

```plaintext
task-api/
├── src/
│   ├── domain/                  # 1. Core Domain: Shared, pure models and errors. No dependencies.
│   │   ├── models.ts            # (e.g., Task, TaskId, TaskStatus schemas)
│   │   └── errors.ts            # (e.g., TaskNotFoundError, InvalidStatusTransitionError)
│   │
│   ├── modules/                 # 2. Business Logic: Organized by feature/domain.
│   │   └── tasks/               # (Example: "tasks" module)
│   │       │
│   │       ├── services/
│   │       │   ├── TaskService.interface.ts    # The "What": Contract for business logic.
│   │       │   ├── TaskService.impl.ts         # The "How": Production implementation.
│   │       │   ├── TaskService.test.ts         # The contract test (tests the interface).
│   │       │   └── fixtures.ts                 # Test data/fixtures for this service.
│   │       │
│   │       ├── repositories/
│   │       │   ├── TaskRepository.interface.ts # The "What": Contract for data access.
│   │       │   └── TaskRepository.test.ts      # The contract test.
│   │       │
│   │       └── index.ts             # Exports the public API of the 'tasks' module (interfaces, layers).
│   │
│   ├── infrastructure/          # 3. Adapters: Concrete implementations of interfaces.
│   │   ├── database/
│   │   │   └── TaskRepository.postgres.ts # Implements TaskRepository.interface.ts
│   │   ├── notifications/
│   │   │   └── NotificationService.smtp.ts    # Implements NotificationService.interface.ts
│   │   └── testing/
│   │       └── TaskRepository.in-memory.ts  # In-memory test double for TaskRepository.
│   │
│   ├── entrypoints/             # 4. Application Wiring & Startup.
│   │   ├── http/
│   │   │   ├── server.ts          # Wires up layers, creates the HTTP app.
│   │   │   ├── routes.ts          # Defines HTTP routes, depends on service interfaces.
│   │   │   └── routes.e2e.test.ts # End-to-end tests for the HTTP API.
│   │   └── cli/
│   │       └── main.ts            # Main entrypoint for a CLI application.
│   │
│   └── shared/                  # 5. Shared Utilities: Code not specific to any domain.
│       ├── lib/                 # (e.g., custom Effect combinators, date helpers)
│       └── testing/             # (e.g., shared test helpers, custom matchers)
│
└── vitest.config.ts
└── tsconfig.json
└── package.json
```

### How This Structure Enforces the TDD Workflow

Let's walk through building a new feature—**"updating a task's title"**—using this structure.

#### Step 1: Define the Domain (If Needed)

If updating a title introduces new errors (e.g., `TitleTooShortError`), you'd first define it in `src/domain/errors.ts`. This step is often skipped for simple features.

#### Step 2: Define the Contract (`.interface.ts`)

You open `src/modules/tasks/services/TaskService.interface.ts` and add the new method to the contract. The file's name and location clearly tell you: "Define the public API here."

```typescript
// src/modules/tasks/services/TaskService.interface.ts
export interface TaskServiceInterface {
  // ... existing methods
  readonly updateTask: (
    id: TaskId,
    input: UpdateTaskInput
  ) => Effect.Effect<Task, TaskNotFoundError | InvalidTaskDataError | ConcurrentModificationError>;
}
```

#### Step 3: Write the Contract Test (`.test.ts`)

Next, you open the colocated `TaskService.test.ts` file. The structure prompts you to write a test for the new `updateTask` contract before you've written a single line of implementation logic.

You will use your in-memory test double from `src/infrastructure/testing/TaskRepository.in-memory.ts`.

```typescript
// src/modules/tasks/services/TaskService.test.ts
describe('TaskService Contract', () => {
  describe('updateTask', () => {
    it('should update the title and increment the version', async () => {
      // Setup using your in-memory repository fake
      // ...
      // Act: call the service method
      // Assert: check the result
    });

    it('should fail if the title is empty', async () => {
      // ... test for InvalidTaskDataError
    });
  });
});
```

At this stage, the test fails because `TaskService.impl.ts` doesn't have the `updateTask` method yet. **This is the "Red" in TDD.**

#### Step 4: Write the Implementation (`.impl.ts`)

You now open `src/modules/tasks/services/TaskService.impl.ts` and write the code to make the tests pass. The structure has guided you perfectly: you know exactly which file to modify and what your goal is.

```typescript
// src/modules/tasks/services/TaskService.impl.ts
export const TaskServiceLive = Layer.effect(
  TaskService,
  Effect.gen(function* () {
    const repository = yield* TaskRepository;
    return TaskService.of({
      // ... existing methods
      updateTask: (id, input) => { /* ... implementation logic ... */ }
    });
  })
);
```

Once you save, your watch-mode test runner shows the tests passing. **This is the "Green" in TDD.**

#### Step 5: Refactor

With passing tests, you can refactor the implementation in `.impl.ts` confidently, knowing your contract tests in `.test.ts` will catch any regressions.

#### Step 6: Wire It Up (`entrypoints/`)

Finally, you expose the new functionality through an entrypoint, like an HTTP route.

```typescript
// src/entrypoints/http/routes.ts
router.patch('/tasks/:id', (req) => Effect.gen(function* () {
  const service = yield* TaskService;
  const id = req.params.id as TaskId;
  const body = yield* req.json; // Assuming schema validation middleware
  const updatedTask = yield* service.updateTask(id, body);
  return HttpServerResponse.json(updatedTask);
}));
```

An E2E test in `routes.e2e.test.ts` would then verify this endpoint.

### Why This Structure is Effective

1. **Intuitive for Onboarding:**
	- A new developer wants to know what `TaskService` does? They open `TaskService.interface.ts`.
	- They want to see *how* it's supposed to behave? They open `TaskService.test.ts`.
	- They only need to look at `TaskService.impl.ts` for implementation details.
	- The separation is clean, logical, and reduces cognitive load.

2. **Enforces Modularity and Decoupling:**
	- The `modules` directory cannot import from `infrastructure` or `entrypoints`. This is your primary architectural rule and can be enforced with ESLint rules (`eslint-plugin-import`).
	- Services depend on interfaces (`TaskRepository`), not concrete implementations (`TaskRepositoryPostgres`). This makes swapping implementations trivial. Want to switch from Postgres to DynamoDB? Just create a new file in `infrastructure/database` and change a single line in your main `entrypoints/http/server.ts` file where the layers are provided.

3. **Balances Correctness and Speed:**
	- **Speed:** Developers work primarily within a single module folder (`src/modules/tasks/`), with fast-running contract tests that use in-memory fakes. This creates a very tight TDD feedback loop.
	- **Correctness:** The contract tests ensure that any implementation—fake or real—is correct. Integration and E2E tests then verify the composition of these correct components.

4. **Scalability:**
	- Adding a new feature module (e.g., `users`) is as simple as creating a new folder under `src/modules/`. It remains isolated from `tasks` unless an explicit dependency is introduced via interfaces.
	- Teams can work on different modules in parallel with minimal risk of conflicts, as their primary point of interaction is the stable set of interfaces.

This directory structure is more than just file organization; it's a physical manifestation of a clean, test-driven, and interface-oriented architecture. It guides developers toward writing maintainable, composable, and robust code by making the "right way" the "easy way."
