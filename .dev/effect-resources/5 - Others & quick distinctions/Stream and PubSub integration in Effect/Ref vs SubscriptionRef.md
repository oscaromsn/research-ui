---
modified: 2025-10-26T14:40:34-03:00
---
# Ref vs SubscriptionRef

Let me give you a comprehensive deep-dive into `Ref` vs `SubscriptionRef` - their fundamental differences, performance implications, and when to choose each.

## The Fundamental Semantic Difference

**`Ref<A>`**: A mutable cell for atomic state updates
**`SubscriptionRef<A>`**: A mutable cell + an observable stream of changes

```typescript
// Type signatures tell the story
interface Ref<A> {
  get: Effect<A>
  set: (value: A) => Effect<void>
  update: (f: (a: A) => A) => Effect<void>
  modify: <B>(f: (a: A) => readonly [B, A]) => Effect<B>
}

interface SubscriptionRef<A> extends SynchronizedRef<A> {
  // Inherits all Ref operations, plus:
  readonly changes: Stream<A>  // ⚠️ This is the key distinction!
}
```

## Implementation & Performance Implications

### Ref: Optimized for Pure State

```typescript
// Ref is implemented with a simple atomic compare-and-swap
// Internally: just a mutable cell + CAS operations
// Memory: O(1) - just stores the value
// Write: O(1) - atomic CAS
// Read: O(1) - direct access

const counter = yield* Ref.make(0);

// These are VERY fast - no overhead
yield* Ref.update(counter, n => n + 1);  // Just a CAS operation
const value = yield* Ref.get(counter);   // Direct read
```

### SubscriptionRef: Pub/Sub Infrastructure

```typescript
// SubscriptionRef is implemented with:
// 1. A SynchronizedRef (for the current value)
// 2. A Hub (for broadcasting changes to subscribers)
// 3. Subscriber tracking and management

// Memory: O(1 + N) where N = number of active subscribers
// Write: O(N) - must broadcast to all subscribers
// Read (current value): O(1)
// Subscribe: O(1) to create stream, but maintains subscription overhead

const counter = yield* SubscriptionRef.make(0);

// Write is slower - must notify all subscribers
yield* SubscriptionRef.update(counter, n => n + 1);

// Each subscription holds resources
const subscriber1 = counter.changes;  // Creates subscriber 1
const subscriber2 = counter.changes;  // Creates subscriber 2

// Now updates broadcast to 2 subscribers (2x overhead)
```

## Memory Characteristics

### Ref Memory Profile

```typescript
// ✅ Ref: Minimal memory footprint
const userState = yield* Ref.make<UserState>({
  id: "123",
  preferences: { theme: "dark" }
});

// Memory: sizeof(UserState) + minimal overhead (~16-24 bytes)
// No subscriptions = no extra memory
// GC-friendly: Just the current value
```

### SubscriptionRef Memory Profile

```typescript
// ⚠️ SubscriptionRef: Additional infrastructure
const userState = yield* SubscriptionRef.make<UserState>({
  id: "123",
  preferences: { theme: "dark" }
});

// Memory breakdown:
// - Current value: sizeof(UserState)
// - Hub infrastructure: ~100-200 bytes
// - Per subscriber: ~50-100 bytes each
// - Stream buffers: variable (depends on backpressure)

// Example: 100 subscribers = ~5-10KB overhead
const subscribers = Array.from({ length: 100 }, () => 
  userState.changes.pipe(
    Stream.take(10),
    Stream.runCollect,
    Effect.fork
  )
);

// Problem: If subscribers are slow, memory can grow!
```

## Critical Distinction: Update Semantics

### Ref: Fire and Forget

```typescript
// Writes complete immediately (no waiting for observers)
const ref = yield* Ref.make(0);

yield* Effect.all(
  Array.from({ length: 1000 }, (_, i) => 
    Ref.update(ref, n => n + 1)
  ),
  { concurrency: "unbounded" }
);

// ✅ All 1000 updates complete near-instantly
// No subscribers = no broadcast overhead
```

### SubscriptionRef: Backpressure Considerations

