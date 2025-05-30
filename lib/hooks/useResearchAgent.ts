"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useState } from "react";

import { conductResearch } from "@/app/actions/researchAgentOrchestrator";
import type {
  ResearchStage,
  ResearchUpdate,
} from "@/app/actions/researchAgentOrchestrator";
import {
  analyzedDocsSummaryAtom,
  autoModeStateAtom,
  finalReportContentAtom,
  generatedQueriesAtom,
  researchAssessmentAtom,
  researchLogAtom,
  researchSessionAtom,
  researchStatusAtom,
  resetResearchStateAtom,
  synthesisDetailsAtom,
} from "@/lib/state/researchAtoms";
import type {
  ClientAnalyzedDoc,
  ClientResearchAssessment,
  ClientSynthesis,
  ResearchStatus,
} from "@/lib/state/researchAtoms";

interface QueryData {
  query_string: string;
  expected_information_summary: string;
}

interface ReportData {
  report_title?: string;
  executive_summary_chunk?: string;
  executiveSummary?: string;
  sectionUpdate?: {
    title?: string;
    content_chunk?: string;
  };
  sections?: Array<{ title: string; content: string }>;
  conclusion_chunk?: string;
  conclusion?: string;
  limitations?: string[];
  appendixDocIds?: string[];
}

interface UseResearchAgentReturn {
  startResearch: (legalQuestion: string) => Promise<void>;
  resumeResearch: () => Promise<void>;
  pauseResearch: () => void;
  abortResearch: () => void;
  isLoading: boolean;
  currentStage: ResearchStage | null;
  currentMessage: string | undefined;
  error: string | null;
  isPaused: boolean;
  canResume: boolean;
  autoModeEnabled: boolean;
  toggleAutoMode: () => void;
}

