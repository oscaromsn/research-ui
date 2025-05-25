# 2.0. Implementation plan overview (high-level description of phases 1 to 5)

**The boilerplate contains the following:**

- **BAML Backend:**
	- All core BAML functions (`GenerateLegalSearchQueries`, `AnalyzeSingleDocument`, `SynthesizeAllFindings`, `AssessResearchAndPlanNextSteps`, `GenerateFinalLegalReport`) are defined.
	- All necessary BAML types (`LegalQueryAnalysis`, `SearchResultItem`, `AnalyzedDocument`, `OverallSynthesis`, `ResearchAssessment`, `FinalLegalReport`, `DetailedReasoning`, etc.) are defined with streaming annotations.
	- Client configurations (`QueryGeneration`, etc.) and retry policies are in place.
	- The BAML generator is correctly configured for `typescript/react`.
	- Basic test files exist for some functions (e.g., `1-generate_queries.test.baml`, `2-analyze_document.test.baml`).
- **Frontend UI Components:**
	- Basic layout (`Header`).
	- Domain-specific display components for different research stages (`GuidanceStrategy`, `EvidenceAnalysis`, `SynthesisReporting`, `ReportDrafter`).
	- Modal components (`SettingsModal`, `CaseModal`, `SynthesisReasoningModal`).
	- `ResearchLifecycle` component for visualizing progress.
	- These components currently use hardcoded data or simple local state and are *not yet connected* to any dynamic data flow from the BAML backend.
- **Missing Core Integration Pieces:**
	- The server-side `researchAgentOrchestrator.ts` (Server Action).
	- The client-side `useResearchAgent.ts` hook.
	- Jotai atoms for managing the research pipeline's state on the client (`lib/state/researchAtoms.ts`).

## Plan to properly implement the PRD :

Here's a breakdown of the necessary steps, referencing PRD sections:

**Phase 1: Implement the Server-Side Orchestrator (PRD 3.2)**

This is the most critical next step as it forms the backbone of the agentic logic and data streaming.

1. **FR2.1: Create `app/actions/researchAgentOrchestrator.ts`:**
	- Define the `conductResearch(legalQuestion: string): Promise<ReadableStream<Uint8Array>>` server action.
	- This function will house the entire BAML pipeline logic.

2. **FR2.2: Implement Stream Communication Protocol:**
	- Define the `ResearchStage` enum (PRD FR2.2.4) and the `ResearchUpdate` interface (PRD FR2.2.3) within this file.
		- `ResearchStage` should include stages like `IDLE`, `INITIALIZING`, `GENERATING_QUERIES`, `FETCHING_DOCUMENTS`, `ANALYZING_DOCUMENTS`, `SYNTHESIZING_FINDINGS`, `ASSESSING_RESEARCH`, `GENERATING_REPORT`, `HUMAN_REVIEW_REQUESTED`, `COMPLETED`, `ERROR`.
	- Implement the helper function `createStream()` (using `TransformStream`) and `sendUpdate()` to write `ResearchUpdate` objects to the stream as newline-separated JSON.

