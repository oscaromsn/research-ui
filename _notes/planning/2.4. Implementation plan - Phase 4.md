# 2.4. Implementation plan - Phase 4

Okay, let's lay out the detailed plan for Phase 4: Frontend UI Components Integration. This phase focuses on making the existing UI components dynamic by connecting them to the Jotai state atoms (managed by the `useResearchAgent` hook from Phase 3) and enabling user interactions to trigger the research pipeline.

## Phase 4: Integrate Frontend UI Components with Jotai State and `useResearchAgent` Hook

**Goal:** Connect the existing React components (`GuidanceStrategy`, `EvidenceAnalysis`, `SynthesisReporting`, `ReportDrafter`, `ResearchLifecycle`, Modals) to the Jotai state atoms and the `useResearchAgent` hook to create a fully interactive and dynamic user interface for LexiSynth.

**Assumptions:**
*   Phase 1 (Server-Side Orchestrator) is complete and can stream `ResearchUpdate` objects.
*   Phase 2 (Jotai Atoms) is complete, and all necessary atoms are defined.
*   Phase 3 (`useResearchAgent` hook) is complete and correctly updates Jotai atoms based on orchestrator streams.

---

### Step 4.1: Main Application Page Setup (`app/page.tsx` or equivalent root component)

**Action:** Integrate `useResearchAgent` at a high level, likely in the main page component or a top-level client component that wraps the domain UIs. Provide UI elements to initiate research and display global status/errors.

**Details:**
Let's assume your main page will host `GuidanceStrategy`, `EvidenceAnalysis`, and `SynthesisReporting` within a layout. We'll manage the agent interaction from a wrapper or directly in the component that houses the "Start Research" button (likely `GuidanceStrategy.tsx`, but could be a parent).

*   If not already present, ensure your root layout or page component is a Client Component (`'use client';`) if it needs to directly use hooks or manage interaction state. Often, a specific "interactive" section of the page is made a client component. For LexiSynth, the entire research interface will likely be client-side interactive.
*   **In the component responsible for initiating research (e.g., `GuidanceStrategy.tsx` or a new parent `ResearchOrchestratorUI.tsx`):**
    1.  Import `useResearchAgent` and relevant Jotai atoms.
    2.  Instantiate the hook: `const agent = useResearchAgent();`
    3.  Manage local state for the `legalQuestion` input.
    4.  Wire the "Start Research" button's `onClick` to `() => agent.startResearch(legalQuestion)`.
    5.  Disable the input and "Start Research" button based on `agent.isLoading`.
    6.  Display global error messages from `agent.error`.
    7.  Display the current overall research stage from `agent.currentStage` or `agent.currentMessage`.

**Example Snippet (Conceptual - likely in `GuidanceStrategy.tsx` or a wrapper):**
```tsx
// components/domain/guidance/guidance-strategy.tsx OR a new wrapper component
'use client';

import { useState } from 'react';
import { useResearchAgent } from '@/lib/hooks/useResearchAgent'; // Adjust path
import { useAtomValue } from 'jotai';
import { researchLogAtom, /* other atoms for display */ } from '@/lib/state/researchAtoms'; // Adjust path
// ... other imports (Button, Input, etc.)

export function GuidanceSection() { // Or whatever your top-level UI orchestrator is
    const [legalQuestion, setLegalQuestion] = useState('');
    const agent = useResearchAgent();
    const logs = useAtomValue(researchLogAtom); // Example of consuming an atom

    const handleStart = () => {
        if (legalQuestion.trim()) {
            agent.startResearch(legalQuestion);
        }
    };

    const handleAbort = () => {
        agent.abortResearch();
    };

    return (
        <div>
            {/* Input for legal question */}
            <input
                type="text"
                value={legalQuestion}
                onChange={(e) => setLegalQuestion(e.target.value)}
                placeholder="Enter your legal question..."
                disabled={agent.isLoading}
            />
            <button onClick={handleStart} disabled={agent.isLoading}>
                {agent.isLoading ? `Processing: ${agent.currentStage} - ${agent.currentMessage || ''}` : "Start Research"}
            </button>
            {agent.isLoading && (
                <button onClick={handleAbort}>Abort</button>
            )}
            {agent.error && <p style={{ color: 'red' }}>Error: {agent.error}</p>}

            {/* Display research logs */}
            <h3>Research Logs:</h3>
            <pre>{logs.join('\n')}</pre>

            {/* Other sections will consume their specific atoms */}
            {/* <GeneratedQueriesDisplay /> */}
            {/* <AnalyzedDocumentsDisplay /> */}
            {/* ... etc. ... */}
        </div>
    );
}
```

