/**
 * Falcao API Schemas
 *
 * These schemas are built from the reference frontend application schema.
 * Each schema includes a comment indicating its validation status.
 *
 * Status Legend:
 * ✅ VERIFIED - Schema validated against multiple real API responses
 * 🚧 INFERRED - Schema based on initial captures, needs more validation
 * ⚠️  PARTIAL - Known to be incomplete, pending additional fields
 */

import { Schema } from "effect";

/**
 * Domain Primitives & Transformations
 */

/**
 * ✅ VERIFIED - Branded string type for HTML content
 * Provides type-level distinction between plain strings and HTML content
 */
export const HtmlString = Schema.String.pipe(
  Schema.brand("HtmlString"),
  Schema.annotations({ description: "A string containing HTML content" })
);

export type HtmlString = Schema.Schema.Type<typeof HtmlString>;

/**
 * ✅ VERIFIED - Branded string type for tribunal codes
 * Provides type-level validation for tribunal identifiers
 */
export const TribunalCodeSchema = Schema.String.pipe(
  Schema.trimmed(),
  Schema.filter((s) => s.length > 0, {
    message: () => "Tribunal code cannot be empty",
  }),
  Schema.brand("TribunalCode")
);

export type TribunalCode = Schema.Schema.Type<typeof TribunalCodeSchema>;

/**
 * ✅ VERIFIED - Branded string type for document IDs
 * Provides type-level distinction for document identifiers
 */
export const DocumentIdSchema = Schema.String.pipe(Schema.brand("DocumentId"));

export type DocumentId = Schema.Schema.Type<typeof DocumentIdSchema>;

/**
 * Document type literals for collection parameter
 * Defines document collections supported by the Falcao search API
 *
 * ✅ VERIFIED WORKING (6 types):
 * - acordaos, precedentes, sentencas, decisoesmonocraticas, recursorevista, precedentesBNP
 *
 * ❌ NOT SUPPORTED by search endpoint (return 412 error):
 * - legislacao: "Failed to convert...to required type...ColecaoEnum for value [legislacao]"
 * - jurisprudencia: "Failed to convert...to required type...ColecaoEnum for value [jurisprudencia]"
 *
 * These types may be available through different API endpoints or are not yet implemented.
 */
export const DocumentoTipo = Schema.Literal(
  "acordaos",
  "precedentes",
  "sentencas",
  "decisoesmonocraticas",
  "recursorevista",
  "precedentesBNP"
  // Note: "legislacao" and "jurisprudencia" are NOT supported by the search API
);

export type DocumentoTipo = Schema.Schema.Type<typeof DocumentoTipo>;

/**
 * ✅ VERIFIED - Search parameters for jurisprudence queries
 * Comprehensive filter schema supporting all API search capabilities
 *
 * IMPORTANT: API enforces page size restrictions - only sizes 5 and 10 are allowed
 * Other sizes will return: "Seu usuário não tem autorização para realizar pesquisas com páginas de tamanho X!"
 */
export const FalcaoSearchFilter = Schema.Struct({
  texto: Schema.optional(Schema.String),
  colecao: Schema.optional(DocumentoTipo).pipe(
    Schema.withConstructorDefault(() => "acordaos" as const)
  ),
  size: Schema.optional(
    Schema.Literal(5, 10).pipe(
      Schema.annotations({
        description: "Page size - API only allows 5 or 10",
      })
    )
  ).pipe(Schema.withConstructorDefault(() => 10 as const)),
  page: Schema.optional(Schema.Int.pipe(Schema.nonNegative())).pipe(
    Schema.withConstructorDefault(() => 0)
  ),
  tribunais: Schema.optional(Schema.String),
  nomeRelator: Schema.optional(Schema.String),
  orgaoJulgador: Schema.optional(Schema.String),
  classeProcesso: Schema.optional(Schema.String),
  dataInicio: Schema.optional(Schema.String),
  dataFim: Schema.optional(Schema.String),
  numeroProcesso: Schema.optional(Schema.String),
  precedente: Schema.optional(Schema.String),
  temEmenta: Schema.optional(Schema.String),
  pesquisaSomenteNasEmentas: Schema.optional(Schema.Boolean),
});

