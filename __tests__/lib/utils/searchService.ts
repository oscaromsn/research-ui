import { Effect, Layer } from "effect";
import type { Precedent, PrecedentSearchFilter } from "@/connectors/bnp/schema";
import { BnpService, BnpServiceLive } from "@/connectors/bnp";
import type { SearchQueryItem, SearchResultItem } from "@/baml_client/types";

/**
 * Maps a BNP Precedent to the BAML SearchResultItem schema.
 */
function mapBnpPrecedentToSearchResultItem(
  precedent: Precedent,
  query: SearchQueryItem,
): SearchResultItem {
  return {
    id: precedent.id,
    // Construct a stable URL to view the precedent
    url: `https://pangeabnp.pdpj.jus.br/precedentes/${precedent.id}`,
    title: `${precedent.tipo} ${precedent.nr} (${precedent.orgao})`,
    source_name: "BNP (Banco Nacional de Precedentes)",
    snippet: precedent.tese_snippet || precedent.tese || precedent.questao,
    full_text: precedent.tese || precedent.questao,
    published_date: precedent.ultimaAtualizacao ?? null,
    retrieval_date: new Date().toISOString(),
    author: null, // BNP does not provide author information
    score: null, // BNP does not provide a relevance score
    original_query: query,
    metadata: {
      bnp_orgao: precedent.orgao,
      bnp_tipo: precedent.tipo,
      bnp_nr: String(precedent.nr),
      bnp_situacao: precedent.situacao,
    },
  };
}

/**
 * Defines the Effect program for searching precedents using the BnpService.
 * This program is composed of smaller Effects for searching and mapping results.
 */
const searchBnpEffect = (
  query: SearchQueryItem,
  filterOverrides?: Partial<PrecedentSearchFilter>,
) =>
  BnpService.pipe(
    Effect.flatMap((service) =>
      service.searchPrecedents({
        buscaGeral: query.query_string,
        ...filterOverrides,
      }),
    ),
    Effect.map((response) =>
      response.resultados.map((precedent) =>
        mapBnpPrecedentToSearchResultItem(precedent, query),
      ),
    ),
  );

// The live implementation layer for the BNP service.
const BnpLayer = BnpServiceLive;

/**
 * Executes a search using the BNP connector.
 * This async function is the bridge between the Effect-based service and the
 * promise-based orchestrator. It runs the Effect and handles its success or failure.
 *
 * @param query The search query from the BAML agent.
 * @param filterOverrides Optional overrides for the BNP search filter.
 * @returns A promise that resolves to an array of SearchResultItem.
 */
export async function executeBnpSearch(
  query: SearchQueryItem,
  filterOverrides?: Partial<PrecedentSearchFilter>,
): Promise<SearchResultItem[]> {
  const program = searchBnpEffect(query, filterOverrides);
  const runnable = Effect.provide(program, BnpLayer);

  try {
    // Effect.runPromise executes the Effect and returns a promise.
    // On success, it resolves with the value. On failure, it rejects with the error.
    const results = await Effect.runPromise(runnable);
    return results;
  } catch (error) {
    console.error("BNP Search Effect failed:", error);

    // The error caught here will be one of the tagged errors from `connectors/bnp/errors.ts`.
    // We can inspect it and re-throw a standard Error for the orchestrator's catch block.
    if (error instanceof Error && "_tag" in error) {
      const taggedError = error as { _tag: string; message?: string };
      throw new Error(
        `BNP Search Failed: [${taggedError._tag}] ${taggedError.message ?? "An error occurred"}`,
      );
    }
    // Re-throw any other unexpected errors.
    throw error;
  }
}