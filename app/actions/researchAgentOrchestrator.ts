"use server";

import type { partial_types } from "@/baml_client";
import { b } from "@/baml_client";
import type {
  AnalyzedDocument,
  FinalLegalReport,
  LegalQueryAnalysis,
  OverallSynthesis,
  ResearchAssessment,
  SearchQueryItem,
  SearchResultItem,
} from "@/baml_client/types";

// Extended SearchResultItem with ordering metadata
interface OrderedSearchResultItem extends SearchResultItem {
  globalSequenceNumber: number; // Unique across entire research session
  iterationIndex: number; // Which research iteration
  fetchBatchIndex: number; // Which query batch within iteration
  fetchOrderIndex: number; // Order within the batch
  searchQueryId: string; // Which query produced this result
  fetchTimestamp: string; // ISO timestamp for debugging
}

import type { BamlStream } from "@boundaryml/baml";
import { config } from "@/lib/config";
import {
  ExaAuthError,
  ExaClientError,
  ExaConfigError,
  ExaNetworkError,
  ExaRateLimitError,
  ExaServerError,
} from "@/lib/utils/exaSearchErrors";
import { executeExaSearch } from "@/lib/utils/exaSearchUtil";
import {
  smartTruncate,
  truncateForBrief,
  truncateForReasoning,
  truncateForSummary,
  truncateForTitle,
} from "@/lib/utils/textTruncation";

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
  // Enhanced status indicator metadata
  progress?: number; // 0-100 percentage for progress bars
  estimatedTime?: string; // Human-readable estimated completion time
  stageProgress?: {
    current: number;
    total: number;
    percentage: number;
    estimatedTimeRemaining?: string;
  };
  // Document-level action handlers
  documentActions?: {
    docId: string;
    canRetry?: boolean;
    canSkip?: boolean;
    retryReason?: string;
    skipReason?: string;
  };
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

// Progress calculation utilities
function calculateProgress(current: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.min(100, Math.round((current / total) * 100));
}

function estimateTimeRemaining(
  current: number,
  total: number,
  startTime: number
): string {
  if (current === 0 || total === 0) {
    return "";
  }

  const elapsed = Date.now() - startTime;
  const averageTimePerItem = elapsed / current;
  const remaining = (total - current) * averageTimePerItem;

  const remainingMinutes = Math.ceil(remaining / (1000 * 60));

  if (remainingMinutes < 1) {
    return "~30 seconds remaining";
  }
  if (remainingMinutes === 1) {
    return "~1 minute remaining";
  }
  if (remainingMinutes <= 5) {
    return `~${remainingMinutes} minutes remaining`;
  }
  if (remainingMinutes <= 10) {
    return "~10 minutes remaining";
  }
  return `~${Math.ceil(remainingMinutes / 5) * 5} minutes remaining`;
}