export type FalcaoSearchFilter = Schema.Schema.Type<typeof FalcaoSearchFilter>;

/**
 * ✅ VERIFIED - Tribunal information structure
 * Note: API only returns sigla and nome fields
 */
export class FalcaoTribunal extends Schema.Class<FalcaoTribunal>(
  "FalcaoTribunal"
)({
  sigla: Schema.String,
  nome: Schema.String,
}) {}

/**
 * ✅ VERIFIED - Individual search result (document)
 * Based on comprehensive reference schema from frontend application
 */
export class FalcaoSearchResult extends Schema.Class<FalcaoSearchResult>(
  "FalcaoSearchResult"
)({
  tribunal: Schema.String,
  numeroProcesso: Schema.optional(Schema.String),
  ementa: Schema.optional(Schema.String),
  textoAcordao: Schema.optional(Schema.String),
  relator: Schema.optional(Schema.String),
  dataJulgamento: Schema.optional(Schema.String),
  classeProcesso: Schema.optional(Schema.String),
  siglaClasseProcesso: Schema.optional(Schema.String),
  referenciaLegislativa: Schema.optional(Schema.Array(Schema.String)),
  dataJuntada: Schema.optional(Schema.String),
  id: Schema.optional(Schema.Union(Schema.String, Schema.Number)),
  tituloDecisao: Schema.optional(Schema.String),
  textoCompleto: Schema.optional(Schema.String),
  orgaoJulgador: Schema.optional(Schema.NullOr(Schema.String)),
  classeProcessual: Schema.optional(Schema.NullOr(Schema.String)),
  highlightEmenta: Schema.optional(Schema.String),
  highlightTextoAcordao: Schema.optional(Schema.String),
  highlightTextoAcordaoAnonimizado: Schema.optional(Schema.String),
  idDocumentoAcordao: Schema.optional(Schema.String),
  turma: Schema.optional(Schema.String),
  idTurma: Schema.optional(Schema.Number),
  gabinete: Schema.optional(Schema.NullOr(Schema.String)),
  idGabinete: Schema.optional(Schema.NullOr(Schema.Number)),
}) {}

/**
 * ✅ VERIFIED - Filter value schema with count information
 */
export const ValorFiltro = Schema.Struct({
  valor: Schema.String,
  quantidade: Schema.NullOr(Schema.Number),
  valorWeb: Schema.String,
  valorBalao: Schema.NullOr(Schema.String),
});

export type ValorFiltro = Schema.Schema.Type<typeof ValorFiltro>;

/**
 * ✅ VERIFIED - Available filter schema for dynamic filtering
 */
export const FiltroDisponivel = Schema.Struct({
  nomeDoFiltro: Schema.String,
  nomeWeb: Schema.String,
  ordem: Schema.Number,
  colecao: Schema.optional(Schema.NullOr(Schema.String)),
  valoresFiltro: Schema.Array(ValorFiltro),
});

export type FiltroDisponivel = Schema.Schema.Type<typeof FiltroDisponivel>;

/**
 * ✅ VERIFIED - Subject/topic schema
 */
export const Assunto = Schema.Struct({
  codigo: Schema.Number,
  descricao: Schema.String,
});

export type Assunto = Schema.Schema.Type<typeof Assunto>;

/**
 * ✅ VERIFIED - Situation/status schema
 */
export const Situacao = Schema.Struct({
  valor: Schema.String,
  descricao: Schema.String,
});

export type Situacao = Schema.Schema.Type<typeof Situacao>;

/**
 * ✅ VERIFIED - Paradigm process schema
 */
export const ProcessoParadigma = Schema.Struct({
  numero: Schema.String,
  link: Schema.String,
  classe: Schema.optional(Schema.NullOr(Schema.String)),
});

