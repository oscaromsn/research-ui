---
modified: 2025-10-26T14:25:02-03:00
---
# Testing with Fakes and Mocks in Effect

Effect's architecture makes **fakes the natural default**, but there are specific scenarios where mocks still make sense. The key is understanding how Effect's Layer system and service pattern shape your testing strategy.

## Why Effect Favors Fakes

Effect's dependency injection through services and layers is *designed* for composition. This makes fakes incredibly elegant:

```typescript
// Your production service
class UserRepository extends Effect.Service<UserRepository>()("UserRepository", {
  effect: Effect.gen(function* () {
    const sql = yield* Sql.tag;
    
    return {
      save: (user: User) => 
        sql`INSERT INTO users ${sql.insert(user)}`.pipe(
          Effect.catchAll(handleDbError)
        ),
      
      findById: (id: string) =>
        sql`SELECT * FROM users WHERE id = ${id}`.pipe(
          Effect.map(rows => rows[0] ?? null)
        )
    };
  }),
  dependencies: [SqlLive]
}) {}

// Your fake - a real implementation, no mocking library needed
export const UserRepositoryFake = Layer.succeed(
  UserRepository,
  UserRepository.of({
    save: (user) => Effect.sync(() => {
      testDb.set(user.id, user);
    }),
    
    findById: (id) => Effect.sync(() => 
      testDb.get(id) ?? null
    )
  })
);
```

This is pure Effect - no mocking framework, no magic. Your fake *is* a valid implementation of the service interface.

## Testing with Fakes

The beauty is that your test code looks identical to production code:

```typescript
test("registers user successfully", async () => {
  const program = Effect.gen(function* () {
    const repo = yield* UserRepository;
    const user = yield* repo.save({ id: "123", name: "Oscar" });
    const found = yield* repo.findById("123");
    
    return found;
  });

  const result = await Effect.runPromise(
    program.pipe(
      Effect.provide(UserRepositoryFake),
      Effect.provide(TestContext.TestContext)
    )
  );

  expect(result).toEqual({ id: "123", name: "Oscar" });
});
```

You're testing the *effect program*, not implementation details. The fake is swapped in through dependency injection.

## When Mocks Make Sense in Effect

Mocks in Effect are less common, but valuable for:

### 1. **Verifying side effects you can't observe**

```typescript
test("publishes event after save", async () => {
  let publishedEvents: Event[] = [];
  
  const MockEventBus = Layer.succeed(
    EventBus,
    EventBus.of({
      publish: (event) => Effect.sync(() => {
        publishedEvents.push(event);
      })
    })
  );

  await Effect.runPromise(
    userService.register(userData).pipe(
      Effect.provide(MockEventBus),
      Effect.provide(UserRepositoryFake)
    )
  );

  expect(publishedEvents).toContainEqual({
    type: "UserRegistered",
    userId: userData.id
  });
});
```

This is technically a spy/mock hybrid - you're capturing calls to verify behavior.

### 2. **Testing error handling paths**

```typescript
test("handles repository failures", async () => {
  const FailingRepo = Layer.succeed(
    UserRepository,
    UserRepository.of({
      save: () => Effect.fail(new DbError("Connection lost"))
    })
  );

  const result = await Effect.runPromise(
    program.pipe(
      Effect.provide(FailingRepo),
      Effect.either // Catch the failure
    )
  );

  expect(Either.isLeft(result)).toBe(true);
});
```

Here you're "mocking" failure scenarios that would be hard to trigger with a fake.

## The Effect Pattern: TestLayers

Create a module for your test infrastructure:

```typescript
// test/layers/index.ts
export const TestLayers = {
  UserRepository: UserRepositoryFake,
  EmailService: EmailServiceFake,
  Clock: TestContext.TestClock,
  
  // Composed layer for common scenarios
  Default: Layer.mergeAll(
    UserRepositoryFake,
    EmailServiceFake,
    TestContext.TestContext
  )
};

// In tests
await Effect.runPromise(
  myProgram.pipe(Effect.provide(TestLayers.Default))
);
```

## Contract-Driven Testing with BAML

Since you're working with BAML and contract-driven TDD, you can leverage schemas for both production and test implementations:

```typescript
// Your BAML schema defines the contract
interface ResearchAgent {
  research: (query: string) => Effect.Effect<ResearchResult, ResearchError>;
}

// Production uses actual LLM
export const ResearchAgentLive = Layer.effect(
  ResearchAgent,
  Effect.gen(function* () {
    const baml = yield* BamlClient;
    return {
      research: (query) => baml.research(query)
    };
  })
);

// Test fake returns predictable results
export const ResearchAgentFake = Layer.succeed(
  ResearchAgent,
  ResearchAgent.of({
    research: (query) => Effect.succeed({
      sources: [mockSource],
      summary: `Fake result for: ${query}`
    })
  })
);
```

Your test validates the *program logic*, not the LLM behavior. The contract ensures both implementations are compatible.

## Testing Effectful Computations

One subtle advantage: Effect programs are values until run. This means you can test the *structure* of programs without executing them:

```typescript
test("program composition", () => {
  const program = pipe(
    fetchData,
    Effect.flatMap(processData),
    Effect.retry(retryPolicy)
  );

  // You can inspect the program structure, layers, etc.
  // without running it
});
```

This is harder with imperative code where execution happens immediately.

## Practical Guidelines

1. **Default to fakes** for anything stateful (repositories, caches, file systems)
2. **Use mocks/spies** only when you need to verify interactions or can't observe state
3. **Leverage TestContext** for time-based testing (Clock, TestRandom)
4. **Create test layers** that mirror your production layer hierarchy
5. **Share fakes across tests** - they're reusable implementations

The Effect model encourages you to think about dependencies as *algebras* (interfaces with laws), and both production and test implementations satisfy those laws. This is fundamentally different from mocking frameworks that monkey-patch behavior—you're composing valid implementations through the type system.

Does this align with how you're approaching testing in Research Squad?
