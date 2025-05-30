"use client";

import { useAtomValue } from "jotai";
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { useState } from "react";

import { Switch } from "@/components/ui/switch";
import { useResearchAgent } from "@/lib/hooks/useResearchAgent";
import {
  generatedQueriesAtom,
  researchAssessmentAtom,
  researchLogAtom,
  researchSessionAtom,
} from "@/lib/state/researchAtoms";
export function GuidanceStrategy() {
  const [isAssessmentExpanded, setIsAssessmentExpanded] = useState(false);
  const [legalQuestion, setLegalQuestion] = useState("");
  const agent = useResearchAgent();
  const generatedQueries = useAtomValue(generatedQueriesAtom);
  const researchLogs = useAtomValue(researchLogAtom);
  const assessment = useAtomValue(researchAssessmentAtom);
  const researchSession = useAtomValue(researchSessionAtom);

  // Use accumulated queries if available, otherwise fall back to current session
  const allQueries =
    researchSession.accumulatedQueries.length > 0
      ? researchSession.accumulatedQueries
      : generatedQueries;

  // Sort queries by timestamp (most recent first)
  const sortedQueries = [...allQueries].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return bTime - aTime;
  });

  const handleStartResearch = () => {
    if (legalQuestion.trim()) {
      agent.startResearch(legalQuestion);
    }
  };

  const handleAbortResearch = () => {
    agent.abortResearch();
  };

  const handlePauseResearch = () => {
    agent.pauseResearch();
  };

  const handleResumeResearch = () => {
    agent.resumeResearch();
  };
  return (
    <div className="bg-[#f8f9fa] dark:bg-[#171c2c] p-4 border-[#e1e5eb] dark:border-[#2a3148] border-r w-full md:w-1/3 overflow-y-auto">
      <div className="mb-4">
        <h2 className="flex items-center mb-4 font-semibold text-[#1a1f2e] dark:text-white text-lg">
          <span className="mr-2">Guidance & Strategy</span>
        </h2>
        <div className="mb-6">
          {/* Auto Mode Switch */}
          <div className="flex items-center justify-between mb-4 p-3 bg-white dark:bg-[#1e2436] border border-[#e1e5eb] dark:border-[#2a3148] rounded-md">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#1a1f2e] dark:text-white">
                Auto Mode
              </span>
              <span className="text-xs text-[#4a5568] dark:text-[#a0aec0]">
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
            onChange={(e) => setLegalQuestion(e.target.value)}
            disabled={agent.isLoading}
            className="bg-white dark:bg-[#1e2436] mb-3 px-4 py-3 border border-[#e1e5eb] dark:border-[#2a3148] rounded-md focus:outline-none focus:ring-1 focus:ring-[#4a90e2] w-full text-sm"
          />
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-[#edf2f7] dark:bg-[#242a3d] px-2 py-1 rounded-md text-[#4a5568] dark:text-[#a0aec0] text-xs">
              Jurisdiction: Federal
            </span>
            <span className="bg-[#edf2f7] dark:bg-[#242a3d] px-2 py-1 rounded-md text-[#4a5568] dark:text-[#a0aec0] text-xs">
              Jurisdiction: California
            </span>
          </div>
          {/* Research Control Buttons */}
          <div className="space-y-2">
            {!agent.isLoading && !agent.canResume && (
              <button
                type="button"
                onClick={handleStartResearch}
                disabled={!legalQuestion.trim()}
                className="bg-[#3a7bb7] hover:bg-[#2c5d8a] disabled:bg-gray-400 disabled:cursor-not-allowed py-2 rounded-md w-full text-white text-sm transition-colors"
              >
                Start Research
              </button>
            )}

            {agent.canResume && !agent.isLoading && (
              <button
                type="button"
                onClick={handleResumeResearch}
                className="bg-green-600 hover:bg-green-700 py-2 rounded-md w-full text-white text-sm transition-colors flex items-center justify-center"
              >
                <Play size={16} className="mr-1" />
                Resume Research
              </button>
            )}

            {agent.isLoading && (
              <div className="space-y-2">
                <div className="bg-[#e2e8f0] dark:bg-[#2a3148] py-2 px-3 rounded-md text-[#4a5568] dark:text-[#a0aec0] text-sm">
                  {agent.autoModeEnabled && "Auto Mode: "}Processing:{" "}
                  {agent.currentStage}
                  {agent.currentMessage && ` - ${agent.currentMessage}`}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePauseResearch}
                    disabled={agent.isPaused}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed py-2 rounded-md text-white text-sm transition-colors flex items-center justify-center"
                  >
                    <Pause size={16} className="mr-1" />
                    Pause
                  </button>

                  <button
                    type="button"
                    onClick={handleAbortResearch}
                    className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-md text-white text-sm transition-colors"
                  >
                    Abort
                  </button>
                </div>
              </div>
            )}
          </div>
          {agent.error && (
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm">
              Error: {agent.error}
            </div>
          )}
        </div>
      </div>
      {sortedQueries.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-[#4a5568] dark:text-[#a0aec0] text-sm">
              Generated Search Queries{" "}
              {researchSession.accumulatedQueries.length > 0 &&
                `(${sortedQueries.length} total)`}
            </h3>
            <ChevronRight size={16} className="text-[#a0aec0]" />
          </div>
          {sortedQueries.map((query, index) => (
            <div
              key={query.query_string || `query-${index}`}
              className="bg-white dark:bg-[#1e2436] mb-3 p-4 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-mono text-[#2d3748] dark:text-[#e2e8f0] text-sm flex-1">
                  {query.query_string}
                </div>
                {query.timestamp && (
                  <div className="text-[#64748b] dark:text-[#94a3b8] text-xs ml-2">
                    {new Date(query.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
              {query.expected_information_summary && (
                <div className="mt-3">
                  <p className="mb-1 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                    Expected Information:
                  </p>
                  <p className="text-[#4a5568] dark:text-[#a0aec0] text-xs">
                    {query.expected_information_summary}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {researchLogs.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 font-medium text-[#4a5568] dark:text-[#a0aec0] text-sm">
            Research Logs:
          </h3>
          <div className="bg-white dark:bg-[#1e2436] p-3 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg">
            <pre className="text-[#4a5568] dark:text-[#a0aec0] text-xs whitespace-pre-wrap">
              {researchLogs.join("\n")}
            </pre>
          </div>
        </div>
      )}
      {assessment && (
        <div className="mb-4">
          <div className="bg-white dark:bg-[#1e2436] p-4 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg">
            <button
              type="button"
              className="w-full"
              onClick={() => setIsAssessmentExpanded(!isAssessmentExpanded)}
            >
              <div className="flex items-start mb-2">
                <AlertTriangle
                  size={16}
                  className={`flex-shrink-0 mt-0.5 mr-2 ${
                    assessment.isSufficient
                      ? "text-green-500"
                      : "text-[#eab308]"
                  }`}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-left">
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
                  className={`text-[#64748b] dark:text-[#94a3b8] transform transition-transform ${
                    isAssessmentExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>
            <p className="mb-3 text-[#4a5568] dark:text-[#a0aec0] text-xs">
              {assessment.assessmentSummary}
            </p>
            {isAssessmentExpanded && (
              <div className="mt-4 pt-4 border-[#e1e5eb] dark:border-[#2a3148] border-t">
                <div className="space-y-4">
                  {assessment.identifiedGaps &&
                    assessment.identifiedGaps.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                          Identified Gaps:
                        </h4>
                        <ul className="space-y-2 text-[#4a5568] dark:text-[#a0aec0] text-xs">
                          {assessment.identifiedGaps.map((gap, index) => (
                            <li key={index} className="flex items-start">
                              <div className="bg-red-500 mt-1.5 mr-2 rounded-full w-1.5 h-1.5" />
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {assessment.suggestedRefinementQueries &&
                    assessment.suggestedRefinementQueries.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                          Suggested Query Refinements:
                        </h4>
                        <ul className="space-y-2 text-[#4a5568] dark:text-[#a0aec0] text-xs">
                          {assessment.suggestedRefinementQueries.map(
                            (query, index) => (
                              <li key={index} className="flex items-start">
                                <div className="bg-[#3a7bb7] mt-1.5 mr-2 rounded-full w-1.5 h-1.5" />
                                {query.query_string}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  <div>
                    <h4 className="mb-2 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                      Next Action: {assessment.nextAction.replace(/_/g, " ")}
                    </h4>
                  </div>

                  {assessment.reasoningSummary && (
                    <button
                      type="button"
                      className="flex items-center text-[#3a7bb7] hover:text-[#2c5d8a] text-xs"
                    >
                      <Brain size={12} className="mr-1" />
                      View Assessment Reasoning
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
