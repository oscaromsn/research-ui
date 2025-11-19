---
modified: 2025-11-03T03:39:23-03:00
---
# Effect Workshop 2 - Services Architecture
## Service-Oriented Design & Dependency Injection (Effect Days 2025 Workshop)

**Source**: Effect Days 2025 Workshop - Part 1
**Instructor**: Max (with Tim for afternoon sessions)
**Focus**: Building production applications around Effect services
**Core Theme**: Service-oriented application design with Effect

---

## Table of Contents

1. [Service-Oriented Design Philosophy](#service-oriented-design-philosophy)
2. [Services: Core Concepts](#services-core-concepts)
3. [Tags & Context: The Foundation](#tags--context-the-foundation)
4. [Creating Services](#creating-services)
5. [Using Services in Programs](#using-services-in-programs)
6. [Providing Services: Basic Methods](#providing-services-basic-methods)
7. [Service Dependencies](#service-dependencies)
8. [Layers: Service Constructors](#layers-service-constructors)
9. [Scope & Resource Management](#scope--resource-management)
10. [Layer Composition Patterns](#layer-composition-patterns)
11. [Advanced Patterns & Best Practices](#advanced-patterns--best-practices)

---

## Service-Oriented Design Philosophy

### What is Service-Oriented Design?

**Core Principle**: Separate the **usage** of functionality from its **implementation**

> "Code against an interface, not a concrete implementation"

### Benefits of Service-Oriented Architecture

#### 1. **Prototyping Flexibility**
- Design interfaces before implementation
- Start using services in business logic immediately
- Worry about implementation details later
- Iterate on designs without breaking consumers

#### 2. **Testing & Testability**
- Swap implementations easily (prod vs test vs mock)
- No hard-coded dependencies
- Isolated unit testing
- Mock services without complex tooling

#### 3. **Composability & Modularity**
- Package business logic into discrete units
- Clear dependency graphs
- Services compose naturally
- Reusable components

#### 4. **Refactoring Safety**
- Change internal implementation freely
- External interface remains stable
- Type-safe refactoring
- Compiler catches breaking changes

#### 5. **Dependency Injection**
- No global state
- No singleton pattern issues
- Dependencies explicit in types
- Runtime configuration flexibility

### When to Use Service-Oriented Design

✅ **Use Services For:**
- External integrations (databases, APIs, file systems)
- Configuration management
- Cross-cutting concerns (logging, metrics, tracing)
- Stateful resources (connection pools, caches)
- Business logic domains (user management, orders, payments)
- Platform abstractions (allowing multiple runtimes)

❌ **Don't Use Services For:**
- Pure functions (just export them)
- Simple utilities (use plain functions)
- One-off operations (inline in your Effect)
- Performance-critical hot paths (minimize abstraction overhead)

---

## Services: Core Concepts

### The Three Building Blocks

Effect's service system has three fundamental concepts that work together:

#### 1. **Service** (Interface)
An interface describing operations and/or values

```typescript
// Service interface - describes WHAT we can do
interface Cache {
  readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>;
  readonly store: (key: string, value: string) => Effect.Effect<void>;
}
```

**Purpose**: Define the contract without implementation

#### 2. **Tag** (Identifier)
A unique type-level AND runtime identifier for a service

```typescript
// Tag - binds interface to implementation
class Cache extends Context.Tag("app/Cache")<
  Cache,
  CacheInterface
>() {}
```

**Purpose**:
- Type-level: Distinguish services at compile time
- Runtime: Lookup services in Context
- Bridge between interface and implementation

#### 3. **Context** (Container)
A map-like container holding tag → service mappings

```typescript
// Conceptually: Map<Tag, Implementation>
// Example:
{
  [CacheTag]: CacheImplementation,
  [DatabaseTag]: DatabaseImplementation,
  [LoggerTag]: LoggerImplementation
}
```

**Purpose**: Runtime container for all provided services

### How They Work Together

```typescript
// 1. Define service interface
interface Database {
  query: (sql: string) => Effect.Effect<Row[]>;
}

// 2. Create tag
class Database extends Context.Tag("app/Database")<
  Database,
  DatabaseInterface
>() {}

// 3. Use in program (adds to requirements)
const program = Effect.gen(function* () {
  const db = yield* Database; // Access via tag
  return yield* db.query("SELECT * FROM users");
});
// Type: Effect<Row[], never, Database>
//                           ^^^^^^^^ requirement

// 4. Provide implementation (satisfies requirement)
const runnable = program.pipe(
  Effect.provide(DatabaseLive) // Context created here
);
// Type: Effect<Row[], never, never>
//                           ^^^^^ satisfied
```

---

## Tags & Context: The Foundation

### Creating Tags: The Wrong Way (Generic Tag)

**⚠️ NOT RECOMMENDED** - Too verbose, error-prone

```typescript
// DON'T: Use Context.GenericTag
interface CacheId {
  readonly CacheId: unique symbol;
}

class CacheMissError extends Data.TaggedError("CacheMissError")<{
  readonly key: string;
}> {}

interface Cache extends CacheId {
  readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>;
}

const Cache = Context.GenericTag<Cache, Cache>("app/Cache");
```

**Problems**:
1. Must manually ensure type uniqueness (unique symbol)
2. Verbose and repetitive
3. Easy to mess up
4. Service identifier separate from interface

**When to Use**: Only for dynamic service creation (rare)

### Creating Tags: The Right Way (Context.Tag)

**✅ RECOMMENDED** - Concise, type-safe

```typescript
class CacheMissError extends Data.TaggedError("CacheMissError")<{
  readonly key: string;
}> {}

class Cache extends Context.Tag("app/Cache")<
  Cache,
  {
    readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>;
    readonly store: (key: string, value: string) => Effect.Effect<void>;
  }
>() {}
```

**Structure Breakdown**:

```typescript
class ServiceName extends Context.Tag(
  "unique-string-id"  // Runtime identifier
)<
  ServiceName,        // Self type (required for TypeScript)
  ServiceInterface    // Shape of the service
>() {}
```

**Benefits**:
1. Everything in one place
2. Type automatically unique (class name)
3. Runtime ID explicitly specified
4. Inline interface definition
5. Static methods can be added to tag

### String ID Best Practices

The string identifier must be unique across your application:

```typescript
// ❌ BAD: Generic names risk collisions
class Cache extends Context.Tag("Cache")<...>() {}

// ✅ GOOD: Namespaced with package/path
class Cache extends Context.Tag("app/Cache")<...>() {}

// ✅ BETTER: Full path ensures uniqueness
class Cache extends Context.Tag("@myapp/services/Cache")<...>() {}

// ✅ BEST PRACTICE: Use file path
class Cache extends Context.Tag("src/services/cache/Cache")<...>() {}
```

**Recommended Convention**: `package-name/path/to/file/ServiceName`

**Why It Matters**:
- Duplicate IDs cause indeterminate behavior
- Innermost service "wins" in conflicts
- Type safety lost with collisions
- Debugging nightmare with generic names

### Tagged Errors Pattern

Effect convention for domain errors:

```typescript
// Tagged error - has _tag property for discrimination
class CacheMissError extends Data.TaggedError("CacheMissError")<{
  readonly key: string;
}> {}

class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly statusCode: number;
}> {}

// Use in service
class Cache extends Context.Tag("app/Cache")<
  Cache,
  {
    lookup: (key: string) => Effect.Effect<
      string,
      CacheMissError | NetworkError  // Tagged union
    >;
  }
>() {}

// Pattern match on _tag
cache.lookup("key").pipe(
  Effect.catchTag("CacheMissError", (err) => {
    // TypeScript knows err.key exists
    console.log(`Cache miss for: ${err.key}`);
    return Effect.succeed("default");
  })
);
```

### Context Under the Hood

Context is Effect's runtime container for services:

```typescript
// Simplified conceptual model
type Context = Map<Tag, ServiceImplementation>;

// When you yield a tag
const db = yield* Database;

// Effect does (conceptually):
const db = context.get(DatabaseTag);

// When you provide a service
Effect.provideService(Database, implementation);

// Effect does (conceptually):
context.set(DatabaseTag, implementation);
```

**Key Properties**:
1. One Context per Effect execution
2. Immutable - modifications create new Context
3. Type-safe lookups
4. Fast access (optimized Map implementation)
5. Scope-aware (for resource management)

---

## Creating Services

### Service Shape Patterns

#### Pure Value Service

```typescript
class Config extends Context.Tag("app/Config")<
  Config,
  {
    readonly apiUrl: string;
    readonly timeout: number;
    readonly retries: number;
  }
>() {}

// Usage
const program = Effect.gen(function* () {
  const config = yield* Config;
  console.log(config.apiUrl); // Just values
});
```

#### Operation Service

```typescript
class Logger extends Context.Tag("app/Logger")<
  Logger,
  {
    readonly info: (message: string) => Effect.Effect<void>;
    readonly error: (message: string, err: Error) => Effect.Effect<void>;
  }
>() {}

// Usage
const program = Effect.gen(function* () {
  const logger = yield* Logger;
  yield* logger.info("Starting application");
});
```

#### Mixed Service

```typescript
class HttpClient extends Context.Tag("app/HttpClient")<
  HttpClient,
  {
    readonly baseUrl: string;  // Value
    readonly timeout: number;   // Value
    readonly get: (path: string) => Effect.Effect<Response, NetworkError>;  // Operation
    readonly post: (path: string, body: unknown) => Effect.Effect<Response, NetworkError>;
  }
>() {}
```

### The `.of()` Helper

Every tag has a static `.of()` method for creating implementations:

```typescript
class Cache extends Context.Tag("app/Cache")<
  Cache,
  {
    readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>;
  }
>() {}

// WITHOUT .of() - must type everything yourself
const cacheImpl: {
  readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>;
} = {
  lookup: (key) => Effect.succeed("value")
};

// WITH .of() - types inferred, autocomplete works
const cacheImpl = Cache.of({
  lookup: (key) => Effect.succeed("value")
  // IDE shows what methods are required
  // TypeScript validates signature matches
});
```

**Benefits**:
- Type inference
- IDE autocomplete
- Type validation
- Less boilerplate
- Refactoring safety

### Real-World Example: The Punishment Protocol

Workshop example: A "behavioral management system" using puns

```typescript
// Domain errors
class ChildImmuneError extends Data.TaggedError("ChildImmuneError")<{
  readonly childName: string;
  readonly tokensRemaining: number;
}> {}

class MalformedPunError extends Data.TaggedError("MalformedPunError")<{
  readonly reason: string;
}> {}

class FailedToFetchError extends Data.TaggedError("FailedToFetchError")<{
  readonly message: string;
}> {}

// Service 1: Punster Client (API integration)
class PunsterClient extends Context.Tag("app/PunsterClient")<
  PunsterClient,
  {
    readonly createPun: (
      misbehavior: Misbehavior
    ) => Effect.Effect<
      Pun,
      ChildImmuneError | MalformedPunError | FailedToFetchError
    >;
    
    readonly evaluatePun: (
      misbehavior: Misbehavior,
      channel: DeliveryChannel
    ) => Effect.Effect<string>;
  }
>() {}

// Service 2: Pun Distribution Network
class PunDistributionNetwork extends Context.Tag("app/PunDistributionNetwork")<
  PunDistributionNetwork,
  {
    readonly getChannel: (
      misbehavior: Misbehavior
    ) => Effect.Effect<DeliveryChannel, NoChannelAvailableError>;
    
    readonly deliverPun: (
      pun: Pun,
      misbehavior: Misbehavior,
      channel: DeliveryChannel
    ) => Effect.Effect<void>;
  }
>() {}

// Service 3: Immunity Token Manager
class ImmunityTokenManager extends Context.Tag("app/ImmunityTokenManager")<
  ImmunityTokenManager,
  {
    readonly getBalance: (childName: string) => Effect.Effect<number>;
    readonly awardTokens: (childName: string, count: number) => Effect.Effect<void>;
    readonly useTokens: (childName: string, count: number) => Effect.Effect<void>;
  }
>() {}
```

**Dependency Graph**:

```
PunDistributionNetwork → PunsterClient
ImmunityTokenManager → PunsterClient
```

---

## Using Services in Programs

### Accessing Services: Two Methods

#### Method 1: Direct Piping (Less Common)

```typescript
const program = Cache.pipe(
  Effect.andThen(cache => cache.lookup("my-key")),
  Effect.tap(value => Console.log(value))
);
// Type: Effect<string, CacheMissError, Cache>
```

#### Method 2: Generator Syntax (Preferred)

```typescript
const program = Effect.gen(function* () {
  const cache = yield* Cache;
  const value = yield* cache.lookup("my-key");
  yield* Console.log(value);
  return value;
});
// Type: Effect<string, CacheMissError, Cache>
```

**Why Generator Syntax is Preferred**:
- More readable
- Looks imperative
- Easier to debug
- Can use control flow (if, for, etc.)
- Industry standard in Effect code

### Requirements Tracking

Effect automatically tracks service requirements in types:

```typescript
// No services used
const simple = Effect.succeed(42);
// Type: Effect<number, never, never>

// Uses Cache
const withCache = Effect.gen(function* () {
  const cache = yield* Cache;
  return yield* cache.lookup("key");
});
// Type: Effect<string, CacheMissError, Cache>
//                                      ^^^^^

// Uses multiple services
const complex = Effect.gen(function* () {
  const db = yield* Database;
  const cache = yield* Cache;
  const logger = yield* Logger;
  
  yield* logger.info("Fetching user");
  const user = yield* db.query("SELECT * FROM users");
  yield* cache.store("user", JSON.stringify(user));
  
  return user;
});
// Type: Effect<User, DbError | CacheMissError, Database | Cache | Logger>
//                                               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

### Type Evolution Example

```typescript
const step1 = Effect.succeed(10);
// Effect<number, never, never>

const step2 = step1.pipe(
  Effect.tap(() => Cache.pipe(Effect.map(c => c.lookup("key"))))
);
// Effect<number, CacheMissError, Cache>
//                ^^^^^^^^^^^^^^  ^^^^^ requirement added

const step3 = step2.pipe(
  Effect.flatMap(n => {
    return Effect.gen(function* () {
      const db = yield* Database;
      return yield* db.query(`SELECT * FROM items LIMIT ${n}`);
    });
  })
);
// Effect<Row[], CacheMissError | DbError, Cache | Database>
//               ^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^
//               Errors merged               Requirements merged

const step4 = step3.pipe(
  Effect.catchAll(() => Effect.succeed([]))
);
// Effect<Row[], never, Cache | Database>
//               ^^^^^  Errors handled
```

### Prototyping Without Implementation

**Key Insight**: You can write complete business logic before any service implementation exists

```typescript
// 1. Define services (interfaces only)
class UserRepo extends Context.Tag("app/UserRepo")<
  UserRepo,
  {
    getUser: (id: string) => Effect.Effect<User, NotFoundError>;
    saveUser: (user: User) => Effect.Effect<void>;
  }
>() {}

class EmailService extends Context.Tag("app/EmailService")<
  EmailService,
  {
    send: (to: string, subject: string, body: string) => Effect.Effect<void>;
  }
>() {}

// 2. Write business logic (no implementations yet!)
const registerUser = (email: string, name: string) =>
  Effect.gen(function* () {
    const userRepo = yield* UserRepo;
    const emailService = yield* EmailService;
    
    const user = { id: generateId(), email, name };
    
    yield* userRepo.saveUser(user);
    yield* emailService.send(
      email,
      "Welcome!",
      `Hello ${name}, welcome to our service`
    );
    
    return user;
  });

// 3. Type checking works!
// Effect<User, never, UserRepo | EmailService>

// 4. Can't run yet (no implementations), but business logic is complete
// registerUser("test@test.com", "Test User");
// TypeScript error: Requirements not satisfied
```

### Real Example: Punishment Protocol Main

```typescript
const misbehaviors: Misbehavior[] = [
  {
    childName: "Michael",
    category: "Technology",
    description: "Dissed my NeoVIM configuration",
    severity: 5
  },
  {
    childName: "Sebastian", 
    category: "Time Management",
    description: "Spent way too long on the crown module",
    severity: 2
  },
  {
    childName: "Johannes",
    category: "Design",
    description: "Gratuitous use of red arrows",
    severity: 3
  }
];

const main = Effect.gen(function* () {
  const punster = yield* PunsterClient;
  const network = yield* PunDistributionNetwork;
  
  for (const misbehavior of misbehaviors) {
    // Get optimal delivery channel
    const channel = yield* network.getChannel(misbehavior);
    
    // Create and deliver pun
    yield* punster.createPun(misbehavior).pipe(
      Effect.andThen(pun => network.deliverPun(pun, misbehavior, channel)),
      Effect.andThen(() => punster.evaluatePun(misbehavior, channel)),
      Effect.tap(report => Console.log(report)),
      
      // Handle errors inline to continue loop
      Effect.catchTag("ChildImmuneError", (err) =>
        Console.warn(`${err.childName} is immune!`)
      ),
      Effect.catchTag("FailedToFetchError", (err) =>
        Console.error(`Failed to fetch pun: ${err.message}`)
      )
    );
  }
});
// Type: Effect<void, MalformedPunError | NoChannelAvailableError, 
//              PunsterClient | PunDistributionNetwork>

// Still can't run - needs implementations!
```

---

## Providing Services: Basic Methods

### Effect.provideService - Direct Implementation

**Purpose**: Provide a concrete service implementation

```typescript
class Cache extends Context.Tag("app/Cache")<
  Cache,
  {
    lookup: (key: string) => Effect.Effect<string, CacheMissError>;
  }
>() {}

const program = Effect.gen(function* () {
  const cache = yield* Cache;
  return yield* cache.lookup("my-key");
});
// Type: Effect<string, CacheMissError, Cache>

const runnable = program.pipe(
  Effect.provideService(
    Cache,
    Cache.of({
      lookup: (key) => Effect.succeed(`value-for-${key}`)
    })
  )
);
// Type: Effect<string, CacheMissError, never>
//                                      ^^^^^ Cache requirement satisfied
```

**When to Use**:
- Providing concrete implementations
- Local overrides in specific parts of program
- Simple services with no dependencies
- Testing with mocks

### Effect.provideServiceEffect - Effectful Construction

**Purpose**: Provide a service that requires Effects to build

```typescript
const makeCache = Effect.gen(function* () {
  // Maybe read config, set up connections, etc.
  const config = yield* Config;
  
  yield* Console.log("Initializing cache...");
  
  return Cache.of({
    lookup: (key) => Effect.succeed(`cached-${key}`)
  });
});
// Type: Effect<CacheImpl, never, Config>

const runnable = program.pipe(
  Effect.provideServiceEffect(Cache, makeCache)
);
// Type: Effect<string, CacheMissError, Config>
//                                      ^^^^^^
// Cache satisfied, but makeCache requires Config!
```

**Key Behavior**: Requirements of constructor effect lifted into result

### Local vs Global Provision

#### Global Provision (Same Implementation Everywhere)

```typescript
const inMemoryCache = Cache.of({
  lookup: (key) => Effect.succeed(`memory-${key}`)
});

const program = Effect.gen(function* () {
  yield* subProgram1();  // Uses inMemoryCache
  yield* subProgram2();  // Uses inMemoryCache
});

const runnable = program.pipe(
  Effect.provideService(Cache, inMemoryCache)
);
```

#### Local Provision (Different Implementations)

```typescript
const inMemoryCache = Cache.of({
  lookup: (key) => Effect.succeed(`memory-${key}`)
});

const fileSystemCache = Cache.of({
  lookup: (key) => 
    Effect.tryPromise({
      try: () => fs.readFile(`cache/${key}`, "utf-8"),
      catch: () => new CacheMissError({ key })
    })
});

const program = Effect.gen(function* () {
  // subProgram1 gets inMemoryCache
  yield* subProgram1().pipe(
    Effect.provideService(Cache, inMemoryCache)
  );
  
  // subProgram2 gets fileSystemCache
  yield* subProgram2().pipe(
    Effect.provideService(Cache, fileSystemCache)
  );
});
```

**Use Case**: Hot path optimization, A/B testing, multi-tenant systems

### Provision Order Matters (Sometimes)

```typescript
// Scenario: Overriding default services
const program = Effect.gen(function* () {
  const clock = yield* Clock;
  return yield* clock.currentTimeMillis;
});

// ❌ WRONG: Custom clock overridden by other services
const wrong = program.pipe(
  Effect.provideService(Clock, customClock),  // Custom clock
  Effect.provide(otherServicesLayer),         // May include default Clock!
  // customClock lost - otherServicesLayer's Clock wins
);

// ✅ CORRECT: Custom clock applied last
const correct = program.pipe(
  Effect.provide(otherServicesLayer),
  Effect.provideService(Clock, customClock)  // Overrides any previous Clock
);
```

**Rule**: Later provisions override earlier ones for the same service

---

## Service Dependencies

### The Problem: Hard-Coded Dependencies

```typescript
// ❌ BAD: Hard-coded to Node.js
import * as fs from "fs";

class Cache extends Context.Tag("app/Cache")<
  Cache,
  {
    lookup: (key: string) => Effect.Effect<string, CacheMissError>;
  }
>() {}

const CacheLive = Cache.of({
  lookup: (key) =>
    Effect.tryPromise({
      try: () => fs.readFile(`cache/${key}`, "utf-8"),
      //         ^^ Hard-coded Node.js dependency!
      catch: () => new CacheMissError({ key })
    })
});
```

**Problems**:
1. ❌ Won't work in browser
2. ❌ Won't work with Bun, Deno
3. ❌ Hard to test (can't mock fs)
4. ❌ Hard to swap implementations

### The Solution: Service Dependencies

**Step 1**: Abstract dependency into a service

```typescript
class FileReadError extends Data.TaggedError("FileReadError")<{
  readonly message: string;
}> {}

class FileSystem extends Context.Tag("app/FileSystem")<
  FileSystem,
  {
    readonly readFileString: (
      path: string
    ) => Effect.Effect<string, FileReadError>;
  }
>() {}
```

**Step 2**: Use service in implementation (WRONG - leaks dependency)

```typescript
// ❌ PROBLEM: FileSystem leaked into Cache interface!
class Cache extends Context.Tag("app/Cache")<
  Cache,
  {
    lookup: (key: string) => Effect.Effect<
      string,
      CacheMissError,
      FileSystem  // ← FileSystem leaked!
    >;
  }
>() {}

const CacheLive = Cache.of({
  lookup: (key) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem;  // Accesses FileSystem
      const content = yield* fs.readFileString(`cache/${key}`);
      return content;
    }).pipe(
      Effect.catchAll(() => Effect.fail(new CacheMissError({ key })))
    )
});

// PROBLEM: Now all users of Cache must provide FileSystem!
const program = Effect.gen(function* () {
  const cache = yield* Cache;
  return yield* cache.lookup("key");
});
// Effect<string, CacheMissError, Cache | FileSystem>
//                                        ^^^^^^^^^^
// FileSystem required even if never used!
```

**Step 3**: Remove dependency from interface (CORRECT)

```typescript
// ✅ CORRECT: No requirements in interface
class Cache extends Context.Tag("app/Cache")<
  Cache,
  {
    lookup: (key: string) => Effect.Effect<string, CacheMissError>;
    //                                                      ^^^^^ No FileSystem!
  }
>() {}

// Constructor has FileSystem requirement
const makeCacheLive = Effect.gen(function* () {
  const fs = yield* FileSystem;  // Get FileSystem ONCE
  
  return Cache.of({
    // FileSystem captured in closure
    lookup: (key) =>
      fs.readFileString(`cache/${key}`).pipe(
        Effect.catchAll(() => Effect.fail(new CacheMissError({ key })))
      )
  });
});
// Type: Effect<CacheImpl, never, FileSystem>
//                                ^^^^^^^^^^
// FileSystem needed to BUILD cache, not USE it

// Now users don't need FileSystem
const program = Effect.gen(function* () {
  const cache = yield* Cache;
  return yield* cache.lookup("key");
});
// Effect<string, CacheMissError, Cache>
//                                ^^^^^
// Only Cache required!
```

### Service Construction Pattern

**Key Insight**: Services accessed in constructors, not in interface methods

```typescript
// Pattern: Service constructor with dependencies
const makeServiceLive = Effect.gen(function* () {
  // 1. Access all dependencies ONCE
  const dep1 = yield* Dependency1;
  const dep2 = yield* Dependency2;
  const dep3 = yield* Dependency3;
  
  // 2. Return service implementation
  return Service.of({
    // 3. Dependencies available in closure
    method1: (arg) => 
      Effect.gen(function* () {
        // Use dep1, dep2, dep3 freely
        yield* dep1.operation();
        return yield* dep2.transform(arg);
      }),
    
    method2: () => dep3.value  // Can access directly
  });
});
// Type: Effect<ServiceImpl, never, Dep1 | Dep2 | Dep3>
```

### Providing Dependent Services (Basic)

```typescript
// Service with FileSystem dependency
const makeCacheLive = Effect.gen(function* () {
  const fs = yield* FileSystem;
  return Cache.of({
    lookup: (key) => /* uses fs */
  });
});

// Program needs Cache
const program = Effect.gen(function* () {
  const cache = yield* Cache;
  return yield* cache.lookup("key");
});
// Effect<string, CacheMissError, Cache>

// Provide Cache (but it needs FileSystem!)
const step1 = program.pipe(
  Effect.provideServiceEffect(Cache, makeCacheLive)
);
// Effect<string, CacheMissError, FileSystem>
//                                ^^^^^^^^^^
// Cache satisfied, FileSystem required

// Provide FileSystem
const FileSystemLive = FileSystem.of({
  readFileString: (path) =>
    Effect.tryPromise({
      try: () => fs.readFile(path, "utf-8"),
      catch: (e) => new FileReadError({ message: String(e) })
    })
});

const runnable = step1.pipe(
  Effect.provideService(FileSystem, FileSystemLive)
);
// Effect<string, CacheMissError, never>
//                                ^^^^^
// All requirements satisfied!
```

### Complex Dependency Graphs

Real applications have many interconnected services:

```typescript
// Service graph:
//
//   UserRepo → Database → Config
//           └→ Logger
//
//   DocumentRepo → BlobStorage → Logger
//                              → Config
//               └→ Database → Config
//               └→ Logger

const setupServices = program.pipe(
  Effect.provideServiceEffect(UserRepo, makeUserRepoLive),
  // UserRepo satisfied, but needs Database, Logger
  
  Effect.provideServiceEffect(Database, makeDatabaseLive),
  // Database satisfied, but needs Config
  
  Effect.provideService(Logger, LoggerLive),
  // Logger satisfied
  
  Effect.provideService(Config, ConfigLive),
  // Config satisfied
  
  Effect.provideServiceEffect(DocumentRepo, makeDocumentRepoLive),
  // DocumentRepo satisfied, needs BlobStorage, Database, Logger
  
  Effect.provideServiceEffect(BlobStorage, makeBlobStorageLive),
  // BlobStorage satisfied, needs Logger, Config (already provided)
);
```

**Problems with This Approach**:
1. 😫 Order matters - must provide in correct sequence
2. 😫 Hard to track what's provided
3. 😫 No memoization - services rebuilt multiple times
4. 😫 No resource safety - services not cleaned up properly
5. 😫 Verbose and error-prone

**Solution**: Use Layers (next section)

---

## Layers: Service Constructors

### The Problem Layers Solve

**Services need**:
1. Multiple dependencies
2. Correct build order
3. Resource acquisition/release
4. Memoization (build once, use many times)
5. Composability
6. Type safety

**provideService doesn't handle** these well at scale

### What is a Layer?

> A Layer is a constructor for one or more services

**Layer Type**: `Layer<RequirementsOut, Error, RequirementsIn>`

```typescript
Layer<ROut, E, RIn>
```

**Type Parameters**:
1. **ROut** (Requirements Out): Services this layer produces
2. **E** (Error): Errors that can occur during construction
3. **RIn** (Requirements In): Dependencies needed to build

**Conceptual Analogy**:

```
Layer = Effect that produces Context
Effect<Context<ROut>, E, RIn>
```

### Creating Layers: Core Constructors

#### Layer.succeed - Pure Value

```typescript
class Config extends Context.Tag("app/Config")<
  Config,
  { apiUrl: string; timeout: number }
>() {}

const ConfigLive = Layer.succeed(
  Config,
  Config.of({
    apiUrl: "https://api.example.com",
    timeout: 5000
  })
);
// Type: Layer<Config, never, never>
//            ^^^^^^  ^^^^^ ^^^^^
//            Produces      No dependencies
```

#### Layer.sync - Synchronous Construction

```typescript
const ConfigLive = Layer.sync(Config, () => {
  console.log("Building config...");
  return Config.of({
    apiUrl: process.env.API_URL!,
    timeout: 5000
  });
});
// Type: Layer<Config, never, never>
```

#### Layer.effect - Async/Effectful Construction

```typescript
const CacheLive = Layer.effect(
  Cache,
  Effect.gen(function* () {
    const fs = yield* FileSystem;
    
    yield* Console.log("Setting up cache...");
    
    return Cache.of({
      lookup: (key) =>
        fs.readFileString(`cache/${key}`).pipe(
          Effect.catchAll(() => Effect.fail(new CacheMissError({ key })))
        )
    });
  })
);
// Type: Layer<Cache, never, FileSystem>
//            ^^^^^         ^^^^^^^^^^
//            Produces      Requires
```

#### Layer.scoped - Resourceful Construction

```typescript
const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const config = yield* Config;
    
    // Acquire connection
    const connection = yield* Effect.acquireRelease(
      Effect.tryPromise(() => createConnection(config.connectionString)),
      (conn) => Effect.sync(() => conn.close())
    );
    
    return Database.of({
      query: (sql) => Effect.tryPromise(() => connection.query(sql))
    });
  })
);
// Type: Layer<Database, never, Config>

// When layer is provided:
// 1. Connection opened
// 2. Database service created
// 3. When program exits → connection closed
```

### Layer Type Evolution

```typescript
const ConfigLive = Layer.succeed(Config, configValue);
// Layer<Config, never, never>

const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config;
    return makeDatabaseImpl(config);
  })
);
// Layer<Database, never, Config>
//       ^^^^^^^^        ^^^^^^
//       Produces        Requires

const AppLive = DatabaseLive.pipe(
  Layer.provide(ConfigLive)
);
// Layer<Database, never, never>
//       ^^^^^^^^        ^^^^^
//       Produces        Config satisfied!
```

### Using Layers with Effect.provide

```typescript
const program = Effect.gen(function* () {
  const db = yield* Database;
  return yield* db.query("SELECT 1");
});
// Effect<Result, never, Database>

// Provide layer to satisfy requirement
const runnable = program.pipe(
  Effect.provide(AppLive)
);
// Effect<Result, never, never>
```

**What Effect.provide Does**:
1. Creates a Scope
2. Builds the layer (traversing dependency graph)
3. Extracts Context from built layer
4. Provides Context to program
5. Runs program
6. Closes Scope (cleaning up resources)

---

## Scope & Resource Management

### What is a Scope?

**Simple Definition**: A container for cleanup functions (finalizers)

```typescript
// Conceptual model
type Scope = {
  finalizers: Array<() => Effect.Effect<void>>;
  close: () => Effect.Effect<void>;
};
```

**How it works**:
1. Acquire resource → registers finalizer in scope
2. Use resource → scope stays open
3. Exit (success/error/interrupt) → scope closes, runs finalizers in REVERSE order

### Why Reverse Order?

**Dependencies**: Later resources may depend on earlier ones

```typescript
Effect.gen(function* () {
  // 1. Connect to database
  const db = yield* Effect.acquireRelease(
    connectDB(),
    (db) => db.disconnect()  // finalizer1
  );
  
  // 2. Start transaction (needs db)
  const tx = yield* Effect.acquireRelease(
    db.beginTransaction(),
    (tx) => tx.rollback()    // finalizer2
  );
  
  // 3. Lock table (needs tx)
  yield* Effect.acquireRelease(
    tx.lockTable("users"),
    () => tx.unlockTable("users")  // finalizer3
  );
  
  // On exit:
  // - finalizer3: unlock table
  // - finalizer2: rollback transaction
  // - finalizer1: disconnect database
  // CORRECT ORDER!
});
```

### Scope in Requirements

Resourceful operations add `Scope` to requirements:

```typescript
const acquire = Effect.acquireRelease(
  openFile("data.txt"),
  (file) => closeFile(file)
);
// Type: Effect<File, never, Scope>
//                           ^^^^^

const useFile = acquire.pipe(
  Effect.flatMap(file => readFile(file))
);
// Type: Effect<string, never, Scope>
//                              ^^^^^
```

### Effect.scoped - Create & Close Scope

```typescript
const program = Effect.gen(function* () {
  const file = yield* Effect.acquireRelease(
    openFile("data.txt"),
    (f) => closeFile(f)
  );
  
  return yield* readFile(file);
  // Scope closes here - closeFile runs
});
// Type: Effect<string, never, Scope>

const runnable = Effect.scoped(program);
// Type: Effect<string, never, never>
//                              ^^^^^
// Scope requirement satisfied
```

**What Effect.scoped does**:
1. Creates new Scope
2. Provides to program
3. Runs program
4. Closes Scope (runs finalizers)

### Scope Demonstration

```typescript
const demo = Effect.gen(function* () {
  console.log("Program start");
  
  yield* Effect.acquireRelease(
    Effect.sync(() => console.log("Acquire 1")),
    () => Effect.sync(() => console.log("Release 1"))
  );
  
  yield* Effect.acquireRelease(
    Effect.sync(() => console.log("Acquire 2")),
    () => Effect.sync(() => console.log("Release 2"))
  );
  
  yield* Effect.acquireRelease(
    Effect.sync(() => console.log("Acquire 3")),
    () => Effect.sync(() => console.log("Release 3"))
  );
  
  console.log("Program end");
});

Effect.runPromise(Effect.scoped(demo));

// Output:
// Program start
// Acquire 1
// Acquire 2
// Acquire 3
// Program end
// Release 3  ← LIFO order
// Release 2
// Release 1
```

### Scope & Layer.scoped

**Layer.scoped** automatically manages resources:

```typescript
const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    // Scope provided by Layer.scoped
    const connection = yield* Effect.acquireRelease(
      openConnection(),
      (conn) => conn.close()
    );
    
    return Database.of({
      query: (sql) => connection.execute(sql)
    });
  })
);

