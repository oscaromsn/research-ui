/**
 * BNP Search Adapter
 *
 * Main adapter for BNP (Banco Nacional de Precedentes) search functionality.
 * This module provides the primary interface for the research orchestrator to search
 * Brazilian legal precedents, maintaining compatibility with the existing Exa-based
 * architecture.
 *
 * Architecture:
 * - Uses the shared Effect runtime for BNP service execution
 * - Translates BAML SearchQueryItem to BNP PrecedentSearchFilter
 * - Maps BNP Precedent results to BAML SearchResultItem schema
 * - Translates BNP errors to Exa-compatible errors for orchestrator handling
 * - Reuses existing retry logic and error recovery system
 *
 * Integration Points:
 * - Called by: app/actions/researchAgentOrchestrator.ts
 * - Returns: SearchResultItem[] (BAML schema)
 * - Errors: Exa-compatible error classes (for existing error handling)
 */

import { Effect } from "effect";
import type { SearchQueryItem, SearchResultItem } from "@/baml_client/types";
import { BnpService } from "@/connectors/bnp";
import { mapBnpErrorToExaError } from "./bnpErrorMapper";
import { translateQueryToBnpFilter } from "./bnpQueryTranslator";
import { mapPrecedentsToSearchResults } from "./bnpResultMapper";
import { AppLayer } from "./effectRuntime";
import { executeWithRetry, shouldAbortResearch } from "./exaErrorHandler";

/**
 * Executes a BNP search with automatic retry logic
 *
 * This is the main entry point for BNP searches from the orchestrator.
 * It maintains the same interface as the old `executeExaSearch` function
 * to ensure seamless integration.
 *
 * @param bamlSearchQuery - The BAML SearchQueryItem from GenerateLegalSearchQueries
 * @param numResults - Maximum number of results to return
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Array of SearchResultItems conforming to BAML schema
 * @throws Exa-compatible errors for orchestrator error handling
 *
 * @example
 * ```typescript
 * const query: SearchQueryItem = {
 *   query_string: "recurso especial contrato de trabalho rescisão",
 *   expected_information: ["jurisprudência STJ", "teses vinculantes"]
 * };
 *
 * const results = await executeBnpSearch(query, 10, 3);
 * // Returns up to 10 SearchResultItems from BNP precedents database
 * ```
 */
export async function executeBnpSearch(
  bamlSearchQuery: SearchQueryItem,
  numResults = 10,
  maxRetries = 3
): Promise<SearchResultItem[]> {
  return await executeWithRetry(
    async () => {
      return await executeBnpSearchDirect(bamlSearchQuery, numResults);
    },
    {
      maxRetries,
      maxDelay: 30000, // 30 seconds max delay
      backoffMultiplier: 2,
    }
  );
}

/**
 * Direct BNP search execution without retry wrapper
 *
 * This function performs the actual search operation:
 * 1. Translates BAML query → BNP filter
 * 2. Executes search using Effect runtime
 * 3. Maps BNP precedents → BAML SearchResultItems
 * 4. Handles errors and maps to Exa-compatible errors
 *
 * @internal - Used by executeBnpSearch, not called directly
 */
