---
modified: 2025-09-28T12:22:15-03:00
---
# response.schemaBodyJson() vs HttpBody.json() vs HttpBody.unsafeJson()

Excellent question. This is a critical distinction that lies at the heart of building robust, type-safe HTTP clients and servers with Effect. The knowledge base provides clear, idiomatic patterns for this.

Here is a highly detailed and comprehensive code review and guide explaining the differences and proper usage of `HttpClientResponse.schemaBodyJson()`, `HttpBody.json()`, and `HttpBody.unsafeJson()`.

---

### **Executive Summary & Quick Reference Table**

The fundamental difference is **direction and purpose**:

- `HttpBody.*` functions are for **creating outgoing request bodies**.
- `HttpClientResponse.schemaBodyJson()` is for **parsing and validating incoming response bodies**.

| Function | Direction | Purpose | Key Feature | When to Use |
| :--- | :--- | :--- | :--- | :--- |
| `HttpClientResponse.schemaBodyJson(schema)` | **Response (Incoming)** | Parse AND validate a JSON response body against a schema. | **Runtime type safety for received data**. | **Always**. This is the idiomatic and safe way to consume JSON APIs. |
| `HttpBody.json(value)` | **Request (Outgoing)** | **Safely** create a JSON request body from a value. | **Pre-serialization check**. Fails with a typed `BodyError` if the value isn't JSON-serializable. | Default choice for sending data. Use when the payload might contain non-serializable types (e.g., BigInt, circular refs). |
| `HttpBody.unsafeJson(value)` | **Request (Outgoing)** | Create a JSON request body **without** pre-validation. | **Performance**. Skips the safety check and directly calls `JSON.stringify`. | Performance-critical paths where you are **100% certain** the data is serializable (e.g., data just encoded by a schema). |

---

### **1. `HttpClientResponse.schemaBodyJson(schema)`: The Guardian at the Gate (Incoming Data)**

This is the most important and frequently used of the three. It is your primary tool for ensuring the data you receive from an API is safe and conforms to your application's types.

- **Purpose:** To parse an incoming `HttpClientResponse` body as JSON and then validate its structure against a provided `effect/schema`.
- **Direction:** **Response** (Incoming data from a server).
- **How it Works:** It is a high-level combinator that performs a two-step, effectful pipeline:
	1. It calls the equivalent of `response.json()`, which returns a `Effect<unknown, BodyError>`.
	2. It then pipes this `unknown` result into `Schema.parse(schema)`, which returns an `Effect<A, ParseError>`.

	The final `Effect` succeeds with your strongly-typed domain model (`A`) or fails with a `BodyError` or `ParseError`, giving you precise information about what went wrong.

- **Code Example:**

	```typescript
    import { Effect, Schema } from "effect";
    import { HttpClient, HttpClientRequest } from "@effect/platform";
    import { FalcaoClientError } from "./src/domain/errors";
    import { SearchResponseSchema, type SearchResponse } from "./src/domain/models";

    const getSearchResults = (
      query: string
    ): Effect.Effect<SearchResponse, FalcaoClientError> =>
      HttpClientRequest.get("/search").pipe(
        HttpClientRequest.setUrlParams({ q: query }),
        HttpClient.execute, // Assume a client is provided
        // This is the key step
        Effect.flatMap(
          HttpClientResponse.schemaBodyJson(SearchResponseSchema)
        ),
        // Map platform errors to our domain errors
        Effect.mapError((e) => new FalcaoValidationError({ error: e, message: "Invalid search response" }))
      );
    ```

- **Use Case / Rationale:**
	This is the **mandatory pattern for consuming JSON APIs** in a production-grade Effect application. It bridges the gap between TypeScript's compile-time types and JavaScript's runtime reality. It prevents runtime errors caused by unexpected API changes, malformed data, or contract drift. As seen in "The Death of tRPC," this provides a runtime guarantee that tRPC's serialization layer alone does not.

---

### **2. `HttpBody.json(value)`: The Safe Bodyguard (Outgoing Data)**

This is the **safe default** for creating a JSON body for an outgoing HTTP request.

- **Purpose:** To create an `HttpBody` from a JavaScript value, ensuring it can be successfully serialized to JSON *before* the request is made.
- **Direction:** **Request** (Outgoing data to a server).
- **How it Works:**
	1. It performs a pre-flight check to see if `JSON.stringify` would throw an exception for the given value (e.g., for `BigInt`, circular references, functions).
	2. If the check passes, it creates an `HttpBody` that will serialize the value.
	3. If the check fails, it returns an `Effect` that immediately fails with a typed `BodyError`. This prevents a `try/catch` block from being needed at the call site.

- **Code Example:**

	```typescript
    import { Effect } from "effect";
    import { HttpBody, HttpClientRequest } from "@effect/platform";

    // ✅ Safe: This is a plain, serializable object.
    const validPayload = { name: "Alice", age: 30 };
    const safeBody = HttpBody.json(validPayload);
    const safeRequest = HttpClientRequest.post("/users").pipe(
      HttpClientRequest.setBody(safeBody)
    );

    // ❌ Unsafe: This contains a BigInt, which JSON.stringify throws on.
    const invalidPayload = { id: 1n, name: "Bob" };
    // This will return a `Left` Either or a failed Effect, preventing a runtime crash.
    const unsafeBodyEffect = Effect.either(HttpBody.json(invalidPayload));

    Effect.runPromise(unsafeBodyEffect).then(result => {
        if(result._tag === "Left") {
            console.error("Failed to create body:", result.left);
            // Will log a BodyError, specifically a "BodyError: Unsupported body type"
        }
    });
    ```