function createStageProgress(
  current: number,
  total: number,
  startTime?: number
): ResearchUpdate["stageProgress"] {
  const percentage = calculateProgress(current, total);
  const timeRemaining = startTime
    ? estimateTimeRemaining(current, total, startTime)
    : undefined;

  return {
    current,
    total,
    percentage,
    ...(timeRemaining && { estimatedTimeRemaining: timeRemaining }),
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
/**
 * Enhanced error handling with circuit breaker recovery feedback
 * Streams error recovery information to the client
 */
async function handleSearchErrorWithRecovery(
  searchError: unknown,
  query: SearchQueryItem,
  context: StageContext
): Promise<void> {
  const errorMessage =
    searchError instanceof Error ? searchError.message : String(searchError);

  console.error(
    `Orchestrator: Search error for query "${query.query_string}":`,
    errorMessage
  );

  // Determine error type and provide specific feedback
  let errorType = "unknown";
  let userMessage = "Search encountered an error";
  let recoveryHint = "";

  if (searchError instanceof ExaRateLimitError) {
    errorType = "rate_limit";
    userMessage =
      "Search rate limit reached - automatic retry with backoff applied";
    recoveryHint = "The system will retry with reduced query load";
  } else if (searchError instanceof ExaNetworkError) {
    errorType = "network";
    userMessage = "Network connectivity issue - attempting recovery strategies";
    recoveryHint = "Trying cached results or partial data recovery";
  } else if (searchError instanceof ExaAuthError) {
    errorType = "authentication";
    userMessage = "API authentication issue detected";
    recoveryHint = "Please check API key configuration";
  } else if (searchError instanceof ExaServerError) {
    errorType = "server";
    userMessage =
      "Search service temporarily unavailable - applying recovery strategies";
    recoveryHint = "Retrying with exponential backoff";
  } else if (searchError instanceof ExaClientError) {
    errorType = "client";
    userMessage =
      "Search query formatting issue - attempting automatic correction";
    recoveryHint = "Query may be simplified for compatibility";
  }

  // Stream error recovery information to client
  await sendUpdate(context.writer, context.encoder, {
    type: "LOG",
    stage: "FETCHING_DOCUMENTS",
    message: `Search Error Recovery: ${userMessage}`,
    data: {
      errorType,
      query: query.query_string,
      recoveryHint,
      timestamp: new Date().toISOString(),
    },
  });

  // For critical errors, provide additional guidance
  if (
    searchError instanceof ExaAuthError ||
    searchError instanceof ExaConfigError
  ) {
    await sendUpdate(context.writer, context.encoder, {
      type: "ERROR",
      stage: "FETCHING_DOCUMENTS",
      message: "Critical configuration error - please check API settings",
      data: {
        errorType: "configuration",
        requiresUserAction: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Determines if an error should stop the entire search process
 */
function shouldStopOnError(searchError: unknown): boolean {
  // Stop on critical configuration errors
  if (
    searchError instanceof ExaAuthError ||
    searchError instanceof ExaConfigError
  ) {
    return true;
  }

  // Stop if we've hit terminal rate limits (circuit breaker will handle retryable ones)
  if (searchError instanceof ExaRateLimitError) {
    // Only stop if it's a quota/terminal limit, not a temporary rate limit
    return searchError.rateLimitType === "quota";
  }

  // Continue for other error types - circuit breaker handles recovery
  return false;
}

async function fetchDocumentsFromQueries(
  queries: SearchQueryItem[],
  context: StageContext
): Promise<OrderedSearchResultItem[]> {
  // Use configuration values instead of magic numbers
  const MAX_QUERIES_TO_EXECUTE = config.research.maxQueriesPerIteration;
  const RESULTS_PER_QUERY = config.research.maxDocumentsPerQuery;
  const allFetchedResults: OrderedSearchResultItem[] = [];

  console.log(
    `Orchestrator: Starting live document fetch for ${queries.length} queries (max: ${MAX_QUERIES_TO_EXECUTE}, results per query: ${RESULTS_PER_QUERY})`
  );

  const executedQueries = queries.slice(0, MAX_QUERIES_TO_EXECUTE);

  for (let queryIndex = 0; queryIndex < executedQueries.length; queryIndex++) {
    const query = executedQueries[queryIndex];
    if (!query) {
      continue;
    }

    try {
      console.log(
        `Orchestrator: Executing live search for query: "${query.query_string}"`
      );
      const results = await executeExaSearch(
        query,
        RESULTS_PER_QUERY,
        true,
        config.research.maxRetries
      );

      // Guard against executeExaSearch returning undefined (should never happen but adds safety)
      if (!results || !Array.isArray(results)) {
        console.error(
          `Orchestrator: executeExaSearch returned invalid results for query "${query.query_string}":`,
          results
        );
        continue;
      }

      // Enrich results with ordering metadata
      const enrichedResults: OrderedSearchResultItem[] = results.map(
        (result, resultIndex) => ({
          ...result,
          globalSequenceNumber: context.globalDocumentCounter.value++,
          iterationIndex: context.currentIteration,
          fetchBatchIndex: queryIndex,
          fetchOrderIndex: resultIndex,
          searchQueryId: query.query_string,
          fetchTimestamp: new Date().toISOString(),
        })
      );

      allFetchedResults.push(...enrichedResults);
      console.log(
        `Orchestrator: Query "${query.query_string}" yielded ${results.length} results.`
      );
    } catch (searchError: unknown) {
      // Enhanced error handling with circuit breaker feedback
      await handleSearchErrorWithRecovery(searchError, query, context);

      // Determine if we should continue with remaining queries
      if (shouldStopOnError(searchError)) {
        console.warn(
          "Orchestrator: Critical error encountered. Stopping remaining search queries for this session."
        );
        break;
      }

      // For non-critical errors, continue with remaining queries
      // The circuit breaker in executeExaSearch already handled recovery attempts
    }
  }

  // De-duplicate results based on URL (which is used as the ID)
  // When duplicates are found, keep the one with the lower globalSequenceNumber (first occurrence)
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

interface StageContext {
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
  timeoutController: AbortController;
  legalQuestion: string;
  previouslyAnalyzedDocs: Array<{
    docId: string;
    title?: string;
    url?: string;
    timestamp?: string;
    status: string;
  }>;
  globalDocumentCounter: { value: number }; // Mutable counter for sequence numbers
  currentIteration: number; // Current research iteration index
  // Enhanced progress tracking
  stageStartTimes: Map<ResearchStage, number>; // Track when each stage starts
  documentStartTimes: Map<string, number>; // Track when each document analysis starts
}

async function generateQueriesStage(
  context: StageContext
): Promise<LegalQueryAnalysis> {
  const { writer, encoder, timeoutController, legalQuestion } = context;

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "GENERATING_QUERIES",
    message: "Generating initial search queries...",
  });

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during query generation");
  }

  try {
    // Use streaming BAML call
    const queryAnalysisStream =
      b.stream.GenerateLegalSearchQueries(legalQuestion);

    // Process the stream of partial results
    for await (const partialQueryAnalysis of queryAnalysisStream) {
      if (partialQueryAnalysis && typeof partialQueryAnalysis === "object") {
        // Send partial updates to client
        await sendUpdate(writer, encoder, {
          type: "DATA",
          stage: "GENERATING_QUERIES",
          data: {
            reasoning: partialQueryAnalysis.reasoning,
            queries:
              partialQueryAnalysis.search_queries?.map((q) => ({
                query_string: q?.query_string || "",
                expected_information_summary: q?.expected_information
                  ? smartTruncate(q.expected_information.join(" "), 100)
                  : "",
              })) || [],
          },
          message: "Streaming query generation...",
          isFieldComplete: false,
        });
      }
    }

    // Get the final, validated object for the next pipeline stage
    const finalQueryAnalysis = await queryAnalysisStream.getFinalResponse();

    await sendUpdate(writer, encoder, {
      type: "DATA",
      stage: "GENERATING_QUERIES",
      data: {
        queries: finalQueryAnalysis.search_queries.map((q) => ({
          query_string: q.query_string,
          expected_information_summary: smartTruncate(
            q.expected_information.join(" "),
            100
          ),
        })),
        reasoningEntryPoints: {
          analyzeLegalQuestionSummary: smartTruncate(
            finalQueryAnalysis.reasoning.analyze_legal_question.summary || "",
            150
          ),
          totalStepsAnalyzed: 5,
        },
      },
      message: `${finalQueryAnalysis.search_queries.length} initial queries generated.`,
      isFinalForStage: true,
      isFieldComplete: true,
    });

    return finalQueryAnalysis;
  } catch (streamError) {
    // Fallback to non-streaming call if streaming fails
    console.warn(
      "Streaming failed for query generation, falling back to non-streaming:",
      streamError
    );

    const queryAnalysis = await b.GenerateLegalSearchQueries(legalQuestion);

    await sendUpdate(writer, encoder, {
      type: "DATA",
      stage: "GENERATING_QUERIES",
      data: {
        queries: queryAnalysis.search_queries.map((q) => ({
          query_string: q.query_string,
          expected_information_summary: smartTruncate(
            q.expected_information.join(" "),
            100
          ),
        })),
        reasoningEntryPoints: {
          analyzeLegalQuestionSummary: smartTruncate(
            queryAnalysis.reasoning.analyze_legal_question.summary || "",
            150
          ),
          totalStepsAnalyzed: 5,
        },
      },
      message: `${queryAnalysis.search_queries.length} initial queries generated.`,
      isFinalForStage: true,
    });

    return queryAnalysis;
  }
}

async function fetchDocumentsStage(
  context: StageContext,
  queries: SearchQueryItem[]
): Promise<OrderedSearchResultItem[]> {
  const { writer, encoder, timeoutController } = context;

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "FETCHING_DOCUMENTS",
    message: "Retrieving documents from live search APIs...",
  });

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during document fetching");
  }

  try {
    const searchResultItems = await fetchDocumentsFromQueries(queries, context);

    if (searchResultItems.length === 0) {
      await sendUpdate(writer, encoder, {
        type: "ERROR",
        stage: "FETCHING_DOCUMENTS",
        message: "No documents found for any of the executed search queries.",
        isFinalForStage: true,
      });
      throw new Error("No documents found");
    }

    // Send individual document updates as they are fetched
    for (let i = 0; i < searchResultItems.length; i++) {
      const item = searchResultItems[i];
      if (!item) {
        continue;
      }

      const timestamp = new Date().toISOString();

      await sendUpdate(writer, encoder, {
        type: "DATA",
        stage: "FETCHING_DOCUMENTS",
        message: `Document ${i + 1}/${searchResultItems.length} retrieved: ${item.title ? truncateForBrief(item.title) : "Untitled"}`,
        data: {
          docId: item.id,
          title: item.title,
          url: item.url,
          source: item.source_name,
          status: "fetched",
          timestamp,
          globalSequenceNumber: item.globalSequenceNumber,
          iterationIndex: item.iterationIndex,
          fetchBatchIndex: item.fetchBatchIndex,
          fetchOrderIndex: item.fetchOrderIndex,
          searchQueryId: item.searchQueryId,
          fetchTimestamp: item.fetchTimestamp,
        },
        currentProcessedDoc: i + 1,
        totalDocsToProcess: searchResultItems.length,
      });
    }

    // Send final summary update for backward compatibility
    await sendUpdate(writer, encoder, {
      type: "DATA",
      stage: "FETCHING_DOCUMENTS",
      data: {
        count: searchResultItems.length,
        titles: searchResultItems.map((r) =>
          r.title ? truncateForTitle(r.title) : "Untitled"
        ),
        sources: searchResultItems.map((r) => r.source_name),
      },
      message: `${searchResultItems.length} unique documents retrieved.`,
      isFinalForStage: true,
    });

    return searchResultItems;
  } catch (searchError: unknown) {
    const errorMessage =
      searchError instanceof Error ? searchError.message : String(searchError);
    await sendUpdate(writer, encoder, {
      type: "ERROR",
      stage: "FETCHING_DOCUMENTS",
      message: `Failed to retrieve documents: ${errorMessage}`,
    });
    throw searchError;
  }
}

async function sendAnalysisProgressUpdate(
  context: StageContext,
  doc: SearchResultItem,
  index: number,
  totalCount: number
): Promise<void> {
  const analyzeStageStartTime = context.stageStartTimes.get(
    "ANALYZING_DOCUMENTS"
  );
  const progress = calculateProgress(index, totalCount);
  const stageProgress = createStageProgress(
    index,
    totalCount,
    analyzeStageStartTime
  );

  const updateData: ResearchUpdate = {
    type: "PROGRESS",
    stage: "ANALYZING_DOCUMENTS",
    message: `Analyzing document ${index + 1}/${totalCount}: ${doc.title ? truncateForBrief(doc.title) : "Untitled"}`,
    currentProcessedDoc: index,
    totalDocsToProcess: totalCount,
    progress,
  };

  if (stageProgress?.estimatedTimeRemaining) {
    updateData.estimatedTime = stageProgress.estimatedTimeRemaining;
  }

  if (stageProgress) {
    updateData.stageProgress = stageProgress;
  }

  await sendUpdate(context.writer, context.encoder, updateData);
}

async function sendAnalysisStartUpdate(
  context: StageContext,
  doc: SearchResultItem
): Promise<void> {
  // Track when this document analysis starts
  const startTime = Date.now();
  context.documentStartTimes.set(doc.id, startTime);

  await sendUpdate(context.writer, context.encoder, {
    type: "DATA",
    stage: "ANALYZING_DOCUMENTS",
    data: {
      docId: doc.id,
      title: doc.title,
      url: doc.url,
      status: "analyzing",
      progress: 0, // Just starting
      estimatedTime: "Analyzing...",
    },
    message: `Started analysis for: ${doc.title ? truncateForBrief(doc.title) : "Untitled"}`,
  });
}

async function sendAnalysisSuccessUpdate(
  context: StageContext,
  doc: SearchResultItem,
  analysis: AnalyzedDocument,
  index: number,
  totalCount: number
): Promise<void> {
  await sendUpdate(context.writer, context.encoder, {
    type: "DATA",
    stage: "ANALYZING_DOCUMENTS",
    data: {
      docId: doc.id,
      title: doc.title,
      url: doc.url,
      status: "analyzed",
      relevanceScore: analysis.relevance_score,
      confidenceScore: analysis.confidence_score,
      summarySnippet: truncateForSummary(analysis.summary),
      keyArguments: analysis.key_arguments_and_reasoning,
      extractedEntities:
        analysis.extracted_entities?.map((entity) => ({
          name: entity.name,
          type: entity.type,
          details: entity.details,
        })) || [],
      extractedQuotes: analysis.extracted_quotes || [],
      fullText: smartTruncate(doc.full_text || "", 5000),
      counterArguments: analysis.counter_arguments_or_nuances || [],
      analysisReasoning: {
        analyzeLegalQuestionSummary: truncateForReasoning(
          analysis.reasoning?.analyze_legal_question?.summary || ""
        ),
        considerRelevantPrinciplesSummary: truncateForReasoning(
          analysis.reasoning?.consider_relevant_legal_principles?.summary || ""
        ),
      },
    },
    message: `Analysis complete for: ${doc.title ? truncateForBrief(doc.title) : "Untitled"}. Relevance: ${analysis.relevance_score}/10`,
    currentProcessedDoc: index + 1,
    totalDocsToProcess: totalCount,
  });
}

async function sendAnalysisErrorUpdate(
  context: StageContext,
  doc: SearchResultItem,
  errorMessage: string,
  index: number,
  totalCount: number
): Promise<void> {
  await sendUpdate(context.writer, context.encoder, {
    type: "DATA",
    stage: "ANALYZING_DOCUMENTS",
    data: {
      docId: doc.id,
      title: doc.title,
      url: doc.url,
      status: "failed",
      errorMessage: `Analysis failed: ${errorMessage}`,
    },
    message: `Failed to analyze: ${doc.title ? truncateForBrief(doc.title) : "Untitled"}. Error: ${errorMessage}`,
    currentProcessedDoc: index + 1,
    totalDocsToProcess: totalCount,
    // Include document-specific action handlers
    documentActions: {
      docId: doc.id,
      canRetry: true,
      canSkip: true,
      retryReason: "Retry document analysis with fresh API call",
      skipReason: "Skip this document and continue with next",
    },
  });

  await sendUpdate(context.writer, context.encoder, {
    type: "LOG",
    stage: "ANALYZING_DOCUMENTS",
    message: `Document analysis failed - user can retry or skip: ${errorMessage}`,
  });
}

async function processDocument(
  context: StageContext,
  doc: SearchResultItem,
  index: number,
  totalCount: number
): Promise<AnalyzedDocument | null> {
  if (context.timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during document analysis iteration");
  }

  await sendAnalysisProgressUpdate(context, doc, index, totalCount);
  await sendAnalysisStartUpdate(context, doc);

  try {
    // Use streaming BAML call
    const analysisStream = b.stream.AnalyzeSingleDocument(
      doc,
      context.legalQuestion
    );

    // Process the stream of partial results
    for await (const partialAnalysis of analysisStream) {
      if (partialAnalysis && typeof partialAnalysis === "object") {
        // Create a DATA update for the client with the partial, streaming data
        await sendUpdate(context.writer, context.encoder, {
          type: "DATA",
          stage: "ANALYZING_DOCUMENTS",
          data: {
            docId: doc.id,
            title: doc.title,
            url: doc.url,
            status: "streaming",
            // Merge partial data with document info
            summary: partialAnalysis.summary || "",
            relevanceScore: partialAnalysis.relevance_score,
            confidenceScore: partialAnalysis.confidence_score,
            keyArguments: partialAnalysis.key_arguments_and_reasoning || [],
            extractedEntities:
              partialAnalysis.extracted_entities?.map((entity) => ({
                name: entity.name,
                type: entity.type,
                details: entity.details,
              })) || [],
            extractedQuotes: partialAnalysis.extracted_quotes || [],
            counterArguments:
              partialAnalysis.counter_arguments_or_nuances || [],
          },
          message: `Analyzing document: ${doc.title ? truncateForBrief(doc.title) : "Untitled"}`,
          currentProcessedDoc: index + 1,
          totalDocsToProcess: totalCount,
          isFieldComplete: false,
        });
      }
    }

    // Get the final, validated object for the next pipeline stage
    const finalAnalysis = await analysisStream.getFinalResponse();

    await sendAnalysisSuccessUpdate(
      context,
      doc,
      finalAnalysis,
      index,
      totalCount
    );
    return finalAnalysis;
  } catch (analysisError: unknown) {
    // Fallback to non-streaming call if streaming fails
    console.warn(
      "Streaming failed for document analysis, falling back to non-streaming:",
      analysisError
    );

    try {
      const analysis: AnalyzedDocument = await b.AnalyzeSingleDocument(
        doc,
        context.legalQuestion
      );

      await sendAnalysisSuccessUpdate(
        context,
        doc,
        analysis,
        index,
        totalCount
      );
      return analysis;
    } catch (fallbackError: unknown) {
      const errorMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError);

      await sendAnalysisErrorUpdate(
        context,
        doc,
        errorMessage,
        index,
        totalCount
      );
      return null;
    }
  }
}

async function analyzeDocumentsStage(
  context: StageContext,
  searchResultItems: OrderedSearchResultItem[]
): Promise<AnalyzedDocument[]> {
  const { writer, encoder, timeoutController, previouslyAnalyzedDocs } =
    context;

  // Track stage start time for progress estimation
  context.stageStartTimes.set("ANALYZING_DOCUMENTS", Date.now());

  // Filter out documents that have already been analyzed
  const alreadyAnalyzedDocIds = new Set(
    previouslyAnalyzedDocs
      .filter((doc) => doc.status === "analyzed")
      .map((doc) => doc.docId)
  );

  const documentsToAnalyze = searchResultItems.filter(
    (doc) => !alreadyAnalyzedDocIds.has(doc.id)
  );

  // Sort documents by the order they appear in searchResultItems (which maintains fetch order)
  // This ensures analysis happens in the same order as documents appear in the UI
  const sortedDocumentsToAnalyze = [...documentsToAnalyze].sort((a, b) => {
    const aIndex = searchResultItems.findIndex((item) => item.id === a.id);
    const bIndex = searchResultItems.findIndex((item) => item.id === b.id);
    return aIndex - bIndex; // Maintain original fetch order
  });

  console.log(
    `Orchestrator: Document analysis stage - Total fetched: ${searchResultItems.length}, Already analyzed: ${alreadyAnalyzedDocIds.size}, To analyze: ${documentsToAnalyze.length}`
  );

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "ANALYZING_DOCUMENTS",
    message:
      documentsToAnalyze.length === 0
        ? "All documents have already been analyzed."
        : `Starting analysis of ${documentsToAnalyze.length} new documents (${alreadyAnalyzedDocIds.size} already analyzed)...`,
    totalDocsToProcess: documentsToAnalyze.length,
    currentProcessedDoc: 0,
  });

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during document analysis");
  }

  const analyzedDocs: AnalyzedDocument[] = [];

  // If no new documents to analyze, return empty array
  if (sortedDocumentsToAnalyze.length === 0) {
    await sendUpdate(writer, encoder, {
      type: "LOG",
      stage: "ANALYZING_DOCUMENTS",
      message: "No new documents to analyze.",
      isFinalForStage: true,
      totalDocsToProcess: 0,
      currentProcessedDoc: 0,
    });
    return analyzedDocs;
  }

  for (let i = 0; i < sortedDocumentsToAnalyze.length; i++) {
    const doc = sortedDocumentsToAnalyze[i];
    if (!doc) {
      continue;
    }

    console.log(
      `Orchestrator: Analyzing document ${i + 1}/${sortedDocumentsToAnalyze.length}: ${doc.title || "Untitled"} (ID: ${doc.id})`
    );

    const analysis = await processDocument(
      context,
      doc,
      i,
      sortedDocumentsToAnalyze.length
    );
    if (analysis) {
      analyzedDocs.push(analysis);
      console.log(
        `Orchestrator: Successfully analyzed document: ${doc.title || "Untitled"}`
      );
    } else {
      console.log(
        `Orchestrator: Failed to analyze document: ${doc.title || "Untitled"}`
      );
    }
  }

  await sendUpdate(writer, encoder, {
    type: "LOG",
    stage: "ANALYZING_DOCUMENTS",
    message: "All new documents analyzed.",
    isFinalForStage: true,
    totalDocsToProcess: sortedDocumentsToAnalyze.length,
    currentProcessedDoc: sortedDocumentsToAnalyze.length,
  });

  return analyzedDocs;
}

