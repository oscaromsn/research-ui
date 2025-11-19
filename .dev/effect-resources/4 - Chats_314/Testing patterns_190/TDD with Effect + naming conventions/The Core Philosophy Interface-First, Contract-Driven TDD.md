---
modified: 2025-09-18T03:10:11-03:00
---
## The Core Philosophy: Interface-First, Contract-Driven TDD

The most effective TDD approach in Effect is **Interface-First Development**, also known as "Contract-First". The entire development process is guided by defining and testing contracts (service interfaces) before writing any concrete implementation. This ensures your application's architecture is driven by requirements, not implementation details.

**Key Principles:**

1. **Define "What," Not "How":** Start by defining the interfaces (`Context.Tag`) for your services. These interfaces are your contracts—they describe *what* a service does, not *how* it does it.
2. **Errors Are Part of the Interface:** Your domain errors are a critical part of your service's contract. Define them upfront as tagged errors (`Data.TaggedError`) so they are explicitly tracked by the TypeScript compiler in your service signatures.
3. **Test the Contract, Not the Implementation:** Your tests should validate the behavior described by the interface. This allows you to swap out implementations (e.g., from an in-memory test version to a production PostgreSQL version) without changing a single line of your tests.

This approach creates a powerful workflow that catches design issues early, enables confident refactoring, and produces loosely-coupled, highly-cohesive modules.

## The TDD Workflow in Practice

Let's walk through the recommended TDD cycle for a new feature, using the provided guides as a blueprint.

### Step 1: Define the Domain (The "Setup" Phase)

Before writing any tests, you define the language of your domain. This includes the data models and, crucially, all possible error types.

**Best Practice: Use `effect/Schema` and `Data.TaggedError`**

- **Models (`effect/Schema`):** Define your domain models like `Task` and `TaskId` using `Schema`. This gives you runtime validation, static types, and the ability to generate fixtures automatically.
- **Errors (`Data.TaggedError`):** Define all potential failures as tagged errors. This makes them a first-class part of your domain and enables exhaustive, type-safe error handling in both your application logic and your tests.

```typescript
// src/domain/errors.ts
import * as Data from 'effect/Data'

export class TaskNotFoundError extends Data.TaggedError('TaskNotFoundError')<{
  readonly taskId: string
}> {}

export class ConcurrentModificationError extends Data.TaggedError('ConcurrentModificationError')<{
  readonly taskId: string
}> {}

// src/domain/models.ts
import * as S from 'effect/Schema'

export const Task = S.Struct({ /* ... */ })
export type Task = S.Schema.Type<typeof Task>
```

### Step 2: Define the Service Contract (The "Red" Phase - Part 1)

Create the service interface (`Context.Tag`). This is the contract you will test against. It declares the functions, their inputs, and their possible success and failure types.

```typescript
// src/repositories/TaskRepository.interface.ts
import * as Effect from 'effect/Effect'
import * as Context from 'effect/Context'
// ... imports

export interface TaskRepositoryInterface {
  readonly findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>
  readonly update: (id: TaskId, data: UpdateTaskInput) => Effect.Effect<Task, TaskNotFoundError | ConcurrentModificationError>
  // ... other methods
}

export class TaskRepository extends Context.Tag('TaskRepository')<
  TaskRepository,
  TaskRepositoryInterface
>() {}
```

At this point, you have no implementation, but you have a clear, type-safe contract.

### Step 3: Write Tests Against the Contract

Now, write tests that verify the behavior described in the interface. These tests will naturally fail because no implementation exists yet.

**Best Practice: Test Universal Contracts**

Write a generic test suite that can be run against *any* implementation of the interface. This is the cornerstone of contract testing.

```typescript
// src/repositories/TaskRepository.test.ts

// This function tests ANY layer that provides a TaskRepository
const testRepositoryContract = (makeLayer: () => Layer.Layer<TaskRepository>) => {
  it('should fail with ConcurrentModificationError on stale version', async () => {
    const program = Effect.gen(function* () {
      const repo = yield* TaskRepository
      // ... test logic to trigger a concurrency error
    })

    const result = await Effect.runPromiseExit(
      program.pipe(Effect.provide(makeLayer()))
    )

    // Assert that the failure is of the correct type
    expect(Exit.isFailure(result)).toBe(true)
    if (Exit.isFailure(result)) {
      const error = Exit.causeSquash(result.cause)
      expect(error).toBeInstanceOf(ConcurrentModificationError)
    }
  })
}
```

### Step 4: Implement Test Doubles (The "Green" Phase for Tests)

To make your contract tests pass without a real database or external service, you create a **live test double**—a fully functional, in-memory implementation of your service. This is not a "mock" in the traditional sense; it's a complete, working fake that perfectly adheres to the contract.

**Best Practice: Use In-Memory Fakes over Mocks/Stubs**

Instead of using mocking libraries to stub individual methods, provide a complete, in-memory `Layer` for your service. This is Effect's idiomatic approach to test doubles.

- **Fixtures:** Use helper functions (`createTestTask`) or schema-based arbitraries (`Arbitrary.make(Task)`) to generate consistent test data.
- **Stubs/Mocks:** Your in-memory layer acts as both. It's a "stub" because it provides canned responses (from its internal state, like a `Map` or `Ref`) and a "mock" because you can inspect its state to verify behavior.

