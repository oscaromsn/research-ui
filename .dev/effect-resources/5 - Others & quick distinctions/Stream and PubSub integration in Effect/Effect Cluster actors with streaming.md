---
modified: 2025-10-27T00:13:39-03:00
---
# Effect Cluster actors with streaming

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Effect Cluster (Distributed)              │
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  Supervisor  │◄───────►│  Agent-001   │                  │
│  │   (Entity)   │         │   (Entity)   │                  │
│  │              │◄───┐    │  [streaming] │                  │
│  └──────┬───────┘    │    └──────────────┘                  │
│         │            │                                        │
│         │            │    ┌──────────────┐                  │
│         │            └───►│  Agent-002   │                  │
│         │                 │   (Entity)   │                  │
│         │                 │  [streaming] │                  │
│         │                 └──────────────┘                  │
│         │ (persistent                                        │
│         │  messages)     ┌──────────────┐                  │
│         │                │  Agent-003   │                  │
│         └───────────────►│   (Entity)   │                  │
│                          │  [streaming] │                  │
│                          └──────────────┘                  │
│                                 │                            │
└─────────────────────────────────┼────────────────────────────┘
                                  │ (messages)
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Edge Node (Local)                         │
│                                                               │
│  ┌──────────────────────────────────────────┐               │
│  │  Gateway Service                          │               │
│  │  • Receives cluster messages              │               │
│  │  • Updates SubscriptionRef (local)        │               │
│  │  • Broadcasts to WebSockets               │               │
│  └──────────────┬───────────────────────────┘               │
│                 │                                             │
└─────────────────┼─────────────────────────────────────────────┘
                  │ (WebSocket)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       Frontend                               │
│  • Subscribes to reasoning streams                           │
│  • Sends user interrupts/messages                            │
│  • Displays multi-agent progress                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Domain Events & Messages

```typescript
// domain/events.ts
import { Schema } from "@effect/schema";

// Events flowing through the cluster
export class TokenChunk extends Schema.Class<TokenChunk>()("TokenChunk", {
  sessionId: Schema.String,
  agentId: Schema.String,
  token: Schema.String,
  sequence: Schema.Number,
  timestamp: Schema.DateTimeUtc
}) {}

export class ThoughtComplete extends Schema.Class<ThoughtComplete>()("ThoughtComplete", {
  sessionId: Schema.String,
  agentId: Schema.String,
  thought: Schema.String,
  sequence: Schema.Number
}) {}

export class AgentTaskStarted extends Schema.Class<AgentTaskStarted>()("AgentTaskStarted", {
  sessionId: Schema.String,
  agentId: Schema.String,
  task: Schema.String
}) {}

export class AgentTaskCompleted extends Schema.Class<AgentTaskCompleted>()("AgentTaskCompleted", {
  sessionId: Schema.String,
  agentId: Schema.String,
  result: Schema.String
}) {}

export class SupervisorDecision extends Schema.Class<SupervisorDecision>()("SupervisorDecision", {
  sessionId: Schema.String,
  decision: Schema.String,
  spawnedAgents: Schema.Array(Schema.String),
  dispatchedTasks: Schema.Array(Schema.Struct({
    agentId: Schema.String,
    task: Schema.String
  }))
}) {}

export type ClusterEvent = 
  | TokenChunk 
  | ThoughtComplete 
  | AgentTaskStarted 
  | AgentTaskCompleted
  | SupervisorDecision;
```

### 2. Agent Entity (The Workers)

