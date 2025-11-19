---
modified: 2025-11-02T15:38:02-03:00
---
# Effect Office Hours 1 Dependency Management & Service Layers
## Comprehensive Reference Guide

**Source**: Effect Office Hours #1 - Dependency Management, Service Layers
**Format**: Live Q&A, Code Review, Pattern Discussion
**Focus Areas**: Service Architecture, Layer Composition, Request-Level Dependencies

---

## Table of Contents

1. [Service-Level vs. Constructor-Level Dependencies](#service-level-vs-constructor-level-dependencies)
2. [Request-Level Dependencies Pattern](#request-level-dependencies-pattern)
3. [Layer Composition Deep Dive](#layer-composition-deep-dive)
4. [Layer Memoization & Deduplication](#layer-memoization--deduplication)
5. [Multi-Tenant Architecture Patterns](#multi-tenant-architecture-patterns)
6. [Transaction Management with Services](#transaction-management-with-services)
7. [String Identifiers: Why & How](#string-identifiers-why--how)
8. [Local vs. Root Dependency Provision](#local-vs-root-dependency-provision)
9. [Effect 4.0 Service Changes](#effect-40-service-changes)
10. [LSP Tooling for Layer Composition](#lsp-tooling-for-layer-composition)

---

## Service-Level vs. Constructor-Level Dependencies

### The Fundamental Question
**When should dependencies be provided at service construction time vs. method invocation time?**

### Constructor-Level Dependencies (Default Pattern)
Dependencies provided when the service is built (application startup).

**Use when:**
- Service dependency is application-scoped
- Same instance used across all requests
- Static configuration
- Singleton services (Logger, Database Pool, Config)

**Example**:

```typescript
class UserRepository extends Effect.Service<UserRepository>()("app/UserRepository", {
  dependencies: [Database.Default],
  effect: Effect.gen(function* () {
    // Database acquired HERE at app startup
    const db = yield* Database;
    
    return {
      getUser: (id: number): Effect.Effect<User, NotFoundError> =>
        db.query(`SELECT * FROM users WHERE id = ${id}`)
    };
  })
}) {}

// Database connection established ONCE
// Used for ALL user repository method calls
```

**Characteristics**:
- ✅ Efficient: Service built once
- ✅ Simple: Clear dependency graph
- ✅ Type-safe: Dependencies in Requirements channel
- ❌ Inflexible: Can't vary per request
- ❌ Not suitable for request context

### Service-Level Dependencies (Request Pattern)
Dependencies provided at method invocation time.

**Use when:**
- Dependency varies per request
- Request-scoped data (auth context, tenant ID)
- Transaction boundaries
- Different configurations per call

**Example**:

```typescript
class TaskService extends Effect.Service<TaskService>()("app/TaskService", {
  effect: Effect.gen(function* () {
    return {
      // DBConnection as method-level dependency
      createTask: (data: TaskData): Effect.Effect<Task, TaskError, DBConnection> =>
        Effect.gen(function* () {
          const db = yield* DBConnection;
          // db might be a transaction or regular connection
          return yield* db.insert("tasks", data);
        })
    };
  })
}) {}

// Usage with regular connection
const task1 = taskService.createTask(data1).pipe(
  Effect.provide(DBConnectionLive)
);

// Usage with transaction
const task2 = taskService.createTask(data2).pipe(
  Effect.provide(DBTransactionLive)
);
```

**Characteristics**:
- ✅ Flexible: Different dependencies per call
- ✅ Request-scoped: Supports transactions, tenants
- ✅ Explicit: Dependency requirements visible
- ⚠️ Warning: Language service plugin warns about this pattern
- ⚠️ Intentional: Disable warning when pattern is correct

### Hybrid Pattern: Best of Both Worlds

**Pattern**: Separate concerns into layers

```typescript
// Request Context Service
class RequestContext extends Context.Tag("RequestContext")<
  RequestContext,
  { tenantId: string; userId: string }
>() {}

// Database Service (constructor-level)
class Database extends Effect.Service<Database>()("app/Database", {
  dependencies: [Config.Default],
  effect: Effect.gen(function* () {
    const config = yield* Config;
    const pool = yield* Effect.acquireRelease(
      createPool(config.connectionString),
      (pool) => pool.close()
    );
    
    return {
      getTenantConnection: (tenantId: string) =>
        pool.getConnection({ schema: tenantId })
    };
  })
}) {}

// Task Service (method-level context)
class TaskService extends Effect.Service<TaskService>()("app/TaskService", {
  dependencies: [Database.Default],
  effect: Effect.gen(function* () {
    const db = yield* Database;
    
    return {
      createTask: (data: TaskData): Effect.Effect<Task, TaskError, RequestContext> =>
        Effect.gen(function* () {
          const ctx = yield* RequestContext;
          const conn = yield* db.getTenantConnection(ctx.tenantId);
          return yield* conn.insert("tasks", data);
        })
    };
  })
}) {}
```

**Benefits**:
- Database connection pooling at app level
- Tenant isolation at request level
- Type-safe context propagation
- Clear separation of concerns

---

## Request-Level Dependencies Pattern

### The Problem: Transaction Scope

**Scenario**: Creating a submission with multiple sub-resources in a single transaction.

```typescript
// Current pattern (helper functions with DB dependency)
const createSubmission = (data: SubmissionData) =>
  Effect.gen(function* () {
    const db = yield* DBConnection;
    
    // All operations share same DB context
    const task = yield* createTask(db, data.task);
    const submission = yield* createSubmissionRecord(db, {
      taskId: task.id,
      ...data.submission
    });
    const subTasks = yield* Effect.forEach(
      data.subTasks,
      (st) => createSubTask(db, submission.id, st)
    );
    
    return { task, submission, subTasks };
  });

// With transaction wrapper
const withTransaction = <A, E, R>(
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, Exclude<R, DBConnection>> =>
  Effect.gen(function* () {
    const db = yield* DBService;
    const txConn = yield* db.transaction();
    
    return yield* effect.pipe(
      Effect.provide(Layer.succeed(DBConnection, txConn))
    );
  });

// Usage
const program = createSubmission(data).pipe(
  withTransaction
);
```

### Pattern 1: DB Context Service

**Design**: Service provides connection based on context

```typescript
class DBContext extends Context.Tag("DBContext")<
  DBContext,
  { type: "regular" | "transaction"; connection: Connection }
>() {}

class DBService extends Effect.Service<DBService>()("app/DBService", {
  dependencies: [Config.Default],
  scoped: Effect.gen(function* () {
    const config = yield* Config;
    const pool = yield* Effect.acquireRelease(
      createPool(config),
      (p) => p.close()
    );
    
    return {
      // Returns layer providing DBContext
      withConnection: () =>
        Layer.scoped(
          DBContext,
          Effect.acquireRelease(
            Effect.sync(() => ({
              type: "regular" as const,
              connection: pool.getConnection()
            })),
            (ctx) => ctx.connection.release()
          )
        ),
      
      // Returns layer providing transaction DBContext
      withTransaction: () =>
        Layer.scoped(
          DBContext,
          Effect.acquireRelease(
            Effect.gen(function* () {
              const conn = pool.getConnection();
              yield* conn.query("BEGIN");
              return {
                type: "transaction" as const,
                connection: conn
              };
            }),
            (ctx) =>
              Effect.gen(function* () {
                if (ctx.type === "transaction") {
                  yield* ctx.connection.query("COMMIT");
                }
                yield* ctx.connection.release();
              }).pipe(
                Effect.catchAllDefect(() =>
                  ctx.connection.query("ROLLBACK").pipe(
                    Effect.flatMap(() => ctx.connection.release())
                  )
                )
              )
          )
        )
    };
  })
}) {}

// Task methods depend on DBContext
class TaskService extends Effect.Service<TaskService>()("app/TaskService", {
  effect: Effect.gen(function* () {
    return {
      createTask: (data: TaskData): Effect.Effect<Task, TaskError, DBContext> =>
        Effect.gen(function* () {
          const { connection } = yield* DBContext;
          return yield* connection.query("INSERT INTO tasks ...", data);
        })
    };
  })
}) {}

// Usage
const program = Effect.gen(function* () {
  const db = yield* DBService;
  const taskService = yield* TaskService;
  
  // Regular operation
  const task1 = yield* taskService.createTask(data1).pipe(
    Effect.provide(db.withConnection())
  );
  
  // Transactional operation
  const task2 = yield* taskService.createTask(data2).pipe(
    Effect.provide(db.withTransaction())
  );
});
```

### Pattern 2: Service Method Dependency

**Design**: Methods directly require DBConnection

```typescript
class TaskService extends Effect.Service<TaskService>()("app/TaskService", {
  effect: Effect.gen(function* () {
    return {
      // DBConnection in method signature
      createTask: (data: TaskData): Effect.Effect<Task, TaskError, DBConnection> =>
        Effect.gen(function* () {
          const db = yield* DBConnection;
          return yield* db.insert("tasks", data);
        }),
      
      createSubmission: (data: SubmissionData): Effect.Effect<Submission, TaskError, DBConnection> =>
        Effect.gen(function* () {
          const db = yield* DBConnection;
          
          const task = yield* this.createTask(data.task);
          const submission = yield* db.insert("submissions", {
            taskId: task.id,
            ...data.submission
          });
          
          return submission;
        })
    };
  })
}) {}

// Usage - same Effect, different DB contexts
const program = Effect.gen(function* () {
  const taskService = yield* TaskService;
  
  // Both use same createSubmission logic
  // Different DB contexts (regular vs transaction)
  
  const regular = yield* taskService.createSubmission(data1).pipe(
    Effect.provide(DBConnectionLive)
  );
  
  const transactional = yield* taskService.createSubmission(data2).pipe(
    Effect.provide(DBTransactionLive)
  );
});
```

**Key Insight**: Same business logic, different execution contexts!

---

## Layer Composition Deep Dive

### The Three Core Operators

#### Visual Notation
Layers represented as: `Input → Output`

```
database-layer:  ∅ → Database
user-layer:      Database → Users
calendar-layer:  Database → Calendar
event-layer:     Users + Calendar → Events
```

### 1. `Layer.provide` - Vertical Composition

**Signature**: `Layer<A, E, B> → Layer<B, E2, C> → Layer<A, E | E2, C>`

**Mental Model**: Function composition

```
// Abstract notation
A → B  provided to  B → C  =  A → C
```

**Concrete Example**:

```typescript
// Define layers
const DatabaseLayer = Layer.succeed(
  Database,
  { query: (sql) => Effect.succeed([]) }
);
// Type: Layer<Database, never, never>
//       ∅ → Database

const UserServiceLayer = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database;
    return UserService.of({
      getUser: (id) => db.query(`SELECT * FROM users WHERE id = ${id}`)
    });
  })
);
// Type: Layer<UserService, never, Database>
//       Database → UserService

// Compose vertically
const FulfilledUserLayer = UserServiceLayer.pipe(
  Layer.provide(DatabaseLayer)
);
// Type: Layer<UserService, never, never>
//       ∅ → UserService

// What happened:
// 1. DatabaseLayer provides Database (eliminates from requirements)
// 2. Result has no dependencies, produces UserService
```

**Key Behavior**:
- Eliminates provided dependencies from requirements
- Inputs can shift (if provider has its own requirements)
- Outputs remain from the recipient layer

**Complex Example** (inputs shift):

```typescript
// A → B
const LayerOne = Layer.effect(ServiceB, 
  Effect.gen(function* () {
    const a = yield* ServiceA;
    return ServiceB.of({ /* uses a */ });
  })
);

// C → B
const LayerTwo = Layer.effect(ServiceB,
  Effect.gen(function* () {
    const c = yield* ServiceC;
    return ServiceB.of({ /* uses c */ });
  })
);

// A → B provided to B → C gives A → D
const Composed = LayerTwo.pipe(
  Layer.provide(LayerOne)
);
// If LayerTwo needs B and LayerOne needs A
// Result needs A to produce C
```

### 2. `Layer.provideMerge` - Vertical + Preservation

**Signature**: `Layer<A, E, B> → Layer<B, E2, C> → Layer<A, E | E2, B | C>`

**Mental Model**: Function composition BUT outputs are merged

```
// Abstract notation
A → B  provideMerge to  B → C  =  A → (B + C)
```

**Concrete Example**:

```typescript
const DatabaseLayer = Layer.succeed(
  Database,
  { query: (sql) => Effect.succeed([]) }
);
// ∅ → Database

const CalendarLayer = Layer.effect(
  Calendar,
  Effect.gen(function* () {
    const db = yield* Database;
    return Calendar.of({
      getEvents: () => db.query("SELECT * FROM events")
    });
  })
);
// Database → Calendar

// Compose with provideMerge
const BothLayer = CalendarLayer.pipe(
  Layer.provideMerge(DatabaseLayer)
);
// Type: Layer<Database | Calendar, never, never>
//       ∅ → (Database + Calendar)

// Both services available!
const program = Effect.gen(function* () {
  const db = yield* Database;      // Available!
  const cal = yield* Calendar;     // Available!
  
  // Can use both
}).pipe(
  Effect.provide(BothLayer)
);
```

**Use Cases**:
- Need to expose intermediate dependencies
- Multiple consumers need same service
- Building composite layers
- Transitive dependencies

**Anti-Pattern Warning**:

```typescript
// DON'T: Unnecessary provideMerge
const UserLayer = Layer.effect(UserService,
  Effect.gen(function* () {
    const db = yield* Database;
    return UserService.of({ /* ... */ });
  })
).pipe(
  Layer.provideMerge(DatabaseLayer)
);
// ∅ → (Database + UserService)

// If nothing else needs Database, use provide instead!
const BetterUserLayer = UserLayer.pipe(
  Layer.provide(DatabaseLayer)
);
// ∅ → UserService
```

### 3. `Layer.merge` - Horizontal Composition

**Signature**: `Layer<A, E, B> → Layer<C, E2, D> → Layer<A | C, E | E2, B | D>`

**Mental Model**: Parallel combination

```
// Abstract notation
A → B  merge with  C → D  =  (A + C) → (B + D)
```

**Concrete Example**:

```typescript
const DatabaseLayer = Layer.succeed(
  Database,
  { query: (sql) => Effect.succeed([]) }
);
// ∅ → Database

const NotificationLayer = Layer.succeed(
  Notification,
  { send: (msg) => Console.log(msg) }
);
// ∅ → Notification

// Merge horizontally
const InfraLayer = Layer.merge(
  DatabaseLayer,
  NotificationLayer
);
// Type: Layer<Database | Notification, never, never>
//       ∅ → (Database + Notification)
```

**Requirements Also Merge**:

```typescript
const UserLayer = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database;
    return UserService.of({ /* ... */ });
  })
);
// Database → UserService

const EmailLayer = Layer.effect(
  EmailService,
  Effect.gen(function* () {
    const notif = yield* Notification;
    return EmailService.of({ /* ... */ });
  })
);
// Notification → EmailService

const MergedLayer = Layer.merge(UserLayer, EmailLayer);
// Type: Layer<UserService | EmailService, never, Database | Notification>
//       (Database + Notification) → (UserService + EmailService)

// Now must provide BOTH Database and Notification
const FullyProvided = MergedLayer.pipe(
  Layer.provide(DatabaseLayer),
  Layer.provide(NotificationLayer)
);
// ∅ → (UserService + EmailService)
```

### Composition Tree Pattern

**Dependency Graph**:

```
EventService
├── UserService
│   ├── Database
│   └── Notification
└── CalendarService
    └── Database
```

**Bottom-Up Composition**:

```typescript
// Leaf nodes (no dependencies)
const DatabaseLayer = Layer.succeed(Database, { /* ... */ });
const NotificationLayer = Layer.succeed(Notification, { /* ... */ });

// Merge leaf nodes
const InfraLayer = Layer.merge(DatabaseLayer, NotificationLayer);
// ∅ → (Database + Notification)

// Provide to parents
const UserServiceLayer = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database;
    const notif = yield* Notification;
    return UserService.of({ /* ... */ });
  })
).pipe(
  Layer.provide(InfraLayer)
);
// ∅ → UserService

const CalendarServiceLayer = Layer.effect(
  CalendarService,
  Effect.gen(function* () {
    const db = yield* Database;
    return CalendarService.of({ /* ... */ });
  })
).pipe(
  Layer.provide(DatabaseLayer)
);
// ∅ → CalendarService

// Merge siblings
const ServicesLayer = Layer.merge(UserServiceLayer, CalendarServiceLayer);
// ∅ → (UserService + CalendarService)

// Provide to top
const EventServiceLayer = Layer.effect(
  EventService,
  Effect.gen(function* () {
    const users = yield* UserService;
    const calendar = yield* CalendarService;
    return EventService.of({ /* ... */ });
  })
).pipe(
  Layer.provide(ServicesLayer)
);
// ∅ → EventService

// Final app layer
const AppLayer = Layer.mergeAll(
  EventServiceLayer,
  UserServiceLayer,
  CalendarServiceLayer
  // All have no requirements, just merge
);
```

**Shortcut Pattern** (provide cascades):

```typescript
// Instead of merging leaves then providing...
const Shortcut = Layer.provideMerge(
  EventServiceLayer,
  UserServiceLayer,
  CalendarServiceLayer,
  DatabaseLayer,
  NotificationLayer
);

// provideMerge automatically handles the tree!
// Topologically sorts and provides in order
```

---

## Layer Memoization & Deduplication

### The Critical Guarantee

**Rule**: Layers are memoized by **reference identity**, not by type or name.

### How Memoization Works

```typescript
const DatabaseLayer = Layer.succeed(Database, {
  query: (sql) => {
    console.log("Creating database connection");
    return Effect.succeed([]);
  }
});

const UserLayer = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database;
    return UserService.of({ getUser: (id) => db.query("...") });
  })
).pipe(
  Layer.provide(DatabaseLayer)
);

const PostLayer = Layer.effect(
  PostService,
  Effect.gen(function* () {
    const db = yield* Database;
    return PostService.of({ getPost: (id) => db.query("...") });
  })
).pipe(
  Layer.provide(DatabaseLayer)
);

// Merge both
const AppLayer = Layer.merge(UserLayer, PostLayer);

// Run program
Effect.runPromise(
  Effect.gen(function* () {
    const users = yield* UserService;
    const posts = yield* PostService;
  }).pipe(
    Effect.provide(AppLayer)
  )
);

// Output: "Creating database connection" (ONCE!)
```

**Why?**: Both `UserLayer` and `PostLayer` use the **same** `DatabaseLayer` reference. Effect tracks this in a "memo map" and only constructs it once.

### Anti-Pattern: Function-Generated Layers

```typescript
// ❌ WRONG: Creates new layer on every call
const makeDatabaseLayer = (connectionString: string) =>
  Layer.effect(
    Database,
    Effect.gen(function* () {
      console.log(`Connecting to ${connectionString}`);
      const pool = yield* createPool(connectionString);
      return Database.of({ query: (sql) => pool.query(sql) });
    })
  );

const UserLayer = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database;
    return UserService.of({ /* ... */ });
  })
).pipe(
  Layer.provide(makeDatabaseLayer("postgres://..."))
);

const PostLayer = Layer.effect(
  PostService,
  Effect.gen(function* () {
    const db = yield* Database;
    return PostService.of({ /* ... */ });
  })
).pipe(
  Layer.provide(makeDatabaseLayer("postgres://..."))
);

// Two different layer instances!
// Database created TWICE, different connections!
```

### Solution: Extract to Constant

```typescript
// ✅ CORRECT: Single layer instance
const DatabaseLayer = makeDatabaseLayer("postgres://...");

const UserLayer = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database;
    return UserService.of({ /* ... */ });
  })
).pipe(
  Layer.provide(DatabaseLayer)
);

const PostLayer = Layer.effect(
  PostService,
  Effect.gen(function* () {
    const db = yield* Database;
    return PostService.of({ /* ... */ });
  })
).pipe(
  Layer.provide(DatabaseLayer)
);

// Same reference → memoized → created once
```

### Reference Identity in Practice

```typescript
// Define layer
const ConfigLayer = Layer.succeed(Config, {
  apiKey: "secret",
  timeout: 5000
});

// Reference 1
const layer1 = ConfigLayer;

// Reference 2
const layer2 = ConfigLayer;

// Same reference!
console.log(layer1 === layer2); // true

// Different references
const layer3 = Layer.succeed(Config, {
  apiKey: "secret",
  timeout: 5000
});

console.log(layer1 === layer3); // false (different object)
```

### Memoization Scope

**Per-Execution Scope**:

```typescript
const program = myEffect.pipe(Effect.provide(AppLayer));

// First execution
await Effect.runPromise(program);
// Layers built and memoized

// Second execution
await Effect.runPromise(program);
// Layers built AGAIN (new scope)
```

**Within Single Execution**:

```typescript
const program = Effect.gen(function* () {
  // First access
  const db1 = yield* Database;
  console.log("Got db1");
  
  // Second access
  const db2 = yield* Database;
  console.log("Got db2");
  
  // Same instance!
  console.log(db1 === db2); // true
}).pipe(
  Effect.provide(DatabaseLayer)
);

// Output:
// "Creating database" (once)
// "Got db1"
// "Got db2"
```

### Advanced: Layer.memoize

**Explicit Memoization**:

```typescript
const ExpensiveLayer = Layer.effect(
  ExpensiveService,
  Effect.gen(function* () {
    console.log("Expensive initialization");
    yield* Effect.sleep("5 seconds");
    return ExpensiveService.of({ /* ... */ });
  })
);

// Create memoized version
const MemoizedExpensiveLayer = Layer.memoize(ExpensiveLayer);

// Use in multiple places
const AppLayer = Layer.mergeAll(
  ServiceA.pipe(Layer.provide(MemoizedExpensiveLayer)),
  ServiceB.pipe(Layer.provide(MemoizedExpensiveLayer)),
  ServiceC.pipe(Layer.provide(MemoizedExpensiveLayer))
);

// "Expensive initialization" runs ONCE
```

---

## Multi-Tenant Architecture Patterns

### The Multi-Tenant Problem

**Scenarios**:
1. Separate database per tenant
2. Shared database, isolated schemas
3. Shared database, row-level isolation

### Pattern 1: Layer Map (Dynamic Tenants)

**Use Case**: Runtime tenant discovery, many tenants

```typescript
import { LayerMap } from "effect";

// Tenant-specific database layer factory
const makeTenantDatabaseLayer = (tenantId: string) =>
  Layer.scoped(
    Database,
    Effect.acquireRelease(
      Effect.gen(function* () {
        console.log(`Connecting to tenant ${tenantId}`);
        const pool = yield* createPool(`postgres://.../tenant_${tenantId}`);
        return Database.of({
          query: (sql) => pool.query(sql)
        });
      }),
      (db) => Console.log(`Disconnecting tenant ${tenantId}`)
    )
  );

// Create layer map
const tenantLayers = LayerMap.make(
  (tenantId: string) => makeTenantDatabaseLayer(tenantId),
  {
    timeToLive: "10 minutes" // Auto-cleanup inactive tenants
  }
);

// Access tenant-specific layer
const getTenantLayer = (tenantId: string) =>
  LayerMap.get(tenantLayers, tenantId);

// Usage in request handler
const handleRequest = (tenantId: string, userId: number) =>
  Effect.gen(function* () {
    const users = yield* UserService;
    return yield* users.getUser(userId);
  }).pipe(
    Effect.provide(getTenantLayer(tenantId))
  );
```

**Benefits**:
- Dynamic tenant creation/removal
- Automatic cleanup (TTL)
- Connection pooling per tenant
- Lazy initialization

### Pattern 2: Request Context

**Use Case**: Single database, schema isolation

```typescript
class TenantContext extends Context.Tag("TenantContext")<
  TenantContext,
  { tenantId: string; schema: string }
>() {}

class Database extends Effect.Service<Database>()("app/Database", {
  dependencies: [Config.Default],
  scoped: Effect.gen(function* () {
    const config = yield* Config;
    const pool = yield* Effect.acquireRelease(
      createPool(config.connectionString),
      (p) => p.close()
    );
    
    return {
      withTenant: (tenantId: string) =>
        Effect.gen(function* () {
          const conn = yield* pool.getConnection();
          // Set schema for this connection
          yield* conn.query(`SET search_path TO tenant_${tenantId}`);
          return conn;
        })
    };
  })
}) {}

class UserService extends Effect.Service<UserService>()("app/UserService", {
  dependencies: [Database.Default],
  effect: Effect.gen(function* () {
    const db = yield* Database;
    
    return {
      // Method depends on TenantContext
      getUser: (id: number): Effect.Effect<User, NotFoundError, TenantContext> =>
        Effect.gen(function* () {
          const ctx = yield* TenantContext;
          const conn = yield* db.withTenant(ctx.tenantId);
          return yield* conn.query("SELECT * FROM users WHERE id = $1", [id]);
        })
    };
  })
}) {}

// HTTP handler provides tenant context
const handleRequest = (req: Request) =>
  Effect.gen(function* () {
    const tenantId = extractTenantId(req);
    
    const users = yield* UserService;
    const user = yield* users.getUser(123);
    
    return Response.json(user);
  }).pipe(
    Effect.provide(
      Layer.succeed(TenantContext, {
        tenantId,
        schema: `tenant_${tenantId}`
      })
    ),
    Effect.provide(MainLayer)
  );
```

### Pattern 3: Database Service with Tenant Methods

**Use Case**: Explicit tenant handling

```typescript
class Database extends Effect.Service<Database>()("app/Database", {
  dependencies: [Config.Default],
  scoped: Effect.gen(function* () {
    const config = yield* Config;
    const pool = yield* Effect.acquireRelease(
      createPool(config.connectionString),
      (p) => p.close()
    );
    
    return {
      // Tenant-aware query method
      queryForTenant: (tenantId: string, sql: string, params: unknown[]) =>
        Effect.gen(function* () {
          const conn = yield* pool.getConnection();
          
          // Set schema
          yield* conn.query(`SET search_path TO tenant_${tenantId}`);
          
          // Execute query
          const result = yield* conn.query(sql, params);
          
          // Reset schema
          yield* conn.query("SET search_path TO public");
          yield* conn.release();
          
          return result;
        })
    };
  })
}) {}

class UserService extends Effect.Service<UserService>()("app/UserService", {
  dependencies: [Database.Default],
  effect: Effect.gen(function* () {
    const db = yield* Database;
    
    return {
      // Explicit tenant parameter
      getUser: (tenantId: string, userId: number) =>
        db.queryForTenant(
          tenantId,
          "SELECT * FROM users WHERE id = $1",
          [userId]
        )
    };
  })
}) {}
```

---

## Transaction Management with Services

### The Transaction Problem

**Goal**: Execute multiple operations atomically
- All succeed or all fail
- Isolated from other operations
- Consistent state

### Pattern 1: Transaction Layer

```typescript
class TransactionConnection extends Context.Tag("TransactionConnection")<
  TransactionConnection,
  { connection: Connection; inTransaction: boolean }
>() {}

class Database extends Effect.Service<Database>()("app/Database", {
  dependencies: [Config.Default],
  scoped: Effect.gen(function* () {
    const config = yield* Config;
    const pool = yield* Effect.acquireRelease(
      createPool(config),
      (p) => p.close()
    );
    
    return {
      // Returns a layer that provides transaction context
      transaction: <A, E, R>(
        effect: Effect.Effect<A, E, R | TransactionConnection>
      ): Effect.Effect<A, E, R> =>
        Layer.scoped(
          TransactionConnection,
          Effect.acquireRelease(
            Effect.gen(function* () {
              const conn = yield* pool.getConnection();
              yield* conn.query("BEGIN");
              return {
                connection: conn,
                inTransaction: true
              };
            }),
            (ctx) =>
              Effect.gen(function* () {
                yield* ctx.connection.query("COMMIT");
                yield* ctx.connection.release();
              }).pipe(
                Effect.catchAllDefect(() =>
                  Effect.gen(function* () {
                    yield* ctx.connection.query("ROLLBACK");
                    yield* ctx.connection.release();
                  })
                )
              )
          )
        ).pipe(
          Layer.build,
          Effect.flatMap((layer) =>
            effect.pipe(Effect.provide(layer))
          )
        )
    };
  })
}) {}

// Service methods depend on TransactionConnection
class TaskService extends Effect.Service<TaskService>()("app/TaskService", {
  effect: Effect.gen(function* () {
    return {
      createTask: (data: TaskData): Effect.Effect<Task, TaskError, TransactionConnection> =>
        Effect.gen(function* () {
          const { connection } = yield* TransactionConnection;
          return yield* connection.query("INSERT INTO tasks ...", data);
        }),
      
      createSubmission: (data: SubmissionData): Effect.Effect<Submission, TaskError, TransactionConnection> =>
        Effect.gen(function* () {
          const { connection } = yield* TransactionConnection;
          
          const task = yield* this.createTask(data.task);
          const submission = yield* connection.query(
            "INSERT INTO submissions ...",
            { taskId: task.id, ...data.submission }
          );
          const subTasks = yield* Effect.forEach(
            data.subTasks,
            (st) => connection.query("INSERT INTO subtasks ...", {
              submissionId: submission.id,
              ...st
            })
          );
          
          return { task, submission, subTasks };
        })
    };
  })
}) {}

// Usage
const program = Effect.gen(function* () {
  const db = yield* Database;
  const taskService = yield* TaskService;
  
  // Execute in transaction
  const result = yield* db.transaction(
    taskService.createSubmission(data)
  );
  
  return result;
});
```

### Pattern 2: Higher-Order Transaction Wrapper

```typescript
class Database extends Effect.Service<Database>()("app/Database", {
  scoped: Effect.gen(function* () {
    const pool = yield* Effect.acquireRelease(
      createPool(),
      (p) => p.close()
    );
    
    return {
      // Generic transaction wrapper
      withTransaction: <A, E, R>(
        effect: Effect.Effect<A, E, R>
      ): Effect.Effect<A, E, R> =>
        Effect.acquireUseRelease(
          // Acquire
          Effect.gen(function* () {
            const conn = yield* pool.getConnection();
            yield* conn.query("BEGIN");
            return conn;
          }),
          // Use
          (conn) => {
            // Temporarily replace global DB service with transaction connection
            const txLayer = Layer.succeed(
              Database,
              {
                query: (sql, params) => conn.query(sql, params),
                withTransaction: () => Effect.fail(new Error("Nested transactions not supported"))
              }
            );
            
            return effect.pipe(Effect.provide(txLayer));
          },
          // Release
          (conn, exit) =>
            Effect.gen(function* () {
              if (exit._tag === "Success") {
                yield* conn.query("COMMIT");
              } else {
                yield* conn.query("ROLLBACK");
              }
              yield* conn.release();
            })
        )
    };
  })
}) {}

// Services just depend on Database (no transaction-specific dependency)
class TaskService extends Effect.Service<TaskService>()("app/TaskService", {
  dependencies: [Database.Default],
  effect: Effect.gen(function* () {
    const db = yield* Database;
    
    return {
      createTask: (data: TaskData) =>
        db.query("INSERT INTO tasks ...", data),
      
      createSubmission: (data: SubmissionData) =>
        Effect.gen(function* () {
          const task = yield* this.createTask(data.task);
          const submission = yield* db.query("INSERT INTO submissions ...", {
            taskId: task.id,
            ...data.submission
          });
          return { task, submission };
        })
    };
  })
}) {}

// Usage
const program = Effect.gen(function* () {
  const db = yield* Database;
  const taskService = yield* TaskService;
  
  // Wrap in transaction
  const result = yield* db.withTransaction(
    taskService.createSubmission(data)
  );
  
  return result;
});
```

**Key Insight**: Transaction wrapper temporarily replaces Database service with transaction-aware version!

---

## String Identifiers: Why & How

### The String Identifier Question

**Why not use the class itself as the identifier?**

### Reason 1: Context is a Map<string, unknown>

Under the hood:

```typescript
// Simplified internal structure
type Context = Map<string, unknown>;

// When you yield* UserService
// Internally: context.get("app/UserService")
```

**Why strings?**:
- Stable across module loads
- Serializable (for distributed systems)
- Minification-safe
- Human-readable errors

### Reason 2: Module Loading Issues

```typescript
// Problem: Class identity not stable
// bundle-1.js
import { UserService } from "./services";
const service1 = yield* UserService;

// bundle-2.js (different chunk, tree-shaken differently)
import { UserService } from "./services";
const service2 = yield* UserService;

// If using class as identifier:
// service1 class !== service2 class (different module load!)
// Context lookup fails!

// With string identifier:
// "app/UserService" === "app/UserService" ✅
```

### Reason 3: Generic Classes

```typescript
// Generic service class
class Cache<T> extends Context.Tag("Cache")<Cache<T>, CacheOps<T>>() {}

// Multiple instances
const StringCache = Cache<string>;
const NumberCache = Cache<number>;

// If using class as identifier:
// StringCache === NumberCache (same class!)
// Can't distinguish!

// With string identifier + generics:
// Need different strings for different generic instantiations
```

### Reason 4: Better Error Messages

```typescript
// Without string identifier
class UserService extends Context.Tag(UserService)<UserService, UserOps>() {}

// Error: Service UserService_minified_abc not found in context

// With string identifier
class UserService extends Context.Tag("app/UserService")<UserService, UserOps>() {}

// Error: Service "app/UserService" not found in context
// Much clearer!
```

### Best Practices for String Identifiers

#### Pattern 1: File Path Convention

```typescript
// src/services/UserService.ts
class UserService extends Effect.Service<UserService>()(
  "app/services/UserService",
  { /* ... */ }
) {}

// src/services/database/PostgresService.ts
class PostgresService extends Effect.Service<PostgresService>()(
  "app/services/database/PostgresService",
  { /* ... */ }
) {}
```

#### Pattern 2: Vendor Prefixing

```typescript
// Your internal services
class UserService extends Effect.Service<UserService>()(
  "mycompany/UserService",
  { /* ... */ }
) {}

// Third-party library
class ThirdPartyCache extends Effect.Service<ThirdPartyCache>()(
  "awesome-lib/Cache",
  { /* ... */ }
) {}
```

#### Pattern 3: Domain Namespacing

```typescript
// Authentication domain
class AuthService extends Effect.Service<AuthService>()(
  "auth/AuthService",
  { /* ... */ }
) {}

class SessionService extends Effect.Service<SessionService>()(
  "auth/SessionService",
  { /* ... */ }
) {}

// Billing domain
class PaymentService extends Effect.Service<PaymentService>()(
  "billing/PaymentService",
  { /* ... */ }
) {}
```

### The Collision Risk

**Scenario**: Third-party packages with same service names

```typescript
// Package A: @company-a/effect-database
class Database extends Effect.Service<Database>()(
  "Database", // ❌ Too generic!
  { /* ... */ }
) {}

// Package B: @company-b/effect-orm
class Database extends Effect.Service<Database>()(
  "Database", // ❌ Same identifier!
  { /* ... */ }
) {}

// Your app
import { Database as DbA } from "@company-a/effect-database";
import { Database as DbB } from "@company-b/effect-orm";

const layer = Layer.merge(
  DbA.Default,
  DbB.Default
);

// Problem: Both use "Database" as identifier
// Only one will be in context!
// Whichever is provided last wins
```

**Solution**: Vendor prefixing mandatory for libraries

```typescript
// Package A
class Database extends Effect.Service<Database>()(
  "@company-a/Database",
  { /* ... */ }
) {}

// Package B
class Database extends Effect.Service<Database>()(
  "@company-b/Database",
  { /* ... */ }
) {}

// No collision!
```

### Effect 4.0: Generic Tag Support

**Future Pattern** (Effect 4.0):

```typescript
// V3 (current)
class Cache extends Context.Tag("Cache")<Cache, CacheOps>() {}

// V4 (planned)
class Cache<T> extends Service.Tag<Cache<T>>()(
  /* identifier handled automatically */
  { /* ... */ }
) {}

// Distinguishes generic instantiations automatically
```

---

## Local vs. Root Dependency Provision

### The Two Philosophies

#### Philosophy 1: Root-Level Provision
**Compose all layers at application entry point**

```typescript
// Define layers
const ConfigLayer = Layer.succeed(Config, { /* ... */ });
const DatabaseLayer = Layer.effect(Database, /* ... */);
const UserServiceLayer = Layer.effect(UserService, /* ... */);
const PostServiceLayer = Layer.effect(PostService, /* ... */);

// Root composition
const AppLayer = ConfigLayer.pipe(
  Layer.provide(DatabaseLayer),
  Layer.provide(UserServiceLayer),
  Layer.provide(PostServiceLayer)
);

// Single provide at entry
const main = myApp.pipe(
  Effect.provide(AppLayer)
);
```

**Problems**:
- ❌ Complex dependency tracking at root
- ❌ Every new service requires root file change
- ❌ Merge conflicts in main entry point
- ❌ Dependencies not co-located with services
- ❌ Hard to see what depends on what

#### Philosophy 2: Local Provision (Recommended)
**Provide dependencies where they're defined**

```typescript
// Database (leaf node)
const DatabaseLayer = Layer.effect(Database, /* ... */).pipe(
  Layer.provide(ConfigLayer) // Provided locally
);

// UserService
const UserServiceLayer = Layer.effect(UserService, /* ... */).pipe(
  Layer.provide(DatabaseLayer) // Provided locally
);

// PostService
const PostServiceLayer = Layer.effect(PostService, /* ... */).pipe(
  Layer.provide(DatabaseLayer) // Provided locally
);

// Root: Just merge!
const AppLayer = Layer.mergeAll(
  UserServiceLayer,
  PostServiceLayer
  // No complex provide chains
);

const main = myApp.pipe(
  Effect.provide(AppLayer)
);
```

**Benefits**:
- ✅ Dependencies co-located with definitions
- ✅ Root file stays clean
- ✅ No merge conflicts
- ✅ Clear dependency graph
- ✅ Memoization still works (same references)

### The Pattern: Local Erasure

**Goal**: Eliminate all dependencies locally, expose only outputs

```typescript
// ❌ BAD: Exposes transitive dependencies
const UserServiceLayer = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database;
    const logger = yield* Logger;
    return UserService.of({ /* ... */ });
  })
);
// Type: Layer<UserService, never, Database | Logger>
//       (Database + Logger) → UserService

// ✅ GOOD: Erases dependencies locally
const UserServiceLayer = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database;
    const logger = yield* Logger;
    return UserService.of({ /* ... */ });
  })
).pipe(
  Layer.provide(DatabaseLayer),
  Layer.provide(LoggerLayer)
);
// Type: Layer<UserService, never, never>
//       ∅ → UserService
```

### Complex Example: Deep Tree

**Dependency Graph**:

```
App
├── EventService
│   ├── UserService
│   │   ├── Database
│   │   └── Logger
│   └── CalendarService
│       └── Database
└── NotificationService
    └── EmailClient
        └── Config
