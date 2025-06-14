**Phase 1 Goal:** Integrate a live search API (Exa Search, using the existing
`exaSearchUtil.ts`) into the server-side orchestrator (
`researchAgentOrchestrator.ts`), replacing the current mock document retrieval.
This will enable the pipeline to process real-world documents.

**Underlying Principle:** Each sub-task should, where possible, be accompanied
by a test (unit or integration) that defines its success, or be verifiable
through a specific logging/debugging output.

---

### Pre-requisites for Phase 1:

1. **Environment Setup:**
    * Ensure `.env.development.local` (or your local dev env file) exists and is
      configured with a valid `EXA_API_KEY`.
    * Verify that `lib/utils/exaSearchUtil.ts` is capable of making a basic
      successful call to Exa (perhaps by temporarily adding a simple test script
      or a `console.log` test within it).
2. **Branching:** Create a new feature branch for this phase (e.g.,
   `feature/P1-live-search-integration`).

---

### Step 1: Unit Test `exaSearchUtil.ts` (TDD Approach)

**Goal:** Ensure `exaSearchUtil.ts` is robust and correctly handles Exa API
interactions and data mapping before integrating it. The existing test file
`__tests__/lib/utils/exaSearchUtil.test.ts` is a good starting point and should
be enhanced.

* **Task 1.1.1: Verify API Key Handling in Tests**
    * **Action:** Confirm that `__tests__/lib/utils/exaSearchUtil.test.ts`
      correctly mocks or uses a test `EXA_API_KEY` from `.env.test` (as
      indicated by `vitest.config.ts` and `setupTests.ts`).
    * **Test:** Modify the test setup to temporarily undefine
      `process.env.EXA_API_KEY` and assert that `executeExaSearch` throws the
      expected "EXA_API_KEY environment variable is not set" error. Then restore
      it.
    * **Acceptance Criteria:** ✅ Test passes, confirming API key validation
      within `executeExaSearch`.

* **Task 1.1.2: Enhance Tests for `executeExaSearch` Request Construction**
    * **Action:** Expand tests in `__tests__/lib/utils/exaSearchUtil.test.ts` to
      cover more variations in how `executeExaSearch` constructs the Exa API
      request body.
    * **Details:**
        * Test with different `numResults`, `fetchFullText` (true/false), and
          `numHighlightSentences` (including 0) values.
        * Assert that the `axios.post` mock is called with the correctly
          structured `requestBody` for each variation, particularly the
          `contents` object.
    * **Acceptance Criteria:** ✅ Tests for various parameter combinations pass,
      verifying correct Exa request body construction.

* **Task 1.1.3: Enhance Tests for `executeExaSearch` Response Mapping**
    * **Action:** Ensure comprehensive testing of the mapping from
      `ExaApiResult` to `BamlSearchResultItem`.
    * **Details:**
        * Test with Exa responses that have missing optional fields (e.g., no
          `title`, no `author`, no `publishedDate`, empty `highlights`, no
          `text`).
        * Test with various `publishedDate` formats if Exa can return different
          ones (though it usually standardizes to "YYYY-MM-DD" or ISO8601).
        * Assert that `retrieval_date` is always a valid ISO8601 string.
        * Assert that `metadata` (like `exa_internal_id`, `exa_autoprompt`) is
          correctly populated.
        * Assert that `original_query` is correctly passed through.
    * **Acceptance Criteria:** ✅ Tests for various Exa response structures pass,
      ensuring robust mapping to `BamlSearchResultItem`.

* **Task 1.1.4: Test `executeExaSearch` Error Handling**
    * **Action:** Strengthen tests for Exa API error scenarios.
    * **Details:**
        * Mock `axios.post` to reject with different Axios error structures (
          e.g., 401, 403, 429, 500 status codes, different error response
          bodies).
        * Assert that `executeExaSearch` throws an error with an informative
          message including the status and Exa error details.
        * Test non-Axios errors as well.
    * **Acceptance Criteria:** ✅ `executeExaSearch` handles various API and
      network errors gracefully and throws descriptive errors.

**Checkpoint 1.1 (End of `exaSearchUtil.ts` hardening):** `exaSearchUtil.ts` is
thoroughly unit-tested and considered reliable for integration. All tests in
`__tests__/lib/utils/exaSearchUtil.test.ts` pass.

