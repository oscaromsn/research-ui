---
modified: 2025-09-18T03:33:57-03:00
---
## TDD Philosophy in Effect: Build Contracts, Not Concrete Things

In traditional TDD, you write a failing test for a function, make it pass, and then refactor. With Effect, we elevate this principle:

1. **Define the Contract (The Interface):** Before writing any logic or tests, define what a piece of your system *should do* via a service interface (`Context.Tag`). This includes its methods, success types, and crucially, its specific, typed errors.
2. **Test the Contract:** Write tests that validate the behavior described by the interface. These tests are completely decoupled from any specific implementation.
3. **Implement the Contract:** Write a concrete implementation (a `Layer`) that satisfies the contract and makes the tests pass.

This workflow ensures your application is composed of modular, swappable components with clearly defined boundaries, leading to minimal technical debt and maximum confidence during refactoring.

---

## The Incremental TDD Cycle: A Vertical Slice Approach

For any new feature, follow this cycle. We'll use a concrete example: **"As a user, I want to mark a task as complete."**

### Step 0: The Feature Slice - Define the Scope

Before writing code, define the vertical slice of functionality.
- **User Story:** Mark a task as complete.
- **Acceptance Criteria:**
	- The task's status must change to `completed`.
	- A `completedAt` timestamp must be set.
	- An audit log/notification should be created.
	- It should fail if the task is already `cancelled`.
	- It should handle cases where the task doesn't exist.

### Step 1: The Domain Layer (The Foundation)

This is the "Red" phase for your system's design. You define the nouns and the potential problems.

1. **Define New Errors First:** What new failures can this feature introduce?
	- Create a new tagged error for invalid state transitions. This makes the business rule a first-class citizen of your domain.

	```typescript
    // src/domain/errors.ts
    import * as Data from 'effect/Data'

    export class InvalidStatusTransitionError extends Data.TaggedError('InvalidStatusTransitionError')<{
      readonly from: string
      readonly to: string
      readonly taskId: string
    }> {}
    ```

2. **Update Domain Models:** Does the core data model need to change?
	- Add the `completedAt` field to the `Task` schema. Since it's not always present, we make it optional.

	```typescript
    // src/domain/models.ts
    import * as S from 'effect/Schema'

    export const Task = S.Struct({
      // ... existing fields
      completedAt: S.optional(S.Date)
    })
    export type Task = S.Schema.Type<typeof Task>
    ```

**Type-Check Checkpoint #1 (Fastest Feedback Loop):**
Run `npx tsc --noEmit`. Before any tests, ensure your domain's types are coherent. This is your first and fastest line of defense.

### Step 2: The Contract Layer (The "Red" Test)

Now, define the contract for the service that will implement this logic and write tests for it.

1. **Update the Service Interface:** Add the `completeTask` method to your `TaskServiceInterface`. Its signature must include the new `InvalidStatusTransitionError`.

	```typescript
    // src/services/TaskService.interface.ts
    export interface TaskServiceInterface {
      // ... other methods
      readonly completeTask: (
        id: TaskId,
        version: number
      ) => Effect.Effect<Task, TaskNotFoundError | InvalidStatusTransitionError | ConcurrentModificationError>
    }
    ```

2. **Write the Contract Test:** In `TaskService.test.ts`, write tests for the `completeTask` contract. These tests will fail because no implementation exists.

	**Best Practice: Use In-Memory Fakes for Dependencies.** Your `TaskService` depends on a `TaskRepository`. To isolate the `TaskService` contract test, you provide a high-fidelity, in-memory fake `TaskRepository` layer. This is **not a mock**; it's a fully functional test double.

	```typescript
    // src/services/TaskService.test.ts
    import { describe, it, expect } from 'vitest'
    import * as Effect from 'effect/Effect'
    import * as Exit from 'effect/Exit'
    import { TaskService } from './TaskService.interface'
    import { InvalidStatusTransitionError } from '../domain/errors'
    
    // Assume createMockTaskRepository() provides a functional in-memory layer
    const testLayer = Layer.merge(
      createMockTaskRepository(), // Your in-memory repo
      TaskService.toLayer( /* Your NOT-YET-WRITTEN implementation */ )
    )

    it('should set the status to completed and add a completedAt timestamp', async () => {
      const program = Effect.gen(function* () {
        const service = yield* TaskService
        const repo = yield* TaskRepository
        
        // Arrange: Create a task to complete
        const task = yield* repo.create({ title: 'Finish TDD guide' })

        // Act
        const completed = yield* service.completeTask(task.id, task.version)

        // Assert
        expect(completed.status).toBe('completed')
        expect(completed.completedAt).toBeInstanceOf(Date)
      })
      // This test will fail until TaskServiceLive is implemented
      await Effect.runPromise(program.pipe(Effect.provide(testLayer)))
    })

    it('should fail with InvalidStatusTransitionError if the task is cancelled', async () => {
      const program = Effect.gen(function* () {
        const service = yield* TaskService
        const repo = yield* TaskRepository
        const task = yield* repo.create({ title: 'A task', status: 'cancelled' })
        
        // Act: This should fail
        return yield* service.completeTask(task.id, task.version)
      })

      const exit = await Effect.runPromiseExit(program.pipe(Effect.provide(testLayer)))
      
      // Assert
      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) {
        const error = Exit.causeSquash(exit.cause)
        expect(error).toBeInstanceOf(InvalidStatusTransitionError)
      }
    })
    ```

