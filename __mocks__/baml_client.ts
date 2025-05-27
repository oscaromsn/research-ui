    "@/components/domain/legal-research/modals/analysis-reasoning-modal",
    () => ({
        AnalysisReasoningModal: ({
            isOpen,
            onClose,
            onCloseAction,
            reasoning,
            documentTitle,
        }: {
            isOpen: boolean;
            onClose: () => void;
            onCloseAction: () => void;
            reasoning?: ClientAnalysisReasoning;
            documentTitle?: string;
        }) => {
                    </p>
                    <p data-testid="relevant-principles-summary">
                        {reasoning?.considerRelevantPrinciplesSummary}
                    </p>
                    <button onClick={onClose} aria-label="close-reasoning">
                    <button
                        onClick={onCloseAction}
                        aria-label="close-reasoning"
                    >
                        Close
                    </button>
                </div>
        const doc2Container = screen
            .getByText(
                "Richards Corp. v. Global Enterprises, 567 F.3d 890 (9th Cir. 2022)",
            )
            .closest('[role="button"]');
            .closest("button");

        // Check that the selected document has highlighting classes
        expect(doc2Container).toHaveClass(
 */

import { conductResearch } from "@/app/actions/researchAgentOrchestrator";
import type { ResearchUpdate } from "@/app/actions/researchAgentOrchestrator";
import { vi } from "vitest";

// Mock the BAML client to avoid real API calls
vi.mock("@/baml_client", () => import("@/__mocks__/baml_client"));

describe("Research Orchestrator - Basic Streaming", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should stream INITIALIZING and COMPLETED updates", async () => {
        const legalQuestion = "Test question";
        const stream = await conductResearch(legalQuestion);
import type {
    ResearchStage,
    ResearchUpdate,
} from "@/app/actions/researchAgentOrchestrator";
import { vi } from "vitest";

// Mock the BAML client to avoid real API calls
vi.mock("@/baml_client", () => import("@/__mocks__/baml_client"));

describe("Research Orchestrator - Phase 1 Verification", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should have all required types defined", () => {
        // Verify ResearchStage enum covers all required stages
        const requiredStages: ResearchStage[] = [
import type {
    SearchQueryItem,
    SearchResultItem,
} from "@/__mocks__/baml_client_types";
import type { SearchQueryItem, SearchResultItem } from "@/baml_client/types";
import { executeExaSearch } from "@/lib/utils/exaSearchUtil";
import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
    post: ReturnType<typeof vi.fn>;
    isAxiosError: ReturnType<typeof vi.fn>;
};
// Mock dotenv to prevent loading real environment variables
vi.mock("dotenv", () => ({
    config: vi.fn(() => ({})),
}));

// Mock environment
const originalEnv = process.env;
const TEST_EXA_API_KEY =
    process.env.EXA_API_KEY || "d76de983-9e5b-4ac6-9657-4ee54f692607";

beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.EXA_API_KEY = "test-exa-api-key";
    process.env.EXA_API_KEY = TEST_EXA_API_KEY;
});

afterEach(() => {

        // Check config
        expect(config?.headers).toEqual({
            "Content-Type": "application/json",
            "x-api-key": "test-exa-api-key",
            "x-api-key": TEST_EXA_API_KEY,
        });
    });

import { vi } from "vitest";
import type {
    LegalQueryAnalysis,
    SearchResultItem,
    AnalyzedDocument,
    ResearchAssessment,
    OverallSynthesis,
    FinalLegalReport,
} from "@/baml_client/types";

// Mock BAML functions with realistic but fast responses
export const b = {
    GenerateLegalSearchQueries: vi
        .fn()
        .mockImplementation(
            async (legalQuestion: string): Promise<LegalQueryAnalysis> => {
                await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate minimal delay
                return {
                    reasoning: {
                        analyze_legal_question: {
                            summary: `Analysis of legal question: ${legalQuestion}`,
                            items_considered: [
                                "key legal concepts",
                                "jurisdiction",
                                "precedents",
                            ],
                        },
                        consider_relevant_legal_principles: {
                            summary:
                                "Considered constitutional law, statutory interpretations, and case law precedents.",
                            items_considered: [
                                "constitutional principles",
                                "statutory framework",
                                "case precedents",
                            ],
                        },
                        formulate_search_queries_strategy: {
                            summary:
                                "Strategy focused on Boolean operators and legal terminology.",
                            items_considered: [
                                "Boolean operators",
                                "legal terms",
                                "proximity operators",
                            ],
                        },
                        specify_expected_information_strategy: {
                            summary:
                                "Targeting case law, statutes, and authoritative sources.",
                            items_considered: [
                                "case law",
                                "statutes",
                                "regulations",
                                "scholarly articles",
                            ],
                        },
                        ensure_comprehensive_coverage_strategy: {
                            summary:
                                "Queries complement each other for broad coverage.",
                            items_considered: [
                                "query diversity",
                                "coverage gaps",
                                "redundancy avoidance",
                            ],
                        },
                    },
                    search_queries: [
                        {
                            query_string: `"${legalQuestion}" AND precedent`,
                            expected_information: [
                                "Relevant case law and precedents",
                                "Legal principles and holdings",
                            ],
                        },
                        {
                            query_string: `"${legalQuestion}" AND statute`,
                            expected_information: [
                                "Applicable statutes and regulations",
                                "Statutory interpretations",
                            ],
                        },
                        {
                            query_string: `"${legalQuestion}" AND jurisdiction`,
                            expected_information: [
                                "Jurisdictional analysis",
                                "Court decisions by jurisdiction",
                            ],
                        },
                    ],
                };
            },
        ),

    AnalyzeSingleDocument: vi
        .fn()
        .mockImplementation(
            async (
                legalQuestion: string,
                document: SearchResultItem,
            ): Promise<AnalyzedDocument> => {
                await new Promise((resolve) => setTimeout(resolve, 30)); // Simulate minimal delay
                return {
                    search_result_id: document.id,
                    relevance: 8,
                    confidence: 9,
                    summary: `Analysis of ${document.title}: This document provides relevant legal precedent for ${legalQuestion}.`,
                    key_arguments_and_reasoning: [
                        "The court established important precedent regarding the legal issue",
                        "Key legal principles were clarified in this decision",
                        "The reasoning provides guidance for similar cases",
                    ],
                    extracted_entities: [
                        {
                            name: document.title || "Mock Case",
                            type: "Case",
                            details: "Federal court decision",
                        },
                        {
                            name: "Legal Precedent",
                            type: "LegalConcept",
                            details: "Established legal principle",
                        },
                    ],
                    extracted_quotes: [
                        "This case establishes precedent for the legal principle at issue.",
                        "The court held that the applicable standard requires...",
                    ],
                    counter_arguments_or_nuances: [
                        "Some jurisdictions may interpret this differently",
                        "The dissenting opinion raised concerns about...",
                    ],
                    reasoning: {
                        analyze_legal_question: {
                            summary:
                                "Analyzed relevance to the legal question posed",
                            items_considered: [
                                "legal issues",
                                "factual similarities",
                                "jurisdictional relevance",
                            ],
                        },
                        consider_relevant_legal_principles: {
                            summary:
                                "Evaluated applicable legal principles and doctrines",
                            items_considered: [
                                "constitutional principles",
                                "statutory framework",
                                "common law",
                            ],
                        },
                        formulate_search_queries_strategy: {
                            summary:
                                "Assessed document's value for further research queries",
                            items_considered: [
                                "key terms",
                                "related concepts",
                                "citation network",
                            ],
                        },
                        specify_expected_information_strategy: {
                            summary:
                                "Identified information types present in document",
                            items_considered: [
                                "holdings",
                                "reasoning",
                                "facts",
                                "citations",
                            ],
                        },
                        ensure_comprehensive_coverage_strategy: {
                            summary:
                                "Evaluated document's contribution to comprehensive analysis",
                            items_considered: [
                                "unique insights",
                                "coverage gaps",
                                "complementary sources",
                            ],
                        },
                    },
                };
            },
        ),

    AssessResearchAndPlanNextSteps: vi
        .fn()
        .mockImplementation(
            async (
                legalQuestion: string,
                synthesis: OverallSynthesis,
                analyzedDocs: AnalyzedDocument[],
            ): Promise<ResearchAssessment> => {
                await new Promise((resolve) => setTimeout(resolve, 25)); // Simulate minimal delay
                return {
                    current_research_quality: 8,
                    confidence_in_assessment: 9,
                    gaps_identified: [
                        "Need more recent precedents",
                        "Require state-specific analysis",
                    ],
                    next_action: "GENERATE_REPORT",
                    reasoning: {
                        analyze_legal_question: {
                            summary:
                                "Research adequately addresses the legal question",
                            items_considered: [
                                "question coverage",
                                "depth of analysis",
                                "source quality",
                            ],
                        },
                        consider_relevant_legal_principles: {
                            summary:
                                "Key legal principles have been identified and analyzed",
                            items_considered: [
                                "principle coverage",
                                "authority level",
                                "jurisdiction relevance",
                            ],
                        },
                        formulate_search_queries_strategy: {
                            summary:
                                "Search strategy was comprehensive and effective",
                            items_considered: [
                                "query effectiveness",
                                "source diversity",
                                "coverage breadth",
                            ],
                        },
                        specify_expected_information_strategy: {
                            summary: "Information gathering met expectations",
                            items_considered: [
                                "information quality",
                                "source authority",
                                "relevance scores",
                            ],
                        },
                        ensure_comprehensive_coverage_strategy: {
                            summary:
                                "Research provides sufficient coverage for report generation",
                            items_considered: [
                                "coverage completeness",
                                "analysis depth",
                                "authority level",
                            ],
                        },
                    },
                    additional_context:
                        "Research foundation is solid for proceeding to report generation.",
                };
            },
        ),

    SynthesizeFindings: vi
        .fn()
        .mockImplementation(async (): Promise<OverallSynthesis> => {
            await new Promise((resolve) => setTimeout(resolve, 40)); // Simulate minimal delay
            return {
                key_synthesized_topics: [
                    {
                        topic_title: "Primary Legal Precedent",
                        synthesis:
                            "The research reveals consistent legal principles across jurisdictions with strong precedential support. Courts consistently apply the established framework.",
                        supporting_document_ids: ["1", "2"],
                        confidence_score: 8,
                    },
                    {
                        topic_title: "Jurisdictional Analysis",
                        synthesis:
                            "Jurisdictional variations exist but core principles remain consistent. Higher courts have endorsed the analytical methodology.",
                        supporting_document_ids: ["1", "3"],
                        confidence_score: 7,
                    },
                ],
                unanswered_aspects: [
                    "Some circuit splits exist on peripheral issues",
                ],
                emerging_questions: [
                    "Recent legislative changes may impact interpretation",
                ],
                reasoning: {
                    analyze_legal_question: {
                        summary:
                            "Synthesized research comprehensively addresses the legal question",
                        items_considered: [
                            "research completeness",
                            "analysis depth",
                            "conclusion support",
                        ],
                    },
                    consider_relevant_legal_principles: {
                        summary:
                            "Identified consistent themes across legal principles",
                        items_considered: [
                            "principle consistency",
                            "authority hierarchy",
                            "interpretive trends",
                        ],
                    },
                    formulate_search_queries_strategy: {
                        summary:
                            "Research strategy effectively captured relevant authorities",
                        items_considered: [
                            "source comprehensiveness",
                            "authority quality",
                            "research efficiency",
                        ],
                    },
                    specify_expected_information_strategy: {
                        summary:
                            "Information synthesis meets analytical requirements",
                        items_considered: [
                            "synthesis quality",
                            "analytical depth",
                            "conclusion support",
                        ],
                    },
                    ensure_comprehensive_coverage_strategy: {
                        summary:
                            "Comprehensive analysis supports reliable conclusions",
                        items_considered: [
                            "coverage adequacy",
                            "analytical rigor",
                            "conclusion reliability",
                        ],
                    },
                },
            };
        }),

    SynthesizeAllFindings: vi
        .fn()
        .mockImplementation(
            async (
                analyzedDocs: AnalyzedDocument[],
                legalQuestion: string,
            ): Promise<OverallSynthesis> => {
                await new Promise((resolve) => setTimeout(resolve, 40)); // Simulate minimal delay
                return {
                    key_synthesized_topics: [
                        {
                            topic_title: "Legal Framework Analysis",
                            synthesis: `Analysis of ${analyzedDocs.length} documents reveals consistent legal principles for: ${legalQuestion}. Established precedent favors the analytical approach.`,
                            supporting_document_ids: analyzedDocs.map(
                                (doc) => doc.search_result_id,
                            ),
                            confidence_score: 8,
                        },
                        {
                            topic_title: "Jurisdictional Consistency",
                            synthesis:
                                "Courts consistently apply the established framework across jurisdictions. Higher courts have endorsed the analytical methodology.",
                            supporting_document_ids: analyzedDocs
                                .slice(0, 2)
                                .map((doc) => doc.search_result_id),
                            confidence_score: 7,
                        },
                    ],
                    unanswered_aspects: [
                        "Some circuit splits exist on peripheral issues",
                    ],
                    emerging_questions: [
                        "Recent legislative changes may impact interpretation",
                    ],
                    reasoning: {
                        analyze_legal_question: {
                            summary:
                                "Synthesized research comprehensively addresses the legal question",
                            items_considered: [
                                "research completeness",
                                "analysis depth",
                                "conclusion support",
                            ],
                        },
                        consider_relevant_legal_principles: {
                            summary:
                                "Identified consistent themes across legal principles",
                            items_considered: [
                                "principle consistency",
                                "authority hierarchy",
                                "interpretive trends",
                            ],
                        },
                        formulate_search_queries_strategy: {
                            summary:
                                "Research strategy effectively captured relevant authorities",
                            items_considered: [
                                "source comprehensiveness",
                                "authority quality",
                                "research efficiency",
                            ],
                        },
                        specify_expected_information_strategy: {
                            summary:
                                "Information synthesis meets analytical requirements",
                            items_considered: [
                                "synthesis quality",
                                "analytical depth",
                                "conclusion support",
                            ],
                        },
                        ensure_comprehensive_coverage_strategy: {
                            summary:
                                "Comprehensive analysis supports reliable conclusions",
                            items_considered: [
                                "coverage adequacy",
                                "analytical rigor",
                                "conclusion reliability",
                            ],
                        },
                    },
                };
            },
        ),

    GenerateFinalLegalReport: vi
        .fn()
        .mockImplementation(
            async (
                legalQuestion: string,
                synthesis: OverallSynthesis,
                queryAnalyses: any[],
            ): Promise<FinalLegalReport> => {
                await new Promise((resolve) => setTimeout(resolve, 60)); // Simulate minimal delay
                return {
                    report_title: `Legal Analysis Report: ${legalQuestion}`,
                    executive_summary:
                        "Based on comprehensive legal research, the analysis supports a favorable legal position with strong precedential backing.",
                    sections: [
                        {
                            section_title: "Background and Legal Framework",
                            content:
                                "The legal question involves well-established principles with extensive case law support. Federal and state precedents consistently support the analytical framework.",
                        },
                        {
                            section_title: "Analysis and Application",
                            content:
                                "Application of established legal principles to the current fact pattern yields predictable results. The legal position is supported by substantial authority and precedent.",
                        },
                        {
                            section_title: "Key Findings",
                            content:
                                "Strong precedential support exists for the legal position. Jurisdictional consistency across relevant courts. Recent decisions reinforce traditional interpretations.",
                        },
                    ],
                    conclusion:
                        "The legal analysis demonstrates a strong foundation for the position with substantial precedential support.",
                    limitations_and_caveats: [
                        "Analysis based on available precedents as of research date",
                        "Specific factual variations may affect application",
                        "Legislative changes could impact future interpretations",
                    ],
                    appendix_document_ids: ["1", "2", "3"],
                };
            },
        ),

    // Stream functions that return async generators for streaming responses
    stream: {
        GenerateFinalLegalReport: vi
            .fn()
            .mockImplementation(
                async (
                    legalQuestion: string,
                    synthesis: OverallSynthesis,
                    queryAnalyses: any[],
                ) => {
                    const finalReport: FinalLegalReport = {
                        report_title: `Legal Analysis Report: ${legalQuestion}`,
                        executive_summary:
                            "Based on comprehensive legal research, the analysis supports a favorable legal position with strong precedential backing.",
                        sections: [
                            {
                                section_title: "Background and Legal Framework",
                                content:
                                    "The legal question involves well-established principles with extensive case law support. Federal and state precedents consistently support the analytical framework.",
                            },
                            {
                                section_title: "Analysis and Application",
                                content:
                                    "Application of established legal principles to the current fact pattern yields predictable results. The legal position is supported by substantial authority and precedent.",
                            },
                            {
                                section_title: "Key Findings",
                                content:
                                    "Strong precedential support exists for the legal position. Jurisdictional consistency across relevant courts. Recent decisions reinforce traditional interpretations.",
                            },
                        ],
                        conclusion:
                            "The legal analysis demonstrates a strong foundation for the position with substantial precedential support.",
                        limitations_and_caveats: [
                            "Analysis based on available precedents as of research date",
                            "Specific factual variations may affect application",
                            "Legislative changes could impact future interpretations",
                        ],
                        appendix_document_ids: ["1", "2", "3"],
                    };

                    // Create a mock stream object that implements the expected interface
                    const mockStream = {
                        async *[Symbol.asyncIterator]() {
                            await new Promise((resolve) =>
                                setTimeout(resolve, 20),
                            );
                            yield { object: "Generating legal report..." };
                            await new Promise((resolve) =>
                                setTimeout(resolve, 20),
                            );
                            yield { object: "Analyzing precedents..." };
                            await new Promise((resolve) =>
                                setTimeout(resolve, 20),
                            );
                            yield { object: "Synthesizing findings..." };
                            await new Promise((resolve) =>
                                setTimeout(resolve, 20),
                            );
                            return finalReport;
                        },
                        getFinalResponse: async () => finalReport,
                    };

                    return mockStream;
                },
            ),
    },
};

// Reset all mocks between tests
export const resetBamlMocks = () => {
    Object.values(b).forEach((mockFn) => {
        if (typeof mockFn === "function" && "mockClear" in mockFn) {
            (mockFn as any).mockClear();
        }
    });
    if (
        b.stream?.GenerateFinalLegalReport &&
        "mockClear" in b.stream.GenerateFinalLegalReport
    ) {
        (b.stream.GenerateFinalLegalReport as any).mockClear();
    }
};
