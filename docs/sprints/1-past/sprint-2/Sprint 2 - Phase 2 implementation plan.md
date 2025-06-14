**Phase 2 Goal:** Validate and refine all BAML functions (
`AnalyzeSingleDocument`, `SynthesizeAllFindings`,
`AssessResearchAndPlanNextSteps`, `GenerateFinalLegalReport`) using live
document data. Ensure the server orchestrator correctly handles their outputs
and that BAML tests reflect real-world scenarios.

**Underlying Principle:** TDD will be applied by first updating/creating
`.test.baml` files with scenarios based on expected live data characteristics,
then refining BAML prompts until these tests pass and the outputs are
qualitatively good. The orchestrator's data mapping to client-friendly formats
will also be reviewed.

---

### Pre-requisites for Phase 2:

1. **Phase 1 Completion:** Live search integration (e.g., Exa Search) is
   functional within `researchAgentOrchestrator.ts`.
2. **Access to Live Data Examples:** Have a few examples of `SearchResultItem`
   objects obtained from the live search API during Phase 1 testing. These will
   be invaluable for crafting realistic BAML tests.
3. **BAML Development Environment:** VSCode with the BAML extension fully
   operational for running BAML tests and previewing prompts.
4. **Branching:** Create a new feature branch for this phase (e.g.,
   `feature/P2-baml-pipeline-refinement`).

---

### Step 1: Validate and Refine `AnalyzeSingleDocument`

**Goal:** Ensure `AnalyzeSingleDocument` effectively processes diverse live
search results and produces high-quality structured analysis.

* **Task 2.1.1: Create Realistic BAML Test Cases for `AnalyzeSingleDocument`**
    * **Action:** Update `baml_src/functions/2-analyze_document.test.baml` using
      actual content from `SearchResultItem` objects obtained in Phase 1.
    * **Details:**
        * Select 3-5 diverse `SearchResultItem` examples (e.g., a relevant case
          law, a statute, a less relevant article, a document with sparse text,
          a very long document – truncated if necessary for the test args).
        * Manually craft the `args` block for each test case, populating
          `document` with the real data.
        * Define *expected characteristics* of the `AnalyzedDocument` output in
          `@@assert` clauses. This involves some manual pre-analysis of what the
          LLM *should* extract.
            * Example assertions:
                *
              `@@assert( {{ this.search_result_id == "actual_doc_id_from_live_data" }} )`
                * `@@assert( {{ this.relevance_score >= X }} )` (based on your
                  manual assessment)
                * `@@assert( {{ this.summary | length > Y }} )`
                *
              `@@assert( {{ "keyword_expected_in_summary" in (this.summary | lower) }} )`
                *
              `@@assert( {{ this.key_arguments_and_reasoning | length >= Z }} )`
                *
              `@@assert( {{ (this.extracted_entities | selectattr("name", "equalto", "SpecificExpectedEntity") | list | length) > 0 }} )`
                *
              `@@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )` (
              and for other reasoning steps)
    * **Acceptance Criteria:**
        * ✅ At least 3-5 new test cases in `2-analyze_document.test.baml` using
          structures similar to live `SearchResultItem` data.
        * ✅ `@@assert` clauses are defined for key output fields, reflecting
          realistic expectations for live data.

