---
modified: 2025-09-18T00:53:09-03:00
---
# Testing the Easy and Hard Stuff with Effect
## By Edouard Penin - Effect Days 2025

### Executive Summary
Edouard Penin presents four essential patterns ("receipts") for testing Effect applications, progressing from zero tests to confidently handling complex scenarios. The presentation demonstrates practical approaches to testing failures, manipulating time, and creating test-specific service implementations ("shadow services"). Through concise examples using a user repository and deployment freeze service, the talk shows how Effect's testing utilities enable developers to test scenarios that are traditionally difficult, such as time-dependent behavior and service interactions, with minimal boilerplate.

---

## Part 1: The Universal Test Template

### The Four-Step Structure

Every Effect test follows the same reliable pattern:

```typescript
test("description", async () => {
  await Effect.gen(function* () {
    // Test code goes here
  }).pipe(
    Effect.provide(/* dependencies if needed */),
    Effect.runPromise
  )
})
```

#### The Steps Explained

1. **Declare the test**: Use any test framework (Jest, Vitest, etc.)
2. **Gen**: All test code lives in the generator function
3. **Provide**: Supply required dependencies if any
4. **Run**: Execute the Effect (typically with `runPromise`)

> "Gen, provide, run promise, nothing fancy, but it's easy to parse visually, and it gives you a reliable structure."

#### Real Implementation Example

From the repository's `failure.spec.ts`:

```typescript
test(`Creates user`, () =>
  pipe(
    Effect.gen(function* () {
      const result = yield* pipe(
        UserRepository.create(user),
        Effect.zipRight(UserRepository.list),
      )
      expect(result).toStrictEqual<typeof result>([user])
    }),
    Effect.provide(LiveInMemoryUserRepository),
    Effect.runPromise,
  ))
```

This pattern provides:

- **Visual Consistency**: Easy to scan and understand at a glance
- **Framework Agnostic**: Works with any test runner
- **Predictable**: Every test has the same shape
- **Composable**: Dependencies can be layered as needed

## Part 2: Testing Failures - All Kinds of Failures

### The Challenge

When testing Effect code, we often need to verify that operations fail correctly. But how do we catch and assert on failures without crashing the test?

### The Solution: Effect.exit

### Understanding Exit

The `Effect.exit` combinator transforms any Effect into one that:
- **Always succeeds**: Even if the original Effect failed, died, or was interrupted
- **Returns Exit data type**: Contains the completion status and data
- **Prevents test crashes**: Failures are captured, not thrown

### Example - Testing User Repository Failures

- **Scenario**: Duplicate user creation
- **Technique**: Effect.exit to capture failure
- **Assertion**: Exit.isFailure and error type checking

#### Step 1: Define Your Domain and Errors

From `failure.ts`:

```typescript
export class User extends Data.Class<{
  name: string
}> {}

export class DuplicateUser extends Data.TaggedClass("DuplicateUser")<{
  name: string
}> {}

export class UserRepository extends Effect.Tag("UserRepository")<
  UserRepository,
  {
    list: Effect.Effect<User[]>
    create: (user: User) => Effect.Effect<void, DuplicateUser>
  }
>() {}
```

#### Step 2: Trigger the Failure Condition

```typescript
// Create user first time - succeeds
yield* UserRepository.create(user)

// Create same user again - should fail
const result = yield* Effect.exit(
  UserRepository.create(user)
)
```

**Key insight**: `Effect.exit` captures the failure without crashing the test.

#### Step 3: Assert on Exit Status

```typescript
expect(result).toStrictEqual(
  Exit.fail(new DuplicateUser({ name: user.name }))
)
```

Different assertions for different failure modes:

```typescript
// Test expected errors
Exit.isFailure(exit)  // Effect failed with an error

// Test defects (unexpected errors)
Exit.isDie(exit)      // Effect died with a defect

// Test interruptions
Exit.isInterrupted(exit)  // Effect was interrupted

// Test success
Exit.isSuccess(exit)  // Effect succeeded
```

### Complete Test Implementation

