"use client";

import { Brain, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ReportDrafter } from "./ReportDrafter";
import { SynthesisReasoningModal } from "./modals/SynthesisReasoningModal";
export function SynthesisReporting() {
    const [activeTab, setActiveTab] = useState("synthesis");
    const [showSynthesisReasoning, setShowSynthesisReasoning] = useState(false);
    // Previously used for expanded topics - can be re-enabled when needed
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
                        <div className="bg-white dark:bg-[#1e2436] mb-3 p-4 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg">
                            <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                                Establishing &apos;Duty of Care&apos; in Negligence Claims
                            </h4>
                            <p className="mb-3 text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                Pre-existing duty of care considerations include
                                foreseeability, voluntariness, and special
                                relationships. Courts have consistently held
                                that professionals owe a heightened duty when
                                their services are specially sought
                                <span className="inline-block bg-[#a0aec0] w-1.5 h-4 animate-caret-blink" />
                            </p>
                            <div className="flex flex-wrap gap-1 mb-2">
                                <span className="bg-[#edf2f7] dark:bg-[#242a3d] px-2 py-0.5 rounded text-[#4a5568] text-[10px] dark:text-[#a0aec0]">
                                    [DocID-001]
                                </span>
                                <span className="bg-[#edf2f7] dark:bg-[#242a3d] px-2 py-0.5 rounded text-[#4a5568] text-[10px] dark:text-[#a0aec0]">
                                    [DocID-003]
                                </span>
                            </div>
                            <div className="flex items-center text-xs">
                                <span className="mr-1 text-[#4a5568] dark:text-[#a0aec0]">
                                    Confidence:
                                </span>
                                <span className="font-medium text-[#3a7bb7]">
                                    High
                                </span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1e2436] mb-3 p-3 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg">
                            <div className="flex justify-between items-center cursor-pointer">
                                <h4 className="font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                                    Contract Interpretation Standards
                                </h4>
                                <ChevronRight
                                    size={14}
                                    className="text-[#a0aec0]"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mb-4">
                        <h3 className="mb-2 font-medium text-[#4a5568] dark:text-[#a0aec0] text-sm">
                            Unanswered Aspects:
                        </h3>
                        <div className="bg-white dark:bg-[#1e2436] p-3 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg">
                            <ul className="pl-4 text-[#4a5568] dark:text-[#a0aec0] text-xs list-disc">
                                <li className="mb-1">
                                    Defining the threshold of causal connection
                                </li>
                                <li>
                                    State-by-state variations in force majeure
                                    standards
                                </li>
                            </ul>
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
