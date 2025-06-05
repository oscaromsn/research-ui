"use server"

import { b } from "@/baml_client"
import type { partial_types } from "@/baml_client"
import type {
  AnalyzedDocument,
  FinalLegalReport,
  LegalQueryAnalysis,
  OverallSynthesis,
  ResearchAssessment,
  SearchQueryItem,
  SearchResultItem,
} from "@/baml_client/types"
import { executeExaSearch } from "@/lib/utils/exaSearchUtil"
import type { BamlStream } from "@boundaryml/baml"

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
  | "ERROR"

// Stream communication protocol
export interface ResearchUpdate {
  type: "PROGRESS" | "DATA" | "ERROR" | "STATUS_CHANGE" | "LOG"
  stage: ResearchStage
  message?: string
  data?: unknown
  isFinalForStage?: boolean
  currentProcessedDoc?: number
  totalDocsToProcess?: number
  fieldName?: string
  isFieldComplete?: boolean
}

// Stream creation utility
function createStream(): {
  stream: ReadableStream<Uint8Array>
  writer: WritableStreamDefaultWriter<Uint8Array>
  encoder: TextEncoder
  closeStream: () => Promise<void>
} {
  const encoder = new TextEncoder()
  const transformStream = new TransformStream()
  const writer = transformStream.writable.getWriter()

  const closeStream = async () => {
    if (writer && !writer.closed) {
      try {
        await writer.close()
      } catch (e) {
        console.error("Error closing stream writer:", e)
      }
    }
  }

  return {
    stream: transformStream.readable,
    writer,
    encoder,
    closeStream,
  }
}

// Update streaming utility
async function sendUpdate(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  update: ResearchUpdate
): Promise<void> {
  try {
    const jsonString = JSON.stringify(update)
    await writer.write(encoder.encode(`${jsonString}\n`))
  } catch (e) {
    console.error("Stream write error in sendUpdate:", e, "Update:", update)
  }
}

// Live document fetching function using Exa API
async function fetchDocumentsFromQueries(
  queries: SearchQueryItem[]
): Promise<SearchResultItem[]> {
  const MAX_QUERIES_TO_EXECUTE = 3 // Start conservative for initial implementation
  const RESULTS_PER_QUERY = 2 // Limit results per query to manage API usage
  const allFetchedResults: SearchResultItem[] = []

  console.log(
    `Orchestrator: Starting live document fetch for ${queries.length} queries`
  )

  const executedQueries = queries.slice(0, MAX_QUERIES_TO_EXECUTE)

  for (const query of executedQueries) {
    try {
      console.log(
        `Orchestrator: Executing live search for query: "${query.query_string}"`
      )
      const results = await executeExaSearch(query, RESULTS_PER_QUERY, true, 2)

      // Guard against executeExaSearch returning undefined (should never happen but adds safety)
      if (!results || !Array.isArray(results)) {
        console.error(
          `Orchestrator: executeExaSearch returned invalid results for query "${query.query_string}":`,
          results
        )
        continue
      }

      allFetchedResults.push(...results)
      console.log(
        `Orchestrator: Query "${query.query_string}" yielded ${results.length} results.`
      )
    } catch (searchError: unknown) {
      const errorMessage =
        searchError instanceof Error ? searchError.message : String(searchError)
      console.error(
        `Orchestrator: Error during live search for query "${query.query_string}":`,
        errorMessage
      )

      // Handle rate limiting specifically - consider stopping further searches
      if (errorMessage.includes("Rate limit exceeded")) {
        console.warn(
          "Orchestrator: Rate limit reached for Exa API. Stopping further search queries for this session."
        )
        break // Stop executing more queries if we hit rate limits
      }

      // For other errors, continue with remaining queries
      // Individual query failures shouldn't halt the entire process
    }
  }

  // De-duplicate results based on URL (which is used as the ID)
  const uniqueDocIds = new Set<string>()
  const searchResultItems = allFetchedResults.filter(item => {
    if (!uniqueDocIds.has(item.id)) {
      uniqueDocIds.add(item.id)
      return true
    }
    return false
  })

  console.log(
    `Orchestrator: Total unique documents fetched: ${searchResultItems.length}`
  )
  return searchResultItems
}

// Auto mode configuration interface
interface AutoModeConfig {
  isEnabled: boolean
  maxIterations: number
  currentIteration: number
}

interface StageContext {
  writer: WritableStreamDefaultWriter<Uint8Array>
  encoder: TextEncoder
  timeoutController: AbortController
  legalQuestion: string
}

