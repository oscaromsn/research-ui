---
modified: 2025-09-18T03:15:40-03:00
---
# Effect testing pyramid

This structure is often visualized as a **Testing Pyramid**. For an Effect application, we can adapt this pyramid to a specific, highly effective model:

1. **Contract (Unit) Tests (The Foundation):** The largest and most important layer. These are extremely fast tests that validate the behavior of individual service *interfaces* using in-memory test doubles.
2. **Implementation (Unit) Tests:** A smaller, focused set of tests that run the same contract tests against your *production implementations*, mocking only their immediate dependencies.
3. **Integration Tests (The Middle Layer):** These tests verify that multiple services, when wired together, collaborate correctly to fulfill business logic. They use a mix of real in-memory implementations and test doubles for external boundaries.
4. **End-to-End (E2E) Tests (The Peak):** The smallest layer. These tests validate the entire application stack, from the HTTP API or CLI entry point down to the (test) database.

Here’s what this multi-layered suite looks like in practice for a greenfield Effect project.

---

### Layer 1: Contract Tests (Unit Tests for Interfaces)

This is the bedrock of your test suite. Instead of testing a concrete class, you test the abstract contract defined by your service interface (`Context.Tag`).

**What it Tests:**
- The public API of a service as defined by its interface.
- All success paths and, crucially, all defined failure types (`TaskNotFoundError`, `InvalidStatusTransitionError`, etc.).
- Business rules and invariants enforced by the service.

**Key Patterns and Tools:**
- **Test Doubles:** Use **live, in-memory fake implementations** of your services. These are not mocks from a library like Vitest's `vi.mock`; they are fully functional `Layer`s that use `Ref` or `Map` to simulate state. This is the idiomatic Effect approach.
- **Fixtures:** Generate consistent test data using helper functions or, even better, `Arbitrary.make(YourSchema)` for property-based testing scenarios.
- **Testing Failures:** Always use `Effect.exit` to wrap operations that are expected to fail. This captures the failure in an `Exit` value, allowing you to assert on the specific error type without crashing the test.
- **Reusable Contract Suites:** Define your tests in a generic function that accepts a `Layer` for the service under test. This allows you to reuse the exact same tests for both your fake implementation and your production implementation.

**Example: Testing the `TaskRepository` Contract**
This test suite validates that *any* implementation of `TaskRepository` behaves correctly.

```typescript
// src/repositories/TaskRepository.test.ts
import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { TaskRepository } from './TaskRepository.interface'
import { TaskNotFoundError, DuplicateTaskError } from '../domain/errors'
import { Task, TaskId } from '../domain/models'

// A reusable test suite for any TaskRepository implementation
const testRepositoryContract = (
  makeLayer: () => Layer.Layer<TaskRepository>
) => {
  it('should fail with DuplicateTaskError for duplicate IDs', async () => {
    const program = Effect.gen(function* () {
      const repo = yield* TaskRepository
      const task = { id: '123' as TaskId, ... }
      
      yield* repo.create(task)
      const exit = yield* Effect.exit(repo.create(task)) // Trigger failure

      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) {
        const error = Exit.causeSquash(exit.cause)
        expect(error).toBeInstanceOf(DuplicateTaskError)
      }
    })

    await Effect.runPromise(program.pipe(Effect.provide(makeLayer())))
  })

  // ... other contract tests for findById, update, etc.
}

// Now, run the contract suite against an in-memory fake
describe('TaskRepository Contract (InMemory)', () => {
  const makeInMemoryLayer = () => {
    // A fully functional in-memory implementation using Ref or Map
    return Layer.effect(TaskRepository, /*... in-memory logic ...*/)
  }
  
  testRepositoryContract(makeInMemoryLayer)
})
```

---

### Layer 2: Implementation Tests (Unit Tests for Concrete Code)

This layer ensures that your concrete production implementations (e.g., `TaskRepositoryPostgres`) adhere to the contract.

**What it Tests:**
- The specific logic within a production service implementation.
- How the implementation interacts with its *direct* dependencies.

**Key Patterns and Tools:**
- **Re-use Contract Tests:** The primary goal is to run the *exact same contract test suite* from Layer 1, but this time providing the production `Layer`.
- **Mocking Dependencies:** Your production implementation will have dependencies (e.g., a database client). Use `Layer.mock` to provide mock implementations for these dependencies. `Layer.mock` is excellent because it’s type-safe and will throw a defect if you call a method you haven't mocked, catching integration gaps.

**Example: Testing a `TaskService` Implementation**
The `TaskServiceLive` implementation depends on `TaskRepository` and `NotificationService`.

