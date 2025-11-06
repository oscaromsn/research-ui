/**
 * Datajud API Schemas
 * Effect Schema definitions for Datajud process metadata API responses
 */

import { Schema } from "effect";

/**
 * Complemento Tabelado - Tabulated complement for movements
 */
export const ComplementoTabelado = Schema.Struct({
  codigo: Schema.Number,
  nome: Schema.String,
  valor: Schema.Number,
  descricao: Schema.String,
});

export type ComplementoTabelado = Schema.Schema.Type<
  typeof ComplementoTabelado
>;

/**
 * Movimento - Process movement/action
 */
export const Movimento = Schema.Struct({
  codigo: Schema.Number,
  nome: Schema.String,
  dataHora: Schema.String, // ISO datetime string
  complementosTabelados: Schema.optional(Schema.Array(ComplementoTabelado)),
});

export type Movimento = Schema.Schema.Type<typeof Movimento>;

/**
 * Simple Code-Name pair (reusable structure)
 */
export const SimpleCodeName = Schema.Struct({
  codigo: Schema.Number,
  nome: Schema.String,
});

export type SimpleCodeName = Schema.Schema.Type<typeof SimpleCodeName>;

/**
 * Orgao Julgador - Judicial body/court
 */
export const OrgaoJulgador = Schema.Struct({
  codigo: Schema.Number,
  nome: Schema.String,
  codigoMunicipioIBGE: Schema.optional(Schema.Number),
});

export type OrgaoJulgador = Schema.Schema.Type<typeof OrgaoJulgador>;

/**
 * Datajud Process Source - The main process metadata
 */
export const DatajudProcessSource = Schema.Struct({
  id: Schema.String,
  numeroProcesso: Schema.String,
  tribunal: Schema.String,
  dataAjuizamento: Schema.String, // ISO datetime string
  grau: Schema.String,
  nivelSigilo: Schema.Number,
  classe: SimpleCodeName,
  sistema: SimpleCodeName,
  formato: SimpleCodeName,
  orgaoJulgador: OrgaoJulgador,
  // TPU data can be nested (array of SimpleCodeName or array of array of SimpleCodeName)
  assuntos: Schema.Array(
    Schema.Union(SimpleCodeName, Schema.Array(SimpleCodeName))
  ),
  movimentos: Schema.optional(Schema.Array(Movimento)),
});

export type DatajudProcessSource = Schema.Schema.Type<
  typeof DatajudProcessSource
>;

/**
 * Datajud Hit - Single search result hit
 */
export const DatajudHit = Schema.Struct({
  _index: Schema.String,
  _id: Schema.String,
  _score: Schema.NullOr(Schema.Number),
  _source: DatajudProcessSource,
  // Sort values for pagination with search_after (only present when sorting is used)
  sort: Schema.optional(Schema.Array(Schema.Unknown)),
});

export type DatajudHit = Schema.Schema.Type<typeof DatajudHit>;

/**
 * Datajud Search Response - Complete API response
 */
export const DatajudSearchResponse = Schema.Struct({
  took: Schema.Number,
  timed_out: Schema.Boolean,
  hits: Schema.Struct({
    total: Schema.Struct({
      value: Schema.Number,
      relation: Schema.String,
    }),
    max_score: Schema.NullOr(Schema.Number),
    hits: Schema.Array(DatajudHit),
  }),
});

export type DatajudSearchResponse = Schema.Schema.Type<
  typeof DatajudSearchResponse
>;
