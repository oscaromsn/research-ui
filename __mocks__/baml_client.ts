// Mock for BAML client to avoid real API calls during testing

import { vi } from "vitest";

import type {
	AnalyzedDocument,
	DetailedReasoning,
	FinalLegalReport,
	LegalEntity,
	LegalQueryAnalysis,
	LegalReportSection,
	NextActionType,
	OverallSynthesis,
	ReasoningStep,
	ResearchAssessment,
	SearchQueryItem,
	SynthesizedTopic,
} from "@/baml_client/types";

// Mock data factories
const createMockReasoningStep = (summary: string): ReasoningStep => ({
	summary,
	items_considered: ["Item 1", "Item 2", "Item 3"],
});

const createMockDetailedReasoning = (): DetailedReasoning => ({
	analyze_legal_question: createMockReasoningStep(
		"Analyzed the legal question comprehensively",
	),
	consider_relevant_legal_principles: createMockReasoningStep(
		"Considered relevant legal principles",
	),
	formulate_search_queries_strategy: createMockReasoningStep(
		"Formulated effective search strategy",
	),
	specify_expected_information_strategy: createMockReasoningStep(
		"Specified expected information",
	),
	ensure_comprehensive_coverage_strategy: createMockReasoningStep(
		"Ensured comprehensive coverage",
	),
});

const createMockSearchQueries = (): SearchQueryItem[] => [
	{
		query_string: "contract breach legal implications",
		expected_information: ["breach definition", "damages", "remedies"],
	},
	{
		query_string: "contract law enforcement",
		expected_information: ["enforcement mechanisms", "court procedures"],
	},
];

const createMockLegalQueryAnalysis = (): LegalQueryAnalysis => ({
	reasoning: createMockDetailedReasoning(),
	search_queries: createMockSearchQueries(),
});

const createMockAnalyzedDocument = (): AnalyzedDocument => ({
	search_result_id: "doc-123",
	relevance_score: 0.85,
	confidence_score: 0.9,
	summary: "This document discusses contract breach implications",
	key_arguments_and_reasoning: ["Argument 1", "Argument 2"],
	extracted_entities: [
		{
			name: "Smith v. Jones",
			type: "Case",
			details: "Landmark contract case",
		},
	] as LegalEntity[],
	extracted_quotes: ["Quote 1", "Quote 2"],
	counter_arguments_or_nuances: ["Counter-argument 1"],
	reasoning: createMockDetailedReasoning(),
});

const createMockResearchAssessment = (): ResearchAssessment => ({
	is_sufficient: true,
	assessment_summary:
		"Research is sufficient to generate a comprehensive report",
	identified_gaps: [],
	next_action: "GENERATE_REPORT" as NextActionType,
	suggested_queries_for_refinement: null,
	document_ids_for_deeper_analysis: null,
	reasoning: createMockDetailedReasoning(),
});

const createMockSynthesizedTopic = (): SynthesizedTopic => ({
	topic_title: "Contract Breach Analysis",
	synthesis: "Comprehensive analysis of contract breach implications",
	supporting_document_ids: ["doc-123", "doc-456"],
	confidence_score: 0.85,
});

const createMockOverallSynthesis = (): OverallSynthesis => ({
	key_synthesized_topics: [createMockSynthesizedTopic()],
	unanswered_aspects: ["Aspect 1", "Aspect 2"],
	emerging_questions: ["Question 1", "Question 2"],
	reasoning: createMockDetailedReasoning(),
});

const createMockFinalReport = (): FinalLegalReport => ({
	report_title: "Legal Analysis Report",
	executive_summary: "Executive summary of the legal analysis",
	sections: [
		{
			section_title: "Introduction",
			content: "Introduction content",
		},
		{
			section_title: "Analysis",
			content: "Analysis content",
		},
	] as LegalReportSection[],
	conclusion: "Report conclusion",
	limitations_and_caveats: ["Limitation 1", "Limitation 2"],
	appendix_document_ids: ["doc-123", "doc-456"],
});

export const b = {
	GenerateLegalSearchQueries: vi
		.fn()
		.mockResolvedValue(createMockLegalQueryAnalysis()),
	AnalyzeSingleDocument: vi
		.fn()
		.mockResolvedValue(createMockAnalyzedDocument()),
	AssessResearchAndPlanNextSteps: vi
		.fn()
		.mockResolvedValue(createMockResearchAssessment()),
	SynthesizeAllFindings: vi
		.fn()
		.mockResolvedValue(createMockOverallSynthesis()),
	GenerateFinalLegalReport: vi.fn().mockResolvedValue(createMockFinalReport()),
	stream: {
		GenerateLegalSearchQueries: vi.fn().mockImplementation(() => {
			const generator = (async function* () {
				yield createMockLegalQueryAnalysis();
			})();
			(
				generator as unknown as { getFinalResponse: ReturnType<typeof vi.fn> }
			).getFinalResponse = vi
				.fn()
				.mockResolvedValue(createMockLegalQueryAnalysis());
			return generator;
		}),
		AnalyzeSingleDocument: vi.fn().mockImplementation(() => {
			const generator = (async function* () {
				yield createMockAnalyzedDocument();
			})();
			(
				generator as unknown as { getFinalResponse: ReturnType<typeof vi.fn> }
			).getFinalResponse = vi
				.fn()
				.mockResolvedValue(createMockAnalyzedDocument());
			return generator;
		}),
		AssessResearchAndPlanNextSteps: vi.fn().mockImplementation(() => {
			const generator = (async function* () {
				yield createMockResearchAssessment();
			})();
			(
				generator as unknown as { getFinalResponse: ReturnType<typeof vi.fn> }
			).getFinalResponse = vi
				.fn()
				.mockResolvedValue(createMockResearchAssessment());
			return generator;
		}),
		SynthesizeAllFindings: vi.fn().mockImplementation(() => {
			const generator = (async function* () {
				yield createMockOverallSynthesis();
			})();
			(
				generator as unknown as { getFinalResponse: ReturnType<typeof vi.fn> }
			).getFinalResponse = vi
				.fn()
				.mockResolvedValue(createMockOverallSynthesis());
			return generator;
		}),
		GenerateFinalLegalReport: vi.fn().mockImplementation(() => {
			const generator = (async function* () {
				yield createMockFinalReport();
			})();
			(
				generator as unknown as { getFinalResponse: ReturnType<typeof vi.fn> }
			).getFinalResponse = vi.fn().mockResolvedValue(createMockFinalReport());
			return generator;
		}),
	},
};

// Export default for default imports
export default b;