const program = Effect.gen(function* () {
  const db = yield* Database;
  yield* db.query("SELECT 1");
  // Connection still open
});

const app = program.pipe(
  Effect.provide(DatabaseLive)
);

Effect.runPromise(app);
// 1. DatabaseLive built → connection opened
// 2. Program runs
// 3. Program exits → connection closed (automatically)
```

### Resource Safety Guarantees

**Effect guarantees**:
1. ✅ Finalizers ALWAYS run (success, error, interruption)
2. ✅ Finalizers run in reverse order
3. ✅ Resources cleaned up even on crashes
4. ✅ Interruption-safe (fibers respect scope)

```typescript
const program = Effect.gen(function* () {
  const file = yield* Effect.acquireRelease(
    openFile("data.txt"),
    (f) => {
      console.log("Closing file");
      return closeFile(f);
    }
  );
  
  // Simulate crash
  throw new Error("BOOM!");
});

Effect.runPromise(Effect.scoped(program));
// Output: "Closing file"
// File STILL closed despite error!
```

---

## Layer Composition Patterns

### The Three Core Combinators

#### 1. Layer.merge - Combine Layers

**Purpose**: Merge two independent layers

```typescript
Layer.merge(layer1, layer2)

// Input:
// layer1: Layer<R1, E1, In1>
// layer2: Layer<R2, E2, In2>

