## Effect-TS and BAML Integration

### Overview: Why BAML?

**BAML (Boundary Markup Language)** is a domain-specific language for defining and calling LLMs with strong typing and observability. In this architecture, BAML serves as the **boundary layer** between the event-driven Effect system and external LLM providers (Anthropic, OpenAI, etc.).

**Key benefits of BAML integration**:
- **Type-safe prompts**: Prompts are defined in `.baml` files and compiled to TypeScript
- **Streaming support**: Native async iterable streaming that integrates with Effect
- **Multi-provider**: Switch between Claude, GPT, etc. with configuration changes
- **Observability**: Built-in request/response logging via Collector
- **Prompt versioning**: Prompts are code, not strings scattered across your app

### BAML Configuration

The BAML schema defines the LLM interaction contract:

```baml
// baml_src/main.baml

generator target {
    output_type "typescript"
    output_dir "../src"
    version "0.209.0"
    default_client_mode async
}

class ChatMessage {
  role "user" | "assistant"
  content string
}

function Chat(
  chatHistory: ChatMessage[]
) -> string {
  client BedrockSonnet
  prompt #"
    {{ _.role("system") }}
    You are a chatbot with the ability to execute code.

    You have access to one tool:
    - eval(code: string, description: string): Evaluates JavaScript code

    When you want to run code, use ANTML format:
    <function_calls>
      <invoke name="eval">
        <parameter name="code">YOUR_CODE_HERE</parameter>
        <parameter name="description">Brief description</parameter>
      </invoke>
    </function_calls>

    Be concise and helpful.

    {% for message in chatHistory %}
    {% if loop.last %}
    {{ _.role(message.role, cache_control={"type": "ephemeral"}) }}
    {% else %}
    {{ _.role(message.role) }}
    {% endif %}
    {{ message.content }}
    {% endfor %}
  "#
}

client<llm> BedrockSonnet {
  provider aws-bedrock
  options {
    model "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
    inference_configuration {
      max_tokens 8192
      temperature 0.7
    }
    additional_model_request_fields {
      stop_sequences ["</function_calls>"]
    }
    allowed_role_metadata ["cache_control"]
  }
}
```

**Key features used**:
- **Jinja2 templating**: Build prompts with loops and conditionals
- **Prompt caching**: Last message marked with `cache_control` for Anthropic caching
- **Stop sequences**: Halt generation at `</function_calls>` to prevent incomplete XML
- **Type safety**: `ChatMessage[]` input, `string` output enforced at compile time

### The Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LLMService (Effect)                     │
│                                                              │
│  1. Listen for llm_response_started events                  │
│  2. Get LLM context from LLMMemoryState                     │
│  3. Convert to BAML format (ChatMessage[])                  │
│     ┌──────────────────────────────────────────┐            │
│     │          b.stream.Chat()                 │            │
│     │  ┌────────────────────────────────────┐  │            │
│     │  │  BAML Runtime                      │  │            │
│     │  │  - Render prompt template          │  │            │
│     │  │  - Call AWS Bedrock API            │  │            │
│     │  │  - Stream chunks via AsyncIterable │  │            │
│     │  └────────────────────────────────────┘  │            │
│     └──────────────────────────────────────────┘            │
│  4. Convert AsyncIterable → Effect Stream                   │
│  5. Track incremental chunks (compute diffs)                │
│  6. Publish llm_text_chunk events                           │
│  7. Extract usage from Collector                            │
│  8. Publish llm_response_completed                          │
│                                                              │
│  All wrapped in makeInterruptible for cancellation          │
└─────────────────────────────────────────────────────────────┘
```

### Core Integration Code

The LLMService bridges Effect's event-driven model with BAML's streaming API:

```typescript
// src/services/llm-service.ts
import { Effect, Stream, Ref } from 'effect'
import { b, type ChatMessage } from '../baml_client'
import { Collector } from '@boundaryml/baml'
import type { LLMMessage, BamlUsage } from '../events.ts'
import { EventBus } from './event-bus.ts'
import { LLMMemoryState } from './llm-memory-state.ts'
import { makeInterruptible } from '../utils/interruptible.ts'

