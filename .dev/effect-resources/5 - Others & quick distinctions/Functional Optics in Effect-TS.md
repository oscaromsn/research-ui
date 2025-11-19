---
modified: 2025-10-26T21:36:56-03:00
---
## Functional Optics in Effect-TS

Effect-TS provides a sophisticated optics system through its `@effect/schema` package and core libraries, designed to work seamlessly with its effect system. Here's how they integrate:

## Core Concept in Effect-TS

In Effect-TS, optics are used to focus on parts of immutable data structures while maintaining the ability to track effects. The library provides optics that are "effect-aware" - they can perform effectful operations during traversal or modification.

## Key Components

### Schema-based Optics
Effect-TS generates optics from schemas, giving you type-safe accessors automatically:

```typescript
import { Schema } from "@effect/schema"
import { Optic } from "@effect/optic"

const User = Schema.Struct({
  name: Schema.String,
  address: Schema.Struct({
    street: Schema.String,
    city: Schema.String
  })
})

// Auto-generated optic to focus on nested fields
const cityOptic = Optic.id<User>()
  .at("address")
  .at("city")

// Pure modification
const updateCity = Optic.replace(cityOptic, "New York")
```

### Effectful Optics
The real power comes when combining optics with Effect's computation model:

```typescript
import { Effect, Ref } from "effect"

// Optic that performs effects during modification
const effectfulUpdate = (ref: Ref.Ref<User>) =>
  Effect.gen(function* (_) {
    // Log before modification
    yield* _(Effect.log("Updating city"))
    
    // Modify using optic within an effect
    yield* _(Ref.update(ref, 
      Optic.modify(cityOptic)(city => 
        city.toUpperCase()
      )
    ))
    
    // Validation effect
    const updated = yield* _(Ref.get(ref))
    yield* _(validateAddress(updated.address))
  })
```

## Effect-TS Specific Patterns

### Optional and Fallible Access
Effect-TS optics handle optional values using the `Option` type:

```typescript
const maybeStreetNumber = Optic.id<Address>()
  .at("street")
  .index(0)  // Returns Option<char>

// Compose with Effect for safe access
const getStreetNumber = (address: Address) =>
  Optic.getOption(maybeStreetNumber)(address).pipe(
    Effect.fromOption(() => new Error("No street number"))
  )
```

### Traversals with Effects
Traverse collections while performing effects:

```typescript
const users = Schema.Array(User)

const updateAllCities = (users: User[]) =>
  Effect.forEach(users, (user) =>
    Effect.gen(function* (_) {
      // Effect for each user
      yield* _(Effect.log(`Processing ${user.name}`))
      
      // External API call
      const newCity = yield* _(fetchCityFromAPI(user.id))
      
      return Optic.replace(cityOptic, newCity)(user)
    })
  )
```

### Ref-based State Management
Effect-TS heavily uses `Ref` for state, and optics integrate naturally:

```typescript
const appState = Ref.make({
  users: [],
  settings: { theme: "dark" }
})

const themeOptic = Optic.id<AppState>()
  .at("settings")
  .at("theme")

const toggleTheme = Ref.modify(appState,
  Optic.modify(themeOptic)(theme => 
    theme === "dark" ? "light" : "dark"
  )
)
```

## Advanced Patterns

### Polymorphic Optics
Optics that work across different effect contexts:

```typescript
const polyOptic = <R, E>(
  optic: Optic<User, string>
) => (
  effect: Effect.Effect<User, E, R>
) =>
  effect.pipe(
    Effect.map(Optic.get(optic)),
    Effect.flatMap(value =>
      // Can return different effect types
      Effect.succeed(value.toUpperCase())
    )
  )
```

### Optic Composition with Services
Integrate with Effect-TS's dependency injection:

```typescript
const UserService = Context.GenericTag<UserService>("UserService")

const updateUserCity = (userId: string, city: string) =>
  Effect.gen(function* (_) {
    const service = yield* _(UserService)
    const user = yield* _(service.getUser(userId))
    
    const updated = Optic.replace(cityOptic, city)(user)
    yield* _(service.saveUser(updated))
    
    return updated
  })
```

## Benefits in Effect-TS

1. **Type Safety**: Optics are fully typed with Effect's type system
2. **Effect Tracking**: All side effects remain visible in types
3. **Composability**: Both vertical (nested access) and horizontal (effect composition)
4. **Schema Integration**: Automatic optic generation from data schemas
5. **Resource Safety**: Optics work within Effect's resource management

This makes Effect-TS's optics particularly powerful for real-world applications where you need both immutable data manipulation and controlled side effects.
