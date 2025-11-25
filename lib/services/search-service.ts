import { Effect, Context, Layer, Data } from "effect";
import type { SearchQueryItem, SearchResultItem } from "@/baml_client/types";
import { executeExaSearch } from "@/lib/utils/exaSearchUtil";
import { executeBnpSearch } from "@/lib/utils/bnpSearchUtil";

// Error types for the search service
export class SearchError extends Data.TaggedError("SearchError")<{
  message: string;
  cause?: unknown;
}> {}

export class SearchService extends Context.Tag("SearchService")<
  SearchService,
  {
    search: (
      queries: SearchQueryItem[],
      numResults?: number
    ) => Effect.Effect<SearchResultItem[], SearchError>;
  }
>() {}

export const SearchServiceLive = Layer.succeed(SearchService, {
  search: (queries: SearchQueryItem[], numResults = 5) =>
    Effect.gen(function* () {
      const allResults: SearchResultItem[] = [];

      // Execute searches for each query
      for (const query of queries) {
        try {
          // Try Exa search first
          const results = yield* Effect.tryPromise({
            try: () => executeExaSearch(query, numResults, true, 3),
            catch: (error) =>
              new SearchError({
                message: error instanceof Error ? error.message : String(error),
                cause: error,
              }),
          });

          allResults.push(...results);
        } catch (exaError) {
          // If Exa fails, try BNP as fallback
          console.warn(
            `Exa search failed for query "${query.query_string}", trying BNP...`
          );

          try {
            const bnpResults = yield* Effect.tryPromise({
              try: () => executeBnpSearch(query, numResults, 3),
              catch: (error) =>
                new SearchError({
                  message:
                    error instanceof Error ? error.message : String(error),
                  cause: error,
                }),
            });

            allResults.push(...bnpResults);
          } catch (bnpError) {
            // Both failed - log but continue with other queries
            console.error(
              `Both Exa and BNP search failed for query "${query.query_string}"`
            );
          }
        }
      }

      // Deduplicate results by URL
      const uniqueResults = new Map<string, SearchResultItem>();
      for (const result of allResults) {
        if (!uniqueResults.has(result.id)) {
          uniqueResults.set(result.id, result);
        }
      }

      return Array.from(uniqueResults.values());
    }),
});
