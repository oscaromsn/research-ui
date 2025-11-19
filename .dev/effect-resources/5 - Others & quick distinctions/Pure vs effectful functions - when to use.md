---
modified: 2025-09-27T16:19:31-03:00
---
# Pure vs effectful functions - when to use

The core philosophy is to **separate pure, deterministic logic from logic that involves side effects, failure, or dependencies.**

---

### **When to Use Pure Functions**

Use pure TypeScript/JavaScript functions for logic that is self-contained, deterministic, and does not interact with the outside world. Pure functions are the building blocks of your core domain logic.

#### Recommended Use Cases for Pure Functions:

1. **Core Business Logic & Data Transformation:**
	- **What it is:** Functions that take data, apply business rules, and return new data. This includes calculations, data mapping, and state transitions that don't require external resources.
	- **Why:** This logic is the easiest to reason about and test. By keeping it pure, you can write standard, fast unit tests without needing the Effect test runner or providing layers. This logic represents the "what" of your application, cleanly separated from the "how".
	- **How it interacts with Effect:** This pure logic is typically "lifted" into an Effect context using combinators like `Effect.map`, `Effect.sync`, or is used directly between `yield*` statements inside an `Effect.gen` block.
	- **Example from Your Code (`src/utils/filterValidation.ts`):**

		```typescript
        // PURE: Takes a number, returns a number. No side effects.
        export const toSafePageSize = (requestedSize: number, isAuthenticated = false): number => {
          if (!isAuthenticated) {
            return requestedSize <= 5 ? 5 : 10
          }
          return Math.max(1, Math.min(requestedSize, 100))
        }

        // PURE: Composes other pure functions.
        export const createSafePagination = (page: number, requestedSize: number, isAuthenticated = false): Pagination => {
            const safeSize = toSafePageSize(requestedSize, isAuthenticated)
            return { page: Math.max(0, page), size: safeSize }
        }
        ```

2. **Model Construction and Manipulation:**
	- **What it is:** Functions that create or modify your domain models defined with `@effect/schema` or `Data`.
	- **Why:** These operations are fundamentally data transformations. Schemas themselves are declarative values, and functions that prepare data for validation or encoding should be pure whenever possible.
	- **Example from Your Code (`src/domain/models.ts`):** The `encodeFilterToApiParams` function is a great example of pure data transformation logic. (As noted in the review, its location could be improved, but its nature is pure.)

		```typescript
        export const encodeFilterToApiParams = (filtro: Filtro, pagination?: Pagination): Record<string, string> => {
          // ... pure object transformation logic ...
        }
        ```

3. **Simple Predicates and Checks:**
	- **What it is:** Functions that return a boolean based on their input, used for validation or branching logic.
	- **Why:** Keeping predicates pure makes them highly reusable and easy to test. They can be used within `Effect.if`, `Effect.filterOrFail`, or standard `if` statements inside `Effect.gen`.

---

### **When to Use Effectful Functions**

Use effectful functions (those that return an `Effect<A, E, R>`) whenever your computation involves any of the characteristics that Effect is designed to manage.

#### Recommended Use Cases for Effectful Functions:

1. **Any Interaction with the "Outside World" (Side Effects):**
	- **What it is:** Network requests, database queries, reading/writing to disk, `console.log`, generating random numbers, getting the current time.
	- **Why:** Effect's purpose is to make these side effects explicit, lazy, and manageable. By wrapping them in an `Effect`, you gain control over their execution, error handling, and resource safety.
	- **Example from Your Code (`src/services/SearchService/interface.ts`):**

		```typescript
        // EFFECTFUL: Describes a network request. It returns an Effect, not the SearchResponse directly.
        readonly search: (filters: Filtro, pagination: Pagination) => Effect.Effect<SearchResponse, FalcaoClientError>
        ```

2. **Asynchronous Operations:**
	- **What it is:** Any function that would normally return a `Promise`.
	- **Why:** `Effect` is a superior alternative to `Promise`. It provides typed errors, structured concurrency, and guaranteed-safe interruption, which Promises lack. Use `Effect.tryPromise` to wrap existing Promise-based APIs.
	- **Example:** Any of the `fetch` calls wrapped in `Effect.tryPromise` within your `HttpClient` layer.

3. **Operations That Can Fail (Typed Errors):**
	- **What it is:** Any function where failure is an expected and recoverable outcome (e.g., user not found, invalid input).
	- **Why:** Instead of throwing exceptions (which are untyped and break control flow), you should return a typed error in the `E` channel using `Effect.fail`. This forces consumers of your function to handle the error case at compile time.
	- **Example from Your Code (`src/utils/filterValidation.ts`):**

		```typescript
        // EFFECTFUL: Describes a computation that can fail with a typed domain error.
        export const validateFilters = (filters: Filtro): Effect.Effect<Filtro, FalcaoInvalidFilterCombinationError | FalcaoFilterComplexityError> =>
          Effect.gen(function*() {
            // ... validation logic ...
            if (someErrorCondition) {
              return yield* Effect.fail(new FalcaoInvalidFilterCombinationError(...))
            }
            return filters
          })
        ```

4. **Operations Requiring Dependencies (Services):**
	- **What it is:** Any function that needs access to a service from the `Context`.
	- **Why:** Accessing a service (e.g., `yield* MyService`) is an effect itself. Therefore, any function that relies on dependency injection must be effectful and declare its dependencies in the `R` channel.
	- **Example from Your Code (`src/services/AdminService/interface.ts`):**

		```typescript
        // EFFECTFUL: This method needs the FalcaoHttpClient service.
        clearCache: (cacheGroup?: string) => {
          return httpClient.postWithSchema(...) // httpClient is a dependency
        }
        ```

5. **Resource Management:**
	- **What it is:** Logic that needs to acquire and later release a resource (e.g., a file handle, a database connection pool).
	- **Why:** To guarantee that the `release` action runs even in the presence of errors or interruptions, you must use a scoped effect like `Effect.acquireRelease`. This requires the function to be effectful and have `Scope` in its `R` channel.

6. **Concurrency, Scheduling, and Timeouts:**
	- **What it is:** Any logic involving `Effect.fork`, `Effect.race`, `Effect.retry`, `Effect.timeout`, etc.
	- **Why:** These are all advanced control flow mechanisms built into the Effect runtime. By definition, they operate on `Effect` values and thus require your functions to be effectful.

### The Hybrid Approach: Pure Logic within an Effectful Context

The most powerful and idiomatic pattern in Effect is using pure functions *inside* of your effectful functions. This gives you the best of both worlds.

```typescript
import { Effect } from "effect"

// Pure function for the core logic
const calculateDiscount = (price: number, percent: number): number => {
  if (percent < 0 || percent > 100) return price // Pure validation
  return price * (1 - percent / 100)
}

// Effectful function for the workflow
const applyDiscountToProduct = (productId: string, discountCode: string) =>
  Effect.gen(function*() {
    // Effectful: DB call
    const product = yield* getProductFromDb(productId) 
    // Effectful: API call
    const discount = yield* getDiscountFromApi(discountCode)

    // PURE: Applying the core business logic
    const finalPrice = calculateDiscount(product.price, discount.percent) 

    // Effectful: DB call
    yield* saveFinalPriceToDb(productId, finalPrice)
    
    return finalPrice
  })
```

In this pattern:
- The complex, fallible, and asynchronous I/O operations are handled as `Effect`s.
- The simple, deterministic calculation is a pure function called directly within the `Effect.gen` block.

This is the recommended architecture. **Keep your core domain logic pure, and use effectful functions to orchestrate these pure pieces with side effects, dependencies, and failures.**
