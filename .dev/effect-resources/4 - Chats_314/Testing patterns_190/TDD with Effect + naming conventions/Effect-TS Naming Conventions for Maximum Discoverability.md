---
modified: 2025-10-26T20:24:13-03:00
---
## Effect-TS Naming Conventions for Maximum Discoverability

### Core Naming Patterns

```typescript
// Interface/Contract: Plain name
UserRepository              // The interface/tag
UserRepositoryInterface     // The interface type (optional suffix for clarity)

// Implementations: Descriptive suffixes
UserRepositoryLive          // Production implementation
UserRepositoryTest          // Test implementation  
UserRepositoryInMemory      // In-memory implementation
UserRepositoryPostgres      // Postgres implementation
UserRepositoryDynamoDB      // DynamoDB implementation

// Layers: Match implementation names
UserRepositoryLive          // Layer providing UserRepositoryLive
UserRepositoryTest          // Layer providing UserRepositoryTest

// Shapes/Schemas: Shape suffix
UserShape                   // Schema definition
CreateUserShape             // Input validation schema
UpdateUserShape             // Update validation schema

// Errors: Error suffix
UserNotFoundError           // Domain errors
InvalidUserDataError        // Validation errors
UserConcurrentUpdateError   // Concurrency errors
```

### Searchable Patterns with ripgrep

```bash
# Find all interfaces/tags for a domain
rg "class \w+Repository extends Context.Tag"
rg "interface \w+RepositoryInterface"

# Find all production implementations
rg "\w+Live ="
rg "export const \w+Live"

# Find all test implementations
rg "\w+Test ="
rg "\w+InMemory ="

# Find where a service is provided
rg "Layer.succeed\(UserRepository"
rg "Layer.effect\(UserRepository"
rg "Layer.scoped\(UserRepository"

# Find all schemas/shapes
rg "\w+Shape ="
rg "S.Struct\(.*Shape"

# Find all errors
rg "class \w+Error extends"
rg "TaggedError\('\w+Error'\)"

# Find service dependencies
rg "yield\* UserRepository"
rg "Effect.Tag.*UserRepository"
```

### Comprehensive File Organization

```typescript
// src/domains/users/repository.ts
export interface UserRepositoryInterface {
  findById: (id: UserId) => Effect.Effect<User, UserNotFoundError>
  create: (data: CreateUserShape) => Effect.Effect<User, DuplicateUserError>
}

export class UserRepository extends Context.Tag('UserRepository')
  UserRepository,
  UserRepositoryInterface
>() {}

// src/domains/users/repository.live.ts
export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseClient
    return UserRepository.of({
      findById: (id) => // implementation
      create: (data) => // implementation
    })
  })
)

// src/domains/users/repository.test.ts
export const UserRepositoryTest = Layer.succeed(
  UserRepository,
  UserRepository.of({
    findById: (id) => Effect.fail(new UserNotFoundError({ userId: id })),
    create: (data) => Effect.succeed(testUser)
  })
)

// src/domains/users/repository.memory.ts
export const UserRepositoryInMemory = Layer.effect(
  UserRepository,
  Effect.sync(() => {
    const store = new Map<UserId, User>()
    return UserRepository.of({
      findById: (id) => // in-memory implementation
      create: (data) => // in-memory implementation
    })
  })
)
```

### Schema/Shape Naming

```typescript
// src/domains/users/shapes.ts

// Base model shape
export const UserShape = S.Struct({
  id: UserIdShape,
  email: EmailShape,
  name: S.NonEmptyString,
  createdAt: S.Date,
  updatedAt: S.Date
})
export type User = S.Schema.Type<typeof UserShape>

// Input shapes for operations
export const CreateUserShape = S.Struct({
  email: EmailShape,
  name: S.NonEmptyString,
  password: PasswordShape
})
export type CreateUserInput = S.Schema.Type<typeof CreateUserShape>

export const UpdateUserShape = S.Struct({
  email: S.optional(EmailShape),
  name: S.optional(S.NonEmptyString)
})
export type UpdateUserInput = S.Schema.Type<typeof UpdateUserShape>

// Branded type shapes
export const UserIdShape = S.UUID.pipe(S.brand('UserId'))
export type UserId = S.Schema.Type<typeof UserIdShape>

export const EmailShape = S.String.pipe(
  S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  S.brand('Email')
)
export type Email = S.Schema.Type<typeof EmailShape>
```

### Service Layer Naming

```typescript
// src/domains/users/service.ts
export interface UserServiceInterface {
  register: (input: CreateUserShape) => Effect.Effect<User, RegistrationError>
  authenticate: (credentials: CredentialsShape) => Effect.Effect<AuthToken, AuthenticationError>
}

export class UserService extends Context.Tag('UserService')
  UserService,
  UserServiceInterface
>() {}

// src/domains/users/service.live.ts
export const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const repository = yield* UserRepository
    const emailer = yield* EmailService
    
    return UserService.of({
      register: (input) => // implementation
      authenticate: (credentials) => // implementation
    })
  })
)

// src/domains/users/service.test.ts
export const UserServiceTest = Layer.succeed(
  UserService,
  UserService.of({
    register: () => Effect.succeed(testUser),
    authenticate: () => Effect.succeed(testToken)
  })
)
```

### Error Naming Conventions