---

### Step 2: Integrate `executeExaSearch` into the Orchestrator

**Goal:** Replace the mocked document fetching logic with live calls to
`executeExaSearch`.

* **Task 1.2.1: Modify `researchAgentOrchestrator.ts` to Import and
  Use `executeExaSearch`**
    * **Action:** In `app/actions/researchAgentOrchestrator.ts`, import
      `executeExaSearch` from `lib/utils/exaSearchUtil.ts`.
    * **Details:**
        * Remove or comment out the existing `fetchDocumentsFromQueries` mock
          function.
        * In the "Stage 2: Fetch Documents" section of the `conductResearch`
          IIFE, replace the call to the mock with logic that uses
          `executeExaSearch`.
        * **Initial approach:** For simplicity, initially call
          `executeExaSearch` for just the *first* query from
          `queryAnalysis.search_queries`. Fetch a small number of results (e.g.,
          `numResults = 3`). This limits API calls during initial integration.
          ```typescript
          // Inside conductResearch, after Stage 1 (Query Generation)
          currentStage = "FETCHING_DOCUMENTS";
          await sendUpdate(writer, encoder, { /* ... */ });

          let searchResultItems: SearchResultItem[] = [];
          if (queryAnalysis.search_queries.length > 0) {
              try {
                  const firstQuery = queryAnalysis.search_queries[0];
                  console.log(`Orchestrator: Executing live search for query: "${firstQuery.query_string}"`);
                  // Define numResults, fetchFullText, numHighlightSentences for the call
                  const results = await executeExaSearch(firstQuery, 3, true, 2); 
                  searchResultItems.push(...results);
                  console.log(`Orchestrator: Live search yielded ${results.length} results for the first query.`);
              } catch (searchError: any) {
                  console.error("Orchestrator: Error during live search:", searchError.message);
                  await sendUpdate(writer, encoder, {
                      type: "ERROR",
                      stage: currentStage,
                      message: `Failed to fetch documents: ${searchError.message}`,
                  });
                  // Decide if to throw and halt, or continue with empty results.
                  // For now, continue with empty to test downstream.
                  searchResultItems = [];
              }
          }
          // ... proceed to send DATA update based on searchResultItems ...
          ```
    * **Acceptance Criteria:**
        * ✅ `executeExaSearch` is imported and called.
        * ✅ The orchestrator uses the results from `executeExaSearch`.
        * ✅ Basic logging within the orchestrator confirms live search
          execution.

* **Task 1.2.2: Initial Integration Test - Single Query Execution**
    * **Action:** Manually run the application UI. Enter a simple legal question
      that should generate a sensible first query for Exa.
    * **Details:**
        * Monitor server console logs for:
            * "Orchestrator: Executing live search for query: ..."
            * Logs from `exaSearchUtil.ts` (if any were added).
            * "Orchestrator: Live search yielded X results..."
        * Monitor client UI:
            * Does the `FETCHING_DOCUMENTS` stage complete?
            * Does the subsequent `ANALYZING_DOCUMENTS` stage receive a
              plausible number of documents (based on your `numResults` for
              `executeExaSearch`)?
            * Observe any errors streamed to the client.
    * **Acceptance Criteria:**
        * ✅ The application successfully executes a live search for one query.
        * ✅ The number of documents reported/analyzed matches `numResults` (or
          fewer if Exa returns less).
        * ✅ No unexpected errors during the search or subsequent (
          mocked-data-driven) analysis stages.

**Checkpoint 1.2 (End of Single Query Integration):** The orchestrator can
successfully fetch documents for *one* AI-generated query using the live Exa
API.

---

### Step 3: Expand to Multiple Queries and Refine Orchestrator Logic

**Goal:** Handle multiple search queries from BAML and aggregate their results.

