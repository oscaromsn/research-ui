---
modified: 2025-10-27T17:28:02-03:00
---
# Effect Office Hours 4: Atom, API Patterns, Tracing & Platform
## Comprehensive Technical Reference Guide

**Source**: Effect Office Hours #4 - Atom, API Patterns, Tracing, and Platform
**Format**: Live Q&A, Technical Deep Dives, Library Implementation Patterns
**Focus Areas**: Reactive State Management, Trait System, Distributed Tracing, Platform Abstraction, Advanced Layer Patterns

---

## Table of Contents

1. [Effect Atom: Reactive State Management](#effect-atom-reactive-state-management)
2. [Atom.family: Managing Multiple Independent States](#atomfamily-managing-multiple-independent-states)
3. [The Effect Trait System](#the-effect-trait-system)
4. [Distributed Tracing Deep Dive](#distributed-tracing-deep-dive)
5. [Platform Abstractions](#platform-abstractions)
6. [Advanced Layer Patterns for Library Authors](#advanced-layer-patterns-for-library-authors)
7. [Spec-Based API Pattern](#spec-based-api-pattern)
8. [Context Manipulation & Unsafe Operations](#context-manipulation--unsafe-operations)
9. [V3 vs V4: Finalization Semantics](#v3-vs-v4-finalization-semantics)
10. [Cloudflare Workers Patterns](#cloudflare-workers-patterns)

---

## Effect Atom: Reactive State Management

### What is Effect Atom?

**Effect Atom** is Effect's primitive for reactive state management, designed as a superior alternative to React's `useState` for Effect-integrated applications.

**Key Characteristics**:
- Reactive updates propagate automatically
- Thread-safe (fiber-safe)
- Composable with Effect combinators
- Supports subscriptions and derived state
- Can be used outside React components

### Basic Usage Pattern

```typescript
import { Atom } from "@effect/experimental";
import { Effect } from "effect";

// Create an atom with initial value
const countAtom = Atom.make(0);

// Use in an Effect program
const program = Effect.gen(function* () {
  const count = yield* countAtom; // Read current value
  
  yield* Atom.set(countAtom, count + 1); // Update value
  
  const newCount = yield* countAtom;
  console.log(newCount); // 1
});
```

### React Integration

**Basic Counter Component**:

```typescript
import { Atom } from "@effect/experimental";
import { useAtom } from "@effect/experimental/react";

// Define atom outside component (singleton)
const countAtom = Atom.make(0);

function Counter() {
  // useAtom returns [currentValue, setter]
  const [count, setCount] = useAtom(countAtom);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(count - 1)}>
        Decrement
      </button>
    </div>
  );
}
```

**Characteristics**:
- `count` mirrors underlying atom value
- Updates trigger re-renders
- `setCount` updates the atom
- All components using same atom share state

### Problem: Shared State

```typescript
function App() {
  return (
    <>
      <Counter /> {/* All share same count */}
      <Counter /> {/* Updates together */}
      <Counter /> {/* Not independent */}
    </>
  );
}
```

**What happens**: All three counters share the same `countAtom` reference, so incrementing one increments all.

**When this is good**:
- Global UI state (e.g., keyboard navigation selection)
- Shared application state (like Redux/Zustand)
- Single-instance widgets

**When this is bad**:
- Multiple independent instances of same widget
- List items with individual state
- Dynamically created/destroyed components

---

## Atom.family: Managing Multiple Independent States

### The Problem with Singleton Atoms

```typescript
// ❌ PROBLEM: Only one counter possible
const countAtom = Atom.make(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  // ...
}

// All counters share same state!
<Counter /> 
<Counter />
<Counter />
```

### Solution: Atom.family

**Concept**: Create a family of atoms indexed by unique identifiers.

**Mental Model**: `Atom.family` is like a `Map<ID, Atom>` where:
- Keys = unique identifiers
- Values = independent Atom instances

### Basic Implementation

```typescript
import { Atom } from "@effect/experimental";

// Define atom family with identifier type
const counterFamily = Atom.family<number, number>((id) =>
  Atom.make(0) // Initial value for each atom
);

// ✅ Now each counter has independent state
function Counter({ id }: { id: number }) {
  // Call family like a function with ID
  const [count, setCount] = useAtom(counterFamily(id));
  
  return (
    <div>
      <p>Counter {id}: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
}

// Usage: Independent counters
function App() {
  return (
    <>
      <Counter id={0} /> {/* Independent */}
      <Counter id={1} /> {/* Independent */}
      <Counter id={2} /> {/* Independent */}
    </>
  );
}
```

**How it works**:
1. `counterFamily(0)` creates/retrieves atom for ID `0`
2. `counterFamily(1)` creates/retrieves atom for ID `1`
3. Same ID always returns same atom (memoized)
4. Different IDs return different atoms

### Keep Alive Pattern

**Problem**: What happens when component unmounts?

```typescript
// Without keepAlive
const counterFamily = Atom.family<number, number>((id) =>
  Atom.make(0)
);

function App() {
  const [numCounters, setNumCounters] = React.useState(3);
  
  return (
    <>
      {Array(numCounters).fill(0).map((_, i) => (
        <Counter key={i} id={i} />
      ))}
      <button onClick={() => setNumCounters(0)}>
        Remove All
      </button>
      <button onClick={() => setNumCounters(3)}>
        Restore
      </button>
    </>
  );
}

// Behavior:
// 1. Set counter 0 to 5, counter 1 to 10, counter 2 to 15
// 2. Click "Remove All" (unmounts all counters)
// 3. Click "Restore"
// Result: Counters reset to 0, 0, 0 (state lost!)
```

**Solution: Keep Alive**

```typescript
const counterFamily = Atom.family<number, number>((id) =>
  Atom.make(0).pipe(
    Atom.keepAlive // Preserve state across unmounts
  )
);

// Same scenario:
// 1. Set counter 0 to 5, counter 1 to 10, counter 2 to 15
// 2. Click "Remove All"
// 3. Click "Restore"
// Result: Counters remember 5, 10, 15! ✅
```

**Keep Alive Semantics**:
- Without: Atom destroyed when last subscriber unmounts
- With: Atom persists even with zero subscribers
- Use case: Preserving state across navigation, conditional rendering

### Advanced: Complex Keys

**Problem**: What if your entities have complex identifiers?

```typescript
interface UserKey {
  organizationId: string;
  userId: string;
}

// ❌ WRONG: Object identity comparison
const userFamily = Atom.family<UserKey, UserData>((key) =>
  Atom.make(initialUserData)
);

// These create DIFFERENT atoms (different object references)
userFamily({ organizationId: "org1", userId: "user1" });
userFamily({ organizationId: "org1", userId: "user1" });
```

**Solution: Effect's `Equals` trait**

```typescript
import { Data } from "effect";

// Use Data.struct for structural equality
const UserKey = Data.struct({
  organizationId: Data.String,
  userId: Data.String
});

type UserKey = typeof UserKey.Type;

const userFamily = Atom.family<UserKey, UserData>((key) =>
  Atom.make(initialUserData)
);

// ✅ CORRECT: Same atoms (structural equality)
const key1 = UserKey({ organizationId: "org1", userId: "user1" });
const key2 = UserKey({ organizationId: "org1", userId: "user1" });

userFamily(key1) === userFamily(key2); // true!
```

**How it works**:
- `Data.struct` implements `Equals` and `Hash` traits
- `Atom.family` uses `Hash` for map keys
- Structural equality: same values = same hash = same atom

### Practical Example: Dynamic List

```typescript
import { Atom } from "@effect/experimental";
import { useState } from "react";
import { useAtom } from "@effect/experimental/react";

// Atom family for todo items
const todoFamily = Atom.family<string, string>((id) =>
  Atom.make("").pipe(Atom.keepAlive)
);

// Individual todo item component
function TodoItem({ id }: { id: string }) {
  const [text, setText] = useAtom(todoFamily(id));
  
  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder={`Todo ${id}`}
    />
  );
}

// Todo list
function TodoList() {
  const [todoIds, setTodoIds] = useState<string[]>(["1", "2", "3"]);
  
  const addTodo = () => {
    const newId = String(Date.now());
    setTodoIds([...todoIds, newId]);
  };
  
  const removeTodo = (id: string) => {
    setTodoIds(todoIds.filter((tid) => tid !== id));
  };
  
  return (
    <div>
      {todoIds.map((id) => (
        <div key={id}>
          <TodoItem id={id} />
          <button onClick={() => removeTodo(id)}>Remove</button>
        </div>
      ))}
      <button onClick={addTodo}>Add Todo</button>
    </div>
  );
}
```

**Key Pattern**:
- React manages list of IDs
- Atom.family manages state for each ID
- Keep alive preserves state if item temporarily removed
- IDs can be UUIDs, timestamps, or entity IDs

### Atom vs useState: When to Use What

| Feature | useState | Atom |
|---------|----------|------|
| **Scope** | Component-local | Can be global/shared |
| **Reactivity** | React only | Works with Effect primitives |
| **Subscriptions** | No | Yes (via `.changes`) |
| **Derived State** | Manual | Via `Atom.map` |
| **Effect Integration** | No | Yes |
| **Multiple Instances** | Per component | Via `Atom.family` |

**Use `useState` when**:
- Simple component-local state
- No Effect integration needed
- Standard React patterns sufficient

**Use `Atom` when**:
- Shared state across components
- Need Effect integration
- Want subscriptions/derived state
- Building Effect-first applications

### Atom Subscriptions & Derived State

```typescript
import { Atom, Stream } from "effect";

const countAtom = Atom.make(0);

// Subscribe to changes
const program = Effect.gen(function* () {
  const stream = yield* Atom.changes(countAtom);
  
  yield* Stream.runForEach(stream, (value) =>
    Console.log(`Count changed to: ${value}`)
  );
});

// Derived atom
const doubleCountAtom = Atom.map(
  countAtom,
  (count) => count * 2
);

// Usage
const program2 = Effect.gen(function* () {
  yield* Atom.set(countAtom, 5);
  
  const count = yield* countAtom; // 5
  const double = yield* doubleCountAtom; // 10
});
```

---

## The Effect Trait System

### Overview

Effect uses **traits** (TypeScript interfaces with specific methods) to provide common capabilities across data types.

**Core Traits**:
1. **Pipeable** - Pipe operator support
2. **Hash** - Hashing for use as map keys
3. **Equals** - Structural equality
4. **Inspectable** - Custom `toString()` behavior
5. **Effectable** (V3) / **Yieldable** (V4) - Yield in generators
6. **PrimaryKey** - Extract unique identifiers

### 1. Pipeable Trait

**Purpose**: Enable pipe syntax for custom data types

```typescript
import { pipe, Pipeable } from "effect";

// Define custom data type
class Box<A> implements Pipeable {
  constructor(readonly value: A) {}
  
  // Implement pipe method
  pipe() {
    return Pipeable.pipeArguments(this, arguments);
  }
  
  // Custom methods
  map<B>(f: (a: A) => B): Box<B> {
    return new Box(f(this.value));
  }
}

// Now works with pipe!
const result = pipe(
  new Box(5),
  (box) => box.map((x) => x * 2),
  (box) => box.map((x) => x + 1)
);

console.log(result.value); // 11
```

**Implementation Pattern**:

```typescript
import { Pipeable } from "effect";

class MyType implements Pipeable {
  pipe() {
    return Pipeable.pipeArguments(this, arguments);
  }
}
```

### 2. Hash & Equals Traits

**Purpose**: Structural equality and hash-based collections

**Problem without Equals**:

```typescript
// ❌ Reference equality only
const point1 = { x: 1, y: 2 };
const point2 = { x: 1, y: 2 };

point1 === point2; // false (different objects)

const set = new Set([point1, point2]);
set.size; // 2 (treats as different)
```

**Solution with Hash/Equals**:

```typescript
import { Equal, Hash, Data } from "effect";

class Point implements Equal.Equal {
  constructor(
    readonly x: number,
    readonly y: number
  ) {}
  
  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof Point &&
      this.x === that.x &&
      this.y === that.y
    );
  }
  
  [Hash.symbol](): number {
    return Hash.combine(
      Hash.number(this.x),
      Hash.number(this.y)
    );
  }
}

const point1 = new Point(1, 2);
const point2 = new Point(1, 2);

Equal.equals(point1, point2); // true ✅

// Works with Effect's HashSet
import { HashSet } from "effect";

const set = HashSet.fromIterable([point1, point2]);
HashSet.size(set); // 1 (deduplicated!)
```

**Shortcut: Data.struct**:

```typescript
import { Data } from "effect";

const Point = Data.struct({
  x: Data.Number,
  y: Data.Number
});

type Point = typeof Point.Type;

const point1 = Point({ x: 1, y: 2 });
const point2 = Point({ x: 1, y: 2 });

Equal.equals(point1, point2); // true (automatic!)
```

**Use Cases**:
- HashMap/HashSet keys
- Deduplication
- Atom.family keys
- Cache keys
- Entity identity

### 3. Inspectable Trait

**Purpose**: Custom `console.log()` output

```typescript
import { Inspectable } from "effect";

class User implements Inspectable.Inspectable {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly password: string // Sensitive!
  ) {}
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      password: "***REDACTED***"
    };
  }
  
  [Inspectable.NodeInspectSymbol]() {
    return this.toJSON();
  }
  
  toString() {
    return `User(${this.name})`;
  }
}

const user = new User("123", "Alice", "secret123");

console.log(user);
// Output: { id: '123', name: 'Alice', password: '***REDACTED***' }

console.log(String(user));
// Output: User(Alice)
```

**Practical Use**:
- Hide sensitive data in logs
- Prettier debug output
- Custom serialization

### 4. Effectable (V3) / Yieldable (V4)

**Purpose**: Make custom types yieldable in `Effect.gen`

#### V3: Effectable (Subtyping)

```typescript
import { Effect, Effectable } from "effect";

class RemoteData<A, E>
  implements Effectable.Effectable<A, E, never>
{
  constructor(
    readonly status: "loading" | "success" | "error",
    readonly data?: A,
    readonly error?: E
  ) {}
  
  // Commit method converts to Effect
  [Effectable.CommitSymbol](): Effect.Effect<A, E, never> {
    if (this.status === "loading") {
      return Effect.suspend(() => this[Effectable.CommitSymbol]());
    }
    if (this.status === "error") {
      return Effect.fail(this.error!);
    }
    return Effect.succeed(this.data!);
  }
}

// ✅ Can yield RemoteData in generators
const program = Effect.gen(function* () {
  const remote = new RemoteData("success", 42);
  const value = yield* remote; // Calls commit automatically
  
  console.log(value); // 42
});
```

**V3 Subtyping Issue**:

```typescript
// ❌ V3: Too permissive
Effect.flatMap(
  Effect.succeed(1),
  (x) => Option.some(x * 2) // Option auto-flattened!
);
// Type: Effect<number, NoSuchElementException>
// Footgun: Implicit conversion
```

#### V4: Yieldable (Explicit)

```typescript
import { Effect, Yieldable } from "effect";

class RemoteData<A, E>
  implements Yieldable.Yieldable<A, E, never>
{
  constructor(
    readonly status: "loading" | "success" | "error",
    readonly data?: A,
    readonly error?: E
  ) {}
  
  // asEffect method converts to Effect
  [Yieldable.YieldableSymbol](): Effect.Effect<A, E, never> {
    if (this.status === "loading") {
      return Effect.suspend(() => this[Yieldable.YieldableSymbol]());
    }
    if (this.status === "error") {
      return Effect.fail(this.error!);
    }
    return Effect.succeed(this.data!);
  }
}

// ✅ V4: Can yield in generators
const program = Effect.gen(function* () {
  const remote = new RemoteData("success", 42);
  const value = yield* remote; // Works!
  
  console.log(value); // 42
});

// ❌ V4: NOT auto-flattened in flatMap
Effect.flatMap(
  Effect.succeed(1),
  (x) => Option.some(x * 2) // Type error!
);
// Must explicitly call .asEffect():
Effect.flatMap(
  Effect.succeed(1),
  (x) => Option.some(x * 2).asEffect()
); // ✅
```

**V4 Advantages**:
- More explicit (less magic)
- Prevents accidental flattening
- Better type errors
- Still convenient in generators

### 5. PrimaryKey Trait

**Purpose**: Extract unique identifiers from entities

```typescript
import { PrimaryKey } from "effect";

interface User extends PrimaryKey.PrimaryKey {
  id: string;
  name: string;
  email: string;
}

const User = {
  make: (id: string, name: string, email: string): User => ({
    id,
    name,
    email,
    [PrimaryKey.symbol]() {
      return this.id;
    }
  })
};

const user = User.make("123", "Alice", "alice@example.com");

PrimaryKey.get(user); // "123"

// Used internally by Effect Cluster for sharding
```

### Implementing Multiple Traits

**Complete Example**:

```typescript
import {
  Equal,
  Hash,
  Pipeable,
  Inspectable,
  Yieldable,
  Effect
} from "effect";

class Result<A, E>
  implements
    Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable,
    Yieldable.Yieldable<A, E, never>
{
  constructor(
    readonly tag: "Ok" | "Err",
    readonly value?: A,
    readonly error?: E
  ) {}
  
  // Equal trait
  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof Result &&
      this.tag === that.tag &&
      Equal.equals(this.value, that.value) &&
      Equal.equals(this.error, that.error)
    );
  }
  
  // Hash trait
  [Hash.symbol](): number {
    return Hash.combine(
      Hash.string(this.tag),
      Hash.unknown(this.value),
      Hash.unknown(this.error)
    );
  }
  
  // Pipeable trait
  pipe() {
    return Pipeable.pipeArguments(this, arguments);
  }
  
  // Inspectable trait
  [Inspectable.NodeInspectSymbol]() {
    return this.tag === "Ok"
      ? `Ok(${this.value})`
      : `Err(${this.error})`;
  }
  
  // Yieldable trait
  [Yieldable.YieldableSymbol](): Effect.Effect<A, E, never> {
    return this.tag === "Ok"
      ? Effect.succeed(this.value!)
      : Effect.fail(this.error!);
  }
  
  // Custom methods
  map<B>(f: (a: A) => B): Result<B, E> {
    return this.tag === "Ok"
      ? new Result("Ok", f(this.value!))
      : new Result("Err", undefined, this.error);
  }
}

// Usage
const result1 = new Result("Ok", 42);
const result2 = new Result("Ok", 42);

// Equality
Equal.equals(result1, result2); // true

// Pipeable
const doubled = pipe(
  result1,
  (r) => r.map((x) => x * 2)
);

// Inspectable
console.log(doubled); // Ok(84)

// Yieldable
const program = Effect.gen(function* () {
  const value = yield* doubled;
  return value + 1;
});
```

---

## Distributed Tracing Deep Dive

### Tracing Fundamentals

**What is Tracing?**
- Observability technique for tracking request flow
- Records spans (units of work) across services
- Builds distributed call graphs
- Critical for debugging production issues

**Effect's Tracing Model**:

```
Trace (entire request)
├── Span A (HTTP handler)
│   ├── Span B (database query)
│   └── Span C (external API call)
└── Span D (background job)
```

### Basic Span Creation

```typescript
import { Effect } from "effect";

const fetchUser = (id: number) =>
  Effect.gen(function* () {
    // Simulate database query
    yield* Effect.sleep("100 millis");
    return { id, name: "Alice" };
  }).pipe(
    Effect.withSpan("fetchUser", { attributes: { userId: id } })
  );

const program = Effect.gen(function* () {
  const user = yield* fetchUser(123);
  console.log(user);
}).pipe(
  Effect.withSpan("mainProgram")
);
```

**What `Effect.withSpan` does**:
1. Creates new span when Effect runs
2. Sets span name and attributes
3. Records start/end times
4. Links to parent span automatically
5. Captures errors/interruptions

### Span Hierarchy

```typescript
const getUser = (id: number) =>
  Effect.gen(function* () {
    yield* Effect.log(`Fetching user ${id}`);
    yield* Effect.sleep("50 millis");
    return { id, name: "Alice" };
  }).pipe(
    Effect.withSpan("database.getUser")
  );

const getUserPosts = (userId: number) =>
  Effect.gen(function* () {
    yield* Effect.log(`Fetching posts for user ${userId}`);
    yield* Effect.sleep("100 millis");
    return [
      { id: 1, title: "Hello" },
      { id: 2, title: "World" }
    ];
  }).pipe(
    Effect.withSpan("database.getUserPosts")
  );

const getUserWithPosts = (id: number) =>
  Effect.gen(function* () {
    const user = yield* getUser(id);
    const posts = yield* getUserPosts(id);
    
    return { user, posts };
  }).pipe(
    Effect.withSpan("api.getUserWithPosts")
  );

// Trace structure:
// api.getUserWithPosts
//   ├── database.getUser
//   └── database.getUserPosts
```

### Problem: Forked Fibers & Tracing

**Issue**: Forked fibers may not inherit parent span context

```typescript
const backgroundTask = Effect.gen(function* () {
  yield* Effect.sleep("1 second");
  yield* Effect.log("Background task complete");
}).pipe(
  Effect.withSpan("backgroundTask")
);

const mainProgram = Effect.gen(function* () {
  // Fork background task
  const fiber = yield* Effect.fork(backgroundTask);
  
  yield* Effect.log("Main program complete");
  
  // Don't await fiber (daemon pattern)
}).pipe(
  Effect.withSpan("mainProgram")
);

// Problem: backgroundTask span may not link to mainProgram span
```

**Why this happens**:
- `Effect.fork` creates independent fiber
- Span context in fiber-local storage
- Forked fiber gets copy of parent context
- BUT: May not properly link spans

### Solution 1: Await Fiber

```typescript
const mainProgram = Effect.gen(function* () {
  const fiber = yield* Effect.fork(backgroundTask);
  
  yield* Effect.log("Main program running");
  
  // ✅ Await fiber to link spans
  yield* Fiber.await(fiber);
}).pipe(
  Effect.withSpan("mainProgram")
);

// Now spans properly linked!
```

### Solution 2: Manual Parent Span Propagation

```typescript
const mainProgram = Effect.gen(function* () {
  // Get current span
  const parentSpan = yield* Effect.currentParentSpan;
  
  const backgroundTask = Effect.gen(function* () {
    yield* Effect.sleep("1 second");
    yield* Effect.log("Background task complete");
  }).pipe(
    Effect.withSpan("backgroundTask"),
    // ✅ Explicitly set parent span
    Effect.withParentSpan(parentSpan)
  );
  
  yield* Effect.forkDaemon(backgroundTask);
  
  yield* Effect.log("Main program complete");
}).pipe(
  Effect.withSpan("mainProgram")
);
```

**`Effect.withParentSpan` method**:

```typescript
interface Effect {
  withParentSpan<A, E, R>(
    effect: Effect<A, E, R>,
    parentSpan: Span
  ): Effect<A, E, R>;
}
```

### Solution 3: Span ID Propagation (Queue Pattern)

**Scenario**: Background workers processing queue

```typescript
import { Queue, Effect } from "effect";

interface Task {
  id: string;
  data: unknown;
  spanId: string; // ✅ Pass span ID explicitly
}

const worker = Queue.take(taskQueue).pipe(
  Effect.flatMap((task) =>
    Effect.gen(function* () {
      // Reconstruct span context from ID
      const span = yield* Effect.makeSpan(
        "worker.processTask",
        { parent: task.spanId }
      );
      
      yield* processTask(task.data).pipe(
        Effect.withSpan(span)
      );
    })
  ),
  Effect.forever
);

const enqueueTask = (data: unknown) =>
  Effect.gen(function* () {
    // Capture current span ID
    const currentSpan = yield* Effect.currentParentSpan;
    const spanId = currentSpan.spanId;
    
    const task: Task = {
      id: randomUUID(),
      data,
      spanId // ✅ Include in task
    };
    
    yield* Queue.offer(taskQueue, task);
  }).pipe(
    Effect.withSpan("enqueueTask")
  );

// Now worker spans link back to enqueueing spans!
```

### Accessing Parent Span

```typescript
import { Effect, Tracer } from "effect";

const program = Effect.gen(function* () {
  // Get parent span (fails if none)
  const parentSpan = yield* Effect.currentParentSpan;
  
  console.log(parentSpan.name);
  console.log(parentSpan.spanId);
  console.log(parentSpan.attributes);
  
  // Create child span manually
  const childSpan = yield* Effect.makeSpan("childOperation", {
    parent: parentSpan
  });
  
  yield* doSomething().pipe(
    Effect.withSpan(childSpan)
  );
}).pipe(
  Effect.withSpan("parentOperation")
);

// Alternative: Safe access
const program2 = Effect.gen(function* () {
  const maybeParent = yield* Effect.currentParentSpan.pipe(
    Effect.option
  );
  
  if (Option.isSome(maybeParent)) {
    console.log(maybeParent.value.name);
  }
});
```

### Span Attributes

**Adding Context to Spans**:

```typescript
const fetchUser = (id: number) =>
  dbQuery("SELECT * FROM users WHERE id = $1", [id]).pipe(
    Effect.withSpan("database.fetchUser", {
      attributes: {
        "user.id": id,
        "db.table": "users",
        "db.operation": "SELECT"
      }
    })
  );

const httpHandler = (req: Request) =>
  Effect.gen(function* () {
    const userId = req.params.userId;
    const user = yield* fetchUser(userId);
    
    return Response.json(user);
  }).pipe(
    Effect.withSpan("http.GET /users/:userId", {
      attributes: {
        "http.method": "GET",
        "http.route": "/users/:userId",
        "http.status_code": 200
      }
    })
  );
```

### Exporting Traces

**OpenTelemetry Integration**:

```typescript
import { NodeSdk } from "@effect/opentelemetry";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";

const program = Effect.gen(function* () {
  yield* fetchUser(123);
  yield* fetchUser(456);
}).pipe(
  Effect.withSpan("myProgram")
);

const layer = NodeSdk.layer({
  resource: { serviceName: "my-service" },
  spanProcessor: new BatchSpanProcessor(
    new ConsoleSpanExporter()
  )
});

Effect.runPromise(
  program.pipe(Effect.provide(layer))
);

// Outputs trace spans to console
```

**Production Setup (Jaeger/Honeycomb)**:

```typescript
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";

const layer = NodeSdk.layer({
  resource: { serviceName: "api-server" },
  spanProcessor: new BatchSpanProcessor(
    new JaegerExporter({
      endpoint: "http://localhost:14268/api/traces"
    })
  )
});
```

---

## Platform Abstractions

### Philosophy

**Goal**: Write once, run anywhere

Effect Platform provides unified interfaces for:
- File systems (Node, Bun, Browser, Memory)
- HTTP clients/servers
- Command execution
- Terminal I/O
- Path manipulation
- Crypto operations

**Pattern**: Define interface, provide implementations per platform

### FileSystem Abstraction

#### Available Implementations

| Implementation | Module | Use Case |
|----------------|--------|----------|
| Node | `@effect/platform-node` | Node.js applications |
| Bun | `@effect/platform-bun` | Bun runtime |
| Browser | `@effect/platform-browser` | (future) Web apps |
| Memory | `@effect/platform` (V4) | Testing |

#### Basic Usage

```typescript
import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  
  // Read file
  const content = yield* fs.readFileString("./data.json");
  const data = JSON.parse(content);
  
  // Write file
  yield* fs.writeFileString("./output.txt", "Hello, World!");
  
  // List directory
  const files = yield* fs.readDirectory("./src");
  console.log(files);
  
  // Check existence
  const exists = yield* fs.exists("./config.json");
  
  return data;
}).pipe(
  Effect.provide(NodeFileSystem.layer)
);
```

#### Cross-Platform File Operations

```typescript
import { FileSystem, Path } from "@effect/platform";
import { Effect } from "effect";

// Works on Node, Bun, or Browser (future)
const copyFiles = (sourceDir: string, destDir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    
    // Ensure destination exists
    yield* fs.makeDirectory(destDir, { recursive: true });
    
    // List source files
    const files = yield* fs.readDirectory(sourceDir);
    
    // Copy each file
    yield* Effect.forEach(files, (file) =>
      Effect.gen(function* () {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);
        
        const content = yield* fs.readFile(sourcePath);
        yield* fs.writeFile(destPath, content);
      })
    );
  });

// Use with Node
import { NodeFileSystem, NodePath } from "@effect/platform-node";

const nodeProgram = copyFiles("./src", "./dist").pipe(
  Effect.provide(NodeFileSystem.layer),
  Effect.provide(NodePath.layerPosix)
);

// Use with Bun
import { BunFileSystem, BunPath } from "@effect/platform-bun";

const bunProgram = copyFiles("./src", "./dist").pipe(
  Effect.provide(BunFileSystem.layer),
  Effect.provide(BunPath.layer)
);
```

#### In-Memory FileSystem (Testing)

```typescript
import { FileSystem } from "@effect/platform";
import { MemoryFileSystem } from "@effect/platform/testing";
import { Effect } from "effect";

const testProgram = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  
  // Write to in-memory FS
  yield* fs.writeFileString("/test.txt", "Hello");
  
  // Read back
  const content = yield* fs.readFileString("/test.txt");
  
  expect(content).toBe("Hello");
}).pipe(
  Effect.provide(MemoryFileSystem.layer)
);

// ✅ No actual disk I/O!
// ✅ Fast tests
// ✅ Isolated
```

### Crypto Abstraction (Future)

**Proposed API**:

```typescript
import { Crypto } from "@effect/platform";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const crypto = yield* Crypto.Crypto;
  
  // Hashing
  const hash = yield* crypto.hash("sha256", "data");
  
  // Random bytes
  const bytes = yield* crypto.randomBytes(32);
  
  // HMAC
  const hmac = yield* crypto.hmac("sha256", "key", "message");
  
  // Encryption (future)
  const encrypted = yield* crypto.encrypt("aes-256-gcm", key, data);
});
```

**Implementations**:
- `NodeCrypto` - Node.js crypto module
- `WebCrypto` - Browser Web Crypto API
- `BunCrypto` - Bun's crypto APIs

### HTTP Client Abstraction

```typescript
import { HttpClient } from "@effect/platform";
import { NodeHttpClient } from "@effect/platform-node";
import { Effect } from "effect";

const fetchUser = (id: number) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    
    const response = yield* client.get(
      `https://api.example.com/users/${id}`
    );
    
    const user = yield* response.json;
    return user;
  });

// Use with Node
const nodeProgram = fetchUser(123).pipe(
  Effect.provide(NodeHttpClient.layer)
);

// Use with Fetch API (future)
const browserProgram = fetchUser(123).pipe(
  Effect.provide(FetchHttpClient.layer)
);
```

### Command Execution (Node/Bun only)

```typescript
import { Command } from "@effect/platform";
import { NodeCommand } from "@effect/platform-node";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const command = yield* Command.Command;
  
  // Run shell command
  const result = yield* command.exec("ls", ["-la"]);
  
  console.log(result.stdout);
  console.log(result.exitCode);
}).pipe(
  Effect.provide(NodeCommand.layer)
);
```

### Contributing Platform Abstractions

**Process**:
1. Open discussion in Discord #effect-platform
2. Propose API design (interface)
3. Consider all platforms
4. Implement for at least one platform
5. Submit PR with tests
6. Team reviews and merges

**Example**: Adding `WebSocket` abstraction

```typescript
// Proposed interface
interface WebSocket {
  readonly connect: (url: string) => Effect.Effect<Connection>;
  readonly send: (conn: Connection, data: string) => Effect.Effect<void>;
  readonly receive: (conn: Connection) => Stream.Stream<string>;
  readonly close: (conn: Connection) => Effect.Effect<void>;
}

// Node implementation uses 'ws' package
// Browser implementation uses native WebSocket
// Both satisfy same interface!
```

---

## Advanced Layer Patterns for Library Authors

### The Spec-Based API Pattern

**Goal**: Separate specification from implementation

**Used in**:
- `@effect/platform/HttpApi`
- `@effect/rpc`
- `@effect/ai/Toolkit`

**Pattern Structure**:

```
Spec (interface)
  ↓
Handler Implementation (runtime)
  ↓
Layer (provides handlers to context)
  ↓
Program (uses handlers)
```

### Example: AI Toolkit

#### 1. Define Spec

```typescript
import { Tool } from "@effect/ai";
import { Schema } from "effect";

// Define toolkit spec
class DadJokeTools extends Tool.Toolkit<DadJokeTools>()("DadJokes", {
  getDadJoke: Tool.make({
    name: "getDadJoke",
    description: "Get a dad joke",
    parameters: Schema.Struct({
      searchTerm: Schema.String
    }),
    output: Schema.Struct({
      joke: Schema.String
    })
  })
}) {}
```

**What this is**:
- Pure specification
- No implementation
- Just types and metadata

#### 2. Implement Handlers

```typescript
import { Effect, Layer } from "effect";

// Create layer from spec
const DadJokeToolsLive = DadJokeTools.toLayer({
  // Implement each tool
  getDadJoke: ({ searchTerm }) =>
    Effect.gen(function* () {
      // Could call API, database, etc.
      const joke = yield* fetchDadJoke(searchTerm);
      
      return { joke };
    })
});
```

**Key Points**:
- `.toLayer()` method on toolkit
- Returns object matching spec
- Each tool gets parameters as input
- Must return output type
- Can use any Effect services

#### 3. Use in Program

```typescript
const program = Effect.gen(function* () {
  const tools = yield* DadJokeTools;
  
  // Tools available as handlers
  const result = yield* tools.getDadJoke({
    searchTerm: "programmer"
  });
  
  console.log(result.joke);
}).pipe(
  Effect.provide(DadJokeToolsLive)
);
```

### Under the Hood: How `.toLayer()` Works

#### Step 1: Build Context Map

```typescript
// Simplified implementation
class Toolkit {
  toLayer(handlers: Handlers): Layer {
    return Layer.effect(
      ToolkitHandlers,
      Effect.gen(function* () {
        // Get current Effect context
        const context = yield* Effect.context;
        
        // Build handler context
        let handlerContext = Context.empty();
        
        for (const [name, handler] of Object.entries(handlers)) {
          // Get tool definition
          const tool = this.tools[name];
          
          // Create handler tag
          const handlerTag = ToolHandler(tool.id);
          
          // Add to context
          handlerContext = Context.add(
            handlerContext,
            handlerTag,
            handler
          );
        }
        
        return handlerContext;
      })
    );
  }
}
```

#### Step 2: Context as Map

**Runtime structure**:

```typescript
// Context is Map<string, unknown>
const context = new Map([
  ["DadJokes/getDadJoke", (params) => Effect.succeed({ joke: "..." })],
  ["DadJokes/tellJoke", (params) => Effect.succeed({ status: "told" })],
  // ... more handlers
]);
```

#### Step 3: Handler Lookup

```typescript
// When toolkit used
class Toolkit {
  getDadJoke(params: Parameters): Effect {
    return Effect.gen(function* () {
      // Get current context
      const context = yield* Effect.context;
      
      // ⚠️ UNSAFE: Lookup handler by tool ID
      const handler = context.unsafeGet("DadJokes/getDadJoke");
      
      // Call handler
      return yield* handler(params);
    });
  }
}
```

**Why "unsafe"**:
- Runtime string lookup
- No type safety at access point
- Type safety enforced at `.toLayer()` call

### HTTP API Pattern

**Similar but more complex**:

```typescript
import { HttpApi, HttpApiGroup, HttpApiEndpoint } from "@effect/platform";
import { Schema } from "effect";

// Define API spec
class UsersApi extends HttpApi.make("UsersApi") {
  static readonly getUser = HttpApiEndpoint.get("getUser", "/users/:id")
    .setPath(Schema.Struct({ id: Schema.NumberFromString }))
    .setSuccess(Schema.Struct({
      id: Schema.Number,
      name: Schema.String
    }));
  
  static readonly createUser = HttpApiEndpoint.post("createUser", "/users")
    .setPayload(Schema.Struct({
      name: Schema.String,
      email: Schema.String
    }))
    .setSuccess(Schema.Struct({
      id: Schema.Number,
      name: Schema.String
    }));
}

// Implement handlers
const UsersApiLive = HttpApi.toHandlers(UsersApi, {
  getUser: ({ path }) =>
    Effect.gen(function* () {
      const db = yield* Database;
      return yield* db.getUser(path.id);
    }),
  
  createUser: ({ payload }) =>
    Effect.gen(function* () {
      const db = yield* Database;
      return yield* db.createUser(payload);
    })
});

// Create server
const server = HttpApiBuilder.serve(UsersApi).pipe(
  Layer.provide(UsersApiLive),
  Layer.provide(DatabaseLive)
);
```

**Why more complex**:
- HTTP-specific metadata (paths, methods, status codes)
- Request/response encoding/decoding
- Multiple endpoint groups
- Nested composition

### RPC Pattern

**Very similar to Toolkit**:

```typescript
import { Rpc } from "@effect/rpc";
import { Schema } from "effect";

// Define RPC spec
class UserRpc extends Rpc.Group("UserRpc", {
  getUser: Rpc.method({
    request: Schema.Struct({ id: Schema.Number }),
    response: Schema.Struct({
      id: Schema.Number,
      name: Schema.String
    })
  }),
  
  listUsers: Rpc.method({
    request: Schema.Struct({}),
    response: Schema.Array(Schema.Struct({
      id: Schema.Number,
      name: Schema.String
    }))
  })
}) {}

// Implement
const UserRpcLive = UserRpc.toLayer({
  getUser: ({ id }) =>
    Effect.gen(function* () {
      const db = yield* Database;
      return yield* db.getUser(id);
    }),
  
  listUsers: () =>
    Effect.gen(function* () {
      const db = yield* Database;
      return yield* db.listUsers();
    })
});
```

### Creating Your Own Spec-Based API

**Pattern Template**:

```typescript
import { Context, Effect, Layer } from "effect";

// 1. Define spec structure
interface ToolDefinition<I, O> {
  name: string;
  description: string;
  input: Schema<I>;
  output: Schema<O>;
}

// 2. Define handler type
type Handler<I, O, E, R> = (input: I) => Effect.Effect<O, E, R>;

// 3. Create toolkit base class
abstract class Toolkit {
  abstract readonly tools: Record<string, ToolDefinition<any, any>>;
  
  // Convert to layer
  toLayer<Handlers extends Record<string, Handler<any, any, any, any>>>(
    handlers: Handlers
  ): Layer.Layer<ToolkitHandlers> {
    return Layer.effect(
      ToolkitHandlers,
      Effect.gen(function* () {
        // Build context from handlers
        let ctx = Context.empty();
        
        for (const [name, handler] of Object.entries(handlers)) {
          const tool = this.tools[name];
          const tag = ToolHandler(tool.name);
          
          ctx = Context.add(ctx, tag, handler);
        }
        
        return ctx;
      })
    );
  }
  
  // Invoke handler by name
  protected invoke<I, O>(
    name: string,
    input: I
  ): Effect.Effect<O, never, ToolkitHandlers> {
    return Effect.gen(function* () {
      const handlers = yield* ToolkitHandlers;
      const tag = ToolHandler(name);
      const handler = Context.unsafeGet(handlers, tag);
      
      return yield* handler(input);
    });
  }
}

// 4. Define concrete toolkit
class MyToolkit extends Toolkit {
  readonly tools = {
    echo: {
      name: "echo",
      description: "Echo input",
      input: Schema.String,
      output: Schema.String
    }
  };
  
  echo(input: string) {
    return this.invoke<string, string>("echo", input);
  }
}

// 5. Use it
const MyToolkitLive = new MyToolkit().toLayer({
  echo: (input) => Effect.succeed(input.toUpperCase())
});

const program = Effect.gen(function* () {
  const toolkit = yield* MyToolkit;
  const result = yield* toolkit.echo("hello");
  console.log(result); // "HELLO"
}).pipe(
  Effect.provide(MyToolkitLive)
);
```

---

## Context Manipulation & Unsafe Operations

### The Unsafe Escape Hatch

**When you need to drop down to unsafe code**:
- Building library APIs
- Custom context manipulation
- Performance-critical paths
- Integration with non-Effect code

**Cardinal Rule**: Unsafe code should be **encapsulated** in safe APIs.

### Unsafe Context Operations

#### `Context.unsafeGet`

```typescript
import { Context, Effect } from "effect";

class Database extends Context.Tag("Database")<
  Database,
  { query: (sql: string) => Effect.Effect<unknown> }
>() {}

// ✅ SAFE: Yields Database from context
const safeProgram = Effect.gen(function* () {
  const db = yield* Database; // Type-safe
  return yield* db.query("SELECT * FROM users");
});

// ⚠️ UNSAFE: Direct context access
const unsafeProgram = Effect.gen(function* () {
  const context = yield* Effect.context;
  
  // No type safety here!
  const db = Context.unsafeGet(context, Database);
  
  return yield* db.query("SELECT * FROM users");
});
```

**When to use**:
- Building `.toLayer()` implementations
- Custom service patterns
- Performance optimization (avoid multiple yields)

**Dangers**:
- Runtime error if service not in context
- Type safety lost at access point
- Hard to debug

#### Building Context Objects

```typescript
import { Context, Effect, Layer } from "effect";

// Build context programmatically
const buildAppContext = Effect.gen(function* () {
  // Start with empty context
  let ctx = Context.empty();
  
  // Add services one by one
  const logger = Logger.make();
  ctx = Context.add(ctx, Logger, logger);
  
  const config = yield* loadConfig();
  ctx = Context.add(ctx, Config, config);
  
  const db = yield* createDatabase(config);
  ctx = Context.add(ctx, Database, db);
  
  return ctx;
});

// Convert to layer
const AppLayer = Layer.effect(
  Context.Tag("AppContext"),
  buildAppContext
);
```

### Pattern: Handler Registry

**Use Case**: Dynamic tool/endpoint registration

```typescript
import { Context, Effect, Layer, HashMap } from "effect";

// Handler registry service
class HandlerRegistry extends Context.Tag("HandlerRegistry")<
  HandlerRegistry,
  {
    register: <I, O>(
      name: string,
      handler: (input: I) => Effect.Effect<O>
    ) => Effect.Effect<void>;
    invoke: <I, O>(
      name: string,
      input: I
    ) => Effect.Effect<O, HandlerNotFound>;
  }
>() {}

// Implementation
const HandlerRegistryLive = Layer.sync(HandlerRegistry, () => {
  // Mutable map for handlers
  const handlers = HashMap.empty<string, Function>();
  
  return {
    register: (name, handler) =>
      Effect.sync(() => {
        handlers.set(name, handler);
      }),
    
    invoke: (name, input) =>
      Effect.gen(function* () {
        const handler = HashMap.get(handlers, name);
        
        if (Option.isNone(handler)) {
          return yield* Effect.fail(new HandlerNotFound({ name }));
        }
        
        return yield* handler.value(input);
      })
  };
});

// Usage
const program = Effect.gen(function* () {
  const registry = yield* HandlerRegistry;
  
  // Register handlers
  yield* registry.register("echo", (s: string) =>
    Effect.succeed(s.toUpperCase())
  );
  
  // Invoke handlers
  const result = yield* registry.invoke("echo", "hello");
  console.log(result); // "HELLO"
}).pipe(
  Effect.provide(HandlerRegistryLive)
);
```

### Pattern: Context Inheritance

**Use Case**: Nested scopes with additional services

```typescript
import { Context, Effect, Layer } from "effect";

// Base services
class Logger extends Context.Tag("Logger")<
  Logger,
  { log: (msg: string) => Effect.Effect<void> }
>() {}

class Database extends Context.Tag("Database")<
  Database,
  { query: (sql: string) => Effect.Effect<unknown> }
>() {}

// Scoped service (needs Logger + Database)
class Transaction extends Context.Tag("Transaction")<
  Transaction,
  {
    execute: <A>(
      effect: Effect.Effect<A, never, Database>
    ) => Effect.Effect<A>;
  }
>() {}

// Create transaction scope
const withTransaction = <A, E, R>(
  effect: Effect.Effect<A, E, R | Database>
): Effect.Effect<A, E, R | Logger | Database> =>
  Effect.gen(function* () {
    const logger = yield* Logger;
    const db = yield* Database;
    
    // Create transaction DB
    yield* logger.log("BEGIN TRANSACTION");
    const txDb = createTransactionDb(db);
    
    // Create new context with transaction DB
    const txContext = Context.add(
      yield* Effect.context,
      Database,
      txDb
    );
    
    // Run effect in transaction context
    const result = yield* effect.pipe(
      Effect.provideContext(txContext)
    );
    
    yield* logger.log("COMMIT TRANSACTION");
    
    return result;
  });

// Usage
const program = Effect.gen(function* () {
  const db = yield* Database;
  
  yield* db.query("SELECT 1"); // Regular DB
  
  yield* withTransaction(
    Effect.gen(function* () {
      const db = yield* Database; // Transaction DB!
      yield* db.query("INSERT INTO users ...");
      yield* db.query("UPDATE settings ...");
    })
  );
}).pipe(
  Effect.provide(LoggerLive),
  Effect.provide(DatabaseLive)
);
```

### Anti-Pattern: Leaking Unsafe Operations

```typescript
// ❌ BAD: Exposes unsafe operation
class MyService extends Context.Tag("MyService")<
  MyService,
  {
    unsafeDoThing: (ctx: Context.Context<never>) => void;
  }
>() {}

// ✅ GOOD: Encapsulates unsafe operation
class MyService extends Context.Tag("MyService")<
  MyService,
  {
    doThing: () => Effect.Effect<void>;
  }
>() {}

const MyServiceLive = Layer.sync(MyService, () => ({
  doThing: () =>
    Effect.gen(function* () {
      const ctx = yield* Effect.context;
      // Unsafe operation hidden inside
      unsafeInternalOperation(ctx);
    })
}));
```

---

## V3 vs V4: Finalization Semantics

### What is Finalization?

**Finalization**: Cleanup code that runs when Effect completes/interrupts

**Use Cases**:
- Close file handles
- Release database connections
- Stop background timers
- Send final metrics
- Flush buffers

### V3 Finalization

#### Basic Pattern

```typescript
import { Effect } from "effect";

const program = Effect.gen(function* () {
  // Add finalizer
  yield* Effect.addFinalizer(() =>
    Effect.log("Cleanup!")
  );
  
  yield* Effect.log("Working...");
  
  // Finalizer runs after this
});

// Output:
// Working...
// Cleanup!
```

#### Finalization Order

**Rule**: Finalizers run in **reverse order** (LIFO - Last In, First Out)

```typescript
const program = Effect.gen(function* () {
  yield* Effect.addFinalizer(() => Effect.log("First"));
  yield* Effect.addFinalizer(() => Effect.log("Second"));
  yield* Effect.addFinalizer(() => Effect.log("Third"));
  
  yield* Effect.log("Work");
});

// Output:
// Work
// Third   ← Last added, first run
// Second
// First   ← First added, last run
```

**Why reverse order?**
- Resources acquired first should be released last
- Mirrors stack unwinding
- Prevents use-after-free scenarios

#### Scope and Resources

```typescript
const program = Effect.scoped(
  Effect.gen(function* () {
    // Acquire resource
    const file = yield* Effect.acquireRelease(
      openFile("data.txt"),
      (f) => closeFile(f) // Finalizer
    );
    
    // Use resource
    const data = yield* readFile(file);
    
    // File closed automatically when scope exits
    return data;
  })
);
```

### V3 Process Lifetime Issue

**Problem**: Some Effects don't keep process alive

```typescript
// V3 Behavior
const program = Effect.gen(function* () {
  const deferred = yield* Deferred.make<number>();
  
  // Fork background fiber
  yield* Effect.fork(
    Effect.gen(function* () {
      yield* Effect.sleep("1 second");
      yield* Deferred.succeed(deferred, 42);
    })
  );
  
  // Await deferred
  const result = yield* Deferred.await(deferred);
  console.log(result);
});

Effect.runPromise(program);

// ⚠️ V3: Process exits before deferred completes!
// Background fiber doesn't keep process alive
// Output: (nothing, process exits)
```

### V4 Finalization Changes

**Key Change**: Awaiting certain primitives keeps process alive

```typescript
// V4 Behavior
const program = Effect.gen(function* () {
  const deferred = yield* Deferred.make<number>();
  
  yield* Effect.fork(
    Effect.gen(function* () {
      yield* Effect.sleep("1 second");
      yield* Deferred.succeed(deferred, 42);
    })
  );
  
  const result = yield* Deferred.await(deferred);
  console.log(result);
});

Effect.runPromise(program);

// ✅ V4: Process waits for deferred to complete
// Output: 42
```

**Affected Primitives (V4)**:
- `Deferred.await`
- `Queue.take`
- `Ref.get` (in some cases)
- Other blocking operations

### Testing Finalization

**Pattern**: Add finalizer with log

```typescript
import { Effect, Console } from "effect";

const program = Effect.gen(function* () {
  // Add test finalizer at top
  yield* Effect.addFinalizer(() =>
    Console.log("✅ Finalization ran!")
  );
  
  yield* doWork();
  
  // More work...
});

Effect.runPromise(program);

// If you see "✅ Finalization ran!", finalizers work!
```

**Layer Finalization**:

```typescript
const DatabaseLayer = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const pool = yield* createPool();
    
    // Add finalizer for cleanup
    yield* Effect.addFinalizer(() =>
      Console.log("Closing database pool")
    );
    
    return Database.of({
      query: (sql) => pool.query(sql)
    });
  })
);

// When Runtime disposes, finalizer runs
const runtime = ManagedRuntime.make(DatabaseLayer);

// Use runtime...

// Cleanup
await runtime.dispose();
// Output: Closing database pool
```

---

## Cloudflare Workers Patterns

### The Challenge

**Cloudflare Workers Constraints**:
- Limited execution time
- Process exits after response sent
- Background tasks need special handling
- No long-running processes

### Pattern 1: Ensure Finalization

**Problem**: Worker exits before cleanup

```typescript
// ❌ WRONG: Finalizers may not run
export default {
  async fetch(request: Request): Promise<Response> {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        yield* Effect.addFinalizer(() =>
          sendMetrics() // May not run!
        );
        
        return yield* handleRequest(request);
      })
    );
    
    return Response.json(result);
  }
};
```

**Solution**: Test finalization runs

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        // Test finalizer
        yield* Effect.addFinalizer(() =>
          Console.log("✅ Cleanup ran")
        );
        
        return yield* handleRequest(request);
      })
    );
    
    return Response.json(result);
  }
};

// Check logs for "✅ Cleanup ran"
```

