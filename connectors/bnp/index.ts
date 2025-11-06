/**
 * BNP Connector - Public API
 * Exports all public interfaces, types, errors, and layers for the BNP connector
 */

// Configuration (if needed by consumers)
export { BNP_BASE_URL } from "./config";
// Errors
export {
  BnpApiError,
  BnpNetworkError,
  BnpValidationError,
} from "./errors";

// Schemas and Types
export {
  Aggregation,
  type Aggregation as AggregationType,
  BnpSearchResponse,
  type BnpSearchResponse as BnpSearchResponseType,
  Precedent,
  type Precedent as PrecedentType,
  PrecedentSearchBody,
  type PrecedentSearchBody as PrecedentSearchBodyType,
  PrecedentSearchFilter,
  type PrecedentSearchFilter as PrecedentSearchFilterType,
} from "./schema";
// Service and Implementation
export { BnpService } from "./service";
export { BnpServiceLive } from "./service.impl";
