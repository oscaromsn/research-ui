---
modified: 2025-10-26T20:30:19-03:00
---
## Simplified Schema Naming Conventions - Sweet Spot

### Core Principle: Three Simple Categories

#### Domain Models (No Suffix)
- **Plain names** - Core entities use simplest form (e.g., `User`, `Task`, `Order`)
- **Includes validation** - The schema IS the model with its rules built in
- **Type extraction** - `type User = typeof User.Type` when needed

#### Input/Output DTOs
- **`Create*`** - Creation inputs (e.g., `CreateUser`, `CreateTask`)
- **`Update*`** - Update inputs (e.g., `UpdateUser`, `UpdateTask`)
- **Everything else is context-obvious** - Response shapes can just be the model itself

#### Branded Primitives
- **`*Id`** - All identifiers are branded (e.g., `UserId`, `TaskId`)
- **Natural names** - Other branded types use obvious names (e.g., `Email`, `NonEmptyString`)

That's it. Just three patterns to remember.

### What We DON'T Need to Suffix

- **Filters** - Just use `{ status?: TaskStatus, userId?: UserId }` inline
- **Pagination** - Standard `{ page: number, limit: number }` everywhere
- **Responses** - Return the model or array of models directly
- **Validators** - Built into the schemas themselves

### Real-World Examples

```typescript
// Domain model - no suffix
const User = S.Struct({
  id: UserId,
  email: Email,
  name: S.NonEmptyString
})

// Input DTOs - operation prefix
const CreateUser = S.Struct({
  email: Email,
  name: S.NonEmptyString,
  password: S.String.pipe(S.minLength(8))
})

const UpdateUser = S.Struct({
  email: S.optional(Email),
  name: S.optional(S.NonEmptyString)
})

// Branded types - natural names
const UserId = S.UUID.pipe(S.brand('UserId'))
const Email = S.String.pipe(S.pattern(emailRegex), S.brand('Email'))
```

### Why This Works

- **Minimal cognitive load** - Only 3 patterns to remember
- **Self-documenting** - `CreateUser` obviously creates a user
- **Searchable** - `rg "Create\w+"` finds all creation DTOs
- **Flexible** - Add complexity only when truly needed
- **Consistent** - Same patterns across all domains

The key insight: most schemas don't need special suffixes because their context makes their purpose obvious.
