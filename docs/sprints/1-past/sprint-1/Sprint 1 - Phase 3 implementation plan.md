# 2.3. Implementation plan - Phase 3

Okay, let's meticulously break down Phase 3: Implementing the Client-Side Orchestrator Hook (`useResearchAgent.ts`). This hook is the crucial intermediary connecting the UI's intent to start research with the server-side orchestrator, and then channeling the streamed responses back into the Jotai state atoms defined in Phase 2.

## Phase 3: Implement Client-Side Orchestrator Hook (`useResearchAgent.ts`)

**Goal:** Create a custom React hook `useResearchAgent` that calls the `conductResearch` server action, processes its streamed `ResearchUpdate` responses, and updates the Jotai state atoms accordingly. It will also manage loading states, errors, and provide an abort mechanism.

**Location:** `lib/hooks/useResearchAgent.ts` (Create this directory and file)

---

### Step 3.1: Hook Skeleton and Basic State Management

**Action:** Define the basic structure of the `useResearchAgent` hook, import dependencies, and set up local state for the `AbortController`.

**Details:**
In `lib/hooks/useResearchAgent.ts`:

```typescript
// lib/hooks/useResearchAgent.ts
'use client'; // This hook will be used in client components

import { useState, useCallback, useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai'; // useAtomValue for reading if needed directly in hook
import {
    researchStatusAtom,
    researchLogAtom,
    generatedQueriesAtom,
    analyzedDocsSummaryAtom,
    synthesisDetailsAtom,
    finalReportContentAtom,
    resetResearchStateAtom, // Import the reset atom
} from '@/lib/state/researchAtoms'; // Adjust path as needed
import type {
    ClientSearchQuery,
    ClientAnalyzedDoc,
    ClientSynthesis,
    ClientFinalReport,
    // ResearchStatus is already part of researchStatusAtom's type
} from '@/lib/state/researchAtoms'; // Assuming types are also exported from here or a dedicated types file

import {
    conductResearch, // The Server Action from Phase 1
} from '@/app/actions/researchAgentOrchestrator'; // Adjust path
import type {
    ResearchUpdate,
    ResearchStage, // Keep consistency
} from '@/app/actions/researchAgentOrchestrator';

export function useResearchAgent() {
    // Get Jotai setters
    const setResearchStatus = useSetAtom(researchStatusAtom);
    const setResearchLog = useSetAtom(researchLogAtom);
    const setGeneratedQueries = useSetAtom(generatedQueriesAtom);
    const setAnalyzedDocs = useSetAtom(analyzedDocsSummaryAtom);
    const setSynthesisDetails = useSetAtom(synthesisDetailsAtom);
    const setFinalReportContent = useSetAtom(finalReportContentAtom);
    const resetAllResearchState = useSetAtom(resetResearchStateAtom);

    // Local state for the AbortController
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    // Placeholder for startResearch and abortResearch
    const startResearch = useCallback(async (legalQuestion: string) => {
        // To be implemented
        console.log("Starting research for:", legalQuestion);
    }, [/* dependencies will be added */]);

    const abortResearch = useCallback(() => {
        // To be implemented
        console.log("Aborting research");
    }, [/* dependencies will be added */]);

    // Read global loading/error state for exporting from the hook
    const currentStatus = useAtomValue(researchStatusAtom);

    return {
        startResearch,
        abortResearch,
        isLoading: currentStatus.isLoading,
        currentStage: currentStatus.stage,
        currentMessage: currentStatus.message, // Expose orchestrator message
        error: currentStatus.error,
        // Individual data atoms will be consumed directly by UI components using useAtomValue
    };
}
```

- Import Jotai hooks (`useSetAtom`, `useAtomValue`) and all relevant atoms from Phase 2.
- Import `conductResearch` Server Action and its stream types (`ResearchUpdate`, `ResearchStage`) from Phase 1.
- Define the `useResearchAgent` function.
- Use `useSetAtom` for all atoms that this hook will modify.
- Initialize `abortController` state as `null`.
- Stub out `startResearch` and `abortResearch` functions.
- Return the core interface: `startResearch`, `abortResearch`, and derived status properties from `researchStatusAtom`.

