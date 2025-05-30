# 2.5. Implementation plan - Phase 5

Okay, Phase 5 focuses on Testing and Refinement. This is crucial for ensuring LexiSynth is robust, reliable, and meets the non-functional requirements outlined in the PRD. We'll leverage the testing strategies mentioned in `CLAUDE.md` and the PRD.

## Phase 5: Testing, Refinement, and Non-Functional Requirements

**Goal:** Ensure the LexiSynth application is well-tested, performs adequately, handles errors gracefully, and adheres to coding standards. This phase involves writing BAML tests, frontend unit/component tests, and conducting manual end-to-end testing, followed by refinements based on findings.

**Assumptions:**
- Phase 1 (Server-Side Orchestrator) is functionally complete.
- Phase 2 (Jotai Atoms) is defined.
- Phase 3 (`useResearchAgent` hook) is implemented.
- Phase 4 (UI Integration) is complete, with UI components connected to Jotai state.

---

### Step 5.1: BAML Function Testing (PRD 6.1)

**Action:** Write comprehensive `.test.baml` files for all BAML functions in `baml_src/functions/` and `baml_src/core_loop.baml`.

**Details:**

1. **Review Existing Tests:**
	- Examine `1-generate_queries.test.baml` and `2-analyze_document.test.baml`. Ensure they cover diverse scenarios.
2. **`GenerateLegalSearchQueries` Tests:**
	- Add tests for different types of legal questions: simple, complex, ambiguous, jurisdiction-specific.
	- Assert on the structure of `DetailedReasoning` (e.g., check that summaries are populated).
	- Assert on the quantity and quality of `SearchQueryItem[]` (e.g., expected number of queries, presence of keywords, correct use of Boolean operators if testable via regex on `query_string`).
3. **`AnalyzeSingleDocument` Tests:**
	- Expand on existing tests. Test with various `SearchResultItem` inputs:
		- Long vs. short `full_text`.
		- Missing `snippet` or `metadata`.
		- Different `source_name` and `type` (if these influence analysis).
	- Assert on `relevance_score` and `confidence_score` ranges for clearly relevant/irrelevant docs.
	- Assert on the presence and basic structure of `summary`, `key_arguments_and_reasoning`, `extracted_entities`, `extracted_quotes`.
	- Assert that `search_result_id` is correctly propagated.
4. **`SynthesizeAllFindings` Tests (`3-synthesize_findings.baml`):**
	- Create `3-synthesize_findings.test.baml`.
	- Test scenarios:
		- Synthesizing from 0, 1, and multiple (e.g., 3-5) `AnalyzedDocument` inputs.
		- Documents with converging findings.
		- Documents with diverging/conflicting findings.
		- Documents covering different aspects of the `original_legal_question`.
	- Assert on the structure of `OverallSynthesis`:
		- Presence of `key_synthesized_topics`.
		- Content of `synthesis` in `SynthesizedTopic` (e.g., length, keywords, reference to doc IDs).
		- Population of `unanswered_aspects` and `emerging_questions` when appropriate.
		- Presence of `DetailedReasoning`.
5. **`AssessResearchAndPlanNextSteps` Tests (`core_loop.baml`):**
	- Create `core_loop.test.baml`.
	- Test scenarios for each `NextActionType`:
		- Sufficient information -> `GENERATE_REPORT`.
		- Minor gaps -> `REFINE_QUERIES` (assert `suggested_queries_for_refinement` is populated).
		- Major gaps / ineffective queries -> `NEW_QUERIES` (assert `suggested_queries_for_refinement` is populated).
		- Relevant docs need more detail -> `DEEPER_ANALYSIS_OF_EXISTING_DOCS` (assert `document_ids_for_deeper_analysis` is populated).
		- Ambiguous/stuck -> `REQUEST_HUMAN_REVIEW`.
	- Test with `current_synthesis` being `null` (first pass).
	- Assert on `is_sufficient`, `assessment_summary`, and critically, the conditional population of fields based on `next_action` (PRD FR1.1.4 - "CRITICAL" note).
6. **`GenerateFinalLegalReport` Tests (`4-generate_final_report.baml`):**
	- Create `4-generate_final_report.test.baml`.
	- Test with varying `OverallSynthesis` inputs (e.g., few vs. many topics, with/without unanswered aspects).
	- Test with different `query_history` lengths.
	- Assert on the structure of `FinalLegalReport`:
		- Presence of `report_title`, `executive_summary`, `conclusion`.
		- Number and structure of `sections`.
		- Content of streaming fields (check for initial population, though full streaming behavior is tested end-to-end).
7. **Run All BAML Tests:** Use the BAML VSCode extension or `baml-cli test` (if available and configured) to run all tests.

