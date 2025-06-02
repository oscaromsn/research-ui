"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useState } from "react"

import { conductResearch } from "@/app/actions/researchAgentOrchestrator"
import type {
  ResearchStage,
  ResearchUpdate,
} from "@/app/actions/researchAgentOrchestrator"
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
} from "@/lib/state/researchAtoms"
import type {
  ClientAnalyzedDoc,
  ClientFinalReport,
  ClientResearchAssessment,
  ClientSynthesis,
  ResearchStatus,
} from "@/lib/state/researchAtoms"

interface QueryData {
  query_string: string
  expected_information_summary: string
}

interface ReportData {
  report_title?: string
  executive_summary_chunk?: string
  executiveSummary?: string
  sectionUpdate?: {
    title?: string
    content_chunk?: string
  }
  sections?: Array<{ title: string; content: string }>
  conclusion_chunk?: string
  conclusion?: string
  limitations?: string[]
  appendixDocIds?: string[]
}

interface UseResearchAgentReturn {
  startResearch: (legalQuestion: string) => Promise<void>
  resumeResearch: () => Promise<void>
  pauseResearch: () => void
  abortResearch: () => void
  isLoading: boolean
  currentStage: ResearchStage | null
  currentMessage: string | undefined
  error: string | null
  isPaused: boolean
  canResume: boolean
  autoModeEnabled: boolean
  toggleAutoMode: () => void
}

/**
 * Custom React hook for managing the legal research process workflow.
 *
 * This hook serves as the primary interface between UI components and the research pipeline,
 * orchestrating the entire research lifecycle from query generation to final report creation.
 * It manages the connection to the server-side research orchestrator and updates Jotai atoms
 * based on streaming updates received from the backend.
 */