**Acceptance Criteria 3.1:**
- ✅ `useResearchAgent.ts` file created.
- ✅ Hook imports all necessary Jotai atoms and server action types.
- ✅ `useState` for `abortController` is initialized.
- ✅ `startResearch` and `abortResearch` functions are defined (stubbed).
- ✅ Hook returns `startResearch`, `abortResearch`, `isLoading`, `currentStage`, `currentMessage`, `error`.

---

### Step 3.2: Implement `startResearch` - Initialization and Server Action Call

**Action:** Flesh out the `startResearch` function to initialize state, create an `AbortController`, and call the `conductResearch` server action.

**Details:**
Modify `startResearch` within `useResearchAgent.ts`:

```typescript
    const startResearch = useCallback(async (legalQuestion: string) => {
        // Prevent multiple concurrent runs from this hook instance
        const currentStatusValue = researchStatusAtom.init // Or get(researchStatusAtom) if inside jotai context
                                                      // This is a bit tricky, direct read outside component/hook render.
                                                      // A ref to isLoading or checking status via useAtomValue is safer.
                                                      // For simplicity, let's assume we'll manage this via the global status.
                                                      // The isLoading check outside is better.

        // Reset all relevant Jotai states before starting a new research process (PRD FR4.3.2)
        resetAllResearchState(undefined); // Writing any value triggers the reset

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

        try {
            const stream = await conductResearch(legalQuestion);
            // Stream processing logic will be added in the next step (3.3)
            // For now, just log that the stream was received
            console.log("Received stream from conductResearch");

            // Placeholder: Simulate stream ending after a bit for testing phase
            // setTimeout(() => {
            //     if (!controller.signal.aborted) {
            //         setResearchStatus(prev => ({ ...prev, isLoading: false, stage: "COMPLETED", message: "Research finished (stub)." }));
            //         setResearchLog(prev => [...prev, `${new Date().toISOString()} [COMPLETED] Research finished (stub).`]);
            //         setAbortController(null);
            //     }
            // }, 5000);

        } catch (error: any) {
            console.error("Error calling conductResearch server action:", error);
            if (error.name === 'AbortError') {
                setResearchStatus({ stage: "IDLE", isLoading: false, error: "Research aborted by client before stream started.", message: "Aborted." });
                setResearchLog(prev => [...prev, `${new Date().toISOString()} [ERROR] Research aborted before stream started.`]);
            } else {
                setResearchStatus({ stage: "ERROR", isLoading: false, error: error.message || "Failed to start research.", message: "Error starting research."});
                setResearchLog(prev => [...prev, `${new Date().toISOString()} [ERROR] Failed to start research: ${error.message}`]);
            }
            setAbortController(null); // Clear controller on error
        }
    }, [resetAllResearchState, setResearchStatus, setResearchLog, setAbortController /* add other setters as deps */]);

    // Add other setters to useCallback dependencies as they are used
    // e.g. [resetAllResearchState, setResearchStatus, setResearchLog, setGeneratedQueries, ... , setAbortController]
```

- Use `useCallback` for `startResearch`.
- **Important:** Before anything, call `resetAllResearchState()` to clear previous run data (PRD FR4.3.2).
- Set `researchStatusAtom` to `INITIALIZING`, `isLoading: true`, clear errors, set initial message.
- Add an entry to `researchLogAtom`.
- Create a new `AbortController` and store it using `setAbortController`.
- Call `await conductResearch(legalQuestion)`.
- Wrap the call in `try...catch` to handle errors during the server action invocation itself (e.g., network error before stream starts).
- Update `useCallback` dependencies array.

**Acceptance Criteria 3.2:**
- ✅ `startResearch` resets all relevant data atoms via `resetAllResearchState`.
- ✅ `researchStatusAtom` is updated to `INITIALIZING`, `isLoading: true`.
- ✅ An initial log message is added to `researchLogAtom`.
- ✅ A new `AbortController` is created and stored.
- ✅ `conductResearch` server action is called.
- ✅ Basic error handling for the `conductResearch` call itself is present.