export class LLMService extends Effect.Service<LLMService>()('LLMService', {
  scoped: Effect.gen(function* () {
    const eventBus = yield* EventBus
    const llmMemoryState = yield* LLMMemoryState
    
    // BAML Collector tracks all LLM calls for observability
    const collector = new Collector('LLMService')
    const usageRef = yield* Ref.make<BamlUsage>({ totalTokens: 0 })

    // Subscribe to LLM start events
    const llmStarts = yield* eventBus.subscribe(
      (e): e is { type: 'llm_response_started'; streamId: string } =>
        e.type === 'llm_response_started'
    )

    yield* Stream.runForEach(llmStarts, (event) =>
      Effect.gen(function* () {
        console.log('[LLMService] Starting stream:', event.streamId)

        // 1. Get current LLM-formatted messages from projection
        const llmMessages = yield* llmMemoryState.getCurrentMessages

        // 2. Convert to BAML format
        const bamlMessages: ChatMessage[] = llmMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))

        // 3. Call BAML streaming function
        const bamlStream = b.stream.Chat(bamlMessages, { collector })

        // 4. Convert BAML AsyncIterable to Effect Stream
        const contentStream = Stream.fromAsyncIterable(
          bamlStream,
          (error) => error as Error
        )

        // 5. Track accumulated text for incremental streaming
        const accumulatedRef = yield* Ref.make('')

        // 6. Compute incremental chunks (only send what's new)
        const incrementalStream = contentStream.pipe(
          Stream.scan(
            { previous: '', accumulated: '', current: '' },
            (state, currentContent) => ({
              previous: currentContent,
              accumulated: currentContent,
              current: currentContent.slice(state.previous.length)
            })
          ),
          Stream.filter(({ current }) => current.length > 0),
          Stream.tap(({ accumulated }) =>
            Ref.set(accumulatedRef, accumulated)
          )
        )

        // 7. Make stream interruptible
        const result = yield* makeInterruptible(
          Stream.runForEach(
            incrementalStream,
            ({ current }) => {
              return eventBus.publish({
                type: 'llm_text_chunk',
                streamId: event.streamId,
                text: current
              })
            }
          ),
          eventBus
        )

        // 8. Extract usage from BAML Collector
        const lastCall = collector.last?.calls.at(-1)
        if (lastCall?.httpResponse) {
          try {
            const body = lastCall.httpResponse.body.json()
            const usage = body.usage
            if (usage) {
              yield* Ref.set(usageRef, { 
                totalTokens: usage.input_tokens + usage.output_tokens 
              })
            }
          } catch {
            yield* Ref.set(usageRef, {
              totalTokens: (collector.usage.inputTokens ?? 0) + 
                          (collector.usage.outputTokens ?? 0)
            })
          }
        }

        const currentUsage = yield* Ref.get(usageRef)

        // 9. Handle completion or interruption
        if (result._tag === 'Failed') {
          yield* eventBus.publish({
            type: 'llm_stream_interrupted',
            streamId: event.streamId
          })
        } else if (result._tag === 'Interrupted') {
          yield* eventBus.publish({
            type: 'llm_stream_interrupted',
            streamId: event.streamId
          })
          yield* eventBus.publish({
            type: 'llm_response_completed',
            streamId: event.streamId,
            usage: currentUsage
          })
          yield* eventBus.publish({
            type: 'interrupt_cleanup_completed'
          })
        } else {
          // 10. Check if we need to add synthetic closing tag
          const finalAccumulated = yield* Ref.get(accumulatedRef)
          const needsClosingTag = (text: string) => {
            const trimmed = text.trimEnd()
            if (!trimmed.endsWith('</invoke>')) return false
            const openCount = (trimmed.match(/<function_calls>/g) || []).length
            const closeCount = (trimmed.match(/<\/function_calls>/g) || []).length
            return openCount > closeCount
          }

          if (needsClosingTag(finalAccumulated)) {
            console.log('[LLMService] Adding synthetic </function_calls> closing tag')
            yield* eventBus.publish({
              type: 'llm_text_chunk',
              streamId: event.streamId,
              text: '</function_calls>'
            })
          }

          yield* eventBus.publish({
            type: 'llm_response_completed',
            streamId: event.streamId,
            usage: currentUsage
          })
        }
      }).pipe(
        Effect.catchAll((error) => {
          console.log('[LLMService] ERROR:', error)
          return eventBus.publish({
            type: 'llm_stream_interrupted',
            streamId: event.streamId
          })
        })
      )
    ).pipe(Effect.forkScoped)

    return {
      start: Effect.void,
      getUsage: Ref.get(usageRef)
    }
  }),
  dependencies: [EventBus.Default, LLMMemoryState.Default]
}) {}
```

### Key Integration Patterns

#### 1. AsyncIterable to Effect Stream Conversion

BAML returns an `AsyncIterable<string>`, Effect provides `Stream.fromAsyncIterable`:

```typescript
const bamlStream = b.stream.Chat(bamlMessages, { collector })

