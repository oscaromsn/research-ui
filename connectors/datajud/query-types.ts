/**
 * DataJud Query Types
 * Type-safe Elasticsearch Query DSL for DataJud API
 * Based on CNJ DataJud Public API Glossary
 */

/**
 * Elasticsearch Range Query
 * For date ranges, numeric ranges, etc.
 */
export interface RangeQuery {
  /** Greater than or equal to */
  gte?: string | number;
  /** Less than or equal to */
  lte?: string | number;
  /** Greater than */
  gt?: string | number;
  /** Less than */
  lt?: string | number;
}

/**
 * Elasticsearch Bool Query
 * Combines multiple query clauses with boolean logic
 */
export interface BoolQuery {
  /** All clauses must match (AND logic) */
  must?: ElasticsearchQuery[];
  /** At least one clause must match (OR logic) */
  should?: ElasticsearchQuery[];
  /** No clauses must match (NOT logic) */
  must_not?: ElasticsearchQuery[];
  /** Filters results without affecting score */
  filter?: ElasticsearchQuery[];
}

/**
 * Elasticsearch Query DSL
 * Core query types supported by DataJud API
 */
export interface ElasticsearchQuery {
  /** Match query (full-text search) */
  match?: Record<string, string | number | boolean>;
  /** Bool query (combine multiple conditions) */
  bool?: BoolQuery;
  /** Term query (exact match) */
  term?: Record<string, string | number | boolean>;
  /** Terms query (match any of the values) */
  terms?: Record<string, Array<string | number>>;
  /** Range query (numeric/date ranges) */
  range?: Record<string, RangeQuery>;
  /** Match all documents */
  match_all?: Record<string, never>;
}

/**
 * Sort order for Elasticsearch queries
 */
export type SortOrder = "asc" | "desc";

/**
 * Sort option for Elasticsearch queries
 * Used for ordering results and pagination with search_after
 */
export interface SortOption {
  [field: string]: {
    order: SortOrder;
  };
}

/**
 * DataJud sortable fields
 * Fields that can be used for sorting (typically datetime or keyword fields)
 */
export type DatajudSortableFields =
  | "@timestamp"
  | "dataAjuizamento"
  | "dataHoraUltimaAtualizacao"
  | "numeroProcesso"
  | "tribunal"
  | "grau";

/**
 * DataJud Search Options
 * Complete configuration for searching judicial process metadata
 */
export interface DatajudSearchOptions {
  /**
   * Elasticsearch Query DSL
   * If not provided, defaults to searching by process number
   */
  query?: ElasticsearchQuery;

  /**
   * Number of results to return
   * @minimum 1
   * @maximum 10000
   * @default 10
   */
  size?: number;

  /**
   * Sort configuration
   * Required for search_after pagination
   * Recommended: [{ "@timestamp": { order: "asc" } }]
   */
  sort?: SortOption[];

  /**
   * Pagination cursor from previous response
   * Use the 'sort' array from the last hit of the previous page
   * Must be used together with 'sort' parameter
   *
   * @example
   * const page1 = yield* service.searchProcessMetadata("...", {
   *   query: { ... },
   *   size: 100,
   *   sort: [{ "@timestamp": { order: "asc" } }]
   * });
   *
   * const lastHit = page1.hits.hits[page1.hits.hits.length - 1];
   * const page2 = yield* service.searchProcessMetadata("...", {
   *   query: { ... },
   *   size: 100,
   *   sort: [{ "@timestamp": { order: "asc" } }],
   *   search_after: lastHit.sort
   * });
   */
  search_after?: readonly unknown[];
}

/**
 * DataJud Field Names
 * Type-safe field name constants based on the DataJud glossary
 * Use these to prevent typos and get IntelliSense support
 *
 * @example
 * import { DatajudFields } from "./query-types";
 *
 * const query = {
 *   bool: {
 *     must: [
 *       { match: { [DatajudFields.classe.codigo]: 1116 } },
 *       { match: { [DatajudFields.orgaoJulgador.codigo]: 13597 } }
 *     ]
 *   }
 * };
 */
