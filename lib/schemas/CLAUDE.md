# Zod Schema System

This directory contains the Zod schema system for validating data throughout the application.

## Structure

- **`index.ts`**: The main entry point that exports all schemas
- **`common.ts`**: Reusable schema components and type definitions
- **`env.ts`**: Environment variable validation
- **`utils.ts`**: Utility functions for schema validation

## Getting Started

Import schemas from the main entry point:

```typescript
import { string, number, parse } from '@/lib/schemas';
```

## Usage Patterns

### Simple Validations

```typescript
import { string } from '@/lib/schemas';

// Use predefined validators
const nameSchema = string.nonEmpty;
const emailSchema = string.email;

// Validate data
const isValidEmail = emailSchema.safeParse('user@example.com').success;
```

### Complex Schemas

```typescript
import { z } from 'zod';
import { string, number, createSchema } from '@/lib/schemas';

const userSchema = createSchema(z.object({
  id: z.string(),
  name: string.nonEmpty,
  email: string.email,
  age: number.positive
}));

// Get TypeScript type from schema
type User = z.infer<typeof userSchema.schema>;

// Validate with detailed error handling
const validUser = userSchema.parse(data, "Invalid user data");
```

### Schema Composition

```typescript
import { z } from 'zod';
import { string, object, transform } from '@/lib/schemas';

// Compose schemas
const addressSchema = z.object({
  street: string.nonEmpty,
  city: string.nonEmpty,
  zipCode: string.nonEmpty,
  country: string.nonEmpty
});

const userWithAddressSchema = z.object({
  name: string.nonEmpty,
  email: string.email,
  address: transform.optional(addressSchema)
});
```

### Environment Variable Validation

```typescript
import { env, publicEnv } from '@/lib/schemas';

// Type-safe access to validated environment variables
const nodeEnv = env.NODE_ENV;
```

## Adding New Schemas

1. Create new schema files in this directory
2. Export them from `index.ts`
3. Follow the patterns established in `common.ts`

## Best Practices

- Use schema composition to build complex schemas
- Use consistent error messages
- Add custom error messages for business-specific validations
- Use transform functions to modify data during validation
- Use schema inference for TypeScript types