### Pattern 2: `waitUntil` for Background Work

**Cloudflare's `waitUntil` API**:

```typescript
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}
```

**Keeps worker alive** until promise resolves.

**Effect Integration**:

```typescript
import { Effect } from "effect";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Handle request
    const result = await Effect.runPromise(handleRequest(request));
    
    // Background work
    ctx.waitUntil(
      Effect.runPromise(
        Effect.gen(function* () {
          yield* sendLogs();
          yield* updateAnalytics();
          yield* syncCache();
        })
      )
    );
    
    return Response.json(result);
  }
};
```

**Key Points**:
- Response sent immediately
- Background work continues
- Worker waits until all `waitUntil` promises resolve
- Finalizers run before worker exits

### Pattern 3: Effect.never for Long-Running Tasks

**Use Case**: WebSocket connections, SSE streams

```typescript
import { Effect, Stream } from "effect";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") === "websocket") {
      return await Effect.runPromise(
        Effect.gen(function* () {
          const ws = yield* upgradeWebSocket(request);
          
          // Handle messages
          yield* Stream.runForEach(
            ws.messages,
            (msg) => handleMessage(ws, msg)
          );
          
          // Keep connection alive
          yield* Effect.never;
        })
      );
    }
    
    // Regular HTTP request
    return Response.json({ status: "ok" });
  }
};
```

