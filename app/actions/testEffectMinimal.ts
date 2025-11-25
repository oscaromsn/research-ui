// Minimal test for Effect-based action
// Tests just the Effect runtime without full workflow

"use server";

import { Effect, Layer } from "effect";
import { EventBus, EventBusLive } from "@/lib/core/event-bus";
import type { ResearchUpdate } from "./researchAgentOrchestrator";

/**
 * Minimal Effect-based test - just publishes one event
 */
export async function testEffectMinimal(
  testMessage: string
): Promise<ReadableStream<Uint8Array>> {
  console.log("[testEffectMinimal] Starting:", testMessage);

  const encoder = new TextEncoder();
  const transformStream = new TransformStream();
  const writer = transformStream.writable.getWriter();

  const sendUpdate = async (update: ResearchUpdate) => {
    try {
      const jsonString = JSON.stringify(update);
      await writer.write(encoder.encode(`${jsonString}\n`));
      console.log("[testEffectMinimal] Sent:", update.stage);
    } catch (e) {
      console.error("[testEffectMinimal] Write error:", e);
    }
  };

  // Send initial update
  await sendUpdate({
    type: "STATUS_CHANGE",
    stage: "INITIALIZING",
    message: "Starting minimal Effect test...",
  });

  // Run minimal Effect program
  (async () => {
    try {
      console.log("[testEffectMinimal] Creating Effect program");

      const program = Effect.gen(function* () {
        console.log("[Effect] Program started");
        const eventBus = yield* EventBus;
        console.log("[Effect] Got EventBus");

        // Just publish one event
        yield* eventBus.publish({
          type: "QueryGenerationStarted",
        });

        console.log("[Effect] Published event");
      });

      console.log("[testEffectMinimal] Running Effect program");
      await Effect.runPromise(program.pipe(Effect.provide(EventBusLive)));

      console.log("[testEffectMinimal] Effect program completed!");

      await sendUpdate({
        type: "DATA",
        stage: "COMPLETED",
        message: "Minimal test completed successfully!",
      });
    } catch (error) {
      console.error("[testEffectMinimal] Error:", error);
      await sendUpdate({
        type: "ERROR",
        stage: "ERROR",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      await writer.close();
    }
  })();

  return transformStream.readable;
}