**Acceptance Criteria 4.1:**
*   ✅ The `useResearchAgent` hook is instantiated in a relevant client component.
*   ✅ User can input a legal question.
*   ✅ "Start Research" button calls `agent.startResearch()`.
*   ✅ Button and input are disabled when `agent.isLoading` is true.
*   ✅ A basic display of `agent.currentStage`, `agent.currentMessage`, and `agent.error` is visible.
*   ✅ An "Abort Research" button calls `agent.abortResearch()` and is visible only when `agent.isLoading`.
*   ✅ `researchLogAtom` content is displayed.

**Checkpoint 1:**
*   Run the application. Enter a legal question and click "Start Research."
*   Verify the UI shows "Initializing...", then progresses through stages logged by the `researchLogAtom` and `agent.currentStage/Message`.
*   Verify the input field and "Start Research" button are disabled during processing.
*   Test the "Abort Research" button: click it mid-stream and verify the process stops and an abort message appears.
*   Induce an error from the orchestrator (e.g., by having `fetchDocumentsFromQueries` throw an error) and verify `agent.error` is displayed.

---

### Step 4.2: Integrate `ResearchLifecycle.tsx` (PRD FR5.6.1)

**Action:** Make the `ResearchLifecycle` component dynamic based on `researchStatusAtom.stage`.

**Details:**
In `components/domain/guidance/research-lifecycle.tsx`:

```tsx
// components/domain/guidance/research-lifecycle.tsx
'use client';

import { useAtomValue } from 'jotai';
import { researchStatusAtom } from '@/lib/state/researchAtoms'; // Adjust path
import type { ResearchStage } from '@/app/actions/researchAgentOrchestrator'; // Adjust path
import { CheckSquare, Compass, Lightbulb, Loader2, Pen, Search } from "lucide-react"; // Ensure all icons are imported

// Mapping from orchestrator stages to lifecycle display stages
const stageOrder: ResearchStage[] = [
    "INITIALIZING", // Could map to "Ideate" or "Plan"
    "GENERATING_QUERIES", // Maps to "Plan" or "Research"
    "FETCHING_DOCUMENTS", // Maps to "Research"
    "ANALYZING_DOCUMENTS", // Maps to "Analyze"
    "SYNTHESIZING_FINDINGS", // Maps to "Analyze" or "Review"
    "ASSESSING_RESEARCH", // Maps to "Review"
    "GENERATING_REPORT", // Maps to "Draft"
    "COMPLETED",
    // "IDLE", "ITERATION_PAUSED", "HUMAN_REVIEW_REQUESTED", "ERROR" might need special handling or not be directly on lifecycle
];

const lifecycleStageMap: Record<string, { name: string, icon: JSX.Element }> = {
    Ideate: { name: "Ideate", icon: <Lightbulb size={16} /> },
    Plan: { name: "Plan", icon: <Compass size={16} /> },
    Research: { name: "Research", icon: <Search size={16} /> },
    Analyze: { name: "Analyze", icon: <div style={{ width: 16, height: 16 }} /> /* Placeholder, consider better icon */ },
    Review: { name: "Review", icon: <CheckSquare size={16} /> },
    Draft: { name: "Draft", icon: <Pen size={16} /> },
};

const researchStageToLifecycleName = (stage: ResearchStage | null): string => {
    if (!stage) return "Ideate"; // Default or initial
    switch (stage) {
        case "INITIALIZING": return "Ideate";
        case "GENERATING_QUERIES": return "Plan";
        case "FETCHING_DOCUMENTS": return "Research";
        case "ANALYZING_DOCUMENTS": return "Analyze";
        case "SYNTHESIZING_FINDINGS": return "Analyze"; // Or "Review"
        case "ASSESSING_RESEARCH": return "Review";
        case "GENERATING_REPORT": return "Draft";
        default: return "Ideate"; // Or a specific "Unknown" state
    }
};

export function ResearchLifecycle() {
    const status = useAtomValue(researchStatusAtom);
    const activeLifecycleStageName = researchStageToLifecycleName(status.stage);

    const uiStages = Object.values(lifecycleStageMap).map(lsStage => {
        const lifecycleStageIndex = Object.keys(lifecycleStageMap).indexOf(lsStage.name);
        const activeLifecycleStageIndex = Object.keys(lifecycleStageMap).indexOf(activeLifecycleStageName);

        let currentStatus: 'completed' | 'active' | 'pending' = 'pending';
        if (status.stage === "COMPLETED" || status.stage === "ERROR" || status.stage === "HUMAN_REVIEW_REQUESTED" || status.stage === "ITERATION_PAUSED") {
            // If overall process is done/stuck, mark all stages up to the point of stop/completion as completed or active
            if (lifecycleStageIndex < activeLifecycleStageIndex) currentStatus = 'completed';
            else if (lifecycleStageIndex === activeLifecycleStageIndex) currentStatus = (status.stage === "ERROR" || status.stage === "HUMAN_REVIEW_REQUESTED" || status.stage === "ITERATION_PAUSED") ? 'active' : 'completed'; // Active if error/paused, completed if COMPLETED
            else currentStatus = 'pending';

            if(status.stage === "COMPLETED" && lifecycleStageIndex <= activeLifecycleStageIndex) currentStatus = 'completed';

        } else if (status.isLoading) {
            if (lifecycleStageIndex < activeLifecycleStageIndex) currentStatus = 'completed';
            else if (lifecycleStageIndex === activeLifecycleStageIndex) currentStatus = 'active';
            else currentStatus = 'pending';
        } else { // Idle
             currentStatus = 'pending'; // Or all 'pending' if IDLE, or first as 'active'
        }

        return {
            ...lsStage,
            status: currentStatus,
        };
    });

    return (
        <div className="flex items-center">
            <div className="flex items-center">
                {uiStages.map((stage, index) => (
                    <div
                        key={stage.name}
                        className="group flex flex-col items-center mx-1"
                    >
                        <div
                            className={`
              flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300
              ${stage.status === "active" ? "bg-[#3a7bb7] text-white" : stage.status === "completed" ? "bg-green-500 dark:bg-green-600 text-white" : "bg-[#242a3d] text-[#6b7280]"}
              ${index !== uiStages.length - 1 ? "relative" : ""}
            `}
                        >
                            {stage.status === "active" && status.isLoading ? ( // Only show loader if also globally loading
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="absolute z-10">
                                        {stage.icon}
                                    </div>
                                    <Loader2
                                        size={22}
                                        className="absolute opacity-40 animate-spin"
                                    />
                                </div>
                            ) : (
                                stage.icon
                            )}
                            {index !== uiStages.length - 1 && (
                                <div
                                    className={`absolute left-8 top-1/2 -translate-y-1/2 w-6 h-[1px] transition-colors duration-300 ${stage.status === "pending" && uiStages[index+1]?.status === 'pending' ? "bg-[#242a3d]" : "bg-green-500 dark:bg-green-600"}`}
                                />
                            )}
                        </div>
                        <span
                            className={`text-xs mt-2 transition-colors duration-300 ${stage.status === "active" ? "text-[#3a7bb7] font-medium" : stage.status === "completed" ? "text-green-500 dark:text-green-400" : "text-[#6b7280]"}`}
                        >
                            {stage.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
```
1.  Import `useAtomValue` and `researchStatusAtom`.
2.  Read `status = useAtomValue(researchStatusAtom)`.
3.  Modify the hardcoded `stages` array logic to dynamically determine `status` ('completed', 'active', 'pending') for each lifecycle stage based on `status.stage`. This will require mapping `ResearchStage` values to the UI's lifecycle stages (Ideate, Plan, etc.).
    *   For example, `GENERATING_QUERIES` might map to "Plan" being active. `ANALYZING_DOCUMENTS` might map to "Analyze" being active.
    *   A stage is 'completed' if the `currentStage` in `researchStatusAtom` is past it.
    *   A stage is 'active' if `currentStage` maps to it and `isLoading` is true.
    *   A stage is 'pending' if `currentStage` is before it.
    *   Handle `COMPLETED`, `ERROR`, `HUMAN_REVIEW_REQUESTED`, `ITERATION_PAUSED` stages from the orchestrator to reflect correctly (e.g., "Review" might be active if `HUMAN_REVIEW_REQUESTED`).