**`Effect.never`**:
- Never completes
- Keeps process alive
- Useful for servers, streams
- Interrupt to stop

### Pattern 4: Managed Runtime for Workers

```typescript
import { Effect, Layer, ManagedRuntime } from "effect";

// Define app layer
const AppLayer = Layer.mergeAll(
  DatabaseLayer,
  CacheLayer,
  LoggerLayer
);

// Create managed runtime (reused across requests)
const runtime = ManagedRuntime.make(AppLayer);

export default {
  async fetch(request: Request): Promise<Response> {
    // Run with shared runtime
    const result = await runtime.runPromise(
      handleRequest(request)
    );
    
    return Response.json(result);
  }
};

// Cleanup on worker shutdown (if possible)
addEventListener("unload", () => {
  runtime.dispose();
});
```

**Benefits**:
- Shared layer construction
- Connection pooling
- Faster cold starts

---

## Summary: Key Patterns & Principles

### Effect Atom

1. **Basic Atom**: Singleton reactive state
2. **Atom.family**: Multiple independent instances
3. **Keep Alive**: Preserve state across unmounts
4. **Complex Keys**: Use `Data.struct` for structural equality

### Trait System

1. **Pipeable**: Enable pipe syntax
2. **Hash/Equals**: Structural equality, map keys
3. **Inspectable**: Custom logging/debugging
4. **Yieldable (V4)**: Yield in generators
5. **PrimaryKey**: Extract unique IDs

