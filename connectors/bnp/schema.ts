/**
 * BNP API Schemas
 * Effect Schema definitions for BNP (Banco Nacional de Precedentes) API responses
 */

import { Schema } from "effect";

/**
 * Precedent Search Filter - Input parameters for precedent search
 */
export const PrecedentSearchFilter = Schema.Struct({
  // Fields with defaults
  buscaGeral: Schema.optional(Schema.String).pipe(
    Schema.withConstructorDefault(() => "")
  ),
  cancelados: Schema.optional(Schema.Boolean).pipe(
    Schema.withConstructorDefault(() => false)
  ),
  ordenacao: Schema.optional(
    Schema.Literal(
      "Textual",
      "Cronologica Ascendente",
      "Cronologica Descendente",
      "Numérica Ascendente",
      "Numérica Descendente"
    )
  ).pipe(Schema.withConstructorDefault(() => "Textual" as const)),
  orgaos: Schema.optional(Schema.Array(Schema.String)).pipe(
    Schema.withConstructorDefault(() => [])
  ),
  pagina: Schema.optional(Schema.Int.pipe(Schema.positive())).pipe(
    Schema.withConstructorDefault(() => 1)
  ),
  tipos: Schema.optional(Schema.Array(Schema.String)).pipe(
    Schema.withConstructorDefault(() => [])
  ),
  // Truly optional fields
  todasPalavras: Schema.optional(Schema.String),
  quaisquerPalavras: Schema.optional(Schema.String),
  semPalavras: Schema.optional(Schema.String),
  trechoExato: Schema.optional(Schema.String),
});

export type PrecedentSearchFilter = Schema.Schema.Type<
  typeof PrecedentSearchFilter
>;

/**
 * Precedent Search Body - Request body structure
 */
export const PrecedentSearchBody = Schema.Struct({
  filtro: PrecedentSearchFilter,
});

export type PrecedentSearchBody = Schema.Schema.Type<
  typeof PrecedentSearchBody
>;

/**
 * Precedent - Individual precedent from search results
 */
export const Precedent = Schema.Struct({
  id: Schema.String,
  orgao: Schema.String,
  tipo: Schema.String,
  nr: Schema.Number,
  questao: Schema.String,
  tese: Schema.optional(Schema.NullOr(Schema.String)),
  situacao: Schema.String,
  ultimaAtualizacao: Schema.optional(Schema.String),
  possuiDecisoes: Schema.optional(Schema.Boolean),
  processosParadigma: Schema.optional(
    Schema.Array(
      Schema.Struct({
        numero: Schema.String,
        link: Schema.String,
      })
    )
  ),
  suspensoes: Schema.optional(
    Schema.Array(
      Schema.Struct({
        ativa: Schema.Boolean,
        dataSuspensao: Schema.String,
        descricao: Schema.String,
        linkDecisao: Schema.optional(Schema.String),
      })
    )
  ),
  highlight: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.String })
  ),
  tese_snippet: Schema.optional(Schema.String),
});

export type Precedent = Schema.Schema.Type<typeof Precedent>;

/**
 * Aggregation - Facet aggregation for filtering
 */
export const Aggregation = Schema.Struct({
  tipo: Schema.String,
  total: Schema.Number,
});

export type Aggregation = Schema.Schema.Type<typeof Aggregation>;

/**
 * BNP Search Response - Complete API response
 */
export const BnpSearchResponse = Schema.Struct({
  total: Schema.Number,
  resultados: Schema.Array(Precedent),
  posicao_inicial: Schema.Number,
  posicao_final: Schema.Number,
  aggsEspecies: Schema.Array(Aggregation),
  aggsOrgaos: Schema.Array(Aggregation),
});

export type BnpSearchResponse = Schema.Schema.Type<typeof BnpSearchResponse>;
