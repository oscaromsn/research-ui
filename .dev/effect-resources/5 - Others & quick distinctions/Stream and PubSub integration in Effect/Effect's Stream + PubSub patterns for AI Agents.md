---
modified: 2025-10-26T14:37:36-03:00
---
# Effect's Stream + PubSub patterns for AI Agents
## Architecture Overview

```typescript
// domain/events.ts - Type-safe event system
import { Schema } from "@effect/schema";
import { Data } from "effect";

export class AgentEvent extends Schema.TaggedClass<AgentEvent>()("AgentEvent", {
  agentId: Schema.String,
  sessionId: Schema.String,
  timestamp: Schema.DateTimeUtc,
  sequence: Schema.Number
}) {}

export class ThinkingEvent extends AgentEvent.extend<ThinkingEvent>("ThinkingEvent")({
  thought: Schema.String,
  modelUsed: Schema.String
}) {}

export class TokenStreamEvent extends AgentEvent.extend<TokenStreamEvent>("TokenStreamEvent")({
  token: Schema.String,
  isComplete: Schema.Boolean
}) {}

export class ActionEvent extends AgentEvent.extend<ActionEvent>("ActionEvent")({
  action: Schema.String,
  parameters: Schema.Record(Schema.String, Schema.Unknown)
}) {}

export class ObservationEvent extends AgentEvent.extend<ObservationEvent>("ObservationEvent")({
  observation: Schema.String,
  source: Schema.String
}) {}

export class AgentCompleteEvent extends AgentEvent.extend<AgentCompleteEvent>("AgentCompleteEvent")({
  result: Schema.String,
  tokensUsed: Schema.Number
}) {}

export class AgentErrorEvent extends AgentEvent.extend<AgentErrorEvent>("AgentErrorEvent")({
  error: Schema.String
}) {}

// Union type for all events
export type DomainEvent = 
  | ThinkingEvent 
  | TokenStreamEvent 
  | ActionEvent 
  | ObservationEvent 
  | AgentCompleteEvent
  | AgentErrorEvent;
```

## Event Bus Service with Filtering

```typescript
// services/EventBus.ts
import { Effect, PubSub, Stream, Layer, pipe } from "effect";
import type { DomainEvent } from "../domain/events";

export class EventBus extends Effect.Service<EventBus>()("app/EventBus", {
  scoped: Effect.gen(function* () {
    // Unbounded for real-time streaming (or use bounded with sliding)
    const pubsub = yield* PubSub.unbounded<DomainEvent>();
    
    return {
      // Publish a single event
      publish: (event: DomainEvent) => 
        PubSub.publish(pubsub, event),
      
      // Subscribe to all events
      subscribe: (): Stream.Stream<DomainEvent> => 
        Stream.fromPubSub(pubsub),
      
      // Subscribe to specific agent's events
      subscribeToAgent: (agentId: string): Stream.Stream<DomainEvent> =>
        Stream.fromPubSub(pubsub).pipe(
          Stream.filter((event) => event.agentId === agentId)
        ),
      
      // Subscribe to specific session
      subscribeToSession: (sessionId: string): Stream.Stream<DomainEvent> =>
        Stream.fromPubSub(pubsub).pipe(
          Stream.filter((event) => event.sessionId === sessionId)
        ),
      
      // Type-safe event type filtering
      subscribeToEventType: <T extends DomainEvent["_tag"]>(
        tag: T
      ): Stream.Stream<Extract<DomainEvent, { _tag: T }>> =>
        Stream.fromPubSub(pubsub).pipe(
          Stream.filter((e): e is Extract<DomainEvent, { _tag: T }> => 
            e._tag === tag
          )
        ),
      
      // Complex filtering: agent + event type
      subscribeToAgentEvents: <T extends DomainEvent["_tag"]>(
        agentId: string,
        tag: T
      ): Stream.Stream<Extract<DomainEvent, { _tag: T }>> =>
        Stream.fromPubSub(pubsub).pipe(
          Stream.filter((e): e is Extract<DomainEvent, { _tag: T }> => 
            e.agentId === agentId && e._tag === tag
          )
        )
    };
  })
}) {}
```

## LLM Streaming Service