**Acceptance Criteria 5.1:**
- ✅ Each BAML function in `functions/` and `core_loop.baml` has a corresponding `.test.baml` file.
- ✅ Each test file includes multiple test cases covering happy paths, edge cases (e.g., empty inputs, conflicting data), and different logical branches of the function's prompt.
- ✅ Assertions (`@@assert`) are used to validate the structure and key content of the BAML function outputs.
- ✅ All BAML tests pass.

---

### Step 5.2: Unit/Component Testing for Frontend Logic (PRD 6.2, 6.3)

**Action:** Write Vitest unit tests for critical utility functions, Jotai atom logic (if complex derived atoms exist), and the `useResearchAgent` hook. Write React Testing Library tests for key UI components.

**Details:**

1. **Utility Functions (e.g., in `lib/utils.ts`):**
	- If any complex data transformation or utility functions were created, write unit tests for them.
2. **Jotai Atoms (`lib/state/researchAtoms.ts`):**
	- For simple atoms, direct testing might be overkill. Focus on derived atoms if their logic is non-trivial.
	- Test the `resetResearchStateAtom`: ensure writing to it correctly resets all other dependent data atoms to their initial states. Use Jotai's testing utilities or render a component that uses the atoms.
3. **`useResearchAgent` Hook (`lib/hooks/useResearchAgent.ts`):** This is the most critical piece for frontend unit testing.
	- Create `lib/hooks/useResearchAgent.test.ts`.
	- **Mock `conductResearch` Server Action:** Use `vi.mock()` to mock the server action. The mock should return a `ReadableStream` that can be controlled in tests to simulate different `ResearchUpdate` sequences.

		```typescript
        // Example Mocking
        import { vi } from 'vitest';
        import { ReadableStream, WritableStream } from 'node:stream/web'; // Or appropriate stream mock

        const mockConductResearch = vi.fn();
        vi.mock('@/app/actions/researchAgentOrchestrator', () => ({
          conductResearch: mockConductResearch,
        }));

        function createMockStream(updates: ResearchUpdate[]) {
            const { readable, writable } = new TransformStream();
            const writer = writable.getWriter();
            const encoder = new TextEncoder();
            (async () => {
                for (const update of updates) {
                    await writer.write(encoder.encode(JSON.stringify(update) + '\n'));
                    await new Promise(r => setTimeout(r, 10)); // Simulate delay
                }
                await writer.close();
            })();
            return readable;
        }
        ```

	- **Test Scenarios:**
		- **Initial state:** Verify default return values of the hook.
		- **`startResearch` call:**
			- Assert `conductResearch` is called with the correct `legalQuestion`.
			- Assert `researchStatusAtom` is set to `INITIALIZING`, `isLoading: true`.
			- Assert `resetAllResearchState` is effectively called (all data atoms are reset).
		- **Stream Processing:**
			- Simulate a stream of `ResearchUpdate` objects from `mockConductResearch`.
			- For each type of `ResearchUpdate` (`STATUS_CHANGE`, `DATA`, `LOG`, `ERROR`, `PROGRESS`):
				- Verify the correct Jotai atoms are updated with the expected (client-friendly) data.
				- Test progressive appending of text for streaming fields (e.g., `finalReportContentAtom.executiveSummary`).
				- Test `researchLogAtom` accumulation.
				- Test updates to `researchStatusAtom` (stage, message, counters).
			- Simulate stream completion (`done: true`): Assert `researchStatusAtom` is `COMPLETED`, `isLoading: false`.
			- Simulate server-streamed `ERROR` update: Assert `researchStatusAtom.error` is set, `isLoading: false`.
		- **`abortResearch` call:**
			- Start research, then call `abortResearch`.
			- Verify the `AbortController.abort()` was called (might need to spy on it).
			- Verify stream processing stops and `researchStatusAtom` reflects abortion.
		- **Error during `conductResearch` call (before stream starts):** Assert `researchStatusAtom.error` is set.
4. **UI Components (React Testing Library - PRD 6.3):**
	- **`GuidanceStrategy.tsx`:**
		- Test initial rendering.
		- Test typing into the legal question input.
		- Test "Start Research" button click: ensure it calls the (mocked) `agent.startResearch`. Check button disabled state based on `agent.isLoading`.
		- Test display of generated queries from (mocked) Jotai atom state.
		- Test display of agent assessment from (mocked) Jotai atom state.
	- **`ResearchLifecycle.tsx`:**
		- Test that it renders different stages based on various `researchStatusAtom.stage` values provided via a mocked Jotai provider.
	- **`EvidenceAnalysis.tsx`:**
		- Test rendering of document list from mocked `analyzedDocsSummaryAtom`.
		- Test selection of a document and display of its details in the panel. Test progressive display of summary snippet.
	- **`SynthesisReporting.tsx` / `ReportDrafter.tsx`:**
		- Test display of synthesis topics from mocked `synthesisDetailsAtom`.
		- Test display of report content from mocked `finalReportContentAtom`. Test progressive display of text.
	- **Focus on Interactions & State-Driven Display:** Don't test exact styling, but test conditional rendering, disabled states, and text content based on Jotai atom values. Use `userEvent` for interactions.

