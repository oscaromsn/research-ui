/**
 * Datajud Service Interface
 * Contract-driven service for searching judicial process metadata
 */

import {
  HttpBody,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Effect } from "effect";
import {
  inferTribunalAlias,
  isSupportedTribunalAlias,
  parseNumeroProcesso,
  type TribunalAlias,
} from "../../domain/numero-processo";
import { DATAJUD_BASE_URL, DATAJUD_PUBLIC_API_KEY } from "./config";
import {
  DatajudApiError,
  DatajudNetworkError,
  DatajudValidationError,
} from "./errors";
import type { DatajudSearchOptions } from "./query-types";
import { DatajudSearchResponse } from "./schema";

/**
 * Datajud Service - Interface for searching Brazilian judicial process metadata
 *
 * This service provides access to the Datajud public API for retrieving
 * process metadata from Brazilian courts.
 */
export class DatajudService extends Effect.Service<DatajudService>()(
  "app/DatajudService",
  {
    effect: Effect.gen(function* () {
      const httpClient = yield* HttpClient.HttpClient;

      return {
        /**
         * Search for judicial process metadata
         *
         * This method supports two input modes:
         * 1. **Process Number**: Automatically infers tribunal and normalizes number
         * 2. **Tribunal Alias**: Directly searches specified tribunal (requires custom query)
         *
         * @param input - Either:
         *   - Process number (string): "0722391-40.2017.8.07.0001" or "07223914020178070001"
         *     Automatically infers tribunal and defaults to searching for this process
         *   - Tribunal alias (TribunalAlias): TribunalAlias("tjsp"), TribunalAlias("trf1"), etc.
         *     Searches specified tribunal with custom query
         * @param options - Search configuration with type-safe Elasticsearch Query DSL
         * @returns Effect that succeeds with validated search response or fails with domain errors
         *
         * @example
         * // Mode 1: Simple search by process number
         * const result = yield* datajudService.searchProcessMetadata("00008323520184013202");
         *
         * @example
         * // Mode 1: Process number with custom query (for pagination/filtering)
         * const result = yield* datajudService.searchProcessMetadata("07223914020178070001", {
         *   query: {
         *     bool: {
         *       must: [
         *         { match: { "classe.codigo": 1116 } },
         *         { match: { "orgaoJulgador.codigo": 13597 } }
         *       ]
         *     }
         *   },
         *   size: 100
         * });
         *
         * @example
         * // Mode 2: Direct tribunal specification (clean API for searches without specific process)
         * const result = yield* datajudService.searchProcessMetadata(
         *   TribunalAlias("tjsp"),
         *   {
         *     query: {
         *       bool: {
         *         must: [{ match: { "orgaoJulgador.nome": "Praia Grande" } }],
         *         should: [
         *           { match: { "classe.nome": "usucapião" } },
         *           { match: { "assuntos.nome": "usucapião" } }
         *         ]
         *       }
         *     },
         *     size: 50
         *   }
         * );
         */
        searchProcessMetadata: (
          input: string | TribunalAlias,
          options?: DatajudSearchOptions
        ) =>
          Effect.gen(function* () {
            let tribunalAlias: TribunalAlias;
            let normalizedProcessNumber: string | undefined;

            // Check if input is a tribunal alias or process number
            if (isSupportedTribunalAlias(input)) {
              // Case 1: Tribunal alias provided directly
              tribunalAlias = input;
              normalizedProcessNumber = undefined; // No process number to normalize
            } else {
              // Case 2: Process number provided (existing behavior)
              // Parse the process number to extract components and validate format
              const components = yield* parseNumeroProcesso(input);

              // Get the unformatted (normalized) process number for DataJud API
              // DataJud stores process numbers without formatting (20 digits)
              normalizedProcessNumber = `${components.sequencial.toString().padStart(7, "0")}${components.dv.toString().padStart(2, "0")}${components.ano}${components.id_orgao}${components.id_tribunal.toString().padStart(2, "0")}${components.id_unidade_origem.toString().padStart(4, "0")}`;

              // Automatically infer the tribunal alias from the process number
              tribunalAlias = yield* inferTribunalAlias(input);
            }

            // Build the complete Elasticsearch request body
            // If custom query provided, use it
            // Otherwise, if process number available, default to match query on it
            // Otherwise (tribunal alias only), default to match_all (return sample processes)
            const requestBody = {
              query:
                options?.query ??
                (normalizedProcessNumber
                  ? { match: { numeroProcesso: normalizedProcessNumber } }
                  : { match_all: {} }),
              size: options?.size ?? 10,
              ...(options?.sort && { sort: options.sort }),
              ...(options?.search_after && {
                search_after: options.search_after,
              }),
            };

            const url = `${DATAJUD_BASE_URL}api_publica_${tribunalAlias}/_search`;

            // Make the HTTP request with proper headers and body
            const request = HttpClientRequest.post(url).pipe(
              HttpClientRequest.setHeader(
                "Authorization",
                `APIKey ${DATAJUD_PUBLIC_API_KEY}`
              ),
              HttpClientRequest.setHeader("Content-Type", "application/json"),
              HttpClientRequest.setBody(HttpBody.unsafeJson(requestBody))
            );

            // Execute request and handle response with proper error mapping
            return yield* httpClient.execute(request).pipe(
              Effect.flatMap(
                HttpClientResponse.schemaBodyJson(DatajudSearchResponse)
              ),
              Effect.scoped,
              Effect.catchTags({
                RequestError: (e) =>
                  Effect.fail(
                    new DatajudNetworkError({
                      message: `Network error while calling Datajud API: ${e.reason}`,
                      cause: e,
                    })
                  ),
                ResponseError: (e) =>
                  Effect.fail(
                    new DatajudApiError({
                      status: e.response.status,
                      statusText: `HTTP ${e.response.status}`,
                      details: e.reason,
                      tribunal: tribunalAlias,
                    })
                  ),
                ParseError: (e) =>
                  Effect.fail(
                    new DatajudValidationError({
                      message: `Response validation failed: ${e.message}`,
                      tribunal: tribunalAlias,
                    })
                  ),
              })
            );
          }),
      };
    }),
  }
) {}
