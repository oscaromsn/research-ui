/**
 * Falcao Service Interface
 * Contract-driven service for searching Brazilian labor jurisprudence
 */

import { createHash } from "node:crypto";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Effect, Schema } from "effect";
import { FALCAO_API_TOKEN_SECRET, FALCAO_BASE_URL } from "./config";
import {
  FalcaoApiError,
  FalcaoNetworkError,
  FalcaoValidationError,
} from "./errors";
import type {
  FalcaoAutocompleteResponse,
  FalcaoCountResponse,
  FalcaoDataUpdateResponse,
  FalcaoDocument,
  FalcaoSearchFilter,
  FalcaoTribunal,
  FalcaoVersionInfo,
} from "./schema";
import {
  FalcaoAutocompleteResponse as FalcaoAutocompleteResponseSchema,
  FalcaoCountResponse as FalcaoCountResponseSchema,
  FalcaoDataUpdateResponse as FalcaoDataUpdateResponseSchema,
  FalcaoDocument as FalcaoDocumentSchema,
  FalcaoSearchResponse as FalcaoSearchResponseSchema,
  FalcaoTribunal as FalcaoTribunalSchema,
  FalcaoVersionInfo as FalcaoVersionInfoSchema,
} from "./schema";

/**
 * Falcao Service - Interface for searching Brazilian labor jurisprudence
 *
 * This service provides access to the Falcao (Jurisprudência Trabalhista Nacional) API
 * for retrieving judicial decisions from Brazilian labor courts.
 */
