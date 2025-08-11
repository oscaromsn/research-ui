import { b } from "../../baml_client";
import type {
  AnalyzedDocument,
  FinalLegalReport,
  LegalQueryAnalysis,
  LegalReportSection,
  OverallSynthesis,
  ResearchAssessment,
  SearchResultItem,
} from "../../baml_client/types";
import { config } from "../config";
import { bamlCircuitBreaker } from "./circuitBreaker";

/**
 * Simple in-memory cache for BAML query results to avoid redundant API calls
 * Cache key format: `${functionName}:${JSON.stringify(params)}`
 * TTL: 5 minutes for query generation, 10 minutes for document analysis
 */
class BAMLResultCache {
  private cache = new Map<
    string,
    { result: any; timestamp: number; ttl: number }
  >();

  set(key: string, result: any, ttlMs = 300000): void {
    // 5 minute default TTL
    this.cache.set(key, { result, timestamp: Date.now(), ttl: ttlMs });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

const bamlCache = new BAMLResultCache();

// Cleanup expired cache entries every 2 minutes
setInterval(() => bamlCache.cleanup(), 120000);

/**
 * Pipeline Stages Implementation
 * Each stage is implemented as a pure function that can be tested in isolation
 */

/**
 * Utility function to extract value from BAML StreamState objects
 * Optimizes performance by reducing repetitive type checking
 */
function extractStreamValue<T>(
  streamState: T | { value: T; state: string } | undefined | null
): { value: T | null; isComplete: boolean } {
  if (
    streamState &&
    typeof streamState === "object" &&
    "value" in streamState
  ) {
    return {
      value: streamState.value,
      isComplete: (streamState as any).state === "Complete",
    };
  }
  return { value: streamState as T | null, isComplete: true };
}

/**
 * Stage 1: Generate Legal Search Queries
 * Takes a legal question and generates structured search queries using BAML
 */
export async function generateQueriesStage(
  legalQuestion: string
): Promise<LegalQueryAnalysis> {
  // Validate input
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required and cannot be empty");
  }

  // Check cache first
  const cacheKey = `GenerateLegalSearchQueries:${legalQuestion.trim()}`;
  const cachedResult = bamlCache.get(cacheKey);
  if (cachedResult) {
    console.log(
      `📋 Using cached queries for: "${legalQuestion}" (${cachedResult.search_queries.length} queries)`
    );
    return cachedResult;
  }

  try {
    console.log(`🔍 Generating queries for: "${legalQuestion}"`);

    const queryAnalysis = await bamlCircuitBreaker.execute(
      () => b.GenerateLegalSearchQueries(legalQuestion),
      "GenerateLegalSearchQueries"
    );

    // Cache the result for 5 minutes
    bamlCache.set(cacheKey, queryAnalysis, 300000);

    console.log(
      `✅ Generated ${queryAnalysis.search_queries.length} search queries`
    );

    return queryAnalysis;
  } catch (error) {
    console.error("Query generation failed:", error);
    throw new Error(
      `Failed to generate search queries: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Stage 2: Fetch Documents from Search Queries
 * Takes search queries and retrieves relevant documents using external search API
 */
export async function fetchDocumentsStage(
  queries: LegalQueryAnalysis["search_queries"]
): Promise<SearchResultItem[]> {
  // Import Exa search utility dynamically to avoid circular dependencies
  const { executeExaSearch } = await import("./exaSearch");

  if (!queries || queries.length === 0) {
    throw new Error("No search queries provided for document fetching");
  }

  const allResults: SearchResultItem[] = [];
  const maxQueries = config.research.maxQueriesPerIteration;
  const resultsPerQuery = config.research.maxDocumentsPerQuery;

  console.log(
    `📚 Fetching documents for ${Math.min(queries.length, maxQueries)} queries`
  );

  for (let i = 0; i < Math.min(queries.length, maxQueries); i++) {
    const query = queries[i];
    if (!query) {
      continue;
    }

    try {
      console.log(`🔎 Searching: "${query.query_string}"`);

      const results = await executeExaSearch(
        query,
        resultsPerQuery,
        true,
        config.research.maxRetries
      );

      console.log(
        `📄 Found ${results.length} documents for query: "${query.query_string}"`
      );
      allResults.push(...results);
    } catch (error) {
      console.error(`Search failed for query "${query.query_string}":`, error);
      // Continue with other queries even if one fails
    }
  }

  // Remove duplicates based on URL
  const uniqueResults = allResults.filter(
    (doc, index, array) => array.findIndex((d) => d.url === doc.url) === index
  );

  console.log(`✅ Fetched ${uniqueResults.length} unique documents`);

  return uniqueResults;
}

/**
 * Stage 3: Analyze Documents
 * Takes documents and analyzes them for relevance to the legal question
 */
export async function analyzeDocumentsStage(
  legalQuestion: string,
  documents: SearchResultItem[]
): Promise<AnalyzedDocument[]> {
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required for document analysis");
  }

  if (!documents || documents.length === 0) {
    throw new Error("No documents provided for analysis");
  }

  const analyzed: AnalyzedDocument[] = [];

  console.log(`🔍 Analyzing ${documents.length} documents`);

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    if (!doc) {
      continue;
    }

    try {
      console.log(
        `📖 Analyzing document ${i + 1}/${documents.length}: ${doc.title || "Untitled"}`
      );

      const analysis = await bamlCircuitBreaker.execute(
        () => b.AnalyzeSingleDocument(doc, legalQuestion),
        "AnalyzeSingleDocument"
      );
      analyzed.push(analysis);

      console.log(
        `✅ Analyzed "${doc.title || "Untitled"}" - Relevance: ${analysis.relevance_score}/10`
      );
    } catch (error) {
      console.error(
        `Analysis failed for document "${doc.title || doc.id}":`,
        error
      );
      // Continue with other documents even if one fails
    }
  }

  console.log(
    `✅ Successfully analyzed ${analyzed.length}/${documents.length} documents`
  );

  return analyzed;
}

/**
 * Stage 3: Analyze Documents (Streaming version)
 * Takes documents and analyzes them with real-time progress updates via SSE
 */
export async function analyzeDocumentsStageStreaming(
  legalQuestion: string,
  documents: SearchResultItem[],
  sseWriter: WritableStreamDefaultWriter<Uint8Array>
): Promise<AnalyzedDocument[]> {
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required for document analysis");
  }

  if (!documents || documents.length === 0) {
    throw new Error("No documents provided for analysis");
  }

  const encoder = new TextEncoder();
  const analyzed: AnalyzedDocument[] = [];

  // Helper function to send document analysis events
  const sendDocumentAnalysisEvent = async (
    docId: string,
    status: "analyzing" | "analyzed" | "failed" | "error",
    doc?: SearchResultItem,
    analysis?: AnalyzedDocument,
    errorMessage?: string,
    progress?: number
  ) => {
    const eventData = {
      docId,
      title: doc?.title,
      url: doc?.url,
      status,
      ...(analysis && {
        relevanceScore: analysis.relevance_score,
        confidenceScore: analysis.confidence_score,
        summarySnippet: analysis.summary?.slice(0, 200), // First 200 chars as snippet
        keyArguments: analysis.key_arguments_and_reasoning?.slice(0, 3), // First 3 key arguments
        extractedEntities: analysis.extracted_entities
          ?.slice(0, 5)
          ?.map((entity) => ({
            name: entity.name || "",
            type: entity.type || "",
            details: entity.details,
          })),
        extractedQuotes: analysis.extracted_quotes?.slice(0, 2), // First 2 quotes
        counterArguments: analysis.counter_arguments_or_nuances?.slice(0, 2),
      }),
      ...(errorMessage && { errorMessage }),
      ...(progress !== undefined && { progress }),
      timestamp: new Date().toISOString(),
      eventId: `doc_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    };

    const sseEvent = `event: document.analyzed\ndata: ${JSON.stringify(eventData)}\n\n`;
    await sseWriter.write(encoder.encode(sseEvent));
  };

  console.log(
    `🔍 Analyzing ${documents.length} documents in parallel with streaming`
  );

  // Send initial "analyzing" status for all documents
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    if (doc) {
      const docId = doc.id || doc.url || `doc_${i}`;
      await sendDocumentAnalysisEvent(
        docId,
        "analyzing",
        doc,
        undefined,
        undefined,
        0
      );
    }
  }