```typescript
// In your test file...
const createMockTaskRepository = (): Layer.Layer<TaskRepository> => {
  const tasks = new Map<string, Task>()
  
  return Layer.succeed(TaskRepository, {
    create: (task) => Effect.sync(() => {
      if (tasks.has(task.id)) throw new DuplicateTaskError({ taskId: task.id })
      tasks.set(task.id, task)
      return task
    }),
    // ... complete implementation using the in-memory map
  })
}

// Now you can run your contract tests against the fake
describe('TaskRepository Contract with In-Memory Fake', () => {
  testRepositoryContract(createMockTaskRepository)
})
```

Once these tests pass, you have validated two things:
1. Your contract is implementable.
2. Your test logic is correct.

### Step 5: Implement the Production Service (The "Green" Phase for Code)

Now, write your production implementation (e.g., `TaskRepositoryPostgres`). The goal is to make the *exact same contract tests* pass, this time by providing the production layer.

```typescript
// In a separate test file for the real implementation
describe('TaskRepositoryPostgres Implementation', () => {
  // Assume TaskRepositoryPostgres is your real layer
  testRepositoryContract(() => TaskRepositoryPostgres)
})
```

### Advanced Testing Patterns

#### 1. Testing Failures with `Effect.exit`

To test for specific failures without crashing your test runner, always wrap the fallible operation in `Effect.exit`. This transforms the Effect into one that never fails, instead returning an `Exit` value that you can safely inspect.

```typescript
it('should fail with the correct error', async () => {
  await Effect.gen(function* () {
    const result = yield* Effect.exit(fallibleOperation())
    
    expect(Exit.isFailure(result)).toBe(true)
    if (Exit.isFailure(result)) {
      const error = Exit.causeSquash(result.cause)
      expect(error).toBeInstanceOf(ExpectedErrorType)
    }
  }).pipe(
    Effect.provide(/* ... */),
    Effect.runPromise
  )
})
```

#### 2. Controlling Time with `TestClock`

For any logic involving timeouts, scheduling, or delays, provide the `TestContext.TestContext` layer. This replaces the live `Clock` with a `TestClock` that you control manually.

```typescript
it('should time out after 10 minutes', async () => {
  await Effect.gen(function* () {
    const fiber = yield* Effect.fork(operationWithTimeout())
    
    // Manually advance time
    yield* TestClock.adjust(Duration.minutes(10))
    
    const exit = yield* Fiber.await(fiber)
    expect(Exit.isFailure(exit)).toBe(true)
    // ... assert on timeout error
  }).pipe(
    Effect.provide(TestContext.TestContext),
    Effect.runPromise
  )
})
```

#### 3. Behavioral Verification with "Shadow Services"

For cases where you need to verify that a side effect *was called* (e.g., an email was sent), the best practice is to use a **Shadow Service**. This is a test-specific service that implements both the production interface and an extended test interface for assertions.

This pattern is superior to traditional mocking because it's fully type-safe and integrated with Effect's dependency injection system.

```typescript
// 1. Define the test service interface, extending the original
class TestMailer extends Effect.Tag("TestMailer")<
  TestMailer,
  {
    sentEmailTo: (email: EmailAddress) => Effect.Effect<boolean>
  } & Context.Tag.Service<Mailer> // Inherits `sendEmail`
>() {}

// 2. Create a layer that provides BOTH services with a shared instance
const LiveTestMailer = Layer.unwrapEffect(
  Effect.sync(() => {
    const sentMails: Email<any>[] = []
    const implementation = TestMailer.of({
      sendEmail: email => Effect.sync(() => sentMails.push(email)),
      sentEmailTo: email => Effect.sync(() => sentMails.some(m => m.recipient === email))
    })
    return Layer.mergeAll(
      Layer.succeed(Mailer, implementation),
      Layer.succeed(TestMailer, implementation)
    )
  })
)

// 3. Use in a test
it('sends an email to non-paying users', async () => {
  await Effect.gen(function* () {
    yield* sendBuySubscriptionEmail // This uses the real `Mailer` tag
    
    // But we can assert using the `TestMailer` tag
    const wasSent = yield* TestMailer.sentEmailTo(nonSubscribedUser.email)
    expect(wasSent).toBe(true)
  }).pipe(
    Effect.provide(LiveTestMailer),
    Effect.runPromise
  )
})
```

## Summary of Best Practices

| Concept | Best Practice | Why? |
| :--- | :--- | :--- |
| **TDD Approach** | **Interface-First / Contract-Driven** | Decouples design from implementation, promotes test reusability, and enables confident refactoring. |
| **Fixtures** | **Helper functions or `Arbitrary.make(Schema)`** | Provides consistent, type-safe test data. Schema-based generation is powerful for complex models. |
| **Test Doubles** | **Live, in-memory `Layer` implementations** | More robust and realistic than method-level mocks. Fully functional fakes that adhere to the contract. |
| **Stubs** | Your in-memory layer naturally acts as a stub by providing pre-determined responses from its state (e.g., a `Map`). | Simple, effective, and fully type-safe. |
| **Mocks** | **Shadow Services** | The idiomatic way to test interactions (e.g., "was this function called?"). It's type-safe and avoids fragile, string-based mocking. |
| **Failure Testing** | Use **`Effect.exit`** to capture all outcomes. | Prevents test crashes and allows precise assertions on specific error types (`fail`, `die`, `interrupt`). |
| **Time Testing** | Use **`TestClock`** via `TestContext.TestContext` | Provides deterministic and instant control over time-based logic without `setTimeout` or real delays. |
| **Test Structure** | Follow the **`Effect.gen -> Effect.provide -> Effect.runPromise`** pattern. | Ensures consistency, readability, and proper dependency management for every test. |

By adopting this interface-first TDD workflow and leveraging Effect's specialized testing tools, you create a powerful development cycle that produces robust, maintainable, and thoroughly tested applications from the ground up.
