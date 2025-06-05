## Realtime Streaming Fix: Implementation Plan

**1. Expected Behavior vs. Current Situation & Cause**

*   **Expected Behavior:**
    As the Language Model (LLM) generates text for fields marked with `@stream.with_state` (e.g., `FinalLegalReport.executive_summary`, `LegalReportSection.content`, `OverallSynthesis.key_synthesized_topics[].synthesis`, `ResearchAssessment.assessment_summary`), the frontend UI elements bound to these fields should update in realtime, progressively displaying the text as it's being generated token by token (or chunk by chunk). A visual indicator, like a blinking caret, should appear at the end of the streaming text.

*   **Current Situation:**
    Frontend elements displaying these potentially long text fields do not update progressively. Instead, they remain blank or show placeholder text while the LLM is generating, and then suddenly display the entire fully generated text once the LLM call for that function (e.g., `GenerateFinalLegalReport`) is complete. This gives the appearance that streaming is not happening in realtime.

*   **Root Cause:**
    The BAML runtime correctly streams partial objects, where fields annotated with `@stream.with_state` have a `value` property representing the *entire accumulated string for that field up to that point*. The server-side orchestrator (`researchAgentOrchestrator.ts`) correctly relays this full accumulated string as a "chunk" in `ResearchUpdate` objects. However, the client-side hook (`useResearchAgent.ts`) in its update logic for these streaming fields (e.g., in `updateExecutiveSummary`, `updateExistingSection`, `updateConclusionAndMetadata`), incorrectly **appends** this received "chunk" (which is already the full current field value) to the *previous full current field value* stored in the Jotai atom. This results in duplicated and rapidly growing incorrect text in the atom (e.g., "A" -> "AAB" -> "AABABC"). This mangled text is only corrected when the *final, complete* object for that BAML function call is received and overwrites the atom, leading to the perception of no realtime streaming.

**2. Goal of the Fix**

To modify the client-side `useResearchAgent.ts` hook so that it correctly processes the streamed "chunks" (which are actually full current field values from BAML) by **replacing** (instead of appending) the corresponding field in the Jotai state atoms. This will ensure the UI accurately reflects the progressive generation of text in realtime.

**3. Step-by-Step Implementation Plan**

This plan focuses on modifying `lib/hooks/useResearchAgent.ts`.

---

**Phase 1: Modify `useResearchAgent.ts` for Correct Streaming Text Updates**

*   **File to Modify:** `lib/hooks/useResearchAgent.ts`
*   **Functions to Modify:** `updateExecutiveSummary`, `updateExistingSection` (within `updateReportSections`), `addNewSection` (for initial content of a new section), `updateConclusionAndMetadata` (within `handleReportUpdate` which is called by `processStreamUpdate`). Potentially also `handleSynthesisUpdate` if `ClientSynthesisTopic.synthesisSnippet` also exhibits this issue.

**Step 3.1: Correct `updateExecutiveSummary` Logic**

*   **Locate:** The `updateExecutiveSummary` `useCallback` within `useResearchAgent.ts`.
*   **Current Logic (Problematic):**
    ```typescript
    if (reportData.executive_summary_chunk) {
      newReport.executiveSummary =
        (newReport.executiveSummary || "") + // Incorrectly refers to newReport here, should be prevReport if appending
        reportData.executive_summary_chunk;
    }
    if (reportData.executiveSummary) { // For final full value
      newReport.executiveSummary = reportData.executiveSummary;
    }
    ```
*   **Proposed Change:** Since `reportData.executive_summary_chunk` is the full current value of the field, directly assign it.
*   **New Logic:**
    ```typescript
    const updateExecutiveSummary = useCallback(
      (reportData: ReportData, newReport: ClientFinalReport) => { // newReport is a mutable copy of the previous state
        if (reportData.executive_summary_chunk !== undefined) {
          // If a chunk is present, it's the latest full state of this field.
          newReport.executiveSummary = reportData.executive_summary_chunk; // REPLACE
        } else if (reportData.executiveSummary !== undefined) {
          // This branch handles the case where the full field is sent without the "_chunk" suffix,
          // typically for the final update of the entire report object.
          newReport.executiveSummary = reportData.executiveSummary;
        }
      },
      []
    );
    ```
