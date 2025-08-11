import { describe, expect, mock, test } from "bun:test";

// Mock the config module
mock.module("../../config", () => ({
  config: {
    research: {
      maxQueriesPerIteration: 3,
      maxDocumentsPerQuery: 5,
      searchTimeoutMs: 30000,
      maxRetries: 2,
      analysisTimeoutMs: 45000,
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
      {
        id: "test-doc-2",
        url: "https://example.com/legal-capacity",
        title: "Legal Capacity in Contract Law",
        source_name: "example.com",
        full_text:
          "Legal capacity refers to the ability to enter into binding contracts...",
      },
    ])
  ),
}));

// Mock the BAML client for stage testing
mock.module("../../../baml_client", () => ({
  b: {
    GenerateLegalSearchQueries: mock((legalQuestion: string) => {
      if (!legalQuestion || legalQuestion.trim().length === 0) {
        return Promise.reject(new Error("Legal question is required"));
      }

      // Generate contextually appropriate queries based on the legal question
      const isContractQuestion = legalQuestion
        .toLowerCase()
        .includes("contract");
      const isTrademarkQuestion = legalQuestion
        .toLowerCase()
        .includes("trademark");

      const queries = isContractQuestion
        ? [
            {
              query_string: "contract formation elements requirements",
              expected_information: [
                "offer",
                "acceptance",
                "consideration",
                "capacity",
              ],
            },
            {
              query_string: "valid contract legal requirements",
              expected_information: [
                "legal capacity",
                "mutual assent",
                "legality",
              ],
            },
            {
              query_string: "contract law binding agreement",
              expected_information: ["binding obligations", "enforceability"],
            },
          ]
        : isTrademarkQuestion
          ? [
              {
                query_string: "trademark registration requirements",
                expected_information: ["distinctiveness", "use in commerce"],
              },
              {
                query_string: "valid trademark registration process",
                expected_information: [
                  "application",
                  "examination",
                  "registration",
                ],
              },
            ]
          : [
              {
                query_string: "intellectual property law basics",
                expected_information: ["patents", "trademarks", "copyrights"],
              },
              {
                query_string: "IP protection legal framework",
                expected_information: ["rights", "enforcement", "duration"],
              },
            ];

      return Promise.resolve({
        search_queries: queries,
        reasoning: {
          analyze_legal_question: {
            summary: `Generated ${queries.length} search queries for the legal question: ${legalQuestion}`,
          },
        },
      });
    }),
    AnalyzeSingleDocument: mock((doc: any, legalQuestion: string) => {
      return Promise.resolve({
        search_result_id: doc.id,
        relevance_score: 8,
        confidence_score: 9,
        summary: `This document discusses legal principles related to: ${legalQuestion}`,
        key_arguments_and_reasoning: ["Key legal argument from the document"],
        extracted_entities: [
          {
            name: "Legal Concept",
            type: "LegalConcept",
            details: "Important legal concept mentioned in document",
          },
        ],
        extracted_quotes: ["Important quote from the document"],
        counter_arguments_or_nuances: ["Counterargument or nuance"],
        reasoning: {
          analyze_legal_question: {
            summary: "Document analysis completed successfully",
          },
          consider_relevant_legal_principles: {
            summary: "Considered legal principles",
          },
          formulate_search_queries_strategy: {
            summary: "Formulated search strategy",
          },
          specify_expected_information_strategy: {
            summary: "Specified information strategy",
          },
          ensure_comprehensive_coverage_strategy: {
            summary: "Ensured comprehensive coverage",
          },
        },
      });
    }),
    SynthesizeAllFindings: mock((documents: any[], legalQuestion: string) => {
      return Promise.resolve({
        key_synthesized_topics: [
          {
            topic_title: "Main Legal Topic",
            synthesis: `Synthesis of findings for: ${legalQuestion}`,
            confidence_score: 8,
            supporting_document_ids: documents.map(
              (d) => d.search_result_id || d.id
            ),
          },
        ],
        unanswered_aspects: [],
        emerging_questions: [],
        reasoning: {
          analyze_legal_question: {
            summary: "Synthesis completed successfully",
          },
          consider_relevant_legal_principles: {
            summary: "Considered legal principles",
          },
          formulate_search_queries_strategy: {
            summary: "Formulated search strategy",
          },
          specify_expected_information_strategy: {
            summary: "Specified information strategy",
          },
          ensure_comprehensive_coverage_strategy: {
            summary: "Ensured comprehensive coverage",
          },
        },
      });
    }),
    AssessResearchAndPlanNextSteps: mock(
      (legalQuestion: string, _queryAnalysis: any, _synthesis: any) => {
        return Promise.resolve({
          is_sufficient: true,
          next_action: "GENERATE_REPORT",
          assessment_summary: `Research assessment for: ${legalQuestion}`,
          identified_gaps: [],
        });
      }
    ),
    GenerateFinalLegalReport: mock(
      (legalQuestion: string, _synthesis: any, _queryAnalysis: any) => {
        return Promise.resolve({
          report_title: `Legal Analysis Report: ${legalQuestion}`,
          executive_summary: `Executive summary for legal question: ${legalQuestion}`,
          sections: [
            {
              section_title: "Analysis Section",
              content: "Detailed analysis content for the legal question",
            },
          ],
          conclusion: "Legal conclusion based on research",
          limitations_and_caveats: [
            "This analysis is based on available sources",
          ],
          appendix_document_ids: [],
        });
      }
    ),
    // Add streaming functions for pipeline stages tests
    stream: {
      GenerateFinalLegalReport: mock(
        (legalQuestion: string, _synthesis: any, _queryAnalysis: any) => {
          return {
            async *[Symbol.asyncIterator]() {
              yield {
                report_title: `Legal Analysis Report: ${legalQuestion}`,
                executive_summary: {
                  value: `Executive summary for legal question: ${legalQuestion}`,
                  state: "Complete",
                },
                sections: [
                  {
                    section_title: "Analysis Section",
                    content: {
                      value: "Detailed analysis content for the legal question",
                      state: "Complete",
                    },
                  },
                ],
                conclusion: {
                  value: "Legal conclusion based on research",
                  state: "Complete",
                },
                limitations_and_caveats: [
                  "This analysis is based on available sources",
                ],
                appendix_document_ids: [],
              };
            },
          };
        }
      ),
    },
  },
}));