async function generateQueriesStage(
  context: StageContext
): Promise<LegalQueryAnalysis> {
  const { writer, encoder, timeoutController, legalQuestion } = context

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "GENERATING_QUERIES",
    message: "Generating initial search queries...",
  })

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during query generation")
  }

  const queryAnalysis = await b.GenerateLegalSearchQueries(legalQuestion)

  await sendUpdate(writer, encoder, {
    type: "DATA",
    stage: "GENERATING_QUERIES",
    data: {
      queries: queryAnalysis.search_queries.map(q => ({
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
  })

  return queryAnalysis
}

async function fetchDocumentsStage(
  context: StageContext,
  queries: SearchQueryItem[]
): Promise<SearchResultItem[]> {
  const { writer, encoder, timeoutController } = context

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "FETCHING_DOCUMENTS",
    message: "Retrieving documents from live search APIs...",
  })

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during document fetching")
  }

  try {
    const searchResultItems = await fetchDocumentsFromQueries(queries)

    if (searchResultItems.length === 0) {
      await sendUpdate(writer, encoder, {
        type: "ERROR",
        stage: "FETCHING_DOCUMENTS",
        message: "No documents found for any of the executed search queries.",
        isFinalForStage: true,
      })
      throw new Error("No documents found")
    }

    // Send individual document updates as they are fetched
    for (let i = 0; i < searchResultItems.length; i++) {
      const item = searchResultItems[i]
      if (!item) {
        continue
      }

      const timestamp = new Date().toISOString()

      await sendUpdate(writer, encoder, {
        type: "DATA",
        stage: "FETCHING_DOCUMENTS",
        message: `Document ${i + 1}/${searchResultItems.length} retrieved: ${item.title ? `${item.title.substring(0, 50)}...` : "Untitled"}`,
        data: {
          docId: item.id,
          title: item.title,
          url: item.url,
          source: item.source_name,
          status: "fetched",
          timestamp,
        },
        currentProcessedDoc: i + 1,
        totalDocsToProcess: searchResultItems.length,
      })
    }

    // Send final summary update for backward compatibility
    await sendUpdate(writer, encoder, {
      type: "DATA",
      stage: "FETCHING_DOCUMENTS",
      data: {
        count: searchResultItems.length,
        titles: searchResultItems.map(r =>
          r.title ? `${r.title.substring(0, 70)}...` : "Untitled"
        ),
        sources: searchResultItems.map(r => r.source_name),
      },
      message: `${searchResultItems.length} unique documents retrieved.`,
      isFinalForStage: true,
    })

    return searchResultItems
  } catch (searchError: unknown) {
    const errorMessage =
      searchError instanceof Error ? searchError.message : String(searchError)
    await sendUpdate(writer, encoder, {
      type: "ERROR",
      stage: "FETCHING_DOCUMENTS",
      message: `Failed to retrieve documents: ${errorMessage}`,
    })
    throw searchError
  }
}

