---
modified: 2025-10-26T14:42:40-03:00
---
# Stream + PubSub in Effect

## Primary Integration Pattern: `Stream.fromPubSub`

You can directly convert a `PubSub` into a `Stream`:

```typescript
import { Effect, PubSub, Stream } from "effect";

const program = Effect.scoped(
  Effect.gen(function* () {
    // Create a PubSub
    const pubsub = yield* PubSub.bounded<string>(10);
    
    // Convert to Stream - each subscriber gets their own stream
    const stream1 = Stream.fromPubSub(pubsub);
    const stream2 = Stream.fromPubSub(pubsub);
    
    // Publish some values
    yield* PubSub.publish(pubsub, "Hello");
    yield* PubSub.publish(pubsub, "World");
    
    // Both streams receive all messages
    yield* Stream.runForEach(stream1, (msg) => 
      Effect.log(`Stream 1: ${msg}`)
    ).pipe(Effect.fork);
    
    yield* Stream.runForEach(stream2, (msg) => 
      Effect.log(`Stream 2: ${msg}`)
    );
  })
);
```

## Key Characteristics

**PubSub Subscription Returns a Queue (Dequeue):**
- When you call `PubSub.subscribe`, you get a `Dequeue` (read-only Queue)
- Each subscriber gets their **own copy** of every published message
- Unlike a Queue where each message is consumed once, PubSub broadcasts to all subscribers

**Stream-Native Broadcasting:**
Effect Streams also have built-in broadcasting capabilities via `Stream.broadcast`:

```typescript
import { Effect, Stream, Console, Fiber } from "effect";

const program = Effect.scoped(
  Stream.range(1, 10).pipe(
    Stream.tap((n) => Console.log(`Emit ${n} before broadcasting`)),
    
    // Broadcast to 2 downstream consumers with max lag of 5
    Stream.broadcast(2, 5),
    
    Stream.flatMap(([stream1, stream2]) =>
      Effect.gen(function* () {
        // First consumer: calculate maximum
        const fiber1 = yield* Stream.runFold(stream1, 0, (acc, e) =>
          Math.max(acc, e)
        ).pipe(Effect.fork);

        // Second consumer: log with delay
        const fiber2 = yield* Stream.runForEach(stream2, (n) =>
          Console.log(`Consumer 2: ${n}`)
        ).pipe(Effect.fork);

        yield* Fiber.join(fiber1).pipe(
          Effect.zip(Fiber.join(fiber2), { concurrent: true })
        );
      })
    ),
    Stream.runCollect
  )
);
```

## Advanced Pattern: `SubscriptionRef` for Reactive State

For reactive state management with multiple observers, use `SubscriptionRef`:

```typescript
import { SubscriptionRef, Effect, Stream, Ref, Fiber } from "effect";

const program = Effect.gen(function* () {
  // Create a SubscriptionRef with initial value
  const ref = yield* SubscriptionRef.make(0);
  
  // Server: continuously updates the value
  const server = Ref.update(ref, (n) => n + 1).pipe(
    Effect.forever,
    Effect.fork
  );
  
  // Clients: subscribe to changes via the `changes` stream
  const client1 = Stream.runForEach(
    ref.changes,
    (value) => Effect.log(`Client 1 sees: ${value}`)
  ).pipe(Effect.fork);
  
  const client2 = Stream.runForEach(
    ref.changes,
    (value) => Effect.log(`Client 2 sees: ${value}`)
  ).pipe(Effect.fork);
  
  // Run for a bit, then cleanup
  yield* Effect.sleep("2 seconds");
  yield* Fiber.interrupt(yield* server);
  yield* Fiber.join(client1);
  yield* Fiber.join(client2);
});
```

## Use Case Guidelines

| Pattern | Use When |
|---------|----------|
| **`Stream.fromPubSub`** | You want multiple consumers to process the same messages independently |
| **`Stream.fromQueue`** | You want work distribution (each message consumed once) |
| **`Stream.broadcast`** | You're already working with streams and need fan-out |
| **`SubscriptionRef`** | You need reactive state with multiple observers (FRP patterns) |

## Production Pattern: Event Broadcasting

```typescript
import { Effect, PubSub, Stream, Layer } from "effect";

class EventBus extends Effect.Service<EventBus>()("app/EventBus", {
  scoped: Effect.gen(function* () {
    const pubsub = yield* PubSub.unbounded<DomainEvent>();
    
    return {
      publish: (event: DomainEvent) => PubSub.publish(pubsub, event),
      
      subscribe: (): Stream.Stream<DomainEvent> => 
        Stream.fromPubSub(pubsub),
      
      // Type-safe filtered subscriptions
      subscribeToType: <T extends DomainEvent["_tag"]>(tag: T) =>
        Stream.fromPubSub(pubsub).pipe(
          Stream.filter((e): e is Extract<DomainEvent, { _tag: T }> => 
            e._tag === tag
          )
        )
    };
  })
}) {}

// Usage in application
const program = Effect.gen(function* () {
  const bus = yield* EventBus;
  
  // Start multiple consumers
  const analytics = yield* bus.subscribeToType("UserSignedUp").pipe(
    Stream.runForEach((event) => logToAnalytics(event)),
    Effect.fork
  );
  
  const notifications = yield* bus.subscribeToType("OrderPlaced").pipe(
    Stream.runForEach((event) => sendNotification(event)),
    Effect.fork
  );
  
  // Publish events
  yield* bus.publish({ _tag: "UserSignedUp", userId: "123" });
});
```

The combination is powerful for **event-driven architectures**, **reactive systems**, and **real-time data processing** where multiple consumers need to react to the same events independently.