*   **Rationale:** The `executive_summary_chunk` from the orchestrator contains the complete `StreamState.value` up to that point. Appending it causes duplication. Replacing it ensures the atom reflects the latest streamed state accurately. The check for `!== undefined` handles empty string chunks correctly.

**Step 3.2: Correct `updateExistingSection` Logic (within `updateReportSections`)**

*   **Locate:** The `updateExistingSection` `useCallback` (which is called by `updateReportSections`).
*   **Current Logic (Problematic for content):**
    ```typescript
    const updateExistingSection = useCallback(
      (
        sections: ClientFinalReport["sections"],
        existingIndex: number,
        contentChunk: string
      ) => {
        const existingSection = sections[existingIndex];
        if (existingSection) {
          sections[existingIndex] = {
            title: existingSection.title, // Title is usually set once
            content: existingSection.content + contentChunk, // APPENDS - BUG!
          };
        }
      },
      []
    );
    ```
*   **Proposed Change:** Directly assign `contentChunk` to `content`.
*   **New Logic for `updateExistingSection`:**
    ```typescript
    const updateExistingSection = useCallback(
      (
        sections: ClientFinalReport["sections"], // This is typically newReport.sections being mutated
        existingIndex: number,
        contentChunk: string,
        titleChunk?: string // Optional: if title can also stream or be updated
      ) => {
        const existingSection = sections[existingIndex];
        if (existingSection) {
          sections[existingIndex] = {
            // Preserve existing title unless a new one is explicitly provided in this chunk
            title: titleChunk !== undefined ? titleChunk : existingSection.title,
            content: contentChunk, // REPLACE content
          };
        }
      },
      []
    );
    ```
*   **Update `updateReportSections` call to `updateExistingSection`:**
    *   The `reportData.sectionUpdate` object from the orchestrator should ideally include `title` (if it can change or is set initially) and `content_chunk`.
    *   When calling `updateExistingSection` from within `updateReportSections`:
        ```typescript
        // Inside updateReportSections, when updating an existing section:
        updateExistingSection(
            sections, // This is newReport.sections
            existingIndex,
            reportData.sectionUpdate.content_chunk, // Pass the content chunk
            reportData.sectionUpdate.title // Pass title if available in sectionUpdate
        );
        ```

**Step 3.3: Correct `addNewSection` Logic (within `updateReportSections`)**

*   **Locate:** The `addNewSection` `useCallback`.
*   **Current Logic (Content part):**
    ```typescript
    const addNewSection = useCallback(
      (
        sections: ClientFinalReport["sections"],
        title: string,
        contentChunk: string
      ) => {
        sections.push({
          title,
          content: contentChunk, // Initial set is fine
        });
      },
      []
    );
    ```
*   **Proposed Change:** This is generally fine for the *first* chunk of a *new* section. However, ensure that subsequent updates to this newly added section also use replacement logic (which they will if `updateExistingSection` is called for them). No change needed here if `updateExistingSection` is correctly used for subsequent chunks of this new section.

**Step 3.4: Correct `updateConclusionAndMetadata` Logic (for `conclusion`)**

*   **Locate:** The `updateConclusionAndMetadata` `useCallback`.
*   **Current Logic (Problematic for conclusion):**
    ```typescript
    if (reportData.conclusion_chunk) {
      newReport.conclusion =
        (newReport.conclusion || "") + reportData.conclusion_chunk; // APPENDS - BUG!
    }
    if (reportData.conclusion) {
      newReport.conclusion = reportData.conclusion;
    }
    ```