```typescript
// cluster/entities/ResearchAgent.ts
import { Entity, Sharding, RecipientType, Rpc } from "@effect/cluster";
import { Effect, Ref, Stream, Schema } from "effect";
import { TokenChunk, ThoughtComplete, AgentTaskStarted, AgentTaskCompleted } from "../../domain/events";

// Agent state (actor-local with Ref)
type AgentState = {
  sessionId: string;
  agentId: string;
  currentTask: Option.Option<string>;
  conversationHistory: string[];
  status: "idle" | "thinking" | "complete";
  tokenCount: number;
};

// Message protocol
type AgentMessage =
  | { _tag: "ExecuteTask"; task: string; replyTo: Deferred.Deferred<string, AgentError> }
  | { _tag: "GetStatus"; replyTo: Deferred.Deferred<AgentState, never> }
  | { _tag: "Interrupt"; reason: string }
  | { _tag: "UpdateContext"; context: string };

export const ResearchAgentEntity = Entity.make(
  "ResearchAgent",
  Schema.String, // agentId
  RecipientType.EntityType,
  
  (agentId: string, msg: AgentMessage) => Effect.gen(function* () {
    // Actor-local state
    const stateRef = yield* Entity.state<AgentState>();
    const sharding = yield* Sharding.Sharding;
    const llm = yield* LLMService;
    
    // Gateway messenger for streaming events
    const gatewayMessenger = yield* sharding.messenger("Gateway");
    
    switch (msg._tag) {
      case "ExecuteTask": {
        const state = yield* Ref.get(stateRef);
        
        // Update state
        yield* Ref.update(stateRef, s => ({
          ...s,
          currentTask: Option.some(msg.task),
          status: "thinking"
        }));
        
        // Notify supervisor task started
        yield* gatewayMessenger.send("gateway-1", new AgentTaskStarted({
          sessionId: state.sessionId,
          agentId,
          task: msg.task
        }));
        
        // Stream LLM response token-by-token
        let sequence = 0;
        let fullResponse = "";
        
        yield* llm.streamCompletion({
          prompt: buildPrompt(state, msg.task),
          temperature: 0.7
        }).pipe(
          // Each token is sent as a cluster message
          Stream.tap(token => Effect.gen(function* () {
            fullResponse += token;
            
            // Send token to gateway for frontend streaming
            yield* gatewayMessenger.send("gateway-1", new TokenChunk({
              sessionId: state.sessionId,
              agentId,
              token,
              sequence: sequence++,
              timestamp: new Date().toISOString()
            }));
            
            // Update local state
            yield* Ref.update(stateRef, s => ({
              ...s,
              tokenCount: s.tokenCount + 1
            }));
          })),
          Stream.runDrain
        );
        
        // Thought complete
        yield* gatewayMessenger.send("gateway-1", new ThoughtComplete({
          sessionId: state.sessionId,
          agentId,
          thought: fullResponse,
          sequence
        }));
        
        // Update final state
        yield* Ref.update(stateRef, s => ({
          ...s,
          conversationHistory: [...s.conversationHistory, msg.task, fullResponse],
          currentTask: Option.none(),
          status: "complete"
        }));
        
        // Notify supervisor
        yield* gatewayMessenger.send("gateway-1", new AgentTaskCompleted({
          sessionId: state.sessionId,
          agentId,
          result: fullResponse
        }));
        
        // Resolve deferred
        yield* Deferred.succeed(msg.replyTo, fullResponse);
        return;
      }
      
      case "GetStatus": {
        const state = yield* Ref.get(stateRef);
        yield* Deferred.succeed(msg.replyTo, state);
        return;
      }
      
      case "Interrupt": {
        yield* Ref.update(stateRef, s => ({
          ...s,
          currentTask: Option.none(),
          status: "idle"
        }));
        yield* Effect.log(`Agent ${agentId} interrupted: ${msg.reason}`);
        return;
      }
      
      case "UpdateContext": {
        yield* Ref.update(stateRef, s => ({
          ...s,
          conversationHistory: [...s.conversationHistory, `[Context] ${msg.context}`]
        }));
        return;
      }
    }
  })
).annotate(ClusterSchema.persisted); // ✅ Messages survive restarts
```

### 3. Supervisor Entity (The Orchestrator)

