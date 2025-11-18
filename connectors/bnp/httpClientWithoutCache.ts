/**
 * Custom HTTP Client Without Caching
 *
 * This module provides a custom HttpClient implementation that COMPLETELY BYPASSES
 * Next.js's fetch wrapper to avoid cache key generation errors.
 *
 * Next.js 15 wraps the global fetch() and attempts to cache ALL requests, including POSTs.
 * For POST requests with complex bodies, this causes "Failed to generate cache key" errors.
 *
 * This implementation uses @effect/platform-node's HttpClient which uses Node.js's
 * native http/https modules, completely avoiding Next.js's fetch wrapper.
 *
 * NOTE: This works in Next.js server actions (Node.js runtime) but NOT in standalone
 * Bun scripts. For Bun compatibility, a different HTTP client would be needed.
 */

import { NodeHttpClient } from "@effect/platform-node";

/**
 * Layer that provides an HttpClient using Node.js HTTP (no Next.js fetch wrapper)
 *
 * This uses undici (Node.js's HTTP client) to completely bypass Next.js's fetch()
 * wrapper and its automatic caching, which fails for complex POST request bodies.
 *
 * Compatible with: Next.js server actions running on Node.js runtime
 * Not compatible with: Standalone Bun scripts (use FetchHttpClient for those)
 */
export const HttpClientWithoutCacheLayer = NodeHttpClient.layerUndici;
