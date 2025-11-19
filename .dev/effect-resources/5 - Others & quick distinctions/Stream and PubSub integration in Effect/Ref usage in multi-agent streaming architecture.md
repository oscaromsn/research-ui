---
modified: 2025-10-26T14:41:23-03:00
---
# Ref usage in multi-agent streaming architecture

`Ref` is **fundamental** to the multi-agent streaming architecture. Let me show you exactly how it fits in:

## `Ref` Core Role: Fiber-Safe Mutable State

`Ref` is Effect's solution for **concurrent mutable state** - it's like a `useState` hook, but fiber-safe and composable with effects.

### 1. **Agent State Management**

Track agent execution state across streaming operations:

```typescript
import { Effect, Ref, Stream } from "effect";

class AgentState extends Effect.Service<AgentState>()("app/AgentState", {
  scoped: Effect.gen(function* () {
    // Ref stores current agent iteration state
    const iterationRef = yield* Ref.make(0);
    const tokenCountRef = yield* Ref.make(0);
    const thoughtsRef = yield* Ref.make<string[]>([]);
    
    return {
      // Atomically increment iteration counter
      nextIteration: Ref.updateAndGet(iterationRef, n => n + 1),
      
      // Track token usage during streaming
      addTokens: (count: number) =>
        Ref.update(tokenCountRef, n => n + count),
      
      // Accumulate thoughts during reasoning
      recordThought: (thought: string) =>
        Ref.update(thoughtsRef, thoughts => [...thoughts, thought]),
      
      // Get current snapshot
      getState: Effect.gen(function* () {
        const iteration = yield* Ref.get(iterationRef);
        const tokens = yield* Ref.get(tokenCountRef);
        const thoughts = yield* Ref.get(thoughtsRef);
        return { iteration, tokens, thoughts };
      })
    };
  })
}) {}
```

### 2. **Token Streaming with State Accumulation**

Refs accumulate streamed tokens into complete responses:

```typescript
import { Effect, Ref, Stream, Chunk } from "effect";

// Pattern: Stream tokens while accumulating full response
const streamWithAccumulation = (
  agentId: string,
  tokenStream: Stream.Stream<string>
) => Effect.gen(function* () {
  // Ref accumulates tokens as they stream
  const accumulatedRef = yield* Ref.make("");
  const eventBus = yield* EventBus;
  
  yield* tokenStream.pipe(
    // Side effect: publish each token
    Stream.tap(token => 
      eventBus.publish(new TokenStreamEvent({ 
        agentId, 
        token,
        isComplete: false 
      }))
    ),
    // Side effect: accumulate into Ref
    Stream.tap(token => 
      Ref.update(accumulatedRef, acc => acc + token)
    ),
    Stream.runDrain
  );
  
  // After stream completes, get full response
  const fullResponse = yield* Ref.get(accumulatedRef);
  
  // Publish completion event
  yield* eventBus.publish(new TokenStreamEvent({
    agentId,
    token: fullResponse,
    isComplete: true
  }));
  
  return fullResponse;
});
```

### 3. **Multi-Agent Coordination**

Use Refs to coordinate state between multiple concurrent agents:

```typescript
class MultiAgentCoordinator extends Effect.Service<MultiAgentCoordinator>()(
  "app/MultiAgentCoordinator",
  {
    scoped: Effect.gen(function* () {
      // Shared state across all agents
      const activeAgentsRef = yield* Ref.make<Set<string>>(new Set());
      const resultsRef = yield* Ref.make<Map<string, string>>(new Map());
      
      return {
        // Register agent as active
        registerAgent: (agentId: string) =>
          Ref.update(activeAgentsRef, agents => 
            new Set(agents).add(agentId)
          ),
        
        // Unregister agent
        unregisterAgent: (agentId: string) =>
          Ref.update(activeAgentsRef, agents => {
            const updated = new Set(agents);
            updated.delete(agentId);
            return updated;
          }),
        
        // Store agent result
        storeResult: (agentId: string, result: string) =>
          Ref.update(resultsRef, results => 
            new Map(results).set(agentId, result)
          ),
        
        // Check if all agents completed
        allComplete: (expectedCount: number) =>
          Effect.gen(function* () {
            const results = yield* Ref.get(resultsRef);
            return results.size === expectedCount;
          }),
        
        // Get all results atomically
        getResults: Ref.get(resultsRef)
      };
    })
  }
) {}
```

### 4. **Session State with Refs**

Manage authentication state that affects streaming operations:

```typescript
class SessionService extends Effect.Service<SessionService>()(
  "app/SessionService",
  {
    scoped: Effect.gen(function* () {
      // Ref stores current session tokens
      const tokensRef = yield* Ref.make<Option.Option<AuthTokens>>(
        Option.none()
      );
      
      return {
        // Check if we have valid tokens
        hasValidSession: Effect.gen(function* () {
          const tokens = yield* Ref.get(tokensRef);
          return Option.isSome(tokens);
        }),
        
        // Update tokens atomically
        updateTokens: (tokens: AuthTokens) =>
          Ref.set(tokensRef, Option.some(tokens)),
        
        // Clear session
        clearSession: Ref.set(tokensRef, Option.none()),
        
        // Get current tokens
        getTokens: Effect.gen(function* () {
          const tokens = yield* Ref.get(tokensRef);
          return yield* Option.match(tokens, {
            onNone: () => Effect.fail(new SessionExpiredError()),
            onSome: Effect.succeed
          });
        })
      };
    })
  }
) {}
```

### 5. **Ref vs SubscriptionRef - When to Use Which**

