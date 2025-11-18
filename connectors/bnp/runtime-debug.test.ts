/**
 * Runtime Debug Test
 *
 * This test reproduces the runtime environment as closely as possible
 * to debug the "Failed to generate cache key" issue.
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { AppLayer } from "@/lib/utils/effectRuntime";
import { BnpService } from "./service";
import { BnpServiceLive } from "./service.impl";

describe("BNP Runtime Environment Debug", () => {
  it("should execute search by providing AppLayer (simulating production)", async () => {
    console.log("[DEBUG] Starting runtime simulation test");

    const filter = {
      buscaGeral: "adicional de periculosidade",
      tipos: ["IRR"],
      orgaos: ["TST"],
      pagina: 1,
    };

    const program = Effect.gen(function* () {
      console.log("[DEBUG] Getting BnpService from Effect context");
      const bnpService = yield* BnpService;

      console.log("[DEBUG] Calling searchPrecedents");
      const response = yield* bnpService.searchPrecedents(filter);

      console.log("[DEBUG] Search completed successfully");
      return response;
    });

    try {
      console.log("[DEBUG] Running program with AppLayer");
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(AppLayer))
      );

      console.log("[DEBUG] Result received:", {
        total: result.total,
        resultsCount: result.resultados.length,
      });

      expect(result).toBeDefined();
    } catch (error) {
      console.error("[DEBUG] Error occurred:", {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  it("should execute search using BnpServiceLive directly", async () => {
    console.log("[DEBUG] Testing with BnpServiceLive directly");

    const filter = {
      buscaGeral: "adicional de periculosidade",
      tipos: ["IRR"],
      orgaos: ["TST"],
      pagina: 1,
    };

    const program = Effect.gen(function* () {
      console.log("[DEBUG] Getting BnpService");
      const bnpService = yield* BnpService;

      console.log("[DEBUG] Executing search");
      const response = yield* bnpService.searchPrecedents(filter);

      return response;
    }).pipe(Effect.provide(BnpServiceLive));

    try {
      console.log("[DEBUG] Running program");
      const result = await Effect.runPromise(program);

      console.log("[DEBUG] Search succeeded:", {
        total: result.total,
        resultsCount: result.resultados.length,
      });

      expect(result).toBeDefined();
    } catch (error) {
      console.error("[DEBUG] Search failed:", {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  });
});