export class FalcaoService extends Effect.Service<FalcaoService>()(
  "app/FalcaoService",
  {
    effect: Effect.gen(function* () {
      const baseClient = yield* HttpClient.HttpClient;

      const sessionId = `_${Math.random().toString(36).substring(2, 11)}`;
      const juristkn = createHash("md5")
        .update(sessionId + FALCAO_API_TOKEN_SECRET)
        .digest("hex")
        .substring(3, 17);

      const sessionParams = { sessionId, juristkn };

      const client = baseClient.pipe(
        HttpClient.mapRequest(HttpClientRequest.prependUrl(FALCAO_BASE_URL)),
        HttpClient.mapRequest(
          HttpClientRequest.setHeaders({
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Referer:
              "https://jurisprudencia.jt.jus.br/jurisprudencia-nacional/home",
          })
        )
      );

      return {
        /**
         * Search for labor jurisprudence documents
         *
         * @param filter - Search filter parameters
         * @returns Effect that succeeds with validated search response or fails with domain errors
         *
         * @example
         * ```typescript
         * const results = yield* falcao.search({
         *   texto: "gerente bancario",
         *   colecao: "acordaos",
         *   size: 10,
         *   page: 0
         * });
         * ```
         */
        search: (filter: FalcaoSearchFilter) =>
          Effect.gen(function* () {
            const validatedFilter = {
              ...sessionParams,
              ...(filter.texto && { texto: filter.texto }),
              colecao: filter.colecao ?? "acordaos",
              size: String(filter.size ?? 10),
              page: String(filter.page ?? 0),
              ...(filter.tribunais && { tribunais: filter.tribunais }),
              ...(filter.nomeRelator && { nomeRelator: filter.nomeRelator }),
              ...(filter.orgaoJulgador && {
                orgaoJulgador: filter.orgaoJulgador,
              }),
              ...(filter.classeProcesso && {
                classeProcesso: filter.classeProcesso,
              }),
              ...(filter.dataInicio && { dataInicio: filter.dataInicio }),
              ...(filter.dataFim && { dataFim: filter.dataFim }),
              ...(filter.numeroProcesso && {
                numeroProcesso: filter.numeroProcesso,
              }),
              ...(filter.precedente && { precedente: filter.precedente }),
              ...(filter.temEmenta && { temEmenta: filter.temEmenta }),
              ...(filter.pesquisaSomenteNasEmentas !== undefined && {
                pesquisaSomenteNasEmentas: String(
                  filter.pesquisaSomenteNasEmentas
                ),
              }),
            };

            const request = HttpClientRequest.get("/no-auth/pesquisa").pipe(
              HttpClientRequest.setUrlParams(validatedFilter)
            );

            return yield* client.execute(request).pipe(
              Effect.flatMap(
                HttpClientResponse.schemaBodyJson(FalcaoSearchResponseSchema)
              ),
              Effect.scoped,
              Effect.catchTags({
                RequestError: (e) =>
                  Effect.fail(
                    new FalcaoNetworkError({
                      message: `Network error while calling Falcao API: ${e.reason}`,
                      cause: e,
                    })
                  ),
                ResponseError: (e) =>
                  Effect.fail(
                    new FalcaoApiError({
                      status: e.response.status,
                      statusText: `HTTP ${e.response.status}`,
                      details: e.reason,
                    })
                  ),
                ParseError: (e) =>
                  Effect.fail(
                    new FalcaoValidationError({
                      message: `Response validation failed: ${e.message}`,
                    })
                  ),
              })
            );
          }),

        /**
         * Get list of all available tribunals
         *
         * @returns Effect that succeeds with array of tribunals or fails with domain errors
         */
        getTribunals: (): Effect.Effect<
          ReadonlyArray<FalcaoTribunal>,
          FalcaoApiError | FalcaoNetworkError | FalcaoValidationError
        > =>
          Effect.gen(function* () {
            const request = HttpClientRequest.get(
              "/no-auth/informacao/tribunais"
            );

            return yield* client.execute(request).pipe(
              Effect.flatMap(
                HttpClientResponse.schemaBodyJson(
                  Schema.Array(FalcaoTribunalSchema)
                )
              ),
              Effect.scoped,
              Effect.catchTags({
                RequestError: (e) =>
                  Effect.fail(
                    new FalcaoNetworkError({
                      message: `Network error while calling Falcao API: ${e.reason}`,
                      cause: e,
                    })
                  ),
                ResponseError: (e) =>
                  Effect.fail(
                    new FalcaoApiError({
                      status: e.response.status,
                      statusText: `HTTP ${e.response.status}`,
                      details: e.reason,
                    })
                  ),
                ParseError: (e) =>
                  Effect.fail(
                    new FalcaoValidationError({
                      message: `Response validation failed: ${e.message}`,
                    })
                  ),
              })
            );
          }),

        /**
         * Get full document details by tribunal and document ID
         *
         * @param tribunal - Tribunal code (e.g., "TST", "TRT9")
         * @param documentId - Document identifier
         * @returns Effect that succeeds with document details or fails with domain errors
         */
        getDocument: (
          tribunal: string,
          documentId: string
        ): Effect.Effect<
          FalcaoDocument,
          FalcaoApiError | FalcaoNetworkError | FalcaoValidationError
        > =>
          Effect.gen(function* () {
            const request = HttpClientRequest.get(
              `/no-auth/pesquisa/acordaos/${tribunal}/${documentId}`
            );

            return yield* client.execute(request).pipe(
              Effect.flatMap(
                HttpClientResponse.schemaBodyJson(FalcaoDocumentSchema)
              ),
              Effect.scoped,
              Effect.catchTags({
                RequestError: (e) =>
                  Effect.fail(
                    new FalcaoNetworkError({
                      message: `Network error while calling Falcao API: ${e.reason}`,
                      cause: e,
                    })
                  ),
                ResponseError: (e) =>
                  Effect.fail(
                    new FalcaoApiError({
                      status: e.response.status,
                      statusText: `HTTP ${e.response.status}`,
                      details: e.reason,
                    })
                  ),
                ParseError: (e) =>
                  Effect.fail(
                    new FalcaoValidationError({
                      message: `Response validation failed: ${e.message}`,
                    })
                  ),
              })
            );
          }),

        /**
         * Get the count of documents matching search criteria
         *
         * @param filter - Search filter parameters
         * @returns Effect that succeeds with document count or fails with domain errors
         */
        searchCount: (
          filter: FalcaoSearchFilter
        ): Effect.Effect<
          FalcaoCountResponse,
          FalcaoApiError | FalcaoNetworkError | FalcaoValidationError
        > =>
          Effect.gen(function* () {
            const validatedFilter = {
              ...sessionParams,
              ...filter,
              ...(filter.dataInicio && {
                dataInicio: filter.dataInicio,
              }),
              ...(filter.dataFim && {
                dataFim: filter.dataFim,
              }),
            };

            const request = HttpClientRequest.get(
              "/no-auth/pesquisa/count"
            ).pipe(HttpClientRequest.setUrlParams(validatedFilter));

            return yield* client.execute(request).pipe(
              Effect.flatMap(
                HttpClientResponse.schemaBodyJson(FalcaoCountResponseSchema)
              ),
              Effect.scoped,
              Effect.catchTags({
                RequestError: (e) =>
                  Effect.fail(
                    new FalcaoNetworkError({
                      message: `Network error while calling Falcao API: ${e.reason}`,
                      cause: e,
                    })
                  ),
                ResponseError: (e) =>
                  Effect.fail(
                    new FalcaoApiError({
                      status: e.response.status,
                      statusText: `HTTP ${e.response.status}`,
                      details: e.reason,
                    })
                  ),
                ParseError: (e) =>
                  Effect.fail(
                    new FalcaoValidationError({
                      message: `Response validation failed: ${e.message}`,
                    })
                  ),
              })
            );
          }),

        /**
         * Get available document types for search
         */
        autocomplete: (
          texto: string
        ): Effect.Effect<
          FalcaoAutocompleteResponse,
          FalcaoApiError | FalcaoNetworkError | FalcaoValidationError
        > =>
          Effect.gen(function* () {
            const request = HttpClientRequest.get(
              "/no-auth/autocompletar"
            ).pipe(HttpClientRequest.setUrlParams({ texto }));

            return yield* client.execute(request).pipe(
              Effect.flatMap(
                HttpClientResponse.schemaBodyJson(
                  FalcaoAutocompleteResponseSchema
                )
              ),
              Effect.scoped,
              Effect.catchTags({
                RequestError: (e) =>
                  Effect.fail(
                    new FalcaoNetworkError({
                      message: `Network error while calling Falcao API: ${e.reason}`,
                      cause: e,
                    })
                  ),
                ResponseError: (e) =>
                  Effect.fail(
                    new FalcaoApiError({
                      status: e.response.status,
                      statusText: `HTTP ${e.response.status}`,
                      details: e.reason,
                    })
                  ),
                ParseError: (e) =>
                  Effect.fail(
                    new FalcaoValidationError({
                      message: `Response validation failed: ${e.message}`,
                    })
                  ),
              })
            );
          }),

        /**
         * Get system version information
         *
         * @returns Effect that succeeds with version info or fails with domain errors
         */
        getVersionInfo: (): Effect.Effect<
          FalcaoVersionInfo,
          FalcaoApiError | FalcaoNetworkError | FalcaoValidationError
        > =>
          Effect.gen(function* () {
            const request = HttpClientRequest.get("/no-auth/informacao/versao");

            return yield* client.execute(request).pipe(
              Effect.flatMap(
                HttpClientResponse.schemaBodyJson(FalcaoVersionInfoSchema)
              ),
              Effect.scoped,
              Effect.catchTags({
                RequestError: (e) =>
                  Effect.fail(
                    new FalcaoNetworkError({
                      message: `Network error while calling Falcao API: ${e.reason}`,
                      cause: e,
                    })
                  ),
                ResponseError: (e) =>
                  Effect.fail(
                    new FalcaoApiError({
                      status: e.response.status,
                      statusText: `HTTP ${e.response.status}`,
                      details: e.reason,
                    })
                  ),
                ParseError: (e) =>
                  Effect.fail(
                    new FalcaoValidationError({
                      message: `Response validation failed: ${e.message}`,
                    })
                  ),
              })
            );
          }),

        /**
         * Get data indexing dates for tribunals
         *
         * @returns Effect that succeeds with data update response or fails with domain errors
         */
        getDataIndexingDates: (): Effect.Effect<
          FalcaoDataUpdateResponse,
          FalcaoApiError | FalcaoNetworkError | FalcaoValidationError
        > =>
          Effect.gen(function* () {
            const request = HttpClientRequest.get(
              "/no-auth/informacao/dataIndexacaoDados"
            );

            return yield* client.execute(request).pipe(
              Effect.flatMap(
                HttpClientResponse.schemaBodyJson(
                  FalcaoDataUpdateResponseSchema
                )
              ),
              Effect.scoped,
              Effect.catchTags({
                RequestError: (e) =>
                  Effect.fail(
                    new FalcaoNetworkError({
                      message: `Network error while calling Falcao API: ${e.reason}`,
                      cause: e,
                    })
                  ),
                ResponseError: (e) =>
                  Effect.fail(
                    new FalcaoApiError({
                      status: e.response.status,
                      statusText: `HTTP ${e.response.status}`,
                      details: e.reason,
                    })
                  ),
                ParseError: (e) =>
                  Effect.fail(
                    new FalcaoValidationError({
                      message: `Response validation failed: ${e.message}`,
                    })
                  ),
              })
            );
          }),
      };
    }),
  }
) {}