```typescript
// ❌ DON'T: Use regular Ref when you need reactivity
const counterRef = yield* Ref.make(0);
// Problem: No way to subscribe to changes!

// ✅ DO: Use SubscriptionRef for reactive state
const counterRef = yield* SubscriptionRef.make(0);

// Multiple consumers can subscribe to changes
const consumer1 = counterRef.changes.pipe(
  Stream.tap(count => Effect.log(`Consumer 1: ${count}`)),
  Stream.runDrain,
  Effect.fork
);

const consumer2 = counterRef.changes.pipe(
  Stream.tap(count => Effect.log(`Consumer 2: ${count}`)),
  Stream.runDrain,
  Effect.fork
);

// Updates are broadcast to all subscribers
yield* SubscriptionRef.update(counterRef, n => n + 1);
```

**Use `Ref` when**:
- State is read/written by your code directly
- No external observers need to react to changes
- You want minimal overhead

**Use `SubscriptionRef` when**:
- Multiple consumers need to observe state changes
- Building reactive systems (like UI updates)
- State changes should trigger side effects in multiple places

### 6. **Complete Pattern: Agent with Ref-Based State**

Here's how everything comes together:

```typescript
class ReasoningAgent extends Effect.Service<ReasoningAgent>()(
  "app/ReasoningAgent",
  {
    dependencies: [LLMService.Default, EventBus.Default],
    
    scoped: Effect.gen(function* () {
      const llm = yield* LLMService;
      const eventBus = yield* EventBus;
      
      return {
        executeTask: (params: {
          agentId: string;
          task: string;
          maxIterations: number;
        }) => Effect.gen(function* () {
          // Local Refs for this execution
          const iterationRef = yield* Ref.make(0);
          const thoughtsRef = yield* Ref.make<string[]>([]);
          const observationsRef = yield* Ref.make<string[]>([]);
          
          let currentPrompt = params.task;
          
          while (true) {
            // Get and increment iteration atomically
            const iteration = yield* Ref.updateAndGet(
              iterationRef, 
              n => n + 1
            );
            
            if (iteration > params.maxIterations) {
              break;
            }
            
            // Stream LLM response with token accumulation
            const responseRef = yield* Ref.make("");
            
            yield* llm.streamCompletion({
              agentId: params.agentId,
              prompt: currentPrompt,
              sequence: iteration
            }).pipe(
              // Accumulate tokens
              Stream.tap(token => 
                Ref.update(responseRef, acc => acc + token)
              ),
              // Publish events
              Stream.tap(token =>
                eventBus.publish(new TokenStreamEvent({
                  agentId: params.agentId,
                  token,
                  sequence: iteration,
                  isComplete: false
                }))
              ),
              Stream.runDrain
            );
            
            // Get accumulated response
            const fullResponse = yield* Ref.get(responseRef);
            
            // Store thought
            yield* Ref.update(thoughtsRef, thoughts => 
              [...thoughts, fullResponse]
            );
            
            // Parse action from response
            const action = parseAction(fullResponse);
            
            if (action.type === "final_answer") {
              // Return all accumulated state
              const thoughts = yield* Ref.get(thoughtsRef);
              const observations = yield* Ref.get(observationsRef);
              
              return {
                answer: action.content,
                thoughts,
                observations,
                iterations: iteration
              };
            }
            
            // Execute action and store observation
            const observation = yield* executeAction(action);
            yield* Ref.update(observationsRef, obs => 
              [...obs, observation]
            );
            
            // Update prompt for next iteration
            currentPrompt = buildNextPrompt(fullResponse, observation);
          }
          
          return yield* Effect.fail(
            new MaxIterationsError({ reached: params.maxIterations })
          );
        })
      };
    })
  }
) {}
```

### 7. **Ref Performance Characteristics**

```typescript
// ✅ FAST: Refs are optimized for concurrent access
const ref = yield* Ref.make(0);
yield* Effect.all(
  Array.from({ length: 1000 }, (_, i) => 
    Ref.update(ref, n => n + 1)
  ),
  { concurrency: "unbounded" } // All updates are atomic!
);

// ❌ SLOW: Don't use Ref.modify with expensive computations
yield* Ref.modify(ref, (current) => {
  const expensive = doHeavyComputation(current); // Blocks other fibers!
  return [expensive, expensive];
});

// ✅ BETTER: Move computation outside the critical section
const computed = yield* Effect.sync(() => doHeavyComputation(current));
yield* Ref.set(ref, computed);
```

## Summary: Ref's Role in Multi-Agent Architecture

| Use Case | Pattern | Why Ref? |
|----------|---------|----------|
| **Agent iteration tracking** | `Ref.make(0)` + `updateAndGet` | Atomic counter across concurrent operations |
| **Token accumulation** | `Ref.make("")` + `update` in `Stream.tap` | Accumulate streaming chunks into complete response |
| **Multi-agent coordination** | `Ref.make<Map>` for results | Share state between concurrent agent fibers |
| **Session management** | `Ref.make<Option<AuthTokens>>` | Thread-safe token storage |
| **Reactive state** | `SubscriptionRef.make` + `.changes` | Broadcast state changes to multiple consumers |
| **Buffer management** | `Ref.make<Queue>` | Implement custom buffering logic |

**Key Insight**: `Ref` is the **glue** that makes concurrent state management safe and composable. In a multi-agent system with streaming, you need Refs to:
1. Accumulate partial results while streaming
2. Track progress across concurrent agents
3. Coordinate shared state without race conditions
4. Bridge between imperative streaming APIs and Effect's functional model

Without `Ref`, you'd need mutexes, locks, and careful manual synchronization. With `Ref`, atomicity is built-in! 🎯
