**Phase 4 Goal:** Connect all primary UI components (`GuidanceStrategy`, `EvidenceAnalysis`, `SynthesisReporting`, `ReportDrafter`, `ResearchLifecycle`, and Modals) to the Jotai state managed by the `useResearchAgent` hook. Ensure the UI dynamically reflects the research process, displays streamed data progressively, and handles loading/error states effectively.

**Underlying Principle:** Component tests (using React Testing Library and Vitest) will be written or updated for each component to verify its dynamic behavior when connected to various Jotai atom states. Manual E2E testing will be crucial for validating the overall flow and streaming UX.

---

### Pre-requisites for Phase 4:

1.  **Phase 1, 2, 3 Completion:**
    *   Server-side orchestrator (`conductResearch`) is functional and streams `ResearchUpdate` objects.
    *   Jotai atoms (`researchAtoms.ts`) are defined and can store all client-side research data.
    *   `useResearchAgent` hook is implemented and correctly updates Jotai atoms based on server streams.
2.  **Existing UI Components:** Basic static or mock-data-driven versions of UI components from `components/domain/` and `components/layout/` exist.
3.  **Testing Setup:** Vitest and React Testing Library are configured. `renderWithProviders` utility (from `__tests__/test-utils.tsx`) is available for testing components that consume Jotai atoms.
4.  **Branching:** Create a new feature branch for this phase (e.g., `feature/P4-ui-integration`).

---

### Step 1: Integrate `useResearchAgent` into the Main UI Orchestration Point

**Goal:** Establish the primary interaction point where research is initiated and global status is observed. This will likely be within or around `GuidanceStrategy.tsx` or a parent component managing the main research view.

*   **Task 4.1.1: Instantiate `useResearchAgent` and Connect Core Controls**
    *   **Action:** In the chosen top-level client component (e.g., `app/page.tsx`'s primary client child, or directly in `GuidanceStrategy.tsx` if it's the main controller), import and instantiate `useResearchAgent`.
    *   **Details:**
        *   `const agent = useResearchAgent();`
        *   Connect the "Start Research" button's `onClick` handler to `agent.startResearch(localLegalQuestionState)`.
        *   Connect an "Abort Research" button's `onClick` (visible when `agent.isLoading`) to `agent.abortResearch()`.
        *   Disable the legal question input and "Start Research" button when `agent.isLoading` is true.
        *   Display `agent.currentStage`, `agent.currentMessage`, and `agent.error` in a prominent global status area.
    *   **Test (Component Test for `GuidanceStrategy.tsx` or wrapper):**
        *   Mock `useResearchAgent` (using `vi.mock`).
        *   Simulate typing a legal question.
        *   Simulate clicking "Start Research"; assert `mockStartResearch` is called with the question.
        *   Simulate `isLoading: true`; assert input/button are disabled, abort button appears, and status messages are shown.
        *   Simulate clicking "Abort"; assert `mockAbortResearch` is called.
        *   Simulate an error state; assert error message is displayed.
    *   **Acceptance Criteria:**
        *   ✅ `useResearchAgent` is instantiated.
        *   ✅ User can input a legal question and initiate research via `agent.startResearch`.
        *   ✅ UI reflects `agent.isLoading`, `agent.currentStage`, `agent.currentMessage`, and `agent.error` states.
        *   ✅ Abort functionality is wired up.
        *   ✅ Component tests for these interactions pass.

*   **Task 4.1.2: Display `researchLogAtom` Content**
    *   **Action:** In a suitable part of the UI (e.g., within `GuidanceStrategy.tsx` or a dedicated logs panel), display the contents of `researchLogAtom`.
    *   **Details:**
        *   `const logs = useAtomValue(researchLogAtom);`
        *   Render `logs.map(log => <div key={...}>{log}</div>)`.
    *   **Test (Component Test / Manual E2E):**
        *   Mock `useResearchAgent` to simulate updates that would populate `researchLogAtom` (or run a short E2E test where the real hook populates it).
        *   Assert that log messages appear in the UI.
    *   **Acceptance Criteria:** ✅ Research logs are dynamically displayed as they are added to `researchLogAtom`.

