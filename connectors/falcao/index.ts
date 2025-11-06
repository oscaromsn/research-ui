/**
 * Falcao Connector - Public API
 * Exports all public interfaces, types, errors, and layers for the Falcao connector
 */

export { FALCAO_BASE_URL } from "./config";

export {
  FalcaoApiError,
  FalcaoNetworkError,
  FalcaoValidationError,
} from "./errors";

export {
  Assunto,
  type Assunto as AssuntoType,
  CopyFullTextOptions,
  type DocumentId,
  DocumentIdentifier,
  DocumentIdSchema,
  DocumentoTipo,
  type DocumentoTipo as DocumentoTipoType,
  FalcaoApiErrorResponse,
  type FalcaoApiErrorResponse as FalcaoApiErrorResponseType,
  FalcaoAutocompleteResponse,
  type FalcaoAutocompleteResponse as FalcaoAutocompleteResponseType,
  FalcaoCountResponse,
  type FalcaoCountResponse as FalcaoCountResponseType,
  FalcaoDataUpdateResponse,
  type FalcaoDataUpdateResponse as FalcaoDataUpdateResponseType,
  FalcaoDocument,
  type FalcaoDocument as FalcaoDocumentType,
  FalcaoPrecedenteDocument,
  type FalcaoPrecedenteDocument as FalcaoPrecedenteDocumentType,
  FalcaoSearchFilter,
  type FalcaoSearchFilter as FalcaoSearchFilterType,
  FalcaoSearchResponse,
  type FalcaoSearchResponse as FalcaoSearchResponseType,
  FalcaoSearchResult,
  type FalcaoSearchResult as FalcaoSearchResultType,
  FalcaoSearchResultUnion,
  type FalcaoSearchResultUnion as FalcaoSearchResultUnionType,
  FalcaoTribunal,
  type FalcaoTribunal as FalcaoTribunalType,
  FalcaoValidationErrorItem,
  type FalcaoValidationErrorItem as FalcaoValidationErrorItemType,
  FalcaoValidationErrorResponse,
  type FalcaoValidationErrorResponse as FalcaoValidationErrorResponseType,
  FalcaoVersionInfo,
  type FalcaoVersionInfo as FalcaoVersionInfoType,
  FiltroDisponivel,
  type FiltroDisponivel as FiltroDisponivelType,
  HtmlString,
  type HtmlString as HtmlStringType,
  ProcessoParadigma,
  type ProcessoParadigma as ProcessoParadigmaType,
  Situacao,
  type Situacao as SituacaoType,
  TemaTopFive,
  type TemaTopFive as TemaTopFiveType,
  type TribunalCode,
  TribunalCodeSchema,
  ValorFiltro,
  type ValorFiltro as ValorFiltroType,
} from "./schema";

export { FalcaoService } from "./service";
export { FalcaoServiceLive } from "./service.impl";