```

**Root-Level Provision** (Anti-Pattern):

```typescript
// All layers with dependencies exposed
const AppLayer = EventServiceLayer.pipe(
  Layer.provide(UserServiceLayer),
  Layer.provide(CalendarServiceLayer),
  Layer.provide(NotificationServiceLayer),
  Layer.provide(DatabaseLayer),
  Layer.provide(LoggerLayer),
  Layer.provide(EmailClientLayer),
  Layer.provide(ConfigLayer)
);
// Complex, error-prone, hard to maintain
```

**Local Provision** (Best Practice):

```typescript
// Leaf nodes
const ConfigLayer = Layer.succeed(Config, { /* ... */ });
const DatabaseLayer = Layer.effect(Database, /* ... */).pipe(
  Layer.provide(ConfigLayer)
);
// ∅ → Database

const LoggerLayer = Layer.effect(Logger, /* ... */);
// ∅ → Logger

// Second level
const UserServiceLayer = Layer.effect(UserService, /* ... */).pipe(
  Layer.provide(DatabaseLayer),
  Layer.provide(LoggerLayer)
);
// ∅ → UserService

const CalendarServiceLayer = Layer.effect(CalendarService, /* ... */).pipe(
  Layer.provide(DatabaseLayer)
);
// ∅ → CalendarService