**Checkpoint 4.1 (End of Main UI Orchestration Setup):** The application has a functional entry point for starting/aborting research, and global status/logs are visible. The UI now reacts to the basic states managed by `useResearchAgent`.

---

### Step 2: Integrate `ResearchLifecycle.tsx`

**Goal:** Make the `ResearchLifecycle` component dynamically reflect the current `researchStatusAtom.stage` and `isLoading` state.

*   **Task 4.2.1: Connect `ResearchLifecycle` to `researchStatusAtom`**
    *   **Action:** Modify `components/domain/guidance/research-lifecycle.tsx` to use `useAtomValue(researchStatusAtom)`.
    *   **Details:**
        *   The component already has logic to map `ResearchStage` to UI stages (Ideate, Plan, etc.) and determine `active`, `completed`, `pending` status.
        *   Ensure this logic correctly consumes `status.stage` and `status.isLoading` from the atom.
        *   The loading spinner on the active stage should only appear if `status.isLoading` is true *and* the current UI stage is the active one.
    *   **Test (Component Test for `ResearchLifecycle.tsx`):**
        *   Wrap the component with `JotaiProvider` in tests.
        *   Set various `researchStatusAtom` states (different stages, isLoading true/false, ERROR state).
        *   Assert that the correct lifecycle stage is highlighted as active/completed/pending.
        *   Assert the loading spinner appears/disappears correctly.
        *   Assert connector styling changes based on stage completion.
    *   **Acceptance Criteria:**
        *   ✅ `ResearchLifecycle` accurately visualizes the progression through `ResearchStage` values from `IDLE` to `COMPLETED` and `ERROR`.
        *   ✅ Active stage spinner behavior is correct.
        *   ✅ Component test passes for various states.

**Checkpoint 4.2 (End of Lifecycle Integration):** The `ResearchLifecycle` provides real-time visual feedback on the research pipeline's progress.

---

### Step 3: Integrate `GuidanceStrategy.tsx` for Dynamic Data Display

**Goal:** Ensure `GuidanceStrategy.tsx` dynamically displays generated search queries and agent assessment details.

*   **Task 4.3.1: Display Generated Search Queries**
    *   **Action:** Modify the "Generated Search Queries" section in `GuidanceStrategy.tsx` to display data from `generatedQueriesAtom`.
    *   **Details:**
        *   `const queries = useAtomValue(generatedQueriesAtom);`
        *   Map `queries` (which are `ClientSearchQuery[]`) to render each query string and its `expected_information_summary`.
        *   Handle empty state (no queries generated yet).
    *   **Test (Component Test for `GuidanceStrategy.tsx`):**
        *   Set `generatedQueriesAtom` to various states (empty, one query, multiple queries).
        *   Assert queries are rendered correctly or empty state is shown.
    *   **Acceptance Criteria:** ✅ Generated search queries are dynamically displayed as they populate `generatedQueriesAtom`.

*   **Task 4.3.2: Display Agent Assessment Details**
    *   **Action:** The "Agent Assessment" section needs to display data from the `ASSESSING_RESEARCH` stage. This likely requires a new Jotai atom.
    *   **Details:**
        1.  **Modify `researchAtoms.ts`:** Add `researchAssessmentAtom = atom<ClientResearchAssessment | null>(null);` (Define `ClientResearchAssessment` type if not already present, mirroring relevant fields from BAML `ResearchAssessment`). Update `resetResearchStateAtom` to reset it.
        2.  **Modify `useResearchAgent.ts`:** When a `DATA` update for `ASSESSING_RESEARCH` is received, populate `researchAssessmentAtom` with the client-friendly assessment data.
        3.  **Modify `GuidanceStrategy.tsx`:**
            *   `const assessment = useAtomValue(researchAssessmentAtom);`
            *   Display `assessment.assessmentSummary`, `assessment.nextAction`, `assessment.identifiedGaps`, `assessment.suggestedRefinementQueries` (if `assessment` is not null).
            *   The "View Assessment Reasoning" button could open a modal showing `assessment.reasoningSummary` (if client-friendly reasoning snippets are part of `ClientResearchAssessment`).
    *   **Test (Component Test for `GuidanceStrategy.tsx` & Unit Test for `useResearchAgent.ts`):**
        *   Hook Test: Simulate `ASSESSING_RESEARCH` `DATA` update. Assert `researchAssessmentAtom` is updated.
        *   Component Test: Set `researchAssessmentAtom` state. Assert assessment details are displayed.
    *   **Acceptance Criteria:**
        *   ✅ `researchAssessmentAtom` is created and populated by `useResearchAgent`.
        *   ✅ "Agent Assessment" section dynamically displays data from `researchAssessmentAtom`.

