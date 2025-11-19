---
modified: 2025-10-26T16:58:04-03:00
---
## Interface-First vs Contract-Driven: The Distinction

### **Interface-First Development**
Emphasizes **WHAT** you're building:

- **Focuses on:** Defining the service interface (`Effect.Service` or `Context.Tag`) as the first step
- **Key artifact:** The TypeScript interface that declares methods, their inputs, and their `Effect<A, E, R>` signatures
- **Purpose:** Separates design from implementation - you define the API surface before writing any code

```typescript
// Interface-First: Start here
export class EmailService extends Effect.Service<EmailService>()("app/EmailService", {
  effect: Effect.gen(function* () {
    return {
      // The interface IS the contract
      send: (to: string, body: string): Effect.Effect<void, SendError> => 
        Effect.fail(new SendError())
    }
  })
}) {}
```

### **Contract-Driven Development**
Emphasizes **TESTING** what you've defined:

- **Focuses on:** Testing the behavioral expectations encoded in the interface
- **Key artifact:** Universal contract tests that work against ANY implementation
- **Purpose:** Ensures all implementations (test doubles, mocks, production) adhere to the same behavioral contract

```typescript
// Contract-Driven: Test the contract universally
const testEmailServiceContract = (makeLayer: () => Layer<EmailService>) => {
  it.effect("should fail with SendError when SMTP unavailable", () =>
    Effect.gen(function* () {
      const email = yield* EmailService;
      const exit = yield* Effect.exit(email.send("test@test.com", "body"));
      
      assert.isTrue(Exit.isFailure(exit));
      // Verify the contract's error guarantees
    }).pipe(Effect.provide(makeLayer()))
  );
};
```

## The Unified "Interface-First, Contract-Driven" Approach

In Effect-TS, these aren't competing methodologies—they're **complementary phases** of the same workflow:

### Phase 1: Interface-First (Definition)
1. **Define errors** as `Data.TaggedError` - they're part of the contract
2. **Define the service interface** - declares the "what"
3. **The `Effect<A, E, R>` type signature IS the contract**

### Phase 2: Contract-Driven (Verification)
1. **Write tests against the interface** - verify the behavioral contract
2. **Tests must be implementation-agnostic** - they test the contract, not how it's fulfilled
3. **Same tests run against test doubles AND production layers** - proving contract adherence

## Why This Matters in Effect-TS

The power of this approach comes from Effect's type system:

```typescript
interface TaskRepository {
  findById: (id: TaskId) => Effect.Effect<Task, TaskNotFoundError>
  //                                      ^^^   ^^^^^^^^^^^^^^^^
  //                                       |            |
  //                               Success type    Error type (part of contract!)
}
```

**The contract includes:**
- ✅ Success type (`Task`)
- ✅ **All possible failure modes** (`TaskNotFoundError`)
- ✅ Dependencies required (`R` channel)
- ✅ Behavioral guarantees (tested via contract tests)

## Practical Workflow

```typescript
// 1. INTERFACE-FIRST: Define the contract
export class UserService extends Effect.Service<UserService>()("app/UserService", {
  effect: Effect.succeed({
    getUser: (id: string): Effect.Effect<User, UserNotFoundError> => 
      Effect.die("not implemented")
  })
}) {}

// 2. CONTRACT-DRIVEN: Test the contract
const testUserServiceContract = (makeLayer: () => Layer<UserService>) => {
  it.effect("should fail with UserNotFoundError for missing user", () =>
    Effect.gen(function* () {
      const service = yield* UserService;
      const exit = yield* Effect.exit(service.getUser("nonexistent"));
      
      // Test the contract's error guarantee
      assert.isTrue(Exit.isFailure(exit));
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause);
        assert.deepStrictEqual(
          Option.getOrThrow(error), 
          new UserNotFoundError({ userId: "nonexistent" })
        );
      }
    }).pipe(Effect.provide(makeLayer()))
  );
};

// 3. BOTH: Test double and production both satisfy the contract
testUserServiceContract(() => UserServiceTest);  // Test double
testUserServiceContract(() => UserServiceLive);  // Production
```

## Key Insight

In Effect-TS, **the interface IS the contract**, and **contract-driven testing verifies the interface**. They're two sides of the same coin:

- **Interface-First:** Defines the contract in code (types + signatures)
- **Contract-Driven:** Verifies the contract in tests (behavior + guarantees)

This unified approach creates a powerful feedback loop where:
1. Types guide implementation
2. Tests verify behavior
3. Both test doubles and production code must satisfy the same contract
4. You can refactor implementations with confidence—tests remain unchanged