**Acceptance Criteria 5.2:**
- ✅ Unit tests exist for `resetResearchStateAtom` logic.
- ✅ `useResearchAgent.ts` has comprehensive unit tests covering initialization, `startResearch` (including stream processing for all `ResearchUpdate` types and stages), `abortResearch`, and error handling. Mocking of `conductResearch` is effective.
- ✅ Key UI components (`GuidanceStrategy`, `EvidenceAnalysis`, `SynthesisReporting`, `ResearchLifecycle`) have component tests verifying they render correctly based on various Jotai states and that user interactions trigger expected calls to the `useResearchAgent` hook.
- ✅ All frontend unit and component tests pass (`pnpm test`).
- ✅ Test coverage meets targets specified in `CLAUDE.md` (e.g., 70%+ for critical paths).

**Checkpoint 1:**
- All BAML tests are written and passing.
- Core frontend logic (especially `useResearchAgent` and Jotai atom interactions) is unit-tested.
- Run `pnpm test:coverage` and review coverage report.

---

### Step 5.3: Manual End-to-End Testing and UX Refinement (NFR 1.2, 1.3, 3.1, 4.6.1, 4.6.2)

**Action:** Conduct thorough manual testing of the entire application flow, focusing on user experience, streaming responsiveness, error handling, and overall usability.

**Details:**

1. **Full Pipeline Test Scenarios:**
	- **Scenario A (Happy Path, Full Report):** Enter a legal question designed to make the (mocked or semi-mocked if BAML is fully live) `AssessResearchAndPlanNextSteps` choose `GENERATE_REPORT`.
		- Observe `ResearchLifecycle` updates.
		- Verify `GuidanceStrategy` shows queries, then assessment.
		- Verify `EvidenceAnalysis` populates with (mock) analyzed docs.
		- Verify `SynthesisReporting` shows synthesis.
		- Verify `ReportDrafter` shows the final report, with text fields streaming in.
		- Verify final `COMPLETED` status.
	- **Scenario B (Iteration Paused / Human Review):** Enter a question designed for `AssessResearchAndPlanNextSteps` to suggest `REFINE_QUERIES` or `REQUEST_HUMAN_REVIEW`.
		- Verify the pipeline stops at the assessment stage.
		- Verify UI clearly indicates the suggested next action and reason.
	- **Scenario C (No Documents Found):** Modify `fetchDocumentsFromQueries` mock to return an empty array.
		- Verify the pipeline handles this gracefully (e.g., proceeds to assessment, which then likely suggests new queries or human review).
		- Ensure no errors crash the UI.
	- **Scenario D (LLM/BAML Error):** Temporarily modify a BAML prompt to be invalid or force an error from a BAML function within the orchestrator.
		- Verify an error message is displayed clearly to the user in the UI.
		- Verify the `isLoading` state is false.
		- Verify the UI remains usable for starting a new research task.
	- **Scenario E (User Abort):** Start a long research task (simulate long BAML calls with `await new Promise(r => setTimeout(r, 5000))` in the orchestrator).
		- Click the "Abort Research" button at various stages.
		- Verify stream processing stops promptly on the client.
		- Verify UI updates to show an aborted state.
2. **Streaming Responsiveness (NFR 1.2, 1.3):**
	- Pay close attention to how text streams into `EvidenceAnalysis` (summaries), `SynthesisReporting` (synthesis), and `ReportDrafter` (report sections).
	- Is the text appearing progressively? Is the UI still interactive (scrolling, opening non-related modals) during these streams?
3. **UI Consistency and Clarity:**
	- Are all loading states, progress indicators, and error messages clear and consistent?
	- Is navigation between sections intuitive?
	- Do modals (`SettingsModal`, `CaseModal`, `SynthesisReasoningModal`) open correctly? (Content for Case/SynthesisReasoning might still be basic if not fully populated from dynamic data yet).
4. **Browser Compatibility:** Test on major browsers (Chrome, Firefox, Safari, Edge) if specified as a requirement beyond development browser.
5. **Responsiveness:** Check basic responsiveness on different screen sizes if this is a PRD requirement.