3. **FR2.3: Implement Initial Pipeline Execution Logic (Sequential Calls):**
	- **Step 1: `GenerateLegalSearchQueries` (FR2.3.1, FR1.1.1):**
		- Inside `conductResearch`, after sending an `INITIALIZING` status update.
		- Send a `STATUS_CHANGE` update for `GENERATING_QUERIES`.
		- Call `await b.GenerateLegalSearchQueries(legalQuestion)`.
		- Send a `DATA` update with a *client-friendly summary* of `LegalQueryAnalysis` (e.g., just the query strings and reasoning introduction). Mark as `isFinalForStage: true`.
	- **Step 2: `fetchDocumentsFromQueries` (Simulated - FR2.3.1, PRD 2.6):**
		- Send a `STATUS_CHANGE` update for `FETCHING_DOCUMENTS`.
		- Implement a *mock* `fetchDocumentsFromQueries(queries: SearchQueryItem[]): Promise<SearchResultItem[]>` function within the orchestrator. This is crucial for testing the rest of the pipeline. It should return a few mock `SearchResultItem` objects.
		- Send a `DATA` update with the count of fetched documents and perhaps their titles. Mark as `isFinalForStage: true`.
	- **Step 3: `AnalyzeSingleDocument` (Iterative - FR2.3.1, FR1.1.2):**
		- Send a `STATUS_CHANGE` update for `ANALYZING_DOCUMENTS`.
		- Loop through the (mocked) `searchResultItems`. For each:
			- Send a `LOG` update (e.g., "Analyzing document X of Y: [title]").
			- Call `await b.AnalyzeSingleDocument(doc, legalQuestion)`.
			- Send a `DATA` update with a *client-friendly summary* of the `AnalyzedDocument` (e.g., `docId`, `title`, `relevance_score`, a snippet of `summary`).
		- After the loop, send a `LOG` update like "All documents analyzed." with `isFinalForStage: true` for the data part related to this stage's primary output accumulation.
	- **Step 4: `SynthesizeAllFindings` (FR2.3.1, FR1.1.3):**
		- Send `STATUS_CHANGE` for `SYNTHESIZING_FINDINGS`.
		- Call `await b.SynthesizeAllFindings(analyzedDocs, legalQuestion)`.
		- Send `DATA` update with client-friendly `OverallSynthesis` (e.g., topic titles, short synthesis snippets, unanswered aspects). Mark `isFinalForStage: true`.
	- **Step 5: `AssessResearchAndPlanNextSteps` (FR2.3.1, FR1.1.4):**
		- Send `STATUS_CHANGE` for `ASSESSING_RESEARCH`.
		- Call `await b.AssessResearchAndPlanNextSteps(...)`.
		- Send `DATA` update with client-friendly `ResearchAssessment` (e.g., `is_sufficient`, `assessment_summary`, `next_action`). Mark `isFinalForStage: true`.
	- **Step 6: Simplified Iteration/Termination (FR2.5.1):**
		- Based on `ResearchAssessment.next_action`:
			- If `GENERATE_REPORT`: Proceed to next step.
			- If `REQUEST_HUMAN_REVIEW`: Send `STATUS_CHANGE` to `HUMAN_REVIEW_REQUESTED`, send relevant message.
			- For other actions (e.g., `REFINE_QUERIES`): Send a `LOG` update indicating the suggested action, then send `STATUS_CHANGE` to a stage like `ITERATION_PAUSED` (as defined in your `ResearchStage` enum). Then close the stream. (Full loop is out of scope for v1).
	- **Step 7: `GenerateFinalLegalReport` (FR2.3.1, FR1.1.5):**
		- Send `STATUS_CHANGE` for `GENERATING_REPORT`.
		- **Handle Streaming BAML Output (FR2.3.4):**
			- Call `finalReportStream = b.stream.GenerateFinalLegalReport(...)`.
			- Iterate `for await (const partialReport of finalReportStream)`.
			- Inside the loop, send `DATA` updates for streaming fields like `executive_summary` and `sections[i].content`. The `ResearchUpdate.data` payload should specify which field is being updated, e.g., `{ field: "executiveSummary", chunk: partialReport.executive_summary_chunk, isFieldComplete: false/true }`.
			- After the BAML stream completes, `const finalReportObject = await finalReportStream.getFinalResponse();`. Send a final `DATA` update with non-streamed fields or confirmation. Mark `isFinalForStage: true`.
	- **Final Status:** Send `STATUS_CHANGE` to `COMPLETED`.

4. **FR2.4: Implement Orchestrator Error Handling:**
	- Wrap BAML calls and significant logic blocks in `try...catch`.
	- On error, use `sendUpdate` to send an `ERROR` type `ResearchUpdate`.
	- Ensure `writer.close()` is called in a `finally` block to properly terminate the stream.

**Phase 2: Client-Side State Management (PRD 3.3)**

1. **FR3.1: Create `lib/state/researchAtoms.ts`:**
	- Define all Jotai atoms as specified: `researchStatusAtom`, `researchLogAtom`, `generatedQueriesAtom`, `analyzedDocsSummaryAtom`, `synthesisDetailsAtom`, `finalReportContentAtom`.
	- Use the initial states outlined in the PRD (e.g., `isLoading: false, stage: "IDLE"`).

2. **FR3.2: Define Client-Friendly Types:**
	- In the same `researchAtoms.ts` or a separate `types.ts`, define the `ClientSearchQuery`, `ClientAnalyzedDoc`, `ClientSynthesis`, `ClientFinalReport` interfaces. These will be simpler versions of the BAML types, tailored for display.

**Phase 3: Implement Client-Side Orchestrator Hook (PRD 3.4)**

1. **FR4.1: Create `lib/hooks/useResearchAgent.ts`:**
	- Implement the `useResearchAgent` hook.
	- It should use `useAtom` or `useSetAtom` for all the atoms defined in Phase 2.

2. **FR4.2: Implement Stream Handling:**
	- The `startResearch` function will call `await conductResearch(legalQuestion)`.
	- It will then get a `reader` from the stream and loop `while (true)` to read chunks.
	- Decode `Uint8Array` to string, split by newline, and parse each JSON string into a `ResearchUpdate` object.
	- Implement `AbortController` logic (FR4.4.1, FR4.4.2).

3. **FR4.3: Implement State Updates based on `ResearchUpdate`:**
	- Inside the stream reading loop, use a `switch(update.type)`:
		- `STATUS_CHANGE`: Update `researchStatusAtom.stage`, `researchStatusAtom.isLoading`, and `researchStatusAtom.message`.
		- `LOG`: Append `update.message` to `researchLogAtom`.
		- `DATA`: This is the core. Based on `update.stage` and `update.data`:
			- For `GENERATING_QUERIES`, update `generatedQueriesAtom`.
			- For `ANALYZING_DOCUMENTS`, append/update items in `analyzedDocsSummaryAtom`.
			- For `SYNTHESIZING_FINDINGS`, update `synthesisDetailsAtom`.
			- For `GENERATING_REPORT`, handle streaming text by appending chunks to the appropriate fields in `finalReportContentAtom` (e.g., `executiveSummary`, `sections[idx].content`).
		- `ERROR`: Update `researchStatusAtom.error` and set `isLoading` to false.
	- Ensure `startResearch` resets all data atoms (FR4.3.2).

