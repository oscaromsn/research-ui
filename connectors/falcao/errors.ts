/**
 * Falcao Domain Errors
 * Tagged errors for all Falcao API failure modes
 */

import { Data } from "effect";

/**
 * Error thrown when the Falcao API returns a non-OK HTTP status
 */
export class FalcaoApiError extends Data.TaggedError("FalcaoApiError")<{
  readonly status: number;
  readonly statusText: string;
  readonly details: string;
}> {}

/**
 * Error thrown when the API response fails schema validation
 */
export class FalcaoValidationError extends Data.TaggedError(
  "FalcaoValidationError"
)<{
  readonly message: string;
}> {}

/**
 * Error thrown when a network-level failure occurs
 */
export class FalcaoNetworkError extends Data.TaggedError("FalcaoNetworkError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
