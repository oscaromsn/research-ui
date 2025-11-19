---
modified: 2025-10-26T14:42:18-03:00
---
# Streaming protocol support in Effect
## WebSocket Support

**Status**: ❌ **No native WebSocket module yet**, but it's straightforward to integrate.

The Effect Workshop materials show WebSocket integration patterns:

```typescript
// From the workshop - wrapping WebSocket with Effect
import { Effect, Stream, Layer } from "effect";
import { WebSocketServer } from "ws";

export class WebSocketService extends Effect.Service<WebSocketService>()(
  "app/WebSocketService",
  {
    scoped: Effect.gen(function* () {
      const wss = yield* Effect.acquireRelease(
        Effect.sync(() => new WebSocketServer({ port: 3000 })),
        (server) => Effect.sync(() => server.close())
      );
      
      return {
        // Multi-shot callback pattern using Stream.async
        onConnection: Stream.async<WebSocket>((emit) => {
          wss.on("connection", (ws) => {
            emit.single(ws); // Stream.async handles multiple callbacks
          });
        }),
        
        // Subscribe to messages from a specific client
        messages: (ws: WebSocket) => 
          Stream.async<string>((emit) => {
            ws.on("message", (data) => {
              emit.single(data.toString());
            });
            
            ws.on("close", () => {
              emit.end(); // Signal stream completion
            });
          })
      };
    })
  }
) {}
```

**Key Pattern**: Use `Stream.async` for multi-shot callbacks (event emitters, websockets).

## Server-Sent Events (SSE)

**Status**: ⚠️ **Not a dedicated module**, but `@effect/platform` provides HTTP streaming primitives.

You can implement SSE using `HttpServerResponse` with streaming:

```typescript
import { HttpServerResponse, HttpServerRequest } from "@effect/platform";
import { Stream, Effect } from "effect";

const sseEndpoint = (request: HttpServerRequest.HttpServerRequest) =>
  Effect.gen(function* () {
    const eventBus = yield* EventBus;
    
    // Create SSE-formatted stream
    const eventStream = eventBus.subscribe().pipe(
      Stream.map(event => 
        `data: ${JSON.stringify(event)}\n\n` // SSE format
      ),
      Stream.encodeText // Convert strings to Uint8Array
    );
    
    return HttpServerResponse.stream(eventStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  });
```

**Recommendation**: For production SSE, combine with the PubSub pattern I showed earlier for robust event broadcasting.

## AI SDK Support

**Status**: ✅ **Native, First-Class Support!**

Effect has an **official AI ecosystem** with provider-agnostic abstractions:

### Core Packages

```bash
# Base abstractions (always required)
npm install @effect/ai

# Provider integrations (choose one or more)
npm install @effect/ai-openai
npm install @effect/ai-anthropic
npm install @effect/ai-amazon-bedrock
npm install @effect/ai-google
```

### Provider-Agnostic Pattern

```typescript
import { LanguageModel } from "@effect/ai";
import { OpenAiLanguageModel } from "@effect/ai-openai";
import { AnthropicLanguageModel } from "@effect/ai-anthropic";
import { Effect } from "effect";

// Write provider-agnostic logic
const generateResponse = (prompt: string) =>
  Effect.gen(function* () {
    const response = yield* LanguageModel.generateText({ prompt });
    return response.text;
  });

// Swap providers at runtime via layers
const withOpenAI = generateResponse("Tell me a joke").pipe(
  Effect.provide(OpenAiLanguageModel.model("gpt-4o"))
);

const withAnthropic = generateResponse("Tell me a joke").pipe(
  Effect.provide(AnthropicLanguageModel.model("claude-sonnet-4"))
);
```

### Native Streaming Support

```typescript
import { LanguageModel } from "@effect/ai";
import { Stream, Effect } from "effect";

// Built-in streaming
const streamResponse = Effect.gen(function* () {
  const stream = yield* LanguageModel.generateTextStream({
    prompt: "Write a story"
  });
  
  // The stream is already an Effect Stream!
  return yield* stream.pipe(
    Stream.tap(chunk => Effect.log(`Token: ${chunk.text}`)),
    Stream.runCollect
  );
});
```

### Tool Calling (Function Calling)

