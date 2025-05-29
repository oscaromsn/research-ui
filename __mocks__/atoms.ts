import { vi } from "vitest";

import {
    createMockAnalyzedDocument,
    createMockLegalEntity,
    createMockSearchQuery,
} from "../__tests__/test-utils";

// Mock analyzed-document atoms
export const analyzedDocumentAtom = { init: createMockAnalyzedDocument() };
export const analyzedDocumentsAtom = {
    init: [
        createMockAnalyzedDocument(),
        createMockAnalyzedDocument({ searchResultId: "mock-id-2" }),
    ],
};
export const currentDocumentSummaryAtom = { init: "Mock summary" };
export const currentDocumentArgumentsAtom = {
    init: ["Mock argument 1", "Mock argument 2"],
};
export const currentDocumentEntitiesAtom = {
    init: [
        createMockLegalEntity(),
        createMockLegalEntity({ name: "Another Entity", type: "Statute" }),
    ],
};
export const setCurrentDocumentAtom = { init: null, write: vi.fn() };
export const addDocumentAtom = { init: null, write: vi.fn() };

// Mock legal-entity atoms
export const legalEntitiesAtom = {
    init: [
        createMockLegalEntity(),
        createMockLegalEntity({ name: "Statute Entity", type: "Statute" }),
    ],
};
export const caseEntitiesAtom = { init: [createMockLegalEntity()] };
export const statuteEntitiesAtom = {
    init: [createMockLegalEntity({ name: "Statute Entity", type: "Statute" })],
};
export const addLegalEntityAtom = { init: null, write: vi.fn() };
export const addLegalEntitiesAtom = { init: null, write: vi.fn() };
export const clearLegalEntitiesAtom = { init: null, write: vi.fn() };

// Mock search-queries atoms
export const legalQueryAnalysisAtom = {
    init: {
        reasoning: {
            analyzeLegalQuestion: { summary: "Mock analyze question" },
            considerRelevantLegalPrinciples: {
                summary: "Mock legal principles",
            },
            formulateSearchQueriesStrategy: { summary: "Mock search strategy" },
            specifyExpectedInformationStrategy: {
                summary: "Mock expectation strategy",
            },
            ensureComprehensiveCoverageStrategy: {
                summary: "Mock coverage strategy",
            },
        },
        searchQueries: [
            createMockSearchQuery(),
            createMockSearchQuery({ queryString: "Another mock query" }),
        ],
    },
};
export const searchQueriesAtom = {
    init: [
        createMockSearchQuery(),
        createMockSearchQuery({ queryString: "Another mock query" }),
    ],
};
export const detailedReasoningAtom = {
    init: {
        analyzeLegalQuestion: { summary: "Mock analyze question" },
        considerRelevantLegalPrinciples: { summary: "Mock legal principles" },
        formulateSearchQueriesStrategy: { summary: "Mock search strategy" },
        specifyExpectedInformationStrategy: {
            summary: "Mock expectation strategy",
        },
        ensureComprehensiveCoverageStrategy: {
            summary: "Mock coverage strategy",
        },
    },
};
export const updateSearchQueriesAtom = { init: null, write: vi.fn() };
export const updateDetailedReasoningAtom = { init: null, write: vi.fn() };
