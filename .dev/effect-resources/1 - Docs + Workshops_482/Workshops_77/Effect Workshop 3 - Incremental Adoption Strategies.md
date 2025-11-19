---
modified: 2025-11-03T03:39:30-03:00
---
# Effect Workshop 3 - Incremental Adoption Strategies
## Integrating Effect into Existing Applications (Effect Days 2025 Workshop - Part 2)

**Source**: Effect Days 2025 Workshop - Part 2
**Instructor**: Tim (Effect team)
**Focus**: Practical strategies for adopting Effect in existing codebases
**Core Theme**: You don't have to rewrite everything

---

## Table of Contents

1. [Incremental Adoption Philosophy](#incremental-adoption-philosophy)
2. [Holistic Thinking Framework](#holistic-thinking-framework)
3. [The Use Pattern: Wrapping Promise Libraries](#the-use-pattern-wrapping-promise-libraries)
4. [Effect.service: Unified Service Definition](#effectservice-unified-service-definition)
5. [Configuration Management](#configuration-management)
6. [Wrapping Paginated APIs with Streams](#wrapping-paginated-apis-with-streams)
7. [Specialized API Wrappers](#specialized-api-wrappers)
8. [Multi-Shot APIs: Callbacks & Events](#multi-shot-apis-callbacks--events)
9. [Fiber Management in Production](#fiber-management-in-production)
10. [Express Integration Patterns](#express-integration-patterns)
11. [React Integration Strategies](#react-integration-strategies)
12. [Effect RX: Reactive State Management](#effect-rx-reactive-state-management)

---

## Incremental Adoption Philosophy

### The Central Problem

> "I have this existing codebase, and I love Effect, but I have no idea how to get Effect into that codebase without rewriting everything."

**Reality**: You're already using other frameworks and libraries
- Express, Fastify, or other HTTP frameworks
- React, Vue, Svelte, or other frontend frameworks
- Promise-based libraries: Prisma, OpenAI SDK, AWS SDK, etc.
- Event-driven systems: WebSockets, message queues, etc.

### Key Insight: Existing Code Isn't "Holistic"

Most TypeScript codebases don't consider:

1. **Error Handling**: Errors aren't typed, often just `try/catch`
2. **Resource Management**: Manual cleanup, easy to leak resources
3. **Interruption**: AbortController is tedious and poorly supported
4. **Observability**: OpenTelemetry exists but is painful to use

**Effect makes all of these easy**, but you need strategies to bridge the gap.

### Adoption Strategy: Start Small

```typescript
// ❌ DON'T: Rewrite everything at once
// - Rewrite entire Express app to Effect
// - Migrate all database calls simultaneously
// - Change all React components together

// ✅ DO: Incremental migration
// - Wrap one NPM package at a time
// - Migrate one endpoint at a time
// - Convert one component at a time
// - Keep existing code running alongside Effect
```

**Benefits of Incremental Adoption**:
- ✅ Low risk - existing code keeps working
- ✅ Learn Effect gradually
- ✅ Immediate value from each migration
- ✅ Team can adopt at their own pace
- ✅ Rollback is easy

---

## Holistic Thinking Framework

Before wrapping any external library, ask these questions:

### 1. **Resource Management**
Does the library allocate resources that need cleanup?

```typescript
// Look for these methods:
client.close()
client.end()
client.dispose()
client.destroy()
connection.disconnect()
stream.unsubscribe()
```

**Action**: Use `Effect.acquireRelease` or `Layer.scoped`

### 2. **Interruption Support**
Does the library support cancellation?

```typescript
// Look for abort signal support:
fetch(url, { signal })
openai.chat.completions.create(params, { signal })
prisma.$transaction(..., { signal })
```

**Action**: Pass `signal` from Effect to library

### 3. **Error Handling**
What can go wrong? What errors can occur?

```typescript
// Create domain errors
class OpenAIError extends Data.TaggedError("OpenAIError")<{
  readonly cause: unknown;
}> {}

class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly statusCode: number;
}> {}
```

**Action**: Map library errors to domain errors

### 4. **Observability**
Should we trace this operation?

```typescript
// Add spans for tracing
Effect.withSpan("openai.completion")

// Or use Effect.fn for automatic spans
const createCompletion = Effect.fn(
  "openai.createCompletion",
  (params) => /* ... */
);
```

**Action**: Add spans with `Effect.withSpan` or `Effect.fn`

### Holistic Thinking Checklist

When wrapping any library:
- [ ] Check for resource cleanup methods
- [ ] Look for abort signal support
- [ ] Define domain error types
- [ ] Add observability spans
- [ ] Document what's being wrapped

---

## The Use Pattern: Wrapping Promise Libraries

### Pattern Overview

**Goal**: Wrap promise-based NPM packages efficiently without reimplementing every method

**Strategy**: Create a `use` method that transforms promise APIs into Effects

### The Use Pattern Signature

```typescript
interface SomeAPIClient {
  // External library interface
  method1: (arg: string) => Promise<Result>;
  method2: (arg: number) => Promise<OtherResult>;
  // ... many more methods
}

class MyService extends Context.Tag("app/MyService")<
  MyService,
  {
    // The use pattern
    readonly use: <A>(
      f: (client: SomeAPIClient) => Promise<A>
    ) => Effect.Effect<A, MyServiceError>;
  }
>() {}
```

**How it works**:
1. User passes function that uses the external client
2. Function returns a Promise
3. `use` method unwraps Promise into Effect
4. No need to wrap every single client method!

### Complete Example: OpenAI SDK

```typescript
import OpenAI from "openai";
import { Effect, Context, Config, Data } from "effect";

// 1. Define domain error
class OpenAIError extends Data.TaggedError("OpenAIError")<{
  readonly cause: unknown;
}> {}

// 2. Create service with use pattern
class OpenAIClient extends Context.Tag("app/OpenAI")<
  OpenAIClient,
  {
    readonly use: <A>(
      f: (client: OpenAI) => Promise<A>
    ) => Effect.Effect<A, OpenAIError>;
  }
>() {}

// 3. Implement service
const OpenAILive = Layer.effect(
  OpenAIClient,
  Effect.gen(function* () {
    // Get API key from config
    const apiKey = yield* Config.redacted("OPENAI_API_KEY");
    
    // Create client once
    const client = new OpenAI({
      apiKey: Config.Redacted.value(apiKey)
    });
    
    return OpenAIClient.of({
      // Implement use method
      use: (f) =>
        Effect.tryPromise({
          try: (signal) => f(client),
          catch: (cause) => new OpenAIError({ cause })
        })
    });
  })
);
```

### Using the Use Pattern

```typescript
const program = Effect.gen(function* () {
  const openai = yield* OpenAIClient;
  
  // Use method wraps OpenAI SDK calls
  const completion = yield* openai.use((client) =>
    client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hello!" }]
    })
  );
  
  console.log(completion.choices[0].message.content);
});
// Type: Effect<void, OpenAIError, OpenAIClient>
```

### Adding Interruption Support

```typescript
const OpenAILive = Layer.effect(
  OpenAIClient,
  Effect.gen(function* () {
    const apiKey = yield* Config.redacted("OPENAI_API_KEY");
    const client = new OpenAI({
      apiKey: Config.Redacted.value(apiKey)
    });
    
    return OpenAIClient.of({
      use: (f) =>
        Effect.tryPromise({
          try: (signal) => 
            // Pass signal to OpenAI SDK
            f(client, { signal }),
          catch: (cause) => new OpenAIError({ cause })
        })
    });
  })
);

// Now supports interruption
const program = Effect.gen(function* () {
  const openai = yield* OpenAIClient;
  
  const completion = yield* openai.use((client, options) =>
    client.chat.completions.create(
      {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello!" }]
      },
      options // Signal passed automatically
    )
  );
  
  return completion;
}).pipe(
  Effect.timeout("5 seconds") // Cancels OpenAI request on timeout!
);
```

### Adding Observability

```typescript
const OpenAILive = Layer.effect(
  OpenAIClient,
  Effect.gen(function* () {
    const apiKey = yield* Config.redacted("OPENAI_API_KEY");
    const client = new OpenAI({
      apiKey: Config.Redacted.value(apiKey)
    });
    
    return OpenAIClient.of({
      // Wrap use with Effect.fn for automatic tracing
      use: Effect.fn(
        "openai.use",
        <A>(f: (client: OpenAI, options?: { signal?: AbortSignal }) => Promise<A>) =>
          Effect.tryPromise({
            try: (signal) => f(client, { signal }),
            catch: (cause) => new OpenAIError({ cause })
          })
      )
    });
  })
);
```

### Adding Resource Management

If the client needs cleanup:

```typescript
const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const config = yield* Config;
    
    // Acquire connection with cleanup
    const pool = yield* Effect.acquireRelease(
      Effect.tryPromise(() => createPool(config.dbUrl)),
      (pool) => Effect.promise(() => pool.end())
    );
    
    return Database.of({
      use: <A>(f: (pool: Pool) => Promise<A>) =>
        Effect.tryPromise({
          try: (signal) => f(pool),
          catch: (cause) => new DatabaseError({ cause })
        })
    });
  })
);
```

### Use Pattern Variations

#### Synchronous Libraries

```typescript
// For sync libraries (like better-sqlite3)
const SQLiteLive = Layer.sync(
  SQLite,
  () => {
    const db = new Database("app.db");
    
    return SQLite.of({
      use: <A>(f: (db: Database) => A) =>
        Effect.try({
          try: () => f(db),
          catch: (cause) => new SQLiteError({ cause })
        })
    });
  }
);
```

#### Libraries with Multiple Clients

```typescript
// Different client types
class HttpClient extends Context.Tag("app/HttpClient")<
  HttpClient,
  {
    readonly use: <A>(
      f: (client: AxiosInstance) => Promise<A>
    ) => Effect.Effect<A, HttpError>;
    
    readonly useRaw: <A>(
      f: (client: typeof fetch) => Promise<A>
    ) => Effect.Effect<A, HttpError>;
  }
>() {}
```

### When to Add Dedicated Methods

The use pattern is great, but sometimes you need specific methods:

```typescript
class OpenAIClient extends Context.Tag("app/OpenAI")<
  OpenAIClient,
  {
    readonly use: <A>(
      f: (client: OpenAI) => Promise<A>
    ) => Effect.Effect<A, OpenAIError>;
    
    // Dedicated method for common operation
    readonly createCompletion: (params: {
      model: string;
      messages: Array<{ role: string; content: string }>;
    }) => Effect.Effect<string, OpenAIError>;
  }
>() {}

const OpenAILive = Layer.effect(
  OpenAIClient,
  Effect.gen(function* () {
    const apiKey = yield* Config.redacted("OPENAI_API_KEY");
    const client = new OpenAI({
      apiKey: Config.Redacted.value(apiKey)
    });
    
    const use = Effect.fn(
      "openai.use",
      <A>(f: (client: OpenAI, options?: { signal?: AbortSignal }) => Promise<A>) =>
        Effect.tryPromise({
          try: (signal) => f(client, { signal }),
          catch: (cause) => new OpenAIError({ cause })
        })
    );
    
    return OpenAIClient.of({
      use,
      
      // Convenience method
      createCompletion: Effect.fn(
        "openai.createCompletion",
        (params) =>
          use((client, options) =>
            client.chat.completions.create(
              {
                model: params.model,
                messages: params.messages
              },
              options
            )
          ).pipe(
            Effect.map(
              (response) => response.choices[0].message.content || ""
            )
          )
      )
    });
  })
);
```

**When to add dedicated methods**:
- ✅ Operation used frequently in business logic
- ✅ Need to transform/clean up response
- ✅ Want to add specific error handling
- ✅ Improves code readability significantly

---

## Effect.service: Unified Service Definition

### What is Effect.service?

**New API** (added recently) that combines tag + layer creation:

```typescript
// OLD WAY: Context.Tag + separate layer
class MyService extends Context.Tag("app/MyService")<
  MyService,
  ServiceInterface
>() {}

const MyServiceLive = Layer.effect(MyService, makeMyService);

// NEW WAY: Effect.service combines both
const MyService = Effect.service(
  "app/MyService",
  Effect.gen(function* () {
    // Service implementation
    return {
      method1: () => /* ... */,
      method2: () => /* ... */
    };
  }),
  { effect: true } // Construction method
);
```

### Effect.service Syntax

```typescript
const ServiceName = Effect.service(
  "unique-string-id",       // Runtime identifier
  serviceConstructor,       // How to build service
  { method: true }          // Construction method option
);
```

**Construction Methods**:
- `{ succeed: true }` - Pure value (like `Layer.succeed`)
- `{ sync: true }` - Synchronous (like `Layer.sync`)
- `{ effect: true }` - Async/effectful (like `Layer.effect`)
- `{ scoped: true }` - Resourceful (like `Layer.scoped`)

### Complete Example

```typescript
import { Effect, Config, Data } from "effect";
import OpenAI from "openai";

class OpenAIError extends Data.TaggedError("OpenAIError")<{
  readonly cause: unknown;
}> {}

// Everything in one declaration
const OpenAIClient = Effect.service(
  "app/OpenAI",
  Effect.gen(function* () {
    // Access dependencies
    const apiKey = yield* Config.redacted("OPENAI_API_KEY");
    
    // Create client
    const client = new OpenAI({
      apiKey: Config.Redacted.value(apiKey)
    });
    
    // Return service shape (auto-inferred!)
    return {
      use: Effect.fn(
        "openai.use",
        <A>(f: (client: OpenAI, options?: { signal?: AbortSignal }) => Promise<A>) =>
          Effect.tryPromise({
            try: (signal) => f(client, { signal }),
            catch: (cause) => new OpenAIError({ cause })
          })
      )
    };
  }),
  { effect: true }
);

// Auto-generates:
// - OpenAIClient tag (for accessing service)
// - OpenAIClient.Live layer (for providing service)
```

### Using Effect.service

```typescript
// Access service
const program = Effect.gen(function* () {
  const openai = yield* OpenAIClient;
  
  const response = yield* openai.use((client) =>
    client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hello!" }]
    })
  );
  
  return response.choices[0].message.content;
});

// Provide layer (auto-generated!)
const runnable = program.pipe(
  Effect.provide(OpenAIClient.Live)
);
```

### Benefits of Effect.service

1. **Less Boilerplate**: No separate tag + layer definitions
2. **Type Inference**: Service shape inferred from return value
3. **Opaque Types**: Service type is automatically opaque
4. **Consistency**: One API for all service creation
5. **Future-Proof**: This will be the blessed way in Effect 4.0

### Effect.service vs Context.Tag

| Aspect | Context.Tag | Effect.service |
|--------|-------------|----------------|
| Verbosity | Higher (tag + layer) | Lower (combined) |
| Type inference | Manual interface | Automatic |
| Layer creation | Separate | Integrated |
| Static methods | Supported | Not yet supported |
| Flexibility | More control | More concise |
| Recommended | Effect 3.x | Future (Effect 4.0) |

**Current Recommendation**: Use `Effect.service` for new code, `Context.Tag` still fully supported

### Migration Example

```typescript
// BEFORE: Context.Tag
class Cache extends Context.Tag("app/Cache")<
  Cache,
  {
    readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>;
    readonly store: (key: string, value: string) => Effect.Effect<void>;
  }
>() {}

const CacheLive = Layer.effect(
  Cache,
  Effect.gen(function* () {
    const fs = yield* FileSystem;
    
    return Cache.of({
      lookup: (key) => /* ... */,
      store: (key, value) => /* ... */
    });
  })
);

// AFTER: Effect.service
const Cache = Effect.service(
  "app/Cache",
  Effect.gen(function* () {
    const fs = yield* FileSystem;
    
    return {
      lookup: (key: string) => /* ... */,
      store: (key: string, value: string) => /* ... */
    };
  }),
  { effect: true }
);

// Usage identical:
const program = Effect.gen(function* () {
  const cache = yield* Cache;
  yield* cache.lookup("key");
});
```

---

## Configuration Management

### The Config Module

**Problem**: Reading `process.env` directly is unsafe

```typescript
// ❌ BAD: Unsafe, might be undefined
const apiKey = process.env.OPENAI_API_KEY;
// Type: string | undefined

const timeout = parseInt(process.env.TIMEOUT!);
// Might be NaN!
```

**Solution**: Use Effect's Config module

```typescript
import { Config } from "effect";

// ✅ GOOD: Type-safe, validated
const apiKey = Config.string("OPENAI_API_KEY");
// Type: Config<string>

const timeout = Config.integer("TIMEOUT");
// Type: Config<number>

const debug = Config.boolean("DEBUG");
// Type: Config<boolean>
```

### Config Types

```typescript
// String
Config.string("API_KEY")

// Number
Config.integer("PORT")
Config.number("RATE_LIMIT")

// Boolean
Config.boolean("ENABLE_FEATURE")

// With default
Config.string("ENV").pipe(
  Config.withDefault("development")
)

// Optional
Config.option(Config.string("OPTIONAL_KEY"))
// Type: Config<Option<string>>

// Array
Config.array(Config.string("TAGS"))
// Reads: TAGS=tag1,tag2,tag3

// Nested
Config.string("DB_HOST").pipe(
  Config.nested("database")
)
// Reads: DATABASE_DB_HOST
```

### Redacted Config

**Use for sensitive values** (API keys, passwords, tokens):

```typescript
const apiKey = Config.redacted("OPENAI_API_KEY");
// Type: Config<Redacted>

// Unwrap when needed
const program = Effect.gen(function* () {
  const key = yield* apiKey;
  const plainText = Config.Redacted.value(key);
  // Use plainText...
});
```

**Benefits**:
- Won't appear in logs
- Won't be traced in telemetry
- Security best practice

### Using Config in Services

```typescript
const OpenAIClient = Effect.service(
  "app/OpenAI",
  Effect.gen(function* () {
    // Read config
    const apiKey = yield* Config.redacted("OPENAI_API_KEY");
    const timeout = yield* Config.integer("OPENAI_TIMEOUT").pipe(
      Config.withDefault(30000)
    );
    
    const client = new OpenAI({
      apiKey: Config.Redacted.value(apiKey),
      timeout
    });
    
    return {
      use: (f) => /* ... */
    };
  }),
  { effect: true }
);
```

### Config Providers

**Default**: Reads from environment variables

```typescript
// Reads from process.env
Effect.runPromise(program);
```

**Custom Provider**: Read from files, remote config, etc.

```typescript
import { ConfigProvider } from "effect";

// From JSON object
const provider = ConfigProvider.fromJson({
  OPENAI_API_KEY: "sk-...",
  TIMEOUT: "5000"
});

const program = myEffect.pipe(
  Effect.provide(provider)
);

// From file
const fileProvider = ConfigProvider.fromEnv().pipe(
  ConfigProvider.orElse(() =>
    ConfigProvider.fromJson(
      JSON.parse(fs.readFileSync(".env.json", "utf-8"))
    )
  )
);
```

### Config Validation

```typescript
import { Schema } from "@effect/schema/Schema";

// With schema validation
const config = Config.string("DATABASE_URL").pipe(
  Config.validate({
    message: "Invalid database URL",
    validation: (s) => s.startsWith("postgresql://")
  })
);

// Or use Schema
const DatabaseConfig = Schema.struct({
  host: Schema.string,
  port: Schema.number,
  database: Schema.string
});

const dbConfig = Config.json("DATABASE").pipe(
  Config.map(Schema.decodeUnknownSync(DatabaseConfig))
);
```

---

## Wrapping Paginated APIs with Streams

### The Problem

Many APIs return paginated data:

```typescript
// Page 1
const page1 = await api.list({ page: 1 });

// Page 2
const page2 = await api.list({ page: 2 });

// Keep going until done...
```

**Challenges**:
- Track cursor/page number
- Know when to stop
- Stream results efficiently
- Handle errors per page

### Solution: Stream.paginate

Effect's Stream module has specialized paginate APIs:

```typescript
import { Stream, Chunk, Option } from "effect";

// Stream.paginateChunkEffect signature
Stream.paginateChunkEffect<A, E, R>(
  initialCursor: Cursor,
  (cursor: Cursor) => Effect.Effect<
    readonly [Chunk<A>, Option<Cursor>],
    E,
    R
  >
)
```

**How it works**:
1. Start with initial cursor (page 1, offset 0, etc.)
2. Fetch page, return `[chunk, nextCursor]`
3. If `nextCursor` is `None`, stop
4. Otherwise, call again with `nextCursor`

### Complete Example: OpenAI Pagination

```typescript
const OpenAIClient = Effect.service(
  "app/OpenAI",
  Effect.gen(function* () {
    const apiKey = yield* Config.redacted("OPENAI_API_KEY");
    const client = new OpenAI({
      apiKey: Config.Redacted.value(apiKey)
    });
    
    const use = Effect.fn(
      "openai.use",
      <A>(f: (client: OpenAI, options?: { signal?: AbortSignal }) => Promise<A>) =>
        Effect.tryPromise({
          try: (signal) => f(client, { signal }),
          catch: (cause) => new OpenAIError({ cause })
        })
    );
    
    return {
      use,
      
      // Paginated list
      listCompletions: Effect.fn(
        "openai.listCompletions",
        () =>
          Stream.paginateChunkEffect(
            undefined as OpenAI.PagePromise<ChatCompletion> | undefined,
            (cursor) =>
              use((client, options) => {
                // First page
                if (cursor === undefined) {
                  return client.chat.completions.list({}, options);
                }
                // Subsequent pages
                return cursor;
              }).pipe(
                Effect.flatMap((page) =>
                  Effect.gen(function* () {
                    // Get current page data
                    const items = page.data;
                    
                    // Check if there's a next page
                    const hasNextPage = yield* Effect.promise(() => 
                      page.hasNextPage()
                    );
                    
                    // Get next page cursor
                    const nextCursor = hasNextPage
                      ? Option.some(
                          yield* Effect.promise(() => page.getNextPage())
                        )
                      : Option.none();
                    
                    return [
                      Chunk.unsafeFromArray(items),
                      nextCursor
                    ] as const;
                  })
                ),
                Effect.catchAll(() =>
                  Effect.fail(new OpenAIError({ cause: "Pagination failed" }))
                )
              )
          ).pipe(
            Stream.withSpan("openai.listCompletions")
          )
      )
    };
  }),
  { effect: true }
);
```

### Using Paginated Streams

```typescript
const program = Effect.gen(function* () {
  const openai = yield* OpenAIClient;
  
  // Get all completions as stream
  const completions = openai.listCompletions();
  
  // Take first 10
  const first10 = yield* completions.pipe(
    Stream.take(10),
    Stream.runCollect
  );
  
  // Process concurrently
  yield* completions.pipe(
    Stream.mapEffect(
      (completion) => processCompletion(completion),
      { concurrency: 5 }
    ),
    Stream.runDrain
  );
});
```

### Generic Pagination Pattern

```typescript
// Reusable pattern
const paginateAPI = <Item, Cursor>(
  apiCall: (cursor: Cursor) => Promise<{
    items: Item[];
    nextCursor: Cursor | null;
  }>,
  initialCursor: Cursor
) =>
  Stream.paginateChunkEffect(
    initialCursor,
    (cursor) =>
      Effect.tryPromise({
        try: () => apiCall(cursor),
        catch: (e) => new PaginationError({ cause: e })
      }).pipe(
        Effect.map((result) => [
          Chunk.unsafeFromArray(result.items),
          result.nextCursor !== null
            ? Option.some(result.nextCursor)
            : Option.none()
        ] as const)
      )
  );

// Usage
const items = paginateAPI(
  (page) => api.list({ page, pageSize: 100 }),
  1
);
```

### Stream.fromAsyncIterable Alternative

If API returns async iterables:

```typescript
// OpenAI streams
const stream = client.chat.completions.create({
  model: "gpt-4",
  messages: [...],
  stream: true
});

// Convert to Effect Stream
const effectStream = Stream.fromAsyncIterable(
  stream,
  (cause) => new OpenAIError({ cause })
);
```

---

## Specialized API Wrappers

### When to Create Dedicated Methods

**Use Pattern is great for flexibility**, but sometimes you want convenience:

```typescript
// Without dedicated method (verbose)
const program = Effect.gen(function* () {
  const openai = yield* OpenAIClient;
  
  const response = yield* openai.use((client, options) =>
    client.chat.completions.create(
      {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }]
      },
      options
    )
  );
  
  return response.choices[0].message.content;
});

// With dedicated method (concise)
const program = Effect.gen(function* () {
  const openai = yield* OpenAIClient;
  
  const content = yield* openai.createCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: "Hello" }]
  });
  
  return content;
});
```

### Streaming API Wrapper

```typescript
const OpenAIClient = Effect.service(
  "app/OpenAI",
  Effect.gen(function* () {
    const apiKey = yield* Config.redacted("OPENAI_API_KEY");
    const client = new OpenAI({
      apiKey: Config.Redacted.value(apiKey)
    });
    
    // Helper: Unwrap OpenAI streams
    const streamHelper = <A>(
      f: (client: OpenAI, options?: { signal?: AbortSignal }) => Promise<{
        controller: AbortController;
        [Symbol.asyncIterator](): AsyncIterator<A>;
      }>
    ) =>
      Effect.gen(function* () {
        const stream = yield* Effect.tryPromise({
          try: (signal) => f(client, { signal }),
          catch: (cause) => new OpenAIError({ cause })
        });
        
        return Stream.fromAsyncIterable(
          stream,
          (cause) => new OpenAIError({ cause })
        ).pipe(
          // Clean up on interruption
          Stream.ensuring(
            Effect.sync(() => stream.controller.abort())
          )
        );
      }).pipe(
        // Unwrap Effect<Stream> to Stream
        Stream.unwrap,
        Stream.withSpan("openai.stream")
      );
    
    return {
      // Streaming completion
      streamCompletion: Effect.fn(
        "openai.streamCompletion",
        (params: {
          model: string;
          messages: Array<{ role: string; content: string }>;
        }) =>
          streamHelper((client, options) =>
            client.chat.completions.create(
              {
                model: params.model,
                messages: params.messages,
                stream: true
              },
              options
            )
          ).pipe(
            // Filter out empty chunks
            Stream.filter(
              (chunk) => chunk.choices[0]?.finish_reason !== "stop"
            ),
            // Extract content
            Stream.map(
              (chunk) => chunk.choices[0]?.delta?.content || ""
            )
          )
      )
    };
  }),
  { effect: true }
);

// Usage
const program = Effect.gen(function* () {
  const openai = yield* OpenAIClient;
  
  const stream = yield* openai.streamCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: "Tell me a story" }]
  });
  
  // Process stream
  yield* stream.pipe(
    Stream.tap((chunk) => Console.log(chunk)),
    Stream.runDrain
  );
});
```

### Best Practices for Specialized Wrappers

1. **Start with use pattern**, add specialized methods as needed
2. **Don't wrap everything** - only frequently used operations
3. **Clean up responses** - filter nulls, transform shapes
4. **Add type safety** - better types than raw SDK
5. **Consider ergonomics** - make it pleasant to use

---

## Multi-Shot APIs: Callbacks & Events

### The Problem

Some APIs invoke callbacks multiple times:

```typescript
// Express request handler
app.get("/api/users", (req, res) => {
  // Called for each request
});

// Event listener
element.addEventListener("click", (event) => {
  // Called for each click
});

// WebSocket
socket.on("message", (data) => {
  // Called for each message
});

// Telegram bot
bot.on("message", (msg) => {
  // Called for each message
});
```

**Challenges**:
- How to access Effect services in callbacks?
- How to manage fiber lifecycle?
- How to ensure cleanup on shutdown?
- How to handle backpressure?

### Strategy 1: Stream from Callbacks

Convert callbacks into streams using `Stream.async` APIs:

```typescript
import { Stream } from "effect";

// Event listener → Stream
const clicks = Stream.asyncPush<MouseEvent, never>(
  (emit) => {
    const handler = (event: MouseEvent) => {
      emit.single(event);
    };
    
    element.addEventListener("click", handler);
    
    // Cleanup
    return Effect.sync(() => {
      element.removeEventListener("click", handler);
    });
  }
);

// Usage
const program = clicks.pipe(
  Stream.tap((event) => Console.log(`Clicked at ${event.clientX}, ${event.clientY}`)),
  Stream.runDrain
);
```

### Stream.async* APIs

#### Stream.asyncPush (Most Common)
**Use when**: No backpressure support (event listeners, WebSockets)

```typescript
Stream.asyncPush<A, E, R>(
  (emit) => {
    // Setup callback
    const handler = (data: A) => {
      emit.single(data);     // Emit single item
      emit.chunk(chunk);     // Emit chunk
      emit.fail(error);      // Fail stream
      emit.end();            // End stream
    };
    
    source.on("data", handler);
    
    // Return cleanup effect
    return Effect.sync(() => {
      source.off("data", handler);
    });
  }
)
```

#### Stream.async (Backpressure Support)
**Use when**: Source supports backpressure (async iterables, some streams)

```typescript
Stream.async<A, E, R>(
  (emit) =>
    Effect.gen(function* () {
      for await (const item of asyncIterable) {
        // Backpressure: waits until downstream ready
        yield* emit.single(item);
      }
      
      yield* emit.end();
    })
)
```

#### Stream.asyncScoped (With Resources)
**Use when**: Setup requires resources

```typescript
Stream.asyncScoped<A, E, R>(
  (emit) =>
    Effect.gen(function* () {
      // Acquire resource
      const connection = yield* Effect.acquireRelease(
        connectWebSocket(),
        (conn) => conn.close()
      );
      
      connection.on("message", (msg) => {
        emit.single(msg);
      });
      
      // No explicit cleanup return - handled by scope
    })
)
```

### Complete Example: WebSocket to Stream

```typescript
import { Stream, Effect, Data } from "effect";
import WebSocket from "ws";

class WebSocketError extends Data.TaggedError("WebSocketError")<{
  readonly cause: unknown;
}> {}

const websocketStream = (url: string) =>
  Stream.asyncScoped<string, WebSocketError>(
    (emit) =>
      Effect.gen(function* () {
        // Acquire WebSocket connection
        const ws = yield* Effect.acquireRelease(
          Effect.sync(() => new WebSocket(url)),
          (ws) =>
            Effect.sync(() => {
              ws.close();
            })
        );
        
        // Wait for connection
        yield* Effect.async<void, WebSocketError>((resume) => {
          ws.on("open", () => resume(Effect.void));
          ws.on("error", (err) =>
            resume(Effect.fail(new WebSocketError({ cause: err })))
          );
        });
        
        // Handle messages
        ws.on("message", (data) => {
          emit.single(data.toString());
        });
        
        // Handle errors
        ws.on("error", (err) => {
          emit.fail(new WebSocketError({ cause: err }));
        });
        
        // Handle close
        ws.on("close", () => {
          emit.end();
        });
      })
  ).pipe(
    Stream.withSpan("websocket.stream")
  );

// Usage
const program = Effect.gen(function* () {
  const stream = websocketStream("wss://example.com");
  
  yield* stream.pipe(
    Stream.tap((msg) => Console.log(`Received: ${msg}`)),
    Stream.take(10), // Take first 10 messages
    Stream.runDrain
  );
});
```

### Stream Convenience Wrappers

Effect provides helpers for common patterns:

```typescript
// Event listener
import { Stream } from "effect";

const clicks = Stream.fromEventListener(
  element,
  "click"
);

// Node readable stream
import { NodeStream } from "@effect/platform-node";

const fileStream = NodeStream.fromReadable(
  () => fs.createReadStream("file.txt"),
  (cause) => new FileError({ cause })
);

// Web ReadableStream
const webStream = Stream.fromReadableStream(
  () => fetch(url).then(r => r.body!),
  (cause) => new FetchError({ cause })
);

// Async iterable
const items = Stream.fromAsyncIterable(
  asyncIterableData,
  (cause) => new IterableError({ cause })
);
```

---

## Fiber Management in Production

### The Fiber Lifecycle Problem

When running Effects in callbacks, **lifecycle management is critical**:

```typescript
// ❌ BAD: Fiber leaks
app.get("/api/data", (req, res) => {
  // Starts fiber, but never tracks it
  Effect.runPromise(
    Effect.gen(function* () {
      const data = yield* fetchData();
      res.json(data);
    })
  );
  // If server shuts down, fiber keeps running!
});
```

**Problems**:
1. Fibers not cleaned up on shutdown
2. Server hangs during graceful shutdown
3. Resources leak
4. No way to interrupt running operations

### Solution: Fiber Management Modules

Effect provides three modules for managing fiber lifecycles:

| Module | Use Case | Description |
|--------|----------|-------------|
| **FiberHandle** | Single fiber | Manage one background task |
| **FiberSet** | Multiple fibers | Track many concurrent operations |
| **FiberMap** | Keyed fibers | Index fibers by ID |

### FiberSet: Most Common Pattern

**Use FiberSet for**: Request handlers, event handlers, concurrent operations

```typescript
import { FiberSet, Effect } from "effect";

const program = Effect.gen(function* () {
  // Create FiberSet
  const set = yield* FiberSet.make();
  
  // Get runtime with services
  const runFork = yield* FiberSet.makeRuntime(set)<OpenAI | Database>();
  
  // Fork fibers into set
  runFork(
    Effect.gen(function* () {
      const openai = yield* OpenAI;
      // Do work...
    })
  );
  
  // When scope closes, all fibers in set are interrupted
});
```

**How FiberSet works**:
1. Creates a Set to track fibers
2. `makeRuntime` returns `runFork` function
3. Each `runFork` call adds fiber to set
4. When FiberSet scope closes → all fibers interrupted
5. Automatic cleanup guaranteed

### FiberSet.makeRuntime

**Signature**:

```typescript
FiberSet.makeRuntime<R>(
  set: FiberSet
): Effect.Effect<
  (effect: Effect.Effect<A, E, R>) => Fiber.RuntimeFiber<A, E>,
  never,
  R | Scope
>
```

**Key insight**: Adds services `R` to the runtime

```typescript
// Runtime with OpenAI service
const runFork = yield* FiberSet.makeRuntime(set)<OpenAI>();

// Now can run effects that require OpenAI
runFork(
  Effect.gen(function* () {
    const openai = yield* OpenAI;
    yield* openai.createCompletion({...});
  })
);
// Type checks! ✅
```

### Complete Express Example

```typescript
import express from "express";
import { Effect, Layer, FiberSet, Config } from "effect";

const ExpressApp = Effect.service(
  "app/Express",
  Effect.gen(function* () {
    const app = express();
    
    // Create FiberSet for request handlers
    const requestFibers = yield* FiberSet.make();
    
    // Get runtime with all services
    const runFork = yield* FiberSet.makeRuntime(requestFibers)<
      OpenAI | Database
    >();
    
    // Helper to add routes
    const addRoute = (
      method: "get" | "post" | "put" | "delete",
      path: string,
      handler: (
        req: express.Request,
        res: express.Response
      ) => Effect.Effect<void>
    ) => {
      app[method](path, (req, res) => {
        // Fork fiber for this request
        const fiber = runFork(
          Effect.gen(function* () {
            // Add span for observability
            yield* Effect.withSpan(`${method} ${path}`)(
              handler(req, res)
            );
          }).pipe(
            // Default response if none sent
            Effect.ensuring(
              Effect.sync(() => {
                if (!res.headersSent) {
                  res.status(204).end();
                }
              })
            ),
            // Error handling
            Effect.catchAll((error) =>
              Effect.sync(() => {
                console.error("Request error:", error);
                if (!res.headersSent) {
                  res.status(500).json({ error: "Internal server error" });
                }
              })
            )
          )
        );
        
        // Handle request close (client disconnect)
        req.on("close", () => {
          Effect.runSync(fiber.interrupt);
        });
      });
    };
    
    return {
      app,
      addRoute,
      listen: (port: number) =>
        Effect.acquireRelease(
          Effect.async<http.Server>((resume) => {
            const server = app.listen(port, () => {
              console.log(`Server listening on port ${port}`);
              resume(Effect.succeed(server));
            });
          }),
          (server) =>
            Effect.promise(() =>
              new Promise<void>((resolve) => {
                server.close(() => resolve());
              })
            )
        )
    };
  }),
  { scoped: true }
);

// Usage
const HomeRoutes = Layer.effect(
  "HomeRoutes",
  Effect.gen(function* () {
    const express = yield* ExpressApp;
    const openai = yield* OpenAI;
    
    express.addRoute("get", "/api/completion", (req, res) =>
      Effect.gen(function* () {
        const prompt = req.query.prompt as string;
        
        const completion = yield* openai.createCompletion({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }]
        });
        
        res.json({ completion });
      })
    );
    
    return {};
  })
);

const MainLive = Layer.mergeAll(
  OpenAI.Live,
  ExpressApp.Live,
  HomeRoutes
);

const program = Effect.gen(function* () {
  const express = yield* ExpressApp;
  yield* express.listen(3000);
  
  // Server runs until interrupted
  yield* Effect.never;
});

// Run with graceful shutdown
Effect.runPromise(
  program.pipe(Effect.provide(MainLive))
);
```

### FiberHandle: Single Background Task

**Use for**: Long-running background jobs, watchers, processors

```typescript
import { FiberHandle, Effect } from "effect";

const program = Effect.gen(function* () {
  const handle = yield* FiberHandle.make();
  
  // Start background task
  yield* FiberHandle.run(
    handle,
    Effect.forever(
      Effect.sleep("1 second").pipe(
        Effect.tap(() => Console.log("tick"))
      )
    )
  );
  
  // Do other work...
  yield* doWork();
  
  // Background task automatically interrupted when scope closes
});
```

### FiberMap: Keyed Fiber Management

**Use for**: Managing named background tasks

```typescript
import { FiberMap, Effect } from "effect";

const program = Effect.gen(function* () {
  const map = yield* FiberMap.make<string>();
  
  const runFork = yield* FiberMap.makeRuntime(map)<Database>();
  
  // Start fiber with key
  runFork(
    "user-sync",
    Effect.forever(syncUsers())
  );
  
  runFork(
    "cache-invalidation",
    Effect.forever(invalidateCache())
  );
  
  // Stop specific fiber
  yield* FiberMap.remove(map, "user-sync");
  
  // All fibers cleaned up when scope closes
});
```

### Fiber Interruption Handling

```typescript
const handler = Effect.gen(function* () {
  const openai = yield* OpenAI;
  
  const completion = yield* openai.createCompletion({
    model: "gpt-4",
    messages: [...]
  }).pipe(
    // Handle interruption
    Effect.onInterrupt(() =>
      Console.log("Request was cancelled")
    )
  );
  
  return completion;
});

// If request is cancelled (client disconnect), interruption fires
```

### Uninterruptible Regions

**Use sparingly** - some operations must complete:

```typescript
const criticalOperation = Effect.gen(function* () {
  // This can be interrupted
  const data = yield* fetchData();
  
  // This CANNOT be interrupted
  yield* Effect.uninterruptible(
    saveToDatabase(data)
  );
  
  // Back to interruptible
  yield* sendNotification();
});
```

**Warning**: Use `Effect.uninterruptible` carefully
- Can cause shutdown hangs
- Interruption is "contagious" to forked fibers
- Consider timeouts: `Effect.timeout` + `uninterruptible`

---

## Express Integration Patterns

### Complete Express Wrapper

Bringing it all together:

```typescript
import express from "express";
import { Effect, Layer, FiberSet, Config, Data } from "effect";

class ExpressError extends Data.TaggedError("ExpressError")<{
  readonly cause: unknown;
}> {}

const ExpressApp = Effect.service(
  "app/Express",
  Effect.gen(function* () {
    const app = express();
    
    // JSON middleware
    app.use(express.json());
    
    // Create FiberSet for lifecycle management
    const requestFibers = yield* FiberSet.make();
    const runFork = yield* FiberSet.makeRuntime(requestFibers)<
      // Add all services used in routes
      OpenAI | Database | Logger
    >();
    
    // Route helper with full observability & error handling
    const addRoute = <E>(
      method: "get" | "post" | "put" | "delete",
      path: string,
      handler: (
        req: express.Request,
        res: express.Response
      ) => Effect.Effect<void, E>
    ) => {
      app[method](path, (req, res) => {
        const fiber = runFork(
          Effect.gen(function* () {
            // Run handler with full observability
            yield* Effect.fn(
              `${method} ${path}`,
              () => handler(req, res)
            )().pipe(
              // Add request metadata to span
              Effect.withSpan(`${method} ${path}`, {
                attributes: {
                  "http.method": method,
                  "http.route": path,
                  "http.url": req.url
                }
              })
            );
          }).pipe(
            // Ensure response sent
            Effect.ensuring(
              Effect.sync(() => {
                if (!res.headersSent) {
                  res.status(204).end();
                }
              })
            ),
            // Handle errors
            Effect.catchAll((error) =>
              Effect.gen(function* () {
                const logger = yield* Logger;
                
                yield* logger.error("Request failed", error);
                
                if (!res.headersSent) {
                  res.status(500).json({
                    error: "Internal server error"
                  });
                }
              })
            )
          )
        );
        
        // Handle client disconnect
        req.on("close", () => {
          Effect.runSync(fiber.interrupt);
        });
      });
    };
    
    return {
      app,
      addRoute,
      
      // Server lifecycle
      listen: (port: number) =>
        Effect.acquireRelease(
          Effect.async<http.Server>((resume) => {
            const server = app.listen(port, () => {
              console.log(`Server listening on ${port}`);
              resume(Effect.succeed(server));
            });
            
            server.on("error", (error) => {
              resume(Effect.fail(new ExpressError({ cause: error })));
            });
          }),
          (server) =>
            Effect.gen(function* () {
              console.log("Shutting down server...");
              
              // Graceful shutdown
              yield* Effect.promise(() =>
                new Promise<void>((resolve) => {
                  server.close(() => {
                    console.log("Server closed");
                    resolve();
                  });
                })
              );
              
              // All request fibers automatically interrupted by FiberSet
            })
        )
    };
  }),
  { scoped: true }
);
```

### Organizing Routes as Layers

**Best Practice**: One layer per route group

```typescript
// routes/users.ts
const UserRoutes = Layer.effect(
  "UserRoutes",
  Effect.gen(function* () {
    const express = yield* ExpressApp;
    const db = yield* Database;
    const logger = yield* Logger;
    
    express.addRoute("get", "/api/users/:id", (req, res) =>
      Effect.gen(function* () {
        const id = req.params.id;
        
        yield* logger.info(`Fetching user ${id}`);
        
        const user = yield* db.query(
          "SELECT * FROM users WHERE id = ?",
          [id]
        ).pipe(
          Effect.flatMap((rows) =>
            rows.length > 0
              ? Effect.succeed(rows[0])
              : Effect.fail(new NotFoundError({ id }))
          ),
          Effect.catchTag("NotFoundError", () =>
            Effect.sync(() => {
              res.status(404).json({ error: "User not found" });
            })
          )
        );
        
        res.json(user);
      })
    );
    
    express.addRoute("post", "/api/users", (req, res) =>
      Effect.gen(function* () {
        const data = req.body;
        
        // Validate with Schema
        const user = yield* Schema.decodeUnknown(UserSchema)(data);
        
        yield* db.query(
          "INSERT INTO users (name, email) VALUES (?, ?)",
          [user.name, user.email]
        );
        
        res.status(201).json(user);
      })
    );
    
    return {};
  })
);

// routes/posts.ts
const PostRoutes = Layer.effect(
  "PostRoutes",
  Effect.gen(function* () {
    const express = yield* ExpressApp;
    // ... routes
    return {};
  })
);

// main.ts
const MainLive = Layer.mergeAll(
  Database.Live,
  Logger.Live,
  ExpressApp.Live,
  UserRoutes,
  PostRoutes
);

const program = Effect.gen(function* () {
  const express = yield* ExpressApp;
  yield* express.listen(3000);
  yield* Effect.never;
});

Effect.runPromise(
  program.pipe(Effect.provide(MainLive))
);
```

### Incremental Migration Strategy

**Start**: Existing Express app with no Effect

```typescript
// Existing code
app.get("/api/data", async (req, res) => {
  const data = await fetchData();
  res.json(data);
});
```

**Step 1**: Wrap Express app in service (don't change routes)

```typescript
const ExpressApp = Effect.service(
  "app/Express",
  Effect.gen(function* () {
    const app = express();
    
    // Keep existing routes!
    app.get("/api/data", async (req, res) => {
      const data = await fetchData();
      res.json(data);
    });
    
    return { app, addRoute: /* ... */ };
  }),
  { scoped: true }
);
```

**Step 2**: Migrate one route at a time

```typescript
const ExpressApp = Effect.service(
  "app/Express",
  Effect.gen(function* () {
    const app = express();
    const requestFibers = yield* FiberSet.make();
    const runFork = yield* FiberSet.makeRuntime(requestFibers)<Database>();
    
    // OLD: Keep as-is
    app.get("/api/old", async (req, res) => {
      const data = await fetchData();
      res.json(data);
    });
    
    // NEW: Migrated to Effect
    const addRoute = /* ... */;
    
    addRoute("get", "/api/new", (req, res) =>
      Effect.gen(function* () {
        const db = yield* Database;
        const data = yield* db.query("SELECT * FROM items");
        res.json(data);
      })
    );
    
    return { app, addRoute };
  }),
  { scoped: true }
);
```

**Step 3**: Gradually convert all routes

---

## React Integration Strategies

### The Challenge

React controls the main entry point:

```typescript
// Can't do this in React!
Layer.launch(MainLive)(program);

// React takes over:
ReactDOM.render(<App />, root);
```

**Problem**: Can't use `Layer.launch` or `Effect.provide` at root

**Solution**: Use runtime inside React components

### Strategy 1: Managed Runtime

**ManagedRuntime**: Runtime created from a layer

```typescript
import { ManagedRuntime, Layer } from "effect";

// Create runtime from layer
const runtime = ManagedRuntime.make(
  Layer.mergeAll(
    OpenAI.Live,
    Database.Live
  )
);

// Use runtime to run effects
runtime.runPromise(
  Effect.gen(function* () {
    const openai = yield* OpenAI;
    return yield* openai.createCompletion({...});
  })
);
```

### ManagedRuntime + React Context

```typescript
import React from "react";
import { ManagedRuntime, Layer, Effect, MemoMap } from "effect";

// Create global memo map (share services across runtimes)
const globalMemoMap = MemoMap.make();

// Create runtime
const runtime = ManagedRuntime.make(
  OpenAI.Live,
  globalMemoMap
);

// React context
const RuntimeContext = React.createContext<typeof runtime>(runtime);

// Provider
export const RuntimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [runtime] = React.useState(() =>
    ManagedRuntime.make(OpenAI.Live, globalMemoMap)
  );
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      runtime.dispose();
    };
  }, [runtime]);
  
  return (
    <RuntimeContext.Provider value={runtime}>
      {children}
    </RuntimeContext.Provider>
  );
};

// Hook to use runtime
export const useRuntime = () => {
  const runtime = React.useContext(RuntimeContext);
  if (!runtime) throw new Error("Runtime not provided");
  return runtime;
};
```

### Using in Components with React Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { Effect } from "effect";

function CompletionComponent() {
  const runtime = useRuntime();
  
  const query = useQuery({
    queryKey: ["completion"],
    queryFn: ({ signal }) =>
      runtime.runPromise(
        Effect.gen(function* () {
          const openai = yield* OpenAI;
          
          const completion = yield* openai.createCompletion({
            model: "gpt-4",
            messages: [{ role: "user", content: "Hello!" }]
          });
          
          return completion;
        }),
        { signal } // Pass abort signal for cancellation
      )
  });
  
  if (query.isLoading) return <div>Loading...</div>;
  if (query.isError) return <div>Error: {String(query.error)}</div>;
  
  return <div>{query.data}</div>;
}
```

### Helper: React Query Options Factory

```typescript
import { Effect, ManagedRuntime } from "effect";
import { QueryKey, UseQueryOptions } from "@tanstack/react-query";

export const makeQueryOptions = <A, E, R>(
  runtime: ManagedRuntime<R, unknown>,
  queryKey: QueryKey,
  effect: Effect.Effect<A, E, R>
): UseQueryOptions<A> => ({
  queryKey,
  queryFn: ({ signal }) =>
    runtime.runPromise(effect, { signal })
});

// Usage
const runtime = useRuntime();

const query = useQuery(
  makeQueryOptions(
    runtime,
    ["completion"],
    Effect.gen(function* () {
      const openai = yield* OpenAI;
      return yield* openai.createCompletion({...});
    })
  )
);
```

### Streaming in React

```typescript
function StreamingCompletion() {
  const runtime = useRuntime();
  const [chunks, setChunks] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    const cancel = runtime.runCallback(
      Effect.gen(function* () {
        const openai = yield* OpenAI;
        
        const stream = yield* openai.streamCompletion({
          model: "gpt-4",
          messages: [{ role: "user", content: "Tell me a story" }]
        });
        
        // Accumulate chunks
        yield* stream.pipe(
          Stream.runForEach((chunk) =>
            Effect.sync(() => {
              setChunks((prev) => [...prev, chunk]);
            })
          )
        );
      })
    );
    
    // Cleanup on unmount
    return cancel;
  }, [runtime]);
  
  return (
    <div>
      {chunks.join("")}
    </div>
  );
}
```

### MemoMap: Sharing Services Across Runtimes

**Problem**: Multiple runtimes = services built multiple times

```typescript
// ❌ BAD: Services built twice
const runtime1 = ManagedRuntime.make(OpenAI.Live);
const runtime2 = ManagedRuntime.make(OpenAI.Live);
// OpenAI.Live built separately for each runtime
```

**Solution**: Share MemoMap

```typescript
// ✅ GOOD: Services built once, shared
const memoMap = Layer.makeMemoMap();

const runtime1 = ManagedRuntime.make(OpenAI.Live, memoMap);
const runtime2 = ManagedRuntime.make(OpenAI.Live, memoMap);
// OpenAI.Live built once, reused in both runtimes
```

### Advanced: Dynamic Runtime per User

```typescript
// Runtime that depends on current user
const makeUserRuntime = (user: User) => {
  const UserLayer = Layer.succeed(CurrentUser, user);
  
  const runtime = ManagedRuntime.make(
    Layer.mergeAll(
      UserLayer,
      OpenAI.Live,
      Database.Live
    ),
    globalMemoMap
  );
  
  return runtime;
};

// Provider with user-specific runtime
export const UserRuntimeProvider: React.FC<{
  user: User;
  children: React.ReactNode;
}> = ({ user, children }) => {
  const [runtime, setRuntime] = React.useState(() =>
    makeUserRuntime(user)
  );
  
  // Update runtime when user changes
  React.useEffect(() => {
    runtime.dispose();
    setRuntime(makeUserRuntime(user));
  }, [user.id]);
  
  return (
    <RuntimeContext.Provider value={runtime}>
      {children}
    </RuntimeContext.Provider>
  );
};
```

---

## Effect RX: Reactive State Management

### What is Effect RX?

**Experimental package** for reactive state management with Effect

**Think**: Jotai/Recoil but with Effect integration

**Features**:
- Reactive atoms (like Jotai)
- Effect integration
- React Suspense support
- Stream support
- Framework agnostic (core) + React/Vue bindings

### Basic Setup

```typescript
import { Rx } from "@effect/experimental";
import { Effect, Layer } from "effect";

// Create runtime
const runtime = Rx.runtime(
  Layer.mergeAll(
    OpenAI.Live,
    Database.Live
  )
);
```

### Reactive Values

```typescript
// Create reactive value
const count = Rx.make(0);

// Create derived value
const doubled = Rx.make((get) => {
  const n = get(count);
  return n * 2;
});

// Create value from Effect
const user = runtime.rx(
  Effect.gen(function* () {
    const db = yield* Database;
    return yield* db.query("SELECT * FROM users WHERE id = 1");
  })
);
```

### React Integration

```typescript
import { useRx } from "@effect/experimental/React";

function Counter() {
  // Use reactive value
  const [count, setCount] = useRx(countAtom);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

function UserDisplay() {
  // Effect-based reactive value with Suspense
  const result = useRx(userAtom);
  
  if (result.waiting) {
    return <div>Loading...</div>;
  }
  
  return <div>{result.value.name}</div>;
}

// With Suspense boundary
function App() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <UserDisplay />
    </React.Suspense>
  );
}
```

### Reactive Effects

```typescript
const completionAtom = Rx.family((prompt: string) =>
  runtime.rx(
    Effect.gen(function* () {
      const openai = yield* OpenAI;
      
      return yield* openai.createCompletion({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }]
      });
    })
  )
);

function Completion({ prompt }: { prompt: string }) {
  const result = useRx(completionAtom(prompt));
  
  // result.waiting: boolean - currently fetching
  // result.value: string - completion text
  
  if (result.waiting) {
    return <div>Thinking...</div>;
  }
  
  return <div>{result.value}</div>;
}
```

### Streaming with RX

```typescript
const streamAtom = runtime.rx(
  Effect.gen(function* () {
    const openai = yield* OpenAI;
    
    // Return stream directly
    return yield* openai.streamCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: "Tell me a story" }]
    });
  })
);

function StreamingDisplay() {
  const result = useRx(streamAtom);
  
  // RX automatically accumulates stream chunks
  const chunks = result.value; // Array<string>
  
  return (
    <div>
      {chunks.join("")}
      {result.waiting && <span className="cursor">▋</span>}
    </div>
  );
}
```

### Rx.family: Parameterized Atoms

**Use for**: Atoms that depend on parameters

```typescript
// Without family (wrong - unstable references)
function Component({ userId }: { userId: string }) {
  // ❌ New atom created on every render!
  const userAtom = runtime.rx(fetchUser(userId));
  const user = useRx(userAtom);
}

// With family (correct - stable references)
const userAtomFamily = Rx.family((userId: string) =>
  runtime.rx(fetchUser(userId))
);

function Component({ userId }: { userId: string }) {
  // ✅ Same atom for same userId
  const user = useRx(userAtomFamily(userId));
}
```

### Cleanup and Lifecycle

```typescript
const runtime = Rx.runtime(AppLive);

// Cleanup after 5 seconds of inactivity
const idleRuntime = runtime.pipe(
  Rx.idleTimeToLive("5 seconds")
);

// Manual cleanup
runtime.dispose();
```

### RX vs Managed Runtime

| Aspect | Managed Runtime | Effect RX |
|--------|-----------------|-----------|
| State management | ❌ Manual | ✅ Automatic |
| Reactivity | ❌ None | ✅ Built-in |
| Suspense | Manual | ✅ Automatic |
| Streaming | Manual accumulation | ✅ Auto-accumulate |
| Cleanup | Manual | ✅ Automatic |
| Maturity | ✅ Stable | ⚠️ Experimental |

**Recommendation**:
- **Production**: Use Managed Runtime (stable)
- **Experimentation**: Try Effect RX (better DX)
- **Future**: RX will likely become recommended approach

---

## Summary: Key Takeaways

### Incremental Adoption Strategies

1. **Start Small**: One library, one endpoint, one component at a time
2. **Use Pattern**: Wrap promise libraries efficiently
3. **Effect.service**: New unified service API
4. **Config Module**: Type-safe configuration
5. **Streams**: Handle pagination and async iterables
6. **FiberSet**: Manage fiber lifecycles in production
7. **Express Integration**: Wrap existing servers incrementally
8. **React Integration**: Use Managed Runtime + React Query
9. **Effect RX**: Experimental reactive state management

### Holistic Thinking Checklist

For every library wrapper:
- [ ] Resource management (cleanup methods?)
- [ ] Interruption support (abort signals?)
- [ ] Error handling (domain errors defined?)
- [ ] Observability (spans added?)

### Common Patterns

```typescript
// 1. Wrap NPM library
const Library = Effect.service(
  "app/Library",
  Effect.gen(function* () {
    const config = yield* Config;
    const client = new ExternalClient(config);
    
    return {
      use: Effect.fn("library.use", (f) =>
        Effect.tryPromise({
          try: (signal) => f(client, { signal }),
          catch: (cause) => new LibraryError({ cause })
        })
      )
    };
  }),
  { effect: true }
);

// 2. Express endpoint
const Routes = Layer.effect("Routes", Effect.gen(function* () {
  const express = yield* ExpressApp;
  const service = yield* MyService;
  
  express.addRoute("get", "/api/data", (req, res) =>
    Effect.gen(function* () {
      const data = yield* service.getData();
      res.json(data);
    })
  );
  
  return {};
}));

// 3. React component
function MyComponent() {
  const runtime = useRuntime();
  
  const query = useQuery({
    queryKey: ["data"],
    queryFn: ({ signal }) =>
      runtime.runPromise(
        Effect.gen(function* () {
          const service = yield* MyService;
          return yield* service.getData();
        }),
        { signal }
      )
  });
  
  return <div>{query.data}</div>;
}
```

### Best Practices

✅ **DO**:
- Use `Effect.fn` for automatic tracing
- Pass abort signals for interruption
- Use FiberSet for request handlers
- Create dedicated methods for common operations
- Locally erase layer dependencies
- Start with use pattern, add methods as needed
- Share MemoMap across runtimes (React)
- Test components with mock layers

❌ **DON'T**:
- Forget resource cleanup (use `acquireRelease`)
- Ignore abort signal support
- Leak fibers (use FiberSet/FiberHandle)
- Use `Effect.uninterruptible` carelessly
- Create new atoms on every render (use Rx.family)
- Wrap everything at once (incremental!)

### Resources

- **Examples**: All code in workshop repository
- **Documentation**: https://effect.website/docs
- **Discord**: Ask questions in #help channel
- **Effect Platform**: Cross-platform HTTP, FileSystem, etc.
- **Effect RX**: Experimental reactive state package

---

*This reference distills a comprehensive workshop on incrementally adopting Effect into existing applications. For hands-on exercises and complete examples, refer to the workshop repository.*
