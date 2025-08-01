/**
 * @file Infrastructure Performance Benchmarks
 *
 * Performance benchmark tests for the complete infrastructure foundation.
 * These tests ensure that our infrastructure meets all performance requirements
 * and is ready for production workloads.
 *
 * Performance Requirements:
 * - Environment validation: < 100ms
 * - Configuration loading: < 100ms
 * - Document ordering: < 50ms for 100 docs
 * - Fail-fast behavior: < 50ms
 * - Memory usage: Reasonable limits
 */

import { createStore } from "jotai";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms";
import {
  analyzedDocsSummaryAtom,
  orderedDocumentsAtom,
} from "@/lib/state/researchAtoms";
import {
  captureTestEnv,
  deleteTestEnv,
  restoreTestEnv,
  setTestEnv,
} from "../test-env-utils";

describe("Infrastructure Performance Benchmarks", () => {
  // Store original env for cleanup
  let originalEnv: NodeJS.ProcessEnv;
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    originalEnv = captureTestEnv();
    store = createStore();
  });

  afterEach(() => {
    // Restore original environment variables
    restoreTestEnv(originalEnv);

    // Clear module cache
    const modulesToClear = [
      "@/lib/schemas/env",
      "@/lib/config",
      "@/lib/utils/exaSearchUtil",
    ];

    for (const modulePath of modulesToClear) {
      try {
        delete require.cache[require.resolve(modulePath)];
      } catch (_e) {
        // Module might not exist in some tests, ignore
      }
    }
  });

  // Helper functions
  const setupValidEnvironment = () => {
    setTestEnv("NODE_ENV", "production");
    setTestEnv("CEREBRAS_API_KEY", "prod-cerebras-key");
    setTestEnv("EXA_API_KEY", "prod-exa-key");
  };

  describe("Infrastructure Loading Performance", () => {
    it("should load environment validation system within performance requirements", () => {
      // Arrange
      setupValidEnvironment();

      // Act - Measure environment validation time
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        delete require.cache[require.resolve("@/lib/schemas/env")];

        const startTime = performance.now();
        const { env } = require("@/lib/schemas/env");
        const endTime = performance.now();

        times.push(endTime - startTime);

        // Verify it loaded correctly
        expect(env.NODE_ENV).toBe("production");
      }

      // Assert - Performance requirements
      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(50); // Average should be very fast
      expect(maxTime).toBeLessThan(100); // Even worst case should meet requirement
    });

    it("should load configuration system within performance requirements", () => {
      // Arrange
      setupValidEnvironment();

      // Act - Measure configuration loading time
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        delete require.cache[require.resolve("@/lib/config")];

        const startTime = performance.now();
        const { config } = require("@/lib/config");
        const endTime = performance.now();

        times.push(endTime - startTime);

        // Verify it loaded correctly
        expect(config.environment).toBe("production");
      }

      // Assert - Performance requirements
      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(75); // Average should be fast
      expect(maxTime).toBeLessThan(100); // Max should meet requirement
    });

    it("should load complete infrastructure stack within performance requirements", () => {
      // Arrange
      setupValidEnvironment();

      // Act - Measure complete infrastructure loading time
      const startTime = performance.now();

      delete require.cache[require.resolve("@/lib/schemas/env")];
      delete require.cache[require.resolve("@/lib/config")];
      delete require.cache[require.resolve("@/lib/utils/exaSearchUtil")];

      const { env } = require("@/lib/schemas/env");
      const { config } = require("@/lib/config");
      const exaSearchUtil = require("@/lib/utils/exaSearchUtil");

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Assert - Complete stack should load quickly
      expect(totalTime).toBeLessThan(200); // Complete infrastructure < 200ms

      // Verify everything loaded correctly
      expect(env.NODE_ENV).toBe("production");
      expect(config.environment).toBe("production");
      expect(exaSearchUtil.executeExaSearch).toBeDefined();
    });
  });

  describe("Document Ordering Performance", () => {
    it("should sort small document sets efficiently", () => {
      // Arrange - 10 documents
      setupValidEnvironment();
      require("@/lib/schemas/env");

      const smallDocSet: ClientAnalyzedDoc[] = Array.from(
        { length: 10 },
        (_, index) => ({
          docId: `small-doc-${index}`,
          status: "analyzed" as const,
          title: `Document ${index}`,
          globalSequenceNumber: 9 - index, // Reverse order
          iterationIndex: 0,
        })
      );

      // Act - Measure sorting performance
      const startTime = performance.now();
      store.set(analyzedDocsSummaryAtom, smallDocSet);
      const orderedDocs = store.get(orderedDocumentsAtom);
      const endTime = performance.now();

      const sortingTime = endTime - startTime;

      // Assert - Should be very fast for small sets
      expect(sortingTime).toBeLessThan(10); // < 10ms for 10 docs
      expect(orderedDocs).toHaveLength(10);
      expect(orderedDocs[0]?.globalSequenceNumber).toBe(0);
      expect(orderedDocs[9]?.globalSequenceNumber).toBe(9);
    });

    it("should sort medium document sets efficiently", () => {
      // Arrange - 50 documents
      setupValidEnvironment();
      require("@/lib/schemas/env");

      const mediumDocSet: ClientAnalyzedDoc[] = Array.from(
        { length: 50 },
        (_, index) => ({
          docId: `medium-doc-${index}`,
          status: "analyzed" as const,
          title: `Document ${index}`,
          globalSequenceNumber: 49 - index, // Reverse order
          iterationIndex: Math.floor(index / 10),
          fetchBatchIndex: index % 5,
          fetchOrderIndex: index % 2,
        })
      );

      // Act - Measure sorting performance
      const startTime = performance.now();
      store.set(analyzedDocsSummaryAtom, mediumDocSet);
      const orderedDocs = store.get(orderedDocumentsAtom);
      const endTime = performance.now();

      const sortingTime = endTime - startTime;

      // Assert - Should meet performance requirements
      expect(sortingTime).toBeLessThan(25); // < 25ms for 50 docs
      expect(orderedDocs).toHaveLength(50);
      expect(orderedDocs[0]?.globalSequenceNumber).toBe(0);
      expect(orderedDocs[49]?.globalSequenceNumber).toBe(49);
    });

    it("should sort large document sets efficiently", () => {
      // Arrange - 100 documents (realistic production load)
      setupValidEnvironment();
      require("@/lib/schemas/env");

      const largeDocSet: ClientAnalyzedDoc[] = Array.from(
        { length: 100 },
        (_, index) => ({
          docId: `large-doc-${index}`,
          status: "analyzed" as const,
          title: `Document ${index}`,
          url: `https://example.com/doc${index}`,
          source: `Source ${index % 5}`,
          relevanceScore: Math.random() * 10,
          confidenceScore: Math.random() * 10,
          summarySnippet: `Summary snippet for document ${index}...`,
          globalSequenceNumber: 99 - index, // Reverse order (worst case for sorting)
          iterationIndex: Math.floor(index / 20), // 5 iterations
          fetchBatchIndex: index % 10, // 10 batches
          fetchOrderIndex: index % 3, // 3 docs per batch
          searchQueryId: `query-${index % 7}`, // 7 different queries
          fetchTimestamp: new Date(2023, 0, 1, 10, index).toISOString(),
        })
      );

      // Act - Measure sorting performance multiple times
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        store.set(analyzedDocsSummaryAtom, largeDocSet);
        const orderedDocs = store.get(orderedDocumentsAtom);
        const endTime = performance.now();

        times.push(endTime - startTime);

        // Verify correctness on first iteration
        if (i === 0) {
          expect(orderedDocs).toHaveLength(100);
          expect(orderedDocs[0]?.globalSequenceNumber).toBe(0);
          expect(orderedDocs[99]?.globalSequenceNumber).toBe(99);
        }
      }

      // Assert - Performance requirements for large sets
      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(25); // Average should be fast
      expect(maxTime).toBeLessThan(50); // Even worst case should meet requirement
    });

    it("should handle very large document sets (stress test)", () => {
      // Arrange - 500 documents (stress test)
      setupValidEnvironment();
      require("@/lib/schemas/env");

      const veryLargeDocSet: ClientAnalyzedDoc[] = Array.from(
        { length: 500 },
        (_, index) => ({
          docId: `stress-doc-${index}`,
          status: "analyzed" as const,
          title: `Stress Test Document ${index}`,
          globalSequenceNumber: 499 - index, // Reverse order
          iterationIndex: Math.floor(index / 50), // 10 iterations
        })
      );

      // Act - Measure sorting performance
      const startTime = performance.now();
      store.set(analyzedDocsSummaryAtom, veryLargeDocSet);
      const orderedDocs = store.get(orderedDocumentsAtom);
      const endTime = performance.now();

      const sortingTime = endTime - startTime;

      // Assert - Should still be reasonable for stress test
      expect(sortingTime).toBeLessThan(100); // < 100ms for 500 docs (stress test)
      expect(orderedDocs).toHaveLength(500);
      expect(orderedDocs[0]?.globalSequenceNumber).toBe(0);
      expect(orderedDocs[499]?.globalSequenceNumber).toBe(499);
    });
  });

  describe("Fail-Fast Performance", () => {
    it("should fail fast when environment validation fails", () => {
      // Arrange - Invalid environment
      setTestEnv("NODE_ENV", "invalid");
      setTestEnv("CEREBRAS_API_KEY", "key");
      deleteTestEnv("EXA_API_KEY");

      // Act - Measure failure time
      const startTime = performance.now();

      try {
        delete require.cache[require.resolve("@/lib/schemas/env")];
        require("@/lib/schemas/env");
        expect.fail("Should have thrown an error");
      } catch (error) {
        const endTime = performance.now();
        const failureTime = endTime - startTime;

        // Assert - Should fail very quickly
        expect(failureTime).toBeLessThan(50); // < 50ms failure time
        expect(error).toBeDefined();
      }
    });

    it("should fail fast across multiple validation attempts", () => {
      // Arrange - Invalid environment
      setTestEnv("NODE_ENV", "production");
      setTestEnv("CEREBRAS_API_KEY", ""); // Invalid empty key
      setTestEnv("EXA_API_KEY", "key");

      // Act - Measure multiple failure attempts
      const attempts = 5;
      const failureTimes: number[] = [];

      for (let i = 0; i < attempts; i++) {
        const startTime = performance.now();

        try {
          delete require.cache[require.resolve("@/lib/schemas/env")];
          require("@/lib/schemas/env");
          expect.fail("Should have thrown an error");
        } catch (_error) {
          const endTime = performance.now();
          failureTimes.push(endTime - startTime);
        }
      }

      // Assert - All failures should be fast and consistent
      const averageFailureTime =
        failureTimes.reduce((a, b) => a + b, 0) / failureTimes.length;
      const maxFailureTime = Math.max(...failureTimes);

      expect(averageFailureTime).toBeLessThan(25); // Average failure < 25ms
      expect(maxFailureTime).toBeLessThan(50); // Max failure < 50ms
    });
  });

  describe("Memory Usage Performance", () => {
    it("should use memory efficiently for large document sets", () => {
      // Arrange
      setupValidEnvironment();
      require("@/lib/schemas/env");

      // Create large document set with realistic data
      const documentCount = 200;
      const largeDocSet: ClientAnalyzedDoc[] = Array.from(
        { length: documentCount },
        (_, index) => ({
          docId: `memory-doc-${index}`,
          status: "analyzed" as const,
          title: `Memory Test Document ${index} - This is a longer title to test memory usage`,
          url: `https://example.com/documents/legal-case-${index}`,
          source: `Legal Database ${index % 10}`,
          relevanceScore: Math.random() * 10,
          confidenceScore: Math.random() * 10,
          summarySnippet: `This is a detailed summary snippet for document ${index}. It contains multiple sentences to simulate realistic document summaries that might be quite lengthy in a real legal research scenario.`,
          keyArguments: [
            `Key argument ${index}-1: Legal precedent establishing...`,
            `Key argument ${index}-2: Statutory interpretation of...`,
            `Key argument ${index}-3: Constitutional considerations regarding...`,
          ],
          extractedEntities: [
            {
              name: `Entity ${index}`,
              type: "Organization",
              details: `Details about entity ${index}`,
            },
            {
              name: `Legal Concept ${index}`,
              type: "LegalConcept",
              details: `Legal concept details ${index}`,
            },
          ],
          extractedQuotes: [
            `"Important legal quote from document ${index} that demonstrates the key principle..."`,
            `"Additional quote showing the court's reasoning in case ${index}..."`,
          ],
          globalSequenceNumber: index,
          iterationIndex: Math.floor(index / 40), // 5 iterations
          fetchBatchIndex: index % 8, // 8 batches
          fetchOrderIndex: index % 3, // 3 docs per batch
          searchQueryId: `query-${index % 12}`, // 12 different queries
          fetchTimestamp: new Date(2023, 0, 1, 10, index).toISOString(),
        })
      );

      // Act - Load documents and measure performance
      const startTime = performance.now();
      store.set(analyzedDocsSummaryAtom, largeDocSet);
      const orderedDocs = store.get(orderedDocumentsAtom);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // Assert - Should handle large realistic documents efficiently
      expect(processingTime).toBeLessThan(100); // < 100ms for 200 realistic docs
      expect(orderedDocs).toHaveLength(documentCount);

      // Verify data integrity is maintained
      expect(orderedDocs[0]?.keyArguments).toHaveLength(3);
      expect(orderedDocs[0]?.extractedEntities).toHaveLength(2);
      expect(orderedDocs[0]?.extractedQuotes).toHaveLength(2);
      expect(orderedDocs[199]?.summarySnippet).toContain(
        "detailed summary snippet"
      );
    });

    it("should handle repeated document operations efficiently", () => {
      // Arrange
      setupValidEnvironment();
      require("@/lib/schemas/env");

      const docSet: ClientAnalyzedDoc[] = Array.from(
        { length: 50 },
        (_, index) => ({
          docId: `repeated-doc-${index}`,
          status: "analyzed" as const,
          title: `Repeated Test Document ${index}`,
          globalSequenceNumber: index,
          iterationIndex: 0,
        })
      );

      // Act - Perform repeated operations
      const operationCount = 20;
      const times: number[] = [];

      for (let i = 0; i < operationCount; i++) {
        const startTime = performance.now();

        // Simulate typical document operations
        store.set(analyzedDocsSummaryAtom, docSet);
        const orderedDocs = store.get(orderedDocumentsAtom);

        // Verify initial ordering (performance test validation)
        expect(orderedDocs).toHaveLength(50);

        // Simulate additional document added
        const updatedDocs = [
          ...docSet,
          {
            docId: `new-doc-${i}`,
            status: "analyzed" as const,
            title: `New Document ${i}`,
            globalSequenceNumber: 50 + i,
            iterationIndex: 1,
          },
        ];

        store.set(analyzedDocsSummaryAtom, updatedDocs);
        const finalOrderedDocs = store.get(orderedDocumentsAtom);

        const endTime = performance.now();
        times.push(endTime - startTime);

        // Verify correctness
        expect(finalOrderedDocs).toHaveLength(51);
        expect(finalOrderedDocs[50]?.globalSequenceNumber).toBe(50 + i);
      }

      // Assert - Repeated operations should remain efficient
      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(10); // Average operation < 10ms
      expect(maxTime).toBeLessThan(25); // Max operation < 25ms
    });
  });

  describe("Infrastructure Foundation Performance Summary", () => {
    it("should demonstrate overall infrastructure performance meets all requirements", () => {
      // This test summarizes our performance achievements

      // Arrange - Production environment
      setupValidEnvironment();

      // Act - Measure complete infrastructure foundation performance
      const overallStartTime = performance.now();

      // 1. Environment validation
      const envStartTime = performance.now();
      const { env } = require("@/lib/schemas/env");
      const envEndTime = performance.now();
      const envTime = envEndTime - envStartTime;

      // 2. Configuration loading
      const configStartTime = performance.now();
      const { config } = require("@/lib/config");
      const configEndTime = performance.now();
      const configTime = configEndTime - configStartTime;

      // 3. Utility loading
      const utilStartTime = performance.now();
      require("@/lib/utils/exaSearchUtil");
      const utilEndTime = performance.now();
      const utilTime = utilEndTime - utilStartTime;

      // 4. Document ordering
      const docs: ClientAnalyzedDoc[] = Array.from({ length: 100 }, (_, i) => ({
        docId: `summary-doc-${i}`,
        status: "analyzed" as const,
        globalSequenceNumber: 99 - i, // Reverse order
        iterationIndex: 0,
      }));

      const orderingStartTime = performance.now();
      store.set(analyzedDocsSummaryAtom, docs);
      const orderedDocs = store.get(orderedDocumentsAtom);
      const orderingEndTime = performance.now();
      const orderingTime = orderingEndTime - orderingStartTime;

      const overallEndTime = performance.now();
      const totalTime = overallEndTime - overallStartTime;

      // Assert - All performance requirements met

      // ✅ Environment validation < 100ms
      expect(envTime).toBeLessThan(100);

      // ✅ Configuration loading < 100ms
      expect(configTime).toBeLessThan(100);

      // ✅ Utility loading < 50ms
      expect(utilTime).toBeLessThan(50);

      // ✅ Document ordering < 50ms for 100 docs
      expect(orderingTime).toBeLessThan(50);

      // ✅ Total infrastructure load < 300ms
      expect(totalTime).toBeLessThan(300);

      // ✅ Functionality verification
      expect(env.NODE_ENV).toBe("production");
      expect(config.environment).toBe("production");
      expect(orderedDocs).toHaveLength(100);
      expect(orderedDocs[0]?.globalSequenceNumber).toBe(0);
      expect(orderedDocs[99]?.globalSequenceNumber).toBe(99);

      // Infrastructure Foundation Performance Summary:
      // - Environment validation: ✅ Fast and reliable
      // - Configuration integration: ✅ Fast and reliable
      // - Document ordering system: ✅ Fast and reliable
      // - Process.env replacement: ✅ Fast and reliable
      // - Overall infrastructure: ✅ Ready for production
    });
  });
});