- **Use Case / Rationale:**
	Use `HttpBody.json` in **95% of cases** when creating a request body. It is the robust, idiomatic choice that protects your application from unexpected serialization failures. The small performance overhead of the pre-flight check is almost always worth the safety guarantee.

---

### **3. `HttpBody.unsafeJson(value)`: The Fast Lane (Outgoing Data)**

This is the performance-optimized, but less safe, variant for creating a JSON request body.

- **Purpose:** To create an `HttpBody` from a JavaScript value without performing any pre-serialization checks.
- **Direction:** **Request** (Outgoing data to a server).
- **How it Works:** It bypasses the safety check and directly uses `JSON.stringify`. If the value is not serializable, `JSON.stringify` will throw an exception. Inside an `Effect` pipeline, this will be caught and will terminate the fiber with a **defect**, as it represents an unexpected programming error (a violation of the function's contract).

- **Code Example:**

	```typescript
    import { Schema } from "effect";
    import { HttpBody, HttpClientRequest } from "@effect/platform";

    const CreateUserPayloadSchema = Schema.Struct({ name: Schema.String, age: Schema.Number });
    type CreateUserPayload = Schema.Schema.Type<typeof CreateUserPayloadSchema>;

    const createUser = (payload: CreateUserPayload) => {
      // Because `payload` is guaranteed by the type system to have come
      // from a schema that is known to be serializable, we can use `unsafeJson`
      // for a micro-optimization.
      const body = HttpBody.unsafeJson(payload);

      return HttpClientRequest.post("/users").pipe(
        HttpClientRequest.setBody(body)
      );
    }
    ```

- **Use Case / Rationale:**
	Use `HttpBody.unsafeJson` only when you have a **very high degree of certainty** that the value is serializable. The canonical use case is when you are sending data that has just been **encoded by a schema**, as in the example above. In this scenario, you know the object is a plain data structure with no circular references or unsupported types, so the pre-flight check of `HttpBody.json` is redundant.

---

### **Decision Flowchart**

Here is a simple flowchart to guide your choice:

```mermaid
graph TD
    A[Start: I need to handle an HTTP body] --> B{Am I sending a request or receiving a response?};
    B -->|Receiving a Response| C[Use HttpClientResponse.schemaBodyJson(schema)];
    B -->|Sending a Request| D{Am I 100% certain the data is JSON-serializable?};
    D -->|Yes (e.g., just encoded by a schema)| E[Use HttpBody.unsafeJson(value) for performance];
    D -->|No, or I'm not sure| F[Use HttpBody.json(value) for safety];

    C --> G((End));
    E --> G((End));
    F --> G((End));

    style C fill:#d4edda,stroke:#155724
    style E fill:#fff3cd,stroke:#856404
    style F fill:#d4edda,stroke:#155724
```

### **Putting It All Together: A Full Client Example**

This example demonstrates the correct usage of all three functions in a realistic client-server interaction.

```typescript
import { Effect, Schema, Layer } from "effect";
import { HttpClient, HttpClientRequest, HttpBody, HttpClientResponse } from "@effect/platform";
import { NodeHttpClient } from "@effect/platform-node";
import { FalcaoApiError } from "./src/domain/errors";

// 1. Define the schema for the data model
class User extends Schema.Class<User>("User")({
  id: Schema.UUID,
  name: Schema.String
}) {}

// 2. Define the payload schema for creating a user
const CreateUserPayloadSchema = User.pipe(Schema.pick("name"));
type CreateUserPayload = Schema.Schema.Type<typeof CreateUserPayloadSchema>;

// 3. Define the service interface for the API client
interface UserApiClient {
  readonly getUser: (id: string) => Effect.Effect<User, FalcaoApiError>;
  readonly createUser: (payload: CreateUserPayload) => Effect.Effect<User, FalcaoApiError>;
}
const UserApiClient = Effect.Tag<UserApiClient>();

// 4. Implement the client layer
const UserApiClientLive = Layer.effect(
  UserApiClient,
  Effect.gen(function*() {
    const defaultClient = yield* HttpClient.HttpClient;

    // A pre-configured client for our API
    const client = defaultClient.pipe(
      HttpClient.mapRequest(HttpClientRequest.prependUrl("https://api.example.com"))
    );

    return UserApiClient.of({
      getUser: (id: string) =>
        client.pipe(
          HttpClient.get(`/users/${id}`),
          // USE CASE 1: Parse and validate the INCOMING response body
          Effect.flatMap(HttpClientResponse.schemaBodyJson(User)),
          Effect.mapError((e) => new FalcaoApiError({ message: "Failed to get user", details: e }))
        ),

      createUser: (payload: CreateUserPayload) => {
        // First, ensure the payload is valid against our schema (good practice)
        const validatedPayload = Schema.decodeUnknownSync(CreateUserPayloadSchema)(payload);

        return client.pipe(
          HttpClient.post("/users"),
          // USE CASE 2: Use `unsafeJson` because we *know* the data is serializable
          // after being validated by the schema. This is a safe optimization.
          HttpClientRequest.setBody(HttpBody.unsafeJson(validatedPayload)),
          Effect.flatMap(HttpClientResponse.schemaBodyJson(User)),
          Effect.mapError((e) => new FalcaoApiError({ message: "Failed to create user", details: e }))
        );
      }
    });
  })
).pipe(Layer.provide(NodeHttpClient.layer)); // Provide the actual HTTP implementation
```

This example correctly follows the patterns identified in the knowledge base: it uses `schemaBodyJson` for all incoming data and makes a deliberate, justified choice to use `unsafeJson` for outgoing data that has just been validated. If the `createUser` function received an `unknown` payload, `HttpBody.json` would be the safer choice.