```typescript
const ref = yield* SubscriptionRef.make(0);

// Slow subscriber can create backpressure
const slowSubscriber = ref.changes.pipe(
  Stream.tap(value => Effect.sleep("1 second")), // Slow!
  Stream.runDrain,
  Effect.fork
);

// Now updates might block or buffer depending on strategy
yield* SubscriptionRef.update(ref, n => n + 1);
// ⚠️ This update must be broadcast to slowSubscriber
```

## Use Case Matrix

### When to Use `Ref`

```typescript
// ✅ PERFECT for Ref:

// 1. Internal service state (no external observers)
class TokenManager extends Effect.Service<TokenManager>()(
  "app/TokenManager",
  {
    scoped: Effect.gen(function* () {
      const tokensRef = yield* Ref.make<Option.Option<Tokens>>(Option.none());
      
      // Private state, no one subscribes
      return {
        setTokens: (tokens: Tokens) => Ref.set(tokensRef, Option.some(tokens)),
        getTokens: Ref.get(tokensRef)
      };
    })
  }
) {}

// 2. High-frequency updates (thousands per second)
const metricsRef = yield* Ref.make({ requests: 0, errors: 0 });

yield* Stream.fromIterable(requests).pipe(
  Stream.tap(() => Ref.update(metricsRef, m => ({ 
    ...m, 
    requests: m.requests + 1 
  }))),
  Stream.runDrain
);

// 3. Accumulator pattern (no need to observe intermediate states)
const accumulator = yield* Ref.make("");
yield* tokenStream.pipe(
  Stream.tap(token => Ref.update(accumulator, acc => acc + token)),
  Stream.runDrain
);

// 4. Lock-free concurrent counters
const counter = yield* Ref.make(0);
yield* Effect.all(
  Array.from({ length: 10000 }, () => Ref.update(counter, n => n + 1)),
  { concurrency: "unbounded" }
);
```

### When to Use `SubscriptionRef`

```typescript
// ✅ PERFECT for SubscriptionRef:

// 1. UI state synchronization (multiple components observe)
class AppState extends Effect.Service<AppState>()("app/AppState", {
  scoped: Effect.gen(function* () {
    const userRef = yield* SubscriptionRef.make<Option.Option<User>>(
      Option.none()
    );
    
    return {
      setUser: (user: User) => 
        SubscriptionRef.set(userRef, Option.some(user)),
      
      // Multiple React components can subscribe
      userChanges: userRef.changes
    };
  })
}) {}

// 2. Real-time metrics dashboard (observers need updates)
const metricsRef = yield* SubscriptionRef.make<Metrics>({
  activeUsers: 0,
  requestsPerSecond: 0
});

// Backend updates metrics
yield* updateMetricsPeriodically(metricsRef);

// Frontend subscribes to changes
const metricsStream = metricsRef.changes.pipe(
  Stream.tap(metrics => updateDashboard(metrics))
);

// 3. Configuration hot-reloading
const configRef = yield* SubscriptionRef.make(initialConfig);

// All services subscribe to config changes
class DatabaseService extends Effect.Service<DatabaseService>()(
  "app/DatabaseService",
  {
    dependencies: [ConfigState.Default],
    scoped: Effect.gen(function* () {
      const configState = yield* ConfigState;
      
      // React to config changes
      yield* configState.configChanges.pipe(
        Stream.tap(newConfig => reconnectWithNewConfig(newConfig)),
        Stream.runDrain,
        Effect.forkScoped // Fork in service scope
      );
      
      return { /* ... */ };
    })
  }
) {}

// 4. Server-Sent Events (SSE) / WebSocket broadcasting
const gameStateRef = yield* SubscriptionRef.make<GameState>(initialState);

// Each connected client gets their own subscription
const handleConnection = (clientId: string) =>
  gameStateRef.changes.pipe(
    Stream.map(state => JSON.stringify(state)),
    Stream.tap(json => sendToClient(clientId, json)),
    Stream.runDrain
  );

// Game loop updates state, all clients notified
yield* Effect.forever(
  Effect.gen(function* () {
    yield* Effect.sleep("16 millis"); // 60 FPS
    yield* SubscriptionRef.update(gameStateRef, updateGameState);
  })
);
```