async function synthesizeFindingsStage(
  context: StageContext,
  analyzedDocs: AnalyzedDocument[]
): Promise<OverallSynthesis> {
  const { writer, encoder, timeoutController, legalQuestion } = context;

  if (analyzedDocs.length === 0) {
    await sendUpdate(writer, encoder, {
      type: "ERROR",
      stage: "SYNTHESIZING_FINDINGS",
      message: "Cannot synthesize findings - no documents were analyzed.",
      isFinalForStage: true,
    });
    throw new Error("No analyzed documents for synthesis");
  }

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "SYNTHESIZING_FINDINGS",
    message: "Synthesizing findings from analyzed documents...",
  });

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during findings synthesis");
  }

  try {
    // Use streaming BAML call
    const synthesisStream = b.stream.SynthesizeAllFindings(
      analyzedDocs,
      legalQuestion
    );

    // Process the stream of partial results
    for await (const partialSynthesis of synthesisStream) {
      if (partialSynthesis && typeof partialSynthesis === "object") {
        // Send partial updates to client
        await sendUpdate(writer, encoder, {
          type: "DATA",
          stage: "SYNTHESIZING_FINDINGS",
          data: {
            topics:
              partialSynthesis.key_synthesized_topics?.map((t) => ({
                title: t?.topic_title || "",
                synthesisSnippet:
                  t?.synthesis &&
                  typeof t.synthesis === "object" &&
                  "value" in t.synthesis &&
                  t.synthesis.value
                    ? smartTruncate(t.synthesis.value, 250)
                    : t?.synthesis && typeof t.synthesis === "string"
                      ? smartTruncate(t.synthesis, 250)
                      : "",
                confidence: t?.confidence_score,
                docIds: t?.supporting_document_ids || [],
              })) || [],
            unansweredAspects: partialSynthesis.unanswered_aspects || [],
            emergingQuestions: partialSynthesis.emerging_questions || [],
            reasoning: partialSynthesis.reasoning,
          },
          message: "Streaming synthesis...",
          isFieldComplete: false,
        });
      }
    }

    // Get the final, validated object for the next pipeline stage
    const finalSynthesis = await synthesisStream.getFinalResponse();

    await sendUpdate(writer, encoder, {
      type: "DATA",
      stage: "SYNTHESIZING_FINDINGS",
      data: {
        topics: finalSynthesis.key_synthesized_topics.map((t) => ({
          title: t.topic_title,
          synthesisSnippet: smartTruncate(t.synthesis, 250),
          confidence: t.confidence_score,
          docIds: t.supporting_document_ids,
        })),
        unansweredAspects: finalSynthesis.unanswered_aspects || [],
        emergingQuestions: finalSynthesis.emerging_questions || [],
        reasoningSummary: smartTruncate(
          finalSynthesis.reasoning.analyze_legal_question.summary || "",
          150
        ),
      },
      message: "Overall synthesis complete.",
      isFinalForStage: true,
      isFieldComplete: true,
    });

    return finalSynthesis;
  } catch (streamError) {
    // Fallback to non-streaming call if streaming fails
    console.warn(
      "Streaming failed for synthesis, falling back to non-streaming:",
      streamError
    );

    const synthesis = await b.SynthesizeAllFindings(
      analyzedDocs,
      legalQuestion
    );

    await sendUpdate(writer, encoder, {
      type: "DATA",
      stage: "SYNTHESIZING_FINDINGS",
      data: {
        topics: synthesis.key_synthesized_topics.map((t) => ({
          title: t.topic_title,
          synthesisSnippet: smartTruncate(t.synthesis, 250),
          confidence: t.confidence_score,
          docIds: t.supporting_document_ids,
        })),
        unansweredAspects: synthesis.unanswered_aspects || [],
        emergingQuestions: synthesis.emerging_questions || [],
        reasoningSummary: smartTruncate(
          synthesis.reasoning.analyze_legal_question.summary || "",
          150
        ),
      },
      message: "Overall synthesis complete.",
      isFinalForStage: true,
    });

    return synthesis;
  }
}

