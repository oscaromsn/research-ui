/**
 * Datajud Connector - Public API
 * Exports all public interfaces, types, errors, and layers for the Datajud connector
 */

// Número Processo Utilities
// Re-export the complete numero-processo toolkit for convenience
export {
  // Parser utilities
  formatNumeroProcesso,
  // Validator utilities
  getExpectedCheckDigit,
  // Errors
  InvalidCheckDigitError,
  InvalidProcessNumberFormatError,
  // Main utility function
  inferTribunalAlias,
  // Advanced usage
  inferTribunalAliasFromComponents,
  // Type guards
  isSupportedTribunalAlias,
  // Reference data
  JUSTICE_SEGMENT_NAMES,
  JusticaSegment,
  // Types
  type NumeroProcessoComponentsType,
  parseAndFormat,
  parseNumeroProcesso,
  STATE_CODE_TO_ABBREV,
  SUPPORTED_TRIBUNAL_ALIASES,
  TribunalAlias,
  UnsupportedTribunalError,
  validateCheckDigit,
} from "../../domain/numero-processo";
// Configuration (if needed by consumers)
export { DATAJUD_BASE_URL, DATAJUD_PUBLIC_API_KEY } from "./config";
// Errors
export {
  DatajudApiError,
  DatajudNetworkError,
  DatajudValidationError,
} from "./errors";
// Query Types (for type-safe query construction)
export type {
  BoolQuery,
  DatajudSearchOptions,
  DatajudSortableFields,
  ElasticsearchQuery,
  SortOption,
  SortOrder,
} from "./query-types";
export { DatajudFields, DatajudQueryPatterns } from "./query-types";
// Schemas and Types
export {
  ComplementoTabelado,
  type ComplementoTabelado as ComplementoTabeladoType,
  DatajudHit,
  type DatajudHit as DatajudHitType,
  DatajudProcessSource,
  type DatajudProcessSource as DatajudProcessSourceType,
  DatajudSearchResponse,
  type DatajudSearchResponse as DatajudSearchResponseType,
  Movimento,
  type Movimento as MovimentoType,
  OrgaoJulgador,
  type OrgaoJulgador as OrgaoJulgadorType,
  SimpleCodeName,
  type SimpleCodeName as SimpleCodeNameType,
} from "./schema";
// Service and Implementation
export { DatajudService } from "./service";
export { DatajudServiceLive } from "./service.impl";
