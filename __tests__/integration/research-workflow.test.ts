/**
 * Integration test for event-driven research workflow
 * Following patterns from reference implementation
 */

import { describe, it, expect } from "bun:test";
import { Effect, Stream, Fiber, Chunk, Layer } from "effect";
import { EventBus, EventBusLive } from "@/lib/core/event-bus";
import { ResearchState, ResearchStateLive } from "@/lib/core/research-state";
import type { ResearchEvent } from "@/lib/core/events";

// Test layer that provides minimal dependencies for testing
const testLayer = Layer.mergeAll(EventBusLive, ResearchStateLive);

describe("EventBus Integration", () => {
  it("should publish and subscribe to research events", async () => {
    const program = Effect.gen(function* () {
      const eventBus = yield* EventBus;

      // Subscribe to all events
      const allEvents = eventBus.subscribe;

      // Start collecting events
      const collectFiber = yield* Stream.runCollect(
        Stream.take(allEvents, 2)
      ).pipe(Effect.fork);

      // Publish events
      yield* eventBus.publish({
        type: "ResearchStarted",
        question: "Test question",
        sessionId: "test-session",
      });

      yield* eventBus.publish({
        type: "QueryGenerationStarted",
      });

      // Wait for collection
      const eventsChunk = yield* Fiber.join(collectFiber);
      const events = Chunk.toReadonlyArray(eventsChunk);

      // Verify
      expect(events.length).toBe(2);
      expect(events[0]?.type).toBe("ResearchStarted");
      expect(events[1]?.type).toBe("QueryGenerationStarted");
    });

    await Effect.runPromise(
      program.pipe(Effect.provide(testLayer), Effect.scoped)
    );
  });

  it("should update state via reducer when events are published", async () => {
    const program = Effect.gen(function* () {
      const eventBus = yield* EventBus;
      const researchState = yield* ResearchState;

      // Publish research started event
      yield* eventBus.publish({
        type: "ResearchStarted",
        question: "What is the law on contracts?",
        sessionId: "session-123",
      });

      // Give the reducer time to process
      yield* Effect.sleep("100 millis");

      // Check state was updated
      const state = yield* researchState.get;
      expect(state.question).toBe("What is the law on contracts?");
      expect(state.sessionId).toBe("session-123");
      expect(state.status).toBe("initializing");
    });

    await Effect.runPromise(
      program.pipe(Effect.provide(testLayer), Effect.scoped)
    );
  });

  it("should stream state changes", async () => {
    const program = Effect.gen(function* () {
      const eventBus = yield* EventBus;
      const researchState = yield* ResearchState;

      // Subscribe to state changes
      const stateChanges = researchState.changes;
      const collectFiber = yield* Stream.runCollect(
        Stream.take(stateChanges, 3)
      ).pipe(Effect.fork);

      // Publish a sequence of events
      yield* eventBus.publish({
        type: "ResearchStarted",
        question: "Test",
        sessionId: "test",
      });

      yield* eventBus.publish({
        type: "QueryGenerationStarted",
      });

      yield* eventBus.publish({
        type: "QueriesGenerated",
        queries: [],
      });

      // Collect states
      const statesChunk = yield* Fiber.join(collectFiber);
      const states = Chunk.toReadonlyArray(statesChunk);

      // Verify state progression
      expect(states.length).toBe(3);
      expect(states[0]?.status).toBe("initializing");
      expect(states[1]?.status).toBe("generating_queries");
      expect(states[2]?.status).toBe("generating_queries");
    });

    await Effect.runPromise(
      program.pipe(Effect.provide(testLayer), Effect.scoped)
    );
  });
});
