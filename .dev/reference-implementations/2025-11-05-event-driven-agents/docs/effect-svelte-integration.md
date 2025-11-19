## Effect-TS and Svelte Integration

### Overview: The Bridge Between Backend and Frontend

This architecture uses **WebSockets** to bridge Effect-TS (backend) with Svelte 5 (frontend). The integration is **unidirectional**: the backend streams state updates to the frontend, while the frontend sends user actions back to the backend as events.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Integration Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Backend (Effect-TS)          WebSocket          Frontend (Svelte 5) │
│                                                                  │
│  EventBus                                                        │
│     ↓                                                            │
│  UIDisplayState ─────────→ WebSocketSink ═══════→ App.svelte    │
│  (projection)              (broadcasts)           ($state)      │
│                                                                  │
│  EventBus ←─────────────── WebSocketSink ←═══════ User Actions  │
│  (publish)                 (receives)             (onclick)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key design decisions**:
1. **Server is authoritative**: All state lives on the backend
2. **One-way data flow**: Backend → Frontend via state updates
3. **Command pattern**: Frontend → Backend via action events
4. **No client-side state derivation**: UI displays exactly what server sends
5. **Two WebSocket channels**: Main chat UI + separate visualizer

### The Protocol: WebSocket Message Types

The communication protocol is defined in shared types:

```typescript
// src/shared-types.ts - Shared between backend and frontend

/**
 * UI Message displayed in chat
 */
export type UIMessage =
  | {
      id: string
      type: 'user_message'
      content: string
      timestamp: number
      queued: boolean  // Visual indicator for queued messages
    }
  | {
      id: string
      type: 'assistant_message'
      content: string
      timestamp: number
      streaming: boolean  // Visual indicator for streaming
    }
  | {
      id: string
      type: 'tool_result'
      toolName: string
      success: boolean
      output: string
      timestamp: number
      streaming: false
      queued: false
    }
  | {
      id: string
      type: 'execution_rejected'
      timestamp: number
    }
  | {
      id: string
      type: 'interrupt'
      timestamp: number
    }

/**
 * Approval prompt for code execution
 */
export type UIApprovalPrompt = {
  commandId: string
  code: string
  description?: string
}

/**
 * System status and phase
 */
export type UIStatus = {
  phase: 'idle' | 'streaming' | 'awaiting_approval' | 'executing' | 'interrupting'
  message: string
}

/**
 * Available user actions
 */
export type UIActions = {
  canSendMessage: boolean
  canApprove: boolean
  canReject: boolean
  canInterrupt: boolean
}

/**
 * Complete UI display state
 */
export type UIDisplayState = {
  messages: UIMessage[]
  status: UIStatus
  approvalPrompt: UIApprovalPrompt | null
  actions: UIActions
}

/**
 * WebSocket message from client to server
 */
export type ClientMessage =
  | { type: 'user_message'; content: string }
  | { type: 'execution_approved'; commandId: string }
  | { type: 'execution_rejected'; commandId: string; reason: string }
  | { type: 'interrupt_requested'; reason: string }

/**
 * WebSocket message from server to client
 */
export type ServerMessage = {
  type: 'display_update'
  display: UIDisplayState
}
```

**Key insights**:
- **UIDisplayState is self-contained**: Frontend doesn't need to derive anything
- **Actions are explicit**: Server tells UI what buttons to enable/disable
- **Messages include display hints**: `streaming`, `queued` flags drive UI behavior
- **Shared types prevent drift**: Backend and frontend use same TypeScript definitions

### Backend: WebSocketSink Service

The WebSocketSink service bridges UIDisplayState (Effect projection) with WebSocket clients (Bun):