export type ProcessoParadigma = Schema.Schema.Type<typeof ProcessoParadigma>;

/**
 * ✅ VERIFIED - Top legal themes (variant 1)
 */
const TemaTopFiveVariant1 = Schema.Struct({
  origemDocumentos: Schema.String,
  tese: Schema.NullOr(Schema.String),
  tribunal: Schema.String,
  descricaoTribunal: Schema.String,
  situacao: Situacao,
  pendenteDecisao: Schema.Boolean,
  id: Schema.String,
  numero: Schema.String,
  categoria: Schema.String,
  tituloCategoria: Schema.String,
  orgao: Schema.String,
  descricaoOrgao: Schema.String,
  relator: Schema.NullOr(Schema.String),
  questao: Schema.NullOr(Schema.String),
  highlightQuestao: Schema.NullOr(Schema.String),
  highlightTese: Schema.NullOr(Schema.String),
  assuntos: Schema.NullOr(Schema.Array(Assunto)),
  processosParadigma: Schema.Array(ProcessoParadigma),
  dataAdmissao: Schema.NullOr(Schema.String),
  dataJulgamento: Schema.NullOr(Schema.String),
  dataPublicacao: Schema.NullOr(Schema.String),
});

/**
 * ✅ VERIFIED - Top legal themes (variant 2)
 */
const TemaTopFiveVariant2 = Schema.Struct({
  origemDocumentos: Schema.String,
  tese: Schema.NullOr(Schema.String),
  tribunal: Schema.String,
  descricaoTribunal: Schema.String,
  situacao: Situacao,
  pendenteDecisao: Schema.Boolean,
  idTema: Schema.String,
  highlightTese: Schema.NullOr(Schema.String),
  questao: Schema.NullOr(Schema.String),
  highlightQuestao: Schema.NullOr(Schema.String),
  assuntos: Schema.NullOr(Schema.Array(Assunto)),
  processosParadigma: Schema.NullOr(Schema.Array(ProcessoParadigma)),
  dataAdmissao: Schema.NullOr(Schema.String),
  dataJulgamento: Schema.NullOr(Schema.String),
  dataPublicacao: Schema.NullOr(Schema.String),
  tituloDecisao: Schema.String,
  conteudoDecisao: Schema.String,
});

/**
 * ✅ VERIFIED - Union of top theme variants
 */
export const TemaTopFive = Schema.Union(
  TemaTopFiveVariant1,
  TemaTopFiveVariant2
);

export type TemaTopFive = Schema.Schema.Type<typeof TemaTopFive>;

/**
 * ✅ VERIFIED - Precedente document structure
 * Used for "precedentes" and "precedentesBNP" document types
 * These have a completely different structure from regular court documents
 *
 * KEY DISCRIMINATOR: Has 'origemDocumentos' field (regular documents don't have this)
 */
