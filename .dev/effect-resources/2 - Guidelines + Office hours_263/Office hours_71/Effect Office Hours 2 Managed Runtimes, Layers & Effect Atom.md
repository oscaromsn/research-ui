---
modified: 2025-10-27T17:08:48-03:00
---
# Effect Office Hours #2: Managed Runtimes, Layers & Effect Atom
## Comprehensive Reference Guide

**Source**: Effect Office Hours #2 - Managed Runtimes, Layers, Effect Atom
**Format**: Live Q&A, Code Deep Dives, Architecture Patterns
**Focus Areas**: Incremental Adoption, Runtime Management, Effect Atom, Memo Maps

---

## Table of Contents

1. [Incremental Effect Adoption Strategy](#incremental-effect-adoption-strategy)
2. [Managed Runtime Pattern](#managed-runtime-pattern)
3. [Effect.runtime - Extracting Current Runtime](#effectruntime---extracting-current-runtime)
4. [Effect Atom: Reactive State Management](#effect-atom-reactive-state-management)
5. [Memo Map Mechanics Deep Dive](#memo-map-mechanics-deep-dive)
6. [Service Singleton Guarantees](#service-singleton-guarantees)
7. [Next.js Integration Patterns](#nextjs-integration-patterns)
8. [Better Auth Integration Case Study](#better-auth-integration-case-study)
9. [Runtime Internals: Effect.provide Demystified](#runtime-internals-effectprovide-demystified)
10. [Production Patterns & Best Practices](#production-patterns--best-practices)

---

## Incremental Effect Adoption Strategy

### The Fundamental Challenge

**Scenario**: Large existing production codebase, not everyone on board with Effect

**Anti-Pattern**: ❌ Big Bang Rewrite

```typescript
// DON'T: Rewrite everything top-down
async function main() {
  // Rewrite entry point
  const app = await Effect.runPromise(
    // Rewrite all route handlers
    setupRoutes.pipe(
      // Rewrite all middleware
      Effect.flatMap(setupMiddleware),
      // Rewrite all services
      Effect.flatMap(setupServices),
      // Now team can't ship features!
      Effect.provide(/* everything */)
    )
  );
}
```

**Problems**:
- Development velocity crashes
- Team becomes blocked
- Knowledge gap widens
- Negative reaction to Effect
- Can't ship features during transition

### The Adoption Curve

**Reality**: Every technology follows this emotional journey

```
Phase 1: "This is completely useless" 😤
Phase 2: "Maybe useful for 1% of problems" 🤔
Phase 3: "Actually useful for most code" 🙂
Phase 4: "I love it, write everything with Effect!" 😍
```

**Similar to**: TypeScript, Tailwind, JSX, Assembly (yes, really)

**Key Insight**: Don't force people through phases 1-3 simultaneously while blocking feature development

### Strategy 1: Start with Leaves (Recommended)

**Definition of "Leaf"**: Small, isolated pieces of functionality

**Examples**:
- Utility functions
- Data validation logic
- API client wrappers
- Business logic modules
- Individual service implementations

**Example: Leaf Rewrite**

```typescript
// Before: Promise-based
export async function validateUser(data: unknown): Promise<User> {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid data");
  }
  // ... validation logic
  return data as User;
}

// After: Effect-based (leaf node)
import { Effect, Schema } from "effect";

const UserSchema = Schema.Struct({
  id: Schema.Number,
  email: Schema.String,
  name: Schema.String
});

export const validateUser = (data: unknown): Effect.Effect<User, ParseError> =>
  Schema.decodeUnknown(UserSchema)(data);

// Still usable by non-Effect code via wrapper
export const validateUserPromise = (data: unknown): Promise<User> =>
  Effect.runPromise(validateUser(data));
```

**Benefits**:
- Small scope, low risk
- Can be done incrementally
- Provides immediate value
- Doesn't block feature work
- Team learns gradually

### Strategy 2: Entry Point + Leaves (Hybrid)

**Pattern**: Rewrite entry point for infrastructure, leaves for logic

**Example: Express Server**

```typescript
// entry.ts - Rewrite THIS for infrastructure setup
import express from "express";
import { Effect, Layer } from "effect";

// Set up layers at entry point
const AppLayer = Layer.mergeAll(
  Database.Default,
  Logger.Default,
  Cache.Default
);

// Create managed runtime ONCE
const runtime = ManagedRuntime.make(AppLayer);

// Traditional Express app
const app = express();

// Handlers can use Effect + runtime
app.get("/users/:id", async (req, res) => {
  const program = Effect.gen(function* () {
    const userService = yield* UserService;
    return yield* userService.getUser(Number(req.params.id));
  });
  
  try {
    const user = await runtime.runPromise(program);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.listen(3000);

// Cleanup on shutdown
process.on("SIGTERM", () => {
  runtime.dispose();
});
```

**Then rewrite leaves (route handlers) one by one**:

```typescript
// handlers/users.ts - Rewrite THESE incrementally
export const getUser = (id: number) =>
  Effect.gen(function* () {
    const users = yield* UserService;
    return yield* users.getUser(id);
  });

export const createUser = (data: CreateUserData) =>
  Effect.gen(function* () {
    const users = yield* UserService;
    const validator = yield* Validator;
    
    const validated = yield* validator.validate(data);
    return yield* users.create(validated);
  });

// Express handler
app.post("/users", async (req, res) => {
  const result = await runtime.runPromise(
    createUser(req.body)
  );
  res.json(result);
});
```

**Benefits**:
- Infrastructure setup done once (layers)
- Handlers rewritten gradually
- Each handler is isolated
- Team velocity maintained
- Immediate observability benefits

### Strategy 3: Provide Promise Wrappers

**Pattern**: Effect internals, Promise surface area

```typescript
// UserService.ts - Internal implementation uses Effect
class UserService extends Effect.Service<UserService>()(
  "UserService",
  {
    dependencies: [Database.Default, Logger.Default],
    effect: Effect.gen(function* () {
      const db = yield* Database;
      const logger = yield* Logger;
      
      return {
        getUser: (id: number): Effect.Effect<User, NotFoundError> =>
          Effect.gen(function* () {
            yield* logger.info(`Fetching user ${id}`);
            return yield* db.query("SELECT * FROM users WHERE id = $1", [id]);
          })
      };
    })
  }
) {}

// UserService.promise.ts - Promise wrapper for gradual adoption
export class UserServicePromise {
  constructor(private runtime: ManagedRuntime) {}
  
  async getUser(id: number): Promise<User> {
    return this.runtime.runPromise(
      Effect.gen(function* () {
        const service = yield* UserService;
        return yield* service.getUser(id);
      })
    );
  }
}

// Team can use Promise version during transition
const userService = new UserServicePromise(runtime);
const user = await userService.getUser(123);
```

**Benefits**:
- Non-Effect team members can use services
- Type safety maintained
- Effect benefits (logging, tracing) still work
- Can remove wrappers later
- Smooth transition path

### Strategy 4: AI-Assisted Learning

**agents.md Pattern**: Document patterns for AI assistance

```markdown
# Effect Patterns for This Codebase

## Service Definition Pattern
Always define services using Effect.Service:
```typescript
class MyService extends Effect.Service<MyService>()(
  "app/MyService",
  {
    dependencies: [Database.Default],
    effect: Effect.gen(function* () {
      const db = yield* Database;
      return {
        method: (arg: string) => Effect.succeed(arg)
      };
    })
  }
) {}
```

## Error Handling Pattern
Use tagged errors for expected failures:

```typescript
class NotFoundError extends Data.TaggedError("NotFoundError")<{
  id: number;
}> {}
```

## Layer Composition Pattern
Always provide dependencies locally:

```typescript
const MyServiceLayer = Layer.effect(MyService, ...).pipe(
  Layer.provide(DatabaseLayer)
);
```

```

**Usage**: Point AI at patterns for:
1. **Code Generation**: "Write a new service following our patterns"
2. **Code Understanding**: "Explain what this Effect code does"
3. **Debugging**: "Why is this Effect failing?"
4. **Refactoring**: "Convert this Promise code to Effect"

**Benefits**:
- Reduces learning curve
- Consistent patterns
- AI becomes team multiplier
- Documentation stays current

### Key Guidelines

#### DO ✅
- Start small (leaves)
- Maintain velocity
- Provide Promise wrappers
- Document patterns (agents.md)
- Use managed runtime for shared context
- Rewrite entry point for infrastructure
- Let team learn gradually

#### DON'T ❌
- Big bang rewrites
- Block feature development
- Force adoption without buy-in
- Neglect Promise compatibility layer
- Create multiple runtimes carelessly
- Ignore team feedback

### Measuring Success

**Positive Indicators**:
- Team velocity maintained or improved
- Fewer production bugs
- Better observability
- Easier debugging
- Code reviews smoother
- Team asks to use Effect more

**Warning Signs**:
- Velocity crashes
- Team frustration increases
- More time debugging Effect than business logic
- PRs blocked on Effect knowledge
- Team avoiding Effect code

---

## Managed Runtime Pattern

### The Problem: Running Effects Outside Effect Context

**Scenario**: Main entry point is not an Effect

```typescript
// Express/Next.js/etc. - main is NOT an Effect
const app = express();

app.get("/users/:id", async (req, res) => {
  // Need to run Effect here, but how?
  // Can't use Effect.runPromise directly - loses context!
  const user = await Effect.runPromise(
    getUserEffect(req.params.id)
  );
});
```

**Problem**: `Effect.runPromise` uses default runtime (no layers/context)

### Solution: Managed Runtime

**Definition**: A long-lived runtime with pre-constructed layers

```typescript
import { ManagedRuntime, Layer } from "effect";

// Define layers
const DatabaseLayer = Layer.effect(Database, /* ... */);
const LoggerLayer = Layer.succeed(Logger, /* ... */);
const CacheLayer = Layer.effect(Cache, /* ... */);

// Compose into app layer
const AppLayer = Layer.mergeAll(
  DatabaseLayer,
  LoggerLayer,
  CacheLayer
);

// Create managed runtime ONCE at application startup
const runtime = ManagedRuntime.make(AppLayer);

// Use throughout application
app.get("/users/:id", async (req, res) => {
  const user = await runtime.runPromise(
    getUserEffect(req.params.id)
  );
  res.json(user);
});
```

**Key Properties**:
1. Created once at startup
2. Layers built once, cached
3. Shared across all usages
4. Must be disposed on shutdown

### Lifecycle Management

```typescript
// Create at startup
const runtime = ManagedRuntime.make(AppLayer);

// Use during application lifetime
async function handleRequest(req: Request) {
  return runtime.runPromise(/* Effect */);
}

// Cleanup on shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await runtime.dispose();
  console.log("Runtime disposed");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Interrupted, shutting down...");
  await runtime.dispose();
  process.exit(0);
});
```

**Why Cleanup Matters**:
- Closes database connections
- Flushes logs
- Releases file handles
- Prevents socket leaks
- Kubernetes/Docker graceful shutdown

### Managed Runtime Methods

```typescript
const runtime = ManagedRuntime.make(AppLayer);

// Run Effect and return Promise
const result = await runtime.runPromise(myEffect);

// Run Effect synchronously (must be sync!)
const result = runtime.runSync(mySyncEffect);

// Fork Effect (returns Fiber)
const fiber = runtime.runFork(myEffect);
await fiber.await;

// Dispose runtime (cleanup)
await runtime.dispose();
```

### When to Use Managed Runtime

**Use When**:
- ✅ Main entry point is not Effect
- ✅ Express/Fastify/Next.js applications
- ✅ Multiple execution boundaries
- ✅ Need shared context across requests
- ✅ Incremental adoption

**Don't Use When**:
- ❌ Pure Effect application (use Effect.runPromise at main)
- ❌ No shared services needed
- ❌ Simple scripts (use Effect.runPromise)

### Multiple Managed Runtimes (Advanced)

**Scenario**: Different parts of app need different contexts

```typescript
// Shared infrastructure
const InfraLayer = Layer.mergeAll(
  DatabaseLayer,
  LoggerLayer
);

// API-specific runtime
const ApiRuntime = ManagedRuntime.make(
  Layer.mergeAll(
    InfraLayer,
    AuthLayer,
    RateLimitLayer
  )
);

// Background jobs runtime
const JobsRuntime = ManagedRuntime.make(
  Layer.mergeAll(
    InfraLayer,
    QueueLayer,
    WorkerPoolLayer
  )
);

// Use appropriate runtime
app.post("/api/users", async (req, res) => {
  const result = await ApiRuntime.runPromise(/* ... */);
  res.json(result);
});

queue.process(async (job) => {
  await JobsRuntime.runPromise(/* ... */);
});
```

**Problem**: Services in `InfraLayer` might be constructed twice!

**Solution**: Shared Memo Map (see [Memo Map section](#memo-map-mechanics-deep-dive))

---

## Effect.runtime - Extracting Current Runtime

### The Problem: Execution Boundaries Within Layers

**Scenario**: Layer constructor needs to run Effects at callbacks/execution boundaries

```typescript
// Better Auth integration example
const AuthServiceLayer = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    const db = yield* Database;
    
    // Better Auth expects Promise callbacks
    const auth = betterAuth({
      emailVerification: {
        sendVerificationEmail: async (user, url) => {
          // ❌ How to run Effect here with db context?
          // Can't use Effect.runPromise - loses db!
          await Effect.runPromise(
            sendVerificationEmail(user, url)
          );
        }
      }
    });
    
    return AuthService.of({ auth });
  })
);
```

**Problem**: Callback is outside Effect context, but needs services!

### Solution: Effect.runtime

**Pattern**: Extract runtime in layer constructor, use in callbacks

```typescript
import { Effect, Runtime } from "effect";

const AuthServiceLayer = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    // 1. Get services needed
    const db = yield* Database;
    const logger = yield* Logger;
    
    // 2. Extract current runtime
    const runtime = yield* Effect.runtime<Database | Logger>();
    
    // 3. Create typed runPromise with current context
    const runPromise = Runtime.runPromise(runtime);
    
    // 4. Use in callbacks - has full context!
    const auth = betterAuth({
      emailVerification: {
        sendVerificationEmail: async (user, url) => {
          // ✅ Runs with db + logger context
          await runPromise(
            Effect.gen(function* () {
              yield* logger.info(`Sending verification to ${user.email}`);
              const template = yield* db.query("SELECT * FROM email_templates...");
              yield* sendEmail(user.email, url, template);
            })
          );
        }
      }
    });
    
    return AuthService.of({ auth });
  })
);
```

### Type Safety with Effect.runtime

**Key Feature**: Specify required services in type parameter

```typescript
const AuthServiceLayer = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    // Specify which services runtime needs
    const runtime = yield* Effect.runtime<Database | Logger | EmailService>();
    
    // Type error if you forget to require a service!
    const runPromise = Runtime.runPromise(runtime);
    
    const auth = betterAuth({
      emailVerification: {
        sendVerificationEmail: async (user, url) => {
          await runPromise(
            Effect.gen(function* () {
              const db = yield* Database;       // ✅ Available
              const logger = yield* Logger;     // ✅ Available
              const email = yield* EmailService; // ✅ Available
              // const cache = yield* Cache;     // ❌ Type error! Not in runtime
            })
          );
        }
      }
    });
    
    return AuthService.of({ auth });
  })
);

// Type signature shows dependencies
// Layer<AuthService, never, Database | Logger | EmailService>
```

### Complete Pattern

```typescript
const makeAuthService = Effect.gen(function* () {
  // 1. Acquire dependencies at construction time
  const db = yield* Database;
  const logger = yield* Logger;
  const config = yield* Config;
  
  // 2. Extract runtime with required dependencies
  const runtime = yield* Effect.runtime<Database | Logger>();
  const runPromise = Runtime.runPromise(runtime);
  
  // 3. Create external library integration
  const auth = betterAuth({
    database: {
      // All callbacks use runPromise for context
      findUser: async (id) => 
        runPromise(
          db.query("SELECT * FROM users WHERE id = $1", [id])
        ),
      
      createUser: async (data) =>
        runPromise(
          Effect.gen(function* () {
            yield* logger.info("Creating user");
            return yield* db.query("INSERT INTO users ...", data);
          })
        )
    },
    
    emailVerification: {
      sendVerificationEmail: async (user, url) =>
        runPromise(
          Effect.gen(function* () {
            yield* logger.info(`Sending verification to ${user.email}`);
            yield* sendEmail(user.email, url);
          })
        )
    }
  });
  
  // 4. Return service interface
  return {
    signIn: (credentials: Credentials) =>
      Effect.tryPromise({
        try: () => auth.signIn(credentials),
        catch: (error) => new AuthError({ cause: error })
      }),
    
    signOut: () =>
      Effect.tryPromise({
        try: () => auth.signOut(),
        catch: (error) => new AuthError({ cause: error })
      })
  };
});

const AuthServiceLayer = Layer.effect(AuthService, makeAuthService);
```

### When to Use Effect.runtime

**Use When**:
- ✅ Integrating with Promise-based libraries
- ✅ Callbacks need Effect services
- ✅ Third-party library expects async functions
- ✅ Execution boundaries in layer constructors

**Pattern Recognition**:

```typescript
// If you see this pattern:
const layer = Layer.effect(Service, Effect.gen(function* () {
  const dep = yield* Dependency;
  
  return {
    method: async () => {
      // ❌ Need to run Effect here with dep!
      await Effect.runPromise(/* uses dep */);
    }
  };
}));

// Use Effect.runtime:
const layer = Layer.effect(Service, Effect.gen(function* () {
  const dep = yield* Dependency;
  const runtime = yield* Effect.runtime<Dependency>();
  const runPromise = Runtime.runPromise(runtime);
  
  return {
    method: async () => {
      // ✅ Runs with dep context
      await runPromise(/* uses dep */);
    }
  };
}));
```

### Comparison: Effect.runPromise vs Runtime.runPromise

```typescript
// Effect.runPromise (default runtime)
await Effect.runPromise(myEffect);
// - Uses Effect.defaultRuntime
// - No layers provided
// - No custom configuration
// - Good for: scripts, simple programs

// Runtime.runPromise (custom runtime)
const runtime = yield* Effect.runtime<MyService>();
await Runtime.runPromise(runtime)(myEffect);
// - Uses current runtime
// - Layers from context available
// - Custom configuration preserved
// - Good for: library integration, callbacks
```

---

## Effect Atom: Reactive State Management

### The Problem: Effect on the Frontend

**Challenges**:
1. Main entry point is React, not Effect
2. State management separate from business logic
3. Need reactive updates across components
4. Services need to be singletons
5. Managing runtime lifecycle is complex

### Effect Atom Solution

**Definition**: Reactive state management library with deep Effect integration

**Key Features**:
- Jotai-like API (Atoms for state)
- Atoms can depend on other Atoms
- Full Effect service integration
- Shared memo map (service singletons)
- React hooks for consumption

### Basic Example

```typescript
import { Atom } from "@effect/experimental";
import { Effect } from "effect";

// Create simple Atom
const counterAtom = Atom.make(0);

// Create derived Atom
const doubleAtom = Atom.make((get) => get(counterAtom) * 2);

// Use in React
function Counter() {
  const [count, setCount] = Atom.useAtom(counterAtom);
  const double = Atom.useAtomValue(doubleAtom);
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>Double: {double}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Effect Service Integration

**The Killer Feature**: Atoms can use Effect services

```typescript
import { Atom } from "@effect/experimental";
import { Effect, Layer } from "effect";

// Define Effect service
class UserService extends Effect.Service<UserService>()(
  "UserService",
  {
    dependencies: [HttpClient.Default],
    effect: Effect.gen(function* () {
      const http = yield* HttpClient.HttpClient;
      
      return {
        getUser: (id: number) =>
          http.get(`/api/users/${id}`).pipe(
            Effect.flatMap(res => res.json),
            Effect.map(data => data as User)
          )
      };
    })
  }
) {}

// Create Atom runtime with layers
const runtime = Atom.runtime((layer) =>
  layer.pipe(
    Layer.provide(UserService.Default),
    Layer.provide(HttpClient.layer)
  )
);

// Create Atom that uses service
const currentUserAtom = runtime.atom((get) =>
  Effect.gen(function* () {
    const userService = yield* UserService;
    const userId = get(userIdAtom); // Depends on another Atom
    return yield* userService.getUser(userId);
  })
);

// Use in React
function UserProfile() {
  const user = Atom.useAtomValue(currentUserAtom);
  
  return Effect.match(user, {
    onFailure: (error) => <div>Error: {error.message}</div>,
    onSuccess: (user) => <div>{user.name}</div>
  });
}
```

### Shared Memo Map (Service Singletons)

**Problem**: Multiple Atom runtimes might create duplicate services

```typescript
// Runtime 1
const runtime1 = Atom.runtime((layer) =>
  layer.pipe(Layer.provide(CacheService.Default))
);

// Runtime 2
const runtime2 = Atom.runtime((layer) =>
  layer.pipe(Layer.provide(CacheService.Default))
);

// ⚠️ Without shared memo map: CacheService created TWICE
```

**Solution**: Atom automatically shares memo map globally

```typescript
// Atom has a SHARED GLOBAL memo map
// CacheService created ONCE, shared across all runtimes

const runtime1 = Atom.runtime((layer) =>
  layer.pipe(Layer.provide(CacheService.Default))
);

const runtime2 = Atom.runtime((layer) =>
  layer.pipe(Layer.provide(CacheService.Default))
);

// ✅ CacheService is a singleton across both runtimes
```

### Advanced Pattern: API Client Integration

```typescript
import { Atom } from "@effect/experimental";
import { Effect, HttpClient } from "effect";

// Define API service
class ApiService extends Effect.Service<ApiService>()(
  "ApiService",
  {
    dependencies: [HttpClient.Default],
    effect: Effect.gen(function* () {
      const http = yield* HttpClient.HttpClient;
      
      return {
        get: <A>(path: string) =>
          http.get(`https://api.example.com${path}`).pipe(
            Effect.flatMap(res => res.json),
            Effect.map(data => data as A)
          ),
        
        post: <A, B>(path: string, body: A) =>
          http.post(`https://api.example.com${path}`, { body }).pipe(
            Effect.flatMap(res => res.json),
            Effect.map(data => data as B)
          )
      };
    })
  }
) {}

// Create runtime with API service
const apiRuntime = Atom.runtime((layer) =>
  layer.pipe(
    Layer.provide(ApiService.Default),
    Layer.provide(HttpClient.layer)
  )
);

// Create query Atoms
const usersAtom = apiRuntime.atom(() =>
  Effect.gen(function* () {
    const api = yield* ApiService;
    return yield* api.get<User[]>("/users");
  })
);

const userAtom = (id: number) =>
  apiRuntime.atom(() =>
    Effect.gen(function* () {
      const api = yield* ApiService;
      return yield* api.get<User>(`/users/${id}`);
    })
  );

// Mutation Atoms
const createUserAtom = apiRuntime.atom((get, set, data: CreateUserData) =>
  Effect.gen(function* () {
    const api = yield* ApiService;
    const newUser = yield* api.post<CreateUserData, User>("/users", data);
    
    // Update users list
    const users = get(usersAtom);
    set(usersAtom, Effect.succeed([...users, newUser]));
    
    return newUser;
  })
);

// Use in React
function UserList() {
  const users = Atom.useAtomValue(usersAtom);
  const [, createUser] = Atom.useAtom(createUserAtom);
  
  const handleCreate = async () => {
    await createUser({
      name: "New User",
      email: "new@example.com"
    });
  };
  
  return (
    <div>
      {Effect.match(users, {
        onFailure: (error) => <div>Error: {error.message}</div>,
        onSuccess: (userList) => (
          <>
            {userList.map(user => (
              <div key={user.id}>{user.name}</div>
            ))}
            <button onClick={handleCreate}>Create User</button>
          </>
        )
      })}
    </div>
  );
}
```

### Effect Atom Benefits

**For Frontend Development**:
1. ✅ **Reactive by Default**: Atoms update downstream dependencies automatically
2. ✅ **Service Singletons**: Shared memo map ensures one instance
3. ✅ **Effect Integration**: Full Effect ecosystem available
4. ✅ **Type Safety**: Complete type inference
5. ✅ **Observability**: Built-in tracing/logging from Effect
6. ✅ **Error Handling**: Typed errors throughout

**Compared to Redux/Zustand**:
- More reactive (less boilerplate)
- Services properly modeled
- Dependency injection built-in
- Type-safe error channel
- Better observability

**Compared to React Query**:
- More composable
- Services beyond HTTP
- Proper Effect integration
- Type-safe throughout
- Richer ecosystem

### When to Use Effect Atom

**Use When**:
- ✅ React/Frontend application
- ✅ Need Effect services on frontend
- ✅ Complex state dependencies
- ✅ Want reactive updates
- ✅ Type-safe state management

**Don't Use When**:
- ❌ Pure backend application
- ❌ Simple local component state
- ❌ No service dependencies needed

---

## Memo Map Mechanics Deep Dive

### What is a Memo Map?

**Definition**: Internal cache that stores constructed layers by reference identity

**Purpose**: Ensure services are singletons (constructed once)

### How Effect.provide Works (Simplified)

```typescript
// Pseudocode of what happens internally
Effect.provide = (effect, layer) => {
  // 1. Create scope for resource management
  const scope = Scope.make();
  
  // 2. Create memo map for layer memoization
  const memoMap = MemoMap.make();
  
  // 3. Build layer with scope and memo map
  const context = layer.build(scope, memoMap);
  
  // 4. Provide context to effect
  const result = effect.run(context);
  
  // 5. Cleanup when done
  scope.close();
  
  return result;
};
```

### Layer Building Process

**Step-by-Step**:

```typescript
const layer = Layer.effect(
  MyService,
  Effect.gen(function* () {
    console.log("Building MyService");
    return MyService.of({ /* ... */ });
  })
);

// First provide
Effect.provide(myEffect, layer);
// Logs: "Building MyService"

// Second provide
Effect.provide(myEffect, layer);
// Logs: "Building MyService" (again!)
// Different memo map = rebuilt
```

**Key Insight**: Each `Effect.provide` creates NEW memo map

### Manual Memo Map Management

**Pattern**: Build layer manually with shared memo map

```typescript
import { Effect, Layer, MemoMap, Scope } from "effect";

// Create shared memo map
const memoMap = MemoMap.make();

// Build layer with memo map
const buildLayer = (layer: Layer<A, E, R>) =>
  Effect.gen(function* () {
    const scope = yield* Scope.make();
    return yield* Layer.build(layer, scope, memoMap);
  });

// First build
const context1 = yield* buildLayer(MyServiceLayer);
// Logs: "Building MyService"

// Second build (same memo map!)
const context2 = yield* buildLayer(MyServiceLayer);
// No log - already in memo map!

// Both contexts share the same service instance
```

### Complete Example: Multiple Runtimes, Shared Services

```typescript
import { ManagedRuntime, Layer, MemoMap, Scope } from "effect";

// Define services
class CacheService extends Effect.Service<CacheService>()(
  "CacheService",
  {
    effect: Effect.gen(function* () {
      console.log("Creating cache");
      return {
        get: (key: string) => Effect.succeed(null),
        set: (key: string, value: unknown) => Effect.unit
      };
    })
  }
) {}

// Create SHARED memo map
const sharedMemoMap = MemoMap.make();

// Create multiple managed runtimes
const createRuntimeWithSharedMemo = (layers: Layer<any, any, any>) =>
  Effect.gen(function* () {
    const scope = yield* Scope.make();
    
    // Build with shared memo map
    const context = yield* Layer.build(
      layers,
      scope,
      sharedMemoMap
    );
    
    return ManagedRuntime.make({
      context,
      scope,
      memoMap: sharedMemoMap
    });
  });

// Runtime 1
const runtime1 = yield* createRuntimeWithSharedMemo(
  Layer.mergeAll(
    CacheService.Default,
    ApiService.Default
  )
);

// Runtime 2
const runtime2 = yield* createRuntimeWithSharedMemo(
  Layer.mergeAll(
    CacheService.Default,  // Same layer!
    WorkerService.Default
  )
);

// Only logs "Creating cache" ONCE
// Both runtimes share the same CacheService instance
```

### Layer.fresh - Bypassing Memoization

**Use Case**: Want new instance every time

```typescript
const DatabaseLayer = Layer.effect(
  Database,
  Effect.gen(function* () {
    console.log("Connecting to database");
    return Database.of({ /* ... */ });
  })
);

// Normal: memoized
const context1 = yield* Layer.build(DatabaseLayer);
// Logs: "Connecting to database"

const context2 = yield* Layer.build(DatabaseLayer);
// No log - memoized

// Fresh: bypass memoization
const FreshDatabaseLayer = Layer.fresh(DatabaseLayer);

const context3 = yield* Layer.build(FreshDatabaseLayer);
// Logs: "Connecting to database" (again)

const context4 = yield* Layer.build(FreshDatabaseLayer);
// Logs: "Connecting to database" (again)
```

### Memo Map in Effect Atom

**Key Insight**: Effect Atom uses GLOBAL shared memo map

```typescript
// Internally in Effect Atom
const globalMemoMap = MemoMap.make();

// All Atom runtimes share this
Atom.runtime = (buildLayer) => {
  const scope = Scope.make();
  const layer = buildLayer(Layer.empty);
  
  const context = Layer.build(
    layer,
    scope,
    globalMemoMap  // Shared!
  );
  
  return new AtomRuntime(context);
};
```

**Result**: Services only constructed once across all Atom runtimes

### Visualizing Memo Map

```typescript
// Memo Map Conceptual Structure
type MemoMap = Map<LayerReference, ServiceInstance>;

// Example state:
{
  [DatabaseLayer reference]: DatabaseInstance,
  [LoggerLayer reference]: LoggerInstance,
  [CacheLayer reference]: CacheInstance
}

// Lookup:
if (memoMap.has(layer)) {
  return memoMap.get(layer);  // Cached!
} else {
  const instance = buildLayer(layer);
  memoMap.set(layer, instance);
  return instance;
}
```

---

## Service Singleton Guarantees

### The Fundamental Rule

**All services should be singletons** - whether stateful or stateless

**Why**:
1. **Consistency**: Same behavior across app
2. **Performance**: Don't rebuild unnecessarily
3. **State Coherence**: Stateful services need single instance
4. **Resource Management**: Connection pools, caches, etc.

### Singleton Violations (Anti-Patterns)

#### Anti-Pattern 1: Multiple Runtimes Without Shared Memo Map

```typescript
// ❌ WRONG: Services recreated per runtime
const runtime1 = ManagedRuntime.make(
  Layer.mergeAll(
    CacheService.Default,
    DatabaseService.Default
  )
);

const runtime2 = ManagedRuntime.make(
  Layer.mergeAll(
    CacheService.Default,  // Recreated!
    ApiService.Default
  )
);

// CacheService exists twice - different caches!
// Writing to cache in runtime1 doesn't affect runtime2
```

**Fix**: Share memo map

```typescript
const sharedMemoMap = MemoMap.make();

const runtime1 = createRuntimeWithSharedMemo(
  Layer.mergeAll(
    CacheService.Default,
    DatabaseService.Default
  ),
  sharedMemoMap
);

const runtime2 = createRuntimeWithSharedMemo(
  Layer.mergeAll(
    CacheService.Default,
    ApiService.Default
  ),
  sharedMemoMap
);

// ✅ CacheService is singleton
```

#### Anti-Pattern 2: Function-Generated Layers

```typescript
// ❌ WRONG: New layer reference each time
const makeLogger = () =>
  Layer.effect(
    Logger,
    Effect.sync(() => {
      console.log("Creating logger");
      return Logger.of({ /* ... */ });
    })
  );

const AppLayer = Layer.mergeAll(
  makeLogger(),  // New reference
  makeLogger()   // Another new reference
);

// Logs "Creating logger" twice!
```

**Fix**: Extract to constant

```typescript
// ✅ CORRECT: Same reference
const LoggerLayer = Layer.effect(
  Logger,
  Effect.sync(() => {
    console.log("Creating logger");
    return Logger.of({ /* ... */ });
  })
);

const AppLayer = Layer.mergeAll(
  LoggerLayer,  // Same reference
  LoggerLayer   // Same reference
);

// Logs "Creating logger" once
```

#### Anti-Pattern 3: Multiple Effect.provide Calls

```typescript
// ❌ WRONG: Each provide creates new memo map
const program1 = effect1.pipe(
  Effect.provide(DatabaseLayer)
);

const program2 = effect2.pipe(
  Effect.provide(DatabaseLayer)
);

await Effect.runPromise(program1); // Builds database
await Effect.runPromise(program2); // Builds database AGAIN
```

**Fix**: Use managed runtime or single provide

```typescript
// ✅ CORRECT: Managed runtime
const runtime = ManagedRuntime.make(DatabaseLayer);

await runtime.runPromise(effect1); // Builds database
await runtime.runPromise(effect2); // Reuses database

// OR: Single provide
const program = Effect.all([effect1, effect2]).pipe(
  Effect.provide(DatabaseLayer)
);
await Effect.runPromise(program); // Builds database once
```

### Stateful Service Example

```typescript
// In-memory cache service
class CacheService extends Effect.Service<CacheService>()(
  "CacheService",
  {
    effect: Effect.gen(function* () {
      // State: Map stored in closure
      const cache = new Map<string, unknown>();
      
      return {
        get: (key: string) =>
          Effect.sync(() => cache.get(key)),
        
        set: (key: string, value: unknown) =>
          Effect.sync(() => {
            cache.set(key, value);
          }),
        
        size: () =>
          Effect.sync(() => cache.size)
      };
    })
  }
) {}

// If CacheService created multiple times:
// - Different Map instances
// - Writes to one don't affect others
// - Cache misses when it should hit
// - BROKEN!

// Solution: Ensure singleton via:
// 1. Managed runtime (backend)
// 2. Effect Atom shared memo map (frontend)
// 3. Shared memo map (custom)
```

---

## Next.js Integration Patterns

### The Next.js Challenge

**Problems**:
1. Hot Module Reloading (HMR) recreates modules
2. Server and client both need Effect
3. Multiple runtimes (pages, API routes, middleware)
4. Global singleton pattern breaks with HMR

### The HMR Hack

**Problem**: HMR recreates runtime on every change

```typescript
// ❌ WRONG: Runtime recreated on HMR
// runtime.ts
export const runtime = ManagedRuntime.make(AppLayer);

// On HMR: New runtime created, old one not disposed
// Result: Memory leaks, duplicate services
```

**Solution**: Global singleton with HMR detection

```typescript
// runtime.ts
import { ManagedRuntime } from "effect";

// Use global to persist across HMR
declare global {
  var __runtime: ManagedRuntime<AppServices, never> | undefined;
}

// Create or reuse runtime
export const getRuntime = () => {
  if (!global.__runtime) {
    console.log("Creating runtime");
    global.__runtime = ManagedRuntime.make(AppLayer);
  }
  return global.__runtime;
};

// Cleanup on process exit
process.on("SIGTERM", () => {
  if (global.__runtime) {
    global.__runtime.dispose();
    global.__runtime = undefined;
  }
});
```

### Next.js API Route Pattern

```typescript
// app/api/users/[id]/route.ts
import { getRuntime } from "@/runtime";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const runtime = getRuntime();
  
  const program = Effect.gen(function* () {
    const userService = yield* UserService;
    return yield* userService.getUser(Number(params.id));
  });
  
  try {
    const user = await runtime.runPromise(program);
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
```

### Next.js Server Component Pattern

```typescript
// app/users/[id]/page.tsx
import { getRuntime } from "@/runtime";
import { Effect } from "effect";

export default async function UserPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const runtime = getRuntime();
  
  const user = await runtime.runPromise(
    Effect.gen(function* () {
      const userService = yield* UserService;
      return yield* userService.getUser(Number(params.id));
    })
  );
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Next.js Client Component with Effect Atom

```typescript
// app/components/UserList.tsx
"use client";

import { Atom } from "@effect/experimental";
import { useEffect } from "react";

const usersAtom = apiRuntime.atom(() =>
  Effect.gen(function* () {
    const api = yield* ApiService;
    return yield* api.get<User[]>("/api/users");
  })
);

export function UserList() {
  const users = Atom.useAtomValue(usersAtom);
  
  return Effect.match(users, {
    onFailure: (error) => <div>Error: {error.message}</div>,
    onSuccess: (userList) => (
      <ul>
        {userList.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    )
  });
}
```

---

## Better Auth Integration Case Study

### The Challenge

**Better Auth**: Promise-based authentication library with callbacks

**Requirements**:
- Database operations in callbacks
- Email sending in callbacks
- Validation in callbacks
- All need Effect services!

### Initial Attempt (Broken)

```typescript
// ❌ WRONG: Loses service context
const AuthServiceLayer = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    const db = yield* Database;
    
    const auth = betterAuth({
      emailVerification: {
        sendVerificationEmail: async (user, url) => {
          // ❌ How to access db here?
          await Effect.runPromise(
            sendEmail(user.email, url)
          );
          // Lost db context!
        }
      }
    });
    
    return AuthService.of({ auth });
  })
);
```

### Solution: Effect.runtime

```typescript
// ✅ CORRECT: Extract runtime for callbacks
const AuthServiceLayer = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    // 1. Get services
    const db = yield* Database;
    const logger = yield* Logger;
    const emailService = yield* EmailService;
    
    // 2. Extract runtime with all required services
    const runtime = yield* Effect.runtime<
      Database | Logger | EmailService
    >();
    const runPromise = Runtime.runPromise(runtime);
    
    // 3. Configure Better Auth with Effect-powered callbacks
    const auth = betterAuth({
      database: {
        // Database operations use Effect + services
        findUser: async (id: string) =>
          runPromise(
            Effect.gen(function* () {
              yield* logger.debug(`Finding user ${id}`);
              const result = yield* db.query(
                "SELECT * FROM users WHERE id = $1",
                [id]
              );
              return result[0] ?? null;
            })
          ),
        
        createUser: async (data: CreateUserData) =>
          runPromise(
            Effect.gen(function* () {
              yield* logger.info("Creating user");
              
              // Validate with schema
              const validated = yield* Schema.decodeUnknown(
                CreateUserSchema
              )(data);
              
              // Insert to database
              const result = yield* db.query(
                "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *",
                [validated.email, validated.name]
              );
              
              return result[0];
            })
          ),
        
        updateUser: async (id: string, data: Partial<User>) =>
          runPromise(
            Effect.gen(function* () {
              yield* logger.info(`Updating user ${id}`);
              yield* db.query(
                "UPDATE users SET ... WHERE id = $1",
                [id]
              );
            })
          )
      },
      
      emailVerification: {
        sendVerificationEmail: async (user, url) =>
          runPromise(
            Effect.gen(function* () {
              yield* logger.info(`Sending verification to ${user.email}`);
              
              // Use email service
              yield* emailService.send({
                to: user.email,
                subject: "Verify your email",
                body: `Click here: ${url}`
              });
              
              yield* logger.info("Verification email sent");
            })
          )
      },
      
      rateLimit: {
        enabled: true,
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000
      }
    });
    
    // 4. Return service with Better Auth instance
    return {
      signIn: (credentials: SignInCredentials) =>
        Effect.tryPromise({
          try: () => auth.api.signIn.email(credentials),
          catch: (error) => new AuthError({ 
            cause: error,
            message: "Sign in failed"
          })
        }),
      
      signOut: () =>
        Effect.tryPromise({
          try: () => auth.api.signOut(),
          catch: (error) => new AuthError({
            cause: error,
            message: "Sign out failed"
          })
        }),
      
      verifyEmail: (token: string) =>
        Effect.tryPromise({
          try: () => auth.api.verifyEmail({ token }),
          catch: (error) => new AuthError({
            cause: error,
            message: "Email verification failed"
          })
        })
    };
  })
);
```

### Usage in Next.js API Route

```typescript
// app/api/auth/signin/route.ts
import { getRuntime } from "@/runtime";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const runtime = getRuntime();
  const body = await request.json();
  
  const program = Effect.gen(function* () {
    const auth = yield* AuthService;
    return yield* auth.signIn(body);
  });
  
  return runtime.runPromise(program).then(
    (session) => NextResponse.json(session),
    (error) => NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  );
}
```

### Key Takeaways

1. **Effect.runtime**: Extract for callback integration
2. **Type Safety**: Specify required services in type param
3. **Observability**: All callbacks get logging/tracing
4. **Error Handling**: Typed errors throughout
5. **Testing**: Can mock services easily

---

## Runtime Internals: Effect.provide Demystified

### What Happens When You Call Effect.provide

**High-Level**:

```typescript
const result = Effect.provide(myEffect, myLayer);
```

**Under the Hood** (simplified):

```typescript
Effect.provide = <A, E, R>(
  effect: Effect<A, E, R>,
  layer: Layer<R, E2, R2>
) => {
  return Effect.gen(function* () {
    // 1. Create scope for resource management
    const scope = yield* Scope.make();
    
    // 2. Create memo map for memoization
    const memoMap = MemoMap.make();
    
    // 3. Build layer with scope and memo map
    const context = yield* Layer.build(layer, scope, memoMap);
    
    // 4. Provide context to effect
    return yield* effect.pipe(
      Effect.provideContext(context)
    );
    
    // 5. Scope cleanup happens automatically
  });
};
```

### Step-by-Step Visualization

```typescript
// Example setup
class MyService extends Effect.Service<MyService>()(
  "MyService",
  {
    effect: Effect.sync(() => {
      console.log("Building MyService");
      return { value: 42 };
    })
  }
) {}

const myEffect = Effect.gen(function* () {
  const service = yield* MyService;
  return service.value;
});

// Call Effect.provide
const program = Effect.provide(myEffect, MyService.Default);
```

**Step 1: Create Scope**

```typescript
const scope = Scope.make();
// Scope tracks resources for cleanup
// All layers built in this scope
```

**Step 2: Create Memo Map**

```typescript
const memoMap = MemoMap.make();
// Empty map: {}
```

**Step 3: Build Layer**

```typescript
// Check memo map
if (memoMap.has(MyService.Default)) {
  // Not in map, need to build
}

// Build service
const service = MyService.Default.build(scope, memoMap);
// Logs: "Building MyService"

// Add to memo map
memoMap.set(MyService.Default, service);
// Map now: { [MyService.Default]: { value: 42 } }

// Create context
const context = Context.make(MyService, service);
// Context: { MyService: { value: 42 } }
```

**Step 4: Provide Context**

```typescript
// Effect now has access to context
const result = myEffect.run(context);
// result = 42
```

**Step 5: Cleanup**

```typescript
// When Effect completes, scope closes
scope.close();
// Any finalizers registered run
```

### Multiple Layers Example

```typescript
class ServiceA extends Effect.Service<ServiceA>()(
  "ServiceA",
  { effect: Effect.sync(() => ({ name: "A" })) }
) {}

class ServiceB extends Effect.Service<ServiceB>()(
  "ServiceB",
  {
    dependencies: [ServiceA.Default],
    effect: Effect.gen(function* () {
      const a = yield* ServiceA;
      return { name: "B", dependsOn: a.name };
    })
  }
) {}

const AppLayer = Layer.mergeAll(
  ServiceA.Default,
  ServiceB.Default
);

const program = Effect.gen(function* () {
  const a = yield* ServiceA;
  const b = yield* ServiceB;
  return { a, b };
}).pipe(
  Effect.provide(AppLayer)
);
```

**Build Process**:

```typescript
// 1. Scope and memo map created
const scope = Scope.make();
const memoMap = MemoMap.make();

// 2. Build ServiceA.Default
if (!memoMap.has(ServiceA.Default)) {
  const serviceA = { name: "A" };
  memoMap.set(ServiceA.Default, serviceA);
}

// 3. Build ServiceB.Default (depends on A)
if (!memoMap.has(ServiceB.Default)) {
  // Get ServiceA from memo map (already built!)
  const serviceA = memoMap.get(ServiceA.Default);
  
  // Build ServiceB with A
  const serviceB = { 
    name: "B", 
    dependsOn: serviceA.name 
  };
  
  memoMap.set(ServiceB.Default, serviceB);
}

// 4. Create context with both services
const context = Context.make(ServiceA, serviceA)
  .pipe(Context.add(ServiceB, serviceB));

// 5. Run effect with context
const result = program.run(context);
// result = { 
//   a: { name: "A" }, 
//   b: { name: "B", dependsOn: "A" } 
// }
```

### Parallel Layer Building

**Key Optimization**: Layers without dependencies build in parallel

```typescript
const AppLayer = Layer.mergeAll(
  DatabaseLayer,     // No dependencies
  CacheLayer,        // No dependencies
  LoggerLayer,       // No dependencies
  UserServiceLayer,  // Depends on Database + Logger
  PostServiceLayer   // Depends on Database + Cache
);
```

**Build Order**:

```
Parallel Phase:
├─ DatabaseLayer  ┐
├─ CacheLayer     ├─ Build simultaneously
└─ LoggerLayer    ┘

Sequential Phase:
├─ UserServiceLayer  (waits for Database + Logger)
└─ PostServiceLayer  (waits for Database + Cache)
```

---

## Production Patterns & Best Practices

### Pattern 1: Graceful Shutdown

```typescript
// server.ts
import { ManagedRuntime } from "effect";

const runtime = ManagedRuntime.make(AppLayer);

// Express/Fastify server
const server = app.listen(3000);

// Graceful shutdown handler
const shutdown = async () => {
  console.log("Shutting down gracefully...");
  
  // 1. Stop accepting new connections
  await new Promise((resolve) => server.close(resolve));
  
  // 2. Dispose runtime (closes DB, flushes logs, etc.)
  await runtime.dispose();
  
  console.log("Shutdown complete");
  process.exit(0);
};

// Register signal handlers
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Handle uncaught errors
process.on("uncaughtException", async (error) => {
  console.error("Uncaught exception:", error);
  await shutdown();
});
```

### Pattern 2: Request Tracing

```typescript
// Automatic request tracing with Effect
const handleRequest = (req: Request, res: Response) => {
  const runtime = getRuntime();
  
  const program = Effect.gen(function* () {
    const users = yield* UserService;
    return yield* users.getUser(req.params.id);
  }).pipe(
    // Add span for this request
    Effect.withSpan("http.request", {
      attributes: {
        "http.method": req.method,
        "http.url": req.url,
        "user.id": req.params.id
      }
    })
  );
  
  runtime.runPromise(program).then(
    (user) => res.json(user),
    (error) => res.status(500).json({ error: error.message })
  );
};
```

### Pattern 3: Feature Flags with Effect

```typescript
class FeatureFlagService extends Effect.Service<FeatureFlagService>()(
  "FeatureFlagService",
  {
    dependencies: [Config.Default],
    effect: Effect.gen(function* () {
      const config = yield* Config;
      
      return {
        isEnabled: (flag: string) =>
          Effect.sync(() => 
            config.features?.[flag] ?? false
          )
      };
    })
  }
) {}

// Use in business logic
const getUsers = Effect.gen(function* () {
  const flags = yield* FeatureFlagService;
  const users = yield* UserService;
  
  const useNewQuery = yield* flags.isEnabled("new-query-engine");
  
  if (useNewQuery) {
    return yield* users.getUsersV2();
  } else {
    return yield* users.getUsers();
  }
});
```

### Pattern 4: Multi-Tenant Request Context

```typescript
class RequestContext extends Context.Tag("RequestContext")<
  RequestContext,
  {
    tenantId: string;
    userId: string;
    requestId: string;
    timestamp: number;
  }
>() {}

// Middleware to inject request context
const withRequestContext = (req: Request) =>
  Layer.succeed(RequestContext, {
    tenantId: req.headers["x-tenant-id"],
    userId: req.user?.id,
    requestId: req.headers["x-request-id"] || generateId(),
    timestamp: Date.now()
  });

// Use in handler
app.get("/users/:id", async (req, res) => {
  const program = Effect.gen(function* () {
    const ctx = yield* RequestContext;
    const users = yield* UserService;
    
    // Service automatically gets tenant context
    return yield* users.getUser(req.params.id);
  }).pipe(
    Effect.provide(withRequestContext(req)),
    Effect.provide(runtime)
  );
  
  const user = await Effect.runPromise(program);
  res.json(user);
});
```

### Pattern 5: Testing with Managed Runtime

```typescript
import { describe, it, beforeAll, afterAll } from "vitest";

describe("UserService", () => {
  let runtime: ManagedRuntime<UserService, never>;
  
  beforeAll(() => {
    runtime = ManagedRuntime.make(
      Layer.mergeAll(
        UserService.Default,
        DatabaseTest,  // Test database
        LoggerTest     // Test logger
      )
    );
  });
  
  afterAll(async () => {
    await runtime.dispose();
  });
  
  it("should get user by id", async () => {
    const user = await runtime.runPromise(
      Effect.gen(function* () {
        const users = yield* UserService;
        return yield* users.getUser(123);
      })
    );
    
    expect(user.id).toBe(123);
  });
});
```

---

## Summary: Key Principles

### Incremental Adoption
1. **Start Small**: Rewrite leaves, not roots
2. **Maintain Velocity**: Don't block features
3. **Provide Wrappers**: Promise compatibility
4. **Document Patterns**: agents.md for AI
5. **Measure Impact**: Track velocity and quality

### Managed Runtime
1. **One Runtime**: Create once at startup
2. **Shared Context**: All handlers use same runtime
3. **Graceful Shutdown**: Dispose on SIGTERM
4. **Resource Management**: Automatic cleanup
5. **Observability**: Built-in tracing/logging

### Effect.runtime
1. **Execution Boundaries**: Extract for callbacks
2. **Type Safety**: Specify required services
3. **Library Integration**: Bridge to Promise world
4. **Context Preservation**: Services available in callbacks
5. **Testing**: Easier to mock with runtime

### Effect Atom
1. **Reactive State**: Auto-updates downstream
2. **Service Singletons**: Shared memo map
3. **Deep Integration**: Full Effect ecosystem
4. **Type Safety**: Complete inference
5. **Frontend Perfect**: React hooks included

### Memo Map
1. **Singleton Guarantee**: Services built once
2. **Reference Identity**: Same layer = cached
3. **Shared Maps**: Multiple runtimes, one service
4. **Global in Atom**: Automatic sharing
5. **Layer.fresh**: Bypass when needed

### Service Patterns
1. **Always Singletons**: Stateful or not
2. **Managed Runtime**: Backend pattern
3. **Effect Atom**: Frontend pattern
4. **Shared Memo Map**: Custom scenarios
5. **Global with HMR**: Next.js hack

---

## Troubleshooting Guide

### Problem: Services Recreated Multiple Times

**Symptom**: Logs show "Creating X" multiple times

**Causes**:
1. Multiple managed runtimes without shared memo map
2. Function-generated layers
3. Multiple `Effect.provide` calls

**Solutions**:
1. Share memo map across runtimes
2. Extract layers to constants
3. Use managed runtime or single provide

### Problem: Lost Service Context in Callbacks

**Symptom**: "Service X not found in context"

**Cause**: Using `Effect.runPromise` in callback

**Solution**: Use `Effect.runtime` + `Runtime.runPromise`

### Problem: Memory Leaks in Next.js

**Symptom**: Memory grows on HMR

**Cause**: Runtime recreated without disposal

**Solution**: Use global singleton pattern with HMR detection

### Problem: Type Errors with Layer Composition

**Symptom**: "Type X not assignable to Y"

**Cause**: Missing dependencies in layer

**Solution**: Check Requirements channel, provide missing layers

---

## Resources & References

### Official Documentation
- Effect.io: https://effect.website
- Managed Runtime: https://effect.website/docs/guides/runtime
- Effect Atom: https://effect.website/docs/ecosystem/atom

### Community Resources
- Discord: https://discord.gg/effect-ts
- Office Hours: Weekly (Discord announcements)
- GitHub Discussions: https://github.com/Effect-TS/effect/discussions

### Related Talks
- Incremental Adoption: Attila Vecserek (Zendesk) at Effect Days
- Runtime Internals: Tim Smart
- Effect Atom: Tim Smart

### Tools
- Effect Language Service: Auto-layer composition
- Effect DevTools: Runtime inspection
- Effect Schema: Type-safe validation

---

*This reference captures Effect Office Hours #2 covering managed runtimes, layer mechanics, Effect Atom, and production integration patterns. These patterns are essential for real-world Effect applications at scale.*