*   **Proposed Change:** Directly assign `conclusion_chunk`.
*   **New Logic:**
    ```typescript
    const updateConclusionAndMetadata = useCallback(
      (reportData: ReportData, newReport: ClientFinalReport) => { // newReport is a mutable copy
        if (reportData.conclusion_chunk !== undefined) {
          newReport.conclusion = reportData.conclusion_chunk; // REPLACE
        } else if (reportData.conclusion !== undefined) {
          newReport.conclusion = reportData.conclusion;
        }
        // ... rest for limitations, appendixDocIds ...
        if (reportData.limitations) {
          newReport.limitations = reportData.limitations;
        }
        if (reportData.appendixDocIds) {
          newReport.appendixDocIds = reportData.appendixDocIds;
        }
      },
      []
    );
    ```

**Step 3.5: Adjust `handleReportUpdate` (Main Report Data Update Logic)**

*   **Locate:** The `handleReportUpdate` `useCallback`. This function orchestrates calling `updateExecutiveSummary`, `updateReportSections`, etc.
*   **Current Logic (Conceptual structure):**
    ```typescript
    setFinalReportContent(prevReport => {
        const newReport = { ...prevReport }; // Creates a shallow copy
        const reportData = update.data as ReportData;

        updateReportTitle(reportData, newReport); // Mutates newReport
        updateExecutiveSummary(reportData, newReport); // Mutates newReport
        updateReportSections(reportData, newReport); // Mutates newReport
        updateConclusionAndMetadata(reportData, newReport); // Mutates newReport

        return newReport;
    });
    ```
*   **Verification:** Ensure that `newReport` being passed to these sub-functions is indeed a mutable copy of the *previous state* (`prevReport`) so that changes are correctly based on the prior state when necessary (e.g., for non-chunked full updates), but that the "chunk" logic now correctly replaces. The current structure where `newReport` is a spread of `prevReport` and then mutated by the sub-functions is acceptable. The key is that the sub-functions now use replacement for chunks.

**Step 3.6: Verify Logic for Non-Chunked (Final) Updates**

*   Review the parts of `updateExecutiveSummary`, `updateReportSections`, and `updateConclusionAndMetadata` that handle `reportData.executiveSummary` (not `_chunk`), `reportData.sections`, and `reportData.conclusion`.
*   This logic typically corresponds to when `update.isFinalForStage` is true in the `ResearchUpdate` from the orchestrator, or when a field is simply not streamed chunk-by-chunk (e.g., `report_title`).
*   This part of the logic, which directly sets the full field value, is likely correct and should remain as is, as it handles the final complete state of the data. The issue was specifically with appending the *full-current-value-as-a-chunk*.

**Step 3.7: Review `handleSynthesisUpdate` for `ClientSynthesisTopic.synthesisSnippet`**

*   **Locate:** The `handleSynthesisUpdate` `useCallback`.
*   **Check:** If `ClientSynthesisTopic.synthesisSnippet` is intended to stream (BAML type `SynthesizedTopic.synthesis` is `string`, not `@stream.with_state` by default, but if it were changed to be streaming, this would need checking).
*   **Current BAML:** `SynthesizedTopic.synthesis` is a plain `string`. It's not annotated with `@stream.with_state`. This means BAML will only output it once it's complete for that topic.
*   **Conclusion:** No changes likely needed here unless `SynthesizedTopic.synthesis` was changed in BAML to be `@stream.with_state`. If it *were* streaming, the same append vs. replace logic would apply. For now, assume it's not streaming token-by-token.

**Step 3.8: Review `handleDocumentAnalysisUpdate` for `ClientAnalyzedDoc.summarySnippet`**

*   **Locate:** The `handleDocumentAnalysisUpdate` `useCallback`.
*   **BAML Type:** `AnalyzedDocument.summary` is a plain `string`, not `@stream.with_state`.
*   **Orchestrator:** The orchestrator sends `summarySnippet: analysis.summary.substring(0, 300) + "..."`. This is a single, truncated string, not a stream of chunks.
*   **Client Hook:**
    ```typescript
    setAnalyzedDocs(prev => {
        const existingIndex = prev.findIndex(doc => doc.docId === docWithTimestamp.docId);
        if (existingIndex >= 0) {
            newDocs[existingIndex] = { ...newDocs[existingIndex], ...docWithTimestamp }; // This correctly replaces/merges
            return newDocs;
        }
        return [...prev, docWithTimestamp];
    });
    ```