  // Process documents in parallel using Promise.allSettled for graceful error handling
  const analysisResults = await Promise.allSettled(
    documents.map(async (doc, index) => {
      if (!doc) {
        throw new Error("Invalid document");
      }

      const docId = doc.id || doc.url || `doc_${index}`;

      console.log(`📖 Starting analysis of: ${doc.title || "Untitled"}`);

      try {
        // Check cache first (using URL and question hash as key)
        const docCacheKey = `AnalyzeSingleDocument:${doc.url}:${legalQuestion.trim()}`;
        let analysis = bamlCache.get(docCacheKey);

        if (analysis) {
          console.log(
            `📋 Using cached analysis for: "${doc.title || "Untitled"}"`
          );
        } else {
          analysis = await bamlCircuitBreaker.execute(
            () => b.AnalyzeSingleDocument(doc, legalQuestion),
            "AnalyzeSingleDocument"
          );

          // Cache the result for 10 minutes (document analysis is expensive)
          bamlCache.set(docCacheKey, analysis, 600000);
        }

        console.log(
          `✅ Analyzed "${doc.title || "Untitled"}" - Relevance: ${analysis.relevance_score}/10`
        );

        // Send success status
        await sendDocumentAnalysisEvent(
          docId,
          "analyzed",
          doc,
          analysis,
          undefined,
          Math.round(((index + 1) / documents.length) * 100)
        );

        return { doc, analysis, index };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown analysis error";
        console.error(
          `Analysis failed for document "${doc.title || doc.id}":`,
          error
        );

        // Send failure status
        await sendDocumentAnalysisEvent(
          docId,
          "failed",
          doc,
          undefined,
          errorMessage,
          Math.round(((index + 1) / documents.length) * 100)
        );

        throw error;
      }
    })
  );