* **Task 1.3.1: Implement Logic to Process Multiple Search Queries**
    * **Action:** Modify the "Stage 2: Fetch Documents" section in
      `researchAgentOrchestrator.ts` to iterate through a subset of
      `queryAnalysis.search_queries` and call `executeExaSearch` for each.
    * **Details:**
        * Decide on a strategy for how many queries to execute (e.g., top N
          queries, all queries up to a max). For now, let's say top 2-3 queries.
        * Decide on `numResults` per query (e.g., 2-3 results per query).
        * Aggregate results from all `executeExaSearch` calls into the
          `searchResultItems` array.
        * Implement basic de-duplication of `SearchResultItem` objects based on
          `item.id` (which is `item.url` in `exaSearchUtil`).
          ```typescript
          // ... inside "Stage 2: Fetch Documents" ...
          const MAX_QUERIES_TO_EXECUTE = 3;
          const RESULTS_PER_QUERY = 2;
          const allFetchedResults: SearchResultItem[] = [];
          const executedQueries = queryAnalysis.search_queries.slice(0, MAX_QUERIES_TO_EXECUTE);

          for (const query of executedQueries) {
              try {
                  console.log(`Orchestrator: Executing live search for query: "${query.query_string}"`);
                  const results = await executeExaSearch(query, RESULTS_PER_QUERY, true, 2);
                  allFetchedResults.push(...results);
                  console.log(`Orchestrator: Query "${query.query_string}" yielded ${results.length} results.`);
                  // Optional: send a PROGRESS update to client after each query search?
              } catch (searchError: any) {
                  console.error(`Orchestrator: Error during live search for query "${query.query_string}":`, searchError.message);
                  await sendUpdate(writer, encoder, {
                      type: "LOG", // Log as non-fatal for this query, pipeline can continue
                      stage: currentStage,
                      message: `Failed to fetch documents for query "${query.query_string}": ${searchError.message}`,
                  });
              }
          }

          // De-duplicate results
          const uniqueDocIds = new Set<string>();
          searchResultItems = allFetchedResults.filter(item => {
              if (!uniqueDocIds.has(item.id)) {
                  uniqueDocIds.add(item.id);
                  return true;
              }
              return false;
          });
          console.log(`Orchestrator: Total unique documents fetched: ${searchResultItems.length}`);
          // ... then send DATA update based on the de-duplicated searchResultItems ...
          ```
    * **Acceptance Criteria:**
        * ✅ Orchestrator iterates through the configured number of
          BAML-generated queries.
        * ✅ `executeExaSearch` is called for each of these queries.
        * ✅ Results are aggregated.
        * ✅ Basic de-duplication is performed.

* **Task 1.3.2: Update Orchestrator `DATA` Update for `FETCHING_DOCUMENTS`**
    * **Action:** Ensure the `DATA` update sent after fetching documents
      reflects the aggregated results.
    * **Details:**
        * The `data` payload should include the total count of unique documents
          fetched.
        * The `titles` array should list titles of these unique documents.
    * **Acceptance Criteria:** ✅ `DATA` update for `FETCHING_DOCUMENTS`
      accurately reflects the total unique documents found from all executed
      queries.

* **Task 1.3.3: Integration Test - Multiple Query Execution**
    * **Action:** Manually run the UI with legal questions that are likely to
      generate multiple distinct queries.
    * **Details:**
        * Observe server logs to confirm multiple calls to `executeExaSearch`.
        * Check client UI or logs to ensure the `FETCHING_DOCUMENTS` `DATA`
          update reports a count consistent with aggregated (and de-duplicated)
          results.
        * Verify that downstream stages (Analyze, Synthesize) process this
          aggregated list of documents.
    * **Acceptance Criteria:** ✅ Application correctly processes multiple search
      queries, aggregates results, de-duplicates, and passes the final list to
      the analysis stage.

**Checkpoint 1.3 (End of Multi-Query Integration):** The orchestrator robustly
fetches and aggregates documents from multiple AI-generated queries using the
live Exa API.

---

### Step 4: Robust Error Handling and Edge Cases for Search

**Goal:** Make the search integration resilient to common issues.

* **Task 1.4.1: Handle Exa API Rate Limits / Quota Issues**
    * **Action:** (Requires understanding Exa's specific error codes/messages
      for rate limits). Modify `exaSearchUtil.ts` or the orchestrator's error
      handling.
    * **Details:**
        * If `executeExaSearch` throws an error indicative of rate limiting (
          e.g., status 429):
            * The orchestrator should log this clearly.
            * It could implement a short delay and retry *once* for that
              specific query (simple retry).
            * Or, it could stop fetching for subsequent queries in the current
              `conductResearch` call and proceed with documents fetched so far.
            * Stream an informative `LOG` or `ERROR` update to the client.
    * **Test:** This is harder to test without actually hitting rate limits. Can
      be simulated by mocking `axios.post` in `exaSearchUtil.test.ts` to throw a
      429 error.
    * **Acceptance Criteria:** ✅ Orchestrator has a defined behavior for rate
      limit errors from Exa (e.g., logs, informs client, potentially retries
      minimally or halts further searches for the session).