export function useResearchAgent(): UseResearchAgentReturn {
  // Get Jotai setters and readers
  const setResearchStatus = useSetAtom(researchStatusAtom)
  const setResearchLog = useSetAtom(researchLogAtom)
  const setGeneratedQueries = useSetAtom(generatedQueriesAtom)
  const setAnalyzedDocs = useSetAtom(analyzedDocsSummaryAtom)
  const setSynthesisDetails = useSetAtom(synthesisDetailsAtom)
  const setFinalReportContent = useSetAtom(finalReportContentAtom)
  const setResearchAssessment = useSetAtom(researchAssessmentAtom)
  const setAutoModeState = useSetAtom(autoModeStateAtom)
  const setResearchSession = useSetAtom(researchSessionAtom)
  const resetAllResearchState = useSetAtom(resetResearchStateAtom)
  const autoModeState = useAtomValue(autoModeStateAtom)
  const researchStatus = useAtomValue(researchStatusAtom)

  // Local state for the AbortController
  const [abortController, setAbortController] =
    useState<AbortController | null>(null)

  // Helper function to log research events
  const logResearchEvent = useCallback(
    (stage: string, type: string, message: string) => {
      setResearchLog(prev => [
        ...prev,
        `${new Date().toISOString()} [${stage}] (${type}) ${message}`.trim(),
      ])
    },
    [setResearchLog]
  )

  // Helper function to initialize research session
  const initializeResearchSession = useCallback(
    (legalQuestion: string) => {
      resetAllResearchState(undefined)

      setAutoModeState(prev => ({
        ...prev,
        originalQuestion: legalQuestion,
        currentIteration: 0,
      }))

      const sessionId = `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setResearchSession(prev => ({
        ...prev,
        sessionId,
      }))

      setResearchStatus({
        stage: "INITIALIZING",
        isLoading: true,
        error: null,
        message: "Initializing research...",
        currentProcessedDoc: 0,
        totalDocsToProcess: 0,
        isPaused: false,
        canResume: false,
      })

      logResearchEvent(
        "INITIALIZING",
        "INFO",
        `Research process initiated for: "${legalQuestion}"`
      )
    },
    [
      resetAllResearchState,
      setAutoModeState,
      setResearchSession,
      setResearchStatus,
      logResearchEvent,
    ]
  )

  // Helper function to determine status flags
  const getStatusFlags = useCallback(
    (update: ResearchUpdate) => ({
      isPaused: update.stage === "ITERATION_PAUSED",
      canResume:
        update.stage === "ITERATION_PAUSED" ||
        (update.stage === "ASSESSING_RESEARCH" && !autoModeState.isEnabled),
      error:
        update.type === "ERROR" ? update.message || "An error occurred" : null,
    }),
    [autoModeState.isEnabled]
  )

  // Helper function to update research status from stream update
  const updateResearchStatus = useCallback(
    (update: ResearchUpdate) => {
      const statusFlags = getStatusFlags(update)

      setResearchStatus((prevStatus: ResearchStatus) => {
        const newStatus: ResearchStatus = {
          ...prevStatus,
          stage: update.stage,
          isLoading: true,
          error: statusFlags.error,
          isPaused: statusFlags.isPaused,
          canResume: statusFlags.canResume,
        }

        if (update.message) {
          newStatus.message = update.message
        }

        if (update.currentProcessedDoc !== undefined) {
          newStatus.currentProcessedDoc = update.currentProcessedDoc
        }

        if (update.totalDocsToProcess !== undefined) {
          newStatus.totalDocsToProcess = update.totalDocsToProcess
        }

        if (update.fieldName) {
          newStatus.currentStreamingField = update.fieldName
        }

        return newStatus
      })
    },
    [setResearchStatus, getStatusFlags]
  )

  // Helper function to handle query generation updates
  const handleQueryGenerationUpdate = useCallback(
    (update: ResearchUpdate) => {
      if (update.data && typeof update.data === "object" && "queries" in update.data) {
        const queriesData = (update.data as { queries: QueryData[] }).queries
        const timestamp = new Date().toISOString()
        const queriesWithTimestamp = queriesData.map(q => ({
          ...q,
          timestamp,
        }))

        setGeneratedQueries(queriesWithTimestamp)
        setResearchSession(prev => ({
          ...prev,
          accumulatedQueries: [
            ...prev.accumulatedQueries,
            ...queriesWithTimestamp,
          ],
        }))
      }
    },
    [setGeneratedQueries, setResearchSession]
  )

  // Helper function to handle document analysis updates
  const handleDocumentAnalysisUpdate = useCallback(
    (update: ResearchUpdate) => {
      if (
        update.data &&
        typeof update.data === "object" &&
        "docId" in update.data
      ) {
        const docData = update.data as unknown as ClientAnalyzedDoc
        const timestamp = new Date().toISOString()
        const docWithTimestamp = {
          ...docData,
          timestamp,
        }

        setAnalyzedDocs(prev => {
          const existingIndex = prev.findIndex(doc => doc.docId === docWithTimestamp.docId)
          if (existingIndex >= 0) {
            // Update existing document
            const newDocs = [...prev]
            newDocs[existingIndex] = { ...newDocs[existingIndex], ...docWithTimestamp }
            return newDocs
          }
          // Add new document
          return [...prev, docWithTimestamp]
        })
        setResearchSession(prev => {
          const existingIndex = prev.accumulatedDocuments.findIndex(doc => doc.docId === docWithTimestamp.docId)
          if (existingIndex >= 0) {
            // Update existing document
            const newDocs = [...prev.accumulatedDocuments]
            newDocs[existingIndex] = { ...newDocs[existingIndex], ...docWithTimestamp }
            return {
              ...prev,
              accumulatedDocuments: newDocs,
            }
          }
          // Add new document
          return {
            ...prev,
            accumulatedDocuments: [
              ...prev.accumulatedDocuments,
              docWithTimestamp,
            ],
          }
        })
      }
    },
    [setAnalyzedDocs, setResearchSession]
  )

  // Helper function to handle synthesis updates
  const handleSynthesisUpdate = useCallback(
    (update: ResearchUpdate) => {
      if (
        update.data &&
        typeof update.data === "object" &&
        "topics" in update.data
      ) {
        const synthesisData = update.data as ClientSynthesis
        const timestamp = new Date().toISOString()
        const topicsWithTimestamp = synthesisData.topics.map(topic => ({
          ...topic,
          timestamp,
        }))

        const updatedSynthesis = {
          ...synthesisData,
          topics: topicsWithTimestamp,
        }

        setSynthesisDetails(updatedSynthesis)
        setResearchSession(prev => ({
          ...prev,
          accumulatedTopics: [
            ...prev.accumulatedTopics,
            ...topicsWithTimestamp,
          ],
        }))
      }
    },
    [setSynthesisDetails, setResearchSession]
  )

  // Helper function to handle assessment updates
  const handleAssessmentUpdate = useCallback(
    (update: ResearchUpdate) => {
      if (update.data && typeof update.data === "object") {
        setResearchAssessment(update.data as ClientResearchAssessment)
      }
    },
    [setResearchAssessment]
  )

  // Helper function to update report title
  const updateReportTitle = useCallback(
    (reportData: ReportData, newReport: ClientFinalReport) => {
      if (reportData.report_title) {
        newReport.title = reportData.report_title
      }
    },
    []
  )

  // Helper function to update executive summary
  const updateExecutiveSummary = useCallback(
    (reportData: ReportData, newReport: ClientFinalReport) => {
      if (reportData.executive_summary_chunk) {
        newReport.executiveSummary =
          (newReport.executiveSummary || "") +
          reportData.executive_summary_chunk
      }
      if (reportData.executiveSummary) {
        newReport.executiveSummary = reportData.executiveSummary
      }
    },
    []
  )

  // Helper function to update existing section
  const updateExistingSection = useCallback(
    (
      sections: ClientFinalReport["sections"],
      existingIndex: number,
      contentChunk: string
    ) => {
      const existingSection = sections[existingIndex]
      if (existingSection) {
        sections[existingIndex] = {
          title: existingSection.title,
          content: existingSection.content + contentChunk,
        }
      }
    },
    []
  )

  // Helper function to add new section
  const addNewSection = useCallback(
    (
      sections: ClientFinalReport["sections"],
      title: string,
      contentChunk: string
    ) => {
      sections.push({
        title,
        content: contentChunk,
      })
    },
    []
  )

  // Helper function to update report sections
  const updateReportSections = useCallback(
    (reportData: ReportData, newReport: ClientFinalReport) => {
      if (
        reportData.sectionUpdate?.title &&
        reportData.sectionUpdate?.content_chunk
      ) {
        const sections = newReport.sections || []
        const existingIndex = sections.findIndex(
          s => s.title === reportData.sectionUpdate?.title
        )

        if (existingIndex >= 0) {
          updateExistingSection(
            sections,
            existingIndex,
            reportData.sectionUpdate.content_chunk
          )
        } else {
          addNewSection(
            sections,
            reportData.sectionUpdate.title,
            reportData.sectionUpdate.content_chunk
          )
        }
        newReport.sections = sections
      }

      if (reportData.sections) {
        newReport.sections = reportData.sections
      }
    },
    [updateExistingSection, addNewSection]
  )

  // Helper function to update conclusion and metadata
  const updateConclusionAndMetadata = useCallback(
    (reportData: ReportData, newReport: ClientFinalReport) => {
      if (reportData.conclusion_chunk) {
        newReport.conclusion =
          (newReport.conclusion || "") + reportData.conclusion_chunk
      }
      if (reportData.conclusion) {
        newReport.conclusion = reportData.conclusion
      }
      if (reportData.limitations) {
        newReport.limitations = reportData.limitations
      }
      if (reportData.appendixDocIds) {
        newReport.appendixDocIds = reportData.appendixDocIds
      }
    },
    []
  )

  // Helper function to handle report generation updates
  const handleReportUpdate = useCallback(
    (update: ResearchUpdate) => {
      const reportData = update.data as ReportData

      setFinalReportContent(prevReport => {
        const newReport = { ...prevReport }

        updateReportTitle(reportData, newReport)
        updateExecutiveSummary(reportData, newReport)
        updateReportSections(reportData, newReport)
        updateConclusionAndMetadata(reportData, newReport)

        return newReport
      })
    },
    [
      setFinalReportContent,
      updateReportTitle,
      updateExecutiveSummary,
      updateReportSections,
      updateConclusionAndMetadata,
    ]
  )

  // Helper function to process individual stream updates
  const processStreamUpdate = useCallback(
    (update: ResearchUpdate) => {
      logResearchEvent(update.stage, update.type, update.message || "")
      updateResearchStatus(update)

      switch (update.stage) {
        case "GENERATING_QUERIES": {
          handleQueryGenerationUpdate(update)
          break
        }
        case "ANALYZING_DOCUMENTS": {
          handleDocumentAnalysisUpdate(update)
          break
        }
        case "SYNTHESIZING_FINDINGS": {
          handleSynthesisUpdate(update)
          break
        }
        case "ASSESSING_RESEARCH": {
          handleAssessmentUpdate(update)
          break
        }
        case "GENERATING_REPORT": {
          if (update.data) {
            handleReportUpdate(update)
          }
          break
        }
        default: {
          // Handle any other stage types if needed
          break
        }
      }
    },
    [
      logResearchEvent,
      updateResearchStatus,
      handleQueryGenerationUpdate,
      handleDocumentAnalysisUpdate,
      handleSynthesisUpdate,
      handleAssessmentUpdate,
      handleReportUpdate,
    ]
  )

  // Helper function to handle stream completion
  const handleStreamCompletion = useCallback(
    (_controller: AbortController) => {
      setResearchStatus((prev: ResearchStatus) => ({
        ...prev,
        isLoading: false,
        stage: prev.error ? "IDLE" : prev.stage || "IDLE",
        message: prev.error
          ? prev.message || "Research failed."
          : prev.message || "Research process completed.",
        isPaused: false,
        canResume: false,
      }))

      logResearchEvent("COMPLETED", "INFO", "Stream ended.")
      setAbortController(null)
    },
    [setResearchStatus, logResearchEvent]
  )

  // Helper function to handle stream errors
  const handleStreamError = useCallback(
    (error: Error) => {
      setResearchStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        stage: "ERROR",
        message: `Research failed: ${error.message}`,
        isPaused: false,
        canResume: false,
      }))

      logResearchEvent("ERROR", "ERROR", `Research failed: ${error.message}`)
      setAbortController(null)
    },
    [setResearchStatus, logResearchEvent]
  )

  // Helper function to process a single string update
  const processSingleUpdate = useCallback(
    (stringUpdate: string, controller: AbortController) => {
      if (controller.signal.aborted) {
        return
      }

      try {
        const update = JSON.parse(stringUpdate) as ResearchUpdate
        processStreamUpdate(update)
      } catch (parseError) {
        console.error(
          "Failed to parse update:",
          parseError,
          "Raw update:",
          stringUpdate
        )
      }
    },
    [processStreamUpdate]
  )

  // Helper function to process stream value
  const processStreamValue = useCallback(
    (value: string, controller: AbortController) => {
      const stringUpdates = value.split("\n").filter(s => s.trim() !== "")

      for (const stringUpdate of stringUpdates) {
        processSingleUpdate(stringUpdate, controller)
      }
    },
    [processSingleUpdate]
  )

  // Helper function to read stream data
  const readStreamData = useCallback(
    async (
      reader: ReadableStreamDefaultReader<string>,
      controller: AbortController
    ) => {
      const { value, done } = await reader.read()

      if (controller.signal.aborted) {
        console.log("Stream reading aborted by AbortController.")
        return { shouldBreak: true }
      }

      if (done) {
        handleStreamCompletion(controller)
        return { shouldBreak: true }
      }

      if (value) {
        processStreamValue(value, controller)
      }

      return { shouldBreak: false }
    },
    [processStreamValue, handleStreamCompletion]
  )

  // Main function to process the research stream
  const processResearchStream = useCallback(
    async (stream: ReadableStream, controller: AbortController) => {
      const reader = stream
        .pipeThrough(new TextDecoderStream(), {
          signal: controller.signal,
        })
        .getReader()

      while (true) {
        try {
          const { shouldBreak } = await readStreamData(reader, controller)
          if (shouldBreak) {
            break
          }
        } catch (error) {
          if (controller.signal.aborted) {
            console.log("Stream reading was aborted.")
            break
          }
          throw error
        }
      }
    },
    [readStreamData]
  )

  /**
   * Initiates the legal research process for a given legal question.
   */
  const startResearch = useCallback(
    async (legalQuestion: string) => {
      initializeResearchSession(legalQuestion)

      const controller = new AbortController()
      setAbortController(controller)

      try {
        const stream = await conductResearch(legalQuestion, {
          isEnabled: autoModeState.isEnabled,
          maxIterations: autoModeState.maxIterations,
          currentIteration: autoModeState.currentIteration,
        })

        await processResearchStream(stream, controller)
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Research was aborted.")
          return
        }
        handleStreamError(
          error instanceof Error ? error : new Error("Unknown error occurred")
        )
      }
    },
    [
      initializeResearchSession,
      autoModeState.isEnabled,
      autoModeState.maxIterations,
      autoModeState.currentIteration,
      processResearchStream,
      handleStreamError,
    ]
  )

  /**
   * Resumes the research process from where it was paused.
   */
  const resumeResearch = useCallback(async () => {
    if (!researchStatus.canResume || !autoModeState.originalQuestion) {
      console.error(
        "Cannot resume research: not in resumable state or missing original question"
      )
      return
    }

    setResearchStatus(prev => ({
      ...prev,
      isPaused: false,
      isLoading: true,
      stage: "INITIALIZING",
      message: "Resuming research...",
    }))

    logResearchEvent("RESUMING", "INFO", "Research process resumed")

    const controller = new AbortController()
    setAbortController(controller)

    try {
      const stream = await conductResearch(autoModeState.originalQuestion, {
        isEnabled: autoModeState.isEnabled,
        maxIterations: autoModeState.maxIterations,
        currentIteration: autoModeState.currentIteration,
      })

      await processResearchStream(stream, controller)
    } catch (error) {
      if (controller.signal.aborted) {
        console.log("Resumed research was aborted.")
        return
      }
      handleStreamError(
        error instanceof Error ? error : new Error("Unknown error occurred")
      )
    }
  }, [
    researchStatus.canResume,
    autoModeState.originalQuestion,
    autoModeState.isEnabled,
    autoModeState.maxIterations,
    autoModeState.currentIteration,
    setResearchStatus,
    logResearchEvent,
    processResearchStream,
    handleStreamError,
  ])

  /**
   * Pauses the current research process.
   */
  const pauseResearch = useCallback(() => {
    if (abortController) {
      abortController.abort()
    }

    setResearchStatus(prev => ({
      ...prev,
      isPaused: true,
      isLoading: false,
      canResume: true,
      stage: "ITERATION_PAUSED",
      message: "Research paused by user",
    }))

    logResearchEvent("PAUSED", "INFO", "Research process paused by user")
    setAbortController(null)
  }, [abortController, setResearchStatus, logResearchEvent])

  /**
   * Aborts the current research process completely.
   */
  const abortResearch = useCallback(() => {
    if (abortController) {
      abortController.abort()
    }

    setResearchStatus(prev => ({
      ...prev,
      isLoading: false,
      isPaused: false,
      canResume: false,
      stage: "IDLE",
      message: "Research aborted by user",
    }))

    logResearchEvent("ABORTED", "INFO", "Research process aborted by user")
    setAbortController(null)
  }, [abortController, setResearchStatus, logResearchEvent])

  /**
   * Toggles the auto mode setting.
   */
  const toggleAutoMode = useCallback(() => {
    setAutoModeState(prev => ({
      ...prev,
      isEnabled: !prev.isEnabled,
    }))
  }, [setAutoModeState])

  return {
    startResearch,
    resumeResearch,
    pauseResearch,
    abortResearch,
    isLoading: researchStatus.isLoading,
    currentStage: researchStatus.stage,
    currentMessage: researchStatus.message,
    error: researchStatus.error,
    isPaused: researchStatus.isPaused || false,
    canResume: researchStatus.canResume || false,
    autoModeEnabled: autoModeState.isEnabled,
    toggleAutoMode,
  }
}