const EmailClientLayer = Layer.effect(EmailClient, /* ... */).pipe(
  Layer.provide(ConfigLayer)
);
// ∅ → EmailClient

// Third level
const EventServiceLayer = Layer.effect(EventService, /* ... */).pipe(
  Layer.provide(UserServiceLayer),
  Layer.provide(CalendarServiceLayer)
);
// ∅ → EventService

const NotificationServiceLayer = Layer.effect(NotificationService, /* ... */).pipe(
  Layer.provide(EmailClientLayer)
);
// ∅ → NotificationService

// Root: Clean merge!
const AppLayer = Layer.mergeAll(
  EventServiceLayer,
  NotificationServiceLayer
);
// ∅ → (EventService + NotificationService)

// Single provide
const main = myApp.pipe(Effect.provide(AppLayer));
```

**Rule of Thumb**:

> "Provide dependencies as close to their usage as possible. Export only fully-satisfied layers (∅ → Output) from your modules."

---

## Effect 4.0 Service Changes

### Terminology Evolution

**Effect 3.x** → **Effect 4.x**

| Effect 3.x | Effect 4.x | Rationale |
|------------|------------|-----------|
| `Context` | `Services` | "Services" clearer than "Context" |
| `Context.Tag` | `Service.Tag` | Aligns with domain terminology |
| `Context.make` | `Services.make` | Consistency |
| `Context.get` | `Services.get` | Clarity |

### API Changes

#### Creating Services

**Effect 3.x**:

```typescript
import { Context, Effect, Layer } from "effect";

