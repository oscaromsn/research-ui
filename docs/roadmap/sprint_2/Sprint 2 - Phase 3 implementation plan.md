**Phase 3 Goal:** Develop a robust `useResearchAgent` custom React hook that:
1.  Initiates research by calling the `conductResearch` server action.
2.  Manages an `AbortController` for cancellable research tasks.
3.  Processes the `ReadableStream` of `ResearchUpdate` objects from the server.
4.  Updates Jotai state atoms (`researchStatusAtom`, `researchLogAtom`, and all data atoms) accurately and progressively based on these updates.
5.  Handles errors and stream completion gracefully.
6.  Exposes a clean API (`startResearch`, `abortResearch`, and status properties) for UI components.

**Underlying Principle:** TDD will be applied by writing unit tests for the hook that simulate various stream scenarios from a mocked `conductResearch` server action. Each feature of the hook will be tested incrementally.

---

### Pre-requisites for Phase 3:

1.  **Phase 1 Completion:** `app/actions/researchAgentOrchestrator.ts` (including `ResearchStage` and `ResearchUpdate` types) is implemented and can stream updates.
2.  **Phase 2 Completion:** `lib/state/researchAtoms.ts` (including client-friendly types and the `resetResearchStateAtom`) is fully defined.
3.  **Vitest Setup:** Testing environment (`vitest.config.ts`, `setupTests.ts`) is functional.
4.  **Branching:** Create a new feature branch for this phase (e.g., `feature/P3-use-research-agent-hook`).

---

### Step 1: Hook Skeleton and Basic State/Action Setup

**Goal:** Create the `useResearchAgent.ts` file, define the hook's basic structure, import dependencies, set up Jotai atom setters, and initialize local state for `AbortController`.

*   **Task 3.1.1: Create `lib/hooks/useResearchAgent.ts` and Define Basic Structure**
    *   **Action:** Create the file and add the initial hook structure as outlined in the Phase 3 planning document (Step 3.1).
    *   **Details:**
        ```typescript
        // lib/hooks/useResearchAgent.ts
        'use client';

        import { useState, useCallback, useRef, useEffect /* if needed for cleanup */ } from 'react';
        import { useSetAtom, useAtomValue } from 'jotai';
        import {
            researchStatusAtom, researchLogAtom, generatedQueriesAtom,
            analyzedDocsSummaryAtom, synthesisDetailsAtom, finalReportContentAtom,
            resetResearchStateAtom, selectedAnalyzedDocIdAtom // Added selectedAnalyzedDocIdAtom for reset
        } from '@/lib/state/researchAtoms';
        import type {
            ClientSearchQuery, ClientAnalyzedDoc, ClientSynthesis,
            ClientFinalReport, ResearchStatus
        } from '@/lib/state/researchAtoms';
        import { conductResearch } from '@/app/actions/researchAgentOrchestrator';
        import type { ResearchUpdate, ResearchStage } from '@/app/actions/researchAgentOrchestrator';

        // Define the return type for the hook
        interface UseResearchAgentReturn {
            startResearch: (legalQuestion: string) => Promise<void>;
            abortResearch: () => void;
            isLoading: boolean;
            currentStage: ResearchStage | null;
            currentMessage: string | undefined;
            error: string | null;
        }

        export function useResearchAgent(): UseResearchAgentReturn {
            const setResearchStatus = useSetAtom(researchStatusAtom);
            const setResearchLog = useSetAtom(researchLogAtom);
            const setGeneratedQueries = useSetAtom(generatedQueriesAtom);
            const setAnalyzedDocs = useSetAtom(analyzedDocsSummaryAtom);
            const setSynthesisDetails = useSetAtom(synthesisDetailsAtom);
            const setFinalReportContent = useSetAtom(finalReportContentAtom);
            const resetAllResearchState = useSetAtom(resetResearchStateAtom);
            // Note: selectedAnalyzedDocIdAtom is reset by resetResearchStateAtom

            const [abortController, setAbortController] = useState<AbortController | null>(null);
            const currentStatus = useAtomValue(researchStatusAtom); // For returning status

            // Stub functions for now
            const startResearch = useCallback(async (legalQuestion: string) => {
                console.log("Hook: startResearch called with:", legalQuestion);
            }, [/* deps will be added */]);

            const abortResearch = useCallback(() => {
                console.log("Hook: abortResearch called");
            }, [/* deps will be added */]);

            return {
                startResearch,
                abortResearch,
                isLoading: currentStatus.isLoading,
                currentStage: currentStatus.stage,
                currentMessage: currentStatus.message,
                error: currentStatus.error,
            };
        }
        ```
    *   **Test (Initial Vitest Unit Test - `__tests__/lib/hooks/useResearchAgent.test.ts`):**
        *   Create the test file.
        *   Test initial state: `renderHook(() => useResearchAgent(), { wrapper: JotaiProvider })`. Assert that `isLoading` is false, `currentStage` is "IDLE", `error` is null.
        *   Assert `startResearch` and `abortResearch` are functions.
    *   **Acceptance Criteria:**
        *   ✅ `useResearchAgent.ts` exists with basic structure.
        *   ✅ All necessary Jotai atoms and server action/types are imported.
        *   ✅ `useState` for `abortController` is defined.
        *   ✅ `useSetAtom` is used for all atoms the hook will modify.
        *   ✅ `useAtomValue` is used to derive returned status properties.
        *   ✅ Stubbed `startResearch` and `abortResearch` are returned.
        *   ✅ Initial unit test for default state passes.

