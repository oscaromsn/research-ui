import { Effect, Context, Layer, PubSub, Stream } from "effect";
import type { ResearchEvent } from "./events";

export class EventBus extends Context.Tag("EventBus")<
  EventBus,
  {
    publish: (event: ResearchEvent) => Effect.Effect<void>;
    subscribe: Stream.Stream<ResearchEvent>;
  }
>() {}

export const EventBusLive = Layer.effect(
  EventBus,
  Effect.gen(function* () {
    const pubsub = yield* PubSub.unbounded<ResearchEvent>();

    return {
      publish: (event) => PubSub.publish(pubsub, event),
      subscribe: Stream.fromPubSub(pubsub),
    };
  })
);