// Convert to Effect Stream
const contentStream = Stream.fromAsyncIterable(
  bamlStream,
  (error) => error as Error  // Error mapper
)
```

**Why this matters**: Effect Streams integrate seamlessly with the rest of the Effect ecosystem—they support interruption, concurrency, and composition with other streams.

#### 2. Incremental Chunk Computation

BAML streams return **cumulative content** (not deltas). We compute incremental chunks using `Stream.scan`:

```typescript
const incrementalStream = contentStream.pipe(
  Stream.scan(
    { previous: '', accumulated: '', current: '' },
    (state, currentContent) => ({
      previous: currentContent,           // Last cumulative
      accumulated: currentContent,        // Current cumulative
      current: currentContent.slice(state.previous.length)  // NEW text only
    })
  ),
  Stream.filter(({ current }) => current.length > 0),
  Stream.tap(({ accumulated }) => Ref.set(accumulatedRef, accumulated))
)
```

**Example**:

```
BAML emits: "Hello"
→ current = "Hello" (first chunk)

BAML emits: "Hello world"
→ current = " world" (delta only)

BAML emits: "Hello world!"
→ current = "!" (delta only)
```

This ensures we only publish the **new text** in each `llm_text_chunk` event, which is critical for:
- **Efficient UI updates**: Frontend appends only new text
- **Correct state tracking**: MessagesReducer concatenates chunks correctly
- **Bandwidth optimization**: Don't resend entire content on every update

#### 3. Observability with BAML Collector

The `Collector` captures all LLM requests/responses for debugging:

```typescript
const collector = new Collector('LLMService')

// Pass to BAML
const bamlStream = b.stream.Chat(bamlMessages, { collector })

// Later: extract usage from last call
const lastCall = collector.last?.calls.at(-1)
if (lastCall?.httpResponse) {
  const body = lastCall.httpResponse.body.json()
  const usage = body.usage
  // usage.input_tokens, usage.output_tokens
}
```

**Benefits**:
- **Token tracking**: Know exactly how many tokens each call used
- **Request history**: Access full request/response for debugging
- **Error diagnosis**: See exact HTTP responses when things fail

#### 4. Interruption Support

The entire BAML stream is wrapped in `makeInterruptible`:

```typescript
const result = yield* makeInterruptible(
  Stream.runForEach(incrementalStream, ({ current }) => {
    return eventBus.publish({
      type: 'llm_text_chunk',
      streamId: event.streamId,
      text: current
    })
  }),
  eventBus
)

if (result._tag === 'Interrupted') {
  // Clean up and publish completion events
  yield* eventBus.publish({ type: 'llm_stream_interrupted', streamId: event.streamId })
  yield* eventBus.publish({ type: 'llm_response_completed', streamId: event.streamId, usage })
  yield* eventBus.publish({ type: 'interrupt_cleanup_completed' })
}
```

**How it works**:
1. `makeInterruptible` races the stream with an interrupt signal
2. Interrupt signal triggers on `interrupt_requested` event
3. Effect's interruption system cancels the BAML stream
4. Service publishes cleanup events

This is **far superior** to trying to cancel async iterables manually—Effect handles all the cleanup automatically.

#### 5. Synthetic Closing Tag Injection

LLMs sometimes forget to close XML tags. We detect and fix this:

```typescript
const needsClosingTag = (text: string) => {
  const trimmed = text.trimEnd()
  if (!trimmed.endsWith('</invoke>')) return false
  const openCount = (trimmed.match(/<function_calls>/g) || []).length
  const closeCount = (trimmed.match(/<\/function_calls>/g) || []).length
  return openCount > closeCount
}

