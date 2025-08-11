import { Elysia, t } from "elysia";
import { b } from "../../baml_client";
import type {
  AnalyzedDocument,
  FinalLegalReport,
  LegalQueryAnalysis,
  OverallSynthesis,
  ResearchAssessment,
  SearchResultItem,
} from "../../baml_client/types";
import type {
  ResearchPipelineResult,
} from "../types/research";
import {
  analyzeDocumentsStage,
  analyzeDocumentsStageStreaming,
  assessResearchStage,
  fetchDocumentsStage,
  generateQueriesStage,
  generateReportStage,
  generateReportStageStreaming,
  synthesizeFindingsStage,
} from "../utils/pipelineStages";
import {
  createResearchUpdateSender,
  createSSEHeaders,
} from "../utils/sseUtils";
import { bamlCircuitBreaker, CircuitBreakerError } from "../utils/circuitBreaker";
import { bamlRequestThrottler } from "../utils/requestThrottler";

// Simple connection monitoring
interface ActiveConnection {
  id: string;
  url: string;
  userAgent?: string;
  startTime: number;
  lastActivityTime: number;
  isActive: boolean;
}

const activeConnections = new Map<string, ActiveConnection>();

// Cleanup inactive connections periodically
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  for (const [id, connection] of activeConnections) {
    if (connection.lastActivityTime < fiveMinutesAgo) {
      console.log(`🧹 Cleaning up inactive connection: ${id}`);
      activeConnections.delete(id);
    }
  }
}, 60000); // Check every minute

