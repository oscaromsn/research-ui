# 2.2. Implementation plan - Phase 2

Alright, let's dive into Phase 2: Client-Side State Management using Jotai. This phase is about creating the client-side data stores that will be populated by the `useResearchAgent` hook (from Phase 3) based on updates from the server-side orchestrator (Phase 1).

## Phase 2: Implement Client-Side State Management (Jotai)

**Goal:** Define Jotai atoms to hold all research-related data that needs to be displayed or managed on the client. These atoms will serve as the single source of truth for the UI and will be updated by the `useResearchAgent` hook.

**Location:** `lib/state/researchAtoms.ts` (Create this directory and file if they don't exist)

---

### Step 2.1: Define Client-Friendly Data Types

**Action:** Define TypeScript interfaces for the data structures that will be stored in Jotai atoms. These types should be tailored for UI display and abstract away the full complexity of BAML types. (PRD FR3.2)

**Details:**
In `lib/state/researchAtoms.ts` (or a separate `lib/state/researchTypes.ts` imported by it):

```typescript
// lib/state/researchAtoms.ts (or researchTypes.ts)

// Import ResearchStage from the orchestrator to ensure consistency
import type { ResearchStage } from '@/app/actions/researchAgentOrchestrator'; // Adjust path as needed

// --- Client-Friendly Data Structures ---

export interface ClientSearchQuery {
    query_string: string;
    expected_information_summary?: string; // Summarized from BAML type
}

export interface ClientAnalyzedDoc {
    docId: string; // Corresponds to SearchResultItem.id
    title?: string;
    relevanceScore?: number;
    confidenceScore?: number;
    summarySnippet?: string; // Potentially streaming, progressively built
    // Add other fields as needed for display, e.g., key entities string[]
}

export interface ClientSynthesisTopic {
    title: string;
    synthesisSnippet: string; // Potentially streaming
    confidence?: number;
    docIds?: string[];
}

export interface ClientSynthesis {
    topics: ClientSynthesisTopic[];
    unansweredAspects?: string[];
    emergingQuestions?: string[];
    reasoningSummary?: string; // Summarized
}

export interface ClientReportSection {
    title: string;
    content: string; // Potentially streaming
}

export interface ClientFinalReport {
    title: string;
    executiveSummary: string; // Potentially streaming
    sections: ClientReportSection[];
    conclusion: string; // Potentially streaming
    limitations?: string[];
    appendixDocIds?: string[];
}

export interface ResearchStatus {
    stage: ResearchStage | null;
    isLoading: boolean;
    error: string | null;
    message?: string; // General status message from orchestrator
    currentProcessedDoc?: number;
    totalDocsToProcess?: number;
    currentStreamingField?: string; // e.g., "executiveSummary", "sections[0].content"
}
```

- These types are designed to hold the *summarized* or *display-oriented* versions of data received from the `ResearchUpdate.data` payload.
- Fields intended for streaming (like `summarySnippet`, `synthesisSnippet`, `content`) are simple strings that will be built up by the `useResearchAgent` hook.
- `ResearchStatus` will consolidate all status-related information.

**Acceptance Criteria 2.1:**
- ✅ All `Client*` interfaces and `ResearchStatus` are defined in TypeScript.
- ✅ Types clearly distinguish between data that might be progressively built (like snippets) and data that arrives complete.
- ✅ `ResearchStage` is imported from the orchestrator to maintain consistency.

---

### Step 2.2: Define Core Jotai Atoms (PRD FR3.1)

**Action:** Define the primary Jotai atoms using the client-friendly types.

**Details:**
In `lib/state/researchAtoms.ts`:

```typescript
import { atom } from 'jotai';
// Import client-friendly types defined in Step 2.1
import type {
    ClientSearchQuery,
    ClientAnalyzedDoc,
    ClientSynthesis,
    ClientFinalReport,
    ResearchStatus, // Already includes ResearchStage
} from './researchAtoms'; // Or './researchTypes' if separated

// FR3.1.1: researchStatusAtom
export const researchStatusAtom = atom<ResearchStatus>({
    stage: "IDLE", // Initial stage
    isLoading: false,
    error: null,
    message: "Ready to start research.",
    currentProcessedDoc: 0,
    totalDocsToProcess: 0,
    currentStreamingField: undefined,
});

// FR3.1.2: researchLogAtom
export const researchLogAtom = atom<string[]>([]);

// FR3.1.3: generatedQueriesAtom
export const generatedQueriesAtom = atom<ClientSearchQuery[]>([]);

// FR3.1.4: analyzedDocsSummaryAtom
// This could be a map for easier updates by docId: atom<Record<string, ClientAnalyzedDoc>>({});
// Or an array if order matters more / easier for UI:
export const analyzedDocsSummaryAtom = atom<ClientAnalyzedDoc[]>([]);

// FR3.1.5: synthesisDetailsAtom
export const synthesisDetailsAtom = atom<ClientSynthesis>({
    topics: [],
    unansweredAspects: [],
    emergingQuestions: [],
    reasoningSummary: '',
});

// FR3.1.6: finalReportContentAtom
export const finalReportContentAtom = atom<ClientFinalReport>({
    title: '',
    executiveSummary: '',
    sections: [],
    conclusion: '',
    limitations: [],
    appendixDocIds: [],
});

// --- Derived Atoms (Optional but Recommended for UI Convenience) ---

export const isResearchLoadingAtom = atom(
    (get) => get(researchStatusAtom).isLoading
);

export const currentResearchStageAtom = atom(
    (get) => get(researchStatusAtom).stage
);

export const researchErrorAtom = atom(
    (get) => get(researchStatusAtom).error
);

// Example: Atom for a specific streaming text field for easier consumption
export const executiveSummaryDisplayAtom = atom(
    (get) => get(finalReportContentAtom).executiveSummary
);

export const reportSectionsDisplayAtom = atom(
    (get) => get(finalReportContentAtom).sections
);
```

- Each atom is initialized with an empty or default state.
- `researchStatusAtom` uses the `ResearchStatus` type from Step 2.1.
- Consider if `analyzedDocsSummaryAtom` should be an array or a `Record<string, ClientAnalyzedDoc>` for easier individual document updates. An array is simpler for direct mapping in UI lists. If frequent updates to specific docs happen, a record might be better. For now, an array is fine as per PRD.
- Derived atoms (`isResearchLoadingAtom`, etc.) are good practice for encapsulating common state reads for UI components.

**Acceptance Criteria 2.2:**
- ✅ All specified Jotai atoms (`researchStatusAtom`, `researchLogAtom`, `generatedQueriesAtom`, `analyzedDocsSummaryAtom`, `synthesisDetailsAtom`, `finalReportContentAtom`) are defined using `atom()`.
- ✅ Each atom is initialized with a sensible default/empty state matching its type.
- ✅ At least one derived atom (e.g., `isResearchLoadingAtom`) is implemented as an example.

**Checkpoint 1 (Conceptual):** Review the defined client-friendly types and atom structures. Do they adequately represent the information the UI needs to display at each stage of the research process? Are they sufficiently decoupled from the raw BAML output types?

---

### Step 2.3: Define Helper Atoms for Resetting State (Optional but Good Practice)

**Action:** Create a "reset" atom or specific setter atoms that can clear all research-related state. This will be used by the `useResearchAgent` hook before starting new research.

**Details:**
In `lib/state/researchAtoms.ts`:

```typescript
// ... (previous atom definitions)

// Atom to trigger reset of all research-related states
// This is a write-only atom. Writing any value to it will trigger the reset logic.
export const resetResearchStateAtom = atom(null, (get, set) => {
    set(researchStatusAtom, {
        stage: "IDLE",
        isLoading: false,
        error: null,
        message: "Ready.",
        currentProcessedDoc: 0,
        totalDocsToProcess: 0,
        currentStreamingField: undefined,
    });
    set(researchLogAtom, []);
    set(generatedQueriesAtom, []);
    set(analyzedDocsSummaryAtom, []);
    set(synthesisDetailsAtom, {
        topics: [],
        unansweredAspects: [],
        emergingQuestions: [],
        reasoningSummary: '',
    });
    set(finalReportContentAtom, {
        title: '',
        executiveSummary: '',
        sections: [],
        conclusion: '',
        limitations: [],
        appendixDocIds: [],
    });
});
```

- This `resetResearchStateAtom` is a write-only atom. When `set(resetResearchStateAtom, undefined)` (or any value) is called, it executes the provided setter function, which in turn resets all other relevant atoms.
- This encapsulates the reset logic cleanly.

**Acceptance Criteria 2.3:**
- ✅ A mechanism (like `resetResearchStateAtom`) is implemented to reset all defined research state atoms to their initial values.

---

### Step 2.4: (Self-Correction/Refinement) Consider Atom Granularity for Streaming Text

**Action:** Review atoms holding potentially long, streaming text (e.g., `finalReportContentAtom.executiveSummary` or `section.content`). Decide if current string-based atoms are sufficient or if more complex structures are needed for fine-grained UI updates during streaming.

**Details:**

- For initial implementation (v1), having the `useResearchAgent` hook (Phase 3) *append* to string fields within these atoms (e.g., `setFinalReportContentAtom(prev => ({ ...prev, executiveSummary: prev.executiveSummary + chunk }))`) is acceptable. React's reconciliation will handle UI updates.
- **Future Consideration (Not for this phase, but to keep in mind):** If individual paragraphs or sub-sections within a streaming field need distinct UI handling (e.g., animations per paragraph), the atom structure might need to become an array of strings or objects for that field. For now, a single string is fine.

**No specific code change for this step in Phase 2, but a conscious decision point.**

**Acceptance Criteria 2.4:**
- ✅ A decision is made and documented (even as a comment) on how streaming text will be stored in atoms (simple string appends are okay for v1).

---

### Phase 2 Completion Criteria & Checkpoints:

1. **All Files and Types Created:**
	- ✅ `lib/state/researchAtoms.ts` (and optionally `lib/state/researchTypes.ts`) exist.
	- ✅ All `Client*` interfaces (`ClientSearchQuery`, `ClientAnalyzedDoc`, `ClientSynthesis`, `ClientFinalReport`) and the `ResearchStatus` interface are defined.
2. **Jotai Atoms Defined:**
	- ✅ `researchStatusAtom` is defined with the correct `ResearchStatus` type and initial state.
	- ✅ `researchLogAtom` is defined as `atom<string[]>([])`.
	- ✅ `generatedQueriesAtom` is defined as `atom<ClientSearchQuery[]>([])`.
	- ✅ `analyzedDocsSummaryAtom` is defined as `atom<ClientAnalyzedDoc[]>([])`.
	- ✅ `synthesisDetailsAtom` is defined as `atom<ClientSynthesis>({ topics: [], unansweredAspects: [], ... })`.
	- ✅ `finalReportContentAtom` is defined as `atom<ClientFinalReport>({ title: '', ... })`.
3. **Reset Functionality:**
	- ✅ A `resetResearchStateAtom` (or equivalent mechanism) is implemented that can reset all data-holding atoms to their initial states.
4. **Type Consistency:**
	- ✅ `ResearchStage` type used in `researchStatusAtom` is consistent with (ideally imported from) the type defined in `researchAgentOrchestrator.ts`.
5. **No Business Logic:**
	- ✅ The `researchAtoms.ts` file should contain only type definitions and Jotai atom definitions. No complex data transformation logic or hook implementations should reside here.
6. **Testability (Mental Check / Prep for Phase 3):**
	- ✅ The defined atoms are structured in a way that the `useResearchAgent` hook (to be built in Phase 3) can easily update them based on the `ResearchUpdate` objects it will receive. For example, updating `analyzedDocsSummaryAtom` will likely involve finding an existing doc by ID or appending a new one.
	- ✅ UI components (to be connected in Phase 4) will be able to easily consume these atoms using `useAtomValue` for display.

**Checkpoint 2 (End of Phase 2):**
- The entire client-side state schema for the research pipeline is defined using Jotai atoms.
- These atoms are ready to be written to by the `useResearchAgent` hook and read by UI components.
- The data structures are client-friendly and provide a level of abstraction from the direct BAML output types.

With Phase 2 complete, you have the client-side "data containers" ready. Phase 3 will focus on creating the `useResearchAgent` hook that populates these containers by interacting with the server-side orchestrator from Phase 1.
