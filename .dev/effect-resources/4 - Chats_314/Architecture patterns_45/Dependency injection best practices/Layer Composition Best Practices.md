---
modified: 2025-10-26T14:17:48-03:00
---
# Layer Composition Best Practices

## The Core Problem Layers Solve

Without layers, applications suffer from:
- **Giant main files** that grow with every new service
- **High churn** and merge conflicts in entry points
- **Manual dependency ordering** that's error-prone
- **Scattered construction logic** across the codebase
- **No automatic resource management**

**Layers are effectful constructors for services** that solve these problems through:
1. **Co-location** - service definition + construction in one file
2. **Parallel construction** - independent services build concurrently
3. **Automatic memoization** - services built once, reused everywhere
4. **Type-safe wiring** - compiler enforces dependency satisfaction
5. **Built-in resource management** - guaranteed cleanup via `Scope`

---

## The Three Core Composition Operators

### 1. `Layer.provide` - Function Composition (Dependency Erasure)

**Pattern**: `A → B` provided to `B → C` = `A → C`

```typescript
// LayerAB requires A, produces B
// LayerBC requires B, produces C
const result = layerBC.pipe(
  Layer.provide(layerAB)
)
// Result requires A, produces C (B is erased)
```

**Use when**: You want to satisfy a dependency without exposing it

**Mental model**: Like function composition - the intermediate type disappears

```typescript
// Example: Database layer needs Config, but consumers don't
export const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config  // Requires Config
    return createDatabase(config)
  })
).pipe(
  Layer.provide(ConfigLive)  // Config requirement erased
)
// DatabaseLive now has signature: Layer<Database, never, never>
```

---

### 2. `Layer.provideMerge` - Provide and Expose

**Pattern**: `A → B` provided to `B → C` = `A → B | C`

```typescript
const result = layerBC.pipe(
  Layer.provideMerge(layerAB)
)
// Result requires A, produces BOTH B and C
```

**Use when**: You want to both satisfy a dependency AND make it available to other services

**Example**: Multiple services need the same dependency

```typescript
// UserService needs Database, but other services also need it
export const AppLayer = UserServiceLive.pipe(
  Layer.provideMerge(DatabaseLive)
)
// AppLayer produces: UserService | Database
// Now PostService can also access Database
```

---

### 3. `Layer.merge` - Combine Independent Layers

**Pattern**: `(A → B)` merged with `(C → D)` = `A | C → B | D`

```typescript
const result = Layer.merge(layerAB, layerCD)
// Combines both inputs and both outputs
```

**Use when**: Combining independent services at the application root

```typescript
// Combine all top-level services
const MainLayer = Layer.mergeAll(
  UserServiceLive,
  EmailServiceLive,
  PaymentServiceLive
)
```

---

## The Golden Rule: Local Dependency Elimination

**ALWAYS provide dependencies locally within each service file, then merge at the root.**

### ❌ Anti-Pattern: Exposing Internal Dependencies

```typescript
// services/UserService.ts
export const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database  // Dependency leaks to consumers!
    const email = yield* EmailService
    return createUserService(db, email)
  })
)
// Type: Layer<UserService, never, Database | EmailService>

// main.ts - Consumers must know about internal dependencies
const app = program.pipe(
  Effect.provide(
    Layer.merge(UserServiceLive, DatabaseLive, EmailServiceLive)
  )
)
```

### ✅ Best Practice: Local Elimination

```typescript
// services/UserService.ts
const UserServiceLive_Internal = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database
    const email = yield* EmailService
    return createUserService(db, email)
  })
)

// Provide dependencies HERE, not at application root
export const UserServiceLive = UserServiceLive_Internal.pipe(
  Layer.provide(DatabaseLive),
  Layer.provide(EmailServiceLive)
)
// Type: Layer<UserService, never, never> - Clean interface!

// main.ts - Simple, clean composition
const MainLayer = Layer.mergeAll(
  UserServiceLive,  // Already self-contained
  PaymentServiceLive,
  NotificationServiceLive
)
```

**Benefits**:
- **Clean public API** - consumers don't see internal wiring
- **Easy refactoring** - change dependencies without touching consumers
- **Simplified testing** - mock at the service boundary, not dependency graph
- **Reduced merge conflicts** - changes localized to service files

---

## The Critical "Single `Effect.provide`" Rule

