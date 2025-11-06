/**
 * Datajud Domain Errors
 * Tagged errors for all Datajud API failure modes
 */

import { Data } from "effect";

/**
 * Error thrown when the Datajud API returns a non-OK HTTP status
 */
export class DatajudApiError extends Data.TaggedError("DatajudApiError")<{
  readonly status: number;
  readonly statusText: string;
  readonly details: string;
  readonly tribunal: string;
}> {}

/**
 * Error thrown when the API response fails schema validation
 */
export class DatajudValidationError extends Data.TaggedError(
  "DatajudValidationError"
)<{
  readonly message: string;
  readonly tribunal: string;
}> {}

/**
 * Error thrown when a network-level failure occurs
 */
export class DatajudNetworkError extends Data.TaggedError(
  "DatajudNetworkError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