```typescript
// services/LLMService.ts
import { Effect, Stream, Schema } from "effect";
import { EventBus } from "./EventBus";
import { TokenStreamEvent, ThinkingEvent } from "../domain/events";

export class StreamingError extends Schema.TaggedError<StreamingError>()(
  "StreamingError",
  { reason: Schema.String }
) {}

export class LLMService extends Effect.Service<LLMService>()("app/LLMService", {
  dependencies: [EventBus.Default],
  
  effect: Effect.gen(function* () {
    const eventBus = yield* EventBus;
    
    return {
      // Stream LLM completion with side-effect publishing
      streamCompletion: (params: {
        agentId: string;
        sessionId: string;
        prompt: string;
        sequence: number;
      }): Stream.Stream<string, StreamingError> => {
        
        // First emit thinking event
        const thinkingEvent = Effect.sync(() => 
          new ThinkingEvent({
            agentId: params.agentId,
            sessionId: params.sessionId,
            timestamp: new Date().toISOString(),
            sequence: params.sequence,
            thought: `Processing: ${params.prompt.slice(0, 50)}...`,
            modelUsed: "gpt-4"
          })
        ).pipe(
          Effect.flatMap(eventBus.publish),
          Effect.asVoid
        );
        
        // Create token stream (integrate with your LLM provider)
        const tokenStream = Stream.async<string, StreamingError>((emit) => {
          // Example: OpenAI streaming integration
          const abortController = new AbortController();
          
          fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            signal: abortController.signal,
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [{ role: "user", content: params.prompt }],
              stream: true
            })
          })
            .then(async (response) => {
              const reader = response.body?.getReader();
              if (!reader) {
                emit.fail(new StreamingError({ reason: "No response body" }));
                return;
              }
              
              const decoder = new TextDecoder();
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  emit.end();
                  break;
                }
                
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter(line => line.trim());
                
                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const data = line.slice(6);
                    if (data === "[DONE]") continue;
                    
                    try {
                      const parsed = JSON.parse(data);
                      const token = parsed.choices[0]?.delta?.content;
                      if (token) {
                        emit.single(token);
                      }
                    } catch (e) {
                      // Skip parsing errors for SSE format
                    }
                  }
                }
              }
            })
            .catch((error) => {
              emit.fail(new StreamingError({ 
                reason: error.message 
              }));
            });
          
          return Effect.sync(() => abortController.abort());
        });
        
        // Tap to publish token events while streaming
        return Stream.fromEffect(thinkingEvent).pipe(
          Stream.flatMap(() => tokenStream),
          Stream.tap((token) =>
            Effect.sync(() => new TokenStreamEvent({
              agentId: params.agentId,
              sessionId: params.sessionId,
              timestamp: new Date().toISOString(),
              sequence: params.sequence,
              token,
              isComplete: false
            })).pipe(
              Effect.flatMap(eventBus.publish)
            )
          ),
          Stream.ensuring(
            Effect.sync(() => new TokenStreamEvent({
              agentId: params.agentId,
              sessionId: params.sessionId,
              timestamp: new Date().toISOString(),
              sequence: params.sequence,
              token: "",
              isComplete: true
            })).pipe(
              Effect.flatMap(eventBus.publish),
              Effect.asVoid
            )
          )
        );
      }
    };
  })
}) {}
```

## Agent Orchestration

```typescript
// services/AgentOrchestrator.ts
import { Effect, Stream, Ref, pipe } from "effect";
import { LLMService } from "./LLMService";
import { EventBus } from "./EventBus";
import { ActionEvent, ObservationEvent, AgentCompleteEvent } from "../domain/events";

export class AgentOrchestrator extends Effect.Service<AgentOrchestrator>()(
  "app/AgentOrchestrator",
  {
    dependencies: [LLMService.Default, EventBus.Default],
    
    effect: Effect.gen(function* () {
      const llm = yield* LLMService;
      const eventBus = yield* EventBus;
      
      return {
        // Run a single agent with full reasoning trace
        runAgent: (params: {
          agentId: string;
          sessionId: string;
          task: string;
          maxIterations?: number;
        }) => Effect.gen(function* () {
          const maxIter = params.maxIterations ?? 10;
          const sequenceRef = yield* Ref.make(0);
          
          let currentThought = params.task;
          
          for (let i = 0; i < maxIter; i++) {
            const sequence = yield* Ref.getAndUpdate(sequenceRef, n => n + 1);
            
            // Stream LLM reasoning and collect response
            const response = yield* llm.streamCompletion({
              agentId: params.agentId,
              sessionId: params.sessionId,
              prompt: currentThought,
              sequence
            }).pipe(
              Stream.runFold("", (acc, token) => acc + token)
            );
            
            // Parse action from response (simplified)
            const action = parseAction(response);
            
            if (action.type === "final_answer") {
              yield* eventBus.publish(new AgentCompleteEvent({
                agentId: params.agentId,
                sessionId: params.sessionId,
                timestamp: new Date().toISOString(),
                sequence,
                result: action.content,
                tokensUsed: 1000 // Track actual usage
              }));
              
              return action.content;
            }
            
            // Publish action event
            yield* eventBus.publish(new ActionEvent({
              agentId: params.agentId,
              sessionId: params.sessionId,
              timestamp: new Date().toISOString(),
              sequence,
              action: action.type,
              parameters: action.params
            }));
            
            // Execute action and get observation
            const observation = yield* executeAction(action);
            
            yield* eventBus.publish(new ObservationEvent({
              agentId: params.agentId,
              sessionId: params.sessionId,
              timestamp: new Date().toISOString(),
              sequence,
              observation,
              source: action.type
            }));
            
            currentThought = `Previous action: ${action.type}\nObservation: ${observation}\nNext step:`;
          }
          
          return "Max iterations reached";
        }),
        
        // Run multiple agents concurrently
        runMultiAgent: (params: {
          sessionId: string;
          agents: Array<{ agentId: string; task: string }>;
        }) => Effect.all(
          params.agents.map(agent =>
            Effect.annotateCurrentSpan("agentId", agent.agentId).pipe(
              Effect.flatMap(() => Effect.gen(function* () {
                return yield* Effect.Service(AgentOrchestrator).pipe(
                  Effect.flatMap(svc => svc.runAgent({
                    agentId: agent.agentId,
                    sessionId: params.sessionId,
                    task: agent.task
                  }))
                );
              }))
            )
          ),
          { concurrency: "unbounded" } // All agents run in parallel
        )
      };
    })
  }
) {}

// Helper functions (implement based on your needs)
function parseAction(response: string): { type: string; content: string; params: Record<string, unknown> } {
  // Parse LLM response for action
  return { type: "search", content: response, params: {} };
}

function executeAction(action: { type: string; params: Record<string, unknown> }): Effect.Effect<string> {
  // Execute the action and return observation
  return Effect.succeed("Action executed successfully");
}
```