// Output:
// Layer<R1 | R2, E1 | E2, In1 | In2>
```

**Use case**: Services with no dependency relationship

```typescript
const ConfigLive = Layer.succeed(Config, configValue);
// Layer<Config, never, never>

const LoggerLive = Layer.succeed(Logger, loggerValue);
// Layer<Logger, never, never>

const AppLive = Layer.merge(ConfigLive, LoggerLive);
// Layer<Config | Logger, never, never>
```

#### 2. Layer.provide - Satisfy Dependencies

**Purpose**: Provide dependencies TO a layer

```typescript
layer1.pipe(Layer.provide(layer2))

// Input:
// layer1: Layer<R1, E1, Req>
// layer2: Layer<Req, E2, In2>

// Output:
// Layer<R1, E1 | E2, In2>
//       ^^  ^^^^^^^^  ^^^
//       R1  Merged    Req eliminated
```

**Use case**: Layer has dependencies that another layer provides

```typescript
const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config;
    return makeDatabaseImpl(config);
  })
);
// Layer<Database, never, Config>

const ConfigLive = Layer.succeed(Config, configValue);
// Layer<Config, never, never>

const AppLive = DatabaseLive.pipe(
  Layer.provide(ConfigLive)
);
// Layer<Database, never, never>
//       ^^^^^^^^        ^^^^^
//       Database        Config satisfied
```

#### 3. Layer.provideMerge - Provide AND Merge

**Purpose**: Satisfy dependencies AND include them in output

```typescript
layer1.pipe(Layer.provideMerge(layer2))

