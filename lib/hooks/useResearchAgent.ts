"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useState } from "react";
import { createStreamingURL } from "@/lib/apiClient";
import { ResilientEventSource } from "@/lib/utils/eventSourceManager";
import type {
  ClientAnalyzedDoc,
  ClientResearchAssessment,
  ClientSynthesis,
  ConnectionState,
  SystemHealthState,
} from "@/lib/state/researchAtoms";
import {
  analyzedDocsSummaryAtom,
  autoModeStateAtom,
  connectionStateAtom,
  finalReportContentAtom,
  generatedQueriesAtom,
  researchAssessmentAtom,
  researchLogAtom,
  researchSessionAtom,
  researchStatusAtom,
  resetResearchStateAtom,
  synthesisDetailsAtom,
  systemHealthAtom,
} from "@/lib/state/researchAtoms";
import {
  AssessmentCompleteEventSchema,
  CompletionEventSchema,
  DocumentAnalyzedEventSchema,
  DocumentFetchedEventSchema,
  QueryGeneratedEventSchema,
  ReportChunkEventSchema,
  type ResearchStage,
  StageChangeEventSchema,
  SynthesisCompleteEventSchema,
} from "../../packages/shared-types/src/sse-events";

interface QueryData {
  query_string: string;
  expected_information_summary: string;
}


interface UseResearchAgentReturn {
  startResearch: (legalQuestion: string) => Promise<void>;
  resumeResearch: () => Promise<void>;
  pauseResearch: () => void;
  abortResearch: () => void;
  retryConnection: () => Promise<void>;
  isLoading: boolean;
  currentStage: ResearchStage | null;
  currentMessage: string | undefined;
  error: string | null;
  isPaused: boolean;
  canResume: boolean;
  autoModeEnabled: boolean;
  toggleAutoMode: () => void;
  // Connection state
  connectionState: ConnectionState;
  systemHealth: SystemHealthState;
  // Manual controls
  dismissWarning: (warningId: string) => void;
  checkSystemHealth: () => Promise<void>;
}

/**
 * Custom React hook for managing the legal research process workflow.
 *
 * This hook serves as the primary interface between UI components and the research pipeline,
 * orchestrating the entire research lifecycle from query generation to final report creation.
 * It manages the connection to the server-side research orchestrator and updates Jotai atoms
 * based on streaming updates received from the backend.
 *
 * IMPORTANT: For streaming text fields (marked with @stream.with_state in BAML), the "chunk"
 * received from the orchestrator represents the FULL CURRENT VALUE of that field, not an
 * incremental addition. Therefore, we REPLACE (not append) the field value with each chunk.
 */
