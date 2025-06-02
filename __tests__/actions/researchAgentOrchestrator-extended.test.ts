/// <reference types="../../types/test-globals" />

import type { ReadableStream as _ReadableStream } from "node:stream/web"

import { beforeEach, describe, expect, it, vi } from "vitest"

import type {
  AnalyzedDocument,
  DetailedReasoning,
  LegalEntity,
  ReasoningStep,
  SearchResultItem,
} from "@/baml_client/types"

// Mock BAML client
const mockBamlClient = {
  AnalyzeSingleDocument: vi.fn(),
}

vi.mock("@/baml_client", () => ({
  b: mockBamlClient,
}))

// Mock the main orchestrator function for isolated testing
// We'll test the data mapping logic separately
describe("Research Agent Orchestrator - Extended Data Mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSearchResultItem: SearchResultItem = {
    id: "test-doc-1",
    url: "https://example.com/smith-v-jones",
    title: "Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)",
    source_name: "Legal Database",
    snippet: "The court found that COVID-19 restrictions...",
    full_text:
      "SMITH v. JONES\n\nFull text of the court decision discussing force majeure in the context of COVID-19 pandemic restrictions. The court held that government-mandated closures constituted unforeseeable circumstances that prevented contract performance.",
    published_date: "2023-01-15",
    retrieval_date: "2024-01-15T10:30:00Z",
    author: "Hon. Judge Johnson",
    score: 0.95,
    metadata: {
      exa_internal_id: "exa_123456",
      court_level: "federal_district",
    },
  }

  const mockLegalEntities: LegalEntity[] = [
    {
      name: "Smith v. Jones",
      type: "Case",
      details: "345 F.Supp. 2d 123 (N.D. Cal. 2023)",
    },
    {
      name: "John Smith",
      type: "Person",
      details: "Plaintiff",
    },
    {
      name: "Force Majeure",
      type: "LegalConcept",
      details: "Contractual excuse doctrine",
    },
    {
      name: "California",
      type: "Jurisdiction",
      details: "State jurisdiction",
    },
  ]

  const mockReasoningStep: ReasoningStep = {
    summary:
      "The legal question involves determining whether COVID-19 restrictions constitute force majeure events under contract law, requiring analysis of impossibility doctrine and government intervention defenses.",
    items_considered: [
      "Force majeure clause interpretation",
      "Doctrine of impossibility",
      "Government intervention as excuse",
      "COVID-19 as unforeseeable event",
    ],
  }

  const mockDetailedReasoning: DetailedReasoning = {
    analyze_legal_question: mockReasoningStep,
    consider_relevant_legal_principles: {
      summary:
        "Relevant principles include the doctrine of impossibility, force majeure clauses, government intervention defenses, and the requirement that performance be truly impossible rather than merely difficult.",
      items_considered: [
        "Impossibility vs. impracticability",
        "Government mandate as supervening cause",
        "Contractual force majeure provisions",
        "Burden of proof requirements",
      ],
    },
    formulate_search_queries_strategy: {
      summary:
        "Search strategy focused on recent COVID-19 force majeure cases, statutory provisions, and circuit court interpretations.",
      items_considered: [
        "COVID-19 case law",
        "Circuit splits",
        "State statutory provisions",
      ],
    },
    specify_expected_information_strategy: {
      summary:
        "Expected information includes case holdings, statutory requirements, and judicial interpretations of force majeure in pandemic context.",
      items_considered: [
        "Case holdings",
        "Statutory analysis",
        "Judicial reasoning",
      ],
    },
    ensure_comprehensive_coverage_strategy: {
      summary:
        "Comprehensive coverage ensured through multiple search angles including plaintiff/defendant perspectives and various jurisdictions.",
      items_considered: [
        "Jurisdictional variations",
        "Multiple perspectives",
        "Recent developments",
      ],
    },
  }

  const mockAnalyzedDocument: AnalyzedDocument = {
    search_result_id: "test-doc-1",
    relevance_score: 9,
    confidence_score: 8,
    summary:
      "The court found that COVID-19 related restrictions constituted force majeure events when explicitly mentioned in the contract, establishing important precedent for pandemic-related contract disputes.",
    key_arguments_and_reasoning: [
      "Government-mandated closures during COVID-19 constitute unforeseeable circumstances beyond party control",
      "Force majeure clauses must be interpreted strictly against the party invoking them",
      "Performance must be truly impossible, not merely more difficult or expensive",
      "The pandemic represents an unprecedented disruption requiring flexible legal interpretation",
    ],
    extracted_entities: mockLegalEntities,
    extracted_quotes: [
      '"The pandemic represents an unprecedented disruption to commercial activities that was not reasonably foreseeable at the time of contract formation"',
      '"Force majeure relief is available only when performance is truly impossible, not merely more burdensome"',
      '"Government-mandated business closures constitute supervening impossibility under established legal doctrine"',
    ],
    counter_arguments_or_nuances: [
      "The pandemic was arguably foreseeable by early 2020 for contracts formed after initial outbreaks",
      "Alternative performance methods such as digital delivery may have been available",
      "Some courts have required specific pandemic language in force majeure clauses",
    ],
    reasoning: mockDetailedReasoning,
  }

  describe("Data Mapping for Client-Friendly Format", () => {
    it("should map AnalyzedDocument to ClientAnalyzedDoc format correctly", () => {
      // Simulate the data mapping logic that should be in the orchestrator
      const mapToClientFormat = (
        analysis: AnalyzedDocument,
        searchResult: SearchResultItem
      ) => {
        return {
          docId: searchResult.id,
          title: searchResult.title,
          url: searchResult.url,
          relevanceScore: analysis.relevance_score,
          confidenceScore: analysis.confidence_score,
          summarySnippet: analysis.summary.substring(0, 300),

          // Extended analysis data
          keyArguments: analysis.key_arguments_and_reasoning,
          extractedEntities:
            analysis.extracted_entities?.map(entity => ({
              name: entity.name,
              type: entity.type,
              details: entity.details,
            })) || [],
          extractedQuotes: analysis.extracted_quotes || [],
          fullText: searchResult.full_text?.substring(0, 5000),
          counterArguments: analysis.counter_arguments_or_nuances || [],

          // Reasoning summary
          analysisReasoning: {
            analyzeLegalQuestionSummary:
              analysis.reasoning?.analyze_legal_question?.summary?.substring(
                0,
                500
              ) || "",
            considerRelevantPrinciplesSummary:
              analysis.reasoning?.consider_relevant_legal_principles?.summary?.substring(
                0,
                500
              ) || "",
          },
        }
      }

      const result = mapToClientFormat(
        mockAnalyzedDocument,
        mockSearchResultItem
      )

      // Test basic fields
      expect(result.docId).toBe("test-doc-1")
      expect(result.title).toBe(
        "Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)"
      )
      expect(result.url).toBe("https://example.com/smith-v-jones")
      expect(result.relevanceScore).toBe(9)
      expect(result.confidenceScore).toBe(8)

      // Test summary is properly truncated
      expect(result.summarySnippet.length).toBeLessThanOrEqual(300)
      expect(result.summarySnippet).toContain(
        "COVID-19 related restrictions constituted force majeure events"
      )

      // Test key arguments
      expect(result.keyArguments).toHaveLength(4)
      expect(result.keyArguments?.[0]).toContain(
        "Government-mandated closures during COVID-19"
      )
      expect(result.keyArguments?.[1]).toContain(
        "Force majeure clauses must be interpreted strictly"
      )

      // Test extracted entities
      expect(result.extractedEntities).toHaveLength(4)
      expect(result.extractedEntities?.[0]).toEqual({
        name: "Smith v. Jones",
        type: "Case",
        details: "345 F.Supp. 2d 123 (N.D. Cal. 2023)",
      })

      // Test extracted quotes
      expect(result.extractedQuotes).toHaveLength(3)
      expect(result.extractedQuotes?.[0]).toContain(
        "unprecedented disruption to commercial activities"
      )

      // Test full text is truncated appropriately
      expect(result.fullText?.length).toBeLessThanOrEqual(5000)
      expect(result.fullText).toContain("SMITH v. JONES")

      // Test counter arguments
      expect(result.counterArguments).toHaveLength(3)
      expect(result.counterArguments?.[0]).toContain(
        "pandemic was arguably foreseeable"
      )

      // Test reasoning summaries
      expect(result.analysisReasoning?.analyzeLegalQuestionSummary).toContain(
        "COVID-19 restrictions constitute force majeure events"
      )
      expect(
        result.analysisReasoning?.considerRelevantPrinciplesSummary
      ).toContain("doctrine of impossibility")
    })

    it("should handle missing optional fields gracefully", () => {
      const minimalAnalysis: AnalyzedDocument = {
        search_result_id: "minimal-doc",
        relevance_score: 5,
        confidence_score: 6,
        summary: "Basic summary",
        key_arguments_and_reasoning: [],
        extracted_entities: [],
        extracted_quotes: [],
        reasoning: mockDetailedReasoning,
      }

      const minimalSearchResult: SearchResultItem = {
        id: "minimal-doc",
        url: "https://example.com/minimal",
        source_name: "Test Source",
        retrieval_date: "2024-01-15T10:30:00Z",
      }

      const mapToClientFormat = (
        analysis: AnalyzedDocument,
        searchResult: SearchResultItem
      ) => {
        return {
          docId: searchResult.id,
          title: searchResult.title,
          url: searchResult.url,
          relevanceScore: analysis.relevance_score,
          confidenceScore: analysis.confidence_score,
          summarySnippet: analysis.summary.substring(0, 300),
          keyArguments: analysis.key_arguments_and_reasoning,
          extractedEntities:
            analysis.extracted_entities?.map(entity => ({
              name: entity.name,
              type: entity.type,
              details: entity.details,
            })) || [],
          extractedQuotes: analysis.extracted_quotes || [],
          fullText: searchResult.full_text?.substring(0, 5000),
          counterArguments: analysis.counter_arguments_or_nuances || [],
          analysisReasoning: {
            analyzeLegalQuestionSummary:
              analysis.reasoning?.analyze_legal_question?.summary?.substring(
                0,
                500
              ) || "",
            considerRelevantPrinciplesSummary:
              analysis.reasoning?.consider_relevant_legal_principles?.summary?.substring(
                0,
                500
              ) || "",
          },
        }
      }

      const result = mapToClientFormat(minimalAnalysis, minimalSearchResult)

      expect(result.docId).toBe("minimal-doc")
      expect(result.title).toBeUndefined()
      expect(result.keyArguments).toEqual([])
      expect(result.extractedEntities).toEqual([])
      expect(result.extractedQuotes).toEqual([])
      expect(result.fullText).toBeUndefined()
      expect(result.counterArguments).toEqual([])
    })

    it("should properly truncate long text fields", () => {
      const longText = "A".repeat(10000)
      const longSummary = "B".repeat(1000)

      const longAnalysis: AnalyzedDocument = {
        ...mockAnalyzedDocument,
        summary: longSummary,
      }

      const longSearchResult: SearchResultItem = {
        ...mockSearchResultItem,
        full_text: longText,
      }

      const mapToClientFormat = (
        analysis: AnalyzedDocument,
        searchResult: SearchResultItem
      ) => {
        return {
          summarySnippet: analysis.summary.substring(0, 300),
          fullText: searchResult.full_text?.substring(0, 5000),
          analysisReasoning: {
            analyzeLegalQuestionSummary:
              analysis.reasoning?.analyze_legal_question?.summary?.substring(
                0,
                500
              ) || "",
            considerRelevantPrinciplesSummary:
              analysis.reasoning?.consider_relevant_legal_principles?.summary?.substring(
                0,
                500
              ) || "",
          },
        }
      }

      const result = mapToClientFormat(longAnalysis, longSearchResult)

      expect(result.summarySnippet.length).toBe(300)
      expect(result.fullText?.length).toBe(5000)
      expect(
        result.analysisReasoning?.analyzeLegalQuestionSummary.length
      ).toBeLessThanOrEqual(500)
    })

    it("should handle entity type mapping correctly", () => {
      const diverseEntities: LegalEntity[] = [
        { name: "Test Case", type: "Case", details: "Citation" },
        {
          name: "Test Statute",
          type: "Statute",
          details: "Code section",
        },
        {
          name: "Test Regulation",
          type: "Regulation",
          details: "CFR reference",
        },
        { name: "John Doe", type: "Person", details: "Role" },
        {
          name: "Corp Inc.",
          type: "Organization",
          details: "Company type",
        },
        {
          name: "Legal Doctrine",
          type: "LegalConcept",
          details: "Description",
        },
        { name: "New York", type: "Jurisdiction", details: "State" },
      ]

      const analysisWithDiverseEntities: AnalyzedDocument = {
        ...mockAnalyzedDocument,
        extracted_entities: diverseEntities,
      }

      const mapToClientFormat = (analysis: AnalyzedDocument) => {
        return {
          extractedEntities:
            analysis.extracted_entities?.map(entity => ({
              name: entity.name,
              type: entity.type,
              details: entity.details,
            })) || [],
        }
      }

      const result = mapToClientFormat(analysisWithDiverseEntities)

      expect(result.extractedEntities).toHaveLength(7)

      // Verify all entity types are preserved
      const entityTypes = result.extractedEntities.map(e => e.type)
      expect(entityTypes).toContain("Case")
      expect(entityTypes).toContain("Statute")
      expect(entityTypes).toContain("Regulation")
      expect(entityTypes).toContain("Person")
      expect(entityTypes).toContain("Organization")
      expect(entityTypes).toContain("LegalConcept")
      expect(entityTypes).toContain("Jurisdiction")
    })
  })

  describe("Stream Update Format", () => {
    it("should format data update for streaming correctly", () => {
      // Simulate the ResearchUpdate data format for document analysis
      const createUpdateData = (
        analysis: AnalyzedDocument,
        searchResult: SearchResultItem
      ) => {
        return {
          type: "DATA" as const,
          stage: "ANALYZING_DOCUMENTS" as const,
          data: {
            docId: searchResult.id,
            title: searchResult.title,
            url: searchResult.url,
            relevanceScore: analysis.relevance_score,
            confidenceScore: analysis.confidence_score,
            summarySnippet: analysis.summary.substring(0, 300),
            keyArguments: analysis.key_arguments_and_reasoning,
            extractedEntities:
              analysis.extracted_entities?.map(entity => ({
                name: entity.name,
                type: entity.type,
                details: entity.details,
              })) || [],
            extractedQuotes: analysis.extracted_quotes || [],
            fullText: searchResult.full_text?.substring(0, 5000),
            counterArguments: analysis.counter_arguments_or_nuances || [],
            analysisReasoning: {
              analyzeLegalQuestionSummary:
                analysis.reasoning?.analyze_legal_question?.summary?.substring(
                  0,
                  500
                ) || "",
              considerRelevantPrinciplesSummary:
                analysis.reasoning?.consider_relevant_legal_principles?.summary?.substring(
                  0,
                  500
                ) || "",
            },
          },
          message: `Analysis complete for: ${searchResult.title || "Untitled"}. Relevance: ${analysis.relevance_score}/10`,
          currentProcessedDoc: 1,
        }
      }

      const updateData = createUpdateData(
        mockAnalyzedDocument,
        mockSearchResultItem
      )

      expect(updateData.type).toBe("DATA")
      expect(updateData.stage).toBe("ANALYZING_DOCUMENTS")
      expect(updateData.data.docId).toBe("test-doc-1")
      expect(updateData.data.keyArguments).toHaveLength(4)
      expect(updateData.data.extractedEntities).toHaveLength(4)
      expect(updateData.message).toContain(
        "Analysis complete for: Smith v. Jones"
      )
      expect(updateData.message).toContain("Relevance: 9/10")
    })

    it("should include proper progress information", () => {
      const createProgressUpdate = (
        current: number,
        total: number,
        docTitle?: string
      ) => {
        return {
          type: "PROGRESS" as const,
          stage: "ANALYZING_DOCUMENTS" as const,
          message: `Analyzing document ${current}/${total}: ${docTitle ? `${docTitle.substring(0, 50)}...` : "Untitled"}`,
          currentProcessedDoc: current - 1,
          totalDocsToProcess: total,
        }
      }

      const progressUpdate = createProgressUpdate(
        2,
        5,
        mockSearchResultItem.title ?? undefined
      )

      expect(progressUpdate.type).toBe("PROGRESS")
      expect(progressUpdate.message).toContain("Analyzing document 2/5")
      expect(progressUpdate.message).toContain(
        "Smith v. Jones, 345 F.Supp. 2d 123"
      )
      expect(progressUpdate.currentProcessedDoc).toBe(1)
      expect(progressUpdate.totalDocsToProcess).toBe(5)
    })
  })
})
