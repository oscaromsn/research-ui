---
modified: 2025-11-03T03:39:12-03:00
---
# Effect Workshop 1 - Getting started
## Effect Days 2024 Workshop | Beginner to Intermediate

**Source**: Effect Days 2024 Workshop by Ethan Niser
**Audience Level**: Beginner to Intermediate
**Core Philosophy**: Effect makes programs easier to understand

---

## Table of Contents

1. [Core Philosophy & Learning Approach](#core-philosophy--learning-approach)
2. [The Effect Type: Foundational Concepts](#the-effect-type-foundational-concepts)
3. [Effect Type System: The Three-Parameter Model](#effect-type-system-the-three-parameter-model)
4. [Core Constructors & Execution](#core-constructors--execution)
5. [Error Handling Philosophy](#error-handling-philosophy)
6. [Control Flow & Composition](#control-flow--composition)
7. [Resource Management: Scope & Finalization](#resource-management-scope--finalization)
8. [Services & Dependency Injection](#services--dependency-injection)
9. [Concurrency Model: Fibers & Structured Concurrency](#concurrency-model-fibers--structured-concurrency)
10. [Advanced Patterns & Performance](#advanced-patterns--performance)

---

## Core Philosophy & Learning Approach

### The Central Thesis
**Effect makes programs easier to understand** through:
- **Safety**: Type-safe error handling and resource management
- **Composability**: Small, reusable building blocks
- **Observability**: Built-in tracing, metrics, and logging
- **Explicitness**: All effects visible in type signatures

### Learning Curve Reality
Effect appears overwhelming due to:
- 30+ modules in API reference
- 200+ functions per module
- Complex type signatures

**Truth**: The learning curve is gentle because:
- Most functions are rarely used in practice
- Core concepts cover 80%+ of daily usage
- Advanced features are opt-in

**Usage Distribution Model**:

```
High Usage, Low Complexity → Start here
│  Effect.succeed, Effect.fail
│  Effect.map, Effect.flatMap
│  Effect.gen (generator syntax)
│  
Medium Usage, Medium Complexity
│  Effect.all, Effect.forEach
│  Effect.catchAll, Effect.retry
│  Service patterns, Layer
│
Low Usage, High Complexity → Advanced topics
   Effect.fiberRefs, Effect.runtimeFlags
   Custom schedulers, low-level fiber APIs
```

---

## The Effect Type: Foundational Concepts

### What is an Effect?

Three perspectives:
1. **Philosophical**: Something brought about by a cause or agent (cause → effect)
2. **Programming**: Side effects our programs have on the outside world
3. **Effect-TS**: A type representing a description of a program

### Definition: An Effect is a Description
From Effect.io website:

> "An effect is a description of a program that is lazy and immutable"

Three critical words:
- **Program**: A series of steps to execute
- **Lazy**: Not executed until explicitly run
- **Immutable**: Creating an Effect doesn't execute it; running it executes a copy

### Key Insight: Description vs Execution

**Analogy**: Effect is like a recipe
- The recipe (Effect value) describes what to do
- Writing the recipe doesn't cook the meal
- You can read the recipe multiple times
- Running the recipe (execution) produces the meal

```typescript
// This is a DESCRIPTION - nothing happens yet
const program = Effect.succeed("hello").pipe(
  Effect.tap(Console.log)
);

// Still a description - composed but not executed
const enhanced = program.pipe(
  Effect.map(s => s.toUpperCase())
);

// NOW it executes - and we can run it multiple times
Effect.runPromise(program); // First execution
Effect.runPromise(program); // Second execution - separate run
```

### Comparison with Promises

**Promise**: Eager execution

```typescript
const promise = new Promise((resolve) => {
  console.log("Executing NOW!"); // Runs immediately
  resolve(42);
});
// Output printed before you even await it
```

**Effect**: Lazy execution

```typescript
const effect = Effect.sync(() => {
  console.log("Executing when run");
  return 42;
});
// Nothing printed yet - it's just a description
```

**Critical Differences**:

| Aspect | Promise | Effect |
|--------|---------|--------|
| Execution | Eager (immediate) | Lazy (on run) |
| Composition | Limited (`.then()`) | Rich (50+ operators) |
| Error Handling | Untyped (`catch`) | Typed (Error channel) |
| Cancellation | AbortController (complex) | Built-in interruption |
| Retries | Manual implementation | `Effect.retry()` |
| Resource Management | Manual cleanup | Automatic (Scope) |

---

## Effect Type System: The Three-Parameter Model

### Type Signature

```typescript
Effect<Success, Error, Requirements>
```

### The Three Channels

#### 1. Success Channel (Output/Value)
- What the Effect produces on success
- Accessed via: `Effect.map`, `Effect.tap`, `.pipe`
- Transformed through operators

**Example**:

```typescript
// Effect<number, never, never>
const num = Effect.succeed(42);

// Effect<string, never, never>
const str = num.pipe(Effect.map(n => `Number: ${n}`));
```

#### 2. Error Channel (Typed Errors)
- What can go wrong (explicitly typed)
- Accessed via: `Effect.catchAll`, `Effect.catchTag`, `Effect.orElse`
- Propagates through composition unless caught

**Example**:

```typescript
class NetworkError {
  readonly _tag = "NetworkError";
  constructor(readonly message: string) {}
}

class ParseError {
  readonly _tag = "ParseError";
  constructor(readonly reason: string) {}
}

// Effect<Data, NetworkError | ParseError, never>
const fetchAndParse = Effect.gen(function* () {
  const response = yield* fetchData(); // can fail with NetworkError
  const parsed = yield* parseJSON(response); // can fail with ParseError
  return parsed;
});
```

#### 3. Requirements Channel (Dependencies)
- Services/dependencies the Effect needs
- Provided via: `Effect.provide`, `Layer`
- Eliminated when all requirements satisfied

**Example**:

```typescript
class Database extends Context.Tag("Database")<
  Database,
  { query: (sql: string) => Effect.Effect<Row[]> }
>() {}

// Effect<User[], SqlError, Database>
const getUsers = Effect.gen(function* () {
  const db = yield* Database;
  return yield* db.query("SELECT * FROM users");
});

// Effect<User[], SqlError, never>
const program = getUsers.pipe(
  Effect.provide(DatabaseLive) // Eliminates Database requirement
);
```

### Type Evolution Through Composition

```typescript
// Start: Effect<number, never, never>
const start = Effect.succeed(10);

// Map: Transform success
// Effect<string, never, never>
const mapped = start.pipe(
  Effect.map(n => `Value: ${n}`)
);

// FlatMap: Chain effects
// Effect<string, NetworkError, HttpClient>
const chained = start.pipe(
  Effect.flatMap(n => fetchData(n)) // introduces error & requirement
);

// Catch: Handle errors
// Effect<string, never, HttpClient>
const handled = chained.pipe(
  Effect.catchAll(err => Effect.succeed("default"))
);

// Provide: Satisfy requirements
// Effect<string, never, never>
const ready = handled.pipe(
  Effect.provide(HttpClientLive)
);
```

---

## Core Constructors & Execution

### Success Constructors

#### `Effect.succeed` - Synchronous Success

```typescript
// Creates an Effect that succeeds with a value
const effect = Effect.succeed(42);
// Type: Effect<number, never, never>

// Use when: You have a value ready to return
```

#### `Effect.sync` - Lazy Synchronous Computation

```typescript
// Defers execution until run
const effect = Effect.sync(() => {
  console.log("Computing...");
  return Math.random();
});
// Type: Effect<number, never, never>

// Use when: 
// - You need lazy evaluation
// - Computation has side effects
// - Want to defer work until execution
```

#### `Effect.promise` - Async Computation

```typescript
// Wraps a promise-returning function
const effect = Effect.promise(() => fetch("/api/data"));
// Type: Effect<Response, never, never>

// Use when:
// - Working with existing Promise-based APIs
// - Making HTTP requests
// - Any async operation
```

**Key Distinction**:
- `Effect.succeed(x)` - value ready now
- `Effect.sync(() => x)` - compute when run (but sync)
- `Effect.promise(() => x)` - compute when run (async)

### Error Constructors

#### `Effect.fail` - Expected Errors

```typescript
class ValidationError {
  readonly _tag = "ValidationError";
  constructor(readonly field: string) {}
}

const effect = Effect.fail(new ValidationError("email"));
// Type: Effect<never, ValidationError, never>

// Use when:
// - Representing expected error conditions
// - Type-safe error handling
// - Recoverable failures
```

#### `Effect.die` - Unexpected Errors (Defects)

```typescript
const effect = Effect.die("This should never happen");
// Type: Effect<never, never, never>

// Use when:
// - Programming errors (bugs)
// - Violations of invariants
// - Unrecoverable conditions
// - Similar to throwing exceptions
```

**Critical Difference**:

```typescript
// FAIL - appears in Error channel, must be handled
const mayFail: Effect<string, NetworkError, never> = 
  Effect.fail(new NetworkError("timeout"));

// DIE - does not appear in Error channel, "defect"
const mayDie: Effect<string, never, never> = 
  Effect.die("assertion failed");

// Catching differences:
mayFail.pipe(
  Effect.catchAll(err => Effect.succeed("recovered")) // OK
);

mayDie.pipe(
  Effect.catchAll(err => Effect.succeed("recovered")) // Type error!
  Effect.catchAllDefect(defect => Effect.succeed("recovered")) // OK
);
```

### Execution Methods

#### `Effect.runPromise` - Most Common

```typescript
const program = Effect.succeed(42);

// Returns a Promise
const promise = Effect.runPromise(program);
promise.then(result => console.log(result)); // 42

// Use when:
// - Top-level execution
// - Integrating with Promise-based code
// - Node scripts, HTTP handlers
```

#### `Effect.runSync` - Synchronous Execution

```typescript
const program = Effect.succeed(42);

// Returns value directly (must be sync!)
const result = Effect.runSync(program); // 42

// Throws if program is async
const async = Effect.promise(() => fetch("/api"));
Effect.runSync(async); // Runtime error!

// Use when:
// - Program is purely synchronous
// - Testing
// - Scripts with no async operations
```

#### `Effect.runFork` - Background Execution

```typescript
const program = Effect.succeed(42);

// Returns a Fiber (handle to running computation)
const fiber = Effect.runFork(program);

// Can interrupt, await, or join the fiber
await Effect.runPromise(fiber.await);

// Use when:
// - Background tasks
// - Long-running operations
// - Need cancellation control
```

---

## Error Handling Philosophy

### Two Kinds of Errors

#### 1. Expected Errors (Failures)
- Typed in the Error channel
- Part of domain logic
- Must be explicitly handled or propagated
- Examples: ValidationError, NetworkError, NotFoundError

#### 2. Unexpected Errors (Defects)
- Not typed in Error channel
- Programming errors/bugs
- Can crash the program
- Examples: null pointer, assertion failures, logic bugs

### Design Pattern: Tagged Unions

```typescript
// DON'T: Use strings or Error base class
type AppError = Error; // Too broad!
type ErrorType = "network" | "parse"; // No data!

// DO: Use discriminated unions with _tag
class NetworkError {
  readonly _tag = "NetworkError";
  constructor(
    readonly statusCode: number,
    readonly message: string
  ) {}
}

class ParseError {
  readonly _tag = "ParseError";
  constructor(
    readonly input: string,
    readonly reason: string
  ) {}
}

class ValidationError {
  readonly _tag = "ValidationError";
  constructor(
    readonly field: string,
    readonly constraint: string
  ) {}
}

type AppError = NetworkError | ParseError | ValidationError;
```

**Benefits**:
1. Type-safe pattern matching
2. Exhaustive error handling
3. Rich error context
4. IDE autocomplete support

### Error Handling Operators

#### `Effect.catchAll` - Handle All Errors

```typescript
const program: Effect<string, NetworkError, never> = 
  fetchData();

const handled: Effect<string, never, never> = program.pipe(
  Effect.catchAll(error => {
    console.error("Network failed:", error.message);
    return Effect.succeed("fallback data");
  })
);

// Error channel eliminated - now Effect<string, never, never>
```

#### `Effect.catchTag` - Handle Specific Error Type

```typescript
type AppError = NetworkError | ParseError | ValidationError;

const program: Effect<Data, AppError, never> = 
  complexOperation();

const handled = program.pipe(
  Effect.catchTag("NetworkError", error => {
    // error is known to be NetworkError
    console.log(`Network error: ${error.statusCode}`);
    return Effect.succeed(defaultData);
  }),
  // Still may fail with ParseError | ValidationError
  Effect.catchTag("ParseError", error => {
    return Effect.fail(new ValidationError("data", "invalid JSON"));
  })
  // Now may only fail with ValidationError
);
```

#### `Effect.catchTags` - Handle Multiple Error Types

```typescript
const handled = program.pipe(
  Effect.catchTags({
    NetworkError: (err) => Effect.succeed(cachedData),
    ParseError: (err) => Effect.succeed(emptyData),
    ValidationError: (err) => Effect.fail(err) // re-throw
  })
);
```

#### `Effect.orElse` - Fallback Effect

```typescript
const primary = fetchFromPrimaryDB();
const secondary = fetchFromSecondaryDB();

const resilient = primary.pipe(
  Effect.orElse(() => secondary)
);

// Tries primary, if it fails, tries secondary
// Errors only if both fail
```

#### `Effect.retry` - Automatic Retry Logic

```typescript
import { Schedule } from "effect";

const unstable = fetchData();

// Retry with exponential backoff
const resilient = unstable.pipe(
  Effect.retry(
    Schedule.exponential("100 millis").pipe(
      Schedule.compose(Schedule.recurs(5)) // max 5 retries
    )
  )
);

// Built-in schedules:
// - Schedule.recurs(n) - retry n times
// - Schedule.exponential(base) - exponential backoff
// - Schedule.spaced(interval) - fixed interval
// - Schedule.fibonacci(base) - fibonacci backoff
```

### Error Context & Cause

```typescript
// Automatically tracks error cause chain
const program = Effect.gen(function* () {
  const user = yield* fetchUser().pipe(
    Effect.catchAll(err => 
      Effect.fail(new AppError("Failed to get user", { cause: err }))
    )
  );
  
  const orders = yield* fetchOrders(user.id).pipe(
    Effect.catchAll(err =>
      Effect.fail(new AppError("Failed to get orders", { cause: err }))
    )
  );
  
  return { user, orders };
});

// On error, full cause chain available:
// AppError: Failed to get orders
//   caused by NetworkError: timeout
//     caused by TCP connection failed
```

---

## Control Flow & Composition

### The Generator Pattern: `Effect.gen`

**Motivation**: Avoid "callback hell" with flatMap

```typescript
// WITHOUT Effect.gen (nested flatMaps)
const program = Effect.flatMap(fetchUser(userId), user =>
  Effect.flatMap(fetchOrders(user.id), orders =>
    Effect.flatMap(fetchItems(orders), items =>
      Effect.succeed({ user, orders, items })
    )
  )
);

// WITH Effect.gen (imperative style)
const program = Effect.gen(function* () {
  const user = yield* fetchUser(userId);
  const orders = yield* fetchOrders(user.id);
  const items = yield* fetchItems(orders);
  return { user, orders, items };
});
```

**How it works**:
- Generator function with `yield*`
- Each `yield*` unwraps an Effect
- Returns an Effect of the final return value
- Errors propagate automatically

**Rules**:
1. Must use `function*` (generator function)
2. Must use `yield*` (not `yield`) to unwrap Effects
3. Don't use `async`/`await` inside Effect.gen
4. Can use regular control flow (if, loops, try/catch)

### Composition Operators

#### `Effect.map` - Transform Success Value

```typescript
const num = Effect.succeed(42);

const str = num.pipe(
  Effect.map(n => `The number is ${n}`)
);
// Effect<string, never, never>

// Like Promise.then(value => ...) but type-safe
```

#### `Effect.flatMap` - Chain Dependent Effects

```typescript
const getUser = (id: number) => Effect.succeed({ id, name: "Alice" });
const getOrders = (userId: number) => Effect.succeed([{ id: 1 }]);

const program = getUser(123).pipe(
  Effect.flatMap(user => getOrders(user.id))
);
// Effect<Order[], never, never>

// Use when:
// - Next effect depends on previous result
// - Chaining async operations
// - Sequential composition
```

#### `Effect.tap` - Side Effects Without Changing Value

```typescript
const program = fetchData().pipe(
  Effect.tap(data => Console.log(`Received: ${data}`)),
  Effect.tap(data => saveToCache(data)),
  Effect.map(data => data.toUpperCase())
);

// tap runs effects but returns original value
// Like .then(x => { doSomething(x); return x; })
```

#### `Effect.all` - Parallel/Sequential Composition

```typescript
// Sequential (default)
const sequential = Effect.all([
  fetchUser(1),
  fetchUser(2),
  fetchUser(3)
]);
// Runs one after another

// Parallel (unbounded)
const parallel = Effect.all([
  fetchUser(1),
  fetchUser(2),
  fetchUser(3)
], { concurrency: "unbounded" });
// Runs all simultaneously

// Parallel (bounded)
const bounded = Effect.all([
  fetchUser(1),
  fetchUser(2),
  fetchUser(3),
  fetchUser(4),
  fetchUser(5)
], { concurrency: 2 });
// Max 2 running at once

// Tuple mode (preserves types)
const tuple = Effect.all([
  Effect.succeed(42),      // number
  Effect.succeed("hello"), // string
  Effect.succeed(true)     // boolean
]);
// Effect<[number, string, boolean], never, never>

// Object mode (named fields)
const object = Effect.all({
  user: fetchUser(1),
  posts: fetchPosts(1),
  comments: fetchComments(1)
}, { concurrency: "unbounded" });
// Effect<{ user: User, posts: Post[], comments: Comment[] }, E, R>
```

#### `Effect.forEach` - Map + All Combined

```typescript
const userIds = [1, 2, 3, 4, 5];

// Sequential
const users = Effect.forEach(userIds, id => fetchUser(id));

// Parallel
const usersParallel = Effect.forEach(
  userIds,
  id => fetchUser(id),
  { concurrency: "unbounded" }
);

// With bounded concurrency
const usersBounded = Effect.forEach(
  userIds,
  id => fetchUser(id),
  { concurrency: 3 }
);
```

### Conditional Execution

#### `Effect.if` - Branching

```typescript
const program = Effect.if(
  Math.random() > 0.5,
  {
    onTrue: () => Effect.succeed("heads"),
    onFalse: () => Effect.succeed("tails")
  }
);

// Or with lazy evaluation
const conditional = Effect.if(
  () => expensiveCheck(),
  {
    onTrue: () => fetchFromAPI(),
    onFalse: () => fetchFromCache()
  }
);
```

#### Early Return Pattern

```typescript
const program = Effect.gen(function* () {
  const user = yield* fetchUser(userId);
  
  if (!user.isActive) {
    // Early return with error
    return yield* Effect.fail(new UserInactiveError());
  }
  
  if (user.isAdmin) {
    // Early return with different logic
    return yield* fetchAllData();
  }
  
  // Normal path
  return yield* fetchUserData(user.id);
});
```

### Filtering & Option Integration

```typescript
import { Option } from "effect";

// Effect.filterOrFail - Filter with custom error
const validUser = fetchUser(id).pipe(
  Effect.filterOrFail(
    user => user.age >= 18,
    () => new UnderageError()
  )
);

// Option integration
const maybeUser: Effect<Option<User>, never, Database> = 
  Effect.gen(function* () {
    const db = yield* Database;
    const result = yield* db.findUser(id);
    return Option.fromNullable(result);
  });

// Unwrap Option or fail
const user = maybeUser.pipe(
  Effect.flatMap(opt => 
    Option.match(opt, {
      onNone: () => Effect.fail(new NotFoundError()),
      onSome: (user) => Effect.succeed(user)
    })
  )
);
```

---

## Resource Management: Scope & Finalization

### The Problem: Resource Leaks

```typescript
// BAD: Manual cleanup is error-prone
async function processFile() {
  const file = await openFile("data.txt");
  
  try {
    const data = await readFile(file);
    await processData(data);
  } finally {
    await closeFile(file); // Easy to forget!
  }
}
```

### Effect's Solution: Automatic Scope Management

**Key Concepts**:
1. **Scope**: A context that tracks resource acquisition and cleanup
2. **Finalizer**: Cleanup action attached to a resource
3. **Automatic Cleanup**: Finalizers run when scope closes (even on error/interrupt)

### `Effect.acquireRelease` - Resource Pattern

```typescript
const program = Effect.gen(function* () {
  // Acquire resource with cleanup
  const file = yield* Effect.acquireRelease(
    openFile("data.txt"),              // acquire
    (file) => closeFile(file)          // release (always runs)
  );
  
  // Use resource - cleanup automatic
  const data = yield* readFile(file);
  return yield* processData(data);
  
  // closeFile() runs here automatically
  // - even if processData fails
  // - even if effect is interrupted
});
```

**How it works**:
1. Acquire creates the resource
2. Resource is attached to current scope
3. Release function registered as finalizer
4. On scope close (success/error/interrupt), finalizer runs

### Scope Behavior

```typescript
Effect.gen(function* () {
  // New scope created here
  
  const resource1 = yield* Effect.acquireRelease(
    acquire1(), release1
  );
  
  const resource2 = yield* Effect.acquireRelease(
    acquire2(), release2
  );
  
  yield* useResources(resource1, resource2);
  
  // Scope closes here - finalizers run in REVERSE order:
  // 1. release2()
  // 2. release1()
});
```

**LIFO (Last In, First Out)**: Resources released in reverse acquisition order (like destructors in C++)

### `Effect.addFinalizer` - Manual Finalizers

```typescript
const program = Effect.gen(function* () {
  // Manual cleanup registration
  yield* Effect.addFinalizer(() => 
    Console.log("Cleanup 1")
  );
  
  yield* doWork();
  
  yield* Effect.addFinalizer(() =>
    Console.log("Cleanup 2")
  );
  
  yield* moreWork();
  
  // On exit: prints "Cleanup 2" then "Cleanup 1"
});
```

### Nested Scopes with `Effect.scoped`

```typescript
const inner = Effect.gen(function* () {
  const resource = yield* Effect.acquireRelease(
    acquire(), release
  );
  return yield* use(resource);
  // resource released when inner completes
}).pipe(Effect.scoped);

const outer = Effect.gen(function* () {
  const result1 = yield* inner; // scope closes here
  const result2 = yield* inner; // new scope here
  return [result1, result2];
});

// Each call to inner has its own scope
// Resources don't leak between calls
```

### Error Handling with Resources

```typescript
const program = Effect.gen(function* () {
  const file = yield* Effect.acquireRelease(
    openFile("data.txt"),
    (f) => closeFile(f)
  );
  
  // If this fails...
  const data = yield* readFile(file);
  
  // ...closeFile() still runs before error propagates
  
}).pipe(
  Effect.catchAll(err => {
    // closeFile has already been called
    return Effect.succeed("default");
  })
);
```

### Interruption Safety

```typescript
const longRunning = Effect.gen(function* () {
  const connection = yield* Effect.acquireRelease(
    connectDB(),
    (conn) => {
      console.log("Closing connection");
      return closeConnection(conn);
    }
  );
  
  // Long-running operation
  yield* processMillionRecords(connection);
  
  // If interrupted externally, closeConnection() STILL runs
});

// Interrupt after 1 second
const program = longRunning.pipe(
  Effect.timeout("1 second")
);
// Connection cleanup guaranteed even on timeout
```

### Practical Patterns

#### Database Connections

```typescript
const withConnection = <A, E, R>(
  use: (conn: Connection) => Effect.Effect<A, E, R>
) =>
  Effect.acquireRelease(
    connectDB(),
    (conn) => conn.close()
  ).pipe(
    Effect.flatMap(use)
  );

const query = withConnection((conn) =>
  Effect.promise(() => conn.query("SELECT * FROM users"))
);
```

#### File Operations

```typescript
const readFileContent = (path: string) =>
  Effect.acquireRelease(
    Effect.sync(() => fs.openSync(path, "r")),
    (fd) => Effect.sync(() => fs.closeSync(fd))
  ).pipe(
    Effect.flatMap(fd =>
      Effect.sync(() => fs.readFileSync(fd, "utf-8"))
    )
  );
```

#### HTTP Connections

```typescript
const withHttpClient = <A, E, R>(
  use: (client: HttpClient) => Effect.Effect<A, E, R>
) =>
  Effect.acquireRelease(
    createHttpClient(),
    (client) => client.destroy()
  ).pipe(
    Effect.flatMap(use)
  );
```

---

## Services & Dependency Injection

### The Problem: Global State & Testing

```typescript
// BAD: Global dependencies
import { database } from "./db";
import { logger } from "./logger";

export async function getUser(id: number) {
  logger.info(`Fetching user ${id}`);
  return database.query("SELECT * FROM users WHERE id = ?", [id]);
}

// Problems:
// 1. Hard to test (can't mock database)
// 2. Hard to configure (what if multiple databases?)
// 3. Hidden dependencies (not in type signature)
// 4. Initialization order matters
```

### Effect's Solution: Services

**Service**: A tagged, type-safe dependency that can be:
1. Required by Effects (Requirements channel)
2. Provided at runtime (eliminating requirements)
3. Composed and layered
4. Easily mocked for testing

### Defining a Service

```typescript
import { Context, Effect } from "effect";

// 1. Define the service interface
interface Database {
  readonly query: (sql: string) => Effect.Effect<Row[], SqlError>;
  readonly execute: (sql: string) => Effect.Effect<void, SqlError>;
}

// 2. Create a Tag (identifier)
class Database extends Context.Tag("Database")<
  Database,
  {
    readonly query: (sql: string) => Effect.Effect<Row[], SqlError>;
    readonly execute: (sql: string) => Effect.Effect<void, SqlError>;
  }
>() {}

// 3. Use the service
const getUsers = Effect.gen(function* () {
  // Get service from context
  const db = yield* Database;
  
  // Use service
  return yield* db.query("SELECT * FROM users");
});
// Type: Effect<Row[], SqlError, Database>
//                                ^^^^^^^^^
//                                Required!
```

### Providing Services

#### Simple Provide

```typescript
// Create implementation
const DatabaseLive = Database.of({
  query: (sql) => Effect.sync(() => {
    // Real database logic
    return executeQuery(sql);
  }),
  execute: (sql) => Effect.sync(() => {
    executeCommand(sql);
  })
});

// Provide to eliminate requirement
const program = getUsers.pipe(
  Effect.provide(DatabaseLive)
);
// Type: Effect<Row[], SqlError, never>
//                               ^^^^^
//                               Satisfied!
```

### Layers: Service Factories

**Layer**: A description of how to build a service, with dependencies

```typescript
import { Layer } from "effect";

// Layer that depends on Config
const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config;
    
    const pool = yield* Effect.acquireRelease(
      createPool(config.connectionString),
      (pool) => pool.close()
    );
    
    return Database.of({
      query: (sql) => Effect.promise(() => pool.query(sql)),
      execute: (sql) => Effect.promise(() => pool.execute(sql))
    });
  })
);
// Type: Layer<Database, never, Config>
//            ^^^^^^^^         ^^^^^^
//            Provides         Requires
```

### Layer Composition

```typescript
// Define services
class Config extends Context.Tag("Config")<
  Config,
  { connectionString: string }
>() {}

class Database extends Context.Tag("Database")<
  Database,
  { query: (sql: string) => Effect.Effect<Row[]> }
>() {}

class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  { getUser: (id: number) => Effect.Effect<User> }
>() {}

// Define layers
const ConfigLive = Layer.succeed(Config, {
  connectionString: "postgresql://localhost/mydb"
});

const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config;
    return Database.of({
      query: (sql) => executeQuery(config, sql)
    });
  })
);

const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const db = yield* Database;
    return UserRepository.of({
      getUser: (id) => db.query(`SELECT * FROM users WHERE id = ${id}`)
    });
  })
);

// Compose layers
const AppLive = ConfigLive.pipe(
  Layer.provide(DatabaseLive),
  Layer.provide(UserRepositoryLive)
);

// Use in program
const program = Effect.gen(function* () {
  const repo = yield* UserRepository;
  return yield* repo.getUser(123);
}).pipe(
  Effect.provide(AppLive)
);
```

**How Layer composition works**:
1. ConfigLive provides Config (no dependencies)
2. DatabaseLive needs Config → gets it from ConfigLive
3. UserRepositoryLive needs Database → gets it from DatabaseLive
4. Final layer provides all services, requires none

### Service Patterns

#### Singleton vs Instance

```typescript
// Singleton: One instance per application
const CacheLive = Layer.sync(Cache, () => ({
  get: (key) => /* ... */,
  set: (key, value) => /* ... */
}));

// Instance: New instance per scope
const ConnectionLive = Layer.scoped(
  Connection,
  Effect.acquireRelease(
    connect(),
    (conn) => conn.close()
  ).pipe(
    Effect.map(conn => Connection.of({
      query: (sql) => conn.query(sql)
    }))
  )
);
```

#### Testing with Mock Services

```typescript
// Production implementation
const LoggerLive = Layer.sync(Logger, () => ({
  info: (msg) => Effect.sync(() => console.log(msg)),
  error: (msg) => Effect.sync(() => console.error(msg))
}));

// Test implementation
const LoggerTest = Layer.sync(Logger, () => {
  const logs: string[] = [];
  return Logger.of({
    info: (msg) => Effect.sync(() => logs.push(msg)),
    error: (msg) => Effect.sync(() => logs.push(msg)),
    getLogs: () => Effect.succeed(logs)
  });
});

// Use in tests
test("logs user fetch", async () => {
  const program = fetchUser(123).pipe(
    Effect.provide(LoggerTest),
    Effect.provide(DatabaseMock)
  );
  
  const result = await Effect.runPromise(program);
  // Verify logs without console output
});
```

#### Service Composition Patterns

```typescript
// High-level service depends on low-level services
class EmailService extends Context.Tag("EmailService")<
  EmailService,
  { send: (to: string, body: string) => Effect.Effect<void> }
>() {}

const EmailServiceLive = Layer.effect(
  EmailService,
  Effect.gen(function* () {
    const logger = yield* Logger;
    const config = yield* Config;
    const http = yield* HttpClient;
    
    return EmailService.of({
      send: (to, body) =>
        Effect.gen(function* () {
          yield* logger.info(`Sending email to ${to}`);
          yield* http.post(config.emailApiUrl, { to, body });
          yield* logger.info("Email sent");
        })
    });
  })
);
```

### Accessing Services: Three Patterns

```typescript
// Pattern 1: Using the tag directly
const program1 = Effect.gen(function* () {
  const db = yield* Database;
  return yield* db.query("SELECT 1");
});

// Pattern 2: Using Effect.service
const program2 = Effect.service(Database).pipe(
  Effect.flatMap(db => db.query("SELECT 1"))
);

// Pattern 3: Using Effect.serviceFunction
const query = Effect.serviceFunction(
  Database,
  (db) => db.query
);

const program3 = query("SELECT 1");
// Type: Effect<Row[], SqlError, Database>
```

---

## Concurrency Model: Fibers & Structured Concurrency

### The Problem with Traditional Concurrency

```typescript
// Promises don't support cancellation well
const promise = expensiveOperation();

// Can't easily cancel
// Need AbortController, manual cleanup, error-prone

// Multiple promises - what if one fails?
const results = await Promise.all([
  operation1(),
  operation2(),
  operation3()
]);
// If operation1 fails, operation2 and operation3 keep running!
// Resource leaks, wasted computation
```

### Fibers: Lightweight Concurrent Computation

**Fiber**: A virtual thread of execution
- Extremely lightweight (1000s per process)
- Cooperative scheduling (don't block threads)
- Built-in interruption support
- Structured concurrency by default

**Key Properties**:
1. **Non-blocking**: Async operations don't block OS threads
2. **Interruptible**: Can be canceled at any point
3. **Composed**: Follow structured concurrency principles
4. **Typed**: Maintain type safety across concurrency

### Creating Fibers

#### `Effect.fork` - Spawn Background Fiber

```typescript
const program = Effect.gen(function* () {
  // Start background fiber
  const fiber = yield* Effect.fork(
    longRunningTask()
  );
  
  // Do other work
  yield* doOtherWork();
  
  // Wait for fiber to complete
  const result = yield* fiber.await;
  
  return result;
});
```

#### `Effect.forkDaemon` - Daemon Fiber

```typescript
// Daemon fibers run independent of parent scope
const program = Effect.gen(function* () {
  // Start daemon
  yield* Effect.forkDaemon(
    periodicCleanup()
  );
  
  // Parent can exit, daemon keeps running
  return yield* mainWork();
});
```

### Structured Concurrency

**Principle**: Child fibers cannot outlive parent
- Parent scope tracks all child fibers
- Parent exit → automatic child cleanup
- Errors in children propagate to parent
- Prevents resource leaks and zombie fibers

```typescript
const parent = Effect.gen(function* () {
  // Scope opened here
  
  const child1 = yield* Effect.fork(task1());
  const child2 = yield* Effect.fork(task2());
  
  yield* Effect.sleep("1 second");
  
  // Scope closes here
  // If task1 or task2 still running → automatic interruption
});
```

### Fiber Operations

#### `Fiber.await` - Wait for Completion

```typescript
const fiber = yield* Effect.fork(computation());

const exit = yield* fiber.await;
// Type: Exit<A, E>

if (exit._tag === "Success") {
  console.log("Result:", exit.value);
} else {
  console.log("Failed:", exit.cause);
}
```

#### `Fiber.join` - Await and Unwrap

```typescript
const fiber = yield* Effect.fork(computation());

// join = await + unwrap
const result = yield* fiber.join;
// Type: A (throws on error)

// Equivalent to:
const exit = yield* fiber.await;
const result = yield* Effect.done(exit);
```

#### `Fiber.interrupt` - Cancel Fiber

```typescript
const fiber = yield* Effect.fork(
  Effect.forever(
    Effect.sleep("1 second").pipe(
      Effect.tap(() => Console.log("tick"))
    )
  )
);

yield* Effect.sleep("5 seconds");

// Cancel the fiber
yield* fiber.interrupt;
// "tick" stops printing
```

#### Racing Fibers

```typescript
// Race: First to complete wins
const winner = Effect.race(
  fetchFromPrimary(),
  fetchFromSecondary()
);
// Losing fiber automatically interrupted

// Race with all results
const raceAll = Effect.raceAll([
  fetchFrom("server1"),
  fetchFrom("server2"),
  fetchFrom("server3")
]);
// Returns first success, cancels others
```

### Interruption: Deep Dive

**Interruption Model**:
1. Cooperative: Fibers check interruption status at safe points
2. Automatic: Happens on scope close, parent interrupt, race loss
3. Composable: Propagates through Effect chains
4. Safe: Resources cleaned up via finalizers

**Safe Points**:
- Effect boundaries (flatMap, gen yield points)
- Blocking operations (Effect.sleep, queue operations)
- Explicit checks (Effect.checkInterrupt)

```typescript
const program = Effect.gen(function* () {
  const conn = yield* Effect.acquireRelease(
    connectDB(),
    (conn) => {
      console.log("Cleaning up connection");
      return conn.close();
    }
  );
  
  // Long computation
  for (let i = 0; i < 1000000; i++) {
    yield* processRecord(conn, i);
    
    // Safe point - can be interrupted here
    // Finalizer (conn.close) WILL run
  }
});

const withTimeout = program.pipe(
  Effect.timeout("5 seconds")
);
// If timeout, interruption triggers cleanup
```

### Concurrency Patterns

#### Parallel Processing with `Effect.all`

```typescript
// Process items concurrently
const results = yield* Effect.all(
  items.map(item => processItem(item)),
  { concurrency: "unbounded" }
);
// All items processed in parallel

// Bounded concurrency (worker pool pattern)
const results = yield* Effect.all(
  items.map(item => processItem(item)),
  { concurrency: 5 }
);
// Max 5 items processed at once
```

#### `Effect.forEach` - Map with Concurrency

```typescript
const users = yield* Effect.forEach(
  userIds,
  (id) => fetchUser(id),
  { concurrency: 10 }
);
// Fetch up to 10 users at once
```

#### Background Task Pattern

```typescript
const withBackgroundTask = <A, E, R>(
  main: Effect.Effect<A, E, R>,
  background: Effect.Effect<void, never, R>
) =>
  Effect.gen(function* () {
    // Fork background task
    const fiber = yield* Effect.fork(background);
    
    // Run main task
    const result = yield* main;
    
    // Interrupt background
    yield* fiber.interrupt;
    
    return result;
  });

// Usage
const program = withBackgroundTask(
  processData(),
  Effect.forever(
    Effect.sleep("1 second").pipe(
      Effect.tap(() => reportProgress())
    )
  )
);
```

#### Debouncing Pattern

```typescript
const debounced = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  duration: Duration
) =>
  Effect.gen(function* () {
    const deferred = yield* Deferred.make<A, E>();
    
    yield* Effect.fork(
      Effect.sleep(duration).pipe(
        Effect.flatMap(() => effect),
        Effect.flatMap(a => deferred.succeed(a))
      )
    );
    
    return yield* deferred.await;
  });
```

### Synchronization Primitives

#### `Deferred` - One-Time Promise

```typescript
const deferred = yield* Deferred.make<number>();

// Producer fiber
yield* Effect.fork(
  Effect.sleep("1 second").pipe(
    Effect.flatMap(() => deferred.succeed(42))
  )
);

// Consumer blocks until value available
const value = yield* deferred.await; // 42
```

#### `Ref` - Mutable State

```typescript
const counter = yield* Ref.make(0);

// Increment atomically
yield* counter.update(n => n + 1);

// Get current value
const value = yield* counter.get;

// Compare-and-swap
yield* counter.modify(n => [n, n + 1]); // returns old value
```

#### `Queue` - Fiber Communication

```typescript
// Create bounded queue
const queue = yield* Queue.bounded<number>(10);

// Producer
yield* Effect.fork(
  Effect.forever(
    Effect.sleep("100 millis").pipe(
      Effect.flatMap(() => queue.offer(Math.random()))
    )
  )
);

// Consumer
yield* Effect.forever(
  queue.take.pipe(
    Effect.tap(value => Console.log(`Received: ${value}`))
  )
);

// Queue operations block when full/empty
// But don't block the runtime!
```

#### `Semaphore` - Resource Limiting

```typescript
// Limit to 3 concurrent operations
const semaphore = yield* Semaphore.make(3);

const limited = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  semaphore.withPermits(1)(effect);

// Only 3 run at once, rest wait
yield* Effect.all(
  items.map(item => limited(processItem(item))),
  { concurrency: "unbounded" }
);
```

### Concurrency Control

```typescript
// Inherit concurrency from parent
const program = Effect.all(
  tasks,
  { concurrency: "inherit" }
).pipe(
  Effect.withConcurrency(10) // Set at parent level
);

// All nested Effect.all with "inherit" respect this limit
```

### Advanced: Race Conditions & Solutions

```typescript
// PROBLEM: Race condition with Ref
const counter = yield* Ref.make(0);

yield* Effect.all([
  counter.update(n => n + 1),
  counter.update(n => n + 1),
  counter.update(n => n + 1)
], { concurrency: "unbounded" });

const value = yield* counter.get; // Might be 3, might be less!

// SOLUTION: Use Ref.modify or atomic operations
yield* Effect.all([
  Ref.updateAndGet(counter, n => n + 1),
  Ref.updateAndGet(counter, n => n + 1),
  Ref.updateAndGet(counter, n => n + 1)
], { concurrency: "unbounded" });

const value = yield* counter.get; // Always 3
```

---

## Advanced Patterns & Performance

### Batching & Caching

#### Request Batching

```typescript
import { RequestResolver, Request } from "effect";

// Define request type
interface GetUser extends Request.Request<User, UserNotFound> {
  readonly id: number;
}

// Batch resolver
const UserResolver = RequestResolver.makeBatched(
  (requests: GetUser[]) =>
    Effect.gen(function* () {
      const ids = requests.map(r => r.id);
      
      // Single DB query for all IDs
      const users = yield* db.query(
        `SELECT * FROM users WHERE id IN (${ids.join(",")})`
      );
      
      // Resolve each request
      return Effect.forEach(requests, request => {
        const user = users.find(u => u.id === request.id);
        return user
          ? Request.succeed(request, user)
          : Request.fail(request, new UserNotFound());
      });
    })
);

// Usage: Automatic batching within a single Effect
const program = Effect.gen(function* () {
  // These are batched into a single DB query!
  const [user1, user2, user3] = yield* Effect.all([
    getUserById(1),
    getUserById(2),
    getUserById(3)
  ]);
  
  return { user1, user2, user3 };
});
```

#### Request Caching

```typescript
// Cached requests automatically deduped
const getUser = (id: number) =>
  Effect.request(
    GetUser({ id }),
    UserResolver
  ).pipe(
    Effect.withRequestCaching(true)
  );

const program = Effect.gen(function* () {
  const user1 = yield* getUser(1);
  const user2 = yield* getUser(1); // Cache hit!
  const user3 = yield* getUser(1); // Cache hit!
  
  // Only one actual DB query
});
```

### Stream Processing

```typescript
import { Stream } from "effect";

// Create stream
const numbers = Stream.range(1, 100);

// Transform
const processed = numbers.pipe(
  Stream.map(n => n * 2),
  Stream.filter(n => n % 3 === 0),
  Stream.take(10)
);

// Run stream
const result = yield* Stream.runCollect(processed);

// Concurrent processing
const urls = Stream.fromIterable(urlList);

const results = urls.pipe(
  Stream.mapEffect(
    url => fetchData(url),
    { concurrency: 10 } // Process 10 at once
  )
);
```

### Tracing & Observability

```typescript
// Spans for tracing
const program = Effect.gen(function* () {
  yield* Effect.logInfo("Starting operation");
  
  const user = yield* fetchUser(id).pipe(
    Effect.withSpan("fetch-user", { attributes: { userId: id } })
  );
  
  const orders = yield* fetchOrders(user.id).pipe(
    Effect.withSpan("fetch-orders")
  );
  
  yield* Effect.logInfo("Operation complete");
  
  return { user, orders };
}).pipe(
  Effect.withSpan("user-orders-operation")
);

// Telemetry integration
import { NodeSdk } from "@effect/opentelemetry";

const program = myApp.pipe(
  Effect.provide(NodeSdk.layer(() => ({
    resource: { serviceName: "my-service" },
    traceExporter: new OTLPTraceExporter()
  })))
);
```

### Performance Considerations

#### What Effect Does
- Overhead from runtime, scheduler, fibers
- Objects allocated for each Effect
- Additional indirection layers

#### When Effect Shines
- **IO-bound work**: Network, database, file system
  - Effect overhead negligible vs IO time
  - Concurrency primitives provide massive speedup
  
- **Complex orchestration**: Multiple services, retries, fallbacks
  - Type safety prevents bugs
  - Composition enables maintainable code
  
- **Need for reliability**: Resource management, error handling
  - Automatic cleanup prevents leaks
  - Structured concurrency prevents hangs

#### When to Avoid Effect
- **CPU-bound computation**: Heavy number crunching
  - Pure JS/TS will be faster
  - Consider workers if needed
  
- **Hot paths**: Inner loops, tight iterations
  - Effect overhead may be noticeable
  - Use imperative code, wrap in Effect.sync()

**Optimization Pattern**:

```typescript
// DON'T: Effect in tight loop
const slow = Effect.gen(function* () {
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    // Effect overhead on every iteration
    sum += yield* Effect.succeed(i * 2);
  }
  return sum;
});

// DO: Imperative loop, single Effect
const fast = Effect.sync(() => {
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += i * 2;
  }
  return sum;
});
```

### Effect.platform - Cross-Platform APIs

```typescript
import { HttpClient } from "@effect/platform";
import { NodeHttpClient } from "@effect/platform-node";
import { BunHttpClient } from "@effect/platform-bun";

// Platform-agnostic code
const fetchUser = Effect.gen(function* () {
  const http = yield* HttpClient.HttpClient;
  const response = yield* http.get("/api/user");
  return yield* response.json;
});

// Provide platform-specific implementation
const nodeProgram = fetchUser.pipe(
  Effect.provide(NodeHttpClient.layer)
);

const bunProgram = fetchUser.pipe(
  Effect.provide(BunHttpClient.layer)
);
```

Available platform abstractions:
- FileSystem
- Terminal
- HttpClient
- HttpServer
- Workers
- Command (subprocess)
- Path

---

## Summary: Key Takeaways

### Core Principles
1. **Effect = Description**: Lazy, immutable program descriptions
2. **Three Channels**: Success, Error, Requirements
3. **Type Safety**: Errors and dependencies in types
4. **Composition**: Small pieces combine elegantly

### Essential Operators
- **Create**: `succeed`, `sync`, `promise`, `fail`, `gen`
- **Transform**: `map`, `flatMap`, `tap`
- **Combine**: `all`, `forEach`, `zip`
- **Handle Errors**: `catchAll`, `catchTag`, `retry`, `orElse`
- **Resources**: `acquireRelease`, `scoped`
- **Concurrency**: `fork`, `race`, `all` with concurrency

### Design Patterns
- **Services**: Tag-based dependency injection
- **Layers**: Service factories with dependencies
- **Fibers**: Structured concurrent computation
- **Scopes**: Automatic resource management
- **Generators**: Imperative-style composition

### When to Use Effect
✅ Complex application logic
✅ Multiple services/dependencies
✅ Need retry/timeout/fallback
✅ Resource management critical
✅ Concurrency requirements
✅ Type-safe error handling

### When Not to Use Effect
❌ Simple scripts
❌ CPU-intensive calculations
❌ Very tight performance requirements
❌ Team unfamiliar with FP concepts

### Learning Path
1. **Beginner**: Effect.gen, map, flatMap, catchAll
2. **Intermediate**: Services, Layers, basic concurrency
3. **Advanced**: Fibers, Stream, custom schedulers
4. **Expert**: Request resolvers, custom effects, platform abstractions

### Resources
- Official docs: https://effect.website
- API reference: https://effect-ts.github.io/effect/
- Discord community
- GitHub examples and exercises
- Effect Days conference talks

---

## Appendix: Quick Reference

### Type Signatures Cheat Sheet

```typescript
// Basic types
Effect<A, E, R>
  // A: Success type
  // E: Error type
  // R: Requirements

// Common patterns
Effect<User, NotFoundError, Database>
  // Fetches user, may fail with NotFoundError, needs Database

Effect<void, never, Logger>
  // Logs something, can't fail, needs Logger

Effect<string, ValidationError | NetworkError, Config>
  // Returns string, may fail with either error, needs Config

// Channel operations
map: Effect<A, E, R> => Effect<B, E, R>
  // Transforms success, preserves error & requirements

flatMap: Effect<A, E, R> => (A => Effect<B, E2, R2>) => Effect<B, E | E2, R | R2>
  // Chains effects, merges errors & requirements

catchAll: Effect<A, E, R> => (E => Effect<A2, E2, R2>) => Effect<A | A2, E2, R | R2>
  // Handles error, removes original error

provide: Effect<A, E, R> => Layer<R> => Effect<A, E, never>
  // Satisfies requirements
```

### Common Imports

```typescript
// Core
import { Effect, pipe } from "effect";

// Error handling
import { Either, Option } from "effect";

// Services
import { Context, Layer } from "effect";

// Concurrency
import { Fiber, Deferred, Ref, Queue, Semaphore } from "effect";

// Streaming
import { Stream, Sink } from "effect";

// Scheduling
import { Schedule } from "effect";

// Platform
import { HttpClient, FileSystem } from "@effect/platform";
```

---

*This reference distills a comprehensive workshop on Effect-TS, covering foundational concepts through advanced patterns. For interactive exercises and code examples, refer to the workshop repository.*
