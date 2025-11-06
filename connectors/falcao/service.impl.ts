/**
 * Falcao Service Implementation
 * Layer that provides the Falcao Service with its HTTP client dependency
 */

import { FetchHttpClient } from "@effect/platform";
import { Layer } from "effect";
import { FalcaoService } from "./service";

/**
 * Live implementation of FalcaoService with HttpClient dependency
 *
 * This layer wraps FalcaoService.Default and provides FetchHttpClient.layer to erase
 * the HttpClient dependency from the public API. This is the "Local Dependency Erasure"
 * pattern - the service layer handles its own dependencies so consumers don't need to.
 */
export const FalcaoServiceLive = FalcaoService.Default.pipe(
  Layer.provide(FetchHttpClient.layer)
);
