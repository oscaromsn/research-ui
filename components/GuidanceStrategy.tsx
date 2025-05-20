"use client";

import { AlertTriangle, Brain, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
export function GuidanceStrategy() {
    const [isAssessmentExpanded, setIsAssessmentExpanded] = useState(false);
    return (
        <div className="bg-[#f8f9fa] dark:bg-[#171c2c] p-4 border-[#e1e5eb] dark:border-[#2a3148] border-r w-full md:w-1/3 overflow-y-auto">
            <div className="mb-4">
                <h2 className="flex items-center mb-4 font-semibold text-[#1a1f2e] dark:text-white text-lg">
                    <span className="mr-2">Guidance & Strategy</span>
                </h2>
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Enter Legal Question or Research Topic"
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
                    <button
                        type="button"
                        className="bg-[#3a7bb7] hover:bg-[#2c5d8a] py-2 rounded-md w-full text-white text-sm transition-colors"
                    >
                        Start Research
                    </button>
                </div>
            </div>
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-[#4a5568] dark:text-[#a0aec0] text-sm">
                        Search Query Item
                    </h3>
                    <ChevronRight size={16} className="text-[#a0aec0]" />
                </div>
                <div className="bg-white dark:bg-[#1e2436] mb-3 p-4 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg">
                    <div className="mb-2 font-mono text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                        "contract breach" AND ("force majeure" OR
                        "impossibility") NEAR/5 "COVID-19"
                    </div>
                    <div className="mt-3">
                        <p className="mb-1 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                            Expected Information:
                        </p>
                        <ul className="pl-4 text-[#4a5568] dark:text-[#a0aec0] text-xs list-disc">
                            <li>Precedent cases and rulings</li>
                            <li>Applicable legal framework</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="mb-4">
                <div className="bg-white dark:bg-[#1e2436] p-4 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg">
                    <button
                        type="button"
                        className="w-full"
                        onClick={() =>
                            setIsAssessmentExpanded(!isAssessmentExpanded)
                        }
                    >
                        <div className="flex items-start mb-2">
                            <AlertTriangle
                                size={16}
                                className="flex-shrink-0 mt-0.5 mr-2 text-[#eab308]"
                            />
                            <div className="flex-1">
                                <h3 className="font-medium text-sm text-left">
                                    Agent Assessment{" "}
                                    <span className="text-[#eab308]">
                                        Further Action Needed ⚠️
                                    </span>
                                </h3>
                            </div>
                            <ChevronDown
                                size={16}
                                className={`text-[#64748b] dark:text-[#94a3b8] transform transition-transform ${isAssessmentExpanded ? "rotate-180" : ""}`}
                            />
                        </div>
                    </button>
                    <p className="mb-3 text-[#4a5568] dark:text-[#a0aec0] text-xs">
                        Current synthesis lacks sufficient case law from the 9th
                        Circuit regarding 'unforeseen circumstances'. Recommend
                        refining queries to target this jurisdiction.
                    </p>
                    {isAssessmentExpanded && (
                        <div className="mt-4 pt-4 border-[#e1e5eb] dark:border-[#2a3148] border-t">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="mb-2 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                        Suggested Actions:
                                    </h4>
                                    <ul className="space-y-2 text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                        <li className="flex items-start">
                                            <div className="bg-[#3a7bb7] mt-1.5 mr-2 rounded-full w-1.5 h-1.5" />
                                            Add "JURISDICTION: '9th Circuit'" to
                                            search parameters
                                        </li>
                                        <li className="flex items-start">
                                            <div className="bg-[#3a7bb7] mt-1.5 mr-2 rounded-full w-1.5 h-1.5" />
                                            Review cases from 2019-2023
                                            specifically addressing force
                                            majeure
                                        </li>
                                        <li className="flex items-start">
                                            <div className="bg-[#3a7bb7] mt-1.5 mr-2 rounded-full w-1.5 h-1.5" />
                                            Analyze district court
                                            interpretations of "unforeseen
                                            circumstances"
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="mb-2 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                        Impact on Analysis:
                                    </h4>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 bg-[#e2e8f0] dark:bg-[#2a3148] rounded-full h-1.5">
                                            <div className="bg-[#eab308] rounded-full w-[65%] h-full" />
                                        </div>
                                        <span className="text-[#eab308] text-xs">
                                            65%
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="flex items-center text-[#3a7bb7] hover:text-[#2c5d8a] text-xs"
                                >
                                    <Brain size={12} className="mr-1" />
                                    View Assessment Reasoning
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