async function analyzeDocumentsStage(
  context: StageContext,
  searchResultItems: SearchResultItem[]
): Promise<AnalyzedDocument[]> {
  const { writer, encoder, timeoutController, legalQuestion } = context

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "ANALYZING_DOCUMENTS",
    message: `Starting analysis of ${searchResultItems.length} documents...`,
    totalDocsToProcess: searchResultItems.length,
    currentProcessedDoc: 0,
  })

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during document analysis")
  }

  const analyzedDocs: AnalyzedDocument[] = []
  for (let i = 0; i < searchResultItems.length; i++) {
    if (timeoutController.signal.aborted) {
      throw new Error("Orchestrator timeout during document analysis iteration")
    }

    const doc = searchResultItems[i]
    if (!doc) {
      continue
    }

    await sendUpdate(writer, encoder, {
      type: "PROGRESS",
      stage: "ANALYZING_DOCUMENTS",
      message: `Analyzing document ${i + 1}/${searchResultItems.length}: ${doc.title ? `${doc.title.substring(0, 50)}...` : "Untitled"}`,
      currentProcessedDoc: i,
      totalDocsToProcess: searchResultItems.length,
    })

    // Update document status to "analyzing"
    await sendUpdate(writer, encoder, {
      type: "DATA",
      stage: "ANALYZING_DOCUMENTS",
      data: {
        docId: doc.id,
        title: doc.title,
        url: doc.url,
        status: "analyzing",
      },
      message: `Started analysis for: ${doc.title ? `${doc.title.substring(0, 50)}...` : "Untitled"}`,
    })

    try {
      const analysis: AnalyzedDocument = await b.AnalyzeSingleDocument(
        doc,
        legalQuestion
      )
      analyzedDocs.push(analysis)

      await sendUpdate(writer, encoder, {
        type: "DATA",
        stage: "ANALYZING_DOCUMENTS",
        data: {
          docId: doc.id,
          title: doc.title,
          url: doc.url,
          status: "analyzed",
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
          fullText: doc.full_text?.substring(0, 5000),
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
        message: `Analysis complete for: ${doc.title ? `${doc.title.substring(0, 50)}...` : "Untitled"}. Relevance: ${analysis.relevance_score}/10`,
        currentProcessedDoc: i + 1,
        totalDocsToProcess: searchResultItems.length,
      })
    } catch (analysisError: unknown) {
      const errorMessage =
        analysisError instanceof Error
          ? analysisError.message
          : String(analysisError)
      // Send error update for this specific document
      await sendUpdate(writer, encoder, {
        type: "DATA",
        stage: "ANALYZING_DOCUMENTS",
        data: {
          docId: doc.id,
          title: doc.title,
          url: doc.url,
          status: "error",
          errorMessage: `Analysis failed: ${errorMessage}`,
        },
        message: `Failed to analyze: ${doc.title ? `${doc.title.substring(0, 50)}...` : "Untitled"}. Error: ${errorMessage}`,
        currentProcessedDoc: i + 1,
        totalDocsToProcess: searchResultItems.length,
      })

      // Log the error but continue processing other documents
      await sendUpdate(writer, encoder, {
        type: "LOG",
        stage: "ANALYZING_DOCUMENTS",
        message: `Skipping document due to analysis error: ${errorMessage}`,
      })
    }
  }

  await sendUpdate(writer, encoder, {
    type: "LOG",
    stage: "ANALYZING_DOCUMENTS",
    message: "All documents analyzed.",
    isFinalForStage: true,
    totalDocsToProcess: searchResultItems.length,
    currentProcessedDoc: searchResultItems.length,
  })

  return analyzedDocs
}

async function synthesizeFindingsStage(
  context: StageContext,
  analyzedDocs: AnalyzedDocument[]
): Promise<OverallSynthesis> {
  const { writer, encoder, timeoutController, legalQuestion } = context

  if (analyzedDocs.length === 0) {
    await sendUpdate(writer, encoder, {
      type: "ERROR",
      stage: "SYNTHESIZING_FINDINGS",
      message: "Cannot synthesize findings - no documents were analyzed.",
      isFinalForStage: true,
    })
    throw new Error("No analyzed documents for synthesis")
  }

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "SYNTHESIZING_FINDINGS",
    message: "Synthesizing findings from analyzed documents...",
  })

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during findings synthesis")
  }

  const synthesis = await b.SynthesizeAllFindings(analyzedDocs, legalQuestion)

  await sendUpdate(writer, encoder, {
    type: "DATA",
    stage: "SYNTHESIZING_FINDINGS",
    data: {
      topics: synthesis.key_synthesized_topics.map(t => ({
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
  })

  return synthesis
}

async function assessResearchStage(
  context: StageContext,
  queryAnalysis: LegalQueryAnalysis,
  synthesis: OverallSynthesis
): Promise<ResearchAssessment> {
  const { writer, encoder, timeoutController, legalQuestion } = context

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "ASSESSING_RESEARCH",
    message: "Assessing research sufficiency and planning next steps...",
  })

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during research assessment")
  }

  const assessment = await b.AssessResearchAndPlanNextSteps(
    legalQuestion,
    queryAnalysis,
    synthesis
  )

  await sendUpdate(writer, encoder, {
    type: "DATA",
    stage: "ASSESSING_RESEARCH",
    data: {
      isSufficient: assessment.is_sufficient,
      assessmentSummary: assessment.assessment_summary,
      nextAction: assessment.next_action,
      identifiedGaps: assessment.identified_gaps || [],
      suggestedRefinementQueries:
        assessment.next_action === "REFINE_QUERIES" ||
        assessment.next_action === "NEW_QUERIES"
          ? assessment.suggested_queries_for_refinement?.map(
              q => q.query_string
            ) || []
          : undefined,
    },
    message: `Assessment complete. Next action: ${assessment.next_action}.`,
    isFinalForStage: true,
  })

  return assessment
}

