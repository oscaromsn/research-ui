/**
 * BNP Service Implementation
 * Layer that provides the BNP Service with its HTTP client dependency
 */

import { Layer } from "effect";
import { HttpClientWithoutCacheLayer } from "./httpClientWithoutCache";
import { BnpService } from "./service";

/**
 * Live implementation of BnpService with custom HttpClient dependency
 *
 * We use a custom HttpClient implementation (HttpClientWithoutCacheLayer) instead of
 * the standard FetchHttpClient.layer because Effect's default caching mechanism fails
 * for POST requests with complex bodies (like PrecedentSearchFilter).
 *
 * The standard FetchHttpClient.layer attempts to serialize the request body to generate
 * a cache key, which throws: "Failed to generate cache key for URL"
 *
 * Our custom implementation uses fetch directly without any caching layer, which
 * resolves the issue while maintaining full HttpClient compatibility.
 */
export const BnpServiceLive = BnpService.Default.pipe(
  Layer.provide(HttpClientWithoutCacheLayer)
);