### Distributed Tracing

1. **Effect.withSpan**: Create named spans
2. **Forked Fibers**: May lose span context
3. **Effect.withParentSpan**: Manually link spans
4. **Queue Pattern**: Pass span IDs explicitly

### Platform Abstractions

1. **FileSystem**: Cross-platform file operations
2. **In-Memory FS**: Fast isolated testing
3. **Future**: Crypto, WebSocket, more

### Advanced Layer Patterns

1. **Spec-Based APIs**: Separate interface from implementation
2. **`.toLayer()`**: Convert handlers to context
3. **Context Manipulation**: Build contexts programmatically
4. **Unsafe Operations**: Encapsulate in safe APIs

### Finalization

1. **V3**: Basic finalization, some primitives don't keep process alive
2. **V4**: Deferred/Queue await keeps process alive
3. **Testing**: Add finalizer with log
4. **Cloudflare**: Use `waitUntil` for background work

---

## Practical Checklists

### Building Spec-Based Library

- [ ] Define spec structure (interface only)
- [ ] Create `.toLayer()` method
- [ ] Build context from handlers
- [ ] Implement handler lookup
- [ ] Test with multiple implementations
- [ ] Document handler requirements
- [ ] Add type tests

### Implementing Tracing

- [ ] Wrap operations in `Effect.withSpan`
- [ ] Add meaningful span names
- [ ] Include relevant attributes
- [ ] Test forked fiber tracing
- [ ] Use `Effect.withParentSpan` if needed
- [ ] Configure exporter (Jaeger/Honeycomb)
- [ ] Verify spans in UI

### Cloudflare Workers

- [ ] Test finalization runs (add log)
- [ ] Use `waitUntil` for background work
- [ ] Consider `Effect.never` for streams
- [ ] Create managed runtime for pooling
- [ ] Handle cleanup on shutdown
- [ ] Monitor worker execution time

---

## Resources & Next Steps

### Official Documentation
- Effect.io: https://effect.website
- Platform: https://effect.website/docs/platform
- Tracing: https://effect.website/docs/observability/tracing
- Atom: https://effect.website/docs/experimental/atom

### Community
- Discord: https://discord.gg/effect-ts
- Office Hours: Weekly (submit questions in Discord)
- Examples: https://github.com/Effect-TS/examples

### Advanced Topics for Future Sessions
- Layer visualization and debugging
- Custom RPC implementation
- Building platform abstractions
- Tracing across distributed systems
- Advanced Atom patterns (derived state, subscriptions)

---

*This reference captures Effect Office Hours #4's deep technical discussions on reactive state, trait system, tracing, platform abstractions, and advanced layer composition patterns for library authors.*