async function handleExecutiveSummaryStream(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  report: Record<string, unknown>,
  finalReportAccumulator: Record<string, unknown>
): Promise<void> {
  if (report.executive_summary) {
    await sendUpdate(writer, encoder, {
      type: "DATA",
      stage: "GENERATING_REPORT",
      data: {
        report_title:
          finalReportAccumulator.report_title || report.report_title,
        executive_summary_chunk: report.executive_summary,
      },
      message: "Streaming executive summary...",
      fieldName: "executiveSummary",
      isFieldComplete: false,
    })
  }
}

async function handleSectionsStream(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  report: Record<string, unknown>
): Promise<void> {
  if (report.sections && Array.isArray(report.sections)) {
    ;(
      report.sections as Array<{ section_title: string; content: string }>
    ).forEach((section, index) => {
      if (section?.content) {
        sendUpdate(writer, encoder, {
          type: "DATA",
          stage: "GENERATING_REPORT",
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
        })
      }
    })
  }
}

async function handleConclusionStream(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  report: Record<string, unknown>
): Promise<void> {
  if (report.conclusion) {
    await sendUpdate(writer, encoder, {
      type: "DATA",
      stage: "GENERATING_REPORT",
      data: { conclusion_chunk: report.conclusion },
      message: "Streaming conclusion...",
      fieldName: "conclusion",
      isFieldComplete: false,
    })
  }
}

async function sendFinalReportUpdate(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  finalReportObject: FinalLegalReport
): Promise<void> {
  await sendUpdate(writer, encoder, {
    type: "DATA",
    stage: "GENERATING_REPORT",
    data: {
      title: finalReportObject.report_title,
      executiveSummary: finalReportObject.executive_summary,
      sections: finalReportObject.sections.map(s => ({
        title: s.section_title,
        content: s.content,
      })),
      conclusion: finalReportObject.conclusion,
      limitations: finalReportObject.limitations_and_caveats || [],
      appendixDocIds: finalReportObject.appendix_document_ids || [],
    },
    message: "Final report completed.",
    isFinalForStage: true,
  })
}

async function handleStreamingReport(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  reportStream: BamlStream<partial_types.FinalLegalReport, FinalLegalReport>
): Promise<void> {
  let finalReportAccumulator: Record<string, unknown> = {}

  for await (const partialReport of reportStream) {
    if (partialReport && typeof partialReport === "object") {
      finalReportAccumulator = { ...finalReportAccumulator, ...partialReport }
      const report = partialReport as unknown as Record<string, unknown>

      await handleExecutiveSummaryStream(
        writer,
        encoder,
        report,
        finalReportAccumulator
      )
      await handleSectionsStream(writer, encoder, report)
      await handleConclusionStream(writer, encoder, report)
    }
  }

  const finalReportObject: FinalLegalReport =
    await reportStream.getFinalResponse()
  await sendFinalReportUpdate(writer, encoder, finalReportObject)
}

async function handleNonStreamingReport(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  legalQuestion: string,
  synthesis: OverallSynthesis,
  queryAnalysis: LegalQueryAnalysis
): Promise<void> {
  const finalReport = await b.GenerateFinalLegalReport(
    legalQuestion,
    synthesis,
    [queryAnalysis]
  )

  await sendUpdate(writer, encoder, {
    type: "DATA",
    stage: "GENERATING_REPORT",
    data: {
      title: finalReport.report_title,
      executiveSummary: finalReport.executive_summary,
      sections: finalReport.sections.map(s => ({
        title: s.section_title,
        content: s.content,
      })),
      conclusion: finalReport.conclusion,
      limitations: finalReport.limitations_and_caveats || [],
      appendixDocIds: finalReport.appendix_document_ids || [],
    },
    message: "Final report generation complete (non-streaming).",
    isFinalForStage: true,
  })
}

async function generateReportStage(
  context: StageContext,
  synthesis: OverallSynthesis,
  queryAnalysis: LegalQueryAnalysis
): Promise<void> {
  const { writer, encoder, timeoutController, legalQuestion } = context

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "GENERATING_REPORT",
    message: "Generating final legal report...",
  })

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during report generation")
  }

  try {
    const reportStream = b.stream.GenerateFinalLegalReport(
      legalQuestion,
      synthesis,
      [queryAnalysis]
    )
    await handleStreamingReport(writer, encoder, reportStream)
  } catch (streamError) {
    console.log(
      "Streaming failed, falling back to regular generation:",
      streamError
    )
    await handleNonStreamingReport(
      writer,
      encoder,
      legalQuestion,
      synthesis,
      queryAnalysis
    )
  }
}

