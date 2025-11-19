---
modified: 2025-10-22T21:39:40-03:00
---
# Do not leak Effect Service Requirements
## Best Practices for Service Interface Design in Effect

### Executive Summary
This article addresses a critical anti-pattern in Effect service design: leaking implementation requirements through service interfaces. When service methods expose their internal dependencies (like SQL clients) in their return types, it creates tight coupling and reduces flexibility. The solution involves moving dependencies into service construction layers rather than method signatures, enabling implementation swapping without interface changes. Effect LSP v0.21+ now provides automatic warnings for this anti-pattern.

---

## The Problem: Leaking Service Requirements

### Understanding the Anti-Pattern

#### The Problematic Code (leaking.ts)

```typescript
import { Effect, Context } from "effect"
import { SqlClient } from "@effect/sql"
import { 
  ProductNotFound,
  ProductAlreadyExists,
} from "./errors.js"

// ❌ BAD: Every method exposes SqlClient.SqlClient requirement
export class ProductCatalog extends Context.Tag(
  "ProductCatalog"
)<
  ProductCatalog,
  {
    getProductName: (
      sku: string
    ) => Effect.Effect<
      string,
      ProductNotFound,
      SqlClient.SqlClient
    >
    
    createProduct: (
      sku: string,
      name: string
    ) => Effect.Effect<
      void,
      ProductAlreadyExists,
      SqlClient.SqlClient
    >
  }
>() {}
```

### Why This Is Problematic

#### 1. **Tight Coupling**
Every consumer of `ProductCatalog` now requires `SQLClient`, even if the implementation changes to use REST APIs, GraphQL, or in-memory storage.

#### 2. **Violation of Abstraction**
The service interface exposes implementation details. Consumers shouldn't need to know whether products come from a database, API, or file system.

#### 3. **Testing Complexity**
Test code must provide `SQLClient` even when testing with mock implementations that don't use SQL.

#### 4. **Refactoring Nightmare**
Changing the data source requires updating:
- Service interface
- All consumers
- All tests
- All layer compositions

### Real-World Impact

Consider this cascade effect:

```typescript
// If ProductCatalog leaks SqlClient.SqlClient...
const getProductDetails = Effect.gen(function* () {
  const catalog = yield* ProductCatalog
  const name = yield* catalog.getProductName("ABC123")
  // Now THIS effect also requires SqlClient.SqlClient!
  // Type: Effect<string, ProductNotFound, ProductCatalog | SqlClient.SqlClient>
})

// And it spreads further...
const formatProductInfo = Effect.gen(function* () {
  const details = yield* getProductDetails
  // Now requires SqlClient.SqlClient transitively!
  // Type: Effect<string, Error, ProductCatalog | SqlClient.SqlClient | Formatter>
})
```

The `SqlClient.SqlClient` requirement "infects" the entire codebase, even parts that conceptually have nothing to do with SQL.

---

## The Solution: Proper Dependency Encapsulation

### Move Dependencies to Layer Construction

#### The Correct Pattern (correct.ts)

```typescript
import { Effect, hole } from "effect"
import { Context, Layer } from "effect"
import { SqlClient } from "@effect/sql"
import { HttpClient } from "@effect/platform"
import { 
  ProductNotFound,
  ProductAlreadyExists,
} from "./errors.js"

// ✅ GOOD: Clean interface with no leaked requirements
export class ProductCatalog extends Context.Tag(
  "ProductCatalog"
)<
  ProductCatalog,
  {
    getProductName: (
      sku: string
    ) => Effect.Effect<
      string,
      ProductNotFound,
      never  // No requirements leaked!
    >
    
    createProduct: (
      sku: string,
      name: string
    ) => Effect.Effect<
      void,
      ProductAlreadyExists,
      never  // No requirements leaked!
    >
  }
>() {}
```

#### Implementation in Layers