**Checkpoint 4.3 (End of GuidanceStrategy Integration):** `GuidanceStrategy` is fully dynamic for its primary data displays (queries, assessment).

---

### Step 4: Integrate `EvidenceAnalysis.tsx` for Dynamic Document Display

**Goal:** Ensure `EvidenceAnalysis.tsx` lists analyzed documents and shows details for a selected document, all sourced from Jotai atoms, including progressive text streaming.

*   **Task 4.4.1: Dynamic Document List and Selection**
    *   **Action:** Modify `EvidenceAnalysis.tsx` to use `analyzedDocsSummaryAtom` for the list and `selectedAnalyzedDocIdAtom` for selection.
    *   **Details:**
        *   `const analyzedDocs = useAtomValue(analyzedDocsSummaryAtom);`
        *   `const [selectedDocId, setSelectedDocId] = useAtom(selectedAnalyzedDocIdAtom);` (or `useAtomValue` and `useSetAtom` separately).
        *   Render `analyzedDocs`. `onClick` on a document item calls `setSelectedDocId(doc.docId)`.
        *   Highlight the selected document if `doc.docId === selectedDocId`.
    *   **Test (Component Test for `EvidenceAnalysis.tsx`):**
        *   Set `analyzedDocsSummaryAtom` with mock `ClientAnalyzedDoc` data. Assert list renders.
        *   Simulate clicking a document. Assert `selectedAnalyzedDocIdAtom` is updated and the correct item is highlighted.
    *   **Acceptance Criteria:** ✅ Document list is dynamic. Selection works and updates `selectedAnalyzedDocIdAtom`.

*   **Task 4.4.2: Dynamic Detail Panel and Streaming Text for Summaries**
    *   **Action:** The detail panel should display information for the `selectedDocument` (derived from `analyzedDocsSummaryAtom` and `selectedAnalyzedDocIdAtom`).
    *   **Details:**
        *   `const selectedDocument = useAtomValue(useMemo(() => atom(get => get(analyzedDocsSummaryAtom).find(d => d.docId === get(selectedAnalyzedDocIdAtom))), []));` (or a simpler derived atom if preferred).
        *   Display `selectedDocument.relevanceScore`, `selectedDocument.summarySnippet`, etc.
        *   **Streaming:** The `summarySnippet` (and other text fields like `keyArguments` if they are streamed as individual strings) will be updated progressively in `analyzedDocsSummaryAtom` by `useResearchAgent`. The UI should naturally re-render. Ensure the animated caret (`animate-caret-blink`) is applied to the end of actively streaming text fields.
    *   **Test (Component Test & Manual E2E):**
        *   Component Test: Set `selectedAnalyzedDocIdAtom` and provide corresponding `ClientAnalyzedDoc` data in `analyzedDocsSummaryAtom`. Assert details are shown. Simulate progressive updates to `summarySnippet` in the atom and verify UI re-renders with appended text and caret.
        *   Manual E2E: Observe summaries building up in real-time.
    *   **Acceptance Criteria:**
        *   ✅ Detail panel shows data for the selected document.
        *   ✅ Fields like `summarySnippet` update progressively with caret animation.