// Tag pattern
class UserService extends Context.Tag("UserService")<
  UserService,
  { getUser: (id: number) => Effect.Effect<User> }
>() {}

// Provide
const UserServiceLive = Layer.succeed(
  UserService,
  { getUser: (id) => Effect.succeed({ id, name: "Alice" }) }
);
```

**Effect 4.x**:

```typescript
import { Services, Effect, Layer } from "effect";

// Service pattern (preferred)
class UserService extends Effect.Service<UserService>()(
  "UserService",
  {
    effect: Effect.gen(function* () {
      return {
        getUser: (id: number) => Effect.succeed({ id, name: "Alice" })
      };
    })
  }
) {}

// Default layer automatically available
UserService.Default; // Layer<UserService, never, never>
```

#### Accessing Services

**Effect 3.x**:

```typescript
const program = Effect.gen(function* () {
  const userService = yield* UserService;
  return yield* userService.getUser(123);
});
```

**Effect 4.x** (same):

```typescript
const program = Effect.gen(function* () {
  const userService = yield* UserService;
  return yield* userService.getUser(123);
});
```

### New Service Pattern Benefits

#### 1. Co-located Default Implementation

**Effect 3.x**:

```typescript
// UserService.ts
class UserService extends Context.Tag("UserService")<...>() {}

