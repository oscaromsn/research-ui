'use server';

import { b } from '@/baml_client';
import type {
  LegalQueryAnalysis,
  SearchQueryItem,
  SearchResultItem,
  AnalyzedDocument,
  OverallSynthesis,
  ResearchAssessment,
  FinalLegalReport,
  NextActionType
} from '@/baml_client/types';

// Research pipeline stage enum
export type ResearchStage =
  | "IDLE"
  | "INITIALIZING"
  | "GENERATING_QUERIES"
  | "FETCHING_DOCUMENTS"
  | "ANALYZING_DOCUMENTS"
  | "SYNTHESIZING_FINDINGS"
  | "ASSESSING_RESEARCH"
  | "GENERATING_REPORT"
  | "ITERATION_PAUSED"
  | "HUMAN_REVIEW_REQUESTED"
  | "COMPLETED"
  | "ERROR";

// Stream communication protocol
export interface ResearchUpdate {
  type: "PROGRESS" | "DATA" | "ERROR" | "STATUS_CHANGE" | "LOG";
  stage: ResearchStage;
  message?: string;
  data?: unknown;
  isFinalForStage?: boolean;
  currentProcessedDoc?: number;
  totalDocsToProcess?: number;
  fieldName?: string;
  isFieldComplete?: boolean;
}

// Stream creation utility
function createStream(): {
  stream: ReadableStream<Uint8Array>;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
  closeStream: () => Promise<void>;
} {
  const encoder = new TextEncoder();
  const transformStream = new TransformStream();
  const writer = transformStream.writable.getWriter();

  const closeStream = async () => {
    if (writer && !writer.closed) {
      try {
        await writer.close();
      } catch (e) {
        console.error("Error closing stream writer:", e);
      }
    }
  };

  return { 
    stream: transformStream.readable, 
    writer, 
    encoder, 
    closeStream 
  };
}

// Update streaming utility
async function sendUpdate(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  update: ResearchUpdate
): Promise<void> {
  try {
    const jsonString = JSON.stringify(update);
    await writer.write(encoder.encode(`${jsonString}\n`));
  } catch (e) {
    console.error("Stream write error in sendUpdate:", e, "Update:", update);
  }
}

// Mock document fetching function (for simulation)
async function fetchDocumentsFromQueries(queries: SearchQueryItem[]): Promise<SearchResultItem[]> {
  console.log("Simulating document fetch for queries:", queries.map(q => q.query_string).join(", "));
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return empty array for testing empty states
  if (queries.length > 0 && queries[0].query_string.includes("no results please")) {
    return [];
  }
  
  // Mock search results
  const mockResults: SearchResultItem[] = [
    {
      id: "doc_001",
      url: "https://example.com/case1",
      title: "Smith v. Jones - Contract Dispute Resolution",
      source_name: "Federal Court Database",
      snippet: "This case establishes precedent for contract interpretation...",
      full_text: "Full text of the case discussing contract law principles and interpretation methods...",
      published_date: "2023-05-15",
      retrieval_date: new Date().toISOString(),
      author: "Judge Williams",
      score: 0.92,
      metadata: { "court": "federal", "jurisdiction": "US" }
    },
    {
      id: "doc_002", 
      url: "https://example.com/statute1",
      title: "Commercial Code Section 2-315 - Implied Warranty",
      source_name: "US Legal Code",
      snippet: "Statutory requirements for implied warranty of fitness...",
      full_text: "Complete statutory text regarding commercial warranty requirements...",
      published_date: "2022-01-01",
      retrieval_date: new Date().toISOString(),
      score: 0.88,
      metadata: { "type": "statute", "jurisdiction": "US" }
    }
  ];
  
  // Return 1-2 random results
  return mockResults.slice(0, Math.floor(Math.random() * 2) + 1);
}

