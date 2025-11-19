---
modified: 2025-09-30T07:36:09-03:00
---
# Schema.TaggedError vs Data.TaggedError - How to choice the most suitable one

Yes, using `Schema.TaggedError` instead of `Data.TaggedError` **does have performance implications**, but they are often misunderstood and almost always negligible in the context of their intended use case. The architectural benefits, especially for a client library, far outweigh the minimal performance overhead.

Here is a detailed breakdown of the performance implications and the architectural rationale for choosing one over the other.

---

### **TL;DR: The Core Difference**

- **`Data.TaggedError`** is a lightweight, in-memory data structure. Its primary job is to provide a tagged class with structural equality (`Equal`) and hashing (`Hash`). Its overhead is **extremely low**, close to a plain JavaScript class.

- **`Schema.TaggedError`** is a much richer construct. It extends `Data.TaggedError` but also builds a complete **Schema AST (Abstract Syntax Tree)** for the error and its properties. This AST is what enables serialization, deserialization, validation, and generation of other artifacts (like JSON Schema). This AST construction has a **small, one-time cost** at class definition time and adds metadata to every instance.

The performance difference is a deliberate trade-off: you exchange a tiny amount of CPU/memory for a massive gain in architectural capability, especially at application boundaries.

### **Detailed Performance & Architectural Comparison**

| Feature | `Data.TaggedError` | `Schema.TaggedError` |
| :--- | :--- | :--- |
| **Primary Purpose** | In-memory domain modeling, type-safe pattern matching. | Data contracts, serialization/deserialization, validation at boundaries. |
| **Overhead** | **Minimal.** Close to a plain class with `Equal`/`Hash` implementations. | **Slightly higher.** Involves creating and storing a Schema AST. |
| **Instantiation Cost** | Very low. Just a class constructor call. | Low. A class constructor call plus internal schema metadata. |
| **Memory Footprint** | Smaller. The instance only holds its own data. | Larger. The class holds the static AST, and instances may carry schema context. |
| **Key Feature** | Structural equality and hashing for free. | **Serialization/deserialization**, runtime validation from `unknown`. |
| **Use When...** | You need a typed, tagged error for **internal application logic** that will never be sent over a network or persisted in a generic format. | You need an error that is part of a **public API contract**, must be **serialized to JSON**, or needs to be validated at a system boundary. |

---

### **Why Does `Schema.TaggedError` Have More Overhead? The Schema AST**

When you define a class with `Schema.TaggedError`, you are not just creating a TypeScript class. Behind the scenes, `effect/schema` is building a detailed, structural representation of your error type.

```typescript
import { Schema } from "effect";

class MyApiError extends Schema.TaggedError<MyApiError>()("MyApiError", {
  // Each of these properties...
  statusCode: Schema.Number,
  requestId: Schema.UUID
}) {}
```

When this code is first evaluated, `effect/schema` constructs an AST that looks something like this (in pseudo-code):

```
AST for MyApiError = {
  _tag: 'Struct',
  fields: [
    { key: '_tag', value: { _tag: 'Literal', value: 'MyApiError' } },
    { key: 'statusCode', value: { _tag: 'Number' } },
    { key: 'requestId', value: { _tag: 'UUID' } }
  ]
}
```

This AST is what powers all of `effect/schema`'s capabilities:

- `Schema.decodeUnknown(MyApiError)` uses the AST to validate an `unknown` object.
- `Schema.encode(MyApiError)` uses the AST to serialize an instance into a plain object.
- `JSONSchema.make(MyApiError)` uses the AST to generate an OpenAPI/JSON Schema definition.

`Data.TaggedError` does none of this. It's just a class with a `_tag` property and the `Equal`/`Hash` machinery.

### **Quantifying the Performance Impact: Is It a Problem?**

1. **Instantiation Cost (The "One-Time" Hit):** The process of building the Schema AST happens **once** when the class module is first imported and evaluated by the JavaScript runtime. This is a small, one-time cost that occurs at application startup. It has **zero impact** on the performance of your running application's logic.