if (needsClosingTag(finalAccumulated)) {
  console.log('[LLMService] Adding synthetic </function_calls> closing tag')
  yield* eventBus.publish({
    type: 'llm_text_chunk',
    streamId: event.streamId,
    text: '</function_calls>'
  })
}
```

**Why this matters**: The ANTML parser requires valid XML. Without this fix, incomplete tool calls would fail to parse, breaking the agent loop.

### Message Format Transformation

The integration involves multiple format transformations:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Format Transformations                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Domain Messages (MessagesState)                             │
│     type Message =                                              │
│       | { role: 'user' | 'assistant', type: 'text', content }  │
│       | { role: 'assistant', type: 'function_calls', calls }   │
│       | { role: 'user', type: 'function_results', results }    │
│                                                                  │
│     ↓ (LLMMemoryState projection)                               │
│                                                                  │
│  2. LLM Messages (for context window)                           │
│     type LLMMessage = { role: 'user' | 'assistant', content }  │
│     - function_calls → formatFunctionCalls() → ANTML XML        │
│     - function_results → formatFunctionResults() → ANTML XML    │
│                                                                  │
│     ↓ (LLMService conversion)                                   │
│                                                                  │
│  3. BAML Messages (for API call)                                │
│     type ChatMessage = { role: 'user' | 'assistant', content } │
│                                                                  │
│     ↓ (BAML runtime)                                            │
│                                                                  │
│  4. Provider-Specific Messages (e.g., Anthropic Messages API)  │
│     [{ role: 'user', content: [...] }, ...]                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Example transformation**:

```typescript
// 1. Domain message (function_results)
const domainMessage: Message = {
  id: 'msg_123',
  role: 'user',
  type: 'function_results',
  results: [
    { name: 'eval', success: true, output: '42' }
  ],
  timestamp: Date.now()
}

// 2. LLM message (formatted as ANTML XML)
const llmMessage: LLMMessage = {
  role: 'user',
  content: formatFunctionResults(domainMessage.results)
  // Returns:
  // <function_results>
  // <result>
  // <name>eval</name>
  // <output>42</output>
  // </result>
  // </function_results>
}

// 3. BAML message (same as LLM message)
const bamlMessage: ChatMessage = {
  role: llmMessage.role,
  content: llmMessage.content
}

// 4. Provider message (handled by BAML)
// BAML renders the prompt template and sends to Bedrock
```

### Error Handling

The integration handles multiple failure modes:

```typescript
// 1. BAML stream errors
const contentStream = Stream.fromAsyncIterable(
  bamlStream,
  (error) => error as Error  // Convert to Effect error
)

// 2. Processing errors
yield* Stream.runForEach(llmStarts, (event) =>
  Effect.gen(function* () {
    // ... BAML logic
  }).pipe(
    Effect.catchAll((error) => {
      console.log('[LLMService] ERROR:', error)
      return eventBus.publish({
        type: 'llm_stream_interrupted',
        streamId: event.streamId
      })
    })
  )
).pipe(Effect.forkScoped)

// 3. Interruption (handled by makeInterruptible)
const result = yield* makeInterruptible(streamProcessing, eventBus)
if (result._tag === 'Failed') {
  // Handle failure
} else if (result._tag === 'Interrupted') {
  // Handle interruption
}
```

**Error propagation**:
1. BAML errors → Effect Stream errors
2. Effect errors → `llm_stream_interrupted` event
3. Events → UI shows error state

### Benefits of Effect-BAML Integration

#### 1. **Type Safety Across Boundaries**

```typescript
// BAML generates TypeScript types from .baml files
import { b, type ChatMessage } from '../baml_client'