* **Task 2.1.2: Iteratively Refine `AnalyzeSingleDocument` Prompt**
    * **Action:** Run the BAML tests. Based on failures or suboptimal outputs,
      iteratively refine the prompt in
      `baml_src/functions/2-analyze_document.baml`.
    * **Details:**
        * Use the BAML VSCode extension's playground to run individual tests and
          inspect LLM outputs.
        * Focus on:
            * **Relevance & Confidence Scoring:** Is the LLM consistently
              assigning appropriate scores? Adjust prompt instructions if
              needed.
            * **Summary Quality:** Is the summary accurate, concise, and
              relevant to the `original_legal_question`?
            * **Extraction Accuracy:** Are key arguments, entities, and quotes
              being correctly identified and extracted? Are there
              hallucinations?
            * **Completeness of Reasoning:** Is the `DetailedReasoning` output
              sufficiently detailed and logical?
        * Prompt adjustments might include:
            * More specific instructions for each field.
            * Examples of good vs. bad extractions (few-shot examples within the
              prompt, if necessary, though BAML's schema-first approach often
              reduces this need).
            * Guidance on handling missing information in the source document.
            * Reinforcing the need to use the provided `{{ document.id }}` for
              `search_result_id`.
    * **Acceptance Criteria:**
        * ✅ All BAML tests for `AnalyzeSingleDocument` pass.
        * ✅ Qualitative review of LLM outputs in the playground shows good
          accuracy and adherence to the schema for diverse live document inputs.
        * ✅ Prompt changes are documented with reasons if significant.

* **Task 2.1.3: Review Orchestrator's Client-Friendly Mapping
  for `ANALYZING_DOCUMENTS`**
    * **Action:** In `researchAgentOrchestrator.ts`, review the `DATA` update
      for the `ANALYZING_DOCUMENTS` stage.
    * **Details:**
        * Ensure the fields being sent to the client (e.g., `docId`, `title`,
          `relevanceScore`, `summarySnippet`, `keyArguments`,
          `extractedEntities`, `analysisReasoning` summaries) are the most
          useful for immediate UI display and are robustly extracted from the (
          now more reliable) BAML `AnalyzedDocument` output.
        * Verify truncation logic for snippets/summaries is appropriate.
    * **Acceptance Criteria:** ✅ The client-friendly data structure for analyzed
      documents in the orchestrator accurately reflects the refined BAML output
      and is suitable for UI needs.

**Checkpoint 2.1 (End of `AnalyzeSingleDocument` Refinement):**
`AnalyzeSingleDocument` BAML function and its tests are robust for live data.
The orchestrator correctly maps its output for client consumption.

---

### Step 2: Validate and Refine `SynthesizeAllFindings`

**Goal:** Ensure `SynthesizeAllFindings` effectively synthesizes information
from multiple `AnalyzedDocument` objects derived from live data.

* **Task 2.2.1: Create Realistic BAML Test Cases for `SynthesizeAllFindings`**
    * **Action:** Update/create
      `baml_src/functions/3-synthesize_findings.test.baml` using collections of
      `AnalyzedDocument` outputs (or their key characteristics) obtained from
      running the refined `AnalyzeSingleDocument` on live data.
    * **Details:**
        * Create test scenarios:
            * Synthesizing 2-3 documents with **converging** findings.
            * Synthesizing 2-3 documents with **diverging/conflicting**
              findings.
            * Synthesizing documents where one is highly relevant and others are
              less so.
            * Synthesizing with an empty `analyzed_docs` array (as already
              present, but verify).
        * For the `args`, you'll provide an array of `AnalyzedDocument`
          structures. You can simplify these for the test if the full
          `AnalyzedDocument` is too verbose, focusing on the `summary`,
          `key_arguments_and_reasoning`, `extracted_entities`, and
          `relevance_score` fields.
        * Define `@@assert` clauses for `OverallSynthesis`:
            * `key_synthesized_topics | length` (e.g., expect 1-2 topics for
              converging, maybe more for diverging).
            * Content of `topic_title` and `synthesis` (e.g., keyword checks,
              length).
            * `supporting_document_ids` should correctly reference the input
              `search_result_id`s.
            * `confidence_score` for topics should reflect the input documents'
              relevance and convergence.
            * `unanswered_aspects` and `emerging_questions` should be populated
              logically.
    * **Acceptance Criteria:**
        * ✅ `3-synthesize_findings.test.baml` has test cases reflecting
          synthesis of live-data-like `AnalyzedDocument` collections.
        * ✅ Assertions validate the structure and logical content of
          `OverallSynthesis`.

