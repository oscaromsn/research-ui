/**
 * Shared Effect Layer for Application Services
 *
 * This module defines and exports a single, shared layer that composes all
 * the application's services. This layer is then provided to Effect programs
 * at the edge of the application (e.g., in server actions) to ensure
 * dependencies are correctly injected.
 *
 * This approach avoids creating a global singleton runtime, which can be
 * problematic in environments like Next.js server actions due to module
 * caching and bundling behavior.
 *
 * Usage:
 * ```typescript
 * import { AppLayer } from "@/lib/utils/effectRuntime";
 * import { Effect } from "effect";
 *
 * const program = Effect.gen(function* () {
 *   const bnpService = yield* BnpService;
 *   return yield* bnpService.searchPrecedents(filter);
 * });
 *
 * const result = await Effect.runPromise(program.pipe(Effect.provide(AppLayer)));
 * ```
 */

import { BnpServiceLive } from "@/connectors/bnp";

/**
 * Composed layer containing all application Effect services.
 *
 * Currently includes:
 * - BnpServiceLive: Service for searching Brazilian legal precedents
 *
 * Future services can be added here by merging layers:
 * ```typescript
 * export const AppLayer = Layer.merge(BnpServiceLive, OtherServiceLive);
 * ```
 */
export const AppLayer = BnpServiceLive;