async function assessResearchStage(
  context: StageContext,
  queryAnalysis: LegalQueryAnalysis,
  synthesis: OverallSynthesis
): Promise<ResearchAssessment> {
  const { writer, encoder, timeoutController, legalQuestion } = context;

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "ASSESSING_RESEARCH",
    message: "Assessing research sufficiency and planning next steps...",
  });

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during research assessment");
  }

  try {
    // Use streaming BAML call
    const assessmentStream = b.stream.AssessResearchAndPlanNextSteps(
      legalQuestion,
      queryAnalysis,
      synthesis
    );

    // Process the stream of partial results
    for await (const partialAssessment of assessmentStream) {
      if (partialAssessment && typeof partialAssessment === "object") {
        // Send partial updates to client
        await sendUpdate(writer, encoder, {
          type: "DATA",
          stage: "ASSESSING_RESEARCH",
          data: {
            isSufficient: partialAssessment.is_sufficient,
            assessmentSummary: partialAssessment.assessment_summary || "",
            nextAction: partialAssessment.next_action,
            identifiedGaps: partialAssessment.identified_gaps || [],
            reasoning: partialAssessment.reasoning,
            suggestedRefinementQueries:
              partialAssessment.next_action === "REFINE_QUERIES" ||
              partialAssessment.next_action === "NEW_QUERIES"
                ? partialAssessment.suggested_queries_for_refinement?.map(
                    (q) => ({
                      query_string: q?.query_string || "",
                      expected_information_summary:
                        q?.expected_information?.join("; ") || undefined,
                    })
                  ) || []
                : undefined,
          },
          message: "Streaming assessment...",
          isFieldComplete: false,
        });
      }
    }

    // Get the final, validated object for the next pipeline stage
    const finalAssessment = await assessmentStream.getFinalResponse();

    await sendUpdate(writer, encoder, {
      type: "DATA",
      stage: "ASSESSING_RESEARCH",
      data: {
        isSufficient: finalAssessment.is_sufficient,
        assessmentSummary: finalAssessment.assessment_summary,
        nextAction: finalAssessment.next_action,
        identifiedGaps: finalAssessment.identified_gaps || [],
        suggestedRefinementQueries:
          finalAssessment.next_action === "REFINE_QUERIES" ||
          finalAssessment.next_action === "NEW_QUERIES"
            ? finalAssessment.suggested_queries_for_refinement?.map((q) => ({
                query_string: q.query_string,
                expected_information_summary:
                  q.expected_information?.join("; ") || undefined,
              })) || []
            : undefined,
      },
      message: `Assessment complete. Next action: ${finalAssessment.next_action}.`,
      isFinalForStage: true,
      isFieldComplete: true,
    });

    return finalAssessment;
  } catch (streamError) {
    // Fallback to non-streaming call if streaming fails
    console.warn(
      "Streaming failed for assessment, falling back to non-streaming:",
      streamError
    );

    const assessment = await b.AssessResearchAndPlanNextSteps(
      legalQuestion,
      queryAnalysis,
      synthesis
    );

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
            ? assessment.suggested_queries_for_refinement?.map((q) => ({
                query_string: q.query_string,
                expected_information_summary:
                  q.expected_information?.join("; ") || undefined,
              })) || []
            : undefined,
      },
      message: `Assessment complete. Next action: ${assessment.next_action}.`,
      isFinalForStage: true,
    });

    return assessment;
  }
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
    });
  }
}