## Anti-Patterns & Gotchas

### ❌ Anti-Pattern 1: SubscriptionRef for Non-Observable State

```typescript
// ❌ BAD: No one subscribes, unnecessary overhead
class UserRepository extends Effect.Service<UserRepository>()(
  "app/UserRepository",
  {
    effect: Effect.gen(function* () {
      const cacheRef = yield* SubscriptionRef.make<Map<UserId, User>>(
        new Map()
      );
      
      return {
        getUser: (id: UserId) => Effect.gen(function* () {
          const cache = yield* SubscriptionRef.get(cacheRef);
          return cache.get(id);
        })
      };
    })
  }
) {}

// ✅ GOOD: Use regular Ref (no observers)
const cacheRef = yield* Ref.make<Map<UserId, User>>(new Map());
```

### ❌ Anti-Pattern 2: Ref When Multiple Observers Needed

```typescript
// ❌ BAD: Polling pattern to observe changes
const stateRef = yield* Ref.make<State>(initialState);

// Component 1 polls
yield* Effect.forever(
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef);
    yield* updateUI(state);
    yield* Effect.sleep("100 millis"); // Wasteful polling!
  })
).pipe(Effect.fork);

// ✅ GOOD: Use SubscriptionRef for push-based updates
const stateRef = yield* SubscriptionRef.make<State>(initialState);

yield* stateRef.changes.pipe(
  Stream.tap(updateUI),
  Stream.runDrain,
  Effect.fork
);
```

### ❌ Anti-Pattern 3: Memory Leak from Uninterrupted Subscriptions

```typescript
// ❌ DANGEROUS: Subscription leaks if not properly scoped
const ref = yield* SubscriptionRef.make(0);

const subscribe = (clientId: string) => {
  // Problem: This fiber never gets interrupted!
  return ref.changes.pipe(
    Stream.tap(value => notify(clientId, value)),
    Stream.runDrain,
    Effect.fork  // ⚠️ Forked but never interrupted!
  );
};

// Each connection creates a leak
yield* Effect.all(
  Array.from({ length: 100 }, (_, i) => subscribe(`client-${i}`))
);

// ✅ SAFE: Scope subscriptions properly
const subscribe = (clientId: string) =>
  Effect.scoped(
    Effect.gen(function* () {
      const ref = yield* SubscriptionRef;
      
      yield* ref.changes.pipe(
        Stream.tap(value => notify(clientId, value)),
        Stream.runDrain,
        Effect.forkScoped  // Tied to scope lifecycle
      );
    })
  );
```

### ❌ Anti-Pattern 4: High-Frequency Updates with Many Subscribers

```typescript
// ❌ PERFORMANCE PROBLEM: Broadcasting bottleneck
const positionRef = yield* SubscriptionRef.make<Position>({ x: 0, y: 0 });

// 1000 subscribers
const subscribers = Array.from({ length: 1000 }, () =>
  positionRef.changes.pipe(
    Stream.tap(pos => renderOnCanvas(pos)),
    Stream.runDrain,
    Effect.fork
  )
);

// Update 60 times per second
yield* Effect.forever(
  Effect.gen(function* () {
    yield* SubscriptionRef.update(positionRef, updatePosition);
    yield* Effect.sleep("16 millis");
  })
);
// Problem: 60 FPS * 1000 subscribers = 60,000 broadcasts/sec!

// ✅ SOLUTION: Rate-limit subscribers
const subscribers = Array.from({ length: 1000 }, () =>
  positionRef.changes.pipe(
    Stream.throttle("33 millis"), // 30 FPS per subscriber
    Stream.tap(pos => renderOnCanvas(pos)),
    Stream.runDrain,
    Effect.fork
  )
);
```

## Advanced Patterns

### Pattern 1: Derived Reactive State

```typescript
// Derive computed streams from SubscriptionRef
const userRef = yield* SubscriptionRef.make<User>(currentUser);
const permissionsRef = yield* SubscriptionRef.make<Permissions>(currentPerms);

// Derived stream: recomputes when either changes
const accessControlStream = Stream.combineLatest(
  userRef.changes,
  permissionsRef.changes
).pipe(
  Stream.map(([user, perms]) => computeAccessControl(user, perms))
);

// Service can subscribe to derived state
yield* accessControlStream.pipe(
  Stream.tap(ac => updateSecurityContext(ac)),
  Stream.runDrain,
  Effect.forkScoped
);
```