export const FalcaoPrecedenteDocument = Schema.Struct({
  // DISCRIMINATOR FIELD - only precedentes have this
  origemDocumentos: Schema.String,

  // Core fields - REQUIRED
  tribunal: Schema.String,
  descricaoTribunal: Schema.String,

  // Legal content - can be strings or null
  questao: Schema.NullOr(Schema.String),
  tese: Schema.NullOr(Schema.String),
  highlightQuestao: Schema.optional(Schema.NullOr(Schema.String)),
  highlightTese: Schema.optional(Schema.NullOr(Schema.String)),

  // Status and metadata - REQUIRED
  situacao: Situacao,
  pendenteDecisao: Schema.Boolean,

  // Theme identification - can be string, null, or undefined
  idTema: Schema.optional(Schema.NullOr(Schema.String)),
  classeProcessual: Schema.optional(Schema.NullOr(Schema.String)),
  numeroTema: Schema.optional(Schema.NullOr(Schema.String)),

  // Optional theme fields (varies by API response) - can be string, null, or undefined
  id: Schema.optional(Schema.NullOr(Schema.String)),
  numero: Schema.optional(Schema.NullOr(Schema.String)),
  categoria: Schema.optional(Schema.NullOr(Schema.String)),
  tituloCategoria: Schema.optional(Schema.NullOr(Schema.String)),

  // Judicial body - mostly nullable/optional
  orgao: Schema.optional(Schema.NullOr(Schema.String)),
  descricaoOrgao: Schema.optional(Schema.NullOr(Schema.String)),
  orgaoJulgador: Schema.optional(Schema.NullOr(Schema.String)),
  orgaoJudicante: Schema.optional(Schema.NullOr(Schema.String)),

  // People - nullable/optional strings
  relator: Schema.optional(Schema.NullOr(Schema.String)),
  nomeRelator: Schema.optional(Schema.NullOr(Schema.String)),
  nomeRedator: Schema.optional(Schema.NullOr(Schema.String)),

  // Dates - can be string, null, or undefined
  dataAdmissao: Schema.optional(Schema.NullOr(Schema.String)),
  dataJulgamento: Schema.optional(Schema.NullOr(Schema.String)),
  dataPublicacao: Schema.optional(Schema.NullOr(Schema.String)),
  dataTransitoJulgado: Schema.optional(Schema.NullOr(Schema.String)),
  dataJulgamentoEmbargos: Schema.optional(Schema.NullOr(Schema.String)),
  dataInstauracaoIac: Schema.optional(Schema.NullOr(Schema.String)),

  // Related content - nullable arrays
  assuntos: Schema.optional(Schema.NullOr(Schema.Array(Assunto))),
  processosParadigma: Schema.optional(
    Schema.NullOr(Schema.Array(ProcessoParadigma))
  ),
  referenciaLegislativa: Schema.optional(
    Schema.NullOr(Schema.Array(Schema.String))
  ),

  // Decision details - mostly optional, can be null
  decisao: Schema.optional(Schema.NullOr(Schema.String)),
  teorDecisao: Schema.optional(Schema.NullOr(Schema.String)),
  tituloDecisao: Schema.optional(Schema.NullOr(Schema.String)),
  conteudoDecisao: Schema.optional(Schema.NullOr(Schema.String)),
  observacao: Schema.optional(Schema.NullOr(Schema.String)),
  suspensaoGeral: Schema.optional(Schema.NullOr(Schema.String)),

  // Type flags - optional booleans (some responses may not have all flags)
  sumula: Schema.optional(Schema.Boolean),
  teseJuridicaPrevalecente: Schema.optional(Schema.Boolean),
  orientacaoJurisprudencial: Schema.optional(Schema.Boolean),
  baseJuridicaAntiga: Schema.optional(Schema.Boolean),

  // Numbers for special types - nullable/optional
  numeroSumula: Schema.optional(Schema.NullOr(Schema.String)),
  numeroTeseJuridicaPrevalecente: Schema.optional(Schema.NullOr(Schema.String)),
  numeroOrientacaoJurisprudencial: Schema.optional(
    Schema.NullOr(Schema.String)
  ),
  orientacaoJurisprudencialRA_SE: Schema.optional(Schema.NullOr(Schema.String)),

  // Additional fields - optional, can be null
  link: Schema.optional(Schema.NullOr(Schema.String)),
  vistaRegimental: Schema.optional(Schema.NullOr(Schema.String)),
  tipo: Schema.optional(Schema.NullOr(Schema.String)),
  texto: Schema.optional(Schema.NullOr(Schema.String)),
  titulo: Schema.optional(Schema.NullOr(Schema.String)),
});

export type FalcaoPrecedenteDocument = Schema.Schema.Type<
  typeof FalcaoPrecedenteDocument
>;

/**
 * ✅ VERIFIED - Union of all document types
 * Different collection types return different document structures
 *
 * IMPORTANT: Order matters! More specific types (with discriminator fields) must come first.
 * FalcaoPrecedenteDocument has 'origemDocumentos' field which regular documents don't have,
 * making it unambiguous to detect.
 */