**Acceptance Criteria 4.2:**
*   ✅ `ResearchLifecycle` component dynamically updates its visual stage indicators based on `researchStatusAtom.stage`.
*   ✅ The "active" stage shows a loading spinner only if `researchStatusAtom.isLoading` is also true.
*   ✅ Connectors between stages reflect completion status.

---

### Step 4.3: Integrate `GuidanceStrategy.tsx` (PRD FR5.2)

**Action:** Connect input fields, buttons, and display areas to Jotai state and `useResearchAgent`.

**Details:**
In `components/domain/guidance/guidance-strategy.tsx`:

1.  As per 4.1, instantiate `useResearchAgent`. Manage `legalQuestion` with `useState`.
2.  Wire "Start Research" button to `agent.startResearch(legalQuestion)`. Disable based on `agent.isLoading`.
3.  **Display Generated Queries:**
    *   Import `useAtomValue` and `generatedQueriesAtom`.
    *   `const queries = useAtomValue(generatedQueriesAtom);`
    *   Map `queries` to display them (currently shows a hardcoded query).
4.  **Display Agent Assessment:**
    *   This section displays info related to `ResearchAssessment` BAML type.
    *   Read data from `synthesisDetailsAtom` (for `unanswered_aspects`) and `researchStatusAtom` (for `assessment_summary` if you decide to put it there via `update.message`, or create a new atom for `ClientResearchAssessment`).
    *   The PRD implies `ResearchAssessment.assessment_summary` should be displayed. This means `useResearchAgent` (Phase 3) needs to populate an atom with this data when `ASSESSING_RESEARCH` `DATA` update is received.
    *   Button "View Assessment Reasoning": For v1, this can be disabled or open a modal with placeholder text. Populating it requires the full `DetailedReasoning` from `ResearchAssessment`, which might be too large for the main stream. This could be a candidate for a separate fetch-on-demand action if full reasoning is needed.

**Acceptance Criteria 4.3:**
*   ✅ Legal question input works, and "Start Research" triggers `agent.startResearch`.
*   ✅ Generated queries from `generatedQueriesAtom` are displayed dynamically.
*   ✅ Agent Assessment section displays summary and next action dynamically from relevant Jotai atoms. (A new atom `researchAssessmentAtom` holding `ClientResearchAssessment` might be needed, updated by `useResearchAgent`).

---

### Step 4.4: Integrate `EvidenceAnalysis.tsx` (PRD FR5.3)

**Action:** Populate the search results list and detail panel from Jotai state.

**Details:**
In `components/domain/legal-research/evidence-analysis.tsx`:

1.  **Display Analyzed Document Summaries:**
    *   Remove hardcoded `searchResults`.
    *   Import `useAtomValue` and `analyzedDocsSummaryAtom`.
    *   `const analyzedDocs = useAtomValue(analyzedDocsSummaryAtom);`
    *   Map over `analyzedDocs` to render the list items. `result.selected` logic will need to change. Introduce a new atom `selectedAnalyzedDocIdAtom = atom<string | null>(null)`.
    *   `onClick` on a list item should `setSelectedAnalyzedDocIdAtom(doc.docId)`.
    *   Highlight the selected item based on `selectedAnalyzedDocIdAtom`.
