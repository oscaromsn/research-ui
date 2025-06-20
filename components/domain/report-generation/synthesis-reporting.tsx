"use client";

import { useAtomValue } from "jotai";
import { Brain, ChevronRight } from "lucide-react";
import { useState } from "react";

import {
  researchSessionAtom,
  synthesisDetailsAtom,
} from "@/lib/state/researchAtoms";

import { SynthesisReasoningModal } from "./modals/synthesis-reasoning-modal";
import { ReportDrafter } from "./report-drafter";
export function SynthesisReporting() {
  const [activeTab, setActiveTab] = useState("synthesis");
  const [showSynthesisReasoning, setShowSynthesisReasoning] = useState(false);
  const synthesis = useAtomValue(synthesisDetailsAtom);
  const researchSession = useAtomValue(researchSessionAtom);

  // Use accumulated topics if available, otherwise fall back to current session
  const allTopics =
    researchSession.accumulatedTopics.length > 0
      ? researchSession.accumulatedTopics
      : synthesis.topics;

  // Sort topics by timestamp (most recent first)
  const sortedTopics = [...allTopics].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return bTime - aTime;
  });

  const getConfidenceLabel = (confidence?: number): string => {
    if (!confidence) {
      return "Unknown";
    }
    if (confidence >= 80) {
      return `High (${confidence}%)`;
    }
    if (confidence >= 60) {
      return `Medium (${confidence}%)`;
    }
    return `Low (${confidence}%)`;
  };
  return (
    <div className="w-full overflow-y-auto bg-[#f8f9fa] p-4 md:w-1/3 dark:bg-[#171c2c]">
      <div className="mb-4">
        <h2 className="mb-4 font-semibold text-[#1a1f2e] text-lg dark:text-white">
          Synthesis & Reporting
        </h2>
        <div className="mb-4 flex border-[#e1e5eb] border-b dark:border-[#2a3148]">
          <button
            type="button"
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "synthesis" ? "border-[#3a7bb7] border-b-2 text-[#3a7bb7]" : "text-[#64748b] hover:text-[#4a5568] dark:text-[#94a3b8] dark:hover:text-[#e2e8f0]"}`}
            onClick={() => setActiveTab("synthesis")}
          >
            Synthesis Studio
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "report" ? "border-[#3a7bb7] border-b-2 text-[#3a7bb7]" : "text-[#64748b] hover:text-[#4a5568] dark:text-[#94a3b8] dark:hover:text-[#e2e8f0]"}`}
            onClick={() => setActiveTab("report")}
          >
            Report Drafter
          </button>
        </div>
      </div>
      {activeTab === "synthesis" ? (
        <div className="mb-6">
          <div className="mb-3">
            <div className="mb-2 flex cursor-pointer items-center justify-between">
              <h3 className="font-medium text-[#4a5568] text-sm dark:text-[#a0aec0]">
                Synthesized Topics{" "}
                {researchSession.accumulatedTopics.length > 0 &&
                  `(${sortedTopics.length} total)`}
              </h3>
              <ChevronRight size={16} className="text-[#a0aec0]" />
            </div>
            {sortedTopics.length > 0 ? (
              sortedTopics.map((topic, index) => (
                <div
                  key={topic.title || `topic-${index}`}
                  className="mb-3 rounded-lg border border-[#e1e5eb] bg-white p-4 dark:border-[#2a3148] dark:bg-[#1e2436]"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="flex-1 font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
                      {topic.title}
                    </h4>
                    {topic.timestamp && (
                      <div className="ml-2 text-[#64748b] text-xs dark:text-[#94a3b8]">
                        {new Date(topic.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                  <p className="mb-3 text-[#4a5568] text-xs dark:text-[#a0aec0]">
                    {topic.synthesisSnippet}
                    <span
                      className="ml-0.5 inline-block h-3 w-0.5 animate-caret-blink bg-[#4a5568] dark:bg-[#a0aec0]"
                      style={{
                        verticalAlign: "text-top",
                      }}
                    />
                  </p>
                  {topic.docIds && topic.docIds.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {topic.docIds.map((docId, docIndex) => (
                        <span
                          key={docId || `doc-${docIndex}`}
                          className="rounded bg-[#edf2f7] px-2 py-0.5 text-[#4a5568] text-[10px] dark:bg-[#242a3d] dark:text-[#a0aec0]"
                        >
                          [{docId}]
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center text-xs">
                    <span className="mr-1 text-[#4a5568] dark:text-[#a0aec0]">
                      Confidence:
                    </span>
                    <span className="font-medium text-[#3a7bb7]">
                      {getConfidenceLabel(topic.confidence)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="mb-3 rounded-lg border border-[#e1e5eb] bg-white p-4 dark:border-[#2a3148] dark:bg-[#1e2436]">
                <p className="text-[#4a5568] text-xs dark:text-[#a0aec0]">
                  No synthesis topics available yet. Topics will appear here as
                  analysis progresses.
                </p>
              </div>
            )}
          </div>
          <div className="mb-4">
            <h3 className="mb-2 font-medium text-[#4a5568] text-sm dark:text-[#a0aec0]">
              Unanswered Aspects:
            </h3>
            <div className="rounded-lg border border-[#e1e5eb] bg-white p-3 dark:border-[#2a3148] dark:bg-[#1e2436]">
              {synthesis.unansweredAspects &&
              synthesis.unansweredAspects.length > 0 ? (
                <ul className="list-disc pl-4 text-[#4a5568] text-xs dark:text-[#a0aec0]">
                  {synthesis.unansweredAspects.map((aspect, index) => (
                    <li
                      key={aspect || `aspect-${index}`}
                      className={
                        index < (synthesis.unansweredAspects?.length ?? 0) - 1
                          ? "mb-1"
                          : ""
                      }
                    >
                      {aspect}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#4a5568] text-xs dark:text-[#a0aec0]">
                  No unanswered aspects identified yet.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="flex items-center text-[#3a7bb7] text-xs hover:text-[#2c5d8a]"
            onClick={() => setShowSynthesisReasoning(true)}
          >
            <Brain size={12} className="mr-1" />
            View Synthesis Reasoning
          </button>
        </div>
      ) : (
        <ReportDrafter />
      )}
      <SynthesisReasoningModal
        isOpen={showSynthesisReasoning}
        onClose={() => setShowSynthesisReasoning(false)}
        synthesisData={synthesis}
        sourcesUsed={sortedTopics.flatMap(
          (topic) =>
            topic.docIds?.map((docId) => ({
              docId,
              title: topic.title,
              confidence: (topic.confidence || 0) / 100,
            })) || []
        )}
      />
    </div>
  );
}