* **Task 2.2.2: Iteratively Refine `SynthesizeAllFindings` Prompt**
    * **Action:** Run BAML tests and refine the prompt in
      `baml_src/functions/3-synthesize_findings.baml`.
    * **Details:**
        * Focus on:
            * **Theme Identification:** Is the LLM identifying meaningful
              overarching themes?
            * **Synthesis Quality:** Does the `synthesis` text accurately
              combine/contrast info from input docs?
            * **Confidence Scoring:** Does the guidance on confidence scoring in
              the prompt lead to reasonable scores?
            * **Gap Identification:** Are `unanswered_aspects` and
              `emerging_questions` relevant and insightful?
        * Prompt adjustments might involve clarifying instructions for
          identifying topics, weighting document relevance, or handling
          conflicting information.
    * **Acceptance Criteria:**
        * ✅ All BAML tests for `SynthesizeAllFindings` pass.
        * ✅ Qualitative review shows high-quality synthesis outputs.

* **Task 2.2.3: Review Orchestrator's Client-Friendly Mapping
  for `SYNTHESIZING_FINDINGS`**
    * **Action:** In `researchAgentOrchestrator.ts`, review the `DATA` update
      for the `SYNTHESIZING_FINDINGS` stage.
    * **Details:** Ensure the client-friendly mapping (e.g., `topics` with
      `synthesisSnippet`, `unansweredAspects`, `reasoningSummary`) is
      appropriate.
    * **Acceptance Criteria:** ✅ Client-friendly synthesis data structure is
      effective.

**Checkpoint 2.2 (End of `SynthesizeAllFindings` Refinement):**
`SynthesizeAllFindings` BAML function and its tests are robust. The orchestrator
correctly maps its output.

---

### Step 3: Validate and Refine `AssessResearchAndPlanNextSteps`

**Goal:** Ensure the agent's decision-making logic (
`AssessResearchAndPlanNextSteps`) is sound when fed with `LegalQueryAnalysis`
and `OverallSynthesis` derived from live data.

* **Task 2.3.1: Create Realistic BAML Test Cases
  for `AssessResearchAndPlanNextSteps`**
    * **Action:** Update `baml_src/core_loop.test.baml`. Use characteristics of
      `LegalQueryAnalysis` (from `GenerateLegalSearchQueries`) and
      `OverallSynthesis` (from the refined `SynthesizeAllFindings`) based on
      live data processing.
    * **Details:**
        * Craft test `args` that simulate different states of research
          completion:
            * Clearly sufficient synthesis (high confidence topics, few
              unanswered aspects).
            * Synthesis with clear gaps that suggest query refinement.
            * Synthesis where initial queries were poor, suggesting new queries.
            * Synthesis where documents are good but need deeper analysis.
            * Highly complex/conflicting synthesis suggesting human review.
        * For each test case, define `@@assert` clauses for the expected
          `ResearchAssessment` output:
            * `is_sufficient` (true/false).
            * `next_action` (the specific expected `NextActionType`).
            * `assessment_summary` (check for keywords indicating correct
              reasoning).
            * Conditional population of `suggested_queries_for_refinement` or
              `document_ids_for_deeper_analysis` based on the expected
              `next_action`.
    * **Acceptance Criteria:**
        * ✅ `core_loop.test.baml` has diverse test cases reflecting various
          research states derived from plausible live data outputs.
        * ✅ Assertions rigorously check the decision logic and conditional
          outputs.

