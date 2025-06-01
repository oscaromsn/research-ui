"use server";

import { b } from "@/baml_client";
import type {
  AnalyzedDocument,
  FinalLegalReport,
  NextActionType,
  OverallSynthesis,
  ResearchAssessment,
  SearchQueryItem,
  SearchResultItem,
} from "@/baml_client/types";
import { executeExaSearch } from "@/lib/utils/exaSearchUtil";

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
    closeStream,
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

// Live document fetching function using Exa API
async function fetchDocumentsFromQueries(
  queries: SearchQueryItem[]
): Promise<SearchResultItem[]> {
  const MAX_QUERIES_TO_EXECUTE = 3; // Start conservative for initial implementation
  const RESULTS_PER_QUERY = 2; // Limit results per query to manage API usage
  const allFetchedResults: SearchResultItem[] = [];

  console.log(
    `Orchestrator: Starting live document fetch for ${queries.length} queries`
  );

  const executedQueries = queries.slice(0, MAX_QUERIES_TO_EXECUTE);

  for (const query of executedQueries) {
    try {
      console.log(
        `Orchestrator: Executing live search for query: "${query.query_string}"`
      );
      const results = await executeExaSearch(query, RESULTS_PER_QUERY, true, 2);
      allFetchedResults.push(...results);
      console.log(
        `Orchestrator: Query "${query.query_string}" yielded ${results.length} results.`
      );
    } catch (searchError: unknown) {
      const errorMessage =
        searchError instanceof Error
          ? searchError.message
          : String(searchError);
      console.error(
        `Orchestrator: Error during live search for query "${query.query_string}":`,
        errorMessage
      );

      // Handle rate limiting specifically - consider stopping further searches
      if (errorMessage.includes("Rate limit exceeded")) {
        console.warn(
          "Orchestrator: Rate limit reached for Exa API. Stopping further search queries for this session."
        );
        break; // Stop executing more queries if we hit rate limits
      }

      // For other errors, continue with remaining queries
      // Individual query failures shouldn't halt the entire process
    }
  }

  // De-duplicate results based on URL (which is used as the ID)
  const uniqueDocIds = new Set<string>();
  const searchResultItems = allFetchedResults.filter((item) => {
    if (!uniqueDocIds.has(item.id)) {
      uniqueDocIds.add(item.id);
      return true;
    }
    return false;
  });

  console.log(
    `Orchestrator: Total unique documents fetched: ${searchResultItems.length}`
  );
  return searchResultItems;
}

// Auto mode configuration interface
interface AutoModeConfig {
  isEnabled: boolean;
  maxIterations: number;
  currentIteration: number;
}