```typescript
// Database implementation
export const database = Layer.effect(
  ProductCatalog,
  Effect.gen(function* (_) {
    const sql = yield* _(SqlClient.SqlClient)
    
    return ProductCatalog.of({
      getProductName: (sku) => {
        // ... SQL query implementation
      },
      createProduct: (sku, name) => {
        // ... SQL insert implementation
      },
    })
  })
)

// Alternative REST API implementation
export const httpApi = Layer.effect(
  ProductCatalog,
  Effect.gen(function* (_) {
    const httpClient = yield* _(HttpClient.HttpClient)
    
    return ProductCatalog.of({
      getProductName: (sku) => {
        // ... REST API GET implementation
      },
      createProduct: (sku, name) => {
        // ... REST API POST implementation
      },
    })
  })
)
```

### Benefits of This Approach

#### 1. **True Abstraction**
Consumers work with `ProductCatalog` interface without knowing implementation details.

#### 2. **Easy Implementation Swapping**

```typescript
// Development with database
const DevApp = MyApp.pipe(
  Effect.provide(database),
  Effect.provide(SqlClientDev)
)

// Production with REST API
const ProdApp = MyApp.pipe(
  Effect.provide(httpApi),
  Effect.provide(HttpClientProd)
)

// Testing with mock
const TestApp = MyApp.pipe(
  Effect.provide(ProductCatalogMock)  // No SQL or HTTP needed!
)
```

#### 3. **Clean Consumer Code**

```typescript
const getProductDetails = Effect.gen(function* () {
  const catalog = yield* ProductCatalog
  const name = yield* catalog.getProductName("ABC123")
  // Type: Effect<string, ProductNotFound, ProductCatalog>
  // No SqlClient.SqlClient pollution!
})
```

---

## Deep Dive: Why Requirements Leak

### Common Scenarios Leading to Leaks

#### 1. **Direct Database Access in Methods**

```typescript
// ❌ Tempting but wrong
{
  getProductName: (sku: string) => Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient  // Leak!
    return yield* sql.query(...)
  })
}
```

#### 2. **Misunderstanding Service Boundaries**
Developers often think: "This method needs SQL, so SQL is a requirement."
Correct thinking: "This implementation needs SQL, not the interface."

#### 3. **Copy-Paste Programming**
Copying method implementations without considering interface design.

#### 4. **Incremental Migration**
Starting with leaked requirements "temporarily" during migration from legacy code.

### The Closure Pattern Solution

The key insight: Use JavaScript closures to capture dependencies during construction:

```typescript
const makeProductCatalog = Effect.gen(function* () {
  // Dependencies captured in closure
  const sql = yield* SQLClient
  const cache = yield* CacheService
  const logger = yield* Logger
  
  // Returned methods access closured dependencies
  return {
    fetchProduct: (id) => {
      // sql, cache, logger available here
      // but NOT in the method's type signature
    }
  }
})
```

---

## Effect LSP Support (v0.21+)

### Automatic Detection

The Effect Language Server Protocol now provides automatic warnings:

#### What It Detects
- All methods in a service sharing the same requirements
- Requirements that likely represent implementation details
- Common leaked services (SQLClient, HttpClient, FileSystem)

#### Warning Example

```typescript
class UserService extends Context.Tag("UserService")("app/UserService", {
  getUser: (id: string) => Effect.Effect<User, Error, Database>,
  createUser: (data: UserData) => Effect.Effect<User, Error, Database>,
  deleteUser: (id: string) => Effect.Effect<void, Error, Database>
}) {}
// ⚠️ LSP Warning: Service 'UserService' appears to be leaking 
// 'Database' requirement in all methods. Consider moving to layer.
```

### Configuration

```json
// .effectrc or effect.config.json
{
  "lsp": {
    "warnOnLeakedRequirements": true,
    "leakedRequirementsPatterns": [
      ".*Client$",
      ".*Repository$",
      "Database",
      "FileSystem"
    ]
  }
}
```

---

## Best Practices and Patterns

### The Golden Rule

> "Service interfaces should express WHAT they do, not HOW they do it."

