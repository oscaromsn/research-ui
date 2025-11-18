/**
 * BNP Result Mapper
 *
 * Maps BNP API Precedent objects to BAML SearchResultItem schema.
 *
 * Key Mappings:
 * - Precedent.id → SearchResultItem.id
 * - Precedent.questao → SearchResultItem.snippet (concise legal question)
 * - Precedent.tese → SearchResultItem.full_text (detailed legal reasoning)
 * - Precedent.orgao → SearchResultItem.author (court/institution)
 * - Precedent.processosParadigma → URL construction (if available)
 *
 * Note: BNP does not provide relevance scores, so score is always null
 */

import type { SearchQueryItem, SearchResultItem } from "@/baml_client/types";
import type { Precedent } from "@/connectors/bnp";

/**
 * URL construction priority:
 * 1. Direct link from first processo paradigma (if available)
 * 2. Fallback to BNP precedent detail page
 */
function constructPrecedentUrl(precedent: Precedent): string {
  // Prioritize direct link if available
  if (
    precedent.processosParadigma &&
    precedent.processosParadigma.length > 0 &&
    precedent.processosParadigma[0]?.link
  ) {
    return precedent.processosParadigma[0].link;
  }

  // Fallback to BNP precedent detail page
  return `https://pangeabnp.pdpj.jus.br/pesquisa/precedente/${precedent.id}`;
}

/**
 * Creates a human-readable title for the precedent
 * Format: "{Type} {Number} - {Court/Institution}"
 */
function formatPrecedentTitle(precedent: Precedent): string {
  return `${precedent.tipo} ${precedent.nr} - ${precedent.orgao}`;
}

/**
 * Builds metadata object preserving all BNP-specific information
 * This allows future analysis and debugging
 */
function buildPrecedentMetadata(precedent: Precedent): Record<string, string> {
  const metadata: Record<string, string> = {
    bnp_id: precedent.id,
    bnp_tipo: precedent.tipo,
    bnp_nr: precedent.nr.toString(),
    bnp_orgao: precedent.orgao,
    bnp_situacao: precedent.situacao,
  };

  // Add optional fields if present
  if (precedent.tese_snippet) {
    metadata.snippet_highlighted = precedent.tese_snippet;
  }

  if (precedent.processosParadigma && precedent.processosParadigma.length > 0) {
    metadata.processos_paradigma = JSON.stringify(precedent.processosParadigma);
  }

  if (precedent.suspensoes && precedent.suspensoes.length > 0) {
    metadata.suspensoes = JSON.stringify(precedent.suspensoes);
  }

  if (precedent.possuiDecisoes !== undefined) {
    metadata.possui_decisoes = precedent.possuiDecisoes.toString();
  }

  if (precedent.highlight) {
    metadata.highlight = JSON.stringify(precedent.highlight);
  }

  return metadata;
}

/**
 * Maps a BNP Precedent to a BAML SearchResultItem
 *
 * @param precedent - The BNP precedent from search results
 * @param originalQuery - The BAML SearchQueryItem that generated this result
 * @param sequenceNumber - Position in the result set (for debugging/tracking)
 * @returns A SearchResultItem conforming to the BAML schema
 *
 * @example
 * ```typescript
 * const precedent: Precedent = {
 *   id: "12345",
 *   orgao: "STJ",
 *   tipo: "REsp",
 *   nr: 1234567,
 *   questao: "Aplicação do CDC em contratos bancários",
 *   tese: "O CDC aplica-se às instituições financeiras...",
 *   situacao: "Ativo",
 *   // ...
 * };
 *
 * const result = mapPrecedentToSearchResult(precedent, bamlQuery, 0);
 * ```
 */
export function mapPrecedentToSearchResult(
  precedent: Precedent,
  originalQuery: SearchQueryItem,
  _sequenceNumber: number
): SearchResultItem {
  const url = constructPrecedentUrl(precedent);

  return {
    id: precedent.id,
    url,
    title: formatPrecedentTitle(precedent),
    source_name: "BNP - Banco Nacional de Precedentes",
    // Prioritize tese_snippet (highlighted excerpt) over full questao
    snippet: precedent.tese_snippet || precedent.questao,
    // Tese is the full legal reasoning; fallback to questao if not available
    full_text: precedent.tese || precedent.questao,
    published_date: precedent.ultimaAtualizacao || null,
    retrieval_date: new Date().toISOString(),
    author: precedent.orgao,
    // BNP does not provide relevance scores
    score: null,
    original_query: originalQuery,
    metadata: buildPrecedentMetadata(precedent),
  };
}

/**
 * Batch maps multiple precedents to SearchResultItems
 * Useful when processing BnpSearchResponse.resultados
 *
 * @param precedents - Array of BNP precedents (can be readonly)
 * @param originalQuery - The BAML query that generated these results
 * @param maxResults - Maximum number of results to map (optional)
 * @returns Array of SearchResultItems
 */
export function mapPrecedentsToSearchResults(
  precedents: readonly Precedent[],
  originalQuery: SearchQueryItem,
  maxResults?: number
): SearchResultItem[] {
  const resultsToMap = maxResults
    ? precedents.slice(0, maxResults)
    : precedents;

  return resultsToMap.map((precedent, index) =>
    mapPrecedentToSearchResult(precedent, originalQuery, index)
  );
}