// Input:
// layer1: Layer<R1, E1, Req>
// layer2: Layer<Req, E2, In2>

// Output:
// Layer<R1 | Req, E1 | E2, In2>
//       ^^^^^^^^  ^^^^^^^^  ^^^
//       Both!     Merged    Req eliminated from In
```

**Use case**: Want dependency in output too

```typescript
const UserRepoLive = Layer.effect(
  UserRepo,
  Effect.gen(function* () {
    const db = yield* Database;
    return makeUserRepoImpl(db);
  })
);
// Layer<UserRepo, never, Database>

const DatabaseLive = Layer.succeed(Database, dbValue);
// Layer<Database, never, never>

const AppLive = UserRepoLive.pipe(
  Layer.provideMerge(DatabaseLive)
);
// Layer<UserRepo | Database, never, never>
//       ^^^^^^^^^^^^^^^^^^^
//       Both UserRepo AND Database available
```

### Complex Composition Examples

#### Example 1: Linear Dependency Chain

```typescript
// Cache → FileSystem
// FileSystem has no dependencies

const FileSystemLive = Layer.succeed(FileSystem, fileSystemImpl);
// Layer<FileSystem, never, never>

const CacheLive = Layer.effect(
  Cache,
  Effect.gen(function* () {
    const fs = yield* FileSystem;
    return makeCacheImpl(fs);
  })
);
// Layer<Cache, never, FileSystem>

