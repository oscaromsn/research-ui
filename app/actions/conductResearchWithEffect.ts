// Effect-based research orchestrator
// New export using event-driven architecture

"use server";

import { Effect, Layer, Stream } from "effect";
import { EventBus, EventBusLive } from "@/lib/core/event-bus";
import { ResearchState, ResearchStateLive } from "@/lib/core/research-state";
import { SearchServiceLive } from "@/lib/services/search-service";
import { LLMService } from "@/lib/services/llm-service";
import { ResearchWorkflow } from "@/lib/workflows/research-workflow";
import { mapStateToUpdate } from "@/lib/utils/state-mapper";
import type { ResearchUpdate } from "./researchAgentOrchestrator";

// Create the main application layer with proper dependency order
// EventBus has no dependencies
// ResearchState depends on EventBus
// SearchService has no Effect dependencies
// LLMService depends on EventBus
// ResearchWorkflow depends on EventBus, ResearchState, SearchService, LLMService

const BaseLayer = Layer.mergeAll(EventBusLive, SearchServiceLive);

const StateAndServicesLayer = Layer.mergeAll(
  ResearchStateLive, // depends on EventBus
  LLMService.Default // depends on EventBus
).pipe(Layer.provide(BaseLayer));

const AppLayer = ResearchWorkflow.Default.pipe(
  Layer.provide(StateAndServicesLayer)
);

/**
 * Effect-based research conductor
 */
export async function conductResearchWithEffect(
  legalQuestion: string
): Promise<ReadableStream<Uint8Array>> {
  console.log(
    "[conductResearchWithEffect] Starting with question:",
    legalQuestion
  );

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const encoder = new TextEncoder();
  const transformStream = new TransformStream();
  const writer = transformStream.writable.getWriter();

  const sendUpdate = async (update: ResearchUpdate) => {
    try {
      const jsonString = JSON.stringify(update);
      await writer.write(encoder.encode(`${jsonString}\n`));
      console.log(
        "[conductResearchWithEffect] Sent update:",
        update.stage,
        update.type
      );
    } catch (e) {
      console.error("Stream write error:", e);
    }
  };

  // Send initial update immediately
  await sendUpdate({
    type: "STATUS_CHANGE",
    stage: "INITIALIZING",
    message: "Starting Effect-based research...",
  });

  // Run the Effect program in the background
  (async () => {
    try {
      console.log("[conductResearchWithEffect] Starting Effect program");

      const program = Effect.gen(function* () {
        console.log("[Effect] Program started");
        const eventBus = yield* EventBus;
        const researchState = yield* ResearchState;
        const researchWorkflow = yield* ResearchWorkflow;

        console.log("[Effect] Services obtained");

        // Subscribe to state changes and stream to client
        const streamFiber = yield* researchState.changes.pipe(
          Stream.runForEach((state) => {
            console.log("[Effect] State changed:", state.status);
            return Effect.promise(() => sendUpdate(mapStateToUpdate(state)));
          }),
          Effect.forkScoped // Use forkScoped like reference implementation
        );

        console.log("[Effect] State subscription started");

        // Start the workflows
        yield* researchWorkflow.start;

        console.log("[Effect] Workflows started");

        // Kick off the research process
        yield* eventBus.publish({
          type: "ResearchStarted",
          question: legalQuestion,
          sessionId,
        });

        console.log("[Effect] ResearchStarted event published");

        // Wait for completion or error
        yield* eventBus.subscribe.pipe(
          Stream.filter((event) => {
            console.log("[Effect] Received event:", event.type);
            return (
              event.type === "ReportCompleted" ||
              event.type === "ResearchFailed"
            );
          }),
          Stream.take(1),
          Stream.runDrain
        );

        console.log("[Effect] Research completed");
      });

      console.log("[conductResearchWithEffect] Running Effect program");
      // Use the same pattern as reference implementation: scoped AFTER provide
      await Effect.runPromise(
        program.pipe(
          Effect.provide(AppLayer),
          Effect.scoped // Key: scoped after provide, not wrapping program
        )
      );
      console.log("[conductResearchWithEffect] Effect program completed");
    } catch (error) {
      console.error("[conductResearchWithEffect] Error:", error);
      await sendUpdate({
        type: "ERROR",
        stage: "ERROR",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      try {
        await writer.close();
      } catch (e) {
        console.error("Error closing stream:", e);
      }
    }
  })();

  return transformStream.readable;
}
