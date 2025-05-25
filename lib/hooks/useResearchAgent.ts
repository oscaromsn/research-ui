'use client';

import { useState, useCallback } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import {
  researchStatusAtom,
  researchLogAtom,
  generatedQueriesAtom,
  analyzedDocsSummaryAtom,
  synthesisDetailsAtom,
  finalReportContentAtom,
  resetResearchStateAtom,
} from '@/lib/state/researchAtoms';
import type {
  ClientAnalyzedDoc,
  ClientSynthesis,
} from '@/lib/state/researchAtoms';
import {
  conductResearch,
} from '@/app/actions/researchAgentOrchestrator';
import type {
  ResearchUpdate,
} from '@/app/actions/researchAgentOrchestrator';

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

export function useResearchAgent() {
  // Get Jotai setters
  const setResearchStatus = useSetAtom(researchStatusAtom);
  const setResearchLog = useSetAtom(researchLogAtom);
  const setGeneratedQueries = useSetAtom(generatedQueriesAtom);
  const setAnalyzedDocs = useSetAtom(analyzedDocsSummaryAtom);
  const setSynthesisDetails = useSetAtom(synthesisDetailsAtom);
  const setFinalReportContent = useSetAtom(finalReportContentAtom);
  const resetAllResearchState = useSetAtom(resetResearchStateAtom);

  // Local state for the AbortController
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const startResearch = useCallback(async (legalQuestion: string) => {
    // Reset all relevant Jotai states before starting a new research process
    resetAllResearchState(undefined);

    setResearchStatus({
      stage: "INITIALIZING",
      isLoading: true,
      error: null,
      message: "Initializing research...",
      currentProcessedDoc: 0,
      totalDocsToProcess: 0,
      currentStreamingField: undefined,
    });
    setResearchLog(prev => [...prev, `${new Date().toISOString()} [INITIALIZING] Research process initiated for: "${legalQuestion}"`]);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const stream = await conductResearch(legalQuestion);
      
      const reader = stream.pipeThrough(new TextDecoderStream(), { signal: controller.signal }).getReader();
      
      while (true) {
        try {
          const { value, done } = await reader.read();

          if (controller.signal.aborted) {
            console.log("Stream reading aborted by AbortController.");
            break;
          }

          if (done) {
            // Stream finished successfully from the server side
            let finalStatus: "ERROR" | "COMPLETED" = "COMPLETED";
            setResearchStatus(prev => {
              const finalStage = prev.stage === "INITIALIZING" && !prev.error ? "COMPLETED" : prev.stage;
              finalStatus = prev.error ? "ERROR" : "COMPLETED";
              return {
                ...prev,
                isLoading: false,
                // Don't override stage; only set COMPLETED if still INITIALIZING and no error
                stage: finalStage,
                message: prev.stage === "INITIALIZING" && !prev.error ? "Research process completed." : prev.message,
              };
            });
            setResearchLog(prev => [...prev, `${new Date().toISOString()} [${finalStatus}] Stream ended.`]);
            setAbortController(null);
            break;
          }

          if (value) {
            const stringUpdates = value.split('\n').filter(s => s.trim() !== '');
            for (const stringUpdate of stringUpdates) {
              if (controller.signal.aborted) continue;
              try {
                const update = JSON.parse(stringUpdate) as ResearchUpdate;

                // Update researchLogAtom first
                setResearchLog(prevLogs => [...prevLogs, `${new Date().toISOString()} [${update.stage}] (${update.type}) ${update.message || ''}`.trim()]);

                // Update researchStatusAtom based on any incoming status
                setResearchStatus(prevStatus => ({
                  ...prevStatus,
                  stage: update.stage,
                  isLoading: true, // Still loading while stream is active
                  message: update.message || prevStatus.message,
                  currentProcessedDoc: update.currentProcessedDoc !== undefined ? update.currentProcessedDoc : prevStatus.currentProcessedDoc,
                  totalDocsToProcess: update.totalDocsToProcess !== undefined ? update.totalDocsToProcess : prevStatus.totalDocsToProcess,
                  currentStreamingField: update.fieldName || prevStatus.currentStreamingField,
                }));

                switch (update.type) {
                  case "STATUS_CHANGE":
                  case "PROGRESS":
                  case "LOG":
                    // Status and Log already handled by updating researchStatusAtom and researchLogAtom above
                    break;
                  case "DATA":
                    // Update specific data atoms based on update.stage and update.data
                    if (update.stage === "GENERATING_QUERIES" && update.data && typeof update.data === 'object' && 'queries' in update.data) {
                      const queryData = update.data as { queries: QueryData[] };
                      setGeneratedQueries(queryData.queries.map((q: QueryData) => ({
                        query_string: q.query_string,
                        expected_information_summary: q.expected_information_summary,
                      })));
                    } else if (update.stage === "ANALYZING_DOCUMENTS" && update.data && typeof update.data === 'object' && 'docId' in update.data) {
                      const docData = update.data as Partial<ClientAnalyzedDoc> & {docId: string};
                      setAnalyzedDocs(prevDocs => {
                        const existingDocIndex = prevDocs.findIndex(d => d.docId === docData.docId);
                        if (existingDocIndex > -1) {
                          const updatedDocs = [...prevDocs];
                          updatedDocs[existingDocIndex] = { ...updatedDocs[existingDocIndex], ...docData };
                          return updatedDocs;
                        }
                        return [...prevDocs, docData as ClientAnalyzedDoc];
                      });
                    } else if (update.stage === "SYNTHESIZING_FINDINGS" && update.data && typeof update.data === 'object' && 'topics' in update.data) {
                      setSynthesisDetails(update.data as ClientSynthesis);
                    } else if (update.stage === "GENERATING_REPORT" && update.data) {
                      const reportData = update.data as ReportData;
                      setFinalReportContent(prevReport => {
                        const newReport = { ...prevReport };
                        if (reportData.report_title) newReport.title = reportData.report_title;

                        // Handle streaming text for specific fields
                        if (update.fieldName === "executiveSummary" && reportData.executive_summary_chunk) {
                          newReport.executiveSummary = (update.isFieldComplete ? '' : prevReport.executiveSummary) + reportData.executive_summary_chunk;
                        } else if (reportData.executiveSummary && update.isFinalForStage) {
                          newReport.executiveSummary = reportData.executiveSummary;
                        }

                        if (update.fieldName?.startsWith("sectionContent_") && reportData.sectionUpdate) {
                          const sectionIndex = Number.parseInt(update.fieldName.split("_")[1], 10);
                          const chunk = reportData.sectionUpdate.content_chunk;
                          newReport.sections = [...(prevReport.sections || [])];
                          if (!newReport.sections[sectionIndex]) {
                            newReport.sections[sectionIndex] = { title: reportData.sectionUpdate.title || `Section ${sectionIndex + 1}`, content: "" };
                          } else if (reportData.sectionUpdate.title) {
                            newReport.sections[sectionIndex].title = reportData.sectionUpdate.title;
                          }
                          newReport.sections[sectionIndex].content = (update.isFieldComplete ? '' : newReport.sections[sectionIndex].content) + (chunk || '');
                        } else if (reportData.sections && update.isFinalForStage) {
                          newReport.sections = reportData.sections;
                        }

                        if (update.fieldName === "conclusion" && reportData.conclusion_chunk) {
                          newReport.conclusion = (update.isFieldComplete ? '' : prevReport.conclusion) + reportData.conclusion_chunk;
                        } else if (reportData.conclusion && update.isFinalForStage) {
                          newReport.conclusion = reportData.conclusion;
                        }

                        // Handle non-streaming parts of final report data
                        if (update.isFinalForStage) {
                          if(reportData.limitations) newReport.limitations = reportData.limitations;
                          if(reportData.appendixDocIds) newReport.appendixDocIds = reportData.appendixDocIds;
                        }

                        return newReport;
                      });
                    }
                    break;
                  case "ERROR":
                    setResearchStatus({ 
                      stage: update.stage, 
                      isLoading: false, 
                      error: update.message || "An error occurred during streaming.", 
                      message: update.message
                    });
                    // Don't throw here, just set the error state and continue reading stream
                    // The stream will naturally end with the done condition above
                    break;
                }
              } catch (parseError: unknown) {
                console.error("Error parsing streamed JSON update:", parseError, "Raw chunk:", stringUpdate);
                setResearchLog(prev => [...prev, `${new Date().toISOString()} [SYSTEM_ERROR] Failed to parse stream update: ${stringUpdate}`]);
              }
            }
          }
        } catch (streamReadError: unknown) {
          const errorMessage = streamReadError instanceof Error ? streamReadError.message : 'Unknown stream error';
          const errorName = streamReadError instanceof Error ? streamReadError.name : undefined;
          
          if (controller.signal.aborted || errorName === 'AbortError') {
            console.log("Stream reading was aborted.");
            setResearchStatus(prev => ({ ...prev, isLoading: false, message: prev.error || "Research aborted."}));
          } else {
            console.error("Error reading from stream:", streamReadError);
            setResearchStatus({ stage: "ERROR", isLoading: false, error: errorMessage || "Stream read error", message: "Error reading stream." });
            setResearchLog(prev => [...prev, `${new Date().toISOString()} [STREAM_ERROR] Error reading stream: ${errorMessage}`]);
          }
          setAbortController(null);
          break;
        }
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : undefined;
      
      console.error("Error calling conductResearch server action:", error);
      if (errorName === 'AbortError') {
        setResearchStatus({ stage: "IDLE", isLoading: false, error: "Research aborted by client before stream started.", message: "Aborted." });
        setResearchLog(prev => [...prev, `${new Date().toISOString()} [ERROR] Research aborted before stream started.`]);
      } else {
        setResearchStatus({ stage: "ERROR", isLoading: false, error: errorMessage || "Failed to start research.", message: "Error starting research."});
        setResearchLog(prev => [...prev, `${new Date().toISOString()} [ERROR] Failed to start research: ${errorMessage}`]);
      }
      setAbortController(null);
    }
  }, [resetAllResearchState, setResearchStatus, setResearchLog, setGeneratedQueries, setAnalyzedDocs, setSynthesisDetails, setFinalReportContent]);

  const abortResearch = useCallback(() => {
    if (abortController) {
      console.log("useResearchAgent: Abort signal sent.");
      abortController.abort();
      setResearchStatus(prev => ({
        ...prev,
        isLoading: false,
        error: "Research manually aborted.",
        message: "Research process aborted by user.",
      }));
      setResearchLog(prev => [...prev, `${new Date().toISOString()} [USER_ACTION] Research abortion requested.`]);
    } else {
      console.log("useResearchAgent: No active research to abort.");
    }
  }, [abortController, setResearchStatus, setResearchLog]);

  // Read global loading/error state for exporting from the hook
  const currentStatus = useAtomValue(researchStatusAtom);

  return {
    startResearch,
    abortResearch,
    isLoading: currentStatus.isLoading,
    currentStage: currentStatus.stage,
    currentMessage: currentStatus.message,
    error: currentStatus.error,
  };
}