2.  **Display Selected Document Details:**
    *   Read `const selectedId = useAtomValue(selectedAnalyzedDocIdAtom);`
    *   `const currentFullDocumentDetails = useAtomValue(useMemo(() => atom(get => get(analyzedDocsSummaryAtom).find(d => d.docId === get(selectedAnalyzedDocIdAtom))), [selectedAnalyzedDocIdAtom]));` (or a more direct atom if `analyzedDocsSummaryAtom` stores full `ClientAnalyzedDoc` objects that include all details needed for this panel).
    *   The detail panel (relevance, summary, key arguments, entities) should display data from `currentFullDocumentDetails`.
    *   **Streaming Text:** The `summarySnippet` field in `ClientAnalyzedDoc` (and potentially others like arguments) will be updated progressively by `useResearchAgent`. The UI should re-render automatically.
3.  **"View Analysis Reasoning" Button:** Similar to `GuidanceStrategy`, can be disabled or open a modal with placeholder/summarized reasoning for v1.

**Acceptance Criteria 4.4:**
*   ✅ List of analyzed documents dynamically populates from `analyzedDocsSummaryAtom`.
*   ✅ Clicking a document in the list updates `selectedAnalyzedDocIdAtom` and highlights it.
*   ✅ The detail panel shows information for the selected document from `analyzedDocsSummaryAtom`.
*   ✅ Text fields like "Summary" in the detail panel update progressively if they are being streamed by the orchestrator and updated in `analyzedDocsSummaryAtom` by `useResearchAgent`.

**Checkpoint 2:**
*   Start a research task.
*   Verify `GuidanceStrategy` shows generated queries.
*   Verify `EvidenceAnalysis` shows a list of (mock) analyzed documents appearing one by one (or summaries updating).
*   Clicking a document updates the detail panel.
*   If `AnalyzeSingleDocument.summary` is streamed (via orchestrator sending chunks for it), verify the summary in the detail panel builds up progressively.

---

### Step 4.5: Integrate `SynthesisReporting.tsx` and `ReportDrafter.tsx` (PRD FR5.4, FR5.5)

**Action:** Connect these components to `synthesisDetailsAtom` and `finalReportContentAtom`.

**Details:**
In `components/domain/report-generation/synthesis-reporting.tsx`:

1.  **Synthesis Studio Tab:**
    *   Remove hardcoded topics and unanswered aspects.
    *   Import `useAtomValue` and `synthesisDetailsAtom`.
    *   `const synthesis = useAtomValue(synthesisDetailsAtom);`
    *   Display `synthesis.topics` and `synthesis.unansweredAspects`.
    *   The `synthesisSnippet` within each topic should update progressively if streamed.
    *   "View Synthesis Reasoning" button: Similar to others, placeholder/disabled for v1, or show `synthesis.reasoningSummary`.

In `components/domain/report-generation/report-drafter.tsx`:

1.  **Report Content Display:**
    *   Remove hardcoded report content.
    *   Import `useAtomValue` and `finalReportContentAtom`.
    *   `const report = useAtomValue(finalReportContentAtom);`
    *   Display `report.title`, `report.executiveSummary`, map `report.sections` to display their `title` and `content`, and display `report.conclusion`.
    *   All these text fields (`executiveSummary`, `section.content`, `conclusion`) should update progressively as they are streamed by the orchestrator and updated in the Jotai atom by `useResearchAgent`.

**Acceptance Criteria 4.5:**
*   ✅ "Synthesis Studio" tab dynamically displays data from `synthesisDetailsAtom`. Text fields update progressively during streaming.
*   ✅ "Report Drafter" tab dynamically displays data from `finalReportContentAtom`. Text fields update progressively during streaming.

---

### Step 4.6: Integrate Modals (PRD FR5.7)

**Action:** Connect content of `CaseModal` and `SynthesisReasoningModal` to dynamic data if simple summaries are sufficient for v1, or keep them as placeholders for more detailed future fetches.

**Details:**

