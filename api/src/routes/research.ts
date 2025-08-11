import { Elysia, t } from "elysia";
import { b } from "../../baml_client";
import type {
  ResearchPipelineResult,
  ResearchRequest,
  AutoModeConfig,
} from "../types/research";
import type {
  AnalyzedDocument,
  FinalLegalReport,
  LegalQueryAnalysis,
  OverallSynthesis,
  ResearchAssessment,
  SearchResultItem,
} from "../../baml_client/types";
import {
  createResearchUpdate,
  createSSEHeaders,
  formatSSEEvent,
  createResearchUpdateSender,
} from "../utils/sseUtils";
import {
  generateQueriesStage,
  fetchDocumentsStage,
  analyzeDocumentsStage,
  synthesizeFindingsStage,
  assessResearchStage,
  generateReportStage,
} from "../utils/pipelineStages";

export const researchRoutes = new Elysia({ prefix: "/research" })
  .post(
    "/complete",
    async ({ body }): Promise<ResearchPipelineResult> => {
      const { legalQuestion, autoModeConfig, previouslyAnalyzedDocs } = body;
      const startTime = Date.now();

      // Handle empty legal question
      if (!legalQuestion || legalQuestion.trim().length === 0) {
        throw new Error("Legal question is required and cannot be empty");
      }

      try {
        // Initialize result structure
        let queryAnalysis: LegalQueryAnalysis | null = null;
        let fetchedDocuments: SearchResultItem[] = [];
        let analyzedDocuments: AnalyzedDocument[] = [];
        let synthesis: OverallSynthesis | null = null;
        let assessment: ResearchAssessment | null = null;
        let finalReport: FinalLegalReport | null = null;

        // Stage 1: Generate queries
        queryAnalysis = await generateQueriesStage(legalQuestion);

        // Stage 2: Fetch documents
        fetchedDocuments = await fetchDocumentsStage(queryAnalysis.search_queries);

        // Stage 3: Analyze documents
        analyzedDocuments = await analyzeDocumentsStage(legalQuestion, fetchedDocuments);

        // Stage 4: Synthesize findings
        synthesis = await synthesizeFindingsStage(legalQuestion, analyzedDocuments);

        // Stage 5: Assess research
        assessment = await assessResearchStage(legalQuestion, queryAnalysis, synthesis);

        // Stage 6: Generate report if needed
        if (assessment.next_action === "GENERATE_REPORT") {
          finalReport = await generateReportStage(legalQuestion, synthesis, queryAnalysis);
        }

        // Calculate metadata
        const processingTime = Date.now() - startTime;
        const metadata = {
          processingTime,
          documentsProcessed: analyzedDocuments.length,
          queriesExecuted: queryAnalysis.search_queries.length,
          iteration: autoModeConfig?.currentIteration || 0,
        };

        return {
          queryAnalysis,
          fetchedDocuments,
          analyzedDocuments,
          synthesis,
          assessment,
          finalReport,
          metadata,
        };
      } catch (error) {
        console.error("Research pipeline error:", error);
        throw error;
      }
    },
    {
      body: t.Object({
        legalQuestion: t.String({ minLength: 1 }),
        autoModeConfig: t.Optional(
          t.Object({
            isEnabled: t.Boolean(),
            maxIterations: t.Number(),
            currentIteration: t.Number(),
          })
        ),
        previouslyAnalyzedDocs: t.Optional(
          t.Array(
            t.Object({
              docId: t.String(),
              title: t.Optional(t.String()),
              url: t.Optional(t.String()),
              timestamp: t.Optional(t.String()),
              status: t.String(),
            })
          )
        ),
      }),
      error: ({ code, set }) => {
        if (code === "VALIDATION") {
          set.status = 400;
          return { error: "Invalid request body - legal question is required" };
        }
        set.status = 500;
        return { error: "Internal server error" };
      },
    }
  )
  .post(
    "/stream",
    async ({ body, set }) => {
      const { legalQuestion } = body;

      // Validate legal question
      if (!legalQuestion || legalQuestion.trim().length === 0) {
        set.status = 400;
        return { error: "Legal question is required and cannot be empty" };
      }

      // Create SSE stream
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let isStreamClosed = false;

          // Create sender utility
          const writer = {
            write: async (data: Uint8Array) => {
              if (!isStreamClosed) {
                try {
                  controller.enqueue(data);
                } catch (error) {
                  console.warn("Stream write failed:", error);
                  isStreamClosed = true;
                }
              }
            },
          } as WritableStreamDefaultWriter<Uint8Array>;

          const sender = createResearchUpdateSender(writer);

          try {
            const startTime = Date.now();

            // Initialize pipeline result
            let queryAnalysis: LegalQueryAnalysis | null = null;
            let fetchedDocuments: SearchResultItem[] = [];
            let analyzedDocuments: AnalyzedDocument[] = [];
            let synthesis: OverallSynthesis | null = null;
            let assessment: ResearchAssessment | null = null;
            let finalReport: FinalLegalReport | null = null;

            // Send initialization update
            await sender.sendStatusChange(
              "INITIALIZING",
              "Starting legal research pipeline...",
              { metadata: { timestamp: new Date().toISOString() } }
            );

            // Stage 1: Generate Queries
            await sender.sendStatusChange(
              "GENERATING_QUERIES",
              "Analyzing legal question and generating search queries..."
            );

            queryAnalysis = await generateQueriesStage(legalQuestion);
            
            await sender.sendData(
              "GENERATING_QUERIES",
              `Generated ${queryAnalysis.search_queries.length} targeted search queries`,
              {
                queryAnalysis,
                generatedQueries: queryAnalysis.search_queries,
                progress: { current: 1, total: 6, percentage: 17 },
              }
            );

            // Stage 2: Fetch Documents
            await sender.sendStatusChange(
              "FETCHING_DOCUMENTS",
              "Searching for relevant legal documents..."
            );

            fetchedDocuments = await fetchDocumentsStage(queryAnalysis.search_queries);

            await sender.sendData(
              "FETCHING_DOCUMENTS",
              `Found ${fetchedDocuments.length} relevant legal documents`,
              {
                fetchedDocuments,
                progress: { current: 2, total: 6, percentage: 33 },
              }
            );

            // Stage 3: Analyze Documents
            await sender.sendStatusChange(
              "ANALYZING_DOCUMENTS",
              "Analyzing documents for legal relevance..."
            );

            // Stream individual document analyses
            analyzedDocuments = [];
            for (let i = 0; i < fetchedDocuments.length; i++) {
              const doc = fetchedDocuments[i];
              if (!doc) continue;

              await sender.sendProgress(
                "ANALYZING_DOCUMENTS",
                i + 1,
                fetchedDocuments.length,
                `Analyzing: ${doc.title || "Document"}`
              );

              try {
                const analysis = await b.AnalyzeSingleDocument(doc, legalQuestion);
                analyzedDocuments.push(analysis);

                await sender.sendData(
                  "ANALYZING_DOCUMENTS",
                  `Analyzed: ${doc.title || "Document"} (Relevance: ${analysis.relevance_score}/10)`,
                  {
                    documentAnalysis: {
                      document: doc,
                      analysis,
                      index: i,
                      total: fetchedDocuments.length,
                    },
                  }
                );
              } catch (error) {
                await sender.sendLog(
                  "ANALYZING_DOCUMENTS",
                  `Failed to analyze document: ${doc.title || doc.id}`
                );
              }
            }

            await sender.sendData(
              "ANALYZING_DOCUMENTS",
              `Analysis complete: ${analyzedDocuments.length} documents analyzed`,
              {
                analyzedDocuments,
                progress: { current: 3, total: 6, percentage: 50 },
              }
            );

            // Stage 4: Synthesize Findings
            await sender.sendStatusChange(
              "SYNTHESIZING_FINDINGS",
              "Synthesizing research findings..."
            );

            synthesis = await synthesizeFindingsStage(legalQuestion, analyzedDocuments);

            await sender.sendData(
              "SYNTHESIZING_FINDINGS",
              `Identified ${synthesis.key_synthesized_topics.length} key legal topics`,
              {
                synthesis,
                progress: { current: 4, total: 6, percentage: 67 },
              }
            );

            // Stage 5: Assess Research
            await sender.sendStatusChange(
              "ASSESSING_RESEARCH",
              "Assessing research completeness..."
            );

            assessment = await assessResearchStage(legalQuestion, queryAnalysis, synthesis);

            await sender.sendData(
              "ASSESSING_RESEARCH",
              `Research assessment: ${assessment.next_action}`,
              {
                assessment,
                progress: { current: 5, total: 6, percentage: 83 },
              }
            );

            // Stage 6: Generate Report (if needed)
            if (assessment.next_action === "GENERATE_REPORT") {
              await sender.sendStatusChange(
                "GENERATING_REPORT",
                "Generating comprehensive legal report..."
              );

              finalReport = await generateReportStage(legalQuestion, synthesis, queryAnalysis);

              await sender.sendData(
                "GENERATING_REPORT",
                `Report generated: "${finalReport.report_title}"`,
                {
                  finalReport,
                  progress: { current: 6, total: 6, percentage: 100 },
                }
              );
            }

            // Send completion
            const processingTime = Date.now() - startTime;
            const metadata = {
              processingTime,
              documentsProcessed: analyzedDocuments.length,
              queriesExecuted: queryAnalysis.search_queries.length,
              iteration: 0,
            };

            await sender.sendStatusChange(
              "COMPLETED",
              "Legal research pipeline completed successfully",
              {
                metadata: {
                  timestamp: new Date().toISOString(),
                  processingTime,
                },
              }
            );

            await sender.sendCompletion();

          } catch (error) {
            console.error("SSE Pipeline error:", error);
            
            if (!isStreamClosed) {
              await sender.sendError(error as Error);
            }
          } finally {
            if (!isStreamClosed) {
              try {
                controller.close();
              } catch (error) {
                console.warn("Stream close error:", error);
              }
            }
          }
        },

        cancel() {
          console.log("SSE stream cancelled by client");
        },
      });

      return new Response(stream, {
        headers: createSSEHeaders(),
      });
    },
    {
      body: t.Object({
        legalQuestion: t.String({ minLength: 1 }),
      }),
      error: ({ code, set }) => {
        if (code === "VALIDATION") {
          set.status = 400;
          return { error: "Invalid request body - legal question is required" };
        }
        set.status = 500;
        return { error: "Internal server error" };
      },
      detail: {
        tags: ["Research"],
        summary: "Stream legal research process via SSE",
        description: "Initiates a legal research process and streams real-time updates via Server-Sent Events",
        responses: {
          200: {
            description: "Research streaming started successfully",
            content: {
              "text/event-stream": {
                schema: {
                  type: "string",
                  description: "Server-Sent Events stream containing research updates",
                },
              },
            },
          },
          400: {
            description: "Invalid request - legal question is required",
          },
        },
      },
    }
  );

// Stage implementations are now imported from utils/pipelineStages.ts