**Test-Run Checkpoint #1:**
Run `npm test -- TaskService.test.ts`. The tests **must fail** with an error like "Implementation missing" or a runtime error from an incomplete `Layer`. This confirms your test setup is correct.

### Step 3: The Implementation Layer (The "Green" Light)

Write the minimum amount of code in `TaskService.impl.ts` to make the failing tests pass.

1. **Create/Update the Implementation:**

	```typescript
    // src/services/TaskService.impl.ts
    import { TaskService } from './TaskService.interface'
    import { TaskRepository } from '../repositories/TaskRepository.interface'
    
    export const TaskServiceLive = Layer.effect(
      TaskService,
      Effect.gen(function* () {
        const repository = yield* TaskRepository
        
        return TaskService.of({
          // ... other methods
          completeTask: (id, version) => Effect.gen(function* () {
            const task = yield* repository.findById(id)
            if (task.status === 'cancelled') {
              return yield* Effect.fail(new InvalidStatusTransitionError({ ... }))
            }
            const completed = yield* repository.update(id, {
              status: 'completed',
              completedAt: new Date(),
              version
            })
            // Here you would also call the notification service
            return completed
          })
        })
      })
    )
    ```

**Test-Run Checkpoint #2:**
Run `npm test -- TaskService.test.ts` again. The tests should now **pass**. You have successfully implemented the feature slice according to its contract.

### Step 4: The Refactor Phase

With passing tests, you can now refactor the implementation with confidence.
- Is there duplicated logic? Extract it into a private helper function.
- Is the code hard to read? Restructure it.
- Could performance be better? Optimize the implementation.

Your tests are the safety net. As long as they continue to pass, your refactoring is successful.

### Step 5: Expand the Test Suite (Integration & E2E)

Once unit/contract tests for individual services are solid, you move up the testing pyramid.

1. **Integration Tests:**
	- **Goal:** Verify that multiple *real* (in-memory) services work together.
	- **Setup:** Compose your `TaskServiceLive` and `TaskRepositoryInMemory` layers together. If `TaskService` calls a `NotificationService`, you might use a **Shadow Service** mock for that external boundary.
	- **Example:** Create a test that calls the `TaskService.completeTask` and then uses the `TaskRepository` to verify the task was actually updated in the shared in-memory state.

	```typescript
    // src/app/integration.test.ts
    const AppLayer = TaskServiceLive.pipe(
      Layer.provide(TaskRepositoryInMemory),
      Layer.provide(NotificationServiceTest) // A test double for the external boundary
    )

    it('completes a task and sends a notification', async () => {
      // ... test logic using AppLayer ...
    })
    ```

2. **E2E Tests:**
	- **Goal:** Test the full application from the outside in.
	- **Setup:** Launch your entire application `Layer`, including the HTTP server layer, connected to a test database (e.g., in a Docker container).
	- **Example:** Use an HTTP client to send a `PATCH /tasks/:id/complete` request and verify the HTTP response and the state in the test database.

## The Continuous Testing Workflow

A developer's daily workflow should be centered around these fast feedback loops:

1. **Dual Terminal Setup:**
	- **Terminal 1:** `npx tsc --noEmit --watch`
		- This is your **primary, fastest test runner**. The compiler catches type errors, missing dependencies, and incorrect error channel types before you even save the file.
	- **Terminal 2:** `npm test -- --watch` (or `vitest --watch`)
		- This runs your unit/contract tests continuously. As you move from red to green, you get immediate feedback.

2. **The "Definition of Done" for a Feature:**
	- [x] All new/updated interfaces have contract tests.
	- [x] All contract tests pass with the new implementation.
	- [x] New integration tests cover the collaboration of services.
	- [x] E2E tests (if applicable) validate the happy path from the user's perspective.
	- [x] `npx tsc --noEmit` passes for the entire project.

By following this layered, interface-first TDD approach, you build your application from a solid foundation of well-defined, verifiable contracts. This methodology naturally leads to a modular, type-safe codebase where changes can be made with high confidence, minimizing technical debt and empowering developers to move fast without breaking things.