* **Task 1.4.2: Handle Exa API Returning Zero Results for All Queries**
    * **Action:** Ensure the orchestrator handles the scenario where all
      executed Exa queries return zero results.
    * **Details:**
        * If `searchResultItems` is empty after all queries:
            * The `FETCHING_DOCUMENTS` `DATA` update should correctly show count
                0.
            * The orchestrator should send a specific `LOG` update like "No
              documents found for any of the executed search queries. Proceeding
              to assessment."
            * The `ANALYZING_DOCUMENTS` stage should be gracefully skipped.
            * The `SYNTHESIZING_FINDINGS` stage should be gracefully skipped.
            * `AssessResearchAndPlanNextSteps` should then be called with empty
              `analyzedDocs` and `current_synthesis: null`. Its prompt should
              guide it to suggest `NEW_QUERIES` or `REQUEST_HUMAN_REVIEW`.
    * **Test:** Use a legal question and/or modify `exaSearchUtil.ts` (or its
      mock in an integration test setup) to ensure Exa consistently returns zero
      results.
    * **Acceptance Criteria:** ✅ Pipeline handles zero search results
      gracefully, skips analysis/synthesis, and proceeds to assessment, likely
      leading to a suggestion for new queries or human review.

* **Task 1.4.3: Timeout for Exa Search Calls**
    * **Action:** Implement a timeout for individual `executeExaSearch` calls
      within `exaSearchUtil.ts` or in the orchestrator's calling loop.
    * **Details:**
        * Axios requests can have a `timeout` option. Set a reasonable timeout (
          e.g., 15-30 seconds) for each Exa API call.
        * If a call times out, `executeExaSearch` should throw an error, or the
          orchestrator should catch it.
        * The orchestrator should log the timeout for that specific query and
          continue to the next query or proceed with results gathered so far.
    * **Test:** Mock `axios.post` to simulate a delay longer than the timeout.
    * **Acceptance Criteria:** ✅ Individual search queries have a timeout;
      failure of one query due to timeout doesn't necessarily halt all searches
      if multiple queries are being run.

**Checkpoint 1.4 (End of Robust Error Handling):** The live search integration
is more resilient to common API issues like rate limits, zero results, and
timeouts.

---

### Phase 1 Completion & Review:

1. **Final Manual E2E Test:**
    * Run several diverse legal questions through the UI.
    * Observe the entire flow up to where `AssessResearchAndPlanNextSteps` makes
      a decision.
    * Verify server logs for Exa calls, number of results, and any errors.
    * Verify client UI for `ResearchUpdate` messages related to fetching and the
      number of documents.
2. **Code Review:** Review all changes made in `exaSearchUtil.ts` and
   `researchAgentOrchestrator.ts`.
    * Focus on clarity, error handling, correct use of `async/await`, and
      efficient data manipulation.
3. **Merge:** Merge the feature branch `feature/P1-live-search-integration` into
   the main development branch.

**Phase 1 Acceptance Criteria (Overall):**

* ✅ The `fetchDocumentsFromQueries` mock in `researchAgentOrchestrator.ts` is
  fully replaced by live calls to `executeExaSearch`.
* ✅ The orchestrator can execute multiple BAML-generated search queries via the
  Exa API.
* ✅ Results from multiple queries are aggregated and de-duplicated.
* ✅ Robust error handling for search API calls (including timeouts, rate limits,
  zero results) is implemented in the orchestrator.
* ✅ Client receives appropriate `STATUS_CHANGE`, `LOG`, `DATA`, and `ERROR`
  updates related to the document fetching stage.
* ✅ All relevant unit tests for `exaSearchUtil.ts` pass.
* ✅ The application, when run, successfully uses real search data to feed into
  the (currently BAML-driven but potentially still using some mock data
  downstream) `ANALYZING_DOCUMENTS` stage.

This detailed plan for Phase 1 provides specific, testable steps to integrate
the live search functionality, which is a cornerstone for the JurisConsulta
application.