// Main orchestrator function
export async function conductResearch(
  legalQuestion: string,
  autoModeConfig?: AutoModeConfig
): Promise<ReadableStream<Uint8Array>> {
  const { stream, writer, encoder, closeStream } = createStream();
  let currentStage: ResearchStage = "IDLE";

  // Set up timeout mechanism to prevent hanging
  const ORCHESTRATOR_TIMEOUT_MS = 300000; // 5 minutes total timeout
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, ORCHESTRATOR_TIMEOUT_MS);

  // IIFE to run async pipeline logic
  (async () => {
    try {
      // Check for timeout before each major stage
      if (timeoutController.signal.aborted) {
        throw new Error(
          "Orchestrator timeout: Process exceeded maximum time limit"
        );
      }
      currentStage = "INITIALIZING";
      await sendUpdate(writer, encoder, {
        type: "STATUS_CHANGE",
        stage: currentStage,
        message: "Research process initializing...",
      });

      // Pipeline variables
      let searchResultItems: SearchResultItem[] = [];
      let analyzedDocs: AnalyzedDocument[] = [];

      // --- Stage 1: Generate Legal Search Queries ---
      currentStage = "GENERATING_QUERIES";
      await sendUpdate(writer, encoder, {
        type: "STATUS_CHANGE",
        stage: currentStage,
        message: "Generating initial search queries...",
      });

      if (timeoutController.signal.aborted) {
        throw new Error("Orchestrator timeout during query generation");
      }

      const queryAnalysis = await b.GenerateLegalSearchQueries(legalQuestion);

      // Send client-friendly summary
      await sendUpdate(writer, encoder, {
        type: "DATA",
        stage: currentStage,
        data: {
          queries: queryAnalysis.search_queries.map((q) => ({
            query_string: q.query_string,
            expected_information_summary: `${q.expected_information.join(" ").substring(0, 100)}...`,
          })),
          reasoningEntryPoints: {
            analyzeLegalQuestionSummary: `${queryAnalysis.reasoning.analyze_legal_question.summary?.substring(0, 150)}...`,
            totalStepsAnalyzed: 5,
          },
        },
        message: `${queryAnalysis.search_queries.length} initial queries generated.`,
        isFinalForStage: true,
      });

      // --- Stage 2: Live Document Retrieval ---
      currentStage = "FETCHING_DOCUMENTS";
      await sendUpdate(writer, encoder, {
        type: "STATUS_CHANGE",
        stage: currentStage,
        message: "Retrieving documents from live search APIs...",
      });

      if (timeoutController.signal.aborted) {
        throw new Error("Orchestrator timeout during document fetching");
      }

      try {
        searchResultItems = await fetchDocumentsFromQueries(
          queryAnalysis.search_queries
        );

        if (searchResultItems.length === 0) {
          await sendUpdate(writer, encoder, {
            type: "ERROR",
            stage: currentStage,
            message:
              "No documents found for any of the executed search queries. This indicates a fundamental issue with document retrieval. Unable to proceed without source documents.",
            isFinalForStage: true,
          });
          // Fail fast - can't proceed without any documents
          return;
        }
        await sendUpdate(writer, encoder, {
          type: "DATA",
          stage: currentStage,
          data: {
            count: searchResultItems.length,
            titles: searchResultItems.map((r) =>
              r.title ? `${r.title.substring(0, 70)}...` : "Untitled"
            ),
            sources: searchResultItems.map((r) => r.source_name),
          },
          message: `${searchResultItems.length} unique documents retrieved from live search.`,
          isFinalForStage: true,
        });
      } catch (searchError: unknown) {
        const errorMessage =
          searchError instanceof Error
            ? searchError.message
            : String(searchError);
        console.error("Orchestrator: Complete search failure:", errorMessage);
        await sendUpdate(writer, encoder, {
          type: "ERROR",
          stage: currentStage,
          message: `Failed to retrieve documents from search API: ${errorMessage}. Unable to proceed without document retrieval capability.`,
        });
        // Fail fast - critical error in document retrieval
        return;
      }

      // --- Stage 3: Analyze Documents Iteratively ---
      if (searchResultItems.length > 0) {
        currentStage = "ANALYZING_DOCUMENTS";
        await sendUpdate(writer, encoder, {
          type: "STATUS_CHANGE",
          stage: currentStage,
          message: `Starting analysis of ${searchResultItems.length} documents...`,
          totalDocsToProcess: searchResultItems.length,
          currentProcessedDoc: 0,
        });

        if (timeoutController.signal.aborted) {
          throw new Error("Orchestrator timeout during document analysis");
        }

        analyzedDocs = [];
        for (let i = 0; i < searchResultItems.length; i++) {
          if (timeoutController.signal.aborted) {
            throw new Error(
              "Orchestrator timeout during document analysis iteration"
            );
          }
          const doc = searchResultItems[i];
          await sendUpdate(writer, encoder, {
            type: "PROGRESS",
            stage: currentStage,
            message: `Analyzing document ${i + 1}/${searchResultItems.length}: ${doc.title ? `${doc.title.substring(0, 50)}...` : "Untitled"}`,
            currentProcessedDoc: i,
            totalDocsToProcess: searchResultItems.length,
          });

          const analysis: AnalyzedDocument = await b.AnalyzeSingleDocument(
            doc,
            legalQuestion
          );
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
              extractedEntities:
                analysis.extracted_entities?.map((entity) => ({
                  name: entity.name,
                  type: entity.type,
                  details: entity.details,
                })) || [],
              extractedQuotes: analysis.extracted_quotes || [],
              fullText: doc.full_text?.substring(0, 5000), // Truncate for performance
              counterArguments: analysis.counter_arguments_or_nuances || [],

              // Analysis reasoning summary for modal display
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
          currentProcessedDoc: searchResultItems.length,
        });
      }

      // --- Stage 4: Synthesize Findings ---
      let synthesis: OverallSynthesis | null = null;
      if (analyzedDocs.length > 0) {
        currentStage = "SYNTHESIZING_FINDINGS";
        await sendUpdate(writer, encoder, {
          type: "STATUS_CHANGE",
          stage: currentStage,
          message: "Synthesizing findings from analyzed documents...",
        });

        if (timeoutController.signal.aborted) {
          throw new Error("Orchestrator timeout during findings synthesis");
        }

        synthesis = await b.SynthesizeAllFindings(analyzedDocs, legalQuestion);

        await sendUpdate(writer, encoder, {
          type: "DATA",
          stage: currentStage,
          data: {
            topics: synthesis.key_synthesized_topics.map((t) => ({
              title: t.topic_title,
              synthesisSnippet: `${t.synthesis.substring(0, 250)}...`,
              confidence: t.confidence_score,
              docIds: t.supporting_document_ids,
            })),
            unansweredAspects: synthesis.unanswered_aspects || [],
            emergingQuestions: synthesis.emerging_questions || [],
            reasoningSummary: `${synthesis.reasoning.analyze_legal_question.summary?.substring(0, 150)}...`,
          },
          message: "Overall synthesis complete.",
          isFinalForStage: true,
        });
      } else {
        await sendUpdate(writer, encoder, {
          type: "ERROR",
          stage: "SYNTHESIZING_FINDINGS",
          message:
            "Cannot synthesize findings - no documents were successfully analyzed. Research pipeline failed.",
          isFinalForStage: true,
        });
        // Fail fast - can't proceed without analyzed documents
        return;
      }

      // --- Stage 5: Assess Research ---
      let assessment: ResearchAssessment | null = null;
      if (analyzedDocs.length > 0 && synthesis) {
        currentStage = "ASSESSING_RESEARCH";
        await sendUpdate(writer, encoder, {
          type: "STATUS_CHANGE",
          stage: currentStage,
          message: "Assessing research sufficiency and planning next steps...",
        });

        if (timeoutController.signal.aborted) {
          throw new Error("Orchestrator timeout during research assessment");
        }

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
            suggestedRefinementQueries:
              assessment.next_action === "REFINE_QUERIES" ||
              assessment.next_action === "NEW_QUERIES"
                ? assessment.suggested_queries_for_refinement?.map(
                    (q) => q.query_string
                  ) || []
                : undefined,
          },
          message: `Assessment complete. Next action: ${assessment.next_action}.`,
          isFinalForStage: true,
        });
      } else {
        // This should not happen if we fail fast above, but keep as safety net
        await sendUpdate(writer, encoder, {
          type: "ERROR",
          stage: "ASSESSING_RESEARCH",
          message:
            "Cannot assess research - prerequisite stages failed. Research pipeline terminated.",
          isFinalForStage: true,
        });
        return;
      }

      // Enhanced Iteration Logic with Auto Mode Support
      if (assessment.next_action !== "GENERATE_REPORT") {
        // Check if auto mode is enabled and we should continue automatically
        const shouldContinueAutomatically =
          autoModeConfig?.isEnabled &&
          (assessment.next_action === "REFINE_QUERIES" ||
            assessment.next_action === "NEW_QUERIES") &&
          autoModeConfig.currentIteration < autoModeConfig.maxIterations;

        if (shouldContinueAutomatically) {
          await sendUpdate(writer, encoder, {
            type: "STATUS_CHANGE",
            stage: "GENERATING_QUERIES",
            message: `Auto mode: Executing ${assessment.next_action}. Iteration ${autoModeConfig.currentIteration + 1}/${autoModeConfig.maxIterations}`,
          });

          // Use suggested refinement queries if available, otherwise generate new ones
          let newQueries: SearchQueryItem[] = [];
          if (
            assessment.suggested_queries_for_refinement &&
            assessment.suggested_queries_for_refinement.length > 0
          ) {
            newQueries = assessment.suggested_queries_for_refinement;
          } else {
            // Generate new queries based on the updated context
            const refinedQueryAnalysis = await b.GenerateLegalSearchQueries(
              `${legalQuestion}\n\nPrevious research gaps identified: ${assessment.identified_gaps?.join(", ") || "None"}`
            );
            newQueries = refinedQueryAnalysis.search_queries;
          }

          // Send updated queries to client
          await sendUpdate(writer, encoder, {
            type: "DATA",
            stage: "GENERATING_QUERIES",
            data: {
              queries: newQueries.map((q) => ({
                query_string: q.query_string,
                expected_information_summary: `${q.expected_information.join(" ").substring(0, 100)}...`,
              })),
            },
            message: `${newQueries.length} refinement queries generated for iteration ${autoModeConfig.currentIteration + 1}.`,
            isFinalForStage: true,
          });

          // Continue with document fetching for the new queries
          currentStage = "FETCHING_DOCUMENTS";
          await sendUpdate(writer, encoder, {
            type: "STATUS_CHANGE",
            stage: currentStage,
            message: "Auto mode: Retrieving additional documents...",
          });

          try {
            const newSearchResults =
              await fetchDocumentsFromQueries(newQueries);

            if (newSearchResults.length > 0) {
              // Analyze new documents
              currentStage = "ANALYZING_DOCUMENTS";
              await sendUpdate(writer, encoder, {
                type: "STATUS_CHANGE",
                stage: currentStage,
                message: `Auto mode: Analyzing ${newSearchResults.length} additional documents...`,
                totalDocsToProcess: newSearchResults.length,
                currentProcessedDoc: 0,
              });

              for (let i = 0; i < newSearchResults.length; i++) {
                const doc = newSearchResults[i];
                const analysis: AnalyzedDocument =
                  await b.AnalyzeSingleDocument(doc, legalQuestion);
                analyzedDocs.push(analysis);

                // Send incremental analysis updates
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
                    keyArguments: analysis.key_arguments_and_reasoning,
                    extractedEntities:
                      analysis.extracted_entities?.map((entity) => ({
                        name: entity.name,
                        type: entity.type,
                        details: entity.details,
                      })) || [],
                    extractedQuotes: analysis.extracted_quotes || [],
                    counterArguments:
                      analysis.counter_arguments_or_nuances || [],
                  },
                  currentProcessedDoc: i + 1,
                  totalDocsToProcess: newSearchResults.length,
                });
              }

              // Generate updated synthesis
              currentStage = "SYNTHESIZING_FINDINGS";
              await sendUpdate(writer, encoder, {
                type: "STATUS_CHANGE",
                stage: currentStage,
                message:
                  "Auto mode: Synthesizing findings with new documents...",
              });

              synthesis = await b.SynthesizeAllFindings(
                analyzedDocs,
                legalQuestion
              );

              await sendUpdate(writer, encoder, {
                type: "DATA",
                stage: currentStage,
                data: {
                  topics:
                    synthesis?.key_synthesized_topics?.map((topic) => ({
                      title: topic.topic_title,
                      synthesisSnippet: topic.synthesis.substring(0, 300),
                      confidence: topic.confidence_score,
                      docIds: topic.supporting_document_ids,
                    })) || [],
                  unansweredAspects: synthesis?.unanswered_aspects || [],
                  emergingQuestions: synthesis?.emerging_questions || [],
                },
                message: "Auto mode: Updated synthesis complete.",
                isFinalForStage: true,
              });

              // Continue to final report generation
              currentStage = "GENERATING_REPORT";
              await sendUpdate(writer, encoder, {
                type: "STATUS_CHANGE",
                stage: currentStage,
                message:
                  "Auto mode: Generating final report with accumulated findings...",
              });
            } else {
              // No new documents found, proceed to report
              await sendUpdate(writer, encoder, {
                type: "LOG",
                stage: "FETCHING_DOCUMENTS",
                message:
                  "Auto mode: No additional documents found. Proceeding to report generation.",
              });
              currentStage = "GENERATING_REPORT";
            }
          } catch (autoModeError: unknown) {
            const errorMessage =
              autoModeError instanceof Error
                ? autoModeError.message
                : String(autoModeError);
            console.error("Auto mode execution error:", autoModeError);
            await sendUpdate(writer, encoder, {
              type: "ERROR",
              stage: currentStage,
              message: `Auto mode error: ${errorMessage}. Falling back to manual review.`,
            });

            currentStage = "HUMAN_REVIEW_REQUESTED";
            await sendUpdate(writer, encoder, {
              type: "STATUS_CHANGE",
              stage: currentStage,
              message: `Auto mode failed. Manual review required: ${assessment.assessment_summary}`,
            });
            await closeStream();
            return;
          }
        } else {
          // Manual review required or auto mode disabled
          currentStage =
            assessment.next_action === "REQUEST_HUMAN_REVIEW"
              ? "HUMAN_REVIEW_REQUESTED"
              : "ITERATION_PAUSED";
          await sendUpdate(writer, encoder, {
            type: "STATUS_CHANGE",
            stage: currentStage,
            message: autoModeConfig?.isEnabled
              ? `Auto mode: Max iterations (${autoModeConfig.maxIterations}) reached. Manual review required.`
              : `Research paused. Suggested next action: ${assessment.next_action}. Summary: ${assessment.assessment_summary}`,
          });
          await closeStream();
          return;
        }
      }

      // --- Stage 6: Generate Final Report ---
      if (synthesis) {
        currentStage = "GENERATING_REPORT";
        await sendUpdate(writer, encoder, {
          type: "STATUS_CHANGE",
          stage: currentStage,
          message: "Generating final legal report...",
        });

        if (timeoutController.signal.aborted) {
          throw new Error("Orchestrator timeout during report generation");
        }

        // Check if streaming is available for this function
        try {
          const reportStream = b.stream.GenerateFinalLegalReport(
            legalQuestion,
            synthesis,
            [queryAnalysis]
          );

          let finalReportAccumulator: Record<string, unknown> = {};

          for await (const partialReport of reportStream) {
            finalReportAccumulator = {
              ...finalReportAccumulator,
              ...partialReport,
            };

            // Handle streaming executive summary
            if (partialReport.executive_summary) {
              await sendUpdate(writer, encoder, {
                type: "DATA",
                stage: currentStage,
                data: {
                  report_title:
                    finalReportAccumulator.report_title ||
                    partialReport.report_title,
                  executive_summary_chunk: partialReport.executive_summary,
                },
                message: "Streaming executive summary...",
                fieldName: "executiveSummary",
                isFieldComplete: false, // Will be marked complete later
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
                      },
                    },
                    message: `Streaming content for section: ${section.section_title}`,
                    fieldName: `section_${index}_content`,
                    isFieldComplete: false,
                  });
                }
              });
            }

            // Handle streaming conclusion
            if (partialReport.conclusion) {
              await sendUpdate(writer, encoder, {
                type: "DATA",
                stage: currentStage,
                data: {
                  conclusion_chunk: partialReport.conclusion,
                },
                message: "Streaming conclusion...",
                fieldName: "conclusion",
                isFieldComplete: false,
              });
            }
          }

          const finalReportObject: FinalLegalReport =
            await reportStream.getFinalResponse();

          // Send final complete report
          await sendUpdate(writer, encoder, {
            type: "DATA",
            stage: currentStage,
            data: {
              title: finalReportObject.report_title,
              executiveSummary: finalReportObject.executive_summary,
              sections: finalReportObject.sections.map((s) => ({
                title: s.section_title,
                content: s.content,
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
          console.log(
            "Streaming failed, falling back to regular generation:",
            streamError
          );
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
              sections: finalReport.sections.map((s) => ({
                title: s.section_title,
                content: s.content,
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
        message: "Research process successfully completed.",
      });
    } catch (error: unknown) {
      console.error(`Error during orchestrator stage ${currentStage}:`, error);

      // Check if this was a timeout error
      const isTimeoutError =
        error instanceof Error && error.message.includes("timeout");
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown orchestrator error occurred.";

      await sendUpdate(writer, encoder, {
        type: "ERROR",
        stage: currentStage,
        message: isTimeoutError
          ? `${errorMessage} The operation took longer than expected. Please try again or use a simpler query.`
          : errorMessage,
      });
    } finally {
      // Clear the timeout
      clearTimeout(timeoutId);
      await closeStream();
    }
  })();

  return stream;
}