```typescript
// cluster/entities/ResearchSupervisor.ts
import { Entity, Sharding, RecipientType } from "@effect/cluster";
import { Effect, Ref, Option, Schema } from "effect";

type SupervisorState = {
  sessionId: string;
  query: string;
  activeAgents: Map<AgentId, AgentInfo>;
  completedTasks: string[];
  pendingTasks: string[];
  status: "planning" | "executing" | "synthesizing" | "complete";
};

type AgentInfo = {
  agentId: string;
  role: string; // "searcher" | "analyzer" | "synthesizer"
  currentTask: Option.Option<string>;
  completedTasks: string[];
};

type SupervisorMessage =
  | { _tag: "StartResearch"; query: string; replyTo: Deferred.Deferred<string, ResearchError> }
  | { _tag: "AgentCompleted"; agentId: string; result: string }
  | { _tag: "UserMessage"; message: string }
  | { _tag: "GetProgress"; replyTo: Deferred.Deferred<SupervisorState, never> };

export const ResearchSupervisorEntity = Entity.make(
  "ResearchSupervisor",
  Schema.String, // sessionId
  RecipientType.EntityType,
  
  (sessionId: string, msg: SupervisorMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<SupervisorState>();
    const sharding = yield* Sharding.Sharding;
    const llm = yield* LLMService;
    const gatewayMessenger = yield* sharding.messenger("Gateway");
    const agentMessenger = yield* sharding.messenger("ResearchAgent");
    
    switch (msg._tag) {
      case "StartResearch": {
        yield* Ref.update(stateRef, s => ({
          ...s,
          query: msg.query,
          status: "planning"
        }));
        
        // Use LLM to create research plan
        const plan = yield* llm.generateText({
          prompt: `Create a research plan for: ${msg.query}. 
                   Output: List of 3-5 specific research tasks as JSON array.`
        }).pipe(
          Effect.map(response => JSON.parse(response.text) as string[])
        );
        
        // Spawn agents for tasks
        const agentIds: string[] = [];
        
        for (const [index, task] of plan.entries()) {
          const agentId = `${sessionId}-agent-${index}`;
          agentIds.push(agentId);
          
          // Initialize agent with context
          yield* agentMessenger.send(agentId, {
            _tag: "ExecuteTask",
            task,
            replyTo: yield* Deferred.make<string, AgentError>()
          });
          
          // Track agent
          yield* Ref.update(stateRef, s => ({
            ...s,
            activeAgents: s.activeAgents.set(agentId, {
              agentId,
              role: "searcher",
              currentTask: Option.some(task),
              completedTasks: []
            }),
            pendingTasks: [...s.pendingTasks, task]
          }));
        }
        
        // Notify gateway
        yield* gatewayMessenger.send("gateway-1", new SupervisorDecision({
          sessionId,
          decision: `Spawned ${agentIds.length} agents for research`,
          spawnedAgents: agentIds,
          dispatchedTasks: plan.map((task, i) => ({
            agentId: agentIds[i],
            task
          }))
        }));
        
        yield* Ref.update(stateRef, s => ({ ...s, status: "executing" }));
        return;
      }
      
      case "AgentCompleted": {
        const state = yield* Ref.get(stateRef);
        
        // Update agent info
        yield* Ref.update(stateRef, s => {
          const agent = s.activeAgents.get(msg.agentId);
          if (!agent) return s;
          
          return {
            ...s,
            activeAgents: s.activeAgents.set(msg.agentId, {
              ...agent,
              currentTask: Option.none(),
              completedTasks: [...agent.completedTasks, msg.result]
            }),
            completedTasks: [...s.completedTasks, msg.result]
          };
        });
        
        // Check if all agents complete
        const updatedState = yield* Ref.get(stateRef);
        const allComplete = Array.from(updatedState.activeAgents.values())
          .every(agent => Option.isNone(agent.currentTask));
        
        if (allComplete) {
          // Use LLM to decide: synthesize or spawn more agents?
          const decision = yield* llm.generateText({
            prompt: `Research progress:
                     Query: ${updatedState.query}
                     Completed: ${updatedState.completedTasks.length} tasks
                     Results: ${updatedState.completedTasks.join("\n")}
                     
                     Decision: Should we (A) synthesize final report, or 
                              (B) spawn new agents for deeper research?
                     Output JSON: { "action": "synthesize" | "continue", "newTasks"?: [...] }`
          }).pipe(
            Effect.map(response => JSON.parse(response.text))
          );
          
          if (decision.action === "continue") {
            // Spawn new agents
            const newAgentIds: string[] = [];
            
            for (const [index, task] of decision.newTasks.entries()) {
              const agentId = `${sessionId}-agent-${Date.now()}-${index}`;
              newAgentIds.push(agentId);
              
              yield* agentMessenger.send(agentId, {
                _tag: "ExecuteTask",
                task,
                replyTo: yield* Deferred.make<string, AgentError>()
              });
            }
            
            yield* gatewayMessenger.send("gateway-1", new SupervisorDecision({
              sessionId,
              decision: "Spawning additional agents for deeper research",
              spawnedAgents: newAgentIds,
              dispatchedTasks: decision.newTasks.map((task, i) => ({
                agentId: newAgentIds[i],
                task
              }))
            }));
          } else {
            // Synthesize final report
            yield* Ref.update(stateRef, s => ({ ...s, status: "synthesizing" }));
            
            const finalReport = yield* llm.generateText({
              prompt: `Synthesize final research report:
                       Query: ${updatedState.query}
                       Findings: ${updatedState.completedTasks.join("\n\n")}`
            });
            
            yield* Ref.update(stateRef, s => ({ ...s, status: "complete" }));
            
            yield* gatewayMessenger.send("gateway-1", new SupervisorDecision({
              sessionId,
              decision: "Research complete - synthesized final report",
              spawnedAgents: [],
              dispatchedTasks: []
            }));
          }
        }
        
        return;
      }
      
      case "UserMessage": {
        // User can interrupt and redirect research
        const state = yield* Ref.get(stateRef);
        
        // Use LLM to interpret user message
        const interpretation = yield* llm.generateText({
          prompt: `User message: "${msg.message}"
                   Current research: ${state.query}
                   Active agents: ${state.activeAgents.size}
                   
                   What should we do?
                   Options: (A) spawn new agent, (B) update existing agents, (C) change direction
                   Output JSON: { "action": string, "details": {...} }`
        }).pipe(
          Effect.map(response => JSON.parse(response.text))
        );
        
        // Execute decision
        if (interpretation.action === "spawn") {
          const agentId = `${sessionId}-agent-user-${Date.now()}`;
          
          yield* agentMessenger.send(agentId, {
            _tag: "ExecuteTask",
            task: interpretation.details.task,
            replyTo: yield* Deferred.make<string, AgentError>()
          });
          
          yield* gatewayMessenger.send("gateway-1", new SupervisorDecision({
            sessionId,
            decision: `User requested: Spawning agent for "${interpretation.details.task}"`,
            spawnedAgents: [agentId],
            dispatchedTasks: [{ agentId, task: interpretation.details.task }]
          }));
        } else if (interpretation.action === "update") {
          // Send context updates to existing agents
          for (const agentId of state.activeAgents.keys()) {
            yield* agentMessenger.send(agentId, {
              _tag: "UpdateContext",
              context: msg.message
            });
          }
        }
        
        return;
      }
      
      case "GetProgress": {
        const state = yield* Ref.get(stateRef);
        yield* Deferred.succeed(msg.replyTo, state);
        return;
      }
    }
  })
).annotate(ClusterSchema.persisted);
```