export const FalcaoSearchResultUnion = Schema.Union(
  FalcaoPrecedenteDocument, // Try precedentes first (has discriminator 'origemDocumentos')
  FalcaoSearchResult // Then try regular documents
);

export type FalcaoSearchResultUnion = Schema.Schema.Type<
  typeof FalcaoSearchResultUnion
>;

/**
 * ✅ VERIFIED - Paginated search response
 * Based on actual API response structure
 *
 * NOTE: documentos field contains different structures depending on colecao type:
 * - Regular types (acordaos, sentencas, decisoesmonocraticas, recursorevista): FalcaoSearchResult
 * - Precedente types (precedentes, precedentesBNP): FalcaoPrecedenteDocument
 * - Other types (legislacao, jurisprudencia): May have additional variations
 */
export const FalcaoSearchResponse = Schema.Struct({
  documentos: Schema.Array(FalcaoSearchResultUnion),
  quantidadeTotal: Schema.Number,
  totalPaginas: Schema.optional(Schema.Number),
  paginaAtual: Schema.optional(Schema.Number),
  filtrosDisponiveis: Schema.optional(Schema.Array(FiltroDisponivel)),
  temasTopFive: Schema.optional(Schema.Array(TemaTopFive)),
  tempoResposta: Schema.optional(Schema.Number),
});

export type FalcaoSearchResponse = Schema.Schema.Type<
  typeof FalcaoSearchResponse
>;

/**
 * ⚠️ PARTIAL - Full document details
 * This is a complex nested structure. Current schema covers basics.
 */
