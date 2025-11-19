---
modified: 2025-10-26T20:47:39-03:00
---
# Effect according to DRY, SOLID principles

## Layer-Based Architecture

Effect's Layer system is fundamental for establishing clear boundaries. Layers allow you to compose your application's dependencies while maintaining strict separation:

```typescript
// Domain layer - pure business logic
const BusinessLogicLayer = Layer.succeed(
  BusinessLogic,
  BusinessLogic.of({
    calculateDiscount: (price, tier) => 
      tier === "premium" ? price * 0.8 : price * 0.95
  })
)

// Infrastructure layer - external dependencies
const DatabaseLayer = Layer.scoped(
  Database,
  Effect.acquireRelease(
    connectToDb(),
    (conn) => Effect.promise(() => conn.close())
  )
)

// Application layer - orchestration
const AppLayer = Layer.merge(BusinessLogicLayer, DatabaseLayer)
```

This approach enforces the Dependency Inversion Principle (the "D" in SOLID) by having high-level modules depend on abstractions rather than concrete implementations.

## Service Pattern for Single Responsibility

Each service should have a single, well-defined responsibility:

```typescript
// User repository service - only handles data access
class UserRepository extends Context.Tag("UserRepository")
  UserRepository,
  {
    readonly findById: (id: string) => Effect.Effect<User, UserNotFoundError>
    readonly save: (user: User) => Effect.Effect<void, DatabaseError>
  }
>() {}

// User validation service - only handles validation logic
class UserValidator extends Context.Tag("UserValidator")
  UserValidator,
  {
    readonly validate: (data: unknown) => Effect.Effect<User, ValidationError>
  }
>() {}

// User service - orchestrates but doesn't implement details
class UserService extends Context.Tag("UserService")
  UserService,
  {
    readonly createUser: (data: unknown) => Effect.Effect<User, CreateUserError>
  }
>() {
  static Live = Layer.effect(
    UserService,
    Effect.gen(function* () {
      const repo = yield* UserRepository
      const validator = yield* UserValidator
      
      return {
        createUser: (data) =>
          pipe(
            validator.validate(data),
            Effect.flatMap(repo.save)
          )
      }
    })
  )
}
```

## Interface Segregation Through Tagged Services

Effect's tagged services naturally implement Interface Segregation:

```typescript
// Instead of one large interface, split into focused services
class ReadOperations extends Context.Tag("ReadOps")
  ReadOperations,
  {
    readonly find: (id: string) => Effect.Effect<Entity>
    readonly list: (filter: Filter) => Effect.Effect<Entity[]>
  }
>() {}

class WriteOperations extends Context.Tag("WriteOps")
  WriteOperations,
  {
    readonly create: (data: CreateDTO) => Effect.Effect<Entity>
    readonly update: (id: string, data: UpdateDTO) => Effect.Effect<Entity>
  }
>() {}

// Clients only depend on what they need
const readOnlyHandler = Effect.gen(function* () {
  const read = yield* ReadOperations
  return yield* read.list(filter)
})
```

## DRY Through Effect Combinators and Pipelines

Avoid repetition by extracting common patterns into reusable Effect pipelines:

```typescript
// Create reusable error handling patterns
const withRetry = <R, E, A>(
  effect: Effect.Effect<A, E, R>,
  policy: Schedule.Schedule<any, E, R>
) => Effect.retry(effect, policy)

const withLogging = <R, E, A>(
  operation: string,
  effect: Effect.Effect<A, E, R>
) =>
  pipe(
    effect,
    Effect.tap(() => Effect.log(`Starting ${operation}`)),
    Effect.tapError((e) => Effect.log(`Failed ${operation}: ${e}`)),
    Effect.tap(() => Effect.log(`Completed ${operation}`))
  )

// Compose reusable behaviors
const resilientOperation = <R, E, A>(
  name: string,
  effect: Effect.Effect<A, E, R>
) =>
  pipe(
    effect,
    withLogging(name),
    withRetry(Schedule.exponential("100 millis"))
  )
```

## Boundary Definition with Branded Types

Use branded types to enforce boundaries at the type level:

```typescript
// Domain boundary - internal representation
type UserId = string & Brand.Brand<"UserId">
const UserId = Brand.nominal<UserId>()

// API boundary - external representation  
type ApiUserId = string & Brand.Brand<"ApiUserId">
const ApiUserId = Brand.nominal<ApiUserId>()

// Explicit conversion at boundaries
const toInternalId = (apiId: ApiUserId): Effect.Effect<UserId> =>
  pipe(
    Effect.succeed(apiId),
    Effect.map(id => UserId(id.toLowerCase()))
  )

const toApiId = (userId: UserId): ApiUserId =>
  ApiUserId(userId.toUpperCase())
```

## Open/Closed Principle Through Effect Composition

Design services to be open for extension but closed for modification:

```typescript
// Base behavior
const baseProcessor = <A>(data: A) =>
  Effect.succeed(data)

// Extend through composition, not modification
const enhancedProcessor = <A>(data: A) =>
  pipe(
    baseProcessor(data),
    Effect.tap(() => Effect.log("Processing")),
    Effect.map(result => ({ ...result, processed: true }))
  )

// Further extend without touching existing code
const validatedProcessor = <A>(
  data: A,
  validator: (a: A) => Effect.Effect<A, ValidationError>
) =>
  pipe(
    validator(data),
    Effect.flatMap(enhancedProcessor)
  )
```

## Testing Boundaries with Layer Composition

Effect's Layer system makes it easy to test boundaries by swapping implementations:

```typescript
// Production layer
const LiveEmailService = Layer.succeed(EmailService, {
  send: (email) => Effect.promise(() => sendgrid.send(email))
})

// Test layer  
const TestEmailService = Layer.succeed(EmailService, {
  send: (email) => Effect.sync(() => console.log(`Mock send: ${email}`))
})

// Your application code remains unchanged
const program = Effect.gen(function* () {
  const email = yield* EmailService
  yield* email.send({ to: "user@example.com", body: "Hello" })
})

// Test with mock
Effect.runPromise(Effect.provide(program, TestEmailService))

// Production with real service
Effect.runPromise(Effect.provide(program, LiveEmailService))
```

## Key Practices for Clean Boundaries

1. **Use Layers for dependency injection** - This enforces inversion of control and makes dependencies explicit
2. **Keep effects at the edges** - Pure functions in the core, Effect wrappers at boundaries
3. **Model errors as types** - Use discriminated unions for error handling across boundaries
4. **Leverage type-safe configuration** - Use Config module for environment-specific settings
5. **Create focused modules** - Each module should export a Layer with clearly defined services

By following these patterns, your Effect-TS application will have clear boundaries, proper separation of concerns, and remain maintainable as it scales. The type system and Effect's compositional nature naturally guide you toward SOLID principles while the functional approach helps eliminate duplication through composition rather than inheritance.
