/**
 * Datajud Service Implementation
 * Layer that provides the DatajudService with its HTTP client dependency
 */

import { FetchHttpClient } from "@effect/platform";
import { Layer } from "effect";
import { DatajudService } from "./service";

/**
 * Live implementation of DatajudService with HttpClient dependency
 *
 * This layer wraps DatajudService.Default and provides FetchHttpClient.layer to erase
 * the HttpClient dependency from the public API. This is the "Local Dependency Erasure"
 * pattern - the service layer handles its own dependencies so consumers don't need to.
 */
export const DatajudServiceLive = DatajudService.Default.pipe(
  Layer.provide(FetchHttpClient.layer)
);