```typescript
// src/domains/users/errors.ts

// Domain-specific errors
export class UserNotFoundError extends Data.TaggedError('UserNotFoundError')<{
  readonly userId: UserId
}> {}

export class DuplicateUserError extends Data.TaggedError('DuplicateUserError')<{
  readonly email: Email
}> {}

// Operation-specific errors
export class RegistrationError extends Data.TaggedError('RegistrationError')<{
  readonly reason: 'email_taken' | 'invalid_data' | 'service_unavailable'
  readonly details?: unknown
}> {}

// Union types for error channels
export type UserRepositoryError = 
  | UserNotFoundError 
  | DuplicateUserError

export type UserServiceError = 
  | UserRepositoryError 
  | RegistrationError
  | AuthenticationError
```

### Configuration and Client Naming

```typescript
// External service clients
export const HttpClientLive = Layer.scoped(/* ... */)
export const HttpClientTest = Layer.succeed(/* ... */)

// Database clients
export const PostgresClientLive = Layer.scoped(/* ... */)
export const PostgresClientTest = Layer.succeed(/* ... */)

// Configuration
export const ConfigLive = Layer.effect(/* ... */)
export const ConfigTest = Layer.succeed(/* ... */)
```

### Layer Composition Naming

```typescript
// src/applications/api/layers.ts

// Development layers
export const DevelopmentStack = Layer.mergeAll(
  UserRepositoryInMemory,
  OrderRepositoryInMemory,
  EmailServiceTest,
  ConfigTest
)

// Production layers
export const ProductionStack = Layer.mergeAll(
  UserRepositoryLive,
  OrderRepositoryLive,
  EmailServiceLive,
  ConfigLive
)

// Test layers with specific behaviors
export const SlowNetworkTestStack = Layer.mergeAll(
  UserRepositoryTest,
  HttpClientSlow,  // Simulates slow network
  EmailServiceTest
)

export const FailingPaymentTestStack = Layer.mergeAll(
  OrderRepositoryInMemory,
  PaymentGatewayFailing,  // Always fails
  EmailServiceTest
)
```

### Advanced Patterns

#### Shadow/Spy Services

```typescript
// Test services that wrap and monitor real services
export const UserRepositorySpy = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const underlying = yield* UserRepositoryInMemory
    const calls = yield* Ref.make<Array<string>>([])
    
    return UserRepository.of({
      findById: (id) => {
        yield* Ref.update(calls, (c) => [...c, `findById:${id}`])
        return underlying.findById(id)
      }
      // ... other methods
    })
  })
)

// Audit services
export const UserServiceAudited = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const service = yield* UserServiceLive
    const audit = yield* AuditLog
    
    return UserService.of({
      register: (input) => {
        const result = yield* service.register(input)
        yield* audit.log('user.registered', { userId: result.id })
        return result
      }
    })
  })
)
```

#### Mock Variations

```typescript
// Different test scenarios
export const UserRepositoryEmpty = Layer.succeed(/* always empty */)
export const UserRepositoryFull = Layer.succeed(/* always at capacity */)
export const UserRepositoryFlaky = Layer.succeed(/* randomly fails */)
export const UserRepositorySlow = Layer.succeed(/* adds delays */)
```

### Quick Reference Cheatsheet

```bash
# Service Discovery Cheat Sheet

# What interfaces exist?
rg "class \w+ extends Context.Tag"

# What shapes/schemas exist?
rg "\w+Shape ="

# What errors can occur?
rg "Error extends Data.TaggedError"

# Where is X service provided?
rg "Layer\.(succeed|effect|scoped)\(ServiceName"

# What implementations exist for X?
rg "const \w*ServiceName\w* ="

# What are the dependencies of X?
rg "yield\* \w+" path/to/service.live.ts

# Find all test doubles
rg "\w+(Test|InMemory|Fake|Mock|Stub) ="

# Find all production implementations
rg "\w+Live ="

# Find layer compositions
rg "Layer.mergeAll|Layer.provide"
```

### IDE Integration

```json
// .vscode/settings.json
{
  "search.exclude": {
    "**/*.impl.ts": false,
    "**/*.live.ts": false,
    "**/*.test.ts": false
  },
  "files.associations": {
    "*.live.ts": "typescript",
    "*.test.ts": "typescript",
    "*.shape.ts": "typescript"
  }
}
```

### Enforcement via Linting

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'naming-convention': [
      'error',
      {
        selector: 'variable',
        filter: {
          regex: '^.*Repository$',
          match: true
        },
        format: ['PascalCase']
      },
      {
        selector: 'variable',
        filter: {
          regex: '^.*Shape$',
          match: true
        },
        format: ['PascalCase']
      },
      {
        selector: 'class',
        filter: {
          regex: '^.*Error$',
          match: true
        },
        format: ['PascalCase']
      }
    ]
  }
}
```

This naming convention system provides:

1. **Instant recognition** - You know what something is by its name
2. **Easy search** - Simple patterns find exactly what you need
3. **Clear relationships** - Implementation names match their interfaces
4. **Predictable locations** - Files follow naming patterns
5. **Tool-friendly** - Works with grep, IDE search, and static analysis

The key insight is that consistent suffixes (`Live`, `Test`, `Shape`, `Error`) create a searchable, self-documenting codebase where finding anything is just a ripgrep away.