// UserServiceLive.ts (separate file)
const UserServiceLive = Layer.effect(UserService, /* ... */);

// Need to import both
import { UserService } from "./UserService";
import { UserServiceLive } from "./UserServiceLive";
```

**Effect 4.x**:

```typescript
// UserService.ts (all in one)
class UserService extends Effect.Service<UserService>()(
  "UserService",
  {
    effect: Effect.gen(function* () {
      // Implementation
    })
  }
) {}

// Default available immediately
UserService.Default;

// Only one import needed
import { UserService } from "./UserService";
```

#### 2. Dependencies in Service Definition

**Effect 4.x**:

```typescript
class UserService extends Effect.Service<UserService>()(
  "UserService",
  {
    // Dependencies declared here!
    dependencies: [Database.Default, Logger.Default],
    
    effect: Effect.gen(function* () {
      // Dependencies available
      const db = yield* Database;
      const logger = yield* Logger;
      
      return {
        getUser: (id: number) =>
          Effect.gen(function* () {
            yield* logger.info(`Fetching user ${id}`);
            return yield* db.query("SELECT * FROM users WHERE id = $1", [id]);
          })
      };
    })
  }
) {}

// UserService.Default already has dependencies provided!
// No need for manual Layer.provide
```

#### 3. Scoped Services

**Effect 4.x**:

```typescript
class Database extends Effect.Service<Database>()(
  "Database",
  {
    dependencies: [Config.Default],
    
    // Use scoped for resources
    scoped: Effect.gen(function* () {
      const config = yield* Config;
      
      const pool = yield* Effect.acquireRelease(
        createPool(config.connectionString),
        (p) => p.close()
      );
      
      return {
        query: (sql, params) => pool.query(sql, params)
      };
    })
  }
) {}