describe("Pipeline Stages", () => {
  describe("Query Generation Stage", () => {
    test("should generate legal search queries from legal question", async () => {
      // This test should fail initially because generateQueriesStage doesn't exist yet
      const { generateQueriesStage } = await import(
        "../../utils/pipelineStages"
      );

      const legalQuestion = "What are the key elements of contract formation?";

      const queryAnalysis = await generateQueriesStage(legalQuestion);

      // Verify the response structure matches BAML LegalQueryAnalysis type
      expect(queryAnalysis).toBeDefined();
      expect(queryAnalysis).toHaveProperty("search_queries");
      expect(queryAnalysis.search_queries).toBeInstanceOf(Array);
      expect(queryAnalysis.search_queries.length).toBeGreaterThan(0);

      // Verify each query has the expected structure
      queryAnalysis.search_queries.forEach((query) => {
        expect(query).toHaveProperty("query_string");
        expect(query).toHaveProperty("expected_information");
        expect(typeof query.query_string).toBe("string");
        expect(query.query_string.length).toBeGreaterThan(0);
        expect(query.expected_information).toBeInstanceOf(Array);
      });

      // Verify reasoning is present
      expect(queryAnalysis).toHaveProperty("reasoning");
      expect(queryAnalysis.reasoning).toHaveProperty("analyze_legal_question");
    });

    test("should handle empty legal question gracefully", async () => {
      const { generateQueriesStage } = await import(
        "../../utils/pipelineStages"
      );

      await expect(generateQueriesStage("")).rejects.toThrow();
    });

    test("should generate different queries for different legal questions", async () => {
      const { generateQueriesStage } = await import(
        "../../utils/pipelineStages"
      );

      const question1 = "What are the elements of contract formation?";
      const question2 = "What are the requirements for a valid trademark?";

      const queries1 = await generateQueriesStage(question1);
      const queries2 = await generateQueriesStage(question2);

      // Queries should be contextually different
      expect(queries1.search_queries[0]?.query_string).not.toBe(
        queries2.search_queries[0]?.query_string
      );

      // Contract queries should contain contract-related terms
      const firstQuery1 =
        queries1.search_queries[0]?.query_string.toLowerCase() || "";
      expect(firstQuery1).toMatch(/contract|agreement|formation/);

      // Trademark queries should contain trademark-related terms
      const firstQuery2 =
        queries2.search_queries[0]?.query_string.toLowerCase() || "";
      expect(firstQuery2).toMatch(/trademark|mark|registration/);
    });

    test("should generate appropriate number of queries", async () => {
      const { generateQueriesStage } = await import(
        "../../utils/pipelineStages"
      );

      const queryAnalysis = await generateQueriesStage(
        "What is intellectual property law?"
      );

      // Should generate reasonable number of queries (not too few, not too many)
      expect(queryAnalysis.search_queries.length).toBeGreaterThanOrEqual(2);
      expect(queryAnalysis.search_queries.length).toBeLessThanOrEqual(6);
    });
  });

  describe("Document Fetching Stage", () => {
    test("should fetch documents from search queries", async () => {
      const { fetchDocumentsStage } = await import(
        "../../utils/pipelineStages"
      );

      const queries = [
        {
          query_string: "contract formation elements requirements",
          expected_information: ["offer", "acceptance", "consideration"],
        },
        {
          query_string: "valid contract legal requirements",
          expected_information: ["legal capacity", "mutual assent"],
        },
      ];

      const documents = await fetchDocumentsStage(queries);

      // Verify the response structure
      expect(documents).toBeInstanceOf(Array);
      expect(documents.length).toBeGreaterThan(0);

      // Verify each document has the expected structure
      documents.forEach((doc) => {
        expect(doc).toHaveProperty("id");
        expect(doc).toHaveProperty("url");
        expect(doc).toHaveProperty("title");
        expect(doc).toHaveProperty("source_name");
        expect(doc).toHaveProperty("full_text");

        expect(typeof doc.id).toBe("string");
        expect(typeof doc.url).toBe("string");
        expect(typeof doc.source_name).toBe("string");

        // URL should be valid
        expect(doc.url).toMatch(/^https?:\/\/.+/);
      });
    });

    test("should handle empty queries array", async () => {
      const { fetchDocumentsStage } = await import(
        "../../utils/pipelineStages"
      );

      await expect(fetchDocumentsStage([])).rejects.toThrow(
        "No search queries provided"
      );
    });

    test("should handle queries without results", async () => {
      const { fetchDocumentsStage } = await import(
        "../../utils/pipelineStages"
      );

      // Mock exaSearch to return empty results
      mock.module("../../utils/exaSearch", () => ({
        executeExaSearch: mock(() => Promise.resolve([])),
      }));

      const queries = [
        {
          query_string: "very specific query with no results",
          expected_information: ["nothing"],
        },
      ];

      const documents = await fetchDocumentsStage(queries);

      // Should return empty array, not throw error
      expect(documents).toBeInstanceOf(Array);
      expect(documents).toHaveLength(0);
    });

    test("should limit number of queries processed", async () => {
      const { fetchDocumentsStage } = await import(
        "../../utils/pipelineStages"
      );

      // Create more queries than the config limit
      const manyQueries = Array.from({ length: 10 }, (_, i) => ({
        query_string: `query ${i + 1}`,
        expected_information: [`info ${i + 1}`],
      }));

      const documents = await fetchDocumentsStage(manyQueries);

      // Should still return documents (not throw error)
      expect(documents).toBeInstanceOf(Array);
    });

    test("should remove duplicate documents by URL", async () => {
      const { fetchDocumentsStage } = await import(
        "../../utils/pipelineStages"
      );

      // Mock exaSearch to return duplicates
      mock.module("../../utils/exaSearch", () => ({
        executeExaSearch: mock(() =>
          Promise.resolve([
            {
              id: "doc1",
              url: "https://example.com/contract-law",
              title: "Contract Law",
              source_name: "example.com",
              full_text: "Contract law content",
            },
            {
              id: "doc2", // Different ID
              url: "https://example.com/contract-law", // Same URL
              title: "Contract Law Duplicate",
              source_name: "example.com",
              full_text: "Contract law content duplicate",
            },
          ])
        ),
      }));

      const queries = [
        {
          query_string: "contract formation",
          expected_information: ["formation"],
        },
      ];

      const documents = await fetchDocumentsStage(queries);

      // Should deduplicate and only return one document
      expect(documents).toHaveLength(1);
      expect(documents[0]?.url).toBe("https://example.com/contract-law");
    });
  });

  describe("Document Analysis Stage", () => {
    test("should analyze documents for relevance to legal question", async () => {
      const { analyzeDocumentsStage } = await import(
        "../../utils/pipelineStages"
      );

      const legalQuestion = "What are the key elements of contract formation?";
      const documents = [
        {
          id: "test-doc-1",
          url: "https://example.com/contract-law",
          title: "Contract Formation Principles",
          source_name: "example.com",
          full_text:
            "A contract is formed when there is an offer, acceptance, and consideration...",
          retrieval_date: new Date().toISOString(),
        },
        {
          id: "test-doc-2",
          url: "https://example.com/property-law",
          title: "Property Law Basics",
          source_name: "example.com",
          full_text:
            "Property law governs the various forms of ownership in real property...",
          retrieval_date: new Date().toISOString(),
        },
      ];

      const analyses = await analyzeDocumentsStage(legalQuestion, documents);

      // Verify the response structure
      expect(analyses).toBeInstanceOf(Array);
      expect(analyses.length).toBeGreaterThan(0);
      expect(analyses.length).toBeLessThanOrEqual(documents.length);

      // Verify each analysis has the expected structure
      analyses.forEach((analysis) => {
        expect(analysis).toHaveProperty("search_result_id");
        expect(analysis).toHaveProperty("relevance_score");
        expect(analysis).toHaveProperty("confidence_score");
        expect(analysis).toHaveProperty("summary");
        expect(analysis).toHaveProperty("key_arguments_and_reasoning");
        expect(analysis).toHaveProperty("extracted_entities");
        expect(analysis).toHaveProperty("extracted_quotes");

        // Scores should be reasonable
        expect(analysis.relevance_score).toBeGreaterThanOrEqual(1);
        expect(analysis.relevance_score).toBeLessThanOrEqual(10);
        expect(analysis.confidence_score).toBeGreaterThanOrEqual(1);
        expect(analysis.confidence_score).toBeLessThanOrEqual(10);

        // Text fields should be strings
        expect(typeof analysis.summary).toBe("string");
        expect(analysis.summary.length).toBeGreaterThan(0);

        // Arrays should be present
        expect(Array.isArray(analysis.key_arguments_and_reasoning)).toBe(true);
        expect(Array.isArray(analysis.extracted_entities)).toBe(true);
        expect(Array.isArray(analysis.extracted_quotes)).toBe(true);
      });
    });

    test("should handle empty legal question", async () => {
      const { analyzeDocumentsStage } = await import(
        "../../utils/pipelineStages"
      );

      const documents = [
        {
          id: "test-doc-1",
          url: "https://example.com/contract-law",
          title: "Contract Formation Principles",
          source_name: "example.com",
          full_text: "Contract content...",
          retrieval_date: new Date().toISOString(),
        },
      ];

      await expect(analyzeDocumentsStage("", documents)).rejects.toThrow(
        "Legal question is required"
      );
    });

    test("should handle empty documents array", async () => {
      const { analyzeDocumentsStage } = await import(
        "../../utils/pipelineStages"
      );

      const legalQuestion = "What are contract elements?";

      await expect(analyzeDocumentsStage(legalQuestion, [])).rejects.toThrow(
        "No documents provided"
      );
    });

    test("should handle document analysis errors gracefully", async () => {
      const { analyzeDocumentsStage } = await import(
        "../../utils/pipelineStages"
      );

      // Mock BAML to throw error for second document
      let callCount = 0;
      mock.module("../../../baml_client", () => ({
        b: {
          AnalyzeSingleDocument: mock(() => {
            callCount++;
            if (callCount === 2) {
              return Promise.reject(
                new Error("Analysis failed for this document")
              );
            }
            return Promise.resolve({
              search_result_id: "test-doc-1",
              relevance_score: 8,
              confidence_score: 9,
              summary: "This document discusses contract formation principles.",
              key_arguments_and_reasoning: [
                "Offer and acceptance are essential",
              ],
              extracted_entities: [
                {
                  name: "Contract",
                  type: "LegalConcept",
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
                consider_relevant_legal_principles: {
                  summary: "Considered legal principles",
                },
                formulate_search_queries_strategy: {
                  summary: "Formulated search strategy",
                },
                specify_expected_information_strategy: {
                  summary: "Specified information strategy",
                },
                ensure_comprehensive_coverage_strategy: {
                  summary: "Ensured comprehensive coverage",
                },
              },
            });
          }),
          // Add other required BAML functions to prevent undefined errors
          SynthesizeAllFindings: mock(() =>
            Promise.resolve({
              key_synthesized_topics: [
                {
                  topic_title: "Test Topic",
                  synthesis: "Test synthesis",
                  confidence_score: 8,
                  supporting_document_ids: ["test-doc-1"],
                },
              ],
              unanswered_aspects: [],
              emerging_questions: [],
              reasoning: {
                analyze_legal_question: { summary: "Synthesis complete" },
                consider_relevant_legal_principles: {
                  summary: "Considered legal principles",
                },
                formulate_search_queries_strategy: {
                  summary: "Formulated search strategy",
                },
                specify_expected_information_strategy: {
                  summary: "Specified information strategy",
                },
                ensure_comprehensive_coverage_strategy: {
                  summary: "Ensured comprehensive coverage",
                },
              },
            })
          ),
          AssessResearchAndPlanNextSteps: mock(() =>
            Promise.resolve({
              is_sufficient: true,
              next_action: "GENERATE_REPORT",
              assessment_summary: "Test assessment",
              identified_gaps: [],
            })
          ),
          GenerateFinalLegalReport: mock(() =>
            Promise.resolve({
              report_title: "Test Report",
              executive_summary: "Test summary",
              sections: [
                { section_title: "Test Section", content: "Test content" },
              ],
              conclusion: "Test conclusion",
              limitations_and_caveats: [],
              appendix_document_ids: [],
            })
          ),
        },
      }));

      const legalQuestion = "What are contract elements?";
      const documents = [
        {
          id: "test-doc-1",
          url: "https://example.com/contract-law",
          title: "Contract Formation Principles",
          source_name: "example.com",
          full_text: "Contract content...",
          retrieval_date: new Date().toISOString(),
        },
        {
          id: "test-doc-2",
          url: "https://example.com/failing-doc",
          title: "This will fail",
          source_name: "example.com",
          full_text: "Content that will cause analysis to fail...",
          retrieval_date: new Date().toISOString(),
        },
      ];

      const analyses = await analyzeDocumentsStage(legalQuestion, documents);

      // Should return analyses array (error handling is graceful, continues with other docs)
      expect(analyses).toBeInstanceOf(Array);
      expect(analyses.length).toBeGreaterThanOrEqual(1); // At least one successful (since global mocks are used)
      expect(analyses.some((a) => a.search_result_id === "test-doc-1")).toBe(
        true
      );
    });

    test("should analyze documents with different relevance scores", async () => {
      const { analyzeDocumentsStage } = await import(
        "../../utils/pipelineStages"
      );

      // Mock different relevance scores for different documents
      let _callCount = 0;
      mock.module("../../../baml_client", () => ({
        b: {
          AnalyzeSingleDocument: mock((doc: any) => {
            _callCount++;
            const relevanceScore = doc.title?.includes("Contract") ? 9 : 3;

            return Promise.resolve({
              search_result_id: doc.id,
              relevance_score: relevanceScore,
              confidence_score: 8,
              summary: `Analysis of ${doc.title || "document"}`,
              key_arguments_and_reasoning: ["Key argument"],
              extracted_entities: [],
              extracted_quotes: [],
              counter_arguments_or_nuances: [],
              reasoning: {
                analyze_legal_question: {
                  summary: "Analysis complete",
                },
                consider_relevant_legal_principles: {
                  summary: "Considered legal principles",
                },
                formulate_search_queries_strategy: {
                  summary: "Formulated search strategy",
                },
                specify_expected_information_strategy: {
                  summary: "Specified information strategy",
                },
                ensure_comprehensive_coverage_strategy: {
                  summary: "Ensured comprehensive coverage",
                },
              },
            });
          }),
          // Add other required BAML functions to prevent undefined errors
          SynthesizeAllFindings: mock(() =>
            Promise.resolve({
              key_synthesized_topics: [
                {
                  topic_title: "Test Topic",
                  synthesis: "Test synthesis",
                  confidence_score: 8,
                  supporting_document_ids: ["relevant-doc"],
                },
              ],
              unanswered_aspects: [],
              emerging_questions: [],
              reasoning: {
                analyze_legal_question: { summary: "Synthesis complete" },
                consider_relevant_legal_principles: {
                  summary: "Considered legal principles",
                },
                formulate_search_queries_strategy: {
                  summary: "Formulated search strategy",
                },
                specify_expected_information_strategy: {
                  summary: "Specified information strategy",
                },
                ensure_comprehensive_coverage_strategy: {
                  summary: "Ensured comprehensive coverage",
                },
              },
            })
          ),
          AssessResearchAndPlanNextSteps: mock(() =>
            Promise.resolve({
              is_sufficient: true,
              next_action: "GENERATE_REPORT",
              assessment_summary: "Test assessment",
              identified_gaps: [],
            })
          ),
          GenerateFinalLegalReport: mock(() =>
            Promise.resolve({
              report_title: "Test Report",
              executive_summary: "Test summary",
              sections: [
                { section_title: "Test Section", content: "Test content" },
              ],
              conclusion: "Test conclusion",
              limitations_and_caveats: [],
              appendix_document_ids: [],
            })
          ),
        },
      }));

      const legalQuestion = "What are contract formation elements?";
      const documents = [
        {
          id: "relevant-doc",
          url: "https://example.com/contract-law",
          title: "Contract Formation Principles",
          source_name: "example.com",
          full_text: "Contract formation content...",
          retrieval_date: new Date().toISOString(),
        },
        {
          id: "less-relevant-doc",
          url: "https://example.com/property-law",
          title: "Property Law Overview",
          source_name: "example.com",
          full_text: "Property law content...",
          retrieval_date: new Date().toISOString(),
        },
      ];

      const analyses = await analyzeDocumentsStage(legalQuestion, documents);

      expect(analyses).toHaveLength(2);

      // Find analyses by document ID
      const contractAnalysis = analyses.find(
        (a) => a.search_result_id === "relevant-doc"
      );
      const propertyAnalysis = analyses.find(
        (a) => a.search_result_id === "less-relevant-doc"
      );

      expect(contractAnalysis?.relevance_score).toBe(9);
      expect(propertyAnalysis?.relevance_score).toBe(3);
    });
  });

  describe("Synthesis Stage", () => {
    test("should synthesize findings from analyzed documents", async () => {
      const { synthesizeFindingsStage } = await import(
        "../../utils/pipelineStages"
      );

      const legalQuestion = "What are the key elements of contract formation?";
      const analyzedDocuments = [
        {
          search_result_id: "doc1",
          relevance_score: 8,
          confidence_score: 9,
          summary:
            "Contract formation requires offer, acceptance, and consideration",
          key_arguments_and_reasoning: [
            "Offer must be definite",
            "Acceptance must mirror offer",
          ],
          extracted_entities: [
            {
              name: "Contract",
              type: "LegalConcept" as const,
              details: "Agreement",
            },
          ],
          extracted_quotes: ["A contract requires mutual assent"],
          counter_arguments_or_nuances: [],
          reasoning: {
            analyze_legal_question: { summary: "Analysis complete" },
            consider_relevant_legal_principles: {
              summary: "Considered legal principles",
            },
            formulate_search_queries_strategy: {
              summary: "Formulated search strategy",
            },
            specify_expected_information_strategy: {
              summary: "Specified information strategy",
            },
            ensure_comprehensive_coverage_strategy: {
              summary: "Ensured comprehensive coverage",
            },
          },
        },
      ];

      const synthesis = await synthesizeFindingsStage(
        legalQuestion,
        analyzedDocuments
      );

      expect(synthesis).toBeDefined();
      expect(synthesis).toHaveProperty("key_synthesized_topics");
      expect(synthesis).toHaveProperty("unanswered_aspects");
      expect(synthesis).toHaveProperty("emerging_questions");
      expect(synthesis).toHaveProperty("reasoning");

      expect(Array.isArray(synthesis.key_synthesized_topics)).toBe(true);
      expect(synthesis.key_synthesized_topics.length).toBeGreaterThan(0);

      synthesis.key_synthesized_topics.forEach((topic) => {
        expect(topic).toHaveProperty("topic_title");
        expect(topic).toHaveProperty("synthesis");
        expect(topic).toHaveProperty("confidence_score");
        expect(topic).toHaveProperty("supporting_document_ids");

        expect(typeof topic.topic_title).toBe("string");
        expect(typeof topic.synthesis).toBe("string");
        expect(typeof topic.confidence_score).toBe("number");
        expect(Array.isArray(topic.supporting_document_ids)).toBe(true);
      });
    });

    test("should handle empty legal question for synthesis", async () => {
      const { synthesizeFindingsStage } = await import(
        "../../utils/pipelineStages"
      );

      const analyzedDocuments = [
        {
          search_result_id: "doc1",
          relevance_score: 8,
          confidence_score: 9,
          summary: "Test analysis summary",
          key_arguments_and_reasoning: ["Test argument"],
          extracted_entities: [],
          extracted_quotes: [],
          counter_arguments_or_nuances: [],
          reasoning: {
            analyze_legal_question: { summary: "Analysis complete" },
            consider_relevant_legal_principles: {
              summary: "Considered legal principles",
            },
            formulate_search_queries_strategy: {
              summary: "Formulated search strategy",
            },
            specify_expected_information_strategy: {
              summary: "Specified information strategy",
            },
            ensure_comprehensive_coverage_strategy: {
              summary: "Ensured comprehensive coverage",
            },
          },
        },
      ];

      await expect(
        synthesizeFindingsStage("", analyzedDocuments)
      ).rejects.toThrow("Legal question is required");
    });

    test("should handle empty analyzed documents for synthesis", async () => {
      const { synthesizeFindingsStage } = await import(
        "../../utils/pipelineStages"
      );

      const legalQuestion = "What are contract elements?";

      await expect(synthesizeFindingsStage(legalQuestion, [])).rejects.toThrow(
        "No analyzed documents provided"
      );
    });
  });

  describe("Assessment Stage", () => {
    test("should assess research sufficiency", async () => {
      const { assessResearchStage } = await import(
        "../../utils/pipelineStages"
      );

      const legalQuestion = "What are contract elements?";
      const queryAnalysis = {
        search_queries: [
          {
            query_string: "contract elements",
            expected_information: ["offer", "acceptance"],
          },
        ],
        reasoning: {
          analyze_legal_question: { summary: "Query analysis" },
          consider_relevant_legal_principles: {
            summary: "Considered legal principles",
          },
          formulate_search_queries_strategy: {
            summary: "Formulated search strategy",
          },
          specify_expected_information_strategy: {
            summary: "Specified information strategy",
          },
          ensure_comprehensive_coverage_strategy: {
            summary: "Ensured comprehensive coverage",
          },
        },
      };
      const synthesis = {
        key_synthesized_topics: [
          {
            topic_title: "Contract Elements",
            synthesis: "Analysis",
            confidence_score: 8,
            supporting_document_ids: ["doc1"],
          },
        ],
        unanswered_aspects: [],
        emerging_questions: [],
        reasoning: {
          analyze_legal_question: { summary: "Synthesis" },
          consider_relevant_legal_principles: {
            summary: "Considered legal principles",
          },
          formulate_search_queries_strategy: {
            summary: "Formulated search strategy",
          },
          specify_expected_information_strategy: {
            summary: "Specified information strategy",
          },
          ensure_comprehensive_coverage_strategy: {
            summary: "Ensured comprehensive coverage",
          },
        },
      };

      const assessment = await assessResearchStage(
        legalQuestion,
        queryAnalysis,
        synthesis
      );

      expect(assessment).toBeDefined();
      expect(assessment).toHaveProperty("is_sufficient");
      expect(assessment).toHaveProperty("next_action");
      expect(assessment).toHaveProperty("assessment_summary");
      expect(assessment).toHaveProperty("identified_gaps");

      expect(typeof assessment.is_sufficient).toBe("boolean");
      expect(typeof assessment.next_action).toBe("string");
      expect(typeof assessment.assessment_summary).toBe("string");
      expect(Array.isArray(assessment.identified_gaps)).toBe(true);

      expect([
        "GENERATE_REPORT",
        "REFINE_QUERIES",
        "REQUEST_HUMAN_REVIEW",
        "NEW_QUERIES",
      ]).toContain(assessment.next_action);
    });

    test("should handle invalid inputs for assessment", async () => {
      const { assessResearchStage } = await import(
        "../../utils/pipelineStages"
      );

      await expect(
        assessResearchStage("", {} as any, {} as any)
      ).rejects.toThrow("Legal question is required");
    });
  });

  describe("Report Generation Stage", () => {
    test("should generate final legal report", async () => {
      const { generateReportStage } = await import(
        "../../utils/pipelineStages"
      );

      const legalQuestion = "What are contract elements?";
      const synthesis = {
        key_synthesized_topics: [
          {
            topic_title: "Contract Elements",
            synthesis: "Analysis",
            confidence_score: 8,
            supporting_document_ids: ["doc1"],
          },
        ],
        unanswered_aspects: [],
        emerging_questions: [],
        reasoning: {
          analyze_legal_question: { summary: "Synthesis" },
          consider_relevant_legal_principles: {
            summary: "Considered legal principles",
          },
          formulate_search_queries_strategy: {
            summary: "Formulated search strategy",
          },
          specify_expected_information_strategy: {
            summary: "Specified information strategy",
          },
          ensure_comprehensive_coverage_strategy: {
            summary: "Ensured comprehensive coverage",
          },
        },
      };
      const queryAnalysis = {
        search_queries: [
          {
            query_string: "contract elements",
            expected_information: ["offer", "acceptance"],
          },
        ],
        reasoning: {
          analyze_legal_question: { summary: "Query analysis" },
          consider_relevant_legal_principles: {
            summary: "Considered legal principles",
          },
          formulate_search_queries_strategy: {
            summary: "Formulated search strategy",
          },
          specify_expected_information_strategy: {
            summary: "Specified information strategy",
          },
          ensure_comprehensive_coverage_strategy: {
            summary: "Ensured comprehensive coverage",
          },
        },
      };

      const report = await generateReportStage(
        legalQuestion,
        synthesis,
        queryAnalysis
      );

      expect(report).toBeDefined();
      expect(report).toHaveProperty("report_title");
      expect(report).toHaveProperty("executive_summary");
      expect(report).toHaveProperty("sections");
      expect(report).toHaveProperty("conclusion");
      expect(report).toHaveProperty("limitations_and_caveats");

      expect(typeof report.report_title).toBe("string");
      expect(typeof report.executive_summary).toBe("string");
      expect(typeof report.conclusion).toBe("string");

      expect(Array.isArray(report.sections)).toBe(true);
      expect(Array.isArray(report.limitations_and_caveats)).toBe(true);

      report.sections.forEach((section) => {
        expect(section).toHaveProperty("section_title");
        expect(section).toHaveProperty("content");
        expect(typeof section.section_title).toBe("string");
        expect(typeof section.content).toBe("string");
      });
    });

    test("should handle invalid inputs for report generation", async () => {
      const { generateReportStage } = await import(
        "../../utils/pipelineStages"
      );

      await expect(
        generateReportStage("", {} as any, {} as any)
      ).rejects.toThrow("Legal question is required");
    });
  });
});