Complete test implementation from `failure.spec.ts`:

```typescript
test(`Cannot create a duplicate user`, () =>
  pipe(
    Effect.gen(function* () {
      yield* UserRepository.create(user)
      
      const result = yield* Effect.exit(UserRepository.create(user))
      
      expect(result).toStrictEqual(
        Exit.fail(new DuplicateUser({ name: user.name })),
      )
    }),
    Effect.provide(LiveInMemoryUserRepository),
    Effect.runPromise,
  ))
```

### Test Repository Implementation

The in-memory test implementation shows how to create testable services:

```typescript
const LiveInMemoryUserRepository = Layer.effect(
  UserRepository,
  Effect.sync(() => {
    const users: User[] = []
    return UserRepository.of({
      list: Effect.sync(() => users),
      create: user =>
        pipe(
          users,
          Array.findFirst(u => u.name === user.name),
          Option.match({
            onSome: () => Effect.fail(new DuplicateUser({ name: user.name })),
            onNone: () => Effect.sync(() => users.push(user)),
          }),
        ),
    })
  }),
)
```

Key patterns:

- **Stateful test services**: Using closure to maintain state
- **Error simulation**: Conditional failure based on state
- **Type-safe failures**: Using tagged errors for discrimination

This pattern allows testing the unhappy paths without complex try-catch blocks or test framework-specific error handling.

---

## Part 3: Manipulating Time in Tests

### The Problem

Testing time-dependent behavior is traditionally difficult:
- Timeouts need to expire
- Scheduled tasks need to trigger
- Rate limiting needs to reset

### The Solution: TestClock

#### Providing TestClock

```typescript
import { TestContext } from "@effect/vitest"

// In the test
Effect.provide(TestContext.TestContext)
```

#### Time Adjustment

```typescript
// Move time forward by duration
yield* TestClock.adjust(Duration.minutes(10))

// Set absolute time
yield* TestClock.setTime(Date.now())
```

> "Three lines to master time in Effect. Pretty cool."

#### Critical Behavior

> "When using the test clock, time is frozen, it starts at zero and stays at zero unless you change it manually."

Important characteristics:
- **Time starts at 0**: Not current system time
- **Time is frozen**: Doesn't advance automatically
- **Manual control**: Only changes when you adjust it
- **Persists**: Stays at new time until adjusted again

### Example - Testing Deployment Freeze Timeout
- **Scenario**: Freeze expires after duration
- **Technique**: TestClock.adjust to advance time
- **Challenge**: Blocking operations handled with fork/join

### Service Definition

From `time.ts`:

```typescript
export class Freeze extends Effect.Tag("Freeze")<
  Freeze,
  {
    start(params: { timeout: Duration.Duration }): Effect.Effect<void>
    isFrozen: Effect.Effect<boolean>
  }
>() {}
```

### Testing Non-Blocking Time Operations - Fork pattern

#### Step 1: Set Up Dependencies

```typescript
const dependencies = Layer.mergeAll(
  LiveNonBlockingInMemoryFreeze,
  TestContext.TestContext,  // Provides TestClock
)
```

#### Step 2: Start Time-Dependent Operation

```typescript
yield* Freeze.start({ timeout: Duration.minutes(10) })
```

#### Step 3: Manipulate Time

```typescript
// Move time forward
yield* TestClock.adjust(Duration.minutes(10))

// Or set absolute time
yield* TestClock.setTime(Date.now())
```

#### Step 4: Assert on Results

Complete implementation from `time.spec.ts`:

```typescript
describe(`Non blocking`, () => {
  const dependencies = Layer.mergeAll(
    LiveNonBlockingInMemoryFreeze,
    TestContext.TestContext,
  )
  const timeout = Duration.minutes(10)

  test(`Freeze expires automatically after timeout`, () =>
    pipe(
      Effect.gen(function* () {
        yield* Freeze.start({ timeout })
        yield* TestClock.adjust(timeout)
        expect(yield* Freeze.isFrozen).toBe(false)
      }),
      Effect.provide(dependencies),
      Effect.runPromise,
    ))
})
```