// Cleanup automatic when scope closes
```

### Migration Guide

**Step 1**: Update imports

```typescript
// Before
import { Context } from "effect";

// After
import { Services } from "effect";
```

**Step 2**: Convert Tag to Service

```typescript
// Before
class MyService extends Context.Tag("MyService")<MyService, MyOps>() {}
const MyServiceLive = Layer.effect(MyService, /* ... */);

// After
class MyService extends Effect.Service<MyService>()(
  "MyService",
  {
    effect: Effect.gen(function* () {
      // Implementation
    })
  }
) {}
```

**Step 3**: Use Default layer

```typescript
// Before
const program = myEffect.pipe(
  Effect.provide(MyServiceLive)
);

// After
const program = myEffect.pipe(
  Effect.provide(MyService.Default)
);
```

---

## LSP Tooling for Layer Composition

### Automatic Layer Composition

**Feature**: Language service plugin automatically generates layer composition code

### Setup

1. Install Effect language service plugin:

```bash
npm install @effect/language-service
```

2. Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@effect/language-service"
      }
    ]
  }
}
```

3. Restart TypeScript server in your editor

### Usage: Automatic Composition

**Scenario**: You have layers, want to compose them

```typescript
// Define layers
const DatabaseLayer = Layer.succeed(Database, { /* ... */ });
const NotificationLayer = Layer.succeed(Notification, { /* ... */ });

const UserServiceLayer = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database;
    const notif = yield* Notification;
    return UserService.of({ /* ... */ });
  })
);

const CalendarServiceLayer = Layer.effect(
  CalendarService,
  Effect.gen(function* () {
    const db = yield* Database;
    return CalendarService.of({ /* ... */ });
  })
);

const EventServiceLayer = Layer.effect(
  EventService,
  Effect.gen(function* () {
    const users = yield* UserService;
    const calendar = yield* CalendarService;
    return EventService.of({ /* ... */ });
  })
);

// Desired final layer
const AppLayer: Layer<EventService | UserService | CalendarService, never, never> = 
  // Cursor here...
```