  // Process results and maintain original order
  for (const result of analysisResults) {
    if (result.status === "fulfilled") {
      analyzed.push(result.value.analysis);
    }
    // Failures are already logged and reported via SSE events
  }

  console.log(
    `✅ Successfully analyzed ${analyzed.length}/${documents.length} documents with streaming`
  );

  return analyzed;
}

/**
 * Stage 4: Synthesize Findings
 * Takes analyzed documents and synthesizes them into coherent topics
 */
export async function synthesizeFindingsStage(
  legalQuestion: string,
  analyzedDocuments: AnalyzedDocument[]
): Promise<OverallSynthesis> {
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required for synthesis");
  }

  if (!analyzedDocuments || analyzedDocuments.length === 0) {
    throw new Error("No analyzed documents provided for synthesis");
  }

  try {
    console.log(
      `🧩 Synthesizing findings from ${analyzedDocuments.length} documents`
    );

    const synthesis = await bamlCircuitBreaker.execute(
      () => b.SynthesizeAllFindings(analyzedDocuments, legalQuestion),
      "SynthesizeAllFindings"
    );

    console.log(
      `✅ Synthesized ${synthesis.key_synthesized_topics.length} key topics`
    );

    return synthesis;
  } catch (error) {
    console.error("Synthesis failed:", error);
    throw new Error(
      `Failed to synthesize findings: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Stage 5: Assess Research Sufficiency
 * Determines if research is sufficient or if more iteration is needed
 */
export async function assessResearchStage(
  legalQuestion: string,
  queryAnalysis: LegalQueryAnalysis,
  synthesis: OverallSynthesis
): Promise<ResearchAssessment> {
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required for research assessment");
  }

  if (!queryAnalysis || !synthesis) {
    throw new Error("Query analysis and synthesis are required for assessment");
  }

  try {
    console.log("🎯 Assessing research sufficiency...");

    const assessment = await bamlCircuitBreaker.execute(
      () =>
        b.AssessResearchAndPlanNextSteps(
          legalQuestion,
          queryAnalysis,
          synthesis
        ),
      "AssessResearchAndPlanNextSteps"
    );

    console.log(
      `✅ Assessment complete - Next action: ${assessment.next_action}`
    );

    return assessment;
  } catch (error) {
    console.error("Assessment failed:", error);
    throw new Error(
      `Failed to assess research: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Stage 6: Generate Final Report
 * Creates a comprehensive legal report based on synthesis and analysis
 */
export async function generateReportStage(
  legalQuestion: string,
  synthesis: OverallSynthesis,
  queryAnalysis: LegalQueryAnalysis
): Promise<FinalLegalReport> {
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required for report generation");
  }

  if (!synthesis || !queryAnalysis) {
    throw new Error(
      "Synthesis and query analysis are required for report generation"
    );
  }

  try {
    console.log("📝 Generating final legal report...");

    const finalReport = await bamlCircuitBreaker.execute(
      () =>
        b.GenerateFinalLegalReport(legalQuestion, synthesis, [queryAnalysis]),
      "GenerateFinalLegalReport"
    );

    console.log(`✅ Report generated: "${finalReport.report_title}"`);

    return finalReport;
  } catch (error) {
    console.error("Report generation failed:", error);
    throw new Error(
      `Failed to generate report: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Stage 6: Generate Final Legal Report (Streaming version)
 * Creates a comprehensive legal report with granular streaming updates
 */
export async function generateReportStageStreaming(
  legalQuestion: string,
  synthesis: OverallSynthesis,
  queryAnalysis: LegalQueryAnalysis,
  sseWriter: WritableStreamDefaultWriter<Uint8Array>
): Promise<FinalLegalReport> {
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required for report generation");
  }

  if (!synthesis || !queryAnalysis) {
    throw new Error(
      "Synthesis and query analysis are required for report generation"
    );
  }

  const encoder = new TextEncoder();

  // Helper function to send SSE events in the format the frontend expects
  const sendReportChunk = async (
    fieldName: "title" | "executiveSummary" | "section" | "conclusion",
    content: string,
    isFieldComplete = false,
    sectionInfo?: { index: number; title: string }
  ) => {
    const eventData = {
      fieldName,
      content,
      isFieldComplete,
      ...(sectionInfo && { sectionInfo }),
      timestamp: new Date().toISOString(),
      eventId: `report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    };

    const sseEvent = `event: report.chunk\ndata: ${JSON.stringify(eventData)}\n\n`;
    await sseWriter.write(encoder.encode(sseEvent));
  };

  try {
    console.log("📝 Generating final legal report with streaming...");

    // Use the streaming BAML function
    const reportStream = b.stream.GenerateFinalLegalReport(
      legalQuestion,
      synthesis,
      [queryAnalysis]
    );

    let currentReport: Partial<FinalLegalReport> = {};
    let lastTitleContent = "";
    let lastExecutiveSummaryContent = "";
    let lastConclusionContent = "";
    const sectionContents: { [key: number]: string } = {};

    // Process the stream of partial reports
    for await (const partialReport of reportStream) {
      // Handle report title updates
      if (
        partialReport.report_title &&
        partialReport.report_title !== lastTitleContent
      ) {
        lastTitleContent = partialReport.report_title;
        await sendReportChunk("title", partialReport.report_title);
      }

      // Handle executive summary updates (StreamState - optimized)
      const { value: summaryValue, isComplete: summaryComplete } =
        extractStreamValue(partialReport.executive_summary);
      if (summaryValue && summaryValue !== lastExecutiveSummaryContent) {
        lastExecutiveSummaryContent = summaryValue;
        await sendReportChunk(
          "executiveSummary",
          summaryValue,
          summaryComplete
        );
      }

      // Handle section updates (optimized)
      if (partialReport.sections && Array.isArray(partialReport.sections)) {
        for (let i = 0; i < partialReport.sections.length; i++) {
          const section = partialReport.sections[i];
          if (section?.content) {
            const { value: sectionContentValue, isComplete: sectionComplete } =
              extractStreamValue(section.content);
            if (
              sectionContentValue &&
              sectionContentValue !== sectionContents[i]
            ) {
              sectionContents[i] = sectionContentValue;
              await sendReportChunk(
                "section",
                sectionContentValue,
                sectionComplete,
                {
                  index: i,
                  title: section.section_title || `Section ${i + 1}`,
                }
              );
            }
          }
        }
      }

      // Handle conclusion updates (StreamState - optimized)
      const { value: conclusionValue, isComplete: conclusionComplete } =
        extractStreamValue(partialReport.conclusion);
      if (conclusionValue && conclusionValue !== lastConclusionContent) {
        lastConclusionContent = conclusionValue;
        await sendReportChunk(
          "conclusion",
          conclusionValue,
          conclusionComplete
        );
      }

      // Convert partial sections to full sections
      const convertedSections: LegalReportSection[] = partialReport.sections
        ? partialReport.sections.map((section) => ({
            section_title: section.section_title || "",
            content:
              section.content &&
              typeof section.content === "object" &&
              "value" in section.content
                ? section.content.value || ""
                : "",
          }))
        : currentReport.sections || [];

      // Update our current report state (extract values from StreamState objects)
      const updatedReport: Partial<FinalLegalReport> = {
        ...currentReport,
      };

      // Only set fields that have actual values (to satisfy exactOptionalPropertyTypes)
      if (partialReport.report_title) {
        updatedReport.report_title = partialReport.report_title;
      }

      if (
        partialReport.executive_summary &&
        typeof partialReport.executive_summary === "object" &&
        "value" in partialReport.executive_summary &&
        partialReport.executive_summary.value
      ) {
        updatedReport.executive_summary = partialReport.executive_summary.value;
      }

      if (convertedSections.length > 0) {
        updatedReport.sections = convertedSections;
      }

      if (
        partialReport.conclusion &&
        typeof partialReport.conclusion === "object" &&
        "value" in partialReport.conclusion &&
        partialReport.conclusion.value
      ) {
        updatedReport.conclusion = partialReport.conclusion.value;
      }

      if (partialReport.limitations_and_caveats) {
        updatedReport.limitations_and_caveats =
          partialReport.limitations_and_caveats;
      }

      if (partialReport.appendix_document_ids) {
        updatedReport.appendix_document_ids =
          partialReport.appendix_document_ids;
      }

      currentReport = updatedReport;
    }

    // Send completion markers for all fields
    if (currentReport.report_title) {
      await sendReportChunk("title", currentReport.report_title, true);
    }
    if (currentReport.executive_summary) {
      await sendReportChunk(
        "executiveSummary",
        currentReport.executive_summary,
        true
      );
    }
    if (currentReport.conclusion) {
      await sendReportChunk("conclusion", currentReport.conclusion, true);
    }

    const finalReport = currentReport as FinalLegalReport;
    console.log(
      `✅ Report generated with streaming: "${finalReport.report_title}"`
    );

    return finalReport;
  } catch (error) {
    console.error("Streaming report generation failed:", error);
    throw new Error(
      `Failed to generate streaming report: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