const AppLive = CacheLive.pipe(
  Layer.provide(FileSystemLive)
);
// Layer<Cache, never, never>
```

#### Example 2: Diamond Dependency

```typescript
// UserRepo → Database → Config
//        └→ Logger

const ConfigLive = Layer.succeed(Config, configValue);
// Layer<Config, never, never>

const DatabaseLive = Layer.effect(Database, /* needs Config */);
// Layer<Database, never, Config>

const LoggerLive = Layer.succeed(Logger, loggerValue);
// Layer<Logger, never, never>

const UserRepoLive = Layer.effect(UserRepo, /* needs Database, Logger */);
// Layer<UserRepo, never, Database | Logger>

// Composition
const AppLive = UserRepoLive.pipe(
  Layer.provide(DatabaseLive),  // Provides Database, needs Config
  Layer.provide(LoggerLive),    // Provides Logger
  Layer.provide(ConfigLive)     // Provides Config
);
// Layer<UserRepo, never, never>
```

#### Example 3: Shared Dependency

```typescript
// API → Auth → Config
//   └→ Cache → Config

const ConfigLive = Layer.succeed(Config, configValue);
// Layer<Config, never, never>

const AuthLive = Layer.effect(Auth, /* needs Config */);
// Layer<Auth, never, Config>

