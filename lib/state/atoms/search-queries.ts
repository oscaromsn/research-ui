import { atom } from 'jotai';

/**
 * Represents a single step in the detailed reasoning process.
 */
export interface ReasoningStep {
  summary: string;
  itemsConsidered?: string[];
}

/**
 * Structured representation of the LLM's thought process.
 */
export interface DetailedReasoning {
  analyzeLegalQuestion: ReasoningStep;
  considerRelevantLegalPrinciples: ReasoningStep;
  formulateSearchQueriesStrategy: ReasoningStep;
  specifyExpectedInformationStrategy: ReasoningStep;
  ensureComprehensiveCoverageStrategy: ReasoningStep;
}

/**
 * Represents a single search query with its expected information.
 */
export interface SearchQueryItem {
  queryString: string;
  expectedInformation: string[];
}

/**
 * Final output structure for legal query analysis.
 */
export interface LegalQueryAnalysis {
  reasoning: DetailedReasoning;
  searchQueries: SearchQueryItem[];
}

// Initial state for search query analysis
const initialLegalQueryAnalysis: LegalQueryAnalysis = {
  reasoning: {
    analyzeLegalQuestion: { summary: '' },
    considerRelevantLegalPrinciples: { summary: '' },
    formulateSearchQueriesStrategy: { summary: '' },
    specifyExpectedInformationStrategy: { summary: '' },
    ensureComprehensiveCoverageStrategy: { summary: '' }
  },
  searchQueries: []
};

// Atoms
export const legalQueryAnalysisAtom = atom<LegalQueryAnalysis>(initialLegalQueryAnalysis);

// Derived atoms for specific parts of the analysis
export const searchQueriesAtom = atom(
  (get) => get(legalQueryAnalysisAtom).searchQueries
);

export const detailedReasoningAtom = atom(
  (get) => get(legalQueryAnalysisAtom).reasoning
);

// Writable derived atoms for updating specific parts
export const updateSearchQueriesAtom = atom(
  null,
  (get, set, searchQueries: SearchQueryItem[]) => {
    const currentAnalysis = get(legalQueryAnalysisAtom);
    set(legalQueryAnalysisAtom, {
      ...currentAnalysis,
      searchQueries
    });
  }
);

export const updateDetailedReasoningAtom = atom(
  null,
  (get, set, reasoning: DetailedReasoning) => {
    const currentAnalysis = get(legalQueryAnalysisAtom);
    set(legalQueryAnalysisAtom, {
      ...currentAnalysis,
      reasoning
    });
  }
);