**NEVER call `Effect.provide` multiple times. Always compose layers first, then provide once.**

### ❌ FORBIDDEN: Multiple `Effect.provide` Calls

```typescript
// Creates multiple scopes, breaks memoization, builds services multiple times
const result = program
  .pipe(Effect.provide(DatabaseLive))
  .pipe(Effect.provide(EmailServiceLive))
  .pipe(Effect.provide(LoggerLive))
  
// Each provide creates a NEW scope with its own MemoMap
// DatabaseLive might be built 3 times if EmailService and Logger depend on it!
```

### ✅ MANDATORY: Single Provide with Composed Layer

```typescript
// Compose layers into dependency graph
const MainLayer = Layer.mergeAll(
  DatabaseLive,
  EmailServiceLive,
  LoggerLive
)

// Single Effect.provide call
const result = program.pipe(
  Effect.provide(MainLayer)
)

// Creates ONE scope, ONE MemoMap
// Each service built exactly once and shared
```

**Why this matters**:
- Multiple `Effect.provide` creates separate scopes with isolated `MemoMap`s
- Services aren't shared across scopes - defeats memoization
- Resources may not be cleaned up correctly
- Performance degradation from redundant construction

---

## Memoization by Reference Identity

**Critical insight**: Layers are memoized by **reference identity**, not by value.

### ❌ Anti-Pattern: Function-Generated Layers

```typescript
// Each call returns a NEW layer reference
const makeDbLayer = (config: DbConfig) => 
  Layer.succeed(Database, createDb(config))

const layer1 = makeDbLayer(config)  // Reference A
const layer2 = makeDbLayer(config)  // Reference B (different!)

// These are TWO DIFFERENT layers - memoization doesn't work
const app = Layer.merge(
  userServiceLive.pipe(Layer.provide(layer1)),
  postServiceLive.pipe(Layer.provide(layer2))
)
// Database will be constructed TWICE
```

### ✅ Correct: Single Layer Instance

```typescript
// Create layer once, store reference
const DbLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config
    return createDb(config)
  })
).pipe(Layer.provide(ConfigLive))

// Same reference used everywhere
const app = Layer.merge(
  userServiceLive.pipe(Layer.provide(DbLive)),
  postServiceLive.pipe(Layer.provide(DbLive))
)
// Database constructed once, memoized, shared
```

**Key principle**: If you need parameterized layers, create the layer once and store it:

```typescript
// In config module
export const DbLive = makeDbLayer(getConfigFromEnv())

// Everywhere else
import { DbLive } from "./config"
```

---

## Constructor vs Method Dependencies

**Constructor dependencies** (in `Layer`):
- Application-wide services
- Static configuration
- Shared resources (database pools, HTTP clients)
- Services that live for the application's entire lifetime

**Method dependencies** (in service method signatures):
- Request-specific context (user ID, tenant ID, request tracing)
- Transaction boundaries
- Dynamic configurations (per-request model selection)
- Scoped resources (request-scoped cache, database transaction)

### Example: Request Context Pattern

```typescript
// Constructor dependency - shared across all requests
export class UserService extends Effect.Service<UserService>()("UserService", {
  dependencies: [Database.Default],
  effect: Effect.gen(function* () {
    const db = yield* Database
    
    return {
      // Method dependency - varies per request
      getUser: (userId: string, requestContext: RequestContext) =>
        Effect.gen(function* () {
          yield* Effect.logInfo("Getting user").pipe(
            Effect.annotateLogs({ 
              traceId: requestContext.traceId,
              userId 
            })
          )
          return yield* db.query(`SELECT * FROM users WHERE id = ${userId}`)
        })
    }
  })
}) {}
```

---

## Modern `Effect.Service` Pattern

The new pattern bundles service definition and layer construction:

```typescript
export class EmailService extends Effect.Service<EmailService>()("EmailService", {
  // Declare dependencies needed for construction
  dependencies: [SmtpClient.Default, Config.Default],
  
  // Use 'scoped' for services managing resources
  scoped: Effect.gen(function* () {
    // Dependencies acquired HERE during layer construction
    const smtp = yield* SmtpClient
    const config = yield* Config
    
    // Return service interface
    return {
      send: (to: string, body: string) =>
        smtp.sendMail({ to, body, from: config.emailFrom })
    }
  })
}) {}

// Usage: EmailService.Default is the Layer
const app = program.pipe(
  Effect.provide(EmailService.Default)
)
```