export const DatajudFields = {
  /** Process identification fields */
  id: "id" as const,
  tribunal: "tribunal" as const,
  numeroProcesso: "numeroProcesso" as const,
  dataAjuizamento: "dataAjuizamento" as const,
  grau: "grau" as const,
  nivelSigilo: "nivelSigilo" as const,

  /** Process format (Físico/Eletrônico) */
  formato: {
    codigo: "formato.codigo" as const,
    nome: "formato.nome" as const,
  },

  /** System information */
  sistema: {
    codigo: "sistema.codigo" as const,
    nome: "sistema.nome" as const,
  },

  /** Process class (Classe Processual) */
  classe: {
    codigo: "classe.codigo" as const,
    nome: "classe.nome" as const,
  },

  /** Process subjects (Assuntos) */
  assuntos: {
    codigo: "assuntos.codigo" as const,
    nome: "assuntos.nome" as const,
  },

  /** Judging body (Órgão Julgador) */
  orgaoJulgador: {
    codigo: "orgaoJulgador.codigo" as const,
    nome: "orgaoJulgador.nome" as const,
    codigoMunicipioIBGE: "orgaoJulgador.codigoMunicipioIBGE" as const,
  },

  /** Process movements */
  movimentos: {
    codigo: "movimentos.codigo" as const,
    nome: "movimentos.nome" as const,
    dataHora: "movimentos.dataHora" as const,
    complementosTabelados: {
      codigo: "movimentos.complementosTabelados.codigo" as const,
      descricao: "movimentos.complementosTabelados.descricao" as const,
      valor: "movimentos.complementosTabelados.valor" as const,
      nome: "movimentos.complementosTabelados.nome" as const,
    },
    orgaoJulgador: {
      codigoOrgao: "movimentos.orgaoJulgador.codigoOrgao" as const,
      nomeOrgao: "movimentos.orgaoJulgador.nomeOrgao" as const,
    },
  },

  /** Internal control attributes */
  dataHoraUltimaAtualizacao: "dataHoraUltimaAtualizacao" as const,
  "@timestamp": "@timestamp" as const,
} as const;

/**
 * Common query patterns for DataJud searches
 * Pre-built query builders for typical use cases
 */
export const DatajudQueryPatterns = {
  /**
   * Search by process number
   */
  byProcessNumber: (numeroProcesso: string): ElasticsearchQuery => ({
    match: {
      [DatajudFields.numeroProcesso]: numeroProcesso,
    },
  }),

  /**
   * Search by class code (Classe Processual)
   */
  byClassCode: (classCode: number): ElasticsearchQuery => ({
    match: {
      [DatajudFields.classe.codigo]: classCode,
    },
  }),

  /**
   * Search by judging body code (Órgão Julgador)
   */
  byJudgingBodyCode: (orgaoCode: number): ElasticsearchQuery => ({
    match: {
      [DatajudFields.orgaoJulgador.codigo]: orgaoCode,
    },
  }),

  /**
   * Search by class and judging body (Example 2 pattern)
   */
  byClassAndJudgingBody: (
    classCode: number,
    orgaoCode: number
  ): ElasticsearchQuery => ({
    bool: {
      must: [
        { match: { [DatajudFields.classe.codigo]: classCode } },
        { match: { [DatajudFields.orgaoJulgador.codigo]: orgaoCode } },
      ],
    },
  }),

  /**
   * Search by date range
   */
  byDateRange: (
    dateField: "dataAjuizamento" | "dataHoraUltimaAtualizacao",
    from: string,
    to: string
  ): ElasticsearchQuery => ({
    range: {
      [dateField]: {
        gte: from,
        lte: to,
      },
    },
  }),
} as const;
