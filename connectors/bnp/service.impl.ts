/**
 * BNP Service Implementation
 * Layer that provides the BNP Service with its HTTP client dependency
 */

import { FetchHttpClient } from "@effect/platform";
import { Layer } from "effect";
import { BnpService } from "./service";

/**
 * Live implementation of BnpService with HttpClient dependency
 *
 * This layer wraps BnpService.Default and provides FetchHttpClient.layer to erase
 * the HttpClient dependency from the public API. This is the "Local Dependency Erasure"
 * pattern - the service layer handles its own dependencies so consumers don't need to.
 */
export const BnpServiceLive = BnpService.Default.pipe(
  Layer.provide(FetchHttpClient.layer)
);
