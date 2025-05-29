"use client";

import { useAtomValue } from "jotai";
import { Brain, ChevronRight } from "lucide-react";
import { useState } from "react";

import { synthesisDetailsAtom } from "@/lib/state/researchAtoms";

import { SynthesisReasoningModal } from "./modals/synthesis-reasoning-modal";
import { ReportDrafter } from "./report-drafter";
export function SynthesisReporting() {
    const [activeTab, setActiveTab] = useState("synthesis");
    const [showSynthesisReasoning, setShowSynthesisReasoning] = useState(false);
    const synthesis = useAtomValue(synthesisDetailsAtom);

    const getConfidenceLabel = (confidence?: number): string => {
        if (!confidence) return "Unknown";
        if (confidence >= 80) return `High (${confidence}%)`;
        if (confidence >= 60) return `Medium (${confidence}%)`;
        return `Low (${confidence}%)`;
    };
    return (
        <div className="bg-[#f8f9fa] dark:bg-[#171c2c] p-4 w-full md:w-1/3 overflow-y-auto">
            <div className="mb-4">
                <h2 className="mb-4 font-semibold text-[#1a1f2e] dark:text-white text-lg">
                    Synthesis & Reporting
                </h2>
                <div className="flex mb-4 border-[#e1e5eb] dark:border-[#2a3148] border-b">
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "synthesis" ? "border-b-2 border-[#3a7bb7] text-[#3a7bb7]" : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#4a5568] dark:hover:text-[#e2e8f0]"}`}
                        onClick={() => setActiveTab("synthesis")}
                    >
                        Synthesis Studio
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "report" ? "border-b-2 border-[#3a7bb7] text-[#3a7bb7]" : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#4a5568] dark:hover:text-[#e2e8f0]"}`}
                        onClick={() => setActiveTab("report")}
                    >
                        Report Drafter
                    </button>
                </div>
            </div>
            {activeTab === "synthesis" ? (
                <div className="mb-6">
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-2 cursor-pointer">
                            <h3 className="font-medium text-[#4a5568] dark:text-[#a0aec0] text-sm">
                                Synthesized Topics
                            </h3>
                            <ChevronRight
                                size={16}
                                className="text-[#a0aec0]"
                            />
                        </div>
                        {synthesis.topics.length > 0 ? (
                            synthesis.topics.map((topic, index) => (
                                <div
                                    key={topic.title || `topic-${index}`}
                                    className="bg-white dark:bg-[#1e2436] mb-3 p-4 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg"
                                >
                                    <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                                        {topic.title}
                                    </h4>
                                    <p className="mb-3 text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                        {topic.synthesisSnippet}
                                        <span
                                            className="inline-block bg-[#4a5568] dark:bg-[#a0aec0] w-0.5 h-3 ml-0.5 animate-caret-blink"
                                            style={{
                                                verticalAlign: "text-top",
                                            }}
                                        />
                                    </p>
                                    {topic.docIds &&
                                        topic.docIds.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {topic.docIds.map(
                                                    (docId, docIndex) => (
                                                        <span
                                                            key={
                                                                docId ||
                                                                `doc-${docIndex}`
                                                            }
                                                            className="bg-[#edf2f7] dark:bg-[#242a3d] px-2 py-0.5 rounded text-[#4a5568] text-[10px] dark:text-[#a0aec0]"
                                                        >
                                                            [{docId}]
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    <div className="flex items-center text-xs">
                                        <span className="mr-1 text-[#4a5568] dark:text-[#a0aec0]">
                                            Confidence:
                                        </span>
                                        <span className="font-medium text-[#3a7bb7]">
                                            {getConfidenceLabel(
                                                topic.confidence,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-[#1e2436] mb-3 p-4 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg">
                                <p className="text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                    No synthesis topics available yet. Topics
                                    will appear here as analysis progresses.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <h3 className="mb-2 font-medium text-[#4a5568] dark:text-[#a0aec0] text-sm">
                            Unanswered Aspects:
                        </h3>
                        <div className="bg-white dark:bg-[#1e2436] p-3 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg">
                            {synthesis.unansweredAspects &&
                            synthesis.unansweredAspects.length > 0 ? (
                                <ul className="pl-4 text-[#4a5568] dark:text-[#a0aec0] text-xs list-disc">
                                    {synthesis.unansweredAspects.map(
                                        (aspect, index) => (
                                            <li
                                                key={
                                                    aspect || `aspect-${index}`
                                                }
                                                className={
                                                    index <
                                                    (synthesis.unansweredAspects
                                                        ?.length ?? 0) -
                                                        1
                                                        ? "mb-1"
                                                        : ""
                                                }
                                            >
                                                {aspect}
                                            </li>
                                        ),
                                    )}
                                </ul>
                            ) : (
                                <p className="text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                    No unanswered aspects identified yet.
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="flex items-center text-[#3a7bb7] hover:text-[#2c5d8a] text-xs"
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
            />
        </div>
    );
}