async function executePipeline(
  context: StageContext,
  autoModeConfig?: AutoModeConfig
): Promise<void> {
  const { writer, encoder, legalQuestion } = context

  // Handle empty legal question gracefully
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    await sendUpdate(writer, encoder, {
      type: "STATUS_CHANGE",
      stage: "COMPLETED",
      message: "Research process completed. No legal question provided.",
    })
    return
  }

  let currentIteration = autoModeConfig?.currentIteration || 0
  const maxIterations = autoModeConfig?.maxIterations || 5

  // Check if we've already reached max iterations before starting
  if (autoModeConfig?.isEnabled && currentIteration >= maxIterations) {
    await sendUpdate(writer, encoder, {
      type: "STATUS_CHANGE",
      stage: "ITERATION_PAUSED",
      message: `Auto mode: Max iterations (${maxIterations}) reached. Manual review required.`,
    })
    return
  }

  const queryAnalysis = await generateQueriesStage(context)
  const searchResultItems = await fetchDocumentsStage(
    context,
    queryAnalysis.search_queries
  )
  const analyzedDocs = await analyzeDocumentsStage(context, searchResultItems)
  const synthesis = await synthesizeFindingsStage(context, analyzedDocs)
  const assessment = await assessResearchStage(
    context,
    queryAnalysis,
    synthesis
  )

  if (assessment.next_action === "GENERATE_REPORT") {
    await generateReportStage(context, synthesis, queryAnalysis)
  } else {
    // Increment iteration count after completing one iteration
    currentIteration += 1

    // Check if we've reached max iterations after this iteration
    const hasReachedMaxIterations =
      autoModeConfig?.isEnabled && currentIteration >= maxIterations

    const stage =
      assessment.next_action === "REQUEST_HUMAN_REVIEW"
        ? "HUMAN_REVIEW_REQUESTED"
        : "ITERATION_PAUSED"

    await sendUpdate(writer, encoder, {
      type: "STATUS_CHANGE",
      stage,
      message: autoModeConfig?.isEnabled
        ? hasReachedMaxIterations
          ? `Auto mode: Max iterations (${maxIterations}) reached. Manual review required.`
          : `Auto mode: Iteration ${currentIteration} of ${maxIterations} completed. Continuing research...`
        : `Research paused. Suggested next action: ${assessment.next_action}. Summary: ${assessment.assessment_summary}`,
    })

    // If we haven't reached max iterations and we're in auto mode, continue with next iteration
    if (autoModeConfig?.isEnabled && !hasReachedMaxIterations) {
      // Update the auto mode config with the new iteration count
      const updatedAutoModeConfig = {
        ...autoModeConfig,
        currentIteration,
      }

      // Recursively continue with the next iteration
      await executePipeline(context, updatedAutoModeConfig)
      return
    }

    return
  }

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "COMPLETED",
    message: "Research process successfully completed.",
  })
}

export async function conductResearch(
  legalQuestion: string,
  autoModeConfig?: AutoModeConfig
): Promise<ReadableStream<Uint8Array>> {
  const { stream, writer, encoder, closeStream } = createStream()

  const ORCHESTRATOR_TIMEOUT_MS = 420000
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    ORCHESTRATOR_TIMEOUT_MS
  )

  const context: StageContext = {
    writer,
    encoder,
    timeoutController,
    legalQuestion,
  }
  ;(async () => {
    try {
      if (timeoutController.signal.aborted) {
        throw new Error(
          "Orchestrator timeout: Process exceeded maximum time limit"
        )
      }

      await sendUpdate(writer, encoder, {
        type: "STATUS_CHANGE",
        stage: "INITIALIZING",
        message: "Research process initializing...",
      })

      await executePipeline(context, autoModeConfig)
    } catch (error: unknown) {
      const isTimeoutError =
        error instanceof Error && error.message.includes("timeout")
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown orchestrator error occurred."

      await sendUpdate(writer, encoder, {
        type: "ERROR",
        stage: "INITIALIZING",
        message: isTimeoutError
          ? `${errorMessage} The operation took longer than expected.`
          : errorMessage,
      })
    } finally {
      clearTimeout(timeoutId)
      await closeStream()
    }
  })()

  return stream
}