**Trigger**: LSP suggests "Prepare layers for automatic composition"

**Result**:

```typescript
const AppLayer = [
  DatabaseLayer,
  NotificationLayer,
  UserServiceLayer,
  CalendarServiceLayer,
  EventServiceLayer
] as const;
```

**Next Step**: LSP suggests "Compose layers automatically with target output services"

**Final Result**:

```typescript
const AppLayer = EventServiceLayer.pipe(
  Layer.provide(UserServiceLayer),
  Layer.provide(CalendarServiceLayer),
  Layer.provide(DatabaseLayer),
  Layer.provide(NotificationLayer)
);
// Type: Layer<EventService | UserService | CalendarService, never, never>
```

### How It Works

1. **Dependency Analysis**: LSP parses all layer types
2. **Topological Sort**: Orders layers based on dependencies
3. **Composition Strategy**: Determines optimal provide/merge pattern
4. **Code Generation**: Inserts composition code

### Advanced: Partial Composition

**Scenario**: Some dependencies still required

```typescript
const AppLayer = [
  UserServiceLayer,
  CalendarServiceLayer,
  EventServiceLayer
] as const;

// LSP: "Compose layers automatically"
// Result:
const AppLayer = EventServiceLayer.pipe(
  Layer.provide(UserServiceLayer),
  Layer.provide(CalendarServiceLayer)
);
// Type: Layer<EventService | UserService | CalendarService, never, Database | Notification>
//                                                                   ^^^^^^^^^^^^^^^^^^^^^^^^^
//                                                                   Still required!
```