*   **Conclusion:** The logic for `summarySnippet` in `ClientAnalyzedDoc` seems correct because the orchestrator sends a single (potentially truncated) summary, not a stream of chunks for this specific field. The update logic correctly replaces/merges the entire `ClientAnalyzedDoc` object, which is appropriate. No change needed here unless the BAML definition for `AnalyzedDocument.summary` changes to `@stream.with_state` and the orchestrator starts sending chunks for it.

---

**Phase 2: Testing and Validation**

*   **Step 3.9: Unit Testing `useResearchAgent.ts` (Updates)**
    *   **Action:** Enhance `__tests__/lib/hooks/useResearchAgent.test.ts`.
    *   **Details:**
        *   Create test scenarios where `mockConductResearch` streams `ResearchUpdate` objects for `GENERATING_REPORT` stage.
        *   Simulate multiple chunks for `executiveSummary`, `sections[].content`, and `conclusion`.
        *   Assert that `finalReportContentAtom` in the Jotai store is updated by *replacing* the content of these fields with each new "chunk" (which is the full current value), not appending.
        *   Verify the final state of the atom after all chunks and the final report object are processed matches the expected full report.
        *   Test with empty string chunks and initial empty states.
    *   **Acceptance Criteria:** ✅ Unit tests confirm that streaming text fields in `finalReportContentAtom` are correctly updated by replacement.

*   **Step 3.10: Manual End-to-End Testing**
    *   **Action:** Run the full application.
    *   **Details:**
        *   Initiate a research task that proceeds to the `GENERATING_REPORT` stage.
        *   Closely observe the UI elements in `ReportDrafter.tsx` (Executive Summary, Sections, Conclusion).
        *   **Expected:** Text should now appear progressively, character by character or chunk by chunk, in these fields, along with the blinking caret. There should be no duplication or garbled text.
        *   Test with short and potentially long generated report content to ensure smoothness.
        *   Test the "Abort Research" functionality during report generation to ensure it stops cleanly.
    *   **Acceptance Criteria:** ✅ Realtime streaming of report content is visually confirmed in the UI. Text appears smoothly and correctly.

---

**Phase 3: Code Cleanup and Documentation**

*   **Step 3.11: Review and Refactor**
    *   **Action:** Review the modified functions in `useResearchAgent.ts` for clarity, consistency, and any potential edge cases missed.
    *   **Details:** Ensure all `useCallback` dependencies are correct. Ensure consistent handling of `undefined` vs. empty string for chunks.
    *   **Acceptance Criteria:** ✅ Code is clean and follows project standards.

*   **Step 3.12: Update Documentation/Comments**
    *   **Action:** Add inline comments to `useResearchAgent.ts` explaining the replacement logic for streamed text fields, especially clarifying why chunks are not appended.
    *   **Details:** Explain that the "chunk" from the orchestrator represents the full current value of the BAML field.
    *   **Acceptance Criteria:** ✅ Code comments accurately reflect the implemented logic.

---

**Summary of Key Changes in `useResearchAgent.ts`:**

The core change is to modify the state update logic for streaming text fields within `setFinalReportContent` (and potentially other atoms if they also stream text similarly). Instead of:
`newField = (prevField || "") + chunk;`
It should become:
`newField = chunk;`

This applies to:
*   `executiveSummary` (when `reportData.executive_summary_chunk` is received)
*   `sections[index].content` (when `reportData.sectionUpdate.content_chunk` is received)
*   `conclusion` (when `reportData.conclusion_chunk` is received)

class="mb-2 w-full cursor-pointer rounded-lg p-3 text-left border-[#3a7bb7] border-l-4 bg-[#edf2f7] dark:bg-[#242a3d]