### 4. Gateway Service (Edge Node Bridge)

```typescript
// services/Gateway.ts
import { Effect, SubscriptionRef, Stream, Layer, Ref } from "effect";
import { Sharding, Entity, RecipientType } from "@effect/cluster";
import type { ClusterEvent } from "../domain/events";

// Gateway aggregates cluster events into local SubscriptionRef
export class GatewayService extends Effect.Service<GatewayService>()(
  "app/GatewayService",
  {
    dependencies: [Sharding.Sharding],
    
    scoped: Effect.gen(function* () {
      const sharding = yield* Sharding.Sharding;
      
      // ✅ Local SubscriptionRef for broadcasting to WebSockets
      const eventsRef = yield* SubscriptionRef.make<Map<SessionId, ClusterEvent[]>>(
        new Map()
      );
      
      // Define Gateway entity that receives cluster events
      const GatewayEntity = Entity.make(
        "Gateway",
        Schema.String,
        RecipientType.EntityType,
        
        (gatewayId: string, event: ClusterEvent) => Effect.gen(function* () {
          // Accumulate events in SubscriptionRef
          yield* SubscriptionRef.update(eventsRef, map => {
            const sessionId = event.sessionId;
            const existing = map.get(sessionId) ?? [];
            return map.set(sessionId, [...existing, event]);
          });
          
          yield* Effect.log(`Gateway received event: ${event._tag}`);
        })
      );
      
      // Register entity
      yield* sharding.register(GatewayEntity);
      
      return {
        // Subscribe to events for a specific session
        subscribeToSession: (sessionId: SessionId): Stream.Stream<ClusterEvent> =>
          eventsRef.changes.pipe(
            Stream.map(map => map.get(sessionId) ?? []),
            Stream.changes, // Only emit when this session's events change
            Stream.flatMap(events => Stream.fromIterable(events))
          ),
        
        // Send message to supervisor
        sendToSupervisor: (sessionId: SessionId, message: string) =>
          Effect.gen(function* () {
            const messenger = yield* sharding.messenger("ResearchSupervisor");
            yield* messenger.send(sessionId, {
              _tag: "UserMessage",
              message
            });
          })
      };
    })
  }
) {}
```