async function handleSectionsStream(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  report: Record<string, unknown>
): Promise<void> {
  if (report.sections && Array.isArray(report.sections)) {
    (
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
        });
      }
    });
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
    });
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
      sections: finalReportObject.sections.map((s) => ({
        title: s.section_title,
        content: s.content,
      })),
      conclusion: finalReportObject.conclusion,
      limitations: finalReportObject.limitations_and_caveats || [],
      appendixDocIds: finalReportObject.appendix_document_ids || [],
    },
    message: "Final report completed.",
    isFinalForStage: true,
  });
}

async function handleStreamingReport(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  reportStream: BamlStream<partial_types.FinalLegalReport, FinalLegalReport>
): Promise<void> {
  let finalReportAccumulator: Record<string, unknown> = {};

  for await (const partialReport of reportStream) {
    if (partialReport && typeof partialReport === "object") {
      finalReportAccumulator = { ...finalReportAccumulator, ...partialReport };
      const report = partialReport as unknown as Record<string, unknown>;

      await handleExecutiveSummaryStream(
        writer,
        encoder,
        report,
        finalReportAccumulator
      );
      await handleSectionsStream(writer, encoder, report);
      await handleConclusionStream(writer, encoder, report);
    }
  }

  const finalReportObject: FinalLegalReport =
    await reportStream.getFinalResponse();
  await sendFinalReportUpdate(writer, encoder, finalReportObject);
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
  );

  await sendUpdate(writer, encoder, {
    type: "DATA",
    stage: "GENERATING_REPORT",
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

async function generateReportStage(
  context: StageContext,
  synthesis: OverallSynthesis,
  queryAnalysis: LegalQueryAnalysis
): Promise<void> {
  const { writer, encoder, timeoutController, legalQuestion } = context;

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "GENERATING_REPORT",
    message: "Generating final legal report...",
  });

  if (timeoutController.signal.aborted) {
    throw new Error("Orchestrator timeout during report generation");
  }

  try {
    const reportStream = b.stream.GenerateFinalLegalReport(
      legalQuestion,
      synthesis,
      [queryAnalysis]
    );
    await handleStreamingReport(writer, encoder, reportStream);
  } catch (streamError) {
    console.log(
      "Streaming failed, falling back to regular generation:",
      streamError
    );
    await handleNonStreamingReport(
      writer,
      encoder,
      legalQuestion,
      synthesis,
      queryAnalysis
    );
  }
}