## Frontend Integration: WebSocket/SSE

```typescript
// adapters/WebSocketAdapter.ts
import { Effect, Stream, Layer, Scope } from "effect";
import { EventBus } from "../services/EventBus";
import type { DomainEvent } from "../domain/events";

export class WebSocketAdapter extends Effect.Service<WebSocketAdapter>()(
  "app/WebSocketAdapter",
  {
    dependencies: [EventBus.Default],
    
    scoped: Effect.gen(function* () {
      const eventBus = yield* EventBus;
      const scope = yield* Effect.scope;
      
      return {
        // Subscribe a client to specific agent/session
        subscribeClient: (params: {
          clientId: string;
          sessionId: string;
          agentId?: string;
          send: (data: string) => Effect.Effect<void>;
        }) => Effect.gen(function* () {
          
          // Create filtered stream based on parameters
          const eventStream = params.agentId
            ? eventBus.subscribeToAgent(params.agentId)
            : eventBus.subscribeToSession(params.sessionId);
          
          // Run the stream, serializing and sending each event
          yield* eventStream.pipe(
            Stream.filter(e => e.sessionId === params.sessionId),
            Stream.mapEffect(event =>
              Effect.try({
                try: () => JSON.stringify({
                  ...event,
                  clientId: params.clientId
                }),
                catch: () => new Error("Serialization failed")
              })
            ),
            Stream.mapEffect(params.send),
            Stream.runDrain
          ).pipe(
            Effect.forkIn(scope) // Fork in the service's scope for cleanup
          );
        })
      };
    })
  }
) {}

// Example Node.js WebSocket server integration
import { WebSocketServer } from "ws";

export const createWebSocketServer = (port: number) =>
  Effect.gen(function* () {
    const adapter = yield* WebSocketAdapter;
    
    const wss = new WebSocketServer({ port });
    
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        wss.on("connection", (ws, req) => {
          const url = new URL(req.url!, `http://${req.headers.host}`);
          const sessionId = url.searchParams.get("sessionId");
          const agentId = url.searchParams.get("agentId") ?? undefined;
          const clientId = Math.random().toString(36);
          
          if (!sessionId) {
            ws.close(1008, "sessionId required");
            return;
          }
          
          // Subscribe this client
          const subscription = adapter.subscribeClient({
            clientId,
            sessionId,
            agentId,
            send: (data) => Effect.sync(() => {
              if (ws.readyState === 1) { // OPEN
                ws.send(data);
              }
            })
          }).pipe(
            Effect.catchAll(err => 
              Effect.sync(() => console.error("Client error:", err))
            )
          );
          
          Effect.runFork(subscription);
          
          ws.on("close", () => {
            console.log(`Client ${clientId} disconnected`);
          });
        });
        
        return wss;
      }),
      (server) => Effect.sync(() => server.close())
    );
  }).pipe(
    Effect.provide(WebSocketAdapter.Default)
  );
```

## React Frontend Hook

```typescript
// frontend/useAgentStream.ts
import { useEffect, useState } from "react";

export interface ReasoningTrace {
  type: "thinking" | "token" | "action" | "observation" | "complete" | "error";
  content: string;
  timestamp: string;
  sequence: number;
  agentId: string;
}

