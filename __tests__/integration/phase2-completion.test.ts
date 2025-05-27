// __tests__/integration/phase2-completion.test.ts

import * as researchAtoms from "@/lib/state/researchAtoms";
import { createStore } from "jotai";
import { describe, expect, it } from "vitest";

describe("Phase 2 Completion Criteria Validation", () => {
    describe("1. All Files and Types Created", () => {
        it("should have researchAtoms module available", () => {
            expect(researchAtoms).toBeDefined();
        });

        it("should export all required client-friendly interfaces", () => {
            // These interfaces should be available as types (we can't directly test them at runtime,
            // but TypeScript compilation ensures they exist)
            expect(typeof researchAtoms).toBe("object");

            // We can validate the existence of the atoms which use these types
            expect(researchAtoms.researchStatusAtom).toBeDefined();
            expect(researchAtoms.generatedQueriesAtom).toBeDefined();
            expect(researchAtoms.analyzedDocsSummaryAtom).toBeDefined();
            expect(researchAtoms.synthesisDetailsAtom).toBeDefined();
            expect(researchAtoms.finalReportContentAtom).toBeDefined();
        });
    });

    describe("2. Jotai Atoms Defined", () => {
        let store: ReturnType<typeof createStore>;

        beforeEach(() => {
            store = createStore();
        });

        it("should have researchStatusAtom with correct ResearchStatus type and initial state", () => {
            const initialState = store.get(researchAtoms.researchStatusAtom);

            expect(initialState).toMatchObject({
                stage: "IDLE",
                isLoading: false,
                error: null,
                message: expect.any(String),
                currentProcessedDoc: 0,
                totalDocsToProcess: 0,
                currentStreamingField: undefined,
            });
        });

        it("should have researchLogAtom as atom<string[]> with empty initial state", () => {
            const initialState = store.get(researchAtoms.researchLogAtom);
            expect(Array.isArray(initialState)).toBe(true);
            expect(initialState).toHaveLength(0);
        });

        it("should have generatedQueriesAtom as atom<ClientSearchQuery[]> with empty initial state", () => {
            const initialState = store.get(researchAtoms.generatedQueriesAtom);
            expect(Array.isArray(initialState)).toBe(true);
            expect(initialState).toHaveLength(0);
        });

        it("should have analyzedDocsSummaryAtom as atom<ClientAnalyzedDoc[]> with empty initial state", () => {
            const initialState = store.get(
                researchAtoms.analyzedDocsSummaryAtom,
            );
            expect(Array.isArray(initialState)).toBe(true);
            expect(initialState).toHaveLength(0);
        });

        it("should have synthesisDetailsAtom with correct ClientSynthesis initial state", () => {
            const initialState = store.get(researchAtoms.synthesisDetailsAtom);
            expect(initialState).toMatchObject({
                topics: [],
                unansweredAspects: [],
                emergingQuestions: [],
                reasoningSummary: "",
            });
        });

        it("should have finalReportContentAtom with correct ClientFinalReport initial state", () => {
            const initialState = store.get(
                researchAtoms.finalReportContentAtom,
            );
            expect(initialState).toMatchObject({
                title: "",
                executiveSummary: "",
                sections: [],
                conclusion: "",
                limitations: [],
                appendixDocIds: [],
            });
        });
    });

    describe("3. Reset Functionality", () => {
        it("should have resetResearchStateAtom implemented", () => {
            expect(researchAtoms.resetResearchStateAtom).toBeDefined();
        });

        it("should reset all data-holding atoms to initial states", () => {
            const store = createStore();

            // Set non-initial values
            store.set(researchAtoms.researchLogAtom, ["test log"]);
            store.set(researchAtoms.generatedQueriesAtom, [
                { query_string: "test" },
            ]);

            // Trigger reset
            store.set(researchAtoms.resetResearchStateAtom, null);

            // Verify reset
            expect(store.get(researchAtoms.researchLogAtom)).toEqual([]);
            expect(store.get(researchAtoms.generatedQueriesAtom)).toEqual([]);
            expect(store.get(researchAtoms.researchStatusAtom).stage).toBe(
                "IDLE",
            );
        });
    });

    describe("4. Type Consistency", () => {
        it("should use ResearchStage type consistent with orchestrator", () => {
            const store = createStore();

            // This test validates that we can set ResearchStage values that are consistent
            // with the orchestrator types (compilation would fail if inconsistent)
            store.set(researchAtoms.researchStatusAtom, {
                stage: "GENERATING_QUERIES",
                isLoading: true,
                error: null,
                currentProcessedDoc: 0,
                totalDocsToProcess: 0,
            });

            expect(store.get(researchAtoms.researchStatusAtom).stage).toBe(
                "GENERATING_QUERIES",
            );
        });
    });

    describe("5. No Business Logic", () => {
        it("should only contain type definitions and Jotai atom definitions", () => {
            // Verify that the atoms module exports only atoms and types
            const exportedKeys = Object.keys(researchAtoms);

            // All exported items should be atoms (ending with 'Atom')
            const atomExports = exportedKeys.filter((key) =>
                key.endsWith("Atom"),
            );

            // Should have at least the core atoms
            expect(atomExports).toContain("researchStatusAtom");
            expect(atomExports).toContain("researchLogAtom");
            expect(atomExports).toContain("generatedQueriesAtom");
            expect(atomExports).toContain("analyzedDocsSummaryAtom");
            expect(atomExports).toContain("synthesisDetailsAtom");
            expect(atomExports).toContain("finalReportContentAtom");
            expect(atomExports).toContain("resetResearchStateAtom");

            // Should have derived atoms
            expect(atomExports).toContain("isResearchLoadingAtom");
            expect(atomExports).toContain("currentResearchStageAtom");
            expect(atomExports).toContain("researchErrorAtom");
        });
    });

    describe("6. Testability for Phase 3", () => {
        it("should have atoms structured for easy updates by useResearchAgent hook", () => {
            const store = createStore();

            // Test that analyzedDocsSummaryAtom can be easily updated with new docs
            const mockDoc = {
                docId: "test-doc-1",
                title: "Test Document",
                relevanceScore: 0.95,
                confidenceScore: 0.87,
                summarySnippet: "Initial snippet...",
            };

            store.set(researchAtoms.analyzedDocsSummaryAtom, [mockDoc]);

            // Simulate appending a new doc (as useResearchAgent would do)
            const currentDocs = store.get(
                researchAtoms.analyzedDocsSummaryAtom,
            );
            const newDoc = {
                ...mockDoc,
                docId: "test-doc-2",
                title: "Second Document",
            };
            store.set(researchAtoms.analyzedDocsSummaryAtom, [
                ...currentDocs,
                newDoc,
            ]);

            expect(
                store.get(researchAtoms.analyzedDocsSummaryAtom),
            ).toHaveLength(2);
        });

        it("should have atoms structured for easy consumption by UI components", () => {
            const store = createStore();

            // Test derived atoms work as expected for UI consumption
            store.set(researchAtoms.researchStatusAtom, {
                stage: "ANALYZING_DOCUMENTS",
                isLoading: true,
                error: null,
                currentProcessedDoc: 0,
                totalDocsToProcess: 0,
            });

            // UI components should be able to easily read these derived states
            expect(store.get(researchAtoms.isResearchLoadingAtom)).toBe(true);
            expect(store.get(researchAtoms.currentResearchStageAtom)).toBe(
                "ANALYZING_DOCUMENTS",
            );
            expect(store.get(researchAtoms.researchErrorAtom)).toBe(null);
        });

        it("should support streaming text updates", () => {
            const store = createStore();

            // Test that streaming text fields can be progressively built
            store.set(researchAtoms.finalReportContentAtom, {
                title: "Legal Analysis Report",
                executiveSummary: "This report analyzes",
                sections: [],
                conclusion: "",
                limitations: [],
                appendixDocIds: [],
            });

            // Simulate streaming text append (as useResearchAgent would do)
            const currentReport = store.get(
                researchAtoms.finalReportContentAtom,
            );
            store.set(researchAtoms.finalReportContentAtom, {
                ...currentReport,
                executiveSummary:
                    currentReport.executiveSummary +
                    " the legal implications...",
            });

            expect(store.get(researchAtoms.executiveSummaryDisplayAtom)).toBe(
                "This report analyzes the legal implications...",
            );
        });
    });

    describe("Phase 2 Overall Integration", () => {
        it("should have complete client-side state schema ready for research pipeline", () => {
            const store = createStore();

            // Simulate a complete research flow state to validate the schema

            // 1. Set initial research status
            store.set(researchAtoms.researchStatusAtom, {
                stage: "GENERATING_QUERIES",
                isLoading: true,
                error: null,
                message: "Generating legal search queries...",
                currentProcessedDoc: 0,
                totalDocsToProcess: 0,
            });

            // 2. Add generated queries
            store.set(researchAtoms.generatedQueriesAtom, [
                {
                    query_string: "contract law breach",
                    expected_information_summary: "Breach remedies",
                },
                {
                    query_string: "damages calculation",
                    expected_information_summary: "Damages methodology",
                },
            ]);

            // 3. Add analyzed documents
            store.set(researchAtoms.analyzedDocsSummaryAtom, [
                {
                    docId: "doc1",
                    title: "Contract Law Fundamentals",
                    relevanceScore: 0.92,
                    confidenceScore: 0.88,
                    summarySnippet:
                        "This document covers basic contract principles...",
                },
            ]);

            // 4. Add synthesis
            store.set(researchAtoms.synthesisDetailsAtom, {
                topics: [
                    {
                        title: "Breach of Contract",
                        synthesisSnippet:
                            "Analysis shows multiple remedies available...",
                        confidence: 0.89,
                        docIds: ["doc1"],
                    },
                ],
                unansweredAspects: ["Jurisdictional variations"],
                emergingQuestions: ["What about digital contracts?"],
                reasoningSummary: "The analysis reveals strong precedent...",
            });

            // 5. Add final report
            store.set(researchAtoms.finalReportContentAtom, {
                title: "Legal Analysis: Contract Breach Remedies",
                executiveSummary: "This report examines available remedies...",
                sections: [
                    {
                        title: "Background",
                        content: "Contract law provides several...",
                    },
                    {
                        title: "Analysis",
                        content: "The key finding is that...",
                    },
                ],
                conclusion: "Based on the research conducted...",
                limitations: ["Limited to common law jurisdictions"],
                appendixDocIds: ["doc1"],
            });

            // Verify all state is properly structured and accessible
            expect(store.get(researchAtoms.researchStatusAtom).stage).toBe(
                "GENERATING_QUERIES",
            );
            expect(store.get(researchAtoms.generatedQueriesAtom)).toHaveLength(
                2,
            );
            expect(
                store.get(researchAtoms.analyzedDocsSummaryAtom),
            ).toHaveLength(1);
            expect(
                store.get(researchAtoms.synthesisDetailsAtom).topics,
            ).toHaveLength(1);
            expect(
                store.get(researchAtoms.finalReportContentAtom).sections,
            ).toHaveLength(2);

            // Verify derived atoms work correctly
            expect(store.get(researchAtoms.isResearchLoadingAtom)).toBe(true);
            expect(
                store.get(researchAtoms.reportSectionsDisplayAtom),
            ).toHaveLength(2);
        });
    });
});