async function executePipeline(
  context: StageContext,
  autoModeConfig?: AutoModeConfig
): Promise<void> {
  const { writer, encoder, legalQuestion } = context;

  // Handle empty legal question gracefully
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    await sendUpdate(writer, encoder, {
      type: "STATUS_CHANGE",
      stage: "COMPLETED",
      message: "Research process completed. No legal question provided.",
    });
    return;
  }

  let currentIteration = autoModeConfig?.currentIteration || 0;
  const maxIterations = autoModeConfig?.maxIterations || 5;

  // Update context with current iteration
  context.currentIteration = currentIteration;

  // Check if we've already reached max iterations before starting
  if (autoModeConfig?.isEnabled && currentIteration >= maxIterations) {
    await sendUpdate(writer, encoder, {
      type: "STATUS_CHANGE",
      stage: "ITERATION_PAUSED",
      message: `Auto mode: Max iterations (${maxIterations}) reached. Manual review required.`,
    });
    return;
  }

  const queryAnalysis = await generateQueriesStage(context);
  const searchResultItems = await fetchDocumentsStage(
    context,
    queryAnalysis.search_queries
  );
  const analyzedDocs = await analyzeDocumentsStage(context, searchResultItems);
  const synthesis = await synthesizeFindingsStage(context, analyzedDocs);
  const assessment = await assessResearchStage(
    context,
    queryAnalysis,
    synthesis
  );

  if (assessment.next_action === "GENERATE_REPORT") {
    await generateReportStage(context, synthesis, queryAnalysis);
  } else {
    // Increment iteration count after completing one iteration
    currentIteration += 1;
    context.currentIteration = currentIteration;

    // Check if we've reached max iterations after this iteration
    const hasReachedMaxIterations =
      autoModeConfig?.isEnabled && currentIteration >= maxIterations;

    const stage =
      assessment.next_action === "REQUEST_HUMAN_REVIEW"
        ? "HUMAN_REVIEW_REQUESTED"
        : "ITERATION_PAUSED";

    await sendUpdate(writer, encoder, {
      type: "STATUS_CHANGE",
      stage,
      message: autoModeConfig?.isEnabled
        ? hasReachedMaxIterations
          ? `Auto mode: Max iterations (${maxIterations}) reached. Manual review required.`
          : `Auto mode: Iteration ${currentIteration} of ${maxIterations} completed. Continuing research...`
        : `Research paused. Suggested next action: ${assessment.next_action}. Summary: ${assessment.assessment_summary}`,
    });

    // If we haven't reached max iterations and we're in auto mode, continue with next iteration
    if (autoModeConfig?.isEnabled && !hasReachedMaxIterations) {
      // Update the auto mode config with the new iteration count
      const updatedAutoModeConfig = {
        ...autoModeConfig,
        currentIteration,
      };

      // Recursively continue with the next iteration
      await executePipeline(context, updatedAutoModeConfig);
      return;
    }

    return;
  }

  await sendUpdate(writer, encoder, {
    type: "STATUS_CHANGE",
    stage: "COMPLETED",
    message: "Research process successfully completed.",
  });
}

