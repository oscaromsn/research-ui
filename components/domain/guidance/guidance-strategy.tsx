"use client"

import { useAtomValue } from "jotai"
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronRight,
  FileText,
  Pause,
  Play,
} from "lucide-react"
import { useState } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { useResearchAgent } from "@/lib/hooks/useResearchAgent"
import {
  generatedQueriesAtom,
  researchAssessmentAtom,
  researchLogAtom,
  researchSessionAtom,
} from "@/lib/state/researchAtoms"

interface ResearchLogSectionProps {
  researchLogs: string[]
}

function ResearchLogSection({ researchLogs }: ResearchLogSectionProps) {
  const [isLogExpanded, setIsLogExpanded] = useState(true)

  if (researchLogs.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      <Collapsible open={isLogExpanded} onOpenChange={setIsLogExpanded}>
        <CollapsibleTrigger asChild={true}>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-[#e1e5eb] bg-white p-3 transition-colors hover:bg-gray-50 dark:border-[#2a3148] dark:bg-[#1e2436] dark:hover:bg-[#242a3d]"
          >
            <div className="flex items-center">
              <FileText
                size={16}
                className="mr-2 text-[#4a5568] dark:text-[#a0aec0]"
              />
              <span className="font-medium text-[#4a5568] text-sm dark:text-[#a0aec0]">
                Research Logs ({researchLogs.length})
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`transform text-[#64748b] transition-transform dark:text-[#94a3b8] ${
                isLogExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 rounded-lg border border-[#e1e5eb] bg-white p-3 dark:border-[#2a3148] dark:bg-[#1e2436]">
            <div className="h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-[#4a5568] text-xs dark:text-[#a0aec0]">
                {researchLogs.join("\n")}
              </pre>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

interface ResearchControlsSectionProps {
  agent: ReturnType<typeof useResearchAgent>
  legalQuestion: string
  onLegalQuestionChange: (value: string) => void
  onStartResearch: () => void
  onAbortResearch: () => void
  onPauseResearch: () => void
  onResumeResearch: () => void
}

function ResearchControlsSection({
  agent,
  legalQuestion,
  onLegalQuestionChange,
  onStartResearch,
  onAbortResearch,
  onPauseResearch,
  onResumeResearch,
}: ResearchControlsSectionProps) {
  return (
    <>
      {/* Auto Mode Switch */}
      <div className="mb-4 flex items-center justify-between rounded-md border border-[#e1e5eb] bg-white p-3 dark:border-[#2a3148] dark:bg-[#1e2436]">
        <div className="flex flex-col">
          <span className="font-medium text-[#1a1f2e] text-sm dark:text-white">
            Auto Mode
          </span>
          <span className="text-[#4a5568] text-xs dark:text-[#a0aec0]">
            Automatically refine queries and continue research
          </span>
        </div>
        <Switch
          checked={agent.autoModeEnabled}
          onCheckedChange={agent.toggleAutoMode}
          disabled={agent.isLoading}
        />
      </div>

      <input
        type="text"
        placeholder="Enter Legal Question or Research Topic"
        value={legalQuestion}
        onChange={e => onLegalQuestionChange(e.target.value)}
        disabled={agent.isLoading}
        className="mb-3 w-full rounded-md border border-[#e1e5eb] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4a90e2] dark:border-[#2a3148] dark:bg-[#1e2436]"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-md bg-[#edf2f7] px-2 py-1 text-[#4a5568] text-xs dark:bg-[#242a3d] dark:text-[#a0aec0]">
          Jurisdiction: Federal
        </span>
        <span className="rounded-md bg-[#edf2f7] px-2 py-1 text-[#4a5568] text-xs dark:bg-[#242a3d] dark:text-[#a0aec0]">
          Jurisdiction: California
        </span>
      </div>

      {/* Research Control Buttons */}
      <ResearchControlButtons
        agent={agent}
        legalQuestion={legalQuestion}
        onStartResearch={onStartResearch}
        onAbortResearch={onAbortResearch}
        onPauseResearch={onPauseResearch}
        onResumeResearch={onResumeResearch}
      />

      {agent.error && (
        <div className="mt-2 rounded border border-red-300 bg-red-100 p-2 text-red-800 text-sm dark:border-red-700 dark:bg-red-900 dark:text-red-200">
          Error: {agent.error}
        </div>
      )}
    </>
  )
}

interface ResearchControlButtonsProps {
  agent: ReturnType<typeof useResearchAgent>
  legalQuestion: string
  onStartResearch: () => void
  onAbortResearch: () => void
  onPauseResearch: () => void
  onResumeResearch: () => void
}

function ResearchControlButtons({
  agent,
  legalQuestion,
  onStartResearch,
  onAbortResearch,
  onPauseResearch,
  onResumeResearch,
}: ResearchControlButtonsProps) {
  if (!agent.isLoading && !agent.canResume) {
    return (
      <button
        type="button"
        onClick={onStartResearch}
        disabled={!legalQuestion.trim()}
        className="w-full rounded-md bg-[#3a7bb7] py-2 text-sm text-white transition-colors hover:bg-[#2c5d8a] disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        Start Research
      </button>
    )
  }

  if (agent.canResume && !agent.isLoading) {
    return (
      <button
        type="button"
        onClick={onResumeResearch}
        className="flex w-full items-center justify-center rounded-md bg-green-600 py-2 text-sm text-white transition-colors hover:bg-green-700"
      >
        <Play size={16} className="mr-1" />
        Resume Research
      </button>
    )
  }

  if (agent.isLoading) {
    return (
      <div className="space-y-2">
        <div className="rounded-md bg-[#e2e8f0] px-3 py-2 text-[#4a5568] text-sm dark:bg-[#2a3148] dark:text-[#a0aec0]">
          {agent.autoModeEnabled && "Auto Mode: "}Processing:{" "}
          {agent.currentStage}
          {agent.currentMessage && ` - ${agent.currentMessage}`}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPauseResearch}
            disabled={agent.isPaused}
            className="flex flex-1 items-center justify-center rounded-md bg-orange-600 py-2 text-sm text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <Pause size={16} className="mr-1" />
            Pause
          </button>

          <button
            type="button"
            onClick={onAbortResearch}
            className="flex-1 rounded-md bg-red-600 py-2 text-sm text-white transition-colors hover:bg-red-700"
          >
            Abort
          </button>
        </div>
      </div>
    )
  }

  return null
}

interface QueryItem {
  query_string: string
  expected_information_summary?: string
  timestamp?: string
}

interface GeneratedQueriesSectionProps {
  queries: QueryItem[]
  totalQueries: number
}

function GeneratedQueriesSection({
  queries,
  totalQueries,
}: GeneratedQueriesSectionProps) {
  if (queries.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-[#4a5568] text-sm dark:text-[#a0aec0]">
          Generated Search Queries{" "}
          {totalQueries > 0 && `(${totalQueries} total)`}
        </h3>
        <ChevronRight size={16} className="text-[#a0aec0]" />
      </div>
      {queries.map((query, index) => (
        <div
          key={query.query_string || `query-${index}`}
          className="mb-3 rounded-lg border border-[#e1e5eb] bg-white p-4 dark:border-[#2a3148] dark:bg-[#1e2436]"
        >
          <div className="mb-2 flex items-start justify-between">
            <div className="flex-1 font-mono text-[#2d3748] text-sm dark:text-[#e2e8f0]">
              {query.query_string}
            </div>
            {query.timestamp && (
              <div className="ml-2 text-[#64748b] text-xs dark:text-[#94a3b8]">
                {new Date(query.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>
          {query.expected_information_summary && (
            <div className="mt-3">
              <p className="mb-1 font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
                Expected Information:
              </p>
              <p className="text-[#4a5568] text-xs dark:text-[#a0aec0]">
                {query.expected_information_summary}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface AssessmentData {
  isSufficient: boolean
  assessmentSummary: string
  identifiedGaps?: string[]
  suggestedRefinementQueries?: Array<{
    query_string: string
    expected_information_summary?: string
  }>
  nextAction: string
  reasoningSummary?: string
}

interface AssessmentSectionProps {
  assessment: AssessmentData
}

function AssessmentSection({ assessment }: AssessmentSectionProps) {
  const [isAssessmentExpanded, setIsAssessmentExpanded] = useState(false)

  return (
    <div className="mb-4">
      <div className="rounded-lg border border-[#e1e5eb] bg-white p-4 dark:border-[#2a3148] dark:bg-[#1e2436]">
        <button
          type="button"
          className="w-full"
          onClick={() => setIsAssessmentExpanded(!isAssessmentExpanded)}
        >
          <div className="mb-2 flex items-start">
            <AlertTriangle
              size={16}
              className={`mt-0.5 mr-2 flex-shrink-0 ${
                assessment.isSufficient ? "text-green-500" : "text-[#eab308]"
              }`}
            />
            <div className="flex-1">
              <h3 className="text-left font-medium text-sm">
                Agent Assessment{" "}
                <span
                  className={
                    assessment.isSufficient
                      ? "text-green-500"
                      : "text-[#eab308]"
                  }
                >
                  {assessment.isSufficient
                    ? "Research Sufficient ✓"
                    : "Further Action Needed ⚠️"}
                </span>
              </h3>
            </div>
            <ChevronDown
              size={16}
              className={`transform text-[#64748b] transition-transform dark:text-[#94a3b8] ${
                isAssessmentExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
        <p className="mb-3 text-[#4a5568] text-xs dark:text-[#a0aec0]">
          {assessment.assessmentSummary}
        </p>
        {isAssessmentExpanded && <AssessmentDetails assessment={assessment} />}
      </div>
    </div>
  )
}

interface AssessmentDetailsProps {
  assessment: {
    identifiedGaps?: string[]
    suggestedRefinementQueries?: Array<{
      query_string: string
      expected_information_summary?: string
    }>
    nextAction: string
    reasoningSummary?: string
  }
}

function AssessmentDetails({ assessment }: AssessmentDetailsProps) {
  return (
    <div className="mt-4 border-[#e1e5eb] border-t pt-4 dark:border-[#2a3148]">
      <div className="space-y-4">
        {assessment.identifiedGaps && assessment.identifiedGaps.length > 0 && (
          <div>
            <h4 className="mb-2 font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
              Identified Gaps:
            </h4>
            <ul className="space-y-2 text-[#4a5568] text-xs dark:text-[#a0aec0]">
              {assessment.identifiedGaps.map((gap, index) => (
                <li
                  key={`gap-${gap.slice(0, 20)}-${index}`}
                  className="flex items-start"
                >
                  <div className="mt-1.5 mr-2 h-1.5 w-1.5 rounded-full bg-red-500" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {assessment.suggestedRefinementQueries &&
          assessment.suggestedRefinementQueries.length > 0 && (
            <div>
              <h4 className="mb-2 font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
                Suggested Query Refinements:
              </h4>
              <div className="space-y-3">
                {assessment.suggestedRefinementQueries.map((query, index) => (
                  <div
                    key={`refinement-${query.query_string}-${index}`}
                    className="rounded-md border border-[#e1e5eb] bg-white p-3 dark:border-[#2a3148] dark:bg-[#1e2436]"
                  >
                    <div className="mb-2 flex items-start">
                      <div className="mt-1.5 mr-2 h-1.5 w-1.5 rounded-full bg-[#3a7bb7]" />
                      <div className="flex-1 font-mono text-[#2d3748] text-xs dark:text-[#e2e8f0]">
                        {query.query_string}
                      </div>
                    </div>
                    {query.expected_information_summary && (
                      <div className="ml-3.5">
                        <p className="mb-1 font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
                          Expected Information:
                        </p>
                        <p className="text-[#4a5568] text-xs dark:text-[#a0aec0]">
                          {query.expected_information_summary}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        <div>
          <h4 className="mb-2 font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
            Next Action: {assessment.nextAction.replace(/_/g, " ")}
          </h4>
        </div>

        {assessment.reasoningSummary && (
          <button
            type="button"
            className="flex items-center text-[#3a7bb7] text-xs hover:text-[#2c5d8a]"
          >
            <Brain size={12} className="mr-1" />
            View Assessment Reasoning
          </button>
        )}
      </div>
    </div>
  )
}

export function GuidanceStrategy() {
  const [legalQuestion, setLegalQuestion] = useState("")
  const agent = useResearchAgent()
  const generatedQueries = useAtomValue(generatedQueriesAtom)
  const researchLogs = useAtomValue(researchLogAtom)
  const assessment = useAtomValue(researchAssessmentAtom)
  const researchSession = useAtomValue(researchSessionAtom)

  // Use accumulated queries if available, otherwise fall back to current session
  const allQueries =
    researchSession.accumulatedQueries.length > 0
      ? researchSession.accumulatedQueries
      : generatedQueries

  // Sort queries by timestamp (most recent first)
  const sortedQueries = [...allQueries].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return bTime - aTime
  })

  const handleStartResearch = () => {
    if (legalQuestion.trim()) {
      agent.startResearch(legalQuestion)
    }
  }

  const handleAbortResearch = () => {
    agent.abortResearch()
  }

  const handlePauseResearch = () => {
    agent.pauseResearch()
  }

  const handleResumeResearch = () => {
    agent.resumeResearch()
  }

  return (
    <div className="w-full overflow-y-auto border-[#e1e5eb] border-r bg-[#f8f9fa] p-4 md:w-1/3 dark:border-[#2a3148] dark:bg-[#171c2c]">
      <div className="mb-4">
        <h2 className="mb-4 flex items-center font-semibold text-[#1a1f2e] text-lg dark:text-white">
          <span className="mr-2">Guidance & Strategy</span>
        </h2>
        <div className="mb-6">
          <ResearchLogSection researchLogs={researchLogs} />

          <ResearchControlsSection
            agent={agent}
            legalQuestion={legalQuestion}
            onLegalQuestionChange={setLegalQuestion}
            onStartResearch={handleStartResearch}
            onAbortResearch={handleAbortResearch}
            onPauseResearch={handlePauseResearch}
            onResumeResearch={handleResumeResearch}
          />
        </div>
      </div>

      <GeneratedQueriesSection
        queries={sortedQueries}
        totalQueries={researchSession.accumulatedQueries.length}
      />

      {assessment && <AssessmentSection assessment={assessment} />}
    </div>
  )
}