---

### Step 2: Implement `startResearch` - Initialization & Server Action Invocation

**Goal:** Make `startResearch` correctly initialize states, create an `AbortController`, and invoke the `conductResearch` server action.

*   **Task 3.2.1: Implement State Reset and Initial Status Update in `startResearch`**
    *   **Action:** Modify `startResearch` to call `resetAllResearchState` and set the initial `INITIALIZING` status.
    *   **Details:**
        ```typescript
        // Inside useResearchAgent hook
        const startResearch = useCallback(async (legalQuestion: string) => {
            if (currentStatus.isLoading) { // Prevent concurrent runs from THIS hook instance
                console.warn("Research is already in progress. Abort first or wait.");
                setResearchLog(prev => [...prev, `${new Date().toISOString()} [SYSTEM_WARN] Attempted to start new research while one is in progress.`]);
                return;
            }

            resetAllResearchState(undefined); // FR4.3.2

            setResearchStatus({
                stage: "INITIALIZING",
                isLoading: true,
                error: null,
                message: "Initializing research...",
                currentProcessedDoc: 0,
                totalDocsToProcess: 0,
                currentStreamingField: undefined,
            });
            setResearchLog(prev => [...prev, `${new Date().toISOString()} [INITIALIZING] Research process initiated for: "${legalQuestion}"`]);

            const controller = new AbortController();
            setAbortController(controller);
            // ... (conductResearch call and stream processing to follow)
        }, [currentStatus.isLoading, resetAllResearchState, setResearchStatus, setResearchLog, setAbortController /* other setters later */]);
        ```
        Add `currentStatus.isLoading` to dependency array of `startResearch`'s `useCallback`.
    *   **Test (`useResearchAgent.test.ts`):**
        *   Mock `conductResearch` to return a promise that never resolves (to isolate pre-call logic).
        *   Call `result.current.startResearch("test")`.
        *   Assert that `store.get(researchStatusAtom)` is `{ stage: "INITIALIZING", isLoading: true, ... }`.
        *   Assert data atoms (e.g., `generatedQueriesAtom`) are empty after reset.
        *   Assert a log entry for initialization was added.
        *   Assert that calling `startResearch` again while `isLoading` is true does not re-trigger reset or primary status updates (logs a warning).
    *   **Acceptance Criteria:**
        *   ✅ `startResearch` correctly calls `resetAllResearchState`.
        *   ✅ `researchStatusAtom` is set to `INITIALIZING`, `isLoading: true`.
        *   ✅ `researchLogAtom` gets an initialization entry.
        *   ✅ A new `AbortController` instance is created and stored.
        *   ✅ Concurrent calls to `startResearch` from the same hook instance are prevented.