```typescript
import { LanguageModel, Tool } from "@effect/ai";
import { Effect, Schema } from "effect";

const weatherTool = Tool.make({
  name: "get_weather",
  description: "Get weather for a location",
  parameters: Schema.Struct({
    location: Schema.String,
    units: Schema.optional(Schema.Literal("celsius", "fahrenheit"))
  }),
  execute: (params) => 
    Effect.succeed({ temperature: 72, condition: "sunny" })
});

const program = Effect.gen(function* () {
  const response = yield* LanguageModel.generateText({
    prompt: "What's the weather in Paris?",
    tools: [weatherTool],
    toolChoice: "auto"
  });
  
  // Effect handles tool execution automatically!
  return response.text;
});
```

### Execution Planning (Multi-Provider Fallback)

This is **unique to Effect** - declarative fallback strategies:

```typescript
import { ExecutionPlan, Effect, Schedule } from "effect";
import { OpenAiLanguageModel } from "@effect/ai-openai";
import { AnthropicLanguageModel } from "@effect/ai-anthropic";

class NetworkError extends Data.TaggedError("NetworkError") {}
class RateLimitError extends Data.TaggedError("RateLimitError") {}

const plan = ExecutionPlan.make(
  {
    // Try OpenAI first
    provide: OpenAiLanguageModel.model("gpt-4o"),
    attempts: 3,
    schedule: Schedule.exponential("100 millis"),
    while: (error) => error._tag === "NetworkError"
  },
  {
    // Fallback to Anthropic on rate limits
    provide: AnthropicLanguageModel.model("claude-sonnet-4"),
    attempts: 2,
    schedule: Schedule.exponential("100 millis"),
    while: (error) => error._tag === "RateLimitError"
  }
);

const resilientGeneration = generateText("prompt").pipe(
  Effect.withExecutionPlan(plan)
);
```

## Recommended Stack for Multi-Agent LLM Streaming

Based on Effect's capabilities, here's the optimal architecture:

```typescript
// 1. Use @effect/ai for LLM interactions
import { LanguageModel } from "@effect/ai";
import { AnthropicLanguageModel } from "@effect/ai-anthropic";

// 2. Use PubSub + Stream for event distribution
import { PubSub, Stream, Effect } from "effect";

// 3. Implement SSE endpoint with HttpServerResponse
import { HttpServerResponse } from "@effect/platform";

// 4. Wrap WebSocket with Stream.async for bidirectional communication

const architecture = Effect.gen(function* () {
  // Event bus for multi-agent coordination
  const eventBus = yield* PubSub.unbounded<AgentEvent>();
  
  // LLM streaming with side-effect event publishing
  const agentStream = LanguageModel.generateTextStream({ prompt })
    .pipe(
      Stream.tap(token => 
        PubSub.publish(eventBus, new TokenEvent({ token }))
      )
    );
  
  // Multiple frontends subscribe to the same event bus
  const sseSubscription = Stream.fromPubSub(eventBus).pipe(
    Stream.map(formatSSE),
    Stream.encodeText
  );
  
  const wsSubscription = Stream.fromPubSub(eventBus).pipe(
    Stream.map(JSON.stringify),
    Stream.tap(sendToWebSocket)
  );
});
```

## Summary Table

| Feature | Native Support | Status | Package |
|---------|----------------|--------|---------|
| **AI/LLM** | ✅ Yes | Production-ready | `@effect/ai`, `@effect/ai-openai`, `@effect/ai-anthropic` |
| **Streaming (HTTP)** | ✅ Yes | Production-ready | `@effect/platform` (HttpServerResponse) |
| **SSE** | ⚠️ Primitives | Build using HTTP streaming | `@effect/platform` |
| **WebSocket** | ❌ No | Use `Stream.async` wrapper | Community patterns |
| **PubSub** | ✅ Yes | Production-ready | `effect` (core) |
| **Stream** | ✅ Yes | Production-ready | `effect` (core) |

**Bottom Line**: Effect has **exceptional AI/LLM support** with streaming built-in. WebSocket requires manual wrapping (easy with `Stream.async`), and SSE is simple using HTTP streaming primitives. The combination is perfect for your multi-agent reasoning trace visualization!