2. **Per-Instance Cost (The "Runtime" Hit):** The cost of calling `new MyApiError({ ... })` is minuscule. While an instance of a `Schema.TaggedError` might hold slightly more internal metadata than a `Data.TaggedError`, this difference is measured in nanoseconds and is completely irrelevant for almost all applications.

3. **Usage Cost (Decoding/Encoding):** This is where the actual computation happens. When you call `Schema.decodeUnknown`, you are paying the performance cost to get runtime safety. This is not "overhead"; it is the feature you are using. This cost is still highly optimized and, in the context of an API client, is completely dwarfed by the network latency.

**Context is King:** For API clients that every operation involves network I/O, which typically takes **tens to hundreds of milliseconds**. The CPU time spent on schema validation or creating a `Schema.TaggedError` instance is in the order of **microseconds or nanoseconds**. The performance impact of using `Schema.TaggedError` is therefore **completely negligible** and effectively zero in this kind of context.

### **Revisiting the Recommendation for `@lexnova/falcao-client`**

My recommendation to standardize on `Schema.TaggedError` for the client library's public errors is based on this architectural trade-off. For a client library, the benefits are immense:

1. **Clear API Contract:** The errors are part of a machine-readable contract. Consumers of your library can know exactly what error shapes to expect.
2. **Serialization:** If this client is used in a full-stack Effect application (e.g., with `@effect/platform/HttpApi`), these errors can be serialized and sent from the server to the client with their types fully intact. `Data.TaggedError` cannot do this.
3. **Interoperability:** You can automatically generate an OpenAPI specification for your client's error types, which is invaluable for documentation and for consumers in other languages.
4. **Robustness:** It enforces the idea that errors from an external boundary are data that must be parsed and validated, just like success responses.

Using `Data.TaggedError` would be an optimization for a problem that doesn't exist (CPU-bound performance in an I/O-bound library) at the cost of significant architectural compromises.

### **A Clear Decision Heuristic: When to Use Which**

Here is a simple, production-ready guideline for choosing between the two:

1. **Will this error ever cross a serialization boundary?**
	- (e.g., sent as a JSON response, stored in a database in a generic format, passed to a web worker)
	- **Yes** → Use **`Schema.TaggedError`**.
	- **No** → Go to the next question.

2. **Is this error part of a public, external-facing contract?**
	- (e.g., an error that a consumer of your library or API needs to handle)
	- **Yes** → Use **`Schema.TaggedError`**.
	- **No** → Go to the next question.

3. **Is this a purely internal, in-memory domain error used for control flow or logic within your application's private implementation?**
	- **Yes** → Use **`Data.TaggedError`**. It's lighter and perfectly suited for this.

**Example Scenario:**

```typescript
import { Data, Schema, Effect } from "effect";

// Crosses an API boundary, part of the public contract.
export class UserNotFoundApiError extends Schema.TaggedError<UserNotFoundApiError>()("UserNotFound", {
  userId: Schema.String
}) {}

// Purely internal error for control flow inside the service.
class CacheMiss extends Data.TaggedError("CacheMiss")<{ key: string }> {}

const UserService = Effect.Service<UserService>()("UserService", {
  effect: Effect.gen(function*() {
    const db = yield* Database;
    const cache = yield* Cache;

    return {
      getUser: (id: string) =>
        cache.get(id).pipe(
          Effect.catchTag("CacheMiss", () =>
            db.findUser(id).pipe(
              // If DB fails, map the internal DB error to the public API error.
              Effect.catchTag("DbRowNotFound", () => Effect.fail(new UserNotFoundApiError({ userId: id })))
            )
          )
        )
    };
  })
});
```

In this example, `CacheMiss` is an internal implementation detail and can be a lightweight `Data.TaggedError`. `UserNotFoundApiError`, however, is part of the service's public contract and may need to be serialized, so it is correctly defined as a `Schema.TaggedError`.

### **Conclusion**

The performance difference between `Schema.TaggedError` and `Data.TaggedError` is real but microscopic and architecturaly insignificant for boundary-crossing data. The choice is not about performance micro-optimization; it is a deliberate architectural decision.

- Use **`Data.TaggedError`** for speed and simplicity in your **internal domain logic**.
- Use **`Schema.TaggedError`** for robustness and capability at your **application's boundaries**.