```typescript
// src/services/TaskService.impl.test.ts
import { TaskServiceLive } from './TaskService.impl'
import { TaskRepository } from '../repositories/TaskRepository.interface'
import { NotificationService } from './NotificationService.interface'

// Re-use the contract tests from the service interface test file
// testServiceContract(makeLiveLayer)

const makeLiveLayer = () => {
  // Create mock layers for the dependencies
  const mockRepoLayer = Layer.mock(TaskRepository, {
    // Mock only the methods needed for this test
    findById: () => Effect.succeed({ id: '1' as TaskId, ... })
  })

  const mockNotificationLayer = Layer.mock(NotificationService, {
    // Mock as a no-op for this test
    notifyTaskCompleted: () => Effect.void
  })
  
  // Provide the real service with its dependencies mocked
  return TaskServiceLive.pipe(
    Layer.provide(mockRepoLayer),
    Layer.provide(mockNotificationLayer)
  )
}
```

---

### Layer 3: Integration Tests

This is where you test the collaboration between multiple *real* services. You replace external boundaries (like databases, email providers) with high-fidelity fakes but use your actual business logic implementations.

**What it Tests:**
- The composition of multiple layers (`Layer.provide`, `Layer.merge`).
- The flow of data and errors between different services.
- Complex business workflows that involve several service interactions.

**Key Patterns and Tools:**
- **Compose Real Layers:** Use `Layer.provide` to build the dependency graph for the feature under test, using your real in-memory implementations (`TaskRepositoryInMemory`) where possible.
- **Shadow Services:** For verifying interactions with external systems (e.g., "was an email sent?"), use the **Shadow Service** pattern. This is the idiomatic alternative to traditional mocking/spying. You create a test-specific service that shares an instance with the production service, allowing you to track calls without altering production code.

**Example: Testing the Full Task Completion Flow**

```typescript
// src/app/integration.test.ts
import { TaskServiceLive } from '../services/TaskService.impl'
import { TaskRepositoryInMemory } from '../repositories/TaskRepository.impl'
import { NotificationServiceTest } from '../services/NotificationService.test-impl' // A shadow service

describe('Task Completion Flow', () => {
  // Compose the real service layers with a test double for the external boundary
  const AppLayer = TaskServiceLive.pipe(
    Layer.provide(TaskRepositoryInMemory),
    Layer.provide(NotificationServiceTest.layer) // Provide the shadow service
  )

  it('should create a task, complete it, and send a notification', async () => {
    await Effect.gen(function* () {
      const service = yield* TaskService
      
      const task = yield* service.createTask({ title: 'Integration Test' })
      const completed = yield* service.completeTask(task.id, task.version)
      
      // Use the shadow service to assert the notification was sent
      const wasNotified = yield* NotificationServiceTest.wasTaskCompleted(completed.id)
      expect(wasNotified).toBe(true)
      
      // Verify the final state in the in-memory repository
      const repo = yield* TaskRepository
      const finalTask = yield* repo.findById(completed.id)
      expect(finalTask.status).toBe('completed')
    }).pipe(
      Effect.provide(AppLayer),
      Effect.runPromise
    )
  })
})
```

---

### Layer 4: End-to-End (E2E) Tests

This final layer tests the application as a whole, from its public-facing API down to its persistent storage.

**What it Tests:**
- HTTP routes, CLI commands, or other application entry points.
- The entire dependency graph, including real database connections (against a test database).
- Serialization/deserialization logic (`Schema` decoding at the edges).

**Key Patterns and Tools:**
- **Test-Scoped Infrastructure:** Use tools like Docker Compose to spin up a test database for the duration of the test suite.
- **HTTP Client:** Use `@effect/platform/HttpClient` to make requests to your application's server.
- **`Layer.launch`:** Start your application's main `Layer` within the test to run a live server on a random port.
- **`TestClock`:** Use sparingly. E2E tests are where you might want to test real-world timing, but `TestClock` can still be useful for deterministic testing of cron jobs or long-polling features.

**Example: Testing a "Create Task" HTTP Endpoint**

```typescript
// src/http/routes.e2e.test.ts
import * as HttpServer from '@effect/platform/HttpServer'
import { NodeHttpServer } from '@effect/platform-node'

describe('POST /tasks', () => {
  it('should create a task and return 201', async () => {
    const program = Effect.gen(function* () {
      // Use a test client to interact with the server
      const client = yield* HttpServer.makeTestClient(MyHttpApp)
      
      const response = yield* client.post('/tasks', {
        body: HttpBody.json({ title: 'E2E Test' })
      })

      expect(response.status).toBe(201)
      const body = yield* response.json
      expect(body).toEqual({ id: expect.any(String), status: 'pending', ... })
    })

    // Provide the FULL application layer, including a real test DB connection
    await Effect.runPromise(program.pipe(Effect.provide(FullAppLayerTest)))
  })
})
```

By structuring your tests this way, you create a suite that is fast, reliable, and provides maximum confidence. Most of your development will happen in the fast feedback loop of the Contract and Implementation layers, while the Integration and E2E layers ensure everything works together as expected before a deployment.