*   **Task 4.4.3: Integrate Extended Data and Modals**
    *   **Action:** Connect display of `keyArguments`, `extractedEntities` (with `getEntityStyle`), `extractedQuotes`, `fullText`, `counterArguments`. Wire up `AnalysisReasoningModal`.
    *   **Details:**
        *   Fetch these from the `selectedDocument` object.
        *   The "View Analysis Reasoning" button should open `AnalysisReasoningModal`, passing `selectedDocument.analysisReasoning` and `selectedDocument.title`.
        *   `CaseModal` (if used for full document view) should be populated with more data from `selectedDocument` if available (e.g., `selectedDocument.fullText`, `selectedDocument.title`, `selectedDocument.url`).
    *   **Test (Component Test):**
        *   Set `selectedAnalyzedDocIdAtom` and provide `ClientAnalyzedDoc` with all extended fields populated. Assert they are rendered.
        *   Simulate clicking "View Analysis Reasoning". Assert modal opens with correct data.
    *   **Acceptance Criteria:**
        *   ✅ All extended analysis fields are displayed from `selectedDocument`.
        *   ✅ `AnalysisReasoningModal` opens with correct, dynamic data.
        *   ✅ `CaseModal` (if applicable) shows more comprehensive data.

**Checkpoint 4.4 (End of EvidenceAnalysis Integration):** `EvidenceAnalysis` is fully dynamic, displaying real-time analysis results and supporting detailed inspection.

---

### Step 5: Integrate `SynthesisReporting.tsx` and `ReportDrafter.tsx`

**Goal:** Make the synthesis and report drafting sections fully dynamic, with progressive streaming of text.

*   **Task 4.5.1: Dynamic Synthesis Studio Tab**
    *   **Action:** In `SynthesisReporting.tsx`, connect the "Synthesis Studio" tab to `synthesisDetailsAtom`.
    *   **Details:**
        *   `const synthesis = useAtomValue(synthesisDetailsAtom);`
        *   Render `synthesis.topics` (title, synthesisSnippet, confidence, doc IDs). `synthesisSnippet` should stream with caret.
        *   Render `synthesis.unansweredAspects` and `synthesis.emergingQuestions`.
        *   "View Synthesis Reasoning" button opens `SynthesisReasoningModal` with `synthesis.reasoningSummary`.
    *   **Test (Component Test & Manual E2E):**
        *   Component Test: Set `synthesisDetailsAtom` to various states. Assert correct rendering. Simulate progressive updates to `synthesisSnippet`.
        *   Manual E2E: Observe synthesis topics and snippets building up.
    *   **Acceptance Criteria:**
        *   ✅ "Synthesis Studio" displays data from `synthesisDetailsAtom`.
        *   ✅ `synthesisSnippet` streams progressively with caret.
        *   ✅ `SynthesisReasoningModal` shows `reasoningSummary`.

