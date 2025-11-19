---
modified: 2025-10-26T14:27:15-03:00
---
# Implementing Test Fakes in Effect: Practical Patterns

Let me show you the concrete patterns for building robust, reusable fakes in Effect.

## The Basic Pattern

The foundation is Effect's service pattern with Layer:

```typescript
// 1. Define your service interface
class UserRepository extends Effect.Service<UserRepository>()("UserRepository", {
  effect: Effect.gen(function* () {
    const sql = yield* Sql.tag;
    return {
      save: (user: User) => 
        sql`INSERT INTO users ${sql.insert(user)}`,
      findById: (id: string) =>
        sql`SELECT * FROM users WHERE id = ${id}`.pipe(
          Effect.map(rows => rows[0])
        ),
      findAll: () =>
        sql`SELECT * FROM users`
    };
  }),
  dependencies: [SqlLive]
}) {}

// 2. Create the fake layer
export const UserRepositoryFake = Layer.sync(
  UserRepository,
  () => {
    // Mutable state - this is OK in tests
    const users = new Map<string, User>();
    
    return UserRepository.of({
      save: (user) => 
        Effect.sync(() => {
          users.set(user.id, user);
        }),
      
      findById: (id) =>
        Effect.sync(() => users.get(id)),
      
      findAll: () =>
        Effect.sync(() => Array.from(users.values()))
    });
  }
);
```

Key points:
- Use `Layer.sync` for simple fakes without dependencies
- State lives in closure scope—created fresh per layer instantiation
- Each operation returns an `Effect`, matching the interface

## State Management: Refs for Complex Fakes

For fakes that need observable state or cleanup, use Effect's `Ref`:

```typescript
export const UserRepositoryFake = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    // Ref is Effect's atomic reference type
    const usersRef = yield* Ref.make(new Map<string, User>());
    
    return UserRepository.of({
      save: (user) =>
        Ref.update(usersRef, (users) => {
          users.set(user.id, user);
          return users;
        }),
      
      findById: (id) =>
        Ref.get(usersRef).pipe(
          Effect.map((users) => users.get(id))
        ),
      
      findAll: () =>
        Ref.get(usersRef).pipe(
          Effect.map((users) => Array.from(users.values()))
        ),
      
      // Bonus: expose state for test assertions
      _testOnly: {
        clear: () => Ref.set(usersRef, new Map()),
        getState: () => Ref.get(usersRef)
      }
    });
  })
);
```

Why `Ref`?
- **Thread-safe**: Even in concurrent tests
- **Compositional**: Works with Effect's fiber model
- **Inspectable**: You can read state for assertions

## Pattern: Configurable Fakes

Sometimes you need fakes that behave differently per test:

```typescript
interface FakeConfig {
  initialData?: User[];
  latency?: Duration.Duration;
  failureRate?: number;
}

export const makeUserRepositoryFake = (config: FakeConfig = {}) =>
  Layer.effect(
    UserRepository,
    Effect.gen(function* () {
      const usersRef = yield* Ref.make(
        new Map(config.initialData?.map(u => [u.id, u]) ?? [])
      );
      
      // Helper to simulate latency and failures
      const withRealism = <A, E>(effect: Effect.Effect<A, E>) =>
        effect.pipe(
          config.latency 
            ? Effect.delay(config.latency)
            : identity,
          config.failureRate
            ? Effect.flatMap((a) =>
                Effect.if(Math.random() < config.failureRate, {
                  onTrue: () => Effect.fail(new DbError("Simulated failure")),
                  onFalse: () => Effect.succeed(a)
                })
              )
            : identity
        );
      
      return UserRepository.of({
        save: (user) =>
          withRealism(
            Ref.update(usersRef, (users) => {
              users.set(user.id, user);
              return users;
            })
          ),
        
        findById: (id) =>
          withRealism(
            Ref.get(usersRef).pipe(
              Effect.map((users) => users.get(id))
            )
          )
      });
    })
  );

// Usage in tests
const withLatency = makeUserRepositoryFake({ 
  latency: Duration.millis(100) 
});

const withFailures = makeUserRepositoryFake({ 
  failureRate: 0.1 
});
```

This lets you test edge cases: retry logic, timeout handling, etc.

## Pattern: Fakes with Dependencies

Fakes can depend on other fakes:

```typescript
class EmailService extends Effect.Service<EmailService>()("EmailService", {
  effect: Effect.gen(function* () {
    const smtp = yield* SmtpClient;
    const templates = yield* TemplateEngine;
    
    return {
      sendWelcome: (email: string, name: string) =>
        pipe(
          templates.render("welcome", { name }),
          Effect.flatMap((html) => smtp.send({ to: email, html }))
        )
    };
  }),
  dependencies: [SmtpClientLive, TemplateEngineLive]
}) {}

// Fake with dependencies
export const EmailServiceFake = Layer.effect(
  EmailService,
  Effect.gen(function* () {
    const sentEmails = yield* Ref.make<Email[]>([]);
    
    return EmailService.of({
      sendWelcome: (email, name) =>
        Ref.update(sentEmails, (emails) => [
          ...emails,
          { to: email, subject: "Welcome!", body: `Hi ${name}` }
        ]),
      
      _testOnly: {
        getSentEmails: () => Ref.get(sentEmails)
      }
    });
  })
);

// No dependencies needed! The fake is self-contained
// EmailServiceFake.dependencies === []
```