**Phase 4: Integrate UI Components (PRD 3.5)**

This involves making the existing UI components dynamic by connecting them to the Jotai atoms and the `useResearchAgent` hook.

1. **FR5.2: `GuidanceStrategy.tsx`:**
	- Import and use `useResearchAgent`.
	- Get `legalQuestion` from a local `useState`.
	- Wire "Start Research" button to `agent.startResearch(legalQuestion)`.
	- Disable button and show loading states based on `agent.isLoading` and `agent.currentStage`.
	- Display errors from `agent.error`.
	- Render queries from `useAtomValue(generatedQueriesAtom)`.
	- Display agent assessment info from `useAtomValue(researchStatusAtom)` and potentially parts of `useAtomValue(synthesisDetailsAtom)`.

2. **FR5.6: `ResearchLifecycle.tsx`:**
	- Consume `useAtomValue(researchStatusAtom).stage` to update visual indicators.

3. **FR5.3: `EvidenceAnalysis.tsx`:**
	- Populate the `searchResults` list from `useAtomValue(analyzedDocsSummaryAtom)`.
	- The detail panel should display data for a selected document from this atom. For streaming fields (like summary), ensure progressive display.

4. **FR5.4 & FR5.5: `SynthesisReporting.tsx` & `ReportDrafter.tsx`:**
	- "Synthesis Studio" tab: Display data from `useAtomValue(synthesisDetailsAtom)`.
	- "Report Drafter" tab: Display data from `useAtomValue(finalReportContentAtom)`.
	- Crucially, text fields that are streamed (e.g., `executiveSummary`, `section.content`) need to be rendered in a way that updates as new chunks arrive (e.g., simply rendering the string from the Jotai atom which is being appended to by the hook).

5. **FR5.7: Modals:**
	- While the PRD prioritizes summaries in the main stream, consider if modals like `CaseModal` or `SynthesisReasoningModal` would eventually fetch *full* BAML objects if a user requests more detail (this would be a separate Server Action, not part of the main `conductResearch` stream to keep it lean). For v1, they can display the summarized/streamed data available in Jotai atoms.

**Phase 5: Testing and Refinement (PRD 6, NFRs)**

1. **BAML Tests:** Ensure existing `.test.baml` files pass. Add more as orchestrator logic is built out to cover edge cases for each BAML function.
2. **Frontend Interaction:** Manually test the end-to-end flow.
3. **Performance (NFR1):** Monitor UI responsiveness during streaming.
4. **Error Handling (NFR3.1):** Test how UI responds to errors sent by the orchestrator.
5. **Security (NFR4):** Verify sensitive logic remains server-side.

**Key Considerations During Implementation:**

- **Client-Friendly Data Structures:** The `ResearchUpdate.data` payload and the Jotai atom structures should be designed for easy consumption by React components. Avoid directly exposing complex, deeply nested BAML types to the UI if a simpler, flatter structure suffices for display.
- **Streaming Text Display:** For fields like `summary` or `report section content` that are streamed, the `useResearchAgent` hook will need to append chunks to the corresponding string in the Jotai atom. React components will re-render, showing the text build up.
- **Managing `isFinalForStage`:** Use this flag in `ResearchUpdate` to signal when the primary data output for a stage is complete. This can be useful for the UI to transition views or enable next steps.
- **Modularity of Orchestrator:** While `conductResearch` will be one large function initially, consider how it might be broken down internally if the pipeline becomes extremely complex or if true resumability is needed later.
- **External Dependencies:** The `fetchDocumentsFromQueries` simulation is a critical placeholder. Define its expected interface clearly.
- **`CLAUDE.md` and `biome.json`:** Adhere to the coding standards.

**Immediate Next Steps (Highly Prioritized):**

1. **Define `ResearchUpdate` and `ResearchStage` types** in `researchAgentOrchestrator.ts`.
2. **Implement the basic structure of `conductResearch` Server Action**, able to stream a simple `INITIALIZING` and then `COMPLETED` status.
3. **Create `researchAtoms.ts`** with `researchStatusAtom`.
4. **Implement `useResearchAgent.ts`** to call `conductResearch`, consume the basic stream, and update `researchStatusAtom`.
5. **Connect `GuidanceStrategy.tsx`** to `useResearchAgent` to trigger `startResearch` and display `currentStage` and `isLoading`.

Once this basic loop is established, incrementally add each BAML pipeline stage to the orchestrator and the corresponding data handling in `useResearchAgent` and Jotai atoms. This phased approach will make the development manageable.