*   **Task 3.2.2: Call `conductResearch` and Handle Immediate Errors**
    *   **Action:** Add the `await conductResearch(legalQuestion)` call within a `try...catch` block in `startResearch`.
    *   **Details:**
        ```typescript
        // Inside startResearch, after setAbortController(controller);
        try {
            const stream = await conductResearch(legalQuestion);
            // Stream processing logic (Task 3.3) will go here
            console.log("Hook: Received stream from conductResearch"); // Placeholder

            // TEMPORARY: Simulate stream completion for now if not processing stream yet
            // This will be replaced by actual stream processing logic
            // setTimeout(async () => { 
            //     if (controller.signal.aborted) return;
            //     // Simulate some processing...
            //     await new Promise(r => setTimeout(r, 50));
            //     if (controller.signal.aborted) return;
            //     setResearchStatus(prev => ({ ...prev, isLoading: false, stage: "COMPLETED", message: "Research finished (stub)." }));
            //     setAbortController(null);
            // }, 100);

        } catch (error: any) {
            console.error("Hook: Error calling conductResearch:", error);
            const errorMsg = error.name === 'AbortError' ? "Research aborted by client before stream started." : (error.message || "Failed to start research.");
            setResearchStatus({ stage: "ERROR", isLoading: false, error: errorMsg, message: "Error starting research." });
            setResearchLog(prev => [...prev, `${new Date().toISOString()} [ERROR] Failed to start research: ${errorMsg}`]);
            setAbortController(null);
        }
        ```
        Ensure `useCallback` dependencies for `startResearch` are updated with all atom setters.
    *   **Test (`useResearchAgent.test.ts`):**
        *   Mock `conductResearch` to resolve successfully with a mock `ReadableStream` (even if it's empty and closes immediately for now). Verify `conductResearch` was called with the correct question.
        *   Mock `conductResearch` to reject with an error. Assert `researchStatusAtom` is updated to `ERROR`, `isLoading: false`, and `error` message is set.
        *   Mock `conductResearch` to throw an `AbortError` (simulating abort *before* stream processing). Assert correct status.
    *   **Acceptance Criteria:**
        *   ✅ `conductResearch` is called with `legalQuestion`.
        *   ✅ Errors from `conductResearch` promise (not stream errors yet) are caught and update `researchStatusAtom` correctly.
        *   ✅ `abortController` is cleared on immediate error.

**Checkpoint 3.2 (End of Server Action Invocation):** The hook can initiate research, reset state, call the server action, and handle errors from that initial call. The foundation for stream processing is laid.

---

### Step 3: Implement Stream Processing Logic

**Goal:** Read the `ReadableStream`, parse `ResearchUpdate` objects, and update Jotai atoms based on the content of these updates.

*   **Task 3.3.1: Implement Stream Reading Loop**
    *   **Action:** Inside the `try` block of `startResearch` (after `const stream = ...`), add the `while (true)` loop to read from the stream reader.
    *   **Details:**
        *   Use `stream.pipeThrough(new TextDecoderStream(), { signal: controller.signal }).getReader();` to get a reader that respects the `AbortController`.
        *   Loop with `await reader.read()`.
        *   Handle `done: true`: Update status to `COMPLETED` (if no prior error), set `isLoading: false`, clear `abortController`.
        *   Handle `controller.signal.aborted`: Break loop, log abortion. Status update is handled by `abortResearch` or the `catch` block for `reader.read()`.
        *   Split `value` (decoded chunk) by `\n` and filter empty lines.
    *   **Test (`useResearchAgent.test.ts`):**
        *   Mock `conductResearch` to return a stream that sends a few valid `ResearchUpdate` JSON strings (e.g., simple STATUS_CHANGE) and then closes. Assert the loop processes them.
        *   Mock a stream that closes without sending data. Assert `COMPLETED` status is set.
        *   Mock a stream, then simulate `abortController.abort()`. Assert loop terminates and status reflects abortion. (More detailed abort testing in Step 4).
    *   **Acceptance Criteria:**
        *   ✅ Stream is read using `TextDecoderStream` and `AbortController` signal.
        *   ✅ Loop correctly processes chunks until stream is `done` or aborted.
        *   ✅ Final status is set to `COMPLETED` (or reflects prior error) when stream ends.

*   **Task 3.3.2: Parse `ResearchUpdate` and Handle Malformed JSON**
    *   **Action:** Inside the chunk processing loop, parse each string line as `ResearchUpdate` JSON. Add error handling for parsing failures.
    *   **Details:**
        *   Wrap `JSON.parse(stringUpdate)` in a `try...catch`.
        *   If parsing fails, log the raw chunk and the error to `researchLogAtom` with a `[SYSTEM_ERROR]` prefix. Decide if a single malformed chunk should terminate all stream processing (probably not, log and continue if possible, or set a specific non-fatal error flag).
    *   **Test (`useResearchAgent.test.ts`):**
        *   Mock `conductResearch` to send a stream with a mix of valid and malformed JSON strings.
        *   Assert valid updates are processed.
        *   Assert malformed JSON attempts are logged to `researchLogAtom`.
        *   Assert overall research status remains reasonable (e.g., continues processing valid chunks or sets a specific parsing error flag if critical).
    *   **Acceptance Criteria:**
        *   ✅ Each valid JSON string chunk is parsed into a `ResearchUpdate` object.
        *   ✅ Malformed JSON chunks are caught, logged, and do not crash the hook.

*   **Task 3.3.3: Implement `researchStatusAtom` and `researchLogAtom` Updates**
    *   **Action:** For every successfully parsed `ResearchUpdate`, update `researchStatusAtom` and `researchLogAtom`.
    *   **Details:**
        *   `setResearchLog(prevLogs => [...prevLogs, formattedMessage]);`
        *   `setResearchStatus(prevStatus => ({ ...prevStatus, stage: update.stage, message: update.message, currentProcessedDoc: ..., totalDocsToProcess: ..., currentStreamingField: ... }));` (always keep `isLoading: true` while stream is active unless an `ERROR` type update is received).
    *   **Test (`useResearchAgent.test.ts`):**
        *   Mock `conductResearch` to stream various `STATUS_CHANGE`, `PROGRESS`, and `LOG` updates.
        *   Assert `researchStatusAtom` reflects the latest `stage`, `message`, and progress counters from these updates.
        *   Assert `researchLogAtom` contains all logged messages.
    *   **Acceptance Criteria:**
        *   ✅ `researchStatusAtom` is correctly updated by all non-DATA, non-ERROR `ResearchUpdate` types.
        *   ✅ `researchLogAtom` accumulates messages from all updates.

*   **Task 3.3.4: Implement `DATA` Update Handling for Each Stage**
    *   **Action:** Add the `switch (update.type)` block, and within the `case "DATA":`, add logic to update specific data atoms based on `update.stage`.
    *   **Details (Implement one data type at a time, with tests):**
        1.  **`GENERATING_QUERIES`:**
            *   Logic: `setGeneratedQueries(update.data.queries as ClientSearchQuery[]);` (with proper type casting/validation of `update.data`).
            *   Test: Stream a `DATA` update for `GENERATING_QUERIES`. Assert `generatedQueriesAtom` is updated.
        2.  **`ANALYZING_DOCUMENTS` (Progressive Updates):**
            *   Logic:
                ```typescript
                setAnalyzedDocs(prevDocs => {
                    const docData = update.data as Partial<ClientAnalyzedDoc> & { docId: string };
                    const existingDocIndex = prevDocs.findIndex(d => d.docId === docData.docId);
                    if (existingDocIndex > -1) { // Update existing doc
                        const updatedDocs = [...prevDocs];
                        updatedDocs[existingDocIndex] = { ...updatedDocs[existingDocIndex], ...docData };
                        return updatedDocs;
                    }
                    return [...prevDocs, docData as ClientAnalyzedDoc]; // Add new doc
                });
                ```
            *   Test: Stream multiple `DATA` updates for `ANALYZING_DOCUMENTS`, some for new docs, some updating existing docs. Assert `analyzedDocsSummaryAtom` correctly accumulates/merges data.
        3.  **`SYNTHESIZING_FINDINGS`:**
            *   Logic: `setSynthesisDetails(update.data as ClientSynthesis);`
            *   Test: Stream a `DATA` update. Assert `synthesisDetailsAtom` is updated.
        4.  **`GENERATING_REPORT` (Streaming Text Fields):**
            *   Logic: This is the most complex. Based on `update.fieldName` and `update.isFieldComplete`:
                ```typescript
                setFinalReportContent(prevReport => {
                    let newReport = { ...prevReport };
                    const reportData = update.data as any; // Cast for easier access to chunks

                    if (update.fieldName === "executiveSummary") {
                        newReport.executiveSummary = (update.isFieldComplete ? '' : prevReport.executiveSummary) + (reportData.executive_summary_chunk || '');
                    } else if (update.fieldName?.startsWith("sectionContent_") && reportData.sectionUpdate) {
                        // ... logic as in Phase 1 plan ...
                        const index = parseInt(update.fieldName.split('_')[1]);
                        const chunk = reportData.sectionUpdate.content_chunk || '';
                        newReport.sections = [...(newReport.sections || [])];
                        if (!newReport.sections[index]) {
                            newReport.sections[index] = { title: reportData.sectionUpdate.title || `Section ${index + 1}`, content: "" };
                        } else if (reportData.sectionUpdate.title) {
                           newReport.sections[index].title = reportData.sectionUpdate.title;
                        }
                        newReport.sections[index].content = (update.isFieldComplete ? '' : (newReport.sections[index]?.content || '')) + chunk;
                    } else if (update.fieldName === "conclusion") {
                         newReport.conclusion = (update.isFieldComplete ? '' : prevReport.conclusion) + (reportData.conclusion_chunk || '');
                    }
                    // Handle non-streaming parts if update.isFinalForStage or specific field for title etc.
                    if (reportData.report_title) newReport.title = reportData.report_title;
                    if (update.isFinalForStage) { // Or if specific DATA update contains these
                        if(reportData.limitations) newReport.limitations = reportData.limitations;
                        if(reportData.appendixDocIds) newReport.appendixDocIds = reportData.appendixDocIds;
                        // Ensure all streamed fields are complete if this is the final update for them
                        if(reportData.executiveSummary) newReport.executiveSummary = reportData.executiveSummary;
                        if(reportData.sections) newReport.sections = reportData.sections;
                        if(reportData.conclusion) newReport.conclusion = reportData.conclusion;
                    }
                    return newReport;
                });
                ```
            *   Test: Stream multiple `DATA` updates for `GENERATING_REPORT` with different `fieldName` values, including chunks and `isFieldComplete` flags. Assert `finalReportContentAtom` fields are built progressively and correctly finalized.
    *   **Acceptance Criteria:** ✅ Each data-holding Jotai atom is correctly and progressively updated by `DATA` type `ResearchUpdate` objects corresponding to the correct stage. Streaming text fields are appended/replaced as per `isFieldComplete`.

*   **Task 3.3.5: Implement `ERROR` Type Update Handling from Stream**
    *   **Action:** Inside the stream processing loop, if an `update.type === "ERROR"` is received.
    *   **Details:**
        *   `setResearchStatus({ stage: update.stage, isLoading: false, error: update.message || "Streamed error.", message: update.message });`
        *   `throw new Error(update.message || "Streamed error event");` This will be caught by the `catch (streamReadError: any)` block of the `reader.read()` loop, which will then break the loop and allow `startResearch`'s main `finally` to run if needed, or its main `catch` to handle cleanup.
    *   **Test (`useResearchAgent.test.ts`):** Mock `conductResearch` to stream an `ERROR` update. Assert `researchStatusAtom.error` is set, `isLoading` is false, and stream processing stops.
    *   **Acceptance Criteria:** ✅ `ERROR` updates from the stream correctly update `researchStatusAtom` and terminate further stream processing.

*   **Task 3.3.6: Handle Stream Reading Errors and Final `catch` Block in `startResearch`**
    *   **Action:** Finalize the `catch (streamReadError: any)` block for `reader.read()` and the main `catch (error: any)` block for `startResearch`.
    *   **Details:**
        *   The `catch (streamReadError: any)` around `reader.read()`:
            *   If `controller.signal.aborted` or `streamReadError.name === 'AbortError'`, update status to reflect abortion (if not already set by `abortResearch`).
            *   Otherwise, it's a genuine stream read error. Set `researchStatusAtom` to `ERROR` with the error message.
            *   Log the error.
            *   `setAbortController(null);`
            *   `break;` out of the `while(true)` loop.
        *   The main `catch (error: any)` in `startResearch` (outside the `while` loop, for errors like `conductResearch` promise rejection):
            *   This was partially implemented in Task 3.2.2. Ensure it correctly sets `ERROR` status and clears `abortController`.
    *   **Acceptance Criteria:** ✅ All error paths (server action call error, stream read error, user abort) lead to appropriate `researchStatusAtom` updates and cleanup of `abortController`.

**Checkpoint 3.3 (End of Stream Processing Implementation):** The hook can now fully process a stream of `ResearchUpdate` objects, including all data types, streaming text, and error conditions, updating all relevant Jotai atoms correctly.

---

### Step 4: Implement `abortResearch` Functionality

**Goal:** Enable users to cancel an ongoing research task.

*   **Task 3.4.1: Implement `abortResearch` Logic**
    *   **Action:** Finalize the `abortResearch` function.
    *   **Details:**
        ```typescript
        const abortResearch = useCallback(() => {
            if (abortController) {
                console.log("Hook: Abort signal sent by user.");
                abortController.abort(); // This triggers the AbortError in reader.read()
                // The catch block in startResearch's stream reading loop will handle status updates.
                // We can preemptively set a message here if desired.
                setResearchStatus(prev => ({
                    ...prev,
                    // isLoading can be set to false here, or let the stream error handler do it.
                    // Setting it here provides quicker UI feedback for abortion.
                    isLoading: false,
                    error: prev.error || "Research manually aborted.", // Preserve existing error if one occurred before abort
                    message: "Research process aborted by user.",
                }));
                setResearchLog(prev => [...prev, `${new Date().toISOString()} [USER_ACTION] Research abortion requested.`]);
                // No need to setAbortController(null) here; the stream's error/done handler will do it.
            } else {
                console.log("Hook: No active research to abort.");
                setResearchLog(prev => [...prev, `${new Date().toISOString()} [USER_ACTION] Abort called, but no active research.`]);
            }
        }, [abortController, setResearchStatus, setResearchLog]);
        ```
        Ensure `abortController`, `setResearchStatus`, and `setResearchLog` are in `useCallback` dependencies.
    *   **Test (`useResearchAgent.test.ts`):**
        *   Start a (mocked) long-running stream. Call `result.current.abortResearch()`.
        *   Assert `abortController.abort()` was called (can spy on it if `abortController` instance is exposed or by checking side effects).
        *   Assert `researchStatusAtom` is updated to reflect abortion (e.g., `isLoading: false`, `error` message indicates abortion).
        *   Assert stream processing in `startResearch` stops.
        *   Test calling `abortResearch` when no research is active; it should do nothing harmful and log.
    *   **Acceptance Criteria:**
        *   ✅ `abortResearch` correctly signals the `AbortController`.
        *   ✅ Active stream processing in `startResearch` terminates upon abortion.
        *   ✅ `researchStatusAtom` is updated to an aborted state.

*   **Task 3.4.2: Ensure `AbortController` is Cleared**
    *   **Action:** Double-check that `setAbortController(null)` is called in all paths where research ends (successful completion, any error, abortion).
    *   **Details:** This typically happens in the `finally` block of the main `try...catch` in `startResearch` or in specific error handlers after the stream loop breaks. The provided logic in stream processing loop's `catch` and `done` handlers should cover this.
    *   **Acceptance Criteria:** ✅ `abortController` state is consistently nulled out when research is no longer active.

**Checkpoint 3.4 (End of Abort Implementation):** The `abortResearch` function works reliably, stopping stream processing and updating state.

---

### Step 5: Final Hook Cleanup and Dependency Management

**Goal:** Ensure the hook is clean, dependencies are correct, and any necessary cleanup effects are implemented.

*   **Task 3.5.1: Review `useCallback` Dependencies**
    *   **Action:** Ensure all functions and values from the hook's scope used inside `startResearch` and `abortResearch` `useCallback`s are listed in their dependency arrays.
    *   **Details:** This includes all `setXyzAtom` functions, `abortController`, `currentStatus.isLoading` (if used to prevent concurrent runs).
    *   **Acceptance Criteria:** ✅ `useCallback` dependency arrays are correct, preventing stale closures.

*   **Task 3.5.2: Consider `useEffect` for Cleanup (If Necessary)**
    *   **Action:** Evaluate if any `useEffect` cleanup is needed, e.g., if the component using the hook unmounts while research is active.
    *   **Details:** If `startResearch` could be interrupted by component unmount, an effect could call `abortController.abort()` on unmount.
        ```typescript
        useEffect(() => {
            const currentAbortController = abortController; // Capture current controller
            return () => {
                if (currentAbortController && !currentAbortController.signal.aborted) {
                    console.log("Hook: Cleaning up and aborting research on unmount.");
                    currentAbortController.abort();
                }
            };
        }, [abortController]); // Runs when abortController instance changes
        ```
        This ensures that if the component unmounts, any active stream processing is signalled to stop.
    *   **Acceptance Criteria:** ✅ Hook cleans up any active research if its host component unmounts.

**Checkpoint 3.5 (End of Hook Finalization):** The `useResearchAgent` hook is robust, efficient, and handles its lifecycle correctly.

---

### Phase 3 Completion & Review:

1.  **Run All `useResearchAgent.test.ts` Unit Tests:** Ensure 100% pass rate for the hook's tests.
2.  **Manual Integration Test (Simplified UI):**
    *   Create a temporary simple React component in `app/page.tsx` (or a test page) that uses `useResearchAgent`.
    *   Include:
        *   An input for `legalQuestion`.
        *   A "Start Research" button calling `agent.startResearch`.
        *   An "Abort Research" button calling `agent.abortResearch`.
        *   Display for `agent.isLoading`, `agent.currentStage`, `agent.currentMessage`, `agent.error`.
        *   Display the content of all relevant Jotai atoms (`researchLogAtom`, `generatedQueriesAtom`, etc.) to observe updates.
    *   Test scenarios:
        *   Full successful run (mock orchestrator streams all stages to `COMPLETED`).
        *   Run where orchestrator streams an `ERROR` update.
        *   Run that gets aborted by the user clicking "Abort Research".
        *   Run with malformed JSON in the stream.
    *   Verify all Jotai atoms are populated correctly and progressively.
3.  **Code Review:** Review `useResearchAgent.ts` for clarity, correctness, error handling, state management, and adherence to React hook rules.
4.  **Merge:** Merge the feature branch `feature/P3-use-research-agent-hook` into the main development branch.

**Phase 3 Acceptance Criteria (Overall):**

*   ✅ The `useResearchAgent` hook is fully implemented and unit-tested.
*   ✅ It correctly calls the `conductResearch` server action and manages an `AbortController`.
*   ✅ It processes `ReadableStream<ResearchUpdate>` effectively, parsing JSON updates.
*   ✅ All Jotai state atoms (`researchStatusAtom`, `researchLogAtom`, data atoms) are accurately and progressively updated based on `ResearchUpdate` types and stages.
*   ✅ Streaming text fields in data atoms (like `finalReportContentAtom.executiveSummary`) are correctly built from chunks.
*   ✅ Error conditions (from server action, stream errors, parsing errors, user aborts) are handled gracefully, updating `researchStatusAtom.error` and `isLoading`.
*   ✅ The hook provides a clean and usable API (`startResearch`, `abortResearch`, status properties) for UI components.
*   ✅ `useCallback` dependencies are correctly managed.
*   ✅ Cleanup logic (e.g., aborting on unmount) is implemented if deemed necessary.

This detailed plan for Phase 3 ensures the client-side "engine" is built robustly, setting a solid foundation for Phase 4 where UI components will be connected to this hook and the Jotai state it manages.