const CacheLive = Layer.effect(Cache, /* needs Config */);
// Layer<Cache, never, Config>

const ApiLive = Layer.effect(Api, /* needs Auth, Cache */);
// Layer<Api, never, Auth | Cache>

// IMPORTANT: Config memoized - built only once!
const AppLive = ApiLive.pipe(
  Layer.provide(AuthLive),   // needs Config
  Layer.provide(CacheLive),  // needs Config (reuses!)
  Layer.provide(ConfigLive)  // Config built once
);
// Layer<Api, never, never>
```

### Layer Composition Exercise Solutions

**Exercise 1**: Produce Config and Logger

```typescript
// Target: Layer<Config | Logger, ConfigError | LogError, never>

const solution = LoggingLive.pipe(
  Layer.provideMerge(ConfigLive)
);

// Why provideMerge?
// - LoggingLive produces Logger, needs Config
// - ConfigLive produces Config
// - provideMerge: Provides Config AND keeps it in output
```

**Exercise 2**: Produce Database

```typescript
// Target: Layer<Database, DatabaseError, never>

const solution = DatabaseLive.pipe(
  Layer.provide(ConfigLive)
);

// Why provide (not provideMerge)?
// - Don't need Config in output
// - Just satisfy Database's Config requirement
```

**Exercise 3**: Complex Chain

```typescript
// Target: Layer<Cache, never, never>
// Cache → Database → Config

const solution = CacheLive.pipe(
  Layer.provide(DatabaseLive),
  Layer.provide(ConfigLive)
);

// Step by step:
// 1. CacheLive: Layer<Cache, never, Database>
// 2. .provide(DatabaseLive): Layer<Cache, never, Config>
// 3. .provide(ConfigLive): Layer<Cache, never, never>
```

**Exercise 7**: Multiple Dependencies

```typescript
// Target: Layer<Metrics | Notification, MetricsError | NotificationError, never>
// Both need Logger

const solution = Layer.merge(MetricsLive, NotificationLive).pipe(
  Layer.provide(LoggerLive)
);

// Why this works:
// 1. Merge both (both need Logger): Layer<M|N, E, Logger>
// 2. Provide Logger: Layer<M|N, E, never>
```

---

## Advanced Patterns & Best Practices

### Best Practice #1: Locally Erase Dependencies

**Principle**: Provide dependencies where services are defined

```typescript
// ❌ VERBOSE: Export layer with requirements
export const UserRepoLive = Layer.effect(
  UserRepo,
  Effect.gen(function* () {
    const db = yield* Database;
    const logger = yield* Logger;
    return makeUserRepoImpl(db, logger);
  })
);
// Layer<UserRepo, never, Database | Logger>
// Consumers must provide Database and Logger!

// ✅ CLEAN: Export layer with no requirements
const UserRepoLiveRaw = Layer.effect(
  UserRepo,
  Effect.gen(function* () {
    const db = yield* Database;
    const logger = yield* Logger;
    return makeUserRepoImpl(db, logger);
  })
);

export const UserRepoLive = UserRepoLiveRaw.pipe(
  Layer.provide(DatabaseLive),
  Layer.provide(LoggerLive)
);
// Layer<UserRepo, never, never>
// Consumers just get UserRepo!
```

**Benefits**:
1. Encapsulation - internal dependencies hidden
2. Easier consumption - no dependency tracking needed
3. Simpler main layer - just merge self-contained layers
4. Change internal deps without affecting consumers

**Main Layer Simplifies**:

```typescript
// With locally erased dependencies
const MainLive = Layer.merge(
  UserRepoLive,      // ← Self-contained
  OrderRepoLive,     // ← Self-contained
  PaymentServiceLive // ← Self-contained
);
// Just merge and done!

// Without local erasure
const MainLive = UserRepoLive.pipe(
  Layer.provide(DatabaseLive),
  Layer.provide(LoggerLive),
  Layer.provide(OrderRepoLive),
  Layer.provide(/* more deps */),
  Layer.provide(/* even more */),
  // ... complex dependency resolution
);
// Error-prone and hard to maintain
```

### Best Practice #2: One Layer Per Service (Usually)

```typescript
// ✅ GOOD: One service per layer
const UserRepoLive = Layer.effect(UserRepo, makeUserRepoImpl);
const OrderRepoLive = Layer.effect(OrderRepo, makeOrderRepoImpl);

// Compose as needed
const ReposLive = Layer.merge(UserRepoLive, OrderRepoLive);

// ❌ BAD: Multiple services in one layer
const ReposLive = Layer.effect(
  // Can't do this! Layer.effect takes ONE tag
);
```

**Exception**: Related services can be grouped

```typescript
// OK: Tightly coupled services
const CacheLive = Layer.effect(
  Cache,
  Effect.gen(function* () {
    return {
      cache: cacheImpl,
      stats: statsImpl  // Related functionality
    };
  })
);
```

### Best Practice #3: Provide Layers Once at Root

```typescript
// ❌ ANTI-PATTERN: Multiple Effect.provide calls
const program = myEffect.pipe(
  Effect.provide(CacheLive),    // Builds layer, creates scope
  Effect.provide(DatabaseLive), // Builds layer, creates scope
  Effect.provide(LoggerLive)    // Builds layer, creates scope
);

// Problems:
// 1. Each Effect.provide creates new scope
// 2. No memoization between provides
// 3. Services built multiple times
// 4. Resource leaks possible

// ✅ CORRECT: Compose layers, provide once
const MainLive = Layer.merge(CacheLive, DatabaseLive).pipe(
  Layer.provide(LoggerLive)
);

const program = myEffect.pipe(
  Effect.provide(MainLive)  // Single build, one scope
);
```

### Best Practice #4: Layer Naming Convention

```typescript
// Convention: ServiceNameLive
const DatabaseLive = Layer.effect(Database, makeDatabase);
const CacheLive = Layer.scoped(Cache, makeCache);
const ConfigLive = Layer.succeed(Config, configValue);

// Test layers: ServiceNameTest or ServiceNameMock
const DatabaseTest = Layer.succeed(Database, mockDatabase);
const CacheMemory = Layer.effect(Cache, makeInMemoryCache);
```

### Best Practice #5: Service Requirements = never (Usually)

```typescript
// ✅ GOOD: Interface has no requirements
class Cache extends Context.Tag("app/Cache")<
  Cache,
  {
    lookup: (key: string) => Effect.Effect<string, CacheMissError>;
    //                                                      ^^^^^ No requirements
  }
>() {}

// ❌ BAD: Interface has requirements
class Cache extends Context.Tag("app/Cache")<
  Cache,
  {
    lookup: (key: string) => Effect.Effect<string, CacheMissError, FileSystem>;
    //                                                              ^^^^^^^^^^
  }
>() {}

// Exception: Scoped operations
class Database extends Context.Tag("app/Database")<
  Database,
  {
    transaction: <A, E>(
      body: Effect.Effect<A, E, Database>
    ) => Effect.Effect<A, E, Scope>;
    //                          ^^^^^
    // Scope OK - indicates resource management
  }
>() {}
```

### Pattern: Testing with Mock Layers

```typescript
// Production layer
const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const conn = yield* acquireConnection();
    return Database.of({
      query: (sql) => conn.execute(sql)
    });
  })
);

// Test layer - in-memory
const DatabaseTest = Layer.sync(Database, () => {
  const data = new Map();
  
  return Database.of({
    query: (sql) => {
      // Parse SQL and return mock data
      return Effect.succeed(mockResults);
    }
  });
});

// Test
test("user repository", () => {
  const program = Effect.gen(function* () {
    const repo = yield* UserRepo;
    return yield* repo.getUser("123");
  });
  
  const result = await program.pipe(
    Effect.provide(UserRepoLive),
    Effect.provide(DatabaseTest),  // Mock database!
    Effect.runPromise
  );
  
  expect(result.id).toBe("123");
});
```

### Pattern: Environment-Based Configuration

```typescript
type Environment = "development" | "production" | "test";