### Blocking Time Tests with Fork

The repository shows the fork pattern for blocking operations:

```typescript
test(`Freeze expires automatically after timeout`, () =>
  pipe(
    Effect.gen(function* () {
      const fiber = yield* pipe(
        Freeze.start({ timeout }),
        Effect.exit,
        Effect.fork
      )
      
      yield* TestClock.adjust(timeout)
      
      expect(yield* Freeze.isFrozen).toBe(false)
      expect(yield* Fiber.join(fiber)).toStrictEqual(Exit.void)
    }),
    Effect.provide(dependencies),
    Effect.runPromise,
  ))
```

### Two Different Freeze Implementations

#### Non-Blocking Implementation

```typescript
const LiveNonBlockingInMemoryFreeze = Layer.effect(
  Freeze,
  Effect.sync(() => {
    let expiresAt: undefined | number
    return Freeze.of({
      start: params =>
        pipe(
          Clock.currentTimeMillis,
          Effect.map(now => now + Duration.toMillis(params.timeout)),
          Effect.tap(expiry =>
            Effect.sync(() => {
              expiresAt = expiry
            }),
          ),
        ),
      isFrozen: pipe(
        Clock.currentTimeMillis,
        Effect.map(now => expiresAt !== undefined && now < expiresAt),
      ),
    })
  }),
)
```

#### Blocking Implementation

```typescript
const LiveBlockingInMemoryFreeze = Layer.effect(
  Freeze,
  Effect.sync(() => {
    let active = false
    return Freeze.of({
      start: params =>
        pipe(
          Effect.sync(() => (active = true)),
          Effect.zipRight(Effect.never),
          Effect.timeoutOption(params.timeout),
          Effect.tap(() => (active = false)),
          Effect.asVoid,
        ),
      isFrozen: Effect.sync(() => active),
    })
  }),
)
```

Key techniques:

- **Non-blocking**: Uses timestamps and Clock service
- **Blocking**: Uses `Effect.never` with timeout
- **Fork pattern**: Essential for testing blocking operations
---

## Part 4: Shadow Services - Testing from the Shadows

### The Concept

> "I call that a shadow service because it runs things from the shadows while no one is aware of its existence."

A shadow service:
- **Overrides** production services transparently
- **Extends** functionality for testing
- **Maintains** the original interface
- **Adds** test-specific operations

#### Key Benefits

1. **Production code unchanged**: No test hooks in production
2. **Type safe**: Full TypeScript support
3. **Transparent**: Services don't know about test implementation
4. **Powerful**: Can track calls, verify behavior, inject failures

### Example - Testing Email Service Behavior

- **Scenario**: Verify emails not sent to paying customers
- **Technique**: Shadow service with tracking capabilities
- **Implementation**: Shared instance between services

### Domain Model

From `shadow-services.ts`:

```typescript
export type EmailAddress = Brand.Branded<string, "EMAIL_ADDRES">
export const makeEmailAddress = Brand.nominal<EmailAddress>()

class Mailable<A> extends Data.Class<{
  subject: string
  body: string
  variables: Schema.Schema<A>
}> {}

export class Email<A> extends Data.Class<{
  mailable: Mailable<A>
  recipient: EmailAddress
  variables: A
}> {}

export class Mailer extends Effect.Tag("Mailer")<
  Mailer,
  { sendEmail(email: Email<any>): Effect.Effect<void> }
>() {}
```

### Business Logic to Test

The complete email sending logic:

```typescript
const BuySubscriptionMailable = new Mailable({
  subject: "Buy subscription",
  body: "Pretty please",
  variables: Schema.Void,
})

export const sendBuySubscriptionEmail = pipe(
  UserRepository.list,
  Effect.flatMap(users =>
    pipe(
      users,
      Array.filter(u => !u.hasSubscription),
      Array.map(
        u =>
          new Email({
            mailable: BuySubscriptionMailable,
            recipient: u.email,
            variables: undefined,
          }),
      ),
      Effect.forEach(email => Mailer.sendEmail(email)),
    ),
  ),
)
```

