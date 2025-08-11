import { describe, expect, mock, test } from "bun:test";
import { app } from "../../index";
import type { ResearchPipelineResult } from "../../types/research";

// Mock the BAML client using Bun's mock system
mock.module("../../../baml_client", () => ({
  b: {
    GenerateLegalSearchQueries: mock(() =>
      Promise.resolve({
        search_queries: [
          {
            query_string: "contract formation elements requirements",
            expected_information: ["offer", "acceptance", "consideration"],
          },
          {
            query_string: "legal capacity contract validity",
            expected_information: ["competency", "age", "mental capacity"],
          },
        ],
        reasoning: {
          analyze_legal_question: {
            summary: "The question asks about contract formation requirements.",
          },
        },
      })
    ),
    AnalyzeSingleDocument: mock(() =>
      Promise.resolve({
        id: "test-doc-1",
        relevance_score: 8,
        confidence_score: 9,
        summary: "This document discusses contract formation principles.",
        key_arguments_and_reasoning: ["Offer and acceptance are essential"],
        extracted_entities: [
          {
            name: "Contract",
            type: "Legal Concept",
            details: "Agreement between parties",
          },
        ],
        extracted_quotes: [
          "A contract requires offer, acceptance, and consideration",
        ],
        counter_arguments_or_nuances: [],
        reasoning: {
          analyze_legal_question: {
            summary: "Document analysis complete",
          },
        },
      })
    ),
    SynthesizeAllFindings: mock(() =>
      Promise.resolve({
        key_synthesized_topics: [
          {
            topic_title: "Essential Contract Elements",
            synthesis: "All sources agree on the core requirements.",
            confidence_score: 9,
            supporting_document_ids: ["test-doc-1"],
          },
        ],
        unanswered_aspects: [],
        emerging_questions: [],
        reasoning: {
          analyze_legal_question: {
            summary: "Synthesis completed successfully",
          },
        },
      })
    ),
    AssessResearchAndPlanNextSteps: mock(() =>
      Promise.resolve({
        is_sufficient: true,
        next_action: "GENERATE_REPORT",
        assessment_summary:
          "Research is sufficient for generating a comprehensive report.",
        identified_gaps: [],
      })
    ),
    GenerateFinalLegalReport: mock(() =>
      Promise.resolve({
        report_title: "Legal Analysis: Contract Formation Requirements",
        executive_summary:
          "This report analyzes the essential elements of contract formation.",
        sections: [
          {
            section_title: "Essential Elements",
            content: "Contracts require offer, acceptance, and consideration.",
          },
        ],
        conclusion:
          "The legal requirements for contract formation are well-established.",
        limitations_and_caveats: [
          "This analysis is based on general principles",
        ],
        appendix_document_ids: ["test-doc-1"],
      })
    ),
    // Add streaming functions that were introduced during refactoring
    stream: {
      GenerateFinalLegalReport: mock(() => {
        // Mock async iterator for streaming
        return {
          async *[Symbol.asyncIterator]() {
            // Yield partial report updates to simulate streaming
            yield {
              report_title: "Legal Analysis: Contract Formation Requirements",
              executive_summary: {
                value: "This report analyzes the essential elements of contract formation.",
                state: "Complete"
              },
              sections: [{
                section_title: "Essential Elements",
                content: {
                  value: "Contracts require offer, acceptance, and consideration.",
                  state: "Complete"
                }
              }],
              conclusion: {
                value: "The legal requirements for contract formation are well-established.",
                state: "Complete"
              },
              limitations_and_caveats: [
                "This analysis is based on general principles",
              ],
              appendix_document_ids: ["test-doc-1"],
            };
          }
        };
      })
    },
  },
}));

// Mock the Exa search utility
mock.module("../../utils/exaSearch", () => ({
  executeExaSearch: mock(() =>
    Promise.resolve([
      {
        id: "test-doc-1",
        url: "https://example.com/contract-law",
        title: "Contract Formation Principles",
        source_name: "example.com",
        full_text:
          "A contract is formed when there is an offer, acceptance, and consideration...",
      },
    ])
  ),
}));

describe("Research Complete Endpoint", () => {
  test("should accept POST with legalQuestion and return complete research pipeline", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/research/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalQuestion: "What are the key elements of contract formation?",
        }),
      })
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as ResearchPipelineResult;

    // Verify complete research pipeline response structure
    expect(data).toHaveProperty("queryAnalysis");
    expect(data).toHaveProperty("fetchedDocuments");
    expect(data).toHaveProperty("analyzedDocuments");
    expect(data).toHaveProperty("synthesis");
    expect(data).toHaveProperty("assessment");
    expect(data).toHaveProperty("metadata");

    // Verify query analysis (optimized BAML may generate more comprehensive queries)
    expect(data.queryAnalysis).toBeDefined();
    expect(data.queryAnalysis?.search_queries.length).toBeGreaterThanOrEqual(2);
    expect(data.queryAnalysis?.search_queries[0]?.query_string).toContain(
      "contract"
    );

    // Verify fetched documents
    expect(data.fetchedDocuments).toBeDefined();
    expect(data.fetchedDocuments.length).toBeGreaterThan(0);
    expect(data.fetchedDocuments[0]).toHaveProperty("url");

    // Verify analyzed documents
    expect(data.analyzedDocuments).toBeDefined();
    expect(data.analyzedDocuments.length).toBeGreaterThan(0);
    expect(data.analyzedDocuments[0]).toHaveProperty("relevance_score");

    // Verify synthesis
    expect(data.synthesis).toBeDefined();
    expect(data.synthesis?.key_synthesized_topics).toHaveLength(1);

    // Verify assessment
    expect(data.assessment).toBeDefined();
    expect(data.assessment?.next_action).toMatch(
      /GENERATE_REPORT|REFINE_QUERIES|REQUEST_HUMAN_REVIEW/
    );

    // Verify final report when assessment says to generate
    if (data.assessment?.next_action === "GENERATE_REPORT") {
      expect(data.finalReport).toBeDefined();
      expect(data.finalReport?.report_title).toBeDefined();
      expect(data.finalReport?.executive_summary).toBeDefined();
      expect(data.finalReport?.sections).toBeDefined();
      expect(data.finalReport?.conclusion).toBeDefined();
    }

    // Verify metadata
    expect(data.metadata).toBeDefined();
    expect(data.metadata.processingTime).toBeGreaterThan(0);
    expect(data.metadata.documentsProcessed).toBeGreaterThan(0);
    expect(data.metadata.queriesExecuted).toBeGreaterThan(0);
  });

  test("should handle empty legal question", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/research/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalQuestion: "",
        }),
      })
    );

    expect(response.status).toBe(400);
  });

  test("should handle missing legal question", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/research/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
  });

  test("should accept autoModeConfig parameter", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/research/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalQuestion: "What are contract formation elements?",
          autoModeConfig: {
            isEnabled: true,
            maxIterations: 3,
            currentIteration: 1,
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as ResearchPipelineResult;
    expect(data.metadata.iteration).toBe(1);
  });

  test("should only accept POST method", async () => {
    const getResponse = await app.handle(
      new Request("http://localhost/api/research/complete")
    );
    expect(getResponse.status).toBe(404);

    const putResponse = await app.handle(
      new Request("http://localhost/api/research/complete", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalQuestion: "test" }),
      })
    );
    expect(putResponse.status).toBe(404);
  });
});