* **Task 2.3.2: Iteratively Refine `AssessResearchAndPlanNextSteps` Prompt**
    * **Action:** Run BAML tests and refine the prompt in
      `baml_src/core_loop.baml`. This is critical as the prompt contains a
      complex decision tree.
    * **Details:**
        * Pay close attention to whether the LLM correctly follows the "
          MANDATORY decision tree" and "CRITICAL SUFFICIENCY STANDARD"
          instructions.
        * Test if the new "STEP A/B/C" logic (checking for "extensive research
          indicators" or "ineffectiveness indicators" in initial query
          reasoning) works as intended. This is a new addition to the prompt
          that needs verification.
        * If the LLM deviates, make the prompt instructions even more explicit
          or simplify the conditions.
        * Ensure the LLM correctly populates
          `suggested_queries_for_refinement` (with full `SearchQueryItem`
          structure) or `document_ids_for_deeper_analysis` when `next_action`
          dictates.
    * **Acceptance Criteria:**
        * ✅ All BAML tests for `AssessResearchAndPlanNextSteps` pass.
        * ✅ The LLM consistently adheres to the decision logic in the prompt
          across various test inputs.

* **Task 2.3.3: Review Orchestrator's Client-Friendly Mapping
  for `ASSESSING_RESEARCH`**
    * **Action:** Review the `DATA` update for the `ASSESSING_RESEARCH` stage in
      `researchAgentOrchestrator.ts`.
    * **Details:** Ensure client-friendly fields like `isSufficient`,
      `assessmentSummary`, `nextAction`, `identifiedGaps`,
      `suggestedRefinementQueries` (as strings) are correctly populated.
    * **Acceptance Criteria:** ✅ Client-friendly assessment data structure is
      effective.

**Checkpoint 2.3 (End of `AssessResearchAndPlanNextSteps` Refinement):** The
agent's decision-making BAML function is robust and makes logical choices based
on live-data-like inputs.

---

### Step 4: Validate and Refine `GenerateFinalLegalReport` (Streaming)

**Goal:** Ensure `GenerateFinalLegalReport` produces high-quality,
well-structured reports from live synthesis data, and that its streaming fields
are correctly handled by the orchestrator.

* **Task 2.4.1: Create Realistic BAML Test Cases for `GenerateFinalLegalReport`
  **
    * **Action:** Update `baml_src/functions/4-generate_final_report.test.baml`.
      Use `OverallSynthesis` structures (or key parts) derived from running
      `SynthesizeAllFindings` on live data.
    * **Details:**
        * Test with:
            * A simple, concise `OverallSynthesis`.
            * A complex `OverallSynthesis` with multiple topics and some
              unanswered aspects.
        * `@@assert` clauses for `FinalLegalReport`:
            * Presence and reasonable length of `report_title`,
              `executive_summary`, `sections`, `conclusion`.
            * `sections` array should have expected number of items based on
              input topics.
            * Check for keywords in content related to the input synthesis.
            * If `OverallSynthesis` had `unanswered_aspects`, assert that
              `limitations_and_caveats` or a specific section addresses these.
    * **Acceptance Criteria:**
        * ✅ `4-generate_final_report.test.baml` has test cases using realistic
          synthesis inputs.
        * ✅ Assertions cover report structure and key content elements.

* **Task 2.4.2: Iteratively Refine `GenerateFinalLegalReport` Prompt**
    * **Action:** Run BAML tests and refine the prompt in
      `baml_src/functions/4-generate_final_report.baml`.
    * **Details:**
        * Focus on:
            * **Report Structure:** Does the LLM follow the requested JSON
              schema?
            * **Content Quality:** Is the language professional, coherent, and
              well-reasoned? Does it accurately reflect the input
              `OverallSynthesis`?
            * **Streaming Behavior (Conceptual):** While BAML tests don't
              directly test streaming, ensure the prompt doesn't inhibit the LLM
              from generating content for fields like `executive_summary` or
              `sections[].content` in a way that would be streamable.
    * **Acceptance Criteria:**
        * ✅ All BAML tests for `GenerateFinalLegalReport` pass.
        * ✅ Qualitative review shows high-quality, well-structured report
          outputs.