*   **Task 4.5.2: Dynamic Report Drafter Tab**
    *   **Action:** In `ReportDrafter.tsx` (rendered by `SynthesisReporting.tsx`), connect to `finalReportContentAtom`.
    *   **Details:**
        *   `const report = useAtomValue(finalReportContentAtom);`
        *   Render `report.title` (ensure `editableTitle` local state correctly syncs if it's two-way bound or primarily driven by the atom for display and only locally for editing).
        *   Render `report.executiveSummary`, `report.sections[].content`, `report.conclusion`. All these text fields should stream progressively with carets.
        *   The "Document Structure" outline should dynamically update completion status based on whether `report.executiveSummary`, `section.content`, `report.conclusion` in the atom are non-empty.
    *   **Test (Component Test & Manual E2E):**
        *   Component Test: Set `finalReportContentAtom`. Assert rendering. Simulate progressive updates to text fields. Test editable title updates atom (if designed that way, or that atom updates reflect in input). Check document structure completion logic.
        *   Manual E2E: Observe full report drafting with all text fields streaming.
    *   **Acceptance Criteria:**
        *   ✅ `ReportDrafter` displays all data from `finalReportContentAtom`.
        *   ✅ All designated report text fields stream progressively with carets.
        *   ✅ "Document Structure" outline is dynamic.

**Checkpoint 4.5 (End of Synthesis/Report Integration):** Synthesis and Report sections are fully dynamic and showcase streaming capabilities.

---

### Step 6: General UI Polish and Final E2E Testing

**Goal:** Ensure overall UI coherence, all loading/error states are handled gracefully across components, and perform final E2E smoke tests.

*   **Task 4.6.1: Consistent Loading/Error/Empty States**
    *   **Action:** Review all integrated components (`GuidanceStrategy`, `EvidenceAnalysis`, `SynthesisReporting`, `ReportDrafter`).
    *   **Details:**
        *   Ensure each component correctly reflects global `isLoading` (e.g., showing skeletons, spinners, or disabled states).
        *   Ensure error messages from `researchStatusAtom.error` are displayed appropriately (e.g., a global banner or within relevant sections).
        *   Ensure components handle empty data states gracefully (e.g., "No queries generated yet," "No documents analyzed").
    *   **Acceptance Criteria:** ✅ UI provides consistent and clear feedback for loading, error, and empty data states across all relevant components.

*   **Task 4.6.2: Final End-to-End Manual Testing**
    *   **Action:** Perform comprehensive E2E tests covering the scenarios from Phase 2 (Task 2.4.3's E2E manual test), but now with all UI components fully integrated.
    *   **Details:**
        *   Scenario A (Happy Path, Full Report): Verify all UI sections populate correctly, lifecycle updates, streaming is smooth.
        *   Scenario B (Iteration Paused / Human Review): Verify UI clearly shows assessment and suggested next action, and pipeline stops.
        *   Scenario C (No Documents Found): Verify UI handles this, shows appropriate messages, and assessment stage is reached.
        *   Scenario D (LLM/BAML Error from Orchestrator): Verify UI shows clear error, `isLoading` is false.
        *   Scenario E (User Abort): Test aborting at different stages. Verify UI updates to aborted state and stream processing stops.
    *   **Acceptance Criteria:** ✅ All key user flows work as expected from UI initiation to final display (or error/abort state). Streaming is visually smooth.

**Checkpoint 4.6 (End of Phase 4):** LexiSynth is a fully interactive application. UI components dynamically reflect the state of the research pipeline, driven by real data (from live search) processed by BAML and managed by Jotai via `useResearchAgent`.

---

### Phase 4 Completion & Review:

1.  **Run All Tests:** `bun test` (Vitest unit/component tests) and `bun baml:test`.
2.  **Code Review:** Review all UI component changes, Jotai atom consumption, and `useResearchAgent` usage.
    *   Focus on correct state subscription, efficient rendering, prop drilling (minimize if possible by using atoms), and handling of streaming updates.
    *   Ensure UI is responsive and doesn't block on JavaScript execution during streaming.
3.  **Merge:** Merge the feature branch `feature/P4-ui-integration` into the main development branch.

**Phase 4 Acceptance Criteria (Overall):**

*   ✅ All UI components listed in PRD (FR5.2-FR5.7) are dynamically driven by Jotai state atoms updated by `useResearchAgent`.
*   ✅ UI correctly displays data for all stages: generated queries, analyzed document summaries (and details), synthesis, and final report.
*   ✅ Progressive text streaming is visually apparent and functional in all relevant UI sections (summaries, synthesis snippets, report content).
*   ✅ Loading, error, and empty states are handled gracefully and communicated clearly in the UI.
*   ✅ User interactions (starting research, aborting research, selecting documents) work as intended and trigger appropriate hook functions/atom updates.
*   ✅ The `ResearchLifecycle` component accurately reflects the live research stage.
*   ✅ Modals (`SettingsModal` is static, `CaseModal` and `AnalysisReasoningModal` display dynamic (potentially summarized for v1) data from selected items).
*   ✅ All relevant component tests pass.

This comprehensive plan for Phase 4 ensures that each UI piece is methodically connected to the underlying data flow, focusing on dynamic updates and a responsive user experience, especially for streamed content.