const getDatabaseConfig = (env: Environment) => {
  switch (env) {
    case "development":
      return { host: "localhost", pool: 5 };
    case "production":
      return { host: "prod-db.example.com", pool: 50 };
    case "test":
      return { host: ":memory:", pool: 1 };
  }
};

const makeDatabaseLive = (env: Environment) =>
  Layer.scoped(
    Database,
    Effect.gen(function* () {
      const config = getDatabaseConfig(env);
      const conn = yield* acquireConnection(config);
      return Database.of({
        query: (sql) => conn.execute(sql)
      });
    })
  );

// Usage
const DevLive = makeDatabaseLive("development");
const ProdLive = makeDatabaseLive("production");
```

### Pattern: Lazy Service Initialization

```typescript
// Service initialized only when first accessed
const CacheLive = Layer.effect(
  Cache,
  Effect.gen(function* () {
    console.log("Initializing cache...");
    
    // Expensive initialization
    yield* Effect.sleep("5 seconds");
    
    return Cache.of({
      lookup: (key) => /* ... */
    });
  })
);

const program = Effect.gen(function* () {
  // Cache NOT initialized yet
  yield* doStuff();
  
  // Cache initialized HERE (first access)
  const cache = yield* Cache;
  yield* cache.lookup("key");
});
```

### Pattern: Service Composition in Layers

```typescript
// Low-level service
const HttpClientLive = Layer.effect(HttpClient, makeHttpClient);

// High-level service uses low-level
const ApiClientLive = Layer.effect(
  ApiClient,
  Effect.gen(function* () {
    const http = yield* HttpClient;
    
    return ApiClient.of({
      getUser: (id) =>
        http.get(`/users/${id}`).pipe(
          Effect.flatMap(res => res.json)
        )
    });
  })
);

// Compose
const AppLive = ApiClientLive.pipe(
  Layer.provide(HttpClientLive)
);
```

### What Happens During Layer Build

**Effect.provide(layer)** performs these steps:

```typescript
// Pseudocode for Effect.provide(layer)
function provideLayer<A, E, R, ROut, E2, RIn>(
  effect: Effect<A, E, R>,
  layer: Layer<ROut, E2, RIn>
): Effect<A, E | E2, Exclude<R, ROut> | RIn> {
  return Effect.gen(function* () {
    // 1. Access or create Scope
    const scope = yield* Scope.make();
    
    // 2. Create MemoMap for service deduplication
    const memoMap = new Map();
    
    // 3. Traverse layer dependency graph
    const context = yield* buildLayerGraph(layer, scope, memoMap);
    
    // 4. Provide Context to effect
    const result = yield* effect.pipe(
      Effect.provideContext(context)
    );
    
    // 5. Close scope (run finalizers)
    yield* Scope.close(scope);
    
    return result;
  });
}

function buildLayerGraph(layer, scope, memoMap) {
  // Depth-first traversal
  // 1. Check memoMap - service already built?
  // 2. If yes, return cached Context
  // 3. If no, build dependencies first (recursive)
  // 4. Build this layer
  // 5. Add to memoMap
  // 6. Return Context
}
```

**Key Points**:
1. **One Scope**: Shared by all layers in graph
2. **Memoization**: Each service built only once
3. **Correct Order**: Dependencies built first
4. **Resource Safety**: Scope cleanup automatic
5. **Multiple Effect.provide**: Creates multiple scopes (bad!)

### Effect.provide vs Layer.provide

```typescript
// Effect.provide: Provide layer TO an effect
const program = myEffect.pipe(
  Effect.provide(DatabaseLive)
);
// Builds layer, runs effect, cleans up

// Layer.provide: Provide layer TO a layer
const UserRepoLive = UserRepoRaw.pipe(
  Layer.provide(DatabaseLive)
);
// Composes layers, doesn't build yet
```

---

## Complete Example: Punishment Protocol

### Domain Models

```typescript
// Misbehavior categories
type MisbehaviorCategory = 
  | "Technology"
  | "Time Management"
  | "Design"
  | "Communication";

interface Misbehavior {
  readonly childName: string;
  readonly category: MisbehaviorCategory;
  readonly description: string;
  readonly severity: 1 | 2 | 3 | 4 | 5;  // 1=minor, 5=severe
}

// Delivery channels
type DeliveryChannel =
  | "Dinner Time"
  | "Homework Session"
  | "Car Ride"
  | "Bedtime";

interface Pun {
  readonly text: string;
  readonly setup: string;
  readonly punchline: string;
  readonly groanPotential: number;
}
```

### Service Definitions

```typescript
// Service 1: Punster Client (API integration)
class PunsterClient extends Context.Tag("app/PunsterClient")<
  PunsterClient,
  {
    readonly createPun: (
      misbehavior: Misbehavior
    ) => Effect.Effect<
      Pun,
      ChildImmuneError | MalformedPunError | FailedToFetchError
    >;
    
    readonly evaluatePun: (
      misbehavior: Misbehavior,
      channel: DeliveryChannel
    ) => Effect.Effect<string>;
  }
>() {}

// Service 2: Pun Distribution Network
class PunDistributionNetwork extends Context.Tag("app/PunDistributionNetwork")<
  PunDistributionNetwork,
  {
    readonly getChannel: (
      misbehavior: Misbehavior
    ) => Effect.Effect<DeliveryChannel, NoChannelAvailableError>;
    
    readonly deliverPun: (
      pun: Pun,
      misbehavior: Misbehavior,
      channel: DeliveryChannel
    ) => Effect.Effect<void>;
  }
>() {}

// Service 3: Immunity Token Manager
class ImmunityTokenManager extends Context.Tag("app/ImmunityTokenManager")<
  ImmunityTokenManager,
  {
    readonly getBalance: (childName: string) => Effect.Effect<number>;
    readonly awardTokens: (childName: string, count: number) => Effect.Effect<void>;
    readonly useTokens: (childName: string, count: number) => Effect.Effect<void>;
  }
>() {}
```

### Business Logic

```typescript
const misbehaviors: Misbehavior[] = [
  {
    childName: "Michael",
    category: "Technology",
    description: "Dissed my NeoVIM configuration",
    severity: 5  // Maximum punishment!
  },
  {
    childName: "Sebastian",
    category: "Time Management",
    description: "Spent way too long on the crown module",
    severity: 2  // It's kinda cool though
  },
  {
    childName: "Johannes",
    category: "Design",
    description: "Gratuitous use of red arrows",
    severity: 3
  }
];

const main = Effect.gen(function* () {
  const punster = yield* PunsterClient;
  const network = yield* PunDistributionNetwork;
  
  for (const misbehavior of misbehaviors) {
    // Get optimal delivery channel
    const channel = yield* network.getChannel(misbehavior);
    
    // Create and deliver pun, handle errors inline
    yield* punster.createPun(misbehavior).pipe(
      Effect.andThen(pun => 
        network.deliverPun(pun, misbehavior, channel)
      ),
      Effect.andThen(() => 
        punster.evaluatePun(misbehavior, channel)
      ),
      Effect.tap(report => Console.log(report)),
      
      // Error handling - continue loop even on error
      Effect.catchTag("ChildImmuneError", (err) =>
        Console.warn(
          `${err.childName} is immune (${err.tokensRemaining} tokens left)`
        )
      ),
      Effect.catchTag("FailedToFetchError", (err) =>
        Console.error(`Failed to fetch pun: ${err.message}`)
      )
    );
  }
});
```

### Layer Implementation

```typescript
// PunsterClient depends on HttpClient
const PunsterClientLive = Layer.effect(
  PunsterClient,
  Effect.gen(function* () {
    const http = yield* HttpClient;
    const tokenManager = yield* ImmunityTokenManager;
    
    return PunsterClient.of({
      createPun: (misbehavior) =>
        Effect.gen(function* () {
          // Check immunity
          const tokens = yield* tokenManager.getBalance(misbehavior.childName);
          if (tokens > 0) {
            yield* tokenManager.useTokens(misbehavior.childName, 1);
            return yield* Effect.fail(
              new ChildImmuneError({
                childName: misbehavior.childName,
                tokensRemaining: tokens - 1
              })
            );
          }
          
          // Fetch pun from API
          return yield* http.post("/api/pun", {
            category: misbehavior.category,
            severity: misbehavior.severity
          }).pipe(
            Effect.flatMap(res => res.json),
            Effect.catchAll(() => 
              Effect.fail(new FailedToFetchError({ message: "API error" }))
            )
          );
        }),
      
      evaluatePun: (misbehavior, channel) =>
        http.post("/api/evaluate", {
          misbehavior,
          channel
        }).pipe(
          Effect.flatMap(res => res.json)
        )
    });
  })
);

