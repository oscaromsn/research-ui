---
modified: 2025-11-03T03:39:39-03:00
---
# Effect Workshop 4 - Advanced Patterns
## Effect Days 2024 - Production Patterns & Deep Dive

**Instructors**: Max (primary), with Mike and Tim
**Level**: Advanced
**Duration**: Full day (4 sessions)
**Focus**: Reusable design patterns for production Effect applications

---

## Table of Contents

### Session 1: External API Integration & Resource Management
1. [Integrating with External Libraries](#integrating-with-external-libraries)
2. [Callback-Based APIs](#callback-based-apis)
3. [Runtime & Execution Boundaries](#runtime--execution-boundaries)
4. [Scope Deep Dive](#scope-deep-dive)
5. [Session Project: Express Server](#session-project-express-server)

### Session 2: Fiber Synchronization & Coordination
6. [Deferred: Foundation of Synchronization](#deferred-foundation-of-synchronization)
7. [Queue: Work Distribution](#queue-work-distribution)
8. [Queue + Deferred Pattern](#queue--deferred-pattern)
9. [Session Project: Rate Limiter](#session-project-rate-limiter)

### Session 3: Batching & Caching
10. [Request Data Type](#request-data-type)
11. [Request Resolvers](#request-resolvers)
12. [Batching Requests](#batching-requests)
13. [Caching Requests](#caching-requests)
14. [Cache Module](#cache-module)

### Session 4: Observability & Monitoring
15. [Custom Loggers](#custom-loggers)
16. [Metrics System](#metrics-system)
17. [Tracing & Spans](#tracing--spans)
18. [Production Setup](#production-setup)

---

## Session 1: External API Integration & Resource Management

### Integrating with External Libraries

**Core Problem**: Effect ecosystem doesn't cover everything - need to wrap external libraries

#### Three Integration Approaches

##### 1. One-Off Wrapper (Simple, Limited)

**When to Use**: Single API call, used once in application

```typescript
import OpenAI from "openai";

// ❌ ONE-OFF: Verbose, hard-coded dependencies
const getChatCompletion = (
  client: OpenAI,
  messages: Array<{ role: string; content: string }>
) =>
  Effect.tryPromise({
    try: () => client.chat.completions.create({
      model: "gpt-4",
      messages
    }),
    catch: (error) => new OpenAIError({ cause: error })
  });

// Problems:
// 1. Must pass client every time
// 2. No centralized configuration
// 3. Repetitive error handling
// 4. Hard to test/mock
```

**Use Case**: Quick integration, prototype, one-off script

##### 2. Effect-Based Client Wrapper (Recommended)

**When to Use**: Most production scenarios

```typescript
// ✅ FLEXIBLE: Wrapper provides access to underlying client
class OpenAIClient extends Context.Tag("app/OpenAIClient")<
  OpenAIClient,
  {
    readonly call: <A>(
      f: (client: OpenAI, signal: AbortSignal) => Promise<A>
    ) => Effect.Effect<A, OpenAIError>;
  }
>() {}

// Implementation
const OpenAIClientLive = Layer.scoped(
  OpenAIClient,
  Effect.gen(function* () {
    const config = yield* Config;
    
    // Acquire client
    const client = yield* Effect.acquireRelease(
      Effect.sync(() => new OpenAI({ apiKey: config.openAiKey })),
      (client) => Effect.sync(() => client.close?.())
    );
    
    return OpenAIClient.of({
      call: (f) =>
        Effect.tryPromise({
          try: (signal) => f(client, signal),
          catch: (error) => new OpenAIError({ cause: error })
        })
    });
  })
);

// Usage - clean and flexible
const program = Effect.gen(function* () {
  const openai = yield* OpenAIClient;
  
  return yield* openai.call((client) =>
    client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hello!" }]
    })
  );
});
```

**Benefits**:
- Single client instance (resource efficiency)
- Centralized error handling
- Easy to mock for testing
- Abort signal support
- Resource cleanup automatic

##### 3. All-In Effect (Maximum Control)

**When to Use**: Need custom return types (streams, specialized data structures)

```typescript
class OpenAIClient extends Context.Tag("app/OpenAIClient")<
  OpenAIClient,
  {
    readonly completions: (
      options: CompletionOptions
    ) => Stream.Stream<CompletionChunk, OpenAIError>;
    
    readonly embeddings: (
      input: string
    ) => Effect.Effect<Embedding, OpenAIError>;
  }
>() {}

const OpenAIClientLive = Layer.effect(
  OpenAIClient,
  Effect.gen(function* () {
    const config = yield* Config;
    const client = new OpenAI({ apiKey: config.openAiKey });
    
    return OpenAIClient.of({
      // Stream wrapper for streaming responses
      completions: (options) =>
        Stream.async((emit) => {
          const stream = client.chat.completions.create({
            ...options,
            stream: true
          });
          
          stream.then((asyncIterable) => {
            (async () => {
              for await (const chunk of asyncIterable) {
                emit.single(chunk);
              }
              emit.end();
            })();
          });
        }),
      
      // Direct Effect wrapper
      embeddings: (input) =>
        Effect.tryPromise({
          try: () => client.embeddings.create({
            model: "text-embedding-ada-002",
            input
          }),
          catch: (error) => new OpenAIError({ cause: error })
        }).pipe(
          Effect.map(response => response.data[0])
        )
    });
  })
);
```

**Use Case**: Need streaming, custom data types, complex integrations

### Callback-Based APIs

#### Decision Matrix: Which Constructor to Use?

```typescript
// Is it Promise-based?
// ├─ Yes → Effect.promise / Effect.tryPromise
// └─ No → Is it callback-based?
//     ├─ Yes → Is it single-shot?
//     │   ├─ Yes → Effect.async / Effect.asyncEffect
//     │   └─ No (multi-shot) → Stream.async / Stream.asyncScoped
//     └─ No → At execution boundary?
//         └─ Yes → Access runtime directly
```

#### Single-Shot Callbacks: Effect.async

**Pattern**: Callback fires once, then done

```typescript
// Node.js fs.readFile example
const readFile = (path: string) =>
  Effect.async<string, FileError>((resume) => {
    fs.readFile(path, "utf-8", (error, data) => {
      if (error) {
        resume(Effect.fail(new FileError({ message: error.message })));
      } else {
        resume(Effect.succeed(data));
      }
    });
  });

// Type: Effect<string, FileError, never>
```

**Key Points**:
- `resume` function provided by Effect
- Resume with Effect (not raw value)
- Callback fires exactly once
- Manual type annotation required

#### Cancellation with Effect.async

**Pattern**: Return cleanup function for interruption

```typescript
const sleep = (ms: number) =>
  Effect.async<void>((resume) => {
    console.log(`Setting timeout for ${ms}ms`);
    
    const timeoutId = setTimeout(() => {
      console.log("Timeout fired");
      resume(Effect.unit);
    }, ms);
    
    // Canceler - only runs on interruption
    return Effect.sync(() => {
      console.log("Canceling timeout");
      clearTimeout(timeoutId);
    });
  });

// Demo interruption
const program = sleep(5000).pipe(
  Effect.timeout("1 second")
);

Effect.runPromise(program);
// Output:
// Setting timeout for 5000ms
// Canceling timeout  ← Timeout interrupted!
// TimeoutException thrown
```

**Critical**: Canceler ≠ finalizer
- Canceler: Only runs on interruption
- Finalizer (acquireRelease): Runs on success/failure/interruption

#### Effectful Callbacks: Effect.asyncEffect

**When**: Callback requires Effect operations

```typescript
interface WebSocketMessage {
  type: "data" | "error";
  payload: unknown;
}

const connectWebSocket = (url: string) =>
  Effect.asyncEffect<WebSocketMessage, WSError, Logger>(
    (resume) =>
      Effect.gen(function* () {
        const logger = yield* Logger;
        
        const ws = new WebSocket(url);
        
        ws.onmessage = (event) => {
          // Need logger inside callback
          Effect.runSync(
            logger.info(`Received: ${event.data}`)
          );
          
          resume(Effect.succeed({
            type: "data" as const,
            payload: JSON.parse(event.data)
          }));
        };
        
        ws.onerror = (error) => {
          resume(Effect.fail(new WSError({ cause: error })));
        };
        
        // Canceler
        return Effect.sync(() => ws.close());
      })
  );
```

**Use Case**: Callback setup requires services, logging, or other Effects

#### Multi-Shot Callbacks: Stream.async

**Pattern**: Callback fires multiple times

```typescript
import { EventEmitter } from "events";

const captureEvents = <A>(
  emitter: EventEmitter,
  eventName: string
) =>
  Stream.async<A, Error>((emit) => {
    const onData = (data: A) => {
      emit.single(data);
    };
    
    const onError = (error: Error) => {
      emit.fail(error);
    };
    
    emitter.on(eventName, onData);
    emitter.on("error", onError);
    
    // Cleanup function
    return Effect.sync(() => {
      emitter.off(eventName, onData);
      emitter.off("error", onError);
    });
  });

// Usage
const program = Effect.gen(function* () {
  const emitter = new EventEmitter();
  
  const stream = captureEvents<string>(emitter, "message");
  
  // Process stream
  yield* stream.pipe(
    Stream.take(10),
    Stream.tap((msg) => Console.log(msg)),
    Stream.runDrain
  );
});
```

**Emit Helpers**:

```typescript
emit.single(value)        // Emit one value
emit.chunk(Chunk.of(...)) // Emit multiple values
emit.fail(error)          // Fail the stream
emit.end()                // End the stream
emit.die(defect)          // Unrecoverable error
emit.fromEffect(effect)   // Emit from effect result
```

#### Resourceful Streams: Stream.asyncScoped

**When**: Stream needs resource acquisition/cleanup

```typescript
import * as chokidar from "chokidar";

const watchFiles = (pattern: string) =>
  Stream.asyncScoped<string, Error>((emit) =>
    Effect.gen(function* () {
      // Scoped resource - auto cleanup
      const watcher = yield* Effect.acquireRelease(
        Effect.sync(() => chokidar.watch(pattern)),
        (w) => Effect.promise(() => w.close())
      );
      
      watcher.on("add", (path) => emit.single(path));
      watcher.on("change", (path) => emit.single(path));
      watcher.on("error", (error) => emit.fail(error));
      
      // No explicit cleanup needed - acquireRelease handles it
    })
  );

// Watcher automatically closed when stream ends
const program = watchFiles("**/*.ts").pipe(
  Stream.take(5),
  Stream.runDrain
);
```

### Runtime & Execution Boundaries

#### Understanding Runtime

**What is Runtime?**

```typescript
// Simplified conceptual model
type Runtime<R> = {
  readonly context: Context<R>;      // Services
  readonly fiberRefs: FiberRefs;     // Fiber-local state
  readonly runtimeFlags: RuntimeFlags; // Configuration
};
```

**Runtime is simple**: Just a container for:
1. **Context**: All your provided services
2. **FiberRefs**: Fiber-local variables (like ThreadLocal in Java)
3. **RuntimeFlags**: Feature flags (interruption, logging, etc.)

#### Execution Boundaries

**Problem**: Need to run Effects in non-Effect contexts

```typescript
// Express handler - execution boundary!
app.get("/users/:id", (req, res) => {
  // How do we run Effect here with all our services?
  const program = Effect.gen(function* () {
    const repo = yield* UserRepo;
    return yield* repo.getUser(req.params.id);
  });
  
  // ❌ BAD: Loses context, rebuilds services
  Effect.runPromise(program.pipe(
    Effect.provide(UserRepoLive),
    Effect.provide(DatabaseLive),
    Effect.provide(ConfigLive)
  )).then(user => res.json(user));
});
```

**Solution**: Access runtime, preserve context

```typescript
const ServerLive = Layer.scoped(
  Server,
  Effect.gen(function* () {
    const express = yield* Express;
    const runtime = yield* Effect.runtime<UserRepo>();
    
    // Get runFork bound to current runtime
    const runFork = Runtime.runFork(runtime);
    
    // Server resource
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        const app = express();
        
        // Execution boundary - use runFork
        app.get("/users/:id", (req, res) => {
          const program = Effect.gen(function* () {
            const repo = yield* UserRepo;
            const user = yield* repo.getUser(req.params.id);
            return user;
          });
          
          // ✅ CORRECT: Runtime has all services
          runFork(program.pipe(
            Effect.tap((user) => Effect.sync(() => res.json(user))),
            Effect.catchAll((error) => 
              Effect.sync(() => res.status(500).json({ error }))
            )
          ));
        });
        
        return app.listen(3000);
      }),
      (server) => Effect.promise(() => 
        new Promise((resolve) => server.close(() => resolve()))
      )
    );
  })
);
```

**Pattern**: Get runtime early, use throughout

#### Effect.runtime vs Runtime.runFork

```typescript
// Get runtime
const program = Effect.gen(function* () {
  const runtime = yield* Effect.runtime<Database | Logger>();
  
  // runtime has all services from environment
  // runtime.context contains Database and Logger
  
  // Method 1: Runtime.runFork (most common)
  const runFork = Runtime.runFork(runtime);
  runFork(myEffect); // Returns RuntimeFiber
  
  // Method 2: Runtime.runPromise
  const runPromise = Runtime.runPromise(runtime);
  await runPromise(myEffect); // Returns Promise
  
  // Method 3: Runtime.runSync (dangerous!)
  const runSync = Runtime.runSync(runtime);
  runSync(myEffect); // Returns value or throws
});
```

**Use Cases**:
- **runFork**: Background tasks, fire-and-forget, need fiber handle
- **runPromise**: Await result, integration with Promise-based APIs
- **runSync**: Testing only (throws on async operations)

### Scope Deep Dive

#### What is Scope? (Finally Explained Simply)

> **Scope = Container for cleanup functions (finalizers)**

```typescript
// Conceptual model
type Scope = {
  finalizers: Array<() => Effect.Effect<void>>;
  close: () => Effect.Effect<void>;
};
```

**How it works**:
1. Acquire resource → Register finalizer in scope
2. Use resource → Scope stays open
3. Close scope → Execute finalizers in **REVERSE** order (LIFO)

#### Why Reverse Order?

**Dependencies**: Later resources depend on earlier ones

```typescript
Effect.gen(function* () {
  // 1. Connect to database
  const db = yield* Effect.acquireRelease(
    connectDB(),
    (db) => {
      console.log("1. Disconnecting database");
      return db.disconnect();
    }
  );
  
  // 2. Begin transaction (needs db)
  const tx = yield* Effect.acquireRelease(
    db.beginTransaction(),
    (tx) => {
      console.log("2. Rolling back transaction");
      return tx.rollback();
    }
  );
  
  // 3. Lock table (needs tx)
  yield* Effect.acquireRelease(
    tx.lockTable("users"),
    () => {
      console.log("3. Unlocking table");
      return tx.unlockTable("users");
    }
  );
  
  // Do work...
  
  // On exit (LIFO):
  // 3. Unlocking table      ← Last acquired
  // 2. Rolling back transaction
  // 1. Disconnecting database ← First acquired
});
```

**Rule**: Resources cleaned up in reverse acquisition order

#### Scope Operations

##### Creating Scopes: Effect.scoped

```typescript
// Without Effect.scoped - won't compile
const program = Effect.gen(function* () {
  const file = yield* Effect.acquireRelease(
    openFile("data.txt"),
    (f) => closeFile(f)
  );
  
  return yield* readFile(file);
});
// Type: Effect<string, never, Scope>
//                              ^^^^^
// Needs Scope!

// With Effect.scoped
const runnable = Effect.scoped(program);
// Type: Effect<string, never, never>
//                              ^^^^^
// Scope satisfied
```

**Effect.scoped**:
1. Creates new Scope
2. Provides to program
3. Runs program
4. Closes Scope (executes finalizers)

##### Extending Scopes: Scope.extend

**Use Case**: Attach resource to parent scope instead of child

```typescript
Effect.gen(function* () {
  // Parent scope
  
  yield* Effect.gen(function* () {
    // Child scope
    
    // Normally: resource attached to child scope
    const resource1 = yield* Effect.acquireRelease(
      acquire(),
      release
    );
    
    // Child scope closes → resource1 released
  });
  
  // What if we want resource to outlive child?
  yield* Effect.gen(function* () {
    const parentScope = yield* Scope.Scope;
    
    // Extend parent scope into this effect
    const resource2 = yield* Effect.acquireRelease(
      acquire(),
      release
    ).pipe(
      Scope.extend(parentScope)
    );
    
    // Child scope closes → resource2 NOT released
    // Parent scope closes → resource2 released
  });
  
  // Parent scope closes here
});
```

**Mental Model**: "Attach finalizer to this scope, not current scope"

##### Forking Scopes: Scope.fork

**Use Case**: Manual scope management, closable scopes

```typescript
const program = Effect.gen(function* () {
  const parentScope = yield* Scope.Scope;
  
  // Fork child scope
  const childScope = yield* Scope.fork(parentScope);
  
  // Attach resources to child
  const resource = yield* Effect.acquireRelease(
    acquire(),
    release
  ).pipe(
    Scope.extend(childScope)
  );
  
  // Use resource...
  yield* use(resource);
  
  // Manually close child scope
  yield* Scope.close(childScope);
  // resource released here!
  
  // Parent scope continues...
});
```

**Use Case**: Need to release resources at specific point, not at scope end

#### Scope in Layers: layer.scoped

**Pattern**: Layer needs resources with cleanup

```typescript
const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    // Scope provided automatically by Layer.scoped
    
    const config = yield* Config;
    
    // Acquire connection pool
    const pool = yield* Effect.acquireRelease(
      Effect.promise(() => createPool(config.connectionString)),
      (pool) => Effect.promise(() => pool.end())
    );
    
    return Database.of({
      query: (sql) => Effect.promise(() => pool.query(sql))
    });
  })
);

// When layer provided:
// 1. Pool created
// 2. Database service built
// 3. When Effect.provide scope closes → pool.end() called
```

**Key Point**: Layer.scoped creates scope for entire layer lifecycle

### Session Project: Express Server

**Goal**: Build production-ready Express integration

#### Stage 1: Server Lifecycle

```typescript
class Express extends Context.Tag("app/Express")<
  Express,
  express.Express
>() {}

const ExpressLive = Layer.sync(Express, () =>
  Express.of(express())
);

class Server extends Context.Tag("app/Server")<
  Server,
  http.Server
>() {}

const ServerLive = Layer.scoped(
  Server,
  Effect.gen(function* () {
    const app = yield* Express;
    const runtime = yield* Effect.runtime<never>();
    
    // Middleware
    app.use(express.json());
    
    // Acquire server
    const server = yield* Effect.acquireRelease(
      Effect.async<http.Server>((resume) => {
        const srv = app.listen(3000, () => {
          // Execution boundary - use runtime
          Runtime.runFork(runtime)(
            Effect.logInfo("Server listening on port 3000")
          );
          resume(Effect.succeed(srv));
        });
      }),
      (server) =>
        Effect.promise(() =>
          new Promise<void>((resolve) => {
            server.close(() => resolve());
          })
        )
    );
    
    return Server.of(server);
  })
);
```

#### Stage 2: Route Implementation

```typescript
const GetTodoRouteLive = Layer.effect(
  GetTodoRoute,
  Effect.gen(function* () {
    const app = yield* Express;
    const repo = yield* TodoRepo;
    const fiberSet = yield* FiberSet.make();
    
    app.get("/todos/:id", (req, res) => {
      const program = Effect.gen(function* () {
        const todo = yield* repo.getById(req.params.id);
        
        return yield* Option.match(todo, {
          onNone: () =>
            Effect.sync(() => {
              res.status(404).json({ error: "Todo not found" });
            }),
          onSome: (todo) =>
            Effect.sync(() => {
              res.json(todo);
            })
        });
      });
      
      // Use FiberSet for automatic cleanup
      FiberSet.run(fiberSet)(program);
    });
    
    return GetTodoRoute.of({});
  })
);
```

**FiberSet Benefits**:
- Automatic fiber tracking
- Cleanup on scope close
- Resource safe
- Better than raw Runtime.runFork

#### Complete Setup

```typescript
const AppLive = Layer.mergeAll(
  ExpressLive,
  ServerLive,
  GetTodoRouteLive,
  CreateTodoRouteLive,
  UpdateTodoRouteLive
).pipe(
  Layer.provide(TodoRepoLive),
  Layer.provide(DatabaseLive)
);

const program = Effect.gen(function* () {
  // Server running, never exits
  yield* Effect.never;
});

const main = program.pipe(
  Effect.provide(AppLive),
  Effect.scoped
);

Effect.runPromise(main);
```

---

## Session 2: Fiber Synchronization & Coordination

### Deferred: Foundation of Synchronization

> **Deferred = Single-value promise with Effect semantics**

#### What is Deferred?

**Definition**: Purely functional synchronization primitive representing a single value that may not yet be available

**Properties**:
1. Always starts empty
2. Completed exactly once
3. Immutable after completion
4. Can be awaited by multiple fibers

**Comparison to Promise**:

| Feature | Promise | Deferred |
|---------|---------|----------|
| Creation | `new Promise((resolve) => ...)` | `Deferred.make<A, E>()` |
| Completion | `resolve(value)` | `Deferred.succeed(deferred, value)` |
| Waiting | `await promise` | `yield* Deferred.await(deferred)` |
| Error | `reject(error)` | `Deferred.fail(deferred, error)` |
| Typed Errors | ❌ No | ✅ Yes |
| Interruption | ❌ Complex | ✅ Built-in |

#### Creating Deferred

```typescript
// Make deferred
const deferred = yield* Deferred.make<string, never>();
// Type: Deferred<string, never>
//               ^^^^^^  ^^^^^
//               Value   Error

// With possible errors
const deferred2 = yield* Deferred.make<User, NotFoundError>();
// Type: Deferred<User, NotFoundError>
```

#### Completing Deferred

```typescript
// Success
yield* Deferred.succeed(deferred, "hello");

// Failure
yield* Deferred.fail(deferred, new NotFoundError());

// From Effect
yield* Deferred.complete(deferred, someEffect);
// Completes with success/failure of effect

// From Exit
yield* Deferred.done(deferred, exit);
```

#### Awaiting Deferred

```typescript
const value = yield* Deferred.await(deferred);
// Suspends fiber until deferred completed
// Returns value on success, fails on error

// Never times out - waits forever!
const result = yield* Deferred.await(deferred);
// Will wait indefinitely if never completed
```

**Critical**: `Deferred.await` suspends fiber (cooperative yielding)

#### Basic Example

```typescript
const demo = Effect.gen(function* () {
  // Create deferred
  const deferred = yield* Deferred.make<string, never>();
  
  // Fork fiber 1: Wait for deferred
  const fiber1 = yield* Effect.fork(
    Effect.gen(function* () {
      Console.log("Fiber 1: Waiting...");
      const value = yield* Deferred.await(deferred);
      Console.log(`Fiber 1: Got value: ${value}`);
    })
  );
  
  // Fork fiber 2: Complete deferred after delay
  const fiber2 = yield* Effect.fork(
    Effect.gen(function* () {
      yield* Effect.sleep("1 second");
      Console.log("Fiber 2: Completing deferred");
      yield* Deferred.succeed(deferred, "Hello from fiber 2!");
    })
  );
  
  // Wait for both
  yield* fiber1.join;
  yield* fiber2.join;
});

// Output:
// Fiber 1: Waiting...
// (1 second pause)
// Fiber 2: Completing deferred
// Fiber 1: Got value: Hello from fiber 2!
```

#### Fiber Synchronization Pattern

```typescript
const synchronizedWork = Effect.gen(function* () {
  const deferred = yield* Deferred.make<Result, WorkError>();
  
  // Parent fiber
  console.log("Parent: Starting work...");
  
  // Child fiber: Do work, complete deferred
  const worker = yield* Effect.fork(
    Effect.gen(function* () {
      console.log("Worker: Starting...");
      
      yield* Effect.sleep("2 seconds");
      const result = yield* performWork();
      
      console.log("Worker: Completing deferred");
      yield* Deferred.succeed(deferred, result);
    })
  );
  
  // Parent fiber: Wait for result
  console.log("Parent: Waiting for worker...");
  const result = yield* Deferred.await(deferred);
  console.log("Parent: Got result!");
  
  return result;
});
```

**Use Case**: Fiber 1 waits for fiber 2 to finish work

#### Propagating Full Cause

**Problem**: Need to propagate defects and interruption, not just failures

```typescript
// ❌ INCOMPLETE: Only handles success/failure
Effect.gen(function* () {
  const deferred = yield* Deferred.make<A, E>();
  
  yield* Effect.fork(
    someEffect.pipe(
      Effect.matchEffect({
        onFailure: (error) => Deferred.fail(deferred, error),
        onSuccess: (value) => Deferred.succeed(deferred, value)
      })
    )
  );
  
  return yield* Deferred.await(deferred);
});
// Missing: Defects, Interruption

// ✅ COMPLETE: Full cause propagation
Effect.gen(function* () {
  const deferred = yield* Deferred.make<A, E>();
  
  yield* Effect.fork(
    someEffect.pipe(
      Effect.onExit((exit) => Deferred.done(deferred, exit))
    )
  );
  
  return yield* Deferred.await(deferred);
});
// Handles: Success, Failure, Defects, Interruption
```

**Rule**: Always propagate full Exit, not just success/failure

#### Advanced: Deferred with Interruption

```typescript
const interruptibleWork = Effect.gen(function* () {
  const deferred = yield* Deferred.make<string, never>();
  
  const fiber = yield* Effect.fork(
    Effect.gen(function* () {
      yield* Effect.sleep("5 seconds");
      yield* Deferred.succeed(deferred, "Done!");
    }).pipe(
      Effect.onInterrupt(() => {
        console.log("Worker interrupted!");
        return Deferred.interrupt(deferred);
      })
    )
  );
  
  // Race: Wait vs timeout
  const result = yield* Effect.race(
    Deferred.await(deferred),
    Effect.sleep("1 second").pipe(
      Effect.as("Timed out"),
      Effect.flatMap(() => fiber.interrupt)
    )
  );
  
  return result;
});

// Output:
// Worker interrupted!
// Returns: Timed out
```

#### When to Use Deferred

✅ **Good Use Cases**:
- Synchronize two fibers
- One-time communication between fibers
- Fiber waits for external event
- Coordinate async operations

❌ **Don't Use For**:
- Multiple values (use Queue or Stream)
- Broadcasting to many consumers (use PubSub)
- State management (use Ref)

### Queue: Work Distribution

> **Queue = Thread-safe FIFO data structure for fiber communication**

#### What is Queue?

**Definition**: Asynchronous queue supporting multiple producers and consumers

**Built on Deferred**: Each queue slot uses Deferred internally

**Key Operations**:
- `Queue.offer` - Add to queue (may block if full)
- `Queue.take` - Remove from queue (blocks if empty)

#### Queue Types

##### 1. Unbounded Queue

```typescript
const queue = yield* Queue.unbounded<number>();
// Type: Queue<number>

// Can offer infinitely
yield* queue.offer(1);
yield* queue.offer(2);
// Never blocks on offer
```

**Use Case**: Producer faster than consumer, unlimited buffer

##### 2. Bounded Queue (Back Pressure)

```typescript
const queue = yield* Queue.bounded<number>(4);
// Type: Queue<number>
// Capacity: 4

// Offer 5 items
yield* queue.offer(1); // OK
yield* queue.offer(2); // OK
yield* queue.offer(3); // OK
yield* queue.offer(4); // OK
yield* queue.offer(5); // BLOCKS until space available
```

**Use Case**: Control memory, apply back pressure

##### 3. Sliding Queue

```typescript
const queue = yield* Queue.sliding<number>(4);

// Fill queue
yield* queue.offer(1);
yield* queue.offer(2);
yield* queue.offer(3);
yield* queue.offer(4);

// Overflow - drops from FRONT
yield* queue.offer(5);
// Queue now: [2, 3, 4, 5]
```

**Use Case**: Always keep latest N items, drop oldest

##### 4. Dropping Queue

```typescript
const queue = yield* Queue.dropping<number>(4);

// Fill queue
yield* queue.offer(1);
yield* queue.offer(2);
yield* queue.offer(3);
yield* queue.offer(4);

// Overflow - drops NEW item
yield* queue.offer(5);
// Queue still: [1, 2, 3, 4]
```

**Use Case**: Preserve old data, reject new overflow

#### Queue Operations

```typescript
// Take (blocking)
const item = yield* queue.take;
// Blocks until item available

// Offer (may block)
yield* queue.offer(42);
// Blocks if queue full (bounded only)

// Batch operations
yield* queue.offerAll([1, 2, 3, 4]);
const items = yield* queue.takeAll; // Takes all available

// Size
const size = yield* queue.size;

// Shutdown
yield* queue.shutdown;
// Interrupts all pending offers/takes
```

#### Work Distribution Pattern

```typescript
const workDistribution = Effect.gen(function* () {
  const queue = yield* Queue.unbounded<number>();
  
  // Producer: Add work
  const producer = yield* Effect.fork(
    Effect.gen(function* () {
      for (let i = 0; i < 100; i++) {
        yield* queue.offer(i);
        yield* Effect.sleep("10 millis");
      }
    })
  );
  
  // Consumer: Process work
  const consumer = yield* Effect.fork(
    Effect.forever(
      Effect.gen(function* () {
        const item = yield* queue.take;
        yield* processItem(item);
      })
    )
  );
  
  yield* producer.join;
  yield* queue.shutdown;
  yield* consumer.interrupt;
});
```

**Pattern**: Producer → Queue → Consumer(s)

#### Multiple Workers Pattern

**Exercise**: Implement sequential, unbounded, and bounded concurrency

```typescript
const demo = Effect.gen(function* () {
  const queue = yield* Queue.unbounded<number>();
  
  // Producer
  yield* Effect.fork(
    Effect.forever(
      Effect.gen(function* () {
        yield* queue.offerAll(Chunk.range(0, 100));
        yield* Effect.sleep("1 second");
      })
    )
  );
  
  // Worker 1: Sequential
  yield* Effect.fork(
    Effect.forever(
      Effect.gen(function* () {
        const item = yield* queue.take;
        yield* doWork(item); // 20ms delay
      })
    )
  );
  
  // Worker 2: Unbounded concurrency
  yield* Effect.fork(
    Effect.forever(
      Effect.gen(function* () {
        const item = yield* queue.take;
        yield* Effect.fork(doWork(item));
      })
    )
  );
  
  // Worker 3: Bounded concurrency (4 at a time)
  yield* Effect.fork(
    Effect.gen(function* () {
      const items = yield* queue.takeAll;
      yield* Effect.forEach(
        items,
        (item) => doWork(item),
        { concurrency: 4, discard: true }
      );
    }).pipe(Effect.forever)
  );
});
```

**Key Points**:
- `Effect.forever` - Cooperatively yields between iterations
- `Effect.fork` - Spawn fiber per item (unbounded)
- `Effect.forEach` with concurrency - Worker pool pattern

### Queue + Deferred Pattern

> **The Power Pattern**: Queue<{ work: A, deferred: Deferred<B, E> }>

#### The Problem

**Scenario**: Distribute work across fibers, need results back

```typescript
// ❌ PROBLEM: How to get results?
const worker = Effect.forever(
  Effect.gen(function* () {
    const work = yield* queue.take;
    const result = yield* processWork(work);
    
    // How do we send result back to caller?
    // We're in different fiber!
  })
);
```

**Challenge**: Work done in fiber A, result needed in fiber B

#### The Solution: Queue + Deferred

**Pattern**: Include Deferred in work item, complete it in worker

```typescript
type WorkItem<A, B, E> = {
  readonly work: A;
  readonly deferred: Deferred<B, E>;
};

// Create queue of work items
const queue = yield* Queue.unbounded<WorkItem<Input, Output, WorkError>>();

// Worker: Take work, complete deferred
const worker = Effect.forever(
  Effect.gen(function* () {
    const { work, deferred } = yield* queue.take;
    
    // Process work
    const result = yield* processWork(work).pipe(
      Effect.matchCauseEffect({
        onFailure: (cause) => Deferred.failCause(deferred, cause),
        onSuccess: (value) => Deferred.succeed(deferred, value)
      })
    );
  })
);

// Submit work, await result
const submitWork = (work: Input) =>
  Effect.gen(function* () {
    const deferred = yield* Deferred.make<Output, WorkError>();
    
    yield* queue.offer({ work, deferred });
    
    return yield* Deferred.await(deferred);
  });
```

**Flow**:
1. Create Deferred
2. Offer { work, deferred } to queue
3. Worker takes from queue
4. Worker processes work
5. Worker completes Deferred with result
6. Caller gets result from Deferred.await

#### Complete Example: Rate Limiter

```typescript
interface RateLimiterRequest {
  readonly effect: Effect.Effect<unknown, unknown, unknown>;
  readonly deferred: Deferred<unknown, unknown>;
}

const makeRateLimiter = (requestsPerSecond: number) =>
  Effect.gen(function* () {
    const queue = yield* Queue.unbounded<RateLimiterRequest>();
    const semaphore = yield* Semaphore.make(requestsPerSecond);
    
    // Worker: Process requests with rate limiting
    const worker = yield* Effect.fork(
      Effect.forever(
        Effect.gen(function* () {
          const { effect, deferred } = yield* queue.take;
          
          // Acquire permit (rate limit)
          yield* semaphore.withPermits(1)(
            effect.pipe(
              Effect.onExit((exit) => Deferred.done(deferred, exit))
            )
          );
          
          // Release permit after 1 second
          yield* Effect.fork(
            Effect.sleep("1 second").pipe(
              Effect.flatMap(() => semaphore.release(1))
            )
          );
        })
      )
    );
    
    // Public API
    return {
      submit: <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        Effect.gen(function* () {
          const deferred = yield* Deferred.make<A, E>();
          
          yield* queue.offer({
            effect: effect as Effect.Effect<unknown>,
            deferred: deferred as Deferred<unknown, unknown>
          });
          
          return yield* Deferred.await(deferred);
        })
    };
  });

// Usage
const limiter = yield* makeRateLimiter(10); // 10 req/sec

yield* limiter.submit(fetchData()); // Rate limited
yield* limiter.submit(fetchData()); // Rate limited
```

**Why This Works**:
- Queue distributes work to worker fiber
- Deferred returns result to caller fiber
- Caller fiber blocked until work completes
- Worker fiber controls execution (rate limiting, batching, etc.)

#### Real-World Use Cases

1. **Data Loader (N+1 Problem)**

```typescript
type Request = { id: string; deferred: Deferred<User, NotFoundError> };

const loader = makeDataLoader((requests: Request[]) =>
  Effect.gen(function* () {
    const ids = requests.map(r => r.id);
    const users = yield* db.findMany(ids); // Single query!
    
    // Complete all deferreds
    yield* Effect.forEach(requests, (req) => {
      const user = users.find(u => u.id === req.id);
      return user
        ? Deferred.succeed(req.deferred, user)
        : Deferred.fail(req.deferred, new NotFoundError());
    });
  })
);
```

2. **Request Batching**

```typescript
// Batch requests over time window
const batcher = makeBatcher((batch: Array<Item & { deferred }>) => {
  // Process entire batch at once
  // Complete each deferred with result
});
```

3. **Worker Pool**

```typescript
// Distribute work across N workers
const pool = makeWorkerPool(4, (item & { deferred }) => {
  // Process item
  // Complete deferred
});
```

**This pattern used extensively in Effect internals!**

---

## Session 3: Batching & Caching

### Request Data Type

#### What is Request?

> **Request = Data type representing a request for data, enabling automatic batching and caching**

**Key Insight**: Requests implement `Equal` trait automatically
- Requests with same parameters considered equal
- Enables deduplication
- Enables caching

#### Creating Requests

##### Method 1: Tagged Class (Recommended)

```typescript
class GetUserById extends Request.TaggedClass("GetUserById")<{
  readonly id: string;
}> {
  // Success type
  [Request.SuccessTypeId]: User;
  // Error type
  [Request.ErrorTypeId]: NotFoundError;
}

// Usage
const request = new GetUserById({ id: "123" });
// Type: Request<User, NotFoundError>
```

##### Method 2: Interface + Tagged Constructor

```typescript
interface GetUserById extends Request.Request<User, NotFoundError> {
  readonly _tag: "GetUserById";
  readonly id: string;
}

const GetUserById = Request.tagged<GetUserById>("GetUserById");

// Usage
const request = GetUserById({ id: "123" });
```

**Prefer Method 1**: More concise, less boilerplate

#### Request Equality

```typescript
const req1 = new GetUserById({ id: "123" });
const req2 = new GetUserById({ id: "123" });
const req3 = new GetUserById({ id: "456" });

Equal.equals(req1, req2); // true - same parameters
Equal.equals(req1, req3); // false - different parameters

// Powers deduplication!
Effect.all([
  Effect.request(req1, resolver),
  Effect.request(req2, resolver), // Deduplicated!
  Effect.request(req3, resolver)
], { batching: true });
```

### Request Resolvers

> **RequestResolver = Logic to resolve requests**

#### Creating Resolvers

##### Simple: fromEffect

```typescript
const GetUserByIdResolver = RequestResolver.fromEffect(
  (request: GetUserById) =>
    Effect.gen(function* () {
      const db = yield* Database;
      const user = yield* db.query(
        `SELECT * FROM users WHERE id = $1`,
        [request.id]
      );
      
      return Option.match(user, {
        onNone: () => Effect.fail(new NotFoundError({ id: request.id })),
        onSome: (user) => Effect.succeed(user)
      });
    })
);
```

**Characteristics**:
- ✅ Simple to write
- ✅ Automatic request completion
- ❌ No batching support
- ❌ One request at a time

**When to Use**: API doesn't support batching

##### Advanced: makeBatched

```typescript
const GetUserByIdResolver = RequestResolver.makeBatched(
  (requests: ReadonlyArray<GetUserById>) =>
    Effect.gen(function* () {
      const db = yield* Database;
      
      // Extract all IDs
      const ids = requests.map(req => req.id);
      
      // Single batch query
      const users = yield* db.query(
        `SELECT * FROM users WHERE id = ANY($1)`,
        [ids]
      );
      
      // Create lookup map
      const userMap = new Map(users.map(u => [u.id, u]));
      
      // Complete each request
      yield* Effect.forEach(requests, (request) => {
        const user = userMap.get(request.id);
        
        return user
          ? Request.succeed(request, user)
          : Request.fail(request, new NotFoundError({ id: request.id }));
      });
    })
);
```

**Characteristics**:
- ✅ Batches multiple requests
- ✅ Single database query
- ✅ Significant performance improvement
- ⚠️ Manual request accounting required

**Request Accounting**: Must manually succeed/fail each request

#### Request Completion API

```typescript
// Success
Request.succeed(request, value);

// Failure
Request.fail(request, error);

// From Effect
Request.complete(request, effect);

// From Exit
Request.completeWith(request, exit);

// Failure with Cause
Request.failCause(request, cause);
```

### Batching Requests

#### Enabling Batching

**Method 1**: Per-effect

```typescript
const program = Effect.all([
  Effect.request(GetUserById({ id: "1" }), resolver),
  Effect.request(GetUserById({ id: "2" }), resolver),
  Effect.request(GetUserById({ id: "3" }), resolver)
], { batching: true });

// Batched into single resolver call!
```

**Method 2**: Regional

```typescript
const program = Effect.all([
  Effect.request(GetUserById({ id: "1" }), resolver),
  Effect.request(GetUserById({ id: "2" }), resolver),
  Effect.request(GetUserById({ id: "3" }), resolver)
]).pipe(
  Effect.withRequestBatching(true)
);

// Batching enabled for this region
```

**Method 3**: Global

```typescript
const program = myApp.pipe(
  Effect.withRequestBatching(true)
);

// All requests in app batched (unless disabled locally)
```

#### Batching Performance

**Without Batching** (N queries):

```typescript
// 100 requests = 100 database queries
const users = yield* Effect.forEach(
  userIds,
  (id) => Effect.request(GetUserById({ id }), resolver),
  { batching: false } // Default in forEach
);

// Took: 10+ seconds
```

**With Batching** (1 query):

```typescript
// 100 requests = 1 database query!
const users = yield* Effect.forEach(
  userIds,
  (id) => Effect.request(GetUserById({ id }), resolver),
  { batching: true }
);

// Took: <1 second
```

**10-100x speedup** depending on latency!

#### Partial Failure Handling

**Problem**: Batch succeeds, but some items missing

```typescript
// ❌ NAIVE: Assumes all items returned
RequestResolver.makeBatched((requests) =>
  Effect.gen(function* () {
    const ids = requests.map(r => r.id);
    const items = yield* api.getMany(ids);
    
    // What if items.length < ids.length?
    const itemMap = new Map(items.map(i => [i.id, i]));
    
    yield* Effect.forEach(requests, (req) => {
      const item = itemMap.get(req.id);
      // If undefined, this fails!
      return Request.succeed(req, item);
    });
  })
);

// ✅ CORRECT: Handle missing items
RequestResolver.makeBatched((requests) =>
  Effect.gen(function* () {
    const ids = requests.map(r => r.id);
    const items = yield* api.getMany(ids);
    
    const itemMap = new Map(items.map(i => [i.id, i]));
    
    yield* Effect.forEach(requests, (req) => {
      const item = itemMap.get(req.id);
      
      return item
        ? Request.succeed(req, item)
        : Request.fail(req, new NotFoundError({ id: req.id }));
    });
  })
);
```

#### Batch Error Handling

**Pattern**: If entire batch fails, all requests fail

```typescript
RequestResolver.makeBatched((requests) =>
  Effect.gen(function* () {
    const ids = requests.map(r => r.id);
    
    // Entire batch may fail
    const items = yield* api.getMany(ids).pipe(
      Effect.catchAll((error) =>
        // Fail ALL requests with same error
        Effect.forEach(requests, (req) =>
          Request.fail(req, error)
        ).pipe(Effect.as([]))
      )
    );
    
    // Complete successful requests...
  })
);
```

### Caching Requests

#### Request Caching vs Cache Module

**Request Caching**: Automatic, tied to Request lifecycle
**Cache Module**: Manual, general purpose

Use **Request Caching** when:
- Working with Request/RequestResolver
- Want automatic deduplication
- Need time-based expiration

Use **Cache Module** when:
- Caching arbitrary computations
- Need custom key logic
- More control over eviction

#### Enabling Request Caching

**Default Cache**:

```typescript
const program = Effect.request(
  GetUserById({ id: "123" }),
  resolver
).pipe(
  Effect.withRequestCaching(true)
);

// Uses default cache (capacity: 100?, TTL: forever?)
```

**Custom Cache**:

```typescript
const cache = yield* Request.makeCache({
  capacity: 1000,
  timeToLive: "5 minutes"
});

const program = Effect.request(
  GetUserById({ id: "123" }),
  resolver
).pipe(
  Effect.withRequestCache(cache)
);
```

#### Caching Behavior

```typescript
const program = Effect.gen(function* () {
  // First request: Executes resolver
  const user1 = yield* Effect.request(
    GetUserById({ id: "123" }),
    resolver
  );
  console.log("First request completed");
  
  // Second request: Cache hit!
  const user2 = yield* Effect.request(
    GetUserById({ id: "123" }),
    resolver
  );
  console.log("Second request completed");
  
  // Identical request, resolver never called
}).pipe(
  Effect.withRequestCaching(true)
);

// Output:
// Resolver called for ID 123
// First request completed
// Second request completed (instant - cached!)
```

#### Regional Caching

**Pattern**: Different caches for different regions

```typescript
const program = Effect.gen(function* () {
  const hotCache = yield* Request.makeCache({
    capacity: 10000,
    timeToLive: "1 minute"
  });
  
  const coldCache = yield* Request.makeCache({
    capacity: 1000,
    timeToLive: "1 hour"
  });
  
  // Hot path - aggressive caching
  const hotData = yield* fetchHotData().pipe(
    Effect.withRequestCache(hotCache)
  );
  
  // Cold path - longer TTL
  const coldData = yield* fetchColdData().pipe(
    Effect.withRequestCache(coldCache)
  );
});
```

#### Complex Objects in Requests

**Problem**: Caching with complex keys

```typescript
// ❌ BAD: Plain object won't cache correctly
class GetUsersByFilters extends Request.TaggedClass("GetUsersByFilters")<{
  readonly filters: {
    readonly age?: number;
    readonly country?: string;
    readonly premium?: boolean;
  };
}> {
  [Request.SuccessTypeId]: User[];
  [Request.ErrorTypeId]: DatabaseError;
}

// Two requests with same filters won't be cached together!
// Objects compared by reference, not value

// ✅ GOOD: Use Data module for structural equality
import { Data } from "effect";

interface UserFilters extends Data.Case {
  readonly age?: number;
  readonly country?: string;
  readonly premium?: boolean;
}

const UserFilters = Data.case<UserFilters>();

class GetUsersByFilters extends Request.TaggedClass("GetUsersByFilters")<{
  readonly filters: UserFilters;
}> {
  [Request.SuccessTypeId]: User[];
  [Request.ErrorTypeId]: DatabaseError;
}

// Now caching works by value!
const req1 = new GetUsersByFilters({
  filters: UserFilters({ age: 25, country: "US" })
});
const req2 = new GetUsersByFilters({
  filters: UserFilters({ age: 25, country: "US" })
});

// req1 and req2 considered equal → cache hit!
```

### Cache Module

> **Cache = General-purpose computation caching with custom keys**

#### Creating Cache

```typescript
const cache = yield* Cache.make({
  capacity: 1000,
  timeToLive: "1 hour",
  lookup: (key: string) =>
    Effect.gen(function* () {
      console.log(`Computing value for ${key}`);
      const result = yield* expensiveComputation(key);
      return result;
    })
});

// Type: Cache<string, Result, never, ComputationError>
//            ^^^^^^  ^^^^^^       ^^^^^^^^^^^^^^^^^^
//            Key     Value        Error
```

#### Using Cache

```typescript
// First call: Computes and caches
const value1 = yield* cache.get("user-123");
// Output: Computing value for user-123

// Second call: Returns cached value
const value2 = yield* cache.get("user-123");
// No output - cache hit!

// Different key: Computes new value
const value3 = yield* cache.get("user-456");
// Output: Computing value for user-456
```

#### Advanced: Dependent Caching

```typescript
const cache = yield* Cache.make({
  capacity: 100,
  timeToLive: "10 minutes",
  lookup: (userId: string) =>
    Effect.gen(function* () {
      const db = yield* Database;
      const logger = yield* Logger;
      
      yield* logger.info(`Fetching user ${userId}`);
      
      const user = yield* db.query(
        "SELECT * FROM users WHERE id = $1",
        [userId]
      );
      
      return Option.getOrThrow(user);
    })
});

// Can access services in lookup!
const user = yield* cache.get("123");
```

#### Invalidation

```typescript
// Invalidate single key
yield* cache.invalidate("user-123");

// Refresh (recompute)
yield* cache.refresh("user-123");

// Clear all
yield* cache.clear();

// Manual entry
yield* cache.set("user-123", newValue);
```

#### Batch Caching

```typescript
// Problem: N+1 with cache
const users = yield* Effect.forEach(
  userIds,
  (id) => cache.get(id) // Each cache.get separate
);

// Solution: Batch load
const cache = yield* Cache.make({
  capacity: 1000,
  timeToLive: "5 minutes",
  lookup: (key: string) =>
    // Lookup still per-key
    fetchUser(key)
});

// Use with Request batching!
const UserCache = Request.tagged<GetUserById>("GetUserById");

const resolver = RequestResolver.makeBatched((requests) =>
  Effect.gen(function* () {
    // Check cache first
    const results = yield* Effect.forEach(requests, (req) =>
      cache.getOption(req.id).pipe(
        Effect.map(opt => ({ req, opt }))
      )
    );
    
    const uncached = results.filter(r => Option.isNone(r.opt));
    
    if (uncached.length > 0) {
      // Batch fetch uncached
      const ids = uncached.map(r => r.req.id);
      const users = yield* db.findMany(ids);
      
      // Update cache
      yield* Effect.forEach(users, (user) =>
        cache.set(user.id, user)
      );
    }
    
    // Complete all requests from cache
    yield* Effect.forEach(results, ({ req, opt }) =>
      Request.succeed(req, Option.getOrThrow(opt))
    );
  })
);
```

---

## Session 4: Observability & Monitoring

### Custom Loggers

#### Logger Interface

```typescript
interface Logger<Message, Output> {
  (options: {
    readonly fiberId: FiberId;
    readonly logLevel: LogLevel;
    readonly message: Message;
    readonly cause: Cause<unknown>;
    readonly context: FiberRefs; // Actually FiberRefs, not Context
    readonly spans: List<LogSpan>;
    readonly annotations: HashMap<string, unknown>;
    readonly date: Date;
  }): Output;
}
```

**Available Information**:
- **fiberId**: Which fiber logged
- **logLevel**: Info, Debug, Warning, Error, etc.
- **message**: Log message
- **cause**: If logging error, full cause chain
- **context** (FiberRefs): Access fiber-local values
- **spans**: Current span hierarchy
- **annotations**: Custom key-value metadata
- **date**: Timestamp

#### Default Logger

```typescript
// Effect uses this by default
const defaultLogger = Logger.pretty;

// Format: [timestamp] [level] [fiber] message
// [2024-03-15T10:30:45.123Z] INFO  #1: Server started on port 3000
```

#### Creating Custom Logger

**Example**: Batched Logger

```typescript
const makeBatchedLogger = (window: Duration) =>
  Effect.gen(function* () {
    // Buffer for logs
    let buffer: string[] = [];
    
    // Get default string formatter
    const stringLogger = yield* Logger.stringLogger;
    
    // Output buffer effect
    const outputBuffer = Effect.sync(() => {
      if (buffer.length > 0) {
        console.log("\n=== Batched Logs ===");
        console.log(buffer.join("\n"));
        console.log("===================\n");
        buffer = [];
      }
    });
    
    // Schedule: Output every window
    const schedule = Schedule.fixed(window).pipe(
      Schedule.compose(Schedule.forever)
    );
    
    // Background fiber: Flush periodically
    yield* Effect.fork(
      outputBuffer.pipe(
        Effect.schedule(schedule),
        Effect.ensuring(outputBuffer) // Final flush
      )
    ).pipe(
      Effect.forkScoped // Tied to scope
    );
    
    // Custom logger: Add to buffer
    return Logger.make<string, void>(({ message, ...rest }) => {
      const formatted = stringLogger({ message, ...rest });
      buffer.push(formatted);
    });
  });

// Usage
const program = Effect.gen(function* () {
  const logger = yield* makeBatchedLogger("2 seconds");
  
  yield* Effect.locally(
    Logger.add(logger)
  )(
    Effect.gen(function* () {
      yield* Effect.logInfo("Log 1");
      yield* Effect.sleep("500 millis");
      yield* Effect.logInfo("Log 2");
      yield* Effect.sleep("500 millis");
      yield* Effect.logInfo("Log 3");
      yield* Effect.sleep("2 seconds");
      // Batch flushed here
    })
  );
});
```

**Key Patterns**:
- Use `Effect.locally` to scope logger changes
- Use `Effect.forkScoped` for background fiber cleanup
- Use `Effect.ensuring` for final cleanup

#### Multiple Loggers

```typescript
// Default logger + custom logger
const program = Effect.gen(function* () {
  const customLogger = Logger.make(/* ... */);
  
  yield* Effect.locally(
    FiberRef.currentLoggers,
    HashSet.add(FiberRef.currentLoggers.get, customLogger)
  )(
    Effect.gen(function* () {
      // Both loggers active here
      yield* Effect.logInfo("This goes to both loggers");
    })
  );
});
```

#### Replacing Default Logger

```typescript
const program = Effect.gen(function* () {
  const customLogger = Logger.make(/* ... */);
  
  yield* Effect.locally(
    FiberRef.currentLoggers,
    HashSet.fromIterable([customLogger]) // Only custom logger
  )(
    Effect.gen(function* () {
      yield* Effect.logInfo("Only custom logger sees this");
    })
  );
});
```

### Metrics System

#### Metric Types

##### 1. Counter (Incrementing)

```typescript
const requestCounter = Metric.counter("http_requests_total", {
  description: "Total HTTP requests",
  incremental: true
});

// Increment
yield* requestCounter.increment();
yield* requestCounter.increment(5);

// Get value
const total = yield* requestCounter.value;
```

**Use Case**: Totals that only go up (requests, errors, bytes sent)

##### 2. Gauge (Current Value)

```typescript
const activeConnections = Metric.gauge("active_connections", {
  description: "Current active connections"
});

// Set value
yield* activeConnections.set(42);

// Modify
yield* activeConnections.update((n) => n + 1);
yield* activeConnections.update((n) => n - 1);

// Get value
const current = yield* activeConnections.value;
```

**Use Case**: Current state (connections, queue size, temperature)

##### 3. Histogram (Distribution)

```typescript
const requestDuration = Metric.histogram("http_request_duration", {
  description: "HTTP request duration distribution",
  boundaries: Chunk.of(0.01, 0.05, 0.1, 0.5, 1, 5)
});

// Record value
yield* requestDuration.record(0.123);
yield* requestDuration.record(0.456);

// Get buckets
const histogram = yield* requestDuration.value;
// { buckets: Map, count: 2, sum: 0.579 }
```

**Use Case**: Distributions (latency, response size, queue wait time)

##### 4. Summary (Percentiles)

```typescript
const requestLatency = Metric.summary("request_latency", {
  description: "Request latency summary",
  maxAge: "1 minute",
  maxSize: 1000,
  quantiles: Chunk.of(0.5, 0.9, 0.95, 0.99)
});

// Record values
yield* requestLatency.record(100);
yield* requestLatency.record(150);
yield* requestLatency.record(200);

// Get quantiles
const summary = yield* requestLatency.value;
// { count: 3, sum: 450, quantiles: Map(0.5 → 150, 0.99 → 200) }
```

**Use Case**: Percentiles over time window (p50, p95, p99)

##### 5. Frequency (Occurrences)

```typescript
const errorTypes = Metric.frequency("error_types", {
  description: "Error type frequency"
});

// Record occurrences
yield* errorTypes.record("NetworkError");
yield* errorTypes.record("ValidationError");
yield* errorTypes.record("NetworkError");

// Get frequencies
const freq = yield* errorTypes.value;
// Map { "NetworkError" → 2, "ValidationError" → 1 }
```

**Use Case**: Count distinct values (error types, status codes, endpoints)

#### Using Metrics

**Pattern**: Track Effect execution

```typescript
const trackedEffect = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  name: string
) => {
  const duration = Metric.histogram(`${name}_duration`);
  const errors = Metric.counter(`${name}_errors`);
  const successes = Metric.counter(`${name}_successes`);
  
  return effect.pipe(
    Effect.timed,
    Effect.tap(([elapsed]) => duration.record(Duration.toMillis(elapsed))),
    Effect.matchCauseEffect({
      onFailure: (cause) =>
        errors.increment().pipe(
          Effect.flatMap(() => Effect.failCause(cause))
        ),
      onSuccess: ([, value]) =>
        successes.increment().pipe(
          Effect.as(value)
        )
    })
  );
};

// Usage
const fetchUser = trackedEffect(
  fetchUserImpl(userId),
  "fetch_user"
);
```

#### Metric Labels

**Problem**: Need to track metrics per endpoint, status code, etc.

```typescript
// ❌ BAD: Create separate metrics for each label
const endpoint1Requests = Metric.counter("requests_endpoint1");
const endpoint2Requests = Metric.counter("requests_endpoint2");
// Doesn't scale!

// ✅ GOOD: Use labels
const httpRequests = Metric.counter("http_requests_total").pipe(
  Metric.withLabels(["method", "endpoint", "status"])
);

// Record with labels
yield* httpRequests.increment({
  method: "GET",
  endpoint: "/users",
  status: "200"
});

yield* httpRequests.increment({
  method: "POST",
  endpoint: "/users",
  status: "201"
});
```

**Labels create separate metric instances per unique label combination**

### Tracing & Spans

#### What is Tracing?

**Tracing**: Track execution flow across services and time

**Span**: Timed section of code with metadata

**Benefits**:
- Visualize waterfall of execution
- Find bottlenecks
- Debug distributed systems
- Track requests across services

#### Creating Spans

```typescript
const fetchUser = (userId: string) =>
  Effect.gen(function* () {
    const db = yield* Database;
    
    const user = yield* db.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );
    
    return user;
  }).pipe(
    Effect.withSpan("fetchUser", {
      attributes: { userId }
    })
  );
```

**Span Attributes**: Metadata attached to span

#### Nested Spans

```typescript
const getUserWithOrders = (userId: string) =>
  Effect.gen(function* () {
    // Child span 1
    const user = yield* fetchUser(userId).pipe(
      Effect.withSpan("fetchUser", { attributes: { userId } })
    );
    
    // Child span 2
    const orders = yield* fetchOrders(userId).pipe(
      Effect.withSpan("fetchOrders", { attributes: { userId } })
    );
    
    return { user, orders };
  }).pipe(
    Effect.withSpan("getUserWithOrders", {
      attributes: { userId }
    })
  );

// Span hierarchy:
// getUserWithOrders
//   ├─ fetchUser
//   └─ fetchOrders
```

#### Annotating Spans

```typescript
const processData = (data: Data) =>
  Effect.gen(function* () {
    yield* Effect.annotateCurrentSpan({
      dataSize: data.length,
      dataType: data.type
    });
    
    const result = yield* process(data);
    
    yield* Effect.annotateCurrentSpan({
      resultSize: result.length
    });
    
    return result;
  }).pipe(
    Effect.withSpan("processData")
  );
```

#### Logs as Span Events

```typescript
const operation = Effect.gen(function* () {
  yield* Effect.logInfo("Starting operation");
  
  const result = yield* doWork();
  
  yield* Effect.logInfo("Operation completed", {
    result: result.id
  });
  
  return result;
}).pipe(
  Effect.withSpan("operation")
);

// In trace viewer:
// Span: operation
//   Event: "Starting operation"
//   Event: "Operation completed" { result: "123" }
```

**Logs inside spans exported as span events**

### Production Setup

#### OpenTelemetry Integration

```typescript
import { NodeSdk } from "@effect/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";

const program = myApp.pipe(
  Effect.provide(
    NodeSdk.layer(() => ({
      resource: {
        serviceName: "my-service",
        serviceVersion: "1.0.0"
      },
      
      // Tracing
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: "http://tempo:4318/v1/traces"
        })
      ),
      
      // Metrics
      metricReader: new PrometheusExporter({
        port: 9464
      })
    }))
  )
);
```

#### Local Observability Stack

**docker-compose.yml**:

```yaml
services:
  # Tracing: Tempo
  tempo:
    image: grafana/tempo:latest
    ports:
      - "4318:4318" # OTLP HTTP
      - "3200:3200" # Tempo API
  
  # Metrics: Prometheus
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  # Visualization: Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
```

**prometheus.yml**:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'app'
    static_configs:
      - targets: ['host.docker.internal:9464']
```

#### Complete Example

```typescript
// app.ts
const app = Effect.gen(function* () {
  const server = yield* Server;
  
  // Server running, instrumented
  yield* Effect.logInfo("Application started");
  
  yield* Effect.never;
});

const main = app.pipe(
  Effect.provide(ServerLive),
  Effect.provide(
    NodeSdk.layer(() => ({
      resource: { serviceName: "my-app" },
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: "http://localhost:4318/v1/traces"
        })
      ),
      metricReader: new PrometheusExporter({ port: 9464 })
    }))
  )
);

Effect.runPromise(main);
```

**Then**:
1. Start services: `docker-compose up`
2. Run app: `tsx app.ts`
3. View traces: http://localhost:3000 (Grafana)
4. View metrics: http://localhost:9090 (Prometheus)

#### Grafana Dashboards

**Trace Visualization**:
- Waterfall diagram of spans
- Parent-child relationships
- Span duration
- Span attributes
- Span events (logs)

**Metrics Dashboard**:
- Request rate
- Error rate
- Latency percentiles (p50, p95, p99)
- Active connections
- Custom business metrics

#### Workshop CLI Example

**Training Model**:

```bash
pnpm tsx bin train --file docs/effect.md --db embeddings.db
```

**Trace Output**:

```
train
├─ chunking (50ms)
│  ├─ splitDocument (10ms)
│  └─ processChunks (40ms)
├─ generateEmbeddings (2000ms)
│  ├─ batchRequest (1500ms)
│  └─ saveEmbeddings (500ms)
└─ complete (10ms)
```

**Grafana**:
- See exact timing of each operation
- Identify bottlenecks (generateEmbeddings)
- View span attributes (documentSize, chunkCount)
- See logs as events in trace

---

## Appendix: Advanced Patterns

### Custom Runtimes

**Use Case**: Disable specific runtime flags

```typescript
const runtime = yield* Effect.runtime();

// Disable fiber logging
const customRuntime = {
  ...runtime,
  runtimeFlags: RuntimeFlags.disable(
    runtime.runtimeFlags,
    RuntimeFlags.OpSupervision
  )
};

const runFork = Runtime.runFork(customRuntime);
```

### FiberSet for Resource Safety

**Pattern**: Manage multiple fibers with automatic cleanup

```typescript
const server = Effect.gen(function* () {
  const fiberSet = yield* FiberSet.make();
  
  // Fork fibers into set
  yield* Effect.forEach(
    requests,
    (req) => FiberSet.run(fiberSet)(handleRequest(req)),
    { concurrency: "unbounded" }
  );
  
  // When scope closes, all fibers interrupted
});
```

**Benefits**:
- Automatic fiber tracking
- Cleanup on scope close
- No manual interruption needed

### Effect.locallyScoped

**Pattern**: Temporary FiberRef changes scoped

```typescript
const program = Effect.gen(function* () {
  // Logger active only in this scope
  yield* Effect.locallyScoped(
    FiberRef.currentLoggers,
    HashSet.add(FiberRef.currentLoggers.get, customLogger)
  );
  
  yield* Effect.logInfo("Custom logger sees this");
  
  // Custom logger removed when scope closes
});
```

### High-Order Resolvers

**Pattern**: Wrap existing resolvers

```typescript
// Batch size control
const bounded = RequestResolver.batch(resolver, 100);

// Rate limiting
const limited = RequestResolver.rateLimit(resolver, "10/second");

// Composable!
const optimized = resolver.pipe(
  RequestResolver.batch(100),
  RequestResolver.rateLimit("10/second")
);
```

### Data Loader Pattern

**Implementation** (from @effect/experimental):

```typescript
const makeDataLoader = <A, B, E>(
  f: (as: Array<A>) => Effect.Effect<Array<B>, E>
) =>
  RequestResolver.fromFunction((requests: Array<{ a: A; deferred: Deferred<B, E> }>) =>
    Effect.gen(function* () {
      const as = requests.map(r => r.a);
      const bs = yield* f(as);
      
      yield* Effect.forEach(
        Chunk.zip(requests, bs),
        ([req, b]) => Deferred.succeed(req.deferred, b)
      );
    })
  ).pipe(
    RequestResolver.dataLoader({
      window: "10 millis",
      maxBatchSize: 100
    })
  );
```

---

## Summary: Advanced Patterns

### Key Takeaways

#### Session 1: Integration
- **Three approaches**: One-off, wrapper, all-in
- **Callback APIs**: async, asyncEffect, Stream.async, Stream.asyncScoped
- **Runtime**: Access for execution boundaries
- **Scope**: Container for finalizers (LIFO cleanup)

#### Session 2: Synchronization
- **Deferred**: Single-value fiber synchronization
- **Queue**: Work distribution across fibers
- **Queue + Deferred**: Return results from distributed work
- **Pattern used everywhere in Effect internals**

#### Session 3: Batching & Caching
- **Request**: Data type enabling batching/caching
- **RequestResolver**: Resolve single or batched requests
- **Batching**: 10-100x performance improvement
- **Caching**: Automatic deduplication and memoization
- **Cache Module**: General-purpose computation caching

#### Session 4: Observability
- **Custom Loggers**: Full control over log output
- **Metrics**: Counter, Gauge, Histogram, Summary, Frequency
- **Tracing**: Waterfall visualization with spans
- **Production**: OpenTelemetry + Grafana + Prometheus

### Design Patterns

1. **External API Wrapper**: Layer with flexible `.call()` method
2. **Execution Boundary**: Access runtime, use runFork
3. **Resource Management**: acquireRelease + Layer.scoped
4. **Fiber Coordination**: Deferred for one-time sync
5. **Work Distribution**: Queue for multi-consumer
6. **Result Propagation**: Queue + Deferred pattern
7. **Batching**: RequestResolver.makeBatched
8. **Caching**: Request caching + Cache module
9. **Observability**: withSpan + custom loggers + metrics

### Production Checklist

- [ ] Wrap external APIs with Effect layers
- [ ] Use FiberSet for fiber management
- [ ] Implement request batching where applicable
- [ ] Enable request caching for read-heavy operations
- [ ] Add custom loggers for structured logging
- [ ] Instrument with metrics (latency, errors, throughput)
- [ ] Add spans to track execution flow
- [ ] Set up local observability stack
- [ ] Configure OpenTelemetry exporters
- [ ] Create Grafana dashboards

### Resources

**Workshop Materials**:
- GitHub: Workshop repository with all exercises
- Slides: Available in repository
- Example App: CLI with OpenAI, observability stack

**Effect Documentation**:
- effect.website
- Discord community
- API reference

**Observability**:
- OpenTelemetry docs
- Tempo (tracing)
- Prometheus (metrics)
- Grafana (visualization)

---

*This reference distills an advanced full-day workshop on production Effect patterns. For hands-on exercises and complete implementations, refer to the workshop repository.*