### Design Checklist

✅ **Do:**
- Keep service interfaces focused on business operations
- Use semantic error types (NotFoundError, not SQLError)
- Think "what would this interface look like if implementation changed?"
- Capture dependencies in layer construction

❌ **Don't:**
- Expose infrastructure services in method signatures
- Let implementation details leak into interfaces
- Pass through infrastructure errors directly
- Require consumers to know about implementation

### Testing Benefits

```typescript
// With leaked requirements - Awkward test
it("should fetch product", () => 
  Effect.gen(function* () {
    const product = yield* catalog.fetchProduct("123")
    expect(product.id).toBe("123")
  }).pipe(
    Effect.provideService(SQLClient, fakeSQLClient), // Why?!
    Effect.provideService(ProductCatalog, testCatalog)
  )
)

// With proper encapsulation - Clean test
it("should fetch product", () =>
  Effect.gen(function* () {
    const product = yield* catalog.fetchProduct("123")
    expect(product.id).toBe("123")
  }).pipe(
    Effect.provideService(ProductCatalog, testCatalog)
  )
)
```

---

## Migration Strategy

### Step-by-Step Refactoring

#### Step 1: Identify Leaked Requirements
Look for services where all methods share the same requirements.

#### Step 2: Create New Interface
Define the clean interface without requirements.

#### Step 3: Build Layer Implementation
Move dependency usage into Layer.effect construction.

#### Step 4: Update Consumers
Remove unnecessary requirement provisions.

#### Step 5: Remove Old Interface
Delete the leaky service definition.

### Gradual Migration Example

```typescript
// Phase 1: Create parallel clean service
class ProductCatalogClean extends Context.Tag(...)({
  // Clean methods
})

// Phase 2: Adapter layer
const ProductCatalogAdapter = Layer.effect(
  ProductCatalogClean,
  Effect.gen(function* () {
    const oldCatalog = yield* ProductCatalogLeaky
    return {
      // Adapt methods
    }
  })
)

// Phase 3: Migrate consumers gradually
// Phase 4: Remove old service
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Partial Requirements

```typescript
// ❌ Still wrong - inconsistent requirements
{
  fetchProduct: (id) => Effect.Effect<Product, Error>,  // No req
  fetchWithStats: (id) => Effect.Effect<ProductWithStats, Error, Analytics>  // Leaked!
}
```

**Solution**: Either make all methods consistent or create separate services.

### Pitfall 2: Generic Services

```typescript
// ❌ Too generic
class Repository<T> extends Context.Tag(...)({
  find: (id) => Effect.Effect<T, Error, Database>  // Always leaks!
})
```

**Solution**: Create specific services with proper encapsulation.

### Pitfall 3: Mixed Responsibilities

```typescript
// ❌ Service doing too much
class ProductService extends Context.Tag(...)({
  // Business logic
  calculateDiscount: (product) => Effect.Effect<number>,
  // Data access - tempting to leak!
  fetchProduct: (id) => Effect.Effect<Product, Error, SQLClient>
})
```

**Solution**: Separate concerns into different services.

---

## Conclusion

Leaking service requirements is a subtle but impactful anti-pattern that undermines the benefits of Effect's service-oriented architecture. By keeping implementation dependencies in layers rather than interfaces:

1. **Interfaces remain stable** when implementations change
2. **Testing becomes simpler** without unnecessary dependencies
3. **Code is more maintainable** with clear boundaries
4. **Refactoring is safer** with isolated changes

The new Effect LSP warnings (v0.21+) help catch this pattern early, but understanding the principle helps design better services from the start.

### Key Takeaway

When designing Effect services, always ask: "If I completely changed how this service works internally, would the interface need to change?" If yes, you're probably leaking requirements.

### Remember

- **Interfaces** = What the service does
- **Layers** = How the service does it
- **Requirements** = What the layer needs, not what consumers need to know

This separation is fundamental to building flexible, testable, and maintainable Effect applications.