async function executeBnpSearchDirect(
  bamlSearchQuery: SearchQueryItem,
  numResults: number
): Promise<SearchResultItem[]> {
  const queryString = bamlSearchQuery.query_string;

  // Step 1: Translate BAML query to BNP filter
  const filter = translateQueryToBnpFilter(bamlSearchQuery, numResults);

  console.log(
    `[BNP Search] Searching for "${queryString}" (max ${numResults} results)`
  );

  // Step 2: Execute BNP search using Effect
  const program = Effect.gen(function* () {
    const bnpService = yield* BnpService;
    const response = yield* bnpService.searchPrecedents(filter);

    // Step 3: Map BNP precedents to SearchResultItems
    const searchResults = mapPrecedentsToSearchResults(
      response.resultados,
      bamlSearchQuery,
      numResults
    );

    console.log(
      `[BNP Search] Found ${response.total} total precedents, returning ${searchResults.length} results`
    );

    return { searchResults, totalFound: response.total };
  });

  // Step 4: Provide the AppLayer and execute the Effect program
  try {
    const runnable = program.pipe(Effect.provide(AppLayer));
    const { searchResults, totalFound } = await Effect.runPromise(runnable);

    console.log(
      `[BNP Search] Successfully retrieved ${searchResults.length} precedents for query "${queryString}" (${totalFound} total available)`
    );

    return searchResults;
  } catch (error) {
    // Log the raw error for debugging
    console.error("[BNP Search] Raw error:", {
      error,
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    // Step 5: Map BNP errors to Exa-compatible errors
    const exaCompatibleError = mapBnpErrorToExaError(error, queryString);

    // Step 6: Check if error should abort research
    if (shouldAbortResearch(exaCompatibleError)) {
      console.error(
        `[BNP Search] Critical error - aborting research: ${exaCompatibleError.message}`
      );
    } else {
      console.warn(
        `[BNP Search] Recoverable error for query "${queryString}": ${exaCompatibleError.message}`
      );
    }

    throw exaCompatibleError;
  }
}

/**
 * Batch search multiple queries concurrently
 *
 * Useful for executing multiple BNP searches in parallel with controlled concurrency.
 * This maintains the same pattern as the old Exa implementation.
 *
 * @param queries - Array of BAML SearchQueryItems
 * @param numResultsPerQuery - Maximum results per query
 * @param maxRetries - Maximum retry attempts per query
 * @param maxConcurrent - Maximum concurrent searches (default: 3)
 * @returns Map of query strings to their search results
 *
 * @example
 * ```typescript
 * const queries: SearchQueryItem[] = [
 *   { query_string: "contrato trabalho", expected_information: [...] },
 *   { query_string: "rescisão indireta", expected_information: [...] }
 * ];
 *
 * const results = await executeBatchBnpSearch(queries, 10, 3);
 * // Results: Map<string, SearchResultItem[]>
 * ```
 */
export async function executeBatchBnpSearch(
  queries: SearchQueryItem[],
  numResultsPerQuery = 10,
  maxRetries = 3,
  maxConcurrent = 3
): Promise<Map<string, SearchResultItem[]>> {
  const results = new Map<string, SearchResultItem[]>();
  const errors = new Map<string, Error>();

  // Process queries in batches to control concurrency
  for (let i = 0; i < queries.length; i += maxConcurrent) {
    const batch = queries.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (query) => {
      try {
        const searchResults = await executeBnpSearch(
          query,
          numResultsPerQuery,
          maxRetries
        );
        results.set(query.query_string, searchResults);
      } catch (error) {
        // Store error but don't fail entire batch
        errors.set(
          query.query_string,
          error instanceof Error ? error : new Error(String(error))
        );
        console.error(
          `[BNP Batch Search] Failed to search "${query.query_string}":`,
          error
        );
      }
    });

    await Promise.all(batchPromises);
  }

  // Log summary
  console.log(
    `[BNP Batch Search] Completed ${queries.length} queries: ${results.size} successful, ${errors.size} failed`
  );

  if (errors.size > 0) {
    console.warn(
      "[BNP Batch Search] Failed queries:",
      Array.from(errors.keys())
    );
  }

  return results;
}

/**
 * Health check for BNP service
 *
 * Performs a simple search to verify BNP service is accessible.
 * Useful for startup checks and monitoring.
 *
 * @returns true if BNP service is healthy, false otherwise
 */
export async function checkBnpServiceHealth(): Promise<boolean> {
  try {
    const testQuery: SearchQueryItem = {
      query_string: "test",
      expected_information: [],
    };

    await executeBnpSearchDirect(testQuery, 1);
    return true;
  } catch (error) {
    console.error("[BNP Health Check] Service unhealthy:", error);
    return false;
  }
}