/**
 * Custom React hook for managing the legal research process workflow.
 *
 * This hook serves as the primary interface between UI components and the research pipeline,
 * orchestrating the entire research lifecycle from query generation to final report creation.
 * It manages the connection to the server-side research orchestrator and updates Jotai atoms
 * based on streaming updates received from the backend.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const agent = useResearchAgent();
 *
 *   const handleSubmit = () => {
 *     agent.startResearch("What are the requirements for software patents?");
 *   };
 *
 *   if (agent.isLoading) {
 *     return <div>Research in progress: {agent.currentStage}</div>;
 *   }
 *
 *   return (
 *     <button onClick={handleSubmit}>
 *       Start Research
 *     </button>
 *   );
 * }
 * ```
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
  const resetAllResearchState = useSetAtom(resetResearchStateAtom);
  const autoModeState = useAtomValue(autoModeStateAtom);

  // Local state for the AbortController
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  /**
   * Initiates the legal research process for a given legal question.
   *
   * This function resets all previous research state, establishes a new research session,
   * and begins streaming updates from the server-side orchestrator. It handles the complete
   * research lifecycle including query generation, document fetching, analysis, synthesis,
   * and report generation.
   *
   * @param {string} legalQuestion - The legal question to research
   * @throws {Error} Throws an error if the research process fails to initialize
   *
   * @example
   * ```ts
   * await startResearch("What are the patent requirements for AI-generated inventions?");
   * ```
   */
  const startResearch = useCallback(
    async (legalQuestion: string) => {
      // Reset all relevant Jotai states before starting a new research process
      resetAllResearchState(undefined);

      // Set up auto mode state
      setAutoModeState((prev) => ({
        ...prev,
        originalQuestion: legalQuestion,
        currentIteration: 0,
      }));

      // Generate session ID for tracking
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
      setResearchLog((prev) => [
        ...prev,
        `${new Date().toISOString()} [INITIALIZING] Research process initiated for: "${legalQuestion}"`,
      ]);

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const stream = await conductResearch(legalQuestion, {
          isEnabled: autoModeState.isEnabled,
          maxIterations: autoModeState.maxIterations,
          currentIteration: autoModeState.currentIteration,
        });

        const reader = stream
          .pipeThrough(new TextDecoderStream(), {
            signal: controller.signal,
          })
          .getReader();

        while (true) {
          try {
            const { value, done } = await reader.read();

            if (controller.signal.aborted) {
              console.log("Stream reading aborted by AbortController.");
              break;
            }

            if (done) {
              // Stream finished successfully from the server side
              setResearchStatus((prev: ResearchStatus) => {
                const finalStage = prev.error
                  ? "ERROR"
                  : prev.stage || "COMPLETED";
                const newMessage = prev.error
                  ? prev.message || "Research failed."
                  : prev.message || "Research process completed.";
                return {
                  ...prev,
                  isLoading: false,
                  stage: finalStage,
                  message: newMessage,
                  isPaused: false,
                  canResume: false,
                };
              });
              setResearchLog((prev) => [
                ...prev,
                `${new Date().toISOString()} [COMPLETED] Stream ended.`,
              ]);
              setAbortController(null);
              break;
            }

            if (value) {
              const stringUpdates = value
                .split("\n")
                .filter((s) => s.trim() !== "");
              for (const stringUpdate of stringUpdates) {
                if (controller.signal.aborted) continue;
                try {
                  const update = JSON.parse(stringUpdate) as ResearchUpdate;

                  // Update researchLogAtom first
                  setResearchLog((prevLogs) => [
                    ...prevLogs,
                    `${new Date().toISOString()} [${update.stage}] (${update.type}) ${update.message || ""}`.trim(),
                  ]);

                  // Update researchStatusAtom based on any incoming status
                  setResearchStatus((prevStatus: ResearchStatus) => {
                    const newMessage = update.message || prevStatus.message;
                    const newCurrentProcessedDoc =
                      update.currentProcessedDoc !== undefined
                        ? update.currentProcessedDoc
                        : prevStatus.currentProcessedDoc;
                    const newTotalDocsToProcess =
                      update.totalDocsToProcess !== undefined
                        ? update.totalDocsToProcess
                        : prevStatus.totalDocsToProcess;
                    const newCurrentStreamingField =
                      update.fieldName || prevStatus.currentStreamingField;

                    return {
                      ...prevStatus,
                      stage: update.stage,
                      isLoading: true, // Still loading while stream is active
                      ...(newMessage && { message: newMessage }),
                      ...(newCurrentProcessedDoc !== undefined && {
                        currentProcessedDoc: newCurrentProcessedDoc,
                      }),
                      ...(newTotalDocsToProcess !== undefined && {
                        totalDocsToProcess: newTotalDocsToProcess,
                      }),
                      ...(newCurrentStreamingField && {
                        currentStreamingField: newCurrentStreamingField,
                      }),
                    };
                  });

                  switch (update.type) {
                    case "STATUS_CHANGE":
                    case "PROGRESS":
                    case "LOG":
                      // Status and Log already handled by updating researchStatusAtom and researchLogAtom above
                      break;
                    case "DATA":
                      // Update specific data atoms based on update.stage and update.data
                      if (
                        update.stage === "GENERATING_QUERIES" &&
                        update.data &&
                        typeof update.data === "object" &&
                        "queries" in update.data
                      ) {
                        const queryData = update.data as {
                          queries: QueryData[];
                        };
                        const timestamp = new Date().toISOString();
                        const newQueries = queryData.queries.map(
                          (q: QueryData) => ({
                            query_string: q.query_string,
                            expected_information_summary:
                              q.expected_information_summary,
                            timestamp,
                          })
                        );

                        // Update current queries (for immediate display)
                        setGeneratedQueries(newQueries);

                        // Accumulate queries for session tracking
                        setResearchSession((prev) => ({
                          ...prev,
                          accumulatedQueries: [
                            ...prev.accumulatedQueries,
                            ...newQueries,
                          ],
                        }));
                      } else if (
                        update.stage === "ANALYZING_DOCUMENTS" &&
                        update.data &&
                        typeof update.data === "object" &&
                        "docId" in update.data
                      ) {
                        const docData =
                          update.data as Partial<ClientAnalyzedDoc> & {
                            docId: string;
                          };
                        const timestamp = new Date().toISOString();
                        const docWithTimestamp = {
                          ...docData,
                          timestamp,
                        } as ClientAnalyzedDoc;

                        setAnalyzedDocs((prevDocs) => {
                          const existingDocIndex = prevDocs.findIndex(
                            (d) => d.docId === docData.docId
                          );
                          if (existingDocIndex > -1) {
                            const updatedDocs = [...prevDocs];
                            updatedDocs[existingDocIndex] = {
                              ...updatedDocs[existingDocIndex],
                              ...docWithTimestamp,
                            };
                            return updatedDocs;
                          }
                          return [...prevDocs, docWithTimestamp];
                        });

                        // Accumulate documents for session tracking
                        setResearchSession((prev) => {
                          const existingAccumulatedIndex =
                            prev.accumulatedDocuments.findIndex(
                              (d) => d.docId === docData.docId
                            );
                          if (existingAccumulatedIndex > -1) {
                            const updatedAccumulated = [
                              ...prev.accumulatedDocuments,
                            ];
                            updatedAccumulated[existingAccumulatedIndex] = {
                              ...updatedAccumulated[existingAccumulatedIndex],
                              ...docWithTimestamp,
                            };
                            return {
                              ...prev,
                              accumulatedDocuments: updatedAccumulated,
                            };
                          }
                          return {
                            ...prev,
                            accumulatedDocuments: [
                              ...prev.accumulatedDocuments,
                              docWithTimestamp,
                            ],
                          };
                        });
                      } else if (
                        update.stage === "SYNTHESIZING_FINDINGS" &&
                        update.data &&
                        typeof update.data === "object" &&
                        "topics" in update.data
                      ) {
                        const synthesisData = update.data as ClientSynthesis;
                        const timestamp = new Date().toISOString();
                        const topicsWithTimestamp = synthesisData.topics.map(
                          (topic) => ({
                            ...topic,
                            timestamp,
                          })
                        );

                        const updatedSynthesis = {
                          ...synthesisData,
                          topics: topicsWithTimestamp,
                        };

                        setSynthesisDetails(updatedSynthesis);

                        // Accumulate topics for session tracking
                        setResearchSession((prev) => ({
                          ...prev,
                          accumulatedTopics: [
                            ...prev.accumulatedTopics,
                            ...topicsWithTimestamp,
                          ],
                        }));
                      } else if (
                        update.stage === "ASSESSING_RESEARCH" &&
                        update.data &&
                        typeof update.data === "object"
                      ) {
                        // Handle research assessment data
                        setResearchAssessment(
                          update.data as ClientResearchAssessment
                        );
                      } else if (
                        update.stage === "GENERATING_REPORT" &&
                        update.data
                      ) {
                        const reportData = update.data as ReportData;
                        setFinalReportContent((prevReport) => {
                          const newReport = {
                            ...prevReport,
                          };
                          if (reportData.report_title)
                            newReport.title = reportData.report_title;

                          // Handle streaming text for specific fields
                          if (
                            update.fieldName === "executiveSummary" &&
                            reportData.executive_summary_chunk
                          ) {
                            newReport.executiveSummary =
                              (update.isFieldComplete
                                ? ""
                                : prevReport.executiveSummary) +
                              reportData.executive_summary_chunk;
                          } else if (
                            reportData.executiveSummary &&
                            update.isFinalForStage
                          ) {
                            newReport.executiveSummary =
                              reportData.executiveSummary;
                          }

                          if (
                            update.fieldName?.startsWith("sectionContent_") &&
                            reportData.sectionUpdate
                          ) {
                            const sectionIndex = Number.parseInt(
                              update.fieldName.split("_")[1],
                              10
                            );
                            const chunk =
                              reportData.sectionUpdate.content_chunk;
                            newReport.sections = [
                              ...(prevReport.sections || []),
                            ];
                            if (!newReport.sections[sectionIndex]) {
                              newReport.sections[sectionIndex] = {
                                title:
                                  reportData.sectionUpdate.title ||
                                  `Section ${sectionIndex + 1}`,
                                content: "",
                              };
                            } else if (reportData.sectionUpdate.title) {
                              newReport.sections[sectionIndex].title =
                                reportData.sectionUpdate.title;
                            }
                            newReport.sections[sectionIndex].content =
                              (update.isFieldComplete
                                ? ""
                                : newReport.sections[sectionIndex].content) +
                              (chunk || "");
                          } else if (
                            reportData.sections &&
                            update.isFinalForStage
                          ) {
                            newReport.sections = reportData.sections;
                          }

                          if (
                            update.fieldName === "conclusion" &&
                            reportData.conclusion_chunk
                          ) {
                            newReport.conclusion =
                              (update.isFieldComplete
                                ? ""
                                : prevReport.conclusion) +
                              reportData.conclusion_chunk;
                          } else if (
                            reportData.conclusion &&
                            update.isFinalForStage
                          ) {
                            newReport.conclusion = reportData.conclusion;
                          }

                          // Handle non-streaming parts of final report data
                          if (update.isFinalForStage) {
                            if (reportData.limitations)
                              newReport.limitations = reportData.limitations;
                            if (reportData.appendixDocIds)
                              newReport.appendixDocIds =
                                reportData.appendixDocIds;
                          }

                          return newReport;
                        });
                      }
                      break;
                    case "ERROR":
                      setResearchStatus({
                        stage: update.stage,
                        isLoading: false,
                        error:
                          update.message ||
                          "An error occurred during streaming.",
                        ...(update.message && { message: update.message }),
                      });
                      // Don't throw here, just set the error state and continue reading stream
                      // The stream will naturally end with the done condition above
                      break;
                  }
                } catch (parseError: unknown) {
                  console.error(
                    "Error parsing streamed JSON update:",
                    parseError,
                    "Raw chunk:",
                    stringUpdate
                  );
                  setResearchLog((prev) => [
                    ...prev,
                    `${new Date().toISOString()} [SYSTEM_ERROR] Failed to parse stream update: ${stringUpdate}`,
                  ]);
                }
              }
            }
          } catch (streamReadError: unknown) {
            const errorMessage =
              streamReadError instanceof Error
                ? streamReadError.message
                : "Unknown stream error";
            const errorName =
              streamReadError instanceof Error
                ? streamReadError.name
                : undefined;

            if (controller.signal.aborted || errorName === "AbortError") {
              console.log("Stream reading was aborted.");
              setResearchStatus((prev: ResearchStatus) => ({
                ...prev,
                isLoading: false,
                message: prev.error || "Research aborted.",
              }));
            } else {
              console.error("Error reading from stream:", streamReadError);
              setResearchStatus({
                stage: "ERROR",
                isLoading: false,
                error: errorMessage || "Stream read error",
                message: "Error reading stream.",
              });
              setResearchLog((prev) => [
                ...prev,
                `${new Date().toISOString()} [STREAM_ERROR] Error reading stream: ${errorMessage}`,
              ]);
            }
            setAbortController(null);
            break;
          }
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorName = error instanceof Error ? error.name : undefined;

        console.error("Error calling conductResearch server action:", error);
        if (errorName === "AbortError") {
          setResearchStatus({
            stage: "IDLE",
            isLoading: false,
            error: "Research aborted by client before stream started.",
            message: "Aborted.",
          });
          setResearchLog((prev) => [
            ...prev,
            `${new Date().toISOString()} [ERROR] Research aborted before stream started.`,
          ]);
        } else {
          setResearchStatus({
            stage: "ERROR",
            isLoading: false,
            error: errorMessage || "Failed to start research.",
            message: "Error starting research.",
          });
          setResearchLog((prev) => [
            ...prev,
            `${new Date().toISOString()} [ERROR] Failed to start research: ${errorMessage}`,
          ]);
        }
        setAbortController(null);
      }
    },
    [
      resetAllResearchState,
      setResearchStatus,
      setResearchLog,
      setGeneratedQueries,
      setAnalyzedDocs,
      setSynthesisDetails,
      setFinalReportContent,
      setResearchAssessment,
      setResearchSession,
      setAutoModeState,
      autoModeState,
    ]
  );

  /**
   * Aborts the currently running research process.
   *
   * This function safely terminates any ongoing research by aborting the stream reading
   * and updating the research status to reflect the abortion. If no research is currently
   * active, it logs a message but does not throw an error.
   *
   * @example
   * ```ts
   * abortResearch(); // Safely aborts any ongoing research
   * ```
   */
  /**
   * Pauses the currently running research process.
   */
  const pauseResearch = useCallback(() => {
    if (abortController) {
      console.log("useResearchAgent: Pause signal sent.");
      setResearchStatus((prev: ResearchStatus) => ({
        ...prev,
        isPaused: true,
        canResume: true,
        message: "Research paused by user.",
      }));
      setResearchLog((prev) => [
        ...prev,
        `${new Date().toISOString()} [USER_ACTION] Research paused.`,
      ]);
    }
  }, [abortController, setResearchStatus, setResearchLog]);

  /**
   * Resumes a paused research process with accumulated data.
   */
  const resumeResearch = useCallback(async () => {
    // Implementation will depend on orchestrator support for resume
    console.log("useResearchAgent: Resume functionality not yet implemented.");
    setResearchLog((prev) => [
      ...prev,
      `${new Date().toISOString()} [USER_ACTION] Resume requested (not yet implemented).`,
    ]);
  }, [setResearchLog]);

  /**
   * Toggles auto mode on/off.
   */
  const toggleAutoMode = useCallback(() => {
    setAutoModeState((prev) => ({
      ...prev,
      isEnabled: !prev.isEnabled,
    }));
  }, [setAutoModeState]);

  const abortResearch = useCallback(() => {
    if (abortController) {
      console.log("useResearchAgent: Abort signal sent.");
      abortController.abort();
      setResearchStatus((prev: ResearchStatus) => ({
        ...prev,
        isLoading: false,
        error: "Research manually aborted.",
        message: "Research process aborted by user.",
        isPaused: false,
        canResume: false,
      }));
      setResearchLog((prev) => [
        ...prev,
        `${new Date().toISOString()} [USER_ACTION] Research abortion requested.`,
      ]);
    } else {
      console.log("useResearchAgent: No active research to abort.");
    }
  }, [abortController, setResearchStatus, setResearchLog]);

  // Read global loading/error state for exporting from the hook
  const currentStatus = useAtomValue(researchStatusAtom);

  return {
    startResearch,
    resumeResearch,
    pauseResearch,
    abortResearch,
    isLoading: currentStatus.isLoading,
    currentStage: currentStatus.stage,
    currentMessage: currentStatus.message,
    error: currentStatus.error,
    isPaused: currentStatus.isPaused || false,
    canResume: currentStatus.canResume || false,
    autoModeEnabled: autoModeState.isEnabled,
    toggleAutoMode,
  };
}
