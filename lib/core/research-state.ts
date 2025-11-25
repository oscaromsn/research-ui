import { Effect, Context, Layer, SubscriptionRef, Stream } from "effect";
import {
  type ResearchStateModel,
  initialState,
  researchReducer,
} from "./research-reducer";
import { EventBus } from "./event-bus";

export class ResearchState extends Context.Tag("ResearchState")<
  ResearchState,
  {
    get: Effect.Effect<ResearchStateModel>;
    changes: Stream.Stream<ResearchStateModel>;
  }
>() {}

export const ResearchStateLive = Layer.effect(
  ResearchState,
  Effect.gen(function* () {
    const eventBus = yield* EventBus;
    const ref = yield* SubscriptionRef.make(initialState);

    // Subscribe to events and update state
    yield* eventBus.subscribe.pipe(
      Stream.runForEach((event) =>
        SubscriptionRef.update(ref, (state) => researchReducer(state, event))
      ),
      Effect.fork // Run in background
    );

    return {
      get: SubscriptionRef.get(ref),
      changes: ref.changes,
    };
  })
);