export const researchRoutes = new Elysia({ prefix: "/research" })
  .post(
    "/complete",
    async ({ body }): Promise<ResearchPipelineResult> => {
      const { legalQuestion, autoModeConfig } = body;
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
        fetchedDocuments = await fetchDocumentsStage(
          queryAnalysis.search_queries
        );

        // Stage 3: Analyze documents
        analyzedDocuments = await analyzeDocumentsStage(
          legalQuestion,
          fetchedDocuments
        );

        // Stage 4: Synthesize findings
        synthesis = await synthesizeFindingsStage(
          legalQuestion,
          analyzedDocuments
        );

        // Stage 5: Assess research
        assessment = await assessResearchStage(
          legalQuestion,
          queryAnalysis,
          synthesis
        );

        // Stage 6: Generate report if needed
        if (assessment.next_action === "GENERATE_REPORT") {
          finalReport = await generateReportStage(
            legalQuestion,
            synthesis,
            queryAnalysis
          );
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
  .get(
    "/stream",
    async ({ query, set, request }) => {
      const { 
        legalQuestion,
        autoMode = "false",
        maxIterations = "5", 
        currentIteration = "0"
      } = query;

      // Generate unique connection ID for monitoring
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userAgent = request.headers.get("user-agent");

      console.log(`🌊 SSE Stream Request [${connectionId}] - Legal Question: "${legalQuestion}"`);
      console.log(`📊 SSE Stream Config - autoMode: ${autoMode}, maxIterations: ${maxIterations}, currentIteration: ${currentIteration}`);

      // Validate legal question
      if (!legalQuestion || legalQuestion.trim().length === 0) {
        set.status = 400;
        return { error: "Legal question is required and cannot be empty" };
      }

      // Register connection for monitoring
      const connection: ActiveConnection = {
        id: connectionId,
        url: request.url,
        startTime: Date.now(),
        lastActivityTime: Date.now(),
        isActive: true,
        ...(userAgent && { userAgent }),
      };
      activeConnections.set(connectionId, connection);
      console.log(`📊 Connection registered [${connectionId}]. Active connections: ${activeConnections.size}`);

      // Create SSE stream
      let isStreamClosed = false;
      const stream = new ReadableStream({
        async start(controller) {

          // Create sender utility
          const writer = {
            write: async (data: Uint8Array) => {
              if (!isStreamClosed) {
                try {
                  controller.enqueue(data);
                } catch (error) {
                  // Client disconnected - this is normal behavior
                  console.log("📤 Client disconnected during stream");
                  isStreamClosed = true;
                }
              }
            },
          } as WritableStreamDefaultWriter<Uint8Array>;

          const sender = createResearchUpdateSender(writer);

          // Helper to check if we should continue processing and update activity
          const shouldContinue = () => {
            if (!isStreamClosed) {
              // Update last activity time
              const conn = activeConnections.get(connectionId);
              if (conn) {
                conn.lastActivityTime = Date.now();
              }
            }
            return !isStreamClosed;
          };

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

            if (!shouldContinue()) {
              console.log("⚡ Aborting: Client disconnected before query generation");
              return;
            }

            // Send periodic keepalive during long BAML operation
            const keepAliveInterval = setInterval(async () => {
              if (shouldContinue()) {
                await sender.sendLog(
                  "GENERATING_QUERIES",
                  "🧠 AI analysis in progress..."
                );
              } else {
                clearInterval(keepAliveInterval);
              }
            }, 5000); // Every 5 seconds

            queryAnalysis = await generateQueriesStage(legalQuestion);
            clearInterval(keepAliveInterval);

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

            fetchedDocuments = await fetchDocumentsStage(
              queryAnalysis.search_queries
            );

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

            if (!shouldContinue()) {
              console.log("⚡ Aborting: Client disconnected before document analysis");
              return;
            }

            // Use streaming document analysis with granular events
            analyzedDocuments = await analyzeDocumentsStageStreaming(
              legalQuestion,
              fetchedDocuments,
              writer
            );

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

            synthesis = await synthesizeFindingsStage(
              legalQuestion,
              analyzedDocuments
            );

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

            assessment = await assessResearchStage(
              legalQuestion,
              queryAnalysis,
              synthesis
            );

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
                "Generating comprehensive legal report with streaming..."
              );

              // Use streaming version for granular report updates
              finalReport = await generateReportStageStreaming(
                legalQuestion,
                synthesis,
                queryAnalysis,
                writer
              );

              await sender.sendData(
                "GENERATING_REPORT",
                `Report generated with streaming: "${finalReport.report_title}"`,
                {
                  finalReport,
                  progress: { current: 6, total: 6, percentage: 100 },
                }
              );
            }

            // Send completion
            const processingTime = Date.now() - startTime;

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
            // Cleanup connection monitoring
            const conn = activeConnections.get(connectionId);
            if (conn) {
              conn.isActive = false;
              activeConnections.delete(connectionId);
              console.log(`📊 Connection closed [${connectionId}]. Active connections: ${activeConnections.size}`);
            }

            if (!isStreamClosed) {
              try {
                controller.close();
              } catch (error) {
                console.warn("Stream close error:", error);
              }
            }
          }
        },

        cancel(reason?: string) {
          console.log(`📤 SSE stream cancelled by client [${connectionId}]${reason ? `: ${reason}` : ""}`);
          const currentTime = Date.now();
          console.log(`⏱️  Stream was cancelled at: ${currentTime}ms`);
          
          // Cleanup connection monitoring
          const conn = activeConnections.get(connectionId);
          if (conn) {
            conn.isActive = false;
            activeConnections.delete(connectionId);
            console.log(`📊 Connection cancelled [${connectionId}]. Active connections: ${activeConnections.size}`);
          }
          
          isStreamClosed = true;
        },
      });

      return new Response(stream, {
        headers: createSSEHeaders(),
      });
    },
    {
      query: t.Object({
        legalQuestion: t.String({ minLength: 1 }),
        autoMode: t.Optional(t.String()),
        maxIterations: t.Optional(t.String()),
        currentIteration: t.Optional(t.String()),
      }),
      error: ({ code, set }) => {
        if (code === "VALIDATION") {
          set.status = 400;
          return { error: "Invalid query parameters - legal question is required" };
        }
        set.status = 500;
        return { error: "Internal server error" };
      },
      detail: {
        tags: ["Research"],
        summary: "Stream legal research process via SSE",
        description:
          "Initiates a legal research process and streams real-time updates via Server-Sent Events",
        responses: {
          200: {
            description: "Research streaming started successfully",
            content: {
              "text/event-stream": {
                schema: {
                  type: "string",
                  description:
                    "Server-Sent Events stream containing research updates",
                },
              },
            },
          },
          400: {
            description: "Invalid request - legal question is required",
          },
        },
      }
    }
  )
  .get(
    "/test-baml",
    async ({ query }) => {
      const { legalQuestion = "Test legal question about contract law" } = query;
      
      console.log(`🧪 Testing BAML function with: "${legalQuestion}"`);
      
      try {
        const startTime = Date.now();
        const result = await bamlCircuitBreaker.execute(
          () => b.GenerateLegalSearchQueries(legalQuestion),
          'GenerateLegalSearchQueries'
        );
        const duration = Date.now() - startTime;
        
        console.log(`✅ BAML function completed in ${duration}ms`);
        
        return {
          success: true,
          duration,
          result: {
            queryCount: result.search_queries.length,
            firstQuery: result.search_queries[0]?.query_string || "No queries"
          }
        };
      } catch (error) {
        console.error("❌ BAML function failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      query: t.Object({
        legalQuestion: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/baml-health",
    async () => {
      console.log("🏥 BAML health check requested");
      
      try {
        const circuitStatus = bamlCircuitBreaker.getStatus();
        
        // Quick health check with minimal token usage
        const startTime = Date.now();
        const result = await bamlCircuitBreaker.execute(
          () => b.GenerateLegalSearchQueries("test health check"),
          'HealthCheck'
        );
        const duration = Date.now() - startTime;
        
        return {
          healthy: true,
          duration,
          circuitBreaker: {
            state: circuitStatus.state,
            failures: circuitStatus.failures,
            lastFailureTime: circuitStatus.lastFailureTime,
            consecutiveSuccesses: circuitStatus.consecutiveSuccesses,
          },
          baml: {
            available: true,
            queriesGenerated: result.search_queries.length,
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        const circuitStatus = bamlCircuitBreaker.getStatus();
        const isCircuitBreakerError = error instanceof CircuitBreakerError;
        
        console.error("❌ BAML health check failed:", error);
        
        return {
          healthy: false,
          circuitBreaker: {
            state: circuitStatus.state,
            failures: circuitStatus.failures,
            lastFailureTime: circuitStatus.lastFailureTime,
            consecutiveSuccesses: circuitStatus.consecutiveSuccesses,
          },
          baml: {
            available: false,
            error: error instanceof Error ? error.message : "Unknown error",
            errorType: isCircuitBreakerError ? error.type : 'BAML_ERROR',
          },
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      detail: {
        tags: ["Research"],
        summary: "BAML service health check",
        description: "Checks BAML connectivity and circuit breaker status",
        responses: {
          200: {
            description: "Health check completed (may indicate healthy or unhealthy state)",
          },
        },
      },
    }
  )
  .get(
    "/throttler-status",
    async () => {
      console.log("🚦 Request throttler status requested");
      
      try {
        const throttlerStatus = bamlRequestThrottler.getStatus();
        const circuitStatus = bamlCircuitBreaker.getStatus();
        
        return {
          healthy: circuitStatus.state === 'CLOSED' && throttlerStatus.activeRequests < throttlerStatus.config.maxConcurrent,
          throttler: {
            activeRequests: throttlerStatus.activeRequests,
            queuedRequests: throttlerStatus.queuedRequests,
            maxConcurrent: throttlerStatus.config.maxConcurrent,
            maxQueue: throttlerStatus.config.maxQueue,
            stats: throttlerStatus.stats,
          },
          circuitBreaker: {
            state: circuitStatus.state,
            failures: circuitStatus.failures,
            lastFailureTime: circuitStatus.lastFailureTime,
            consecutiveSuccesses: circuitStatus.consecutiveSuccesses,
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("❌ Throttler status check failed:", error);
        return {
          healthy: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      detail: {
        tags: ["Research"],
        summary: "Request throttler and circuit breaker status",
        description: "Shows current status of request throttling and circuit breaker protection",
        responses: {
          200: {
            description: "Status check completed",
          },
        },
      },
    }
  )
  .get(
    "/connections",
    async () => {
      console.log("🔍 Active connections status requested");
      
      try {
        const now = Date.now();
        const connections = Array.from(activeConnections.values()).map(conn => ({
          id: conn.id,
          url: conn.url,
          userAgent: conn.userAgent,
          startTime: conn.startTime,
          lastActivityTime: conn.lastActivityTime,
          duration: now - conn.startTime,
          idleTime: now - conn.lastActivityTime,
          isActive: conn.isActive,
        }));

        return {
          totalConnections: activeConnections.size,
          connections,
          timestamp: new Date().toISOString(),
          stats: {
            totalActive: connections.filter(c => c.isActive).length,
            avgDuration: connections.length > 0 
              ? Math.round(connections.reduce((sum, c) => sum + c.duration, 0) / connections.length)
              : 0,
            longestConnection: connections.length > 0 
              ? Math.max(...connections.map(c => c.duration))
              : 0,
          },
        };
      } catch (error) {
        console.error("❌ Connection status check failed:", error);
        return {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      detail: {
        tags: ["Research"],
        summary: "Active SSE connections monitoring",
        description: "Shows current active Server-Sent Events connections and statistics",
        responses: {
          200: {
            description: "Connection monitoring data retrieved",
          },
        },
      },
    }
  );

// Stage implementations are now imported from utils/pipelineStages.ts