### Creating a Shadow Service: Step-by-Step

#### Step 1: Define the Test Service

From `shadow-services.spec.ts`:

```typescript
class TestMailer extends Effect.Tag("TestMailer")<
  TestMailer,
  {
    sentEmailTo: (email: EmailAddress) => Effect.Effect<boolean>
  } & Context.Tag.Service<Mailer>
>() {}
```

**Key points:**

- Extends the original Mailer interface with `& Context.Tag.Service<Mailer>`
- Adds test-specific operation `sentEmailTo` for assertions
- Both services will share the same instance

#### Step 2: Create the Implementation with State Tracking

```typescript
const makeTestMailer = Effect.sync(() => {
  const sentMails: Email<any>[] = []
  return TestMailer.of({
    // Original Mailer operation
    sendEmail: email => Effect.sync(() => sentMails.push(email)),
    // Test-specific operation
    sentEmailTo: email =>
      Effect.sync(() => sentMails.some(mail => mail.recipient === email)),
  })
})
```

**Implementation details:**

- Uses closure to maintain state (`sentMails` array)
- Implements both original and test-specific operations
- Tracks all emails sent for later verification

#### Step 3: Create Shared Instance Layer

```typescript
const LiveTestMailer = Layer.unwrapEffect(
  pipe(
    makeTestMailer,
    Effect.map(fakeMailer =>
      Layer.mergeAll(
        Layer.succeed(Mailer, fakeMailer),
        Layer.succeed(TestMailer, fakeMailer),
      ),
    ),
  ),
)
```

**Critical insight:**

> "Since they share the same instance, any change in one would be reflected in the other."

This ensures:

- State consistency between services
- Transparent operation tracking
- No synchronization issues

#### Step 4: Use in Tests

Complete test implementations:

```typescript
test(`Sends email to non paying users`, () =>
  pipe(
    Effect.gen(function* () {
      yield* UserRepository.create(nonSubscribedUser)
      yield* sendBuySubscriptionEmail
      
      expect(yield* TestMailer.sentEmailTo(nonSubscribedUser.email)).toBe(
        true,
      )
    }),
    Effect.provide(
      Layer.mergeAll(LiveInMemoryUserRepository, LiveTestMailer),
    ),
    Effect.runPromise,
  ))

test(`Doesn't send "buy subscription" email to paid users`, () =>
  pipe(
    Effect.gen(function* () {
      yield* UserRepository.create(subscribedUser)
      yield* sendBuySubscriptionEmail
      
      expect(yield* TestMailer.sentEmailTo(subscribedUser.email)).toBe(false)
    }),
    Effect.provide(
      Layer.mergeAll(LiveInMemoryUserRepository, LiveTestMailer),
    ),
    Effect.runPromise,
  ))
````

Key patterns demonstrated:

- **Shared instance**: Both services use same object
- **State tracking**: Array of sent emails for verification
- **Type intersection**: `& Context.Tag.Service<Mailer>` for compatibility
- **Test-specific methods**: `sentEmailTo` for assertions

---

## Part 5: Advanced Patterns

### Type-Safe Test Assertions

Using TypeScript's strict equality:

```typescript
expect(result).toStrictEqual<typeof result>([user])
```

This ensures both runtime and compile-time correctness.

### Branded Types for Domain Safety

```typescript
export type EmailAddress = Brand.Branded<string, "EMAIL_ADDRES">
export const makeEmailAddress = Brand.nominal<EmailAddress>()
```

Using branded types prevents primitive type confusion in tests.

### Proper Error Assertions

```typescript
// Specific error type checking
const exit = yield* Effect.exit(operation)
if (Exit.isFailure(exit)) {
  const error = Cause.failureOption(exit.cause)
  expect(error).toBeInstanceOf(SpecificError)
  expect(error?.message).toContain("expected text")
}

// Multiple error handling
Effect.catchTags({
  ErrorTypeA: (e) => assertErrorA(e),
  ErrorTypeB: (e) => assertErrorB(e)
})
```