**Acceptance Criteria 5.3:**
- ✅ All major user flows (start research, view progress, view results, abort) work as expected.
- ✅ Streaming text updates are visibly progressive and do not block UI interactivity.
- ✅ Error states (LLM errors, network issues simulated via orchestrator) are handled gracefully and displayed to the user.
- ✅ The `ResearchLifecycle` component accurately reflects the live state of the research process.
- ✅ Abort functionality works reliably.

---

### Step 5.4: Code Review, Refinement, and Adherence to Standards (PRD 2.5, NFR 5.1)

**Action:** Review code against `CLAUDE.md` and `biome.json`. Refactor for clarity, performance, and maintainability. Address any linting or type-checking issues.

**Details:**

1. **Run Linters and Formatters:**
	- `pnpm lint` (as defined in `package.json`, which might run Biome or ESLint based on project setup – `CLAUDE.md` implies Biome is primary).
	- `pnpm format` (if a separate format script exists, or rely on Biome's format-on-save if configured).
2. **Type Checking:**
	- `pnpm typecheck` (runs `tsc --noEmit`). Resolve all TypeScript errors.
	- Pay special attention to `any` types; replace them with specific types as per `CLAUDE.md`.
3. **Code Review (Self or Peer):**
	- **Decoupling:** Is there a clean separation between UI, `useResearchAgent` hook, Jotai state, and the server action?
	- **Readability:** Is the code easy to understand? Are variable and function names clear?
	- **BAML Interaction:** Are BAML types correctly handled and mapped to client-friendly types?
	- **Error Handling:** Is error handling in the hook and orchestrator robust?
	- **Performance:** Any obvious performance bottlenecks in React components or state updates? (e.g., unnecessary re-renders).
	- **Security (NFR4):** Double-check that no sensitive BAML intermediate objects or control logic is exposed to the client beyond what's defined in `ResearchUpdate`.
4. **Refactor:** Based on review, refactor code. Examples:
	- Simplify complex logic in `useResearchAgent` if possible.
	- Improve efficiency of Jotai atom updates.
	- Ensure consistent error propagation.

**Acceptance Criteria 5.4:**
- ✅ `pnpm lint` passes with no errors/warnings (or justifiable exceptions).
- ✅ `pnpm typecheck` passes with no errors.
- ✅ Code adheres to naming conventions and style guidelines in `CLAUDE.md`.
- ✅ Key logic paths are reviewed for clarity, correctness, and performance.

---

### Step 5.5: Documentation Updates (PRD 7)

**Action:** Update any necessary inline documentation (JSDoc) and review `CLAUDE.md` if significant architectural patterns emerged or changed.

**Details:**

1. **JSDoc:** Add JSDoc comments to:
	- `useResearchAgent` hook (explaining its purpose, parameters, return values, and how it interacts with Jotai atoms).
	- Client-friendly types in `researchAtoms.ts`.
	- Key public functions/components.
2. **`CLAUDE.md` Review:** If the implementation of the "Research Agent Orchestrator" pattern or the Jotai state structure led to new established patterns for the project, consider if `CLAUDE.md` needs minor updates to reflect this for future AI-assisted development.
3. **(Optional) Internal `docs/`:** If maintaining detailed Markdown docs (like `todo-llm`), update relevant sections for the orchestrator, hook, and state management.

**Acceptance Criteria 5.5:**
- ✅ `useResearchAgent` hook and key types/atoms have clear JSDoc comments.
- ✅ `CLAUDE.md` is still accurate regarding the implemented architecture.

---

### Phase 5 Completion Criteria & Checkpoints:

1. **All Tests Pass:**
	- ✅ All BAML tests pass.
	- ✅ All Vitest unit/component tests pass (`pnpm test`).
	- ✅ Test coverage meets project targets.
2. **Manual E2E Validation:**
	- ✅ Key user flows are manually tested and work as expected, including streaming and error handling.
	- ✅ UI is responsive, and non-functional requirements related to performance and usability are met.
3. **Code Quality:**
	- ✅ Code is linted, type-checked, and formatted correctly.
	- ✅ Adherence to architectural principles (decoupling, server-side agent logic) is confirmed.
4. **Documentation:**
	- ✅ Essential code documentation (JSDoc) is in place.
5. **PRD Alignment:**
	- ✅ All relevant functional requirements (FR) from PRD sections 3.1-3.7 (as applicable to the implemented frontend flow) are met.
	- ✅ Key non-functional requirements (NFR) are addressed.

**Checkpoint 2 (Final for Phase 5):**
- The application is stable, well-tested, and performs according to initial expectations for v0.1.
- The core research pipeline is functional end-to-end from UI input to display of (potentially streamed) results and status.
- The codebase is clean and adheres to project standards.

This detailed plan for Phase 5 should guide the team through comprehensive testing and refinement, ensuring LexiSynth is a high-quality application ready for its initial use or further development iterations (like implementing the full agentic loop for query refinement).