### Pattern 2: Ref for Write, SubscriptionRef for Read

```typescript
// Hybrid: Fast writes, selective observation
class MetricsService extends Effect.Service<MetricsService>()(
  "app/MetricsService",
  {
    scoped: Effect.gen(function* () {
      // Fast writes go to Ref
      const metricsRef = yield* Ref.make<Metrics>({
        requests: 0,
        errors: 0
      });
      
      // Periodically publish to SubscriptionRef
      const publicMetricsRef = yield* SubscriptionRef.make<Metrics>(
        yield* Ref.get(metricsRef)
      );
      
      // Background job: sync every second
      yield* Effect.forever(
        Effect.gen(function* () {
          yield* Effect.sleep("1 second");
          const latest = yield* Ref.get(metricsRef);
          yield* SubscriptionRef.set(publicMetricsRef, latest);
        })
      ).pipe(Effect.forkScoped);
      
      return {
        // Internal: fast writes
        recordRequest: Ref.update(metricsRef, m => ({
          ...m,
          requests: m.requests + 1
        })),
        
        // External: observable stream (1 update/sec)
        metricsChanges: publicMetricsRef.changes
      };
    })
  }
) {}
```

### Pattern 3: SubscriptionRef for Coordination

```typescript
// Use SubscriptionRef to coordinate multiple agents
const coordinationRef = yield* SubscriptionRef.make<CoordinationState>({
  phase: "initializing",
  readyAgents: new Set<AgentId>()
});

// All agents subscribe and react to phase changes
class Agent extends Effect.Service<Agent>()("app/Agent", {
  scoped: Effect.gen(function* () {
    const coord = yield* CoordinationService;
    
    yield* coord.stateChanges.pipe(
      Stream.tap(state => {
        if (state.phase === "execute") {
          return executeTask();
        }
        return Effect.void;
      }),
      Stream.runDrain,
      Effect.forkScoped
    );
    
    return { /* ... */ };
  })
}) {}
```

## Performance Benchmarks (Rough Estimates)

```typescript
// Ref performance (1M operations):
// - Writes: ~50-100ms
// - Reads: ~20-40ms
// - Memory: ~24 bytes + value size

// SubscriptionRef performance (1M operations):
// - Writes (0 subscribers): ~80-150ms (Hub overhead)
// - Writes (10 subscribers): ~200-400ms (broadcasting)
// - Writes (100 subscribers): ~1-2 seconds (broadcasting)
// - Reads: ~20-40ms (same as Ref)
// - Memory: ~200 bytes + value size + (50-100 bytes * subscribers)
```

## Decision Tree

```
Do multiple consumers need to react to state changes?
├─ No  → Use `Ref`
│       └─ Pure state management
│           └─ Minimal overhead
└─ Yes → Are updates high-frequency (>100/sec)?
         ├─ Yes → Reconsider architecture
         │        ├─ Can you batch updates?
         │        ├─ Can you use rate-limiting?
         │        └─ Consider Ref + periodic polling
         └─ No  → Use `SubscriptionRef`
                  └─ But ensure subscribers are scoped!
```

## Summary Table

| Aspect | `Ref` | `SubscriptionRef` |
|--------|-------|-------------------|
| **Primary Use** | Internal state | Observable state |
| **Write Cost** | O(1) | O(N subscribers) |
| **Memory** | O(1) | O(1 + N subscribers) |
| **Observers** | No | Yes (via `.changes`) |
| **Backpressure** | N/A | Can occur |
| **Scope Leaks** | Impossible | Possible if not scoped |
| **Best For** | Counters, caches, accumulators | UI state, dashboards, SSE, config |
| **Performance** | Fastest | Slower with many subscribers |

**Golden Rule**: Start with `Ref`. Upgrade to `SubscriptionRef` only when you need the `.changes` stream. The observability comes at a cost—use it deliberately! 🎯