### Test Organization

#### Consistent Structure

```typescript
describe("UserRepository", () => {
  const dependencies = Layer.mergeAll(
    DatabaseTestLayer,
    LoggerTestLayer,
    // Common dependencies
  )
  
  test("create - success case", async () => {
    await Effect.gen(function* () {
      // Test specific logic
    }).pipe(
      Effect.provide(dependencies),
      Effect.runPromise
    )
  })
})
```

#### Dependency Reuse
- Define common dependencies once
- Compose with test-specific layers
- Override as needed per test

### Layer Composition Patterns

The repository shows effective layer composition:

```typescript
// Merging multiple test layers
Effect.provide(
  Layer.mergeAll(
    LiveInMemoryUserRepository,
    LiveTestMailer,
    TestContext.TestContext
  ),
)
```

### Schema Integration

The repository uses Effect Schema for validation:

```typescript
class Mailable<A> extends Data.Class<{
  subject: string
  body: string
  variables: Schema.Schema<A>
}> {}
```

---

## Part 6: Project Configuration

### Testing Setup

From `package.json`:

```typescript
{
  "scripts": {
    "test": "vitest"
  },
  "dependencies": {
    "effect": "^3.12.1",
    "typescript": "^5.7.2"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "@effect/vitest": "^0.16.1",
    "vitest": "^2.1.8"
  }
}
```

### TypeScript Configuration

Key settings from `tsconfig.json`:

- `"strict": true` - Full type safety
- `"target": "ESNext"` - Modern JavaScript features
- `"exactOptionalPropertyTypes": true` - Precise optional handling
- `"noUncheckedIndexedAccess": true` - Safe array access

### Vitest Configuration

Simple setup in `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Minimal configuration needed
  }
})
```

---

## Key Implementation Insights

### 1. State Management in Tests

The repository consistently uses closure-based state:

```typescript
const users: User[] = []  // Shared state in closure
return {
  list: Effect.sync(() => users),
  create: user => Effect.sync(() => users.push(user))
}
```

### 2. Effect.pipe vs Method Chaining

The repository uses both styles appropriately:

- `pipe` for complex compositions
- Method chaining for simple operations

### 3. Layer.unwrapEffect Pattern

Used for dynamic layer creation:

```typescript
Layer.unwrapEffect(
  Effect.map(instance => 
    Layer.mergeAll(/* multiple layers */)
  )
)
```

### 4. TestContext.TestContext

Consistently provided for all time-based tests, containing TestClock and other test utilities.

---

## Key Takeaways

### The Four Receipts

1. **Universal Template**: Gen → Provide → RunPromise
2. **Failure Testing**: Effect.exit for all failure modes
3. **Time Manipulation**: TestClock for deterministic timing
4. **Shadow Services**: Test-specific service implementations

### Philosophy

The presentation emphasizes practical, reusable patterns over complex testing theory. Each pattern:
- Solves a specific testing challenge
- Uses minimal code
- Maintains production code integrity
- Provides deterministic results

### The Complete Testing Toolkit

1. **Effect.exit**: Capture any failure mode safely
2. **TestClock**: Deterministic time control
3. **Shadow Services**: Transparent test doubles
4. **Layer composition**: Clean dependency management

### Best Practices from the Code

1. **Single Responsibility**: Each test focuses on one behavior
2. **Clear Naming**: Test names describe exact scenarios
3. **Minimal Setup**: Only required dependencies provided
4. **Type Safety**: Leveraging TypeScript throughout

---

## Resources and References

### Recommended Packages
- `@effect/vitest`: Enhanced Vitest integration for Effect
- `@effect/schema`: Schema validation in tests
- `TestContext`: Built-in test utilities

### Resources

- **Repository**: Complete working examples with all four patterns
- **Dependencies**: Effect 3.12.1+, Vitest 2.1.8+, @effect/vitest 0.16.1+
- **Author**: Edouard Penin (LinkedIn contact available)