### 5. WebSocket Handler

```typescript
// http/websocket.ts
import { Effect, Stream } from "effect";
import { HttpServer, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { GatewayService } from "../services/Gateway";

export const createWebSocketHandler = Effect.gen(function* () {
  const gateway = yield* GatewayService;
  
  return HttpServer.router.get(
    "/research/:sessionId",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const sessionId = request.params.sessionId;
      
      // Upgrade to WebSocket
      const ws = yield* HttpServerResponse.upgradeWebSocket;
      
      // Stream events from gateway to client
      const outgoing = gateway.subscribeToSession(sessionId).pipe(
        Stream.map(event => JSON.stringify(event)),
        Stream.encodeText
      );
      
      // Handle incoming messages from client
      const incoming = ws.messages.pipe(
        Stream.tap(message =>
          Effect.gen(function* () {
            const data = JSON.parse(message);
            
            if (data.type === "user_message") {
              yield* gateway.sendToSupervisor(sessionId, data.message);
            }
          })
        ),
        Stream.runDrain
      );
      
      // Run bidirectional streams
      yield* Effect.all(
        [
          Stream.run(outgoing, ws.sink),
          incoming
        ],
        { concurrency: "unbounded" }
      );
    })
  );
});
```

### 6. Frontend Integration

```typescript
// frontend/useResearchStream.ts
import { useEffect, useState } from "react";

export interface ReasoningTrace {
  type: "token" | "thought" | "task_started" | "task_completed" | "supervisor_decision";
  agentId: string;
  content: string;
  timestamp: string;
}

export function useResearchStream(sessionId: string) {
  const [traces, setTraces] = useState<ReasoningTrace[]>([]);
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:3000/research/${sessionId}`);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data._tag) {
        case "TokenChunk":
          setTraces(prev => [...prev, {
            type: "token",
            agentId: data.agentId,
            content: data.token,
            timestamp: data.timestamp
          }]);
          break;
          
        case "ThoughtComplete":
          setTraces(prev => [...prev, {
            type: "thought",
            agentId: data.agentId,
            content: data.thought,
            timestamp: data.timestamp
          }]);
          break;
          
        case "AgentTaskStarted":
          setActiveAgents(prev => new Set(prev).add(data.agentId));
          setTraces(prev => [...prev, {
            type: "task_started",
            agentId: data.agentId,
            content: `Started: ${data.task}`,
            timestamp: data.timestamp
          }]);
          break;
          
        case "AgentTaskCompleted":
          setActiveAgents(prev => {
            const next = new Set(prev);
            next.delete(data.agentId);
            return next;
          });
          setTraces(prev => [...prev, {
            type: "task_completed",
            agentId: data.agentId,
            content: `Completed: ${data.result}`,
            timestamp: data.timestamp
          }]);
          break;
          
        case "SupervisorDecision":
          setTraces(prev => [...prev, {
            type: "supervisor_decision",
            agentId: "supervisor",
            content: data.decision,
            timestamp: data.timestamp
          }]);
          break;
      }
    };
    
    setWs(socket);
    
    return () => socket.close();
  }, [sessionId]);
  
  const sendUserMessage = (message: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "user_message",
        message
      }));
    }
  };
  
  return { traces, activeAgents, sendUserMessage };
}
```

### 7. React Component

```typescript
// frontend/ResearchDashboard.tsx
import React, { useState } from "react";
import { useResearchStream } from "./useResearchStream";