**Checkpoint 1:** Create a minimal UI component that uses `useResearchAgent`. Add a button to call `startResearch`. Verify in browser dev tools / Jotai dev tools that:
	1. `researchStatusAtom` changes to `isLoading: true`, `stage: "INITIALIZING"`.
	2. The network request for `conductResearch` is initiated.
	3. The orchestrator (from Phase 1) starts streaming its initial `INITIALIZING` status (you'll see this in the network tab for the server action, not yet processed by the hook).

---

### Step 3.3: Implement Stream Processing Logic within `startResearch`

**Action:** Add the logic to read the `ReadableStream` from `conductResearch`, parse `ResearchUpdate` objects, and update Jotai atoms. (PRD FR4.2.2, FR4.3.1)

**Details:**
This is the core of the hook. Modify the `try` block in `startResearch`:

```typescript
    // ... (inside startResearch, after `const stream = await conductResearch(legalQuestion);`)

            const reader = stream.pipeThrough(new TextDecoderStream(), { signal: controller.signal }).getReader();
            // eslint-disable-next-line no-constant-condition
            while (true) {
                try {
                    const { value, done } = await reader.read();

                    if (controller.signal.aborted) {
                        // Stream reading was aborted externally.
                        // No need to set status here, abortResearch will handle it or it's already handled.
                        console.log("Stream reading aborted by AbortController.");
                        // Ensure reader is released if `cancel` is not called on the stream itself.
                        // reader.releaseLock(); // Only if not cancelling the stream. Cancelling should release it.
                        break;
                    }

                    if (done) {
                        // Stream finished successfully from the server side
                        setResearchStatus(prev => ({
                            ...prev,
                            isLoading: false,
                            stage: prev.error ? "ERROR" : "COMPLETED", // If an error was set during streaming, keep ERROR stage
                            message: prev.error ? prev.message : "Research process completed.",
                        }));
                        setResearchLog(prev => [...prev, `${new Date().toISOString()} [${get(researchStatusAtom).error ? "ERROR" : "COMPLETED"}] Stream ended.`]);
                        setAbortController(null); // Clear controller on successful completion
                        break;
                    }

                    if (value) {
                        const stringUpdates = value.split('\n').filter(s => s.trim() !== '');
                        stringUpdates.forEach(stringUpdate => {
                            if (controller.signal.aborted) return; // Check again before processing each sub-chunk
                            try {
                                const update = JSON.parse(stringUpdate) as ResearchUpdate;

                                // Update researchLogAtom first
                                setResearchLog(prevLogs => [...prevLogs, `${new Date().toISOString()} [${update.stage}] (${update.type}) ${update.message || ''}`.trim()]);

                                // Update researchStatusAtom based on any incoming status
                                setResearchStatus(prevStatus => ({
                                    ...prevStatus,
                                    stage: update.stage, // Always update stage
                                    isLoading: true, // Still loading while stream is active
                                    message: update.message || prevStatus.message, // Update message if provided
                                    currentProcessedDoc: update.currentProcessedDoc !== undefined ? update.currentProcessedDoc : prevStatus.currentProcessedDoc,
                                    totalDocsToProcess: update.totalDocsToProcess !== undefined ? update.totalDocsToProcess : prevStatus.totalDocsToProcess,
                                    currentStreamingField: update.fieldName || prevStatus.currentStreamingField, // Track what field is streaming
                                }));

                                switch (update.type) {
                                    case "STATUS_CHANGE":
                                    case "PROGRESS":
                                    case "LOG":
                                        // Status and Log already handled by updating researchStatusAtom and researchLogAtom above
                                        break;
                                    case "DATA":
                                        // Update specific data atoms based on update.stage and update.data
                                        if (update.stage === "GENERATING_QUERIES" && update.data?.queries) {
                                            setGeneratedQueries(update.data.queries.map((q: any) => ({ // Cast 'any' if orchestrator structure is loose
                                                query_string: q.query_string,
                                                expected_information_summary: q.expected_information_summary,
                                            })));
                                        } else if (update.stage === "ANALYZING_DOCUMENTS" && update.data?.docId) {
                                            const docData = update.data as Partial<ClientAnalyzedDoc> & {docId: string};
                                            setAnalyzedDocs(prevDocs => {
                                                const existingDocIndex = prevDocs.findIndex(d => d.docId === docData.docId);
                                                if (existingDocIndex > -1) {
                                                    const updatedDocs = [...prevDocs];
                                                    updatedDocs[existingDocIndex] = { ...updatedDocs[existingDocIndex], ...docData };
                                                    return updatedDocs;
                                                }
                                                return [...prevDocs, docData as ClientAnalyzedDoc];
                                            });
                                        } else if (update.stage === "SYNTHESIZING_FINDINGS" && update.data?.topics) {
                                            setSynthesisDetails(update.data as ClientSynthesis);
                                        } else if (update.stage === "GENERATING_REPORT" && update.data) {
                                            const reportData = update.data;
                                            setFinalReportContent(prevReport => {
                                                let newReport = { ...prevReport };
                                                if (reportData.report_title) newReport.title = reportData.report_title;

                                                // Handle streaming text for specific fields
                                                if (update.fieldName === "executiveSummary" && reportData.executive_summary_chunk) {
                                                    newReport.executiveSummary = (update.isFieldComplete ? '' : prevReport.executiveSummary) + reportData.executive_summary_chunk;
                                                } else if (reportData.executiveSummary && update.isFinalForStage) { // Non-streaming or final part of summary
                                                    newReport.executiveSummary = reportData.executiveSummary;
                                                }

                                                if (update.fieldName?.startsWith("sectionContent_") && reportData.sectionUpdate) {
                                                    const sectionIndex = parseInt(update.fieldName.split("_")[1], 10);
                                                    const chunk = reportData.sectionUpdate.content_chunk;
                                                    newReport.sections = [...(prevReport.sections || [])];
                                                    if (!newReport.sections[sectionIndex]) {
                                                        newReport.sections[sectionIndex] = { title: reportData.sectionUpdate.title || `Section ${sectionIndex + 1}`, content: "" };
                                                    } else if (reportData.sectionUpdate.title) { // Update title if provided
                                                        newReport.sections[sectionIndex].title = reportData.sectionUpdate.title;
                                                    }
                                                    newReport.sections[sectionIndex].content = (update.isFieldComplete ? '' : newReport.sections[sectionIndex].content) + chunk;

                                                } else if (reportData.sections && update.isFinalForStage) { // Full sections data if sent at once
                                                    newReport.sections = reportData.sections;
                                                }

                                                if (update.fieldName === "conclusion" && reportData.conclusion_chunk) {
                                                    newReport.conclusion = (update.isFieldComplete ? '' : prevReport.conclusion) + reportData.conclusion_chunk;
                                                } else if (reportData.conclusion && update.isFinalForStage) {
                                                    newReport.conclusion = reportData.conclusion;
                                                }

                                                // Handle non-streaming parts of final report data
                                                if (update.isFinalForStage) {
                                                    if(reportData.limitations) newReport.limitations = reportData.limitations;
                                                    if(reportData.appendixDocIds) newReport.appendixDocIds = reportData.appendixDocIds;
                                                }

                                                return newReport;
                                            });
                                        }
                                        break;
                                    case "ERROR":
                                        setResearchStatus({ stage: update.stage, isLoading: false, error: update.message || "An error occurred during streaming.", message: update.message});
                                        // reader.cancel(); // Important: Stop further processing of the stream
                                        // setAbortController(null); // Clear controller
                                        // return; // Exit the forEach and potentially the while loop
                                        // Note: reader.cancel() will cause the while loop's await reader.read() to throw,
                                        // which will be caught by the outer try-catch.
                                        // So, the error handling below in the outer catch will manage final state.
                                        // We should throw here to propagate to the outer catch, which will call reader.cancel() if needed.
                                        throw new Error(update.message || "Streamed error event");
                                }
                            } catch (parseError: any) {
                                console.error("Error parsing streamed JSON update:", parseError, "Raw chunk:", stringUpdate);
                                setResearchLog(prev => [...prev, `${new Date().toISOString()} [SYSTEM_ERROR] Failed to parse stream update: ${stringUpdate}`]);
                                // Potentially set a generic error state if parsing fails critically
                                // For now, we log and continue, assuming other chunks might be fine.
                                // If this is a fatal error, we should throw to stop stream processing.
                            }
                        });
                    }
                } catch (streamReadError: any) {
                     // This catch block handles errors from `await reader.read()`, including if `reader.cancel()` was called.
                    if (controller.signal.aborted || streamReadError.name === 'AbortError') {
                        console.log("Stream reading was aborted.");
                        // Status already set by abortResearch or external signal
                        setResearchStatus(prev => ({ ...prev, isLoading: false, message: prev.error || "Research aborted."}));
                    } else {
                        console.error("Error reading from stream:", streamReadError);
                        setResearchStatus({ stage: "ERROR", isLoading: false, error: streamReadError.message || "Stream read error", message: "Error reading stream." });
                        setResearchLog(prev => [...prev, `${new Date().toISOString()} [STREAM_ERROR] Error reading stream: ${streamReadError.message}`]);
                    }
                    // No need to call reader.releaseLock() if stream was cancelled or errored out this way,
                    // as cancel() or the error itself should release it.
                    setAbortController(null);
                    break; // Exit while loop
                }
            } // end while(true)
    // ... (rest of startResearch, including the outer try...catch...finally)
```

- `stream.pipeThrough(new TextDecoderStream(), { signal: controller.signal })`: Decodes UTF-8 and crucially, allows the stream to be aborted via the `AbortController`.
- Loop `reader.read()` until `done`.
- Split `value` by `\n` and parse each line as JSON `ResearchUpdate`.
- **Critical:** Add robust `try...catch` around `JSON.parse(stringUpdate)` because partial/malformed JSON chunks can occur.
- **Update `researchStatusAtom`:** Always update `stage` from the `ResearchUpdate`. Update `message`, `currentProcessedDoc`, `totalDocsToProcess`, `currentStreamingField`. Keep `isLoading: true` as long as the stream is active.
- **Update `researchLogAtom`:** Append a formatted log entry using `update.stage`, `update.type`, and `update.message`.
- **`switch (update.type)`:**
	- `STATUS_CHANGE`, `PROGRESS`, `LOG`: These mainly update `researchStatusAtom` and `researchLogAtom`, which is already done.
	- `DATA`: This is where specific data atoms are updated.
		- Use `update.stage` to determine which atom to update (e.g., `GENERATING_QUERIES` -> `setGeneratedQueries`).
		- **Streaming Text:** For fields like `executiveSummary` or `section.content` (identified by `update.fieldName`):
			- If `update.isFieldComplete` is true (or it's the final DATA update for the report stage and the field is present), *replace* the content in the Jotai atom.
			- Otherwise, *append* `update.data.chunk` (or similar) to the existing string in the Jotai atom.
			- Example for `setFinalReportContent`:

				```typescript
                setFinalReportContent(prevReport => {
                    let newReport = { ...prevReport };
                    if (update.fieldName === "executiveSummary") {
                        newReport.executiveSummary = (update.isFieldComplete ? '' : prevReport.executiveSummary) + (update.data?.executive_summary_chunk || '');
                    } else if (update.fieldName?.startsWith("sectionContent_")) {
                        const index = parseInt(update.fieldName.split('_')[1]);
                        newReport.sections = [...prevReport.sections]; // Ensure array exists
                        if(!newReport.sections[index]) newReport.sections[index] = {title: update.data?.sectionUpdate?.title || '', content: ''};
                        else if(update.data?.sectionUpdate?.title) newReport.sections[index].title = update.data.sectionUpdate.title; // Update title if it arrives
                        newReport.sections[index].content = (update.isFieldComplete ? '' : newReport.sections[index].content) + (update.data?.sectionUpdate?.content_chunk || '');
                    }
                    // ... similar for other fields ...
                    // if update.isFinalForStage, populate other non-streaming fields from update.data
                    return newReport;
                });
                ```

	- `ERROR`: Update `researchStatusAtom` with the error, set `isLoading: false`. Crucially, you might want to `throw new Error(update.message)` here to break out of the `stringUpdates.forEach` and then the `while(true)` loop, letting the outer `catch` in `startResearch` handle final cleanup and `reader.cancel()`.
- **`done` condition:** When `reader.read()` returns `done: true`, set `researchStatusAtom` to `COMPLETED` (if no prior error) and `isLoading: false`. Clear `abortController`.
- **Error Handling in Loop:** The `try...catch` around `reader.read()` handles read errors or cancellation. The `try...catch` around `JSON.parse` handles malformed chunks.

**Acceptance Criteria 3.3:**
- ✅ `startResearch` correctly reads and decodes the stream from `conductResearch`.
- ✅ Each newline-separated JSON string from the stream is parsed as a `ResearchUpdate`.
- ✅ `researchStatusAtom` is updated correctly for `STATUS_CHANGE`, `PROGRESS`, `LOG` updates (stage, message, loading indicators).
- ✅ `researchLogAtom` is appended with formatted log messages.
- ✅ For `DATA` updates:
	- ✅ `generatedQueriesAtom` is updated based on `GENERATING_QUERIES` stage data.
	- ✅ `analyzedDocsSummaryAtom` is updated (items added/updated) based on `ANALYZING_DOCUMENTS` stage data.
	- ✅ `synthesisDetailsAtom` is updated based on `SYNTHESIZING_FINDINGS` stage data.
	- ✅ `finalReportContentAtom` fields are updated (text appended for streaming fields, replaced for others) based on `GENERATING_REPORT` stage data and `update.fieldName`.
- ✅ If an `ERROR` type `ResearchUpdate` is received, `researchStatusAtom.error` is set, `isLoading` becomes false, and stream processing stops.
- ✅ When the stream ends (`done: true`), `researchStatusAtom` is set to `COMPLETED` (or `ERROR` if an error occurred mid-stream) and `isLoading` to `false`.
- ✅ `AbortController.signal.aborted` is checked to stop processing if aborted.

**Checkpoint 2:** Thoroughly test the stream processing.
	1. Use the mock orchestrator from Phase 1 that streams various `ResearchUpdate` types.
	2. Verify each Jotai atom is populated correctly based on the `update.type` and `update.stage`.
	3. Verify streaming text fields (e.g., in `finalReportContentAtom`) are built progressively.
	4. Simulate an `ERROR` update from the orchestrator and check `researchStatusAtom`.
	5. Verify behavior when the stream completes successfully.

---

### Step 3.4: Implement `abortResearch` Functionality (PRD FR4.4)

**Action:** Implement the `abortResearch` function to cancel the ongoing stream.

**Details:**
Modify `abortResearch` within `useResearchAgent.ts`:

```typescript
    const abortResearch = useCallback(() => {
        if (abortController) {
            console.log("useResearchAgent: Abort signal sent.");
            abortController.abort(); // This will cause reader.read() in startResearch to throw an AbortError
            // The status update to indicate abortion will be handled in the catch block of startResearch's stream reading loop.
            // Or, if the stream hasn't started reading yet, in the catch block of the conductResearch call.
            setResearchStatus(prev => ({
                ...prev,
                isLoading: false, // Stop loading indication immediately on user action
                error: "Research manually aborted.", // Set an error/status message
                message: "Research process aborted by user.",
                // stage: prev.stage, // Keep current stage or set to a specific "ABORTED" stage
            }));
            setResearchLog(prev => [...prev, `${new Date().toISOString()} [USER_ACTION] Research abortion requested.`]);
            // No need to setAbortController(null) here, the stream error/done handler will do it.
        } else {
            console.log("useResearchAgent: No active research to abort.");
        }
    }, [abortController, setResearchStatus, setResearchLog]);
```

- Use `useCallback`.
- If `abortController` exists, call `abortController.abort()`.
- The actual stopping of the stream reading and final status update will occur in the `catch` block of the `reader.read()` loop or the `conductResearch` call in `startResearch` when it detects the `AbortError`.
- Immediately update status to reflect abortion attempt.

**Acceptance Criteria 3.4:**
- ✅ `abortResearch` calls `abort()` on the current `AbortController` if it exists.
- ✅ Clicking an "Abort" button (to be added in UI in Phase 4) during an active stream correctly stops the stream processing in `startResearch`.
- ✅ `researchStatusAtom` is updated to reflect the aborted state.

**Checkpoint 3:** Add a temporary "Abort" button in your test UI. Start research, then click Abort.
	1. Verify the `AbortError` is caught in `startResearch`.
	2. Verify `researchStatusAtom` is updated appropriately (e.g., `isLoading: false`, `error: "Research aborted"`).
	3. Verify no more updates are processed from the stream.

---

### Phase 3 Completion Criteria & Checkpoints:

1. **`useResearchAgent` Hook Implemented:**
	- ✅ Exports `startResearch`, `abortResearch`, `isLoading`, `currentStage`, `currentMessage`, `error`.
2. **`startResearch` Functionality:**
	- ✅ Resets all relevant Jotai data atoms using `resetResearchStateAtom`.
	- ✅ Sets initial loading/status states in `researchStatusAtom` and logs.
	- ✅ Creates and manages an `AbortController`.
	- ✅ Successfully calls `conductResearch` server action and obtains a `ReadableStream`.
	- ✅ Reads and decodes the stream.
	- ✅ Parses each newline-separated JSON string into `ResearchUpdate` objects.
	- ✅ Handles malformed JSON chunks gracefully (logs error, attempts to continue if sensible).
	- ✅ Correctly updates `researchStatusAtom` (`stage`, `isLoading`, `error`, `message`, progress counters, `currentStreamingField`) based on *all* `ResearchUpdate` types.
	- ✅ Correctly updates `researchLogAtom` for all relevant `ResearchUpdate` types.
	- ✅ Correctly updates data atoms (`generatedQueriesAtom`, `analyzedDocsSummaryAtom`, `synthesisDetailsAtom`, `finalReportContentAtom`) based on `ResearchUpdate` of `type: "DATA"`, including progressive appending for streaming text fields.
	- ✅ Handles stream completion (`done: true`) by setting final status (e.g., `COMPLETED`) and clearing `isLoading`.
	- ✅ Handles errors from `conductResearch` call and stream reading errors (including `AbortError`).
3. **`abortResearch` Functionality:**
	- ✅ Calls `abort()` on the active `AbortController`.
	- ✅ Leads to the stream processing in `startResearch` being terminated.
4. **Jotai Atom Usage:**
	- ✅ Only uses `useSetAtom` for updating state within the hook.
	- ✅ `useAtomValue` is used (or `researchStatusAtom.init` carefully considered) if needing to read current status for logic *within* the hook, but primarily the hook *sets* atoms, and UI components *read* them.
5. **No Direct UI Logic:**
	- ✅ The hook itself does not contain any JSX or direct DOM manipulation logic. It only interacts with Jotai state.
6. **Comprehensive Test (Manual/Integration for now):**
	- Set up a basic UI page that uses the `useResearchAgent` hook.
	- Provide an input field for `legalQuestion` and a "Start Research" button.
	- Display all relevant Jotai atom states (e.g., `currentStage`, `isLoading`, `error`, content of data atoms) on the page reactively.
	- Add an "Abort Research" button.
	- **Scenario 1 (Full Run):** Execute `startResearch` with a question that makes the mock orchestrator go through all stages to `COMPLETED`. Verify all Jotai atoms are updated correctly at each stage, and streaming text fields build up.
	- **Scenario 2 (Early Termination by Orchestrator):** Modify the mock orchestrator to send an `ERROR` update mid-pipeline. Verify the hook updates `researchStatusAtom.error` and stops.
	- **Scenario 3 (User Abort):** Start research, then click the "Abort" button. Verify stream processing stops and status reflects abortion.
	- **Scenario 4 (Malformed Stream Data):** (Harder to test without modifying orchestrator) If possible, simulate a malformed JSON chunk and ensure the hook logs an error but attempts to continue or fails gracefully.

This detailed plan for Phase 3 sets up the client-side engine. Once this is robustly implemented and tested against the Phase 1 orchestrator (even with its mock data for `fetchDocumentsFromQueries`), Phase 4 (UI integration) will be much smoother as UI components will just need to subscribe to the well-managed Jotai atoms.