**Benefits**:
- Single declaration for tag + interface + layer
- Automatic `.Default` layer export
- Dependencies declared explicitly upfront
- Cleaner than manual `Layer.effect` + `Context.Tag`

---

## Decision Tree: Which Composition Operator?

```
Is the intermediate service needed by other services?
│
├─ NO → Use Layer.provide
│        (Erase the dependency)
│
└─ YES → Use Layer.provideMerge
         (Expose the dependency)

Are the services independent?
│
└─ YES → Use Layer.merge / Layer.mergeAll
         (Combine at application root)
```

---

## Common Patterns

### Pattern 1: Shared Database Layer

```typescript
// database.ts - provide config locally
export const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const config = yield* Config
    const pool = yield* acquirePool(config)
    yield* Effect.addFinalizer(() => pool.close())
    return createDatabaseService(pool)
  })
).pipe(Layer.provide(ConfigLive))

// userService.ts - database already self-contained
export const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database
    return createUserService(db)
  })
).pipe(Layer.provide(DatabaseLive))

// postService.ts - reuses same database
export const PostServiceLive = Layer.effect(
  PostService,
  Effect.gen(function* () {
    const db = yield* Database
    return createPostService(db)
  })
).pipe(Layer.provide(DatabaseLive))

// main.ts - database constructed once, shared
const MainLayer = Layer.mergeAll(
  UserServiceLive,
  PostServiceLive
)
```

### Pattern 2: Environment-Specific Layers

```typescript
// test.ts
export const TestLayers = Layer.mergeAll(
  DatabaseTest,    // In-memory implementation
  EmailServiceTest // Fake email sender
)

// prod.ts
export const ProdLayers = Layer.mergeAll(
  DatabaseLive,    // Real Postgres
  EmailServiceLive // Real SMTP
)

// Swap with single line
const app = program.pipe(
  Effect.provide(isTest ? TestLayers : ProdLayers)
)
```

### Pattern 3: Layered Architecture

```typescript
// Layer 1: Infrastructure (no dependencies)
const InfraLayer = Layer.mergeAll(
  ConfigLive,
  HttpClientLive,
  LoggerLive
)

// Layer 2: Data Access (depends on infra)
const DataLayer = Layer.mergeAll(
  DatabaseLive,
  CacheLive
).pipe(Layer.provide(InfraLayer))

// Layer 3: Domain Services (depends on data)
const DomainLayer = Layer.mergeAll(
  UserServiceLive,
  OrderServiceLive
).pipe(Layer.provide(DataLayer))

// Layer 4: Application (depends on domain)
const AppLayer = Layer.mergeAll(
  ApiServerLive,
  WorkerLive
).pipe(Layer.provide(DomainLayer))

// Clean composition
const main = program.pipe(Effect.provide(AppLayer))
```

---

## Testing with Layers

```typescript
// Real service for production
export const UserServiceLive = Layer.effect(/*...*/)

// Test double with same interface
export const UserServiceTest = Layer.succeed(
  UserService,
  {
    getUser: (id: string) => Effect.succeed({ id, name: "Test User" }),
    createUser: (data: UserData) => Effect.succeed({ id: "test-123", ...data })
  }
)

// Tests use test layer
it.effect("should get user", () =>
  Effect.gen(function* () {
    const userService = yield* UserService
    const user = yield* userService.getUser("123")
    assert.strictEqual(user.name, "Test User")
  }).pipe(Effect.provide(UserServiceTest))
)
```

---

## Summary: The Layer Composition Checklist

✅ **DO**:
- Provide dependencies locally within each service file
- Compose all layers into `MainLayer`, then `Effect.provide` once
- Use `Layer.merge` for independent services
- Use `Layer.provide` to erase dependencies
- Use `Layer.provideMerge` to expose shared dependencies
- Store layer references (avoid function-generated layers in loops)
- Use `Effect.Service` for modern service definitions

❌ **DON'T**:
- Call `Effect.provide` multiple times
- Expose internal dependencies in service signatures
- Generate layers inside functions without storing references
- Manually manage service construction order
- Use global mutable state instead of services

The key insight: **Layers are your application's wiring diagram, made type-safe and composable.**
