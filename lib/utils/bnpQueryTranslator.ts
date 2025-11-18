/**
 * BNP Query Translator
 *
 * Translates BAML SearchQueryItem to BNP PrecedentSearchFilter.
 *
 * Current Implementation (v1):
 * - Simple mapping: query_string → buscaGeral (general search field)
 * - Sets reasonable defaults for pagination and ordering
 *
 * Future Enhancements (v2+):
 * - Smart parsing of query_string for structured fields:
 *   - Detect court names → orgaos filter
 *   - Detect precedent types (REsp, AgInt, etc.) → tipos filter
 *   - Detect quoted terms → trechoExato (exact phrase)
 *   - Detect boolean operators → todasPalavras/quaisquerPalavras
 * - Analyze expected_information for hints about filter parameters
 */

import type { SearchQueryItem } from "@/baml_client/types";
import type { PrecedentSearchFilter } from "@/connectors/bnp";

/**
 * Translates a BAML SearchQueryItem to a BNP PrecedentSearchFilter
 *
 * @param query - The BAML search query item from GenerateLegalSearchQueries
 * @param maxResults - Maximum number of results desired (not directly used in filter, but for context)
 * @returns A PrecedentSearchFilter ready for the BNP API
 *
 * @example
 * ```typescript
 * const bamlQuery: SearchQueryItem = {
 *   query_string: "contrato de trabalho rescisão",
 *   expected_information: ["jurisprudência STJ", "precedentes vinculantes"]
 * };
 *
 * const bnpFilter = translateQueryToBnpFilter(bamlQuery, 10);
 * // Result: { buscaGeral: "contrato de trabalho rescisão", pagina: 1, ... }
 * ```
 */
export function translateQueryToBnpFilter(
  query: SearchQueryItem,
  _maxResults = 10
): PrecedentSearchFilter {
  // Sanitize query string: BNP API does NOT support boolean operators
  // Remove: AND, OR, NOT, NEAR/N, and clean up quotes
  const sanitizedQuery = sanitizeQueryString(query.query_string);

  const filter: PrecedentSearchFilter = {
    buscaGeral: sanitizedQuery,
    pagina: 1,
    // Use default ordering (Textual) for relevance
    ordenacao: "Textual",
    // Don't include cancelled precedents by default
    cancelados: false,
  };

  // Future enhancement: Parse query_string for structured search
  // const structuredFilter = parseQueryString(query.query_string);
  // const orgaosHints = extractOrgaosFromExpectedInfo(query.expected_information);
  // return { ...filter, ...structuredFilter, orgaos: orgaosHints };

  return filter;
}

/**
 * Sanitizes query string for BNP API compatibility
 *
 * BNP API limitations:
 * - Does NOT support boolean operators (AND, OR, NOT, NEAR)
 * - Prefers simple search terms
 * - Handles quoted phrases natively
 *
 * @param queryString - Original query with potential boolean operators
 * @returns Sanitized query compatible with BNP API
 *
 * @example
 * ```typescript
 * sanitizeQueryString('"engenheiro" AND "responsabilidade"')
 * // Returns: "engenheiro responsabilidade"
 *
 * sanitizeQueryString('"dano ambiental" NEAR/5 "agrônomo"')
 * // Returns: "dano ambiental agrônomo"
 * ```
 */
function sanitizeQueryString(queryString: string): string {
  // Step 1: Remove NEAR/N operators (e.g., NEAR/5)
  let sanitized = queryString.replace(/\s+NEAR\/\d+\s+/gi, " ");

  // Step 2: Remove boolean operators
  sanitized = sanitized.replace(/\s+(AND|OR|NOT)\s+/gi, " ");

  // Step 3: Remove redundant quotes (keep content, remove quote marks for simplicity)
  // BNP seems to handle simple terms better than quoted phrases with operators
  sanitized = sanitized.replace(/"/g, "");

  // Step 4: Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  // Step 5: If empty after sanitization, return a minimal search
  if (!sanitized) {
    return "";
  }

  return sanitized;
}

/**
 * Future: Parse query string for structured BNP filter fields
 * This would analyze the query_string for patterns like:
 * - Court names (STJ, STF, TST) → orgaos: ["STJ"]
 * - Precedent types (REsp, AgInt, RExt) → tipos: ["REsp"]
 * - Quoted phrases → trechoExato: "exact phrase"
 * - Boolean AND → todasPalavras: "word1 word2"
 * - Boolean OR → quaisquerPalavras: "word1 word2"
 */
// function parseQueryString(queryString: string): Partial<PrecedentSearchFilter> {
//   // Implementation would use regex patterns to detect:
//   // 1. Quoted terms: /"([^"]+)"/g → trechoExato
//   // 2. Court abbreviations: /\b(STJ|STF|TST|TRF[1-5])\b/gi → orgaos
//   // 3. Precedent types: /\b(REsp|AgInt|RExt|HC|MS)\b/gi → tipos
//   // 4. Boolean operators: split on AND/OR
//   return {};
// }

/**
 * Future: Extract court hints from expected_information
 * Analyzes the expected_information array for mentions of specific courts
 */
// function extractOrgaosFromExpectedInfo(expectedInfo: string[]): string[] {
//   const orgaosPattern = /\b(STJ|STF|TST|TRF[1-5]|TRT\d+|TJ[A-Z]{2})\b/gi;
//   const orgaos = new Set<string>();
//
//   for (const info of expectedInfo) {
//     const matches = info.match(orgaosPattern);
//     if (matches) {
//       for (const match of matches) {
//         orgaos.add(match.toUpperCase());
//       }
//     }
//   }
//
//   return Array.from(orgaos);
// }
