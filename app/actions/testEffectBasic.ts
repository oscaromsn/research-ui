// Ultra-minimal test - no streaming, just test if Effect runs
"use server";

import { Effect } from "effect";

export async function testEffectBasic(): Promise<string> {
  console.log("[testEffectBasic] Starting");

  try {
    const program = Effect.gen(function* () {
      console.log("[Effect] Inside generator");
      yield* Effect.succeed("Effect works!");
      console.log("[Effect] After succeed");
      return "Effect completed!";
    });

    console.log("[testEffectBasic] Running Effect.runPromise");
    const result = await Effect.runPromise(program);
    console.log("[testEffectBasic] Result:", result);

    return result;
  } catch (error) {
    console.error("[testEffectBasic] Error:", error);
    return `Error: ${error}`;
  }
}
