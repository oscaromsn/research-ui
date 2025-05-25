// lib/state/researchAtoms.ts

import { atom } from 'jotai';
import type { ResearchStage } from '@/app/actions/researchAgentOrchestrator';

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

// --- Core Jotai Atoms ---

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
// Using an array for easier UI mapping and ordered display
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

// Atom for tracking which analyzed document is currently selected in the UI
export const selectedAnalyzedDocIdAtom = atom<string | null>(null);

// --- Reset Functionality ---

// Atom to trigger reset of all research-related states
// This is a write-only atom. Writing any value to it will trigger the reset logic.
export const resetResearchStateAtom = atom(null, (get, set, _value) => {
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
  set(selectedAnalyzedDocIdAtom, null);
});

/*
 * Decision on Streaming Text Handling (Step 2.4):
 * 
 * For v1 implementation, streaming text will be handled using simple string 
 * appends to atom fields. The useResearchAgent hook (Phase 3) will update 
 * atoms using patterns like:
 * 
 * setFinalReportContentAtom(prev => ({ 
 *   ...prev, 
 *   executiveSummary: prev.executiveSummary + chunk 
 * }))
 * 
 * React's reconciliation will handle UI updates efficiently. Future versions
 * may use more complex structures (arrays of strings/objects) if fine-grained
 * paragraph-level UI control is needed.
 */