```typescript
// src/services/websocket-sink.ts
import { Effect, Ref, Stream, SubscriptionRef, pipe } from 'effect'
import type { ServerWebSocket } from 'bun'
import { UIDisplayState } from './ui-display-state.ts'

export class WebSocketSink extends Effect.Service<WebSocketSink>()('WebSocketSink', {
  scoped: Effect.gen(function* () {
    const uiDisplayState = yield* UIDisplayState
    const clients = yield* Ref.make(new Set<ServerWebSocket<unknown>>())

    const broadcast = (message: any) =>
      pipe(
        Ref.get(clients),
        Effect.map(clientSet => {
          const json = JSON.stringify(message)
          for (const client of clientSet) {
            client.send(json)
          }
        })
      )

    // Subscribe to UI display updates and broadcast
    yield* Stream.runForEach(
      uiDisplayState.stream,
      (display) =>
        broadcast({
          type: 'display_update',
          display
        })
    ).pipe(Effect.forkScoped)

    return {
      broadcast,
      addClient: (ws: ServerWebSocket<unknown>) =>
        pipe(
          Ref.update(clients, s => {
            const newSet = new Set(s)
            newSet.add(ws)
            return newSet
          }),
          Effect.flatMap(() => SubscriptionRef.get(uiDisplayState.state)),
          Effect.map(currentState => {
            // Send current state to newly connected client
            ws.send(JSON.stringify({
              type: 'display_update',
              display: currentState
            }))
          })
        ),
      removeClient: (ws: ServerWebSocket<unknown>) =>
        Ref.update(clients, s => {
          const newSet = new Set(s)
          newSet.delete(ws)
          return newSet
        }),
      start: Effect.void
    }
  }),
  dependencies: [UIDisplayState.Default]
}) {}
```

**Key patterns**:

1. **Client Set Management**: Uses `Ref<Set<WebSocket>>` for thread-safe client tracking
2. **Stream Subscription**: `uiDisplayState.stream` automatically triggers broadcasts
3. **Initial State Sync**: New clients immediately receive current state
4. **Scoped Lifecycle**: Clients are cleaned up when Effect scope ends

### Backend: WebSocket Server Setup

The Bun WebSocket server integrates WebSocketSink with the Effect runtime:

```typescript
// src/server.ts
import { Effect, Layer } from 'effect'
import { EventBus } from './services/event-bus.ts'
import { WebSocketSink } from './services/websocket-sink.ts'
import type { ServerWebSocket } from 'bun'

type WebSocketData = { type: 'main' | 'visualizer' }

const AppLive = Layer.mergeAll(
  EventBus.Default,
  WebSocketSink.Default,
  // ... other services
)

const program = Effect.gen(function* () {
  const eventBus = yield* EventBus
  const webSocketSink = yield* WebSocketSink

  console.log('🚀 Starting Dataflow POC...')

  // Start Bun WebSocket server
  const server = Bun.serve<WebSocketData>({
    port: 3457,
    fetch(req, server) {
      const url = new URL(req.url)
      
      // Main chat WebSocket
      if (url.pathname === '/ws') {
        const upgraded = server.upgrade(req, { data: { type: 'main' } })
        if (!upgraded) {
          return new Response('WebSocket upgrade failed', { status: 500 })
        }
        return undefined
      }
      
      // Visualizer WebSocket
      if (url.pathname === '/visualizer') {
        const upgraded = server.upgrade(req, { data: { type: 'visualizer' } })
        if (!upgraded) {
          return new Response('WebSocket upgrade failed', { status: 500 })
        }
        return undefined
      }
      
      return new Response('Not found', { status: 404 })
    },

    websocket: {
      open(ws) {
        if (ws.data.type === 'visualizer') {
          Effect.runPromise(visualizerSink.addClient(ws))
          console.log('✓ Visualizer client connected')
        } else {
          Effect.runPromise(webSocketSink.addClient(ws))
          console.log('✓ Main client connected')
        }
      },

      async message(ws, message) {
        if (ws.data.type === 'visualizer') {
          // Visualizer clients don't send messages
          return
        }

        const data = JSON.parse(message.toString())

        // Client actions → EventBus events
        switch (data.type) {
          case 'user_message':
            await Effect.runPromise(
              eventBus.publish({
                type: 'user_message',
                content: data.content,
                timestamp: Date.now()
              })
            )
            break

          case 'execution_approved':
            await Effect.runPromise(
              eventBus.publish({
                type: 'execution_approved',
                commandId: data.commandId
              })
            )
            break

          case 'execution_rejected':
            await Effect.runPromise(
              eventBus.publish({
                type: 'execution_rejected',
                commandId: data.commandId,
                reason: data.reason || 'User rejected'
              })
            )
            break

          case 'interrupt_requested':
            await Effect.runPromise(
              eventBus.publish({
                type: 'interrupt_requested',
                reason: data.reason || 'User stopped'
              })
            )
            break
        }
      },

      close(ws) {
        if (ws.data.type === 'visualizer') {
          Effect.runPromise(visualizerSink.removeClient(ws))
          console.log('✗ Visualizer client disconnected')
        } else {
          Effect.runPromise(webSocketSink.removeClient(ws))
          console.log('✗ Main client disconnected')
        }
      }
    }
  })

  console.log(`🚀 Server running on ws://localhost:${server.port}/ws`)

  // Keep running
  yield* Effect.never
})

