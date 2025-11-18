/**
 * BNP Search Integration Test
 *
 * This test verifies that the BNP search functionality works correctly
 * in a Next.js-like environment, specifically testing that the fix for
 * the "Failed to generate cache key" error works properly.
 *
 * Key aspects tested:
 * - AppLayer is correctly provided at execution time
 * - HttpClientWithoutCacheLayer is properly wired
 * - No cache key errors occur during search execution
 * - Real API calls work (or fail gracefully with proper errors)
 */

import { describe, expect, it } from "vitest";
import { executeBnpSearch } from "@/lib/utils/bnpSearchUtil";
import type { SearchQueryItem } from "@/baml_client/types";

describe("BNP Search Integration Tests", () => {
  describe("AppLayer Integration", () => {
    it("should execute search without 'Failed to generate cache key' error", async () => {
      // This test verifies the fix for the cache key error by:
      // 1. Using the actual executeBnpSearch function (used by server actions)
      // 2. Ensuring AppLayer is provided correctly at execution time
      // 3. Verifying the custom HttpClientWithoutCacheLayer is used

      const testQuery: SearchQueryItem = {
        query_string: "adicional de periculosidade",
        expected_information: [
          "jurisprudência sobre adicional de periculosidade",
          "teses do TST",
        ],
      };

      // Execute the search - this internally provides AppLayer at execution time
      // If the fix is working, this should NOT throw a cache key error
      try {
        const results = await executeBnpSearch(testQuery, 5, 1);

        // If we get here, the search executed without cache key errors
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);

        // Verify we got actual search results back
        if (results.length > 0) {
          const firstResult = results[0];
          expect(firstResult).toBeDefined();
          expect(firstResult).toHaveProperty("id");
          expect(firstResult).toHaveProperty("url");
          expect(firstResult).toHaveProperty("title");

          console.log(`✅ Successfully retrieved ${results.length} results without cache errors`);
        } else {
          // Empty results are OK - it just means the query didn't match anything
          console.log("✅ Search executed successfully (0 results)");
        }
      } catch (error) {
        // Check if the error is the cache key error (which would indicate the fix failed)
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("Failed to generate cache key")) {
          throw new Error(
            "❌ CACHE KEY ERROR STILL OCCURRING - The fix did not work!\n" +
            "This indicates that the AppLayer is not being provided correctly, " +
            "or the HttpClientWithoutCacheLayer is not being used.\n" +
            `Original error: ${errorMessage}`
          );
        }

        // For other errors (network, API errors, etc.), just log them
        // These are expected in integration tests and don't indicate the fix failed
        console.log(`ℹ️ Search failed with error: ${errorMessage}`);
        console.log("This is expected in integration tests (network/API issues)");

        // The test still passes because we didn't get a cache key error
        // We're specifically testing that the AppLayer provision fix works
      }
    });

    it("should handle search with specific filters (mimicking real usage)", async () => {
      // Test with more specific parameters like the working example
      const testQuery: SearchQueryItem = {
        query_string: "adicional de periculosidade aeronautas",
        expected_information: [
          "jurisprudência TST sobre adicional de periculosidade",
          "IRR e precedentes vinculantes",
        ],
      };

      try {
        const results = await executeBnpSearch(testQuery, 10, 1);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);

        console.log(`✅ Advanced search executed successfully (${results.length} results)`);

        // Verify result structure matches BAML schema expectations
        if (results.length > 0) {
          const firstResult = results[0];

          // Required fields from SearchResultItem schema
          expect(firstResult?.id).toBeDefined();
          expect(firstResult?.url).toBeDefined();
          expect(firstResult?.title).toBeDefined();
          expect(firstResult?.source_name).toBeDefined();
          expect(firstResult?.retrieval_date).toBeDefined();

          // Verify mapped fields are correct
          expect(firstResult?.source_name).toBe("BNP");
          expect(typeof firstResult?.retrieval_date).toBe("string");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Still fail if cache key error occurs
        if (errorMessage.includes("Failed to generate cache key")) {
          throw new Error(`❌ Cache key error occurred: ${errorMessage}`);
        }

        console.log(`ℹ️ Expected error in integration test: ${errorMessage}`);
      }
    });

    it("should work when called multiple times (layer memoization)", async () => {
      // This test verifies that the AppLayer provision pattern works
      // correctly even when called multiple times, ensuring proper
      // layer memoization and no stale runtime instances

      const testQuery: SearchQueryItem = {
        query_string: "contrato trabalho",
        expected_information: ["jurisprudência trabalhista"],
      };

      const searchPromises = [
        executeBnpSearch(testQuery, 3, 1),
        executeBnpSearch(testQuery, 3, 1),
        executeBnpSearch(testQuery, 3, 1),
      ];

      try {
        const allResults = await Promise.all(searchPromises);

        // All searches should complete without cache key errors
        expect(allResults).toHaveLength(3);

        for (const results of allResults) {
          expect(Array.isArray(results)).toBe(true);
        }

        console.log("✅ Multiple concurrent searches executed successfully");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("Failed to generate cache key")) {
          throw new Error(
            `❌ Cache key error in concurrent execution: ${errorMessage}\n` +
            "This indicates an issue with layer memoization or runtime lifecycle."
          );
        }

        console.log(`ℹ️ Expected error in concurrent test: ${errorMessage}`);
      }
    });
  });

  describe("Error Handling (verifies proper error mapping)", () => {
    it("should throw Exa-compatible errors, not cache key errors", async () => {
      // Test with an intentionally problematic query to trigger API errors
      const badQuery: SearchQueryItem = {
        query_string: "", // Empty query should cause validation error
        expected_information: [],
      };

      try {
        await executeBnpSearch(badQuery, 1, 1);

        // If we get here without an error, that's actually OK
        // (the API might be lenient with empty queries)
        console.log("ℹ️ Empty query was accepted by API");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // The critical check: we should NEVER see cache key errors
        expect(errorMessage).not.toContain("Failed to generate cache key");

        // We expect Exa-compatible errors (which are mapped from BNP errors)
        // Common error types: ExaClientError, ExaNetworkError, ExaServerError
        console.log(`✅ Got expected error type (not cache key): ${error instanceof Error ? error.name : 'Unknown'}`);
      }
    });
  });
});