// Self-contained layer (dependencies erased)
const PunsterClientFinal = PunsterClientLive.pipe(
  Layer.provide(HttpClientLive),
  Layer.provide(ImmunityTokenManagerLive)
);

// PunDistributionNetwork depends on PunsterClient
const PunDistributionNetworkLive = Layer.effect(
  PunDistributionNetwork,
  Effect.gen(function* () {
    const punster = yield* PunsterClient;
    
    return PunDistributionNetwork.of({
      getChannel: (misbehavior) => {
        // Logic to select optimal channel based on severity
        if (misbehavior.severity >= 4) return Effect.succeed("Car Ride");
        if (misbehavior.severity >= 3) return Effect.succeed("Homework Session");
        return Effect.succeed("Dinner Time");
      },
      
      deliverPun: (pun, misbehavior, channel) =>
        Console.log(
          `Delivering pun to ${misbehavior.childName} during ${channel}`
        )
    });
  })
).pipe(
  Layer.provide(PunsterClientFinal)
);

// Main layer - just merge!
const MainLive = Layer.merge(
  PunsterClientFinal,
  PunDistributionNetworkLive
);

// Run application
const app = main.pipe(
  Effect.provide(MainLive)
);

Effect.runPromise(app);
```

### Example Output

```
Delivering pun to Michael during Homework Session
Maxwell spent hours perfecting his NeoVIM configuration, but Michael didn't 
appreciate it at all. Looks like Michael is taking configuration for granted!

Executive Summary: The pun delivered during the homework session was moderately 
effective with a score of 63/100 due to low receptivity and a coinciding cooldown 
period leading to a lackluster response.

Narrative: Maxwell, intent on sharing his passion for NeoVIM, attempted to lighten 
the mood during an otherwise dull homework session. He leaned in to deliver the pun. 
The atmosphere was tense with Michael frustrated by his assignments. The setup about 
Maxwell's hard work lingered for a moment. When he finally hit the punchline, the 
response was tepid...
```

---

## Summary: Key Takeaways

### Core Concepts

1. **Service**: Interface describing functionality (contract)
2. **Tag**: Unique identifier binding interface to implementation
3. **Context**: Runtime container mapping tags to implementations
4. **Layer**: Constructor for services with dependencies

### The Service Pattern

```typescript
// 1. Define interface & tag
class MyService extends Context.Tag("app/MyService")<
  MyService,
  ServiceInterface
>() {}

// 2. Use in business logic
const program = Effect.gen(function* () {
  const service = yield* MyService;
  return yield* service.operation();
});

// 3. Implement with layer
const MyServiceLive = Layer.effect(
  MyService,
  Effect.gen(function* () {
    const dep = yield* Dependency;
    return MyService.of({
      operation: () => /* ... */
    });
  })
);

// 4. Provide at root
const app = program.pipe(
  Effect.provide(MyServiceLive)
);
```

### Critical Best Practices

✅ **DO**:
- Use `Context.Tag` for service creation
- Keep service interfaces pure (no requirements in methods)
- Locally erase dependencies (provide deps in layer definition)
- Provide layers once at application root
- Use `Layer.effect` for most services
- Use `Layer.scoped` for resourceful services
- Follow naming convention: `ServiceNameLive`
- Test with mock layers

❌ **DON'T**:
- Use `Context.GenericTag` (unless dynamic services)
- Leak dependencies into service interfaces
- Call `Effect.provide` multiple times in sequence
- Use `provideService` for complex dependency graphs
- Hard-code dependencies (Node fs, etc.)
- Create global singletons

### Layer Composition Cheat Sheet

```typescript
// Merge: Combine independent layers
Layer.merge(layer1, layer2)
// Layer<R1 | R2, E1 | E2, In1 | In2>

// Provide: Satisfy dependencies
layer1.pipe(Layer.provide(layer2))
// Layer<R1, E1 | E2, In2>

// ProvideMerge: Satisfy AND keep in output
layer1.pipe(Layer.provideMerge(layer2))
// Layer<R1 | R2, E1 | E2, In2>
```

### When to Use What

**provideService**: Local overrides, concrete implementations, testing
**provideServiceEffect**: Effectful construction, simple services
**Layer**: Everything else (95% of cases)
**Layer.scoped**: Resources needing cleanup

### Mental Model

Think of services as **pure interfaces** and layers as **factories**:
- Interface = what the service CAN do
- Layer = how to BUILD the service
- Effect.provide = WIRE everything together and RUN

---

## Appendix: Common Patterns

### Pattern: Configuration Service

```typescript
class Config extends Context.Tag("app/Config")<
  Config,
  {
    readonly apiUrl: string;
    readonly dbUrl: string;
    readonly logLevel: "debug" | "info" | "warn" | "error";
  }
>() {}

const ConfigLive = Layer.sync(Config, () =>
  Config.of({
    apiUrl: process.env.API_URL!,
    dbUrl: process.env.DATABASE_URL!,
    logLevel: (process.env.LOG_LEVEL as any) || "info"
  })
);
```

### Pattern: Logger Service

```typescript
class Logger extends Context.Tag("app/Logger")<
  Logger,
  {
    readonly debug: (message: string) => Effect.Effect<void>;
    readonly info: (message: string) => Effect.Effect<void>;
    readonly warn: (message: string) => Effect.Effect<void>;
    readonly error: (message: string, err?: Error) => Effect.Effect<void>;
  }
>() {}

const LoggerLive = Layer.effect(
  Logger,
  Effect.gen(function* () {
    const config = yield* Config;
    
    const shouldLog = (level: string) => {
      const levels = ["debug", "info", "warn", "error"];
      return levels.indexOf(level) >= levels.indexOf(config.logLevel);
    };
    
    return Logger.of({
      debug: (msg) => Effect.when(
        Console.log(`[DEBUG] ${msg}`),
        () => shouldLog("debug")
      ),
      info: (msg) => Effect.when(
        Console.log(`[INFO] ${msg}`),
        () => shouldLog("info")
      ),
      warn: (msg) => Effect.when(
        Console.log(`[WARN] ${msg}`),
        () => shouldLog("warn")
      ),
      error: (msg, err) => Effect.when(
        Console.error(`[ERROR] ${msg}`, err),
        () => shouldLog("error")
      )
    });
  })
).pipe(
  Layer.provide(ConfigLive)
);
```

### Pattern: Database Service

```typescript
class Database extends Context.Tag("app/Database")<
  Database,
  {
    readonly query: <A>(
      sql: string,
      params?: unknown[]
    ) => Effect.Effect<A[], SqlError>;
    
    readonly execute: (
      sql: string,
      params?: unknown[]
    ) => Effect.Effect<void, SqlError>;
  }
>() {}

const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const config = yield* Config;
    
    // Acquire connection
    const pool = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: () => createPool(config.dbUrl),
        catch: (e) => new SqlError({ message: String(e) })
      }),
      (pool) => Effect.promise(() => pool.end())
    );
    
    return Database.of({
      query: (sql, params) =>
        Effect.tryPromise({
          try: () => pool.query(sql, params),
          catch: (e) => new SqlError({ message: String(e) })
        }),
      
      execute: (sql, params) =>
        Effect.tryPromise({
          try: async () => {
            await pool.query(sql, params);
          },
          catch: (e) => new SqlError({ message: String(e) })
        })
    });
  })
).pipe(
  Layer.provide(ConfigLive)
);
```

---

*This reference distills a comprehensive workshop on production-grade Effect applications using service-oriented design. For hands-on exercises and complete examples, refer to the workshop repository.*