// Main orchestrator function
export async function conductResearch(legalQuestion: string): Promise<ReadableStream<Uint8Array>> {
  const { stream, writer, encoder, closeStream } = createStream();
  let currentStage: ResearchStage = "IDLE";

  // IIFE to run async pipeline logic
  (async () => {
    try {
      currentStage = "INITIALIZING";
      await sendUpdate(writer, encoder, { 
        type: "STATUS_CHANGE", 
        stage: currentStage, 
        message: "Research process initializing..." 
      });

      // Pipeline variables
      let queryAnalysis: LegalQueryAnalysis;
      let searchResultItems: SearchResultItem[] = [];
      let analyzedDocs: AnalyzedDocument[] = [];

      // --- Stage 1: Generate Legal Search Queries ---
      currentStage = "GENERATING_QUERIES";
      await sendUpdate(writer, encoder, { 
        type: "STATUS_CHANGE", 
        stage: currentStage, 
        message: "Generating initial search queries..." 
      });

      queryAnalysis = await b.GenerateLegalSearchQueries(legalQuestion);

      // Send client-friendly summary
      await sendUpdate(writer, encoder, {
        type: "DATA",
        stage: currentStage,
        data: {
          queries: queryAnalysis.search_queries.map(q => ({
            query_string: q.query_string,
            expected_information_summary: `${q.expected_information.join(' ').substring(0, 100)}...`
          })),
          reasoningEntryPoints: {
            analyzeLegalQuestionSummary: `${queryAnalysis.reasoning.analyze_legal_question.summary?.substring(0,150)}...`,
            totalStepsAnalyzed: 5
          }
        },
        message: `${queryAnalysis.search_queries.length} initial queries generated.`,
        isFinalForStage: true,
      });

      // --- Stage 2: Simulated Document Retrieval ---
      currentStage = "FETCHING_DOCUMENTS";
      await sendUpdate(writer, encoder, { 
        type: "STATUS_CHANGE", 
        stage: currentStage, 
        message: "Retrieving documents based on queries..." 
      });

      searchResultItems = await fetchDocumentsFromQueries(queryAnalysis.search_queries);

      if (searchResultItems.length === 0) {
        await sendUpdate(writer, encoder, {
          type: "LOG",
          stage: currentStage,
          message: "No documents found for the generated queries. Further refinement might be needed.",
          isFinalForStage: true,
        });
      } else {
        await sendUpdate(writer, encoder, {
          type: "DATA",
          stage: currentStage,
          data: {
            count: searchResultItems.length,
            titles: searchResultItems.map(r => r.title ? `${r.title.substring(0, 70)}...` : "Untitled"),
            sources: searchResultItems.map(r => r.source_name),
          },
          message: `${searchResultItems.length} documents retrieved (simulated).`,
          isFinalForStage: true,
        });
      }

      // --- Stage 3: Analyze Documents Iteratively ---
      if (searchResultItems.length > 0) {
        currentStage = "ANALYZING_DOCUMENTS";
        await sendUpdate(writer, encoder, {
          type: "STATUS_CHANGE",
          stage: currentStage,
          message: `Starting analysis of ${searchResultItems.length} documents...`,
          totalDocsToProcess: searchResultItems.length,
          currentProcessedDoc: 0
        });

        analyzedDocs = [];
        for (let i = 0; i < searchResultItems.length; i++) {
          const doc = searchResultItems[i];
          await sendUpdate(writer, encoder, {
            type: "PROGRESS",
            stage: currentStage,
            message: `Analyzing document ${i + 1}/${searchResultItems.length}: ${doc.title ? `${doc.title.substring(0, 50)}...` : "Untitled"}`,
            currentProcessedDoc: i,
            totalDocsToProcess: searchResultItems.length
          });

          const analysis: AnalyzedDocument = await b.AnalyzeSingleDocument(doc, legalQuestion);
          analyzedDocs.push(analysis);

          // Send client-friendly summary of this specific document's analysis with extended data
          await sendUpdate(writer, encoder, {
            type: "DATA",
            stage: currentStage,
            data: {
              docId: doc.id,
              title: doc.title,
              url: doc.url,
              relevanceScore: analysis.relevance_score,
              confidenceScore: analysis.confidence_score,
              summarySnippet: analysis.summary.substring(0, 300),
              
              // Extended analysis data for evidence analysis display
              keyArguments: analysis.key_arguments_and_reasoning,
              extractedEntities: analysis.extracted_entities?.map(entity => ({
                name: entity.name,
                type: entity.type,
                details: entity.details
              })) || [],
              extractedQuotes: analysis.extracted_quotes || [],
              fullText: doc.full_text?.substring(0, 5000), // Truncate for performance
              counterArguments: analysis.counter_arguments_or_nuances || [],
              
              // Analysis reasoning summary for modal display
              analysisReasoning: {
                analyzeLegalQuestionSummary: analysis.reasoning?.analyze_legal_question?.summary?.substring(0, 500) || "",
                considerRelevantPrinciplesSummary: analysis.reasoning?.consider_relevant_legal_principles?.summary?.substring(0, 500) || ""
              }
            },
            message: `Analysis complete for: ${doc.title ? `${doc.title.substring(0, 50)}...` : "Untitled"}. Relevance: ${analysis.relevance_score}/10`,
            currentProcessedDoc: i + 1,
            totalDocsToProcess: searchResultItems.length,
          });
        }
        
        await sendUpdate(writer, encoder, {
          type: "LOG",
          stage: currentStage,
          message: "All documents analyzed.",
          isFinalForStage: true,
          totalDocsToProcess: searchResultItems.length,
          currentProcessedDoc: searchResultItems.length
        });
      }

      // --- Stage 4: Synthesize Findings ---
      let synthesis: OverallSynthesis | null = null;
      if (analyzedDocs.length > 0) {
        currentStage = "SYNTHESIZING_FINDINGS";
        await sendUpdate(writer, encoder, { 
          type: "STATUS_CHANGE", 
          stage: currentStage, 
          message: "Synthesizing findings from analyzed documents..." 
        });

        synthesis = await b.SynthesizeAllFindings(analyzedDocs, legalQuestion);

        await sendUpdate(writer, encoder, {
          type: "DATA",
          stage: currentStage,
          data: {
            topics: synthesis.key_synthesized_topics.map(t => ({
              title: t.topic_title,
              synthesisSnippet: `${t.synthesis.substring(0, 250)}...`,
              confidence: t.confidence_score,
              docIds: t.supporting_document_ids,
            })),
            unansweredAspects: synthesis.unanswered_aspects || [],
            emergingQuestions: synthesis.emerging_questions || [],
            reasoningSummary: `${synthesis.reasoning.analyze_legal_question.summary?.substring(0,150)}...`
          },
          message: "Overall synthesis complete.",
          isFinalForStage: true,
        });
      } else {
        await sendUpdate(writer, encoder, { 
          type: "LOG", 
          stage: "SYNTHESIZING_FINDINGS", 
          message: "Skipping synthesis as no documents were analyzed.", 
          isFinalForStage: true 
        });
      }

      // --- Stage 5: Assess Research ---
      let assessment: ResearchAssessment | null = null;
      if (analyzedDocs.length > 0 && synthesis) {
        currentStage = "ASSESSING_RESEARCH";
        await sendUpdate(writer, encoder, { 
          type: "STATUS_CHANGE", 
          stage: currentStage, 
          message: "Assessing research sufficiency and planning next steps..." 
        });

        assessment = await b.AssessResearchAndPlanNextSteps(
          legalQuestion,
          queryAnalysis,
          synthesis
        );

        await sendUpdate(writer, encoder, {
          type: "DATA",
          stage: currentStage,
          data: {
            isSufficient: assessment.is_sufficient,
            assessmentSummary: assessment.assessment_summary,
            nextAction: assessment.next_action,
            identifiedGaps: assessment.identified_gaps || [],
            suggestedRefinementQueries: (assessment.next_action === "REFINE_QUERIES" || assessment.next_action === "NEW_QUERIES")
              ? assessment.suggested_queries_for_refinement?.map(q => q.query_string) || []
              : undefined,
          },
          message: `Assessment complete. Next action: ${assessment.next_action}.`,
          isFinalForStage: true,
        });
      } else {
        // Default assessment if no documents analyzed
        await sendUpdate(writer, encoder, { 
          type: "LOG", 
          stage: "ASSESSING_RESEARCH", 
          message: "Skipping assessment due to lack of analyzed documents or synthesis.", 
          isFinalForStage: true 
        });
        
        assessment = {
          is_sufficient: false,
          assessment_summary: "Insufficient data to perform assessment. Initial document retrieval might have failed or found no relevant items.",
          next_action: "REQUEST_HUMAN_REVIEW" as NextActionType,
          reasoning: {} as ResearchAssessment['reasoning'], // Simplified default
        } as ResearchAssessment;
        
        await sendUpdate(writer, encoder, {
          type: "DATA",
          stage: "ASSESSING_RESEARCH",
          data: {
            isSufficient: assessment.is_sufficient,
            assessmentSummary: assessment.assessment_summary,
            nextAction: assessment.next_action,
          },
          message: "Assessment defaulted due to insufficient prior data.",
          isFinalForStage: true,
        });
      }

      // Simplified Iteration Logic
      if (assessment.next_action !== "GENERATE_REPORT") {
        currentStage = assessment.next_action === "REQUEST_HUMAN_REVIEW" ? "HUMAN_REVIEW_REQUESTED" : "ITERATION_PAUSED";
        await sendUpdate(writer, encoder, {
          type: "STATUS_CHANGE",
          stage: currentStage,
          message: `Research paused. Suggested next action: ${assessment.next_action}. Summary: ${assessment.assessment_summary}`,
        });
        await closeStream();
        return;
      }

      // --- Stage 6: Generate Final Report ---
      if (synthesis) {
        currentStage = "GENERATING_REPORT";
        await sendUpdate(writer, encoder, { 
          type: "STATUS_CHANGE", 
          stage: currentStage, 
          message: "Generating final legal report..." 
        });

        // Check if streaming is available for this function
        try {
          const reportStream = b.stream.GenerateFinalLegalReport(
            legalQuestion,
            synthesis,
            [queryAnalysis]
          );

          let finalReportAccumulator: Record<string, unknown> = {};

          for await (const partialReport of reportStream) {
            finalReportAccumulator = { ...finalReportAccumulator, ...partialReport };

            // Handle streaming executive summary
            if (partialReport.executive_summary) {
              await sendUpdate(writer, encoder, {
                type: "DATA",
                stage: currentStage,
                data: {
                  report_title: finalReportAccumulator.report_title || partialReport.report_title,
                  executive_summary_chunk: partialReport.executive_summary,
                },
                message: "Streaming executive summary...",
                fieldName: "executiveSummary",
                isFieldComplete: false // Will be marked complete later
              });
            }

            // Handle streaming sections
            if (partialReport.sections) {
              partialReport.sections.forEach((section, index) => {
                if (section?.content) {
                  sendUpdate(writer, encoder, {
                    type: "DATA",
                    stage: currentStage,
                    data: {
                      sectionUpdate: {
                        index: index,
                        title: section.section_title,
                        content_chunk: section.content,
                      }
                    },
                    message: `Streaming content for section: ${section.section_title}`,
                    fieldName: `section_${index}_content`,
                    isFieldComplete: false
                  });
                }
              });
            }

            // Handle streaming conclusion
            if (partialReport.conclusion) {
              await sendUpdate(writer, encoder, {
                type: "DATA", 
                stage: currentStage,
                data: { conclusion_chunk: partialReport.conclusion },
                message: "Streaming conclusion...",
                fieldName: "conclusion",
                isFieldComplete: false
              });
            }
          }

          const finalReportObject: FinalLegalReport = await reportStream.getFinalResponse();

          // Send final complete report
          await sendUpdate(writer, encoder, {
            type: "DATA",
            stage: currentStage,
            data: {
              title: finalReportObject.report_title,
              executiveSummary: finalReportObject.executive_summary,
              sections: finalReportObject.sections.map(s => ({ 
                title: s.section_title, 
                content: s.content 
              })),
              conclusion: finalReportObject.conclusion,
              limitations: finalReportObject.limitations_and_caveats || [],
              appendixDocIds: finalReportObject.appendix_document_ids || [],
            },
            message: "Final report generation complete.",
            isFinalForStage: true,
          });

        } catch (streamError) {
          // Fallback to non-streaming if streaming fails
          console.log("Streaming failed, falling back to regular generation:", streamError);
          const finalReport = await b.GenerateFinalLegalReport(
            legalQuestion,
            synthesis,
            [queryAnalysis]
          );

          await sendUpdate(writer, encoder, {
            type: "DATA",
            stage: currentStage,
            data: {
              title: finalReport.report_title,
              executiveSummary: finalReport.executive_summary,
              sections: finalReport.sections.map(s => ({ 
                title: s.section_title, 
                content: s.content 
              })),
              conclusion: finalReport.conclusion,
              limitations: finalReport.limitations_and_caveats || [],
              appendixDocIds: finalReport.appendix_document_ids || [],
            },
            message: "Final report generation complete (non-streaming).",
            isFinalForStage: true,
          });
        }
      }
      
      currentStage = "COMPLETED";
      await sendUpdate(writer, encoder, { 
        type: "STATUS_CHANGE", 
        stage: currentStage, 
        message: "Research process successfully completed." 
      });

    } catch (error: unknown) {
      console.error(`Error during orchestrator stage ${currentStage}:`, error);
      await sendUpdate(writer, encoder, { 
        type: "ERROR", 
        stage: currentStage, 
        message: error instanceof Error ? error.message : "An unknown orchestrator error occurred." 
      });
    } finally {
      await closeStream();
    }
  })();

  return stream;
}