export function ResearchDashboard({ sessionId }: { sessionId: string }) {
  const { traces, activeAgents, sendUserMessage } = useResearchStream(sessionId);
  const [userInput, setUserInput] = useState("");
  
  // Group traces by agent
  const tracesByAgent = traces.reduce((acc, trace) => {
    if (!acc[trace.agentId]) acc[trace.agentId] = [];
    acc[trace.agentId].push(trace);
    return acc;
  }, {} as Record<string, typeof traces>);
  
  return (
    <div className="research-dashboard">
      {/* Active Agents Panel */}
      <div className="agents-panel">
        <h2>Active Agents: {activeAgents.size}</h2>
        {Array.from(activeAgents).map(agentId => (
          <div key={agentId} className="agent-card">
            <span className="agent-id">{agentId}</span>
            <span className="status-indicator">●</span>
          </div>
        ))}
      </div>
      
      {/* Reasoning Traces */}
      <div className="traces-panel">
        {Object.entries(tracesByAgent).map(([agentId, agentTraces]) => (
          <div key={agentId} className="agent-stream">
            <h3>{agentId}</h3>
            {agentTraces.map((trace, idx) => (
              <div key={idx} className={`trace trace-${trace.type}`}>
                {trace.type === "token" ? (
                  <span className="token">{trace.content}</span>
                ) : (
                  <div className="event">
                    <strong>{trace.type}:</strong> {trace.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* User Input */}
      <div className="user-input">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Send message to redirect research..."
        />
        <button onClick={() => {
          sendUserMessage(userInput);
          setUserInput("");
        }}>
          Send
        </button>
      </div>
    </div>
  );
}
```

## Key Architecture Decisions

### ✅ What Works

1. **Agent Actors**: Each agent is an Effect Cluster entity
   - Isolated state with `Ref`
   - Survives node failures (persistent messages)
   - Scales horizontally

2. **Streaming via Messages**: Tokens sent as cluster messages
   - No in-memory shared state
   - Works across nodes
   - Persisted for reliability

3. **Gateway Bridge**: Converts cluster messages → SubscriptionRef
   - SubscriptionRef only at edge (single node)
   - WebSockets connected to edge
   - Clean separation of concerns

4. **Supervisor Orchestration**: Dynamic agent management
   - Spawns agents on demand
   - Routes tasks intelligently
   - Responds to user input in real-time

### 🎯 Benefits

- **Fault Tolerance**: Agent crashes don't lose state
- **Horizontal Scaling**: Add cluster nodes for more agents
- **Real-Time**: Token-by-token streaming to frontend
- **Interactive**: User can interrupt/redirect mid-flight
- **Observable**: Every decision/action is an event

### 🚀 Production Enhancements

```typescript
// Add rate limiting
const rateLimited = gateway.subscribeToSession(sessionId).pipe(
  Stream.throttle("100 millis")
);

// Add backpressure handling
const buffered = gateway.subscribeToSession(sessionId).pipe(
  Stream.buffer({ capacity: 100, strategy: "sliding" })
);

// Add observability
const traced = agentMessenger.send(agentId, msg).pipe(
  Effect.withSpan("agent.execute_task", {
    attributes: { agentId, task: msg.task }
  })
);
```

This architecture gives you **distributed multi-agent streaming with full Effect guarantees**! 🎯