**LSP shows**: "Missing requirements: Database, Notification"

### Diagnostic Features

#### 1. Missing Dependency Warning

```typescript
const program = Effect.gen(function* () {
  const users = yield* UserService;
  return yield* users.getUser(123);
}).pipe(
  Effect.provide(Layer.empty) // ❌ LSP Warning: UserService not provided
);
```

#### 2. Duplicate Layer Detection

```typescript
const AppLayer = Layer.mergeAll(
  UserServiceLayer.pipe(Layer.provide(DatabaseLayer)),
  PostServiceLayer.pipe(Layer.provide(DatabaseLayer)),
  DatabaseLayer // ⚠️ LSP Warning: Database provided multiple times
);
```

#### 3. Circular Dependency Detection

```typescript
const A = Layer.effect(ServiceA, 
  Effect.gen(function* () {
    const b = yield* ServiceB; // ❌ LSP Error: Circular dependency A → B → A
    return ServiceA.of({ /* ... */ });
  })
);

const B = Layer.effect(ServiceB,
  Effect.gen(function* () {
    const a = yield* ServiceA;
    return ServiceB.of({ /* ... */ });
  })
);
```

### Configuration Options

**Enable/Disable Features**:

```json
{
  "effect.languageService": {
    "enableLayerComposition": true,
    "enableDependencyWarnings": true,
    "enableCircularDependencyChecks": true,
    "suggestLocalProvision": true
  }
}
```

---

## Summary: Key Patterns & Principles

### Service Design Principles

1. **Constructor-Level for Singletons**
   - Application-scoped services
   - Database pools, loggers, configs
   - Built once, used everywhere

2. **Method-Level for Request Context**
   - Request-scoped data
   - Transactions, tenant isolation
   - Varied per invocation

3. **Hybrid: Best of Both**
   - Service at constructor, context at method
   - Connection pool + tenant ID
   - Type-safe, flexible

### Layer Composition Principles

1. **Local Provision Wins**
   - Provide dependencies where defined
   - Eliminate all Requirements locally
   - Export fully-satisfied layers (∅ → Output)

2. **Follow the Types**
   - Types guide correct composition
   - Eliminate Requirements progressively
   - Compiler catches mistakes

3. **Three Operators**
   - `provide`: Vertical composition (A→B + B→C = A→C)
   - `provideMerge`: Vertical + output preservation
   - `merge`: Horizontal composition (parallel)

### Memoization Guarantees

1. **Reference Identity Critical**
   - Same layer reference = memoized
   - Function-generated layers = new instances
   - Extract to constants for sharing

2. **Per-Execution Scope**
   - Memoized within single Effect.run*
   - New execution = new scope
   - Services rebuilt fresh

### Multi-Tenant Patterns

1. **Layer Map for Dynamic**
   - Runtime tenant discovery
   - Automatic cleanup (TTL)
   - Lazy initialization

2. **Request Context for Static**
   - Known tenants at startup
   - Schema-based isolation
   - Simpler model

### String Identifier Rationale

1. **Stability**: Survives minification, module loading
2. **Clarity**: Human-readable errors
3. **Serialization**: Distributed systems support
4. **Namespace**: Vendor prefixes prevent collisions

### Effect 4.0 Migration

1. **Context → Services**: Clearer terminology
2. **Effect.Service**: Co-located defaults
3. **Dependencies Property**: Declarative graph
4. **Scoped Property**: Resource management

---

## Practical Checklist

### Before Writing Services
- [ ] Identify application-scoped vs request-scoped concerns
- [ ] Plan dependency graph (draw it!)
- [ ] Choose transaction strategy
- [ ] Decide on multi-tenant approach (if applicable)

### While Writing Services
- [ ] Use string identifiers (vendor prefix for libraries)
- [ ] Provide dependencies locally
- [ ] Extract layer constants (avoid functions)
- [ ] Add type annotations to layers
- [ ] Document dependencies in comments

### After Writing Services
- [ ] Run LSP composition helpers
- [ ] Verify memoization (check console logs)
- [ ] Test with different contexts (transactions, tenants)
- [ ] Review root layer composition
- [ ] Check for circular dependencies

### Testing Services
- [ ] Mock with test layers (Layer.succeed)
- [ ] Test with transactions
- [ ] Test multi-tenant isolation
- [ ] Verify resource cleanup
- [ ] Check error propagation

---

## Resources & Next Steps

### Official Documentation
- Effect.io: https://effect.website
- Services & Layers: https://effect.website/docs/guides/context-management
- Effect 4.0 Migration: (forthcoming)

### Community
- Discord: https://discord.gg/effect-ts
- Office Hours: Weekly (check Discord announcements)
- Code Reviews: Submit in #office-hours channel

### Advanced Topics (Future Office Hours)
- Layer Maps in depth
- Distributed systems with Effect Cluster
- Custom service patterns
- Performance optimization
- Observability integration

---

*This reference captures the first Effect Office Hours session on dependency management and service layers. Patterns and best practices discussed are applicable to real-world Effect applications at scale.*
