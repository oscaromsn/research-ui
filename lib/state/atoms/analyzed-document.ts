import { atom } from 'jotai';
import type { DetailedReasoning } from './search-queries';

// Define LegalEntity interface here since we haven't created the file yet
export interface LegalEntity {
  name: string;
  type: 'Case' | 'Statute' | 'Regulation' | 'Person' | 'Organization' | 'LegalConcept' | 'Jurisdiction';
  details?: string;
}

/**
 * Represents the LLM's detailed analysis of a single search result
 */
export interface AnalyzedDocument {
  searchResultId: string;
  relevanceScore: number;
  confidenceScore: number;
  summary: string;
  keyArgumentsAndReasoning: string[];
  extractedEntities: LegalEntity[];
  extractedQuotes: string[];
  counterArgumentsOrNuances?: string[];
  reasoning: DetailedReasoning;
}

// Initial state for an analyzed document
const initialAnalyzedDocument: AnalyzedDocument = {
  searchResultId: '',
  relevanceScore: 0,
  confidenceScore: 0,
  summary: '',
  keyArgumentsAndReasoning: [],
  extractedEntities: [],
  extractedQuotes: [],
  counterArgumentsOrNuances: [],
  reasoning: {
    analyzeLegalQuestion: { summary: '' },
    considerRelevantLegalPrinciples: { summary: '' },
    formulateSearchQueriesStrategy: { summary: '' },
    specifyExpectedInformationStrategy: { summary: '' },
    ensureComprehensiveCoverageStrategy: { summary: '' }
  }
};

// Atoms
export const analyzedDocumentAtom = atom<AnalyzedDocument | null>(null);
export const analyzedDocumentsAtom = atom<AnalyzedDocument[]>([]);

// Derived atoms
export const currentDocumentSummaryAtom = atom(
  (get) => get(analyzedDocumentAtom)?.summary || ''
);

export const currentDocumentArgumentsAtom = atom(
  (get) => get(analyzedDocumentAtom)?.keyArgumentsAndReasoning || []
);

export const currentDocumentEntitiesAtom = atom(
  (get) => get(analyzedDocumentAtom)?.extractedEntities || []
);

// Action atoms
export const setCurrentDocumentAtom = atom(
  null,
  (get, set, documentId: string) => {
    const documents = get(analyzedDocumentsAtom);
    const document = documents.find(doc => doc.searchResultId === documentId) || null;
    set(analyzedDocumentAtom, document);
  }
);

export const addDocumentAtom = atom(
  null,
  (get, set, document: AnalyzedDocument) => {
    const documents = get(analyzedDocumentsAtom);
    // Replace if exists, otherwise add
    const index = documents.findIndex(doc => doc.searchResultId === document.searchResultId);
    
    if (index >= 0) {
      const newDocuments = [...documents];
      newDocuments[index] = document;
      set(analyzedDocumentsAtom, newDocuments);
    } else {
      set(analyzedDocumentsAtom, [...documents, document]);
    }
  }
);