* **Task 2.4.3: Validate Orchestrator's Handling of `GenerateFinalLegalReport`
  Stream**
    * **Action:** Perform an end-to-end manual test run through the UI that
      reaches the `GENERATING_REPORT` stage.
    * **Details:**
        * In `researchAgentOrchestrator.ts`, within the
          `for await (const partialReport of reportStream)` loop:
            * Add detailed `console.log(JSON.stringify(partialReport, null, 2))`
              to inspect the exact partial chunks BAML is yielding.
            * Verify that your logic for identifying `fieldName` (e.g., "
              executiveSummary", "sectionContent_0") and `isFieldComplete` from
              `partialReport` (which reflects BAML's `@stream.with_state`
              output) is correct.
            * Ensure `DATA` updates for streaming chunks are being sent
              correctly to the client.
        * On the client-side, verify (via UI or Jotai devtools) that
          `finalReportContentAtom` fields (`executiveSummary`,
          `sections[i].content`, `conclusion`) are being built up progressively.
    * **Acceptance Criteria:**
        * ✅ The orchestrator correctly consumes the BAML stream from
          `b.stream.GenerateFinalLegalReport`.
        * ✅ The orchestrator correctly identifies streaming fields and sends
          appropriate chunked `DATA` updates to the client with `fieldName` and
          `isFieldComplete` hints.
        * ✅ Client-side state (`finalReportContentAtom`) is updated
          progressively and accurately.

**Checkpoint 2.4 (End of `GenerateFinalLegalReport` Refinement):** The report
generation function is robust, and its streaming output is correctly processed
by the server orchestrator for client-side progressive display.

---

### Phase 2 Completion & Review:

1. **Run All BAML Tests:** Execute `bun baml:test` (or equivalent using the
   VSCode extension) and ensure all tests pass.
2. **Full Pipeline Manual Test:**
    * Execute the application from the UI with 2-3 different legal questions
      designed to test various paths (e.g., one straightforward, one leading to
      refinement needs, one complex).
    * Carefully observe the data being populated in each UI section (
      `GuidanceStrategy`, `EvidenceAnalysis`, `SynthesisReporting`,
      `ReportDrafter`).
    * Verify the quality and relevance of AI-generated content at each stage.
    * Verify streaming behavior for report generation.
3. **Code Review:** Review all BAML prompt changes and any minor adjustments to
   the orchestrator's data mapping logic.
    * Ensure prompts are clear, unambiguous, and robust against variations in
      live data.
    * Ensure BAML tests are comprehensive.
4. **Merge:** Merge the feature branch `feature/P2-baml-pipeline-refinement`
   into the main development branch.

**Phase 2 Acceptance Criteria (Overall):**

* ✅ All BAML functions (`AnalyzeSingleDocument`, `SynthesizeAllFindings`,
  `AssessResearchAndPlanNextSteps`, `GenerateFinalLegalReport`) have been tested
  and refined using inputs characteristic of live data.
* ✅ All associated `.test.baml` files are updated with realistic test cases and
  assertions, and all BAML tests pass.
* ✅ The server orchestrator (`researchAgentOrchestrator.ts`) correctly processes
  the (now more reliable) outputs from these BAML functions, including
  accurately handling BAML streams for report generation.
* ✅ Client-friendly data mappings in the orchestrator are confirmed to be
  effective for the refined BAML outputs.
* ✅ A manual end-to-end test demonstrates that live search data flows through
  the entire pipeline, resulting in a qualitatively acceptable (even if not
  perfect) final report draft being streamed to the UI.

This phase ensures the AI core of JurisConsulta is robust and tuned to handle
real-world data. The next phase (Phase 3 - `useResearchAgent` hook) would focus
on ensuring the client-side correctly processes these validated streams, and
Phase 4 would be UI integration. However, since the problem asks for Phase 1, 2,
3, 4, 5 in order, this detailed Phase 2 sets the stage for more reliable
client-side development.
