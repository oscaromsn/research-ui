---
modified: 2025-10-27T17:36:01-03:00
---
# Effect Office Hours #5: Layers, Dependency Injection, Accessors, and Scopes
## Comprehensive Reference Guide

**Source**: Effect Office Hours #5 - Layers, Dependency Injection, Accessors, and Scopes
**Format**: Live Q&A, Code Review, Pattern Discussion
**Focus Areas**: Service Architecture, Accessor Pitfalls, Scope Management, Real-World Applications

---

## Table of Contents

1. [The Canonical Service Pattern](#the-canonical-service-pattern)
2. [Accessors: Power and Pitfalls](#accessors-power-and-pitfalls)
3. [Dependencies Array Deep Dive](#dependencies-array-deep-dive)
4. [Test Implementations vs Production](#test-implementations-vs-production)
5. [Scope Management Fundamentals](#scope-management-fundamentals)
6. [Layer Lifecycle and Finalizers](#layer-lifecycle-and-finalizers)
7. [HTTP Handler Patterns](#http-handler-patterns)
8. [Error Handling Architecture](#error-handling-architecture)
9. [Effect 4.0: Scope Changes](#effect-40-scope-changes)
10. [Real-World Code Review](#real-world-code-review)

---

## The Canonical Service Pattern

### The 95% Template

**Insight**: 95% of your Effect application will follow this exact pattern. Master this template and you've mastered Effect architecture.

```typescript
import { Effect } from "effect";

class MyService extends Effect.Service<MyService>()("app/MyService", {
  // Step 1: Declare dependencies (optional)
  dependencies: [DependencyA.Default, DependencyB.Default],
  
  // Step 2: Constructor logic
  effect: Effect.gen(function* () {
    // Step 2a: Yield all dependencies at top
    const depA = yield* DependencyA;
    const depB = yield* DependencyB;
    
    // Step 2b: Initialization logic (if needed)
    const internalState = new Map<string, User>();
    
    // Step 3: Return implementation (defines interface implicitly)
    return {
      myMethod: (input: string): Effect.Effect<Output, MyError> =>
        Effect.gen(function* () {
          // Use dependencies from closure
          const result = yield* depA.doSomething(input);
          yield* depB.logResult(result);
          return transformResult(result);
        }),
      
      anotherMethod: (id: number): Effect.Effect<Data, NotFoundError> =>
        Effect.gen(function* () {
          const data = internalState.get(String(id));
          if (!data) {
            return yield* Effect.fail(new NotFoundError({ id }));
          }
          return data;
        })
    };
  })
}) {}
```

### Reading the Pattern: Signal vs Noise

**Signal** (what to focus on):
1. Service name: `MyService`
2. Dependencies yielded at top
3. Methods returned (the interface)
4. Business logic in method bodies

**Noise** (template boilerplate):
1. `extends Effect.Service<MyService>()`
2. Double parentheses `()("identifier", {`
3. `Effect.gen(function* () {`
4. Type annotations that repeat service name

**Mental Model**:

> "This is MyService. It needs DependencyA and DependencyB. It has these methods. Here's what they do."

### Fractal Regularity

**Key Insight**: This pattern repeats at every level of your application.

```typescript
// Leaf service (no dependencies)
class DatabaseService extends Effect.Service<DatabaseService>()(
  "app/DatabaseService",
  {
    effect: Effect.gen(function* () {
      const pool = yield* createConnectionPool();
      
      return {
        query: (sql: string) => pool.execute(sql)
      };
    })
  }
) {}

// Middle service (depends on leaf)
class UserService extends Effect.Service<UserService>()(
  "app/UserService",
  {
    dependencies: [DatabaseService.Default],
    
    effect: Effect.gen(function* () {
      const db = yield* DatabaseService;
      
      return {
        getUser: (id: number) => db.query(`SELECT * FROM users WHERE id = ${id}`)
      };
    })
  }
) {}

// Top service (depends on middle)
class AppService extends Effect.Service<AppService>()(
  "app/AppService",
  {
    dependencies: [UserService.Default],
    
    effect: Effect.gen(function* () {
      const users = yield* UserService;
      
      return {
        run: () =>
          Effect.gen(function* () {
            const user = yield* users.getUser(123);
            yield* Console.log(`Hello, ${user.name}!`);
          })
      };
    })
  }
) {}
```

**Pattern**: Same structure at every level. Zero cognitive overhead.

---

## Accessors: Power and Pitfalls

### What Are Accessors?

**Generated convenience functions** that automatically yield a service and delegate to its methods.

```typescript
class UserService extends Effect.Service<UserService>()(
  "app/UserService",
  {
    effect: Effect.gen(function* () {
      return {
        getUser: (id: number): Effect.Effect<User, NotFoundError> =>
          Effect.succeed({ id, name: "Alice" })
      };
    })
  }
) {}

// Accessor generated automatically:
// UserService.getUser(123) === Effect.gen(function* () {
//   const service = yield* UserService;
//   return yield* service.getUser(123);
// })

// Usage
const program = UserService.getUser(123);
// vs
const program = Effect.gen(function* () {
  const users = yield* UserService;
  return yield* users.getUser(123);
});
```

### The Accessor Footgun

**CRITICAL ANTI-PATTERN**: Accessors leak service dependencies into method signatures.

#### The Problem Illustrated

**Scenario**: AlertService implementation

```typescript
class AlertService extends Effect.Service<AlertService>()(
  "app/AlertService",
  {
    dependencies: [EmailService.Default, SMSService.Default, UserService.Default],
    
    effect: Effect.gen(function* () {
      const email = yield* EmailService;
      const sms = yield* SMSService;
      const users = yield* UserService;
      
      return {
        alert: (userId: number, message: string): Effect.Effect<void> =>
          Effect.gen(function* () {
            const user = yield* users.getUser(userId);
            yield* email.send(user.email, message);
            yield* sms.send(user.phone, message);
          })
      };
    })
  }
) {}
```

**Type of `alert` method**: `Effect.Effect<void, never, never>`
✅ Clean interface - no leaked dependencies

#### The Footgun Version (Using Accessors Inside Methods)

```typescript
class AlertService extends Effect.Service<AlertService>()(
  "app/AlertService",
  {
    dependencies: [EmailService.Default, UserService.Default],
    
    effect: Effect.gen(function* () {
      const email = yield* EmailService;
      const users = yield* UserService;
      
      return {
        // ❌ WRONG: Using accessor inside method
        alert: (userId: number, message: string): Effect.Effect<void, never, SMSService> =>
          Effect.gen(function* () {
            const user = yield* users.getUser(userId);
            yield* email.send(user.email, message);
            // Using accessor!
            yield* SMSService.send(user.phone, message);
          })
      };
    })
  }
) {}
```

**Type of `alert` method**: `Effect.Effect<void, never, SMSService>`
❌ **Dependency leaked!** Now all callers must provide SMSService

### Interface vs Implementation Boundary

**Analogy**: Traditional OOP Constructor Injection

```typescript
// ✅ CORRECT: Dependency in constructor
class AlertService {
  constructor(
    private email: EmailService,
    private sms: SMSService
  ) {}
  
  // Clean interface - no dependencies
  alert(userId: number): void {
    this.email.send(...);
    this.sms.send(...);
  }
}

// ❌ WRONG: Dependency in method signature
class AlertService {
  alert(userId: number, sms: SMSService): void {
    // Now every caller must provide SMS!
    sms.send(...);
  }
}
```

**Effect Equivalent**:
- **Constructor dependencies** = Services yielded at top of Effect.gen
- **Method dependencies** = Services yielded inside method implementations

### When Accessors Are Safe

#### Safe Use Case 1: Application Entry Point

```typescript
// Top-level program
const program = Effect.gen(function* () {
  const user = yield* UserService.getUser(123);
  yield* AlertService.alert(user.id, "Welcome!");
});

// Dependencies visible at top level - totally fine!
// Type: Effect.Effect<void, ..., UserService | AlertService>
```

**Why Safe**:
- Program orchestrates multiple services
- Dependencies propagate to top-level layer provision
- No intermediate service interfaces polluted

#### Safe Use Case 2: Tests

```typescript
it.effect("should alert user", () =>
  Effect.gen(function* () {
    // Create user
    const user = yield* UserService.create({ name: "Alice" });
    
    // Alert them (accessor usage)
    yield* AlertService.alert(user.id, "Test message");
    
    // Assert email was sent
    const emails = yield* TestEmailService.getSentEmails();
    assert.strictEqual(emails.length, 1);
  }).pipe(
    Effect.provide(TestLayer)
  )
);
```

**Why Safe**:
- Tests are leaf nodes (nothing depends on them)
- Clear what services are needed
- Terseness helps readability

### The Golden Rule

> **Yield all service dependencies at the top of your Effect.gen constructor. Never use accessors inside service method implementations.**

**Exceptions**:
1. Top-level application orchestration
2. Test code
3. One-off scripts

**Disable Accessors by Default**: Many Effect experts disable accessor generation entirely to avoid this footgun.

---

## Dependencies Array Deep Dive

### The Local Elimination Pattern

**Goal**: Eliminate transitive dependencies locally, expose only the service itself.

#### Without Dependencies Array (Manual Provision)

```typescript
// AlertService.ts
class AlertService extends Effect.Service<AlertService>()(
  "app/AlertService",
  {
    effect: Effect.gen(function* () {
      const email = yield* EmailService;
      const sms = yield* SMSService;
      const users = yield* UserService;
      
      return {
        alert: (userId: number, message: string) =>
          Effect.gen(function* () {
            const user = yield* users.getUser(userId);
            yield* email.send(user.email, message);
            yield* sms.send(user.phone, message);
          })
      };
    })
  }
) {}

// Type: Layer<AlertService, never, EmailService | SMSService | UserService>
//       (Requires 3 dependencies) → AlertService

// main.ts
const AppLayer = Layer.mergeAll(
  AlertService.Default,
  EmailService.Default,
  SMSService.Default,
  UserService.Default
);
```

**Problem**: Root layer knows about AlertService's transitive dependencies.

#### With Dependencies Array (Local Elimination)

```typescript
// AlertService.ts
class AlertService extends Effect.Service<AlertService>()(
  "app/AlertService",
  {
    // Declare default dependencies
    dependencies: [
      EmailService.Default,
      SMSService.Default,
      UserService.Default
    ],
    
    effect: Effect.gen(function* () {
      const email = yield* EmailService;
      const sms = yield* SMSService;
      const users = yield* UserService;
      
      return {
        alert: (userId: number, message: string) =>
          Effect.gen(function* () {
            const user = yield* users.getUser(userId);
            yield* email.send(user.email, message);
            yield* sms.send(user.phone, message);
          })
      };
    })
  }
) {}

// Type: Layer<AlertService, never, never>
//       ∅ → AlertService (fully satisfied!)

// main.ts
const AppLayer = Layer.mergeAll(
  AlertService.Default,
  // No need to mention transitive dependencies!
);
```

**Benefit**: Root layer only knows about direct dependencies.

### Partial Dependency Provision

**Revelation**: Dependencies array can provide *some* dependencies, leaving others as requirements.

```typescript
class AlertService extends Effect.Service<AlertService>()(
  "app/AlertService",
  {
    // Only provide stable defaults
    dependencies: [
      UserService.Default,  // Always the same
      SMSService.Default    // Always the same
    ],
    
    effect: Effect.gen(function* () {
      const users = yield* UserService;
      const sms = yield* SMSService;
      const email = yield* EmailService;  // Not in dependencies!
      
      return {
        alert: (userId: number, message: string) =>
          Effect.gen(function* () {
            const user = yield* users.getUser(userId);
            yield* email.send(user.email, message);
            yield* sms.send(user.phone, message);
          })
      };
    })
  }
) {}

// Type: Layer<AlertService, never, EmailService>
//       EmailService → AlertService

// Swap email providers at runtime
const prodLayer = AlertService.Default.pipe(
  Layer.provide(ResendEmailService.Default)
);

const testLayer = AlertService.Default.pipe(
  Layer.provide(MockEmailService.Default)
);
```

**Use Case**: Varying implementations of specific dependencies.

### DefaultWithoutDependencies Layer

**Problem**: Need to override default dependencies in tests.

```typescript
class AlertService extends Effect.Service<AlertService>()(
  "app/AlertService",
  {
    dependencies: [
      EmailService.Default,    // Real email provider
      SMSService.Default,      // Real SMS provider
      UserService.Default      // Real database
    ],
    
    effect: Effect.gen(function* () {
      // Implementation
    })
  }
) {}

// Production: Use defaults
const prodLayer = AlertService.Default;
// Type: Layer<AlertService, never, never>

// Tests: Override all dependencies
const testLayer = AlertService.DefaultWithoutDependencies.pipe(
  Layer.provide(TestEmailService),
  Layer.provide(TestSMSService),
  Layer.provide(TestUserService)
);
// Type: Layer<AlertService, never, never>
```

**Pattern**:
- `Default`: Includes dependencies array provisions
- `DefaultWithoutDependencies`: Ignores dependencies array, requires all dependencies

**When to Use**:
- Tests with custom implementations
- Development with mock services
- Staging with hybrid real/fake services

### Tree-Shaking Considerations

**Anti-Pattern**: Static layer properties reduce tree-shaking

```typescript
class EmailService extends Effect.Service<EmailService>()(
  "app/EmailService",
  {
    effect: Effect.gen(function* () {
      return { /* implementation */ };
    })
  }
) {
  // ❌ Attached to class - not tree-shakeable
  static readonly TestLayer = Layer.succeed(EmailService, {
    send: (to, body) => Console.log(`Mock email to ${to}`)
  });
}
```

**Better**: Module-scoped variable

```typescript
class EmailService extends Effect.Service<EmailService>()(
  "app/EmailService",
  {
    effect: Effect.gen(function* () {
      return { /* implementation */ };
    })
  }
) {}

// ✅ Module-scoped - tree-shakeable
export const EmailServiceTest = Layer.succeed(EmailService, {
  send: (to, body) => Console.log(`Mock email to ${to}`)
});
```

**Trade-off**:
- Static property: Convenient, not tree-shakeable
- Module variable: Tree-shakeable, requires explicit import

**Recommendation**: Module variables for test layers (tests shouldn't bloat production).

---

## Test Implementations vs Production

### The 5% Rule

**Insight**: Only ~5% of your services need test implementations.

**Services That Need Test Layers**:
1. **Leaf nodes** (external integrations)
   - Database, HTTP clients, file systems
   - Third-party APIs (email, SMS, payment)
   - System resources (time, random, env vars)

2. **Instrumentation services**
   - Logging, metrics, tracing
   - Useful to capture and assert on

**Services That Don't Need Test Layers**:
1. **Business logic services**
   - Just use production implementation with test dependencies
   - Example: AlertService with TestEmailService, TestSMSService

### High-Quality Test Implementations

**Pattern**: In-memory, inspectable, fully-functional

```typescript
class TestEmailService extends Context.Tag("TestEmailService")<
  TestEmailService,
  {
    send: (to: string, body: string) => Effect.Effect<void>;
    getSentEmails: () => Effect.Effect<Array<{ to: string; body: string }>>;
    clear: () => Effect.Effect<void>;
  }
>() {}

const TestEmailServiceLive = Layer.sync(TestEmailService, () => {
  const sent: Array<{ to: string; body: string }> = [];
  
  return {
    send: (to, body) =>
      Effect.sync(() => {
        sent.push({ to, body });
      }),
    
    getSentEmails: () => Effect.succeed([...sent]),
    
    clear: () =>
      Effect.sync(() => {
        sent.length = 0;
      })
  };
});

// Test usage
it.effect("should send welcome email", () =>
  Effect.gen(function* () {
    const emails = yield* TestEmailService;
    
    // Run code that sends email
    yield* AlertService.alert(123, "Welcome!");
    
    // Assert
    const sent = yield* emails.getSentEmails();
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].to, "user@example.com");
    assert.strictEqual(sent[0].body, "Welcome!");
  }).pipe(
    Effect.provide(TestLayer)
  )
);
```

**Characteristics**:
- ✅ Behavioral equivalence (same interface as real service)
- ✅ Inspectable (exposes sent emails for assertions)
- ✅ Controllable (can clear state between tests)
- ✅ Deterministic (no network, no randomness)
- ✅ Fast (in-memory operations)

### Anti-Pattern: Per-Test Mocks

**❌ Traditional Mock Approach**:

```typescript
it("should send email", () => {
  const mockEmail = {
    send: vi.fn().mockResolvedValue(undefined)
  };
  
  // Test logic...
  
  expect(mockEmail.send).toHaveBeenCalledWith("user@example.com", "Welcome!");
});
```

**Problems**:
- Ad-hoc implementations per test
- Brittle (depends on call order, arguments)
- Not reusable across tests
- Diverges from real interface over time

**✅ Effect Test Layer Approach**:

```typescript
it.effect("should send email", () =>
  Effect.gen(function* () {
    yield* AlertService.alert(123, "Welcome!");
    
    const emails = yield* TestEmailService;
    const sent = yield* emails.getSentEmails();
    
    assert.strictEqual(sent.length, 1);
  }).pipe(
    Effect.provide(TestLayer)
  )
);
```

**Benefits**:
- One canonical test implementation
- Reusable across all tests
- Maintained alongside real implementation
- Behavioral parity guaranteed

---

## Scope Management Fundamentals

### What Is a Scope?

**Definition**: A scope is a stack of finalizers (cleanup Effects) that run when the scope closes.

**Mental Model**:

```
Scope = Stack<Effect<void>>
```

**Lifecycle**:
1. Scope created
2. Finalizers added to stack (LIFO order)
3. Scope closed → Finalizers run in reverse order

### Adding Finalizers

```typescript
const program = Effect.gen(function* () {
  console.log("1. Start");
  
  yield* Effect.addFinalizer(() =>
    Console.log("4. Finalizer A")
  );
  
  console.log("2. Middle");
  
  yield* Effect.addFinalizer(() =>
    Console.log("5. Finalizer B")
  );
  
  console.log("3. End");
});

// Output:
// 1. Start
// 2. Middle
// 3. End
// 5. Finalizer B (LIFO - last in, first out)
// 4. Finalizer A
```

**Key Insight**: Finalizers run in **reverse order** (stack semantics).

### Scope as a Requirement

```typescript
const program = Effect.gen(function* () {
  yield* Effect.addFinalizer(() => Console.log("Cleanup"));
  yield* Console.log("Main logic");
});

// Type: Effect<void, never, Scope>
//                             ^^^^^
//                             Requires Scope!
```

**Providing a Scope**:

```typescript
// Option 1: Effect.scoped
const runnable = program.pipe(Effect.scoped);
// Type: Effect<void, never, never>

// Option 2: Implicit in Effect.run*
Effect.runPromise(program);
// Automatically provides Scope
```

### Finalizers Run on Any Exit

**Success**:

```typescript
const program = Effect.gen(function* () {
  yield* Effect.addFinalizer(() => Console.log("Cleanup"));
  yield* Console.log("Success!");
});

Effect.runPromise(program);
// Output:
// Success!
// Cleanup
```

**Failure**:

```typescript
const program = Effect.gen(function* () {
  yield* Effect.addFinalizer(() => Console.log("Cleanup"));
  yield* Effect.fail("Error!");
});

Effect.runPromise(program).catch(() => {});
// Output:
// Cleanup
// (Error propagates after cleanup)
```

**Defect**:

```typescript
const program = Effect.gen(function* () {
  yield* Effect.addFinalizer(() => Console.log("Cleanup"));
  yield* Effect.die("Kaboom!");
});

Effect.runPromise(program).catch(() => {});
// Output:
// Cleanup
// (Defect propagates after cleanup)
```

**Guarantee**: Finalizers **always** run, even on interruption, defects, or failures.

---

## Layer Lifecycle and Finalizers

### Layer.effect vs Layer.scoped

**Layer.effect**: No implicit scope

```typescript
const DatabaseLayer = Layer.effect(
  Database,
  Effect.gen(function* () {
    const pool = yield* createPool();
    
    // ❌ No finalizer - connection leak!
    return Database.of({
      query: (sql) => pool.query(sql)
    });
  })
);
```

**Layer.scoped**: Implicit scope for finalizers

```typescript
const DatabaseLayer = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const pool = yield* Effect.acquireRelease(
      createPool(),
      (pool) => pool.close()
    );
    
    // ✅ Finalizer registered - cleanup guaranteed
    return Database.of({
      query: (sql) => pool.query(sql)
    });
  })
);
```

**Effect.Service Pattern**:

```typescript
class Database extends Effect.Service<Database>()(
  "app/Database",
  {
    // Use `scoped` for resource management
    scoped: Effect.gen(function* () {
      const pool = yield* Effect.acquireRelease(
        createPool(),
        (pool) => pool.close()
      );
      
      return {
        query: (sql) => pool.query(sql)
      };
    })
  }
) {}
```

### Finalizer Execution Order

**Scenario**: Multiple layers with finalizers

```typescript
class ServiceA extends Effect.Service<ServiceA>()(
  "ServiceA",
  {
    scoped: Effect.gen(function* () {
      yield* Console.log("ServiceA: Acquired");
      yield* Effect.addFinalizer(() => Console.log("ServiceA: Released"));
      return { method: () => Effect.void };
    })
  }
) {}

class ServiceB extends Effect.Service<ServiceB>()(
  "ServiceB",
  {
    dependencies: [ServiceA.Default],
    scoped: Effect.gen(function* () {
      yield* Console.log("ServiceB: Acquired");
      yield* Effect.addFinalizer(() => Console.log("ServiceB: Released"));
      return { method: () => Effect.void };
    })
  }
) {}

const program = Effect.gen(function* () {
  yield* Console.log("Program: Running");
}).pipe(
  Effect.provide(ServiceB.Default)
);

Effect.runPromise(program);
// Output:
// ServiceA: Acquired    (dependency first)
// ServiceB: Acquired
// Program: Running
// ServiceB: Released    (LIFO - B released before A)
// ServiceA: Released
```

**Invariant**: Dependencies acquired first, released last (LIFO).

### Scopes and Background Fibers

**Problem**: Spawning unmanaged fibers

```typescript
class BackgroundService extends Effect.Service<BackgroundService>()(
  "BackgroundService",
  {
    effect: Effect.gen(function* () {
      // ❌ Fiber leaks when service shuts down
      yield* Effect.fork(
        Effect.forever(
          Console.log("Background work").pipe(
            Effect.delay("1 second")
          )
        )
      );
      
      return { method: () => Effect.void };
    })
  }
) {}
```

**Solution**: Scope-tied fibers

```typescript
class BackgroundService extends Effect.Service<BackgroundService>()(
  "BackgroundService",
  {
    scoped: Effect.gen(function* () {
      // ✅ Fiber automatically interrupted when scope closes
      yield* Effect.forkScoped(
        Effect.forever(
          Console.log("Background work").pipe(
            Effect.delay("1 second")
          )
        )
      );
      
      return { method: () => Effect.void };
    })
  }
) {}
```

**Guarantee**: When layer shuts down, background fiber is interrupted.

### Visualizing Effect.provide

**What happens internally**:

```typescript
const program = myEffect.pipe(
  Effect.provide(MyLayer)
);

// Internally:
// 1. Create scope
// 2. Build layer graph with scope
// 3. Run program with provided services
// 4. Close scope (run finalizers)
```

**Pseudocode**:

```typescript
function provide<A, E, R, E2, R2>(
  self: Effect<A, E, R>,
  layer: Layer<R, E2, R2>
): Effect<A, E | E2, Exclude<R2, R>> {
  return Effect.scopedWith((scope) =>
    Effect.gen(function* () {
      // Build layer (acquire resources)
      const context = yield* Layer.build(layer, scope);
      
      // Run program with provided services
      const result = yield* self.pipe(
        Effect.provide(context)
      );
      
      // Scope closes automatically here
      // (runs all finalizers registered during layer build)
      
      return result;
    })
  );
}
```

---

## HTTP Handler Patterns

### Anti-Pattern: Manual Request/Response Layers

**Problem**: Wrapping request/response in layers

```typescript
export const handler = (req: VercelRequest, res: VercelResponse) => {
  // ❌ Manual layer construction per request
  const RequestLayer = Layer.succeed(
    RequestContext,
    { req, res }
  );
  
  return myProgram.pipe(
    Effect.provide(RequestLayer),
    Effect.runPromise
  );
};
```

**Issues**:
1. Boilerplate in every handler
2. Manual bridging between Effect and Vercel runtime
3. Error handling outside Effect's type system
4. Resource cleanup not guaranteed

### Pattern: HTTP App Type

**Effect Platform Abstraction**:

```typescript
import { HttpApp, HttpServerRequest, HttpServerResponse } from "@effect/platform";

// HttpApp<A, E, R> = Effect<Response, E, R | Request>
type HttpApp<A = never, E = never, R = never> = Effect.Effect<
  HttpServerResponse.HttpServerResponse,
  E,
  R | HttpServerRequest.HttpServerRequest
>;
```

**Key Insight**: Request is in requirements, Response is the output.

### Implementing Handlers with HttpApp

```typescript
import { HttpApp, HttpServerRequest, HttpServerResponse } from "@effect/platform";

const myApp: HttpApp = Effect.gen(function* () {
  // Request available in environment
  const req = yield* HttpServerRequest.HttpServerRequest;
  
  // Parse body
  const body = yield* req.json;
  
  // Business logic (may use other services)
  const result = yield* MyService.process(body);
  
  // Return response
  return HttpServerResponse.json(result);
});
```

**With Dependencies**:

```typescript
const myApp: HttpApp<never, MyError, MyService> = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest;
  const service = yield* MyService;
  
  const result = yield* service.doSomething(req.url);
  
  return HttpServerResponse.json(result);
});
```

### Converting to Vercel Handler

**Pattern**: `toWebHandler` and `toWebHandlerLayer`

```typescript
import { HttpApp } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";

// Simple version (no dependencies)
export const handler = HttpApp.toWebHandler(myApp);

// With layers
const AppLayer = Layer.mergeAll(
  MyService.Default,
  Database.Default
);

export const handler = HttpApp.toWebHandlerLayer(myApp, AppLayer);
```

**Full Example**:

```typescript
// app.ts
export const app: HttpApp<never, AppError, MyService | Database> = 
  Effect.gen(function* () {
    const req = yield* HttpServerRequest.HttpServerRequest;
    const service = yield* MyService;
    
    // Type-safe error handling
    const result = yield* service.process(req.body).pipe(
      Effect.catchTag("NotFoundError", (e) =>
        HttpServerResponse.json({ error: "Not found" }, { status: 404 })
      ),
      Effect.catchTag("ValidationError", (e) =>
        HttpServerResponse.json({ error: e.message }, { status: 400 })
      )
    );
    
    return HttpServerResponse.json(result);
  });

// handler.ts (Vercel entry point)
import { app } from "./app";

const AppLayer = Layer.mergeAll(
  MyService.Default,
  Database.Default
);

export const POST = HttpApp.toWebHandlerLayer(app, AppLayer);
```

### Resource Cleanup in Handlers

**Automatic with Effect.provide**:

```typescript
const handler = HttpApp.toWebHandlerLayer(
  myApp,
  Layer.mergeAll(
    DatabaseLayer,  // Has finalizer to close connections
    CacheLayer      // Has finalizer to flush cache
  )
);

// Per-request lifecycle:
// 1. Acquire database connection
// 2. Acquire cache connection
// 3. Run request handler
// 4. Close cache connection
// 5. Close database connection
```

**Vercel Function Cleanup**:

```typescript
// Bind cleanup to process exit
if (typeof process !== "undefined") {
  process.on("beforeExit", () => {
    runtime.dispose();
  });
}
```

---

## Error Handling Architecture

### Anti-Pattern: Manual Exit Parsing

**Tyler's Original Code**:

```typescript
const handleExit = <A, E>(exit: Exit.Exit<A, E>) => {
  if (Exit.isSuccess(exit)) {
    return Response.json({ success: exit.value });
  }
  
  // Manual cause inspection
  const cause = exit.cause;
  if (Cause.isFailType(cause)) {
    return handleFailType(cause);
  }
  
  return Response.json({ error: "Unknown" }, { status: 500 });
};

const handleFailType = (cause: Cause.Cause<E>) => {
  if (cause._tag === "Fail" && cause.error instanceof ValidationError) {
    return Response.json({ error: cause.error.message }, { status: 400 });
  }
  // ... more manual matching
};
```

**Problems**:
1. Manual cause unwrapping
2. Error handling outside Effect pipeline
3. Bypasses Effect's typed error channel
4. Boilerplate duplication across handlers

### Pattern: Effect-Native Error Handling

**Use catchTag/catchTags**:

```typescript
const myApp: HttpApp<never, ValidationError | NotFoundError> = 
  Effect.gen(function* () {
    const service = yield* MyService;
    const result = yield* service.process();
    return HttpServerResponse.json(result);
  }).pipe(
    // ✅ Type-safe error handling in Effect
    Effect.catchTag("ValidationError", (e) =>
      Effect.succeed(
        HttpServerResponse.json(
          { error: e.message },
          { status: 400 }
        )
      )
    ),
    Effect.catchTag("NotFoundError", (e) =>
      Effect.succeed(
        HttpServerResponse.json(
          { error: "Resource not found" },
          { status: 404 }
        )
      )
    )
  );
```

**Benefits**:
- Type-safe error matching
- Compositional error handling
- Centralized error policies
- Preserves Effect's error channel

### Centralizing Error Handling

**Pattern**: Error handling middleware

```typescript
const withErrorHandling = <A, E, R>(
  app: HttpApp<A, E, R>
): HttpApp<A, never, R> =>
  app.pipe(
    Effect.catchTags({
      ValidationError: (e) =>
        HttpServerResponse.json(
          { error: e.message },
          { status: 400 }
        ),
      
      NotFoundError: (e) =>
        HttpServerResponse.json(
          { error: "Not found" },
          { status: 404 }
        ),
      
      UnauthorizedError: (e) =>
        HttpServerResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
    }),
    
    // Catch-all for unexpected errors
    Effect.catchAllDefect((defect) =>
      Effect.gen(function* () {
        yield* Logger.error("Unexpected error", defect);
        return HttpServerResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      })
    )
  );

// Apply to all handlers
const myApp = withErrorHandling(
  Effect.gen(function* () {
    // Business logic - errors handled automatically
  })
);
```

### Cause.squash for Defects

**Problem**: Multiple failure causes in Cause tree

```typescript
const handleExit = <A, E>(exit: Exit.Exit<A, E>) => {
  if (Exit.isFailure(exit)) {
    // ❌ cause might have parallel/sequential failures
    const cause = exit.cause;
    
    // Which error to handle?
    // cause.error - might not exist
    // Cause.failures(cause) - returns array
  }
};
```

**Solution**: `Cause.squash` - extracts "most important" error

```typescript
const handleExit = <A, E>(exit: Exit.Exit<A, E>) => {
  if (Exit.isFailure(exit)) {
    // ✅ Get most important error
    const error = Cause.squash(exit.cause);
    
    // Now handle single error
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
  }
};
```

**When to Use**: Outside Effect pipeline (not recommended, but sometimes necessary).

---

## Effect 4.0: Scope Changes

### The Unification

**Effect 3.x**: Two layer constructors

```typescript
// When service doesn't manage resources
Layer.effect(MyService, Effect.gen(function* () {
  return { /* implementation */ };
}));

// When service manages resources
Layer.scoped(MyService, Effect.gen(function* () {
  const resource = yield* Effect.acquireRelease(
    acquire,
    release
  );
  return { /* implementation */ };
}));
```

**Effect 4.x**: Single constructor

```typescript
// Always use `effect`
Layer.effect(MyService, Effect.gen(function* () {
  // If you need a scope, create one
  yield* Scope.make; // or just use Effect.acquireRelease
  
  return { /* implementation */ };
}));
```

**Why**:
- Simplifies mental model
- Scope creation explicit
- No decision fatigue

### Fork → ForkScoped

**Effect 3.x**:

```typescript
// fork: Not tied to scope (can leak)
const fiber = yield* Effect.fork(backgroundTask);

// forkScoped: Tied to current scope
const fiber = yield* Effect.forkScoped(backgroundTask);
```

**Effect 4.x**:

```typescript
// fork: Automatically tied to scope (requires Scope)
const fiber = yield* Effect.fork(backgroundTask);
// Type: Effect<Fiber<...>, never, Scope>

// forkChild: Old fork behavior (not scope-tied)
const fiber = yield* Effect.forkChild(backgroundTask);
```

**Migration**:
- `forkScoped` → `fork`
- `fork` → `forkChild` (if truly needed - rare)

### Auto-Supervision Still Applies

**Effect 3.x & 4.x**: Parent fiber automatically supervises children

```typescript
const parent = Effect.gen(function* () {
  const child = yield* Effect.fork(
    Effect.forever(Console.log("Working..."))
  );
  
  yield* Effect.sleep("5 seconds");
  // Parent exits → child interrupted automatically
});
```

**Additional in 4.x**: Scope provides explicit lifecycle boundary

```typescript
const parent = Effect.gen(function* () {
  const child = yield* Effect.fork(backgroundTask);
  // child tied to current scope
  
  yield* Effect.sleep("5 seconds");
  // Scope closes → child interrupted
});
```

---

## Real-World Code Review

### Tyler's Webhook Project

**Context**: GitHub webhook handler with Notion integration

**Architecture**:

```
webhook.ts (entry point)
├── GitHub service (webhook validation, parsing)
├── Notion service (update pages)
├── App config (environment variables)
└── Observability (OpenTelemetry, Effect DevTools)
```

### Key Insights from Review

#### 1. Function vs Service Tension

**Tyler's Question**: "Should GitHub functions be a service?"

```typescript
// Current: Module-level functions
export const validateGitHubWebhook = (
  signature: string,
  body: string
): Effect.Effect<void, ValidationError, AppConfig> =>
  Effect.gen(function* () {
    const config = yield* AppConfig;
    // Validation logic
  });

export const parseWebhookPayload = (
  body: unknown
): Effect.Effect<GitHubEvent, ParseError> =>
  Effect.gen(function* () {
    // Parsing logic
  });
```

**Could be a service**:

```typescript
class GitHubService extends Effect.Service<GitHubService>()(
  "app/GitHubService",
  {
    dependencies: [AppConfig.Default],
    
    effect: Effect.gen(function* () {
      const config = yield* AppConfig;
      
      return {
        validateWebhook: (signature: string, body: string) =>
          Effect.gen(function* () {
            // Validation logic
          }),
        
        parsePayload: (body: unknown) =>
          Effect.gen(function* () {
            // Parsing logic
          })
      };
    })
  }
) {}
```

**Verdict**: Either pattern is fine!

**Considerations**:
- Module functions: Simpler, less nesting
- Service: Better dependency management, consistent pattern

**Recommendation**: Services for stateful/resource-managing code, functions for pure utilities.

#### 2. Conditional Layer Selection

**Tyler's Pattern**: Swapping layers based on flags

```typescript
const NotionLayer = Effect.gen(function* () {
  const config = yield* AppConfig;
  
  if (config.dryRun) {
    return NotionService.DryRunLayer;
  }
  
  return NotionService.LiveLayer;
}).pipe(
  Layer.unwrapEffect
);
```

**Maxwell's Insight**: Perfect use of `Layer.unwrapEffect`

**When to Use**:
- Runtime configuration determines layer
- CLI flags, environment variables
- Conditional telemetry, feature flags

**Alternative**: Conditional logic in service methods

```typescript
class NotionService extends Effect.Service<NotionService>()(
  "app/NotionService",
  {
    dependencies: [AppConfig.Default],
    
    effect: Effect.gen(function* () {
      const config = yield* AppConfig;
      
      return {
        updatePage: (id: string, data: PageData) =>
          Effect.gen(function* () {
            if (config.dryRun) {
              yield* Console.log(`[DRY RUN] Would update ${id}`);
              return;
            }
            
            // Real update logic
            yield* notionClient.updatePage(id, data);
          })
      };
    })
  }
) {}
```

**Trade-offs**:
- `Layer.unwrapEffect`: Swaps entire implementation
- Conditional logic: Shares code, diverges at decision points

#### 3. Schema.Literal vs Schema.Union

**Tyler's Code**:

```typescript
// ❌ Verbose
const EventType = Schema.Union(
  Schema.Literal("pull_request"),
  Schema.Literal("push"),
  Schema.Literal("issue")
);
```

**Improvement**:

```typescript
// ✅ Terser
const EventType = Schema.Literal(
  "pull_request",
  "push",
  "issue"
);
```

**Note**: AI-generated code (Claude) produced verbose version.

#### 4. Observability Integration

**Tyler's Approach**: Layer composition with config

```typescript
const TracingLayer = Effect.gen(function* () {
  const config = yield* AppConfig;
  
  return NodeSdk.layer(() => ({
    resource: { serviceName: config.serviceName },
    spanProcessor: new BatchSpanProcessor(
      new OTLPTraceExporter({ url: config.otlpEndpoint })
    )
  }));
}).pipe(
  Layer.unwrapEffect
);

const DevToolsLayer = Effect.gen(function* () {
  const config = yield* AppConfig;
  
  if (!config.enableDevTools) {
    return Layer.empty;
  }
  
  return DevTools.layer();
}).pipe(
  Layer.unwrapEffect
);

const AppLayer = Layer.mergeAll(
  TracingLayer,
  DevToolsLayer,
  GitHubService.Default,
  NotionService.Default
);
```

**Pattern**: Configuration-driven observability

**Benefits**:
- Enable/disable tracing per environment
- Swap exporters (OTLP, Jaeger, console)
- Progressive enhancement

### Tyler's Insights

**Testing Success**:

> "This paid off with the team - the observability and error handling were impressive even with my implementation."

**Key Wins**:
1. **Observability**: OpenTelemetry + Effect DevTools
2. **Error handling**: Structured, typed errors
3. **Testability**: Property-based testing with `Schema.arbitrary`

**Property-Based Testing Example**:

```typescript
import * as Arbitrary from "@effect/schema/Arbitrary";

const GitHubEventArbitrary = Arbitrary.make(GitHubEventSchema);

it.effect("handles any valid GitHub event", () =>
  Effect.gen(function* () {
    // Generate random valid events
    const events = yield* Random.sample(GitHubEventArbitrary, 100);
    
    // All should parse successfully
    yield* Effect.forEach(events, (event) =>
      parseGitHubEvent(event)
    );
  })
);
```

---

## Advanced Patterns

### Scope.make for Custom Lifecycles

**Pattern**: Explicit scope creation within services

```typescript
class CacheService extends Effect.Service<CacheService>()(
  "app/CacheService",
  {
    effect: Effect.gen(function* () {
      // Create a scope for cache entries
      const scope = yield* Scope.make;
      
      const cache = new Map<string, unknown>();
      
      return {
        set: (key: string, value: unknown, ttl: Duration) =>
          Effect.gen(function* () {
            cache.set(key, value);
            
            // Add TTL finalizer to scope
            yield* scope.addFinalizer(() =>
              Effect.sync(() => {
                cache.delete(key);
              })
            ).pipe(
              Effect.delay(ttl)
            );
          }),
        
        get: (key: string) =>
          Effect.sync(() => cache.get(key))
      };
    })
  }
) {}
```

**Use Case**: Per-item lifecycles within service

### Layer Composition Strategies

**Strategy 1: Monolithic AppLayer**

```typescript
const AppLayer = Layer.mergeAll(
  ServiceA.Default,
  ServiceB.Default,
  ServiceC.Default,
  Database.Default,
  Logger.Default
);
```

**Pros**:
- Simple, one place
- Easy to understand

**Cons**:
- Changes require editing central file
- Less modular

**Strategy 2: Modular Composition**

```typescript
// infrastructure.ts
export const InfraLayer = Layer.mergeAll(
  Database.Default,
  Cache.Default,
  Queue.Default
);

// domain.ts
export const DomainLayer = Layer.mergeAll(
  UserService.Default,
  OrderService.Default
).pipe(
  Layer.provide(InfraLayer)
);

// app.ts
export const AppLayer = Layer.mergeAll(
  DomainLayer,
  ApiService.Default
);
```

**Pros**:
- Co-located with domain
- Easier to test subsystems
- Clear boundaries

**Cons**:
- More files to navigate

**Recommendation**: Modular for large apps, monolithic for small apps.

---

## Practical Checklist

### Service Design
- [ ] Yield all dependencies at top of Effect.gen
- [ ] Never use accessors inside service methods
- [ ] Return implementation object (defines interface implicitly)
- [ ] Use `dependencies` array for stable defaults
- [ ] Use `scoped` for resource management

### Layer Composition
- [ ] Locally eliminate dependencies
- [ ] Export fully-satisfied layers (`∅ → Service`)
- [ ] Use `DefaultWithoutDependencies` in tests
- [ ] Extract layer factory calls to constants (avoid re-creation)

### Scope Management
- [ ] Use `Layer.scoped` for services with resources
- [ ] Use `Effect.acquireRelease` for explicit lifecycle
- [ ] Use `Effect.addFinalizer` for cleanup logic
- [ ] Use `Effect.forkScoped` (or `Effect.fork` in 4.0) for background fibers

### HTTP Handlers
- [ ] Use `HttpApp` type for handlers
- [ ] Access request from environment, not parameters
- [ ] Return response as Effect result
- [ ] Use `Effect.catchTag` for error handling
- [ ] Convert with `toWebHandler` or `toWebHandlerLayer`

### Testing
- [ ] Create test layers for leaf services only
- [ ] Make test implementations inspectable
- [ ] Reuse test layers across all tests
- [ ] Never use traditional mocks

### Error Handling
- [ ] Define errors with `Data.TaggedError`
- [ ] Handle errors in Effect pipeline (`catchTag`)
- [ ] Avoid manual `Exit` inspection
- [ ] Centralize error handling policies

---

## Summary: Key Principles

### The Canonical Pattern
95% of Effect code follows the same pattern:
1. Define service with `Effect.Service`
2. Yield dependencies at top
3. Return implementation object

### Accessors: Use Sparingly
- Safe at application entry point
- Safe in tests
- **Never** inside service methods (leaks dependencies)

### Dependencies Array: Local Elimination
- Provide stable defaults
- Eliminate transitive dependencies
- Keep root layer clean

### Scopes: Resource Management
- Finalizers run in LIFO order
- Guaranteed cleanup on any exit
- Use `Layer.scoped` for services with resources
- Tie background fibers to scopes

### Testing Philosophy
- Test layers only for leaf nodes
- Use production implementations with test dependencies
- No per-test mocks
- Behavioral equivalence

### Effect 4.0 Evolution
- `Layer.effect` only (no `Layer.scoped`)
- `Effect.fork` automatically scoped
- `Effect.forkChild` for old `fork` behavior
- Explicit scope creation when needed

---

*This reference captures the fifth Effect Office Hours session on layers, dependency injection, accessors, and scopes. Patterns discussed are production-ready and battle-tested.*