export async function conductResearch(
  legalQuestion: string,
  autoModeConfig?: AutoModeConfig,
  previouslyAnalyzedDocs?: Array<{
    docId: string;
    title?: string;
    url?: string;
    timestamp?: string;
    status: string;
  }>
): Promise<ReadableStream<Uint8Array>> {
  const { stream, writer, encoder, closeStream } = createStream();

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    config.research.analysisTimeoutMs
  );

  const context: StageContext = {
    writer,
    encoder,
    timeoutController,
    legalQuestion,
    previouslyAnalyzedDocs: previouslyAnalyzedDocs || [],
    globalDocumentCounter: { value: 0 }, // Initialize counter at 0
    currentIteration: 0, // Start at iteration 0
    // Initialize timing maps for progress tracking
    stageStartTimes: new Map<ResearchStage, number>(),
    documentStartTimes: new Map<string, number>(),
  };
  (async () => {
    try {
      if (timeoutController.signal.aborted) {
        throw new Error(
          "Orchestrator timeout: Process exceeded maximum time limit"
        );
      }

      await sendUpdate(writer, encoder, {
        type: "STATUS_CHANGE",
        stage: "INITIALIZING",
        message: "Research process initializing...",
      });

      await executePipeline(context, autoModeConfig);
    } catch (error: unknown) {
      const isTimeoutError =
        error instanceof Error && error.message.includes("timeout");
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown orchestrator error occurred.";

      await sendUpdate(writer, encoder, {
        type: "ERROR",
        stage: "INITIALIZING",
        message: isTimeoutError
          ? `${errorMessage} The operation took longer than expected.`
          : errorMessage,
      });
    } finally {
      clearTimeout(timeoutId);
      await closeStream();
    }
  })();

  return stream;
}