// Compile-time checking
const messages: ChatMessage[] = [
  { role: 'user', content: 'Hello' },
  { role: 'invalid', content: 'Oops' }  // ❌ Type error!
]
```

#### 2. **Separation of Concerns**

- **BAML**: Handles LLM provider details (auth, retries, formatting)
- **Effect**: Handles application logic (state, events, concurrency)
- **Integration layer**: Converts between the two worlds

This means:
- Switch LLM providers by changing BAML config (no code changes)
- Test business logic without calling real LLMs
- Observe LLM calls separately from application events

#### 3. **Streaming Performance**

Effect Streams are **lazy** and **backpressure-aware**:

```typescript
// Stream only processes as fast as downstream can consume
const incrementalStream = contentStream.pipe(
  Stream.scan(...),           // Transform
  Stream.filter(...),         // Filter
  Stream.tap(...)             // Side effects
)

// If EventBus is slow, this naturally slows down chunk processing
yield* Stream.runForEach(incrementalStream, ({ current }) => {
  return eventBus.publish({ type: 'llm_text_chunk', text: current })
})
```

No buffering nightmares, no memory leaks—just smooth streaming.

#### 4. **Composability**

Because everything is Effect-based, you can compose BAML streams with other operations:

```typescript
// Parallel LLM calls
const results = yield* Effect.all([
  callBAML(messagesA),
  callBAML(messagesB),
  callBAML(messagesC)
], { concurrency: 3 })

// Sequential with interruption
const result1 = yield* makeInterruptible(callBAML(messages1), eventBus)
if (result1._tag === 'Completed') {
  const result2 = yield* makeInterruptible(callBAML(messages2), eventBus)
}

// Retry with exponential backoff
yield* callBAML(messages).pipe(
  Effect.retry({
    schedule: Schedule.exponential('100 millis'),
    times: 3
  })
)
```

### Testing the Integration

#### Mock BAML for Tests

```typescript
// src/__tests__/mocks/llm.ts
export function createMockLLMService(config: {
  responses: string[]
  chunkDelayMs?: number
}) {
  return Layer.scoped(
    LLMService,
    Effect.gen(function* () {
      const eventBus = yield* EventBus
      const callCountRef = yield* Ref.make(0)

      const llmStarts = yield* eventBus.subscribe(
        (e): e is { type: 'llm_response_started'; streamId: string } =>
          e.type === 'llm_response_started'
      )

      yield* Stream.runForEach(llmStarts, (event) =>
        Effect.gen(function* () {
          const callIndex = yield* Ref.get(callCountRef)
          yield* Ref.update(callCountRef, n => n + 1)

          const response = config.responses[callIndex]
          const words = response.split(' ')
          const chunks = words.map((word, i) => 
            i === words.length - 1 ? word : word + ' '
          )

          // Simulate streaming
          yield* Stream.runForEach(
            Stream.fromIterable(chunks),
            (chunk) => Effect.gen(function* () {
              if (config.chunkDelayMs) {
                yield* Effect.sleep(config.chunkDelayMs)
              }
              yield* eventBus.publish({
                type: 'llm_text_chunk',
                streamId: event.streamId,
                text: chunk
              })
            })
          )

          yield* eventBus.publish({
            type: 'llm_response_completed',
            streamId: event.streamId,
            usage: { totalTokens: 0 }
          })
        })
      ).pipe(Effect.forkScoped)

      return { start: Effect.void, getUsage: Ref.get(usageRef) }
    })
  )
}

// Use in tests
const testLayer = Layer.merge(
  baseLayer,
  createMockLLMService({
    responses: [
      'First response',
      'Second response with <function_calls>...</function_calls>'
    ],
    chunkDelayMs: 50
  })
)
```

#### Integration Test Example

```typescript
it('should handle LLM streaming with function calls', async () => {
  const program = Effect.gen(function* () {
    const eventBus = yield* EventBus
    const messagesState = yield* MessagesState

    // Send user message
    yield* eventBus.publish({
      type: 'user_message',
      content: 'Calculate 2+2',
      timestamp: Date.now()
    })

    // Wait for streaming to start
    yield* waitForStreamingStart(messagesState.state)

    // Wait for streaming to complete
    const finalState = yield* waitForStreamingStop(messagesState.state)

    // Verify assistant message was created
    const assistantMsg = finalState.messages.find(
      m => m.role === 'assistant' && m.type === 'text'
    )
    expect(assistantMsg).toBeDefined()
  })

  await Effect.runPromise(
    program.pipe(
      Effect.provide(testLayer),
      Effect.scoped
    )
  )
})
```

### Production Considerations

#### 1. **BAML Configuration Management**

```typescript
// Different clients for different environments
client<llm> BedrockSonnet {
  provider aws-bedrock
  options {
    model "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
  }
}