// Run with Effect runtime
await Effect.runPromise(
  program.pipe(
    Effect.provide(AppLive),
    Effect.scoped
  )
)
```

**Key patterns**:

1. **Two WebSocket endpoints**: `/ws` for main UI, `/visualizer` for event graph
2. **Effect.runPromise integration**: Bridge imperative Bun callbacks with Effect
3. **Type-safe data**: `WebSocketData` discriminates between connection types
4. **Client action mapping**: Simple switch statement converts client messages to events
5. **Lifecycle management**: `open`/`close` handlers manage Effect service clients

### Frontend: Svelte App Component

The Svelte frontend uses **Svelte 5 runes** (`$state`, `$derived`) for reactivity:

```svelte
<!-- web/src/App.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { UIMessage, UIApprovalPrompt, UIActions, UIStatus } from '../../src/shared-types.ts';

  // Reactive state using Svelte 5 runes
  let messages = $state<UIMessage[]>([]);
  let input = $state('');
  let ws: WebSocket | null = null;
  let connectionStatus = $state('Connecting...');
  let statusMessage = $state('');
  let approvalPrompt = $state<UIApprovalPrompt | null>(null);
  let actions = $state<UIActions>({
    canSendMessage: false,
    canApprove: false,
    canReject: false,
    canInterrupt: false
  });

  onMount(() => {
    // Connect to backend WebSocket
    ws = new WebSocket('ws://localhost:3457/ws');

    ws.onopen = () => {
      connectionStatus = 'Connected';
      console.log('Connected to Dataflow POC server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);

      // Handle display updates from backend
      if (data.type === 'display_update' && data.display) {
        const display = data.display;
        
        // Simple assignment - Svelte 5 tracks changes automatically
        messages = display.messages || [];
        statusMessage = display.status?.message || '';
        approvalPrompt = display.approvalPrompt || null;
        actions = display.actions || {
          canSendMessage: true,
          canApprove: false,
          canReject: false,
          canInterrupt: false
        };
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      connectionStatus = 'Error';
    };

    ws.onclose = () => {
      connectionStatus = 'Disconnected';
      console.log('Disconnected from server');
    };
  });

  onDestroy(() => {
    if (ws) {
      ws.close();
    }
  });

  // User action handlers - send to backend
  function sendMessage() {
    if (!ws || !input.trim() || !actions.canSendMessage) return;

    ws.send(JSON.stringify({
      type: 'user_message',
      content: input.trim()
    }));

    input = '';
  }

  function approveCommand() {
    if (!ws || !approvalPrompt) return;

    ws.send(JSON.stringify({
      type: 'execution_approved',
      commandId: approvalPrompt.commandId
    }));
  }

  function rejectCommand() {
    if (!ws || !approvalPrompt) return;

    ws.send(JSON.stringify({
      type: 'execution_rejected',
      commandId: approvalPrompt.commandId,
      reason: 'User rejected'
    }));
  }

  function interrupt() {
    if (!ws) return;

    ws.send(JSON.stringify({
      type: 'interrupt_requested',
      reason: 'User interrupted'
    }));
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="app">
  <div class="chat-panel">
    <div class="header">
      <h1>Dataflow POC</h1>
      <div class="connection-status">Connection: {connectionStatus}</div>
      {#if statusMessage}
        <div class="status">Status: {statusMessage}</div>
      {/if}
    </div>

    <div class="messages">
      {#each messages as msg}
        {#if msg.type === 'user_message'}
          <div class="message message-user" class:queued={msg.queued}>
            <div class="role">user{#if msg.queued} [queued]{/if}</div>
            <div class="content">{msg.content}</div>
          </div>
        {:else if msg.type === 'assistant_message'}
          <div class="message message-assistant">
            <div class="role">assistant</div>
            <div class="content">
              {msg.content}
              {#if msg.streaming}<span class="cursor">▋</span>{/if}
            </div>
          </div>
        {:else if msg.type === 'tool_result'}
          <div class="message message-tool {msg.success ? 'message-tool-success' : 'message-tool-error'}">
            <div class="role">tool result: {msg.toolName}</div>
            <div class="content">
              <div class="tool-status">{msg.success ? '✓ Success' : '✗ Error'}</div>
              <pre class="tool-output">{msg.output}</pre>
            </div>
          </div>
        {:else if msg.type === 'execution_rejected'}
          <div class="message message-rejected">
            <div class="role">✗ execution rejected</div>
            <div class="content">Code execution was rejected by user</div>
          </div>
        {:else if msg.type === 'interrupt'}
          <div class="message message-interrupt">
            <div class="role">⚠ interrupted</div>
            <div class="content">Operation interrupted by user</div>
          </div>
        {/if}
      {/each}
    </div>

    <!-- Approval prompt modal -->
    {#if approvalPrompt}
      <div class="approval-prompt">
        <div class="prompt-title">⚠️ Command Approval Required</div>
        {#if approvalPrompt.description}
          <div class="prompt-message">{approvalPrompt.description}</div>
        {/if}
        <pre class="prompt-code">{approvalPrompt.code}</pre>
        <div class="approval-actions">
          <button
            onclick={approveCommand}
            disabled={!actions.canApprove}
            class="approve-btn"
          >
            ✓ Approve
          </button>
          <button
            onclick={rejectCommand}
            disabled={!actions.canReject}
            class="reject-btn"
          >
            ✗ Reject
          </button>
        </div>
      </div>
    {/if}

    <div class="input-area">
      <textarea
        bind:value={input}
        onkeydown={handleKeydown}
        placeholder="Type a message..."
        disabled={!actions.canSendMessage}
      ></textarea>
      <div class="action-buttons">
        <button
          onclick={sendMessage}
          disabled={!input.trim() || !actions.canSendMessage}
        >
          Send
        </button>
        {#if actions.canInterrupt}
          <button onclick={interrupt} class="interrupt-btn">
            Stop
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* Styling omitted for brevity */
</style>
```

**Key patterns**:

1. **Svelte 5 runes**: `$state` for reactive state, no explicit stores needed
2. **Simple state updates**: Direct assignment (`messages = display.messages`)
3. **Conditional rendering**: `{#if}` blocks driven by server state
4. **Dynamic classes**: `class:queued={msg.queued}` for visual indicators
5. **Action handlers**: Simple functions that send JSON over WebSocket
6. **No client-side logic**: All business logic lives on backend

### State Synchronization Pattern

The integration follows a **strict unidirectional data flow**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    State Synchronization                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User Action (Frontend)                                      │
│     onclick={sendMessage}                                       │
│     ↓                                                            │
│     ws.send({ type: 'user_message', content })                  │
│                                                                  │
│  2. Server Receives (Backend)                                   │
│     websocket.message handler                                   │
│     ↓                                                            │
│     eventBus.publish({ type: 'user_message', content })         │
│                                                                  │
│  3. Event Processing (Backend)                                  │
│     MessagesState reducer applies event                         │
│     ↓                                                            │
│     LLMService starts streaming                                 │
│     ↓                                                            │
│     UIDisplayState recomputes projection                        │
│                                                                  │
│  4. State Broadcast (Backend)                                   │
│     UIDisplayState.stream emits new state                       │
│     ↓                                                            │
│     WebSocketSink broadcasts to all clients                     │
│                                                                  │
│  5. UI Update (Frontend)                                        │
│     ws.onmessage receives { type: 'display_update', display }   │
│     ↓                                                            │
│     messages = display.messages (Svelte rerenders)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Critical insight**: The frontend **never** computes state. It only:
1. Displays what the server sends
2. Sends user actions to the server
3. Waits for the next state update

This eliminates:
- ❌ Client/server state drift
- ❌ Race conditions from concurrent updates
- ❌ Complex client-side state management
- ❌ Optimistic updates (intentionally avoided)

### Visual Indicators from Server State

The server controls all visual behavior through flags:

```typescript
// Backend determines what UI shows
const uiMessage: UIMessage = {
  id: msg.id,
  type: 'assistant_message',
  content: msg.content,
  timestamp: msg.timestamp,
  streaming: msg.id === streamingMessageId  // ← Server decides this
}

const queuedMessage: UIMessage = {
  id: msg.id,
  type: 'user_message',
  content: msg.content,
  timestamp: msg.timestamp,
  queued: true  // ← Server decides this
}

const actions: UIActions = {
  canSendMessage: true,  // Always allow
  canApprove: phase === 'awaiting_approval',  // ← Server decides
  canReject: phase === 'awaiting_approval',   // ← Server decides
  canInterrupt: phase === 'streaming' || phase === 'executing'  // ← Server decides
}
```

**Frontend just renders**:

```svelte
<!-- Streaming cursor -->
{#if msg.streaming}
  <span class="cursor">▋</span>
{/if}

<!-- Queued indicator -->
<div class="message" class:queued={msg.queued}>
  <div class="role">user{#if msg.queued} [queued]{/if}</div>
</div>

<!-- Disabled states -->
<button disabled={!actions.canSendMessage}>Send</button>
<button disabled={!actions.canApprove}>Approve</button>
{#if actions.canInterrupt}
  <button>Stop</button>
{/if}
```

This approach makes the UI:
- **Predictable**: UI state = f(server state)
- **Consistent**: All clients see the same thing
- **Simple**: No complex client logic

### Handling Connection States

The frontend handles connection lifecycle gracefully:

```svelte
<script lang="ts">
  let connectionStatus = $state('Connecting...');

  onMount(() => {
    ws = new WebSocket('ws://localhost:3457/ws');

    ws.onopen = () => {
      connectionStatus = 'Connected';
    };

    ws.onerror = (error) => {
      connectionStatus = 'Error';
    };

    ws.onclose = () => {
      connectionStatus = 'Disconnected';
      // Could implement reconnection logic here
    };
  });

  onDestroy(() => {
    if (ws) {
      ws.close();
    }
  });
</script>

<div class="connection-status">
  Connection: {connectionStatus}
</div>
```

**Production considerations**:

```typescript
// Automatic reconnection with exponential backoff
let reconnectAttempts = 0;
const maxReconnectDelay = 30000; // 30 seconds

function connect() {
  ws = new WebSocket('ws://localhost:3457/ws');

  ws.onopen = () => {
    connectionStatus = 'Connected';
    reconnectAttempts = 0;
  };

  ws.onclose = () => {
    connectionStatus = 'Disconnected';
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay);
    reconnectAttempts++;
    
    console.log(`Reconnecting in ${delay}ms...`);
    setTimeout(connect, delay);
  };
}

onMount(() => {
  connect();
});
```

### Event Visualizer Integration

The codebase includes a **separate Svelte component** for visualizing event flow in real-time:

```svelte
<!-- web/src/EventGraphVisualizer.svelte -->
<script lang="ts">
import { onMount, onDestroy } from 'svelte'
import dagre from 'dagre'

type ServiceNode = {
  id: string
  name: string
  publishes: string[]
  subscribes: string[]
}

type GraphEdge = {
  from: string
  to: string
  eventType: string
  edgeType: 'event'
}

type GraphStructure = {
  nodes: ServiceNode[]
  edges: GraphEdge[]
  stateEdges: StateEdge[]
}

let ws: WebSocket | null = $state(null)
let graph: GraphStructure | null = $state(null)
let particles: Particle[] = $state([])
let recentEvents: Array<{ eventType: string; timestamp: number }> = $state([])

onMount(() => {
  // Connect to visualizer WebSocket endpoint
  ws = new WebSocket('ws://localhost:3457/visualizer')

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (data.type === 'graph_structure') {
      // Receive service graph on connect
      graph = data.data
      computeLayout()
    } else if (data.type === 'live_event') {
      // Animate event flowing through graph
      handleLiveEvent(data.event, data.timestamp)
    }
  }
})

function handleLiveEvent(event: any, timestamp: number) {
  recentEvents = [{ eventType: event.type, timestamp }, ...recentEvents.slice(0, 50)]

  // Find edges matching this event type
  const matchingEdges = layoutEdges.filter(e => e.eventType === event.type)

  // Create animated particles
  matchingEdges.forEach(edge => {
    const particleId = `${edge.from}-${edge.to}-${timestamp}`
    const particle: Particle = {
      id: particleId,
      from: edge.from,
      to: edge.to,
      x: edge.x1,
      y: edge.y1,
      color: edge.color,
      startTime: Date.now()
    }

    particles = [...particles, particle]

    // Animate particle along edge
    const startTime = Date.now()
    const animationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / 1000, 1)

      const currentParticle = particles.find(p => p.id === particleId)
      if (!currentParticle) {
        clearInterval(animationInterval)
        return
      }

      currentParticle.x = edge.x1 + (edge.x2 - edge.x1) * progress
      currentParticle.y = edge.y1 + (edge.y2 - edge.y1) * progress

      particles = [...particles]

      if (progress >= 1) {
        clearInterval(animationInterval)
        particles = particles.filter(p => p.id !== particleId)
      }
    }, 16) // 60fps
  })
}
</script>

<div class="visualizer">
  <div class="graph-container">
    <svg viewBox={viewBox} class="graph-svg">
      <!-- Render service graph with dagre layout -->
      <g class="edges">
        {#each uniqueEdges as edge}
          <line
            x1={edge.x1} y1={edge.y1}
            x2={edge.x2} y2={edge.y2}
            stroke="#4B5563"
            marker-end="url(#arrow)"
          />
        {/each}
      </g>

      <g class="nodes">
        {#each layoutNodes as node}
          <circle cx={node.x} cy={node.y} r={30} fill="#1F2937" />
          <text x={node.x} y={node.y} text-anchor="middle">{node.name}</text>
        {/each}
      </g>

      <!-- Animated particles showing event flow -->
      <g class="particles">
        {#each particles as particle}
          <circle
            cx={particle.x}
            cy={particle.y}
            r="6"
            fill={particle.color}
            opacity="0.9"
          />
        {/each}
      </g>
    </svg>
  </div>

  <!-- Event log sidebar -->
  <div class="event-log">
    <h3>Recent Events</h3>
    {#each recentEvents as event}
      <div class="event-item">
        <span class="event-dot" style="background-color: {getEventColor(event.eventType)}"></span>
        <span class="event-type">{event.eventType}</span>
        <span class="event-time">{formatTime(event.timestamp)}</span>
      </div>
    {/each}
  </div>
</div>
```

**Backend: VisualizerSink service**:

```typescript
// src/services/visualizer-sink.ts
import { Effect, Stream, SubscriptionRef } from 'effect'
import { EventBus } from './event-bus.ts'
import { deriveGraph } from '../visualizer/registry.ts'

export class VisualizerSink extends Effect.Service<VisualizerSink>()('VisualizerSink', {
  scoped: Effect.gen(function* () {
    const eventBus = yield* EventBus
    const clientsRef = yield* SubscriptionRef.make<Set<ServerWebSocket<unknown>>>(new Set())

    // Subscribe to ALL events
    const allEvents = yield* eventBus.subscribe((e): e is Event => true)

    // Broadcast all events to visualizer clients
    yield* Stream.runForEach(allEvents, (event) =>
      Effect.gen(function* () {
        const clients = yield* SubscriptionRef.get(clientsRef)
        const message = {
          type: 'live_event',
          event,
          timestamp: Date.now(),
        }

        clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify(message))
          }
        })
      })
    ).pipe(Effect.forkScoped)

    return {
      addClient: (ws: ServerWebSocket<unknown>) =>
        Effect.gen(function* () {
          yield* SubscriptionRef.update(clientsRef, (clients) => {
            const newClients = new Set(clients)
            newClients.add(ws)
            return newClients
          })

          // Send graph structure immediately on connect
          const graphStructure = deriveGraph()
          const message = {
            type: 'graph_structure',
            data: graphStructure,
          }
          ws.send(JSON.stringify(message))
        }),

      removeClient: (ws: ServerWebSocket<unknown>) =>
        SubscriptionRef.update(clientsRef, (clients) => {
          const newClients = new Set(clients)
          newClients.delete(ws)
          return newClients
        })
    }
  }),
  dependencies: [EventBus.Default]
}) {}
```

**Key visualizer patterns**:
1. **Separate WebSocket channel**: `/visualizer` doesn't interfere with main UI
2. **Graph structure on connect**: Client receives service topology immediately
3. **Live event streaming**: Every EventBus event is broadcast to visualizer
4. **Client-side animation**: Svelte animates particles along edges using `setInterval`
5. **dagre layout**: Auto-layout graph with hierarchical structure

### Benefits of Effect-Svelte Integration

#### 1. **Simple Mental Model**

```typescript
// Frontend developer only needs to know:
// 1. What messages to send
ws.send({ type: 'user_message', content })

// 2. What state to display
messages = display.messages
actions = display.actions

// That's it. No reducers, no selectors, no complex state management.
```

#### 2. **Type Safety Across Boundary**

```typescript
// Shared types prevent drift
import type { UIDisplayState, ClientMessage } from '../../src/shared-types.ts'

// Frontend and backend use same definitions
const message: ClientMessage = {
  type: 'user_message',
  content: input
}

// TypeScript catches mismatches at compile time
```

#### 3. **Server Authority**

```typescript
// Backend controls everything
const actions: UIActions = {
  canSendMessage: true,  // Backend decides
  canInterrupt: isStreaming || isExecuting  // Backend decides
}

// Frontend just renders
<button disabled={!actions.canInterrupt}>Stop</button>

// No "am I allowed to interrupt?" logic on frontend
```

#### 4. **Automatic State Sync**

```typescript
// Backend: UIDisplayState updates trigger broadcasts
yield* Stream.runForEach(
  uiDisplayState.stream,
  (display) => broadcast({ type: 'display_update', display })
).pipe(Effect.forkScoped)

// Frontend: Svelte 5 reactivity handles the rest
messages = display.messages  // Automatic rerender

// No manual sync code needed
```

#### 5. **Real-time Updates**

```svelte
<!-- Streaming indicator updates in real-time -->
{#if msg.streaming}
  <span class="cursor">▋</span>
{/if}

<!-- Backend sends streaming=true with each chunk -->
<!-- Frontend rerenders on each update -->
<!-- Smooth, real-time streaming experience -->
```

### Testing the Integration

#### Backend Tests (Effect-TS)

```typescript
// Test UIDisplayState projection
it('should show approval prompt when command requested', async () => {
  const program = Effect.gen(function* () {
    const eventBus = yield* EventBus
    const uiDisplayState = yield* UIDisplayState

    // Request command
    yield* eventBus.publish({
      type: 'command_requested',
      commandId: 'test_cmd',
      command: 'eval',
      params: { code: '1+1' }
    })

    // Wait for UI to update
    const state = yield* waitForCondition(
      uiDisplayState.state,
      s => s.approvalPrompt !== null
    )

    // Verify UI state
    expect(state.status.phase).toBe('awaiting_approval')
    expect(state.approvalPrompt?.code).toBe('1+1')
    expect(state.actions.canApprove).toBe(true)
    expect(state.actions.canReject).toBe(true)
  })

  await Effect.runPromise(program.pipe(Effect.provide(testLayer), Effect.scoped))
})
```

#### Frontend Tests (Svelte)

```typescript
// Test message rendering
import { render, screen } from '@testing-library/svelte'
import App from './App.svelte'

test('renders user messages', () => {
  const { component } = render(App)
  
  // Simulate server message
  component.$set({
    messages: [
      { id: '1', type: 'user_message', content: 'Hello', timestamp: Date.now(), queued: false }
    ]
  })
  
  expect(screen.getByText('Hello')).toBeInTheDocument()
})

test('shows approval prompt', () => {
  const { component } = render(App)
  
  component.$set({
    approvalPrompt: { commandId: 'cmd_1', code: '2+2' },
    actions: { canApprove: true, canReject: true, canSendMessage: true, canInterrupt: false }
  })
  
  expect(screen.getByText('⚠️ Command Approval Required')).toBeInTheDocument()
  expect(screen.getByText('2+2')).toBeInTheDocument()
})
```

#### Integration Tests (E2E)

```typescript
// Test WebSocket communication end-to-end
import { test, expect } from '@playwright/test'

test('user can send message and receive response', async ({ page }) => {
  await page.goto('http://localhost:3458')
  
  // Wait for connection
  await page.waitForSelector('.connection-status:has-text("Connected")')
  
  // Type and send message
  await page.fill('textarea', 'Hello')
  await page.click('button:has-text("Send")')
  
  // Wait for response
  await page.waitForSelector('.message-assistant')
  
  // Verify message appeared
  const messages = await page.locator('.message').allTextContents()
  expect(messages.some(m => m.includes('Hello'))).toBeTruthy()
})

test('user can interrupt streaming response', async ({ page }) => {
  await page.goto('http://localhost:3458')
  await page.waitForSelector('.connection-status:has-text("Connected")')
  
  // Start a long response
  await page.fill('textarea', 'Tell me a very long story')
  await page.click('button:has-text("Send")')
  
  // Wait for streaming to start
  await page.waitForSelector('.cursor')
  
  // Click interrupt
  await page.click('button:has-text("Stop")')
  
  // Verify streaming stopped
  await page.waitForSelector('.cursor', { state: 'hidden' })
})
```

### Production Considerations

#### 1. **Reconnection Strategy**

```typescript
// Exponential backoff with jitter
let reconnectAttempts = 0;

function connect() {
  ws = new WebSocket('ws://localhost:3457/ws');

  ws.onclose = () => {
    const baseDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    const jitter = Math.random() * 1000;
    const delay = baseDelay + jitter;
    
    reconnectAttempts++;
    setTimeout(connect, delay);
  };
}
```

#### 2. **Connection State UI**

```svelte
{#if connectionStatus === 'Disconnected'}
  <div class="reconnecting-banner">
    Reconnecting to server...
  </div>
{:else if connectionStatus === 'Error'}
  <div class="error-banner">
    Connection error. <button onclick={connect}>Retry</button>
  </div>
{/if}
```

#### 3. **Message Size Limits**

```typescript
// Backend: Limit UIDisplayState size
const displayStream = Stream.zipLatest(...).pipe(
  Stream.map(([messagesValue, ...]) => {
    // Only send recent messages to reduce payload
    const recentMessages = messagesValue.messages.slice(-50)
    
    return {
      messages: recentMessages.map(formatForUI),
      // ...
    }
  })
)
```

#### 4. **Optimistic UI Updates (Optional)**

```svelte
<script lang="ts">
  // Add message optimistically
  function sendMessage() {
    if (!ws || !input.trim()) return;

    // Add to UI immediately
    const optimisticMsg: UIMessage = {
      id: `temp_${Date.now()}`,
      type: 'user_message',
      content: input.trim(),
      timestamp: Date.now(),
      queued: false
    };
    messages = [...messages, optimisticMsg];

    // Send to server
    ws.send(JSON.stringify({
      type: 'user_message',
      content: input.trim()
    }));

    input = '';
  }

  // Server update replaces optimistic message
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'display_update') {
      // Server state is authoritative
      messages = data.display.messages;
    }
  };
</script>
```

**Trade-off**: Optimistic updates add complexity but improve perceived performance. This codebase intentionally avoids them for simplicity.

### Summary: Effect-Svelte Integration

The Effect-Svelte integration exemplifies **clean separation of concerns**:

1. **Backend (Effect-TS)**: All business logic, state management, event processing
2. **Frontend (Svelte 5)**: Pure rendering, user input handling
3. **WebSocket**: Thin communication layer with typed messages

**Key patterns**:
- **Server authority**: Backend controls all state and UI behavior
- **Unidirectional flow**: Backend → Frontend via state updates
- **Command pattern**: Frontend → Backend via action messages
- **Type safety**: Shared TypeScript types across boundary
- **Reactive rendering**: Svelte 5 runes handle UI updates automatically
- **Multiple channels**: Separate WebSockets for UI and visualizer
- **No client state**: Frontend has zero business logic

**Benefits**:
- ✅ No state drift between frontend/backend
- ✅ Simple frontend (just render and send actions)
- ✅ Testable in isolation (backend and frontend separately)
- ✅ Real-time updates with minimal code
- ✅ Type-safe communication protocol
- ✅ Easy to reason about (one-way data flow)

**The result**: A production-ready real-time UI that stays perfectly synchronized with the backend event-driven system, with minimal complexity on the frontend.