export function useAgentStream(sessionId: string, agentId?: string) {
  const [traces, setTraces] = useState<ReasoningTrace[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTokens, setCurrentTokens] = useState<Record<number, string>>({});
  
  useEffect(() => {
    const params = new URLSearchParams({ sessionId });
    if (agentId) params.set("agentId", agentId);
    
    const ws = new WebSocket(`ws://localhost:3000?${params}`);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data._tag) {
        case "ThinkingEvent":
          setTraces(prev => [...prev, {
            type: "thinking",
            content: data.thought,
            timestamp: data.timestamp,
            sequence: data.sequence,
            agentId: data.agentId
          }]);
          break;
          
        case "TokenStreamEvent":
          if (!data.isComplete) {
            setCurrentTokens(prev => ({
              ...prev,
              [data.sequence]: (prev[data.sequence] || "") + data.token
            }));
          } else {
            const fullText = currentTokens[data.sequence] || "";
            setTraces(prev => [...prev, {
              type: "token",
              content: fullText,
              timestamp: data.timestamp,
              sequence: data.sequence,
              agentId: data.agentId
            }]);
            setCurrentTokens(prev => {
              const next = { ...prev };
              delete next[data.sequence];
              return next;
            });
          }
          break;
          
        case "ActionEvent":
          setTraces(prev => [...prev, {
            type: "action",
            content: `${data.action}: ${JSON.stringify(data.parameters)}`,
            timestamp: data.timestamp,
            sequence: data.sequence,
            agentId: data.agentId
          }]);
          break;
          
        case "ObservationEvent":
          setTraces(prev => [...prev, {
            type: "observation",
            content: data.observation,
            timestamp: data.timestamp,
            sequence: data.sequence,
            agentId: data.agentId
          }]);
          break;
          
        case "AgentCompleteEvent":
          setTraces(prev => [...prev, {
            type: "complete",
            content: data.result,
            timestamp: data.timestamp,
            sequence: data.sequence,
            agentId: data.agentId
          }]);
          break;
      }
    };
    
    return () => ws.close();
  }, [sessionId, agentId]);
  
  return { traces, isConnected, currentTokens };
}
```

## Testing with Mock Streams

```typescript
// __tests__/AgentOrchestrator.test.ts
import { Effect, Stream, TestContext, Layer } from "effect";
import { describe, it } from "@effect/vitest";
import { LLMService } from "../services/LLMService";
import { AgentOrchestrator } from "../services/AgentOrchestrator";

// Mock LLM service for deterministic testing
const MockLLMService = Layer.succeed(
  LLMService,
  LLMService.of({
    streamCompletion: (params) =>
      Stream.fromIterable([
        "I", " need", " to", " search", " for", " information"
      ]).pipe(
        Stream.schedule(TestContext.TestClock.pipe(
          Effect.map(clock => clock.sleep("100 millis"))
        ))
      )
  })
);

describe("AgentOrchestrator", () => {
  it.effect("should stream reasoning traces", () =>
    Effect.gen(function* () {
      const orchestrator = yield* AgentOrchestrator;
      const eventBus = yield* EventBus;
      
      // Collect all events
      const events: DomainEvent[] = [];
      const subscription = yield* eventBus.subscribe().pipe(
        Stream.runForEach(event => Effect.sync(() => events.push(event))),
        Effect.fork
      );
      
      // Run agent
      yield* orchestrator.runAgent({
        agentId: "test-agent",
        sessionId: "test-session",
        task: "Test task",
        maxIterations: 1
      });
      
      // Verify events were published
      yield* TestContext.TestContext;
      yield* Effect.yieldNow(); // Let events propagate
      
      assert(events.length > 0, "Should have published events");
      assert(events.some(e => e._tag === "ThinkingEvent"));
      assert(events.some(e => e._tag === "TokenStreamEvent"));
    }).pipe(
      Effect.provide(MockLLMService),
      Effect.provide(EventBus.Default),
      Effect.provide(AgentOrchestrator.Default),
      Effect.provide(TestContext.TestContext)
    )
  );
});
```

## Key Benefits of This Architecture

1. **Type Safety**: All events are strongly typed through Effect Schema
2. **Multiple Frontends**: Each frontend gets its own subscription via PubSub
3. **Filtering**: Subscribe to specific agents, sessions, or event types
4. **Backpressure**: Bounded PubSub prevents memory overflow
5. **Resource Safety**: Automatic cleanup via `Scope`
6. **Testability**: Mock streams for deterministic testing
7. **Observability**: Built-in tracing with `Effect.annotateCurrentSpan`
8. **Interruption Safe**: Agents can be cancelled cleanly

This architecture scales from single-agent to multi-agent systems and supports any frontend (WebSocket, SSE, GraphQL subscriptions, etc.) through the adapter pattern!