Your fake doesn't need to depend on `SmtpClientFake` or `TemplateEngineFake`—it's completely independent. This is a huge win for test isolation.

## Pattern: Research Squad Example

Let's make this concrete for your multi-agent system:

```typescript
// Your production agent
class ResearchAgent extends Effect.Service<ResearchAgent>()("ResearchAgent", {
  effect: Effect.gen(function* () {
    const baml = yield* BamlClient;
    const rateLimiter = yield* RateLimiter;
    
    return {
      research: (query: string) =>
        pipe(
          rateLimiter.acquire(),
          Effect.flatMap(() => baml.research.invoke(query)),
          Effect.map((result) => ({
            sources: result.sources,
            summary: result.summary,
            confidence: result.confidence
          }))
        )
    };
  }),
  dependencies: [BamlClientLive, RateLimiterLive]
}) {}

// Fake with predictable responses
export const ResearchAgentFake = Layer.sync(
  ResearchAgent,
  () => {
    // Store query history for assertions
    const queries: string[] = [];
    
    // Deterministic responses based on query patterns
    const responseMap = new Map([
      ["precedentes STJ", {
        sources: [
          { title: "REsp 123456", url: "..." },
          { title: "AgInt no REsp 789012", url: "..." }
        ],
        summary: "STJ entende que...",
        confidence: 0.95
      }],
      ["jurisprudência trabalhista", {
        sources: [{ title: "TST-RR-100", url: "..." }],
        summary: "Entendimento consolidado...",
        confidence: 0.88
      }]
    ]);
    
    return ResearchAgent.of({
      research: (query) =>
        Effect.sync(() => {
          queries.push(query);
          
          // Return matching response or default
          return responseMap.get(query) ?? {
            sources: [],
            summary: `Generic response for: ${query}`,
            confidence: 0.5
          };
        }),
      
      _testOnly: {
        getQueries: () => Effect.sync(() => [...queries]),
        clearHistory: () => Effect.sync(() => queries.splice(0))
      }
    });
  }
);
```

Now you can test your orchestration logic without calling BAML:

```typescript
test("Juris agent coordinates research correctly", async () => {
  const program = Effect.gen(function* () {
    const agent = yield* ResearchAgent;
    
    // Your business logic
    const stj = yield* agent.research("precedentes STJ");
    const tst = yield* agent.research("jurisprudência trabalhista");
    
    return synthesize([stj, tst]);
  });
  
  const result = await Effect.runPromise(
    program.pipe(Effect.provide(ResearchAgentFake))
  );
  
  expect(result.sources).toHaveLength(3);
});
```

## Pattern: Pangea Legal Database Fake

For your Pangea library accessing DataJud:

```typescript
interface CaseQuery {
  tribunal?: string;
  year?: number;
  type?: string;
  limit?: number;
}

class DataJudClient extends Effect.Service<DataJudClient>()("DataJudClient", {
  effect: Effect.gen(function* () {
    const http = yield* HttpClient;
    const auth = yield* AuthService;
    
    return {
      query: (params: CaseQuery) =>
        pipe(
          auth.getToken(),
          Effect.flatMap((token) =>
            http.post("/api/cases", { 
              headers: { Authorization: token },
              body: params 
            })
          ),
          Effect.map(response => response.data as CaseData[])
        )
    };
  }),
  dependencies: [HttpClientLive, AuthServiceLive]
}) {}

// Fake with small, curated dataset
export const DataJudClientFake = Layer.sync(
  DataJudClient,
  () => {
    // Small but realistic dataset
    const cases: CaseData[] = [
      {
        id: "0001234-56.2024.8.26.0100",
        tribunal: "TJSP",
        year: 2024,
        type: "Apelação Cível",
        summary: "Ação de cobrança...",
        decision: "Provido"
      },
      {
        id: "0005678-90.2023.8.26.0100",
        tribunal: "TJSP", 
        year: 2023,
        type: "Agravo de Instrumento",
        summary: "Tutela de urgência...",
        decision: "Negado"
      },
      // Add more diverse cases...
    ];
    
    return DataJudClient.of({
      query: (params) =>
        Effect.sync(() => {
          let results = cases;
          
          // Apply filters (satisfying the laws!)
          if (params.tribunal) {
            results = results.filter(c => c.tribunal === params.tribunal);
          }
          if (params.year) {
            results = results.filter(c => c.year === params.year);
          }
          if (params.type) {
            results = results.filter(c => c.type === params.type);
          }
          if (params.limit) {
            results = results.slice(0, params.limit);
          }
          
          return results;
        })
    });
  }
);
```

The fake implements the same query semantics as the real API—filters compose correctly, pagination works, etc.

## Testing Fakes Against Laws

Here's the crucial part: test your fakes to ensure they satisfy the laws:

```typescript
// Law tests that both implementations must pass
const repositoryLaws = (repo: UserRepository) => {
  describe("Repository Laws", () => {
    test("read-after-write returns written value", async () => {
      const user = { id: "123", name: "Oscar" };
      
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          yield* repo.save(user);
          return yield* repo.findById(user.id);
        })
      );
      
      expect(result).toEqual(user);
    });
    
    test("read miss returns undefined", async () => {
      const result = await Effect.runPromise(
        repo.findById("nonexistent")
      );
      
      expect(result).toBeUndefined();
    });
    
    test("multiple writes of same id are idempotent", async () => {
      const user1 = { id: "123", name: "Oscar" };
      const user2 = { id: "123", name: "Oscar Updated" };
      
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          yield* repo.save(user1);
          yield* repo.save(user2);
          return yield* repo.findById("123");
        })
      );
      
      expect(result).toEqual(user2);
    });
  });
};

// Run against both implementations
describe("UserRepositoryFake", () => {
  const fake = Effect.runSync(
    Effect.provide(
      Effect.service(UserRepository),
      UserRepositoryFake
    )
  );
  
  repositoryLaws(fake);
});

describe("UserRepositoryLive", () => {
  const live = Effect.runSync(
    Effect.provide(
      Effect.service(UserRepository),
      UserRepositoryLive // needs real DB in test env
    )
  );
  
  repositoryLaws(live);
});
```

If both pass, you have mathematical confidence they're equivalent.

## Organizing Test Layers

Create a test utilities module:

```typescript
// test/layers.ts
import { Layer } from "effect";
import * as TestContext from "effect/TestContext";

export const TestLayers = {
  // Individual fakes
  UserRepository: UserRepositoryFake,
  EmailService: EmailServiceFake,
  ResearchAgent: ResearchAgentFake,
  DataJudClient: DataJudClientFake,
  
  // Composed layers for common scenarios
  Basic: Layer.mergeAll(
    UserRepositoryFake,
    EmailServiceFake,
    TestContext.TestContext
  ),
  
  Research: Layer.mergeAll(
    ResearchAgentFake,
    DataJudClientFake,
    TestContext.TestContext
  ),
  
  // Full application stack for integration tests
  Full: Layer.mergeAll(
    UserRepositoryFake,
    EmailServiceFake,
    ResearchAgentFake,
    DataJudClientFake,
    TestContext.TestContext
  )
};

// Usage
test("user registration flow", async () => {
  const result = await Effect.runPromise(
    myProgram.pipe(Effect.provide(TestLayers.Basic))
  );
  
  expect(result).toBeDefined();
});
```

## Advanced: Fakes with TestContext Integration

Effect's `TestContext` provides controllable time and randomness:

```typescript
export const CacheFakeWithTTL = Layer.effect(
  Cache,
  Effect.gen(function* () {
    const clock = yield* Clock.Clock;
    const cacheRef = yield* Ref.make(new Map<string, { 
      value: unknown, 
      expiresAt: number 
    }>());
    
    return Cache.of({
      set: (key, value, ttl) =>
        Effect.gen(function* () {
          const now = yield* Clock.currentTimeMillis;
          yield* Ref.update(cacheRef, (cache) => {
            cache.set(key, { 
              value, 
              expiresAt: now + ttl 
            });
            return cache;
          });
        }),
      
      get: (key) =>
        Effect.gen(function* () {
          const now = yield* Clock.currentTimeMillis;
          const cache = yield* Ref.get(cacheRef);
          const entry = cache.get(key);
          
          if (!entry) return Option.none();
          if (entry.expiresAt < now) return Option.none();
          
          return Option.some(entry.value);
        })
    });
  })
);

// Test with controllable time!
test("cache expires entries", async () => {
  const program = Effect.gen(function* () {
    const cache = yield* Cache;
    
    yield* cache.set("key", "value", 1000); // 1 second TTL
    
    // Immediately readable
    const before = yield* cache.get("key");
    expect(Option.isSome(before)).toBe(true);
    
    // Advance time 2 seconds
    yield* TestClock.adjust(Duration.seconds(2));
    
    // Now expired
    const after = yield* cache.get("key");
    expect(Option.isNone(after)).toBe(true);
  });
  
  await Effect.runPromise(
    program.pipe(
      Effect.provide(CacheFakeWithTTL),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

This is impossible with traditional mocks—you'd have to mock `Date.now()` globally. With Effect, time is just another dependency.

## Best Practices Summary

1. **Keep fakes simple**: They should be obviously correct
2. **Share state management patterns**: Use `Ref` for mutable state, `Map`/`Set` for collections
3. **Make fakes configurable**: Support different test scenarios
4. **Test your fakes**: Ensure they satisfy the same laws as production
5. **Expose test-only helpers**: `_testOnly` property for state inspection
6. **Use TestContext**: For time, randomness, and other environmental concerns
7. **Organize layers**: Create composed layers for common test scenarios
8. **Document laws**: Write down what properties your interface guarantees

The key insight: **a fake is a correct, simplified implementation**—not a mock with expectations. It should be the simplest thing that satisfies the algebra's laws.

Does this give you a solid foundation for building test fakes in Research Squad and Pangea?