export class FalcaoDocument extends Schema.Class<FalcaoDocument>(
  "FalcaoDocument"
)({
  id: Schema.optional(Schema.Union(Schema.String, Schema.Number)),
  tribunal: Schema.String,
  numeroProcesso: Schema.String,
  conteudoCompleto: Schema.optional(Schema.String),
  ementa: Schema.optional(Schema.String),
  textoAcordao: Schema.optional(Schema.String),
  decisao: Schema.optional(Schema.String),
  relator: Schema.optional(Schema.String),
  dataPublicacao: Schema.optional(Schema.String),
  dataJulgamento: Schema.optional(Schema.String),
  classeProcesso: Schema.optional(Schema.String),
  siglaClasseProcesso: Schema.optional(Schema.String),
  orgaoJulgador: Schema.optional(Schema.NullOr(Schema.String)),
  classeProcessual: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

/**
 * ✅ VERIFIED - Autocomplete suggestions
 * Based on actual API response structure with required timing fields
 */
export const FalcaoAutocompleteResponse = Schema.Struct({
  sugestoes: Schema.Array(Schema.String),
  tempoElasticsearch: Schema.Number,
  tempoConsultaCompleta: Schema.Number,
  queriesRelated: Schema.Array(
    Schema.Struct({
      queryString: Schema.String,
      queryRelated: Schema.Array(Schema.String),
    })
  ),
});

export type FalcaoAutocompleteResponse = Schema.Schema.Type<
  typeof FalcaoAutocompleteResponse
>;

/**
 * 🚧 INFERRED - System version information
 */
export const FalcaoVersionInfo = Schema.Struct({
  versao: Schema.String,
  data: Schema.optional(Schema.String),
  descricao: Schema.optional(Schema.String),
});

export type FalcaoVersionInfo = Schema.Schema.Type<typeof FalcaoVersionInfo>;

/**
 * ✅ VERIFIED - Data indexing/publication dates
 * Based on actual API response structure
 */
export const FalcaoDataUpdateResponse = Schema.Struct({
  dataAtualizacaoAcordao: Schema.Array(
    Schema.Struct({
      tribunal: Schema.String,
      data: Schema.NullOr(Schema.String),
    })
  ),
  dataAtualizacaoDecisaoMonocratica: Schema.optional(
    Schema.Array(
      Schema.Struct({
        tribunal: Schema.String,
        data: Schema.NullOr(Schema.String),
      })
    )
  ),
  dataAtualizacaoPrecedentes: Schema.optional(
    Schema.Array(
      Schema.Struct({
        tribunal: Schema.String,
        data: Schema.NullOr(Schema.String),
      })
    )
  ),
  dataAtualizacaoPrecedentesBNP: Schema.optional(
    Schema.Array(
      Schema.Struct({
        tribunal: Schema.String,
        data: Schema.NullOr(Schema.String),
      })
    )
  ),
  dataAtualizacaoRecursoRevista: Schema.optional(
    Schema.Array(
      Schema.Struct({
        tribunal: Schema.String,
        data: Schema.NullOr(Schema.String),
      })
    )
  ),
  dataAtualizacaoSentenca: Schema.optional(
    Schema.Array(
      Schema.Struct({
        tribunal: Schema.String,
        data: Schema.NullOr(Schema.String),
      })
    )
  ),
});

export type FalcaoDataUpdateResponse = Schema.Schema.Type<
  typeof FalcaoDataUpdateResponse
>;

/**
 * Note: Advanced filter validation rules
 *
 * The reference schema implements complex validation rules to prevent HTTP 412 errors:
 * - Prevents 'precedente' filter from being combined with other complex filters
 * - Enforces complexity threshold (max 4 complex filters)
 *
 * For a backend connector, these validations may be unnecessary as the API
 * will return appropriate errors. If needed, validation can be added using
 * Schema.filter() as shown in the reference schema (lines 471-516).
 */

/**
 * Document Operation Classes
 */

/**
 * ✅ VERIFIED - Document identifier for operations
 * Used to specify which document to perform operations on
 */
export class DocumentIdentifier extends Schema.Class<DocumentIdentifier>(
  "DocumentIdentifier"
)({
  idDocumento: DocumentIdSchema,
  tipoDocumento: Schema.Literal("acordaos", "sentencas"),
  tribunal: TribunalCodeSchema,
}) {}

/**
 * ✅ VERIFIED - Options for copying full text of documents
 * Used for document text extraction and citation generation
 */
export class CopyFullTextOptions extends Schema.Class<CopyFullTextOptions>(
  "CopyFullTextOptions"
)({
  documento: Schema.instanceOf(DocumentIdentifier),
  indiceItemSelecionado: Schema.optional(Schema.Number),
  numeroPagina: Schema.optional(Schema.Number),
  tamanhoPagina: Schema.optional(Schema.Number),
  top5: Schema.optional(Schema.Boolean),
}) {}

/**
 * API Error Response Schemas
 */

/**
 * ✅ VERIFIED - Standard API error response
 * Returned when the API encounters an error (e.g., rate limiting, validation failures)
 */
export const FalcaoApiErrorResponse = Schema.Struct({
  userMessage: Schema.String,
  developerMessage: Schema.String,
});

export type FalcaoApiErrorResponse = Schema.Schema.Type<
  typeof FalcaoApiErrorResponse
>;

/**
 * ✅ VERIFIED - Validation error item
 * Individual field validation error
 */
export const FalcaoValidationErrorItem = Schema.Struct({
  campo: Schema.String,
  erro: Schema.String,
});

export type FalcaoValidationErrorItem = Schema.Schema.Type<
  typeof FalcaoValidationErrorItem
>;

/**
 * ✅ VERIFIED - Validation error response
 * Array of field validation errors
 */
export const FalcaoValidationErrorResponse = Schema.Array(
  FalcaoValidationErrorItem
);

export type FalcaoValidationErrorResponse = Schema.Schema.Type<
  typeof FalcaoValidationErrorResponse
>;

/**
 * API Response Schemas
 */

/**
 * ✅ VERIFIED - Search count response
 * Returns document counts by type for a search query
 */
export const FalcaoCountResponse = Schema.Struct({
  countPrecedentes: Schema.Number,
  countAcordaos: Schema.Number,
  countSentencas: Schema.Number,
  countRR: Schema.Number,
  countDecisoesMonocraticas: Schema.Number,
});

export type FalcaoCountResponse = Schema.Schema.Type<
  typeof FalcaoCountResponse
>;