*   **`CaseModal.tsx`:**
    *   Currently, it receives `caseData` prop (title, source, court, date). This data is derived from the (mock) `searchResults` in `EvidenceAnalysis.tsx`. When `EvidenceAnalysis` uses `analyzedDocsSummaryAtom`, this prop will be sourced from `ClientAnalyzedDoc`.
    *   The "Key Holdings" and "Full Text" are currently hardcoded. For v1, these can remain hardcoded/placeholders, or display the `summarySnippet` from `ClientAnalyzedDoc`. Displaying full text or detailed AI analysis reasoning might require a separate fetch if not included in `ClientAnalyzedDoc`.
*   **`SynthesisReasoningModal.tsx`:**
    *   Currently hardcoded. For v1, this modal could display the `synthesis.reasoningSummary` from `synthesisDetailsAtom`. Full `DetailedReasoning` for synthesis might be too complex for the main stream.

**Acceptance Criteria 4.6:**
*   ✅ `CaseModal` displays basic dynamic information (title, source) derived from the selected `ClientAnalyzedDoc`.
*   ✅ `SynthesisReasoningModal` displays a summarized reasoning string from `synthesisDetailsAtom.reasoningSummary` (if this field is added to `ClientSynthesis` and populated by `useResearchAgent`). Other content can remain placeholder.

**Checkpoint 3 (Final for Phase 4):**
*   Perform a full end-to-end run of the application with a `legalQuestion`.
*   Verify:
    *   `ResearchLifecycle` updates correctly through all stages.
    *   `GuidanceStrategy` shows initial queries and later, assessment details.
    *   `EvidenceAnalysis` lists analyzed documents, and details update upon selection. Streaming summaries are visible.
    *   `SynthesisReporting` (Synthesis Studio) shows synthesized topics. Streaming synthesis snippets are visible.
    *   If the pipeline reaches report generation: `ReportDrafter` shows the report title, and text fields (exec summary, sections, conclusion) stream in progressively.
    *   All UI elements reflect `isLoading` states correctly.
    *   Error states are gracefully handled and displayed if the orchestrator sends an `ERROR` update.

---

### Phase 4 Completion Criteria & Checkpoints:

1.  **Full UI Dynamism:** All key display components (`GuidanceStrategy`, `EvidenceAnalysis`, `SynthesisReporting`, `ReportDrafter`, `ResearchLifecycle`) are driven by Jotai state atoms, not hardcoded data.
2.  **`useResearchAgent` Integration:** The `useResearchAgent` hook is the primary driver for initiating research and receiving status updates.
3.  **Jotai Atom Consumption:** UI components correctly use `useAtomValue` to subscribe to and display data from the atoms defined in Phase 2.
4.  **Streaming Text Display:** All fields intended for progressive display (summaries, synthesis, report content) update in the UI as new text chunks arrive via the orchestrator stream and are processed by `useResearchAgent` into Jotai atoms.
5.  **Loading and Error States:** UI correctly reflects `isLoading`, `currentStage`, `currentMessage`, and `error` states from `researchStatusAtom` (via `useResearchAgent`). Buttons are disabled appropriately.
6.  **User Interaction Flow:**
    *   ✅ User can type a legal question.
    *   ✅ "Start Research" button triggers the `useResearchAgent.startResearch()` method.
    *   ✅ "Abort Research" button triggers `useResearchAgent.abortResearch()` and stops the client-side stream processing and updates the UI state accordingly.
7.  **Modal Integration (Basic):** Modals for settings, case details, and synthesis reasoning are wired to open/close, and display basic dynamic data where feasible for v1 (e.g., selected case title, summarized reasoning).
8.  **No Direct BAML Client Usage in UI:** UI components do *not* directly import or use the BAML client (`b`) or BAML-generated hooks (`useGenerateLegalSearchQueries`, etc.). All BAML interaction is abstracted by `useResearchAgent` (which itself calls the single Server Action `conductResearch`).
9.  **PRD Feature Coverage (Visual):** The UI visually represents all major features outlined in PRD section 2.2 (though some, like actual document retrieval, are simulated server-side).

This detailed plan provides a clear path for integrating the frontend. The key is to ensure that `useResearchAgent` robustly updates the Jotai atoms, and the UI components simply react to those atom changes. This maintains the desired decoupling.