client<llm> OpenAISonnet {
  provider openai
  options {
    model "gpt-4"
  }
}

// Switch via function definition
function Chat(chatHistory: ChatMessage[]) -> string {
  client BedrockSonnet  // Change to OpenAISonnet here
  prompt #"..."#
}
```

#### 2. **Token Tracking**

```typescript
// Track usage across all calls
const totalUsage = yield* Effect.gen(function* () {
  const usage = yield* llmService.getUsage
  console.log(`Total tokens used: ${usage.totalTokens}`)
  
  // Could persist to database for billing
  yield* db.usage.insert({
    userId,
    conversationId,
    tokens: usage.totalTokens,
    timestamp: Date.now()
  })
})
```

#### 3. **Prompt Versioning**

```baml
// Old version
function Chat_v1(chatHistory: ChatMessage[]) -> string {
  client BedrockSonnet
  prompt #"You are a helpful assistant."#
}

// New version with tool support
function Chat_v2(chatHistory: ChatMessage[]) -> string {
  client BedrockSonnet
  prompt #"
    You are a helpful assistant with code execution.
    Use ANTML format for tools...
  "#
}

// Gradual rollout: use v2 for 10% of users
function Chat(chatHistory: ChatMessage[]) -> string {
  client BedrockSonnet
  prompt #"
    {% if user_id % 10 == 0 %}
      {{ Chat_v2(chatHistory) }}
    {% else %}
      {{ Chat_v1(chatHistory) }}
    {% endif %}
  "#
}
```

### Alternative: Direct API Calls vs BAML

**Without BAML** (manual approach):

```typescript
// ❌ Brittle, no type safety
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'anthropic-version': '2023-06-01',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    })),
    stream: true
  })
})

// Manual streaming parsing
for await (const chunk of response.body) {
  const parsed = parseSSE(chunk)  // You write this
  if (parsed.type === 'content_block_delta') {
    yield parsed.delta.text
  }
}
```

**With BAML** (declarative approach):

```typescript
// ✅ Type-safe, declarative, testable
const bamlStream = b.stream.Chat(messages, { collector })
const contentStream = Stream.fromAsyncIterable(bamlStream, e => e as Error)
```

**Benefits of BAML**:
- Provider-agnostic (switch from Claude to GPT with config change)
- Automatic prompt rendering with Jinja2
- Built-in retries, rate limiting, error handling
- Observability via Collector
- Type-safe generated TypeScript client

---

### Summary: Effect-BAML Integration

The Effect-BAML integration exemplifies **separation of concerns** in event-driven architecture:

1. **BAML handles LLM complexity**: Provider APIs, streaming protocols, authentication, retries
2. **Effect handles application complexity**: State management, concurrency, interruption, event flow
3. **Integration layer is thin**: Just format conversions and stream adapters

**Key patterns**:
- `Stream.fromAsyncIterable`: Convert BAML streams to Effect streams
- `Stream.scan`: Compute incremental chunks from cumulative content
- `makeInterruptible`: Wrap BAML streams for cancellation support
- `Collector`: Track usage and debug LLM calls
- Mock layers: Test without calling real LLMs

This architecture makes it **trivial** to:
- Switch LLM providers (change BAML config)
- Add retry logic (Effect.retry)
- Test business logic (mock LLMService layer)
- Track token usage (Collector + Ref)
- Handle interruptions (makeInterruptible)

The result: **A production-ready LLM integration that's testable, observable, and maintainable.**
