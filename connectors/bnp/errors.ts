/**
 * BNP Domain Errors
 * Tagged errors for all BNP API failure modes
 */

import { Data } from "effect";

/**
 * Error thrown when the BNP API returns a non-OK HTTP status
 */
export class BnpApiError extends Data.TaggedError("BnpApiError")<{
  readonly status: number;
  readonly statusText: string;
  readonly details: string;
}> {}

/**
 * Error thrown when the API response fails schema validation
 */
export class BnpValidationError extends Data.TaggedError("BnpValidationError")<{
  readonly message: string;
}> {}

/**
 * Error thrown when a network-level failure occurs
 */
export class BnpNetworkError extends Data.TaggedError("BnpNetworkError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