export function useResearchAgent(): UseResearchAgentReturn {
  // Get Jotai setters and readers
  const setResearchStatus = useSetAtom(researchStatusAtom);
  const setResearchLog = useSetAtom(researchLogAtom);
  const setGeneratedQueries = useSetAtom(generatedQueriesAtom);
  const setAnalyzedDocs = useSetAtom(analyzedDocsSummaryAtom);
  const setSynthesisDetails = useSetAtom(synthesisDetailsAtom);
  const setFinalReportContent = useSetAtom(finalReportContentAtom);
  const setResearchAssessment = useSetAtom(researchAssessmentAtom);
  const setAutoModeState = useSetAtom(autoModeStateAtom);
  const setResearchSession = useSetAtom(researchSessionAtom);
  const setConnectionState = useSetAtom(connectionStateAtom);
  const setSystemHealth = useSetAtom(systemHealthAtom);
  const resetAllResearchState = useSetAtom(resetResearchStateAtom);
  const autoModeState = useAtomValue(autoModeStateAtom);
  const researchStatus = useAtomValue(researchStatusAtom);
  const researchSession = useAtomValue(researchSessionAtom);
  const connectionState = useAtomValue(connectionStateAtom);
  const systemHealth = useAtomValue(systemHealthAtom);

  // Local state for ResilientEventSource connection management
  const [resilientEventSource, setResilientEventSource] =
    useState<ResilientEventSource | null>(null);

  // Helper function to log research events
  const logResearchEvent = useCallback(
    (stage: string, type: string, message: string) => {
      setResearchLog((prev) => [
        ...prev,
        `${new Date().toISOString()} [${stage}] (${type}) ${message}`.trim(),
      ]);
    },
    [setResearchLog]
  );

  // Helper function to add system warnings
  const addSystemWarning = useCallback(
    (
      type: 'RATE_LIMIT' | 'CIRCUIT_BREAKER' | 'CONNECTION' | 'API_ERROR',
      message: string,
      severity: 'low' | 'medium' | 'high' = 'medium',
      canRetry: boolean = true
    ) => {
      const warning = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type,
        message,
        timestamp: Date.now(),
        severity,
        canRetry,
      };

      setSystemHealth((prev) => ({
        ...prev,
        warnings: [...prev.warnings, warning],
        isHealthy: severity !== 'high', // Mark unhealthy if high severity
      }));

      logResearchEvent("SYSTEM_WARNING", type, message);
    },
    [setSystemHealth, logResearchEvent]
  );

  // Helper function to check system health
  const checkSystemHealth = useCallback(async () => {
    try {
      // Check BAML health
      const healthResponse = await fetch('/api/research/baml-health');
      const healthData = await healthResponse.json();

      // Check throttler status
      const throttlerResponse = await fetch('/api/research/throttler-status');
      const throttlerData = await throttlerResponse.json();

      setSystemHealth((prev) => ({
        ...prev,
        lastHealthCheck: Date.now(),
        isHealthy: healthData.healthy && throttlerData.healthy,
        circuitBreakerStatus: {
          state: healthData.circuitBreaker?.state || 'CLOSED',
          failures: healthData.circuitBreaker?.failures || 0,
          lastFailureTime: healthData.circuitBreaker?.lastFailureTime || null,
        },
        rateLimitingStatus: {
          isRateLimited: throttlerData.throttler?.activeRequests >= throttlerData.throttler?.maxConcurrent,
          activeRequests: throttlerData.throttler?.activeRequests || 0,
          queuedRequests: throttlerData.throttler?.queuedRequests || 0,
          maxConcurrent: throttlerData.throttler?.maxConcurrent || 2,
          lastRateLimitTime: prev.rateLimitingStatus.lastRateLimitTime,
        },
      }));

      // Add warnings based on health status
      if (!healthData.healthy) {
        addSystemWarning('CIRCUIT_BREAKER', 'BAML service is experiencing issues', 'high', true);
      }

      if (throttlerData.throttler?.queuedRequests > 0) {
        addSystemWarning(
          'RATE_LIMIT',
          `${throttlerData.throttler.queuedRequests} requests queued due to rate limiting`,
          'medium',
          false
        );
      }

    } catch (error) {
      console.error('System health check failed:', error);
      addSystemWarning('API_ERROR', 'Failed to check system health', 'low', true);
    }
  }, [setSystemHealth, addSystemWarning]);

  // Helper function to dismiss warnings
  const dismissWarning = useCallback(
    (warningId: string) => {
      setSystemHealth((prev) => ({
        ...prev,
        warnings: prev.warnings.filter(w => w.id !== warningId),
        // Recalculate health status
        isHealthy: prev.warnings.filter(w => w.id !== warningId && w.severity === 'high').length === 0,
      }));
    },
    [setSystemHealth]
  );

  // Helper function to initialize research session
  const initializeResearchSession = useCallback(
    (legalQuestion: string) => {
      resetAllResearchState(undefined);

      setAutoModeState((prev) => ({
        ...prev,
        originalQuestion: legalQuestion,
        currentIteration: 0,
      }));

      const sessionId = `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setResearchSession((prev) => ({
        ...prev,
        sessionId,
      }));

      setResearchStatus({
        stage: "INITIALIZING",
        isLoading: true,
        error: null,
        message: "Initializing research...",
        currentProcessedDoc: 0,
        totalDocsToProcess: 0,
        isPaused: false,
        canResume: false,
      });

      logResearchEvent(
        "INITIALIZING",
        "INFO",
        `Research process initiated for: "${legalQuestion}"`
      );
    },
    [
      resetAllResearchState,
      setAutoModeState,
      setResearchSession,
      setResearchStatus,
      logResearchEvent,
    ]
  );

  // Helper function to cleanup orphaned documents that remain in "analyzing" state
  const cleanupOrphanedDocuments = useCallback(() => {
    setAnalyzedDocs((prev) =>
      prev.map((doc) => {
        if (doc.status === "analyzing") {
          return {
            ...doc,
            status: "error" as const,
            errorMessage: "Analysis was interrupted or failed to complete",
          };
        }
        return doc;
      })
    );
    setResearchSession((prev) => ({
      ...prev,
      accumulatedDocuments: prev.accumulatedDocuments.map((doc) => {
        if (doc.status === "analyzing") {
          return {
            ...doc,
            status: "error" as const,
            errorMessage: "Analysis was interrupted or failed to complete",
          };
        }
        return doc;
      }),
    }));
  }, [setAnalyzedDocs, setResearchSession]);


  // Helper function to handle stream errors
  const handleStreamError = useCallback(
    (error: Error) => {
      // Only log errors in verbose mode or when debugging
      const shouldLog =
        process.env.VITEST_VERBOSE === "true" ||
        process.env.DEBUG_API_TESTS === "true" ||
        !process.env.VITEST;

      if (shouldLog) {
        console.error("Stream processing error:", error);
      }

      // Clean up any orphaned documents
      cleanupOrphanedDocuments();

      setResearchStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
        stage: "ERROR",
        message: `Research failed: ${error.message}`,
        isPaused: false,
        canResume: false,
      }));

      logResearchEvent("ERROR", "ERROR", `Research failed: ${error.message}`);
      setResilientEventSource(null);
    },
    [setResearchStatus, logResearchEvent, cleanupOrphanedDocuments]
  );

  // Setup EventSource listeners for different SSE event types
  const setupEventListeners = useCallback(
    (resilientSource: ResilientEventSource) => {
      // Stage change events
      resilientSource.addEventListener("stage.change", (event) => {
        try {
          const eventData = JSON.parse((event as MessageEvent).data);
          const parsed = StageChangeEventSchema.safeParse(eventData);

          if (parsed.success) {
            const { stage, message, progress: _ } = parsed.data;

            setResearchStatus((prev) => ({
              ...prev,
              stage: stage as ResearchStage,
              message: message || prev.message || `Stage changed to ${stage}`,
              isLoading: stage !== "COMPLETED" && stage !== "ERROR",
            }));

            logResearchEvent(
              stage,
              "STATUS_CHANGE",
              message || `Stage changed to ${stage}`
            );
          }
        } catch (error) {
          logResearchEvent(
            "SYSTEM_ERROR",
            "ERROR",
            `Failed to parse stage.change event: ${error}`
          );
        }
      });

      // Query generation events
      resilientSource.addEventListener("query.generated", (event) => {
        try {
          const eventData = JSON.parse((event as MessageEvent).data);
          const parsed = QueryGeneratedEventSchema.safeParse(eventData);

          if (parsed.success) {
            const { queries } = parsed.data;
            const timestamp = new Date().toISOString();

            const queriesWithTimestamp = queries.map((q: QueryData) => ({
              ...q,
              timestamp,
            }));

            setGeneratedQueries(queriesWithTimestamp);
            setResearchSession((prev) => ({
              ...prev,
              accumulatedQueries: [
                ...prev.accumulatedQueries,
                ...queriesWithTimestamp,
              ],
            }));

            logResearchEvent(
              "GENERATING_QUERIES",
              "DATA",
              `Generated ${queries.length} queries`
            );
          }
        } catch (error) {
          logResearchEvent(
            "SYSTEM_ERROR",
            "ERROR",
            `Failed to parse query.generated event: ${error}`
          );
        }
      });

      // Document fetched events
      resilientSource.addEventListener("document.fetched", (event) => {
        try {
          const eventData = JSON.parse((event as MessageEvent).data);
          const parsed = DocumentFetchedEventSchema.safeParse(eventData);

          if (parsed.success) {
            const docData = parsed.data;
            const timestamp = new Date().toISOString();

            // Create document with required properties and conditionally add optional ones
            const docWithTimestamp: ClientAnalyzedDoc = {
              docId: docData.docId,
              status: docData.status as any,
              timestamp,
              ...(docData.title !== undefined && { title: docData.title }),
              ...(docData.url !== undefined && { url: docData.url }),
              ...(docData.source !== undefined && { source: docData.source }),
              ...(docData.globalSequenceNumber !== undefined && { globalSequenceNumber: docData.globalSequenceNumber }),
              ...(docData.iterationIndex !== undefined && { iterationIndex: docData.iterationIndex }),
              ...(docData.fetchBatchIndex !== undefined && { fetchBatchIndex: docData.fetchBatchIndex }),
              ...(docData.fetchOrderIndex !== undefined && { fetchOrderIndex: docData.fetchOrderIndex }),
              ...(docData.searchQueryId !== undefined && { searchQueryId: docData.searchQueryId }),
              ...(docData.fetchTimestamp !== undefined && { fetchTimestamp: docData.fetchTimestamp }),
            };

            setAnalyzedDocs((prev) => [...prev, docWithTimestamp]);
            setResearchSession((prev) => ({
              ...prev,
              accumulatedDocuments: [
                ...prev.accumulatedDocuments,
                docWithTimestamp,
              ],
            }));

            logResearchEvent(
              "FETCHING_DOCUMENTS",
              "DATA",
              `Document fetched: ${docData.title || docData.docId}`
            );
          }
        } catch (error) {
          logResearchEvent(
            "SYSTEM_ERROR",
            "ERROR",
            `Failed to parse document.fetched event: ${error}`
          );
        }
      });

      // Document analysis events
      resilientSource.addEventListener("document.analyzed", (event) => {
        try {
          const eventData = JSON.parse((event as MessageEvent).data);
          const parsed = DocumentAnalyzedEventSchema.safeParse(eventData);

          if (parsed.success) {
            const docData = parsed.data;

            setAnalyzedDocs((prev) => {
              const existingIndex = prev.findIndex(
                (doc) => doc.docId === docData.docId
              );
              if (existingIndex >= 0) {
                // Update existing document - only assign defined values
                const newDocs = [...prev];
                const updates: Partial<ClientAnalyzedDoc> = {
                  status: docData.status as any,
                };
                
                // Only assign defined values to avoid undefined assignment
                if (docData.relevanceScore !== undefined) updates.relevanceScore = docData.relevanceScore;
                if (docData.confidenceScore !== undefined) updates.confidenceScore = docData.confidenceScore;
                if (docData.summarySnippet !== undefined) updates.summarySnippet = docData.summarySnippet;
                if (docData.keyArguments !== undefined) updates.keyArguments = docData.keyArguments;
                if (docData.extractedQuotes !== undefined) updates.extractedQuotes = docData.extractedQuotes;
                if (docData.counterArguments !== undefined) updates.counterArguments = docData.counterArguments;
                if (docData.errorMessage !== undefined) updates.errorMessage = docData.errorMessage;
                if (docData.progress !== undefined) updates.progress = docData.progress;
                if (docData.estimatedTime !== undefined) updates.estimatedTime = docData.estimatedTime;
                if (docData.extractedEntities !== undefined) {
                  updates.extractedEntities = docData.extractedEntities.map(
                    (entity) => ({
                      name: entity.name,
                      type: entity.type as "Case" | "Statute" | "Regulation" | "Person" | "Organization" | "LegalConcept" | "Jurisdiction",
                      details: entity.details || "",
                    })
                  );
                }
                
                // Handle optional properties correctly - existing doc is already valid ClientAnalyzedDoc
                const existingDoc = newDocs[existingIndex] as ClientAnalyzedDoc;
                const updatedDoc = { ...existingDoc };
                
                // Only assign defined values to avoid exactOptionalPropertyTypes conflicts
                if (updates.docId !== undefined) updatedDoc.docId = updates.docId;
                if (updates.status !== undefined) updatedDoc.status = updates.status;
                if (updates.title !== undefined) updatedDoc.title = updates.title;
                if (updates.url !== undefined) updatedDoc.url = updates.url;
                if (updates.source !== undefined) updatedDoc.source = updates.source;
                if (updates.relevanceScore !== undefined) updatedDoc.relevanceScore = updates.relevanceScore;
                if (updates.confidenceScore !== undefined) updatedDoc.confidenceScore = updates.confidenceScore;
                if (updates.summarySnippet !== undefined) updatedDoc.summarySnippet = updates.summarySnippet;
                if (updates.keyArguments !== undefined) updatedDoc.keyArguments = updates.keyArguments;
                if (updates.extractedEntities !== undefined) updatedDoc.extractedEntities = updates.extractedEntities;
                if (updates.extractedQuotes !== undefined) updatedDoc.extractedQuotes = updates.extractedQuotes;
                if (updates.counterArguments !== undefined) updatedDoc.counterArguments = updates.counterArguments;
                if (updates.errorMessage !== undefined) updatedDoc.errorMessage = updates.errorMessage;
                if (updates.progress !== undefined) updatedDoc.progress = updates.progress;
                if (updates.estimatedTime !== undefined) updatedDoc.estimatedTime = updates.estimatedTime;
                
                newDocs[existingIndex] = updatedDoc;
                return newDocs;
              }
              // Add new document if it doesn't exist
              const timestamp = new Date().toISOString();
              const newDoc: ClientAnalyzedDoc = {
                docId: docData.docId,
                status: docData.status as any,
                timestamp,
              };
              
              // Only assign defined values
              if (docData.title !== undefined) newDoc.title = docData.title;
              if (docData.relevanceScore !== undefined) newDoc.relevanceScore = docData.relevanceScore;
              if (docData.confidenceScore !== undefined) newDoc.confidenceScore = docData.confidenceScore;
              if (docData.summarySnippet !== undefined) newDoc.summarySnippet = docData.summarySnippet;
              if (docData.keyArguments !== undefined) newDoc.keyArguments = docData.keyArguments;
              if (docData.extractedQuotes !== undefined) newDoc.extractedQuotes = docData.extractedQuotes;
              if (docData.counterArguments !== undefined) newDoc.counterArguments = docData.counterArguments;
              if (docData.errorMessage !== undefined) newDoc.errorMessage = docData.errorMessage;
              if (docData.progress !== undefined) newDoc.progress = docData.progress;
              if (docData.estimatedTime !== undefined) newDoc.estimatedTime = docData.estimatedTime;
              if (docData.extractedEntities !== undefined) {
                newDoc.extractedEntities = docData.extractedEntities.map((entity) => ({
                  name: entity.name,
                  type: entity.type as "Case" | "Statute" | "Regulation" | "Person" | "Organization" | "LegalConcept" | "Jurisdiction",
                  details: entity.details || "",
                }));
              }
              
              return [...prev, newDoc];
            });

            // Update accumulated documents as well
            setResearchSession((prev) => ({
              ...prev,
              accumulatedDocuments: prev.accumulatedDocuments.map((doc) => {
                if (doc.docId === docData.docId) {
                  const updates: Partial<ClientAnalyzedDoc> = {
                    status: docData.status as any,
                  };
                  
                  // Only assign defined values
                  if (docData.relevanceScore !== undefined) updates.relevanceScore = docData.relevanceScore;
                  if (docData.confidenceScore !== undefined) updates.confidenceScore = docData.confidenceScore;
                  if (docData.summarySnippet !== undefined) updates.summarySnippet = docData.summarySnippet;
                  
                  return { ...doc, ...updates };
                }
                return doc;
              }),
            }));

            logResearchEvent(
              "ANALYZING_DOCUMENTS",
              "DATA",
              `Document analyzed: ${docData.docId} (${docData.status})`
            );
          }
        } catch (error) {
          logResearchEvent(
            "SYSTEM_ERROR",
            "ERROR",
            `Failed to parse document.analyzed event: ${error}`
          );
        }
      });

      // Synthesis events
      resilientSource.addEventListener("synthesis.complete", (event) => {
        try {
          const eventData = JSON.parse((event as MessageEvent).data);
          const parsed = SynthesisCompleteEventSchema.safeParse(eventData);

          if (parsed.success) {
            const synthesisData = parsed.data;
            const timestamp = new Date().toISOString();

            const synthesis: ClientSynthesis = {
              topics: synthesisData.topics.map((topic) => ({
                ...topic,
                timestamp,
              })),
              unansweredAspects: synthesisData.unansweredAspects || [],
              emergingQuestions: synthesisData.emergingQuestions || [],
              reasoningSummary: synthesisData.reasoningSummary || "",
            };

            setSynthesisDetails(synthesis);
            setResearchSession((prev) => ({
              ...prev,
              accumulatedTopics: [
                ...prev.accumulatedTopics,
                ...synthesis.topics,
              ],
            }));

            logResearchEvent(
              "SYNTHESIZING_FINDINGS",
              "DATA",
              `Synthesis complete with ${synthesisData.topics.length} topics`
            );
          }
        } catch (error) {
          logResearchEvent(
            "SYSTEM_ERROR",
            "ERROR",
            `Failed to parse synthesis.complete event: ${error}`
          );
        }
      });

      // Assessment events
      resilientSource.addEventListener("assessment.complete", (event) => {
        try {
          const eventData = JSON.parse((event as MessageEvent).data);
          const parsed = AssessmentCompleteEventSchema.safeParse(eventData);

          if (parsed.success) {
            const assessmentData = parsed.data;

            const assessment: ClientResearchAssessment = {
              isSufficient: assessmentData.isSufficient,
              assessmentSummary: assessmentData.assessmentSummary,
              nextAction: assessmentData.nextAction,
              identifiedGaps: assessmentData.identifiedGaps || [],
            };
            
            // Handle optional properties correctly to avoid undefined assignment issues
            if (assessmentData.suggestedRefinementQueries !== undefined) {
              assessment.suggestedRefinementQueries = assessmentData.suggestedRefinementQueries.map(q => ({
                query_string: q.query_string,
                ...(q.expected_information_summary !== undefined && { 
                  expected_information_summary: q.expected_information_summary 
                }),
              }));
            }

            setResearchAssessment(assessment);

            logResearchEvent(
              "ASSESSING_RESEARCH",
              "DATA",
              `Assessment complete: ${assessmentData.nextAction}`
            );
          }
        } catch (error) {
          logResearchEvent(
            "SYSTEM_ERROR",
            "ERROR",
            `Failed to parse assessment.complete event: ${error}`
          );
        }
      });

      // Report chunk events (streaming report content)
      resilientSource.addEventListener("report.chunk", (event) => {
        try {
          const eventData = JSON.parse((event as MessageEvent).data);
          const parsed = ReportChunkEventSchema.safeParse(eventData);

          if (parsed.success) {
            const { fieldName, content, sectionInfo } = parsed.data;

            setFinalReportContent((prev) => {
              const newReport = { ...prev };

              if (fieldName === "title") {
                newReport.title = content;
              } else if (fieldName === "executiveSummary") {
                newReport.executiveSummary = content;
              } else if (fieldName === "conclusion") {
                newReport.conclusion = content;
              } else if (fieldName === "section" && sectionInfo) {
                const sections = [...(newReport.sections || [])];
                const existingIndex = sections.findIndex(
                  (s) => s.title === sectionInfo.title
                );

                if (existingIndex >= 0) {
                  sections[existingIndex] = {
                    title: sectionInfo.title,
                    content,
                  };
                } else {
                  sections.push({
                    title: sectionInfo.title,
                    content,
                  });
                }
                newReport.sections = sections;
              }

              return newReport;
            });

            logResearchEvent(
              "GENERATING_REPORT",
              "STREAM_CHUNK",
              `Report chunk: ${fieldName}${sectionInfo ? ` (${sectionInfo.title})` : ""}`
            );
          }
        } catch (error) {
          logResearchEvent(
            "SYSTEM_ERROR",
            "ERROR",
            `Failed to parse report.chunk event: ${error}`
          );
        }
      });

      // Note: Error events are now handled by ResilientEventSource callbacks

      // Completion events
      resilientSource.addEventListener("complete", (event) => {
        try {
          const eventData = JSON.parse((event as MessageEvent).data);
          const parsed = CompletionEventSchema.safeParse(eventData);

          if (parsed.success) {
            const { message, summary } = parsed.data;

            setResearchStatus((prev) => ({
              ...prev,
              stage: "COMPLETED",
              isLoading: false,
              error: null,
              message: message || "Research completed successfully",
            }));

            logResearchEvent(
              "COMPLETED",
              "INFO",
              `Research completed: ${summary?.documentsAnalyzed || 0} documents analyzed`
            );
          }

          cleanupResilientConnection();
        } catch (error) {
          logResearchEvent(
            "SYSTEM_ERROR",
            "ERROR",
            `Failed to parse complete event: ${error}`
          );
          cleanupResilientConnection();
        }
      });
    },
    [
      setResearchStatus,
      setGeneratedQueries,
      setAnalyzedDocs,
      setSynthesisDetails,
      setResearchAssessment,
      setFinalReportContent,
      setResearchSession,
      logResearchEvent,
    ]
  );

  // Cleanup function for resilient EventSource connection
  const cleanupResilientConnection = useCallback(() => {
    if (resilientEventSource) {
      resilientEventSource.disconnect();
      setResilientEventSource(null);
    }
  }, [resilientEventSource]);

  /**
   * Initiates the legal research process using ResilientEventSource SSE connection.
   */
  const startResearch = useCallback(
    async (legalQuestion: string) => {
      initializeResearchSession(legalQuestion);

      try {
        // Create streaming URL with research parameters
        const streamingUrl = createStreamingURL("/api/research/stream", {
          legalQuestion,
          autoMode: autoModeState.isEnabled.toString(),
          maxIterations: autoModeState.maxIterations.toString(),
          currentIteration: autoModeState.currentIteration.toString(),
        });

        // Create ResilientEventSource with callbacks for connection management
        const resilientSource = new ResilientEventSource(
          streamingUrl,
          {
            onConnectionEstablished: () => {
              logResearchEvent(
                "INITIALIZING",
                "INFO",
                `EventSource connection established successfully: ${streamingUrl}`
              );
              setConnectionState(prev => ({
                ...prev,
                isConnected: true,
                isConnecting: false,
                lastConnectionTime: Date.now(),
                lastError: null,
                retryAttempt: 0,
                connectionStats: {
                  ...prev.connectionStats,
                  successfulConnections: prev.connectionStats.successfulConnections + 1,
                },
              }));
            },
            onError: (error, willRetry, attempt) => {
              setConnectionState(prev => ({
                ...prev,
                isConnected: false,
                lastErrorTime: Date.now(),
                lastError: error.message,
                retryAttempt: attempt,
                connectionStats: {
                  ...prev.connectionStats,
                  failedConnections: prev.connectionStats.failedConnections + 1,
                  totalAttempts: prev.connectionStats.totalAttempts + 1,
                },
              }));
              
              const errorMessage = `Connection error (attempt ${attempt}): ${error.message}`;
              logResearchEvent("CONNECTION_ERROR", "ERROR", errorMessage);
              
              // Add connection warning
              addSystemWarning(
                'CONNECTION',
                errorMessage,
                willRetry ? 'medium' : 'high',
                willRetry
              );
              
              if (!willRetry) {
                setResearchStatus((prev) => ({
                  ...prev,
                  stage: "ERROR",
                  isLoading: false,
                  error: error.message,
                  message: "Research connection failed. Please try again.",
                }));
              }
            },
            onRetryAttempt: (attempt, delayMs) => {
              logResearchEvent(
                "RECONNECTING",
                "INFO",
                `Reconnection attempt ${attempt} in ${delayMs}ms`
              );
              setConnectionState(prev => ({
                ...prev,
                isConnecting: true,
                retryAttempt: attempt,
                nextRetryDelay: delayMs,
              }));
              setResearchStatus((prev) => ({
                ...prev,
                stage: "INITIALIZING",
                message: `Reconnecting... (attempt ${attempt})`,
              }));
            },
            onConnectionFailed: (finalError) => {
              handleStreamError(finalError);
            },
            onMaxRetriesReached: () => {
              const error = new Error("Maximum connection retries reached");
              handleStreamError(error);
              logResearchEvent(
                "CONNECTION_ERROR",
                "ERROR",
                "Maximum connection retries reached. Please check your network connection."
              );
            },
          },
          {
            maxRetryAttempts: 3,
            initialBackoffMs: 1000,
            maxBackoffMs: 10000,
            backoffMultiplier: 2,
            connectionTimeoutMs: 120000, // 2 minutes for BAML operations
          }
        );

        setResilientEventSource(resilientSource);

        // Set up event listeners for different SSE events
        setupEventListeners(resilientSource);

        // Attempt to connect
        await resilientSource.connect();

        logResearchEvent(
          "INITIALIZING",
          "INFO",
          `ResilientEventSource created for: ${streamingUrl}`
        );
      } catch (error) {
        handleStreamError(
          error instanceof Error
            ? error
            : new Error("Failed to establish EventSource connection")
        );
      }
    },
    [
      initializeResearchSession,
      autoModeState.isEnabled,
      autoModeState.maxIterations,
      autoModeState.currentIteration,
      logResearchEvent,
      setupEventListeners,
      handleStreamError,
    ]
  );

  /**
   * Resumes the research process from where it was paused.
   */
  const resumeResearch = useCallback(async () => {
    if (!researchStatus.canResume || !autoModeState.originalQuestion) {
      return;
    }

    setResearchStatus((prev) => ({
      ...prev,
      isPaused: false,
      isLoading: true,
      stage: "INITIALIZING",
      message: "Resuming research...",
    }));

    logResearchEvent("RESUMING", "INFO", "Research process resumed");

    try {
      // Create streaming URL with research parameters including accumulated documents
      const streamingUrl = createStreamingURL("/api/research/stream", {
        legalQuestion: autoModeState.originalQuestion,
        autoMode: autoModeState.isEnabled.toString(),
        maxIterations: autoModeState.maxIterations.toString(),
        currentIteration: autoModeState.currentIteration.toString(),
        // Include previously analyzed documents for resume functionality
        resumeFromDocuments: JSON.stringify(
          researchSession.accumulatedDocuments.map((doc) => doc.docId)
        ),
      });

      // Create ResilientEventSource for resume
      const resilientSource = new ResilientEventSource(
        streamingUrl,
        {
          onConnectionEstablished: () => {
            logResearchEvent(
              "RESUMING",
              "INFO",
              `EventSource connection resumed successfully: ${streamingUrl}`
            );
            setConnectionState(prev => ({
              ...prev,
              isConnected: true,
              isConnecting: false,
              lastConnectionTime: Date.now(),
              lastError: null,
              retryAttempt: 0,
              connectionStats: {
                ...prev.connectionStats,
                successfulConnections: prev.connectionStats.successfulConnections + 1,
              },
            }));
          },
          onError: (error, willRetry, attempt) => {
            setConnectionState(prev => ({
              ...prev,
              isConnected: false,
              lastErrorTime: Date.now(),
              lastError: error.message,
              retryAttempt: attempt,
              connectionStats: {
                ...prev.connectionStats,
                failedConnections: prev.connectionStats.failedConnections + 1,
                totalAttempts: prev.connectionStats.totalAttempts + 1,
              },
            }));
            
            const errorMessage = `Resume connection error (attempt ${attempt}): ${error.message}`;
            logResearchEvent("CONNECTION_ERROR", "ERROR", errorMessage);
            
            if (!willRetry) {
              setResearchStatus((prev) => ({
                ...prev,
                stage: "ERROR",
                isLoading: false,
                error: error.message,
                message: "Resume connection failed. Please try again.",
              }));
            }
          },
          onRetryAttempt: (attempt, delayMs) => {
            logResearchEvent(
              "RECONNECTING",
              "INFO",
              `Resume reconnection attempt ${attempt} in ${delayMs}ms`
            );
            setResearchStatus((prev) => ({
              ...prev,
              stage: "INITIALIZING",
              message: `Reconnecting resume... (attempt ${attempt})`,
            }));
          },
          onConnectionFailed: (finalError) => {
            handleStreamError(finalError);
          },
        },
        {
          maxRetryAttempts: 3,
          initialBackoffMs: 1000,
          maxBackoffMs: 10000,
          backoffMultiplier: 2,
          connectionTimeoutMs: 120000, // 2 minutes for BAML operations
        }
      );

      setResilientEventSource(resilientSource);

      // Set up event listeners
      setupEventListeners(resilientSource);

      // Attempt to connect
      await resilientSource.connect();

      // Log connection re-establishment
      logResearchEvent(
        "INITIALIZING",
        "INFO",
        `ResilientEventSource resume connection created: ${streamingUrl}`
      );
    } catch (error) {
      handleStreamError(
        error instanceof Error
          ? error
          : new Error("Failed to resume EventSource connection")
      );
    }
  }, [
    researchStatus.canResume,
    autoModeState.originalQuestion,
    autoModeState.isEnabled,
    autoModeState.maxIterations,
    autoModeState.currentIteration,
    researchSession.accumulatedDocuments,
    setResearchStatus,
    logResearchEvent,
    setupEventListeners,
    handleStreamError,
  ]);

  /**
   * Pauses the current research process.
   */
  const pauseResearch = useCallback(() => {
    if (resilientEventSource) {
      resilientEventSource.disconnect();
    }

    setResearchStatus((prev) => ({
      ...prev,
      isPaused: true,
      isLoading: false,
      canResume: true,
      stage: "ITERATION_PAUSED",
      message: "Research paused by user",
    }));

    logResearchEvent("PAUSED", "INFO", "Research process paused by user");
    setResilientEventSource(null);
  }, [resilientEventSource, setResearchStatus, logResearchEvent]);

  /**
   * Aborts the current research process completely.
   */
  const abortResearch = useCallback(() => {
    if (resilientEventSource) {
      resilientEventSource.disconnect();
      console.log("useResearchAgent: ResilientEventSource connection closed.");
    } else {
      console.log("useResearchAgent: No active research connection to abort.");
    }

    // Clean up any orphaned documents
    cleanupOrphanedDocuments();

    setResearchStatus((prev) => ({
      ...prev,
      isLoading: false,
      isPaused: false,
      canResume: false,
      stage: "IDLE",
      error: "Research manually aborted.",
      message: "Research aborted by user",
    }));

    logResearchEvent("USER_ACTION", "INFO", "Research abortion requested");
    setResilientEventSource(null);
  }, [
    resilientEventSource,
    setResearchStatus,
    logResearchEvent,
    cleanupOrphanedDocuments,
  ]);

  /**
   * Toggles the auto mode setting.
   */
  const toggleAutoMode = useCallback(() => {
    setAutoModeState((prev) => ({
      ...prev,
      isEnabled: !prev.isEnabled,
    }));
  }, [setAutoModeState]);

  /**
   * Retry connection manually - uses the last legal question
   */
  const retryConnection = useCallback(async () => {
    if (!autoModeState.originalQuestion) {
      console.warn('Cannot retry connection: No original question available');
      return;
    }

    // Reset connection state
    setConnectionState(prev => ({
      ...prev,
      retryAttempt: 0,
      lastError: null,
      nextRetryDelay: null,
    }));

    // Clear connection warnings
    setSystemHealth(prev => ({
      ...prev,
      warnings: prev.warnings.filter(w => w.type !== 'CONNECTION'),
    }));

    // Start research with existing question
    await startResearch(autoModeState.originalQuestion);
  }, [autoModeState.originalQuestion, startResearch, setConnectionState, setSystemHealth]);

  return {
    startResearch,
    resumeResearch,
    pauseResearch,
    abortResearch,
    retryConnection,
    isLoading: researchStatus.isLoading,
    currentStage: researchStatus.stage,
    currentMessage: researchStatus.message,
    error: researchStatus.error,
    isPaused: researchStatus.isPaused || false,
    canResume: researchStatus.canResume || false,
    autoModeEnabled: autoModeState.isEnabled,
    toggleAutoMode,
    // Connection state
    connectionState,
    systemHealth,
    // Manual controls
    dismissWarning,
    checkSystemHealth,
  };
}
